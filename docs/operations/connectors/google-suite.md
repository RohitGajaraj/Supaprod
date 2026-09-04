# Google Suite connector setup

> _Created: 2026-07-17 · Last updated: 2026-08-03_

**Status:** Verified working - Google Docs, Google Calendar, Gmail, and Google Tasks all registered + tested 2026-07-10, sharing one Google Cloud OAuth client (consent screen is in Testing publish status - see the gotcha right below and "Known caveats").

> **Read this before switching accounts.** Reconnecting with a different Google account only works immediately if that account is already on the OAuth consent screen's **Test users** allow-list (or Google verification has completed by then). While the app is in Testing publish status, any Google account NOT on that list hits `Error 403: access_denied` at Google's own consent screen - this is not a Supaprod bug. See "Switching to a different account or org later" below for the exact fix.

This connector registers ONE Google Cloud OAuth 2.0 client (Web application type) that backs four separate Supaprod connections, each with its own scopes and its own storage table:

| Product | What it does in Supaprod | Capabilities (registry.ts) | Storage table |
| --- | --- | --- | --- |
| Google Docs | Ingest source documents from Google Docs | `inflow: true, outflow: false, sync: false` | `connections` (single connection per user for this provider) |
| Google Calendar | Two-way calendar sync: read events, create meetings from decisions | `inflow: true, outflow: true, sync: true` | `user_calendar_connections` (multi-account - see below) |
| Gmail | Pull recent inbox messages as customer-voice and lead signals | `inflow: true, outflow: false, sync: false` | `user_calendar_connections` (multi-account - see below) |
| Google Tasks | Sync action items with Google Tasks | `inflow: false, outflow: true, sync: false` | `user_calendar_connections` (multi-account - see below) |

Google Calendar, Gmail, and Google Tasks share the multi-account "suite" system (`user_calendar_connections`, keyed on `(user_id, provider, product, account_email)`) because a user can connect several Google accounts to those three products at once. Google Docs is a plain single-account connector (`connections`, one row per user for `provider = 'google_docs'`) - connecting a second Google Docs account replaces the first rather than adding a second row.

## Prerequisites

- Access to the Google Cloud Console project that owns this OAuth client. The live client lives in the GCP project referred to as "Cadence" in `docs/operations/connector-setup.md`'s Known caveats section. To edit an existing client's redirect URIs, scopes, or secrets you need at least Editor (or an equivalent OAuth-config IAM role) on that project.
- No Google Workspace admin role is required - this is a normal Google Cloud Console OAuth client, not a Workspace-wide app install. A personal Google account with access to the GCP project is enough.
- A Google account you can sign in with to test the Connect flow. It must be added as a **Test user** on the OAuth consent screen before it can get past consent (see the gotcha above) - it does not need to be an org admin, just any Google account.
- If registering a brand-new client from scratch (see "Switching to a different account or org later"): any Google account can create a new Google Cloud project; no special org role is needed to create the project itself.

## Register the app

All steps happen in [Google Cloud Console](https://console.cloud.google.com/), under **APIs & Services**.

1. Select the project that will own this OAuth client (the live one is the "Cadence" GCP project), or create a new one via **New Project** if this is a fresh registration.
2. **APIs & Services -> Library** - enable the APIs each product needs:
   - Google Docs API
   - Google Drive API
   - Google Calendar API
   - Gmail API
   - Google Tasks API
3. **APIs & Services -> OAuth consent screen** - configure (if not already done):
   - **User Type**: `External`
   - **App name**: operator's choice (a real display name Google shows on the consent screen; the live app uses "Cadence")
   - **Support email** and **Developer contact information**: your own email
   - **Publish status**: leave as `Testing` - this is a deliberate founder decision, not an oversight (see "Known caveats")
4. Same screen, **Scopes** section -> **Add or Remove Scopes** - add all six scopes used across the four products, verbatim:
   - `https://www.googleapis.com/auth/documents.readonly`
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/tasks`
5. Same screen, **Test users** section -> **Add users** - add every Google account (up to 100) that needs to get past consent: your own testing account, any teammate's account, any demo account. This step is what "Known caveats" below is about - skip it and every non-added account is blocked at Google's consent screen.
6. **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**:
   - **Application type**: `Web application`
   - **Name**: operator's choice (a label for your own reference in the console; the live one is named "Cadence")
   - **Authorized redirect URIs** - add all four, exactly (base URL is Supaprod's production origin, `https://supaprod.ai`):
     - `https://supaprod.ai/api/public/connect/google_docs/callback`
     - `https://supaprod.ai/api/public/connect/google_calendar/callback`
     - `https://supaprod.ai/api/public/connect/gmail/callback`
     - `https://supaprod.ai/api/public/connect/google_tasks/callback`
7. Click **Create**. Copy the **Client ID** and **Client Secret** shown - this single pair covers all four products; there is nothing per-product to copy.

## Copy the credentials into Lovable

Two secrets, shared by all four Google connectors:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Add both under **Lovable Cloud -> Project -> Secrets**. Do NOT put these in this repo's local `.env` file - that file is dev-only and git-ignored, per this repo's env var split convention (`docs/operations/connector-setup.md`'s "The one thing to do per provider" walkthrough follows the same rule for every provider). Setting the pair once in Lovable Cloud is enough to light up the Connect button on all four cards (Google Docs, Google Calendar, Gmail, Google Tasks) in Settings -> Connections - there is nothing per-product to add.

## Verify it works

1. In Supaprod, go to **Settings -> Connections**.
2. Each of the four Google cards (Google Docs, Google Calendar, Gmail, Google Tasks) shows a **Connect** button once both secrets are set in Lovable (rather than "Coming soon").
3. Click **Connect** on a card. You're redirected to Google's real consent screen (`accounts.google.com`), not a Supaprod-hosted page.
4. Approve access with a Google account that is on the Test users list. You're redirected back to `/settings?section=connections` (or `/onboarding?connected=<provider>` if the Connect button was launched from onboarding) showing a small "Connected" confirmation page before it closes the tab.
5. Success looks like: the card now shows a connected account with that Google account's email/display name. For Google Calendar, Gmail, and Google Tasks, you can repeat Connect with a second Google account and see both listed at once (the multi-account suite system). For Google Docs, connecting a second account replaces the first (single-account).
6. If the connecting Google account is NOT on the Test users list, you land back on `/settings?section=connections` with an error query param (e.g. `error=google_docs_connect`) instead of a connected card - that's Google's consent screen rejecting the account with `Error 403: access_denied`, not a Supaprod-side failure. Add the account under OAuth consent screen -> Test users and try again.

## Switching to a different account or org later

Switching **which Google account** is connected does not require a new app registration. The registered OAuth client (Client ID/Secret) belongs to whoever created it in Google Cloud Console - it is independent of which end-user later authorizes it. Practically:

1. Go to Settings -> Connections, disconnect the old Google account on the relevant card (or just click Connect again for Calendar/Gmail/Tasks, since those support multiple simultaneous accounts).
2. Click **Connect**, sign in with the new Google account, approve.
3. The same `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` already sitting in Lovable keep working - no console changes needed.

The one precondition: while the consent screen is in Testing publish status, the new account must first be added under **OAuth consent screen -> Test users -> Add users**, or the reconnect attempt hits the same `Error 403: access_denied` described above. Once full verification has completed (see "Known caveats"), this precondition goes away and any Google account can connect.

A brand-new OAuth **client** registration (not just a reconnect) is only needed when the app itself has to move to a different Google Cloud project or org - for example, handing this connector off to a different company's GCP org, or deliberately separating it from the existing "Cadence" GCP project. Wanting a different Google account to be the one Supaprod talks to - a different Workspace user, a different personal Gmail - is covered by reconnect above and does not need this.

Rotating the secret alone (`GOOGLE_CLIENT_SECRET`) also does not need a new registration or a new client: Google Cloud Console supports multiple active secrets on one OAuth client for exactly this case. Go to **Credentials -> the existing OAuth client -> Client secrets -> Add secret**, update `GOOGLE_CLIENT_SECRET` in Lovable Cloud -> Secrets to the new value, verify the Connect flow still works, then delete the old secret from the console once you're confident the new one is live.

## Known caveats

- **The OAuth consent screen is still in Testing publish status** (the "Cadence" connector app - NOT the separate "Cadence Login" app used only for the login/signup button, which is unaffected and already open to anyone). While in Testing, only Google accounts explicitly added as test users can get past the consent screen at all - anyone else hits `Error 403: access_denied` ("Access blocked... has not completed the Google verification process"). Confirmed live 2026-07-10 connecting with a real Google account not yet on the test-user list.
  **Founder decision (2026-07-10): deferred on purpose, not a bug to fix.** Strategy: stay on Testing, manually add test users as needed for demo purposes (Google allows up to 100), and move to full verification once the product is solid enough to invest in it. The real long-term fix when that time comes:
  - **Docs, Calendar, Tasks** use Google's standard "sensitive" scope tier - verification needs a live privacy policy URL, a live homepage, domain ownership verified in Google Search Console, and a scope-usage explanation. Turnaround is normally days, not weeks, once those prerequisites exist. Supaprod has a privacy policy already; it does not yet have a public homepage - that is the actual blocker for even starting this, not anything technical.
  - **Gmail's `gmail.readonly`** is a Google _restricted_ scope, not merely sensitive - on top of the standard review it requires a paid third-party security assessment (Google calls this CASA), adding real cost and lead time beyond the other three. Founder ruling: pursue Docs/Calendar/Tasks verification first as a separate, smaller step; treat Gmail's CASA assessment as its own later decision, not bundled in.
  - To add a test user meanwhile: Google Console -> the "Cadence" project -> APIs & Services -> OAuth consent screen -> Test users -> Add users.
- **Google Tasks' connect flow works but has no adapter/ingest code behind it yet.** It uses the shared stub placeholder (`{validate: () => "not implemented"}`) - there is no dedicated `google_tasks.server.ts` adapter file at all. Connecting succeeds and vaults a real, auto-refreshing token, but nothing downstream reads it. This is net-new build work, not a credential gap - Google Tasks additionally needs a product decision on what it should even do (see the `google_tasks` entry's comment in `registry.ts`).
- **Google Docs is in the same stub-adapter group** as Linear, Notion, Figma, and Jira: the connect flow is fully real (vaults a real, auto-refreshing token) but `src/lib/connectors/providers/google_docs.server.ts` does not exist yet - no ingest logic reads through this specific OAuth connection today. Connecting succeeds with no error; nothing visible happens afterward until adapter/ingest code is built for this connection. That does NOT mean Google Docs import is unbuilt in Supaprod overall: a separately credentialed import feature already works today - `importGoogleDoc` in `src/lib/gdocs.functions.ts`, wired into `DocsPanel.tsx` - authenticating through the same deprecated `connector-gateway.lovable.dev` path via its own `GOOGLE_DOCS_API_KEY` (`registry.ts`'s `envFallback.tokenEnv` for `google_docs`), unrelated to the OAuth connection this doc walks through.
- **Calendar sync in the product does not run through this OAuth connection at all.** The live two-way calendar sync that Today, Focus, and Knowledge panels use (`src/lib/calendar.functions.ts`) still authenticates via the deprecated `connector-gateway.lovable.dev`, using a separate, undocumented `GOOGLE_CALENDAR_API_KEY` + `LOVABLE_API_KEY` pair - not the vaulted token this runbook creates. `resolveSuiteAuth` (`src/lib/connectors/providers/suite-resolve.server.ts`), the only code that reads `user_calendar_connections` tokens, is wired into `gmail-ingest.server.ts` and `outlook-mail-ingest.server.ts` only - never into a calendar adapter. Completing this runbook vaults a real, working, auto-refreshing Google Calendar OAuth token that nothing downstream reads yet; the "Two-way calendar sync" capability in the table above describes what this OAuth setup is meant to enable, not what it does end-to-end today.
- **Token refresh is real and automatic** for all four Google products - each requests `access_type=offline` + `prompt=consent` on the authorize call specifically so Google hands back a `refresh_token`, and all four are marked `supportsRefresh: true` in `registry.ts`. None of the four are among the two documented exceptions (Stripe, Notion) that deliberately don't refresh.
- **Zendesk's `ZENDESK_SUBDOMAIN` caveat and Stripe's special API-calling convention** (documented in `docs/operations/connector-setup.md`) are unrelated to Google - noted here only so you know they're not accidentally omitted; they don't apply to this connector.

## Code references

- `src/lib/connectors/registry.ts` - `google_docs`, `google_calendar`, `gmail`, and `google_tasks` entries (scopes, shared `clientIdEnv`/`clientSecretEnv`, capabilities, `resourceTypes`)
- `src/routes/api/public/connect/google_docs/callback.ts` - single-account OAuth callback, writes to `connections`
- `src/routes/api/public/connect/google_calendar/callback.ts` - suite OAuth callback, writes to `user_calendar_connections`
- `src/routes/api/public/connect/gmail/callback.ts` - suite OAuth callback, writes to `user_calendar_connections`
- `src/routes/api/public/connect/google_tasks/callback.ts` - suite OAuth callback, writes to `user_calendar_connections`
- `src/lib/connections.functions.ts` - `startNativeOAuthConnect`, the single-account authorize-URL builder used by Google Docs
- `src/lib/calendar-connections.functions.ts` - `startSuiteConnect`, the multi-account authorize-URL builder used by Google Calendar, Gmail, and Google Tasks
- `src/lib/connectors/providers/suite-resolve.server.ts` - resolves a suite connection's credentials for the Google/Microsoft multi-account system
- `src/lib/connectors/providers/gmail-ingest.server.ts` - Gmail's real ingest logic (the one Google product with a working adapter today)
- `src/lib/connectors/oauth-refresh.server.ts` - proactive token refresh before expiry
- `docs/operations/connector-setup.md` - the cross-provider status table and the source of this doc's "Known caveats" section

## Related

- [`../connector-setup.md`](../connector-setup.md)
