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
 *
 * ----------------------------------------------------------------------------
 * 2026-08-06, THE HANDOFF PASS: THE PRIMARY SAYS WHAT THE PAGE JUST SAID.
 *
 * An approved design had no honest way out of this page. "Where this spec goes
 * next" printed "A screen is already drawn and its design is approved. This
 * spec can reach Build." and the primary under it offered to hand the spec to
 * Design, which wrote `design_requested` and navigated back to the station that
 * had already finished. The only route to Build was "Straight to Build", whose
 * own sentence, hint and receipt all said no screen gets drawn, and which
 * records `design_skipped` on a spec that went through Design and was approved.
 * A false stage event is the one class of defect that compounds against a
 * product whose moat is the record.
 *
 * SIX SITES, ALL OF THEM THE SAME SENTENCE FACING A DIFFERENT WAY: the section's
 * own `sub` above the radio, the primary (now "Send it to Build", dispatching
 * without re-writing a route that Design already honoured), the consequence line
 * under the radio, BOTH hover hints, and the receipt written after the skip.
 * `designIsDoneAndApproved` is the one predicate all six read, so they cannot
 * drift apart again.
 *
 * THIS COUNT WENT FOUR, THEN FIVE, THEN SIX, each time because a reader looked
 * again rather than because the code changed. The fifth was the DESIGN route's
 * own hover hint, a constant reading "Design draws the screen, then somebody
 * judges it before Build starts" on a spec whose screen was drawn and judged;
 * it is `designRouteHint()` now. The sixth was the Block `sub`, which promised
 * "either way the choice goes on this spec's record" directly above the one
 * path that deliberately writes no route event; it is `routeSectionSub()` now.
 * Both are keyed off the same `hasDrawing` / `gateStatus` pair as their
 * neighbours, and both keep their old words in the undrawn default. The count
 * is corrected in place rather than quietly, because a docblock that says four
 * when the code sweeps six is the next reader's wrong map.
 *
 * WHAT IS NOT REMOVED, AND THE ONE THING THAT IS. Through Design is still there,
 * still first, still what the picker opens on unless the workspace turned the
 * design stage off, and on a spec whose drawing is pending or sent back it still
 * says "Hand it to Design" and goes there. The direct route on an approved
 * drawing is still selectable; what changed is that it no longer describes the
 * record it would write as if that record were true.
 *
 * WHAT IS REMOVED, stated plainly because an earlier draft of this docblock
 * claimed otherwise: on an APPROVED drawing this page no longer has any way
 * back to Design. That is the finding's own ruling, that re-opening design
 * would be a different action with a different name and a different event
 * rather than this one. But it means an approved spec that wants a second
 * design pass has no door here, and there is no "/design" link below either:
 * the only two on this surface are the post-choice navigate and the gate-holds
 * blocker, and neither can fire once the gate reads approved. Whoever adds that
 * action owns naming the event it writes.
 *
 * AND THE SENDS ARE NOW GATED THE SAME WAY, because they are one dispatch: what
 * the surface asks of a send follows `routeSendsToBuild` rather than the radio,
 * so handing a spec TO Design, which dispatches nothing, is asked for nothing.
 * (This paragraph used to call the GitHub issue a "precondition" and say the
 * blocker for it had "finally" got a door. Corrected below: it was never a
 * precondition of anything, and the door is now attached to a note rather than
 * to a refusal.)
 *
 * ----------------------------------------------------------------------------
 * 2026-08-06, THE AUDIT PASS: FOUR THINGS THIS PAGE SAID THAT WERE NOT TRUE.
 *
 * The station audit returned "not-self-sufficient" on Plan. Four of its findings
 * were about this file and all four are the same shape, which is a surface
 * making a claim its own code does not keep.
 *
 *   1. APPROVING CHANGED NOTHING ON THE PAGE THAT APPROVED IT. `approve` wrote
 *      the row and invalidated ["prds"], the list on /plan, while this page
 *      reads ["prd", id]. Those keys do not partial-match, so the subtitle kept
 *      saying "draft" under a receipt saying "You approved the spec". See
 *      `approve`. `save` had the same gap and got the same line.
 *   2. THE DIRECT ROUTE WAS DISABLED BEHIND AN INVENTED PRECONDITION.
 *      `routeBlocker` refused to dispatch a spec with no GitHub issue.
 *      `dispatchStudioSession` has never wanted one. Under the founder's
 *      non-linear ruling plan to build is a first-class route, and this made it
 *      a two-step for 41 of the 42 approved specs on the live database. The
 *      clause is gone and its message survives as `sendsWithoutIssue`, a note
 *      with the same door.
 *   3. THE ISSUE DOOR DEAD-ENDED WHEN GITHUB WAS NOT CONNECTED. `createIssue`
 *      wrote a failed receipt for a refusal this page has offered two real
 *      paths out of since W5b. It opens the repo gate now, and the gate learned
 *      which of the two acts to retry. See `repoGate`.
 *   4. A RECEIPT CLAIMED THE SEND BEFORE THE SEND WAS ATTEMPTED. Written inside
 *      `chooseRoute.onSuccess`, which only means the route was recorded, and
 *      followed by a dispatch that stops at the repo gate on any workspace with
 *      no repo. It reports the record now, and the dispatch reports itself.
 *
 * What is NOT fixed here and does not live in this file: `listSpecs` still
 * returns no design row per spec, so /plan reads `listDesignWork` beside it.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import { Num, Door, Actions } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
// The product's ONE label renderer for `opportunities.status`, borrowed rather
// than writing a second spelling of "Backlog". It and the StatusPill /decide
// draws are TWINS rather than one function: both read the same `STATUS_META`
// table, whose docstring is that a status must read the same wherever it
// appears, and both fall back to the raw value for a status that table does not
// know -- but StatusPill inlines its own lookup instead of calling this. And
// /decide draws that pill only for a queue row that HAS a status, the pill
// sitting inside an `{o.status ? ... : null}` guard.
//
// SUPERSEDED, quoted so the claim cannot come back: this read "It is the same
// function behind the StatusPill /decide draws on every queue row", which
// overstated both halves. Corrected 2026-08-06. The `statusLabel` call site in
// the "Why this spec exists" bet line spells the same guard out at length and
// calls overstating what another file does the defect this pass exists to stop
// writing; this clause was written by an earlier wave and outlived it. Nothing
// renders differently today -- 0 of 294 opportunities carry a null status,
// measured 2026-08-06 -- but the column is nullable.
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
// The document, rendered. It carries the citation chips, the lede and the type
// ladder that used to be sixty lines of inline style in this file. See its own
// docblock for why the obsidian chip is not the one being used.
import { SpecProse, PROSE_MEASURE } from "@/components/prds/SpecProse";
// The state word, the reading budget and the opening line. All three belong to
// Plan's formatting module rather than to this route: `specStateWords` was
// private to plan.index.tsx while this page printed the raw enum beside it.
import { openingLine, readingLoad, specStateWords } from "@/components/plan/format";
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
  Action,
  Approve,
  NothingHere,
  NothingYet,
  PageHeading,
  ReadFailedLine,
  Reading,
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Choices } from "@/components/meridian/forms";
import { CtxBody, CtxHead } from "@/components/meridian/ContextColumn";
import { Receipt } from "@/components/meridian/Receipt";
import { Surface } from "@/components/meridian/Surface";
// THE AUTONOMOUS PATH, ON THE ONE SURFACE THAT DISPATCHES BUILD WORK. See the
// mount below for why this station had none and why that was the sharpest
// instance of the gap.
import { CrewWorking } from "@/components/shell/CrewWorking";
import { AgentMark } from "@/components/meridian/marks";
import { AgentPulse } from "@/components/meridian/AgentPulse";

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

/* The rendered-markdown component map that stood here has moved to
 * src/components/prds/SpecProse.tsx, and it did not move unchanged: the version
 * in this file rendered a citation marker as the characters `[1]`. A renderer is
 * not a page, and sixty lines of type scale inline in a route is how a document
 * surface ends up with a type ladder nobody can find. */

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
      {/* THE STACK OWNS THE SPACE BETWEEN REGIONS. The retired `Block` drew its
          own 36px margin, 28px pad and top rule, so a surface never said how its
          regions were spaced; Meridian's `Region` draws none of that on purpose
          and the six already-ported surfaces state it here as one gap. */}
      <div className="flex flex-col gap-mrd-7">
        <PageHeading
          title="The spec did not load."
          sub={(error as Error)?.message ?? "No reason was reported."}
        />
        {/* A bare region around one button was a container saying nothing.
            `Actions` is the row a control belongs in. */}
        <Actions>
          <Action variant="primary" onClick={reset}>
            Try again
          </Action>
        </Actions>
      </div>
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

  /**
   * W5b: the repo gate. Set when an act on this page cannot resolve a repo; the
   * dialog offers /sync or provision-a-starter-repo plus an automatic retry.
   *
   * `retry` NAMES WHAT THE GATE INTERRUPTED, because two different acts on this
   * page hit the same refusal and the dialog retries exactly one of them. The
   * dispatch has always been able to open it; `createIssue` now can too, and
   * both go through `resolveGitHub`. Without this field the dialog's provision
   * path would have re-run the dispatch whichever act opened the gate, so
   * provisioning a repo from the issue door would have started a build.
   */
  const [repoGate, setRepoGate] = useState<{
    reason: string | null;
    retry: "dispatch" | "issue";
  } | null>(null);

  const sendToStudio = useMutation({
    mutationFn: () => mDispatchStudio({ data: { prdId: id } }),
    // Success writes no receipt because it navigates: the run itself is what
    // the click caused, rendered in full, and a line saying so would be gone
    // before it could be read.
    onSuccess: (r) => navigate({ to: "/build/$missionId", params: { missionId: r.missionId } }),
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message, retry: "dispatch" });
      else commit("Nothing was sent", e.message, true);
    },
  });
  /**
   * THE PRE-CHECK IS A ROUND TRIP, AND NOTHING WAS PENDING DURING IT.
   *
   * `gateDispatch` awaits `canDispatchToRepo` before it calls `mutate`, and
   * across that window `sendToStudio.isPending` is still false. The button that
   * started it therefore sat enabled, wearing its resting label, with a dispatch
   * already in flight. A second press there is a SECOND builder mission on the
   * same spec, which is the defect ReadyToBuild's own docblock records ("two
   * agents on one issue, and the founder pays for both").
   *
   * It mattered less while the only caller was `chooseRoute.onSuccess`, where
   * the finger has already left the button. The approved-design primary below
   * calls this on the click itself, so the window is now the first thing a
   * double click lands in. One flag, cleared in `finally` so a check that throws
   * cannot leave the control dead.
   */
  const [checkingRepo, setCheckingRepo] = useState(false);
  const sendToBuild = async () => {
    setCheckingRepo(true);
    try {
      await gateDispatch({
        check: () => fCanDispatch({ data: { prdId: id } }),
        dispatch: () => sendToStudio.mutate(),
        openGate: (reason) => setRepoGate({ reason, retry: "dispatch" }),
      });
    } finally {
      setCheckingRepo(false);
    }
  };

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

  /**
   * DESIGN HAS ALREADY DONE ITS WORK, SO "THROUGH DESIGN" MEANS "GO TO BUILD".
   *
   * THE DEFECT. `routeConsequence` said, correctly, "A screen is already drawn
   * and its design is approved. This spec can reach Build." The primary under
   * that sentence still read "Hand it to Design", and pressing it wrote a
   * `design_requested` stage event and navigated back to the station that had
   * already finished. The sentence and the button disagreed, and the button was
   * the one writing to the record. The only way to Build was to flip the radio
   * to "Straight to Build", which records `design_skipped` on a spec that went
   * through Design and was approved. On the product whose moat is the record,
   * a false stage event costs more than the extra click does.
   *
   * BOTH HALVES OF THE CONDITION, because branching on the gate word alone
   * would put "Send it to Build" under the sentence "Design draws the screen
   * this spec implies" on a spec with nothing drawn: the same defect facing the
   * other way. This is exactly the pair `routeConsequence` branches on.
   *
   * WHY IT WRITES NO ROUTE EVENT. The design path is already on this spec's
   * stage record without one: `decideDesignGate` records `design_approved` with
   * its actor at the moment the call is made. Measured 2026-08-06 on the live
   * database: 81 specs, 5 with a drawing, 2 with an approved gate, and exactly
   * those 2 carry a `design_approved` stage event. Writing `design_requested`
   * as the spec LEAVES Design would put the trail out of order to repeat
   * something the trail already says.
   *
   * AND THIS DOES COST SOMETHING, which an earlier draft of this comment denied.
   * It said a spec wanting another pass still has "Through Design" with its own
   * "Hand it to Design" and that the Design station is one click away below.
   * Neither holds on the spec this branch is about: once the gate reads approved
   * the same radio option reads "Send it to Build", and there is no "/design"
   * link further down the page. Re-opening an approved design is a real thing
   * somebody may need and it is not offered here. It should not be THIS action
   * wearing a second meaning, because that is the false stage event again; it
   * wants its own name and its own event.
   */
  const designIsDoneAndApproved =
    routeInfo?.hasDrawing === true && routeInfo.gateStatus === "approved";

  /** True when pressing the primary dispatches rather than navigates. Both
   *  routes can reach Build now, so the preconditions below are read off THIS
   *  rather than off the radio. */
  const routeSendsToBuild = route === "direct" || designIsDoneAndApproved;

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
      /**
       * THE THIRD PLACE THIS SENTENCE WAS WRITTEN, and the only one that lands
       * after a write. "No screen gets drawn" is not true of a spec that has one
       * drawn and approved, so on that spec the receipt says what the click
       * actually put on the record instead of repeating the default.
       *
       * AND ITS VERB NO LONGER CLAIMS THE SEND. It read "You sent it straight to
       * Build", written here, inside `chooseRoute.onSuccess`, which means one
       * thing only: the route event was recorded. The send is the NEXT line.
       * `sendToBuild` runs `gateDispatch`, and when the repo pre-check comes
       * back `not_connected` it calls `openGate` and never dispatches
       * (src/lib/build/repo-gate.ts). So on a workspace with no repo connected,
       * which is the normal fresh-workspace case, this page said "You sent it
       * straight to Build" and then opened a modal explaining that there is
       * nowhere to build it.
       *
       * SPLIT ALONG WHAT ACTUALLY HAPPENED AT THIS MOMENT. This receipt covers
       * the record, which is written and true. The dispatch speaks for itself
       * either way: success navigates to the run, and failure is already
       * covered by "Nothing was sent" in `sendToStudio.onError` or by the repo
       * gate. Nothing is lost, because the two halves were never one event.
       */
      commit(
        "You recorded the skip",
        designIsDoneAndApproved
          ? "A skip is on this spec's record and Design shows it was sent past, on a spec whose screen was already drawn and approved. Build is being asked for it now."
          : "No screen gets drawn. The skip is on this spec's record and Design shows it was sent past. Build is being asked for it now.",
      );
      void sendToBuild();
    },
    onError: (e: Error) => commit("The route did not change", e.message, true),
  });

  /**
   * ============================================================================
   * ONE ROUTE, ONE PARAGRAPH. What this region says about THIS spec, said once.
   * ============================================================================
   *
   * WHAT WAS HERE, AND WHY IT KEPT GOING WRONG. Six separate functions and
   * constants described a single choice: the section's `sub`, the sentence under
   * the radio, both hover hints, the primary's label and the receipt written
   * after the skip. Each one branched on its own reading of `hasDrawing` and
   * `gateStatus`, and the docblock at the top of this file records the count
   * going FOUR, then FIVE, then SIX, each time because a reader looked again
   * rather than because the code changed. That is not six bugs. It is one shape:
   * a region whose copy is spread across six independently-branching sites will
   * always have a seventh nobody has found yet, and the fix that catches five of
   * them leaves the sixth saying something false with more confidence than
   * before, because its neighbours now agree with each other.
   *
   * So the branch happens ONCE. `routeState` names which of four situations this
   * spec is actually in, and every sentence in the region is read out of the one
   * table below. Adding a sentence means adding a field, which means the compiler
   * asks for it in all four states rather than a reader noticing in a month.
   *
   * EVERY STRING IS THE ONE THAT WAS THERE, character for character. This is a
   * consolidation and not a rewrite: the words were correct after the handoff
   * pass, and the defect was their number rather than their content.
   *
   * WHY `gateHolds` IS PASSED RATHER THAN DERIVED. It is
   * `stageEnabled && hasDrawing && status !== "approved"` on the server
   * (`designGateBlocksDispatch`), and the `stageEnabled` half is not in the pair
   * this table branches on. A workspace with the design stage turned OFF and an
   * unjudged drawing has `gateHolds === false`, and the direct route's copy has
   * always taken its undrawn default there. Deriving the hold from the pair would
   * have silently changed what that workspace reads, which is a behaviour change
   * wearing a refactor's clothes.
   *
   * THE TWO SENTENCES THAT ARE NOT HERE, and both stay where they are on
   * purpose: `routeBlocker` and `sendsWithoutIssue` below are PREDICATES about
   * whether the send can run, not descriptions of the route, and they are each
   * pinned by name in plan-can-finish-its-own-artifact.test.ts because both were
   * once wrong in a way no type could catch.
   */
  type RouteState = "undrawn" | "waiting" | "sentBack" | "approved";
  const routeState: RouteState = !routeInfo?.hasDrawing
    ? "undrawn"
    : routeInfo.gateStatus === "approved"
      ? "approved"
      : routeInfo.gateStatus === "rejected"
        ? // "Sent back" is the word Design itself prints for a rejected gate
          // (GATE_WORD in components/design/vocabulary.ts), and it is not the
          // same fact as "waiting": somebody DID judge this drawing and asked
          // for changes. One sentence for both states told the person who acted
          // that nobody had.
          "sentBack"
        : "waiting";

  /**
   * WHAT THE REGION SAYS IN EACH STATE. Two arms, because the two routes read
   * the record differently and always did.
   *
   * The DESIGN arm branches on `routeState` alone: it describes what Design
   * would do with the drawing, and Design's queue does not care whether this
   * workspace has the stage switched on.
   *
   * The DIRECT arm branches on the HOLD, and that is the one asymmetry in the
   * region. Its copy answers "can this spec be skipped past Design", which is
   * exactly the question `gateHolds` answers, stage switch included. So the
   * direct arm is read at `directState` below rather than at `routeState`.
   */
  const ROUTE_COPY: Record<
    RouteState,
    {
      /** The section's own standing description, above the radio. */
      sectionSub: string;
      /** The hover hint on "Through Design". */
      designHint: string;
      /** The hover hint on "Straight to Build". Read at `directState`. */
      directHint: string;
      /** Under the radio, with "Through Design" selected. */
      designConsequence: string;
      /** Under the radio, with "Straight to Build" selected. Read at `directState`. */
      directConsequence: string;
      /** The primary's resting label with "Through Design" selected. The direct
       *  route's label is the same in every state, so it is written once below. */
      designLabel: string;
    }
  > = {
    undrawn: {
      sectionSub:
        "A spec can be drawn first or built as it stands. Pick the one this outcome needs; either way the choice goes on this spec's record.",
      designHint: "Design draws the screen, then somebody judges it before Build starts.",
      directHint: "No screen gets drawn. Build reads the spec as it stands.",
      designConsequence:
        "Design draws the screen this spec implies, and somebody judges the drawing before Build starts.",
      directConsequence:
        "No screen gets drawn. Build reads the spec as it stands, and the skip goes on this spec's record.",
      designLabel: "Hand it to Design",
    },
    waiting: {
      sectionSub:
        "A spec can be drawn first or built as it stands. Pick the one this outcome needs; either way the choice goes on this spec's record.",
      designHint:
        "A drawn screen is waiting on a call at Design. This hands it back to the same queue.",
      directHint: "A drawn screen is waiting on a call at Design. Settle it there first.",
      designConsequence: "A screen is already drawn and is waiting on a call at Design.",
      directConsequence:
        "A screen is already drawn for this spec and nobody has judged it. That call has to be settled at Design first; skipping the step cannot clear it.",
      designLabel: "Hand it to Design",
    },
    sentBack: {
      sectionSub:
        "A spec can be drawn first or built as it stands. Pick the one this outcome needs; either way the choice goes on this spec's record.",
      designHint: "Design sent the drawn screen back. This hands it there for the next pass.",
      directHint: "Design sent the drawn screen back. Settle it there first.",
      designConsequence:
        "A screen is already drawn and Design sent it back. The next pass happens there.",
      directConsequence:
        "A screen is already drawn for this spec and Design sent it back. That call has to be settled there; skipping the step cannot clear it.",
      designLabel: "Hand it to Design",
    },
    // The state the handoff pass exists for. Through Design ENDS AT BUILD here
    // and writes no route event, because `decideDesignGate` already put
    // `design_approved` on this spec's record; and the direct route still says
    // out loud that the skip it would write did not happen. The door stays open,
    // because a person may have a reason.
    approved: {
      sectionSub:
        "The screen this spec needs is already drawn and approved, so both routes end at Build. Through Design sends it there and writes nothing further, because Design's approval is already on this spec's record.",
      designHint:
        "A screen is already drawn and approved, so this sends the spec to Build rather than back to Design.",
      directHint:
        "A screen is already drawn and approved, so this route would record a skip that did not happen.",
      designConsequence:
        "A screen is already drawn and its design is approved. This spec can reach Build.",
      directConsequence:
        "A screen is already drawn for this spec and its design is approved, so there is nothing to skip. This route would still put a skip on the record. Through Design sends it to Build without one.",
      designLabel: "Send it to Build",
    },
  };

  /**
   * Where the DIRECT arm reads its copy. A held gate speaks for itself; with no
   * hold, an approved drawing is the one thing left worth saying, and everything
   * else takes the undrawn default. That last clause is what preserves today's
   * behaviour for a workspace with the design stage switched OFF and an unjudged
   * drawing: `gateHolds` is false there, and the direct route has always told
   * that workspace "no screen gets drawn" rather than sending it to a gate it
   * has turned off.
   */
  const directState: RouteState = routeInfo?.gateHolds
    ? routeState
    : routeState === "approved"
      ? "approved"
      : "undrawn";

  /** The region's five sentences, resolved once for this render. `consequence`
   *  keeps its empty answer for a spec whose route has not been read, exactly as
   *  the four functions it replaces did. */
  const story = {
    sectionSub: ROUTE_COPY[routeState].sectionSub,
    designHint: ROUTE_COPY[routeState].designHint,
    directHint: ROUTE_COPY[directState].directHint,
    consequence: !routeInfo
      ? ""
      : route === "design"
        ? ROUTE_COPY[routeState].designConsequence
        : ROUTE_COPY[directState].directConsequence,
    label: route === "design" ? ROUTE_COPY[routeState].designLabel : "Send it straight to Build",
  };

  /** Why the send cannot run right now, or null when it can. Never a greyed
   *  button with no reason beside it.
   *
   *  IT NOW COVERS BOTH DISPATCHING ROUTES. "Through Design" used to be
   *  unblockable because it only navigated. On an approved drawing it runs the
   *  same `sendToBuild` the direct route runs, and one dispatch cannot have two
   *  different preconditions on one page depending on which radio is lit.
   *  Handing a spec TO Design still blocks on nothing, because nothing
   *  dispatches.
   *
   *  IT RETURNS ONE SENTENCE NOW, AND THE ONE IT LOST WAS INVENTED HERE. The
   *  second clause read "Build works from a GitHub issue. Open one and this
   *  runs." and hard-disabled the primary on it. `dispatchStudioSession`, the
   *  function this gate protects, never asks for an issue: it selects
   *  `github_issue_url` only to add an optional "Closes #N" line to the work
   *  order (src/lib/studio.functions.ts, the `3-way issue resolution` block),
   *  and it throws for a missing agent, a missing workspace and a held design
   *  gate, never for a missing issue. So the surface was refusing a dispatch
   *  the server would have accepted.
   *
   *  WHAT IT COST, and it is the founder's non-linear ruling in miniature: plan
   *  to build is a first-class route, and ReadyToBuild's own measurement, taken
   *  2026-08-06, is 42 approved specs with exactly ONE issue url
   *  (src/components/build/ReadyToBuild.tsx). This clause turned the route into
   *  a two-step with an external dependency for the other 41. Build itself
   *  never solved it this way: `startBuild` takes `autoCreateIssue` rather than
   *  greying its own button out.
   *
   *  THE MESSAGE IS NOT REMOVED, IT IS DEMOTED. `sendsWithoutIssue` below says
   *  the same fact as a standing note with the same `createIssue` door beside
   *  it, and says what the issue actually buys instead of claiming the send
   *  needs one. The gate that IS real, a drawn screen nobody has judged, still
   *  blocks: the server refuses that one too. */
  const routeBlocker = (): string | null => {
    if (!routeInfo) return null;
    if (!routeSendsToBuild) return null;
    if (routeInfo.gateHolds) return "The drawn screen has to be settled at Design first.";
    /**
     * THE APPROVAL GATE, WHICH THIS PAGE ASSERTED AND DID NOT HOLD.
     *
     * Two surfaces disagreed about whether approval gates a build, and this page
     * argued against itself. The Approve control's own tooltip reads "approve
     * the spec, SO BUILD CAN PICK IT UP", and the Build station honours exactly
     * that: `ReadyToBuild` filters to `status === "approved"`. But this
     * dispatch checked only the design gate, so a person could send a DRAFT
     * straight to Build from here, spend a billed builder run on work nobody
     * had approved, then walk to Build and not find the spec in "ready".
     *
     * The server does not settle it either: `dispatchBuilderMission` never
     * moves `prds.status`, by design, because only the ship stamp does. So
     * approval is purely a human's mark, and the only two places that read it
     * as a gate are the Build station and this tooltip.
     *
     * REFUSING RATHER THAN WARNING, and the friction argument is why. The
     * remedy is the Approve button in the Actions row on this same screen, so
     * the refusal costs one click on a page the user is already looking at.
     * Against that: a build is the most expensive thing this product does
     * unattended, and a governance product that spends money on work its own
     * gate never saw is arguing against itself in the one place it matters.
     *
     * `status` is read off the loaded spec rather than a second query, and an
     * unreadable spec does NOT refuse: a failed read must not masquerade as a
     * governance decision, which is the class of bug this repo has paid for
     * repeatedly.
     */
    const status = prdQ.data?.prd?.status;
    if (status && status !== "approved" && status !== "shipped") {
      return "Approve the spec first. Build only picks up an approved spec, and a run costs money.";
    }
    return null;
  };

  /** True when the send would run with no issue on the spec. A FACT, never a
   *  refusal: what an issue buys is the "Closes #N" line in the pull request
   *  Build opens, so the note below states that and offers the door, and the
   *  primary stays live either way. Read off `routeSendsToBuild` for the same
   *  reason the blocker is: handing a spec to Design dispatches nothing, so
   *  there is nothing for an issue to close. */
  const sendsWithoutIssue = (): boolean =>
    routeSendsToBuild && !routeInfo?.gateHolds && !prdQ.data?.prd?.github_issue_url;

  /**
   * OPEN THE ISSUE, AND THE ONE REFUSAL IT HAS ALREADY HAS A DOOR ON THIS PAGE.
   *
   * `createGithubIssueForPrd` calls `resolveGitHub`
   * (src/lib/discovery.functions.ts), which throws the "GitHub is not
   * connected" refusal on a workspace with no binding. That landed here as a
   * failed receipt and nothing else: no /sync link, no provision path, no way
   * forward from a surface that had just recommended pressing this.
   *
   * The neighbouring dispatch has handled the identical error shape since W5b,
   * and this file already imports `isRepoNotConnectedError` and mounts
   * `RepoGateDialog` for it. Same refusal, same gate, so the answer is the two
   * real paths (connect one on /sync, or provision a private starter repo)
   * rather than a dead sentence. Every other failure is still a receipt,
   * because the gate offers nothing that would help with those.
   *
   * `retry: "issue"` IS THE SECOND HALF, and leaving it out would have made
   * this worse rather than better. The dialog's provision path calls `onRetry`
   * after the repo exists, and `onRetry` was hardwired to `sendToStudio`, so
   * provisioning from a gate this mutation opened would have dispatched a build
   * nobody asked for and still left the issue unopened. The gate now carries
   * which act it interrupted and re-runs that one.
   */
  const createIssue = useMutation({
    mutationFn: () => mCreateIssue({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["prd", id] });
      commit(
        r.cached ? "It was already open" : "You opened the issue",
        // NOT "Send to Build can run now": the send could always run, and
        // saying otherwise was the invented precondition speaking one more
        // time. What changed is what the pull request will carry.
        `#${r.number} is on the repo, and the pull request Build opens will close it.`,
      );
    },
    onError: (e: Error) => {
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message, retry: "issue" });
      else commit("No issue was opened", e.message, true);
    },
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
      // BOTH KEYS, and they do not partial-match. ["prds"] is the list on
      // /plan; ["prd", id] is THIS page's own read, and react-query compares
      // key elements in order, so "prds" never matches "prd". Without the
      // second line the row that survives a save is `prd`, the server copy the
      // panels below are handed: SpecProjectionsPanel gets `prd.title`, the
      // dispatch indicator falls back to it, and both kept printing the title
      // as it was before this save until something else refetched.
      qc.invalidateQueries({ queryKey: ["prd", id] });
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
   *
   * AND IT REFETCHES THE ROW IT JUST CHANGED, which the first version of this
   * control did not. It invalidated ["prds"], the LIST on /plan, and this page
   * reads ["prd", id]. Those two keys do not partial-match: react-query
   * compares key elements in order and "prds" is not "prd", so the spec's own
   * read was never refetched and nothing on the page that just approved the
   * spec moved. The subtitle still read "draft", the primary still offered
   * "Approve the spec", Save was still the secondary, and a receipt directly
   * above all three said "You approved the spec". Three statements about one
   * spec, two of them wrong, on the act this station exists to perform. Every
   * other writer in this file already carried ["prd", id]: `createIssue`,
   * `CriticBadge`'s invalidateKey and `OutcomeContractPanel`'s.
   */
  const approve = useMutation({
    mutationFn: () => mSave({ data: { id, title, body_md: body, status: "approved" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prds"] });
      qc.invalidateQueries({ queryKey: ["prd", id] });
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

  /**
   * State one of four: reading.
   *
   * WHAT WAS HERE, and it was the whole state: `<PageHead title="Spec" />` and
   * nothing else. A bare noun, no verb, no sentence, on the longest read in the
   * product. It said less than the shell's own skeleton would have, and it said
   * it in the slot where the document's TITLE is about to appear, so the first
   * thing a person saw on every cold load was a word that then vanished and was
   * replaced by different words in the same position.
   *
   * `Loading` is the primitive for this and it exists precisely so that the
   * three facts stay apart: Empty says "nothing here", Failed says "we could
   * not find out", and this says "neither is known yet". It also reserves the
   * height, so the page does not jump when the answer lands.
   *
   * NO `working` FLAG. Nobody is reasoning: this is `getPrd`, one row by id, and
   * dressing a database read as an agent at work is the invented status this
   * shell refuses everywhere else.
   */
  if (prdQ.isLoading) {
    return (
      <Surface>
        <Reading>Reading the spec.</Reading>
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
        <div className="flex flex-col gap-mrd-7">
          <PageHeading
            title="The spec did not load."
            sub={(prdQ.error as Error)?.message ?? "No reason was reported."}
          />
          <Actions>
            <Action variant="primary" onClick={() => prdQ.refetch()}>
              Try again
            </Action>
          </Actions>
        </div>
      </Surface>
    );
  }

  if (specMissing || !prdQ.data?.prd) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading
            title="No spec here."
            sub="It was deleted, or it belongs to a workspace you are not in."
          />
          {/* The BORDERED half of the empty pair, because there is no region
              around it to draw a container: the page is this and nothing else.
              The way out is the empty state's own `action` slot rather than a
              second row underneath it. */}
          <NothingHere
            action={
              <Action variant="primary" onClick={() => navigate({ to: "/plan" })}>
                Go to Plan
              </Action>
            }
          >
            Every live spec is listed on Plan.
          </NothingHere>
        </div>
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

  /**
   * THE TWO MEASUREMENTS THE BODY REGION MAKES OF ITSELF.
   *
   * Both read `body`, the live editor state, rather than `prd.body_md`, so they
   * move as the writer types instead of reporting the last save. Both are pure
   * and both live in plan/format.ts with their own tests; the reasoning for the
   * ten-minute budget and for pulling the opening sentence out is written there
   * rather than here, because the numbers are the thing that will be argued
   * with and they should be argued with where they are defined.
   */
  const readLoad = readingLoad(body);
  const firstLine = openingLine(body);

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
          /* THE CONTEXT COLUMN STATES ITS OWN SPACING NOW. `.sp-ctx-row` and
             `.sp-ctx-head` carried the gaps and the rules between groups in the
             retired sheet; Meridian's `CtxHead` and `CtxBody` set no margins at
             all, on purpose, so the column says how its groups are spaced. Same
             shape the ported Learn column uses. */
          <div className="flex flex-col gap-mrd-6">
            <div className="flex flex-col gap-mrd-4">
              <CtxHead>Linked work</CtxHead>
              <CtxBody>
                {/* THE COUNT IS NOT CLAIMED UNLESS IT IS KNOWN.
                  `listTasks` has no failure path anywhere on this page, so a
                  refused read left `tasksQ.data` undefined, `prdTasks` [], and
                  this rail printed "0 tasks on this spec." as a FACT beside a
                  block that printed "No tasks yet." as another one. Two
                  confident statements, both manufactured out of an error nobody
                  handled, on the question this rail exists to answer.
                  primitives.tsx states the rule at <Failed>: "nothing here" and
                  "we could not find out" are different facts and a person acts
                  differently on each. So the count speaks only when the read
                  answered, and the GitHub fact beside it is unaffected either
                  way because it comes off the spec row rather than the tasks. */}
                {tasksQ.isError ? (
                  <span className="text-mrd-fail">The work on this spec did not load.</span>
                ) : tasksQ.isLoading ? (
                  "Reading the work on this spec."
                ) : (
                  <>
                    <Num>{prdTasks.length}</Num> {prdTasks.length === 1 ? "task" : "tasks"} on this
                    spec.
                  </>
                )}{" "}
                {issueMatch ? (
                  <a
                    href={prd.github_issue_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-inherit underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
                    style={{ transitionDuration: "var(--mrd-d-press)" }}
                  >
                    Issue #{issueMatch[1]}
                  </a>
                ) : (
                  "No GitHub issue yet."
                )}
              </CtxBody>
            </div>

            <div className="flex flex-col gap-mrd-4">
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
                the day that exists, not before.

                `.sp-ctx-row` IS GONE AND ITS GEOMETRY IS NOT: flex, 10px gap,
                start-aligned, 8px of vertical padding, row leading at 1.4. The
                class was doing the work; the numbers are the design, so they are
                written out rather than rounded onto a nearby Meridian stop. */}
              <div className="flex w-full items-start gap-2.5 py-2 leading-[1.4]">
                <AgentMark slug="critic" state="quiet" />
                <span>
                  <CriticBadge
                    review={(prd as { critic_review?: CriticReview | null }).critic_review ?? null}
                    target={{ kind: "prd", id }}
                    invalidateKey={["prd", id]}
                  />
                </span>
              </div>
            </div>

            {hasSnapshot ? (
              <div className="flex flex-col gap-mrd-4">
                <CtxHead>Before the crew touched it</CtxHead>
                <CtxBody>
                  {/* It reports through this page's own receipt stack rather
                      than through a toast of its own. See RewindButton. */}
                  <RewindButton prdId={id} hasSnapshot={true} onCommit={commit} />
                </CtxBody>
              </div>
            ) : null}
          </div>
        }
      >
        {/* ONE STACK, ONE GAP. See the note in `errorComponent`: `Region` sets
            no outer space, so the surface states it once here instead of every
            region drawing its own rule and margin. */}
        <div className="flex flex-col gap-mrd-7">
          {/* THE ONE SURFACE IN THE PRODUCT THAT DISPATCHES BUILD WORK AND HAD
              NO LIGHT ON IT.

              `sendToStudio` enqueues a builder run and navigates the reader
              AWAY, and its `AgentPulse` is gated on `sendToStudio.isPending`, so
              it dies at the exact moment `resumeAgentLoop` promotes the run from
              queued to running — the indicator stops when the agent starts.
              `autonomous-work-is-visible.test.ts` names this file in its own
              header as the sharpest case of that defect and then did not pin it,
              because its list is per-SURFACE and plan.spec is not the Plan route
              it lists.

              `station="define"` narrows it to the agents standing at this
              station: unscoped, it would print "Engineer is working on Beacon
              SSO" above a spec editor while nothing about Plan was running,
              which is true at product scope and false where a person is
              standing. Renders nothing when nothing is running. */}
          <CrewWorking station="define" />

          {/* The title is the h1 and it is editable in every view, the way it
              always was. There is no editable-title primitive, so it wears the
              page-title stops and keeps a resting rule to say it can be typed
              in.

              `.sp-title` IS GONE AND ITS TYPE IS NOT: 25px on 1.24 at -0.028em
              in 600, which is the page-title rung. Meridian bridges neither the
              type scale nor the weight scale, so those are written as the values
              they already rendered at rather than rounded to make the port
              tidier. The 56ch here beat `.sp-title`'s own 34ch max and still
              does. */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Spec title"
            className="w-full max-w-[56ch] rounded-none border-0 border-b border-mrd-line-soft bg-transparent px-0 pt-0 pb-1.5 text-mrd-h2 leading-[1.24] font-[600] text-mrd-ink outline-none focus:border-mrd-mute"
            style={{ letterSpacing: "-0.028em" }}
          />
          {/* Two facts, never the same one twice: what state it is in, and when
            its words last changed. A save stamps the second one rather than
            firing a toast that says a thing this line already says.

            THE FIRST FACT WAS THE RAW DATABASE ENUM. It read `{prd.status}`,
            so this line printed "draft · saved 8/6/2026" and "review · saved
            ..." in lowercase, straight out of the column, as the second-highest
            line on the largest surface in the product. One file away, the spec
            ROW on /plan printed "Drafting" and "In review" for the same
            document, through a `specState` helper that was private to that
            file. Same spec, two spellings, one click apart.

            The helper is `specStateWords` in plan/format.ts now, and both
            surfaces read it, so the word cannot drift again. */}
          {/* AND THE DATE WAS THE RAW LOCALE DEFAULT, which is the same defect
            one field along. `toLocaleDateString()` with no options renders
            "7/17/2026" here while every other date this station shows a reader
            is "17 Jul" (/ship's `onDate`, the route line 400 lines below, the
            release document). A numeric slash-date is the format a database
            prints, not the one a document is dated in, and it sat in the
            second-highest line on the largest surface in the product. Same
            options as `onDate`, so the two stations date a thing the same way. */}
          {/* `.sp-subtitle` was 13.5px in the mute ink with 8px above it. */}
          <div className="mt-2 text-mrd-prose text-mrd-mute">
            {specStateWords(prd.status)} · saved{" "}
            <Num>
              {savedAt ??
                new Date(prd.updated_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
            </Num>
          </div>

          {/* The record, in one region, and now ABOVE the actions rather than
            below the handoff. It exists to say the ground under this document
            has moved, and it was rendering after the point where you commit. A
            warning that arrives after the decision is not a warning. It speaks
            or it stays silent; it never introduces itself. */}
          {recordSays ? (
            <Region>
              <RecordSpeaks
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
              </RecordSpeaks>
              {precedent.slice(0, 3).map((p) => (
                <Row
                  key={p.id}
                  tight
                  lead={p.title?.trim() || p.summary}
                  sub={`${LANDED[p.verdict] ?? p.verdict}${p.governing ? " · and it has since been overtaken" : ""}`}
                />
              ))}
            </Region>
          ) : null}

          <Actions>
            {/* APPROVE LEADS WHEN IT IS THE NEXT REAL ACT, and Save steps down to
              secondary. This station exists to produce an approved spec; while
              one is still a draft, saving is housekeeping and approving is the
              thing the loop is waiting for. Once approved, the primary action
              is saving edits again, because there is nothing left to approve. */}
            {/* `Approve`, AND IT IS THE ONLY ONE ON THIS PAGE. Meridian spends
              orchid on one meaning — a person is required — and this control is
              the definition of it here: the spec is written, Build cannot pick
              it up, and nothing moves until somebody presses this. Every other
              control below either saves, opens, records or hands off, and an
              accent that fires on all five stops meaning anything. */}
            {prd.status !== "approved" ? (
              <Approve
                disabled={approve.isPending || save.isPending}
                onClick={() => approve.mutate()}
                title="Save these edits and approve the spec, so Build can pick it up"
              >
                {approve.isPending ? "Approving" : "Approve the spec"}
              </Approve>
            ) : null}
            {/* Save is housekeeping while a spec is a draft and the only act left
              once it is approved, which is why it takes the neutral primary in
              that one state and never the accent: it releases nothing. */}
            <Action
              variant={prd.status === "approved" ? "primary" : "default"}
              shortcut="⌘S"
              disabled={save.isPending || approve.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving" : "Save"}
            </Action>
            {prd.github_issue_url ? null : (
              <Action
                busy={createIssue.isPending}
                onClick={() => createIssue.mutate()}
                // It never opened the route: the route was never shut. The hint
                // says what the issue is actually for, which is the pull request
                // Build opens closing it when the work lands.
                title="Open a GitHub issue for this spec, so the pull request Build opens can close it"
              >
                {createIssue.isPending ? "Creating" : "Create GitHub issue"}
              </Action>
            )}
            {/* `quiet`, which is Meridian's name for what the retired layer called
              `ghost`. Same face, and there is no `ghost` variant to reach for. */}
            <Action
              variant="quiet"
              busy={captureDecision.isPending}
              onClick={() => captureDecision.mutate()}
              title="Put this on the record as a decision"
            >
              {captureDecision.isPending ? "Recording" : "Capture as decision"}
            </Action>
          </Actions>

          {/* THE COMMIT (R10). What you did here, and what it caused. It follows
            the action row that writes most of these, so the consequence lands
            where the click did. It appears only once you have acted, and a
            failed write lands in the same place wearing its failure rather than
            a success shape. */}
          {receipts.length > 0 ? (
            <Region title="What you did here">
              {receipts.map((r) => (
                <Receipt
                  key={r.key}
                  verb={r.verb}
                  consequence={r.consequence}
                  time={r.at}
                  failed={r.failed}
                />
              ))}
            </Region>
          ) : null}

          {/* ================================================================
            THE BODY. The one thing on this page that is the subject rather
            than a reading of it, and it is on screen whatever else you have
            open. Writing and reading are a STATE of this document, picked
            here with a radio group, not two of six page-level tabs: a tab
            strip says "these are different places", and these are one place
            in two lights.
            ================================================================ */}
          <Region
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
                // `mode` IS REQUIRED IN MERIDIAN, and it is the fix rather than a
                // new prop to fill in: `one` renders a radio group with one tab
                // stop and arrow keys inside it, where the retired default put
                // `aria-pressed` on both buttons and announced two independent
                // toggles that never said picking one unpicks the other.
                mode="one"
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
                onChange={setPane}
              />
            </Actions>

            {/* ================================================================
              WHETHER THIS DOCUMENT CAN BE READ IN ONE SITTING, AND WHAT A
              READER MEETS FIRST. Two facts, both derived from the words already
              on screen, and both are the document research's hardest findings
              turned into something a writer can act on.

              ONE. A long artifact posted for people to read later is NOT read.
              A Stripe PM on the practice: "you send it into the Slack ecosystem
              and everyone goes, 'Please give feedback.' You have so much going
              on... You'll be lucky to maybe get a response." What replaced it is
              the forced silent read, on the clock, in the room: "I want no
              upfront explanation. I want 10 minutes of quiet reading time, and
              then we can come back together." So the job of this document is to
              be readable straight through in ten minutes with no narrator, and
              the constraint that follows is a LENGTH BUDGET rather than better
              navigation. See `readingLoad` for the arithmetic and the 220 wpm.

              TWO. The opening sentence is the only text on a silently-read
              document that is guaranteed to be read. A famed operator on written
              argument spent one week of three on the first paragraph of a brief:
              "If I could write that first paragraph really well, the chance I
              would win the case would go through the roof." So the writer is
              shown the exact sentence a reader will meet, pulled out of the
              document rather than described.

              IT JUDGES NOTHING ELSE. There is no score, no grade and no advice
              about the prose: two measurements and the budget they are measured
              against. Both panes get them, because the length of the thing you
              are writing is not a property of whether you are writing or reading
              it, and a budget you only see in preview is a budget you find out
              about too late.
              ================================================================ */}
            {readLoad.words > 0 ? (
              <Line
                label={
                  <>
                    <Num>{readLoad.words.toLocaleString()}</Num> words, about{" "}
                    <Num>{readLoad.minutes}</Num> {readLoad.minutes === 1 ? "minute" : "minutes"} to
                    read.
                  </>
                }
                sub={
                  readLoad.over ? (
                    <>
                      That is <Num>{readLoad.overBy.toLocaleString()}</Num> past what fits in the
                      ten minutes a reader gets for a silent read, so this one gets skimmed or
                      deferred rather than read. Cutting is the fix; navigation is not.
                    </>
                  ) : (
                    "It fits the ten minutes a reader gets for a silent read, which is the only way a document this long actually gets read."
                  )
                }
              >
                {/* `warn` BECAME `hold`, and the amber is right here for the
                reason the rename gives: this is a condition the document does
                not yet meet and cutting is what clears it. NOT `fail` — red
                reports a settled outcome, and a draft that is currently too long
                has not failed at anything. */}
                <Value tone={readLoad.over ? "hold" : "quiet"}>
                  {readLoad.over ? "Over one sitting" : "One sitting"}
                </Value>
              </Line>
            ) : null}

            {firstLine ? (
              <Line
                label="The line a reader meets first"
                // Quoted rather than paraphrased, because the whole point is that
                // this is the writer's own sentence seen the way a stranger meets
                // it, with no title and no preamble around it.
                sub={`"${firstLine}"`}
              />
            ) : null}

            {pane === "write" ? (
              <>
                {/* STILL A RAW CONTROL, AND THE REASON SURVIVED THE PORT INTACT.
                  The assist mutation reads the SELECTION out of this element, so
                  it needs a ref, and Meridian's `Textarea` types its props as
                  `TextareaHTMLAttributes`, which does not include one — passing
                  a ref would not typecheck even though React 19 would forward
                  it. So this wears the field paint rather than the component.
                  Convert it the day that component types a ref.

                  THE PAINT IS MERIDIAN'S FIELD, to the property: the sink
                  ground, the field border stepping up on focus, the control
                  radius, 13.5px on 1.55 with 10px by 12px of padding and an
                  80px floor. `.sp-textarea` is gone; nothing it drew is.

                  IT HOLDS THE SAME MEASURE THE READ STATE HOLDS. The editor ran
                  full width while Read set a measure, so switching states
                  rewrapped every line of the document and a writer lost the
                  place they were looking at. One width, two states. */}
                <textarea
                  ref={taRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  aria-label="Spec body, markdown"
                  spellCheck={false}
                  rows={26}
                  className="w-full min-h-20 resize-y rounded-mrd-ctl border border-mrd-field bg-mrd-sink px-3 py-2.5 text-mrd-prose leading-[1.55] text-mrd-ink transition-colors placeholder:text-mrd-faint focus:border-mrd-field-focus focus:outline-none"
                  style={{
                    fontFamily: "var(--mrd-mono)",
                    maxWidth: PROSE_MEASURE,
                    transitionDuration: "var(--mrd-d-press)",
                  }}
                />
                {/* `Actions` SETS NO OUTER MARGIN, deliberately: the retired
                    `.sp-acts` baked `margin-top: 16px` into the component, so a
                    caller who wanted it elsewhere could not say so. 16px is what
                    both of this file's mid-content action rows already stood at,
                    and `mrd-5` is that number, so the space is preserved and now
                    has an owner. */}
                <Actions className="mt-mrd-5">
                  {ASSIST_ACTIONS.map((a) => (
                    <Action
                      key={a}
                      variant="quiet"
                      busy={assist.isPending}
                      onClick={() => assist.mutate(a)}
                    >
                      {ASSIST_LABEL[a]}
                    </Action>
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
                  previously drew nothing. That is the correct behaviour (there
                  IS something to assess) but it is a behaviour change and the
                  sentence a skimmer reads has to say so. Its other visible
                  effect: scores RISE for specs whose contract states dimensions
                  the body does not, so a spec that read "Early" before this pass
                  can read "Developing" today with nothing on screen explaining
                  the jump. */}
                <DesignReadinessPanel body={readinessText} />
              </>
            ) : (
              <>
                {/* THE DOCUMENT, WITH ITS CITATIONS AS CITATIONS. This rendered
                  `[1]` and `[2]` as literal characters until 2026-08-10: the
                  component map overrode p / h1 / ul / li and nothing anywhere
                  handled a marker, so the one artifact in the product whose
                  claim is that its assertions carry evidence printed that
                  evidence as punctuation. `splitCitationMarkers` had been
                  sitting in plan/format.ts, written and tested, with no
                  consumers at all. See SpecProse for what a marker is allowed to
                  claim, and for why a marker with nothing behind it renders as
                  plain text rather than as a chip that promises an excerpt it
                  does not have. */}
                {body.trim() ? (
                  <SpecProse body={body} citations={citations} />
                ) : (
                  <NothingYet>Nothing is written yet. Switch to Write and start it.</NothingYet>
                )}
                {/* A document carries its own references, so they read with it. */}
                {citations && citations.length > 0 ? (
                  // 20px, which is what `--sp-space-5` resolved to. Meridian's
                  // scale steps 16 to 24 and neither is this number, so it is
                  // written out rather than rounded: today's design is the floor.
                  <div className="mt-[20px]">
                    <CitationsCard citations={citations} />
                  </div>
                ) : null}
              </>
            )}
          </Region>

          {/* WHERE THIS SPEC GOES NEXT. The one region on the page that hands the
            work off, and it asks the question rather than answering it with
            whichever button happened to be here. Directly under the body on
            purpose: you settle the document, then you say where it goes, and
            everything below this is either a reading of the spec or a record
            about it rather than an exit from it. */}
          <Region
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
                // Derived, like every other sentence in this region, and now out
                // of the SAME table as its five neighbours. A constant here once
                // promised that "either way the choice goes on this spec's record"
                // directly above a primary that, on an approved drawing, writes no
                // route event at all; see `ROUTE_COPY`.
                story.sectionSub
              )
            }
          >
            {routeQ.isLoading ? (
              <Reading>Reading what has been drawn for this spec.</Reading>
            ) : routeQ.isError ? (
              // The LINE half of the failed-read pair: this sits under a region
              // heading that already frames it, and the standard caps a region at
              // one bordered box.
              <ReadFailedLine onRetry={() => void routeQ.refetch()}>
                Could not read this spec's route. {(routeQ.error as Error).message}
              </ReadFailedLine>
            ) : (
              <>
                <Line label="Route" sub={story.consequence}>
                  <Choices<DesignRouteChoice>
                    // Mutually exclusive, so it is a radio group and says so.
                    mode="one"
                    label="How this spec reaches Build"
                    value={route}
                    options={[
                      {
                        id: "design",
                        label: "Through Design",
                        // Derived, exactly like its neighbour. A constant here
                        // promised a drawing and a judgment on a spec that had
                        // already had both, under a button reading "Send it to
                        // Build"; see `ROUTE_COPY`.
                        title: story.designHint,
                        // `checkingRepo` joins the pair for the same reason the
                        // other two are here: a send is in flight, and moving the
                        // radio under it would change the label and the sentence
                        // describing a dispatch already on its way.
                        disabled: chooseRoute.isPending || checkingRepo || sendToStudio.isPending,
                      },
                      {
                        id: "direct",
                        label: "Straight to Build",
                        title: story.directHint,
                        // The design gate, unchanged and enforced here too: a
                        // drawing that exists and is not approved is a call
                        // somebody owes, and skipping the step is not a way to
                        // stop owing it. The server refuses this as well, so a
                        // stale page cannot get past it either.
                        disabled:
                          routeInfo?.gateHolds ||
                          chooseRoute.isPending ||
                          checkingRepo ||
                          sendToStudio.isPending,
                      },
                    ]}
                    onChange={setRoutePick}
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

                {/* `Actions` SETS NO OUTER MARGIN, deliberately: the retired
                    `.sp-acts` baked `margin-top: 16px` into the component, so a
                    caller who wanted it elsewhere could not say so. 16px is what
                    both of this file's mid-content action rows already stood at,
                    and `mrd-5` is that number, so the space is preserved and now
                    has an owner. */}
                <Actions className="mt-mrd-5">
                  {/* THE PRIMARY SAYS WHAT THE PAGE JUST SAID. On an approved
                    drawing it dispatches instead of writing a route, because
                    the route was chosen and Design honoured it; see
                    `designIsDoneAndApproved`. Every other state clicks exactly
                    as it did: pick, record, then navigate or send. The one
                    other change is `checkingRepo` in the pending pair, which
                    covers the window the repo pre-check opens. */}
                  {/* `Action`, NOT `Approve`, and the two are one region apart on
                    purpose. Orchid is spent once on this page, above, on the
                    control that RELEASES the spec. This one hands finished work
                    on, which is a handoff rather than a release, and a second
                    accent on one surface is how the first one stops meaning
                    anything. */}
                  <Action
                    variant="primary"
                    disabled={
                      chooseRoute.isPending ||
                      checkingRepo ||
                      sendToStudio.isPending ||
                      routeBlocker() !== null
                    }
                    title={routeBlocker() ?? undefined}
                    onClick={() => {
                      if (route === "design" && designIsDoneAndApproved) void sendToBuild();
                      else chooseRoute.mutate(route);
                    }}
                  >
                    {chooseRoute.isPending || checkingRepo || sendToStudio.isPending
                      ? "Sending"
                      : story.label}
                  </Action>
                </Actions>

                {/* NEVER A DEAD END. When the send cannot run, the reason is on
                  the page under the button rather than hidden in a title
                  attribute a keyboard user never sees, and it names who acts
                  next.

                  ONE BLOCKER AND ONE NOTE, WHERE THERE WERE TWO BLOCKERS.
                  `routeBlocker` used to return two sentences and the second was
                  invented by this surface: the dispatch has never needed a
                  GitHub issue (see `routeBlocker` and `sendsWithoutIssue`). Its
                  door is not lost, it is moved into the note below, which says
                  the same fact without disabling the send and runs the same
                  `createIssue` mutation the action row runs. So there is still
                  one writer and two ways to reach it.

                  THE BRANCHES MIRROR THE TWO PREDICATES IN ORDER, and the
                  blocker outranks the note: a spec whose drawing is unjudged
                  cannot dispatch at all, so telling it about an issue would be
                  answering a question nobody can act on yet. A third reason
                  added to `routeBlocker` needs a third door here. */}
                {routeBlocker() ? (
                  // The BARE half, because this sits inside a region that already
                  // frames it. It is not literally an "empty" state — it is the
                  // reason a send cannot run — but the shape is the same one the
                  // retired `Empty` was drawing here: a sentence with the way out
                  // beside it, no box of its own.
                  <NothingYet
                    action={
                      <Action
                        onClick={() =>
                          void navigate({ to: "/design", search: { focus: id } as never })
                        }
                      >
                        Open it on Design
                      </Action>
                    }
                  >
                    {routeBlocker()}
                  </NothingYet>
                ) : sendsWithoutIssue() ? (
                  <Line
                    label="No GitHub issue is open for this spec"
                    sub="The send runs without one: Build works from the spec itself. What an issue buys is the Closes line in the pull request, which is what makes the issue close itself when the work lands."
                  >
                    <Action busy={createIssue.isPending} onClick={() => createIssue.mutate()}>
                      {createIssue.isPending ? "Creating" : "Create GitHub issue"}
                    </Action>
                  </Line>
                ) : null}
              </>
            )}
          </Region>

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
          <Region title="What this spec becomes" sub={lensInfo.sub}>
            <Actions>
              <Choices<Lens>
                // Four readings, one open at a time: a radio group, not four
                // toggles each announcing itself independently.
                mode="one"
                label="Which reading of this spec"
                value={lens}
                options={LENS_DISPLAY.map((l) => ({ id: l.id, label: l.label, title: l.title }))}
                onChange={setLens}
              />
            </Actions>

            {/* ONE GROUP, so the panels sit at component distance from one
              another instead of each drawing its own section rule and reading
              as an unrelated region. Every panel here already carries its own
              container, so the gap is all the separation they need. */}
            {/* 20px, which is what `--sp-space-5` resolved to. Meridian's scale
              steps 16 to 24 and neither is this number, so it is written out
              rather than rounded down: today's design is the floor. */}
            <div className="mt-mrd-4 grid gap-[20px]">
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
          </Region>

          {/* WHERE THE CREW IS. generateTaskGraph is the Planner by its own
            system prompt, so the mark is attribution, and it RUNS while the
            work runs and stops the moment it does. Remove the agents from this
            product and this block loses both its mark and its only action. */}
          <Region
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
            /* `act`, NOT `toggle` AND NOT `goTo`, AND THE THREE ARE NOT
             INTERCHANGEABLE. This control dispatches the Planner: it reveals
             nothing, so `toggle`'s unconditional `aria-expanded` would tell
             every screen reader this button expands something it does not, and
             it navigates nowhere, so a reader taking `goTo` for a link would not
             expect to have spent credits.

             `acting` IS THE HALF `more`/`onMore` COULD NOT SAY. The retired pair
             faked the in-flight state by swapping the LABEL to "Working" while
             the button stayed live and the handler guarded the second press
             internally — so a second click did nothing and nothing said why.
             Here the work is announced with `aria-busy`, the control is
             disabled, and the region's own `sub` already carries the Planner's
             pulse, which is the same fact told once instead of twice. */
            act="Break it into tasks"
            acting={genTasks.isPending}
            onAct={() => genTasks.mutate()}
          >
            {/* A FAILED READ MUST NEVER RENDER AS AN EMPTY STATE, and this is the
              P1 on the surface. The branch was `isLoading ? null : length === 0
              ? <Empty>` with no error arm at all, so any failure of `listTasks`
              printed "No tasks yet. Break the spec into tasks when it is settled
              enough to build." That sentence is an INSTRUCTION built on a claim
              the page could not make: it tells a person to press the Planner on
              a spec that may already carry a full graph, and pressing it deletes
              every generated task and writes a new set (`generateTaskGraph`
              deletes where `seq is not null`). So the honest cost of this defect
              was not a wrong word, it was a destructive action recommended on
              the strength of an unhandled error.
              The retry is the read's own, not the Planner's: nothing needs to be
              regenerated, the list simply has to be fetched again. */}
            {tasksQ.isError ? (
              <ReadFailedLine onRetry={() => void tasksQ.refetch()}>
                The work on this spec did not load, so nothing here can say whether it has any.{" "}
                {(tasksQ.error as Error)?.message ?? "No reason was reported."}
              </ReadFailedLine>
            ) : tasksQ.isLoading ? (
              <Reading>Reading the work this spec implies.</Reading>
            ) : orderedTasks.length === 0 ? (
              <NothingYet>
                No tasks yet. Break the spec into tasks when it is settled enough to build.
              </NothingYet>
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
                            {/* `--mrd-hold`, the amber. A task flagged at risk has
                            not failed at anything, so red would report an
                            outcome that has not happened; amber says the thing
                            is held up and not on the reader, which is what a
                            risk flag on a sequenced task means. The retired
                            `.sp-warn` was a SIXTH status word in a system whose
                            whole colour law is that there are five. */}
                            <span className="text-mrd-hold" title={t.risk}>
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
          </Region>

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
          <Region
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
                    and 14 of the 20 specs that BOTH carry a bet and hold
                    lineage rows have more than one parent kind. (Re-measured
                    2026-08-06. An earlier draft named that 14 against "the 20
                    specs that have lineage rows at all", which is the wrong
                    population for a right number: 41 specs hold lineage rows in
                    total. 20 is the set this sentence actually argues about,
                    the ones carrying a bet AND a chain, which are the only
                    specs that render it.) So on most of the specs that render
                    this sentence, an inflated number was being pinned on the
                    bet. The subject is back on the spec, where the count is
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
                  It was not invented here. It traces back through{" "}
                  <Num>{provQ.data!.node_count}</Num>{" "}
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
              "the bet did not come back" on any later refetch failure, a false
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
                        renders `<StatusPill status={o.status} />` for every row
                        that HAS a status, the pill sitting inside an
                        `{o.status ? ... : null}` guard, and StatusPill falls
                        back to `label: status` for a value STATUS_META does not
                        know, the identical fallback `statusLabel` takes. (An
                        earlier draft of this note said "on EVERY row" and
                        skipped the guard. It changes nothing here, since this
                        branch is itself gated on `sourceBet.status`, but a
                        comment that overstates what another file does is the
                        defect this pass exists to stop writing.) So Decide
                        displays "committed", in
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
                <Reading>Reading the bet this spec was written for.</Reading>
              ) : oppsQ.isError ? (
                <ReadFailedLine onRetry={() => void oppsQ.refetch()}>
                  This spec names a bet and the bet did not come back.{" "}
                  {/* Optional chain and a fallback, the convention this file
                    already uses at both of its other failure sites: the route's
                    own `errorComponent` and the `prdQ` spec-read Failed, each
                    printing the same `?.message ?? "No reason was reported."`.
                    Cited by symbol on purpose. An earlier draft said "the spec
                    read two hundred lines up" and the nearer of the two is
                    about 870 lines up, which is what a line count is worth in a
                    file this size. A rejection that is not an Error has no
                    `.message`, and reading it off `undefined` would crash the
                    region that exists to report the failure. */}
                  {(oppsQ.error as Error)?.message ?? "No reason was reported."}
                </ReadFailedLine>
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
                <NothingYet>
                  This spec names a bet the ranking did not return. It was deleted, it belongs to a
                  workspace you are not in, or it falls outside the 500 highest-scoring bets this
                  read covers.
                </NothingYet>
              )
            ) : null}

            {provQ.isLoading ? null : provQ.isError ? (
              <ReadFailedLine onRetry={() => provQ.refetch()}>
                The chain did not come back.
              </ReadFailedLine>
            ) : signalCount === 0 ? (
              // Two different true sentences, because "written directly" is a
              // claim about the spec's origin and it is FALSE the moment the
              // opportunity foreign key is set. Keyed on the key itself rather
              // than on the fetched row, so an unreachable bet still gets the
              // honest half.
              <NothingYet>
                {specOpportunityId
                  ? "The chain stops at the bet. Nothing a customer said is linked to it yet."
                  : "Nothing upstream. This one was written directly rather than raised by something a customer said."}
              </NothingYet>
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
          </Region>
        </div>
      </Surface>

      <RepoGateDialog
        open={repoGate !== null}
        prdId={id}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        // Re-run the act the gate interrupted, not a fixed one. `onRetry` fires
        // after the provision path creates the repo, so a gate opened by the
        // issue door must open the issue and a gate opened by the send must
        // send. See `repoGate`.
        onRetry={() => {
          if (repoGate?.retry === "issue") createIssue.mutate();
          else sendToStudio.mutate();
        }}
        // AND THE DIALOG HAS TO SAY THE SAME THING `onRetry` DOES. Branching
        // the retry alone left every sentence inside the gate written about the
        // dispatch: it was titled "No repo to build in", it promised "the
        // dispatch retries automatically", and its provision toast read "Build
        // dispatched on the fresh repo" on a path that opens an issue and
        // dispatches nothing. That is the same shape as the finding that put
        // the door here. This field and the branch above read the same value,
        // so they cannot drift apart.
        act={repoGate?.retry ?? "dispatch"}
      />
    </>
  );
}
