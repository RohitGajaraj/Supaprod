// SW-7 (founder goal, 2026-07-09): pull recent Gmail inbox messages as
// customer-voice/lead signals, through the writeSignals sink (dedup via
// external_id, source_kind "pull_connector"). Mirrors slack-ingest.server.ts's
// shape: rule-based, zero AI spend, untrusted:true since email content is
// external human-written text the sink screens for prompt injection before
// storing. Credential resolution is per-connected-account (resolveSuiteAuth),
// not the single-connection resolveProviderAuth every other ingest adapter
// uses, since a user can connect multiple Gmail inboxes - this reads the
// oldest ("primary") one, same convention getPrimaryConnection uses for
// calendar reads.

import { resolveSuiteAuth } from "./suite-resolve.server";
import { writeSignals } from "@/lib/sources/sink.server";
import type { SignalCandidate } from "@/lib/sources/kinds";

const MAX_ITEMS = 15;
const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

export type GmailIngestResult = { inserted: number; skipped: number; source: string };

type GmailListResponse = { messages?: Array<{ id?: string }> };
type GmailHeader = { name?: string; value?: string };
type GmailMessage = {
  id?: string;
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
};

function headerValue(headers: GmailHeader[] | undefined, name: string): string | null {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
}

/** PURE - map one Gmail message to a SignalCandidate, or null with no stable id or content. */
export function gmailMessageToCandidate(
  msg: GmailMessage,
  accountEmail: string,
): SignalCandidate | null {
  if (!msg.id) return null;
  const subject = headerValue(msg.payload?.headers, "Subject");
  const from = headerValue(msg.payload?.headers, "From");
  const snippet = msg.snippet?.trim();
  if (!subject && !snippet) return null;
  const title = (subject || snippet || "Gmail message").slice(0, 300);
  const contentParts = [from ? `From: ${from}` : null, snippet ?? null].filter(Boolean);
  return {
    externalId: `gmail:msg:${accountEmail}:${msg.id}`,
    source: "gmail",
    sourceKind: "pull_connector",
    title,
    content: (contentParts.join("\n") || title).slice(0, 1500),
    url: null,
    untrusted: true,
  };
}

async function fetchMessages(token: string): Promise<GmailMessage[]> {
  const listRes = await fetch(`${GMAIL_API}/messages?maxResults=${MAX_ITEMS}&labelIds=INBOX`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) return [];
  const list = (await listRes.json()) as GmailListResponse;
  const ids = (list.messages ?? []).map((m) => m.id).filter((id): id is string => !!id);
  if (ids.length === 0) return [];

  const messages: GmailMessage[] = [];
  for (const id of ids) {
    try {
      const res = await fetch(
        `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) messages.push((await res.json()) as GmailMessage);
    } catch {
      // One message failing to fetch shouldn't drop the rest of the batch.
    }
  }
  return messages;
}

/**
 * Pull recent Gmail inbox messages for one user's primary connected Gmail
 * account and write them as signals. Returns {inserted, skipped, source};
 * skips cleanly (source "none") when there is no connected Gmail account.
 */
export async function ingestGmailSignals(
  userId: string,
  workspaceId: string,
): Promise<GmailIngestResult> {
  const resolved = await resolveSuiteAuth(userId, "google", "mail");
  if (!resolved || !resolved.accountEmail) return { inserted: 0, skipped: 0, source: "none" };

  const messages = await fetchMessages(resolved.token);
  if (messages.length === 0) return { inserted: 0, skipped: 0, source: "gmail" };

  const candidates = messages
    .map((m) => gmailMessageToCandidate(m, resolved.accountEmail as string))
    .filter((c): c is SignalCandidate => c !== null);

  const res = await writeSignals(userId, workspaceId, candidates);
  return { inserted: res.inserted, skipped: res.skipped, source: "gmail" };
}
