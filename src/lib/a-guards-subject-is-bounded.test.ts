/**
 * ── A GUARD'S SUBJECT IS BOUNDED, NEVER "TO THE END OF THE FILE" (P-73) ──
 *
 * `src.slice(src.indexOf("export const thing"))` runs to EOF, so the NEXT thing
 * appended below `thing` silently joins the subject under test. Seven sites in
 * one night, and none of the failures described a defect:
 *
 *   - `asking-before-the-promise` asserts `checkForecastObservable` takes no
 *     `decisionId`; appending `buildOnYourWord` gave it one.
 *   - `parked-work-must-be-visible` asserts `getParkedWork` writes nothing;
 *     the same append gave it an `.update(`.
 *   - `the-app-runs-in-the-pane` asserts `previewForChangeset` never writes;
 *     appending `retryPreviewNow` -- legitimately an upsert -- gave it one.
 *   - and four more of the same family, two of which I wrote WHILE fixing the
 *     others, including one anchored on a comment the stripper had removed so
 *     `indexOf` returned -1 and the slice ran to EOF anyway.
 *
 * ── -1 IS THE SHARP EDGE ─────────────────────────────────────────────────
 *
 * `indexOf` returning -1 does not fail. `slice(-1)` takes the LAST CHARACTER;
 * `slice(-1, n)` is usually empty. Either way the guard stops testing what its
 * name says and starts passing, or failing, for reasons unrelated to it.
 *
 * ── A RATCHET, NOT A CLEAN BILL ──────────────────────────────────────────
 *
 * 127 unbounded slices across 77 test files today. Recorded per file and never
 * allowed to grow: the next one cannot be written, and every packet that bounds
 * one lowers a number that never rises.
 *
 * THE FIX, for whoever this fails on: pass the second argument, take it from
 * the next `export`/declaration rather than from prose, and assert BOTH ends
 * were found -- `expect(from).toBeGreaterThan(-1)` and the same for `to`.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Measured 2026-09-04. A number may go DOWN and never up. */
const BASELINE: Record<string, number> = {
  "src/__tests__/a-destructive-control-asks-first.test.ts": 1,
  "src/__tests__/surface-discipline.test.ts": 1,
  "src/components/governance/__tests__/the-reach-came-from-a-default.test.ts": 1,
  "src/components/governance/a-limit-nothing-enforces-is-not-a-limit.test.ts": 3,
  "src/components/governance/what-the-record-can-say.test.ts": 1,
  "src/components/landing/Receipts.test.ts": 1,
  "src/components/meridian/__tests__/a-control-is-big-enough-to-hit.test.ts": 1,
  "src/components/meridian/__tests__/onramp-parts.test.ts": 1,
  "src/components/meridian/email-palette.drift.test.ts": 1,
  "src/components/settings/the-page-does-not-promise-a-result-that-never-comes.test.ts": 2,
  "src/components/shell/AppFrame.station-keys.test.ts": 2,
  "src/components/shell/__tests__/dialogs-keep-their-promises.test.tsx": 2,
  "src/components/shell/run-strip.test.tsx": 1,
  "src/components/shell/the-sample-says-it-is-a-sample.test.ts": 1,
  "src/components/shell/the-search-results-can-be-read.test.tsx": 1,
  "src/components/ship/gate-order-is-an-invariant.test.tsx": 1,
  "src/components/spine/the-motion-toggle-reaches-the-run-screen.test.ts": 1,
  "src/components/supaprod/__tests__/one-footer-list.test.ts": 1,
  "src/components/track/the-app-runs-in-the-pane.test.tsx": 1,
  "src/components/track/the-probe-has-a-door.test.ts": 2,
  "src/components/track/the-verdict-quotes-what-it-read.test.tsx": 1,
  "src/lib/__tests__/keeping-a-bet-marks-the-station.test.ts": 2,
  "src/lib/__tests__/learn-can-say-not-yet.test.ts": 6,
  "src/lib/__tests__/learn-shows-the-record-it-just-wrote.test.ts": 1,
  "src/lib/__tests__/promoting-a-cluster-is-terminal.test.ts": 2,
  "src/lib/__tests__/the-brain-does-not-rank-fiction.test.ts": 7,
  "src/lib/__tests__/the-brain-reads-one-workspace.test.ts": 6,
  "src/lib/__tests__/the-landing-frame-reaches-the-pane.test.ts": 1,
  "src/lib/__tests__/the-ledger-chain-has-a-writer-for-every-hop.test.ts": 2,
  "src/lib/__tests__/the-push-lane-cannot-go-blank.test.ts": 1,
  "src/lib/a-cost-derived-four-hops-away.test.ts": 1,
  "src/lib/ai/a-verdict-must-grade-the-bet-that-was-made.test.ts": 1,
  "src/lib/ai/budget-meter.test.ts": 1,
  "src/lib/ai/the-guardrail-cliff-was-coverage-not-a-regression.test.ts": 1,
  "src/lib/ai/tools/__tests__/brain-read-tools.test.ts": 1,
  "src/lib/ai/tools/__tests__/prd-read-tools.test.ts": 1,
  "src/lib/ai/tools/a-cached-pull-request-is-not-a-pull-request.test.ts": 1,
  "src/lib/ai/tools/a-seat-that-halts-opens-nothing.test.ts": 1,
  "src/lib/ai/tools/the-loop-must-not-eat-its-own-exhaust.test.ts": 1,
  "src/lib/an-approval-knew-its-workspace-all-along.test.ts": 2,
  "src/lib/approvals-queue-dedup.test.ts": 2,
  "src/lib/brain/a-verdict-made-is-not-a-verdict-taken-back.test.ts": 1,
  "src/lib/build/native.server.test.ts": 1,
  "src/lib/hosting/a-gate-that-cannot-succeed-is-not-offered.test.ts": 2,
  "src/lib/hosting/a-ship-that-cannot-deploy-names-the-provider.test.ts": 3,
  "src/lib/invites.functions.test.ts": 1,
  "src/lib/mcp-failure-signals.test.ts": 1,
  "src/lib/payments/credit-runway.test.ts": 2,
  "src/lib/sources/the-fold-reports-the-surviving-row.test.ts": 1,
  "src/lib/spine/a-crew-split-by-the-clock-still-filed-its-work.test.ts": 1,
  "src/lib/spine/a-design-verdict-against-the-premise-holds.test.ts": 1,
  "src/lib/spine/a-handback-cannot-manufacture-proof.test.ts": 1,
  "src/lib/spine/a-person-hold-does-not-take-a-slot-every-tick.test.ts": 1,
  "src/lib/spine/a-ship-that-cannot-deploy-holds-waiting-on-a-person.test.ts": 1,
  "src/lib/spine/a-station-that-filed-nothing-says-what-stopped-it.test.ts": 3,
  "src/lib/spine/a-station-that-says-committed-over-a-refusal.test.ts": 2,
  "src/lib/spine/a-stop-that-cannot-say-why.test.ts": 2,
  "src/lib/spine/a-track-started-from-a-sentence-reaches-a-workspace.test.ts": 5,
  "src/lib/spine/agent-roster-seed.test.ts": 1,
  "src/lib/spine/an-intervention-needs-a-log-not-a-slot.test.ts": 3,
  "src/lib/spine/an-undo-must-not-erase-what-happened.test.ts": 2,
  "src/lib/spine/criterion-two-is-a-query-now.test.ts": 2,
  "src/lib/spine/every-station-can-finish.test.ts": 1,
  "src/lib/spine/learn-waiting-on-time-is-not-failing.test.ts": 1,
  "src/lib/spine/membership-is-a-production-claim.test.ts": 1,
  "src/lib/spine/the-retry-is-told-what-its-own-check-refused.test.ts": 1,
  "src/lib/spine/the-self-check-must-ask-the-real-schema.test.ts": 2,
  "src/lib/the-verdict-reaches-someone-who-left.test.ts": 3,
  "src/routes/__tests__/ship-can-ship.test.ts": 1,
  "src/routes/__tests__/ship-has-an-agent.test.ts": 1,
  "src/routes/__tests__/the-crew-headline-counts-the-workspace.test.ts": 2,
  "src/routes/__tests__/the-usage-bar-cannot-be-rebuilt-on-a-subtraction.test.ts": 3,
  "src/routes/__tests__/trigger-dedup-halves.test.ts": 1,
  "src/routes/api/public/hooks/a-fix-that-committed-nothing-is-not-an-attempt-spent.test.ts": 2,
  "src/routes/api/public/hooks/derive-tick.test.ts": 1,
  "src/routes/api/public/hooks/loop-tick-selects-columns-that-exist.test.ts": 1,
  "src/routes/api/public/hooks/outcome-tick-names-the-workspaces-it-skipped.test.ts": 1,
};

function testFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) testFiles(p, out);
    else if (/\.(test|spec)\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

/**
 * Slices whose end is the end of the file.
 *
 * Matched on the SHAPE `x.slice(y.indexOf(...))` with no second argument, which
 * is the only form that can silently swallow whatever lands below. A slice with
 * two arguments is bounded whether or not the bounds are well chosen, and
 * judging those is a review rather than a guard.
 */
function unboundedSlices(file: string): number {
  /*
   * COMMENTS STRIPPED FIRST (F-188), and this guard needed it on its own first
   * run: the paragraph above SHOWS the shape it forbids, so scanning raw source
   * counted this file as two offences against itself. A guard that fails on the
   * prose explaining it teaches people to delete the explanation.
   */
  const src = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return [...src.matchAll(/\.slice\(\s*\w+\.indexOf\([^)]*\)\s*\)/g)].length;
}

describe("a guard's subject is bounded", () => {
  const files = testFiles("src").sort();

  it("finds them at all, so a broken scan cannot pass as a clean repo", () => {
    const total = files.reduce((t, f) => t + unboundedSlices(f), 0);
    expect(total).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(200);
  });

  it("lets no test file grow a new unbounded slice", () => {
    const grown: string[] = [];
    for (const f of files) {
      const now = unboundedSlices(f);
      const was = BASELINE[f] ?? 0;
      if (now > was) grown.push(`${f}: ${was} -> ${now}`);
    }
    /*
     * If this fails: the slice you added ends at the end of the file, so the
     * next function appended below your subject becomes part of it and this
     * guard will one day fail naming code that did not change. Pass a second
     * argument -- `src.indexOf("\nexport const ", from + 1)` -- and assert both
     * ends were found, because `indexOf` answers -1 rather than throwing.
     */
    expect(grown).toEqual([]);
  });

  it("keeps the baseline honest: no file listed that no longer has any", () => {
    const stale = Object.keys(BASELINE).filter((f) => {
      try {
        return unboundedSlices(f) === 0;
      } catch {
        return true;
      }
    });
    expect(stale).toEqual([]);
  });
});
