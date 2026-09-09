/**
 * THE FIXTURE IS THE MEASURED RUN, ROW FOR ROW.
 *
 * `6cc7a010` on Helio Labs, read out of `agent_runs` on 2026-09-09. Six Build
 * turns reporting one wall, the loop sending the work backwards twice, and
 * twelve credit halts at Design -- which is the refrain the screen showed, and
 * the symptom rather than the cause.
 *
 * Every sentence below is the real `output` column, truncated where the real
 * one is long. No invented prose: the point of this function is that the agent
 * writes better than the machinery, and a fixture I wrote myself would prove
 * the machinery against my own writing.
 */
import { describe, expect, it } from "bun:test";

import {
  theBlockerItAlreadyNamed,
  blockerLead,
  alsoBehindIt,
  refrainStillSaysSomething,
  MIN_BLOCKED_TURNS,
  type BlockedTurn,
} from "./the-blocker-it-already-named";

const turn = (over: Partial<BlockedTurn> & { at: string }): BlockedTurn => ({
  runId: `r-${over.at}`,
  station: "build",
  stationName: over.station ? over.station[0]!.toUpperCase() + over.station.slice(1) : "Build",
  agentName: "Engineer",
  outcome: "partly",
  made: [],
  said: null,
  ...over,
});

const NO_REPO_1 =
  "No repository is connected for this workspace. I cannot proceed with implementing the reschedule functionality without access to the codebase. Please bind a repository on Connectors so I can continue with the implementation.";
const NO_REPO_2 =
  "No repository is connected for this workspace. Repository connectivity is required before any code inspection or modification can proceed. This is a hard stop - I cannot build the rescheduling feature without access to the codebase. Please bind a repository on Connectors first.";
const NO_CREDIT =
  "Halted: AI credits exhausted: account credit balance (1) is below the projected cost (20). Top up or upgrade in Settings.";

/** The run as the database holds it, oldest first. */
const RUN: BlockedTurn[] = [
  turn({
    at: "01:25",
    station: "sense",
    agentName: "Watch",
    outcome: "done",
    said: "No evidence was found in the workspace about homeowners rescheduling installer visits.",
  }),
  turn({
    at: "01:40",
    station: "decide",
    agentName: "Prioritize",
    outcome: "done",
    made: [{}],
    said: "Decision recorded: 'Wait' for rescheduling installer visits from the order page.",
  }),
  turn({
    at: "02:00",
    station: "define",
    agentName: "Draft",
    outcome: "done",
    made: [{}],
    said: "PRD drafted successfully. Success metric is embedded.",
  }),
  turn({
    at: "02:20",
    station: "design",
    agentName: "Design",
    outcome: "done",
    made: [{}],
    said: "I've designed the surface for letting homeowners reschedule installer visits.",
  }),
  turn({ at: "02:30", station: "build", agentName: "Engineer", said: NO_REPO_1 }),
  turn({ at: "02:31", station: "build", agentName: "Review", said: NO_REPO_2 }),
  turn({ at: "02:40", station: "build", agentName: "Engineer", said: NO_REPO_2 }),
  turn({ at: "03:00", station: "build", agentName: "Review", said: NO_REPO_1 }),
  turn({ at: "03:10", station: "build", agentName: "Engineer", said: NO_REPO_2 }),
  turn({ at: "03:11", station: "build", agentName: "Review", said: NO_REPO_1 }),
  turn({
    at: "03:30",
    station: "define",
    agentName: "Draft",
    outcome: "done",
    made: [{}],
    said: "The PRD has been revised to include the required success metric.",
  }),
  ...Array.from({ length: 12 }, (_, i) =>
    turn({
      at: `0${4 + Math.floor(i / 6)}:${String((i % 6) * 10).padStart(2, "0")}`,
      station: "design",
      agentName: "Design",
      outcome: "stopped",
      said: NO_CREDIT,
      haltedReason: "out_of_credit",
    }),
  ),
];

describe("the blocker the run already named", () => {
  it("is Build's, not the twelve credit halts the run ends on", () => {
    const b = theBlockerItAlreadyNamed(RUN);
    expect(b).not.toBeNull();
    expect(b!.station).toBe("build");
    expect(b!.said).toBe(NO_REPO_1);
    expect(b!.halt).toBe(false);
  });

  it("counts every turn that hit the same wall, across seats", () => {
    const b = theBlockerItAlreadyNamed(RUN)!;
    // One station that cannot start is one fact, not two, though two agents
    // wrote it.
    expect(b.turns).toBe(6);
    expect(b.seats).toEqual(["Engineer", "Review"]);
    expect(b.from).toBe("02:30");
    expect(b.to).toBe("03:11");
  });

  it("quotes the FIRST telling, before the re-trying coloured it", () => {
    expect(theBlockerItAlreadyNamed(RUN)!.said).toBe(NO_REPO_1);
  });

  it("says who and how often, and nothing about what to do", () => {
    const lead = blockerLead(theBlockerItAlreadyNamed(RUN)!);
    expect(lead).toBe("Engineer and Review could not start Build, across 6 turns.");
    // The agent's own sentence ends in an instruction more specific than
    // anything this function knows. A second imperative over the top of it is
    // the machinery talking over the only voice that had actually tried.
    expect(lead).not.toMatch(/connect|bind|please|try/i);
  });
});

describe("RULE 1: a refusal outranks a halt", () => {
  it("takes the agent's report over the platform stopping the work", () => {
    // Reversed in time, so this cannot pass by accident on ordering.
    const halted = [
      turn({ at: "01:00", station: "design", outcome: "stopped", said: NO_CREDIT }),
      turn({ at: "01:10", station: "design", outcome: "stopped", said: NO_CREDIT }),
      turn({ at: "02:30", station: "build", agentName: "Engineer", said: NO_REPO_1 }),
      turn({ at: "02:40", station: "build", agentName: "Engineer", said: NO_REPO_2 }),
    ];
    const b = theBlockerItAlreadyNamed(halted)!;
    expect(b.station).toBe("build");
    expect(b.halt).toBe(false);
  });

  it("but still reports a halt when a halt is all there is", () => {
    // Silence here would be worse: out of credit is real, actionable, and the
    // only thing that happened.
    const b = theBlockerItAlreadyNamed([
      turn({ at: "01:00", station: "design", outcome: "stopped", said: NO_CREDIT }),
      turn({ at: "01:10", station: "design", outcome: "stopped", said: NO_CREDIT }),
    ])!;
    expect(b.station).toBe("design");
    expect(b.halt).toBe(true);
  });
});

describe("RULE 2: the earliest of two refusals wins", () => {
  it("shows the one that put the loop in motion", () => {
    const b = theBlockerItAlreadyNamed([
      turn({ at: "01:00", station: "build", agentName: "Engineer", said: NO_REPO_1 }),
      turn({ at: "01:10", station: "build", agentName: "Review", said: NO_REPO_2 }),
      turn({
        at: "02:00",
        station: "ship",
        agentName: "Release",
        said: "No deployment target is configured for this workspace, so nothing can go out.",
      }),
      turn({
        at: "02:10",
        station: "ship",
        agentName: "Release",
        said: "No deployment target is configured for this workspace, so nothing can go out.",
      }),
    ])!;
    expect(b.station).toBe("build");
  });
});

describe("and it stays silent when there is nothing to say", () => {
  it("on a healthy run", () => {
    expect(theBlockerItAlreadyNamed(RUN.filter((t) => t.outcome === "done"))).toBeNull();
  });

  it("on a single failure, which is a bad turn and not a wall", () => {
    expect(theBlockerItAlreadyNamed([turn({ at: "02:30", said: NO_REPO_1 })])).toBeNull();
    expect(MIN_BLOCKED_TURNS).toBe(2);
  });

  it("on two failures that failed differently", () => {
    // Two seats failing for unrelated reasons is not one wall, and saying it
    // was would invent a pattern out of a bad afternoon.
    expect(
      theBlockerItAlreadyNamed([
        turn({ at: "02:30", said: NO_REPO_1 }),
        turn({
          at: "02:40",
          said: "The test suite timed out after ninety seconds on the payments module.",
        }),
      ]),
    ).toBeNull();
  });

  it("on a station that failed but still filed something", () => {
    // It got past the wall enough to produce. Whatever went wrong, it is not
    // a station that cannot start.
    expect(
      theBlockerItAlreadyNamed([
        turn({ at: "02:30", said: NO_REPO_1, made: [{}] }),
        turn({ at: "02:40", said: NO_REPO_2, made: [{}] }),
      ]),
    ).toBeNull();
  });

  it("on a run that is still working", () => {
    expect(
      theBlockerItAlreadyNamed([
        turn({ at: "02:30", outcome: "working", said: NO_REPO_1 }),
        turn({ at: "02:40", outcome: "working", said: NO_REPO_2 }),
      ]),
    ).toBeNull();
  });

  it("and on an empty run", () => {
    expect(theBlockerItAlreadyNamed([])).toBeNull();
  });

  it("on turns the record cannot place at a station", () => {
    // "This station cannot start" is a claim about a station. Two unplaceable
    // turns pooled together would invent one out of the rows that have none.
    expect(
      theBlockerItAlreadyNamed([
        turn({ at: "02:30", station: null, said: NO_REPO_1 }),
        turn({ at: "02:40", station: null, said: NO_REPO_2 }),
      ]),
    ).toBeNull();
  });
});

describe("what the refrain still adds once the blocker is on screen", () => {
  const b = theBlockerItAlreadyNamed(RUN)!;

  it("keeps it when they are about different stations", () => {
    // The measured run: the wall is at Build, the twelve halts are at Design.
    // Both are true, both are actionable, and neither says the other.
    expect(b.station).toBe("build");
    expect(refrainStillSaysSomething(b, "design")).toBe(true);
  });

  it("drops it when they are the same station", () => {
    // Then it is the blocker again in fewer words, and the count is already in
    // the lead above it.
    expect(refrainStillSaysSomething(b, "build")).toBe(false);
  });

  it("and keeps it when there is no blocker at all", () => {
    expect(refrainStillSaysSomething(null, "design")).toBe(true);
  });
});

/**
 * MY OWN STATED LIMIT, MET IN THE WILD BY A STRANGER.
 *
 * The module header says it: "on a run with two genuinely independent blockers,
 * this shows the older one and stays silent about the other... a person reading
 * only this sentence will not know a second one is behind it."
 *
 * S1 walked `6cc7a010` cold and that is exactly what happened. They read
 * "Connect a repository", believed it was the obstruction, and had no idea the
 * account had been out of credit since the 4th -- twelve `ux-architect` runs,
 * all halted, all `out_of_credit`, averaging 612ms. Someone who connects the
 * repository walks into a thirteenth instant halt.
 *
 * Of the six tracks that have ever held a halted run, FIVE halted out of
 * credit. It is the commonest real blocker this product has and no
 * top-of-screen surface has ever named it.
 */
describe("a reader is told when something else is behind it", () => {
  it("counts the walls it is not showing", () => {
    // The measured run: Build's refusal is quoted, Design's twelve halts are
    // the wall behind it.
    const b = theBlockerItAlreadyNamed(RUN)!;
    expect(b.station).toBe("build");
    expect(b.othersBehind).toBe(1);
    expect(alsoBehindIt(b)).toBe("It hit one more wall after this one.");
  });

  it("in the PAST tense, because the record cannot say a wall is still standing", () => {
    /*
     * Read live on `6cc7a010`, 2026-09-10. The wall SHOWN (Build, no
     * repository) was still there -- `connection_bindings` = 0. The wall
     * COUNTED (Design, out_of_credit) was gone: the account was topped up on
     * 2026-09-09 and holds 5,240 credits. The card was telling a person to
     * expect an obstruction that no longer existed.
     *
     * Saying "is behind" needs the account balance, which is two chained reads
     * that took Lane 1's home surface down the same evening (`3e6d17dba`). So
     * the count stays and the tense goes: what the record vouches for is that
     * this run HIT another wall, not that one is waiting.
     */
    const b = theBlockerItAlreadyNamed(RUN)!;
    const said = alsoBehindIt(b)!;
    expect(said).toContain("hit");
    expect(said).not.toContain(" is behind");
    expect(said).not.toContain(" are behind");
  });

  it("says nothing when the one shown is the only one", () => {
    const only = theBlockerItAlreadyNamed([
      turn({ at: "02:30", agentName: "Engineer", said: NO_REPO_1 }),
      turn({ at: "02:40", agentName: "Review", said: NO_REPO_2 }),
    ])!;
    expect(only.othersBehind).toBe(0);
    expect(alsoBehindIt(only)).toBeNull();
  });

  it("counts walls, not bad turns", () => {
    /*
     * A group is two or more turns at ONE station making ONE claim. A single
     * failed turn somewhere else is not a wall, and counting it would turn this
     * clause into an anxiety meter.
     */
    const withOneOff = theBlockerItAlreadyNamed([
      turn({ at: "02:30", agentName: "Engineer", said: NO_REPO_1 }),
      turn({ at: "02:40", agentName: "Review", said: NO_REPO_2 }),
      turn({
        at: "03:00",
        station: "ship",
        agentName: "Release",
        said: "The push timed out once.",
      }),
    ])!;
    expect(withOneOff.othersBehind).toBe(0);
  });

  it("and pluralises past one", () => {
    const three = theBlockerItAlreadyNamed([
      turn({ at: "01:00", station: "build", agentName: "Engineer", said: NO_REPO_1 }),
      turn({ at: "01:10", station: "build", agentName: "Review", said: NO_REPO_2 }),
      turn({
        at: "02:00",
        station: "ship",
        agentName: "Release",
        said: "No deployment target is configured.",
      }),
      turn({
        at: "02:10",
        station: "ship",
        agentName: "Release",
        said: "No deployment target is configured.",
      }),
      turn({
        at: "03:00",
        station: "design",
        agentName: "Design",
        outcome: "stopped",
        said: NO_CREDIT,
        haltedReason: "out_of_credit",
      }),
      turn({
        at: "03:10",
        station: "design",
        agentName: "Design",
        outcome: "stopped",
        said: NO_CREDIT,
        haltedReason: "out_of_credit",
      }),
    ])!;
    expect(alsoBehindIt(three)).toBe("It hit 2 more walls after this one.");
  });

  it("and stops counting a wall the account has since fixed", () => {
    /*
     * ── THE DEFECT, READ LIVE ON `6cc7a010`, 2026-09-10 ────────────────────
     * The card said "It hit one more wall after this one" and the wall it was
     * counting was the credit halt. The account had been topped up on 09-09
     * and held 5,240 credits. The wall SHOWN -- Build's repository refusal --
     * was still real (`connection_bindings` = 0); the one COUNTED was not.
     *
     * So the card was promising a person a second obstruction that no longer
     * existed, and the only reason its door was right is that the repository
     * happened to be the wall that persisted.
     */
    const b = theBlockerItAlreadyNamed(RUN)!;
    expect(b.othersBehind).toBe(1);
    expect(alsoBehindIt(b, { kind: "out_of_credit", at: "03:40", now: "gone" })).toBeNull();
  });

  it("but only on `gone`, and never on a wall it could not check", () => {
    /*
     * `standing` and `unknown` both COUNT, which is the safe direction. What
     * this removes is a card promising an obstruction that is not there; what
     * it must never introduce is a card hiding one that is. A failed wallet
     * read arrives as `unknown` and has to read like "we did not look".
     */
    const b = theBlockerItAlreadyNamed(RUN)!;
    const said = "It hit one more wall after this one.";
    expect(alsoBehindIt(b, { kind: "out_of_credit", at: "03:40", now: "standing" })).toBe(said);
    expect(alsoBehindIt(b, { kind: "out_of_credit", at: "03:40", now: "unknown" })).toBe(said);
    /* No wall passed at all is the same answer, so a caller that has not been
       taught the argument keeps the behaviour it had. */
    expect(alsoBehindIt(b)).toBe(said);
    expect(alsoBehindIt(b, null)).toBe(said);
  });

  it("and a lifted wall of ANOTHER kind cannot answer for this one", () => {
    /*
     * The condition that keeps a track holding two walls honest: a credit halt
     * that lifted says nothing about a repository refusal that did not.
     * Measured 2026-09-10, all 34 slug halts in the product are
     * `out_of_credit` across six tracks, one kind each -- so nothing exercises
     * this today. It is written because the column is open text, and the day it
     * holds a second slug is not a day anybody will re-derive the rule.
     */
    const b = theBlockerItAlreadyNamed(RUN)!;
    expect(alsoBehindIt(b, { kind: "tools_refused", at: "03:40", now: "gone" })).toBe(
      "It hit one more wall after this one.",
    );
  });

  it("counts GROUPS, so the kinds run parallel to the count", () => {
    /*
     * `othersBehind` counts groups, so anything subtracted from it must count
     * groups too. A deduped list would subtract one of two same-kind walls and
     * leave the card claiming one that is gone -- so the two fields are pinned
     * to the same length here rather than trusted to stay in step.
     */
    const b = theBlockerItAlreadyNamed(RUN)!;
    expect(b.othersBehindKinds.length).toBe(b.othersBehind);
    expect(b.othersBehindKinds).toEqual(["out_of_credit"]);
  });

  it("and a group the platform never named stays counted", () => {
    /*
     * An agent REFUSAL has no slug: the agent ran and reported, so the platform
     * recorded nothing. A wall this cannot name is a wall whose standing it
     * must not claim to know, so it is null and it still counts.
     */
    const b = theBlockerItAlreadyNamed([
      turn({ at: "02:30", agentName: "Engineer", said: NO_REPO_1 }),
      turn({ at: "02:31", agentName: "Review", said: NO_REPO_2 }),
      turn({ at: "03:00", station: "design", agentName: "Design", said: "Something else failed." }),
      turn({ at: "03:01", station: "design", agentName: "Design", said: "Something else failed." }),
    ])!;
    expect(b.othersBehindKinds).toEqual([null]);
    expect(alsoBehindIt(b, { kind: "out_of_credit", at: "03:40", now: "gone" })).toBe(
      "It hit one more wall after this one.",
    );
  });

  it("names none of them, and diagnoses nothing", () => {
    /*
     * A COUNT, NOT A LIST. Naming the second wall doubles the card and reopens
     * the ranking argument rules 1 and 2 exist to settle. Saying one is there
     * costs a clause and removes the surprise, which is the whole of what went
     * wrong for the reader who hit it.
     */
    const line = alsoBehindIt(theBlockerItAlreadyNamed(RUN)!)!;
    expect(line).not.toMatch(/credit|repository|design|build|because|first|fix/i);
  });
});
