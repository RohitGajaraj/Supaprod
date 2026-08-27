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
import { cleanTitle } from "@/components/plan/format";
import { claimApprovalDecision, executeApproval, type Json } from "@/lib/ai/loop.server";
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
import {
  buildLedger,
  type LedgerApprovalRow,
  type LedgerGuardrailRow,
} from "@/lib/boundary-ledger";
import {
  AUTONOMY_BOUNDS,
  AUTONOMY_COLUMNS,
  SHIPPED_AUTONOMY_POLICY,
  type AutonomyField,
  type AutonomyPolicy,
} from "@/lib/autonomy-policy";
import {
  asRole,
  canManageWorkspace,
  getUserWorkspaceRole,
  writeDeniedReason,
  type Role,
} from "@/lib/roles.functions";
import type { Database } from "@/integrations/supabase/types";

/* ------------------------------------------------------------------ *
 * WHICH WORKSPACE, AND WHO MAY MOVE IT (2026-08-05)
 * ------------------------------------------------------------------ */

/**
 * The workspace a governance surface is talking about.
 *
 * THE DEFECT THIS CLOSES. Every ceiling on this page used to find its workspace
 * with `.eq("owner_id", userId).limit(1)`, unordered and with no active-workspace
 * filter, while ENFORCEMENT finds it by id: `resolveMissionSpendCap` reads the
 * workspace the RUN carries (`.eq("id", workspaceId)`), and so does
 * `loadAutonomyPolicy`. A user who owns more than one workspace therefore read
 * and moved whichever row Postgres happened to hand back first, and the run
 * obeyed a different one. The product creates that second workspace itself —
 * `ensureDefaultWorkspace` plus the Explore path — so this is the ordinary case
 * rather than an edge one, and the symptom is the worst kind a spend control
 * has: the number on screen is not the number that binds.
 *
 * THE ORDER, each step a fallback for the one above it:
 *   1. What the caller said. A screen that knows its active workspace is the
 *      only party that can be right, so it wins outright.
 *   2. `current_user_default_workspace()` — the same function every governed
 *      table defaults `workspace_id` to and the same one `getMyWorkspaceRole`
 *      falls back to. Using it here means the role we check and the ceiling we
 *      move are read in ONE workspace, which is the point of the whole helper.
 *   3. The oldest live workspace this user owns. The old behaviour, kept so the
 *      callers this change cannot reach still get an answer, but ordered and
 *      with deleted rows excluded so it stops being a coin toss.
 */
async function resolveGovernedWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;

  const { data: fallback } = await supabase.rpc("current_user_default_workspace");
  if (fallback) return fallback as unknown as string;

  const { data: owned } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (owned as { id: string } | null)?.id ?? null;
}

/**
 * WHY THE CEILING ON `workspaces` IS NOT THE `spend_caps` SURFACE.
 *
 * `GOVERNED_WRITES.spend_caps` is owner, admin or member, and that is exactly
 * right for the two tables it mirrors: `ai_budgets` and `ai_surface_budgets`
 * name those three roles in their policies (migration 20260805130000 §4). But
 * `default_mission_spend_cap_usd`, `default_track_spend_cap_usd` and the
 * autonomy bars are COLUMNS ON `workspaces`, whose write policy has been
 * `has_workspace_role(id, [owner, admin])` since 20260619210000 and which
 * 20260805130000 deliberately left alone.
 *
 * So gating these writes on `spend_caps` would wave a member through a check
 * the database then refuses by matching zero rows. A check that disagrees with
 * the policy is worse than no check, because the person believes it. This asks
 * the question the database asks.
 *
 * The sentence is word for word what `writeDeniedReason` produces for a
 * two-role surface, so refusals across the app stay one voice. Exported so it
 * can be pinned by a test without a database, like `guardrailWriteDenial`.
 */
export function workspaceRowWriteDenial(role: Role | null | undefined): string | null {
  if (canManageWorkspace(role)) return null;
  return role
    ? `Your role here is ${role}. Only owner or admin can change this.`
    : "You are not a member of this workspace, so only owner or admin can change this.";
}

/** Said when no workspace could be resolved at all. Distinct from "not allowed". */
const NO_WORKSPACE = "We could not tell which workspace this belongs to, so nothing changed.";

/**
 * Refuse a write to the workspace row BEFORE attempting it, in a sentence a
 * person can act on. Mirrors the live policy exactly; the database remains the
 * thing that binds, and this is defence in depth plus readable copy.
 */
async function assertCanWriteWorkspaceRow(
  supabase: SupabaseClient<Database>,
  workspaceId: string | null,
  userId: string,
): Promise<void> {
  if (!workspaceId) throw new Error(NO_WORKSPACE);
  const role = asRole(await getUserWorkspaceRole(supabase, workspaceId, userId));
  const denial = workspaceRowWriteDenial(role);
  if (denial) throw new Error(denial);
}

/**
 * Said when a governed write RAN and the database returned no row.
 *
 * We cannot tell a policy refusal apart from a row somebody removed a moment
 * earlier: both come back as zero rows and PostgREST does not say which. So
 * this states the uncertainty rather than picking one, and the call sites throw
 * it instead of returning ok:true for a write they cannot vouch for. Same
 * ruling as `guardrails.functions.ts`.
 */
function unconfirmedWrite(what: string): string {
  return `We could not confirm ${what}. Reload the page and check it before relying on it.`;
}

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

/**
 * Pause/unpause a workspace. Owner or admin, which is what the `kill_switches`
 * policies have always required and what `GOVERNED_WRITES.kill_switches` says.
 *
 * The role is asked here as well as in the database so a refusal arrives as a
 * sentence rather than as silence, and both writes end in `.select()` for the
 * reason the update half makes unavoidable: RLS refuses an UPDATE by matching
 * zero rows, not by raising, so without it a viewer pressing Pause got ok:true
 * back and a workspace that kept running. A pause that reports success and did
 * not happen is the single most dangerous lie this file can tell.
 */
export const setWorkspacePause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SetPauseSchema>) => SetPauseSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const role = asRole(await getUserWorkspaceRole(supabase, data.workspaceId, userId));
    const denial = writeDeniedReason(role, "kill_switches");
    if (denial) throw new Error(denial);

    const { data: existing } = await supabase
      .from("kill_switches")
      .select("id")
      .eq("scope", "workspace")
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();

    if (existing) {
      const { data: written, error } = await supabase
        .from("kill_switches")
        .update({
          paused: data.paused,
          reason: data.reason ?? null,
          set_by: userId,
          set_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id");
      if (error) throw new Error(error.message);
      if (!written || written.length === 0) {
        throw new Error(
          unconfirmedWrite(data.paused ? "that this workspace is paused" : "that it is running"),
        );
      }
    } else {
      const { data: written, error } = await supabase
        .from("kill_switches")
        .insert({
          scope: "workspace",
          workspace_id: data.workspaceId,
          paused: data.paused,
          reason: data.reason ?? null,
          set_by: userId,
        })
        .select("id");
      if (error) throw new Error(error.message);
      if (!written || written.length === 0) {
        throw new Error(
          unconfirmedWrite(data.paused ? "that this workspace is paused" : "that it is running"),
        );
      }
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

/**
 * Run statuses that mean the work behind a gate is STILL LIVE.
 *
 * AN ALLOWLIST, AND THE DIRECTION IS THE WHOLE POINT. The obvious way to write
 * this is a set of FINISHED statuses to refuse on, and that version fails open
 * on everything it forgot. It was drafted that way — `{completed, failed,
 * halted, cancelled}` — and the set omitted `completed_with_failures`, which is
 * 452 of 1,135 runs, 40% of every run ever recorded and the second most common
 * outcome in the table (census at `ai/mission-advance.server.ts`). It also
 * omitted `complete` and included `cancelled`, of which there are none. So the
 * guard would have waved through the ordinary case and blocked a case that does
 * not occur.
 *
 * `agent_runs.status` has NO check constraint — it is plain text with a default
 * — so nothing downstream catches a status this file has never heard of. An
 * allowlist of live states makes an unknown status REFUSE rather than proceed,
 * which is the correct direction for a guard to fail when it is surprised. Same
 * inversion, same reasoning, as gate 4 in `decision-gate.ts`.
 *
 * The three members are the only non-terminal writes in `ai/loop.server.ts`:
 * `queued` (enqueued, not yet picked up), `running`, and `waiting_approval`
 * (which is the state a gate being extended is normally in).
 */
export const LIVE_RUN_STATUSES = new Set(["queued", "running", "waiting_approval"]);

/**
 * Put an approval back on the clock.
 *
 * THE DEFECT THIS CLOSES. `approvals-tick` expires a gate by writing BOTH
 * `escalation_state = 'expired'` AND `status = 'expired'` in one update, and
 * every queue that asks whether a call is still waiting on a human asks
 * `status`: `countNeedsYouCalls` and `getNeedsYou` (`.eq("status","pending")`),
 * the queue in `approvals-queue.functions.ts` (`a.status === "pending"`), and
 * this button's own panel (`ApprovalsPanel`, `.filter((a) => a.status ===
 * "pending")`). This write moved `expires_at` and `escalation_state` and left
 * `status` on 'expired', so the extension was written, reported success, and
 * the call still did not come back to any queue.
 *
 * Nothing could repair it afterwards either, which is what made it permanent:
 * the sweeper's expiry pass only re-reads `status='pending'` rows, and
 * `needsEscalationResolve` only clears a DECIDED row. So the gate was never
 * listed, never re-expired, and never resolved. It is the day's recurring
 * shape once more — the writer and the reader were looking at two different
 * columns.
 *
 * WHAT IT WILL NOT REVIVE, both refusing in a sentence rather than reporting a
 * success the person cannot see anywhere:
 *
 *   * A call somebody already answered. `decideApproval` has no re-decide
 *     guard of its own — it sets `status='approved'` and calls
 *     `executeApproval` unconditionally — so reviving a decided row would run
 *     its tool a SECOND time. The `decided_at` test is what stands between an
 *     extension and a duplicate side effect.
 *   * A call whose run is over, because approving that gate would run a tool
 *     with nothing left to run into.
 *
 * The update repeats both conditions as WHERE clauses rather than trusting the
 * read, so a row that changes underneath between the two statements is refused
 * by the database rather than by a check that raced, and `.select("id")` makes
 * an empty result an error instead of a silent no-op.
 */
export const extendApprovalTtl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExtendApprovalSchema>) => ExtendApprovalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: row } = await supabase
      .from("agent_approvals")
      .select("id,status,decided_at,run_id")
      .eq("id", data.approvalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) throw new Error("We could not find that call, so nothing changed.");
    if (row.decided_at || (row.status !== "pending" && row.status !== "expired")) {
      throw new Error(
        `You already answered this call (${row.status}), so it cannot go back on the clock.`,
      );
    }
    if (row.run_id) {
      const { data: run } = await supabase
        .from("agent_runs")
        .select("status")
        .eq("id", row.run_id)
        .maybeSingle();
      // A run we cannot read is refused, not waved through. RLS on agent_runs
      // is `auth.uid() = user_id AND is_workspace_member(workspace_id)`, so a
      // null here means either the row is gone or this person cannot see it,
      // and neither is a reason to put a tool back in front of them.
      if (!run || !LIVE_RUN_STATUSES.has(String(run?.status ?? ""))) {
        throw new Error(
          run
            ? `The run this call belonged to is ${run.status}, so there is nothing left to unblock.`
            : "We could not read the run this call belonged to, so it stays off the clock.",
        );
      }
    }

    const newExpiry = new Date(Date.now() + data.additionalHours * 60 * 60 * 1000).toISOString();
    const { data: written, error } = await supabase
      .from("agent_approvals")
      .update({
        expires_at: newExpiry,
        escalation_state: "pending",
        // THE COLUMN THE QUEUES ACTUALLY READ. Without this line the new clock
        // is real in the database and invisible on every surface.
        status: "pending",
        // The sweeper's "Auto-expired after TTL" note stops being true of a
        // call that is waiting again, and the card renders it as a live error.
        error: null,
      })
      .eq("id", data.approvalId)
      .eq("user_id", userId)
      .is("decided_at", null)
      .in("status", ["pending", "expired"])
      .select("id");
    if (error) throw new Error(error.message);
    if (!written || written.length === 0) {
      throw new Error(unconfirmedWrite("that it is back on the clock"));
    }
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
    // Cleaned HERE, at the one place mission titles enter this module, rather
    // than at each place they leave it. This map feeds ApprovalsPanel (two
    // lines) and VerifyCockpit (two more), and every one of those four rendered
    // the raw "[auto] " marker. Stripping at the source closes all four and any
    // consumer added later, which is the failure mode the audit actually found:
    // the strip and the leak keep turning up as neighbouring lines.
    const titleOf = new Map<string, string>(
      (missions.data ?? []).map((m) => [m.id as string, cleanTitle(m.title as string)]),
    );
    /*
     * THE APPROVALS QUEUE CALLED A SUPERVISION SETTING A RISK, AND UNDERSTATED
     * FOURTEEN TOOLS BY DOING IT.
     *
     * This used to build `riskOf` by relabelling the effective mode:
     *
     *     mode === "review" ? "high" : mode === "auto" ? "low" : "medium"
     *
     * which is not an assessment of anything. It is how closely a person
     * decided to watch the tool, wearing the word for how hard the tool is to
     * undo. ApprovalsPanel renders it as both: "High risk" in the chip, and
     * `RISK_NOTE` underneath saying what it would touch -- "Stays in this
     * workspace, and you can undo it" for low, "Hard to walk back" for high.
     *
     * Measured across the 74 registered tools, 23 got the wrong word and 14 of
     * those were understated. `studio.commit`, `studio.pr.merge`,
     * `studio.revert`, `release.publish` and `agent.spawn` all seed to `confirm`
     * and were therefore reported "medium", which prints "Reaches outside, and
     * it can be walked back" beside a merge. `toolRisk` calls all five high.
     * A person deciding an approval was being told an irreversible act is
     * reversible, on the screen where they decide it.
     *
     * `toolRisk` is the same function the loop's own gate calls, and it fails
     * closed to "high" for a tool it does not know, so a tool added tomorrow
     * over-warns rather than under-warns. The mode is still on this row under
     * its own name; nothing was lost by taking the word back.
     */

    // Median human response time across decided approvals — real timestamps only.
    const waits = approvals
      .filter((a) => a.decided_at)
      .map((a) => new Date(a.decided_at as string).getTime() - new Date(a.created_at).getTime())
      .filter((ms) => Number.isFinite(ms) && ms >= 0)
      .sort((x, y) => x - y);
    const medianResponseMs = waits.length ? waits[Math.floor(waits.length / 2)] : null;

    /*
     * ── IS THE WORK BEHIND EACH PENDING GATE STILL LIVE? (F-128) ───────────
     *
     * One query for the whole queue rather than one per row. Only PENDING gates
     * are asked about: a decided approval's run status changes nothing a person
     * can act on, and the queue is the only reader of this field.
     *
     * `waiting_approval` and `halted` are LIVE. A run halted at a gate is
     * precisely the run this approval exists to release, and calling it finished
     * would hide the one gate that still matters. `completed`,
     * `completed_with_failures` and `failed` are over: whatever this approval
     * was holding has stopped either way, and "it failed" is not a reason to
     * keep promising that approving will unblock it.
     *
     * A FAILED LOOKUP LEAVES EVERY GATE AT null, not at false. Saying "the work
     * behind this has finished" on the strength of a query we could not run is
     * the F-76 shape on a surface built to tell people the truth about what
     * needs them.
     */
    const LIVE_RUN_STATUSES = new Set(["waiting_approval", "halted"]);
    const pendingMissionIds = [
      ...new Set(
        approvals
          .filter((a) => a.status === "pending" && a.mission_id)
          .map((a) => a.mission_id as string),
      ),
    ];
    const liveByMission = new Map<string, boolean>();
    if (pendingMissionIds.length > 0) {
      const { data: runRows, error: runErr } = await db
        .from("agent_runs")
        .select("mission_id,status,created_at")
        .in("mission_id", pendingMissionIds)
        .order("created_at", { ascending: false });
      if (runErr) {
        console.error(
          `approvals queue: run status unreadable, gates left unknown: ${runErr.message}`,
        );
      } else {
        for (const r of (runRows ?? []) as Array<{ mission_id: string; status: string }>) {
          // Newest first, so the first row seen for a mission is the current one.
          if (!liveByMission.has(r.mission_id)) {
            liveByMission.set(r.mission_id, LIVE_RUN_STATUSES.has(r.status));
          }
        }
      }
    }

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
    // this is two queries joined in JS, same idiom as titleOf above.
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
        risk: toolRisk(a.tool_name),
        /*
         * ── F-128: 22 OF 29 PENDING GATES HELD WORK THAT HAD ALREADY FINISHED ──
         *
         * S1 measured `/approvals` against the database. The screen says
         * *"52 decisions are ready for you"*, and each row promises
         * *"Approve · unblocks Build for this spec"*. For 22 of the 29 pending
         * tool-call gates, **the run they held is over**, so approving cannot
         * unblock anything. Seven more (`memory.promote`) have no `agent_runs`
         * row at all. None is past its expiry, so nothing will ever clear them,
         * and the youngest is 33 days old.
         *
         * That is the founder's own bar failing on the one surface whose entire
         * job is telling a person what needs them: a screen implying work that is
         * not real.
         *
         * AGE CANNOT CARRY IT, which is why this is a field rather than a
         * heuristic S1 could compute. A 33-day-old call whose run is still queued
         * is genuinely waiting; one whose run finished is not; and `created_at`
         * cannot tell them apart.
         *
         * THREE STATES, NOT TWO, and the null is load-bearing. `false` means "we
         * looked and the work is over". `null` means "we cannot say" — no
         * mission on the approval, or no run row for that mission — and those
         * seven `memory.promote` rows are exactly that case. Collapsing them
         * would tell a person the work had finished when nothing ever started.
         */
        gatesLiveWork: a.mission_id ? (liveByMission.get(a.mission_id) ?? null) : null,
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
    /* THE DECISION IS A CLAIM, NOT A STAMP.
     *
     * This write used to be filtered by id and user alone, with no `.select()`,
     * which made "I decided this" and "someone decided this two seconds ago"
     * the same observable outcome, because supabase-js resolves a zero-row write as
     * `{ data: null, error: null }`. Approving also EXECUTES, so two people
     * answering the same call in two tabs (this panel and the /approvals queue)
     * produced two runs of the tool: studio.pr.merge merged the customer's PR
     * twice, delegate.openhands dispatched a second paid external job.
     *
     * Losing this race is ORDINARY. The surface refreshes and shows the
     * decision that stands; nothing is thrown, because nobody did anything
     * wrong by answering a call that had just been answered. */
    const claim = await claimApprovalDecision(supabase, userId, data.approvalId, data.decision);
    if (!claim.claimed) {
      return { ok: true, executed: false, already_decided: true, result: null as Json | null };
    }

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
      // is surfaced to the caller but the decision stays recorded. It takes its
      // OWN claim before running the tool, so winning the decision above is not
      // mistaken for permission to run.
      const result = await executeApproval(supabase, userId, data.approvalId);
      return { ok: true, executed: true, already_decided: false, result: result as Json };
    }
    return { ok: true, executed: false, already_decided: false, result: null as Json | null };
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
const SpendPolicyReadSchema = z
  .object({ workspaceId: z.string().uuid().nullable().optional() })
  .strip();

/** The answer when there is no workspace to read, or none this caller may see. */
type SpendPolicy = {
  /**
   * DEPRECATED NAME, KEPT ON PURPOSE. It no longer means "you own this row"; it
   * means "you may move this ceiling", which is the question the two screens
   * reading it were really asking. They gate the whole ceiling block on it, so
   * while it answered ownership an ADMIN — who the database has always let write
   * this row — saw no ceiling at all. Prefer `can_edit`; this field goes when
   * both routes have moved to it.
   */
  is_owner: boolean;
  /** May this caller move the ceiling? The same predicate the database enforces. */
  can_edit: boolean;
  /** The caller's role here, so a surface can say WHY rather than just hide. */
  role: Role | null;
  /** Which workspace answered. The whole defect was not knowing. */
  workspace_id: string | null;
  cap_usd: number | null;
  is_default: boolean;
  track_cap_usd: number | null;
  track_is_default: boolean;
};

export const getWorkspaceSpendPolicy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SpendPolicyReadSchema> | undefined) =>
    SpendPolicyReadSchema.parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<SpendPolicy> => {
    const { supabase, userId } = context;
    // WHICH workspace, asked once and answered the way enforcement answers it.
    // A caller that knows its active workspace passes the id; see
    // resolveGovernedWorkspace for why the old owner-scoped guess was wrong.
    const workspaceId = await resolveGovernedWorkspace(supabase, userId, data.workspaceId);
    const nothing: SpendPolicy = {
      is_owner: false,
      can_edit: false,
      role: null,
      workspace_id: null,
      cap_usd: null,
      is_default: true,
      track_cap_usd: null,
      track_is_default: true,
    };
    if (!workspaceId) return nothing;

    // Read by id, exactly as resolveMissionSpendCap does, so the number shown
    // and the number enforced come from the same row. RLS still decides whether
    // this caller may see it: `ws members read` is SELECT for any member, so a
    // viewer reads the ceiling and simply cannot move it.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id,default_mission_spend_cap_usd,default_track_spend_cap_usd")
      .eq("id", workspaceId)
      .maybeSingle();

    if (!ws) return nothing;

    // Role, not ownership. The database gates this row on owner-or-admin, so an
    // admin gets the control and a member and a viewer read it without one.
    const role = asRole(await getUserWorkspaceRole(supabase, workspaceId, userId));
    const canEdit = canManageWorkspace(role);

    const raw = (ws as { default_mission_spend_cap_usd: number | string | null })
      .default_mission_spend_cap_usd;
    return {
      is_owner: canEdit,
      can_edit: canEdit,
      role,
      workspace_id: workspaceId,
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
        /**
         * The workspace whose ceiling this is. Optional so the callers this
         * change cannot reach keep working, but a screen that knows its active
         * workspace MUST send it: resolving one server-side means the ceiling
         * you moved may not be the ceiling that binds the run you are watching,
         * which is the exact defect this parameter exists to end.
         */
        workspaceId: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const workspaceId = await resolveGovernedWorkspace(supabase, userId, data.workspaceId);
    // Role, not ownership: `workspaces` is gated on owner-or-admin, and an
    // admin who could always make this change was being turned away by us.
    await assertCanWriteWorkspaceRow(supabase, workspaceId, userId);

    // Only what was sent. `null` is a real value here ("no ceiling"), so the
    // two are distinguished by presence rather than by nullishness: writing an
    // absent field as null would silently clear the other ceiling.
    const patch: Record<string, number | null> = {};
    if ("cap_usd" in data) patch.default_mission_spend_cap_usd = data.cap_usd ?? null;
    if ("track_cap_usd" in data) patch.default_track_spend_cap_usd = data.track_cap_usd ?? null;
    if (!Object.keys(patch).length) return { ok: true, cap_usd: null, track_cap_usd: null };

    // `.select()` is load-bearing. A write refused by RLS RESOLVES rather than
    // throwing, so without it this handler returned ok:true for a ceiling that
    // never moved, and the receipt on screen told the person their spend was
    // bounded at a number nothing enforces.
    const { data: written, error } = await supabase
      .from("workspaces")
      .update(patch)
      .eq("id", workspaceId as string)
      .select("id");
    if (error) throw new Error(error.message);
    if (!written || written.length === 0) {
      throw new Error(unconfirmedWrite("that the ceiling moved"));
    }
    return {
      ok: true,
      workspace_id: workspaceId,
      cap_usd: data.cap_usd ?? null,
      track_cap_usd: data.track_cap_usd ?? null,
    };
  });

/* ------------------------------------------------------------------ *
 * The two bars the platform crosses on its own (2026-08-02)
 * ------------------------------------------------------------------ */

/**
 * Where this workspace puts the promotion bar and the settle-or-ask bar.
 *
 * WHY IT IS A WRITE AND NOT JUST A READ. Both numbers were constants, and the
 * governance canon's fourth floor is explicit that a default the user never set
 * is our choice rather than their policy, so it has to be visible AND
 * changeable. One of them decides when a cluster of evidence starts spending
 * money with nobody watching; the other decides when an agent puts a verdict on
 * a shipped bet instead of asking. Neither is a number a product should keep to
 * itself.
 *
 * Owner-scoped, like every other ceiling on this surface: a boundary is the
 * accountable person's to move.
 *
 * NULL IS A REAL VALUE AND IT MEANS "USE YOURS", not "allow nothing". Clearing
 * a field puts the shipped default back, which is why the resolver falls back
 * per field rather than per row.
 */
export const setWorkspaceAutonomyPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        minFrequency: z
          .number()
          .int()
          .min(AUTONOMY_BOUNDS.minFrequency.min)
          .max(AUTONOMY_BOUNDS.minFrequency.max)
          .nullable()
          .optional(),
        minSeverity: z
          .number()
          .int()
          .min(AUTONOMY_BOUNDS.minSeverity.min)
          .max(AUTONOMY_BOUNDS.minSeverity.max)
          .nullable()
          .optional(),
        minConfidence: z
          .number()
          .min(AUTONOMY_BOUNDS.minConfidence.min)
          .max(AUTONOMY_BOUNDS.minConfidence.max)
          .nullable()
          .optional(),
        settleFloor: z
          .number()
          .min(AUTONOMY_BOUNDS.settleFloor.min)
          .max(AUTONOMY_BOUNDS.settleFloor.max)
          .nullable()
          .optional(),
        settleStakesSpan: z
          .number()
          .min(AUTONOMY_BOUNDS.settleStakesSpan.min)
          .max(AUTONOMY_BOUNDS.settleStakesSpan.max)
          .nullable()
          .optional(),
        neverSettleAboveImpact: z
          .number()
          .int()
          .min(AUTONOMY_BOUNDS.neverSettleAboveImpact.min)
          .max(AUTONOMY_BOUNDS.neverSettleAboveImpact.max)
          .nullable()
          .optional(),
        /** Same story as the spend ceiling: the surface that knows must say. */
        workspaceId: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const workspaceId = await resolveGovernedWorkspace(supabase, userId, data.workspaceId);
    // Owner or admin, which is `GOVERNED_WRITES.autonomy_policy` and is also
    // what the live `workspaces` policy asks. The old check asked ownership and
    // so turned away the admin the policy admits.
    await assertCanWriteWorkspaceRow(supabase, workspaceId, userId);

    // Only what was sent. `null` clears a field back to the shipped default, so
    // presence and nullishness mean different things and writing an absent
    // field as null would silently reset a boundary nobody touched.
    const patch: Record<string, number | null> = {};
    for (const field of Object.keys(AUTONOMY_COLUMNS) as AutonomyField[]) {
      if (field in data) patch[AUTONOMY_COLUMNS[field]] = data[field] ?? null;
    }
    if (!Object.keys(patch).length) return { ok: true };

    // `.select()` for the same reason the ceiling needs it: a refused UPDATE
    // comes back as zero rows and no error, and these two bars decide what
    // happens with nobody watching. Reporting a bar that did not move is worse
    // than refusing to move it.
    const db = supabase as unknown as SupabaseClient;
    const { data: written, error } = await db
      .from("workspaces")
      .update(patch)
      .eq("id", workspaceId as string)
      .select("id");
    if (error) throw new Error(error.message);
    if (!written || written.length === 0) {
      throw new Error(unconfirmedWrite("that the bar moved"));
    }
    return { ok: true, workspace_id: workspaceId };
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
  .inputValidator((d: z.input<typeof SpendPolicyReadSchema> | undefined) =>
    SpendPolicyReadSchema.parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
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

    /*
     * WHAT ACTUALLY HAPPENS, NOT WHAT IS STORED, AND THIS IS THE WHOLE POINT OF
     * THE SCREEN.
     *
     * The stored mode is a seed. The loop does not run it. `resolveToolMode`
     * composes the seed with the agent's trust arc and then the safety floors,
     * and on the arc every agent in this database is on the two answers are not
     * close. Executed against the real resolver over the 74 registered tools:
     *
     *   stored          52 auto · 21 confirm · 1 review
     *   trusted arc     68 auto ·  4 confirm · 2 review
     *
     * So the headline "your crew does N of M things without asking" was
     * answering 52 of 74 when the truth is 68, and the sixteen it left out
     * include `studio.commit`, `studio.revert` and `release.publish`. An
     * UNDER-REPORT is the direction that gets someone hurt: a person reads that
     * a tool comes to them first, and it does not.
     *
     * THE ARC IS PER AGENT AND THIS SCREEN IS PER WORKSPACE, so it takes the
     * LOOSEST arc present. The question the page answers is "what can these
     * agents do without asking me", and the answer is yes if ANY of them can.
     * Taking the strictest, or an average, would report a boundary no agent
     * actually has. With no rows at all it uses `trusted`, because that is what
     * `loadAgentArc` hands a run with no row -- founder ruling SW-7, autonomous
     * by default -- and inventing a stricter default here would print a
     * reassurance the loop does not honour.
     *
     * `contractApproved: false` is the reading before any plan is approved. On
     * `trusted` and `ambient` it changes nothing at all; on `proving` it moves
     * five tools, so this reports the floor of what runs unattended rather than
     * the ceiling. That is the one place the number can still be conservative,
     * and it is stated on the surface rather than hidden here.
     */
    const { resolveToolMode } = await import("@/lib/ai/loop.server");
    const ARC_LOOSENESS = { observing: 0, proving: 1, trusted: 2, ambient: 3 } as const;
    type ArcName = keyof typeof ARC_LOOSENESS;
    const { data: arcRows } = await supabase
      .from("agent_autonomy")
      .select("arc")
      .eq("user_id", userId);
    const arc: ArcName = ((arcRows ?? []) as { arc: string | null }[]).reduce<ArcName>(
      (loosest, r) => {
        const a = r.arc as ArcName;
        if (!(a in ARC_LOOSENESS)) return loosest;
        return ARC_LOOSENESS[a] > ARC_LOOSENESS[loosest] ? a : loosest;
      },
      "trusted",
    );

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

      const mode = (raw.mode ?? "confirm") as BoundaryTool["mode"];
      /* `off` is not a mode the resolver knows: it means the tool is not offered
         at all, so there is nothing for an arc to loosen. */
      const runsAs = mode === "off" ? "off" : resolveToolMode(raw.tool_name, mode, arc, false);

      const t: BoundaryTool = {
        name: raw.tool_name,
        label: raw.display_name ?? raw.tool_name,
        what: raw.description ?? null,
        category: raw.category ?? null,
        mode,
        runsAs,
        risk,
        floor,
      };

      /* BUCKETED BY WHAT HAPPENS. `mode` stays on the row under its own name so
         the editor still offers the moves the SET value allows, and the surface
         can say the two differ where they do. */
      if (raw.enabled === false || t.mode === "off") never.push(t);
      else if (t.runsAs === "auto") alone.push(t);
      else asks.push(t);
    }

    // The ceilings, read from the workspace this surface is actually about
    // rather than from whichever one this user happens to own first. Before
    // this, /boundary could show a ceiling belonging to a different workspace
    // than the runs listed beside it obeyed.
    const workspaceId = await resolveGovernedWorkspace(supabase, userId, data.workspaceId);
    const { data: ws } = workspaceId
      ? await supabase
          .from("workspaces")
          .select("id,default_mission_spend_cap_usd,default_track_spend_cap_usd")
          .eq("id", workspaceId)
          .maybeSingle()
      : { data: null };

    // The role decides which controls are OFFERED; the database decides which
    // are accepted, and the two now ask the same question. An admin used to see
    // no ceiling and no autonomy bars here despite having always been allowed
    // to move both.
    const role = ws
      ? asRole(await getUserWorkspaceRole(supabase, workspaceId as string, userId))
      : null;
    const canWriteWorkspaceRow = canManageWorkspace(role);

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

    // The two bars the platform crosses on its own. READ SEPARATELY, and that
    // is the whole point: folding these columns into the ceiling select above
    // would mean that during the window where this code is live and the
    // migration is not, the read fails, `ws` comes back null, and the entire
    // ceiling block silently vanishes from the surface. A policy read that
    // cannot be answered falls back to what the product ships with and says so
    // in the log, never to a boundary nobody set.
    let autonomy: AutonomyPolicy = SHIPPED_AUTONOMY_POLICY;
    if (ws) {
      const { loadAutonomyPolicy } = await import("@/lib/autonomy-policy.server");
      autonomy = await loadAutonomyPolicy(supabase as unknown as SupabaseClient, ws.id);
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
      /**
       * DEPRECATED NAME, KEPT SO THE ROUTE STILL COMPILES. It gates both the
       * ceiling block and the autonomy block, and what both actually need to
       * know is "may this person move a workspace boundary", not "do they own
       * the row". Prefer `canSetCaps` / `canSetAutonomy`, which say which of
       * the two a caller is asking about.
       */
      isOwner: canWriteWorkspaceRow,
      /** Both are owner-or-admin today, and they are separate fields because
       *  the surfaces are separate and one may loosen without the other. */
      canSetCaps: canWriteWorkspaceRow,
      canSetAutonomy: canWriteWorkspaceRow,
      /** The caller's role, so the surface can say why a control is absent. */
      role,
      /** Which workspace answered — the question this file used to guess at. */
      workspaceId,
      /** Where this workspace puts the promotion bar and the settle-or-ask bar,
       *  with the shipped defaults standing in for anything it has not set. */
      autonomy,
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
  /** What a person SET. The editor offers moves against this. */
  mode: "auto" | "confirm" | "review" | "off";
  /**
   * What the loop ACTUALLY does with it, once the trust arc and the safety
   * floors have had their say. Differs from `mode` for sixteen of the
   * seventy-four registered tools on the arc this database is on, always in the
   * looser direction, so a surface that reports `mode` under-reports reach.
   * Never `off` unless `mode` is: the resolver has nothing to loosen there.
   */
  runsAs: "auto" | "confirm" | "review" | "off";
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
