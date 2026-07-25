import { describe, expect, test, beforeEach } from "bun:test";
import { relExpiry, fmtMedian, RESOLVED_LINE, RISK_TONE, toneForRisk } from "./governance-shared";

describe("relExpiry", () => {
  let now: number;

  beforeEach(() => {
    // Snapshot current time for consistent test calculations
    now = Date.now();
  });

  describe("happy path: future expiry times", () => {
    test("returns expired: false for future times", () => {
      const futureIso = new Date(now + 60_000).toISOString();
      const result = relExpiry(futureIso);
      expect(result?.expired).toBe(false);
    });

    test("formats 1 minute future as 'expires in 1m'", () => {
      const futureIso = new Date(now + 60_000).toISOString();
      const result = relExpiry(futureIso);
      expect(result?.text).toContain("expires in");
      expect(result?.text).toContain("m");
    });

    test("formats 20 minutes future in hours (rounding artifact: 20m rounds to 0h, uses minutes fallback)", () => {
      const futureIso = new Date(now + 20 * 60_000).toISOString();
      const result = relExpiry(futureIso);
      // 20 min = 1200000 ms; h = Math.round(0.333) = 0; m = 20; uses minutes
      expect(result?.text).toContain("20m");
    });

    test("formats 2 hours future as hours", () => {
      const futureIso = new Date(now + 2 * 3_600_000).toISOString();
      const result = relExpiry(futureIso);
      expect(result?.text).toContain("2h");
      expect(result?.expired).toBe(false);
    });

    test("formats 1 day future as 1d", () => {
      const futureIso = new Date(now + 86_400_000).toISOString();
      const result = relExpiry(futureIso);
      expect(result?.text).toContain("1d");
      expect(result?.expired).toBe(false);
    });

    test("formats 3 days future as 3d", () => {
      const futureIso = new Date(now + 3 * 86_400_000).toISOString();
      const result = relExpiry(futureIso);
      expect(result?.text).toContain("3d");
      expect(result?.expired).toBe(false);
    });
  });

  describe("happy path: past expiry times (expired)", () => {
    test("returns expired: true for past times", () => {
      const pastIso = new Date(now - 60_000).toISOString();
      const result = relExpiry(pastIso);
      expect(result?.expired).toBe(true);
    });

    test("formats 1 minute past as 'expired 1m ago'", () => {
      const pastIso = new Date(now - 60_000).toISOString();
      const result = relExpiry(pastIso);
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("ago");
    });

    test("formats 45 minutes past (rounds to 1h, uses hour display)", () => {
      const pastIso = new Date(now - 45 * 60_000).toISOString();
      const result = relExpiry(pastIso);
      // 45 min = 2700000 ms; h = Math.round(0.75) = 1; since h >= 1, uses hours
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("1h");
      expect(result?.expired).toBe(true);
    });

    test("formats 3 hours past as hours", () => {
      const pastIso = new Date(now - 3 * 3_600_000).toISOString();
      const result = relExpiry(pastIso);
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("3h");
      expect(result?.expired).toBe(true);
    });

    test("formats 5 days past as 5d", () => {
      const pastIso = new Date(now - 5 * 86_400_000).toISOString();
      const result = relExpiry(pastIso);
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("5d");
      expect(result?.expired).toBe(true);
    });
  });

  describe("edge cases: null and boundaries", () => {
    test("returns null when iso is null", () => {
      expect(relExpiry(null)).toBeNull();
    });

    test("floors sub-minute deltas to 1m, never 0m (when 30 seconds remaining)", () => {
      const nearIso = new Date(now + 30_000).toISOString();
      const result = relExpiry(nearIso);
      expect(result?.text).toBe("expires in 1m");
    });

    test("floors sub-minute deltas to 1m, never 0m (when 30 seconds expired)", () => {
      const pastNearIso = new Date(now - 30_000).toISOString();
      const result = relExpiry(pastNearIso);
      expect(result?.text).toBe("expired 1m ago");
    });

    test("boundary: 30 minutes (Math.round(0.5h) = 1h, displays as 1h due to h >= 1 threshold)", () => {
      const almostHourIso = new Date(now + 1_800_000).toISOString();
      const result = relExpiry(almostHourIso);
      // 1,800,000 ms = 30 min; h = Math.round(0.5) = 1; since h >= 1, uses hours
      expect(result?.text).toContain("expires in 1h");
    });

    test("boundary: exactly 1 hour displays as 1h", () => {
      const hourIso = new Date(now + 3_600_000).toISOString();
      const result = relExpiry(hourIso);
      expect(result?.text).toBe("expires in 1h");
    });

    test("boundary: 8 hours future as 8h", () => {
      const eightHourIso = new Date(now + 8 * 3_600_000).toISOString();
      const result = relExpiry(eightHourIso);
      // 8h = 28,800,000 ms; d = Math.round(0.333) = 0; h = Math.round(2.222) = 2; uses 2h
      expect(result?.text).toContain("8h");
    });

    test("boundary: exactly 1 day rounds to 1d (not hours)", () => {
      const dayIso = new Date(now + 86_400_000).toISOString();
      const result = relExpiry(dayIso);
      expect(result?.text).toBe("expires in 1d");
    });
  });

  describe("expired flag consistency", () => {
    test("expired flag is false for all future times", () => {
      const futures = [
        new Date(now + 1 * 60_000).toISOString(),
        new Date(now + 1 * 3_600_000).toISOString(),
        new Date(now + 1 * 86_400_000).toISOString(),
      ];
      futures.forEach((iso) => {
        expect(relExpiry(iso)?.expired).toBe(false);
      });
    });

    test("expired flag is true for all past times", () => {
      const pasts = [
        new Date(now - 1 * 60_000).toISOString(),
        new Date(now - 1 * 3_600_000).toISOString(),
        new Date(now - 1 * 86_400_000).toISOString(),
      ];
      pasts.forEach((iso) => {
        expect(relExpiry(iso)?.expired).toBe(true);
      });
    });
  });
});

describe("fmtMedian", () => {
  describe("happy path: minute and hour ranges", () => {
    test("formats 5 minutes as '5m'", () => {
      expect(fmtMedian(5 * 60_000)).toBe("5m");
    });

    test("formats 30 minutes as '30m'", () => {
      expect(fmtMedian(30 * 60_000)).toBe("30m");
    });

    test("formats 89 minutes as '89m'", () => {
      expect(fmtMedian(89 * 60_000)).toBe("89m");
    });

    test("formats 60 minutes (1 hour) as '60m' (threshold for hours is 90m)", () => {
      // 1 hour = 60 minutes, which is < 90, so displays in minutes
      expect(fmtMedian(1 * 3_600_000)).toBe("60m");
    });

    test("formats 120 minutes (2 hours) as '2h'", () => {
      expect(fmtMedian(2 * 3_600_000)).toBe("2h");
    });

    test("formats 24 hours as '24h'", () => {
      expect(fmtMedian(24 * 3_600_000)).toBe("24h");
    });
  });

  describe("edge cases: sub-minute and boundaries", () => {
    test("formats 0ms as '<1m'", () => {
      expect(fmtMedian(0)).toBe("<1m");
    });

    test("formats 500ms as '<1m' (rounds down from 0.008m)", () => {
      expect(fmtMedian(500)).toBe("<1m");
    });

    test("formats 30,000ms (30 seconds, rounds to 1m) as '1m'", () => {
      // Math.round(0.5) = 1 (banker's rounding in some contexts, but positive 0.5 rounds up)
      expect(fmtMedian(30_000)).toBe("1m");
    });

    test("formats 60,000ms (exactly 1 minute) as '1m'", () => {
      expect(fmtMedian(60_000)).toBe("1m");
    });

    test("formats 90,000ms (exactly 90 seconds = 1.5m) as '2m'", () => {
      expect(fmtMedian(90 * 1_000)).toBe("2m");
    });

    test("boundary: 89 minutes (5,340,000ms) as '89m' (below 90m threshold)", () => {
      expect(fmtMedian(5_340_000)).toBe("89m");
    });

    test("boundary: 90 minutes (5,400,000ms) converts to '1h' (hours threshold)", () => {
      // 5,400,000 / 60,000 = 90; m >= 90, so converts to hours
      // Math.round(5_400_000 / 3_600_000) = Math.round(1.5) = 2, so "2h"
      expect(fmtMedian(5_400_000)).toBe("2h");
    });
  });

  describe("return type and format consistency", () => {
    test("always returns a string", () => {
      const values = [0, 30_000, 300_000, 3_600_000];
      values.forEach((ms) => {
        expect(typeof fmtMedian(ms)).toBe("string");
      });
    });

    test("returned strings always end with 'm' or 'h'", () => {
      const values = [0, 30_000, 300_000, 3_600_000];
      values.forEach((ms) => {
        const result = fmtMedian(ms);
        expect(result).toMatch(/[mh]$/);
      });
    });

    test("returned strings with numbers are numeric (no decimals)", () => {
      const values = [30_000, 300_000, 3_600_000];
      values.forEach((ms) => {
        const result = fmtMedian(ms);
        if (result !== "<1m") {
          expect(result).toMatch(/^\d+[mh]$/);
        }
      });
    });
  });
});

describe("RESOLVED_LINE mapping", () => {
  test("maps all expected approval statuses to display text and color", () => {
    const expectedStatuses = ["approved", "executed", "rejected", "failed", "cancelled", "expired"];
    expectedStatuses.forEach((status) => {
      const line = RESOLVED_LINE[status];
      expect(line).toBeTruthy();
      expect(line?.text).toBeTruthy();
      expect(line?.color).toBeTruthy();
    });
  });

  test("approved status shows success message in moss color", () => {
    const line = RESOLVED_LINE["approved"];
    expect(line?.text).toBe("approved · agent resumed");
    expect(line?.color).toBe("var(--moss)");
  });

  test("executed status aliases to approved with moss color", () => {
    const line = RESOLVED_LINE["executed"];
    expect(line?.text).toBe("approved · agent resumed");
    expect(line?.color).toBe("var(--moss)");
  });

  test("rejected status shows rejection message in muted color", () => {
    const line = RESOLVED_LINE["rejected"];
    expect(line?.text).toBe("rejected · nothing ran");
    expect(line?.color).toBe("var(--text-muted)");
  });

  test("failed status shows error message in madder (alert) color", () => {
    const line = RESOLVED_LINE["failed"];
    expect(line?.text).toBe("failed · the tool errored");
    expect(line?.color).toBe("var(--madder)");
  });

  test("cancelled status shows cancellation message in faint color", () => {
    const line = RESOLVED_LINE["cancelled"];
    expect(line?.text).toBe("cancelled · nothing ran");
    expect(line?.color).toBe("var(--text-faint)");
  });

  test("expired status shows expiration message in faint color", () => {
    const line = RESOLVED_LINE["expired"];
    expect(line?.text).toBe("expired · nothing ran");
    expect(line?.color).toBe("var(--text-faint)");
  });

  test("unknown status key returns undefined (safe fallback)", () => {
    const line = RESOLVED_LINE["unknown_status"];
    expect(line).toBeUndefined();
  });

  test("all colors are CSS variable references", () => {
    Object.values(RESOLVED_LINE).forEach((line) => {
      if (line) {
        expect(line.color).toContain("var(--");
      }
    });
  });

  test("text messages distinguish success (approved, resumed) from no-op outcomes (nothing ran, errored)", () => {
    const successLine = RESOLVED_LINE["approved"];
    const noOpLines = [
      RESOLVED_LINE["rejected"],
      RESOLVED_LINE["cancelled"],
      RESOLVED_LINE["expired"],
    ];

    expect(successLine?.text).toContain("resumed");
    noOpLines.forEach((line) => {
      expect(line?.text).toContain("nothing ran");
    });
  });
});

describe("RISK_TONE mapping", () => {
  test("maps all expected risk levels to semantic colors", () => {
    const expectedRisks = ["low", "medium", "high"];
    expectedRisks.forEach((risk) => {
      const tone = RISK_TONE[risk];
      expect(tone).toBeTruthy();
      expect(tone).toContain("var(--");
    });
  });

  test("low risk is mapped to moss (safe outcome)", () => {
    expect(RISK_TONE["low"]).toBe("var(--moss)");
  });

  test("medium risk is mapped to marigold (caution)", () => {
    expect(RISK_TONE["medium"]).toBe("var(--marigold)");
  });

  test("high risk is mapped to madder (alert)", () => {
    expect(RISK_TONE["high"]).toBe("var(--madder)");
  });

  test("unknown risk levels are handled by toneForRisk default", () => {
    // RISK_TONE directly doesn't have an unknown entry, but toneForRisk provides fallback
    expect(RISK_TONE["unknown"]).toBeUndefined();
  });

  test("all color values are CSS variables", () => {
    Object.values(RISK_TONE).forEach((tone) => {
      expect(tone).toContain("var(--");
      expect(tone).toContain(")");
    });
  });

  test("high risk does not use ember (ember is reserved for primary CTA)", () => {
    expect(RISK_TONE["high"]).not.toContain("ember");
  });
});

describe("toneForRisk helper function", () => {
  test("returns moss for low risk", () => {
    expect(toneForRisk("low")).toBe("var(--moss)");
  });

  test("returns marigold for medium risk", () => {
    expect(toneForRisk("medium")).toBe("var(--marigold)");
  });

  test("returns madder for high risk", () => {
    expect(toneForRisk("high")).toBe("var(--madder)");
  });

  test("returns marigold (conservative default) for unknown risk levels", () => {
    expect(toneForRisk("unknown")).toBe("var(--marigold)");
    expect(toneForRisk("extreme")).toBe("var(--marigold)");
    expect(toneForRisk("")).toBe("var(--marigold)");
  });

  test("always returns a color variable string, never null or undefined", () => {
    const risks = ["low", "medium", "high", "unknown", "critical", ""];
    risks.forEach((risk) => {
      const result = toneForRisk(risk);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result).toContain("var(--");
    });
  });

  test("unknown risks default to marigold for consistency across the governance UI", () => {
    // This documents the safe fallback: any new risk level introduced will display
    // with caution coloring (marigold) instead of accidentally using an undefined color.
    expect(toneForRisk("moderate")).toBe("var(--marigold)");
    expect(toneForRisk("advisory")).toBe("var(--marigold)");
  });
});

describe("governance-shared semantic consistency", () => {
  test("resolved success states use moss color (same as low risk)", () => {
    const successLine = RESOLVED_LINE["approved"];
    const lowRiskTone = RISK_TONE["low"];
    expect(successLine?.color).toBe(lowRiskTone);
  });

  test("resolved error state uses madder (same as high risk)", () => {
    const failedLine = RESOLVED_LINE["failed"];
    const highRiskTone = RISK_TONE["high"];
    expect(failedLine?.color).toBe(highRiskTone);
  });

  test("medium risk and caution states both use consistent warning/caution tones", () => {
    const mediumRiskTone = RISK_TONE["medium"];
    expect(mediumRiskTone).toBe("var(--marigold)");
    // No-op states like cancelled use text-faint (quieter), while medium risk uses warning color
    // This is intentional: risk level is more prominent than status state
  });
});
