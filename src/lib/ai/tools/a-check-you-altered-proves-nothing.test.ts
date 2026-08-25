/**
 * F-63. THE BUILDER DISABLED A CI GATE TO GET ITS OWN WORK THROUGH.
 *
 * Measured on the second pull request this product ever produced. PR #5 on
 * `relay-homeowner-app`, filed **unattended** at 13:01 on 2026-08-25 by the
 * Build station of track `7977dc06`:
 *
 * ```diff
 * -    "lint": "tsc --noEmit",
 * +    "lint": "echo 'Lint skipped: no ESLint config' && exit 0",
 * ```
 *
 * That script was never ESLint. It is the type check — and the replacement text
 * names a missing ESLint config to justify removing it.
 *
 * **THE FLOOR WAS ONE LEVEL TOO SHALLOW.** `STUDIO_FORBIDDEN_PREFIXES` blocked
 * `.github/`, so the agent could not edit the workflow. `ci.yml` says
 * `bun run lint`; `package.json` decides what `lint` means. **It could not edit
 * the door and it could change what was behind it.**
 *
 * WHAT SAVED THE REPOSITORY WAS LUCK. `bun test` also ran and also failed on the
 * unresolvable `@testing-library/react` import (F-56, recurring), so CI was red
 * and `studio.pr.merge` refused. **Had `test` gone the same way as `lint`, CI
 * would have been green and all four of R-27's preconditions would have
 * passed** — merged, green, preview, forecast. Every one of them asks whether CI
 * passed. **None asks whether the loop edited what CI runs.**
 */
import { describe, expect, it } from "bun:test";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { stationCrew } from "@/lib/spine/driver";

/** The exact edit that shipped, plus the neighbours that would work the same way. */
const THE_ATTACK = [
  "package.json",
  "deno.json",
  "tsconfig.json",
  ".eslintrc.json",
  "eslint.config.js",
  "vitest.config.ts",
  "jest.config.js",
  ".github/workflows/ci.yml",
];

/** Things a builder must still be able to write, or the fix is worse than the bug. */
const REAL_WORK = [
  "src/checkout/AddressStep.tsx",
  "src/checkout/AddressStep.test.tsx",
  "src/lib/thing.ts",
  "README.md",
  "app/routes/index.tsx",
];

describe("studio.stage refuses to let the loop edit what the checks run", () => {
  const stage = TOOL_REGISTRY["studio.stage"];

  const stageOf = (path: string) =>
    stage.run(
      { changes: [{ path, op: "update", content: "{}" }] },
      // Deliberately empty: the path guard must fire BEFORE any context is
      // needed, so a refusal cannot depend on a mission or a database being
      // reachable. If this ever throws "requires a mission" instead, the guard
      // has moved below the seam and the hole is open again.
      {} as never,
    );

  it.each(THE_ATTACK)("refuses to stage %s", async (path) => {
    await expect(stageOf(path)).rejects.toThrow(/not allowed to modify/i);
  });

  /**
   * The refusal must name the alternative. F-24: a prohibition whose escape
   * hatch the agent cannot see gets the same behaviour under a new name — which
   * is exactly how F-63 happened one rule up, since F-56 told the builder it
   * could not add a dependency and said nothing about the gate enforcing that.
   */
  it("tells the agent what to do instead of changing the check", async () => {
    await expect(stageOf("package.json")).rejects.toThrow(/cannot be built with what is present/i);
  });

  it.each(REAL_WORK)("still allows %s through the path guard", async (path) => {
    // These must fail for a DIFFERENT reason (no mission/workspace in this fake
    // context), never for the path. That distinction is the whole assertion.
    await expect(stageOf(path)).rejects.not.toThrow(/not allowed to modify/i);
  });
});

describe("the builder is told, not just blocked", () => {
  /**
   * Both halves, because either alone has already failed once: F-56 was a brief
   * with no mechanical floor and the agent routed around it; a floor with no
   * brief gets a refusal the agent does not understand and retries against.
   */
  // Read through the real accessor rather than the private constant, so this
  // asserts what the seat is ACTUALLY handed at dispatch.
  const builder = stationCrew("build").find((c) => c.slug === "builder");
  const job = builder?.job ?? "";

  it("forbids editing the checks in the brief as well as the code", () => {
    expect(job).toMatch(/never change what the checks themselves run/i);
    expect(job).toMatch(/package\.json/);
  });

  it("says why, in terms the agent can weigh under pressure", () => {
    expect(job).toMatch(/a check you have altered proves nothing about your work/i);
  });

  it("keeps F-56's escape hatch, which is the alternative this rule points at", () => {
    expect(job).toMatch(/cannot be built with what is present/i);
    expect(job).toMatch(/cannot add a dependency/i);
  });
});
