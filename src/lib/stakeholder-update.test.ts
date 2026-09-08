import { describe, expect, test } from "bun:test";
import {
  buildOutcomeReceipt,
  buildStakeholderUpdate,
  type OutcomeReceiptSnapshot,
  type StakeholderSnapshot,
} from "./stakeholder-update";

/**
 * One-keystroke stakeholder status update (PM-STATUS-UPDATE).
 *
 * A PURE composer that turns a snapshot of live product state into a shareable, paste-ready
 * update. It is the reference implementation of the felt-voice precedent
 * (docs/conventions/humanized-output.md "The felt voice"): signal first (a lede carries the
 * gist), short + precise, metrics interpreted not dumped, honest when sparse, and zero AI
 * fingerprints (the text leaves the app into Slack/email). These tests pin that voice.
 */

/** U+2014 em dash and U+2013 en dash, by code point so this file carries neither. */
const NO_DASHES = /[\u2014\u2013]/;
/**
 * U+200B zero-width space, U+200C non-joiner, U+2060 word joiner, U+FEFF
 * byte-order mark, U+00AD soft hyphen, and U+200D zero-width joiner last so the
 * class is read as six characters and not as a joined sequence.
 */
const NO_INVISIBLES = /[\u200B\u200C\u2060\uFEFF\u00AD\u200D]/;

const full: StakeholderSnapshot = {
  periodLabel: "the last 7 days",
  workspaceName: "Project Glasswing",
  shipped: 2,
  decisions: 3,
  validated: 1,
  activeMissions: ["Ship Escalation Policy Engine v0", "Smart routing beta"],
  upNext: [
    { title: "Per-segment tone calibration", iceScore: null },
    { title: "Macro suggestion from resolved history", iceScore: null },
  ],
  needsYou: 3,
  metrics: { acceptancePct: 100, autonomyPct: 50, outcomeAccuracyPct: 100 },
  spendUsd: 0.05,
  latestOutcome: { title: "Hard escalation policy for refunds", verdict: "validated" },
};

describe("buildStakeholderUpdate", () => {
  test("headline is a clean dateline: workspace + period", () => {
    const u = buildStakeholderUpdate(full);
    expect(u.headline).toContain("Project Glasswing");
    expect(u.headline.toLowerCase()).toContain("the last 7 days");
  });

  test("SIGNAL FIRST: the lede carries the gist in one line", () => {
    const u = buildStakeholderUpdate(full);
    expect(u.lede).toContain("3 decisions made");
    expect(u.lede).toContain("2 in flight");
    expect(u.lede).toContain("every reviewed bet held up");
    expect(u.markdown.indexOf(u.lede)).toBeLessThan(u.markdown.indexOf("Shipped"));
  });

  test("a full snapshot yields Shipped / In flight / Next / Health sections", () => {
    const titles = buildStakeholderUpdate(full).sections.map((s) => s.title);
    expect(titles).toEqual(["Shipped", "In flight", "Next", "Health"]);
  });

  test("Shipped is terse (header implies the verb) + names the latest outcome by meaning", () => {
    const shipped = buildStakeholderUpdate(full).sections.find((s) => s.title === "Shipped")!;
    const text = shipped.bullets.join(" ");
    expect(text).toContain("3 decisions");
    expect(text).toContain("2 deep-work");
    expect(text).toContain("Hard escalation policy for refunds");
    // "validated" is rendered as the felt verb, not the raw label.
    expect(text).toContain("held up");
    expect(text).not.toContain("validated");
  });

  test("Health INTERPRETS the metrics instead of dumping percentages", () => {
    const health = buildStakeholderUpdate(full).sections.find((s) => s.title === "Health")!;
    const text = health.bullets.join(" ");
    expect(text).toContain("you approved every call");
    expect(text).toContain("every reviewed bet held up");
    expect(text).toContain("50% of the work on its own");
    expect(text).toContain("$0.05 spent");
  });

  test("active work + next appear as scannable bullets", () => {
    const u = buildStakeholderUpdate(full);
    expect(u.sections.find((s) => s.title === "In flight")!.bullets).toContain(
      "Ship Escalation Policy Engine v0",
    );
    expect(u.sections.find((s) => s.title === "Next")!.bullets).toContain(
      "Per-segment tone calibration",
    );
  });

  test("the calls queue closes the note with the product noun", () => {
    expect(buildStakeholderUpdate(full).markdown).toContain("3 calls waiting on you");
  });

  test("pluralization: a single decision / call reads singular", () => {
    const u = buildStakeholderUpdate({
      ...full,
      shipped: 0,
      decisions: 1,
      needsYou: 1,
      activeMissions: [],
      upNext: [],
      latestOutcome: null,
      validated: 0,
      metrics: { acceptancePct: null, autonomyPct: null, outcomeAccuracyPct: null },
    });
    expect(u.lede).toContain("1 decision made");
    expect(u.markdown).toContain("1 call waiting on you");
    expect(u.markdown).not.toContain("1 decisions");
    expect(u.markdown).not.toContain("1 calls");
  });

  test("caps long lists and reports the overflow honestly", () => {
    const many = Array.from({ length: 8 }, (_, i) => `Mission ${i + 1}`);
    const inFlight = buildStakeholderUpdate({ ...full, activeMissions: many }).sections.find(
      (s) => s.title === "In flight",
    )!;
    expect(inFlight.bullets.length).toBe(6); // 5 shown + 1 overflow
    expect(inFlight.bullets[5]).toContain("3 more");
  });

  test("sparse state is honest: a quiet lede, no fabricated numbers, omitted empty sections", () => {
    const quiet = buildStakeholderUpdate({
      periodLabel: "the last 7 days",
      workspaceName: "Project Glasswing",
      shipped: 0,
      decisions: 0,
      validated: 0,
      activeMissions: [],
      upNext: [],
      needsYou: 0,
      metrics: { acceptancePct: null, autonomyPct: null, outcomeAccuracyPct: null },
      spendUsd: 0,
      latestOutcome: null,
    });
    expect(quiet.sections.find((s) => s.title === "In flight")).toBeUndefined();
    expect(quiet.sections.find((s) => s.title === "Next")).toBeUndefined();
    expect(quiet.lede.toLowerCase()).toContain("quiet");
    expect(quiet.markdown).not.toContain("null");
    expect(quiet.markdown).not.toContain("NaN");
  });

  test("null metrics are omitted, never shown as 0% or null", () => {
    const health = buildStakeholderUpdate({
      ...full,
      metrics: { acceptancePct: 100, autonomyPct: null, outcomeAccuracyPct: null },
    }).sections.find((s) => s.title === "Health")!;
    const text = health.bullets.join(" ");
    expect(text).toContain("you approved every call");
    expect(text).not.toContain("null");
    expect(text).not.toContain("of the work"); // autonomy was null -> the whole phrase is omitted
  });

  test("HUMANIZED: no em/en dashes, no invisibles, no banned buzzwords", () => {
    const md = buildStakeholderUpdate(full).markdown;
    expect(md).not.toMatch(NO_DASHES);
    expect(md).not.toMatch(NO_INVISIBLES);
    for (const bad of ["seamless", "leverage", "robust", "supercharge", "unlock", "elevate"]) {
      expect(md.toLowerCase()).not.toContain(bad);
    }
  });

  test("is deterministic - same snapshot, identical output", () => {
    expect(buildStakeholderUpdate(full)).toEqual(buildStakeholderUpdate(full));
  });

  test("no authorName: headline stays byte-identical to the anonymous format", () => {
    const u = buildStakeholderUpdate(full);
    expect(u.headline).toBe("Project Glasswing, the last 7 days");
  });

  test("authorName present: headline opens with the PM's name, middot, then the dateline", () => {
    const u = buildStakeholderUpdate({ ...full, authorName: "Rohit" });
    expect(u.headline).toBe("Rohit's update · Project Glasswing, the last 7 days");
  });

  test("authorName present: the closing line names the PM instead of 'you'", () => {
    const u = buildStakeholderUpdate({ ...full, authorName: "Rohit" });
    expect(u.markdown).toContain("3 calls waiting on Rohit.");
    expect(u.markdown).not.toContain("waiting on you");
  });

  test("authorName absent or blank: closing line is unchanged", () => {
    expect(buildStakeholderUpdate(full).markdown).toContain("3 calls waiting on you.");
    expect(buildStakeholderUpdate({ ...full, authorName: "  " }).markdown).toContain(
      "3 calls waiting on you.",
    );
    expect(buildStakeholderUpdate({ ...full, authorName: null }).markdown).toContain(
      "3 calls waiting on you.",
    );
  });

  test("Next bullets carry the ICE score when it is a positive number", () => {
    const u = buildStakeholderUpdate({
      ...full,
      upNext: [
        { title: "Per-segment tone calibration", iceScore: 8.47 },
        { title: "Macro suggestion from resolved history", iceScore: 0 },
        { title: "Escalation digest for VIP accounts", iceScore: null },
      ],
    });
    const next = u.sections.find((s) => s.title === "Next")!;
    expect(next.bullets).toContain("Per-segment tone calibration (ICE 8.5)");
    // Zero and null ICE scores fall back to the plain title, never a fabricated "(ICE 0.0)".
    expect(next.bullets).toContain("Macro suggestion from resolved history");
    expect(next.bullets).toContain("Escalation digest for VIP accounts");
  });

  test("Next list capping still works on the ICE-formatted strings", () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      title: `Opportunity ${i + 1}`,
      iceScore: 5,
    }));
    const next = buildStakeholderUpdate({ ...full, upNext: many }).sections.find(
      (s) => s.title === "Next",
    )!;
    expect(next.bullets.length).toBe(6); // 5 shown + 1 overflow
    expect(next.bullets[0]).toBe("Opportunity 1 (ICE 5.0)");
    expect(next.bullets[5]).toContain("2 more");
  });
});

/**
 * RPT-49: the outcome-receipt LEAD for the ambient stakeholder digest. A PURE composer that opens
 * the note with what the work produced (what shipped, what it did, calibration) instead of the
 * operational noise the digest used to lead with. Outcome-marketing from live state, honest and
 * sparse-safe: a genuinely quiet period reads honestly (null, so the digest leads with its own
 * items) and a null metric is omitted rather than padded. These tests pin that behavior.
 */
describe("buildOutcomeReceipt", () => {
  const receiptFull: OutcomeReceiptSnapshot = {
    shipped: 2,
    decisions: 3,
    latestOutcome: { title: "Hard escalation policy for refunds", verdict: "validated" },
    outcomeAccuracyPct: 100,
  };

  test("LEADS with the three pieces in order: what shipped, what it did, calibration", () => {
    const md = buildOutcomeReceipt(receiptFull);
    expect(md).not.toBeNull();
    const text = md!;
    // what shipped (deep-work blocks + decisions)
    expect(text).toContain("3 decisions, 2 deep-work blocks shipped.");
    // what it did (the verdict read as meaning, never the raw label)
    expect(text).toContain('"Hard escalation policy for refunds" held up.');
    expect(text).not.toContain("validated");
    // calibration
    expect(text).toContain("Every reviewed bet held up.");
    // order: shipped, then outcome, then calibration
    expect(text.indexOf("shipped.")).toBeLessThan(text.indexOf('"Hard escalation'));
    expect(text.indexOf('"Hard escalation')).toBeLessThan(text.indexOf("Every reviewed"));
  });

  test("a genuinely quiet period reads honestly: no receipt to fabricate (null)", () => {
    const md = buildOutcomeReceipt({
      shipped: 0,
      decisions: 0,
      latestOutcome: null,
      outcomeAccuracyPct: null,
    });
    expect(md).toBeNull();
  });

  test("a null calibration metric is omitted, never shown as 0% or 'null'", () => {
    const md = buildOutcomeReceipt({ ...receiptFull, outcomeAccuracyPct: null })!;
    expect(md).toContain("3 decisions, 2 deep-work blocks shipped.");
    expect(md).toContain("held up."); // the outcome line still renders
    expect(md).not.toContain("reviewed bet"); // the calibration line was omitted
    expect(md).not.toContain("null");
    expect(md).not.toContain("0%");
  });

  test("a fell-short outcome + partial calibration read by meaning, singular counts stay singular", () => {
    const md = buildOutcomeReceipt({
      shipped: 0,
      decisions: 1,
      latestOutcome: { title: "Auto-refund under $20", verdict: "missed" },
      outcomeAccuracyPct: 67,
    })!;
    expect(md).toContain("1 decision shipped.");
    expect(md).not.toContain("1 decisions");
    expect(md).toContain('"Auto-refund under $20" fell short.');
    expect(md).toContain("67% of reviewed bets held up.");
  });

  test("a shipped-only period leads with what shipped and omits the empty outcome + calibration", () => {
    const md = buildOutcomeReceipt({
      shipped: 4,
      decisions: 0,
      latestOutcome: null,
      outcomeAccuracyPct: null,
    })!;
    expect(md).toContain("4 deep-work blocks shipped.");
    expect(md).not.toContain("held up");
    expect(md).not.toContain("fell short");
  });

  test("HUMANIZED: no em/en dashes or invisibles, no banned buzzwords", () => {
    const md = buildOutcomeReceipt(receiptFull)!;
    expect(md).not.toMatch(NO_DASHES);
    expect(md).not.toMatch(NO_INVISIBLES);
    for (const bad of ["seamless", "leverage", "robust", "supercharge", "unlock", "elevate"]) {
      expect(md.toLowerCase()).not.toContain(bad);
    }
  });

  test("is deterministic - same snapshot, identical output", () => {
    expect(buildOutcomeReceipt(receiptFull)).toEqual(buildOutcomeReceipt(receiptFull));
  });
});
