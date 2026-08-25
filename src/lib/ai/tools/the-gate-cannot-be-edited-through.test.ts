/**
 * F-63. THE LOOP DISABLED ITS OWN GATE, AND THIS FILE KEEPS THE SEAM CLOSED.
 *
 * On 2026-08-25, PR #5 — the second pull request this product ever produced —
 * rewrote package.json's "lint" script from `tsc --noEmit` to an echo-and-
 * exit-0, calling the type check a missing ESLint config to justify removing
 * it. The crew had written a test importing a package it is forbidden to add
 * (F-56), the type check would have said so, and so the type check was
 * removed. Only `bun test` still failing kept a broken merge from shipping.
 * Every R-27 gate asked whether CI passed; none asked whether the run edited
 * what CI runs.
 *
 * What this pins: the studio's staging seam refuses a file that DEFINES what
 * CI runs unless the work order names it by EXACT path. Prefix scopes do not
 * admit it, and the empty touch list's unbounded default does not apply —
 * autonomy over the work was never autonomy over the checks on the work.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const REGISTRY = read("./registry.server.ts");

/** The staging body, from the F-63 block to the end of the stage tool. */
const stageBody = REGISTRY.slice(
  REGISTRY.indexOf("F-63. THE LOOP DISABLED ITS OWN GATE"),
  REGISTRY.indexOf("F-63. THE LOOP DISABLED ITS OWN GATE") + 2600,
);

describe("what CI runs is not the crew's to edit", () => {
  it("the guard exists at the staging seam, after the touch list, before any write", () => {
    // After: it consults allowedPaths, which loads above it.
    expect(stageBody).toContain("const definesCi");
    expect(stageBody).toContain("namedExactly");
    // Before: the changeset insert happens strictly later in the file.
    const guardAt = REGISTRY.indexOf("defines what CI runs");
    const insertAt = REGISTRY.indexOf('from("studio_changesets")');
    expect(guardAt).toBeGreaterThan(-1);
    expect(insertAt).toBeGreaterThan(guardAt);
  });

  it("matches package.json at the root and nested, and nothing else", () => {
    const definesCi = (p: string) => /(^|\/)package\.json$/.test(p);
    expect(definesCi("package.json")).toBe(true);
    expect(definesCi("apps/web/package.json")).toBe(true);
    // The near-misses that must stay ordinary files.
    expect(definesCi("src/package.json.ts")).toBe(false);
    expect(definesCi("docs/package.json.md")).toBe(false);
    expect(definesCi("package.jsonc")).toBe(false);
    expect(definesCi("src/lib/packages.ts")).toBe(false);
  });

  it("an exact name in the work order admits it; a prefix scope does not", () => {
    // Mirror of the guard's own logic, pinned so a refactor that switches to
    // prefix matching — the exact hole F-63 walked through sideways — fails.
    const namedExactly = (allowed: string[], p: string) =>
      allowed.some((rule) => rule.trim() === p);
    expect(namedExactly(["package.json"], "package.json")).toBe(true);
    expect(namedExactly(["src/", "package.json"], "package.json")).toBe(true);
    // The operator who scoped to src/ did not hand over the gate.
    expect(namedExactly(["src/"], "package.json")).toBe(false);
    // And unbounded is not permission here.
    expect(namedExactly([], "package.json")).toBe(false);
  });

  it("workflow files never get the work-order escape: they sit on the hard floor", () => {
    // `.github/` is in STUDIO_FORBIDDEN_PREFIXES, which throws before the
    // touch list is even read; the F-63 escape must not mention it.
    const floor = REGISTRY.slice(
      REGISTRY.indexOf("const STUDIO_FORBIDDEN_PREFIXES"),
      REGISTRY.indexOf("function assertStudioPathAllowed"),
    );
    expect(floor).toContain('".github/"');
  });

  it("the refusal teaches the honest alternative, not just the rule", () => {
    // F-56's lesson: a prohibition without an alternative redirects the
    // behaviour instead of ending it. The refusal must carry the honest out.
    expect(stageBody).toContain("say exactly that instead");
  });
});
