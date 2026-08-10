/**
 * AFD-06 / INSTRUMENT: run duration must be measured or absent, never zero.
 *
 * `finalize` wrote `duration_ms: 0` as a literal in both the fresh-run and the
 * resume path. Measured against production on 2026-08-10: of 471 real agent
 * runs, only 30 carried a duration above zero, and every failed or
 * partially-failed run carried none - the population where latency matters
 * most. Nothing failed and nothing threw; the observe surface's per-run column
 * and the analytics rollup simply read a hardcoded zero and rendered it as a
 * measurement.
 *
 * That is why the guard below is about the FALLBACK rather than the happy path.
 * A wrong-but-plausible duration is harder to notice than a missing one, so
 * the contract is: compute it honestly, or return null and write no column.
 */
import { expect, test, describe } from "bun:test";
import { resumeElapsedMs } from "./loop.server";

const NOW = Date.parse("2026-08-10T12:00:00.000Z");

describe("resumeElapsedMs: measured or absent, never a plausible lie", () => {
  test("measures a resumed run from when the run itself began", () => {
    // The question every latency surface asks is how long the WORK took, not
    // how long the final leg took. A run that paused two hours on an approval
    // gate took two hours.
    expect(resumeElapsedMs("2026-08-10T10:00:00.000Z", NOW)).toBe(2 * 60 * 60 * 1000);
  });

  test("a sub-second run is a real measurement, not a falsy zero", () => {
    expect(resumeElapsedMs("2026-08-10T11:59:59.750Z", NOW)).toBe(250);
  });

  test("an exactly-instant run measures zero rather than going absent", () => {
    // Zero is only legal when it was actually measured. This is the one case
    // where the value and the sentinel coincide, and it must stay a number so
    // the caller writes the column.
    expect(resumeElapsedMs("2026-08-10T12:00:00.000Z", NOW)).toBe(0);
  });

  test("a missing created_at yields null, never 0", () => {
    // The whole point: absent is honest, zero is a claim.
    expect(resumeElapsedMs(null, NOW)).toBeNull();
    expect(resumeElapsedMs(undefined, NOW)).toBeNull();
    expect(resumeElapsedMs("", NOW)).toBeNull();
  });

  test("an unparseable timestamp yields null, never NaN or 0", () => {
    // NaN would be written to an integer column and rejected or coerced; 0
    // would read as instantaneous. Both are worse than absent.
    expect(resumeElapsedMs("not a date", NOW)).toBeNull();
  });

  test("a future created_at yields null rather than a negative duration", () => {
    // Clock skew between the database and the worker is real. A negative
    // duration is not a measurement, and rendering one would be a visible bug
    // in the observe surface.
    expect(resumeElapsedMs("2026-08-10T13:00:00.000Z", NOW)).toBeNull();
  });
});
