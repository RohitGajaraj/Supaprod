import { describe, expect, test } from "bun:test";
import {
  applyChangesetHunkSelections,
  applyHunkSelection,
  computeHunks,
  diffStat,
  evaluateFileSetPolicy,
  matchesTouchList,
} from "./studio-hunks";

describe("computeHunks", () => {
  test("identical content has no hunks", () => {
    expect(computeHunks("a\nb\nc", "a\nb\nc")).toEqual([]);
  });

  test("a single replaced line is one hunk", () => {
    const hunks = computeHunks("a\nb\nc", "a\nB\nc");
    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toMatchObject({ id: 0, baseLines: ["b"], modifiedLines: ["B"] });
  });

  test("two separated edits are two hunks with stable ids", () => {
    const hunks = computeHunks("a\nb\nc\nd\ne", "A\nb\nc\nd\nE");
    expect(hunks.map((h) => h.id)).toEqual([0, 1]);
    expect(hunks[0]).toMatchObject({ baseLines: ["a"], modifiedLines: ["A"] });
    expect(hunks[1]).toMatchObject({ baseLines: ["e"], modifiedLines: ["E"] });
  });

  test("pure insertion (create-like) is one ins-only hunk", () => {
    const hunks = computeHunks("", "x\ny");
    expect(hunks).toHaveLength(1);
    expect(hunks[0].baseLines).toEqual([]);
    expect(hunks[0].modifiedLines).toEqual(["x", "y"]);
  });

  test("pure deletion is one del-only hunk", () => {
    const hunks = computeHunks("x\ny", "");
    expect(hunks).toHaveLength(1);
    expect(hunks[0].baseLines).toEqual(["x", "y"]);
    expect(hunks[0].modifiedLines).toEqual([]);
  });
});

describe("applyHunkSelection", () => {
  const base = "a\nb\nc\nd\ne";
  const modified = "A\nb\nc\nd\nE";

  test("rejecting nothing reconstructs the modified content exactly", () => {
    expect(applyHunkSelection(base, modified, [])).toBe(modified);
  });

  test("rejecting every hunk reconstructs the base content exactly", () => {
    const ids = computeHunks(base, modified).map((h) => h.id);
    expect(applyHunkSelection(base, modified, ids)).toBe(base);
  });

  test("rejecting one hunk keeps the other (partial accept)", () => {
    // Reject hunk 0 (a->A), keep hunk 1 (e->E): expect base's first line, modified's last.
    expect(applyHunkSelection(base, modified, [0])).toBe("a\nb\nc\nd\nE");
    expect(applyHunkSelection(base, modified, [1])).toBe("A\nb\nc\nd\ne");
  });

  test("preserves a trailing newline through round-trip", () => {
    const b = "a\nb\n";
    const m = "a\nB\n";
    expect(applyHunkSelection(b, m, [])).toBe(m);
    expect(
      applyHunkSelection(
        b,
        m,
        computeHunks(b, m).map((h) => h.id),
      ),
    ).toBe(b);
  });

  test("unknown rejected ids are ignored (no crash, treated as accept)", () => {
    expect(applyHunkSelection(base, modified, [99])).toBe(modified);
  });

  test("an inserted block can be rejected back to empty base", () => {
    expect(applyHunkSelection("", "x\ny", [0])).toBe("");
    expect(applyHunkSelection("", "x\ny", [])).toBe("x\ny");
  });
});

describe("matchesTouchList", () => {
  test("exact path match", () => {
    expect(matchesTouchList("src/lib/a.ts", ["src/lib/a.ts"])).toBe(true);
    expect(matchesTouchList("src/lib/b.ts", ["src/lib/a.ts"])).toBe(false);
  });

  test("directory-prefix entry (trailing slash) matches everything beneath", () => {
    expect(matchesTouchList("src/lib/a.ts", ["src/lib/"])).toBe(true);
    expect(matchesTouchList("src/lib/sub/deep.ts", ["src/lib/"])).toBe(true);
    expect(matchesTouchList("src/other/a.ts", ["src/lib/"])).toBe(false);
    // A prefix without a trailing slash is NOT a directory match (avoids src/lib2 leaking in).
    expect(matchesTouchList("src/lib2/a.ts", ["src/lib/"])).toBe(false);
  });

  test("single-star glob stays within a path segment", () => {
    expect(matchesTouchList("src/lib/a.ts", ["src/lib/*.ts"])).toBe(true);
    expect(matchesTouchList("src/lib/a.tsx", ["src/lib/*.ts"])).toBe(false);
    // * does not cross a slash
    expect(matchesTouchList("src/lib/sub/a.ts", ["src/lib/*.ts"])).toBe(false);
  });

  test("double-star glob crosses path segments", () => {
    expect(matchesTouchList("src/lib/sub/a.ts", ["src/**"])).toBe(true);
    expect(matchesTouchList("src/a.ts", ["src/**/*.ts"])).toBe(true);
    expect(matchesTouchList("src/lib/sub/a.ts", ["src/**/*.ts"])).toBe(true);
  });

  test("empty/whitespace entries never match", () => {
    expect(matchesTouchList("src/a.ts", ["", "   "])).toBe(false);
    expect(matchesTouchList("src/a.ts", [])).toBe(false);
  });
});

describe("evaluateFileSetPolicy", () => {
  test("no policy → everything in scope, within cap, clean", () => {
    const r = evaluateFileSetPolicy({ paths: ["a.ts", "b.ts"] });
    expect(r.hasTouchList).toBe(false);
    expect(r.hasCap).toBe(false);
    expect(r.inPolicy).toEqual(["a.ts", "b.ts"]);
    expect(r.outOfPolicy).toEqual([]);
    expect(r.withinCap).toBe(true);
    expect(r.clean).toBe(true);
  });

  test("touch list splits in/out of policy", () => {
    const r = evaluateFileSetPolicy({
      paths: ["src/lib/a.ts", "src/routes/x.tsx", "README.md"],
      allowedPaths: ["src/lib/"],
    });
    expect(r.inPolicy).toEqual(["src/lib/a.ts"]);
    expect(r.outOfPolicy).toEqual(["src/routes/x.tsx", "README.md"]);
    expect(r.clean).toBe(false);
  });

  test("max-files cap reports overBy and breaks clean", () => {
    const r = evaluateFileSetPolicy({ paths: ["a", "b", "c"], maxFiles: 2 });
    expect(r.hasCap).toBe(true);
    expect(r.maxFiles).toBe(2);
    expect(r.withinCap).toBe(false);
    expect(r.overBy).toBe(1);
    expect(r.clean).toBe(false);
  });

  test("within cap and fully in scope is clean", () => {
    const r = evaluateFileSetPolicy({
      paths: ["src/lib/a.ts", "src/lib/b.ts"],
      allowedPaths: ["src/lib/"],
      maxFiles: 5,
    });
    expect(r.clean).toBe(true);
    expect(r.overBy).toBe(0);
  });

  test("non-positive / invalid caps are treated as uncapped", () => {
    expect(evaluateFileSetPolicy({ paths: ["a"], maxFiles: 0 }).hasCap).toBe(false);
    expect(evaluateFileSetPolicy({ paths: ["a"], maxFiles: -3 }).hasCap).toBe(false);
    expect(evaluateFileSetPolicy({ paths: ["a"], maxFiles: null }).hasCap).toBe(false);
  });

  test("blank touch-list entries are ignored (counts as no touch list)", () => {
    const r = evaluateFileSetPolicy({ paths: ["a.ts"], allowedPaths: ["", "  "] });
    expect(r.hasTouchList).toBe(false);
    expect(r.outOfPolicy).toEqual([]);
  });
});

describe("applyChangesetHunkSelections", () => {
  test("applies a per-file selection across files, reverting only rejected hunks", () => {
    const files = [
      { path: "a.ts", base: "a\nb\nc", modified: "A\nb\nc", rejectedHunkIds: [] },
      { path: "b.ts", base: "x\ny\nz", modified: "x\nY\nz", rejectedHunkIds: [0] },
    ];
    const out = applyChangesetHunkSelections(files);
    expect(out).toEqual([
      { path: "a.ts", merged: "A\nb\nc" }, // kept
      { path: "b.ts", merged: "x\ny\nz" }, // rejected back to base
    ]);
  });

  test("empty input yields empty output", () => {
    expect(applyChangesetHunkSelections([])).toEqual([]);
  });
});

describe("diffStat", () => {
  test("identical content is no change at all", () => {
    expect(diffStat("a\nb\nc", "a\nb\nc")).toEqual({ added: 0, removed: 0 });
  });

  test("a pure insertion adds and removes nothing", () => {
    expect(diffStat("a\nb", "a\nnew\nb")).toEqual({ added: 1, removed: 0 });
  });

  test("a pure deletion removes and adds nothing", () => {
    expect(diffStat("a\ngone\nb", "a\nb")).toEqual({ added: 0, removed: 1 });
  });

  test("a new file is all additions, an emptied one all removals", () => {
    expect(diffStat("", "a\nb\nc")).toEqual({ added: 3, removed: 0 });
    expect(diffStat("a\nb\nc", "")).toEqual({ added: 0, removed: 3 });
  });

  // The two cases the character delta this replaced got wrong. Both are real
  // changes that net to zero characters, so the run screen used to state them
  // as "+0 -0" while the Changes tab underneath rendered actual hunks.
  test("a line rewritten to the same length is one out and one in", () => {
    expect(diffStat("const a = 1;", "const b = 2;")).toEqual({ added: 1, removed: 1 });
  });

  test("two lines swapped is a real change, not a wash", () => {
    const stat = diffStat("alpha\nbravo", "bravo\nalpha");
    expect(stat.added).toBeGreaterThan(0);
    expect(stat.removed).toBeGreaterThan(0);
  });

  test("it never disagrees with the hunks it is summed from", () => {
    const base = "one\ntwo\nthree\nfour";
    const next = "one\nTWO\nthree\nfour\nfive";
    const hunks = computeHunks(base, next);
    const summed = hunks.reduce(
      (acc, h) => ({
        added: acc.added + h.modifiedLines.length,
        removed: acc.removed + h.baseLines.length,
      }),
      { added: 0, removed: 0 },
    );
    expect(diffStat(base, next)).toEqual(summed);
  });
});
