// W5b: the new-build dispatch gate - pure, client-safe helpers.
//
// Dispatching a spec to Build needs a resolvable repo (resolveGitHub throws
// its "GitHub is not connected" refusal when no binding/env repo exists).
// These helpers classify that resolution for the canDispatchToRepo pre-check,
// gate the dispatch click on its verdict, and compose provision-then-retry so
// a spec with no repo gets the real path (connect one on /sync, or provision
// a starter repo) instead of a raw error toast. No server imports here: the
// server fn and the dialog both consume these.

export type RepoDispatchCheck = {
  repoResolvable: boolean;
  repo?: string;
  reason?: string;
};

/** Run a repo resolution (the same one resolveGitHub performs) and classify the outcome. */
export async function classifyRepoResolution(
  resolve: () => Promise<{ repo: string }>,
): Promise<RepoDispatchCheck> {
  try {
    const { repo } = await resolve();
    return { repoResolvable: true, repo };
  } catch (e) {
    return { repoResolvable: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** True when an error message is resolveGitHub's not-connected refusal. */
export function isRepoNotConnectedError(message: string): boolean {
  return /github is not connected/i.test(message);
}

/**
 * Gate a dispatch click on the pre-check: resolvable dispatches, not
 * resolvable opens the gate with the resolver's reason. The pre-check is
 * advisory - when it cannot run at all, dispatch anyway and let the real
 * error surface through the mutation's own error path.
 */
export async function gateDispatch(args: {
  check: () => Promise<RepoDispatchCheck>;
  dispatch: () => void;
  openGate: (reason: string | null) => void;
}): Promise<void> {
  let verdict: RepoDispatchCheck;
  try {
    verdict = await args.check();
  } catch {
    args.dispatch();
    return;
  }
  if (verdict.repoResolvable) args.dispatch();
  else args.openGate(verdict.reason ?? null);
}

/**
 * Provision a starter repo, then retry the dispatch, in that order. The retry
 * fires only after provisioning resolves; a provisioning failure propagates
 * and the dispatch is never retried. Returns the provisioned repo so the
 * caller can show its URL in the success state.
 */
export async function provisionThenRetry<R>(
  provision: () => Promise<R>,
  retryDispatch: () => void | Promise<unknown>,
): Promise<R> {
  const repo = await provision();
  await retryDispatch();
  return repo;
}
