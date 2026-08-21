import * as React from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { GLYPH_FOR_STATION, StationGlyph } from "@/components/meridian/station-glyphs";
import { Chevron } from "@/components/meridian/surface-parts";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";

/*
 * WHAT IS LEFT OF THE CREW SURFACE'S OWN PARTS.
 *
 * ── THE DEBT THIS FILE RECORDED IS PAID, 2026-08-15 ─────────────────────
 * Its old header named the debt exactly: "`Action`, `Gate`, `ReadFailed` and
 * `Settled` are the same ideas as `GateAction`, `CallGate`, `ReadFailed` and
 * `SettledTrail` in src/components/approvals/. They are reproduced rather than
 * imported because those live inside another surface's folder... The right home
 * for all of them is src/components/meridian/, which this lane does not own."
 *
 * That home now exists. `Figure`, `PageHeading`, `Region`, `Action`, `Actions`,
 * `Picker`, `Toggle`, `Reading`, `NothingHere`, `ReadFailed`, `RecordSpeaks`
 * and the chevron are in `components/meridian/surface-parts.tsx`, drawn once
 * for all five ported surfaces.
 *
 * `Action`'s one primary use on this surface, granting an agent more room, is
 * now `Approve`: a separate component rather than a variant, because that
 * control UNBLOCKS something and every other control here only shows you
 * something, which is the design system's own approve-versus-review test.
 *
 * ── WHAT DID NOT MOVE, AND WHY ──────────────────────────────────────────
 * Everything below is drawn on Crew and nowhere else, and two of them would
 * have to be bent out of shape to be shared:
 *
 *   `Gate` is the third of three gates. Approvals' prints an age and a subject,
 *   Runs' carries a three-way standing, this one carries neither. A shared gate
 *   would need every field all three surfaces have, defaulted off, which is a
 *   flag pile wearing the most important element on three screens.
 *
 *   `CrewMark` is a status BADGE with six states and a blink. Brain's mark of
 *   the same name is an inline glyph claiming no status at all, and Runs' has a
 *   different five-state vocabulary. They share the glyph and nothing else, and
 *   the glyph is already shared through `agent-glyphs.tsx`.
 *
 * ── FOCUS IS INHERITED, NOT HAND-WRITTEN ────────────────────────────────
 * The `FOCUS_RING` constant this file exported is gone, and it never worked.
 * `src/styles.css` says so at the rule that beats it, with the browser check
 * that proved it: `[data-obsidian] :focus-visible` is unlayered, Tailwind emits
 * utilities into a layer, and unlayered wins, so any component-level
 * `focus-visible:outline-*` class "is permanently inert here". Every root here
 * carries `data-mrd` instead, which is the mechanism meridian.css describes and
 * the one that actually paints.
 */

/**
 * ONE BOUNDARY YOU SET: the label on the left, the control on the right.
 *
 * A line and not a card, and the governance canon is the reason: policy is set
 * in advance and does not block, so a boundary reads as a sentence with a
 * control at the end of it rather than as a panel demanding attention.
 *
 * `sub` carries DIFFERENT information from the control -- why it is pinned, who
 * set it, what it would touch -- and never a restatement of the value the
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
    <div
      data-mrd=""
      className="flex items-start justify-between gap-mrd-5 border-b border-mrd-line-soft py-mrd-4 last:border-0"
    >
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
 * Rows
 * ------------------------------------------------------------------ */

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
      data-mrd=""
      onClick={onClick}
      className="group flex w-full items-center gap-mrd-4 rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4 text-left transition-colors hover:bg-mrd-lift"
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
      <Chevron className="text-mrd-faint group-hover:text-mrd-prose text-mrd-body" />
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
    <div
      data-mrd=""
      className="flex items-start gap-mrd-4 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-4"
    >
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
 * carries no colour of its own -- every path is `currentColor` -- so it ports
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

/* The map moved to `station-glyphs.tsx`, beside the drawings it keys, when a
   third copy was about to be written. See its note for why. */

/**
 * THE GROUP HEAD, WITHOUT ITS COLOURED BAR.
 *
 * The bar was the stage hue, 22px of it, and it is the same ruling as the mark
 * above: colour carries status in this product and nothing else. What the bar
 * was actually doing -- separating one group from the next and naming it -- is
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
              <li key={i} className="text-[13px] leading-relaxed text-mrd-prose text-mrd-body">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{children}</div> : null}
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
      data-mrd=""
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-3"
      style={{ animation: "mrd-fade-up 300ms var(--mrd-ease) both" }}
    >
      <span className={`text-[13px] font-medium ${failed ? "text-mrd-fail" : "text-mrd-ink"}`}>
        {verb}
      </span>
      <span className="min-w-0 text-[12.5px] leading-snug text-mrd-prose text-mrd-body">{consequence}</span>
      {time ? (
        <span className="font-mrd-mono ml-auto shrink-0 text-[12px] text-mrd-faint tabular-nums">
          {time}
        </span>
      ) : null}
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
  return <p className="mt-mrd-3 text-[12.5px] leading-relaxed text-mrd-prose text-mrd-body">{children}</p>;
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
    <section
      data-mrd=""
      className="pt-mrd-5 first:pt-0"
    >
      {children}
    </section>
  );
}
