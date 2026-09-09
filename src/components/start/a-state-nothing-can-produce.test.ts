/**
 * ── A STATE NOTHING CAN PRODUCE ──────────────────────────────────────────────
 *
 * `check:unreachable` holds that a server function or a component with no
 * importer is dead. This is the same gate one level down: a member of a state
 * union that no input can produce is dead in exactly the same way, and it is
 * harder to see, because it typechecks, it appears in every exhaustive map
 * beside its live neighbours, and a `Record<State, T>` will insist on it.
 *
 * ── THE DEFECT THIS EXISTS TO KILL (Lane 1, 2026-09-09) ─────────────────────
 * `failed` was given a filled node on the road, ruled on in the design
 * contract, and written into the findings ledger as an improvement a person
 * could see. It drew nowhere. `journeyMap` filters `status === "open"` BEFORE
 * calling `standingState`, and `standingState` answers `failed` only for
 * `status === "abandoned"`, so the map cannot emit it and `WEIGHT.failed` has
 * never been read. The token was correct and unreachable at once.
 *
 * ── WHY IT DRIVES THE PRODUCERS INSTEAD OF READING THEM ─────────────────────
 * A guard that greps for `"failed"` in this file PASSES today: the string is
 * there, in `WEIGHT`, in the union, in a paint map. Only calling the function
 * over its inputs can tell the difference between a state that is written down
 * and a state that is reachable, and that difference is the whole finding.
 *
 * ── AND IT ASSERTS BOTH SIDES (law 12) ──────────────────────────────────────
 * A guard that only names what is unreachable passes just as happily if the
 * sweep produces nothing at all, which is a broken harness reading as a clean
 * union forever. So every state is claimed as reachable OR unreachable, the
 * two sets are checked disjoint and complete, and the reachable set is
 * asserted by name.
 */
import { describe, expect, it } from "bun:test";
import { JOURNEY_ORDER, type JourneyState } from "@/components/meridian/Journey";
import { HOLD_LINE } from "@/lib/spine/driver";
import { journeyMap, journeyOfRun, standingState, type RunLike } from "./journey-of-a-run";

const ALL_STATES: readonly JourneyState[] = [
  "pending",
  "working",
  "done",
  "held",
  "stopped",
  "scheduled",
  "waiting",
  "you",
  "failed",
  "waived",
  "unread",
];

const NOW = Date.parse("2026-09-09T12:00:00.000Z");

/**
 * THE INPUT SPACE, ENUMERATED RATHER THAN SAMPLED. Every status the read can
 * answer with, every hold reason the driver defines (from its own record, so a
 * new reason enters this sweep without anyone remembering to add it), a
 * horizon sentence and an ordinary one, and a seat present or absent. Around
 * nine hundred rows, which is nothing to run and is the actual domain.
 */
function everyRun(): RunLike[] {
  const statuses = ["open", "done", "abandoned"] as const;
  const holds = [null, ...Object.keys(HOLD_LINE)];
  const becauses = [null, "The forecast comes due on 3 October", "because the spec moved"];
  const out: RunLike[] = [];
  for (const status of statuses) {
    for (const holdReason of holds) {
      for (const needsYou of [false, true]) {
        for (const holdBecause of becauses) {
          for (const seated of [false, true]) {
            out.push({
              station: JOURNEY_ORDER[2],
              status,
              needsYou,
              holdReason,
              holdBecause,
              produced: [],
              forecast: null,
              drivenAt: null,
              working: seated
                ? { seat: "builder", since: "2026-09-09T11:59:00.000Z", lastCallAt: null }
                : null,
            } as unknown as RunLike);
          }
        }
      }
    }
  }
  return out;
}

const RUNS = everyRun();

/** Every state a producer actually emits when driven over the space above. */
const reached = (produce: (r: RunLike) => Iterable<JourneyState>): Set<JourneyState> => {
  const seen = new Set<JourneyState>();
  for (const r of RUNS) for (const s of produce(r)) seen.add(s);
  return seen;
};

/** The claim, made in both directions at once so neither half can pass alone. */
function claim(name: string, seen: Set<JourneyState>, expected: readonly JourneyState[]) {
  const unreachable = ALL_STATES.filter((s) => !expected.includes(s));
  it(`${name} produces exactly the states claimed for it`, () => {
    expect([...seen].sort()).toEqual([...expected].sort());
  });
  it(`${name} cannot produce the rest, and the two sides account for the union`, () => {
    for (const s of unreachable) expect(seen.has(s)).toBe(false);
    // Complete and disjoint: no state is claimed twice or left unclaimed, so a
    // state added to the union has to be placed on one side or the other.
    expect([...expected, ...unreachable].sort()).toEqual([...ALL_STATES].sort());
    // And the sweep found SOMETHING, or an empty harness reads as a clean union.
    expect(seen.size).toBeGreaterThan(0);
  });
}

describe("a state nothing can produce is dead the way an unimported export is", () => {
  /*
   * `standingState` answers for ONE run standing where it stands. It never
   * says `done`, `pending`, `waived` or `unread`, because those are facts
   * about a station's position on the road or about a read that refused, not
   * about the run: `journeyOfRun` supplies the first two from the index and
   * nothing supplies the last two here.
   */
  claim(
    "standingState",
    reached((r) => [standingState(r)]),
    ["failed", "you", "working", "scheduled", "stopped", "held", "waiting"],
  );

  /*
   * `journeyOfRun` adds the two positional states, so it reaches everything
   * except `waived` (a station a person set aside, which the run row has no
   * input for) and `unread` (only the run screen's own artifacts read can
   * refuse). It DOES reach `failed`, and it is the only producer that does.
   */
  claim(
    "journeyOfRun",
    reached((r) => journeyOfRun(r, NOW).map((s) => s.state)),
    ["done", "pending", "failed", "you", "working", "scheduled", "stopped", "held", "waiting"],
  );

  /*
   * `journeyMap` CANNOT REACH `failed`, and this is the finding rather than an
   * oversight: it filters to open runs before asking, and only an abandoned
   * run is failed. It cannot reach `done` either, because `standingState` has
   * no done branch and the map's own default is `pending`.
   *
   * The entry is left in `WEIGHT` deliberately -- it is correct the moment
   * anything abandoned reaches this producer, and deleting it would leave the
   * next author to re-derive the ordering with the reasoning gone. What this
   * test refuses to allow is the SECOND half of that: a paint, a ruling or a
   * ledger row claiming a person can see a state this producer cannot emit.
   */
  claim(
    "journeyMap",
    reached((r) => journeyMap([r]).map((s) => s.state)),
    ["pending", "you", "working", "scheduled", "stopped", "held", "waiting"],
  );
});
