/**
 * "EACH OF THESE COSTS ONE INTERRUPTION" ASSUMED SOMEBODY ANSWERS IT.
 *
 * Measured on the live database, 2026-08-27, across all 324 `agent_approvals`
 * rows ever written: 167 were answered, 58 cancelled, and 99 never answered by
 * anybody -- 71 expired, 21 pending past their expiry, 7 escalated and still
 * sitting. Roughly one gate in three. The cost of those was not an
 * interruption; it was work that stopped and did not resume, which is R-27's
 * own "a gate nobody answers is a stall wearing governance as a costume".
 */
import { describe, it, expect } from "bun:test";
import {
  unansweredGates,
  whatBecameOfThem,
  GATE_READ_LIMIT,
  type GateRow,
} from "../gates-nobody-answered";

const label = (n: string) => ({ "studio.commit": "Commit code" })[n] ?? n;
const gate = (tool: string, state: string): GateRow => ({
  tool_name: tool,
  escalation_state: state,
});

describe("a gate nobody answered", () => {
  it("says nothing while every gate is still live", () => {
    expect(unansweredGates([gate("a", "pending"), gate("b", "pending")], label).said).toBeNull();
    expect(unansweredGates([], label).said).toBeNull();
    expect(unansweredGates(null, label).said).toBeNull();
  });

  it("counts the expired ones and names what they were for", () => {
    const r = unansweredGates(
      [gate("studio.commit", "expired"), gate("prd.revise", "expired"), gate("x", "pending")],
      label,
    );
    expect(r.expired).toBe(2);
    expect(r.said).toContain("2 requests were never answered");
    expect(r.said).toContain("Commit code and prd.revise");
    // The point of the sentence is what to DO, not that something is broken.
    expect(r.said).toContain("Granting one or switching it off");
  });

  it("reads as English about one", () => {
    const r = unansweredGates([gate("prd.revise", "expired")], label);
    expect(r.said).toContain("1 request was never answered");
  });

  it("names at most two tools, then counts the rest", () => {
    const r = unansweredGates(
      ["a", "b", "c", "d"].map((t) => gate(t, "expired")),
      label,
    );
    expect(r.said).toContain("(a, b and 2 more)");
  });

  /**
   * THE READ CAPS AT 50 ROWS. A count taken off a capped read is a FLOOR, and
   * printing it as an exact figure is the quiet kind of wrong: nothing looks
   * off, and the number is smaller than the truth on the one screen where an
   * under-report is the direction that hurts.
   */
  it("says 'at least' the moment it is standing on a capped read", () => {
    const full = Array.from({ length: GATE_READ_LIMIT }, () => gate("a", "expired"));
    expect(unansweredGates(full, label).capped).toBe(true);
    expect(unansweredGates(full, label).said).toContain(`At least ${GATE_READ_LIMIT}`);

    const short = Array.from({ length: 3 }, () => gate("a", "expired"));
    expect(unansweredGates(short, label).capped).toBe(false);
    expect(unansweredGates(short, label).said).not.toContain("At least");
  });
});

/**
 * THE CAPPED COUNT HAD NO DENOMINATOR, AND NOW THERE IS ONE.
 *
 * "3 requests were never answered" is a floor taken off a read capped at 50
 * rows, covering only this person's pending and expired gates. It can never
 * say 3 of how many.
 *
 * Measured 2026-08-27 across all 324 `agent_approvals` rows ever written: 176
 * answered, 92 expired unanswered, 58 cancelled, 0 still waiting. More than one
 * gate in four was never answered by anybody, which is R-27's "a gate nobody
 * answers is a stall wearing governance as a costume" with a number on it.
 */
describe("what became of every gate", () => {
  it("states the population rather than a percentage", () => {
    expect(whatBecameOfThem({ total: 324, answered: 176, expired: 92 })).toBe(
      "92 of the 324 gates this workspace has ever raised were never answered.",
    );
  });

  /* "28% expired" hands a person a number whose denominator they cannot see.
     This file already argues that a count whose population is not named will be
     read as covering everything. */
  it("never prints a percentage", () => {
    const said = whatBecameOfThem({ total: 324, answered: 176, expired: 92 }) ?? "";
    expect(said).not.toContain("%");
  });

  it("says the good case out loud, because nothing else on the page does", () => {
    expect(whatBecameOfThem({ total: 12, answered: 12, expired: 0 })).toBe(
      "All 12 gates this workspace has raised were answered.",
    );
    expect(whatBecameOfThem({ total: 1, answered: 1, expired: 0 })).toBe(
      "All 1 gate this workspace has raised was answered.",
    );
  });

  it("reads as English about one", () => {
    expect(whatBecameOfThem({ total: 9, answered: 8, expired: 1 })).toContain(
      "1 of the 9 gates this workspace has ever raised was never answered",
    );
  });

  /* A failed count is not "none expired". */
  it("a missing count draws nothing at all", () => {
    expect(whatBecameOfThem(null)).toBeNull();
    expect(whatBecameOfThem(undefined)).toBeNull();
    expect(whatBecameOfThem({ total: 0, answered: 0, expired: 0 })).toBeNull();
  });
});
