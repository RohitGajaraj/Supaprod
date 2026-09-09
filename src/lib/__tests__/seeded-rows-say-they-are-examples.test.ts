/**
 * A REAL WORKSPACE STARTS EMPTY. NOTHING IS INVENTED INTO IT.
 *
 * ── WHAT THIS FILE USED TO ASSERT, AND WHY THAT WAS THE SMALLER FIX ───────
 * Until 2026-09-03 it held that the rows onboarding wrote into a person's REAL
 * workspace were stamped `is_sample` and labelled as examples. That guard was
 * correct about its own subject and answered a smaller question than the one
 * that had been asked.
 *
 * The rows were invented: *"90% of sign-ups drop after day 1"*, *"Competitor
 * just launched push notifications"*, *"Premium tier at 8% conversion"* —
 * specific, alarming, numeric, and about a product the reader had told us
 * nothing about. `onboarding.functions.ts`'s own comment had already reached the
 * right diagnosis: *"for a product whose whole claim is that its judgement is
 * grounded in YOUR record, that reads as a faked demo."*
 *
 * A label says "this is an example". It does not stop Decide opening on four
 * bets nobody made, and it does not stop those rows being real enough for the
 * loop to pick up and spend money on.
 *
 * ── THE RULE NOW, FROM P-33 ───────────────────────────────────────────────
 * No placeholder that looks like data, and no number the workspace does not
 * have. Four fabricated percentages in a real workspace are both, so they are
 * not written at all. A full record is still worth showing somebody on their
 * first day — that is what the sample workspace is for, and it is honest because
 * it is somebody else's workspace and says so.
 *
 * This file now holds the stronger property, because a guard on the weaker one
 * would pass forever while the stronger one was broken.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/lib/onboarding.functions.ts", "utf8");
const stripped = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/**
 * `seedWorkspaceForTrack` ONLY — the handler that wrote the invented rows.
 *
 * `seedWorkspaceFromContext` further down this file also inserts signals, and it
 * must keep doing so: it calls a model with what the PERSON told us about their
 * own product and their own key metric, and writes what comes back. Those rows
 * are derived from the person's own words rather than invented about a product
 * we know nothing about, which is the whole distinction this file turns on.
 *
 * The first version of this guard asserted `not.toContain("signalRows")` over
 * the whole file and would have demanded the deletion of that one too.
 */
// The seed is a plain function since 2026-09-09 (seedWorkspaceCore, which
// openFirstRun runs on the request's own client); the server function that
// wrapped it is gone with FirstRun's seven-call press.
const code = stripped.slice(
  stripped.indexOf("export async function seedWorkspaceCore"),
  stripped.indexOf("export async function completeOnboardingCore"),
);

describe("onboarding writes no invented rows into a real workspace", () => {
  it("inserts no signals", () => {
    // The seeder's own insert, gone. Not disabled behind a flag — a flag is a
    // thing somebody turns back on without reading why it was turned off.
    expect(code.replace(/\s+/g, " ")).not.toContain('.from("signals") .insert(signalRows)');
    expect(code).not.toContain("signalRows");
  });

  it("inserts no opportunities", () => {
    expect(code).not.toContain("opportunityRows");
  });

  it("names none of the invented headlines anywhere it could still write one", () => {
    /*
     * The titles themselves, asserted directly. `track-seeds.ts` still holds
     * them — it is also read by the sample-workspace path, where they are
     * honest — so what matters is that the REAL-workspace seeder cannot reach
     * them.
     */
    for (const invented of [
      "90% of sign-ups drop after day 1",
      "Competitor just launched push notifications",
      "Premium tier at 8% conversion",
      "Users asking for offline mode",
    ]) {
      expect(code, `${invented} can still be written`).not.toContain(invented);
    }
  });

  it("reports zero rather than a count of rows it did not write", () => {
    /*
     * The subtler half. `noteMoment("data_connected", …)` and the handler's
     * return both carried `seed.signals.length`, which would have gone on
     * reporting 4 signals and 4 bets into the funnel forever — the same class of
     * claim the rows were removed for, surviving their removal.
     */
    expect(code).toContain("signals: 0,");
    expect(code).toContain("opportunities: 0,");
    expect(code).toContain("signalsCount: 0,");
    expect(code).toContain("opportunitiesCount: 0,");
    expect(code).not.toContain("seed.signals.length");
    expect(code).not.toContain("seed.opportunities.length");
  });

  it("does not label an empty container an example", () => {
    /*
     * `seed.projectName` is "Example: Mobile App Roadmap". That was honest while
     * the project held four example signals and four example bets. With those
     * gone it labels an EMPTY container as an example of nothing — a promise
     * larger than the old version's and with less behind it.
     *
     * `ensureDefaultProduct` already names a project after its workspace, so
     * that convention is reused rather than a second one invented.
     */
    expect(code).not.toContain("name: seed.projectName");
    expect(code).toContain('.from("workspaces")');
    expect(code).toContain("name: projectName");
  });

  it("still creates the workspace and the project, which are structure not data", () => {
    // THE GUARD ON THE GUARD. A version of this that deleted the whole seeder
    // would pass every assertion above and leave a person with no workspace at
    // all. What was removed is the invented CONTENT, not the container.
    expect(code).toContain("ensureDefaultWorkspace(supabase, userId)");
    expect(code).toContain('.from("projects")');
  });
});
