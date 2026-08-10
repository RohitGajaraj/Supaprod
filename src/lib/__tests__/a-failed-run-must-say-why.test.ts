/**
 * EVERY WRITE THAT MARKS A RUN FAILED MUST ALSO SAY WHY.
 *
 * `agent_runs.failure_kind` is read by the observability dashboard's failure
 * breakdown, which filters `.not("failure_kind","is",null)`. Measured against
 * production on 2026-08-10: ZERO of 1,225 runs carried a kind, against 226
 * real failed or partially-failed runs. The panel could never render a row.
 *
 * The cause was not a bug in any one place. It was that the ONLY writer of the
 * column lived in the AI-call layer, which sees a provider error and never
 * sees the tool failures, governance halts and orchestration errors that
 * actually mark a run failed. Three separate call sites marked runs failed and
 * classified none of them, each individually reasonable.
 *
 * So the guard is per-call-site rather than per-function: it asserts that
 * every place which writes `status: "failed"` to `agent_runs` also writes a
 * `failure_kind` nearby. That is the shape of the defect, and it is the shape
 * a fourth writer would silently repeat.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");

/** Comments stripped: a guard that reads raw text cannot tell code from prose
 *  ABOUT code, and the fix above is documented by quoting the old behaviour. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Files that mark an agent_runs row failed. Named explicitly so adding a new
 *  one is a deliberate act that shows up in review, rather than a file this
 *  guard silently never looked at. */
const FAILURE_WRITERS = [
  join("lib", "ai", "loop.server.ts"),
  join("lib", "agents.functions.ts"),
];

describe("a run that failed records what kind of failure it was", () => {
  for (const rel of FAILURE_WRITERS) {
    it(`${rel} classifies every failure it records`, () => {
      const code = codeOf(readFileSync(join(SRC, rel), "utf8"));
      // Each `status: "failed"` on an agent_runs update must have a
      // failure_kind within the same update object. 240 characters covers the
      // largest of these updates and stays well inside the next statement.
      const marks = [...code.matchAll(/status:\s*"failed"/g)];
      expect(marks.length, `${rel} no longer marks any run failed`).toBeGreaterThan(0);
      for (const m of marks) {
        const window = code.slice(m.index ?? 0, (m.index ?? 0) + 240);
        // Some `status: "failed"` writes target other tables (agent_approvals,
        // missions), which have no failure_kind column. Only assert on the
        // ones that are agent_runs updates.
        const before = code.slice(Math.max(0, (m.index ?? 0) - 300), m.index ?? 0);
        if (!before.includes('from("agent_runs")')) continue;
        expect(
          window.includes("failure_kind"),
          `An agent_runs row is marked failed in ${rel} without a failure_kind. ` +
            `The observability failure breakdown reads that column and renders ` +
            `nothing without it.`,
        ).toBe(true);
      }
    });
  }

  it("both writers use the shared classifier rather than a local string", () => {
    // Same taxonomy as the AI-call path and the read side. A hand-written
    // literal here would put a kind in the column that the breakdown's own
    // vocabulary does not contain, which is worse than null: it renders a
    // category nobody can act on.
    for (const rel of FAILURE_WRITERS) {
      const code = codeOf(readFileSync(join(SRC, rel), "utf8"));
      expect(code, `${rel} does not import the shared classifier`).toContain(
        "classifyFailureCode",
      );
    }
  });
});
