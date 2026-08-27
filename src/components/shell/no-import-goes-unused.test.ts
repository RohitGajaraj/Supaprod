import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * AN IMPORT NOTHING USES IS INVISIBLE TO EVERY OTHER GATE IN THIS REPO.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * `tsconfig.json` sets `noUnusedLocals: false`, so the typecheck reports 0 with
 * orphaned imports sitting in the file, and eslint's config does not flag them
 * either. Found on 2026-08-27 by deleting `AgentBadge`: it took
 * `agentDisplayName` and `agentRelayVerb` with it, every gate went green, and
 * both imports stayed. A sweep of this lane's prefix then found four more,
 * including one in a test I had written myself hours earlier.
 *
 * It is a small defect and a real one. An import is a claim that a file depends
 * on something, and a stale claim sends the next reader to a module that has
 * nothing to do with the code in front of them — which is the same cost as a
 * comment describing props that no longer exist, and it survives longer because
 * nothing reads it.
 *
 * ── SCOPED TO S2's PREFIX, DELIBERATELY ────────────────────────────────────
 * Not because the rest of the repo is clean — I have not measured it — but
 * because a guard that fails on somebody else's file is a guard they will
 * delete rather than read. Each lane can widen this to its own paths; the list
 * is one array.
 *
 * ── WHAT IT CANNOT SEE, stated so nobody trusts it further than it goes ────
 * It matches identifiers textually against the file body with comments
 * stripped. A name used ONLY inside a template literal or reached by a computed
 * property is not detectable this way, so this errs toward silence: it will
 * miss a genuinely dead import before it accuses a live one. That is the
 * correct direction for a guard nobody is watching.
 */

const ROOTS = [
  "src/components/shell",
  "src/components/runs",
  "src/components/today",
  "src/components/observe",
  "src/components/crew",
  "src/components/agents",
  "src/components/traces",
  "src/components/mission",
  "src/components/missions",
  "src/components/cockpit",
];

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** Imported names, and the file body with comments removed. */
function parse(src: string): { names: string[]; body: string } {
  const re =
    /^import\s+(?:type\s+)?(?:\{([^}]*)\}|(\w+)|\*\s+as\s+(\w+))\s+from\s+["'][^"']+["'];/gm;
  const names: string[] = [];
  let last = 0;
  for (const m of src.matchAll(re)) {
    last = (m.index ?? 0) + m[0].length;
    if (m[1]) {
      for (const raw of m[1].split(",")) {
        const part = raw.trim().replace(/^type\s+/, "");
        if (!part) continue;
        names.push(
          part
            .split(/\s+as\s+/)
            .pop()!
            .trim(),
        );
      }
    } else if (m[2]) names.push(m[2]);
    else if (m[3]) names.push(m[3]);
  }
  const body = src
    .slice(last)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return { names: names.filter(Boolean), body };
}

describe("no import goes unused in S2's prefix", () => {
  const files = ROOTS.flatMap(walk);

  it("has files to check, so a bad path cannot make this pass vacuously", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("finds no imported name that the file never mentions again", () => {
    const orphans: string[] = [];
    for (const f of files) {
      const { names, body } = parse(readFileSync(f, "utf8"));
      for (const n of names) {
        if (!new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(body)) {
          orphans.push(`${f}: ${n}`);
        }
      }
    }
    expect(orphans, `orphaned imports:\n  ${orphans.join("\n  ")}`).toEqual([]);
  });
});
