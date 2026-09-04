# Slack connector setup

> _Created: 2026-07-17 · Last updated: 2026-07-17_

**Status:** Verified working - registered + tested 2026-07-09 (native OAuth, SW-7)
**Last verified:** 2026-07-17

Slack is an **inflow + outflow** connector (`capabilities: { inflow: true, outflow: true, sync: false }` in `registry.ts`): it pulls recent messages from one feedback channel in as customer-voice signals, and posts the ambient stakeholder digest out to a team channel. It is a **single-account connector** - one Slack workspace connection per Supaprod user, stored in the plain `connections` table (not `user_calendar_connections`, which is only for the multi-account Google/Microsoft calendar and mail suites).

## Prerequisites

- A Slack account that is a member of the target workspace, with permission to create and install apps there (a Workspace Owner/Admin role is the safe bet - some workspaces let any member create apps, but installing one still needs either the installer's own admin rights or an admin's approval, depending on that workspace's app-management policy).
- No separate Slack Enterprise/org-level access is needed for a normal single-workspace app - just console access at `api.slack.com/apps` for that workspace.

## Register the app

All of this happens in Slack's own developer console at `api.slack.com/apps`, not in Supaprod or Lovable.

1. Go to `api.slack.com/apps` and click **Create New App** -> **From scratch**.
2. Enter an **App Name** (your own choice - Supaprod doesn't read or display this string anywhere) and pick the **Slack workspace** to develop and install the app in.
3. Open the **OAuth & Permissions** page in the left sidebar.
4. Under **Redirect URLs**, add exactly:
   - `https://supaprod.ai/api/public/connect/slack/callback`
   (built from the production base URL plus the exact route the app handles, `src/routes/api/public/connect/slack/callback.ts` - the callback recomputes this same `origin + /api/public/connect/slack/callback` string and it must byte-for-byte match what was sent to `/oauth/v2/authorize`, so don't add a trailing slash or otherwise alter it.)
5. Still on **OAuth & Permissions**, scroll to **Scopes -> Bot Token Scopes** and add exactly these three (verbatim from `registry.ts`'s `scopes` array, comma-separated per Slack's convention - the registry's `scopeSeparator: ","` confirms this):
   - `channels:history`
   - `channels:read`
   - `chat:write`
   Supaprod's registry entry does not request any **User Token Scopes** - leave that list empty.
6. Open the **Basic Information** page and find **App Credentials**. Copy the **Client ID** and **Client Secret** shown there (not any bot token from another page - the OAuth exchange in `callback.ts` needs the app's Client ID/Secret, not a `xoxb-` token).
7. Install the app to the workspace: on either **Basic Information** or **OAuth & Permissions**, use the **Install to <workspace>** action and approve the requested scopes. This targets one specific Slack workspace. If a second, independent Slack workspace (a different company's Slack, not just a different channel in the same workspace) will ever need to connect through this same app, Slack's **Manage Distribution** page is where that audience is widened (see "Switching" below) - it is not needed for the workspace the app was created in.

## Copy the credentials into Lovable

Add the two values from step 6 above as secrets in **Lovable Cloud -> Project -> Secrets**, under exactly these names (from `registry.ts`'s `clientIdEnv`/`clientSecretEnv`):

- `SLACK_CLIENT_ID`
- `SLACK_CLIENT_SECRET`

These are production secrets and belong in Lovable Cloud, **not** this repo's local `.env` file. The local `.env` (git-ignored, per this repo's env-var split convention) is dev-only - it exists so someone can point a local dev server at the same two variable names for local testing, not as the source Supaprod's deployed app actually reads from.

Two more env vars round out the Slack setup, both also read via `process.env` so they belong in Lovable Cloud alongside the OAuth pair:

- `SLACK_SIGNAL_CHANNEL` - the Slack channel ID that the inflow ingest (`src/lib/connectors/providers/slack-ingest.server.ts`) reads recent messages from. It is unrelated to the OAuth app registration itself (it's a channel-selection value, not a credential) - with it unset, ingest finds nothing to read and skips cleanly rather than erroring.
- `SLACK_BOT_TOKEN` - the registry's `envFallback.tokenEnv`. This is the older, pre-native-OAuth admin-token path: if set, the Connections UI shows Slack as **Active** via that single shared bot token even without `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET` configured. It is not required once the OAuth pair is set, but is still an honored fallback.

## Verify it works

1. In Supaprod, go to **Settings -> Connections**.
2. The Slack card shows a **Connect** button once both `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` are set in Lovable.
3. Click **Connect**. This redirects to Slack's real consent screen (`https://slack.com/oauth/v2/authorize`) showing the three requested scopes for the target workspace.
4. After approving, Slack redirects back to `https://supaprod.ai/api/public/connect/slack/callback`, which briefly shows a "Slack connected" confirmation page, then returns to **Settings -> Connections** (or to `/onboarding?connected=slack` if the connect was started from onboarding).
5. Success looks like: the Slack card now shows **Connected**, with the account label set to the Slack workspace's team name (`account_label`, populated from the token exchange's `team.name`) and status `connected` in the `connections` row.

## Switching to a different account or org later

Reconnecting within the **same** Slack workspace the app was installed to in step 7 is a **reconnect, not a re-registration**: the registered app (its Client ID/Secret, already in Lovable) is owned by whoever created it in Slack's console, independent of which user later authorizes it. Just click **Connect** again from Settings -> Connections and approve the consent screen - the same two Lovable secrets keep working, and the callback's upsert logic (the inline lookup in `src/routes/api/public/connect/slack/callback.ts` by `user_id` + `provider` + `auth_kind`) replaces the old connection row and deletes the old vaulted secret automatically.

Moving to **any other** Slack workspace - there is no "same company, different workspace" middle case that skips this - does need console-side action first, because as registered in this runbook the app is a single-workspace app: its OAuth authorize/install flow only works for the one workspace it was installed to in step 7. Slack gates any other workspace with the **Manage Distribution** page: turn on Public Distribution there (it walks through a short automated checklist) so any workspace's admin can approve the same app via the standard OAuth link, then reconnect as above. This is a settings change on the *existing* app, not a brand-new app registration - a full new app registration (new Client ID/Secret, new Lovable secrets) is only needed if the app itself is being recreated from scratch under a different Slack developer account.

## Known caveats

Nothing Slack-specific is flagged in `docs/operations/connector-setup.md`'s Known caveats section today (unlike, for example, Stripe's special auth convention or Zendesk's single-subdomain limit). Two relevant facts that section does confirm by name:

- Slack's ingest is real, working logic, not a stub - it is explicitly listed among the providers (Slack, HubSpot, Salesforce, Intercom, Stripe, Zendesk, Canny, Productboard, Gmail, Outlook Mail) that already have real pull-ingest code (`slack-ingest.server.ts`, registered in `pull-ingestors.server.ts`, running every sense-tick), unlike Linear/Notion/Google Docs/Figma/Jira/Google Tasks, whose adapters are still stubs.
- Slack is not one of the two documented, deliberate token-refresh exceptions (Stripe and Notion, both marked `supportsRefresh: false` with a reason comment). Slack's registry entry simply does not set `supportsRefresh: true` either, so `oauth-refresh.server.ts` does not proactively refresh Slack tokens - consistent with Slack's own OAuth v2 bot tokens not expiring under the standard (non-rotating) grant this app requests.

## Code references

- `src/lib/connectors/registry.ts` - the `slack` entry (auth method, scopes, resource types, capabilities, env fallback, setup hint).
- `src/routes/api/public/connect/slack/callback.ts` - the OAuth callback: exchanges the code, vaults the token, upserts the `connections` row, kicks the first ingest.
- `src/lib/connectors/providers/slack.server.ts` - the adapter: `validate` (token check via `auth.test`), `listResources` (channel listing via `conversations.list`), `postMessage` (the outflow/digest post via `chat.postMessage`).
- `src/lib/connectors/providers/slack-ingest.server.ts` - the inflow ingest that reads `SLACK_SIGNAL_CHANNEL` and writes signals.
- `src/lib/connectors/slack-digest.server.ts` - the outflow side (the ambient stakeholder digest post-back, gated Business-tier).
- `src/lib/connections.functions.ts` - `startNativeOAuthConnect`, which builds the Slack authorize URL from the registry entry.

## Related

- [`../connector-setup.md`](../connector-setup.md)
- [`./README.md`](./README.md)
- [`../signal-fabric-connector-setup.md`](../signal-fabric-connector-setup.md) - the original (pre-native-OAuth) Slack setup this superseded, still relevant for the `SLACK_BOT_TOKEN` / `SLACK_SIGNAL_CHANNEL` legacy fallback path.
