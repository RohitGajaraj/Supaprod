/**
 * The platform gate on tool policy.
 *
 * This replaces the migration-parity test that used to live in
 * src/lib/spine/tool-seed.test.ts. That one compared the registry against a SQL
 * seed, which was the right check against the wrong architecture: it proved
 * every user got a row, when the fix was to stop needing rows at all.
 *
 * Now the registry is the list and `TOOL_DEFAULTS` is the policy, so the gate is
 * between two things in the same language, checked before anything ships rather
 * than after every account is migrated. A tool registered without a default is
 * caught here, at build time, for every account that exists and every account
 * that ever will.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { TOOL_DEFAULTS, resolveToolAccess, UNLISTED_TOOL_DEFAULT } from "./defaults";

/**
 * Tool names in the registry, read as source.
 *
 * `registry.server.ts` cannot be imported here: it is worker-only and pulls in
 * the Supabase client, the AI runtime and every connector adapter. The whole
 * tools directory is scanned because the four `mission.*` tools are defined in
 * orchestrator.server.ts and merely imported into the registry array.
 */
function registeredTools(): string[] {
  const dir = join(process.cwd(), "src/lib/ai/tools");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .flatMap((f) => [
      ...readFileSync(join(dir, f), "utf8").matchAll(/\bdef\(\{\s*\n\s*name:\s*"([^"]+)"/g),
    ])
    .map((m) => m[1]);
}

describe("platform tool defaults", () => {
  it("has a policy for every registered tool", () => {
    const missing = registeredTools().filter((t) => !TOOL_DEFAULTS[t]);
    // If this fails: add the tool to TOOL_DEFAULTS. There is no migration to
    // write and no account to backfill; that is the point of the model.
    expect(missing).toEqual([]);
  });

  it("has no policy for a tool that does not exist", () => {
    const extra = Object.keys(TOOL_DEFAULTS).filter((t) => !registeredTools().includes(t));
    expect(extra).toEqual([]);
  });

  it("keeps every irreversible tool at review", () => {
    // The four a person cannot undo from inside the product: a live release, a
    // merge to the default branch, a revert of shipped code, and handing work to
    // an outside agent. `trust-ramp.ts` floors these independently, so this is
    // defence in depth; but a default that shipped one of them at `auto` would
    // be a boundary lowered by a code change nobody reads as a policy change.
    for (const tool of [
      "release.publish",
      "studio.pr.merge",
      "studio.revert",
      "delegate.openhands",
    ]) {
      expect(TOOL_DEFAULTS[tool]?.mode, `${tool} must default to review`).toBe("review");
    }
  });

  it("gives every station's own hands to an account with no rows at all", () => {
    // THE REGRESSION TEST FOR THE DEFECT. A brand new account, seeded by
    // nothing, must reach every tool the seven stations need to produce their
    // artifacts. This is what eleven of sixteen live accounts could not do.
    const access = resolveToolAccess(registeredTools(), []);
    const reachable = new Set(access.map((a) => a.tool_name));
    for (const tool of [
      "signals.log", // 01 Discover
      "research.synthesize",
      "decision.record", // 02 Decide
      "prd.draft", // 03 Plan
      "tasks.create",
      "design.draft", // 04 Design
      "studio.stage", // 05 Build
      "release.publish", // 06 Ship
      "learning.record", // 07 Learn
    ]) {
      expect(reachable.has(tool), `a new account cannot reach ${tool}`).toBe(true);
    }
  });

  it("obeys an account that turned something off", () => {
    const access = resolveToolAccess(
      ["prd.draft", "web.crawl"],
      [{ tool_name: "web.crawl", enabled: false }],
    );
    expect(access.map((a) => a.tool_name)).toEqual(["prd.draft"]);
  });

  it("treats a row with no opinion on enabled as available, never as a denial", () => {
    // The exact reading that caused the defect: an absent or null `enabled` must
    // not mean "you may not". A row that only carries a mode is an opinion about
    // the mode and nothing else.
    const access = resolveToolAccess(
      ["prd.draft"],
      [{ tool_name: "prd.draft", mode: "review", enabled: null }],
    );
    expect(access).toEqual([{ tool_name: "prd.draft", mode: "review" }]);
  });

  it("obeys an account's chosen mode over the platform default", () => {
    expect(TOOL_DEFAULTS["studio.stage"].mode).toBe("auto");
    const access = resolveToolAccess(
      ["studio.stage"],
      [{ tool_name: "studio.stage", mode: "review" }],
    );
    expect(access[0].mode).toBe("review");
  });

  it("never grants a tool the registry does not have, whatever is stored", () => {
    // A stale override row for a deleted tool must not resurrect it. The list is
    // the registry's; overrides only modulate what is already on it.
    const access = resolveToolAccess(
      ["prd.draft"],
      [{ tool_name: "tool.that.was.deleted", mode: "auto" }],
    );
    expect(access.map((a) => a.tool_name)).toEqual(["prd.draft"]);
  });

  it("falls back conservatively for a tool nobody wrote a policy for", () => {
    // Unreachable while the first test passes, kept because the runtime must not
    // throw if one ever slips through a hotfix.
    expect(UNLISTED_TOOL_DEFAULT.mode).toBe("confirm");
    const access = resolveToolAccess(["brand.new.tool"], []);
    expect(access).toEqual([{ tool_name: "brand.new.tool", mode: "confirm" }]);
  });
});

describe("risk floors stay above any earned record (governance canon)", () => {
  // These three were left gated on 2026-08-03 while three others graduated to auto on a
  // perfect approval record. The distinction is the point: a clean history earns
  // autonomy for reversible, internal work, and never for work that leaves the product
  // or cannot be undone. If a future change flips one of these to "auto", it should have
  // to delete this test and say why in the message.
  it("never lets a repo-touching or irreversible tool default to auto", () => {
    for (const tool of ["studio.commit", "github.issue.create", "studio.pr.merge"]) {
      expect(TOOL_DEFAULTS[tool]?.mode).not.toBe("auto");
    }
  });

  it("keeps the merge gate at review, the strictest mode", () => {
    // Its own record argues for it: 21 approvals against 7 genuine rejections, the only
    // tool a human actually overrules.
    expect(TOOL_DEFAULTS["studio.pr.merge"]?.mode).toBe("review");
  });
});
