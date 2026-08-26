/**
 * PHASE 3 Verification: Real-time visible agency
 *
 * This test demonstrates that:
 * 1. User can see current station indicator during run
 * 2. Transcript updates appear in real-time (not after 10s)
 * 3. Agent work is VISIBLE, not inferred
 */

import { test, expect } from "@playwright/test";

/*
 * GUARDED OFF BY DEFAULT (S4, 2026-08-26), same reasons as round-8.spec.ts:
 *
 * 1. THIS TEST IS A USER. It presses /start and "Run it now" unauthenticated-
 *    guard-free, creating a REAL spine_tracks row per run wherever :8080
 *    points. Six duplicate tracks starved the watched run this way on
 *    2026-08-25.
 *
 * 2. ITS VERDICT PRINTING IS THEATRE. The "MISSION GATE CONDITION: SATISFIED"
 *    block below logs success or failure without affecting pass/fail — the
 *    only real asserts are the last two lines. Same species as the deleted
 *    S0-001 tests' hardcoded "MISSION GATE MET".
 *
 * Its station detection (an "At X" region read) is better than round-8's
 * includes-over-the-whole-page, but .first() can mis-grab when several
 * sections match. Opt in only against a local server you started yourself:
 *   PHASE3_PRESS=yes bunx playwright test e2e/phase-3-visible-agency.spec.ts
 */
test.skip(
  process.env.PHASE3_PRESS !== "yes",
  "Creates a real track per run and its console verdict does not affect pass/fail; opt in explicitly with PHASE3_PRESS=yes.",
);

test("PHASE 3: Visible agency - real-time station updates", async ({ page }) => {
  console.log("\n════════════════════════════════════════════════════════");
  console.log("🔷 PHASE 3 VISIBLE AGENCY TEST");
  console.log("Goal: Founder watches autonomous loop with real-time visibility");
  console.log("════════════════════════════════════════════════════════\n");

  // Step 1: Navigate to /start
  console.log("📍 Step 1: Navigate to /start");
  await page.goto("http://localhost:8080/start", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  console.log("   ✓ Page loaded\n");

  // Step 2: Submit test sentence
  console.log("📍 Step 2: Submit test sentence");
  const sentence = "PHASE 3: Verify visible agency works";
  await page.locator("textarea").first().fill(sentence);
  console.log(`   ✓ Typed: "${sentence}"\n`);

  // Step 3: Create track
  console.log("📍 Step 3: Create track");
  await page.locator('button:has-text("Start")').click();
  await page.waitForURL(/\/track\/[a-z0-9\-]+/, { timeout: 15000 });
  const trackId = page.url().match(/\/track\/([a-z0-9\-]+)/)?.[1];
  console.log(`   ✓ Track created: ${trackId}\n`);

  // Step 4: Click "Run it now"
  console.log("📍 Step 4: Start autonomous run");
  const runStartTime = Date.now();
  await page.locator('button:has-text("Run it now")').first().click();
  console.log("   ✓ Clicked 'Run it now'\n");

  // Step 5: Monitor real-time updates
  console.log("📍 Step 5: Monitor real-time updates (up to 90 seconds)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let stationsObserved: string[] = [];
  let transcriptEntriesMax = 0;
  let lastStationSeen = null;

  for (let poll = 0; poll < 180; poll++) {
    // Check for current station header (PHASE 3 key feature)
    const stationRegion = await page
      .locator("section, [role='region']")
      .filter({ hasText: /At\s+(Discover|Decide|Plan|Design|Build|Ship|Learn)/ })
      .first()
      .textContent()
      .catch(() => null);

    if (stationRegion) {
      const match = stationRegion.match(/At\s+(Discover|Decide|Plan|Design|Build|Ship|Learn)/);
      const station = match?.[1];

      if (station && station !== lastStationSeen) {
        lastStationSeen = station;
        if (!stationsObserved.includes(station)) {
          stationsObserved.push(station);
          const elapsed = Math.round((Date.now() - runStartTime) / 1000);
          console.log(`  [${elapsed}s] 🔷 Entered station: ${station}`);
        }
      }
    }

    // Check transcript entries count
    const transcriptCount = await page
      .locator('[role="log"] li')
      .count()
      .catch(() => 0);
    if (transcriptCount > transcriptEntriesMax) {
      transcriptEntriesMax = transcriptCount;
      const elapsed = Math.round((Date.now() - runStartTime) / 1000);
      console.log(
        `  [${elapsed}s] 📝 Transcript entries: ${transcriptCount} (live update visible)`,
      );
    }

    // Check if run completed
    const completedMessage = await page
      .locator("text=/It reached the end|It stopped|completed/i")
      .first()
      .textContent()
      .catch(() => null);

    if (completedMessage) {
      const elapsed = Math.round((Date.now() - runStartTime) / 1000);
      console.log(`  [${elapsed}s] ✅ Run completed: "${completedMessage.trim()}"\n`);
      break;
    }

    await page.waitForTimeout(500);

    // Timeout safety
    if (poll === 179) {
      const elapsed = Math.round((Date.now() - runStartTime) / 1000);
      console.log(`\n  ⏱️  Test timeout after ${elapsed}s\n`);
      break;
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verification results
  console.log("📊 PHASE 3 VERIFICATION RESULTS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const results = {
    "Current station header visible": stationsObserved.length > 0,
    "Multiple stations visible": stationsObserved.length > 1,
    "Live transcript updates": transcriptEntriesMax > 0,
    "Autonomous execution": stationsObserved.length >= 3,
  };

  for (const [check, passed] of Object.entries(results)) {
    console.log(`${passed ? "✅" : "❌"} ${check}`);
  }

  console.log(`\n📍 Stations traversed: ${stationsObserved.join(" → ") || "none"}`);
  console.log(`📝 Transcript entries generated: ${transcriptEntriesMax}`);

  console.log("\n🎬 MISSION GATE QUESTION:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (stationsObserved.length > 3 && transcriptEntriesMax > 2) {
    console.log("✅ CAN YOU SEE THE AGENT WORKING?");
    console.log("   YES - Multiple stations visible in real-time");
    console.log("   YES - Transcript entries appearing live");
    console.log("   YES - Not waiting 10 seconds between updates");
    console.log("\n✅ MISSION GATE CONDITION: SATISFIED");
    console.log("   Founder watched autonomous loop on screen");
    console.log("   Agent work was VISIBLE, not inferred");
  } else {
    console.log("⚠️  LIMITED VISIBILITY");
    console.log(`   Stations: ${stationsObserved.length}`);
    console.log(`   Entries: ${transcriptEntriesMax}`);
  }

  console.log("\n════════════════════════════════════════════════════════\n");

  // Assert core requirement
  expect(stationsObserved.length).toBeGreaterThan(2);
  expect(transcriptEntriesMax).toBeGreaterThan(0);
});
