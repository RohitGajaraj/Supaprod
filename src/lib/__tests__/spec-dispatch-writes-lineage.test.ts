import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * EVERY PATH THAT DISPATCHES A BUILD MISSION FROM A SPEC MUST WRITE THE EDGE.
 *
 * THE BREAK THIS PREVENTS, found 2026-08-05, and it cost the moat.
 *
 * A mission carries no `prd` column. The ONLY thing connecting a spec to the
 * mission built from it is the `prd -> mission` edge in `artifact_lineage`.
 * Everything downstream reads that edge: a changeset resolves its spec through
 * it, `decideStudioMergeShipStamp` refuses any merge whose changeset has no
 * spec, an unstamped spec is never `shipped`, the settle sweep has nothing to
 * grade, and `agent_memory where kind='outcome'` — the compounding record the
 * whole product is built on — stays empty. It was empty. Forever, 0 rows.
 *
 * TWO paths dispatch a Build mission from a spec:
 *
 *   1. `studio.functions.ts`  dispatchStudioSession  — wrote the edge.
 *   2. `build.functions.ts`   runBuilder             — did NOT.
 *
 * Both wrote `recordStageEvent`, so both looked instrumented at a glance. 21 of
 * 23 live changesets came through path 2 and could never name their spec.
 *
 * NOTHING CAUGHT IT, and nothing type-level or unit-level could. Each file is
 * individually valid TypeScript, each function's own tests pass, and the damage
 * appears four hops away in a table neither file mentions. Like
 * `trigger-dedup-halves.test.ts`, this is a CONSISTENCY check across files that
 * no type checker can see, in the same house source-scan style.
 *
 * IF YOU ADD A THIRD DISPATCH PATH, add it to DISPATCH_PATHS below and write the
 * edge. Do not delete a row to make this pass.
 *
 * PATH 1 RETIRED, NOT DODGED (P-29, A-QUEUE.md, 2026-09-03): `dispatchStudioSession`
 * itself is deleted -- it lost its last three callers to R-35 (no door
 * outside the track path may create a mission) and the P-14 ruling that
 * plan.spec.$id.tsx's own "Send to Build" goes, because the run does both.
 * A path that no longer dispatches anything cannot un-write an edge, so this
 * is the one case "do not delete a row" does not forbid: the risk the row
 * existed to catch (a real dispatch path silently skipping the edge) cannot
 * occur for a function that has been removed outright.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

/** Comments explain the edge at length, so they are stripped before scanning. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const DISPATCH_PATHS = [{ file: "lib/build.functions.ts", fn: "dispatchBuilderMission" }] as const;

describe("spec dispatch writes the prd -> mission lineage edge", () => {
  for (const { file, fn } of DISPATCH_PATHS) {
    const src = stripComments(read(file));

    it(`${file} (${fn}) imports recordLineage`, () => {
      expect(src).toMatch(/import\s*\{[^}]*\brecordLineage\b[^}]*\}\s*from\s*["'][^"']*lineage/);
    });

    it(`${file} (${fn}) records a prd -> mission edge`, () => {
      // The call is multi-line; collapse whitespace so one regex can see it.
      const flat = src.replace(/\s+/g, " ");
      expect(flat).toMatch(/recordLineage\([^)]*?parent_kind: "prd",[^)]*?child_kind: "mission",/);
    });

    it(`${file} (${fn}) marks that edge as a dispatch`, () => {
      const flat = src.replace(/\s+/g, " ");
      expect(flat).toMatch(
        /parent_kind: "prd", parent_id: [^,]+, child_kind: "mission", child_id: [^,]+, relation: "dispatched"/,
      );
    });
  }

  it("a changeset stamps its spec in application code, not from a DB trigger", () => {
    /**
     * `studio_changesets.prd_id` was documented as "stamped at creation by the
     * studio_changeset_link_prd trigger". Checked live 2026-08-05: that trigger
     * does not exist in the database and never did — migration 20260629120100
     * added the column only. Resolving it in application code is what makes the
     * link independent of a migration that was committed and never applied.
     */
    const registry = stripComments(read("lib/ai/tools/registry.server.ts")).replace(/\s+/g, " ");
    expect(registry).toMatch(/async function resolvePrdForMission\(/);
    expect(registry).toMatch(/prd_id: await resolvePrdForMission\(supabase, missionId\)/);
  });
});
