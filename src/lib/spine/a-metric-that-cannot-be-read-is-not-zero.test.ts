/**
 * A METRIC THAT CANNOT BE READ IS NOT ZERO (Decide's metric probe, 2026-08-26).
 *
 * ── WHY THIS IS THE SHARPEST TEST IN THE PROBE ─────────────────────────────
 * The probe exists so a verdict can land against a forecast, which is the moat.
 * The way it could destroy that moat is by returning `0` when it could not read —
 * because `0` grades a forecast as MISSED, writes that verdict onto the record,
 * and compounds it into every later recommendation. **A wrong verdict is worse
 * than no verdict**: a missing one is visibly missing, and a wrong one is not.
 *
 * That is F-76's failure shape at the most expensive possible location. There, a
 * failed select came back `data: null`, `data ?? []` made it an empty list, and
 * "the query failed" was read as "the work is empty". Five station checks could
 * never pass and 22 tests said otherwise.
 *
 * ── WHAT THE DATABASE SAID WHEN THIS WAS WRITTEN, 2026-08-26 ───────────────
 *   174  decisions carry `forecast_how_we_will_know` AND a horizon
 *    15  are already PAST horizon and unresolved
 *     0  rows in `product_analytics` — ever, in any workspace
 * So forecasts are written, they come due, and the analytics table the outcome
 * machinery reads has never held a row. F-51 is not a broken grader; it is a
 * grader with nothing to read.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { probeObservable, isForecastCheckable } from "./metric-probe.server";

const SRC = readFileSync(
  fileURLToPath(new URL("./metric-probe.server.ts", import.meta.url)),
  "utf8",
);

/** A client whose count read succeeds. */
const counts = (n: number) =>
  ({
    from: () => ({
      select: () => ({
        eq: () => ({ count: n, error: null, then: undefined }),
        count: n,
        error: null,
      }),
    }),
  }) as never;

/** A client whose count read FAILS — the case that must never become zero. */
const broken = () =>
  ({
    from: () => ({
      select: () => ({
        eq: () => ({ count: null, error: { message: "permission denied" } }),
        count: null,
        error: { message: "permission denied" },
      }),
    }),
  }) as never;

describe("the unreadable cases never produce a number", () => {
  it("a forecast that does not say how we would know is not readable", async () => {
    const r = await probeObservable(counts(5), "   ", "w1");
    expect(r.readable).toBe(false);
    // No `value` on the union's unreadable branch at all — the type forbids it,
    // and this asserts the runtime agrees.
    expect((r as { value?: number }).value).toBeUndefined();
    if (!r.readable) expect(r.reason).toContain("does not say how we would know");
  });

  it("an observable nothing here can reach is not readable, and the wording blames the gap", async () => {
    const r = await probeObservable(counts(5), "our Stripe MRR at month end", "w1");
    expect(r.readable).toBe(false);
    if (!r.readable) {
      // Must NOT tell a person to rewrite a perfectly good forecast. The gap is a
      // connector nobody wired, and the sentence has to point there.
      expect(r.reason).toContain("Connect the source");
      expect(r.reason).not.toContain("invalid");
    }
    expect((r as { value?: number }).value).toBeUndefined();
  });

  it("A FAILED READ IS NOT A ZERO — the whole point of the file", async () => {
    const r = await probeObservable(broken(), "how many pieces of work complete", "w1");
    expect(r.readable).toBe(false);
    expect((r as { value?: number }).value).toBeUndefined();
    if (!r.readable) expect(r.reason).toContain("not a zero");
  });
});

describe("a real reading carries what makes it re-checkable", () => {
  it("returns the number, its source and its clock", async () => {
    const r = await probeObservable(counts(7), "how many pieces of work complete", "w1");
    expect(r.readable).toBe(true);
    if (r.readable) {
      expect(r.value).toBe(7);
      expect(r.source).toBe("spine_tracks");
      // A number without its clock is not evidence.
      expect(Date.parse(r.readAt)).toBeGreaterThan(0);
      expect(r.label).toBe("pieces of work");
    }
  });

  it("zero is a legitimate reading when it was actually measured", async () => {
    // The inverse of the rule: a real 0 must survive. Refusing to report a
    // measured zero would be its own dishonesty.
    const r = await probeObservable(counts(0), "how many signals arrived", "w1");
    expect(r.readable).toBe(true);
    if (r.readable) expect(r.value).toBe(0);
  });
});

describe("the Decide-time question, which is where the value is", () => {
  it("answers whether what was just promised is checkable at all", async () => {
    const yes = await isForecastCheckable(counts(3), "pieces of work that complete", "w1");
    expect(yes.checkable).toBe(true);
    expect(yes.because).toContain("Readable now");

    const no = await isForecastCheckable(counts(3), "our NPS in Delighted", "w1");
    expect(no.checkable).toBe(false);
    expect(no.because.length).toBeGreaterThan(20);
  });
});

describe("the guard against reintroducing the defect", () => {
  it("product_analytics is NOT a source, because it has never held a row", () => {
    // 0 rows ever, in every workspace, measured 2026-08-26. Listing it would make
    // every forecast it claimed unreadable-but-matched, which is a worse answer
    // than "nothing here can read that yet" — it would look wired and be empty.
    const sources = SRC.slice(SRC.indexOf("const SOURCES"), SRC.indexOf("export async function"));
    expect(sources).not.toContain("product_analytics");
  });

  it("every source reads its error rather than discarding it", () => {
    // The single line F-76 was missing.
    expect(SRC).toContain("if (error) return null;");
  });
});
