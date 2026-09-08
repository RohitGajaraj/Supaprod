/**
 * ── A FIRST RUN OPENS IN ONE CALL ────────────────────────────────────────────
 *
 * "Open Supaprod" on FirstRun ran seven authenticated server functions one
 * after another, each a Worker round trip (Lane 1's fourth review,
 * 2026-09-09). `openFirstRun` is the same work in one call: the name and
 * the seed together, everything keyed on the seed together, then the
 * completion. This pins the shape so the door cannot quietly grow a hop.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/lib/onboarding.functions.ts", "utf8");
const at = SRC.indexOf("export const openFirstRun");
const next = SRC.indexOf("\nexport ", at + 1);
const DOOR = SRC.slice(at, next === -1 ? undefined : next);

describe("a first run opens in one call", () => {
  it("exists, and seeds with the plain seed function on the request's client", () => {
    expect(at).toBeGreaterThan(-1);
    expect(DOOR).toContain("seedWorkspaceCore(supabase, userId, data.track as OnboardingTrack)");
    expect(DOOR).not.toContain("seedWorkspaceForTrack(");
  });

  it("runs the seed with the name, and everything keyed on the seed together", () => {
    // Two barriers, not seven: the first carries the seed and the name, the
    // second the workspace's name, the milestone, the product's name and the
    // positioning line.
    const barriers = DOOR.match(/await Promise\.all\(\[/g) ?? [];
    expect(barriers.length).toBe(2);
    expect(DOOR).toContain('.from("workspaces")');
    expect(DOOR).toContain('moment: "product_named"');
    expect(DOOR).toContain('.from("projects").update({ name: data.productName })');
    expect(DOOR).toContain('kind: "positioning"');
  });

  it("ends with the completion, which claims the starter runs and returns at once", () => {
    expect(DOOR).toContain("await completeOnboardingCore(supabase, userId, projectId);");
    expect(DOOR.indexOf("await completeOnboardingCore(")).toBeGreaterThan(
      DOOR.lastIndexOf("await Promise.all(["),
    );
    expect(DOOR).toContain("return { workspaceId, projectId, productId: projectId, alreadySeeded");
  });

  it("calls no nested server function of its own", () => {
    for (const nested of [
      "updateProfile(",
      "renameWorkspace(",
      "updateProject(",
      "upsertBriefItem(",
      "recordOnboardingMilestone(",
      "completeOnboarding(",
    ]) {
      expect(DOOR).not.toContain(nested);
    }
  });
});
