/**
 * WHAT DOES EVERY URL IN THIS PRODUCT ACTUALLY DO TODAY?
 *
 * The operating model's structural defect is "three surfaces, not 119 routes",
 * and the fold is how that gets fixed. Nobody could say which of those routes
 * still render, which redirect, and which are already dead, so every fold
 * decision was being made from the file tree rather than from the product.
 *
 * This opens every routable path signed in, against a database that does not
 * exist, and records what a person would actually get. A dead backend is the
 * right condition for the question: it asks what the ROUTE does, not what the
 * data says, and it means the census cannot be skewed by whose workspace it ran
 * in.
 *
 * FOUR OUTCOMES, and the useful one is the third:
 *   renders   the path is a real surface
 *   redirect  the path is folded, and the census names where it lands
 *   404       the path is in the router's file tree but reaches nothing
 *   login     the guard bounced it, which signed in means the session was refused
 *
 * Usage:  bun run e2e/helpers/surface-census.mjs <paths...>
 * With S4_MOTION_STATE set, it runs signed in. Writes a markdown table to stdout.
 */
import { chromium } from "@playwright/test";

const PORT = process.env.PORT ?? "8080";
const SETTLE_MS = Number(process.env.CENSUS_SETTLE_MS ?? 9000);
const paths = process.argv.slice(2).filter(Boolean);

if (paths.length === 0) {
  console.error("surface-census: no paths given.");
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ...(process.env.S4_MOTION_STATE ? { storageState: process.env.S4_MOTION_STATE } : {}),
});

const rows = [];
for (const path of paths) {
  const page = await context.newPage();
  let landed = path;
  let text = "";
  try {
    await page.goto(`http://localhost:${PORT}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    /*
     * WAIT FOR THE TEXT TO STOP CHANGING, not for it to appear.
     *
     * The first version broke out as soon as `text` was non-empty, and on any
     * authenticated surface the nav chrome alone ("Supaprod Ask ... Today ...")
     * clears that instantly. So it captured the SHELL and returned before a
     * single read had failed, and the failure-statement counts it produced were
     * zero on six surfaces the motion spec had already measured at 2 to 7.
     *
     * Caught by two instruments disagreeing about the same page. That is the
     * only reason it was caught, and it is the same defect as the 6s settle in
     * the first census run: measuring before the thing being measured exists.
     *
     * Two consecutive identical samples means the page has finished arriving.
     */
    const deadline = Date.now() + SETTLE_MS;
    let previous = null;
    let stable = 0;
    while (Date.now() < deadline) {
      text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
      if (text && text !== "Opening") {
        if (text === previous) {
          stable += 1;
          if (stable >= 2) break;
        } else {
          stable = 0;
        }
        previous = text;
      }
      await page.waitForTimeout(1000);
    }
    landed = page.url().replace(`http://localhost:${PORT}`, "") || "/";
  } catch (e) {
    text = `ERROR ${String(e).slice(0, 60)}`;
  }

  /*
   * NO FAILURE-STATEMENT COUNT HERE, AND THAT IS A DECISION.
   *
   * This tool briefly counted them. It disagreed with
   * e2e/s4-motion-must-be-earned.spec.ts about the same pages (/today 2 there
   * and 4 here, /brain 7 and 6), because the two split text differently, and
   * when I aligned them the number still moved run to run: /today came back 0
   * on one pass and /guardrails 7 on a pass where it redirected away.
   *
   * The cause is that this tool is FAST BY DESIGN. It samples once the page
   * stops changing, which is enough to answer "what does this URL do" and is
   * not enough to answer "what does a person read", where a late-arriving
   * failure line changes the answer.
   *
   * A metric two other lanes act on has to mean one thing, so it lives in one
   * instrument: the spec, which settles for six seconds and samples twice. This
   * one answers routing. S4-070 has the number.
   */

  let verdict;
  if (text.includes("There is no page at this address")) verdict = "404";
  else if (landed.startsWith("/login")) verdict = "login";
  else if (landed.split("?")[0] !== path) verdict = `redirect -> ${landed.split("?")[0]}`;
  else if (!text || text === "Opening") verdict = "never rendered";
  else verdict = "renders";

  // The first line a person reads, which is what makes the table worth scanning.
  const headline = (text.split(" · ")[0] || "").slice(0, 70);
  rows.push({ path, verdict, headline });
  console.error(
    `  ${path.padEnd(26)} ${verdict.padEnd(24)} ` +
      `${statements.length} failure statement(s)${statements.length > 2 ? "  <- ABOVE TWO" : ""}`,
  );
  await page.close();
}

await browser.close();

console.log("| path | what it does | first words |");
console.log("| --- | --- | --- |");
for (const r of rows) {
  console.log(`| \`${r.path}\` | ${r.verdict} | ${flag} | ${r.headline.replace(/\|/g, "/")} |`);
}
const count = (v) => rows.filter((r) => r.verdict.startsWith(v)).length;
console.log(
  `\n**${rows.length} paths: ${count("renders")} render, ${count("redirect")} redirect, ` +
    `${count("404")} reach nothing, ${count("login")} bounced to login, ` +
    `${count("never")} never rendered.**`,
);
