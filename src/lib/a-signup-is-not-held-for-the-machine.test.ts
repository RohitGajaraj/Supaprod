/**
 * ── A SIGNUP IS NOT HELD FOR THE MACHINE ─────────────────────────────────────
 *
 * Lane 1's third review of the entry (2026-09-08): `completeOnboarding`
 * awaited the starter-run generation, bounded at twelve seconds, so "Open
 * Supaprod" held a new person on a disabled button while the machine wrote,
 * invisibly. The home's own read already shows that wait as work in
 * progress ("Reading what you said about X", a live dot), which is the
 * visible version. So: the response goes out the moment the profile is
 * stamped, the generation runs behind it, the home's read never holds for
 * the model either, and the minute sweep finishes what a cancelled Worker
 * dropped. One row-state function decides what every reader does.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { STARTER_RUNS_CLAIM_MS, starterRunsState } from "./starter-runs";

const ONBOARDING = readFileSync("src/lib/onboarding.functions.ts", "utf8");
const SWEEP = readFileSync("src/routes/api/public/hooks/resume-runs.ts", "utf8");

/** One exported block, bounded at the next export so a neighbour's text is never read as this one's. */
const block = (src: string, marker: string): string => {
  const at = src.indexOf(marker);
  expect(at).toBeGreaterThan(-1);
  const next = src.indexOf("\nexport ", at + marker.length);
  return src.slice(at, next === -1 ? undefined : next);
};

describe("the row says what every reader does", () => {
  const NOW = Date.parse("2026-09-08T21:00:00.000Z");
  const runs = { runs: [{ sentence: "Find the drop-off", why: "because" }] };

  it("stored runs are ready", () => {
    expect(starterRunsState({ starter_runs: runs, starter_runs_at: null }, NOW)).toBe("ready");
  });

  it("a kept refusal is final", () => {
    expect(
      starterRunsState(
        { starter_runs: { runs: [], refused: { reason: "no", at: "x" } }, starter_runs_at: "x" },
        NOW,
      ),
    ).toBe("refused");
  });

  it("a live claim is a wait, not a second generation", () => {
    const at = new Date(NOW - STARTER_RUNS_CLAIM_MS / 2).toISOString();
    expect(starterRunsState({ starter_runs: null, starter_runs_at: at }, NOW)).toBe("in-flight");
  });

  it("a claim past its time belongs to a cancelled Worker and is taken", () => {
    const at = new Date(NOW - STARTER_RUNS_CLAIM_MS - 1).toISOString();
    expect(starterRunsState({ starter_runs: null, starter_runs_at: at }, NOW)).toBe("unclaimed");
  });

  it("nothing stored and no claim is unclaimed", () => {
    expect(starterRunsState({ starter_runs: null, starter_runs_at: null }, NOW)).toBe("unclaimed");
  });
});

describe("nobody waits on the model", () => {
  it("completeOnboarding returns without awaiting the generation", () => {
    // The body is completeOnboardingCore since 2026-09-09; openFirstRun runs
    // it last, on the request's own client.
    const body = block(ONBOARDING, "export async function completeOnboardingCore");
    expect(body).not.toContain("Promise.race");
    expect(body).not.toContain("await generateStarterRunsForProduct");
    expect(body).toContain("void keepStarterRuns(db, userId, productId);");
    // The claim is taken first, so two writers cannot generate the same row.
    expect(body.indexOf("claimStarterRuns(")).toBeLessThan(body.indexOf("void keepStarterRuns("));
  });

  it("the home's read answers pending at once instead of holding twelve seconds", () => {
    const body = block(ONBOARDING, "export const listStarterRuns");
    expect(body).not.toContain("Promise.race");
    expect(body).not.toContain("setTimeout");
    expect(body).toContain("starterRunsState(row, Date.now())");
    expect(body).toContain('case "in-flight":');
    expect(body).toContain("void keepStarterRuns(db, context.userId, data.productId);");
  });

  it("the twelve-second wait is gone from the file", () => {
    expect(ONBOARDING).not.toContain("STARTER_RUNS_WAIT_MS");
  });
});

describe("the sweep finishes what a cancelled Worker dropped", () => {
  it("reads products with nothing stored and no live claim, bounded", () => {
    const body = SWEEP.replace(/\s+/g, " ");
    expect(body).toContain('.is("starter_runs", null)');
    expect(body).toContain("starter_runs_at.is.null,starter_runs_at.lt.${staleIso}");
    expect(body).toContain(".limit(2)");
  });

  it("claims before it generates, and reports what it wrote", () => {
    const at = SWEEP.indexOf("const starterRunsWritten");
    expect(at).toBeGreaterThan(-1);
    const body = SWEEP.slice(at, SWEEP.indexOf("return new Response(", at));
    expect(body.indexOf("claimStarterRuns(")).toBeLessThan(body.indexOf("keepStarterRuns("));
    expect(SWEEP).toContain("starterRunsWritten,");
    expect(SWEEP).toContain("starterRunsFailed,");
  });
});

describe("a refusal is kept wherever the generation runs", () => {
  it("keepStarterRuns writes the refusal marker and never throws", () => {
    const body = block(ONBOARDING, "export async function keepStarterRuns");
    expect(body).toContain("refused: { reason, at }");
    expect(body).toContain("return null;");
    expect(body).not.toContain("throw ");
  });
});
