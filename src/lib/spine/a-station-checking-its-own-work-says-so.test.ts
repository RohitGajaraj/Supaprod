/**
 * THE SELF-CHECK RAN ON EVERY DRIVE AND SAID NOTHING WHEN IT PASSED.
 *
 * ── THE GAP ────────────────────────────────────────────────────────────────
 * `verifyStationOutput` runs at the end of every drive of every station. Its
 * result reached the database through exactly one path: `spine_tracks.last_hold`
 * and `last_hold_because`, which are written ONLY on a failure and overwritten
 * by the next drive.
 *
 * So the check that happens almost every time was invisible almost every time,
 * and no number anywhere could answer "how many times did this run check its own
 * work". For a product whose claim is that a person can watch the loop work,
 * that is the wrong half to keep.
 *
 * ── WHAT THE COUNT MAY NOT BE ──────────────────────────────────────────────
 * A constant. "One check per station" is wrong in both directions on a single
 * run: Ship compares nothing by design, Build compares two things. Every figure
 * is derived from the `self_check` arrays the checks themselves wrote, which is
 * why `summariseSelfChecks` is a pure function over rows and is tested as one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  EMPTY_SELF_CHECKS,
  selfCheckLine,
  selfCheckSentence,
  summariseSelfChecks,
} from "@/lib/spine/track.functions";
import { mergeActivityRows } from "@/components/spine/activity-rows";

const held = (what: string) => ({ what, held: true });
const missed = (what: string, why: string) => ({ what, held: false, why });

describe("counted from what was compared", () => {
  it("counts the comparisons, not the drives", () => {
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [held("A change was staged"), held("The checks ran")] },
        { station: "define", self_check: [held("A spec was written")] },
      ],
      null,
    );
    expect(t.drives).toBe(2);
    expect(t.compared).toBe(3);
    expect(t.held).toBe(3);
    expect(t.missed).toBe(0);
  });

  it("a drive that compared nothing is not a check", () => {
    /*
     * Ship, by design. Counting it would inflate "checked its own work" with a
     * drive where nothing was checked, which is the number this exists to stop
     * being. `[]` and NULL both mean no comparison was recorded, for different
     * reasons, and neither is a check.
     */
    const t = summariseSelfChecks(
      [
        { station: "ship", self_check: [] },
        { station: "ship", self_check: null },
        { station: "learn", self_check: [held("The forecast was graded")] },
      ],
      null,
    );
    expect(t.drives).toBe(1);
    expect(t.compared).toBe(1);
  });

  it("separates what held from what did not", () => {
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          self_check: [
            held("A change was staged"),
            missed("The checks ran and cleared this change", "The checks were never run"),
          ],
        },
      ],
      null,
    );
    expect(t.held).toBe(1);
    expect(t.missed).toBe(1);
    expect(t.compared).toBe(2);
  });

  it("counts a retry from the hold the drive arrived on, not from a sequence", () => {
    /*
     * `entry_hold = 'self-check-failed'` is a station running again because its
     * own check refused what it filed. The log records that at the moment it is
     * true, which is the only way to count it without guessing at the shape of a
     * sequence of drives.
     */
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [missed("The checks ran", "never run")] },
        {
          station: "build",
          entry_hold: "self-check-failed",
          self_check: [held("A change was staged"), held("The checks ran")],
        },
      ],
      null,
    );
    expect(t.retries).toBe(1);
  });

  it("a drive held for something else is not a retry", () => {
    const t = summariseSelfChecks(
      [{ station: "build", entry_hold: "waiting-on-a-person", self_check: [held("x")] }],
      null,
    );
    expect(t.retries).toBe(0);
  });

  it("survives a column holding anything at all", () => {
    for (const raw of ["nope", 3, {}, [null], [{ held: true }], [{ what: "  ", held: true }]]) {
      const t = summariseSelfChecks([{ station: "build", self_check: raw }], null);
      expect(t.drives).toBe(0);
      expect(t.compared).toBe(0);
    }
  });

  it("says when it could not read, so a zero is not mistaken for a fact", () => {
    const t = summariseSelfChecks([], "column track_drives.self_check does not exist");
    expect(t.compared).toBe(0);
    expect(t.unreadable).toBe("column track_drives.self_check does not exist");
  });
});

describe("the sentence on the strip", () => {
  it("says nothing when nothing was checked", () => {
    // `GotYou` is a list of what the run GOT you, and a zero is not one of those
    // -- the same refusal that strip already makes about time and money.
    expect(selfCheckLine(EMPTY_SELF_CHECKS)).toBeNull();
    expect(selfCheckLine(null)).toBeNull();
  });

  it("names the drives and the comparisons, which are different numbers", () => {
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [held("a"), held("b")] },
        { station: "learn", self_check: [held("c")] },
      ],
      null,
    );
    expect(selfCheckLine(t)).toBe("2 self-checks · 3 things compared");
  });

  it("names a miss and a retry only when there is one", () => {
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [missed("a", "why")] },
        { station: "build", entry_hold: "self-check-failed", self_check: [held("a")] },
      ],
      null,
    );
    expect(selfCheckLine(t)).toBe("2 self-checks · 2 things compared · 1 did not hold · 1 retry");
  });

  it("counts one as one", () => {
    const t = summariseSelfChecks([{ station: "learn", self_check: [held("a")] }], null);
    expect(selfCheckLine(t)).toBe("1 self-check · 1 thing compared");
  });
});

describe("what the driver records", () => {
  const SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8");
  const flat = SRC.replace(/\s+/g, " ");

  /**
   * The CODE, without the comments about it.
   *
   * Both source assertions below failed on their first run against comments that
   * QUOTE the code they are about -- the ship branch explains why an
   * `ok("Something was released")` would be a lie, and saying so put the string
   * in the branch. A guard a correct explanation can break is a guard that gets
   * its explanation deleted, which is the wrong trade.
   */
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  it("writes the check whether it passed or failed", () => {
    /*
     * THE ASSERTION THAT IS THE FIX. The write has to sit BEFORE the failure
     * branch, because that branch returns -- a write after it would record only
     * the passes, which is the same blindness pointing the other way.
     */
    expect(flat).toContain("await recordSelfCheck(supabase, driveId, verification.checks);");
    expect(flat.indexOf("await recordSelfCheck(supabase, driveId")).toBeLessThan(
      flat.indexOf("if (!verification.passed) {"),
    );
  });

  it("ship still compares nothing, which is the design and not an oversight", () => {
    /*
     * An `ok("Something was released")` in that branch would read well and be a
     * lie: F-36 is why Ship files no artifact kind here, and Ship's real proof is
     * enforced at `release.publish`. A check it claims to have made is the exact
     * constant the count exists to avoid.
     */
    const ship = code(
      SRC.slice(SRC.indexOf('if (station === "ship")'), SRC.indexOf('if (station === "learn")')),
    );
    expect(ship).not.toContain("ok(");
    // And it still returns through `done()`, so the drive records `[]` rather
    // than nothing at all -- "compared nothing" is a fact, and NULL is not.
    expect(ship).toContain("return done();");
  });

  it("every station branch that compares something records it", () => {
    // Cheap and load-bearing: a branch that returns `passed: true` without
    // recording would report a station as never having checked itself.
    const fn = code(
      SRC.slice(
        // From AFTER the `no`/`ok`/`done` helpers, so the helper's own
        // `return { passed: false, ... }` is not read as a branch skipping them.
        SRC.indexOf("const done = () => ({ passed: true, checks });"),
        SRC.indexOf("export async function driveTrackOnce"),
      ),
    );
    expect(fn).not.toContain("return { passed: true };");
    expect(fn).not.toContain("return { passed: false, reason:");
    // Every early return either carries the list or goes through a helper.
    expect(fn).toContain("return { passed: true, checks };");
  });
});

/**
 * ── AND IT IS A ROW IN THE TRANSCRIPT, NOT ONLY A NUMBER ON THE STRIP ──────
 *
 * P-02's fourth acceptance names the FORM: every station's own check writes one
 * transcript row reading *"Checked its own work: N lines held, M did not"*, and
 * on a retry *"retried once"*.
 *
 * A count on the strip was not that. A count with no list behind it is a number
 * nobody can check, which is the same failure the count was added to end one
 * layer down -- so the row carries what the check COMPARED, in the check's own
 * words, and a reader can decide whether the check was worth anything instead of
 * being asked to trust the total.
 */
describe("the row a person reads", () => {
  it("says what held and what did not", () => {
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          at: "2026-09-02T20:50:00Z",
          self_check: [held("A change was staged"), missed("The checks ran", "never run")],
        },
      ],
      null,
    );
    expect(selfCheckSentence(t.entries[0])).toBe("Checked its own work: 1 held, 1 did not");
  });

  it("does not print a zero for the half that did not happen", () => {
    // "2 held, 0 did not" makes a reader look for the thing that failed, and
    // there isn't one. The same refusal the rest of this surface makes.
    const t = summariseSelfChecks(
      [{ station: "learn", at: "2026-09-02T20:50:00Z", self_check: [held("a"), held("b")] }],
      null,
    );
    expect(selfCheckSentence(t.entries[0])).toBe("Checked its own work: 2 held");
  });

  it("says retried once when the drive arrived on a refused check", () => {
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          at: "2026-09-02T21:00:00Z",
          entry_hold: "self-check-failed",
          self_check: [held("a")],
        },
      ],
      null,
    );
    expect(selfCheckSentence(t.entries[0])).toContain("retried once");
  });

  it("carries the comparisons themselves, and the reasons only for the misses", () => {
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          at: "2026-09-02T20:50:00Z",
          self_check: [held("A change was staged"), missed("The checks ran", "never run")],
        },
      ],
      null,
    );
    expect(t.entries[0].what).toEqual(["A change was staged", "The checks ran"]);
    expect(t.entries[0].why).toEqual(["never run"]);
  });

  it("the seat's instruction is carried beside the person's sentence, never inside it", () => {
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          at: "2026-09-08T10:00:00Z",
          self_check: [
            {
              what: "The checks ran and cleared this change",
              held: false,
              why: "The checks were never run on this change.",
              instruction: "Call studio.checks.run and read its verdict before handing this on.",
            },
          ],
        },
      ],
      null,
    );
    expect(t.entries[0].why).toEqual(["The checks were never run on this change."]);
    expect(t.entries[0].instruction).toEqual([
      "Call studio.checks.run and read its verdict before handing this on.",
    ]);
  });

  it("a row written before the split is split on read by the writer's own rule", () => {
    /*
     * Lane 2's finding, 09-08: the transcript printed "The checks were never
     * run on this change. Call studio.checks.run and read its verdict before
     * handing this on." under "Checked its own work". Rows already on the
     * record hold that joined form; the reader must not print the imperative.
     */
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          self_check: [
            missed(
              "The checks ran",
              "The checks were never run on this change. Call studio.checks.run and read its verdict before handing this on.",
            ),
          ],
        },
      ],
      null,
    );
    expect(t.entries[0].why).toEqual(["The checks were never run on this change."]);
    expect(t.entries[0].instruction).toEqual([
      "Call studio.checks.run and read its verdict before handing this on.",
    ]);
  });

  it("the driver writes the two halves as two fields", () => {
    const src = readFileSync("src/lib/spine/driver.server.ts", "utf8");
    // The `no` helper takes the instruction as its own argument and stores it
    // as its own field.
    expect(src).toContain("const no = (what: string, why: string, instruction?: string) => {");
    expect(src).toContain("{ what, held: false, why, instruction }");
    // The seat's note gets both halves; the person's column gets `reason` alone.
    expect(src).toContain("forTheSeat(alreadyRight.reason, alreadyRight.instruction)");
    expect(src).toContain("last_hold_because: verification.reason ?? null");
  });

  it("the rows and the total are summed from one pass, so they cannot disagree", () => {
    /*
     * The failure that matters is not either surface being wrong alone -- it is
     * the strip saying five and the transcript showing four, because then
     * neither can be believed and a person has to go and count.
     */
    const t = summariseSelfChecks(
      [
        { station: "build", at: "2026-09-02T20:50:00Z", self_check: [held("a"), missed("b", "w")] },
        { station: "learn", at: "2026-09-02T21:00:00Z", self_check: [held("c")] },
      ],
      null,
    );
    expect(t.entries.reduce((n, e) => n + e.held + e.missed, 0)).toBe(t.compared);
    expect(t.entries.reduce((n, e) => n + e.held, 0)).toBe(t.held);
    expect(t.entries.reduce((n, e) => n + e.missed, 0)).toBe(t.missed);
    expect(t.entries.length).toBe(t.drives);
  });

  it("a drive with no time never becomes a row", () => {
    /*
     * A row in the wrong place in a chronological stream is worse than one
     * absent: it would claim the station checked itself at a moment it did not.
     * Dropped in `mergeActivityRows`, and the entry still counts in the tally,
     * because it DID happen -- we just cannot say when.
     */
    const t = summariseSelfChecks([{ station: "build", self_check: [held("a")] }], null);
    expect(t.compared).toBe(1);
    expect(mergeActivityRows([], [], [], t.entries)).toEqual([]);
  });

  it("places the row in the stream by its own time", () => {
    const t = summariseSelfChecks(
      [{ station: "build", at: "2026-09-02T20:50:00Z", self_check: [held("a")] }],
      null,
    );
    const rows = mergeActivityRows([], [], [], t.entries);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("check");
    expect(rows[0].at).toBe(Date.parse("2026-09-02T20:50:00Z"));
  });
});

describe("a failed activity read is a failed read, never an empty transcript", () => {
  /*
   * Lane 2, 2026-09-08, live: a seat's `running` row sat in agent_runs for
   * fifty seconds while the transcript read "Nothing is recorded against this
   * work yet". The read has no status filter and RLS admits the row; the only
   * way that sentence appears over a row that exists is the read failing and
   * its failure handed back as `turns: []`.
   */
  const src = readFileSync("src/lib/spine/track.functions.ts", "utf8");
  const from = src.indexOf("export const getTrackActivity");
  const body = src.slice(from, src.indexOf("export const", from + 10));

  it("a refused runs read is thrown with its reason", () => {
    expect(body).toContain("if (runsRes.error) {");
    expect(body).toContain("The turns on this run could not be read:");
  });

  it("the catch re-throws rather than returning the empty shape", () => {
    expect(body).not.toContain(
      "return { turns: [], transitions: [], selfChecks: EMPTY_SELF_CHECKS",
    );
    expect(body).toContain("throw e instanceof Error ? e : new Error(String(e));");
  });
});
