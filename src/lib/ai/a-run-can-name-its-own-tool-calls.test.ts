/**
 * A RUN CAN NAME ITS OWN TOOL CALLS (F-93, 2026-08-26).
 *
 * ── THE JOIN THAT DID NOT EXIST ────────────────────────────────────────────
 * `tool_calls.trace_id` is the only key it shares with `agent_runs`, and
 * `agent_runs` had no such column. `driver.server.ts` says it plainly: the ids
 * *"are carried down from each `runAgentLoop` result rather than looked up"* —
 * because looking them up was impossible. **The link between a run and what it
 * actually did existed only in memory, for the life of that run.**
 *
 * Measured 2026-08-26: `tool_calls.trace_id` matched **0 of 1,689**
 * `agent_runs.id`. There is no `%trace%` table anywhere.
 *
 * ── WHAT IT COST IN ONE DAY ────────────────────────────────────────────────
 * Three investigations were nearly concluded wrongly on it. Twice a workspace
 * filter was used as a stand-in and returned a DIFFERENT track's crew — once
 * almost producing the finding "the release agent makes zero tool calls", when it
 * makes seven. S4 hit the same wall verifying F-87 and correctly stopped rather
 * than infer.
 *
 * **A join that does not exist is worse than a slow one, because it invites a
 * plausible substitute.** That is what these tests are really guarding.
 *
 * It also blocks a specified feature: S2's collision derivation is defined as
 * "newest `tool_calls` row per ACTIVE `agent_run`", which was unjoinable.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const LOOP = read("./loop.server.ts");
const MIGRATION = read(
  "../../../supabase/migrations/20260826150000_a_run_can_name_its_own_tool_calls.sql",
);

describe("the run records the id its tool calls carry", () => {
  it("the agent_runs insert writes trace_id", () => {
    const at = LOOP.indexOf('.from("agent_runs")\n    .insert({');
    const insert = LOOP.slice(at, at + 2200);
    expect(insert).toContain("trace_id: traceId");
  });

  it("it is the SAME traceId the tool calls are stamped with", () => {
    // The whole point. A second id here would produce a column that joins to
    // nothing, which is the defect wearing a new hat.
    const mint = LOOP.indexOf("const traceId = crypto.randomUUID();");
    const insert = LOOP.indexOf('.from("agent_runs")\n    .insert({');
    expect(mint).toBeGreaterThan(-1);
    // Minted before the row is written, so the same value reaches both.
    expect(mint).toBeLessThan(insert);
    expect(LOOP).toContain("trace_id: traceId");
  });
});

describe("the migration says what NULL means, which is the dangerous part", () => {
  it("adds the column without a default, so old rows stay NULL", () => {
    expect(MIGRATION).toContain("ADD COLUMN IF NOT EXISTS trace_id uuid");
    // A default would fabricate a correlation for 1,689 runs whose calls nobody
    // can identify — inventing evidence rather than admitting its absence.
    expect(MIGRATION).not.toMatch(/trace_id uuid[^;]*DEFAULT/i);
  });

  it("records that NULL means unknowable, never 'made no calls'", () => {
    /*
     * F-76's distinction at a new table. "No rows came back" and "this run did
     * nothing" are different facts, and a reader who conflates them will report
     * an agent as idle when the truth is that the link was never written. The
     * column comment is where that warning survives a future reader.
     */
    expect(MIGRATION).toContain("never");
    expect(MIGRATION.toLowerCase()).toContain("unknowable");
  });

  it("indexes the column, because every use of it is a lookup by trace", () => {
    expect(MIGRATION).toContain("CREATE INDEX IF NOT EXISTS agent_runs_trace_id_idx");
  });
});
