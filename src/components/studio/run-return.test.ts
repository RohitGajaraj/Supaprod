/**
 * THE RETURN DOCUMENT'S RULES, held still.
 *
 * Every case here is one of the four defects the 2026-08-10 rewrite of the run
 * surface was written to kill, or one of the honesty rules that replaced it.
 * They are worth a test rather than a review note for the reason the rest of
 * this suite gives: each of them typechecks perfectly while being wrong, and the
 * only way to see the wrongness is to look at a real run.
 */
import { describe, it, expect } from "bun:test";
import {
  checkCalls,
  finalSummary,
  formatCheckDuration,
  formatDuration,
  lastActivityAt,
  outcomeAndAsk,
  runSpanMs,
  splitSummary,
  typedRefs,
  type RunLike,
} from "./run-return";

const T0 = "2026-08-10T09:00:00.000Z";

function run(over: Partial<RunLike> = {}): RunLike {
  return {
    run_id: "r1",
    status: "completed",
    output: null,
    created_at: T0,
    last_checkpoint_at: null,
    steps: [],
    ...over,
  };
}

describe("formatDuration is precise to the second, always", () => {
  it("never rounds a sub-minute run away", () => {
    // THE DEFECT: everything under a minute read "now", so a forty-second run
    // had no duration at all.
    expect(formatDuration(40_000)).toBe("40s");
    expect(formatDuration(999)).toBe("0s");
  });

  it("keeps the seconds on a minutes-long run", () => {
    expect(formatDuration(18 * 60_000 + 6_000)).toBe("18m 6s");
  });

  it("pads inside an hour so a column of them lines up", () => {
    expect(formatDuration(3_600_000 + 4 * 60_000 + 12_000)).toBe("1h 04m 12s");
  });

  it("refuses a duration it cannot state", () => {
    expect(formatDuration(-1)).toBeNull();
    expect(formatDuration(Number.NaN)).toBeNull();
  });
});

describe("runSpanMs reads the end from the record, or refuses", () => {
  const now = Date.parse("2026-08-10T09:20:00.000Z");

  it("counts to NOW while the run is alive, which is what makes it a counter", () => {
    expect(
      runSpanMs({ startedAt: T0, completedAt: null, lastActivityAt: null, live: true, now }),
    ).toBe(20 * 60_000);
  });

  it("prefers the recorded finish over the last checkpoint", () => {
    expect(
      runSpanMs({
        startedAt: T0,
        completedAt: "2026-08-10T09:18:06.000Z",
        lastActivityAt: "2026-08-10T09:05:00.000Z",
        live: false,
        now,
      }),
    ).toBe(18 * 60_000 + 6_000);
  });

  it("falls back to the last checkpoint, which is a real observation", () => {
    expect(
      runSpanMs({
        startedAt: T0,
        completedAt: null,
        lastActivityAt: "2026-08-10T09:05:00.000Z",
        live: false,
        now,
      }),
    ).toBe(5 * 60_000);
  });

  it("draws nothing rather than a number, where the record cannot say", () => {
    expect(
      runSpanMs({ startedAt: T0, completedAt: null, lastActivityAt: null, live: false, now }),
    ).toBeNull();
    expect(
      runSpanMs({ startedAt: null, completedAt: T0, lastActivityAt: null, live: false, now }),
    ).toBeNull();
    // Timestamps that disagree are a fact about the record, not a duration.
    expect(
      runSpanMs({
        startedAt: "2026-08-10T09:20:00.000Z",
        completedAt: T0,
        lastActivityAt: null,
        live: false,
        now,
      }),
    ).toBeNull();
  });

  it("takes the latest moment anything is known to have happened", () => {
    expect(
      lastActivityAt([
        run({ created_at: T0, last_checkpoint_at: "2026-08-10T09:04:00.000Z" }),
        run({ run_id: "r2", created_at: "2026-08-10T09:05:00.000Z", last_checkpoint_at: null }),
      ]),
    ).toBe("2026-08-10T09:05:00.000Z");
  });
});

describe("the first line carries the outcome and the ask, never the activity", () => {
  const base = {
    missionStatus: "completed",
    live: false,
    pendingCalls: 0,
    changesetStatus: null as string | null,
    productionDeployed: false,
    duration: "18m 6s",
  };

  it("puts a waiting decision above every other state", () => {
    const h = outcomeAndAsk({ ...base, missionStatus: "failed", pendingCalls: 1 });
    expect(h.ask).toBe("It needs your call.");
  });

  it("asks for the review when the pull request is open", () => {
    const h = outcomeAndAsk({ ...base, changesetStatus: "pr_open" });
    expect(h.lead).toBe("Finished in");
    expect(h.duration).toBe("18m 6s");
    expect(h.ask).toBe("Ready for your review.");
  });

  it("only says shipped when something really is in production", () => {
    expect(outcomeAndAsk({ ...base, changesetStatus: "merged" }).lead).toBe("Finished in");
    expect(
      outcomeAndAsk({ ...base, changesetStatus: "merged", productionDeployed: true }).lead,
    ).toBe("Shipped in");
  });

  it("names a stall as needing an instruction rather than as a status", () => {
    expect(outcomeAndAsk({ ...base, missionStatus: "failed" }).ask).toBe(
      "It is stuck. Tell it what to do next.",
    );
  });

  it("degrades to a shorter true sentence when there is no duration", () => {
    const h = outcomeAndAsk({ ...base, duration: null, changesetStatus: "pr_open" });
    // Never a dangling "Finished in" with nothing after it.
    expect(h.lead).toBe("Finished");
    expect(h.duration).toBeNull();
  });

  it("asks for nothing while the work is still moving", () => {
    expect(outcomeAndAsk({ ...base, live: true, missionStatus: "running" }).ask).toBeNull();
  });
});

describe("the agent's own account is found, and never invented", () => {
  it("takes the last final message across every run", () => {
    const runs = [
      run({ run_id: "a", steps: [{ kind: "final", message: "first" }] }),
      run({ run_id: "b", steps: [{ kind: "final", message: "second" }] }),
    ];
    expect(finalSummary(runs)?.text).toBe("second");
  });

  it("falls back to output ONLY on a completed run", () => {
    // On every other status the loop writes the halt reason, the pause message
    // or the error into that column. Rendering one as "what it says it did"
    // would put an apology in the agent's mouth.
    expect(finalSummary([run({ status: "completed", output: "done" })])?.text).toBe("done");
    expect(finalSummary([run({ status: "failed", output: "boom" })])).toBeNull();
  });

  it("returns null rather than something plausible", () => {
    expect(finalSummary([])).toBeNull();
    expect(finalSummary([run({ steps: [{ kind: "thought", text: "hmm" }] })])).toBeNull();
  });
});

describe("the summary is short by default and whole on request", () => {
  it("stops at a sentence rather than mid-clause", () => {
    const long = `${"We rewrote the loader. ".repeat(20)}End.`;
    const s = splitSummary(long, 100);
    expect(s.more).toBe(true);
    expect(s.lead.endsWith(".")).toBe(true);
    expect(s.lead.length).toBeLessThanOrEqual(100);
    // The whole thing is kept, never thrown away.
    expect(s.full).toBe(long.trim());
  });

  it("falls back to a word boundary, and says so, when no sentence ends in range", () => {
    const s = splitSummary("a".repeat(400), 100);
    expect(s.lead.endsWith("…")).toBe(true);
    expect(s.more).toBe(true);
  });

  it("offers more when there are further paragraphs, even on a short lead", () => {
    const s = splitSummary("Short lead.\n\nThe detail below.");
    expect(s.lead).toBe("Short lead.");
    expect(s.more).toBe(true);
  });

  it("does not offer more when there is none", () => {
    expect(splitSummary("All of it.").more).toBe(false);
  });
});

describe("typed refs are recognised, and punctuation is left in the prose", () => {
  it("finds a path with a line range", () => {
    const t = typedRefs("Fixed src/lib/loop.ts:30-32 and moved on.");
    expect(t.filter((x) => x.kind === "ref").map((x) => x.value)).toEqual([
      "src/lib/loop.ts:30-32",
    ]);
  });

  it("never swallows the full stop that ends the sentence", () => {
    const t = typedRefs("It touched src/app.tsx.");
    expect(t.find((x) => x.kind === "ref")?.value).toBe("src/app.tsx");
    expect(t[t.length - 1]).toEqual({ kind: "text", value: "." });
  });

  it("honours the agent's own backticks and strips them", () => {
    const t = typedRefs("Ran `bun test` twice.");
    expect(t.find((x) => x.kind === "ref")?.value).toBe("bun test");
  });

  it("returns the prose untouched when there is nothing to mark", () => {
    expect(typedRefs("Nothing here at all")).toEqual([
      { kind: "text", value: "Nothing here at all" },
    ]);
  });
});

describe("the checks are read from the record, with their real results", () => {
  it("carries every executed command's exit code through untouched", () => {
    const calls = checkCalls([
      run({
        steps: [
          {
            kind: "tool_call",
            name: "studio.checks.run",
            status: "executed",
            result: {
              available: true,
              checks: [
                { name: "typecheck", passed: true, exit_code: 0, duration_ms: 4200 },
                {
                  name: "test",
                  passed: false,
                  exit_code: 1,
                  duration_ms: 91_000,
                  stderr: "1 fail",
                },
              ],
            },
          },
        ],
      }),
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0].state).toBe("fail");
    expect(calls[0].ran.map((c) => [c.name, c.exitCode, c.passed])).toEqual([
      ["typecheck", 0, true],
      ["test", 1, false],
    ]);
    expect(calls[0].ran[1].stderr).toBe("1 fail");
  });

  it("never reports a pass for a check that could not run", () => {
    const calls = checkCalls([
      run({
        steps: [
          {
            kind: "tool_call",
            name: "studio.checks.run",
            status: "executed",
            result: { available: false, reason: "No execution sandbox is configured." },
          },
        ],
      }),
    ]);
    expect(calls[0].state).toBe("warn");
    expect(calls[0].verdict).toBe("No execution sandbox is configured.");
  });

  it("reads each inspection's own verdict", () => {
    const calls = checkCalls([
      run({
        steps: [
          {
            kind: "tool_call",
            name: "studio.secrets.scan",
            status: "executed",
            result: { clean: true },
          },
          {
            kind: "tool_call",
            name: "studio.review",
            status: "executed",
            result: { verdict: "block", summary: "Swallowed error in the retry path." },
          },
          {
            kind: "tool_call",
            name: "studio.tests.plan",
            status: "executed",
            result: { gaps: ["a.test.ts", "b.test.ts"] },
          },
        ],
      }),
    ]);
    expect(calls.map((c) => [c.tool, c.state])).toEqual([
      ["studio.secrets.scan", "pass"],
      ["studio.review", "fail"],
      ["studio.tests.plan", "warn"],
    ]);
    expect(calls[1].verdict).toBe("Swallowed error in the retry path.");
    expect(calls[2].verdict).toBe("2 test files still owed");
  });

  it("counts a tool that threw as a failure and quotes it", () => {
    const calls = checkCalls([
      run({
        steps: [
          {
            kind: "tool_call",
            name: "ci.logs",
            status: "error",
            error: "no pr_number given",
          },
        ],
      }),
    ]);
    expect(calls[0].state).toBe("fail");
    expect(calls[0].verdict).toBe("no pr_number given");
  });

  it("ignores everything that is not a check", () => {
    expect(
      checkCalls([
        run({
          steps: [
            { kind: "tool_call", name: "studio.stage", status: "executed", result: { ok: true } },
            { kind: "thought", text: "considering" },
          ],
        }),
      ]),
    ).toEqual([]);
  });

  it("keeps a decimal on a fast check, so a cached run is visibly different", () => {
    expect(formatCheckDuration(4200)).toBe("4.2s");
    expect(formatCheckDuration(91_000)).toBe("1m 31s");
    expect(formatCheckDuration(null)).toBeNull();
  });
});
