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
   (base URL: `https://supaprod.ai`).
5. Go to Settings → Connections in Cadence, click Connect on that provider's
   card. It should redirect to the provider's real consent screen, and after
   approving, redirect back showing a connected account.

## Single-account connectors (one connection per user, per provider)

| Provider         | Secrets                                                                | Redirect URL                                   | Status                                                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub           | `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY`           | (GitHub App install flow, not this pattern)    | **Done, working** - see [`connectors/github.md`](./connectors/github.md)                                                                                                                                                                                       |
| Slack            | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`                               | `.../api/public/connect/slack/callback`        | **Done, working** (registered + tested 2026-07-09) - see [`connectors/slack.md`](./connectors/slack.md)                                                                                                                                                        |
| Linear           | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`                             | `.../api/public/connect/linear/callback`       | Built, needs registration                                                                                                                                                                                                                                       |
| Notion           | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`                             | `.../api/public/connect/notion/callback`       | Built, needs registration                                                                                                                                                                                                                                       |
| Google Docs      | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (shared, see suite section) | `.../api/public/connect/google_docs/callback`  | **Registered + tested 2026-07-10** (see Google verification caveat below) - see [`connectors/google-suite.md`](./connectors/google-suite.md)                                                                                                                   |
| Figma            | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`                               | `.../api/public/connect/figma/callback`        | Built, needs registration                                                                                                                                                                                                                                       |
| Jira (Atlassian) | `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET`                                 | `.../api/public/connect/jira/callback`         | Built, needs registration                                                                                                                                                                                                                                       |
| Intercom         | `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET`                         | `.../api/public/connect/intercom/callback`     | App registered 2026-07-17, **not yet confirmed live** (0 rows in `connections` as of 2026-07-17 - likely the domain-cutover redirect mismatch, see [`connectors/intercom.md`](./connectors/intercom.md))                                                       |
| Stripe           | `STRIPE_CLIENT_ID`, `STRIPE_CLIENT_SECRET`                             | `.../api/public/connect/stripe/callback`       | Built, needs registration (see caveat below)                                                                                                                                                                                                                    |
| Zendesk          | `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET`, **`ZENDESK_SUBDOMAIN`**  | `.../api/public/connect/zendesk/callback`      | Built, needs registration (see caveat below)                                                                                                                                                                                                                    |
| HubSpot          | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`                           | `.../api/public/connect/hubspot/callback`      | Built, needs registration (also **Active** today via a legacy admin token, verified working 2026-07-09)                                                                                                                                                         |
| Salesforce       | `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`                     | `.../api/public/connect/salesforce/callback`   | **Registered + tested 2026-07-10** - real per-user OAuth connection live, replaced a dead legacy admin token. Needed a `pkce: true` registry fix (this org requires PKCE on the authorize request) - see `oauth-refresh` / `github.server.ts`'s `makePkcePair`. See [`connectors/salesforce.md`](./connectors/salesforce.md). |
| Productboard     | `PRODUCTBOARD_CLIENT_ID`, `PRODUCTBOARD_CLIENT_SECRET`                 | `.../api/public/connect/productboard/callback` | Built, needs registration                                                                                                                                                                                                                                       |

## Multi-account suite connectors (a user can connect several accounts)

Calendar and mail live on their own table (`user_calendar_connections`, not
`connections`) since someone might connect more than one Google or Microsoft
account. Both Google products share ONE Google Cloud OAuth app; both
Microsoft products share ONE Entra app.

| Provider                     | Secrets                                          | Redirect URL                                        | Status                                                                                                                                              |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Calendar              | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`       | `.../api/public/connect/google_calendar/callback`   | **Registered + tested 2026-07-10** (see Google verification caveat below, and the calendar-sync dual-path caveat in [`connectors/google-suite.md`](./connectors/google-suite.md)) |
| Gmail                        | same Google app as above                         | `.../api/public/connect/gmail/callback`             | **Registered + tested 2026-07-10** (see Google verification caveat below - Gmail specifically needs a _restricted_-scope review, not just standard) |
| Google Tasks                 | same Google app as above                         | `.../api/public/connect/google_tasks/callback`      | **Registered + tested 2026-07-10** (connect only - see stub-adapter caveat below; also gated by the Google verification caveat)                     |
| Microsoft Outlook (calendar) | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `.../api/public/connect/microsoft_outlook/callback` | App registered 2026-07-17, **not yet confirmed live** (0 rows in `user_calendar_connections` as of 2026-07-17 - likely the domain-cutover redirect mismatch, see [`connectors/microsoft-suite.md`](./connectors/microsoft-suite.md)) |
| Outlook Mail                 | same Microsoft app as above                      | `.../api/public/connect/microsoft_mail/callback`    | App registered 2026-07-17, **not yet confirmed live** - same caveat as the row above, see [`connectors/microsoft-suite.md`](./connectors/microsoft-suite.md)                                         |

**Register Google's OAuth app once**, add all four redirect URLs to it
(Docs, Calendar, Gmail, Tasks). Same for Microsoft (Calendar, Mail).

## Providers with no OAuth to register (stay admin-token-only)

- **Canny** - no `/oauth/authorize` or `/oauth/token` endpoint exists for
  third-party apps per Canny's own docs (confirmed 2026-07-09). Admin API key
  (`CANNY_API_KEY`) is the only path; nothing to register here.

Delighted was removed from the connector catalog entirely on 2026-07-09 -
Qualtrics sunset the product on 2026-07-01 and it never had a third-party
OAuth flow to migrate to, so there was nothing left to keep it for.

## Known caveats (real, not bugs, worth reading before testing)

- **`user_calendar_connections` has zero rows for any provider, live, as of 2026-07-17** - a direct query against the production database (Lovable project `371dd588-1b70-4629-9bb5-9f003f3af373`) found no rows at all, for Google Calendar/Gmail/Google Tasks OR Microsoft Outlook/Mail, despite this table's Google rows being marked "Registered + tested 2026-07-10" below. Whatever testing happened on 2026-07-10 did not leave a persisted connection in today's live database - either it was against a different environment, or a connection existed and was later removed/reset. Treat every "Registered + tested" claim in the multi-account suite table as **unconfirmed until re-verified against a live query**, not as ground truth. (The single-account `connections` table is more trustworthy by the same method - it does show real rows for GitHub, Slack, and Salesforce.)
- **Google Calendar's native OAuth connection is not actually wired into live calendar sync** (found 2026-07-17 while writing the per-connector runbooks below). `src/lib/calendar.functions.ts` - the code `/calendar`, Today, Focus, and Knowledge panels actually call - authenticates through the older, deprecated `connector-gateway.lovable.dev` path via a separate `GOOGLE_CALENDAR_API_KEY` + `LOVABLE_API_KEY`, not through the vaulted token this section's native OAuth flow creates. `resolveSuiteAuth` (the function that reads the vaulted native-OAuth token) is only consumed by `gmail-ingest.server.ts` and `outlook-mail-ingest.server.ts` - never by anything calendar-related. Completing the Google Calendar registration above makes the Connect button succeed and stores a real, refreshing token, but does not by itself make two-way calendar sync run through that token. Same root cause, smaller blast radius, for Google Docs: a working import path already exists (`importGoogleDoc` in `src/lib/gdocs.functions.ts`) via its own separate `GOOGLE_DOCS_API_KEY`, independent of this OAuth connection. Full detail: [`connectors/google-suite.md`](./connectors/google-suite.md)'s Known caveats section. Not yet triaged as a build item - flagging here so it isn't mistaken for "done" from the Connect button succeeding alone.
- **Google's OAuth consent screen is still in Testing publish status** (the
  "Cadence" connector app - NOT the separate "Cadence Login" app used only
  for the login/signup button, which is unaffected and already open to
  anyone). While in Testing, only Google accounts explicitly added as test
  users can get past the consent screen at all - anyone else hits `Error
403: access_denied` ("Access blocked... has not completed the Google
  verification process"). Confirmed live 2026-07-10 connecting with a real
  Google account not yet on the test-user list.
  **Founder decision (2026-07-10): deferred on purpose, not a bug to fix.**
  Strategy: stay on Testing, manually add test users as needed for demo
  purposes (Google allows up to 100), and move to full verification once the
  product is solid enough to invest in it. The real long-term fix when that
  time comes:
  - **Docs, Calendar, Tasks** use Google's standard "sensitive" scope tier -
    verification needs a live privacy policy URL, a live homepage, domain
    ownership verified in Google Search Console, and a scope-usage
    explanation. Turnaround is normally days, not weeks, once those
    prerequisites exist. Cadence has a privacy policy already; it does not
    yet have a public homepage - that is the actual blocker for even
    starting this, not anything technical.
  - **Gmail's `gmail.readonly`** is a Google _restricted_ scope, not merely
    sensitive - on top of the standard review it requires a paid third-party
    security assessment (Google calls this CASA), adding real cost and lead
    time beyond the other three. Founder ruling: pursue Docs/Calendar/Tasks
    verification first as a separate, smaller step; treat Gmail's CASA
    assessment as its own later decision, not bundled in.
  - To add a test user meanwhile: Google Console → the "Cadence" project →
    APIs & Services → OAuth consent screen → Test users → Add users.
- **Zendesk's `ZENDESK_SUBDOMAIN`** is a single, shared value - there's no
  per-connecting-user subdomain-capture step in the UI yet (Zendesk's
  authorize/token host IS the customer's own subdomain, so this only works
  for the ONE subdomain that env var names). If the Connect button is clicked
  without `ZENDESK_SUBDOMAIN` set, it fails cleanly with a "setup pending"
  message rather than redirecting to a broken host.
- **Stripe** has a real, separate, still-open gap beyond just registering the
  app: Stripe's own API-calling convention for a connected account uses the
  _platform's_ secret key plus a `Stripe-Account: <account_id>` header, not
  the OAuth `access_token` as a normal bearer token. The connect flow works
  and vaults a real token, but nothing downstream yet knows to call Stripe
  the special way. Documented in `connect/stripe/callback.ts`'s file header;
  not fixed as of 2026-07-09.
- **Linear, Notion, Google Docs, Figma, Jira, Google Tasks**: their connect
  flow is fully real (vaults a real, auto-refreshing token) but their
  provider adapters
  (`src/lib/connectors/providers/{linear,notion,google_docs,figma,jira}.server.ts`;
  Google Tasks has no adapter file yet at all, it just uses the shared stub)
  are still stub placeholders (`{validate: () => "not implemented"}`) - no
  ingest or push logic reads through these connections yet. Connecting one of
  these six will succeed with no error, but nothing visible happens
  afterward until adapter/ingest code is built for it (net-new build work,
  not a credential gap - Google Tasks additionally needs a product decision
  on what it should even do, see registry.ts's google_tasks comment). Slack,
  HubSpot, Salesforce, Intercom, Stripe, Zendesk, Canny, Productboard, Gmail,
  and Outlook Mail all DO have real ingest logic already
  (`src/lib/connectors/providers/*-ingest.server.ts`,
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
