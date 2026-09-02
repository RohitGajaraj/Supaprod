/**
 * ── READING `studio.review`, WHICH IS THE HALF MERIDIAN MUST NOT KNOW ─────
 *
 * P-19 promoted the DRAWING into `meridian/verdict.tsx`, and this is what could
 * not go with it: the column a verdict arrives in, the two ways it can be
 * absent, and the words for each. A Meridian primitive that knew about
 * `studio_changesets.code_review` would be a primitive with exactly one possible
 * caller, and the second caller is a design review or an eval suite.
 *
 * WHY THE VERDICT IS ITS OWN THING rather than part of the block it was lifted from.
 * `ChangesetCard` drew the review inline, which made it a property of the Build
 * card. It is not: it is the one place on this surface where something OTHER
 * than the agent that did the work reports on the work, and that is the whole
 * difference between a product that shows you output and one that tells you
 * whether the output is any good. `GotYou` needs the same sentence for the strip
 * above the pane, and two renderings of one verdict is how a screen ends up
 * disagreeing with itself, which this file's neighbours have been repaired for
 * twice.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cursor's completion screen (Mobbin, pulled 2026-09-02) puts a **Runtime
 * evidence I checked** block under the answer, and every line in it cites the
 * terminal line it read. What is borrowed is that rule and not the chrome: a
 * finding here prints the file and line it is about, so the claim can be
 * followed back. Cofounder's **Verified** block is the other half, and it is why
 * the head line states what was COMPARED before it states what it concluded:
 * a verdict with no denominator is an opinion.
 *
 * ── THE EMPTY CASE IS THE COMMON CASE, AND IT NAMES ITS REASON ────────────
 * Measured, and recorded in `track.functions.ts:1224`: 0 of 45 changesets carry
 * a review, because `studio.review` has never once run successfully. So the
 * sentence a person will actually meet here is the absence, and an absence that
 * says only "nothing yet" teaches nobody anything. There are two absences and
 * they are different facts:
 *
 *   no `code_review` at all       the reviewer never ran on this change
 *   `verdict: "unreviewed"`       it ran and returned no judgment
 *
 * The tool's own description is explicit that the second "is not a pass", so
 * collapsing them into one line would be the substitution this repo keeps
 * paying for. Each gets its own sentence and its own reason.
 *
 * ── WHAT THIS DOES NOT CLAIM ──────────────────────────────────────────────
 * "Compared N files" is the denominator the review actually recorded
 * (`files_reviewed`). It is NOT "compared N acceptance lines", which is what the
 * verdict should eventually be measured against and which no row carries today.
 * Saying the sharper sentence over the blunter column would be inventing the
 * thing the product is selling. P-02 makes the spec's acceptance lines the
 * denominator; until it lands this says what it can source.
 */
import { relativeTime } from "@/lib/memory-view";
import type { VerdictFinding, VerdictTone } from "@/components/meridian/verdict";

/** One thing the reviewer found, as `studio.review` writes it. */
export type ReviewFindingView = {
  severity?: string;
  category?: string;
  path?: string | null;
  line?: number | null;
  issue?: string;
  fix?: string | null;
  /** True when a deterministic check produced it rather than a judgment. */
  deterministic?: boolean;
};

/** `studio_changesets.code_review`, as `runChangesetReview` persists it. */
export type ReviewView = {
  verdict?: string;
  summary?: string;
  findings?: ReviewFindingView[];
  files_reviewed?: number;
  reviewer_model?: string | null;
  reviewed_at?: string;
};

/**
 * The column, whatever shape it came back in.
 *
 * `code_review` is a `Json` column read through PostgREST, so it arrives as an
 * object; it arrives as a STRING through at least one path that stringifies
 * before writing. Both are accepted and anything else is null, because a
 * half-parsed review rendered as a verdict is the one output worse than none.
 */
export function parseReview(raw: unknown): ReviewView | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ReviewView;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as ReviewView;
  return null;
}

/** Whether a parsed review actually carries a judgment. */
export function hasVerdict(review: ReviewView | null): boolean {
  return Boolean(review && review.verdict && review.verdict !== "unreviewed");
}

const TONE: Record<string, { status: "pass" | "fail" | "hold"; word: string }> = {
  approve: { status: "pass", word: "Nothing blocking" },
  block: { status: "fail", word: "Blocked" },
  revise: { status: "hold", word: "Revise" },
};

/**
 * The one sentence, for the strip above the pane.
 *
 * Returns null when there is no verdict, so the caller renders nothing rather
 * than a segment saying "no verdict" -- `GotYou` is a list of what the run GOT
 * you, and an absence is not one of those. The pane below says the absence in
 * full, once.
 */
export function verdictLine(review: ReviewView | null): string | null {
  if (!review || !hasVerdict(review)) return null;
  const tone = TONE[review.verdict as string];
  const held = (review.findings ?? []).length;
  const word = tone ? tone.word.toLowerCase() : (review.verdict as string);
  if (held === 0) return `Verdict at Build: ${word}`;
  return `Verdict at Build: ${word}, ${held} ${held === 1 ? "finding" : "findings"}`;
}

/**
 * WHY THE REVIEWER HAS NOT REPORTED, in its own words per case.
 *
 * Exported because the absence is the common case and a test that pins only the
 * present case pins the half nobody sees.
 */
export function whyNoVerdict(review: ReviewView | null): string {
  if (review && review.verdict === "unreviewed") {
    return "The reviewer ran and returned no judgment, which is not a pass. Whatever it could not read is the reason, and it will report on the next attempt at this change.";
  }
  return "The reviewer has not run on this change yet. It runs inside Build, after the change is committed and before a pull request is proposed.";
}

/** Findings first by severity, so the thing that blocks is the thing on top. */
const SEVERITY_ORDER: Record<string, number> = { blocker: 0, major: 1, minor: 2 };

/**
 * The parsed review, in the shape `meridian/verdict.tsx` draws.
 *
 * The mapping lives HERE rather than at the call site, so the Build tab and the
 * strip above the pane cannot describe one review two ways -- which is the
 * whole reason `Verdict` was pulled out of `ChangesetCard` in the first place.
 */
export function verdictProps(raw: unknown): {
  tone: VerdictTone | null;
  word?: string;
  compared?: string | null;
  summary?: string | null;
  findings: VerdictFinding[];
  clean?: string;
  meta?: string | null;
  absence: string;
} {
  const review = parseReview(raw);
  if (!hasVerdict(review)) {
    return { tone: null, findings: [], absence: whyNoVerdict(review) };
  }
  const r = review as ReviewView;
  const tone = TONE[r.verdict as string] ?? { status: "hold" as const, word: r.verdict! };
  const findings = [...(r.findings ?? [])].sort(
    (a, b) => (SEVERITY_ORDER[a.severity ?? ""] ?? 3) - (SEVERITY_ORDER[b.severity ?? ""] ?? 3),
  );
  return {
    tone: tone.status,
    word: tone.word,
    compared:
      r.files_reviewed != null
        ? `Compared ${r.files_reviewed} ${r.files_reviewed === 1 ? "file" : "files"} against the change`
        : null,
    summary: r.summary ?? null,
    findings: findings.map((f) => ({
      severity: f.severity,
      category: f.category,
      /* The citation, composed here because "path:line" is this record's own
         way of naming a place and another caller's may not be. */
      where: f.path ? `${f.path}${f.line ? `:${f.line}` : ""}` : null,
      issue: f.issue,
      fix: f.fix ?? null,
      checked: f.deterministic,
    })),
    clean: r.files_reviewed
      ? "Every line it checked held. It raised nothing."
      : "It raised nothing.",
    meta:
      [
        r.reviewer_model ? `reviewer ${r.reviewer_model}` : "",
        r.reviewed_at ? relativeTime(r.reviewed_at, Date.now()) : "",
      ]
        .filter(Boolean)
        .join(" · ") || null,
    absence: whyNoVerdict(review),
  };
}
