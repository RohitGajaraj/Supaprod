import { describe, expect, it } from "bun:test";
import { callsOf, filesTouched, objectOf, soFar, type LiveCall } from "./live-station";

let seq = 0;
const call = (over: Partial<LiveCall> & { tool: string }): LiveCall => ({
  id: `c${++seq}`,
  at: 1_000 + seq * 1_000,
  ok: true,
  runId: "run-1",
  argument: null,
  found: null,
  files: [],
  touch: null,
  ...over,
});

describe("the station being worked, as it fills", () => {
  it("keeps only the live seats' calls, oldest first", () => {
    const a = call({ tool: "repo.read", runId: "run-1", at: 3_000 });
    const b = call({ tool: "repo.read", runId: "run-2", at: 1_000 });
    const c = call({ tool: "repo.read", runId: null, at: 2_000 });
    expect(callsOf([a, b, c], new Set(["run-1", "run-2"])).map((x) => x.id)).toEqual([b.id, a.id]);
  });

  it("phrases a search as 'for …' and leaves a path as it is", () => {
    expect(objectOf("workspace.search", "“arrival time”")).toBe("for “arrival time”");
    expect(objectOf("repo.read", "src/app.ts")).toBe("src/app.ts");
    expect(objectOf("prd.get", null)).toBeNull();
  });

  it("lists files in the order first touched, and a write outranks a read", () => {
    const files = filesTouched([
      call({ tool: "repo.read", files: ["src/a.ts", "src/b.ts"], touch: "read", at: 1_000 }),
      call({
        tool: "studio.stage",
        files: ["src/b.ts"],
        touch: "wrote",
        at: 2_000,
        runId: "run-2",
      }),
      call({ tool: "repo.read", files: ["src/b.ts"], touch: "read", at: 3_000 }),
    ]);
    expect(files.map((f) => [f.path, f.touch, f.runId])).toEqual([
      ["src/a.ts", "read", "run-1"],
      ["src/b.ts", "wrote", "run-1"],
    ]);
    /* The clock is the newest touch, whatever kind it was. */
    expect(files[1]!.at).toBe(3_000);
  });

  it("says what Discover has done and that nothing matched, only when every search counted", () => {
    expect(
      soFar([
        call({ tool: "signals.list", found: 0 }),
        call({ tool: "signals.list", found: 0 }),
        call({ tool: "workspace.search", found: 0 }),
        call({ tool: "sources.status" }),
      ]),
    ).toBe("3 searches, 1 read · nothing matched yet");
    expect(
      soFar([
        call({ tool: "signals.list", found: 0 }),
        call({ tool: "workspace.search", found: 4 }),
      ]),
    ).toBe("2 searches · 4 matches");
    /* A search whose result the record did not count says nothing about matches. */
    expect(soFar([call({ tool: "themes.list", found: null })])).toBe("1 search");
  });

  it("says what Build has done, counting a file staged twice once", () => {
    expect(
      soFar([
        call({ tool: "repo.tree" }),
        call({ tool: "repo.read", files: ["a.ts"], touch: "read" }),
        call({ tool: "studio.stage", files: ["a.ts", "b.ts"], touch: "wrote" }),
        call({ tool: "studio.stage", files: ["b.ts"], touch: "wrote" }),
        call({ tool: "studio.commit" }),
      ]),
    ).toBe("2 reads, 2 files staged, 1 commit");
  });

  it("says the seat declared nothing to file, in its own words", () => {
    expect(
      soFar([call({ tool: "workspace.search", found: 0 }), call({ tool: "sense.found_nothing" })]),
    ).toBe("1 search, nothing to file, it says · nothing matched yet");
  });

  it("is null before the first call, so no zero is drawn", () => {
    expect(soFar([])).toBeNull();
    expect(soFar([call({ tool: "mission.plan" })])).toBeNull();
  });
});
