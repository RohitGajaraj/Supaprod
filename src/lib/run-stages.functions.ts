/**
 * The seven stages of one run, resolved from the record.
 *
 * WHY THIS EXISTS. The run screen used to be able to speak about exactly one
 * stage, Build, because that is the only one a `missions` row knows about by
 * itself. The founder's complaint on 2026-07-29 was that the spine reads as
 * Build and nothing else: "for everything right from Discover to Ship it's not
 * well thought through ... it should not be half done, half baked cookie".
 *
 * So the lineage is walked properly, once, on the server:
 *
 *   mission
 *     -> studio_changesets.mission_id           the build, and the ship
 *          -> prds (via changeset.prd_id)       the spec
 *               -> opportunities                what was noticed   (01 Discover)
 *               -> decisions.prd_id             the call           (02 Decide)
 *               -> prd_flows.prd_id             the plan           (03 Plan)
 *               -> prd_scaffolds.prd_id         the drawing        (04 Design)
 *               -> learnings.prd_id             what it taught     (07 Learn)
 *
 * `decisions` and `learnings` also carry `mission_id`, so a run dispatched
 * without a spec still resolves those two directly. That is the whole reason
 * both edges are queried rather than only the spec path.
 *
 * TWO RETURN VALUES, TWO AUDIENCES. `stages` is the strip: seven chips, one
 * short note each, and nothing a chip cannot hold. `evidence` is the panels:
 * what actually happened at each stage on THIS run, which is the question the
 * strip asks and could not answer. They are separate because a chip that grew
 * to hold a panel's worth of facts would be the stage toolbar the verdict
 * removed from the chrome.
 *
 * THE RULE THIS FILE OBEYS, AND IT IS THE IMPORTANT ONE. A stage with no row
 * behind it returns state `quiet`, a note that says so in plain words, and a
 * NULL member of `evidence`. It never borrows a neighbouring stage's fact,
 * never counts something it did not read, and never renders a stage as
 * finished because the run moved past it. The prototype's strip says
 * "04 Design - no surface to change", which is a real editorial judgement a
 * person made about one run; this function cannot make that judgement, so
 * where it does not know it says it does not know. That is the same discipline
 * that made the earlier build agent refuse to draw a fabricated diffstat,
 * applied one layer up.
 *
 * THE SAME RULE, INSIDE A STAGE. Absence has more than one shape and the
 * shapes are not interchangeable, so they are carried as different values
 * rather than flattened into one empty state:
 *   - `evidence.discover === null`  nothing links this run back to an
 *                                   opportunity at all.
 *   - `signalCount === null`        the opportunity is real but carries no
 *                                   theme, so no signal was counted. This is
 *                                   NOT zero signals.
 *   - `signalCount === 0`           the theme is real and holds none. This IS
 *                                   zero signals.
 *   - `checks === null`             no check snapshot has ever been read for
 *                                   this pull request. Not "the checks failed",
 *                                   and not "the checks passed".
 *   - `deployments === []`          read, and nothing has deployed.
 *
 * COLUMNS ARE VERIFIED, NOT REMEMBERED. `tsc` does not read Supabase select
 * strings: a column that does not exist typechecks clean and throws at
 * runtime. Every column named below was read out of
 * `src/integrations/supabase/types.ts` first. Two that people keep reaching
 * for do NOT exist and are derived instead: `opportunities.evidence_count`
 * (counted through `theme_id` against `signals`) and
 * `studio_changesets.file_count` (counted against `studio_changes`).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { parseAlternativesConsidered } from "@/lib/decision-judgment";
import { overallFromChecks } from "@/lib/ai/studio-ci";

/** Mirrors RunStageState in components/shell/run-strip.tsx. */
export type RunStageState = "done" | "working" | "gate" | "next" | "quiet";

export type RunStageFact = {
  station: AgentStation;
  state: RunStageState;
  /** The stage's second line, in the run's own words. Never a status word. */
  note: string;
  /**
   * Where the evidence for this stage lives, when it has a home the user can
   * open. Null means the stage panel renders what it has and offers no exit.
   */
  href: string | null;
};

/**
 * Who moved something, read from `stage_events`, which is the only table in
 * this lineage that records an actor per transition. `actor` is an agent slug,
 * "human" or "system", verbatim: the panel names what the record names and
 * never promotes a "system" row into an agent because the stage has one.
 */
export type StageActor = {
  actor: string;
  from: string | null;
  to: string;
  at: string;
};

export type DiscoverEvidence = {
  opportunityId: string;
  title: string;
  problem: string | null;
  hypothesis: string | null;
  targetUser: string | null;
  status: string;
  impact: number;
  confidence: number;
  ease: number;
  iceScore: number | null;
  /** `opportunities.roadmap_last_agent_slug`. Null when nobody is named. */
  lastAgentSlug: string | null;
  theme: { id: string; title: string; frequency: number; lastSignalAt: string | null } | null;
  /** Null and 0 are different facts. See the file header. */
  signalCount: number | null;
  signals: Array<{
    id: string;
    source: string;
    title: string | null;
    excerpt: string;
    at: string;
  }>;
  moved: StageActor | null;
};

export type DecideEvidence = {
  decisionId: string;
  title: string;
  rationale: string | null;
  status: string;
  /** `decisions.decided_by_agent_slug`, a real column. */
  decidedByAgentSlug: string | null;
  citedByCount: number;
  at: string;
  alternatives: Array<{ title: string; reason: string | null }>;
  /** True when the row hangs off this mission rather than off the spec. */
  viaMission: boolean;
};

export type PlanEvidence = {
  prdId: string;
  title: string;
  status: string;
  createdAt: string;
  /** Null means the spec exists and no flow was ever drawn on it. */
  flow: {
    stepCount: number;
    edgeCount: number;
    steps: Array<{ id: string; kind: string; label: string }>;
    updatedAt: string;
  } | null;
  moved: StageActor | null;
};

export type DesignEvidence = {
  prdId: string;
  /** "pending" | "approved" | "rejected", or null when no design call is on
   *  the spec at all. */
  gateStatus: string | null;
  gateDecidedAt: string | null;
  /** Null means nothing was drawn. */
  scaffold: {
    /** "manual" (drawn on request) or "speculative" (drawn while you read). */
    source: string;
    updatedAt: string;
    /** The first six headings the stored HTML actually contains. Derived here
     *  so the HTML itself never crosses the wire. */
    screens: string[];
    /** Every distinct heading, counted. Never `screens.length`, which is the
     *  cap and would understate a scaffold with more than six. */
    screenCount: number;
    controlCount: number;
  } | null;
};

export type ShipEvidence = {
  changesetId: string;
  repo: string;
  branch: string | null;
  status: string;
  prNumber: number | null;
  prUrl: string | null;
  /** `prds.shipped_at`: the spec's own record of reaching users. */
  shippedAt: string | null;
  /** Null means no snapshot has been read. See the file header. */
  checks: {
    overall: string;
    total: number;
    passed: number;
    running: number;
    notGreen: string[];
    at: string | null;
  } | null;
  /** Read, so empty means nothing has deployed. */
  deployments: Array<{
    id: string;
    environment: string;
    status: string;
    url: string | null;
    at: string;
  }>;
};

export type LearnEvidence = {
  learningId: string;
  summary: string;
  /** "validated" | "missed" | "mixed". */
  verdict: string;
  metricLabel: string | null;
  metricValue: string | null;
  priorIce: number | null;
  newIce: number | null;
  /** `learnings.recorded_by_agent_slug`, a real column. */
  recordedByAgentSlug: string | null;
  at: string;
  viaMission: boolean;
};

/** What each panel draws. A null member means no row stands behind that stage
 *  on this run, which the panel says in plain words rather than hiding. */
export type StageEvidence = {
  discover: DiscoverEvidence | null;
  decide: DecideEvidence | null;
  plan: PlanEvidence | null;
  design: DesignEvidence | null;
  ship: ShipEvidence | null;
  learn: LearnEvidence | null;
};

export type RunStages = {
  stages: RunStageFact[];
  /** The stage the run is actually in, which is where the screen opens. */
  focus: AgentStation;
  evidence: StageEvidence;
};

type PrdRow = {
  id: string;
  title: string;
  status: string;
  opportunity_id: string | null;
  shipped_at: string | null;
  design_gate_status: string | null;
  design_decided_at: string | null;
  created_at: string;
};

/** Plain-words count, because "1 signals" is how software sounds. */
function count(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

/** One line, capped. Nothing is sent that a panel would only have to truncate:
 *  a panel is not a page, and the full text lives one click away. */
function line(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Mirrors FAILING_CONCLUSIONS in `ai/studio-ci.ts`, which is not exported. The
 * VERDICT itself still comes from `overallFromChecks`, the one function both
 * the merge gate and this panel read, so a drift here can only mis-group a
 * check in a list. It can never disagree with the gate about whether the pull
 * request is green.
 */
const NOT_GREEN = new Set(["failure", "timed_out", "action_required", "cancelled"]);

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * What a scaffold actually drew, read out of the stored HTML.
 *
 * This is derivation, not summary: the headings are the scaffold's own words
 * and the control count is its own elements. Nothing is inferred about what
 * the screens mean, and the HTML never leaves the server, because a panel
 * inside a run does not need a rendered mockup to answer "what was drawn".
 *
 * `screenCount` counts EVERY distinct heading; `screens` carries the first
 * six. They are two values on purpose: a panel shows a few and says how many
 * there are, and the count a panel prints must be the real one. Capping the
 * list and then counting the cap is how a surface tells you a scaffold has six
 * screens when it has twelve.
 */
function readScaffold(html: string): {
  screens: string[];
  screenCount: number;
  controlCount: number;
} {
  const seen = new Set<string>();
  const screens: string[] = [];
  const headings = /<h[1-3][^>]*>([\s\S]{0,400}?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = headings.exec(html)) !== null) {
    const text = m[1]
      .replace(/<[^>]*>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    if (screens.length < 6) screens.push(text.slice(0, 64));
  }
  const controlCount = (html.match(/<(?:button|input|select|textarea)\b/gi) ?? []).length;
  return { screens, screenCount: seen.size, controlCount };
}

export const getRunStages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<RunStages> => {
    const { supabase, userId } = context;
    const { missionId } = data;

    // Everything below is RLS-scoped to the caller by the middleware's client,
    // so a mission in another workspace resolves to an empty, honest strip
    // rather than leaking a neighbour's lineage.
    const [{ data: missionRow }, { data: csRows }, { data: runRows }] = await Promise.all([
      supabase
        .from("missions")
        .select("id,status,current_agent_id,created_at,completed_at")
        .eq("id", missionId)
        .maybeSingle(),
      // No file_count here: `studio_changesets` has no such column. It is a
      // derived figure elsewhere in the codebase, computed from the child rows,
      // and it is counted the same way below rather than selected as if it were
      // stored. Selecting a column that does not exist fails at runtime and NOT
      // at tsc, because Supabase select strings are loosely typed.
      supabase
        .from("studio_changesets")
        .select("id,status,prd_id,pr_number,pr_url,repo,branch")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: false }),
      supabase.from("agent_runs").select("id,status").eq("mission_id", missionId),
    ]);

    const mission = missionRow as {
      id: string;
      status: string;
      current_agent_id: string | null;
      created_at: string;
      completed_at: string | null;
    } | null;

    const changeset =
      (
        (csRows ?? []) as Array<{
          id: string;
          status: string;
          prd_id: string | null;
          pr_number: number | null;
          pr_url: string | null;
          repo: string | null;
          branch: string | null;
        }>
      )[0] ?? null;

    const runs = (runRows ?? []) as Array<{ id: string; status: string }>;
    const missionLive = mission?.status === "running" || mission?.status === "queued";
    const runLive = runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
    const live = missionLive || runLive;
    const gated = runs.some((r) => r.status === "waiting_approval");

    // The spec. Two ways in, because a run dispatched from a goal has no
    // changeset and therefore no prd_id on it.
    let prd: PrdRow | null = null;
    if (changeset?.prd_id) {
      const { data } = await supabase
        .from("prds")
        .select(
          "id,title,status,opportunity_id,shipped_at,design_gate_status,design_decided_at,created_at",
        )
        .eq("id", changeset.prd_id)
        .maybeSingle();
      prd = (data as PrdRow | null) ?? null;
    }

    // The four spec-hung stages plus the two mission-hung ones, in one round.
    const prdId = prd?.id ?? null;
    const prNumber = changeset?.pr_number ?? null;
    const [
      { data: decisionRows },
      { data: learningRows },
      { data: flowRows },
      { data: scaffoldRows },
      { data: oppRows },
      { data: approvalRows },
      { data: deployRows },
      { data: ciRows },
    ] = await Promise.all([
      prdId
        ? supabase
            .from("decisions")
            .select(
              "id,title,rationale,status,created_at,decided_by_agent_slug,alternatives_considered,cited_by_count,prd_id,mission_id",
            )
            .or(`prd_id.eq.${prdId},mission_id.eq.${missionId}`)
            .order("created_at", { ascending: false })
            .limit(1)
        : supabase
            .from("decisions")
            .select(
              "id,title,rationale,status,created_at,decided_by_agent_slug,alternatives_considered,cited_by_count,prd_id,mission_id",
            )
            .eq("mission_id", missionId)
            .order("created_at", { ascending: false })
            .limit(1),
      prdId
        ? supabase
            .from("learnings")
            .select(
              "id,summary,verdict,metric_label,metric_value,prior_ice,new_ice,recorded_by_agent_slug,created_at,prd_id,mission_id",
            )
            .or(`prd_id.eq.${prdId},mission_id.eq.${missionId}`)
            .order("created_at", { ascending: false })
            .limit(1)
        : supabase
            .from("learnings")
            .select(
              "id,summary,verdict,metric_label,metric_value,prior_ice,new_ice,recorded_by_agent_slug,created_at,prd_id,mission_id",
            )
            .eq("mission_id", missionId)
            .order("created_at", { ascending: false })
            .limit(1),
      prdId
        ? supabase
            .from("prd_flows")
            .select("id,steps,edges,updated_at")
            .eq("prd_id", prdId)
            .limit(1)
        : Promise.resolve({ data: null }),
      prdId
        ? supabase
            .from("prd_scaffolds")
            .select("id,source,html,updated_at")
            .eq("prd_id", prdId)
            .limit(1)
        : Promise.resolve({ data: null }),
      prd?.opportunity_id
        ? supabase
            .from("opportunities")
            .select(
              "id,title,problem,hypothesis,target_user,status,impact,confidence,ease,ice_score,theme_id,roadmap_last_agent_slug",
            )
            .eq("id", prd.opportunity_id)
            .limit(1)
        : Promise.resolve({ data: null }),
      supabase
        .from("agent_approvals")
        .select("id,status,agent_slug")
        .eq("mission_id", missionId)
        .eq("status", "pending"),
      changeset
        ? supabase
            .from("deployments")
            .select("id,environment,status,deploy_url,deployed_at,created_at")
            .eq("changeset_id", changeset.id)
            .order("created_at", { ascending: false })
            .limit(6)
        : Promise.resolve({ data: null }),
      // The check snapshot. There is no checks table: `github.ci.read` stores
      // its result on the tool call, and studio.functions.ts reads it the same
      // way. Scanning the last twenty is that function's own contract, kept
      // identical so the Ship panel and the Build body cannot disagree about
      // whether this pull request is green.
      prNumber != null
        ? supabase
            .from("tool_calls")
            .select("result,created_at")
            .eq("user_id", userId)
            .eq("tool_name", "github.ci.read")
            .eq("ok", true)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: null }),
    ]);

    const decision =
      (
        (decisionRows ?? []) as Array<{
          id: string;
          title: string | null;
          rationale: string | null;
          status: string;
          created_at: string;
          decided_by_agent_slug: string | null;
          alternatives_considered: unknown;
          cited_by_count: number | null;
          prd_id: string | null;
          mission_id: string | null;
        }>
      )[0] ?? null;
    const learning =
      (
        (learningRows ?? []) as Array<{
          id: string;
          summary: string;
          verdict: string;
          metric_label: string | null;
          metric_value: string | null;
          prior_ice: number | null;
          new_ice: number | null;
          recorded_by_agent_slug: string | null;
          created_at: string;
          prd_id: string | null;
          mission_id: string | null;
        }>
      )[0] ?? null;
    const flow =
      (
        (flowRows ?? []) as Array<{
          id: string;
          steps: unknown;
          edges: unknown;
          updated_at: string;
        }>
      )[0] ?? null;
    const scaffold =
      (
        (scaffoldRows ?? []) as Array<{
          id: string;
          source: string;
          html: string | null;
          updated_at: string;
        }>
      )[0] ?? null;
    const opportunity =
      (
        (oppRows ?? []) as Array<{
          id: string;
          title: string;
          problem: string | null;
          hypothesis: string | null;
          target_user: string | null;
          status: string;
          impact: number;
          confidence: number;
          ease: number;
          ice_score: number | null;
          theme_id: string | null;
          roadmap_last_agent_slug: string | null;
        }>
      )[0] ?? null;
    const pendingApprovals = (approvalRows ?? []) as Array<{ agent_slug: string | null }>;

    // How many signals stand behind the opportunity this run came from.
    // `opportunities` has no evidence counter of its own; signals and
    // opportunities meet on `theme_id`, so that join IS the evidence, and it is
    // counted rather than estimated. No theme means no count, and the stage
    // then names the opportunity instead of showing a zero it did not measure.
    // The file count, counted. `head: true` so this is a COUNT and not a read
    // of every file's content just to measure the length of the list.
    const stageEventIds = [opportunity?.id, prdId].filter(
      (v): v is string => typeof v === "string",
    );
    const [
      { count: fileCountRaw },
      { count: signalCountRaw },
      { data: signalRows },
      { data: themeRows },
      { data: eventRows },
    ] = await Promise.all([
      changeset
        ? supabase
            .from("studio_changes")
            .select("id", { count: "exact", head: true })
            .eq("changeset_id", changeset.id)
        : Promise.resolve({ count: null }),
      opportunity?.theme_id
        ? supabase
            .from("signals")
            .select("id", { count: "exact", head: true })
            .eq("theme_id", opportunity.theme_id)
        : Promise.resolve({ count: null }),
      opportunity?.theme_id
        ? supabase
            .from("signals")
            .select("id,source,title,content,created_at")
            .eq("theme_id", opportunity.theme_id)
            .order("created_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: null }),
      opportunity?.theme_id
        ? supabase
            .from("themes")
            .select("id,title,frequency,last_signal_at")
            .eq("id", opportunity.theme_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      // One read covers the opportunity and the spec. `stage_events.actor` is
      // the only per-transition attribution in this lineage, and it is what
      // lets Plan say who moved the spec at all: `prd_flows.generated_by` and
      // `prd_scaffolds.generated_by` hold a USER id, never an agent slug, so
      // neither may be rendered as a crew member.
      stageEventIds.length > 0
        ? supabase
            .from("stage_events")
            .select("entity_type,entity_id,from_stage,to_stage,actor,at")
            .in("entity_id", stageEventIds)
            .order("at", { ascending: false })
            .limit(30)
        : Promise.resolve({ data: null }),
    ]);

    const fileCount = typeof fileCountRaw === "number" ? fileCountRaw : null;
    const signalCount = typeof signalCountRaw === "number" ? signalCountRaw : null;
    const theme =
      (themeRows as {
        id: string;
        title: string;
        frequency: number;
        last_signal_at: string | null;
      } | null) ?? null;
    const events = (eventRows ?? []) as Array<{
      entity_type: string;
      entity_id: string;
      from_stage: string | null;
      to_stage: string;
      actor: string;
      at: string;
    }>;
    /** The most recent transition recorded for one entity, or nothing. */
    function movedFor(entityId: string | null | undefined): StageActor | null {
      if (!entityId) return null;
      const e = events.find((x) => x.entity_id === entityId);
      return e ? { actor: e.actor, from: e.from_stage, to: e.to_stage, at: e.at } : null;
    }

    /* ---------------- 01 Discover ---------------- */
    const discover: RunStageFact = opportunity
      ? {
          station: "sense",
          state: "done",
          note:
            signalCount && signalCount > 0
              ? count(signalCount, "signal", "signals")
              : opportunity.title,
          href: "/arriving",
        }
      : {
          station: "sense",
          state: "quiet",
          // Honest, and deliberately not "no signals": we did not read zero
          // signals, we read no link from this run back to any.
          note: "not traced to a signal",
          href: null,
        };

    const discoverEvidence: DiscoverEvidence | null = opportunity
      ? {
          opportunityId: opportunity.id,
          title: opportunity.title,
          problem: line(opportunity.problem, 200),
          hypothesis: line(opportunity.hypothesis, 200),
          targetUser: line(opportunity.target_user, 80),
          status: opportunity.status,
          impact: opportunity.impact,
          confidence: opportunity.confidence,
          ease: opportunity.ease,
          iceScore: opportunity.ice_score,
          lastAgentSlug: opportunity.roadmap_last_agent_slug,
          theme: theme
            ? {
                id: theme.id,
                title: theme.title,
                frequency: theme.frequency,
                lastSignalAt: theme.last_signal_at,
              }
            : null,
          signalCount,
          signals: (
            (signalRows ?? []) as Array<{
              id: string;
              source: string;
              title: string | null;
              content: string;
              created_at: string;
            }>
          ).map((s) => ({
            id: s.id,
            source: s.source,
            title: line(s.title, 90),
            excerpt: line(s.content, 140) ?? "",
            at: s.created_at,
          })),
          moved: movedFor(opportunity.id),
        }
      : null;

    /* ---------------- 02 Decide ---------------- */
    const decide: RunStageFact = decision
      ? { station: "decide", state: "done", note: "the call is on the record", href: "/decide" }
      : { station: "decide", state: "quiet", note: "no decision recorded", href: null };

    const decideEvidence: DecideEvidence | null = decision
      ? {
          decisionId: decision.id,
          title: line(decision.title, 160) ?? "Untitled",
          rationale: line(decision.rationale, 400),
          status: decision.status,
          decidedByAgentSlug: decision.decided_by_agent_slug,
          citedByCount: decision.cited_by_count ?? 0,
          at: decision.created_at,
          alternatives: parseAlternativesConsidered(decision.alternatives_considered)
            .slice(0, 3)
            .map((a) => ({
              title: line(a.title, 120) ?? "",
              reason: line(a.reason_rejected, 180),
            })),
          viaMission: decision.prd_id == null && decision.mission_id === missionId,
        }
      : null;

    /* ---------------- 03 Plan ---------------- */
    const flowSteps = Array.isArray(flow?.steps)
      ? (flow.steps as Array<{ id?: unknown; kind?: unknown; label?: unknown }>)
      : [];
    const stepCount = flowSteps.length;
    const edgeCount = Array.isArray(flow?.edges) ? (flow.edges as unknown[]).length : 0;
    const plan: RunStageFact = prd
      ? {
          station: "define",
          state: "done",
          note: stepCount > 0 ? count(stepCount, "step", "steps") : prd.title,
          href: `/plan/spec/${prd.id}`,
        }
      : { station: "define", state: "quiet", note: "no spec behind this run", href: null };

    const planEvidence: PlanEvidence | null = prd
      ? {
          prdId: prd.id,
          title: prd.title,
          status: prd.status,
          createdAt: prd.created_at,
          flow: flow
            ? {
                stepCount,
                edgeCount,
                steps: flowSteps
                  .filter(
                    (s) =>
                      s !== null &&
                      typeof s === "object" &&
                      typeof s.id === "string" &&
                      typeof s.label === "string",
                  )
                  .slice(0, 10)
                  .map((s) => ({
                    id: s.id as string,
                    kind: typeof s.kind === "string" ? s.kind : "step",
                    label: line(s.label as string, 60) ?? "",
                  })),
                updatedAt: flow.updated_at,
              }
            : null,
          moved: movedFor(prd.id),
        }
      : null;

    /* ---------------- 04 Design ---------------- */
    const design: RunStageFact = scaffold
      ? {
          station: "design",
          state: prd?.design_gate_status === "pending" ? "gate" : "done",
          note:
            prd?.design_gate_status === "pending"
              ? "waiting on your call"
              : scaffold.source === "speculative"
                ? "drawn while you reviewed"
                : "a scaffold was drawn",
          href: prd ? `/plan/spec/${prd.id}` : null,
        }
      : { station: "design", state: "quiet", note: "nothing was drawn", href: null };

    const scaffoldRead = scaffold?.html ? readScaffold(scaffold.html) : null;
    const designEvidence: DesignEvidence | null = prd
      ? {
          prdId: prd.id,
          gateStatus: prd.design_gate_status,
          gateDecidedAt: prd.design_decided_at,
          scaffold:
            scaffold && scaffoldRead
              ? {
                  source: scaffold.source,
                  updatedAt: scaffold.updated_at,
                  screens: scaffoldRead.screens,
                  screenCount: scaffoldRead.screenCount,
                  controlCount: scaffoldRead.controlCount,
                }
              : null,
        }
      : null;

    /* ---------------- 05 Build ---------------- */
    const buildNote = gated
      ? "waiting on your call"
      : live
        ? "writing the change"
        : changeset && fileCount != null && fileCount > 0
          ? count(fileCount, "file", "files")
          : changeset
            ? "the change is staged"
            : runs.length > 0
              ? "the run finished"
              : "not started";
    const build: RunStageFact = {
      station: "build",
      state: gated ? "gate" : live ? "working" : changeset || runs.length > 0 ? "done" : "quiet",
      note: buildNote,
      href: null,
    };

    /* ---------------- 06 Ship ---------------- */
    const shipState: RunStageState = !changeset
      ? "quiet"
      : changeset.status === "merged"
        ? "done"
        : changeset.status === "pr_open"
          ? "next"
          : "quiet";
    const ship: RunStageFact = {
      station: "ship",
      state: shipState,
      note: !changeset
        ? "nothing to ship yet"
        : changeset.status === "merged"
          ? prd?.shipped_at
            ? "merged and shipped"
            : "merged"
          : changeset.status === "pr_open"
            ? changeset.pr_number != null
              ? `pull request ${changeset.pr_number}, your call`
              : "pull request open, your call"
            : "not opened yet",
      href: null,
    };

    // The check snapshot for THIS pull request, or nothing. A snapshot for a
    // different pull request is not this run's evidence and is skipped rather
    // than shown, which is why the number is compared and not assumed.
    let checks: ShipEvidence["checks"] = null;
    if (prNumber != null) {
      for (const tc of (ciRows ?? []) as Array<{
        result: Record<string, unknown> | null;
        created_at: string;
      }>) {
        const r = tc.result as {
          pr_number?: number;
          updated_at?: string;
          checks?: Array<{ name?: string; status?: string; conclusion?: string | null }>;
        } | null;
        if (r?.pr_number !== prNumber) continue;
        const raw = (r.checks ?? []).map((c) => ({
          name: typeof c.name === "string" ? c.name : "a check",
          status: typeof c.status === "string" ? c.status : "completed",
          conclusion: typeof c.conclusion === "string" ? c.conclusion : null,
        }));
        checks = {
          overall: overallFromChecks(raw),
          total: raw.length,
          passed: raw.filter((c) => c.conclusion === "success").length,
          running: raw.filter((c) => c.status !== "completed").length,
          notGreen: raw
            .filter((c) => c.conclusion !== null && NOT_GREEN.has(c.conclusion))
            .slice(0, 3)
            .map((c) => c.name),
          at: r.updated_at ?? tc.created_at,
        };
        break;
      }
    }

    const shipEvidence: ShipEvidence | null = changeset
      ? {
          changesetId: changeset.id,
          repo: changeset.repo ?? "",
          branch: changeset.branch,
          status: changeset.status,
          prNumber: changeset.pr_number,
          prUrl: changeset.pr_url,
          shippedAt: prd?.shipped_at ?? null,
          checks,
          deployments: (
            (deployRows ?? []) as Array<{
              id: string;
              environment: string;
              status: string;
              deploy_url: string | null;
              deployed_at: string | null;
              created_at: string;
            }>
          )
            .slice(0, 4)
            .map((d) => ({
              id: d.id,
              environment: d.environment,
              status: d.status,
              url: d.deploy_url,
              at: d.deployed_at ?? d.created_at,
            })),
        }
      : null;

    /* ---------------- 07 Learn ---------------- */
    const learn: RunStageFact = learning
      ? {
          station: "learn",
          state: "done",
          note:
            learning.metric_label && learning.metric_value
              ? `${learning.metric_label} ${learning.metric_value}`
              : "it recorded what happened",
          href: "/learn",
        }
      : {
          station: "learn",
          state: changeset?.status === "merged" ? "next" : "quiet",
          note: changeset?.status === "merged" ? "waiting on the outcome" : "not yet",
          href: null,
        };

    const learnEvidence: LearnEvidence | null = learning
      ? {
          learningId: learning.id,
          summary: line(learning.summary, 400) ?? "",
          verdict: learning.verdict,
          metricLabel: line(learning.metric_label, 60),
          metricValue: line(learning.metric_value, 40),
          priorIce: learning.prior_ice,
          newIce: learning.new_ice,
          recordedByAgentSlug: learning.recorded_by_agent_slug,
          at: learning.created_at,
          viaMission: learning.prd_id == null && learning.mission_id === missionId,
        }
      : null;

    const byStation: Record<AgentStation, RunStageFact> = {
      sense: discover,
      decide,
      define: plan,
      design,
      build,
      ship,
      learn,
    };
    const stages = AGENT_STATION_ORDER.map((s) => byStation[s]);

    // Where the screen opens: whatever needs a human first, else whatever is
    // moving, else the furthest stage that actually happened. A run you come
    // back to after it finished should open on its result, not on its origin.
    const gate = stages.find((s) => s.state === "gate");
    const working = stages.find((s) => s.state === "working");
    const lastDone = [...stages].reverse().find((s) => s.state === "done");
    const focus = (gate ?? working ?? lastDone ?? byStation.build).station;

    // `pendingApprovals` is read but only used to prove a gate exists on this
    // mission; the Build stage above already reflects it through `gated`.
    void pendingApprovals;

    return {
      stages,
      focus,
      evidence: {
        discover: discoverEvidence,
        decide: decideEvidence,
        plan: planEvidence,
        design: designEvidence,
        ship: shipEvidence,
        learn: learnEvidence,
      },
    };
  });
