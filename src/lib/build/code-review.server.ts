/**
 * BUILD verification: agent code review of the staged diff, server half.
 *
 * Runs the deterministic checks over the changeset, then asks one model for the
 * judgment findings through the `runtime.server.ts` chokepoint (surface "judge",
 * the same lane `runCritic` and the design lens use, so this call is budgeted,
 * kill-switch checked, and cost-attributed like every other AI call here). The
 * pure half in `code-review.ts` owns the diff rendering, the deterministic
 * findings, the output bounding, and the verdict; this file owns the I/O.
 *
 * ORDER MATTERS. The deterministic pass runs FIRST and its result is returned
 * whether or not the model call succeeds, so a provider outage degrades the
 * review from "judgment plus facts" to "facts", never to "approve".
 *
 * `.server.ts`: runs only in the Worker, never bundled to the client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import { asPlainObject } from "@/lib/ai/json-shape";
import {
  countReviewableFiles,
  decideReviewVerdict,
  deterministicFindings,
  parseReviewFindings,
  renderChangesetDiff,
  reviewGate,
  type ChangesetReview,
  type ReviewFinding,
  type ReviewGate,
} from "./code-review";
import { scanStagedChangesForSecrets, type StagedSecretScan } from "./secret-scan";
import { planChangesetTests, type ChangesetTestPlan } from "./test-plan";
import type { StagedChangeContent } from "./secret-scan";

const REVIEW_SYSTEM = `You are the code reviewer for an autonomous build agent. You are reading a diff the agent has staged but NOT yet committed or opened as a pull request. You are the last reader before it becomes real code in someone's repository.

Review the diff for, in this order of importance:
- SECURITY: missing authorization or ownership checks on a data access, user input reaching a query / command / template unescaped, a permission or tenancy boundary widened, an authentication path weakened, unsafe deserialization.
- CORRECTNESS: logic that does not do what the surrounding code and the stated intent say it should. Off-by-one, inverted condition, wrong variable, unhandled null, a promise never awaited, a race between two writes.
- ERROR HANDLING: a caught error that is swallowed with no propagation and no log, a fallback that hides a real failure by returning a plausible empty or default value, a failure path that reports success.
- SCOPE: files or behaviour changed that the stated intent did not ask for, and anything that could be removed without losing the intent.
- CONVENTION: a pattern that contradicts how the surrounding file already does the same thing.

RULES YOU MUST FOLLOW:
- Judge ONLY what the diff shows. You are seeing changed lines with a few lines of context, not whole files. If something looks wrong but the answer could be in code you cannot see, either say so in the issue or do not raise it. Never invent a requirement.
- Every finding names a path and, where you can, a line number from the diff (the numbers prefixed + are lines in the staged file).
- "blocker" is reserved for something that would be a real incident: a security hole, data loss, or a change that cannot work at all. "major" is a real defect. "minor" is a genuine improvement worth making.
- An empty findings list is a valid and useful answer. Do not manufacture findings to look thorough. Do not restate what the code does.
- Do NOT raise missing tests, missing types, or a leaked credential: those are checked deterministically before you and adding them again is noise.

Return STRICT JSON only:
{"verdict":"approve|revise|block","summary":"max 240 chars, what this changeset does and the single most important thing about it","findings":[{"severity":"blocker|major|minor","category":"correctness|security|error-handling|scope|convention","path":"the file","line":123,"issue":"what is wrong and why it matters","fix":"the concrete change"}]}`;

const REVIEW_MODEL = "google/gemini-2.5-pro";
const REVIEW_FALLBACK_MODEL = "google/gemini-2.5-flash";

export interface ChangesetReviewResult {
  review: ChangesetReview;
  gate: ReviewGate;
  secrets: StagedSecretScan;
  testPlan: ChangesetTestPlan;
  /**
   * Whether the verdict was written to the changeset row. False means the
   * verdict lives only in this run's tool trail, which is honest to state
   * rather than imply a durable record that is not there. See
   * BUILD-NEEDS-MIGRATION.md.
   */
  persisted: boolean;
  /** Why the model half did not run, when it did not. Never a secret or a stack. */
  model_error: string | null;
}

/** Load a changeset's staged content in the shape the pure half consumes. */
export async function loadStagedContent(
  supabase: SupabaseClient,
  changesetId: string,
): Promise<StagedChangeContent[]> {
  const { data, error } = await supabase
    .from("studio_changes")
    .select("path,op,base_content,new_content")
    .eq("changeset_id", changesetId)
    .order("path");
  if (error) throw new Error(`could not read staged changes: ${error.message}`);
  return (data ?? []) as StagedChangeContent[];
}

/**
 * Review a changeset's staged diff.
 *
 * Never throws on the model path: a provider failure returns a review carrying
 * the deterministic findings with `reviewer_model: null`, which
 * `decideReviewVerdict` renders as "unreviewed" when there is nothing else to
 * say. It DOES throw when the changeset cannot be read at all, because a review
 * of nothing is not a result.
 */
export async function runChangesetReview(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    changesetId: string;
    workspaceId?: string | null;
    runId?: string | null;
    /** The work order this changeset was meant to satisfy, for the scope lens. */
    intent?: string | null;
    /** Test files already on the branch, so an existing test is not a gap. */
    repoTestPaths?: readonly string[];
    /** The dependency-audit note, when one applies to this changeset. */
    dependencyNote?: string | null;
    /** Paths outside the Build lane's write boundary, if any slipped through. */
    forbiddenPaths?: readonly string[];
  },
): Promise<ChangesetReviewResult> {
  const changes = await loadStagedContent(supabase, opts.changesetId);
  if (changes.length === 0) {
    throw new Error("changeset has no staged changes to review");
  }

  // 1. The deterministic pass. Runs first, always, and its findings survive
  //    whatever happens to the model call below.
  const secrets = scanStagedChangesForSecrets(changes);
  const testPlan = planChangesetTests(
    changes.map((c) => ({ path: c.path, op: c.op })),
    opts.repoTestPaths ?? [],
  );
  const facts = deterministicFindings({
    changes,
    secrets,
    testPlan,
    forbiddenPaths: opts.forbiddenPaths,
    dependencyNote: opts.dependencyNote ?? null,
  });

  // 2. The judgment pass.
  const diff = renderChangesetDiff(changes);
  const intentBlock = opts.intent?.trim()
    ? `STATED INTENT (what this changeset was asked to do):\n${opts.intent.trim().slice(0, 4000)}`
    : "STATED INTENT: not supplied. Judge scope only against what the diff itself implies.";
  const truncationBlock = diff.truncated
    ? "\n\nNOTE: the diff above was truncated. Say so in your summary and do not draw conclusions about files you were not shown."
    : "";
  const userContent = `${intentBlock}\n\nSTAGED DIFF (${diff.files_rendered} file(s)):\n${diff.text}${truncationBlock}`;

  let judgments: ReviewFinding[] = [];
  let modelVerdict: string | null = null;
  let summary = "";
  let reviewerModel: string | null = null;
  let modelError: string | null = null;

  try {
    const result = await callModel(supabase, userId, {
      surface: "judge",
      surface_ref: `code-review:changeset:${opts.changesetId}`,
      model: REVIEW_MODEL,
      fallbackModel: REVIEW_FALLBACK_MODEL,
      responseFormat: "json_object",
      workspaceId: opts.workspaceId ?? null,
      runId: opts.runId ?? null,
      messages: [
        { role: "system", content: REVIEW_SYSTEM },
        { role: "user", content: userContent },
      ],
    });
    const parsed = asPlainObject<Record<string, unknown>>(result.json);
    if (!parsed) {
      // A malformed shape is a failed review, not an empty one. Treating it as
      // "the model found nothing" is exactly how a silent green happens.
      modelError = "the reviewer returned a shape this could not read";
    } else {
      judgments = parseReviewFindings(parsed);
      modelVerdict = typeof parsed.verdict === "string" ? parsed.verdict : null;
      summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 280) : "";
      reviewerModel = REVIEW_MODEL;
    }
  } catch (e) {
    modelError = e instanceof Error ? e.message.slice(0, 200) : "reviewer call failed";
  }

  const findings = [...facts, ...judgments];
  const verdict = decideReviewVerdict({
    findings,
    modelRan: reviewerModel !== null,
    modelVerdict,
  });

  const review: ChangesetReview = {
    verdict,
    summary: summary || fallbackSummary(verdict, findings.length, modelError),
    findings,
    files_reviewed: countReviewableFiles(changes),
    reviewer_model: reviewerModel,
    reviewed_at: new Date().toISOString(),
  };

  return {
    review,
    gate: reviewGate(review),
    secrets,
    testPlan,
    persisted: await persistReview(supabase, opts.changesetId, review),
    model_error: modelError,
  };
}

function fallbackSummary(verdict: string, findingCount: number, modelError: string | null): string {
  if (modelError) {
    return `The judgment pass did not run (${modelError}). ${findingCount} deterministic finding(s) stand on their own.`;
  }
  return `${findingCount} finding(s). Verdict: ${verdict}.`;
}

/**
 * Best-effort persist onto the changeset row.
 *
 * The `code_review` column does not exist yet and creating it needs a migration
 * this lane is not allowed to write (BUILD-NEEDS-MIGRATION.md describes it). So
 * a missing-column error is expected and is NOT a failure of the review: it is
 * reported truthfully as `persisted: false` and the verdict still reaches the
 * caller and the run's tool trail. Any OTHER write error is logged, because a
 * silent persist failure is the class of bug this repo hunts.
 */
async function persistReview(
  supabase: SupabaseClient,
  changesetId: string,
  review: ChangesetReview,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("studio_changesets")
      .update({ code_review: review } as never)
      .eq("id", changesetId);
    if (!error) return true;
    // 42703 = undefined_column, i.e. the migration has not landed yet.
    const missingColumn = error.code === "42703" || /code_review/.test(error.message ?? "");
    if (!missingColumn) {
      console.error("[studio.review] verdict persist failed:", error.message);
    }
    return false;
  } catch (e) {
    console.error("[studio.review] verdict persist threw:", e);
    return false;
  }
}
