/**
 * ONE PULL REQUEST, TWO PENDING GATES, ONE QUESTION ASKED TWICE.
 *
 * ── MEASURED, 2026-09-02 ──────────────────────────────────────────────────
 * PR #4 on track `6817e386` carried TWO pending `studio.pr.merge` approvals —
 * `f88c612c` at 21:05 and `5dcbe54d` at 21:32 — raised by two runs the Build
 * re-dispatch loop made. A1 cancelled the older by hand.
 *
 * The re-dispatch that produced them is fixed (P-03's done rule). This is the
 * defect UNDERNEATH it rather than the same one again: any two attempts of the
 * same tool on one piece of work raise two gates, and both ask the same person
 * the same question about the same branch. The second is not a second decision.
 * It is the first decision asked twice, and a queue that does that teaches
 * people to stop reading it — which is the failure the whole approval surface
 * exists to avoid, and which this product has already measured once at 38
 * unanswered calls with the oldest at 696 hours.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/lib/ai/loop.server.ts", "utf8");
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/**
 * The lookup that runs before a gate is raised, bounded at the `continue` that
 * ends it. A wider slice picks up the insert below and every string in it, which
 * is how the first version of this file asserted the absence of words that were
 * never in the guard.
 */
const GUARD = (() => {
  /*
   * Anchored on the guard's OWN unique line. `if (ctx.missionId) {` appears
   * three times in this file and the first is hundreds of lines earlier, so
   * anchoring on it sliced in most of the loop -- which is how the first version
   * of this test asserted the absence of words that were never in the guard.
   */
  const from = code.indexOf("const { data: already } = await supabase");
  const to = code.indexOf("const { data: appr } =", from);
  return code.slice(from, to);
})();

describe("a second attempt finds the first gate", () => {
  it("looks for an existing one before raising", () => {
    expect(GUARD).toContain('.eq("mission_id", ctx.missionId)');
    expect(GUARD).toContain('.eq("tool_name", call.name)');
  });

  it("runs BEFORE the insert, which is the only order that prevents anything", () => {
    // Both anchored on their own unique lines: `.insert({` appears many times.
    expect(code.indexOf("const { data: already } = await supabase")).toBeLessThan(
      code.indexOf("const { data: appr } ="),
    );
  });

  it("takes the OLDEST, so the one a person may already be looking at is the one kept", () => {
    expect(GUARD).toContain('.order("created_at", { ascending: true })');
  });

  it("points the step at the gate that exists, rather than at nothing", () => {
    // A queued step with no `approval_id` is a run paused on a gate the screen
    // cannot find, which is worse than the duplicate it replaces.
    expect(GUARD).toContain("approval_id: open.id");
  });

  it("records it as a queued call and not as an error", () => {
    /*
     * Nothing went wrong. The call was correct and the question was already
     * asked; a step marked `error` would read on the transcript as a failure and
     * send somebody looking for one.
     */
    expect(GUARD).toContain('status: "queued"');
    expect(GUARD).toContain("ok: true");
  });

  it("does not raise the count, because nothing new is waiting on anybody", () => {
    // A count that rose here tells the run screen a person has two things to
    // answer when they have one, which is the same lie as the duplicate row.
    expect(GUARD).not.toContain("approvalsQueued++");
  });

  it("tells the seat the question is already asked, so it stops re-calling", () => {
    expect(GUARD).toContain("already waiting on a person for this work");
    expect(GUARD).toContain("Do not ask again");
  });
});

describe("the scope, and every limit on it is deliberate", () => {
  it("matches PENDING only, never a decision somebody already made", () => {
    /*
     * THE ONE THAT WOULD BE DAMAGING TO GET WRONG. A gate that was ANSWERED is
     * spent: a later attempt is a new question about a changed situation and
     * must raise its own. Matching `approved` or `rejected` would silently reuse
     * a decision a person made about something else.
     */
    expect(GUARD).toContain('.eq("status", "pending")');
    expect(GUARD).not.toContain('"approved"');
    expect(GUARD).not.toContain('"rejected"');
  });

  it("only where there is a mission to key on", () => {
    // The guard sits inside `if (ctx.missionId)`; asserted on the whole file
    // because the slice above starts inside that block.
    expect(code).toContain("if (ctx.missionId) {\n        const { data: already }");
    /*
     * Most of the product has no mission, and there this rule would be guessing
     * at what "the same piece of work" means. The build lane is where two
     * attempts on one changeset actually happen.
     */
  });

  it("keys on the mission rather than the args, deliberately", () => {
    /*
     * Two `studio.pr.merge` calls worded differently are the same ask about the
     * same branch, and a person answering one has answered the work. Keying on
     * args would let a reworded call raise a second gate, which is exactly the
     * pair that was measured.
     */
    expect(GUARD).not.toContain('.eq("args"');
  });
});
