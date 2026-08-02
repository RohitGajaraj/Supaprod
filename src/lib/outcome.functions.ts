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
// Type only, so nothing is imported at runtime and the cycle this file would
// otherwise close with outcome-suggestion.server (which imports
// draftOutcomeVerdict from here) never exists. The runtime call is a dynamic
// import inside draftOutcomeSuggestion's handler.
import type { OutcomeSuggestion } from "@/lib/outcome-suggestion.server";
import type { ContractClause } from "@/lib/discovery.functions";

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
  prdTitle: string | null;
  opportunityTitle: string | null;
  arcHold: { slug: string; arc: string } | null;
  themeMoved: { themeId: string; before: number; after: number; otherBets: number } | null;
  /** Set when this write replaced a verdict that was already on the record. */
  overturned: OutcomeOverturn | null;
};

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
      .select("id,workspace_id,opportunity_id,title,outcome")
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
      const { data: updated, error: updErr } = await db
        .from("learnings")
        .update(learningFields)
        .eq("id", supersedes)
        .select()
        .single();
      if (updErr) throw new Error(updErr.message);
      learning = updated;
      // prior_ice on the superseded row already holds the pre-verdict score.
      const rowPrior = (updated as { prior_ice?: number | string | null } | null)?.prior_ice;
      priorIce = rowPrior == null ? priorIce : Number(rowPrior);
    } else {
      const { data: inserted, error: learnErr } = await db
        .from("learnings")
        .insert({
          user_id: userId,
          workspace_id: prd.workspace_id,
          prd_id: prd.id,
          opportunity_id: prd.opportunity_id,
          mission_id: data.missionId ?? null,
          prior_ice: priorIce,
          ...learningFields,
        })
        .select()
        .single();
      if (learnErr) throw new Error(learnErr.message);
      learning = inserted;
    }
    const learningId = (learning as { id?: string } | null)?.id ?? null;

    // ---- The record of who settled it, written last. --------------------
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
      overturns: overturned ? [...(prior?.overturns ?? []), overturned] : (prior?.overturns ?? []),
    };
    const { error: outErr } = await db
      .from("prds")
      .update({ outcome: recorded, updated_at: now })
      .eq("id", prd.id);
    if (outErr) throw new Error(outErr.message);

    // v6 Phase 2 (W1) — close the compounding loop: distil the outcome into a
    // global, searchable agent_memory so future agent runs recall "we shipped
    // this and it was {verdict}" when they re-encounter the opportunity. The
    // re-score already moved the ICE; this makes the loop actually LEARN, not
    // just record. Best-effort — never let a memory write break the outcome.
    //
    // rememberOutcome is already idempotent per spec: it drops the prior
    // outcome memory before inserting. So an overturn REPLACES the agent's
    // memory rather than leaving the compounding layer holding two verdicts
    // that contradict each other. The contrast survives where it belongs, on
    // the record, not in the thing that whispers advice into the next prompt.
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
        memoryId: memory?.id ?? null,
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
      memory_id: memory?.id ?? null,
      prdTitle,
      opportunityTitle: oppTitle,
      arcHold,
      themeMoved,
      overturned,
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

export type PendingOutcome = {
  prdId: string;
  title: string;
  shippedAt: string | null;
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
  settledAt: string | null;
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

/** Shipped specs with no outcome on file, newest ship first. This is the queue
 *  stage 07 exists to drain. */
export const listPendingOutcomes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ pending: PendingOutcome[] }> => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;

    type PrdRow = {
      id: string;
      title: string | null;
      shipped_at: string | null;
      opportunity_id: string | null;
      outcome_suggestion: OutcomeSuggestion | null;
      contract: unknown;
    };
    const { data: prdRows, error } = await db
      .from("prds")
      .select("id,title,shipped_at,opportunity_id,outcome_suggestion,contract")
      .is("outcome", null)
      .not("shipped_at", "is", null)
      .order("shipped_at", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    const prds = (prdRows ?? []) as PrdRow[];
    if (prds.length === 0) return { pending: [] };

    const prdIds = prds.map((p) => p.id);
    const oppIds = [...new Set(prds.map((p) => p.opportunity_id).filter((v): v is string => !!v))];

    type OppRow = {
      id: string;
      title: string | null;
      impact: number | null;
      confidence: number | null;
      ease: number | null;
      ice_score: number | string | null;
      theme_id: string | null;
    };
    const oppById = new Map<string, OppRow>();
    if (oppIds.length > 0) {
      const { data } = await db
        .from("opportunities")
        .select("id,title,impact,confidence,ease,ice_score,theme_id")
        .in("id", oppIds);
      for (const o of (data ?? []) as OppRow[]) oppById.set(o.id, o);
    }

    // The two extra facts the settle-or-ask rule needs, both batched so the
    // queue stays one round of queries rather than one per row.
    // 1. What the bet promised to measure.
    const planByPrd = new Map<
      string,
      { success_metric: string | null; workspace_id: string | null }
    >();
    {
      const { data } = await db
        .from("launch_plans")
        // workspace_id rides along because the settle-or-ask bar is workspace
        // policy now, and the sweep keys it off exactly this column.
        .select("prd_id,success_metric,workspace_id")
        .in("prd_id", prdIds);
      for (const r of (data ?? []) as Array<{
        prd_id: string;
        success_metric: string | null;
        workspace_id: string | null;
      }>) {
        if (!planByPrd.has(r.prd_id)) {
          planByPrd.set(r.prd_id, {
            success_metric: r.success_metric,
            workspace_id: r.workspace_id,
          });
        }
      }
    }

    // The same policy read the sweep makes, so a row can never show a reason
    // the sweep did not act on. A spec with no launch plan, or a workspace that
    // has stated nothing, falls back to the bar the product ships with.
    const policies = await loadAutonomyPolicies(
      db,
      [...planByPrd.values()].map((p) => p.workspace_id),
    );
    // 2. How far a verdict propagates: other bets on the same theme re-rank.
    const siblingsByTheme = new Map<string, number>();
    {
      const themeIds = [
        ...new Set([...oppById.values()].map((o) => o.theme_id).filter((v): v is string => !!v)),
      ];
      if (themeIds.length > 0) {
        const { data } = await db
          .from("opportunities")
          .select("id,theme_id")
          .in("theme_id", themeIds);
        for (const r of (data ?? []) as Array<{ id: string; theme_id: string | null }>) {
          if (!r.theme_id) continue;
          siblingsByTheme.set(r.theme_id, (siblingsByTheme.get(r.theme_id) ?? 0) + 1);
        }
      }
    }

    // Newest agent-made decision per spec. Ordered newest first, so the first
    // row seen for a spec wins.
    const slugByPrd = new Map<string, string>();
    {
      const { data } = await db
        .from("decisions")
        .select("prd_id,decided_by_agent_slug,created_at")
        .in("prd_id", prdIds)
        .not("decided_by_agent_slug", "is", null)
        .order("created_at", { ascending: false });
      for (const d of (data ?? []) as Array<{
        prd_id: string | null;
        decided_by_agent_slug: string | null;
      }>) {
        if (!d.prd_id || !d.decided_by_agent_slug) continue;
        if (!slugByPrd.has(d.prd_id)) slugByPrd.set(d.prd_id, d.decided_by_agent_slug);
      }
    }

    const arcBySlug = new Map<string, string>();
    const slugs = [...new Set(slugByPrd.values())];
    if (slugs.length > 0) {
      const { data: agentRows } = await db
        .from("agents")
        .select("id,slug")
        .eq("user_id", userId)
        .in("slug", slugs);
      const agents = (agentRows ?? []) as Array<{ id: string; slug: string }>;
      if (agents.length > 0) {
        const { data: arcRows } = await db
          .from("agent_autonomy")
          .select("agent_id,arc")
          .eq("user_id", userId)
          .in(
            "agent_id",
            agents.map((a) => a.id),
          );
        const arcByAgentId = new Map(
          ((arcRows ?? []) as Array<{ agent_id: string; arc: string }>).map((r) => [
            r.agent_id,
            r.arc,
          ]),
        );
        for (const a of agents) {
          const arc = arcByAgentId.get(a.id);
          if (arc) arcBySlug.set(a.slug, arc);
        }
      }
    }

    const pending: PendingOutcome[] = prds.map((p) => {
      const opp = p.opportunity_id ? (oppById.get(p.opportunity_id) ?? null) : null;
      const slug = slugByPrd.get(p.id) ?? null;
      const arc = slug ? (arcBySlug.get(slug) ?? null) : null;
      const holdsPromotion = arc === "observing" || arc === "proving";

      // The verdict the agent would have put on the record, read the same way
      // the sweep reads it. Everything in this queue has shipped (the query
      // filters on it), so `verdictIsRecordFact` can never be true here.
      const verdictOnTable = asVerdict(p.outcome_suggestion?.verdict);
      const planWorkspaceId = planByPrd.get(p.id)?.workspace_id ?? null;
      const settlement = verdictOnTable
        ? decideSettlement(
            {
              verdict: verdictOnTable,
              verdictIsRecordFact: false,
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
        shippedAt: p.shipped_at,
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
  });

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
    };
    const { data: prdRows, error } = await db
      .from("prds")
      .select("id,title,opportunity_id,outcome")
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
        settledAt: typeof o?.checked_at === "string" ? o.checked_at : null,
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

  // The prediction substrate = the linked opportunity. select("*") keeps this
  // pre-migration tolerant for the H2 roadmap_outcome/roadmap_measure columns.
  let opp: Record<string, unknown> | null = null;
  if (prd.opportunity_id) {
    const { data: o } = await db
      .from("opportunities")
      .select("*")
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
      `Metric — ${data.metricLabel ?? "value"}: ${data.metricValue ?? "(no value)"}.`,
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

/** Latest 50 learnings, newest first (workspace-scoped via RLS). Each row carries
 *  the title of the opportunity it rescored (`opportunity_title`) so callers can
 *  NAME the priority a learning moved — "this learning moved THESE priorities"
 *  (MOAT-VIS) — without a second query. The embed rides RLS; a learning with no
 *  opportunity (or one in another workspace) reads `opportunity_title: null`. */
export const listLearnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: learnings, error } = await db
      .from("learnings")
      .select(
        "id, prd_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, recorded_by_agent_slug, opportunity:opportunities(title, theme_id)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
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
    };
    const rows = (learnings ?? []) as LearningWire[];
    const flattened = rows.map(({ opportunity, ...rest }) => {
      const opp = Array.isArray(opportunity) ? opportunity[0] : opportunity;
      // opportunity_theme_id feeds the reinforcement seam (ranking.ts
      // outcomeSupportFromCounts): the queue folds each theme's decisive
      // outcome record into the order of NEW bets on the same evidence.
      return {
        ...rest,
        opportunity_title: opp?.title ?? null,
        opportunity_theme_id: opp?.theme_id ?? null,
      };
    });
    return { learnings: flattened };
  });
