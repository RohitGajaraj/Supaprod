/**
 * WHO CAUSED EACH LEG (queue 65's component half).
 *
 * `stage_events.driven_via` is the record of who asked for a station move:
 * `press` is the person, `sweep` is the loop walking on its own,
 * `continuation` is the client carrying on past a closed window. The
 * transcript renders those three distinctly, because "watchable" means you
 * can SEE what moved without SQL.
 *
 * `foreground` and NULL claim NOTHING about a person -- rows written before
 * the split or before the column existed. They render no marker at all: an
 * unknown driver drawn as a known one is the invention this product refuses.
 */
import {
  selfCheckSentence,
  type SelfCheckEntry,
  type TrackTransition,
  type TrackVerdict,
} from "@/lib/spine/track.functions";
import { taskAsked } from "@/components/spine/handoff-said";
import type { Turn } from "@/lib/spine/activity";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { FORECAST_SAYS } from "@/components/learn/forecast-words";

/** The quiet line a leg carries, or nothing when the record cannot say. */
export function transitionLine(via: TrackTransition["drivenVia"]): string | null {
  if (via === "press") return "you pressed run here";
  if (via === "sweep") return "the run moved on its own";
  if (via === "continuation") return "it carried on by itself";
  return null;
}

/** A steer's payload carries the person's sentence under `message`. */
function steerMessage(payload: unknown): string | null {
  let v: unknown = payload;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t.startsWith("{")) return null;
    try {
      v = JSON.parse(t);
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== "object") return null;
  const m = (v as Record<string, unknown>).message;
  return typeof m === "string" && m.trim() ? m.trim() : null;
}

/** The message fields both reads return, and nothing more. */
export type HandoffRow = {
  id: string;
  kind: string;
  from_agent_slug: string | null;
  to_agent_slug: string | null;
  payload: unknown;
  created_at: string;
  consumed_by_run_id: string | null;
};

export type ActivityRow =
  | { kind: "turn"; at: number; turn: Turn; key: string }
  /**
   * A HANDOFF, WHICH IS AN EVENT AND NOT AN ANNOTATION ON A TURN.
   *
   * SESSION-1's first unit is "handoff made visible", and its shape is stated:
   * "it renders as a transcript entry with from- and to-chips". An entry, not a
   * caption. That turned out to be the only honest shape as well as the
   * specified one -- see `handoff-said.ts` for the measurement, but the short
   * version is that `agent_messages.consumed_by_run_id` names the run that took
   * each handoff, 131 of those runs exist, and NOT ONE of them carries a
   * track_id. So no turn the run screen draws has ever consumed a handoff, and
   * hanging the instruction off a turn would have rendered nothing on every
   * track in the database.
   *
   * As its own row it needs no turn at all: it has a time of its own, a sender,
   * a receiver and the instruction that travelled.
   */
  /**
   * WHAT THE PERSON SAID INTO THE RUN.
   *
   * SESSION-1's third unit is "steer without restarting" and SPEC-AGENT-COMMS
   * says the person is "a participant, not an audience". Both were half true:
   * the steer lands, an agent consumes it, and the work changes. Nothing ever
   * showed it back. `agent_messages` has two INSERTs for track-scoped messages
   * in `track.functions.ts` and no SELECT anywhere, so after a reload there was
   * no evidence on any screen that the instruction existed.
   *
   * A participant whose messages vanish is an audience. This is the row that
   * makes them a participant.
   */
  | {
      kind: "said";
      at: number;
      key: string;
      /** The person's own words, never composed. */
      message: string;
      /** True once an agent has taken it. A fact from `consumed_by_run_id`. */
      pickedUp: boolean;
    }
  | {
      kind: "handoff";
      at: number;
      key: string;
      from: string | null;
      to: string | null;
      /** The sender's own words. Never composed; see `taskAsked`. */
      task: string;
      /** True when no run has picked it up, which the row says out loud. */
      waiting: boolean;
    }
  /**
   * A STATION CHECKING ITS OWN WORK, WHICH RAN EVERY DRIVE AND SAID NOTHING.
   *
   * `verifyStationOutput` runs at the end of every drive of every station, and
   * its result reached the record through one path: `spine_tracks.last_hold_because`,
   * written ONLY on a failure and overwritten by the next drive. So the check
   * that happens almost every time was invisible almost every time.
   *
   * Its own row rather than a caption on a turn, for the same reason the handoff
   * above is: it belongs to the DRIVE, not to a seat. A drive is often several
   * seats and sometimes none, so hanging it off a turn would attach it to
   * whichever one happened to run last -- and on a drive whose crew was skipped
   * there would be no turn to hang it on at all.
   */
  /**
   * THE BET BEING SETTLED, WHICH IS THE LOOP CLOSING.
   *
   * The Learn tab shows the verdict as a PROPERTY of the bet, and is right to.
   * The transcript answers the other question -- what happened to this work, in
   * order -- and a bet being settled is the most consequential thing that ever
   * happens to a track. Without a row here a person could scroll a run's whole
   * record and never meet the answer it exists to produce.
   *
   * Carries the claim, because a verdict without the thing it judged is not
   * readable: "you called it", alone in a stream of events, says nothing about
   * what was called.
   */
  | {
      kind: "verdict";
      at: number;
      key: string;
      /** The product's own word for this resolution, never the raw column. */
      says: string;
      /** What was predicted. */
      claim: string | null;
      /** Why it went that way, when whoever graded it said. */
      rationale: string | null;
      /** How the chip is toned: a hit passes, a miss fails, neither holds. */
      tone: "pass" | "fail" | "hold";
      /** The agent that graded it, or null when a person did. */
      by: string | null;
    }
  | {
      kind: "check";
      at: number;
      key: string;
      stationName: string;
      /** "Checked its own work: 2 held, 1 did not", composed by the server. */
      line: string;
      /** What it compared, in the check's own words. */
      what: string[];
      /** Why the ones that did not hold did not. Empty when they all held. */
      why: string[];
      /** True when this drive ran because the check had refused last time. */
      retried: boolean;
    }
  | {
      kind: "move";
      at: number;
      key: string;
      to: string;
      toName: string;
      /**
       * Who caused this leg, or null when saying so would distinguish nothing.
       *
       * See `mergeActivityRows` for the rule. Null is not "we do not know" --
       * a leg with no provable driver never becomes a row at all -- it is
       * "the summary above this transcript has already said it about every
       * leg below it".
       */
      line: string | null;
      from: string | null;
    };

/**
 * One chronological stream of turns and station moves, newest first -- the
 * order the transcript draws, so a marker sits between the rows it belongs
 * between rather than in a second list a reader must correlate by hand.
 * Timestamp ties keep turns ahead of moves: a seat that landed as the station
 * flipped reads as part of the new station, which is what happened.
 */
export function mergeActivityRows(
  turns: Turn[],
  transitions: TrackTransition[],
  handoffs: readonly HandoffRow[] = [],
  /** One per drive whose check compared something. See the `check` row above. */
  checks: readonly SelfCheckEntry[] = [],
  /** The moment this track's bet was settled, when anything has settled it. */
  verdict: TrackVerdict | null = null,
): ActivityRow[] {
  const rows: ActivityRow[] = [];
  for (const t of turns) {
    rows.push({ kind: "turn", at: Date.parse(t.at), turn: t, key: `turn:${t.runId}` });
  }
  const legs = transitions
    .map((tr) => ({ tr, line: transitionLine(tr.drivenVia) }))
    // A leg with no provable driver is dropped entirely rather than drawn
    // vague: an unknown driver rendered as a known one is the invention this
    // product refuses.
    .filter((l): l is { tr: TrackTransition; line: string } => l.line !== null);

  /*
   * "THE RUN MOVED ON ITS OWN" IS DROPPED WHEN EVERY LEG SAYS IT.
   *
   * `howThisRan` draws a standing summary directly above this transcript, and
   * on a route the loop moved end to end that summary reads "All 9 moves on
   * this route were made by the loop on its own." Every move row underneath it
   * then repeated "the run moved on its own", nine times, under a sentence
   * that had just counted them. A caption identical on every row separates no
   * row from any other; it is only a fact about the run, and the summary is
   * where a fact about the run belongs.
   *
   * COMPUTED OVER THE RENDERED SET, not per row. The moment one leg is a press
   * or a continuation, "on its own" is telling the reader which legs were not
   * the person -- that is the whole job of the caption -- so it comes straight
   * back for all of them.
   *
   * ONLY THE SWEEP LINE, AND THAT ASYMMETRY IS DELIBERATE. "you pressed run
   * here" is a person reaching into the work, which R-18 makes the one fact
   * this transcript may never quietly drop, and "it carried on by itself" marks
   * a leg the client took past a closed window. Both are exceptions worth
   * naming even when they are the only thing on the route. The loop moving the
   * work is the ordinary case here and the one that goes quiet.
   */
  const everyLegWasTheLoop = legs.length > 0 && legs.every((l) => l.tr.drivenVia === "sweep");

  for (const { tr, line } of legs) {
    // Display names come from the ONE map, never the raw slug -- same rule as
    // every station word on this surface.
    rows.push({
      kind: "move",
      at: Date.parse(tr.at),
      key: `move:${tr.at}:${tr.to}`,
      to: tr.to,
      toName: AGENT_STATIONS[tr.to as keyof typeof AGENT_STATIONS]?.name ?? tr.to,
      from: tr.from,
      line: everyLegWasTheLoop ? null : line,
    });
  }
  for (const h of handoffs) {
    if (h.kind === "steer") {
      const message = steerMessage(h.payload);
      // Nothing written means nothing to show. A "you said something" row with
      // no words is the caption problem again.
      if (!message) continue;
      rows.push({
        kind: "said",
        at: Date.parse(h.created_at),
        key: `said:${h.id}`,
        message,
        pickedUp: h.consumed_by_run_id !== null,
      });
      continue;
    }
    const task = taskAsked(h.payload);
    // No instruction written means there is nothing to show a person. The row
    // is dropped rather than drawn empty: a handoff entry that says only that a
    // handoff happened is the caption this was built to replace.
    if (!task) continue;
    rows.push({
      kind: "handoff",
      at: Date.parse(h.created_at),
      key: `handoff:${h.id}`,
      from: h.from_agent_slug,
      to: h.to_agent_slug,
      task,
      waiting: h.consumed_by_run_id === null,
    });
  }
  if (verdict) {
    const at = Date.parse(verdict.at);
    const says = FORECAST_SAYS[verdict.resolution as keyof typeof FORECAST_SAYS];
    /*
     * Both are required and neither is defensive padding. A verdict with no
     * readable time cannot be placed in a chronological stream, and one whose
     * resolution this build does not recognise would print a raw column value at
     * a person -- `forecast_resolution` is text, not an enum.
     */
    if (!Number.isNaN(at) && says) {
      rows.push({
        kind: "verdict",
        at,
        key: `verdict:${verdict.at}`,
        says,
        claim: verdict.claim,
        rationale: verdict.rationale,
        tone:
          verdict.resolution === "hit" ? "pass" : verdict.resolution === "miss" ? "fail" : "hold",
        by: verdict.by,
      });
    }
  }

  for (const c of checks) {
    const at = Date.parse(c.at);
    // A check with no time cannot be placed in a chronological stream, and a row
    // in the wrong place is worse than one absent: it would claim the station
    // checked itself at a moment it did not.
    if (Number.isNaN(at)) continue;
    rows.push({
      kind: "check",
      at,
      key: `check:${c.at}:${c.station}`,
      stationName: AGENT_STATIONS[c.station as keyof typeof AGENT_STATIONS]?.name ?? c.station,
      line: selfCheckSentence(c),
      what: c.what,
      why: c.why,
      retried: c.retried,
    });
  }
  return rows.sort((a, b) => b.at - a.at);
}
