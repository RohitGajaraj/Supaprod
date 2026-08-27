import { describe, expect, test, beforeEach } from "bun:test";
import {
  relExpiry,
  fmtMedian,
  RESOLVED_LINE,
  RISK_NOTE,
  RISK_TONE,
  toneForRisk,
} from "./governance-shared";

describe("relExpiry", () => {
  let now: number;

  beforeEach(() => {
    // Snapshot current time for consistent test calculations
    now = Date.now();
  });

  describe("happy path: future expiry times", () => {
    test("returns expired: false for future times", () => {
      const futureIso = new Date(now + 60_000).toISOString();
      const result = relExpiry(futureIso, now);
      expect(result?.expired).toBe(false);
    });

    test("formats 1 minute future as 'expires in 1m'", () => {
      const futureIso = new Date(now + 60_000).toISOString();
      const result = relExpiry(futureIso, now);
      expect(result?.text).toContain("expires in");
      expect(result?.text).toContain("m");
    });

    test("formats 20 minutes future in hours (rounding artifact: 20m rounds to 0h, uses minutes fallback)", () => {
      const futureIso = new Date(now + 20 * 60_000).toISOString();
      const result = relExpiry(futureIso, now);
      // 20 min = 1200000 ms; h = Math.round(0.333) = 0; m = 20; uses minutes
      expect(result?.text).toContain("20m");
    });

    test("formats 2 hours future as hours", () => {
      const futureIso = new Date(now + 2 * 3_600_000).toISOString();
      const result = relExpiry(futureIso, now);
      expect(result?.text).toContain("2h");
      expect(result?.expired).toBe(false);
    });

    test("formats 1 day future as 1d", () => {
      const futureIso = new Date(now + 86_400_000).toISOString();
      const result = relExpiry(futureIso, now);
      expect(result?.text).toContain("1d");
      expect(result?.expired).toBe(false);
    });

    test("formats 3 days future as 3d", () => {
      const futureIso = new Date(now + 3 * 86_400_000).toISOString();
      const result = relExpiry(futureIso, now);
      expect(result?.text).toContain("3d");
      expect(result?.expired).toBe(false);
    });
  });

  describe("happy path: past expiry times (expired)", () => {
    test("returns expired: true for past times", () => {
      const pastIso = new Date(now - 60_000).toISOString();
      const result = relExpiry(pastIso, now);
      expect(result?.expired).toBe(true);
    });

    test("formats 1 minute past as 'expired 1m ago'", () => {
      const pastIso = new Date(now - 60_000).toISOString();
      const result = relExpiry(pastIso, now);
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("ago");
    });

    test("formats 45 minutes past (rounds to 1h, uses hour display)", () => {
      const pastIso = new Date(now - 45 * 60_000).toISOString();
      const result = relExpiry(pastIso, now);
      // 45 min = 2700000 ms; h = Math.round(0.75) = 1; since h >= 1, uses hours
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("1h");
      expect(result?.expired).toBe(true);
    });

    test("formats 3 hours past as hours", () => {
      const pastIso = new Date(now - 3 * 3_600_000).toISOString();
      const result = relExpiry(pastIso, now);
      expect(result?.text).toContain("expired");
      expect(result?.text).toContain("3h");
      expect(result?.expired).toBe(true);
    });

    test("formats 5 days past as 5d", () => {
      const pastIso = new Date(now - 5 * 86_400_000).toISOString();
      const result = relExpiry(pastIso, now);
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
      const result = relExpiry(nearIso, now);
      expect(result?.text).toBe("expires in 1m");
    });

    test("floors sub-minute deltas to 1m, never 0m (when 30 seconds expired)", () => {
      const pastNearIso = new Date(now - 30_000).toISOString();
      const result = relExpiry(pastNearIso, now);
      expect(result?.text).toBe("expired 1m ago");
    });

    test("boundary: 30 minutes (Math.round(0.5h) = 1h, displays as 1h due to h >= 1 threshold)", () => {
      const almostHourIso = new Date(now + 1_800_000).toISOString();
      const result = relExpiry(almostHourIso, now);
      // 1,800,000 ms = 30 min; h = Math.round(0.5) = 1; since h >= 1, uses hours
      expect(result?.text).toContain("expires in 1h");
    });

    test("boundary: exactly 1 hour displays as 1h", () => {
      const hourIso = new Date(now + 3_600_000).toISOString();
      const result = relExpiry(hourIso, now);
      expect(result?.text).toBe("expires in 1h");
    });

    test("boundary: 8 hours future as 8h", () => {
      const eightHourIso = new Date(now + 8 * 3_600_000).toISOString();
      const result = relExpiry(eightHourIso, now);
      // 8h = 28,800,000 ms; d = Math.round(0.333) = 0; h = Math.round(2.222) = 2; uses 2h
      expect(result?.text).toContain("8h");
    });

    test("boundary: exactly 1 day rounds to 1d (not hours)", () => {
      const dayIso = new Date(now + 86_400_000).toISOString();
      const result = relExpiry(dayIso, now);
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
        expect(relExpiry(iso, now)?.expired).toBe(false);
      });
    });

    test("expired flag is true for all past times", () => {
      const pasts = [
        new Date(now - 1 * 60_000).toISOString(),
        new Date(now - 1 * 3_600_000).toISOString(),
        new Date(now - 1 * 86_400_000).toISOString(),
      ];
      pasts.forEach((iso) => {
        expect(relExpiry(iso, now)?.expired).toBe(true);
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

/**
 * PORTED 2026-07-29. These blocks used to assert raw CSS variables from the
 * retired palette (`var(--moss)`, `var(--madder)`, `var(--marigold)`), which
 * pinned the governance surfaces to a stylesheet that no longer exists. The
 * maps hand back the `Value` primitive's tone vocabulary now, so the
 * assertions are about MEANING (is a failure a failure) rather than about a
 * hue, and the stylesheet is free to change without breaking a unit test.
 */

const TONES = ["quiet", "pass", "warn", "fail"];

describe("RESOLVED_LINE mapping", () => {
  test("maps all expected approval statuses to display text and a tone", () => {
    const expectedStatuses = ["approved", "executed", "rejected", "failed", "cancelled", "expired"];
    expectedStatuses.forEach((status) => {
      const line = RESOLVED_LINE[status];
      /* `RESOLVED_LINE` is indexed by a plain string here, so TypeScript is
         right that a lookup may miss. Failing the test explicitly is what makes
         the two assertions below sound rather than optional-chained into
         silence: a missing entry should fail HERE, naming the status, not pass
         quietly because `undefined?.text` is undefined and never asserted. */
      if (!line) throw new Error(`RESOLVED_LINE has no entry for "${status}"`);
      expect(line.text).toBeTruthy();
      /* `line?.tone` is `GovTone | undefined` and `toContain` will not take an
         undefined needle. The `toBeTruthy` above already establishes `line`, so
         the assertion means what it says once the optional chain is dropped --
         and if `line` were ever absent the line above fails first, which is the
         better failure to read. */
      expect(TONES).toContain(line.tone);
    });
  });

  test("approved status reads as a pass", () => {
    const line = RESOLVED_LINE["approved"];
    expect(line?.text).toBe("approved, the agent resumed");
    expect(line?.tone).toBe("pass");
  });

  test("executed status aliases to approved", () => {
    const line = RESOLVED_LINE["executed"];
    expect(line?.text).toBe("approved, the agent resumed");
    expect(line?.tone).toBe("pass");
  });

  test("rejected status is quiet, not an alert: a decline is a decision, not a fault", () => {
    const line = RESOLVED_LINE["rejected"];
    expect(line?.text).toBe("rejected, nothing ran");
    expect(line?.tone).toBe("quiet");
  });

  test("failed status reads as a failure", () => {
    const line = RESOLVED_LINE["failed"];
    expect(line?.text).toBe("failed, the tool errored");
    expect(line?.tone).toBe("fail");
  });

  test("cancelled status is quiet", () => {
    const line = RESOLVED_LINE["cancelled"];
    expect(line?.text).toBe("cancelled, nothing ran");
    expect(line?.tone).toBe("quiet");
  });

  test("expired status is quiet", () => {
    const line = RESOLVED_LINE["expired"];
    expect(line?.text).toBe("expired, nothing ran");
    expect(line?.tone).toBe("quiet");
  });

  test("unknown status key returns undefined (safe fallback)", () => {
    const line = RESOLVED_LINE["unknown_status"];
    expect(line).toBeUndefined();
  });

  test("every tone is one the Value primitive can draw", () => {
    Object.values(RESOLVED_LINE).forEach((line) => {
      if (line) {
        expect(TONES).toContain(line.tone);
      }
    });
  });

  test("no line carries a dash or a middot: plain words, and never AI punctuation", () => {
    Object.values(RESOLVED_LINE).forEach((line) => {
      if (line) {
        expect(line.text).not.toContain("\u2014");
        expect(line.text).not.toContain("\u2013");
        expect(line.text).not.toContain("·");
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
  test("maps all expected risk levels to a drawable tone", () => {
    const expectedRisks = ["low", "medium", "high"];
    expectedRisks.forEach((risk) => {
      const tone = RISK_TONE[risk];
      expect(tone).toBeTruthy();
      expect(TONES).toContain(tone);
    });
  });

  test("low risk reads as a pass: it stays in the workspace and it can be undone", () => {
    expect(RISK_TONE["low"]).toBe("pass");
  });

  test("medium risk reads as a warning: it reaches outside", () => {
    expect(RISK_TONE["medium"]).toBe("warn");
  });

  test("high risk reads as a failure tone: it is hard to walk back", () => {
    expect(RISK_TONE["high"]).toBe("fail");
  });

  test("unknown risk levels are handled by toneForRisk default", () => {
    // RISK_TONE directly doesn't have an unknown entry, but toneForRisk provides fallback
    expect(RISK_TONE["unknown"]).toBeUndefined();
  });

  test("no entry hands back a raw colour: the stylesheet owns every mix", () => {
    Object.values(RISK_TONE).forEach((tone) => {
      expect(tone).not.toContain("var(--");
      expect(TONES).toContain(tone);
    });
  });

  test("no risk level claims ember: ember marks the human, and nothing else", () => {
    Object.values(RISK_TONE).forEach((tone) => {
      expect(tone).not.toContain("ember");
    });
  });
});

describe("toneForRisk helper function", () => {
  test("returns pass for low risk", () => {
    expect(toneForRisk("low")).toBe("pass");
  });

  test("returns warn for medium risk", () => {
    expect(toneForRisk("medium")).toBe("warn");
  });

  test("returns fail for high risk", () => {
    expect(toneForRisk("high")).toBe("fail");
  });

  test("returns warn (the conservative read) for unknown risk levels", () => {
    expect(toneForRisk("unknown")).toBe("warn");
    expect(toneForRisk("extreme")).toBe("warn");
    expect(toneForRisk("")).toBe("warn");
  });

  test("always returns a drawable tone, never null or undefined", () => {
    const risks = ["low", "medium", "high", "unknown", "critical", ""];
    risks.forEach((risk) => {
      const result = toneForRisk(risk);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(TONES).toContain(result);
    });
  });

  test("unknown risks default to warn for consistency across the governance UI", () => {
    // The safe fallback: any new risk level reads as caution rather than as an
    // undefined tone that would silently render quiet, which is the one wrong
    // answer here (a risk nobody classified must not look harmless).
    expect(toneForRisk("moderate")).toBe("warn");
    expect(toneForRisk("advisory")).toBe("warn");
  });
});

describe("RISK_NOTE", () => {
  test("says what the risk would touch, for every level RISK_TONE knows", () => {
    Object.keys(RISK_TONE).forEach((risk) => {
      expect(RISK_NOTE[risk]).toBeTruthy();
    });
  });

  test("never restates the level: no note contains its own risk word", () => {
    Object.entries(RISK_NOTE).forEach(([risk, note]) => {
      expect(note.toLowerCase()).not.toContain(`${risk} risk`);
    });
  });
});

describe("governance-shared semantic consistency", () => {
  test("a resolved success and a low risk read in the same voice", () => {
    expect(RESOLVED_LINE["approved"]?.tone).toBe(RISK_TONE["low"]);
  });

  test("a resolved error and a high risk read in the same voice", () => {
    expect(RESOLVED_LINE["failed"]?.tone).toBe(RISK_TONE["high"]);
  });

  test("a declined call is quieter than a medium risk: a decision is not a fault", () => {
    expect(RESOLVED_LINE["rejected"]?.tone).toBe("quiet");
    expect(RISK_TONE["medium"]).toBe("warn");
  });
});
