/**
 * A column reaching the SELECT is not a column reaching the reader.
 *
 * REQ-021 added `track_id` to the `agent_runs` select in `listMissions`, and
 * that looked like the job was done. It was not. The mapping loop reduces each
 * run to `{ status }` for the step dots and pulls out `agent_slug` for the row,
 * and **`track_id` was read from the database and then dropped on the floor**
 * three lines later. `MissionListRow` never named it, so `AppFrame` could not
 * read it, because **the shell-facing type IS the contract**.
 *
 * LANE 1 found this by checking the state rather than trusting the previous
 * answer, which is the right instinct and the reason this file exists: the
 * fix and its evidence now sit together, so the next person does not have to
 * re-derive that a select and a surface are two different questions.
 *
 * Same family as the recurring defect in this repo — `getTrackGates` with zero
 * callers, `decideApprovalItems` built with none, `approval_snoozes` with no
 * reader. **Something existing is not something being reached.**
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(
  fileURLToPath(new URL("./missions.functions.ts", import.meta.url)),
  "utf8",
);

/** Comments stripped: this fix's own prose quotes the shape it replaced. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("track_id travels from the query all the way to the row", () => {
  it("is still asked for", () => {
    expect(CODE).toContain("id,mission_id,status,created_at,agent_slug,track_id");
  });

  it("is captured in the loop that reduces the runs", () => {
    expect(CODE).toContain("if (r.track_id) trackByMission.set(r.mission_id, r.track_id);");
  });

  it("is named on the shell-facing type, which is the contract", () => {
    expect(CODE).toContain("trackId: string | null;");
  });

  it("is set when the row is built", () => {
    expect(CODE).toContain("trackId: trackByMission.get(m.id) ?? null,");
  });
});

describe("the rules it inherits from the slug beside it", () => {
  /**
   * The runs arrive `ascending: true` by `created_at`, so the last write per
   * mission is the most recent run. The comment on the slug says reversing this
   * would "silently pin every mission to its FIRST agent"; the same reversal
   * would pin every mission to its first track.
   */
  it("still reads the runs oldest-first, which is what makes last-write-wins mean latest", () => {
    expect(CODE).toContain('.order("created_at", { ascending: true })');
  });

  /**
   * NON-NULL wins, not newest-wins. A mission's runs all serve one piece of
   * work, so an older run that recorded the track is still telling the truth,
   * while a newer run with none only predates the link. An unconditional
   * assignment would let a pre-loop run erase a good answer.
   */
  it("only overwrites when the run actually knew its track", () => {
    expect(CODE).toMatch(/if \(r\.track_id\) trackByMission\.set/);
    expect(CODE).not.toMatch(/trackByMission\.set\(r\.mission_id, r\.track_id \?\? null\)/);
  });

  /** Null is one of three honest states and must not become a thrown page. */
  it("degrades to null rather than omitting the field", () => {
    expect(CODE).toContain("trackByMission.get(m.id) ?? null");
  });
});

describe("the reason it is on the run and not on the mission stays recorded", () => {
  it("keeps the note that missions has no such column", () => {
    const prose = SRC.replace(/\n\s*\* ?/g, " ").replace(/\s+/g, " ");
    expect(prose).toContain("`missions` has no");
    expect(prose).toContain("42703");
  });
});
