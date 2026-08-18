/**
 * DetailKit: the shared anatomy for every object detail view, so a signal, an
 * opportunity, a spec, a mission, an outcome, a decision, a learning and a
 * receipt all read as one thing.
 *
 * Ported off the retired system (2026-07-29). This file is the highest-leverage
 * one in the discover set and it renders on none of its own surfaces: seven
 * live detail views import it (plan/SpecDetail, shared/StageTimeline,
 * knowledge/DecisionDetail, knowledge/LearningDetail,
 * knowledge/ContradictionAuditSection, trust/ReceiptDetailSheet and
 * discover/SignalRecord), so a legacy token in here is a legacy screen in seven
 * places. That is exactly the founder's complaint: a ported page opens a detail
 * and the old design comes back.
 *
 * What changed, and why:
 *
 * KILL the mono caps section heading (MonoLabel at 0.1em uppercase). Mono is
 *      for DATA and for nothing else; a section heading is prose. The heading
 *      is now `.sp-block-title`, sentence case, the same register every ported
 *      surface uses.
 * KILL the 2px vertical bar before each heading. It is the side-tab accent
 *      wearing a smaller coat (anti-slop ban 4), and the rule above the section
 *      already says "a new section starts here".
 * KILL the bordered, tinted stat tile. A bordered cell inside a bordered sheet
 *      is a card in a card (ban 5). The cell is now the `Cell` primitive:
 *      tinted, never bordered, and it is the shape three lanes independently
 *      rebuilt from raw tokens before `Grid`/`Cell` existed.
 * KILL every legacy token. `--hairline`, `--text-primary`, `--text-subtle`,
 *      `--text-muted`, `--moss`, `--madder`, `--amber`, `--ds-gray-1000`,
 *      `--font-mono`, `--font-sans` and `--radius-control` are all gone.
 * KEEP every exported symbol, every prop and every `StatTone` literal. Seven
 *      files in five directories construct these; the contract is theirs and
 *      this port changes not one call site.
 *
 * A NOTE ON THE TONE SET. The literals stay ("moss", "glacier", "madder",
 * "amber", "muted", "neutral") because callers name them, but they no longer
 * mean a hue from the retired palette. They map onto the colours that carry an
 * OUTCOME and nothing else: pass, fail, hold, and the neutral ink. Colour has
 * jobs here; it never decorates a number.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-18, MERIDIAN. The four inks moved: `--sp-pass`, `--sp-fail`,
 * `--sp-warn` and `--sp-mute` are now `--mrd-pass`, `--mrd-fail`, `--mrd-hold`
 * and `--mrd-mute`. `warn` became `hold` in the move because Meridian has five
 * status words and `warn` is not one of them: amber here means "waiting on a
 * CONDITION", which is what an "amber" stat cell has always meant, and orchid
 * would have been the reflex and is wrong -- orchid promises a control that
 * moves the thing, and a stat cell has none.
 *
 * WHAT DELIBERATELY DID NOT MOVE, and it is named rather than left looking like
 * an oversight:
 *
 *   `.sp-block` / `.sp-block-head` / `.sp-block-title` on `DetailSection`, and
 *   `Cell` from shell/primitives on `StatCell`. Meridian's `Region` is the
 *   equivalent COMPONENT and it is not an equivalent SHAPE: `.sp-block` is a
 *   rule plus 36px above and 28px below it, which is the "a new section starts
 *   here" mark this file's own header cites as the reason the 2px accent bar
 *   could be deleted, and `Region` draws no rule at all. `Region` also takes
 *   `goTo`/`toggle`/`act` as STRINGS, so it cannot carry the arbitrary control
 *   three callers pass as `action` -- the identical objection this file already
 *   records against `Block`. Meridian has no `Grid`/`Cell` either.
 *
 *   And the blast radius is not this file. `DetailSection` renders inside
 *   `shared/StageTimeline`, which mounts on `knowledge/DecisionDetail` and the
 *   spec route as well as here, so re-spacing it from a Decide port would
 *   change two surfaces belonging to other lanes to buy six token references.
 *   Reported as a real Meridian gap (a region that draws its own rule, and a
 *   region head that accepts a control) rather than papered over.
 */

import { Children, type CSSProperties, type ReactNode } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { Cell } from "@/components/shell/primitives";

/** The semantic tones a stat cell can carry. */
export type StatTone = "moss" | "glacier" | "madder" | "amber" | "muted" | "neutral";

/** Tone to the token that owns the colour, the same shape `OpportunityRow`'s
 * `STATUS_META` uses so a status reads identically on a row and in a stat.
 *
 * Three of the six carry a real OUTCOME and take an outcome colour. "muted"
 * takes the quiet ink because quiet is a fact about the value, not an outcome.
 * "neutral" and "glacier" take nothing at all: the cell's lead is already full
 * contrast ink, and a tone that carries no outcome gets no colour. If colour
 * were carrying the hierarchy, the hierarchy was never there. */
const STAT_TONE_INK: Record<StatTone, string | undefined> = {
  moss: "var(--mrd-pass)",
  madder: "var(--mrd-fail)",
  amber: "var(--mrd-hold)",
  muted: "var(--mrd-mute)",
  glacier: undefined,
  neutral: undefined,
};

/** A tier tone from a 0 to 10 score: strong reads as a pass, mid as full
 * contrast neutral, low as quiet. The shared rule for every scored stat cell,
 * so a strength anchor reads the same on every object. Colour is reserved for
 * the strong tier only: a mid score is not an outcome, so it stays neutral. */
export function toneForScore(score: number): StatTone {
  if (score >= 7) return "moss";
  if (score >= 4) return "neutral";
  return "muted";
}

export interface DetailHeaderProps {
  title: string;
  /** The state words for this object (a status and a verdict for an
   * opportunity, a sentiment for a signal), folded into the one meta line. */
  chips?: ReactNode;
  /** The copyable trace ref, quiet. */
  traceRef?: ReactNode;
  /** The timestamp. */
  time?: ReactNode;
}

/** Joins whatever the caller actually passed with the system's separator, so a
 * missing chip never leaves a dangling dot. */
function metaLine(parts: ReactNode[]): ReactNode[] {
  const present = parts.filter(Boolean);
  return present.flatMap((part, i) => (i === 0 ? [part] : [" · ", part]));
}

/**
 * The detail header: the object title, then ONE quiet meta line carrying its
 * state, when it last moved, and its trace ref.
 *
 * It was a title plus a two-sided flex rail that pushed time and trace to the
 * right edge. That rail was a second alignment axis inside a panel that already
 * has one, and it broke to two lines on a narrow sheet. One line, one register,
 * one separator: the same shape the ported surfaces use under `PageHead`.
 *
 * Stays an `<h2>`: this renders inside a surface that already owns the `<h1>`,
 * so promoting it would give the page two top-level headings.
 */
export function DetailHeader({ title, chips, traceRef, time }: DetailHeaderProps) {
  const meta = metaLine([chips, time, traceRef]);
  return (
    <header>
      <h2 className="sp-title">{title}</h2>
      {meta.length > 0 ? <div className="sp-subtitle">{meta}</div> : null}
    </header>
  );
}

export interface StatCellProps {
  label: string;
  value: string;
  tone?: StatTone;
}

/** Whether a stat's value is DATA rather than a word.
 *
 * The kit has to decide this per value, not per caller: the same `StatCell` is
 * handed "8.5", "$0.04", "2h", "42" and "Backlog", "Shipped", "Review",
 * "Manual" by seven files this lane may not edit. Mono is for every number,
 * duration, count, cost, identifier and timestamp and for nothing else, so a
 * blanket wrap would put "Backlog" in IBM Plex Mono and a blanket skip would
 * take the tabular figures off every score. A leading digit, sign or currency
 * mark is the honest test, and it is applied here once rather than guessed at
 * in five directories. */
function looksLikeData(value: string): boolean {
  return /^[+\-$£€#]?\d/.test(value.trim());
}

/**
 * One stat: the fact first, its name under it.
 *
 * It was a tinted, hairlined, centred tile. Nineteen of those in one region is
 * nineteen bordered containers and the cap is one, so it is now the `Cell`
 * primitive, which is tinted and never bordered, and which sits `recessed`
 * because a detail view is already raised ground.
 */
export function StatCell({ label, value, tone = "neutral" }: StatCellProps) {
  const ink = STAT_TONE_INK[tone];
  const body = looksLikeData(value) ? <Num>{value}</Num> : value;
  return (
    <Cell
      tone="recessed"
      lead={ink ? <span style={{ color: ink }}>{body}</span> : body}
      sub={label}
      title={`${label}: ${value}`}
    />
  );
}

export interface StatStripProps {
  children: ReactNode;
  /** Column count; defaults to the number of rendered cells so a conditional
   * cell never leaves an empty column. */
  columns?: number;
}

/**
 * The glanceable summary row of a detail: a short, fixed run of stats read
 * across rather than down.
 *
 * Uses the `Grid` primitive's own class, with the column count written
 * explicitly rather than left to the auto-fill. That is a real difference: the
 * primitive's `auto-fill, minmax(196px, 1fr)` is right for a catalog of unknown
 * length, and wrong here, where the caller knows there are exactly three stats
 * and three stats reading 2 + 1 is a worse fact than three across.
 */
export function StatStrip({ children, columns }: StatStripProps) {
  const count = Math.max(columns ?? Children.toArray(children).length, 1);
  return (
    <div className="sp-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {children}
    </div>
  );
}

export interface DetailSectionProps {
  heading: string;
  children: ReactNode;
  /** An optional control aligned to the right of the heading. */
  action?: ReactNode;
  style?: CSSProperties;
}

/**
 * One section of a detail view: a rule where the content changes register, the
 * heading, then the content.
 *
 * This is the `Block` primitive's exact markup, class for class, rather than
 * `Block` itself. `Block` takes `more` plus `onMore`, which is a text button;
 * three callers pass an arbitrary control here (a menu, an export, a delete).
 * Sharing the classes rather than the component is what keeps a detail section
 * and a surface section from drifting apart, which is how the last system rotted
 * one screen at a time.
 */
export function DetailSection({ heading, children, action, style }: DetailSectionProps) {
  return (
    <section className="sp-block" style={style}>
      <div className="sp-block-head">
        <span className="sp-block-title">{heading}</span>
        {action ?? null}
      </div>
      {children}
    </section>
  );
}
