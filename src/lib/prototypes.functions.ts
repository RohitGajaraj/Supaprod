/**
 * PC-31: the persistence/sharing bridge for design prototypes. DEF-04's
 * DesignScaffoldPanel already generates and previews a mockup per spec
 * (`prd_scaffolds`, ephemeral, one row per PRD); this promotes an already-
 * generated scaffold into the `prototypes`/`prototype_files` family so it
 * gets a name, a stable share_slug, and a public/private toggle -- the
 * existing `/p/$slug` viewer lights up as soon as a row lands here. No new
 * generation logic: publish reads the scaffold DEF-04 already made.
 *
 * Authorization note (IDOR review acknowledged NOT exploitable, verified
 * against the live RLS policy SQL, not just code reading): every handler
 * here uses `requireSupabaseAuth`'s RLS-scoped client, never the admin
 * client. `listPrototypes`/`togglePrototypeShare` have no app-level
 * `.eq("user_id", ...)` filter because none is needed -- `prototypes`'
 * live policy is `FOR ALL USING (auth.uid() = user_id AND
 * is_workspace_member(workspace_id)) WITH CHECK (same)`, so a caller
 * passing another user's row id updates/reads zero rows, not someone
 * else's. `publishPrototypeFromPrd` derives `workspace_id` from a `prds`
 * row read through the SAME RLS-scoped client (`prds`' SELECT policy is
 * `is_workspace_member(workspace_id)`), so a prdId from a foreign
 * workspace returns null and the handler throws before any write.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recordLineageSafe } from "@/lib/lineage.functions";

export type PrototypeSummary = {
  id: string;
  name: string;
  prdId: string | null;
  shareSlug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export const listPrototypes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PrototypeSummary[]> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("prototypes")
      .select("id,name,prd_id,share_slug,is_public,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      prdId: (r.prd_id as string | null) ?? null,
      shareSlug: r.share_slug as string,
      isPublic: Boolean(r.is_public),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
  });

export const publishPrototypeFromPrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prdId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<PrototypeSummary> => {
    const { supabase, userId } = context;

    const { data: prd, error: prdErr } = await supabase
      .from("prds")
      .select("id,title,workspace_id")
      .eq("id", data.prdId)
      .maybeSingle();
    if (prdErr) throw new Error(prdErr.message);
    if (!prd) throw new Error("Spec not found");
    const { title, workspace_id: workspaceId } = prd as { title: string; workspace_id: string };

    const { data: scaffold, error: scaffoldErr } = await supabase
      .from("prd_scaffolds")
      .select("html")
      .eq("prd_id", data.prdId)
      .maybeSingle();
    if (scaffoldErr) throw new Error(scaffoldErr.message);
    if (!scaffold) {
      throw new Error("Generate a mockup on this spec first, then publish it as a prototype.");
    }
    const html = (scaffold as { html: string }).html;

    const { data: prototype, error: insertErr } = await supabase
      .from("prototypes")
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        prd_id: data.prdId,
        name: title.slice(0, 200),
        entry_path: "index.html",
        is_public: false,
      })
      .select("id,name,prd_id,share_slug,is_public,created_at,updated_at")
      .single();
    if (insertErr) throw new Error(insertErr.message);
    const p = prototype as {
      id: string;
      name: string;
      prd_id: string;
      share_slug: string;
      is_public: boolean;
      created_at: string;
      updated_at: string;
    };

    const { error: fileErr } = await supabase.from("prototype_files").insert({
      prototype_id: p.id,
      user_id: userId,
      workspace_id: workspaceId,
      path: "index.html",
      content: html,
      language: "html",
    });
    if (fileErr) throw new Error(fileErr.message);

    await recordLineageSafe(supabase, userId, {
      parent_kind: "prd",
      parent_id: data.prdId,
      child_kind: "prototype",
      child_id: p.id,
      relation: "promoted",
      created_by_agent: null,
    });

    return {
      id: p.id,
      name: p.name,
      prdId: p.prd_id,
      shareSlug: p.share_slug,
      isPublic: Boolean(p.is_public),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });

export const togglePrototypeShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), isPublic: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ ok: true; isPublic: boolean }> => {
    const { supabase } = context;
    const { data: updated, error } = await supabase
      .from("prototypes")
      .update({ is_public: data.isPublic, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Prototype not found");
    return { ok: true, isPublic: data.isPublic };
  });

// K9 (Artifacts rename/delete): rename + delete a prototype. RLS-scoped like
// the rest of this file (own-row + workspace-member); no migration. A foreign
// id updates/deletes zero rows rather than someone else's.
export const renamePrototype = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().min(1).max(200) }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const builder = context.supabase.from("prototypes") as unknown as {
      update: (p: Record<string, unknown>) => {
        eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await builder
      .update({ name: data.name, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePrototype = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("prototypes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
