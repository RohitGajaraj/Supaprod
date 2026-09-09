/**
 * ── OPENING ARRIVING STAMPS THE LAST LOOK (P-69) ─────────────────────────
 *
 * P-62 gave `brain_last_seen` its first reader -- Start's "what came in since
 * you last looked" -- and found it had never had a writer a person's visit
 * fires. So Helio reads "140 findings are on the record. You have not looked
 * yet." That is the honest branch, and without this it is the ONLY branch that
 * will ever render, on every workspace, forever.
 *
 * ── A VISIT IS A PERSON, NOT A READ ──────────────────────────────────────
 *
 * This is deliberately its own write rather than a side effect of the read that
 * draws the surface, and the distinction is the whole packet. A background
 * refetch, a prefetch on hover, a retry after a failed request and a second tab
 * polling are all READS, and none of them is somebody looking. If the stamp
 * rode the read, the count on Start would fall to zero without anybody opening
 * anything, which is the same class of lie as an all-clear from a failed read:
 * the surface would be telling a person they had seen something they had not.
 *
 * So the caller is the route's mount, once, and the guard in
 * `stamp-the-last-look.test.ts` holds that.
 *
 * ── AND IT NEVER FAILS THE PAGE ──────────────────────────────────────────
 *
 * A stamp that cannot be written costs a person one stale sentence on another
 * surface. Throwing here would cost them the surface they actually opened, to
 * protect a count. It returns `false` and says so in the console; the caller
 * ignores it on purpose.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

const Scope = z.object({ workspaceId: z.string().uuid().nullable().optional() });

export const stampLastLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Scope.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<{ stamped: boolean; at: string | null }> => {
    const { supabase, userId } = context;

    let workspaceId = data?.workspaceId ?? null;
    if (!workspaceId) {
      const { data: def } = await supabase.rpc("current_user_default_workspace");
      /*
       * CHECKED, NOT CAST, AND CHECKED IN ONE PLACE. `(def as string | null) ??
       * null` is an assertion plus a nullish guard, and `??` catches only null
       * and undefined, so any OTHER shape passes through wearing the type of an
       * id. An empty array is truthy, so it would clear the `!workspaceId`
       * guard below and this handler would STAMP against it, which is exactly
       * what the comment under that guard says must never happen.
       *
       * Lane 3 swept 52 call sites of this shape on 2026-09-09 and `defaultWorkspaceId`
       * is the one narrowing they all share. Taken over an inline check of my
       * own, because a second copy of a narrowing is a second thing to drift.
       */
      workspaceId = defaultWorkspaceId(def);
    }
    /*
     * NO WORKSPACE, NO STAMP. The row is keyed (user_id, workspace_id) and a
     * visit we cannot attribute to a workspace is not a visit to one. Writing
     * against a guessed workspace would mark another desk's findings as seen.
     */
    if (!workspaceId) return { stamped: false, at: null };

    const at = new Date().toISOString();
    /*
     * UPSERT ON THE PRIMARY KEY (user_id, workspace_id), which is what makes
     * "once per visit" cheap: the second visit overwrites the first rather than
     * accumulating rows, and two tabs racing produce one row with the later
     * time. `seen_at` moving forward is the only thing this table records.
     */
    const { error } = await supabase
      .from("brain_last_seen")
      .upsert({ user_id: userId, workspace_id: workspaceId, seen_at: at } as never, {
        onConflict: "user_id,workspace_id",
      });
    if (error) {
      // Recorded, not thrown: see the header. One stale sentence elsewhere is
      // cheaper than losing the surface the person opened.
      console.error(`[last-look] the visit was not stamped: ${error.message}`);
      return { stamped: false, at: null };
    }
    return { stamped: true, at };
  });
