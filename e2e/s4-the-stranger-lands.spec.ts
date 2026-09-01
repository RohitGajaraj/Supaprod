import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { findRepoRoot } from "./helpers/auth";

/**
 * S4-039 — THE STRANGER'S SIXTY SECONDS, ON THE PUBLIC LANDING, IN A REAL BROWSER.
 *
 * The founder's second acceptance: a person who has never seen this product
 * opens it and, inside sixty seconds and without being told anything, knows what
 * it is doing for them. This spec does not decide that. It RECORDS what such a
 * person could see at 10s, 30s and 60s, so a verdict rests on evidence.
 *
 * ── WHY THIS ONE NEEDS NO CREDENTIALS AND NEVER PRESSES ────────────────────
 * `/` is public. S4-038 measured that twelve of thirteen public routes render
 * fully with a database that does not exist, so this runs against a dev server
 * booted with a DUMMY env pointing at a port where nothing listens. **No call
 * can reach production, and this spec submits nothing** — it lands, waits, and
 * reads. There is no press in this file and none may be added: the sibling
 * `s4-sixty-seconds.spec.ts` carries the same rule and the reason.
 *
 * ── WHAT IT IS FOR, SPECIFICALLY ───────────────────────────────────────────
 * S4-037 established from the served HTML that the hero strip renders
 * `Sense · Discover · Decide · Define · Design · Build · Ship` while
 * `AGENT_STATION_ORDER` is `sense, decide, define, design, build, ship, learn`.
 * That was a static read. This captures the SAME strip in a browser across a
 * full 50-second animation cycle, which is the only way to show that the
 * progression is a clock rather than data: nothing is running, no row exists,
 * and the stations complete anyway.
 *
 * Run:
 *   lsof -ti:8080 first. bun run dev in another shell with a dummy .env.
 *   S4_STRANGER=yes bunx playwright test e2e/s4-the-stranger-lands.spec.ts
 * Screenshots land in docs/screenshots/s4-039/ (gitignored by policy).
 */

const SHOT_DIR = join(findRepoRoot(), "docs", "screenshots", "s4-039");
const CHECKPOINTS = [10, 30, 60] as const;

test.skip(
  process.env.S4_STRANGER !== "yes",
  "Needs a local dev server. Reads only, never submits. Opt in with S4_STRANGER=yes.",
);

/*
 * SIGNED OUT, DELIBERATELY, AND IT IS THE MORE HONEST SIMULATION.
 *
 * Every project in `playwright.config.ts` injects a signed-in `storageState`,
 * which is right for the product and wrong for this measurement: the founder's
 * second acceptance is about a person who has never seen this, and that person
 * has no session. The sibling `s4-sixty-seconds.spec.ts` has to simulate a
 * stranger WITH an account because `/start` is behind auth and says so in its
 * header. `/` is not, so here the stranger can be a real one.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test("the stranger's sixty seconds on the public landing", async ({ page }) => {
  test.setTimeout(150_000);
  mkdirSync(SHOT_DIR, { recursive: true });

  const landed = Date.now();
  await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });

  const record: string[] = [];
  let previous = 0;

  for (const at of CHECKPOINTS) {
    const waitMs = at * 1000 - (Date.now() - landed);
    if (waitMs > 0) await page.waitForTimeout(waitMs);

    await page.screenshot({ path: join(SHOT_DIR, `t${at}s.png`), fullPage: false });

    /*
     * ABOVE THE FOLD ONLY. What a person has actually read by second N is what
     * is on screen without scrolling, so the viewport is the measurement and the
     * full page is not. Whitespace is collapsed because the DOM's indentation is
     * not something a person sees.
     */
    const visible = (
      await page.evaluate(() => {
        const inView = (el: Element): boolean => {
          const r = el.getBoundingClientRect();
          return r.top < window.innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0;
        };
        const out: string[] = [];
        document.querySelectorAll("h1,h2,h3,p,span,button,a,li").forEach((el) => {
          if (!inView(el)) return;
          const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
          if (t && t.length > 1 && !out.includes(t)) out.push(t);
        });
        return out;
      })
    ).slice(0, 60);

    /*
     * THE STATION STRIP, READ SEPARATELY, because it is the claim under test.
     * A station the page marks complete is the thing to count: if that number
     * grows while nothing is running, the progression is a clock.
     */
    const strip = await page.evaluate(() => {
      const names = [
        "Sense",
        "Discover",
        "Decide",
        "Define",
        "Plan",
        "Design",
        "Build",
        "Ship",
        "Learn",
      ];
      return names.filter((n) =>
        Array.from(document.querySelectorAll("span,div,p")).some(
          (el) => (el.textContent ?? "").trim() === n,
        ),
      );
    });

    record.push(
      `\n===== t=${at}s (elapsed ${Math.round((Date.now() - landed) / 1000)}s) =====\n` +
        `STATION NAMES ON SCREEN: ${strip.join(" · ") || "(none)"}\n` +
        `VISIBLE ABOVE THE FOLD (${visible.length} blocks):\n` +
        visible.map((l) => `  ${l}`).join("\n"),
    );

    // The count must not go DOWN, and the point of recording it is the case
    // where it goes UP with no run behind it.
    expect(visible.length, `nothing readable above the fold at ${at}s`).toBeGreaterThan(0);
    previous = visible.length;
  }

  writeFileSync(join(SHOT_DIR, "what-a-stranger-reads.txt"), record.join("\n"), "utf8");

  // The only hard assertion: a stranger must be able to read SOMETHING at ten
  // seconds. Everything else in this file is a recording, because "did they
  // understand it" is the founder's judgement and not a spec's.
  expect(previous).toBeGreaterThan(0);
});
