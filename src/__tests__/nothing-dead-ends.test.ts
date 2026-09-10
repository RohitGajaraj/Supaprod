/**
 * ── EVERY DOOR OPENS SOMETHING THAT EXISTS ────────────────────────────────
 *
 * The founder's second territory, in his words: *"Nothing dead-ends."*
 *
 * This is the mechanical half of that — every `to:` in the tree names a route
 * the router actually has. It is a census rather than a review because the
 * failure is silent: a link to a deleted route renders, hovers and clicks like
 * any other, and the person finds out on the page after.
 *
 * ── MEASURED 2026-09-10 AND CLEAN, WHICH IS WHY IT IS HERE ────────────────
 * 50 routes, 23 distinct link bases, **zero unknown targets**. Recording a
 * clean census is the point: the next deleted route is the one that breaks it,
 * and without this it breaks silently.
 *
 * ── AND IT IS NOT THE WHOLE OF "NOTHING DEAD-ENDS" ────────────────────────
 * The one broken door found tonight was the opposite shape and this test
 * cannot see it: **"Open the mission" was a live link to a real page** —
 * `/start` — that simply was not the mission. Measured before cutting it: 21
 * pending approvals, 7 drew the control, 0 could reach a track.
 *
 * A door that points at a real page it did not name is invisible to any check
 * that only asks whether the target exists. That one needs a person to walk
 * it, which is how it was found. See
 * `components/governance/a-door-must-open-what-it-names.test.ts`.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** The first segment of every route the file-based router defines. */
function routes(): Set<string> {
  const out = new Set<string>();
  for (const f of readdirSync(join(ROOT, "routes"))) {
    if (!f.endsWith(".tsx") || f.startsWith("__") || f.startsWith("-")) continue;
    const n = f.slice(0, -4).replace("_authenticated.", "").replace("_public.", "");
    if (n === "index" || n === "_authenticated" || n === "_public") {
      out.add("/");
      continue;
    }
    out.add("/" + n.split(".")[0]);
  }
  return out;
}

/** Every `to:` / `to=` destination written anywhere, by first segment. */
function targets(): Array<{ base: string; file: string }> {
  const out: Array<{ base: string; file: string }> = [];
  for (const f of walk(ROOT)) {
    const src = readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const m of src.matchAll(/to:\s*"(\/[^"]*)"|to="(\/[^"]*)"/g)) {
      const t = (m[1] ?? m[2]!).split("?")[0]!;
      const seg = t.split("/")[1];
      out.push({ base: seg ? `/${seg}` : "/", file: f.slice(ROOT.length + 1) });
    }
  }
  return out;
}

describe("nothing dead-ends", () => {
  it("points every door at a route the router has", () => {
    const have = routes();
    const broken = targets().filter((t) => !have.has(t.base));
    expect(
      broken,
      "a link names a route that does not exist. It renders, hovers and clicks like any other, and the person finds out on the page after.",
    ).toEqual([]);
  });

  it("still reads the routes and the links it claims to read", () => {
    /*
     * THE MIRROR. The assertion above passes by finding nothing, so a walker
     * that stopped descending, or a route reader that returned an empty set,
     * would report a clean bill of health over any number of broken doors —
     * and an EMPTY route set makes every link look broken, which fails loudly,
     * while an empty link set passes silently. Only the second needs guarding.
     */
    expect(routes().size).toBeGreaterThan(30);
    expect(targets().length).toBeGreaterThan(60);
    /* The rail's own destinations, by name, so a route rename that misses a
       caller cannot pass by shrinking both sides together. */
    for (const r of ["/start", "/inbox", "/evidence", "/outcomes", "/team", "/sources"]) {
      expect({ r, exists: routes().has(r) }).toEqual({ r, exists: true });
    }
  });
});
