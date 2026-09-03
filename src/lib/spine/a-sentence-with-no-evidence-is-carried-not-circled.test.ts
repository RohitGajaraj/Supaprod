/**
 * ── THE FOUNDER'S OWN RUN WAS ONE TICK FROM GIVING UP WITH NOTHING BUILT ──
 *
 * Track `870b70d3`, pressed 14:12 IST on 2026-09-03. Three seats at Sense
 * searched the workspace, found nothing bearing on his sentence, and said so.
 * The driver could not tell that from a seat that simply did nothing: it
 * recorded `produced-nothing` and spent an attempt on each pass, and on its own
 * rule it would have reached *Needs a restart* at 14:50 having built nothing.
 *
 * **His sentence WAS the evidence and the loop treated it as a failed search.**
 *
 * R-36 is the ruling. This file holds the two properties the driver has to keep
 * for it, and they pull in opposite directions, which is why both are here:
 *
 *   a seat that searched and found nothing     carries, spends no attempt
 *   a halt, a throw or a credit refusal        still spends one, exactly as before
 *
 * WHY THE SIGNAL IS A TOOL CALL AND NOT A PHRASE. `driver.server.ts` said it
 * first, about this exact problem: telling a reasoned refusal from an empty
 * visit "deserves a better instrument than a substring". The seat calls
 * `sense.found_nothing`, so the driver reads a typed row in `tool_calls`. A
 * prose match would break the first time a seat rephrased itself, and would
 * fire on a seat that merely quoted the phrase.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const SERVER = strip(readFileSync("src/lib/spine/driver.server.ts", "utf8"));
const PURE = strip(readFileSync("src/lib/spine/driver.ts", "utf8"));
const REGISTRY = strip(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));

/** The carry branch only, bounded at the produced-nothing block below it. */
const CARRY = SERVER.slice(
  SERVER.indexOf('if (station === "sense" && !producedThisVisit)'),
  SERVER.indexOf("if (!producedThisVisit) {"),
);

describe("a seat that searched and found nothing is carried", () => {
  it("reads a typed tool call, never a phrase in the answer", () => {
    expect(CARRY.replace(/\s+/g, " ")).toContain('st.name === "sense.found_nothing"');
    // The instrument this file exists for: no substring matching on prose.
    expect(CARRY).not.toContain('includes("no evidence")');
    expect(CARRY).not.toContain("toLowerCase()");
  });

  it("does not count an attempt, which is the whole ruling", () => {
    // The produced-nothing block increments; this branch must not, and must not
    // reset either, because nothing about the earlier attempts became untrue.
    expect(CARRY).not.toContain("attempts:");
  });

  it("advances the track rather than holding it", () => {
    const flat = CARRY.replace(/\s+/g, " ");
    expect(flat).toContain("const carriedTo = nextStation(routeOf(row), station)");
    expect(flat).toContain("station: carriedTo");
    expect(flat).toContain("moved: Boolean(carriedTo)");
    expect(flat).toContain("arrivedAt: carriedTo");
  });

  it("records the reason on the track and says the one line", () => {
    const flat = CARRY.replace(/\s+/g, " ");
    expect(flat).toContain("last_hold: CARRIED_ON_YOUR_SENTENCE");
    expect(flat).toContain("last_hold_because: because");
    expect(flat).toContain("line: flagged(because)");
  });

  it("says it once, from one constant, so the pane and the transcript agree", () => {
    expect(SERVER).toContain("const NOTHING_SPEAKS_TO_THIS =");
    expect(SERVER.replace(/\s+/g, " ")).toContain("Nothing in the workspace speaks to this.");
    expect(PURE.replace(/\s+/g, " ")).toContain("Nothing in the workspace speaks to this.");
  });

  it("is never corrected, because nothing failed", () => {
    // The correction loop reroutes a station that ran and could not do its job.
    // This one did its job and the answer was "nothing here".
    expect(SERVER.replace(/\s+/g, " ")).toContain(
      "if ((row.last_hold as string | null) === CARRIED_ON_YOUR_SENTENCE) return null;",
    );
  });
});

describe("a halt still spends an attempt", () => {
  it("keeps the existing rule for throws and credit refusals", () => {
    /*
     * The carry branch is scoped to `station === "sense"` AND to a clean visit
     * that produced nothing. A throw is handled above it, by the `failed`
     * branch, which is untouched: an outside failure spends nothing and a real
     * stall spends one. Those did not answer anything, so they keep the rule.
     */
    expect(CARRY).toContain('station === "sense"');
    expect(CARRY).toContain("!producedThisVisit");
    const failedBranch = SERVER.slice(
      SERVER.indexOf("if (failed) {"),
      SERVER.indexOf('if (station === "sense" && !producedThisVisit)'),
    );
    expect(failedBranch.replace(/\s+/g, " ")).toContain(
      "...(outside ? {} : { attempts: (row.attempts ?? 0) + 1 })",
    );
  });

  it("still counts an attempt when a station filed nothing and said nothing", () => {
    const nothingBranch = SERVER.slice(SERVER.indexOf("if (!producedThisVisit) {"));
    expect(nothingBranch.replace(/\s+/g, " ")).toContain("attempts: (row.attempts ?? 0) + 1");
  });
});

describe("the seat has a channel for it", () => {
  it("the tool exists and is in the kit", () => {
    expect(REGISTRY).toContain('name: "sense.found_nothing"');
    expect(REGISTRY).toContain("senseFoundNothing,");
  });

  it("it files nothing, because the absence of evidence is not evidence", () => {
    // 52 of one workspace's 72 signals were once the agents' own notes recording
    // that they found nothing. This records the absence on the RUN, never on the
    // evidence record.
    const tool = REGISTRY.slice(
      REGISTRY.indexOf('name: "sense.found_nothing"'),
      REGISTRY.indexOf("const listSignals"),
    );
    expect(tool).not.toContain(".insert(");
    expect(tool).not.toContain("signals");
  });

  it("the brief tells the seat to call it", () => {
    expect(PURE).toContain("call sense.found_nothing with what you searched");
  });
});
