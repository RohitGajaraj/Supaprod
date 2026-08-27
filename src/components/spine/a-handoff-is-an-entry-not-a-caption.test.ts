import { describe, it, expect } from "bun:test";
import { mergeActivityRows, type HandoffRow } from "./activity-rows";
import type { Turn } from "@/components/spine/activity";

/**
 * SESSION-1's first unit is "handoff made visible", and the brief states the
 * shape: "it renders as a transcript entry". These pin the row that entry is
 * built from, including the two facts that decided it could not be a caption
 * hung off a turn -- see `activity-rows.ts` and `handoff-said.ts` for the
 * measurement.
 */

const turn = (runId: string, at: string): Turn =>
  ({ runId, at, agentSlug: "studio", agentName: "Studio", station: "build" }) as unknown as Turn;

const handoff = (over: Partial<HandoffRow> = {}): HandoffRow => ({
  id: "h1",
  kind: "handoff",
  from_agent_slug: "orchestrator",
  to_agent_slug: "prd-writer",
  payload: { task: "Draft the spec for saved address reuse." },
  created_at: "2026-08-27T02:03:56.000Z",
  consumed_by_run_id: null,
  ...over,
});

describe("a handoff is an entry in the transcript", () => {
  it("takes its place in time, among the turns", () => {
    const rows = mergeActivityRows(
      [turn("r1", "2026-08-27T01:00:00.000Z"), turn("r2", "2026-08-27T03:00:00.000Z")],
      [],
      [handoff()],
    );
    // Newest first, which is the order this function returns and the transcript
    // reverses. The handoff sits between the two turns because that is when it
    // happened, not appended to either of them.
    expect(rows.map((r) => r.kind)).toEqual(["turn", "handoff", "turn"]);
  });

  it("carries the sender's own words, both teammates, and nothing composed", () => {
    const [row] = mergeActivityRows([], [], [handoff()]);
    expect(row.kind).toBe("handoff");
    if (row.kind !== "handoff") return;
    expect(row.task).toBe("Draft the spec for saved address reuse.");
    expect(row.from).toBe("orchestrator");
    expect(row.to).toBe("prd-writer");
  });

  it("says out loud when nothing has picked it up", () => {
    /*
     * A fact from the row, not a mood. 10 of the 143 handoffs in the database
     * carry no `consumed_by_run_id`: they were dispatched and nothing took
     * them. That is worth a person knowing and it is the difference between a
     * record and a feed.
     */
    const [waiting] = mergeActivityRows([], [], [handoff({ consumed_by_run_id: null })]);
    const [taken] = mergeActivityRows([], [], [handoff({ consumed_by_run_id: "run-9" })]);
    expect(waiting.kind === "handoff" && waiting.waiting).toBe(true);
    expect(taken.kind === "handoff" && taken.waiting).toBe(false);
  });

  it("is dropped entirely when no instruction was written", () => {
    // An entry saying only that a handoff happened is the caption this was
    // built to replace. Nothing to say means no row.
    expect(mergeActivityRows([], [], [handoff({ payload: {} })])).toEqual([]);
    expect(mergeActivityRows([], [], [handoff({ payload: null })])).toEqual([]);
  });

  it("leaves the transcript exactly as it was when there are none", () => {
    // The argument is optional and every existing caller passes nothing.
    const before = mergeActivityRows([turn("r1", "2026-08-27T01:00:00.000Z")], []);
    const after = mergeActivityRows([turn("r1", "2026-08-27T01:00:00.000Z")], [], []);
    expect(after).toEqual(before);
  });
});
