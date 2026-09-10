// W5b: the new-build dispatch gate - pure, client-safe helpers.
//
// Dispatching a spec to Build needs a resolvable repo (resolveGitHub throws
// its "GitHub is not connected" refusal when no binding/env repo exists).
// These helpers classify that resolution for the canDispatchToRepo pre-check,
// gate the dispatch click on its verdict, and compose provision-then-retry so
// a spec with no repo gets the real path (connect one on /sources, or provision
// a starter repo) instead of a raw error toast. No server imports here: the
// server fn and the dialog both consume these.

/**
 * THREE outcomes, not two.
 *
 * "You have not connected a repo" and "we could not find out whether you have"
 * are different facts, and a person acts differently on each. Collapsing them
 * was a real defect, found 2026-07-30: the workspace-binding branch resolves
 * the bound connection through the SERVICE-ROLE client, so a missing
 * SUPABASE_SERVICE_ROLE_KEY made resolution throw, which this classified as
 * `repoResolvable: false`, which every surface rendered as "No repo is
 * connected, so a build has nowhere to open a pull request. Connect one."
 *
 * The founder had GitHub connected and a repo bound, and the product told him
 * to go connect one. An infrastructure error wearing a user-state fact is the
 * worst kind of wrong answer, because it is actionable and the action is
 * futile.
 *
 * The rest of the product already draws this line: the run list's own comment
 * says "'Nothing here' and 'we could not find out' are different facts and a
 * person acts differently on each, so they never share a shape." This brings
 * the dispatch check into line with that.
 */
export type RepoResolution = "connected" | "not_connected" | "unknown";

export type RepoDispatchCheck = {
  /** Kept as the dispatch predicate: only "connected" may dispatch silently. */
  repoResolvable: boolean;
  resolution: RepoResolution;
  repo?: string;
  reason?: string;
};

/** Run a repo resolution (the same one resolveGitHub performs) and classify the outcome. */
export async function classifyRepoResolution(
  resolve: () => Promise<{ repo: string }>,
): Promise<RepoDispatchCheck> {
  try {
    const { repo } = await resolve();
    return { repoResolvable: true, resolution: "connected", repo };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    // Only resolveGitHub's own refusal means "not connected". Anything else is
    // the check failing, and the check must not narrate its own failure as a
    // fact about the user's setup.
    return {
      repoResolvable: false,
      resolution: isRepoNotConnectedError(reason) ? "not_connected" : "unknown",
      reason,
    };
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
  if (verdict.repoResolvable) return args.dispatch();
  // The pre-check is advisory, and an "unknown" verdict is the check failing
  // rather than a finding about the repo. Same handling as the check throwing
  // outright, a few lines up: dispatch, and let the real error surface through
  // the mutation's own error path. Opening the connect-a-repo gate here would
  // block a dispatch that may well have worked.
  if (verdict.resolution === "unknown") return args.dispatch();
  args.openGate(verdict.reason ?? null);
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
