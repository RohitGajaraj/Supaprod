/**
 * R-27's fourth precondition: THE LOOP MAY SHIP ON ITS OWN ONLY WORK IT CAN BE
 * GRADED ON LATER.
 *
 * The other three preconditions ask whether the change is SAFE to deploy —
 * merged, CI green at that head sha, a live preview at that same commit. This
 * one asks whether the deploy will ever be ANSWERABLE, and it is the reason
 * R-27 is a platform answer rather than a loosened gate.
 *
 * `decision.record` already refuses a decision with no forecast, so every track
 * that walks the route carries one. Requiring it at the ship gate turns the moat
 * artifact into a safety mechanism: **a change nobody can grade cannot ship
 * itself.** That is strictly stronger than the click it replaces, because a
 * click proves nothing about the change and this proves the change is
 * answerable — and it cannot be copied by anyone who is not already capturing
 * forecasts at decision time.
 *
 * THE LINK IS TWO HOPS AND WAS VERIFIED AGAINST PRODUCTION BEFORE IT WAS
 * WRITTEN, not assumed:
 *
 *   SELECT artifact_kind, station, artifact_id, track_id FROM spine_track_members
 *    WHERE track_id='8391835f-...' AND artifact_kind='mission';
 *   -- mission | build | 4031c6d3-... | 8391835f-...
 *
 *   SELECT count(*), count(*) FILTER (WHERE forecast_claim IS NOT NULL
 *          AND btrim(forecast_claim) <> '' AND forecast_horizon_date IS NOT NULL)
 *     FROM decisions;   -- 348 | 167
 *
 * EVERY TEST BELOW IS A REFUSAL EXCEPT ONE. That ratio is the point: this guard
 * is worth exactly what it declines to let through, and each refusal has to say
 * WHICH link was missing (R-16), because the sentence lands on the approval a
 * person then has to answer.
 */
import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { unattendedShipIsGradable } from "@/lib/deployments.functions";

type Reply = { data: unknown; error: { message: string } | null };

/**
 * A PostgREST-shaped stub. Every filter returns `this`; the terminal call is
 * either `maybeSingle()` or awaiting the builder.
 *
 * REPLIES ARE A QUEUE PER TABLE, not one value per table, and the first version
 * of this file got that wrong. `spine_track_members` is read TWICE with
 * different shapes — the mission hop wants a row, the decision hop wants a list
 * — so a single scripted value made the second hop read the first hop's answer
 * and the happy-path test "passed" for the wrong reason. A stub that cannot tell
 * two calls apart is a stub that cannot tell a pass from a coincidence.
 */
function db(script: Record<string, Reply[]>): SupabaseClient {
  const queues: Record<string, Reply[]> = Object.fromEntries(
    Object.entries(script).map(([t, r]) => [t, [...r]]),
  );
  return {
    from(table: string) {
      const reply: Reply = queues[table]?.shift() ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        maybeSingle: async () => reply,
        then: (resolve: (r: Reply) => unknown) => Promise.resolve(reply).then(resolve),
      };
      for (const filter of ["select", "eq", "order", "limit", "not", "is"]) {
        builder[filter] = () => builder;
      }
      return builder;
    },
  } as unknown as SupabaseClient;
}

const CHANGESET = "11111111-1111-4111-8111-111111111111";

/** The four hops of an intact chain, in the order the guard walks them. */
function chain(over: Partial<Record<string, Reply[]>> = {}): Record<string, Reply[]> {
  return {
    studio_changesets: [{ data: { id: CHANGESET, mission_id: "m1" }, error: null }],
    spine_track_members: [
      { data: { track_id: "t1" }, error: null },
      { data: [{ artifact_id: "d1" }], error: null },
    ],
    decisions: [
      {
        data: {
          forecast_claim: "Mute rate drops to 12% or below within 30 days of rollout",
          forecast_horizon_date: "2026-09-25",
        },
        error: null,
      },
    ],
    ...over,
  };
}

describe("work the loop may ship on its own", () => {
  it("passes when the decision behind it recorded a claim and a horizon", async () => {
    const res = await unattendedShipIsGradable(db(chain()), CHANGESET);
    expect(res).toEqual({ ok: true, why: "" });
  });
});

describe("what it refuses, and whether it says why", () => {
  it("refuses a changeset that does not exist, and says so", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ studio_changesets: [{ data: null, error: null }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("does not exist");
  });

  /**
   * A READ THAT FAILED IS NOT A READ THAT FOUND NOTHING. Saying "no decision"
   * when the query errored blames the data for our own outage — the confusion
   * `promoteChangesetToProductionCore`'s preview reads were hardened against.
   */
  it("refuses on an unreadable changeset and names the database error", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ studio_changesets: [{ data: null, error: { message: "connection reset" } }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("connection reset");
    expect(res.why).not.toContain("does not exist");
  });

  it("refuses a changeset with no mission, so there is no run to trace", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({ studio_changesets: [{ data: { id: CHANGESET, mission_id: null }, error: null }] }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("mission");
  });

  it("refuses when the mission is filed against no piece of work", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ spine_track_members: [{ data: null, error: null }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("not filed against any piece of work");
  });

  /**
   * THE ONE THIS RULING EXISTS FOR. The chain is intact, the work is real, and
   * nobody ever wrote down what it was supposed to do — so nothing can grade the
   * deploy afterwards and it goes to a person.
   */
  it("refuses work whose decision recorded no forecast", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({
          decisions: [{ data: { forecast_claim: null, forecast_horizon_date: null }, error: null }],
        }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("no forecast");
  });

  it("refuses a whitespace-only claim, which is a forecast in the column and not in the world", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({
          decisions: [
            { data: { forecast_claim: "   ", forecast_horizon_date: "2026-09-25" }, error: null },
          ],
        }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("no forecast");
  });

  /**
   * BOTH HALVES, NOT JUST THE CLAIM. A claim with no horizon can never come due,
   * so nothing would ever grade it and the precondition would pass on work that
   * is gradable in principle and never in practice.
   */
  it("refuses a claim with no horizon, because it can never come due", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({
          decisions: [
            {
              data: { forecast_claim: "Mute rate drops", forecast_horizon_date: null },
              error: null,
            },
          ],
        }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("never come due");
  });

  /**
   * THE WHOLE POINT OF THE GUARD IS THAT IT REFUSES WHEN IT CANNOT SEE. A thrown
   * query is the least readable state of all, and R-22 generalises the rule: a
   * guard that cannot read its evidence must not be the thing that lets work
   * through.
   */
  it("refuses when the lookup throws rather than returning", async () => {
    const exploding = {
      from() {
        throw new Error("PostgREST unreachable");
      },
    } as unknown as SupabaseClient;
    const res = await unattendedShipIsGradable(exploding, CHANGESET);
    expect(res.ok).toBe(false);
    expect(res.why).toContain("PostgREST unreachable");
  });

  it("never returns ok with an empty reason, and never a reason with ok", async () => {
    const refusals = await Promise.all([
      unattendedShipIsGradable(
        db(chain({ studio_changesets: [{ data: null, error: null }] })),
        CHANGESET,
      ),
      unattendedShipIsGradable(
        db(
          chain({
            studio_changesets: [{ data: { id: CHANGESET, mission_id: null }, error: null }],
          }),
        ),
        CHANGESET,
      ),
    ]);
    for (const r of refusals) {
      expect(r.ok).toBe(false);
      expect(r.why.trim().length).toBeGreaterThan(10);
    }
  });
});
