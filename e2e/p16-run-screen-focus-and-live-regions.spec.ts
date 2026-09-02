/**
 * P-16 (A-QUEUE.md): accessibility on the run screen, `/track/:id`, and on
 * `/start`.
 *
 * NEVER CREATES A TRACK. `round-8.spec.ts`'s own header records why: pressing
 * `/start` for real writes a live `spine_tracks` row against the shared demo
 * workspace, and six duplicate tracks from exactly that starved a shared sweep
 * on 2026-08-25. This spec opens whatever track already exists in the seed
 * workspace and reads it -- it is a reader, never a writer, and every test
 * skips rather than fabricates a fixture when the workspace has nothing to
 * read (no open track, no pending gate). A skip here is a true "nothing to
 * check right now", not a failure hidden as one.
 *
 * WHAT THIS PINS, and why each is a regression a source-only test cannot see:
 *
 *   1. The right pane's output region is `role="region"` with a real name, not
 *      Meridian's `role="tabpanel"`. `ArtifactPane.tsx`'s tab row and then its
 *      replacement strip were both removed (see that file's own header); a
 *      `tabpanel` with no `tablist` anywhere on the page is an orphaned ARIA
 *      role, found live by A1 on 2026-09-02 21:40. `tsc`/`bun test` cannot see
 *      an ARIA role at all -- only a real accessibility tree can.
 *   2. The transcript is `role="log"` with `aria-live="polite"`, so a screen
 *      reader hears a new turn land without polling the page. Already built
 *      (`TrackActivity.tsx`); pinned here so a future refactor cannot drop it
 *      silently, the same reason every other line in this file exists.
 *   3. A pending gate -- "the ask" -- already holds keyboard focus the moment
 *      it renders (`TrackConsent.tsx`, this packet). Source tests can prove
 *      the `.focus()` call exists; only a real DOM can prove `document
 *      .activeElement` actually moved.
 *   4. `/start`'s "Your runs" list (P-05) is `aria-live="polite"` inside a
 *      labelled region, so a screen reader hears a row change (a run finishes,
 *      a gate opens) without polling. Same class of proof as #2: `bun test`
 *      can see the JSX has the attribute, only a real accessibility tree can
 *      see the computed ARIA role and live-region politeness a reader acts on.
 */
import { test, expect } from "@playwright/test";
import { login, waitForShell } from "./helpers/auth";

/** Opens whatever track the seed workspace already has, or skips the test. */
async function openAnExistingTrack(page: import("@playwright/test").Page): Promise<boolean> {
  const loggedIn = await login(page);
  expect(loggedIn, "seed workspace login").toBe(true);

  await page.goto("/start", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000); // hydration, same allowance round-8 uses

  const trackLink = page.locator('a[href^="/track/"]').first();
  const hasTrack = await trackLink.isVisible().catch(() => false);
  if (!hasTrack) return false;

  await trackLink.click();
  await page.waitForURL(/\/track\//, { timeout: 15000 });
  await waitForShell(page);
  return true;
}

test.describe("P-16: the run screen's live regions and the ask's focus", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the output pane is a named region, not an orphaned tabpanel", async ({ page }) => {
    const opened = await openAnExistingTrack(page);
    test.skip(!opened, "Seed workspace has no open track to read right now.");

    // The whole point of P-16's fix: this role must not exist anywhere on the
    // page any more, because nothing on it is a tablist.
    await expect(
      page.locator('[role="tabpanel"]'),
      "role=tabpanel is the orphaned role P-16 removed from ArtifactPane",
    ).toHaveCount(0);

    const outputRegion = page.locator('[role="region"][aria-label$="output"]').first();
    await expect(outputRegion, "ArtifactPane's labelled region").toBeVisible();
  });

  test("the transcript is a polite log", async ({ page }) => {
    const opened = await openAnExistingTrack(page);
    test.skip(!opened, "Seed workspace has no open track to read right now.");

    const log = page.locator('[role="log"]').first();
    await expect(log, "TrackActivity's transcript").toBeVisible();
    await expect(log).toHaveAttribute("aria-live", "polite");
  });

  test("a pending ask already holds focus when it renders", async ({ page }) => {
    const opened = await openAnExistingTrack(page);
    test.skip(!opened, "Seed workspace has no open track to read right now.");

    const ask = page.getByLabel("Your agent has stopped to ask you something");
    const askVisible = await ask.isVisible().catch(() => false);
    test.skip(askVisible === false, "This track has no pending gate right now to check focus on.");

    await expect(ask, "TrackConsent moves focus to itself the moment a gate opens").toBeFocused();
  });

  test("a pending ask's two answer buttons say what pressing them does", async ({ page }) => {
    // P-16 interim (A1 live, 2026-09-02 22:18): `read_page` found these two
    // buttons named nothing at all -- a screen reader landed on the ask, per
    // the test above, and then heard "button, button". Located by their
    // computed ACCESSIBLE NAME (Playwright's real a11y tree), not by an
    // attribute, so this proves what a screen reader actually hears rather
    // than that a particular attribute happens to be present.
    const opened = await openAnExistingTrack(page);
    test.skip(!opened, "Seed workspace has no open track to read right now.");

    const ask = page.getByLabel("Your agent has stopped to ask you something");
    const askVisible = await ask.isVisible().catch(() => false);
    test.skip(askVisible === false, "This track has no pending gate right now to check.");

    await expect(
      ask.getByRole("button", { name: /^Let it run\./ }),
      "the approve button's accessible name states the consequence",
    ).toBeVisible();
    await expect(
      ask.getByRole("button", { name: /^Don't run it\./ }),
      "the decline button's accessible name states the consequence",
    ).toBeVisible();
  });
});

test.describe("P-16: Start's runs list is a live region a screen reader can trust", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('"Your runs" is a labelled, polite live region', async ({ page }) => {
    const loggedIn = await login(page);
    expect(loggedIn, "seed workspace login").toBe(true);

    await page.goto("/start", { waitUntil: "domcontentloaded" });
    await waitForShell(page);

    const section = page.getByRole("region", { name: "Your runs" });
    await expect(section, "YourRuns's own aria-label").toBeVisible();

    // The live wrapper is the region's own child, not the section itself
    // (YourRuns.tsx: aria-live sits on the inner div so the heading is not
    // re-announced on every poll) -- so this locates it by its containment,
    // not by a bare `[aria-live]` selector that could match anything on the
    // page.
    const live = section.locator('[aria-live="polite"]');
    await expect(live, "the rows wrapper YourRuns polls into").toHaveCount(1);
  });
});
