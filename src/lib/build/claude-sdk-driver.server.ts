/**
 * PC-35 / BD-1: the 'claude-sdk' `BuildDriver` adapter. Owned, headless,
 * server-side codegen against a real bound external repo, metered through
 * the existing credits chokepoint (`callModel`, surface "studio" - no new
 * AI gateway, no new provider client, no new dependency).
 *
 * Scoped for this first version, honestly: single-shot, not iterative. One
 * `callModel` turn reads the caller-specified `spec.targetFiles` (required;
 * this driver does not yet explore an unfamiliar repo on its own), asks
 * Claude for the full replacement content of each file plus a summary,
 * commits them on a fresh branch, and opens a real PR via the existing
 * `RepoProvider` seam (BYO-P1) - the SAME read/write/PR interface the
 * platform's other repo-facing code already uses, so no git/GitHub
 * mechanics are reinvented here. dispatch() therefore completes the whole
 * cycle synchronously; poll/result report the already-known terminal state
 * rather than tracking a genuinely async external job (there is none - the
 * work happens inside this one call).
 *
 * Caps: one concurrent claude-sdk session per workspace (checked against
 * live missions before dispatch); the account-level credit budget gate
 * already inside callModel is the real spend enforcement today. A true
 * PER-TASK pre-authorization hold (reserving budget before the call, not
 * just checking the account gate) is a deeper credits-ledger integration
 * this file does not attempt - documented as the next real increment, not
 * silently assumed done.
 *
 * The merge gate is untouched: this driver only ever opens a PR. Merging
 * stays behind the existing review-pinned studio.pr.merge flow.
 */
import type {
  BuildDriver,
  BuildDriverContext,
  BuildResult,
  BuildSession,
  BuildSpec,
  BuildStatus,
} from "./driver";
import { resolveProviderAuth } from "@/lib/connectors/resolve.server";
import { repoProviderFor, type RepoRef } from "@/lib/connectors/repo-provider";
import { callModel } from "@/lib/ai/runtime.server";

const CLAUDE_SDK_MODEL = "claude-sonnet-4-5-20250929";
/** Bounded: a single-shot patch call reading an unbounded file set is both
 *  a cost risk and a prompt-size risk. */
const MAX_TARGET_FILES = 12;

/**
 * RepoProvider.createBranch needs the base branch's current commit SHA, not
 * its name, and the interface has no public "resolve branch to sha" method
 * (readTree resolves it internally but does not return it). One direct
 * GitHub Git Data API call, using the same resolved token -- not a second
 * client, not a new RepoProvider method other adapters would have to grow
 * too.
 */
async function githubBranchHeadSha(
  repoRef: RepoRef,
  branch: string,
  token: string,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${repoRef.owner}/${repoRef.repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) {
    throw new Error(
      `claude-sdk build driver: could not resolve branch "${branch}" (${res.status})`,
    );
  }
  const data = (await res.json()) as { object?: { sha?: string } };
  const sha = data.object?.sha;
  if (!sha) throw new Error(`claude-sdk build driver: branch "${branch}" has no resolvable sha`);
  return sha;
}

function parseRepoUrl(url: string | undefined): RepoRef | null {
  if (!url) return null;
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

type ClaudeSdkPatch = { files: { path: string; content: string }[]; summary: string };

/** PURE. `parsed` is callModel's own best-effort responseFormat=json_object
 *  parse (opts.json) -- no second JSON.parse of the raw string here. */
function parsePatchResponse(parsed: unknown): ClaudeSdkPatch | null {
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { files?: unknown }).files)
  ) {
    return null;
  }
  const files = (parsed as { files: unknown[] }).files.filter(
    (f): f is { path: string; content: string } =>
      !!f &&
      typeof f === "object" &&
      typeof (f as { path?: unknown }).path === "string" &&
      typeof (f as { content?: unknown }).content === "string",
  );
  if (files.length === 0) return null;
  const summary =
    typeof (parsed as { summary?: unknown }).summary === "string"
      ? (parsed as { summary: string }).summary
      : "Claude SDK driver patch.";
  return { files, summary };
}

/**
 * PURE. The automatic driver-selection heuristic (spec accept criteria):
 * a small, bounded diff (few known target files) stays on the native loop
 * (cheaper, already proven); a spec naming more files, or none at all
 * (broader, less-bounded work), routes to the SDK driver. Callers still
 * override via `preferred` in resolveBuildDriver -- this is the default
 * only.
 */
export function chooseBuildDriverId(spec: BuildSpec): "native" | "claude-sdk" {
  const fileCount = spec.targetFiles?.length ?? 0;
  if (fileCount > 0 && fileCount <= 3) return "native";
  return "claude-sdk";
}

async function oneConcurrentSessionGuard(
  ctx: BuildDriverContext,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data } = await ctx.supabase
    .from("missions")
    .select("id")
    .eq("workspace_id", ctx.workspaceId)
    .eq("build_driver", "claude-sdk")
    .in("status", ["proposed", "running", "in_progress"])
    .limit(1);
  if ((data?.length ?? 0) > 0) {
    return { ok: false, reason: "a claude-sdk build is already running in this workspace" };
  }
  return { ok: true };
}

export const claudeSdkBuildDriver: BuildDriver = {
  id: "claude-sdk",

  available(): boolean {
    // Dormant by default: writing real commits to a real external repo is a
    // founder-gated capability, same posture as delegate-out's
    // DELEGATE_OUTBOUND_ENABLED floor.
    return process.env.CLAUDE_SDK_BUILD_DRIVER_ENABLED === "true";
  },

  async dispatch(ctx: BuildDriverContext, spec: BuildSpec): Promise<BuildSession> {
    if (!ctx.missionId) {
      throw new Error(
        "claude-sdk build driver: ctx.missionId is required (folds its result onto an existing mission, like the openhands adapter)",
      );
    }
    if (!spec.repo?.url) {
      throw new Error("claude-sdk build driver: spec.repo.url is required");
    }
    if (!spec.targetFiles?.length) {
      throw new Error(
        "claude-sdk build driver: spec.targetFiles is required for this version -- it does not yet explore an unfamiliar repo on its own",
      );
    }
    if (spec.targetFiles.length > MAX_TARGET_FILES) {
      throw new Error(
        `claude-sdk build driver: ${spec.targetFiles.length} target files exceeds the cap of ${MAX_TARGET_FILES}`,
      );
    }

    const guard = await oneConcurrentSessionGuard(ctx);
    if (!guard.ok) throw new Error(`claude-sdk dispatch refused: ${guard.reason}`);

    const repoRef = parseRepoUrl(spec.repo.url);
    if (!repoRef) throw new Error(`claude-sdk build driver: could not parse repo url as GitHub`);

    const resolved = await resolveProviderAuth({
      userClient: ctx.supabase,
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
      productId: null,
      provider: "github",
      resourceKind: "repo",
    });
    if (!resolved.auth || resolved.source === "none" || !("token" in resolved.auth)) {
      throw new Error(
        "claude-sdk dispatch refused: no bound GitHub repo access for this workspace",
      );
    }
    const repoProvider = repoProviderFor("github", resolved.auth.token, repoRef);
    const baseBranch = spec.repo.baseBranch || "main";

    const currentFiles = await Promise.all(
      spec.targetFiles.map(async (path) => {
        try {
          const f = await repoProvider.readFile(repoRef, path, baseBranch);
          return { path, content: f.content, existed: true };
        } catch {
          return { path, content: "", existed: false };
        }
      }),
    );

    const promptParts = [
      `Goal: ${spec.goal}`,
      spec.acceptanceCriteria?.length
        ? `Acceptance criteria (every one must hold):\n${spec.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`
        : "",
      spec.guardrails?.length
        ? `Guardrails (hard constraints):\n${spec.guardrails.map((g) => `- ${g}`).join("\n")}`
        : "",
      `Current file contents:\n${currentFiles
        .map((f) => `--- ${f.path} ${f.existed ? "" : "(does not exist yet)"} ---\n${f.content}`)
        .join("\n\n")}`,
      `Return ONLY a JSON object: {"files": [{"path": string, "content": string}], "summary": string}. "files" must include the FULL new content of every file that needs to change, for exactly the paths listed above (and only those paths). "summary" is one paragraph describing the change for a pull request description.`,
    ].filter(Boolean);

    const modelResult = await callModel(ctx.supabase, ctx.userId, {
      surface: "studio",
      surface_ref: ctx.missionId,
      model: CLAUDE_SDK_MODEL,
      runId: ctx.runId ?? null,
      workspaceId: ctx.workspaceId,
      responseFormat: "json_object",
      messages: [
        {
          role: "system",
          content:
            "You are a careful senior engineer making a bounded, reviewable code change. Output strict JSON only, no prose outside the JSON object.",
        },
        { role: "user", content: promptParts.join("\n\n") },
      ],
    });

    if (modelResult.status !== "ok") {
      throw new Error(`claude-sdk dispatch failed: model call ${modelResult.status}`);
    }
    const patch = parsePatchResponse(modelResult.json);
    if (!patch) {
      throw new Error("claude-sdk dispatch failed: the model did not return a valid patch");
    }

    const branchName = `supaprod/claude-sdk/${ctx.missionId.slice(0, 8)}`;
    const baseSha = await githubBranchHeadSha(repoRef, baseBranch, resolved.auth.token);
    const branch = await repoProvider.createBranch(repoRef, branchName, baseSha);
    await repoProvider.commitFiles(
      repoRef,
      branchName,
      `Claude SDK: ${spec.goal.slice(0, 200)}`,
      patch.files,
      branch.sha,
    );
    const pr = await repoProvider.openChangeRequest(
      repoRef,
      branchName,
      spec.goal.slice(0, 200),
      patch.summary,
      baseBranch,
    );

    return {
      driver: "claude-sdk",
      missionId: ctx.missionId,
      ...(ctx.runId ? { runId: ctx.runId } : {}),
      externalJobId: pr.url,
    };
  },

  async poll(): Promise<BuildStatus> {
    // Single-shot: dispatch() only returns once the PR exists, so a session
    // that got this far is always terminal. There is no separate async job
    // to poll -- an honest 'done' beats fabricating a progress state.
    return "done";
  },

  async result(_ctx: BuildDriverContext, session: BuildSession): Promise<BuildResult> {
    return {
      status: "done",
      summary: session.externalJobId
        ? `Pull request opened: ${session.externalJobId}`
        : "No pull request URL recorded.",
      refs: {
        missionId: session.missionId,
        ...(session.externalJobId ? { pullRequestUrl: session.externalJobId } : {}),
      },
    };
  },

  async cancel(): Promise<{ ok: boolean; reason?: string }> {
    return {
      ok: false,
      reason: "unsupported: dispatch is a single synchronous call, nothing runs to cancel",
    };
  },
};
