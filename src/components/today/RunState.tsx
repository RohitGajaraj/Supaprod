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

/**
 * A run's state, in a reader's words.
 *
 * Takes the raw value straight off the row, so no caller ever has to remember
 * which enum values exist. Every surface that shows one of these passes the
 * same string and gets the same four answers.
 */
export function RunState({ status }: { status: string | null | undefined }) {
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
