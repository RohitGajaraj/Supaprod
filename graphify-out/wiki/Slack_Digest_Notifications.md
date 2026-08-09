# Slack Digest Notifications

> 57 nodes · cohesion 0.07

## Key Concepts

- **notifications.functions.ts** (40 connections) — `src/lib/notifications.functions.ts`
- **stakeholder-pack.functions.ts** (24 connections) — `src/lib/stakeholder-pack.functions.ts`
- **slack-digest.server.ts** (23 connections) — `src/lib/connectors/slack-digest.server.ts`
- **stakeholder-pack.ts** (22 connections) — `src/lib/stakeholder-pack.ts`
- **postStakeholderDigestToSlack()** (13 connections) — `src/lib/connectors/slack-digest.server.ts`
- **composeStakeholderPack()** (11 connections) — `src/lib/stakeholder-pack.ts`
- **generateDigest()** (10 connections) — `src/lib/notifications.functions.ts`
- **loadNewestDecisionBrief()** (9 connections) — `src/lib/stakeholder-pack.functions.ts`
- **renderPackMarkdown()** (8 connections) — `src/lib/stakeholder-pack.ts`
- **dispatchInstantEmail()** (7 connections) — `src/lib/notifications.functions.ts`
- **stakeholder-pack.test.ts** (7 connections) — `src/lib/stakeholder-pack.test.ts`
- **sendDueDigests()** (6 connections) — `src/lib/notifications.functions.ts`
- **notifications.test.ts** (6 connections) — `src/lib/notifications.test.ts`
- **toSlackMrkdwn()** (4 connections) — `src/lib/connectors/slack-digest.server.ts`
- **composeAllPacks()** (4 connections) — `src/lib/stakeholder-pack.ts`
- **postMessage()** (3 connections) — `src/lib/connectors/providers/slack.server.ts`
- **isSlackDigestDue()** (3 connections) — `src/lib/connectors/slack-digest.server.ts`
- **slack-digest.test.ts** (3 connections) — `src/lib/connectors/slack-digest.test.ts`
- **isQuietHours()** (3 connections) — `src/lib/notifications.functions.ts`
- **localHourInTimezone()** (3 connections) — `src/lib/notifications.functions.ts`
- **resolveUserEmail()** (3 connections) — `src/lib/notifications.functions.ts`
- **sendDueSlackDigests()** (3 connections) — `src/lib/notifications.functions.ts`
- **DecisionBrief** (3 connections) — `src/lib/stakeholder-pack.ts`
- **PACK_AUDIENCES** (3 connections) — `src/lib/stakeholder-pack.ts`
- **PackAudience** (3 connections) — `src/lib/stakeholder-pack.ts`
- *... and 32 more nodes in this community*

## Relationships

- [Stakeholder Update Generation](Stakeholder_Update_Generation.md) (12 shared connections)
- [Public Decision Sharing](Public_Decision_Sharing.md) (10 shared connections)
- [Canny Integration Service](Canny_Integration_Service.md) (8 shared connections)
- [UI Component Library](UI_Component_Library.md) (4 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (4 shared connections)
- [Email Preview Generation](Email_Preview_Generation.md) (4 shared connections)
- [Supabase Auth & Analytics](Supabase_Auth_%26_Analytics.md) (4 shared connections)
- [Drift Detection and Rollups](Drift_Detection_and_Rollups.md) (3 shared connections)
- [Vault and OAuth Connections](Vault_and_OAuth_Connections.md) (1 shared connections)

## Source Files

- `src/lib/connectors/providers/slack.server.ts`
- `src/lib/connectors/slack-digest.server.ts`
- `src/lib/connectors/slack-digest.test.ts`
- `src/lib/notifications.functions.ts`
- `src/lib/notifications.test.ts`
- `src/lib/stakeholder-pack.functions.ts`
- `src/lib/stakeholder-pack.test.ts`
- `src/lib/stakeholder-pack.ts`

## Audit Trail

- EXTRACTED: 268 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*