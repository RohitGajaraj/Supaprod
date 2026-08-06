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
 *
 * ----------------------------------------------------------------------------
 * 2026-08-06, THE SEAM PASS: THE PAGE NAMES THE BET IT CAME FROM.
 *
 * Two reads were wrong about the same thing, which is that this surface was
 * judging a spec on less than the spec actually says.
 *
 *   1. IT COULD NOT NAME ITS BET. `prds.opportunity_id` is a real foreign key
 *      and "Keep it" on /decide navigates a person straight here, and this file
 *      contained not one reference to it. "Why this spec exists" rendered
 *      `getProvenance`, which walks THROUGH the opportunity node and returns
 *      only the root signals, so the block jumped from the spec to raw customer
 *      sentences with the decision that authorised the work missing from the
 *      middle. That block now names the bet first -- its problem, its ICE, its
 *      state on Decide in the same words Decide's own StatusPill prints, and
 *      the Example tag when the bet is a seeded one -- and then the quotes
 *      underneath it, unchanged.
 *   2. DESIGN READINESS SCORED THE PROSE AND CALLED IT THE SPEC. The scan is a
 *      keyword pass and it was handed `body_md` alone, so non-goals and
 *      criteria written in the Outcome Contract counted as unwritten. It now
 *      reads the contract's intent and standing clauses alongside the body.
 *
 * ONE NEW READ AND NO NEW SERVER FUNCTION. The bet comes from
 * `listOpportunities` under the shared `["opportunities"]` query key /decide
 * and Discover already use, so arriving from Decide costs a cache read. What is
 * still owed and does not live in this file: /decide declares no
 * `validateSearch`, so there is no way to deep-link ONE bet, and the door here
 * says "Open the ranking" rather than claiming a focus the route cannot honour.
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
  listOpportunities,
  type CriticReview,
  type OutcomeContract,
} from "@/lib/discovery.functions";
import { getProvenance } from "@/lib/lineage.functions";
// The canonical "real opportunity columns" shape, type-only so nothing of the
// detail sheet enters this bundle. Never a second hand-written bet type: that
// interface's own rule is that every field maps to an `opportunities` column.
import type { OpportunityDetailRecord } from "@/components/discover/OpportunityDetailSheet";
// The product's ONE renderer for `opportunities.status`. Its own docstring is
// that a status must read the same wherever it appears, so this page borrows it
// rather than writing a second spelling of "Backlog". It is the same function
// behind the StatusPill /decide draws on every queue row, including that pill's
// pass-through of a value STATUS_META does not know.
import { statusLabel } from "@/components/discover/OpportunityRow";
// PostgREST serializes the `numeric` ice_score column as a STRING, so the
// generated Supabase type lies about it. One coercion, shared with moat-vis
// and decision-judgment, rather than a third `Number()` written here.
import { iceNum } from "@/lib/moat-vis";
// The standing-clause reader the ARD already uses. Pure, structural, and unit
// tested; writing a second one is how the two definitions of "standing" drift.
import { standingClauseTexts } from "@/lib/build/ard-block";
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
  Door,
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

  /**
   * THE BET THIS SPEC WAS WRITTEN FOR, which this surface could not name.
   *
   * THE GAP. `prds.opportunity_id` is a real foreign key and `generatePrd`
   * writes it on every agent-authored spec (42 of 81 live specs carry it), and
   * this file rendered nothing from it: the word "opportunity" appeared
   * nowhere in it. Pressing "Keep it" on /decide navigates a person STRAIGHT
   * here, so the surface the handoff lands on could not say which bet
   * authorised the work, what problem it was for, or what it scored. "Why this
   * spec exists" walks the lineage graph past the opportunity node and returns
   * only the raw signals, so the block jumped from the spec to customer
   * sentences with the decision in between missing.
   *
   * WHY THIS READ. There is no by-id server read for a single bet anywhere in
   * the product; `listOpportunities` is the only door, and adding a narrower
   * one would mean editing a file this page does not own. It runs under the
   * SAME `["opportunities"]` query key /decide and Discover already use, so
   * the common path -- arriving here from Decide, whose data is already in
   * cache -- costs a cache read rather than a request, and every existing
   * `["opportunities"]` invalidation keeps this current for free.
   *
   * WHAT SCOPES IT, since a 500-row unfiltered read on a page about ONE spec is
   * the thing a reviewer should challenge. `listOpportunities` takes no
   * arguments and applies no workspace, product or status clause; its only
   * scoping is RLS, exactly like every other read on this page (`getPrd` and
   * `getProvenance` are by id, `listTasks` is likewise unfiltered and narrowed
   * client-side to `t.prd_id === id`). That is safe HERE for a reason narrower
   * than RLS: the row is selected by matching the foreign key exactly, so a bet
   * from another of the caller's workspaces can never be shown against this
   * spec — the id either matches or nothing renders. `["opportunities"]` is not
   * a global query-key root either (`workspace-query-scope.ts`), so a workspace
   * switch clears this cache entry rather than carrying one workspace's bets
   * into the next. What is genuinely paid is bandwidth, not correctness: a COLD
   * load of this page (deep link, refresh, a row click on /plan) fetches up to
   * 500 bets to render one. The fix for that is a by-id server read, which
   * lives in a file this page does not own; see the seam report.
   *
   * Gated on the foreign key, so a spec written by hand never pays for it.
   */
  const fOpps = useServerFn(listOpportunities);
  const specOpportunityId =
    (prdQ.data?.prd as { opportunity_id?: string | null } | undefined)?.opportunity_id ?? null;
  const oppsQ = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => fOpps(),
    enabled: Boolean(specOpportunityId),
  });
  const allBets: OpportunityDetailRecord[] = oppsQ.data?.opportunities ?? [];
  const sourceBet: OpportunityDetailRecord | null = specOpportunityId
    ? (allBets.find((o) => o.id === specOpportunityId) ?? null)
    : null;

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

  /**
   * APPROVE THE SPEC, which nothing in the product could do.
   *
   * THE GAP, and it is the purest form of this repo's signature defect. Plan's
   * whole job is to turn a decision into an approved spec -- `loop-surfaces.ts`
   * literally says the station "produces: an approved spec" -- and no control
   * anywhere set that status. The ONLY app-code writer of `prds.status` sets it
   * to "review". Fifty-five approved specs exist on the live database and not
   * one of them was approved by a person using this product.
   *
   * EVERY OTHER PIECE WAS ALREADY BUILT. `savePrd` accepts the status and
   * already detects the draft-or-review to approved transition to write its
   * Decisions entry and grade the contract. The `prds_reactor_fanout` trigger
   * fires on UPDATE. `prd.approved` is a registered event type, it is offered
   * in the governance Controls picker, and `reactor.functions.ts` carries a
   * written prompt for it: "A spec was just approved. Plan a multi-agent
   * execution: break it into specialist steps, dispatch the first wave."
   *
   * So a whole downstream automation has been sitting dark behind a missing
   * button. The station could not finish its own artifact, and the agents
   * waiting on it were never woken.
   *
   * IT SAVES THE EDITS IN THE SAME WRITE. Approving a spec while the body on
   * screen differs from the body on the record would approve a version nobody
   * read. One call, one row, one transition.
   */
  const approve = useMutation({
    mutationFn: () => mSave({ data: { id, title, body_md: body, status: "approved" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prds"] });
      setSavedAt(stamp());
      commit(
        "You approved the spec",
        "Build can pick it up, and the crew has been told to plan the work.",
      );
    },
    onError: (e: Error) => commit("The spec is not approved", e.message, true),
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
  const contract = (prd as { contract?: OutcomeContract | null }).contract ?? null;
  const signals = provQ.data?.source_signals ?? [];
  const signalCount = provQ.data?.signal_count ?? 0;
  // Coerced, never rendered raw: the column arrives as "7.0000000000000000".
  const betIce = sourceBet ? iceNum(sourceBet.ice_score) : null;

  /**
   * WHAT THE READINESS SCAN IS ALLOWED TO READ, and it was reading half the
   * spec. `analyzeDesignReadiness` is a deterministic keyword pass and it was
   * handed `body_md` alone, while the Outcome Contract is the most structured
   * statement of scope this document has -- its intent, its standing success
   * metrics, its standing non-goals. `savePrd` writes `contract` as its own
   * column and never regenerates `body_md`, so every contract edit after
   * creation widened the gap permanently: a spec that stated its non-goals as
   * contract clauses scored "Early" and was told to "add before design" things
   * it had already written down.
   *
   * THIS WIDENS WHAT IS ANALYSED, NEVER WHAT IS EDITED. The textarea below is
   * still bound to `body` alone, so no contract text can be written back into
   * the document by this. Superseded clauses are excluded, because a criterion
   * that has been replaced is not a criterion the spec still states.
   */
  const readinessText = [
    body,
    contract?.intent ?? "",
    ...standingClauseTexts(contract?.success_metrics),
    ...standingClauseTexts(contract?.non_goals),
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");

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
          {/* APPROVE LEADS WHEN IT IS THE NEXT REAL ACT, and Save steps down to
              secondary. This station exists to produce an approved spec; while
              one is still a draft, saving is housekeeping and approving is the
              thing the loop is waiting for. Once approved, the primary action
              is saving edits again, because there is nothing left to approve. */}
          {prd.status !== "approved" ? (
            <Button
              variant="primary"
              disabled={approve.isPending || save.isPending}
              onClick={() => approve.mutate()}
              title="Save these edits and approve the spec, so Build can pick it up"
            >
              {approve.isPending ? "Approving" : "Approve the spec"}
            </Button>
          ) : null}
          <Button
            variant={prd.status === "approved" ? "primary" : undefined}
            shortcut="⌘S"
            disabled={save.isPending || approve.isPending}
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
                  with the state that can act on it. It reads the contract
                  alongside the body (see `readinessText`), so a dimension
                  stated as a contract clause counts as stated.

                  IT GOES QUIET WHEN NEITHER THE BODY NOR THE CONTRACT SAYS 40
                  CHARACTERS' WORTH, which is narrower than the "quiet on a blank
                  spec" this note used to claim. `analyzeDesignReadiness`
                  computes `empty = normalize(text).length < 40` and the panel
                  returns null on it, and what it is handed is now
                  `readinessText`, not `body`. So a spec with an empty `body_md`
                  and a contract carrying 40 characters draws the panel where it
                  previously drew nothing. That is the correct behaviour — there
                  IS something to assess — but it is a behaviour change and the
                  sentence a skimmer reads has to say so. Its other visible
                  effect: scores RISE for specs whose contract states dimensions
                  the body does not, so a spec that read "Early" before this pass
                  can read "Developing" today with nothing on screen explaining
                  the jump. */}
              <DesignReadinessPanel body={readinessText} />
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
                  contract={contract}
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
                contract={contract}
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
            the record contradicting you.

            2026-08-06: IT NAMES THE BET BEFORE IT NAMES THE SIGNALS. The chain
            used to jump from this spec straight to raw customer sentences,
            walking through the opportunity node and discarding it, so the page
            a "Keep it" press lands on could not say which bet authorised the
            work or what it scored. The bet goes FIRST because it is the nearer
            and stronger answer to the block's own question: a person asking why
            this spec exists is asking which decision produced it, and the
            quotes are the evidence under that decision rather than a
            replacement for it. */}
        <Block
          title="Why this spec exists"
          sub={
            sourceBet ? (
              <>
                {/* "came from" rather than "was kept": a bet can be killed or
                    dropped after its spec was written, and the line below
                    prints whichever state it is actually in.

                    THE STEP COUNT'S SUBJECT IS THE SPEC, NOT THE BET, and the
                    first draft of this sentence moved it onto the bet and made
                    the number wrong. `getProvenance` is called with
                    `kind: "prd"` and returns `node_count: seen.size - 1`, which
                    is EVERY distinct ancestor of this spec: the bet node itself
                    counts as one step in its own trace, and the walk also picks
                    up ancestors that never sat under the bet. Measured live on
                    2026-08-06, `artifact_lineage` carries 28 prd->learning and
                    21 prd->decision edges beside the 13 prd->opportunity ones,
                    and 14 of the 20 specs that have lineage rows at all have
                    more than one parent kind — so on most of the specs that
                    render this sentence, an inflated number was being pinned on
                    the bet. The subject is back on the spec, where the count is
                    exactly what the number means. */}
                It was not invented here. It serves a bet that came from Decide
                {signalCount > 0 ? (
                  <>
                    , and the chain behind this spec runs through{" "}
                    <Num>{provQ.data!.node_count}</Num>{" "}
                    {provQ.data!.node_count === 1 ? "step" : "steps"} to <Num>{signalCount}</Num>{" "}
                    {signalCount === 1 ? "thing" : "things"} people actually said
                    {provQ.data!.truncated ? ", and the chain continues past these" : ""}
                  </>
                ) : null}
                .
              </>
            ) : signalCount > 0 ? (
              <>
                It was not invented here. It traces back through <Num>{provQ.data!.node_count}</Num>{" "}
                {provQ.data!.node_count === 1 ? "step" : "steps"} to <Num>{signalCount}</Num>{" "}
                {signalCount === 1 ? "thing" : "things"} people actually said
                {provQ.data!.truncated ? ", and the chain continues past these" : ""}.
              </>
            ) : undefined
          }
        >
          {/* THE BET, read off the `opportunity_id` foreign key this page never
              touched. A spec with no bet behind it renders nothing here and the
              signals below read exactly as they always did.

              THE BET OUTRANKS THE ERROR, and the first draft had that backwards.
              The order was isLoading -> isError -> sourceBet -> Empty, and in
              react-query v5 `data` survives a failed background refetch while
              `status` flips to error. So a spec whose bet was already in the
              shared ["opportunities"] cache would replace the rendered bet with
              "the bet did not come back" on any later refetch failure — a false
              sentence about a record this page is holding in its hand. All four
              states survive; only their precedence changed. */}
          {specOpportunityId ? (
            sourceBet ? (
              <Line
                label={sourceBet.title}
                sub={
                  <>
                    {/* First in the line, the same ruling /decide made on its
                        own queue rows: a caveat printed after the numbers
                        arrives once the impression is already formed. A spec
                        can be generated from a seeded example bet, and that is
                        exactly the case a person must not mistake for their
                        own product. */}
                    {sourceBet.is_sample ? (
                      <>
                        <b>Example</b>
                        {" · "}
                      </>
                    ) : null}
                    {sourceBet.problem?.trim() ? <>{sourceBet.problem.trim()} · </> : null}
                    impact <Num>{sourceBet.impact}</Num> · confidence{" "}
                    <Num>{sourceBet.confidence}</Num> · ease <Num>{sourceBet.ease}</Num>
                    {betIce !== null ? (
                      <>
                        {" · ICE "}
                        <Num>{betIce.toFixed(1)}</Num>, the score the Decide queue is ordered by
                      </>
                    ) : null}
                    {/* THE STATUS WORD, THROUGH THE ONE RENDERER THAT OWNS IT.
                        This printed `sourceBet.status` raw, so the same bet read
                        "Backlog" on Discover and "backlog" here. `statusLabel` /
                        STATUS_META (components/discover/OpportunityRow) is the
                        product's single renderer for this column, and its own
                        docstring is that a status must read the same wherever it
                        appears.

                        WHAT THIS DELIBERATELY DOES NOT DO, because checking it
                        turned the reasoning around. A reviewer asked for the
                        off-lane values to be re-phrased ("its STATUS is
                        committed") on the grounds that `committed` and
                        `discovery` name "a state Decide neither displays nor
                        offers". Half of that is right and half is wrong, and the
                        wrong half is the load-bearing one: /decide's queue row
                        renders `<StatusPill status={o.status} />` on EVERY row,
                        and StatusPill falls back to `label: status` for a value
                        STATUS_META does not know — the identical fallback
                        `statusLabel` takes. So Decide displays "committed", in
                        exactly the characters this line now prints, and "its
                        state on Decide is committed" is true. Splitting the
                        sentence on lane membership would have introduced a NEW
                        false one: `shipped` and `dropped` ARE in STATUS_META but
                        are not lanes (`LANES` offers Now/Next/Later/Backlog, and
                        `laneBucketFor` returns no bucket for either), so any
                        branch calling a STATUS_META value "its lane" would lie
                        about those two.

                        The residual, true and left in the comment rather than the
                        copy: three stored values (`committed` 36, `discovery` 21,
                        `killed` 15, measured live 2026-08-06) are DISPLAYED by
                        Decide but not OFFERED by its four-lane menu, so a reader
                        who follows the Door to change one will not find that word
                        among the choices. That is Decide's vocabulary gap, not a
                        false sentence on this page. Of the 42 specs carrying a
                        bet, 34 point at a `committed` one and 4 at a `discovery`
                        one, so it is the majority rendering. */}
                    {sourceBet.status ? (
                      <> · its state on Decide is {statusLabel(sourceBet.status)}</>
                    ) : null}
                  </>
                }
              >
                {/* IT LANDS ON THE RANKING, NOT ON THE BET, and the label says
                    so rather than promising a focus the route cannot honour:
                    /decide declares no `validateSearch`, so a search param
                    aimed at one bet would be dropped and the door would open on
                    whatever ranks first. Naming the ranking is the true
                    sentence available from this file. */}
                <Door
                  onClick={() => void navigate({ to: "/decide" })}
                  title="Open Decide, where this bet sits in the ranking"
                >
                  Open the ranking
                </Door>
              </Line>
            ) : oppsQ.isLoading ? (
              <Loading>Reading the bet this spec was written for.</Loading>
            ) : oppsQ.isError ? (
              <Failed onRetry={() => void oppsQ.refetch()}>
                This spec names a bet and the bet did not come back.{" "}
                {/* Optional chain and a fallback, the convention this file
                    already uses on the spec read two hundred lines up: a
                    rejection that is not an Error has no `.message`, and
                    reading it off `undefined` would crash the region that
                    exists to report the failure. */}
                {(oppsQ.error as Error)?.message ?? "No reason was reported."}
              </Failed>
            ) : (
              // NAMES ALL THREE REASONS, including the one the read itself
              // causes: `listOpportunities` returns the 500 highest-scoring
              // bets, so a very large workspace can hold a real bet this read
              // never sees. Saying only "deleted" would blame the record for a
              // limit in the query.
              //
              // "HIGHEST-SCORING" IS EXACT TODAY AND IS NOT A PROMISE FOREVER,
              // recorded here so the next reader does not re-litigate it.
              // `listOpportunities` orders `ice_score` DESC without naming
              // `nullsFirst`, and Postgres puts NULLS FIRST on a DESC order, so
              // a null-scored bet would LEAD this read rather than fall off the
              // end of it and the word "highest-scoring" would stop describing
              // what the cap drops. Measured live 2026-08-06: 0 of 289
              // opportunities carry a null `ice_score` and 289 is well inside
              // the 500 cap, so neither half is reachable and the sentence is
              // true as written. If nulls ever appear, this sentence is what
              // needs changing, not the read.
              <Empty>
                This spec names a bet the ranking did not return. It was deleted, it belongs to a
                workspace you are not in, or it falls outside the 500 highest-scoring bets this read
                covers.
              </Empty>
            )
          ) : null}

          {provQ.isLoading ? null : provQ.isError ? (
            <Failed onRetry={() => provQ.refetch()}>The chain did not come back.</Failed>
          ) : signalCount === 0 ? (
            // Two different true sentences, because "written directly" is a
            // claim about the spec's origin and it is FALSE the moment the
            // opportunity foreign key is set. Keyed on the key itself rather
            // than on the fetched row, so an unreachable bet still gets the
            // honest half.
            <Empty>
              {specOpportunityId
                ? "The chain stops at the bet. Nothing a customer said is linked to it yet."
                : "Nothing upstream. This one was written directly rather than raised by something a customer said."}
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
