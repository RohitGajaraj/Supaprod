import * as React from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { Action, Eyebrow } from "@/components/meridian/surface-parts";
import { agentBlurb, agentDisplayName } from "@/lib/agent-vocabulary";
import type { RunState } from "./run-state";

/*
 * WHAT IS LEFT OF THE RUNS SURFACE'S OWN PARTS.
 *
 * ── THE THRESHOLD THIS FILE NAMED IS CROSSED, 2026-08-15 ────────────────
 * Its old header said it outright: "Everything here is a candidate to move into
 * `src/components/meridian/` the moment a third surface needs it. THREE COPIES
 * OF THIS IDEA NOW EXIST (Brain, Approvals, Runs), which is past the threshold
 * that file names for itself." It reached five. `Figure`, `Region`, `Reading`,
 * `NothingYet`, `ReadFailed`, `Acts`, `Door`, `Delta` and `RunHead` are now in
 * `components/meridian/surface-parts.tsx`, drawn once for all five ported
 * surfaces. `RunHead` is `PageHeading` there, which is what Crew and the Engine
 * Room already called the same header.
 *
 * ── WHAT DID NOT MOVE, AND WHY ──────────────────────────────────────────
 * Everything below is drawn on Runs and nowhere else, and three of them would
 * have to be bent out of shape to be shared:
 *
 *   `RunGate` carries a three-way STANDING (yours, clear, failed) that neither
 *   of the other two gates has, and deliberately carries no age line. A shared
 *   gate would be the union of three information models with everything
 *   defaulted off, which is a flag pile wearing the biggest element on three
 *   screens.
 *
 *   `Recess` is the record speaking WITHOUT the lamp. Brain's `RecordSpeaks` is
 *   the same recess with it, and the lamp is a scarcity rule rather than a
 *   setting: Meridian permits ONE lit object in the product and Brain holds the
 *   licence. A `lamp` prop would turn that into a switch.
 *
 *   `Picker` here is a FIELD, on `bg-mrd-sink` with the same face as `Textarea`
 *   and a drawn chevron. Meridian's `Picker` is a toolbar filter on
 *   `bg-mrd-lift`. Same element, two controls.
 *
 * ── TWO NAMES ARE DELIBERATELY THE LEGACY ONES ──────────────────────────
 * `Button` and `Textarea`. `src/routes/__tests__/runs-keycaps-match-bindings.test.ts`
 * reads both route files as TEXT and counts `<Button` opening tags to hold a
 * real invariant: the ⌘⏎ keycap is drawn on exactly one control, on exactly the
 * expression the chord tests, and the listener is hoisted off the textarea.
 * That guard is about a defect that shipped, not about a class spelling, so
 * renaming these would silently make it pass vacuously.
 *
 * `Button` is therefore the one shim in this file: it is Meridian's `Action`
 * under the name the guard reads, and it holds no paint of its own. The one
 * control on either runs surface that genuinely RELEASES something, the merge
 * on a run's gate, is Meridian's `Approve` at the call site, because it is a
 * different component rather than a fourth string in a variant union.
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
         * as a class on purpose: meridian.css's reduced-motion block matches on
         * the style attribute, so an animation declared in a utility would keep
         * running for someone who asked it not to.
         *
         * BOTH CASES USE `mrd-attention`, WHICH IS THE POINT OF IT. The obvious
         * reach here is `mrd-pixel-on`, and it is wrong for a mark: it troughs
         * at 0.15, so half of every cycle the GLYPH is gone — and the glyph is
         * what says which station this is, because identity is shape in this
         * system. An animation that periodically deletes a mark's identity to
         * report its status has traded the more important fact for the lesser
         * one. `mrd-attention` inverts the envelope: full at rest, a shallow dip
         * to 0.32, back. Legible throughout.
         *
         * The two cadences carry the whole difference, and they are the legacy
         * ones, held still so the beat a reader already knows does not move
         * under them.
         */
        animation: asking
          ? "mrd-attention 1600ms var(--mrd-ease-soft) infinite"
          : state === "working"
            ? // A machine working is ambient, so it breathes slower than a thing
              // asking for a person. Nothing else: no orbiting spinner ring,
              // which was decoration reporting nothing the hue did not already.
              "mrd-attention 2400ms var(--mrd-ease-soft) infinite"
            : undefined,
      }}
    >
      <Glyph />
    </span>
  );
}

/** The actor's name inside a row lead. It replaces the shell's `Who`, which
 *  painted `--sp-body` over an already-body line; here the name steps UP to ink
 *  so the crew reads as the subject of the sentence rather than as more of it. */
export function Actor({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-mrd-ink">{children}</span>;
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

/**
 * MERIDIAN'S `Action` UNDER THE NAME A GUARD READS, and nothing else.
 *
 * It holds no paint. `runs-keycaps-match-bindings.test.ts` reads both route
 * files as TEXT and counts `<Button` opening tags to hold a real invariant
 * about a shipped defect, so the name has to survive; the styling it used to
 * carry did not, because four other surfaces were carrying their own copy of
 * the same three faces.
 *
 * The `settle` variant is gone rather than renamed. It was the accent, and the
 * accent is now `Approve`, a separate component for the one act that RELEASES
 * something. The single caller, the merge on a run's gate, says `<Approve>`.
 */
export function Button(props: React.ComponentProps<typeof Action>) {
  return <Action {...props} />;
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
      <Eyebrow>{label}</Eyebrow>
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
  "w-full rounded-mrd-ctl border border-mrd-field bg-mrd-sink px-mrd-4 py-mrd-3 text-mrd-base text-mrd-ink transition-colors placeholder:text-mrd-faint focus:border-mrd-field-focus disabled:cursor-default disabled:opacity-45";

/** NAMED `Textarea` DELIBERATELY. See this file's header: the keycap guard reads
 *  every `<Textarea` opening tag on the two runs routes and asserts that none of
 *  them carries `onKeyDown`, which is how it proves the chord is hoisted onto the
 *  composer rather than trapped on the field. */
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-mrd=""
      {...props}
      className={`${FIELD_FACE} resize-y leading-mrd-prose`}
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
      {sub ? <span className="mt-0.5 block text-mrd-small text-mrd-faint">{sub}</span> : null}
    </>
  );
  return (
    <div
      data-mrd=""
      className="flex items-center justify-between gap-mrd-5 border-b border-mrd-line-soft py-mrd-3 text-mrd-label leading-mrd-snug last:border-0"
    >
      {htmlFor ? (
        <label className="min-w-0 text-mrd-prose text-mrd-body" htmlFor={htmlFor}>
          {body}
        </label>
      ) : (
        <span className="min-w-0 text-mrd-prose text-mrd-body">{body}</span>
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
    <span data-mrd="" className={`inline-flex items-center gap-1.5 text-mrd-label ${paint}`}>
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
        <span className="block truncate text-mrd-label leading-mrd-snug text-mrd-ink">{lead}</span>
        {sub ? (
          <span className="mt-0.5 block truncate text-mrd-small leading-mrd-snug text-mrd-mute">
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
