import { Children, type CSSProperties, type ReactNode } from "react";
import { MonoLabel } from "@/components/obsidian";

/**
 * DetailKit: the shared anatomy for every object detail side panel, so a
 * signal, an opportunity, a spec, a mission, an outcome, and a learning all
 * read as one premium, auditable thing (DESIGN-LOOM.md dim 17). A caller
 * assembles a detail view from these token driven primitives in the same order
 * every time: a refined header, then the summary stats, then a run of
 * consistent sections. The structure and feel are identical across object
 * types; only the content differs.
 *
 * Semantic tokens only. Ember is deliberately absent from the tone set: it
 * stays reserved for the one Capture CTA.
 */

/** The semantic tones a stat cell can carry. */
export type StatTone = "moss" | "glacier" | "madder" | "amber" | "muted" | "neutral";

const STAT_TONE_COLOR: Record<StatTone, string> = {
  moss: "var(--moss)",
  glacier: "var(--ds-gray-1000)",
  madder: "var(--madder)",
  amber: "var(--amber)",
  muted: "var(--text-muted)",
  neutral: "var(--text-primary)",
};

/** A tier tone from a 0 to 10 score: strong reads moss, mid a full-contrast
 * neutral, low a quiet muted tone. The shared rule for every scored stat
 * cell, so a strength anchor reads the same on every object. Chromatic color
 * is reserved for the strong tier only (Tempo v5 glacier narrowing, 2026-07-11):
 * a mid score is not a status, so it stays gray. */
export function toneForScore(score: number): StatTone {
  if (score >= 7) return "moss";
  if (score >= 4) return "neutral";
  return "muted";
}

export interface DetailHeaderProps {
  title: string;
  /** The colored state chips (a status pill and a verdict for an opportunity;
   * a sentiment chip for a signal), laid out in one row beneath the title. */
  chips?: ReactNode;
  /** The faint, copyable trace ref, rendered quiet per dim 17. */
  traceRef?: ReactNode;
  /** The timestamp, carried with a touch more presence than the id. */
  time?: ReactNode;
}

/**
 * The refined detail header: the object title on the first line, then a quiet
 * meta row of the state chips on the left and the time plus trace ref on the
 * right. Identical on every object type.
 */
export function DetailHeader({ title, chips, traceRef, time }: DetailHeaderProps) {
  const hasMeta = Boolean(chips || traceRef || time);
  return (
    <header style={{ display: "grid", gap: "10px" }}>
      <h2
        style={{
          margin: 0,
          paddingRight: "24px",
          fontFamily: "var(--font-ui)",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      {hasMeta ? (
        <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
          {chips}
          {time || traceRef ? (
            <span className="flex items-center" style={{ marginLeft: "auto", gap: "10px" }}>
              {time}
              {traceRef}
            </span>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export interface StatCellProps {
  label: string;
  value: string;
  tone?: StatTone;
}

/**
 * A premium, compact stat cell: a small rounded cell with a subtle tinted fill
 * and a hairline, the value in the tone color, the label in faint mono caps.
 * Kept tight so four cells sit in one row without forcing horizontal scroll.
 * The tint is derived from the tone token so it stays calm on the dark surface.
 */
export function StatCell({ label, value, tone = "neutral" }: StatCellProps) {
  const color = STAT_TONE_COLOR[tone];
  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-control)",
        padding: "6px 8px",
        textAlign: "center",
        display: "grid",
        gap: "3px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "15px",
          fontWeight: 460,
          color,
          lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "8.5px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export interface StatStripProps {
  children: ReactNode;
  /** Column count; defaults to the number of rendered cells so a conditional
   * cell never leaves an empty column. */
  columns?: number;
}

/** A horizontal grid of stat cells, the glanceable summary row of a detail. */
export function StatStrip({ children, columns }: StatStripProps) {
  const count = columns ?? Children.toArray(children).length;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(count, 1)}, minmax(0, 1fr))`,
        gap: "6px",
      }}
    >
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
 * A consistent detail section: a hairline top divider, a mono caps heading
 * marked by a tiny quiet vertical bar so each section reads as its own marker
 * without loud color, then the content. Every section on every object type
 * reads the same, so the detail view has one predictable rhythm. The accent is
 * on the heading only; section bodies stay monotone.
 */
export function DetailSection({ heading, children, action, style }: DetailSectionProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "10px",
        paddingTop: "15px",
        borderTop: "1px solid var(--hairline)",
        ...style,
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: "10px" }}>
        <span className="flex items-center" style={{ gap: "8px" }}>
          <span
            aria-hidden="true"
            style={{
              width: "2px",
              height: "11px",
              borderRadius: "999px",
              backgroundColor: "var(--text-faint)",
              flexShrink: 0,
            }}
          />
          <MonoLabel
            style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
          >
            {heading}
          </MonoLabel>
        </span>
        {action}
      </div>
      {children}
    </section>
  );
}
