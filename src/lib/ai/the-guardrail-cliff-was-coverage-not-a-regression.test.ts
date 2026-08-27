/**
 * F-135: THE GUARDRAIL CLIFF IS COVERAGE, NOT A REGRESSION — AND ONE REAL BUG.
 *
 * S3 and S4 both reported the same shape and both were right to escalate it:
 * **8,525 guardrail hits in July, then nothing for 33 days, against 2,570 agent
 * runs and 27 enabled rules.** A mechanism firing thousands of times a month
 * that stops dead is worth stopping for, and neither would touch `src/lib/ai` on
 * a hunch. That was the correct call.
 *
 * ── IT IS NOT A REGRESSION, AND EVERY LINK WAS CHECKED RATHER THAN ASSUMED ─
 *   · `loop.server.ts` contains **zero** guardrail references, which is what
 *     raised the alarm — but `callModel` guards unless a caller opts out
 *     (`opts.guardrails !== false`), and the loop never opts out. The absence of
 *     the word is the absence of an OPT-OUT, not of the guard.
 *   · `loadGuardrails` returns `withFloor(...)` on BOTH branches, so a workspace
 *     that configured nothing is still screened by the built-in floor.
 *   · The four `guardrail_hits` inserts are all in `runtime.server.ts`, which is
 *     the path the loop calls into.
 *
 * ── THE CLIFF IS COVERAGE, MEASURED ────────────────────────────────────────
 * **27 rules exist across 3 workspaces. 13 workspaces ran agents in the last 30
 * days. Only 2 of those 13 have any rule at all.** July's 8,525 hits were on
 * workspaces that had rules and were busy then. Nothing broke; the traffic
 * moved to workspaces with nothing configured, where only the floor applies and
 * the floor found nothing to catch.
 *
 * ── THE ONE REAL DEFECT, FOUND WHILE DISPROVING THE CLAIM ──────────────────
 * `loadGuardrails` read only `data`. A failed query arrived as null, fell
 * through `?? []`, and the call proceeded **with the floor alone** — so a
 * workspace that HAD configured rules was screened as though it had none.
 *
 * **The floor is what made it invisible.** Because `withFloor` still returns the
 * built-ins, the call is never unscreened and nothing looks broken: no error, no
 * empty result, no gap on the page. Everywhere else tonight a swallowed read
 * produced a visibly wrong answer; here it produces a quietly weaker one, which
 * is worse.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { withFloor, GUARDRAIL_FLOOR } from "./guardrail-floor";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const RUNTIME = read("./runtime.server.ts");
const LOOP = read("./loop.server.ts");

describe("the mechanism is intact, link by link", () => {
  it("the loop never opts out of guardrails", () => {
    /*
     * The absence that raised the alarm, stated precisely. `loop.server.ts` has
     * no guardrail reference at all, and that is the absence of an OPT-OUT
     * rather than of the guard: `callModel` screens unless told not to.
     */
    expect(LOOP).not.toContain("guardrails: false");
  });

  it("and callModel screens unless a caller explicitly opts out", () => {
    expect(RUNTIME).toContain("const useGuards = opts.guardrails !== false;");
  });

  it("a workspace that configured nothing is still screened by the floor", () => {
    expect(withFloor([]).length).toBe(GUARDRAIL_FLOOR.length);
    expect(withFloor([]).length).toBeGreaterThan(0);
  });

  it("the floor applies on the no-workspace branch too", () => {
    expect(RUNTIME).toContain("if (!workspaceId) return withFloor([]);");
  });

  it("and a configured rule is added rather than replacing the floor", () => {
    const extra = [
      {
        id: "r1",
        name: "Custom",
        kind: "keyword",
        pattern: "zzz-not-in-the-floor",
        action: "warn",
        applies_to: "both",
        enabled: true,
      },
    ] as unknown as Parameters<typeof withFloor>[0];
    expect(withFloor(extra).length).toBe(GUARDRAIL_FLOOR.length + 1);
  });
});

describe("a workspace's own rules can no longer vanish without a word", () => {
  it("the read checks its error", () => {
    expect(RUNTIME).toContain("const { data, error } = await supabase");
    expect(RUNTIME).toContain("configured rules unreadable for workspace");
  });

  it("and says what it fell back to, which is the actionable half", () => {
    // "We could not read your rules" and "we screened you with the floor only"
    // are two facts and the second is the one that tells a person what cover
    // they actually had.
    expect(RUNTIME).toContain("screening with the floor only");
  });

  it("it LOGS rather than throwing, because the floor still screens the call", () => {
    /*
     * Refusing to run because we could not read the OPTIONAL rules would turn a
     * degraded state into an outage on the safety path. The call is never
     * unscreened, so degrading loudly is right and failing closed is not.
     */
    const fn = RUNTIME.slice(RUNTIME.indexOf("async function loadGuardrails"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    expect(body).not.toContain("throw");
    expect(body).toContain("return withFloor(");
  });
});
