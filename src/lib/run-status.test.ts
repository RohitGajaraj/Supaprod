/**
 * EVERY SPELLING THE FOUR FILES KNOW, PINNED TO ONE ANSWER.
 *
 * The point of this file is not that `normalizeRunStatus` returns something. It is
 * that the four existing normalisers can be replaced by it without any of them
 * losing a spelling it currently handles, and that the values they DISAGREE about
 * now have one answer with a reason attached.
 *
 * So the tables below are transcribed from those four files with their paths, and
 * a guard asserts the transcription is complete rather than trusting that I copied
 * it all. A test that enumerates a subset and passes is the failure mode this
 * whole item exists to fix.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import {
  KNOWN_RUN_SPELLINGS,
  TERMINAL_RUN_STATUSES,
  isStoppable,
  isTerminal,
  terminalStatusFilter,
  isWaitingOnAPerson,
  normalizeRunStatus,
  type RunStatus,
} from "./run-status";

/** `lib/agent-fleet.ts`'s `RUN_STATE` table, every key. */
const AGENT_FLEET: [string, RunStatus][] = [
  ["running", "running"],
  ["in_progress", "running"],
  ["dispatched", "running"],
  ["processing", "running"],
  ["executing", "running"],
  ["active", "running"],
  ["queued", "queued"],
  ["pending", "queued"],
  ["scheduled", "queued"],
  ["proposed", "proposed"],
  ["completed", "completed"],
  ["complete", "completed"],
  ["done", "completed"],
  ["succeeded", "completed"],
  ["success", "completed"],
  ["error", "failed"],
  ["failed", "failed"],
  ["cancelled", "cancelled"],
  ["canceled", "cancelled"],
  ["denied", "cancelled"],
  ["aborted", "cancelled"],
  ["timed_out", "failed"],
];

/** The two vocabularies `run-state.ts` and `build-status.ts` both transcribe. */
const AGENT_RUNS_TABLE = [
  "queued",
  "running",
  "waiting_approval",
  "halted",
  "completed",
  "failed",
  "cancelled",
  "done",
];
const MISSIONS_TABLE = [
  "proposed",
  "queued",
  "running",
  "blocked",
  "halted",
  "cancelled",
  "completed",
  "completed_with_failures",
  "failed",
];

describe("every spelling the four files handle survives", () => {
  it("maps every key in agent-fleet's table", () => {
    for (const [raw, expected] of AGENT_FLEET) {
      expect(normalizeRunStatus(raw), raw).toBe(expected);
    }
  });

  it("maps every value in agent_runs.status", () => {
    for (const raw of AGENT_RUNS_TABLE) {
      expect(normalizeRunStatus(raw), raw).not.toBe("unknown");
    }
  });

  it("maps every value in missions.status", () => {
    for (const raw of MISSIONS_TABLE) {
      expect(normalizeRunStatus(raw), raw).not.toBe("unknown");
    }
  });

  it("leaves no spelling in the module unaccounted for in this file", () => {
    /*
     * THE GUARD ON THE TRANSCRIPTION. Without it, adding a spelling to the module
     * and forgetting it here leaves a value nobody has agreed the meaning of, which
     * is precisely how four files came to disagree.
     */
    const covered = new Set([
      ...AGENT_FLEET.map(([raw]) => raw),
      ...AGENT_RUNS_TABLE,
      ...MISSIONS_TABLE,
      "errored",
    ]);
    const unaccounted = KNOWN_RUN_SPELLINGS.filter((s) => !covered.has(s));
    expect(unaccounted, "these spellings are in the module and in no table here").toEqual([]);
  });

  it("has spellings to check, so the assertions above are not vacuous", () => {
    expect(KNOWN_RUN_SPELLINGS.length).toBeGreaterThan(20);
    expect(AGENT_FLEET.length).toBeGreaterThan(20);
  });
});

describe("the singular that read as queued on two surfaces", () => {
  it("treats `complete` and `completed` as one state", () => {
    /*
     * `agents.functions.ts` writes the singular on the happy path.
     * `run-state.ts` and `build-status.ts` both fall through it to `queued`, so a
     * FINISHED RUN READS AS WAITING TO START. `run-analytics.ts` measured 2 of 245
     * real successful runs carrying it.
     */
    expect(normalizeRunStatus("complete")).toBe("completed");
    expect(normalizeRunStatus("completed")).toBe("completed");
    expect(normalizeRunStatus("complete")).toBe(normalizeRunStatus("completed"));
  });

  it("never lets a finished run read as queued", () => {
    for (const raw of ["complete", "completed", "done", "succeeded", "success"]) {
      expect(normalizeRunStatus(raw), raw).not.toBe("queued");
      expect(isTerminal(normalizeRunStatus(raw)), raw).toBe(true);
    }
  });
});

describe("the value four files gave three answers to", () => {
  it("keeps `completed_with_failures` as neither a success nor a failure", () => {
    /*
     * `run-analytics.ts` calls it a success, `build-status.ts` a failure,
     * `run-state.ts` stopped, and `agent-fleet.ts` does not have it at all so it
     * lands in `other` and goes uncounted.
     *
     * It cannot fold either way: folded into `completed`, a success rate counts a
     * run whose checks failed; folded into `failed`, a failure list sends somebody
     * to a run that landed. It is genuinely two facts, so it keeps its own status
     * and every projection has to say what it thinks.
     */
    const s = normalizeRunStatus("completed_with_failures");
    expect(s).toBe("completed_with_failures");
    expect(s).not.toBe("completed");
    expect(s).not.toBe("failed");
  });

  it("still counts it as finished, because it is", () => {
    expect(isTerminal(normalizeRunStatus("completed_with_failures"))).toBe(true);
  });

  it("is not lost the way agent-fleet loses it", () => {
    // agent-fleet's table has no row for it, so `runBucket` returns "other" and
    // every surface reading that model counts the run as neither done nor failed.
    expect(normalizeRunStatus("completed_with_failures")).not.toBe("unknown");
  });
});

describe("a cancelled run has stopped, and analytics thought it was still running", () => {
  it("recognises cancellation in both spellings", () => {
    expect(normalizeRunStatus("cancelled")).toBe("cancelled");
    expect(normalizeRunStatus("canceled")).toBe("cancelled");
  });

  it("counts it as finished", () => {
    // `run-analytics.ts` does not handle `cancelled` at all, so `classifyRunOutcome`
    // returns null and the run is treated as IN FLIGHT. A cancelled run is not in
    // flight, and while it is counted that way it inflates nothing and disappears
    // from every rate instead.
    expect(isTerminal(normalizeRunStatus("cancelled"))).toBe(true);
  });

  it("files a refusal and an abort as a stop by decision, not as a fault", () => {
    /*
     * THE ONE PLACE THIS DISAGREES WITH A SHIPPED FILE. `agent-fleet.ts` buckets
     * both as `failed`. Neither appears in either documented table, so there is no
     * ground truth, and semantically a denial is a person refusing while a failure
     * is a fault. It costs agent-fleet nothing, because it buckets `cancelled` as
     * failed too.
     */
    expect(normalizeRunStatus("denied")).toBe("cancelled");
    expect(normalizeRunStatus("aborted")).toBe("cancelled");
  });
});

describe("two tables, one state, two spellings", () => {
  it("reads `blocked` and `waiting_approval` as the same fact", () => {
    // `missions.status` never writes `waiting_approval`; `agent_runs.status` never
    // writes `blocked`. Same state, two tables. `build-status.ts` documents this.
    expect(normalizeRunStatus("blocked")).toBe("waiting_approval");
    expect(normalizeRunStatus("waiting_approval")).toBe("waiting_approval");
  });

  it("keeps `proposed` distinct from both", () => {
    /*
     * The collapse a reader expects and which would be wrong. A `proposed` mission
     * is one an ambient trigger raised and nobody has promoted; a
     * `waiting_approval` one has already started and stopped at a gate. Both wait
     * on a person, and only one has begun.
     */
    expect(normalizeRunStatus("proposed")).toBe("proposed");
    expect(normalizeRunStatus("proposed")).not.toBe("waiting_approval");
  });

  it("says a person is the thing both are waiting for", () => {
    expect(isWaitingOnAPerson(normalizeRunStatus("blocked"))).toBe(true);
    expect(isWaitingOnAPerson(normalizeRunStatus("proposed"))).toBe(true);
  });

  it("does not call a halt a person's problem", () => {
    /*
     * A halt is a stop on a CONDITION, usually a spend cap, and what releases it is
     * the condition changing rather than a decision. That is the distinction
     * `--mrd-you` and `--mrd-hold` exist to draw, so blurring it here would put the
     * wrong colour on a surface later.
     */
    expect(isWaitingOnAPerson(normalizeRunStatus("halted"))).toBe(false);
    expect(isTerminal(normalizeRunStatus("halted"))).toBe(true);
  });
});

describe("the unknown is explicit, and that is the whole point", () => {
  it("returns `unknown` rather than a neutral guess", () => {
    /*
     * All four existing files fall back silently: three to `queued` and one to
     * `null`. That silence is how `complete` came to read as queued on two
     * surfaces, and no gate could report it because the code did what it said.
     */
    expect(normalizeRunStatus("shipped")).toBe("unknown");
    expect(normalizeRunStatus("reticulating_splines")).toBe("unknown");
    expect(normalizeRunStatus("")).toBe("unknown");
  });

  it("returns `unknown` for a missing status rather than throwing", () => {
    expect(normalizeRunStatus(null)).toBe("unknown");
    expect(normalizeRunStatus(undefined)).toBe("unknown");
  });

  it("never resolves an unknown to blocked, failed or done", () => {
    // The acceptance criterion, stated as an assertion. Each of those three would
    // be a surface asserting something about a run nobody can read.
    const s = normalizeRunStatus("something_new_from_a_migration");
    expect(s).not.toBe("waiting_approval");
    expect(s).not.toBe("failed");
    expect(s).not.toBe("completed");
  });

  it("does not treat an unknown as finished", () => {
    /*
     * A status nobody recognises is not evidence the work has stopped. Calling it
     * terminal is how a run in a new state disappears from a queue instead of
     * showing up as something to look at.
     */
    expect(isTerminal("unknown")).toBe(false);
    expect(isWaitingOnAPerson("unknown")).toBe(false);
  });
});

describe("it is case and whitespace insensitive, which only one of the four is", () => {
  it("reads a padded or capitalised status the same way", () => {
    // `agent-fleet.ts` trims and lowercases; the other three compare raw. So a
    // status arriving with different case reads differently on different surfaces
    // today.
    for (const raw of [" completed ", "COMPLETED", "Completed", "\tCoMpLeTeD\n"]) {
      expect(normalizeRunStatus(raw), JSON.stringify(raw)).toBe("completed");
    }
  });
});

describe("it stays a spelling layer and changes no writer", () => {
  it("imports nothing, so it cannot reach a database or a component", () => {
    /*
     * The item's constraint, asserted rather than assumed: this replaces four
     * mappings and must not acquire a dependency on any of the files that hold
     * them, or wiring them up becomes a cycle.
     */
    const source = readFileSync(new URL("./run-status.ts", import.meta.url), "utf8");
    const imports = [...source.matchAll(/^import\s/gm)];
    expect(imports.length, "run-status.ts grew an import").toBe(0);
  });

  it("exports no projection, so it cannot become a fifth normaliser", () => {
    /*
     * The four unions are four legitimate questions: a fleet count, a row state, a
     * mission header, an outcome rate. This file spells statuses; it does not
     * answer any of those, and a `RunState`-shaped export here would quietly become
     * the fifth thing that disagrees.
     */
    const source = readFileSync(new URL("./run-status.ts", import.meta.url), "utf8");
    for (const projection of ["RunState", "RunBucket", "RunOutcome", "MissionRowStatus"]) {
      expect(source, `it exports ${projection}`).not.toContain(`export type ${projection}`);
    }
  });
});

/*
 * ── TERMINAL_RUN_STATUSES ────────────────────────────────────────────────────
 *
 * Added 2026-08-20 with its first consumer, the `finalize` precondition in
 * `loop.server.ts`. That writer has to name the terminal statuses INSIDE its
 * query, because a read-then-write in JS reopens the race the precondition was
 * added to close. So the names leave this module as data, and these tests exist
 * to stop the data and the predicate drifting apart.
 */
describe("TERMINAL_RUN_STATUSES", () => {
  it("agrees with isTerminal on every status the normalizer can produce", () => {
    const produced = [...new Set(KNOWN_RUN_SPELLINGS.map(normalizeRunStatus))];
    for (const status of produced) {
      expect(
        TERMINAL_RUN_STATUSES.includes(status),
        `${status}: list says ${TERMINAL_RUN_STATUSES.includes(status)}, isTerminal says ${isTerminal(status)}`,
      ).toBe(isTerminal(status));
    }
  });

  it("holds exactly the five terminal statuses, sorted", () => {
    expect([...TERMINAL_RUN_STATUSES]).toEqual([
      "cancelled",
      "completed",
      "completed_with_failures",
      "failed",
      "halted",
    ]);
  });

  it("excludes unknown, because an unrecognised status is not evidence work stopped", () => {
    // The same argument isTerminal's own comment makes. If `unknown` were in
    // this list, a run in an unrecognised state could never be finalised at all:
    // the precondition would refuse every write to it, forever.
    expect(TERMINAL_RUN_STATUSES).not.toContain("unknown");
    expect(isTerminal("unknown")).toBe(false);
  });

  it("excludes every non-terminal status, so finalize can still write a running run", () => {
    for (const live of ["queued", "running", "waiting_approval", "proposed"] as const) {
      expect(TERMINAL_RUN_STATUSES, `${live} must remain writable`).not.toContain(live);
    }
  });

  it("renders a postgrest in-list with no spaces, which the query relies on", () => {
    // `.not("status","in", "(a,b)")` is parsed by postgrest, not by JS. A stray
    // space becomes part of a value and silently matches nothing.
    const rendered = `(${TERMINAL_RUN_STATUSES.join(",")})`;
    expect(rendered).toBe("(cancelled,completed,completed_with_failures,failed,halted)");
    expect(rendered).not.toContain(" ");
  });
});

/*
 * ── terminalStatusFilter and isStoppable ─────────────────────────────────────
 *
 * Both are consumed by writers that cannot be unit-tested here: `finalize`
 * (`loop.server.ts`) and `stopRun` (`agent-runs.functions.ts`) are a closure and
 * a `createServerFn` handler, and this repo's own convention for server
 * functions is to test the pure helpers and say which coverage is missing. So
 * the decision each writer makes is extracted to here, where it can be pinned.
 */
describe("terminalStatusFilter", () => {
  it("renders exactly the postgrest in-list both writers send", () => {
    expect(terminalStatusFilter()).toBe(
      "(cancelled,completed,completed_with_failures,failed,halted)",
    );
  });

  it("contains no whitespace, because postgrest would treat it as part of a value", () => {
    expect(terminalStatusFilter()).not.toMatch(/\s/);
  });

  it("stays in step with TERMINAL_RUN_STATUSES", () => {
    expect(terminalStatusFilter()).toBe(`(${TERMINAL_RUN_STATUSES.join(",")})`);
  });
});

describe("isStoppable", () => {
  it("refuses every terminal status", () => {
    for (const s of TERMINAL_RUN_STATUSES) {
      expect(isStoppable(s), `${s} must not be stoppable`).toBe(false);
    }
  });

  it("allows a run that is still going", () => {
    for (const s of ["queued", "running", "waiting_approval", "proposed"]) {
      expect(isStoppable(s), `${s} must be stoppable`).toBe(true);
    }
  });

  it("decides from the RAW spelling, so `complete` is not mistaken for unstarted", () => {
    // The bug K-12 exists for: two surfaces fell `complete` through to `queued`.
    // A stop that made the same mistake would offer to cancel a finished run.
    expect(isStoppable("complete")).toBe(false);
    expect(isStoppable("done")).toBe(false);
    expect(isStoppable("succeeded")).toBe(false);
    expect(isStoppable("canceled")).toBe(false);
  });

  it("allows an unrecognised status, because unknown is not evidence work stopped", () => {
    // Same argument isTerminal makes. Refusing here would make a run in an
    // unrecognised state impossible to stop, which is the worse failure: it is
    // exactly the run somebody most wants to stop.
    expect(isStoppable("something_nobody_wrote_down")).toBe(true);
    expect(isStoppable(null)).toBe(true);
    expect(isStoppable(undefined)).toBe(true);
  });
});
