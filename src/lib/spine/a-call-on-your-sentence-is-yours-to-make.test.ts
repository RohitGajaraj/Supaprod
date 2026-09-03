/**
 * Walked live in an empty probe workspace, 2026-09-04. Sense searched, found
 * nothing and carried the person's sentence -- R-36 working. Decide's
 * strategist then DECLINED on that same absence ("not currently a meaningful
 * friction point", forecast against 1,000 sessions no source here can see), the
 * decline arm waived four stations, and Learn came to rest on "Waiting on time,
 * Learn returns Oct 3".
 *
 * A person who typed one sentence into an empty workspace was told no, on
 * nothing, with a date that returns to nothing.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  declineIsRefused,
  restsOnAbsence,
  R39_REFUSAL,
  CARRIED_FOOTING,
  CARRIED_CHOICE,
} from "./a-call-on-your-sentence-is-yours-to-make";
import { waitingOnTime } from "@/components/track/a-calendar-wait-is-not-a-stoppage";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a no on the person's own sentence is refused", () => {
  it("refuses the exact rationale the strategist wrote", () => {
    expect(
      declineIsRefused({
        call: "do-not-build",
        carried: true,
        rationale: "This is not currently a meaningful friction point for users.",
      }),
    ).toBe(true);
  });

  it("refuses a decline with NO rationale, which is the same no with the argument left out", () => {
    for (const r of [null, undefined, "", "   "]) {
      expect(declineIsRefused({ call: "do-not-build", carried: true, rationale: r })).toBe(true);
    }
  });

  it("lets a decline about the IDEA through, on the same carried track", () => {
    // A strategist may honestly decline a bad idea in an empty workspace. What
    // is refused is declining because there is nothing to look at.
    expect(
      declineIsRefused({
        call: "do-not-build",
        carried: true,
        rationale:
          "It duplicates the export we shipped in July and would split one job across two screens.",
      }),
    ).toBe(false);
    // "I am not sure" is honesty, not absence.
    expect(restsOnAbsence("I am not confident this is the right sequencing yet.")).toBe(false);
  });

  it("does not touch a track that read something real", () => {
    expect(
      declineIsRefused({ call: "do-not-build", carried: false, rationale: "no evidence for this" }),
    ).toBe(false);
  });

  it("never refuses a build", () => {
    expect(declineIsRefused({ call: "build", carried: true, rationale: "no data anywhere" })).toBe(
      false,
    );
  });

  it("names both ways forward, because a floor that only forbids teaches nothing", () => {
    expect(R39_REFUSAL).toContain("their own claim as the forecast");
    expect(R39_REFUSAL).toContain("point");
    expect(R39_REFUSAL.length).toBeGreaterThan(200);
  });

  it("is enforced in the WRITER, not asked for in a brief", () => {
    const reg = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
    expect(reg).toContain("declineIsRefused({ call: a.call, carried, rationale: a.rationale })");
    expect(reg).toContain("throw new Error(R39_REFUSAL)");
    // Refused, never rewritten: turning the decline into a build would record a
    // call nobody made.
    expect(reg).not.toContain('a.call = "build"');
  });

  it("does not refuse when the footing could not be read", () => {
    // Blocking a legitimate no on a lookup failure would stop the one station
    // whose job is to stop work.
    const reg = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
    expect(reg).toContain("!trackErr &&");
    // Asserted as the identifier, not as `=== CARRIED_FOOTING`: prettier wraps
    // that comparison across a line and a guard coupled to where a line breaks
    // is testing the formatter (F-189).
    expect(reg).toContain("CARRIED_FOOTING");
    expect(reg.replace(/\s+/g, " ")).toContain("?? null) === CARRIED_FOOTING");
    expect(CARRIED_FOOTING).toBe("carried-on-your-sentence");
  });

  it("offers two options with nothing pre-selected, each carrying its deciding fact", () => {
    expect(CARRIED_CHOICE.options).toHaveLength(2);
    for (const o of CARRIED_CHOICE.options) {
      expect(o.fact.length).toBeGreaterThan(10);
      expect(o.label.trim().length).toBeGreaterThan(0);
    }
    expect(CARRIED_CHOICE.question).not.toContain("?");
  });
});

describe("a forecast nothing can grade is not a calendar wait", () => {
  const AT_LEARN = { station: "learn", holdReason: "needs-evidence", now: 1_760_000_000_000 };
  const FUTURE = new Date(1_760_000_000_000 + 86_400_000).toISOString();

  it("stops calling it a wait when no connected source can check it", () => {
    // "Waiting on time, Learn returns Oct 3" against 1,000 sessions nothing can
    // see. A date that returns to nothing is worse than a stoppage: a stoppage
    // asks for something.
    expect(waitingOnTime({ ...AT_LEARN, horizon: FUTURE, gradableBySource: false })).toBe(false);
  });

  it("leaves a real calendar wait alone", () => {
    expect(waitingOnTime({ ...AT_LEARN, horizon: FUTURE, gradableBySource: true })).toBe(true);
  });

  it("treats an UNREAD gradability as unchanged, never as ungradeable", () => {
    // The mirror of the defect: a caller that has not looked must not turn a
    // real calendar wait into a stoppage.
    expect(waitingOnTime({ ...AT_LEARN, horizon: FUTURE })).toBe(true);
    expect(waitingOnTime({ ...AT_LEARN, horizon: FUTURE, gradableBySource: null })).toBe(true);
  });

  it("asks the same question the Decide station already asks, of the same words", () => {
    const run = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));
    expect(run).toContain("checkForecastObservable");
    expect(run).toContain("howWeWillKnowFromStops");
    // Only while held at Learn: everywhere else there is no wait to correct.
    expect(run).toContain('track?.station === "learn"');
    expect(run).toContain("observable.isSuccess ? observable.data.checkable : null");
  });
});

describe("the refusal becomes a question (P-71b)", () => {
  const DRIVER = code(readFileSync("src/lib/spine/driver.server.ts", "utf8"));
  const TRACKS = code(readFileSync("src/lib/spine/track.functions.ts", "utf8"));
  const RUN = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));
  const CARD = code(readFileSync("src/components/track/TheCallIsYours.tsx", "utf8"));

  it("keys on the refusal HAVING HAPPENED, not on the state it leaves behind", () => {
    // A strategist that produced nothing lands in the same state, and so does a
    // run that failed. Only the refusal means a no was ATTEMPTED on the
    // person's own sentence.
    expect(DRIVER).toContain("refusalHappened(errors)");
    expect(DRIVER).toContain('.eq("ok", false)');
  });

  it("holds on its OWN word, not on waiting-on-a-person plus a sentence", () => {
    // F-127's invariant: `waiting-on-a-person` always clears its reason column,
    // because the GATE is the reason. This hold has no gate row at all, so
    // reusing that word would have put a card in front of a person that
    // `TrackConsent` cannot draw and forced a sentence into a column that must
    // stay null. The first draft did exactly that and the guard caught it.
    expect(DRIVER).toContain('last_hold: "the-call-is-yours"');
    const block = DRIVER.slice(DRIVER.indexOf('last_hold: "the-call-is-yours"'));
    expect(block.slice(0, 200)).toContain("last_hold_because: null");
    expect(RUN).toContain('track?.holdReason === "the-call-is-yours"');
  });

  it("does not count as an attempt, so a person's thinking time is not a fault", () => {
    /*
     * Bounded to the block, not to EOF. The first draft anchored the end on a
     * COMMENT ("Out of budget") which comment-stripping had already removed, so
     * `indexOf` returned -1, the slice ran to the end of the file and found
     * `attempts:` in an unrelated hold. The same slice-to-EOF bug this packet
     * fixed in two other guards, written into a third by me.
     */
    const from = DRIVER.indexOf("refusalHappened(errors)");
    const to = DRIVER.indexOf("if (overBudget)", from);
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    expect(DRIVER.slice(from, to)).not.toContain("attempts:");
  });

  it("is the ONE card on the screen, and stands the retry down", () => {
    // Pressing "let it try again" would dispatch the station that just refused,
    // into the same emptiness, and spend money to arrive back here.
    expect(RUN).toContain("answerTheCall || callIsYours ? null : (");
    // It replaces the gate card rather than sitting beside it: no approval row
    // exists for this hold, so the two can never both be up.
    expect(RUN).toContain("callIsYours ? (");
  });

  it("records the person's own sentence as the forecast, and invents no observable", () => {
    const fn = TRACKS.slice(TRACKS.indexOf("export const buildOnYourWord"));
    expect(fn).toContain("forecast_claim: claim");
    // A plausible-sounding metric in a workspace with no analytics is the
    // sentence that produced this whole packet.
    expect(fn).toContain("Nothing connected here can settle this yet");
    expect(fn).toContain("decided_by_agent_slug: null");
  });

  it("refuses to record when there is no sentence to record", () => {
    const fn = TRACKS.slice(TRACKS.indexOf("export const buildOnYourWord"));
    expect(fn).toContain("This run carries no sentence");
  });

  it("clears the hold LAST, after the row exists", () => {
    // Clearing first would let the sweep re-dispatch Decide into the same
    // emptiness while the decision was still being written.
    const fn = TRACKS.slice(TRACKS.indexOf("export const buildOnYourWord"));
    expect(fn.indexOf('.from("decisions")')).toBeLessThan(fn.indexOf("last_hold: null"));
  });

  it("pre-selects neither option", () => {
    expect(CARD).toContain("CARRIED_CHOICE.options.map");
    expect(CARD).not.toContain("defaultId");
    expect(CARD).not.toContain("selected");
  });
});
