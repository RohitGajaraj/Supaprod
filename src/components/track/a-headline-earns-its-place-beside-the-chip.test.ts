/**
 * A HEADLINE EARNS ITS PLACE BY SAYING SOMETHING THE CHIP CANNOT.
 *
 * `RunNow` draws the chip and the headline on ONE LINE. So a headline that
 * opens with the chip's own word is that word twice, a few pixels apart, and
 * the reader's eye has spent a fixation confirming what it already read.
 *
 *     [Stopped]  Stopped at Build.
 *     [Reading]  Reading this run.
 *     [Ready]    Ready when you are.
 *     [Abandoned] This run was abandoned.
 *
 * Five of the twelve registers did some version of it. The first was found on
 * the founder's screenshot; S1 ruled on the rest with the file open, dropping
 * three headlines and keeping one.
 *
 * ── WHY THIS IS A CENSUS AND NOT FOUR ASSERTIONS ────────────────────────────
 * Pinning the four strings pins today's copy and catches nothing tomorrow. What
 * must hold is the RULE, over every register the function can reach, so the
 * thirteenth register is scored the day it is written by whoever writes it.
 *
 * It scores the chip's word against the headline's opening, because that is
 * where a restatement lands: "Stopped at Build" restates and "Build will not be
 * tried again without you" does not, though both are about a stopped run.
 */
import { describe, expect, it } from "bun:test";

import { runNow, type NowInput, type NowRegister, type NowTrack } from "./run-now";

const track = (over: Partial<NowTrack> = {}): NowTrack => ({
  status: "open",
  station: "build",
  hold: null,
  holdReason: null,
  holdBecause: null,
  drivenAt: "2026-09-04T10:00:00Z",
  deferredUntil: null,
  attempts: 0,
  route: { path: ["sense", "decide", "define", "design", "build", "ship", "learn"] },
  ...over,
});

const input = (over: Partial<NowInput> = {}): NowInput => ({
  track: track(),
  loading: false,
  feedDead: false,
  live: false,
  currentTool: null,
  seats: [],
  legsLeft: null,
  horizon: null,
  gradableBySource: null,
  shippedAt: null,
  verdict: null,
  nowMs: Date.parse("2026-09-08T10:00:00Z"),
  ...over,
});

/** One input per register, so the census covers the whole vocabulary. */
const REACHED: { register: NowRegister; input: NowInput }[] = [
  { register: "unread", input: input({ feedDead: true }) },
  { register: "reading", input: input({ loading: true }) },
  { register: "finished", input: input({ track: track({ status: "done" }) }) },
  {
    register: "abandoned",
    input: input({ track: track({ status: "abandoned", hold: "The founder closed it out." }) }),
  },
  {
    register: "paused",
    input: input({ track: track({ holdReason: "paused", holdBecause: "Stopped by you." }) }),
  },
  {
    register: "working",
    input: input({
      live: true,
      seats: [{ name: "Studio", waiting: false }],
      currentTool: "repo.read",
      legsLeft: 3,
    }),
  },
  {
    register: "stopped",
    input: input({ track: track({ holdReason: "given-up", hold: "It gave up." }) }),
  },
  {
    register: "held",
    input: input({
      track: track({
        holdReason: "waiting-on-another-run",
        hold: "Design is waiting on another run that holds the same file.",
        attempts: 1,
      }),
    }),
  },
  {
    register: "you",
    /* `waiting-on-a-person` is in `HOLD_NEEDS_PERSON` and is not one of the
       reasons `nothingIsComing` covers, so it lands on the "Needs you" branch
       rather than the stopped one above it. */
    input: input({
      track: track({ holdReason: "waiting-on-a-person", hold: "A call is waiting." }),
    }),
  },
  {
    register: "ready",
    input: input({ track: track({ station: "sense", drivenAt: null }) }),
  },
  {
    /* A calendar wait, which is `needs-evidence` at Learn with a horizon still
       ahead and nothing saying no source can grade it. */
    register: "scheduled",
    input: input({
      track: track({ station: "learn", holdReason: "needs-evidence" }),
      horizon: "2026-10-03T00:00:00Z",
      shippedAt: "2026-09-01T10:00:00Z",
    }),
  },
  { register: "between", input: input() },
];

/**
 * The one register whose headline repeats its chip ON PURPOSE, with S1's ruling
 * for why, so a future reader meets the reason rather than the exception.
 *
 * "Stopped" and "You stopped this" differ in AGENCY, not in wording. The chip
 * says the state; the headline says whose act it was, and that difference
 * decides whether a person believes they stopped the run or the loop gave up on
 * it. It is the you-versus-agent distinction the whole colour system is built
 * on, and it appears here in prose because the hue cannot carry it: the
 * register is `status: "hold"`, which is correct -- somebody who deliberately
 * stopped a run is not being waited on -- so the sentence is doing the work of
 * explaining why the card is not amber.
 *
 * A list of one. If it grows, each entry brings its own paragraph or it is not
 * an exception, it is the rule eroding.
 */
const AGENCY_NOT_WORDING: NowRegister[] = ["paused"];

const STOP = new Set(["a", "an", "the", "this", "that", "it", "its", "is", "was", "you", "your"]);
const opening = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .slice(0, 2);

/** "Stopped" against "stopped", "Reading" against "reading". */
const stem = (w: string) => w.toLowerCase().replace(/(ing|ed|s)$/, "");

describe("the census reaches every register", () => {
  it("produces the register it claims to", () => {
    for (const c of REACHED) expect(runNow(c.input).register).toBe(c.register);
  });

  it("and covers all twelve, so a new one cannot be added unscored", () => {
    // The mirror. Without it a register could be added, never reached, and the
    // property below would report green on eleven twelfths of the vocabulary.
    expect(new Set(REACHED.map((c) => c.register)).size).toBe(12);
  });
});

describe("THE PROPERTY: no headline opens with its own chip word", () => {
  it.each(REACHED.map((c) => [c.register, c.input] as const))("%s", (register, given) => {
    const now = runNow(given);
    if (now.headline === null) return; // The chip alone, which is the other legal answer.
    if (AGENCY_NOT_WORDING.includes(register)) return;

    const chip = stem(now.word.split(/\s+/)[0] ?? "");
    const opens = opening(now.headline).map(stem);
    expect(
      opens.includes(chip) ? [now.word, now.headline] : [],
      [
        `The chip says "${now.word}" and the headline opens with it:`,
        "",
        `  [${now.word}]  ${now.headline}`,
        "",
        "These render on ONE LINE, so that is the same word twice a few pixels",
        "apart. Either the headline says something the chip cannot -- where it",
        "starts, why it stopped, whose act it was -- or it is null and the chip",
        "stands alone, which is the calm answer and not a hole.",
      ].join("\n"),
    ).toEqual([]);
  });
});

describe("and dropping a headline never drops the fact under it", () => {
  /*
   * The complement, and the half that is easy to lose: S1 and I have already
   * fixed one line from opposite sides and left a person with neither. A
   * register that gives up its headline must still be saying its fact
   * somewhere, or the trim made the card quieter and emptier at once.
   */
  it("abandoned puts the reason in the slot the headline vacated", () => {
    const now = runNow(
      input({ track: track({ status: "abandoned", hold: "The founder closed it out." }) }),
    );
    expect(now.headline).toBe("The founder closed it out.");
  });

  it("and says only the chip when the record wrote no reason", () => {
    const now = runNow(input({ track: track({ status: "abandoned", hold: null }) }));
    expect(now.word).toBe("Abandoned");
    expect(now.headline).toBeNull();
    expect(now.line).toBeNull();
  });

  it("ready keeps where it starts and that it asks first", () => {
    const now = runNow(input({ track: track({ station: "sense", drivenAt: null }) }));
    expect(now.headline).toContain("asks before anything ships");
    // "Discover", not "Sense": the display name comes from the one vocabulary
    // the product uses, and it is not the station key.
    expect(now.headline).toContain("Discover");
  });

  it("reading says nothing beyond the chip, because there is nothing yet to say", () => {
    const now = runNow(input({ loading: true }));
    expect(now.headline).toBeNull();
    expect(now.line).toBeNull();
  });
});
