import { expect, test, describe } from "bun:test";
import {
  composeBriefing,
  receiptText,
  type BriefingEvent,
  type BriefingInput,
} from "./briefing.functions";

const NOW = new Date("2026-07-19T12:00:00.000Z");

function compose(overrides: Partial<BriefingInput>) {
  return composeBriefing({
    events: [],
    inFlightRuns: 0,
    gateCountByStage: {},
    now: NOW,
    zone: "UTC",
    ...overrides,
  });
}

const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);

const specApproved = (at: string, actor: string | null = "planner"): BriefingEvent => ({
  entity_type: "spec",
  entity_id: "prd-1",
  to_stage: "approved",
  actor,
  at,
});
const buildDone = (at: string, actor: string | null = "builder"): BriefingEvent => ({
  entity_type: "mission",
  entity_id: "m-1",
  to_stage: "done",
  actor,
  at,
});
const shipped = (at: string, actor: string | null = "builder"): BriefingEvent => ({
  entity_type: "mission",
  entity_id: "m-2",
  to_stage: "shipped",
  actor,
  at,
});

/** Every string the user reads, flattened. */
function allText(b: ReturnType<typeof composeBriefing>): string {
  return [b.dayLabel, ...b.paragraphs, ...b.receipts.map((r) => r.text)].join(" ");
}

describe("composeBriefing: empty workspace", () => {
  test("honest zero state, never empty", () => {
    const b = compose({});
    expect(b.paragraphs).toEqual(["Agents are idle. Nothing waits on you."]);
    expect(b.receipts).toEqual([]);
    expect(b.needsYouCount).toBe(0);
  });

  test("day label reads like a calendar day", () => {
    const b = compose({});
    // Weekday, month, day - no year, no time (exact day depends on the
    // machine's timezone, so the shape is asserted, not the weekday).
    expect(b.dayLabel).toMatch(/^[A-Z][a-z]+, July 1[89]$/);
  });
});

describe("composeBriefing: busy workspace", () => {
  const busy = () =>
    compose({
      events: [
        specApproved(hoursAgo(2)),
        buildDone(hoursAgo(1)),
        shipped(minutesAgo(20)),
        // Activity that is NOT a completion must not count as finished work.
        {
          entity_type: "spec",
          entity_id: "prd-2",
          to_stage: "draft",
          actor: "planner",
          at: hoursAgo(3),
        },
      ],
      inFlightRuns: 2,
      gateCountByStage: { decide: 2, build: 1 },
    });

  test("paragraphs cover finished, in flight, and the waiting count", () => {
    const b = busy();
    expect(b.paragraphs).toEqual([
      "Agents finished 3 pieces of work in the last 24 hours across Plan, Build, and Ship.",
      "2 agent runs are in flight now.",
      "3 calls wait on you: 2 at Decide, 1 at Build.",
    ]);
    expect(b.needsYouCount).toBe(3);
  });

  test("receipts are past tense with honest relative time, newest first", () => {
    const b = busy();
    expect(b.receipts.map((r) => r.text)).toEqual([
      "Shipped 20 minutes ago",
      "Build finished 1 hour ago",
      "Spec approved 2 hours ago",
    ]);
    expect(b.receipts.map((r) => r.stage)).toEqual(["ship", "build", "plan"]);
    expect(b.receipts[0].actor).toBe("builder");
  });

  test("no em dashes, no AI-tell unicode, anywhere", () => {
    expect(allText(busy())).not.toMatch(/[\u2013\u2014\u2018\u2019\u201c\u201d\u00a0\u202f]/);
  });

  test("cost-quiet: no cost figures in prose or receipts", () => {
    expect(allText(busy())).not.toMatch(/\$|usd|credit|cost|spend/i);
  });

  test("singular forms read correctly", () => {
    const b = compose({
      events: [buildDone(hoursAgo(1))],
      inFlightRuns: 1,
      gateCountByStage: { plan: 1 },
    });
    expect(b.paragraphs).toEqual([
      "Agents finished 1 piece of work in the last 24 hours at Build.",
      "1 agent run is in flight now.",
      "1 call waits on you: 1 at Plan.",
    ]);
  });

  test("human-authored completions are credited to the human, not the agents", () => {
    const b = compose({
      events: [specApproved(hoursAgo(2), "human"), buildDone(hoursAgo(1), "builder")],
    });
    expect(b.paragraphs[0]).toBe(
      "Agents finished 1 piece of work in the last 24 hours at Build. You moved 1 item forward yourself.",
    );
  });

  test("only human moves: agents claim nothing", () => {
    const b = compose({ events: [specApproved(hoursAgo(2), "human")] });
    expect(b.paragraphs[0]).toBe(
      "You moved 1 item forward in the last 24 hours. Agents finished nothing on their own.",
    );
  });

  test("receipts are capped at 8", () => {
    const events = Array.from({ length: 12 }, (_, i) => buildDone(minutesAgo(i + 1)));
    const b = compose({ events });
    expect(b.receipts.length).toBe(8);
  });

  test("no gates: says so plainly", () => {
    const b = compose({ events: [buildDone(hoursAgo(1))] });
    expect(b.paragraphs.at(-1)).toBe("Nothing waits on you.");
  });
});

describe("composeBriefing: gates pending on an idle workspace", () => {
  test("idle line plus the waiting count, no invented activity", () => {
    const b = compose({ gateCountByStage: { decide: 1, learn: 1 } });
    expect(b.paragraphs).toEqual([
      "Agents are idle. Nothing new finished in the last 24 hours.",
      "2 calls wait on you: 1 at Decide, 1 at Learn.",
    ]);
    expect(b.receipts).toEqual([]);
    expect(b.needsYouCount).toBe(2);
  });

  test("runs in flight but nothing finished yet", () => {
    const b = compose({ inFlightRuns: 3, gateCountByStage: { build: 1 } });
    expect(b.paragraphs).toEqual([
      "Nothing finished in the last 24 hours.",
      "3 agent runs are in flight now.",
      "1 call waits on you: 1 at Build.",
    ]);
  });
});

describe("receiptText", () => {
  test("discover distinguishes signals, themes, and opportunities", () => {
    const at = hoursAgo(1);
    const base = { entity_id: "x", to_stage: "sensed", actor: null, at };
    expect(receiptText("discover", { ...base, entity_type: "signal" }, NOW)).toBe(
      "New signals came in 1 hour ago",
    );
    expect(receiptText("discover", { ...base, entity_type: "theme" }, NOW)).toBe(
      "Signals clustered into themes 1 hour ago",
    );
    expect(receiptText("discover", { ...base, entity_type: "opportunity" }, NOW)).toBe(
      "Opportunities ranked 1 hour ago",
    );
  });
});
