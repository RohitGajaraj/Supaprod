import { describe, expect, it } from "bun:test";
import { outOfTime, TICK_DEADLINE_MS } from "./track-caps.server";

/**
 * `spine.track-tick` drives up to five tracks under ONE shared deadline, ordered
 * least-recently-driven first. That ordering is correct and it was not enough,
 * because `driveTrackOnce` stamps `driven_at` on EVERY path out of it -- including
 * the out-of-time path where it did no work at all.
 *
 * So a track the sweep could not serve had its ordering key rewritten anyway, and
 * the next tick's `ORDER BY driven_at ASC` reproduced the previous tick's order
 * exactly. Position in the queue was fixed by whatever order the tracks first
 * entered the batch, and nothing could ever change it. The route's own header
 * claimed "one busy track can never starve the rest"; that was the one thing it
 * could not do.
 *
 * Measured in production 2026-08-22: eighteen consecutive ticks in identical
 * order, and one track holding zero seats for two hours fifty minutes at
 * `spend_used_usd` 0 and `attempts` 0.
 *
 * THE FIX IS AN ABSENCE. The sweep stops at the shared deadline, so a track it
 * cannot serve is never started and therefore never stamped. It keeps its older
 * timestamp and sorts to the head of the next tick. Nothing has to remember whose
 * turn it is, because the timestamp already does.
 *
 * These are simulations of the two stamping rules over the REAL `outOfTime`
 * predicate. They cannot prove the route is wired correctly -- only that the rule
 * the route now implements converges and the one it replaced does not.
 */

/** One tick. Returns the order for the next tick under the given stamping rule. */
function sweep(
  tracks: { id: string; drivenAt: number }[],
  costMs: number[],
  now: number,
  stampUnreached: boolean,
): { order: { id: string; drivenAt: number }[]; served: string[] } {
  const queue = [...tracks].sort((a, b) => a.drivenAt - b.drivenAt);
  const startedAt = now;
  let clock = now;
  const served: string[] = [];

  for (let i = 0; i < queue.length; i++) {
    const overTime = outOfTime(startedAt, clock);
    if (overTime && !stampUnreached) break;
    if (!overTime) {
      // Served: it costs time and it is stamped.
      clock += costMs[i] ?? 1;
      served.push(queue[i].id);
    }
    // The old rule stamped even when out of time, which is the defect.
    queue[i] = { ...queue[i], drivenAt: clock };
  }
  return { order: queue, served };
}

describe("a sweep that stamps a track it never served freezes its own rotation", () => {
  /**
   * The head track eats the entire window every tick, which is exactly the
   * production shape: ten consecutive ticks ran 46s to 107s against a 45s
   * deadline.
   */
  const FIVE = [
    { id: "a", drivenAt: 1 },
    { id: "b", drivenAt: 2 },
    { id: "c", drivenAt: 3 },
    { id: "d", drivenAt: 4 },
    { id: "e", drivenAt: 5 },
  ];
  const HEAD_EATS_THE_WINDOW = [TICK_DEADLINE_MS + 1_000, 1, 1, 1, 1];

  it("starves the tail forever under the old rule", () => {
    let tracks = FIVE;
    const everServed = new Set<string>();
    let now = 0;
    for (let tick = 0; tick < 20; tick++) {
      const r = sweep(tracks, HEAD_EATS_THE_WINDOW, now, true);
      r.served.forEach((id) => everServed.add(id));
      tracks = r.order;
      now += 600_000;
    }
    // Twenty ticks, and only the head is ever served: the order never moves.
    expect(everServed.has("a")).toBe(true);
    expect(everServed.size).toBe(1);
  });

  it("reaches every track under the shipped rule", () => {
    let tracks = FIVE;
    const everServed = new Set<string>();
    let now = 0;
    for (let tick = 0; tick < 5; tick++) {
      const r = sweep(tracks, HEAD_EATS_THE_WINDOW, now, false);
      r.served.forEach((id) => everServed.add(id));
      tracks = r.order;
      now += 600_000;
    }
    // Five tracks, five ticks, every one served at least once.
    expect(everServed.size).toBe(5);
  });

  /**
   * The property, rather than one arranged case: whatever the head costs, no
   * track can be skipped more times than there are tracks.
   */
  it("serves the last track within one rotation, for any head cost", () => {
    for (const headCost of [TICK_DEADLINE_MS, TICK_DEADLINE_MS * 2, TICK_DEADLINE_MS * 10]) {
      let tracks = FIVE;
      const everServed = new Set<string>();
      let now = 0;
      for (let tick = 0; tick < FIVE.length; tick++) {
        const r = sweep(tracks, [headCost, 1, 1, 1, 1], now, false);
        r.served.forEach((id) => everServed.add(id));
        tracks = r.order;
        now += 600_000;
      }
      expect(everServed.size).toBe(FIVE.length);
    }
  });

  /**
   * The premise. If the deadline ever stops being finite, or the sweep stops
   * driving more than one track, this whole file is measuring nothing.
   */
  it("still guards a real shared deadline", () => {
    expect(TICK_DEADLINE_MS).toBeGreaterThan(0);
    expect(outOfTime(0, TICK_DEADLINE_MS)).toBe(true);
    expect(outOfTime(0, TICK_DEADLINE_MS - 1)).toBe(false);
  });
});

/**
 * The simulations above prove the RULE converges. They cannot prove the sweep
 * uses it, and the defect was never in the rule -- it was that the sweep never
 * asked. So this reads the route.
 *
 * Pinned to the CALL, not to a sentence. A guard on comment prose passes when the
 * meaning breaks and fails when the wording improves; both have happened in this
 * repo. What must stay true is that the sweep consults the shared clock before it
 * starts a track, so that is what is asserted.
 */
describe("the sweep actually consults the deadline", () => {
  it("checks the clock before driving, not only between seats", async () => {
    const src = await Bun.file("src/routes/api/public/hooks/track-tick.ts").text();
    const body = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    expect(body).toContain("outOfTime");
    const guard = body.indexOf("outOfTime(tickStartedAt");
    const drive = body.indexOf("driveTrackOnce(");
    expect(guard).toBeGreaterThan(-1);
    expect(drive).toBeGreaterThan(-1);
    // The guard has to come first, or the tick pays for the track it is about
    // to decide it cannot afford.
    expect(guard).toBeLessThan(drive);
  });

  it("reports what it actually drove, not how many rows it read", async () => {
    const src = await Bun.file("src/routes/api/public/hooks/track-tick.ts").text();
    const body = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    // `driven: rows.length` counted a track the sweep stamped and never served.
    expect(body).not.toContain("driven: rows.length");
    expect(body).toContain("skipped");
  });
});
