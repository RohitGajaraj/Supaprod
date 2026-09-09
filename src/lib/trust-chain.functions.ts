/**
 * SW-5 deliverable B (mission 3.11) - the Trust Ledger's UNBROKEN per-mission
 * chain: signal -> decision -> contract -> design gate -> build -> test ->
 * merge -> deploy -> outcome, walked from real rows. This is "the moat made
 * visible": a stranger must SEE the chain walk end to end, and see exactly
 * where a link is absent (the surface never fabricates a link and never hides
 * a hole).
 *
 * The existing Trust Ledger (trust-ledger.functions.ts) is a flat receipt list
 * (decisions + actions, standing/superseded/proven). This adds the orthogonal
 * pipeline-chain read model. Distinct from the tamper hash-chain in
 * trust-verify.ts (SHA-256-chain) - that proves the receipts were not altered;
 * this walks the semantic pipeline.
 *
 * The chain assembler (`assembleChain`) is PURE and unit-tested; the server fn
 * (`getMissionChain`) does the workspace-scoped, RLS-safe loads and hands the
 * evidence to it - mirroring assembleReceipts / loadReceipts.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanTitle } from "@/components/plan/format";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

/** The nine canonical links, in pipeline order. */
export type ChainLinkKey =
  "signal" | "decision" | "contract" | "design" | "build" | "test" | "merge" | "deploy" | "outcome";

/* ---------------------------------------------------------------------------
 * THE DESIGN-SKIP VOCABULARY LIVES HERE. Two states, two constants, one home.
 *
 * Anything that has to name either state IMPORTS from this block. Nothing
 * retypes the string. Three phrasings for one state is how the defect regrows,
 * and it has regrown twice already: `DESIGN_SKIPPED_ON_PURPOSE` was written by
 * hand on two surfaces before it was a constant, and the nothing-drawn sentence
 * below existed in two different wordings on two proof surfaces on the same day
 * (the chain link said "no design gate to clear", the release document said
 * "no human approval is on the record", about the same spec).
 *
 * WHY THE WORDS MATTER. The founder has ruled twice that the seven stations are
 * the FULL path and not the ONLY path: a code-level change needs no design
 * station, because design for it lives outside the product as prototypes,
 * mockups and wireframes, so the work goes plan -> build directly. A product
 * that supports that skip and then reports it as unfinished has not supported
 * it.
 *
 * ADOPTED - imports the constant, so it cannot drift:
 *   src/components/ship/WhatShipped.tsx:105        DESIGN_SKIPPED_ON_PURPOSE
 *   src/routes/_authenticated.plan.index.tsx       DESIGN_SKIPPED_ON_PURPOSE
 *
 * NOT YET ADOPTED - each of these still hard-codes the phrase by hand, and they
 * agree with the constant today only because somebody matched them by eye:
 *   src/routes/_authenticated.design.tsx:222       "Design skipped on purpose · <date>"
 *   src/routes/_authenticated.plan.spec.$id.tsx:1359  "Design was skipped on purpose"
 *   src/components/ship/WhatShipped.tsx (the gap line) owes DESIGN_NOTHING_DRAWN
 * All three files are owned by other workflows this week, so the exact import
 * each one needs is carried in this wave's `needsOtherFiles` instead of being
 * edited here. If you are editing one of them, adopt the constant and delete
 * its line from this list.
 * ------------------------------------------------------------------------- */

/** A PERSON OR A NAMED AGENT CHOSE STRAIGHT TO BUILD, and the `design_skipped`
 *  stage event is the receipt. Rendered as `Design ${DESIGN_SKIPPED_ON_PURPOSE}`.
 *  Never reach for this because a spec has no drawing: an absent drawing is not
 *  a decision, and it has its own sentence directly below. */
export const DESIGN_SKIPPED_ON_PURPOSE = "skipped on purpose";

/** NOTHING WAS DRAWN AND NOBODY CHOSE A ROUTE - the whole sentence, not a
 *  fragment, because it is the ONE answer every proof surface owes for this
 *  state and a fragment is exactly how two of them drifted apart.
 *
 *  It names no actor and no time because there is neither. It is read off a
 *  zero `prd_scaffolds` count plus the absence of any `design_skipped` /
 *  `design_requested` stage event - a read of what the database does not
 *  contain, never a judgement anybody made. That is the state of 77 of the 81
 *  live specs (re-measured through the Lovable MCP, 2026-08-06), so it is the
 *  sentence a stranger reads first, and it must not be mistaken for the one
 *  above it. */
export const DESIGN_NOTHING_DRAWN =
  "Nothing was drawn for this spec and no route was recorded, so no design gate was ever owed.";

/** The two `stage_events.to_stage` words the /plan route picker writes
 *  (`ROUTE_STAGE`, src/lib/design-scaffold.functions.ts). Repeated as literals
 *  rather than imported because that module is a server-function module for the
 *  design station and this one only ever READS the trail it leaves. */
const ROUTE_STAGE_SKIPPED = "design_skipped";
const ROUTE_STAGE_REQUESTED = "design_requested";

/**
 * - present: a real backing row exists.
 * - skipped: not owed on this mission. THREE DIFFERENT FACTS LAND HERE and only
 *   one of them is a decision, so the detail line always says which:
 *     `designSkip`    - a `design_skipped` stage event for this spec: somebody
 *                       chose Straight to Build, and the row names who and when.
 *                       The only one of the three that reports a decision.
 *     `designNotOwed` - nothing was ever drawn and no route was recorded. Read
 *                       off an absence; no actor, no time, and it claims none.
 *     `designOff`     - the workspace never turned the design stage on. A
 *                       configuration, not a per-spec call.
 *   Honest in all three cases, and not a hole in any of them.
 * - missing: a GAP - this link is absent but a LATER link is present, so a
 *   receipt that should exist does not. This is the broken-chain signal.
 * - pending: not yet reached (the mission has not progressed this far). Not a
 *   defect.
 */
export type ChainLinkStatus = "present" | "skipped" | "missing" | "pending";

export type ChainStep = {
  key: ChainLinkKey;
  label: string;
  status: ChainLinkStatus;
  detail: string;
  /** ISO timestamp of the backing row, when present. */
  occurredAt: string | null;
  /** The backing row id (for click-through + the trace ref), when present. */
  backingId: string | null;
  /** Agent that created/discovered this step, if known. Null for user-initiated or agent unknown. */
  agentName: string | null;
  /** Agent slug for styling/filtering purposes. */
  agentSlug: string | null;
};

export type MissionChain = {
  missionId: string;
  missionTitle: string;
  steps: ChainStep[];
  /** True when no link before the furthest-reached one is absent. */
  unbroken: boolean;
  /** Index of the furthest link reached (−1 if nothing). */
  reachedIndex: number;
};

const LINK_ORDER: ChainLinkKey[] = [
  "signal",
  "decision",
  "contract",
  "design",
  "build",
  "test",
  "merge",
  "deploy",
  "outcome",
];

const LINK_LABEL: Record<ChainLinkKey, string> = {
  signal: "Signal",
  decision: "Decision",
  contract: "Contract",
  design: "Design gate",
  build: "Build",
  test: "Test",
  merge: "Merge",
  deploy: "Deploy",
  outcome: "Outcome",
};

/** The evidence the pure assembler classifies - one optional backing row per
 * link (already resolved by the server fn).
 *
 * THE THREE DESIGN FIELDS ARE THREE DIFFERENT FACTS AND ONLY ONE IS A DECISION.
 * They were one field until 2026-08-06, which is how the type came to document
 * a recorded human choice while the server fn populated it, on 77 of 81 live
 * specs, from a row count of zero. Kept apart now so that cannot recur:
 *   `designOff`     - workspaces.design_stage_enabled is false. The whole
 *                     workspace never turned the station on. Configuration.
 *   `designSkip`    - a recorded `design_skipped` stage event for THIS spec.
 *                     A decision, with an actor and a timestamp of its own.
 *   `designNotOwed` - no drawing and no route event. An absence, read from the
 *                     database; nobody decided it and the field gives it
 *                     nowhere to put an actor or a time.
 * All three render `skipped`, because none of them is a hole. */
export type ChainEvidence = Partial<
  Record<
    ChainLinkKey,
    {
      id: string;
      at: string | null;
      detail: string;
      agentName?: string | null;
      agentSlug?: string | null;
    } | null
  >
> & {
  designOff?: boolean;
  /** A RECORDED DECISION: the newest `design_skipped` stage event for this spec,
   *  already worded, carrying that row's own actor and timestamp. Null / absent
   *  means no such event exists - which is NOT "straight to build", and is NOT
   *  "nothing was drawn" either. The second of those is `designNotOwed`. */
  designSkip?: { at: string | null; detail: string } | null;
  /** AN ABSENCE, NOT A DECISION: nothing was ever drawn for this spec and no
   *  route stage event was recorded. Derived from a zero `prd_scaffolds` count,
   *  so it names nobody and there is deliberately no `at` field to fill - a
   *  timestamp here would be a claim that something happened at a moment, and
   *  nothing happened. Rendered `skipped` (not owed, so not a gap) with a
   *  different SENTENCE from `designSkip`, never a different status. */
  designNotOwed?: { detail: string } | null;
};

/**
 * PURE. Classify each of the nine links into present / skipped / missing /
 * pending from the resolved evidence. A link is:
 *   present  when evidence[key] is set;
 *   skipped  for `design` when there is no design evidence and any one of the
 *            three design facts holds - designSkip (somebody recorded Straight
 *            to Build for this spec), designNotOwed (nothing was drawn and
 *            nobody chose a route) or designOff (the workspace never turned the
 *            stage on). Only designSkip reports a decision, and only designSkip
 *            fills `occurredAt`;
 *   missing  when absent AND a later link is present (a real gap);
 *   pending  when absent AND no later link is present (not yet reached).
 * Unit-tested in trust-chain.test.ts.
 */
export function assembleChain(
  missionId: string,
  missionTitle: string,
  evidence: ChainEvidence,
): MissionChain {
  const present: boolean[] = LINK_ORDER.map((k) => Boolean(evidence[k]));
  let reachedIndex = -1;
  for (let i = 0; i < present.length; i++) if (present[i]) reachedIndex = i;

  const steps: ChainStep[] = LINK_ORDER.map((key, i) => {
    const row = evidence[key] ?? null;
    // ORDER OF EVIDENCE, STRONGEST FACT FIRST, and the order is the whole point.
    // A recorded stage event is a decision somebody made, so it is read before
    // "nothing was drawn" (an absence, which nobody decided) and before the
    // workspace-wide toggle (a configuration): "a person sent THIS one straight
    // to Build" is a stronger and more specific statement than either. The
    // three produce the same STATUS and three different SENTENCES, so a reader
    // can always tell which of them they are looking at.
    const skip = key === "design" ? (evidence.designSkip ?? null) : null;
    const notOwed = key === "design" ? (evidence.designNotOwed ?? null) : null;
    let status: ChainLinkStatus;
    let detail: string;
    if (row) {
      status = "present";
      detail = row.detail;
    } else if (skip) {
      status = "skipped";
      detail = skip.detail;
    } else if (notOwed) {
      status = "skipped";
      detail = notOwed.detail;
    } else if (key === "design" && evidence.designOff) {
      status = "skipped";
      detail = "Design stage is off for this workspace.";
    } else if (i < reachedIndex) {
      status = "missing";
      detail = "No evidence for this link - a gap in the chain.";
    } else {
      status = "pending";
      detail = "Not yet reached.";
    }
    return {
      key,
      label: LINK_LABEL[key],
      status,
      detail,
      // A RECORDED skip has a real timestamp of its own - the stage event - so
      // the row carries WHEN the decision was made, exactly as a present link
      // does. `designNotOwed` contributes nothing here on purpose: it has no
      // time because nothing happened, and the type gives it no `at` to read.
      occurredAt: row?.at ?? skip?.at ?? null,
      backingId: row?.id ?? null,
      agentName: row?.agentName ?? null,
      agentSlug: row?.agentSlug ?? null,
    };
  });

  // Unbroken = no link before the furthest-reached one is missing.
  const unbroken = !steps.some((s, i) => i < reachedIndex && s.status === "missing");
  return { missionId, missionTitle, steps, unbroken, reachedIndex };
}

// ---------------------------------------------------------------------------
// Server fn - workspace-scoped, RLS-safe evidence loads
// ---------------------------------------------------------------------------

function firstBy<T extends { created_at?: string | null; at?: string | null }>(
  rows: T[] | null | undefined,
): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}

/** Same active-workspace resolution as trust-ledger.functions.ts: the page is a
 * single-workspace surface, so every read is pinned to one workspace - RLS
 * alone spans EVERY workspace the caller belongs to. */
async function resolveWorkspaceId(db: SupabaseClient): Promise<string | null> {
  const { data: ws } = await db.rpc("current_user_default_workspace");
  return defaultWorkspaceId(ws);
}

/** A swallowed read error is indistinguishable from "no rows" and would render
 * a fabricated broken chain - throw so react-query surfaces the error state. */
function must<T>(res: { data: T | null; error: { message: string } | null }): T | null {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** `stage_events.actor` in plain words. The column holds 'human', an agent slug
 *  or 'system' (`recordStageEvent`), and a chain of custody names who acted
 *  rather than printing a slug at a reader. */
function actorWords(actor: string | null | undefined): string {
  const a = (actor ?? "").trim();
  if (!a || a === "system") return "The system";
  if (a === "human") return "A person";
  return `The ${a} agent`;
}

export const getMissionChain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<MissionChain | null> => {
    const { supabase } = context;
    const db = supabase as unknown as SupabaseClient;
    const missionId = data.missionId;

    // Pin to the active workspace (a foreign or cross-workspace id returns null).
    const workspaceId = await resolveWorkspaceId(db);
    if (!workspaceId) return null;
    const mission = must(
      await db
        .from("missions")
        .select("id, title, status")
        .eq("id", missionId)
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
    );
    if (!mission) return null;
    const m = mission as { id: string; title: string | null; status: string | null };

    // Decisions + the prds they point at.
    const decisions = must(
      await db
        .from("decisions")
        .select("id, title, prd_id, created_at")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: true }),
    );
    const decisionRows = (decisions ?? []) as Array<{
      id: string;
      title: string | null;
      prd_id: string | null;
      created_at: string;
    }>;

    // Load agent_runs for this mission to attribute decisions to agents
    // (typically the Decide agent creates decision records during the decide phase).
    type AgentRunRow = {
      id: string;
      agent_slug: string | null;
      agent_name: string | null;
      created_at: string | null;
    };
    const agentRuns = must(
      await db
        .from("agent_runs")
        .select("id, agent_slug, agent_name, created_at")
        .eq("mission_id", missionId)
        .limit(100),
    ) as AgentRunRow[];
    // Map agent runs by approximate creation time to attribute decisions
    const agentsByTime = new Map<string, AgentRunRow>();
    for (const ar of agentRuns ?? []) {
      if (ar.agent_name) agentsByTime.set(ar.created_at ?? "", ar);
    }

    // Changesets for this mission (build/merge) + the prds they point at.
    const changesets = must(
      await db
        .from("studio_changesets")
        .select("id, title, status, pr_url, prd_id, created_at, updated_at")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: true }),
    );
    const changesetRows = (changesets ?? []) as Array<{
      id: string;
      title: string | null;
      status: string;
      pr_url: string | null;
      prd_id: string | null;
      created_at: string;
      updated_at: string;
    }>;

    const prdIds = Array.from(
      new Set(
        [...decisionRows.map((d) => d.prd_id), ...changesetRows.map((c) => c.prd_id)].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    );

    // Contract (prd), plus its opportunity for the signal hop.
    type PrdRow = {
      id: string;
      title: string | null;
      created_at: string;
      opportunity_id: string | null;
    };
    let prdRow: PrdRow | null = null;
    if (prdIds.length > 0) {
      const prds = must(
        await db
          .from("prds")
          .select("id, title, created_at, opportunity_id")
          .in("id", prdIds)
          .order("created_at", { ascending: true })
          .limit(1),
      );
      prdRow = firstBy((prds ?? []) as PrdRow[]);
    }

    // Deployments for the changesets. Only a SUCCESSFUL deploy is evidence the
    // thing shipped - a failed/pending row must not render a present link.
    type DeployRow = {
      id: string;
      deploy_url: string | null;
      status: string;
      deployed_at: string | null;
      created_at: string;
    };
    const changesetIds = changesetRows.map((c) => c.id);
    let deployRow: DeployRow | null = null;
    if (changesetIds.length > 0) {
      const deploys = must(
        await db
          .from("deployments")
          .select("id, deploy_url, status, deployed_at, created_at")
          .in("changeset_id", changesetIds)
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1),
      );
      deployRow = firstBy((deploys ?? []) as DeployRow[]);
    }

    // Outcome: learnings by direct mission_id, else by prd_id (the fragile hop).
    type LearningRow = {
      id: string;
      summary: string | null;
      verdict: string | null;
      created_at: string;
    };
    let learningRow: LearningRow | null = null;
    {
      const byMission = must(
        await db
          .from("learnings")
          .select("id, summary, verdict, created_at")
          .eq("mission_id", missionId)
          .order("created_at", { ascending: false })
          .limit(1),
      );
      learningRow = firstBy((byMission ?? []) as LearningRow[]);
      if (!learningRow && prdIds.length > 0) {
        const byPrd = must(
          await db
            .from("learnings")
            .select("id, summary, verdict, created_at")
            .in("prd_id", prdIds)
            .order("created_at", { ascending: false })
            .limit(1),
        );
        learningRow = firstBy((byPrd ?? []) as LearningRow[]);
      }
    }

    // Signal (best-effort multi-hop): prd.opportunity_id -> opportunity.theme_id
    // -> earliest signal in that theme. Any null hop leaves the link unresolved.
    type SignalRow = { id: string; title: string | null; created_at: string };
    let signalRow: SignalRow | null = null;
    if (prdRow?.opportunity_id) {
      const opp = must(
        await db
          .from("opportunities")
          .select("id, theme_id")
          .eq("id", prdRow.opportunity_id)
          .maybeSingle(),
      );
      const themeId = (opp as { theme_id?: string | null } | null)?.theme_id ?? null;
      if (themeId) {
        const sigs = must(
          await db
            .from("signals")
            .select("id, title, created_at")
            .eq("theme_id", themeId)
            .order("created_at", { ascending: true })
            .limit(1),
        );
        signalRow = firstBy((sigs ?? []) as SignalRow[]);
      }
    }

    // SW-7 (mission 3.4): the design station is real now (design_gate_status +
    // design_stage_enabled both ship) - this used to hardcode designOff:true
    // from before the station was built, which silently showed a real approved
    // design gate as "skipped, off for this workspace" (found live 2026-07-08).
    // Off is still honest when the workspace never turned the stage on; a
    // decided gate is present; an undecided gate on an enabled stage is pending.
    //
    // 2026-08-06, AND IT IS THE FOUNDER'S RULING MADE CONCRETE. Two defects on
    // this one branch, both of which made THE PROOF SURFACE assert a human
    // judgement no human made:
    //
    //   1. A COLUMN DEFAULT WAS BEING READ AS A DECISION. `design_gate_status`
    //      is `not null default 'pending'`
    //      (supabase/migrations/20260708170000_sw4_design_station.sql:16), so
    //      the old `prdDesign?.design_gate_status` test was true for every spec
    //      ever written - 80 of 81 live rows sit at that untouched default with
    //      `design_decided_at` null. `assembleChain` classifies any non-null
    //      evidence row as `present`, so a shipped bug fix that legitimately
    //      skipped design drew its Design link satisfied, over the detail line
    //      "Design gate pending". A gate is now evidence only when
    //      `design_decided_at` says a human actually decided it.
    //
    //   2. THE SKIP THE PRODUCT RECORDS WAS NEVER READ. The /plan route picker
    //      writes a `design_skipped` stage event (`chooseDesignRoute`,
    //      src/lib/design-scaffold.functions.ts) and until now that row was read
    //      in exactly two places, both inside that same file. The `skipped`
    //      status has existed here all along but was wired only to the
    //      workspace-wide toggle, so the per-spec decision - the founder's own
    //      path - had no way to reach the chain. It does now.
    //
    //   3. ADDED 2026-08-06 IN THE SAME DAY'S REVIEW, because fixing 2 grew a
    //      third defect of exactly the kind this file exists to refuse. The
    //      nothing-ever-drawn case was first written into `designSkip`, the
    //      field whose own documentation called it a recorded human decision -
    //      so on 77 of the 81 live specs the type promised a decision and the
    //      code supplied a zero row count. It now has its own field,
    //      `designNotOwed`, with no place to put an actor or a time. Re-measured
    //      through the Lovable MCP on 2026-08-06: 81 specs, 4 with any
    //      `prd_scaffolds` row, and 0 `stage_events` of either route kind
    //      anywhere in the database - so the nothing-drawn branch is the one
    //      that fires on essentially every live chain, and it is the one whose
    //      wording had to be exactly right.
    //
    // FIVE STATES, NOT TWO, and the order below is the order of the evidence:
    // a decided gate (present) beats a RECORDED skip (skipped, with an actor and
    // a time, `designSkip`) beats nothing ever drawn (skipped, with neither, and
    // it says so, `designNotOwed`). A drawing that exists with the gate
    // undecided, and a spec routed `design_requested` with nothing drawn, both
    // fall through to missing or pending, because those two ARE holes.
    let designEvidence: { id: string; at: string | null; detail: string } | null = null;
    let designSkip: { at: string | null; detail: string } | null = null;
    let designNotOwed: { detail: string } | null = null;
    let designOff = true;
    if (prdRow) {
      const prdDesign = must(
        await db
          .from("prds")
          .select("design_gate_status, design_decided_at, workspace_id")
          .eq("id", prdRow.id)
          .maybeSingle(),
      ) as {
        design_gate_status: string | null;
        design_decided_at: string | null;
        workspace_id: string | null;
      } | null;
      if (prdDesign?.workspace_id) {
        const ws = must(
          await db
            .from("workspaces")
            .select("design_stage_enabled")
            .eq("id", prdDesign.workspace_id)
            .maybeSingle(),
        ) as { design_stage_enabled: boolean | null } | null;
        designOff = !ws?.design_stage_enabled;
      }

      // The newest route this spec was put on. Newest wins, so a spec routed
      // straight to Build and LATER handed to Design stops reading as skipped.
      // Read through `must` like every other load here: a swallowed error would
      // be indistinguishable from "nobody chose", and this surface must never
      // guess about the record.
      const routeRows = must(
        await db
          .from("stage_events")
          .select("to_stage, at, actor")
          .eq("entity_type", "spec")
          .eq("entity_id", prdRow.id)
          .in("to_stage", [ROUTE_STAGE_SKIPPED, ROUTE_STAGE_REQUESTED])
          .order("at", { ascending: false })
          .limit(1),
      ) as Array<{ to_stage: string; at: string; actor: string | null }> | null;
      const newestRoute = firstBy(routeRows ?? []);

      // WAS THERE EVER A DESIGN TO JUDGE? `designGateBlocksDispatch`
      // (src/lib/build/design-gate.ts) already rules that an unmade drawing does
      // not block a dispatch, and the same fact decides what this link can
      // honestly SAY. Without it, requiring `design_decided_at` above would flip
      // 80 of the 81 live specs from a false "present" to "missing - a gap in
      // the chain", which is the same defect wearing the opposite coat: the
      // proof surface calling the founder's own supported path a failure of the
      // record. head+count, so asking costs no markup.
      const drawings = await db
        .from("prd_scaffolds")
        .select("id", { count: "exact", head: true })
        .eq("prd_id", prdRow.id);
      if (drawings.error) throw new Error(drawings.error.message);
      const hasDrawing = (drawings.count ?? 0) > 0;

      if (!designOff && prdDesign?.design_gate_status && prdDesign.design_decided_at) {
        designEvidence = {
          id: prdRow.id,
          at: prdDesign.design_decided_at,
          detail: `Design gate ${prdDesign.design_gate_status}`,
        };
      } else if (newestRoute?.to_stage === ROUTE_STAGE_SKIPPED) {
        // A decided gate outranks a recorded skip: if a human judged a drawing,
        // that judgement is the stronger fact and the link is genuinely present.
        designSkip = {
          at: newestRoute.at,
          // The product's one word for this state, plus WHO chose. WHEN is the
          // row's own time column, fed by `occurredAt` from the same event, so
          // the detail line does not say it a second time.
          detail: `Design ${DESIGN_SKIPPED_ON_PURPOSE}. ${actorWords(newestRoute.actor)} sent this straight to Build.`,
        };
      } else if (!designOff && !hasDrawing && newestRoute?.to_stage !== ROUTE_STAGE_REQUESTED) {
        // NOTHING WAS DRAWN AND NOBODY ASKED FOR ONE. Not owed, so not a hole -
        // but this branch has NO actor and NO time, and it deliberately claims
        // neither. It reports the absence of a drawing, which is a real read,
        // and stops short of the sentence above it, which reports a decision.
        // The route picker is what turns this into that.
        //
        // IT IS A DIFFERENT FIELD, not a second use of `designSkip`. Reaching
        // the branch means `newestRoute` is null (a `design_skipped` row took
        // the branch above; a `design_requested` row is excluded by the test on
        // this line), so "no route was recorded" in the sentence is a fact this
        // function established, not a guess. `DESIGN_NOTHING_DRAWN` is the ONE
        // wording for it: /ship's release document owes the same sentence for
        // the same state and today prints its own (see the constant's block).
        //
        // The two cases this must NOT swallow, both of which fall through to
        // missing/pending: a drawing that exists with the gate undecided (a call
        // a human genuinely owes), and a spec routed `design_requested` with
        // nothing drawn yet (design was asked for and has not arrived).
        designNotOwed = { detail: DESIGN_NOTHING_DRAWN };
      }
    }

    // Test has no dedicated substrate today (test attempts are not yet
    // first-class rows). We render it honestly: CI runs on the PR in this
    // build spine, so only a changeset that reached pr_open/merged carries
    // test evidence - 'committed' pushed a commit with no PR (no CI), and
    // 'abandoned' may never have left staging intent.
    const testChangeset =
      changesetRows.find((c) => c.status === "pr_open" || c.status === "merged") ?? null;
    const buildChangeset = changesetRows[0] ?? null;
    const mergedChangeset = changesetRows.find((c) => c.status === "merged") ?? null;
    const firstDecision = decisionRows[0] ?? null;

    // Attribute decision to the agent run closest in time (during the decide phase).
    // This is a best-effort heuristic: the agent that created the decision typically
    // ran around the time the decision was recorded.
    const decisionAgent = firstDecision
      ? agentRuns.find(
          (ar) =>
            ar.created_at &&
            firstDecision.created_at &&
            Math.abs(
              new Date(ar.created_at).getTime() - new Date(firstDecision.created_at).getTime(),
            ) < 60000, // within 1 minute
        )
      : null;

    const evidence: ChainEvidence = {
      signal: signalRow
        ? { id: signalRow.id, at: signalRow.created_at, detail: signalRow.title ?? "Signal" }
        : null,
      decision: firstDecision
        ? {
            id: firstDecision.id,
            at: firstDecision.created_at,
            detail: cleanTitle(firstDecision.title) ?? "Decision recorded",
            agentName: decisionAgent?.agent_name ?? null,
            agentSlug: decisionAgent?.agent_slug ?? null,
          }
        : null,
      contract: prdRow
        ? { id: prdRow.id, at: prdRow.created_at, detail: prdRow.title ?? "Contract (spec)" }
        : null,
      design: designEvidence,
      designOff,
      designSkip,
      designNotOwed,
      build: buildChangeset
        ? {
            id: buildChangeset.id,
            at: buildChangeset.created_at,
            detail: buildChangeset.title || `Changeset on ${buildChangeset.status}`,
          }
        : null,
      test: testChangeset
        ? {
            id: testChangeset.id,
            at: testChangeset.updated_at,
            detail: `Tests ran (changeset ${testChangeset.status})`,
          }
        : null,
      merge: mergedChangeset
        ? {
            id: mergedChangeset.id,
            at: mergedChangeset.updated_at,
            detail: mergedChangeset.pr_url ? "Merged (PR)" : "Merged",
          }
        : null,
      deploy: deployRow
        ? {
            id: deployRow.id,
            at: deployRow.deployed_at ?? deployRow.created_at,
            detail: deployRow.deploy_url ? "Deployed (live URL)" : "Deploy succeeded",
          }
        : null,
      outcome: learningRow
        ? {
            id: learningRow.id,
            at: learningRow.created_at,
            detail: learningRow.verdict
              ? `Outcome: ${learningRow.verdict}`
              : (learningRow.summary ?? "Outcome recorded"),
          }
        : null,
    };

    return assembleChain(missionId, cleanTitle(m.title) ?? "Untitled mission", evidence);
  });

/** List recent missions for the chain picker, pinned to the active workspace
 * (RLS alone spans every workspace the caller belongs to - see resolveWorkspaceId). */
export const listChainMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<Array<{ id: string; title: string; status: string | null }>> => {
      const { supabase } = context;
      const db = supabase as unknown as SupabaseClient;
      const workspaceId = await resolveWorkspaceId(db);
      if (!workspaceId) return [];
      const rows = must(
        await db
          .from("missions")
          .select("id, title, status")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(25),
      );
      return (
        (rows ?? []) as Array<{ id: string; title: string | null; status: string | null }>
      ).map((m) => ({ id: m.id, title: m.title ?? "Untitled mission", status: m.status }));
    },
  );
