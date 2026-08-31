/**
 * Brain's guidance honesty, guarded.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. Brain's own headline on the
 * live demo workspace read "49 calls and 8 learnings are on the record, and none
 * has re-scored a call yet". Every word true, and both clauses about the size of
 * a pile, on the one surface whose entire claim is that the record LEARNS AND
 * GUIDES rather than stores. Meanwhile the page was already fetching the proof
 * that it guides (694 of 846 things learned had been read back by a run, across
 * 3115 recalls) and rendering it only behind the Outcomes tab.
 *
 * WHY A TEST AND NOT A REVIEW NOTE. Every rule below is one a future change can
 * break while typechecking perfectly and looking fine in a diff, and each break
 * produces the same two failures, which are the only two failures that matter
 * here:
 *
 *   A CLAIM MADE BEFORE IT IS KNOWN. "No outcome has moved a priority yet" drawn
 *   while the compounding read is still in flight is a statement about the
 *   product that nobody checked.
 *
 *   A ZERO STANDING IN FOR "WE COULD NOT FIND OUT". memory_recall_log being
 *   unreadable sets every one of its counts to 0. Rendering those zeros would
 *   report a working mechanism as an idle one.
 *
 * The third rule is the founder's: no invented comparison. There is no "teams
 * like yours" data anywhere in this schema, so no line here may carry one.
 */
import { describe, it, expect } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RecallRecord } from "@/lib/brain-standing.functions";
import type { CompoundingSummary } from "@/lib/moat-vis";
import type { ForecastCalibration } from "@/lib/brain-insights.functions";
import { guidanceLines, recordHeadline, recordIsBlank } from "../_authenticated.brain";

/** The rendered words of a line, with the markup and React's entity escaping
 *  taken back off, so an assertion reads as the sentence a person sees. */
function text(node: ReactNode): string {
  return renderToStaticMarkup(<>{node}</>)
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function recall(over: Partial<RecallRecord> = {}): RecallRecord {
  return {
    memoriesTotal: 846,
    memoriesReached: 694,
    events: 3115,
    helped: 0,
    contradicted: 0,
    logReady: true,
    ...over,
  };
}

function summary(over: Partial<CompoundingSummary> = {}): CompoundingSummary {
  return {
    rescoreCount: 0,
    movedUp: 0,
    movedDown: 0,
    netIceLift: 0,
    validatedCount: 0,
    missedCount: 0,
    mixedCount: 0,
    latest: null,
    ...over,
  };
}

/** The graded-forecast half of the calibration read. The payload the server fn
 *  returns carries no due-count, so no test builds one and no line claims one. */
function forecast(
  over: Partial<ForecastCalibration["prediction"]> = {},
): ForecastCalibration["prediction"] {
  return {
    kind: "prediction",
    resolved: 15,
    hits: 12,
    hitRate: 0.8,
    recentLabel: "",
    ...over,
  };
}

const lineByKey = (lines: ReturnType<typeof guidanceLines>, key: string) =>
  lines.find((l) => l.key === key);

const allCopy = (lines: ReturnType<typeof guidanceLines>) =>
  lines.map((l) => `${text(l.lead)} ${text(l.sub)}`).join(" ");

/* The two outcome tones, named once so the guard below reads as a claim about
 * MEANING rather than as two loose strings. Meridian's tokens since 2026-08-15. */
const PASS_TONE = "text-mrd-pass";
const FAIL_TONE = "text-mrd-fail";

describe("Brain headline: guidance outranks the manifest", () => {
  it("still leads with a re-scored call, which is the strongest claim there is", () => {
    const head = recordHeadline(summary({ rescoreCount: 4 }), recall(), 49, 8, false);
    expect(head).toBe("Real outcomes have re-scored 4 calls.");
  });

  it("says the crew read the record back rather than counting the pile", () => {
    // THE DEFECT: with no re-score, every workspace fell straight through to the
    // manifest no matter how hard its record was working.
    const head = recordHeadline(summary(), recall(), 49, 8, false);
    expect(head).toBe("The crew has read this record before acting.");
    expect(head).not.toMatch(/on the record/);
    expect(head).not.toMatch(/\d+ calls and/);
  });

  /**
   * THE RUNG CARRIES NO NUMBER AT ALL, CHANGED 2026-08-11, and this test used to
   * assert the opposite for a good reason that turned out to rest on a wrong
   * premise. `events` counts ROWS in memory_recall_log, and that table takes one
   * row per memory pulled rather than one per read: 587 rows across 146 distinct
   * traces on the demo workspace, so the sentence overstated its own subject by
   * about 4x. It was also a count offered as proof the loop had been running,
   * which AGENTS.md forbids outright on this surface.
   *
   * Both of those are properties of every event count, not of an unreadable log,
   * so the assertion is now that NO number reaches this sentence from any input.
   * A headline that cannot print a number cannot print a wrong one.
   */
  it("never puts an event count in the headline, readable log or not", () => {
    const readable = recordHeadline(summary(), recall(), 49, 8, false);
    const unreadable = recordHeadline(
      summary(),
      recall({ events: 0, logReady: false }),
      49,
      8,
      false,
    );
    expect(readable).toBe("The crew has read this record before acting.");
    expect(unreadable).toBe("The crew has read this record before acting.");
    // No digit survives into the claim, so neither a stale count nor a zero
    // from a dead read can be read as evidence.
    expect(readable).not.toMatch(/\d/);
    expect(unreadable).not.toMatch(/\d/);
  });

  it("falls back to the honest manifest for a workspace that has not compounded", () => {
    const head = recordHeadline(
      summary(),
      recall({ memoriesTotal: 0, memoriesReached: 0, events: 0 }),
      49,
      8,
      false,
    );
    expect(head).toBe(
      "49 calls and 8 learnings are on the record, and none has re-scored a call yet.",
    );
  });

  it("holds the placeholder until the recall rung is decidable", () => {
    // A head that settles on the manifest and then jumps to the recall claim
    // reads as the page correcting itself in front of the reader.
    expect(recordHeadline(null, null, null, null, true)).toBe("Brain");
    expect(recordHeadline(null, null, null, null, false)).toBe("The record did not load.");
  });
});

describe("Brain guidance: what is firing", () => {
  const lines = guidanceLines({
    recall: recall(),
    rescoreCount: 0,
    recallSaidBelow: false,
    forecast: forecast(),
  });

  it("shows how much of what was learned has gone back into a run", () => {
    const read = lineByKey(lines, "read-back");
    expect(read).toBeDefined();
    expect(text(read!.lead)).toBe(
      "694 of 846 lessons on the record have gone back into a later run.",
    );
    // The count describes the pile; it must not be dressed as the record
    // having learned something. See AGENTS.md on present-tense learning claims.
    expect(text(read!.lead)).not.toMatch(/has learned|have learned/);
  });

  it("names the outcome of the mechanism, never the table behind it", () => {
    // ENGINE-ROOM DOCTRINE: no raw enums, uuids, table or column names in front
    // of a person.
    const copy = allCopy(lines);
    for (const leak of [
      "agent_memory",
      "memory_recall_log",
      "last_used_at",
      "house_rules",
      "learnings",
      "ICE",
      "outcome_",
      "uuid",
    ]) {
      expect(copy).not.toContain(leak);
    }
  });

  it("carries no invented comparison to anybody else", () => {
    const copy = allCopy(lines).toLowerCase();
    for (const invented of ["teams like", "average", "typical", "benchmark", "industry"]) {
      expect(copy).not.toContain(invented);
    }
  });

  it("writes UI copy with no em dash and no en dash", () => {
    expect(allCopy(lines)).not.toMatch(/[–—]/);
  });
});

describe("Brain guidance: a zero never stands in for an unreadable read", () => {
  it("draws no rating line at all when the recall log could not be read", () => {
    // logReady false zeroes events, helped and contradicted. Rendering "0
    // helped" would report a working mechanism as an idle one.
    const lines = guidanceLines({
      recall: recall({ events: 0, helped: 0, contradicted: 0, logReady: false }),
      rescoreCount: 0,
      recallSaidBelow: false,
    });
    expect(lineByKey(lines, "rated")).toBeUndefined();
    // The read-back line survives, because its column is on the other table.
    expect(lineByKey(lines, "read-back")).toBeDefined();
  });

  it("says nothing has been rated, and names what a rating does", () => {
    const lines = guidanceLines({ recall: recall(), rescoreCount: 0, recallSaidBelow: false });
    const rated = lineByKey(lines, "rated");
    expect(rated).toBeDefined();
    expect(text(rated!.lead)).toBe("None of that has been rated yet.");
    // A "not yet" that does not name the act that ends it reads as broken.
    expect(text(rated!.sub)).toMatch(/^Rate one run/);
  });

  it("reports both sides of a rating in their own colour once ratings land", () => {
    const lines = guidanceLines({
      recall: recall({ helped: 12, contradicted: 3 }),
      rescoreCount: 0,
      recallSaidBelow: false,
    });
    const rated = lineByKey(lines, "rated")!;
    expect(text(rated.lead)).toBe("Your ratings have moved what the crew reaches for first.");
    const markup = renderToStaticMarkup(<>{rated.sub}</>);
    /*
     * THE CLAIM IS "each side is drawn in its OWN tone", and the class name is
     * only the thing a rendered-markup test can see. These two literals moved
     * from `sp-pass`/`sp-fail` to the Meridian tokens when Brain was ported on
     * 2026-08-15; if they ever move again, update them HERE and keep the
     * assertion — the guard exists so that a refactor cannot quietly collapse
     * the two sides into one colour, which is the reading that would tell
     * somebody their contradicted ratings had helped.
     */
    expect(markup).toContain(PASS_TONE);
    expect(markup).toContain(FAIL_TONE);
    expect(text(rated.sub)).toContain("12 helped");
    expect(text(rated.sub)).toContain("3 contradicted by what happened");
  });

  it("draws only the side that happened", () => {
    const lines = guidanceLines({
      recall: recall({ helped: 12, contradicted: 0 }),
      rescoreCount: 0,
      recallSaidBelow: false,
    });
    const sub = renderToStaticMarkup(<>{lineByKey(lines, "rated")!.sub}</>);
    expect(sub).toContain(PASS_TONE);
    expect(sub).not.toContain(FAIL_TONE);
    expect(sub).not.toContain("0");
  });
});

describe("Brain guidance: a young record sharpens, and never reads as broken", () => {
  it("tells a workspace whose record has never been reached for what happens next", () => {
    const lines = guidanceLines({
      recall: recall({ memoriesReached: 0, events: 0 }),
      rescoreCount: 0,
      recallSaidBelow: false,
    });
    const read = lineByKey(lines, "read-back")!;
    expect(text(read.lead)).toBe("No lesson on the record has gone into a run yet.");
    expect(text(read.sub)).toContain("next run");
    // Not a failure word anywhere.
    expect(allCopy(lines).toLowerCase()).not.toMatch(/broken|unavailable|error|failed|disabled/);
  });

  it("says nothing about recall at all when the record has learned nothing", () => {
    const lines = guidanceLines({
      recall: recall({ memoriesTotal: 0, memoriesReached: 0, events: 0 }),
      rescoreCount: 0,
      recallSaidBelow: false,
    });
    expect(lineByKey(lines, "read-back")).toBeUndefined();
    expect(lineByKey(lines, "rated")).toBeUndefined();
  });
});

describe("Brain guidance: the re-score admission", () => {
  it("states it plainly, names the act that ends it, and opens a real door", () => {
    // This is the clause the headline used to carry. It must not evaporate when
    // the headline stops saying it.
    const lines = guidanceLines({ recall: recall(), rescoreCount: 0, recallSaidBelow: false });
    const line = lineByKey(lines, "rescored")!;
    expect(text(line.lead)).toBe("No outcome has moved a call's priority yet.");
    expect(text(line.sub)).toMatch(/^Record what a shipped bet actually did/);
    expect(line.door).toBe("outcomes");
  });

  it("is silent while the compounding read is unresolved", () => {
    // THE RULE: a "not yet" drawn before the thing is known to be absent is a
    // claim, not an admission.
    const lines = guidanceLines({ recall: recall(), rescoreCount: null, recallSaidBelow: false });
    expect(lineByKey(lines, "rescored")).toBeUndefined();
  });

  it("stands down once a re-score exists, because the head and the recess say it", () => {
    const lines = guidanceLines({ recall: recall(), rescoreCount: 2, recallSaidBelow: false });
    expect(lineByKey(lines, "rescored")).toBeUndefined();
  });
});

describe("Brain headline: the forecast rung", () => {
  it("leads with what came true once a forecast has been graded", () => {
    const head = recordHeadline(summary(), recall(), 49, 8, false, forecast());
    expect(head).toBe("12 of 15 graded forecasts came true lately.");
    // It outranks being read back but never the re-scored call.
    expect(head).not.toBe("The crew has read this record before acting.");
  });

  it("still steps aside for the re-scored call, which leads the ladder", () => {
    const head = recordHeadline(summary({ rescoreCount: 2 }), recall(), 49, 8, false, forecast());
    expect(head).toBe("Real outcomes have re-scored 2 calls.");
  });

  it("steps down to the recall claim on a miss, and lets guidance carry the miss", () => {
    // An admission belongs beside its mechanism, not in the largest sentence
    // on the page; the same move that brought "none has re-scored" down.
    const head = recordHeadline(
      summary(),
      recall(),
      49,
      8,
      false,
      forecast({ resolved: 3, hits: 0 }),
    );
    expect(head).toBe("The crew has read this record before acting.");
  });

  it("draws no rung while the calibration read is unresolved or failed", () => {
    const loading = recordHeadline(summary(), recall(), 49, 8, true, null);
    const failed = recordHeadline(summary(), recall(), 49, 8, false, null);
    expect(loading).toBe("The crew has read this record before acting.");
    expect(failed).toBe("The crew has read this record before acting.");
    // And nothing is invented from an absent payload.
    expect(loading).not.toMatch(/forecast/i);
    expect(failed).not.toMatch(/forecast/i);
  });

  it("does not grade zero as a score, because nothing graded is not 0 percent", () => {
    const head = recordHeadline(
      summary(),
      recall(),
      49,
      8,
      false,
      forecast({ resolved: 0, hits: 0, hitRate: null }),
    );
    expect(head).toBe("The crew has read this record before acting.");
    expect(head).not.toMatch(/\d+ of 0/);
  });

  it("keeps its numbers honest about a small sample without dressing one up", () => {
    const single = recordHeadline(
      summary(),
      recall(),
      null,
      null,
      false,
      forecast({ resolved: 1, hits: 1 }),
    );
    expect(single).toBe("One graded forecast, and it came true.");
    const perfect = recordHeadline(
      summary(),
      recall(),
      null,
      null,
      false,
      forecast({ resolved: 4, hits: 4 }),
    );
    expect(perfect).toBe("4 of 4 graded forecasts came true lately.");
  });
});

describe("Brain guidance: the graded forecast line", () => {
  it("states the full score and what makes it mean anything", () => {
    const lines = guidanceLines({
      recall: recall(),
      rescoreCount: 0,
      recallSaidBelow: false,
      forecast: forecast(),
    });
    const line = lineByKey(lines, "forecast")!;
    expect(text(line.lead)).toBe("12 of 15 graded forecasts came true lately.");
    // The moat is that the expectation went on the record BEFORE the outcome
    // was known; the sub says that and nothing else.
    expect(text(line.sub)).toMatch(/^Each was written down before/);
    expect(text(line.sub)).toContain("marked against what actually happened");
  });

  it("reports a settled miss in the same sentence, because a miss is an outcome", () => {
    const lines = guidanceLines({
      recall: recall(),
      rescoreCount: 0,
      recallSaidBelow: false,
      forecast: forecast({ resolved: 3, hits: 0 }),
    });
    expect(text(lineByKey(lines, "forecast")!.lead)).toBe(
      "0 of 3 graded forecasts came true lately.",
    );
  });

  it("names the wired consequence that ends a zero-graded absence", () => {
    const lines = guidanceLines({
      recall: recall(),
      rescoreCount: 0,
      recallSaidBelow: false,
      forecast: forecast({ resolved: 0, hits: 0, hitRate: null }),
    });
    const line = lineByKey(lines, "forecast")!;
    expect(text(line.lead)).toBe("No forecast has been graded yet.");
    expect(text(line.sub)).toMatch(/^When a forecast on the record passes its date/);
    // Not a failure word anywhere.
    expect(allCopy(lines).toLowerCase()).not.toMatch(/broken|unavailable|error|failed|disabled/);
  });

  it("draws nothing while the calibration read is unresolved or failed", () => {
    const unresolved = guidanceLines({
      recall: recall(),
      rescoreCount: 0,
      recallSaidBelow: false,
    });
    const failed = guidanceLines({
      recall: recall(),
      rescoreCount: 0,
      recallSaidBelow: false,
      forecast: null,
    });
    expect(lineByKey(unresolved, "forecast")).toBeUndefined();
    expect(lineByKey(failed, "forecast")).toBeUndefined();
  });

  it("survives on every tab, because nothing else on this surface says it", () => {
    const lines = guidanceLines({
      recall: recall(),
      rescoreCount: 0,
      recallSaidBelow: true,
      forecast: forecast(),
    });
    expect(lineByKey(lines, "forecast")).toBeDefined();
    // While the recall lines stand down where CrewCarries repeats them.
    expect(lineByKey(lines, "read-back")).toBeUndefined();
    expect(lineByKey(lines, "rated")).toBeUndefined();
  });
});

describe("Brain guidance: nothing is said twice", () => {
  it("stands the recall lines down on the tab where CrewCarries says them", () => {
    const lines = guidanceLines({ recall: recall(), rescoreCount: 0, recallSaidBelow: true });
    expect(lineByKey(lines, "read-back")).toBeUndefined();
    expect(lineByKey(lines, "rated")).toBeUndefined();
    // And keeps the one nothing else on that tab states.
    expect(lineByKey(lines, "rescored")).toBeDefined();
  });

  it("renders nothing at all rather than an empty region", () => {
    const lines = guidanceLines({ recall: null, rescoreCount: null, recallSaidBelow: false });
    expect(lines).toEqual([]);
  });
});

/**
 * The zero state, which is the MAJORITY view and not an edge case: every
 * self-improve proposal and 99% of gate data sits in demo workspaces, and
 * agent_memory holds no outcome rows, so a real account gets this page blank.
 *
 * THE DEFECT THIS GUARDS THE FIX FOR. Blank, the surface stacked five
 * consecutive "nothing yet" regions in one scroll. Each is true and each names
 * the act that ends it; read as a column they say the product is broken. The
 * four above the tabs collapse into one, and the two failures that would make
 * that collapse a lie are the ones below.
 */
describe("Brain collapses its zero state, and only when it knows it is one", () => {
  const known = {
    emptyRecord: true,
    standing: { rules: 0, pendingRules: 0, memoriesTotal: 0 },
    rescoreCount: 0,
    graphEmpty: true,
    forecastResolved: 0,
    drilling: false,
  };

  it("collapses a record that is genuinely blank on every read", () => {
    expect(recordIsBlank(known)).toBe(true);
  });

  it("never collapses on a read that has not answered", () => {
    // THE RULE: an unknown is not an emptiness. Collapsing here would hide a
    // failed read behind a tidy empty state, which is what Failed exists to
    // refuse.
    expect(recordIsBlank({ ...known, standing: null })).toBe(false);
    expect(recordIsBlank({ ...known, rescoreCount: null })).toBe(false);
    expect(recordIsBlank({ ...known, graphEmpty: null })).toBe(false);
    expect(recordIsBlank({ ...known, forecastResolved: null })).toBe(false);
    expect(recordIsBlank({ ...known, emptyRecord: false })).toBe(false);
  });

  it("keeps every region that would have had something to say", () => {
    // Each of these is a region drawing real content, so the collapse must not
    // swallow it.
    expect(recordIsBlank({ ...known, rescoreCount: 2 })).toBe(false);
    expect(recordIsBlank({ ...known, graphEmpty: false })).toBe(false);
    expect(
      recordIsBlank({ ...known, standing: { rules: 1, pendingRules: 0, memoriesTotal: 0 } }),
    ).toBe(false);
    // A draft the steward wrote is a thing waiting on a human, and StandingRules
    // is the only surface that says so.
    expect(
      recordIsBlank({ ...known, standing: { rules: 0, pendingRules: 1, memoriesTotal: 0 } }),
    ).toBe(false);
    expect(
      recordIsBlank({ ...known, standing: { rules: 0, pendingRules: 0, memoriesTotal: 4 } }),
    ).toBe(false);
  });

  it("stands down on an open drill, where the surface state is not what is being read", () => {
    expect(recordIsBlank({ ...known, drilling: true })).toBe(false);
  });
});
