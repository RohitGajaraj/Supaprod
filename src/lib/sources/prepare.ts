/**
 * Signal Fabric - the pure core of the sink.
 *
 * Given a batch of candidates and the set of external_ids already present for this
 * (user, workspace), decide what to insert: screen untrusted items (quarantine a
 * structural injection, flag a borderline one), drop duplicates (stored AND within
 * the batch), and normalize tags/sentiment. No I/O - fully unit-testable.
 * sink.server.ts wraps this with the dedup query and the insert.
 *
 * THIS IS ONLY HALF THE DEDUP, and saying so here matters because for four months
 * this header read as though it were all of it. The rule below keys on `external_id`,
 * which a source has to supply. `signals.log` - the tool the autonomous loop's whole
 * Discover crew is told to call - supplies none, so on 2026-08-22 the branch never
 * fired and thirteen restatements of two sentences were stored as thirteen
 * independent signals, promoting a theme that burned a month of credits in 80
 * minutes. 92% of the rows in `public.signals` carry no external_id, so this rule
 * has never covered the common case.
 *
 * The other half is `restatement.ts`, which recognises the same OBSERVATION rather
 * than the same item. It cannot live in this function and that is not an accident:
 * it needs the row's embedding, and the embedding is attached after prepare runs.
 * The sink runs the two in order. Both are pure; only their inputs differ.
 */
import { autoTag, inferSentiment } from "@/lib/sensing/normalize";
import { screenIngestText, INGEST_REVIEW_TAG } from "@/lib/ingest-guardrails";
import type { SignalCandidate } from "./kinds";

/** A row ready to insert into public.signals. */
export type PreparedSignalRow = {
  user_id: string;
  workspace_id: string;
  project_id: string | null;
  external_id: string | null;
  source: string;
  source_kind: string;
  title: string;
  content: string;
  url: string | null;
  tags: string[];
  sentiment: string;
};

export type PrepareOutput = {
  rows: PreparedSignalRow[];
  /** Skipped by dedup (already stored, or a duplicate external_id earlier in the batch). */
  skipped: number;
  /** Rejected by the injection screen (structural attack from an untrusted source). */
  quarantined: number;
};

export function prepareSignalRows(
  userId: string,
  workspaceId: string,
  candidates: SignalCandidate[],
  seenExternalIds: ReadonlySet<string>,
  opts?: { productId?: string | null },
): PrepareOutput {
  const productId = opts?.productId ?? null;
  // Combine stored ids with ids emitted earlier in THIS batch so a duplicate
  // external_id never reaches the unique index twice in one insert.
  const seen = new Set(seenExternalIds);
  const rows: PreparedSignalRow[] = [];
  let skipped = 0;
  let quarantined = 0;

  for (const c of candidates) {
    // 1. Dedup: a candidate with a known external_id is already stored (or seen this batch).
    if (c.externalId && seen.has(c.externalId)) {
      skipped++;
      continue;
    }

    // 2. Screen untrusted free text (title + content + source - all reach the agents).
    let reviewTag = false;
    if (c.untrusted) {
      const decision = screenIngestText(`${c.title} ${c.content ?? ""} ${c.source ?? ""}`);
      if (decision === "quarantine") {
        quarantined++;
        continue; // never store a structural injection
      }
      reviewTag = decision === "flag";
    }

    // 3. Normalize: signals.content is NOT NULL (fall back to title); derive
    //    tags/sentiment when the producer did not supply them.
    const content = (c.content ?? "").trim() || c.title;
    const basisText = `${c.title} ${content}`;
    const tags = [
      ...(c.tags ?? autoTag(basisText, c.source)),
      ...(reviewTag ? [INGEST_REVIEW_TAG] : []),
    ];
    const sentiment = c.sentiment ?? inferSentiment(basisText);

    if (c.externalId) seen.add(c.externalId);
    rows.push({
      user_id: userId,
      workspace_id: workspaceId,
      project_id: productId,
      external_id: c.externalId ?? null,
      source: c.source,
      source_kind: c.sourceKind,
      title: c.title,
      content,
      url: c.url ?? null,
      tags,
      sentiment,
    });
  }

  return { rows, skipped, quarantined };
}
