// Artifacts (front-end reimagining Phase 4; founder-approved 2026-07-19, named
// "Artifacts"). The one home for the resources the loop generates: prototypes,
// specs, and docs today, more families as they land.
//
// The INDEX is a union over the existing per-family tables (gap register K6) -
// no migration, so it works the moment this ships. Versioning (K7) and
// rename/delete (K9) are the migration-bearing follow-ups; this read never
// claims them. RLS scopes every family to the caller; a family whose read
// errors is simply skipped, so the index never breaks on one bad table.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ArtifactKind = "prototype" | "spec" | "doc";

export interface ArtifactSummary {
  id: string;
  kind: ArtifactKind;
  /** Human name (prototype name, spec title, doc title). */
  name: string;
  /** ISO updated time, believable and mono-rendered in the UI. */
  updatedAt: string | null;
  /** Where "Open" takes the operator (best-effort per family today). */
  href: string;
  /** Owning product (projects.id); null when the artifact is unassigned. */
  productId: string | null;
}

/** A product that owns at least one artifact, for the per-product filter. */
export interface ArtifactProduct {
  id: string;
  name: string;
  count: number;
}

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export const listArtifacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ artifacts: ArtifactSummary[]; products: ArtifactProduct[] }> => {
      const db = context.supabase as unknown as SupabaseClient;
      const userId = context.userId;
      const out: ArtifactSummary[] = [];

      // Prototypes (the /p/$slug viewer opens them). RLS-scoped.
      {
        const { data } = await db
          .from("prototypes")
          .select("id,name,share_slug,updated_at,project_id")
          .order("updated_at", { ascending: false })
          .limit(100);
        for (const r of (data ?? []) as Row[]) {
          const slug = str(r.share_slug);
          out.push({
            id: String(r.id),
            kind: "prototype",
            name: str(r.name) ?? "Prototype",
            updatedAt: str(r.updated_at),
            href: slug ? `/p/${slug}` : "/design",
            productId: str(r.project_id),
          });
        }
      }

      // Specs (they live on the Plan surface). RLS-scoped.
      {
        const { data } = await db
          .from("prds")
          .select("id,title,updated_at,project_id")
          .order("updated_at", { ascending: false })
          .limit(100);
        for (const r of (data ?? []) as Row[]) {
          out.push({
            id: String(r.id),
            kind: "spec",
            name: str(r.title) ?? "Spec",
            updatedAt: str(r.updated_at),
            href: "/plan",
            productId: str(r.project_id),
          });
        }
      }

      // Docs (the /docs workspace). Scoped to the user, non-archived, like listDocs.
      {
        const { data } = await db
          .from("docs")
          .select("id,title,updated_at,archived,user_id,project_id")
          .eq("user_id", userId)
          .eq("archived", false)
          .order("updated_at", { ascending: false })
          .limit(100);
        for (const r of (data ?? []) as Row[]) {
          out.push({
            id: String(r.id),
            kind: "doc",
            name: str(r.title) ?? "Untitled",
            updatedAt: str(r.updated_at),
            href: "/docs",
            productId: str(r.project_id),
          });
        }
      }

      out.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

      // Per-product grouping (no migration: every family carries project_id, and
      // the projects table IS the product). Resolve names for the products that
      // actually own artifacts, with a count, for the filter tabs.
      const productIds = Array.from(
        new Set(out.map((a) => a.productId).filter((id): id is string => !!id)),
      );
      const names = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: rows } = await db.from("projects").select("id,name").in("id", productIds);
        for (const r of (rows ?? []) as Row[])
          names.set(String(r.id), str(r.name) ?? "Untitled product");
      }
      const counts = new Map<string, number>();
      for (const a of out)
        if (a.productId) counts.set(a.productId, (counts.get(a.productId) ?? 0) + 1);
      const products: ArtifactProduct[] = productIds
        .map((id) => ({
          id,
          name: names.get(id) ?? "Untitled product",
          count: counts.get(id) ?? 0,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      return { artifacts: out, products };
    },
  );

// --- Artifact VERSIONS (K7). Generic snapshot history + restore, per-kind
//     dispatch. All tolerant: the artifact_versions table lands at the Gate-2
//     merge; until then reads return empty and captures fail with an honest
//     message. ---

/** Per-family title + body columns for the generic snapshot. */
const KIND_TABLE: Record<ArtifactKind, { table: string; titleCol: string; bodyCol: string }> = {
  prototype: { table: "prototypes", titleCol: "name", bodyCol: "description" },
  spec: { table: "prds", titleCol: "title", bodyCol: "body_md" },
  doc: { table: "docs", titleCol: "title", bodyCol: "content_text" },
};

const kindSchema = z.enum(["prototype", "spec", "doc"]);

export interface ArtifactVersion {
  id: string;
  title: string | null;
  createdAt: string | null;
}

export const listArtifactVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ kind: kindSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ versions: ArtifactVersion[] }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: rows, error } = await db
      .from("artifact_versions")
      .select("id,title,created_at")
      .eq("artifact_kind", data.kind)
      .eq("artifact_id", data.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { versions: [] }; // table not migrated yet -> no history
    return {
      versions: ((rows ?? []) as Row[]).map((r) => ({
        id: String(r.id),
        title: str(r.title),
        createdAt: str(r.created_at),
      })),
    };
  });

export const captureArtifactVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ kind: kindSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const map = KIND_TABLE[data.kind];
    // Read the artifact's current title + body (RLS-scoped to the caller).
    const { data: cur, error: readErr } = await db
      .from(map.table)
      .select(`${map.titleCol},${map.bodyCol}`)
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    const row = (cur ?? {}) as Row;
    const { error } = await db.from("artifact_versions").insert({
      user_id: context.userId,
      artifact_kind: data.kind,
      artifact_id: data.id,
      title: str(row[map.titleCol]),
      body: str(row[map.bodyCol]),
    });
    if (error) throw new Error(error.message); // pre-migration -> honest failure
    return { ok: true };
  });

export const restoreArtifactVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ versionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: v, error: readErr } = await db
      .from("artifact_versions")
      .select("artifact_kind,artifact_id,title,body")
      .eq("id", data.versionId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!v) throw new Error("Version not found.");
    const ver = v as Row;
    const kind = String(ver.artifact_kind);
    const map = (
      KIND_TABLE as Record<string, { table: string; titleCol: string; bodyCol: string }>
    )[kind];
    if (!map) throw new Error("Unknown artifact kind.");
    const patch: Record<string, unknown> = { [map.bodyCol]: str(ver.body) ?? "" };
    if (str(ver.title) !== null) patch[map.titleCol] = str(ver.title);
    // RLS ensures only the caller's own artifact updates.
    const { error } = await db.from(map.table).update(patch).eq("id", String(ver.artifact_id));
    if (error) throw new Error(error.message);
    return { ok: true };
  });
