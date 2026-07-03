# JNY-05 — The ambient stakeholder loop

> Status · ◐ Shipped (email leg complete; Slack write-back founder-gated) · 2026-07-03 · Settings > Notifications, riding FS-03's digest cron · No new agent

## What it does

Settings > Notifications gains a "Stakeholder update" toggle. Once on, the user's already-scheduled digest email (FS-03's reach channel) also carries the workspace's newest decision, framed for the audience they pick (executives, engineering, or board), riding the exact same send instead of a separate one.

## Why it exists

Per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8 (the founder's "keeping everyone in the loop" ask, the pain survey's number one PM time-sink): the one-keystroke status update (`ShareStatusButton`) already existed, and FS-03's scheduled digest already existed, and the exec/eng/board pack composer (STAKEHOLDER-PACK, v11 #19) already existed. Nobody had connected them into a recurring, audience-tuned send. Board entry: `docs/planning/feature-dashboard.md` row `JNY-05`.

## Where to find it

Settings > You > Notifications (`?section=notifications`), a new "Stakeholder update" card below "Digest Settings."

## Demo script

1. Open Settings > Notifications, turn on "Include a stakeholder update in my digest," pick "Executives," save.
2. Explain: the next time your digest fires (daily or weekly, per your existing frequency), it now also includes your workspace's newest decision, written for that audience, no extra send.
3. Point at `docs/decisions/` or a live PRD's decision record as "the newest decision" the pack would pull from.

## How it works

- Migration `20260703150000_jny05_stakeholder_digest.sql`: two columns on `user_notification_preferences` (`digest_stakeholder_update boolean default false`, `digest_stakeholder_audience text default 'exec'`, checked to `exec`/`eng`/`board`). No new table.
- `src/lib/stakeholder-pack.functions.ts`: extracted `loadNewestDecisionBrief(supabase, workspaceId, wantId?)`, the data-loading core `getStakeholderPack` already had (decision + lineage evidence + supersession standing + recorded outcome), so the digest composer reuses it instead of a second copy.
- `src/lib/notifications.functions.ts`'s `generateDigest`: when `digest_stakeholder_update` is on, resolves the caller's workspace via `ensure_user_default_workspace(_user_id)` with the **explicit** `userId` (not `current_user_default_workspace()`, which wraps `auth.uid()` and is null when this runs under the service-role admin client from the `digest-tick` cron; caught during self-review, the same service-role-vs-session-context bug class already fixed once for `ai_events`), loads the newest decision, composes one audience's pack (`composeStakeholderPack`), and appends its rendered markdown as a "Stakeholder update:" section in the digest content. Best-effort: no workspace, no decisions yet, or any lookup failure just skips the section, never blocks the rest of the digest.
- No changes to the manual `ShareStatusButton`/`StatusUpdateDialog` on Today; that stays the on-demand, copy-to-clipboard path it already was.
- `src/components/settings/NotificationsTab.tsx`: the new toggle + audience `<select>`, following the existing card pattern exactly.

## Governance & guardrails

- Opt-in, off by default (`digest_stakeholder_update` defaults `false`).
- Reuses the existing RLS-scoped, per-user digest send path; no new write surface beyond the two preference columns the user controls themselves.
- Degrades silently: a workspace or decision lookup failure never breaks the operational half of the digest (approvals/health/budget/drift).

## Verification checklist

- [x] `bunx tsc --noEmit` clean.
- [x] `bun test` 2153 pass / 0 fail (3 new: stakeholder-off-by-default, graceful-no-workspace, and the full enabled-with-a-decision happy path asserting the pack's content actually lands in the email body).
- [x] `bash scripts/check-migrations.sh` 0 apply-fatal.
- [ ] Manual walk on the primary checkout (this worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger` failure every other item in this lane has also hit; `tsc` + `bun test` are the real gates here). Migration is code-complete and gate-verified but not yet applied to the live database.

## Known limits / out of scope

- **Slack/write-back posting is genuinely founder-gated, not built**: Slack is already a registered connector (`src/lib/connectors/registry.ts`, `capabilities: { inflow: true, outflow: false, sync: false }`), but read-only, pulling messages from a channel as customer-voice signals; the entry has no write-back (`outflow`) capability enabled. Per the 2026-06-27 integration-tiering ruling (`docs/strategy/session-decisions.md`), write-back connectors are a Business-tier capability requiring real OAuth client registration for the outflow path, a founder call this session did not have standing to make on its own. **Correction (2026-07-03, session-close audit):** an earlier version of this note said "no Slack connector is registered," which is wrong; the connector exists, just without outflow. The email-digest half above is the complete autonomous slice.
- Only the workspace's single newest decision is included, matching `getStakeholderPack`'s own existing default; there is no digest of multiple recent decisions.

## Related

- `docs/planning/feature-dashboard.md` row `JNY-05`.
- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.
- [`../strategy/session-decisions.md`](../strategy/session-decisions.md) (2026-06-27 integration tiering, the Slack write-back gate).
- `docs/features/README.md` index.
