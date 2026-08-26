import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { changelogRowFor, type ChangesetForChangelog } from "@/lib/changelog";

// Resolve the workspace to scope a read to (the active one, else the caller's
// default). Mirrors the local helper in billing/briefs/audio.functions.ts.
//
// THE RPC'S ERROR IS NO LONGER DISCARDED. `listChangelog` turns a null answer
// into `{ entries: [] }`, which /ship renders as "Nothing has merged yet", so a
// FAILED rpc looked exactly like an account that has never shipped — a discarded
// read error spent as evidence of absence, on the station whose whole job is
// saying what went out. A genuine null (no membership yet) still returns null
// and still yields an empty list; only a real error travels now.
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

// BYO-P3 WI4 — In-app changelog server functions.
// Entries are auto-materialized from merged changesets by the
// studio_changeset_to_changelog DB trigger; publishChangelogEntry is the
// durable TS equivalent (the source of truth if a sync ever reverts the
// trigger, and the repair path for a merge whose entry never appeared).
// listChangelog is a pure, workspace-scoped read. New tables aren't in the
// generated Supabase types yet.
//
// THIS COMMENT USED TO CALL publishChangelogEntry "the explicit hook
// recordOutcome calls". It is not, and never has been. recordOutcome
// (src/lib/outcome.functions.ts, the `if (shippedChangeset)` block) imports
// `changelogRowFor` and inlines its OWN `changelog_entries` upsert; it does not
// import anything from this file. That inlined copy also carries the same
// `onConflict: "changeset_id"` defect fixed below — see publishChangelogEntry's
// note for why that statement can never plan — inside a catch that swallows the
// error, so recordOutcome has never published a changelog entry either. Fixing
// it belongs to that file, not this one.
//
// STILL TRUE AT outcome.functions.ts:756-757 WHEN LAST CHECKED, 2026-08-06.
// Dated rather than stated flat, because that file is being worked on
// separately and this paragraph must not turn into a claim about code that has
// since been repaired. Check the line before relying on it.

export type ChangelogEntry = {
  id: string;
  product_id: string | null;
  changeset_id: string | null;
  prd_id: string | null;
  title: string;
  body: string;
  pr_number: number | null;
  pr_url: string | null;
  released_at: string;
  product_name?: string | null;
  production_url?: string | null;
  /** Origin bet this release came from (when available). */
  opportunity_id?: string | null;
  opportunity_title?: string | null;
};

export const listChangelog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid().optional(),
        productId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ entries: ChangelogEntry[] }> => {
    const db = context.supabase as unknown as SupabaseClient;

    // Scope to ONE workspace (the active one, or the caller's first membership)
    // so a multi-workspace user never sees a merged cross-workspace list under a
    // single-workspace breadcrumb. RLS still enforces access; this restores
    // active-workspace scoping, matching listProjects.
    const workspaceId = await resolveWorkspaceId(db, data.workspaceId);
    if (!workspaceId) return { entries: [] };

    let q = db
      .from("changelog_entries")
      .select("id,product_id,changeset_id,prd_id,title,body,pr_number,pr_url,released_at")
      .eq("workspace_id", workspaceId)
      .order("released_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.productId) q = q.eq("product_id", data.productId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const entries = (rows ?? []) as ChangelogEntry[];

    // THE FOUR ENRICHMENT READS BELOW NOW REPORT THEIR FAILURES. Each one used
    // `const { data } =` and threw the error away, and each one's empty result
    // is then written onto the entry as a null — so a failed read renders as
    // "this release has no product", "no production address", "no origin bet".
    // That is the house's named shape: a read whose error was discarded, used as
    // evidence of absence. The URL is the one that hurts, because /ship reads a
    // null `production_url` as a release that never reached production.
    //
    // THEY LOG RATHER THAN THROW, AND THAT IS A DELIBERATE HALF. These are
    // labels hung on a list that has already loaded; failing the whole station
    // because a product name would not resolve trades a small wrong for a large
    // one. So the entry still renders without the field — what changed is that
    // the failure is now visible in ten seconds instead of looking like a calm
    // empty state. Distinguishing "no production deploy" from "could not ask" ON
    // THE SURFACE needs a per-field status this return shape does not carry, and
    // that is a change to every consumer of ChangelogEntry, not to this read.

    // Resolve product labels in one round trip (RLS-scoped read).
    const productIds = Array.from(
      new Set(entries.map((e) => e.product_id).filter((id): id is string => !!id)),
    );
    if (productIds.length) {
      const { data: products, error: productsErr } = await db
        .from("projects")
        .select("id,name")
        .in("id", productIds);
      if (productsErr) {
        console.error("listChangelog product-label read failed (non-fatal):", productsErr.message);
      }
      const nameById = new Map((products ?? []).map((p) => [p.id as string, p.name as string]));
      for (const e of entries) {
        e.product_name = e.product_id ? (nameById.get(e.product_id) ?? null) : null;
      }
    }

    // Resolve production deployment URLs. A changeset may have multiple deployments
    // across environments (preview, production, etc.); we want the production URL
    // if it exists. RLS-scoped read via workspace_id.
    const changesetIds = Array.from(
      new Set(entries.map((e) => e.changeset_id).filter((id): id is string => !!id)),
    );
    if (changesetIds.length) {
      const { data: deployments, error: deploymentsErr } = await db
        .from("deployments")
        .select("changeset_id,deploy_url")
        .eq("workspace_id", workspaceId)
        .eq("environment", "production")
        .eq("status", "success")
        .in("changeset_id", changesetIds);
      if (deploymentsErr) {
        console.error(
          "listChangelog production-url read failed (non-fatal); every release on this page will render without its production address:",
          deploymentsErr.message,
        );
      }
      const urlByChangesetId = new Map(
        (deployments ?? []).map((d) => [(d.changeset_id as string) ?? "", d.deploy_url as string]),
      );
      for (const e of entries) {
        if (e.changeset_id) {
          e.production_url = urlByChangesetId.get(e.changeset_id) ?? null;
        }
      }
    }

    // Resolve origin opportunities. Walk: changelog ← changeset ← mission ← spec ← opportunity.
    // This traces the decision chain so users can see what bet this release came from.
    const prdIds = Array.from(
      new Set(entries.map((e) => e.prd_id).filter((id): id is string => !!id)),
    );
    if (prdIds.length) {
      const { data: specs, error: specsErr } = await db
        .from("prds")
        .select("id,opportunity_id")
        .in("id", prdIds);
      if (specsErr) {
        console.error("listChangelog origin-spec read failed (non-fatal):", specsErr.message);
      }
      const oppIdByPrdId = new Map(
        (specs ?? []).map((s) => [
          (s as { id: string; opportunity_id: string | null }).id,
          (s as { id: string; opportunity_id: string | null }).opportunity_id,
        ]),
      );
      const oppIds = Array.from(
        new Set([...oppIdByPrdId.values()].filter((id): id is string => !!id)),
      );
      if (oppIds.length) {
        const { data: opportunities, error: opportunitiesErr } = await db
          .from("opportunities")
          .select("id,title")
          .in("id", oppIds);
        if (opportunitiesErr) {
          console.error(
            "listChangelog origin-bet read failed (non-fatal):",
            opportunitiesErr.message,
          );
        }
        const oppTitleById = new Map(
          (opportunities ?? []).map((o) => [
            (o as { id: string; title: string }).id,
            (o as { id: string; title: string }).title,
          ]),
        );
        for (const e of entries) {
          if (e.prd_id) {
            const oppId = oppIdByPrdId.get(e.prd_id);
            if (oppId) {
              e.opportunity_id = oppId;
              e.opportunity_title = oppTitleById.get(oppId) ?? null;
            }
          }
        }
      }
    }
    return { entries };
  });

/**
 * Why a publish attempt did or did not produce a row.
 *
 * The three non-publishing cases are ordinary states of the DATA rather than
 * faults, which is exactly why they are returned instead of thrown: each has a
 * different next step, and a door that cannot tell them apart can only say
 * "nothing happened". A genuine refusal (row-level security, a constraint) still
 * THROWS, so it can never be mistaken for one of these.
 */
export type PublishChangelogReason =
  "created" | "refreshed" | "changeset-not-found" | "not-merged" | "no-release-notes";

export type PublishChangelogResult = {
  published: boolean;
  reason: PublishChangelogReason;
  /** One plain sentence naming what happened and, where there is one, the next
   *  step. Written to be rendered as-is. */
  message: string;
  /** The `changelog_entries` row id, when one exists after this call. */
  entryId: string | null;
};

/**
 * Durable publish: materialize (or refresh) the changelog entry for one merged
 * changeset. This is the repair path for a merge that shipped and never
 * appeared on Ship. Safe to press twice — it is keyed on changeset_id, and the
 * second call refreshes the row the first one wrote rather than adding another.
 *
 * IT CANNOT REPAIR A CHANGESET THAT HAS NO RELEASE NOTES, WHICH IS THE COMMON
 * CASE, so a caller must read `reason` and not just `published`.
 * `changelogRowFor` returns null unless the changeset is `merged` AND carries
 * non-empty release_notes, because an entry with no body is not a release
 * anyone can read. Measured live in the dogfood workspace on 2026-08-06: nine
 * merged changesets, nine successful deploys, one set of release notes, one
 * changelog row. So on eight of those nine this function correctly declines,
 * and the repair they need is to WRITE THE NOTES — Studio's "Write them" under
 * Release notes (generateReleaseNotes) — after which
 * trg_studio_changeset_to_changelog materializes the entry by itself and this
 * function is not needed at all. `reason` says which of those situations the
 * caller is in so the door can name the real next step.
 *
 * NO `ON CONFLICT`, AND THAT IS NOT A STYLE CHOICE. The arbiter for changeset_id
 * is `uq_changelog_changeset`, a PARTIAL unique index (`... WHERE changeset_id
 * IS NOT NULL`). Postgres will not infer a partial index unless the statement
 * repeats the predicate, and PostgREST's `onConflict` parameter cannot express
 * one. The previous `upsert(..., { onConflict: "changeset_id" })` therefore
 * raised `42P10: there is no unique or exclusion constraint matching the ON
 * CONFLICT specification` on EVERY call — inference happens when the statement
 * is planned, so it failed whether or not a conflicting row existed. Verified
 * against this database on 2026-08-06 by planning that exact insert. The DB
 * trigger gets away with it only because PL/pgSQL can spell the predicate out:
 * `ON CONFLICT (changeset_id) WHERE changeset_id IS NOT NULL DO UPDATE`. So the
 * idempotency here is an explicit update-then-insert, with the unique violation
 * from a concurrent publish folded back into the update.
 *
 * THE ROW IS WRITTEN UNDER THE CURRENT USER ON BOTH PATHS, because it has to be:
 * the `changelog ws write` policy carries `WITH CHECK (is_workspace_member(...)
 * AND user_id = auth.uid())`, and WITH CHECK is evaluated against the row after
 * an UPDATE too. Leaving the original author's user_id in place would make a
 * refresh by any other workspace member fail. So that column means "WHO LAST
 * PUBLISHED THIS ENTRY", not "who wrote the change".
 *
 * That is a real semantic change and it is written down here because nothing
 * else records it: an entry the merge trigger materialized carries the
 * changeset's author, and the first repair press by a teammate replaces that
 * with the presser. Re-read live on 2026-08-06 (`pg_policy` on
 * `public.changelog_entries`): two policies, `changelog ws read` USING
 * `is_workspace_member(workspace_id)`, and `changelog ws write` for ALL commands
 * with USING `is_workspace_member(workspace_id)` and the WITH CHECK above. No
 * consumer displays or attributes on this column today — `ChangelogEntry` above
 * does not even select it — so the change costs nothing visible; it would start
 * costing something the moment anything credits a release to it.
 *
 * The refresh list deliberately matches the trigger's DO UPDATE list — title,
 * body, pr_number, pr_url, and prd_id only when this call has one — so the two
 * writers of this row cannot disagree. `released_at` in particular is NOT
 * rewritten: the trigger leaves it alone, and moving a release's date every time
 * someone presses the button would silently reorder Ship.
 */
export const publishChangelogEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ changesetId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<PublishChangelogResult> => {
    const { userId } = context;
    const db = context.supabase as unknown as SupabaseClient;
    const { data: cs, error } = await db
      .from("studio_changesets")
      .select(
        "id,workspace_id,user_id,product_id,prd_id,status,title,summary,release_notes,release_notes_at,pr_number,pr_url,updated_at",
      )
      .eq("id", data.changesetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cs) {
      return {
        published: false,
        reason: "changeset-not-found",
        message:
          "That change no longer exists, or it belongs to a workspace you are not a member of.",
        entryId: null,
      };
    }

    const changeset = cs as unknown as ChangesetForChangelog;
    const row = changelogRowFor(changeset, new Date().toISOString());
    if (!row) {
      // changelogRowFor folds two conditions into one null. They are told apart
      // here because the person's next step is completely different for each.
      if (changeset.status !== "merged") {
        return {
          published: false,
          reason: "not-merged",
          message: `This change has not merged yet. It is "${changeset.status}", so there is no release to publish. Merge the pull request first.`,
          entryId: null,
        };
      }
      return {
        published: false,
        reason: "no-release-notes",
        message:
          'This change merged, but no release notes were ever written for it, and Ship lists a release only once there is something to read. Open it in Studio and press "Write them" under Release notes; the release appears as soon as they are saved.',
        entryId: null,
      };
    }

    const refresh: Record<string, unknown> = {
      user_id: userId,
      title: row.title,
      body: row.body,
      pr_number: row.pr_number,
      pr_url: row.pr_url,
    };
    // COALESCE(EXCLUDED.prd_id, existing), same as the trigger: a later publish
    // that cannot see a spec must not erase a link an earlier one recorded.
    if (row.prd_id) refresh.prd_id = row.prd_id;

    // Refresh first. AN EMPTY ROW SET HERE MEANS NO ENTRY EXISTS, NOT A REFUSAL,
    // and that distinction is spelled out because reading one as the other is
    // this repo's recurring bug. The SELECT above already proved this caller is a
    // member of the changeset's workspace; `changelog ws write` USING is exactly
    // that membership — re-read from `pg_policy` on 2026-08-06 and it is
    // `is_workspace_member(workspace_id)` with nothing else in it — and its WITH
    // CHECK is satisfied by the user_id written above. A policy refusal on an
    // UPDATE that matched a row arrives as error 42501, not as silence, and is
    // rethrown below. The load-bearing part is the USING clause: were it the
    // same expression as the WITH CHECK, a second member's refresh would match
    // no row, fall through to the insert, and come back round to the retry as a
    // unique violation it also could not update — which is why it is verified
    // here rather than assumed from the WITH CHECK beside it.
    const updated = await db
      .from("changelog_entries")
      .update(refresh)
      .eq("changeset_id", row.changeset_id)
      .select("id");
    if (updated.error) throw new Error(updated.error.message);
    const refreshedId = ((updated.data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
    if (refreshedId) {
      return {
        published: true,
        reason: "refreshed",
        message:
          "This release was already listed on Ship. Its entry has been brought back in line with the change's current title and notes.",
        entryId: refreshedId,
      };
    }

    const inserted = await db
      .from("changelog_entries")
      .insert({ ...row, user_id: userId })
      .select("id");
    if (inserted.error) {
      // 23505 is the merge trigger (or a second person's click) inserting the row
      // in the gap between the update above and this insert. That is the
      // idempotent case, not a failure, so it retries the refresh rather than
      // showing a unique-violation to someone who pressed a button twice.
      //
      // THE RETRY CAN SEE THE ROW THAT BEAT IT, which is the step this branch
      // stands or falls on. Postgres does not raise the unique violation while
      // the other writer is still in flight — the second inserter BLOCKS on the
      // index tuple until that transaction commits or aborts — so by the time
      // 23505 arrives here the conflicting row is committed, and `changelog ws
      // read`/`write` USING is plain workspace membership, which this caller has
      // already been proved to hold. The retry therefore matches it. It also
      // depends on the arbiter really covering this row: `uq_changelog_changeset`
      // is partial on `WHERE changeset_id IS NOT NULL`, and `changelogRowFor`
      // always sets `changeset_id` to the changeset's own id (src/lib/changelog.ts),
      // so there is no path here that writes a null and slips past both the index
      // and the `.eq("changeset_id", …)` filter.
      //
      // Reasoned and traced, NOT observed: no concurrent press has been executed
      // against this branch.
      if ((inserted.error as { code?: string }).code === "23505") {
        const retry = await db
          .from("changelog_entries")
          .update(refresh)
          .eq("changeset_id", row.changeset_id)
          .select("id");
        if (retry.error) throw new Error(retry.error.message);
        const retryId = ((retry.data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
        if (retryId) {
          return {
            published: true,
            reason: "refreshed",
            message:
              "This release was published while you were pressing the button, so its entry has been brought up to date instead of duplicated.",
            entryId: retryId,
          };
        }
        throw new Error(
          "The release was published by something else at the same moment, and this attempt could then neither insert nor update it. Reload Ship to see the entry that landed.",
        );
      }
      throw new Error(inserted.error.message);
    }
    const insertedId = ((inserted.data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
    if (!insertedId) {
      // supabase-js RESOLVES a write the database refused: error null, no rows.
      // Without this check the caller would be told the release was published
      // over a table that never received it.
      throw new Error(
        "The release was not published: the insert was refused and wrote no row. You may not have rights on this workspace's changelog.",
      );
    }
    return {
      published: true,
      reason: "created",
      message: `Published. "${row.title}" is now listed on Ship as a release.`,
      entryId: insertedId,
    };
  });
