import * as React from "react";

import { Eyebrow } from "@/components/meridian/surface-parts";

/*
 * WHAT IS LEFT OF THE ENGINE ROOM'S OWN PARTS.
 *
 * ── WHAT THIS FILE REPLACED ─────────────────────────────────────────────
 * Two dead token layers at once, which is why this surface looked older than
 * everything around it. The route and the glance cards drew from `--sp-*`
 * (life support: meridian.css says no new surface may use it and every
 * migrated surface drops it). The room bodies underneath them drew from a layer
 * older still -- `--text-primary`, `--hairline`, `--madder-bright`, `--glacier`,
 * `--font-pixel` -- which is the Obsidian/Cadence vocabulary Meridian was
 * written to replace outright.
 *
 * ── THE ONE RULE THIS SURFACE KEPT GETTING WRONG ────────────────────────
 * A ROOM THAT DID NOT LOAD MUST NEVER WEAR A HEALTHY ONE'S CLOTHES, and an
 * UNCONFIGURED room must not wear a troubled one's. Here the four states are
 * named -- clear, needs a look, not set up, did not load -- and each is bound to
 * one token:
 *
 *   NEEDS A LOOK is `--mrd-hold`, amber. Meridian's amber means stopped and NOT
 *     on you: it needs a condition to change (spend to come down, an eval to
 *     pass, a dependency to answer) rather than a decision. Orchid would be
 *     wrong here and it is the reflex -- orchid promises a control that moves
 *     the thing, and there is no such control in a room, only evidence.
 *   NOT SET UP carries NO hue at all. Nothing has gone wrong; a control is
 *     absent. Dressing an absence as trouble is how a governance surface
 *     teaches people to stop reading its colours, and seventeen of the
 *     twenty-one workspaces in the live database are in exactly this state.
 *   DID NOT LOAD is `--mrd-fail`, red, which reports an OUTCOME and is the only
 *     thing red is allowed to mean.
 *   CLEAR gets no word and no colour, because a healthy room is the absence of
 *     news.
 *
 * ── THE DEBT THIS FILE RECORDED IS PAID, 2026-08-15 ─────────────────────
 * Its old header said: "`Action`, `ReadFailed`, `Region`, `Figure` and the four
 * state words are the same ideas as the ones in components/crew/CrewChrome.tsx
 * and components/approvals/CallGate.tsx... The right home for all of them is
 * src/components/meridian/, which this lane does not own."
 *
 * That home now exists. `Figure`, `PageHeading`, `Region`, `Action`, `Actions`,
 * `Picker`, `Toggle`, `Eyebrow`, `Reading`, `NothingHere`, `ReadFailed` and
 * `RecordSpeaks` are in `components/meridian/surface-parts.tsx`. The four state
 * WORDS stayed, because a room's state is this surface's vocabulary and nothing
 * else in the product has one.
 *
 * `Action`'s refusal of a primary variant survived the move as a stronger rule:
 * the accent is now a different COMPONENT, `Approve`, and it exists only for a
 * control that unblocks something. Nothing in this room does, so nothing here
 * reaches for it, and it is no longer one string away.
 *
 * ── FOCUS IS INHERITED, NOT HAND-WRITTEN ────────────────────────────────
 * The `FOCUS_RING` and `FOCUS_RING_INSET` constants this file exported are gone
 * and the ring half never worked. `src/styles.css` says so at the rule that
 * beats it, with the browser check that proved it: `[data-obsidian]
 * :focus-visible` is unlayered, Tailwind emits utilities into a layer, and
 * unlayered wins, so any component-level `focus-visible:outline-*` class "is
 * permanently inert here". Every root carries `data-mrd` instead, and
 * `mrd-focus-inset` is a real class in meridian.css that needs a `data-mrd`
 * ANCESTOR rather than the attribute on itself.
 */

/**
 * WHERE YOU ARE, AND THE WAY BACK, ON ONE LINE ABOVE THE TITLE.
 *
 * The room's NAME used to be rendered exactly once in the whole chassis, as a
 * tablist's `aria-label`, so a screen reader heard "Spend views" and a sighted
 * reader had no word for the room they were standing in. The question is the
 * room's PURPOSE and stays the title; the name is its ADDRESS and belongs here,
 * beside the way out.
 */
export function Crumb({
  back,
  backLabel,
  here,
}: {
  back: () => void;
  backLabel: string;
  here: string;
}) {
  return (
    <nav data-mrd="" className="flex items-center gap-mrd-3 text-[12px]" aria-label="Where you are">
      <button
        type="button"
        onClick={back}
        className="rounded-mrd-xs text-mrd-mute transition-colors hover:text-mrd-ink"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {backLabel}
      </button>
      <span aria-hidden className="text-mrd-faint">
        ·
      </span>
      <span className="text-mrd-body">{here}</span>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * Controls this room has and nothing else does
 * ------------------------------------------------------------------ */

/**
 * The quietest control: a word in a sentence that DOES something.
 *
 * Not `Door`, which is the shared word in a sentence that GOES somewhere and
 * wears a dotted underline to promise it. This one promises no address, so it
 * draws no underline, and it stayed here because the Verify cockpit is the only
 * place in the product that needs the distinction.
 */
export function QuietAction({
  children,
  className = "",
  ...rest
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      data-mrd=""
      className={`rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}

/**
 * A TEXT FIELD, AND IT DRAWS NO FOCUS BOX.
 *
 * meridian.css scopes that removal to text entry only, and the reasoning is
 * worth repeating at the call site: a focus ring exists to answer "where is the
 * keyboard", and a text field answers that twice already -- a caret is blinking
 * in it, which no other control has, and its border has stepped up. A third
 * answer drawn around the outside visibly doubles the field's edge for no
 * information. Buttons, links and rows keep their ring, because none of them
 * has a caret.
 *
 * `--mrd-edge-focus` is the FIELD'S BORDER and never a ring: it measured 2.9:1
 * against paper, and a ring drawn outside an element has to clear 3:1 against
 * whatever is behind it. `--mrd-focus` is the ring and exists because of it.
 */
export function TextInput({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`h-8 rounded-mrd-ctl border border-mrd-edge bg-mrd-sink px-2.5 text-[12.5px] text-mrd-ink transition-colors placeholder:text-mrd-faint focus:border-mrd-edge-focus ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    />
  );
}

/** One labelled control. ONE label: a second line carries different information,
 *  never a restatement of the value the control already shows. */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div data-mrd="" className="flex flex-col gap-mrd-2">
      <label className="text-[12px] text-mrd-mute" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * ONE HEADLINE FIGURE, with the clause that bounds it.
 *
 * A number whose window is not stated is a number you cannot act on, so `note`
 * is not decoration: "spend this week" means nothing without "+18% vs the week
 * before" or, just as importantly, "prior week did not load". The figure is
 * mono and the words around it are not.
 *
 * It sets the ink itself rather than leaning on `Figure`, because this IS the
 * headline and `Figure` deliberately inherits its colour from the line it sits
 * in.
 */
export function FigureCard({
  label,
  value,
  note,
  tone = "quiet",
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  /**
   * Only for a figure that is ITSELF an outcome, which is the one case where
   * colour is carrying information rather than decorating a fact. A pass rate
   * is; a spend total is not, and passing a tone to one would say that spending
   * money went well or badly.
   *
   * `hold` is the amber middle: needs a look, which is a condition to change
   * rather than a decision to make. It replaces an `attention` hue that was
   * chosen at the call site off a retired palette.
   */
  tone?: "quiet" | "pass" | "hold" | "fail";
}) {
  const ink =
    tone === "pass"
      ? "text-mrd-pass"
      : tone === "hold"
        ? "text-mrd-hold"
        : tone === "fail"
          ? "text-mrd-fail"
          : "text-mrd-ink";
  return (
    <div
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4"
    >
      <Eyebrow>{label}</Eyebrow>
      <p className={`font-mrd-mono mt-mrd-2 text-[25px] leading-tight tabular-nums ${ink}`}>
        {value}
      </p>
      {note ? <p className="mt-mrd-1 text-[12px] text-mrd-mute">{note}</p> : null}
    </div>
  );
}

/**
 * SUB-VIEWS OF ONE PAGE, NOT A SECOND RAIL.
 *
 * A filter strip stays quiet until you reach for it, which is what seven of
 * these need to do. The selected tab is separated by GROUND and ink weight and
 * never by hue: every one of these buckets is the same kind of thing, so a
 * colour would say nothing and would spend the one signal this surface has on
 * navigation.
 *
 * THE SELECTED TAB TAKES `--mrd-select`. It took `--mrd-lift` until 2026-08-15,
 * which is a GROUND stop rather than the token that exists for a passage the
 * reader has picked, and which stops working the moment the strip is placed on
 * lift. The other two copies of this strip in the product, `RecordDoors` on
 * Brain and `Tabs` on Runs, both already used `--mrd-select`.
 *
 * ── THE GAP IS CLOSED, 2026-08-15, BY DELETING THIS COMPONENT ───────────
 * This used to declare `role="tablist"` and `role="tab"` while carrying neither
 * a roving tab stop nor arrow keys, and it said so in a KNOWN GAP note. Brain's
 * `RecordDoors` carried the identical note. Two files independently documenting
 * the same defect and pointing at the same fix is the signal that the fix is
 * owed, not that the note is sufficient.
 *
 * `Tabs` and `TabPanel` in `components/meridian/Tabs.tsx` are that strip with
 * the contract built, and they now serve every genuine tab row in the product.
 * Nothing is re-drawn here.
 *
 * A HALF-BUILT TABLIST IS WORSE THAN PLAIN BUTTONS, which is why this could not
 * simply be left. `role="tab"` PROMISES a keyboard: a screen reader announces
 * "tab, 1 of 3" and the reader presses an arrow, and here nothing moved. Every
 * tab was also its own tab stop, so tabbing through the page walked a reader
 * through choices they had already declined instead of past them.
 */

/**
 * A FILTER IS NOT A TAB ROW, and telling them apart is the whole of this
 * component's reason to exist.
 *
 * `ReceiptsPanel` reached for the tab strip to switch between All, Decisions
 * and Actions. That is not a tab set and no amount of keyboard would have
 * fixed it:
 *
 *   IT HAS AN "ALL". A tab set cannot have an "all tabs" tab, because tabs are
 *       alternative VIEWS of different content and "all" is not one of them.
 *   IT COMBINES. `kind` is read alongside an outcome picker and a search box
 *       into one `narrowed` flag. Tabs do not combine with each other; filters
 *       do, and this one does.
 *   IT NARROWS ONE LIST IN PLACE. Nothing is swapped. There is no panel for
 *       `aria-controls` to point at, so converting it to a real tablist would
 *       have produced a broken reference where there is currently only a
 *       missing keyboard. MORE WRONG, not less.
 *
 * So the SHAPE stays, because three options are faster to read as segments than
 * as a select, and its sibling outcome filter three lines below is a `Picker`
 * only because it has more options than fit. What changes is what it CLAIMS:
 * a group of toggles, each saying whether it is currently applied. That is what
 * a person operating it actually experiences, and it is true.
 */
/**
 * THE SAME CHOICE THE RAIL ALREADY OFFERS, shown where the rail is not.
 *
 * `RoomDetail` draws this only under `md:hidden`, because on desktop the
 * persistent room rail is the switcher. THAT IS WHY IT CANNOT BE A TABLIST:
 * the `<Body>` it changes renders at EVERY width, outside the hidden wrapper,
 * so a `tabpanel` here would carry an `aria-labelledby` pointing at a tab that
 * is not in the document on desktop. A dangling reference is a worse defect
 * than the missing keyboard it would have been fixing.
 *
 * It is navigation, so it says so with `aria-current`. No roving tab stop
 * either, and that is correct rather than lazy: these are links-in-effect, and
 * a reader tabbing through a short list of destinations expects each one to be
 * a stop, exactly as they are in the rail this stands in for.
 */
export function ViewSwitch<T extends string>({
  views,
  active,
  onSelect,
  label,
}: {
  views: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
  label: string;
}) {
  return (
    <nav data-mrd="" className="flex flex-wrap items-center gap-mrd-2" aria-label={label}>
      {views.map((v) => {
        const on = v.id === active;
        return (
          <button
            key={v.id}
            type="button"
            aria-current={on ? "true" : undefined}
            onClick={() => onSelect(v.id)}
            className={`inline-flex h-8 items-center rounded-mrd-chip px-3 text-[12.5px] transition-colors ${
              on
                ? "bg-mrd-select font-medium text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-body"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {v.label}
          </button>
        );
      })}
    </nav>
  );
}

export function SegmentedFilter<T extends string>({
  options,
  active,
  onSelect,
  label,
}: {
  options: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
  /** Names what is being narrowed, not what the options are. */
  label: string;
}) {
  return (
    <div
      data-mrd=""
      className="flex flex-wrap items-center gap-mrd-2"
      role="group"
      aria-label={label}
    >
      {options.map((o) => {
        const on = o.id === active;
        return (
          <button
            key={o.id}
            type="button"
            /* Not `aria-selected`, which belongs to tabs, options and rows.
               `aria-pressed` is the toggle's own word and it is the honest one:
               this button reports whether its filter is applied. */
            aria-pressed={on}
            onClick={() => onSelect(o.id)}
            className={`inline-flex h-8 items-center rounded-mrd-chip px-3 text-[12.5px] transition-colors ${
              on
                ? "bg-mrd-select font-medium text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-body"
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

/**
 * A READ IN FLIGHT, AT THE READING POSITION.
 *
 * It replaces a 220px shimmer bar that said nothing: a decorative pulse where a
 * table will land tells a reader that something is coming and never what, and a
 * page with four of them at once reads as broken rather than as busy. This says
 * the word, in a live region so it is announced, and reserves no fake shapes.
 *
 * The shared `Reading` with the vertical padding a panel needs. It is a
 * composition rather than a variant, and it stayed here because the two callers
 * that need it are both rooms.
 */
export function PanelReading({ children = "Reading." }: { children?: React.ReactNode }) {
  return (
    <p data-mrd="" className="py-mrd-6 text-[13px] text-mrd-mute" role="status" aria-live="polite">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * The state of a room
 * ------------------------------------------------------------------ */

/**
 * The four states a room can be in, as words the reader can act on. Each is
 * bound to one token, and the reasoning for each is in this file's header.
 *
 * `healthy` renders NOTHING. A healthy room is the absence of news, and a green
 * "HEALTHY" chip on four rooms at once is four things competing for attention
 * to say that nothing needs any.
 *
 * The three live values are `RoomGlance["state"]` verbatim, so a caller hands
 * this the value it already holds and no surface writes a mapping that can
 * drift from the builder. `failed` is the fourth, which no glance can carry
 * because a room that did not load has no glance at all.
 */
export type RoomStateWord = "healthy" | "watch" | "unconfigured" | "failed";

export function StateWord({ state }: { state: RoomStateWord }) {
  if (state === "healthy") return null;
  const [ink, word] =
    state === "watch"
      ? (["text-mrd-hold", "Needs a look"] as const)
      : state === "unconfigured"
        ? (["text-mrd-mute", "Not set up"] as const)
        : (["text-mrd-fail", "Did not load"] as const);
  return (
    <span
      data-mrd=""
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] ${ink}`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {word}
    </span>
  );
}
