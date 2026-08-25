/**
 * F-62. THE INTERVENTION WAS STORED IN A SLOT, AND THE NEXT SWEEP ERASED IT.
 *
 * This is a correction to F-55's own fix, and the ratio is the finding.
 * Measured in production on 2026-08-25: **2,199 `agent_runs` carry a `track_id`
 * against 127 `stage_events` rows of `entity_type='spine_track'`**, so roughly
 * **94% of drives move no station and leave no transition row at all**.
 *
 * `spine_tracks.last_driven_via` was added to catch that 94% and it is ONE
 * COLUMN, stamped on entry, last-write-wins. A person presses run on a stalled
 * track at 10:05; the unattended sweep drives it at 10:15; the column reads
 * `sweep`. **The next tick erases the evidence of the intervention it should
 * disqualify** — and what survives is not "does not know" but a surviving claim
 * of autonomy, which is the one direction F-55 was written to fail away from.
 *
 * `BUILD-QUEUE` item 63 states criterion 2's proof as *"every transition
 * `driven_via='sweep'`"*. By construction that query cannot see 94% of the
 * drives, so it cannot see the interventions either.
 *
 * WHAT THESE TESTS PIN, beyond "the code compiles":
 *
 *  - the log is APPENDED, so two drives leave two rows and the press survives
 *    the sweep that follows it — the exact sequence the slot could not hold;
 *  - it is written ON ENTRY, before anything can decide not to move, because a
 *    press on a track that then HOLDS is the case with no transition to record;
 *  - the slot is NOT replaced. A missing log row reads as "no drive happened",
 *    which is the unsafe direction, so `last_driven_via` stays as the second
 *    witness of the last drive;
 *  - the two hand paths that never touch `driveTrackOnce` are in the log too. A
 *    log with a hole in it is worse than no log, because it reads clean.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { recordTrackDrive } from "./track-drives.server";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const DRIVER = read("./driver.server.ts");
const WATCHED = read("./track.functions.ts");
const MODULE = read("./track-drives.server.ts");
const MIGRATION = read(
  "../../../supabase/migrations/20260825130000_an_intervention_stored_in_a_slot_is_erased_by_the_next_sweep.sql",
);

/** A Supabase stand-in that remembers every insert and can be told to fail. */
function fakeClient(fail?: { message: string } | "throw") {
  const inserted: Array<{ table: string; values: Record<string, unknown> }> = [];
  return {
    inserted,
    from(table: string) {
      return {
        insert(values: Record<string, unknown>) {
          if (fail === "throw") throw new Error("connection reset");
          inserted.push({ table, values });
          return Promise.resolve({ error: fail ?? null });
        },
      };
    },
  };
}

describe("a log, because a slot is overwritten", () => {
  /**
   * THE WHOLE FINDING IN ONE TEST. 10:05 a person presses run on a stalled
   * track; 10:15 the sweep drives it. With one column the second write erases
   * the first and the record says the loop was unattended. Appended, both are
   * there and the press is still disqualifying an hour later.
   */
  it("keeps the 10:05 press after the 10:15 sweep drives the same track", async () => {
    const client = fakeClient();
    await recordTrackDrive(client, {
      trackId: "t1",
      station: "build",
      via: "press",
      entryHold: "station-cannot-finish",
    });
    await recordTrackDrive(client, { trackId: "t1", station: "build", via: "sweep" });

    expect(client.inserted).toHaveLength(2);
    expect(client.inserted.every((r) => r.table === "track_drives")).toBe(true);
    expect(client.inserted.map((r) => r.values.driven_via)).toEqual(["press", "sweep"]);
    // The criterion-2 read: one press anywhere in the run disqualifies it, and
    // the sweep that followed cannot take that back.
    expect(client.inserted.some((r) => r.values.driven_via === "press")).toBe(true);
  });

  /**
   * `entry_hold` is what makes an intervention legible AS one. A press against a
   * non-null hold is a person reaching for a stalled track — the sentence
   * criterion 2 forbids — readable in one row with no join.
   */
  it("records where the drive found the work and what was holding it", async () => {
    const client = fakeClient();
    await recordTrackDrive(client, {
      trackId: "t1",
      station: "define",
      via: "press",
      entryHold: "given-up",
    });
    expect(client.inserted[0].values).toEqual({
      track_id: "t1",
      station: "define",
      driven_via: "press",
      entry_hold: "given-up",
    });
  });

  /** A drive on a track that was not held says so, rather than omitting it. */
  it("writes null rather than nothing when the track was not held", async () => {
    const client = fakeClient();
    await recordTrackDrive(client, { trackId: "t1", station: "sense", via: "sweep" });
    expect(client.inserted[0].values.entry_hold).toBeNull();
  });
});

describe("recording a drive can never break the drive", () => {
  /**
   * `recordStageEvent`'s contract, for the same reason: history is not worth a
   * run. Both directions of failure are covered because a Supabase client can
   * return an error OR throw, and a helper that only handles one of those is a
   * helper that takes the loop down on the other.
   */
  it("swallows a write error", async () => {
    const client = fakeClient({ message: "permission denied for table track_drives" });
    await expect(
      recordTrackDrive(client, { trackId: "t1", station: "ship", via: "sweep" }),
    ).resolves.toBeUndefined();
  });

  it("swallows a client that throws", async () => {
    const client = fakeClient("throw");
    await expect(
      recordTrackDrive(client, { trackId: "t1", station: "ship", via: "press" }),
    ).resolves.toBeUndefined();
  });

  /**
   * AND IT SAYS SO. A silent logging fault leaves the log quietly short, and a
   * short log reads as an unattended run — so the one thing this must not do is
   * fail quietly.
   */
  it("says so on the way past, because a short log reads as autonomy", () => {
    expect(MODULE).toContain("track_drives write failed (track ${drive.trackId})");
    expect(MODULE).toContain("track_drives write threw (track ${drive.trackId})");
  });
});

describe("the driver writes it on entry, which is the case with no transition", () => {
  /**
   * A person pressing run on a track that then HOLDS writes no `stage_events`
   * row, because nothing moved — and that is precisely the unsticking criterion
   * 2 forbids. Recorded only on the way out, this would miss every one of them.
   */
  it("is written before anything can decide not to move", () => {
    const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));
    const log = body.indexOf("await recordTrackDrive(supabase, {");
    expect(log).toBeGreaterThan(-1);
    expect(log).toBeLessThan(body.indexOf("await harvestAnsweredGates("));
    expect(log).toBeLessThan(body.indexOf("const decision = decideDrive("));
  });

  /**
   * BEFORE THE SLOT, deliberately. If only one of the two survives a crash
   * between them, the one worth keeping is the one that cannot be overwritten.
   */
  it("goes in ahead of the column it is correcting", () => {
    const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));
    expect(body.indexOf("await recordTrackDrive(supabase, {")).toBeLessThan(
      body.indexOf("last_driven_via: via"),
    );
  });

  /**
   * THE SLOT IS NOT REPLACED. A missing log row reads as "no drive happened" —
   * the unsafe direction, where `stage_events` fails to a NULL that reads as
   * "does not know". So `last_driven_via` stays as an independent second witness
   * of the LAST drive: if it disagrees with the newest logged row, the log lost
   * something and the run is not provable.
   */
  it("leaves last_driven_via in place as the second witness", () => {
    expect([...DRIVER.matchAll(/last_driven_via: via/g)].length).toBe(1);
    expect(MODULE).toContain("spine_tracks.last_driven_via");
    expect(MODULE).toContain("is deliberately still written beside");
  });

  /** Once per drive. Two rows for one drive would overcount the interventions. */
  it("is written exactly once per drive", () => {
    const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));
    expect([...body.matchAll(/await recordTrackDrive\(supabase, \{/g)].length).toBe(1);
  });
});

describe("the hand paths that never touch driveTrackOnce", () => {
  /**
   * A LOG WITH A HOLE IN IT IS WORSE THAN NO LOG, because it reads clean.
   * `advanceTrack` moves a station by itself and `retryStation` clears the hold
   * by itself; neither goes near `driveTrackOnce`. A criterion-2 query over
   * `track_drives` alone would have missed both — and they are the two most
   * literal readings of the words criterion 2 uses.
   */
  it("logs the hand-advance and the release, both as a press", () => {
    const advance = WATCHED.slice(
      WATCHED.indexOf("export const advanceTrack ="),
      WATCHED.indexOf("export const retryStation ="),
    );
    const retry = WATCHED.slice(
      WATCHED.indexOf("export const retryStation ="),
      WATCHED.indexOf("export const setStationWaiver ="),
    );
    for (const [name, src] of [
      ["advanceTrack", advance],
      ["retryStation", retry],
    ] as const) {
      expect(src, name).toContain("await recordTrackDrive(supabase, {");
      expect(src, name).toContain('via: "press",');
      expect(src, name).toContain("entryHold: (raw.last_hold ?? null) as HoldReason | null,");
    }
  });

  /**
   * `retryStation` IS THE WORD "UNSTICKING" AND IT RECORDED NOTHING. Its
   * `recordStageEvent` call passes the same station as both ends, and the helper
   * opens `if (ev.from != null && ev.from === ev.to) return;` — so the row its
   * own comment describes has never been inserted.
   *
   * That dead call is left alone here (removing it, or opting past the guard, is
   * the session owner's decision on a guard 50+ call sites rely on) — but the
   * fact it records now has a home that does not depend on it.
   */
  it("does not depend on the same-station stage event, which never inserts", () => {
    const EVENTS = read("../stage-events.server.ts");
    expect(EVENTS).toContain("if (ev.from != null && ev.from === ev.to) return;");
    const retry = WATCHED.slice(
      WATCHED.indexOf("export const retryStation ="),
      WATCHED.indexOf("export const setStationWaiver ="),
    );
    // Still same-station, still swallowed, and now no longer the only record.
    expect(retry).toContain("from: track.station,");
    expect(retry).toContain("to: track.station,");
    expect(retry.indexOf("await recordTrackDrive(supabase, {")).toBeLessThan(
      retry.indexOf("await recordStageEvent(supabase, {"),
    );
  });
});

describe("the migration keeps F-55's laws rather than restating them", () => {
  /**
   * NO BACKFILL, on exactly the law the F-55 migration set. Writing 'sweep'
   * across drives that were never recorded would fabricate the evidence
   * criterion 2 turns on. The table starts empty and the migration asserts it.
   */
  it("invents no history for the 2,199 drives that predate it", () => {
    expect(MIGRATION).not.toMatch(/insert\s+into\s+public\.track_drives/i);
    expect(MIGRATION).toContain("track_drives must start empty");
  });

  /**
   * NOT NULL here is not a contradiction of F-55's nullable column, and the
   * difference is the reason: that column was added to a table of 2,893 rows
   * that honestly did not know. This table is created empty. A DEFAULT would
   * still be the F-55 hazard, so there is none.
   */
  it("requires the value and defaults nothing", () => {
    expect(MIGRATION).toContain(
      "driven_via  text not null check (driven_via in ('sweep', 'press', 'continuation'))",
    );
    expect(MIGRATION).not.toMatch(/driven_via[^\n]*default/i);
  });

  /**
   * 'foreground' exists on `stage_events` only to keep rows written before queue
   * 64's press/continuation split readable. Nothing before the split can be in a
   * table created after it, so accepting the value would be inviting a writer
   * that must not exist.
   */
  it("does not accept the historical value it has no history for", () => {
    const check = MIGRATION.slice(
      MIGRATION.indexOf("create table if not exists public.track_drives"),
      MIGRATION.indexOf("comment on table public.track_drives"),
    );
    expect(check).toContain("check (driven_via in ('sweep', 'press', 'continuation'))");
    expect(check).not.toContain("check (driven_via in ('sweep', 'foreground'");
    // Named in the prose so the omission reads as a decision, not an oversight.
    expect(MIGRATION).toContain("'foreground' is NOT accepted");
  });

  /**
   * APPEND-ONLY FROM THE APP'S SEAT: select and insert, no UPDATE or DELETE
   * policy, the posture `stage_events` and `cost_incidents` already take.
   */
  it("gives the app no way to edit or delete a drive", () => {
    expect(MIGRATION).toContain("grant select, insert on public.track_drives to authenticated;");
    expect(MIGRATION).not.toMatch(/create policy[^;]*for (update|delete)/i);
    expect(MIGRATION).toContain("for select");
    expect(MIGRATION).toContain("for insert");
  });

  /**
   * The proof query is written down WITH the change, because the last one was
   * not and item 63 has been quoting an unsound one since.
   */
  it("states criterion 2's proof query on the table itself", () => {
    expect(MIGRATION).toContain(
      "SELECT driven_via, count(*) FROM track_drives WHERE track_id = $1 GROUP BY 1",
    );
  });

  /**
   * AND WHAT IT STILL CANNOT DO. A direct database edit leaves no row here and
   * nothing in this schema can catch that — said out loud so the next reader
   * does not make F-55's mistake in a new direction.
   */
  it("says what it does not cover", () => {
    expect(MIGRATION).toContain("A direct database edit still leaves no row here");
  });
});
