/**
 * A held station can be released, and released is not the same as skipped.
 *
 * WHY THIS EXISTS. A held track had exactly two controls: hand it to the next
 * station, or call it finished. Neither is "try again". So a track holding
 * `station-cannot-finish` or `given-up`, the two holds no code path clears, was
 * dead to its owner: the only ways forward were to SKIP the station that could
 * not finish, which advances work the station never did, or to close the piece of
 * work. A person who fixed the real cause outside the product had no way to say
 * so, and the driver never looked again.
 *
 * The dangerous version of this control is the one that resets an attempt counter
 * on a track that is running, which hands a station three fresh tries it did not
 * earn and turns a repair into a way to buy retries. So the shape that matters is
 * WHAT IT REFUSES, and that is most of what is pinned below.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stationWasDeferred } from "./track.functions";

const SPINE = join(import.meta.dir);
const src = () => readFileSync(join(SPINE, "track.functions.ts"), "utf8");

/** The handler body, so a match cannot be satisfied by a neighbouring function. */
function retryBody(): string {
  const s = src();
  const start = s.indexOf("export const retryStation");
  expect(start).toBeGreaterThan(-1);
  const end = s.indexOf("export const setStationWaiver");
  expect(end).toBeGreaterThan(start);
  return s.slice(start, end);
}

describe("what releasing a station writes, and what it must not", () => {
  it("clears the hold and the attempt count, and touches nothing else", () => {
    // The same three columns the driver's own resume branch writes when an
    // answered escalation clears itself. Anything more would be a second,
    // divergent way of doing what the driver already does correctly.
    const body = retryBody();
    expect(body).toContain("attempts: 0");
    expect(body).toContain("last_hold: null");
    expect(body).toContain("driven_at: now");
  });

  it("does not move the station, which was the whole difference from the old advanceTrack", () => {
    // If this ever writes `station:` it has become a second advance path with a
    // gentler name, and the two would drift.
    const body = retryBody();
    expect(body).not.toMatch(/\bstation:\s*(next|move|arrivedAt)/);
    expect(body).not.toContain("nextStation(");
  });

  it("does not write a status, so it can never close or reopen work", () => {
    const body = retryBody();
    expect(body).not.toMatch(/status:\s*"(done|open|abandoned)"/);
  });

  it("never calls a model or the orchestrator directly -- driveTrackOnce is the only path to either", () => {
    // Unchanged: this control has never run a seat itself and still does not.
    // What changed (P-151 / F-202) is whether it hands a deferred track to
    // driveTrackOnce so the sweep is not the only thing that can ever drive
    // it -- covered in its own describe block below, not here.
    const body = retryBody();
    expect(body).not.toContain("runAgentLoop");
    expect(body).not.toContain("callModel");
  });
});

describe("P-151 / F-202: a press on deferred work actually retries it", () => {
  it("lifts deferred_until in the release update, on every press", () => {
    // Belt and suspenders with driveTrackOnce's own unconditional clear: this
    // write always runs, deferred or not, so a track never reads "released"
    // while still excluded from the sweep's own deferred_until.is.null,...
    // filter (track-tick.ts).
    const body = retryBody();
    expect(body).toContain("deferred_until: null");
  });

  it("computes wasDeferred from the row read before the release update overwrites it", () => {
    const body = retryBody();
    expect(body).toContain("stationWasDeferred(");
    expect(body.indexOf("stationWasDeferred(")).toBeLessThan(body.indexOf("recordTrackDrive"));
  });

  it('calls driveTrackOnce with via "press" only when the track was deferred', () => {
    // The non-deferred path is unchanged from before this fix: the sweep's
    // own next pass still does that driving, which is not what F-202 found
    // broken and is out of this packet's scope to also change.
    const body = retryBody();
    expect(body).toContain("if (wasDeferred)");
    const ifIdx = body.indexOf("if (wasDeferred)");
    const driveIdx = body.indexOf("driveTrackOnce(supabase, driveRow");
    expect(driveIdx).toBeGreaterThan(ifIdx);
    expect(body).toContain('"press"');
  });

  it("returns the station's own composed line as note, not a promise about a next turn", () => {
    const body = retryBody();
    expect(body).toContain("note = outcome.line");
    expect(body).toContain("note,");
  });
});

describe("stationWasDeferred: the one genuinely new predicate, fixture-tested directly", () => {
  const NOW = new Date("2026-09-04T15:34:00Z");

  it("a horizon-deferred fixture (the forecast still seventeen days out) reads true", () => {
    expect(stationWasDeferred("2026-09-21T00:00:00Z", NOW)).toBe(true);
  });

  it("a backoff-deferred fixture (the ten-minute rung) reads true the same way", () => {
    // The predicate does not and must not care WHY the row is deferred --
    // P-113b's backoff and P-143's horizon write the same column, and
    // driveTrackOnce's own logic is what tells them apart, not this.
    expect(stationWasDeferred("2026-09-04T15:44:00Z", NOW)).toBe(true);
  });

  it("never deferred (null) reads false", () => {
    expect(stationWasDeferred(null, NOW)).toBe(false);
    expect(stationWasDeferred(undefined, NOW)).toBe(false);
  });

  it("a deferral that already expired reads false, matching the sweep's own is.null,...lte.now filter", () => {
    expect(stationWasDeferred("2026-09-04T15:00:00Z", NOW)).toBe(false);
    expect(stationWasDeferred(NOW.toISOString(), NOW)).toBe(false);
  });
});

describe("what it refuses", () => {
  it("refuses a track that is not held, so it cannot be used to buy attempts", () => {
    const body = retryBody();
    expect(body).toContain("if (!raw.last_hold)");
    expect(body).toContain("nothing waiting to be released");
  });

  it("reads the hold off the raw column, never off the rendered sentence", () => {
    // `rowToTrack` maps `last_hold` through `holdLine` into prose for the
    // surface. Branching on prose would make the refusal depend on wording, and
    // `holdLine` returns null for any hold value a newer deploy introduces.
    const body = retryBody();
    expect(body).toContain("raw.last_hold");
    expect(body).not.toContain("track.hold");
  });

  it("refuses while the workspace is paused, failing closed on an unreadable switch", () => {
    // A kill switch outranks every other consideration, and a control that wrote
    // anyway beside a row reading "everything is paused" would make the switch a
    // suggestion.
    const body = retryBody();
    expect(body).toContain("kill_switches");
    expect(body).toContain("paused = true");
    expect(body).toContain("so nothing was released");
  });

  it("refuses closed work, because there is no station left to run", () => {
    const body = retryBody();
    expect(body).toContain('raw.status !== "open"');
  });

  it("refuses to narrate a cause when the write comes back unconfirmed", () => {
    // An UPDATE returning nothing did not necessarily fail to commit. This is
    // the defect the old advanceTrack was repaired for: it announced an arrival that may
    // never have happened.
    const body = retryBody();
    expect(body).toContain("did not come back confirmed");
  });
});

describe("the trail says a person did it, and does not claim a transition", () => {
  it("records a human actor", () => {
    expect(retryBody()).toContain('actor: "human"');
  });

  it("names the same station at both ends, because the work did not move", () => {
    // A trail row claiming a transition would be the false stage event
    // the old advanceTrack (deleted 2026-09-08) was repaired for. It also matters to the correction budget:
    // readCorrections counts BACKWARD transitions off this table, and a row whose
    // ends differ could be read as a correction nobody made.
    const body = retryBody();
    expect(body).toContain("from: track.station");
    expect(body).toContain("to: track.station");
  });
});

// The describe block that used to open here, "the control is reachable, and
// only where it applies", proved retryStation was actually wired into
// TrackStart.tsx -- the surface that listed work in flight before P-14
// (A-QUEUE.md, R-34) deleted /plan and, with it, TrackStart.tsx (zero real
// importers once /plan's own route file stopped being one). The server
// function this whole file otherwise tests is unaffected; only its one
// caller's own surface-reachability proof went with the surface.
