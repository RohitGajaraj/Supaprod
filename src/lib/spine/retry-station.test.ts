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

  it("does not move the station, which is the whole difference from advanceTrack", () => {
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

  it("dispatches nothing and spends nothing", () => {
    // The next tick does the driving. A control that dispatched here would spend
    // money from a menu item, outside every budget the tick applies.
    const body = retryBody();
    expect(body).not.toContain("runAgentLoop");
    expect(body).not.toContain("driveTrackOnce");
    expect(body).not.toContain("callModel");
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
    // the defect advanceTrack was repaired for: it announced an arrival that may
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
    // advanceTrack was repaired for. It also matters to the correction budget:
    // readCorrections counts BACKWARD transitions off this table, and a row whose
    // ends differ could be read as a correction nobody made.
    const body = retryBody();
    expect(body).toContain("from: track.station");
    expect(body).toContain("to: track.station");
  });
});

describe("the control is reachable, and only where it applies", () => {
  const panel = () =>
    readFileSync(join(SPINE, "..", "..", "components", "spine", "TrackStart.tsx"), "utf8");

  it("is called from the one surface that lists work in flight", () => {
    // The reachability half. A server function with no caller is the defect this
    // audit found four times; this one is new, so it gets the guard on day one.
    const code = panel();
    expect(code).toContain("retryStation");
    expect(code).toContain("release.mutate(t)");
  });

  it("is offered only on a held track", () => {
    // On anything else there is nothing to release, and a control that appears
    // and then refuses is worse than one that is absent.
    expect(panel()).toContain("{t.hold ? (");
  });

  it("names the station rather than the mechanism", () => {
    // "Retry" is what the function does. "Let Discover try again" is what
    // happens, and it says who is being asked.
    expect(panel()).toContain("try again`");
    expect(panel()).not.toContain(">Retry<");
  });

  it("says the station runs again, never that the work moved", () => {
    const code = panel();
    expect(code).toContain("runs again on");
    expect(code).toContain("Nothing has been charged for it yet");
  });
});

describe("advanceTrack stops reporting a lap that did not happen", () => {
  /**
   * THE DEFECT. `advanceTrack` consults the kill switch and nothing else: not
   * `last_hold`, not `attempts`, and not whether the station being left produced
   * anything. So a person could walk a track through its whole remaining route
   * with an empty member list, and the board would report a completed lap that
   * never happened. A completed lap that did not happen is the one claim this
   * product must never make about itself.
   *
   * REFUSING WOULD BE THE WRONG FIX, and that is why this asserts a REPORT rather
   * than a refusal. The governance canon is explicit that a person carrying their
   * own work forward past a station is a decision they are allowed to make, and
   * this handler's own header already argues exactly that for an open gate. What
   * was wrong was not the permission. It was the silence.
   */
  const src = () => readFileSync(join(SPINE, "track.functions.ts"), "utf8");

  function advanceBody(): string {
    const s = src();
    const start = s.indexOf("export const advanceTrack");
    expect(start).toBeGreaterThan(-1);
    const end = s.indexOf("export const retryStation", start);
    expect(end).toBeGreaterThan(start);
    return s.slice(start, end);
  }

  it("asks whether the station it is leaving filed anything", () => {
    const body = advanceBody();
    expect(body).toContain("spine_track_members");
    // Scoped to the STATION, not the whole track: a track carrying a spec from
    // Plan has members, and that says nothing about whether Design drew anything.
    expect(body).toContain('.eq("station", track.station)');
  });

  it("asks BEFORE the move, because afterwards the row is somewhere else", () => {
    const body = advanceBody();
    expect(body.indexOf("spine_track_members")).toBeLessThan(body.indexOf(".update("));
  });

  it("still permits the move, because that is the person's decision to make", () => {
    // If this ever starts refusing, the canon's own ruling has been reversed by a
    // commit rather than by a decision.
    const body = advanceBody();
    expect(body).not.toContain('refused: "That station filed nothing');
    expect(body).toContain("emptyStation,");
  });

  it("treats a failed member read as unknown, never as an empty station", () => {
    // `count` is null when the read errored. Turning that into "the station
    // produced nothing" would be this repo's signature defect: a failed read
    // becoming a confident zero, here in the form of an accusation.
    const body = advanceBody();
    expect(body).toContain("(count ?? null) === 0");
    expect(body).toContain("if (!memberErr");
  });

  it("carries the fact on every return path, so no caller can miss it", () => {
    // A field present on the happy path only is a field a caller learns to not
    // trust.
    const body = advanceBody();
    const returns = body.match(/emptyStation/g)?.length ?? 0;
    expect(returns).toBeGreaterThanOrEqual(6);
  });

  it("is said out loud on the surface, not just returned", () => {
    // A fact captured and never read is the shape this whole audit keeps closing.
    const panel = readFileSync(
      join(SPINE, "..", "..", "components", "spine", "TrackStart.tsx"),
      "utf8",
    );
    expect(panel).toContain("res.emptyStation");
    expect(panel).toContain("filed nothing, so the next station has nothing from it to work from");
    // And when the track is CLOSED OUT, which is the moment the false claim of a
    // completed lap would actually be made.
    expect(panel).toContain("the record of this work has a gap at that station");
  });
});
