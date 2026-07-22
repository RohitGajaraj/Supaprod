// drawWorkingLine rotation contract (design-language-spec 6.2, vocabulary
// research section 0): session-seeded no-repeat shuffle, full deck coverage
// before any repeat, no identical line across the reshuffle boundary, and
// the avoid list keeps two surfaces from showing the same line at once.

import { beforeEach, describe, expect, test } from "bun:test";
import {
  AGENT_SIGNATURE_LINES,
  AMBIENT_BRIDGE_LINES,
  STAGE_DECKS,
  drawBridgeLine,
  drawWorkingLine,
  resetWorkingLineCycles,
  workingDeckFor,
  workingSentence,
  type MissionStage,
} from "./mission-vocabulary";

const STAGES = Object.keys(STAGE_DECKS) as MissionStage[];

beforeEach(() => {
  resetWorkingLineCycles();
});

describe("the decks themselves", () => {
  test("every stage ships at least the eight-line minimum (twelve in practice)", () => {
    for (const stage of STAGES) {
      expect(STAGE_DECKS[stage].length).toBeGreaterThanOrEqual(8);
    }
  });

  test("no duplicate lines inside any stage deck", () => {
    for (const stage of STAGES) {
      expect(new Set(STAGE_DECKS[stage]).size).toBe(STAGE_DECKS[stage].length);
    }
  });

  test("deck lines are lowercase predicates: no leading capital, no terminal period", () => {
    const all = [
      ...STAGES.flatMap((s) => STAGE_DECKS[s]),
      ...Object.values(AGENT_SIGNATURE_LINES).flat(),
      ...AMBIENT_BRIDGE_LINES,
    ];
    for (const line of all) {
      expect(line[0]).toBe(line[0].toLowerCase());
      expect(line.endsWith(".")).toBe(false);
    }
  });
});

describe("workingDeckFor", () => {
  test("merges the stage deck with the agent's signature lines", () => {
    const deck = workingDeckFor("build", "builder");
    for (const line of STAGE_DECKS.build) expect(deck).toContain(line);
    for (const line of AGENT_SIGNATURE_LINES.builder) expect(deck).toContain(line);
  });

  test("an unknown slug draws the stage deck alone", () => {
    expect(workingDeckFor("sense", "totally-unknown")).toEqual([...STAGE_DECKS.sense]);
  });

  test("the conductor draws only its own deck at any stage", () => {
    for (const stage of STAGES) {
      expect(workingDeckFor(stage, "orchestrator")).toEqual([
        ...AGENT_SIGNATURE_LINES.orchestrator,
      ]);
    }
  });
});

describe("drawWorkingLine: the no-repeat window", () => {
  test("no line repeats until the whole deck has shown (full coverage)", () => {
    const deck = workingDeckFor("build", "builder");
    const drawn = Array.from({ length: deck.length }, () =>
      drawWorkingLine("build", "builder", "seed-a"),
    );
    // Every draw unique within the window, and the window covers the deck.
    expect(new Set(drawn).size).toBe(deck.length);
    expect(drawn.slice().sort()).toEqual(deck.slice().sort());
  });

  test("coverage holds for every stage with no agent given", () => {
    for (const stage of STAGES) {
      const deck = STAGE_DECKS[stage];
      const drawn = Array.from({ length: deck.length }, () =>
        drawWorkingLine(stage, null, "seed-b"),
      );
      expect(new Set(drawn).size).toBe(deck.length);
    }
  });

  test("never the same line twice in a row across the reshuffle boundary", () => {
    const deck = workingDeckFor("decide", "critic");
    // Walk several full cycles and check every adjacent pair.
    const rounds = 4;
    const drawn = Array.from({ length: deck.length * rounds }, () =>
      drawWorkingLine("decide", "critic", "seed-c"),
    );
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i]).not.toBe(drawn[i - 1]);
    }
  });

  test("the same seed replays the same order; a different seed shuffles differently", () => {
    const first = Array.from({ length: 6 }, () => drawWorkingLine("ship", "release", "stable"));
    resetWorkingLineCycles();
    const replay = Array.from({ length: 6 }, () => drawWorkingLine("ship", "release", "stable"));
    expect(replay).toEqual(first);

    resetWorkingLineCycles();
    const other = Array.from({ length: 6 }, () => drawWorkingLine("ship", "release", "other"));
    expect(other).not.toEqual(first);
  });

  test("seeds keep independent cycles per stage and agent", () => {
    const a = drawWorkingLine("build", "builder", "s1");
    const b = drawWorkingLine("build", "qa", "s1");
    const c = drawWorkingLine("sense", "builder", "s1");
    // Independent keys should not disturb each other's windows: exhaust
    // builder/build and confirm the other cycles still complete coverage.
    const deck = workingDeckFor("build", "builder");
    const drawn = [a];
    for (let i = 1; i < deck.length; i++) drawn.push(drawWorkingLine("build", "builder", "s1"));
    expect(new Set(drawn).size).toBe(deck.length);
    expect(typeof b).toBe("string");
    expect(typeof c).toBe("string");
  });
});

describe("drawWorkingLine: the avoid list (never two identical lines on screen)", () => {
  test("skips a line another surface already shows", () => {
    const first = drawWorkingLine("learn", "data-analyst", "seed-d");
    resetWorkingLineCycles();
    const second = drawWorkingLine("learn", "data-analyst", "seed-d", { avoid: [first] });
    expect(second).not.toBe(first);
  });

  test("avoided lines still surface later in the window (coverage is preserved)", () => {
    const deck = workingDeckFor("design", "ux-architect");
    const first = drawWorkingLine("design", "ux-architect", "seed-e");
    const rest = Array.from({ length: deck.length - 1 }, () =>
      drawWorkingLine("design", "ux-architect", "seed-e", { avoid: [first] }),
    );
    expect(new Set([first, ...rest]).size).toBe(deck.length);
  });
});

describe("the companion draws", () => {
  test("drawBridgeLine cycles the ambient bridge deck without repeats", () => {
    const drawn = Array.from({ length: AMBIENT_BRIDGE_LINES.length }, () =>
      drawBridgeLine("seed-f"),
    );
    expect(new Set(drawn).size).toBe(AMBIENT_BRIDGE_LINES.length);
  });

  test("workingSentence names the actor and ends with a period", () => {
    const sentence = workingSentence("build", "builder", "seed-g");
    expect(sentence.startsWith("Engineer is ")).toBe(true);
    expect(sentence.endsWith(".")).toBe(true);
  });
});
