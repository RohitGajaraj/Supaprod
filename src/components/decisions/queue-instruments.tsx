/**
 * The instruments the two ranked queues read from: Discover's cluster ranking
 * and Decide's bet ranking.
 *
 * WHY THIS FILE EXISTS AT ALL, given primitives.tsx. Three of these four are
 * general enough to belong there eventually, and none of them is general
 * enough YET: a ring whose fill means "how far through the red team" and a bar
 * whose length means "where on a 0..10 ICE scale" are both statements about a
 * RANKED QUEUE, not about any list. Two surfaces share them today. Promote them
 * the day a third one needs the same shape, not before -- which is the same
 * rule `Grid` and `Cell` were added under, and the opposite of the drift that
 * put four hand-rolled copies of `Value` on four surfaces.
 *
 * It lives under decisions/ rather than under either station because both
 * stations are decision queues and neither owns the other.
 *
 * WHAT THE RESEARCH SAID, and it is the whole reason these are shapes rather
 * than colours. Across ~200 shipped products the only status encoding that
 * survives greyscale untouched is Linear's ring: empty, part-filled, filled,
 * struck. Everything else -- the tinted pill, the coloured dot, the heat cell
 * -- collapses the moment hue is removed or the reader is one of the 8% of men
 * who cannot separate the two ends of it. So the SHAPE carries the state and
 * the colour only CONFIRMS it, which is what makes the colour optional.
 *
 * And magnitude is never a hue. A numeral with a stated ceiling plus a 2px
 * proportional bar on a shared scale (Productboard's move) reads at a glance,
 * costs no row height, and survives a regroup: the bars stay comparable because
 * the scale is the column's, not the row's.
 *
 * NO NEW COLOUR AND NO NEW SIZE. Every value below is a `--sp-*` token read off
 * ink.css. The ring geometry tokens (`--sp-ring*`) were added for exactly this
 * and had no implementation until now; the inline-style-over-stylesheet choice
 * follows the precedent already set by OpportunityRow.tsx's StatusPill and
 * DesignationTag, which read tokens the same way in the same folder.
 */

import * as React from "react";
import { Num } from "@/components/meridian/surface-parts";

import { Checkbox } from "@/components/shell/primitives";
import type { Selection } from "@/components/shell/use-selection";

/* ------------------------------------------------------------------ *
 * The status ring
 * ------------------------------------------------------------------ */

/**
 * How much of the ring is filled. This is an ORDINAL, and reading it as one is
 * the point: nothing has happened, something has, it is complete, it is over.
 *
 * `struck` is the terminal-but-negative end (killed, declined). It is a ring
 * with a bar through it rather than a fuller ring, because a person must not
 * read "more filled" as "further along" when it means the opposite.
 */
export type RingFill = "empty" | "part" | "full" | "struck";

/** Which token CONFIRMS the shape. `quiet` is the default and adds nothing. */
export type RingTone = "quiet" | "pass" | "warn" | "fail" | "live" | "mine";

const TONE_INK: Record<RingTone, string> = {
  quiet: "var(--sp-mute)",
  pass: "var(--sp-pass)",
  warn: "var(--sp-warn)",
  fail: "var(--sp-fail)",
  // Blue is an agent working, per SYSTEM.md, and the stage token is the one
  // blue this palette holds.
  live: "var(--sp-stage-build)",
  // Ember marks THE HUMAN and nothing else, so a ring may only wear it when the
  // state it is drawing is literally "this is yours to answer".
  mine: "var(--sp-gate)",
};

export function StatusRing({
  fill,
  tone = "quiet",
  label,
  small = false,
}: {
  fill: RingFill;
  tone?: RingTone;
  /** Required. A wordless mark with no accessible name is a mark only sighted
   *  users have, and this one carries the row's whole state. */
  label: string;
  /** Inside a dense scan row. Uses the smaller geometry pair. */
  small?: boolean;
}) {
  const ink = TONE_INK[tone];
  const size = small ? "var(--sp-ring-sm)" : "var(--sp-ring)";
  const stroke = small ? "var(--sp-ring-stroke-sm)" : "var(--sp-ring-stroke)";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{
        // `overflow: hidden` on a round box is what clips the two children
        // below into a half-disc and a chord. Doing it with box geometry rather
        // than an SVG keeps every dimension a token: an SVG would need its own
        // user-space units and the stroke would stop tracking --sp-ring-stroke.
        boxSizing: "border-box",
        position: "relative",
        display: "inline-block",
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${stroke} solid ${ink}`,
        overflow: "hidden",
        background: fill === "full" ? ink : "transparent",
      }}
    >
      {fill === "part" ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            right: "50%",
            background: ink,
          }}
        />
      ) : null}
      {fill === "struck" ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            // Over-long on both ends so the rotation still reaches the rim; the
            // round clip trims it back to a chord.
            top: "-50%",
            bottom: "-50%",
            left: "50%",
            width: stroke,
            marginLeft: `calc(${stroke} / -2)`,
            background: ink,
            transform: "rotate(45deg)",
          }}
        />
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The score: a numeral, a bar, and what moved
 * ------------------------------------------------------------------ */

/**
 * Magnitude, said twice: once exactly and once comparably.
 *
 * THE CEILING IS NOT OPTIONAL. An unbounded decimal on a row ("0.24") is the
 * failure mode the research names outright -- a reader cannot tell whether it
 * is good, and cannot tell whether the next row's 0.31 is meaningfully better.
 * So the caller states the ceiling, the bar is drawn against it, and the title
 * says it in words for anyone who hovers.
 *
 * THE BAR IS NEVER COLOURED. Colour carries STATUS in this system; a magnitude
 * painted red or green would be the surface asserting a judgment the number
 * does not hold. Length is the encoding. The bar is the one on the row above
 * and the row below at the same scale, which is what makes a glance down the
 * column worth anything.
 *
 * `delta` IS THE ORIGINAL IDEA HERE, and it is deliberately dim. Every ranked
 * queue in the study shows a CURRENT value; none shows the movement. A person
 * opening this on a Tuesday does not need twelve rationales re-read, they need
 * to know which two rows changed their mind since they last looked. It renders
 * ONLY when the record genuinely holds a previous score for this row -- never
 * computed, never inferred, never zero-filled.
 */
export function ScoreMeter({
  value,
  ceiling,
  decimals = 0,
  delta,
  what,
}: {
  value: number;
  ceiling: number;
  decimals?: number;
  /** The signed movement since the last re-score, on the same scale as `value`.
   *  Null when the record holds no earlier score, which is the common case. */
  delta?: number | null;
  /** What the number IS, for the title: "ICE", "match". */
  what: string;
}) {
  const pct = ceiling > 0 ? Math.max(0, Math.min(100, (value / ceiling) * 100)) : 0;
  const shown = value.toFixed(decimals);
  const moved = typeof delta === "number" && delta !== 0 ? delta : null;

  /**
   * THE BAND, AS A FRACTION OF THE CEILING RATHER THAN AN ABSOLUTE.
   *
   * This meter is used with ceiling 10 (ICE) and ceiling 100 (severity,
   * recency and novelty folded), so a threshold written in points would mean
   * two different things on two surfaces. The percentage is the only reading
   * that transfers.
   *
   * 70 and 40 rather than thirds, because the queues these appear in are
   * ranked and already sorted: the useful question at a glance is "is this one
   * still worth my attention", and the answer turns near the top of the range
   * rather than at the middle of it. Measured against the live queue, that
   * puts the 8.0 and 7.7 bets in strong, the 7.3s in fair, and only genuinely
   * weak candidates in the last band.
   *
   * THE COLOUR IS NEVER THE ONLY CHANNEL. The numeral is right beside it and
   * the bar's LENGTH says the same thing, so this reads identically in
   * greyscale, in a screenshot and to a reader who cannot separate the hues.
   */
  const band =
    pct >= 70
      ? "var(--sp-score-strong)"
      : pct >= 40
        ? "var(--sp-score-fair)"
        : "var(--sp-score-weak)";

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-space-2)" }}
      title={
        moved === null
          ? `${what} ${shown} out of ${ceiling}`
          : `${what} ${shown} out of ${ceiling}, ${moved > 0 ? "up" : "down"} ${Math.abs(moved).toFixed(1)} since the last outcome was recorded`
      }
    >
      <Num>{shown}</Num>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "var(--sp-space-9)",
          height: "var(--sp-eviq-rule)",
          background: "var(--sp-line)",
          borderRadius: "var(--sp-eviq-rule)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${pct}%`,
            background: band,
          }}
        />
      </span>
      {moved !== null ? (
        /* An arrow and a magnitude, in the mono the rest of the numbers use, at
         * metadata SIZE. It is a fact about the past, so it must never be
         * louder than the number it moved, and size is what enforces that.
         *
         * IT WAS GREY IN BOTH DIRECTIONS UNTIL 2026-08-11, which made this the
         * one place in the product where movement was shown without saying
         * which way. Elsewhere on the same screen a delta already rendered
         * green for a rise and red for a fall, so a single surface carried two
         * treatments of one idea and the quieter one was the one attached to
         * the score.
         *
         * The glyph and the sign of the number both still say it, so the hue
         * is the third channel here rather than the first. */
        <span
          className="sp-num"
          style={{ color: moved > 0 ? "var(--sp-move-up)" : "var(--sp-move-down)" }}
        >
          {moved > 0 ? "▲" : "▼"}
          {Math.abs(moved).toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The batch header
 * ------------------------------------------------------------------ */

export type BatchFact = {
  n: number;
  /** Already pluralised by the caller, because English is not a suffix. */
  label: string;
  title?: string;
  /** Drawn even at zero. Reserved for the total, which is the one count whose
   *  zero is itself the answer. */
  always?: boolean;
  tone?: RingTone;
};

/**
 * WHAT THE WHOLE LIST LOOKS LIKE, above the list.
 *
 * A ranked queue with no distribution over it invites the reader to trust rank
 * 1 without ever asking what rank 12 looks like. That is the single most common
 * failure in the queues studied and it is also the most quietly expensive: the
 * order is only worth trusting if you know what it ordered.
 *
 * A ZERO IS DROPPED, not drawn as a zero. "Information that doesn't change what
 * you do is entertainment", and a tile reading 0 is worse than no tile: it
 * spends a column of attention to say nothing happened. The total is the one
 * exception, because on an empty queue its zero IS the finding.
 */
export function BatchHeader({ facts }: { facts: BatchFact[] }) {
  const shown = facts.filter((f) => f.always || f.n > 0);
  if (shown.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--sp-space-3)",
        padding: `var(--sp-space-2) 0`,
        borderBottom: "1px solid var(--sp-line-soft)",
        fontSize: "var(--sp-text-meta)",
        color: "var(--sp-body)",
      }}
    >
      {shown.map((f, i) => (
        <React.Fragment key={f.label}>
          {i > 0 ? (
            <span aria-hidden="true" style={{ color: "var(--sp-line)" }}>
              &middot;
            </span>
          ) : null}
          <span
            title={f.title}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-ring-gap)" }}
          >
            {f.tone ? <StatusRing small fill="full" tone={f.tone} label={f.label} /> : null}
            <Num>{f.n}</Num> {f.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Selecting a row
 * ------------------------------------------------------------------ */

/**
 * The row's tick, wired to `useSelection` with shift-range intact.
 *
 * THE MODIFIER IS THE WHOLE REASON THIS IS A COMPONENT. `Checkbox`'s `onChange`
 * reports the new value and nothing else, and a range select needs to know
 * whether Shift was down. `mousedown` carries the modifier and always precedes
 * the change on the same element, so it is recorded a tick early and read back
 * when the change lands. Keyboard Space reaches the same path through keydown.
 */
export function SelectBox({
  id,
  label,
  selection,
  disabled,
}: {
  id: string;
  label: string;
  selection: Selection;
  disabled?: boolean;
}) {
  const shift = React.useRef(false);
  return (
    <span
      style={{ display: "inline-flex" }}
      onMouseDown={(e) => {
        shift.current = e.shiftKey;
      }}
      onKeyDown={(e) => {
        shift.current = e.shiftKey;
      }}
    >
      <Checkbox
        checked={selection.has(id)}
        disabled={disabled}
        label={label}
        onChange={() => selection.toggle(id, { shiftKey: shift.current })}
      />
    </span>
  );
}
