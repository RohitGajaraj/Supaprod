// BUILD verification: test authoring as a NAMED capability.
//
// WHAT WAS MISSING, precisely. Build could always write a test file, because
// `studio.stage` takes any allowed path and `isTestPath` (studio-inspection.ts)
// already recognises one after the fact. What it could not do was be ASKED to.
// There was no capability that said "these source files changed, these are the
// test files that should exist for them, and here is the one that does not" -
// so testing was a thing an agent might remember, never a thing with a
// machine-checkable definition of done. The BLD-05 Inspector card counts staged
// test files at the merge gate, which tells an operator that tests are missing
// at the moment it is most expensive to act on it, and tells the agent nothing
// at all while it still has the changeset open.
//
// WHAT THIS IS NOT. It does not run anything. There is no Supaprod execution
// sandbox (`src/lib/exec/provider.ts`: the only wired ExecProvider is the $0
// GitHub Actions floor, which runs in the connected repo's CI after a push), so
// this module makes no claim about whether a test passes, only about whether
// one exists. Naming a gap honestly is worth more than a green tick nothing
// executed.
//
// Pure, client-safe, no I/O. The repo-side knowledge (which test files already
// exist on the branch) is passed in by the caller.

import { isTestPath } from "@/lib/ai/studio-inspection";

export interface PlannedChange {
  path: string;
  /** create | update | delete */
  op: string;
}

export type TestCoverage =
  /** A test file for this source is staged in THIS changeset. */
  | "covered_in_changeset"
  /** A test file for this source already exists on the branch and was not touched. */
  | "covered_in_repo"
  /** No test file for this source, staged or on the branch. */
  | "gap";

export interface TestPlanItem {
  source_path: string;
  /** The path this repo's own convention puts the test at. */
  expected_test_path: string;
  coverage: TestCoverage;
  op: string;
}

export interface ChangesetTestPlan {
  items: TestPlanItem[];
  /** Items whose coverage is "gap": the concrete work list. */
  gaps: TestPlanItem[];
  /** Test files staged in this changeset. */
  staged_test_files: string[];
  /** Changed paths deliberately outside the plan (docs, config, generated, deletes). */
  not_applicable: string[];
  /** Plain-language state of the changeset's test coverage. */
  note: string;
}

/** Extensions that carry executable logic worth a unit test. */
const TESTABLE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

/**
 * Paths that are code by extension but never get their own unit test here:
 * generated router output, ambient type declarations, and config at the repo
 * root. Listing a gap against any of these would be noise the agent then has to
 * argue with, which is how a gate loses its authority.
 */
function isExcludedFromTesting(path: string): boolean {
  if (/\.d\.ts$/.test(path)) return true;
  if (/(^|\/)routeTree\.gen\.ts$/.test(path)) return true;
  if (/(^|\/)(vite|vitest|eslint|playwright|tailwind|postcss)\.config\.[cm]?[jt]s$/.test(path))
    return true;
  return false;
}

/** True when a changed path should carry a unit test of its own. */
export function isTestableSource(path: string, op: string): boolean {
  // A deletion has nothing left to test; its test file, if any, is the agent's
  // to remove and is not a coverage gap.
  if (op === "delete") return false;
  if (isTestPath(path)) return false;
  if (!TESTABLE_EXT.test(path)) return false;
  return !isExcludedFromTesting(path);
}

/**
 * The test path this repo's convention puts a source file's tests at: `.test`
 * inserted before the final extension, everything else preserved. That is what
 * every existing pair in `src/lib` does, including the multi-suffix ones
 * (`critic.server.ts` -> `critic.server.test.ts`), which is why this splits on
 * the LAST dot rather than the first.
 */
export function conventionalTestPath(path: string): string {
  const slash = path.lastIndexOf("/");
  const dot = path.lastIndexOf(".");
  if (dot <= slash) return `${path}.test`;
  return `${path.slice(0, dot)}.test${path.slice(dot)}`;
}

/**
 * Build the test plan for a changeset.
 *
 * `repoTestPaths` is every test file already on the branch (the caller reads it
 * from the repo tree). An unreadable tree is passed as an empty list, which
 * over-reports gaps rather than under-reporting them: a plan that misses a real
 * gap is the failure that matters, a plan that names a test which turns out to
 * exist costs one read.
 */
export function planChangesetTests(
  changes: readonly PlannedChange[],
  repoTestPaths: readonly string[] = [],
): ChangesetTestPlan {
  const staged = new Set((changes ?? []).map((c) => c.path));
  const stagedTests = [...staged].filter(isTestPath).sort();
  const inRepo = new Set(repoTestPaths ?? []);

  const items: TestPlanItem[] = [];
  const notApplicable: string[] = [];

  for (const change of changes ?? []) {
    if (!isTestableSource(change.path, change.op)) {
      if (!isTestPath(change.path)) notApplicable.push(change.path);
      continue;
    }
    const expected = conventionalTestPath(change.path);
    const coverage: TestCoverage = staged.has(expected)
      ? "covered_in_changeset"
      : inRepo.has(expected)
        ? "covered_in_repo"
        : "gap";
    items.push({
      source_path: change.path,
      expected_test_path: expected,
      coverage,
      op: change.op,
    });
  }

  const gaps = items.filter((i) => i.coverage === "gap");
  return {
    items,
    gaps,
    staged_test_files: stagedTests,
    not_applicable: notApplicable.sort(),
    note: describeTestPlan(items.length, gaps.length, stagedTests.length),
  };
}

function describeTestPlan(total: number, gapCount: number, stagedTests: number): string {
  if (total === 0) {
    return "No changed file in this changeset carries logic that takes a unit test. Nothing to author.";
  }
  if (gapCount === 0) {
    return `All ${total} changed source file(s) have a test file, ${stagedTests} of them staged here. Nothing to author.`;
  }
  return (
    `${gapCount} of ${total} changed source file(s) have no test file. ` +
    `Stage each expected_test_path with studio.stage before opening the pull request. ` +
    `Nothing here executes a test: whether they pass is decided by the repo's CI after the PR opens, read it with ci.logs.`
  );
}
