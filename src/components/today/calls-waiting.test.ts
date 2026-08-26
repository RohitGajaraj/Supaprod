import { describe, expect, it } from "bun:test";

import { callsWaitingByMission } from "./calls-waiting";

describe("callsWaitingByMission", () => {
  it("maps only sessions that actually hold open calls", () => {
    const map = callsWaitingByMission([
      { mission_id: "a", pending_approvals: 3 },
      { mission_id: "b", pending_approvals: 0 },
      { mission_id: "c", pending_approvals: 1 },
    ] as never);
    expect(map.size).toBe(2);
    expect(map.get("a")).toBe(3);
    expect(map.has("b")).toBe(false);
  });

  it("answers empty when the read has not answered", () => {
    expect(callsWaitingByMission(undefined).size).toBe(0);
  });
});
