# Microsoft Suite connector setup

> _Created: 2026-07-17 · Last updated: 2026-07-17_

**Status:** Entra app registered 2026-07-17, but **not yet confirmed live** - a direct query of `user_calendar_connections` on 2026-07-17 found zero rows for any provider. Most likely cause: the app's redirect URIs were set against `cadence-flow-beta.lovable.app`, which went dead the same day when the live domain cut over to `supaprod.ai` (see this doc's Register-the-app step 4, already corrected below) - the OAuth flow likely failed before ever reaching Supaprod's callback. One shared Entra app registration covers both Outlook Calendar and Outlook Mail. Re-verify per "Verify it works" below before treating this as done.

**Last verified:** not yet - pending re-test against the corrected redirect URIs

This one Entra app registration backs two connectors in the registry:
**Outlook Calendar** (`microsoft_outlook`) - two-way calendar sync: read events,
create meetings from decisions (`capabilities: { inflow: true, outflow: true,
sync: true }`, resource type `calendar`) - and **Outlook Mail**
(`microsoft_mail`) - pulls recent inbox messages as customer-voice and lead
signals (`capabilities: { inflow: true, outflow: false, sync: false }`,
resource type `inbox`). Both are multi-account connectors, so both write to
the `user_calendar_connections` table (not the single-account `connections`
table) - a user can connect several Microsoft accounts, and each row is keyed
by `provider: "microsoft"` with `product: "calendar"` or `product: "mail"`.

## Prerequisites

- To **register the app**: access to [entra.microsoft.com](https://entra.microsoft.com)
  with permission to create an app registration in some Entra tenant. A
  personal Microsoft account works fine for this - Entra gives every personal
  account its own default tenant, and app registrations do not require a
  paid/work org.
- To **connect an account afterward** in Supaprod: any Microsoft account works
  - personal (Skype/Xbox-style) or a work/school account in any organization
    - because the app's Supported account types and the `/common/` authorize
  endpoint (see below) deliberately accept both.

## Register the app

1. Go to [entra.microsoft.com](https://entra.microsoft.com) -> **Identity** ->
   **Applications** -> **App registrations** -> **New registration**.
2. **Name**: the operator's own choice (the working registration used
   `Cadence`, the product's name at the time of registration).
3. **Supported account types**: select **"Accounts in any organizational
   directory and personal Microsoft accounts (e.g. Skype, Xbox)"**. This is
   required, not optional - the authorize URL Supaprod calls is the `/common/`
   endpoint (`https://login.microsoftonline.com/common/oauth2/v2.0/authorize`,
   per `registry.ts`), and a narrower account-type choice breaks login for
   some users.
4. **Redirect URI**: platform **Web**, and add BOTH of these under
   **Authentication** (base URL `https://supaprod.ai`):
   - `https://supaprod.ai/api/public/connect/microsoft_outlook/callback`
   - `https://supaprod.ai/api/public/connect/microsoft_mail/callback`
5. Click **Register**.
6. On the app's **Overview** page, copy the **Application (client) ID**.
7. Go to **Certificates & secrets** -> **New client secret** -> copy the
   secret's **Value** immediately (it is shown once only; the Secret ID is
   not what you need).
8. Go to **API permissions** -> **Add a permission** -> **Microsoft Graph** ->
   **Delegated permissions**, and add:
   - `Calendars.ReadWrite`
   - `Mail.Read`
   - `User.Read`
   - `offline_access`

   (This is the union of both connectors' scopes in `registry.ts`:
   `microsoft_outlook` requests `Calendars.ReadWrite`, `User.Read`,
   `offline_access`; `microsoft_mail` requests `Mail.Read`, `User.Read`,
   `offline_access`. One shared app needs all four delegated permissions
   granted once.)

## Copy the credentials into Lovable

Add exactly these two secrets in **Lovable Cloud -> Project -> Secrets**
(sourced from both registry entries' `clientIdEnv`/`clientSecretEnv`, which
are identical since they share one app):

- `MICROSOFT_CLIENT_ID` - the Application (client) ID from step 6
- `MICROSOFT_CLIENT_SECRET` - the client secret Value from step 7

These go into **Lovable Cloud secrets**, not this project's local `.env` -
`.env` is dev-only and git-ignored per this repo's env var split convention,
and the deployed callback routes read `process.env.MICROSOFT_CLIENT_ID` /
`process.env.MICROSOFT_CLIENT_SECRET` from the Cloudflare Worker's runtime
environment, which Lovable Cloud secrets populate.

## Verify it works

1. In Supaprod, go to **Settings -> Connections**.
2. Find the **Outlook Calendar** card and click **Connect**. It redirects to
   the real Microsoft consent screen; after signing in and approving, it
   redirects back to Settings -> Connections showing a connected Microsoft
   account (email/display name).
3. Repeat for the **Outlook Mail** card - it is a separate Connect button
   against the same underlying Entra app, so it can be authorized with the
   same or a different Microsoft account.
4. Success looks like: each connected account appears under its connector's
   card in Settings -> Connections, and a corresponding row exists in
   `user_calendar_connections` with `provider = 'microsoft'` and
   `product = 'calendar'` or `product = 'mail'`.

## Switching to a different account or org later

**No new app registration is needed to switch which end-user Microsoft
account is connected.** The Entra app (`MICROSOFT_CLIENT_ID` /
`MICROSOFT_CLIENT_SECRET`) belongs to whoever created the registration - it
is independent of which end-user account later signs in through it. Because
Supported account types is already set to "any organizational directory and
personal Microsoft accounts" and the authorize call goes to the `/common/`
endpoint, this one existing app can already authorize any Microsoft account
in any tenant, personal or work/school - that is precisely why that account
type setting was required during registration.

So a same-app account swap is just: disconnect the old account (or leave it
connected, since this is multi-account) and click **Connect** again in
Settings -> Connections, then sign in with the new Microsoft account at the
consent screen. The same `MICROSOFT_CLIENT_ID`/`MICROSOFT_CLIENT_SECRET`
already in Lovable keep working unchanged.

A brand **new** app registration would only be needed if the app itself had
to move to an audience this registration doesn't cover - for example, a
future requirement to narrow Supported account types to a single specific
organization's tenant only (not the case today, and would itself break
login for personal-account users per the note above). Rotating a
compromised or expiring secret does **not** need a new registration either -
just **Certificates & secrets -> New client secret** on this SAME app, then
update `MICROSOFT_CLIENT_SECRET` in Lovable to the new value.

## Known caveats

- **Token refresh is real and automatic.** Microsoft's OAuth grant includes
  `offline_access`, so both `microsoft_outlook` and `microsoft_mail` are
  marked `supportsRefresh: true` in `registry.ts` and are proactively
  refreshed before expiry (`src/lib/connectors/oauth-refresh.server.ts`) -
  neither is in the small excluded list (Stripe, Notion).
- **Outlook Mail has real ingest logic already wired in** - it is registered
  in `src/lib/connectors/providers/pull-ingestors.server.ts` as
  `{ provider: "microsoft_mail", ingest: ingestOutlookMailSignals }` and runs
  every sense-tick, unlike the stub-placeholder group of connectors
  documented in `docs/operations/connector-setup.md` (Linear, Notion, Google
  Docs, Figma, Jira, Google Tasks), whose provider adapters are still
  `{validate: () => "not implemented"}`.
- The generic `CONNECTOR_ADAPTERS` validate-stub map in
  `src/lib/connectors/providers/index.server.ts` lists both
  `microsoft_outlook` and `microsoft_mail` against `stubAdapter` - this is
  expected, not a gap: that map backs a separate, unrelated generic
  `validate()` check, while the real functionality for both connectors
  (calendar read/write via `calendar.functions.ts` /
  `calendar-connections.functions.ts`, and mail ingest via
  `outlook-mail-ingest.server.ts`) lives in its own dedicated code path, the
  same pattern Google Calendar/Gmail/Google Tasks use.

## Code references

- `src/lib/connectors/registry.ts` - `microsoft_outlook` and `microsoft_mail`
  registry entries (auth method, scopes, capabilities, resource types).
- `src/routes/api/public/connect/microsoft_outlook/callback.ts` - Outlook
  Calendar OAuth callback (token exchange, Graph `/me` probe, upsert into
  `user_calendar_connections` with `product: "calendar"`).
- `src/routes/api/public/connect/microsoft_mail/callback.ts` - Outlook Mail
  OAuth callback, same shape with `product: "mail"`.
- `src/lib/connectors/providers/outlook-mail-ingest.server.ts` - Outlook Mail
  ingest adapter (`ingestOutlookMailSignals`), registered in
  `pull-ingestors.server.ts`.
- `src/lib/calendar-connections.functions.ts` - `startSuiteConnect` and the
  multi-account connect/list logic shared by the Google and Microsoft suites.
- `src/components/connections/AccountConnectionsSection.tsx` - the Settings ->
  Connections UI, including the `microsoft_outlook`/`microsoft_mail` ->
  `{ provider: "microsoft", product }` mapping.

## Related

- [`../connector-setup.md`](../connector-setup.md) - the full per-provider
  connector registration table and the shared "Known caveats" section this
  doc draws from.
- [`./README.md`](./README.md)
