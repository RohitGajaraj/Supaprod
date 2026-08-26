/**
 * A RETRY MUST REMEMBER WHAT IT ALREADY SAID (2026-08-27).
 *
 * `SESSION-0-CONDUCTOR.md` §1 calls this the highest-value change available:
 * *"a station that fails its own check retries WITH THE FAILURE IN ITS CONTEXT
 * rather than advancing or dying silently."* Devin's loop, applied to the spine.
 *
 * Half of it shipped with `selfCheckNote`: a station that FILED something its
 * own check refused is told what the check said.
 *
 * ── THE OTHER HALF WAS THE EXPENSIVE ONE ───────────────────────────────────
 * A station held `produced-nothing` filed nothing, so there is no output to
 * re-check and `selfCheckNote` has nothing to say. It was re-dispatched with the
 * same inputs and NO MEMORY of what it had already concluded.
 *
 * MEASURED on track `a30238f5`: three runs at Discover, each independently
 * answering *"no user-sourced evidence exists"*, none of them aware that the
 * previous run had already searched and reached that exact conclusion. That is
 * not a retry. It is the same run three times, at three times the price, and it
 * is how a track burns twelve drives into the F-43 ceiling without ever
 * learning anything.
 *
 * The crew's own answer was already on the record in `agent_runs.output`. This
 * hands it back, verbatim and truncated, because the words it wrote are what let
 * it recognise its own reasoning instead of spending a dispatch rebuilding it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { producedNothingNote } from "./correction";

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");

describe("the note hands back the crew's own words", () => {
  it("quotes the previous answer rather than summarising it", () => {
    // A summary would be a model call, and this file makes none.
    const note = producedNothingNote("sense", "No user-sourced evidence exists for this.");
    expect(note).toContain("No user-sourced evidence exists for this.");
  });

  it("and tells it plainly that repeating the search repeats the answer", () => {
    const note = producedNothingNote("sense", "No user-sourced evidence exists.");
    expect(note).toContain("Repeating that search will produce that answer again");
    expect(note).toContain("Do not send back the same conclusion in different words");
  });

  it("names the two ways out, so the refusal is actionable", () => {
    const note = producedNothingNote("sense", "nothing found");
    expect(note).toContain("ALREADY on the record");
    expect(note).toContain("name precisely what is missing");
  });

  it("truncates, because a whole transcript is not context", () => {
    const long = "x".repeat(5000);
    expect(producedNothingNote("sense", long).length).toBeLessThan(1200);
  });

  it("and degrades to a weaker note rather than none when nothing was recorded", () => {
    // An unreadable transcript is a reason to be less specific, never a reason
    // to stop the work.
    for (const empty of [null, "", "   "]) {
      const note = producedNothingNote("design", empty);
      expect(note).toContain("put NOTHING on the record");
      expect(note).toContain("start from the record");
    }
  });
});

describe("it is wired, and it does not outrank a real correction", () => {
  it("the driver computes it for a produced-nothing hold", () => {
    expect(DRIVER).toContain('row.last_hold === "produced-nothing"');
    expect(DRIVER).toContain("producedNothingNote(station");
  });

  it("a correction from a later station still wins", () => {
    /*
     * Work sent back from downstream is the more informative failure, and a
     * station should hear that first rather than about its own empty attempt.
     * The self-check note also outranks this one: something filed and refused
     * is more specific than nothing filed at all.
     */
    expect(DRIVER).toContain("correctionBack ?? selfCheckBack ?? producedNothingBack");
  });

  it("and reads the answer from the record, one row, newest first", () => {
    expect(DRIVER).toContain("lastAnswerOnTrack");
    expect(DRIVER).toContain('.order("created_at", { ascending: false })');
  });
});
