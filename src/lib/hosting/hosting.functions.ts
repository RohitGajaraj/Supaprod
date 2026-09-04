/**
 * THE HOUSE, SHOWN TO THE PERSON WHO OWNS IT (P-118b).
 *
 * ── WHY THE LIST IS BUILT FROM OUR RECORD AND NOT FROM THE ORG ───────────
 * Every app this product creates is `deriveAppSlug(workspace, changeset)`, so
 * the record knows all of them. It knows nothing about apps somebody else put
 * in the same account -- and that is the reason NOT to enumerate the org.
 *
 * A list read from the host would put apps we must never touch on the same
 * screen as apps we may, behind the same button, distinguished only by a rule
 * this code wrote about somebody else's names. The failure mode is deleting a
 * customer's app because its slug looked like ours, and it is not recoverable.
 *
 * So this shows what we made and says plainly that the account may hold more.
 * A person who needs the full picture has the host's own dashboard, which is
 * authoritative in a way this can never be.
 *
 * ── NOTHING HERE RUNS ON ITS OWN ─────────────────────────────────────────
 * There is no sweep. `reclaimOneApp` deletes exactly the app a person named,
 * after the server has re-derived the verdict for itself -- the client's
 * opinion about what is reclaimable is a convenience for drawing a button and
 * is never trusted as permission.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deriveAppSlug, reclaimHostedApp } from "@/lib/hosting/changeset-deploy.server";
import {
  houseLine,
  mayReclaim,
  type HostedApp,
  type ReclaimVerdict,
} from "@/lib/hosting/ship-keeps-its-own-house";

export type HostedAppRow = HostedApp & {
  verdict: ReclaimVerdict;
  /** The change this app was built for, in the words on its row. */
  title: string | null;
};

export type HostingHouse = {
  apps: HostedAppRow[];
  line: string;
  /** False when a read failed: the surface says so instead of showing zero. */
  known: boolean;
};

/**
 * Every app this product has created for this workspace, with its verdict.
 *
 * Driven from `studio_changesets` rather than from `deployments`: an app is
 * created per CHANGESET, and a changeset whose deploy failed still holds the
 * slot it was given. Reading the deploy list would miss exactly the apps most
 * likely to be rubbish.
 */
export const listHostedApps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<HostingHouse> => {
    const { supabase } = context;
    const workspaceId = (data.workspaceId ?? null) as string | null;
    const empty: HostingHouse = { apps: [], line: houseLine([], new Date()), known: false };
    if (!workspaceId) return empty;

    try {
      const { data: csRows, error: csErr } = await supabase
        .from("studio_changesets")
        .select("id,status,title,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (csErr) return empty;
      const changesets = (csRows ?? []) as Array<{
        id: string;
        status: string | null;
        title: string | null;
        created_at: string | null;
      }>;
      if (changesets.length === 0) {
        return { apps: [], line: houseLine([], new Date()), known: true };
      }

      /* Which of them are serving production. One read, not one per row. */
      const { data: prodRows, error: prodErr } = await supabase
        .from("deployments")
        .select("changeset_id")
        .eq("workspace_id", workspaceId)
        .eq("environment", "production")
        .eq("status", "success")
        .in(
          "changeset_id",
          changesets.map((c) => c.id),
        );
      if (prodErr) return empty;
      const live = new Set(
        ((prodRows ?? []) as Array<{ changeset_id: string | null }>)
          .map((r) => r.changeset_id)
          .filter((c): c is string => !!c),
      );

      const now = new Date();
      const apps: HostedAppRow[] = changesets.map((c) => {
        const app: HostedApp = {
          slug: deriveAppSlug(workspaceId, c.id),
          changesetId: c.id,
          changesetStatus: c.status,
          servesProduction: live.has(c.id),
          createdAt: c.created_at,
        };
        return { ...app, verdict: mayReclaim(app, now), title: c.title ?? null };
      });

      return { apps, line: houseLine(apps, now), known: true };
    } catch {
      return empty;
    }
  });

/**
 * Release one app's slot, because a person pressed the button on its row.
 *
 * THE VERDICT IS RE-DERIVED HERE. The client sent a slug; it did not send
 * permission. Re-reading the changeset and the deploy rows costs two queries
 * and is the difference between a button that deletes what it says and a button
 * that deletes what somebody typed into a request.
 */
export const reclaimOneApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ workspaceId: z.string().uuid(), changesetId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; reason: string }> => {
    const { supabase } = context;

    const { data: csRow, error: csErr } = await supabase
      .from("studio_changesets")
      .select("id,status,created_at")
      .eq("id", data.changesetId)
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();
    if (csErr) return { ok: false, reason: "That change could not be read, so nothing was done." };
    const cs = csRow as { id: string; status: string | null; created_at: string | null } | null;
    if (!cs) {
      /* Scoped by workspace above, so this also covers a slug from another
         workspace: it is not found HERE, which is the honest answer. */
      return { ok: false, reason: "That change is not in this workspace." };
    }

    const { data: prod, error: prodErr } = await supabase
      .from("deployments")
      .select("id")
      .eq("workspace_id", data.workspaceId)
      .eq("changeset_id", cs.id)
      .eq("environment", "production")
      .eq("status", "success")
      .limit(1);
    if (prodErr) {
      /* A read that failed is not permission. Refusing costs a retry; the other
         way round costs somebody's live address. */
      return { ok: false, reason: "Whether this is live could not be read, so nothing was done." };
    }

    const app: HostedApp = {
      slug: deriveAppSlug(data.workspaceId, cs.id),
      changesetId: cs.id,
      changesetStatus: cs.status,
      servesProduction: (prod ?? []).length > 0,
      createdAt: cs.created_at,
    };
    const verdict = mayReclaim(app, new Date());
    if (!verdict.reclaim) return { ok: false, reason: verdict.because };

    return await reclaimHostedApp(app.slug);
  });
