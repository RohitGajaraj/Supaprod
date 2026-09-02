/**
 * THE SWEEP SERVES A PIN FIRST, AND IS OTHERWISE UNCHANGED.
 *
 * ── WHY A SOURCE GUARD ────────────────────────────────────────────────────
 * The claim is about an ORDER CLAUSE on a PostgREST query. Driving it end to end
 * would mean a live database with two runnable tracks and a tick, which is A1's
 * check and the right one; what a unit test can hold is that the clause is there,
 * in the right order, and that the fallback exists. A guard that says less than
 * it appears to would be worse than none, so this says exactly that.
 *
 * ── THE TWO HALVES ARE BOTH THE POINT ─────────────────────────────────────
 * `pinned_at asc nulls last` FIRST, so the person's answer wins. `driven_at asc`
 * still SECOND, so every unpinned run keeps exactly the round robin it had:
 * a pin is a position in the queue, not a lock, and nothing is starved.
 *
 * And the fallback, because the column arrives in its own migration and naming
 * it in a select fails the whole query on a database that has not taken it yet.
 * The sweep is the one thing in this product that runs with nobody watching, so
 * it degrades to yesterday's ordering rather than stopping.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TICK = readFileSync(fileURLToPath(new URL("./track-tick.ts", import.meta.url)), "utf8");
const flat = TICK.replace(/\s+/g, " ");

describe("the order the sweep takes work in", () => {
  it("asks for the pin first and the round robin second", () => {
    expect(flat).toContain(
      '.order("pinned_at", { ascending: true, nullsFirst: false }) .order("driven_at", { ascending: true, nullsFirst: true })',
    );
  });

  it("keeps `nulls last` on the pin, so an unpinned run is not treated as the oldest pin", () => {
    // `nullsFirst: true` here would put every unpinned run ahead of every pinned
    // one, which is the exact inverse of the feature.
    expect(flat).not.toContain('.order("pinned_at", { ascending: true, nullsFirst: true })');
  });

  it("falls back to the old ordering when the column is not there yet", () => {
    expect(flat).toContain('(error as { code?: string }).code === "42703"');
    expect(flat).toContain('/pinned_at/.test(error.message ?? "")');
  });

  it("still bounds the page it takes, so a pin cannot widen a tick", () => {
    // A pin changes WHICH tracks a tick takes, never HOW MANY.
    expect([...TICK.matchAll(/limit\(MAX_TRACKS_PER_TICK \* 3\)/g)].length).toBe(2);
  });
});
