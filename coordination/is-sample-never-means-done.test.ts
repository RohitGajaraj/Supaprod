/**
 * NO SURFACE MAY DERIVE "FINISHED" FROM `workspaces.is_sample`.
 *
 * The rubric is F-61 (FINDINGS-LEDGER): the obvious acceptance query joined
 * tracks to workspaces on `is_sample = false` and counted track `3fbf73c9` --
 * entered at `define`, sense and decide waived, no forecast written -- as a
 * completed lap. The flag cannot carry that meaning, because F-42 repurposed
 * it to "the sweep may drive here". Completion of the LOOP has exactly one
 * honest derivation, off the track row itself:
 *
 *     entry_station === "sense" && station === "learn" && waived.length === 0
 *
 * That shape lives in lib resolvers, where it belongs. This guard exists so it
 * never has to be re-litigated on a screen: a done badge or finished count in
 * `src/components/**` or `src/routes/**` must read the three fields off the
 * track row, never the workspace's provenance flag.
 *
 * TWO SHAPES ARE BANNED, and both are precise enough to need no allowlist:
 *
 *   1. `is_sample` co-occurring with `entry_station` or `waived` in one
 *      surface file -- the join that computes completion from provenance.
 *   2. Filtering or branching on the flag at all (`.eq("is_sample"`,
 *      `is_sample ===`, `is_sample ==`) outside lib. Surfaces render what a
 *      resolver decided; a screen that asks the flag directly is one refactor
 *      away from asking it the wrong question.
 *
 * Comments that MENTION `is_sample` (history notes, refusal explanations) pass,
 * because shapes are banned, not words.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [
  join(import.meta.dir, "..", "components"),
  join(import.meta.dir, "..", "routes"),
] as const;

const ALLOWED_PREFIXES = ["meridian/", "shell/", "presence/"];

function surfaceFiles(): string[] {
  const out: string[] = [];
  for (const root of ROOTS) walk(root);
  return out;

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.(tsx?|ts)$/.test(entry)) continue;
      if (entry.includes(".test.")) continue;
      out.push(p);
    }
  }
}

function isMyLanePath(p: string): boolean {
  // The design system, shell and presence directories are owned elsewhere and
  // hold none of this risk today; pinning them anyway would make someone
  // else's legitimate change fail a guard they never see.
  return !ALLOWED_PREFIXES.some((prefix) => p.includes(prefix));
}

describe("is_sample never means done", () => {
  const files = surfaceFiles().filter(isMyLanePath);

  it("found surfaces to scan", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("never joins the provenance flag with the loop-completion fields", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const mentionsFlag = src.includes("is_sample");
      const touchesCompletion =
        src.includes("entry_station") || /waived\s*\.\s*(length|includes)/.test(src);
      if (mentionsFlag && touchesCompletion) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it("never filters or branches on the flag outside lib", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (/\.eq\(\s*["'`]is_sample["']/.test(src)) offenders.push(f);
      if (/is_sample\s*(===|==|!==|!=)/.test(src)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
