/**
 * ── A DRAWING FILED TWICE IS ONE DRAWING ─────────────────────────────────────
 *
 * Measured on production 2026-09-09 (Lane 2): of 59 prototypes filed on
 * tracks, 36 are distinct and 23 are byte-identical copies of another version
 * of the same thing, filed about eighteen seconds apart, once by the designer
 * and once by the critic reviewing it. The run screen counted ten prototypes
 * over three designs, and every count reading `spine_track_members` inherited
 * it. `design.draft` decides sameness now: same name, same description, same
 * spec means the drawing is already on the record, so nothing is filed and
 * the drawing that is there is returned. A changed word is a new version and
 * still files, because deciding how much change makes a version is not a
 * decision a write path may take.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const REGISTRY = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
const DRIVER = readFileSync("src/lib/spine/driver.ts", "utf8");

const draft = (() => {
  const at = REGISTRY.indexOf('name: "design.draft"');
  expect(at, "design.draft is gone; re-point this guard").toBeGreaterThan(-1);
  const next = REGISTRY.indexOf("const learningRecord = def(", at);
  return REGISTRY.slice(at, next === -1 ? at + 8000 : next);
})();

describe("a drawing filed twice is one drawing", () => {
  it("looks for the same drawing on the same spec before it writes", () => {
    expect(draft).toContain('.eq("name", a.name)');
    expect(draft).toContain('.eq("description", a.description)');
    expect(draft).toContain('.eq("prd_id", a.prd_id ?? null)');
    // The look happens BEFORE the insert, or it is not a guard.
    expect(draft.indexOf('.eq("description", a.description)')).toBeLessThan(
      draft.indexOf(".insert({"),
    );
  });

  it("files nothing on a twin, and returns the drawing that is already there", () => {
    expect(draft).toContain("if (twin) {");
    expect(draft).toContain("prototype_id: existingId");
    expect(draft).toContain("filed: false");
    expect(draft).toContain("already on the record, unchanged");
  });

  it("says which of the two happened, so a reader is never guessing", () => {
    expect(draft).toContain("filed: true");
  });

  it("the critic is told to judge, not to re-file what it read", () => {
    const at = DRIVER.indexOf('"design-critic": {');
    expect(at).toBeGreaterThan(-1);
    const seat = DRIVER.slice(at, DRIVER.indexOf("},", DRIVER.indexOf("file:", at)));
    expect(seat).toContain("Call critic.evaluate on the spec");
    expect(seat).toContain("ONLY if the design itself must change");
    expect(seat).toContain("is not a critique of it");
  });
});
