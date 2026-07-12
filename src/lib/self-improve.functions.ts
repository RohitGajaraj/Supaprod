/**
 * RPT-50 (deterministic slice): server adapter for the self-improvement engine.
 *
 * Reads three of Cadence's own quality signals for a workspace and hands them to
 * the PURE `composeProposals` (src/lib/self-improve.ts). No AI, no chokepoint:
 * every proposal is a deterministic flag on a real number over a real sample.
 *
 * The read+compose is factored into `computeSelfImprovementForWorkspace`, a plain
 * async helper that takes a supabase client + the owner/workspace ids, so BOTH
 * the authenticated server fn (user-scoped client) and the scheduled tick
 * (service-role admin client, no auth.uid()) run the exact same logic. Each of
 * the three reads is wrapped so a missing table or a failed query yields an empty
 * signal for that kind (an honest partial), never a thrown 500.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  composeProposals,
  type SelfImprovementProposal,
  type EvalSignal,
  type AgentSignal,
  type PlaybookSignal,
} from "@/lib/self-improve";
import { getEvalHealthImpl } from "@/lib/eval-health.functions";
import { summarizeGateSignals } from "@/lib/gate-signals";
import { rankPlaybooksByOutcome, type PlaybookStation } from "@/lib/playbooks/registry";
import { callModel } from "@/lib/ai/runtime.server";

const PLAYBOOK_STATIONS: readonly PlaybookStation[] = [
  "discovery",
  "prioritization",
  "prd",
  "positioning",
  "validation",
];

export type SelfImprovementResult = {
  proposals: SelfImprovementProposal[];
  generated_at: string;
};

/**
 * Read the workspace's eval suites and fold each into an EvalSignal. Eval suites
 * are user-scoped in the schema (no workspace_id column), so we read by the
 * owner's user id via the shared `getEvalHealthImpl`, the same query eval-health
 * already uses. A suite with no completed runs (null pass rate) is dropped, not
 * flagged. Never throws: any read failure returns an empty signal.
 */
async function readEvalSignals(supabase: SupabaseClient, userId: string): Promise<EvalSignal[]> {
  try {
    const { health } = await getEvalHealthImpl(supabase, userId);
    return health.suites
      .filter((s) => s.passRate !== null && s.runs > 0)
      .map((s) => ({
        suite_id: s.suiteId,
        name: s.title ?? s.suiteId,
        pass_rate: s.passRate as number,
        total: s.runs,
      }));
  } catch {
    return [];
  }
}

/**
 * Read the workspace's human-at-gate events (RPT-32) and roll them up per agent
 * with the existing pure `summarizeGateSignals`. The unattributed bucket is
 * skipped (a proposal needs a real agent to name). Never throws.
 */
async function readAgentSignals(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<AgentSignal[]> {
  try {
    const { data: rows, error } = await supabase
      .from("human_gate_events")
      .select("gate_type,agent_slug")
      .eq("workspace_id", workspaceId)
      .limit(5000);
    if (error || !rows) return [];
    const { perAgent } = summarizeGateSignals(rows);
    return Object.entries(perAgent)
      .filter(([slug]) => slug !== "(unattributed)")
      .map(([slug, stats]) => ({
        agent_slug: slug,
        correction_rate: stats.correctionRate,
        total: stats.total,
      }));
  } catch {
    return [];
  }
}

/**
 * Read the workspace's playbook runs and fold each station's ranking into a
 * PlaybookSignal, reusing the same pure `rankPlaybooksByOutcome` the registry
 * surface uses. Only playbooks with a decisive track record (non-null win rate)
 * become a signal. Never throws.
 */
async function readPlaybookSignals(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<PlaybookSignal[]> {
  try {
    const { data: rows, error } = await supabase
      .from("playbook_runs")
      .select("playbook_id,verdict,station")
      .eq("workspace_id", workspaceId)
      .limit(5000);
    if (error || !rows) return [];
    const runs = rows as Array<{
      playbook_id: string;
      verdict: string | null;
      station?: string | null;
    }>;
    const out: PlaybookSignal[] = [];
    for (const station of PLAYBOOK_STATIONS) {
      // Only this station's runs. A run with no recorded station is dropped, not
      // attributed to every station (that would 5x its count and duplicate the
      // proposal id `playbook:<key>` across stations).
      const stationRuns = runs.filter((r) => r.station === station);
      for (const ranked of rankPlaybooksByOutcome(station, stationRuns)) {
        if (ranked.winRate === null) continue;
        out.push({
          playbook_key: ranked.playbook.id,
          station,
          win_rate: ranked.winRate,
          runs: ranked.runs,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * The shared read+compose. Takes any supabase client (user-scoped or admin) plus
 * the owner user id and the workspace id, gathers the three signals (each an
 * honest partial on failure), and returns the deterministic proposals. Same
 * function drives the server fn and the scheduled tick.
 */
export async function computeSelfImprovementForWorkspace(
  supabase: SupabaseClient,
  params: { userId: string; workspaceId: string },
): Promise<SelfImprovementResult> {
  const [evals, agents, playbooks] = await Promise.all([
    readEvalSignals(supabase, params.userId),
    readAgentSignals(supabase, params.workspaceId),
    readPlaybookSignals(supabase, params.workspaceId),
  ]);
  const proposals = composeProposals({ evals, agents, playbooks });
  return { proposals, generated_at: new Date().toISOString() };
}

const GetSchema = z.object({ workspaceId: z.string().uuid() });

/**
 * Authenticated read: recompute the calling user's proposals for one workspace
 * and return them. Deterministic, no AI, no writes (the tick materializes them).
 */
export const getSelfImprovementProposals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GetSchema.parse(i))
  .handler(async ({ context, data }): Promise<SelfImprovementResult> => {
    const { supabase, userId } = context;
    return computeSelfImprovementForWorkspace(supabase as SupabaseClient, {
      userId,
      workspaceId: data.workspaceId,
    });
  });

// --- RPT-50 AI rung: grounded, on-demand enrichment (the layer over the flags) ---

/**
 * Load the REAL records behind a deterministic flag, so the AI explanation is
 * grounded in evidence rather than guessing. Returns a compact text block + the
 * record count. Never throws (an unreadable source yields 0 records, and the caller
 * declines to spend an AI call).
 */
async function loadFlagEvidence(
  supabase: SupabaseClient,
  params: { kind: string; subjectRef: string; workspaceId: string; userId: string },
): Promise<{ records: string; count: number }> {
  try {
    if (params.kind === "agent") {
      const { data } = await supabase
        .from("human_gate_events")
        .select("gate_type,subject_type,verdict,diff_summary,created_at")
        .eq("workspace_id", params.workspaceId)
        .eq("agent_slug", params.subjectRef)
        .order("created_at", { ascending: false })
        .limit(15);
      const rows = (data ?? []) as Array<{
        gate_type?: string | null;
        subject_type?: string | null;
        verdict?: string | null;
        diff_summary?: string | null;
      }>;
      const lines = rows.map(
        (r, i) =>
          `${i + 1}. [${r.gate_type}] on a ${r.subject_type ?? "draft"}${r.verdict ? ` (verdict: ${r.verdict})` : ""}${r.diff_summary ? ` -- the human changed: ${r.diff_summary}` : ""}`,
      );
      return { records: lines.join("\n"), count: rows.length };
    }
    if (params.kind === "eval") {
      const { data } = await supabase
        .from("eval_runs")
        .select("status,avg_score,created_at")
        .eq("suite_id", params.subjectRef)
        .order("created_at", { ascending: false })
        .limit(12);
      const rows = (data ?? []) as Array<{ status?: string | null; avg_score?: number | null }>;
      const lines = rows.map(
        (r, i) => `${i + 1}. run ${r.status ?? "?"}, score ${r.avg_score ?? "?"} / 100`,
      );
      return { records: lines.join("\n"), count: rows.length };
    }
    if (params.kind === "playbook") {
      const { data } = await supabase
        .from("playbook_runs")
        .select("verdict,station,created_at")
        .eq("workspace_id", params.workspaceId)
        .eq("playbook_id", params.subjectRef)
        .order("created_at", { ascending: false })
        .limit(15);
      const rows = (data ?? []) as Array<{ verdict?: string | null; station?: string | null }>;
      const lines = rows.map(
        (r, i) => `${i + 1}. run at ${r.station ?? "?"} station: ${r.verdict ?? "no verdict"}`,
      );
      return { records: lines.join("\n"), count: rows.length };
    }
  } catch {
    // unreadable source -> no records; the caller declines to guess.
  }
  return { records: "", count: 0 };
}

const EnrichSchema = z.object({
  workspaceId: z.string().uuid(),
  kind: z.enum(["eval", "agent", "playbook"]),
  subjectRef: z.string().min(1).max(200),
});

export type ProposalEnrichment = {
  explanation: string;
  suggested_fix: string;
  grounded_on: number;
  cached: boolean;
};

/**
 * RPT-50 AI rung: the GROUNDED, on-demand enrichment for one deterministic flag.
 *
 * Layered on top of the flags, never replacing them: the deterministic rule already
 * decided this is a real problem (from a real number). This reads the ACTUAL records
 * behind that flag and asks the model, through the chokepoint, to (1) explain the
 * pattern and (2) propose one concrete fix -- grounded ONLY in those records, forbidden
 * from inventing a problem or changing severity. Human-triggered and cached on the
 * proposal row, so the AI runs at most once per flag (cost-controlled, not bulk-nightly).
 */
export const enrichSelfImproveProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EnrichSchema.parse(i))
  .handler(async ({ context, data }): Promise<ProposalEnrichment> => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;

    // 1. Cache: never re-spend on a flag already enriched.
    const { data: existing } = await db
      .from("self_improve_proposals")
      .select("ai_explanation,ai_suggested_fix,ai_grounded_on,ai_enriched_at")
      .eq("workspace_id", data.workspaceId)
      .eq("kind", data.kind)
      .eq("subject_ref", data.subjectRef)
      .maybeSingle();
    if (existing?.ai_enriched_at && existing.ai_explanation) {
      return {
        explanation: existing.ai_explanation as string,
        suggested_fix: (existing.ai_suggested_fix as string) ?? "",
        grounded_on: (existing.ai_grounded_on as number) ?? 0,
        cached: true,
      };
    }

    // 2. Re-derive the authoritative flag (the deterministic truth), so we enrich a
    // flag that actually fires now and materialize its real title/detail/evidence.
    const { proposals } = await computeSelfImprovementForWorkspace(db, {
      userId,
      workspaceId: data.workspaceId,
    });
    const flag = proposals.find((p) => p.kind === data.kind && p.subject_ref === data.subjectRef);
    if (!flag) {
      return {
        explanation:
          "This flag no longer fires -- the underlying numbers have changed since it was raised.",
        suggested_fix: "",
        grounded_on: 0,
        cached: false,
      };
    }

    // 3. Load the real records behind it.
    const { records, count } = await loadFlagEvidence(db, {
      kind: data.kind,
      subjectRef: data.subjectRef,
      workspaceId: data.workspaceId,
      userId,
    });
    if (count === 0) {
      // Nothing to ground on -> do NOT call the model (no guess, no spend).
      return {
        explanation:
          "The individual records behind this flag are not readable here, so there is nothing to ground an explanation on yet.",
        suggested_fix: "Gather more of this signal, then ask again.",
        grounded_on: 0,
        cached: false,
      };
    }

    // 4. Grounded AI call, through the chokepoint. Internal judge surface, guardrails
    // off (no user-facing generation), strict JSON out.
    let explanation = "";
    let suggested_fix = "";
    try {
      const res = await callModel(db as never, userId, {
        surface: "judge",
        surface_ref: `self-improve:${data.kind}:${data.subjectRef}`,
        model: "google/gemini-2.5-flash",
        guardrails: false,
        responseFormat: "json_object",
        workspaceId: data.workspaceId,
        messages: [
          {
            role: "system",
            content:
              'You are Cadence\'s own quality analyst, reviewing a problem that Cadence\'s DETERMINISTIC self-check raised about Cadence itself. A rule (not you) already decided this is a real problem, from a real number over a real sample. Your ONLY job, using the ACTUAL records provided: (1) explain the specific pattern behind the flag in one or two sentences, and (2) propose exactly one concrete, specific fix. Rules: ground every statement in the provided records; do not restate the headline number; do not invent problems the records do not show; do not comment on how severe it is (already decided); if the records do not reveal a clear pattern, say so plainly and suggest gathering more signal. Reply as strict JSON: {"explanation": string, "suggested_fix": string}. Keep each under 60 words, plain language, no em dashes.',
          },
          {
            role: "user",
            content: `FLAG: ${flag.title}\nDETERMINISTIC EVIDENCE: ${flag.evidence}\n\nTHE ACTUAL RECORDS BEHIND IT (${count}):\n${records}`,
          },
        ],
      });
      const parsed = JSON.parse(res.output || "{}") as {
        explanation?: unknown;
        suggested_fix?: unknown;
      };
      explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim() : "";
      suggested_fix = typeof parsed.suggested_fix === "string" ? parsed.suggested_fix.trim() : "";
    } catch {
      // Model or parse failure: leave the deterministic flag untouched; return a plain
      // note rather than a fabricated explanation.
      return {
        explanation:
          "The explanation could not be generated just now. The flag above still stands on its own evidence.",
        suggested_fix: "",
        grounded_on: count,
        cached: false,
      };
    }
    if (!explanation) {
      return {
        explanation: "The records did not reveal a clear pattern to explain yet.",
        suggested_fix: "Gather more of this signal, then ask again.",
        grounded_on: count,
        cached: false,
      };
    }

    // 5. Cache on the proposal row (materialize it if the tick has not). Deterministic
    // fields come from the authoritative recompute, never the client.
    const enrichedAt = new Date().toISOString();
    await db.from("self_improve_proposals").upsert(
      {
        workspace_id: data.workspaceId,
        user_id: userId,
        kind: flag.kind,
        severity: flag.severity,
        title: flag.title,
        detail: flag.detail,
        evidence: flag.evidence,
        subject_ref: flag.subject_ref,
        ai_explanation: explanation,
        ai_suggested_fix: suggested_fix,
        ai_grounded_on: count,
        ai_enriched_at: enrichedAt,
      },
      { onConflict: "workspace_id,kind,subject_ref" },
    );

    return { explanation, suggested_fix, grounded_on: count, cached: false };
  });
