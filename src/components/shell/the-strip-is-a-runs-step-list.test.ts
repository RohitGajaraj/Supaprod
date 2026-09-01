/**
 * THE STATION STRIP DRAWS INSIDE A RUN AND NOWHERE ELSE (2026-09-02).
 *
 * Founder decision, taken on measurements. The strip used to draw on every
 * signed-in surface as a 94.5px band -- 10.6% of a 900px viewport -- in which
 * four of seven chips carried nothing but a two-digit number and a word, and
 * the three that carried a fact contradicted the header 150px above them
 * ("68 decisions are ready for you" over "89+ runs waiting on you").
 *
 * F-146 had already written the remedy: "the fold: when the rail carries one
 * primary door and stations appear only as the step list inside a run, the
 * ambiguity has nowhere left to live."
 *
 * ── WHY THIS IS A TEST AND NOT JUST A DELETED LINE ────────────────────────
 * FOUR publishers still push a `nav` strip into the shell: `WorkspaceSpine`
 * mounted for the life of the session, plus `DiscoverSurface`, `InboxSurface`
 * and `Board` calling `useSpineStrip` directly. None of them was removed,
 * because a surface publishing what it is doing is not the defect -- rendering
 * a permanent band from it was.
 *
 * So the whole fold rests on ONE condition, and gating on `strip` alone would
 * put the band back on every screen with no error anywhere. The regression is
 * silent by construction: the band simply reappears, looking deliberate.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APPFRAME = readFileSync(fileURLToPath(new URL("./AppFrame.tsx", import.meta.url)), "utf8");

/** The render body, with comments stripped: this file's own comments quote the
 *  old condition while explaining it, and a guard that counted those would push
 *  the next author to delete the explanation. */
const CODE = APPFRAME.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the shell's station band", () => {
  it("renders only when a run published its own stages", () => {
    // The mode is the test. `strip ?` alone is the defect this guards.
    expect(CODE).toContain('{strip && strip.mode === "tab" ? (');
  });

  it("does not fall back to rendering whatever a workspace surface published", () => {
    // `{strip ? (` immediately before the band is the exact shape that shipped
    // the band on every screen for weeks.
    const bandAt = CODE.indexOf('className="sp-strip"');
    expect(bandAt).toBeGreaterThan(-1);
    const before = CODE.slice(Math.max(0, bandAt - 300), bandAt);
    expect(before).not.toMatch(/\{strip \? \(/);
  });

  it("still lets a workspace surface publish, because that is not the defect", () => {
    // If these stopped publishing, the live line's own mode check would lose the
    // signal it uses to decide whether it is a door or a status line.
    const spine = readFileSync(
      fileURLToPath(new URL("./use-spine-strip.ts", import.meta.url)),
      "utf8",
    );
    expect(spine).toContain("export function WorkspaceSpine()");
  });
});
