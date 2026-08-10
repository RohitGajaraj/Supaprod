/**
 * INSTRUMENT: the run-level attempt/resume record.
 *
 * Every test here is about a way the instrumentation could quietly manufacture a
 * measurement it does not have — a first start counted as a resume, a null
 * promoted to a 1, a permissions error read as "the column is missing". The
 * arithmetic is trivial; the classification is the part that lies.
 */
import { describe, expect, test } from "bun:test";
import {
  countsAsResumption,
  isMissingColumnError,
  nextResumeCount,
  resetRunColumnProbe,
  runAttemptColumnsPresent,
} from "./run-attempt.server";

describe("countsAsResumption: a first start is not a resumption", () => {
  test("the first pickup of a queued run with no checkpoint does not count", () => {
    // Measured 2026-08-10: all 99 handoff messages on production were consumed,
    // meaning every orchestrated child run reached the loop through resume. If
    // this returned true, each of them would report a resume it never had and
    // "work had to be picked up again" would read as roughly 100%.
    expect(countsAsResumption({ status: "queued", hasCheckpoint: false })).toBe(false);
  });

  test("a queued run WITH a checkpoint had already begun", () => {
    // It ran, wrote steps, then got re-queued. Continuing it is a resumption.
    expect(countsAsResumption({ status: "queued", hasCheckpoint: true })).toBe(true);
  });

  test("a 'running' run being resumed means its previous worker stopped", () => {
    // Only a started run carries 'running', so a resumer seeing it is taking
    // over from a worker that died — the exact eviction case this measures,
    // and it must count even before the first checkpoint exists.
    expect(countsAsResumption({ status: "running", hasCheckpoint: false })).toBe(true);
  });

  test("a run parked at a human gate before doing anything does not count", () => {
    // A person's think time is not the loop retrying itself.
    expect(countsAsResumption({ status: "waiting_approval", hasCheckpoint: false })).toBe(false);
    expect(countsAsResumption({ status: "waiting_approval", hasCheckpoint: true })).toBe(true);
  });
});

describe("nextResumeCount: null in, null out", () => {
  test("a row that was never instrumented is left alone", () => {
    // Writing 1 here would publish a lower bound of unknown depth as if it were
    // a total: that run may have been resumed five times before anyone counted.
    // All 1,232 rows live on 2026-08-10 are in exactly this state.
    expect(nextResumeCount(null)).toBeNull();
    expect(nextResumeCount(undefined)).toBeNull();
  });

  test("a count kept from birth continues", () => {
    expect(nextResumeCount(0)).toBe(1);
    expect(nextResumeCount(4)).toBe(5);
  });

  test("a nonsense value is refused rather than repaired", () => {
    // A negative or non-finite count is not a count to increment; treating it
    // as one would launder corrupt data into a plausible-looking number.
    expect(nextResumeCount(-1)).toBeNull();
    expect(nextResumeCount(Number.NaN)).toBeNull();
  });
});

describe("isMissingColumnError: only a missing column, nothing else", () => {
  test("42703 is the reliable signal", () => {
    expect(isMissingColumnError({ code: "42703", message: "whatever" })).toBe(true);
  });

  test("the message fallback catches a gateway that dropped the code", () => {
    expect(isMissingColumnError({ message: 'column "attempt" does not exist' })).toBe(true);
    expect(
      isMissingColumnError({ message: "Could not find the 'resume_count' column of 'agent_runs'" }),
    ).toBe(true);
  });

  test("a permissions or network error is NOT a missing column", () => {
    // This is the one that matters. A broad match would cache "no columns" for
    // the isolate's whole life on a transient blip, silently disabling the
    // instrumentation with no error anywhere to explain it.
    expect(isMissingColumnError({ code: "42501", message: "permission denied for table" })).toBe(
      false,
    );
    expect(isMissingColumnError({ message: "fetch failed" })).toBe(false);
    expect(isMissingColumnError(null)).toBe(false);
  });
});

/** Minimal stand-in for the one call the probe makes. */
function probeClient(result: { error: { code?: string; message?: string } | null } | "throws") {
  return {
    from: () => ({
      select: () => ({
        limit: async () => {
          if (result === "throws") throw new Error("client exploded");
          return result;
        },
      }),
    }),
  } as never;
}

describe("runAttemptColumnsPresent: fails closed and caches only certainty", () => {
  test("a clean read means the migration has applied", async () => {
    resetRunColumnProbe();
    expect(await runAttemptColumnsPresent(probeClient({ error: null }))).toBe(true);
  });

  test("a missing column is cached, so later calls do not re-ask", async () => {
    resetRunColumnProbe();
    expect(await runAttemptColumnsPresent(probeClient({ error: { code: "42703" } }))).toBe(false);
    // A client that WOULD answer true is ignored: the column cannot appear
    // mid-isolate, and re-probing on every dispatch is a query per run.
    expect(await runAttemptColumnsPresent(probeClient({ error: null }))).toBe(false);
  });

  test("a transient failure is not cached", async () => {
    resetRunColumnProbe();
    expect(
      await runAttemptColumnsPresent(probeClient({ error: { code: "08006", message: "conn" } })),
    ).toBe(false);
    // One network blip must not disable instrumentation for the isolate's life.
    expect(await runAttemptColumnsPresent(probeClient({ error: null }))).toBe(true);
  });

  test("a thrown client error answers false instead of taking dispatch down", async () => {
    // runAgentLoop throws on an agent_runs insert failure by design, so an
    // exception escaping the probe would stop runs from starting at all.
    resetRunColumnProbe();
    expect(await runAttemptColumnsPresent(probeClient("throws"))).toBe(false);
  });
});
