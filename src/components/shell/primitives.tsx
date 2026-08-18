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
/* The Receipt still shows who acted and who picked it up, so it keeps the two
 * marks. They come from Meridian now; see the note where they used to live. */
import { AgentMark, YouMark } from "@/components/meridian/marks";
import { IconMore } from "./icons";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import type { Selection } from "./use-selection";

/* ------------------------------------------------------------------ *
 * Agent mark: MOVED TO MERIDIAN, 2026-08-18
 *
 * `AgentMark`, `MarkStack`, `YouMark`, `PairMark` and `MarkState` now live in
 * `@/components/meridian/marks`. They were the most-rendered retired component
 * in the product (56 renders across 33 files) and the one the whole agentic
 * claim rests on, so they were the wrong thing to leave here.
 *
 * The behaviour that moved with them, rather than being left behind: the glyph
 * is the identity, the stack still gives `gate` to the first mark only, and the
 * animation stays inline so reduced motion can stop it. The stage-hue ramp did
 * NOT move: painting an agent its station's colour is what Law 4 forbids, and
 * `--sp-hue` died here with it.
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 * Block: a rule wherever the content changes register
 * ------------------------------------------------------------------ */

export function Block({
  title,
  sub,
  more,
  onMore,
  lead = false,
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
  /** THE ONE RUNG BETWEEN THE PAGE TITLE AND EVERYTHING ELSE.
   *
   *  The scale reserves `--sp-text-gate` (19px) and calls it "the gate
   *  question, biggest thing on a surface". A surface whose regions all sit at
   *  the same step never uses it, and the result is measurable rather than a
   *  matter of taste: Brain, counted live on 2026-08-11, drew one 25px object
   *  and then ten objects inside a single 1px band, so the sentences carrying
   *  its whole argument were set at the optical weight of a row's metadata.
   *
   *  OPT-IN, AND SPARINGLY. This is not "an important section"; it is the
   *  region a reader must land on if they read nothing else on the page. A
   *  surface that marks everything has marked nothing, so the rule is that
   *  `lead` belongs to the regions carrying the surface's ARGUMENT and never to
   *  the ones carrying its inventory. */
  lead?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="sp-block">
      {(title || more) && (
        <div className="sp-block-head">
          {/* A REGION TITLE IS A HEADING, AND THIS WAS A SPAN. Measured on Brain,
              2026-08-11: `main.querySelectorAll("h1,h2,h3,h4,h5,h6")` returned
              exactly ONE element on every one of that surface's five tabs, the
              page H1. "What the record now tells the crew", "What led to what",
              "Brief", "Documents", "What came out of it" and "Everything
              downstream" were all spans inside a <section> with no accessible
              name, so a reader navigating by heading got one stop and no way to
              reach any region on the page.

              It is also why the type went wrong. A span carries no size of its
              own, so the heading role had to be drawn entirely by
              `.sp-block-title` -- and that token sat BELOW the body text in the
              rows underneath it. Nothing in the markup objected, because there
              was no heading for the size to be wrong about. The <h2> gives the
              type somewhere to attach; Tailwind's preflight already zeroes the
              default margin and font-size, which is why `.sp-title` can be an
              h1 with no reset of its own, so this is visually identical the day
              it lands and structurally right from then on. */}
          {title ? (
            <h2 className="sp-block-title" data-lead={lead || undefined}>
              {title}
            </h2>
          ) : (
            <span />
          )}
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
  // A ZERO SIDE IS NOT DRAWN. A newly created file rendered "+10 -0", and that
  // "-0" is a zero presented as if it were a finding: nothing was removed,
  // because there was nothing there to remove. The reasoning is already recorded
  // on the Build row, which refused the primitive for this exact reason ("the
  // '-0' is a zero rendered as if it were a fact"); fixing it here means that row
  // no longer has to opt out to stay honest.
  //
  // Both zero cannot happen: a file with no added and no removed lines is not a
  // change, and every caller draws this only for something that changed. The
  // guard is kept anyway so the component can never render an empty box.
  const both = added === 0 && removed === 0;
  return (
    <span className="sp-diff" aria-label={`${added} ${unit} added, ${removed} ${unit} removed`}>
      {added > 0 || both ? <b className="sp-pass">+{added}</b> : null}
      {removed > 0 ? <b className="sp-fail">&minus;{removed}</b> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Gate: the biggest thing on the surface, and not a card in a card
 * ------------------------------------------------------------------ */

export function Gate({
  question,
  lines,
  linesLabel,
  children,
}: {
  /** A question, in plain words. Never a mechanism word. */
  question: React.ReactNode;
  /** What it actually does. One fact per line, never four ways of saying one. */
  lines?: React.ReactNode[];
  /**
   * Optional caption over the lines, naming where they came from.
   *
   * THE REGRESSION THIS EXISTS TO PREVENT (2026-08-05). A change meant to make
   * agent reasoning "visibly obvious" lifted the evidence OUT of the Gate into
   * a titled block placed after it. Since the actions render LAST inside the
   * Gate, that put the reasoning below the Approve button: a person was asked
   * to decide, with a keyboard shortcut, above the reasons for deciding.
   *
   * The intent was right and the placement inverted it. A Gate is one question,
   * the facts that answer it, then the actions, in that order; anything that
   * argues for the answer belongs between the question and the buttons. So the
   * attribution lives HERE, on the lines, instead of pulling the lines away.
   */
  linesLabel?: React.ReactNode;
  /** The actions. One primary, and only one. */
  children?: React.ReactNode;
}) {
  return (
    <section className="sp-gate">
      <h2 className="sp-gate-q">{question}</h2>
      {lines?.length ? (
        <div className="sp-gate-what">
          {linesLabel ? <p className="sp-gate-what-label">{linesLabel}</p> : null}
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
    /**
     * SPOKEN, NOT ONLY DRAWN.
     *
     * THE DEFECT, found by an accessibility audit on 2026-08-06 and true on
     * every gate in the product: a person using a screen reader pressed `a` on
     * Today, the call was approved, the queue dropped it, the Gate's question
     * silently became the next call, and a receipt appeared here saying what
     * happened. NONE of it was announced. They got total silence after
     * committing an irreversible decision, and the only way to learn the result
     * was to re-explore the page.
     *
     * Six surfaces had it -- Today, Approvals, Decide, Design, Crew, Discover --
     * and not one of them carried a live region. The codebase plainly knew the
     * pattern: `Loading` uses `aria-live="polite"` and `AgentPulse` wraps its
     * label in one. It had been applied to "an agent is working" and never to
     * "your decision was recorded", which is the louder of the two.
     *
     * FIXED HERE RATHER THAN SIX TIMES. Every one of those mutations ends in a
     * Receipt, so the primitive is the one place that covers all of them and
     * every gate built after tonight. `role="status"` is the polite register:
     * it waits for a pause rather than interrupting, which is right for a
     * confirmation of something the person just did deliberately.
     *
     * NOT `role="alert"`, which interrupts immediately and is for trouble the
     * person did not cause. A failed receipt still uses status: the failure is
     * the answer to their own keypress, and it is on screen where they are
     * already looking.
     */
    <div className="sp-receipt" data-failed={failed} role="status" aria-live="polite">
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
  onClick,
  title,
}: {
  /** What the record says. It contradicts you or it confirms you; either way
   *  it is a claim, not a statistic. */
  children: React.ReactNode;
  /** What backs it. Counts and dates, in mono. */
  evidence?: React.ReactNode;
  /** Absent when nothing happens on click, same law as `Cell`. Present when the
   *  claim names a prior decision the reader can open, which is the usual case:
   *  a record that says "you decided this before and it missed" is the strongest
   *  sentence on the surface, and until this existed there was no way to go read
   *  the decision it was talking about. */
  onClick?: () => void;
  title?: string;
}) {
  const body = (
    <>
      <span className="sp-record-mark" aria-hidden="true" />
      <span className="sp-record-body">
        <span className="sp-record-text">{children}</span>
        {evidence ? <span className="sp-record-evidence">{evidence}</span> : null}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className="sp-record" title={title}>
        {body}
      </div>
    );
  }

  return (
    <button type="button" className="sp-record" title={title} onClick={onClick}>
      {body}
    </button>
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
      {/*
       * A DIV, NOT A P, AND THAT IS A BUG FIX RATHER THAN A PREFERENCE.
       *
       * This was `<p>{children}</p>`. A `<p>` may only contain phrasing
       * content, so the moment a caller passed anything with structure, the
       * markup became invalid and React refused to hydrate it. Caught in a
       * browser on /today, where the empty state composes two paragraphs inside
       * a flex column: "In HTML, <div> cannot be a descendant of <p>. This will
       * cause a hydration error."
       *
       * The `<p>` was buying nothing. Every style on this component lives on
       * `.sp-empty` (font size, colour, leading, the 52ch measure) and there is
       * no `.sp-empty p` rule anywhere in the sheet, so the two render
       * identically for the thirty-odd callers that pass a plain sentence. What
       * it did do was set a trap: a primitive whose contract is "some words
       * about why this is empty" silently forbade the most natural way to write
       * two of them.
       *
       * A hydration error is not cosmetic either. React discards the server
       * markup and re-renders on the client, which is a real cost on the
       * surface every session opens on.
       */}
      <div>{children}</div>
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
/**
 * Waiting.
 *
 * TWO KINDS, and conflating them would be a lie. `Loading` on its own is US
 * reading rows: quiet, factual, over in a moment. `working` is an AGENT running,
 * which is a different fact with a different shape and a different honesty bar,
 * and it is the one the founder calls the platform's core USP.
 *
 * Passing `working` on a settings fetch would put "Reasoning..." on a database
 * read, which is exactly the kind of invented status this system refuses
 * everywhere else. Use it only where an agent is genuinely dispatched.
 */
export function Loading({
  children = "Reading.",
  working = false,
  agent,
  detail,
}: {
  children?: React.ReactNode;
  /** True only when an agent is actually running, never for a plain fetch. */
  working?: boolean;
  /** Who is running, so two indicators on one screen do not chant in unison. */
  agent?: string;
  /**
   * WHAT it is working on: a file, a line, an artifact, a tool. Only read when
   * `working` is true, because a plain fetch has no per-action fact worth
   * naming and dressing one up would be the invented status this refuses.
   */
  detail?: React.ReactNode;
}) {
  if (working) {
    return (
      <p className="sp-loading">
        <AgentPulse
          label={typeof children === "string" ? children : "An agent is working"}
          seed={agent}
          detail={detail}
        />
      </p>
    );
  }
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
  tone?: "quiet" | "pass" | "warn" | "fail" | "live";
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
  onClick,
  title,
}: {
  mark?: React.ReactNode;
  name: React.ReactNode;
  sub?: React.ReactNode;
  /** Absent when nothing happens on click, exactly as on `Cell`: an affordance is
   *  a promise, so a context row that leads nowhere stays a div and never lights
   *  up under the cursor. Present when the row names something with an address of
   *  its own, which is most of them: a source that stopped delivering, a quote
   *  that came from a real ticket, a rule that shaped a drawing. Until this
   *  existed the entire context column was inert by construction, and every
   *  surface that used it inherited that dead end. */
  onClick?: () => void;
  title?: string;
}) {
  const body = (
    <>
      {mark}
      <span>
        <span className="sp-ctx-name">{name}</span>
        {sub ? <span className="sp-ctx-sub">{sub}</span> : null}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div className="sp-ctx-row" title={title}>
        {body}
      </div>
    );
  }

  return (
    <button type="button" className="sp-ctx-row" title={title} onClick={onClick}>
      {body}
    </button>
  );
}

/** Every number, duration, count, diff, identifier and timestamp. */
export function Num({ children }: { children: React.ReactNode }) {
  return <span className="sp-num">{children}</span>;
}

/**
 * A WORD INSIDE A SENTENCE THAT GOES SOMEWHERE.
 *
 * The quiet end of the affordance scale. `Button` is for something the surface
 * is ASKING you to do; this is for a fact that happens to have an address of
 * its own. Reported from four subtitles at once, and every one of them was the
 * same defect: Today's "N days on the record", Brain's call, learning and doc
 * counts, and Design's published share address were all plain spans naming a
 * thing the reader could not open, on surfaces whose whole complaint was "I do
 * not know where to find them".
 *
 * It is a primitive rather than four inline resets for the reason `Cell`'s own
 * note gives: the alternative is the same eight-property button reset written
 * out per surface, which is how a system drifts one screen at a time.
 *
 * It IS `.sp-block-more`, the system's existing quiet action: one step up the
 * ink scale, and a dotted underline at very low contrast that goes solid on
 * hover. `.sp-door` rides alongside it and modifies exactly one property, the
 * size, which it inherits from the line it sits in rather than fixing at the
 * metadata size; a control that shrinks halfway through a sentence reads as a
 * typo rather than as an affordance. Every other state stays the base class's,
 * so the two can never drift. No new colour, no new spacing.
 */
export function Door({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  /** Required. A Door with nowhere to go is a span, and this file's whole rule
   *  is that an affordance is a promise. */
  onClick: () => void;
  title?: string;
}) {
  return (
    <button type="button" className="sp-block-more sp-door" title={title} onClick={onClick}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Selection. The primitive this product has never had.
 *
 * The STATE lives in ./use-selection.ts, following this folder's own
 * convention that a hook gets its own file (see use-spine-strip.ts). Only the
 * bar is a component, and only the bar belongs here.
 * ------------------------------------------------------------------ */

/**
 * The bar a selection puts in a list's header slot.
 *
 * It states the count as a fact and then offers verbs. Nothing else: a
 * selection bar that also carries filters or a search box has stopped being a
 * statement about what is selected.
 *
 * `Escape` clears, because a selection is a mode and every mode in this shell
 * leaves by the same key.
 */
export function SelectionBar({
  selection,
  total,
  noun = "item",
  children,
}: {
  selection: Selection;
  /** How many rows are selectable right now, after filtering. */
  total: number;
  /** Singular. "call", "run", "decision". Pluralised here. */
  noun?: string;
  /** The verbs. Buttons, and the destructive one last. */
  children: React.ReactNode;
}) {
  const { count, allSelected, selectAll, clear } = selection;

  React.useEffect(() => {
    if (count === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, clear]);

  if (count === 0) return null;

  return (
    <div className="sp-selbar" role="region" aria-label={`${count} selected`}>
      <span className="sp-selbar-count">
        <Num>{count}</Num> {count === 1 ? noun : `${noun}s`} selected
      </span>
      {!allSelected && total > count ? (
        <button type="button" className="sp-block-more" onClick={selectAll}>
          Select all {total}
        </button>
      ) : null}
      <button type="button" className="sp-block-more" onClick={clear}>
        Clear
      </button>
      <span className="sp-selbar-acts">{children}</span>
    </div>
  );
}
