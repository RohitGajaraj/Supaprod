/**
 * A READER MAY ONLY KEY ON A WORD THE WRITER OF ITS OWN COLUMN PRODUCES.
 *
 * THE DEFECT THIS CLOSES (K-63). Three readers keyed on an `awaiting`-prefixed
 * spelling of the gate word, and nothing in `src/` or `supabase/` ever wrote
 * that spelling. The last test in this file assembles it from parts rather than
 * writing it out, so the acceptance grep for the ghost does not land on its own
 * guard. The loop marks a gated run
 * `waiting_approval`, so the roster's live set could never match a run parked at
 * a gate and an agent waiting on a decision from the person reading the panel
 * wore the idle mark. The inspector never printed its "waiting on a decision
 * from you" label either, and fell through to the raw column value. The same
 * live set also carried `planning`, which is a missions word and a tool
 * category and is written to `agent_runs.status` by nobody.
 *
 * WHY THIS IS SCOPED PER COLUMN, which is the whole point of the file.
 * "Every status a reader keys on is one some writer writes somewhere" passes
 * trivially, because `planning` IS written, just to a different table. Checked
 * against the union of every vocabulary in the repo the guard has no teeth on
 * the defect it exists to catch. So there are three writer sets here, one per
 * column, each reader is declared against the column it actually reads, and the
 * assertions are made against that column alone.
 *
 * Deliberately grep-based over the source text rather than importing the
 * readers. Two of the three live in `.tsx` components whose module graph reaches
 * `.server.ts` files, and a guard that needs a bundler to run is a guard that
 * gets skipped. Reading the declaration text keeps this pure, and it means the
 * plant that proves the guard is a one-word edit to the real file.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");

/* ------------------------------------------------------------------ writers */

/**
 * `agent_runs.status`. Every member has a writer, and the citation is the
 * writer, not a reader that tolerates the word.
 *
 *   queued                   ai/handoff.server.ts, ai/loop.server.ts,
 *                            routes/api/public/hooks/ci-poll-tick.ts
 *   running                  ai/loop.server.ts, agents.functions.ts, and the
 *                            column DEFAULT in the create table
 *   waiting_approval         ai/loop.server.ts, the gate write
 *   halted                   ai/loop.server.ts, hooks/resume-runs.ts
 *   failed                   ai/loop.server.ts, ai/verify-green.server.ts,
 *                            ai/mission-advance.server.ts, agents.functions.ts
 *   cancelled                ai/loop.server.ts, agent-runs.functions.ts,
 *                            missions.functions.ts, build/native.server.ts
 *   completed                ai/loop.server.ts, ai/verify-green.server.ts
 *   completed_with_failures  ai/loop.server.ts, the finalize ternary
 *   complete                 agents.functions.ts, the single-agent happy path
 *   done                     delegate/poll.server.ts, which folds an external
 *                            job's terminal word straight onto the run row
 */
const RUN_WRITES = new Set([
  "queued",
  "running",
  "waiting_approval",
  "halted",
  "failed",
  "cancelled",
  "completed",
  "completed_with_failures",
  "complete",
  "done",
]);

/**
 * `missions.status`.
 *
 *   proposed                 hooks/trigger-tick.ts
 *   running                  missions.functions.ts, hooks/resume-runs.ts,
 *                            hooks/trigger-tick.ts, ai/handoff.server.ts,
 *                            studio-rollbacks.ts, and the column DEFAULT
 *   blocked                  hooks/ci-poll-tick.ts, hooks/resume-runs.ts,
 *                            which is the mission table's word for a gate
 *   halted                   ai/loop.server.ts, missions.functions.ts,
 *                            orchestrator.functions.ts, hooks/resume-runs.ts,
 *                            hooks/trigger-tick.ts
 *   cancelled                missions.functions.ts, build/native.server.ts
 *   completed                ai/handoff.server.ts, ai/tools/orchestrator.server.ts
 *   completed_with_failures  the same two
 *   failed                   ai/handoff.server.ts
 */
const MISSION_WRITES = new Set([
  "proposed",
  "running",
  "blocked",
  "halted",
  "cancelled",
  "completed",
  "completed_with_failures",
  "failed",
]);

/**
 * `mission_steps.status`.
 *
 *   planned      ai/mission-advance.server.ts, ai/tools/orchestrator.server.ts,
 *                routes/api/chat.ts, and the column DEFAULT
 *   ready        declared in the column's own enumeration in the create table
 *                and written by nothing yet
 *   dispatched   ai/mission-advance.server.ts, the claim
 *   running      ai/mission-advance.server.ts
 *   done         ai/mission-advance.server.ts, delegate/poll.server.ts
 *   failed       ai/mission-advance.server.ts, delegate/poll.server.ts,
 *                hooks/resume-runs.ts
 *   skipped      ai/mission-advance.server.ts
 *   cancelled    missions.functions.ts, reflecting a cancelled mission
 */
const STEP_WRITES = new Set([
  "planned",
  "ready",
  "dispatched",
  "running",
  "done",
  "failed",
  "skipped",
  "cancelled",
]);

type Column = "run" | "mission" | "step";

const WRITES: Record<Column, Set<string>> = {
  run: RUN_WRITES,
  mission: MISSION_WRITES,
  step: STEP_WRITES,
};

const COLUMN_NAME: Record<Column, string> = {
  run: "agent_runs.status",
  mission: "missions.status",
  step: "mission_steps.status",
};

/** Words one column writes and neither of the other two ever does. A reader
 *  keying on a word from this set for the wrong column is the K-63 defect. */
function exclusiveTo(column: Column): Set<string> {
  const others = (Object.keys(WRITES) as Column[]).filter((c) => c !== column);
  const out = new Set<string>();
  for (const word of WRITES[column]) {
    if (others.every((c) => !WRITES[c].has(word))) out.add(word);
  }
  return out;
}

/* ----------------------------------------------------------------- readers */

function source(rel: string): string {
  return readFileSync(join(SRC, rel), "utf8");
}

/** Comments carry status words in prose, including the ones this file exists to
 *  ban, so they come out before anything is extracted. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * The text of `const NAME = ...`, balanced over its own brackets. Throws when
 * the name is absent, so a rename fails the guard loudly instead of silently
 * checking an empty set.
 */
function declaration(text: string, name: string): string {
  const at = text.search(new RegExp(`(?:export\\s+)?const\\s+${name}\\b`));
  if (at === -1) {
    throw new Error(
      `no declaration named '${name}' here. This guard is pinned to that name; ` +
        `if it moved, repoint the guard rather than deleting it.`,
    );
  }
  const open = text.slice(at).search(/[[{]/);
  if (open === -1) throw new Error(`'${name}' has no bracketed body to read.`);
  const from = at + open;
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "[" || ch === "{") depth += 1;
    else if (ch === "]" || ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(from, i + 1);
    }
  }
  throw new Error(`'${name}' is not bracket-balanced, so it cannot be read.`);
}

/** The string literals inside a `new Set([...])` body. */
function setMembers(rel: string, name: string): string[] {
  const body = declaration(stripComments(source(rel)), name);
  return [...body.matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]);
}

/** The bare keys of an object literal, one per line, which is how every status
 *  map in this repo is written. */
function objectKeys(rel: string, name: string): string[] {
  const body = declaration(stripComments(source(rel)), name);
  return [...body.matchAll(/^\s*([a-z][a-z0-9_]*)\s*:/gm)].map((m) => m[1]);
}

/** The literals a function compares `status` against. */
function comparedStatuses(rel: string, fnName: string): string[] {
  const text = stripComments(source(rel));
  const at = text.indexOf(`function ${fnName}`);
  if (at === -1) throw new Error(`no function named '${fnName}' here.`);
  const open = text.indexOf("{", at);
  let depth = 0;
  let end = text.length;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = text.slice(open, end);
  return [...body.matchAll(/status\s*===\s*"([a-z0-9_]+)"/g)].map((m) => m[1]);
}

type Reader = {
  /** Named the way a person would say it out loud, because the failure message
   *  is the whole value of this test. */
  where: string;
  column: Column;
  keys: () => string[];
  /** A word this reader keys on that another column owns, with the reason it is
   *  allowed to stay. An entry with no reason should fail review. */
  tolerated?: Record<string, string>;
};

const READERS: Reader[] = [
  {
    where: "governance.functions.ts LIVE_RUN_STATUSES, the canonical live set",
    column: "run",
    keys: () => setMembers("lib/governance.functions.ts", "LIVE_RUN_STATUSES"),
  },
  {
    where: "AgentRosterPanel.tsx FAILED_STATUS, which paints the failed mark",
    column: "run",
    keys: () => setMembers("components/governance/AgentRosterPanel.tsx", "FAILED_STATUS"),
  },
  {
    where: "AgentInspector.tsx RUN_STATUS, the plain-words label for a run",
    column: "run",
    keys: () => objectKeys("components/cockpit/AgentInspector.tsx", "RUN_STATUS"),
  },
  {
    where: "AgentInspector.tsx runMarkState, which picks the mark a run wears",
    column: "run",
    keys: () => comparedStatuses("components/cockpit/AgentInspector.tsx", "runMarkState"),
  },
  {
    where: "delegate-desk.ts STATUS_TO_LANE, which files a MISSION into a lane",
    column: "mission",
    tolerated: {
      queued:
        "the lane it routes to is itself called Queued, so a stray run or event " +
        "row lands under the label of its own word rather than a wrong one. The " +
        "map documents itself as tolerant across the mission, run and reactor paths.",
      dispatched:
        "a mission_steps word routed to Working, which is what a dispatched step " +
        "means. Same tolerance, same direction: it cannot mislabel.",
    },
    keys: () => objectKeys("lib/delegate-desk.ts", "STATUS_TO_LANE"),
  },
  {
    where: "delegate-desk.ts STEP_DONE, which counts a step as finished",
    column: "step",
    tolerated: {
      complete:
        "load-bearing and documented at the key. The step strip falls back to " +
        "agent_runs rows when a mission has no mission_steps, and the " +
        "single-agent path writes the singular form there, so without this key " +
        "the progress percentage under-reports.",
    },
    keys: () => setMembers("lib/delegate-desk.ts", "STEP_DONE"),
  },
];

/* -------------------------------------------------------------- assertions */

describe("the three status vocabularies stay separate", () => {
  test("each writer set is real, so no loop below can pass by having nothing to check", () => {
    expect(RUN_WRITES.size).toBeGreaterThan(5);
    expect(MISSION_WRITES.size).toBeGreaterThan(5);
    expect(STEP_WRITES.size).toBeGreaterThan(5);
  });

  test("each column owns at least one word the other two never write", () => {
    // Without this the exclusivity assertion below would be vacuous.
    for (const column of Object.keys(WRITES) as Column[]) {
      expect([column, [...exclusiveTo(column)].length > 0]).toEqual([column, true]);
    }
  });

  test("every reader is found in its file and is not empty", () => {
    const empty = READERS.filter((r) => r.keys().length === 0).map((r) => r.where);
    expect(empty).toEqual([]);
  });
});

describe("a run-status reader keys only on words agent_runs carries", () => {
  // No tolerations are offered here on purpose. This is the column the defect
  // was on, and it is clean, so the strict form is the one that holds.
  for (const reader of READERS.filter((r) => r.column === "run")) {
    test(reader.where, () => {
      const ghosts = reader.keys().filter((k) => !RUN_WRITES.has(k));
      // Named, never counted: knowing WHICH word is the whole work of fixing it.
      expect({ where: reader.where, keysNoWriterProduces: ghosts }).toEqual({
        where: reader.where,
        keysNoWriterProduces: [],
      });
    });
  }
});

describe("no reader keys on a word another column owns outright", () => {
  for (const reader of READERS) {
    test(`${reader.where} reads ${COLUMN_NAME[reader.column]}`, () => {
      const foreign = new Set<string>();
      for (const other of (Object.keys(WRITES) as Column[]).filter((c) => c !== reader.column)) {
        for (const word of exclusiveTo(other)) foreign.add(word);
      }
      const tolerated = reader.tolerated ?? {};
      const leaked = reader
        .keys()
        .filter((k) => foreign.has(k))
        .filter((k) => !(k in tolerated && tolerated[k].length > 20));
      expect({ where: reader.where, wordsFromAnotherColumn: leaked }).toEqual({
        where: reader.where,
        wordsFromAnotherColumn: [],
      });
    });
  }
});

describe("the gate is readable on the column that actually records it", () => {
  test("the canonical live set counts a run parked at a gate as live", () => {
    expect(setMembers("lib/governance.functions.ts", "LIVE_RUN_STATUSES")).toContain(
      "waiting_approval",
    );
  });

  test("the inspector has a plain-words label for a run parked at a gate", () => {
    expect(objectKeys("components/cockpit/AgentInspector.tsx", "RUN_STATUS")).toContain(
      "waiting_approval",
    );
  });

  test("the roster no longer imports its own copy of the live set", () => {
    const text = source("components/governance/AgentRosterPanel.tsx");
    expect(text).toContain('import { LIVE_RUN_STATUSES } from "@/lib/governance.functions"');
    expect(stripComments(text)).not.toContain("const LIVE_STATUS");
  });

  test("the mission-status map covers the gate through the mission table's own word", () => {
    const body = declaration(stripComments(source("lib/delegate-desk.ts")), "STATUS_TO_LANE");
    expect(body).toMatch(/blocked:\s*"needsYou"/);
  });
});

describe("the ghost spelling of the gate word is gone from the tree", () => {
  // Assembled rather than written out so that the acceptance grep for the ghost
  // does not find its own guard and report a defect that is not there.
  const GHOST = ["awaiting", "approval"].join("_");

  test("no writer set contains it, which is why no reader may", () => {
    for (const column of Object.keys(WRITES) as Column[]) {
      expect([column, WRITES[column].has(GHOST)]).toEqual([column, false]);
    }
  });

  test("no reader keys on it", () => {
    const carriers = READERS.filter((r) => r.keys().includes(GHOST)).map((r) => r.where);
    expect(carriers).toEqual([]);
  });

  test("no reader tolerates it either", () => {
    const excused = READERS.filter((r) => r.tolerated && GHOST in r.tolerated).map((r) => r.where);
    expect(excused).toEqual([]);
  });
});
