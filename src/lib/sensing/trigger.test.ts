import { describe, expect, it } from "bun:test";
import {
  evaluateTriggers,
  isAutoMissionTitle,
  shouldAutoPromote,
  AUTO_TITLE_PREFIX,
  AUTO_TRIGGER_DAILY_CAP,
  CLUSTER_FREQUENCY_THRESHOLD,
  WATCH_SIGNAL_THRESHOLD,
  LISTEN_SIGNAL_THRESHOLD,
  TITLE_OVERLAP_FLOOR,
  titleOverlap,
  type ThemeState,
  type OutcomeState,
  type SignalSenseState,
} from "./trigger";

const theme = (over: Partial<ThemeState>): ThemeState => ({
  id: "t1",
  title: "Off-hours latency",
  frequency: 9,
  severity: 4,
  status: "new",
  ...over,
});

const outcome = (over: Partial<OutcomeState>): OutcomeState => ({
  id: "o1",
  verdict: "missed",
  summary: "Formal tone default lowered SMB reply rate",
  ...over,
});

describe("evaluateTriggers — clusters", () => {
  it("originates a mission for an unaddressed cluster over the threshold", () => {
    const out = evaluateTriggers({ themes: [theme({ frequency: CLUSTER_FREQUENCY_THRESHOLD })] });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("cluster");
    // The title is CLEAN now. The "[auto] " marker was a dedup key living in a
    // display column and it leaked to the founder three times; provenance moved
    // to missions.auto_trigger_source and decisions.auto_origin in migration
    // 20260805120000. This asserts the marker never comes back.
    expect(out[0].title.startsWith(AUTO_TITLE_PREFIX)).toBe(false);
    expect(out[0].title).toBe('Investigate the "Off-hours latency" cluster');
    expect(out[0].reversible).toBe(true);
  });

  it("ignores a cluster below both thresholds", () => {
    expect(evaluateTriggers({ themes: [theme({ frequency: 1, severity: 1 })] })).toHaveLength(0);
  });

  // P-14 (A-QUEUE.md), R-35: a cluster over the gate carries what the tick
  // needs to write (or refresh) an opportunities row, never a mission.
  it("carries the theme's opportunity mapping, the same one promoteThemeToOpportunity uses by hand", () => {
    const out = evaluateTriggers({
      themes: [
        theme({
          id: "t-live",
          frequency: CLUSTER_FREQUENCY_THRESHOLD,
          severity: 4,
          confidence: 0.7,
          summary: "Off-hours requests time out past 30s.",
          project_id: "proj-1",
          product_id: "prod-1",
        }),
      ],
    });
    expect(out[0].opportunity).toEqual({
      themeId: "t-live",
      name: "Off-hours latency",
      problem: "Off-hours requests time out past 30s.",
      impact: 8, // min(10, severity * 2) = min(10, 8)
      confidence: 7, // round(0.7 * 10)
      ease: 5, // neutral, unscored
      projectId: "proj-1",
      productId: "prod-1",
    });
  });

  it("degrades to a neutral opportunity mapping when a fixture carries no confidence or summary", () => {
    const out = evaluateTriggers({
      themes: [theme({ frequency: CLUSTER_FREQUENCY_THRESHOLD, severity: 4 })],
    });
    expect(out[0].opportunity?.confidence).toBe(0);
    expect(out[0].opportunity?.problem).toBe("Off-hours latency"); // falls back to the cluster name
  });

  it("a non-cluster proposal carries no opportunity mapping", () => {
    const out = evaluateTriggers({
      outcomes: [outcome({ id: "o-miss" })],
    });
    expect(out[0].kind).toBe("missed-outcome");
    expect(out[0].opportunity).toBeUndefined();
  });

  it("fires on high severity even when frequency is low", () => {
    expect(evaluateTriggers({ themes: [theme({ frequency: 0, severity: 5 })] })).toHaveLength(1);
  });

  it("ignores an already-addressed cluster", () => {
    expect(evaluateTriggers({ themes: [theme({ status: "addressed" })] })).toHaveLength(0);
    expect(evaluateTriggers({ themes: [theme({ status: "closed" })] })).toHaveLength(0);
  });
});

describe("evaluateTriggers — missed outcomes", () => {
  it("originates a re-evaluation mission for a missed outcome", () => {
    const out = evaluateTriggers({ outcomes: [outcome({})] });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("missed-outcome");
  });

  it("ignores validated/mixed outcomes", () => {
    expect(evaluateTriggers({ outcomes: [outcome({ verdict: "validated" })] })).toHaveLength(0);
    expect(evaluateTriggers({ outcomes: [outcome({ verdict: "mixed" })] })).toHaveLength(0);
  });
});

describe("evaluateTriggers — dedup + bounds", () => {
  it("drops a proposal whose mission title is already open (idempotent)", () => {
    const first = evaluateTriggers({ themes: [theme({})] })[0];
    const again = evaluateTriggers({ themes: [theme({})] }, new Set([first.title]));
    expect(again).toHaveLength(0);
  });

  it("a missed outcome outranks a cluster, and the count is capped", () => {
    const themes = Array.from({ length: 10 }, (_, i) =>
      theme({ id: `t${i}`, title: `Cluster ${i}` }),
    );
    const out = evaluateTriggers({ themes, outcomes: [outcome({})] }, new Set(), { max: 3 });
    expect(out).toHaveLength(3);
    expect(out[0].kind).toBe("missed-outcome"); // priority 50 beats cluster freq+sev
  });

  it("never throws on malformed input", () => {
    expect(
      evaluateTriggers({ themes: [null as unknown as ThemeState], outcomes: undefined }),
    ).toEqual([]);
  });
});

describe("isAutoMissionTitle", () => {
  it("recognizes only auto-originated titles", () => {
    expect(isAutoMissionTitle(`${AUTO_TITLE_PREFIX} Investigate the "X" cluster`)).toBe(true);
    expect(isAutoMissionTitle("Ship the escalation engine")).toBe(false);
    expect(isAutoMissionTitle(null)).toBe(false);
  });
});

describe("evaluateTriggers — Watch (discovery-scout) proposals", () => {
  const senseOver = (over: Partial<SignalSenseState> = {}): SignalSenseState => ({
    newSignalCount: WATCH_SIGNAL_THRESHOLD,
    customerSignalCount: 0,
    ...over,
  });

  it("proposes a Watch mission when new signals cross the threshold", () => {
    const out = evaluateTriggers({ signals: senseOver() });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("watch-scan");
    expect(out[0].agentSlug).toBe("discovery-scout");
    // Clean title, same reason as the cluster case above.
    expect(out[0].title.startsWith(AUTO_TITLE_PREFIX)).toBe(false);
    expect(out[0].title).toBe("Watch: review recent signals");
    expect(out[0].reversible).toBe(true);
  });

  it("does not propose Watch when signal count is below threshold", () => {
    const out = evaluateTriggers({
      signals: senseOver({ newSignalCount: WATCH_SIGNAL_THRESHOLD - 1 }),
    });
    expect(out).toHaveLength(0);
  });

  it("deduplicates Watch: no second proposal when one is already open", () => {
    const first = evaluateTriggers({ signals: senseOver() })[0];
    const again = evaluateTriggers({ signals: senseOver() }, new Set([first.title]));
    expect(again).toHaveLength(0);
  });
});

describe("evaluateTriggers — Listen (customer-insights) proposals", () => {
  const listenState = (over: Partial<SignalSenseState> = {}): SignalSenseState => ({
    newSignalCount: 0,
    customerSignalCount: LISTEN_SIGNAL_THRESHOLD,
    ...over,
  });

  it("proposes a Listen mission when customer signals cross the threshold", () => {
    const out = evaluateTriggers({ signals: listenState() });
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("customer-listen");
    expect(out[0].agentSlug).toBe("customer-insights");
    expect(out[0].reversible).toBe(true);
  });

  it("does not propose Listen below the threshold", () => {
    const out = evaluateTriggers({
      signals: listenState({ customerSignalCount: LISTEN_SIGNAL_THRESHOLD - 1 }),
    });
    expect(out).toHaveLength(0);
  });

  it("both Watch and Listen can be proposed in the same tick", () => {
    const out = evaluateTriggers({
      signals: {
        newSignalCount: WATCH_SIGNAL_THRESHOLD,
        customerSignalCount: LISTEN_SIGNAL_THRESHOLD,
      },
    });
    const kinds = out.map((p) => p.kind);
    expect(kinds).toContain("watch-scan");
    expect(kinds).toContain("customer-listen");
  });

  it("missed outcome outranks Watch and Listen proposals", () => {
    const outcome: OutcomeState = { id: "o1", verdict: "missed", summary: "Feature flopped" };
    const out = evaluateTriggers({
      outcomes: [outcome],
      signals: {
        newSignalCount: WATCH_SIGNAL_THRESHOLD,
        customerSignalCount: LISTEN_SIGNAL_THRESHOLD,
      },
    });
    expect(out[0].kind).toBe("missed-outcome");
  });
});

describe("shouldAutoPromote — SF-AUTOTRIGGER eligibility", () => {
  const base = {
    flagEnabled: true,
    reversible: true,
    ambientCount: 0,
    autoTodayCount: 0,
  };

  it("promotes when all four conditions are met", () => {
    expect(shouldAutoPromote(base)).toBe(true);
  });

  it("blocks when BRAIN_AUTO_TRIGGER flag is off", () => {
    expect(shouldAutoPromote({ ...base, flagEnabled: false })).toBe(false);
  });

  it("blocks when the proposal is not reversible", () => {
    expect(shouldAutoPromote({ ...base, reversible: false })).toBe(false);
  });

  it("blocks when there are active (running) missions — not ambient arc", () => {
    expect(shouldAutoPromote({ ...base, ambientCount: 1 })).toBe(false);
    expect(shouldAutoPromote({ ...base, ambientCount: 3 })).toBe(false);
  });

  it("blocks when the daily cap is already reached", () => {
    expect(shouldAutoPromote({ ...base, autoTodayCount: AUTO_TRIGGER_DAILY_CAP })).toBe(false);
    expect(shouldAutoPromote({ ...base, autoTodayCount: AUTO_TRIGGER_DAILY_CAP + 1 })).toBe(false);
  });

  it("allows the last slot (cap - 1) but not beyond", () => {
    expect(shouldAutoPromote({ ...base, autoTodayCount: AUTO_TRIGGER_DAILY_CAP - 1 })).toBe(true);
    expect(shouldAutoPromote({ ...base, autoTodayCount: AUTO_TRIGGER_DAILY_CAP })).toBe(false);
  });

  it("requires ALL four conditions — any single failure blocks", () => {
    // flag off alone blocks
    expect(shouldAutoPromote({ ...base, flagEnabled: false })).toBe(false);
    // not reversible alone blocks
    expect(shouldAutoPromote({ ...base, reversible: false })).toBe(false);
    // active mission alone blocks
    expect(shouldAutoPromote({ ...base, ambientCount: 1 })).toBe(false);
    // cap hit alone blocks
    expect(shouldAutoPromote({ ...base, autoTodayCount: AUTO_TRIGGER_DAILY_CAP })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RE-DISCOVERY — proven from the live defect, not from an invented scenario
// ---------------------------------------------------------------------------
//
// Every fixture below is a real row from the Helio Labs workspace
// (60000000-0000-4000-8000-000000000000) as it stood on 2026-08-05, including
// the real `themes.novelty` values. 18 of that workspace's 37 pending calls were
// three problems re-discovered under new names, so these tests fail against the
// code as it was and pass against the gates.
describe("evaluateTriggers — re-discovery gate", () => {
  it("suppresses a cluster the brain already scored as a repeat", () => {
    // Live row: novelty 0.249906, maxThemeSim 0.875. The brain knew, then asked anyway.
    const out = evaluateTriggers({
      themes: [
        theme({
          id: "live-1",
          title: "Redundant Data Entry causing Checkout Abandonment",
          novelty: 0.249906,
        }),
      ],
    });
    expect(out).toHaveLength(0);
  });

  it("suppresses every live re-discovery, and keeps the one genuinely new cluster", () => {
    const out = evaluateTriggers({
      themes: [
        theme({
          id: "a",
          title: "Alert Fatigue Leading to Feature Disengagement",
          novelty: 0.399948,
        }),
        theme({ id: "b", title: "Redundant Checkout Workflow Friction", novelty: 0.422833 }),
        theme({
          id: "c",
          title: "Notification Overload and User Disengagement",
          novelty: 0.494124,
        }),
        theme({
          id: "d",
          title: "Alert Fatigue Leading to Systemic Disengagement",
          novelty: 0.532158,
        }),
        // novelty 0.820917 (only 0.383 similar to anything known) — a real discovery.
        theme({ id: "e", title: "Redundant Address Entry During Checkout", novelty: 0.820917 }),
      ],
    });
    const titles = out.map((p) => p.title);
    expect(titles).toHaveLength(2);
    expect(titles.some((t) => t.includes("Redundant Address Entry During Checkout"))).toBe(true);
    // 0.532 clears the floor, so it survives the semantic gate on its own merit.
    expect(titles.some((t) => t.includes("Systemic Disengagement"))).toBe(true);
  });

  it("raises the call when novelty is unknown and the sweeper is down", () => {
    // The embedder HAS gone down here. A quiet brain is worse than a repeat, so
    // an all-NULL batch must still produce work.
    const out = evaluateTriggers({
      themes: [theme({ id: "n1", title: "Serial scans fail on the second generation label" })],
    });
    expect(out).toHaveLength(1);
  });

  it("waits on an unscored theme while the sweeper is demonstrably running", () => {
    // One scored theme proves the sweeper is alive, so the unscored one is
    // mid-sweep rather than new, and judging it blind is what created duplicates.
    const out = evaluateTriggers({
      themes: [
        theme({
          id: "scored",
          title: "Roof glare makes the wiring diagram unreadable",
          novelty: 0.9,
        }),
        theme({ id: "unscored", title: "Meter firmware drift shows yesterday production" }),
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toContain("Roof glare");
  });

  it("drops the second near-identical cluster inside ONE tick", () => {
    // Both landed 2026-08-04 with novelty NULL. Exact-title dedup let the second
    // through because the two titles differ by a word.
    const out = evaluateTriggers({
      themes: [
        theme({ id: "x1", title: "Redundant Address Entry Causes Abandonment" }),
        theme({ id: "x2", title: "Redundant Address Entry During Checkout" }),
      ],
    });
    expect(out).toHaveLength(1);
  });

  it("drops a near-identical cluster against an ALREADY-OPEN mission", () => {
    // Open titles come off missions, which no longer carry the marker.
    const open = new Set(['Investigate the "Redundant Data Entry" cluster']);
    const out = evaluateTriggers(
      { themes: [theme({ id: "y", title: "Redundant Data Entry causing Checkout Abandonment" })] },
      open,
    );
    expect(out).toHaveLength(0);
  });

  it("does not let shared filler words swallow an unrelated cluster", () => {
    // "Leads to" / "Causes" are pure filler. If they counted, a real signal
    // would be suppressed, which is worse than the duplicate being fixed here.
    const out = evaluateTriggers({
      themes: [
        theme({ id: "p", title: "Alert Overload Leads to Muting" }),
        theme({ id: "q", title: "Partner installers stall at the invite step" }),
      ],
    });
    expect(out).toHaveLength(2);
  });
});

describe("titleOverlap", () => {
  it("scores identical cluster names 1", () => {
    expect(titleOverlap("Redundant Data Entry", "Redundant Data Entry")).toBe(1);
  });

  it("separates the live collisions from genuinely different clusters", () => {
    expect(
      titleOverlap(
        "Redundant Address Entry Causes Abandonment",
        "Redundant Address Entry During Checkout",
      ),
    ).toBeGreaterThanOrEqual(TITLE_OVERLAP_FLOOR);
    expect(
      titleOverlap(
        "Alert Overload Leads to Muting",
        "Roof glare makes the wiring diagram unreadable",
      ),
    ).toBe(0);
  });

  it("is 0 against an empty or filler-only name", () => {
    expect(titleOverlap("", "Redundant Data Entry")).toBe(0);
    expect(titleOverlap("the and to of", "Redundant Data Entry")).toBe(0);
  });
});
