import { describe, it, expect } from "bun:test";
import { conventionalTestPath, isTestableSource, planChangesetTests } from "./test-plan";

describe("conventionalTestPath", () => {
  it("inserts .test before the final extension", () => {
    expect(conventionalTestPath("src/lib/foo.ts")).toBe("src/lib/foo.test.ts");
    expect(conventionalTestPath("src/components/Card.tsx")).toBe("src/components/Card.test.tsx");
  });

  it("keeps a multi-suffix name intact, which is why it splits on the LAST dot", () => {
    // critic.server.ts -> critic.server.test.ts is the pair that actually exists
    // in this repo; splitting on the first dot would have named it critic.test.server.ts.
    expect(conventionalTestPath("src/lib/ai/critic.server.ts")).toBe(
      "src/lib/ai/critic.server.test.ts",
    );
  });

  it("handles an extensionless path without producing a dotted mess", () => {
    expect(conventionalTestPath("scripts/build")).toBe("scripts/build.test");
  });
});

describe("isTestableSource", () => {
  it("accepts ordinary source", () => {
    expect(isTestableSource("src/lib/a.ts", "create")).toBe(true);
    expect(isTestableSource("src/lib/a.tsx", "update")).toBe(true);
  });

  it("rejects a test file (it is the coverage, not the thing covered)", () => {
    expect(isTestableSource("src/lib/a.test.ts", "create")).toBe(false);
  });

  it("rejects a deletion: there is nothing left to test", () => {
    expect(isTestableSource("src/lib/a.ts", "delete")).toBe(false);
  });

  it("rejects non-code", () => {
    for (const p of ["README.md", "src/a.css", "data.json", "q.sql", "logo.svg"]) {
      expect(isTestableSource(p, "create"), p).toBe(false);
    }
  });

  it("rejects generated output, ambient types, and root config", () => {
    // Listing a gap against any of these is noise the agent then argues with,
    // which is how a gate loses its authority.
    expect(isTestableSource("src/routes/routeTree.gen.ts", "update")).toBe(false);
    expect(isTestableSource("src/types/env.d.ts", "create")).toBe(false);
    expect(isTestableSource("vite.config.ts", "update")).toBe(false);
  });
});

describe("planChangesetTests", () => {
  it("marks a source file covered when its test is staged in the same changeset", () => {
    const plan = planChangesetTests([
      { path: "src/lib/a.ts", op: "create" },
      { path: "src/lib/a.test.ts", op: "create" },
    ]);
    expect(plan.gaps).toEqual([]);
    expect(plan.items[0].coverage).toBe("covered_in_changeset");
    expect(plan.staged_test_files).toEqual(["src/lib/a.test.ts"]);
  });

  it("marks it covered when the test already exists on the branch", () => {
    const plan = planChangesetTests(
      [{ path: "src/lib/a.ts", op: "update" }],
      ["src/lib/a.test.ts"],
    );
    expect(plan.gaps).toEqual([]);
    expect(plan.items[0].coverage).toBe("covered_in_repo");
  });

  it("names the gap and the exact path that would close it", () => {
    const plan = planChangesetTests([{ path: "src/lib/pricing.ts", op: "create" }]);
    expect(plan.gaps).toHaveLength(1);
    expect(plan.gaps[0]).toMatchObject({
      source_path: "src/lib/pricing.ts",
      expected_test_path: "src/lib/pricing.test.ts",
      coverage: "gap",
    });
  });

  it("over-reports rather than under-reports when the repo tree could not be read", () => {
    // An empty repoTestPaths (the fail-soft value) costs one repo.read to
    // disprove. Missing a real gap is the failure that matters.
    const plan = planChangesetTests([{ path: "src/lib/a.ts", op: "update" }], []);
    expect(plan.gaps).toHaveLength(1);
  });

  it("separates the files that were never in scope from the ones that pass", () => {
    const plan = planChangesetTests([
      { path: "docs/readme.md", op: "update" },
      { path: "src/lib/a.ts", op: "create" },
      { path: "src/lib/gone.ts", op: "delete" },
    ]);
    expect(plan.not_applicable).toEqual(["docs/readme.md", "src/lib/gone.ts"]);
    expect(plan.items).toHaveLength(1);
  });

  it("says there is nothing to author when nothing changed takes a test", () => {
    const plan = planChangesetTests([{ path: "docs/readme.md", op: "update" }]);
    expect(plan.items).toEqual([]);
    expect(plan.note).toContain("Nothing to author");
  });

  it("never claims a test passed, only that one exists", () => {
    // The whole honesty contract of this module in one assertion: there is no
    // execution sandbox, so no output here may imply a run.
    const plan = planChangesetTests([{ path: "src/lib/a.ts", op: "create" }]);
    expect(plan.note).toContain("Nothing here executes a test");
    expect(plan.note).not.toMatch(/\bpass(ed|ing)\b/);
  });

  it("is totally defined on empty input", () => {
    const plan = planChangesetTests([]);
    expect(plan.items).toEqual([]);
    expect(plan.gaps).toEqual([]);
    expect(plan.staged_test_files).toEqual([]);
  });
});
