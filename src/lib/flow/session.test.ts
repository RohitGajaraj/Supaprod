import { describe, expect, test } from "bun:test";
import {
  MAX_CUSTOM_MIN,
  MIN_CUSTOM_MIN,
  appendFocusHistory,
  clampMinutes,
  endsAtFor,
  formatRemaining,
  isExpired,
  isResumable,
  phaseOf,
  presetSrc,
  readFocusHistory,
  remainingMs,
  todaysFocusTally,
  type FlowSession,
  type FocusHistoryEntry,
} from "./session";

const NOW = 1_000_000;
function session(endsAt: number | null): FlowSession {
  return { endsAt, preset: "ocean", soundOn: true };
}

/** In-memory Storage stand-in for the history helpers. */
function memStorage(initial?: string): Pick<Storage, "getItem" | "setItem"> {
  let value: string | null = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v;
    },
  };
}

describe("endsAtFor", () => {
  test("a positive timer yields a deadline that many minutes out", () => {
    expect(endsAtFor(25, NOW)).toBe(NOW + 25 * 60_000);
  });
  test("zero minutes means open-ended (no deadline)", () => {
    expect(endsAtFor(0, NOW)).toBeNull();
  });
});

describe("remainingMs", () => {
  test("counts down toward the deadline", () => {
    expect(remainingMs(NOW + 5_000, NOW)).toBe(5_000);
  });
  test("never goes negative", () => {
    expect(remainingMs(NOW - 5_000, NOW)).toBe(0);
  });
  test("open-ended has no remaining value", () => {
    expect(remainingMs(null, NOW)).toBeNull();
  });
});

describe("isExpired / isResumable", () => {
  test("no session is neither expired nor resumable", () => {
    expect(isExpired(null, NOW)).toBe(false);
    expect(isResumable(null, NOW)).toBe(false);
  });
  test("an open-ended session never expires and stays resumable", () => {
    expect(isExpired(session(null), NOW)).toBe(false);
    expect(isResumable(session(null), NOW)).toBe(true);
  });
  test("a future deadline is resumable; a past one is expired", () => {
    expect(isResumable(session(NOW + 60_000), NOW)).toBe(true);
    expect(isExpired(session(NOW - 1), NOW)).toBe(true);
    expect(isResumable(session(NOW - 1), NOW)).toBe(false);
  });
});

describe("presetSrc", () => {
  test("maps a preset to its public audio file", () => {
    expect(presetSrc("ocean")).toBe("/soundscape/ocean.mp3");
    expect(presetSrc("heartbeat")).toBe("/soundscape/heartbeat.mp3");
  });
  test("off has no source", () => {
    expect(presetSrc("off")).toBeNull();
  });
});

describe("clampMinutes", () => {
  test("clamps to the allowed range and rounds", () => {
    expect(clampMinutes(15)).toBe(15);
    expect(clampMinutes(0)).toBe(MIN_CUSTOM_MIN);
    expect(clampMinutes(9999)).toBe(MAX_CUSTOM_MIN);
    expect(clampMinutes(20.6)).toBe(21);
  });
  test("non-finite input falls back to the minimum", () => {
    expect(clampMinutes(Number.NaN)).toBe(MIN_CUSTOM_MIN);
  });
});

describe("formatRemaining", () => {
  test("formats minutes and zero-padded seconds", () => {
    expect(formatRemaining(65_000)).toBe("1:05");
    expect(formatRemaining(119_000)).toBe("1:59");
    expect(formatRemaining(0)).toBe("0:00");
  });
  test("rounds partial seconds up so the timer never shows 0:00 early", () => {
    expect(formatRemaining(1_500)).toBe("0:02");
  });
  test("open-ended renders as empty", () => {
    expect(formatRemaining(null)).toBe("");
  });
});

describe("phaseOf", () => {
  const MIN = 60_000;
  function timed(planned: number, elapsedMs: number): { s: FlowSession; now: number } {
    const startedAt = NOW;
    return {
      s: {
        endsAt: startedAt + planned * MIN,
        preset: "ocean",
        soundOn: true,
        startedAt,
        plannedMin: planned,
      },
      now: startedAt + elapsedMs,
    };
  }

  test("null for no session, open-ended, or a pre-Desk stored session", () => {
    expect(phaseOf(null, NOW)).toBeNull();
    expect(phaseOf(session(null), NOW)).toBeNull();
    // A session stored by the previous build has no startedAt.
    expect(phaseOf(session(NOW + 10 * MIN), NOW)).toBeNull();
  });

  test("early before the halfway mark", () => {
    const { s, now } = timed(20, 9 * MIN);
    expect(phaseOf(s, now)).toBe("early");
  });

  test("past-half from the halfway mark", () => {
    const { s, now } = timed(20, 10 * MIN);
    expect(phaseOf(s, now)).toBe("past-half");
  });

  test("closing inside the last 10%", () => {
    const { s, now } = timed(20, 18.5 * MIN); // 1.5 min left < 2 min (10%)
    expect(phaseOf(s, now)).toBe("closing");
  });

  test("the closing window has a 30-second floor for short blocks", () => {
    // 3-minute block: 10% is 18s, the floor keeps closing at 30s remaining.
    const { s, now } = timed(3, 3 * MIN - 30_000);
    expect(phaseOf(s, now)).toBe("closing");
    const before = timed(3, 3 * MIN - 31_000);
    expect(phaseOf(before.s, before.now)).toBe("past-half");
  });
});

describe("focus history", () => {
  const entry: FocusHistoryEntry = {
    intent: "close the spec review",
    startedAt: NOW,
    endedAt: NOW + 25 * 60_000,
    plannedMin: 25,
    completed: true,
  };

  test("reads an empty or malformed store as no entries", () => {
    expect(readFocusHistory(null)).toEqual([]);
    expect(readFocusHistory(memStorage())).toEqual([]);
    expect(readFocusHistory(memStorage("not json"))).toEqual([]);
    expect(readFocusHistory(memStorage('{"nope":true}'))).toEqual([]);
  });

  test("append writes newest first and survives a round trip", () => {
    const store = memStorage();
    appendFocusHistory(store, entry);
    appendFocusHistory(store, { ...entry, intent: null, completed: false });
    const read = readFocusHistory(store);
    expect(read).toHaveLength(2);
    expect(read[0].intent).toBeNull();
    expect(read[1].intent).toBe("close the spec review");
  });

  test("caps the ledger at 50 entries", () => {
    const store = memStorage();
    for (let i = 0; i < 55; i += 1) appendFocusHistory(store, { ...entry, startedAt: NOW + i });
    expect(readFocusHistory(store)).toHaveLength(50);
  });

  test("todaysFocusTally counts only same-day blocks", () => {
    const dayMs = 24 * 60 * 60_000;
    const entries: FocusHistoryEntry[] = [
      entry,
      { ...entry, startedAt: NOW - dayMs, endedAt: NOW - dayMs + 50 * 60_000 },
    ];
    const tally = todaysFocusTally(entries, NOW + 60_000);
    expect(tally.blocks).toBe(1);
    expect(tally.minutes).toBe(25);
  });
});
