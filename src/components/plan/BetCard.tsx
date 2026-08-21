/**
 * ONE BET, ON THE BOARD. The atom of station 3.
 *
 * ============================================================================
 * 2026-08-21: PORTED TO MERIDIAN. THE VOCABULARY MOVED AND THE DESIGN DID NOT.
 * ============================================================================
 *
 * The 2026-08-10 pass below drew this card in the retired ink layer, which was
 * the right call on the day: /plan was ink, and one card speaking a sixth system
 * would have been worse than one station speaking a retired one. Meridian is now
 * the only design system, so this file carries 33 token references and four
 * class names of a language nothing new may speak.
 *
 * ALL FOUR RULINGS BELOW STILL HOLD, and each of them is now expressed in
 * Meridian rather than described in ink:
 *
 *   1. THE PROMISE STILL LEADS. The outcome is the first line under the title
 *      and the measure sits beneath it in mono. Unchanged.
 *   2. EMBER IS STILL A 2px RULE AND NOT A CHIP. The weight now comes from
 *      `--mrd-mark-rule`, built in `meridian.css` in this change because Meridian
 *      had no counterpart to ink's `--sp-eviq-rule` and four files had each
 *      hard-coded 2px instead. The hue is `--mrd-you`, which means a person is
 *      required, and that is exactly what a committed bet with no declared
 *      outcome is waiting for.
 *   3. STILL NO MONO CAPS. The quiet actions are `Door` now, which is Meridian's
 *      own quiet action and a line-for-line port of what `.sp-block-more` did:
 *      body ink, a dotted underline that goes solid on hover, and a size
 *      inherited from the row rather than fixed.
 *   4. THE CHECKBOX IS NOW GENUINELY THE REAL ONE. It used to be a raw `<input>`
 *      wearing the primitive's CLASS, because `Checkbox`'s `onChange(next)`
 *      cannot carry the shift key and shift-click range-select is the whole point
 *      of a checkbox on a board of twenty bets. That compromise is no longer
 *      needed: `DecisionQueue` and `queue-instruments` both solved it the same
 *      way and `queue-instruments.test.tsx` pins the behaviour. The modifier is
 *      caught on the way IN, on a wrapper, and read back inside `onChange`.
 *      Capture phase, so mousedown and keyboard Space both reach it before the
 *      change lands.
 *
 * WHAT MOVED ON PURPOSE, in pixels, because a spacing change that nobody wrote
 * down is a spacing change nobody can defend. Meridian's ramp grows (2/4/6/10/
 * 16/24/40/64) where ink's was linear (4/8/12/16), so 8px and 12px have no stop
 * anywhere on it and both had to be decided rather than renamed:
 *
 *   card padding        16px -> 16px  exact
 *   stack gap            8px -> 10px  rounded UP, one stop
 *   control row gap     12px -> 16px  rounded UP, one stop
 *   row top margin       4px ->  4px  exact
 *   card radius         10px -> 12px  Meridian's card radius
 *   row leading          1.4 ->  1.5  Meridian replaced 1.4 with this on purpose
 *
 * Rounded up rather than down in both cases, because the ratio between them is
 * what carried the grouping (8:12 was 1:1.5, 10:16 is 1:1.6) and because
 * shrinking a surface is not an answer this system accepts. Every type size,
 * weight and colour is an exact value match.
 *
 * ============================================================================
 * 2026-08-10: REDRAWN ON THE INK TOKENS, AND IT WAS THE LAST RETIRED SURFACE
 * ON THIS STATION. Kept because it is the record of why the card looks like
 * this; the token names in it are historical from here on.
 * ============================================================================
 *
 * /plan was ported onto the ink primitives in an earlier pass and this file was
 * not: the head, the gate, the receipts and the spec rows all spoke ink while
 * the CARDS, which are the only thing on the board a person actually looks at,
 * were still drawn in `--card`, `--hairline`, `--ember-line`,
 * `--shadow-elevated`, `--font-mono`, `--text-subtle` and `loom-press`, with a
 * `VerdictChip` from the retired kit on top. Two design systems, forty pixels
 * apart, on the surface the founder opens to see what the team committed to.
 *
 * FOUR THINGS CHANGED BEYOND THE PALETTE, and each is a rule this system holds:
 *
 *   1. THE PROMISE IS ON THE CARD. The station's whole claim is that "each bet
 *      names the outcome it promises", and the card printed the MEASURE and not
 *      the outcome. So a board of committed work showed a column of numbers with
 *      the promises they measure nowhere on screen. The outcome leads now and
 *      the measure sits under it in mono, which is the order the sentence is in.
 *
 *   2. AN UNDECLARED BET WEARS EMBER AS A RULE, NOT AS A CHIP. It used to carry
 *      `<VerdictChip tone="REVISE">NEEDS OUTCOME</VerdictChip>`, an ember-filled
 *      lozenge shouting in mono caps. Ember marks the human and nothing else,
 *      and this is genuinely the one thing on the board waiting on a person, so
 *      it keeps the human's hue and loses the fill: a 2px left rule the height
 *      of the card and a sentence in words. The card is found by scanning the
 *      left margin, which is cheaper than reading four chips, and it survives
 *      greyscale because the rule is geometry.
 *
 *   3. NO MONO CAPS ANYWHERE. `NOW`, `NEXT`, `LATER`, `+ OUTCOME`,
 *      `EDIT OUTCOME`, `REWIND`, `REWINDING…` and the relative time were all
 *      letter-spaced uppercase mono. That is eight shouted words on a 120px card
 *      and it was the loudest thing in the region. They are sentence-case quiet
 *      actions now, and the quiet action carries its own hover and focus states
 *      so this file never draws either.
 *
 *   4. THE CHECKBOX IS THE REAL ONE. It was a raw `<input>` with an inline
 *      `accentColor: var(--ember)`, which spent the human's colour on a value
 *      that is not a gate. The `Checkbox` primitive is the instrument for a value
 *      that sits there until something else acts on it, it is monochrome for
 *      exactly that reason, and it is keyboard-native: Space toggles, Tab
 *      reaches it, and shift-clicking one gives the board range-select through
 *      `useSelection` without this file knowing anything about it.
 *
 * WHAT IS DELIBERATELY KEPT. `RoadmapHistory` ("why is this here") and
 * `AuditTag` both draw in their own kit and both live outside this lane. They
 * answer real questions and removing them to tidy the palette would be trading a
 * capability for a colour, so they stay in the card's quiet tail until the lane
 * that owns them ports them.
 *
 * THE KEYBOARD, AND WHY IT IS ARROWS AND NOT LETTERS. The board is a composite
 * widget: every card is one stop, the arrows move between them, and the controls
 * inside a focused card are reached with Tab. Bare LETTERS are not bound here on
 * purpose. `src/lib/key-model.ts` is the product's one declaration of what every
 * key does, `key-model.test.ts` fails the build in both directions against it,
 * and that file is not this lane's to edit; binding `n` here would be exactly
 * the invisible-shortcut defect that registry exists to end. Arrows, Home, End
 * and Space are structural rather than shortcuts, which key-model's own comment
 * says in as many words, so they need no entry and get one anyway in the sense
 * that they behave the way every list in every operating system behaves.
 */
import { useState, useRef, memo, type KeyboardEvent } from "react";
import { Action, Door, Num } from "@/components/meridian/surface-parts";
import { Checkbox, Input } from "@/components/meridian/forms";
import type { RoadmapBucket } from "@/lib/roadmap.functions";
import { RoadmapHistory } from "@/components/product/RoadmapHistory";
import { AuditTag } from "@/components/supaprod/AuditTag";
import { decisionOptionLabel } from "./format";

export interface BetCardProps {
  id: string;
  title: string;
  measure: string | null;
  outcome: string | null;
  column: RoadmapBucket;
  iceScore: number | null;
  hasOutcome: boolean;
  updatedAt: string | null;
  selected: boolean;
  onToggleSelect: (selected: boolean, e: { shiftKey?: boolean }) => void;
  onMoveTo: (bucket: RoadmapBucket) => void;
  onEditOutcome: (values: { outcome: string; measure: string }) => void;
  editPending?: boolean;
  /** PC-10: shown only when a prior placement was captured (an agent or human move). */
  canRewind?: boolean;
  onRewind?: () => void;
  rewindPending?: boolean;
  /** The roving tab stop. Exactly one card on the board carries 0. */
  tabIndex?: number;
  onCardKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  registerRef?: (el: HTMLDivElement | null) => void;
  onFocusCard?: () => void;
}

/**
 * The three lanes. NOW no longer carries an ember edge: the human's hue marks a
 * person, and a column heading is not a person. What separates the lanes is
 * VALUE, which is the quietest signal a design system has and the one that
 * survives greyscale: Now and Next sit on the raised surface at full ink, Later
 * sinks and its text steps back one stop on the ramp.
 */
const LANE_STYLE: Record<RoadmapBucket, { background: string; border: string; ink: string }> = {
  now: { background: "var(--mrd-lift)", border: "var(--mrd-line)", ink: "var(--mrd-ink)" },
  next: { background: "var(--mrd-lift)", border: "var(--mrd-line-soft)", ink: "var(--mrd-ink)" },
  later: { background: "var(--mrd-sink)", border: "var(--mrd-line-soft)", ink: "var(--mrd-body)" },
};

const MOVE_TARGETS: { bucket: RoadmapBucket; label: string }[] = [
  { bucket: "now", label: "Now" },
  { bucket: "next", label: "Next" },
  { bucket: "later", label: "Later" },
];

/**
 * The numbers inside a measure, lifted by CONTRAST rather than by colour. A
 * measure is "checkout drop-off under 12% by Aug 1", and the part a person scans
 * for is the 12 and the date. Colour is reserved for status here, so the numbers
 * step up the ink ramp and the words stay where they are.
 */
function MeasureLine({ measure }: { measure: string }) {
  const parts = measure.split(/(-?\d[\d.,%]*)/g).filter((p) => p.length > 0);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i} style={{ color: /^-?\d/.test(part) ? "var(--mrd-ink)" : undefined }}>
          {part}
        </span>
      ))}
    </>
  );
}

function BetCardComponent({
  id,
  title,
  measure,
  outcome,
  column,
  iceScore,
  hasOutcome,
  updatedAt,
  selected,
  onToggleSelect,
  onMoveTo,
  onEditOutcome,
  editPending = false,
  canRewind = false,
  onRewind,
  rewindPending = false,
  tabIndex = -1,
  onCardKeyDown,
  registerRef,
  onFocusCard,
}: BetCardProps) {
  const lane = LANE_STYLE[column];
  const measureText = measure && measure.trim().length > 0 ? measure : null;
  const outcomeText = outcome && outcome.trim().length > 0 ? outcome : null;
  const [editing, setEditing] = useState(false);
  const [outcomeVal, setOutcomeVal] = useState(outcome ?? "");
  const [measureVal, setMeasureVal] = useState(measure ?? "");
  /* Whether Shift was down when the tick was reached. See ruling 4 in the
     header: the modifier is caught on the way in and read back on change. */
  const shift = useRef(false);

  const startEdit = () => {
    setOutcomeVal(outcome ?? "");
    setMeasureVal(measure ?? "");
    setEditing(true);
  };
  const saveEdit = () => {
    const nextOutcome = outcomeVal.trim();
    const nextMeasure = measureVal.trim();
    if (!nextOutcome || !nextMeasure) return;
    onEditOutcome({ outcome: nextOutcome, measure: nextMeasure });
    setEditing(false);
  };
  const saveDisabled = editPending || !outcomeVal.trim() || !measureVal.trim();

  return (
    <div
      ref={registerRef}
      // Meridian's focus treatment travels with the part, not with the page, and
      // the card is itself a tab stop as well as the parent of five controls.
      data-mrd=""
      tabIndex={tabIndex}
      onKeyDown={onCardKeyDown}
      onFocus={onFocusCard}
      // The card is one stop in a composite widget, so it says what kind of
      // thing it is rather than leaving a screen reader to infer a div.
      role="group"
      aria-label={decisionOptionLabel(title)}
      style={{
        borderRadius: "var(--mrd-r-card)",
        padding: "var(--mrd-s5)",
        background: lane.background,
        border: `1px solid ${lane.border}`,
        // THE ONE ORCHID ON THE BOARD. A committed bet carrying no declared
        // outcome is the only thing here genuinely waiting on a person, so it
        // gets the human's colour, as the rule this system fixes at 2px and
        // never as a fill.
        borderLeft: hasOutcome
          ? `1px solid ${lane.border}`
          : `var(--mrd-mark-rule) solid var(--mrd-you)`,
        display: "flex",
        flexDirection: "column",
        gap: "var(--mrd-s4)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s4)" }}>
        {/* THE MODIFIER IS CAUGHT ON THE WRAPPER, WHICH IS THE HOUSE PATTERN.
            `Checkbox` reports a value rather than an event, deliberately, so it
            cannot hand over `shiftKey` and shift-click range-select is the whole
            point of a tick on a board of twenty bets. Capture phase, because the
            change fires after the mousedown that produced it, and keyboard Space
            arrives the same way so shift-Space extends a range too. Identical to
            `DecisionQueue`'s `Pick` and `queue-instruments`' `SelectBox`, and
            `queue-instruments.test.tsx` is what pins the behaviour. */}
        <span
          style={{ display: "inline-flex" }}
          onMouseDownCapture={(e) => {
            shift.current = e.shiftKey;
          }}
          onKeyDownCapture={(e) => {
            shift.current = e.shiftKey;
          }}
        >
          <Checkbox
            checked={selected}
            label={`Select ${decisionOptionLabel(title)}`}
            onChange={(next) => onToggleSelect(next, { shiftKey: shift.current })}
          />
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "var(--mrd-t-prose)",
            fontWeight: "var(--mrd-w-semi)",
            color: lane.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={title}
        >
          {decisionOptionLabel(title)}
        </span>
      </span>

      {/* THE PROMISE, WHICH THIS CARD USED NOT TO SHOW. Either the outcome this
          bet names, or the sentence saying it names none. Never both, and never
          silence. */}
      {editing ? null : outcomeText ? (
        <span
          style={{
            fontSize: "var(--mrd-t-base)",
            lineHeight: "var(--mrd-lh-snug)",
            color: "var(--mrd-body)",
          }}
        >
          {outcomeText}
        </span>
      ) : (
        <span style={{ fontSize: "var(--mrd-t-base)", color: "var(--mrd-mute)" }}>
          No outcome declared, so nothing can grade it later.
        </span>
      )}

      {editing ? null : measureText ? (
        <span
          style={{
            fontFamily: "var(--mrd-mono)",
            fontSize: "var(--mrd-t-small)",
            color: "var(--mrd-mute)",
          }}
        >
          <MeasureLine measure={measureText} />
        </span>
      ) : null}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--mrd-s4)" }}>
          <Input
            autoFocus
            value={outcomeVal}
            onChange={(e) => setOutcomeVal(e.target.value)}
            placeholder="Outcome: what changes"
            aria-label="Outcome"
            maxLength={500}
          />
          <Input
            value={measureVal}
            onChange={(e) => setMeasureVal(e.target.value)}
            placeholder="Measure: how you will know"
            aria-label="Measure"
            maxLength={500}
          />
          <span style={{ display: "flex", justifyContent: "flex-end", gap: "var(--mrd-s4)" }}>
            <Action variant="quiet" onClick={() => setEditing(false)}>
              Cancel
            </Action>
            <Action
              variant="primary"
              disabled={saveDisabled}
              // Disabled pairs with an explanation.
              title={
                saveDisabled && !editPending
                  ? "Both the outcome and the measure are required"
                  : undefined
              }
              onClick={saveEdit}
            >
              {editPending ? "Saving" : "Save the promise"}
            </Action>
          </span>
        </div>
      ) : (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--mrd-s5)",
            marginTop: "var(--mrd-s2)",
            flexWrap: "wrap",
            // `Door` inherits its size from the line it sits in rather than
            // fixing one, so the row declares it once for all of them.
            fontSize: "var(--mrd-t-base)",
          }}
        >
          {MOVE_TARGETS.filter((t) => t.bucket !== column).map((t) => (
            // THE CURRENT LANE IS NOT DRAWN DISABLED, IT IS NOT DRAWN. Three
            // controls of which one is always dead is a third of the card's
            // controls spent saying where it already is, which the column
            // heading above it already says.
            <Door key={t.bucket} onClick={() => onMoveTo(t.bucket)}>
              {t.label}
            </Door>
          ))}
          <Door onClick={startEdit}>{hasOutcome ? "Edit the promise" : "Declare the outcome"}</Door>
          <RoadmapHistory opportunityId={id} />
          {canRewind && onRewind ? (
            rewindPending ? (
              /* DEAD, NOT HIDDEN. `Door` has no disabled state, and the state it
                 would draw is exactly this: the word stays in place, steps back
                 to the metadata ink and drops the underline, so it cannot be
                 pressed twice while the rewind is in flight. That is what the
                 retired quiet action's `:disabled` rule did, to the pixel. */
              <span style={{ color: "var(--mrd-mute)" }}>Rewinding</span>
            ) : (
              <Door onClick={onRewind}>Rewind</Door>
            )
          ) : null}
        </span>
      )}

      {/* The quiet tail: what ranks it, when it last moved, and its trace. The
          ICE score was PASSED INTO THIS CARD AND DISCARDED (`iceScore: _iceScore`)
          while the board sorted every column by it, so the one number that
          explains the order a person is looking at was the one number they could
          not see. */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--mrd-s5)",
          flexWrap: "wrap",
          fontSize: "var(--mrd-t-data)",
          color: "var(--mrd-mute)",
        }}
      >
        {iceScore !== null ? (
          <span>
            ICE <Num>{iceScore.toFixed(1)}</Num>
          </span>
        ) : null}
        {updatedAt ? <Num>{relDays(updatedAt)}</Num> : null}
        <AuditTag kind="opportunity" id={id} />
      </span>
    </div>
  );
}

/** Plain-words relative time. The board's own copy of the shell's `ago`, in the
 *  same words, rather than the retired `relTimeCaps` which returned "3D AGO" in
 *  letter-spaced uppercase. */
function relDays(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Memoize BetCard so it doesn't re-render when sibling rows' selection state changes.
export const BetCard = memo(BetCardComponent);
