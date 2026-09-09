/**
 * The two controls a landing page is made of: a card you pick, and a field you
 * type the work into.
 *
 * ── WHY THESE EXIST, HAVING BEEN CHECKED AGAINST WHAT ALREADY DID ─────────
 *
 * Both were built locally by LANE 1 while shipping `/start`, filed under R-17
 * (`coordination/requests/mrd-jobcard.md`, `mrd-composer.md`), and promoted here
 * after review. Both requests named the primitive they checked and said what
 * they kept from it, which is the whole reason this is a review and not an
 * excavation.
 *
 * `PickCard` is NOT `Cell`. `Cell` truncates both its lines unconditionally, and
 * its own header rules that deliberately: *"a cell in a grid never should
 * [wrap] -- it would take its whole row of the grid with it. So there is no
 * prop."* Correct for a scan grid. Wrong for a pick-one-of-four landing where
 * **the copy is the feature** -- "I have a problem and I do not know what to
 * build" is the job, and shortening the sentence to fit a component is
 * backwards.
 *
 * `Composer` is NOT `Input` or `Textarea`. `Input` is `FIELD_H` -- `h-8`, 13px,
 * sized to sit beside `Picker` and `Action`. `Textarea` is `min-h-20 resize-y`,
 * a form field with a drag handle and a fixed floor. Neither grows with its
 * content, neither has a submit affordance, and neither reads as the primary
 * object of a page. `TrackStart.tsx` proves the gap rather than arguing it: the
 * existing start form wraps a bare `<textarea>` in ad-hoc classes because
 * Meridian had no answer.
 *
 * ── WHAT REVIEW CHANGED, AND THE ONE THAT MATTERED ────────────────────────
 *
 * **`leading-[1.4]` became `leading-mrd-snug`.** The local card carried a raw
 * 1.4 on both lines, described in its request as keeping "`Row`'s type rhythm".
 * `--mrd-lh-snug` is **1.5**, and meridian.css says why at the token itself:
 * *"Was 1.4; the reference's air lives here."* The value was raised
 * deliberately, to stop UI rows reading as stuck together, and that raise is
 * **the founder's own complaint with a number attached** -- the same file
 * records six sites silently rendering at Tailwind's 1.375 and calls that
 * "tighter than the value Meridian replaced".
 *
 * So a hardcoded 1.4 is not merely off-scale. It is a **reversion of a decision
 * the design system made on purpose**, on the highest-traffic new surface in the
 * product. This is exactly what R-20's "ported, not eyeballed" is for: the
 * number was copied off an older component instead of taken from the token that
 * replaced it.
 *
 * Two smaller ones: a raw `gap-[13px]` that was also **dead** (the flex row has
 * one child, so it spaced nothing), and `mt-1` moved onto the spacing scale. The
 * composer's three-line ceiling was a magic `112` and is now derived from the
 * type scale it is actually a function of.
 */

import * as React from "react";

import { Action } from "@/components/meridian/surface-parts";
import { composerMaxHeight } from "@/components/meridian/composer-height";

/* ------------------------------------------------------------------ *
 * PickCard: one of a small set of choices, where the copy is the point
 * ------------------------------------------------------------------ */

/**
 * A selectable card whose lines WRAP.
 *
 * SELECTION IS A RING AND NEVER A FILL, drawn as a pseudo-element overlay
 * rather than an inset shadow. `Cell` documents the reason and it is not
 * cosmetic: the app-wide focus rule sets `box-shadow: none` unlayered, so a
 * selection drawn as a shadow disappears the moment a keyboard reader arrives on
 * the control -- the one moment it is most needed.
 *
 * `aria-pressed` rather than a role of its own, because that is what a toggle
 * button IS, and it is the only part of this a screen reader can use to tell a
 * picked card from an unpicked one. `data-mrd` / `data-selected` are the
 * declared-state attributes every Meridian control carries.
 *
 * The 44px floor (`min-h-11`) survives wrapping: two wrapped lines still clear
 * it, and a one-line card still meets it.
 */
export function PickCard({
  lead,
  sub,
  glyph,
  selected,
  onSelect,
  className = "",
  clamp = true,
}: {
  /** The job, in the person's own words. */
  lead: string;
  /** What picking it actually does. One or two lines. */
  sub?: string;
  /**
   * A mark for the kind of work this is.
   *
   * ── WHY A CARD LIKE THIS NEEDS ONE (2026-09-01) ──────────────────────
   * FOUNDER: *"those cards can be a little innovatively put around some sort
   * of icons, messages, or images to make it more relatable, more habitable,
   * more appealing."*
   *
   * Four of these sit in a grid and every one of them is two lines of prose
   * in the same weight, the same size and the same colour. There is nothing
   * for the eye to sort them by, so choosing means READING ALL FOUR -- on the
   * first screen of the product, before anything has been done. A mark gives
   * each card a silhouette, and a person who has used the surface twice picks
   * by shape without reading at all.
   *
   * IT IS `aria-hidden` AND CARRIES NO MEANING OF ITS OWN. The lead is the
   * label and the only label; the mark is a recognition aid. A glyph that
   * carried information a sighted reader gets and a screen reader does not
   * would be an accessibility defect wearing a design one's clothes.
   */
  glyph?: React.ReactNode;
  /** A toggle's state. Omit it for a card that is a plain press (a starter
   *  run, an example): it then announces as a button, not a pressed toggle. */
  selected?: boolean;
  onSelect: () => void;
  className?: string;
  /**
   * Three lines and a tooltip when the whole text lives one press away (a
   * ranked bet's statement is on the run it starts); false when this card
   * is the only place the text exists (a starter run's why), so a phone,
   * which never shows a tooltip, is not left with an ellipsis and nothing
   * behind it (fourth review, 2026-09-09).
   */
  clamp?: boolean;
}) {
  const ring = selected
    ? "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] " +
      "before:border before:border-mrd-ink before:content-['']"
    : "";

  return (
    <button
      type="button"
      data-mrd=""
      data-selected={selected === undefined ? undefined : selected}
      aria-pressed={selected === undefined ? undefined : selected}
      onClick={onSelect}
      className={
        "mrd-pick relative flex w-full min-h-11 items-start gap-mrd-4 rounded-mrd-ctl " +
        "bg-mrd-lift px-mrd-4 py-mrd-3 text-left transition-colors " +
        `enabled:hover:bg-mrd-lift-hover ${ring} ${className}`
      }
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {/*
        ── THE MARK SITS BESIDE THE TEXT, AND IT IS BIGGER (2026-09-01) ──────
        FOUNDER: *"can we increase the size of those glyphs a little bit more,
        and bring the text side to that glyph."*

        It was stacked above the lead at 28px in a tinted tile. Two things were
        wrong with that and he saw both. Stacked, the drawing is a HAT on the
        card rather than part of the row, and every card grows by the mark's
        height plus its gap -- 40px across four cards for no information. And
        at 15px inside a 28px tile the drawing was too small to read AS a
        drawing: the loose strokes that make it look hand-made are exactly what
        disappears first when a line drawing is shrunk.

        Beside the text at 22px in a 36px tile, the mark is legible as a
        drawing, the card is shorter, and the row reads as a list of choices
        rather than a grid of tiles. The tile keeps a fixed basis so four
        different drawings share one optical left edge -- without it each
        glyph's own bounding box would set its own indent and the column of
        leads would step in and out by a pixel or two per card, which is
        precisely the kind of raggedness this pass is fixing elsewhere.
      */}
      {glyph ? (
        <span
          aria-hidden="true"
          data-glyph=""
          className="mt-[1px] flex h-9 w-9 shrink-0 items-center justify-center rounded-mrd-xs bg-mrd-sink text-mrd-mute transition-colors"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          {glyph}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="block text-mrd-prose leading-mrd-snug font-medium text-mrd-ink">
          {lead}
        </span>
        {sub ? (
          /* THREE LINES, THEN THE TOOLTIP, where the caller says the whole
             text lives elsewhere. A ranked bet's problem statement runs to a
             paragraph (seen live: one card three times the height of its
             neighbours), and that card is a door to the run that holds it.
             Unclamped, the tooltip goes too: a title repeating text fully on
             screen is noise. */
          <span
            title={clamp ? sub : undefined}
            /* `block` AND `line-clamp-3` BOTH SET `display`, and block won
               (craft pass, 2026-09-09). Measured on the served home: the
               element carried `-webkit-line-clamp: 3` and computed
               `display: block`, so the clamp needed a `-webkit-box` it never
               got and did nothing at all. The card the comment above says was
               fixed stood 214px beside 32px neighbours, three times the
               height, exactly as described. The clamp establishes its own
               block-level box, so `block` belongs only to the branch that
               does not clamp. */
            className={`mt-mrd-2 text-mrd-base leading-mrd-snug text-mrd-mute ${clamp ? "line-clamp-3" : "block"}`}
          >
            {sub}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Composer: the field that is the page
 * ------------------------------------------------------------------ */

/**
 * The one field that starts a piece of work.
 *
 * THE FACE IS THE FORMS FAMILY AT THE PROSE STEP, so the hero still reads as
 * part of the same system: the field ground, edge, placeholder ink and focus
 * border of `FIELD_BASE`, moved from 13px up to `text-mrd-prose`. Focus lives on
 * the WRAPPER via `focus-within`, because the ring around the whole composer —
 * rather than a caret line inside it — is what says the field is live.
 *
 * ENTER STARTS, SHIFT+ENTER IS THE NEWLINE, and that split is the whole reason
 * this is a composer rather than a form. It is also why the submit affordance
 * sits inside the control: a person who does not know the shortcut must still be
 * able to see how to start.
 *
 * The hint line is not decoration. A keyboard contract nobody states is a
 * keyboard contract nobody uses.
 */
/**
 * Whether the pointer is a finger. Read once, kept current: a laptop with a
 * touch screen reports fine, a phone coarse, and the keyboard contract in
 * the composer's hint follows it.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(pointer: coarse)");
    setCoarse(m.matches);
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  return coarse;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  label,
  hint = "Enter to start · Shift+Enter for a new line",
  submitLabel = "Start it",
  busyLabel = "Starting",
  disabled = false,
  fieldRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  busy: boolean;
  placeholder: string;
  /** What a screen reader is told this field is for. Required, not optional. */
  label: string;
  hint?: string;
  submitLabel?: string;
  busyLabel?: string;
  disabled?: boolean;
  /** Lets a page land focus here, e.g. after a card is picked. */
  fieldRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const coarse = useCoarsePointer();
  const grow = React.useCallback((el: HTMLTextAreaElement) => {
    // Measured against content on every keystroke rather than derived from
    // `rows`, so deleting a line shrinks the field again instead of leaving a
    // hole where the text used to be.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, composerMaxHeight(el))}px`;
  }, []);

  const canSubmit = !busy && !disabled && value.trim().length > 0;

  return (
    /*
     * THE BLOOM (`mrd-bloom`) IS WHY THIS FIELD READS AS THE PAGE. Founder,
     * 2026-09-01: *"for the typing bar, you can have a subtle glow, like how
     * new-age AI platforms have some gradient effect."*
     *
     * It is achromatic on purpose and the reason is a colour-law one rather
     * than a taste one: every reference for this pattern glows violet, this
     * system's violet is `--mrd-you` and it means A PERSON IS REQUIRED, and
     * spending that hue on a focused textarea is how it stops meaning anything
     * on the approval card where it matters. The full argument is at the token
     * in `meridian.css`.
     *
     * `disabled` KILLS IT RATHER THAN DIMMING IT. `opacity-45` on the wrapper
     * would fade the halo along with the field and leave a grey smudge behind
     * a control nobody can type in, which reads as a rendering fault. A
     * disabled composer is simply not lit.
     */
    <div
      data-mrd=""
      className={
        "rounded-mrd-ctl border border-mrd-field bg-mrd-sink transition-colors " +
        `focus-within:border-mrd-field-focus ${disabled ? "opacity-45" : "mrd-bloom"}`
      }
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      <textarea
        ref={fieldRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        rows={1}
        onChange={(e) => {
          onChange(e.target.value);
          grow(e.target);
        }}
        onKeyDown={(e) => {
          /* Escape lets go of the field (never the text), so the chords,
             "?" and "/" work one press after arrival: the composer takes
             focus on the home and swallowed every key until a click
             elsewhere (third review, 2026-09-08). */
          if (e.key === "Escape") {
            e.currentTarget.blur();
            return;
          }
          /* A phone keyboard has no Shift+Enter, so Enter is a new line
             there and the button is the press (phone review, 2026-09-08). */
          if (e.key === "Enter" && !e.shiftKey && !coarse && canSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className={
          "block w-full resize-none bg-transparent px-mrd-4 pt-mrd-3 pb-mrd-2 " +
          "text-mrd-prose leading-mrd-prose text-mrd-ink " +
          "placeholder:text-mrd-faint focus:outline-none"
        }
      />
      <div className="flex items-center justify-between gap-mrd-3 px-mrd-4 pb-mrd-3">
        <span className="mrd-meta">{coarse ? `Press ${submitLabel}` : hint}</span>
        <Action variant="primary" busy={busy} disabled={!canSubmit} onClick={onSubmit}>
          {busy ? busyLabel : submitLabel}
        </Action>
      </div>
    </div>
  );
}
