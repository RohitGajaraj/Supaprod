/**
 * FOUR TIMES, THE SAME DEFECT, AND THE THIRD FIX WAS THIS FUNCTION (2026-09-01).
 *
 * `searchFlag` was written on 2026-08-21 after `?capture=1` shipped twice as
 * `search.capture === "1"` -- a comparison that reads correctly, matches the
 * link that generated it, and never fires. TanStack Router runs every search
 * value through `JSON.parse` before a validator sees it, so `?flag=1` arrives
 * as the NUMBER 1 and `?flag=true` as the BOOLEAN true. `validateSearch` is a
 * whitelist, so a missed comparison does not merely fail to read the flag: the
 * router DROPS the key and rewrites the address, and the deep link silently
 * lands on the plain page.
 *
 * Eleven days later `/start?queue=1` shipped with the identical hand-rolled
 * comparison and the identical result, found the same way the other three
 * were -- by walking the page in a browser, because an inline `validateSearch`
 * is only ever exercised by the router and no unit test can reach it.
 *
 * That is what this file is for. It cannot test the inline parsers, so it
 * refuses to let them exist: a boolean URL flag goes through the one function
 * a test CAN call. The failure it prevents has no error, no empty state and no
 * broken control -- a link named for a place simply lands somewhere else.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROUTES = fileURLToPath(new URL("../routes", import.meta.url));

function routeFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) routeFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !entry.includes(".test.")) out.push(full);
  }
  return out;
}

/**
 * The body of a `validateSearch`, with comments stripped. Comments in this repo
 * quote the broken comparisons while explaining them -- the discover header
 * spends a paragraph on `search.capture === "1"` -- and a guard that counted
 * those would push the next author to delete the explanation of the bug to get
 * their fix through.
 */
function validators(src: string): string[] {
  const clean = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const out: string[] = [];
  let from = 0;
  for (;;) {
    const at = clean.indexOf("validateSearch", from);
    if (at === -1) break;
    out.push(clean.slice(at, at + 1200));
    from = at + 1;
  }
  return out;
}

/** A comparison against a value that only ever means "the flag is set". */
const HAND_ROLLED = /===\s*(?:true|1|"1"|"true")/;

describe("a boolean url flag", () => {
  it("is parsed by searchFlag and never by a comparison written on the spot", () => {
    const offenders: string[] = [];
    for (const file of routeFiles(ROUTES)) {
      for (const body of validators(readFileSync(file, "utf8"))) {
        const hit = body.match(HAND_ROLLED);
        if (hit) offenders.push(`${file.replace(ROUTES, "src/routes")}: ${hit[0]}`);
      }
    }

    expect(
      offenders.join("\n"),
      [
        "A validateSearch compares a search value against a boolean literal.",
        "",
        "The router JSON.parses every search value first, so ?flag=1 arrives as",
        "the NUMBER 1 and ?flag=true as the BOOLEAN true. Any single comparison",
        "misses at least two of the four shapes a flag can arrive in, and because",
        "validateSearch is a whitelist the router then DROPS the key and rewrites",
        "the URL. The deep link lands on the plain page, with no error to see.",
        "",
        "Use `searchFlag(search.<name>)` from src/lib/search-flag.ts. It returns",
        "true or undefined and it is the only one of these a unit test can reach.",
      ].join("\n"),
    ).toBe("");
  });
});
