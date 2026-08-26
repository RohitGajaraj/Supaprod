/**
 * THE WAY OUT OF A REFUSED COMMIT IS IN THE BRIEF (F-88, 2026-08-26).
 *
 * ── THE SAME DEFECT AS F-36, ONE TOOL LATER ────────────────────────────────
 * F-36's own note in `driver.ts` ends: *"the permission has existed since July
 * and no station was ever told the tool was there."* That was `studio.commit`.
 *
 * `studio.unstage` is that sentence again. It exists
 * (`registry.server.ts:2477`), it is `mode: "auto"` and enabled
 * (`defaults.ts:174`) so the builder may call it without asking, and its own
 * description says exactly what it is for: *"THIS IS THE WAY OUT when
 * studio.commit refuses a staged path it is not allowed to write."*
 *
 * **No station brief mentioned it.** Built, permitted, unreachable — the
 * `TrackActivity` pattern one layer up, where a thing exists and nothing tells
 * the party who needs it.
 *
 * ── WHAT IT COST, AND IT IS STILL COSTING IT ───────────────────────────────
 * F-63's floor refuses a commit that would write CI config, a lockfile, or the
 * manifest defining what the checks run. A builder refused there, with no idea
 * the escape exists, leaves the path staged — and then **the changeset is
 * trapped**: every later `studio.commit` refuses it the same way, forever.
 *
 * Changeset `f9354439` has been stuck there since 2026-08-25 13:01. That is why
 * track `7977dc06` — entry `sense`, `waived='[]'`, **two stations from the first
 * acceptance this product has ever recorded** — sits at `ship` behind a PR that
 * was never merged.
 *
 * **A refusal a station cannot act on is not a floor, it is a wall.** R-26 says a
 * refused station is not a failed station; it does not say a refused station must
 * be a stuck one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const DRIVER = read("./driver.ts");
const REGISTRY = read("../ai/tools/registry.server.ts");
const DEFAULTS = read("../ai/tools/defaults.ts");

describe("the builder is told the escape exists", () => {
  it("the file-brief names studio.unstage as the answer to a refused commit", () => {
    // The brief a builder reads when it is about to stage. If the escape is not
    // here, it is nowhere the agent will look at the moment it is refused.
    const at = DRIVER.indexOf("Call studio.stage with the change you made");
    expect(at).toBeGreaterThan(-1);
    const brief = DRIVER.slice(at, at + 1200);
    expect(brief).toContain("studio.unstage");
    expect(brief).toContain("REFUSES");
  });

  it("the finish instruction names it too, since that is where the chain is described", () => {
    const at = DRIVER.indexOf("Finish by calling studio.stage");
    expect(at).toBeGreaterThan(-1);
    const brief = DRIVER.slice(at, at + 1200);
    expect(brief).toContain("studio.unstage");
  });

  it("both say WHY, not just the tool name", () => {
    // "Call studio.unstage" alone is a command. The cost is what makes a rule
    // survive pressure — the same argument the job-brief above it makes.
    const at = DRIVER.indexOf("Call studio.stage with the change you made");
    const brief = DRIVER.slice(at, at + 1200);
    expect(brief).toMatch(/traps? the whole changeset/i);
  });
});

describe("the escape is real, so the brief is not promising a tool that is not there", () => {
  it("studio.unstage exists in the registry", () => {
    expect(REGISTRY).toContain('name: "studio.unstage"');
  });

  it("and the builder may call it without asking a person", () => {
    // If it were gated on approval, telling the builder to call it mid-refusal
    // would swap a trapped changeset for a queued approval — 90 of which died
    // detached from their work. `auto` is what makes this an escape rather than
    // a second wall.
    const at = DEFAULTS.indexOf('"studio.unstage"');
    expect(at).toBeGreaterThan(-1);
    expect(DEFAULTS.slice(at, at + 120)).toContain('mode: "auto"');
    expect(DEFAULTS.slice(at, at + 120)).toContain("enabled: true");
  });
});
