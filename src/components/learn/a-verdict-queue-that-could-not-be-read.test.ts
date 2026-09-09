/**
 * ── A FAILED READ MUST NOT SAY NOTHING HAS SHIPPED ───────────────────────────
 *
 * Found by the missing-states sweep, 2026-09-10, and it is the sharpest of the
 * three the sweep turned up because the sentence is a positive claim rather
 * than an absence.
 *
 * `SettlePanel` reads what is waiting for a verdict as `?? []` with no failure
 * branch, and its `Quiet` turns an empty list into **"Nothing has shipped that
 * needs a verdict."** So a read that never answered rendered a statement about
 * the workspace, in words, on the station whose whole job is that bets get
 * settled. A bet waiting on a person would be invisible and the surface would
 * say there was none.
 *
 * `DecisionDetail` has the same shape one degree quieter: the earlier verdicts
 * on a call render `trail.length > 0 ? ... : null`, so a failed read removes
 * the section, which on a decision's own record reads as "there were none".
 *
 * Guarded as source because both wrong behaviours are an ABSENCE or a sentence
 * chosen inside a ternary: there is no component boundary to render and assert
 * on without standing up the whole panel and its workspace.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SETTLE = readFileSync("src/components/learn/SettlePanel.tsx", "utf8");
const DECISION = readFileSync("src/components/knowledge/DecisionDetail.tsx", "utf8");

describe("the verdict queue does not claim an all-clear it did not read", () => {
  it("asks whether the read failed before it says anything about what is waiting", () => {
    expect(SETTLE).toContain("const awaitingUnread = awaitingQ.isError;");
    const quiet = SETTLE.indexOf("<Quiet");
    expect(quiet).toBeGreaterThan(-1);
    const block = SETTLE.slice(quiet, SETTLE.indexOf("/>", quiet));
    // The unread branch comes FIRST, so neither all-clear can be reached by a
    // read that never answered.
    expect(block.indexOf("awaitingUnread")).toBeLessThan(
      block.indexOf("Nothing has shipped that needs a verdict."),
    );
  });

  it("says what could not be read, and that it is not an empty answer", () => {
    expect(SETTLE).toContain("What is waiting for a verdict could not be read.");
    expect(SETTLE).toContain("The read failed; it did not come back empty.");
  });

  /*
   * THE MIRROR (law 12). "It has an unread branch" passes just as happily if
   * that branch were always taken, which would put "could not be read" over a
   * workspace that has genuinely settled everything. All three real sentences
   * must survive.
   */
  it("keeps every sentence it had, so a read that answered still speaks plainly", () => {
    for (const said of [
      "Nothing needs your verdict yet.",
      "Nothing needs your verdict.",
      "Nothing has shipped that needs a verdict.",
    ]) {
      expect(SETTLE).toContain(said);
    }
  });
});

describe("a decision's earlier verdicts do not vanish when they cannot be read", () => {
  it("says so instead of removing the section", () => {
    expect(DECISION).toContain("const trailUnread = history.isError;");
    expect(DECISION).toContain("Earlier verdicts on this call could not be read.");
  });

  it("keeps the honest-empty exit, so a call with no earlier verdicts shows none", () => {
    // The mirror again: the section is still absent when the read answered and
    // found nothing, which is a true silence and the common case.
    expect(DECISION).toContain("{trail.length > 0 ? (");
  });
});
