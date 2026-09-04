// BYO-P1b: Product-level connection bindings.
//
// Parallel to the workspace-level binding functions in
// src/lib/connections.functions.ts, but scoped to a product (projects row).
// One binding per (product_id, provider, resource_kind) — same partial-unique
// index discipline as the workspace-scoped rows (which carry product_id IS NULL).
//
// Resolution order after this phase:
//   1. Product-scoped binding  (product_id match)
//   2. Workspace-scoped binding (existing fallback)
//   3. User connection
//   4. Env fallback
// The chokepoint (src/lib/connectors/resolve.server.ts) implements order 1-4.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { BindingRow, ConnectionRow, WorkspaceBindingRow } from "@/lib/connections.functions";
import type { ProviderId } from "@/lib/connectors/registry";
import { resolveProviderAuth } from "@/lib/connectors/resolve.server";
import { repoProviderFor, type RepoProvider } from "@/lib/connectors/repo-provider";

const BINDING_COLUMNS =
  "id,connection_id,workspace_id,product_id,provider,resource_kind,resource_id,resource_label,config,created_by,created_at,updated_at";

const CONNECTION_COLUMNS = "id,provider,account_label,status,user_id";

export type ProductBindingRow = WorkspaceBindingRow & {
  product_id: string;
  product_name: string | null;
};

/**
 * List all product-scoped bindings for products the caller can see (workspace
 * membership RLS scopes the result). Decorates each row with connection info
 * (account label, status) and the product name — both fetched via the service-
 * role client because connection rows are own-row RLS.
 */
export const listProductBindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const admin = supabaseAdmin as unknown as SupabaseClient;

    // All product-scoped bindings visible to this user (RLS: is_workspace_member).
    const { data, error } = await db
      .from("connection_bindings")
      .select(BINDING_COLUMNS)
      .not("product_id", "is", null)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as BindingRow[];

    if (rows.length === 0) return { bindings: [] as ProductBindingRow[] };

    // Decorate with connection info.
    const connectionIds = [...new Set(rows.map((b) => b.connection_id))];
    const connectionMap = new Map<
      string,
      { provider: ProviderId; account_label: string | null; status: string; user_id: string }
    >();
    const ownerDisplayMap = new Map<string, string | null>();
    if (connectionIds.length > 0) {
      const { data: conns } = await admin
        .from("connections")
        .select(CONNECTION_COLUMNS)
        .in("id", connectionIds);
      for (const c of conns ?? []) {
        connectionMap.set(c.id as string, {
          provider: c.provider as ProviderId,
          account_label: (c.account_label as string | null) ?? null,
          status: c.status as string,
          user_id: c.user_id as string,
        });
      }
      const ownerIds = [...new Set([...connectionMap.values()].map((c) => c.user_id))];
      if (ownerIds.length > 0) {
        const { data: profiles } = await admin
          .from("profiles")
          .select("id,display_name,full_name")
          .in("id", ownerIds);
        for (const p of (profiles ?? []) as {
          id: string;
          display_name: string | null;
          full_name: string | null;
        }[]) {
          ownerDisplayMap.set(p.id, p.display_name ?? p.full_name ?? null);
        }
      }
    }

    // Decorate with product names.
    const productIds = [...new Set(rows.map((b) => b.product_id!).filter(Boolean))];
    const productMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: projects } = await db.from("projects").select("id,name").in("id", productIds);
      for (const p of (projects ?? []) as { id: string; name: string }[]) {
        productMap.set(p.id, p.name);
      }
    }

    const bindings: ProductBindingRow[] = rows.map((b) => {
      const conn = connectionMap.get(b.connection_id);
      return {
        ...b,
        product_id: b.product_id!,
        provider: conn?.provider ?? b.provider,
        account_label: conn?.account_label ?? null,
        connection_status: (conn?.status ?? "disconnected") as ConnectionRow["status"],
        owner_display: conn ? (ownerDisplayMap.get(conn.user_id) ?? null) : null,
        product_name: b.product_id ? (productMap.get(b.product_id) ?? null) : null,
      };
    });

    return { bindings };
  });

// ── BYO-P1c: Managed auto-create repo ────────────────────────────────────────

export type CreatedRepo = { owner: string; repo: string };

/**
 * W5a: the ONE repo-provisioning core, shared by createRepoForProduct (below)
 * and provisionRepoForSpec (src/lib/new-build.functions.ts). Resolves GitHub
 * auth through the standard chain (product binding → workspace binding → user
 * connection → env), creates the repo in the user's own account, and (unless
 * skipped) auto-binds it as a product-scoped binding. Throws the actionable
 * errors for a missing connection and for oauth_gateway auth (which cannot
 * create repos). Returns the provider so callers can keep working against the
 * new repo (e.g. bootstrap the initial commit).
 */
export async function provisionGithubRepo(opts: {
  db: SupabaseClient;
  userId: string;
  name: string;
  isPrivate?: boolean;
  org?: string;
  description?: string;
  productId?: string | null;
  workspaceId?: string | null;
  /** Skip the product-binding write (repo creation only). */
  skipBinding?: boolean;
}): Promise<{ repoRef: CreatedRepo; provider: RepoProvider }> {
  // Resolve the user's GitHub auth — product → workspace → user connection.
  const resolved = await resolveProviderAuth({
    userClient: opts.db,
    userId: opts.userId,
    workspaceId: opts.workspaceId ?? null,
    productId: opts.productId ?? null,
    provider: "github",
    resourceKind: "repo",
  });

  if (!resolved.auth || resolved.source === "none") {
    throw new Error("No GitHub connection found. Connect your GitHub account in Settings first.");
  }
  if (resolved.auth.kind === "gateway") {
    throw new Error(
      "GitHub OAuth gateway does not support repo creation. Use a GitHub App or personal access token.",
    );
  }

  const provider = repoProviderFor("github", resolved.auth.token);

  const repoRef = await provider.createRepo(opts.name, {
    private: opts.isPrivate ?? true,
    org: opts.org,
    description: opts.description,
  });

  // Auto-bind: create a product-scoped binding for the new repo.
  if (!opts.skipBinding && opts.productId && opts.workspaceId && resolved.auth.kind !== "env") {
    const connectionId = "connectionRowId" in resolved.auth ? resolved.auth.connectionRowId : null;
    if (connectionId) {
      const resourceId = `${repoRef.owner}/${repoRef.repo}`;
      await opts.db
        .from("connection_bindings")
        .upsert(
          {
            connection_id: connectionId,
            workspace_id: opts.workspaceId,
            product_id: opts.productId,
            provider: "github",
            resource_kind: "repo",
            resource_id: resourceId,
            resource_label: repoRef.repo,
            created_by: opts.userId,
          },
          { ignoreDuplicates: false },
        )
        .throwOnError();
    }
  }

  return { repoRef, provider };
}

/**
 * Creates a GitHub repo in the user's own account (or an explicit org they own)
 * using the authenticated user's GitHub connection. Optionally auto-binds the
 * new repo as a product-scoped binding.
 *
 * Never touches a Supaprod-owned org — the endpoint routes to the caller's own
 * /user/repos unless an explicit org is provided.
 */
export const createRepoForProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-zA-Z0-9._-]+$/, "Repo name can only contain letters, numbers, ., _, -"),
        isPrivate: z.boolean().default(true),
        org: z.string().min(1).max(100).optional(),
        description: z.string().max(350).optional(),
        // If provided, auto-bind the new repo to this product after creation.
        productId: z.string().uuid().optional(),
        workspaceId: z.string().uuid().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;

    const { repoRef } = await provisionGithubRepo({
      db,
      userId: context.userId,
      name: data.name,
      isPrivate: data.isPrivate,
      org: data.org,
      description: data.description,
      productId: data.productId ?? null,
      workspaceId: data.workspaceId ?? null,
    });

    return { repo: repoRef satisfies CreatedRepo };
  });
