/**
 * ── THE PRODUCT'S MOST COMMON REAL BLOCKER, WHICH NO SURFACE NAMED ────────
 *
 * WALKED AS A STRANGER ON THE SERVED RUN SCREEN, 2026-09-10, on `6cc7a010`.
 * The one sentence the product gave a person about a run stopped for six days:
 *
 *   "Design has been run many times over and the work has not moved on once,
 *    so nothing further will be spent on it until you look."
 *
 * Measured on production, what had actually happened at that station:
 *
 *   ux-architect · 12 runs · status halted · halted_reason out_of_credit
 *                · avg duration 612ms · 03:40 to 05:30 UTC on 2026-09-04
 *
 * Twelve refusals at the door, over an hour and a half. The station never ran.
 * Nothing went round in circles: the account was empty. And both remedies that
 * sentence leads to -- send it back a step, take it over -- would each have
 * bought a thirteenth instant refusal.
 *
 * ── AND IT IS NOT ONE UNLUCKY TRACK ───────────────────────────────────────
 * Across every track this product has ever made, eight have a halted run and
 * FIVE of those halted `out_of_credit` -- two wearing `going-in-circles` with
 * 24 halted runs between them, two `given-up`, one `nothing-to-hand-on`. Out
 * of credit is the most common real blocker this product has, and until this
 * change no top-level surface said the word once.
 *
 * ── WHAT IS PINNED ────────────────────────────────────────────────────────
 * The RULE, not the wording: a cause the platform RECORDED outranks a shape
 * the driver INFERRED. The hold sentence is not wrong and is not removed; it
 * is what a reader gets when the record holds nothing better.
 */
import { describe, expect, it } from "bun:test";
import { ROW_LINE_MAX, startRowMiddle, type StartRowInput } from "./tracks-feed";
import { KIND_WORD } from "@/lib/spine/attach";

const NOW = Date.parse("2026-09-10T12:00:00Z");
const phrase = () => null;

/** `6cc7a010` as it actually stood when this was walked. */
const CIRCLES: StartRowInput = {
  id: "6cc7a010",
  title: "Let a homeowner reschedule an installer visit from the order page",
  status: "open",
  station: "design",
  stationName: "Design",
  updatedAt: "2026-09-04T03:31:46Z",
  drivenAt: "2026-09-04T05:30:05Z",
  holdReason: "going-in-circles",
  holdBecause:
    "This station has been run many times over and the work has not moved on once, so nothing further will be spent on it until you look.",
  working: null,
  needsYou: null,
  produced: [],
};

const line = (r: StartRowInput) => startRowMiddle(r, NOW, KIND_WORD, phrase, "UTC");

describe("a wall the platform recorded outranks a shape the driver inferred", () => {
  it("says the account ran out of credit, on the run that reads as going in circles", () => {
    expect(
      line({ ...CIRCLES, stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z" } }),
    ).toBe("Stopped: the account ran out of credit, so the seat never ran.");
  });

  it("keeps the driver's sentence when the platform recorded no wall", () => {
    /*
     * THE MIRROR, AND THE WHOLE REASON THIS SITS ABOVE THE HOLD BRANCH RATHER
     * THAN REPLACING IT. `going-in-circles` is a true reading of a loop that
     * genuinely ran a station many times and got nowhere. It is what a reader
     * should get whenever the record holds nothing better.
     */
    /* PINNED ON THE CLAIM, NOT THE SPELLING. Which of the three hold
       fallbacks answers depends on `ROW_LINE_MAX` and on `shortHoldLine`, and
       both are free to improve. What must hold is that the row still describes
       the SHAPE and says nothing about a wall nobody recorded. */
    const plain = line(CIRCLES);
    expect({ mentionsAWall: /credit|switched off|spending limit/i.test(plain) }).toEqual({
      mentionsAWall: false,
    });
    expect({ namesTheStation: plain.includes("Design") }).toEqual({ namesTheStation: true });
    expect(line({ ...CIRCLES, stoppedBecause: null })).toBe(plain);
  });

  it("falls through rather than printing a slug this build has no words for", () => {
    // `halted_reason` is a text column, not an enum, and a value written by a
    // newer deploy must never reach a person raw. Same rule `holdLine` follows.
    expect(
      line({ ...CIRCLES, stoppedBecause: { kind: "quota_realm_x", at: NOW.toString() } }),
    ).toBe(line(CIRCLES));
  });

  it("never speaks over a run that is actually working", () => {
    /*
     * A track that halted last week and is running now must read as running.
     * The wall is history the moment a seat is in flight, and the working
     * branch returns long before this one.
     */
    const live = {
      ...CIRCLES,
      working: { seat: "Engineer", since: "2026-09-10T11:58:00Z", tool: null },
      stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z" },
    };
    expect(line(live)).toContain("Engineer");
  });

  it("never speaks over a graded forecast on a finished run", () => {
    // A verdict is the answer this product exists to give (P-04). A wall from
    // a run that later finished anyway is not the headline.
    const done: StartRowInput = {
      ...CIRCLES,
      status: "done",
      forecast: { resolution: "hit", rationale: null },
      stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z" },
    };
    expect(line(done)).toContain("forecast");
  });

  it("says nothing about a balance now, because it does not read one", () => {
    /*
     * The account behind `6cc7a010` holds 5,249 credits today with a 10,000
     * top-up: the wall came down and the run is still stopped. "You are out of
     * credit" would be a false statement about the present. What is true in
     * every case is what HAPPENED, so that is what is said -- and whether the
     * wall has since come down is a second question needing a second read.
     */
    const said = line({
      ...CIRCLES,
      stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z" },
    });
    for (const claim of ["Top up", "top up", "you are out", "no credit left"]) {
      expect({ claim, said: said.includes(claim) }).toEqual({ claim, said: false });
    }
  });
});

/*
 * ── THE WALL CAME DOWN AND NOTHING TOLD ANYBODY ───────────────────────────
 *
 * `6cc7a010` halted twelve times on 2026-09-04 against an account holding 13
 * credits. That account holds 5,249 today, with a 10,000 top-up. The thing
 * that stopped the run is gone, the run has not moved for six days, and it
 * never will on its own: `going-in-circles` is in `TERMINAL_HOLDS`, so the
 * sweep refuses it by design and only a person can start it again.
 *
 * A run that can go again and one that has genuinely given up looked identical
 * on the entry, which is the founder's *"I cannot feel the value"* on the one
 * row where the product had something valuable to say and did not say it.
 */
describe("a wall that has come down", () => {
  const halted = (gone: boolean): StartRowInput => ({
    ...CIRCLES,
    stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z", gone },
  });

  it("says there is credit again, because that is what changes what you do", () => {
    expect(line(halted(true))).toBe("It ran out of credit and stopped. There is credit again.");
  });

  it("still says the cause, because the change alone is a non sequitur", () => {
    expect({ namesTheCause: /credit/i.test(line(halted(true))) }).toEqual({ namesTheCause: true });
  });

  it("does not say it when the wall is still standing", () => {
    expect(line(halted(false))).toBe(
      "Stopped: the account ran out of credit, so the seat never ran.",
    );
  });

  it("degrades to naming the wall when nothing could be read about the balance", () => {
    /*
     * THE FAIL DIRECTION, AND IT IS THE POINT. RLS returns no row for an
     * account the reader does not own, so `gone` arrives absent rather than
     * false-because-empty. Naming the wall without claiming it lifted is still
     * true; the reverse would be the product inventing an all-clear.
     */
    const unknown: StartRowInput = {
      ...CIRCLES,
      stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z" },
    };
    expect(line(unknown)).toBe("Stopped: the account ran out of credit, so the seat never ran.");
  });

  it("fits the one line a row gets", () => {
    // Every sentence here renders as `StartRow.middle`, which is clamped.
    expect(line(halted(true)).length).toBeLessThanOrEqual(ROW_LINE_MAX);
  });
});
