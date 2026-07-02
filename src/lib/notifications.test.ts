import { expect, test, describe } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dispatchInstantEmail,
  generateDigest,
  isQuietHours,
  localHourInTimezone,
  type AppNotification,
} from "./notifications.functions";

describe("Notification Preferences & Dispatch (FS-03)", () => {
  const mockUserPreferences = {
    user_id: "test-user-id",
    email_approvals: true,
    email_health: false, // Disabled
    email_budget: true,
    email_drift: false, // Disabled
    in_app_approvals: true,
    in_app_health: true,
    in_app_budget: true,
    in_app_drift: true,
    digest_approvals: true,
    digest_health: true,
    digest_budget: false, // Disabled
    digest_drift: true,
    digest_frequency: "daily",
    updated_at: new Date().toISOString(),
  };

  // No `.auth.admin` on this mock, matching a plain client in a unit test: the
  // recipient-email lookup degrades to null rather than throwing, so a real
  // send never fires here — these tests verify the PREFERENCE-GATING decision,
  // not live delivery (that is Resend's integration surface, not unit-tested).
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: mockUserPreferences, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  test("dispatchInstantEmail blocks a category the user has disabled", async () => {
    const notification2: Pick<AppNotification, "kind" | "severity" | "title" | "detail"> = {
      kind: "health",
      severity: "warning",
      title: "Stalled run",
      detail: "Run 123 has been active for more than 30 minutes",
    };
    const res2 = await dispatchInstantEmail(mockSupabase, "test-user-id", notification2);
    expect(res2.sent).toBe(false);
    expect(res2.reason).toContain("disabled");
  });

  test("dispatchInstantEmail passes an allowed category through to the send attempt", async () => {
    const notification1: Pick<AppNotification, "kind" | "severity" | "title" | "detail"> = {
      kind: "approval",
      severity: "action",
      title: "Confirm tool call",
      detail: "Agent requests access to search_web",
    };
    const res1 = await dispatchInstantEmail(mockSupabase, "test-user-id", notification1);
    // Never blocked by preference; without a resolvable recipient email in this
    // mock, the honest outcome is "not sent, could not resolve recipient".
    expect(res1.reason).not.toContain("disabled");
    expect(res1.sent).toBe(false);
    expect(res1.reason).toContain("recipient");
  });

  test("generateDigest aggregates correctly based on digest preferences", async () => {
    const mockSupabaseForDigest = {
      from: (table: string) => {
        return {
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
          select: (fields: string, opts?: unknown) => {
            return {
              eq: (col: string, val: unknown) => {
                return {
                  eq: (col2: string, val2: unknown) => {
                    if (table === "agent_approvals") {
                      return Promise.resolve({
                        data: [{ tool_name: "git", agent_slug: "builder" }],
                        error: null,
                      });
                    }
                    if (table === "drift_incidents") {
                      return Promise.resolve({
                        data: [{ id: "drift-1" }],
                        error: null,
                      });
                    }
                    return Promise.resolve({ data: null, error: null });
                  },
                  in: (col2: string, val2: unknown) => {
                    return {
                      lt: (col3: string, val3: unknown) => {
                        // stalled query
                        return Promise.resolve({ count: 1, error: null });
                      },
                    };
                  },
                  maybeSingle: async () => {
                    if (table === "user_notification_preferences") {
                      return { data: mockUserPreferences, error: null };
                    }
                    if (table === "ai_budgets") {
                      return {
                        data: {
                          daily_usd_cap: 10,
                          daily_usd_used: 9.5, // 95% used (>80%), but digest_budget is false!
                        },
                        error: null,
                      };
                    }
                    return { data: null, error: null };
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    const res = await generateDigest(mockSupabaseForDigest, "test-user-id", "daily");
    expect(res.generated).toBe(true);
    expect(res.content).toContain("Approvals: 1 pending");
    expect(res.content).toContain("Health: 1 agent run(s)");
    expect(res.content).toContain("Drift: 1 active");
    // Should NOT contain Budget since digest_budget is false
    expect(res.content).not.toContain("Budget:");
  });
});

describe("isQuietHours (FS-03)", () => {
  test("inside a normal daytime window is not quiet", () => {
    expect(isQuietHours(14, 9, 18)).toBe(false);
  });

  test("before the working day starts is quiet", () => {
    expect(isQuietHours(7, 9, 18)).toBe(true);
  });

  test("after the working day ends is quiet", () => {
    expect(isQuietHours(20, 9, 18)).toBe(true);
  });

  test("a window that wraps past midnight is handled", () => {
    // "working hours" 22:00-06:00 (an overnight-shift config) - quiet is the
    // complementary daytime span.
    expect(isQuietHours(10, 22, 6)).toBe(true);
    expect(isQuietHours(23, 22, 6)).toBe(false);
    expect(isQuietHours(3, 22, 6)).toBe(false);
  });

  test("a degenerate start===end config is never quiet", () => {
    expect(isQuietHours(3, 9, 9)).toBe(false);
  });
});

describe("localHourInTimezone (FS-03)", () => {
  test("resolves a known offset correctly", () => {
    // 2026-01-15T12:00:00Z is 07:00 in America/New_York (UTC-5, standard time).
    const h = localHourInTimezone(new Date("2026-01-15T12:00:00Z"), "America/New_York");
    expect(h).toBe(7);
  });

  test("falls back to UTC on an invalid timezone rather than throwing", () => {
    const d = new Date("2026-01-15T12:00:00Z");
    expect(localHourInTimezone(d, "Not/A_Real_Zone")).toBe(d.getUTCHours());
  });
});
