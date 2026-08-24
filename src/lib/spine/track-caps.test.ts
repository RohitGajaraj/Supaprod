/**
 * The track ceiling's arithmetic and, more importantly, its fail direction.
 *
 * A spend cap is a safety control, so the interesting cases are not the happy
 * ones. They are: what happens when the workspace cannot be read, what happens
 * when a run's cost cannot be read, and whether "no ceiling" can be reached by
 * accident rather than by decision. Each of those is a way a ceiling silently
 * stops existing, which is worse than not having one, because the surface still
 * says there is a budget.
 */
import { describe, it, expect } from "bun:test";
import {
  DEFAULT_TRACK_SPEND_CAP_USD,
  UNMEASURED_RUN_USD,
  costOfRun,
  isOverTrackBudget,
  outOfTime,
  resolveTrackSpendCap,
  TICK_DEADLINE_MS,
} from "./track-caps.server";

/** A supabase stub that answers one workspace read. */
function ws(answer: { data?: unknown; error?: unknown } | "throw") {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (answer === "throw") throw new Error("network");
            return answer;
          },
        }),
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("the track spend ceiling", () => {
  it("uses the workspace's number when it has one", async () => {
    const cap = await resolveTrackSpendCap(
      ws({ data: { default_track_spend_cap_usd: 2.5 } }),
      "w1",
      undefined,
    );
    expect(cap).toBe(2.5);
  });

  it("falls back to the built-in when the workspace has not set one", async () => {
    const cap = await resolveTrackSpendCap(
      ws({ data: { default_track_spend_cap_usd: null } }),
      "w1",
      undefined,
    );
    /*
     * A WORKSPACE-LEVEL NULL IS AN OMISSION, so it gets the built-in number.
     *
     * This assertion used to read `toBeNull()`, on the reasoning that a null
     * workspace column is a deliberate "no ceiling". **The test's own name has
     * always said the opposite** -- "falls back to the built-in when the
     * workspace has NOT SET one" -- and the name was the half that was right.
     * Measured 2026-08-24: null in all 21 workspaces, a column with no default
     * that was never backfilled, and no surface anywhere that clears it. So the
     * decision it claimed to obey had never been made and could not be made, and
     * the effect was that the track spend ceiling was off everywhere.
     *
     * Migration `20260824230000` backfilled the rows and set the default.
     */
    expect(cap).toBe(DEFAULT_TRACK_SPEND_CAP_USD);
  });

  /**
   * The per-track escape hatch is untouched, and this is what says so. An
   * explicit `null` ARGUMENT is a person saying "no ceiling on this one piece of
   * work", which is a real decision made in one place about one thing. Only the
   * COLUMN changed meaning.
   */
  it("still honours an explicit per-track null as no ceiling", async () => {
    const cap = await resolveTrackSpendCap(
      ws({ data: { default_track_spend_cap_usd: 3 } }),
      "w1",
      null,
    );
    expect(cap).toBeNull();
  });

  it("falls back to the built-in when the workspace cannot be read", async () => {
    // THE FAIL DIRECTION. Returning null here would mean a database hiccup
    // silently removes the spending limit.
    expect(await resolveTrackSpendCap(ws({ error: { message: "boom" } }), "w1", undefined)).toBe(
      DEFAULT_TRACK_SPEND_CAP_USD,
    );
    expect(await resolveTrackSpendCap(ws("throw"), "w1", undefined)).toBe(
      DEFAULT_TRACK_SPEND_CAP_USD,
    );
    expect(await resolveTrackSpendCap(ws({ data: null }), "w1", undefined)).toBe(
      DEFAULT_TRACK_SPEND_CAP_USD,
    );
  });

  it("falls back to the built-in when there is no workspace at all", async () => {
    expect(await resolveTrackSpendCap(ws({ data: null }), null, undefined)).toBe(
      DEFAULT_TRACK_SPEND_CAP_USD,
    );
  });

  it("separates nobody-said from somebody-said-none", async () => {
    // `undefined` is "nobody said", so the workspace decides. `null` is a
    // person choosing no ceiling for this one track, and it wins outright.
    expect(
      await resolveTrackSpendCap(ws({ data: { default_track_spend_cap_usd: 3 } }), "w", null),
    ).toBeNull();
    expect(
      await resolveTrackSpendCap(ws({ data: { default_track_spend_cap_usd: 3 } }), "w", 9),
    ).toBe(9);
  });

  it("refuses a nonsense stored ceiling rather than trusting it", async () => {
    // Zero or negative would mean every track is instantly over budget; a
    // non-number would compare as NaN and never trip. Both resolve to the
    // built-in instead.
    for (const bad of [0, -1, "abc"]) {
      expect(
        await resolveTrackSpendCap(
          ws({ data: { default_track_spend_cap_usd: bad } }),
          "w",
          undefined,
        ),
      ).toBe(DEFAULT_TRACK_SPEND_CAP_USD);
    }
  });
});

describe("charging a run to the track", () => {
  const run = (answer: { data?: unknown; error?: unknown } | "throw") =>
    ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (answer === "throw") throw new Error("network");
              return answer;
            },
          }),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  it("charges what the run's own row says it spent", async () => {
    expect(await costOfRun(run({ data: { spend_used_usd: 0.031 } }), "r1")).toBe(0.031);
  });

  it("never charges zero for a run it could not price", async () => {
    // A cost that cannot be read must not be free, or an unreadable meter
    // becomes the way past the ceiling.
    expect(await costOfRun(run({ error: { message: "x" } }), "r1")).toBe(UNMEASURED_RUN_USD);
    expect(await costOfRun(run("throw"), "r1")).toBe(UNMEASURED_RUN_USD);
    expect(await costOfRun(run({ data: null }), "r1")).toBe(UNMEASURED_RUN_USD);
    expect(await costOfRun(run({ data: {} }), null)).toBe(UNMEASURED_RUN_USD);
    expect(await costOfRun(run({ data: { spend_used_usd: -5 } }), "r1")).toBe(UNMEASURED_RUN_USD);
  });

  it("treats a run that genuinely cost nothing as free", async () => {
    // Distinct from unreadable: zero on the row is an answer.
    expect(await costOfRun(run({ data: { spend_used_usd: 0 } }), "r1")).toBe(0);
  });
});

describe("the over-budget test", () => {
  it("stops at or past the ceiling, not only past it", () => {
    expect(isOverTrackBudget(4.99, 5)).toBe(false);
    expect(isOverTrackBudget(5, 5)).toBe(true);
    expect(isOverTrackBudget(5.01, 5)).toBe(true);
  });

  it("never stops a track whose ceiling was deliberately cleared", () => {
    expect(isOverTrackBudget(1_000_000, null)).toBe(false);
  });

  it("does not stop a track that has spent nothing", () => {
    expect(isOverTrackBudget(0, DEFAULT_TRACK_SPEND_CAP_USD)).toBe(false);
  });

  it("leaves room for a realistic full pass", () => {
    // A pass is about sixteen runs at roughly three cents, and about a dollar
    // fifty if every station retries to the attempt ceiling. The default must
    // sit well above that or it would interrupt real work rather than runaways.
    expect(isOverTrackBudget(1.5, DEFAULT_TRACK_SPEND_CAP_USD)).toBe(false);
  });
});

describe("the tick deadline", () => {
  it("keeps going while there is time", () => {
    expect(outOfTime(1_000, 1_000)).toBe(false);
    expect(outOfTime(1_000, 1_000 + TICK_DEADLINE_MS - 1)).toBe(false);
  });

  it("stops at the deadline, not after it", () => {
    expect(outOfTime(1_000, 1_000 + TICK_DEADLINE_MS)).toBe(true);
    expect(outOfTime(1_000, 1_000 + TICK_DEADLINE_MS + 60_000)).toBe(true);
  });

  it("leaves room for the bookkeeping of the seat already running", () => {
    // Being killed mid-tick loses the writes that record what was produced,
    // which is the failure this exists to prevent. The margin under a Worker's
    // limit is for finishing that seat, never for starting one more.
    expect(TICK_DEADLINE_MS).toBeLessThan(60_000);
  });
});
