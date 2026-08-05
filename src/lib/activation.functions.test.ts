/**
 * The registry is the reconciliation, so the registry is what gets tested.
 *
 * These tests hold two things still. First, the vocabulary: every name any of
 * the three vocabularies ever used must resolve to exactly one canonical name
 * and exactly one table, and a fourth vocabulary cannot appear without failing
 * here. Second, the routing: a funnel moment must reach funnel_milestones and
 * nothing else, a moment with no funnel stage must reach activation_events and
 * nothing else, and neither may ever be written twice.
 *
 * No database is touched. The client is injected, the same way recordStageEvent
 * and recordErrorEvent already allow.
 */
import { describe, it, expect } from "bun:test";
import {
  ACTIVATION_EVENTS,
  ACTIVATION_MOMENTS,
  ANONYMOUS_MOMENTS,
  FUNNEL_STAGE_BY_MOMENT,
  ONBOARDING_MILESTONES,
  __resetVendorSinkReportForTests,
  canonicalNameForMoment,
  isAnonymousMoment,
  recordActivationMoment,
  reportAnalyticsSinkOnce,
  sinkForMoment,
  type ActivationMoment,
  type MomentClient,
} from "./activation.functions";

// The five values funnel_milestones' CHECK admits (migration 20260710160000).
// Written out rather than imported so a change to the constraint has to be made
// deliberately in both places.
const FUNNEL_STAGES = ["signup", "connected", "first_teardown", "first_mission", "week_2_return"];

// ─── Test doubles ────────────────────────────────────────────────────────────

type Call = { table: string; op: "select" | "insert" | "upsert"; values?: Record<string, unknown> };

function makeClient(
  opts: {
    existing?: unknown[];
    upsertRows?: unknown[];
    upsertError?: { message: string } | null;
    insertError?: { message: string } | null;
    throwOnInsert?: boolean;
  } = {},
): { client: MomentClient; calls: Call[] } {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      return {
        select() {
          calls.push({ table, op: "select" });
          const q: Record<string, unknown> = {};
          q.eq = () => q;
          q.limit = () => q;
          q.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            Promise.resolve({ data: opts.existing ?? [], error: null }).then(res, rej);
          return q;
        },
        async insert(values: Record<string, unknown>) {
          calls.push({ table, op: "insert", values });
          if (opts.throwOnInsert) throw new Error("connection reset");
          return { error: opts.insertError ?? null };
        },
        upsert(values: Record<string, unknown>) {
          calls.push({ table, op: "upsert", values });
          return {
            async select() {
              return {
                data: opts.upsertError ? null : (opts.upsertRows ?? [{ id: 1 }]),
                error: opts.upsertError ?? null,
              };
            },
          };
        },
      };
    },
  } as unknown as MomentClient;
  return { client, calls };
}

/** Swallows the vendor-sink report so no test reaches error_events. */
const silentReport = async () => true;

// ─── The vocabulary ──────────────────────────────────────────────────────────

describe("one registry, not three vocabularies", () => {
  it("contains every name the public boundary accepts", () => {
    for (const name of ACTIVATION_EVENTS) {
      expect(ACTIVATION_MOMENTS).toContain(name);
    }
  });

  it("contains every name onboarding uses", () => {
    for (const name of ONBOARDING_MILESTONES) {
      expect(ACTIVATION_MOMENTS).toContain(name);
    }
  });

  it("lists each moment once, so no name has two meanings", () => {
    expect(new Set(ACTIVATION_MOMENTS).size).toBe(ACTIVATION_MOMENTS.length);
  });

  it("resolves every mapped moment to a stage the table's CHECK admits", () => {
    for (const stage of Object.values(FUNNEL_STAGE_BY_MOMENT)) {
      expect(FUNNEL_STAGES).toContain(stage as string);
    }
  });

  it("collapses the aliases for the same moment onto one canonical name", () => {
    // This is the whole defect the audit found: one moment, three spellings.
    expect(canonicalNameForMoment("signup_completed")).toBe("signup");
    expect(canonicalNameForMoment("signup")).toBe("signup");

    expect(canonicalNameForMoment("source_connected")).toBe("connected");
    expect(canonicalNameForMoment("notes_pasted")).toBe("connected");
    expect(canonicalNameForMoment("data_connected")).toBe("connected");

    expect(canonicalNameForMoment("first_teardown_viewed")).toBe("first_teardown");
    expect(canonicalNameForMoment("critic_completed")).toBe("first_teardown");

    expect(canonicalNameForMoment("first_mission_dispatched")).toBe("first_mission");
  });

  it("gives every moment exactly one sink", () => {
    for (const moment of ACTIVATION_MOMENTS) {
      const sink = sinkForMoment(moment);
      expect(["funnel_milestones", "activation_events"]).toContain(sink);
      // The sink follows from the stage and from nothing else, so the two can
      // never disagree.
      expect(sink === "funnel_milestones").toBe(Boolean(FUNNEL_STAGE_BY_MOMENT[moment]));
    }
  });

  it("keeps anonymous moments out of the ledger, which cannot hold them", () => {
    // funnel_milestones.user_id is NOT NULL and a demo visitor has no user.
    for (const moment of ANONYMOUS_MOMENTS) {
      expect(isAnonymousMoment(moment)).toBe(true);
      expect(FUNNEL_STAGE_BY_MOMENT[moment]).toBeUndefined();
      expect(sinkForMoment(moment)).toBe("activation_events");
    }
  });

  it("reaches every funnel stage a person can perform, and invents none", () => {
    const reached = new Set(Object.values(FUNNEL_STAGE_BY_MOMENT));
    for (const stage of FUNNEL_STAGES) {
      // week_2_return is computed by a batch scan, not performed. Naming a
      // moment for it would claim a detection the product does not have.
      if (stage === "week_2_return") {
        expect(reached.has(stage as never)).toBe(false);
        continue;
      }
      expect(reached.has(stage as never)).toBe(true);
    }
  });

  it("routes the two onboarding-only steps to the table that can hold them", () => {
    // No CHECK on activation_events.event_name, so these stop being dropped.
    for (const moment of ["product_named", "onboarding_completed"] as ActivationMoment[]) {
      expect(sinkForMoment(moment)).toBe("activation_events");
      expect(canonicalNameForMoment(moment)).toBe(moment);
    }
  });
});

// ─── The routing ─────────────────────────────────────────────────────────────

describe("recordActivationMoment writes one row, in one table", () => {
  it("sends a funnel moment to the ledger under its stage name, and nowhere else", async () => {
    __resetVendorSinkReportForTests();
    const { client, calls } = makeClient();
    const result = await recordActivationMoment(
      { moment: "data_connected", userId: "u1", workspaceId: "w1", metadata: { path: "seed" } },
      { client, report: silentReport },
    );

    expect(result).toMatchObject({ sink: "funnel_milestones", name: "connected", recorded: true });
    const writes = calls.filter((c) => c.op !== "select");
    expect(writes).toHaveLength(1);
    expect(writes[0].table).toBe("funnel_milestones");
    expect(writes[0].values).toMatchObject({
      stage: "connected",
      user_id: "u1",
      workspace_id: "w1",
    });
    expect(calls.some((c) => c.table === "activation_events")).toBe(false);
  });

  it("leaves completed_at to the database so a late call cannot date a milestone", async () => {
    __resetVendorSinkReportForTests();
    const { client, calls } = makeClient();
    await recordActivationMoment(
      { moment: "critic_completed", userId: "u1", workspaceId: "w1" },
      { client, report: silentReport },
    );
    const upsert = calls.find((c) => c.op === "upsert")!;
    expect(upsert.values).not.toHaveProperty("completed_at");
  });

  it("says already_recorded rather than claiming a second write", async () => {
    __resetVendorSinkReportForTests();
    const { client } = makeClient({ upsertRows: [] });
    const result = await recordActivationMoment(
      { moment: "first_mission_dispatched", userId: "u1", workspaceId: "w1" },
      { client, report: silentReport },
    );
    expect(result.recorded).toBe(false);
    expect(result.reason).toBe("already_recorded");
  });

  it("tells a failed write apart from a duplicate", async () => {
    __resetVendorSinkReportForTests();
    const { client } = makeClient({ upsertError: { message: "deadlock detected" } });
    const result = await recordActivationMoment(
      { moment: "source_connected", userId: "u1", workspaceId: "w1" },
      { client, report: silentReport },
    );
    expect(result.recorded).toBe(false);
    expect(result.reason).toBe("write_failed");
  });

  it("refuses a funnel moment with no workspace instead of writing a broken row", async () => {
    __resetVendorSinkReportForTests();
    const { client, calls } = makeClient();
    const result = await recordActivationMoment(
      { moment: "signup_completed", userId: "u1", workspaceId: null },
      { client, report: silentReport },
    );
    expect(result).toMatchObject({ recorded: false, reason: "no_workspace" });
    expect(calls.filter((c) => c.op !== "select")).toHaveLength(0);
  });

  it("sends a stage-less moment to the stream, under its own name", async () => {
    __resetVendorSinkReportForTests();
    const { client, calls } = makeClient({ existing: [] });
    const result = await recordActivationMoment(
      { moment: "onboarding_completed", userId: "u1", workspaceId: "w1", metadata: { path: "x" } },
      { client, report: silentReport },
    );

    expect(result).toMatchObject({
      sink: "activation_events",
      name: "onboarding_completed",
      recorded: true,
    });
    const writes = calls.filter((c) => c.op === "insert" || c.op === "upsert");
    expect(writes).toHaveLength(1);
    expect(writes[0].table).toBe("activation_events");
    expect(writes[0].values).toMatchObject({
      event_name: "onboarding_completed",
      user_id: "u1",
      workspace_id: "w1",
    });
    expect(calls.some((c) => c.table === "funnel_milestones")).toBe(false);
  });

  it("does not record an identified stream moment twice", async () => {
    __resetVendorSinkReportForTests();
    // completeOnboarding fires this server-side and the client fires it too.
    // One moment, one row.
    const { client, calls } = makeClient({ existing: [{ id: 7 }] });
    const result = await recordActivationMoment(
      { moment: "onboarding_completed", userId: "u1", workspaceId: "w1" },
      { client, report: silentReport },
    );
    expect(result).toMatchObject({ recorded: false, reason: "already_recorded" });
    expect(calls.filter((c) => c.op === "insert")).toHaveLength(0);
  });

  it("never throws, because telemetry may not be why a seed fails", async () => {
    __resetVendorSinkReportForTests();
    const { client } = makeClient({ throwOnInsert: true });
    const result = await recordActivationMoment(
      { moment: "product_named", userId: "u1", workspaceId: "w1" },
      { client, report: silentReport },
    );
    expect(result).toMatchObject({ recorded: false, reason: "write_failed" });
  });
});

// ─── The swallowed failure, made visible ─────────────────────────────────────

describe("reportAnalyticsSinkOnce", () => {
  it("reports a missing vendor key once, not once per call", async () => {
    __resetVendorSinkReportForTests();
    const reported: string[] = [];
    const report = async (err: unknown) => {
      reported.push((err as Error).message);
      return true;
    };
    const noKey = () => ({ posthog: { enabled: false } });

    const first = await reportAnalyticsSinkOnce({ report, readConfig: noKey });
    const second = await reportAnalyticsSinkOnce({ report, readConfig: noKey });
    const third = await reportAnalyticsSinkOnce({ report, readConfig: noKey });

    expect(first).toEqual({ ran: true, vendorConfigured: false });
    expect(second.ran).toBe(false);
    expect(third.ran).toBe(false);
    expect(reported).toHaveLength(1);
  });

  it("names the missing variable and the outcome, so the fix is obvious", async () => {
    __resetVendorSinkReportForTests();
    const reported: string[] = [];
    const report = async (err: unknown) => {
      reported.push((err as Error).message);
      return true;
    };
    await reportAnalyticsSinkOnce({ report, readConfig: () => ({ posthog: { enabled: false } }) });
    expect(reported[0]).toContain("POSTHOG_API_KEY");
    expect(reported[0]).toContain("activation_events");
  });

  it("reports nothing when the vendor key is present", async () => {
    __resetVendorSinkReportForTests();
    const reported: string[] = [];
    const report = async (err: unknown) => {
      reported.push((err as Error).message);
      return true;
    };
    const result = await reportAnalyticsSinkOnce({
      report,
      readConfig: () => ({ posthog: { enabled: true } }),
    });
    expect(result).toEqual({ ran: true, vendorConfigured: true });
    expect(reported).toHaveLength(0);
  });

  it("still answers when reading the config throws", async () => {
    __resetVendorSinkReportForTests();
    const result = await reportAnalyticsSinkOnce({
      report: silentReport,
      readConfig: () => {
        throw new Error("no process.env here");
      },
    });
    expect(result).toEqual({ ran: true, vendorConfigured: false });
  });
});
