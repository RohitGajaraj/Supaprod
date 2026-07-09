// SW-7 (founder goal, 2026-07-09): pull recent Outlook inbox messages as
// customer-voice/lead signals, through the writeSignals sink. Mirrors
// gmail-ingest.server.ts exactly (same resolveSuiteAuth per-account
// resolution, same untrusted:true screening), but Microsoft Graph's
// /me/messages returns subject/preview/sender in ONE call - no Gmail-style
// list-then-fetch-each-message round trip needed.

import { resolveSuiteAuth } from "./suite-resolve.server";
import { writeSignals } from "@/lib/sources/sink.server";
import type { SignalCandidate } from "@/lib/sources/kinds";

const MAX_ITEMS = 15;
const GRAPH_MESSAGES_URL =
  "https://graph.microsoft.com/v1.0/me/messages?$top=15&$select=id,subject,bodyPreview,from";

export type OutlookMailIngestResult = { inserted: number; skipped: number; source: string };

type GraphMessage = {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
};
type GraphMessagesResponse = { value?: GraphMessage[] };

/** PURE - map one Outlook message to a SignalCandidate, or null with no stable id or content. */
export function outlookMessageToCandidate(
  msg: GraphMessage,
  accountEmail: string,
): SignalCandidate | null {
  if (!msg.id) return null;
  const subject = msg.subject?.trim();
  const preview = msg.bodyPreview?.trim();
  if (!subject && !preview) return null;
  const title = (subject || preview || "Outlook message").slice(0, 300);
  const sender = msg.from?.emailAddress?.address ?? msg.from?.emailAddress?.name ?? null;
  const contentParts = [sender ? `From: ${sender}` : null, preview ?? null].filter(Boolean);
  return {
    externalId: `outlook:msg:${accountEmail}:${msg.id}`,
    source: "outlook_mail",
    sourceKind: "pull_connector",
    title,
    content: (contentParts.join("\n") || title).slice(0, 1500),
    url: null,
    untrusted: true,
  };
}

async function fetchMessages(token: string): Promise<GraphMessage[]> {
  const res = await fetch(GRAPH_MESSAGES_URL, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as GraphMessagesResponse;
  return (body.value ?? []).slice(0, MAX_ITEMS);
}

/**
 * Pull recent Outlook inbox messages for one user's primary connected
 * Outlook mailbox and write them as signals. Returns {inserted, skipped,
 * source}; skips cleanly (source "none") when there is no connected mailbox.
 */
export async function ingestOutlookMailSignals(
  userId: string,
  workspaceId: string,
): Promise<OutlookMailIngestResult> {
  const resolved = await resolveSuiteAuth(userId, "microsoft", "mail");
  if (!resolved || !resolved.accountEmail) return { inserted: 0, skipped: 0, source: "none" };

  const messages = await fetchMessages(resolved.token);
  if (messages.length === 0) return { inserted: 0, skipped: 0, source: "outlook_mail" };

  const candidates = messages
    .map((m) => outlookMessageToCandidate(m, resolved.accountEmail as string))
    .filter((c): c is SignalCandidate => c !== null);

  const res = await writeSignals(userId, workspaceId, candidates);
  return { inserted: res.inserted, skipped: res.skipped, source: "outlook_mail" };
}
