import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE HANDOFF MUST BE DRAWN IN THE LANES THAT HAVE ONE.
 *
 * ── THE DEFECT THIS PINS SHUT ──────────────────────────────────────────────
 * The brief calls the handoff "the event worth drawing" and records that the
 * founder asked for it twice. `HandoverNote` was built for it, mounted, and
 * wired under RUNNING rows only. Measured against the live database
 * 2026-08-27:
 *
 *     26 handoffs, across 10 missions
 *        7  finished                 -> the Finished lane
 *        3  blocked                  -> the Waiting-on-you lane
 *        0  running                  -> the ONLY lane it was drawn in
 *
 * The Running lane's own note, in the same file, already recorded that
 * `agent_runs` holds zero rows in any in-flight status and called that "the
 * state the board is in today, not an edge case". Both facts were written down,
 * in one file, and nobody had put them together — so the one event the brief
 * calls worth drawing had never appeared on a screen.
 *
 * ── WHY A COUNT AND NOT A LANE NAME ────────────────────────────────────────
 * Asserting "it is in FEED_REPLY" would pin a lane rather than the property,
 * and this repo has now watched `today-states-its-wait.test.ts` learn that
 * lesson four times. The property is that the handoff is not confined to ONE
 * lane, because a single lane can be — and was — the empty one.
 *
 * The cost is stated: this reads source, so it asserts the component is
 * MOUNTED in more than one lane, not that a line renders. What renders was
 * verified separately, on the running board, with real content:
 * "Handed over by Chief of Staff 8h ago: ..." — one visible before expanding
 * the lane, three after.
 */

// Subject moved 2026-08-31: the board was lifted out of the route file into
// `src/components/today/Board.tsx`. The CLAIM is unchanged.
const SRC = readFileSync("src/components/today/Board.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("the handoff is drawn where the work is", () => {
  it("is mounted in MORE THAN ONE lane, so one empty lane cannot hide it", () => {
    const mounts = SRC.match(/<HandoverNote\b/g) ?? [];
    expect(
      mounts.length,
      "HandoverNote is back in a single lane; when that lane is empty the handoff disappears entirely, which is the state it shipped in for weeks",
    ).toBeGreaterThan(1);
  });

  it("reaches the lane where a person DECIDES, which is the one that needs it most", () => {
    // Deciding without seeing what was handed to you is answering a question
    // with the evidence off-screen. The waiting lane's rows carry `row.note`,
    // so that block is the anchor: it is where a row's own extra content goes.
    const noteBlock = SRC.indexOf("row.note ?");
    expect(noteBlock, "the waiting lane no longer renders row.note; re-point this").toBeGreaterThan(
      -1,
    );
    const after = SRC.slice(noteBlock, noteBlock + 1200);
    expect(after, "the handoff is no longer drawn beside the waiting lane's rows").toContain(
      "<HandoverNote",
    );
  });
});
