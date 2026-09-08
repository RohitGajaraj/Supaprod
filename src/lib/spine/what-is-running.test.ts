/**
 * "NOTHING RUNNING", TWICE, ON THE DAY THIS PRODUCT SHIPPED ITS FIRST RELEASE.
 *
 * 2026-09-04, measured on the Ship track: the header said nothing was running
 * at 06:13 while the orchestrator was, and again at 06:44 while the release
 * seats were.
 *
 * The reader was mission-shaped and both halves of the roster fell through it
 * for OPPOSITE reasons. These hold the shape of the answer.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  isRunningNow,
  nowPerTrace,
  objectLabelOf,
  RUNNING_NOW,
  runningHeadline,
  workingLine,
  type NowCallRow,
  type RunningSeat,
} from "@/lib/spine/what-is-running";

const seat = (over: Partial<RunningSeat> = {}): RunningSeat => ({
  runId: "run-1",
  slug: "release",
  station: "ship",
  trackId: "t-1",
  title: "Checkout asks for an address it already has",
  missionId: null,
  subGoal: null,
  startedAt: "2026-09-04T06:44:00Z",
  now: null,
  ...over,
});

describe("what counts as running", () => {
  it("the three statuses that mean a seat is working", () => {
    for (const s of ["running", "queued", "in_progress"]) expect(isRunningNow(s)).toBe(true);
  });

  it("waiting on a person is NOT running", () => {
    /*
     * P-114's distinction, kept. A run parked at a gate is doing nothing and
     * will do nothing until somebody acts; counting it would put the header
     * back to claiming present-tense work over a run nobody is touching, which
     * is the defect `genuinely-working.ts` exists to end.
     */
    expect(isRunningNow("waiting_approval")).toBe(false);
    expect(RUNNING_NOW.has("waiting_approval")).toBe(false);
  });

  it("nor is anything finished", () => {
    for (const s of ["completed", "completed_with_failures", "failed", "cancelled", "halted"]) {
      expect(isRunningNow(s), s).toBe(false);
    }
  });
});

describe("the seats the old reader could not see", () => {
  it("a seat with a TRACK and no mission is a seat working", () => {
    // `release`, `release-verifier`, `data-analyst`, `insight-keeper`: every
    // seat the spine dispatches directly. They were never in a list of missions.
    const said = workingLine(seat({ missionId: null }));
    expect(said).toContain("release is working");
    expect(said).toContain("at ship");
  });

  it("a seat with a MISSION and no track is a seat working", () => {
    /*
     * The orchestrator at 06:13. `genuinelyWorkingMissions` refused it because
     * it could not be confirmed against a moving track -- correct on its own
     * terms, and it meant a running agent read as nothing.
     */
    const said = workingLine(
      seat({ slug: "orchestrator", trackId: null, station: null, title: null }),
    );
    expect(said).toBe("orchestrator is working.");
  });

  it("degrades a clause at a time rather than going generic", () => {
    expect(workingLine(seat({ station: null }))).toContain("on Checkout asks");
    expect(workingLine(seat({ title: null }))).toContain("at ship");
    expect(workingLine(seat({ slug: null, station: null, title: null }))).toBe(
      "An agent is working.",
    );
  });

  it("names the seat through the display vocabulary when given one", () => {
    expect(workingLine(seat(), (s) => (s === "release" ? "Release" : s))).toContain(
      "Release is working",
    );
  });
});

describe("the header's one line", () => {
  it("is null when nothing is running, so the caller decides what to say", () => {
    expect(runningHeadline([])).toBeNull();
  });

  it("names the one seat when there is one", () => {
    expect(runningHeadline([seat()])).toContain("release is working at ship");
  });

  it("counts the rest rather than listing them", () => {
    const said = runningHeadline([seat(), seat({ runId: "r2" }), seat({ runId: "r3" })]);
    expect(said).toContain("and 2 more");
    // One line in a header: a reader wants to know whether to look.
    expect(said?.split(".").length).toBeLessThan(4);
  });
});

describe("the reader asks the table that knows", () => {
  const FNS = readFileSync("src/lib/spine/track.functions.ts", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
  const HOOK = readFileSync("src/hooks/use-live-agents.ts", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  /**
   * The reader's body, bounded by the NEXT export rather than by a character
   * count. A fixed window is a guard whose subject changes size when the code
   * does -- F-191, and it caught me here: adding the mission-steps read pushed
   * the catch past 2,600 characters and the assertion started failing on a
   * function that was still correct.
   */
  const readerBody = (): string => {
    const at = FNS.indexOf("export const listRunningNow");
    expect(at, "listRunningNow is gone; re-point this guard").toBeGreaterThan(-1);
    const next = FNS.indexOf("\nexport const ", at + 1);
    return next === -1 ? FNS.slice(at) : FNS.slice(at, next);
  };

  it("reads agent_runs, not a mission's stored status", () => {
    expect(FNS).toContain("listRunningNow");
    const body = readerBody();
    expect(body).toContain('.from("agent_runs")');
    expect(body).toContain('.in("status", [...RUNNING_NOW])');
  });

  it("a failed read says nothing rather than 'nothing is running'", () => {
    /*
     * The first draft of this reader returned `[]` on a failed read, and this
     * guard asserted it -- which would have been the packet committing its own
     * defect inside its own fix: the header saying "Nothing running" for a
     * second, quieter reason. `failSoftOrThrow` raises a "could not be read"
     * the caller can tell apart, so the surface says so instead of claiming
     * quiet.
     */
    const body = readerBody();
    expect(body).toContain('failSoftOrThrow(error, "What is running")');
    expect(body).not.toContain("if (error) return [];");
    /* And the catch re-raises it rather than flattening it back to empty. */
    expect(body).toContain('e.message.includes("could not be read")');
  });

  it("names its workspace", () => {
    expect(readerBody()).toContain('.eq("workspace_id", workspaceId)');
  });

  it("the hook no longer infers work from a mission", () => {
    expect(HOOK).toContain("listRunningNow");
    expect(HOOK).not.toContain("genuinelyWorkingMissions");
  });

  it("but the mission-shaped guard survives for the reader that still needs it", () => {
    // `AppFrame` still reads missions, and `missions.status` still goes stale.
    // This packet changed a subject, it did not retire a defence.
    const keeper = readFileSync("src/components/shell/genuinely-working.ts", "utf8");
    expect(keeper).toContain("export function genuinelyWorkingMissions");
    expect(readFileSync("src/components/shell/AppFrame.tsx", "utf8")).toContain(
      "genuinelyWorkingMissions",
    );
  });
});

describe("what the seat is doing this second", () => {
  const call = (trace: string, tool: string, at: string, args: unknown = {}): NowCallRow => ({
    trace_id: trace,
    tool_name: tool,
    args,
    created_at: at,
  });

  it("the verb is the newest call, in the presence vocabulary", () => {
    const now = nowPerTrace([
      call("t1", "repo.read", "2026-09-08T10:00:00Z", { path: "src/AddressStep.tsx" }),
      call("t1", "repo.search", "2026-09-08T10:00:05Z", { query: "address" }),
    ]);
    expect(now.get("t1")?.tool).toBe("repo.search");
    expect(now.get("t1")?.verb).toBe("searching the repository");
    expect(now.get("t1")?.at).toBe("2026-09-08T10:00:05Z");
  });

  it("the object is the newest call that NAMED one, so a search does not lose the file", () => {
    /*
     * S2's measurement: 1,983 of 2,271 calls name nothing. The ordinary shape
     * is a read on a file, then a search, then a stage. Taking only the newest
     * call would anchor the seat for the few seconds it spent reading and lose
     * the file for the rest of the run.
     */
    const now = nowPerTrace([
      call("t1", "repo.search", "2026-09-08T10:00:05Z", { query: "address" }),
      call("t1", "repo.read", "2026-09-08T10:00:00Z", { path: "src/AddressStep.tsx" }),
    ]);
    expect(now.get("t1")?.object).toEqual({ kind: "file", id: "src/AddressStep.tsx" });
  });

  it("order of the rows does not matter", () => {
    const rows = [
      call("t1", "repo.read", "2026-09-08T10:00:00Z", { path: "a.ts" }),
      call("t1", "studio.stage", "2026-09-08T10:00:09Z", { changes: [{ path: "b.ts" }] }),
      call("t1", "ci.logs", "2026-09-08T10:00:04Z"),
    ];
    const a = nowPerTrace(rows);
    const b = nowPerTrace([...rows].reverse());
    expect(a.get("t1")).toEqual(b.get("t1"));
    expect(a.get("t1")?.tool).toBe("studio.stage");
    expect(a.get("t1")?.object).toEqual({ kind: "file", id: "b.ts" });
  });

  it("a seat whose calls named nothing has no object, never an invented one", () => {
    const now = nowPerTrace([call("t1", "signals.list", "2026-09-08T10:00:00Z", { limit: 20 })]);
    expect(now.get("t1")?.object).toBeNull();
    expect(now.get("t1")?.verb).toBe("reading the signals");
  });

  it("a tool the vocabulary does not know is named, not hidden", () => {
    const now = nowPerTrace([call("t1", "some.new_tool", "2026-09-08T10:00:00Z")]);
    expect(now.get("t1")?.verb).toBe("running some.new_tool");
  });

  it("two seats stay two seats", () => {
    const now = nowPerTrace([
      call("t1", "repo.read", "2026-09-08T10:00:00Z", { path: "a.ts" }),
      call("t2", "prd.draft", "2026-09-08T10:00:01Z", { prdId: "p-1" }),
    ]);
    expect(now.size).toBe(2);
    expect(now.get("t2")?.verb).toBe("writing the spec");
  });

  it("a call with no trace belongs to nobody", () => {
    expect(nowPerTrace([call("", "repo.read", "2026-09-08T10:00:00Z")]).size).toBe(0);
    expect(
      nowPerTrace([{ trace_id: null, tool_name: "repo.read", args: {}, created_at: "x" }]).size,
    ).toBe(0);
  });

  it("the reader carries `now` on every seat, off the seat's own trace", () => {
    const src = readFileSync("src/lib/spine/track.functions.ts", "utf8");
    const from = src.indexOf("export const listRunningNow");
    const body = src.slice(from, src.indexOf("export const listMovingTracks"));
    expect(body).toContain("nowPerTrace(");
    expect(body).toContain('.from("tool_calls")');
    // Workspace-scoped: a tool call is the most revealing row this product holds.
    expect(body.replace(/\s+/g, " ")).toContain(
      '.eq("workspace_id", workspaceId) .in("trace_id", traceIds)',
    );
    expect(body).toContain("now: r.trace_id ? (nowByTrace.get(r.trace_id) ?? null) : null");
  });
});

describe("the object as a noun a presence slot can print", () => {
  it("a file is its own name, cut at forty characters", () => {
    expect(objectLabelOf({ kind: "file", id: "src/checkout/AddressStep.tsx" })).toBe(
      "AddressStep.tsx",
    );
    const long = { kind: "file", id: "a/" + "x".repeat(60) + ".ts" };
    expect(objectLabelOf(long)?.length).toBe(40);
  });

  it("a record is named in the product's words, an unknown kind as the record", () => {
    expect(objectLabelOf({ kind: "row:prd", id: "p" })).toBe("the spec");
    expect(objectLabelOf({ kind: "row:decision", id: "d" })).toBe("the decision");
    expect(objectLabelOf({ kind: "row:whatever", id: "w" })).toBe("the record");
  });

  it("nothing named is null, never a filler", () => {
    expect(objectLabelOf(null)).toBeNull();
    const now = nowPerTrace([
      {
        trace_id: "t",
        tool_name: "signals.list",
        args: { limit: 5 },
        created_at: "2026-09-08T10:00:00Z",
      },
    ]);
    expect(now.get("t")?.objectLabel).toBeNull();
    const named = nowPerTrace([
      {
        trace_id: "t",
        tool_name: "repo.read",
        args: { path: "src/a.ts" },
        created_at: "2026-09-08T10:00:00Z",
      },
    ]);
    expect(named.get("t")?.objectLabel).toBe("a.ts");
  });
});
