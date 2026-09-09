/**
 * SIX TURNS ON ONE WALL ARE ONE EVENT, AND THE FOLD USED TO PRINT ALL SIX.
 *
 * The founder's words about this product: *"it reads as a dump of data and
 * content."* Read whole on `6cc7a010`, 2026-09-09, the transcript's Build
 * section was that sentence in miniature -- six turns across forty minutes, each
 * with a full paragraph, all of them saying one thing:
 *
 *   02:30  Filed nothing. Engineer, 8.6s.   "No repository is connected..."
 *   02:30  Filed nothing. Review, 6.0s.     "No repository is connected..."
 *   02:40  Filed nothing. Engineer, 6.9s.   "No repository is connected..."
 *   03:00  Filed nothing. Review, 6.5s.     "No repository is connected..."
 *   03:10  Filed nothing. Engineer, 7.6s.   "No repository is connected..."
 *   03:10  Filed nothing. Review, 5.9s.     "No repository is connected..."
 *
 * `foldRepeats` existed and folded none of them, because its identity was the
 * exact string `agentName + station + outcome + stopLine + said` and this run
 * breaks it twice: the seat ALTERNATES between the station's two agents, and a
 * model rewrites its sentence slightly every turn.
 *
 * **So the fold worked on rows a cron produced and failed on rows an agent
 * produced** -- backwards, because an agent repeating itself is the case a
 * person needs folded and a model never repeats itself byte for byte.
 *
 * The fixture is the real `output` column, truncated where the real one is long.
 */
import { describe, expect, it } from "bun:test";

import type { ActivityRow } from "@/components/spine/activity-rows";
import type { Turn } from "@/lib/spine/activity";
import { foldRepeats } from "./transcript-sections";
import { foldedLines } from "./TrackActivity";

const NO_REPO_1 =
  "No repository is connected for this workspace. I cannot proceed with implementing the reschedule functionality without access to the codebase. Please bind a repository on Connectors so I can continue with the implementation.";
const NO_REPO_2 =
  "No repository is connected for this workspace. Repository connectivity is required before any code inspection or modification can proceed. This is a hard stop, I cannot build the rescheduling feature without access to the codebase. Please bind a repository on Connectors first.";
const NO_REPO_3 =
  "No repository is connected for this workspace. Binding a repository is required before any code changes, file operations, or builds can proceed. Please bind a repository on Connectors and retry.";

const turn = (over: {
  at: number;
  station?: Turn["station"];
  agentName?: string;
  outcome?: Turn["outcome"];
  said?: string | null;
  stopLine?: string | null;
  made?: Turn["made"];
}): ActivityRow => ({
  kind: "turn",
  at: over.at,
  key: `turn:${over.at}`,
  turn: {
    runId: `r${over.at}`,
    agentSlug: (over.agentName ?? "Engineer").toLowerCase(),
    agentName: over.agentName ?? "Engineer",
    station: over.station ?? "build",
    stationName: over.station ?? "build",
    at: new Date(over.at).toISOString(),
    outcome: over.outcome ?? "partly",
    made: over.made ?? [],
    said: over.said ?? null,
    stopLine: over.stopLine ?? null,
    tookMs: 8600,
    tokens: null,
    traceId: null,
  } as Turn,
});

/** Build's six, in the order and with the seats the database holds. */
const BUILD = [
  turn({ at: 1, agentName: "Engineer", said: NO_REPO_1 }),
  turn({ at: 2, agentName: "Review", said: NO_REPO_2 }),
  turn({ at: 3, agentName: "Engineer", said: NO_REPO_2 }),
  turn({ at: 4, agentName: "Review", said: NO_REPO_1 }),
  turn({ at: 5, agentName: "Engineer", said: NO_REPO_2 }),
  turn({ at: 6, agentName: "Review", said: NO_REPO_3 }),
];

describe("the dump the fold was walking past", () => {
  it("folds all six into one event", () => {
    const items = foldRepeats(BUILD);
    expect(items).toHaveLength(1);
    expect(items[0]!.kind).toBe("repeat");
  });

  it("names both seats, in the order they first took a turn", () => {
    const item = foldRepeats(BUILD)[0]!;
    if (item.kind !== "repeat") throw new Error("not folded");
    // The seat left the identity and became something the entry REPORTS. One
    // station that cannot get past one wall is one event whether its two agents
    // take turns at it or not.
    expect(item.seats).toEqual(["Engineer", "Review"]);
    expect(item.count).toBe(6);
    expect(item.firstAt).toBe(1);
    expect(item.lastAt).toBe(6);
  });

  it("keeps the FIRST telling, not the last", () => {
    const item = foldRepeats(BUILD)[0]!;
    if (item.kind !== "repeat") throw new Error("not folded");
    // Every later turn is the same seat re-reporting the same wall; the first
    // is the one written before any of the re-trying coloured it.
    expect(item.row.kind === "turn" && item.row.turn.said).toBe(NO_REPO_1);
  });
});

describe("and it still refuses the folds it always refused", () => {
  it("does not fold turns that said unrelated things", () => {
    const items = foldRepeats([
      turn({ at: 1, said: NO_REPO_1 }),
      turn({
        at: 2,
        said: "The test suite timed out after ninety seconds on the payments module.",
      }),
      turn({
        at: 3,
        said: "Two migrations are pending and one of them drops a column still read.",
      }),
    ]);
    expect(items).toHaveLength(3);
  });

  it("does not fold across stations", () => {
    // Build's wall and Ship's wall are two events, however alike the sentences.
    const items = foldRepeats([
      turn({ at: 1, station: "build", said: NO_REPO_1 }),
      turn({ at: 2, station: "build", said: NO_REPO_2 }),
      turn({ at: 3, station: "ship", said: NO_REPO_1 }),
      turn({ at: 4, station: "ship", said: NO_REPO_2 }),
    ]);
    expect(items).toHaveLength(4);
  });

  it("does not fold a turn that filed something", () => {
    const made = [{ kind: "prd", word: "spec", id: "a" }];
    const items = foldRepeats([
      turn({ at: 1, said: NO_REPO_1 }),
      turn({ at: 2, said: NO_REPO_2, made }),
      turn({ at: 3, said: NO_REPO_2 }),
    ]);
    expect(items).toHaveLength(3);
  });

  it("does not fold a silent turn into a speaking one", () => {
    /*
     * They are not the same event, and letting a silent sweep tick swallow the
     * one turn that said WHY would take the answer off the screen -- which is
     * the defect this whole file exists to undo, arriving by the other door.
     */
    const items = foldRepeats([
      turn({ at: 1, outcome: "stopped", agentName: "Design", said: null }),
      turn({ at: 2, outcome: "stopped", agentName: "Design", said: null }),
      turn({ at: 3, outcome: "stopped", agentName: "Design", said: NO_REPO_1 }),
    ]);
    expect(items).toHaveLength(3);
  });

  it("still folds the silent sweep ticks it was written for", () => {
    const items = foldRepeats([
      turn({ at: 1, outcome: "stopped", agentName: "Design", station: "design" }),
      turn({ at: 2, outcome: "stopped", agentName: "Design", station: "design" }),
      turn({ at: 3, outcome: "stopped", agentName: "Design", station: "design" }),
      turn({ at: 4, outcome: "stopped", agentName: "Design", station: "design" }),
    ]);
    expect(items).toHaveLength(1);
  });

  it("and two is still two events", () => {
    expect(
      foldRepeats([turn({ at: 1, said: NO_REPO_1 }), turn({ at: 2, said: NO_REPO_2 })]),
    ).toHaveLength(2);
  });
});

describe("a claim cannot drift across a long run", () => {
  it("scores every turn against the first, never against the previous", () => {
    /*
     * Chained pairwise, A folds into B and B into C while A and C share nothing,
     * so a section could collapse into one row whose quote is about a different
     * subject than half the turns it stands for.
     */
    const items = foldRepeats([
      turn({ at: 1, said: "No repository is connected for this workspace." }),
      turn({ at: 2, said: "No repository is connected, so the migration cannot run." }),
      turn({ at: 3, said: "The migration cannot run because two columns disagree." }),
      turn({ at: 4, said: "Two columns disagree about what a settled gate means." }),
    ]);
    expect(items.length).toBeGreaterThan(1);
  });
});

/**
 * ── AND THIS IS THE SENTENCE A PERSON READS ─────────────────────────────────
 *
 * `foldedLines` is the whole of the folded row's text, so asserting it here is
 * asserting the surface rather than the shaping. It is the evidence a
 * screenshot would have been: the dev server runs without
 * `SUPABASE_SERVICE_ROLE_KEY` -- the founder holds no direct Supabase
 * credential, by design -- so no authenticated route renders locally, and the
 * deployed build is behind this change until a press.
 */
describe("what six rows became", () => {
  const BEFORE = [
    "Filed nothing. Engineer, 8.6s.",
    "Filed nothing. Review, 6.0s.",
    "Filed nothing. Engineer, 6.9s.",
    "Filed nothing. Review, 6.5s.",
    "Filed nothing. Engineer, 7.6s.",
    "Filed nothing. Review, 5.9s.",
  ];

  it("one lead and one meta, in place of six leads", () => {
    const item = foldRepeats(BUILD)[0]!;
    if (item.kind !== "repeat" || item.row.kind !== "turn") throw new Error("not folded");
    const { lead, meta } = foldedLines(item.row.turn, item.seats, item.count, "02:30", "03:11");
    expect(BEFORE).toHaveLength(6);
    expect(lead).toBe("Filed nothing.");
    expect(meta).toBe("Engineer and Review · 6 turns, 02:30 to 03:11");
  });

  it("the stopwatch goes, because six turns have six of them", () => {
    // Forty minutes on one wall is the fact. That the third attempt took 6.9
    // seconds is not, and it was the only duration the old row could show.
    const item = foldRepeats(BUILD)[0]!;
    if (item.kind !== "repeat" || item.row.kind !== "turn") throw new Error("not folded");
    const { lead } = foldedLines(item.row.turn, item.seats, item.count, "02:30", "03:11");
    expect(lead).not.toMatch(/8\.6s|6\.9s|s\.$/);
  });

  it("a single-seat fold keeps the shape it always had", () => {
    // Twelve sweep ticks at one station are still "Nothing was filed for this
    // step. Design, 0.6s." over "12 times, 09:10 to 11:00". Nothing about that
    // row was wrong, so nothing about it changes.
    const item = foldRepeats([
      turn({ at: 1, outcome: "stopped", agentName: "Design", station: "design" }),
      turn({ at: 2, outcome: "stopped", agentName: "Design", station: "design" }),
      turn({ at: 3, outcome: "stopped", agentName: "Design", station: "design" }),
    ])[0]!;
    if (item.kind !== "repeat" || item.row.kind !== "turn") throw new Error("not folded");
    const { lead, meta } = foldedLines(item.row.turn, item.seats, item.count, "09:10", "11:00");
    expect(lead).toContain("Design");
    expect(meta).toBe("3 times, 09:10 to 11:00");
  });
});
