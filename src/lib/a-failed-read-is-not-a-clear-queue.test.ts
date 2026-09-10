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
import { QUEUE_UNREAD_LINE, queueCouldNotBeRead } from "@/components/approvals/not-the-whole-queue";

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

/**
 * ONE SPELLING OF ONE CAVEAT. `/inbox` and the inbox already share their
 * "not the whole queue" wording through one module, for the reason its header
 * gives: two spellings is how a person gets two answers about the same queue.
 * A read that failed outright is the sibling case that header names, so it
 * lives there too rather than being invented again in the briefing.
 */
describe("the caveat has one spelling", () => {
  it("the briefing says the module's sentence, not its own", () => {
    const said = composeBriefing({
      events: [],
      inFlightRuns: 0,
      gateCountByStage: {},
      queueUnread: true,
    });
    expect(said.paragraphs[0]).toContain(QUEUE_UNREAD_LINE);
  });

  it("and a surface asks the module rather than deciding what a zero means", () => {
    expect(queueCouldNotBeRead(true)).toBe(QUEUE_UNREAD_LINE);
    expect(queueCouldNotBeRead(false)).toBeNull();
    expect(queueCouldNotBeRead(null)).toBeNull();
    expect(queueCouldNotBeRead(undefined)).toBeNull();
  });

  it("it is a sentence and never a number, so no count is drawn differently", () => {
    expect(QUEUE_UNREAD_LINE).not.toMatch(/\d/);
    expect(QUEUE_UNREAD_LINE).toMatch(/could not be read/);
  });
});

/**
 * ONE LINE ALONG FROM THE QUEUE, AND THE SAME DEFECT. "Agents are idle" is a
 * claim about the in-flight runs read, which is a head query: it answers
 * `count: null` when it fails, and `?? 0` stated that as idleness. Found by
 * looking for the shape Lane 1 found on the entry an hour earlier, where an
 * unconditional clause said a decision had been re-scored when nothing had.
 */
describe("idle is a reading, not a default", () => {
  it("does not call the agents idle when the runs count could not be read", () => {
    const said = composeBriefing({
      events: [],
      inFlightRuns: 0,
      gateCountByStage: {},
      runsUnread: true,
    });
    expect(said.paragraphs[0]).toContain("could not be read");
    expect(said.paragraphs[0]).not.toContain("Agents are idle");
    // And it still says what it does know about the queue.
    expect(said.paragraphs[0]).toContain("Nothing waits on you.");
  });

  it("says both when neither read answered, and invents neither", () => {
    const said = composeBriefing({
      events: [],
      inFlightRuns: 0,
      gateCountByStage: {},
      runsUnread: true,
      queueUnread: true,
    });
    expect(said.paragraphs[0]).toContain("Whether anything is running could not be read.");
    expect(said.paragraphs[0]).toContain(QUEUE_UNREAD_LINE);
    expect(said.paragraphs[0]).not.toContain("idle");
    expect(said.paragraphs[0]).not.toContain("Nothing waits on you.");
  });

  it("and calls them idle when the read said zero", () => {
    const said = composeBriefing({ events: [], inFlightRuns: 0, gateCountByStage: {} });
    expect(said.paragraphs[0]).toBe("Agents are idle. Nothing waits on you.");
  });

  it("the caller marks the flag off the query's own answer, not off a zero", () => {
    const src = readFileSync("src/lib/briefing.functions.ts", "utf8");
    expect(src).toContain("runsUnread: runsRes.error != null || runsRes.count == null");
  });
});
