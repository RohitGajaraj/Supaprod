/**
 * SW-6 (mission 3.12, cold start): the connect -> ingest link.
 *
 * Audit finding: connecting a source never produced signals for a fresh
 * workspace. All pull ingestion runs only inside sense-tick, which filters on
 * auto_sense_enabled (historically default false), and nothing kicked a first
 * ingest at connect time, so Discover's "reading starts the moment a source is
 * linked" promise was false for every real signup.
 *
 * This helper is called right after a connection is saved (gateway save +
 * GitHub App callback). It does three cheap, idempotent things:
 *   1. flips auto_sense_enabled ON for the user's owned workspaces (covers
 *      workspaces created before the default flipped to true),
 *   2. NULLs last_auto_sense_at so sense-tick's nullsFirst ordering puts this
 *      workspace at the front of the very next tick (<= 5 min to steady state),
 *   3. best-effort inline ingest of the JUST-CONNECTED provider against the
 *      user's default workspace, time-bounded, so the first signals usually
 *      land while the user is still in the connect flow.
 *
 * Never throws: a failed kick must never break saving the connection.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ingestGithubSignals } from "@/lib/connectors/providers/github-ingest.server";
import { PULL_INGESTORS } from "@/lib/connectors/providers/pull-ingestors.server";

const INLINE_INGEST_TIMEOUT_MS = 8_000;

export type FirstIngestResult = {
  workspaceId: string | null;
  inserted: number;
  timedOut: boolean;
};

export async function kickFirstIngest(
  userId: string,
  provider?: string,
): Promise<FirstIngestResult> {
  const result: FirstIngestResult = { workspaceId: null, inserted: 0, timedOut: false };
  try {
    // 1+2) Arm sensing and jump the queue for everything this user owns.
    await supabaseAdmin
      .from("workspaces")
      .update({ auto_sense_enabled: true, last_auto_sense_at: null })
      .eq("owner_id", userId);

    // Default workspace = oldest owned (ensureDefaultWorkspace creates the first).
    const { data: ws } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!ws?.id) return result;
    result.workspaceId = ws.id as string;

    // 3) Inline ingest of the just-connected provider, bounded so the connect
    //    response is never held hostage by a slow upstream API.
    if (!provider) return result;
    const run = async (): Promise<number> => {
      if (provider === "github") {
        const r = await ingestGithubSignals(userId, ws.id as string).catch(() => null);
        return r?.inserted ?? 0;
      }
      const ingestor = PULL_INGESTORS.find((p) => p.provider === provider);
      if (!ingestor) return 0;
      const r = await ingestor.ingest(userId, ws.id as string).catch(() => null);
      return r?.inserted ?? 0;
    };
    const timeout = new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), INLINE_INGEST_TIMEOUT_MS),
    );
    const raced = await Promise.race([run(), timeout]);
    if (raced === "timeout") {
      result.timedOut = true; // sense-tick finishes the job within minutes
    } else {
      result.inserted = raced;
    }
    return result;
  } catch {
    return result;
  }
}
