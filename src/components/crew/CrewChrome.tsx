import * as React from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { StationGlyph, type StationGlyphKind } from "@/components/meridian/station-glyphs";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";

/*
 * THE CREW SURFACE, DRAWN IN MERIDIAN.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────────
 * The `--sp-*` primitives from src/components/shell/primitives.tsx, which drew
 * both Crew surfaces until today. That layer is life support (meridian.css
 * says so in its own header: "no new surface may use it, every migrated surface
 * drops it"), so a migrated surface may not keep borrowing one shape back from
 * it. Every rule those primitives were written to hold is carried forward here,
 * because each of them was written after a real defect rather than as taste:
 *
 *   A REGION TITLE IS A HEADING. `Block` rendered its title in a <span> until
 *   an audit found `main.querySelectorAll("h1..h6")` returning exactly one
 *   element on a five-tab surface. Every title here is a real <h2>.
 *
 *   THREE FACTS, NEVER TWO. Nothing exists, a filter excluded everything, and
 *   the read failed are different sentences with different actions, and a read
 *   in flight is a fourth. `NothingHere`, `ReadFailed` and `Reading` keep them
 *   apart, and only the failure carries a way out.
 *
 *   A JUDGMENT LEAVES A MARK. `Settled` is the receipt, and it is spoken as
 *   well as drawn: an accessibility audit found six gate surfaces settling
 *   irreversible calls in total silence for anyone using a screen reader.
 *
 *   THE FILE THAT BINDS A KEY DRAWS THE KEYCAP. `Action` takes `shortcut` and
 *   binds nothing, so a keycap can only appear beside a listener the caller
 *   registered.
 *
 * ── WHY IT IS A FILE AND NOT INLINE UTILITIES ───────────────────────────
 * /approvals, the house pattern, hand-rolls a header and a quiet line inline
 * and extracts only the ideas that repeat. The same test applied here lands on
 * a bigger set, because Crew is a governance surface: a labelled boundary with
 * a control on the right is its single most repeated shape, and it appears
 * eleven times across the roster, the member view and the Engine Room's rooms.
 * Eleven hand-rolled copies is how the `--sp-*` layer got 159 tokens.
 *
 * ── THE DEBT THIS FILE CARRIES, RECORDED RATHER THAN HIDDEN ─────────────
 * `Action`, `Gate`, `ReadFailed` and `Settled` are the same ideas as
 * `GateAction`, `CallGate`, `ReadFailed` and `SettledTrail` in
 * src/components/approvals/. They are reproduced rather than imported because
 * those live inside another surface's folder, and one surface reaching into
 * another's parts is how two surfaces become impossible to change separately.
 * The right home for all of them is src/components/meridian/, which this lane
 * does not own. Flagged in the report, exactly as `stopped-for.ts` flags the
 * same debt in the other direction.
 */

/**
 * THE KEYBOARD RING, copied character for character from the ported Meridian
 * components that already carry it. Without it a control here falls through to
 * the app-wide `:focus-visible` in styles.css, which is unlayered and therefore
 * beats any Tailwind utility; that rule paints from the `--sp-*` layer this
 * surface has otherwise left, and a migrated surface borrowing one colour back
 * is how a migration stalls half done.
 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-focus)]";

/**
 * The same ring for a control sitting inside a clipping or scrolling parent.
 * An outset ring on a table cell is sheared off by the container's own
 * overflow, which reads as a broken half-drawn edge rather than as focus.
 */
export const FOCUS_RING_INSET = `mrd-focus-inset ${FOCUS_RING}`;

/* ------------------------------------------------------------------ *
 * Type
 * ------------------------------------------------------------------ */

/**
 * Every number, duration, count, identifier and timestamp, and NOTHING ELSE.
 * meridian.css is explicit that mono is for figures only; a mono word is a
 * costume. `tabular-nums` so a figure that ticks does not shift the words
 * around it sideways.
 */
export function Figure({ children }: { children: React.ReactNode }) {
  return <span className="font-mrd-mono text-mrd-ink tabular-nums">{children}</span>;
}

/** The page's one h1, and the sentence under it. */
export function PageHeading({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header>
      <h1 className="text-[25px] leading-tight font-medium text-mrd-ink">{title}</h1>
      {sub ? (
        <p className="mt-mrd-3 max-w-[68ch] text-[13px] leading-relaxed text-mrd-body">{sub}</p>
      ) : null}
    </header>
  );
}

/**
 * A region of the surface. The rule it inherits from `Block`: `sub` says what
 * the region is FOR, once, and never restates the title.
 *
 * `more` is the quiet control at the trailing edge, for a region that can show
 * more of itself than it currently does.
 */
export function Region({
  title,
  sub,
  more,
  onMore,
  children,
}: {
  title?: string;
  sub?: React.ReactNode;
  more?: string;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section data-mrd="">
      {title || more ? (
        <div className="flex items-baseline justify-between gap-mrd-4">
          {title ? (
            <h2 className="text-[13px] font-medium text-mrd-ink">{title}</h2>
          ) : (
            <span aria-hidden />
          )}
          {more ? (
            <button
              type="button"
              onClick={onMore}
              className={`shrink-0 rounded-mrd-xs text-[12px] text-mrd-mute transition-colors hover:text-mrd-ink ${FOCUS_RING}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {more}
            </button>
          ) : null}
        </div>
      ) : null}
      {sub ? (
        <p className="mt-mrd-2 max-w-[68ch] text-[12.5px] leading-relaxed text-mrd-mute">{sub}</p>
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
 * THREE VARIANTS, AND THE ACCENT IS SPENT ONCE. `primary` wears `--mrd-you`
 * only where the control IS the pending human act: granting an agent more room
 * is the reader's judgment offered as a button, which is the same reason
 * ApprovalCard and CallGate spend it there. Everything else is a neutral,
 * because meridian.css bans an accent on a hover, a focus ring or an ordinary
 * CTA, and an accent that fires on chrome stops meaning anything.
 *
 * A DISABLED PRIMARY DROPS THE ACCENT. A dead control is furniture and must
 * not keep shouting; it falls back to `--mrd-solid` with `--mrd-on-solid` on
 * it. NEVER `text-mrd-ink` on `bg-mrd-solid`: both invert with the ground, so
 * they travel together and measure 1.19:1 on paper, which is an invisible word
 * on every disabled press.
 */
export function Action({
  variant = "default",
  shortcut,
  children,
  className = "",
  ...rest
}: {
  variant?: "default" | "primary" | "quiet";
  /** Drawn, never bound. Pass it only where the caller registers a listener. */
  shortcut?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const face =
    variant === "primary"
      ? "bg-mrd-you text-mrd-on-you enabled:hover:opacity-90 disabled:bg-mrd-solid disabled:text-mrd-on-solid"
      : variant === "quiet"
        ? "text-mrd-mute enabled:hover:bg-mrd-hover enabled:hover:text-mrd-ink"
        : "border border-mrd-line bg-mrd-lift text-mrd-body enabled:hover:bg-mrd-float enabled:hover:text-mrd-ink";

  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-9 items-center gap-2 rounded-mrd-ctl px-4 text-[13px] font-medium transition-[background-color,opacity,transform] enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-45 ${FOCUS_RING} ${face} ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
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
export function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-mrd-4">{children}</div>;
}

/**
 * A short closed set, picked from in place.
 *
 * A native `<select>`, deliberately. It is keyboard-native, it answers
 * type-ahead, it opens as the platform's own list on a phone, and it reports
 * its state without being told to. The chevron is drawn by the browser and
 * left alone: replacing it would mean owning the open state, which is a
 * listbox, which is a component this surface does not need.
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
 * A boundary that goes live the moment you touch it.
 *
 * IT IS NOT GREEN ANY MORE, AND THAT IS THE POINT OF THE PORT. The primitive
 * this replaces filled its track with the pass hue and argued that "a live
 * boundary is a status". Under Meridian green reports an OUTCOME — what
 * happened, never what is set — so a green track here says an agent SUCCEEDED
 * at something one inch from a run history where green means exactly that.
 *
 * On instead steps to `--mrd-solid`, the one stop nothing else in the product
 * uses, with the specular top edge every filled control in this system carries.
 * It survives the greyscale test on knob position alone, which the hue never
 * did.
 */
export function Toggle({
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
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:cursor-default disabled:opacity-45 ${FOCUS_RING} ${
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
 * ONE BOUNDARY YOU SET: the label on the left, the control on the right.
 *
 * A line and not a card, and the governance canon is the reason: policy is set
 * in advance and does not block, so a boundary reads as a sentence with a
 * control at the end of it rather than as a panel demanding attention.
 *
 * `sub` carries DIFFERENT information from the control — why it is pinned, who
 * set it, what it would touch — and never a restatement of the value the
 * control already shows.
 */
export function Setting({
  label,
  sub,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  /** The id of the control, when it is one real form control with a value. */
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="block text-[13px] text-mrd-ink">{label}</span>
      {sub ? (
        <span className="mt-0.5 block max-w-[62ch] text-[12px] leading-snug text-mrd-mute">
          {sub}
        </span>
      ) : null}
    </>
  );

  return (
    <div className="flex items-start justify-between gap-mrd-5 border-b border-mrd-line-soft py-mrd-4 last:border-0">
      {htmlFor ? (
        <label className="min-w-0" htmlFor={htmlFor}>
          {body}
        </label>
      ) : (
        <span className="min-w-0">{body}</span>
      )}
      {children ? <span className="shrink-0 pt-0.5">{children}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The four things a read can be
 * ------------------------------------------------------------------ */

/**
 * A READ STILL IN FLIGHT, which is not an empty surface.
 *
 * Plain and quiet, deliberately not the pixel-grid `LoadingState`: that one
 * carries a live elapsed timer and belongs where an agent genuinely runs for
 * seconds. On an ordinary row read it would invent a wait that is not
 * happening, which meridian's own note on that component forbids.
 */
export function Reading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-mrd-mute" role="status" aria-live="polite">
      {children}
    </p>
  );
}

/**
 * NOTHING EXISTS YET. No accent, no illustration: an empty state must not
 * invent a call to action, and there is no decision here to make.
 *
 * `action` is the door for the cases where there genuinely is somewhere to go
 * — back to the roster, out to another surface — and is omitted everywhere
 * else rather than filled with a plausible-looking button.
 */
export function NothingHere({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5"
    >
      <div className="max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">{children}</div>
      {action ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-4">{action}</div> : null}
    </div>
  );
}

/**
 * THE READ FAILED, which is a different fact from an empty one and must never
 * wear its clothes. It says we do not know, rather than that nothing is there,
 * and it carries the way out.
 *
 * Red is correct and is not a warning: it reports an OUTCOME, which is the only
 * thing this system's red is ever allowed to mean.
 */
export function ReadFailed({
  children,
  onRetry,
  detail = "Nothing has been changed and nothing has been lost. This screen just could not read it.",
}: {
  children: React.ReactNode;
  onRetry?: () => void;
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
          <Action onClick={onRetry}>Try again</Action>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Rows
 * ------------------------------------------------------------------ */

function Chevron() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-mrd-faint transition-colors group-hover:text-mrd-body"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * A row that goes somewhere. The chevron is the promise: a row that leads
 * nowhere is not this component, it is `ListRow`.
 */
export function DoorRow({
  marks,
  lead,
  sub,
  time,
  onClick,
}: {
  marks?: React.ReactNode;
  lead: React.ReactNode;
  sub?: React.ReactNode;
  time?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-mrd-4 rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4 text-left transition-colors hover:bg-mrd-lift ${FOCUS_RING}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {marks ? <span className="shrink-0">{marks}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-mrd-ink">{lead}</span>
        {sub ? (
          <span className="mt-0.5 block truncate text-[12px] text-mrd-mute">{sub}</span>
        ) : null}
      </span>
      {time ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] text-mrd-faint tabular-nums">
          {time}
        </span>
      ) : null}
      <Chevron />
    </button>
  );
}

/**
 * A row that is read rather than opened. It draws no hover and no cursor
 * change, because an affordance is a promise and this one has nothing behind
 * it.
 */
export function ListRow({
  marks,
  lead,
  sub,
  time,
}: {
  marks?: React.ReactNode;
  lead: React.ReactNode;
  sub?: React.ReactNode;
  time?: string | null;
}) {
  return (
    <div className="flex items-start gap-mrd-4 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-4">
      {marks ? <span className="shrink-0">{marks}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-snug text-mrd-ink">{lead}</span>
        {sub ? (
          <span className="mt-0.5 block text-[12px] leading-snug text-mrd-mute">{sub}</span>
        ) : null}
      </span>
      {time ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] text-mrd-faint tabular-nums">
          {time}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The agent mark
 * ------------------------------------------------------------------ */

/**
 * WHAT IS TRUE OF THIS ONE AGENT RIGHT NOW.
 *
 * Named for the five meanings Meridian has, not for the seven the `--sp-*`
 * mark carried. `gate` is the only animated state in the product and exactly
 * one mark on a screen may wear it, which the roster enforces by picking a
 * single slug.
 */
export type CrewMarkState = "off" | "idle" | "running" | "gate" | "waiting" | "failed";

/**
 * SHAPE SAYS WHICH AGENT, COLOUR SAYS HOW IT IS DOING, AND THAT IS A CHANGE.
 *
 * The shell's mark encodes the agent as a shape AND its loop stage as a hue,
 * seven hues across the roster. That was a good system and it is the one the
 * founder retired on 2026-08-15, in the ruling written into
 * meridian/station-glyphs.tsx: seven categorical hues spend the whole palette
 * on category, and a reader can no longer tell "Plan is amber because it is
 * Plan" from "Plan is amber because something is stuck there". At the size a
 * roster card draws, seven hues at one lightness are also genuinely hard to
 * tell apart and impossible for the commonest colour vision deficiencies;
 * seven silhouettes are not.
 *
 * So the stage hue is gone from this surface and the glyph carries identity
 * alone, which is what it was drawn to do. The colour is spent on the four
 * facts that change what a reader does:
 *
 *   ORCHID  it is asking for a person. `gate` blinks, `waiting` does not.
 *   AZURE   a machine is working, right now, read from the run rows.
 *   RED     its last run failed. An outcome, never a need.
 *   NEUTRAL present and quiet, or switched off and dimmed further.
 *
 * `glyphForSlug` is imported from the shell rather than redrawn, because it
 * carries no colour of its own — every path is `currentColor` — so it ports
 * without a change. Two drawings of one agent would be the drift that
 * station-glyphs.tsx was created to stop.
 */
export function CrewMark({
  slug,
  name,
  state = "idle",
  size = "sm",
}: {
  slug: string | null | undefined;
  name?: string | null;
  state?: CrewMarkState;
  size?: "sm" | "lg";
}) {
  const Glyph = glyphForSlug(slug);

  const ink =
    state === "gate" || state === "waiting"
      ? "text-mrd-you"
      : state === "running"
        ? "text-mrd-agent"
        : state === "failed"
          ? "text-mrd-fail"
          : state === "off"
            ? "text-mrd-faint"
            : "text-mrd-mute";

  const box = size === "lg" ? "size-8 [&>svg]:size-[18px]" : "size-6 [&>svg]:size-3.5";

  return (
    <span
      role="img"
      aria-label={name ? `${name}, ${WORD_FOR[state]}` : WORD_FOR[state]}
      className={`inline-flex shrink-0 items-center justify-center rounded-mrd-chip border border-mrd-line bg-mrd-sink ${box} ${ink} ${
        state === "off" ? "opacity-55" : ""
      }`}
      /*
       * The blink is opacity only, on the one mark that is asking. It is the
       * single animation in the roster, and `mrd-pixel-on` is already listed in
       * meridian.css's reduced-motion block, so it stops for anyone who asked
       * for that without the fact going with it: the orchid stays.
       */
      style={
        state === "gate"
          ? { animation: "mrd-pixel-on 1.6s var(--mrd-ease-soft) infinite" }
          : undefined
      }
    >
      <Glyph />
    </span>
  );
}

const WORD_FOR: Record<CrewMarkState, string> = {
  off: "switched off",
  idle: "idle",
  running: "running",
  gate: "asking for you",
  waiting: "waiting for you",
  failed: "its last run failed",
};

/* ------------------------------------------------------------------ *
 * The station heading
 * ------------------------------------------------------------------ */

/**
 * The station ids are the product's own vocabulary and the glyph kinds are
 * Meridian's; both are load bearing (the ids in the database, the kinds in the
 * sidebar and the station strip), so neither is renamed and this map is the
 * one place the two meet.
 */
const GLYPH_FOR_STATION: Record<AgentStation, StationGlyphKind> = {
  sense: "discover",
  decide: "decide",
  define: "plan",
  design: "design",
  build: "build",
  ship: "ship",
  learn: "learn",
};

/**
 * THE GROUP HEAD, WITHOUT ITS COLOURED BAR.
 *
 * The bar was the stage hue, 22px of it, and it is the same ruling as the mark
 * above: colour carries status in this product and nothing else. What the bar
 * was actually doing — separating one group from the next and naming it — is
 * done here by a station GLYPH and a rule, which survive greyscale and which
 * the reader has already met in the sidebar and on the station strip. The
 * count stays mono, because it is a count.
 */
export function StationHeading({ station, count }: { station: AgentStation; count: number }) {
  return (
    <div className="flex items-center gap-mrd-3">
      <StationGlyph kind={GLYPH_FOR_STATION[station]} className="shrink-0 text-mrd-mute" />
      <h2 className="text-[13px] font-medium text-mrd-ink">{AGENT_STATIONS[station].name}</h2>
      <span className="font-mrd-mono text-[11px] text-mrd-faint tabular-nums">{count}</span>
      <span aria-hidden className="h-px min-w-6 flex-1 bg-mrd-line-soft" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The gate, and what settling it leaves behind
 * ------------------------------------------------------------------ */

/**
 * ONE QUESTION, THEN THE FACTS, THEN THE ACTIONS, IN THAT ORDER.
 *
 * That order is not a layout preference. A change on 2026-08-05 lifted the
 * reasons OUT of a gate and placed them after it, which put the evidence below
 * the Approve button and asked a person to decide above the reasons for
 * deciding. Anything that argues for the answer sits between the question and
 * the controls, and nowhere else.
 *
 * The evidence is a RECESS rather than a second card: the standard caps a
 * region at one bordered container, and the facts read as part of the question
 * by sitting below the ground rather than on top of it.
 */
export function Gate({
  question,
  lines,
  children,
}: {
  question: React.ReactNode;
  /** The facts that answer it. One fact per line, never four ways of saying one. */
  lines?: React.ReactNode[];
  /** The controls. One primary, and only one. */
  children?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
        <span className="text-[11px] font-medium text-mrd-you">Waiting on you</span>
      </span>

      <h2 className="mt-mrd-4 text-[20px] leading-tight font-medium text-mrd-ink">{question}</h2>

      {lines?.length ? (
        <div className="mt-mrd-5 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          <ul className="flex flex-col gap-mrd-3">
            {lines.map((line, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-mrd-body">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-4">{children}</div> : null}
    </section>
  );
}

/**
 * WHAT YOUR JUDGMENT CAUSED.
 *
 * A toast confirms that your click REGISTERED; this renders what your click
 * CAUSED, and that difference is the product thesis expressed as an
 * interaction. An approval that erases itself teaches you that your judgment
 * left no trace, and judgment is the product.
 *
 * SPOKEN, NOT ONLY DRAWN. An accessibility audit on 2026-08-06 found six gate
 * surfaces, this one among them, settling irreversible decisions in total
 * silence: the queue dropped the row, the question became the next call, and
 * nothing was announced. `role="status"` is the polite register, which is right
 * for a confirmation of something the person just did deliberately;
 * `role="alert"` is for trouble they did not cause.
 *
 * A FAILED WRITE TAKES THE FAILED SHAPE IMMEDIATELY. Never a success shape over
 * a failed write: that is the one thing that makes the successful ones
 * trustworthy.
 */
export function Settled({
  verb,
  consequence,
  time,
  failed = false,
}: {
  verb: string;
  consequence: React.ReactNode;
  time?: string | null;
  failed?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-3"
      style={{ animation: "mrd-fade-up 300ms var(--mrd-ease) both" }}
    >
      <span className={`text-[13px] font-medium ${failed ? "text-mrd-fail" : "text-mrd-ink"}`}>
        {verb}
      </span>
      <span className="min-w-0 text-[12.5px] leading-snug text-mrd-body">{consequence}</span>
      {time ? (
        <span className="font-mrd-mono ml-auto shrink-0 text-[12px] text-mrd-faint tabular-nums">
          {time}
        </span>
      ) : null}
    </div>
  );
}

/**
 * THE RECORD SPEAKING, which is a claim rather than a statistic.
 *
 * It contradicts you or it confirms you, and either way what backs it is
 * printed beside it. The left rule is the one mark of emphasis: no accent,
 * because the record is not asking for a person — it is telling you something,
 * and the control underneath it is where the asking happens.
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
      <p className="max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">{children}</p>
      {evidence ? <p className="mt-mrd-2 text-[12px] text-mrd-faint">{evidence}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The context column
 * ------------------------------------------------------------------ */

/** A heading in the context column. Quiet, and never a second navigation. */
export function CtxHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium tracking-wide text-mrd-mute uppercase">{children}</h2>
  );
}

/** A paragraph in the context column. */
export function CtxBody({ children }: { children: React.ReactNode }) {
  return <p className="mt-mrd-3 text-[12.5px] leading-relaxed text-mrd-body">{children}</p>;
}

/** A named fact in the context column, with one different fact under it. */
export function CtxRow({ name, sub }: { name: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mt-mrd-4">
      <span className="block text-[12.5px] text-mrd-ink">{name}</span>
      {sub ? <span className="mt-0.5 block text-[11px] text-mrd-mute">{sub}</span> : null}
    </div>
  );
}

/** One region of the context column, ruled off from the one above it. */
export function CtxSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-mrd-line-soft pt-mrd-5 first:border-0 first:pt-0">
      {children}
    </section>
  );
}
