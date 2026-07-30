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
 *
 * DELIBERATELY ABSENT: a pane, a slide-over, a drawer.
 *
 * `--sp-pane-ask-w`, `--sp-pane-settings-w`, `--sp-pane-inset` and
 * `--sp-radius-pane` are declared in ink.css and nothing implements them, which
 * reads like an oversight and is not one. Three reasons, and they compound:
 *
 *   1. The standard's own fix for modal abuse (anti-slop.md ban 11) is "a panel
 *      or a page. A modal only for a single irreversible confirmation." A
 *      slide-over is the thing that ban exists to stop, one step softer.
 *   2. A lane that wanted one built its detail view IN PLACE instead, and that
 *      is the better surface. Shipping the pane would invite the reverse trade.
 *   3. A pane is not a stylesheet. It is a focus trap, a scroll lock, Escape,
 *      focus returned to whatever opened it, and the page behind it made inert.
 *      Half of that is an accessibility regression wearing a primitive's name.
 *
 * If one is ever built it has exactly one job: the Ask composer, summoned over
 * any surface, because a question about what is on screen must not take the
 * screen away. It must never hold settings, a form of more than one field, a
 * detail view, or anything that has an address of its own.
 */

import * as React from "react";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { glyphForSlug, stageHueForSlug } from "./agent-glyphs";
import { IconMore } from "./icons";

/* ------------------------------------------------------------------ *
 * Agent mark
 * ------------------------------------------------------------------ */

/** State is never a hue. A ring means running, low opacity means quiet, ember
 *  means it needs you, red means it failed.
 *
 *  "gate" BLINKS and is the only blink in the system, so exactly one mark on a
 *  screen may wear it: the one thing actually asking. "waiting" is the same
 *  ember without the animation, for the items queued behind it. Reported from
 *  the receipts room, where every pending row took the gate state and a
 *  workspace with many open decisions blinked a dozen marks at once, which
 *  spends the whole restraint budget and stops the blink meaning "look here". */
/**
 * `verified` completes the outcome pair the system already declares.
 *
 * SYSTEM.md rule 1 says "Green and red carry outcomes", and only red existed:
 * `failed`. So a run that succeeded and a run that merely stopped looked
 * identical, both wearing the neutral `idle` grey, while a failure was loud.
 * The product could shout at you about a loss and had no way to show a win.
 *
 * IT IS NOT "DONE". It is "done AND we can prove it": reserved for a merged
 * changeset with a real clickable pull request behind it, which is exactly
 * what `completionEvidence` already means by "verified". A run that claims
 * done with nothing behind it stays neutral, because painting every finished
 * run green would be the product asserting success it never checked, which is
 * the one thing it is careful never to do.
 */
export type MarkState = "quiet" | "idle" | "running" | "gate" | "waiting" | "failed" | "verified";

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

/**
 * Two or more at once read as one crew doing one job.
 *
 * THE STACK ENFORCES THE ONE BLINK, because a caller cannot. `gate` is the only
 * animated state in the system and SYSTEM.md allows exactly one mark on a
 * screen to wear it, but this component takes ONE state and applied it to every
 * agent, so a stack of four asked for `gate` blinked four marks in unison. That
 * is the precise failure the rule was written after ("a list that gave every
 * pending row `gate` blinked a dozen marks at once and spent the whole
 * restraint budget"), reproduced by the component meant to be governed by it.
 *
 * So a stack asked for `gate` gives it to the FIRST mark and dresses the rest
 * as `waiting`, which is the same ember without the animation and is exactly
 * what the rule prescribes for everything queued behind the one asking. Held
 * here rather than at each call site: a rule every caller must remember is a
 * rule that gets forgotten, and this one already was.
 */
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
        <AgentMark
          key={`${a.slug ?? "x"}-${i}`}
          slug={a.slug}
          name={a.name}
          // Only the first may blink. See the note above.
          state={state === "gate" && i > 0 ? "waiting" : state}
        />
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
  action,
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
  /** A control belonging to THIS row (revert, copy, open elsewhere). It sits
   *  outside the clickable region so it is never a button inside a button. */
  action?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="sp-row-marks">{marks}</span>
      <span className="sp-row-body">
        <span className="sp-row-lead">{lead}</span>
        {sub ? <span className="sp-row-sub">{sub}</span> : null}
      </span>
      {time ? <span className="sp-row-time">{time}</span> : null}
    </>
  );

  // A row that is clickable AND carries its own control cannot be one button:
  // a button inside a button is invalid, and a 38px control would double the
  // row height. So the row becomes a container, the readable part becomes the
  // clickable region, and the control sits outside it at the trailing edge.
  if (onClick && action) {
    return (
      <div className="sp-row" data-tight={tight} data-focused={focused} data-has-action="true">
        <button type="button" className="sp-row-open" onClick={onClick}>
          {body}
        </button>
        <span className="sp-row-action">{action}</span>
      </div>
    );
  }

  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className="sp-row"
      data-tight={tight}
      data-focused={focused}
      onClick={onClick}
      {...(onClick ? { type: "button" as const } : {})}
    >
      {body}
      {action ? <span className="sp-row-action">{action}</span> : null}
    </Tag>
  );
}

/** The actor's name inside a row lead. */
export function Who({ children }: { children: React.ReactNode }) {
  return <span className="sp-row-who">{children}</span>;
}

/* ------------------------------------------------------------------ *
 * Grid and cell: the shape for things that are SCANNED
 * ------------------------------------------------------------------ */

/** A list is read down. A catalog is scanned across.
 *
 *  Reported by three lanes at once, each of which built this from raw tokens
 *  because the only grid in the system was the crew roster's `.sp-agrid` /
 *  `.sp-acard`, whose names say AGENT and which therefore cannot be borrowed for
 *  a source catalog or a price ladder without the class lying about its content.
 *  The roster keeps its own pair, because on that one surface the hue is
 *  information; this is the neutral shape for everywhere else.
 *
 *  The arithmetic that makes it a grid rather than a column: nineteen providers
 *  down a column is nineteen rows of scrolling, and the same nineteen at three
 *  or four across is five. */
export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="sp-grid">{children}</div>;
}

/** One cell of a Grid.
 *
 *  TINTED, NEVER BORDERED. Nineteen bordered cells in one region is nineteen
 *  bordered containers, and the standard caps a region at one (anti-slop.md
 *  ban 5). It reads as a cell because the ground under it changes, and the WHOLE
 *  cell is the affordance rather than carrying a button, which is what keeps it
 *  two lines tall.
 *
 *  It is a REAL `<button>` when it does something, so it is tabbable, it answers
 *  Space and Enter, and it takes the app-wide focus ring without being asked.
 *  That is the second reported gap: `.sp-acard` was written for a `<div>`, so
 *  every lane that needed a clickable card wrote the same eight-property reset
 *  inline. The reset lives in the stylesheet now.
 *
 *  The tint is a CUSTOM PROPERTY rather than a background, which is the whole
 *  reason `tone` works. A lane reported the real constraint: an inline
 *  background silently outranks a class hover, so their cells had to fake hover
 *  with onMouseEnter state. Here the hover is COMPUTED from `--sp-cell-bg`, so
 *  changing the tint changes the hover with it and neither one can win over the
 *  other. */
export function Cell({
  mark,
  lead,
  sub,
  onClick,
  selected,
  disabled = false,
  tone = "raised",
  title,
}: {
  /** An AgentMark or nothing. A cell for a thing nobody acts as carries none. */
  mark?: React.ReactNode;
  lead: React.ReactNode;
  /** The different fact, never a restatement of the lead (hard ban 10). */
  sub?: React.ReactNode;
  /** Absent when nothing happens on click. An affordance is a promise, so a
   *  cell that does nothing is a div and never lights up under the cursor. */
  onClick?: () => void;
  /** Present only on a cell that is one of a set you PICK from. It makes the
   *  cell a toggle to a screen reader, so leave it undefined on a cell that
   *  opens or connects something. */
  selected?: boolean;
  disabled?: boolean;
  /** `recessed` for a cell sitting on already-raised ground. Two tones, both
   *  existing surface tokens, because a cell is furniture and furniture does
   *  not need a palette. */
  tone?: "raised" | "recessed";
  title?: string;
}) {
  const body = (
    <>
      {mark}
      <span className="sp-cell-body">
        <span className="sp-cell-lead">{lead}</span>
        {sub ? <span className="sp-cell-sub">{sub}</span> : null}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div
        className="sp-cell"
        data-tone={tone}
        data-disabled={disabled}
        title={title}
        aria-disabled={disabled || undefined}
      >
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="sp-cell"
      data-tone={tone}
      data-disabled={disabled}
      data-selected={selected ?? false}
      aria-pressed={selected}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {body}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Diffstat
 * ------------------------------------------------------------------ */

export function Diffstat({
  added,
  removed,
  unit = "lines",
}: {
  added: number;
  removed: number;
  /** What is being counted. The shape reads as LINES by default, so a panel
   *  counting characters must say so rather than borrowing a meaning it does
   *  not have. Reported from the changes panel, whose rows carry char deltas. */
  unit?: string;
}) {
  return (
    <span className="sp-diff" aria-label={`${added} ${unit} added, ${removed} ${unit} removed`}>
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
  icon = false,
  children,
  ...rest
}: {
  variant?: "default" | "primary" | "ghost";
  shortcut?: string;
  /** The child is a glyph, not a word. Squares the box (the padding that gives
   *  a word room draws a lozenge around a 17px mark) and makes `aria-label`
   *  mandatory in spirit: a wordless control with no accessible name is a
   *  control only sighted mouse users have. */
  icon?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="sp-btn"
      data-variant={variant}
      data-icon={icon ? "true" : undefined}
      {...rest}
    >
      {children}
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The Commit receipt: the signature moment
 * ------------------------------------------------------------------ */

/** What a judgment left behind.
 *
 *  Doctrine: agents/FINAL-agent-presence.md R10 and §9, which names the defect
 *  by file and line. An approval must NOT vanish into a toast. A toast confirms
 *  that your click registered; a receipt renders what your click CAUSED, and
 *  that difference is the product thesis expressed as an interaction. An
 *  approval that erases itself teaches you that your judgment left no trace,
 *  and judgment is the product.
 *
 *  `handoff` draws the arrow to whoever picks the work up, and is drawn ONLY
 *  when something real does. Where nothing follows, pass nothing and let
 *  `consequence` say what changed instead. Never an arrow to nowhere.
 */
export function Receipt({
  verb,
  consequence,
  handoff,
  time,
  failed = false,
  initials,
}: {
  /** What you did, in your own voice: "You approved", "You sent it back". */
  verb: string;
  /** What it caused. Real, per-item, never a generic confirmation. */
  consequence: React.ReactNode;
  /** The agent that picked it up, if one genuinely did. */
  handoff?: { slug: string | null | undefined; name?: string | null } | null;
  time?: string | null;
  failed?: boolean;
  initials?: string;
}) {
  return (
    <div className="sp-receipt" data-failed={failed}>
      {initials ? <YouMark initials={initials} mine /> : null}
      <span className="sp-receipt-what">
        <span className="sp-receipt-verb">{verb}</span>
        {" · "}
        {consequence}
      </span>
      {handoff ? (
        <>
          <span className="sp-receipt-arrow" aria-hidden="true">
            &rarr;
          </span>
          <AgentMark slug={handoff.slug} name={handoff.name} state="running" />
        </>
      ) : null}
      {time ? <span className="sp-receipt-time">{time}</span> : null}
    </div>
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

/** Honest, names who acts next, never a bare "No results".
 *
 *  `action` is the door. An empty state that names who acts next but gives you
 *  no way to act is only half honest, and every ported surface was wrapping one
 *  in a Gate to get a button. */
export function Empty({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="sp-empty">
      <p>{children}</p>
      {action ? <div className="sp-acts">{action}</div> : null}
    </div>
  );
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

/** A read still in flight. The THIRD fact: Empty says "nothing here", Failed
 *  says "we could not find out", and neither is true yet. It reserves the
 *  height so the layout does not jump, and says so in words. No shimmer:
 *  motion confirms, and this has nothing to confirm yet. */
export function Loading({ children = "Reading." }: { children?: React.ReactNode }) {
  return (
    <p className="sp-loading" aria-live="polite">
      {children}
    </p>
  );
}

/** Agent-written prose: release notes, a launch draft, a rationale. Pre is for
 *  code and holds its whitespace; this is a document a person reads, so it
 *  keeps the measure.
 *
 *  `markdown` is the SAME prose in a different container, and it is a flag
 *  rather than a second primitive so that the size, the leading and the ink can
 *  never fork. Pass it when the children are parsed Markdown elements rather
 *  than a raw string: it drops the panel (a tint behind every answer in a
 *  thread is wallpaper, and the one recessed surface here belongs to the
 *  record), drops `pre-wrap` (parsed blocks carry their own breaks, so keeping
 *  it doubles every gap) and drops the 68ch measure (inside Ask the pane IS the
 *  measure). Element rules live in primitives.css under `.sp-prose`. */
export function Prose({
  children,
  markdown = false,
}: {
  children: React.ReactNode;
  markdown?: boolean;
}) {
  return (
    <div className="sp-prose" data-markdown={markdown ? "true" : undefined}>
      {children}
    </div>
  );
}

/** Logs, diffs, exported documents. Scrolls inside its own box so the page
 *  never scrolls sideways. */
export function Pre({ children }: { children: React.ReactNode }) {
  return <pre className="sp-pre">{children}</pre>;
}

/**
 * WHAT ELSE YOU COULD DO WITH THIS ONE THING.
 *
 * Founder ruling 2026-07-30, about the model-and-cost line that used to sit
 * under every Ask answer: *"it looks like a message itself... probably we can
 * give it like a Lovable model, three dots after each item, and if I click
 * three dots there are a couple of action items there."*
 *
 * The rule it encodes is worth more than the menu: SECONDARY FACTS ARE NOT
 * CONTENT. A cost figure printed in the reading column is read as part of the
 * answer, and reading it is not optional; behind a control it is available to
 * anyone who wants it and silent for everyone who does not. That is the same
 * argument the Engine Room doctrine makes about machinery, applied to one line.
 *
 * DELIBERATELY NOT A LIBRARY MENU. No portal, no floating-ui, no roving
 * listbox: this opens downward inside a pane that already scrolls, and the
 * items are plain buttons in document order, so the keyboard gets Tab and
 * Escape for free and a screen reader gets a real expanded/collapsed state.
 * A popover that escapes its scroll container would need all of that machinery
 * back to stay attached to the row it belongs to.
 */
export function MoreMenu({
  label = "More",
  children,
}: {
  /** Names the thing the menu belongs to, for anyone who cannot see it. */
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement | null>(null);

  // Click away and Escape both close it. A menu with no way out but a second
  // press on the same 38px target is a trap on a touch screen.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    // Capture, so closing the menu happens before Ask's own Escape handler
    // hears the key and closes the whole pane out from under it.
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="sp-more" ref={box}>
      <button
        type="button"
        className="sp-more-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMore />
      </button>
      {open ? (
        <div className="sp-more-menu" role="group" aria-label={label}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** One line in a MoreMenu. A word, and what it does when pressed. */
export function MoreItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="sp-more-item" onClick={onClick}>
      {children}
    </button>
  );
}

/** One boundary you set: label left, control right, one per line.
 *
 *  Reported from Settings as the most-used shape on that surface. The
 *  governance canon is the reason it is a line and not a card: policy is set
 *  in advance and does not block, so a boundary reads as a sentence with a
 *  switch at the end of it, not as a panel demanding attention. `sub` says
 *  WHY it matters or what it currently lets through, never a restatement. */
export function Line({
  label,
  sub,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  /** The id of the control on the right, when there is exactly one and it is a
   *  real form control.
   *
   *  Reported as a defect: Line rendered its label in a `<span>`, so a Line
   *  wrapping an Input or a Select had no `<label for>` at all and every lane
   *  patched it with `aria-label`, which duplicates the text a sighted person
   *  is already reading and leaves the label unclickable. Passing an id
   *  promotes the span to a real `<label>`.
   *
   *  ADDITIVE ON PURPOSE. Omitting it renders exactly the markup Line rendered
   *  before, span for span and class for class, so the dozens of Lines whose
   *  right side is a Button, a Value or nothing at all are untouched: a
   *  `<label for>` pointing at a button would make the label a second way to
   *  fire it, which is wrong for a control that acts rather than holds a value. */
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  const labelBody = (
    <>
      {label}
      {sub ? <span className="sp-line-sub">{sub}</span> : null}
    </>
  );
  return (
    <div className="sp-line">
      {htmlFor ? (
        <label className="sp-line-label" htmlFor={htmlFor}>
          {labelBody}
        </label>
      ) : (
        <span className="sp-line-label">{labelBody}</span>
      )}
      {children ? <span className="sp-line-control">{children}</span> : null}
    </div>
  );
}

/** A fact on the right of a Line, with no control attached.
 *
 *  Reported as lower priority and kept, because the surfaces already carry four
 *  hand-rolled copies of it: the two model rows, the subscription status word
 *  and the key-test result each build the same muted span from raw tokens. A
 *  pinned tool, a plan that only the owner can change, a model chosen for you:
 *  all of them are a boundary you can READ and cannot set from here, and an
 *  empty right-hand slot says nothing about which.
 *
 *  `tone` is for a value that is itself an outcome, which is the one case where
 *  colour is carrying information rather than decorating a fact. Numbers inside
 *  it still go in Num; this sets the voice, not the face. */
export function Value({
  children,
  tone = "quiet",
}: {
  children: React.ReactNode;
  tone?: "quiet" | "pass" | "warn" | "fail";
}) {
  return (
    <span className="sp-value" data-tone={tone}>
      {children}
    </span>
  );
}

/** On or off. Green when on, because green carries status and a live boundary
 *  is a status. Never ember: ember marks the human, not a setting. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Required: a bare switch is unreadable to a screen reader. */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      className="sp-switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

/** One value you tick, as part of something you will submit.
 *
 *  NOT the same instrument as Switch, and the difference is when it takes
 *  effect. A Switch is a boundary that goes live the moment you touch it, which
 *  is why it wears green when it is on. A Checkbox is a value that sits there
 *  until something else acts on it: a task marked done, a row picked for a bulk
 *  action, a term accepted before a destructive confirm. So it stays monochrome,
 *  and it survives the greyscale test on shape alone.
 *
 *  A real `<input type="checkbox">` under the drawn box, never a div wearing a
 *  role: it is keyboard-native, it takes Space for free, it participates in a
 *  form, and it reports its own state without being told to.
 *
 *  `label` is the fallback name. Pass `id` and point a Line or a Field at it
 *  with `htmlFor` wherever there is visible label text, so a screen reader reads
 *  the same words a sighted person does rather than a second copy that can
 *  drift from them. */
export function Checkbox({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Required: a bare checkbox is unreadable to a screen reader. Used only when
   *  no `id` binds it to visible label text. */
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="checkbox"
      className="sp-check"
      id={id}
      checked={checked}
      disabled={disabled}
      aria-label={id ? undefined : label}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

type ChoiceOption<T extends string> = {
  id: T;
  label: React.ReactNode;
  /** What the label cannot say in one word. */
  title?: string;
  disabled?: boolean;
};

/** A short set of named options, picked from in place.
 *
 *  THE RULING on the reported gap. Three lanes each hand-rolled a row of
 *  buttons carrying `aria-pressed` and asked whether it should have been a
 *  Checkbox or a multi-select Switch. It should not: the button group was the
 *  right shape and what it lacked was a name and its keyboard.
 *
 *  A Switch is wrong because a switch means THIS BOUNDARY IS LIVE NOW, and
 *  three switches in a row cannot say which channel each one is: the words are
 *  the control here. A Checkbox is wrong because these options are read across
 *  as one decision ("where does an approval reach me"), not ticked down a list,
 *  and a checkbox column would double the height of every row on the surface.
 *
 *  What was genuinely broken is the ARIA, and it differs by mode, which is why
 *  the mode is now declared rather than assumed:
 *
 *  · `any` is a real multi-select. Each option is an independent toggle, so
 *    `aria-pressed` is correct and every option is its own tab stop. This is the
 *    notification channel picker, unchanged in behaviour.
 *  · `one` is mutually exclusive, and `aria-pressed` was quietly wrong for it:
 *    it announces three toggle buttons and never says that picking one unpicks
 *    the others, and it spends three tab stops on one decision. It is a radio
 *    group, so it is one tab stop and the arrow keys move within it.
 *
 *  Deliberately styled from `.sp-btn` rather than given a look of its own, so
 *  adopting it changes the semantics and the keyboard and not one pixel. */
export function Choices<T extends string>(
  props: {
    /** Names the whole decision for a screen reader, not the options. */
    label: string;
    options: ChoiceOption<T>[];
    onPick: (id: T) => void;
  } & ({ mode?: "one"; value: T } | { mode: "any"; value: readonly T[] }),
) {
  const { label, options, onPick } = props;
  const multi = props.mode === "any";
  const isOn = (id: T) => (props.mode === "any" ? props.value.includes(id) : props.value === id);

  const btns = React.useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  // The roving tab stop. Falls back to the first enabled option when nothing is
  // picked yet, because a radio group with no tabbable member is a decision the
  // keyboard cannot reach at all.
  const reachable = options.filter((o) => !o.disabled);
  const stop = (reachable.find((o) => isOn(o.id)) ?? reachable[0])?.id;

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, from: T) {
    if (multi) return;
    const pool = options.filter((o) => !o.disabled);
    if (pool.length === 0) return;
    let next: ChoiceOption<T> | undefined;
    if (e.key === "Home") next = pool[0];
    else if (e.key === "End") next = pool[pool.length - 1];
    else if (
      e.key === "ArrowRight" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowUp"
    ) {
      const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const here = pool.findIndex((o) => o.id === from);
      next = pool[(here + step + pool.length) % pool.length];
    }
    if (!next) return;
    e.preventDefault();
    onPick(next.id);
    btns.current[next.id]?.focus();
  }

  return (
    <span className="sp-choices" role={multi ? "group" : "radiogroup"} aria-label={label}>
      {options.map((o) => {
        const on = isOn(o.id);
        const state: React.ButtonHTMLAttributes<HTMLButtonElement> = multi
          ? { "aria-pressed": on }
          : { role: "radio", "aria-checked": on, tabIndex: o.id === stop ? 0 : -1 };
        return (
          <button
            key={o.id}
            type="button"
            ref={(el) => {
              btns.current[o.id] = el;
            }}
            className="sp-btn"
            data-variant={on ? "default" : "ghost"}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onPick(o.id)}
            onKeyDown={(e) => onKeyDown(e, o.id)}
            {...state}
          >
            {o.label}
          </button>
        );
      })}
    </span>
  );
}

/** A row of actions. One primary among them, and only one.
 *
 *  `trailing` is for the action that undoes or destroys. It is separated by
 *  DISTANCE rather than by colour, because the interface is monochrome by
 *  default, red carries status rather than intent, and ember marks the human.
 *  Reported from Decide, where five controls sat at equal weight. */
export function Actions({
  children,
  trailing,
  stack = false,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  /** A COLUMN of full sentences rather than a row of short verbs.
   *
   *  For the case where the label is a whole question and not a word: Ask's
   *  grounded suggestions carry real run titles, and a wrapping sentence inside
   *  a centred inline-flex button reads as a ransom note. Stacked, each one is
   *  a full-width line that starts where the eye already is. Still buttons,
   *  because they still do something on one press. */
  stack?: boolean;
}) {
  return (
    <div className="sp-acts" data-stack={stack ? "true" : undefined}>
      {children}
      {trailing ? <span className="sp-acts-trailing">{trailing}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Context column. Quiet, and never a second navigation.
 * ------------------------------------------------------------------ */

/** A heading in the context column. */
export function CtxHead({ children }: { children: React.ReactNode }) {
  return <div className="sp-ctx-head">{children}</div>;
}

/** A paragraph in the context column. */
export function CtxBody({ children }: { children: React.ReactNode }) {
  return <div className="sp-ctx-body">{children}</div>;
}

/** An attributed line in the context column: a mark, a name, and one different
 *  fact under it. Every ported surface was hand-copying this markup out of
 *  today.tsx, which is how a system drifts one surface at a time. */
export function CtxRow({
  mark,
  name,
  sub,
}: {
  mark?: React.ReactNode;
  name: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="sp-ctx-row">
      {mark}
      <span>
        <span className="sp-ctx-name">{name}</span>
        {sub ? <span className="sp-ctx-sub">{sub}</span> : null}
      </span>
    </div>
  );
}

/** Every number, duration, count, diff, identifier and timestamp. */
export function Num({ children }: { children: React.ReactNode }) {
  return <span className="sp-num">{children}</span>;
}
