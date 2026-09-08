import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * P-120 (A-QUEUE.md): a Postgres NOT NULL constraint enforces "an edge
 * without a workspace cannot be constructed" at the database layer, but that
 * enforcement is REFUSAL, not repair -- a caller that omits `workspace_id`
 * does not get the column's own default when it runs outside an
 * authenticated request (`current_user_default_workspace()` reads
 * `auth.uid()`, which is NULL for a service-role/background caller), so the
 * write is refused and the edge is simply never written. 53 refusals in 7
 * days, two callers, both firing from `driver.server.ts` and
 * `registry.server.ts`'s background/agent contexts.
 *
 * SAME SHAPE AS `spec-dispatch-writes-lineage.test.ts`: a source-file scan,
 * not a type check, because the damage this catches is four hops away in a
 * table neither file's own tests read, and both files pass their own unit
 * tests either way. If you add a THIRD `recordLineage`/`recordLineageSafe`
 * call site that runs outside an authenticated request (a cron tick, an
 * agent tool, a background sweep), add it to WORKSPACE_SCOPED_CALLERS below
 * and pass `workspace_id` explicitly rather than trusting the column's
 * default.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const WORKSPACE_SCOPED_CALLERS = [
  {
    file: "lib/spine/driver.server.ts",
    relation: "dispatched",
    expectedField: /workspace_id:\s*row\.workspace_id/,
  },
  {
    file: "lib/ai/tools/registry.server.ts",
    relation: "revised",
    expectedField: /workspace_id:\s*prd\.workspace_id/,
  },
] as const;

describe("a lineage edge written outside an authenticated request carries its own workspace", () => {
  for (const { file, relation, expectedField } of WORKSPACE_SCOPED_CALLERS) {
    const flat = stripComments(read(file)).replace(/\s+/g, " ");

    it(`${file} (relation "${relation}") passes workspace_id explicitly, not the column default`, () => {
      // Find the recordLineage(Safe) call carrying this relation, then check
      // it also carries a workspace_id field -- one match spanning both, so
      // a workspace_id added to an unrelated call cannot fake a pass here.
      const callPattern = new RegExp(
        `recordLineage(?:Safe)?\\([^;]*?relation:\\s*"${relation}"[^;]*?\\)`,
      );
      const call = flat.match(callPattern)?.[0];
      expect(
        call,
        `no recordLineage(Safe) call for relation "${relation}" found in ${file}`,
      ).toBeTruthy();
      expect(call).toMatch(expectedField);
    });
  }
});
