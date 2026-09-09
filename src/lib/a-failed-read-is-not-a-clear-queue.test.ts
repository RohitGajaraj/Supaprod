/**
 * ── A FAILED READ IS NOT A CLEAR QUEUE ───────────────────────────────────────
 *
 * The server twin of a defect Lane 1 found on the entry the same morning: a
 * sentence standing on a read that had not answered. Both the briefing and the
 * loop state read the approvals queue inside a Promise.all and caught its
 * throw into an empty list. An empty list is indistinguishable from a clear
 * queue, so the briefing composed "Nothing waits on you" and every gate count
 * on the strip reported zero, on a read neither of them had got.
 *
 * The queue itself already had the right shape for a DEGRADED family (its
 * `incomplete` field); what neither caller had was a word for the read failing
 * outright. They have one now, and the briefing says it in the sentence rather
 * than claiming quiet.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { composeBriefing } from "./briefing.functions";

const BRIEFING = readFileSync("src/lib/briefing.functions.ts", "utf8");
const LOOP = readFileSync("src/lib/loop-state.functions.ts", "utf8");

describe("a failed read is not a clear queue", () => {
  it("the briefing says it could not see, rather than that nothing waits", () => {
    const said = composeBriefing({
      events: [],
      inFlightRuns: 0,
      gateCountByStage: {},
      queueUnread: true,
    });
    expect(said.paragraphs).toHaveLength(1);
    expect(said.paragraphs[0]).toContain("could not be read");
    expect(said.paragraphs[0]).not.toContain("Nothing waits on you");
  });

  it("and still says the quiet sentence when the queue really was read", () => {
    const said = composeBriefing({ events: [], inFlightRuns: 0, gateCountByStage: {} });
    expect(said.paragraphs[0]).toBe("Agents are idle. Nothing waits on you.");
  });

  it("both callers report the failure instead of swallowing it", () => {
    for (const src of [BRIEFING, LOOP]) {
      expect(src).toContain("unread: true as const");
      expect(src).toContain("could not be read");
      // The old shape, a bare catch to an empty list, is gone.
      expect(src).not.toMatch(/catch\(\(\) => \(\{\s*items: \[\]/);
    }
  });

  it("the loop state hands the flag on, so a strip cannot read zero as none", () => {
    expect(LOOP).toContain("queueUnread?: boolean;");
    expect(LOOP).toContain("return { stages, queueUnread:");
  });
});
