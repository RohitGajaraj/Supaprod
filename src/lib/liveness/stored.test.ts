/**
 * Rebuilding the report from stored rows. These pin the decisions, not the
 * mapping:
 *
 *   1. the REGISTRY decides what appears, never the table
 *   2. a registered entry with no row reads `unknown`, not healthy
 *   3. a stored row for an unregistered id is ignored, not resurrected
 *   4. `ageMs` is dropped rather than re-served
 *
 * The fourth is the quiet one. An age was computed against the moment the probe
 * ran; re-serving it hours later reports a number that stopped moving while the
 * clock did not, and it would look entirely plausible on the page.
 */
import { describe, expect, test } from "bun:test";
import { reportFromStoredRows, type StoredResultRow } from "./stored";
import type { TrackedCapability } from "./registry";

const CAP = {
  id: "eval-judging",
  title: "The judge scoring what the models produced",
  proof: "An ai_evals row",
  cadence: "continuous",
  probe: { source: "job_runs", jobName: "cron.eval-tick" },
} as unknown as TrackedCapability;

const row = (over: Partial<StoredResultRow> = {}): StoredResultRow => ({
  capability_id: "eval-judging",
  kind: "capability",
  window_days: 7,
  verdict: "healthy",
  reason: "Ran 4 times in the window.",
  detail: { countInWindow: 4, lastAt: "2026-08-20T04:00:00.000Z", neverExecuted: false, ageMs: 999 },
  checked_at: "2026-08-20T04:05:00.000Z",
  ...over,
});

const registryOf = (caps: TrackedCapability[]) => ({
  windowDays: 7,
  capabilities: caps,
  integrityChecks: [],
  vocabularyChecks: [],
});

describe("reportFromStoredRows", () => {
  test("carries a stored verdict onto the registry entry", () => {
    const r = reportFromStoredRows([row()], registryOf([CAP]));
    expect(r.capabilities).toHaveLength(1);
    expect(r.capabilities[0].verdict).toBe("healthy");
    expect(r.capabilities[0].countInWindow).toBe(4);
    expect(r.capabilities[0].lastAt).toBe("2026-08-20T04:00:00.000Z");
    expect(r.capabilities[0].checkedAt).toBe("2026-08-20T04:05:00.000Z");
    expect(r.counts.healthy).toBe(1);
  });

  test("a registered capability with no row reads unknown, not healthy", () => {
    const r = reportFromStoredRows([], registryOf([CAP]));
    expect(r.capabilities[0].verdict).toBe("unknown");
    expect(r.capabilities[0].reason).toContain("Not checked yet");
    expect(r.counts.unknown).toBe(1);
    expect(r.counts.healthy).toBe(0);
    // It must still APPEAR. A capability invisible until the rotation reaches it
    // is a capability nobody knows they registered.
    expect(r.capabilities).toHaveLength(1);
  });

  test("a stored row for an unregistered id is ignored", () => {
    const r = reportFromStoredRows(
      [row({ capability_id: "deleted-capability", verdict: "dead" })],
      registryOf([CAP]),
    );
    expect(r.capabilities.map((c) => c.id)).toEqual(["eval-judging"]);
    // The removed one must not come back as a finding.
    expect(r.counts.dead).toBe(0);
    expect(r.capabilities[0].verdict).toBe("unknown");
  });

  test("does not re-serve a stored age", () => {
    const r = reportFromStoredRows([row()], registryOf([CAP]));
    // `detail.ageMs` was 999 and is deliberately not carried across: an age is a
    // reading taken at a moment, and `lastAt` is the fact that survives.
    expect(r.capabilities[0].ageMs).toBeNull();
    expect(r.capabilities[0].lastAt).toBe("2026-08-20T04:00:00.000Z");
  });

  test("a dead stored verdict is counted as dead", () => {
    const r = reportFromStoredRows(
      [row({ verdict: "dead", reason: "Nothing in 15 days." })],
      registryOf([CAP]),
    );
    expect(r.counts.dead).toBe(1);
    expect(r.capabilities[0].reason).toBe("Nothing in 15 days.");
  });

  test("survives a row whose detail is null or malformed", () => {
    const r = reportFromStoredRows([row({ detail: null })], registryOf([CAP]));
    // A row written by an older shape must not throw the whole page.
    expect(r.capabilities[0].countInWindow).toBe(0);
    expect(r.capabilities[0].lastAt).toBeNull();
    expect(r.capabilities[0].verdict).toBe("healthy");
  });
});
