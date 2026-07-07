import { expect, test, describe } from "bun:test";
import {
  mapVerdict,
  insightToWatchItem,
  groupMissionEvents,
  assembleLane4,
} from "./today-lanes.functions";

describe("mapVerdict (SW-5: the real learnings enum is validated|missed|mixed)", () => {
  test("validated → achieved", () => {
    expect(mapVerdict("validated")).toBe("achieved");
  });
  test("missed → missed", () => {
    expect(mapVerdict("missed")).toBe("missed");
  });
  test("mixed → partial", () => {
    expect(mapVerdict("mixed")).toBe("partial");
  });
  test("unknown / null defaults to partial, never crashes", () => {
    expect(mapVerdict(null)).toBe("partial");
    expect(mapVerdict(undefined)).toBe("partial");
    expect(mapVerdict("achieved")).toBe("partial"); // the MVP's wrong value maps safe
  });
});

describe("insightToWatchItem (Lane 3 foresight/calibration)", () => {
  const base = {
    id: "i1",
    kind: "prediction",
    headline: "Churn will rise",
    detail: "Signups from cohort X are dropping.",
    claim: null,
    recommended_action: { goal: "Investigate cohort X onboarding" },
    score: 0.8,
    confidence: 0.6,
    resolution: null,
  };

  test("open prediction → prediction_risk with recommendation from recommended_action.goal", () => {
    const item = insightToWatchItem(base);
    expect(item.type).toBe("prediction_risk");
    expect(item.title).toBe("Churn will rise");
    expect(item.recommendation).toBe("Investigate cohort X onboarding");
    expect(item.confidence).toBe(0.6);
  });

  test("resolution=miss → calibration_miss", () => {
    const item = insightToWatchItem({ ...base, resolution: "miss" });
    expect(item.type).toBe("calibration_miss");
  });

  test("falls back to claim when headline is null; no recommendation when action absent", () => {
    const item = insightToWatchItem({
      ...base,
      headline: null,
      recommended_action: null,
      claim: "Latency > 500ms by Q3",
      confidence: null,
    });
    expect(item.title).toBe("Latency > 500ms by Q3");
    expect(item.recommendation).toBeNull();
    expect(item.confidence).toBe(0.8); // falls back to score
  });
});

describe("groupMissionEvents (Lane 2: group by the mission that moved)", () => {
  const meta = new Map([
    ["m1", { goal: "Grow activation", title: "Onboarding revamp" }],
    ["m2", { goal: null, title: "Billing fix" }],
  ]);
  const cost = new Map([
    ["m1", 4.2],
    ["m2", 1.1],
  ]);

  test("groups mission transitions under the mission with its goal/title and cost", () => {
    const groups = groupMissionEvents(
      [
        { entity_type: "mission", entity_id: "m1", to_stage: "running", at: "2026-07-07T10:00:00Z" },
        { entity_type: "mission", entity_id: "m1", to_stage: "shipped", at: "2026-07-07T11:00:00Z" },
        { entity_type: "mission", entity_id: "m2", to_stage: "running", at: "2026-07-07T09:00:00Z" },
      ],
      meta,
      cost,
    );
    const m1 = groups.find((g) => g.key === "m1")!;
    expect(m1.title).toBe("Onboarding revamp");
    expect(m1.goal).toBe("Grow activation");
    expect(m1.count).toBe(2);
    expect(m1.cost_usd).toBe(4.2);
    expect(groups.find((g) => g.key === "m2")!.cost_usd).toBe(1.1);
  });

  test("non-mission transitions fold under a single 'Other activity' group, sorted last", () => {
    const groups = groupMissionEvents(
      [
        { entity_type: "decision", entity_id: "d1", to_stage: "approved", at: "2026-07-07T10:00:00Z" },
        { entity_type: "mission", entity_id: "m1", to_stage: "running", at: "2026-07-07T11:00:00Z" },
      ],
      meta,
      cost,
    );
    expect(groups[groups.length - 1].key).toBe("unassigned");
    expect(groups[groups.length - 1].title).toBe("Other activity");
    expect(groups[0].key).toBe("m1");
  });

  test("caps visible items at 5 but keeps the true count", () => {
    const events = Array.from({ length: 8 }, (_, i) => ({
      entity_type: "mission",
      entity_id: "m1",
      to_stage: `stage-${i}`,
      at: `2026-07-07T${String(10 + i).padStart(2, "0")}:00:00Z`,
    }));
    const groups = groupMissionEvents(events, meta, cost);
    expect(groups[0].items.length).toBe(5);
    expect(groups[0].count).toBe(8);
  });
});

describe("assembleLane4 (real cost, never fabricated)", () => {
  const learnings = [
    {
      id: "l1",
      summary: "Onboarding revamp lifted activation",
      verdict: "validated",
      metric_label: "activation",
      metric_value: 0.15,
      mission_id: "m1",
      created_at: "2026-07-06T00:00:00Z",
    },
    {
      id: "l2",
      summary: "Pricing test inconclusive",
      verdict: "mixed",
      metric_label: null,
      metric_value: null,
      mission_id: null, // no mission attribution → cost 0, not fabricated
      created_at: "2026-07-05T00:00:00Z",
    },
  ];

  test("maps verdicts, attaches per-mission spend, averages only costed items", () => {
    const lane = assembleLane4(learnings, new Map([["m1", 6.0]]), 20);
    expect(lane.shipped_count).toBe(2);
    const l1 = lane.items.find((i) => i.id === "l1")!;
    expect(l1.verdict).toBe("achieved");
    expect(l1.spent_usd).toBe(6.0);
    const l2 = lane.items.find((i) => i.id === "l2")!;
    expect(l2.verdict).toBe("partial");
    expect(l2.spent_usd).toBe(0); // unattributed → honest zero
    expect(lane.avg_cost_per_outcome_usd).toBe(6.0); // avg over the one costed item
    expect(lane.week_spend_usd).toBe(20);
  });

  test("falls back to week aggregate for the average only when no per-item cost resolves", () => {
    const lane = assembleLane4(
      [{ ...learnings[1], id: "l3" }],
      new Map(),
      30,
    );
    expect(lane.avg_cost_per_outcome_usd).toBe(30); // 30 / 1 item
  });

  test("no outcomes → all zeros, no divide-by-zero", () => {
    const lane = assembleLane4([], new Map(), 50);
    expect(lane.shipped_count).toBe(0);
    expect(lane.avg_cost_per_outcome_usd).toBe(0);
  });
});
