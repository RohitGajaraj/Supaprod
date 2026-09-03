/**
 * A1 pressed the tablet track's release gate at 19:46:47 UTC 2026-09-03.
 * `release.publish` failed in ONE SECOND on R-27 -- no successful preview --
 * consumed the gate, and wrote no `deployments` row. The person spent the only
 * press they had on a question whose answer could not be yes.
 *
 * The rule that would have stopped it was written in the tool's DESCRIPTION and
 * enforced inside the promote, after the approval was raised and answered.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const LOOP = code(readFileSync("src/lib/ai/loop.server.ts", "utf8"));
const DEPLOY = code(readFileSync("src/lib/deployments.functions.ts", "utf8"));
const TICK = code(readFileSync("src/routes/api/public/hooks/ci-poll-tick.ts", "utf8"));

describe("a gate that cannot succeed is not offered", () => {
  it("asks before the gate is raised, not inside the promote", () => {
    expect(LOOP).toContain("shipHasASuccessfulPreview(supabase, changesetId)");
    // Proves the stripper left the file behind.
    expect(LOOP).toContain('call.name === "release.publish"');
  });

  it("checks EVERY mode, not just the unattended one", () => {
    // The defect was a REVIEW-mode gate. Guarding only `auto` would have left
    // the case that actually happened untouched.
    const block = LOOP.slice(LOOP.indexOf("shipHasASuccessfulPreview") - 800);
    const guard = block.slice(0, block.indexOf("shipHasASuccessfulPreview"));
    expect(guard).not.toContain('mode === "auto"');
  });

  it("refuses rather than holding, and names what changes the answer", () => {
    // Nothing is wrong with the request: the preview has not succeeded yet, and
    // the retry is what moves it. A hold would put it back in a person's queue.
    expect(LOOP).toContain("A preview is retried automatically");
    expect(LOOP).toContain("Tool refused:");
  });

  it("does not block on a failed read", () => {
    // Refusing to offer a gate because we could not look would strand a release
    // that is genuinely ready.
    const fn = DEPLOY.slice(DEPLOY.indexOf("export async function shipHasASuccessfulPreview"));
    expect(fn).toContain('return { ok: true, why: "", lastFailure: null };');
    expect(fn).toContain("catch");
  });

  it("carries the last failure's reason, which is the actionable half", () => {
    const fn = DEPLOY.slice(DEPLOY.indexOf("export async function shipHasASuccessfulPreview"));
    expect(fn).toContain("the last attempt failed:");
    expect(fn).toContain('r.status === "failure" && r.failure_reason');
  });
});

describe("every failed preview records a reason", () => {
  it("records a row when the attempt THROWS before the provider is called", () => {
    // The policy note in this file enumerated two uncovered paths and said what
    // they share: "neither records a failure row at all". This is the first.
    // collectRepoFiles throws on an oversized repo, a missing main.ts and a
    // failed repo-tree read, and the throw travelled past every writer.
    expect(TICK).toContain("preflightReason");
    expect(TICK).toContain("await collectRepoFiles({");
    const block = TICK.slice(TICK.indexOf("let preflightReason"), TICK.indexOf("const result:"));
    expect(block).toContain("try {");
    expect(block).toContain("} catch (e) {");
  });

  it("never writes a failure row with no reason", () => {
    // `result.reason` is optional, and an undefined value is OMITTED from the
    // upsert body, so the column keeps its NULL default -- which is exactly the
    // row the tablet track carries and why the hold card can only say "nothing
    // on the attempt says why".
    expect(TICK).toContain("The attempt failed and the host gave no reason for it.");
    expect(TICK).not.toContain("failure_reason: result.ok ? null : result.reason,");
  });

  it("uses one row shape for a thrown attempt and a provider failure", () => {
    // Two upserts would be two things for /ship to read and one of them would
    // drift. The thrown path feeds the same `result` the provider returns.
    const upserts = TICK.split('.from("deployments")').length - 1;
    expect(upserts).toBeLessThanOrEqual(3);
    expect(TICK).toContain("preflightReason === null");
  });
});
