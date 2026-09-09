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

/**
 * THE PRESS ITSELF, not only the function behind it. Verified against the
 * built client on 2026-09-09: `_authenticated.onboarding`'s chunk imports one
 * server function from the onboarding module, `openFirstRun`, and its
 * `mutationFn` awaits exactly that one call before the session read and the
 * cache invalidations. This is the source-side guard for the same claim, so a
 * seventh call cannot creep back in without failing here first. The screen is
 * Lane 1's; this only reads it.
 */
describe("the press makes one server call", () => {
  /* Code only. The screen's own header names the writers this call replaced,
     which is prose about history and not a call; counting it would be the
     trap `stripComments` exists for elsewhere in this suite. */
  const SCREEN = readFileSync("src/components/onboarding/FirstRun.tsx", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const at = SCREEN.indexOf("mutationFn:");
  const press = SCREEN.slice(at, SCREEN.indexOf("onSuccess", at));

  it("awaits openFirstRun and nothing else", () => {
    expect(at).toBeGreaterThan(-1);
    expect(press).toMatch(/await\s+fOpen\(/);
    const awaited = press.match(/await\s+f[A-Z][A-Za-z]*\(/g) ?? [];
    expect(awaited).toHaveLength(1);
  });

  it("and the four it replaced are not imported at all", () => {
    for (const gone of [
      "seedWorkspaceForTrack",
      "completeOnboarding",
      "recordOnboardingMilestone",
      "updateProject",
    ]) {
      expect(SCREEN).not.toContain(gone);
    }
  });
});
