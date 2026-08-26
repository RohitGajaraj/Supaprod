/**
 * THE RECORD CAN ONLY TIGHTEN A GATE (2026-08-26).
 *
 * ── WHAT THIS FILE GUARDS ──────────────────────────────────────────────────
 * `approval-policy.ts` decides what a tool should need, from what a workspace has
 * actually answered. It has been correct and **callerless** since it was written,
 * because nothing ever built the record. `approval-policy.server.ts` is that
 * record, and wiring it changes when a person is interrupted — so the invariant
 * has to be nailed down before anything reads it.
 *
 * **THE INVARIANT: a record may switch a tool OFF or make it ask more often. It
 * may NEVER earn a tool more autonomy.** Loosening belongs to `trust-ramp.ts`,
 * whose design is that promotion "never silently flips: the proposal is itself an
 * approval item". A second ladder that could loosen a floor, driven by counting
 * rows, is the one thing this must not become.
 *
 * S1 asked for the opposite — *"an answered class should raise the autonomy rung
 * for that tool class"* — and that is a real capability, but it is not this
 * module and must not be bolted onto it.
 *
 * ── WHAT THE RECORD SAYS TODAY, MEASURED 2026-08-26 ────────────────────────
 *   delegate.openhands   0 approved · 7 rejected
 *   calendar.create      0 approved · 7 rejected
 * Fourteen requests for two tools refused every single time — the queue the
 * doctrine calls "a policy failure to surface, not a workload to render".
 */
import { describe, expect, it } from "bun:test";

import {
  resolveApprovalPolicy,
  isNeverLaxerThanDefault,
  type ApprovalTrackRecord,
} from "./approval-policy";
import { approvalRecordFor } from "./approval-policy.server";

/** A client that answers the ordered decided-approvals read. */
const rows = (statuses: string[]) =>
  ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            in: () => ({
              order: () => ({
                limit: async () => ({ data: statuses.map((s) => ({ status: s })), error: null }),
              }),
            }),
          }),
        }),
      }),
    }),
  }) as never;

const broken = () =>
  ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            in: () => ({
              order: () => ({
                limit: async () => ({ data: null, error: { message: "permission denied" } }),
              }),
            }),
          }),
        }),
      }),
    }),
  }) as never;

describe("the record is counted the way the contract describes", () => {
  it("counts approvals and refusals", async () => {
    const r = await approvalRecordFor(rows(["approved", "rejected", "approved"]), "w1", "t");
    expect(r).toEqual({ approved: 2, rejected: 1, consecutiveRejections: 0 });
  });

  it("consecutive refusals are newest-first and reset on any approval", async () => {
    // Newest first: two refusals, then an approval. The streak is 2, not 3.
    const r = await approvalRecordFor(rows(["rejected", "rejected", "approved", "rejected"]), "w1", "t");
    expect(r?.consecutiveRejections).toBe(2);
    expect(r?.rejected).toBe(3);
  });

  it("nobody has ruled yet is undefined, not an empty record", async () => {
    expect(await approvalRecordFor(rows([]), "w1", "t")).toBeUndefined();
  });

  it("A FAILED READ IS UNDEFINED, NOT AN EMPTY RECORD", async () => {
    /*
     * F-76's lesson at a governance seam. An empty record is the positive claim
     * "nobody has ever ruled on this", which would discard a real history of
     * refusals and re-open a tool a person switched off. `undefined` says "I do
     * not know" and the policy falls back to the axis default — the safe way to
     * be wrong.
     */
    expect(await approvalRecordFor(broken(), "w1", "t")).toBeUndefined();
  });
});

describe("THE INVARIANT: a record never buys more autonomy", () => {
  const TOOLS = [
    "calendar.create",
    "delegate.openhands",
    "studio.pr.merge",
    "studio.stage",
    "prd.draft",
    "memory.remember",
    "release.publish",
    "a.tool.nobody.catalogued",
  ];

  const RECORDS: ApprovalTrackRecord[] = [
    { approved: 0, rejected: 7, consecutiveRejections: 7 },
    { approved: 0, rejected: 3, consecutiveRejections: 3 },
    { approved: 9, rejected: 0, consecutiveRejections: 0 },
    { approved: 50, rejected: 1, consecutiveRejections: 0 },
    { approved: 1, rejected: 9, consecutiveRejections: 4 },
    { approved: 0, rejected: 1, consecutiveRejections: 1 },
  ];

  it("no tool, under any record, ends up laxer than its own default", () => {
    for (const tool of TOOLS) {
      for (const record of RECORDS) {
        expect(
          isNeverLaxerThanDefault({ tool, record }),
          `${tool} got laxer under ${JSON.stringify(record)}`,
        ).toBe(true);
      }
    }
  });

  it("a spotless record buys nothing — it returns the default unchanged", () => {
    // The clearest statement of the rule: 50 approvals and no refusals is still
    // exactly the axis default. Earning autonomy is trust-ramp's job.
    const spotless = { approved: 50, rejected: 0, consecutiveRejections: 0 };
    for (const tool of TOOLS) {
      expect(resolveApprovalPolicy({ tool, record: spotless }).decision).toBe(
        resolveApprovalPolicy({ tool }).decision,
      );
    }
  });

  it("the two tools this workspace always refuses would be switched off", () => {
    // The measured case for wiring it at all: 0 approved / 7 rejected, twice.
    const allRefused = { approved: 0, rejected: 7, consecutiveRejections: 7 };
    for (const tool of ["delegate.openhands", "calendar.create"]) {
      const p = resolveApprovalPolicy({ tool, record: allRefused });
      expect(p.decision).toBe("disabled");
      expect(p.reason).toContain("turned down");
    }
  });
});
