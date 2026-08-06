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
import { defaultCheckByDate } from "@/lib/launch-plan.functions";
import { generateReleaseNotesCore } from "@/lib/studio.functions";

// Resolve the workspace to scope a read to (the active one, else the caller's
// default). Mirrors the local helper in billing/briefs/audio.functions.ts.
async function resolveWorkspaceId(
  supabase: SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return (data as string | null) ?? null;
}

// BYO-P3 WI1 — Deploy capture server functions.
// captureDeployments reads the provider's deployment state (provider-agnostic,
// via RepoProvider.readDeployments) and persists it; listDeployments reads it
// back for the outcome surface. Deploys are OPTIONAL signal — a missing
// connection or a provider hiccup yields zero captures, never a thrown error,
// so the outcome view degrades gracefully. New tables aren't in the generated
// Supabase types yet (same untyped-client cast as F-V5-LOOP-CLOSE).

/** Parse a stored "owner/repo" into a RepoRef; null when malformed. */
function parseRepo(repo: string | null | undefined): RepoRef | null {
  const m = (repo ?? "").trim().match(/^([^/\s]+)\/([^/\s]+)$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

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
 * for exactly those changesets; the server function below stays the in-app door
 * onto the same path, so the two cannot drift.
 *
 * `sha` SCOPES THE READ AND MUST BE A COMMIT THIS CHANGESET ACTUALLY PRODUCED.
 * GitHub's deployments list is repo-wide and reverse-chronological: asked with
 * no sha it answers with the ten most recent deployments regardless of which
 * change made them, and every row written here is filed under THIS
 * changeset_id. That is not a cosmetic mistake — /ship offers a promote over a
 * changeset's newest successful preview and `promoteChangesetToProductionCore`
 * then deploys that row's `commit_sha`, so one mis-attributed row is a button
 * that ships a commit its owner never wrote. A caller passes a sha it can
 * prove, or captures nothing. The default stays the changeset's `base_sha`
 * (the commit it was staged FROM) purely to leave the existing door's behaviour
 * untouched.
 */
export async function captureDeploymentsCore(
  db: SupabaseClient,
  userId: string,
  changesetId: string,
  opts?: { sha?: string | null; triggeredBy?: string | null },
): Promise<{ captured: number; deployments: DeploymentRow[] }> {
  const { data: cs, error } = await db
    .from("studio_changesets")
    .select("id,workspace_id,product_id,repo,base_sha")
    .eq("id", changesetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!cs) throw new Error("Changeset not found");

  const repoRef = parseRepo(cs.repo as string | null);
  if (!repoRef) return { captured: 0, deployments: [] };

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
    return { captured: 0, deployments: [] };
  }

  const provider = repoProviderFor("github", resolved.auth.token, repoRef);
  const sha = opts?.sha ?? (cs.base_sha as string | null) ?? undefined;
  let entries;
  try {
    entries = await provider.readDeployments(repoRef, sha);
  } catch (e) {
    console.error("readDeployments failed (non-fatal):", e);
    return { captured: 0, deployments: [] };
  }
  if (!entries.length) return { captured: 0, deployments: [] };

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

  return { captured: (upRows as unknown[]).length, deployments: rows };
}

/** The in-app door. Same path as the cron's, so the two cannot drift. */
export const captureDeployments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) =>
    captureDeploymentsCore(
      context.supabase as unknown as SupabaseClient,
      context.userId,
      data.changesetId,
    ),
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
    const workspaceId = await resolveWorkspaceId(db, data.workspaceId);
    if (!workspaceId) return { deployments: [] };

    let q = db
      .from("deployments")
      .select(
        "id,product_id,changeset_id,provider,environment,status,commit_sha,deploy_url,deployed_at,created_at",
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

// SEAM-2 (mission 3.7) - the single promote-to-production gate. A human click
// takes the changeset's previewed content live: same commit, production alias.
// The click itself is RECORDED as a decided approval (tool 'deploy.promote'),
// so the promote shows up on the Trust Ledger like every other governed call.
// Ship closes the loop on the spec: status 'shipped' + its stage event, and
// the 30-day outcome window arms (a minimal, truthful launch_plans row when
// none exists; the full plan stays regenerable from the Launch tab).
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
 * ledger receipt, the spec's shipped stamp, the outcome window — is best-effort
 * by design, because the production deploy has already happened and cannot be
 * undone by a bookkeeping failure. Best-effort was being read as "silent",
 * though: each of those writes sat in a try/catch with no `.select()`, and
 * supabase-js RESOLVES a write the database refused, so the catch never fired,
 * console.error never printed, and a promote that stamped nothing returned the
 * same shape as one that stamped everything. Each write now reports whether a
 * row really moved, and a promote that shipped code but recorded nothing says
 * so here instead of looking identical to a clean one.
 */
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
      .select("id,mission_id,workspace_id,product_id,prd_id,repo,status,title,release_notes")
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
    const { data: denoRows } = await db
      .from("deployments")
      .select("id,commit_sha,deploy_url,status,provider")
      .eq("changeset_id", cs.id as string)
      .eq("environment", "preview")
      .eq("status", "success")
      .eq("provider", "deno")
      .order("created_at", { ascending: false })
      .limit(1);
    const preview = ((denoRows ?? []) as PreviewRow[])[0] ?? null;
    if (!preview) {
      // Only asked for when there is no Deno preview to promote, because its
      // only job is to tell the two refusals apart. `provider` is NOT NULL in
      // the table, so the null arm is belt and braces — it keeps a row with a
      // missing provider on the "someone else built this" side, where the old
      // `p.provider !== "deno"` scan put it.
      const { data: observedRows } = await db
        .from("deployments")
        .select("id,commit_sha,deploy_url,status,provider")
        .eq("changeset_id", cs.id as string)
        .eq("environment", "preview")
        .eq("status", "success")
        .or("provider.is.null,provider.neq.deno")
        .order("created_at", { ascending: false })
        .limit(1);
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
      if (observed) {
        const builtAt = observed.deploy_url ? ` It is serving at ${observed.deploy_url}.` : "";
        throw new Error(
          `This preview was published by your own pipeline, not by Supaprod — Supaprod only read it from your repository's deployment record — so there is nothing here to move to production.${builtAt} Promote it where it was built; Supaprod records the production deploy once your provider reports it.`,
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

    // Release notes attach automatically on ship (mission 3.7). Best-effort
    // and skip-if-present - a human may already have written/edited one, and
    // a generation failure (nothing staged to describe, a model hiccup) must
    // never fail the promote itself, which has already gone live.
    if (!cs.release_notes) {
      try {
        await generateReleaseNotesCore(db, userId, cs.id as string);
      } catch (e) {
        console.error("auto release-notes on promote failed (non-fatal):", e);
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
        `The deploy is live, but no receipt for it reached the Trust Ledger (${reason}). This production deploy will not appear in the record of decided calls.`,
      );
    }

    // Close the loop on the spec: shipped + stage event + outcome window.
    if (cs.prd_id) {
      try {
        const { data: prd } = await db
          .from("prds")
          .select("id,status,shipped_at,title,workspace_id,contract")
          .eq("id", cs.prd_id as string)
          .maybeSingle();
        if (prd && (prd.status as string) !== "shipped") {
          // THE SHIP STAMP IS THE HINGE BETWEEN SHIP AND LEARN, and it was the
          // write most able to fail quietly: the read above proves only that
          // the caller can SELECT this spec, while the update needs a separate
          // policy to pass. Refused, it resolved with error null and changed
          // nothing, so the spec stayed 'draft' after its code was live,
          // /learn never saw an outcome to measure, and the precedent pool the
          // brain compounds from stayed empty with nothing anywhere saying so.
          const { data: stamped, error: stampErr } = await db
            .from("prds")
            .update({ status: "shipped", shipped_at: nowIso })
            .eq("id", prd.id as string)
            .select("id");
          if (stampErr || !stamped || (stamped as unknown[]).length === 0) {
            const reason = stampErr?.message ?? "the update was refused and changed no row";
            console.error("promote spec ship-stamp failed (non-fatal):", reason);
            warnings.push(
              `The deploy is live, but the spec behind it is still not marked shipped (${reason}). Learn will not open an outcome window for this release until that is fixed.`,
            );
          } else {
            // Only after the stamp actually landed. A stage event recorded over
            // a refused update would file a transition that never happened,
            // which is a worse record than none.
            await recordStageEvent(db, {
              entityType: "spec",
              entityId: prd.id as string,
              from: (prd.status as string | null) ?? null,
              to: "shipped",
              actor: "human",
              workspaceId: (prd.workspace_id as string | null) ?? null,
              userId,
            });
          }
        }
        const { count: hasPlan } = await db
          .from("launch_plans")
          .select("id", { count: "exact", head: true })
          .eq("prd_id", cs.prd_id as string);
        if ((hasPlan ?? 0) === 0) {
          const intent = (prd as { contract?: { intent?: string } | null } | null)?.contract
            ?.intent;
          const positioning =
            intent && intent.trim()
              ? intent.trim()
              : `"${((prd?.title as string | null) ?? "This spec").slice(0, 200)}" shipped to production on ${nowIso.slice(0, 10)}.`;
          // Same unchecked-write shape as the two above: this row IS the armed
          // 30-day outcome window, so a refusal here means the release is live
          // and nothing will ever ask whether it worked.
          const { data: planRows, error: planErr } = await db
            .from("launch_plans")
            .insert({
              workspace_id: prd?.workspace_id ?? cs.workspace_id,
              prd_id: cs.prd_id,
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
              `The deploy is live, but no outcome window was armed for it (${reason}). Nothing will come back in 30 days to ask whether this release worked; open the Launch tab to set one.`,
            );
          }
        }
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        console.error("promote spec close-out failed (non-fatal):", reason);
        warnings.push(
          `The deploy is live, but closing the loop on its spec did not finish (${reason}). Check that the spec is marked shipped and that an outcome window exists.`,
        );
      }
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
