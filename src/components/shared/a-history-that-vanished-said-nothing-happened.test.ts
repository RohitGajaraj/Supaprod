/**
 * ── A SECTION THAT VANISHES READS AS "NOTHING HAPPENED" ──────────────────────
 *
 * `StageTimeline` mounts on a decision's detail and on an opportunity's. Its
 * honest-empty rule is right and stays: history accrues from today, so an
 * entity with no transitions shows nothing rather than an empty shell.
 *
 * A FAILED read took that same exit. `eventsQuery.data?.events ?? []` then
 * `if (events.length === 0) return null`, with nothing anywhere consulting
 * whether the read had happened at all. So on a decision whose history could
 * not be read, the section simply was not there, which a person reads as
 * "nothing has happened to this decision" rather than as "we could not find
 * out". Found by the missing-states sweep, 2026-09-10.
 *
 * Guarded as source rather than as a render because the two states differ by
 * an ABSENCE: the wrong behaviour renders nothing at all, so there is no
 * output to assert on, and the only thing that can be asked is whether the
 * component consults the failure before it takes the empty exit.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/components/shared/StageTimeline.tsx", "utf8");

describe("a stage history that could not be read says so", () => {
  it("consults the failure BEFORE the empty exit, or the check never runs", () => {
    const unread = SRC.indexOf("const unread = eventsQuery.isError;");
    const emptyExit = SRC.indexOf("if (events.length === 0) return null;");
    expect(unread).toBeGreaterThan(-1);
    expect(emptyExit).toBeGreaterThan(-1);
    // Order is the property: the empty exit returns null, so a failure check
    // placed after it is unreachable on exactly the case it exists for.
    expect(unread).toBeLessThan(emptyExit);
  });

  it("says it in plain words, and names what could not be read", () => {
    expect(SRC).toContain("The stage history could not be read.");
  });

  /*
   * THE MIRROR (law 12). "It renders a failure line" passes just as happily if
   * it rendered that line always, which would put "could not be read" over an
   * entity that simply has no history. The empty exit must survive.
   */
  it("keeps the honest-empty exit, so an entity with no history still shows nothing", () => {
    const at = SRC.indexOf("if (events.length === 0) return null;");
    expect(at).toBeGreaterThan(-1);
    // And the failure branch is guarded by the failure, not taken unconditionally.
    expect(SRC).toContain("if (unread) {");
  });

  it("adds no styling of its own, in either host's anatomy", () => {
    // The file's own rule: changing another surface's shell from inside a
    // shared timeline is how one port breaks three screens.
    const branch = SRC.slice(SRC.indexOf("if (unread) {"), SRC.indexOf("if (events.length === 0)"));
    expect(branch).toContain("LOOM_CARD");
    expect(branch).toContain("DetailSection");
    expect(branch).toContain("var(--mrd-mute)");
    // No new colour, no raw hex, no retired token.
    expect(branch).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(branch).not.toMatch(/--(sp|ds|text)-/);
  });
});
