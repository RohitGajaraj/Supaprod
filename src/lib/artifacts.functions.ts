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
}

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export const listArtifacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ artifacts: ArtifactSummary[] }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const userId = context.userId;
    const out: ArtifactSummary[] = [];

    // Prototypes (the /p/$slug viewer opens them). RLS-scoped.
    {
      const { data } = await db
        .from("prototypes")
        .select("id,name,share_slug,updated_at")
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
        });
      }
    }

    // Specs (they live on the Plan surface). RLS-scoped.
    {
      const { data } = await db
        .from("prds")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
      for (const r of (data ?? []) as Row[]) {
        out.push({
          id: String(r.id),
          kind: "spec",
          name: str(r.title) ?? "Spec",
          updatedAt: str(r.updated_at),
          href: "/plan",
        });
      }
    }

    // Docs (the /docs workspace). Scoped to the user, non-archived, like listDocs.
    {
      const { data } = await db
        .from("docs")
        .select("id,title,updated_at,archived,user_id")
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
        });
      }
    }

    out.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    return { artifacts: out };
  });
