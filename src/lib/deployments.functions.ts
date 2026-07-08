import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveProviderAuth } from "@/lib/connectors/resolve.server";
import { repoProviderFor, type RepoRef } from "@/lib/connectors/repo-provider";
import { deploymentRowsFor } from "@/lib/deployments";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { collectRepoFiles, deployChangesetApp } from "@/lib/hosting/changeset-deploy.server";
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

export const captureDeployments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;

    const { data: cs, error } = await db
      .from("studio_changesets")
      .select("id,workspace_id,product_id,repo,base_sha")
      .eq("id", data.changesetId)
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
    const sha = (cs.base_sha as string | null) ?? undefined;
    let entries;
    try {
      entries = await provider.readDeployments(repoRef, sha);
    } catch (e) {
      console.error("readDeployments failed (non-fatal):", e);
      return { captured: 0, deployments: [] };
    }
    if (!entries.length) return { captured: 0, deployments: [] };

    const rows = deploymentRowsFor({
      entries,
      userId,
      workspaceId: cs.workspace_id as string,
      productId: (cs.product_id as string | null) ?? null,
      changesetId: cs.id as string,
      provider: "github",
    });
    const { error: upErr } = await db
      .from("deployments")
      .upsert(rows, { onConflict: "changeset_id,environment,commit_sha" });
    if (upErr) throw new Error(upErr.message);

    return { captured: rows.length, deployments: rows };
  });

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
export const promoteToProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;

    const { data: cs, error } = await db
      .from("studio_changesets")
      .select("id,mission_id,workspace_id,product_id,prd_id,repo,status,title,release_notes")
      .eq("id", data.changesetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cs) throw new Error("Changeset not found");
    if ((cs.status as string) !== "merged") {
      throw new Error("Only a merged changeset can promote. Merge the PR first.");
    }

    const { data: preview } = await db
      .from("deployments")
      .select("id,commit_sha,deploy_url,status")
      .eq("changeset_id", cs.id as string)
      .eq("environment", "preview")
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!preview) {
      throw new Error(
        "No successful preview deploy exists for this changeset yet. The preview lands automatically after merge; try again shortly.",
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
    const { error: depErr } = await db.from("deployments").upsert(
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
    );
    if (depErr) throw new Error(depErr.message);

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
    try {
      await db.from("agent_approvals").insert({
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
      });
    } catch (e) {
      console.error("promote receipt failed (non-fatal):", e);
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
          await db
            .from("prds")
            .update({ status: "shipped", shipped_at: nowIso })
            .eq("id", prd.id as string);
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
          await db.from("launch_plans").insert({
            workspace_id: prd?.workspace_id ?? cs.workspace_id,
            prd_id: cs.prd_id,
            positioning,
            checklist: [],
            check_by: defaultCheckByDate(nowIso),
            generated_by: userId,
          });
        }
      } catch (e) {
        console.error("promote spec close-out failed (non-fatal):", e);
      }
    }

    return { productionUrl: result.url, revisionId: result.revisionId };
  });
