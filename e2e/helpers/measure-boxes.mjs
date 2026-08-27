#!/usr/bin/env bun
/**
 * BEFORE AND AFTER, FOR THE BOXES YOU NAME.
 *
 * Every tap-target fix tonight has needed the same thing: the rendered size of
 * a few specific elements, at two widths, before a change and after it. S3 has
 * been doing it by hand for four fixes, and it caught a real defect the
 * arithmetic missed -- `py + -my` on an element inside an `items-center` row
 * still grows the row, because the row's height follows its tallest child, and
 * a footer went 536 to 544 while the maths said it could not.
 *
 * So: name the selectors, get the boxes. No judgement, no thresholds, just
 * numbers you can diff.
 *
 *   bun e2e/helpers/measure-boxes.mjs --path /settings --signed-in \
 *       --viewport 390x844 '.sp-brand' '.sp-rail' '.sp-railfoot'
 *
 * It assumes a dev server is ALREADY running on :8080 and does not start one,
 * because the point is to run it twice around an edit without paying for two
 * cold compiles.
 */
import { chromium } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const selectors = [];
let path = "/";
let viewport = { width: 1280, height: 900 };
let signedIn = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--path") path = args[++i];
  else if (a === "--signed-in") signedIn = true;
  else if (a === "--viewport") {
    const [w, h] = args[++i].split("x").map(Number);
    viewport = { width: w, height: h };
  } else selectors.push(a);
}
if (!selectors.length) {
  console.error("name at least one selector");
  process.exit(1);
}

const browser = await chromium.launch();
const ctxOpts = { viewport };
const statePath = "playwright/.auth/dead.json";
if (signedIn && existsSync(statePath)) {
  ctxOpts.storageState = JSON.parse(readFileSync(statePath, "utf8"));
}
const ctx = await browser.newContext(ctxOpts);
const page = await ctx.newPage();
await page.goto(`http://localhost:8080${path}`, { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(2500);

const rows = await page.evaluate((sels) => {
  const out = [];
  for (const sel of sels) {
    const els = Array.from(document.querySelectorAll(sel));
    if (!els.length) {
      out.push({ sel, note: "NOT FOUND" });
      continue;
    }
    els.slice(0, 4).forEach((el, i) => {
      const r = el.getBoundingClientRect();
      out.push({
        sel: els.length > 1 ? `${sel} [${i}]` : sel,
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
      });
    });
  }
  return out;
}, selectors);

console.log(`${path}  ${viewport.width}x${viewport.height}${signedIn ? "  signed-in" : ""}`);
for (const r of rows) {
  if (r.note) console.log(`  ${r.sel.padEnd(28)} ${r.note}`);
  else console.log(`  ${r.sel.padEnd(28)} ${r.w} x ${r.h}`);
}
await browser.close();
