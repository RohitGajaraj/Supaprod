/**
 * NO TICK MAY SPEND A MODEL CALL ON A DEMO FIXTURE.
 *
 * Measured in production 2026-08-21, joining `ai_events` to `workspaces.is_sample`:
 *
 *   agent      1034 calls   $1.6556   100% SAMPLE workspace
 *   discovery   239 calls   $0.0507    98% SAMPLE
 *   sense       131 calls   $0.0073   100% SAMPLE
 *
 * $1.71 of the $1.92 spent that day, 89%, went to autonomous agents running
 * against demo fixtures. Real workspaces drew ZERO agent calls. All 230 agent
 * runs in the window were on a sample workspace, still firing at 08:00.
 *
 * The cause was uniform rather than clever: FOURTEEN hook files selected
 * workspaces and NOT ONE filtered `is_sample`. That is a shape, not a location,
 * which is why this guard reads every hook rather than the twelve that were
 * fixed.
 *
 * `is_sample` is `NOT NULL DEFAULT false`, so equality is exact and there is no
 * NULL to fall through.
 *
 * WHAT THIS DOES NOT ASSERT. A query that resolves a KNOWN workspace's owner
 * (`.eq("id", ...)` / `.in("id", ...)`) is a lookup, not a selection. Filtering
 * those would break the lookup without stopping any work, so they are exempt and
 * named as such.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const HOOKS = join(import.meta.dir, "..", "routes", "api", "public", "hooks");

function hookFiles(): string[] {
  return readdirSync(HOOKS).filter((f) => f.endsWith(".ts") && !f.includes(".test."));
}

/** Each `.from("workspaces")` with the ~6 lines that follow it. */
function workspaceQueries(src: string): string[] {
  const lines = src.split("\n");
  const out: string[] = [];
  lines.forEach((l, i) => {
    if (l.includes('.from("workspaces")')) out.push(lines.slice(i, i + 7).join("\n"));
  });
  return out;
}

const isLookup = (q: string) => /\.eq\("id"|\.in\("id"/.test(q);
const isSelection = (q: string) => q.includes(".select(");

describe("no tick selects sample workspaces", () => {
  it("reads the hooks directory at all, so nothing below passes vacuously", () => {
    const files = hookFiles();
    expect(files.length).toBeGreaterThan(20);
    expect(files).toContain("cluster-tick.ts");
  });

  it("finds workspace selections to check, which is the other vacuous failure", () => {
    const selections = hookFiles()
      .flatMap((f) => workspaceQueries(readFileSync(join(HOOKS, f), "utf8")))
      .filter((q) => isSelection(q) && !isLookup(q));
    expect(selections.length).toBeGreaterThanOrEqual(12);
  });

  it("every selection filters is_sample", () => {
    const offenders: string[] = [];
    for (const f of hookFiles()) {
      for (const q of workspaceQueries(readFileSync(join(HOOKS, f), "utf8"))) {
        if (!isSelection(q) || isLookup(q)) continue;
        if (!q.includes('.eq("is_sample", false)')) offenders.push(f);
      }
    }
    expect(offenders.sort()).toEqual([]);
  });
});
