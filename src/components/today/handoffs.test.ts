import { describe, expect, it } from "bun:test";

import type { SwarmHandoff } from "@/lib/swarm.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { handoverLine, isHandover, newestHandoverByMission } from "./handoffs";

const NOW = Date.parse("2026-08-26T15:00:00Z");

function msg(over: Partial<SwarmHandoff>): SwarmHandoff {
  return {
    id: "m1",
    from_agent_slug: "discovery-scout",
    to_agent_slug: "planner",
    kind: "handoff",
    mission_id: "mission-1",
    task: "Draft the launch spec",
    created_at: "2026-08-26T14:56:00Z",
    ...over,
  };
}

describe("isHandover", () => {
  it("counts only a real change of hands, never a steer", () => {
    expect(isHandover(msg({}))).toBe(true);
    expect(isHandover(msg({ kind: "steer" }))).toBe(false);
    expect(isHandover(msg({ kind: "ask" }))).toBe(false);
  });
});

describe("newestHandoverByMission", () => {
  it("keeps the newest per mission and drops steers", () => {
    const byMission = newestHandoverByMission(
      [
        msg({ id: "a", created_at: "2026-08-26T10:00:00Z" }),
        msg({ kind: "steer", id: "s", created_at: "2026-08-26T14:00:00Z", task: "go faster" }),
        msg({ id: "b", created_at: "2026-08-26T14:56:00Z" }),
        msg({
          id: "c",
          mission_id: "mission-2",
          created_at: "2026-08-26T09:00:00Z",
          from_agent_slug: null,
        }),
      ],
      NOW,
    );
    expect(byMission.size).toBe(2);
    expect(byMission.get("mission-1")?.id).toBe("b");
    expect(byMission.get("mission-2")?.from_agent_slug).toBeNull();
  });

  it("drops a handover older than the surface's own 24-hour window", () => {
    const byMission = newestHandoverByMission(
      [msg({ created_at: "2026-08-25T14:59:59Z" })],
      NOW,
    );
    expect(byMission.size).toBe(0);
  });

  it("refuses a future or unparseable timestamp rather than dating it wrongly", () => {
    const byMission = newestHandoverByMission(
      [msg({ created_at: "2026-08-26T16:00:00Z" }), msg({ id: "x", created_at: "not-a-date" })],
      NOW,
    );
    expect(byMission.size).toBe(0);
  });

  it("answers with an empty map when the read came back nothing", () => {
    expect(newestHandoverByMission(undefined, NOW).size).toBe(0);
  });
});

describe("handoverLine", () => {
  it("names who handed over, when, and what they passed on", () => {
    const line = handoverLine(msg({}), "4m");
    expect(line).toBe(
      `Handed over by ${agentDisplayName("discovery-scout")} 4m ago: “Draft the launch spec”`,
    );
  });

  it("survives an unnamed sender, a missing clock, and an empty task", () => {
    expect(handoverLine(msg({ from_agent_slug: null }), "4m")).toBe(
      'Handed over 4m ago: “Draft the launch spec”',
    );
    expect(handoverLine(msg({}), null)).toBe(
      `Handed over by ${agentDisplayName("discovery-scout")}: “Draft the launch spec”`,
    );
    expect(handoverLine(msg({ task: "" }), "2m")).toBe(
      `Handed over by ${agentDisplayName("discovery-scout")} 2m ago.`,
    );
  });

  it("draws nothing when there is no handover", () => {
    expect(handoverLine(undefined, "4m")).toBeNull();
  });
});
