/**
 * ── FIVE OF SEVEN STATION HUES POINTED AT NOTHING ─────────────────────────
 *
 * MEASURED 2026-09-10, from Lane 3's consistency sweep and verified here.
 * `stageHueForStation` mapped all seven stations to `--sp-stage-*`, and only
 * `build` and `learn` are defined anywhere in `src/styles`. Discover, Decide,
 * Plan, Design and Ship resolved to nothing.
 *
 * ── WHY NEITHER CALLER'S FALLBACK SAVED IT ────────────────────────────────
 * `AskLanding` put it straight into `background`, so the dot did not draw at
 * all on five of seven stations. `SuggestionRail` looked safer -- the CSS
 * declares `--sp-suggest-hue: var(--sp-stage-build)` -- but `StationTag`
 * OVERRODE that inline with `var(--sp-stage-decide)`, and **a custom property
 * whose value references an undefined property is guaranteed-invalid at
 * computed-value time**, so every consumer of it fell to `unset`: border,
 * background and text colour together. A declared fallback only applies when
 * nothing sets the property, and something always did.
 *
 * **Nobody reported any of it**, which is the evidence that decided the fix.
 *
 * ── IT IS REMOVED RATHER THAN REPAIRED ────────────────────────────────────
 * Defining the five would add tokens in the RETIRED `--sp-*` namespace. And the
 * idea is retired: the founder's 2026-09-08 ruling keeps status colour off
 * labels, and law 4 says identity is SHAPE -- a station is known by its glyph
 * and its name. Both callers say the station in words already.
 *
 * ── WHAT THIS PINS, AND IT IS WIDER THAN THESE TWO FILES ──────────────────
 * No component may hand a `var(--token)` to a style property unless that token
 * is defined in the stylesheets. The rule is checked over every `--sp-stage-*`
 * reference rather than over the two files that had the defect, because the
 * next instance will be somewhere else.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const FILES = walk(ROOT);
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Every `--sp-stage-*` name DEFINED in a stylesheet. */
function defined(): Set<string> {
  const out = new Set<string>();
  for (const f of FILES.filter((f) => f.endsWith(".css"))) {
    for (const m of readFileSync(f, "utf8").matchAll(/(--sp-stage-[a-z0-9-]+)\s*:/g))
      out.add(m[1]!);
  }
  return out;
}

/** Every `--sp-stage-*` name REFERENCED anywhere, in code or in CSS. */
function referenced(): Array<{ token: string; file: string }> {
  const out: Array<{ token: string; file: string }> = [];
  for (const f of FILES) {
    const src = strip(readFileSync(f, "utf8"));
    for (const m of src.matchAll(/var\(\s*(--sp-stage-[a-z0-9-]+)/g)) {
      out.push({ token: m[1]!, file: f.slice(ROOT.length + 1) });
    }
  }
  return out;
}

describe("a token nobody defined is not a colour", () => {
  it("references no stage token that the stylesheets do not define", () => {
    const have = defined();
    const missing = referenced().filter((r) => !have.has(r.token));
    expect(
      missing,
      "a style reads a `--sp-stage-*` token that no stylesheet defines. In a plain property it draws nothing; in a CUSTOM property it is invalid at computed-value time and takes every consumer of that property to `unset` with it.",
    ).toEqual([]);
  });

  it("does not reintroduce the per-station hue helper", () => {
    /*
     * The founder's 2026-09-08 ruling keeps status colour off labels and law 4
     * says identity is shape. A helper that hands a station a colour invites
     * exactly the rainbow that ruling rejected, and its return value cannot be
     * checked by a type.
     */
    const src = FILES.filter((f) => !f.endsWith(".css")).map((f) => strip(readFileSync(f, "utf8")));
    expect(src.filter((s) => /stageHueForStation/.test(s)).length).toBe(0);
  });

  it("still finds the stage tokens that DO exist", () => {
    /*
     * THE MIRROR. Both assertions above pass by finding nothing, so a walker
     * that stopped reading files, or a regex that stopped matching, would
     * report a clean bill of health over any number of broken references.
     */
    expect(FILES.length).toBeGreaterThan(500);
    expect([...defined()].sort()).toEqual(["--sp-stage-build", "--sp-stage-learn"]);
  });
});
