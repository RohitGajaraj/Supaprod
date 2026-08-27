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
    // Long enough for the guard to redirect and the route chunk to arrive.
    const deadline = Date.now() + SETTLE_MS;
    while (Date.now() < deadline) {
      text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
      if (text && text !== "Opening") break;
      await page.waitForTimeout(500);
    }
    landed = page.url().replace(`http://localhost:${PORT}`, "") || "/";
  } catch (e) {
    text = `ERROR ${String(e).slice(0, 60)}`;
  }

  /*
   * HOW MANY TIMES ONE DEAD READ ANNOUNCES ITSELF, per surface.
   *
   * S4-070 measured this by hand on six surfaces and four were above the
   * threshold of two. The number is only useful if every surface has one, and
   * the census already pays the expensive part: booting, warming and rendering.
   * Counting sentences on text already in hand costs nothing on top.
   *
   * `something went wrong` is anchored rather than bare because bare it counted
   * the tab label "What went wrong" as an error and reported 7 where a person
   * reads 6. S3 caught that by counting the same page by hand.
   */
  const failure =
    /(did not load|could not be read|could not read|not readable|is not available|unavailable|something went wrong|session ended|failed to load)/i;
  const lines = text
    .split(/(?<=[.!?])\s+|\s{2,}/)
    .map((l) => l.trim())
    .filter(Boolean);
  const statements = Array.from(new Set(lines.filter((l) => failure.test(l))));

  let verdict;
  if (text.includes("There is no page at this address")) verdict = "404";
  else if (landed.startsWith("/login")) verdict = "login";
  else if (landed.split("?")[0] !== path) verdict = `redirect -> ${landed.split("?")[0]}`;
  else if (!text || text === "Opening") verdict = "never rendered";
  else verdict = "renders";

  // The first line a person reads, which is what makes the table worth scanning.
  const headline = (text.split(" · ")[0] || "").slice(0, 70);
  rows.push({ path, verdict, headline, failures: statements.length });
  console.error(
    `  ${path.padEnd(26)} ${verdict.padEnd(24)} ` +
      `${statements.length} failure statement(s)${statements.length > 2 ? "  <- ABOVE TWO" : ""}`,
  );
  await page.close();
}

await browser.close();

console.log("| path | what it does | failure statements | first words |");
console.log("| --- | --- | --- | --- |");
for (const r of rows) {
  const flag = r.failures > 2 ? `**${r.failures}**` : String(r.failures);
  console.log(`| \`${r.path}\` | ${r.verdict} | ${flag} | ${r.headline.replace(/\|/g, "/")} |`);
}
const count = (v) => rows.filter((r) => r.verdict.startsWith(v)).length;
console.log(
  `\n**${rows.length} paths: ${count("renders")} render, ${count("redirect")} redirect, ` +
    `${count("404")} reach nothing, ${count("login")} bounced to login, ` +
    `${count("never")} never rendered.**\n\n**${rows.filter((r) => r.failures > 2).length} surfaces announce one dead read more than twice.**`,
);
