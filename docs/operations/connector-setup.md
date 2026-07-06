# Connector setup: enabling the "Connect" flow

> _Created: 2026-07-06 · Last updated: 2026-07-06_

This is the founder checklist for turning a connector from "Coming soon" into a
live, connectable source. The connect flow itself is fully built (see
`src/lib/connections.functions.ts`); it is gated on credentials so a "Connect"
button never appears before it can actually work (the humanized-output / claim-
never-outruns-wiring law).

## The two credential paths

Every connector supports up to two paths. A connector is no longer "Coming soon"
the moment ONE of them is configured:

1. **OAuth gateway (per-user "Connect" popup).** The real browser-authorize
   flow: user clicks Connect, the provider's OAuth page opens, they authorize,
   the Lovable connector gateway posts back a `connection_id`, and Cadence
   stores only that id (tokens live in the gateway). This is the enterprise
   "connect to your account" pattern. It needs, in the environment:
   - `LOVABLE_API_KEY` (shared, gates ALL gateway connectors), **and**
   - the provider's `*_APP_USER_CONNECTOR_CLIENT_ID` (from the OAuth app you
     registered in that provider's developer console).
   When both are present, `providerConfigured` returns true and the **Connect**
   button appears and runs the real OAuth.

2. **Workspace env token (server-side ingestion).** A shared token set by the
   admin. Cadence reads/ingests through it without a per-user grant. When the
   provider's `tokenEnv` is set, the card shows **Active** (not "Coming soon").
   This is what powers a connector you have "already given access" to via a key.

## Where to set them

- **Local dev server (`bun run dev`):** this repo's git-ignored `.env`. The dev
  server reads these directly, so setting them here lights up the connectors
  locally.
- **Production (published app):** Lovable project secrets (Lovable manages the
  deployed environment). Set the same names there.

## Per-provider env vars

| Provider | OAuth client id (Connect popup) | Workspace token (Active ingestion) |
| --- | --- | --- |
| GitHub | `GITHUB_APP_ID` + `GITHUB_APP_SLUG` (+ `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY` to use it) | `GITHUB_TOKEN` |
| Figma | `FIGMA_APP_USER_CONNECTOR_CLIENT_ID` | - |
| Linear | `LINEAR_APP_USER_CONNECTOR_CLIENT_ID` | `LINEAR_API_KEY` |
| Notion | `NOTION_APP_USER_CONNECTOR_CLIENT_ID` | `NOTION_API_KEY` |
| Jira (Atlassian) | `ATLASSIAN_APP_USER_CONNECTOR_CLIENT_ID` | - |
| Google Docs | `GOOGLE_APP_USER_CONNECTOR_CLIENT_ID` | `GOOGLE_DOCS_API_KEY` |
| Google Calendar | `GOOGLE_APP_USER_CONNECTOR_CLIENT_ID` | - |
| Microsoft Outlook | `MICROSOFT_APP_USER_CONNECTOR_CLIENT_ID` | - |
| Intercom | `INTERCOM_APP_USER_CONNECTOR_CLIENT_ID` | `INTERCOM_ACCESS_TOKEN` |
| Zendesk | `ZENDESK_APP_USER_CONNECTOR_CLIENT_ID` | `ZENDESK_API_TOKEN` |
| Slack | `SLACK_APP_USER_CONNECTOR_CLIENT_ID` | `SLACK_BOT_TOKEN` |
| Stripe | `STRIPE_APP_USER_CONNECTOR_CLIENT_ID` | `STRIPE_API_KEY` |
| HubSpot | `HUBSPOT_APP_USER_CONNECTOR_CLIENT_ID` | `HUBSPOT_ACCESS_TOKEN` |
| Salesforce | `SALESFORCE_APP_USER_CONNECTOR_CLIENT_ID` | `SALESFORCE_ACCESS_TOKEN` |
| Canny | `CANNY_APP_USER_CONNECTOR_CLIENT_ID` | `CANNY_API_KEY` |
| Productboard | `PRODUCTBOARD_APP_USER_CONNECTOR_CLIENT_ID` | `PRODUCTBOARD_API_TOKEN` |
| Delighted | `DELIGHTED_APP_USER_CONNECTOR_CLIENT_ID` | `DELIGHTED_API_KEY` |

`LOVABLE_API_KEY` is required in addition, for ALL of the OAuth-gateway rows.

## Current state (2026-07-06, from local `.env`)

Present workspace tokens (so these now show **Active**): `HUBSPOT_ACCESS_TOKEN`,
`CANNY_API_KEY`, `FIRECRAWL_API_KEY`. No `*_APP_USER_CONNECTOR_CLIENT_ID` and no
`LOVABLE_API_KEY` are set, so no per-user **Connect** button lights up yet. To
enable the click-to-authorize flow for, say, Figma: register a Figma OAuth app,
then set `FIGMA_APP_USER_CONNECTOR_CLIENT_ID` and `LOVABLE_API_KEY` in `.env`
(dev) and in Lovable secrets (prod).

## What the code does with these

- `deriveProviderAvailability()` (`connections.functions.ts`) reads the env and
  reports `gatewayConfigured` / `githubAppConfigured` / `envConfigured` per
  provider.
- The Connections UI (`AccountConnectionsSection.tsx`) shows **Connect** when an
  OAuth path is configured, **Active** when only a workspace token is set, and
  **Coming soon** when neither is.
- `startGatewayConnect` opens the provider authorization URL; `saveGatewayConnection`
  persists the returned `connection_id`. Nothing here needs code changes to
  enable a provider, only the env vars above.
