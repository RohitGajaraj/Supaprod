import { describe, it, expect } from "bun:test";
import {
  buildSpendGlance,
  buildQualityGlance,
  buildSafetyGlance,
  buildRecordGlance,
  zeroFillDaily,
  ROOM_TAB_META,
  tabLabel,
  type RoomKey,
} from "../engine-room-glance";

describe("engine-room-glance builders (LOOM honesty law: real numbers or none)", () => {
  it("reads the budget meter, cap and used from the same row, window named (one truth)", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 40 },
      costThisWeek: 10,
    });
    expect(spend.verdict).toBe("$40 of $100 monthly cap");
    expect(spend.state).toBe("healthy");
  });

  it("flags Spend as watch when usage crosses 80% of the cap", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 81 },
      costThisWeek: 20,
    });
    expect(spend.state).toBe("watch");
    expect(spend.verdict).toBe("$81 of $100 monthly cap");
  });

  it("falls back to the daily cap, labeled daily, when no monthly cap exists", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: 20, monthly_usd_cap: null, daily_usd_used: 5 },
      costThisWeek: 9,
    });
    expect(spend.verdict).toBe("$5.00 of $20 daily cap");
    expect(spend.state).toBe("healthy");
  });

  it("reports spend honestly with no cap of ANY kind configured", () => {
    // Wording changed 2026-08-03, deliberately. It used to read "no cap set"
    // whenever the ai_budgets meter was empty, which is a true statement about one
    // control read as a claim about every control. Every workspace in the live
    // database carried a 10 USD per-run ceiling at the time, /build displayed it,
    // and /runs said "Nothing caps this yet" a third time. This branch is now the
    // genuinely uncapped case: no period budget AND no per-run ceiling.
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: null },
      costThisWeek: 12,
      missionCapUsd: null,
    });
    expect(spend.state).toBe("healthy");
    expect(spend.verdict).toBe("$12 this week · nothing caps this");
  });

  it("names the per-run ceiling when there is no period budget", () => {
    // The case that was being misreported: unbounded per week, bounded per run.
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: null },
      costThisWeek: 2.16,
      missionCapUsd: 10,
    });
    expect(spend.verdict).toBe("$2.16 this week · no weekly cap · $10 a run");
  });

  it("never rounds a small real amount to a fabricated $0", () => {
    const spend = buildSpendGlance({ global: null, costThisWeek: 0.01, missionCapUsd: null });
    expect(spend.verdict).toBe("$0.01 this week · nothing caps this");
  });

  it("reads the pass-rate report (the room's own source) with the scope labeled", () => {
    const quality = buildQualityGlance({
      passRate: 0.75,
      totalRuns: 12,
      verdict: "watch",
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Pass rate 75% across 12 runs · no drift");
  });

  it("flags Quality as watch when drift is open even with a healthy pass rate", () => {
    const quality = buildQualityGlance({
      passRate: 0.95,
      totalRuns: 1,
      verdict: "healthy",
      driftOpenCount: 2,
    });
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Pass rate 95% across 1 run · drift open");
  });

  it("stays healthy when the report is healthy and no drift is open", () => {
    const quality = buildQualityGlance({
      passRate: 0.92,
      totalRuns: 20,
      verdict: "healthy",
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("healthy");
    expect(quality.verdict).toBe("Pass rate 92% across 20 runs · no drift");
  });

  it("says 'no eval runs yet' honestly instead of inventing a rate", () => {
    const quality = buildQualityGlance({
      passRate: null,
      totalRuns: 0,
      verdict: "no-data",
      driftOpenCount: 0,
    });
    expect(quality.state).toBe("healthy");
    expect(quality.verdict).toBe("No eval runs yet · no drift");
  });

  it("flags Safety as watch on any open incident", () => {
    const safety = buildSafetyGlance({
      rules: [{ enabled: true }, { enabled: true }, { enabled: false }],
      incidentCount: 1,
    });
    expect(safety.state).toBe("watch");
    expect(safety.verdict).toBe("2 guardrails on · 1 incident");
  });

  it("keeps Safety healthy with zero incidents", () => {
    const safety = buildSafetyGlance({ rules: [{ enabled: true }], incidentCount: 0 });
    expect(safety.state).toBe("healthy");
    expect(safety.verdict).toBe("1 guardrail on · 0 incidents");
  });

  it("reports Record as healthy when the ledger verifies, window named", () => {
    const record = buildRecordGlance({ traceCount: 1284, ledgerVerifies: true });
    expect(record.state).toBe("healthy");
    expect(record.verdict).toBe("1,284 runs this week · audit trail intact");
  });

  it("surfaces an unverified ledger honestly without changing room state", () => {
    const record = buildRecordGlance({ traceCount: 3, ledgerVerifies: false });
    expect(record.verdict).toBe("3 runs this week · audit trail unverified");
  });
});

describe("zeroFillDaily (OBS-15)", () => {
  const ASOF = Date.parse("2026-07-03T12:00:00Z");

  it("zero-fills every day when the sparse series is empty", () => {
    expect(zeroFillDaily([], 7, ASOF)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("places a real value at its own day, oldest first, without shifting a gap day next to its neighbor", () => {
    // Spend happened only on day 1 (2026-06-27) and day 7 (2026-07-03) of the
    // window; the 5 days between must stay real zeros, not be collapsed out.
    const daily = [
      { day: "2026-06-27", cost: 12 },
      { day: "2026-07-03", cost: 40 },
    ];
    expect(zeroFillDaily(daily, 7, ASOF)).toEqual([12, 0, 0, 0, 0, 0, 40]);
  });

  it("ignores a bucket entry outside the requested window", () => {
    const daily = [
      { day: "2026-06-01", cost: 999 }, // outside a 7-day window ending at ASOF
      { day: "2026-07-01", cost: 5 },
    ];
    const filled = zeroFillDaily(daily, 7, ASOF);
    expect(filled.reduce((a, b) => a + b, 0)).toBe(5);
  });
});

describe("Engine Room naming model (plain outcome on top, technical trace beneath)", () => {
  const rooms: RoomKey[] = ["spend", "quality", "safety", "record"];

  it("gives every tab a plain label, a technical term, and a one-line descriptor", () => {
    for (const room of rooms) {
      const tabs = ROOM_TAB_META[room];
      expect(tabs.length).toBeGreaterThan(0);
      for (const t of tabs) {
        expect(t.id.length).toBeGreaterThan(0);
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.technical.length).toBeGreaterThan(0);
        expect(t.descriptor.length).toBeGreaterThan(0);
        // The plain label is a real rename, never the raw id echoed back.
        expect(t.label.toLowerCase()).not.toBe(t.id.toLowerCase());
      }
    }
  });

  it("keeps the exact ?view= ids the room bodies switch on", () => {
    expect(ROOM_TAB_META.spend.map((t) => t.id)).toEqual([
      // The activation funnel moved to admin observability (IA 2026-07-11):
      // Spend answers only the cost question.
      "trend",
      "by-agent",
      "caps",
      "usage",
    ]);
    expect(ROOM_TAB_META.quality.map((t) => t.id)).toEqual([
      /*
       * "diagnostics" leads since 2026-08-17. The Diagnostics door was taken out of the
       * Settings rail with a comment claiming the Engine Room drew it instead; nothing
       * did, and nothing linked `?section=health`, so a live report with two real server
       * reads was reachable only by typing a URL. QualityRoom now mounts the same
       * component the Settings address renders, so the two cannot disagree.
       */
      "diagnostics",
      "score",
      "calibration",
      "suites",
      "drift",
      // RPT-50: the self-improvement engine rides Quality as "What to fix".
      "self-improvement",
      "prompts",
      "proof",
    ]);
    expect(ROOM_TAB_META.safety.map((t) => t.id)).toEqual([
      "rules",
      "controls",
      "team",
      "house-rules",
      "routines",
      "incidents",
    ]);
    expect(ROOM_TAB_META.record.map((t) => t.id)).toEqual([
      // RPT-31: the verification cockpit opens the Record room; receipts is
      // the merged Trust Ledger home (IA 2026-07-11, tamper seal lives there).
      "verify",
      "receipts",
      "traces",
      "approvals",
      "support",
    ]);
  });

  it("resolves the plain outcome label and falls back to the id when unknown", () => {
    expect(tabLabel("quality", "score")).toBe("Right now");
    expect(tabLabel("quality", "drift")).toBe("Is it slipping?");
    expect(tabLabel("record", "receipts")).toBe("Paper trail");
    expect(tabLabel("spend", "nonexistent")).toBe("nonexistent");
  });
});

describe("Engine Room recommended action (derived from real state, watch only)", () => {
  it("adds a plain next step when Spend is on watch, none when healthy", () => {
    const watch = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 90 },
      costThisWeek: 20,
    });
    expect(watch.state).toBe("watch");
    expect((watch.action ?? "").length).toBeGreaterThan(0);
    const healthy = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 10 },
      costThisWeek: 5,
    });
    expect(healthy.action).toBeUndefined();
  });

  it("points Quality at the right plain tab depending on whether drift is open", () => {
    const drift = buildQualityGlance({
      passRate: 0.95,
      totalRuns: 3,
      verdict: "healthy",
      driftOpenCount: 1,
    });
    expect(drift.action).toContain("Is it slipping?");
    const failing = buildQualityGlance({
      passRate: 0.4,
      totalRuns: 10,
      verdict: "at-risk",
      driftOpenCount: 0,
    });
    expect(failing.action).toContain("What we test");
  });

  it("points Safety at What went wrong on an open incident", () => {
    const safety = buildSafetyGlance({ rules: [{ enabled: true }], incidentCount: 2 });
    expect(safety.action).toContain("What went wrong");
  });

  it("leaves a healthy Record with no next step", () => {
    const record = buildRecordGlance({ traceCount: 10, ledgerVerifies: true });
    expect(record.action).toBeUndefined();
  });
});

/**
 * THE ZERO-GUARDRAIL BUG (fixed 2026-08-06).
 *
 * `buildSafetyGlance` keyed its state on `incidentCount > 0` and nothing else,
 * so a workspace that had never switched a guardrail on came back `healthy`,
 * and the Engine Room headline counted it into "All four rooms are clear."
 * Seventeen of the twenty-one workspaces in the live database have zero
 * guardrail rules, so that was the majority reading.
 *
 * WHY NOTHING CAUGHT IT. Every Safety case in the block above passes a
 * non-empty `rules` array with at least one `enabled: true`. The zero-enabled
 * branch had never once been executed by a test, which is the ordinary way a
 * suite can be green and a defect can be the common case: the fixture never
 * reached the code path.
 */
describe("Safety: zero enabled guardrails is unconfigured, not clear", () => {
  it("returns unconfigured, not healthy, when no rule has ever been set", () => {
    const safety = buildSafetyGlance({ rules: [], incidentCount: 0 });
    expect(safety.state).toBe("unconfigured");
    expect(safety.verdict).toBe("No guardrails set · 0 incidents");
  });

  it("points the next step at the tab where guardrails are actually set", () => {
    const safety = buildSafetyGlance({ rules: [], incidentCount: 0 });
    // "What is allowed" is the plain label of the `rules` tab, which is the
    // door this state exists to send someone through. An unconfigured state
    // with no door is only half a fix.
    expect(safety.action).toContain("What is allowed");
    expect(ROOM_TAB_META.safety.some((t) => t.label === "What is allowed")).toBe(true);
  });

  it("calls a workspace with rules configured but all switched off unconfigured too", () => {
    // The same position as having none, and keying on `rules.length` instead of
    // the enabled count would have called this one healthy: the same bug one
    // step to the left.
    const safety = buildSafetyGlance({
      rules: [{ enabled: false }, { enabled: false }, { enabled: false }],
      incidentCount: 0,
    });
    expect(safety.state).toBe("unconfigured");
    expect(safety.verdict).toBe("3 guardrails set, none switched on · 0 incidents");
    expect(safety.action).toContain("switched off");
  });

  it("lets a real incident outrank the empty setup without losing either fact", () => {
    const safety = buildSafetyGlance({ rules: [], incidentCount: 2 });
    // Something that went wrong is more urgent than something never set up.
    expect(safety.state).toBe("watch");
    // But the action must still say how to set it up, or the more urgent fact
    // silently swallows the structural one.
    expect(safety.action).toContain("What is allowed");
    expect(safety.action).toContain("What went wrong");
  });

  it("keeps a configured, quiet workspace healthy (the state is not now always unconfigured)", () => {
    const safety = buildSafetyGlance({ rules: [{ enabled: true }], incidentCount: 0 });
    expect(safety.state).toBe("healthy");
    expect(safety.action).toBeUndefined();
  });
});

describe("The volumes on the door (facts the reads already returned)", () => {
  // 2026-08-06. Every figure asserted here was computed on the server, sent
  // over the wire and dropped: the founder's "those are NOT SPEAKING TO THE
  // VOLUMES AND DEPTH" was, underneath, nine reads forwarded as four sentences.
  const ASOF = Date.parse("2026-08-06T12:00:00Z");

  function figure(
    g: { figures: { label: string; value: string; note?: string }[] },
    label: string,
  ) {
    return g.figures.find((f) => f.label === label);
  }

  const DAILY = [
    { day: "2026-08-04", cost: 1.1522 },
    { day: "2026-08-05", cost: 0.6348 },
    { day: "2026-08-06", cost: 0.2 },
  ];

  it("carries Spend's call count, token volume and day-over-day move", () => {
    const spend = buildSpendGlance({
      global: null,
      costThisWeek: 9.26,
      missionCapUsd: 10,
      callsThisWeek: 15577,
      tokensThisWeek: 22_157_443,
      daily: DAILY,
      windowIsWhole: true,
      asOfMs: ASOF,
    });
    expect(figure(spend, "calls")?.value).toBe("15,577");
    expect(figure(spend, "tokens")?.value).toBe("22M");
    /**
     * THE DAYS ARE NAMED, NOT CALLED "YESTERDAY".
     *
     * The buckets are keyed on `created_at.slice(0, 10)`, which is UTC, while
     * "yesterday" is a claim about the READER'S calendar. East of UTC the two
     * disagree for part of every day: in IST, before 05:30 local, the bucket
     * labelled "yesterday" is the day before last. That was wrong on the
     * founder's own screen for five and a half hours out of every twenty-four,
     * silently, and no test could catch it because both the label and the
     * bucket were internally consistent.
     *
     * A date is true in every timezone. It is the complete day before the
     * partial one, which is still why today's bucket is not the number here.
     */
    expect(figure(spend, "5 Aug")?.value).toBe("$0.63");
    expect(figure(spend, "5 Aug")?.note).toBe("down from $1.15 on 4 Aug");
    expect(figure(spend, "yesterday")).toBeUndefined();
  });

  it("states no trend at all when the read was capped", () => {
    /**
     * A CAPPED READ CANNOT STATE A TREND, because the days it is missing are
     * exactly the days it would compare against. `getAnalyticsOverview` reads
     * `created_at DESC` under a cap, so when the cap bites the OLDEST events
     * fall out and the earliest buckets vanish. Zero-filling then supplies 0
     * for them and the trend read that 0 as real: "up from $0.00 the day
     * before", about a day nobody had looked at.
     */
    const spend = buildSpendGlance({
      global: null,
      costThisWeek: 9.26,
      missionCapUsd: 10,
      daily: DAILY,
      windowIsWhole: false,
      asOfMs: ASOF,
    });
    expect(spend.figures.find((f) => f.note?.includes("on 4 Aug"))).toBeUndefined();
    expect(figure(spend, "5 Aug")).toBeUndefined();
  });

  it("stands down for a caller that has not been taught to pass the flag", () => {
    // The default is FALSE on purpose. A caller wired before this existed gets
    // silence rather than a trend that may be fabricated, because a wrong
    // direction of travel is worse than a missing figure.
    const spend = buildSpendGlance({
      global: null,
      costThisWeek: 9.26,
      missionCapUsd: 10,
      daily: DAILY,
      asOfMs: ASOF,
    });
    expect(figure(spend, "5 Aug")).toBeUndefined();
  });

  it("names the COSTLIEST model, not the chattiest one", () => {
    const spend = buildSpendGlance({
      global: null,
      costThisWeek: 4,
      byModel: [
        // The read hands these over sorted by runs, so a naive [0] picks the
        // cheap chatty one and answers the wrong question in a room whose
        // question is "what is this costing me".
        { model: "haiku", runs: 9000, cost: 0.4 },
        { model: "opus", runs: 120, cost: 3.6 },
      ],
    });
    expect(figure(spend, "costliest model")?.value).toBe("opus");
    expect(figure(spend, "costliest model")?.note).toBe("$3.60 across 120 calls");
  });

  it("shows the share of a configured cap alongside the meter reading", () => {
    const spend = buildSpendGlance({
      global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 42 },
      costThisWeek: 12,
    });
    expect(spend.verdict).toBe("$42 of $100 monthly cap");
    expect(figure(spend, "of the cap")?.value).toBe("42%");
    expect(figure(spend, "of the cap")?.note).toBe("used this month");
  });

  it("carries Quality's judge score, trend and suite count, and dates the open drift", () => {
    const quality = buildQualityGlance({
      passRate: 0.92,
      totalRuns: 20,
      verdict: "healthy",
      driftOpenCount: 4,
      avgScore: 84.63,
      errorRate: 0.05,
      suiteCount: 14,
      flakyCount: 1,
      trend: "declining",
      latestDrift: {
        surface: "roadmap",
        metric: "latency_ms",
        delta_pct: 37.4,
        detected_at: "2026-08-05T09:00:00Z",
      },
    });
    // avg_score is stored 0-100, so the scale is named rather than left to be
    // guessed at against a pass rate on the same card that is a percentage.
    expect(figure(quality, "average score")?.value).toBe("85");
    expect(figure(quality, "average score")?.note).toBe("out of 100, judged");
    expect(figure(quality, "trend")?.value).toBe("declining");
    expect(figure(quality, "suites")?.value).toBe("14");
    expect(figure(quality, "errored")?.value).toBe("5%");
    expect(figure(quality, "flaky suites")?.value).toBe("1");
    expect(quality.latest).toEqual({
      what: "latency_ms on roadmap moved +37%",
      at: "2026-08-05T09:00:00Z",
    });
  });

  it("reports the guardrail floor, which is what makes 'unconfigured' a prompt and not an alarm", () => {
    const safety = buildSafetyGlance({
      rules: [],
      incidentCount: 0,
      floorCount: 7,
      hits: [{ rule_name: "Email address", created_at: "2026-08-05T10:00:00Z" }],
      hitLimit: 100,
      incidents: [],
    });
    expect(figure(safety, "always on")?.value).toBe("7");
    expect(figure(safety, "always on")?.note).toBe("screen every call whatever you set");
    expect(figure(safety, "calls a rule caught")?.value).toBe("1");
  });

  it("states a capped hit list as a floor, never as a total", () => {
    // getGuardrailOverview stops at 100 rows. The live sandbox workspace has
    // 7,141 recorded hits, so a bare "100" understates it by two orders of
    // magnitude: the rows exist, the count does not describe them.
    const safety = buildSafetyGlance({
      rules: [{ enabled: true }],
      incidentCount: 0,
      hits: Array.from({ length: 100 }, () => ({ rule_name: "Email address" })),
      hitLimit: 100,
    });
    expect(figure(safety, "calls a rule caught")?.value).toBe("100+");
  });

  it("dates Safety's newest incident on the door", () => {
    const safety = buildSafetyGlance({
      rules: [{ enabled: true }],
      incidentCount: 2,
      incidents: [
        { title: "search_web failed", at: "2026-08-05T11:00:00Z" },
        { title: "an event failed", at: "2026-08-04T11:00:00Z" },
      ],
    });
    expect(safety.latest).toEqual({ what: "search_web failed", at: "2026-08-05T11:00:00Z" });
  });

  it("says 200+ when the trace read came back full, and 200 exactly is a ceiling", () => {
    // listTraces caps at the limit it was given. The live workspace logs over
    // 15,000 AI events a week, so the Record verdict was printing that ceiling
    // as an exact total.
    const record = buildRecordGlance({ traceCount: 200, ledgerVerifies: true, traceLimit: 200 });
    expect(record.verdict).toBe("200+ runs this week · audit trail intact");
    const under = buildRecordGlance({ traceCount: 34, ledgerVerifies: true, traceLimit: 200 });
    expect(under.verdict).toBe("34 runs this week · audit trail intact");
  });

  it("carries Record's step count, failed runs, sealed receipts and newest run", () => {
    const record = buildRecordGlance({
      traceCount: 3,
      ledgerVerifies: true,
      traceLimit: 200,
      sealCount: 412,
      traces: [
        { spans: 12, errors: 0, title: "Ship the pricing page", last_at: "2026-08-05T12:00:00Z" },
        {
          spans: 4,
          errors: 2,
          title: null,
          root_surface: "agent",
          last_at: "2026-08-05T09:00:00Z",
        },
        { spans: 7, errors: 0, title: "Draft the release notes", last_at: "2026-08-04T18:00:00Z" },
      ],
    });
    expect(figure(record, "steps recorded")?.value).toBe("23");
    expect(figure(record, "steps recorded")?.note).toBe("across 3 runs");
    // SINGULAR, because there is one. The card sets the figure and its label
    // together as a phrase, so "1 runs that hit an error" is a grammatical
    // error on the surface rather than in a log -- and one errored run is the
    // commonest reading a healthy workspace has. Seen on the live engine room
    // before it was fixed.
    expect(figure(record, "run that hit an error")?.value).toBe("1");
    expect(figure(record, "runs that hit an error")).toBeUndefined();
    expect(figure(record, "records sealed")?.value).toBe("412");
    expect(record.latest).toEqual({
      what: "Ship the pricing page",
      at: "2026-08-05T12:00:00Z",
    });
  });

  it("draws no figures at all from a caller that passes none (an old caller keeps the old card)", () => {
    expect(buildSpendGlance({ global: null, costThisWeek: 1 }).figures).toEqual([]);
    expect(buildRecordGlance({ traceCount: 2, ledgerVerifies: true }).figures).toEqual([]);
    expect(buildRecordGlance({ traceCount: 2, ledgerVerifies: true }).latest).toBeUndefined();
  });
});

/**
 * A CEILING WEARING A TOTAL'S CLOTHES.
 *
 * Three reads on this surface return what they FOUND, not what EXISTS, and two
 * of them printed the number as a fact. `getIncidents` merges five sources each
 * capped at twenty and slices the result at forty, and the Safety VERDICT --
 * the line a person reads to decide whether anything is wrong -- printed it
 * bare. `getLedgerSeal` reads at most SEAL_LIMIT receipts, and the Record card
 * said "N receipts sealed, covered by the fingerprint": a number that
 * understates AND a guarantee that is wrong, which is the expensive half,
 * because it is the sentence someone would quote in an audit.
 *
 * The trace count on this same card already did this correctly ("200+"), so
 * both are now the same shape rather than three reads with three manners.
 */
describe("a capped read says it is a floor", () => {
  it("the Safety verdict marks a capped incident count", () => {
    const capped = buildSafetyGlance({
      rules: [{ enabled: true }],
      incidentCount: 40,
      incidentsCapped: true,
    } as never);
    expect(capped.verdict).toContain("40+ incidents");
  });

  it("and says nothing extra when the read was whole", () => {
    const whole = buildSafetyGlance({
      rules: [{ enabled: true }],
      incidentCount: 7,
      incidentsCapped: false,
    } as never);
    expect(whole.verdict).toContain("7 incidents");
    expect(whole.verdict).not.toContain("+");
  });

  it("defaults to NOT claiming a cap it has not checked", () => {
    // A caller not yet taught to pass the flag must report plainly rather than
    // marking every count as a floor.
    const unaware = buildSafetyGlance({ rules: [{ enabled: true }], incidentCount: 7 } as never);
    expect(unaware.verdict).not.toContain("+");
  });

  it("the fingerprint claims only what it covers", () => {
    const capped = buildRecordGlance({
      traceCount: 0,
      sealCount: 1000,
      ledgerVerifies: true,
      sealCapped: true,
    } as never);
    const seal = capped.figures.find((f) => f.label === "records sealed");
    expect(seal?.value).toContain("+");
    expect(seal?.note).toBe("the newest are covered by the fingerprint");
  });

  it("and claims the whole ledger when it really read the whole ledger", () => {
    const whole = buildRecordGlance({
      traceCount: 0,
      sealCount: 92,
      ledgerVerifies: true,
    } as never);
    const seal = whole.figures.find((f) => f.label === "records sealed");
    expect(seal?.value).not.toContain("+");
    expect(seal?.note).toBe("covered by the fingerprint");
  });

  it("a fingerprint that did not compute says that first, capped or not", () => {
    // The failure outranks the coverage caveat: "did not compute" is the fact
    // that matters, and adding a coverage note to it would bury it.
    const broken = buildRecordGlance({
      traceCount: 0,
      sealCount: 1000,
      ledgerVerifies: false,
      sealCapped: true,
    } as never);
    expect(broken.figures.find((f) => f.label === "records sealed")?.note).toBe(
      "fingerprint did not compute",
    );
  });
});
