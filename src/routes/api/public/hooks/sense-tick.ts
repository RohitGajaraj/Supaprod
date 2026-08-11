import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// workspace_routine_prefs (PC-08, migration 20260710220000) predates the
// last generated Supabase types.
const routinesDb = supabaseAdmin as unknown as SupabaseClient;
import { DEMO_FEED, autoTag, inferSentiment, tagSignalUpdate } from "@/lib/sensing/normalize";
import { ingestGithubSignals } from "@/lib/connectors/providers/github-ingest.server";
import { ingestPostHogAnalytics } from "@/lib/analytics-ingest.server";
import { PULL_INGESTORS } from "@/lib/connectors/providers/pull-ingestors.server";
import { ingestMcpSignals } from "@/lib/connectors/mcp/ingest.server";
import { withJobRun } from "@/lib/observability";

/**
 * AMBIENT-SENSE (v11 #3) sense-tick: the continuous-sensing half of the ambient loop. For
 * every workspace that has opted in (auto_sense_enabled = true), with NO human start, it:
 *   1. normalizes + auto-tags the workspace's untagged signals to the ontology (so the
 *      clustering step has analysis-ready input), and
 *   2. tops up a small, deterministic DEMO feed when the workspace is near-empty, so the
 *      loop has something to sense until a real source is bound (SEN-01 / F-CONN, founder-gated).
 * cluster-tick then clusters the now-tagged signals into themes and opportunities.
 *
 * Off by default and bounded, exactly like cluster-tick: no workspace runs until its owner
 * toggles auto_sense_enabled on, and the pg_cron schedule that drives this is a founder
 * activation step. This tick is RULE-BASED only (no AI call), so it commits NO recurring AI
 * spend; AI enrichment would be a later, spend-gated enhancement. Each invocation processes
 * at most 5 workspaces (oldest-run-first) and at most 50 signal updates per workspace.
 */

const MAX_WORKSPACES = 5;
const MAX_TAG_UPDATES = 50;
const SCAN_LIMIT = 100;
const DEMO_TOPUP_THRESHOLD = 3; // top up the demo feed only for a near-empty workspace

/**
 * WHO COUNTS AS A DEMO ACCOUNT — asked of the database, never answered locally.
 *
 * Demo/sample accounts are the ONLY workspaces that may receive the synthetic
 * DEMO_FEED. A real signup's signals come from its bound connectors (kickFirstIngest
 * + the ingestors below); injecting fabricated competitor/customer signals into a real
 * workspace would present invented data as the user's own.
 *
 * THIS WAS A DOMAIN MATCH ON THE RETIRED DEMO DOMAIN UNTIL 2026-08-11, AND BY THEN IT
 * WAS NOT MERELY STALE — IT WAS INVERTED. Measured against production that day, the old
 * predicate and the database's own allowlist selected DISJOINT sets: the two retired
 * logins matched here and were absent from the allowlist, while `harbor@supaprod.ai` —
 * the live demo account, and the only one with `auto_sense_enabled` — was in the
 * allowlist and matched nothing here. The retired pair was suspended on 2026-07-25. So
 * the tick was offering the top-up exclusively to dead workspaces and withholding it
 * from the live one, with zero overlap between the two answers.
 *
 * WHY THIS MATTERED EVEN THOUGH NOTHING VISIBLY BROKE. Every candidate workspace sits
 * above DEMO_TOPUP_THRESHOLD today, so no top-up was due and the inversion had cost
 * nothing yet. It bites on the next demo reset: `admin_reset_demo_workspace` DELETEs the
 * workspace's signals and is allowlisted to exactly these supaprod.ai accounts, so a
 * reset empties the demo and this predicate then refuses to refill it. The reset path
 * and the refill path disagreed about who is a demo account, which quietly made "reset
 * the demo" a one-way door.
 *
 * THE OBVIOUS FIX IS THE DANGEROUS ONE, and migration
 * 20260730000500_demo_reset_allowlist.sql already refused it in so many words: swapping
 * the domain to `@supaprod.ai` would sweep in founder@supaprod.ai and every real staff
 * account, authorising invented signals into the founder's own workspace. A gate that
 * widens to include the thing it protects is not a gate. The database answers this with
 * an explicit allowlist, `public.demo_account_emails()`, and this now asks it.
 *
 * ONE DELIBERATE DUPLICATE SURVIVES, in `_authenticated.admin.workspaces.tsx`, which
 * keeps a hand-copied list to decide whether to RENDER the reset control. That one is
 * safe by construction and says so: if it drifts, the SQL wins and the button throws.
 * This copy was not safe in either direction, because it is the only gate on a write.
 */
let demoEmailCache: ReadonlySet<string> | null = null;

/** Test seam: forget the cached allowlist. Never called by product code. */
export function resetDemoAccountCache(): void {
  demoEmailCache = null;
}

/**
 * Pure and exported so the matching rule is testable without a database.
 *
 * Lowercased on both sides: the allowlist is hand-written in a migration while
 * `auth.users.email` preserves whatever case the account was created with, and a demo
 * account that silently stopped matching because someone typed a capital is precisely
 * the class of failure this whole comment exists about.
 */
export function normalizeDemoEmails(emails: readonly string[]): ReadonlySet<string> {
  return new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean));
}

/** Pure membership test. A null allowlist means "could not establish", never "no". */
export function isDemoAccountEmail(
  email: string | null | undefined,
  allowlist: ReadonlySet<string> | null,
): boolean {
  if (!email || !allowlist) return false;
  return allowlist.has(email.trim().toLowerCase());
}

/**
 * The allowlist, read once per isolate.
 *
 * Cache discipline mirrors `runAttemptColumnsPresent`: a SUCCESSFUL read is cached
 * because the function is IMMUTABLE and only changes by migration, and a FAILURE is not,
 * so one network blip cannot disable the top-up for the isolate's life. An EMPTY array
 * is treated as a failed read rather than as "there are no demo accounts" — the list is
 * never legitimately empty, and believing an empty one would disable the feed silently.
 */
async function demoAccountEmails(): Promise<ReadonlySet<string> | null> {
  if (demoEmailCache) return demoEmailCache;
  try {
    const { data, error } = await supabaseAdmin.rpc("demo_account_emails");
    if (error || !Array.isArray(data) || data.length === 0) return null;
    demoEmailCache = normalizeDemoEmails(data);
    return demoEmailCache;
  } catch {
    return null;
  }
}

/** True only when the workspace owner is an internal demo/sample account.
 *  Reads auth.users.email (the authoritative demo signal; profiles carries no
 *  email column). Fails CLOSED: any error resolves to false, so a real signup
 *  can never receive the synthetic feed; at worst a demo account misses a
 *  harmless top-up. The allowlist is resolved FIRST so that an unreadable list
 *  costs no per-workspace user lookup. */
async function isDemoWorkspaceOwner(ownerId: string): Promise<boolean> {
  try {
    const allowlist = await demoAccountEmails();
    if (!allowlist) return false;
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(ownerId);
    if (error) return false;
    return isDemoAccountEmail(data?.user?.email, allowlist);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/hooks/sense-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("ambient.sense-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id, last_auto_sense_at")
            .eq("auto_sense_enabled", true)
            .order("last_auto_sense_at", { ascending: true, nullsFirst: true })
            .limit(MAX_WORKSPACES);

          if (error) {
            // Pre-migration tolerance: auto_sense_enabled may not exist yet.
            const code = (error as { code?: string }).code;
            if (code === "42703" || code === "PGRST204") {
              return json({ ok: true, processed: 0, note: "auto_sense not migrated yet" });
            }
            return json({ ok: false, error: error.message }, 500);
          }

          // PC-08: the "Overnight signal sweep" routine's per-workspace off
          // switch. A workspace with an explicit disabled pref for
          // "sense-sweep" is skipped even though auto_sense_enabled is on --
          // the routines toggle is a second, more legible gate a workspace
          // owner actually understands, layered on top of the original flag
          // rather than replacing it.
          const candidateIds = (workspaces ?? []).map((w) => w.id);
          let disabledWorkspaceIds = new Set<string>();
          if (candidateIds.length > 0) {
            const { data: prefs } = await routinesDb
              .from("workspace_routine_prefs")
              .select("workspace_id,enabled")
              .eq("routine_id", "sense-sweep")
              .eq("enabled", false)
              .in("workspace_id", candidateIds);
            disabledWorkspaceIds = new Set((prefs ?? []).map((p) => p.workspace_id as string));
          }

          const results: Array<{
            workspace_id: string;
            tagged?: number;
            seeded?: number;
            github_inserted?: number;
            github_source?: string;
            // SF-CONNECTORS: per-provider {inserted, source} for the inside-out fleet,
            // keyed by provider id (intercom/stripe/slack/zendesk/hubspot/…).
            connectors?: Record<string, { inserted: number; source: string }>;
            // SF-MCP: per-server {inserted, source} for the absorbed hosted MCP fleet
            // (Linear/Gong/Granola/Enterpret), keyed by server id.
            mcp_servers?: Record<string, { inserted: number; source: string }>;
            posthog_rows?: number;
            posthog_signals?: number;
            posthog_skipped?: boolean;
            error?: string;
          }> = [];

          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              if (disabledWorkspaceIds.has(ws.id)) {
                results.push({ workspace_id: ws.id, error: "routine disabled" });
                continue;
              }
              const tagged = await tagUntaggedSignals(ws.owner_id, ws.id);
              const seeded = await topUpDemoFeed(ws.owner_id, ws.id);
              const gh = await ingestGithubSignals(ws.owner_id, ws.id).catch(() => null);
              const posthog = await ingestPostHogAnalytics(ws.id, ws.owner_id).catch(() => null);
              // Inside-out customer-voice fleet: iterate the PULL_INGESTORS registry so a
              // new connector needs no edit here. Each fails safe (source "none") when the
              // workspace has no credential or its tier lacks inflow, so this never throws.
              // Run all ingestors in parallel instead of serially
              const ingestResults = await Promise.all(
                PULL_INGESTORS.map((c) => c.ingest(ws.owner_id, ws.id).catch(() => null)),
              );
              const connectors: Record<string, { inserted: number; source: string }> = {};
              for (let i = 0; i < PULL_INGESTORS.length; i++) {
                const c = PULL_INGESTORS[i];
                const r = ingestResults[i];
                connectors[c.provider] = {
                  inserted: r?.inserted ?? 0,
                  source: r?.source ?? "none",
                };
              }
              const mcp = await ingestMcpSignals(ws.owner_id, ws.id).catch(() => null);
              await supabaseAdmin
                .from("workspaces")
                .update({ last_auto_sense_at: new Date().toISOString() })
                .eq("id", ws.id);
              // PC-08: the routine's own "last run" receipt (best-effort --
              // a missing pref row is fine, it just means "never toggled").
              void routinesDb
                .from("workspace_routine_prefs")
                .upsert(
                  {
                    workspace_id: ws.id,
                    routine_id: "sense-sweep",
                    last_run_at: new Date().toISOString(),
                  },
                  { onConflict: "workspace_id,routine_id" },
                )
                .then(
                  () => {},
                  () => {},
                );
              results.push({
                workspace_id: ws.id,
                tagged,
                seeded,
                github_inserted: gh?.inserted ?? 0,
                github_source: gh?.source ?? "none",
                connectors,
                mcp_servers: mcp?.servers
                  ? Object.fromEntries(
                      Object.entries(mcp.servers).map(([k, v]) => [
                        k,
                        { inserted: v.inserted, source: v.source },
                      ]),
                    )
                  : {},
                posthog_rows: posthog?.rowsUpserted ?? 0,
                posthog_signals: posthog?.signalsInserted ?? 0,
                posthog_skipped: posthog?.skipped ?? false,
              });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, results });
        });
      },
    },
  },
});

/** Normalize + auto-tag the workspace's untagged signals (empty tags or missing sentiment).
 *  Workspace-scoped (the auto_sense flag is per-workspace, mirroring cluster-tick). Bounded
 *  scan + bounded updates; every write traces to the pure tagSignalUpdate. */
async function tagUntaggedSignals(ownerId: string, workspaceId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("signals")
    .select("id, title, content, source, tags, sentiment")
    .eq("user_id", ownerId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(SCAN_LIMIT);
  if (error || !data) return 0;

  // Collect all updates, then batch-upsert instead of serial UPDATEs.
  // Every row carries its NOT NULL columns (content, user_id, workspace_id) as
  // well as the tag fields: an upsert can insert, so a partial row would fail
  // the whole batch if the source row disappeared between this read and the
  // write.
  const rowsToUpdate: Array<{
    id: string;
    content: string;
    user_id: string;
    workspace_id: string;
    tags: string[];
    sentiment: string | null;
  }> = [];

  for (const row of data) {
    if (rowsToUpdate.length >= MAX_TAG_UPDATES) break;
    const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
    const hasSentiment =
      row.sentiment === "positive" || row.sentiment === "neutral" || row.sentiment === "negative";
    if (tags.length > 0 && hasSentiment) continue; // already sensed
    const u = tagSignalUpdate({
      title: row.title,
      content: row.content,
      source: row.source,
      tags,
      sentiment: row.sentiment,
    });
    if (!u || !u.changed) continue;
    rowsToUpdate.push({
      id: row.id,
      content: row.content,
      user_id: ownerId,
      workspace_id: workspaceId,
      tags: u.tags,
      sentiment: u.sentiment,
    });
  }

  // Batch upsert: single round-trip instead of serial UPDATEs
  if (rowsToUpdate.length === 0) return 0;
  const { error: upErr } = await supabaseAdmin
    .from("signals")
    .upsert(rowsToUpdate, { onConflict: "id" });
  return upErr ? 0 : rowsToUpdate.length;
}

/** Insert the demo feed for a near-empty workspace, idempotently (by exact content match),
 *  so the ambient loop has input until a real source is bound. workspace_id is set explicitly
 *  (NOT NULL with an auth-context default the service-role insert cannot satisfy). */
async function topUpDemoFeed(ownerId: string, workspaceId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("signals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId)
    .eq("workspace_id", workspaceId);
  if ((count ?? 0) >= DEMO_TOPUP_THRESHOLD) return 0;

  // Real signups never see fabricated signals. The demo feed exists only to give
  // internal demo/sample accounts something to sense before a source is bound;
  // gate it on the owner being a demo account (checked after the cheap count so a
  // populated workspace of any kind skips the auth lookup entirely).
  if (!(await isDemoWorkspaceOwner(ownerId))) return 0;

  const { data: existing } = await supabaseAdmin
    .from("signals")
    .select("content")
    .eq("user_id", ownerId)
    .eq("workspace_id", workspaceId)
    .limit(500);
  const seen = new Set((existing ?? []).map((r) => (r.content || "").trim()));

  const toInsert = DEMO_FEED.filter((d) => !seen.has(d.content.trim())).map((d) => ({
    user_id: ownerId,
    workspace_id: workspaceId,
    source: d.source,
    title: d.title,
    content: d.content,
    tags: autoTag(`${d.title} ${d.content}`, d.source),
    sentiment: inferSentiment(`${d.title} ${d.content}`),
  }));
  if (toInsert.length === 0) return 0;

  const { error } = await supabaseAdmin.from("signals").insert(toInsert);
  return error ? 0 : toInsert.length;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
