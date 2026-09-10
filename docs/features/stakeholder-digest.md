# JNY-05 — The ambient stakeholder loop

> _Created: 2026-07-03 · Last updated: 2026-07-07_

> Status · ✅ Shipped (email leg + Slack write-back both code-complete) · 2026-07-03 · Settings > Notifications (email) + `/sources` Workspace bindings (Slack) · No new agent

## What it does

Settings > Notifications gains a "Stakeholder update" toggle. Once on, the user's already-scheduled digest email (FS-03's reach channel) also carries the workspace's newest decision, framed for the audience they pick (executives, engineering, or board), riding the exact same send instead of a separate one.

A workspace admin can additionally bind a Slack channel (`/sources` → Workspace bindings → Slack → "Stakeholder digest channel") so the same newest-decision pack is also posted to a shared team channel, once per workspace per day, on the Business tier — the exact write-back capability the 2026-06-27 integration-tiering ruling reserved for that tier.

## Why it exists

Per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8 (the founder's "keeping everyone in the loop" ask, the pain survey's number one PM time-sink): the one-keystroke status update (`ShareStatusButton`) already existed, and FS-03's scheduled digest already existed, and the exec/eng/board pack composer (STAKEHOLDER-PACK, v11 #19) already existed. Nobody had connected them into a recurring, audience-tuned send. Board entry: `docs/planning/SOURCE-OF-TRUTH.md` row `JNY-05`.

## Where to find it

- Email: Settings > You > Notifications (`?section=notifications`), the "Stakeholder update" card below "Digest Settings."
- Slack: `/sources` > Workspace bindings > Slack > "Stakeholder digest channel" (a bindable resource alongside Slack's existing "Channel" — the same connection, two purposes).

## Demo script

1. Open Settings > Notifications, turn on "Include a stakeholder update in my digest," pick "Executives," save.
2. Explain: the next time your digest fires (daily or weekly, per your existing frequency), it now also includes your workspace's newest decision, written for that audience, no extra send.
3. Point at `docs/decisions/` or a live PRD's decision record as "the newest decision" the pack would pull from.
4. On a Business-tier workspace with Slack connected: open `/sources`, bind a channel under Slack's "Stakeholder digest channel," and explain that the next `digest-tick` posts the same newest-decision pack there — once per workspace per day, independent of any one user's email preference.

## How it works

**Email leg:**

- Migration `20260703150000_jny05_stakeholder_digest.sql`: two columns on `user_notification_preferences` (`digest_stakeholder_update boolean default false`, `digest_stakeholder_audience text default 'exec'`, checked to `exec`/`eng`/`board`). No new table.
- `src/lib/stakeholder-pack.functions.ts`: extracted `loadNewestDecisionBrief(supabase, workspaceId, wantId?)`, the data-loading core `getStakeholderPack` already had (decision + lineage evidence + supersession standing + recorded outcome), so the digest composer reuses it instead of a second copy.
- `src/lib/notifications.functions.ts`'s `generateDigest`: when `digest_stakeholder_update` is on, resolves the caller's workspace via `ensure_user_default_workspace(_user_id)` with the **explicit** `userId` (not `current_user_default_workspace()`, which wraps `auth.uid()` and is null when this runs under the service-role admin client from the `digest-tick` cron; caught during self-review, the same service-role-vs-session-context bug class already fixed once for `ai_events`), loads the newest decision, composes one audience's pack (`composeStakeholderPack`), and appends its rendered markdown as a "Stakeholder update:" section in the digest content. Best-effort: no workspace, no decisions yet, or any lookup failure just skips the section, never blocks the rest of the digest.
- No changes to the manual `ShareStatusButton`/`StatusUpdateDialog` on Today; that stays the on-demand, copy-to-clipboard path it already was.
- `src/components/settings/NotificationsTab.tsx`: the toggle + audience `<select>`, following the existing card pattern exactly.

**Slack write-back leg (shipped 2026-07-03):**

- `src/lib/connectors/registry.ts`: Slack's `capabilities.outflow` flipped to `true` and a second `resourceTypes` entry added — `{ kind: "digest_channel", label: "Stakeholder digest channel" }` — alongside the pre-existing `channel` (the customer-voice read channel). Both resource kinds are unaffected by each other: the existing inflow ingest (`slack-ingest.server.ts`) still resolves with `resourceKind: "channel"` + `requiredCapability: "inflow"`, entirely independent of the new `digest_channel` + `outflow` path. This is deliberately the same shape as `github`/`linear`/`notion`'s existing entries (one connector, both directions), not a new abstraction.
- Reuses the existing `/sources` Workspace-bindings UI and `BindingPicker` component as-is — `resourceKind` was already a free-string column with no allow-list, so adding the new resource type required zero new UI code.
- `src/lib/connectors/providers/slack.server.ts`: new `postMessage(token, channelId, text)` calling `chat.postMessage`, mirroring `sendEmail`'s never-throws `{sent/posted, reason}` shape. `listResources` extended to answer for `digest_channel` too (same public-channel list Slack's inflow side already lists).
- New `src/lib/connectors/slack-digest.server.ts` — `postStakeholderDigestToSlack(supabase, workspaceId)`: resolves the workspace's `digest_channel` binding through `resolveProviderAuth({ workspaceId, provider: "slack", resourceKind: "digest_channel", requiredCapability: "outflow" })`, which enforces the 2026-06-27 Business-tier gate (a tier-check throw degrades to `{posted:false, reason}`, never falls through to posting) before any token is materialized. Loads the newest decision (same `loadNewestDecisionBrief` the email leg uses), composes the pack fixed to the `'exec'` audience (v1 simplification — no picker exists yet for a shared-channel destination), converts it to Slack mrkdwn, posts, and stamps the binding's `config.last_posted_at` for a ~daily per-workspace dedupe. `resolveProviderAuth`'s returned binding shape gained one field, `id: binding.id` (purely additive), so this stamp can target the right row.
- `src/lib/notifications.functions.ts`: a new `sendDueSlackDigests()` runs as a second, workspace-scoped pass inside `sendDueDigests` — **deliberately not nested in the per-user email loop**, since a shared team channel must be posted to once per workspace per period, not once per user who happens to have the email toggle on. `digest-tick`'s JSON response now reports `slackPosted`.
- Escaping fix (caught by a dispatched security review before commit): `toSlackMrkdwn` now escapes Slack's `&`/`<`/`>` control characters before converting markdown syntax, so a decision title/rationale containing a literal `<!channel>`, `<@U…>`, or `<https://evil|label>` renders as inert text instead of firing as a live Slack directive (mass-ping or a spoofed link under Supaprod's own bot identity).

## Governance & guardrails

- Email: opt-in, off by default (`digest_stakeholder_update` defaults `false`); reuses the existing RLS-scoped, per-user digest send path.
- Slack: opt-in via an explicit workspace binding (RLS-gated: `is_workspace_member` + `connection_owner_in_workspace`, the same policy every other connector binding uses); gated to the Business tier at the credential-resolution chokepoint, fails closed on any tier-lookup error.
- Both legs degrade silently: a workspace/decision lookup failure, an insufficient tier, a missing binding, or a Slack API error never breaks the operational half of the digest (approvals/health/budget/drift) or throws out of the cron.
- No agentic/autonomous decision is involved in the Slack post — it mirrors the exact same content the email leg already sends automatically with no approval gate, so it does not route through the agent loop's separate approval-lane machinery (that machinery governs autonomous agent tool calls, e.g. an agent unilaterally deciding to file a ticket — not a deterministic, user-configured, cron-scheduled digest mirror).

## Verification checklist

- [x] `bunx tsc --noEmit` clean.
- [x] `bun test` 2203 pass / 0 fail (12 new for the Slack leg: `toSlackMrkdwn` heading/bold/escaping incl. 4 dedicated mention/link-injection-neutralization cases, and `isSlackDigestDue`'s dedupe window; 3 from the email leg: stakeholder-off-by-default, graceful-no-workspace, and the full enabled-with-a-decision happy path).
- [x] `bash scripts/check-migrations.sh` 0 apply-fatal (the Slack leg added zero migrations — it reuses `connection_bindings`' existing `resource_kind` free-text column and `config` JSONB).
- [x] `bun run lint` clean on every touched file (the whole-repo `lint` script itself carries a large pre-existing, unrelated backlog per the founder's velocity ruling — not this feature's gate).
- [x] Independent security review (dispatched this session) of the Slack write-back path: confirmed the KI-34 cross-tenant binding guard is untouched, the Business-tier gate cannot be bypassed, the channel ID cannot redirect the request (JSON body data against a hardcoded API origin, never the URL), and no secret ever reaches an error message; caught and this session fixed the mention/link-escaping gap described above.
- [ ] Manual walk on the primary checkout (this worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger` failure every other item in this lane has also hit; `tsc` + `bun test` are the real gates here).

## Known limits / out of scope

- **Founder-gated to go fully live (same pattern as the SF-CONNECTORS row):** the Slack write-back path is code-complete and gate-green, but posting anything for real needs a genuine Slack credential — either `SLACK_BOT_TOKEN` (the existing env fallback) or a registered OAuth client (`SLACK_APP_USER_CONNECTOR_CLIENT_ID`) — with the `chat:write` scope added (the existing inflow credential only needed read scopes), registered by the founder at api.slack.com/apps. Until then, `resolveProviderAuth` resolves no auth and the post is a silent, logged no-op.
- Fixed to the `'exec'` audience and a ~daily cadence for the Slack post — no UI exists yet to pick a different audience or frequency for the shared channel, and building one before anyone asks for it would be speculative.
- Only the workspace's single newest decision is included on both legs, matching `getStakeholderPack`'s own existing default; there is no digest of multiple recent decisions.

## Related

- `docs/planning/SOURCE-OF-TRUTH.md` row `JNY-05`.
- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.
- [`../strategy/session-decisions.md`](../strategy/session-decisions.md) (2026-06-27 integration tiering, the Slack write-back gate).
- `docs/features/README.md` index.

## Settings/connections audit note (2026-07-07)

Reviewed in the `settings_connections` consumer/enterprise-grade pass. The "Stakeholder update" toggle + audience picker in `NotificationsTab` (Settings > Notifications) is real and wired end to end (no change to behavior). The only touch: the notifications preferences table swapped two banned hex-fallback dividers (`var(--soft-stone, #eaeaea)`) for the semantic `var(--hairline)` token, so the pane is hex-clean under the Obsidian theme. The Slack digest-channel binding on `/sources` also benefits from the workspace-bindings first-class-object rework (see [`settings-ia.md`](./settings-ia.md)).
