/**
 * JOURNEY. The seven stations drawn as the road one piece of work travels.
 *
 * ── WHY THIS EXISTS (Lane 1, 2026-09-08) ────────────────────────────────
 * The founder's read of the product on 2026-09-08: "the stations do not form
 * a flow, the journey is broken, layers 1, 2 and 3 do not stitch together."
 * The seven-station strip had been folded out of every screen but the run
 * (it drew a permanent band of counts nobody could act on), and the result
 * was a home with no picture of the loop at all. A person could not see that
 * a sentence becomes evidence, a decision, a spec, a prototype, a change, a
 * release and a verdict, or where their own work stood on that road.
 *
 * This is that picture, and it is one drawing used in two sizes:
 *
 *   full   the run screen's header (the spine, and the selector for the right
 *          pane) and the home's map of where every run stands
 *   row    the position mark at the left of a run row on the home
 *
 * ── WHAT IT IS NOT ──────────────────────────────────────────────────────
 * Not a menu (R-01): pressing a station never opens a station page. With
 * `onSelect` it is a tablist that selects what a pane shows; without it, it
 * is a list a screen reader walks. Not a progress bar: it counts STOPS, and a
 * stop is a fact off the track's own row, never an estimate. Not a colour
 * ramp (law 4): identity is the glyph, hue is status, and only the five
 * status words paint anything.
 *
 * ── THE STATES, AND WHY EACH IS ITS OWN WORD ────────────────────────────
 *   pending    not reached. Faint outline, so the road ahead is visible.
 *   done       behind the work. Neutral fill; an outcome needs no hue unless
 *              a verdict was recorded (pass/fail lights the ring).
 *   working    a machine is inside it now. Agent azure and a slow breath,
 *              because this node is the one place a person sees the agent is
 *              alive between transcript rows.
 *   you        a person is required here. Orchid. The only state that asks.
 *   held       stopped on a condition that is not a person. Amber.
 *   waiting    standing here with nothing moving it. Neutral, and it is the
 *              most common state in the record (58 of 59 tracks stood
 *              somewhere with nobody driving), so it must never look like
 *              working, and never like an exception either.
 *   scheduled  waiting for a date it already knows. NEUTRAL, deliberately:
 *              Lane 2 measured a shipped run reading its calendar wait in the
 *              same amber as a failure. A wait the machine has in hand is not
 *              an exception, so it carries no status hue, only a clock.
 *   failed     it did not work. Red, and only ever a result.
 *   waived     skipped by a rule. Dashed, faint, still counted.
 */
import * as React from "react";

import { PresenceDot } from "./AgentPresence";

import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { GLYPH_FOR_STATION, StationGlyph } from "./station-glyphs";
import { formatElapsed } from "./run-rows";

export type JourneyKey = AgentStation;

export type JourneyState =
  "pending" | "working" | "done" | "held" | "scheduled" | "waiting" | "you" | "failed" | "waived";

export type JourneyStation = {
  key: JourneyKey;
  /** Defaults to the station's display name. */
  label?: string;
  state: JourneyState;
  /** One short line under the node in full form: "PR #5 merged", "8 drawings". */
  outcome?: string | null;
  /** Lights the ring of a done station. Never an intent. */
  verdict?: "pass" | "fail" | "open" | null;
  /** ISO. When `state` is working, the clock ticks from here. */
  at?: string | null;
  elapsedMs?: number | null;
  /** Full form only: how many pieces of work stand here. Drawn when > 0. */
  count?: number | null;
  /**
   * WHO IS WORKING HERE RIGHT NOW, each in their own presence colour (the
   * same colour AgentPresence gives the seat everywhere else). Full form
   * only: a cluster of live dots at the node's foot, so the road itself
   * shows where the machine is, not only where the work stands. The
   * founder's standing goal, 2026-09-08: the work is visibly seen.
   */
  presences?: ReadonlyArray<{ seat: string; colour: string }> | null;
};

export const JOURNEY_ORDER: readonly JourneyKey[] = [
  "sense",
  "decide",
  "define",
  "design",
  "build",
  "ship",
  "learn",
];

/** What each station hands the next, in the person's words. The promise a
 *  first-run home makes under the composer. */
export const JOURNEY_PRODUCES: Record<JourneyKey, string> = {
  sense: "evidence",
  decide: "a decision",
  define: "a spec",
  design: "a prototype",
  build: "the change",
  ship: "a release",
  learn: "a verdict",
};

export const JOURNEY_STATE_WORD: Record<JourneyState, string> = {
  pending: "not yet",
  working: "working",
  done: "done",
  held: "stopped",
  scheduled: "waiting for its date",
  waiting: "standing here, nothing moving it",
  you: "needs you",
  failed: "failed",
  waived: "skipped",
};

/*
 * PAINT, AS TOKEN NAMES. Three per state: the ring, the glyph ink, the fill.
 * Tokens rather than classes so the same table serves both sizes and both
 * grounds, and so the ratchet sees no raw colour anywhere in this file.
 */
type Paint = { ring: string; ink: string; fill: string; dashed?: boolean };

const PAINT: Record<JourneyState, Paint> = {
  pending: { ring: "var(--mrd-line)", ink: "var(--mrd-faint)", fill: "transparent" },
  done: { ring: "var(--mrd-edge)", ink: "var(--mrd-body)", fill: "var(--mrd-lift)" },
  working: { ring: "var(--mrd-agent)", ink: "var(--mrd-agent)", fill: "var(--mrd-agent-chip)" },
  you: { ring: "var(--mrd-you)", ink: "var(--mrd-you)", fill: "var(--mrd-you-chip)" },
  held: { ring: "var(--mrd-hold)", ink: "var(--mrd-hold)", fill: "var(--mrd-hold-chip)" },
  scheduled: { ring: "var(--mrd-edge)", ink: "var(--mrd-mute)", fill: "var(--mrd-lift)" },
  waiting: { ring: "var(--mrd-edge)", ink: "var(--mrd-body)", fill: "var(--mrd-lift)" },
  failed: { ring: "var(--mrd-fail)", ink: "var(--mrd-fail)", fill: "var(--mrd-fail-chip)" },
  waived: { ring: "var(--mrd-line)", ink: "var(--mrd-faint)", fill: "transparent", dashed: true },
};

function paintOf(s: JourneyStation): Paint {
  const base = PAINT[s.state];
  if (s.state === "done" && s.verdict === "pass") return { ...base, ring: "var(--mrd-pass)" };
  if (s.state === "done" && s.verdict === "fail") return { ...base, ring: "var(--mrd-fail)" };
  return base;
}

/** True of the states where the work is standing now. */
const CURRENT = new Set<JourneyState>(["working", "you", "held", "scheduled", "waiting", "failed"]);

function labelOf(s: JourneyStation): string {
  return s.label ?? AGENT_STATIONS[s.key].name;
}

function describe(s: JourneyStation, promise = false): string {
  /* A PROMISE IS NOT A RUN. Read off the live accessibility tree on the first
     home: the road before any run announced "Discover: not yet" seven times
     for work that does not exist. In promise form each stop reads what it
     hands on ("Discover: the evidence"), with no state word at all. */
  if (promise) return s.outcome ? `${labelOf(s)}: ${s.outcome}` : labelOf(s);
  const bits = [`${labelOf(s)}: ${JOURNEY_STATE_WORD[s.state]}`];
  if (s.outcome) bits.push(s.outcome);
  if (s.count && s.count > 0) bits.push(`${s.count} here`);
  if (s.presences && s.presences.length > 0)
    bits.push(`${s.presences.map((p) => p.seat).join(" and ")} working here now`);
  return bits.join(", ");
}

/**
 * The seconds since `at`, ticking once a second while `live`. Hooks cannot be
 * conditional, so the tick is always mounted and simply idle when not live.
 */
function useClock(at: string | null | undefined, live: boolean): string | null {
  const started = at ? Date.parse(at) : NaN;
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!live || !Number.isFinite(started)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [live, started]);
  if (!live || !Number.isFinite(started)) return null;
  return formatElapsed(Math.max(0, (now - started) / 1000));
}

function RowClock({ at }: { at: string | null }) {
  const clock = useClock(at, true);
  if (!clock) return null;
  return (
    <span className="font-mrd-mono ml-mrd-2 text-mrd-data tabular-nums text-mrd-mute">{clock}</span>
  );
}

/* ── THE NODE ───────────────────────────────────────────────────────────── */

function Node({
  station,
  size,
  active,
}: {
  station: JourneyStation;
  size: "row" | "full";
  active: boolean;
}) {
  const p = paintOf(station);
  const working = station.state === "working";
  /*
   * ROW FORM PAINTS BY WEIGHT, NOT ONLY BY HUE. At six pixels a lift fill
   * and a transparent fill are the same grey, so the road behind the work
   * and the road ahead read alike (seen live, 2026-09-08). Behind: a solid
   * faint dot. Ahead: an outline. Here: larger, and filled with the state's
   * own ink so a neutral wait is still unmistakably the current stop.
   */
  const current = CURRENT.has(station.state);
  const px = size === "full" ? 32 : current ? 9 : 6;
  const ringWidth = size === "full" ? (active || current ? 1.5 : 1) : 1;
  const rowFill =
    size === "row"
      ? station.state === "done"
        ? p.ring
        : station.state === "pending" || station.state === "waived"
          ? "transparent"
          : current && (station.state === "waiting" || station.state === "scheduled")
            ? "var(--mrd-body)"
            : station.state === "working" && station.presences?.[0]
              ? /* the seat inside it, in its own colour (see journeyOfRun) */
                `var(${station.presences[0].colour})`
              : p.ink
      : p.fill;
  const rowRing = size === "row" && current ? rowFill : p.ring;

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors"
      style={{
        width: px,
        height: px,
        background: rowFill,
        boxShadow: `inset 0 0 0 ${ringWidth}px ${size === "row" ? rowRing : p.ring}`,
        outline: p.dashed ? `1px dashed ${p.ring}` : undefined,
        outlineOffset: p.dashed ? -1 : undefined,
        color: p.ink,
        transitionDuration: "var(--mrd-d-move)",
      }}
    >
      {working ? (
        /* The breath. One ring, outside the node, on the agent hue, at the
           slow cadence StatusChip already uses for a machine (2400ms). The
           reduced-motion block in meridian.css keys on the keyframe name in
           the style attribute and stops it. */
        <span
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 0 ${size === "full" ? 4 : 2}px var(--mrd-agent-dim)`,
            opacity: 0.55,
            animation: "mrd-attention 2400ms var(--mrd-ease-soft) infinite",
          }}
        />
      ) : null}
      {size === "full" ? (
        <StationGlyph kind={GLYPH_FOR_STATION[station.key]} size={14} className="relative" />
      ) : null}
      {size === "full" && station.presences && station.presences.length > 0 ? (
        /* THE SEATS AT THIS STATION. Up to three live dots overlapping at the
           node's foot, the fourth and beyond folded into a count; each in the
           seat's own colour, so the same seat reads the same on the road, in
           the Working-now strip and on the run screen. */
        <span className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 items-center">
          {station.presences.slice(0, 3).map((pr, i) => (
            <PresenceDot
              key={pr.seat}
              colour={pr.colour}
              size={8}
              className={i > 0 ? "-ml-1 ring-2 ring-mrd-bg" : "ring-2 ring-mrd-bg"}
            />
          ))}
          {station.presences.length > 3 ? (
            <span className="font-mrd-mono ml-0.5 text-mrd-micro leading-none text-mrd-mute tabular-nums">
              +{station.presences.length - 3}
            </span>
          ) : null}
        </span>
      ) : null}
      {size === "full" && station.count && station.count > 0 ? (
        <span
          className="font-mrd-mono absolute -top-1 -right-1.5 min-w-[16px] rounded-full px-1 text-center text-mrd-micro leading-mrd-snug tabular-nums"
          style={{
            background: CURRENT.has(station.state) ? p.ring : "var(--mrd-solid)",
            color: "var(--mrd-on-solid)",
          }}
        >
          {station.count}
        </span>
      ) : null}
    </span>
  );
}

/* ── THE CONNECTOR ──────────────────────────────────────────────────────── */

function Link({
  from,
  to,
  size,
}: {
  from: JourneyStation;
  to: JourneyStation;
  size: "row" | "full";
}) {
  const travelled = from.state === "done" || from.state === "waived";
  const reached = travelled && to.state !== "pending";
  return (
    <span
      aria-hidden="true"
      className={size === "full" ? "h-px min-w-[12px] flex-1" : "h-px w-[3px] shrink-0"}
      style={{
        background: reached || travelled ? "var(--mrd-edge)" : "var(--mrd-line-soft)",
        transitionDuration: "var(--mrd-d-move)",
      }}
    />
  );
}

/* ── FULL FORM: NODE, LABEL, OUTCOME OR CLOCK ───────────────────────────── */

function Stop({
  station,
  active,
  onSelect,
  interactive,
  selects,
  promise,
}: {
  station: JourneyStation;
  active: boolean;
  onSelect?: (key: JourneyKey) => void;
  interactive: boolean;
  selects: "pane" | "filter";
  promise: boolean;
}) {
  const clock = useClock(station.at, station.state === "working");
  const current = CURRENT.has(station.state);
  const p = paintOf(station);
  const line = clock ?? station.outcome ?? null;

  const body = (
    <>
      <Node station={station} size="full" active={active} />
      <span
        className={`mt-mrd-2 block max-w-[9rem] truncate text-center text-mrd-label leading-mrd-snug ${
          current || active ? "font-medium" : ""
        }`}
        style={{ color: current ? p.ink : active ? "var(--mrd-ink)" : "var(--mrd-mute)" }}
      >
        {labelOf(station)}
      </span>
      {line ? (
        <span
          className={`block max-w-[9rem] truncate text-center text-mrd-small leading-mrd-snug text-mrd-mute ${
            clock ? "font-mrd-mono tabular-nums" : ""
          }`}
        >
          {line}
        </span>
      ) : null}
    </>
  );

  const shape = "flex flex-col items-center px-mrd-2 py-mrd-1 rounded-mrd-ctl";

  if (interactive) {
    return (
      <button
        type="button"
        {...(selects === "pane"
          ? { role: "tab", "aria-selected": active }
          : { "aria-pressed": active })}
        aria-label={describe(station, promise)}
        data-mrd=""
        data-state={station.state}
        onClick={() => onSelect?.(station.key)}
        className={`${shape} transition-colors hover:bg-mrd-hover ${active ? "bg-mrd-select" : ""}`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {body}
      </button>
    );
  }
  return (
    <li data-state={station.state} aria-label={describe(station)} className={shape}>
      {body}
    </li>
  );
}

/* ── THE COMPONENT ──────────────────────────────────────────────────────── */

export function Journey({
  stations,
  active,
  onSelect,
  size = "row",
  label = "The road this work travels",
  className = "",
  word = true,
  selects = "pane",
  promise = false,
}: {
  /** Row form: print the current station's name after the dots. Off in a
   *  list whose rows already say the station in their sentence. */
  word?: boolean;
  /** In route order. Seven, normally; fewer is a route with waivers folded. */
  stations: readonly JourneyStation[];
  /** Full form: the station whose pane is showing. */
  active?: JourneyKey | null;
  /** Full form: when given, the drawing is a tablist and each stop a tab. */
  onSelect?: (key: JourneyKey) => void;
  size?: "row" | "full";
  /** The accessible name of the whole drawing. */
  label?: string;
  /**
   * What a press MEANS when `onSelect` is given (Lane 1, 2026-09-08). On the
   * run screen a stop selects the pane beside it, which is a tablist. On the
   * home a stop narrows the list below it, which is a set of toggles: a
   * screen reader hears "pressed", not "selected", and there is no panel to
   * announce. The drawing is the same; only the roles differ.
   */
  selects?: "pane" | "filter";
  /** The road drawn before any run exists: every stop pending, each carrying
   *  what it hands on. Changes only what is read aloud. */
  promise?: boolean;
  className?: string;
}) {
  if (stations.length === 0) return null;
  const interactive = size === "full" && typeof onSelect === "function";
  const here = stations.find((s) => CURRENT.has(s.state)) ?? null;
  const summary = stations.map((s) => describe(s, promise)).join(" · ");

  if (size === "row") {
    /* A clock on a single working station, for the presence strip. */
    const clockStation = stations.length === 1 && here?.state === "working" ? here : null;
    /*
     * ROW FORM. Seven dots and the word for where it stands. The dots carry
     * the shape (how far along) and the one lit dot carries the status; the
     * word beside it is the same fact as text, so nothing lives only in the
     * drawing. `title` hands a mouse the whole route.
     */
    return (
      <span
        data-mrd=""
        role="img"
        aria-label={`${label}: ${summary}`}
        title={summary}
        className={`inline-flex items-center gap-[3px] ${className}`}
      >
        {stations.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 ? <Link from={stations[i - 1]!} to={s} size="row" /> : null}
            <Node station={s} size="row" active={false} />
          </React.Fragment>
        ))}
        {here && word ? (
          <span
            className="ml-mrd-2 whitespace-nowrap text-mrd-small leading-none"
            style={{ color: paintOf(here).ink }}
          >
            {labelOf(here)}
          </span>
        ) : null}
        {clockStation ? <RowClock at={clockStation.at ?? null} /> : null}
      </span>
    );
  }

  const Wrap = interactive ? "div" : "ol";
  return (
    <Wrap
      data-mrd=""
      {...(interactive ? { role: selects === "pane" ? "tablist" : "group" } : {})}
      aria-label={label}
      className={`flex w-full items-start ${className}`}
    >
      {stations.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 ? (
            <span
              aria-hidden="true"
              className="flex h-[32px] min-w-[12px] flex-1 items-center pt-mrd-1"
            >
              <Link from={stations[i - 1]!} to={s} size="full" />
            </span>
          ) : null}
          <Stop
            station={s}
            active={active === s.key}
            onSelect={onSelect}
            interactive={interactive}
            selects={selects}
            promise={promise}
          />
        </React.Fragment>
      ))}
    </Wrap>
  );
}

export default Journey;
