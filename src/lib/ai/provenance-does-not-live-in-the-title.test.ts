/**
 * ── PROVENANCE TRAVELS IN THE COLUMN, NOT IN THE SUBJECT ──────────────────
 *
 * Read on the served entry, 2026-09-09 (deployment 99f5076a). The home's
 * second line names the one call to start with and quotes it, and it said:
 *
 *   Start with "Mission completed: Show homeowner installer arrival window on
 *   order page".
 *
 * telling a person to start with something that announces its own completion.
 * The lead was right; the stored title was wrong. `handoff.server.ts` wrote
 * `Mission completed: ${title}` into `decisions.title` while setting
 * `source_kind: "mission"` and `mission_id` on the same insert, and the queue
 * already turns the first of those into the words a reader sees.
 *
 * ── WHY A GUARD AND NOT JUST THE FIX ──────────────────────────────────────
 * Migration 20260805120000 moved `[auto]` out of titles for this exact reason,
 * and `plan/format.ts` wrote down what it expected to happen next: the helper
 * stays as a belt *"and any future writer that reintroduces a prefix"*. This
 * writer WAS that future writer, and the prediction is a year of hindsight
 * saying the failure recurs. So the rule gets a test rather than a third
 * comment.
 *
 * ── AND IT IS A PAIR, BECAUSE HALF OF IT WOULD PASS ON A LOSS ─────────────
 * A guard that only checks the prefix is gone also passes if the provenance
 * was deleted outright, which would be a worse product: nothing would say the
 * record came from a pass. So the mirror asserts the fact still travels --
 * on the row, and through to the reader -- and the two together say it MOVED
 * rather than that it went.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Comments only. A previous guard of mine stripped string literals too and
 * erased the very literal it was hunting, so it found zero call sites and
 * passed on a file that still held the defect.
 */
const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const HANDOFF = code(readFileSync(join(import.meta.dir, "handoff.server.ts"), "utf8"));
const QUEUE = code(
  readFileSync(join(import.meta.dir, "..", "approvals-queue.functions.ts"), "utf8"),
);

describe("a mission's decision record is titled with the work", () => {
  it("puts no provenance prefix in the title it stores", () => {
    // The literal, and the template shape that produced it. Either coming back
    // is the same defect whatever the wording of the prefix.
    expect(HANDOFF).not.toContain("Mission completed:");
    expect(HANDOFF).not.toMatch(/title:\s*`[^`]*:\s*\$\{/);
  });

  it("stores the mission's own title, sliced to the column", () => {
    expect(HANDOFF).toMatch(/title:\s*\(updated\.title\s*\?\?\s*"Untitled"\)\.slice\(0,\s*240\)/);
  });
});

describe("the fact did not go, it moved", () => {
  it("still records WHERE the decision came from, on the row", () => {
    // If this fails together with the pair above, provenance was deleted
    // rather than relocated, and no surface can say the record came from a
    // pass at all.
    expect(HANDOFF).toContain('sourceKind: "mission"');
    expect(HANDOFF).toContain('source_kind: "mission"');
    expect(HANDOFF).toContain("mission_id: updated.id");
  });

  it("still reaches a reader in words, from that column and not the title", () => {
    expect(QUEUE).toContain('d.source_kind === "mission"');
    expect(QUEUE).toContain("raised during a pass");
  });
});

describe("the global stripper is left alone, and that is the point", () => {
  it("does not teach cleanTitle an English phrase", () => {
    /*
     * `stripAutoMarkers` is safe globally on the argument its own header
     * makes: "[auto] is not English and it is not a subject ... no title
     * legitimately contains the literal token." "Mission completed" fails
     * every clause of that -- a person can legitimately open a title with it
     * -- so teaching the global stripper to remove it would silently rewrite
     * somebody's own words on every surface at once.
     */
    const FORMAT = code(
      readFileSync(join(import.meta.dir, "..", "..", "components", "plan", "format.ts"), "utf8"),
    );
    expect(FORMAT).not.toContain("Mission completed");
    expect(FORMAT).not.toMatch(/replace\(\/\^?[A-Z][a-z]+ [a-z]+:/);
  });
});
