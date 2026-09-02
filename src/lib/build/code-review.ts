// BUILD verification: agent code review of the staged diff, pure half.
//
// THE GAP THIS CLOSES, stated plainly. Nothing read the code an agent wrote
// before it became a pull request. `critic.evaluate` red-teams an opportunity
// or a spec and takes only those two target kinds, so it judges the INTENT and
// never the implementation. `ci.logs` reads a verdict the repo's CI produced,
// which arrives after the PR is open and only says whether the build broke.
// Between "the spec was sound" and "CI went green" sat the entire diff, unread.
// A changeset could carry a swallowed error, a missing authorization check, or
// three files of work nobody asked for, pass CI, and reach the human merge gate
// with a review burden the gate was never designed to carry.
//
// DETERMINISTIC FIRST, MODEL SECOND, and never the other way round. The checks
// that can be decided by reading the diff (a credential on an added line, a
// forbidden path, a source file with no test) are computed here with no model
// in the loop, so they cannot be argued out of existence by a persuasive
// generation and they hold when the model call fails. The model is asked only
// for the judgments that genuinely need reading comprehension, and its output
// is bounded by `parseChangesetReview` before anything acts on it. This is the
// same posture `verify-green.server.ts` takes: "the checklist verdict comes
// from real oracle rows, not a model".
//
// NEVER SILENTLY GREEN. A failed model call yields the verdict "unreviewed",
// not "approve". "Nothing was found" and "nothing looked" are different facts
// and this layer refuses to collapse them, the same three-state honesty
// `build/verification.ts` applies to completion claims.
//
// Pure, client-safe, no I/O.

import { diffRows, type DiffRow } from "@/lib/ai/studio-hunks";
import { isTestPath } from "@/lib/ai/studio-inspection";
import type { StagedChangeContent, StagedSecretScan } from "./secret-scan";
import type { ChangesetTestPlan } from "./test-plan";

export type ReviewVerdict =
  /** Nothing found that should stop this changeset. */
  | "approve"
  /** Real findings, none of them disqualifying. Address or disclose them. */
  | "revise"
  /** At least one blocker. Do not open a pull request on this as it stands. */
  | "block"
  /** The judgment pass did not run. Not a finding, and not a clean result. */
  | "unreviewed";

export type ReviewCategory =
  "correctness" | "security" | "error-handling" | "scope" | "convention" | "tests" | "secret";

export type ReviewSeverity = "blocker" | "major" | "minor";

export interface ReviewFinding {
  severity: ReviewSeverity;
  category: ReviewCategory;
  /** The file this is about, when the finding is about one. */
  path: string | null;
  /** 1-based line in the staged file, when the finding is about one. */
  line: number | null;
  issue: string;
  /** What to do about it, when there is a concrete answer. */
  fix: string | null;
  /**
   * True when this came from a deterministic check rather than the model. The
   * distinction is load-bearing on the receipt trail: a deterministic finding is
   * a fact about the diff, a model finding is an opinion about it, and a reader
   * deciding whether to overrule one needs to know which they are looking at.
   */
  deterministic: boolean;
}

/**
 * ── ONE ACCEPTANCE LINE, AND WHETHER THE CHANGE MEETS IT ──────────────────
 *
 * The reviewer's verdict used to be about the diff and nothing else: security,
 * correctness, scope, convention. All real, and none of them the question Build
 * exists to answer, which is whether the change does WHAT WAS ASKED FOR. That
 * question has an answer on the record -- the acceptance lines the builder was
 * handed as its work order -- and the reviewer was never shown them.
 *
 * So the reviewer now states, per line, whether it holds. Not a score and not a
 * summary: the line itself, back in the author's words, with a verdict beside
 * it. That is what makes a wrong reading VISIBLE -- if the reviewer misread a
 * line, the line is right there to be read against its judgment.
 */
export interface ReviewedLine {
  /** The acceptance line, verbatim as it reached the reviewer. */
  line: string;
  /** Whether the staged change satisfies it. */
  held: boolean;
  /**
   * Why it does not hold, in one sentence. Null is only honest for a line that
   * held; `parseComparedLines` drops a `did not` that cannot say why, because a
   * refusal with no reason is not something a builder can act on.
   */
  why: string | null;
}

/**
 * WHERE THE LINES CAME FROM, WHICH IS NOT THE SAME QUESTION AS HOW MANY HELD.
 *
 * "0 of 0 held" and "no lines to check" are different facts and a reader has to
 * be able to tell them apart. Measured on this database: `prds.contract` carries
 * success metrics on 2 of 119 specs, and 94 of the other 117 carry acceptance
 * criteria in the body under a heading. So `body` is the common case, `none` is
 * real, and a surface that collapsed them would report the common case as a
 * failure to check.
 */
export type CriteriaSource = "contract" | "body" | "none";

export interface ChangesetReview {
  verdict: ReviewVerdict;
  summary: string;
  findings: ReviewFinding[];
  files_reviewed: number;
  /**
   * The acceptance lines the reviewer compared the diff against, in the order
   * they were given. Empty means none reached it, which `criteria_source` then
   * explains. Absent on every review written before 2026-09-03.
   */
  compared?: ReviewedLine[];
  /** Where `compared`'s lines came from. Absent on reviews written before it. */
  criteria_source?: CriteriaSource;
  /** The model that produced the judgment findings, or null when none ran. */
  reviewer_model: string | null;
  reviewed_at: string;
}

const CATEGORIES = new Set<ReviewCategory>([
  "correctness",
  "security",
  "error-handling",
  "scope",
  "convention",
  "tests",
  "secret",
]);
const SEVERITIES = new Set<ReviewSeverity>(["blocker", "major", "minor"]);

/** Total characters of diff handed to the model. Bounds prompt cost and keeps
 *  one enormous file from crowding out every other file in the changeset. */
export const DIFF_RENDER_BUDGET = 40_000;
/** Per-file share of that budget, so a 20-file changeset is never one file. */
export const DIFF_PER_FILE_BUDGET = 8_000;
/**
 * Above this line count on either side, the LCS alignment in `diffRows` costs
 * more than the review is worth (it is O(n * m) with a full DP matrix). Such a
 * file is rendered as a stated summary rather than a diff, which is honest about
 * what the reviewer did and did not see.
 */
const DIFF_LINE_CEILING = 2_500;

function lineCount(s: string): number {
  return s === "" ? 0 : s.split("\n").length;
}

function renderRow(row: DiffRow): string | null {
  switch (row.kind) {
    case "add":
      return `+${row.nextNo}: ${row.text}`;
    case "del":
      return `-${row.baseNo}: ${row.text}`;
    case "same":
      return ` ${row.nextNo}: ${row.text}`;
    case "skipped":
      return `@@ ${row.count} unchanged line(s) skipped @@`;
  }
}

/**
 * Render one file's staged change as a reviewable diff block with line numbers.
 *
 * Line numbers are the whole point: a review that cannot say WHERE is a review
 * nobody can act on, and `diffRows` already carries the base and new numbering
 * that the operator's own curation view uses, so the reviewer and the human are
 * reading the same coordinates.
 */
export function renderFileDiff(change: StagedChangeContent, budget = DIFF_PER_FILE_BUDGET): string {
  const header = `--- ${change.path} (${change.op})`;
  if (change.op === "delete") {
    return `${header}\n(file deleted)`;
  }
  const base = change.base_content ?? "";
  const next = change.new_content ?? "";
  if (next === "" && base === "") return `${header}\n(empty file)`;

  if (lineCount(base) > DIFF_LINE_CEILING || lineCount(next) > DIFF_LINE_CEILING) {
    return (
      `${header}\n(file too large to diff inline: ${lineCount(base)} base line(s) -> ` +
      `${lineCount(next)} staged line(s). Not reviewed line by line. Read it with repo.read if it matters.)`
    );
  }

  const rows = diffRows(base, next);
  const body: string[] = [];
  let used = 0;
  let cut = false;
  for (const row of rows) {
    const text = renderRow(row);
    if (text === null) continue;
    if (used + text.length > budget) {
      cut = true;
      break;
    }
    body.push(text);
    used += text.length + 1;
  }
  if (cut) body.push(`@@ diff truncated at ${budget} characters for this file @@`);
  return `${header}\n${body.join("\n")}`;
}

/** Render the whole changeset as one bounded diff block for the reviewer. */
export function renderChangesetDiff(
  changes: readonly StagedChangeContent[],
  budget = DIFF_RENDER_BUDGET,
): { text: string; files_rendered: number; truncated: boolean } {
  const blocks: string[] = [];
  let used = 0;
  let rendered = 0;
  let truncated = false;
  for (const change of changes ?? []) {
    if (used >= budget) {
      truncated = true;
      break;
    }
    const block = renderFileDiff(change, Math.min(DIFF_PER_FILE_BUDGET, budget - used));
    blocks.push(block);
    used += block.length + 2;
    rendered++;
  }
  if (truncated) {
    blocks.push(
      `@@ ${(changes?.length ?? 0) - rendered} further file(s) not rendered: changeset diff exceeded ${budget} characters @@`,
    );
  }
  return { text: blocks.join("\n\n"), files_rendered: rendered, truncated };
}

export interface DeterministicInput {
  changes: readonly StagedChangeContent[];
  secrets: StagedSecretScan;
  testPlan: ChangesetTestPlan;
  /** Paths the Build lane is forbidden to write, already detected by the caller. */
  forbiddenPaths?: readonly string[];
  /** The dependency-audit note, when the audit produced one. */
  dependencyNote?: string | null;
}

/**
 * The findings that need no model. Every one of these is a fact about the diff
 * that a reader could verify with their own eyes, which is exactly why they are
 * computed rather than asked for.
 */
export function deterministicFindings(input: DeterministicInput): ReviewFinding[] {
  const out: ReviewFinding[] = [];

  // A credential on an added line. Blocker without exception: this is the one
  // finding whose cost is unrecoverable once the commit lands.
  for (const f of input.secrets.findings) {
    out.push({
      severity: "blocker",
      category: "secret",
      path: f.path,
      line: f.line,
      issue: `A ${f.type} appears on a line this changeset adds.`,
      fix: "Replace it with an environment variable reference and re-stage the file.",
      deterministic: true,
    });
  }
  if (input.secrets.truncated) {
    out.push({
      severity: "minor",
      category: "secret",
      path: null,
      line: null,
      issue: "The secret scan ran out of line budget before reading every added line.",
      fix: "Split the changeset so each commit is small enough to scan in full.",
      deterministic: true,
    });
  }

  // A forbidden path. The caller has already refused these, so this exists so
  // the review RECORD names it rather than the refusal being the only trace.
  for (const path of input.forbiddenPaths ?? []) {
    out.push({
      severity: "blocker",
      category: "convention",
      path,
      line: null,
      issue: `${path} is outside the Build lane's write boundary (CI, migrations, env, and lockfiles are not Build's to change).`,
      fix: "Drop this path from the changeset and describe the needed change in the pull request body instead.",
      deterministic: true,
    });
  }

  // A source file with no test. Major rather than blocker, deliberately: the
  // 2026-06-18 ruling on the Inspector card settled that missing tests are
  // flagged and never hard-blocked, and a review layer must not quietly
  // overturn a decision the merge gate already made.
  for (const gap of input.testPlan.gaps) {
    out.push({
      severity: "major",
      category: "tests",
      path: gap.source_path,
      line: null,
      issue: `${gap.source_path} changes logic and has no test file.`,
      fix: `Stage ${gap.expected_test_path}.`,
      deterministic: true,
    });
  }

  if (input.dependencyNote) {
    out.push({
      severity: "major",
      category: "convention",
      path: null,
      line: null,
      issue: input.dependencyNote,
      fix: "State it in the pull request body so a human commits the lockfile.",
      deterministic: true,
    });
  }

  // Staging a whole file as `create` over one that already exists is how an
  // agent silently reverts someone else's work; the stage step normalises the
  // op, so a create here really is a new file, and a create of a path that is
  // neither a test nor obviously new is worth a human glance.
  return out;
}

/**
 * Bound whatever the model returned into the review shape.
 *
 * Returns [] rather than a fabricated default for a malformed payload, the same
 * discipline `runCritic` applies: a bad shape must never silently produce a
 * confident-looking review nobody wrote.
 */
export function parseReviewFindings(raw: unknown, maxFindings = 25): ReviewFinding[] {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return [];
  const list = (raw as Record<string, unknown>).findings;
  if (!Array.isArray(list)) return [];
  const out: ReviewFinding[] = [];
  for (const item of list.slice(0, maxFindings)) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
    const f = item as Record<string, unknown>;
    const issue = typeof f.issue === "string" ? f.issue.trim() : "";
    if (!issue) continue;
    const severity = SEVERITIES.has(f.severity as ReviewSeverity)
      ? (f.severity as ReviewSeverity)
      : "minor";
    const category = CATEGORIES.has(f.category as ReviewCategory)
      ? (f.category as ReviewCategory)
      : "correctness";
    const lineNum = Number(f.line);
    out.push({
      severity,
      // A model may NOT raise a `secret` finding: that category is the
      // deterministic scanner's alone, so a reader can trust that every secret
      // finding on the trail was matched by a structural rule and not inferred.
      category: category === "secret" ? "security" : category,
      path: typeof f.path === "string" && f.path.trim() ? f.path.trim().slice(0, 400) : null,
      line: Number.isInteger(lineNum) && lineNum > 0 ? lineNum : null,
      issue: issue.slice(0, 600),
      fix: typeof f.fix === "string" && f.fix.trim() ? f.fix.trim().slice(0, 600) : null,
      deterministic: false,
    });
  }
  return out;
}

/**
 * READ THE PER-LINE VERDICTS BACK, AGAINST THE LINES WE SENT.
 *
 * ── WHY THIS MATCHES ON THE LINE AND NOT ON AN INDEX ──────────────────────
 * The obvious parse is to zip the model's array against the criteria by
 * position. That fails the way it always fails: a generation that returns four
 * verdicts for five lines silently shifts every judgment onto the wrong line,
 * and the result LOOKS complete. So each returned verdict has to name its line,
 * and a name that is not one of the lines we sent is discarded rather than
 * appended -- otherwise the reviewer could invent an acceptance line, mark it
 * held, and raise the count of what was checked.
 *
 * Matching is on the trimmed text. Models reliably echo a line back with
 * different surrounding whitespace or a stripped list marker, and refusing
 * those would throw away correct judgments over punctuation.
 *
 * ── A LINE NOBODY JUDGED IS NOT A LINE THAT HELD ──────────────────────────
 * Any criterion with no verdict comes back `held: false` with an explicit why.
 * The alternative -- dropping it -- would mean a reviewer could raise its own
 * pass rate by saying less, which is exactly backwards.
 */
export function parseComparedLines(raw: unknown, criteria: readonly string[]): ReviewedLine[] {
  if (criteria.length === 0) return [];
  const said = new Map<string, { held: boolean; why: string | null }>();

  const list =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>).acceptance
      : null;
  if (Array.isArray(list)) {
    const byKey = new Map(criteria.map((c) => [compareKey(c), c]));
    for (const item of list.slice(0, MAX_ACCEPTANCE_LINES * 2)) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
      const row = item as Record<string, unknown>;
      const named = typeof row.line === "string" ? byKey.get(compareKey(row.line)) : undefined;
      if (named === undefined) continue;
      const held = row.held === true;
      const why =
        typeof row.why === "string" && row.why.trim() ? row.why.trim().slice(0, 400) : null;
      /* A `did not` that cannot say why is not actionable, and shipping it would
         put an unexplained refusal in front of a person. Treated as no verdict,
         which the sweep below then reports honestly as unjudged. */
      if (!held && !why) continue;
      // First verdict wins, so a model that lists a line twice cannot overwrite
      // its own refusal with a pass further down the array.
      if (!said.has(named)) said.set(named, { held, why });
    }
  }

  return criteria.map((line) => {
    const v = said.get(line);
    if (!v) return { line, held: false, why: "The reviewer did not say whether this holds." };
    return { line, held: v.held, why: v.held ? v.why : (v.why ?? null) };
  });
}

/** Whitespace, case and list markers are not part of what a line SAYS. */
function compareKey(line: string): string {
  return line
    .replace(/^\s*[-*\u2022]?\s*(?:\d+[.)]\s*)?/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** How many acceptance lines are worth putting in front of a reviewer. Beyond
 *  this the per-line judgment degrades into skimming, and the prompt crowds out
 *  the diff it is supposed to be reading. `extractIntentPoints` caps at 20 for
 *  the same reason and this is deliberately the same number. */
export const MAX_ACCEPTANCE_LINES = 20;

/** The lines that did not hold. The one list Build has to act on. */
export function linesThatDidNotHold(review: ChangesetReview | null | undefined): ReviewedLine[] {
  return (review?.compared ?? []).filter((c) => !c.held);
}

/**
 * The final verdict.
 *
 * Severity decides it, not the model's own self-reported verdict, so a
 * generation that lists a blocker and then calls itself "approve" cannot talk
 * its way past. The model's verdict is only allowed to make the result STRICTER
 * than the findings alone would, never looser.
 */
export function decideReviewVerdict(input: {
  findings: readonly ReviewFinding[];
  modelRan: boolean;
  modelVerdict?: string | null;
  /** The per-line acceptance judgments, when any lines were compared. */
  compared?: readonly ReviewedLine[];
}): ReviewVerdict {
  if (input.findings.some((f) => f.severity === "blocker")) return "block";
  const claimed = input.modelVerdict;
  if (claimed === "block") return "block";
  if (!input.modelRan) {
    // Deterministic findings still stand on their own when the judgment pass
    // never ran; only the absence of BOTH is "unreviewed".
    return input.findings.length > 0 ? "revise" : "unreviewed";
  }
  if (input.findings.some((f) => f.severity === "major")) return "revise";
  /*
   * -- AN ACCEPTANCE LINE THAT DID NOT HOLD IS WORK TO DO --------------------
   *
   * Placed after `block` and before `approve`, and both positions are the
   * argument.
   *
   * NOT a block: the change compiles, it is not a security hole, and it does not
   * lose data. It does less than was asked for. Blocking it would put a missed
   * requirement in the same bucket as a leaked credential, and a gate that
   * cannot tell those apart gets ignored on both.
   *
   * But it CANNOT be approve, whatever else is clean, and this is the whole
   * point of the packet. A reviewer that read the spec, found the change does
   * not meet it, and returned "approve" because no single line of code was
   * wrong would be the exact failure this comparison was added to catch.
   */
  if (input.compared?.some((c) => !c.held)) return "revise";
  if (claimed === "revise") return "revise";
  return "approve";
}

export interface ReviewGate {
  /** True when this changeset is clear to open a pull request. */
  mayOpenPr: boolean;
  reason: string;
}

/**
 * What the verdict means for the next step. Advisory today: no tool consumes it
 * as a hard refusal, because a persisted verdict is what a refusal would have to
 * read and the column for it does not exist yet (see BUILD-NEEDS-MIGRATION.md).
 * The one finding that IS enforced without persistence is the secret scan, which
 * `studio.commit` re-runs itself at the moment of writing to the repo.
 */
export function reviewGate(review: ChangesetReview): ReviewGate {
  switch (review.verdict) {
    case "approve":
      return { mayOpenPr: true, reason: "Review found nothing that should stop this changeset." };
    case "revise":
      return {
        mayOpenPr: false,
        reason: `Review raised ${review.findings.length} finding(s). Address them, or state in the pull request body why each one stands.`,
      };
    case "block":
      return {
        mayOpenPr: false,
        reason: `Review found ${review.findings.filter((f) => f.severity === "blocker").length} blocker(s). Fix them and review again before opening a pull request.`,
      };
    case "unreviewed":
      return {
        mayOpenPr: false,
        reason:
          "The review did not run, so this changeset is unreviewed. That is not a clean result: run studio.review again, and say so in the pull request body if it keeps failing.",
      };
  }
}

/** Files a review actually looked at, for the record. */
export function countReviewableFiles(changes: readonly StagedChangeContent[]): number {
  return (changes ?? []).filter((c) => c.op !== "delete" && !isTestPath(c.path)).length;
}
