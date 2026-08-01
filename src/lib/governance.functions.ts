/**
 * Governance server functions — kill-switch, mission caps, stale approvals.
 * Backs the /_authenticated/governance UI and the AppShell paused indicator.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toolRisk } from "@/lib/tool-consequences";
import { HIGH_RISK_FORCE_REVIEW, HIGH_RISK_MIN_CONFIRM } from "@/lib/ai/trust-ramp";
import { executeApproval, type Json } from "@/lib/ai/loop.server";
import {
  summarizeAgentRecords,
  trackRecordsToObject,
  type AgentTrackRecord,
  type DecidedApprovalRow,
  summarizeAgentOutcomes,
  outcomeRecordsToObject,
  type AgentOutcomeRecord,
  type DecidedLearningRow,
} from "@/lib/agent-track-record";
import {
  summarizeRejections,
  type RejectionPattern,
  type RejectionRow,
} from "@/lib/rejection-learning";
import { resolveToolAccess } from "@/lib/ai/tools/defaults";
import {
  buildLedger,
  type LedgerApprovalRow,
  type LedgerGuardrailRow,
} from "@/lib/boundary-ledger";

/** Returns the current pause state for a workspace + recent in-flight missions + stale approvals. */
export const getGovernanceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Resolve workspace (fallback to default)
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }

    const [killState, systemRow, wsRow, runs, approvals] = await Promise.all([
      supabase.rpc("current_kill_state", { ws: workspaceId as unknown as string }),
      supabase.from("kill_switches").select("*").eq("scope", "system").maybeSingle(),
      workspaceId
        ? supabase
            .from("kill_switches")
            .select("*")
            .eq("scope", "workspace")
            .eq("workspace_id", workspaceId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("agent_runs")
        .select(
          "id,agent_slug,agent_name,status,tokens_used,spend_used_usd,mission_token_cap,mission_spend_cap_usd,halted_reason,created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("agent_approvals")
        .select("id,agent_slug,tool_name,status,escalation_state,expires_at,created_at,rationale")
        .eq("user_id", userId)
        .in("escalation_state", ["pending", "expired"])
        .order("expires_at", { ascending: true })
        .limit(50),
    ]);

    const ks = Array.isArray(killState.data) ? killState.data[0] : killState.data;
    return {
      workspaceId,
      killState:
        (ks as {
          system_paused?: boolean;
          workspace_paused?: boolean;
          reason?: string | null;
        } | null) ?? null,
      systemRow: systemRow.data ?? null,
      workspaceRow: wsRow.data ?? null,
      runs: runs.data ?? [],
      approvals: approvals.data ?? [],
    };
  });

const SetPauseSchema = z.object({
  workspaceId: z.string().uuid(),
  paused: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
});

/** Pause/unpause a workspace. Workspace owners/admins only (enforced by RLS). */
export const setWorkspacePause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SetPauseSchema>) => SetPauseSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("kill_switches")
      .select("id")
      .eq("scope", "workspace")
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("kill_switches")
        .update({
          paused: data.paused,
          reason: data.reason ?? null,
          set_by: userId,
          set_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("kill_switches").insert({
        scope: "workspace",
        workspace_id: data.workspaceId,
        paused: data.paused,
        reason: data.reason ?? null,
        set_by: userId,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Lightweight "is my workspace paused?" probe used by AppShell. */
export const getWorkspacePauseState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }
    const { data: state } = await supabase.rpc("current_kill_state", {
      ws: workspaceId as unknown as string,
    });
    const row = Array.isArray(state) ? state[0] : state;
    const r =
      (row as {
        system_paused?: boolean;
        workspace_paused?: boolean;
        reason?: string | null;
      } | null) ?? null;
    return {
      workspaceId,
      paused: !!(r?.system_paused || r?.workspace_paused),
      systemPaused: !!r?.system_paused,
      reason: r?.reason ?? null,
    };
  });

const ExtendApprovalSchema = z.object({
  approvalId: z.string().uuid(),
  additionalHours: z.number().int().min(1).max(168),
});

/** Extend a pending approval's TTL. */
export const extendApprovalTtl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExtendApprovalSchema>) => ExtendApprovalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const newExpiry = new Date(Date.now() + data.additionalHours * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("agent_approvals")
      .update({ expires_at: newExpiry, escalation_state: "pending" })
      .eq("id", data.approvalId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, expires_at: newExpiry };
  });

const ResolveApprovalSchema = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  // v6 Phase 0 / W3 — optional human note on the call (Appendix D: "Reject
  // (+reason)"). Persisted best-effort to agent_approvals.decision_reason.
  reason: z.string().max(2000).optional().nullable(),
});

/* ————— Ember Editorial (screen 5 · Govern) — additive exports only ————— */

/**
 * Mission concurrency cap. Mirrors MAX_RUNNING_PER_WORKSPACE in
 * src/lib/ai/loop.server.ts (not exported there — keep the two in sync).
 * When the workspace is at capacity, new goals land as status 'queued'.
 */
export const MISSION_CONCURRENCY_CAP = 5;

/**
 * Approvals queue for the Govern surface, enriched for the reference
 * ApprovalCard: mission title (for "in {mission}" + the Mission ↗ link),
 * a risk grade, and the real median human response time.
 *
 * Risk grade = the oversight mode the user configured for the tool in
 * agent_tools — production's own vocabulary (loop.server.ts names its
 * force-review set "HIGH_RISK"): review → high · confirm → medium ·
 * auto → low. No invented numbers; absent tools default to medium, the
 * loop's own default mode.
 */
export const listGovernApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // mission_id postdates the generated Supabase types — untyped client +
    // explicit row casts, the studio.functions.ts precedent.
    const db = supabase as unknown as SupabaseClient;
    type ApprovalRow = {
      id: string;
      agent_slug: string | null;
      tool_name: string;
      args: Json;
      rationale: string | null;
      status: string;
      escalation_state: string | null;
      expires_at: string | null;
      created_at: string;
      decided_at: string | null;
      error: string | null;
      mission_id: string | null;
    };
    // Pre-migration tolerant (the api/chat.ts precedent): mission_id lands
    // with 20260612100000 via the Lovable sync; until it applies, retry the
    // select without the column so the queue still renders.
    const baseColumns =
      "id,agent_slug,tool_name,args,rationale,status,escalation_state,expires_at,created_at,decided_at,error";
    let rows: Partial<ApprovalRow>[] | null = null;
    let error: { message: string } | null = null;
    ({ data: rows, error } = await db
      .from("agent_approvals")
      .select(`${baseColumns},mission_id`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50));
    if (error && /mission_id/.test(error.message)) {
      ({ data: rows, error } = await db
        .from("agent_approvals")
        .select(baseColumns)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50));
    }
    if (error) throw new Error(error.message);
    const approvals = (rows ?? []).map((a) => ({
      ...a,
      mission_id: a.mission_id ?? null,
    })) as ApprovalRow[];

    const missionIds = [
      ...new Set(approvals.map((a) => a.mission_id).filter((id): id is string => Boolean(id))),
    ];
    const toolNames = [...new Set(approvals.map((a) => a.tool_name))];
    const [missions, tools] = await Promise.all([
      missionIds.length
        ? supabase.from("missions").select("id,title").in("id", missionIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      // Effective modes, not stored rows: a tool this account never changed has
      // no row, and rendering its oversight as blank would understate what the
      // boundary actually is.
      toolNames.length
        ? supabase.from("agent_tools").select("tool_name,mode,enabled").eq("user_id", userId)
        : Promise.resolve({ data: [] as { tool_name: string; mode: string }[] }),
    ]);
    const titleOf = new Map<string, string>(
      (missions.data ?? []).map((m) => [m.id as string, m.title as string]),
    );
    const { TOOL_REGISTRY } = await import("@/lib/ai/tools/registry.server");
    const effectiveMode = new Map(
      resolveToolAccess(
        Object.keys(TOOL_REGISTRY),
        (tools.data ?? []) as Array<{
          tool_name: string;
          mode: string | null;
          enabled: boolean | null;
        }>,
      ).map((t) => [t.tool_name, { tool_name: t.tool_name, mode: t.mode as string }]),
    );
    const riskOf = new Map<string, "high" | "medium" | "low">(
      [...effectiveMode.values()].map((t) => [
        t.tool_name as string,
        (t.mode === "review" ? "high" : t.mode === "auto" ? "low" : "medium") as
          "high" | "medium" | "low",
      ]),
    );

    // Median human response time across decided approvals — real timestamps only.
    const waits = approvals
      .filter((a) => a.decided_at)
      .map((a) => new Date(a.decided_at as string).getTime() - new Date(a.created_at).getTime())
      .filter((ms) => Number.isFinite(ms) && ms >= 0)
      .sort((x, y) => x - y);
    const medianResponseMs = waits.length ? waits[Math.floor(waits.length / 2)] : null;

    // CORE-UX-TRUST: the per-agent track record, now surfaced HERE (the point of
    // decision moved off Today into Govern → Approvals). All-time decided rows for
    // the agents in this queue (RLS-scoped to the caller); honest, no fabricated
    // rollback metric. Reuses the same pure tally as the Today brief used.
    const agentSlugs = [
      ...new Set(approvals.map((a) => a.agent_slug).filter((s): s is string => Boolean(s))),
    ];
    // One decided-history fetch feeds BOTH the per-agent track record AND the
    // visible rejection-learning (rejected rows are decided rows). RLS-scoped; both
    // degrade to empty if the read errors (e.g. a missing column pre-migration).
    let trackByAgent: Record<string, AgentTrackRecord> = {};
    let rejectionsByKey: Record<string, RejectionPattern> = {};
    if (agentSlugs.length) {
      const { data: hist } = await db
        .from("agent_approvals")
        .select("agent_slug,tool_name,status,decision_reason,decided_at")
        .eq("user_id", userId)
        .in("agent_slug", agentSlugs)
        .not("decided_at", "is", null)
        .limit(1000);
      const histRows = hist ?? [];
      trackByAgent = trackRecordsToObject(summarizeAgentRecords(histRows as DecidedApprovalRow[]));
      rejectionsByKey = summarizeRejections(histRows as RejectionRow[]);
    }

    // RF-06: the OUTCOME record alongside the approval record — did this
    // agent's decided-on work actually turn out well, once real signal came
    // in (public.learnings), not just "did the human say yes". No FK exists
    // between learnings and decisions (both key off prd_id independently), so
    // this is two queries joined in JS, same idiom as titleOf/riskOf above.
    let outcomeByAgent: Record<string, AgentOutcomeRecord> = {};
    if (agentSlugs.length) {
      const { data: learningRows } = await db
        .from("learnings")
        .select("prd_id,verdict")
        .eq("user_id", userId)
        .in("verdict", ["validated", "missed"])
        .not("prd_id", "is", null)
        .limit(1000);
      const prdIds = [
        ...new Set(
          ((learningRows ?? []) as { prd_id: string | null; verdict: string | null }[])
            .map((l) => l.prd_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      if (prdIds.length) {
        const { data: decisionRows } = await db
          .from("decisions")
          .select("prd_id,decided_by_agent_slug")
          .eq("user_id", userId)
          .in("prd_id", prdIds);
        const slugByPrd = new Map<string, string>(
          (
            (decisionRows ?? []) as {
              prd_id: string | null;
              decided_by_agent_slug: string | null;
            }[]
          )
            .filter((d) => d.prd_id && d.decided_by_agent_slug)
            .map((d) => [d.prd_id as string, d.decided_by_agent_slug as string]),
        );
        const decidedLearningRows: DecidedLearningRow[] = (
          (learningRows ?? []) as { prd_id: string | null; verdict: string | null }[]
        ).map((l) => ({
          agent_slug: l.prd_id ? (slugByPrd.get(l.prd_id) ?? null) : null,
          verdict: l.verdict,
        }));
        outcomeByAgent = outcomeRecordsToObject(summarizeAgentOutcomes(decidedLearningRows));
      }
    }

    return {
      approvals: approvals.map((a) => ({
        ...a,
        mission_title: a.mission_id ? (titleOf.get(a.mission_id) ?? null) : null,
        risk: riskOf.get(a.tool_name) ?? "medium",
      })),
      trackByAgent,
      outcomeByAgent,
      rejectionsByKey,
      medianResponseMs,
    };
  });

/**
 * Resolve a pending approval. Approving also EXECUTES the tool — same
 * semantics as agent_loop's decideApproval, so every approval surface (Today
 * calls queue, governance, Studio) behaves identically. Audit finding: an
 * approve-without-execute left F-STUDIO's paused runs blocked forever
 * (status 'approved' never reaches 'executed', so the sweeper never resumes).
 */
export const resolveApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ResolveApprovalSchema>) => ResolveApprovalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("agent_approvals")
      .update({
        status: data.decision,
        escalation_state: "resolved",
        decided_at: new Date().toISOString(),
        decided_by: userId,
      })
      .eq("id", data.approvalId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    // Record the human's note on the call (Appendix D). Best-effort: the
    // decision_reason column lands via a Phase 0 migration — tolerate its
    // absence so the decision is never blocked before Lovable applies it.
    // `as never` escapes the pre-migration generated types without `any`.
    if (data.reason && data.reason.trim()) {
      try {
        await supabase
          .from("agent_approvals")
          .update({ decision_reason: data.reason.trim().slice(0, 2000) } as never)
          .eq("id", data.approvalId)
          .eq("user_id", userId);
      } catch {
        // missing column pre-migration — the decision stands without the note
      }
    }

    if (data.decision === "approved") {
      // executeApproval flips the row to executed/failed itself; its failure
      // is surfaced to the caller but the decision stays recorded.
      const result = await executeApproval(supabase, userId, data.approvalId);
      return { ok: true, executed: true, result: result as Json };
    }
    return { ok: true, executed: false };
  });

/* ------------------------------------------------------------------ *
 * The spend ceiling, made visible (2026-08-01)
 * ------------------------------------------------------------------ */

/**
 * The workspace's default ceiling on what one mission may spend.
 *
 * WHY THIS EXISTS. `resolveMissionSpendCap` has resolved this value on every
 * dispatch since the mission-caps fix, and `checkMissionCaps` enforces it
 * fail-closed before every model call. The enforcement is real. What was
 * missing was any way for a person to SEE or SET it: a repo-wide grep for
 * `default_mission_spend_cap_usd` outside the server returned nothing.
 *
 * That is not a cosmetic gap. `mission-caps.server.ts` says so itself, about
 * its own built-in number: "It is also a default the user never chose, which by
 * the governance canon's fourth floor makes it our decision rather than their
 * policy, so it must stay visible and changeable rather than quietly correct."
 * The engine asked for this surface and nothing built it.
 *
 * It matters most for the autonomy argument. GOVERNANCE-PRINCIPLE.md: arguing
 * for more agent autonomy without a ceiling is the one version of the story a
 * risk officer will refuse. The cap is not a brake on that story, it is what
 * makes it sayable.
 */
export const getWorkspaceSpendPolicy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // RLS plus the owner filter: this is a boundary, and only the person who
    // owns the workspace may read or move it.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id,default_mission_spend_cap_usd,default_track_spend_cap_usd")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (!ws)
      return {
        is_owner: false,
        cap_usd: null as number | null,
        is_default: true,
        track_cap_usd: null as number | null,
        track_is_default: true,
      };

    const raw = (ws as { default_mission_spend_cap_usd: number | string | null })
      .default_mission_spend_cap_usd;
    return {
      is_owner: true,
      // null here is a real answer, "this workspace has no ceiling", and it is
      // reported as such rather than folded into the built-in number. The UI
      // has to be able to say which of the two is true.
      cap_usd: raw === null ? null : Number(raw),
      // Whether the number in force is one a person chose, or ours.
      is_default: raw === null || raw === undefined,
      // THE CEILING ON A PIECE OF WORK, one level up from the run. A track walks
      // seven stations unattended with a crew at each, so this is the number
      // that actually bounds autonomous spend; the run cap bounds one dispatch.
      track_cap_usd: (() => {
        const t = (ws as { default_track_spend_cap_usd: number | string | null })
          .default_track_spend_cap_usd;
        return t === null || t === undefined ? null : Number(t);
      })(),
      track_is_default:
        (ws as { default_track_spend_cap_usd: number | null }).default_track_spend_cap_usd == null,
    };
  });

export const setWorkspaceSpendPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        // `null` is "no ceiling", and it is a deliberate human decision that
        // `resolveMissionSpendCap` obeys. It is separated from "not set" on
        // purpose; see that function's own note on the distinction.
        cap_usd: z.number().positive().max(100_000).nullable().optional(),
        /** The ceiling on one piece of work, end to end. Same null semantics. */
        track_cap_usd: z.number().positive().max(100_000).nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws) throw new Error("Only the workspace owner can move the spend ceiling.");

    // Only what was sent. `null` is a real value here ("no ceiling"), so the
    // two are distinguished by presence rather than by nullishness: writing an
    // absent field as null would silently clear the other ceiling.
    const patch: Record<string, number | null> = {};
    if ("cap_usd" in data) patch.default_mission_spend_cap_usd = data.cap_usd ?? null;
    if ("track_cap_usd" in data) patch.default_track_spend_cap_usd = data.track_cap_usd ?? null;
    if (!Object.keys(patch).length) return { ok: true, cap_usd: null, track_cap_usd: null };

    const { error } = await supabase.from("workspaces").update(patch).eq("id", ws.id);
    if (error) throw new Error(error.message);
    return { ok: true, cap_usd: data.cap_usd ?? null, track_cap_usd: data.track_cap_usd ?? null };
  });

/* ------------------------------------------------------------------ *
 * THE BOUNDARY (founder ruling 2026-08-01)
 * ------------------------------------------------------------------ */

/**
 * What your crew may do alone, what still needs you, and what nobody may do.
 *
 * WHY THIS EXISTS. GOVERNANCE-PRINCIPLE.md asks for it by name: "A new
 * first-class surface: the boundary. Where a person sets what agents may do
 * alone, what needs them, and what nobody may do. This is house rules plus tool
 * modes plus autonomy, which are today three separate settings sections."
 *
 * All of the machinery already existed and none of it had a home. `/govern`
 * redirects into four different Engine Room rooms (safety/controls,
 * safety/house-rules, safety/rules, spend/caps), so the answer to "what can my
 * agents do without me" was spread across four screens and a settings page, and
 * could not be read anywhere as one sentence.
 *
 * MARKET CONTEXT, and it is why this is a lead rather than a catch-up
 * (docs/design/REFERENCE-PATTERNS.md): every competitor keeps policy in a file.
 * Cursor's `permissions.json`, Claude Code's `settings.json`, Codex's
 * `config.toml`, VS Code's `chat.tools.terminal.autoApprove`. All of them are
 * text a developer edits once and never sees again, and **none of those products
 * shows, during a run, which policy allowed an action or which would have
 * stopped it.** Cursor went further and DEPRECATED per-action approval outright
 * in 3.5. The market has converged on policy-in-advance and left the surface
 * for it unbuilt.
 *
 * IT IS A READ OF THE REAL RESOLVER, NOT A SECOND OPINION. The buckets below
 * are computed from the same `toolRisk` floors the loop enforces, so this
 * surface cannot tell you an agent may do something the runtime would stop, or
 * the reverse. A boundary screen that disagrees with the engine is worse than
 * no boundary screen.
 */
export const getBoundary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Platform policy plus this account's overrides, never the stored rows
    // alone: those are only the deviations now, so selecting them directly
    // would render a boundary with nothing on it.
    const { loadAccountTools } = await import("@/lib/ai/tools/access.server");
    const rows = await loadAccountTools(supabase, userId);

    type Row = {
      // No id: a tool this account has never deviated from has no row at all,
      // so the boundary keys on the tool name like every other surface now.
      tool_name: string;
      display_name: string | null;
      description: string | null;
      category: string | null;
      mode: string | null;
      enabled: boolean | null;
    };

    const alone: BoundaryTool[] = [];
    const asks: BoundaryTool[] = [];
    const never: BoundaryTool[] = [];

    for (const raw of (rows ?? []) as Row[]) {
      const risk = toolRisk(raw.tool_name);
      // A floor is a thing this surface may show and must never let you lower.
      // Reported honestly per tool so the UI can explain WHY a control is not
      // offered, rather than silently rendering a disabled switch.
      const floor = HIGH_RISK_FORCE_REVIEW.has(raw.tool_name)
        ? ("review" as const)
        : HIGH_RISK_MIN_CONFIRM.has(raw.tool_name)
          ? ("confirm" as const)
          : null;

      const t: BoundaryTool = {
        name: raw.tool_name,
        label: raw.display_name ?? raw.tool_name,
        what: raw.description ?? null,
        category: raw.category ?? null,
        mode: (raw.mode ?? "confirm") as BoundaryTool["mode"],
        risk,
        floor,
      };

      if (raw.enabled === false || t.mode === "off") never.push(t);
      else if (t.mode === "auto") alone.push(t);
      else asks.push(t);
    }

    // The ceilings. Owner-scoped, and reported as absent rather than as zero
    // when the caller does not own the workspace.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id,default_mission_spend_cap_usd,default_track_spend_cap_usd")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    let paused = false;
    if (ws) {
      const { data: sw } = await supabase
        .from("kill_switches")
        .select("paused")
        .eq("scope", "workspace")
        .eq("workspace_id", ws.id)
        .maybeSingle();
      paused = Boolean((sw as { paused?: boolean } | null)?.paused);
    }

    const num = (v: number | string | null | undefined) =>
      v === null || v === undefined ? null : Number(v);
    const w = ws as {
      default_mission_spend_cap_usd?: number | string | null;
      default_track_spend_cap_usd?: number | string | null;
    } | null;

    return {
      alone,
      asks,
      never,
      isOwner: Boolean(ws),
      capUsd: num(w?.default_mission_spend_cap_usd),
      // The ceiling on a piece of work end to end. It is the one that actually
      // bounds unattended spend: a track walks seven stations with a crew at
      // each, and the run cap only ever bounded one dispatch of that.
      trackCapUsd: num(w?.default_track_spend_cap_usd),
      paused,
    };
  });

export type BoundaryTool = {
  /**
   * The tool's NAME is its identity here, and there is no row id.
   *
   * Under the platform-defaults model a tool this account has never changed has
   * no `agent_tools` row, so most of what this surface renders has no id to
   * carry. The name is stable, unique and the thing every writer keys on.
   */
  name: string;
  label: string;
  what: string | null;
  category: string | null;
  mode: "auto" | "confirm" | "review" | "off";
  risk: "low" | "medium" | "high";
  /** The lowest supervision this tool may ever have, or null if unconstrained. */
  floor: "confirm" | "review" | null;
};

/* ------------------------------------------------------------------ *
 * The declined ledger (2026-08-01)
 * ------------------------------------------------------------------ */

/** How far back the ledger looks. Long enough to show a pattern, short enough to stay true. */
const LEDGER_WINDOW_DAYS = 30;
/** Cap on rows read per source. The ledger is evidence, not an export. */
const LEDGER_LIMIT = 200;

/**
 * Every moment the boundary held: what an agent wanted, what stopped it, and
 * what happened next.
 *
 * WHY THIS IS THE SURFACE NOBODY ELSE HAS. Read the full reasoning in
 * src/lib/boundary-ledger.ts. The short version: every competitor shows what an
 * agent DID. None shows what it nearly did and didn't. In a product whose claim
 * is autonomy under policy, the near-misses are the only proof the policy is
 * real, and the record is what pays for the autonomy.
 *
 * BOTH HALVES OR NEITHER. `agent_approvals` is the boundary delegating (an
 * agent stopped and asked, costing an interruption) and `guardrail_hits` is the
 * boundary blocking (a rule matched and the content never travelled, costing
 * nothing). Showing only the first would read as "the product interrupts a
 * lot"; showing only the second would hide the interruption budget entirely.
 *
 * Both queries are RLS-scoped to the caller by user_id, and both are read-only.
 */
export const getDeclinedLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - LEDGER_WINDOW_DAYS * 86400_000).toISOString();

    const [approvalsRes, hitsRes] = await Promise.all([
      supabase
        .from("agent_approvals")
        .select("id,agent_slug,tool_name,rationale,status,created_at,decided_at,decision_reason")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(LEDGER_LIMIT),
      supabase
        .from("guardrail_hits")
        .select("id,rule_name,kind,action,side,created_at")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(LEDGER_LIMIT),
    ]);

    // A missing source degrades the ledger, it does not empty the page. Losing
    // guardrail rows must not hide the approvals a person is waiting on.
    const approvals = (approvalsRes.data ?? []) as LedgerApprovalRow[];
    const hits = (hitsRes.data ?? []) as LedgerGuardrailRow[];

    const events = buildLedger(approvals, hits);

    return {
      events,
      windowDays: LEDGER_WINDOW_DAYS,
      // Reported so the UI can say "the last 200" instead of implying it is all
      // of them. A truncated record presented as complete is the same defect
      // this whole surface exists to remove.
      truncated: approvals.length >= LEDGER_LIMIT || hits.length >= LEDGER_LIMIT,
      asked: events.filter((e) => e.kind === "asked").length,
      refused: events.filter((e) => e.kind === "refused").length,
      waiting: events.filter((e) => e.outcome === "waiting").length,
    };
  });
