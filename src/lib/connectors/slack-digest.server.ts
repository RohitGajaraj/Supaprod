// JNY-05: the ambient stakeholder loop's Slack write-back half. The email leg
// (notifications.functions.ts's generateDigest) is per-user, scheduled on each
// user's own cadence — Slack posting is deliberately NOT nested in that loop.
// A shared team channel must be posted to once per workspace per period, not
// once per user who happens to have the email toggle on, so this runs as its
// own pass over workspaces that have bound a "digest_channel" (sendDueDigests
// calls this once per due workspace, separately from the per-user email loop).
//
// Fixed to the 'exec' audience and a ~daily cadence for v1 — no UI exists yet to
// pick a different audience or frequency for the shared channel post, and adding
// one before anyone asks for it would be speculative. Known simplification,
// documented in docs/features/stakeholder-digest.md.

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveProviderAuth } from "./resolve.server";
import { tokenBearer } from "./providers/bearer.server";
import { postMessage, type SlackPostResult } from "./providers/slack.server";
import { loadNewestDecisionBrief } from "@/lib/stakeholder-pack.functions";
import { loadOutcomeReceiptSnapshot } from "@/lib/stakeholder-update.functions";
import { buildOutcomeReceipt } from "@/lib/stakeholder-update";
import { composeStakeholderPack, renderPackMarkdown } from "@/lib/stakeholder-pack";

const SLACK_DIGEST_DUE_MS = 20 * 60 * 60 * 1000; // ~daily, mirrors notifications.functions.ts's DAILY_DUE_MS

/** Pure: Slack's own required escaping (docs: api.slack.com/reference/surfaces/formatting#escaping).
 *  Without this, a literal `<!channel>`, `<@U…>`, or `<https://evil|label>` inside a decision's
 *  title/rationale (ordinary workspace-member-authored PRD text, never sanitized upstream) would
 *  be interpreted by Slack as a live directive — a mass-ping or a spoofed link rendered under
 *  Cadence's own trusted bot identity. Must run BEFORE the markdown->mrkdwn conversion below;
 *  neither `#` headings nor `**bold**` involve these three characters, so order is safe. */
function escapeSlackText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Pure: renderPackMarkdown's output -> Slack mrkdwn. Escapes Slack's control characters
 *  first (see escapeSlackText), then converts syntax: Slack has no heading syntax
 *  (headings become bold lines) and bolds with a single asterisk (markdown's
 *  double asterisk is converted); underscored italics already match Slack's syntax. */
export function toSlackMrkdwn(markdown: string): string {
  return escapeSlackText(markdown)
    .split("\n")
    .map((line) => {
      const heading = line.match(/^#{1,6}\s+(.*)$/);
      if (heading) return `*${heading[1]}*`;
      return line.replace(/\*\*(.+?)\*\*/g, "*$1*");
    })
    .join("\n");
}

/** Pure: whether a Slack digest post is due given the binding's last-posted stamp. */
export function isSlackDigestDue(lastPostedAt: unknown, now: number): boolean {
  if (typeof lastPostedAt !== "string") return true;
  const last = Date.parse(lastPostedAt);
  return !Number.isFinite(last) || now - last >= SLACK_DIGEST_DUE_MS;
}

export type SlackDigestResult = { posted: boolean; reason: string };

/**
 * Posts the workspace's newest decision (as an exec-audience pack) to its bound
 * Slack "digest_channel", if one is configured, the workspace's tier permits
 * write-back, and the last post is due. Best-effort throughout: every failure
 * mode (not configured, insufficient tier, no token, no decision yet, the Slack
 * API call itself) degrades to { posted: false, reason } — never throws, so a
 * misconfigured or free-tier workspace never breaks the digest-tick cron.
 */
export async function postStakeholderDigestToSlack(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<SlackDigestResult> {
  let resolved;
  try {
    resolved = await resolveProviderAuth({
      workspaceId,
      provider: "slack",
      resourceKind: "digest_channel",
      requiredCapability: "outflow",
    });
  } catch (e) {
    // assertConnectorCapability throws a user-readable upgrade prompt on an
    // insufficient tier — that IS the reason, not an error to propagate.
    return { posted: false, reason: e instanceof Error ? e.message : String(e) };
  }

  if (resolved.source !== "workspace_binding" || !resolved.binding) {
    return { posted: false, reason: "no digest_channel binding configured for this workspace" };
  }
  const token = tokenBearer(resolved.auth);
  if (!token) {
    return { posted: false, reason: "no usable bearer token for this workspace's Slack binding" };
  }
  if (!isSlackDigestDue(resolved.binding.config.last_posted_at, Date.now())) {
    return { posted: false, reason: "not due yet" };
  }

  let loaded: Awaited<ReturnType<typeof loadNewestDecisionBrief>>;
  try {
    loaded = await loadNewestDecisionBrief(supabase, workspaceId);
  } catch {
    loaded = null;
  }
  if (!loaded) {
    return { posted: false, reason: "no decision to share yet" };
  }

  // RPT-49: lead the shared-channel post with the same outcome receipt (what shipped, what it
  // did, calibration). Workspace-scoped (no single user owns the shared-channel post, so userId
  // is null and the decisions figure counts the whole workspace). Best-effort: a receipt failure
  // or a quiet period just posts the decision pack alone.
  let receiptText = "";
  try {
    const snapshot = await loadOutcomeReceiptSnapshot(supabase, null, workspaceId);
    const receipt = buildOutcomeReceipt(snapshot);
    if (receipt) receiptText = `${toSlackMrkdwn(receipt)}\n\n`;
  } catch {
    receiptText = "";
  }

  const pack = composeStakeholderPack(loaded.brief, "exec");
  const markdown = renderPackMarkdown(pack, { asOf: new Date().toISOString().slice(0, 10) });
  const text = `${receiptText}${toSlackMrkdwn(markdown)}`;

  const result: SlackPostResult = await postMessage(token, resolved.binding.resourceId, text);
  if (!result.posted) {
    return { posted: false, reason: result.reason };
  }

  // Best-effort stamp — a failed write here only means the next tick posts again
  // early; it must never turn a successful Slack post into a reported failure.
  try {
    await supabase
      .from("connection_bindings")
      .update({ config: { ...resolved.binding.config, last_posted_at: new Date().toISOString() } })
      .eq("id", resolved.binding.id);
  } catch {
    // ignore
  }

  return { posted: true, reason: "sent" };
}
