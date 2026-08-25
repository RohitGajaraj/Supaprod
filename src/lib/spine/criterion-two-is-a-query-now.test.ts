/**
 * F-55 / queue 63. ACCEPTANCE CRITERION 2 BECOMES ONE QUERY.
 *
 * *"No human intervention mid-run — no unsticking, no database edit, no re-drive
 * by hand."* Until this landed, **nothing on the record could tell those apart
 * from an unattended tick.** `driveTrackOnce` stamped `actor: 'system'` and did
 * not know its own caller; its two callers are the sweep (service role, nobody
 * watching) and `driveTrackNow` (a person pressing a control). Both wrote the
 * identical row.
 *
 * IT WAS FOUND BY SOMEONE MAKING THE MISTAKE, which is the only reason it is
 * fixed. On 2026-08-25 at 09:32 a session wrote up track `48eee889`'s Build walk
 * as unattended — *"no human touched the run"* — on the strength of
 * `SELECT from_stage, to_stage, actor, at FROM stage_events`, every row of which
 * reads `actor: system`. Another session had driven it by hand on the watched
 * path. **The query was correct and answered a neighbouring question.** Third
 * time in a week: `driven_at` in the wrong timezone (X-07), `station` as a
 * record of a journey (X-08), and `actor` as a record of attendance.
 *
 * Session A ruled the shape, and two parts of that ruling are stronger than what
 * was proposed, so they are pinned here rather than left to style:
 *
 *  - **REQUIRED, not defaulted.** A default answers for a caller that never
 *    considered the question, and the answer it invents is the one that CLAIMS
 *    autonomy. A required parameter cannot be forgotten.
 *  - **NO BACKFILL.** Historic rows genuinely do not know. Writing `'sweep'`
 *    across 2,893 of them would fabricate exactly the evidence criterion 2 turns
 *    on, so NULL stays readable as "recorded before the question existed".
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const DRIVER = read("./driver.server.ts");
const WATCHED = read("./track.functions.ts");
const SWEEP = read("../../routes/api/public/hooks/track-tick.ts");
const EVENTS = read("../stage-events.server.ts");
const MIGRATION = read(
  "../../../supabase/migrations/20260825100000_a_transition_records_whether_anyone_was_watching.sql",
);
const TRACKRUN = read("../../components/track/TrackRun.tsx");
const SPLIT_MIGRATION = read(
  "../../../supabase/migrations/20260825113500_one_press_is_not_ten_presses.sql",
);

describe("both callers have to say which they are", () => {
  /**
   * THE TYPE IS THE ENFORCEMENT. If `via` were optional, `tsc` would pass with
   * neither caller saying anything and the column would be uniformly NULL —
   * present, plausible, and useless.
   */
  it("the parameter is required, not defaulted", () => {
    const sig = DRIVER.slice(
      DRIVER.indexOf("export async function driveTrackOnce("),
      DRIVER.indexOf("): Promise<DriveOutcome> {"),
    );
    expect(sig).toContain("via: DrivenVia,");
    expect(sig).not.toContain("via: DrivenVia =");
    expect(sig).not.toContain("via?: DrivenVia");
  });

  it("the unattended sweep declares itself the sweep", () => {
    expect(SWEEP).toContain('driveTrackOnce(client, row, "sweep"');
  });

  /**
   * Queue 64. The watched walk no longer answers for its caller: it FORWARDS
   * the caller's own answer, and the input schema makes that answer required.
   * `"foreground"` is retired as a writable value — a watched row now says
   * whether a person caused it (`press`) or the client was walking on from a
   * window-closed leg (`continuation`), which is the difference between one
   * press buying a route and ten nudges pretending to be one.
   */
  it("the watched walk forwards its caller's origin, and requires one", () => {
    expect(WATCHED).toContain('z.enum(["press", "continuation"])');
    expect(WATCHED).toContain("driveTrackOnce(supabase, driveRow as never, data.origin");
    // The retired umbrella must never be writable again from this path.
    expect(WATCHED).not.toContain('driveTrackOnce(supabase, driveRow as never, "foreground"');
  });

  it("every press site says press, and only the window-closed leg says continuation", () => {
    // Exactly one continuation: the auto-continue timer. A second one appearing
    // is a call site claiming nobody acted when the code cannot know that.
    expect([...TRACKRUN.matchAll(/run\.mutate\("continuation"\)/g)].length).toBe(1);
    // The three human acts: composer landing (auto-start), the Run control,
    // and a gate being answered.
    expect([...TRACKRUN.matchAll(/run\.mutate\("press"\)/g)].length).toBe(3);
    // No call site left that never considered the question.
    expect(TRACKRUN).not.toContain("run.mutate()");
  });

  /**
   * Exactly two callers, so a third appearing without a literal is a caller
   * that has not thought about it. The type already forces a value; this catches
   * a value passed THROUGH from somewhere that does not know.
   */
  it("has no third caller quietly forwarding somebody else's answer", () => {
    const calls = [...DRIVER.matchAll(/driveTrackOnce\(/g)].length;
    // One definition in driver.server.ts, none calling it there.
    expect(calls).toBe(1);
  });
});

describe("what it must not do", () => {
  /**
   * `actor` is unchanged and must stay unchanged: production holds agent slugs,
   * `human` and `system` across 2,000+ rows with many readers, and it answers
   * WHO DID THIS. Agents did the work on both paths. Overloading it would have
   * made every existing reader subtly wrong.
   */
  it("leaves actor alone, because it answers a different question", () => {
    const write = DRIVER.slice(
      DRIVER.indexOf('entityType: "spine_track"'),
      DRIVER.indexOf('entityType: "spine_track"') + 700,
    );
    expect(write).toContain('actor: "system"');
    expect(write).toContain("drivenVia: via");
  });

  it("never invents an answer when the writer does not know", () => {
    expect(EVENTS).toContain("driven_via: ev.drivenVia ?? null");
    // The one thing that would quietly destroy the field's meaning.
    expect(EVENTS).not.toContain('drivenVia ?? "sweep"');
  });

  /**
   * NO BACKFILL. The migration must not touch the 2,893 rows that predate the
   * question, and must not make the column NOT NULL — either would let a query
   * proving autonomy be satisfied by a row that never knew.
   */
  it("does not backfill history into an answer it never had", () => {
    expect(MIGRATION).not.toMatch(/update\s+public\.stage_events\s+set/i);
    expect(MIGRATION).not.toContain("not null");
    expect(MIGRATION).toContain("driven_via is null or driven_via in ('sweep', 'foreground')");
  });

  /**
   * Queue 64's split obeys the same law. `'foreground'` rows predate the
   * press/continuation question and honestly cannot answer it; rewriting them
   * as either value would fabricate the distinction the split exists to record,
   * so the constraint keeps the old value readable and no row is touched.
   */
  it("the split keeps foreground readable and rewrites nothing", () => {
    expect(SPLIT_MIGRATION).not.toMatch(/update\s+public\.(stage_events|spine_tracks)\s+set/i);
    expect(SPLIT_MIGRATION).not.toContain("not null");
    expect(SPLIT_MIGRATION).toContain(
      "driven_via is null or driven_via in ('sweep', 'foreground', 'press', 'continuation')",
    );
    expect(SPLIT_MIGRATION).toContain(
      "last_driven_via is null or last_driven_via in ('sweep', 'foreground', 'press', 'continuation')",
    );
  });
});

describe("the track-level stamp, which is the half about intervention", () => {
  /**
   * A PERSON PRESSING RUN ON A TRACK THAT THEN HOLDS writes no `stage_events`
   * row at all, because nothing moved — and that is precisely the "unsticking"
   * criterion 2 forbids. A field recorded only on transitions would miss every
   * one of them.
   */
  it("is written on ENTRY, before anything can decide not to move", () => {
    // Scoped to the function BODY. Comparing against the whole file matched
    // `harvestAnsweredGates`'s definition, which sits earlier than the call, and
    // the assertion passed on a coincidence of layout rather than on order.
    const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));
    const entry = body.indexOf("last_driven_via: via");
    const firstRealWork = body.indexOf("await harvestAnsweredGates(");
    expect(entry).toBeGreaterThan(-1);
    expect(firstRealWork).toBeGreaterThan(-1);
    expect(entry).toBeLessThan(firstRealWork);
    // And before the decision that can refuse the drive outright.
    expect(entry).toBeLessThan(body.indexOf("const decision = decideDrive("));
  });

  /**
   * Once, not on each of the eight paths that write `driven_at` — two columns
   * that must agree, written in eight places, is how they come to disagree.
   */
  it("is written exactly once", () => {
    expect([...DRIVER.matchAll(/last_driven_via: via/g)].length).toBe(1);
  });
});
