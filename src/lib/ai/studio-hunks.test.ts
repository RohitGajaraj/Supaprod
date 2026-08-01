import { describe, expect, test } from "bun:test";
import {
  applyChangesetHunkSelections,
  applyHunkSelection,
  computeHunks,
  diffRows,
  diffStat,
  evaluateFileSetPolicy,
  matchesTouchList,
  pairDiffRows,
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

/**
 * The renderable diff.
 *
 * These assert the two properties the VIEW depends on and that a reader cannot
 * check by eye: that a changed row's `hunkId` is the same id per-hunk curation
 * acts on, and that line numbers survive a collapsed region. Get either wrong
 * and the surface lies about which line changed, or rejecting a hunk reverts
 * different lines than the one the person pressed.
 */
describe("diffRows", () => {
  test("numbers both sides, and a pure addition has no base number", () => {
    const rows = diffRows("a\nb", "a\nb\nc", Infinity);
    expect(rows).toEqual([
      { kind: "same", baseNo: 1, nextNo: 1, text: "a" },
      { kind: "same", baseNo: 2, nextNo: 2, text: "b" },
      { kind: "add", baseNo: null, nextNo: 3, text: "c", hunkId: 0 },
    ]);
  });

  test("a deletion has no new-file number", () => {
    const rows = diffRows("a\nb\nc", "a\nc", Infinity);
    expect(rows).toEqual([
      { kind: "same", baseNo: 1, nextNo: 1, text: "a" },
      { kind: "del", baseNo: 2, nextNo: null, text: "b", hunkId: 0 },
      { kind: "same", baseNo: 3, nextNo: 2, text: "c" },
    ]);
  });

  test("a changed row carries the id per-hunk curation acts on", () => {
    // The contract that makes the two safe to ship together: reject "hunk 1" in
    // the UI and the server reverts the same lines.
    const base = "keep\nold1\nkeep2\nkeep3\nkeep4\nkeep5\nold2\nkeep6";
    const next = "keep\nnew1\nkeep2\nkeep3\nkeep4\nkeep5\nnew2\nkeep6";
    const hunks = computeHunks(base, next);
    const rows = diffRows(base, next, Infinity);
    const idsInRows = [...new Set(rows.flatMap((r) => ("hunkId" in r ? [r.hunkId] : [])))].sort();
    expect(idsInRows).toEqual(hunks.map((h) => h.id));
    // And each id's rows carry exactly that hunk's lines.
    for (const h of hunks) {
      const dels = rows.filter((r) => r.kind === "del" && r.hunkId === h.id).map((r) => r.text);
      const adds = rows.filter((r) => r.kind === "add" && r.hunkId === h.id).map((r) => r.text);
      expect(dels).toEqual(h.baseLines);
      expect(adds).toEqual(h.modifiedLines);
    }
  });

  test("collapses a long unchanged run and keeps the numbers correct after it", () => {
    // 20 identical lines, one change at the very end. The whole point: the diff
    // is the size of the CHANGE, not the size of the file.
    const lines = Array.from({ length: 20 }, (_, i) => `line${i + 1}`);
    const base = lines.join("\n");
    const next = [...lines.slice(0, 19), "CHANGED"].join("\n");
    const rows = diffRows(base, next, 3);

    const skipped = rows.filter((r) => r.kind === "skipped");
    expect(skipped).toHaveLength(1);
    // Leading run has no change above it, so it keeps only its tail: 19 context
    // lines minus the 3 kept = 16 hidden.
    expect(skipped[0]).toEqual({ kind: "skipped", count: 16, baseNo: 17, nextNo: 17 });

    // THE NUMBERS MUST SURVIVE THE GAP. This is the assertion that catches an
    // off-by-N in the collapsing: the changed line is line 20 in both files.
    const del = rows.find((r) => r.kind === "del");
    const add = rows.find((r) => r.kind === "add");
    expect(del).toMatchObject({ baseNo: 20, text: "line20" });
    expect(add).toMatchObject({ nextNo: 20, text: "CHANGED" });

    // And the rows immediately before it are the real neighbouring lines.
    const context = rows.filter((r) => r.kind === "same").map((r) => r.text);
    expect(context).toEqual(["line17", "line18", "line19"]);
  });

  test("never collapses a run too short to be worth collapsing", () => {
    // 4 unchanged lines between two changes with context 3 would "hide" -2
    // lines. A naive implementation emits a skipped row claiming a negative or
    // zero count, which renders as "0 unchanged lines" and looks broken.
    const base = "x\na\nb\nc\nd\ny";
    const next = "X\na\nb\nc\nd\nY";
    const rows = diffRows(base, next, 3);
    expect(rows.some((r) => r.kind === "skipped")).toBe(false);
    expect(rows.filter((r) => r.kind === "same")).toHaveLength(4);
  });

  test("Infinity context renders every line", () => {
    const lines = Array.from({ length: 50 }, (_, i) => `l${i}`);
    const rows = diffRows(lines.join("\n"), [...lines.slice(0, 49), "z"].join("\n"), Infinity);
    expect(rows.some((r) => r.kind === "skipped")).toBe(false);
    expect(rows).toHaveLength(51); // 49 same + 1 del + 1 add
  });

  test("an empty base reads as all additions, not as one blank line", () => {
    const rows = diffRows("", "a\nb", Infinity);
    expect(rows.every((r) => r.kind === "add")).toBe(true);
    expect(rows).toHaveLength(2);
  });
});

describe("pairDiffRows", () => {
  test("pairs a rewritten line as a replacement rather than two events", () => {
    const paired = pairDiffRows(diffRows("a\nold\nb", "a\nnew\nb", Infinity));
    const change = paired.find((p) => p.left?.kind === "del");
    expect(change?.left).toMatchObject({ text: "old", baseNo: 2 });
    expect(change?.right).toMatchObject({ text: "new", nextNo: 2 });
  });

  test("gives the shorter side nulls when a hunk is lopsided", () => {
    // One line out, three in. The left column must run out, not borrow rows.
    const paired = pairDiffRows(diffRows("a\nold\nb", "a\nn1\nn2\nn3\nb", Infinity));
    const changed = paired.filter((p) => p.left?.kind === "del" || p.right?.kind === "add");
    expect(changed).toHaveLength(3);
    expect(changed[0].left).toMatchObject({ text: "old" });
    expect(changed[1].left).toBeNull();
    expect(changed[2].left).toBeNull();
    expect(changed.map((c) => c.right?.text)).toEqual(["n1", "n2", "n3"]);
  });

  test("an unchanged line occupies both columns", () => {
    const paired = pairDiffRows(diffRows("a\nb", "a\nc", Infinity));
    const same = paired.find((p) => p.left?.kind === "same");
    expect(same?.left).toBe(same?.right as unknown);
  });

  test("a collapsed run spans both columns and keeps its resume point", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line${i + 1}`);
    const paired = pairDiffRows(
      diffRows(lines.join("\n"), [...lines.slice(0, 19), "CHANGED"].join("\n"), 3),
    );
    const gap = paired.find((p) => p.skipped);
    expect(gap?.skipped).toEqual({ count: 16, baseNo: 17, nextNo: 17 });
    expect(gap?.left).toBeNull();
    expect(gap?.right).toBeNull();
  });

  test("two hunks separated by context do not bleed into each other", () => {
    // The pairing walks by hunkId, so a bug here would pair hunk 0's deletion
    // against hunk 1's addition and claim a change that never happened.
    const base = "o1\nk1\nk2\nk3\nk4\nk5\nk6\no2";
    const next = "n1\nk1\nk2\nk3\nk4\nk5\nk6\nn2";
    const paired = pairDiffRows(diffRows(base, next, Infinity));
    const changes = paired.filter((p) => p.left?.kind === "del");
    expect(changes).toHaveLength(2);
    expect(changes[0].left).toMatchObject({ text: "o1" });
    expect(changes[0].right).toMatchObject({ text: "n1" });
    expect(changes[1].left).toMatchObject({ text: "o2" });
    expect(changes[1].right).toMatchObject({ text: "n2" });
  });
});
