/**
 * ── A DECISION HAS A DIRECTION, AND STATUS IS NOT IT ─────────────────────────
 *
 * `decisions.status` answers whether the RECORD was approved. It was also
 * being asked which way the CALL went, and it could only answer that when the
 * gate happened to approve: `decision.record` wrote
 * `status: call === 'do-not-build' && gate.status === 'approved' ? 'declined'
 * : gate.status`, so a refusal written while the gate was pending lost its
 * direction entirely.
 *
 * MEASURED 2026-09-09 (worktree-1-68, confirmed here on production): of 61
 * agent-written decisions, 41 are `approved` and 16 of those have a title that
 * reads as a refusal; 20 are `declined`. `intent` was non-null on 5 rows out of
 * 422, so it was never this field. The direction survived only in the title's
 * first word.
 *
 * WHY THE TITLE IS NOT AN ANSWER. Reading a fact back out of prose works until
 * a model rewords, and then it fails silently: a line that cannot be derived
 * looks exactly like a run that did not need one. That is the same trap as the
 * Connectors door and as `signals.list`'s stripped query, and it is why this
 * is a column rather than a regex.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const REGISTRY = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
const DECISIONS = readFileSync("src/lib/decisions.functions.ts", "utf8");
const MIGRATION = readFileSync("supabase/migrations/20260909101200_decisions_call.sql", "utf8");

/** One insert, bounded at its own closing brace, so a neighbour is never read as this one. */
function insertBlock(src: string, marker: string): string {
  const at = src.indexOf(marker);
  expect(at).toBeGreaterThan(-1);
  const open = src.indexOf(".insert({", at);
  expect(open).toBeGreaterThan(-1);
  return src.slice(open, src.indexOf("\n      })", open));
}

describe("the direction is written, not inferred", () => {
  it("decision.record writes the call it was given, unconditionally", () => {
    const body = insertBlock(REGISTRY, 'name: "decision.record"');
    expect(body).toContain("call: a.call,");
    // And it is not a copy of the status expression: the two answer different
    // questions and must be able to disagree.
    expect(body).toContain('status: a.call === "do-not-build"');
    const call = body.indexOf("call: a.call,");
    const status = body.indexOf("status: a.call");
    expect(call).toBeGreaterThan(-1);
    expect(status).toBeGreaterThan(call);
  });

  it("the run screen's read asks for it and narrows it by membership", () => {
    expect(DECISIONS).toContain("decided_by_agent_slug,status,call,source_kind");
    // A cast is not a check: the column is text and arrives as text.
    expect(DECISIONS).toContain('value === "build" || value === "do-not-build" ? value : null');
    expect(DECISIONS).toContain("call: decisionCall(r.call),");
  });

  it("null is a value the type admits, because 33 rows carry it", () => {
    expect(DECISIONS).toContain('call: "build" | "do-not-build" | null;');
  });

  /*
   * THE MIRROR (law 12). Asserting that the direction is written proves
   * nothing on its own: a migration that filled every row with "build" would
   * satisfy it and would be the defect stated louder. So the backfill is
   * asserted to be narrow, and to leave what it cannot know alone.
   */
  it("the backfill fills only what is certain and never reads a title", () => {
    // Source one: the tool call that wrote the row carries its own argument.
    expect(MIGRATION).toContain("t.tool_name = 'decision.record'");
    expect(MIGRATION).toContain("d.title = tc.title");
    // Source two: this writer's own rule, run backwards. Only 'declined'.
    expect(MIGRATION).toContain("status = 'declined'");
    // And never the reverse: 'approved' says nothing about direction.
    expect(MIGRATION).not.toContain("= 'build'\nwhere");
    // No prose is parsed anywhere in it.
    expect(MIGRATION).not.toMatch(/title\s*~\*?\s*'/);
    expect(MIGRATION).not.toContain("ilike");
    // Both updates are guarded on the column still being unknown, so a second
    // run can never overwrite a direction that was recorded properly.
    expect(MIGRATION.match(/"call" is null/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("the column refuses anything but the two directions, and admits null", () => {
    expect(MIGRATION).toContain("decisions_call_check");
    expect(MIGRATION).toContain(`"call" is null or "call" in ('build', 'do-not-build')`);
  });
});
