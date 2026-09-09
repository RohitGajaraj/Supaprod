import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { buildOutcomeMemory, outcomeImportance } from "@/lib/ai/outcome-memory";
import { rememberOutcome } from "@/lib/ai/memory.server";
import { inferSupersession } from "@/lib/ai/supersession.server";
import { inferDirectEdge } from "@/lib/ai/edge-extractor.server";
import { callModel } from "@/lib/ai/runtime.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { pickChangesetForPrd, type ChangesetForPrd } from "@/lib/studio-ship";
import {
  changelogRowFor,
  shouldPublishChangelog,
  type ChangesetForChangelog,
} from "@/lib/changelog";
import { outcomeSupportFromCounts } from "@/components/discover/ranking";
// The pure half of the settle-or-ask rule. Server-free by construction, so
// importing it here drags nothing into the client bundle and nothing into the
// rule's own unit tests.
import {
  basisFor,
  metricWasDeclared,
  metricWasObserved,
  overturnMove,
  type SettlementDecision,
} from "@/lib/ai/outcome-review";
// The workspace's own settle-or-ask bar, so the queue explains the decision the
// sweep actually made rather than the one the platform default would have made.
import { decideSettlement, SHIPPED_AUTONOMY_POLICY } from "@/lib/autonomy-policy";
import { loadAutonomyPolicies } from "@/lib/autonomy-policy.server";
import { gradeOutcomeContract } from "@/lib/outcome-contract-grade";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { recordLineageSafe } from "@/lib/lineage.functions";
// Type only, so nothing is imported at runtime and the cycle this file would
// otherwise close with outcome-suggestion.server (which imports
// draftOutcomeVerdict from here) never exists. The runtime call is a dynamic
// import inside draftOutcomeSuggestion's handler.
import type { OutcomeSuggestion } from "@/lib/outcome-suggestion.server";
import type { ContractClause } from "@/lib/discovery.functions";
import { forecastDueDate, metricSourcesForTrack } from "@/lib/spine/driver.server";
import {
  onlyAPersonCanGradeThis,
  whatLearnIsWaitingFor,
} from "@/lib/spine/what-learn-is-waiting-for";

// Outcome surface: read-only roll-ups over existing tables.
// No new agent logic; surfaces the right-half of the loop (Ship · Launch · Support · Learn)
// so operators can see the lifecycle they were sold. See docs/planning/archive/feature-backlog.md F-OUTCOME-SURFACE.

const SUPPORT_SOURCES = [
  "support",
  "ticket",
  "helpdesk",
  "email",
  "zendesk",
  "intercom",
  "freshdesk",
];
const LAUNCH_TOOLS = [
  "send_slack",
  "send_email",
  "publish_changelog",
  "post_announcement",
  "notify_channel",
];

export const getOutcomeData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // Releases: completed missions + completed builder/ship runs.
    const [missionsRes, runsRes, approvalsRes, supportRes, oppsRes] = await Promise.all([
      supabase
        .from("missions")
        .select("id, title, goal, status, hop_count, completed_at, updated_at, created_at")
        .eq("status", "completed")
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(25),
      supabase
        .from("agent_runs")
        .select(
          "id, agent_name, agent_slug, input, status, duration_ms, tokens_used, spend_used_usd, created_at, mission_id",
        )
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("agent_approvals")
        .select("id, tool_name, agent_slug, args, rationale, status, decided_at, created_at")
        .in("tool_name", LAUNCH_TOOLS)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("signals")
        .select("id, title, content, source, sentiment, created_at, theme_id")
        .in("source", SUPPORT_SOURCES)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("opportunities")
        .select(
          "id, title, problem, status, impact, confidence, ease, ice_score, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(25),
    ]);

    if (missionsRes.error) throw new Error(missionsRes.error.message);
    if (runsRes.error) throw new Error(runsRes.error.message);
    if (approvalsRes.error) throw new Error(approvalsRes.error.message);
    if (supportRes.error) throw new Error(supportRes.error.message);
    if (oppsRes.error) throw new Error(oppsRes.error.message);

    // Learnings = opportunities that were re-scored after creation (proxy for closed-loop learning).
    const learnings = (oppsRes.data ?? []).filter((o) => {
      const c = new Date(o.created_at).getTime();
      const u = new Date(o.updated_at).getTime();
      return u - c > 60_000;
    });

    return {
      releases: {
        missions: missionsRes.data ?? [],
        runs: runsRes.data ?? [],
      },
      launches: approvalsRes.data ?? [],
      support: supportRes.data ?? [],
      learnings,
    };
  });

// ---------------------------------------------------------------------------
// F-V5-LOOP-CLOSE Phase D — ship detection + outcome → learnings → ICE re-score.
// New columns (prds.shipped_at/outcome, public.learnings) are not yet in the
// generated Database types, so these handlers use the untyped-client cast
// precedent (see briefs/discovery/lineage helpers).

/**
 * Check whether a PRD's linked GitHub issue has been closed; if so, mark the
 * PRD shipped (idempotent — shipped_at is only stamped once). No linked issue
 * returns issueState "unknown"; an unresolvable GitHub connection throws
 * resolveGitHub's actionable error (binding → user connection → env chain).
 */
export const checkPrdShipped = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prdId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;
    const { data: prd, error: prdErr } = await db
      .from("prds")
      .select("id,github_issue_url,status,shipped_at,workspace_id")
      .eq("id", data.prdId)
      .single();
    if (prdErr) throw new Error(prdErr.message);
    if (!prd.github_issue_url) return { shipped: false, issueState: "unknown" as const };
    const match = String(prd.github_issue_url).match(/\/issues\/(\d+)/);
    if (!match) return { shipped: false, issueState: "unknown" as const };

    const gh = await resolveGitHub({
      userId,
      workspaceId: prd.workspace_id as string | null,
      userClient: db,
    });

    const res = await fetch(`https://api.github.com/repos/${gh.repo}/issues/${match[1]}`, {
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "supaprod-agent",
      },
    });
    if (!res.ok) return { shipped: false, issueState: "unknown" as const };
    const issue = (await res.json()) as { state?: string; closed_at?: string | null };
    if (issue.state !== "closed") return { shipped: false, issueState: "open" as const };

    let shippedAt = prd.shipped_at as string | null;
    if (!shippedAt) {
      shippedAt = issue.closed_at ?? new Date().toISOString();
      const { error: upErr } = await db
        .from("prds")
        .update({ status: "shipped", shipped_at: shippedAt, updated_at: new Date().toISOString() })
        .eq("id", prd.id);
      if (upErr) throw new Error(upErr.message);
      // SEAM-1: stage history for the ship transition.
      await recordStageEvent(db, {
        entityType: "spec",
        entityId: prd.id as string,
        from: (prd.status as string | null) ?? null,
        to: "shipped",
        actor: "human",
        workspaceId: (prd.workspace_id as string | null) ?? null,
        userId,
      });
    }
    return { shipped: true, issueState: "closed" as const, shippedAt };
  });

/* ------------------------------------------------------------------------ *
 * The verdict arithmetic, in ONE place.
 *
 * `recordOutcome` moves the linked opportunity's confidence and `/learn`
 * PROMISES that move before you click. Two copies of this sum would let the
 * promise and the write drift, on the one surface whose entire authority is
 * that the record is true, so both read these.
 * ------------------------------------------------------------------------ */

// `OutcomeVerdict` is declared further down with the Historian; TS hoists the
// type, so this stays next to the write it governs.
// EXPORTED 2026-08-02 so the agent path cannot drift from the human one. The
// `learning.record` agent tool used to write a learning with no opportunity_id
// at all, which meant the ranking could not see an agent's verdict (listLearnings
// derives the theme through that column and /decide drops a learning with no
// theme). Closing that required the agent path to move confidence and recompute
// ICE exactly as this file does. Two copies of that arithmetic would eventually
// disagree, and the one surface whose entire authority is that the record is
// true is the worst place to let that happen, so there is one copy and both
// callers read it.
export const VERDICT_CONFIDENCE_DELTA: Record<OutcomeVerdict, number> = {
  validated: 2,
  missed: -2,
  mixed: 0,
};

/** confidence is a 1..10 axis; a verdict may push it out and it clamps back. */
export function clampConfidence(n: number): number {
  return Math.min(10, Math.max(1, n));
}

/** The move a verdict makes, accounting for one it REPLACES. `overturnMove` is
 *  the pure, unit-tested half; this binds it to the one delta table. */
export function confidenceMoveFor(next: OutcomeVerdict, prior: OutcomeVerdict | null): number {
  return overturnMove(VERDICT_CONFIDENCE_DELTA, next, prior);
}

/** ICE is the mean of the three axes. `ice_score` is a GENERATED column, so a
 *  caller that has just changed confidence computes the new value rather than
 *  re-reading a row Postgres has not recomputed for it yet. */
export function iceOf(impact: number | null, confidence: number, ease: number | null): number {
  return ((impact ?? 5) + confidence + (ease ?? 5)) / 3;
}

/* ------------------------------------------------------------------------ *
 * WHO SETTLED IT, AND HOW TO DISAGREE.
 *
 * `prds.outcome` is jsonb and always has been, so attribution costs no
 * migration: every field below is additive and an outcome written before this
 * existed reads back as a human settlement with no evidence attached, which is
 * exactly what it was.
 *
 * The contrast this preserves is the point. When an agent settles `validated`
 * and a person overturns it to `missed`, that pair is the single most valuable
 * row this product produces, because the whole thesis is a record of judgment
 * that compounds. Overwriting the agent's verdict in place would delete the
 * training signal to save one column, so the overturn is appended and the
 * original is kept whole.
 * ------------------------------------------------------------------------ */

export type SettledByKind = "human" | "agent";

/**
 * One human disagreement with a settled verdict, kept forever.
 *
 * Everything the agent had is captured, not just the verdict it landed on: what
 * it said, why it believed it could settle, and the facts it rested on. A pair
 * of verdicts with no reasoning attached tells you an agent was wrong; a pair
 * with the reasoning attached tells you WHERE it was wrong, and that second
 * thing is the only one worth training on.
 */
export type OutcomeOverturn = {
  from_verdict: OutcomeVerdict;
  from_settled_by: SettledByKind;
  from_agent_slug: string | null;
  from_confidence: number | null;
  from_summary: string | null;
  from_reason: string | null;
  from_evidence: string[];
  to_verdict: OutcomeVerdict;
  at: string;
  /** What the person said instead. */
  note: string;
};

/** The shape `prds.outcome` carries. Older rows have only the first five. */
export type RecordedOutcome = {
  verdict: OutcomeVerdict;
  summary: string;
  metric_label: string | null;
  metric_value: string | null;
  checked_at: string;
  settled_by?: SettledByKind;
  settled_by_agent_slug?: string | null;
  /** The agent's own 0..1 evidence score at the moment it settled. */
  settled_confidence?: number | null;
  /** One plain sentence: why the agent was allowed to settle this. */
  settled_reason?: string | null;
  /** The facts it rested on, so a person can check the working. */
  settled_evidence?: string[] | null;
  /** The learnings row this outcome wrote. An overturn replaces THAT row by id
   *  rather than guessing at the newest one for the spec. */
  settled_learning_id?: string | null;
  /**
   * The agent_memory row this outcome distilled into, and the reason there is
   * none. Exactly one of the two is set on any outcome settled from 2026-08-05.
   *
   * They exist because the memory write is best-effort and used to fail into a
   * `console.error` inside a Cloudflare Worker. A settled outcome whose lesson
   * never reached the brain looked identical to one whose lesson did, left the
   * pending queue for good, and nothing retried it. Now the gap is one query:
   * `select id from prds where outcome->>'settled_memory_error' is not null`.
   *
   * Absent on rows settled before this, which is honestly "not recorded" and
   * must never be read as "wrote a memory".
   */
  settled_memory_id?: string | null;
  settled_memory_error?: string | null;
  /**
   * A THIRD STATE, because "the memory was written" and "the memory can be
   * recalled from here" are not the same fact.
   *
   * `agent_memory` has a BEFORE INSERT trigger that fills a null `workspace_id`
   * with the author's earliest workspace, so `rememberOutcome` follows its
   * insert with an UPDATE that moves the row to the workspace that settled the
   * spec. That UPDATE's result used to be discarded, and supabase-js resolves
   * an RLS refusal as a success with zero rows, so a memory stranded in the
   * wrong workspace read as a clean success here. This carries the reason when
   * the move did not land: the lesson exists, and `match_agent_memory` may not
   * reach it from the workspace that earned it.
   *
   * Set INDEPENDENTLY of the two above. A row can be written (`settled_memory_id`
   * set, `settled_memory_error` null) and still be in the wrong workspace.
   * Findable with `select id from prds where
   * outcome->>'settled_memory_workspace_error' is not null`.
   */
  settled_memory_workspace_error?: string | null;
  overturns?: OutcomeOverturn[];
};

/** How this write is attributed. */
export type OutcomeSettledBy =
  { kind: "human" } | { kind: "agent"; slug: string; decision: SettlementDecision };

export type PriorSettlement = {
  verdict: OutcomeVerdict;
  summary: string | null;
  by: SettledByKind;
  agentSlug: string | null;
  confidence: number | null;
  reason: string | null;
  evidence: string[];
  learningId: string | null;
  overturns: OutcomeOverturn[];
};

const asVerdict = (v: unknown): OutcomeVerdict | null =>
  v === "validated" || v === "missed" || v === "mixed" ? v : null;

/**
 * Read what is already on the record for a spec. Null when nothing is, which
 * is not the same as a human having settled it with no notes, so the two are
 * never conflated.
 */
export function priorSettlement(outcome: unknown): PriorSettlement | null {
  if (!outcome || typeof outcome !== "object") return null;
  const o = outcome as RecordedOutcome;
  const verdict = asVerdict(o.verdict);
  if (!verdict) return null;
  return {
    verdict,
    summary: typeof o.summary === "string" ? o.summary : null,
    // Absent means it predates attribution, and every one of those was a human
    // pressing the button on /learn.
    by: o.settled_by === "agent" ? "agent" : "human",
    agentSlug: typeof o.settled_by_agent_slug === "string" ? o.settled_by_agent_slug : null,
    confidence: typeof o.settled_confidence === "number" ? o.settled_confidence : null,
    reason: typeof o.settled_reason === "string" ? o.settled_reason : null,
    evidence: Array.isArray(o.settled_evidence)
      ? o.settled_evidence.filter((s) => typeof s === "string")
      : [],
    learningId: typeof o.settled_learning_id === "string" ? o.settled_learning_id : null,
    overturns: Array.isArray(o.overturns) ? o.overturns : [],
  };
}

/** The learnings row this write produced, as it comes back over the wire.
 *  `numeric` columns arrive as strings through PostgREST, so ICE stays widened
 *  and callers coerce, exactly as `listLearnings` documents. */
export type LearningRow = {
  id: string;
  prd_id: string | null;
  opportunity_id: string | null;
  verdict: OutcomeVerdict;
  summary: string;
  metric_label: string | null;
  metric_value: string | null;
  prior_ice: number | string | null;
  new_ice: number | string | null;
  created_at: string;
  recorded_by_agent_slug?: string | null;
  mission_id?: string | null;
};

export type ApplyOutcomeResult = {
  learning: LearningRow | null;
  opportunity: { id: string; prior_ice: number | null; new_ice: number | null } | null;
  memory_id: string | null;
  /** Why no memory was written, when none was. Null when one was. The receipt
   *  can say so out loud instead of quietly reporting a closed loop that is
   *  open. */
  memory_error: string | null;
  prdTitle: string | null;
  opportunityTitle: string | null;
  arcHold: { slug: string; arc: string } | null;
  themeMoved: { themeId: string; before: number; after: number; otherBets: number } | null;
  /** Set when this write replaced a verdict that was already on the record. */
  overturned: OutcomeOverturn | null;
  /** The decision this verdict was written back against, and — when it is null
   *  — the reason no hop could name one. See `resolveSettledDecision`. */
  decisionEdge: SettledDecisionEdge;
};

/** What `resolveSettledDecision` found, and why, so a NULL is a stated answer
 *  rather than a gap somebody has to go and re-derive. */
export type SettledDecisionEdge = {
  /** The decision this verdict settles. Null when no hop could name exactly one. */
  decisionId: string | null;
  /** Which hop answered, or why none did. Plain enough to put on a receipt. */
  why: string;
};

/**
 * WHICH DECISION A VERDICT SETTLES, and the two hops allowed to answer.
 *
 * The canon's central sentence is that a verdict is "written back against the
 * decision that caused it". `learnings.decision_id` has existed since migration
 * 20260819181000 and NOTHING wrote it: 0 of 133 rows carried one, measured
 * 2026-08-22. This resolves the value that closes it, and the hard part is not
 * the write, it is refusing to invent an edge when the record does not hold one.
 *
 * THE MIGRATION THAT ADDED THE COLUMN REFUSED TO DERIVE IT, and it was right
 * about the derivation it refused: "prd_id does not identify a decision, since
 * many decisions share one spec". Measured the same day, 14 specs carry a
 * decision and NOT ONE of them carries exactly one — every one carries two or
 * three. A plain join on `prd_id` would therefore have written a wrong edge on
 * every row it touched. `trust.server.ts` builds exactly that map today
 * (`new Map(decisionRows.map(d => [d.prd_id, d.decided_by_agent_slug]))`, where
 * the last row of an unordered result silently wins) and is the cost this column
 * exists to stop paying — so copying its shape here would have carved the defect
 * into the schema instead of removing it.
 *
 * SO THE RULE IS UNIQUENESS, NOT PROXIMITY. The nearest hop that knows anything
 * answers; if that hop knows more than one thing the answer is NULL and the
 * ladder STOPS. Ambiguity is never resolved by looking further away, because a
 * farther hop that happens to be unique is not evidence about which of the near
 * candidates was meant — it is a tiebreak invented by the query.
 *
 *   1. THE SPEC'S OWN DECISIONS. `decisions.prd_id = spec.id`, in the spec's
 *      workspace, excluding `superseded`: a call that was replaced is not the
 *      call this verdict grades, and dropping it is the one narrowing that
 *      genuinely disambiguates rather than guessing.
 *
 *   2. THE TRACK, only when the spec carries no decision at all. This is not a
 *      fallback for taste. It is the ONLY hop that can ever answer on the
 *      autonomous route, where the edge matters most: `decision.record` writes
 *      `prd_id` only when the agent passes one, and at Decide the spec does not
 *      exist yet, so `decisions.prd_id` is null there by construction — the same
 *      fact `learning.record` records against itself in registry.server.ts. What
 *      DOES exist is the track: the driver files the Decide call and the spec it
 *      produced as members of one piece of work. Measured 2026-08-22, five
 *      tracks hold a decision member and three hold exactly one.
 *
 *      Two guards stop that becoming a guess. The candidate must sit in the
 *      spec's workspace, and it must have been created no later than the spec: a
 *      decision recorded on the track AFTER the spec is a later call, not the one
 *      the spec came out of.
 *
 * WHY THERE IS NO MISSION HOP, though `applyOutcome` holds a `missionId` and it
 * looks like a third route. The only caller that supplies one derives it from
 * the newest decision on this same spec (outcome-review.server.ts, "the most
 * recent decision linking this spec to a mission"), so a mission hop would
 * re-ask rung 1 with the uniqueness rule dropped — the guess, laundered through
 * a second table. The other callers pass nothing.
 *
 * NOTHING HERE MAY THROW. A verdict is real work somebody or something did; an
 * attribution failure reports less and never loses it.
 */
export async function resolveSettledDecision(
  db: SupabaseClient,
  spec: { id: string; workspaceId: string | null; createdAt: string | null },
): Promise<SettledDecisionEdge> {
  const ids = (rows: unknown, key: string): string[] => [
    ...new Set(
      ((rows ?? []) as Array<Record<string, unknown>>)
        .map((r) => r?.[key])
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  ];

  try {
    // ---- 1. The spec's own decisions. `limit(2)` because the question is
    //         "exactly one or not", and reading a third row answers nothing.
    let onSpec = db
      .from("decisions")
      .select("id")
      .eq("prd_id", spec.id)
      .neq("status", "superseded");
    if (spec.workspaceId) onSpec = onSpec.eq("workspace_id", spec.workspaceId);
    const { data: specRows, error: specErr } = await onSpec.limit(2);
    if (specErr) return { decisionId: null, why: `the decision lookup failed: ${specErr.message}` };
    const onSpecIds = ids(specRows, "id");
    if (onSpecIds.length === 1) {
      return {
        decisionId: onSpecIds[0],
        why: "the one standing decision recorded against this spec",
      };
    }
    if (onSpecIds.length > 1) {
      return {
        decisionId: null,
        why: "this spec carries more than one standing decision, so which one the verdict settles is not on the record",
      };
    }

    // ---- 2. The track this spec came out of.
    const { data: prdMembers, error: prdMemberErr } = await db
      .from("spine_track_members")
      .select("track_id")
      .eq("artifact_kind", "prd")
      .eq("artifact_id", spec.id);
    if (prdMemberErr) {
      return { decisionId: null, why: `the track lookup failed: ${prdMemberErr.message}` };
    }
    const trackIds = ids(prdMembers, "track_id");
    if (trackIds.length === 0) {
      return {
        decisionId: null,
        why: "no decision names this spec and the spec belongs to no track",
      };
    }

    const { data: decisionMembers, error: decMemberErr } = await db
      .from("spine_track_members")
      .select("artifact_id")
      .eq("artifact_kind", "decision")
      .in("track_id", trackIds);
    if (decMemberErr) {
      return { decisionId: null, why: `the track lookup failed: ${decMemberErr.message}` };
    }
    const candidates = ids(decisionMembers, "artifact_id");
    if (candidates.length === 0) {
      return { decisionId: null, why: "this spec's track recorded no decision" };
    }

    let onTrack = db
      .from("decisions")
      .select("id")
      .in("id", candidates)
      .neq("status", "superseded");
    if (spec.workspaceId) onTrack = onTrack.eq("workspace_id", spec.workspaceId);
    // The call has to have come BEFORE the spec it produced.
    if (spec.createdAt) onTrack = onTrack.lte("created_at", spec.createdAt);
    const { data: trackRows, error: trackErr } = await onTrack.limit(2);
    if (trackErr) {
      return { decisionId: null, why: `the decision lookup failed: ${trackErr.message}` };
    }
    const onTrackIds = ids(trackRows, "id");
    if (onTrackIds.length === 1) {
      return {
        decisionId: onTrackIds[0],
        why: "the one decision on the track this spec came out of",
      };
    }
    if (onTrackIds.length > 1) {
      return {
        decisionId: null,
        why: "this spec's track recorded more than one decision, so which one the verdict settles is not on the record",
      };
    }
    return {
      decisionId: null,
      why: "this spec's track recorded no decision that predates the spec",
    };
  } catch (e) {
    return {
      decisionId: null,
      why: `the decision attribution failed: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }
}

/**
 * Record a shipped PRD's real-world outcome: write prds.outcome, adjust the
 * linked opportunity's confidence by verdict (validated +2 / missed -2 /
 * mixed 0, clamped 1..10; ice_score is DB-generated), and append a learnings
 * row carrying the prior/new ICE for the audit trail.
 *
 * THE ONE COPY. `recordOutcome` (the human pressing the button on /learn) and
 * the hourly sweep (an agent settling a verdict it earned the right to settle)
 * both land here. A second copy of this would let an agent-settled outcome
 * close the loop differently from a human-settled one, and then the record
 * would be true about which agent acted and false about what it caused, on the
 * one surface whose entire authority is that the record is true.
 *
 * Returns the CONSEQUENCE, not just the row, because `/learn` renders a
 * receipt rather than a toast (anti-slop.md section 5) and a receipt has to
 * carry what the write actually caused:
 *   · `opportunity` + `opportunityTitle`: the priority that moved, and by how
 *     much.
 *   · `arcHold`: the agent whose promotion this verdict now blocks. Real:
 *     `auto_advance_agent_arc` returns early on any 'missed' learning joined to
 *     a decision that agent made, so an agent still on the observing/proving
 *     arc stops advancing. Null unless that is genuinely true.
 *   · `themeMoved`: the reinforcement seam. `/decide` folds each theme's
 *     decisive outcome record into the ORDER of new bets on the same evidence
 *     (outcomeSupportFromCounts). Null unless the support number actually
 *     changed and there is another bet on the theme for it to move.
 *   · `overturned`: the verdict this one replaced, when it replaced one.
 * All are best-effort except the write itself: a lookup failure never breaks
 * the recorded outcome, it just reports less.
 */
export async function applyOutcome(
  db: SupabaseClient,
  userId: string,
  data: {
    prdId: string;
    verdict: OutcomeVerdict;
    summary: string;
    metricLabel?: string | null;
    metricValue?: string | null;
    by: OutcomeSettledBy;
    /** Agent path only: the mission whose outcome produced this learning. */
    missionId?: string | null;
  },
): Promise<ApplyOutcomeResult> {
  {
    const { data: prd, error: prdErr } = await db
      .from("prds")
      // `created_at` is here for one reason: it is the guard on the track hop in
      // `resolveSettledDecision`. A decision filed on the same track AFTER the
      // spec is a later call, not the one the spec came out of.
      .select("id,workspace_id,opportunity_id,title,outcome,created_at")
      .eq("id", data.prdId)
      .single();
    if (prdErr) throw new Error(prdErr.message);
    const prdTitle = (prd.title as string | null) ?? null;

    const prior = priorSettlement((prd as { outcome?: unknown }).outcome);
    // An agent never overwrites a verdict that is already on the record. It had
    // its chance before the row was settled; after that, disagreeing is a
    // person's move, not a sweep's.
    if (prior && data.by.kind === "agent") {
      throw new Error("This outcome is already settled; an agent does not overwrite one.");
    }

    const now = new Date().toISOString();

    // BYO-P3 WI6 — pull what actually shipped for this PRD (the merged studio
    // changeset's release notes) so the outcome memory records HOW it shipped,
    // not just the verdict. Best-effort: a missing/failed lookup never blocks
    // the outcome.
    type ShippedChangeset = ChangesetForPrd & ChangesetForChangelog;
    let shippedChangeset: ShippedChangeset | null = null;
    let shippedNote = "";
    try {
      const { data: csRows } = await db
        .from("studio_changesets")
        .select(
          "id,workspace_id,user_id,product_id,prd_id,status,title,summary,release_notes,release_notes_at,pr_number,pr_url,updated_at",
        )
        .eq("prd_id", prd.id)
        .order("updated_at", { ascending: false });
      shippedChangeset = pickChangesetForPrd((csRows ?? []) as ShippedChangeset[]);
      // Only assert a ship in the durable memory when the changeset actually
      // MERGED (the same gate the changelog uses) — never write a "Shipped
      // change" claim for a still-open changeset that merely has draft notes.
      if (shippedChangeset && shouldPublishChangelog(shippedChangeset)) {
        shippedNote = `\n\nShipped change: ${(shippedChangeset.release_notes ?? "").trim().slice(0, 600)}`;
      }
    } catch (e) {
      console.error("applyOutcome shipped-changeset lookup failed (non-fatal):", e);
    }

    // prds.outcome is written LAST, once the learning it points at exists. A
    // spec that claims a settled outcome with no learning behind it is the one
    // inconsistency this surface cannot afford.

    let priorIce: number | null = null;
    let newIce: number | null = null;
    let oppTitle: string | null = null;
    let oppThemeId: string | null = null;
    let opportunity: { id: string; prior_ice: number | null; new_ice: number | null } | null = null;

    if (prd.opportunity_id) {
      const { data: opp } = await db
        .from("opportunities")
        .select("id,impact,confidence,ease,ice_score,title,theme_id")
        .eq("id", prd.opportunity_id)
        .maybeSingle();
      if (opp) {
        oppTitle = (opp.title as string | null) ?? null;
        oppThemeId = (opp.theme_id as string | null) ?? null;
        priorIce = opp.ice_score == null ? null : Number(opp.ice_score);
        // On an overturn this is the DIFFERENCE between the two verdicts, not
        // the new verdict's own delta, so the score lands exactly where it
        // would have if the person had settled it in the first place. Getting
        // this wrong would leave the agent's +2 sitting under the human's -2.
        const newConfidence = clampConfidence(
          (opp.confidence ?? 5) + confidenceMoveFor(data.verdict, prior?.verdict ?? null),
        );
        const { error: oppErr } = await db
          .from("opportunities")
          .update({ confidence: newConfidence, updated_at: now })
          .eq("id", opp.id);
        if (oppErr) throw new Error(oppErr.message);
        // ice_score is a GENERATED column — recompute here for the return value
        // and the learning row rather than re-reading.
        newIce = iceOf(opp.impact, newConfidence, opp.ease);
        opportunity = { id: opp.id, prior_ice: priorIce, new_ice: newIce };
      }
    }

    // ONE LEARNING PER OUTCOME.
    //
    // An overturn REPLACES the settled row rather than adding a second one,
    // and it is found by id, not by guessing at the newest row for the spec.
    // The reason is arithmetic, not tidiness: /decide ranks new bets on a theme
    // by counting decisive learnings against it (outcomeSupportFromCounts), so
    // an agent's `validated` left standing beside a human's `missed` would read
    // as one-for-one evidence when in truth the first was withdrawn. The
    // contrast is not lost, it moves to prds.outcome.overturns, where it is
    // structured and queryable instead of being two rows nobody can pair up.
    //
    // prior_ice keeps the value from before ANY verdict touched the bet, so the
    // audit trail still reads prior -> final rather than agent-adjusted -> final.
    const supersedes = prior?.learningId ?? null;
    const overturnSummary = prior
      ? `${data.summary}\n\nOverturned: ${prior.by === "agent" ? `${prior.agentSlug ?? "an agent"} settled this as` : "this was previously settled as"} ${prior.verdict}. A person read it again and called it ${data.verdict}.`
      : data.summary;

    // THE EDGE THE CANON'S CENTRAL SENTENCE NAMES. Resolved before the write so
    // both branches below carry the same answer, and resolved from the SPEC
    // rather than from the caller because three of the four callers are not
    // human and none of them knows which decision it is settling. Fail-soft by
    // construction: `resolveSettledDecision` never throws and returns NULL with
    // a stated reason wherever the record cannot name one.
    const decisionEdge = await resolveSettledDecision(db, {
      id: prd.id as string,
      workspaceId: (prd.workspace_id as string | null) ?? null,
      createdAt: (prd.created_at as string | null) ?? null,
    });

    const learningFields = {
      verdict: data.verdict,
      summary: overturnSummary.slice(0, 4000),
      metric_label: data.metricLabel ?? null,
      metric_value: data.metricValue ?? null,
      new_ice: newIce,
      // A person owning the final word takes the byline off the agent, and the
      // agent's original stays in prds.outcome.overturns.
      recorded_by_agent_slug: data.by.kind === "agent" ? data.by.slug : null,
    };

    let learning: LearningRow | null = null;
    if (supersedes) {
      // P-35: named columns, embedding excluded.
      const { data: updated, error: updErr } = await db
        .from("learnings")
        .update(learningFields)
        .eq("id", supersedes)
        .select(
          "created_at,decision_id,embedding_model,id,is_sample,metric_label,metric_value,mission_id,new_ice,opportunity_id,prd_id,prior_ice,product_id,recorded_by_agent_slug,summary,updated_at,user_id,verdict,workspace_id",
        )
        .single();
      if (updErr) throw new Error(updErr.message);
      learning = updated;
      // prior_ice on the superseded row already holds the pre-verdict score.
      const rowPrior = (updated as { prior_ice?: number | string | null } | null)?.prior_ice;
      priorIce = rowPrior == null ? priorIce : Number(rowPrior);
      // FILL, NEVER OVERWRITE. Every learning written before 2026-08-22 carries
      // no decision, and an overturn — a person disagreeing with an agent — is
      // the highest-signal row this product owns, so it is the last row that
      // should stay unattributed. But the decision a verdict settles does not
      // change because the verdict did, so a row that already names one keeps
      // it: the `.is()` filter is in the WHERE clause rather than in a preceding
      // read, so a concurrent fill loses the race instead of being clobbered.
      if (decisionEdge.decisionId && !(updated as { decision_id?: string | null })?.decision_id) {
        // P-35: named columns, embedding excluded.
        const { data: filled } = await db
          .from("learnings")
          .update({ decision_id: decisionEdge.decisionId })
          .eq("id", supersedes)
          .is("decision_id", null)
          .select(
            "created_at,decision_id,embedding_model,id,is_sample,metric_label,metric_value,mission_id,new_ice,opportunity_id,prd_id,prior_ice,product_id,recorded_by_agent_slug,summary,updated_at,user_id,verdict,workspace_id",
          )
          .maybeSingle();
        if (filled) learning = filled;
      }
    } else {
      const { data: inserted, error: learnErr } = await db
        .from("learnings")
        .insert({
          user_id: userId,
          workspace_id: prd.workspace_id,
          prd_id: prd.id,
          opportunity_id: prd.opportunity_id,
          mission_id: data.missionId ?? null,
          // Null on purpose whenever the record cannot name exactly one call.
          // `decisionEdge.why` says which, and it travels back on the result.
          decision_id: decisionEdge.decisionId,
          prior_ice: priorIce,
          ...learningFields,
        })
        .select()
        .single();
      if (learnErr) throw new Error(learnErr.message);
      learning = inserted;
    }
    const learningId = (learning as { id?: string } | null)?.id ?? null;

    /**
     * THE SPEC -> LEARNING EDGE, the hop that turns a shipped bet into a
     * judgeable one.
     *
     * Found 2026-08-10 by a guard that starts from the CHAIN and asks who
     * writes each hop, rather than testing edges that already exist. No code
     * path in src/ had ever written `child_kind: "learning"`. The eight
     * `decision -> learning` edges in production are seeded, carrying a
     * fabricated `created_by_agent: "strategist"` that makes them read like
     * real agent writes.
     *
     * It is `prd -> learning` and not `decision -> learning` because
     * `learnings` carries `prd_id`, `opportunity_id` and `mission_id` and NO
     * decision reference, so the seeded shape is one the schema cannot
     * actually produce. Writing the edge the data supports is the honest fix;
     * writing the seeded one would need a join that does not exist.
     *
     * Guarded on `learningId` because the row is what the edge points at. The
     * insert above throws on error, but the overturn branch can leave the id
     * null, and an edge pointing at nothing is worse than no edge.
     *
     * Fail-soft and after the fact: a provenance stamp must never fail the
     * outcome write that a person just settled.
     */
    if (learningId) {
      await recordLineageSafe(db, userId, {
        parent_kind: "prd",
        parent_id: prd.id,
        child_kind: "learning",
        child_id: learningId,
        relation: "settled-by",
        rationale: "The outcome recorded against this spec",
        created_by_agent: "learn",
        workspace_id: (prd.workspace_id as string | null) ?? null,
      });
    }

    // ---- The record of who settled it. `prds.outcome` is still the last write
    // in this function; the overturn is computed here because the memory content
    // below has to name the verdict this one replaced.
    const overturned: OutcomeOverturn | null = prior
      ? {
          from_verdict: prior.verdict,
          from_settled_by: prior.by,
          from_agent_slug: prior.agentSlug,
          from_confidence: prior.confidence,
          from_summary: prior.summary,
          from_reason: prior.reason,
          from_evidence: prior.evidence,
          to_verdict: data.verdict,
          at: now,
          note: data.summary.slice(0, 500),
        }
      : null;
    // v6 Phase 2 (W1) — close the compounding loop: distil the outcome into a
    // global, searchable agent_memory so future agent runs recall "we shipped
    // this and it was {verdict}" when they re-encounter the opportunity. The
    // re-score already moved the ICE; this makes the loop actually LEARN, not
    // just record. Best-effort — never let a memory write break the outcome.
    //
    // rememberOutcome ACCUMULATES: it marks the prior outcome memories for this
    // spec superseded and keeps them, so an overturn leaves a walkable chain
    // rather than deleting the agent's original. That pair, "the agent said
    // validated and a person said missed", is the highest-signal thing this
    // product owns, and it used to be destroyed on the way in.
    //
    // IT RUNS BEFORE prds.outcome IS WRITTEN, ON PURPOSE. It used to run after,
    // and a failure there was a console line in a Worker: the spec would carry a
    // settled outcome, leave the pending queue forever, and no surface and no
    // query could tell that its lesson never reached the brain. Running first
    // means the memory id, or the reason there is none, is written INTO the
    // record on the very next statement. `prds.outcome` is still the last write,
    // so the invariant it was ordered for (never claim a settled outcome before
    // the learning it points at exists) is unchanged.
    const settlerNote =
      data.by.kind === "agent"
        ? `\n\nSettled by ${data.by.slug} on the evidence, not by a person.`
        : overturned
          ? `\n\nA person overturned the ${overturned.from_verdict} verdict ${overturned.from_agent_slug ? `${overturned.from_agent_slug} had settled` : "already on file"}.`
          : "";
    const memory = await rememberOutcome(db, {
      userId,
      workspaceId: (prd.workspace_id as string | null) ?? null,
      prdId: prd.id,
      opportunityId: (prd.opportunity_id as string | null) ?? null,
      learningId,
      content:
        buildOutcomeMemory({
          prdTitle: (prd.title as string | null) ?? "",
          oppTitle,
          verdict: data.verdict,
          summary: data.summary,
          priorIce,
          newIce,
        }) +
        shippedNote +
        settlerNote,
      importance: outcomeImportance(data.verdict),
      verdict: data.verdict,
      priorIce,
      newIce,
      prdTitle: (prd.title as string | null) ?? null,
      oppTitle,
    });
    if (memory.error) {
      console.error("applyOutcome rememberOutcome wrote nothing:", memory.error);
    }
    // A memory that exists but sits in the wrong workspace is a different
    // failure from one that was never written, and it used to be no failure at
    // all because nobody read the move's result. It reaches `prds.outcome`
    // below on its own key rather than being folded into `settled_memory_error`,
    // which must keep meaning exactly one thing: no row was written.
    if (memory.workspaceError) {
      console.error(
        "applyOutcome outcome memory not pinned to its workspace:",
        memory.workspaceError,
      );
    }

    const recorded: RecordedOutcome = {
      verdict: data.verdict,
      summary: data.summary,
      metric_label: data.metricLabel ?? null,
      metric_value: data.metricValue ?? null,
      checked_at: now,
      settled_by: data.by.kind,
      settled_by_agent_slug: data.by.kind === "agent" ? data.by.slug : null,
      settled_confidence: data.by.kind === "agent" ? data.by.decision.evidence : null,
      settled_reason: data.by.kind === "agent" ? data.by.decision.reason : null,
      settled_evidence: data.by.kind === "agent" ? data.by.decision.because : null,
      settled_learning_id: learningId,
      // The fields that make a swallowed memory write findable. Exactly one of
      // the first two is set on every settled outcome from here on; the third
      // is independent of both and answers a different question — the row was
      // written, but can it be recalled from the workspace that earned it.
      settled_memory_id: memory.id,
      settled_memory_error: memory.error,
      settled_memory_workspace_error: memory.workspaceError,
      overturns: overturned ? [...(prior?.overturns ?? []), overturned] : (prior?.overturns ?? []),
    };
    // THE LAST WRITE, AND UNTIL NOW ONLY HALF OF IT WAS CHECKED. supabase-js
    // resolves an RLS refusal as a SUCCESS with zero rows and a null error, so
    // `if (outErr)` alone could not tell a written outcome from a refused one,
    // and every reporting key assembled above — `settled_memory_id`,
    // `settled_memory_error`, `settled_memory_workspace_error` — travels through
    // exactly this statement. On a refusal none of them reached the record, the
    // spec still read as unsettled, and `applyOutcome` returned success.
    //
    // IT IS REACHABLE, and the shape is specific rather than theoretical. Pulled
    // from `pg_policy` on 2026-08-06, live RLS on `prds` is: SELECT USING
    // `is_workspace_member(workspace_id)`; UPDATE USING and WITH CHECK
    // `is_workspace_member(workspace_id) AND user_id = auth.uid()`. The read at
    // the top of this function is a plain `.single()` under the SELECT policy,
    // so a workspace member who is NOT the spec's author passes it, gets all the
    // way here, and is refused with no error. The `.select("id")` closes it: the
    // row was read moments ago under a policy this caller satisfies, so "no rows
    // returned" is not "no such row, ever". It is the UPDATE policy saying no —
    // or, narrowly, the row having been DELETED between that read and this
    // statement, which `prds ws delete own` permits its author to do. Both mean
    // the same thing to the caller, so the throw below names RLS as the likely
    // cause rather than the certain one.
    //
    // AND NOTHING ELSE CAN SWALLOW THE RETURNED ROW, which is what actually
    // makes a false refusal impossible here. Verified live 2026-08-06: `prds`
    // carries exactly one trigger, `prds_reactor_fanout`, and it is AFTER
    // INSERT OR UPDATE — there is no BEFORE UPDATE hook that could return NULL
    // and suppress the row. Note for anyone re-deriving this: `updated_at: now`
    // always differing is NOT the reason. UPDATE..RETURNING yields every matched
    // row whether or not a value changed, so a no-op write would return its row
    // too.
    //
    // IT THROWS, and the message names what already landed, because by this
    // point the opportunity's confidence has moved, a `learnings` row exists and
    // `rememberOutcome` may have written an `agent_memory` row. Reporting a
    // clean failure here would be the same lie one level up. The two callers
    // both handle a throw: `recordOutcome` surfaces the message on the Learn
    // receipt, and the agent sweep (outcome-review.server.ts) catches, logs and
    // moves to the next spec without counting it settled.
    const { data: outRows, error: outErr } = await db
      .from("prds")
      .update({ outcome: recorded, updated_at: now })
      .eq("id", prd.id)
      .select("id");
    if (outErr) throw new Error(outErr.message);
    if (!(outRows ?? []).length) {
      throw new Error(
        `Writing the outcome onto spec ${prd.id} matched no rows, so the verdict did not land. Most likely RLS: an UPDATE on prds needs the spec's own author, while reading it needs only workspace membership, so a member who did not write this spec reaches this point and is refused. A spec deleted since it was read looks identical from here. The learning and the confidence change have already landed; the spec itself is still unsettled.`,
      );
    }

    // BYO-P3 WI4/WI6 — ensure the shipped change appears in the in-app changelog.
    // The merge trigger normally materializes it; this is the durable TS fallback
    // (the TS interface is the BYO source of truth if a sync reverts the trigger).
    // Written under the current user so RLS WITH CHECK passes. Best-effort.
    if (shippedChangeset) {
      try {
        const row = changelogRowFor(shippedChangeset, now);
        if (row) {
          await db
            .from("changelog_entries")
            .upsert({ ...row, user_id: userId }, { onConflict: "changeset_id" });
        }
      } catch (e) {
        console.error("recordOutcome changelog publish failed (non-fatal):", e);
      }
    }

    // DBR-1.5 — supersession engine: best-effort, flag-gated inference of typed
    // supersedes/contradicts edges between this outcome and the account's prior
    // decisions (bi-temporal, invalidate-don't-delete). Dormant no-op (zero embed,
    // zero write) unless the founder enables DECISION_BRAIN_SUPERSESSION.
    // inferSupersession is itself fail-safe; this try is belt-and-suspenders so edge
    // inference can never break the recorded outcome.
    try {
      await inferSupersession(db, {
        userId,
        workspaceId: (prd.workspace_id as string | null) ?? null,
        prdId: prd.id,
        opportunityId: (prd.opportunity_id as string | null) ?? null,
        text: [prd.title as string | null, data.summary].filter(Boolean).join(". "),
        verdict: data.verdict,
        summary: data.summary,
        learningId,
        memoryId: memory.id,
        aiEventId: null,
      });
    } catch (e) {
      console.error("inferSupersession failed (non-fatal):", e);
    }

    // DBR-3i — direct validates/contradicts edge: encode the human verdict as a
    // typed graph edge (prd → validates/contradicts → opportunity) so the loop
    // closure is visible in the graph itself, not only in the supersession walk.
    // mixed verdicts write no edge (no clean directional signal). Fail-safe.
    try {
      await inferDirectEdge(db, {
        userId,
        prdId: prd.id,
        opportunityId: (prd.opportunity_id as string | null) ?? null,
        verdict: data.verdict,
      });
    } catch (e) {
      console.error("inferDirectEdge failed (non-fatal):", e);
    }

    // ---- What this verdict cost the crew. -------------------------------
    // auto_advance_agent_arc (20260708150000, canonical body) counts learnings
    // with verdict='missed' joined to a decision this agent made and returns
    // EARLY when there is one, so the agent stops advancing. It only advances
    // an arc of 'observing' or 'proving' in the first place, so an agent
    // already 'trusted' loses nothing and we claim nothing.
    let arcHold: { slug: string; arc: string } | null = null;
    if (data.verdict === "missed") {
      try {
        const decidedBy = await decidingAgentSlug(db, prd.id as string);
        if (decidedBy) {
          const arc = await agentArc(db, userId, decidedBy);
          if (arc === "observing" || arc === "proving") arcHold = { slug: decidedBy, arc };
        }
      } catch (e) {
        console.error("recordOutcome arc lookup failed (non-fatal):", e);
      }
    }

    // ---- What this verdict did to the NEXT bet. -------------------------
    // The reinforcement seam, read the same way /decide reads it: decisive
    // outcomes on a theme move the rank of new bets on the same evidence. The
    // count runs AFTER the insert above, so it includes this verdict; the
    // "before" is this row's own contribution removed. Reported only when the
    // support number genuinely changed and another bet exists to be re-ranked.
    let themeMoved: {
      themeId: string;
      before: number;
      after: number;
      otherBets: number;
    } | null = null;
    if (oppThemeId) {
      try {
        const { data: themeOpps } = await db
          .from("opportunities")
          .select("id")
          .eq("theme_id", oppThemeId);
        const themeOppIds = ((themeOpps ?? []) as Array<{ id: string }>).map((o) => o.id);
        if (themeOppIds.length > 0) {
          const { data: decisive } = await db
            .from("learnings")
            .select("verdict")
            .in("opportunity_id", themeOppIds)
            .in("verdict", ["validated", "missed"]);
          const rows = (decisive ?? []) as Array<{ verdict: string }>;
          const validated = rows.filter((r) => r.verdict === "validated").length;
          const missed = rows.filter((r) => r.verdict === "missed").length;
          const after = outcomeSupportFromCounts(validated, missed);
          // The "before" is this row's own contribution removed and, on an
          // overturn, the verdict it replaced put back, because that one was in
          // the count until a moment ago.
          const wasCounted = (v: OutcomeVerdict): number =>
            (data.verdict === v ? -1 : 0) + (prior?.verdict === v ? 1 : 0);
          const before = outcomeSupportFromCounts(
            validated + wasCounted("validated"),
            missed + wasCounted("missed"),
          );
          const otherBets = themeOppIds.filter((id) => id !== prd.opportunity_id).length;
          if (before !== after && otherBets > 0) {
            themeMoved = { themeId: oppThemeId, before, after, otherBets };
          }
        }
      } catch (e) {
        console.error("recordOutcome theme-support lookup failed (non-fatal):", e);
      }
    }

    return {
      learning,
      opportunity,
      memory_id: memory.id,
      memory_error: memory.error,
      prdTitle,
      opportunityTitle: oppTitle,
      arcHold,
      themeMoved,
      overturned,
      decisionEdge,
    };
  }
}

/**
 * The human path. A person on `/learn` giving, confirming, or overturning a
 * verdict. Everything it does is `applyOutcome`; the only thing this adds is
 * the session, the validation, and the fact that a human pressed it.
 */
export const recordOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        prdId: z.string().uuid(),
        verdict: z.enum(["validated", "missed", "mixed"]),
        summary: z.string().min(1).max(2000),
        metricLabel: z.string().optional(),
        metricValue: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    return applyOutcome(db, context.userId, {
      prdId: data.prdId,
      verdict: data.verdict,
      summary: data.summary,
      metricLabel: data.metricLabel ?? null,
      metricValue: data.metricValue ?? null,
      by: { kind: "human" },
    });
  });

/* ------------------------------------------------------------------------ *
 * Stage 07 can SETTLE. The queue, the projection, the on-demand draft.
 *
 * Before this, `/learn` called exactly two server functions and both were
 * reads, so the last stage of the loop could report an outcome and never
 * capture one. `recordOutcome` was built and no surface in the spine called
 * it. These three close that: what is waiting, what a verdict would cost, and
 * a draft on demand from the agent whose whole job is reading the outcome.
 * ------------------------------------------------------------------------ */

/** The most recent decision on this spec that an AGENT made, if any. Null when
 *  a human made every call, which is the honest answer and not a gap.
 *  Exported for the sweep: the settle-or-ask rule needs to know whose
 *  promotion a miss would hold before it decides it may settle one. */
export async function decidingAgentSlug(db: SupabaseClient, prdId: string): Promise<string | null> {
  const { data } = await db
    .from("decisions")
    .select("decided_by_agent_slug,created_at")
    .eq("prd_id", prdId)
    .not("decided_by_agent_slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data ?? [])[0] as { decided_by_agent_slug?: string | null } | undefined;
  const slug = row?.decided_by_agent_slug;
  return typeof slug === "string" && slug.trim() ? slug : null;
}

/** Where this agent sits on the trust arc, by slug. Null when the workspace has
 *  no agent by that slug or no arc row for it, and a missing arc row means
 *  autonomous by default (SW-7), which is not a hold. */
export async function agentArc(
  db: SupabaseClient,
  userId: string,
  slug: string,
): Promise<string | null> {
  const { data: agent } = await db
    .from("agents")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  const agentId = (agent as { id?: string } | null)?.id;
  if (!agentId) return null;
  const { data: row } = await db
    .from("agent_autonomy")
    .select("arc")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .maybeSingle();
  return ((row as { arc?: string } | null)?.arc as string | null) ?? null;
}

/** One clause of the promise a spec was signed on. */
export type PromisedMetric = {
  text: string;
  /** eval | ci | uat | unverifiable, or null when the clause was never
   *  compiled to an oracle. Carried, not yet rendered. */
  oracleKind: string | null;
};

/**
 * WHAT THE SPEC PROMISED TO MOVE, in the words Plan wrote it in.
 *
 * The STANDING clauses of `prds.contract.success_metrics` — the same field, and
 * the same standing-only rule, that Ship's release document already reads under
 * the heading "What it promised" (`components/ship/WhatShipped.tsx`,
 * `standingClauses`). A superseded clause is skipped: a promise that was
 * withdrawn is not the promise the bet is judged against.
 *
 * THE DEFECT THIS CLOSES. `listPendingOutcomes` already SELECTED `contract` and
 * already read `launch_plans.success_metric`, and collapsed both into a single
 * boolean for the settle-or-ask rule (`metricWasDeclared`). Nothing else
 * crossed the wire, so the Learn desk asked "did this pay off?" with three
 * verdict buttons and nowhere on screen saying what the spec promised to move.
 * The verdict that came back is precedent the ranking reads forever, and it was
 * being given from memory. The join was one line away and this is the line.
 */
function standingPromises(contract: unknown): PromisedMetric[] {
  const metrics = (contract as { success_metrics?: unknown } | null)?.success_metrics;
  if (!Array.isArray(metrics)) return [];
  const out: PromisedMetric[] = [];
  for (const raw of metrics) {
    const c = raw as { text?: unknown; status?: unknown; oracle_kind?: unknown } | null;
    if (!c || typeof c !== "object") continue;
    if (c.status !== "standing") continue;
    const text = typeof c.text === "string" ? c.text.trim() : "";
    if (!text) continue;
    out.push({ text, oracleKind: typeof c.oracle_kind === "string" ? c.oracle_kind : null });
  }
  return out;
}

/** A launch plan's own success metric, trimmed, or null when it carries none. */
function planMetricOf(raw: string | null | undefined): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export type PendingOutcome = {
  prdId: string;
  title: string;
  /** Which workspace this bet lives in. The desk is the RLS union across every
   *  workspace the caller belongs to; the record beside it (`getImpactLedger`,
   *  `listLearnings`) is one workspace at a time. A surface that shows both has
   *  to point the second at the first, or settling a bet moves numbers the
   *  reader cannot see. Null only if the row somehow carries none. */
  workspaceId: string | null;
  shippedAt: string | null;
  /** What this spec promised to move, from its own Outcome Contract. Empty when
   *  the spec never carried one — which the desk says out loud rather than
   *  leaving the question silently unanswered. */
  promised: PromisedMetric[];
  /** The launch plan's own success metric, when a launch plan was written. A
   *  second, narrower statement of the same promise. Null when there is none. */
  planMetric: string | null;
  opportunity: {
    id: string;
    title: string | null;
    /** Today's score. Null when the row carries none; never printed as zero. */
    priorIce: number | null;
    /** What each verdict WOULD move it to, from the same arithmetic the write
     *  runs. Null when the linked opportunity could not be read. */
    projected: { validated: number; mixed: number; missed: number } | null;
  } | null;
  /** The agent that made the call being judged. Attribution, and the reason a
   *  missed verdict has a cost beyond the score. */
  decidedBy: { slug: string; arc: string | null; holdsPromotion: boolean } | null;
  suggestion: OutcomeSuggestion | null;
  /**
   * WHY THIS IS STILL YOURS.
   *
   * Recomputed here with the SAME pure function the hourly sweep decides with
   * (`classifyOutcomeSettlement`), against the same inputs. That is deliberate:
   * a queue that showed a reason the sweep did not act on would be worse than
   * no reason at all. Null only when there is no verdict on the table yet to
   * judge, which happens before anything has been drafted for the spec.
   *
   * `action` is effectively always "escalate" for a row sitting here, because a
   * settled one is no longer pending. It is carried anyway so the surface can
   * tell "the agent looked and asked" apart from "the window has not closed".
   */
  settlement: SettlementDecision | null;
  /** The verdict the agent would have put on the record. */
  verdictOnTable: OutcomeVerdict | null;
};

/** An outcome an agent settled on its own, and everything a person needs to
 *  disagree with it. */
export type AgentSettledOutcome = {
  prdId: string;
  title: string;
  /** Which workspace this bet lives in, for the same reason
   *  `PendingOutcome.workspaceId` carries one: a person reconsidering an
   *  agent's verdict is looking at a bet that may not live in the workspace the
   *  record on the page is drawn from, and an overturn writes into the bet's
   *  workspace, not the page's. */
  workspaceId: string | null;
  settledAt: string | null;
  /** What the spec promised to move, same source and same rule as
   *  `PendingOutcome.promised`. Overturning an agent's verdict writes the same
   *  permanent precedent a first verdict does, so it is judged against the same
   *  promise rather than from memory. */
  promised: PromisedMetric[];
  verdict: OutcomeVerdict;
  summary: string;
  metricLabel: string | null;
  metricValue: string | null;
  agentSlug: string | null;
  /** The agent's own 0..1 evidence score when it settled. */
  confidence: number | null;
  reason: string | null;
  evidence: string[];
  overturns: OutcomeOverturn[];
  opportunity: {
    id: string;
    title: string | null;
    /** Where the score stands NOW, with the agent's verdict already applied. */
    priorIce: number | null;
    /** Where each verdict would put it if a person overturns to that one, from
     *  the same overturn arithmetic the write runs. */
    projected: { validated: number; mixed: number; missed: number } | null;
  } | null;
};

/**
 * Every unsettled outcome a person can be asked to call, newest first. This is
 * the queue stage 07 exists to drain.
 *
 * TWO POPULATIONS, AND IT USED TO CARRY ONLY ONE.
 *
 *  1. Specs that shipped and carry no outcome. The original queue.
 *  2. Specs whose measurement window has CLOSED and carry no outcome, shipped
 *     or not: a `launch_plans.check_by` in the past.
 *
 * The second was missing and that was a hole, not a scope choice. The hourly
 * sweep (`runOutcomeReviews`) selects its candidates from exactly population 2
 * and never looks at `shipped_at`, and when it declines to settle one it writes
 * NOTHING on purpose, with the comment "the window stays in the human queue"
 * (ai/outcome-review.server.ts). A queue narrower than the sweep that feeds it
 * silently drops every one of those asks. Worse, the sweep's own
 * `verdictIsRecordFact` names the case this filter guaranteed a person could
 * never see: the window closed and the spec never shipped, which is the most
 * ordinary real outcome there is and the one a `shipped_at NOT NULL` filter
 * excludes by construction.
 *
 * Measured on production the day this changed, the union adds zero rows, which
 * is the honest state of the record and not a reason to leave the hole in.
 */
/**
 * DEFER AN OUTCOME INSTEAD OF JUDGING IT.
 *
 * The Learn gate offered three exits -- validated, missed, mixed -- and
 * `learnings.verdict` is constrained to exactly those. So a person holding a bet
 * that shipped last week had to write a permanent verdict or walk away. Those
 * rows are the precedent pool the ranking reads, so a verdict given early does
 * not sit still; it compounds into every later recommendation.
 *
 * WRITES ON `prds`, NOT `launch_plans`. The first version of this rode
 * `launch_plans.check_by`, which already existed. It has a hole: launch plan
 * rows are created by the user-triggered "generate launch plan" action, are not
 * guaranteed at ship time, and `positioning` is NOT NULL and AI-generated, so a
 * row cannot be created on the fly to defer against. `rearmOutcomeCheck` ends in
 * `.single()`, which THROWS on zero rows -- so the button would have errored on
 * exactly the case it exists for: a freshly shipped spec nobody has written a
 * launch plan for. A spec row always exists for a shipped spec, by definition.
 *
 * The count is kept because it is SIGNAL. A bet deferred four times is a bet
 * whose metric never moves, and that is worth surfacing rather than hiding.
 */
export const deferOutcomeCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ prdId: z.string().uuid(), days: z.number().int().min(1).max(365).default(14) })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ checkBy: string; deferredCount: number }> => {
    const { supabase } = context;
    const now = new Date();
    const checkBy = new Date(now.getTime() + data.days * 86_400_000).toISOString();

    // Read the count first so the increment is honest. Two people deferring the
    // same bet in the same second is not a case worth a transaction here: the
    // worst outcome is a count one low on a field nothing gates on.
    const { data: before } = await supabase
      .from("prds")
      .select("outcome_deferred_count")
      .eq("id", data.prdId)
      .maybeSingle();
    const nextCount =
      ((before as { outcome_deferred_count?: number | null } | null)?.outcome_deferred_count ?? 0) +
      1;

    /**
     * CHECKED, BECAUSE supabase-js RESOLVES A REFUSED WRITE. An RLS refusal
     * comes back as success with zero rows, so without `.select()` and an empty
     * check this would report "you gave it more time" over a bet that is still
     * sitting on the desk, due now, exactly as before.
     */
    const { data: rows, error } = await supabase
      .from("prds")
      .update({
        outcome_check_by: checkBy,
        outcome_deferred_at: now.toISOString(),
        outcome_deferred_count: nextCount,
      })
      .eq("id", data.prdId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("The check date did not move. You may not have rights on this spec.");
    }
    return { checkBy, deferredCount: nextCount };
  });

export const listPendingOutcomes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ pending: PendingOutcome[] }> => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;
    return readPendingOutcomes(db, userId);
  });

/**
 * ── NINE ROUND TRIPS FOR 964 BYTES (2026-09-09) ──────────────────────────────
 *
 * The run screen read this desk at a `worker-total` of 1.2 to 2.0 s. Not one
 * of its queries is slow; the cost was the SHAPE, the same one the approvals
 * queue and the mission detail paid before: nine sequential Worker-to-PostgREST
 * round trips on a live desk (the two populations, then the due specs, their
 * opportunities, their launch plans, the workspace policy, the theme siblings,
 * the deciding agents, their arcs), at ~275 ms warm / ~550 ms cold per hop on
 * this deployment.
 *
 * NOW TWO. The first hop reads both populations together and every fact that
 * hangs off a spec row by a foreign key rides along as an embed: the launch
 * plan (one per spec, `launch_plans.prd_id` is UNIQUE) and the agent-made
 * decisions. The window-closed population is read from `launch_plans` with
 * its spec embedded `!inner`, so the plan IS the row and the spec arrives
 * with it. The second hop is everything keyed on what the first returned, in
 * one `Promise.all`: the opportunities (no foreign key from `prds`, so no
 * embed), the theme siblings, the workspace policy and the deciding agents
 * with their arc embedded (`agent_autonomy.agent_id` is a foreign key).
 *
 * THE THEME SIBLINGS USED TO BE A THIRD HOP, keyed on theme ids only the
 * opportunities read could supply. They are read by the desk's own workspaces
 * instead, `id,theme_id` on every themed opportunity there, and counted in
 * memory. Measured on production the day this changed: 6 to 12 themed
 * opportunities per workspace, so the wider read is a dozen rows of two ids
 * against a hop of a quarter to half a second. `prds.workspace_id` and
 * `opportunities.workspace_id` are NOT NULL since the tenancy migrations, and
 * a spec's opportunity lives in the spec's workspace, so the scope loses no
 * sibling the old read counted.
 *
 * Guarded by `a-pending-outcomes-read-is-2-hops.test.ts`, which drives this
 * function on the wire that counts rounds with every branch live.
 */
export async function readPendingOutcomes(
  db: SupabaseClient,
  userId: string,
): Promise<{ pending: PendingOutcome[] }> {
  type DecisionRow = {
    prd_id: string | null;
    decided_by_agent_slug: string | null;
    created_at: string;
  };
  type PlanFacts = { success_metric: string | null; workspace_id: string | null };
  type PrdRow = {
    id: string;
    title: string | null;
    shipped_at: string | null;
    opportunity_id: string | null;
    outcome_suggestion: OutcomeSuggestion | null;
    contract: unknown;
    workspace_id: string | null;
    decisions?: DecisionRow[] | null;
  };
  /**
   * `workspace_id` RIDES ALONG BECAUSE THE DESK IS A UNION AND THE RECORD IS
   * NOT.
   *
   * This query applies no workspace filter at all, deliberately: RLS admits
   * every workspace the caller belongs to, so the desk is "every bet anywhere
   * that needs your call". The Learn page beside it reads `getImpactLedger`,
   * which is ONE workspace and defaults to `current_user_default_workspace()`
   * (the earliest `workspace_members` row). Those two are routinely different
   * workspaces, and when they are, settling a bet writes
   * `learnings.workspace_id = prds.workspace_id` and changes nothing the page
   * shows. Carrying the column here is what lets the surface point the record
   * at the same workspace as the bet in focus. Nothing new is queried; it is
   * one more column on a row already being read.
   */
  const PRD_COLS = "id,title,shipped_at,opportunity_id,outcome_suggestion,contract,workspace_id";
  // Newest agent-made decision per spec, and the launch plan's promise. Both
  // hang off the spec by a foreign key, so they ride the spec read rather than
  // costing a hop each. The decisions are ordered and filtered in memory: a
  // spec carries a handful, and the nested path the window-closed read would
  // need for a server-side order is one more thing to get wrong for nothing.
  const DECISIONS_EMBED = "decisions(prd_id,decided_by_agent_slug,created_at)";
  // workspace_id rides along because the settle-or-ask bar is workspace
  // policy now, and the sweep keys it off exactly this column.
  const PLAN_EMBED = "launch_plans(success_metric,workspace_id)";
  const nowIso = new Date().toISOString();

  // The same two reads the sweep makes, run together. `check_by` is the
  // workspace's own stated measurement window, so a closed one is the
  // workspace saying the answer is due, not this surface deciding it is.
  const [shippedRes, dueRes] = await Promise.all([
    db
      .from("prds")
      .select(`${PRD_COLS},${PLAN_EMBED},${DECISIONS_EMBED}`)
      .is("outcome", null)
      .not("shipped_at", "is", null)
      /**
       * A BET SOMEBODY SAID WAS TOO EARLY IS NOT DUE YET.
       *
       * `outcome_check_by` in the future means a person looked at this and
       * deferred it rather than judging it. Without this clause the deferral
       * did nothing visible: the bet reappeared at the top of the desk on the
       * next load, which teaches people the button is broken and pushes them
       * back toward writing a verdict they do not believe.
       *
       * `or` rather than a plain `lte`, because NULL is the overwhelming
       * majority -- every spec that has never been deferred -- and a bare
       * comparison drops NULLs in SQL. That would have emptied the desk of
       * everything except previously-deferred bets, which is the loudest
       * possible way to get this wrong and still look like it works.
       */
      .or(`outcome_check_by.is.null,outcome_check_by.lte.${nowIso}`)
      .order("shipped_at", { ascending: false })
      .limit(12),
    db
      .from("launch_plans")
      // The spec rides the plan: `!inner` so a plan whose spec fails the
      // filters below is not a row, and the plan's own metric and workspace
      // are the facts the settle-or-ask rule reads for it.
      .select(
        `prd_id,check_by,success_metric,workspace_id,prds!inner(${PRD_COLS},${DECISIONS_EMBED})`,
      )
      .not("check_by", "is", null)
      .lte("check_by", nowIso)
      .is("prds.outcome", null)
      /**
       * THE SAME DEFERRAL CLAUSE AS THE SHIPPED HALF, AND IT WAS MISSING HERE.
       *
       * `deferOutcomeCheck` writes `prds.outcome_check_by`, and only the
       * shipped query above read it. So a spec that ALSO carried a passed
       * `launch_plans.check_by` was excluded by the first query and put
       * straight back by this one, on the very next refetch. The receipt says
       * "It comes back to this desk on <date+14>" and it came back
       * immediately, which is the button promising something the code did not
       * do. Migration 20260806100000 backfilled `prds.outcome_check_by` from
       * `launch_plans.check_by` precisely because these two are meant to be
       * one date; reading it in one place and not the other split them again.
       *
       * `or` and not a bare `lte`, for the same reason as above: NULL is the
       * overwhelming majority and a comparison drops NULLs in SQL, which
       * would silently narrow this population to previously-deferred specs.
       */
      .or(`outcome_check_by.is.null,outcome_check_by.lte.${nowIso}`, { referencedTable: "prds" })
      .order("check_by", { ascending: true })
      .limit(60),
  ]);
  if (shippedRes.error) throw new Error(shippedRes.error.message);

  /** A to-one embed answers as an object; the same shape as a list is read too,
   *  so a constraint that differs between environments cannot blank a fact. A
   *  declaration and not a generic arrow: the repo's guards parse this file as
   *  TSX, where `<T>(v) =>` reads as a JSX element and swallows the rest. */
  function firstOf<T>(v: T | T[] | null | undefined): T | null {
    return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  }

  type ShippedRow = PrdRow & { launch_plans?: PlanFacts | PlanFacts[] | null };
  type DueRow = PlanFacts & { prd_id: string | null; prds: PrdRow | PrdRow[] | null };

  const byId = new Map<string, PrdRow>();
  // 1. What the bet promised to measure.
  const planByPrd = new Map<string, PlanFacts>();
  for (const p of (shippedRes.data ?? []) as ShippedRow[]) {
    byId.set(p.id, p);
    const plan = firstOf(p.launch_plans);
    if (plan) {
      planByPrd.set(p.id, { success_metric: plan.success_metric, workspace_id: plan.workspace_id });
    }
  }

  // A read failure here narrows the queue back to the shipped half rather
  // than blanking it: fewer asks beats none. RLS already scopes the rows. It
  // is said out loud, because a desk missing its window-closed half looks
  // exactly like a desk that has none.
  if (dueRes.error) {
    console.error(
      `[pending-outcomes] the window-closed half could not be read: ${dueRes.error.message}`,
    );
  }
  for (const r of (dueRes.data ?? []) as DueRow[]) {
    const p = firstOf(r.prds);
    if (!p || byId.has(p.id)) continue;
    byId.set(p.id, p);
    planByPrd.set(p.id, { success_metric: r.success_metric, workspace_id: r.workspace_id });
  }

  // Shipped first and newest ship first, exactly as before; the window-closed
  // rows follow in the order their windows came due. Nothing is dropped from
  // what the queue used to show.
  const prds = [...byId.values()].slice(0, 12);
  if (prds.length === 0) return { pending: [] };

  // Newest agent-made decision per spec. Sorted newest first, so the first
  // row seen for a spec wins.
  const slugByPrd = new Map<string, string>();
  for (const p of prds) {
    const agentMade = (p.decisions ?? [])
      .filter(
        (d): d is DecisionRow & { decided_by_agent_slug: string } => !!d.decided_by_agent_slug,
      )
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    if (agentMade.length > 0) slugByPrd.set(p.id, agentMade[0].decided_by_agent_slug);
  }

  const oppIds = [...new Set(prds.map((p) => p.opportunity_id).filter((v): v is string => !!v))];
  const wsIds = [...new Set(prds.map((p) => p.workspace_id).filter((v): v is string => !!v))];
  const slugs = [...new Set(slugByPrd.values())];

  type OppRow = {
    id: string;
    title: string | null;
    impact: number | null;
    confidence: number | null;
    ease: number | null;
    ice_score: number | string | null;
    theme_id: string | null;
  };
  type AgentRow = { id: string; slug: string; agent_autonomy?: Array<{ arc: string }> | null };
  const none = Promise.resolve({ data: [] as never[] });

  // Everything keyed on the first hop, in one go. Each list is batched so the
  // queue stays one round of queries rather than one per row.
  const [oppRes, siblingRes, policies, agentRes] = await Promise.all([
    oppIds.length > 0
      ? db
          .from("opportunities")
          .select("id,title,impact,confidence,ease,ice_score,theme_id")
          .in("id", oppIds)
      : none,
    // 2. How far a verdict propagates: other bets on the same theme re-rank.
    wsIds.length > 0
      ? db
          .from("opportunities")
          .select("id,theme_id")
          .in("workspace_id", wsIds)
          .not("theme_id", "is", null)
      : none,
    // The same policy read the sweep makes, so a row can never show a reason
    // the sweep did not act on. A spec with no launch plan, or a workspace that
    // has stated nothing, falls back to the bar the product ships with.
    loadAutonomyPolicies(
      db,
      [...planByPrd.values()].map((p) => p.workspace_id),
    ),
    slugs.length > 0
      ? db
          .from("agents")
          .select("id,slug,agent_autonomy(arc)")
          .eq("user_id", userId)
          .in("slug", slugs)
          .eq("agent_autonomy.user_id", userId)
      : none,
  ]);

  const oppById = new Map<string, OppRow>();
  for (const o of (oppRes.data ?? []) as OppRow[]) oppById.set(o.id, o);

  const siblingsByTheme = new Map<string, number>();
  for (const r of (siblingRes.data ?? []) as Array<{ id: string; theme_id: string | null }>) {
    if (!r.theme_id) continue;
    siblingsByTheme.set(r.theme_id, (siblingsByTheme.get(r.theme_id) ?? 0) + 1);
  }

  const arcBySlug = new Map<string, string>();
  for (const a of (agentRes.data ?? []) as AgentRow[]) {
    const arc = firstOf(a.agent_autonomy)?.arc;
    if (arc) arcBySlug.set(a.slug, arc);
  }

  const pending: PendingOutcome[] = prds.map((p) => {
    const opp = p.opportunity_id ? (oppById.get(p.opportunity_id) ?? null) : null;
    const slug = slugByPrd.get(p.id) ?? null;
    const arc = slug ? (arcBySlug.get(slug) ?? null) : null;
    const holdsPromotion = arc === "observing" || arc === "proving";

    // The verdict the agent would have put on the record, read the same way
    // the sweep reads it.
    //
    // `verdictIsRecordFact` is computed here rather than hardcoded false. It
    // was false because the query admitted shipped specs only; now that a
    // closed measurement window also puts a spec on this desk, the unshipped
    // case is reachable and it is exactly the one the sweep calls a fact of
    // the calendar rather than a reading of what happened. Leaving the
    // constant would have printed a reason the sweep did not act on, which
    // this file holds to be worse than printing none.
    const verdictOnTable = asVerdict(p.outcome_suggestion?.verdict);
    const planWorkspaceId = planByPrd.get(p.id)?.workspace_id ?? null;
    const settlement = verdictOnTable
      ? decideSettlement(
          {
            verdict: verdictOnTable,
            verdictIsRecordFact: !p.shipped_at && verdictOnTable === "missed",
            metricDeclared: metricWasDeclared(
              planByPrd.get(p.id)?.success_metric ?? null,
              gradeOutcomeContract(
                (p.contract ?? null) as { success_metrics?: ContractClause[] | null } | null,
              ).verdict,
            ),
            metricObserved: metricWasObserved(p.outcome_suggestion),
            basis: basisFor(p.outcome_suggestion),
            impact: opp ? (opp.impact ?? null) : null,
            otherBetsOnTheme: opp?.theme_id
              ? Math.max(0, (siblingsByTheme.get(opp.theme_id) ?? 1) - 1)
              : 0,
            movesTheScore: VERDICT_CONFIDENCE_DELTA[verdictOnTable] !== 0,
            holdsPromotionFor: slug && holdsPromotion ? agentDisplayName(slug) : null,
          },
          (planWorkspaceId ? policies.get(planWorkspaceId) : null) ?? SHIPPED_AUTONOMY_POLICY,
        )
      : null;

    return {
      prdId: p.id,
      title: (p.title ?? "").trim() || "Untitled spec",
      workspaceId: p.workspace_id ?? null,
      shippedAt: p.shipped_at,
      // Both were already in hand: `contract` is on the row this map is
      // reading, and the launch plan's metric is in `planByPrd`, which rode
      // the same read for the settle-or-ask rule. Nothing new is queried.
      promised: standingPromises(p.contract),
      planMetric: planMetricOf(planByPrd.get(p.id)?.success_metric),
      opportunity: opp
        ? {
            id: opp.id,
            title: opp.title,
            priorIce: opp.ice_score == null ? null : Number(opp.ice_score),
            projected: {
              validated: iceOf(
                opp.impact,
                clampConfidence((opp.confidence ?? 5) + VERDICT_CONFIDENCE_DELTA.validated),
                opp.ease,
              ),
              mixed: iceOf(
                opp.impact,
                clampConfidence((opp.confidence ?? 5) + VERDICT_CONFIDENCE_DELTA.mixed),
                opp.ease,
              ),
              missed: iceOf(
                opp.impact,
                clampConfidence((opp.confidence ?? 5) + VERDICT_CONFIDENCE_DELTA.missed),
                opp.ease,
              ),
            },
          }
        : null,
      decidedBy: slug ? { slug, arc, holdsPromotion } : null,
      suggestion: p.outcome_suggestion ?? null,
      settlement,
      verdictOnTable,
    };
  });

  return { pending };
}

/**
 * Outcomes an AGENT settled, newest first, and everything a person needs to
 * overturn one.
 *
 * This exists because of the shape of the change that made agents settle at
 * all. Autonomy is paid for with evidence, and the payment only clears if the
 * evidence is READABLE: an agent-settled verdict a person cannot find is not
 * autonomy, it is a write nobody agreed to. So every settlement lands here with
 * its confidence, the facts it rested on, and the score movement an overturn
 * would cause, priced before the click exactly as the pending queue prices a
 * first verdict.
 */
export const listAgentSettledOutcomes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ settled: AgentSettledOutcome[] }> => {
    const db = context.supabase as unknown as SupabaseClient;

    type PrdRow = {
      id: string;
      title: string | null;
      opportunity_id: string | null;
      outcome: unknown;
      contract: unknown;
      workspace_id: string | null;
    };
    const { data: prdRows, error } = await db
      .from("prds")
      // `contract` rides along for the same reason the pending queue carries
      // it: a person disagreeing with an agent's verdict is writing precedent,
      // and has to be able to read what the spec promised while doing it.
      // `workspace_id` rides along so the surface can point the record it draws
      // beside this list at the same workspace as the bet being reconsidered.
      .select("id,title,opportunity_id,outcome,contract,workspace_id")
      // Repo jsonb-filter convention (see rememberOutcome): `col->>key`.
      .filter("outcome->>settled_by", "eq", "agent")
      .order("updated_at", { ascending: false })
      .limit(8);
    if (error) throw new Error(error.message);
    const prds = (prdRows ?? []) as PrdRow[];
    if (prds.length === 0) return { settled: [] };

    type OppRow = {
      id: string;
      title: string | null;
      impact: number | null;
      confidence: number | null;
      ease: number | null;
      ice_score: number | string | null;
    };
    const oppById = new Map<string, OppRow>();
    const oppIds = [...new Set(prds.map((p) => p.opportunity_id).filter((v): v is string => !!v))];
    if (oppIds.length > 0) {
      const { data } = await db
        .from("opportunities")
        .select("id,title,impact,confidence,ease,ice_score")
        .in("id", oppIds);
      for (const o of (data ?? []) as OppRow[]) oppById.set(o.id, o);
    }

    const settled: AgentSettledOutcome[] = [];
    for (const p of prds) {
      const prior = priorSettlement(p.outcome);
      if (!prior || prior.by !== "agent") continue;
      const o = p.outcome as RecordedOutcome;
      const opp = p.opportunity_id ? (oppById.get(p.opportunity_id) ?? null) : null;
      // The confidence axis already carries the agent's move, so an overturn
      // projects from HERE by the difference between the two verdicts.
      const projectedFor = (target: OutcomeVerdict): number =>
        iceOf(
          opp!.impact,
          clampConfidence((opp!.confidence ?? 5) + confidenceMoveFor(target, prior.verdict)),
          opp!.ease,
        );
      settled.push({
        prdId: p.id,
        title: (p.title ?? "").trim() || "Untitled spec",
        workspaceId: p.workspace_id ?? null,
        settledAt: typeof o?.checked_at === "string" ? o.checked_at : null,
        promised: standingPromises(p.contract),
        verdict: prior.verdict,
        summary: typeof o?.summary === "string" ? o.summary : "",
        metricLabel: typeof o?.metric_label === "string" ? o.metric_label : null,
        metricValue: typeof o?.metric_value === "string" ? o.metric_value : null,
        agentSlug: prior.agentSlug,
        confidence: prior.confidence,
        reason: prior.reason,
        evidence: prior.evidence,
        overturns: prior.overturns,
        opportunity: opp
          ? {
              id: opp.id,
              title: opp.title,
              priorIce: opp.ice_score == null ? null : Number(opp.ice_score),
              projected: {
                validated: projectedFor("validated"),
                mixed: projectedFor("mixed"),
                missed: projectedFor("missed"),
              },
            }
          : null,
      });
    }
    return { settled };
  });

/**
 * Draft (or refresh) the provisional outcome suggestion for one shipped spec,
 * on demand. Same chain the hourly outcome-tick runs: ship detection is the
 * trigger, the Historian is the AI half, and SEN-05 usage deltas plus the
 * BYO-P3 changeset join set the confidence tier. Persists to
 * `prds.outcome_suggestion`, never overwrites a human-recorded outcome, and
 * returns null rather than inventing a verdict when there is no signal.
 *
 * Dynamically imported so `outcome-suggestion.server` (which imports
 * `draftOutcomeVerdict` from this module) never forms an eval-time cycle.
 */
export const draftOutcomeSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prdId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ suggestion: OutcomeSuggestion | null }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { generateOutcomeSuggestion } = await import("@/lib/outcome-suggestion.server");
    const suggestion = await generateOutcomeSuggestion(db, context.userId, data.prdId);
    return { suggestion };
  });

// LRN-02 · Historian verdict. The outcome card was purely manual (the human
// picks a verdict + types what happened). This adds the "predicted vs actual,
// Historian verdict" half from the v10 blueprint: an AI assist that restates
// what was PREDICTED when the bet was committed (the opportunity's problem /
// hypothesis / expected ICE, and — post-H2, once synced — its roadmap outcome +
// measure) and proposes a verdict + summary against the ACTUAL signal so far.
// This function itself only DRAFTS and never writes. What happens to the draft
// changed on 2026-08-02: it used to be that a human always confirmed it, so the
// rescore and the memory write were human-gated by construction. Now the sweep
// puts the draft on the record itself when classifyOutcomeSettlement says the
// evidence carries it, and asks a person when it does not. The gate moved from
// "every verdict" to "the verdicts that are genuinely judgment"; the drafting
// contract here is unchanged. Reuses surface:"judge" (the Historian is an
// assessor) so it rides the AI chokepoint without touching runtime.server.
const HISTORIAN_MODEL = "google/gemini-2.5-flash";

const HISTORIAN_SYSTEM =
  "You are the Historian: the agent that closes the product loop by honestly scoring a shipped bet against what was predicted. " +
  "You receive the PREDICTION (the problem, hypothesis, and expected impact captured when the work was committed) and the ACTUAL signal known so far (a metric and/or the operator's notes; either may be thin or empty). " +
  'Compare them and return ONLY JSON: {"predicted": one plain sentence restating what we expected, "verdict": "validated" | "missed" | "mixed", "summary": two or three plain sentences on predicted vs actual and why}. ' +
  "'validated' = the bet paid off; 'missed' = it did not; 'mixed' = partial or unclear. " +
  "If the actual is unknown, base the verdict on the available signal and say it is provisional. Be honest, specific, and concise; no preamble.";

export type OutcomeVerdict = "validated" | "missed" | "mixed";

/**
 * Historian draft core: restates the PREDICTION (the opportunity's problem /
 * hypothesis / expected ICE) against the ACTUAL signal (a metric and/or
 * notes) and proposes a verdict + summary. Only drafts — never writes.
 * Factored out of `suggestOutcomeVerdict` (RF-01) so the same drafting logic
 * is reusable from a cron context (no live request/session) as well as the
 * human-triggered "Draft with Historian" button.
 */
export async function draftOutcomeVerdict(
  db: SupabaseClient,
  userId: string,
  data: { prdId: string; metricLabel?: string; metricValue?: string; notes?: string },
): Promise<{ predicted: string; verdict: OutcomeVerdict; summary: string }> {
  const { data: prd, error: prdErr } = await db
    .from("prds")
    .select("id, title, opportunity_id, workspace_id")
    .eq("id", data.prdId)
    .single();
  if (prdErr) throw new Error(prdErr.message);

  // The prediction substrate = the linked opportunity. Named columns (P-35):
  // roadmap_outcome/roadmap_measure are in the schema now, so select("*")'s
  // pre-migration tolerance is no longer needed, and it named an embedding
  // vector nothing here reads.
  let opp: Record<string, unknown> | null = null;
  if (prd.opportunity_id) {
    const { data: o } = await db
      .from("opportunities")
      .select(
        "confidence,created_at,critic_review,ease,embedding_model,goal_id,hypothesis,ice_score,id,impact,is_public,is_sample,linked_brief_item_id,posthog_event,problem,product_id,project_id,roadmap_bucket,roadmap_last_agent_slug,roadmap_measure,roadmap_outcome,roadmap_snapshot_before,share_slug,status,target_user,theme_id,title,updated_at,user_id,workspace_id",
      )
      .eq("id", prd.opportunity_id)
      .maybeSingle();
    opp = (o as Record<string, unknown> | null) ?? null;
  }

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const predictionParts: string[] = [];
  if (str(prd.title)) predictionParts.push(`Spec: ${prd.title}.`);
  if (opp) {
    if (str(opp.problem)) predictionParts.push(`Problem: ${opp.problem}.`);
    if (str(opp.hypothesis)) predictionParts.push(`Hypothesis: ${opp.hypothesis}.`);
    if (str(opp.roadmap_outcome))
      predictionParts.push(`Committed outcome: ${opp.roadmap_outcome}.`);
    if (str(opp.roadmap_measure))
      predictionParts.push(`Committed measure: ${opp.roadmap_measure}.`);
    if (opp.ice_score != null) {
      predictionParts.push(
        `Predicted ICE ${Number(opp.ice_score).toFixed(1)} (impact ${opp.impact}, confidence ${opp.confidence}, ease ${opp.ease}).`,
      );
    }
  }
  const prediction = predictionParts.join(" ") || "No recorded prediction.";

  const actualParts: string[] = [];
  if (data.metricLabel || data.metricValue) {
    actualParts.push(
      `Metric (${data.metricLabel ?? "value"}): ${data.metricValue ?? "(no value)"}.`,
    );
  }
  if (str(data.notes)) actualParts.push(`Operator notes: ${data.notes!.trim()}.`);
  const actual = actualParts.join(" ") || "No actual result captured yet.";

  const result = await callModel(db as never, userId, {
    surface: "judge",
    surface_ref: `historian:outcome:${prd.id}`,
    model: HISTORIAN_MODEL,
    responseFormat: "json_object",
    workspaceId: (prd.workspace_id as string | null) ?? null,
    messages: [
      { role: "system", content: HISTORIAN_SYSTEM },
      { role: "user", content: `PREDICTION:\n${prediction}\n\nACTUAL:\n${actual}` },
    ],
  });

  const parsed = (result.json ?? {}) as {
    predicted?: string;
    verdict?: string;
    summary?: string;
  };
  const verdict =
    parsed.verdict === "validated" || parsed.verdict === "missed" || parsed.verdict === "mixed"
      ? parsed.verdict
      : ("mixed" as const);
  return {
    predicted: (parsed.predicted ?? "").slice(0, 280),
    verdict,
    summary: (parsed.summary ?? "").slice(0, 2000),
  };
}

export const suggestOutcomeVerdict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        prdId: z.string().uuid(),
        metricLabel: z.string().max(200).optional(),
        metricValue: z.string().max(200).optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    return draftOutcomeVerdict(db, context.userId, data);
  });

const ListLearningsSchema = z
  .object({
    /** Narrow to ONE workspace. See the docblock for why this is not the
     *  default and never can be resolved here. */
    workspaceId: z.string().uuid().nullable().optional(),
    /** Only learnings that actually moved a score (`new_ice is not null`). */
    movedScoreOnly: z.boolean().optional(),
  })
  .strip();

/** Latest 50 learnings, newest first. Each row carries the title of the
 *  opportunity it rescored (`opportunity_title`) so callers can NAME the
 *  priority a learning moved — "this learning moved THESE priorities"
 *  (MOAT-VIS) — without a second query. The embed rides RLS; a learning with no
 *  opportunity (or one in another workspace) reads `opportunity_title: null`.
 *
 * WHAT "WORKSPACE-SCOPED VIA RLS" ACTUALLY MEANS, because the old version of
 * this line said it and it was read as more than it is. The `learnings` policy
 * admits EVERY workspace the caller belongs to, and every account is handed a
 * seeded Explore workspace at signup. So the unfiltered top-50 is the union
 * across all of them, and on a real-but-empty workspace it is mostly seeded
 * rows. That is fine for a surface that means "everything you have learned,
 * anywhere" and wrong for any surface that says something about THIS
 * workspace — a re-rank timestamp, a count, a "you have settled N outcomes".
 *
 * TWO OPTIONAL NARROWINGS, AND THE DEFAULT IS DELIBERATELY UNCHANGED.
 *
 *  · `workspaceId` filters to one workspace.
 *  · `movedScoreOnly` keeps only learnings that actually moved a score
 *    (`new_ice is not null`). Live today: 49 of 119 learnings carry one, so a
 *    caller counting "outcomes that re-ranked something" and reading the
 *    unfiltered list is off by more than half.
 *
 * The default stays the union, for two reasons and not out of caution. First,
 * three existing callers (Today, the Compounding panel, the learning detail
 * sheet) genuinely want everything the person has learned, and silently
 * narrowing them would DELETE rows from surfaces nobody asked to change.
 * Second, this handler cannot know the active workspace: there is no active
 * workspace in the auth context, and defaulting to
 * `current_user_default_workspace` would be a different wrong answer for
 * exactly the multi-workspace users the filter exists for. The caller knows
 * which workspace it is talking about; this function does not.
 *
 * `workspace_id` is returned on every row either way, so a caller that needs to
 * split or attribute rows can do it without a second read.
 */
export const listLearnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListLearningsSchema> | undefined) =>
    ListLearningsSchema.parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    let q = db.from("learnings").select(
      // `decision:decisions(forecast_claim)` is the pairing. A verdict on its own
      // is a status word; the call written at Decide, before anyone knew the
      // answer, is the half nothing else can reconstruct afterwards. To-one
      // embed, flattened below like the opportunity one because PostgREST may
      // widen either to an array.
      "id, prd_id, opportunity_id, workspace_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, recorded_by_agent_slug, opportunity:opportunities(title, theme_id), decision:decisions(forecast_claim)",
    );
    if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId);
    // `not(...is.null)` rather than a comparison: in SQL a NULL never satisfies
    // one, so a bare filter would have looked like it worked while quietly
    // meaning something else.
    if (data.movedScoreOnly) q = q.not("new_ice", "is", null);
    const { data: learnings, error } = await q.order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    // Flatten the embedded opportunity to a plain `opportunity_title`. PostgREST
    // returns a to-one embed as an object, but the generated types can widen it
    // to an array — handle both, and drop the nested key so the wire shape stays
    // flat and every existing field is preserved (additive, back-compatible). The
    // row is typed precisely (not `unknown`-widened) so callers keep strong field
    // types; `numeric` columns arrive as strings over PostgREST, so callers coerce
    // ICE with Number() — we pass the raw value through untouched.
    type LearningWire = {
      id: string;
      prd_id: string | null;
      opportunity_id: string | null;
      /** Which workspace this learning belongs to. Returned unconditionally so
       *  a caller can tell an own-workspace learning from a seeded one without
       *  re-querying, whether or not it passed `workspaceId`. */
      workspace_id: string | null;
      verdict: "validated" | "missed" | "mixed";
      summary: string;
      metric_label: string | null;
      metric_value: string | null;
      prior_ice: number | string | null;
      new_ice: number | string | null;
      created_at: string;
      // PC-29 layer 3: which agent recorded this learning (always the
      // Historian today, "historian"; never null in practice, but the
      // column itself is nullable).
      recorded_by_agent_slug: string | null;
      opportunity:
        | { title: string | null; theme_id: string | null }
        | { title: string | null; theme_id: string | null }[]
        | null;
      decision: { forecast_claim: string | null } | { forecast_claim: string | null }[] | null;
    };
    const rows = (learnings ?? []) as LearningWire[];
    const flattened = rows.map(({ opportunity, decision, ...rest }) => {
      const opp = Array.isArray(opportunity) ? opportunity[0] : opportunity;
      const dec = Array.isArray(decision) ? decision[0] : decision;
      // opportunity_theme_id feeds the reinforcement seam (ranking.ts
      // outcomeSupportFromCounts): the queue folds each theme's decisive
      // outcome record into the order of NEW bets on the same evidence.
      return {
        ...rest,
        opportunity_title: opp?.title ?? null,
        opportunity_theme_id: opp?.theme_id ?? null,
        // A blank claim is the same as none. An empty string would render an
        // empty expectation, which asserts a call existed and said nothing
        // rather than that none was written.
        forecast_claim: dec?.forecast_claim?.trim() ? dec.forecast_claim.trim() : null,
      };
    });
    return { learnings: flattened };
  });

/**
 * THE RELEASES THAT SHIPPED AND HAVE NO VERDICT YET, AND WHY (P-147).
 *
 * Outcomes is the door the landing page's fourth verb opens ("grades it,
 * guides the next call"). With one release shipped and graded on nothing, its
 * settle panel said "Nothing has shipped that needs a verdict", which was true
 * before the first release and a lie after it: a release has shipped, it
 * needs a verdict, and the reason it has none is that no source can produce
 * a number for its metric. The run page says so (P-144's composer); Outcomes,
 * the page a person opens to ask "did it work", said nothing.
 *
 * ONE COMPOSER, IMPORTED, NEVER A SECOND SENTENCE. `whatLearnIsWaitingFor` is
 * the sentence the run page's hold card draws, fed by the same two reads the
 * driver makes (`forecastDueDate`, `metricSourcesForTrack`), so Outcomes and
 * the run page cannot describe one release two ways. The two presses the run
 * page offers (connect a source, record a reading) are the surface's; this
 * carries the ids they need and the one fact that decides which to lead with.
 *
 * WHAT COUNTS AS "SHIPPED AND UNGRADED": an open track standing at Learn in
 * this workspace whose members carry a `deployment`. Learn has not returned
 * (the track is still open at Learn) and something went out (the member).
 * Workspace-scoped on the read, as every reader of a workspace table is.
 */
export type ReleaseAwaitingVerdict = {
  trackId: string;
  title: string;
  /** When the release went out, from the deployment member. */
  shippedAt: string | null;
  /** YYYY-MM-DD the forecast comes due, or null when no decision names one. */
  dueOn: string | null;
  /** P-144's sentence, verbatim from the one composer. */
  line: string;
  /** True when nothing connected can grade it, so "connect a source" leads. */
  onlyAPersonCanGrade: boolean;
  /** How the read of the metric sources went: null means it could not be read. */
  sourcesRead: boolean;
};

export const listReleasesAwaitingVerdict = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ releases: ReleaseAwaitingVerdict[] }> => {
    const supabase = context.supabase as unknown as SupabaseClient;
    const { data: tracks, error } = await supabase
      .from("spine_tracks" as never)
      .select("id,title,updated_at")
      .eq("workspace_id", data.workspaceId)
      .eq("status", "open")
      .eq("station", "learn")
      .order("updated_at", { ascending: false })
      .limit(24);
    // A failed read is thrown, never an empty desk: "nothing has shipped that
    // needs a verdict" is a claim, and a refused read is not evidence for it.
    if (error)
      throw new Error(`The releases waiting on a verdict could not be read: ${error.message}`);
    const rows = (tracks ?? []) as Array<{ id: string; title: string | null }>;
    if (rows.length === 0) return { releases: [] };

    const { data: members, error: membersErr } = await supabase
      .from("spine_track_members" as never)
      .select("track_id,created_at")
      .in(
        "track_id",
        rows.map((r) => r.id),
      )
      .eq("artifact_kind", "deployment")
      .order("created_at", { ascending: true });
    if (membersErr) {
      throw new Error(`The releases waiting on a verdict could not be read: ${membersErr.message}`);
    }
    const shippedAt = new Map<string, string>();
    for (const m of (members ?? []) as Array<{ track_id: string; created_at: string }>) {
      if (!shippedAt.has(m.track_id)) shippedAt.set(m.track_id, m.created_at);
    }

    const releases: ReleaseAwaitingVerdict[] = [];
    for (const t of rows) {
      if (!shippedAt.has(t.id)) continue;
      const [dueIso, states] = await Promise.all([
        forecastDueDate(supabase, t.id),
        metricSourcesForTrack(supabase, t.id),
      ]);
      releases.push({
        trackId: t.id,
        title: t.title ?? "",
        shippedAt: shippedAt.get(t.id) ?? null,
        dueOn: dueIso ? dueIso.slice(0, 10) : null,
        line: dueIso
          ? whatLearnIsWaitingFor(dueIso, states)
          : "No forecast names a date, so Learn has nothing to grade this against until one does.",
        onlyAPersonCanGrade: onlyAPersonCanGradeThis(states),
        sourcesRead: states !== null,
      });
    }
    return { releases };
  });
