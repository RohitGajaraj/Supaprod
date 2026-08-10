/**
 * A FIXED TIMEOUT IN A TEST IS AN ASSERTION ABOUT THE MACHINE IT RUNS ON.
 *
 * On 2026-08-10 three AskPane switcher tests went from an intermittent 1-in-3
 * flake to failing every run. The obvious reading was a regression from the
 * commit that had just merged, and that reading was reported before it was
 * checked. It was wrong: `git diff` across the merge showed the component files
 * were byte-identical.
 *
 * The tests did `click()` and then `await new Promise(r => setTimeout(r, 10))`.
 * That is not a wait for anything. It is a BET that an async read resolves and
 * React commits inside ten milliseconds. Measured by polling instead of
 * guessing, the real settle time was 13 to 26ms.
 *
 * The proof that it was a deadline and not a break is a graded sweep:
 *
 *     wait=15ms -> 3 fail      wait=60ms  -> 1 fail
 *     wait=30ms -> 2 fail      wait=120ms -> 0 fail
 *
 * A broken component does not care how long you wait. A deadline curve like
 * that says the assertion was about elapsed time all along.
 *
 * WHY THIS IS WORTH A GUARD RATHER THAN A NOTE. The failure mode has three
 * properties that make it uniquely expensive:
 *
 *   1. It is INVISIBLE until the tree gains weight, so it ships green.
 *   2. It then fails PROPORTIONALLY to load, which reads as flakiness, and
 *      "known flaky" is where investigations go to die. Two separate lanes
 *      filed these three tests exactly that way on the same day.
 *   3. When it finally tips, it points at WHOEVER LANDED LAST rather than at
 *      the bet. It cost one lane an accusation and nearly cost another an
 *      evening chasing a diff that was empty.
 *
 * THE RULE: wait on a condition, never on a clock. `waitFor` and `findBy*`
 * already exist for this and retry until the thing you actually care about is
 * true.
 *
 * Scope: this guard covers the sleep-then-assert pattern in TEST files only.
 * Production code legitimately sleeps (backoff, polling ticks, rate limits) and
 * is not scanned.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..");

function testFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      testFiles(full, out);
      continue;
    }
    if (/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Comments stripped: this guard's own explanation quotes the banned pattern,
 *  and so does the doc entry it enforces. A scan that cannot tell code from
 *  prose about code would flag the explanation and teach people to delete it. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * `await new Promise(res => setTimeout(res, N))` and its close spellings.
 *
 * Deliberately narrow. It matches the sleep-as-a-wait idiom and nothing else:
 * a `setTimeout` used to SCHEDULE something, or a fake-timer advance, is a
 * different thing and is not flagged. A guard that cries wolf gets deleted, and
 * a deleted guard protects nothing.
 */
const SLEEP_PROMISE = /new Promise\s*\(\s*\(?\s*\w*\s*\)?\s*=>\s*setTimeout\s*\(/g;

/**
 * TWO USES OF THE SAME SYNTAX, and only one of them is the bug.
 *
 * The first draft of this guard flagged `ApprovalCard.test.tsx` eight times and
 * every one was a FALSE POSITIVE. Those sleeps sit inside a mocked handler:
 *
 *     const onApprove = mock(async () => {
 *       await new Promise((resolve) => setTimeout(resolve, 50));
 *     });
 *
 * That is not a wait, it is a STUB OF A SLOW OPERATION — the latency is the
 * thing under test, because the test is checking that the button shows
 * "Approving" and locks against a double click WHILE the handler is in flight.
 * Remove the sleep and the test can no longer observe the state it exists to
 * assert. It is correct exactly as written.
 *
 * The bug is the other shape: a sleep in the test BODY, after an action,
 * standing in for a wait on a result.
 *
 * So the window before each match is inspected for a mock boundary. This
 * matters more than the false positives themselves: a guard that cries wolf is
 * deleted by the third person who hits it, and a deleted guard protects
 * nothing. Precision is what buys a convention its enforcement.
 */
const SIMULATED_LATENCY = /mock\s*\(\s*async|vi\.fn\s*\(\s*async|jest\.fn\s*\(\s*async/;
const LOOKBACK = 160;

/**
 * Files known to still carry the pattern, each with the reason it is tolerated.
 *
 * This list may SHRINK and must never grow. A new entry means somebody wrote a
 * new bet, which is the thing the guard exists to stop. Empty it and delete the
 * allowance.
 */
const KNOWN: ReadonlyArray<string> = [
  // Four remaining bets in the file where this was found. They pass today only
  // because their queries start at mount rather than on a click, so they get a
  // whole mount plus the sleep as slack. Same trap, more headroom. Tracked in
  // docs/operations/testing/README.md.
  join("components", "ask", "__tests__", "AskPane.test.tsx"),
];

describe("a timeout is not a wait", () => {
  const offenders = testFiles(SRC)
    .map((f) => {
      const code = codeOf(readFileSync(f, "utf8"));
      // Keep only sleeps that are NOT inside a mocked handler. See
      // SIMULATED_LATENCY above: a stubbed slow operation is the thing under
      // test, not a wait for one.
      const hits = [...code.matchAll(SLEEP_PROMISE)].filter((m) => {
        const at = m.index ?? 0;
        return !SIMULATED_LATENCY.test(code.slice(Math.max(0, at - LOOKBACK), at));
      });
      return { file: f, hits };
    })
    .filter((r) => r.hits.length > 0)
    .map((r) => ({ rel: r.file.slice(SRC.length + 1), count: r.hits.length }));

  it("finds test files at all, so a passing run means something", () => {
    // Without this the whole guard passes vacuously if the walker breaks.
    expect(testFiles(SRC).length).toBeGreaterThan(100);
  });

  it("no test sleeps instead of waiting on a condition", () => {
    const unexpected = offenders.filter((o) => !KNOWN.some((k) => o.rel.endsWith(k)));
    expect(
      unexpected.map((o) => `${o.rel} (${o.count})`),
      "A fixed sleep is an assertion about the machine the test runs on. It ships " +
        "green, then fails proportionally to load, which reads as flakiness, and it " +
        "blames whoever landed last rather than the bet. Wait on a condition: " +
        "`waitFor` or `findBy*`.",
    ).toEqual([]);
  });

  it("the tolerated list has not grown", () => {
    // The allowance is a debt, not a licence. A new file appearing here means
    // the guard was routed around rather than satisfied.
    const tolerated = offenders.filter((o) => KNOWN.some((k) => o.rel.endsWith(k)));
    expect(tolerated.length).toBeLessThanOrEqual(KNOWN.length);
  });
});
