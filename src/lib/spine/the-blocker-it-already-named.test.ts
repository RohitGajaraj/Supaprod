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
    expect(lead).toBe("Engineer and Review could not start Build, 6 times.");
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
