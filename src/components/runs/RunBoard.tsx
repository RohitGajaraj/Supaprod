/**
 * The board. Runs, laid out by what each one is doing right now.
 *
 * The founder asked for it in these words (2026-07-29): "Somewhere on the
 * navigation plane should we have something like a status or a dashboard? ...
 * it should be like a scrum board or Kanban board ... It is just like the
 * canvas where I can see what is happening ... what is moving, what is
 * working, what is parked for next thing."
 *
 * The six answers for THIS view live in the route's file header, beside the
 * six for the list, because they are two views of one surface and answering
 * them twice in two places is how the two drift. What is recorded HERE is the
 * craft: the arithmetic behind the layout, and the two things this board
 * refuses to draw.
 *
 * -------------------------------------------------------------------
 * THE COLUMNS ARE WORK STATE, NOT LIFECYCLE STAGE.
 *
 * Five columns, and every one of them maps 1:1 onto a state `runState()`
 * already computes for the list. That is deliberate and it is the whole
 * reason `run-state.ts` exists: a run that reads "Working" in the list and
 * sits under "Done" here would destroy trust in both views at once, and two
 * copies of a status mapping drift on the first status the engine adds.
 *
 *   In plan        queued        the mission is created and nobody has it yet
 *   Working        running       an agent has it and no gate is pending
 *   Waiting on you gate          a pending approval, or blocked/proposed
 *   Done           completed
 *   Stopped        failed / halted / cancelled / completed_with_failures
 *
 * The SEVEN LIFECYCLE STAGES are not here and must not be. They describe the
 * inside of one run and they are drawn by the stage strip on the run itself.
 * A board of five work states beside a strip of seven stages is one product
 * with two answers to "where is this".
 *
 * -------------------------------------------------------------------
 * THE ROADMAP IS NOT ON THIS BOARD, AND THAT IS A DECISION.
 *
 * The ask said "what is in the roadmap". A roadmap item is an `opportunities`
 * row carrying `roadmap_bucket` / `roadmap_outcome`. It is NOT a run: nothing
 * has been dispatched, no agent holds it, it has no steps, no cost and no
 * gate. Putting those rows in a sixth column would put two different objects
 * in one row of columns, and then every count on the board means "runs, plus
 * some things that are not runs" and no number here can be read at face
 * value. A count that needs a footnote is worse than no count.
 *
 * So the board says once, in words, where the roadmap actually lives
 * (`/plan?view=roadmap`, which is where `/roadmap` has redirected since the
 * IA consolidation) and holds runs only.
 *
 * -------------------------------------------------------------------
 * IT DOES NOT SCROLL SIDEWAYS, AND HERE IS THE ARITHMETIC.
 *
 * Horizontal scrolling was named as a pain point twice, so "five columns and
 * a scrollbar" was never available. The width a board actually gets:
 *
 *   window 1440 -> rail 236 -> work 1204 -> minus 40px gutters = 1124
 *   window 1366 -> rail 236 -> work 1130 -> minus 40px gutters = 1050
 *   window 1280 -> rail 236 -> work 1044 -> minus 40px gutters =  964
 *   window 1100 -> rail 236 -> work  864 -> minus 40px gutters =  784
 *
 * A card is a 22px mark, a 12px gap and 24px of padding, so a column of W
 * gives W-58 to the title. Below about 200px that is under twenty characters
 * before the ellipsis, which is not a card, it is a hint. So:
 *
 *   at or above 1040px of board  five columns, 200px or wider   (1440, 1366)
 *   below it                     three columns, and the two settled states
 *                                wrap to a second row           (1280, 1100)
 *   below 560px                  one column
 *
 * The wrap point is chosen, not inherited: at three across the break falls
 * exactly between the three live states and the two settled ones, so a narrow
 * screen reads "here is what is happening" then "here is what is finished".
 * `auto-fit` was rejected for this reason. It would put four columns and a
 * lonely fifth at 1280, which is a reflow artifact rather than a layout.
 *
 * It asks its OWN width (`container-type: inline-size`), never the window's,
 * per the standard's adapt-by-container law.
 *
 * AN EMPTY COLUMN GIVES ITS ROOM BACK. At five across, a column with nothing
 * in it takes a fraction of a track instead of a whole one. An empty "Waiting
 * on you" is the best state this product has, and the best state should cost
 * the least space and carry the least colour, not sit there as a wide grey
 * hole that reads like a failed render.
 *
 * -------------------------------------------------------------------
 * COLOUR ARRIVES ONLY WHEN SOMETHING IS HAPPENING.
 *
 * Every card sits on one ground and the MARK carries the state, so a done card
 * is quiet because its mark is neutral, a working one is azure, a queued one is
 * amber and a waiting one is orchid. "Waiting on you" is the one place a HEADING
 * takes a hue: its name, its count and its rule go orchid, and only while it
 * holds something. Exactly ONE card's mark moves, the one that has been waiting
 * longest, because a dozen of them in unison stops the motion meaning "look
 * here". Everything behind it wears the same orchid at rest.
 *
 * WHAT CHANGED HERE ON THE MERIDIAN PORT, said plainly, because the paragraph
 * above used to describe the opposite assignment. A working card's mark used to
 * carry ITS AGENT'S STAGE HUE, which spent seven colours on category and left
 * the reader unable to tell "azure because Engineer" from "azure because it is
 * running". Identity is shape now, status is hue, and the queued column stopped
 * being a faded neutral that read as a plain count.
 *
 * Styles ship with the component rather than in `src/styles/`, because a
 * container query cannot be written as an inline style and this board is the
 * only thing in the product that needs one. `href` + `precedence` is React
 * 19's own hoisting contract; where it is not honoured the tag still renders
 * in place and the rules still apply, so it degrades to working.
 *
 * -------------------------------------------------------------------
 * PORTED TO MERIDIAN 2026-08-15, and what that changed.
 *
 * Every value in the sheet below was a `--sp-*` token, which meridian.css calls
 * life support: "no new surface may use it, every migrated surface drops it".
 * `--sp-*` is currently aliased onto `--mrd-*`, so the board already inherited
 * Meridian's palette and looked broadly right; that alias is a floor, and a port
 * that stopped there would have kept the indirection and none of the components.
 * The sheet now names `--mrd-*` directly. Where a step had no exact twin the
 * nearest Meridian stop was taken rather than a literal pixel written in, and
 * the two that moved are the card gap (8px to 6px) and the wrapped-row gap
 * (32px to 40px). Meridian's ramp GROWS on purpose, so the gap between groups is
 * always visibly larger than the gap within one, and both moves are in that
 * direction.
 *
 * THE CARD IS NO LONGER THE SHELL'S `Cell`. The reason is already recorded
 * below: `Cell`'s recessed tone is built for a recess sitting on already-raised
 * ground and this board sits on the canvas, so the settled columns read as a
 * failed render. `RunCard` in run-parts.tsx is the same two-line shape drawn on
 * one ground, and it carries `mrd-focus-inset` because a column clips.
 *
 * THE MARK CARRIES A DIFFERENT THING NOW, and this is the substantive change.
 * The shell's `AgentMark` painted the agent's LOOP STAGE as the hue, so a board
 * of runs came out a stage rainbow and the work state was left to opacity.
 * Meridian assigns it the other way round: identity is shape, status is hue. The
 * founder's 2026-07-30 ruling that this board should colour by status is
 * therefore no longer a board-only exception; it is what the system does
 * everywhere, and the board is simply the first place it was asked for.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";

import type { StudioSessionListItem } from "@/lib/studio.functions";
import { stripAutoPrefix } from "@/components/plan/format";
import {
  completionEvidence,
  COMPLETION_EVIDENCE_LABEL,
  COMPLETION_EVIDENCE_REASON,
} from "@/lib/build/verification";
import { RecordStatus } from "@/components/meridian/RecordsTable";
import { Actor, RunCard, RunMark, type RunMarkState } from "./run-parts";
import { Door, Figure } from "@/components/meridian/surface-parts";
import { actorName, actorSlug, actorVerb, ago, runState, type RunState } from "./run-state";

const BOARD_CSS = `
.rb-canvas { container-type: inline-size; }

.rb-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
}
.rb-note {
  font-size: var(--mrd-t-base);
  line-height: var(--mrd-lh-snug);
  color: var(--mrd-mute);
  max-width: var(--mrd-measure);
}
/* The one address in this paragraph. A dotted rule that goes solid on hover is
 * the house's quiet affordance, and it is written here rather than reached for
 * from run-parts because a router <Link> renders its own anchor. */
.rb-note a {
  color: var(--mrd-body);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--mrd-line);
  text-underline-offset: 3px;
  transition: color var(--mrd-d-press) var(--mrd-ease);
}
.rb-note a:hover {
  color: var(--mrd-ink);
  text-decoration-style: solid;
  text-decoration-color: var(--mrd-edge);
}

/* Three across is the base, so the narrow reading is the one that needs no
 * query to be correct. Row gap is the between-groups value; at five across
 * there is only one row and it never shows. */
.rb-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mrd-s7) var(--mrd-s4);
  align-items: start;
  margin-top: var(--mrd-s5);
}
@container (max-width: 560px) {
  .rb-board { grid-template-columns: minmax(0, 1fr); }
}
/* --rb-cols is computed per render from the live counts: a populated column
 * takes a full track, an empty one takes a fraction of one with a floor so it
 * never squeezes its own heading. */
@container (min-width: 1040px) {
  .rb-board { grid-template-columns: var(--rb-cols); }
}

.rb-col { min-width: 0; }
.rb-col-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mrd-s3);
  padding-bottom: 9px;
  margin-bottom: var(--mrd-s4);
  border-bottom: 1px solid var(--mrd-line-soft);
}
.rb-col-name {
  font-size: var(--mrd-t-label);
  font-weight: var(--mrd-w-medium);
  color: var(--mrd-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rb-col-count {
  flex: none;
  font-family: var(--mrd-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--mrd-t-data);
  color: var(--mrd-mute);
}
/* THE ONE CALL IN FRONT OF YOU. Orchid, and only while the column holds
 * something, which is what makes an empty "Waiting on you" the quietest thing on
 * the board rather than a wide grey hole.
 *
 * This is the one place a heading takes a hue, and it is the one heading that
 * means "a person is required" rather than naming a category. Nothing else on
 * this board is coloured by its column: the marks carry state, and a column
 * tinted to repeat what its own heading says is the redundant-writing ban
 * wearing a colour. */
.rb-col[data-calling="true"] .rb-col-head {
  border-bottom-color: color-mix(in oklab, var(--mrd-you) 45%, transparent);
}
.rb-col[data-calling="true"] .rb-col-name,
.rb-col[data-calling="true"] .rb-col-count {
  color: var(--mrd-you);
}

.rb-cards {
  display: flex;
  flex-direction: column;
  gap: var(--mrd-s3);
  min-height: 26px;
}
/* The count of what is hidden IS the control that reveals it. */
.rb-rest {
  font-family: var(--mrd-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--mrd-t-data);
  color: var(--mrd-mute);
  padding: 4px 6px;
  margin-top: 2px;
  align-self: flex-start;
  background: none;
  border: 0;
  border-radius: var(--mrd-r-xs);
  cursor: pointer;
  font-weight: inherit;
  transition:
    color var(--mrd-d-press) var(--mrd-ease),
    background-color var(--mrd-d-press) var(--mrd-ease);
}
.rb-rest:hover {
  color: var(--mrd-ink);
  background: var(--mrd-hover);
}
/* NO INNER SCROLL. An opened column grows and the page scrolls, one scroll
 * context for the whole surface.
 *
 * The first version of this capped the column and scrolled inside it, to stop
 * eighteen cards making the board tall while four columns sat empty. The
 * founder caught it immediately: "can we avoid a scroll and just give the
 * seamless experience rather than having the scroll." He is right, and the
 * reason is worse than the whitespace it was avoiding. A scroll container
 * inside a scrolling page means the wheel does two different things depending
 * on which pixel the pointer is over, and inside the summoned panel the sheet
 * already scrolls, so it was a scroll inside a scroll inside a page. Someone
 * reaching the bottom of a column would have found the page had not moved.
 *
 * The tall column is the honest shape: you asked to see eighteen things, and
 * eighteen things are tall. The columns still narrow when empty (--rb-cols),
 * so the board keeps its shape rather than turning into one wide list. */
.rb-cards {
  min-width: 0;
}
`;

/** Left to right: not started, moving, stopped for you, finished, stopped for
 *  its own reasons. The first three are live and the last two are settled,
 *  which is the seam the three-across wrap falls on.
 *
 *  EVERY CARD IS THE SAME GROUND, and the first draft was wrong about this.
 *  It gave the settled columns Cell's `recessed` tone, which was measured on
 *  screen and is unusable here: `--sp-sink` is #0d0d10 against a `--sp-bg` of
 *  #0b0b0d, two steps of 255, so eight Done cards read as a failed render
 *  rather than as quiet ones. The tone is built for a recess sitting on
 *  already-raised ground (the record, a gate detail); the board sits directly
 *  on the canvas. Reported as a finding rather than worked around with a
 *  literal colour, which is what the token layer exists to prevent.
 *
 *  It is also the more faithful reading of the law: state is never the card,
 *  it is the mark. A done card is quiet because its mark is idle, a working
 *  one carries its stage hue, a waiting one is ember. The column heading above
 *  it already says which state it is in, so tinting the card to say it again
 *  is the redundant-writing ban wearing a colour. */
const COLUMNS: { state: RunState; name: string }[] = [
  { state: "queued", name: "In plan" },
  { state: "working", name: "Working" },
  { state: "gate", name: "Waiting on you" },
  { state: "done", name: "Done" },
  { state: "stopped", name: "Stopped" },
];

/** Collapsed, a column shows this many. The board opens short for the same
 *  reason the list does: a surface that only grows is not designed. */
const PER_COLUMN = 6;

/** The holder in object position ("queued for the crew"), where actorName is
 *  written for subject position ("The crew finished"). Branching on `kind` the
 *  way actorName does, rather than lowercasing its output, because Engineer is
 *  a name and "queued for engineer" is a typo with extra steps. */
function holderPhrase(s: StudioSessionListItem): string {
  return s.kind === "build" ? actorName(s.kind) : "the crew";
}

/**
 * ONE second line per card, and a DIFFERENT fact in every column, because a
 * uniform template would say the same thing five times. What each column's
 * reader actually wants to know: who it is queued for, how far it has got,
 * how many calls are stacked on it, whether the Done claim is backed, and
 * where it stopped.
 *
 * EVERY LINE HERE IS BUDGETED, not guessed. A card gives its text the column
 * width minus 58 (24 padding, a 22px mark, a 12px gap), so the tightest real
 * case is 142px at five across on a 1366 window. Measured at 12.5px:
 * "Engineer is writing the change, step 4 of 8" is 251px and truncated on
 * every card in the first draft, which threw away the progress, the one fact
 * the reader came for. "Engineer, step 12 of 18" is 137px and fits. The verb
 * went because the column heading already says Working, so spending the line
 * on it was the redundant-writing ban paying for the useful half of the
 * sentence. The list row, which has the room, still says it in full.
 */
function cardSub(
  s: StudioSessionListItem,
  state: RunState,
  progress: { done: number; total: number } | undefined,
): React.ReactNode {
  const steps =
    progress && progress.total > 0 ? (
      <>
        step <Figure>{progress.done}</Figure> of <Figure>{progress.total}</Figure>
      </>
    ) : null;

  if (state === "queued") return <>Queued for {holderPhrase(s)}</>;

  if (state === "working") {
    return (
      <>
        <Actor>{actorName(s.kind)}</Actor>
        {/* The verb only when there is no progress to report, because then it
            is the only thing known about the work and a name alone says less
            than the mark beside it already does. */}
        {steps ? <> &middot; {steps}</> : <> is {actorVerb(s.kind)}</>}
      </>
    );
  }

  if (state === "gate") {
    if (s.pending_approvals > 0) {
      return (
        <>
          <Figure>{s.pending_approvals}</Figure> {s.pending_approvals === 1 ? "call" : "calls"} to
          settle
        </>
      );
    }
    return <>It needs your call</>;
  }

  if (state === "stopped") {
    const when = ago(s.updated_at);
    if (steps) return <>Stopped at {steps}</>;
    return <>Stopped{when ? <> &middot; {when}</> : null}</>;
  }

  // Done. A done card is quiet, so the second fact is normally just when it
  // finished. ONE exception earns colour: a run claiming done with no merged
  // pull request behind it, which is the only thing in this column worth
  // interrupting a scan for. It is never invented (completionEvidence reads
  // the changeset and refuses to guess).
  //
  // "cannot-do-yet" deliberately does NOT take the slot. It is what every
  // orchestrator goal-run returns, because a goal-run has no changeset
  // concept at all; flagging it would print a limitation on most of the
  // column and teach people to stop reading the one flag that matters.
  const evidence = completionEvidence({
    claimsDone: true,
    kind: s.kind,
    changesetStatus: s.changeset?.status ?? null,
    prUrl: s.changeset?.pr_url ?? null,
  });
  // The flag takes the WHOLE line rather than sitting after the name, because
  // "Engineer, needs verification" measures 166px against a 142px budget and
  // truncates exactly where the warning is. The agent is on the card already:
  // the mark is the attribution, and the reason is the tooltip.
  if (evidence === "needs-verification") {
    /* IT IS NOT AMBER, and the correction outlives the token that carried it.
       `.sp-warn` painted a warn colour, and this system has none: the only thing
       amber may say is "stopped, and NOT on you". A Done claim nobody has
       checked is the opposite fact -- a person has to go and look before it can
       be believed, and until one does, it does not move. That is orchid, which
       is exactly what `RecordStatus` draws for the "you" tone, and it is the
       same drawing the list grid gives this flag one click away. */
    return (
      <span title={COMPLETION_EVIDENCE_REASON[evidence]}>
        <RecordStatus tone="you" label={COMPLETION_EVIDENCE_LABEL[evidence]} />
      </span>
    );
  }
  const when = ago(s.updated_at);
  return (
    <>
      <Actor>{actorName(s.kind)}</Actor>
      {when ? <> &middot; {when}</> : null}
    </>
  );
}

export function RunBoard({
  rows,
  progressById,
  showAll,
  onShowAll,
  onOpen,
}: {
  /** Exactly the rows the list renders, off the same query. The board adds no
   *  read of its own; two reads of one truth is how two views disagree. */
  rows: StudioSessionListItem[];
  /** mission_id -> plan progress, from the listMissions query this route was
   *  already running for the list rows. */
  progressById: Map<string, { done: number; total: number }>;
  showAll: boolean;
  onShowAll: () => void;
  onOpen: (missionId: string) => void;
}) {
  /**
   * Which columns the person has opened, one at a time.
   *
   * FOUNDER REPORT 2026-07-30: "at the bottom it says plus twelve, but as a
   * user if I want to take a look at what are those plus twelve, there is no
   * option, it is just a static number." Exactly right, and the expand control
   * did exist: "Every run", in the opposite corner of the board, expanding
   * every column at once. A number that names a hidden set should BE the door
   * to that set, not a label pointing at a button somewhere else.
   *
   * Per column rather than global, because "+12" is a question about THOSE
   * twelve. Opening the gate column should not also unfold Done. The global
   * "Every run" still works and still wins, so nothing that relied on it broke.
   */
  const [expanded, setExpanded] = React.useState<ReadonlySet<RunState>>(new Set());
  const toggleColumn = React.useCallback((state: RunState) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  }, []);

  const columns = React.useMemo(() => {
    // Archived runs are a list-view concern: Manage reveals them there so they
    // can be restored or deleted. On the board they would inflate every count
    // with work nobody is doing.
    const live = rows.filter((s) => !s.archived);
    const byState = new Map<RunState, StudioSessionListItem[]>();
    for (const c of COLUMNS) byState.set(c.state, []);
    for (const s of live) byState.get(runState(s))?.push(s);

    return COLUMNS.map((c) => {
      const all = byState.get(c.state) ?? [];
      // Per-column order, chosen per column. A queue reads oldest first (that
      // is the order it will be picked up in, and the longest wait is the most
      // urgent); everything settled or moving reads most recent first.
      const oldestFirst = c.state === "queued" || c.state === "gate";
      all.sort((a, b) => {
        const ka = oldestFirst ? a.created_at : a.updated_at;
        const kb = oldestFirst ? b.created_at : b.updated_at;
        return oldestFirst
          ? (ka ?? "").localeCompare(kb ?? "")
          : (kb ?? "").localeCompare(ka ?? "");
      });
      const open = showAll || expanded.has(c.state);
      return { ...c, all, shown: open ? all : all.slice(0, PER_COLUMN), open };
    });
  }, [rows, showAll, expanded]);

  const truncated = columns.some((c) => c.all.length > c.shown.length);

  // A populated column takes a whole track; an empty one takes a fraction of
  // one, with a floor so its heading never squeezes. Only consulted at five
  // across; the three-across base keeps every track equal so the wrapped rows
  // stay tidy.
  const template = columns
    // 132px is measured, not chosen: "Waiting on you" is the longest heading
    // and needs 88px beside its count, and 118px left it flush against the
    // ellipsis with nothing spare for a wider face.
    .map((c) => (c.all.length === 0 ? "minmax(132px, 0.42fr)" : "minmax(0, 1fr)"))
    .join(" ");

  return (
    <div className="rb-canvas">
      <style href="sp-run-board" precedence="medium">
        {BOARD_CSS}
      </style>

      <div className="rb-head">
        <span className="rb-note">
          Every run, by what it is doing now. Work that has not been handed over yet is on the
          roadmap in{" "}
          <Link to="/plan" search={{ view: "roadmap" }}>
            Plan
          </Link>
          , and does not appear here.
        </span>
        {truncated || showAll ? (
          <Door onClick={onShowAll}>{showAll ? "Show fewer" : "Every run"}</Door>
        ) : null}
      </div>

      {/*
       * THE ONE FACT THE BOARD IS FOR, SAID TO EARS TOO (R-19). The counts sit
       * in column headings a sighted scan picks up for free; this line makes
       * the same numbers a polite live region, so a run crossing into gate or
       * finishing announces without reading the whole board. Identical polls
       * render identical text and say nothing.
       */}
      <p role="status" aria-live="polite" className="sr-only">
        {(() => {
          const calling = columns.find((c) => c.state === "gate")?.all.length ?? 0;
          const working = columns.find((c) => c.state === "working")?.all.length ?? 0;
          if (calling === 0 && working === 0)
            return "No runs are building, and none are waiting on you.";
          return [
            working > 0 ? `${working} ${working === 1 ? "run is" : "runs are"} building` : "",
            calling > 0 ? `${calling} ${calling === 1 ? "run needs" : "runs need"} you` : "",
          ]
            .filter(Boolean)
            .join(" · ");
        })()}
      </p>

      <div className="rb-board" style={{ "--rb-cols": template } as React.CSSProperties}>
        {columns.map((c) => {
          const calling = c.state === "gate" && c.all.length > 0;
          return (
            <section className="rb-col" key={c.state} data-calling={calling}>
              <div className="rb-col-head">
                <span className="rb-col-name">{c.name}</span>
                <span className="rb-col-count">{c.all.length}</span>
              </div>
              <div className="rb-cards">
                {c.shown.map((s, i) => {
                  /* COLOUR BY STATUS, which used to be a board-only exception
                   * (founder ruling 2026-07-30: "should we also change the
                   * colors for already done, the agent color... only in this
                   * dashboard") and is now simply what the system does. The
                   * mark takes the run's state straight from the column it is
                   * standing in, so the card and the heading above it cannot
                   * disagree.
                   *
                   * Green is NOT "the Done column". It is "done and we can
                   * prove it": a merged changeset with a real pull request,
                   * which is what completionEvidence already calls verified.
                   * A run that claims done with nothing behind it keeps the
                   * neutral mark, because the board already flags that case
                   * and painting it green would assert a success nobody
                   * checked. The colour and the flag agree rather than the
                   * colour overruling the flag. */
                  const proven =
                    c.state === "done" &&
                    completionEvidence({
                      claimsDone: true,
                      kind: s.kind,
                      changesetStatus: s.changeset?.status ?? null,
                      prUrl: s.changeset?.pr_url ?? null,
                    }) === "verified";
                  const mark: RunMarkState = proven ? "verified" : c.state;
                  const title = stripAutoPrefix(s.title);
                  return (
                    <RunCard
                      key={s.mission_id}
                      title={title}
                      mark={
                        <RunMark
                          slug={actorSlug(s.kind)}
                          state={mark}
                          name={s.title}
                          // The one moving mark on the board, spent on the run
                          // that has been waiting longest. Everything behind it
                          // wears the same orchid at rest, which is what the
                          // rule prescribes for a queue standing behind the one
                          // asking: a dozen of them in unison stops the motion
                          // meaning "look here".
                          asking={c.state === "gate" && i === 0}
                        />
                      }
                      lead={title}
                      sub={cardSub(s, c.state, progressById.get(s.mission_id))}
                      onClick={() => onOpen(s.mission_id)}
                    />
                  );
                })}
                {c.all.length > c.shown.length ? (
                  <button
                    type="button"
                    className="rb-rest"
                    onClick={() => toggleColumn(c.state)}
                    aria-expanded={false}
                  >
                    +{c.all.length - c.shown.length} more
                  </button>
                ) : c.open && c.all.length > PER_COLUMN && !showAll ? (
                  // A column you opened has to be closable from where you
                  // opened it. Without this the only way back is the global
                  // control in the other corner, which is the same complaint
                  // one step later.
                  <button
                    type="button"
                    className="rb-rest"
                    onClick={() => toggleColumn(c.state)}
                    aria-expanded
                  >
                    Show fewer
                  </button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
