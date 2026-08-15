import * as React from "react";

/*
 * THE ENGINE ROOM, DRAWN IN MERIDIAN.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────────
 * Two dead token layers at once, which is why this surface looked older than
 * everything around it. The route and the glance cards drew from `--sp-*`
 * (life support: meridian.css says no new surface may use it and every
 * migrated surface drops it). The room bodies underneath them drew from a layer
 * older still — `--text-primary`, `--hairline`, `--madder-bright`, `--glacier`,
 * `--font-pixel` — which is the Obsidian/Cadence vocabulary Meridian was
 * written to replace outright. A surface reading from three systems at once
 * cannot be consistent with any of them.
 *
 * ── THE ONE RULE THIS SURFACE KEPT GETTING WRONG ────────────────────────
 * A ROOM THAT DID NOT LOAD MUST NEVER WEAR A HEALTHY ONE'S CLOTHES, and an
 * UNCONFIGURED room must not wear a troubled one's. Both were already argued
 * for in this folder's own comments and both were drawn with hand-picked
 * colours, so the rule survived only as long as whoever edited next remembered
 * it. Here the four states are named — clear, needs a look, not set up, did not
 * load — and each is bound to one token:
 *
 *   NEEDS A LOOK is `--mrd-hold`, amber. Meridian's amber means stopped and NOT
 *     on you: it needs a condition to change (spend to come down, an eval to
 *     pass, a dependency to answer) rather than a decision. Orchid would be
 *     wrong here and it is the reflex — orchid promises a control that moves
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
 * ── THE DEBT THIS FILE CARRIES, RECORDED RATHER THAN HIDDEN ─────────────
 * `Action`, `ReadFailed`, `Region`, `Figure` and the four state words are the
 * same ideas as the ones in components/crew/CrewChrome.tsx and
 * components/approvals/CallGate.tsx. Three copies of one button is a debt, and
 * it is taken deliberately: each of those folders belongs to a different
 * surface, and a surface reaching into another's parts is how two surfaces
 * become impossible to change separately. The right home for all of them is
 * src/components/meridian/, which this lane does not own. Flagged in the
 * report, exactly as `approvals/stopped-for.ts` flags the same debt.
 */

/**
 * THE KEYBOARD RING. Without it a control here falls through to the app-wide
 * `:focus-visible` in styles.css, which is unlayered and therefore beats any
 * Tailwind utility, and which paints from the layer this surface has left.
 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-focus)]";

/** The same ring for a control inside a clipping or scrolling parent, where an
 *  outset ring is sheared off by the container's own overflow. */
export const FOCUS_RING_INSET = `mrd-focus-inset ${FOCUS_RING}`;

/* ------------------------------------------------------------------ *
 * Type
 * ------------------------------------------------------------------ */

/** Every number, duration, count, identifier and timestamp, and nothing else. */
export function Figure({ children }: { children: React.ReactNode }) {
  return <span className="font-mrd-mono text-mrd-ink tabular-nums">{children}</span>;
}

/** The page's one h1, and the sentence under it. */
export function PageHeading({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header>
      <h1 className="text-[25px] leading-tight font-medium text-mrd-ink">{title}</h1>
      {sub ? (
        <p className="mt-mrd-3 max-w-[74ch] text-[13px] leading-relaxed text-mrd-body">{sub}</p>
      ) : null}
    </header>
  );
}

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
    <nav className="flex items-center gap-mrd-3 text-[12px]" aria-label="Where you are">
      <button
        type="button"
        onClick={back}
        className={`rounded-mrd-xs text-mrd-mute transition-colors hover:text-mrd-ink ${FOCUS_RING}`}
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

/** A region of the surface. `sub` says what it is FOR, once, never a restatement. */
export function Region({
  title,
  sub,
  children,
}: {
  title?: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section data-mrd="">
      {title ? <h2 className="text-[13px] font-medium text-mrd-ink">{title}</h2> : null}
      {sub ? (
        <p
          className={`${title ? "mt-mrd-2" : ""} max-w-[74ch] text-[12.5px] leading-relaxed text-mrd-mute`}
        >
          {sub}
        </p>
      ) : null}
      <div className={title || sub ? "mt-mrd-4" : undefined}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

/**
 * A control that does something on one press.
 *
 * NO PRIMARY VARIANT HERE, AND THAT IS THE POINT. Meridian spends `--mrd-you`
 * on the one control that IS a pending human act, and this surface has none:
 * an engineer came here to read evidence, and "Try again" and "Read the rooms
 * again" are reads rather than judgments. A neutral primary would be the reflex
 * and would spend the product's one accent on chrome.
 */
export function Action({
  children,
  className = "",
  ...rest
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-9 items-center gap-2 rounded-mrd-ctl border border-mrd-line bg-mrd-lift px-4 text-[13px] font-medium text-mrd-body transition-[background-color,transform] enabled:hover:bg-mrd-float enabled:hover:text-mrd-ink enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-45 ${FOCUS_RING} ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}

/** The quietest control: a word in a sentence that does something. */
export function QuietAction({
  children,
  className = "",
  ...rest
}: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink ${FOCUS_RING} ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}

/** A row of controls. */
export function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-mrd-4">{children}</div>;
}

/**
 * A short closed set, picked from in place. A native `<select>` deliberately:
 * keyboard-native, type-ahead for free, the platform's own list on a phone, and
 * it reports its state without being told to.
 */
export function Picker({ className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`h-8 max-w-full rounded-mrd-ctl border border-mrd-edge bg-mrd-lift px-2 text-[12.5px] text-mrd-ink transition-colors disabled:cursor-default disabled:opacity-45 ${FOCUS_RING} ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    />
  );
}

/**
 * A TEXT FIELD, AND IT DRAWS NO FOCUS BOX.
 *
 * meridian.css scopes that removal to text entry only, and the reasoning is
 * worth repeating at the call site: a focus ring exists to answer "where is the
 * keyboard", and a text field answers that twice already — a caret is blinking
 * in it, which no other control has, and its border has stepped up. A third
 * answer drawn around the outside visibly doubles the field's edge for no
 * information. Buttons, links and rows keep their ring, because none of them
 * has a caret.
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
    <div className="flex flex-col gap-mrd-2">
      <label className="text-[12px] text-mrd-mute" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * THE RECORD SPEAKING, which is a claim rather than a statistic. What backs it
 * is printed beside it. The left rule is the only mark of emphasis: no accent,
 * because the record is telling you something rather than asking you for
 * anything.
 */
export function RecordSpeaks({
  children,
  evidence,
}: {
  children: React.ReactNode;
  evidence?: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-mrd-edge pl-mrd-5">
      <p className="max-w-[68ch] text-[13px] leading-relaxed text-mrd-body">{children}</p>
      {evidence ? <p className="mt-mrd-2 text-[12px] text-mrd-faint">{evidence}</p> : null}
    </div>
  );
}

/**
 * The uppercase micro-label, and the ONE place mono is not used for it.
 *
 * Every eyebrow in this folder was set in `--font-mono` because the old system
 * used mono as a register rather than as a type for figures. meridian.css is
 * explicit that mono is for numbers, durations, counts, ids and timestamps and
 * nothing else, and it reserves a stop for exactly this instead: 10px at weight
 * 650, uppercase, which is what makes a label read as a label without borrowing
 * a monospace face it has no numerical reason to wear.
 */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-[650] tracking-wide text-mrd-mute uppercase">
      {children}
    </span>
  );
}

/**
 * ONE HEADLINE FIGURE, with the clause that bounds it.
 *
 * A number whose window is not stated is a number you cannot act on, so `note`
 * is not decoration: "spend this week" means nothing without "+18% vs the week
 * before" or, just as importantly, "prior week did not load". The figure is
 * mono and the words around it are not.
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
 * A STANDING GRANT, ON OR OFF.
 *
 * IT IS NOT GREEN, AND THAT IS THE PORT RATHER THAN A PREFERENCE. Every switch
 * in this folder filled its track with a moss green when it was on. Under
 * Meridian green reports an OUTCOME — what happened, never what is set — so a
 * green track on a routine says the routine SUCCEEDED, one inch from a last-run
 * line where green means exactly that. On steps to `--mrd-solid` instead, the
 * one ladder stop nothing else in the product uses, with the specular top edge
 * every filled control in this system carries. It survives the greyscale test
 * on knob position alone, which the hue never did.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  busy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Required: a bare switch is unreadable to a screen reader. */
  label: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:cursor-wait disabled:opacity-45 ${FOCUS_RING} ${
        checked ? "border-transparent bg-mrd-solid" : "border-mrd-edge bg-mrd-lift"
      }`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        boxShadow: checked ? "inset 0 1px 0 var(--mrd-sheen)" : undefined,
      }}
    >
      <span
        aria-hidden
        className={`absolute size-3.5 rounded-full transition-[left] ${
          checked ? "left-[1.125rem] bg-mrd-on-solid" : "left-0.5 bg-mrd-mute"
        }`}
        style={{
          transitionDuration: "var(--mrd-d-move)",
          transitionTimingFunction: "var(--mrd-ease)",
        }}
      />
    </button>
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
 */
export function ViewTabs<T extends string>({
  tabs,
  active,
  onSelect,
  label,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-mrd-2" role="tablist" aria-label={label}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(t.id)}
            className={`inline-flex h-8 items-center rounded-mrd-chip px-3 text-[12.5px] transition-colors ${FOCUS_RING} ${
              on
                ? "bg-mrd-lift font-medium text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-body"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The four things a read can be
 * ------------------------------------------------------------------ */

/** A read still in flight, which is neither empty nor failed. */
export function Reading({ children = "Reading." }: { children?: React.ReactNode }) {
  return (
    <p className="text-[13px] text-mrd-mute" role="status" aria-live="polite">
      {children}
    </p>
  );
}

/** Nothing exists yet. No accent: an empty state must not invent a call to act. */
export function NothingHere({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5 text-[13px] leading-relaxed text-mrd-body"
    >
      {children}
    </div>
  );
}

/**
 * THE READ FAILED, which says we do not know rather than that nothing is there,
 * and which carries the way out. Red is an outcome, never a warning.
 */
export function ReadFailed({
  children,
  onRetry,
  retryLabel = "Try again",
  detail = "Nothing has been changed and nothing has been lost. This screen just could not read it.",
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  detail?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      role="status"
      aria-live="polite"
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5"
    >
      <h2 className="flex items-start gap-mrd-3 text-[13px] leading-snug font-medium text-mrd-ink">
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="mt-px shrink-0 text-mrd-fail"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
        <span>{children}</span>
      </h2>
      <p className="mt-mrd-3 max-w-[62ch] text-[12.5px] leading-relaxed text-mrd-body">{detail}</p>
      {onRetry ? (
        <div className="mt-mrd-5">
          <Action onClick={onRetry}>{retryLabel}</Action>
        </div>
      ) : null}
    </section>
  );
}

/**
 * A READ IN FLIGHT, AT THE READING POSITION.
 *
 * It replaces a 220px shimmer bar that said nothing: a decorative pulse where a
 * table will land tells a reader that something is coming and never what, and a
 * page with four of them at once reads as broken rather than as busy. This says
 * the word, in a live region so it is announced, and reserves no fake shapes.
 */
export function PanelReading({ children = "Reading." }: { children?: React.ReactNode }) {
  return (
    <p className="py-mrd-6 text-[13px] text-mrd-mute" role="status" aria-live="polite">
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
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] ${ink}`}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {word}
    </span>
  );
}
