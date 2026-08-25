import * as React from "react";

import { Action } from "@/components/meridian/surface-parts";

/**
 * THE ONE FIELD THAT STARTS EVERYTHING.
 *
 * WHY A LOCAL COMPOSER AND NOT MERIDIAN'S `Input` OR `Textarea`. `Input` is
 * `h-8 ... text-[13px]` (`forms.tsx:72`) -- a single-line control sized to sit
 * beside `Picker` and `Action`; `Textarea` is `min-h-20 resize-y` (`:180`), a
 * form field with a drag handle and a fixed floor. Neither grows with its
 * content and neither reads as the primary object of a page. Filed under R-17
 * as `coordination/requests/mrd-composer.md`; swap and delete when MAIN
 * promotes or names what was missed.
 *
 * THE FACE IS THE FORMS FAMILY AT THE PROSE STEP, so the hero still belongs to
 * the same system: FIELD_BASE's ground, field edge, placeholder ink and focus
 * border, just at `text-mrd-prose leading-mrd-prose` instead of 13px. Focus is
 * carried by the wrapper's `focus-within`, because the ring around the whole
 * composer -- not a caret line inside it -- is what says this field is live.
 *
 * Enter starts. Shift+Enter is the newline. That split is the whole reason this
 * is a composer and not a form.
 */
export function RunComposer({
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  disabled = false,
  fieldRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  busy: boolean;
  placeholder: string;
  disabled?: boolean;
  /** Let the page land focus here when a card is picked. */
  fieldRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const grow = (el: HTMLTextAreaElement) => {
    // Auto-grow from one line to three, then scroll. Measured against content
    // every keystroke rather than derived from rows, so deleting lines shrinks
    // it again.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  };

  return (
    <div
      data-mrd=""
      className={`rounded-mrd-ctl border border-mrd-field bg-mrd-sink transition-colors focus-within:border-mrd-field-focus ${
        disabled ? "opacity-45" : ""
      }`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      <textarea
        ref={fieldRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Describe the work in one sentence"
        rows={1}
        onChange={(e) => {
          onChange(e.target.value);
          grow(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !busy && !disabled && value.trim()) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="block w-full resize-none bg-transparent px-mrd-4 pt-mrd-3 pb-mrd-2 text-mrd-prose leading-mrd-prose text-mrd-ink placeholder:text-mrd-faint focus:outline-none"
      />
      <div className="flex items-center justify-between gap-mrd-3 px-mrd-4 pb-mrd-3">
        <span className="mrd-meta">Enter to start &middot; Shift+Enter for a new line</span>
        <Action
          variant="primary"
          busy={busy}
          disabled={disabled || !value.trim()}
          onClick={onSubmit}
        >
          {busy ? "Starting" : "Start it"}
        </Action>
      </div>
    </div>
  );
}
