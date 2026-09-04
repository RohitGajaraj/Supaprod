# Linear connector setup

> _Created: 2026-07-17 · Last updated: 2026-07-17_

**Status:** Verified working - registered and tested 2026-07-17. Confirmed via a live `connections` table query: a real `connected` row exists (`provider = 'linear'`, `auth_kind = 'token'`, a non-null `external_handle`).
**Last verified:** 2026-07-17

**Read this first: connecting succeeds, but nothing downstream reads it yet.** Linear's connect flow is fully real - it vaults a genuine, auto-refreshing token - but unlike Intercom or Outlook Mail, there is no adapter file for Linear at all (`src/lib/connectors/providers/linear.server.ts` does not exist; it falls through to the generic `stubAdapter` in `src/lib/connectors/providers/index.server.ts`, `validate: async () => ({ ok: false, detail: "adapter not implemented" })`). Registering and connecting Linear works cleanly with no error, and is worth doing now so it's ready the moment adapter/ingest code lands, but it will not push planned work to Linear or pull issue state back until that net-new build work happens (see `docs/operations/connector-setup.md`'s "Known caveats" for the full stub-connector list: Linear, Notion, Google Docs, Figma, Jira, Google Tasks).

Linear is an **inflow + outflow** connector by design (`capabilities: { inflow: true, outflow: true, sync: false }` in `registry.ts`): meant to push planned work out to Linear and pull issue state back in - once the adapter exists. It is a **single-account connector** - one connection per Supaprod user, stored in the `connections` table (`provider: "linear"`, `auth_kind: "token"`), not `user_calendar_connections`. Its one resource type is `team` (`resourceTypes: [{ kind: "team", label: "Team" }]`).

## Prerequisites

- You must be a **workspace admin** in Linear to create and manage OAuth applications there.

## Register the app

1. Go directly to **[linear.app/settings/api/applications/new](https://linear.app/settings/api/applications/new)** (or navigate there via Settings -> API -> OAuth Applications -> Create new OAuth Application).
2. Fill in:
   - **Application name** - operator's choice, shown to whoever authorizes it (the working registration used `Supaprod`).
   - **Developer name** - required to submit the form even for a non-public app; any name/company works.
   - **Developer URL** - only required if **Public** is on (see below); leave blank otherwise.
   - **Redirect URIs** (one per line):
     ```
     https://supaprod.ai/api/public/connect/linear/callback
     ```
   - **GitHub username** - unrelated to this integration, leave blank.
   - **Public** - leave **off** unless you specifically want other Linear workspaces to be able to authorize this same app (see "Switching to a different account or org later" below). Off means only the workspace that created the app can connect it.
   - **Client credentials** - leave **off**. That toggle is for the `client_credentials` machine-to-machine grant type; Supaprod's code uses the standard authorization-code flow this doc walks through.
   - **Webhooks** - leave **off**. Nothing in Supaprod's Linear integration listens for Linear webhooks.
3. Click **Create**.
4. The **Client ID** and **Client Secret** appear at the top of the application's page once created - copy both now.

Unlike Intercom, Linear's authorize request does carry scopes (`read`, `write`, comma-separated per `registry.ts`'s `scopeSeparator: ","`) - these are requested directly in the authorize URL by Supaprod's code, not configured on the app itself. Nothing to set here for that.

## Copy the credentials into Lovable

Add exactly these two secrets in **Lovable Cloud -> Project -> Secrets** (sourced from the registry entry's `clientIdEnv`/`clientSecretEnv`):

- `LINEAR_CLIENT_ID` - the Client ID from step 4
- `LINEAR_CLIENT_SECRET` - the Client Secret from step 4

These go into **Lovable Cloud secrets**, not this project's local `.env` - `.env` is dev-only and git-ignored per this repo's env var split convention, and the deployed callback route reads `process.env.LINEAR_CLIENT_ID` / `process.env.LINEAR_CLIENT_SECRET` from the Cloudflare Worker's runtime environment, which Lovable Cloud secrets populate.

## Verify it works

1. In Supaprod, go to **Settings -> Connections**.
2. Find the **Linear** card and click **Connect**. It redirects to Linear's real consent screen; after approving, it redirects back to Settings -> Connections showing a connected account (a `viewerName - orgName (Linear)` label, from a one-shot GraphQL profile fetch).
3. Success looks like: a row in `connections` with `provider = 'linear'`, `auth_kind = 'token'`, and a non-null `external_handle` (the Linear organization id).
4. Nothing else happens after that (see the stub-adapter note above) - this is expected, not a failure.

## Switching to a different account or org later

**Depends entirely on the Public toggle set during registration.** With **Public off** (the default, and what this runbook has you set), the app can only ever be authorized by the one workspace that created it - the same limitation Slack's non-distributed apps have. Concretely:

- Switching which **end-user** within the **same workspace** connects needs no changes - just reconnect via Settings -> Connections. `LINEAR_CLIENT_ID`/`LINEAR_CLIENT_SECRET` in Lovable keep working unchanged.
- Connecting a genuinely **different Linear workspace/organization** with this same app requires flipping **Public** to on for this app (in Linear's OAuth Applications settings) - Linear's own docs describe this exact toggle as what allows any workspace to authorize an app, not just the one that created it. Once flipped, no new app or new secrets are needed; the existing `LINEAR_CLIENT_ID`/`LINEAR_CLIENT_SECRET` continue to work for the new workspace too. Turning Public on additionally requires a filled-in **Developer URL** (left blank above since it wasn't needed while private).
- Rotating a compromised or expiring secret does not need a new app - Linear's Developer Hub does not expose a documented "regenerate secret" affordance here; if ever needed, treat it the same as any credential rotation: update whatever Linear provides and update `LINEAR_CLIENT_SECRET` in Lovable to match.

## Known caveats

- **No adapter exists yet - this is the main thing to know.** Covered at the top of this doc; repeating here because it's the single most important fact about this connector's current state.
- **Access tokens expire in about 24 hours and must be refreshed.** `registry.ts` marks `linear` as `supportsRefresh: true`, and Linear **rotates the refresh_token on every use** - the previous one is invalidated immediately, so the newest refresh_token must always be the one persisted. `resolve.server.ts`'s `materializeAuth` handles this: the vaulted secret is a JSON blob (`{access_token, refresh_token}`), not a bare string, whenever a refresh_token is present.
- **There is also a legacy env-token fallback path** (`envFallback.tokenEnv: "LINEAR_API_KEY"`, `resourceKind: "team"` in `registry.ts`) - the old admin-token credential this native OAuth flow replaces. `LINEAR_API_KEY` exists as a listed key in `.env.example` but this connector's live status is driven by the real OAuth connection confirmed above, not this fallback - mentioned only so it isn't confused with the OAuth secrets if it's ever seen referenced elsewhere.
- **The token exchange requires an explicit `grant_type: "authorization_code"` field** in the request body (`src/routes/api/public/connect/linear/callback.ts`) - not something `registry.ts` carries, it's hardcoded in the callback since Linear's token endpoint requires it.

## Code references

- `src/lib/connectors/registry.ts` - the `linear` registry entry (auth method, capabilities, resource types, `envFallback`).
- `src/routes/api/public/connect/linear/callback.ts` - the OAuth callback (token exchange with `grant_type`, the GraphQL `viewer`/`organization` profile probe, refresh-token-aware vaulting, upsert into `connections`).
- `src/lib/connectors/providers/index.server.ts` - the generic `stubAdapter` this connector currently falls through to (no dedicated `linear.server.ts` exists).

## Related

- [`../connector-setup.md`](../connector-setup.md) - the full per-provider connector registration table and the shared "Known caveats" section this doc draws from.
- [`./README.md`](./README.md)
