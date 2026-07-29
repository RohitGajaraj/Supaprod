/**
 * The primitives. Step 3 of the rebuild.
 *
 * Surfaces are BUILT OUT OF THESE rather than designed one at a time. That is
 * the whole reason this file exists: the four rejected directions were all
 * assembled per screen, so nothing was consistent and every screen was a new
 * argument. A surface that reaches for a raw <div> with its own padding is
 * re-opening that argument.
 *
 * Anatomy: PROTOTYPE-v2.html. Styles: src/styles/primitives.css.
 * Tokens: src/styles/ink.css. Nothing here carries a literal colour or size.
 */

import * as React from "react";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { glyphForSlug, stageHueForSlug } from "./agent-glyphs";

/* ------------------------------------------------------------------ *
 * Agent mark
 * ------------------------------------------------------------------ */

/** State is never a hue. A ring means running, low opacity means quiet, ember
 *  means it needs you, red means it failed. */
export type MarkState = "quiet" | "idle" | "running" | "gate" | "failed";

export function AgentMark({
  slug,
  state = "idle",
  size = "sm",
  name,
  title,
}: {
  slug: string | null | undefined;
  state?: MarkState;
  size?: "sm" | "lg";
  /** Fallback display name when the catalog does not know the slug. */
  name?: string | null;
  title?: string;
}) {
  const Glyph = glyphForSlug(slug);
  const label = title ?? agentDisplayName(slug, name);
  return (
    <span
      className="sp-mark"
      data-state={state}
      data-size={size}
      // The hue is the agent's STAGE, not the agent. Set as a custom property
      // so the CSS owns every mix and this file owns no colour.
      style={{ "--sp-hue": stageHueForSlug(slug) } as React.CSSProperties}
      title={label}
      role="img"
      aria-label={state === "idle" ? label : `${label}, ${state}`}
    >
      <Glyph />
    </span>
  );
}

/** Two or more at once read as one crew doing one job. */
export function MarkStack({
  agents,
  state = "running",
}: {
  agents: { slug: string | null | undefined; name?: string | null }[];
  state?: MarkState;
}) {
  if (agents.length === 0) return null;
  if (agents.length === 1) {
    return <AgentMark slug={agents[0].slug} name={agents[0].name} state={state} />;
  }
  return (
    <span className="sp-stack">
      {agents.slice(0, 4).map((a, i) => (
        <AgentMark key={`${a.slug ?? "x"}-${i}`} slug={a.slug} name={a.name} state={state} />
      ))}
    </span>
  );
}

/** You. A solid filled disc, so you are a different KIND of thing from an
 *  agent rather than a different colour of the same thing. `mine` lights it
 *  ember only when the moment is genuinely yours. */
export function YouMark({ initials, mine = false }: { initials: string; mine?: boolean }) {
  return (
    <span className="sp-you" data-mine={mine} role="img" aria-label="You">
      {initials}
    </span>
  );
}

/** The crew drafted it and you changed it. */
export function PairMark({
  slug,
  initials,
  name,
  state = "idle",
  mine = true,
}: {
  slug: string | null | undefined;
  initials: string;
  name?: string | null;
  state?: MarkState;
  mine?: boolean;
}) {
  return (
    <span className="sp-pair">
      <AgentMark slug={slug} name={name} state={state} />
      <YouMark initials={initials} mine={mine} />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Block: a rule wherever the content changes register
 * ------------------------------------------------------------------ */

export function Block({
  title,
  sub,
  more,
  onMore,
  children,
}: {
  title?: string;
  /** What this section is for, said ONCE. If it restates the title it should
   *  not exist (hard ban 10: label, sublabel and helper all saying the same
   *  thing). Six surfaces in the first port pass reached for this and
   *  hand-rolled it, so it is a real slot rather than a convenience. */
  sub?: React.ReactNode;
  more?: string;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="sp-block">
      {(title || more) && (
        <div className="sp-block-head">
          {title ? <span className="sp-block-title">{title}</span> : <span />}
          {more ? (
            <button type="button" className="sp-block-more" onClick={onMore}>
              {more}
            </button>
          ) : null}
        </div>
      )}
      {sub ? <div className="sp-block-sub">{sub}</div> : null}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Attribution row: who did what, and when
 * ------------------------------------------------------------------ */

export function Row({
  marks,
  lead,
  sub,
  time,
  onClick,
  tight = false,
  focused = false,
}: {
  /** The mark slot is a fixed width, so text starts on the same line whether
   *  the row carries one mark or two. */
  marks?: React.ReactNode;
  lead: React.ReactNode;
  sub?: React.ReactNode;
  time?: string | null;
  onClick?: () => void;
  /** A row in a LIST never wraps. Founder ruling: one or two lines, and depth
   *  is a click away rather than showcased on the surface. Pass tight for any
   *  row whose full content has a detail view to open. */
  tight?: boolean;
  focused?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className="sp-row"
      data-tight={tight}
      data-focused={focused}
      onClick={onClick}
      {...(onClick ? { type: "button" as const } : {})}
    >
      <span className="sp-row-marks">{marks}</span>
      <span className="sp-row-body">
        <span className="sp-row-lead">{lead}</span>
        {sub ? <span className="sp-row-sub">{sub}</span> : null}
      </span>
      {time ? <span className="sp-row-time">{time}</span> : null}
    </Tag>
  );
}

/** The actor's name inside a row lead. */
export function Who({ children }: { children: React.ReactNode }) {
  return <span className="sp-row-who">{children}</span>;
}

/* ------------------------------------------------------------------ *
 * Diffstat
 * ------------------------------------------------------------------ */

export function Diffstat({ added, removed }: { added: number; removed: number }) {
  return (
    <span className="sp-diff" aria-label={`${added} added, ${removed} removed`}>
      <b className="sp-pass">+{added}</b>
      <b className="sp-fail">&minus;{removed}</b>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Gate: the biggest thing on the surface, and not a card in a card
 * ------------------------------------------------------------------ */

export function Gate({
  question,
  lines,
  children,
}: {
  /** A question, in plain words. Never a mechanism word. */
  question: React.ReactNode;
  /** What it actually does. One fact per line, never four ways of saying one. */
  lines?: React.ReactNode[];
  /** The actions. One primary, and only one. */
  children?: React.ReactNode;
}) {
  return (
    <section className="sp-gate">
      <h2 className="sp-gate-q">{question}</h2>
      {lines?.length ? (
        <div className="sp-gate-what">
          {lines.map((line, i) => (
            <div className="sp-gate-line" key={i}>
              <span>{line}</span>
            </div>
          ))}
        </div>
      ) : null}
      {children ? <div className="sp-acts">{children}</div> : null}
    </section>
  );
}

export function Button({
  variant = "default",
  shortcut,
  children,
  ...rest
}: {
  variant?: "default" | "primary" | "ghost";
  shortcut?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="sp-btn" data-variant={variant} {...rest}>
      {children}
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The record speaking: the one lit surface in the product
 * ------------------------------------------------------------------ */

export function Record({
  children,
  evidence,
}: {
  /** What the record says. It contradicts you or it confirms you; either way
   *  it is a claim, not a statistic. */
  children: React.ReactNode;
  /** What backs it. Counts and dates, in mono. */
  evidence?: React.ReactNode;
}) {
  return (
    <div className="sp-record">
      <span className="sp-record-mark" aria-hidden="true" />
      <span className="sp-record-body">
        <span className="sp-record-text">{children}</span>
        {evidence ? <span className="sp-record-evidence">{evidence}</span> : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page head and layout
 * ------------------------------------------------------------------ */

export function PageHead({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <>
      <h1 className="sp-title">{title}</h1>
      {sub ? <div className="sp-subtitle">{sub}</div> : null}
    </>
  );
}

/** The work region's ported layout. `context` never disappears: on a narrow
 *  region it stacks under the main column rather than hiding, because hiding
 *  it loses information a 14 inch laptop needs just as much as a 32 inch one. */
export function Surface({
  children,
  context,
  wide = false,
}: {
  children: React.ReactNode;
  context?: React.ReactNode;
  /** Drop the 74ch measure. The measure exists so a LINE OF PROSE stays
   *  readable; it is the wrong constraint for a grid, a table or a canvas,
   *  which want the room. Caught on the Crew roster, where the cap squeezed a
   *  13-card grid into two columns with half the screen empty. Prose keeps
   *  the measure; anything laid out in columns of its own passes wide. */
  wide?: boolean;
}) {
  return (
    <div className="sp-inner">
      <div className={wide ? "sp-wide" : "sp-main"}>{children}</div>
      {context ? <aside className="sp-ctx">{context}</aside> : null}
    </div>
  );
}

/** Honest, names who acts next, never a bare "No results". */
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="sp-empty">{children}</p>;
}

/** A read that FAILED is not an empty state, and must never wear one's clothes:
 *  "nothing here" and "we could not find out" are different facts and the user
 *  acts differently on each. Three surfaces in the first port pass stood Empty
 *  in for this, so it is a primitive. */
export function Failed({
  children,
  onRetry,
  retryLabel = "Try again",
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <p className="sp-empty">
      <span className="sp-fail">{children}</span>
      {onRetry ? (
        <>
          {" "}
          <button type="button" className="sp-block-more" onClick={onRetry}>
            {retryLabel}
          </button>
        </>
      ) : null}
    </p>
  );
}

/** One labelled control. ONE label: if a second line appears it carries
 *  different information, never a restatement. */
export function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="sp-field" htmlFor={htmlFor}>
      <span className="sp-field-label">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="sp-input" {...props} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="sp-select" {...props} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="sp-textarea" {...props} />;
}

/** Logs, diffs, exported documents. Scrolls inside its own box so the page
 *  never scrolls sideways. */
export function Pre({ children }: { children: React.ReactNode }) {
  return <pre className="sp-pre">{children}</pre>;
}

/** A row of actions. One primary among them, and only one. */
export function Actions({ children }: { children: React.ReactNode }) {
  return <div className="sp-acts">{children}</div>;
}

/** Every number, duration, count, diff, identifier and timestamp. */
export function Num({ children }: { children: React.ReactNode }) {
  return <span className="sp-num">{children}</span>;
}
