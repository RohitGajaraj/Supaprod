/**
 * WHAT IS HAPPENING NOW, in one register, decided by state.
 *
 * ── THE DEFECT THIS CLOSES ──────────────────────────────────────────────
 * Walked live on 2026-09-08 on the one run that has ever shipped to
 * production (`2fdf93b6`, PR #5 merged, promoted, answering 200): the first
 * words on the screen were **"Why it stopped. This work is not moving until
 * this clears."** under a hold-amber chip, over a button offering to "Let
 * Learn try again" on a calendar wait a retry cannot move. The product's
 * biggest success read as its latest failure.
 *
 * It read that way because five things on the left pane each said what was
 * happening, each in its own register, and none of them was the one that
 * decided: the character's sentence, the drive result rows, the "You stopped
 * this run" row, the "Why it stopped" region and the "Learning to come"
 * region. Four of them were absent on any given run and the one that drew was
 * whichever branch fired first, so the register was an accident of order.
 *
 * ── ONE PLACE, ONE REGISTER ─────────────────────────────────────────────
 * This module reads the same facts those five read and answers ONCE, with the
 * register chosen on purpose. The rule for the register is the founder's own
 * (Lane 1, 2026-09-08): **a wait the machine has in hand is not an
 * exception**, so it carries no status hue at all. Amber is for a condition
 * that must change before the work moves; the person's colour is for a call
 * only they can make; the agent's colour is for work happening. A run that
 * is live in production and waiting for seven days of data is not amber.
 *
 * The order below is the priority order. A run can be several of these at
 * once (paused AND held, say) and the person needs the one that decides what
 * they can do next.
 */
import type { StatusWord } from "@/components/meridian/StatusChip";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { holdTone } from "@/lib/spine/driver";
import { nothingIsComing } from "@/components/track/nothing-is-coming";
import { stoppedByYou } from "@/components/track/footer-mode";
import { waitingOnTime } from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { verbForTool } from "@/lib/presence/character";
import { formatDeadlineDate } from "@/components/track/expiry-deadline";
import { relativeTime } from "@/lib/memory-view";
import { triesLine } from "@/components/track/hold-tries";

export type NowRegister =
  | "reading"
  | "unread"
  | "working"
  | "you"
  | "scheduled"
  | "held"
  | "stopped"
  | "paused"
  | "finished"
  | "abandoned"
  | "ready"
  | "between";

export type Now = {
  register: NowRegister;
  /** The chip family. `quiet` is the neutral chip: nothing is wrong and nobody is needed. */
  status: StatusWord;
  /** The chip's word. */
  word: string;
  /** One sentence, the fact a person came for. */
  headline: string;
  /** One more sentence, what happens next or what it needs. Null when the headline is enough. */
  line: string | null;
  /** Whether the chip breathes. Only while something is genuinely moving or asking. */
  pulse: boolean;
};

export type NowTrack = {
  status: "open" | "done" | "abandoned";
  station: AgentStation;
  hold: string | null;
  holdReason: string | null;
  holdBecause: string | null;
  drivenAt: string | null;
  deferredUntil: string | null;
  attempts: number;
  route: { path: AgentStation[] };
};

export type NowInput = {
  track: NowTrack | null;
  loading: boolean;
  /** The page's own reads are failing. */
  feedDead: boolean;
  /** Seats the record says are working, or a press this tab is walking. */
  live: boolean;
  /** The tool the newest live seat is calling right now, if the record says. */
  currentTool: string | null;
  /** The seats the record says are working, newest first. */
  seats: ReadonlyArray<{ name: string; waiting: boolean }>;
  /** Automatic steps this tab still has on the current press, or null when not pressing. */
  legsLeft: number | null;
  /** The forecast's horizon, ISO, when Decide recorded one. */
  horizon: string | null;
  /** Whether a connected source can grade the forecast. Null while unread. */
  gradableBySource: boolean | null;
  /** When the change went out, ISO, when Ship released one. */
  shippedAt: string | null;
  /** Learn's verdict, when it has one. */
  verdict: "held" | "missed" | "inconclusive" | null;
  nowMs: number;
};

/** The next station on the route after the one the work stands at, by the route's own path. */
export function nextStation(track: Pick<NowTrack, "station" | "route">): AgentStation | null {
  const path = track.route.path;
  const i = path.indexOf(track.station);
  if (i < 0) return null;
  return path[i + 1] ?? null;
}

const VERDICT_LINE: Record<NonNullable<NowInput["verdict"]>, string> = {
  held: "It did what you said it would. The evidence is on the right.",
  missed: "It did not do what you said it would. The evidence is on the right.",
  inconclusive:
    "Whether it did what you said could not be told from the evidence. It is on the right.",
};

export function runNow(input: NowInput): Now {
  const t = input.track;
  if (input.feedDead) {
    return {
      register: "unread",
      status: "hold",
      word: "Out of touch",
      headline: "This screen has lost sight of the run.",
      line: "The reads are failing. The work itself may be fine; reload to look again.",
      pulse: false,
    };
  }
  if (input.loading || !t) {
    return {
      register: "reading",
      status: "quiet",
      word: "Reading",
      headline: "Reading this run.",
      line: null,
      pulse: false,
    };
  }
  const here = AGENT_STATIONS[t.station]?.name ?? t.station;

  if (t.status === "done") {
    return {
      register: "finished",
      status: "pass",
      word: "Finished",
      headline: "It reached the end of its route.",
      line: input.verdict ? VERDICT_LINE[input.verdict] : null,
      pulse: false,
    };
  }
  if (t.status === "abandoned") {
    return {
      register: "abandoned",
      status: "hold",
      word: "Abandoned",
      headline: "This run was abandoned.",
      line: t.hold ?? null,
      pulse: false,
    };
  }
  if (stoppedByYou(t.holdReason, t.holdBecause)) {
    return {
      register: "paused",
      status: "hold",
      word: "Stopped",
      headline: "You stopped this.",
      line: "Nothing more is dispatched, by this page or by the loop, until you run it again.",
      pulse: false,
    };
  }
  if (input.live) {
    const seat = input.seats.find((s) => !s.waiting) ?? input.seats[0] ?? null;
    const doing = input.currentTool ? verbForTool(input.currentTool) : null;
    const headline = seat
      ? doing
        ? `${seat.name} is ${doing}.`
        : `${seat.name} is working at ${here}.`
      : doing
        ? `It is ${doing}.`
        : `Working at ${here}.`;
    const next = nextStation(t);
    const nextLine = next
      ? `Next: ${AGENT_STATIONS[next].name}. It asks before anything ships.`
      : `${here} is the last station on this route.`;
    const legs =
      input.legsLeft !== null && input.legsLeft > 0
        ? ` This press has ${input.legsLeft} automatic ${input.legsLeft === 1 ? "step" : "steps"} left.`
        : "";
    return {
      register: "working",
      status: "agent",
      word: "Working",
      headline,
      line: `${nextLine}${legs}`,
      pulse: true,
    };
  }

  const tone = holdTone(t.holdReason);
  if (tone === "you") {
    if (nothingIsComing(t.holdReason)) {
      return {
        register: "stopped",
        status: "you",
        word: "Stopped",
        headline: `Stopped at ${here}.`,
        line: t.hold ?? "Nothing will pick it up again on its own.",
        pulse: false,
      };
    }
    return {
      register: "you",
      status: "you",
      word: "Needs you",
      headline: t.hold ?? "A call is in front of you.",
      line: "The work continues the moment it is answered.",
      pulse: true,
    };
  }

  /*
   * ── THE CALENDAR WAIT, AND THE SOURCE GAP INSIDE IT ─────────────────────
   * Walked live: the shipped run's forecast ("tablet checkout completion over
   * a 7-day window") is one no connected source can read, so R-39's check
   * answered false and the old card fell through to "On hold ... Let Learn try
   * again", a retry that cannot move a date. While the date is still ahead the
   * honest register is QUIET, with the gap named and the one thing that
   * closes it: connect a source before the date, or grade it yourself on the
   * day. Once the date has passed with no source, the wait is over and the
   * hold branch below takes it, in the person's colour.
   */
  const dateAhead = waitingOnTime({
    station: t.station,
    holdReason: t.holdReason,
    horizon: input.horizon,
    gradableBySource: null,
    now: input.nowMs,
  });
  if (dateAhead) {
    const due = formatDeadlineDate(input.horizon ? Date.parse(input.horizon) : null);
    const since = input.shippedAt ? relativeTime(input.shippedAt, input.nowMs) : null;
    const ungradable = input.gradableBySource === false;
    const arrives = due
      ? `The verdict arrives ${due}.`
      : "The verdict arrives when the forecast comes due.";
    return {
      register: "scheduled",
      status: "quiet",
      word: due ? `Verdict ${due}` : "Waiting for the date",
      headline: since ? `Live in production, went out ${since}.` : "The change is out.",
      line: ungradable
        ? `${arrives} Nothing connected here can measure it yet: connect a source before then, or grade it yourself on the day.`
        : `${arrives} Nothing here needs you until then.`,
      pulse: false,
    };
  }

  if (tone === "hold") {
    const moved = t.drivenAt
      ? `It last moved ${relativeTime(t.drivenAt, input.nowMs)}.`
      : "It has never been driven.";
    const tries = triesLine(t.attempts, here);
    return {
      register: "held",
      status: "hold",
      word: "On hold",
      headline: t.hold ?? `${here} stopped and is waiting on something.`,
      line: [moved, tries].filter(Boolean).join(" "),
      pulse: false,
    };
  }

  if (t.drivenAt === null) {
    return {
      register: "ready",
      status: "quiet",
      word: "Ready",
      headline: "Ready when you are.",
      line: `It starts at ${here} and asks before anything ships.`,
      pulse: false,
    };
  }

  return {
    register: "between",
    status: "quiet",
    word: "Between steps",
    headline: `Waiting for its next turn at ${here}.`,
    line: "The loop picks it up on its own. Run it now to skip the wait.",
    pulse: false,
  };
}
