import { taskStatus, type TaskStatus } from "@/components/meridian/TaskRows";

/*
 * WHAT A RUN IS CALLED ON THE FRONT DOOR.
 *
 * ── THE DEFECT THIS CLOSES ──────────────────────────────────────────────
 * Today's Stuck lane printed the database's own value into the row. A reader
 * was shown `halted`, or `cancelled`, or `blocked`, and left to work out what
 * each one meant and whether any of them was theirs to fix. Three enum values,
 * one fact, and none of the three words is a word anyone says out loud.
 *
 * The mapping is NOT written here. `taskStatus` in the Meridian Task Rows
 * component already owns it, including the part that matters most: an
 * unrecognised value resolves to "a person is required" rather than to "a
 * machine is working", because claiming an agent is on something nobody
 * recognises is the one reading that can be false in a way that costs someone
 * their morning. This file is the WORD and the COLOUR for the four states that
 * mapping returns, and nothing else.
 *
 * ── WHY A WORD AND NOT A CHIP ───────────────────────────────────────────
 * These rows are two lines and scanned down a lane, and the state sits in the
 * row's metadata line beside a handoff count and an elapsed time. A pill there
 * is a second object competing with the row's own subject for the eye, on the
 * surface whose entire job is deciding what NOT to show. The lane already draws
 * the state twice over, in the lane's name and in the agent's mark, so the word
 * only has to be legible, not loud.
 *
 * ── THE COLOUR CARRIES ONE MEANING EACH, AND THERE IS NO FIFTH ──────────
 * Orchid says a person is required. Azure says a machine is working. Green and
 * red are outcome and never need. `partial` gets no hue at all: a run that
 * shipped with a hole in it is not a fifth outcome and there is no colour for
 * one, so it takes the brightest ink and medium weight instead. That is the
 * whole rule for a state that feels like it wants a warning colour: it wants
 * structure, and weight is structure.
 *
 * The words are lowercase because they sit inside a row's metadata line rather
 * than standing alone as a status. The vocabulary is Task Rows'; only the case
 * belongs to this row.
 */

const WORD: Record<TaskStatus, string> = {
  running: "running",
  done: "done",
  failed: "failed",
  blocked: "waiting on you",
};

const TONE: Record<TaskStatus, string> = {
  running: "text-mrd-agent",
  done: "text-mrd-pass",
  failed: "text-mrd-fail",
  blocked: "text-mrd-you",
};

/*
 * ── THE TWO STATES `taskStatus` CANNOT ANSWER FOR, AND WHY THEY ARE HERE ──
 * `taskStatus` resolves anything it does not recognise to "blocked", which is
 * the right default for an unknown value and the wrong answer for these two.
 * Today's Stuck lane feeds it `missions.status`, whose STUCK set is exactly
 * `failed · halted · cancelled · blocked`. Two of those four are not in
 * `taskStatus`'s cases, so both were arriving here as "waiting on you", in
 * ORCHID, the hue this system reserves for A PERSON IS REQUIRED.
 *
 * Both are terminal. `cancelMission` withdraws that mission's approvals as it
 * closes, so the product had stopped asking and the row went on saying it was
 * asking. A run somebody cancelled yesterday sat in the accent all night,
 * claiming the morning of whoever read it first.
 *
 * It was also a straight contradiction inside one product: `run-state.ts` puts
 * `halted` and `cancelled` in STOPPED and the Runs grid renders them "Stopped",
 * so the row's own click destination disagreed with the row. That file's header
 * names this as the failure that "destroys trust in both at once".
 *
 * ── WHY TWO WORDS RATHER THAN ONE, AND WHY NEITHER GETS A HUE ────────────
 * They are different facts and the lane's whole job is why work stopped:
 * `cancelled` is a person deciding to stop, `halted` is the engine stopping.
 * Runs groups them because a grid sorts by state; a lane that explains itself
 * should not.
 *
 * Neither takes a colour. There is no hue for "deliberately stopped": it is not
 * an outcome, so it is not green or red, and it needs nobody, so it is not
 * orchid. This is the same ruling `partial` gets nine lines up, and the same
 * answer: a state that feels like it wants a warning colour wants structure
 * instead. Reaching for amber here is how the banned colour gets back in.
 */
const STOPPED: Record<string, string> = {
  cancelled: "cancelled",
  canceled: "cancelled",
  halted: "stopped",
};

/**
 * A run's state, in a reader's words.
 *
 * Takes the raw value straight off the row, so no caller ever has to remember
 * which enum values exist. Every surface that shows one of these passes the
 * same string and gets the same answers.
 */
export function RunState({ status }: { status: string | null | undefined }) {
  const stopped = STOPPED[(status ?? "").toLowerCase()];
  if (stopped) return <span className="text-mrd-mute">{stopped}</span>;

  const state = taskStatus(status);
  return <span className={TONE[state]}>{WORD[state]}</span>;
}

/**
 * The shipped lane's own word, which `taskStatus` deliberately cannot supply.
 *
 * `completed_with_failures` IS a live run: it went out, and the hole in it is a
 * fact about the thing that shipped rather than a different lane. `taskStatus`
 * does not know the value and resolves it to "a person is required", which is
 * the correct default for a state nobody recognises and the wrong answer for
 * this one, because the lane above it already knows the run went live. So the
 * shipped lane keeps its own two words and never asks.
 */
export function ShippedState({ partial }: { partial: boolean }) {
  if (partial) return <span className="font-medium text-mrd-ink">partial</span>;
  return <span className="text-mrd-pass">done</span>;
}
