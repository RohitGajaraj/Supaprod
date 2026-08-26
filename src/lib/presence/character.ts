/**
 * ONE CHARACTER FRONTS THE CREW.
 *
 * The founder's direction, 2026-08-25: the product does not FEEL agentic while
 * the work is visible only as transcript rows. The user meets a single named
 * worker; the fifteen seat slugs are its hands. This module is the whole of
 * that character's truth: its name, its states, and the sentence it says —
 * derived, never staged.
 *
 * THE IRON LAW (SPEC-PRESENCE.md): every state comes from a row or result the
 * run actually produced. This repo has already failed a branch for a timer
 * advancing step labels — theatre by our own definition — so a state the input
 * cannot prove is a state this module will not return. If the reads are dead we
 * say we are out of touch; we never smile on a dead feed, because three
 * surfaces reporting healthy-while-dead is how a month of failure went
 * unnoticed (ledger F-38/F-39).
 *
 * Client-safe on purpose: the component consumes this directly, and the only
 * imports are types and the client-safe tool catalogue.
 */

import type { DriveNowResult } from "@/lib/spine/track.functions";
import type { HoldReason } from "@/lib/spine/driver";

/**
 * The working name. A PLACEHOLDER the founder replaces in this one line;
 * nothing else anywhere may spell it, so the rename is one edit. Outward use
 * (site, pitch) waits on his approval either way.
 */
export const CHARACTER_NAME = "Supa";

export type CharacterState =
  /** The reads failed. Said plainly, never papered over. */
  | "out-of-touch"
  /** Present, nothing in flight, ready to be put to work. */
  | "awake"
  /** A run is in flight and no tool call has surfaced yet. */
  | "thinking"
  /** A tool call is the newest fact; the verb line names it. */
  | "working"
  /** The run put a question in front of the person. */
  | "asking"
  /** A tool refused — the door is locked, not the work's fault (R-26). */
  | "blocked"
  /** Between self-continuing legs of a watched walk. */
  | "resting"
  /** The route finished. */
  | "done";

export interface Presence {
  state: CharacterState;
  /** First person, plain register, one sentence. What the person reads. */
  line: string;
}

/**
 * Everything the character may know. Every field maps to something the run
 * wrote or the surface already holds — TrackRun has all of these today, so v1
 * needs no new reads (SPEC-PRESENCE.md §Ownership).
 */
export interface PresenceInput {
  /** The track row, or null when the read returned nothing. */
  track: {
    status: string;
    holdReason: string | null;
    drivenAt: string | null;
  } | null;
  /**
   * The first read has not settled yet, so `track` being null means "not back",
   * not "not there". Optional, and absent behaves exactly as before.
   *
   * S1 → S0, 2026-08-26. Without this, `/track/:id?start=true` shows
   * `out-of-touch` — *"I can't find this piece of work"* — for the whole of the
   * first read, so **the first sentence the character says after being handed
   * work is a false alarm.** That is the honesty standard failing at the worst
   * possible moment, on the surface the whole product is judged by in sixty
   * seconds. S1 patched around it by not mounting the character until the read
   * settled; this is the fix underneath, so every future mount inherits it.
   */
  loading?: boolean;
  /** The newest walk result, if a walk has run this visit. */
  result: Pick<DriveNowResult, "stopped" | "more"> | null;
  /** A leg is in flight right now (`run.isPending`). */
  walking: boolean;
  /** Auto-legs are still firing (item 34's continue). */
  continuing: boolean;
  /** The newest tool slug, when the caller has one. Optional by design. */
  currentTool?: string | null;
  /** The reads themselves errored. Distinct from "no rows". */
  feedDead?: boolean;
}

/**
 * Curated first-person verbs for the tools a walk actually spends. Keys are
 * TOOL slugs so a renamed tool breaks the test, not the surface silently — the
 * lesson of the renamed-export defect. Tools not named here fall back to a
 * line that STATES THE REAL SLUG, which keeps the fallback honest.
 */
export const VERB_BY_TOOL: Record<string, string> = {
  "workspace.search": "searching what the workspace holds",
  "signals.list": "reading the signals",
  "signals.log": "filing the evidence I found",
  "research.synthesize": "pulling the findings together",
  "cluster.trigger": "grouping the evidence",
  "critic.evaluate": "checking the work against the evidence",
  "decision.record": "recording the decision and its forecast",
  "prd.draft": "writing the spec",
  "prd.revise": "revising the spec",
  "design.draft": "drafting the design",
  "mission.plan": "planning the build",
  "mission.dispatch": "handing the build to my hands-on seat",
  "repo.read": "reading the repository",
  "repo.tree": "reading the repository",
  "repo.search": "searching the repository",
  "studio.stage": "staging the change",
  "studio.commit": "committing the change",
  "studio.pr.open": "opening the pull request",
  "studio.checks.run": "running the checks",
  "studio.review": "reviewing the change against the spec",
  "studio.pr.merge": "merging the pull request",
  "release.publish": "publishing the release",
  "learning.record": "recording what we learned",
  "web.search": "reading outside sources",
  "web.fetch": "reading outside sources",
  "web.crawl": "reading outside sources",
  "memory.reflect": "noting a lesson for next time",
};

/**
 * The filing chain every station depends on. The test asserts each of these
 * carries a CURATED verb — the walk's own vocabulary may never fall back to a
 * raw slug, because those are the moments a person is most likely watching.
 */
export const MUST_HAVE_VERBS: readonly string[] = [
  "signals.log",
  "decision.record",
  "prd.draft",
  "design.draft",
  "studio.stage",
  "studio.commit",
  "studio.pr.open",
  "studio.checks.run",
  "studio.pr.merge",
  "release.publish",
  "learning.record",
];

/** The honest fallback: names the real tool, invents nothing. */
export function verbForTool(tool: string): string {
  return VERB_BY_TOOL[tool] ?? `running ${tool}`;
}

/**
 * Holds where the next move belongs to a person, so the character turns to
 * face them rather than claiming to be at work. `waiting-on-a-person` is the
 * designed ask; the rest are stops a person can clear from outside
 * (an account topped up, evidence connected, a spec written).
 */
const ASKING_HOLD: HoldReason = "waiting-on-a-person";
const BLOCKED_HOLD: HoldReason = "tools-refused";
const DONE_HOLD: HoldReason = "done";

/**
 * Derive the character from what the run proved. Order IS the contract:
 * a dead feed beats everything (never smile on one); a question beats motion
 * (a person being needed outranks our busyness); the rest follow the walk.
 */
export function deriveCharacter(input: PresenceInput): Presence {
  if (input.feedDead) {
    return {
      state: "out-of-touch",
      line: "I've lost sight of the run. The reads are failing. The work itself may be fine.",
    };
  }

  /*
   * NOT BACK YET IS NOT NOT THERE, and the order matters as much as the line.
   *
   * Below `feedDead`, because a dead feed still beats everything and a loading
   * flag must never talk over one. Above `!input.track`, because that branch
   * reads a null row as an absent one — true after the read settles, a false
   * alarm before it.
   */
  if (input.loading && !input.track) {
    /*
     * `awake` — "present, nothing in flight" — and NOT `working` or `thinking`.
     * Both of those claim a run is under way, which is precisely what has not
     * been read yet; a state the data cannot prove is a state you do not draw.
     * `awake` claims only presence, and the line says the one thing that is
     * certainly true.
     */
    return {
      state: "awake",
      line: "Reading this piece of work now.",
    };
  }

  if (!input.track) {
    return {
      state: "out-of-touch",
      line: "I can't find this piece of work. If the address is right, the read has failed.",
    };
  }

  const hold = input.track.holdReason as HoldReason | null;

  // A question outranks everything the character could be doing. Auto-continue
  // already refuses to walk past a hold (item 34's guard); the character must
  // not talk past one either.
  if (hold === ASKING_HOLD) {
    return {
      state: "asking",
      line: "I need you for this one. The question is on the card below.",
    };
  }

  if (hold === BLOCKED_HOLD) {
    return {
      state: "blocked",
      line: "A door I need is locked. Reconnect it and start me again. Redoing the work would not open it.",
    };
  }

  if (input.walking) {
    if (input.currentTool) {
      return { state: "working", line: `I'm ${verbForTool(input.currentTool)}.` };
    }
    return { state: "thinking", line: "I'm on it, you can leave this page and I'll keep going." };
  }

  if (input.result?.stopped === "finished" || hold === DONE_HOLD) {
    return {
      state: "done",
      line: "Done. What I believed and what actually happened are side by side on the right.",
    };
  }

  // Between legs of a self-continuing walk: the window closed, the next leg is
  // coming without a click. Breath, not spinner — and only while that is TRUE.
  if (input.continuing && input.result?.stopped === "out-of-window" && input.result.more) {
    return { state: "resting", line: "Taking the next step…" };
  }

  // Any other hold: stopped for a reason the hold line already states. The
  // character defers to it rather than restating it in different words —
  // two sentences disagreeing about one stop is how surfaces drift.
  if (hold) {
    return {
      state: "awake",
      line: "I've stopped. The reason is on the hold line, and I'll carry on when it clears.",
    };
  }

  if (input.track.drivenAt === null) {
    return {
      state: "awake",
      line: "I'm ready, press run and I'll walk this from the top.",
    };
  }

  return { state: "awake", line: "Ready when you are." };
}
