# Salesforce connector setup

> _Created: 2026-07-17 · Last updated: 2026-08-03_

**Status:** Verified working - registered + tested 2026-07-10 - real per-user OAuth connection live, replaced a dead legacy admin token.
**Last verified:** 2026-07-17

Salesforce is Supaprod's win/loss signal source: it pulls recently **closed-lost Opportunities** as inflow signals (`capabilities: { inflow: true, outflow: false, sync: false }` in `registry.ts`) - there is no outflow (Supaprod never writes back to Salesforce) and no two-way sync. It is a **single-account connector** - one connection per Supaprod user, stored in the `connections` table (`provider: "salesforce"`, `auth_kind: "token"`), not `user_calendar_connections` (that table is calendar/mail-suite only).

## Prerequisites

- Access to Salesforce **Setup** with permission to create Connected Apps / External Client Apps - a System Administrator profile, or any profile granted "Customize Application" / "Manage Connected Apps", covers this.
- The target org's own REST API host (the domain you see in the browser address bar while logged into that org, e.g. `https://yourdomain.my.salesforce.com`) - you'll need this as its own secret, separately from the OAuth app itself (see "Copy the credentials into Lovable" below).
- API access enabled for the org edition (Developer, Enterprise, Unlimited, or Professional with the API add-on).

## Register the app

1. In Salesforce, open **Setup** (gear icon, top right) → Quick Find → **App Manager** → **New Connected App**. (Salesforce has been migrating this feature to **"New External Client App"** in newer orgs - if that's what your org shows instead, use it; the fields below map the same way.)
2. **Connected App Name** / **External Client App Name**: your own choice (e.g. `Supaprod`). **Contact Email**: your own email.
3. Under **API (Enable OAuth Settings)**, check **Enable OAuth Settings**.
4. **Callback URL** - exact value:
   ```
   https://supaprod.ai/api/public/connect/salesforce/callback
   ```
5. **Selected OAuth Scopes** - move exactly these two from Available to Selected (verbatim from `registry.ts`'s `scopes: ["api", "refresh_token"]`):
   - `Manage user data via APIs (api)`
   - `Perform requests at any time (refresh_token, offline_access)`
6. Leave **Require Secret for Web Server Flow** checked (the default) - the callback (`callback.ts`) always sends `client_secret` in the token-exchange body, so this must stay on.
7. **Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows**: check this if your org's security policy enforces PKCE on connected apps (this org's did - that's what drove the `pkce: true` fix in `registry.ts`, confirmed 2026-07-10). This is org-dependent, not universal - either way, nothing else to configure on the Supaprod side: `pkce: true` in the registry already makes `startNativeOAuthConnect` (`connections.functions.ts`) call `makePkcePair()` (the same PKCE helper GitHub's flow uses, in `github.server.ts`) and send a real `code_challenge` on every Salesforce authorize request, and the callback echoes the matching `code_verifier` back on token exchange. Leaving the box unchecked doesn't break anything; checking it when the org doesn't require it also doesn't break anything.
8. **Permitted Users**: your call depending on org policy (defaults to "All users may self-authorize" unless the org restricts Connected App access to specific profiles/permission sets).
9. Save. Salesforce warns changes can take up to ~10 minutes to propagate - expected, not an error.
10. Reopen the app → **Manage** → under OAuth settings click **"Consumer Key and Secret"** (may prompt an emailed verification code) → copy both the **Consumer Key** and **Consumer Secret**. They're two separate values.
11. Confirm the org's REST API host again (same address-bar domain as in Prerequisites) - don't confuse it with the separate `...salesforce-setup.com` Setup admin domain, and don't include anything after the domain.

## Copy the credentials into Lovable

Three secrets, all going into **Lovable Cloud → Project → Secrets** - not the local `.env` file (that's dev-only and git-ignored, per this repo's env-var split convention):

| Lovable secret | Value |
| --- | --- |
| `SALESFORCE_CLIENT_ID` | the Consumer Key from step 10 |
| `SALESFORCE_CLIENT_SECRET` | the Consumer Secret from step 10 |
| `SALESFORCE_INSTANCE_URL` | the org's REST API host from step 11 |

`SALESFORCE_INSTANCE_URL` needs a callout: Salesforce's own token response *does* return a per-connection `instance_url`, and the OAuth callback (`callback.ts`) does capture it into that connection's `metadata.instance_url` - but nothing downstream reads that per-connection value today. The adapter's `validate()` (`salesforce.server.ts`) and the ingest job (`salesforce-ingest.server.ts`) both read `process.env.SALESFORCE_INSTANCE_URL` directly instead. Practically: this one secret is **global, not per-user** - every Supaprod workspace's Salesforce ingest points at whichever org this secret names, regardless of which org any individual user's OAuth connection actually authorized against. Set it, or ingest silently no-ops (`{ inserted: 0, skipped: 0, source: "none" }`) even after a fully successful Connect.

## Verify it works

1. In Supaprod: **Settings → Connections**, find the Salesforce card.
2. Click **Connect** - it redirects to Salesforce's own login/consent screen.
3. After approving, Salesforce redirects back through the callback, which shows a branded "Salesforce connected" interstitial, then returns to **Settings → Connections**.
4. Success = the card shows status **Connected** with an account label pulled from Salesforce's identity endpoint (the org display name, with the organization ID in parentheses when available - e.g. `Jane Doe (00Dxx0000001234)` - falling back to just the Salesforce username if the identity lookup doesn't return a display name).
5. On the next scheduled sense-tick pull, closed-lost Opportunities (up to 30, newest by close date) land as signals via `writeSignals` - conditioned on `SALESFORCE_INSTANCE_URL` being set (above) and the workspace's plan tier having inflow (Pro+).

## Switching to a different account or org later

**Same org, different Supaprod user connecting:** no new registration needed. Just have that user click Connect (or Reconnect) - the registered Connected App (Consumer Key/Secret) belongs to whoever created it in Salesforce Setup, independent of which end user later authorizes against it, so it keeps working as-is. Each Supaprod user has at most one Salesforce connection row (`user_id` + `provider` + `auth_kind: "token"`); reconnecting updates that row in place and deletes the old vaulted secret (`callback.ts`'s update-or-insert logic) - nothing to clean up by hand.

**Switching to a genuinely different Salesforce org:** this DOES require a new Connected App, because Salesforce Connected Apps live inside the org that created them - a Consumer Key registered in Org A is not a valid `client_id` against Org B. To move:

1. Repeat "Register the app" above, inside the new org.
2. Update `SALESFORCE_CLIENT_ID` and `SALESFORCE_CLIENT_SECRET` in Lovable Secrets to the new org's Consumer Key/Secret.
3. Update `SALESFORCE_INSTANCE_URL` to the new org's REST API host.
4. Have affected users click Connect again to get a fresh token against the new org. No code change needed either way.

Because `SALESFORCE_INSTANCE_URL` is one global secret (see the callout above), step 3 switches ingest for **every** workspace's Salesforce connection to the new org at once - there's no per-workspace override today. Plan a real-org cutover accordingly; it isn't scoped to one user.

## Known caveats

- **PKCE is required by this org's security policy**, which is why `registry.ts` carries `pkce: true` (a registry fix made 2026-07-10, not the original default) - see "Register the app" step 7 above.
- **`envFallback.tokenEnv: "SALESFORCE_ACCESS_TOKEN"`** still exists in `registry.ts` as a legacy fallback path (`resolve.server.ts`'s step-3 "legacy env fallback") - this is the old dead admin-token path the 2026-07-10 OAuth registration replaced, not an alternative to configure today.
- **`SALESFORCE_INSTANCE_URL` is one global secret, not per-connection** - see the callout in "Copy the credentials into Lovable" and the org-switching section above.
- **Salesforce's token response has no `expires_in`** - real session lifetime is an org-configurable policy, not a fixed grant duration, so `callback.ts` uses a conservative 90-minute heuristic (`token_expires_at`) for `resolve.server.ts`'s proactive refresh rather than trusting any fixed window.
- **Refresh token rotation is real and automatic** here - Salesforce is not in the refresh-disabled exception list (that's Stripe and Notion only, both marked `supportsRefresh: false` in `registry.ts` for their own separate reasons).

## Code references

- `src/lib/connectors/registry.ts` - the `salesforce` registry entry (auth method, scopes, `pkce: true`, `envFallback`, `capabilities`)
- `src/routes/api/public/connect/salesforce/callback.ts` - the OAuth callback (token exchange, identity lookup, vaulting, connection upsert)
- `src/lib/connectors/providers/salesforce.server.ts` - the adapter's `validate()` (reads `SALESFORCE_INSTANCE_URL`, calls the org's `/limits` endpoint)
- `src/lib/connectors/providers/salesforce-ingest.server.ts` - the ingest job (pulls closed-lost Opportunities into `writeSignals`)
- `src/lib/connectors/resolve.server.ts` - `resolveProviderAuth` / `materializeAuth` (how a stored connection resolves to a bearer token at call time)
- `src/lib/connectors/providers/github.server.ts` - `makePkcePair`, the shared PKCE helper this flow reuses

## Related

- [`../connector-setup.md`](../connector-setup.md) - the native-OAuth rollout this connector is part of (status table, shared "Known caveats" section, the one-time-per-provider registration steps)
- [`./README.md`](./README.md)
- [`../signal-fabric-connector-setup.md`](../signal-fabric-connector-setup.md) - the earlier admin-token-only setup doc for this same provider (the `SALESFORCE_ACCESS_TOKEN` / `SALESFORCE_INSTANCE_URL` client-credentials flow this connector's OAuth registration replaced)
