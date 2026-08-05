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
 * URL CONTRACT. `?view=` still validates all five legacy values, so /roadmap,
 * /prds and /stakeholder never 404. `roadmap` and `specs` still scroll their
 * section into view and move focus to it. `stakeholders`, `goals` and `loops`
 * now land at the top of Plan; legacy-redirects.ts must be re-pointed once
 * those three panels have homes.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import type { FleetAgentState } from "@/lib/agent-fleet";
import { commitRoadmapItem, getRoadmap } from "@/lib/roadmap.functions";
import { isCommitmentGoverned } from "@/lib/roadmap-governance";
import { listSpecs } from "@/lib/discovery.functions";
import { stripAutoPrefix } from "@/components/plan/format";
import { RoadmapColumns } from "@/components/plan/RoadmapColumns";
import { TrackStart } from "@/components/spine/TrackStart";
import { CommitCeremony, type CommitCeremonyBet } from "@/components/plan/CommitCeremony";
import {
  AgentMark,
  Block,
  Button,
  CtxHead,
  CtxRow,
  Empty,
  Failed,
  Loading,
  Gate,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
  type MarkState,
} from "@/components/shell/primitives";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { CrewWorking } from "@/components/shell/CrewWorking";

/** The deep-linkable values. The union is a contract with the legacy redirects
 *  (/prds, /roadmap, /stakeholder), so it never shrinks even when a section
 *  leaves; only the anchors below change. */
const PLAN_VIEWS = ["goals", "loops", "roadmap", "specs", "stakeholders"] as const;
type PlanView = (typeof PLAN_VIEWS)[number];

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

/** prds.status in plain words. The retired list shouted these in mono caps
 *  ("CRITIC REVIEW"); a row's second line is a fact, not a chip. */
function specState(status: string): string {
  if (status === "shipped") return "Shipped";
  if (status === "approved") return "Approved";
  if (status === "review") return "In review";
  return "Drafting";
}

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
        {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
            genuinely mid-run, so it costs no space when the crew is idle and
            cannot show a step that did not happen. Every other pulse on this
            station is gated on a mutation the reader's own click started;
            this one is bound to the run. See use-live-agents.ts. */}
        <CrewWorking />
        <PageHead
          title="The plan did not load."
          sub={(error as Error)?.message ?? "No reason was reported."}
        />
        <Block>
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
        </Block>
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
  const fFleet = useServerFn(getAgentFleet);
  const fSpecs = useServerFn(listSpecs);

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
      setReceipt({ title: declaring?.title ?? "The bet", outcome: v.outcome });
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
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
  const betTitleById = React.useMemo(
    () => new Map(items.map((i) => [i.id, stripAutoPrefix(i.title)])),
    [items],
  );
  // The coverage fact: of the bets the team is building right now, how many
  // have had their promise written down. Derived from two reads the page
  // already makes, so it costs nothing and answers what a planner would
  // otherwise open eight specs to find out.
  const nowWithSpec = React.useMemo(() => {
    const nowIds = new Set(committed.filter((i) => i.bucket === "now").map((i) => i.id));
    const covered = new Set<string>();
    for (const s of specList) {
      if (s.opportunity_id && nowIds.has(s.opportunity_id)) covered.add(s.opportunity_id);
    }
    return covered.size;
  }, [committed, specList]);

  const crew = (fleet.data?.fleet.agents ?? []).filter((a) => PLAN_AGENTS.includes(a.slug));

  const refRoadmap = React.useRef<HTMLDivElement>(null);
  const refSpecs = React.useRef<HTMLDivElement>(null);

  // Scroll the section up and move focus to it, so keyboard and screen-reader
  // users land there too. The three retired views resolve to nothing and leave
  // the reader at the top of the plan rather than scrolling them nowhere.
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

  // The head is a fact assembled from real counts, never a slogan. It claims
  // no number it does not have.
  const headline: React.ReactNode = React.useMemo(() => {
    if (roadmap.isLoading) return "Plan";
    if (committed.length === 0) {
      // "COMMITTED" MEANT TWO THINGS ONE CLICK APART. Decide tagged two bets
      // "committed" from opportunities.status while this headline read "Nothing
      // is committed yet" from roadmap_bucket, and both were right about their
      // own column. Measured live: 2 bets with status 'committed', 0 with any
      // lane at all. The interesting fact is not that the roadmap is empty, it is
      // that somebody committed to work and never placed it, which is the exact
      // thing this station exists to catch. Say that rather than "nothing".
      const decided = items.filter((i) => i.status === "committed" || i.status === "now").length;
      if (decided > 0) {
        return decided === 1
          ? "One bet is committed but sits in no lane."
          : `${decided} bets are committed but sit in no lane.`;
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
  }, [roadmap.isLoading, committed.length, nowCount]);

  const shownSpecs = showAllSpecs ? specList : specList.slice(0, VISIBLE_SPECS);

  return (
    <Surface
      wide
      context={
        crew.length ? (
          <>
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
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub="Every bet names the outcome it promises and how that outcome gets measured."
      />

      {undeclared.length > 0 ? (
        <Gate
          question="What outcome do these bets promise?"
          lines={[
            ...undeclared
              .slice(0, 3)
              .map((b) => <span key={b.id}>{stripAutoPrefix(b.title)}</span>),
            <span key="consequence">
              <Num>{undeclared.length}</Num> committed{" "}
              {undeclared.length === 1 ? "bet carries" : "bets carry"} no outcome and no measure.
              Until one does, it is a task rather than a promise, and nothing can tell you later
              whether it worked.
            </span>,
          ]}
        >
          <Button
            variant="primary"
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
          </Button>
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
        scheduling it. */}
      <TrackStart />

      <div ref={refRoadmap} id="plan-section-roadmap" tabIndex={-1} className="outline-none">
        <Block title="Now, Next and Later">
          <RoadmapColumns />
        </Block>
      </div>

      {specs.isLoading ? (
        <Loading>Reading the specs.</Loading>
      ) : (
        <div ref={refSpecs} id="plan-section-specs" tabIndex={-1} className="outline-none">
          <Block
            title="Specs"
            // A different fact from the title, and the one a planner came for.
            sub={
              nowCount > 0 && !specs.isError ? (
                <>
                  <Num>{nowWithSpec}</Num> of the <Num>{nowCount}</Num> bets in Now have a spec
                  written.
                </>
              ) : undefined
            }
            more={
              specList.length > VISIBLE_SPECS
                ? showAllSpecs
                  ? "Show fewer"
                  : `Show ${specList.length - VISIBLE_SPECS} more`
                : undefined
            }
            onMore={() => setShowAllSpecs((v) => !v)}
          >
            {specs.isError ? (
              <Failed onRetry={() => void specs.refetch()}>
                {(specs.error as Error)?.message ?? "The specs did not load."}
              </Failed>
            ) : specList.length === 0 ? (
              <Empty>
                No specs yet. Commit a bet and Scribe drafts the first one, cited, in about five
                minutes.
              </Empty>
            ) : (
              shownSpecs.map((spec) => {
                const bet = spec.opportunity_id ? betTitleById.get(spec.opportunity_id) : null;
                const settled = spec.status === "approved" || spec.status === "shipped";
                // Show design gate status if the spec is being designed (not yet approved).
                // Format: "Drafting · design pending" or "In review · design approved".
                const designGateStatus = (spec as { design_gate_status?: string | null })
                  .design_gate_status;
                const designWord =
                  designGateStatus === "approved"
                    ? "approved"
                    : designGateStatus === "rejected"
                      ? "rejected"
                      : "pending";
                const withDesignStatus =
                  spec.status !== "approved" && spec.status !== "shipped" && designGateStatus
                    ? ` · design ${designWord}`
                    : "";
                return (
                  <Row
                    key={spec.id}
                    tight
                    // Dim means settled, normal means still moving. The station's
                    // agent, monochrome: ember is reserved for what wants you.
                    marks={<AgentMark slug="prd-writer" state={settled ? "quiet" : "idle"} />}
                    lead={stripAutoPrefix(spec.title)}
                    // One line, one different fact: where the spec has got to,
                    // which bet it is, and (if drafting) design gate status.
                    sub={
                      bet
                        ? `${specState(spec.status)} · serves ${bet}${withDesignStatus}`
                        : `${specState(spec.status)}${withDesignStatus}`
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
          </Block>
        </div>
      )}
    </Surface>
  );
}
