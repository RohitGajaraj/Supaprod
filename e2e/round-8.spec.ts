/**
 * Round 8: Complete Autonomous End-to-End Execution Test
 *
 * This test executes the critical path for Supaprod:
 * 1. Navigate to /start
 * 2. Submit one sentence
 * 3. Watch track progress through all 7 stations autonomously
 * 4. Approve merge when Build station asks
 * 5. Verify Learn station is reached
 */

import { test, expect } from "@playwright/test";
import { login, waitForShell, takeScreenshot } from "./helpers/auth";

test.describe("Round 8: Autonomous End-to-End Execution", () => {
  test("complete 7-station track execution", async ({ page }) => {
    /*
     * GUARDED OFF PRODUCTION (A, 2026-08-25 16:1x UTC), two reasons on the record:
     *
     * 1. THIS TEST IS A USER. It signs into production and presses the real
     *    /start composer, creating a REAL spine_tracks row per run. Six
     *    duplicate tracks landed in the observation workspace in 14 minutes
     *    on 2026-08-25 (15:23–15:37), consumed the sweep's shared 45s tick
     *    window, and starved the one genuinely loop-driven track.
     *
     * 2. ITS VERDICT IS FALSE BY CONSTRUCTION. Station "progress" is
     *    `pageContent.includes(station)` — and the spine strip renders all
     *    seven station names on every track page, so `visited` reaches 7/7
     *    on the first poll no matter what the track does. The two tracks
     *    this spec once cited as "confirmed through all 7 stations"
     *    (d368d289, 214f17ee) died at sense, abandoned. A test that cannot
     *    fail proves nothing; do not cite its output.
     *
     * Run it only deliberately, against a field you own:
     *   ROUND8_PRESS_PRODUCTION=yes bunx playwright test e2e/round-8.spec.ts
     */
    test.skip(
      process.env.ROUND8_PRESS_PRODUCTION !== "yes",
      "Creates a real production track per run and its station detection cannot fail; opt in explicitly with ROUND8_PRESS_PRODUCTION=yes.",
    );
    // Step 1: Login
    console.log("\n[ROUND 8] Logging in...");
    const success = await login(page);
    expect(success).toBe(true);
    // NOTE: Do NOT call waitForShell here. /start is an "isOnboarding" route
    // (line 127, _authenticated.tsx), so it renders <Outlet /> directly without
    // <AppFrame>. The <main> element doesn't exist on /start, so waitForShell
    // would timeout. We explicitly navigate to /start next, so a shell isn't needed.

    // Step 2: Navigate to /start
    console.log("[ROUND 8] Navigating to /start...");
    await page.goto("/start", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000); // Wait for React hydration

    // Verify we're on the start page (check for "What needs doing" or similar)
    const pageContent = await page.content();
    expect(pageContent).toContain("needs doing");
    await takeScreenshot(page, "round8-01-start-page", "round8");

    // Step 3: Type the test sentence
    console.log("[ROUND 8] Typing test sentence...");
    const sentence = "Round 8: Complete autonomous end-to-end execution test";

    // Find the composer field - try multiple selectors
    const composerField = page.locator("textarea").first();
    await composerField.click({ timeout: 5000 });
    await composerField.fill(sentence);
    await takeScreenshot(page, "round8-02-sentence-typed", "round8");

    // Step 4: Submit the form
    console.log("[ROUND 8] Submitting track...");
    // Find submit button - look for any visible button that might submit
    const buttons = await page.locator("button").all();
    let submitted = false;

    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && (text.includes("Submit") || text.includes("Send") || text.includes("Start"))) {
        await btn.click({ timeout: 5000 });
        submitted = true;
        break;
      }
    }

    if (!submitted) {
      // Try pressing Enter if there's a composer field
      await composerField.press("Enter");
    }

    // Wait for redirect to track page
    console.log("[ROUND 8] Waiting for track creation...");
    await page.waitForURL(/\/track\/[a-z0-9-]+/, { timeout: 30000 });
    const trackUrl = page.url();
    const trackId = trackUrl.match(/\/track\/([a-z0-9-]+)/)?.[1];
    console.log(`[ROUND 8] Track created: ${trackId}`);
    expect(trackId).toBeTruthy();

    // Navigate with start=true
    await page.goto(`/track/${trackId}?start=true`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "round8-03-track-created", "round8");

    // Step 5: Monitor station progression
    console.log("\n[ROUND 8] Monitoring station progression...\n");

    const stations = ["sense", "decide", "define", "design", "build", "ship", "learn"];
    const visited = new Set<string>();
    let currentStation = "sense";
    const startTime = Date.now();
    const maxTime = 25 * 60 * 1000;
    let gateApproved = false;

    while (Date.now() - startTime < maxTime) {
      const pageContent = await page.content();
      let foundStation = false;

      // Check for each station in the page content
      for (const station of stations) {
        if (pageContent.toLowerCase().includes(station)) {
          if (!visited.has(station)) {
            visited.add(station);
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const idx = stations.indexOf(station) + 1;
            console.log(`✓ Station ${idx}/7: ${station.toUpperCase()} [${elapsed}s]`);

            // Take a screenshot at each station
            await takeScreenshot(page, `round8-station-${idx}-${station}`, "round8");
            foundStation = true;
          }
          currentStation = station;
        }
      }

      // Check for gate/approval buttons
      if (!gateApproved && pageContent.toLowerCase().includes("merge")) {
        console.log("[ROUND 8] Merge gate detected - approving...");
        const mergeBtn = page
          .locator('button:has-text("Merge"), button:has-text("Approve")')
          .first();
        if (await mergeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await mergeBtn.click();
          gateApproved = true;
          console.log("[ROUND 8] Merge approved");
          await takeScreenshot(page, "round8-merge-approved", "round8");
        }
      }

      // Check if we've reached learn
      if (visited.has("learn")) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`\n✅ SUCCESS: Reached Learn station in ${elapsed}s`);
        console.log(`   Stations: ${Array.from(visited).join(" → ")}`);
        await takeScreenshot(page, "round8-complete", "round8");
        break;
      }

      await page.waitForTimeout(2000);
    }

    // Verify all stations were reached
    expect(visited.has("learn")).toBe(true);
    expect(visited.size).toBeGreaterThanOrEqual(5); // At least sense -> learn path
  });
});
