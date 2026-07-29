import { describe, expect, test } from "bun:test";

import { DEFAULT_MISSION_SPEND_CAP_USD, resolveMissionSpendCap } from "./mission-caps.server";

/** The two calls the resolver makes, faked at the shape it actually uses. */
function db(result: { data?: unknown; error?: unknown } | (() => never)) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => {
                  if (typeof result === "function") result();
                  return result as { data: unknown; error: unknown };
                },
              };
            },
          };
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("resolveMissionSpendCap", () => {
  test("an explicit number wins over everything", async () => {
    const cap = await resolveMissionSpendCap(
      db({ data: { default_mission_spend_cap_usd: 3 } }),
      "w",
      42,
    );
    expect(cap).toBe(42);
  });

  test("an explicit null means the dispatcher chose no ceiling, and is obeyed", async () => {
    // undefined is "nobody said"; null is "somebody said none". The resolver
    // has to tell those apart or an intentional uncapped run becomes capped.
    const cap = await resolveMissionSpendCap(
      db({ data: { default_mission_spend_cap_usd: 3 } }),
      "w",
      null,
    );
    expect(cap).toBeNull();
  });

  test("no explicit cap inherits the workspace default", async () => {
    const cap = await resolveMissionSpendCap(
      db({ data: { default_mission_spend_cap_usd: 25 } }),
      "w",
      undefined,
    );
    expect(cap).toBe(25);
  });

  test("a workspace that cleared its ceiling gets no ceiling", async () => {
    const cap = await resolveMissionSpendCap(
      db({ data: { default_mission_spend_cap_usd: null } }),
      "w",
      undefined,
    );
    expect(cap).toBeNull();
  });

  test("a numeric string from postgres numeric is read as a number", async () => {
    const cap = await resolveMissionSpendCap(
      db({ data: { default_mission_spend_cap_usd: "7.50" } }),
      "w",
      undefined,
    );
    expect(cap).toBe(7.5);
  });

  // THE FAIL DIRECTION. null means "no ceiling", so every failure path below
  // must land on the default and never on null. A database hiccup silently
  // removing the spending limit is exactly backwards for a safety control.
  describe("fails closed, never open", () => {
    test("a read error falls back to the default", async () => {
      const cap = await resolveMissionSpendCap(
        db({ data: null, error: { message: "boom" } }),
        "w",
        undefined,
      );
      expect(cap).toBe(DEFAULT_MISSION_SPEND_CAP_USD);
    });

    test("a missing workspace row falls back to the default", async () => {
      const cap = await resolveMissionSpendCap(db({ data: null }), "w", undefined);
      expect(cap).toBe(DEFAULT_MISSION_SPEND_CAP_USD);
    });

    test("a thrown client falls back to the default", async () => {
      const cap = await resolveMissionSpendCap(
        db(() => {
          throw new Error("network");
        }),
        "w",
        undefined,
      );
      expect(cap).toBe(DEFAULT_MISSION_SPEND_CAP_USD);
    });

    test("no workspace id falls back to the default", async () => {
      const cap = await resolveMissionSpendCap(db({ data: null }), null, undefined);
      expect(cap).toBe(DEFAULT_MISSION_SPEND_CAP_USD);
    });

    test("a nonsense stored value falls back rather than capping at zero", async () => {
      // 0 would halt the mission before its first call, and a negative or NaN
      // ceiling is not a decision anyone made.
      for (const bad of [0, -5, "not a number"]) {
        const cap = await resolveMissionSpendCap(
          db({ data: { default_mission_spend_cap_usd: bad } }),
          "w",
          undefined,
        );
        expect(cap).toBe(DEFAULT_MISSION_SPEND_CAP_USD);
      }
    });
  });

  test("the default is a real ceiling, not a placeholder", () => {
    expect(DEFAULT_MISSION_SPEND_CAP_USD).toBeGreaterThan(0);
    expect(Number.isFinite(DEFAULT_MISSION_SPEND_CAP_USD)).toBe(true);
  });
});
