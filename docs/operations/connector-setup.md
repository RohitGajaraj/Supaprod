# Connector setup: registering each provider's native OAuth app

> _Created: 2026-07-06 · Rewritten: 2026-07-09 (SW-7 native-OAuth rollout)_

**This doc replaced its own previous version wholesale.** The old Lovable
connector-gateway path (`*_APP_USER_CONNECTOR_CLIENT_ID` + `LOVABLE_API_KEY`)
turned out to be a dead end for any provider beyond what Lovable had already
manually provisioned: registering a NEW provider on that gateway requires
Lovable's own manual provisioning, with no self-serve path (confirmed
2026-07-09 by asking Lovable's own agent directly). Every connector below now
uses **native OAuth**: Cadence is registered as its own OAuth app directly
with each provider, exactly the same pattern GitHub already used
(`GITHUB_APP_ID`/`GITHUB_APP_SLUG`/`GITHUB_APP_PRIVATE_KEY`, set up on
github.com, nothing to do with Lovable). The old gateway path only survives
for Canny and Delighted, which have no third-party OAuth of their own to
migrate to (see the bottom of this doc) - and Lovable's gateway can't
self-serve-register those either, so in practice they stay admin-token-only.

The Connect button, the redirect out to the provider's own consent screen,
and the redirect back showing a connected account are **fully built and
working** for every row below except two (Canny, Delighted - see bottom).
What's still needed is founder action only: register each app, paste in two
secrets, done.

## The one thing to do per provider

For every row below:
1. Open that provider's own developer console.
2. Create/find an OAuth app. Copy its **Client ID** and **Client Secret**
   (not a bot token, not an access token, not an API key - those are a
   different credential and won't work here).
3. Add the two secrets to Lovable (project → Cloud → Secrets) under the exact
   names in the table.
4. In that same app's OAuth settings, add the **Redirect URL** shown, exactly
   (base URL: `https://cadence-flow-beta.lovable.app`).
5. Go to Settings → Connections in Cadence, click Connect on that provider's
   card. It should redirect to the provider's real consent screen, and after
   approving, redirect back showing a connected account.

## Single-account connectors (one connection per user, per provider)

| Provider | Secrets | Redirect URL | Status |
| --- | --- | --- | --- |
| GitHub | `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY` | (GitHub App install flow, not this pattern) | **Done, working** |
| Slack | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` | `.../api/public/connect/slack/callback` | **Done, working** (registered + tested 2026-07-09) |
| Linear | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET` | `.../api/public/connect/linear/callback` | Built, needs registration |
| Notion | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` | `.../api/public/connect/notion/callback` | Built, needs registration |
| Google Docs | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (shared, see suite section) | `.../api/public/connect/google_docs/callback` | Built, needs registration |
| Figma | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` | `.../api/public/connect/figma/callback` | Built, needs registration |
| Jira (Atlassian) | `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET` | `.../api/public/connect/jira/callback` | Built, needs registration |
| Intercom | `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET` | `.../api/public/connect/intercom/callback` | Built, needs registration |
| Stripe | `STRIPE_CLIENT_ID`, `STRIPE_CLIENT_SECRET` | `.../api/public/connect/stripe/callback` | Built, needs registration (see caveat below) |
| Zendesk | `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET`, **`ZENDESK_SUBDOMAIN`** | `.../api/public/connect/zendesk/callback` | Built, needs registration (see caveat below) |
| HubSpot | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` | `.../api/public/connect/hubspot/callback` | Built, needs registration |
| Salesforce | `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET` | `.../api/public/connect/salesforce/callback` | Built, needs registration |
| Productboard | `PRODUCTBOARD_CLIENT_ID`, `PRODUCTBOARD_CLIENT_SECRET` | `.../api/public/connect/productboard/callback` | Built, needs registration |

## Multi-account suite connectors (a user can connect several accounts)

Calendar and mail live on their own table (`user_calendar_connections`, not
`connections`) since someone might connect more than one Google or Microsoft
account. Both Google products share ONE Google Cloud OAuth app; both
Microsoft products share ONE Entra app.

| Provider | Secrets | Redirect URL | Status |
| --- | --- | --- | --- |
| Google Calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `.../api/public/connect/google_calendar/callback` | Built, needs registration |
| Gmail | same Google app as above | `.../api/public/connect/gmail/callback` | Built, needs registration |
| Microsoft Outlook (calendar) | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `.../api/public/connect/microsoft_outlook/callback` | Built, needs registration |
| Outlook Mail | same Microsoft app as above | `.../api/public/connect/microsoft_mail/callback` | Built, needs registration |

**Register Google's OAuth app once**, add all three redirect URLs to it
(Docs, Calendar, Gmail). Same for Microsoft (Calendar, Mail).

## Providers with no OAuth to register (stay admin-token-only)

- **Canny** - no `/oauth/authorize` or `/oauth/token` endpoint exists for
  third-party apps per Canny's own docs (confirmed 2026-07-09). Admin API key
  (`CANNY_API_KEY`) is the only path; nothing to register here.

Delighted was removed from the connector catalog entirely on 2026-07-09 -
Qualtrics sunset the product on 2026-07-01 and it never had a third-party
OAuth flow to migrate to, so there was nothing left to keep it for.

## Known caveats (real, not bugs, worth reading before testing)

- **Zendesk's `ZENDESK_SUBDOMAIN`** is a single, shared value - there's no
  per-connecting-user subdomain-capture step in the UI yet (Zendesk's
  authorize/token host IS the customer's own subdomain, so this only works
  for the ONE subdomain that env var names). If the Connect button is clicked
  without `ZENDESK_SUBDOMAIN` set, it fails cleanly with a "setup pending"
  message rather than redirecting to a broken host.
- **Stripe** has a real, separate, still-open gap beyond just registering the
  app: Stripe's own API-calling convention for a connected account uses the
  *platform's* secret key plus a `Stripe-Account: <account_id>` header, not
  the OAuth `access_token` as a normal bearer token. The connect flow works
  and vaults a real token, but nothing downstream yet knows to call Stripe
  the special way. Documented in `connect/stripe/callback.ts`'s file header;
  not fixed as of 2026-07-09.
- **Linear, Notion, Google Docs, Figma, Jira**: their connect flow is fully
  real (vaults a real, auto-refreshing token) but their provider adapters
  (`src/lib/connectors/providers/{linear,notion,google_docs,figma,jira}.server.ts`)
  are still stub placeholders (`{validate: () => "not implemented"}`) - no
  ingest or push logic reads through these connections yet. Connecting one of
  these five will succeed with no error, but nothing visible happens
  afterward until adapter/ingest code is built for it (net-new build work,
  not a credential gap). Slack, HubSpot, Salesforce, Intercom, Stripe,
  Zendesk, Canny, Productboard, Delighted, Gmail, and Outlook Mail all DO
  have real ingest logic already (`src/lib/connectors/providers/*-ingest.server.ts`,
  registered in `pull-ingestors.server.ts`, run every sense-tick).
- **Token refresh** is real and automatic for every provider whose OAuth
  grant includes a refresh_token, EXCEPT Stripe (only issues one in
  test-mode, deliberately excluded) and Notion (refresh is optional/rare in
  practice, deliberately excluded) - both marked `supportsRefresh: false` in
  `registry.ts` with a reason comment, not an oversight.

## What the code does with these

- `deriveProviderAvailability()` (`src/lib/connections.functions.ts`) reads
  `process.env[clientIdEnv]` / `clientSecretEnv` per provider and reports
  `nativeOAuthConfigured`.
- The Connections UI (`src/components/connections/AccountConnectionsSection.tsx`)
  shows **Connect** the moment both secrets are set, **Active** when only a
  legacy admin workspace token is set (the old fallback path, still honored),
  and **Coming soon** when neither is.
- `startNativeOAuthConnect` (single-account) / `startSuiteConnect`
  (multi-account, `src/lib/calendar-connections.functions.ts`) build the
  authorize URL directly against the provider's own endpoint - no gateway
  involved. Each provider's own `connect/<id>/callback.ts` route exchanges
  the code, vaults the token (`src/lib/connectors/crypto.server.ts`), and
  proactively refreshes it before expiry
  (`src/lib/connectors/oauth-refresh.server.ts`).
- Nothing here needs code changes to register a provider - only the secrets
  and redirect URL above.
