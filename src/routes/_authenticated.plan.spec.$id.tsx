/**
 * The spec editor. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers. Pass
 * one ported it onto the primitives, which killed the second header and the
 * glass action bar and is kept. This pass decides what belongs on it at all,
 * because what pass one left was six tabs stacked on top of six always-on
 * blocks: the person on the Edit tab scrolled past their own document into
 * tasks, design readiness, a mockup, citations, provenance and an outcome
 * form. That is the pain point the founder named twice, on one page.
 *
 * 1. WHO IS HERE, AND WHY. A product lead with one spec open. They came to
 *    get its words right and hand it to the crew. Not to browse it, not to
 *    report on it: they leave when it is good enough to build.
 *
 * 2. THE ONE THING IT EXISTS FOR. To settle one spec and hand it off.
 *    Nowhere else in the product can you write this document's own words, and
 *    nowhere else does it become work.
 *
 * 3. KEEP / MOVE / KILL, on what pass one left standing:
 *    KEEP  the editable title, the textarea, the four assist actions, the six
 *          views, Save, Send to Build with its repo gate, Create GitHub issue,
 *          Capture as decision. Every one of these is where a decision about
 *          this spec is actually made.
 *    MOVE  Send to Build out of the action row and into "Where this spec goes
 *          next", because the handoff is a ROUTE and a lone button is not a
 *          choice. Founder, 2026-08-02: "the PRDs/ARDs/FRDs are properly scoped
 *          and then passed to design. Design creates a prototype mockup, and
 *          from there it moves to build. There may be scenarios where a design
 *          step isn't required... The approach depends on the desired outcome."
 *          With one exit on screen, Plan -> Build was never chosen, it was the
 *          only thing there, and Plan -> Design -> Build happened only if you
 *          already knew drawings live behind a tab called Flow. Both routes are
 *          now named, one is picked, and the pick is written to this spec's
 *          stage record so a skipped design is a decision somebody made rather
 *          than a step nobody noticed. The dispatch itself, its repo gate, the
 *          dialog and the navigate are unchanged; only where you reach them is.
 *          The DESIGN GATE IS UNTOUCHED: a spec whose drawing exists and is not
 *          approved still cannot go direct, refused by the same rule
 *          designGateBlocksDispatch enforces at both dispatch paths.
 *    KEEP  the Critic's verdict and the rewind in the context column. That is
 *          the crew's record ON this spec, which is exactly what depth about
 *          the one thing in focus means.
 *    KEEP  Tasks and "why this spec exists" as the only two always-on blocks
 *          below the views. A spec exists to become work and to answer for
 *          itself; those are the two questions the document cannot answer.
 *    MOVE  the outcome form, the citations, the design-readiness checklist and
 *          the generated mockup OFF the always-on stack and INTO the view they
 *          belong to. Nothing sits below the tab body that is not scoped to
 *          it. The outcome joins the contract (what it promised, what got
 *          built, how it landed, in one place); citations join Preview (a
 *          document carries its own references); readiness joins Edit (advice
 *          about the words while you are writing them); the mockup joins Flow
 *          (what the spec implies, drawn).
 *    MOVE  the Linear push, a team <select> plus a Create issues button.
 *          DESTINATION: /sync, with the other workspace resource bindings.
 *          Choosing which external tracker a workspace exports to is a
 *          connection decision made once, not a control on a document.
 *          Going with it: listLinearTeams, createLinearIssuesFromTasks, the
 *          teamId state, and the last two uses of Field and Select here.
 *    KILL  <TaskGraphPanel>. "Build readiness: 40% complete, 3 ready, 2
 *          blocked" is build tracking, which /build/$missionId and Runs own
 *          completely, and the rows it summarised are one glance above it. It
 *          also drew a retired-system card (hairline, bg-card, mono-label,
 *          --rose) inside a Block, which is a card in a card.
 *    KILL  the three stacked nudges: <DecisionCurrencyBanner>,
 *          <PrecedentNudge>, <SharedPremiseNudge>. Three dismissible cards in
 *          the retired system (material-medium, VerdictChip, moss/madder/ember)
 *          sat between the actions and the views, and two of them answered the
 *          same question in different words: "decisions similar to this one"
 *          and "decisions built on the same premise as this one" is a
 *          distinction only the engineer who wrote them can feel. The record
 *          contradicting you is the most differentiated moment in the product
 *          and it now gets ONE region, in the Record recess, reading the same
 *          two server functions.
 *    KILL  <Who> around a task title. Who names the ACTOR in a row lead; a
 *          task title is not an actor. Pass-one misuse.
 *    KILL  every toast on this surface. Eight of them, including "Build
 *          session dispatched" (a mechanism word) and "Saved". A save now
 *          stamps the time in the status line, where the last-saved fact
 *          already lives; everything consequential writes a receipt.
 *
 * 4. ONE CLICK AWAY. The six views ARE the depth: nothing below the tab body
 *    is unscoped any more. Task rows are one line plus a different second
 *    fact and never wrap. A source signal is one line and opens in Discover.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is asking for a breakdown and
 *    watching the Planner's mark run, then reading back the tasks it wrote
 *    with your own spec's words in them. The confusion this page used to
 *    invite was scrolling for the document and finding a form about how the
 *    thing you have not written yet turned out.
 *
 * 6. WHERE THE CREW IS, AND WHAT IT PROVES. Remove the agents and this page
 *    changes visibly. The Planner's mark sits on the Tasks block and RUNS
 *    while it decomposes the spec (generateTaskGraph is the Planner by its own
 *    system prompt). The Critic's mark and verdict sit in the context column
 *    with the rewind that undoes what the crew wrote. Every consequential act
 *    leaves a receipt saying what it caused. What is deliberately NOT claimed:
 *    the four assist actions run one model call and are not a named agent, so
 *    they say "the crew" and no mark; prds carry no author column
 *    (FINAL-agent-presence C9) so the spec gets no byline rather than a
 *    guessed one; and Send to Build draws no arrow, because success navigates
 *    to the run and failure never pretends otherwise.
 *
 * THE COMMIT (R10). This surface dispatches: it opens issues, records
 * decisions, and hands the spec to Build. Those used to vanish into toasts. A
 * toast confirms that your click registered; a receipt renders what it
 * CAUSED. A failed write still writes a receipt and goes honest in the same
 * beat. No arrow is drawn anywhere here: the Planner has already finished when
 * its receipt is written, and Send to Build navigates you to the work itself,
 * so an arrow would point at nothing.
 *
 * THE EDITOR ITSELF IS UNTOUCHED. Every server call, mutation, query key,
 * route param and search param behind the document is the same:
 * getPrd/savePrd/prdAssist, the GitHub issue, Send to Build with its repo
 * gate, Capture as decision, the task-graph planner, the six tab values behind
 * `?tab=`, provenance, citations, and the outcome card.
 *
 * Internal identifiers (prd_id, getPrd, ["prd", id]) intentionally stay: the
 * user-facing word is "spec", the schema word stays prd (CLAUDE.md
 * rename-disclaimer pattern).
 *
 * ----------------------------------------------------------------------------
 * PASS THREE, 2026-08-05: THE SURFACE GETS A PRIMARY OBJECT.
 *
 * WHAT WAS MEASURED. Pass two moved the right things into the right views and
 * then left the views themselves co-equal: six of them, in one flat `.sp-tabs`
 * row, sitting directly under the shell's seven-chip station strip. Two
 * undifferentiated horizontal rows of targets, one on top of the other, and
 * beneath them fourteen Blocks in a single scroll. The diagnosis was structural
 * rather than cosmetic: A SPEC IS A DOCUMENT, AND A DOCUMENT SURFACE HAS A BODY
 * AND A MARGIN. This one had six co-equal modes, so nothing was the body, and
 * every block was competing with thirteen peers for rank.
 *
 * THE ONE MOVE. Two of the six "modes" were never modes at all: `edit` and
 * `preview` are THE SAME OBJECT rendered two ways. The other four are readings
 * taken FROM that object. So:
 *
 *   THE BODY   The spec itself, always on screen, in one region titled "The
 *              spec". Write and Read are a state OF the document, picked with
 *              a `Choices` radio group inside that region, not two of six page
 *              tabs. The words you came here for are no longer behind a click.
 *   THE MARGIN Everything else, ranked and named, below the body: what this
 *              spec becomes (the four readings), where it goes next, the work
 *              it implies, why it exists. Each region says what it is for on
 *              its own heading, so nothing has to be inferred from position.
 *
 * WHY THE FOUR READINGS ARE `Choices` AND NOT A SECOND TAB ROW. This is the
 * ruling already made on Brain's Artifacts view and it applies unchanged: "Two
 * identical tab rows stacked ... is two things competing to be the navigation
 * and neither winning. A radio group reads as a control, which is what it is."
 * The seven-chip strip is the navigation on this page. The readings are a
 * control on one document, so they wear a control's clothes and live inside the
 * region they govern.
 *
 * NOTHING WAS REMOVED, AND THIS IS THE HARD PART. Every one of the six values
 * `?tab=` accepts still lands: `edit` and `preview` set the body's state,
 * `contract` / `projections` / `flow` / `launch` set the reading. Every panel
 * that rendered before renders now. What changed is RANK and GROUPING, and the
 * page shows strictly more at rest than it did: the document is on screen
 * beside whichever reading you opened, where before choosing Contract meant
 * losing sight of the spec the contract is about.
 *
 * WHAT ALSO MOVED, and why:
 *   · The record recess rose to sit under the title, ABOVE the actions. It
 *     exists to say the ground under this spec has moved, and it was rendering
 *     BELOW the handoff, which is after the point where you commit. A warning
 *     that arrives after the decision is not a warning.
 *   · The receipts follow the action row that writes most of them, unchanged
 *     in behaviour, so what you did stays next to where you did it.
 *   · "Where this spec goes next" now sits directly under the body rather than
 *     above a tab strip. It stays HIGH on purpose: it is the exit, and burying
 *     the one control that hands the work off underneath four readings would
 *     have traded one defect for another. The dispatch, the repo gate, the
 *     design gate and the route record are byte-for-byte what they were.
 *
 * THE ORDER, AND IT READS AS A SENTENCE. Here is the document. Here is where
 * it goes next. Here is what it becomes. Here is the work it implies. Here is
 * why it exists at all. Nothing has to be inferred from position, because
 * every region says on its own heading what it is for.
 *
 * Every server call, mutation, query key, route param and search param is
 * untouched by this pass. It is a layout and a ranking, and nothing else.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  getPrd,
  savePrd,
  prdAssist,
  createGithubIssueForPrd,
  generateTaskGraph,
  type CriticReview,
  type OutcomeContract,
} from "@/lib/discovery.functions";
import { getProvenance } from "@/lib/lineage.functions";
import { getDecisionCurrency } from "@/lib/decision-currency.functions";
import { getDecisionPrecedent } from "@/lib/decision-precedent.functions";
import { CriticBadge } from "@/components/governance/CriticBadge";
import { RewindButton } from "@/components/prds/RewindButton";
import { CitationsCard, type Citation } from "@/components/product/CitationsCard";
import { OutcomeCard, type OutcomePrd } from "@/components/product/OutcomeCard";
import { OutcomeContractPanel } from "@/components/product/OutcomeContractPanel";
import { IntentVsBuiltReceipt } from "@/components/product/IntentVsBuiltReceipt";
import { SpecProjectionsPanel } from "@/components/product/SpecProjectionsPanel";
import { FlowDiagram } from "@/components/product/FlowDiagram";
import { LaunchPlanPanel } from "@/components/product/LaunchPlanPanel";
import { listTasks } from "@/lib/tasks.functions";
import { DesignReadinessPanel } from "@/components/product/DesignReadinessPanel";
import { DesignScaffoldPanel } from "@/components/product/DesignScaffoldPanel";
import {
  chooseDesignRoute,
  getSpecDesignRoute,
  type DesignRouteChoice,
} from "@/lib/design-scaffold.functions";
import { dispatchStudioSession } from "@/lib/studio.functions";
import { createDecision } from "@/lib/decisions.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Choices,
  CtxBody,
  CtxHead,
  Empty,
  Failed,
  Line,
  Loading,
  Num,
  PageHead,
  Receipt,
  Record as RecordRecess,
  Row,
  Surface,
} from "@/components/shell/primitives";
import { AgentPulse } from "@/components/shell/AgentPulse";

/**
 * THE LINK VOCABULARY, unchanged. Six values, because six is what every
 * existing link, redirect and navigate in the product may carry, and a search
 * param that silently stops resolving is a broken link nobody reports. What
 * changed is where each one lands: two of them are the document's own state and
 * four of them are a reading taken from it. See `paneFor` / `lensFor` below.
 */
const MODE_TABS = ["contract", "projections", "edit", "preview", "flow", "launch"] as const;
type ModeTab = (typeof MODE_TABS)[number];

/**
 * THE BODY'S TWO STATES. `edit` and `preview` were never two of six modes: they
 * are one document rendered twice, and treating them as peers of Contract and
 * Launch is exactly what left this surface with no subject. They are a property
 * OF the body now, picked inside the body's own region.
 */
type Pane = "write" | "read";

/**
 * THE FOUR READINGS. Each one is something this spec BECOMES: what it promises
 * and how that landed, the documents written out of it, the flow it implies,
 * the launch it earns. None of them is the spec, which is why none of them is
 * the body and all four share one control.
 */
const LENS_TABS = ["contract", "projections", "flow", "launch"] as const;
type Lens = (typeof LENS_TABS)[number];

/** Sentence case, plain words. The all-caps labels were shouting, and
 *  "PROJECTIONS" named a mechanism rather than the thing you get.
 *
 *  `sub` is the region's own sentence while that reading is open, so the block
 *  says what you are looking at rather than making the label carry it alone.
 *  `title` stays the hover hint the tab row used to carry, unchanged in words. */
const LENS_DISPLAY: { id: Lens; label: string; title: string; sub: string }[] = [
  {
    id: "contract",
    label: "Contract",
    title: "What this spec promises, what got built against it, and how it landed",
    sub: "What it promised, what got built against it, and how it landed.",
  },
  {
    id: "projections",
    label: "Documents",
    title: "The PRD, the FRD, the status note and the one-pager, written fresh from the contract",
    sub: "The PRD, the FRD, the status note and the one-pager, written fresh from the contract.",
  },
  {
    id: "flow",
    label: "Flow",
    title: "The steps this spec implies, and the screen drawn from it",
    sub: "The steps this spec implies, and the screen the crew drew from it.",
  },
  {
    id: "launch",
    label: "Launch",
    title: "Positioning, the checklist, and the window the outcome gets checked in",
    sub: "Positioning, the checklist, and the window the outcome gets checked in.",
  },
];

/** A link's `?tab=` resolved onto the two things it can now mean. Only
 *  `preview` opens the document in its read state; every other value leaves the
 *  body where a person who came to write would want it, which is writable. */
const paneFor = (tab: ModeTab | undefined): Pane => (tab === "preview" ? "read" : "write");

/** Four of the six values name a reading. The other two say nothing about which
 *  reading to open, so the default one opens, exactly as it did when `contract`
 *  was the default tab. */
const lensFor = (tab: ModeTab | undefined): Lens =>
  tab && (LENS_TABS as readonly string[]).includes(tab) ? (tab as Lens) : "contract";

const ASSIST_ACTIONS = ["rewrite", "expand", "shorten", "critique"] as const;
const ASSIST_LABEL: Record<(typeof ASSIST_ACTIONS)[number], string> = {
  rewrite: "Rewrite",
  expand: "Expand",
  shorten: "Shorten",
  critique: "Critique",
};

/** Rendered markdown. There is no prose primitive, so the document's own
 *  ladder is written here once against the type scale rather than per call. */
const PREVIEW_COMPONENTS = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1
      style={{
        fontSize: "var(--sp-text-gate)",
        fontWeight: "var(--sp-weight-strong)",
        letterSpacing: "var(--sp-track-gate)",
        lineHeight: "var(--sp-leading-gate)",
        color: "var(--sp-ink)",
        margin: "0 0 14px",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2
      style={{
        fontSize: "var(--sp-text-body)",
        fontWeight: "var(--sp-weight-strong)",
        color: "var(--sp-ink)",
        margin: "26px 0 8px",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3
      style={{
        fontSize: "var(--sp-text-prose)",
        fontWeight: "var(--sp-weight-medium)",
        color: "var(--sp-ink)",
        margin: "20px 0 6px",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => <p style={{ margin: "0 0 12px" }}>{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul style={{ margin: "0 0 12px", paddingLeft: 20, listStyle: "disc" }}>{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol style={{ margin: "0 0 12px", paddingLeft: 20, listStyle: "decimal" }}>{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li style={{ margin: "0 0 5px" }}>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong style={{ color: "var(--sp-ink)", fontWeight: "var(--sp-weight-strong)" }}>
      {children}
    </strong>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code
      style={{
        fontFamily: "var(--sp-font-mono)",
        fontSize: "var(--sp-text-data)",
        background: "var(--sp-sink)",
        borderRadius: "var(--sp-radius-xs)",
        padding: "1px 5px",
      }}
    >
      {children}
    </code>
  ),
};

export const Route = createFileRoute("/_authenticated/plan/spec/$id")({
  // Optional so existing links/navigates work without search; CNV-04 lands
  // a freshly agent-authored spec straight on the Contract tab.
  validateSearch: (search: Record<string, unknown>): { tab?: ModeTab } => {
    const t = search.tab;
    return {
      tab: (MODE_TABS as readonly string[]).includes(t as string) ? (t as ModeTab) : undefined,
    };
  },
  component: SpecEditorPage,
  head: () => ({ meta: [{ title: "Spec · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <PageHead
        title="The spec did not load."
        sub={(error as Error)?.message ?? "No reason was reported."}
      />
      <Block>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Block>
    </Surface>
  ),
});

function SpecEditorPage() {
  /**
   * THE SPINE STAYS ON SCREEN INSIDE A DETAIL RECORD.
   *
   * Founder ruling 2026-08-01: "whenever we click any items in lines, pages,
   * sub items within those seven strip items... the strip should be constant
   * across all those items... so that the user also knows what it is and where
   * it is."
   *
   * A spec is Plan's detail record: you reach it by clicking a row on /plan, or
   * by keeping a bet on /decide. Until now the strip published on the seven
   * station surfaces and on runs, and nowhere else, so opening a spec dropped
   * you off the spine entirely. Nothing on screen said which of the seven
   * stations you were standing in, and the way back was the browser button.
   *
   * `define` is the station a spec belongs to, so the chip for Plan is lit
   * while you edit one, and the other six remain one click away at workspace
   * scope. This is the same one shared query every other spine surface reads
   * (use-spine-strip.ts), so it costs a cache read rather than a request.
   */
  useSpineStrip("define");
  const { id } = useParams({ from: "/_authenticated/plan/spec/$id" });
  const initialTab = Route.useSearch().tab;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fGet = useServerFn(getPrd);
  const mSave = useServerFn(savePrd);
  const mAssist = useServerFn(prdAssist);
  const mDispatchStudio = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const mCreateIssue = useServerFn(createGithubIssueForPrd);
  const mCaptureDecision = useServerFn(createDecision);
  const prdQ = useQuery({ queryKey: ["prd", id], queryFn: () => fGet({ data: { id } }) });

  // THE COMMIT (agents/FINAL-agent-presence.md R10). Every consequential act on
  // this surface used to end in a toast. A toast confirms that your click
  // registered; a receipt renders what your click CAUSED. Session-local on
  // purpose: the durable records are the decision, the issue and the run, and
  // duplicating them here would be a second source of the same truth.
  const [receipts, setReceipts] = useState<
    { key: number; verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);
  const receiptSeq = useRef(0);
  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const commit = (verb: string, consequence: string, failed?: boolean) => {
    receiptSeq.current += 1;
    setReceipts((r) =>
      [{ key: receiptSeq.current, verb, consequence, at: stamp(), failed }, ...r].slice(0, 6),
    );
  };

  // O1 (provenance): "why is this spec being built?": walk the lineage graph up
  // to the root source signals the spec ultimately rests on.
  const fProvenance = useServerFn(getProvenance);
  const provQ = useQuery({
    queryKey: ["provenance", "prd", id],
    queryFn: () => fProvenance({ data: { kind: "prd", id } }),
  });

  // The record speaking, in ONE region instead of three dismissible cards. Same
  // two server functions the retired nudges read; the third (shared premise)
  // answered the same question as the second in different words and is gone.
  const fCurrency = useServerFn(getDecisionCurrency);
  const fPrecedent = useServerFn(getDecisionPrecedent);
  const currencyQ = useQuery({
    queryKey: ["decision-currency", "prd", id],
    queryFn: () => fCurrency({ data: { kind: "prd" as const, id } }),
    staleTime: 60_000,
  });
  const precedentQ = useQuery({
    queryKey: ["decision-precedent", "prd", id],
    queryFn: () => fPrecedent({ data: { kind: "prd" as const, id } }),
    staleTime: 60_000,
  });

  const fTasks = useServerFn(listTasks);
  // Scoped under the "tasks" prefix (so every existing ["tasks"] invalidation
  // still hits it) but no longer colliding with other surfaces' global
  // ["tasks"] cache entry (audit D-14).
  const tasksQ = useQuery({ queryKey: ["tasks", "spec", id], queryFn: () => fTasks() });

  const prdTasks = (tasksQ.data?.tasks ?? []).filter(
    (t: { prd_id: string | null }) => t.prd_id === id,
  );

  // H1, the Planner: it decomposes the spec into a dependency-ordered task
  // graph, and it says so in its own system prompt, so naming it here is
  // attribution rather than decoration.
  const fGenTasks = useServerFn(generateTaskGraph);
  const genTasks = useMutation({
    mutationFn: () => fGenTasks({ data: { prd_id: id } }),
    onSuccess: (r: { count: number; graph: boolean }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      // No arrow on this receipt: the Planner has already finished by the time
      // it is written, so an arrow would point at nobody.
      commit(
        "You asked for a breakdown",
        `The Planner wrote ${r.count} task${r.count === 1 ? "" : "s"} from this spec${r.graph ? "" : ". Their order settles on the next sync"}.`,
      );
    },
    onError: (e: Error) => commit("Nothing was broken down", e.message, true),
  });

  // W5b: the dispatch repo gate. Set when Send to Build cannot resolve a
  // repo; the dialog offers /sync or provision-a-starter-repo + auto retry.
  const [repoGate, setRepoGate] = useState<{ reason: string | null } | null>(null);

  const sendToStudio = useMutation({
    mutationFn: () => mDispatchStudio({ data: { prdId: id } }),
    // Success writes no receipt because it navigates: the run itself is what
    // the click caused, rendered in full, and a line saying so would be gone
    // before it could be read.
    onSuccess: (r) => navigate({ to: "/build/$missionId", params: { missionId: r.missionId } }),
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else commit("Nothing was sent", e.message, true);
    },
  });
  const sendToBuild = () =>
    gateDispatch({
      check: () => fCanDispatch({ data: { prdId: id } }),
      dispatch: () => sendToStudio.mutate(),
      openGate: (reason) => setRepoGate({ reason }),
    });

  /**
   * THE ROUTE. Read before anything is offered, because both options describe
   * what would happen to THIS spec and neither sentence can be written without
   * knowing whether a screen is already drawn and whether its gate holds.
   */
  const fRoute = useServerFn(getSpecDesignRoute);
  const mChooseRoute = useServerFn(chooseDesignRoute);
  const routeQ = useQuery({
    queryKey: ["spec-design-route", id],
    queryFn: () => fRoute({ data: { prdId: id } }),
  });
  const routeInfo = routeQ.data ?? null;

  // Derived, never an effect. The selection defaults to what the workspace's
  // own policy implies and to whatever was chosen last time, but SELECTING is
  // not choosing: nothing is recorded and nothing moves until the button.
  const [routePick, setRoutePick] = useState<DesignRouteChoice | null>(null);
  const route: DesignRouteChoice =
    routePick ??
    routeInfo?.chosen?.route ??
    (routeInfo?.stageEnabled === false ? "direct" : "design");

  const chooseRoute = useMutation({
    mutationFn: (next: DesignRouteChoice) => mChooseRoute({ data: { prdId: id, route: next } }),
    onSuccess: (res, next) => {
      qc.setQueryData(["spec-design-route", id], res);
      // Design lists this spec, and the route it is on is one of the facts it
      // shows, so its list is stale the moment this lands.
      void qc.invalidateQueries({ queryKey: ["design-work"] });
      if (next === "design") {
        // No receipt: this navigates, and a line nobody can read is not a
        // receipt. The Design station itself is what the click caused.
        void navigate({ to: "/design", search: { focus: id } as never });
        return;
      }
      commit(
        "You sent it straight to Build",
        "No screen gets drawn. The skip is on this spec's record and Design shows it was sent past.",
      );
      void sendToBuild();
    },
    onError: (e: Error) => commit("The route did not change", e.message, true),
  });

  /** What picking this route would actually do to THIS spec, read from the
   *  record rather than described in general terms. */
  const routeConsequence = (): string => {
    if (!routeInfo) return "";
    if (route === "design") {
      if (!routeInfo.hasDrawing) {
        return "Design draws the screen this spec implies, and somebody judges the drawing before Build starts.";
      }
      return routeInfo.gateStatus === "approved"
        ? "A screen is already drawn and its design is approved. This spec can reach Build."
        : "A screen is already drawn and is waiting on a call at Design.";
    }
    return routeInfo.gateHolds
      ? "A screen is already drawn for this spec and nobody has judged it. That call has to be settled at Design first; skipping the step cannot clear it."
      : "No screen gets drawn. Build reads the spec as it stands, and the skip goes on this spec's record.";
  };

  /** Why the send cannot run right now, or null when it can. Never a greyed
   *  button with no reason beside it. */
  const routeBlocker = (): string | null => {
    if (!routeInfo) return null;
    if (route === "design") return null;
    if (routeInfo.gateHolds) return "The drawn screen has to be settled at Design first.";
    if (!prdQ.data?.prd?.github_issue_url) {
      return "Build works from a GitHub issue. Create the issue above and this opens.";
    }
    return null;
  };

  const createIssue = useMutation({
    mutationFn: () => mCreateIssue({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["prd", id] });
      commit(
        r.cached ? "It was already open" : "You opened the issue",
        `#${r.number} is on the repo. Send to Build can run now.`,
      );
    },
    onError: (e: Error) => commit("No issue was opened", e.message, true),
  });

  const captureDecision = useMutation({
    mutationFn: () =>
      mCaptureDecision({
        data: {
          title: `Spec decision: ${(title || prdQ.data?.prd?.title || "Untitled spec").slice(0, 220)}`,
          rationale: (body || prdQ.data?.prd?.body_md || "").slice(0, 500) || undefined,
          status: "approved",
          prd_id: id,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      // No arrow: nothing picks a recorded decision up. So the line says what
      // changed instead, which is the rule for a receipt with no handoff.
      commit(
        "You put it on the record",
        "This call is now a decision the crew can cite back to you.",
      );
    },
    onError: (e: Error) => commit("Nothing was recorded", e.message, true),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Two independent pieces of state where there was one, and that is the whole
  // restructure in two lines: the document has a state, and the readings taken
  // from it have a selection, and neither is a mode of the other.
  const [pane, setPane] = useState<Pane>(paneFor(initialTab));
  const [lens, setLens] = useState<Lens>(lensFor(initialTab));
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prdQ.data?.prd) {
      setTitle(prdQ.data.prd.title);
      setBody(prdQ.data.prd.body_md);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prdQ.data?.prd?.id]);

  const save = useMutation({
    mutationFn: () => mSave({ data: { id, title, body_md: body } }),
    // A save is a keystroke, not a judgment, so it gets no receipt: it stamps
    // the time into the status line that already carries the last-saved fact.
    // A FAILED save does get one, because a write that did not happen must
    // never wear the shape of one that did.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prds"] });
      setSavedAt(stamp());
    },
    onError: (e: Error) => commit("Your edits are not saved", e.message, true),
  });

  // The retired action bar was sticky and blurred, which is the glass ban. The
  // keycap on Save replaces what stickiness bought on a long document, and it
  // is bound for real: a keycap that does nothing is a lie.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (!save.isPending) save.mutate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  /**
   * What the in-flight rewrite is actually working on, captured at dispatch.
   *
   * IT HAS TO BE CAPTURED RATHER THAN DERIVED, and that is not a shortcut. The
   * textarea loses its selection the moment a button takes focus, so by the time
   * the indicator renders, `taRef.current.selectionStart === selectionEnd` and
   * the scope is unrecoverable. Reading it later would report "the whole spec"
   * for every call, including the ones that were a two-line selection.
   *
   * It matters because selecting nothing SILENTLY means the whole document, so
   * this is the one control on the surface where a person can be wrong about
   * what they just asked for.
   */
  const [assistScope, setAssistScope] = useState("");

  const assist = useMutation({
    mutationFn: (action: "rewrite" | "expand" | "critique" | "shorten") => {
      const ta = taRef.current;
      const whole = !(ta && ta.selectionStart !== ta.selectionEnd);
      const sel = whole ? body : body.slice(ta!.selectionStart, ta!.selectionEnd);
      if (!sel.trim()) throw new Error("Select some text first (or have content to work on)");
      const words = sel.trim().split(/\s+/).length;
      setAssistScope(
        whole
          ? `the whole spec, ${words} words`
          : `${words} ${words === 1 ? "word" : "words"} selected`,
      );
      return mAssist({ data: { action, selection: sel, context: body.slice(0, 4000) } });
    },
    onSuccess: (r) => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart,
        end = ta.selectionEnd;
      const next =
        start !== end ? body.slice(0, start) + r.text + body.slice(end) : body + "\n\n" + r.text;
      // The rewritten text lands in the editor in front of you. That IS the
      // confirmation, so there is nothing left for a toast to say.
      setBody(next);
    },
    onError: (e: Error) => commit("The rewrite did not land", e.message, true),
  });

  // State one of four: reading. A fact, not a spinner and not a fake skeleton.
  if (prdQ.isLoading) {
    return (
      <Surface>
        <PageHead title="Spec" />
      </Surface>
    );
  }

  // Error and not-found are DIFFERENT states: a failed fetch never wears the
  // not-found instruction's clothes. getPrd's `.single()` throws PGRST116
  // ("multiple (or no) rows") when the id is missing or RLS-hidden, so that one
  // error shape IS the not-found case; everything else stays a real error.
  const specMissing =
    prdQ.isError &&
    /multiple \(or no\) rows|cannot coerce.*single/i.test((prdQ.error as Error)?.message ?? "");

  if (prdQ.isError && !specMissing) {
    return (
      <Surface>
        <PageHead
          title="The spec did not load."
          sub={(prdQ.error as Error)?.message ?? "No reason was reported."}
        />
        <Block>
          <Button variant="primary" onClick={() => prdQ.refetch()}>
            Try again
          </Button>
        </Block>
      </Surface>
    );
  }

  if (specMissing || !prdQ.data?.prd) {
    return (
      <Surface>
        <PageHead
          title="No spec here."
          sub="It was deleted, or it belongs to a workspace you are not in."
        />
        <Block>
          <Empty>Every live spec is listed on Plan.</Empty>
          <Actions>
            <Button variant="primary" onClick={() => navigate({ to: "/plan" })}>
              Go to Plan
            </Button>
          </Actions>
        </Block>
      </Surface>
    );
  }

  const prd = prdQ.data.prd;
  const issueMatch = prd.github_issue_url ? prd.github_issue_url.match(/\/issues\/(\d+)/) : null;
  const hasSnapshot = Boolean((prd as { snapshot_before?: unknown }).snapshot_before);
  const citations = (prd as { citations?: Citation[] | null }).citations ?? null;
  const signals = provQ.data?.source_signals ?? [];
  const signalCount = provQ.data?.signal_count ?? 0;

  const orderedTasks = [...prdTasks].sort(
    (a: { seq?: number | null }, b: { seq?: number | null }) => (a.seq ?? 999) - (b.seq ?? 999),
  );

  /**
   * How many tasks the Planner would overwrite if it ran again.
   *
   * `generateTaskGraph` deletes where `seq is not null` and keeps manual tasks,
   * so a non-null `seq` is exactly the marker for "the Planner wrote this". The
   * indicator says this number while the call is in flight, because replacing
   * work you already sequenced is the one consequence of that button a person
   * cannot see coming from its label.
   */
  const generatedCount = orderedTasks.filter(
    (t: { seq?: number | null }) => t.seq !== null && t.seq !== undefined,
  ).length;

  // The record either contradicts you or it confirms you, and it gets ONE
  // region. A stale decision outranks a precedent, because acting on ground
  // that has already moved is the more expensive mistake.
  const currency = currencyQ.data ?? null;
  const precedent = precedentQ.data ?? [];
  const recordSays = currency
    ? currency.superseded
      ? `A later decision replaced this one${currency.governingTitle ? `, "${currency.governingTitle}"` : ""}. Work from that, not from here.`
      : "A later outcome contradicted this. What it promises is no longer safe ground."
    : precedent.length > 0
      ? "You have reasoned this way before. This is how it landed."
      : null;
  const LANDED: Record<string, string> = {
    validated: "it worked",
    missed: "it missed",
    mixed: "mixed result",
  };

  // The open reading, resolved once. `lens` is typed to the four ids the list
  // is built from, so the fallback is unreachable and exists only so this line
  // needs no non-null assertion to typecheck.
  const lensInfo = LENS_DISPLAY.find((l) => l.id === lens) ?? LENS_DISPLAY[0];

  return (
    <>
      <Surface
        wide
        context={
          <>
            <CtxHead>Linked work</CtxHead>
            <CtxBody>
              <Num>{prdTasks.length}</Num> {prdTasks.length === 1 ? "task" : "tasks"} on this spec.{" "}
              {issueMatch ? (
                <a
                  href={prd.github_issue_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit" }}
                >
                  Issue #{issueMatch[1]}
                </a>
              ) : (
                "No GitHub issue yet."
              )}
            </CtxBody>

            {/* Attribution, not a label. "Review" named the mechanism and hid
                the worker; the Critic red-teams this spec and its verdict is
                its own, so it signs it. */}
            <CtxHead>What the Critic says</CtxHead>
            {/* Deliberately NOT <CtxRow>. CtxRow always wraps its `name` slot in
                .sp-ctx-name, which is display:block plus its own font-size and
                colour. That is right for a name and wrong for a control: the
                badge here is a button (or the Value pill once a verdict exists),
                and putting a block wrapper with an inherited type scale around
                it changes how it renders. The row is the only one on this
                surface whose second slot is a control rather than a name, so it
                stays hand-rolled until CtxRow grows an unstyled slot. Convert it
                the day that exists, not before. */}
            <div className="sp-ctx-row">
              <AgentMark slug="critic" state="quiet" />
              <span>
                <CriticBadge
                  review={(prd as { critic_review?: CriticReview | null }).critic_review ?? null}
                  target={{ kind: "prd", id }}
                  invalidateKey={["prd", id]}
                />
              </span>
            </div>

            {hasSnapshot ? (
              <>
                <CtxHead>Before the crew touched it</CtxHead>
                <CtxBody>
                  <RewindButton prdId={id} hasSnapshot={true} />
                </CtxBody>
              </>
            ) : null}
          </>
        }
      >
        {/* The title is the h1 and it is editable in every view, the way it
            always was. There is no editable-title primitive, so it wears the
            title class and keeps a resting rule to say it can be typed in. */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Spec title"
          className="sp-title"
          style={{
            width: "100%",
            maxWidth: "56ch",
            background: "none",
            border: 0,
            borderBottom: "1px solid var(--sp-line-soft)",
            borderRadius: 0,
            outline: "none",
            padding: "0 0 6px",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--sp-mute)")}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--sp-line-soft)")}
        />
        {/* Two facts, never the same one twice: what state it is in, and when
            its words last changed. A save stamps the second one rather than
            firing a toast that says a thing this line already says. */}
        <div className="sp-subtitle">
          {prd.status} · saved <Num>{savedAt ?? new Date(prd.updated_at).toLocaleDateString()}</Num>
        </div>

        {/* The record, in one region, and now ABOVE the actions rather than
            below the handoff. It exists to say the ground under this document
            has moved, and it was rendering after the point where you commit. A
            warning that arrives after the decision is not a warning. It speaks
            or it stays silent; it never introduces itself. */}
        {recordSays ? (
          <Block>
            <RecordRecess
              evidence={
                precedent.length > 0 ? (
                  <>
                    <Num>{precedent.length}</Num> past{" "}
                    {precedent.length === 1 ? "decision" : "decisions"} on this ground
                  </>
                ) : undefined
              }
            >
              {recordSays}
            </RecordRecess>
            {precedent.slice(0, 3).map((p) => (
              <Row
                key={p.id}
                tight
                lead={p.title?.trim() || p.summary}
                sub={`${LANDED[p.verdict] ?? p.verdict}${p.governing ? " · and it has since been overtaken" : ""}`}
              />
            ))}
          </Block>
        ) : null}

        <Actions>
          <Button
            variant="primary"
            shortcut="⌘S"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving" : "Save"}
          </Button>
          {prd.github_issue_url ? null : (
            <Button
              disabled={createIssue.isPending}
              onClick={() => createIssue.mutate()}
              title="Build works from a GitHub issue. Creating it opens the route below."
            >
              {createIssue.isPending ? "Creating" : "Create GitHub issue"}
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={captureDecision.isPending}
            onClick={() => captureDecision.mutate()}
            title="Put this on the record as a decision"
          >
            {captureDecision.isPending ? "Recording" : "Capture as decision"}
          </Button>
        </Actions>

        {/* THE COMMIT (R10). What you did here, and what it caused. It follows
            the action row that writes most of these, so the consequence lands
            where the click did. It appears only once you have acted, and a
            failed write lands in the same place wearing its failure rather than
            a success shape. */}
        {receipts.length > 0 ? (
          <Block title="What you did here">
            {receipts.map((r) => (
              <Receipt
                key={r.key}
                verb={r.verb}
                consequence={r.consequence}
                time={r.at}
                failed={r.failed}
              />
            ))}
          </Block>
        ) : null}

        {/* ================================================================
            THE BODY. The one thing on this page that is the subject rather
            than a reading of it, and it is on screen whatever else you have
            open. Writing and reading are a STATE of this document, picked
            here with a radio group, not two of six page-level tabs: a tab
            strip says "these are different places", and these are one place
            in two lights.
            ================================================================ */}
        <Block
          title="The spec"
          sub={
            assist.isPending ? (
              // `prdAssist` is a chokepoint call, so the indicator is honest.
              // The detail is the ACTION the person chose plus how much text is
              // under it, which is the pair that answers "is it working on the
              // paragraph I meant, or the whole document" - the one real
              // ambiguity in this control, since selecting nothing silently
              // means the whole spec.
              // No mark, because the four assist actions are one model call and
              // not a named agent, and a mark here would claim a worker that is
              // not there.
              <AgentPulse
                label="The crew is rewriting your selection"
                seed={`assist-${assist.variables ?? ""}`}
                compact
                detail={
                  <>
                    {assist.variables ? ASSIST_LABEL[assist.variables].toLowerCase() : "editing"}
                    {" · "}
                    {assistScope}
                  </>
                }
              />
            ) : pane === "write" ? (
              "The crew rewrites what you select. Select nothing and it works on the whole spec."
            ) : (
              "The spec as it reads, with what it cites."
            )
          }
        >
          <Actions>
            <Choices<Pane>
              label="How to work on the spec"
              value={pane}
              options={[
                {
                  id: "write",
                  label: "Write",
                  title: "The words, and what they still have to say before design",
                },
                {
                  id: "read",
                  label: "Read",
                  title: "The spec as it reads, with what it cites",
                },
              ]}
              onPick={setPane}
            />
          </Actions>

          {pane === "write" ? (
            <>
              {/* The Textarea primitive does not forward a ref and the assist
                  mutation needs the selection, so this is the primitive's class
                  on a raw control rather than a second control. */}
              <textarea
                ref={taRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                aria-label="Spec body, markdown"
                spellCheck={false}
                rows={26}
                className="sp-textarea"
                style={{ fontFamily: "var(--sp-font-mono)" }}
              />
              <Actions>
                {ASSIST_ACTIONS.map((a) => (
                  <Button
                    key={a}
                    variant="ghost"
                    disabled={assist.isPending}
                    onClick={() => assist.mutate(a)}
                  >
                    {ASSIST_LABEL[a]}
                  </Button>
                ))}
              </Actions>
              {/* Advice about the words while you are writing them, so it stays
                  with the state that can act on it. It goes quiet on a blank
                  spec, so it draws nothing of its own. */}
              <DesignReadinessPanel body={body} />
            </>
          ) : (
            <>
              {body.trim() ? (
                <article
                  style={{
                    maxWidth: "72ch",
                    fontSize: "var(--sp-text-body)",
                    lineHeight: "var(--sp-leading-body)",
                    color: "var(--sp-body)",
                  }}
                >
                  <ReactMarkdown components={PREVIEW_COMPONENTS}>{body}</ReactMarkdown>
                </article>
              ) : (
                <Empty>Nothing is written yet. Switch to Write and start it.</Empty>
              )}
              {/* A document carries its own references, so they read with it. */}
              {citations && citations.length > 0 ? (
                <div style={{ marginTop: "var(--sp-space-5)" }}>
                  <CitationsCard citations={citations} />
                </div>
              ) : null}
            </>
          )}
        </Block>

        {/* WHERE THIS SPEC GOES NEXT. The one region on the page that hands the
            work off, and it asks the question rather than answering it with
            whichever button happened to be here. Directly under the body on
            purpose: you settle the document, then you say where it goes, and
            everything below this is either a reading of the spec or a record
            about it rather than an exit from it. */}
        <Block
          title="Where this spec goes next"
          sub={
            sendToStudio.isPending ? (
              // A GREYED BUTTON IS NOT A SIGN OF LIFE. `dispatchStudioSession`
              // assembles the work order and enqueues the builder run the resume
              // sweeper promotes into `runAgentLoop`, so an agent is genuinely
              // taking this on and the indicator says so beside the button that
              // started it.
              // THE DETAIL IS THE SPEC, not the touch list. This surface never
              // resolves one: the dispatch is called with `{ prdId }` alone, so
              // `allowedPaths` and `maxFiles` are server-side defaults here, and
              // the repo `canDispatchToRepo` reports is read inside
              // `gateDispatch` and never held in state. Naming a file scope
              // would be inventing the one fact a person would most trust.
              <AgentPulse
                label="Build is picking up the spec"
                seed="builder"
                compact
                detail={title.trim() || prd.title}
              />
            ) : (
              "A spec can be drawn first or built as it stands. Pick the one this outcome needs; either way the choice goes on this spec's record."
            )
          }
        >
          {routeQ.isLoading ? (
            <Loading>Reading what has been drawn for this spec.</Loading>
          ) : routeQ.isError ? (
            <Failed onRetry={() => void routeQ.refetch()}>
              Could not read this spec's route. {(routeQ.error as Error).message}
            </Failed>
          ) : (
            <>
              <Line label="Route" sub={routeConsequence()}>
                <Choices<DesignRouteChoice>
                  label="How this spec reaches Build"
                  value={route}
                  options={[
                    {
                      id: "design",
                      label: "Through Design",
                      title: "Design draws the screen, then somebody judges it before Build starts",
                      disabled: chooseRoute.isPending || sendToStudio.isPending,
                    },
                    {
                      id: "direct",
                      label: "Straight to Build",
                      title: routeInfo?.gateHolds
                        ? "A drawn screen is waiting on a call at Design. Settle it there first."
                        : "No screen gets drawn. Build reads the spec as it stands.",
                      // The design gate, unchanged and enforced here too: a
                      // drawing that exists and is not approved is a call
                      // somebody owes, and skipping the step is not a way to
                      // stop owing it. The server refuses this as well, so a
                      // stale page cannot get past it either.
                      disabled:
                        routeInfo?.gateHolds || chooseRoute.isPending || sendToStudio.isPending,
                    },
                  ]}
                  onPick={setRoutePick}
                />
              </Line>

              {/* What is already on the record. It is stated whichever way it
                  went, because "somebody chose to skip design here" is exactly
                  the fact a person reading this spec next month needs. */}
              {routeInfo?.chosen ? (
                <Line
                  label={
                    routeInfo.chosen.route === "direct"
                      ? "Design was skipped on purpose"
                      : "This spec was handed to Design"
                  }
                  sub={`Recorded ${new Date(routeInfo.chosen.at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}. It is on this spec's stage record, and Design lists it.`}
                />
              ) : null}

              <Actions>
                <Button
                  variant="primary"
                  disabled={
                    chooseRoute.isPending || sendToStudio.isPending || routeBlocker() !== null
                  }
                  title={routeBlocker() ?? undefined}
                  onClick={() => chooseRoute.mutate(route)}
                >
                  {chooseRoute.isPending || sendToStudio.isPending
                    ? "Sending"
                    : route === "design"
                      ? "Hand it to Design"
                      : "Send it straight to Build"}
                </Button>
              </Actions>

              {/* NEVER A DEAD END. When the send cannot run, the reason is on
                  the page under the button rather than hidden in a title
                  attribute a keyboard user never sees, and it names who acts
                  next. */}
              {routeBlocker() ? (
                <Empty
                  action={
                    routeInfo?.gateHolds ? (
                      <Button
                        onClick={() =>
                          void navigate({ to: "/design", search: { focus: id } as never })
                        }
                      >
                        Open it on Design
                      </Button>
                    ) : undefined
                  }
                >
                  {routeBlocker()}
                </Empty>
              ) : null}
            </>
          )}
        </Block>

        {/* ================================================================
            WHAT THIS SPEC BECOMES. Four readings taken FROM the document
            above: what it promised and how that landed, the documents written
            out of it, the flow it implies, the launch it earns. None of them
            is the spec, so none of them competes with it for rank, and all
            four share one control inside the region they govern.

            A RADIO GROUP, NOT A SECOND TAB STRIP. The ruling is Brain's, and
            it holds here unchanged: two identical tab rows stacked is two
            things competing to be the navigation and neither winning. The
            seven-chip station strip is the navigation on this page. These are
            a control on one document, so they wear a control's clothes.

            Every panel below renders exactly what it rendered before, with the
            same props and the same query keys. What changed is that the spec
            these are readings OF is still on screen while you read them.
            ================================================================ */}
        <Block title="What this spec becomes" sub={lensInfo.sub}>
          <Actions>
            <Choices<Lens>
              label="Which reading of this spec"
              value={lens}
              options={LENS_DISPLAY.map((l) => ({ id: l.id, label: l.label, title: l.title }))}
              onPick={setLens}
            />
          </Actions>

          {/* ONE GROUP, so the panels sit at component distance from one
              another instead of each drawing its own section rule and reading
              as an unrelated region. Every panel here already carries its own
              container, so the gap is all the separation they need. */}
          <div style={{ display: "grid", gap: "var(--sp-space-5)" }}>
            {lens === "contract" ? (
              <>
                <OutcomeContractPanel
                  prdId={id}
                  specTitle={prd.title}
                  bodyMd={body}
                  contract={(prd as { contract?: OutcomeContract | null }).contract}
                  invalidateKey={["prd", id]}
                />
                {/* RPT-44: the honest intent-vs-built receipt lives beside the contract. */}
                <IntentVsBuiltReceipt prdId={id} />
                {/* What it promised, what got built, and how it landed are one
                    subject, and they were once three screens apart with an
                    editor between them. */}
                <OutcomeCard prd={prd as unknown as OutcomePrd} invalidateKey={["prd", id]} />
              </>
            ) : lens === "projections" ? (
              <SpecProjectionsPanel
                title={prd.title}
                status={prd.status}
                updatedAt={prd.updated_at}
                contract={(prd as { contract?: OutcomeContract | null }).contract}
                bodyMd={body}
                citations={(citations ?? []).map((c) => ({
                  label: c.title?.trim() || c.source_kind,
                }))}
              />
            ) : lens === "flow" ? (
              <>
                <FlowDiagram prdId={id} />
                {/* The steps this spec implies and the screen the crew drew
                    from it answer the same question, which is what this spec
                    looks like once it exists. It goes silent on its own. */}
                <DesignScaffoldPanel prdId={id} specBody={body} />
              </>
            ) : (
              <LaunchPlanPanel prdId={id} />
            )}
          </div>
        </Block>

        {/* WHERE THE CREW IS. generateTaskGraph is the Planner by its own
            system prompt, so the mark is attribution, and it RUNS while the
            work runs and stops the moment it does. Remove the agents from this
            product and this block loses both its mark and its only action. */}
        <Block
          title="The work this implies"
          sub={
            genTasks.isPending ? (
              // The Planner replaces the existing generated graph, so the detail
              // says how many tasks are about to be overwritten. That is the one
              // consequence of this button a person cannot see coming, and it is
              // read from the list already on screen rather than guessed.
              <AgentPulse
                label="The Planner is breaking the spec down"
                seed="sprint-planner"
                compact
                detail={
                  <>
                    {prd.title}
                    {generatedCount > 0
                      ? ` · replacing ${generatedCount} ${generatedCount === 1 ? "task" : "tasks"}`
                      : null}
                  </>
                }
              />
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <AgentMark slug="sprint-planner" state="quiet" />
                The Planner breaks a settled spec into work you could sequence.
              </span>
            )
          }
          more={genTasks.isPending ? "Working" : "Break it into tasks"}
          onMore={() => {
            if (!genTasks.isPending) genTasks.mutate();
          }}
        >
          {tasksQ.isLoading ? null : orderedTasks.length === 0 ? (
            <Empty>
              No tasks yet. Break the spec into tasks when it is settled enough to build.
            </Empty>
          ) : (
            orderedTasks.map(
              (t: {
                id: string;
                seq?: number | null;
                title: string;
                detail?: string | null;
                estimate_hours?: number | null;
                assignee_kind?: string;
                risk?: string | null;
                depends_on?: unknown;
              }) => (
                <Row
                  key={t.id}
                  tight
                  marks={t.seq != null ? <Num>{t.seq}</Num> : null}
                  lead={t.title}
                  sub={
                    <>
                      {t.assignee_kind === "human" ? "you" : "the crew"}
                      {t.detail ? ` · ${t.detail}` : ""}
                      {Array.isArray(t.depends_on) && t.depends_on.length > 0 ? (
                        <>
                          {" · after "}
                          <Num>{(t.depends_on as number[]).map((n) => `#${n}`).join(", ")}</Num>
                        </>
                      ) : null}
                      {t.risk ? (
                        <>
                          {" · "}
                          <span className="sp-warn" title={t.risk}>
                            at risk
                          </span>
                        </>
                      ) : null}
                    </>
                  }
                  time={t.estimate_hours ? `${t.estimate_hours}h` : null}
                />
              ),
            )
          )}
        </Block>

        {/* O1 provenance. The one remaining always-on block, and it earns it:
            it is the only thing on the page that answers for the spec rather
            than describing it, and no view owns that question. The Record
            recess it used to draw is gone from here, because the recess is the
            one lit surface in the product and this page spends it above, on
            the record contradicting you. */}
        <Block
          title="Why this spec exists"
          sub={
            signalCount > 0 ? (
              <>
                It was not invented here. It traces back through <Num>{provQ.data!.node_count}</Num>{" "}
                {provQ.data!.node_count === 1 ? "step" : "steps"} to <Num>{signalCount}</Num>{" "}
                {signalCount === 1 ? "thing" : "things"} people actually said
                {provQ.data!.truncated ? ", and the chain continues past these" : ""}.
              </>
            ) : undefined
          }
        >
          {provQ.isLoading ? null : provQ.isError ? (
            <Failed onRetry={() => provQ.refetch()}>The chain did not come back.</Failed>
          ) : signalCount === 0 ? (
            <Empty>
              Nothing upstream. This one was written directly rather than raised by something a
              customer said.
            </Empty>
          ) : (
            // Five, not eight. Depth is a click away, and Discover owns the
            // full chain.
            signals.slice(0, 5).map((s) => (
              <Row
                key={s.id}
                tight
                lead={(s.title ?? s.content ?? "signal").slice(0, 120)}
                sub={s.source ?? "signal"}
                onClick={() =>
                  // Carries the signal id so Discover can focus it (the old
                  // link dropped it, audit D-14).
                  navigate({
                    to: "/discover",
                    search: { tab: "signals", focus: s.id } as never,
                  })
                }
              />
            ))
          )}
        </Block>
      </Surface>

      <RepoGateDialog
        open={repoGate !== null}
        prdId={id}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => sendToStudio.mutate()}
      />
    </>
  );
}
