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
 *   stopped    the loop has quit and only a person restarts it. The you hue,
 *              no breath: the driver marks these holds as the person's, and
 *              the home used to paint them amber while the card under the
 *              same row said "Stopped" in orchid (fourth review, 2026-09-09).
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
  | "pending"
  | "working"
  | "done"
  | "held"
  | "stopped"
  | "scheduled"
  | "waiting"
  | "you"
  | "failed"
  | "waived"
  | "unread";

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
  presences?: ReadonlyArray<{
    seat: string;
    colour: string;
    alive?: boolean;
    /** How long the seat has been quiet, when it is (past the stall
     *  threshold). The stop prints it in the strip's own words, so the road
     *  and the strip say one number (fourth review, 2026-09-09). */
    quietMs?: number;
  }> | null;
};

/**
 * THE ROW FORM'S WIDTH, so a list's marks column fits it by construction.
 * Seven nodes at 6px (the current one 9px), six links at 4px, twelve gaps
 * at 2px: 45 + 24 + 24 = 93px. The home's rows used to reserve 84 and the
 * road ran into the title (founder, 2026-09-08: "the dots are not aligned").
 */
export const JOURNEY_ROW_WIDTH = 96;

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
  stopped: "stopped, needs a restart",
  scheduled: "waiting for its date",
  waiting: "standing here, nothing moving it",
  you: "needs you",
  failed: "failed",
  waived: "skipped",
  /* NOT REACHED AND NOT READ ARE DIFFERENT CLAIMS (fifth review, 2026-09-09).
     A refused artifacts read left the run screen drawing seven `pending`
     stops under a chip saying Finished, so a run that did all seven read as
     one that never started. This says what is true: we could not look. */
  unread: "not read",
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
  /*
   * RESTRAINT, 2026-09-08 (founder: the road "looks like an AI-written
   * design"). A current station carries its status in the ring and the
   * glyph; the fill is the neutral lift for a stop or a wait, and the
   * tinted chip only where something is alive inside it (a machine at work,
   * a person required). Labels are never coloured and the badge is never
   * coloured (see Node and Stop): colour says which state, the weight of
   * the label says it is the current one.
   */
  working: { ring: "var(--mrd-agent)", ink: "var(--mrd-agent)", fill: "var(--mrd-agent-chip)" },
  you: { ring: "var(--mrd-you)", ink: "var(--mrd-you)", fill: "var(--mrd-you-chip)" },
  held: { ring: "var(--mrd-hold)", ink: "var(--mrd-hold)", fill: "var(--mrd-lift)" },
  /*
   * THE CHIP FILL, BECAUSE A PERSON IS REQUIRED (craft pass, 2026-09-09).
   *
   * This carried the lift fill on the reasoning that nothing is alive inside a
   * run the loop has quit. The rule this file states is not "something is
   * happening" but "a person required", and a stopped run is exactly that: it
   * moves when they restart it and not before.
   *
   * The measurement that settled it. `held`, `stopped` and `failed` all drew a
   * coloured ring and glyph on the lift fill, so the three differed by HUE
   * alone at lightness 0.76, 0.74 and 0.68: within 1.06:1 of each other in
   * greyscale, and collapsing for a deuteranope, who then cannot tell a
   * condition the loop will clear from a stop only they can clear from an
   * outcome that already happened. The fill is a channel that survives both.
   *
   * `held` AND `failed` ARE CLOSED THE SAME WAY (2026-09-09, see `failed`
   * below). The contract left that pair open and asked whoever took it to
   * measure and say which of three answers it was. It is the first: a second
   * non-hue channel, and the fill is the only one free.
   */
  stopped: { ring: "var(--mrd-you)", ink: "var(--mrd-you)", fill: "var(--mrd-you-chip)" },
  scheduled: { ring: "var(--mrd-edge)", ink: "var(--mrd-mute)", fill: "var(--mrd-lift)" },
  waiting: { ring: "var(--mrd-edge)", ink: "var(--mrd-body)", fill: "var(--mrd-lift)" },
  /*
   * THE CHIP FILL, BECAUSE THE ROAD ENDED HERE (2026-09-09, closing the pair
   * the contract left open).
   *
   * WHAT WAS MEASURED FIRST, since the contract asked for that rather than a
   * preference. Every other channel is spoken for. The glyph is the STATION's,
   * not the state's, which is law 4 working as designed: identity is shape.
   * The word beside a current node is the station's own name, so `held` and
   * `failed` drew the same word. The dashed ring is `waived`. That leaves the
   * fill, which is the channel `stopped` had just taken for the same reason.
   *
   * THE AXIS, and it is one a person acts on: the road stopped here and will
   * not continue on its own. `stopped` is that with a person required, and
   * `failed` is that with the answer already in. `held` is a condition the loop
   * may still clear, so it keeps the lift and stays visibly lighter.
   *
   * `done` keeps the lift too, deliberately. It is terminal, but it is also six
   * nodes out of seven on a finished run, and filling those would make the road
   * heavy, which is the founder's own "looks AI-made" complaint. The fill marks
   * the node that STOPPED the road, never every node that is over.
   *
   * MEASURED AFTER: fail-chip is L 0.32 against lift's 0.215 on the dark
   * ground, about 1.48:1 in greyscale where the two rings alone were 1.11:1,
   * and better than the 1.24:1 the `stopped` fill was accepted at.
   *
   * ── AND IT DRAWS NOWHERE TODAY, WHICH IS STATED RATHER THAN QUIETLY TRUE ──
   * Found hours later, chasing a request to have the hue looked at. `p.fill` is
   * read only on the `size !== "row"` branch below, and NOTHING reaches that
   * branch in this state:
   *
   *   - The home's full-size road is built by `journeyMap`, which filters to
   *     `status === "open"` BEFORE calling `standingState`, and `standingState`
   *     returns `failed` only for `status === "abandoned"`. So the road cannot
   *     emit it, and that WEIGHT entry has never been read.
   *   - The home's run rows do emit it, and at `size === "row"` the node's
   *     colour is `rowFill`, which falls through to `p.ink`. This fill is not
   *     consulted.
   *   - The run screen's road never emits it either, measured on production.
   *
   * THE FILL IS KEPT AND LABELLED rather than reverted, which is this repo's
   * own pattern for an unreachable thing: it is correct the moment anything
   * draws a failed station at full size, and deleting it would leave the next
   * author to re-derive the choice with the reasoning gone. What was wrong was
   * claiming an improvement a person could see. Nobody can, yet.
   *
   * THE ROW IS NOT THE SAME PROBLEM, and that is why this is not simply moved
   * there. At row size every current node is a solid dot in its own ink, so
   * held, stopped and failed sit at L 0.76, 0.74 and 0.68: 1.055:1 between the
   * closest pair. But a row is not carrying its state alone. `YourRuns` draws a
   * control naming the state ("Why it stopped") and a sentence beside it, so
   * the row survives law 5's test on structure, which is what that test asks.
   * The 6px dot is a supporting mark, and a five-way status distinction is not
   * something 6px should be asked to carry.
   */
  failed: { ring: "var(--mrd-fail)", ink: "var(--mrd-fail)", fill: "var(--mrd-fail-chip)" },
  waived: { ring: "var(--mrd-line)", ink: "var(--mrd-faint)", fill: "transparent", dashed: true },
  /* The sink fill is the difference from `pending`, which is transparent: a
     node with something in it we cannot see, rather than an empty one nothing
     has reached. No status hue, because not reading is not a status, and it
     survives greyscale on the fill alone. */
  unread: { ring: "var(--mrd-line)", ink: "var(--mrd-faint)", fill: "var(--mrd-sink)" },
};

function paintOf(s: JourneyStation): Paint {
  const base = PAINT[s.state];
  if (s.state === "done" && s.verdict === "pass") return { ...base, ring: "var(--mrd-pass)" };
  if (s.state === "done" && s.verdict === "fail") return { ...base, ring: "var(--mrd-fail)" };
  return base;
}

/** True of the states where the work is standing now. */
const CURRENT = new Set<JourneyState>([
  "working",
  "you",
  "held",
  "stopped",
  "scheduled",
  "waiting",
  "failed",
]);

function labelOf(s: JourneyStation): string {
  return s.label ?? AGENT_STATIONS[s.key].name;
}

/**
 * Whether any seat inside a working station is still making calls. False
 * only when every seat has gone quiet past the stall threshold
 * (`presences[].alive === false`). One predicate for the breath, the clock
 * and the dot: the clock kept ticking on a node whose breath and dot had
 * stopped (fourth review, 2026-09-09).
 */
function seatsAlive(s: JourneyStation): boolean {
  return !(s.presences?.length && s.presences.every((pr) => pr.alive === false));
}

/** The longest quiet among a station's seats, in ms; 0 when none is quiet. */
function quietOf(s: JourneyStation): number {
  return Math.max(0, ...(s.presences ?? []).map((pr) => pr.quietMs ?? 0));
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
  if (s.presences && s.presences.length > 0) {
    const seats = s.presences.map((p) => p.seat).join(" and ");
    /* A quiet seat is said as quiet, the strip's own words, not as working. */
    const quiet = seatsAlive(s) ? 0 : quietOf(s);
    bits.push(
      quiet > 0
        ? `${seats} here, quiet for ${Math.round(quiet / 60_000)} min`
        : `${seats} working here now`,
    );
  }
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
  /* A working station breathes unless the seat inside it has gone quiet
     past the stall threshold (presences[].alive === false). */
  const working = station.state === "working" && seatsAlive(station);
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
      className="relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow,width,height]"
      style={{
        width: px,
        height: px,
        background: rowFill,
        boxShadow: `inset 0 0 0 ${ringWidth}px ${size === "row" ? rowRing : p.ring}`,
        outline: p.dashed ? `1px dashed ${p.ring}` : undefined,
        outlineOffset: p.dashed ? -1 : undefined,
        color: p.ink,
        /* The ring and the size move with the fill, on Meridian's own curve;
           `transition-colors` left them snapping (motion review, 2026-09-08). */
        transitionDuration: "var(--mrd-d-move)",
        transitionTimingFunction: "var(--mrd-ease)",
      }}
    >
      {working ? (
        /* The breath. One ring, outside the node, on the agent hue, at the
           slow cadence StatusChip already uses for a machine (2400ms). The
           reduced-motion block in meridian.css keys on the keyframe name in
           the style attribute and stops it.

           `mrd-halo`, not `mrd-attention` (2026-09-09): the latter drives
           opacity from 1, so it overrode the 0.55 below and this ring peaked
           at nearly twice its designed weight. `mrd-halo` reads the resting
           value beside it and breathes around that. */
        <span
          className="absolute inset-0 rounded-full"
          style={
            {
              boxShadow: `0 0 0 ${size === "full" ? 4 : 2}px var(--mrd-agent-dim)`,
              opacity: 0.55,
              "--mrd-halo-rest": 0.55,
              animation: "mrd-halo 2400ms var(--mrd-ease-soft) infinite",
              /* React.CSSProperties has no slot for a custom property; the
               assertion is the documented way to set one inline. */
            } as React.CSSProperties
          }
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
              alive={pr.alive ?? true}
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
          style={{ background: "var(--mrd-solid)", color: "var(--mrd-on-solid)" }}
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
      className={
        size === "full"
          ? "h-px min-w-[12px] flex-1 max-sm:h-full max-sm:w-px max-sm:min-w-0 max-sm:flex-none"
          : "h-px w-[4px] shrink-0"
      }
      style={{
        background: reached || travelled ? "var(--mrd-edge)" : "var(--mrd-line-soft)",
        transitionProperty: "background-color",
        transitionDuration: "var(--mrd-d-move)",
        transitionTimingFunction: "var(--mrd-ease)",
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
  /* THE CLOCK STOPS WITH THE BREATH. It ticked on state alone, so a seat
     quiet for 42 min read "42m 13s" under a still node while the strip
     above said "quiet for 42 min" with no clock (fourth review, 2026-09-09).
     A ticking clock is Meridian's own live-work signal; a quiet seat gets
     the strip's words instead, on the strip's rounding. */
  const alive = station.state === "working" && seatsAlive(station);
  const clock = useClock(station.at, alive);
  const quietMs = station.state === "working" && !alive ? quietOf(station) : 0;
  const quietLine = quietMs > 0 ? `quiet for ${Math.round(quietMs / 60_000)} min` : null;
  const current = CURRENT.has(station.state);
  const p = paintOf(station);
  /* Both facts when both exist: the clock never wins over "usually about
     4 min here", which is the thing the clock is measured against. */
  const head = clock ?? quietLine;
  const line =
    head && station.outcome ? `${head} · ${station.outcome}` : (head ?? station.outcome ?? null);

  /* ON A PHONE THE ROAD RUNS DOWN THE SCREEN. Seven stops across 390px put
     the last three off the right edge and made the home pan sideways (phone
     review, 2026-09-08). Below the phone breakpoint each stop is a row, node
     at the left, name and line beside it, and the connectors turn vertical;
     the same drawing, the same states, and nothing compressed to fit. */
  const body = (
    <>
      <Node station={station} size="full" active={active} />
      <span className="flex min-w-0 flex-col items-center max-sm:items-start">
        <span
          className={`mt-mrd-2 block max-w-[9rem] truncate text-center text-mrd-label leading-mrd-snug max-sm:mt-0 max-sm:max-w-none max-sm:text-left ${
            current || active ? "font-medium" : ""
          }`}
          style={{ color: current || active ? "var(--mrd-ink)" : "var(--mrd-mute)" }}
        >
          {labelOf(station)}
        </span>
        {line ? (
          <span
            className={`block max-w-[9rem] truncate text-center text-mrd-small leading-mrd-snug text-mrd-mute max-sm:max-w-none max-sm:text-left ${
              clock ? "font-mrd-mono tabular-nums" : ""
            }`}
          >
            {line}
          </span>
        ) : null}
      </span>
    </>
  );

  const shape =
    "flex flex-col items-center px-mrd-2 py-mrd-1 rounded-mrd-ctl max-sm:min-h-11 max-sm:flex-row max-sm:items-center max-sm:gap-mrd-3";

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
    <li data-state={station.state} aria-label={describe(station, promise)} className={shape}>
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
        className={`inline-flex items-center gap-[2px] ${className}`}
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
        {clockStation && word ? <RowClock at={clockStation.at ?? null} /> : null}
      </span>
    );
  }

  const Wrap = interactive ? "div" : "ol";
  return (
    <Wrap
      data-mrd=""
      {...(interactive ? { role: selects === "pane" ? "tablist" : "group" } : {})}
      aria-label={label}
      className={`flex w-full items-start max-sm:flex-col max-sm:items-stretch ${className}`}
    >
      {stations.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 ? (
            <span
              aria-hidden="true"
              /* THE ROAD RUNS THROUGH THE NODES' CENTRES, ON BOTH AXES (fourth
                 review, 2026-09-09). Down the phone: the wrapper starts at the
                 Stop's own padding token and is the node's 32px wide, so flex
                 centres the 1px line at 20px, the node's centre; it was a
                 hand-typed 23px margin, 3.5px right of it, a kink at every
                 stop. Across: 34px with the 2px lead leaves the node's own
                 32px, so the line centres at 18px, under the Stop's 2px
                 padding where the node's centre is; it was 32px, 1px high. */
              className="flex h-[34px] min-w-[12px] flex-1 items-center pt-mrd-1 max-sm:ml-mrd-2 max-sm:w-[32px] max-sm:justify-center max-sm:h-3 max-sm:min-w-0 max-sm:flex-none max-sm:pt-0"
            >
              <Link from={stations[i - 1]!} to={s} size="full" />
            </span>
          ) : null}
          <Stop
            station={s}
            active={active === s.key}
            onSelect={onSelect}
            /*
             * ── A FILTER STOP WITH NOTHING BEHIND IT IS NOT A CONTROL ──────
             *
             * WALKED ON THE SERVED HOME, 2026-09-10. Discover, Build and Ship
             * carried no count and were still buttons. Pressing Discover gave
             * "Showing the 0 runs at Discover." over a list reading "Nothing
             * is standing at Discover." -- a press that could only ever return
             * nothing, answered twice.
             *
             * The road ALREADY says it: a station with no work carries no
             * badge and renders faint. So the press adds nothing a person
             * could not see before making it, which is the founder's
             * "anticipate, do not interrogate" exactly.
             *
             * SCOPED TO `filter`, WHICH IS THE ENTRY'S ROAD. On the run screen
             * a stop selects the PANE beside it, and a station that filed
             * nothing is still a pane worth opening -- that is where you go to
             * find out it filed nothing. Only a filter over a list can be
             * empty in a way that makes the control pointless.
             */
            interactive={interactive && (selects === "pane" || (s.count ?? 0) > 0)}
            selects={selects}
            promise={promise}
          />
        </React.Fragment>
      ))}
    </Wrap>
  );
}

export default Journey;
