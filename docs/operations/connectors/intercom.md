# Intercom connector setup

> _Created: 2026-07-17 · Last updated: 2026-07-17_

**Status:** App registered 2026-07-17, but **not yet confirmed live** - a direct query of the `connections` table on 2026-07-17 found zero rows for `provider = 'intercom'`. Most likely cause: the app's registered redirect URL was set against `cadence-flow-beta.lovable.app`, which went dead the same day when the live domain cut over to `supaprod.ai` (see this doc's Register-the-app step 4, already corrected below) - the OAuth flow likely failed before ever reaching Supaprod's callback. Re-verify per "Verify it works" below before treating this as done.
**Last verified:** not yet - pending re-test against the corrected redirect URL

Intercom is an **inflow-only** connector (`capabilities: { inflow: true, outflow: false, sync: false }` in `registry.ts`): it pulls recent support conversations in as discovery signals - there is no outflow (Supaprod never writes back to Intercom) and no two-way sync. It is a **single-account connector** - one connection per Supaprod user, stored in the `connections` table (`provider: "intercom"`, `auth_kind: "token"`), not `user_calendar_connections` (that table is calendar/mail-suite only). Its one resource type is `inbox` (`resourceTypes: [{ kind: "inbox", label: "Inbox" }]`).

Unlike Google, Microsoft, or Slack, Intercom's authorize request carries **no `scope` parameter at all** (`scopes: []` in `registry.ts`). Intercom governs access through static capability checkboxes set once on the app itself in the Developer Hub, applying to every user who later connects it - there is nothing to request per-authorization.

## Prerequisites

- An existing Intercom workspace account with permission to create an app in that workspace's Developer Hub. There is no separate "developer" signup - the Developer Hub lives inside your normal Intercom login.

## Register the app

1. Log into your workspace at [app.intercom.com](https://app.intercom.com), then go to the Developer Hub: [app.intercom.com/a/apps/_/developer-hub](https://app.intercom.com/a/apps/_/developer-hub) (or navigate there via Settings inside the app if that link doesn't resolve directly for your workspace).

   Do **not** start at `developers.intercom.com` - that is Intercom's public documentation site, not the app-creation portal, and has no login of its own.
2. **New app** -> name it (the working registration used `Cadence`, the product's name before the 2026-07-17 rename; a fresh registration today should use `Supaprod`) -> pick the workspace it should read from -> create it.
3. Go to the app's **Authentication** page and tick **Use OAuth**. This is not on by default - without it, the app has no Client ID/Secret to register at all.
4. On the same Authentication page, under **Redirect URLs**, add:
   ```
   https://supaprod.ai/api/public/connect/intercom/callback
   ```
   Redirect URLs must be HTTPS (this one already is).
5. Go to the app's **Permissions** page -> under **People & conversation data** -> enable **Read conversations**. This is the one capability Supaprod's ingest actually uses; nothing else needs to be enabled for this connector.
6. Go to **Basic Information** and copy the **Client ID** and **Client Secret**.

## Copy the credentials into Lovable

Add exactly these two secrets in **Lovable Cloud -> Project -> Secrets** (sourced from the registry entry's `clientIdEnv`/`clientSecretEnv`):

- `INTERCOM_CLIENT_ID` - the Client ID from step 6
- `INTERCOM_CLIENT_SECRET` - the Client Secret from step 6

These go into **Lovable Cloud secrets**, not this project's local `.env` - `.env` is dev-only and git-ignored per this repo's env var split convention, and the deployed callback route reads `process.env.INTERCOM_CLIENT_ID` / `process.env.INTERCOM_CLIENT_SECRET` from the Cloudflare Worker's runtime environment, which Lovable Cloud secrets populate.

## Verify it works

1. In Supaprod, go to **Settings -> Connections**.
2. Find the **Intercom** card and click **Connect**. It redirects to Intercom's real consent screen; after approving, it redirects back to Settings -> Connections showing a connected account (the app/workspace name).
3. Success looks like: a row in `connections` with `provider = 'intercom'`, `auth_kind = 'token'`, and a non-null `external_handle` (the Intercom workspace id).
4. Once connected, no further action is needed - `intercom-ingest.server.ts` runs on every sense-tick and pulls up to 30 recent conversations in as discovery signals (Pro+ tier gated), through `writeSignals`.

## Switching to a different account or org later

**No new app registration is needed to switch which Intercom workspace is connected - even a completely different company's workspace.** Unlike a non-distributed Slack app (which really is limited to the one workspace it was installed to until Manage Distribution is turned on), Intercom's OAuth model is designed for one registered app to be authorized by many different workspaces: each workspace's own admin goes through the same OAuth consent screen and Intercom issues a fresh, workspace-scoped access token - this is exactly the mechanism third-party Intercom integrations (Zapier, Segment, etc.) rely on to serve many customers from one app.

In practice:

- Switching which **workspace** connects (a different company's Intercom account entirely, not just a different user) needs no re-registration - have an admin of the new workspace click **Connect** in Supaprod and approve the same app at Intercom's consent screen. `INTERCOM_CLIENT_ID`/`INTERCOM_CLIENT_SECRET` already in Lovable keep working unchanged; Intercom issues a new access token scoped to that workspace.
- Switching which **end-user** connects within the same workspace needs even less - just reconnect.
- Rotating a compromised or expiring secret does not need a new app - Intercom's Developer Hub does not expose a separate "regenerate secret" affordance documented here; if rotation is ever needed, recreating the Client Secret from the same app's Basic Information page (where available) and updating `INTERCOM_CLIENT_SECRET` in Lovable is the same-app path.

## Known caveats

- **The access token is durable, with no refresh cycle.** Intercom's OAuth docs specify no `refresh_token` and no `expires_in` in the token response (tokens are effectively long-lived by design) - only the `access_token` is vaulted (`src/routes/api/public/connect/intercom/callback.ts`), and `registry.ts` has no `supportsRefresh` entry for this connector because there is nothing to refresh.
- **The token exchange is a quirky, undocumented-looking endpoint.** Intercom's token URL is `https://api.intercom.io/auth/eagle/token`, not the conventional `/oauth/token` - this is confirmed correct against Intercom's own Developer Hub docs, not a placeholder. The exchange is a JSON POST (Intercom's API is JSON throughout, unlike Slack's form-urlencoded token endpoint), with `client_id`/`client_secret` traveling in the JSON body rather than a Basic auth header.
- **Real ingest is already wired in** - `intercom-ingest.server.ts` is registered in `src/lib/connectors/providers/pull-ingestors.server.ts` and runs every sense-tick, unlike the stub-placeholder group of connectors documented in `docs/operations/connector-setup.md` (Linear, Notion, Google Docs, Figma, Jira, Google Tasks), whose provider adapters are still generic stubs (`validate: async () => ({ ok: false, detail: "adapter not implemented" })` in `src/lib/connectors/providers/index.server.ts`).
- **There is also a legacy env-token fallback path** (`envFallback.tokenEnv: "INTERCOM_ACCESS_TOKEN"` in `registry.ts`), the old admin-token credential this native OAuth flow replaces. It is not currently set in this project's `.env.example` and is not in use - mentioned only so it isn't confused with the OAuth secrets above if it's ever seen referenced elsewhere.

## Code references

- `src/lib/connectors/registry.ts` - the `intercom` registry entry (auth method, capabilities, resource types, `envFallback`).
- `src/routes/api/public/connect/intercom/callback.ts` - the OAuth callback (token exchange, `/me` probe for account label, upsert into `connections`).
- `src/lib/connectors/providers/intercom.server.ts` - `intercomAdapter` (`validate`, `listResources` for the `inbox` resource kind), `intercomBearer`, `INTERCOM_API`/`INTERCOM_HEADERS`.
- `src/lib/connectors/providers/intercom-ingest.server.ts` - `ingestIntercomSignals` (`stripHtml`, `conversationToCandidate`, `fetchConversations` are its helpers), registered in `pull-ingestors.server.ts` as `{ provider: "intercom", ingest: ingestIntercomSignals }`.

## Related

- [`../connector-setup.md`](../connector-setup.md) - the full per-provider connector registration table and the shared "Known caveats" section this doc draws from.
- [`./README.md`](./README.md)
