import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveProviderAuth } from "@/lib/connectors/resolve.server";
import { repoProviderFor, type RepoRef } from "@/lib/connectors/repo-provider";
import { deploymentRowsFor, type DeploymentRow } from "@/lib/deployments";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import {
  collectRepoFiles,
  deployChangesetApp,
  denoDeployConfigured,
} from "@/lib/hosting/changeset-deploy.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { recordLineageSafe } from "@/lib/lineage.functions";
import { defaultCheckByDate } from "@/lib/launch-plan.functions";
import { generateReleaseNotesCore } from "@/lib/studio.functions";
import { trackIdByChangeset } from "@/lib/changelog";

// Resolve the workspace to scope a read to (the active one, else the caller's
// default). Mirrors the local helper in billing/briefs/audio.functions.ts.
//
// THE RPC'S ERROR IS NO LONGER DISCARDED. Both callers treat a null answer as
// "this person has nothing here" and return an empty list, so `const { data } =`
// on its own made a FAILED rpc indistinguishable from a caller who genuinely has
// no workspace: a transient failure rendered as an empty Ship rather than as a
// failure, which is the discarded-read-error-as-absence shape this repo keeps
// getting bitten by. A real null (no membership yet) is still returned as null
// and still yields an empty list; only an actual error travels now.
async function resolveWorkspaceId(
  supabase: SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;
  const { data, error } = await supabase.rpc("current_user_default_workspace");
  if (error) {
    throw new Error(`Supaprod could not work out which workspace to read: ${error.message}`);
  }
  return (data as string | null) ?? null;
}

// BYO-P3 WI1 — Deploy capture server functions.
// captureDeployments reads the provider's deployment state (provider-agnostic,
// via RepoProvider.readDeployments) and persists it; listDeployments reads it
// back for the outcome surface. New tables aren't in the generated Supabase
// types yet (same untyped-client cast as F-V5-LOOP-CLOSE).
//
// "OPTIONAL SIGNAL, NEVER A THROWN ERROR" WAS WRITTEN HERE OF BOTH, AND IT IS
// NOW TRUE ONLY OF THE CORE. `captureDeploymentsCore` still degrades: no usable
// repo, no resolvable connection, a provider read that throws, and a provider
// with nothing to report all come back as zero captures, so a sweep can walk
// past them. What it does NOT swallow is the changeset read (an error, or no
// such changeset) and its own write (an error, or the empty row set supabase-js
// hands back for a refusal), because a write the database refused, reported as
// a capture, is worse than a failure.
//
// THE DOOR REFUSES OUT LOUD, AND THAT IS DELIBERATE. `captureDeployments`
// throws on a changeset it cannot see, a change that has not merged, an
// unusable repo, a change with no pull request, a landed commit it cannot
// prove, and — from `resolveGitHub` inside `landedShaForChangeset` — a missing
// GitHub connection. A person who pressed a button is owed the reason, and a
// capture scoped to the wrong commit is the one outcome worse than none. The
// outcome view still degrades gracefully because it does not go through this
// door: it renders from `listDeployments` over rows the cron's core path wrote,
// and reaches the door only when someone presses "Check for deploys".

/** Parse a stored "owner/repo" into a RepoRef; null when malformed. */
function parseRepo(repo: string | null | undefined): RepoRef | null {
  const m = (repo ?? "").trim().match(/^([^/\s]+)\/([^/\s]+)$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/**
 * WHAT HAPPENED WHEN THE PROVIDER WAS ASKED, kept separate from how many rows
 * were written.
 *
 * `captured: 0` on its own cannot tell "your pipeline has published nothing for
 * this commit" from "the request never got there", and the core collapsed all
 * four of its early exits into that one number. The door then had to hedge —
 * "either your pipeline has not published a deploy … or the read did not reach
 * your provider" — which is two opposite facts in one sentence, and the second
 * of them is the house rule's own shape: a failed read narrated as absence.
 * They are NOT indistinguishable; the core simply threw the distinction away
 * fifteen lines before the door had to describe it. It is returned instead.
 */
export type DeployReadOutcome =
  /** The provider answered. Zero captures then genuinely means it has nothing. */
  | "answered"
  /** No usable owner/repo on the changeset — nothing was asked. */
  | "no-repo"
  /** No provider credential resolved for this changeset — nothing was asked. */
  | "not-connected"
  /** The provider was asked and the read threw. Says NOTHING about deploys. */
  | "read-failed";

/**
 * Read what the repo's OWN provider says it deployed, and persist it.
 *
 * EXTRACTED FROM THE SERVER FUNCTION, behaviour unchanged, so a caller with no
 * browser session can run the identical path. The extraction exists because
 * this capability had ZERO callers repo-wide: `captureDeployments` shipped with
 * BYO-P3 WI1 and nothing — no component, no agent tool, no cron — ever invoked
 * it. For every repo Supaprod does not host (no `supaprod.json`, or no
 * DENO_DEPLOY_TOKEN on this install) that was total and silent: the only other
 * writer of `deployments` rows is ci-poll-tick's hosted deploy, which those
 * repos never reach, so /ship read "Nothing is in production yet" forever while
 * the customer's own pipeline deployed every merge. ci-poll-tick now calls this
 * for exactly those changesets, and `captureDeployments` below is the server
 * half of the in-app door onto the same path, so the two cannot drift.
 *
 * "SERVER HALF" IS STILL EXACT, AND THE CLIENT HALF IS MOUNTED ON TWO SURFACES.
 * This paragraph used to read "As of 2026-08-06 no component calls
 * `captureDeployments`; the control that would is being mounted on Ship
 * separately", and it was false the moment it was committed: `git log -S
 * "useServerFn(captureDeployments)"` returns exactly one commit, 8a9d4241, and
 * that is the SAME commit that wrote the sentence denying it. Re-checked
 * 2026-08-06: /ship imports it (:155), wraps it (:1016), fires it from the
 * `check` mutation (:1323) and renders "Check for deploys" (:1983);
 * ChangesPanel imports (:87), wraps (:548), and renders the same control
 * (:1099). Both are live end to end.
 *
 * So the cron's 60-minute window is NO LONGER the whole story for a customer's
 * own pipeline, and that is the sentence this file most needs to get right.
 * A deploy published after ci-poll-tick's DEPLOY_CAPTURE_WINDOW_MS gives up is
 * now recoverable by hand from either surface, which is the entire reason
 * `captureDeployments` refuses out loud instead of degrading the way this core
 * does. Corrected rather than dropped, because the stale version told the next
 * reader that the in-app recovery door is unreachable, and the reasonable
 * response to being told that is to go and build a door that already exists.
 *
 * `sha` SCOPES THE READ AND MUST BE A COMMIT THIS CHANGESET ACTUALLY PRODUCED.
 * GitHub's deployments list is repo-wide and reverse-chronological: asked with
 * no sha it answers with the ten most recent deployments regardless of which
 * change made them, and every row written here is filed under THIS
 * changeset_id. That is not a cosmetic mistake — /ship offers a promote over a
 * changeset's newest successful preview and `promoteChangesetToProductionCore`
 * then deploys that row's `commit_sha`, so one mis-attributed row is a button
 * that ships a commit its owner never wrote. A caller passes a sha it can
 * prove, or captures nothing.
 *
 * THE `base_sha` FALLBACK IS NOW UNREACHED, AND IT IS KEPT ONLY AS A FLOOR.
 * It was described here as leaving "the existing door's behaviour untouched" —
 * which it did, and that behaviour was wrong: `base_sha` is the commit the
 * branch was staged FROM, so it names the release BEFORE this one. Both callers
 * now pass a provider-proven sha (the cron reads the merged PR's
 * merge_commit_sha; `captureDeployments` below reads the same and refuses when
 * it cannot). It is not turned into a throw here because this core is shared
 * with a cron owned elsewhere and the fallback is dead on both live paths; a
 * NEW caller must still pass a sha it can prove rather than rely on it.
 *
 * `read` REPORTS WHETHER THE PROVIDER WAS REACHED, alongside the count. A caller
 * sweeping many changesets can keep ignoring it; a caller describing ONE result
 * to a person must not, because `captured: 0` covers both "the provider has
 * nothing for this commit" and "the provider was never successfully asked", and
 * only the first of those is a statement about their pipeline.
 */
export async function captureDeploymentsCore(
  db: SupabaseClient,
  userId: string,
  changesetId: string,
  opts?: { sha?: string | null; triggeredBy?: string | null },
): Promise<{ captured: number; deployments: DeploymentRow[]; read: DeployReadOutcome }> {
  const { data: cs, error } = await db
    .from("studio_changesets")
    .select("id,workspace_id,product_id,repo,base_sha")
    .eq("id", changesetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!cs) throw new Error("Changeset not found");

  const repoRef = parseRepo(cs.repo as string | null);
  if (!repoRef) return { captured: 0, deployments: [], read: "no-repo" };

  // Today studio changesets are GitHub-backed; the read path is still
  // provider-agnostic so a GitLab-bound product captures identically once
  // its changesets land here.
  const resolved = await resolveProviderAuth({
    userClient: db,
    userId,
    workspaceId: (cs.workspace_id as string | null) ?? null,
    productId: (cs.product_id as string | null) ?? null,
    provider: "github",
    resourceKind: "repo",
  });
  if (!resolved.auth || resolved.source === "none" || !("token" in resolved.auth)) {
    return { captured: 0, deployments: [], read: "not-connected" };
  }

  const provider = repoProviderFor("github", resolved.auth.token, repoRef);
  const sha = opts?.sha ?? (cs.base_sha as string | null) ?? undefined;
  let entries;
  try {
    entries = await provider.readDeployments(repoRef, sha);
  } catch (e) {
    console.error("readDeployments failed (non-fatal):", e);
    return { captured: 0, deployments: [], read: "read-failed" };
  }
  if (!entries.length) return { captured: 0, deployments: [], read: "answered" };

  const rows = deploymentRowsFor({
    // FOLD THE ENVIRONMENT NAME TO LOWER CASE AT THIS EDGE, ONCE. GitHub's
    // deployment `environment` is free text and the providers that write it
    // capitalize: Vercel's GitHub integration creates "Production" and
    // "Preview", Netlify creates "Production". Every reader of this table
    // compares the string exactly — /ship's newestDeployment skips a row on
    // `d.environment !== environment`, where that parameter is passed the
    // lower-case literal "production" or "preview"; promote filters
    // `.eq("environment","preview")` — so a captured "Production" row would be
    // stored, listed, counted, and still render as "Nothing is in production
    // yet". Normalizing here beats teaching four readers to case-fold.
    entries: entries.map((e) => ({
      ...e,
      environment: (e.environment ?? "").trim().toLowerCase(),
    })),
    userId,
    workspaceId: cs.workspace_id as string,
    productId: (cs.product_id as string | null) ?? null,
    changesetId: cs.id as string,
    provider: "github",
    triggeredBy: opts?.triggeredBy ?? null,
  });
  // .select("id") because supabase-js RESOLVES a write the database refused:
  // an upsert blocked by RLS comes back with error null and no rows, so the
  // old `if (upErr) throw` reported "captured 5" over an empty table. The
  // returned count is now the number of rows that actually exist.
  const { data: upRows, error: upErr } = await db
    .from("deployments")
    .upsert(rows, { onConflict: "changeset_id,environment,commit_sha" })
    .select("id");
  if (upErr) throw new Error(upErr.message);
  if (!upRows || (upRows as unknown[]).length === 0) {
    throw new Error(
      `deployments upsert wrote no row for changeset ${changesetId} (refused by row-level security or a constraint)`,
    );
  }

  return { captured: (upRows as unknown[]).length, deployments: rows, read: "answered" };
}

/**
 * The commit a merged changeset actually LANDED as, read from the provider
 * rather than guessed. Null when it cannot be proven.
 *
 * THIS EXISTS BECAUSE THE DOOR BELOW USED TO GUESS, and the guess was wrong in
 * the one way that matters. `captureDeploymentsCore` falls back to the
 * changeset's `base_sha` when no sha is passed, and the server function passed
 * none — but `base_sha` is the commit the branch was staged FROM. That is a
 * commit on the default branch belonging to whatever shipped BEFORE this change.
 * On any repo whose pipeline deploys each push to the default branch there IS a
 * deployment for it, so the capture would have succeeded and filed the previous
 * release's environment, status and URL under THIS changeset_id — after which
 * Ship shows this change live in production at an address it never produced,
 * and listChangelog hands that address to the release row. (The promote path
 * cannot be reached from such a row: it takes only `provider = 'deno'` previews.
 * Every read that merely DISPLAYS a deploy can.) The cron never had this bug —
 * ci-poll-tick reads the merged PR's merge_commit_sha and skips the changeset
 * when there is none. The door now reads the same thing, so "same path as the
 * cron's" is true of the sha as well as of the write.
 *
 * A connection failure is NOT swallowed here: `resolveGitHub` throws its own
 * plain-words "not connected" error and the caller lets it travel, so a missing
 * connection is never reported as "your pipeline published nothing". Only the
 * PR read itself is caught, and a caught read returns null, which the caller
 * turns into a refusal. No capture beats a wrong one.
 *
 * NULL HAS TWO MEANINGS AND ONLY ONE OF THEM IS ABOUT GITHUB. The first line
 * returns null without contacting anything when the changeset carries no repo or
 * no PR number, and the caller's refusal text blames "the merged pull request
 * [not being] readable on the connected account" — true of the PR read, false of
 * those two. `captureDeployments` therefore refuses on a missing pr_number
 * BEFORE calling here, with its own sentence; the guard below stays as a floor
 * for any future caller that does not.
 */
async function landedShaForChangeset(
  db: SupabaseClient,
  userId: string,
  cs: {
    workspace_id: string | null;
    product_id: string | null;
    repo: string | null;
    pr_number: number | null;
  },
): Promise<string | null> {
  if (!cs.repo || !cs.pr_number) return null;
  const gh = await resolveGitHub({
    userId,
    workspaceId: cs.workspace_id,
    productId: cs.product_id,
    userClient: db,
  });
  try {
    const res = await fetch(`https://api.github.com/repos/${cs.repo}/pulls/${cs.pr_number}`, {
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return null;
    const pr = (await res.json()) as { merged?: boolean; merge_commit_sha?: string | null };
    return pr.merged ? (pr.merge_commit_sha ?? null) || null : null;
  } catch (e) {
    console.error("landedShaForChangeset PR read failed (non-fatal):", e);
    return null;
  }
}

/**
 * The sentence for a press that wrote nothing, chosen by WHY nothing was
 * written. Split out so every branch is visible at once and none of them can
 * quietly claim the customer's pipeline is idle on the strength of a read that
 * failed.
 */
function zeroCaptureMessage(read: DeployReadOutcome, shortSha: string): string {
  switch (read) {
    case "read-failed":
      return `Supaprod could not reach your repository's deployment record, so nothing was recorded. This says nothing either way about whether your pipeline deployed the commit this change landed as (${shortSha}). Try again; if it keeps failing, re-check the GitHub connection in Settings → Connected accounts.`;
    case "not-connected":
      return "Supaprod has no connection it can use to ask this repository what it deployed, so it did not look. Connect GitHub in Settings → Connected accounts, then try again.";
    case "no-repo":
      // Unreachable from this door — the parseRepo guard in the handler refuses
      // first, with a message that can quote the malformed value. Kept so this
      // switch stays exhaustive over DeployReadOutcome rather than falling
      // through to a sentence about the customer's pipeline.
      return "This change has no usable repository on it, so there was no provider to ask.";
    case "answered":
      return `Your pipeline has not published a deploy for the commit this change landed as (${shortSha}), so there was nothing to record. That is an answer rather than a failure: Supaprod files each deploy once your provider reports it.`;
  }
}

/**
 * The in-app door onto the capture path the cron runs — ask this repo's own
 * provider what it deployed, now, on demand.
 *
 * IT IS THE ONLY WAY TO ASK AFTER THE CRON HAS STOPPED ASKING.
 * ci-poll-tick gives up at DEPLOY_CAPTURE_WINDOW_MS, 60 minutes from the merge,
 * and that bound is a GitHub rate-limit decision rather than a belief that an
 * hour is long enough. A pipeline slower than that — a queued Actions job, a
 * manual approval gate, a nightly release — publishes its deployment into a
 * product that has stopped listening, and with no door here Ship reads "Nothing
 * has merged yet, so there is nothing to promote" for the life of the account
 * while every merge ships somewhere else.
 *
 * Same path as the cron's, so the two cannot drift: same core, same
 * provider-proven sha, same upsert. It differs from the cron only in refusing
 * out loud. The cron `continue`s past a changeset it cannot prove a sha for,
 * because it is sweeping many; a person who pressed a button is owed the reason.
 *
 * Returns the core's `{ captured, deployments, read }` plus the `sha` it asked
 * about and a `message` fit to show.
 *
 * `captured` IS "DEPLOY ROWS NOW ON FILE FOR THIS COMMIT", NOT "NEWLY FOUND".
 * `uq_deployments_capture` is (changeset_id, environment, commit_sha), so a
 * second press UPDATES the same rows in place and the count comes back the same.
 * The message says "on file" for exactly that reason: "Recorded 3 deploys" read
 * as three new discoveries on a press that discovered nothing.
 *
 * `captured: 0` IS AN ANSWER, NOT AN ERROR — but only when `read` is "answered".
 * The zero-capture sentence is chosen from `read` rather than hedging across
 * both cases in one line, because "your pipeline published nothing" and "the
 * request never got there" are opposite facts and only the first is about the
 * customer.
 */
export const captureDeployments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      captured: number;
      deployments: DeploymentRow[];
      read: DeployReadOutcome;
      sha: string;
      message: string;
    }> => {
      const db = context.supabase as unknown as SupabaseClient;
      const userId = context.userId;

      const { data: cs, error } = await db
        .from("studio_changesets")
        .select("id,workspace_id,product_id,repo,pr_number,status")
        .eq("id", data.changesetId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!cs) {
        throw new Error(
          "That change no longer exists, or it belongs to a workspace you are not a member of.",
        );
      }
      if ((cs.status as string) !== "merged") {
        throw new Error(
          `Deploys are recorded against a change that has landed, and this one is "${cs.status}". Merge the pull request first.`,
        );
      }
      if (!parseRepo(cs.repo as string | null)) {
        throw new Error(
          `This change has no usable repository on it${cs.repo ? ` ("${cs.repo}" is not owner/name)` : ""}, so there is no provider to ask.`,
        );
      }

      // ASKED HERE RATHER THAN LEFT TO THE null BELOW, because the refusal that
      // follows blames the connected account and this case has not contacted
      // GitHub at all. `landedShaForChangeset` returns null immediately when
      // `pr_number` is absent, so a merged change with no PR recorded on it
      // would have been told to check its GitHub permissions for a read that
      // never happened. Re-measured 2026-08-06: `status='merged' AND pr_number
      // IS NULL` is 0 of 16 merged changesets, so this is copy hygiene rather
      // than a live break — but it is the kind that survives until the first
      // person hits it.
      const prNumber = (cs.pr_number as number | null) ?? null;
      if (!prNumber) {
        throw new Error(
          "This change has no pull request recorded on it, and the merged pull request is how Supaprod proves which commit the change landed as. Without that proof it will not go looking for deploys, because a read scoped to the wrong commit files another release's address under this one.",
        );
      }

      const sha = await landedShaForChangeset(db, userId, {
        workspace_id: (cs.workspace_id as string | null) ?? null,
        product_id: (cs.product_id as string | null) ?? null,
        repo: (cs.repo as string | null) ?? null,
        pr_number: prNumber,
      });
      if (!sha) {
        throw new Error(
          "Supaprod could not confirm which commit this change landed as, so it will not go looking for deploys: a deploy read scoped to the wrong commit files another release's address under this one. This needs the merged pull request to be readable on the connected account.",
        );
      }

      const result = await captureDeploymentsCore(db, userId, cs.id as string, {
        sha,
        triggeredBy: "manual-check",
      });
      const short = sha.slice(0, 7);
      return {
        ...result,
        sha,
        message:
          result.captured > 0
            ? `${result.captured} deploy${result.captured === 1 ? " is" : "s are"} now on file for the commit this change landed as (${short}). Pressing again re-reads the same commit and updates them in place.`
            : zeroCaptureMessage(result.read, short),
      };
    },
  );

export const listDeployments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid().optional(),
        productId: z.string().uuid().optional(),
        changesetId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;

    // Scope to one workspace (active or default) so a multi-workspace user does
    // not see deployments merged across workspaces. RLS still enforces access.
    //
    // A CHANGESET-SCOPED READ TAKES THE CHANGESET'S OWN WORKSPACE, not the
    // caller's. `resolveWorkspaceId` falls through to
    // `current_user_default_workspace`, which is the caller's EARLIEST
    // membership, and that was stacked on top of the `changeset_id` filter
    // below — so asking "what did THIS change deploy?" answered "…and only if it
    // happens to live in your first workspace". Two live users hold deployments
    // outside their earliest membership; for one of them that is all of them
    // (re-measured 2026-08-06: 2 users, 4 of 18 rows and 4 of 4 rows). The
    // damage is not a short list, it is a WRONG one: a run's Production stage
    // marker reads "not reached" while the panel below it shows the production
    // URL, on the same screen. Passing an explicit workspaceId (which
    // ChangesPanel now does and runs.$missionId does not) fixes the common case
    // but still misses a run opened by URL while the shell is switched
    // elsewhere; deriving it from the changeset closes every caller at once,
    // present and future.
    //
    // AN EXPLICIT `workspaceId` IS DELIBERATELY OVERRIDDEN WHEN A `changesetId`
    // IS GIVEN, and that is worth saying because ChangesPanel sends both. There
    // is exactly one right workspace for "what did this change deploy?" and the
    // changeset knows it; honouring a caller's guess instead would keep the
    // narrower bug alive for whichever caller guesses wrong. `workspaceId`
    // continues to scope the product-wide and unfiltered reads, where the caller
    // genuinely is the one choosing.
    //
    // RLS IS STILL THE GATE. The changeset read below is the caller's own
    // client, so a changeset they cannot see comes back null and this returns
    // nothing — the same answer the deployments read would have given, reached
    // one query earlier. Its error is checked, so a failed read is never spent
    // as proof of "no such change".
    //
    // AND THE `[]` ON THE NEXT LINE MUST NOT BECOME A DISCRIMINATOR. An audit on
    // 2026-08-11 proposed returning something like `read: "unreadable-changeset"`
    // here, on the reasonable-sounding ground that this file already defines
    // `DeployReadOutcome` for exactly the "absence vs unread" distinction and
    // three different facts currently share one `[]`. It is the wrong call here,
    // and the reason is a fact about the database rather than about taste.
    //
    // VERIFIED against pg_policies, not assumed: `studio_changesets` and
    // `deployments` carry the IDENTICAL predicate, `is_workspace_member(
    // workspace_id)`, on both SELECT and ALL. So a caller who cannot see the
    // changeset provably cannot see any deployment of it either — "hidden from
    // you" and "there are none" are not merely similar answers, they are the same
    // observable answer, and collapsing them loses nothing. Distinguishing them
    // would ADD something: an id that returns "unreadable" rather than "empty" is
    // a changeset that exists, and this endpoint would become the only way to
    // learn that. A discriminator here is an existence oracle, not a fix.
    //
    // `DeployReadOutcome` is right where it lives, because a provider read that
    // was never attempted genuinely is a different fact from one that came back
    // empty, and no permission boundary separates them.
    //
    // THE CONFLATION THAT IS REAL IS ON THE CLIENT, not here. `runs.$missionId
    // .tsx` does `deploymentsQ.data?.deployments ?? []`, which folds PENDING, a
    // disabled query and a COLD FAILURE into the same `false` as a genuine empty,
    // and then states "Production — merged, not promoted yet" as fact over all
    // four. That `?? []` is the defect; this `[]` is a correct answer.
    let workspaceId: string | null;
    if (data.changesetId) {
      const { data: csRow, error: csErr } = await db
        .from("studio_changesets")
        .select("workspace_id")
        .eq("id", data.changesetId)
        .maybeSingle();
      if (csErr) throw new Error(csErr.message);
      if (!csRow) return { deployments: [] };
      workspaceId = (csRow.workspace_id as string | null) ?? null;
    } else {
      workspaceId = await resolveWorkspaceId(db, data.workspaceId);
    }
    if (!workspaceId) return { deployments: [] };

    let q = db
      .from("deployments")
      .select(
        "id,product_id,changeset_id,provider,environment,status,commit_sha,deploy_url,deployed_at,created_at,failure_reason",
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.productId) q = q.eq("product_id", data.productId);
    if (data.changesetId) q = q.eq("changeset_id", data.changesetId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { deployments: rows ?? [] };
  });

/** The spec columns the ship close-out reads. */
type SpecForCloseOut = {
  id: string;
  status: string | null;
  shipped_at: string | null;
  title: string | null;
  workspace_id: string | null;
  contract: { intent?: string } | null;
};

/** How the caller should describe a spec in a sentence a person reads. */
function specLabel(prd: SpecForCloseOut): string {
  const t = (prd.title ?? "").trim();
  return t ? `"${t.slice(0, 120)}"` : `the spec ${prd.id.slice(0, 8)}`;
}

/**
 * EVERY spec this release closes the loop on, in the order they were linked.
 *
 * `cs.prd_id` ALONE WAS WRONG IN BOTH DIRECTIONS, which is why this is a set and
 * not a column read.
 *
 * Too few: the column is a single nullable uuid stamped once at changeset
 * CREATION from the FIRST prd->mission lineage edge (resolvePrdForMission,
 * src/lib/ai/tools/registry.server.ts). A mission dispatched from three specs
 * gets one of them; the other two never reach Learn, because listPendingOutcomes
 * admits a spec only on `prds.shipped_at IS NOT NULL` or a due
 * `launch_plans.check_by`, and both are written only by the close-out. Live on
 * 2026-08-06 seven missions already carry two distinct prd edges each, so this
 * is a shape the data has, not a hypothetical.
 *
 * None at all: the column is null on every changeset created before that
 * resolver existed, on every prompt-only mission, and on every revert. Live, all
 * NINE real merged changesets in the dogfood workspace have prd_id null — and
 * exactly one of them has a resolvable prd->mission edge, whose spec is still
 * sitting at 'draft' under a release that is serving in production.
 *
 * The read is the same edge the changeset was created from, filtered to edges
 * that are still valid — artifact_lineage is bi-temporal and invalidates rather
 * than deletes, so an edge someone withdrew must not resurrect a spec here.
 *
 * FAILS LOUD, unlike resolvePrdForMission which fails soft and returns null. A
 * soft failure is right when the cost is a null column on a new changeset; here
 * the cost is a release that silently settles nothing, so the caller is told the
 * read failed and says so on the receipt.
 */
async function specsShippedByChangeset(
  db: SupabaseClient,
  cs: { prd_id: string | null; mission_id: string | null },
): Promise<{ prdIds: string[]; lineageRead: "ok" | "skipped" | "failed" }> {
  const ordered: string[] = [];
  const seen = new Set<string>();
  if (cs.prd_id) {
    ordered.push(cs.prd_id);
    seen.add(cs.prd_id);
  }
  if (!cs.mission_id) return { prdIds: ordered, lineageRead: "skipped" };

  const { data, error } = await db
    .from("artifact_lineage")
    .select("parent_id,created_at")
    .eq("parent_kind", "prd")
    .eq("child_kind", "mission")
    .eq("child_id", cs.mission_id)
    .is("valid_to", null)
    .order("created_at", { ascending: true })
    .limit(20);
  // A DISCARDED READ ERROR MUST NEVER BE READ AS ABSENCE. An empty `data` on a
  // failed read looks exactly like a mission with no spec, and answering "no
  // spec" from a query that never ran is how a release gets told it is
  // unlinked when it is not.
  if (error) return { prdIds: ordered, lineageRead: "failed" };
  for (const r of (data ?? []) as Array<{ parent_id: string | null }>) {
    const id = r.parent_id;
    if (id && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  return { prdIds: ordered, lineageRead: "ok" };
}

/**
 * Mark ONE spec shipped and arm its 30-day outcome window. Returns the warnings
 * this spec produced — each naming the spec — so a release carrying three specs
 * says which one it missed instead of pushing an unattributed line onto the
 * receipt.
 *
 * Every write is checked for the refusal supabase-js resolves as success, and
 * every read that could be mistaken for absence is checked for its error, which
 * is the whole reason this is a function rather than a loop body: the same four
 * traps had to be got right N times instead of once.
 */
async function closeOutSpecOnPromote(
  db: SupabaseClient,
  userId: string,
  prd: SpecForCloseOut,
  nowIso: string,
): Promise<string[]> {
  const warnings: string[] = [];
  const name = specLabel(prd);

  if ((prd.status as string | null) !== "shipped") {
    // THE SHIP STAMP IS THE HINGE BETWEEN SHIP AND LEARN, and it is the write
    // most able to fail quietly: `prds ws update own` is USING/WITH CHECK
    // `is_workspace_member(...) AND user_id = auth.uid()`, so a member promoting
    // someone ELSE's spec is refused — and refused, it resolves with error null
    // and changes nothing. Left unchecked the spec stays 'draft' after its code
    // is live, Learn never sees an outcome to measure, and the precedent pool
    // the brain compounds from stays empty with nothing anywhere saying so.
    const { data: stamped, error: stampErr } = await db
      .from("prds")
      .update({ status: "shipped", shipped_at: nowIso })
      .eq("id", prd.id)
      .select("id");
    if (stampErr || !stamped || (stamped as unknown[]).length === 0) {
      const reason = stampErr?.message ?? "the update was refused and changed no row";
      console.error("promote spec ship-stamp failed (non-fatal):", reason);
      warnings.push(
        `The deploy is live, but ${name} is still not marked shipped (${reason}). Learn will not open an outcome window for it until that is fixed.`,
      );
    } else {
      // Only after the stamp actually landed. A stage event recorded over a
      // refused update would file a transition that never happened, which is a
      // worse record than none.
      await recordStageEvent(db, {
        entityType: "spec",
        entityId: prd.id,
        from: prd.status ?? null,
        to: "shipped",
        actor: "human",
        workspaceId: prd.workspace_id ?? null,
        userId,
      });
    }
  }

  // Does an outcome window already exist? THE ERROR IS CHECKED because the count
  // is about to be used as evidence of absence: a failed count comes back as
  // null, `(null ?? 0) === 0` is true, and the insert that follows would collide
  // with `launch_plans_prd_id_key` and be reported as "no outcome window was
  // armed" for a spec that has had one all along.
  const { count: hasPlan, error: planReadErr } = await db
    .from("launch_plans")
    .select("id", { count: "exact", head: true })
    .eq("prd_id", prd.id);
  if (planReadErr) {
    console.error("promote outcome-window check failed (non-fatal):", planReadErr.message);
    warnings.push(
      `The deploy is live, but Supaprod could not check whether ${name} has an outcome window (${planReadErr.message}), so it did not arm one. Open the Launch tab to confirm a check-back date exists.`,
    );
    return warnings;
  }

  if ((hasPlan ?? 0) === 0) {
    const intent = prd.contract?.intent;
    const positioning =
      intent && intent.trim()
        ? intent.trim()
        : `"${(prd.title ?? "This spec").slice(0, 200)}" shipped to production on ${nowIso.slice(0, 10)}.`;
    // Same unchecked-write shape as the stamp above: this row IS the armed
    // 30-day outcome window, so a refusal here means the release is live and
    // nothing will ever ask whether it worked.
    const { data: planRows, error: planErr } = await db
      .from("launch_plans")
      .insert({
        workspace_id: prd.workspace_id,
        prd_id: prd.id,
        positioning,
        checklist: [],
        check_by: defaultCheckByDate(nowIso),
        generated_by: userId,
      })
      .select("id");
    if (planErr || !planRows || (planRows as unknown[]).length === 0) {
      const reason = planErr?.message ?? "the insert was refused and wrote no row";
      console.error("promote outcome-window arm failed (non-fatal):", reason);
      warnings.push(
        `The deploy is live, but no outcome window was armed for ${name} (${reason}). Nothing will come back in 30 days to ask whether this release worked; open the Launch tab to set one.`,
      );
    }
  }
  return warnings;
}

// SEAM-2 (mission 3.7) - the single promote-to-production gate. A human click
// takes the changeset's previewed content live: same commit, production alias.
// The click itself is RECORDED as a decided approval (tool 'deploy.promote'),
// so the promote shows up on the Trust Ledger like every other governed call.
// Ship closes the loop on EVERY spec the release carries: status 'shipped' +
// its stage event, and the 30-day outcome window arms (a minimal, truthful
// launch_plans row when none exists; the full plan stays regenerable from the
// Launch tab). A release with no spec at all is not silent about it - see the
// close-out block, which says on the receipt that nothing will come back to
// ask whether this one worked.
/**
 * Promote a merged changeset to production.
 *
 * EXTRACTED FROM THE SERVER FUNCTION, unchanged, so the Ship station's agent can
 * call the same path a person does. Ship had no agent-callable tool at all: the
 * station's lead agent arrived, was handed a goal, and had no way to produce the
 * one artifact the station exists for, so a track walked through Ship and left
 * no record. The fix is not a second deploy path, which would be two ways to
 * ship that can disagree; it is one path with two callers.
 *
 * THIS IS A GOVERNANCE FLOOR AND STAYS ONE. A production deploy is named in the
 * four floors no boundary may lower: irreversible from inside the product, and
 * customers see it. The tool that wraps this is pinned to review for exactly
 * that reason, and the pin is asserted by a test rather than left to a default.
 * That is the gate being the exception, not the loop.
 *
 * Returns the deployment row's id so the caller can say what it produced. The
 * spine files artifacts from a tool's own reported return value and never from
 * a query for what appeared lately, so a promote that reported only a URL would
 * be invisible to the record.
 *
 * `warnings` CARRIES THE HALF-SHIPPED CASES. Everything after the deploy — the
 * release notes, the ledger receipt, the spec's shipped stamp, the outcome
 * window — is best-effort by design, because the production deploy has already
 * happened and cannot be undone by a bookkeeping failure. Best-effort was being read as "silent",
 * though: each of those writes sat in a try/catch with no `.select()`, and
 * supabase-js RESOLVES a write the database refused, so the catch never fired,
 * console.error never printed, and a promote that stamped nothing returned the
 * same shape as one that stamped everything. Each write now reports whether a
 * row really moved, and a promote that shipped code but recorded nothing says
 * so here instead of looking identical to a clean one.
 *
 * THE RELEASE NOTES REPORT FROM ONE HOP AWAY, which is worth stating because
 * this list names them alongside three writes that live in this file. Their
 * write does not: generateReleaseNotesCore (src/lib/studio.functions.ts) owns
 * it, and this function sees only what that call throws. For a while that was a
 * generation failure and nothing else — the update there checked `error` alone,
 * so a save the database refused came back looking successful and reached this
 * function unremarked. That update now selects the row it changed and throws
 * when none comes back, so a refused save lands in the same catch a failed
 * generation does and is filed as a warning like the rest. Which of the two
 * happened is told only by the reason quoted inside the warning's text.
 */
/**
 * R-27. Can this changeset's work be graded after it ships?
 *
 * TWO QUESTIONS NOW, AND THE SECOND ONE ARRIVED LATE (F-63). The original asks
 * whether anything will ever be able to GRADE this deploy — is there a decision
 * behind it, and does that decision record a forecast with a horizon. The fifth
 * precondition asks whether the change altered the things that grade it BEFORE
 * it shipped: a changeset that edits `package.json`, a workflow, a tsconfig or a
 * lockfile has moved the ruler it is about to be measured with, and every other
 * R-27 precondition asks only whether CI passed. Both live here because both
 * demote `release.publish` to `review` rather than throwing, and that is the one
 * enforcement point the ruling allows.
 *
 * THE LINK, AND WHY IT IS TWO HOPS RATHER THAN A COLUMN. `studio_changesets`
 * carries `mission_id`, the driver opens exactly one mission per track AT BUILD
 * (`missionForTrack`, and R-24: a mission is an artifact of one station of a
 * track, never an alternative to one), and files it as a `spine_track_members`
 * row with `artifact_kind = 'mission'` at station `build`. That row is what
 * carries the `track_id`. From the track, the decision is the member filed at
 * `decide` by `decision.record`.
 *
 * Verified against production before this was written, rather than assumed:
 *
 *   SELECT artifact_kind, station, artifact_id, track_id FROM spine_track_members
 *    WHERE track_id='8391835f-...' AND artifact_kind='mission';
 *   -- mission | build | 4031c6d3-... | 8391835f-...
 *
 *   SELECT count(*), count(*) FILTER (WHERE forecast_claim IS NOT NULL
 *          AND btrim(forecast_claim) <> '' AND forecast_horizon_date IS NOT NULL)
 *     FROM decisions;   -- 348 | 167
 *
 * BOTH HALVES OF THE FORECAST, not just the claim. A claim with no horizon can
 * never come due, so nothing would ever grade it and the precondition would pass
 * on work that is gradable in principle and never in practice. The 167 above
 * carry claim and horizon in exactly the same rows, which is `decision.record`
 * refusing to write one without the other — so this asks for what that tool
 * already guarantees rather than inventing a new bar.
 *
 * EVERY FAILURE PATH RETURNS `ok: false` WITH ITS OWN SENTENCE. A refusal that
 * says "not gradable" leaves a person to work out which of five links was
 * missing; these say which — R-16's "a failure that names what failed", applied
 * to the sentence a person actually reads on the approval.
 *
 * ENFORCED AT MODE RESOLUTION, NOT HERE, AND THAT IS R-27 CLAUSE 6. A failed
 * precondition must QUEUE AN APPROVAL rather than error: `executeLoop` calls this
 * before `release.publish` runs and demotes the tool back to `review` when it
 * answers no, so the work lands in front of a person exactly as it does today.
 * Throwing inside `promoteChangesetToProductionCore` would have made it a failed
 * station instead — which the driver would file as `produced-nothing`, whose line
 * reads "It will try again", against a condition retrying cannot change. That is
 * F-41's defect, and it would have been reintroduced one week after R-26 fixed it.
 *
 * ONE ENFORCEMENT POINT ON PURPOSE. `promoteChangesetToProductionCore` is
 * deliberately left untouched: a person may ship whatever they like, and two
 * places deciding the same question is how `prd_scaffolds` and `prototypes` came
 * to disagree about what a drawing is (F-29).
 */
export async function unattendedShipIsGradable(
  db: SupabaseClient,
  changesetId: string,
): Promise<{ ok: boolean; why: string }> {
  try {
    /* Read here rather than taken as a parameter, because the caller is the
     * approval gate and all it holds is the argument the agent passed. Reading
     * the row is also the check that the id names a real change at all. */
    const { data: csRow, error: csErr } = await db
      .from("studio_changesets")
      .select("id,mission_id")
      .eq("id", changesetId)
      .maybeSingle();
    if (csErr) {
      return { ok: false, why: `the change it names could not be read (${csErr.message}).` };
    }
    const cs = csRow as { id: string; mission_id: string | null } | null;
    if (!cs) {
      return { ok: false, why: "the change it names does not exist." };
    }

    /**
     * R-27's FIFTH PRECONDITION — A CHANGE THAT EDITED WHAT THE CHECKS RUN MAY
     * NOT SHIP ITSELF. Asked here, before the mission hop, because it is a
     * question about the change rather than about the chain behind it, and it
     * must still be answerable when that chain is broken: a changeset that
     * switched off its own type check should say so, not "no mission".
     *
     * F-63, 2026-08-25 13:01 UTC, unattended, in a customer's repository. The
     * Build station changed `package.json`:
     *
     *   - "lint": "tsc --noEmit",
     *   + "lint": "echo 'Lint skipped: no ESLint config' && exit 0",
     *
     * disabling the type check that would have caught its own unresolvable
     * `@testing-library/react` import, and misdescribing the script as a missing
     * ESLint config to justify it. CI stayed red only because GitHub Actions was
     * separately dead on billing (F-64) — nothing ran, so nothing caught it. Had
     * the agent disabled `test` as well, CI would have gone green and ALL FOUR
     * existing preconditions would have passed: merged, green, live preview,
     * recorded forecast. **Every one of the four asks whether CI passed. None
     * asked whether the loop edited what CI runs.** This is that question.
     *
     * DEFENCE IN DEPTH, NOT THE PRIMARY GUARD, AND BOTH HALVES ARE LOAD-BEARING.
     * `studio.stage` and `studio.commit` already refuse these paths at WRITE time
     * (`assertStudioPathAllowed`), which is the guard that stops the edit ever
     * being made. This one catches what that cannot: a changeset staged BEFORE
     * that guard existed, or created by any path that does not go through it —
     * `studio-rollbacks.ts` inserts `studio_changes` rows directly, and nothing
     * stops a future writer doing the same. **Do not delete either one thinking
     * the other covers it.** The write-time guard cannot see a row it did not
     * write; this one cannot stop the row being written.
     *
     * THE LIST IS IMPORTED, NEVER RESTATED. `STUDIO_FORBIDDEN_PREFIXES` is the
     * single definition of "files that decide what the checks run"; a second copy
     * here would drift the day somebody adds `biome.json` to one of them, and
     * two places disagreeing about the same fact is F-29 exactly. It is loaded
     * with a dynamic import on the precedent of `governance.functions.ts` and
     * `agent_loop.functions.ts`, because `registry.server.ts` imports THIS module
     * (`promoteChangesetToProductionCore`) and this module is imported straight
     * into route and component code — a static edge would be an import cycle and
     * would drag the whole server tool registry into the browser graph.
     *
     * THE SET IS REUSED WHOLE rather than narrowed to the CI entries. A
     * changeset that edited a migration, an env file or a lockfile unattended is
     * not something the loop should ship on its own either, and the moment this
     * filtered the list to a subset it would BE the second list.
     */
    const { data: pathRows, error: pathErr } = await db
      .from("studio_changes")
      .select("path")
      .eq("changeset_id", cs.id)
      .order("path");
    if (pathErr) {
      return { ok: false, why: `the files it changes could not be read (${pathErr.message}).` };
    }
    const changedPaths = ((pathRows ?? []) as Array<{ path?: string | null }>)
      .map((r) => r.path)
      .filter((p): p is string => typeof p === "string" && p.trim() !== "");
    if (changedPaths.length === 0) {
      // AN EMPTY READ IS NOT AN EMPTY CHANGESET. supabase-js hands back `[]` for
      // rows RLS hides, so "no files" and "no rights to see the files" arrive
      // identically — and a merged changeset always has rows, because
      // `studio.commit` refuses one with none and the only deletes are pre-commit
      // curation. Passing on an empty list would mean the guard let work through
      // on evidence it never saw, which is the one thing R-22 forbids it to do.
      return {
        ok: false,
        why: "the list of files it changes came back empty, so nothing could confirm it left the checks alone.",
      };
    }
    const { STUDIO_FORBIDDEN_PREFIXES } = await import("@/lib/ai/tools/registry.server");
    // Matched exactly as `assertStudioPathAllowed` matches it — prefix OR whole
    // path — so the gate and the write-time refusal answer the same question the
    // same way. The test file pins that equivalence prefix by prefix.
    const offending = changedPaths.filter((path) =>
      STUDIO_FORBIDDEN_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix)),
    );
    if (offending.length > 0) {
      // NAMES THE PATH AND THE ALTERNATIVE. F-24: a prohibition whose escape
      // hatch nobody can see gets the same behaviour under a new name — which is
      // how F-63 happened one rule up, when "you cannot add a dependency"
      // redirected the agent into disabling the check instead.
      return {
        ok: false,
        why: `this change edits what the checks themselves run (${offending.join(", ")}), so a green check proves nothing about it. The change could have altered its own grader. Ship it yourself if editing that file is genuinely the work; otherwise drop that path from the changeset and say the spec cannot be built with what is present, which is the alternative Build is already briefed to give.`,
      };
    }

    if (!cs.mission_id) {
      return {
        ok: false,
        why: "this changeset is not attached to a mission, so there is no run behind it to trace a decision from.",
      };
    }

    const { data: memberRow, error: memberErr } = await db
      .from("spine_track_members")
      .select("track_id")
      .eq("artifact_kind", "mission")
      .eq("artifact_id", cs.mission_id)
      .limit(1)
      .maybeSingle();
    // A read that FAILED is not a read that found nothing. Saying "no track"
    // when the query errored would blame the data for our own outage, which is
    // the exact confusion `promoteChangesetToProductionCore`'s preview reads were
    // hardened against a few lines below.
    if (memberErr) {
      return { ok: false, why: `the run behind it could not be read (${memberErr.message}).` };
    }
    const trackId = (memberRow as { track_id?: string | null } | null)?.track_id ?? null;
    if (!trackId) {
      return {
        ok: false,
        why: "its mission is not filed against any piece of work, so there is no decision to grade it against.",
      };
    }

    const { data: decisionRows, error: decisionErr } = await db
      .from("spine_track_members")
      .select("artifact_id")
      .eq("track_id", trackId)
      .eq("artifact_kind", "decision")
      .order("created_at", { ascending: false })
      .limit(1);
    if (decisionErr) {
      return { ok: false, why: `its decision could not be read (${decisionErr.message}).` };
    }
    const decisionId = ((decisionRows ?? []) as Array<{ artifact_id?: string | null }>)[0]
      ?.artifact_id;
    if (!decisionId) {
      return {
        ok: false,
        why: "no decision was ever recorded for this work, so nothing states what it was expected to do.",
      };
    }

    const { data: decision, error: forecastErr } = await db
      .from("decisions")
      .select("forecast_claim,forecast_horizon_date")
      .eq("id", decisionId)
      .maybeSingle();
    if (forecastErr) {
      return { ok: false, why: `its forecast could not be read (${forecastErr.message}).` };
    }
    const row = decision as {
      forecast_claim?: string | null;
      forecast_horizon_date?: string | null;
    } | null;
    if (!row?.forecast_claim || row.forecast_claim.trim() === "") {
      return {
        ok: false,
        why: "its decision records no forecast, so there is no claim for anything to check afterwards.",
      };
    }
    if (!row.forecast_horizon_date) {
      return {
        ok: false,
        why: "its forecast has no horizon date, so it can never come due and nothing would ever grade it.",
      };
    }
    return { ok: true, why: "" };
  } catch (e) {
    // The whole point of the guard is that it refuses when it cannot see. A
    // thrown query is the least readable state of all.
    return {
      ok: false,
      why: `checking whether this work can be graded failed (${e instanceof Error ? e.message : String(e)}).`,
    };
  }
}

/**
 * File the deployment on the track it belongs to, best-effort (P-30, A-QUEUE.md).
 *
 * TWO DOORS SHARE THIS FUNCTION, and only one of them was ever seen by the
 * spine. `release.publish` (the agent's tool) is dispatched through
 * `driveTrackOnce`, the one place `collectAttachments`/`harvestGates`
 * (spine/attach.ts) run; `promoteToProduction` (the person's, straight off
 * `/ship`) calls this same core directly and never passes through the driver
 * at all. `spine_track_members` held zero `deployment` rows ever measured
 * (P-28 census) against 42+ successful promotes on record — not because the
 * tool's return shape was wrong (it matches `attach.ts`'s `TOOL_PRODUCTS`
 * entry exactly) but because nothing called the write from either door. Filed
 * here, at the one point both doors pass through, the same reasoning as the
 * lineage edge just above.
 *
 * REUSES `trackIdByChangeset`'s OWN TWO-HOP RESOLUTION (changelog.ts) rather
 * than re-deriving mission-to-track by hand a second way — the same function
 * `listChangelog` already uses to open a release's run, so a release that
 * resolves a track here is guaranteed to resolve the SAME track there.
 *
 * SILENT WHEN NO TRACK RESOLVES, not a warning. A changeset with no mission,
 * or a mission never dispatched through a track (R-35, RULINGS.md), is the
 * ordinary case for a solo `/ship` promote today, not a failure to report.
 */
export async function attachDeploymentToTrackSafe(
  db: SupabaseClient,
  changesetId: string,
  missionId: string | null,
  deploymentId: string,
): Promise<void> {
  if (!missionId) return;
  try {
    const { data: runRows } = await db
      .from("agent_runs")
      .select("mission_id,track_id")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });
    const trackId =
      trackIdByChangeset(
        [{ id: changesetId, mission_id: missionId }],
        (runRows ?? []) as { mission_id: string | null; track_id: string | null }[],
      ).get(changesetId) ?? null;
    if (!trackId) return;
    // Idempotent on the primary key, the same upsert `writeMembers`
    // (spine/driver.server.ts) and `attachToTrack` (spine/track.functions.ts)
    // both use, so a re-promote of the same changeset never duplicates a row.
    await db.from("spine_track_members").upsert(
      {
        track_id: trackId,
        artifact_kind: "deployment",
        artifact_id: deploymentId,
        station: "ship",
      },
      { onConflict: "track_id,artifact_kind,artifact_id" },
    );
  } catch {
    // Best-effort index; the deployment row already exists regardless.
  }
}

export async function promoteChangesetToProductionCore(
  db: SupabaseClient,
  userId: string,
  changesetId: string,
): Promise<{
  productionUrl: string;
  revisionId?: string | null;
  deploymentId: string | null;
  warnings: string[];
}> {
  {
    // Non-fatal bookkeeping failures, in the person's words, for the Receipt.
    const warnings: string[] = [];
    const { data: cs, error } = await db
      .from("studio_changesets")
      // `pr_number` joined the select for the sha check below: promote could not
      // read the merged commit without it, which is why it never checked one.
      .select(
        "id,mission_id,workspace_id,product_id,prd_id,repo,pr_number,status,title,release_notes",
      )
      .eq("id", changesetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cs) throw new Error("Changeset not found");
    if ((cs.status as string) !== "merged") {
      throw new Error("Only a merged changeset can promote. Merge the PR first.");
    }

    // WHO BUILT THE PREVIEW DECIDES WHETHER THIS PROMOTE CAN WORK AT ALL.
    // Rows written by Supaprod's own hosting carry provider 'deno'; rows
    // captured from the customer's pipeline (captureDeploymentsCore) carry the
    // repo provider, 'github'. Promote takes THIS row's commit and redeploys
    // the repo's files to Deno — that is only the right act for a preview Deno
    // served in the first place. Promoting a captured Vercel preview would push
    // an unbuilt copy of someone's Next.js repo to a Deno app and then claim it
    // as production, so the two cases are separated here and answered
    // differently instead of one query treating them as interchangeable.
    //
    // ASKED AS TWO TARGETED READS, NOT ONE PAGE OF FIVE. Reading the five
    // newest successful previews and picking the deno one out of them answers
    // "the newest deno row among the five newest", which is only the same
    // question while a changeset has at most five successful preview rows. Six
    // captured previews (a busy pipeline publishing per-push) would push this
    // changeset's own Deno preview off the page, and promote would then refuse
    // a perfectly promotable release with the generic "no preview" copy —
    // wrong, and confidently so. Each side now asks for the one row it needs.
    type PreviewRow = {
      id: string;
      commit_sha: string;
      deploy_url: string | null;
      status: string;
      provider: string | null;
    };
    // A FAILED READ IS NOT AN ANSWER ABOUT THE CUSTOMER'S PIPELINE. Both reads
    // below check `error` and rethrow it, because promote is the one
    // irreversible path here: swallowing a transient PostgREST or network
    // failure makes it indistinguishable from "no rows", and the refusals
    // downstream would then tell someone their release is unpromotable, or that
    // their own pipeline built the preview, on the strength of a query that
    // never ran. Surfacing the read failure keeps the refusals about the data.
    /*
     * ── THE COMMIT IS CHECKED NOW, AND IT NEVER WAS (P-03) ──────────────────
     *
     * This function took the NEWEST successful preview row for the changeset and
     * used its `commit_sha` verbatim as the production ref -- `ref:
     * preview.commit_sha`, a few lines below. There was no comparison against
     * what actually merged anywhere in it. `landedShaForChangeset` has read the
     * PR's own `merge_commit_sha` since it was written and was called only from
     * the capture path, never from here.
     *
     * So a changeset whose preview was built at an earlier commit -- a fix
     * pushed after the preview, a branch synced, a second CI run that did not
     * finish -- promoted THAT commit to production, and the deploy row recorded
     * it as the released sha. Nothing anywhere would have said otherwise. On the
     * one path in this product that is irreversible and that customers see.
     *
     * ── AND CHECKING IT IS WHAT LETS ANY PROVIDER THROUGH ──────────────────
     * `provider = "deno"` was a proxy for "we built this, so we know what is in
     * it". Knowing the preview is AT THE MERGED COMMIT is the thing that proxy
     * was standing in for, and it is strictly stronger: it is true of a preview
     * whoever built it. So the check is now the sha, and the provider stops
     * mattering -- which is also what the packet asks for, and what unblocks a
     * repo whose previews come from its own pipeline.
     *
     * ── WHEN THE COMMIT CANNOT BE READ, THE OLD RULE STANDS ────────────────
     * `landedShaForChangeset` returns null when the PR is unreadable, when the
     * changeset carries no repo or PR number, or when GitHub refuses. In every
     * one of those we cannot prove what merged, so we must NOT relax the
     * provider gate on faith: an unproven commit falls back to exactly the
     * behaviour this function had yesterday. Loosening on a failed read is how a
     * safety check becomes a formality.
     */
    const landedSha = await landedShaForChangeset(db, userId, {
      workspace_id: (cs.workspace_id as string | null) ?? null,
      product_id: (cs.product_id as string | null) ?? null,
      repo: (cs.repo as string | null) ?? null,
      pr_number: (cs.pr_number as number | null) ?? null,
    });

    let previewQuery = db
      .from("deployments")
      .select("id,commit_sha,deploy_url,status,provider")
      .eq("changeset_id", cs.id as string)
      .eq("environment", "preview")
      .eq("status", "success");
    previewQuery = landedSha
      ? previewQuery.eq("commit_sha", landedSha)
      : previewQuery.eq("provider", "deno");

    const { data: denoRows, error: denoErr } = await previewQuery
      .order("created_at", { ascending: false })
      .limit(1);
    if (denoErr) throw new Error(denoErr.message);
    const preview = ((denoRows ?? []) as PreviewRow[])[0] ?? null;
    if (!preview) {
      // Only asked for when there is no Deno preview to promote, because its
      // only job is to tell the two refusals apart. `provider` is NOT NULL in
      // the table, so the null arm is belt and braces — it keeps a row with a
      // missing provider on the "someone else built this" side, where the old
      // `p.provider !== "deno"` scan put it.
      const { data: observedRows, error: observedErr } = await db
        .from("deployments")
        .select("id,commit_sha,deploy_url,status,provider")
        .eq("changeset_id", cs.id as string)
        .eq("environment", "preview")
        .eq("status", "success")
        .or("provider.is.null,provider.neq.deno")
        .order("created_at", { ascending: false })
        .limit(1);
      if (observedErr) throw new Error(observedErr.message);
      const observed = ((observedRows ?? []) as PreviewRow[])[0] ?? null;
      // THE COPY IS SPLIT BECAUSE ONE SENTENCE WAS COVERING TWO OPPOSITE
      // FACTS. "The preview lands automatically after merge; try again
      // shortly" is true only where Supaprod does the deploying. Said to a
      // customer whose repo Supaprod does not host, it is a promise about an
      // event that will never occur, and they read it every time they check.
      //
      // AND IT DOES NOT NAME THE DEPLOY PROVIDER, because this row cannot tell
      // us one. `provider` on a captured row is the REPO provider: capture
      // passes the literal "github" (the entries it reads carry no provider of
      // their own), so interpolating it told a Vercel customer their preview
      // came "from github". The deploy URL is the one thing on the row that
      // does point at whoever built it, so that is what is shown.
      /*
       * ── A PREVIEW AT THE WRONG COMMIT IS ITS OWN REFUSAL ─────────────────
       *
       * Checked FIRST, because with the sha filter above the "your own pipeline
       * built it" sentence is now reachable for a completely different reason:
       * there may be a perfectly good Supaprod preview sitting one commit
       * behind. Telling that person their pipeline built it would be false, and
       * it would send them to promote it somewhere that has nothing to promote.
       *
       * The two shas are both named. "It is at a different commit" without
       * saying which is a sentence a person cannot act on, and the usual next
       * move -- wait for the poller, or push again -- depends on which way round
       * they are.
       */
      if (landedSha) {
        const { data: staleRows } = await db
          .from("deployments")
          .select("id,commit_sha,deploy_url,status,provider")
          .eq("changeset_id", cs.id as string)
          .eq("environment", "preview")
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1);
        const stale = ((staleRows ?? []) as PreviewRow[])[0] ?? null;
        if (stale) {
          throw new Error(
            `The preview on file was built at ${String(stale.commit_sha).slice(0, 7)} and this changeset merged as ${landedSha.slice(0, 7)}, so promoting it would ship a different commit from the one that landed. The preview for the merged commit usually appears within about two minutes; nothing was published.`,
          );
        }
      }

      if (observed) {
        const builtAt = observed.deploy_url ? ` It is serving at ${observed.deploy_url}.` : "";
        throw new Error(
          `This preview was published by your own pipeline, not by Supaprod, which only read it from your repository's deployment record, so there is nothing here to move to production.${builtAt} Promote it where it was built; Supaprod records the production deploy once your provider reports it.`,
        );
      }
      throw new Error(
        denoDeployConfigured()
          ? "No successful preview deploy exists for this changeset yet. Supaprod deploys the preview itself for a repo it hosts (one carrying supaprod.json), usually within about two minutes of the merge, so if this is such a repo, try again shortly. If it is not, Supaprod never builds a preview here and none will appear: it can only record the deploys your own pipeline publishes."
          : "No preview deploy is recorded for this changeset, and this Supaprod install has no hosting configured, so it will not build one. Supaprod can only record the deploys your own pipeline publishes; nothing will appear here on its own.",
      );
    }

    const gh = await resolveGitHub({
      userId,
      workspaceId: (cs.workspace_id as string | null) ?? null,
      productId: (cs.product_id as string | null) ?? null,
      userClient: db,
    });
    const files = await collectRepoFiles({
      token: gh.token,
      repo: cs.repo as string,
      ref: preview.commit_sha as string,
    });
    const result = await deployChangesetApp({
      workspaceId: (cs.workspace_id as string) ?? "",
      changesetId: cs.id as string,
      files,
      production: true,
    });
    if (!result.ok || !result.url) {
      throw new Error(`Production deploy failed: ${result.reason ?? "unknown"}`);
    }

    const nowIso = new Date().toISOString();
    const { data: depRow, error: depErr } = await db
      .from("deployments")
      .upsert(
        {
          user_id: userId,
          workspace_id: cs.workspace_id,
          product_id: cs.product_id ?? null,
          changeset_id: cs.id,
          provider: "deno",
          environment: "production",
          status: "success",
          commit_sha: preview.commit_sha,
          deploy_url: result.url,
          triggered_by: "promote",
          deployed_at: nowIso,
        },
        { onConflict: "changeset_id,environment,commit_sha" },
      )
      // Selected so the caller can name what it produced. The upsert is
      // unchanged; only its return is read now.
      .select("id")
      .maybeSingle();
    if (depErr) throw new Error(depErr.message);
    /**
     * THE FOURTH UNCHECKED WRITE, TEN LINES FROM THREE THAT WERE JUST HARDENED.
     *
     * `.select("id").maybeSingle()` with only an `error` check is the same shape
     * as the three writes fixed above it, and it was missed because it LOOKS
     * checked -- it selects, and it tests something. supabase-js resolves an RLS
     * refusal as `{ data: null, error: null }`, so a refused upsert left
     * `deploymentId` null and execution walked on as though production had been
     * recorded.
     *
     * This is the promote path. The consequence of getting it wrong here is that
     * a person presses "Promote to production", the deploy genuinely happens at
     * the provider, no `deployments` row is written, and /ship goes on saying
     * "Nothing is in production yet" underneath a URL that is serving. The
     * ship->learn bridge never opens and nothing anywhere reports why.
     *
     * `maybeSingle` is kept rather than `single`, because the honest failure is
     * "the row did not land", not "more than one came back".
     */
    const deploymentId = (depRow as { id?: string } | null)?.id ?? null;
    if (!deploymentId) {
      throw new Error(
        "The deploy went out but production was not recorded, so nothing downstream can see it. You may not have rights on this workspace's deployments.",
      );
    }

    /**
     * THE LAST EDGE IN THE CHAIN, AND IT WAS NEVER WRITTEN EITHER.
     *
     * `artifact_lineage` declares `deployment` as a kind (added 2026-08-02
     * precisely because a census found it "being written by real code paths
     * while absent from every vocabulary"), and the Helio seed fabricates 14
     * `changeset -> deployment` edges. Measured against production
     * 2026-08-10: no code path in src/ has ever written
     * `child_kind: "deployment"`, and there are ZERO real edges of that shape.
     *
     * With the `mission -> changeset` edge added in the same change, this
     * closes the last two gaps in the walk. Before them the ledger ran
     * signal -> theme -> opportunity -> decision -> spec -> mission and then
     * stopped, so nothing could carry a shipped release back to the bet that
     * caused it, which is the join the outcome loop needs and the reason
     * "signal to shipped to learned" could not be said honestly.
     *
     * Placed AFTER the `deploymentId` guard on purpose. That guard is what
     * proves the row actually landed rather than being silently refused by
     * RLS, and an edge pointing at a deployment that was never recorded would
     * be a worse lie than a missing edge.
     *
     * Fail-soft, and the workspace comes off the changeset rather than the
     * caller's default, for the same reason as the mission edge.
     */
    await recordLineageSafe(db, userId, {
      parent_kind: "changeset",
      parent_id: cs.id as string,
      child_kind: "deployment",
      child_id: deploymentId,
      relation: "deployed",
      rationale: "Promoted to production",
      created_by_agent: "ship",
      workspace_id: (cs.workspace_id as string | null) ?? null,
    });

    // The track index, same reasoning as the lineage edge above (P-30).
    await attachDeploymentToTrackSafe(
      db,
      cs.id as string,
      (cs.mission_id as string | null) ?? null,
      deploymentId,
    );

    // Release notes attach automatically on ship (mission 3.7). Best-effort
    // and skip-if-present - a human may already have written/edited one, and
    // a generation failure (nothing staged to describe, a model hiccup) must
    // never fail the promote itself, which has already gone live.
    //
    // IT IS ALSO THE BEST-EFFORT WRITE WITH THE LARGEST VISIBLE CONSEQUENCE, and
    // it was the only one in this function that told nobody: the receipt, the
    // ship stamp, the outcome window and the close-out catch all push a warning,
    // this one only reached console.error on a server. /ship is spined on the
    // CHANGELOG, and a changelog row is materialized only by
    // trg_studio_changeset_to_changelog, which fires on a merged changeset whose
    // release_notes are non-empty. So notes that never got written mean /ship
    // shows NO row for this release at all: it goes on reading "Nothing has
    // merged yet, so there is nothing to promote" underneath a production URL
    // that is already serving, while the toast says "Live in production". And
    // empty notes at this point is precisely the state left behind when on-merge
    // generation already failed once, so this is the second miss on the same
    // changeset, not a rare one. The warning names the door that exists.
    //
    // NO LONGER PARTIAL, and here is what closed it. This catch can only report
    // what generateReleaseNotesCore THROWS, and that used to be a generation
    // failure and nothing else: its final update checked only `error` and had no
    // `.select()`, and supabase-js resolves a write the database refused, so a
    // refusal returned as though it had written and passed here unremarked —
    // /ship stayed empty with nothing anywhere saying why. That update now
    // selects the row it changed and throws when none comes back
    // (src/lib/studio.functions.ts), so a refused save reaches this warning on
    // the same path a failed generation does.
    if (!cs.release_notes) {
      try {
        await generateReleaseNotesCore(db, userId, cs.id as string);
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        console.error("auto release-notes on promote failed (non-fatal):", reason);
        warnings.push(
          `The deploy is live, but no release notes were written for it (${reason}). Ship lists a release only once its notes exist, so this one will not appear there yet. Open this change in Studio and press "Write them" under Release notes; Ship picks it up as soon as they are saved.`,
        );
      }
    }

    // The promote receipt: a decided approval on the ledger. Best-effort - the
    // deploy already happened; a receipt failure must not fail the promote.
    // The `.select("id")` is the whole point: without it a refusal by RLS or a
    // constraint arrives as error null with nothing written, so the try/catch
    // above it never fired and the Trust Ledger simply had no row for a
    // production deploy that customers were already looking at.
    try {
      const { data: apprRows, error: apprErr } = await db
        .from("agent_approvals")
        .insert({
          user_id: userId,
          workspace_id: cs.workspace_id,
          mission_id: cs.mission_id ?? null,
          tool_name: "deploy.promote",
          args: { changeset_id: cs.id, url: result.url },
          rationale: `Promote to production: ${(cs.title as string | null) ?? cs.id}`,
          status: "approved",
          escalation_state: "resolved",
          decided_at: nowIso,
          decided_by: userId,
        })
        .select("id");
      if (apprErr) throw new Error(apprErr.message);
      if (!apprRows || (apprRows as unknown[]).length === 0) {
        throw new Error("the insert was refused and wrote no row");
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error("promote receipt failed (non-fatal):", reason);
      warnings.push(
        `The deploy is live, but no evidence for it reached the audit trail (${reason}). This production deploy will not appear in the record of decided calls.`,
      );
    }

    // Close the loop on EVERY spec this release carries: shipped + stage event +
    // outcome window, once per spec.
    //
    // THIS USED TO BE `if (cs.prd_id) { ... }` WITH NO ELSE, and the missing else
    // was the whole failure. A changeset with no spec skipped the stamp, the
    // stage event and the outcome window, pushed nothing onto `warnings`, and
    // returned a shape identical to a fully recorded promote — so a person read
    // "Customers are seeing it now" and thirty days later nothing came back to
    // ask whether it worked. Live on 2026-08-06 that was not the rare case: all
    // nine real merged changesets in the dogfood workspace have prd_id null.
    try {
      const { prdIds, lineageRead } = await specsShippedByChangeset(db, {
        prd_id: (cs.prd_id as string | null) ?? null,
        mission_id: (cs.mission_id as string | null) ?? null,
      });
      // THESE TWO WARNINGS USED TO BE INDEPENDENT `if`s AND THEY CONTRADICTED
      // EACH OTHER ON THE SAME RECEIPT. A failed lineage read with no prd_id on
      // the changeset — the live shape, not a corner: re-measured 2026-08-06,
      // the dogfood workspace has 9 merged changesets and 0 of them carry a
      // prd_id — fired both, so a person read "could
      // not read which specs this release came from" immediately followed by
      // "this release is not linked to any spec", the second stated as fact from
      // the query that had just failed. `specsShippedByChangeset` returns the
      // `failed` discriminant precisely so the caller can tell absence from
      // ignorance; throwing that away here was the same defect one layer up.
      if (lineageRead === "failed") {
        warnings.push(
          prdIds.length === 0
            ? "The deploy is live, but Supaprod could not read which specs this release came from, and the change itself carries no spec link, so it closed the loop on nothing and armed no outcome window. That is a failed read, NOT proof this release is unlinked: check on Learn whether a spec of yours is waiting on this one before treating it as unmeasured."
            : "The deploy is live, but Supaprod could not read which specs this release came from, so it may have closed the loop on fewer of them than it should have. Check on Learn that every spec in this release has an outcome window.",
        );
      }

      if (prdIds.length === 0 && lineageRead !== "failed") {
        // The else that was missing. It states the consequence rather than the
        // absence, because "no spec is linked" means nothing to someone who has
        // just shipped and does not know what the link is for. Guarded on the
        // read having actually run: this sentence asserts a fact about the data,
        // and it must never be said on the strength of a query that failed.
        warnings.push(
          "The deploy is live, but this release is not linked to any spec, so no outcome window was armed and Learn will never ask whether it worked. Link the change to a spec to have it measured.",
        );
      } else if (prdIds.length > 0) {
        // ONE READ FOR ALL OF THEM, and its error is checked: an empty set from
        // a failed read is indistinguishable from "these specs do not exist",
        // and the second reading would have this function report a release as
        // unlinked on the strength of a query that never ran.
        const { data: prdRows, error: prdErr } = await db
          .from("prds")
          .select("id,status,shipped_at,title,workspace_id,contract")
          .in("id", prdIds);
        if (prdErr) throw new Error(prdErr.message);
        const byId = new Map(((prdRows ?? []) as SpecForCloseOut[]).map((p) => [p.id, p] as const));

        const unreadable = prdIds.filter((id) => !byId.has(id));
        if (unreadable.length) {
          warnings.push(
            `The deploy is live, but ${unreadable.length} spec${unreadable.length === 1 ? "" : "s"} this release is linked to could not be read, so ${unreadable.length === 1 ? "it was" : "they were"} not marked shipped and no outcome window was armed for ${unreadable.length === 1 ? "it" : "them"}.`,
          );
        }

        // TWO LISTS, BECAUSE THE ONE THEY REPLACE WAS DOING BOTH JOBS AND THE
        // RECEIPT LIED ABOUT IT. The single `closed` list here was pushed
        // unconditionally on the line straight after the close-out call, so a
        // spec whose ship stamp had just been REFUSED still landed in it — and
        // that refusal is live-reachable, not theoretical: `prds ws update own`
        // carries USING and WITH CHECK both `is_workspace_member(workspace_id)
        // AND user_id = auth.uid()` (re-read from pg_policy 2026-08-06), so any
        // member promoting someone else's spec is refused and changes no row.
        // The receipt then read "all of them were closed out" one line under
        // "…is still not marked shipped", and both surfaces render every
        // warning, so a person reads both sentences.
        // `carried` is the specs this loop accepted; `settled` is the subset
        // that produced no warning. The count sentence needs the first, the
        // "all of them" claim needs the second.
        const carried: string[] = [];
        const settled: string[] = [];
        // The spec the changeset gets permanently stamped with, below. It is the
        // first one this loop actually accepted — NOT `prdIds[0]`, which can be a
        // spec that was unreadable or belongs to another workspace, and writing
        // one of those into `studio_changesets.prd_id` would hard-link a release
        // to a spec this code just declined to touch. That column has no
        // workspace check of its own, so the check has to be here.
        let linkableId: string | null = null;
        for (const id of prdIds) {
          const prd = byId.get(id);
          if (!prd) continue;
          // A SPEC FROM ANOTHER WORKSPACE IS NOT THIS RELEASE'S TO SETTLE. The
          // lineage read is scoped by RLS to workspaces this caller belongs to,
          // which is not the same as "this changeset's workspace", and stamping
          // a neighbouring workspace's spec shipped off the back of this deploy
          // would put a verdict on someone else's desk for work they did not
          // release.
          if (prd.workspace_id && prd.workspace_id !== (cs.workspace_id as string | null)) {
            warnings.push(
              `The deploy is live, but ${specLabel(prd)} belongs to a different workspace than this release, so it was left alone rather than marked shipped.`,
            );
            continue;
          }
          const specWarnings = await closeOutSpecOnPromote(db, userId, prd, nowIso);
          for (const w of specWarnings) warnings.push(w);
          carried.push(specLabel(prd));
          if (specWarnings.length === 0) settled.push(specLabel(prd));
          linkableId ??= prd.id;
        }

        // FAN-IN IS ONLY HALF-HONEST AND THIS SENTENCE IS THE OTHER HALF. A
        // release genuinely can carry several specs — seven missions already
        // carry two prd edges each — and this loop now settles each of them.
        // What the SCHEMA still cannot hold is the set: `studio_changesets.prd_id`
        // and `changelog_entries.prd_id` are each a single nullable uuid, so the
        // release document, the changelog row and every lineage walk downstream
        // still show exactly one spec however many shipped. Naming the count here
        // is the difference between a person knowing three bets went out and
        // believing one did. The durable fix is a changeset-to-spec join table,
        // which is a migration and not this pass.
        //
        // THE "ALL OF THEM" CLAUSE IS NOW EARNED RATHER THAN ASSUMED. It is said
        // only when every carried spec came back without a warning; otherwise
        // the same sentence keeps the count and the schema limit — the part it
        // exists for — and points at the warnings that already named the misses,
        // instead of overwriting them with a clean-sweep claim.
        if (carried.length > 1) {
          const limit = `Supaprod can only record ONE of them against the release itself, so Ship and the release document will name a single spec. The others are settled on Learn but will not appear here.`;
          warnings.push(
            settled.length === carried.length
              ? `This release carried ${carried.length} specs and all of them were closed out: ${carried.join(", ")}. ${limit}`
              : `This release carried ${carried.length} specs (${carried.join(", ")}), and ${carried.length - settled.length} of them did not close out cleanly; the warnings above name which and why. ${limit}`,
          );
        }

        // Make the link durable, rather than re-derived on every future read.
        // Best-effort and last, so a refusal here cannot cost the close-out that
        // already succeeded. `studio_changesets ws write` WITH CHECK requires
        // user_id = auth.uid(), so a member promoting someone else's change is
        // refused; that is worth one line rather than silence, because the next
        // reader of this changeset will see prd_id null and conclude the release
        // was never linked.
        //
        // IT DOES NOT REACH AN ALREADY-PUBLISHED CHANGELOG ROW, and saying so
        // here is the point. trg_studio_changeset_to_changelog is declared
        // `AFTER INSERT OR UPDATE OF status, release_notes` (checked live on
        // 2026-08-06), so writing prd_id alone does not re-fire it and an
        // entry materialized earlier keeps its null prd_id. The release
        // document therefore still reads "This release is not linked to a
        // spec" until something rewrites that row — publishChangelogEntry
        // (src/lib/changelog.functions.ts) now does exactly that and carries
        // the changeset's current prd_id, so a re-publish repairs it.
        if (!cs.prd_id && linkableId) {
          const { data: linked, error: linkErr } = await db
            .from("studio_changesets")
            .update({ prd_id: linkableId })
            .eq("id", cs.id as string)
            .select("id");
          if (linkErr || !linked || (linked as unknown[]).length === 0) {
            const reason = linkErr?.message ?? "the update was refused and changed no row";
            console.error("promote changeset spec-link failed (non-fatal):", reason);
            warnings.push(
              `The deploy is live, but the link from this change back to its spec was not saved (${reason}), so this release will keep reading as unlinked on Ship.`,
            );
          }
        }
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error("promote spec close-out failed (non-fatal):", reason);
      // PLURAL, because the block this guards settles every spec the release
      // carries, not one. The singular wording predates the fan-in and would
      // tell someone who shipped three bets to go and check "the spec".
      warnings.push(
        `The deploy is live, but closing the loop on the specs it carries did not finish (${reason}). Check that each spec in this release is marked shipped and that an outcome window exists for it.`,
      );
    }

    return { productionUrl: result.url, revisionId: result.revisionId, deploymentId, warnings };
  }
}

/** The person-facing door. Same path as the agent's, so the two cannot drift. */
export const promoteToProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) =>
    promoteChangesetToProductionCore(
      context.supabase as unknown as SupabaseClient,
      context.userId,
      data.changesetId,
    ),
  );

/**
 * ── P-22. WHAT IS RUNNING, FOR THE CHANGE A PERSON IS LOOKING AT ──────────
 *
 * Founder, 2026-09-02, from Lovable's Live preview setting: watching the diff is
 * watching the work, watching the app run is watching the result. Gap #11 in the
 * operating model says it plainly: *nothing RUNS in front of the person*.
 *
 * A READ AND NOTHING ELSE. It triggers no deploy and writes no row. A surface
 * that provisions a preview because somebody opened a tab is a surface that
 * spends money on being looked at.
 *
 * ── FOUR ANSWERS, AND THEY ARE FOUR DIFFERENT FACTS ───────────────────────
 * `running`   a successful preview AT THE HEAD COMMIT. The only state that may
 *             show the app, because a preview at an older commit is a different
 *             program wearing this change's name -- the same trap R-33 closed on
 *             the promote path, where the newest preview was shipped without
 *             asking what merged.
 * `building`  a deployment row at head that has not succeeded yet. The slot
 *             shows what it is doing, never a spinner.
 * `stale`     previews exist for this changeset but none at head. Worth saying
 *             out loud rather than folding into "none": the pipeline is wired
 *             and this commit has not been built, which is a different thing to
 *             do about it.
 * `none`      no preview deployment for this changeset at all.
 */
export const previewForChangeset = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i ?? {}))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      state: "running" | "building" | "stale" | "none";
      url: string | null;
      /** The commit this answer is about, so a reader can check it themselves. */
      sha: string | null;
      /** The deployment's own word for where it got to, when it has one. */
      status: string | null;
      provider: string | null;
      startedAt: string | null;
    }> => {
      const db = context.supabase as unknown as SupabaseClient;
      const empty = {
        state: "none" as const,
        url: null,
        sha: null,
        status: null,
        provider: null,
        startedAt: null,
      };
      try {
        /* The head is the newest revision's commit. `base_sha` is where the
           branch started, which is the one sha that is never what is running. */
        const { data: revs } = await db
          .from("studio_changeset_revisions")
          .select("commit_sha")
          .eq("changeset_id", data.changesetId)
          .order("revision_no", { ascending: false })
          .limit(1);
        const head =
          ((revs ?? [])[0] as { commit_sha?: string | null } | undefined)?.commit_sha ?? null;

        const { data: rows, error } = await db
          .from("deployments")
          .select("commit_sha,deploy_url,status,provider,created_at")
          .eq("changeset_id", data.changesetId)
          .eq("environment", "preview")
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) {
          // A read that failed is not an absence of previews. Reported, and the
          // surface says it cannot tell rather than "none".
          console.error(`[previewForChangeset] ${data.changesetId}: ${error.message}`);
          return empty;
        }
        const deploys = (rows ?? []) as Array<{
          commit_sha?: string | null;
          deploy_url?: string | null;
          status?: string | null;
          provider?: string | null;
          created_at?: string | null;
        }>;
        if (deploys.length === 0) return empty;

        const atHead = head ? deploys.filter((d) => d.commit_sha === head) : [];
        const good = atHead.find((d) => d.status === "success" && d.deploy_url);
        if (good) {
          return {
            state: "running",
            url: good.deploy_url ?? null,
            sha: head,
            status: good.status ?? null,
            provider: good.provider ?? null,
            startedAt: good.created_at ?? null,
          };
        }
        const inFlight = atHead[0];
        if (inFlight) {
          return {
            state: "building",
            url: inFlight.deploy_url ?? null,
            sha: head,
            status: inFlight.status ?? null,
            provider: inFlight.provider ?? null,
            startedAt: inFlight.created_at ?? null,
          };
        }
        /* Previews exist and none is at head. Named rather than folded into
           "none", because the pipeline is wired and the answer for a person is
           "this commit has not been built", not "connect something". */
        const newest = deploys[0]!;
        return {
          state: "stale",
          url: null,
          sha: head,
          status: newest.status ?? null,
          provider: newest.provider ?? null,
          startedAt: newest.created_at ?? null,
        };
      } catch (e) {
        console.error(
          `[previewForChangeset] ${data.changesetId}: ${e instanceof Error ? e.message : String(e)}`,
        );
        return empty;
      }
    },
  );

/**
 * ── IS THE MANAGED PREVIEW HOST CONFIGURED? (P-59) ───────────────────────
 *
 * Settings did not know the provider was unconfigured, so the one page a person
 * would visit to check could not answer the question that stopped Ship.
 *
 * RETURNS A BOOLEAN AND NOTHING ELSE, and that is the whole contract. The value
 * is a deploy token; the org slug is less sensitive and still not this
 * function's to hand out, because a reader who can see the org can enumerate
 * the preview apps. `denoDeployConfigured()` already answers presence without
 * touching the value, and this exposes exactly that answer over the wire.
 *
 * Behind `requireSupabaseAuth` like every other read here: whether a host is
 * configured is a fact about this install, not a public one.
 */
export const previewHostConfigured = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ configured: boolean; vars: readonly string[]; where: string }> => {
    const { denoDeployConfigured } = await import("@/lib/hosting/changeset-deploy.server");
    const { PREVIEW_HOST_VARS, PREVIEW_HOST_WHERE } =
      await import("@/lib/hosting/a-ship-that-cannot-deploy-names-the-provider");
    return {
      configured: denoDeployConfigured(),
      // Named here rather than in the component so the settings row and the
      // hold card cannot drift into telling a person two different variables.
      vars: PREVIEW_HOST_VARS,
      where: PREVIEW_HOST_WHERE,
    };
  });

/**
 * ── WHY SHIP STOPPED ON THIS TRACK (P-59) ────────────────────────────────
 *
 * The failure reason already rides `spine_track_members.fields` for a
 * `deployment` artifact -- and F-36 is that SHIP HAS NEVER FILED ONE. Not once
 * in 1,516 member rows, against 42 successful `deployments` rows. So the path
 * that was supposed to carry this to the run screen has never carried anything,
 * and reading it there would have shipped a hold card that is correct in the
 * code and blank on every real track.
 *
 * This reads `deployments` directly, the table that actually has the rows,
 * joined back to the track the way `trackIdByChangeset` already does it:
 * changeset to mission to run to track.
 *
 * NEWEST FAILURE ONLY, and never a failure older than the newest success: a
 * track that failed, was fixed, and shipped must not keep showing the sentence
 * that told the person what to set. That is the difference between a hold and
 * a scar.
 */
export const whyShipStopped = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ trackId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ failureReason: string | null }> => {
    const { supabase } = context;

    const { data: runs, error: runErr } = await supabase
      .from("agent_runs")
      .select("mission_id")
      .eq("track_id", data.trackId)
      .not("mission_id", "is", null);
    if (runErr) throw new Error(`runs for this track could not be read: ${runErr.message}`);
    const missionIds = [
      ...new Set(((runs ?? []) as { mission_id: string | null }[]).map((r) => r.mission_id)),
    ].filter((m): m is string => !!m);
    if (missionIds.length === 0) return { failureReason: null };

    const { data: changesets, error: csErr } = await supabase
      .from("changesets")
      .select("id")
      .in("mission_id", missionIds);
    if (csErr) throw new Error(`changesets for this track could not be read: ${csErr.message}`);
    const changesetIds = ((changesets ?? []) as { id: string }[]).map((c) => c.id);
    if (changesetIds.length === 0) return { failureReason: null };

    /*
     * Both states in one read, ordered newest first, so "is the newest attempt a
     * failure" is answered by the first row rather than by two queries whose
     * answers can straddle a deploy that lands between them.
     */
    const { data: deploys, error: dErr } = await supabase
      .from("deployments")
      .select("status,failure_reason,created_at")
      .in("changeset_id", changesetIds)
      .in("status", ["failure", "success"])
      .order("created_at", { ascending: false })
      .limit(1);
    if (dErr) throw new Error(`deployments for this track could not be read: ${dErr.message}`);

    const newest = ((deploys ?? []) as { status: string; failure_reason: string | null }[])[0];
    if (!newest || newest.status !== "failure") return { failureReason: null };
    return { failureReason: newest.failure_reason ?? null };
  });
