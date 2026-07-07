// W5a: New-build primitives, provision a starter repo for a spec (PRD).
//
// provisionRepoForSpec loads the spec, resolves GitHub auth through the SAME
// path createRepoForProduct uses (provisionGithubRepo in
// src/lib/connectors/product-binding.functions.ts), creates the repo in the
// user's own account, pushes the Cadence starter template as the initial
// commit (RepoProvider.bootstrapRepo, createRepo uses auto_init:false, so a
// fresh repo has no branch and no commit), auto-binds the repo to the spec's
// product when one is linked, and returns the ref. Provisioning is not a
// stage change, so no stage_events row is written.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { provisionGithubRepo } from "@/lib/connectors/product-binding.functions";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { renderStarterTemplate, repoNameFromTitle } from "@/lib/build/template";
import { classifyRepoResolution, type RepoDispatchCheck } from "@/lib/build/repo-gate";

export type ProvisionedSpecRepo = {
  owner: string;
  repo: string;
  htmlUrl: string;
  defaultBranch: string;
};

const DEFAULT_BRANCH = "main";

/**
 * W5b pre-check: can a Build dispatch resolve a repo right now? Runs the SAME
 * resolution the dispatch path relies on (resolveGitHub: workspace binding,
 * then user connection + env repo, then env; resolveGitHub takes no product,
 * so neither does the check) in a try/catch and reports the verdict instead
 * of throwing. Read-only; no behavior change to dispatch itself. Workspace
 * resolution mirrors dispatchStudioSession: the spec's workspace when a spec
 * is in hand, else the caller's default workspace.
 */
export const canDispatchToRepo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        prdId: z.string().uuid().optional(),
        workspaceId: z.string().uuid().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<RepoDispatchCheck> => {
    const db = context.supabase as unknown as SupabaseClient;

    let workspaceId: string | null = data.workspaceId ?? null;
    if (data.prdId) {
      const { data: row } = await db
        .from("prds")
        .select("id,workspace_id")
        .eq("id", data.prdId)
        .maybeSingle();
      workspaceId = (row as { workspace_id: string | null } | null)?.workspace_id ?? workspaceId;
    }
    if (!workspaceId) {
      const { data: ws } = await db.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }

    return classifyRepoResolution(() =>
      resolveGitHub({ userId: context.userId, workspaceId, userClient: db }),
    );
  });

export const provisionRepoForSpec = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        prdId: z.string().uuid(),
        name: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-zA-Z0-9._-]+$/, "Repo name can only contain letters, numbers, ., _, -")
          .optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;

    // Load the spec (caller's RLS client scopes access).
    const { data: prdRow, error } = await db
      .from("prds")
      .select("id,title,product_id,workspace_id")
      .eq("id", data.prdId)
      .single();
    if (error) throw new Error(`Spec lookup failed: ${error.message}`);
    const spec = prdRow as unknown as {
      id: string;
      title: string;
      product_id: string | null;
      workspace_id: string | null;
    };

    // Product name for the template, the linked product when there is one,
    // otherwise the spec title stands in.
    let productName = spec.title;
    if (spec.product_id) {
      const { data: product } = await db
        .from("projects")
        .select("id,name")
        .eq("id", spec.product_id)
        .maybeSingle();
      if (product) productName = (product as { name: string }).name;
    }

    // Same auth-resolution + creation + binding path as createRepoForProduct.
    // A missing connection or oauth_gateway auth throws its actionable error.
    const { repoRef, provider } = await provisionGithubRepo({
      db,
      userId: context.userId,
      name: data.name ?? repoNameFromTitle(spec.title),
      isPrivate: true,
      description: `Cadence build: ${spec.title}`.slice(0, 350),
      productId: spec.product_id,
      workspaceId: spec.workspace_id,
    });

    // Initial commit: the new repo is empty (no branch, no commit), bootstrap
    // it with the rendered starter template.
    if (!provider.bootstrapRepo) {
      throw new Error(
        `Repo provider "${provider.providerId}" cannot create an initial commit on an empty repo.`,
      );
    }
    const files = renderStarterTemplate({ productName, specTitle: spec.title });
    await provider.bootstrapRepo(
      repoRef,
      files,
      `feat: Cadence starter - provisioned for ${spec.title}`,
      DEFAULT_BRANCH,
    );

    return {
      owner: repoRef.owner,
      repo: repoRef.repo,
      htmlUrl: `https://github.com/${repoRef.owner}/${repoRef.repo}`,
      defaultBranch: DEFAULT_BRANCH,
    } satisfies ProvisionedSpecRepo;
  });
