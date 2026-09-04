/**
 * A CLAIM IS NOT A LOCKED DOOR, AND THE GATE MUST NOT ASK FOR ONE.
 *
 * The claim hold was established behind `refusedTool`, which is F-41's
 * CREDENTIAL detector. A `BuilderFileConflict` carries no 401, no 403, no
 * "forbidden" and no "not configured", so that function returns null for every
 * claim there has ever been -- and the branch that reads the claim was gated on
 * its result. The condition was unsatisfiable, and track `2fdf93b6` proved it
 * live: six claim refusals between 2026-09-02 22:00 and 2026-09-03 01:00,
 * `waiting-on-another-run` never written once, terminal park at
 * `going-in-circles` on the twelfth drive.
 *
 * These hold the property that made it dead -- the two detectors are disjoint --
 * and then hold the new path against the exact pair of refusals the live drive
 * recorded, in the order it recorded them.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { refusedTool } from "@/lib/spine/driver";
import { claimRefusalIn, refusalIsAClaimedPath } from "@/lib/spine/refusal-kind";
import { claimedPathRefusal } from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";

/** The claim as the tool actually stamps it, composed by the one writer. */
const CLAIM_ERROR =
  "BuilderFileConflict: " +
  claimedPathRefusal({
    path: "src/checkout/AddressStep.tsx",
    missionTitle: "Work declined due to missed forecast",
  });

/** What `studio.stage` refused first on that same drive, before the claim. */
const DEPENDENCY_ERROR =
  "Refused: @testing-library/react is imported by this change and is not in " +
  "the repository's package.json, so the checks cannot run.";

const step = (name: string, error: string) => ({
  kind: "tool_call",
  name,
  status: "error",
  error,
});

/** The live drive, in recorded order: the dependency refusal, then the claim. */
const LIVE_STEPS = [step("studio.stage", DEPENDENCY_ERROR), step("studio.commit", CLAIM_ERROR)];

describe("the two detectors are disjoint, which is why composing them was dead", () => {
  it("a claim refusal is a claimed path", () => {
    expect(refusalIsAClaimedPath("studio.commit", CLAIM_ERROR)).toBe(true);
  });

  it("and the credential detector cannot see it, alone or in company", () => {
    expect(refusedTool([step("studio.commit", CLAIM_ERROR)])).toBeNull();
    expect(refusedTool(LIVE_STEPS)).toBeNull();
  });

  it("so no claim refusal can ever satisfy both, which is the whole defect", () => {
    const viaCredentialDetector = refusedTool(LIVE_STEPS);
    expect(
      viaCredentialDetector === null ||
        !refusalIsAClaimedPath(viaCredentialDetector.tool, viaCredentialDetector.error),
    ).toBe(true);
  });
});

describe("asking for a claim finds the claim", () => {
  it("finds it on the live steps, behind an earlier refusal of another kind", () => {
    const found = claimRefusalIn(LIVE_STEPS);
    expect(found?.tool).toBe("studio.commit");
    expect(found?.error).toContain("AddressStep.tsx");
  });

  it("is not satisfied by the first failure of any kind", () => {
    // The defect one layer along: a `refusedTool` widened to return the first
    // failure would hand back the dependency error and miss the claim entirely.
    expect(claimRefusalIn([step("studio.stage", DEPENDENCY_ERROR)])).toBeNull();
  });

  it("ignores a failure that is not a refusal at all", () => {
    expect(
      claimRefusalIn([{ kind: "tool_call", name: "repo.read", status: "ok", error: null }]),
    ).toBeNull();
  });

  it("only trusts the tools that write claims", () => {
    expect(claimRefusalIn([step("some.other.tool", CLAIM_ERROR)])).toBeNull();
  });
});

describe("the driver establishes the hold without going through the credential detector", () => {
  /*
   * Comments are stripped FIRST. The explanation of this defect necessarily
   * quotes the shape it forbids, and a guard that fails on the prose explaining
   * it teaches the next person to delete the explanation.
   */
  const code = readFileSync("src/lib/spine/driver.server.ts", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  it("never tests a credential refusal for being a claimed path", () => {
    expect(/refusalIsAClaimedPath\s*\(/.test(code)).toBe(false);
  });

  it("asks for the claim by name, and falls back to the record", () => {
    /*
     * The ORDER is the rule -- in-memory first because it is free, the record
     * second because F-41 measured the in-memory steps not arriving twice on a
     * live 401. Matched as a shape rather than as a literal argument list: the
     * first draft of this pinned `(supabase, traceIds)` and broke the moment the
     * read learned to name its workspace, which is a guard failing on a change
     * that improved the thing it guards.
     */
    expect(code).toMatch(/claimRefusalIn\(steps\)\s*\?\?\s*\(await claimRefusalInTraces\(/);
  });
});
