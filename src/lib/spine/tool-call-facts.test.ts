import { describe, expect, it } from "bun:test";
import { ARGUMENT_MAX, clip, toolCallFacts } from "./tool-call-facts";

/*
 * The shapes below are the ones on record: the argument keys of every tool
 * called in the 21 days to 2026-09-08, read off `tool_calls.args` with
 * `jsonb_object_keys`. A tool the catalogue grows falls to the generic pick.
 */
describe("what a tool call was about", () => {
  it("quotes the search a seat ran, and counts what came back", () => {
    const f = toolCallFacts(
      "workspace.search",
      { query: "installer arrival time estimated time scheduling support call" },
      [{ id: "a" }, { id: "b" }, { id: "c" }],
    );
    expect(f.argument).toBe("“installer arrival time estimated time scheduling support call”");
    expect(f.found).toBe(3);
    expect(f.files).toEqual([]);
    expect(f.touch).toBeNull();
  });

  it("says what a signals listing was filtered by, and that it returned nothing", () => {
    const f = toolCallFacts(
      "signals.list",
      { limit: 20, lookback_days: 90, tag: "installer-arrival" },
      [],
    );
    expect(f.argument).toBe("tagged installer-arrival, last 90 days");
    expect(f.found).toBe(0);
  });

  it("names the paths a seat read, as files it read", () => {
    const f = toolCallFacts(
      "repo.read",
      { paths: ["src/app.ts", "src/pages/index.tsx"], ref: "main" },
      { files: {} },
    );
    expect(f.argument).toBe("src/app.ts, src/pages/index.tsx");
    expect(f.files).toEqual(["src/app.ts", "src/pages/index.tsx"]);
    expect(f.touch).toBe("read");
    /* An object result with no list in it is not a count of anything. */
    expect(f.found).toBeNull();
  });

  it("names the files a seat staged without carrying their contents", () => {
    const f = toolCallFacts(
      "studio.stage",
      {
        changes: [
          { path: "src/health.ts", content: "x".repeat(9000) },
          { path: "src/index.tsx", content: "y".repeat(9000) },
          { path: "a.ts", content: "" },
          { path: "b.ts", content: "" },
        ],
      },
      { ok: true },
    );
    expect(f.argument).toBe("src/health.ts, src/index.tsx, a.ts +1 more");
    expect(f.files).toEqual(["src/health.ts", "src/index.tsx", "a.ts", "b.ts"]);
    expect(f.touch).toBe("wrote");
    expect(f.argument!.length).toBeLessThan(ARGUMENT_MAX);
  });

  it("quotes the first line of a commit message", () => {
    const f = toolCallFacts(
      "studio.commit",
      { message: "Add a /health endpoint\n\nLonger body here." },
      null,
    );
    expect(f.argument).toBe("“Add a /health endpoint”");
  });

  it("says which PR the checks were read for", () => {
    expect(toolCallFacts("github.ci.read", { pr_number: 5 }, null).argument).toBe("PR #5");
    expect(toolCallFacts("ci.logs", { pr_number: 12 }, null).argument).toBe("PR #12");
  });

  it("quotes the title of a call, a drawing, a task and a spec brief", () => {
    expect(
      toolCallFacts("decision.record", { title: "Show the arrival window", rationale: "…" }, null)
        .argument,
    ).toBe("“Show the arrival window”");
    expect(
      toolCallFacts("design.draft", { name: "Order page", description: "…" }, null).argument,
    ).toBe("“Order page”");
    expect(
      toolCallFacts("tasks.create", { title: "Wire the endpoint", priority: 2 }, null).argument,
    ).toBe("“Wire the endpoint”");
    expect(
      toolCallFacts("prd.draft", { brief: "A spec for the arrival window" }, null).argument,
    ).toBe("“A spec for the arrival window”");
  });

  it("says nothing for an id alone, rather than printing the id", () => {
    expect(
      toolCallFacts("prd.get", { id: "79bd92e3-73bf-4138-9ca3-198b21de7c64" }, {}).argument,
    ).toBeNull();
    expect(toolCallFacts("brain.get_decision", { id: "x" }, {}).argument).toBeNull();
    expect(toolCallFacts("themes.list", { limit: 10, min_severity: 1 }, []).argument).toBeNull();
    expect(toolCallFacts("sources.status", {}, {}).argument).toBeNull();
  });

  it("quotes what a seat searched before declaring it found nothing", () => {
    const f = toolCallFacts(
      "sense.found_nothing",
      { searched: "installer arrival time" },
      { ok: true },
    );
    expect(f.argument).toBe("“installer arrival time”");
    /* The seat's own declaration is not a listing; nothing is counted. */
    expect(f.found).toBeNull();
  });

  it("clips a long brief on a word and marks the cut", () => {
    const brief = "word ".repeat(60).trim();
    const f = toolCallFacts("prd.draft", { brief }, null);
    expect(f.argument!.length).toBeLessThanOrEqual(ARGUMENT_MAX + 2);
    expect(f.argument!.endsWith("…”")).toBe(true);
    expect(clip("short")).toBe("short");
  });

  it("never throws on a row whose arguments are not an object", () => {
    expect(toolCallFacts("repo.tree", null, null)).toEqual({
      argument: null,
      found: null,
      files: [],
      touch: null,
    });
    expect(toolCallFacts("workspace.search", "not an object", undefined).argument).toBeNull();
    expect(toolCallFacts("studio.stage", { changes: "nope" }, null).files).toEqual([]);
  });
});
