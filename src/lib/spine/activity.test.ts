/**
 * The activity stream must report, never guess.
 *
 * A status display that invents state is worse than none, because a person
 * cannot tell the inventions from the facts. These pin the places where an
 * invention would be easiest and most tempting: a run with no artifacts, a run
 * still going, and crediting the right agent when three of them worked the same
 * station minutes apart.
 */
import { describe, expect, it } from "bun:test";
import { buildActivity, countKinds, liveTurn, type MemberRow, type RunRow } from "./activity";

const run = (o: Partial<RunRow> & { id: string; created_at: string }): RunRow => ({
  agent_slug: "prd-writer",
  agent_name: "Draft",
  status: "completed",
  output: null,
  spend_used_usd: 0,
  ...o,
});

const member = (
  o: Partial<MemberRow> & { artifact_id: string; created_at: string },
): MemberRow => ({
  artifact_kind: "prd",
  station: "define",
  ...o,
});

describe("the activity stream", () => {
  it("credits an artifact to the agent that was running when it landed", () => {
    // Plan's crew: Draft then Plan, ten minutes apart. The spec landed during
    // the first, the tasks during the second. Getting this wrong would show a
    // person the wrong agent doing the wrong job, which is worse than silence.
    const turns = buildActivity({
      runs: [
        run({ id: "r1", agent_name: "Draft", created_at: "2026-08-01T10:00:00Z" }),
        run({ id: "r2", agent_name: "Plan", created_at: "2026-08-01T10:10:00Z" }),
      ],
      members: [
        member({ artifact_id: "a", artifact_kind: "prd", created_at: "2026-08-01T10:01:00Z" }),
        member({ artifact_id: "b", artifact_kind: "task", created_at: "2026-08-01T10:11:00Z" }),
        member({ artifact_id: "c", artifact_kind: "task", created_at: "2026-08-01T10:12:00Z" }),
      ],
    });
    expect(turns[0].made.map((m) => m.kind)).toEqual(["prd"]);
    expect(turns[1].made.map((m) => m.kind)).toEqual(["task", "task"]);
  });

  it("says a turn filed nothing rather than dressing it as progress", () => {
    const [t] = buildActivity({
      runs: [run({ id: "r1", agent_name: "Draft", created_at: "2026-08-01T10:00:00Z" })],
      members: [],
    });
    expect(t.made).toEqual([]);
    expect(t.outcome).toBe("done");
  });

  it("only says working when the row actually says running", () => {
    const turns = buildActivity({
      runs: [
        run({ id: "r1", status: "running", created_at: "2026-08-01T10:00:00Z" }),
        run({ id: "r2", status: "completed", created_at: "2026-08-01T10:05:00Z" }),
        run({ id: "r3", status: "halted", created_at: "2026-08-01T10:06:00Z" }),
      ],
      members: [],
    });
    expect(turns.map((t) => t.outcome)).toEqual(["working", "done", "stopped"]);
    expect(liveTurn(turns)?.runId).toBe("r1");
  });

  it("treats an unknown status as stopped rather than as success", () => {
    // Fail direction: a status this version does not recognise must not render
    // as a clean finish, or a new failure mode ships looking like success.
    const [t] = buildActivity({
      runs: [run({ id: "r1", status: "something_new", created_at: "2026-08-01T10:00:00Z" })],
      members: [],
    });
    expect(t.outcome).toBe("stopped");
  });

  it("reports nothing live when nothing is live", () => {
    expect(
      liveTurn(buildActivity({ runs: [run({ id: "r1", created_at: "x" })], members: [] })),
    ).toBeNull();
  });

  it("keeps the station a turn worked, not the one the track has moved to", () => {
    const [t] = buildActivity({
      runs: [run({ id: "r1", created_at: "2026-08-01T10:00:00Z" })],
      members: [
        member({
          artifact_id: "a",
          artifact_kind: "prototype",
          station: "design",
          created_at: "2026-08-01T10:01:00Z",
        }),
      ],
    });
    expect(t.station).toBe("design");
    expect(t.stationName).toBe("Design");
  });

  it("falls back to the slug when an agent has no display name", () => {
    const [t] = buildActivity({
      runs: [run({ id: "r1", agent_name: "  ", created_at: "x" })],
      members: [],
    });
    expect(t.agentName).toBe("prd-writer");
  });

  it("orders oldest first so the handoff reads in the order it happened", () => {
    const turns = buildActivity({
      runs: [
        run({ id: "late", created_at: "2026-08-01T10:10:00Z" }),
        run({ id: "early", created_at: "2026-08-01T10:00:00Z" }),
      ],
      members: [],
    });
    expect(turns.map((t) => t.runId)).toEqual(["early", "late"]);
  });
});

describe("counting what was made", () => {
  it("uses the product's words and never a bare plural s", () => {
    expect(countKinds([{ kind: "prd", word: "spec", id: "1" }])).toBe("a spec");
    expect(
      countKinds([
        { kind: "signal", word: "signal", id: "1" },
        { kind: "signal", word: "signal", id: "2" },
      ]),
    ).toBe("2 findings");
    // `theme` reads as "cluster", which is the whole reason KIND_WORD exists.
    expect(countKinds([{ kind: "theme", word: "cluster", id: "1" }])).toBe("a cluster");
  });

  it("joins several kinds plainly", () => {
    expect(
      countKinds([
        { kind: "prd", word: "spec", id: "1" },
        { kind: "task", word: "task", id: "2" },
        { kind: "task", word: "task", id: "3" },
      ]),
    ).toBe("a spec and 2 tasks");
  });
});
