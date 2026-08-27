/**
 * Plan. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * Pass one ported this surface onto the primitives and kept all eight panels.
 * Eight panels is a filing cabinet, not a surface: /roadmap, /prds and
 * /stakeholder were each folded in here over time, and folding is not
 * designing. This pass makes every element earn its place out loud and deletes
 * the ones that could not.
 *
 * 1. WHO IS HERE, AND WHY. A product lead deciding what the team commits to
 *    next, and saying what each commitment promises. They came to place bets,
 *    not to read a portfolio.
 *
 * 2. THE ONE THING IT EXISTS FOR. To move a bet into Now, Next or Later with a
 *    declared outcome and a measure. Nowhere else in the product can a
 *    commitment be made, or its promise be written down.
 *
 * 3. KEEP / MOVE / KILL, on what was here before:
 *    KEEP  the Now/Next/Later board. It is the surface. Everything else either
 *          serves it or left.
 *    KEEP  the undeclared-outcome Gate. A committed bet carrying no outcome and
 *          no measure is the one thing on this page genuinely waiting on a
 *          person, so it gets the biggest treatment and the only primary action.
 *    KEEP  the specs, but as one-line rows whose second line says WHICH BET the
 *          spec serves. On a planning surface a spec is the written form of a
 *          bet, and that join is the only reason a spec list belongs here.
 *    KEEP  "who works the plan" in the context column. It is the only thing
 *          telling you whether anything moves without you.
 *    KILL  SpecComposer, the "What do you want to build?" box. A blank-line
 *          authoring prompt on a deciding surface, wearing an ember gradient
 *          CTA that competed with the Gate for the one primary action. Drafting
 *          a contract from one line of intent is a conversation with the crew.
 *          MOVE -> the Ask pane, top right (founder ruling 2026-07-29).
 *    KILL  the SpecDetail drawer. A half-copy of the editor that already exists
 *          at /plan/spec/$id: two ways to read one thing, one click apart. Rows
 *          now open the editor, where every spec action already lives.
 *    KILL  GoalsPanel. A standing objective is policy set in advance, and the
 *          panel's own docstring says all judgment stays in Decide. It is the
 *          machine that proposes candidate bets, not a bet.
 *          MOVE -> Settings, Workspace, beside the strategic brief.
 *    KILL  LoopsPanel. "Work that re-runs on its own, every run logged with its
 *          cost" is machinery status, and the Engine-Room doctrine puts
 *          machinery behind that one door. MOVE -> /engine-room, spend room.
 *    KILL  StakeholderPackPanel. Writing an update for an audience is a
 *          communication job that shares nothing with committing a bet except
 *          that both mention decisions. MOVE -> /brain, where the record's
 *          readable output already lives.
 *    KILL  IntelBriefPanel. Read-only market and competitor briefs with no
 *          decision on them. Discover's own redesign pushed them here on the
 *          grounds that they "already render on /plan"; this surface pushes
 *          back rather than accept the parcel. They are built from `signals`,
 *          and signals are Discover's job. MOVE -> /discover.
 *    KILL  the context column's "How it stacks up" tally. The headline states
 *          the Now count and the count behind it, and every board column prints
 *          its own count. It was the third statement of the same three numbers.
 *    KILL  the collapse and expand state machine, its five section refs and the
 *          five inline-styled wrappers around them. They existed only to hide
 *          the panels that have now left.
 *
 * 4. ONE CLICK AWAY. A spec row is its title plus one different fact, its state
 *    and the bet it serves, and it never wraps. The body, the contract, the
 *    citations, the task graph, the GitHub issue, Hand to Build and lineage all
 *    live on the editor at /plan/spec/$id. A bet's outcome, measure and rewind
 *    stay on the bet itself, on the board.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is the coverage line: how many
 *    of the bets in Now have a spec written for them. That is the question a
 *    planner otherwise answers by hand, by opening things one at a time, and it
 *    falls straight out of two reads the page already makes. The confusion to
 *    avoid was the old one: six unrelated panels down one page, so nobody could
 *    tell whether the surface wanted them to commit, to write, to schedule or
 *    to report.
 *
 * ----------------------------------------------------------------------------
 * 2026-08-06, THE AUDIT PASS: THE MOMENT GETS A DOOR, AND THE GATE GETS A NO.
 *
 * The station audit returned "not-self-sufficient" on Plan. Two of its findings
 * were about this file.
 *
 *   1. THE STATION THAT EXISTS TO PRODUCE A SPEC HAD NO WAY TO START ONE, and
 *      its one instruction about starting one was false. The Empty said
 *      "Commit a bet and Scribe drafts the first one", and committing a bet
 *      writes no spec: `commitRoadmapItem` sets the lane, the outcome and the
 *      measure and stops, and nothing reacts to it. The coverage line beside it
 *      ("N of the M bets in Now have a spec written") was a scoreboard with no
 *      door. Both are closed: the Empty names Decide's "Keep it", the real
 *      writer, and the coverage line now names the first uncovered bet in Now
 *      and drafts it here, through `generatePrd`. See `draftSpec`.
 *   2. THE GATE'S DECLARE WRITE HAD NO FAILURE PATH AT ALL. No `onError`, and
 *      `CommitCeremony` renders no error of its own, so a refused promise left
 *      the dialog sitting there with nothing said. It reports now, keeps the
 *      typed words, and offers the retry. See `refused`.
 *
 * Point 5 above still holds, with one word added: the moment is the coverage
 * line, and the coverage line is now a place you can act rather than only read.
 *
 * URL CONTRACT. `?view=` still validates all five legacy values, so /roadmap,
 * /prds and /stakeholder never 404. `roadmap` and `specs` still scroll their
 * section into view and move focus to it. `stakeholders`, `goals` and `loops`
 * now land at the top of Plan; legacy-redirects.ts must be re-pointed once
 * those three panels have homes.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import { Num, Door, Actions } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { stillWaiting } from "@/lib/query-state";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import type { FleetAgentState } from "@/lib/agent-fleet";
import { commitRoadmapItem, getRoadmap } from "@/lib/roadmap.functions";
import { isCommitmentGoverned } from "@/lib/roadmap-governance";
// `generatePrd` is the ONLY writer of a spec from a bet in the product, and
// until this pass it was imported by exactly two files, neither of them the
// station whose stated product is a spec. See `draftSpec`.
import { generatePrd, listSpecs } from "@/lib/discovery.functions";
import { listDesignWork, type DesignWorkRow } from "@/lib/design-scaffold.functions";
import { DESIGN_SKIPPED_ON_PURPOSE } from "@/lib/trust-chain.functions";
import { specStateWords, stripAutoPrefix } from "@/components/plan/format";
import { RoadmapColumns } from "@/components/plan/RoadmapColumns";
import { TrackStart } from "@/components/spine/TrackStart";
import { CommitCeremony, type CommitCeremonyBet } from "@/components/plan/CommitCeremony";
import {
  Action,
  Approve,
  NothingYet,
  PageHeading,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { CtxHead, CtxRow } from "@/components/meridian/ContextColumn";
import { Gate } from "@/components/meridian/Gate";
import { Receipt } from "@/components/meridian/Receipt";
import { Surface } from "@/components/meridian/Surface";
import { AgentMark, type MarkState } from "@/components/meridian/marks";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { CrewWorking } from "@/components/shell/CrewWorking";
import { AgentPulse } from "@/components/meridian/AgentPulse";

/** The deep-linkable values. The union is a contract with the legacy redirects
 *  (/prds, /roadmap, /stakeholder), so it never shrinks even when a section
 *  leaves; only the anchors below change. */
const PLAN_VIEWS = ["goals", "loops", "roadmap", "specs", "stakeholders"] as const;
type PlanView = (typeof PLAN_VIEWS)[number];

/**
 * THE THREE VALUES THAT RESOLVED TO NOTHING, AND NOW SAY WHERE THE THING WENT.
 *
 * `validateSearch` accepts five and only two of them, `roadmap` and `specs`,
 * have a section left on this page to scroll to. The other three name panels the
 * redesign moved off Plan, and `go()` handled them by returning early: a person
 * following a link, a bookmark or the live `/stakeholder` redirect
 * (legacy-redirects.ts, still pointed here) arrived at the top of a page with no
 * trace of what they came for and nothing to tell them it had moved. That is not
 * a 404, which is the thing the union exists to avoid; it is worse, because a
 * 404 at least says something happened.
 *
 * So a dead value now answers the question the link asked. Each one names what
 * it was, where it went and why, and carries the door: a link that stops
 * resolving is a broken link nobody reports, and a link that resolves to a
 * silent no-op is a broken link nobody can even see.
 *
 * THE DESTINATIONS ARE THIS FILE'S OWN KEEP/MOVE/KILL RULING, quoted from the
 * docblock above rather than invented here, and all three routes were checked to
 * exist. When `legacy-redirects.ts` is re-pointed at them, this table is what
 * says where to point it.
 */
const MOVED_VIEWS: Record<string, { what: string; why: string; to: string; door: string }> = {
  stakeholders: {
    what: "The stakeholder pack is not on Plan any more.",
    why: "Writing an update for an audience is a communication job, and it shares nothing with committing a bet except that both mention decisions. It lives with the record's readable output.",
    to: "/brain",
    door: "Open the brain",
  },
  goals: {
    what: "Standing objectives are not on Plan any more.",
    why: "A standing objective is policy set in advance: it is the machine that proposes candidate bets rather than a bet. It lives beside the strategic brief.",
    to: "/settings",
    door: "Open Settings",
  },
  loops: {
    what: "Work that re-runs on its own is not on Plan any more.",
    why: "Every run and what it cost is machinery status, and machinery lives behind one door rather than on the surface where you place bets.",
    to: "/engine-room",
    door: "Open the engine room",
  },
};

/** Fleet state to mark state. State is never a hue: the mark carries it. */
function markState(state: FleetAgentState): MarkState {
  if (state === "working") return "running";
  if (state === "attention") return "gate";
  if (state === "queued") return "idle";
  return "quiet";
}

/** Plain-words relative time. Mono is applied by the caller. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/* `specState` used to live here, private to this file, turning prds.status into
 * plain words for the spec rows below. One click away, the spec EDITOR printed
 * `{prd.status}` raw, so the same document read "In review" on this list and
 * "review" on the page the row opens. A word that has to read the same on two
 * surfaces belongs to neither of them: it is `specStateWords` in
 * components/plan/format.ts now, imported above, and both surfaces read it. */

/** The two agents that work this surface. ux-architect moved to /design in the
 *  2026-07-17 repair pass and does not belong here. */
const PLAN_AGENTS = ["prd-writer", "sprint-planner"];

/** Anti-scroll: the recent specs, and the rest on demand. */
const VISIBLE_SPECS = 8;

export const Route = createFileRoute("/_authenticated/plan/")({
  validateSearch: (search: Record<string, unknown>): { view?: PlanView } => {
    const v = search.view;
    return {
      view: (PLAN_VIEWS as readonly string[]).includes(v as string) ? (v as PlanView) : undefined,
    };
  },
  component: PlanPage,
  head: () => ({ meta: [{ title: "Plan · Supaprod" }] }),
  errorComponent: ({ error, reset }) => {
    // Route-level crashes previously threw away the real error - log it so any
    // future occurrence is diagnosable from the console instead of a silent
    // failure with no trace.
    console.error("[Plan] route crashed:", error);
    return (
      <Surface>
        {/* THE STACK OWNS THE SPACE BETWEEN REGIONS NOW. The retired `Block`
            drew its own 36px margin, 28px pad and top rule, so a surface never
            said how its regions were spaced; Meridian's `Region` draws none of
            that on purpose, and the six already-ported surfaces all state it
            here as one gap. Same class, same stop, so Plan reads at the same
            rhythm as Crew, Runs, Brain and the Engine Room. */}
        <div className="flex flex-col gap-mrd-7">
          {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
              genuinely mid-run, so it costs no space when the crew is idle and
              cannot show a step that did not happen. Every other pulse on this
              station is gated on a mutation the reader's own click started;
              this one is bound to the run. See use-live-agents.ts. */}
          <CrewWorking station="define" />
          <PageHeading
            title="The plan did not load."
            sub={(error as Error)?.message ?? "No reason was reported."}
          />
          {/* A bare `Region` around one button was a container saying nothing.
              `Actions` is the row a control belongs in, and it sets no outer
              margin of its own, so the stack above owns the space. */}
          <Actions>
            <Action variant="primary" onClick={reset}>
              Try again
            </Action>
          </Actions>
        </div>
      </Surface>
    );
  },
});

function PlanPage() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("define");
  const { view } = Route.useSearch();
  const { activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [showAllSpecs, setShowAllSpecs] = React.useState(false);

  const qc = useQueryClient();
  const fRoadmap = useServerFn(getRoadmap);
  const fCommit = useServerFn(commitRoadmapItem);

  /**
   * THE GATE'S ACTION IS THE WRITE, not a scroll to where the write lives.
   *
   * Until 2026-08-01 the primary action here was `go("roadmap")`, which
   * scrolled the page. The Gate names the exact bets that carry no outcome,
   * says why that matters, and then handed the reader back the job of finding
   * those same bets among three columns and remembering what it had just told
   * them. A surface whose one stated purpose is "to move a bet into Now, Next
   * or Later with a declared outcome" made the reader leave the sentence in
   * order to do it.
   *
   * The ceremony is the SAME component and the SAME server write RoadmapColumns
   * already uses, so a promise declared from the Gate and one declared from a
   * card are one code path and cannot drift.
   */
  const [declaring, setDeclaring] = React.useState<CommitCeremonyBet | null>(null);
  const [receipt, setReceipt] = React.useState<{ title: string; outcome: string } | null>(null);
  /**
   * THE REFUSAL, WHICH THE STATION'S ONE GATE HAD NO WAY TO SHOW.
   *
   * `commitRoadmapItem` throws on three reachable paths: `validateCommitment`'s
   * typed refusals, "Opportunity not found" when the RLS-scoped update comes
   * back with no row (src/lib/roadmap.functions.ts), and any transport error.
   * `declare` carried no `onError` at all, and `CommitCeremony` renders no error
   * of its own: its whole prop surface is bet/onConfirm/onCancel/pending. So a
   * refused promise stopped the spinner and left the dialog sitting there with
   * nothing said and nothing to press but "Not yet", on the primary action of
   * this station's only Gate. The three sibling mutations in RoadmapColumns
   * that call the SAME server function all report their error.
   *
   * IT HOLDS THE TYPED WORDS, and that is why this is a state rather than a
   * string. The dialog has to come down for the reason to be readable at all,
   * and closing it would otherwise throw away what the person wrote: the values
   * only exist inside the ceremony's own inputs. Keeping the attempted bet here
   * means "Try it again" re-opens the ceremony already carrying them, because
   * `CommitCeremony` seeds its inputs from `bet.outcome` and `bet.measure`.
   */
  const [refused, setRefused] = React.useState<{
    bet: CommitCeremonyBet;
    reason: string;
  } | null>(null);
  const fFleet = useServerFn(getAgentFleet);
  const fSpecs = useServerFn(listSpecs);
  const fDesignWork = useServerFn(listDesignWork);

  // Same query key as RoadmapColumns, so the head and the gate read the board's
  // cache rather than fetching it a second time.
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => fRoadmap() });
  // Same key as the Crew roster's by-agent view: a cache read, not a call.
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  // The same key the retired SpecList held, so every existing writer that
  // invalidates ["prds"] still refreshes this list.
  const specs = useQuery({ queryKey: ["prds"], queryFn: () => fSpecs() });
  /**
   * WHAT THE SPEC ROWS CANNOT ASK `listSpecs` FOR, read from the design
   * station's own list instead.
   *
   * A spec row's design suffix has to distinguish three states that
   * `prds.design_gate_status` alone cannot: a verdict a human wrote, a drawing
   * sitting on a call nobody has made, and a spec somebody deliberately sent
   * straight to Build. Only the first is in `listSpecs`
   * (src/lib/discovery.functions.ts), which selects a fixed column list and
   * returns neither a `prd_scaffolds` count nor the newest route stage event.
   *
   * `listDesignWork` already returns both, per spec, and this is the SAME
   * `["design-work"]` key /design uses and the spec page already invalidates
   * (src/routes/_authenticated.plan.spec.$id.tsx:651), so the two surfaces read
   * one cache and cannot disagree about a spec's drawing.
   *
   * TWO LIMITS, BOTH STATED BECAUSE BOTH ARE INVISIBLE TO THE READER. It is
   * capped at WORK_LIMIT = 40 specs by `updated_at`, and it is pinned to the
   * caller's default workspace, whereas `listSpecs` takes 300 and is RLS-wide.
   * A spec outside that window gets no design suffix - the same silence it has
   * today, never a wrong word. Measured through the Lovable MCP on 2026-08-06,
   * the busiest workspace in this database holds 8 specs, so the cap is a
   * factor of five away from biting; the row-level fix that removes both limits
   * is the `listSpecs` change carried in this wave's needsOtherFiles.
   */
  const designWork = useQuery({ queryKey: ["design-work"], queryFn: () => fDesignWork() });

  // The bet keeps whichever bucket it is already in. `commitRoadmapItem` also
  // powers the commit-to-Now path, so passing the current bucket is what stops
  // declaring a promise from silently re-homing work into Now.
  const declare = useMutation({
    mutationFn: (v: {
      id: string;
      bucket: "now" | "next" | "later";
      outcome: string;
      measure: string;
    }) => fCommit({ data: v }),
    onSuccess: (_r, v) => {
      setDeclaring(null);
      setRefused(null);
      setReceipt({ title: declaring?.title ?? "The bet", outcome: v.outcome });
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (e: Error, v) => {
      // The ceremony comes down so the reason is readable, and the words the
      // person typed ride out with it. The success receipt is cleared in the
      // same beat: two receipts about one bet, one of them stale, is the
      // contradiction this station keeps being repaired for.
      setRefused({
        bet: {
          id: v.id,
          title: declaring?.title ?? "The bet",
          outcome: v.outcome,
          measure: v.measure,
        },
        reason: e.message,
      });
      setDeclaring(null);
      setReceipt(null);
    },
  });

  /**
   * THE STATION WHOSE PRODUCT IS A SPEC COULD NOT START ONE.
   *
   * THE GAP, and it is this repo's signature defect with the sentence pointing
   * the wrong way. The Empty below told a first-time reader "Commit a bet and
   * Scribe drafts the first one, cited, in about five minutes", which sends
   * them to press a button on THIS page and wait for something that never
   * arrives. Both commit paths here call `commitRoadmapItem`, whose handler
   * writes roadmap_bucket / roadmap_outcome / roadmap_measure and calls
   * `recordRoadmapDecision`, and nothing else. No reactor picks it up either:
   * nothing anywhere handles an opportunity-committed event. And the name was
   * wrong in passing: `agentDisplayName("prd-writer")` is "Draft", which is what
   * the context rail on this same page prints.
   *
   * `generatePrd` is the only writer of a spec from a bet in the product, and
   * before this it was imported by exactly two files: /decide and
   * DiscoverSurface. So the one station that exists to produce a spec was the
   * one place you could not ask for one.
   *
   * IT TAKES A BET AND NOTHING ELSE, which is why this is one mutation rather
   * than a feature. `{ opportunity_id }` is the whole argument, and the handler
   * carries its own duplicate guard: a bet that already has a spec returns that
   * spec with `existing: true` rather than paying for a second one. So the
   * worst case for a bet whose spec sits outside `listSpecs`' 300-row cap is a
   * navigate to the spec it already had, never a duplicate.
   */
  const fDraftSpec = useServerFn(generatePrd);
  const [draftRefused, setDraftRefused] = React.useState<{
    title: string;
    reason: string;
  } | null>(null);
  const draftSpec = useMutation({
    // The title rides along so the indicator and the failure line can name the
    // bet without a second lookup, and can still name it after the list moves.
    mutationFn: (v: { id: string; title: string }) =>
      fDraftSpec({ data: { opportunity_id: v.id } }),
    onSuccess: (r) => {
      setDraftRefused(null);
      void qc.invalidateQueries({ queryKey: ["prds"] });
      // `generatePrd`'s placement step touches `roadmap_bucket`, and it declines
      // only for a bet that already carries a lane, which is every bet this door
      // is offered for. The board is re-read rather than assumed either way.
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
      // No success receipt: this navigates to the spec it just wrote, and
      // arriving at the artifact is a stronger receipt than a line about it.
      // The same rule /decide's "Keep it" follows, to the same destination.
      void navigate({
        to: "/plan/spec/$id",
        params: { id: r.prd.id },
        search: { tab: "contract" },
      });
    },
    onError: (e: Error, v) => setDraftRefused({ title: v.title, reason: e.message }),
  });

  const items = React.useMemo(() => roadmap.data?.items ?? [], [roadmap.data]);
  const committed = React.useMemo(() => items.filter((i) => i.bucket !== null), [items]);
  const nowCount = committed.filter((i) => i.bucket === "now").length;
  // A bet in a bucket with no outcome and no measure is the one thing on this
  // surface that genuinely needs a person. The count is the server's own.
  const undeclared = React.useMemo(
    () => committed.filter((i) => !isCommitmentGoverned(i)),
    [committed],
  );

  const specList = React.useMemo(() => specs.data?.prds ?? [], [specs.data]);
  // Keyed by spec id. Absent means "the design station's list does not cover
  // this spec", which is not the same as "nothing is drawn" and never renders
  // as though it were.
  const designByPrd = React.useMemo(() => {
    const m = new Map<string, DesignWorkRow>();
    for (const r of designWork.data?.items ?? []) m.set(r.prdId, r);
    return m;
  }, [designWork.data]);
  // `workspaces.design_stage_enabled`. With the station off for the workspace,
  // an undecided gate is not a call anybody owes, so the pending reminder below
  // is not owed either.
  const designStageOn = designWork.data?.stageEnabled ?? false;
  const betTitleById = React.useMemo(
    () => new Map(items.map((i) => [i.id, stripAutoPrefix(i.title)])),
    [items],
  );
  /**
   * THE COVERAGE FACT, AND THE BETS IT IS SHORT BY.
   *
   * Of the bets the team is building right now, how many have a spec written
   * for them. Derived from two reads the page already makes, so it costs
   * nothing and answers what a planner would otherwise open eight specs to
   * find out.
   *
   * IT USED TO RETURN THE COUNT ALONE, which is the half a person can read and
   * not the half they can act on: it said "3 of 7 bets in Now have a spec
   * written" and this surface offered nothing at all to do about the other
   * four. `uncovered` is those bets, and the first of them is what the door
   * inside the block acts on.
   */
  const nowCoverage = React.useMemo(() => {
    const specced = new Set<string>();
    for (const s of specList) if (s.opportunity_id) specced.add(s.opportunity_id);
    const nowBets = committed.filter((i) => i.bucket === "now");
    const uncovered = nowBets.filter((b) => !specced.has(b.id));
    return { withSpec: nowBets.length - uncovered.length, uncovered };
  }, [committed, specList]);
  const nowWithSpec = nowCoverage.withSpec;
  /** The bet the draft door acts on: the FIRST bet in Now that no spec serves.
   *  No ranking is claimed for it in the copy, because `getRoadmap` orders by
   *  `ice_score` descending and Postgres puts NULLS FIRST on a DESC order, so
   *  "the highest-ranked one" would stop being true the day a bet carries no
   *  score. It is named instead, which is the fact this page can prove. */
  const uncoveredNowBet = nowCoverage.uncovered[0] ?? null;

  const crew = (fleet.data?.fleet.agents ?? []).filter((a) => PLAN_AGENTS.includes(a.slug));

  const refRoadmap = React.useRef<HTMLDivElement>(null);
  const refSpecs = React.useRef<HTMLDivElement>(null);

  // Scroll the section up and move focus to it, so keyboard and screen-reader
  // users land there too. The three retired views have no section to scroll to
  // and are answered by the moved-view line above instead, which is why this
  // still returns early on them rather than guessing at a nearest section.
  const go = React.useCallback((v: PlanView) => {
    const el = v === "roadmap" ? refRoadmap.current : v === "specs" ? refSpecs.current : null;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start" });
      el.focus({ preventScroll: true });
    });
  }, []);

  // Honor the deep link. The board loads async and grows the page after the
  // first scroll, so the scroll re-asserts once the layout has settled.
  React.useEffect(() => {
    if (!view) return;
    go(view);
    const settle = window.setTimeout(() => go(view), 450);
    return () => window.clearTimeout(settle);
  }, [view, go]);

  /**
   * WHETHER THIS PAGE HAS AN ANSWER ABOUT THE ROADMAP AT ALL.
   *
   * The head below guarded on `roadmap.isLoading` alone, and a head that has no
   * answer must not state one. With no `data`, `items` is [] and every count
   * falls to 0, so a FAILED roadmap read printed "Nothing is committed yet." as
   * a fact while RoadmapColumns, forty pixels lower, correctly rendered <Failed>
   * with a retry: the same head-contradicts-board defect this station was just
   * repaired for, running in the other direction. The board owns the failure and
   * the retry, so the head claims no count rather than printing a second copy of
   * the error.
   *
   * THE TWO CLAUSES MIRROR THE BOARD'S TWO NON-DRAWING BRANCHES EXACTLY, which is
   * the only way the head can be provably consistent with it: `roadmap.isError`
   * is RoadmapColumns' <Failed>, and `stillWaiting` is its skeleton. Both files
   * read the one ["roadmap"] cache entry, so whenever the board declines to draw,
   * the head declines to count.
   *
   * `stillWaiting` rather than `isLoading` because react-query v5 defines
   * `isLoading` as `isPending && isFetching`, which is FALSE for a query that is
   * pending but not in flight (src/lib/query-state.ts). Three states have no
   * answer to give — fetching, pending-but-not-fetching, and failed — and
   * `isLoading` was only the first.
   *
   * `roadmap.isError` CARRIES THE THIRD ON ITS OWN, and since 2026-08-11 it is
   * the ONLY thing carrying it. `stillWaiting` used to return true for ever after
   * a failed read, purely as a side effect of `data` staying undefined; it was
   * fixed to stand down on failure, because that accident was leaving `<Failed>`
   * sentences unreachable on other surfaces. Here the accident had been doing
   * useful work, so this clause went from belt-and-braces to load-bearing on the
   * same day. Delete it as redundant and "Nothing is committed yet." returns as a
   * statement of fact over a read that refused, which is the defect in the first
   * paragraph.
   *
   * THIS COMMENT USED TO CLAIM THE OPPOSITE OF WHAT THE LINE DOES, and the claim
   * was never true: it said the head "keeps a head that DOES hold rows stating
   * them through a failed background refetch". It does not. v5 keeps `data`
   * through a failed refetch and sets `isError`, and `isError` is the FIRST
   * clause, so the head blanks to "Plan" while the rows are still in hand.
   *
   * That is the deliberate cost of the mirror above, not an oversight. The board
   * blanks in exactly the same state — RoadmapColumns tests `roadmap.isError`
   * before anything else — so the head and the board still agree, which is the
   * invariant this whole comment is built on and the one worth keeping. Stating
   * counts through a failed refetch would be BETTER product and it cannot be done
   * here alone: it needs both files to distinguish "errored with rows in hand"
   * from "errored with nothing", and one of them changing on its own reopens the
   * head-contradicts-board defect this station was repaired for twice.
   */
  const roadmapUnknown = roadmap.isError || stillWaiting(roadmap);

  // The head is a fact assembled from real counts, never a slogan. It claims
  // no number it does not have.
  const headline: React.ReactNode = React.useMemo(() => {
    if (roadmapUnknown) return "Plan";
    if (committed.length === 0) {
      // "COMMITTED" MEANT TWO THINGS ONE CLICK APART. Decide tagged bets
      // "committed" from opportunities.status while this headline read "Nothing
      // is committed yet" from roadmap_bucket, and both were right about their
      // own column. The interesting fact is not that the roadmap is empty, it is
      // that somebody committed to work and never placed it, which is the exact
      // thing this station exists to catch. Say that rather than "nothing".
      //
      // RE-MEASURED THROUGH THE LOVABLE MCP ON 2026-08-06. Of 294 opportunities,
      // 36 read 'committed' and 10 read 'now' — 46 decided bets — and exactly 1
      // carries a lane: `60000000-0b00-4000-8000-000000000001`, bucket 'next',
      // in Helio Labs. So 45 decided bets sit in no lane, across 13 of the 21
      // workspaces. `getRoadmap` applies no workspace filter
      // (roadmap.functions.ts:85-90, RLS-wide, capped at 300), so both counts
      // span every workspace the caller belongs to.
      //
      // WHICH MAKES THIS BRANCH CONDITIONAL, AND THE LINE THAT STOOD HERE SAID
      // OTHERWISE. It read "0 lanes anywhere means `committed` is empty for every
      // caller, so this is the branch /plan takes today", which was true of the
      // database it was measured against and stopped being true 15 minutes after
      // it was committed, when the first bet was placed. A caller who can reach
      // that placed bet has a non-empty `committed` and takes the branch below
      // instead ("Nothing is in Now. 1 is lined up behind."); every caller who
      // cannot still lands here. Both are correct — only the prose claiming one
      // of them was universal was wrong. The load-bearing pair is 46 decided
      // against 45 of them lane-less, not the denominator and not the zero.
      //
      // THE PREDICATE AND THE WORD ARE SHARED WITH THE BOARD ON PURPOSE, and
      // that sharing is the fix. RoadmapColumns' `unplacedDecided` filters on
      // the byte-identical `status === "committed" || status === "now"` and
      // calls the set "committed" in its own copy. Ten of the 46 are status
      // 'now', so the word is loose on both surfaces in the SAME way: change it
      // on one and it must change on the other in the same commit, or the head
      // and the board start contradicting each other again.
      const decided = items.filter((i) => i.status === "committed" || i.status === "now").length;
      if (decided > 0) {
        // <Num> like every other numeral on this page. This was the one count on
        // /plan set as plain text: the two sibling branches below both wrap
        // theirs, and so does the board's mirroring copy in RoadmapColumns'
        // second empty branch, which is the same sentence's other half. `Num`'s
        // contract is "EVERY NUMBER, DURATION, COUNT, IDENTIFIER AND TIMESTAMP.
        // AND NOTHING ELSE" (`Num` in components/meridian/surface-parts; it was
        // shell/primitives until the Meridian port). `headline` is typed
        // React.ReactNode and PageHeading renders it, so this costs nothing.
        return decided === 1 ? (
          "One bet is committed but sits in no lane."
        ) : (
          <>
            <Num>{decided}</Num> bets are committed but sit in no lane.
          </>
        );
      }
      return "Nothing is committed yet.";
    }
    const behind = committed.length - nowCount;
    const lead =
      nowCount === 0 ? (
        <>Nothing is in Now.</>
      ) : nowCount === 1 ? (
        <>One bet is in Now.</>
      ) : (
        <>
          <Num>{nowCount}</Num> bets are in Now.
        </>
      );
    if (behind === 0) return lead;
    return (
      <>
        {lead} <Num>{behind}</Num> {behind === 1 ? "is" : "are"} lined up behind.
      </>
    );
    // `items` IS LOAD-BEARING HERE AND WAS MISSING. `decided` above is computed
    // from `items`, but this list read only `committed.length` and `nowCount` —
    // and in the live shape those are BOTH PINNED AT 0, because no opportunity
    // anywhere carries a lane. So every refetch that changed the decided count
    // without placing anything (Discover promoting one more bet, a bet being
    // killed) left this head printing a stale number while RoadmapColumns, which
    // recomputes `unplacedDecided` on every render off the same ["roadmap"]
    // cache entry, printed the new one: the exact head-versus-board
    // contradiction this pass exists to close, reopening on the next write.
  }, [roadmapUnknown, items, committed.length, nowCount]);

  const shownSpecs = showAllSpecs ? specList : specList.slice(0, VISIBLE_SPECS);

  return (
    <Surface
      wide
      context={
        crew.length ? (
          /* THE COLUMN STATES ITS OWN SPACING NOW. `.sp-ctx-head` carried an
             11px margin under the heading and `.sp-ctx-row` a 1px rule between
             rows; Meridian's `CtxHead` and `CtxRow` set neither, on purpose, so
             the composition says it. Same shape the ported Learn column uses. */
          <div className="flex flex-col gap-mrd-4">
            <CtxHead>Who works the plan</CtxHead>
            {crew.map((a) => {
              const last = ago(a.lastActiveAt);
              return (
                <CtxRow
                  key={a.slug}
                  mark={<AgentMark slug={a.slug} name={a.name} state={markState(a.state)} />}
                  name={agentDisplayName(a.slug, a.name)}
                  sub={
                    a.running > 0 ? (
                      <>
                        working on <Num>{a.running}</Num>
                      </>
                    ) : last ? (
                      <>
                        last worked <Num>{last}</Num> ago
                      </>
                    ) : (
                      "has not run here yet"
                    )
                  }
                />
              );
            })}
          </div>
        ) : null
      }
    >
      {/* ONE STACK, ONE GAP. See the note in `errorComponent`: `Region` sets no
        outer space, so the surface states it once here instead of every region
        drawing its own rule and margin. */}
      <div className="flex flex-col gap-mrd-7">
        {/* THE AUTONOMOUS PATH, VISIBLE, ON THE SURFACE A PERSON ACTUALLY READS.
          This mount existed only inside `errorComponent` above, so the crew
          line appeared on Plan exactly when the station had CRASHED and never
          when it was working — the one branch where an agent's sentence is
          least useful. The context rail beside this already says "working on
          N" per agent, which is a COUNT; this says the sentence the running
          mission is on. Renders nothing unless an agent is genuinely mid-run.
          See use-live-agents.ts. */}
        <CrewWorking station="define" />
        <PageHeading
          title={headline}
          sub="Every bet names the outcome it promises and how that outcome gets measured."
        />

        {/* WHAT THE LINK ASKED FOR, WHEN IT IS NOT HERE ANY MORE. Above the Gate
        on purpose: a person who followed `/stakeholder` or a bookmarked
        `?view=goals` is not looking at this station yet, they are looking for
        the thing they came for, and answering that has to happen before the
        station asks them anything. It is one Line rather than a Gate, because
        nothing here is waiting on them: it is a redirection, not a decision.
        See `MOVED_VIEWS`. */}
        {view && MOVED_VIEWS[view] ? (
          <Line label={MOVED_VIEWS[view].what} sub={MOVED_VIEWS[view].why}>
            <Door onClick={() => void navigate({ to: MOVED_VIEWS[view].to })}>
              {MOVED_VIEWS[view].door}
            </Door>
          </Line>
        ) : null}

        {/* THE STAKE BELONGS ABOVE THE LIST, NOT INSIDE IT (2026-08-11).
          The lines used to hold three bet titles AND a fourth entry explaining
          what happens if they stay undeclared. Two different kinds of thing
          wearing the same bullet: a reader scanning the list hits three names
          and then a paragraph of consequence, and has to work out that the
          last one is not a fourth bet.
          Every shipped product doing this pattern separates them the same way.
          Turo's "Next steps" puts "Complete the required steps to avoid
          cancellation" under the title and keeps the list to steps; Whop,
          Airtasker and Square all do the equivalent. The stake is said once,
          above, and the list stays one kind of object.
          The question also carries the count now, which the old lines only
          revealed in their fourth entry, and which matters because the list is
          capped at three. */}
        {undeclared.length > 0 ? (
          <Gate
            question={
              undeclared.length === 1
                ? "What does success look like for this bet?"
                : `What does success look like for these ${undeclared.length} bets?`
            }
            /* THE STAKE STAYS ABOVE THE LIST AND STOPS SHOUTING (2026-08-11, same
             day as the note above).
             `sp-gate-what-label` is a CAPTION: mono, uppercase, letter-spaced
             (primitives.css). Two sentences and 132 characters in that slot wrap
             to two full-width lines of capitals directly under the question, and
             measured at the filming width they outweighed the bet name they are
             a caption for, which is the one object in this Gate a person has to
             read. The fix is the sentence, not the slot: the middle clause
             ("until one is named, a bet is only a task") restates the first
             clause in other words, so cutting it loses no fact and takes the
             caption to one line. Both halves of the point survive: the state,
             and what the state costs. */
            linesLabel="Committed, with no outcome and no measure. Nothing can tell you later whether it worked."
            lines={undeclared.slice(0, 3).map((b) => (
              <span key={b.id}>{stripAutoPrefix(b.title)}</span>
            ))}
          >
            {/* `Approve`, NOT `Action`, AND THIS IS THE ONE PLACE ON PLAN THAT
              EARNS IT. Meridian spends orchid on a single meaning — a person is
              required — and a Gate is the one shape where that is literally
              true of a button: the bet is committed and nothing downstream can
              grade it until somebody names the promise. Every other control on
              this station is chrome by that test. */}
            <Approve
              onClick={() =>
                setDeclaring({
                  id: undeclared[0].id,
                  title: stripAutoPrefix(undeclared[0].title),
                  outcome: undeclared[0].outcome ?? null,
                  measure: undeclared[0].measure ?? null,
                })
              }
            >
              {undeclared.length === 1
                ? "Declare the outcome"
                : `Declare the first of ${undeclared.length}`}
            </Approve>
          </Gate>
        ) : null}

        {/* What the declaration caused. A promise written down is a write with a
        consequence, so it earns a Receipt rather than vanishing into a toast
        (anti-slop.md 5). The consequence is the promise itself, because that
        is the thing that did not exist a moment ago and now does. */}
        {receipt ? (
          <Receipt
            verb="You wrote the promise"
            consequence={
              <>
                {receipt.title} now promises {receipt.outcome}, and Learn can grade it.
              </>
            }
          />
        ) : null}

        {/* AND THE OTHER HALF OF THE SAME WRITE, in the same place and the same
        shape, because a write that did not happen must never be silent on the
        surface where a write that did happen speaks. The reason is the
        server's own words. The door beside it re-opens the ceremony holding
        what was typed, so a refusal costs a press rather than the sentence.
        See `refused`. */}
        {refused ? (
          <>
            <Receipt
              failed
              verb="The promise was not written"
              // "Unchanged" rather than "still carries no outcome and no
              // measure": `isCommitmentGoverned` is false when EITHER half is
              // blank, so a bet reaching the Gate can already have one of the
              // two, and naming both would be wrong for that bet. What is true
              // of every refusal is that the row did not move.
              consequence={
                <>
                  {refused.bet.title} is unchanged on the board, and it still carries no declared
                  promise. {refused.reason}
                </>
              }
            />
            <Actions>
              <Action
                onClick={() => {
                  setDeclaring(refused.bet);
                  setRefused(null);
                }}
              >
                Try it again
              </Action>
            </Actions>
          </>
        ) : null}

        {declaring ? (
          <CommitCeremony
            bet={declaring}
            pending={declare.isPending}
            onCancel={() => setDeclaring(null)}
            onConfirm={(values) => {
              const bet = items.find((i) => i.id === declaring.id);
              declare.mutate({
                id: declaring.id,
                // Its CURRENT bucket, never "now". Declaring a promise must not
                // move work into flight that nobody scheduled.
                bucket: (bet?.bucket ?? "next") as "now" | "next" | "later",
                outcome: values.outcome,
                measure: values.measure,
              });
            }}
          />
        ) : null}

        {/* THE ENTRY THAT DID NOT EXIST. Work on a product you already run has no
        signal and no theme behind it, so it has no lineage root, so until the
        track object there was nothing in the product that could even name it.
        It enters here, and it arrives carrying which stations it will visit and
        which it waives. Above the roadmap because starting work precedes
        scheduling it.

        ITEM 4'S HALF (request 020, seam landed by LANE 0 in `9242664aa`):
        creating a track now LANDS the person on it at the watchable address,
        with `?start=true` so the first walk fires on arrival exactly as /start
        does: one action, and what you watched begin is one click back. The
        inline reveal still runs first (the component sets its state before
        calling onCreated), so a browser Back returns to /plan with the started
        track expanded in place; the flag is harmless on any revisit
        (TrackRun's drivenAt guard). */}
        <TrackStart
          onCreated={(track) => {
            void navigate({
              to: "/track/$trackId",
              params: { trackId: track.id },
              search: { start: true },
            });
          }}
        />

        {/* THE DOOR FOR THE COUNT IN THE HEAD IS INSIDE THIS BLOCK, NOT BESIDE THE
        HEAD, AND THAT IS DELIBERATE.

        When no bet carries a lane the head above reads "N bets are committed but
        sit in no lane." and RoadmapColumns' second empty branch names the
        highest-ranked one and offers "Place it in Now". That button calls the
        same `handleMove(item, "now")` a card calls, so a promise declared from
        the empty state and one declared from the board are one code path and
        cannot drift. Both surfaces read this one ["roadmap"] cache entry, and in
        that state no bet has a lane at all, so the head's `decided` and the
        board's `unplacedDecided.length` are the same number by construction
        rather than by coincidence.

        DO NOT ADD A SECOND DOOR BESIDE THE HEAD. In that state the Gate is empty
        (it reads `undeclared` out of the BUCKETED bets, which is the empty set
        here) and TrackStart's primary mounts only once its own form is opened,
        so on arrival the board's button is the only primary on the station —
        which is the argument RoadmapColumns writes down at its own empty branch.
        A primary up here would be the second one on the page and would falsify
        that comment in the same stroke. */}
        <div ref={refRoadmap} id="plan-section-roadmap" tabIndex={-1} className="outline-none">
          <Region title="Now, Next and Later">
            <RoadmapColumns />
          </Region>
        </div>

        {/* THE SAME QUESTION THE ROADMAP HEAD ASKS, ASKED THE SAME WAY. This read
        `specs.isLoading` while `roadmapUnknown` two hundred lines above had
        already been widened to `stillWaiting`, and one guard fixed in a file is
        not a guard: v5's `isLoading` is `isPending && isFetching`, so for a
        query that is pending but not in flight it is FALSE, the wait stands
        down, `specList` is [] and the Empty below tells a database holding 81
        specs (measured 2026-08-06) that it has none. That is the /discover
        first-frame defect again, on the second of this station's two lists.

        `!specs.isError` WAS LOAD-BEARING AND IS NOW BELT AND BRACES, and it is
        staying. Until 2026-08-11 `stillWaiting` was
        `isPending || data === undefined`, which is TRUE for ever after a cold
        failure, so without this clause the <Failed> branch inside the Block was
        unreachable and a failed read sat under a permanent wait with no retry on
        it. The helper now stands down on a failed read, so the clause no longer
        does that work by itself.

        IT IS NOT TIDIED AWAY BECAUSE IT COSTS NOTHING AND THE ALTERNATIVE COSTS
        A SURFACE. Deleting it makes this wait's correctness depend entirely on
        a helper in another file continuing to behave a particular way, and that
        helper's behaviour has now changed once. RoadmapColumns solves the same
        collision by ordering its <Failed> above its skeleton; here the error
        branch lives INSIDE the block below, so the exclusion is written into the
        wait instead. */}
        {!specs.isError && stillWaiting(specs) ? (
          <Reading>Reading the specs.</Reading>
        ) : (
          <div ref={refSpecs} id="plan-section-specs" tabIndex={-1} className="outline-none">
            <Region
              title="Specs"
              // A different fact from the title, and the one a planner came for.
              sub={
                draftSpec.isPending ? (
                  // A GREYED BUTTON IS NOT A SIGN OF LIFE, and this is the
                  // longest-running act on the station: `generatePrd` is three
                  // chokepoint calls (a title, the body, then the outcome
                  // contract) with a retrieval pass between them. The detail is
                  // the bet, a noun this surface already read, never a guess at a
                  // step.
                  //
                  // IT NAMES THE WORK AND NOT THE WORKER, which is the same
                  // choice /decide's copy of this indicator makes for the same
                  // call. `generatePrd` goes through `callModel` and writes no
                  // `agent_runs` row, and the context rail beside this reads
                  // exactly that table: a label saying "Draft is writing the
                  // spec" would sit one column away from "Draft has not run here
                  // yet" and one of them would be wrong.
                  <AgentPulse
                    label="Drafting the spec"
                    seed="prd-writer"
                    compact
                    detail={draftSpec.variables?.title}
                  />
                ) : nowCount > 0 && !specs.isError ? (
                  <>
                    <Num>{nowWithSpec}</Num> of the <Num>{nowCount}</Num> bets in Now have a spec
                    written.
                  </>
                ) : undefined
              }
              /* THE CAP'S WAY PAST IT IS NOT IN THIS HEAD ANY MORE, AND THAT IS
               THE ONE THING `Region` REFUSES TO TAKE. `Block`'s `more` slot was
               serving two different controls and Meridian split it by name:
               `goTo` leaves the region, `toggle` discloses something inside it,
               `act` does something — and a REVEAL PAST A CAP gets no prop at
               all, deliberately. The measured reason is Brain's: a shelf capped
               at six put "Show all 14" in the region heading, ABOVE the rows the
               reader had not reached yet, so the way past the cap was announced
               before the cap and the only place the real total appeared was an
               offer to see more of a list nobody had started reading.

               It is the same defect here in the same shape. The reveal now sits
               UNDER the last row, where a reader arrives having actually hit the
               limit, and it states both real numbers rather than only the
               remainder. `RecordsTable` answers a cap the same way, so the two
               places in the product that cap a list now say so identically. */
            >
              {/* THE DOOR THE COVERAGE LINE NEVER HAD. The sub above counts the
              bets in Now that HAVE a spec, against the bets in Now; this names
              one of the ones left over and writes it. Without this the fact was
              a scoreboard on the one station whose stated product is the thing
              being counted.

              `!specs.isError` IS THE GUARD AND IT IS LOAD-BEARING. On a failed
              spec read `specList` is [] and every bet in Now looks uncovered,
              so this would offer to draft a spec for work that already has one.
              A read whose error is discarded is never evidence of absence. The
              wait is handled above, by the branch that keeps this whole block
              off screen until the specs answer. */}
              {uncoveredNowBet && !specs.isError ? (
                <Line
                  label={stripAutoPrefix(uncoveredNowBet.title)}
                  sub="In Now with no spec. Draft reads the bet, writes the spec against what the record already holds, cites it, and this lands you on it."
                >
                  <Action
                    busy={draftSpec.isPending}
                    onClick={() =>
                      draftSpec.mutate({
                        id: uncoveredNowBet.id,
                        title: stripAutoPrefix(uncoveredNowBet.title),
                      })
                    }
                  >
                    {draftSpec.isPending ? "Drafting" : "Draft the spec"}
                  </Action>
                </Line>
              ) : null}

              {/* A draft that did not happen never wears the shape of one that
              did. Success navigates to the spec, so only the failure speaks
              here. */}
              {draftRefused ? (
                <Receipt
                  failed
                  verb="No spec was written"
                  consequence={
                    <>
                      {draftRefused.title} still has none. {draftRefused.reason}
                    </>
                  }
                />
              ) : null}

              {specs.isError ? (
                // The LINE half of the failed-read pair. This sits under a region
                // heading that already frames it, and the standard caps a region
                // at one bordered box.
                <ReadFailedLine onRetry={() => void specs.refetch()} error={specs.error}>
                  {(specs.error as Error)?.message ?? "The specs did not load."}
                </ReadFailedLine>
              ) : specList.length === 0 ? (
                // THE SENTENCE THAT SENT PEOPLE NOWHERE. It read "Commit a bet and
                // Scribe drafts the first one, cited, in about five minutes", and
                // committing a bet writes no spec: `commitRoadmapItem` sets the
                // lane, the outcome and the measure and stops. The agent's name is
                // Draft, not Scribe, which is what the context rail on this same
                // page prints. Both halves are corrected, and the door is named
                // rather than described. See `draftSpec`.
                <NothingYet
                  action={
                    <Action onClick={() => void navigate({ to: "/decide" })}>Open Decide</Action>
                  }
                >
                  No specs yet, and committing a bet here does not write one: a commit sets the
                  lane, the outcome and the measure, and stops. A spec is written when you keep a
                  bet on Decide, where "Keep it" runs Draft and lands you on what it wrote. Any bet
                  already sitting in Now can be drafted from the line above, and the crew will draft
                  one on request.
                </NothingYet>
              ) : (
                shownSpecs.map((spec) => {
                  const specTitle = stripAutoPrefix(spec.title);
                  /**
                   * THE JOIN IS ONLY A FACT WHEN IT NAMES SOMETHING THE LEAD DOES
                   * NOT.
                   *
                   * `generatePrd` titles a spec from the bet it was written for,
                   * so the two strings are frequently the same one. The row then
                   * read "Skip the address re-confirm when nothing changed" on the
                   * lead and "Approved · serves Skip the address re-confirm when
                   * nothing changed" underneath it: the title printed twice, one
                   * line apart, which reads as a rendering fault rather than as a
                   * relationship. This file's own rule for a row is "its title
                   * plus one DIFFERENT fact", and a restatement is not one.
                   *
                   * Compared case-insensitively and trimmed because the two
                   * strings travel through different writers (`stripAutoPrefix`
                   * here, the model's own casing there) and an incidental capital
                   * is not a different bet. When they genuinely differ the suffix
                   * is unchanged, which is every row where it was earning its
                   * place.
                   */
                  const betTitle = spec.opportunity_id
                    ? betTitleById.get(spec.opportunity_id)
                    : null;
                  const bet =
                    betTitle && betTitle.trim().toLowerCase() !== specTitle.trim().toLowerCase()
                      ? betTitle
                      : null;
                  const settled = spec.status === "approved" || spec.status === "shipped";
                  /**
                   * THE DESIGN SUFFIX REPORTS A ROW OR IT SAYS NOTHING.
                   *
                   * WHAT WAS WRONG. It used to read `· design pending` on every
                   * unsettled spec, because the condition was only
                   * "design_gate_status is truthy" and `prds.design_gate_status`
                   * is `not null default 'pending'`
                   * (supabase/migrations/20260708170000_sw4_design_station.sql:16),
                   * so the column was never empty and the suffix never absent.
                   * Re-measured through the Lovable MCP on 2026-08-06: 81 specs,
                   * of which 42 are approved and 14 shipped, so 25 are unsettled -
                   * and all 25 carried a label. Exactly 2 of the 25 have anything
                   * drawn, so 23 of 25 announced a design step that nothing had
                   * ever been drawn for.
                   *
                   * THE TWO DRAWN ONES ARE NOT INTERCHANGEABLE, and the difference
                   * is what makes "the single live spec that owes a design call"
                   * below add up rather than contradict the 2. Same read: one is
                   * "Bank-link drop-off at activation", whose gate a human has
                   * already APPROVED, so it takes the verdict branch; the other is
                   * spec …021 below, still pending. Two drawings, one outstanding
                   * call.
                   *
                   * WHAT THOSE 23 ARE NOT. They are not specs anybody routed past
                   * Design. The route picker has never been used in this database:
                   * `stage_events where entity_type = 'spec' and to_stage in
                   * ('design_skipped','design_requested')` returns 0 rows, on the
                   * same 2026-08-06 read. The label was announcing a column
                   * default, which is the whole defect - and the deliberate skip
                   * the picker records, the case this row now CAN name, has no
                   * live instance yet to name.
                   *
                   * src/lib/build/design-gate.ts already ruled on this exact
                   * default for dispatch: an unmade drawing does not block. This
                   * list is that ruling applied to what the list SAYS. Every word
                   * below rests on a row that exists:
                   *   'approved' / 'rejected'  a human settled the gate
                   *                            (`decideDesignGate`).
                   *   skipped on purpose       a `design_skipped` stage event,
                   *                            written by the route picker.
                   *   pending                  a `prd_scaffolds` row exists and no
                   *                            verdict has been written, so the
                   *                            call is genuinely outstanding.
                   * 'pending' with nothing drawn is the value nobody wrote. It is
                   * not a fact and it still gets no words.
                   *
                   * THE ORDER IS THE ORDER OF THE EVIDENCE: a written verdict
                   * beats a recorded skip beats a drawing waiting on a call.
                   * Those first two ranks are the two the chain of custody
                   * applies as well (`assembleChain`,
                   * src/lib/trust-chain.functions.ts), so a spec cannot get one
                   * answer here and a different one there. The chain has a fourth
                   * rank this row does not: it SAYS "nothing was drawn" where this
                   * row stays silent, because a chain link owes an account of
                   * every station and a one-line list row does not.
                   *
                   * THE RESTORED CASE. Spec 60000000-0001-4000-8000-000000000021
                   * ("Comet: a focus timer that plans your day") is draft, its
                   * gate is untouched, and it has one drawing - the single live
                   * spec that genuinely owes a design call. The first pass at this
                   * fix dropped its reminder along with the 23 false ones, because
                   * `listSpecs` could not tell it apart from them. Reading
                   * `listDesignWork` above tells them apart, so the reminder is
                   * back on the one row where it was always true.
                   *
                   * WHEN IT SAYS NOTHING, AND WHY THAT IS SAFE. Every new word
                   * needs a row the design read actually returned. While that
                   * query is loading, if it fails, or for a spec outside its
                   * window (40 by `updated_at`, default workspace only - see the
                   * query), the row falls back to exactly today's behaviour: the
                   * verdict from `listSpecs` if there is one, otherwise silence.
                   * An absent design row is never read as "nothing was drawn".
                   */
                  const designGateStatus = (spec as { design_gate_status?: string | null })
                    .design_gate_status;
                  // The column's check constraint is ('pending','approved','rejected')
                  // (supabase/migrations/20260708170000_sw4_design_station.sql:17),
                  // so these two are the whole set of human verdicts. Anything
                  // else, 'pending' included, is not one.
                  const designWord =
                    designGateStatus === "approved"
                      ? "approved"
                      : designGateStatus === "rejected"
                        ? "rejected"
                        : null;
                  const designRow = designByPrd.get(spec.id) ?? null;
                  // `gateStatus` is re-checked from the design read rather than
                  // trusted from `designWord` alone: the two queries resolve at
                  // different moments, and a reminder for a call somebody just
                  // made would be the old defect in miniature.
                  const designOwed =
                    designStageOn && !!designRow?.drawing && designRow.gateStatus === "pending";
                  const withDesignStatus = settled
                    ? ""
                    : designWord
                      ? ` · design ${designWord}`
                      : designRow?.route?.route === "direct"
                        ? ` · design ${DESIGN_SKIPPED_ON_PURPOSE}`
                        : designOwed
                          ? " · design pending"
                          : "";
                  return (
                    <Row
                      key={spec.id}
                      tight
                      // Dim means settled, normal means still moving. The station's
                      // agent, monochrome: ember is reserved for what wants you.
                      marks={<AgentMark slug="prd-writer" state={settled ? "quiet" : "idle"} />}
                      lead={specTitle}
                      // One line, one different fact: where the spec has got to,
                      // which bet it is, and - only when some row says so - what
                      // happened at the design gate.
                      sub={
                        bet
                          ? `${specStateWords(spec.status)} · serves ${bet}${withDesignStatus}`
                          : `${specStateWords(spec.status)}${withDesignStatus}`
                      }
                      time={ago(spec.updated_at)}
                      onClick={() =>
                        void navigate({
                          to: "/plan/spec/$id",
                          params: { id: spec.id },
                          search: {},
                        })
                      }
                    />
                  );
                })
              )}

              {/* THE ARITHMETIC UNDER THE LAST ROW, with the way out beside it.
              Never rendered while the list is failed or empty, because those two
              branches replace the rows entirely and a cap notice under an error
              would be counting something nobody can see. */}
              {!specs.isError && specList.length > VISIBLE_SPECS ? (
                <Line
                  label={
                    <>
                      Showing <Num>{shownSpecs.length}</Num> of <Num>{specList.length}</Num> specs.
                    </>
                  }
                >
                  <Door onClick={() => setShowAllSpecs((v) => !v)}>
                    {showAllSpecs
                      ? `Show ${VISIBLE_SPECS} again`
                      : `Show the other ${specList.length - VISIBLE_SPECS}`}
                  </Door>
                </Line>
              ) : null}
            </Region>
          </div>
        )}
      </div>
    </Surface>
  );
}
