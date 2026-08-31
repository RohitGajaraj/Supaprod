import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE EXPORT CALLED ITSELF "THE WHOLE WORKSPACE" AND IS NOT.
 *
 * WHAT IT ACTUALLY RETURNS. `exportWorkspace` (`lib/projects.functions.ts`)
 * builds sixteen named collections. The database has **174 tables in `public`**.
 * Most of the remainder is machinery nobody would expect in an export, and two
 * parts of it are not: **`agent_approvals` (326 rows) and `guardrail_hits`
 * (8,535 rows)** — every boundary call a person answered, and every rule that
 * stopped an agent. Measured 2026-08-31.
 *
 * WHY IT MATTERS MORE HERE THAN ALMOST ANYWHERE. Data portability is the first
 * thing an enterprise security reviewer checks, and the audit trail is the first
 * thing they ask to take. It is also the other half of gap #19, shipped earlier
 * the same day: `decided_by` now reaches the boundary surface so a person can
 * see who answered, and that answer still cannot leave the product.
 *
 * THE SHAPE, WHICH IS THE THIRD INSTANCE TODAY. The enumeration under the
 * heading was always accurate about the file's contents; the heading promised a
 * totality the enumeration never claimed. Same as the notifications page
 * (U-S3-021) and the concurrency cap (U-S3-026): **a true detail under a false
 * headline.**
 *
 * WHAT THIS TEST DOES NOT DO. It does not assert the replacement wording, per
 * SESSION-3's trap: *"Pin the claim, not the spelling."* It asserts that the
 * totality claim is gone, that the honest caveat is present while the omission
 * is real, and that the anti-lock-in promise — a different and true claim —
 * survived the edit.
 *
 * DELETE THIS WHEN THE EXPORT WIDENS. The caveat is written to be removed in the
 * same commit that adds the tables
 * (`coordination/requests/S3/the-export-is-not-the-audit-trail.md`). Until then
 * a passing test here means the surface and the server still agree.
 */

const ROOT = join(import.meta.dir, "..", "..");
const SECTION = readFileSync(join(ROOT, "components/settings/DataSection.tsx"), "utf8");
const SERVER = readFileSync(join(ROOT, "lib/projects.functions.ts"), "utf8");

/** Comments quote the retired heading; assertions read code only. */
/* F-159 corollary: a JSX comment comes out WITH its braces. Stripping the
   block form alone leaves `{` and `}` behind, and a comment above a
   protected line then puts a brace between a `>` and the word a matcher
   wants. That silently disabled this lane's rename guard until a mutation
   test caught it, so every guard here strips the JSX form first. */
const code = (s: string) =>
  s
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const UI = code(SECTION);
const SRV = code(SERVER);

/** The handler body, so a mention in another export function cannot satisfy us. */
const EXPORT_HANDLER = (() => {
  const start = SRV.indexOf("export const exportWorkspace");
  expect(start).toBeGreaterThan(-1);
  return SRV.slice(start, SRV.indexOf("export const", start + 40));
})();

describe("the export surface does not promise what the file omits", () => {
  it("has retired the totality heading", () => {
    expect(UI).not.toContain("The whole workspace, as one JSON file");
  });

  /**
   * The caveat is only honest while the omission is real. If somebody adds the
   * approvals to the export and forgets this line, the surface starts
   * UNDERSTATING the product, which is its own kind of wrong.
   */
  it("names the audit-trail gap for exactly as long as the gap exists", () => {
    const exportsApprovals = EXPORT_HANDLER.includes("agent_approvals");
    const saysItDoesNot = UI.includes("not the full audit trail");
    expect(saysItDoesNot).toBe(!exportsApprovals);
  });

  it("still keeps the anti-lock-in promise, which is a different claim and true", () => {
    expect(UI).toContain("No selection, no lock-in");
  });

  /**
   * Both branches of the sub-line render, one with the closed counts and one
   * without, and an earlier version of this surface fixed a bug in exactly that
   * split. The caveat has to be in both or the claim depends on whether a
   * count happened to load.
   */
  it("says it in both branches, not only the one with counts", () => {
    const occurrences = UI.split("not the full audit trail").length - 1;
    expect(occurrences).toBe(2);
  });
});

describe("what the export actually reads, pinned so a silent narrowing is visible", () => {
  it("still carries the decision record, which it once did not", () => {
    for (const table of ["decisions", "spine_tracks", "spine_track_members"]) {
      expect(EXPORT_HANDLER).toContain(table);
    }
  });

  /**
   * THREE READS ARE USER-SCOPED INSIDE A BLOCK WHOSE COMMENT SAYS THEY ARE NOT,
   * and all three tables have a `workspace_id`. In a multi-member workspace a
   * member's export silently omits their colleagues' rows. Filed as ask 1 to S0;
   * one of twenty-one workspaces has more than one member today, which is why it
   * has not bitten yet.
   *
   * This test PINS THE CURRENT STATE rather than asserting the fix, so that when
   * S0 changes it this fails and whoever changed it has to come back here and
   * decide whether the surface now needs to say something different. That is the
   * point: the copy and the scoping have to move together.
   */
  it("records the user-scoped reads, so fixing them forces a look at the copy", () => {
    expect(EXPORT_HANDLER).toContain(
      '.from("studio_changesets").select("*").eq("user_id", userId)',
    );
    expect(EXPORT_HANDLER).toContain('.from("deployments").select("*").eq("user_id", userId)');
  });
});
