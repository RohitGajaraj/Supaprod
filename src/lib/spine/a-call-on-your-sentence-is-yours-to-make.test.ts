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
  footingIsCarried,
  choiceIsOutstanding,
  CHOICE_OUTSTANDING_REFUSAL,
  seatMayDecide,
  CARRIED_DECISION_REFUSAL,
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
    /*
     * P-71c MOVED THE READ, so this asserts the rule rather than the old code.
     * It used to check `!trackErr &&` against a `last_hold` lookup; the footing
     * is read from the record now and the fail-open lives in
     * `carriedEvidenceFor`, which returns `known: false` on any failed read.
     */
    const reg = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
    expect(reg).toContain("CARRIED_FOOTING");
    const fn = reg.slice(reg.indexOf("async function carriedEvidenceFor"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain("known: false");
    expect(body).toContain("} catch {");
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
    /* P-59c added `|| shipStop` to the same guard, for the same reason one
       clause down: the station's own retry must not be offered when pressing it
       cannot change anything. The rule asserted here is that `callIsYours`
       stands it down, not the exact list of things that also do. */
    expect(RUN).toContain("answerTheCall || callIsYours ||");
    expect(RUN).toContain("? null : (");
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

describe("the footing survives a continuation (P-71c)", () => {
  const REG2 = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));

  /**
   * A1's SECOND PROBE WALK, EXACTLY (track fa059cf4, 2026-09-04):
   *   22:22  Sense searched, found nothing, carried the sentence
   *   22:40  Decide ran out of time, so `last_hold` became `out-of-time`
   *   22:40  the critic declined citing "no signals about holiday homes"
   *
   * The rationale matches the classifier on its own. P-71 still let it through,
   * because the footing was read from `last_hold` and one continuation had
   * already overwritten it.
   */
  it("refuses the decline that got through, with the hold overwritten", () => {
    const carried = footingIsCarried({
      // `track_drives` kept it: the Decide drive entered on the carried hold.
      senseCarried: true,
      signalsOnTrack: 0,
      known: true,
    });
    expect(carried).toBe(true);
    expect(
      declineIsRefused({
        call: "do-not-build",
        carried,
        rationale:
          "Zero observed evidence. There are no signals about holiday homes, and the absence " +
          "of demand signals means this is not worth building.",
      }),
    ).toBe(true);
  });

  it("never reads the footing off last_hold again", () => {
    // The transient column asked a durable question. That is the defect, and it
    // is the shape rather than the threshold.
    const from = REG2.indexOf('if (a.call === "do-not-build" && trackId)');
    const to = REG2.indexOf("throw new Error(R39_REFUSAL)", from);
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    const block = REG2.slice(from, to);
    expect(block).not.toContain("last_hold");
    expect(block).toContain("carriedEvidenceFor(supabase, trackId");
  });

  it("takes either durable record, so one unreadable table does not lose it", () => {
    const fn = REG2.slice(REG2.indexOf("async function carriedEvidenceFor"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain('.from("track_drives")');
    expect(body).toContain('.eq("tool_name", "sense.found_nothing")');
  });

  it("lifts the footing once a signal is on the track", () => {
    // Not "Sense once found nothing" but "there is nothing here bearing on this
    // sentence". A signal answers that, and the strategist's no is its own again.
    expect(footingIsCarried({ senseCarried: true, signalsOnTrack: 1, known: true })).toBe(false);
  });

  it("does not refuse when the footing could not be read", () => {
    // Not knowing the footing is not evidence of one.
    expect(footingIsCarried({ senseCarried: true, signalsOnTrack: 0, known: false })).toBe(false);
  });

  it("still lets a decline through on a track Sense never carried", () => {
    expect(footingIsCarried({ senseCarried: false, signalsOnTrack: 0, known: true })).toBe(false);
  });
});

describe("the choice holds until the person answers (P-71d)", () => {
  const REG3 = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
  const SWEEP = code(
    readFileSync("src/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue.ts", "utf8"),
  );
  const TRACKS3 = code(readFileSync("src/lib/spine/track.functions.ts", "utf8"));
  const RUN4 = code(readFileSync("src/components/track/TrackRun.tsx", "utf8"));

  /**
   * A1'S THIRD PROBE WALK, EXACTLY (track 0c0db8e6, 2026-09-04):
   *   00:00  Decide entered carried
   *   00:10  the writer refused; the track held `the-call-is-yours` with the
   *          seat's own question on the record
   *   00:20  the sweep drove it again, Decide ran out of time, and the seat
   *          recorded "Show installer arrival window on order page" APPROVED
   *
   * The refusal worked. The wait did not hold, and the machine then made the
   * call by saying YES -- which the decline-only guard never looked at.
   */
  it("refuses a BUILD too, not only a decline, while the question stands", () => {
    expect(choiceIsOutstanding({ choiceRaised: true, answered: false, known: true })).toBe(true);
    expect(CHOICE_OUTSTANDING_REFUSAL).toContain("to build or not to build");
    expect(REG3).toContain("choiceIsOutstanding(outstanding)");
    expect(REG3).toContain("throw new Error(CHOICE_OUTSTANDING_REFUSAL)");
  });

  it("checks it BEFORE the rationale, because it does not depend on one", () => {
    const both = REG3.indexOf("choiceIsOutstanding(outstanding)");
    const decline = REG3.indexOf('if (a.call === "do-not-build" && trackId)');
    expect(both).toBeGreaterThan(-1);
    expect(decline).toBeGreaterThan(both);
  });

  it("keeps the track out of the sweep, which no gate row was doing for it", () => {
    // Every other person-shaped hold keeps its place through `pending_gates`.
    // This one has no gate row by design: it is a Choice on the run screen.
    expect(SWEEP).toContain('"the-call-is-yours"');
    expect(SWEEP).toContain("HOLDS_A_PERSON_CLEARS_ELSEWHERE");
  });

  it("lifts that skip when the person answers, or the track waits forever", () => {
    // The skip is `driven_at > updated_at`, and a hold write moves only
    // `driven_at`. Answering is the person acting, which is what that column
    // records.
    const fn = TRACKS3.slice(TRACKS3.indexOf("export const buildOnYourWord"));
    const body = fn.slice(
      0,
      fn.indexOf("\nexport const ") === -1 ? fn.length : fn.indexOf("\nexport const "),
    );
    expect(body).toContain("updated_at: new Date().toISOString()");
  });

  it("draws the card from the record, not from the current hold", () => {
    // The hold was overwritten within ten minutes and the screen fell back to
    // the generic out-of-time card while the question was still unanswered.
    expect(RUN4).toContain("choiceRaised.isSuccess && choiceRaised.data.outstanding");
    expect(TRACKS3).toContain("export const choiceStillOutstanding");
  });

  it("stops asking once a decision is on the track", () => {
    // Whoever recorded it: the person, or a station that ran after they chose
    // to point a source. Either way the question is answered.
    const fn = TRACKS3.slice(TRACKS3.indexOf("export const choiceStillOutstanding"));
    expect(fn).toContain('.eq("artifact_kind", "decision")');
    expect(fn).toContain("outstanding: ((decided.data ?? []) as unknown[]).length === 0");
  });

  it("treats an unread state as NOT outstanding", () => {
    // Drawing the Choice over a track that has moved on would ask a question
    // that has already been answered.
    expect(choiceIsOutstanding({ choiceRaised: true, answered: false, known: false })).toBe(false);
  });

  it("stops refusing once they have answered", () => {
    expect(choiceIsOutstanding({ choiceRaised: true, answered: true, known: true })).toBe(false);
  });
});

describe("the call is asked before a seat runs (P-71e)", () => {
  const DRV = code(readFileSync("src/lib/spine/driver.server.ts", "utf8"));
  const REG4 = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
  const TRACKS4 = code(readFileSync("src/lib/spine/track.functions.ts", "utf8"));
  const CARD2 = code(readFileSync("src/components/track/TheCallIsYours.tsx", "utf8"));

  /**
   * A1'S FOURTH PROBE SENTENCE (track 6cc7a010, 2026-09-04):
   *   01:40  Decide entered on the carried footing
   *   01:40  the seat recorded "Reschedule installer visit from order page"
   *          APPROVED, with a forecast it wrote, on the FIRST pass
   *   ....   the track walked to Define with no Choice and no person
   *
   * Every earlier fix was downstream of a seat that had already decided. P-71
   * refused a NO; P-71d refused either answer WHILE the Choice stood. Neither
   * helps on the first pass, because nothing had been raised and the seat said
   * YES.
   */
  it("refuses a BUILD on a carried track, not only a decline", () => {
    expect(seatMayDecide({ carried: true, known: true })).toBe(false);
    expect(CARRIED_DECISION_REFUSAL).toContain("build or do-not-build");
    expect(REG4).toContain("seatMayDecide({ carried: footingIsCarried(evidence)");
    expect(REG4).toContain("throw new Error(CARRIED_DECISION_REFUSAL)");
  });

  it("checks that before the decline rule, which only looks at a rationale", () => {
    const any = REG4.indexOf("CARRIED_DECISION_REFUSAL");
    const decline = REG4.indexOf('if (a.call === "do-not-build" && trackId)');
    expect(any).toBeGreaterThan(-1);
    expect(decline).toBeGreaterThan(any);
  });

  it("raises the Choice BEFORE the crew is dispatched, and spends nothing", () => {
    // On a carried track arriving at Decide there is nothing to weigh: Sense has
    // already reported the workspace holds nothing bearing on the sentence, and
    // dispatching a strategist spends money to have it invent a forecast.
    /* Anchored on CODE, not on the comment above the dispatch: the stripper
       removes comments, so `indexOf` on one returns -1 and the comparison
       passes or fails for the wrong reason (F-191). */
    const raise = DRV.indexOf("carriedFootingForTrack(supabase, row.id)");
    const crew = DRV.indexOf("const crew = stationCrew(station);");
    expect(raise).toBeGreaterThan(-1);
    expect(crew).toBeGreaterThan(raise);
  });

  it("does not re-ask a question already answered", () => {
    const fn = DRV.slice(DRV.indexOf("async function carriedFootingForTrack"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain('.eq("artifact_kind", "decision")');
    // And the footing lifts once the workspace holds something.
    expect(body).toContain('.eq("artifact_kind", "signal")');
  });

  it("lets a seat decide when the footing could not be read", () => {
    // Not knowing is not evidence, and blocking every decision on a failed read
    // would stop the one station whose job is deciding.
    expect(seatMayDecide({ carried: true, known: false })).toBe(true);
    expect(seatMayDecide({ carried: false, known: true })).toBe(true);
  });

  it("lets the person write what would settle it, and prefills nothing", () => {
    // A box already holding a plausible metric gets accepted rather than read,
    // and inventing an observable this workspace cannot see is the defect that
    // produced this whole line of packets.
    expect(CARD2).toContain('React.useState("")');
    expect(CARD2).toContain("onBuildOnYourWord(howWeWillKnow.trim())");
    expect(CARD2).not.toContain('placeholder="Nothing connected');
    expect(TRACKS4).toContain("data.howWeWillKnow && data.howWeWillKnow.length > 0");
  });

  it("keeps the honest default when they write nothing", () => {
    expect(TRACKS4).toContain("Nothing connected here can settle this yet");
  });
});
