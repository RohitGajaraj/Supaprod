/**
 * BD-1, the 'openhands' `BuildDriver` adapter: the existing BLD-04 delegate
 * seam (`@/lib/delegate/*`) promoted to a full build driver. NOTHING is
 * duplicated: dispatch calls `resolveDelegateProvider('openhands').submit`,
 * poll calls `pollDelegateJob`, result reads the same poll and folds terminal
 * state back onto the mission via `foldDelegateResult`. Dormancy therefore
 * comes for free, with no `DELEGATE_OUTBOUND_ENABLED` / endpoint configured,
 * `available()` is false and dispatch refuses cleanly.
 *
 * Cancel is honestly unsupported: the OpenHands conversation API the delegate
 * seam targets has no wired stop path, so we say so instead of pretending.
 *
 * Built as a factory with injectable deps (defaulting to the real delegate
 * seam) so tests exercise the adapter against a mocked provider without
 * module-cache surgery.
 */
import type {
  BuildDriver,
  BuildDriverContext,
  BuildResult,
  BuildSession,
  BuildSpec,
  BuildStatus,
} from "./driver";
import type { DelegateProvider } from "@/lib/delegate/provider";
import { resolveDelegateProvider } from "@/lib/delegate/openhands.server";
import {
  pollDelegateJob,
  foldDelegateResult,
  type DelegatePollResult,
} from "@/lib/delegate/poll.server";

/**
 * PURE. Fold the structured `BuildSpec` into the single task text the delegate
 * seam forwards (the seam's `DelegateRequest.task`). The acceptance criteria
 * and guardrails travel INSIDE the task so the external engine sees the bar,
 * not just the goal. Bounding to the provider limit stays downstream in
 * `buildOpenHandsRequest`, one place owns the cap.
 */
export function buildDelegateTask(spec: BuildSpec): string {
  const parts = [spec.goal];
  if (spec.acceptanceCriteria?.length) {
    parts.push(
      `Acceptance criteria (every one must hold):\n${spec.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (spec.guardrails?.length) {
    parts.push(
      `Guardrails (hard constraints):\n${spec.guardrails.map((g) => `- ${g}`).join("\n")}`,
    );
  }
  if (spec.designPointers?.length) {
    parts.push(`Design references:\n${spec.designPointers.map((p) => `- ${p}`).join("\n")}`);
  }
  if (spec.targetFiles?.length) {
    parts.push(`Files in scope:\n${spec.targetFiles.map((f) => `- ${f}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

/** PURE. Normalize the delegate seam's status bucket to the seam-wide `BuildStatus`. */
export function mapDelegateStatus(status: DelegatePollResult["status"]): BuildStatus {
  switch (status) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "done":
      return "done";
    case "failed":
      return "failed";
    case "disabled":
    case "unknown":
      return "unknown";
  }
}

export interface OpenHandsBuildDeps {
  resolveProvider: (preferred?: string | null) => DelegateProvider;
  pollJob: (externalJobId: string) => Promise<DelegatePollResult>;
  foldResult: typeof foldDelegateResult;
}

export function createOpenHandsBuildDriver(deps?: Partial<OpenHandsBuildDeps>): BuildDriver {
  const d: OpenHandsBuildDeps = {
    resolveProvider: deps?.resolveProvider ?? resolveDelegateProvider,
    pollJob: deps?.pollJob ?? pollDelegateJob,
    foldResult: deps?.foldResult ?? foldDelegateResult,
  };
  return {
    id: "openhands",

    available(): boolean {
      return d.resolveProvider("openhands").available;
    },

    async dispatch(ctx: BuildDriverContext, spec: BuildSpec): Promise<BuildSession> {
      if (!ctx.missionId) {
        throw new Error(
          "openhands build driver: ctx.missionId is required (the adapter folds results onto an existing mission; it does not create one)",
        );
      }
      const verdict = await d.resolveProvider("openhands").submit({
        task: buildDelegateTask(spec),
        repoUrl: spec.repo?.url ?? "",
        baseBranch: spec.repo?.baseBranch ?? "",
        context: {
          ...(spec.decisionRef ? { decision_ref: spec.decisionRef } : {}),
          ...(spec.evidenceIds?.length ? { evidence_ids: spec.evidenceIds } : {}),
          ...(spec.budget ? { budget: spec.budget } : {}),
        },
        supaprodRunId: ctx.runId ?? null,
      });
      if (!verdict.accepted || !verdict.externalJobId) {
        throw new Error(`openhands dispatch refused: ${verdict.reason}`);
      }
      return {
        driver: "openhands",
        missionId: ctx.missionId,
        ...(ctx.runId ? { runId: ctx.runId } : {}),
        externalJobId: verdict.externalJobId,
      };
    },

    async poll(_ctx: BuildDriverContext, session: BuildSession): Promise<BuildStatus> {
      if (!session.externalJobId) return "unknown";
      return mapDelegateStatus((await d.pollJob(session.externalJobId)).status);
    },

    async result(ctx: BuildDriverContext, session: BuildSession): Promise<BuildResult> {
      if (!session.externalJobId) {
        return { status: "unknown", summary: "no external job id recorded on this session" };
      }
      const pollResult = await d.pollJob(session.externalJobId);
      const status = mapDelegateStatus(pollResult.status);
      const terminal = pollResult.status === "done" || pollResult.status === "failed";
      // Fold terminal state back into the mission through the existing seam
      // (best-effort by contract: foldDelegateResult never throws). Needs the
      // source run to write onto; without one there is nothing to fold.
      if (terminal && session.runId) {
        await d.foldResult({
          runId: session.runId,
          missionId: session.missionId,
          provider: "openhands",
          externalJobId: session.externalJobId,
          pollResult,
          supabase: ctx.supabase,
        });
      }
      return {
        status,
        summary: pollResult.result ?? pollResult.error ?? null,
        refs: { missionId: session.missionId, externalJobId: session.externalJobId },
      };
    },

    async cancel(): Promise<{ ok: boolean; reason?: string }> {
      return { ok: false, reason: "unsupported by OpenHands adapter" };
    },
  };
}

/** The wired adapter instance the resolver registers. */
export const openHandsBuildDriver: BuildDriver = createOpenHandsBuildDriver();
