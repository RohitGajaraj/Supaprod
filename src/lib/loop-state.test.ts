import { expect, test, describe } from "bun:test";
import {
  LOOP_STAGES,
  deriveLoopState,
  stageForEvent,
  stageForGate,
  isCompletionEvent,
  relativePast,
  type LoopStageEvent,
  type LoopStateInput,
} from "./loop-state.functions";

const NOW = new Date("2026-07-19T12:00:00.000Z");

function derive(overrides: Partial<LoopStateInput>) {
  return deriveLoopState({
    zone: "UTC",
    gateCountByStage: {},
    events: [],
    inFlightRuns: 0,
    lastLearningAt: null,
    now: NOW,
    ...overrides,
  });
}

function node(nodes: ReturnType<typeof deriveLoopState>, stage: string) {
  const n = nodes.find((x) => x.stage === stage);
  if (!n) throw new Error(`missing stage ${stage}`);
  return n;
}

const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);
const daysAgo = (d: number) => hoursAgo(d * 24);

describe("deriveLoopState: shape", () => {
  test("always returns the seven stages in loop order", () => {
    const nodes = derive({});
    expect(nodes.map((n) => n.stage)).toEqual([...LOOP_STAGES]);
  });

  test("empty workspace: every stage is quiet, nothing invented", () => {
    const nodes = derive({});
    for (const n of nodes) {
      expect(n.state).toBe("quiet");
      expect(n.receipt).toBeUndefined();
      expect(n.liveVerb).toBeUndefined();
      expect(n.gateCount).toBeUndefined();
    }
  });
});

describe("deriveLoopState: gates", () => {
  test("a pending gate marks its stage with the count", () => {
    const nodes = derive({ gateCountByStage: { plan: 2 } });
    expect(node(nodes, "plan")).toEqual({ stage: "plan", state: "gate", gateCount: 2 });
  });

  test("gates override active: in-flight runs plus a build gate reads as gate", () => {
    const nodes = derive({ gateCountByStage: { build: 1 }, inFlightRuns: 3 });
    const build = node(nodes, "build");
    expect(build.state).toBe("gate");
    expect(build.gateCount).toBe(1);
    expect(build.liveVerb).toBeUndefined();
  });

  test("gates override done: an approved spec plus a spec-in-review gate reads as gate", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "approved",
      actor: "human",
      at: hoursAgo(2),
    };
    const nodes = derive({ gateCountByStage: { plan: 1 }, events: [ev] });
    expect(node(nodes, "plan").state).toBe("gate");
  });
});

describe("deriveLoopState: active", () => {
  test("in-flight agent runs light Build with its live verb", () => {
    const nodes = derive({ inFlightRuns: 1 });
    const build = node(nodes, "build");
    expect(build.state).toBe("active");
    expect(build.liveVerb).toBe("writing the change");
  });

  test("a recent machine-authored event lights its stage", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "draft",
      actor: "draft",
      at: minutesAgo(5),
    };
    const nodes = derive({ events: [ev] });
    expect(node(nodes, "plan").state).toBe("active");
    expect(node(nodes, "plan").liveVerb).toBe("drafting the spec");
  });

  test("a recent HUMAN event does not read as machine work", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "draft",
      actor: "human",
      at: minutesAgo(5),
    };
    const nodes = derive({ events: [ev] });
    expect(node(nodes, "plan").state).not.toBe("active");
  });

  test("a machine event outside the 30-minute window is not active", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "draft",
      actor: "draft",
      at: minutesAgo(45),
    };
    const nodes = derive({ events: [ev] });
    expect(node(nodes, "plan").state).not.toBe("active");
  });
});

describe("deriveLoopState: done receipts", () => {
  test("an approved spec gives Plan a past-tense receipt with honest time", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "approved",
      actor: "human",
      at: hoursAgo(2),
    };
    const nodes = derive({ events: [ev] });
    const plan = node(nodes, "plan");
    expect(plan.state).toBe("done");
    expect(plan.receipt).toBe("Spec approved 2 hours ago");
  });

  test("the newest completion event wins the receipt", () => {
    const events: LoopStageEvent[] = [
      { entity_type: "spec", to_stage: "approved", actor: "human", at: daysAgo(3) },
      { entity_type: "spec", to_stage: "approved", actor: "human", at: hoursAgo(1) },
    ];
    const nodes = derive({ events });
    expect(node(nodes, "plan").receipt).toBe("Spec approved 1 hour ago");
  });

  test("a spec merely in draft does NOT mark Plan done", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "draft",
      actor: "human",
      at: hoursAgo(2),
    };
    const nodes = derive({ events: [ev] });
    expect(node(nodes, "plan").state).toBe("quiet");
  });

  test("a shipped spec marks Ship done, not Plan", () => {
    const ev: LoopStageEvent = {
      entity_type: "spec",
      to_stage: "shipped",
      actor: "human",
      at: hoursAgo(3),
    };
    const nodes = derive({ events: [ev] });
    expect(node(nodes, "ship").state).toBe("done");
    expect(node(nodes, "ship").receipt).toBe("Shipped 3 hours ago");
    expect(node(nodes, "plan").state).toBe("inferred");
  });

  test("a recorded outcome marks Learn done from the learnings feed", () => {
    const nodes = derive({ lastLearningAt: daysAgo(1) });
    const learn = node(nodes, "learn");
    expect(learn.state).toBe("done");
    expect(learn.receipt).toBe("Outcome recorded yesterday");
  });

  test("a sensed signal marks Discover done", () => {
    const ev: LoopStageEvent = {
      entity_type: "signal",
      to_stage: "sensed",
      actor: "system",
      at: hoursAgo(6),
    };
    const nodes = derive({ events: [ev] });
    expect(node(nodes, "discover").state).toBe("done");
    expect(node(nodes, "discover").receipt).toBe("New signals came in 6 hours ago");
  });
});

describe("deriveLoopState: inferred vs quiet", () => {
  test("stages before the furthest evidence are inferred; stages after stay quiet", () => {
    // Only a design gate pending: 01-03 plainly happened, 05-07 have not.
    const nodes = derive({ gateCountByStage: { design: 1 } });
    expect(node(nodes, "discover").state).toBe("inferred");
    expect(node(nodes, "decide").state).toBe("inferred");
    expect(node(nodes, "plan").state).toBe("inferred");
    expect(node(nodes, "design").state).toBe("gate");
    expect(node(nodes, "ship").state).toBe("quiet");
    expect(node(nodes, "learn").state).toBe("quiet");
  });

  test("inferred stages carry no receipt (nothing is invented)", () => {
    const nodes = derive({ gateCountByStage: { design: 1 } });
    expect(node(nodes, "plan").receipt).toBeUndefined();
  });

  test("a done stage upstream keeps its receipt; only quiet stages get inferred", () => {
    const events: LoopStageEvent[] = [
      { entity_type: "spec", to_stage: "approved", actor: "human", at: daysAgo(2) },
      { entity_type: "spec", to_stage: "shipped", actor: "human", at: daysAgo(1) },
    ];
    const nodes = derive({ events });
    expect(node(nodes, "plan").state).toBe("done");
    expect(node(nodes, "decide").state).toBe("inferred");
  });

  test("a Learn-only gate (memory graduation) does NOT make the rest of the loop inferred", () => {
    const nodes = derive({ gateCountByStage: { learn: 2 } });
    expect(node(nodes, "learn").state).toBe("gate");
    for (const stage of ["discover", "decide", "plan", "design", "build", "ship"]) {
      expect(node(nodes, stage).state).toBe("quiet");
    }
  });

  test("a recorded outcome makes every untouched upstream stage inferred", () => {
    const nodes = derive({ lastLearningAt: hoursAgo(4) });
    for (const stage of ["discover", "decide", "plan", "design", "build", "ship"]) {
      expect(node(nodes, stage).state).toBe("inferred");
    }
  });
});

describe("stageForEvent", () => {
  test("maps entity types to their Spine stages", () => {
    expect(stageForEvent({ entity_type: "signal", to_stage: "sensed" })).toBe("discover");
    expect(stageForEvent({ entity_type: "opportunity", to_stage: "backlog" })).toBe("discover");
    expect(stageForEvent({ entity_type: "theme", to_stage: "active" })).toBe("discover");
    expect(stageForEvent({ entity_type: "decision", to_stage: "approved" })).toBe("decide");
    expect(stageForEvent({ entity_type: "spec", to_stage: "review" })).toBe("plan");
    expect(stageForEvent({ entity_type: "spec", to_stage: "design_approved" })).toBe("design");
    expect(stageForEvent({ entity_type: "spec", to_stage: "build" })).toBe("build");
    expect(stageForEvent({ entity_type: "spec", to_stage: "shipped" })).toBe("ship");
    expect(stageForEvent({ entity_type: "mission", to_stage: "running" })).toBe("build");
    expect(stageForEvent({ entity_type: "mission", to_stage: "shipped" })).toBe("ship");
  });

  test("non-loop entity types map to nothing", () => {
    expect(stageForEvent({ entity_type: "goal", to_stage: "active" })).toBeNull();
    expect(stageForEvent({ entity_type: "loop", to_stage: "running" })).toBeNull();
    expect(stageForEvent({ entity_type: "unknown", to_stage: "x" })).toBeNull();
  });
});

describe("stageForGate", () => {
  test("every gate family maps to a stage", () => {
    expect(stageForGate("decision")).toBe("decide");
    expect(stageForGate("opportunity")).toBe("decide");
    expect(stageForGate("assumption_challenge")).toBe("decide");
    expect(stageForGate("spec")).toBe("plan");
    expect(stageForGate("design_gate")).toBe("design");
    expect(stageForGate("tool_call")).toBe("build");
    expect(stageForGate("trust_graduation")).toBe("build");
    expect(stageForGate("memory_candidate")).toBe("learn");
    expect(stageForGate("house_rule")).toBe("learn");
    expect(stageForGate("playbook_proposal")).toBe("learn");
  });
});

describe("isCompletionEvent", () => {
  test("a pending decision is not a completion; a recorded one is", () => {
    expect(isCompletionEvent("decide", { entity_type: "decision", to_stage: "pending" })).toBe(
      false,
    );
    expect(isCompletionEvent("decide", { entity_type: "decision", to_stage: "approved" })).toBe(
      true,
    );
    expect(isCompletionEvent("decide", { entity_type: "decision", to_stage: "rejected" })).toBe(
      true,
    );
  });

  test("design rejection is not a completion", () => {
    expect(isCompletionEvent("design", { entity_type: "spec", to_stage: "design_rejected" })).toBe(
      false,
    );
  });

  test("mission completion states finish Build", () => {
    expect(isCompletionEvent("build", { entity_type: "mission", to_stage: "done" })).toBe(true);
    expect(isCompletionEvent("build", { entity_type: "mission", to_stage: "running" })).toBe(false);
  });
});

describe("relativePast", () => {
  test("honest ladder from minutes to a dated fallback", () => {
    expect(relativePast(minutesAgo(0), NOW, "UTC")).toBe("just now");
    expect(relativePast(minutesAgo(1), NOW, "UTC")).toBe("1 minute ago");
    expect(relativePast(minutesAgo(12), NOW, "UTC")).toBe("12 minutes ago");
    expect(relativePast(hoursAgo(1), NOW, "UTC")).toBe("1 hour ago");
    expect(relativePast(hoursAgo(5), NOW, "UTC")).toBe("5 hours ago");
    expect(relativePast(daysAgo(1), NOW, "UTC")).toBe("yesterday");
    expect(relativePast(daysAgo(3), NOW, "UTC")).toBe("3 days ago");
    expect(relativePast(daysAgo(20), NOW, "UTC")).toBe("on Jun 29");
  });

  test("a future or unparsable timestamp degrades to just now, never a negative", () => {
    expect(relativePast(new Date(NOW.getTime() + 60000).toISOString(), NOW)).toBe("just now");
    expect(relativePast("not-a-date", NOW)).toBe("just now");
  });
});
