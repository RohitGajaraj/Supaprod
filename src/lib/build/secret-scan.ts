// BUILD verification: the staged-changeset secret floor.
//
// WHY THIS EXISTS. Build stages a whole file's new text into `studio_changes`
// and `studio.commit` writes it straight to a real customer repo through the
// Git Data API. Nothing between those two points ever looked at the CONTENT.
// An agent that inlined a key it read from a config file, or that pasted a
// credential out of a CI log tail while fixing red CI, would push it to a
// branch on GitHub, where it is in history and effectively unrecallable from
// inside the product. That is one of the four governance floors (irreversible
// from inside the product), and it had no gate at all.
//
// REUSE, NOT NEW REGEXES. The patterns are `EGRESS_SECRET_RULES` from
// `egress-guardrails.ts`, unchanged: the same nine structural, near-zero-false-
// positive credential formats the public-egress floor already blocks on, run
// through the same `evaluateGuardrails` engine (so the ReDoS guarding and the
// zero-width handling are shared, not re-implemented). A second, drifting copy
// of "what a secret looks like" is exactly the failure this repo avoids
// elsewhere by making `studio-ci.ts` the one definition of green.
//
// ADDED LINES ONLY, and that is load-bearing. A repo that already carries a
// credential somewhere in a file must not become un-editable: an agent fixing
// an unrelated function in that file would be blocked forever with no action it
// could take, and a floor whose only escape is "give up" gets routed around.
// So a line counts only when its exact text does not already appear anywhere in
// the base snapshot of that same file. Moving a line does not trip it; writing
// one does.
//
// NEVER THE VALUE. Findings carry the path, the line number, and the rule NAME
// ("AWS access key id"). The matched text is never returned, never logged, and
// never put in an error message, because those all travel: the error becomes a
// tool result, which becomes a prompt, which becomes a stored run trail.
//
// Pure and totally defined: no I/O, malformed input never throws, scanning is
// idempotent.

import { scanEgressForSecrets } from "@/lib/egress-guardrails";

/** The staged-change shape this scans. Matches `studio_changes` columns. */
export interface StagedChangeContent {
  path: string;
  /** create | update | delete */
  op: string;
  /** The file's content on the branch this change builds on. Null for a create. */
  base_content?: string | null;
  /** The full staged file text. Null for a delete. */
  new_content?: string | null;
}

export interface SecretFinding {
  path: string;
  /** 1-based line number in the STAGED file. */
  line: number;
  /** The rule name, e.g. "AWS access key id". Never the matched value. */
  type: string;
}

export interface StagedSecretScan {
  /** True when at least one high-confidence credential is on an added line. */
  blocked: boolean;
  findings: SecretFinding[];
  files_scanned: number;
  added_lines_scanned: number;
  /** True when the line budget ran out before every added line was read. */
  truncated: boolean;
}

/**
 * Line budget for one scan. A changeset is capped at 20 paths of 150k chars, so
 * this clears a realistic worst case with room to spare; it exists so a
 * pathological staged blob cannot pin the worker.
 */
export const SECRET_SCAN_LINE_BUDGET = 40_000;

/** Longest single line we bother matching against. Beyond this a "line" is a
 *  minified bundle or a data URI, not source, and the structural rules cannot
 *  say anything useful about it without burning the budget. */
const MAX_LINE_CHARS = 4_000;

function splitLines(s: string): string[] {
  return s === "" ? [] : s.split("\n");
}

/**
 * The added lines of one staged change: every line of the new text whose exact
 * content does not already appear in the base snapshot.
 *
 * This is deliberately a multiset-free membership test rather than an LCS diff.
 * For "is this credential NEW", exact-text novelty is the precise question, it
 * is O(n + m) instead of O(n * m), and it never reports a moved line as added.
 * `studio-hunks.ts` stays the alignment engine for operator curation, where
 * hunk identity and line pairing genuinely matter; neither is needed here.
 */
export function addedLines(change: StagedChangeContent): Array<{ line: number; text: string }> {
  if (change.op === "delete") return [];
  const next = change.new_content;
  if (typeof next !== "string" || next === "") return [];
  const baseSet = new Set(splitLines(change.base_content ?? ""));
  const out: Array<{ line: number; text: string }> = [];
  const lines = splitLines(next);
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    // A blank or whitespace-only line can never carry a structural credential,
    // and skipping it here keeps the budget for lines that can.
    if (text.trim() === "") continue;
    if (baseSet.has(text)) continue;
    out.push({ line: i + 1, text });
  }
  return out;
}

/**
 * Scan a changeset's staged content for high-confidence credentials on added
 * lines. Returns the path, line, and TYPE of each finding, never the value.
 */
export function scanStagedChangesForSecrets(
  changes: readonly StagedChangeContent[],
  opts?: { lineBudget?: number },
): StagedSecretScan {
  const budget = Math.max(1, opts?.lineBudget ?? SECRET_SCAN_LINE_BUDGET);
  const findings: SecretFinding[] = [];
  let scanned = 0;
  let filesScanned = 0;
  let truncated = false;

  for (const change of changes ?? []) {
    if (scanned >= budget) {
      truncated = true;
      break;
    }
    const added = addedLines(change);
    if (added.length === 0) continue;
    filesScanned++;
    for (const { line, text } of added) {
      if (scanned >= budget) {
        truncated = true;
        break;
      }
      scanned++;
      const probe = text.length > MAX_LINE_CHARS ? text.slice(0, MAX_LINE_CHARS) : text;
      const hit = scanEgressForSecrets(probe);
      if (!hit.blocked) continue;
      for (const type of hit.ruleNames) {
        findings.push({ path: change.path, line, type });
      }
    }
  }

  return {
    blocked: findings.length > 0,
    findings,
    files_scanned: filesScanned,
    added_lines_scanned: scanned,
    truncated,
  };
}

/**
 * The refusal message for the `studio.commit` floor. Names path, line, and type
 * so the fix is one re-stage away, and never echoes the credential itself.
 *
 * Capped at the first few findings: the point is to be actionable, and a wall of
 * every hit in a 20-file changeset is not. The count is always stated so the
 * cap never reads as the whole answer.
 */
export function describeStagedSecrets(scan: StagedSecretScan, limit = 5): string {
  if (!scan.blocked) return "";
  const shown = scan.findings.slice(0, limit);
  const list = shown.map((f) => `${f.path}:${f.line} (${f.type})`).join(", ");
  const more =
    scan.findings.length > shown.length ? ` and ${scan.findings.length - shown.length} more` : "";
  return (
    `StagedSecretDetected: this commit would write a credential into the repo, where it stays in git history. ` +
    `Found on newly added lines: ${list}${more}. ` +
    `Replace each one with an environment variable reference, re-stage the file, and commit again. ` +
    `The value itself is deliberately not repeated here.`
  );
}
