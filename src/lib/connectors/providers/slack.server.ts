// SF-CONNECTORS (Signal Fabric Phase 2) - Slack team-chat connector adapter (server-only).
// Validates a Slack bot token and enumerates public channels. The ingest side
// (slack-ingest.server.ts) pulls recent messages from one feedback channel as signals
// through writeSignals. Mirrors intercom.server.ts. Token unwrap is the shared
// tokenBearer helper (bearer.server.ts) - env/vault creds carry a raw bearer,
// gateway/github_app do not.
//
// Slack quirk: the Web API answers HTTP 200 even on failure, putting the real result in
// { ok: false, error } in the body. So success is always res.ok && body.ok === true -
// never trust the HTTP status alone.
//
// JNY-05: postMessage is the outflow half (the ambient stakeholder digest's write-back),
// gated Business-tier at the call site (slack-digest.server.ts) via
// resolveProviderAuth({requiredCapability:"outflow"}) — this adapter itself is tier-blind.

import type { ConnectorAdapter, ResourceItem, ValidateResult } from "./types.server";
import { tokenBearer } from "./bearer.server";

export const SLACK_API = "https://slack.com/api";

export const slackAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const token = tokenBearer(auth);
    if (!token) return { ok: false, detail: "unsupported auth kind for slack" };
    try {
      const res = await fetch(`${SLACK_API}/auth.test`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { ok?: boolean; team?: string; error?: string };
      const ok = res.ok && body.ok === true;
      if (!ok)
        return { ok: false, detail: body.error ?? `Slack token check failed (${res.status})` };
      return { ok: true, accountLabel: body.team ?? null };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  },

  async listResources(auth, kind): Promise<ResourceItem[]> {
    // "channel" = the inflow feedback channel; "digest_channel" = the JNY-05
    // outflow destination. Both list the same public channel set.
    if (kind !== "channel" && kind !== "digest_channel") return [];
    const token = tokenBearer(auth);
    if (!token) return [];
    try {
      const res = await fetch(`${SLACK_API}/conversations.list?types=public_channel&limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as {
        ok?: boolean;
        channels?: Array<{ id?: string; name?: string }>;
      };
      if (!body.ok) return [];
      return (body.channels ?? [])
        .filter((c) => c.id != null)
        .map((c) => ({ id: String(c.id), label: `#${c.name ?? c.id}` }));
    } catch {
      return [];
    }
  },
};

export type SlackPostResult = { posted: boolean; reason: string };

/** Posts one message to a channel. Never throws — mirrors sendEmail's {sent,reason} shape. */
export async function postMessage(
  token: string,
  channelId: string,
  text: string,
): Promise<SlackPostResult> {
  try {
    const res = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ channel: channelId, text, mrkdwn: true }),
    });
    const body = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || body.ok !== true) {
      return { posted: false, reason: body.error ?? `Slack post failed (${res.status})` };
    }
    return { posted: true, reason: "sent" };
  } catch (e) {
    return { posted: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
