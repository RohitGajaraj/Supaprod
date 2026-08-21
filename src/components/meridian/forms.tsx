import * as React from "react";

import { Action, Actions } from "./surface-parts";

/**
 * THE FORM VOCABULARY. A field, a label, a box to type in, a tick, a pick, and a
 * reason a decision cannot complete without.
 *
 * ── WHY MERIDIAN DID NOT HAVE THESE, AND WHY THAT MATTERED ──────────────
 * Measured 2026-08-16: every form in the product -- all of Settings, all of
 * Boundary, every panel under `governance/` -- was still on the retired
 * component layer, and the reason was not neglect. There was nowhere to port
 * them TO. Meridian shipped `Picker` (a select) and `Toggle` (a switch) and
 * stopped, so `Field`, `Input`, `Textarea`, `Checkbox` and `Choices` had no
 * Meridian address at all.
 *
 * ── THE REFERENCE HAS NO FORM PRIMITIVES, AND THAT IS A REAL ANSWER ─────
 * beautifui.dev is this system's floor, so it was read first. It documents
 * nineteen components and NOT ONE is a form control: no input, no textarea, no
 * checkbox, no select, no field label. Its inputs exist only INSIDE purposeful
 * components -- the Chat composer, the Prompt Bar, Search, the Approval Card's
 * custom answer.
 *
 * That is a position, not an omission: the reference is a vocabulary for
 * agentic interfaces, and this product additionally has to render a settings
 * page. So the mechanics below are ported from the reference's own inputs,
 * which this repo already carries at parity, rather than invented:
 *
 *   Chat's composer   border-mrd-line bg-mrd-sink rounded-mrd-ctl cursor-text
 *                     focus-within:border-…  transition-[border-color] 150ms
 *   FineTuneCard      a SUNKEN track (bg-mrd-sink) carrying a RAISED travelling
 *                     thumb (bg-mrd-lift) -- which is `Choices` below
 *
 * A field is a recess you fill, not a slab you press. That is why the ground is
 * `sink` and not `lift`, and it is the reference's own choice.
 *
 * ── THE CONTRAST FIX THAT CAME WITH THEM ────────────────────────────────
 * Three files had already hand-rolled this same field -- `ArtifactsView`,
 * `EngineChrome` and `run-parts` -- and drifted, disagreeing about padding,
 * font size, `focus:` versus `focus-visible:`, and whether a disabled control
 * is drawn at all. All three rested on `border-mrd-edge`, which measures
 * 1.79:1 dark and 1.65:1 paper against 3:1 required. `--mrd-field` was solved
 * for and added to meridian.css; see the note there for the table.
 *
 * NO FOCUS RING ON A TEXT CONTROL. It answers "where is the keyboard" twice
 * already: a caret is blinking in it and its border has stepped up. A third
 * answer drawn outside is a box appearing for no reason. `Checkbox` and
 * `Choices` DO take the ring, because neither has a caret.
 */

/* ------------------------------------------------------------------ *
 * The shared shape
 * ------------------------------------------------------------------ */

/**
 * Everything a text control is, except its height.
 *
 * `focus:` and not `focus-visible:`, and the difference is not cosmetic. A text
 * control is focused BY CLICKING INTO IT as often as by tabbing, and
 * `:focus-visible` is false for a pointer focus on an input in some engines. A
 * field whose border does not move when you click into it has lost the only
 * signal it has. `run-parts.tsx` had this wrong and the copies disagreed.
 */
const FIELD_BASE =
  "w-full rounded-mrd-ctl border border-mrd-field bg-mrd-sink text-mrd-ink " +
  "transition-colors placeholder:text-mrd-faint " +
  "focus:border-mrd-field-focus focus:outline-none " +
  "disabled:cursor-default disabled:opacity-45";

/** A single-line control's height. Matches `Picker` and `Action`, so a row of
 *  mixed controls sits on one baseline instead of stepping. */
const FIELD_H = "h-8 px-2.5 text-[13px]";

/* ------------------------------------------------------------------ *
 * Field: the label above a control
 * ------------------------------------------------------------------ */

/**
 * A labelled control, stacked.
 *
 * `htmlFor` IS THE POINT OF THIS COMPONENT. The retired `Field` rendered
 * `<label>` unconditionally with no `for`, so a `Field` wrapping an `Input`
 * bound the two only when the control happened to be a descendant -- and the
 * moment a caller put anything between them, the label stopped working and
 * nothing said so.
 *
 * ── CORRECTION, 2026-08-18: IT IS NOT OPTIONAL IN PRACTICE ──────────────
 * This paragraph used to end "and it is optional only because a caller may
 * legitimately wrap the control as a child instead". THAT IS NOT TRUE OF THIS
 * COMPONENT. Look at the render: `{children}` sits OUTSIDE the `<label>`, as a
 * sibling of it. A control passed to this `Field` is never a descendant of the
 * label, so implicit association is not available here and `htmlFor` is the
 * ONLY thing that can bind them.
 *
 * The cost of that wrong sentence was measured the day it was found. Porting
 * the product off the retired `Field`, which DID bind by containment, three
 * separate agents independently hit the same defect in three different
 * directories: FIFTEEN call sites carried no `htmlFor`, so a straight swap left
 * fifteen controls with no accessible name, and the component's own header told
 * each of them that was fine.
 *
 * SO IT IS REQUIRED NOW. All 46 call sites were measured as bound before the
 * type changed, so this cost nothing to make mandatory and `tsc` enforces from
 * here what this comment could only ask for. A guard that can fail a build
 * beats a paragraph that can be believed, and this paragraph was believed by
 * three readers in a row.
 *
 * `hint` is for what the label cannot say in two words: the format, the unit,
 * the consequence. It is NOT a restatement of the label, which the anti-slop
 * ban on "label, sublabel and helper all saying the same thing" already forbids.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  /** What the label cannot say. Never a restatement of it. */
  hint?: React.ReactNode;
  /**
   * REQUIRED, since 2026-08-18. See the header: `{children}` renders outside
   * the label, so this is the only thing that can bind them, and fifteen call
   * sites shipped without it while the type said it was optional.
   */
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div data-mrd="" className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[12.5px] font-medium text-mrd-prose text-mrd-body"
        style={{ letterSpacing: "var(--mrd-track-label)" }}
      >
        {label}
      </label>
      {children}
      {hint ? <span className="text-[12px] leading-relaxed text-mrd-mute">{hint}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The text controls
 * ------------------------------------------------------------------ */

export function Input({ className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      data-mrd=""
      className={`${FIELD_BASE} ${FIELD_H} ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)", ...rest.style }}
    />
  );
}

/**
 * `resize-y` and a floor, never `resize` in both directions: a control that can
 * be dragged wider than its own column breaks the measure of everything beside
 * it, and no caller has ever wanted that.
 *
 * TAKES A `ref` (2026-08-21). `ComponentPropsWithRef` rather than
 * `TextareaHTMLAttributes`, which omits it -- so a caller that needed to focus
 * or scroll to this control had no way to reach it and would have queried the
 * DOM by id instead. React 19 passes `ref` through the spread below with no
 * `forwardRef`, which is why there is none anywhere in Meridian. The first
 * caller is Discover's `?capture=1` landing.
 */
export function Textarea({ className = "", ...rest }: React.ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      {...rest}
      data-mrd=""
      className={`${FIELD_BASE} min-h-20 resize-y px-2.5 py-2 text-[13px] leading-relaxed ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)", ...rest.style }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Checkbox
 * ------------------------------------------------------------------ */

/**
 * A tick.
 *
 * `label` IS REQUIRED, and it is not a convenience. A bare checkbox is
 * unreadable to a screen reader, and this control is most often used in a table
 * header or a row where the visible text belongs to something else. When `id`
 * binds it to real visible label text, `aria-label` is dropped rather than
 * duplicated -- two names on one control is a defect, not belt and braces.
 *
 * IT KEEPS ITS FOCUS RING, unlike the text controls above. There is no caret in
 * a checkbox, so the border stepping up is the ONLY signal it could otherwise
 * offer, and that is not enough on a 16px square. Meridian's global rule
 * already excludes `[type="checkbox"]` from the outline suppression for exactly
 * this reason.
 *
 * `onChange` takes the next boolean rather than the event, because every caller
 * in this product wanted `e.target.checked` and half of them got it wrong.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  id,
  disabled,
  indeterminate = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Required. Used as `aria-label` only when no `id` binds visible text. */
  label: string;
  id?: string;
  disabled?: boolean;
  /**
   * Some but not all. A real third state, and it must be set on the DOM node:
   * there is no HTML attribute for it, so React cannot express it in JSX and a
   * ref is the only honest way. A "select all" box that shows unchecked while
   * three of ten rows are picked is telling the reader something false.
   */
  indeterminate?: boolean;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      data-mrd=""
      id={id}
      checked={checked}
      disabled={disabled}
      aria-label={id ? undefined : label}
      onChange={(e) => onChange(e.target.checked)}
      className="size-4 shrink-0 cursor-pointer rounded-mrd-xs border border-mrd-field bg-mrd-sink accent-mrd-solid transition-colors disabled:cursor-default disabled:opacity-45"
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Choices: a short set of named options, picked from in place
 * ------------------------------------------------------------------ */

export type ChoiceOption<T extends string> = {
  id: T;
  label: React.ReactNode;
  /** What the label cannot say in one word. */
  title?: string;
  disabled?: boolean;
};

/**
 * THE MODE IS DECLARED, NEVER ASSUMED, and that is the whole reason this
 * component exists rather than a row of buttons.
 *
 * The retired system's ruling is carried across intact, because it was right
 * and it was argued from three independent reports: a button group was the
 * correct SHAPE, and what it lacked was a name and its keyboard. A `Toggle` is
 * wrong here because a switch means THIS BOUNDARY IS LIVE NOW, and three
 * switches in a row cannot say which channel each one is -- the words are the
 * control. A `Checkbox` column is wrong because these options are read across
 * as one decision, not ticked down a list, and it would double every row.
 *
 * What was genuinely broken was the ARIA, and it differs by mode:
 *
 *  · `any` is a real multi-select. Each option is an independent toggle, so
 *    `aria-pressed` is correct and each is its own tab stop.
 *  · `one` is mutually exclusive, and `aria-pressed` is quietly WRONG for it:
 *    it announces three toggle buttons and never says that picking one unpicks
 *    the others, and it spends three tab stops on one decision. It is a radio
 *    group: one tab stop, and the arrow keys move within it.
 *
 * ── THE TRACK AND THE THUMB ARE THE REFERENCE'S, NOT INVENTED ───────────
 * `FineTuneCard` ports beautifui.dev's segmented control as a SUNKEN track
 * carrying a RAISED thumb, and that reads correctly for `one` because exactly
 * one option is ever raised. `any` cannot borrow it -- several options can be
 * on at once, and several thumbs in one track is not a track -- so `any` marks
 * each option on its own instead. Same component, two honest faces.
 */
export function Choices<T extends string>({
  mode,
  label,
  options,
  value,
  onChange,
  className = "",
}: {
  mode: "one" | "any";
  /** Names the whole decision for a screen reader, not the options. */
  label: string;
  options: ReadonlyArray<ChoiceOption<T>>;
  /** The picked option for `one`; every picked option for `any`. */
  value: T | readonly T[];
  onChange: (next: T) => void;
  className?: string;
}) {
  const picked = (id: T) => (Array.isArray(value) ? value.includes(id) : value === id);
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  /* Arrow keys move WITHIN a radio group and select as they go, which is the
   * expected behaviour for `one`. `any` is a set of independent buttons and
   * keeps Tab between them, so it gets no key handling at all. */
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (mode !== "one") return;
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const live = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    if (live.length === 0) return;
    const at = live.indexOf(index);
    let next: number;
    if (e.key === "Home") next = live[0]!;
    else if (e.key === "End") next = live[live.length - 1]!;
    else {
      const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      next = live[(at + step + live.length) % live.length]!;
    }
    onChange(options[next]!.id);
    refs.current[next]?.focus();
  }

  const RING =
    "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

  if (mode === "one") {
    return (
      <div
        data-mrd=""
        role="radiogroup"
        aria-label={label}
        className={`inline-flex gap-0.5 rounded-mrd-ctl bg-mrd-sink p-0.5 ${className}`}
      >
        {options.map((o, i) => {
          const on = picked(o.id);
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.title}
              disabled={o.disabled}
              /* ONE TAB STOP FOR THE WHOLE GROUP. The checked option holds it;
                 if nothing is checked the first live option does, so the group
                 is never unreachable by keyboard. */
              tabIndex={on || (!options.some((x) => picked(x.id)) && i === 0) ? 0 : -1}
              onClick={() => onChange(o.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium whitespace-nowrap transition-colors disabled:cursor-default disabled:opacity-45 ${RING} ${
                on ? "bg-mrd-lift text-mrd-ink" : "text-mrd-mute enabled:hover:text-mrd-prose text-mrd-body"
              }`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div data-mrd="" role="group" aria-label={label} className={`inline-flex gap-1.5 ${className}`}>
      {options.map((o) => {
        const on = picked(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            title={o.title}
            disabled={o.disabled}
            onClick={() => onChange(o.id)}
            className={`rounded-mrd-ctl border px-2.5 py-1 text-[12.5px] font-medium whitespace-nowrap transition-colors disabled:cursor-default disabled:opacity-45 ${RING} ${
              on
                ? "border-mrd-field-focus bg-mrd-lift text-mrd-ink"
                : "border-mrd-field text-mrd-mute enabled:hover:text-mrd-prose text-mrd-body"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ReasonField: a decision that cannot be taken without saying why
 * ------------------------------------------------------------------ */

/**
 * ASK FOR THE REASON, AND REFUSE TO COMPLETE WITHOUT ONE.
 *
 * ── WHY IT IS HERE AND NOT IN THE THIRD CALLER ──────────────────────────
 * `PlanCard`'s skip and `RunMap`'s waive both hand-rolled this, and `RunMap`'s
 * own comment named the duplication rather than hiding it: *"the right fix is a
 * `ReasonField` in `forms.tsx` that both call. That is a third file this item
 * does not own, so it is recorded in the build log instead of done quietly
 * here."* `PlanGate` is the third caller, so this is the moment, and both
 * originals now call it. **There is one copy of the mechanic, not three, and not
 * a shared one beside two survivors** -- which is the outcome that would have
 * looked like progress and left the drift in place.
 *
 * A token earns its place on the second caller and so does a component.
 *
 * ── THE MECHANIC, WHICH IS THE PART THAT WAS DRIFTING ───────────────────
 * Enter submits, Escape cancels, the commit is guarded on a trimmed non-empty
 * value, and the submit is dead until there is one. **Enter and Escape are the
 * load-bearing half**: a one-field form that only closes by mouse is a trap for
 * the reader who opened it from the keyboard, and that is the behaviour most
 * likely to be dropped by whoever writes the fourth copy.
 *
 * ── INLINE, NEVER A DIALOG ──────────────────────────────────────────────
 * `usePrompt()` is the house way to ask for a string and it is wrong for every
 * caller of this: these are Meridian primitives and may not depend on an
 * app-level hook, and a modal takes the subject off the screen at the moment
 * somebody is being asked to justify a decision about it.
 *
 * ── WHY NEITHER CONTROL IS ACCENTED ─────────────────────────────────────
 * `quiet` on both, never `Approve` and never `destructive`. Orchid is spent on
 * the one control that unblocks something and red reports an outcome that has
 * happened, so neither is available to mark an intention. **What makes one of
 * these decisions safe is that it cannot be taken without a reason, which is a
 * different guard from volume.**
 */
export function ReasonField({
  id,
  label,
  hint = "It goes on the record beside the decision, so the next reader sees the call that was made rather than a gap.",
  placeholder,
  commitLabel,
  cancelLabel = "Keep it",
  busy = false,
  onCommit,
  onCancel,
}: {
  /** Binds the label to the input. Required for the same reason `Field` requires it. */
  id: string;
  /** The question, as a question. "Why skip this?" */
  label: React.ReactNode;
  /** What the label cannot say. Defaults to where the reason ends up. */
  hint?: React.ReactNode;
  /** A real example, not a restatement of the label. */
  placeholder?: string;
  /** What the commit does, in its own words. "Take it off the route." */
  commitLabel: string;
  cancelLabel?: string;
  /** True while a decision is in flight. Both controls go dead, not hidden. */
  busy?: boolean;
  /** Called with the trimmed reason, never with an empty string. */
  onCommit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = React.useState("");
  const ready = reason.trim().length > 0;

  const commit = () => {
    if (ready && !busy) onCommit(reason.trim());
  };

  return (
    <div data-mrd="" className="mt-mrd-3 flex flex-col gap-mrd-3">
      <Field label={label} hint={hint} htmlFor={id}>
        <Input
          id={id}
          value={reason}
          autoFocus
          placeholder={placeholder}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      </Field>
      <Actions>
        <Action variant="quiet" onClick={commit} disabled={!ready || busy}>
          {commitLabel}
        </Action>
        <Action variant="quiet" onClick={onCancel} busy={busy}>
          {cancelLabel}
        </Action>
      </Actions>
    </div>
  );
}
