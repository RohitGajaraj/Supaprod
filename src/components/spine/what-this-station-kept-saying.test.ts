/**
 * THE SECTION SAYS IT ONCE, AND THE ROWS KEEP EVERYTHING ELSE.
 *
 * The row fold only reaches CONSECUTIVE turns, and Build's section on
 * `6cc7a010` is not consecutive: turn, turn, handoff, handoff, turn, check,
 * turn, turn, turn. Nine items, and with a floor of three only the last three
 * fold. Six paragraphs saying "No repository is connected" stayed on the page.
 *
 * The fold must not reach across the handoffs -- S1 read the served build and
 * they are the only rows in that section a person learns anything new from,
 * agents asking each other for market research while Build cannot start.
 * Burying them mid-fold would be the worst available outcome.
 *
 * So counting rows was the mistake. Nine rows is fine; nine paragraphs saying
 * one thing is the dump, consecutive or not.
 */
import { describe, expect, it } from "bun:test";

import {
  whatThisStationKeptSaying,
  saidTheSameThing,
  sameClaim,
  stationRefrainLead,
  MIN_SECTION_TURNS,
  type SayingRow,
} from "./what-this-station-kept-saying";

const NO_REPO_1 =
  "No repository is connected for this workspace. I cannot proceed with implementing the reschedule functionality without access to the codebase. Please bind a repository on Connectors so I can continue with the implementation.";
const NO_REPO_2 =
  "No repository is connected for this workspace. Repository connectivity is required before any code inspection or modification can proceed. This is a hard stop, I cannot build the rescheduling feature without access to the codebase.";
const NO_REPO_3 =
  "No repository is connected for this workspace. Binding a repository is required before any code changes, file operations, or builds can proceed. Please bind a repository on Connectors and retry.";

const row = (over: Partial<SayingRow> & { runId: string }): SayingRow => ({
  agentName: "Engineer",
  said: null,
  made: [],
  outcome: "partly",
  ...over,
});

/** Build's six turns, in the order and with the seats the record holds. */
const BUILD: SayingRow[] = [
  row({ runId: "1", agentName: "Engineer", said: NO_REPO_1 }),
  row({ runId: "2", agentName: "Review", said: NO_REPO_2 }),
  row({ runId: "3", agentName: "Engineer", said: NO_REPO_2 }),
  row({ runId: "4", agentName: "Review", said: NO_REPO_1 }),
  row({ runId: "5", agentName: "Engineer", said: NO_REPO_2 }),
  row({ runId: "6", agentName: "Review", said: NO_REPO_3 }),
];

describe("what the station kept saying", () => {
  it("finds the claim all six made, whatever sat between them", () => {
    const r = whatThisStationKeptSaying(BUILD)!;
    expect(r.turns).toBe(6);
    expect(r.seats).toEqual(["Engineer", "Review"]);
  });

  it("quotes the LAST telling, so it matches every other surface", () => {
    // The fold row and the blocker card quote the same group, and a page that
    // quotes one event two ways is worse than either way alone.
    expect(whatThisStationKeptSaying(BUILD)!.said).toBe(NO_REPO_3);
  });

  it("covers every row it speaks for, so their prose clamps to one line", () => {
    const r = whatThisStationKeptSaying(BUILD)!;
    for (const b of BUILD) expect(saidTheSameThing(r, b.runId)).toBe(true);
  });
});

describe("a turn that said something else", () => {
  /*
   * A station where five of six hit one wall is still a station repeating
   * itself, so requiring unanimity would put all six paragraphs back. What
   * matters is what happens to the sixth.
   */
  const UNRELATED = "The test suite timed out after ninety seconds on the payments module.";
  const WITH_AN_ODD_ONE: SayingRow[] = [
    ...BUILD.slice(0, 5),
    row({ runId: "6", agentName: "Review", said: UNRELATED }),
  ];

  it("is left out of the group when it is genuinely unrelated", () => {
    const r = whatThisStationKeptSaying(WITH_AN_ODD_ONE)!;
    expect(r.turns).toBe(5);
    expect(saidTheSameThing(r, "6")).toBe(false);
  });

  it("and the lead sends a reader looking for it", () => {
    expect(stationRefrainLead(whatThisStationKeptSaying(WITH_AN_ODD_ONE)!, 6)).toBe(
      "5 of 6 said this:",
    );
  });

  it("but a NEAR-MISS joins the group, and that is the design rather than a bug", () => {
    /*
     * "The repository connected to this workspace contains no source files"
     * scores 1.000 by containment against "no repository is connected for this
     * workspace" -- it is a longer sentence about the same subject, and
     * `containment` divides by the smaller set. Jaccard scores it 0.500, which
     * is exactly where Discover's genuine pair also lands. **No threshold on
     * either measure separates them.**
     *
     * So it groups, and the cost of that is bounded on purpose: the sixth row
     * CLAMPS to one line instead of losing its words, and its first line is the
     * sentence that differs, so a reader scanning six clamped lines sees the
     * odd one rather than being told it was not there.
     */
    const NEAR = "The repository connected to this workspace contains no source files.";
    const r = whatThisStationKeptSaying([
      ...BUILD.slice(0, 5),
      row({ runId: "6", agentName: "Review", said: NEAR }),
    ])!;
    expect(r.turns).toBe(6);
    expect(saidTheSameThing(r, "6")).toBe(true);
  });

  it("NOTHING here decides that a row's words are safe to remove", () => {
    // The API cannot be used the other way: it takes no sentence, so it cannot
    // compare one, so it cannot be asked a question no measure here can answer.
    expect(saidTheSameThing.length).toBe(2);
  });
});

describe("the lead says the one thing the header cannot", () => {
  /*
   * The header names the station and the meta names the seats and counts the
   * turns. The first draft of this lead read "${seats} said this ${n} times",
   * and on the measured run Design's seat is CALLED Design, under a header
   * reading "Design" and a meta reading "Design · 12 turns · 7.3s".
   */
  it("does not name the station or the seats", () => {
    const lead = stationRefrainLead(whatThisStationKeptSaying(BUILD)!, 6);
    expect(lead).toBe("All 6 said this:");
    expect(lead).not.toContain("Engineer");
    expect(lead).not.toContain("Review");
  });
});

describe("and it stays silent where there is nothing to say", () => {
  it("under three turns", () => {
    expect(whatThisStationKeptSaying(BUILD.slice(0, 2))).toBeNull();
    expect(MIN_SECTION_TURNS).toBe(3);
  });

  it("on a station where every turn said something different", () => {
    expect(
      whatThisStationKeptSaying([
        row({ runId: "1", said: NO_REPO_1 }),
        row({ runId: "2", said: "The test suite timed out after ninety seconds on payments." }),
        row({ runId: "3", said: "Two migrations are pending and one drops a column still read." }),
      ]),
    ).toBeNull();
  });

  it("on turns that FILED, whatever their prose says", () => {
    // The record's verdict beats the agent's account of itself: a station that
    // produced is not one repeating itself.
    const made = [{}];
    expect(whatThisStationKeptSaying(BUILD.map((b) => ({ ...b, made })))).toBeNull();
  });

  it("and on a station still working", () => {
    expect(
      whatThisStationKeptSaying(BUILD.map((b) => ({ ...b, outcome: "working" as const }))),
    ).toBeNull();
  });
});

describe("two surfaces quoting one event agree", () => {
  it("scores the claim, not the string", () => {
    // The card and the section header each quote a real turn and can pick
    // different ones, because the seats rephrase the wall every attempt. Two
    // sentences making one claim are one sentence for a reader.
    expect(sameClaim(NO_REPO_1, NO_REPO_3)).toBe(true);
    expect(sameClaim(NO_REPO_1, "The test suite timed out on payments.")).toBe(false);
    expect(sameClaim(null, NO_REPO_1)).toBe(false);
  });
});
