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
    stoppedBecause: {
      kind: "out_of_credit",
      at: "2026-09-04T05:30:05Z",
      now: gone ? "gone" : "standing",
    },
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

/*
 * ── "WE DID NOT LOOK" IS A THIRD STATE, NOT A FALSY SECOND ONE ────────────
 *
 * Lane 2's condition on the factored reader, and they were right to insist.
 * `now` is `gone`, `standing` or `unknown`. A failed wallet read that collapsed
 * to `gone` would delete a real wall from a card, which is worse than the stale
 * count it replaced; one that collapsed to `standing` would tell a person the
 * door is shut when nobody checked.
 */
describe("a wall whose standing nobody could read", () => {
  const at = "2026-09-04T05:30:05Z";
  const said = (now?: "gone" | "standing" | "unknown") =>
    startRowMiddle(
      { ...CIRCLES, stoppedBecause: { kind: "out_of_credit", at, ...(now ? { now } : {}) } },
      NOW,
      KIND_WORD,
      phrase,
      "UTC",
    );

  it("names the wall and claims nothing about now", () => {
    expect(said("unknown")).toBe("Stopped: the account ran out of credit, so the seat never ran.");
  });

  it("reads an absent `now` the same way, never as an all-clear", () => {
    // A caller that has not been taught the field yet must fail safe.
    expect(said()).toBe(said("unknown"));
  });

  it("still says the change when somebody did look", () => {
    // The mirror: failing safe everywhere would make the whole read pointless.
    expect(said("gone")).toBe("It ran out of credit and stopped. There is credit again.");
  });
});

/*
 * ── AND A WALL STOPS BEING THE NEWS THE MOMENT THE HOLD CLEARS ────────────
 *
 * READ ON THE SERVED HOME, 2026-09-10, hours after the wall sentence shipped.
 * Lane 3's wallet repair cleared `last_hold` on three tracks and all three
 * kept saying **"It ran out of credit and stopped. There is credit again."**
 *
 * True, and no longer the news. `stoppedBecause` reads the newest halted run
 * and that row never goes away, so a wall check above the hold branches
 * outlives every hold it was written for. A released run is not stopped; it is
 * waiting to be picked up, and that is what its one line should say.
 *
 * The branch was correct against every state that existed when it was written,
 * and another lane created the state it was wrong in.
 */
describe("a wall belongs to a run that is still stopped", () => {
  const released: StartRowInput = {
    ...CIRCLES,
    holdReason: null,
    holdBecause: null,
    stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:30:05Z", now: "gone" },
  };
  const line = (r: StartRowInput) => startRowMiddle(r, NOW, KIND_WORD, phrase, "UTC");

  it("says nothing about credit once the hold has cleared", () => {
    expect({ mentionsAWall: /credit/i.test(line(released)) }).toEqual({ mentionsAWall: false });
  });

  it("says the same for a wall that is still standing, once the hold is gone", () => {
    /*
     * `holdReason` is the discriminator and not `now`: ANY cleared hold ends
     * the wall's claim, whether the wall lifted or a person stepped in. A run
     * somebody took over is not reported as blocked by the thing it was
     * blocked by last week.
     */
    const takenOver = {
      ...released,
      stoppedBecause: { ...released.stoppedBecause!, now: "standing" as const },
    };
    expect({ mentionsAWall: /credit/i.test(line(takenOver)) }).toEqual({ mentionsAWall: false });
  });

  it("still says it while the run IS stopped", () => {
    // The mirror. Gating on the hold must not silence the sentence in the
    // state it was written for, which is the common one.
    expect(
      line({ ...released, holdReason: "going-in-circles", holdBecause: CIRCLES.holdBecause }),
    ).toBe("It ran out of credit and stopped. There is credit again.");
  });
});

/*
 * ── A WALL FROM FIVE DAYS AGO IS NOT WHY IT STOPPED TODAY ─────────────────
 *
 * READ ON THE SERVED HOME, 2026-09-09 23:28 UTC, an hour after the
 * cleared-hold gate shipped. `a30d6b62` had just walked `define -> design ->
 * build` and held at Build, and its row said **"It ran out of credit and
 * stopped. There is credit again."**
 *
 *   last_hold ........... produced-nothing
 *   last_hold_because ... "The last thing it tried was repo.tree, which said:
 *                          No repository is connected..."
 *   newest halt ......... out_of_credit, 2026-09-04 05:41
 *   driven_at ........... 2026-09-09 23:20
 *
 * The credit wall was five days old and the track was held today for a
 * repository. Requiring a hold to EXIST was not enough — the halt has to belong
 * to the drive that produced the hold.
 *
 * `drivenAt` is the discriminator: a hold comes from a drive, so a halt older
 * than the last drive cannot have caused it. **The same shape caught me twice
 * in one night** — `stoppedBecause` reads a row that never goes away, so every
 * gate on it has to say when it stopped being the explanation.
 */
describe("a wall must be the thing that caused this hold", () => {
  const line = (r: StartRowInput) => startRowMiddle(r, NOW, KIND_WORD, phrase, "UTC");
  /** `a30d6b62` exactly as it stood when this was read. */
  const walkedOn: StartRowInput = {
    ...CIRCLES,
    station: "build",
    stationName: "Build",
    holdReason: "produced-nothing",
    holdBecause: "The last thing it tried was repo.tree, which said: No repository is connected.",
    drivenAt: "2026-09-09T23:20:28Z",
    stoppedBecause: { kind: "out_of_credit", at: "2026-09-04T05:41:36Z", now: "gone" },
  };

  it("says nothing about credit when a later drive produced the hold", () => {
    expect({ mentionsCredit: /credit/i.test(line(walkedOn)) }).toEqual({ mentionsCredit: false });
  });

  it("says the driver's own account of THIS hold instead", () => {
    // The repository sentence is the true one and it was already on the row.
    expect(line(walkedOn)).toContain("repo.tree");
  });

  it("still says the wall when the halt IS from the last drive", () => {
    // The mirror. A halt at or after the drive that set the hold is exactly
    // what the sentence was written for.
    const sameDrive = {
      ...walkedOn,
      stoppedBecause: {
        kind: "out_of_credit",
        at: "2026-09-09T23:20:30Z",
        now: "standing" as const,
      },
    };
    expect(line(sameDrive)).toBe("Stopped: the account ran out of credit, so the seat never ran.");
  });

  it("still says the wall when nothing has driven it since", () => {
    /*
     * `drivenAt` null is the state the two released tracks are in: nothing has
     * run since the hold was written, so the newest halt is still the best
     * account of why it stopped.
     */
    const notDrivenSince = { ...walkedOn, drivenAt: null };
    expect(line(notDrivenSince)).toBe("It ran out of credit and stopped. There is credit again.");
  });
});
