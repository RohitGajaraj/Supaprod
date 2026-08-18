/**
 * ONE BET, ON THE BOARD. The atom of station 3.
 *
 * ============================================================================
 * 2026-08-10: REDRAWN ON THE INK TOKENS, AND IT WAS THE LAST RETIRED SURFACE
 * ON THIS STATION.
 * ============================================================================
 *
 * /plan was ported onto the `--sp-*` primitives in an earlier pass and this file
 * was not: the head, the gate, the receipts and the spec rows all spoke ink
 * while the CARDS, which are the only thing on the board a person actually
 * looks at, were still drawn in `--card`, `--hairline`, `--ember-line`,
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
 *      it keeps ember and loses the fill: a 2px left rule the height of the card
 *      (`--sp-eviq-rule`, the invariant weight this system already owns) and a
 *      sentence in words. The card is found by scanning the left margin, which
 *      is cheaper than reading four chips, and it survives greyscale because the
 *      rule is geometry.
 *
 *   3. NO MONO CAPS ANYWHERE. `NOW`, `NEXT`, `LATER`, `+ OUTCOME`,
 *      `EDIT OUTCOME`, `REWIND`, `REWINDING…` and the relative time were all
 *      letter-spaced uppercase mono. That is eight shouted words on a 120px card
 *      and it was the loudest thing in the region. They are sentence-case quiet
 *      actions now, wearing `.sp-block-more`, which is the system's existing
 *      quiet action and already carries its own hover and focus states.
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
import { useState, memo, type KeyboardEvent } from "react";
import { Num } from "@/components/meridian/surface-parts";
import type { RoadmapBucket } from "@/lib/roadmap.functions";
import { RoadmapHistory } from "@/components/product/RoadmapHistory";
import { AuditTag } from "@/components/supaprod/AuditTag";
import { Button, Input } from "@/components/shell/primitives";
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
 * The three lanes, in ink. NOW no longer carries an ember edge: ember marks the
 * human, and a column heading is not a person. What separates the lanes is
 * VALUE, which is the quietest signal a design system has and the one that
 * survives greyscale: Now and Next sit on the raised surface at full ink, Later
 * sinks and its text steps back one stop on the ramp.
 */
const LANE_STYLE: Record<RoadmapBucket, { background: string; border: string; ink: string }> = {
  now: { background: "var(--sp-lift)", border: "var(--sp-line)", ink: "var(--sp-ink)" },
  next: { background: "var(--sp-lift)", border: "var(--sp-line-soft)", ink: "var(--sp-ink)" },
  later: { background: "var(--sp-sink)", border: "var(--sp-line-soft)", ink: "var(--sp-body)" },
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
        <span key={i} style={{ color: /^-?\d/.test(part) ? "var(--sp-ink)" : undefined }}>
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
      tabIndex={tabIndex}
      onKeyDown={onCardKeyDown}
      onFocus={onFocusCard}
      // The card is one stop in a composite widget, so it says what kind of
      // thing it is rather than leaving a screen reader to infer a div.
      role="group"
      aria-label={decisionOptionLabel(title)}
      style={{
        borderRadius: "var(--sp-radius-card)",
        padding: "var(--sp-space-4)",
        background: lane.background,
        border: `1px solid ${lane.border}`,
        // THE ONE EMBER ON THE BOARD. A committed bet carrying no declared
        // outcome is the only thing here genuinely waiting on a person, so it
        // gets the human's colour, as the rule this system fixes at 2px and
        // never as a fill.
        borderLeft: hasOutcome
          ? `1px solid ${lane.border}`
          : `var(--sp-eviq-rule) solid var(--sp-gate)`,
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-space-2)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-space-2)" }}>
        {/* THE PRIMITIVE'S CLASS ON A RAW CONTROL, RATHER THAN A SECOND CONTROL,
            and for one reason: `Checkbox`'s `onChange(next: boolean)` cannot
            carry the shift key, and shift-click range-select is the whole point
            of putting a checkbox on a board of twenty bets. `onClick` on the
            input is the only handler that sees `shiftKey`, and it fires for a
            keyboard Space too, because a checkbox dispatches a click either way.
            `onChange` is present and empty so React still treats this as a
            controlled input; the state it reflects lives in `useSelection`. */}
        <input
          type="checkbox"
          className="sp-check"
          checked={selected}
          aria-label={`Select ${decisionOptionLabel(title)}`}
          onChange={() => {}}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(!selected, { shiftKey: e.shiftKey });
          }}
        />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "var(--sp-text-body)",
            fontWeight: "var(--sp-weight-strong)",
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
            fontSize: "var(--sp-text-meta)",
            lineHeight: "var(--sp-leading-row)",
            color: "var(--sp-body)",
          }}
        >
          {outcomeText}
        </span>
      ) : (
        <span style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
          No outcome declared, so nothing can grade it later.
        </span>
      )}

      {editing ? null : measureText ? (
        <span
          style={{
            fontFamily: "var(--sp-font-mono)",
            fontSize: "var(--sp-text-data)",
            color: "var(--sp-mute)",
          }}
        >
          <MeasureLine measure={measureText} />
        </span>
      ) : null}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-space-2)" }}>
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
          <span style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-space-2)" }}>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
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
            </Button>
          </span>
        </div>
      ) : (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-space-3)",
            marginTop: "var(--sp-space-1)",
            flexWrap: "wrap",
          }}
        >
          {MOVE_TARGETS.filter((t) => t.bucket !== column).map((t) => (
            <button
              key={t.bucket}
              type="button"
              className="sp-block-more"
              onClick={(e) => {
                e.stopPropagation();
                onMoveTo(t.bucket);
              }}
            >
              {/* THE CURRENT LANE IS NOT DRAWN DISABLED, IT IS NOT DRAWN.
                  Three controls of which one is always dead is a third of the
                  card's controls spent saying where it already is, which the
                  column heading above it already says. */}
              {t.label}
            </button>
          ))}
          <button type="button" className="sp-block-more" onClick={startEdit}>
            {hasOutcome ? "Edit the promise" : "Declare the outcome"}
          </button>
          <RoadmapHistory opportunityId={id} />
          {canRewind && onRewind ? (
            <button
              type="button"
              className="sp-block-more"
              disabled={rewindPending}
              onClick={(e) => {
                e.stopPropagation();
                onRewind();
              }}
            >
              {rewindPending ? "Rewinding" : "Rewind"}
            </button>
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
          gap: "var(--sp-space-3)",
          flexWrap: "wrap",
          fontSize: "var(--sp-text-data-sm)",
          color: "var(--sp-mute)",
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
