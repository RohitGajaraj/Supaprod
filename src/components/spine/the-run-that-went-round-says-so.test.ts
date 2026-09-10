/**
 * THE DETECTOR HAS TO READ WHAT `transcriptSections` ACTUALLY PRODUCES.
 *
 * `the-run-went-round.test.ts` proves the rule against station sequences I
 * typed. That is the half that can be right about the wrong object: the run
 * screen does not hand it a sequence, it hands it
 * `sections.map((s) => s.station)`, and the section boundaries are decided by
 * `transcript-sections.ts` from move rows, turn rows and handoffs -- which
 * means a change to the seam rule there silently changes what the lead above
 * the column says here, with nothing to notice.
 *
 * So this file starts from ACTIVITY ROWS, in the shape and order the run
 * screen builds them, and asserts the sentence a person reads.
 *
 * The fixture is `6cc7a010-18e5-4e13-ad82-8d8d06687119` -- "Let a homeowner
 * reschedule an installer visit from the order page" -- whose legs read, on
 * production:
 *
 *   sense > decide > define > design > build
 *                  > define > design > build
 *                  > define > design > build
 *
 * Three other tracks carry the identical shape. All four are `given-up`, all
 * four end every lap on *"No repository is connected for this workspace."*
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ActivityRow } from "@/components/spine/activity-rows";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import type { Turn } from "@/lib/spine/activity";
import { transcriptSections } from "./transcript-sections";
import {
  lapOf,
  lapsThatFiledNothingNew,
  nothingNewLine,
  roundLead,
  roundSeam,
  theRunWentRound,
} from "./the-run-went-round";

let clock = 1_757_000_000_000;

const turn = (
  station: AgentStation,
  agentName: string,
  made: Turn["made"] = [],
  said: string | null = null,
): ActivityRow => {
  clock += 60_000;
  const at = clock;
  return {
    kind: "turn",
    at,
    key: `turn:${at}`,
    turn: {
      runId: `r${at}`,
      agentSlug: agentName.toLowerCase(),
      agentName,
      station,
      stationName: AGENT_STATIONS[station]?.name ?? station,
      at: new Date(at).toISOString(),
      outcome: "done",
      made,
      said,
      tookMs: 30_000,
      tokens: 4_000,
      stopLine: null,
      failureKind: null,
      toolCalls: 0,
      toolFailures: 0,
      traceId: null,
    } as unknown as Turn,
  } as ActivityRow;
};

const proto = (id: string) => [{ kind: "prototype", word: "prototype", id }];
const task = (id: string) => [{ kind: "task", word: "task", id }];

/** The run, as the column builds it: oldest first. */
function theStuckRun(): ActivityRow[] {
  return [
    turn("sense", "Watch", [], "No customer evidence was found."),
    turn("decide", "Prioritize", [{ kind: "decision", word: "decision", id: "dec-1" }]),
    // Lap 1
    turn("define", "Draft", task("task-button")),
    turn("design", "Design", proto("proto-161e")),
    turn("build", "Engineer", [], "No repository is connected for this workspace."),
    // Lap 2
    turn("define", "Draft", task("task-tickets")),
    turn("design", "Design", proto("proto-aa88")),
    turn("build", "Engineer", [], "No repository is connected for this workspace."),
    // Lap 3
    turn("define", "Plan", task("task-button-again")),
    turn("design", "Design", proto("proto-96b4")),
    turn("build", "Engineer", [], "No repository is connected for this workspace."),
  ];
}

/** The chain query's book: artifact id to the title it was filed under. */
const TITLES = new Map<string, string>([
  ["dec-1", "Reschedule installer visit from order page"],
  ["task-button", "Add 'Reschedule' button to order page UI"],
  ["task-tickets", "Instrument analytics to track rescheduling-related support tickets"],
  // Lap 3 re-filed lap 1's task under a new row id and the same title.
  ["task-button-again", "Add 'Reschedule' button to order page UI"],
  ["proto-161e", "Reschedule installer visit from order page"],
  ["proto-aa88", "Reschedule installer visit from order page"],
  ["proto-96b4", "Reschedule installer visit from order page"],
]);

const stationsOf = (rows: ActivityRow[]) => transcriptSections(rows).map((s) => s.station);

const filingsPerLap = (rows: ActivityRow[]) => {
  const sections = transcriptSections(rows);
  const round = theRunWentRound(sections.map((s) => s.station))!;
  return round.lapStarts.map((start) =>
    Array.from({ length: round.cycle.length }, (_, k) => sections[start + k]!).flatMap((s) =>
      s.rows.flatMap((r) =>
        r.kind === "turn"
          ? r.turn.made.map((m) => ({ kind: m.kind, title: TITLES.get(m.id) ?? "" }))
          : [],
      ),
    ),
  );
};

describe("the stuck run, end to end from activity rows", () => {
  it("cuts into eleven sections, which is why the circle was invisible", () => {
    const sections = transcriptSections(theStuckRun());
    expect(sections).toHaveLength(11);
    expect(sections.map((s) => s.name)).toEqual([
      "Discover",
      "Decide",
      "Plan",
      "Design",
      "Build",
      "Plan",
      "Design",
      "Build",
      "Plan",
      "Design",
      "Build",
    ]);
  });

  it("reads the circle off those sections", () => {
    const round = theRunWentRound(stationsOf(theStuckRun()))!;
    expect(round.laps).toBe(3);
    expect(round.cycle).toEqual(["define", "design", "build"]);
    expect(round.lapStarts).toEqual([2, 5, 8]);
  });

  it("says the one sentence the screen was missing", () => {
    const round = theRunWentRound(stationsOf(theStuckRun()))!;
    expect(roundLead(round, (s) => AGENT_STATIONS[s]?.name ?? s)).toBe(
      "Three times round Plan, Design and Build.",
    );
  });

  it("says the last lap re-filed what was already on the record", () => {
    const round = theRunWentRound(stationsOf(theStuckRun()))!;
    const repeats = lapsThatFiledNothingNew(filingsPerLap(theStuckRun()));
    expect(repeats).toEqual([3]);
    expect(nothingNewLine(round, repeats)).toBe(
      "The last lap filed nothing that was not already on the record.",
    );
  });

  it("puts a seam on the first section of each lap and nowhere else", () => {
    const rows = theStuckRun();
    const round = theRunWentRound(stationsOf(rows))!;
    const seams = transcriptSections(rows).map((_s, si) => {
      const lap = lapOf(round, si);
      return lap !== null && si === round.lapStarts[lap - 1] ? roundSeam(lap) : null;
    });
    expect(seams).toEqual([
      null,
      null,
      "First time round",
      null,
      null,
      "Second time round",
      null,
      null,
      "Third time round",
      null,
      null,
    ]);
  });
});

describe("the guard fails on the thing it exists to catch", () => {
  /*
   * A guard that has only ever passed is not yet a guard. Two proofs by
   * failure, both on the same pipeline: take the circle out and the sentence
   * has to disappear, and take the REPEAT out and the second sentence has to.
   */
  it("says nothing at all about a run that walked the route once", () => {
    clock = 1_757_000_000_000;
    const straight = [
      turn("sense", "Watch"),
      turn("decide", "Prioritize"),
      turn("define", "Draft", task("task-button")),
      turn("design", "Design", proto("proto-161e")),
      turn("build", "Engineer"),
      turn("ship", "Release"),
      turn("learn", "Analyse"),
    ];
    expect(theRunWentRound(stationsOf(straight))).toBeNull();
  });

  it("stays silent on the second sentence when every lap filed something new", () => {
    clock = 1_757_000_000_000;
    const productive = [
      turn("define", "Draft", task("task-button")),
      turn("design", "Design", proto("proto-161e")),
      turn("define", "Draft", task("task-tickets")),
      turn("design", "Design", proto("proto-aa88")),
    ];
    const round = theRunWentRound(stationsOf(productive))!;
    expect(round.laps).toBe(2);
    // proto-161e and proto-aa88 carry the SAME title, so the drawing repeats;
    // the task does not, so the lap is not one that filed nothing new.
    const repeats = lapsThatFiledNothingNew(filingsPerLap(productive));
    expect(repeats).toEqual([]);
    expect(nothingNewLine(round, repeats)).toBeNull();
  });

  it("is actually wired into the column, pinned as source text", () => {
    /*
     * `TrackActivity` opens two server functions through `useServerFn`, so a
     * full render means mocking the whole read layer, and this folder already
     * ruled against that once: *"a guard whose scaffolding is bigger than its
     * subject is a guard nobody maintains"*
     * (`a-transcript-row-leads-with-one-sentence.test.tsx`). Same discipline
     * here. The pure rule is proved above; this pins that the run screen
     * CALLS it, because a correct rule reached by nothing is what the last
     * two sessions in this repo kept finding.
     */
    const src = readFileSync(
      fileURLToPath(new URL("./TrackActivity.tsx", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("theRunWentRound(sections.map((s) => s.station))");
    expect(src).toContain("roundLead(round,");
    expect(src).toContain("roundSeam(seam)");
    // Both draws are conditional. A lead printed on every run distinguishes
    // nothing, which is the defect this whole file is downstream of.
    expect(src).toContain("{round ? (");
    expect(src).toContain("{seam !== null ? (");
    // And the second sentence never draws without the first.
    expect(src).toContain('{roundRepeat ? <p className="mrd-meta">{roundRepeat}</p> : null}');
  });

  it("refuses the second sentence when a title has not loaded yet", () => {
    /*
     * The titles come off a SEPARATE poll. Before it lands every artifact
     * compares as the empty string and every lap after the first reads as a
     * lap that filed nothing new -- the most damning sentence on the screen,
     * asserted from an absence of data. The caller suppresses on one unknown;
     * this proves the input that would otherwise produce the false claim.
     */
    const withNoTitles = [[{ kind: "prototype", title: "" }], [{ kind: "prototype", title: "" }]];
    expect(lapsThatFiledNothingNew(withNoTitles)).toEqual([2]);
  });
});
