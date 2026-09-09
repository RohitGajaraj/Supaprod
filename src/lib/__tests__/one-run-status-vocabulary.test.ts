/**
 * FOUR NORMALISERS, ONE TABLE, AND THE THREE QUESTIONS THEY ARE NOT ALLOWED TO
 * ANSWER DIFFERENTLY.
 *
 * Four modules turn a raw run status into their own words, two of them had no
 * test of the mapping at all, and `AGENTS.md` records the cost: "four status
 * normalisers, three of which disagree about what `completed_with_failures`
 * means, so two surfaces read the same run as opposite outcomes."
 *
 *   runState             components/runs/run-state.ts   gate | working | queued | stopped | done
 *   runBucket            lib/agent-fleet.ts             running | queued | done | failed | other
 *   classifyRunOutcome   lib/run-analytics.ts           succeeded | succeeded_with_failures | failed | abandoned | null
 *   taskStatus           components/meridian/TaskRows   running | queued | blocked | stopped | partial | done | failed
 *
 * ── THE HARD PART IS THE LINE BETWEEN A DISAGREEMENT AND A DEFECT ────────
 * Those four unions are four different questions and all four are legitimate: a
 * row's state, a fleet tally, an outcome rate, a lane's word. Collapsing them
 * into one would lose real distinctions, which is why `lib/run-status.ts` exists
 * as a SPELLING layer rather than as a fifth projection. So a test that simply
 * demanded four identical answers would be wrong, and a test that demanded
 * nothing would be worthless.
 *
 * The line drawn here is three axes and two named reasons a normaliser may sit
 * one out.
 *
 *   TERMINAL          has the work stopped for good? Every one of the four has a
 *                     member for finished and a member for not, so every one is
 *                     bound, with no exemptions. A normaliser that files a
 *                     terminal status under a live state is not answering a
 *                     different question, it is claiming something is still
 *                     happening when nothing is.
 *
 *   CLEAN SUCCESS     did it work, with no holes? Bound for all four, with
 *                     exactly ONE declared exemption, which is the whole reason
 *                     the four were said to disagree. See `LICENSED` below. The
 *                     licence is one cell wide, not one axis wide: a second
 *                     divergence anywhere on this axis fails the build.
 *
 *   A PERSON IS       bound only for the two whose union can SAY it. `runBucket`
 *   REQUIRED          has no bucket that means "a person is required" and
 *                     `classifyRunOutcome` has no such outcome, so holding them
 *                     to this axis would be asserting against a word they do not
 *                     have. Their ranges are pinned instead (`RANGE`), so the
 *                     day either one grows a member, this exemption stops being
 *                     free and somebody has to re-decide it.
 *
 * ── WHAT COLUMN SCOPING WOULD HAVE ADDED, AND WHY IT IS NOT HERE ─────────
 * `status-vocabulary-per-column.test.ts` establishes that a reader may only be
 * held to the vocabulary of the column it reads: `proposed` and `blocked` are
 * `missions.status` words, and `runBucket` and `classifyRunOutcome` both take
 * `agent_runs` rows. Measured: scoping the axes per column excuses NOTHING here.
 * Both mission-only words are non-terminal and not a clean success, so both
 * normalisers answer them correctly by falling through. Encoding a dimension
 * that changes no verdict would be machinery pretending to be a guard, so the
 * writer of every spelling is cited below and the scope is not.
 *
 * ── WHY THE TABLE HOLDS ONLY WHAT A WRITER WRITES ────────────────────────
 * The item that asked for this named thirteen spellings, and one of them,
 * `succeeded`, is written to neither column by anything in this repo. Failing a
 * normaliser for not recognising a word nothing produces is the K-63 defect run
 * backwards: a guard on a ghost. Reader-only spellings are handled separately
 * and more weakly, near the bottom, by the one assertion that can be made about
 * them honestly.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runState } from "@/components/runs/run-state";
import {
  TASK_LABEL,
  TASK_TONE,
  TERMINAL_TASK_STATUS,
  taskStatus,
} from "@/components/meridian/TaskRows";
import { runBucket } from "@/lib/agent-fleet";
import { classifyRunOutcome } from "@/lib/run-analytics";
import { isTerminal, isWaitingOnAPerson, normalizeRunStatus } from "@/lib/run-status";

/* ------------------------------------------------------------------- table */

type Spelling = {
  raw: string;
  /**
   * The WRITER, never a reader that tolerates the word. Sourced from the writer
   * sets in `status-vocabulary-per-column.test.ts`, which cite the file and the
   * column for each one, and spot-checked against the writers named here.
   */
  writer: string;
};

/**
 * Every spelling a writer in this repo puts into `agent_runs.status` or
 * `missions.status`. Twelve, and the interesting ones are the last two.
 */
const TABLE: readonly Spelling[] = [
  { raw: "queued", writer: "ai/handoff.server.ts, ai/loop.server.ts, hooks/ci-poll-tick.ts" },
  { raw: "running", writer: "ai/loop.server.ts, agents.functions.ts, and the column default" },
  { raw: "waiting_approval", writer: "ai/loop.server.ts, the gate write" },
  { raw: "proposed", writer: "hooks/trigger-tick.ts, on missions" },
  { raw: "blocked", writer: "hooks/ci-poll-tick.ts, hooks/resume-runs.ts, the mission gate" },
  { raw: "halted", writer: "ai/loop.server.ts, hooks/resume-runs.ts" },
  { raw: "failed", writer: "ai/loop.server.ts, ai/mission-advance.server.ts, agents.functions.ts" },
  { raw: "cancelled", writer: "agent-runs.functions.ts stopRun, missions.functions.ts" },
  { raw: "completed", writer: "ai/loop.server.ts, ai/verify-green.server.ts" },
  { raw: "completed_with_failures", writer: "ai/loop.server.ts, the finalize ternary" },
  { raw: "complete", writer: "agents.functions.ts, the single-agent happy path" },
  {
    raw: "done",
    // NOT IN THE ITEM'S LIST OF DEFECTS AND IT IS ONE. `foldDelegateResult`
    // writes `stepStatus` to BOTH `mission_steps.status` and `agent_runs.status`,
    // and that value is the literal "done", so an external delegate job that
    // finishes lands here. `classifyRunOutcome` did not recognise it.
    writer: "delegate/poll.server.ts foldDelegateResult, straight onto the run row",
  },
];

/**
 * Spellings a normaliser recognises that no writer produces. Kept out of the
 * three axes on purpose, and NOT ignored: the one assertion they can carry is at
 * the bottom of the file.
 *
 * `succeeded` is here rather than in the table above, which corrects the item
 * that asked for this test. It appears in `agent-fleet.ts`, `run-status.ts` and
 * `taskStatus`, and in no writer.
 */
const READER_ONLY: readonly string[] = [
  "in_progress",
  "dispatched",
  "processing",
  "executing",
  "active",
  "working",
  "started",
  "pending",
  "scheduled",
  "canceled",
  "succeeded",
  "success",
  "error",
  "errored",
  "failure",
  "timed_out",
  "denied",
  "aborted",
];

/* ------------------------------------------------------------- normalisers */

/** What each of the three axes says about one spelling. `null` means the
 *  normaliser's union has no member that can express this axis at all. */
type Verdict = {
  terminal: boolean;
  cleanSuccess: boolean;
  needsPerson: boolean | null;
};

type Normaliser = {
  /** Said the way a person would say it, because the failure message is most of
   *  what this file is worth. */
  name: string;
  /** The word this normaliser actually returned, for the message. */
  answer: (raw: string) => string;
  verdict: (raw: string) => Verdict;
};

/**
 * `runState` takes a session ROW rather than a string, so the table has to be
 * driven through one. `run_status` is left null so the value under test arrives
 * on the mission-column path, and `pending_approvals` is zero so the gate
 * short-circuit at the top of the function does not answer for the mapping.
 *
 * Cast through `Parameters<>` rather than importing `StudioSessionListItem`,
 * which keeps this file's import graph down to the modules under test.
 */
function session(raw: string) {
  return {
    run_status: null,
    status: raw,
    pending_approvals: 0,
  } as unknown as Parameters<typeof runState>[0];
}

const NORMALISERS: readonly Normaliser[] = [
  {
    name: "runState · components/runs/run-state.ts",
    answer: (raw) => runState(session(raw)),
    verdict: (raw) => {
      const s = runState(session(raw));
      return {
        terminal: s === "stopped" || s === "done",
        cleanSuccess: s === "done",
        needsPerson: s === "gate",
      };
    },
  },
  {
    name: "runBucket · lib/agent-fleet.ts",
    answer: (raw) => runBucket(raw),
    verdict: (raw) => {
      const b = runBucket(raw);
      return {
        terminal: b === "done" || b === "failed",
        cleanSuccess: b === "done",
        // No bucket of the five means "a person is required". `waiting_approval`
        // is filed under `queued` deliberately, so this normaliser cannot answer
        // the third axis and is not asked to. See RANGE below.
        needsPerson: null,
      };
    },
  },
  {
    name: "classifyRunOutcome · lib/run-analytics.ts",
    answer: (raw) => String(classifyRunOutcome(raw)),
    verdict: (raw) => {
      const o = classifyRunOutcome(raw);
      return {
        terminal: o !== null,
        cleanSuccess: o === "succeeded",
        // Four outcomes, all of them things that already happened. There is no
        // outcome meaning "somebody has to decide", so the axis does not bind.
        needsPerson: null,
      };
    },
  },
  {
    name: "taskStatus · components/meridian/TaskRows.tsx",
    answer: (raw) => taskStatus(raw),
    verdict: (raw) => {
      const t = taskStatus(raw);
      return {
        terminal: TERMINAL_TASK_STATUS.has(t),
        cleanSuccess: t === "done",
        needsPerson: t === "blocked",
      };
    },
  },
];

/** The canonical answer all three axes are measured against: `run-status.ts`,
 *  which is the spelling layer and deliberately not a fifth projection. */
function canonical(raw: string): Verdict {
  const status = normalizeRunStatus(raw);
  return {
    terminal: isTerminal(status),
    cleanSuccess: status === "completed",
    needsPerson: isWaitingOnAPerson(status),
  };
}

/**
 * THE ONE LICENSED DISAGREEMENT, and it is a pair rather than an axis.
 *
 * `runBucket("completed_with_failures")` returns `done`. **Ruled on 2026-08-20**
 * against production rather than against taste: zero `failure_kind` recorded
 * where `failed` records 347, 37,098 tokens burned on average against
 * `completed`'s 21,083 and `failed`'s 1,097, and 67% of its missions reaching a
 * completed state where 35 of 35 `failed` runs halt theirs. So it finished and
 * produced output. The full argument is written at the key in `agent-fleet.ts`.
 *
 * WHY IT IS ONLY A DISAGREEMENT ON THIS AXIS. `RUN_STATE` feeds
 * `summary.withExceptions`, the supervise-by-exception signal, so the question
 * it is really answering is "does anything need a person", and the answer for
 * this status is no. Six other sites call the same run stopped because they are
 * asking "was this a clean success", where the answer is also no. Both are right
 * for the question asked, and `done` is the only word in a five-bucket union
 * that can say "finished, needs nobody".
 *
 * The other three all report it as NOT a clean success, so the divergence is one
 * cell. It is asserted to be NEEDED as well as allowed, so this entry cannot
 * outlive the behaviour it excuses.
 */
const LICENSED: readonly { normaliser: string; raw: string }[] = [
  { normaliser: "runBucket · lib/agent-fleet.ts", raw: "completed_with_failures" },
];

/**
 * Every word each normaliser returns across the whole table, pinned.
 *
 * TWO JOBS. It is the non-vacuity check, because a normaliser that returned one
 * constant would satisfy an agreement assertion that happened to expect that
 * constant. And it is what keeps the third axis' exemption honest: `runBucket`
 * and `classifyRunOutcome` sit that axis out because no member of either range
 * means "a person is required", and if either range grows a member, this pin
 * fails and the exemption has to be argued again rather than inherited.
 */
const RANGE: Readonly<Record<string, readonly string[]>> = {
  "runState · components/runs/run-state.ts": ["done", "gate", "queued", "stopped", "working"],
  "runBucket · lib/agent-fleet.ts": ["done", "failed", "other", "queued", "running"],
  "classifyRunOutcome · lib/run-analytics.ts": [
    "abandoned",
    "failed",
    "null",
    "succeeded",
    "succeeded_with_failures",
  ],
  "taskStatus · components/meridian/TaskRows.tsx": [
    "blocked",
    "done",
    "failed",
    "partial",
    "queued",
    "running",
    "stopped",
  ],
};

function licensed(normaliser: string, raw: string): boolean {
  return LICENSED.some((l) => l.normaliser === normaliser && l.raw === raw);
}

/* ------------------------------------------------------- the table is real */

describe("the table is real, so nothing below can pass by having nothing to check", () => {
  test("twelve written spellings, each with a writer named", () => {
    expect(TABLE.length).toBeGreaterThanOrEqual(12);
    const uncited = TABLE.filter((s) => s.writer.length < 12).map((s) => s.raw);
    expect(uncited).toEqual([]);
  });

  test("no spelling is in the table twice, and none is also a reader-only word", () => {
    const raws = TABLE.map((s) => s.raw);
    expect(raws.length).toBe(new Set(raws).size);
    const both = raws.filter((r) => READER_ONLY.includes(r));
    expect(both).toEqual([]);
  });

  test("every normaliser answers every spelling, and the range is the one pinned", () => {
    for (const n of NORMALISERS) {
      const seen = [...new Set(TABLE.map((s) => n.answer(s.raw)))].sort();
      expect({ normaliser: n.name, range: seen }).toEqual({
        normaliser: n.name,
        range: [...RANGE[n.name]],
      });
    }
  });

  test("the canonical layer recognises every spelling a writer writes", () => {
    // If this fails, the table below is being measured against `unknown` and the
    // three axes are asserting agreement with nothing.
    const unrecognised = TABLE.filter((s) => normalizeRunStatus(s.raw) === "unknown").map(
      (s) => s.raw,
    );
    expect(unrecognised).toEqual([]);
  });

  test("the three axes are not the same axis, which is the premise of the whole file", () => {
    // Each pair has to be separated by at least one spelling, or two of the
    // three assertions below are one assertion wearing two names.
    const rows = TABLE.map((s) => canonical(s.raw));
    expect(rows.some((v) => v.terminal !== v.cleanSuccess)).toBe(true);
    expect(rows.some((v) => v.terminal !== v.needsPerson)).toBe(true);
    expect(rows.some((v) => v.cleanSuccess !== v.needsPerson)).toBe(true);
  });
});

/* ----------------------------------------------------------- axis: terminal */

describe("axis 1 · which spellings mean the work has stopped for good", () => {
  test("all four agree with the canonical layer, with no exemptions", () => {
    const wrong: string[] = [];
    for (const n of NORMALISERS) {
      for (const s of TABLE) {
        const got = n.verdict(s.raw).terminal;
        const want = canonical(s.raw).terminal;
        if (got !== want) {
          wrong.push(
            `${s.raw}: ${n.name} says ${got ? "terminal" : "still live"} ` +
              `(it returned "${n.answer(s.raw)}"), the canonical layer says ` +
              `${want ? "terminal" : "still live"}`,
          );
        }
      }
    }
    expect(
      wrong,
      [
        "",
        "A NORMALISER DISAGREES ABOUT WHETHER A RUN HAS FINISHED.",
        "",
        "This axis carries no exemptions. A terminal status filed under a live",
        "state claims something is still happening when nothing is, and a live",
        "status filed as terminal drops the run out of every queue that would",
        "have shown it. Neither is a different question being answered well.",
        "",
      ].join("\n"),
    ).toEqual([]);
  });
});

/* ----------------------------------------------------- axis: clean success */

describe("axis 2 · which spellings mean it worked, with no holes", () => {
  test("all four agree, except at the one licensed cell", () => {
    const wrong: string[] = [];
    for (const n of NORMALISERS) {
      for (const s of TABLE) {
        if (licensed(n.name, s.raw)) continue;
        const got = n.verdict(s.raw).cleanSuccess;
        const want = canonical(s.raw).cleanSuccess;
        if (got !== want) {
          wrong.push(
            `${s.raw}: ${n.name} says ${got ? "a clean success" : "not a clean success"} ` +
              `(it returned "${n.answer(s.raw)}"), the canonical layer says ` +
              `${want ? "a clean success" : "not a clean success"}`,
          );
        }
      }
    }
    expect(
      wrong,
      [
        "",
        "A SECOND DIVERGENCE ON THE SUCCESS AXIS.",
        "",
        "One is licensed and it is named in LICENSED, with the production",
        "measurements it was ruled on. A second one is the defect AGENTS.md",
        "records: two surfaces reading the same run as opposite outcomes.",
        "",
        "If a new divergence is genuinely a different question being answered,",
        "add it to LICENSED with the argument. Do not widen the axis.",
        "",
      ].join("\n"),
    ).toEqual([]);
  });

  test("every licensed cell is still needed, so the licence cannot outlive it", () => {
    // The half that matters. An exemption list that only ever grows becomes
    // fiction; this one fails in both directions.
    const stale = LICENSED.filter((l) => {
      const n = NORMALISERS.find((x) => x.name === l.normaliser);
      if (!n) return true;
      return n.verdict(l.raw).cleanSuccess === canonical(l.raw).cleanSuccess;
    }).map((l) => `${l.normaliser} on "${l.raw}"`);
    expect(stale).toEqual([]);
  });

  test("the licensed cell is the fleet's `done`, and the other three refuse it", () => {
    // Pinned by value, so the ruling cannot be quietly reversed at either end.
    expect(runBucket("completed_with_failures")).toBe("done");
    expect(runState(session("completed_with_failures"))).toBe("stopped");
    expect(classifyRunOutcome("completed_with_failures")).toBe("succeeded_with_failures");
    expect(taskStatus("completed_with_failures")).toBe("partial");
  });
});

/* ------------------------------------------------ axis: a person is required */

describe("axis 3 · which spellings mean a person is required", () => {
  const BOUND = NORMALISERS.filter((n) => n.verdict("queued").needsPerson !== null);

  test("both normalisers that can say it agree with the canonical layer", () => {
    expect(BOUND.length).toBe(2);
    const wrong: string[] = [];
    for (const n of BOUND) {
      for (const s of TABLE) {
        const got = n.verdict(s.raw).needsPerson;
        const want = canonical(s.raw).needsPerson;
        if (got !== want) {
          wrong.push(
            `${s.raw}: ${n.name} says ${got ? "a person is required" : "nobody is needed"} ` +
              `(it returned "${n.answer(s.raw)}"), the canonical layer says ` +
              `${want ? "a person is required" : "nobody is needed"}`,
          );
        }
      }
    }
    expect(
      wrong,
      [
        "",
        "A NORMALISER DISAGREES ABOUT WHETHER SOMEBODY HAS TO DO SOMETHING.",
        "",
        "This is the axis the colour law is built on. `--mrd-you` means a person",
        "is required and nothing else may wear it, so a spelling that resolves to",
        "a person-required state paints the accent on work nobody has to touch,",
        "and a gate that resolves the other way hides a run that is waiting.",
        "",
      ].join("\n"),
    ).toEqual([]);
  });

  test("`proposed` DOES need a person, and three separate sites already said so", () => {
    /*
     * THE ITEM THAT ASKED FOR THIS FILE IS WRONG ABOUT THIS ONE, so it is pinned
     * rather than fixed. It listed `queued`, `proposed` and `pending` together as
     * wrongly resolving to "waiting on you". `proposed` is not wrongly resolved:
     * a proposed mission is one an ambient trigger raised and nobody has
     * promoted, so a person is exactly what it is waiting for.
     *
     *   run-status.ts       `isWaitingOnAPerson` returns true for it, argued
     *   run-state.ts        maps it to `gate`
     *   build-status.ts     maps it to `gate`, with the OBS-10 note calling it
     *                       "the trigger-tick's own HITL gate"
     *
     * It is 232 of 349 missions, so getting this backwards would have painted
     * two thirds of the mission table the wrong way round. What WAS wrong is
     * that `taskStatus` reached the right answer through its `default` arm, one
     * line away from the seven spellings the same arm got wrong.
     */
    expect(isWaitingOnAPerson(normalizeRunStatus("proposed"))).toBe(true);
    expect(runState(session("proposed"))).toBe("gate");
    expect(taskStatus("proposed")).toBe("blocked");
  });

  test("a gate count that could not be read outranks every spelling too", () => {
    /*
     * `pending_approvals` is null when the gate read failed, and until
     * 2026-09-09 that arrived as a zero: a run whose status still said running
     * while an approval sat pending read "Working" while a person was the thing
     * it was waiting on. An unread count resolves toward the look, because
     * being sent to a run that needs nothing costs a glance and the opposite
     * costs a person waiting on a machine that says it is busy.
     */
    const notGated = TABLE.filter((s) => {
      const row = { run_status: null, status: s.raw, pending_approvals: null };
      return runState(row as unknown as Parameters<typeof runState>[0]) !== "gate";
    }).map((s) => s.raw);
    expect(notGated).toEqual([]);
  });

  test("a pending approval outranks every spelling in the table", () => {
    // `run-state.ts`'s own claim, and it had no test. Answering a gate updates
    // the approvals table and `missions.status` only catches up on the next
    // resume tick, so the count has to win or a gated run reads as finished.
    const stillGated = TABLE.filter((s) => {
      const row = { run_status: null, status: s.raw, pending_approvals: 1 };
      return runState(row as unknown as Parameters<typeof runState>[0]) !== "gate";
    }).map((s) => s.raw);
    expect(stillGated).toEqual([]);
  });
});

/* --------------------------------------------------- the three fixed branches */

describe("the branches this file was written to fix", () => {
  test("a run that finished through the single-agent path is not queued", () => {
    /*
     * `runState` tested `completed || done` and never the singular, which
     * `agents.functions.ts:211` writes on the happy path. A finished run read
     * "Queued" in the Runs list AND sat under Queued on the board, and
     * `run-state.ts`'s own header names that pair as the failure it exists to
     * prevent. Two of 1,889 production runs carry the singular today.
     */
    expect(runState(session("complete"))).toBe("done");
    expect(runState(session("completed"))).toBe("done");
    expect(runState(session("done"))).toBe("done");
  });

  test("a cancelled run has finished, so it reaches the success rate", () => {
    /*
     * `classifyRunOutcome` returned null for it, which means "in flight", which
     * means every station success rate dropped it silently and forever. It is
     * `abandoned` rather than `failed` for the reason `halted` is: the run
     * stopped without finishing, and no fault was recorded. `stopRun` is now
     * wired, so this spelling starts arriving the first time somebody presses it.
     */
    expect(classifyRunOutcome("cancelled")).toBe("abandoned");
    expect(classifyRunOutcome("canceled")).toBe("abandoned");
  });

  test("a delegate job that finished is a success, not a run still in flight", () => {
    // Not in the item. `foldDelegateResult` writes the literal "done" to
    // `agent_runs.status`, and this returned null for it: the same defect as
    // `cancelled`, on a spelling nobody had noticed.
    expect(classifyRunOutcome("done")).toBe("succeeded");
  });

  test("a run nothing has picked up yet is not waiting on a person", () => {
    /*
     * `taskStatus`' `default: return "blocked"` sent every spelling it did not
     * name to the label "Waiting on you" in `--mrd-you`. Three of them are
     * `queued`, `pending` and `scheduled`, where nobody is being asked for
     * anything: the run is waiting for a worker to take it.
     */
    for (const raw of ["queued", "pending", "scheduled"]) {
      expect({ raw, state: taskStatus(raw) }).toEqual({ raw, state: "queued" });
    }
  });

  test("a stop and a partial finish are terminal, and neither is a person's problem", () => {
    // These were reaching the same `default` and coming out `blocked`. The fix
    // belongs here rather than at the caller: `today/RunState.tsx` had already
    // wrapped the mapping in a `STOPPED` map for two of them, and a caller-level
    // patch is how the next caller inherits the bug.
    expect(taskStatus("halted")).toBe("stopped");
    expect(taskStatus("cancelled")).toBe("stopped");
    expect(taskStatus("completed_with_failures")).toBe("partial");
    for (const raw of ["halted", "cancelled", "completed_with_failures"]) {
      expect({ raw, terminal: TERMINAL_TASK_STATUS.has(taskStatus(raw)) }).toEqual({
        raw,
        terminal: true,
      });
    }
  });

  test("an unrecognised value still resolves to a person, which is the right default", () => {
    // Unchanged, and deliberately. Every spelling a writer writes is now an
    // explicit case, so this arm only sees words nobody produces, and "somebody
    // should look at this" is the only reading that is true whatever it means.
    expect(taskStatus("a_status_nobody_writes")).toBe("blocked");
    expect(taskStatus(null)).toBe("blocked");
  });
});

/* ------------------------------------------------------------- the colour law */

describe("the hue reserved for a person is spent only where a person is required", () => {
  test("`--mrd-you` appears once in the task tone table, on `blocked`", () => {
    const wearers = (Object.keys(TASK_TONE) as (keyof typeof TASK_TONE)[]).filter((state) =>
      TASK_TONE[state].includes("--mrd-you"),
    );
    expect(wearers).toEqual(["blocked"]);
  });

  test("the not-yet-started state takes `--mrd-hold`, and there is no warn token", () => {
    // `--mrd-hold` is declared "stopped, and not on you", and `run-parts.tsx`
    // already spends it on a queued run. Gold, amber, mustard and yellow were
    // removed from the system by founder ruling on 2026-08-14, so a missing case
    // is never answered with a sixth hue.
    expect(TASK_TONE.queued).toBe("var(--mrd-hold)");
    expect(TASK_LABEL.queued).toBe("Queued");
  });

  test("no spelling that needs nobody resolves to a state wearing the accent", () => {
    const painted = TABLE.filter((s) => {
      if (canonical(s.raw).needsPerson) return false;
      return TASK_TONE[taskStatus(s.raw)].includes("--mrd-you");
    }).map((s) => `${s.raw} renders "${TASK_LABEL[taskStatus(s.raw)]}" in --mrd-you`);
    expect(
      painted,
      [
        "",
        "THE ACCENT IS ON WORK NOBODY HAS TO TOUCH.",
        "",
        "`--mrd-you` is the one hue that means a person is required. Spending it",
        "on a run that is queued, stopped or finished is how a reader learns to",
        "ignore it, and then the runs that ARE waiting on them look the same as",
        "everything else.",
        "",
      ].join("\n"),
    ).toEqual([]);
  });
});

/* ------------------------------------------------------ reader-only spellings */

describe("spellings a normaliser knows and no writer writes", () => {
  test("none of them is a clean success in one normaliser and a failure in another", () => {
    /*
     * The only assertion these can carry honestly. They cannot be held to the
     * canonical layer, because a normaliser that does not recognise a word
     * nothing writes has no defect to answer for. But two normalisers reading
     * the same word as opposite outcomes is a defect whoever writes it next
     * inherits, and that is checkable without a writer.
     */
    const contradictions: string[] = [];
    for (const raw of READER_ONLY) {
      const says = NORMALISERS.map((n) => ({ n: n.name, v: n.verdict(raw) }));
      const success = says.filter((s) => s.v.cleanSuccess).map((s) => s.n);
      const failure = says
        .filter((s) => s.v.terminal && !s.v.cleanSuccess && !s.v.needsPerson)
        .map((s) => s.n);
      if (success.length > 0 && failure.length > 0) {
        contradictions.push(
          `${raw}: a success to ${success.join(", ")}, an ending to ${failure.join(", ")}`,
        );
      }
    }
    expect(contradictions).toEqual([]);
  });

  test("`succeeded` is one of these, which is the correction to the item's own list", () => {
    // Recognised by `agent-fleet.ts`, `run-status.ts` and `taskStatus`, written
    // by nothing. `runState` does not recognise it and is not failed for that.
    expect(READER_ONLY).toContain("succeeded");
    expect(TABLE.map((s) => s.raw)).not.toContain("succeeded");
    expect(runBucket("succeeded")).toBe("done");
    expect(taskStatus("succeeded")).toBe("done");
  });
});

/* ------------------------------------------------------------------- purity */

/**
 * THE CHAIN IS ASSERTED RATHER THAN ASSUMED, which the item asked for by name.
 *
 * The claim is that driving all four normalisers pulls in no `.server.ts` and
 * bottoms out at `ai/tools/defaults`, a module with no imports at all. That
 * matters because a guard needing a bundler or a database is a guard that gets
 * skipped, and because three of the four modules reach `agent-vocabulary`, which
 * is one edge away from the tool catalogue.
 *
 * Read from the source text, the way `status-vocabulary-per-column.test.ts` and
 * `run-state.test.ts` already do, because a static fact about which files import
 * which cannot be observed from inside a loaded module. Type-only imports are
 * skipped, since they are erased and carry no runtime edge: `run-state.ts`
 * type-imports `studio.functions`, whose own graph does reach the server.
 */
const SRC = join(import.meta.dir, "..", "..");

function sourceOf(rel: string): string | null {
  for (const candidate of [rel, `${rel}.ts`, `${rel}.tsx`, `${rel}/index.ts`, `${rel}/index.tsx`]) {
    try {
      return readFileSync(join(SRC, candidate), "utf8");
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** Local modules this file imports at RUNTIME. A bare specifier such as `react`
 *  or `bun:test` is not ours and is not walked. */
function valueImports(text: string, fromRel: string): string[] {
  const body = stripComments(text);
  const out: string[] = [];

  for (const m of body.matchAll(/import\s+([^;]*?)\s*from\s*["']([^"']+)["']/g)) {
    const clause = m[1].trim();
    if (clause.startsWith("type ")) continue;
    const named = clause.match(/^\{([^}]*)\}$/);
    if (named && named[1].split(",").every((b) => b.trim() === "" || b.trim().startsWith("type ")))
      continue;
    out.push(m[2]);
  }
  for (const m of body.matchAll(/(?<!from\s)import\s+["']([^"']+)["']/g)) out.push(m[1]);

  const here = fromRel.includes("/") ? fromRel.slice(0, fromRel.lastIndexOf("/")) : "";
  return out
    .map((spec) => {
      if (spec.startsWith("@/")) return spec.slice(2);
      if (spec.startsWith("./")) return join(here, spec.slice(2));
      if (spec.startsWith("../")) return join(here, spec);
      return null;
    })
    .filter((s): s is string => s !== null);
}

const ENTRY_POINTS = [
  "components/runs/run-state",
  "components/meridian/TaskRows",
  "lib/agent-fleet",
  "lib/run-analytics",
  "lib/run-status",
];

function walk(): { visited: string[]; missing: string[] } {
  const visited = new Set<string>();
  const missing: string[] = [];
  const queue = [...ENTRY_POINTS];
  while (queue.length > 0) {
    const rel = queue.pop() as string;
    if (visited.has(rel)) continue;
    visited.add(rel);
    const text = sourceOf(rel);
    if (text === null) {
      missing.push(rel);
      continue;
    }
    for (const next of valueImports(text, rel)) queue.push(next);
  }
  return { visited: [...visited].sort(), missing };
}

describe("nothing under test reaches the server, and the chain has a floor", () => {
  test("every module in the graph resolves, so the walk is not silently empty", () => {
    const { visited, missing } = walk();
    expect(missing).toEqual([]);
    // Five entry points plus at least the two modules they share. A walk that
    // found only its own starting points would pass the next assertion for free.
    expect(visited.length).toBeGreaterThan(ENTRY_POINTS.length + 1);
  });

  test("no `.server.ts` is reachable from any of the four", () => {
    // Named, never counted: which module opened the edge is the whole work of
    // closing it again.
    const reached = walk().visited.filter((rel) => rel.includes(".server"));
    expect(reached).toEqual([]);
  });

  test("the chain bottoms out at the tool catalogue, which imports nothing", () => {
    const { visited } = walk();
    expect(visited).toContain("lib/ai/tools/defaults");
    const catalogue = sourceOf("lib/ai/tools/defaults");
    expect(catalogue).not.toBeNull();
    expect(valueImports(catalogue as string, "lib/ai/tools/defaults")).toEqual([]);
  });
});
