import * as React from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { agentBlurb, agentDisplayName } from "@/lib/agent-vocabulary";
import type { RunState } from "./run-state";

/*
 * THE RUNS SURFACE'S PARTS, DRAWN IN MERIDIAN.
 *
 * ── WHAT THIS FILE REPLACES, AND WHY IT IS A FILE ───────────────────────
 * /runs and its two views were built entirely out of
 * `src/components/shell/primitives.tsx`, which IS the `--sp-*` layer.
 * meridian.css states the migration rule plainly: that layer is life support,
 * "no new surface may use it, every migrated surface drops it". `--sp-*` is
 * currently aliased onto `--mrd-*`, so these surfaces already inherited
 * Meridian's palette and looked roughly right; that alias is a FLOOR, not the
 * finish line, and a port that stopped there would leave the indirection and
 * none of the components.
 *
 * Meridian ships the parts a DENSE DATA surface needs -- RecordsTable,
 * FilterTable, Search -- and RunsGrid already adopts all three. It does not
 * ship the parts a HAND-OVER surface needs: a page head, a region with a
 * heading, a gate, a receipt, a labelled field, a card that is a door. Runs is
 * mostly made of those. Rather than write the same markup four times across the
 * route, the grid, the board and the tab strip, they live here once, which is
 * the shape the Brain port settled on in `src/components/brain/record-parts.tsx`
 * and the Approvals port settled on in `src/components/approvals/`.
 *
 * Everything here is a candidate to move into `src/components/meridian/` the
 * moment a third surface needs it. THREE COPIES OF THIS IDEA NOW EXIST (Brain,
 * Approvals, Runs), which is past the threshold that file names for itself, and
 * that is reported rather than fixed here: `src/components/meridian/` belongs to
 * another lane.
 *
 * ── FOCUS IS INHERITED, NOT HAND-WRITTEN ────────────────────────────────
 * Every root here carries `data-mrd`, which is the whole mechanism meridian.css
 * describes: `[data-mrd][data-mrd] :focus-visible` outranks the unlayered
 * `[data-obsidian] :focus-visible` in styles.css and paints the neutral
 * `--mrd-focus` ring on every control underneath. So no control in this file
 * writes a focus colour of its own, and none of them reaches for
 * `--mrd-edge-focus`, which is a FIELD's border and measured 2.9:1 on paper.
 *
 * `mrd-focus-inset` is added wherever a control sits flush inside a rounded,
 * clipping parent, because an outset ring there is sheared off and reads as a
 * broken half-drawn edge rather than as focus.
 *
 * ── TWO NAMES ARE DELIBERATELY THE LEGACY ONES ──────────────────────────
 * `Button` and `Textarea`. `src/routes/__tests__/runs-keycaps-match-bindings.test.ts`
 * reads both route files as TEXT and counts `<Button` opening tags to hold a
 * real invariant: the ⌘⏎ keycap is drawn on exactly one control, on exactly the
 * expression the chord tests, and the listener is hoisted off the textarea.
 * That guard is about a defect that shipped, not about a class spelling, so
 * renaming these to `Act`/`Prompt` would silently make it pass vacuously. The
 * paint moved; the names stayed so the guard keeps holding.
 */

/* ------------------------------------------------------------------ *
 * Marks and figures
 * ------------------------------------------------------------------ */

/**
 * THE RUN'S MARK: the agent as a SHAPE, the run's state as a HUE.
 *
 * This replaces the shell's `AgentMark`, and the swap is not a repaint. The
 * shell mark encodes the agent as a shape AND ITS LOOP STAGE as one of seven
 * hues, so a column of runs came out a stage rainbow. Meridian spends colour on
 * one distinction only -- what a machine is doing against what a person must
 * decide -- and `station-glyphs.tsx` states the ruling in full: "identity is
 * shape here, never hue".
 *
 * So the hue carries the RUN STATE instead, and the mapping is the one the
 * system's own law prescribes:
 *
 *   gate     --mrd-you    ORCHID. A person is required. Touch it and it moves.
 *   working  --mrd-agent  AZURE. A machine is working; ambient, not urgent.
 *   queued   --mrd-hold   AMBER. Stopped, and NOT on you: it is waiting for the
 *                         crew to pick it up, which is a CONDITION changing
 *                         rather than a decision you can make.
 *   stopped  --mrd-fail   RED. An outcome, and the only thing red may mean.
 *   done     neutral      An outcome with nothing left to say. Quiet on purpose.
 *
 * QUEUED IS THE ONE THAT MATTERS MOST, and it is the fix rather than a
 * translation. Under the legacy vocabulary `queued` mapped to MarkState "quiet",
 * which is a 42% opacity neutral: the single most common state in the workspace
 * rendered fainter than the label beside it and read as a plain count. That
 * exact defect was found and fixed on the station strip this week; amber is the
 * colour the system admitted specifically to say it.
 *
 * `verified` is kept as a sixth input rather than folded into `done`, because it
 * is not "done", it is "done AND we can prove it": a merged changeset with a
 * real pull request behind it. Painting every finished run green would be the
 * product asserting a success nobody checked.
 *
 * The glyph itself is reused rather than redrawn, so an agent that is a spiral
 * on Approvals and on Brain is a spiral here. Two drawings of one roster is the
 * failure `agent-glyphs.tsx` exists to prevent.
 */
export type RunMarkState = RunState | "verified";

const MARK_HUE: Record<RunMarkState, string> = {
  gate: "text-mrd-you",
  working: "text-mrd-agent",
  queued: "text-mrd-hold",
  stopped: "text-mrd-fail",
  done: "text-mrd-faint",
  verified: "text-mrd-pass",
};

/** The same meaning at rest, for everything queued behind the one being asked
 *  about. `-dim` rather than a lower opacity: these are MARKS, and meridian.css
 *  re-solved the dim stops against the 3:1 floor a non-text object carrying
 *  meaning has to clear. Fading the full stop instead would drop under it. */
const MARK_HUE_RESTING: Partial<Record<RunMarkState, string>> = {
  gate: "text-mrd-you-dim",
  queued: "text-mrd-hold-dim",
};

export function RunMark({
  slug,
  state,
  name,
  asking = false,
}: {
  slug: string | null | undefined;
  state: RunMarkState;
  /** Fallback display name when the catalog does not know the slug. */
  name?: string | null;
  /**
   * This is the ONE run the surface is currently asking about. At most one per
   * screen. Everything else waiting wears the same orchid at rest, which is
   * what the rule prescribes for the queue behind the one asking: a workspace
   * with a dozen open calls used to blink a dozen marks in unison and spend the
   * whole restraint budget.
   */
  asking?: boolean;
}) {
  const Glyph = glyphForSlug(slug);
  const displayName = agentDisplayName(slug, name);
  const blurb = agentBlurb(slug);
  const label = blurb ? `${displayName} · ${blurb}` : displayName;
  const hue = (!asking && MARK_HUE_RESTING[state]) || MARK_HUE[state];

  return (
    <span
      data-mrd=""
      role="img"
      aria-label={state === "done" ? label : `${label}, ${state}`}
      title={label}
      className={`flex size-4 shrink-0 items-center justify-center transition-colors [&>svg]:size-[13px] ${hue}`}
      style={{
        transitionDuration: "var(--mrd-d-move)",
        /*
         * THE ONE ANIMATED MARK IN THE PRODUCT, and it is set INLINE rather than
         * as a class on purpose: meridian.css's reduced-motion block matches
         * `[style*="mrd-pixel-on"]`, so an animation declared in a utility would
         * keep running for someone who asked it not to.
         *
         * 1600ms is the legacy cadence, held still so the beat a reader already
         * knows does not change under them. The AMPLITUDE does change and it is
         * reported rather than approximated: `mrd-pixel-on` troughs at 0.15
         * where the legacy attention keyframe troughed at 0.32, so this reads a
         * little deeper than it used to. A `mrd-attention` keyframe at 1 → 0.32
         * would be the correct home for it and belongs in meridian.css, which
         * this lane does not own.
         */
        animation: asking
          ? "mrd-pixel-on 1600ms var(--mrd-ease-soft) infinite"
          : state === "working"
            ? // A machine working is ambient. The same breath the legacy mark
              // carried, at the same 2400ms, and nothing else: no orbiting
              // spinner ring, which was decoration that reported nothing the
              // hue was not already reporting.
              "mrd-pixel-on 2400ms var(--mrd-ease-soft) infinite"
            : undefined,
      }}
    >
      <Glyph />
    </span>
  );
}

/**
 * Every number, duration, count, id and timestamp, and NOTHING else.
 *
 * meridian.css draws the line the legacy `.sp-num` did not: mono is for those
 * things "and nothing else. A sentence containing a number is not mono." So this
 * wraps the figure and stops, and the words on either side of it stay in the
 * sans face. It sets no colour and no size, because it is used INSIDE sentences
 * that already have both.
 */
export function Figure({ children }: { children: React.ReactNode }) {
  return <span className="font-mrd-mono tabular-nums">{children}</span>;
}

/** The actor's name inside a row lead. It replaces the shell's `Who`, which
 *  painted `--sp-body` over an already-body line; here the name steps UP to ink
 *  so the crew reads as the subject of the sentence rather than as more of it. */
export function Actor({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-mrd-ink">{children}</span>;
}

/**
 * YOU. A filled disc carrying your initials, so a person is a different KIND of
 * object in the ledger from an agent rather than a different colour of the same
 * one. The agents are outlined glyphs; you are solid.
 *
 * `mine` lights it orchid, and ONLY when the moment is genuinely yours -- the
 * thing you just did, or the call now waiting on you. A steer you sent last week
 * is history, not a summons, so it wears the neutral face. Spending the accent
 * on every appearance of your own initials is how the accent stops meaning "a
 * person is required" and starts meaning "a person exists".
 */
export function PersonMark({ initials, mine = false }: { initials: string; mine?: boolean }) {
  return (
    <span
      data-mrd=""
      role="img"
      aria-label="You"
      className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-[650] ${
        mine ? "bg-mrd-you text-mrd-on-you" : "bg-mrd-lift text-mrd-mute"
      }`}
    >
      {initials}
    </span>
  );
}

/**
 * WHAT MOVED, AND WHICH WAY. It replaces the shell's `Diffstat`.
 *
 * A ZERO SIDE IS NOT DRAWN. "+10 -0" presents a zero as if it were a finding:
 * nothing was removed because there was nothing there to remove.
 *
 * Green and red are OUTCOMES here, which is the only thing they are allowed to
 * be in this system. The chips are mixed from the semantic tokens rather than
 * given a literal tint, so they follow both grounds without a second definition.
 */
export function Delta({ added, removed }: { added: number; removed: number }) {
  const both = added === 0 && removed === 0;
  const chip = "rounded-mrd-xs px-1 font-medium";
  return (
    <span
      data-mrd=""
      className="font-mrd-mono inline-flex items-center gap-1 text-[11.5px] tabular-nums"
      aria-label={`${added} lines added, ${removed} lines removed`}
    >
      {added > 0 || both ? (
        <b
          className={`${chip} text-mrd-pass`}
          style={{
            background: "color-mix(in oklab, var(--mrd-pass) 16%, transparent)",
            boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--mrd-pass) 26%, transparent)",
          }}
        >
          +{added}
        </b>
      ) : null}
      {removed > 0 ? (
        <b
          className={`${chip} text-mrd-fail`}
          style={{
            background: "color-mix(in oklab, var(--mrd-fail) 16%, transparent)",
            boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--mrd-fail) 26%, transparent)",
          }}
        >
          &minus;{removed}
        </b>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

/**
 * A control the surface is asking you to press.
 *
 * `primary` takes the NEUTRAL primary face, never the accent. meridian.css is
 * explicit that `--mrd-solid` is the primary and that the accent is never spent
 * on chrome; Approvals' `GateAction` puts orchid on its primary because that one
 * control IS the pending human action. Nothing on the runs index is: "Hand it
 * over" starts work, "Open the run" navigates, "Try again" re-reads. The one
 * control here that genuinely releases a stopped run is `Open the run` inside
 * the gate, and it opens a page rather than settling the call, so it stays
 * neutral too.
 *
 * The hover goes to `--mrd-solid-hover` and NEVER to `bg-mrd-float`, which
 * meridian.css records as a defect found shipped in two components: `float` is
 * DARKER than `solid` on dark, so the button dims as you reach for it, and it is
 * near-white on paper, which puts the light label on a pale slab.
 *
 * The label is `--mrd-on-solid` and never `--mrd-ink`. Both `bg-mrd-solid` and
 * `text-mrd-ink` invert with the ground, so they travel together instead of
 * apart: 11.26:1 on dark, 1.19:1 on paper, which is a slab with the ghost of a
 * word on it.
 *
 * NAMED `Button` DELIBERATELY. See this file's header: a source-reading guard
 * counts `<Button` tags on the two runs routes to hold the keycap invariant.
 */
export type ButtonVariant = "default" | "primary" | "ghost" | "settle";

/**
 * The shape of a control: everything about it except what colour it is.
 *
 * `active:scale-[0.98]` and nothing bouncier. Meridian's motion is ease-out
 * exponential with no elastic anywhere, and a press is 120ms.
 */
const CONTROL_SHAPE =
  "inline-flex h-8 items-center gap-2 rounded-mrd-ctl px-3 text-[12.5px] font-medium whitespace-nowrap transition-[background-color,color,opacity,transform] active:scale-[0.98]";

const BUTTON_FACE: Record<ButtonVariant, string> = {
  // `enabled:hover:` and not a bare `hover:`. A dead control that still lights
  // up under the pointer is promising something it will not do, and this
  // surface deliberately keeps a disabled Start button pointer-reachable so its
  // `title` can say what would unlock it -- so `pointer-events-none` is not
  // available as the cheaper answer.
  primary: "bg-mrd-solid text-mrd-on-solid enabled:hover:bg-mrd-solid-hover",
  /*
   * THE ONE CONTROL ON EITHER RUNS SURFACE THAT MAY WEAR THE ACCENT, and it is
   * a narrow licence rather than a second primary.
   *
   * meridian.css spends orchid on one meaning: a person is required. Almost
   * everything here is chrome by that test -- "Hand it over" starts work, "Open
   * the run" navigates, "Try again" re-reads -- and dressing those in the accent
   * is how an accent stops meaning anything. `settle` is for the control that IS
   * the pending human decision: the Merge / Approve on the run's gate, which
   * executes the gated call and resumes the loop. That is the same rule
   * Approvals' `GateAction` sets for the same act, quoted here so the two
   * surfaces cannot drift.
   *
   * DISABLED FALLS BACK TO THE NEUTRAL FACE, because a dead control is furniture
   * and must not keep shouting. It also fixes a contrast trap: this gate sets
   * `disabled` for the whole round trip of a decision, and `text-mrd-ink` on
   * `bg-mrd-solid` measures 1.19:1 on paper, so the label would vanish on every
   * click. `--mrd-on-solid` and `--mrd-on-you` are the two tokens that are light
   * in both grounds and they exist for exactly this.
   */
  settle:
    "bg-mrd-you text-mrd-on-you enabled:hover:opacity-90 disabled:bg-mrd-solid disabled:text-mrd-on-solid",
  ghost: "text-mrd-mute enabled:hover:bg-mrd-hover enabled:hover:text-mrd-body",
  default:
    "border border-mrd-line bg-mrd-lift text-mrd-body enabled:hover:bg-mrd-float enabled:hover:text-mrd-ink",
};

/**
 * AN ADDRESS THAT HAS TO LOOK LIKE A CONTROL, and the one reason this is
 * exported.
 *
 * A router `<Link>` renders its own anchor, and a `<button>` inside an `<a>` is
 * invalid markup that browsers repair unpredictably. Where the act is a
 * NAVIGATION -- "Connect one", which goes to /sync -- the element has to stay an
 * anchor so a middle click, a modifier click and the status bar all keep
 * working, and only the paint comes from here. Exported rather than copied,
 * because the copy is what drifts: two spellings of one control is how a system
 * loses a hover state on exactly one screen.
 *
 * IT IS NOT `BUTTON_FACE.default`, and the difference is not cosmetic. `:enabled`
 * matches form controls only, so every `enabled:hover:` utility above is inert on
 * an anchor and the link would have had no hover state at all. An anchor has no
 * disabled state to guard against, so it takes the bare `hover:`.
 *
 * A CONSTANT AND NOT A FUNCTION, which is a lint contract rather than a taste:
 * `react-refresh/only-export-components` runs with `allowConstantExport`, so a
 * module that exports components may also export a constant and may not export a
 * helper.
 */
export const LINK_AS_CONTROL = `${CONTROL_SHAPE} border border-mrd-line bg-mrd-lift text-mrd-body hover:bg-mrd-float hover:text-mrd-ink`;

export function Button({
  variant = "default",
  shortcut,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  /** Drawn by the file that BINDS the key, never by a component that cannot see
   *  the listener. That rule is why this is a prop rather than a lookup. */
  shortcut?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      data-mrd=""
      className={`${CONTROL_SHAPE} disabled:cursor-default disabled:opacity-45 ${BUTTON_FACE[variant]}`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        // The specular top edge that makes a filled control read as a raised
        // object rather than a coloured rectangle. Only the filled variant has a
        // face for light to fall on.
        boxShadow:
          variant === "primary" || variant === "settle"
            ? "inset 0 1px 0 var(--mrd-sheen)"
            : undefined,
      }}
    >
      {children}
      {shortcut ? (
        <kbd className="font-mrd-mono rounded-mrd-xs border border-current px-1 text-[11px] opacity-60">
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

/** A row of controls. One primary among them, and only one. */
export function Acts({ children }: { children: React.ReactNode }) {
  return (
    <div data-mrd="" className="mt-mrd-4 flex flex-wrap items-center gap-mrd-3">
      {children}
    </div>
  );
}

/**
 * A WORD INSIDE A SENTENCE THAT GOES SOMEWHERE.
 *
 * The quiet end of the affordance scale: `Button` is for something the surface
 * is ASKING you to do, this is for a fact that happens to have an address of its
 * own. It inherits its size from the line it sits in rather than fixing one,
 * because a control that shrinks halfway through a sentence reads as a typo.
 *
 * `as="a"` exists because two of these are OUTBOUND: the merged pull request and
 * the repo. An anchor and a button are not interchangeable to a keyboard or to a
 * middle click, so the element follows the destination rather than the paint.
 */
export function Door({
  children,
  onClick,
  href,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  /** Present for an outbound address. Mutually exclusive with `onClick`. */
  href?: string;
  title?: string;
}) {
  const paint =
    "rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid";
  const timing = { transitionDuration: "var(--mrd-d-press)" };

  if (href) {
    return (
      <a
        data-mrd=""
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className={paint}
        style={timing}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      data-mrd=""
      title={title}
      onClick={onClick}
      className={paint}
      style={timing}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Head and regions
 * ------------------------------------------------------------------ */

/**
 * The page's one h1, and its second line.
 *
 * This replaces the shell's `PageHead`. The size is `--mrd-t-h2`, which is the
 * step every ported surface puts a page title on; matching Brain rather than
 * inventing a rung is the point, because two ported surfaces at two title sizes
 * is the drift a system exists to stop.
 */
export function RunHead({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header data-mrd="">
      <h1 className="text-[25px] leading-tight font-medium text-mrd-ink">{title}</h1>
      {sub ? <p className="mt-mrd-3 text-[13px] leading-relaxed text-mrd-body">{sub}</p> : null}
    </header>
  );
}

/**
 * A region, with a heading that is a real heading.
 *
 * The shell primitive this replaces drew every region title as a `<span>`, so a
 * reader navigating by heading got exactly one stop on the whole surface. An
 * `<h2>` costs nothing and is the difference between a surface that can be
 * skimmed by a screen reader and one that cannot.
 *
 * `more` is the region's own quiet control, in the region's head, which is where
 * a reader looks for one. On this surface it is the finder.
 */
export function Region({
  title,
  sub,
  more,
  onMore,
  children,
}: {
  title?: string;
  /** What this region is FOR, said once. If it restates the title it should not
   *  exist: label, sublabel and helper all saying one thing is a hard ban. */
  sub?: React.ReactNode;
  more?: string;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section data-mrd="" className="flex flex-col">
      {title || more ? (
        <div className="flex items-baseline justify-between gap-mrd-4">
          {title ? <h2 className="text-[13px] font-medium text-mrd-mute">{title}</h2> : <span />}
          {more ? (
            <button
              type="button"
              onClick={onMore}
              className="shrink-0 rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {more}
            </button>
          ) : null}
        </div>
      ) : null}

      {sub ? (
        <div className="mt-mrd-3 max-w-[68ch] text-[12.5px] leading-relaxed text-mrd-mute">
          {sub}
        </div>
      ) : null}

      <div className={title || sub || more ? "mt-mrd-4" : undefined}>{children}</div>
    </section>
  );
}

/**
 * WHO DID WHAT, AND WHEN. The system's grammar for an event, and the shape the
 * run's ledger is built out of. It replaces the shell's `Row`.
 *
 * A row in a list never wraps past two lines: one lead, one DIFFERENT fact, and
 * depth is a click away rather than showcased on the surface. `tight` truncates
 * rather than wrapping, for any row whose full content has a detail view to
 * open; without it a long agent thought would push every row below it down the
 * page and the ledger would stop being scannable.
 *
 * `mrd-focus-inset` on the clickable region because a row sits flush inside a
 * region that clips, and an outset ring on a flush row is sheared off and reads
 * as a broken half-drawn edge rather than as focus.
 */
export function RunRow({
  mark,
  lead,
  sub,
  time,
  onClick,
  tight = false,
}: {
  mark?: React.ReactNode;
  lead: React.ReactNode;
  sub?: React.ReactNode;
  time?: string | null;
  onClick?: () => void;
  tight?: boolean;
}) {
  const clamp = tight ? "truncate" : "";
  const body = (
    <>
      <span className="flex w-4 shrink-0 justify-center">{mark}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[12.5px] leading-snug text-mrd-ink ${clamp}`}>{lead}</span>
        {sub ? (
          <span className={`mt-0.5 block text-[12px] leading-snug text-mrd-mute ${clamp}`}>
            {sub}
          </span>
        ) : null}
      </span>
      {time ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] tabular-nums text-mrd-faint">
          {time}
        </span>
      ) : null}
    </>
  );

  /* One class string for both shapes, so a row does not reflow the moment the
     thing it names becomes openable. */
  const shell = "flex w-full items-start gap-mrd-3 py-mrd-3 text-left";

  if (onClick) {
    return (
      <button
        type="button"
        data-mrd=""
        onClick={onClick}
        className={`mrd-focus-inset rounded-mrd-ctl border-b border-mrd-line-soft transition-colors last:border-0 hover:bg-mrd-hover ${shell}`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {body}
      </button>
    );
  }

  return (
    <div data-mrd="" className={`border-b border-mrd-line-soft last:border-0 ${shell}`}>
      {body}
    </div>
  );
}

/**
 * A supporting fact in the context column, and its heading.
 *
 * It replaces `.sp-ctx-head` / `.sp-ctx-body`, which were the last two raw
 * legacy class names on this surface. The column holds facts ABOUT the surface
 * rather than decisions made on it, so nothing here takes a hue: a coloured
 * aside competes with the one thing on the page asking for a person.
 */
export function ContextNote({ head, children }: { head: string; children: React.ReactNode }) {
  return (
    <section data-mrd="" className="mt-mrd-5 first:mt-0">
      <h2 className="text-[10px] font-[650] tracking-[0.06em] text-mrd-faint uppercase">{head}</h2>
      <div className="mt-mrd-3 text-[12.5px] leading-relaxed text-mrd-body">{children}</div>
    </section>
  );
}

/**
 * ONE LINE OF THE CONTEXT COLUMN: an optional mark, a name, and a second line
 * that carries DIFFERENT information.
 *
 * It replaces `.sp-ctx-row` / `.sp-ctx-name` / `.sp-ctx-sub`, which the run
 * detail was retyping by hand. The column is facts ABOUT the run rather than
 * decisions made on it, so nothing here takes a hue of its own; the mark it is
 * handed carries whatever colour is true.
 */
export function ContextLine({
  mark,
  name,
  sub,
}: {
  mark?: React.ReactNode;
  name: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div data-mrd="" className="flex items-start gap-mrd-3 py-mrd-2">
      {mark ? <span className="mt-px flex w-4 shrink-0 justify-center">{mark}</span> : null}
      <span className="min-w-0">
        <span className="block text-[12.5px] leading-snug text-mrd-body">{name}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-mrd-faint">{sub}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The gate
 * ------------------------------------------------------------------ */

/**
 * THE ONE HUMAN DECISION ON THIS SURFACE.
 *
 * It replaces the shell's `Gate`, and everything that primitive's header insists
 * on is kept, because those rules were written after real defects:
 *
 *   ONE QUESTION, THEN THE FACTS, THEN THE ACTIONS, in that order. A change on
 *   2026-08-05 lifted the reasons OUT of a gate and placed them after it, which
 *   put the evidence BELOW the button and asked a person to decide above the
 *   reasons for deciding. Anything that argues for the answer sits between the
 *   question and the controls, and nowhere else.
 *
 *   ONE PRIMARY, AND ONLY ONE.
 *
 * WHAT MERIDIAN ADDS, and it is the reason this is not just a repaint: the
 * standing. Meridian keeps three stopped states apart -- yours, a condition's,
 * and a failure's -- and this gate distinguished them by the wording of its
 * question alone, so "Nothing is waiting on you" and "X is waiting on you" were
 * one object in two moods and a glance could not tell them apart.
 *
 * `standing` is required rather than defaulted. A gate that does not know
 * whether it is asking for a person is a gate that will eventually claim to be,
 * and over-claiming a person's attention is the expensive mistake here.
 *
 * NO AGE LINE, and that is deliberate rather than an omission. `CallGate` prints
 * "Stopped for 3 days" off the instant the approval entered the queue. A run
 * carries `created_at`, which is when the run was CREATED, not when it stopped,
 * and printing one as the other would be a fabricated measurement on the one
 * surface whose whole claim is that its numbers are checkable. Reported as a
 * gap: `agent_runs` would need the instant the gate opened.
 */
export function RunGate({
  question,
  standing,
  lines,
  children,
}: {
  /** What is being asked, in plain words. Never a mechanism word. */
  question: React.ReactNode;
  /**
   * Which of the three stopped states this is.
   *   "you"     a person is required. Orchid.
   *   "clear"   nothing is waiting. Neutral, and quiet: an empty gate is the
   *             best state in the product and should be the least loud thing
   *             on the screen.
   *   "failed"  the read did not come back. Red is an outcome, never a warning.
   */
  standing: "you" | "clear" | "failed";
  /** The facts that answer the question. One fact per line. */
  lines?: React.ReactNode[];
  /** The controls. One primary, and only one. */
  children?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      {/*
       * THE STANDING IS ONLY SAID WHEN THE QUESTION DOES NOT ALREADY SAY IT.
       *
       * Approvals' `CallGate` prints "Waiting on you" unconditionally, and it can,
       * because it only ever renders when a call is waiting. This gate has three
       * moods and the first draft printed a marker in all of them, which produced
       * "Nothing is waiting" standing over "Nothing is waiting on you." and "The
       * read did not come back" standing over "The runs did not load." -- the
       * redundant-writing ban, twice, in the biggest element on the surface.
       *
       * `you` is the one mood where the marker carries a fact the question does
       * not: the question names the RUN ("Ship the invite flow is waiting on
       * you"), and the marker is what makes the standing legible before the name
       * is read. The other two moods say it in their own sentence, so the marker
       * shrinks to what only a mark can add -- a colour and a shape that survive
       * a glance -- and the words are dropped rather than repeated.
       */}
      <h2 className="flex items-baseline gap-mrd-3 text-[20px] leading-tight font-medium text-mrd-ink">
        {standing === "failed" ? (
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mrd-fail" />
        ) : null}
        <span className="min-w-0">{question}</span>
      </h2>

      {standing === "you" ? (
        <span className="mt-mrd-3 flex min-w-0 items-center gap-1.5">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
          <span className="shrink-0 text-[11px] font-medium text-mrd-you">Waiting on you</span>
        </span>
      ) : null}

      {lines?.length ? (
        /*
         * A recess, not a second card. The standard caps a region at one bordered
         * container; the evidence reads as part of the question by sitting BELOW
         * the ground rather than on top of it.
         */
        <ul className="mt-mrd-5 flex flex-col gap-mrd-3 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          {lines.map((line, i) => (
            <li key={i} className="text-[13px] leading-relaxed text-mrd-body">
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-4">{children}</div> : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The receipt
 * ------------------------------------------------------------------ */

/**
 * WHAT A JUDGEMENT LEFT BEHIND.
 *
 * An approval must NOT vanish into a toast. A toast confirms that your click
 * registered; a receipt renders what your click CAUSED, and that difference is
 * the product thesis expressed as an interaction.
 *
 * `role="status"` is kept from the primitive and it is load-bearing: an
 * accessibility audit on 2026-08-06 found six gates that announced nothing at
 * all after an irreversible decision, so a screen reader user got total silence
 * and had to re-explore the page to learn the result. Polite rather than
 * `alert`, because this is the answer to something the person did deliberately.
 *
 * `handoff` draws the arrow to whoever picked the work up, and ONLY when
 * something real did. Never an arrow to nowhere.
 *
 * A FAILED RECEIPT IS RED because red reports an OUTCOME, which is the only
 * thing this system's red is allowed to mean, and a start that did not happen is
 * an outcome. It is not a warning and it is not asking for anything.
 */
export function Commit({
  verb,
  consequence,
  handoff,
  time,
  failed = false,
  initials,
}: {
  /** What you did, in your own voice: "You handed it over". */
  verb: string;
  /** What it caused. Real, per-item, never a generic confirmation. */
  consequence: React.ReactNode;
  /** The agent that picked it up, if one genuinely did. */
  handoff?: { slug: string | null | undefined; name?: string | null } | null;
  time?: string | null;
  failed?: boolean;
  /** Yours, when the surface knows who you are. `mine` is correct here and only
   *  here: this is the thing you did a moment ago, which is the definition of
   *  the moment being yours. */
  initials?: string;
}) {
  return (
    <div
      data-mrd=""
      role="status"
      aria-live="polite"
      className="flex items-baseline gap-mrd-3 border-b border-mrd-line-soft py-mrd-3 text-[12.5px] leading-snug last:border-0"
    >
      {initials ? (
        <span className="self-start">
          <PersonMark initials={initials} mine />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={`font-medium ${failed ? "text-mrd-fail" : "text-mrd-ink"}`}>{verb}</span>
        <span className="text-mrd-mute"> · </span>
        <span className="text-mrd-body">{consequence}</span>
      </span>
      {handoff ? (
        <span className="flex shrink-0 items-center gap-1.5">
          <span aria-hidden className="text-mrd-faint">
            &rarr;
          </span>
          <RunMark slug={handoff.slug} name={handoff.name} state="working" />
        </span>
      ) : null}
      {time ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] tabular-nums text-mrd-faint">
          {time}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Fields
 * ------------------------------------------------------------------ */

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
    <label data-mrd="" className="mt-mrd-4 flex flex-col gap-mrd-2" htmlFor={htmlFor}>
      <span className="text-[10px] font-[650] tracking-[0.06em] text-mrd-mute uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

/*
 * A FIELD'S OWN EDGE, and the two things Meridian says about it.
 *
 * `--mrd-edge` resting, `--mrd-edge-focus` on focus. That second token is a
 * FIELD'S BORDER and nothing else; it is never a ring, because it measured 2.9:1
 * against paper and a ring has to clear 3:1 against whatever is behind it.
 *
 * AND NO FOCUS BOX. meridian.css removes the outline from text entry outright,
 * on the founder's ruling: a text field already answers "where is the keyboard"
 * twice, with a blinking caret no other control has and a border that has
 * stepped up. A third answer drawn around the outside visibly doubles the
 * field's edge. That rule lives in the stylesheet, so these two only have to
 * declare the border step and stay out of its way.
 */
const FIELD_FACE =
  "w-full rounded-mrd-ctl border border-mrd-edge bg-mrd-sink px-mrd-4 py-mrd-3 text-[13px] text-mrd-ink transition-colors placeholder:text-mrd-faint focus-visible:border-mrd-edge-focus disabled:cursor-default disabled:opacity-45";

/** NAMED `Textarea` DELIBERATELY. See this file's header: the keycap guard reads
 *  every `<Textarea` opening tag on the two runs routes and asserts that none of
 *  them carries `onKeyDown`, which is how it proves the chord is hoisted onto the
 *  composer rather than trapped on the field. */
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-mrd=""
      {...props}
      className={`${FIELD_FACE} resize-y leading-relaxed`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    />
  );
}

/** A native select, kept native. A menu that hides its own loading, error and
 *  empty states inside itself was sixty lines saying what one control says, and
 *  this surface already retired one. */
export function Picker(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-mrd=""
      {...props}
      className={`${FIELD_FACE} h-8 appearance-none py-0 pr-mrd-6`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        // The chevron, drawn rather than imported, so the control needs no icon
        // dependency and inherits the ink stop it is set in. `currentColor` in a
        // data URI is not resolvable, so the mask is the one that works in both
        // grounds without naming a colour twice.
        backgroundImage:
          "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 15px) center, calc(100% - 11px) center",
        backgroundSize: "4px 4px, 4px 4px",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

/**
 * A LABELLED FACT, with the label on the left and the value on the right. It
 * replaces the shell's `Line`.
 *
 * `htmlFor` promotes the label span to a real `<label>`, and only when the right
 * side is genuinely a form control. That is additive on purpose: a `<label for>`
 * pointing at a BUTTON would make the label a second way to fire it, which is
 * wrong for a control that acts rather than holds a value.
 */
export function Fact({
  label,
  sub,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  /** What the label does not say. If it restates the label it should not exist. */
  sub?: React.ReactNode;
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      {label}
      {sub ? <span className="mt-0.5 block text-[12px] text-mrd-faint">{sub}</span> : null}
    </>
  );
  return (
    <div
      data-mrd=""
      className="flex items-center justify-between gap-mrd-5 border-b border-mrd-line-soft py-mrd-3 text-[12.5px] leading-snug last:border-0"
    >
      {htmlFor ? (
        <label className="min-w-0 text-mrd-body" htmlFor={htmlFor}>
          {body}
        </label>
      ) : (
        <span className="min-w-0 text-mrd-body">{body}</span>
      )}
      {children ? <span className="shrink-0 text-right">{children}</span> : null}
    </div>
  );
}

/**
 * A fact on the right of a `Fact`, with no control attached.
 *
 * `tone` is for a value that is ITSELF an outcome, which is the one case where
 * colour carries information rather than decorating. It sets the voice, not the
 * face: numbers inside it still go in `Figure`.
 *
 * THE LEGACY `warn` TONE IS NOW `hold`, and the rename is the meaning being
 * fixed rather than a token being swapped. `--sp-warn` was an undifferentiated
 * "something is off"; Meridian has no such meaning and admits amber for exactly
 * one thing -- stopped, and NOT on you. Every caller of the old tone was in fact
 * saying that: a check that has not reported, a deploy still going, a verdict
 * nobody has recorded. None of them is a person's call, and none of them is a
 * failure.
 *
 * `live` keeps its pulsing dot because the dot is the information: it says the
 * fact beside it is still moving. It takes `--mrd-agent` rather than green,
 * which is the correction -- the legacy version painted it `--sp-pass`, so
 * "still running" and "it worked" were the same colour, and a deploy in flight
 * read as a deploy that had succeeded.
 */
export function Stat({
  children,
  tone = "quiet",
}: {
  children: React.ReactNode;
  tone?: "quiet" | "pass" | "hold" | "fail" | "live";
}) {
  const paint =
    tone === "pass"
      ? "text-mrd-pass"
      : tone === "hold"
        ? "text-mrd-hold"
        : tone === "fail"
          ? "text-mrd-fail"
          : tone === "live"
            ? "text-mrd-agent"
            : "text-mrd-mute";
  return (
    <span data-mrd="" className={`inline-flex items-center gap-1.5 text-[12.5px] ${paint}`}>
      {tone === "live" ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-mrd-agent"
          // Inline so meridian.css's reduced-motion block can find it. An
          // elapsed or in-flight indicator is INFORMATION, so it is not
          // decoration -- but the pulse is, and the colour survives without it.
          style={{ animation: "mrd-pixel-on 2000ms var(--mrd-ease-soft) infinite" }}
        />
      ) : null}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * A card that is a door
 * ------------------------------------------------------------------ */

/** A set of things that is SCANNED across rather than read down. `auto-fill` at
 *  a 196px floor, which is the same measured minimum the shell grid used: below
 *  it a card's lead truncates before it says anything. */
export function Cards({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mrd=""
      className="grid gap-mrd-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))" }}
    >
      {children}
    </div>
  );
}

/**
 * ONE RUN ON THE BOARD: a mark, a title, and one different fact.
 *
 * It replaces the shell's `Cell`, and the reason to replace rather than repaint
 * is recorded in RunBoard's own header: `Cell`'s `recessed` tone was measured on
 * screen and is unusable on a board, because it is built for a recess sitting on
 * already-raised ground and the board sits directly on the canvas. Every card
 * here is therefore the SAME ground, and the state is carried entirely by the
 * mark. The column heading above already says which state the column is in, so
 * tinting the card to say it again is the redundant-writing ban wearing a
 * colour.
 *
 * TINTED, NEVER BORDERED. Nineteen bordered cards in one region is nineteen
 * bordered containers, and the standard caps a region at one. The whole card is
 * the affordance rather than carrying a button, which is what keeps it two lines
 * tall.
 *
 * `mrd-focus-inset` because a card sits inside a column that clips, and an
 * outset ring is sheared off there and reads as a broken edge rather than as
 * focus.
 */
export function RunCard({
  mark,
  lead,
  sub,
  onClick,
  title,
}: {
  mark?: React.ReactNode;
  lead: React.ReactNode;
  /** The different fact, never a restatement of the lead. */
  sub?: React.ReactNode;
  /** Absent when nothing happens on click. An affordance is a promise, so a card
   *  that opens nothing is a div and never lights up under the cursor. */
  onClick?: () => void;
  title?: string;
}) {
  const shell =
    "flex w-full items-start gap-mrd-3 rounded-mrd-ctl bg-mrd-sheet px-mrd-4 py-mrd-3 text-left";
  const body = (
    <>
      {mark}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] leading-snug text-mrd-ink">{lead}</span>
        {sub ? (
          <span className="mt-0.5 block truncate text-[12px] leading-snug text-mrd-mute">
            {sub}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div data-mrd="" className={shell} title={title}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-mrd=""
      title={title}
      onClick={onClick}
      className={`mrd-focus-inset transition-colors hover:bg-mrd-lift ${shell}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {body}
    </button>
  );
}

/**
 * THE RECORD SPEAKING: a claim, and what backs it.
 *
 * It replaces the shell's `Record`, and it is a RECESS rather than a card, so it
 * reads as something the page opened a hole into rather than as one more
 * container stacked on the ground. The claim sits at `--mrd-t-lead`, the one
 * figure worth reading before the words around it, and the evidence under it is
 * mono because it is counts and dates.
 *
 * IT IS DRAWN ONLY WHERE THERE IS A CLAIM. A recess around an empty middle is a
 * frame, and this file's callers guard it: a decision with no written reasoning
 * gets a row saying so instead, because "nobody wrote down why" is a finding and
 * an empty box is not.
 *
 * NO LAMP. Brain's `RecordSpeaks` carries a radial bloom, recorded there as the
 * one deliberate exception to the no-glow rule because it is the single lit
 * object on that surface. This is a panel inside a run, several containers deep,
 * and a second lit object in the product would spend the exception rather than
 * use it. The recess alone does the work here.
 */
export function Recess({
  children,
  evidence,
  onClick,
  title,
}: {
  /** What the record says. A claim, never a statistic dressed as one. */
  children: React.ReactNode;
  /** What backs it. Counts and dates, in mono. */
  evidence?: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const shell = "flex w-full gap-mrd-5 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4 text-left";
  const body = (
    <>
      <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rotate-45 bg-mrd-ink" />
      <span className="min-w-0">
        <span className="block text-[17px] leading-tight text-mrd-ink">{children}</span>
        {evidence ? (
          <span className="font-mrd-mono mt-mrd-3 block text-[11.5px] tabular-nums text-mrd-mute">
            {evidence}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!onClick) {
    return (
      <div data-mrd="" className={shell} title={title}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-mrd=""
      title={title}
      onClick={onClick}
      className={`mrd-focus-inset transition-colors hover:bg-mrd-lift ${shell}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {body}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The three states a read can be in, kept apart
 * ------------------------------------------------------------------ */

/**
 * NOTHING IS HERE YET, and who acts next.
 *
 * `action` is the door. An empty state that names who acts next and gives you no
 * way to act is only half honest.
 */
export function NothingYet({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div data-mrd="" className="max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">
      {/* A div rather than a p, and that is a bug fix rather than a preference:
          a `<p>` may only contain phrasing content, so the moment a caller passes
          two paragraphs the markup is invalid and React refuses to hydrate. That
          was caught in a browser on /today. */}
      <div>{children}</div>
      {action ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{action}</div> : null}
    </div>
  );
}

/**
 * THE READ FAILED, which is a different fact from an empty region and must never
 * wear its clothes. "Nothing here" and "we could not find out" send a person in
 * opposite directions, so this says which one it is and always carries the way
 * out.
 *
 * Red is correct and is not a warning: it reports an OUTCOME, which is the only
 * thing this system's red is ever allowed to mean.
 */
export function ReadFailed({
  children,
  onRetry,
  retryLabel = "Try again",
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      data-mrd=""
      role="status"
      aria-live="polite"
      className="max-w-[68ch] text-[13px] leading-relaxed"
    >
      <span className="text-mrd-fail">{children}</span>
      {onRetry ? (
        <>
          {" "}
          <Door onClick={onRetry}>{retryLabel}</Door>
        </>
      ) : null}
    </div>
  );
}

/**
 * A READ STILL IN FLIGHT. The third fact, and the quiet one.
 *
 * DELIBERATELY NOT `LoadingState`. That Meridian component's own header forbids
 * this use: "an elapsed timer on a 200ms fetch is noise. Use this only where work
 * genuinely takes seconds and a person is waiting on the result. Ordinary reads
 * get a plain quiet state." Every read on this surface is an ordinary read of
 * rows on a five second poll, so an elapsed timer would be inventing suspense.
 */
export function Reading({ children = "Reading." }: { children?: React.ReactNode }) {
  return (
    <p data-mrd="" role="status" aria-live="polite" className="text-[13px] text-mrd-mute">
      {children}
    </p>
  );
}
