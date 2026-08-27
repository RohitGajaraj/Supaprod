/**
 * TWO NUMBERS FOR ONE THING, SIX WORDS APART (S2 → S0, 2026-08-27).
 *
 * `listMissions` ends `.order("updated_at", desc).limit(50)`. The cap is right
 * for the ROWS — a lane must not render a thousand of them — and it silently
 * bounded the NUMBER too.
 *
 * S2 measured the result on one screen: the Waiting-on-you lane read **35**
 * while the station strip directly above it read **89** for the same population.
 * `use-spine-strip.ts` already records that shape as the thing that makes a
 * screen read as broken, and it is worse than a single wrong number, because
 * the reader can see both and knows one of them is lying to them.
 *
 * ── THE TWO PRODUCT CALLS S2 LEFT TO ME, ANSWERED HERE ─────────────────────
 * **Should the lane be windowed to 24 hours? No.** Work waiting since Monday
 * does not stop needing a person on Tuesday, and the lane's whole job is "what
 * needs somebody soonest". S2 had already shipped it unwindowed; this confirms
 * it rather than reversing it.
 *
 * **Is the 50 cap load-bearing? For the rows, yes. For the count, no.** A count
 * is one query with `head: true` and no row travels for it. So the cap stays
 * where it protects rendering and goes where it was corrupting a fact.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(
  fileURLToPath(new URL("./missions.functions.ts", import.meta.url)),
  "utf8",
);

describe("the count is asked for exactly, over every row", () => {
  it("counts with head:true, so no row travels for a number", () => {
    expect(SRC).toContain('.select("id", { count: "exact", head: true })');
  });

  it("and the row cap is untouched, because it protects rendering", () => {
    expect(SRC).toContain(".limit(50)");
  });

  it("scoped to the workspace the caller asked about", () => {
    const at = SRC.indexOf("const BLOCKED_STATUSES");
    const block = SRC.slice(at, at + 1400);
    expect(block).toContain('countQ.eq("workspace_id", input.workspaceId)');
  });
});

describe("THE STATUSES ARE THE BOARD'S OWN, not a second opinion", () => {
  it("uses the set the board routes on", () => {
    // Two definitions of "stuck" is how this disagreement started. One list.
    expect(SRC).toContain(
      'const BLOCKED_STATUSES = ["failed", "halted", "cancelled", "blocked", "proposed"] as const',
    );
  });
});

describe("a count alone cannot say whether the pile is stale", () => {
  it("the oldest blocked timestamp travels with it", () => {
    expect(SRC).toContain("oldestBlockedAt");
    expect(SRC).toContain('.order("updated_at", { ascending: true })');
  });

  it("and every return carries both, so no caller sees a partial answer", () => {
    // Three exits: the empty-product short-circuit, the empty-list case, and the
    // enriched result. A missing field on one of them is a lane that silently
    // renders nothing where a number should be.
    expect(SRC.split("totalBlocked").length - 1).toBeGreaterThanOrEqual(5);
  });

  it("a failed count answers null rather than zero, and never throws the lane away", () => {
    const at = SRC.indexOf("const BLOCKED_STATUSES");
    const block = SRC.slice(at, at + 2000);
    expect(block).toContain("catch");
    // NULL, not 0. S2's call and it is right: a failed read degrading to zero
    // puts "Waiting on you 0" at the head of the lane whose job is saying what
    // needs a person. A count that cannot be taken is not a count of zero.
    expect(block).toContain("totalBlocked = null");
  });
});
