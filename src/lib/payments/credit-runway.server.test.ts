/**
 * The delivery half, driven against a stubbed client.
 *
 * What is actually at risk here is not the arithmetic (that is pinned next
 * door) but the three ways this can be wrong in production and look fine:
 * warning on a ledger it could not read, warning once per CALL instead of once
 * per cycle, and reading a negative `reset` row as a burn. The 2026-08-22
 * ledger carries four negative resets, the largest -4,250 credits, and a burn
 * rate that counted one would warn every account on the day its cycle rolls.
 */
import { describe, expect, test } from "bun:test";

import { noteLowRunway } from "./credit-runway.server";

type Row = Record<string, unknown>;

/** Minimal stand-in for the two reads and one write this module performs. */
function stubAdmin(opts: { ledger?: Row[]; ledgerError?: boolean; priorWarnings?: Row[] }): {
  client: unknown;
  inserted: Row[];
  ledgerFilters: Record<string, unknown>;
} {
  const inserted: Row[] = [];
  const ledgerFilters: Record<string, unknown> = {};
  const client = {
    auth: {}, // no `admin` -> resolveUserEmail degrades to a no-send, as in a non-service-role deploy
    from(table: string) {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      Object.assign(builder, {
        select: chain,
        limit: chain,
        gte: chain,
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        eq: (col: string, val: unknown) => {
          if (table === "credit_ledger") ledgerFilters[col] = val;
          return builder;
        },
        insert: (row: Row) => {
          inserted.push({ table, ...row });
          return Promise.resolve({ data: null, error: null });
        },
        then: (resolve: (r: unknown) => unknown) => {
          if (table === "credit_ledger") {
            return Promise.resolve(
              opts.ledgerError
                ? { data: null, error: { message: "boom" } }
                : { data: opts.ledger ?? [], error: null },
            ).then(resolve);
          }
          return Promise.resolve({ data: opts.priorWarnings ?? [], error: null }).then(resolve);
        },
      });
      return builder;
    },
  };
  return { client, inserted, ledgerFilters };
}

const base = {
  userId: "u1",
  accountId: "a1",
  workspaceId: "w1",
  surface: "agent",
  balance: 560,
  projected: 16,
  monthlyGrantCredits: 750,
  cycleAnchorIso: "2026-08-22T02:20:02Z",
};

/** 731 credits over the 15-minute window is well past an hour's runway on 560. */
const HOT_LEDGER = [{ delta_credits: -731 }];

describe("noteLowRunway", () => {
  test("warns and records the notice when the runway is short", async () => {
    const { client, inserted } = stubAdmin({ ledger: HOT_LEDGER });
    const r = await noteLowRunway({
      ...base,
      accountId: "hot-1",
      admin: client as never,
    });
    expect(r.warned).toBe(true);
    expect(r.verdict?.warn).toBe(true);
    const evt = inserted.find((i) => i.table === "ai_events");
    expect(evt).toBeDefined();
    expect(evt!.error_code).toBe("gate_credit_low_runway");
    // Nothing was refused: this rides along with a call that is about to be served.
    expect(evt!.status).toBe("ok");
    // Attributed to the surface that was running, never to a coined one.
    expect(evt!.surface).toBe("agent");
    expect(String(evt!.error_message)).toContain("AI credits left");
  });

  test("stays silent when the account has already been warned this cycle", async () => {
    const { client, inserted } = stubAdmin({
      ledger: HOT_LEDGER,
      priorWarnings: [{ id: "prior" }],
    });
    const r = await noteLowRunway({ ...base, accountId: "hot-2", admin: client as never });
    expect(r.warned).toBe(false);
    expect(r.reason).toBe("already warned this cycle");
    expect(inserted).toHaveLength(0);
  });

  test("a ledger it cannot read produces silence, not a warning and not an all-clear", async () => {
    const { client, inserted } = stubAdmin({ ledgerError: true });
    const r = await noteLowRunway({ ...base, accountId: "unreadable-1", admin: client as never });
    expect(r.warned).toBe(false);
    expect(r.verdict).toBeNull();
    expect(r.reason).toBe("burn unreadable");
    expect(inserted).toHaveLength(0);
  });

  test("a negative monthly reset is not a burn", async () => {
    // The production shape: reason='reset', delta_credits=-4250 on cycle roll.
    // Counted as burn it is 283 credits a minute and every account is 'seconds
    // from empty'. Only rows the ledger calls a debit may reach the rate, and
    // the filter is asserted rather than assumed.
    const { client, ledgerFilters } = stubAdmin({ ledger: [] });
    await noteLowRunway({ ...base, accountId: "reset-1", admin: client as never });
    expect(ledgerFilters.reason).toBe("debit");
    expect(ledgerFilters.account_id).toBe("reset-1");
  });

  test("a quiet account with a low balance is not warned", async () => {
    const { client, inserted } = stubAdmin({ ledger: [] });
    const r = await noteLowRunway({
      ...base,
      accountId: "idle-1",
      balance: 120,
      admin: client as never,
    });
    expect(r.warned).toBe(false);
    expect(r.reason).toBe("runway above threshold");
    expect(inserted).toHaveLength(0);
  });

  test("an account already at zero is the refusal's story, not the warning's", async () => {
    const { client, inserted } = stubAdmin({ ledger: HOT_LEDGER });
    const r = await noteLowRunway({
      ...base,
      accountId: "empty-1",
      balance: 10,
      admin: client as never,
    });
    expect(r.warned).toBe(false);
    expect(inserted).toHaveLength(0);
  });
});
