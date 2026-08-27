/**
 * WARM A DEV ROUTE THE ONLY WAY THAT ACTUALLY WARMS IT: IN A BROWSER.
 *
 * ── WHY THIS FILE EXISTS, AND IT IS A RETRACTION ───────────────────────────
 * `check-motion.sh` used to warm routes with `curl`. That is wrong, and it cost
 * S4 three false findings before the flaw was found (`S4-057`).
 *
 * A curl against a Vite dev route returns the HTML shell in milliseconds. The
 * shell is not the page. The route's CLIENT chunk is compiled on demand, when a
 * real browser asks for the module graph, and on a big route that compile is
 * measured in MINUTES. Measured on this repo, signed out, backend dead:
 *
 *     /runs   cold 105,100ms   warm 4,211ms
 *     /today  cold   7,075ms   warm 5,112ms
 *
 * `/runs` is fifteen times slower to compile than `/today` because its sibling
 * `$missionId` route is 1,786 lines. Curl-warmed, both look "ready", and then a
 * 30-second probe reports `/runs` as a permanent dead end that never redirects.
 * It is not a dead end. It is a compiler, and warm it beats `/today`.
 *
 * ── THE RULE THIS ENCODES ──────────────────────────────────────────────────
 * Never time a dev-server surface you have not opened in a browser first, and
 * never read "still pending" as "broken" until the number below is printed and
 * a SECOND visit is the one you measure. Cold time is the bundler. Warm time is
 * the surface. Only the second is a fact about the product.
 *
 * `networkidle` is the signal, because in dev each compiled chunk arrives as a
 * request, so the network going quiet is the compile finishing.
 *
 * Usage:  bun run e2e/helpers/warm-routes.mjs /today /runs
 * Exits non-zero only if a route never reaches networkidle inside the budget,
 * which is itself worth knowing and is NOT the same as the route being broken.
 */
import { chromium } from "@playwright/test";

const PORT = process.env.PORT ?? "8080";
const BUDGET_MS = Number(process.env.WARM_BUDGET_MS ?? 240_000);
const paths = process.argv.slice(2).filter(Boolean);

if (paths.length === 0) {
  console.error("warm-routes: no paths given. Pass them as arguments.");
  process.exit(1);
}

const browser = await chromium.launch();
/*
 * Warm with the SAME session the measurement will use. Warming signed out while
 * measuring signed in compiles `/login` and leaves the product route cold, so
 * the measurement pays the compile it was supposed to have paid already. That is
 * the bug this whole helper exists to prevent, reintroduced one level up.
 */
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ...(process.env.S4_MOTION_STATE ? { storageState: process.env.S4_MOTION_STATE } : {}),
});
let failed = 0;

for (const path of paths) {
  const page = await context.newPage();
  const started = Date.now();
  let note = "";
  try {
    await page.goto(`http://localhost:${PORT}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: BUDGET_MS,
    });
    await page.waitForLoadState("networkidle", { timeout: BUDGET_MS });
  } catch {
    note =
      "  <- never went quiet inside the budget. Raise WARM_BUDGET_MS before calling it broken.";
    failed += 1;
  }
  const ms = Date.now() - started;
  const landed = page.url().replace(`http://localhost:${PORT}`, "") || "/";
  console.log(`  compiled ${path} in ${(ms / 1000).toFixed(1)}s (landed on ${landed})${note}`);
  await page.close();
}

await browser.close();

console.log(
  "  Those are COMPILE times, not page times. The measurement that follows runs\n" +
    "  against the warm server, which is the only one that says anything about the product.",
);

process.exit(failed > 0 ? 1 : 0);
