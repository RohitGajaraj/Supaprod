/**
 * Surface 3 (Approvals) - the single pull point (architecture §5).
 *
 * getApprovalsQueue federates every pending human gate the product already
 * has into one typed list, so the queue never asks a user to visit five
 * screens to find out what needs them. Every source is an EXISTING,
 * already-shipped table/resolver - this module adds no new gate, no new
 * table, no new capability; it only reads and re-shapes.
 *
 * Consolidation note (read, not a new gate): the architecture's gate
 * inventory lists ONE "Tool-call confirm/review" gate, backed by the single
 * `agent_approvals` table. Both `agent_loop.functions.listApprovals` and
 * `governance.functions.listGovernApprovals` read that same table - using
 * both here would double-list every pending tool call. This module reads
 * the richer one (`listGovernApprovals`: mission title, risk grade, agent
 * track record) and decides through its matching resolver (`resolveApproval`),
 * which already carries the tool-execution semantics `agent_loop`'s
 * `decideApproval` also implements (see the doc comment on resolveApproval).
 *
 * Gates federated: tool-call confirm/review, what-to-build / plan-sign-off
 * / other pending decisions, memory graduation (memory_candidates and
 * house_rules), trust graduation, specs in review, opportunities carrying a
 * Critic verdict, open assumption-supersession challenges, undecided design
 * gates, and proposed playbooks (2026-07-18: ONE COUNT, ONE SOURCE - this
 * queue now federates every family Today's "needs you" triage counts, so
 * the rail badge, the Today hero, and the approvals pill can never disagree
 * again). Ship gates and spend gates already route through the tool-call
 * gate above when they are agent-executed tools; this module does not
 * invent a separate spend feed (no such read exists yet - see the ledger
 * note in the lane report). Pushed Brain insights and ready fan-out batches
 * are deliberately NOT federated here: they are attention, not a yes/no
 * approval with an existing decide resolver, so Today keeps owning them.
 *
 * Workspace scoping (2026-07-18, Change 3): `workspaceId` is optional. Every
 * source that carries a `workspace_id` column is filtered to it when given.
 *
 * **Corrected 2026-08-28 (F-149): `agent_approvals` DOES carry one** and is now
 * scoped like the rest. This paragraph named it as an exception alongside trust
 * graduation, and it was wrong — all 324 rows have a workspace and the loop has
 * always written it. `trust_graduation_proposals` remains the only genuine
 * exception, which `GATE_SOURCE` records as `hasWorkspace: false`.
 * Omitting it keeps the original RLS-wide "everything across every
 * workspace I'm a member of" read this queue has always done.
 */
import { createServerFn } from "@tanstack/react-start";
import { resolveApprovalPolicy } from "@/lib/ai/approval-policy";
import { isMergeGate, mergeCardLines } from "@/lib/spine/what-the-merge-gate-shows";
import { approvalRecordFor } from "@/lib/ai/approval-policy.server";
import { collisionsFrom, targetOf, type Anchor, type Collision } from "@/lib/presence/collision";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readGovernApprovals, resolveApproval } from "@/lib/governance.functions";
import { timedPhase } from "@/lib/server-timing.server";
import type { Database } from "@/integrations/supabase/types";
import {
  readDecisions,
  updateDecision,
  resolveAssumptionChallenge,
} from "@/lib/decisions.functions";
import { listMemoryCandidates, decideMemoryCandidate } from "@/lib/memory-candidates.functions";
import { readHouseRules, decideHouseRule } from "@/lib/house-rules.functions";
import {
  readTrustGraduationProposals,
  decideTrustGraduation,
  type TrustGraduationProposal,
} from "@/lib/trust.functions";
import { savePrd, updateOpportunity, type CriticReview } from "@/lib/discovery.functions";
import { decideDesignGate } from "@/lib/design-scaffold.functions";
import { decidePlaybookProposal } from "@/lib/playbooks.functions";
import { recordGateSignalCore } from "@/lib/gate-signals.functions";
import { castByStation, type AgentStation } from "@/lib/agent-vocabulary";

/** The station whose specialist owns each gate family, so a gate that carries
 *  no explicit agent slug still shows an honest attribution chip (the agent
 *  that produces that kind of call). */
/**
 * WHICH STATION EACH KIND OF CALL BELONGS TO. Exported since 2026-09-10
 * because the home's road needs it too: it drew Design empty while the
 * headline counted four design gates, and this map is the thing that already
 * knew they belonged at Design.
 */
export const APPROVAL_KIND_STATION: Partial<Record<ApprovalKind, AgentStation>> = {
  decision: "decide",
  opportunity: "decide",
  assumption_challenge: "decide",
  spec: "define",
  design_gate: "design",
  tool_call: "build",
  memory_candidate: "learn",
  house_rule: "learn",
};
function approvalAgentSlug(kind: ApprovalKind, explicit: string | null): string | null {
  if (explicit) return explicit;
  const station = APPROVAL_KIND_STATION[kind];
  return station ? (castByStation(station)[0]?.slug ?? null) : null;
}
import { ACTION_LABEL } from "@/lib/agent-vocabulary";
import { sourceLabel } from "@/lib/memory-candidates";
import { toolConsequence, gateHeadline, REVERSIBILITY_LABEL } from "@/lib/tool-consequences";
import type { VerdictTone } from "@/components/ink/chips";
import { cleanTitle } from "@/components/plan/format";

/** The ten gate families this queue federates. Used to route the decide
 *  call to the right existing resolver - never to brand anything in the UI. */
export const APPROVAL_KINDS = [
  "tool_call",
  "decision",
  "memory_candidate",
  "house_rule",
  "trust_graduation",
  "spec",
  "opportunity",
  "assumption_challenge",
  "design_gate",
  "playbook_proposal",
] as const;
export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

/** The filter row's buckets (architecture §5 / the taste doc's restraint
 *  law: text tabs, not a facet explosion). "spend" exists as a bucket so the
 *  row matches the copy deck's shape; nothing routes into it yet because no
 *  spend-gate READ exists in the codebase today (see the ledger note). Specs,
 *  opportunities, design gates, and playbook proposals all read as sensible
 *  "proposals"; an assumption challenge is a "gate" (it reopens a standing
 *  decision, the same shape as a tool-call gate). */
export type ApprovalFilter = "all" | "proposals" | "gates" | "memory" | "spend";

/**
 * ── ONE ITEM IN THE QUEUE OF EVERYTHING AWAITING HUMAN JUDGMENT ───────────
 *
 * MOVED HERE 2026-09-10, from `components/ink/ApprovalCard.tsx`. That file
 * held both this type and a card component, and the component had no importer
 * anywhere in the product: `/inbox` and the Meridian gallery both draw
 * `components/meridian/ApprovalCard.tsx`, a different file with a different
 * shape. The only thing left reading the ink file was this `import type`, so
 * a 220-line component with two `ink-*` classes and a hand-rolled
 * `shortTime()` was being kept alive by a type alias. The type belongs to the
 * queue that produces it; the component is deleted.
 *
 * Anatomy the type still describes (architecture §5): what the agent proposes
 * · why, with provenance · cost/impact · one-tap approve / reject / edit.
 */
export type ApprovalItem = {
  id: string;
  /** Card kind chip, e.g. "PROPOSAL", "PLAN", "SHIP GATE", "SPEND", "MEMORY". */
  kind: string;
  kindTone?: VerdictTone;
  /** The agent that owns this gate; renders the attribution chip. */
  agentSlug?: string | null;
  project?: string;
  /** What the agent proposes, one plain sentence. */
  title: string;
  /** Why: evidence lines with provenance ("12 signals point at checkout friction"). */
  evidence: string[];
  /** Cost / impact line ("~120 credits · touches checkout flow only"). */
  impact?: string;
  /** The belief this decision carries, read straight off the decision row.
   *  A person approving an agent's bet should see the bet, not just its name. */
  forecast?: {
    claim: string;
    howWeWillKnow?: string | null;
    horizonDate?: string | null;
    resolution?: string | null;
  };
  /** Consequence phrases (button helper text). */
  approveConsequence: string;
  rejectConsequence: string;
  timestamp?: string;
};

export type ApprovalQueueItem = ApprovalItem & {
  kindKey: ApprovalKind;
  /**
   * Is the work this gate holds still live?
   *
   * ── F-128, MEASURED BY S1 ON THE RENDERED SURFACE ────────────────────────
   * `/inbox` says "52 decisions are ready for you" and every row promises
   * "Approve · unblocks Build for this spec". **For 22 of the 29 pending
   * tool-call gates the run they held is already over**, so approving cannot
   * unblock anything, and seven more have no `agent_runs` row at all. None is
   * past its expiry, so nothing will ever clear them; the youngest is 33 days.
   *
   * `true` the work is still going, and answering this releases it.
   * `false` we looked, and it has finished. Approving changes nothing.
   * `null`  we cannot say: no mission on the gate, no run for the mission, or
   *         the lookup failed. **Never collapse this into `false`** — it would
   *         tell a person the work had finished when nothing ever started.
   *
   * Age cannot substitute for this. A 33-day-old call whose run is still queued
   * is genuinely waiting and `created_at` cannot tell the two apart.
   *
   * Only tool-call gates carry a meaningful value; every other kind is null,
   * because a spec, a decision or a house rule is not held open by a run.
   */
  gatesLiveWork: boolean | null;
  /** The id to send back on decide - never the composite `item.id`. */
  sourceId: string;
  filterBucket: Exclude<ApprovalFilter, "all">;
  /** Null when the gate has no project of its own (workspace-wide memory,
   *  trust, or a mission with no resolvable project - see the ledger note). */
  projectId: string | null;
  projectName: string | null;
  /**
   * The run this call belongs to, so the Inbox can open it (Lane 1's fifth
   * review, 2026-09-09: of 21 pending calls, none could name a run, and the
   * layers could not be stitched from either side). The link is
   * `agent_approvals.run_id` to `agent_runs.track_id`, both written by the
   * loop; null when the gate predates the spine or belongs to no run, which
   * is every family but the tool call.
   */
  trackId: string | null;
  /** The agent that owns this gate (real slug for tool-call gates, else the
   *  owning station's specialist); renders the attribution chip. Set in the
   *  final map, so the per-kind constructions do not each repeat it. */
  agentSlug?: string | null;
};

/**
 * A family the queue could not report in full, and why.
 *
 * `failed` is the case the handler already degraded for: a source threw, its
 * items became an empty list so one refused read could not blank the other
 * nine, and nothing told the user. `capped` is the sibling nobody had counted:
 * every family read stops at `FAMILY_LIMIT`, and a family standing exactly on
 * it has almost certainly been cut.
 *
 * Both mean the same thing to a person, which is why they share a shape: the
 * number on the screen is not the whole truth and the surface must stop
 * stating it as one.
 */
export type QueueGap = { family: string; why: "failed" | "capped" };

export type ApprovalsQueueResult = {
  items: ApprovalQueueItem[];
  /**
   * Empty when the queue is complete, which is the ordinary case.
   *
   * A CAP IS FINE FOR LOOKING AND NEVER FOR CONCLUDING. The reads bound
   * themselves so one enormous family cannot flood the queue, and that is
   * correct. What was not correct was three surfaces turning a bounded read
   * into an exact count and a headline. Measured on 2026-08-27: 116 specs
   * carry `design_gate_status = 'pending'` in workspaces with the design stage
   * on, against a limit of 100, so 16 calls that need a person were absent
   * from the only screens that list them and no surface could say so.
   */
  incomplete: QueueGap[];
};

/**
 * How many rows any one family may contribute.
 *
 * Named rather than repeated at six call sites, because the number has to be
 * comparable against a result length to know whether it bit, and a literal
 * repeated seven times is a rule nobody can enforce.
 */
export const FAMILY_LIMIT = 100;

/** Tolerant critic_review reader: jsonb object or a stringified copy (mirrors
 *  today.functions.ts's private helper of the same name). */
function parseCriticReview(raw: unknown): CriticReview | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CriticReview;
    } catch {
      return null;
    }
  }
  return raw as CriticReview;
}

/** A short "why" line from a Critic verdict, honest when there isn't one yet. */
function criticEvidenceLine(cr: CriticReview | null): string {
  if (!cr) return "Waiting on your call. No Critic review yet.";
  if (cr.risks?.length) return cr.risks[0];
  if (cr.summary) return cr.summary;
  return "Waiting on your call.";
}

const GetQueueSchema = z.object({ workspaceId: z.string().uuid().optional() });

export const getApprovalsQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof GetQueueSchema>) => GetQueueSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<ApprovalsQueueResult> =>
    // Its own Server-Timing entry, so the next slow reading can be split
    // between this handler and the Worker's pre-handler cost by a curl.
    timedPhase("approvals-queue", () =>
      readApprovalsQueue(context.supabase, context.userId, data.workspaceId ?? null),
    ),
  );

/**
 * THE READ BEHIND `getApprovalsQueue`, callable with a client you already hold.
 *
 * ── TWELVE ROUND TRIPS DEEP, AND THE DATABASE WAS INNOCENT (2026-09-08) ─────
 *
 * Lane 2 timed the Inbox on Helio Labs: this one call took 7,694 ms while the
 * page's other reads took 300 to 2,300 ms. Every query it runs was then timed
 * as the signed-in user with RLS on: 0.05 to 6 ms each, about 20 ms for the
 * lot, and production's pg_stat_statements agreed (the worst statement the
 * authenticated role has ever run on these tables was 262 ms). The cost was
 * the SHAPE: twelve sequential Worker-to-PostgREST round trips on the
 * critical path, at the ~275 ms warm / ~550 ms cold this deployment pays per
 * hop (measured on `landing-data`, a 0.03 ms query, on 09-04). Seven of the
 * twelve were inside `listGovernApprovals`, called as a nested server
 * function that re-ran the auth middleware to get there.
 *
 * NOW: two hops on the scoped path (the one every surface uses), a third only
 * when a pending decision's spec belongs to a project no other family named.
 * The four nested readers are called as plain functions with this client;
 * `readGovernApprovals` runs its own second hop in one go and skips the two
 * outcome reads this queue never renders; the assumption challenges carry
 * their assumption, decision and spec as PostgREST embeds instead of three
 * dependent reads; the project names chain off the family reads they need
 * and land with the first hop's stragglers; the snoozes and the scoped
 * design-gate read leave with everyone else. The chain is guarded by
 * `a-queue-is-two-hops-deep.test.ts`, which drives this function with a
 * fake client that counts rounds.
 */
/**
 * "From <where it came from>", or nothing when that names the title again.
 *
 * READ ON THE SERVED INBOX, 2026-09-09. The focused card asked "Make this
 * call: Show homeowner installer arrival window on order page?" and its body
 * ended "From Show homeowner installer arrival window on order page" -- the
 * same string, as a dangling clause under six lines of agent prose.
 *
 * AND IT WAS A CONSEQUENCE OF A CHANGE MADE THE SAME DAY. A mission-sourced
 * decision used to be titled "Mission completed: <the mission>" while
 * `source_label` was "<the mission>", so the two read as different strings and
 * the collision was invisible. Taking that prefix out at its writer
 * (`handoff.server.ts`) made them identical. The removal was right; not
 * sweeping for what depended on the two being different was not, and a defect
 * is a shape rather than a location.
 *
 * COMPARED, NOT SPECIAL-CASED TO MISSIONS. A spec or a meeting whose label
 * happens to match its decision's title is the same uninformative line for the
 * same reason, and a rule that reads the two values it is about cannot go
 * stale the way a list of source kinds would.
 *
 * PROVENANCE IS NOT LOST WHEN THIS RETURNS NULL. `impact` carries "raised
 * during a pass" off `source_kind`, which is the field designed for it.
 */
export function provenanceLine(
  title: string | null | undefined,
  sourceLabel: string | null | undefined,
): string | null {
  const label = sourceLabel?.trim();
  if (!label) return null;
  const t = title?.trim().toLowerCase() ?? "";
  return label.toLowerCase() === t ? null : `From ${label}`;
}

export async function readApprovalsQueue(
  supabase: SupabaseClient<Database>,
  userId: string,
  wsId: string | null,
): Promise<ApprovalsQueueResult> {
  {
    /**
     * A DROPPED FAMILY MUST NOT BE INVISIBLE. Every source below degrades to an
     * empty list on failure, and the queue then renders "nothing needs you" --
     * which is the same screen a genuinely clear queue draws. That degradation
     * is deliberate and stays: one refused read must not blank the other nine.
     * What was missing is any way to know it happened, so each of the ten family
     * sources now says so on the server, and so does the one read a level deeper
     * (:647, assumption detail) whose refusal drops a whole family from INSIDE
     * the family. TWO READS IN THIS HANDLER ARE STILL SILENT, deliberately: the
     * decision-title and spec-title lookups at :672 lose only a title to its
     * fallback ("A past decision" / "Spec: a spec") and drop no item, and their
     * `Promise.resolve({ data: [] })` short-circuit branch carries no `error`
     * key, so reading one would mean widening that literal for a log about
     * nothing a user can miss. Read the claim as "every swallow that can cost
     * you an item", not "every discarded error below".
     * TELLING THE USER is the other half and is NOT done here:
     * it needs a field on ApprovalsQueueResult plus rendering in ApprovalsTray
     * and Today, which spans files this pass does not own.
     */
    /*
     * WHAT THE QUEUE COULD NOT TELL YOU, collected as it happens and returned
     * with the items. The handler has always degraded correctly and always
     * silently; this is the field the comment above said was missing.
     */
    const incomplete: QueueGap[] = [];
    const noteGap = (family: string, why: QueueGap["why"]): void => {
      if (!incomplete.some((g) => g.family === family && g.why === why)) {
        incomplete.push({ family, why });
      }
    };

    const familyFailed =
      (family: string) =>
      (e: unknown): void => {
        noteGap(family, "failed");
        console.error(
          `[approvals-queue] ${family} dropped from the queue: ${e instanceof Error ? e.message : String(e)}`,
        );
      };
    /** Same, for the sources that resolve with a PostgrestError instead of throwing. */
    const noteReadError = (family: string, error: { message: string } | null): void => {
      if (error) {
        noteGap(family, "failed");
        console.error(`[approvals-queue] ${family} dropped from the queue: ${error.message}`);
      }
    };

    /*
     * REAL PROMISES, NOT BUILDERS, for the three reads the projects read
     * chains off: a PostgREST builder re-runs its fetch on every `await`, and
     * these are awaited twice (once by the chain, once by the family itself).
     */
    const specsP = Promise.resolve(
      // Specs in review (mirrors today.functions.ts getNeedsYou's prdCalls read).
      (() => {
        let q = supabase
          .from("prds")
          .select("id,title,status,critic_review,updated_at,project_id")
          .eq("status", "review")
          // P-142: a spec whose design gate closed with it is not asking.
          .or("design_gate_status.is.null,design_gate_status.neq.superseded")
          .order("updated_at", { ascending: true })
          .limit(FAMILY_LIMIT);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
    );
    const oppsP = Promise.resolve(
      // Opportunities the Critic said revise/kill on, still in backlog
      // (mirrors today.functions.ts getNeedsYou's oppCalls read).
      (() => {
        let q = supabase
          .from("opportunities")
          .select("id,title,critic_review,created_at,project_id")
          .filter("critic_review->>verdict", "in", '("revise","kill")')
          .eq("status", "backlog")
          .order("created_at", { ascending: true })
          .limit(FAMILY_LIMIT);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
    );
    /*
     * The design gates of THIS workspace, read in the first hop when the
     * caller named one. Whether the family exists here at all (the design
     * stage is on) is answered by the workspaces read beside it, and the rows
     * are dropped after the barrier if it says no; that costs one cheap read
     * in a workspace with the stage off and saves a dependent round trip in
     * every workspace with it on. The unscoped path keeps the dependent read
     * because it does not know which workspaces to ask until then.
     */
    const scopedDesignGatesP = wsId
      ? Promise.resolve(
          supabase
            .from("prds")
            .select("id,title,updated_at,project_id")
            .eq("workspace_id", wsId)
            .eq("design_gate_status", "pending")
            .order("updated_at", { ascending: true })
            .limit(FAMILY_LIMIT),
        )
      : Promise.resolve(null);
    /*
     * The project names, chained off the three families that carry a
     * project id, so they land one hop after those rows and not one hop after
     * the whole barrier. A decision's spec can name a project none of these
     * did; that case is read after the barrier, and only then.
     */
    const projectsP = Promise.all([specsP, oppsP, scopedDesignGatesP]).then(
      ([specs, opps, gates]) => {
        const ids = new Set<string>();
        for (const r of (specs.data ?? []) as { project_id: string | null }[]) {
          if (r.project_id) ids.add(r.project_id);
        }
        for (const r of (opps.data ?? []) as { project_id: string | null }[]) {
          if (r.project_id) ids.add(r.project_id);
        }
        for (const r of (gates?.data ?? []) as { project_id: string | null }[]) {
          if (r.project_id) ids.add(r.project_id);
        }
        return ids.size
          ? Promise.resolve(
              supabase
                .from("projects")
                .select("id,name")
                .in("id", [...ids]),
            ).then((r) => ({
              data: (r.data ?? []) as { id: string; name: string | null }[],
              error: r.error as { message: string } | null,
            }))
          : Promise.resolve({
              data: [] as { id: string; name: string | null }[],
              error: null as { message: string } | null,
            });
      },
    );

    const [
      govern,
      decisionsRes,
      memCandidates,
      houseRules,
      trustProposals,
      specRows,
      oppRows,
      challengeRows,
      playbookRows,
      designWsRows,
      scopedDesignGates,
      projectsRes,
      snoozeRes,
    ] = await Promise.all([
      /*
       * ── F-149: THE COMMENT THAT USED TO BE HERE WAS FALSE ────────────────
       *
       * It read "agent_approvals predates workspace tenancy (no workspace_id
       * column), so this stays unscoped". **The column exists and all 324 rows
       * carry it**, including 28 of the 29 pending; `loop.server.ts:1906` has
       * written it all along, and `GATE_SOURCE` in this very file already says
       * `hasWorkspace: true` for this family. The code contradicted itself and
       * the prose won.
       *
       * The cost was on the inbox: "N need you" mixed one workspace's calls and
       * runs with EVERY workspace's approvals. S1 and S2 both found it, both
       * declined to act because they believed it needed a schema change, and I
       * had written a migration before checking the data.
       *
       * `listGovernApprovals` still returns every STATUS — the Govern surface
       * needs decided history for the track record — and the pending filter
       * below narrows it to the queue. Only the tenancy changed.
       */
      readGovernApprovals(supabase as unknown as SupabaseClient, userId, {
        workspaceId: wsId,
        withOutcomes: false,
      }).catch((e) => {
        familyFailed("tool-call gates")(e);
        return {
          approvals: [],
          trackByAgent: {},
          outcomeByAgent: {},
          rejectionsByKey: {},
          medianResponseMs: null,
        };
      }),
      readDecisions(supabase, { status: "pending", workspaceId: wsId ?? undefined }).catch((e) => {
        familyFailed("pending decisions")(e);
        return { decisions: [], hydrationError: null };
      }),
      // Direct RLS-wide read, not the workspace-scoped list function: the
      // queue is the single pull point (law 4.4), so a pending candidate in
      // ANY of the caller's workspaces must surface here, unless scoped.
      (() => {
        let q = supabase
          .from("memory_candidates")
          .select("id, content, status, importance, source_kind, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(FAMILY_LIMIT);
        if (wsId) q = q.eq("workspace_id", wsId);
        return Promise.resolve(q).then(({ data: rows, error }) => {
          noteReadError("memory graduation", error);
          return {
            items: (
              (rows ?? []) as Array<{
                id: string;
                content: string;
                status: string;
                importance: number | null;
                source_kind: string;
                created_at: string;
              }>
            ).map((r) => ({ ...r, supersedes_content: null as string | null })),
          };
        });
      })().catch((e) => {
        familyFailed("memory graduation")(e);
        return { items: [] };
      }),
      readHouseRules(supabase, wsId).catch((e) => {
        familyFailed("house rules")(e);
        return { rules: [] };
      }),
      readTrustGraduationProposals(supabase).catch((e) => {
        familyFailed("trust graduation")(e);
        return [] as TrustGraduationProposal[];
      }),
      specsP,
      oppsP,
      // Open assumption-supersession challenges (mirrors getNeedsYou's
      // assumptionCalls read). The assumption, and the decision or spec it
      // was taken under, ride along as embeds: three dependent reads used to
      // follow this one to fetch exactly these columns by the ids it returned.
      (() => {
        let q = supabase
          .from("assumption_challenges")
          .select(
            "id,assumption_id,signal_id,learning_id,rationale,created_at,assumption:assumptions!assumption_challenges_assumption_id_fkey(id,statement,decision_id,prd_id,decision:decisions!assumptions_decision_id_fkey(id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,forecast_resolution),prd:prds!assumptions_prd_id_fkey(id,title))",
          )
          .eq("status", "open")
          .order("created_at", { ascending: true })
          .limit(FAMILY_LIMIT);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
      // Proposed playbooks from the compounding pass (mirrors getNeedsYou's
      // playbookCalls read). playbook_proposals postdates the generated
      // types, so the client is structurally cast (the house idiom).
      (() => {
        let q = (supabase as unknown as SupabaseClient)
          .from("playbook_proposals")
          .select("id,title,body,created_at,source_learning_ids")
          .eq("status", "proposed")
          .order("created_at", { ascending: true })
          .limit(FAMILY_LIMIT);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
      // Which workspaces have the design stage on - the design-gate family
      // only exists there (mirrors getNeedsYou's own designStageEnabled
      // lookup, generalized across every workspace the caller can read).
      (() => {
        let q = supabase
          .from("workspaces")
          .select("id,design_stage_enabled")
          .eq("design_stage_enabled", true);
        if (wsId) q = q.eq("id", wsId);
        return q;
      })(),
      scopedDesignGatesP,
      projectsP,
      // Gate snoozes (front-end reimagining Phase 4; founder-authorized
      // 2026-07-19): the items the operator deferred with H until
      // snoozed_until, dropped at the end. RLS scopes the read to this user.
      // The error is discarded, deliberately, and here is exactly what that
      // costs: if the read fails, nothing is snoozed and every deferred gate
      // reappears. That is the only direction this read may fail in: this
      // queue is the single pull point, so re-showing a deferred gate is a
      // nuisance while hiding one that needs you is a broken promise. Absence
      // here is never read as "nothing needs you", only as "defer nothing".
      (supabase as unknown as SupabaseClient)
        .from("approval_snoozes")
        .select("kind,source_id")
        .gt("snoozed_until", new Date().toISOString()),
    ]);

    // Design gates, scoped to the workspaces just resolved to have the design
    // stage on. A dependent read (the workspace ids aren't known until
    // designWsRows lands above).
    //
    // THIS READ WAS UNSATISFIABLE BY SCHEMA UNTIL 2026-08-24, AND THE FIX WAS
    // A FOUNDER CALL RATHER THAN A TYPO.
    //
    // The predicate was `.is("design_gate_status", null)`. The column is
    // `text NOT NULL DEFAULT 'pending'` with `CHECK (design_gate_status in
    // ('pending','approved','rejected'))` -- migrations 20260707203117:133-134
    // and 20260708170000_sw4_design_station.sql:16-17 -- so it could never match
    // a row, not merely today's rows. One of the ten families this module's
    // header promises it federates sourced nothing, and every undecided design
    // gate was invisible to the single pull point.
    //
    // WHY IT SAT UNFIXED, AND WHY THAT WAS RIGHT. An earlier session diagnosed
    // it in full and deliberately escalated instead of correcting it: the fix
    // turns an empty family into the largest one on the queue, which is a
    // product change and not a comment fix. It also had to move at all three
    // sites at once -- here and today.functions.ts:291 and :511 -- or the
    // approvals pill and the Today hero would disagree and break the
    // one-count-one-source law the header claims.
    //
    // MEASURED AGAIN ON THE DAY OF THE FIX, because the escalation carried a
    // number and numbers go stale: the recorded count was 80 on 2026-08-06,
    // and production read `pending 99, approved 2, NULL 0`. The gap grew by 19
    // while the read said zero.
    //
    // Fixed at all three sites in one change under the founder's ruling. The
    // surfaces already bound what they show -- `.limit(FAMILY_LIMIT)` here, `.limit(5)`
    // and a count on Today -- so this restores a real family rather than
    // flooding a queue.
    noteReadError("design-stage workspace lookup", designWsRows.error);
    noteReadError("specs in review", specRows.error);
    noteReadError("critic'd opportunities", oppRows.error);
    noteReadError("assumption challenges", challengeRows.error);
    noteReadError("proposed playbooks", playbookRows.error);
    const designWsIds = ((designWsRows.data ?? []) as { id: string }[]).map((w) => w.id);
    const noDesignGates = {
      data: [] as {
        id: string;
        title: string;
        updated_at: string;
        project_id: string | null;
      }[],
      // Carried so the union below has one shape and the swallow-log can
      // reach it; no read ran on this branch, so there is nothing to report.
      error: null as { message: string } | null,
    };
    const designGateRes = wsId
      ? scopedDesignGates && designWsIds.includes(wsId)
        ? scopedDesignGates
        : noDesignGates
      : designWsIds.length
        ? await supabase
            .from("prds")
            .select("id,title,updated_at,project_id")
            .in("workspace_id", designWsIds)
            .eq("design_gate_status", "pending")
            .order("updated_at", { ascending: true })
            .limit(FAMILY_LIMIT)
        : noDesignGates;
    noteReadError("design gates", designGateRes.error);

    /*
     * A FAMILY STANDING EXACTLY ON ITS LIMIT HAS ALMOST CERTAINLY BEEN CUT.
     *
     * Every read above stops at `FAMILY_LIMIT`, which is right: one enormous
     * family must not flood a queue a person has to walk. What was wrong is
     * that three surfaces then turned a bounded read into an exact count and
     * put it in a headline.
     *
     * Measured 2026-08-27: 116 specs carry `design_gate_status = 'pending'` in
     * workspaces with the design stage on, against a limit of 100. Sixteen
     * calls that need a person were absent from the only screens that list
     * them, and no surface had any way to know.
     *
     * EXACTLY-ON-THE-LIMIT CAN BE A FALSE POSITIVE and that is the right way
     * round. A family with precisely 100 rows was not truncated and will still
     * be reported as capped; the cost is a surface that softens a count it did
     * not have to. The other error costs a person a call they never saw.
     */
    /*
     * AND THE CAP NOW KEEPS THE OLDEST, WHICH IS THE OTHER HALF OF THE SAME
     * DEFECT.
     *
     * Every family read above ordered DESCENDING and took the newest
     * `FAMILY_LIMIT` rows. Both surfaces then sort the result oldest first and
     * `/inbox` says so in as many words: "Settled in order, oldest first."
     *
     * So on the design-gate family, 116 rows against a limit of 100, the
     * sixteen that were dropped were the sixteen OLDEST: precisely the calls a
     * queue walked oldest-first exists to surface, and precisely the ones that
     * have waited longest. The page promised the oldest and the read beneath it
     * had already thrown them away.
     *
     * The six bounded reads now order ascending. This changes only WHICH rows
     * survive the cap and not the order anything is drawn in, because every
     * consumer sorts for itself.
     */
    const cappedIf = (family: string, n: number): void => {
      if (n >= FAMILY_LIMIT) noteGap(family, "capped");
    };
    cappedIf("memory graduation", memCandidates.items.length);
    cappedIf("specs in review", (specRows.data ?? []).length);
    cappedIf("critic'd opportunities", (oppRows.data ?? []).length);
    cappedIf("assumption challenges", (challengeRows.data ?? []).length);
    cappedIf("proposed playbooks", (playbookRows.data ?? []).length);
    cappedIf("design gates", (designGateRes.data ?? []).length);

    // Project resolution, one batched pass for every family that carries a
    // project_id (specs, opportunities, design gates directly; decisions only
    // indirectly via their prd_id -> prds.project_id).
    /* ==================================================================
     * THE SAME JUDGMENT WAS QUEUED TWICE, AND ONLY ONE OF THEM DID
     * ANYTHING.
     *
     * Measured on production 2026-08-10: 172 decisions sat pending, 170
     * of them `source_kind: 'mission'`. Of those, 155 belong to a
     * mission whose own status is still 'proposed' - work nobody has
     * agreed to run yet.
     *
     * A proposed mission ALREADY carries its own gate. studio.functions
     * fetches proposed missions separately, precisely so their "Review
     * and launch" stays reachable, and 228 of them are sitting there.
     * That gate is the live one: launching is what spends money and
     * starts work.
     *
     * The decision row beside it is a companion that moves nothing.
     * `updateDecision` and `routeDecision` are its only resolvers and
     * both do exactly one thing - flip a status, write a stage event.
     * Verified at the database too, because application code could not
     * settle it: `decisions_reactor_fanout` fires on INSERT only, does
     * not branch on status, and there are zero enabled 'decision.made'
     * subscriptions.
     *
     * So a person opening this queue was asked to judge the same
     * proposal twice: once where pressing the button launches it, and
     * once where pressing the button does nothing. The second copy is
     * what made the queue look like 172 items of homework.
     *
     * FILTERED, NOT AUTO-APPROVED, and the difference matters. Marking
     * these approved would assert that a human agreed to work they have
     * not seen - consent they never gave, on a mission still awaiting
     * launch. Hiding a duplicate claims nothing. The decision stays
     * pending and honest; it simply stops being counted as a second
     * call when the first one is still open.
     *
     * A decision REJOINS this queue the moment its mission leaves
     * 'proposed', because then the launch gate is spent and the
     * decision is the only remaining call on it.
     * ================================================================== */
    const rawPendingDecisions = (decisionsRes.decisions ?? []).filter(
      (d) => d.status === "pending",
    );
    const decisionMissionIds = [
      ...new Set(rawPendingDecisions.map((d) => d.mission_id).filter((x): x is string => !!x)),
    ];
    /*
     * ── TWO ROUND TRIPS BECOME ONE, AND THE DEPENDENCY IS REAL BUT WEAK ─────
     *
     * These two reads were serial, and the serial part is what turns work into
     * latency: every await outside a `Promise.all` is a full round trip before
     * the next one starts. **Since A07 landed, this function gates the FIRST
     * PAINT of the only surface a signed-in person can land on** (S2 measured it
     * as the single gate on the home's SlowRead), which is exactly where §0.6
     * standard #2 is judged — *work starts visibly in under a second*.
     *
     * I FIRST READ THESE AS INDEPENDENT AND THEY ARE NOT. `decisionPrdIds` came
     * from `pendingDecisions`, which is `rawPendingDecisions` FILTERED by the
     * mission read below it. So prds genuinely depended on missions.
     *
     * **But the dependency is only a FILTER, and a filter narrows.** The prd ids
     * of the surviving decisions are always a SUBSET of the prd ids of the raw
     * ones, so querying the superset in parallel returns everything the filtered
     * query would have, plus rows nothing looks up. `projectIdByPrd` is a Map
     * read by id, so an unused entry is inert — it cannot change an answer, only
     * occupy a little memory.
     *
     * What that buys is one fewer round trip on the path a person waits on, for
     * a slightly wider `IN` list on a set that is already bounded by the pending
     * decisions. `projects` below still follows this read and must: it needs
     * `projectIdByPrd` to know which projects to ask for, and that IS a real
     * dependency rather than a filter.
     */
    /*
     * BOTH ANSWERS NOW TRAVEL WITH THE DECISION. `readDecisions` hydrates a
     * decision's mission and spec by id for the "From <title>" line, and since
     * 2026-09-08 that same hop carries the mission's status and the spec's
     * project, so the two reads that used to follow here (missions by id for
     * `status = proposed`, prds by id for `project_id`) are gone from the
     * critical path. A decision whose read failed to hydrate keeps its place:
     * `mission_status` null is "cannot tell", and cannot-tell keeps a call.
     */
    // A FAILED READ MUST NOT HIDE A CALL. If we cannot tell which missions are
    // still proposed, every decision stays in the queue: showing a duplicate is
    // a nuisance, and dropping a real call because a lookup failed is a missed
    // decision nobody sees. The gap is reported under the dedup's own name.
    noteReadError("proposed-mission dedup", decisionsRes.hydrationError);
    const pendingDecisions = rawPendingDecisions.filter(
      (d) => !(d.mission_id && d.mission_status === "proposed"),
    );

    const projectIdByPrd = new Map<string, string>();
    for (const d of rawPendingDecisions) {
      if (d.prd_id && d.prd_project_id) projectIdByPrd.set(d.prd_id, d.prd_project_id);
    }
    const specRowsData = (specRows.data ?? []) as {
      id: string;
      title: string;
      status: string;
      critic_review: unknown;
      updated_at: string;
      project_id: string | null;
    }[];
    const oppRowsData = (oppRows.data ?? []) as {
      id: string;
      title: string;
      critic_review: unknown;
      created_at: string;
      project_id: string | null;
    }[];
    const designGateRows = (designGateRes.data ?? []) as {
      id: string;
      title: string;
      updated_at: string;
      project_id: string | null;
    }[];
    const allProjectIds = new Set<string>([
      ...projectIdByPrd.values(),
      ...specRowsData.map((s) => s.project_id).filter((x): x is string => !!x),
      ...oppRowsData.map((o) => o.project_id).filter((x): x is string => !!x),
      ...designGateRows.map((p) => p.project_id).filter((x): x is string => !!x),
    ]);
    const projectNameById = new Map<string, string>();
    for (const p of (projectsRes.data ?? []) as { id: string; name: string | null }[]) {
      projectNameById.set(p.id, p.name ?? "Untitled");
    }
    // The one project the first hop could not have known: a pending
    // decision's spec in a project no spec, proposal or design gate named.
    const lateProjectIds = [...allProjectIds].filter((id) => !projectNameById.has(id));
    if (lateProjectIds.length) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id,name")
        .in("id", lateProjectIds);
      for (const p of (projects ?? []) as { id: string; name: string | null }[]) {
        projectNameById.set(p.id, p.name ?? "Untitled");
      }
    }
    const projectByPrd = new Map<string, { id: string; name: string }>();
    for (const [prdId, projId] of projectIdByPrd) {
      if (projectNameById.has(projId)) {
        projectByPrd.set(prdId, { id: projId, name: projectNameById.get(projId)! });
      }
    }
    const projectOf = (projectId: string | null): { id: string | null; name: string | null } =>
      projectId && projectNameById.has(projectId)
        ? { id: projectId, name: projectNameById.get(projectId)! }
        : { id: null, name: null };

    const items: ApprovalQueueItem[] = [];
    // Real agent slug per tool-call gate, so the final map can attribute it.
    const agentSlugBySource = new Map<string, string>();

    // --- Tool-call confirm/review gates ------------------------------------
    for (const a of govern.approvals.filter((a) => a.status === "pending")) {
      if (a.agent_slug) agentSlugBySource.set(a.id, a.agent_slug);
      const consequence = toolConsequence(a.tool_name);
      const track = a.agent_slug ? govern.trackByAgent[a.agent_slug] : undefined;
      const evidence: string[] = [];
      /*
       * ── THE MERGE CARD IS COMPOSED, NOT ASSEMBLED HERE (P-116) ──────────
       *
       * This pushed the bare rationale, which was right until the rationale
       * became the place the raise PINS what the gate is about. Going through
       * the composer means this page, the run banner and the transcript card
       * are one function rather than three that happen to agree -- and it means
       * a merge gate with no rationale says "not on this card" instead of
       * silently contributing nothing, which is how the tablet gate reached a
       * person as a tool name and two buttons.
       *
       * No live evidence here: this queue federates ten gate families across a
       * workspace and has no track in hand. The pinned sentence is exactly what
       * that case was built for.
       */
      if (isMergeGate(a.tool_name)) {
        evidence.push(...mergeCardLines({ evidence: null, rationale: a.rationale ?? null }));
      } else if (a.rationale) {
        evidence.push(a.rationale);
      }
      evidence.push(`${REVERSIBILITY_LABEL[consequence.reversible]} · ${consequence.undo}`);
      if (track && track.total > 0) {
        evidence.push(`This agent: ${track.approved} of ${track.total} approved before.`);
      }
      const kindTone: VerdictTone = a.risk === "high" ? "human" : "machine";
      items.push({
        id: `tool_call:${a.id}`,
        kindKey: "tool_call",
        sourceId: a.id,
        // F-128. Read straight off the row rather than re-derived here, so the
        // queue and the governance surface cannot disagree about whether the
        // same gate is holding anything.
        gatesLiveWork: (a as { gatesLiveWork?: boolean | null }).gatesLiveWork ?? null,
        // The run behind the call, resolved in the govern read at no extra hop.
        trackId: (a as { trackId?: string | null }).trackId ?? null,
        filterBucket: "gates",
        kind: "GATE",
        kindTone,
        project: a.mission_title ?? undefined,
        /*
         * The 19px `sp-gate-q` heading -- the question the person is here to
         * answer -- so it may never be generic. `consequence.effect` alone put
         * "Runs the tool with the agent's arguments." in this slot for any tool
         * with no catalogue row, which is the defect found on the rendered
         * /today on 2026-08-16. All 59 registered tools have a row now, but the
         * seed migrations still write six names no tool defines (21 tuples, 8 of
         * them `status = 'pending'`), so this slot is still reachable by a
         * re-seed. `gateHeadline` returns the same catalogued sentence for all 59
         * and an honest one for anything else. The `evidence` push above keeps
         * reading `consequence`, because "Effect not catalogued. Review the
         * arguments before approving." is already true there.
         */
        title: gateHeadline(a.tool_name),
        evidence,
        impact: `${a.risk} risk${a.mission_title ? ` · in ${a.mission_title}` : ""}`,
        approveConsequence: "Approve · runs the action",
        rejectConsequence: "Reject · agent stands down",
        timestamp: a.created_at,
        projectId: null,
        projectName: null,
      });
    }

    // --- Proposals: pending decisions ---------------------------------------
    for (const d of pendingDecisions) {
      const proj = d.prd_id ? projectByPrd.get(d.prd_id) : undefined;
      const evidence: string[] = [];
      if (d.rationale) evidence.push(d.rationale);
      /*
       * ── PROVENANCE THAT NAMES THE TITLE AGAIN IS NOT PROVENANCE ──────────
       *
       * READ ON THE SERVED INBOX, 2026-09-09. The focused card asked "Make
       * this call: Show homeowner installer arrival window on order page?" and
       * its body ended "From Show homeowner installer arrival window on order
       * page" -- the same string, as a dangling clause under six lines of
       * agent prose.
       *
       * AND IT IS A CONSEQUENCE OF MY OWN CHANGE EARLIER TODAY. A
       * mission-sourced decision used to be titled "Mission completed: <the
       * mission>" while `source_label` was "<the mission>", so the two read as
       * different strings and the collision was invisible. Taking the prefix
       * out at the writer (`handoff.server.ts`) made them identical. The
       * prefix removal was right; not sweeping for what depended on the two
       * being different was not, and a defect is a shape rather than a
       * location.
       *
       * COMPARED, NOT SPECIAL-CASED TO MISSIONS. A spec or a meeting whose
       * label happens to match its decision's title is the same uninformative
       * line for the same reason, and a rule that reads the two values it is
       * about cannot go stale the way a list of source kinds would.
       *
       * The provenance is not lost: `impact` below already says "raised during
       * a pass" from `source_kind`, which is the field designed to carry it.
       */
      const from = provenanceLine(cleanTitle(d.title), d.source_label);
      if (from) evidence.push(from);
      items.push({
        id: `decision:${d.id}`,
        kindKey: "decision",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: d.id,
        filterBucket: "proposals",
        kind: "PROPOSAL",
        kindTone: "human",
        project: proj?.name,
        title: cleanTitle(d.title),
        evidence,
        forecast: d.forecast_claim
          ? {
              claim: d.forecast_claim,
              howWeWillKnow: d.forecast_how_we_will_know,
              horizonDate: d.forecast_horizon_date,
              resolution: d.forecast_resolution,
            }
          : undefined,
        impact: d.source_kind === "mission" ? "raised during a pass" : undefined,
        approveConsequence: "Approve · decision recorded",
        rejectConsequence: "Reject · noted for next time",
        timestamp: d.created_at,
        projectId: proj?.id ?? null,
        projectName: proj?.name ?? null,
      });
    }

    // --- Memory graduation: candidates + house rules -----------------------
    for (const c of memCandidates.items.filter((c) => c.status === "pending")) {
      // The title already carries the content; evidence only adds what the
      // title cannot (what this rule would replace).
      const evidence: string[] = [];
      if (c.supersedes_content) evidence.push(`Replaces: ${c.supersedes_content}`);
      items.push({
        id: `memory_candidate:${c.id}`,
        kindKey: "memory_candidate",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: c.id,
        filterBucket: "memory",
        kind: "MEMORY",
        kindTone: "neutral",
        title: c.content.length > 140 ? `${c.content.slice(0, 140)}…` : c.content,
        evidence,
        // Where it came from, in the words the memory surface already uses.
        // The raw `source_kind` and the 1-5 importance are ranking inputs the
        // decay sweep reads, not something a person weighs before approving.
        impact: sourceLabel(c.source_kind),
        approveConsequence: "Approve · it guides the next call",
        rejectConsequence: "Reject · nothing changes",
        timestamp: c.created_at,
        projectId: null,
        projectName: null,
      });
    }
    for (const r of houseRules.rules.filter((r) => r.status === "pending")) {
      const evidence: string[] = [];
      if (r.rationale) evidence.push(r.rationale);
      evidence.push(
        `Distilled from ${r.source_learning_ids.length} learning${
          r.source_learning_ids.length === 1 ? "" : "s"
        }.`,
      );
      items.push({
        id: `house_rule:${r.id}`,
        kindKey: "house_rule",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: r.id,
        filterBucket: "memory",
        kind: "MEMORY",
        kindTone: "neutral",
        title: r.rule_text,
        evidence,
        impact: r.agent_slug ? "applies to one agent" : "applies workspace-wide",
        approveConsequence: "Approve · becomes a standing rule",
        rejectConsequence: "Reject · rule discarded",
        timestamp: r.created_at,
        projectId: null,
        projectName: null,
      });
    }

    // --- Trust graduation ----------------------------------------------------
    for (const t of trustProposals.filter((t) => t.status === "pending")) {
      const evidence: string[] = [];
      if (t.rationale) evidence.push(t.rationale);
      evidence.push(`${t.clean_streak} clean approvals in a row.`);
      items.push({
        id: `trust_graduation:${t.id}`,
        kindKey: "trust_graduation",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: t.id,
        filterBucket: "gates",
        kind: "TRUST",
        kindTone: "machine",
        // Plain words, never internals (law 6.4): "studio.stage" reads as
        // "drafting changes"; unknown tools fall back to "this action".
        title: `Let the agent run ${ACTION_LABEL[t.tool_name] ?? "this action"} without asking`,
        evidence,
        impact: `today it asks first (${t.from_mode}); approving makes it automatic`,
        approveConsequence: "Approve · agent gets more autonomy",
        rejectConsequence: "Reject · stays as is",
        timestamp: t.created_at,
        projectId: null,
        projectName: null,
      });
    }

    // --- Specs in review (worth building?) ----------------------------------
    for (const p of specRowsData) {
      const cr = parseCriticReview(p.critic_review);
      const proj = projectOf(p.project_id);
      items.push({
        id: `spec:${p.id}`,
        kindKey: "spec",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: p.id,
        filterBucket: "proposals",
        kind: "SPEC",
        kindTone: "human",
        project: proj.name ?? undefined,
        title: p.title,
        evidence: [criticEvidenceLine(cr)],
        impact: "spec in review",
        approveConsequence: "Approve · the spec is approved and becomes precedent",
        rejectConsequence: "Reject · sends it back to draft",
        timestamp: p.updated_at,
        projectId: proj.id,
        projectName: proj.name,
      });
    }

    // --- Opportunities the Critic flagged (worth building?) -----------------
    for (const o of oppRowsData) {
      const cr = parseCriticReview(o.critic_review);
      const proj = projectOf(o.project_id);
      items.push({
        id: `opportunity:${o.id}`,
        kindKey: "opportunity",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: o.id,
        filterBucket: "proposals",
        kind: "PROPOSAL",
        kindTone: "human",
        project: proj.name ?? undefined,
        title: o.title,
        evidence: [criticEvidenceLine(cr)],
        impact: cr?.verdict ? `Critic said ${cr.verdict}` : undefined,
        approveConsequence: "Approve · keeps it and moves it to Now on the roadmap",
        rejectConsequence: "Reject · drops it from the backlog",
        timestamp: o.created_at,
        projectId: proj.id,
        projectName: proj.name,
      });
    }

    // --- Open assumption-supersession challenges (worth re-examining?) ------
    if (challengeRows.data && challengeRows.data.length > 0) {
      type ChallengeRow = {
        id: string;
        assumption_id: string;
        signal_id: string | null;
        learning_id: string | null;
        rationale: string;
        created_at: string;
        assumption: {
          id: string;
          statement: string;
          decision_id: string | null;
          prd_id: string | null;
          /*
           * THE FORECAST TRAVELS WITH THE DECISION (REQ-014 item 1). This
           * embed backs the evidence lines under a focused gate; it used to
           * select `id,title` in a dependent read, so a person approving an
           * agent's bet saw its NAME and never the belief it was taken under,
           * while both agent doors REFUSE to record that bet without one.
           */
          decision: {
            id: string;
            title: string;
            forecast_claim: string | null;
            forecast_how_we_will_know: string | null;
            forecast_horizon_date: string | null;
            forecast_resolution: string | null;
          } | null;
          prd: { id: string; title: string } | null;
        } | null;
      };
      const rows = challengeRows.data as unknown as ChallengeRow[];
      /*
       * A challenge whose assumption did not come back is skipped, as before;
       * what changed is how that happens. The assumption, its decision and its
       * spec ride the challenge read as PostgREST embeds now, so a refused
       * embed fails the family's own read and is reported by
       * `noteReadError("assumption challenges", ...)` above, instead of three
       * dependent reads whose refusal used to drop the family from INSIDE it.
       */
      for (const c of rows) {
        const assumption = c.assumption;
        if (!assumption) continue;
        const decisionTitle = assumption.decision_id
          ? (assumption.decision?.title ?? "A past decision")
          : assumption.prd_id
            ? `Spec: ${assumption.prd?.title ?? "a spec"}`
            : "A past decision";
        items.push({
          id: `assumption_challenge:${c.id}`,
          kindKey: "assumption_challenge",
          // Not held open by a run: see `gatesLiveWork` on the type. Declared
          // rather than defaulted, so a new kind has to decide this on purpose.
          gatesLiveWork: null,
          /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
          trackId: null,
          sourceId: c.id,
          filterBucket: "gates",
          kind: "CHALLENGE",
          kindTone: "human",
          title: decisionTitle,
          evidence: [`${assumption.statement}. ${c.rationale}`],
          impact: undefined,
          approveConsequence: "Approve · reopens the decision for review",
          rejectConsequence: "Reject · keeps it standing as decided",
          timestamp: c.created_at,
          projectId: null,
          projectName: null,
        });
      }
    }

    // --- Design gates (design ready?) ---------------------------------------
    for (const p of designGateRows) {
      const proj = projectOf(p.project_id);
      items.push({
        id: `design_gate:${p.id}`,
        kindKey: "design_gate",
        // Not held open by a run: see `gatesLiveWork` on the type. Declared
        // rather than defaulted, so a new kind has to decide this on purpose.
        gatesLiveWork: null,
        /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
        trackId: null,
        sourceId: p.id,
        filterBucket: "proposals",
        kind: "DESIGN",
        kindTone: "human",
        project: proj.name ?? undefined,
        title: p.title,
        evidence: [
          "The generated mockup is waiting on your call before this spec can dispatch to Build.",
        ],
        impact: undefined,
        approveConsequence: "Approve · unblocks Build for this spec",
        rejectConsequence: "Reject · keeps the gate closed",
        timestamp: p.updated_at,
        projectId: proj.id,
        projectName: proj.name,
      });
    }

    // --- Playbook proposals (make it a method?) ------------------------------
    if (playbookRows.data && playbookRows.data.length > 0) {
      for (const p of playbookRows.data as {
        id: string;
        title: string;
        body: string;
        created_at: string;
        source_learning_ids: string[] | null;
      }[]) {
        const sourceCount = p.source_learning_ids?.length ?? 0;
        const evidence: string[] = [p.body.length > 200 ? `${p.body.slice(0, 200)}…` : p.body];
        if (sourceCount > 0) evidence.push(`${sourceCount} same-shaped learnings behind this`);
        items.push({
          id: `playbook_proposal:${p.id}`,
          kindKey: "playbook_proposal",
          // Not held open by a run: see `gatesLiveWork` on the type. Declared
          // rather than defaulted, so a new kind has to decide this on purpose.
          gatesLiveWork: null,
          /* No run behind it: only a tool call is raised inside one. Declared
           rather than defaulted, on the same rule as the line above, so a new
           kind has to decide whether it can name a run. */
          trackId: null,
          sourceId: p.id,
          filterBucket: "proposals",
          kind: "PLAYBOOK",
          kindTone: "neutral",
          title: p.title,
          evidence,
          impact: undefined,
          approveConsequence: "Approve · adopts the method on the record",
          rejectConsequence: "Reject · retires this proposal for good",
          timestamp: p.created_at,
          projectId: null,
          projectName: null,
        });
      }
    }

    const snoozed = new Set(
      ((snoozeRes.data ?? []) as { kind: string; source_id: string }[]).map(
        (r) => `${r.kind}:${r.source_id}`,
      ),
    );
    const visible = snoozed.size
      ? items.filter((it) => !snoozed.has(`${it.kindKey}:${it.sourceId}`))
      : items;

    visible.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
    return {
      incomplete,
      items: visible.map((it) => ({
        ...it,
        agentSlug: approvalAgentSlug(it.kindKey, agentSlugBySource.get(it.sourceId) ?? null),
      })),
    };
  }
}

/** One row per workspace the caller belongs to, for the Inbox's "N waiting in X" line. */
export type WorkspaceWaiting = { workspaceId: string; name: string; waiting: number };

/**
 * ── A NUMBER AND A NAME PER WORKSPACE, IN ONE ROUND TRIP ────────────────────
 *
 * The Inbox draws "53 waiting in Helio Labs, 6 in A1 delete probe" for the
 * workspaces the person is NOT looking at. It used to earn that line by
 * running the whole queue above once per other workspace, fired in the same
 * tick as the page's own read (2026-09-08, Lane 2: six full reads for six
 * numbers, on the page that was already the slowest in the product).
 *
 * `approvals_queue_counts` (migration 20260909100500) counts the same nine
 * workspace-bound families with the same predicates, drops the same snoozes
 * and caps each family where its read is capped, under the caller's own RLS
 * (SECURITY INVOKER), so the number is the one the headline would print if
 * the person switched there. Checked on the day against Helio Labs: 53 both
 * ways. Trust graduation proposals belong to no workspace and are counted in
 * none; the queue shows them under every workspace, and a line about ANOTHER
 * workspace must not repeat them per row.
 *
 * Zero rows are returned, not omitted: the caller decides what a quiet
 * workspace is worth saying, and a count that vanished is not the same
 * signal as a count of nothing.
 */
export const countApprovalsQueueByWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { excludeWorkspaceId?: string } | undefined) =>
    z.object({ excludeWorkspaceId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ workspaces: WorkspaceWaiting[] }> => {
    const { data: rows, error } = await context.supabase.rpc("approvals_queue_counts", {
      p_exclude: data.excludeWorkspaceId,
    });
    if (error) throw new Error(error.message);
    return {
      workspaces: (rows ?? []).map((r) => ({
        workspaceId: r.workspace_id,
        name: r.name,
        waiting: r.waiting,
      })),
    };
  });

// ---------------------------------------------------------------------------
// WHAT A STATUS WRITE MEANS FOR A SPEC, STATE BY STATE (2026-08-06).
//
// Two verbs in this module write prds.status for kind "spec": decline (via
// decideApprovalItem -> "draft"), and send back (via sendBackApprovalItem ->
// "draft", with a note). Neither looked at the spec first. The id is whatever
// the caller posts - these are POST server functions, not a closed loop over
// the queue's own items - so a shipped spec's id moved a shipped bet to
// "draft", and no ordinary path writes "shipped" back. The record of a bet that
// genuinely went out, gone on one keystroke.
//
// THREE OF THE FOUR WRITERS OF 'shipped' ARE GUARDED ON `shipped_at`, NOT FOUR.
// studio.functions.ts (`.is("shipped_at", null)` on the UPDATE itself) and
// outcome-tick.ts (same) are atomic; outcome.functions.ts checks `if
// (!shippedAt)` first. The fourth is not: `closeOutSpecOnPromote` in
// deployments.functions.ts guards on `(prd.status) !== "shipped"` -- a STATUS
// test -- and then writes `{ status: "shipped", shipped_at: nowIso }`. For a row
// whose status is anything but 'shipped' while `shipped_at` is already set, the
// next deploy promote CLOBBERS the original ship timestamp with a fresh one.
// That is not hypothetical: it is exactly the shape of the seven rows named
// below. So "nothing writes shipped back" is true of the queue and true of the
// three guarded paths, and the promote path is the standing exception. Not
// fixed here - deployments.functions.ts is another file - but do not read this
// block as a proof that `shipped_at` is immutable once set.
//
//   draft     Already the revisable state. There is nothing to send back.
//   review    The gate this queue actually lists (the spec source filters on
//             status = 'review'). Moving backward is the entire point.
//   approved  Signed off, not shipped. PERMITTED BEFORE THIS CHANGE AND STILL
//             PERMITTED: sendBackApprovalItem used to check nothing at all, so
//             this row documents inherited behaviour rather than granting it.
//             Backward removes no RECORD - the "Spec approved" decisions row
//             stays, the stage-event trail records approved -> draft, and
//             re-approving later is idempotent on prd_id (discovery.functions.ts
//             savePrd). It does change one live behaviour: outcome-tick.ts polls
//             `.eq("status","approved").is("shipped_at",null)`, so a spec sent
//             back drops out of the automatic ship-stamp cron until somebody
//             re-approves it. Recoverable, and arguably what you want from an
//             un-dispatch, but it is not nothing. Allowed.
//   shipped   Refused. Re-measured 2026-08-06: 41 specs read 'approved' and
//             SEVEN of them carry a non-null shipped_at, so status alone is not
//             a safe test - `shipped_at` is the fact and it is what this checks.
//
// The forward write is checked for the one case that is a backward write in
// disguise: approving a spec that has already shipped. savePrd sees
// `prior.status !== 'approved'`, treats it as a FIRST approval, files a
// Decisions entry and stamps a stage event leaving 'shipped' - in
// discovery.functions.ts, at `rest.status === "approved" && (prior?.status ??
// null) !== "approved"` and the `if (rest.status)` recordStageEvent below it.
// (Cited by predicate, not by line: that file is being edited concurrently and
// these two moved from 2055/2112 to 2141/2198 in a single day.) So "Approve" on
// a shipped spec is how
// those seven rows got that way. This closes that route through the queue; the
// button that opens it lives on the spec page and is NOT fixed here (see the
// note on sendBackApprovalItem).
// ---------------------------------------------------------------------------

type SpecState = { status: string | null; shippedAt: string | null };

/** The spec's live state, or a refusal. Never "absent, therefore fine". */
async function readSpecState(db: SupabaseClient, prdId: string): Promise<SpecState> {
  const { data: row, error } = await db
    .from("prds")
    .select("status,shipped_at")
    .eq("id", prdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // A null row is the REFUSAL case, not evidence the spec does not exist: an
  // RLS refusal and a deleted row are indistinguishable from here, and neither
  // one is permission to write. Refusing on both is the only honest read.
  if (!row) {
    throw new Error("Couldn't read that spec, so nothing was changed. It may not be yours.");
  }
  const r = row as { status: string | null; shipped_at: string | null };
  return { status: r.status, shippedAt: r.shipped_at };
}

/** Shipped is a fact on the record, and `shipped_at` is where that fact lives. */
function hasShipped(state: SpecState): boolean {
  return state.status === "shipped" || !!state.shippedAt;
}

/** Every door named here exists: Ship draws "Roll back" on each live release
 *  row, Learn's outcome desk keys off `shipped_at` (not status, so a shipped
 *  bet is still judgeable), and Decide's "Where it sits" moves any bet. */
const SHIPPED_STATUS_REFUSAL =
  "This spec has already shipped, so its status can't be rewritten from here - " +
  "that would drop the record of a bet that really went out. To take the release " +
  "back, use Roll back on the release in Ship. To put the bet itself on the record " +
  "as wrong, give it a verdict in Learn or move it in Decide.";

/** Refuses a spec status write that would contradict a record already on the
 *  books. `to` is the status about to be written. Returns nothing: it either
 *  permits the caller to proceed or throws with the reason. */
async function assertSpecStatusWrite(
  db: SupabaseClient,
  prdId: string,
  to: "approved" | "draft",
): Promise<void> {
  const state = await readSpecState(db, prdId);
  if (hasShipped(state)) throw new Error(SHIPPED_STATUS_REFUSAL);
  if (to === "draft" && state.status === "draft") {
    throw new Error("This spec is already a draft, so there is nothing to send back.");
  }
}

/* ==================================================================
 * RPT-32, THE INPUT HALF: the tray had to start feeding the flywheel.
 *
 * The human-at-gate loop was built end to end and starved at the one
 * place humans actually act. `human_gate_events`, `buildGateEventRow`,
 * `summarizeGateSignals`, `recordGateSignalCore`, `getGateSignals` and
 * self-improve's `readAgentSignals` all shipped and all work. Only
 * three call sites ever wrote: two spec/contract EDIT paths in
 * discovery.functions.ts and the tool-call decision in
 * agent_loop.functions.ts. This tray - the one surface that federates
 * ALL TEN gate families, and the one the product points a human at -
 * wrote nothing.
 *
 * Measured against production on 2026-08-10, before this change:
 * 113 rows in `human_gate_events`, of which 112 are demo seed. All 112
 * sit in the seven Helio Labs workspaces on a single seed timestamp
 * (.262666+00, the same 16 rows copied into 7 workspaces). Exactly ONE
 * row was written by a real human, and it carries workspace_id = NULL,
 * so every reader - all of which scope `.eq("workspace_id", ...)` -
 * is blind to it. Meanwhile ten real approvals were decided by real
 * humans in real workspaces. Capture rate: zero.
 *
 * That is worse than an empty table, because the read surfaces are not
 * empty: per-agent correction rates and 14 self-improve proposals were
 * being computed off seed rows and presented as learned signal.
 *
 * TWO THINGS MAKE THIS MORE THAN AN INSERT, and both are why this
 * helper exists rather than a line in each case arm:
 *
 * 1. ATTRIBUTION IS LOAD-BEARING. `readAgentSignals` filters the
 *    "(unattributed)" bucket OUT. A row written with a null agent_slug
 *    is stored, counted in the overall total, and read by nobody - a
 *    fix that looks like a fix and moves nothing. So the slug is
 *    resolved through `approvalAgentSlug`, the SAME function that names
 *    the agent on the tray's own chip, which is what stops the chip and
 *    the correction rate from ever naming different agents.
 *
 * 2. THE WORKSPACE IS THE SAME TRAP, and the single real row already
 *    fell into it. It is read from the gate's own source row rather
 *    than assumed, because filing an event under the wrong workspace is
 *    the WM-F1 defect: it is recalled for the wrong future call, which
 *    is worse than not recalling it.
 *
 * And one thing that keeps the signal honest rather than merely
 * present: a human editing THEIR OWN draft is not a correction of an
 * agent. discovery.functions.ts already guards this on contracts; the
 * same guard is applied here per family, off each table's own evidence
 * of who drafted it. Scoring a human's own work as an agent's error
 * would bias every correction rate the ranking consumes.
 * ================================================================== */

/** What the gate's own row can tell us about the draft the human judged.
 *  Read BEFORE the resolver runs: every resolver mutates status, so the
 *  same read afterwards describes the decision, not the draft. */
type GateAttribution = {
  workspaceId: string | null;
  agentSlug: string | null;
  toolName: string | null;
  /** False when the human authored the draft themselves. Such a gate is a
   *  real decision and still moves, but it is NOT an agent correction and
   *  must never be scored as one. */
  agentDrafted: boolean;
};

/** Where each family's row lives, and the columns that carry its provenance.
 *  `trust_graduation` predates workspace tenancy and has no workspace_id -
 *  the same exception the queue's own source list documents. */
export const GATE_SOURCE: Record<
  ApprovalKind,
  { table: string; select: string; hasWorkspace: boolean } | null
> = {
  tool_call: {
    table: "agent_approvals",
    select: "workspace_id,agent_slug,tool_name",
    hasWorkspace: true,
  },
  decision: { table: "decisions", select: "workspace_id,source_kind", hasWorkspace: true },
  memory_candidate: {
    table: "memory_candidates",
    select: "workspace_id,source_kind",
    hasWorkspace: true,
  },
  house_rule: { table: "house_rules", select: "workspace_id,agent_slug", hasWorkspace: true },
  trust_graduation: {
    table: "trust_graduation_proposals",
    select: "agent_slug,tool_name",
    hasWorkspace: false,
  },
  spec: { table: "prds", select: "workspace_id,model", hasWorkspace: true },
  opportunity: { table: "opportunities", select: "workspace_id", hasWorkspace: true },
  assumption_challenge: {
    table: "assumption_challenges",
    select: "workspace_id",
    hasWorkspace: true,
  },
  design_gate: { table: "prds", select: "workspace_id,model", hasWorkspace: true },
  playbook_proposal: {
    table: "playbook_proposals",
    select: "workspace_id",
    hasWorkspace: true,
  },
};

/**
 * Decide, per family, whether the draft came from an agent.
 *
 * Each table proves this differently and none of them proves it with a
 * boolean, so the evidence is named here rather than guessed:
 *  - `decisions.source_kind` is 'manual' for a human-authored call and one of
 *    mission/prd/roadmap/critic/... otherwise (10 of 285 are manual).
 *  - `memory_candidates.source_kind` is literally 'user' or 'agent'.
 *  - `prds.model` holds the model that drafted the spec; discovery.functions.ts
 *    already uses its presence as the agent-drafted test, and every spec in the
 *    database carries one.
 *  - the rest are agent-produced by construction: a tool call, a trust
 *    graduation proposal, a house rule and a playbook proposal have no
 *    human-authored form, and an opportunity reaching this tray was drafted
 *    for the human to judge.
 */
export function isAgentDrafted(kind: ApprovalKind, row: Record<string, unknown> | null): boolean {
  if (!row) return true;
  switch (kind) {
    case "decision":
      return row.source_kind !== "manual";
    case "memory_candidate":
      return row.source_kind === "agent";
    case "spec":
    case "design_gate":
      return !!row.model;
    default:
      return true;
  }
}

/**
 * Read the gate's provenance from its own source row. Never throws and never
 * blocks the decision: an attribution we could not read yields a row that is
 * still recorded, just less richly, which is strictly better than dropping the
 * event or failing the gate the human just pressed.
 */
export async function readGateAttribution(
  db: SupabaseClient,
  kind: ApprovalKind,
  id: string,
): Promise<GateAttribution> {
  const src = GATE_SOURCE[kind];
  const empty: GateAttribution = {
    workspaceId: null,
    agentSlug: approvalAgentSlug(kind, null),
    toolName: null,
    agentDrafted: true,
  };
  if (!src) return empty;
  try {
    const { data: row } = await db.from(src.table).select(src.select).eq("id", id).maybeSingle();
    const r = (row ?? null) as Record<string, unknown> | null;
    return {
      workspaceId: src.hasWorkspace ? ((r?.workspace_id as string | null) ?? null) : null,
      agentSlug: approvalAgentSlug(kind, (r?.agent_slug as string | null) ?? null),
      toolName: (r?.tool_name as string | null) ?? null,
      agentDrafted: isAgentDrafted(kind, r),
    };
  } catch {
    return empty;
  }
}

const DecideSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "tool_call",
    "decision",
    "memory_candidate",
    "house_rule",
    "trust_graduation",
    "spec",
    "opportunity",
    "assumption_challenge",
    "design_gate",
    "playbook_proposal",
  ]),
  verdict: z.enum(["approve", "reject"]),
});

/** `changed` is false when the press lost a race and decided nothing (P-54):
 *  the write still succeeded, but the row was already settled by the time it
 *  landed. The tray reads this to tell "you decided this" from "this was
 *  already decided" apart, which it could not do before this field existed. */
export type DecideApprovalItemResult = { ok: boolean; changed: boolean };

/**
 * Decide ONE gate. The whole body of the single-item entry point, extracted so
 * the bulk door below cannot become a second write path.
 *
 * EXTRACTED RATHER THAN COPIED, and that is the load-bearing choice. `routeDecision`
 * is the only place that knows how each of the ten gate families resolves, and a
 * bulk endpoint that re-implemented any part of this would be a parallel
 * decision path that drifts: a family added to one and not the other, or
 * provenance read after the write in one of them. Both doors now run exactly
 * these lines in exactly this order.
 */
async function decideOneApprovalItem(
  db: SupabaseClient,
  userId: string,
  data: z.infer<typeof DecideSchema>,
): Promise<boolean> {
  // Provenance FIRST, while the row still describes the draft the human
  // judged. Every resolver below rewrites status, and `prds` in particular
  // moves to approved/draft, so the same read afterwards would attribute the
  // decision rather than the thing decided on.
  const attribution = await readGateAttribution(db, data.kind, data.id);

  const changed = await routeDecision(db, data);

  // Then the flywheel, and only once the gate has actually moved: a resolver
  // that throws leaves no event, because a correction that never happened is
  // not evidence about an agent. Best-effort by construction
  // (recordGateSignalCore never throws), so telemetry cannot break the gate
  // it observes. Skipped when the human wrote the draft themselves - that is
  // a real decision but not an agent correction, and scoring it as one would
  // bias every rate the ranking consumes.
  //
  // ALSO SKIPPED WHEN `changed` IS FALSE (P-54): a press that lost the race
  // decided nothing, so recording it as a correction would score an agent on
  // a verdict that never actually landed.
  if (attribution.agentDrafted && changed) {
    await recordGateSignalCore(db, userId, {
      gateType: data.verdict === "approve" ? "approval" : "rejection",
      subjectType: data.kind,
      subjectRef: data.id,
      agentSlug: attribution.agentSlug,
      toolName: attribution.toolName,
      verdict: data.verdict === "approve" ? "approved" : "rejected",
      workspaceId: attribution.workspaceId,
    });
  }
  return changed;
}

/** One decide entry point for every gate kind, routing to the existing
 *  resolver for that gate (never a new write path). */
export const decideApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DecideSchema>) => DecideSchema.parse(d))
  .handler(async ({ context, data }): Promise<DecideApprovalItemResult> => {
    const db = context.supabase as unknown as SupabaseClient;
    const changed = await decideOneApprovalItem(db, context.userId, data);
    return { ok: true, changed };
  });

/**
 * How many gates one bulk call may decide.
 *
 * Bounded for the same reason the ingest webhook is bounded at fifty: an
 * unbounded loop of writes behind one request is a way to hold a Worker open
 * until it is killed between two of them, and the failure mode is a half-decided
 * batch nobody can see the shape of. Fifty is enough to clear a real backlog in
 * one or two presses and few enough to finish inside the request budget.
 */
export const MAX_BULK_DECISIONS = 50;

/**
 * What a bulk decision did, PER ITEM, never as one boolean.
 *
 * A caller that presses approve on forty gates and gets `{ok: true}` back knows
 * nothing it can act on: it cannot tell forty successes from thirty-nine plus a
 * silent refusal, and an agent cannot decide what to retry. So every id comes
 * back in exactly one of the two lists, and a refusal carries its own reason.
 */
export type BulkDecideResult = {
  decided: Array<{ kind: string; id: string }>;
  refused: Array<{ kind: string; id: string; reason: string }>;
};

const BulkDecideSchema = z.object({
  verdict: z.enum(["approve", "reject"]),
  items: z
    .array(DecideSchema.omit({ verdict: true }))
    .min(1)
    .max(MAX_BULK_DECISIONS),
});

/**
 * Decide many gates in one call.
 *
 * WHY IT HAD TO EXIST. Every gate was one press, so a workspace holding two
 * hundred pending approvals held two hundred clicks, and the machine surface had
 * no bulk operation of any kind. The founder's bar for this product is that
 * anything a human can do is available programmatically; a queue that can only
 * be drained one row at a time fails that on both sides at once.
 *
 * ONE FAILURE DOES NOT ABORT THE REST, which is the whole reason the result is
 * shaped the way it is. A batch that stopped at the first refusal would leave a
 * partially decided set with no record of where it stopped, and the caller would
 * have to diff the queue to find out. Each item is decided independently and
 * reported independently.
 *
 * SEQUENTIAL, DELIBERATELY, and this is not a performance oversight. The ten
 * resolvers write to different tables and several are not idempotent; the
 * approvals path in particular was fixed this month for a double-execute that
 * merged a customer pull request twice. Firing fifty of them at once multiplies
 * exactly that risk for a saving nobody asked for on a bounded list.
 *
 * IT IS NOT A POLICY CHANGE, and that distinction matters more than the feature.
 * The governance canon says a long queue is a policy failure to surface rather
 * than a workload to render, and the right answer to "you approved fourteen of
 * these without changes" is to offer to stop asking. This does not do that and
 * must not be mistaken for it: it makes the existing backlog answerable in one
 * press. Surfacing the policy offer is separate work and is still owed.
 */
export const decideApprovalItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof BulkDecideSchema>) => BulkDecideSchema.parse(d))
  .handler(async ({ context, data }): Promise<BulkDecideResult> => {
    const db = context.supabase as unknown as SupabaseClient;
    const decided: BulkDecideResult["decided"] = [];
    const refused: BulkDecideResult["refused"] = [];

    // DEDUPLICATED BEFORE ANYTHING RUNS. The same gate named twice in one batch
    // would be decided twice, and several resolvers are not idempotent, so this
    // is the cheapest place to stop a caller's own duplicate from becoming a
    // double execution.
    const seen = new Set<string>();
    for (const item of data.items) {
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        await decideOneApprovalItem(db, context.userId, { ...item, verdict: data.verdict });
        decided.push({ kind: item.kind, id: item.id });
      } catch (e) {
        // The resolver's own sentence, not a generic one. It is what tells a
        // person whether this gate was already answered, belongs to someone
        // else, or hit a real failure, and those want three different responses.
        refused.push({
          kind: item.kind,
          id: item.id,
          reason: e instanceof Error ? e.message : "That gate could not be decided.",
        });
      }
    }
    return { decided, refused };
  });

/** Routes one decided gate to the existing resolver for its family. Extracted
 * from the handler so the decision and the telemetry that observes it stay
 * separable: this function owns the write, and nothing here knows the
 * flywheel exists. Never a new write path - every arm is the resolver that
 * already owned that family.
 *
 * RETURNS WHETHER A ROW ACTUALLY CHANGED (P-54). Most resolvers already throw
 * on a genuine zero-row write (`.select().single()` or an explicit
 * `if (!updated) throw`), so a press against a gate that no longer exists
 * surfaces there as a failure, which the tray already renders honestly.
 * `tool_call` and `assumption_challenge` are the two exceptions: both resolve
 * a lost race (someone, or another tab, decided the same gate a moment
 * earlier) as `{ ok: true }` on purpose, because losing that race is not an
 * error. It was ALSO not distinguishable from a real decision until now, which
 * is the exact shape of the incident this packet closes: a burst of keys
 * during the approvals page's own live-agent race settled the same tool-call
 * gate more than once, and every one of those presses printed "You approved"
 * on the settled tray. Every other kind returns `true` unconditionally: it
 * either just wrote the row or it already threw.
 */
async function routeDecision(
  db: SupabaseClient,
  data: z.infer<typeof DecideSchema>,
): Promise<boolean> {
  switch (data.kind) {
    case "tool_call": {
      const res = await resolveApproval({
        data: {
          approvalId: data.id,
          decision: data.verdict === "approve" ? "approved" : "rejected",
        },
      });
      return !res.already_decided;
    }
    case "decision": {
      await updateDecision({
        data: { id: data.id, status: data.verdict === "approve" ? "approved" : "rejected" },
      });
      return true;
    }
    case "memory_candidate": {
      await decideMemoryCandidate({ data: { id: data.id, decision: data.verdict } });
      return true;
    }
    case "house_rule": {
      await decideHouseRule({ data: { ruleId: data.id, decision: data.verdict } });
      return true;
    }
    case "trust_graduation": {
      await decideTrustGraduation({
        data: { proposalId: data.id, accept: data.verdict === "approve" },
      });
      return true;
    }
    case "spec": {
      // The queue only ever lists specs at status 'review', so this guard is
      // silent on every item the tray can show. It exists because the id is
      // posted, not carried: see the state-by-state note above DecideSchema.
      const to = data.verdict === "approve" ? "approved" : "draft";
      await assertSpecStatusWrite(db, data.id, to);
      await savePrd({ data: { id: data.id, status: to } });
      return true;
    }
    case "opportunity": {
      await updateOpportunity({
        data: { id: data.id, status: data.verdict === "approve" ? "now" : "dropped" },
      });
      return true;
    }
    case "assumption_challenge": {
      const res = await resolveAssumptionChallenge({
        data: { id: data.id, action: data.verdict === "approve" ? "confirm" : "dismiss" },
      });
      return res.changed;
    }
    case "design_gate": {
      await decideDesignGate({
        data: { prdId: data.id, decision: data.verdict === "approve" ? "approve" : "reject" },
      });
      return true;
    }
    case "playbook_proposal": {
      await decidePlaybookProposal({
        data: {
          proposalId: data.id,
          decision: data.verdict === "approve" ? "confirm" : "dismiss",
        },
      });
      return true;
    }
    default:
      throw new Error(`decideApprovalItem: unknown kind ${String(data.kind)}`);
  }
}

const SnoozeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "tool_call",
    "decision",
    "memory_candidate",
    "house_rule",
    "trust_graduation",
    "spec",
    "opportunity",
    "assumption_challenge",
    "design_gate",
    "playbook_proposal",
  ]),
  /** Defer window in hours; default one day ("resurfaces with tomorrow's briefing"). */
  hours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .optional(),
  reason: z.string().max(500).optional(),
});

export type SnoozeApprovalItemResult = { ok: boolean; snoozedUntil: string };

/**
 * Snooze a gate (the tray's H verb). Defers ANY federated family by
 * (kind, source_id) without touching its source table: a personal triage
 * record in approval_snoozes that getApprovalsQueue filters on until it lapses.
 *
 * Founder-authorized 2026-07-19. 2026-08-06: the table HAS landed
 * (supabase/migrations/20260720000000_mc_approval_snoozes.sql) and carries live
 * rows, so the pre-merge caveat this comment used to make is spent - a failure
 * here is now a real failure and is surfaced as one. The UI has NOT caught up:
 * MissionShell's snoozeMutation.onError still toasts "Snooze is not live yet.
 * It turns on with the next release." over what is now a genuine error. That
 * copy is in src/components/mission/MissionShell.tsx and is not fixed here.
 */
export const snoozeApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SnoozeSchema>) => SnoozeSchema.parse(d))
  .handler(async ({ context, data }): Promise<SnoozeApprovalItemResult> => {
    const db = context.supabase as unknown as SupabaseClient;
    const hours = data.hours ?? 24;
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    // NO ROWS BACK MEANT NO EVIDENCE. Without `.select()` PostgREST returns
    // nothing and supabase-js resolves with `data: null` whether one row landed
    // or none did, so the tray's "Snoozed. It will resurface with tomorrow's
    // briefing." was drawn on a resolved promise rather than on a written row.
    // The returned id is the evidence; an empty set is the refusal case.
    const { data: rows, error } = await db
      .from("approval_snoozes")
      .upsert(
        {
          user_id: context.userId,
          kind: data.kind,
          source_id: data.id,
          snoozed_until: snoozedUntil,
          reason: data.reason ?? null,
        },
        { onConflict: "user_id,kind,source_id" },
      )
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("The snooze was not recorded, so this gate is still in your queue.");
    }
    return { ok: true, snoozedUntil };
  });

/** The gate families that can be SENT BACK (returned to a revisable state with
 *  a note), as opposed to only approved/declined. A spec that has not shipped
 *  returns to draft; a design gate returns for revision. Every other family is
 *  a binary gate.
 *
 *  KIND, NOT INSTANCE. This answers "can this family be sent back at all",
 *  which is what the tray needs to draw the verb. Whether a PARTICULAR spec may
 *  move is a second question answered per state by assertSpecStatusWrite: a
 *  shipped spec is a revisable KIND whose backward move is refused. */
export const REVISABLE_KINDS: readonly ApprovalKind[] = ["spec", "design_gate"];

export function isRevisableKind(kind: ApprovalKind): boolean {
  return REVISABLE_KINDS.includes(kind);
}

const SendBackSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "tool_call",
    "decision",
    "memory_candidate",
    "house_rule",
    "trust_graduation",
    "spec",
    "opportunity",
    "assumption_challenge",
    "design_gate",
    "playbook_proposal",
  ]),
  /** The operator's revision guidance. Required: a note-less send-back is a decline. */
  note: z.string().min(1).max(2000),
});

export type SendBackApprovalItemResult = { ok: boolean };

/**
 * Send a revisable gate back with a note (the tray's verb 2). The spec's live
 * state is checked FIRST, then the note is persisted (approval_feedback), then
 * the gate is returned to its revisable state via the SAME resolvers the decide
 * path uses: a spec to draft, a design gate to reject-for-revision, so the
 * agent continues the same thread knowing what to fix. Non-revisable families
 * are refused (decline them instead).
 *
 * Founder-authorized 2026-07-19. 2026-08-06: the approval_feedback table HAS
 * landed (supabase/migrations/20260720010000_mc_approval_feedback.sql), so the
 * pre-merge caveat this comment used to make is spent - and MissionShell's
 * sendBackMutation.onError toast, "Send back turns on with the next release.",
 * now hides real errors including this function's own refusals. That copy lives
 * in src/components/mission/MissionShell.tsx and is NOT fixed here.
 *
 * ORDERING, AND IT IS NOT ONE OF FOUR EQUAL FOLLOW-UPS. Every refusal this
 * function raises is a NEW error path that did not exist before it. Today none
 * of them is reachable: the tray lists specs only at status 'review', where
 * every guard permits, and the optimistic removal in MissionShell pulls the
 * item out of the list before a second press can land on "This spec is already
 * a draft". The moment the spec-page door below is mounted, that stops being
 * true and all three refusal messages -- carefully worded, naming three real
 * doors -- get replaced on screen by "Send back turns on with the next
 * release.", which is false about a feature that shipped weeks ago. The toast
 * fix must land in the SAME change as the door, not after it.
 *
 * WHICH SPECS CAN REACH THIS AND WHICH CANNOT (the honest half of the fix).
 * The state rules above DecideSchema now let an APPROVED, unshipped spec be
 * sent back, and refuse a shipped one. That is the server half only: the queue
 * still sources specs with `.eq("status","review")` (re-measured 2026-08-06:
 * exactly ONE spec is at 'review' across the whole database), so no surface
 * offers this verb on the 34 approved-and-unshipped specs (41 approved less the
 * 7 carrying a shipped_at, same measurement). Widening
 * that source is the wrong fix - an approved spec is not a pending approval,
 * and listing 41 of them would inflate the one count three surfaces badge. The
 * door belongs on the spec's own page, next to Approve, in
 * src/routes/_authenticated.plan.spec.$id.tsx. This function is ready for it.
 */
export const sendBackApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SendBackSchema>) => SendBackSchema.parse(d))
  .handler(async ({ context, data }): Promise<SendBackApprovalItemResult> => {
    if (!isRevisableKind(data.kind)) {
      throw new Error("This kind can't be sent back. Decline it instead.");
    }
    const db = context.supabase as unknown as SupabaseClient;

    // Provenance before any write, for the same reason the decide path reads it
    // first: step 3 below moves the spec to 'draft', and attribution read after
    // that describes the send-back rather than the draft being sent back.
    const attribution = await readGateAttribution(db, data.kind, data.id);

    // 1) STATE FIRST, before a single row is written. A send-back the spec's
    //    own state forbids must leave no trace at all - not even a note that
    //    reads, later, as guidance somebody acted on. Specs only: a design-gate
    //    send-back writes prds.design_gate_status via decideDesignGate and
    //    never touches prds.status, so it cannot contradict a shipped record.
    if (data.kind === "spec") {
      await assertSpecStatusWrite(db, data.id, "draft");
    }

    // 2) Capture the note. Same rule as the snooze write: `.select("id")` so
    //    the row that comes back is the evidence the note landed, and an empty
    //    set is treated as the refusal it is. A send-back whose note vanished
    //    is a decline wearing guidance's clothes.
    const { data: noteRows, error: fbErr } = await db
      .from("approval_feedback")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        source_id: data.id,
        note: data.note,
      })
      .select("id");
    if (fbErr) throw new Error(fbErr.message);
    if (!noteRows || noteRows.length === 0) {
      throw new Error("Your note was not recorded, so nothing was sent back.");
    }

    // 3) Return the gate to its revisable state via the existing resolvers.
    //    PARTIAL-FAILURE HONESTY: these are two writes, not a transaction. If
    //    the resolver below throws, the note from step 2 stays behind. That is
    //    the safe residue - a record of what you asked for, on a gate the
    //    caller was just told did not move - and it is not cleaned up here,
    //    because a compensating delete can fail in exactly the same way.
    if (data.kind === "spec") {
      await savePrd({ data: { id: data.id, status: "draft" } });
    } else {
      await decideDesignGate({ data: { prdId: data.id, decision: "reject" } });
    }

    // 4) The flywheel, last, and the richest event the product can capture.
    //    A send-back is a rejection in which the human states IN THEIR OWN
    //    WORDS what the agent got wrong, so the note becomes the diff summary
    //    rather than a generated one. Every other gate yields a verdict; only
    //    this one yields a reason, which is what self-improve's
    //    `loadFlagEvidence` reads back verbatim when it drafts a proposal
    //    against an agent.
    //
    //    `approval_feedback` held ZERO rows when this was written, so no
    //    send-back note has ever reached the flywheel. It is recorded after
    //    the resolver rather than beside the note in step 2, for the same
    //    reason the decide path does: an event is evidence that a gate MOVED.
    //    The partial-failure residue documented in step 3 is unchanged - if
    //    the resolver throws, the note survives and no event is written, which
    //    is the honest pair.
    if (attribution.agentDrafted) {
      await recordGateSignalCore(db, context.userId, {
        gateType: "rejection",
        subjectType: data.kind,
        subjectRef: data.id,
        agentSlug: attribution.agentSlug,
        toolName: attribution.toolName,
        verdict: "sent_back",
        diffSummary: data.note,
        workspaceId: attribution.workspaceId,
      });
    }
    return { ok: true };
  });

/**
 * WHY A TOOL WENT QUIET — the policy's own sentence, per workspace.
 *
 * ── THE HALF THAT MAKES THE POLICY SAFE TO BIND ────────────────────────────
 * `resolveApprovalPolicy` can switch a tool off when a workspace has refused it
 * every time. That is the point — the doctrine's line is *"a long approvals queue
 * is a policy failure to surface, not a workload to render"*, and asking a
 * question whose answer you already have, seven times, is worse than not offering
 * it.
 *
 * **But a tool that stops working with no explanation is a dead end**, which
 * R-20 §5 forbids outright, and it is the reason the policy is NOT yet wired to
 * the gate. The module already writes a sentence for the person —
 * *"You have turned down all 7 requests to do this and approved none, so it is
 * switched off rather than asked again. Turning it back on is yours."*
 * **This read is how that sentence reaches a surface.** Once S3 renders it, the
 * gate call is three lines and the behaviour can bind without going silent.
 *
 * ── WHAT IT RETURNS TODAY, MEASURED 2026-08-26 ─────────────────────────────
 *   delegate.openhands   0 approved · 7 rejected  ->  disabled
 *   calendar.create      0 approved · 7 rejected  ->  disabled
 *
 * Only tools this workspace has actually ruled on appear. A tool nobody has
 * answered has no record, sits at its axis default, and is not a finding.
 *
 * READ-ONLY, and it changes no behaviour. It reports what the policy WOULD say.
 */
export const getApprovalPolicyState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      tools: Array<{
        tool: string;
        decision: string;
        reason: string;
        approved: number;
        rejected: number;
        tightenedFromDefault: boolean;
      }>;
    }> => {
      const { supabase } = context;

      const { data: rows, error } = await supabase
        .from("agent_approvals")
        .select("tool_name")
        .eq("workspace_id", data.workspaceId)
        .in("status", ["approved", "rejected"]);

      // A failed read claims nothing rather than reporting an empty policy,
      // which would read as "no tool has ever been ruled on" — the positive
      // claim F-76 was built out of.
      if (error || !rows) return { tools: [] };

      const names = [...new Set((rows as Array<{ tool_name?: string }>).map((r) => r.tool_name))]
        .filter((n): n is string => Boolean(n))
        .sort();

      const tools: Array<{
        tool: string;
        decision: string;
        reason: string;
        approved: number;
        rejected: number;
        tightenedFromDefault: boolean;
      }> = [];

      for (const tool of names) {
        const record = await approvalRecordFor(supabase as never, data.workspaceId, tool);
        if (!record) continue;
        const withRecord = resolveApprovalPolicy({ tool, record });
        const bare = resolveApprovalPolicy({ tool });
        tools.push({
          tool,
          decision: withRecord.decision,
          reason: withRecord.reason,
          approved: record.approved,
          rejected: record.rejected,
          // The record can only ever tighten (see the invariant test), so this
          // says "the answers changed something" rather than "which direction".
          tightenedFromDefault: withRecord.decision !== bare.decision,
        });
      }

      return { tools };
    },
  );

/**
 * WHO IS ABOUT TO TOUCH THE SAME THING — the read behind S2's collision mark.
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §4 gives the derivation to S0 and the mark to S2.
 * The derivation is pure and lives in `src/lib/presence/collision.ts`; this is
 * only the read that feeds it.
 *
 * ── IT COULD NOT BE WRITTEN UNTIL TODAY ────────────────────────────────────
 * S2 specified anchors as "newest `tool_calls` row per ACTIVE `agent_run`", and
 * that join did not exist: `tool_calls.trace_id` matched **0 of 1,689**
 * `agent_runs.id` because `agent_runs` had no such column (F-93). The link lived
 * in memory for the life of a run and then was gone. The column exists now, so
 * this read is ordinary.
 *
 * ── THE TWO HONESTY RULES IT INHERITS ──────────────────────────────────────
 * **A run with a NULL `trace_id` is UNKNOWABLE, never "touched nothing".** Every
 * run created before 2026-08-26 is NULL forever, because the correlation was
 * never recorded. Treating those as idle would report two agents as safely apart
 * when nobody knows — the failure direction that matters on a collision surface.
 * They are excluded from anchors rather than counted as clear.
 *
 * **A call that names no target contributes no anchor**, and a run with no anchor
 * is absent from the view rather than shown as safe. Same distinction, one layer
 * down, enforced in `targetOf`.
 */
export const getWorkspaceAnchors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ anchors: Anchor[]; collisions: Collision[]; unknowableRuns: number }> => {
      const { supabase } = context;

      // Active runs only, the same set the presence layer treats as live.
      const { data: runs, error: runsErr } = await supabase
        .from("agent_runs")
        .select("id,agent_slug,mission_id,trace_id")
        .eq("workspace_id", data.workspaceId)
        .in("status", ["running", "in_progress"]);

      // A failed read claims nothing. Reporting "no collisions" because a query
      // broke is the one answer this surface must never give.
      if (runsErr || !runs) return { anchors: [], collisions: [], unknowableRuns: 0 };

      const live = runs as Array<{
        id: string;
        agent_slug: string | null;
        mission_id: string | null;
        trace_id: string | null;
      }>;

      // Counted and reported, not silently dropped: a surface that says "2 runs
      // cannot be checked" is honest, and one that omits them is not.
      const unknowableRuns = live.filter((r) => !r.trace_id).length;
      const traceable = live.filter((r) => r.trace_id);
      if (traceable.length === 0) return { anchors: [], collisions: [], unknowableRuns };

      /* SCOPED TOO (P-70). The workspace is REQUIRED on this reader, so unlike
         the others there is no unresolved case: the trace ids already come from
         runs in this workspace, and this makes the tenant explicit. */
      let callsQ = supabase.from("tool_calls").select("trace_id,tool_name,args,created_at");
      callsQ = callsQ.eq("workspace_id", data.workspaceId);
      const { data: calls, error: callsErr } = await callsQ
        .in(
          "trace_id",
          traceable.map((r) => r.trace_id as string),
        )
        .order("created_at", { ascending: false })
        .limit(400);

      if (callsErr || !calls) return { anchors: [], collisions: [], unknowableRuns };

      /*
       * ── THE VERB IS THE NEWEST CALL; THE PLACE IS THE NEWEST CALL THAT NAMED
       *    ONE. Two different rows, on purpose (2026-08-31, S2's finding). ────
       *
       * This used to take the newest call per trace and drop the run entirely
       * when that call named nothing. Measured by S2: **1,983 of 2,271 calls
       * over 60 days resolve to no target**, and the ordinary agent shape is
       * `repo.read` (names a file) then `ci.logs` then `studio.stage`, so a run
       * demonstrably working on a file was anchored for about nine seconds of a
       * ninety-eight second run and invisible for the rest.
       *
       * The 1,983 are not a bug in `targetOf`: they are `signals.list`,
       * `*.search` and creates whose target does not exist until the call
       * RETURNS. There is nothing to name, so the fix is not to widen the key
       * list -- it is to stop forgetting the last place we DID know.
       *
       * `createdAt` is the ANCHORING call's timestamp rather than the newest
       * one, because the position must trace to the specific row that justifies
       * it. The verb is the newest call, because that is what the teammate is
       * doing now. A reader seeing "staging" over `AddressStep.tsx` is being
       * told something true in the past tense, which is what the spec asks for.
       */
      const newestByTrace = new Map<string, { tool_name: string; created_at: string }>();
      const newestNamedByTrace = new Map<
        string,
        { targetKind: string; targetId: string; created_at: string }
      >();
      for (const c of calls as Array<{
        trace_id: string;
        tool_name: string;
        args: unknown;
        created_at: string;
      }>) {
        if (!newestByTrace.has(c.trace_id)) newestByTrace.set(c.trace_id, c);
        if (!newestNamedByTrace.has(c.trace_id)) {
          const t = targetOf(c.args);
          if (t) newestNamedByTrace.set(c.trace_id, { ...t, created_at: c.created_at });
        }
      }

      const anchors: Anchor[] = [];
      for (const run of traceable) {
        const verb = newestByTrace.get(run.trace_id as string);
        const placed = newestNamedByTrace.get(run.trace_id as string);
        // NOTHING THIS RUN HAS DONE EVER NAMED A TARGET, which is still not the
        // same as "touching nothing": the run is absent from the view rather
        // than drawn as safe. F-76's distinction, and the one a collision
        // surface is most tempted to collapse.
        if (!verb || !placed) continue;
        anchors.push({
          runId: run.id,
          agentSlug: run.agent_slug,
          missionId: run.mission_id,
          toolName: verb.tool_name,
          targetKind: placed.targetKind,
          targetId: placed.targetId,
          createdAt: placed.created_at,
        });
      }

      return { anchors, collisions: collisionsFrom(anchors), unknowableRuns };
    },
  );
