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
  selected,
  onSelect,
  className = "",
}: {
  /** The job, in the person's own words. */
  lead: string;
  /** What picking it actually does. One or two lines. */
  sub?: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const ring = selected
    ? "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] " +
      "before:border before:border-mrd-ink before:content-['']"
    : "";

  return (
    <button
      type="button"
      data-mrd=""
      data-selected={selected}
      aria-pressed={selected}
      onClick={onSelect}
      className={
        "relative flex w-full min-h-11 flex-col items-start rounded-mrd-ctl " +
        "bg-mrd-lift px-mrd-4 py-mrd-3 text-left transition-colors " +
        `enabled:hover:bg-mrd-lift-hover ${ring} ${className}`
      }
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      <span className="block text-mrd-prose leading-mrd-snug font-medium text-mrd-ink">{lead}</span>
      {sub ? (
        <span className="mt-mrd-2 block text-mrd-base leading-mrd-snug text-mrd-mute">{sub}</span>
      ) : null}
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
  const grow = React.useCallback((el: HTMLTextAreaElement) => {
    // Measured against content on every keystroke rather than derived from
    // `rows`, so deleting a line shrinks the field again instead of leaving a
    // hole where the text used to be.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, composerMaxHeight(el))}px`;
  }, []);

  const canSubmit = !busy && !disabled && value.trim().length > 0;

  return (
    <div
      data-mrd=""
      className={
        "rounded-mrd-ctl border border-mrd-field bg-mrd-sink transition-colors " +
        `focus-within:border-mrd-field-focus ${disabled ? "opacity-45" : ""}`
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
          if (e.key === "Enter" && !e.shiftKey && canSubmit) {
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
        <span className="mrd-meta">{hint}</span>
        <Action variant="primary" busy={busy} disabled={!canSubmit} onClick={onSubmit}>
          {busy ? busyLabel : submitLabel}
        </Action>
      </div>
    </div>
  );
}
