# GitHub connector setup

> _Created: 2026-07-17 · Last updated: 2026-07-17_

**Status:** Verified working - registered + tested, GitHub App install flow (F-CONN Phase 1, predates the SW-7 native-OAuth rollout)
**Last verified:** 2026-07-17

GitHub is Supaprod's **inflow + outflow** connector (`capabilities: { inflow: true, outflow: true, sync: false }` in `registry.ts`): it ships specs out as GitHub issues, pulls back closed issues/PRs/releases/CI status as shipped-work signals, and (via Build) reads and writes repo contents, branches, and pull requests. Its one resource type is `repo` (`resourceTypes: [{ kind: "repo", label: "Repository" }]`). The connection is stored in the plain **`connections`** table (not `user_calendar_connections` - GitHub is single-account, one App installation per Supaprod user), with `provider = 'github'`, `auth_kind = 'github_app'`, `external_handle` = the GitHub installation ID, and `account_label` = the installed-on org/user login.

Unlike every other connector in `registry.ts` (`oauth_native`, client ID + secret against a standard `/authorize` + `/token` pair), GitHub uses a distinct `kind: "github_app"` auth method - a **GitHub App** (App ID + private key JWT + per-account installation), not a classic OAuth app. Supaprod authenticates purely server-to-server: it mints a short-lived App JWT from the private key, exchanges that for a per-installation access token, and never processes a user-facing OAuth `code` at all.

## Prerequisites

- A GitHub account with access to register a GitHub App: a personal account works for **Settings -> Developer settings -> GitHub Apps** (github.com/settings/apps), or org **owner** access for **Organization settings -> Developer settings -> GitHub Apps** if the app should live under an org instead of a personal account.
- To later **install** the app on a target org or repo (a separate step from registering it, see "Switching" below): owner/admin rights on that specific org or repo. Some orgs restrict who can approve new app installations even for org members.
- `CONNECTOR_SECRETS_KEY` must already be set in Lovable (a shared platform secret, unrelated to this specific app) - it is what HMAC-signs the connect-state token this flow rides on (`stateHmac` / `makeConnectState` in `github.server.ts`); without it the Connect button's server call throws before ever reaching GitHub.

## Register the app

All of this happens in GitHub's own console, via the manual "New GitHub App" form (not the App Manifest flow):

1. Go to **github.com/settings/apps** (personal account) or the target org's **Settings -> Developer settings -> GitHub Apps**, then **New GitHub App**.
2. **GitHub App name**: the operator's own choice, but it must be globally unique across all of GitHub (the working registration used a `Cadence`-branded name, predating the 2026-07-17 rename to Supaprod - the registered App itself does not need to be renamed for the integration to keep working). This name's slugified form becomes `GITHUB_APP_SLUG`.
3. **Homepage URL**: the operator's choice - the working registration points it at the production app, `https://supaprod.ai`.
4. **Identifying and authorizing users -> Callback URL**: leave blank, and leave **"Request user authorization (OAuth) during installation"** unchecked. Supaprod's GitHub connector never exchanges a user-facing OAuth `code` - `src/routes/api/public/connect/github/callback.ts` only ever reads `installation_id` / `setup_action` / `state`, never a `code` param.
5. **Post installation -> Setup URL (optional)**: set it to exactly `https://supaprod.ai/api/public/connect/github/callback` (production base URL + the callback route this repo actually implements), and check **Redirect on update** so both fresh installs and later permission-update approvals redirect back here.
6. **Webhook**: check **Active**, set **Webhook URL** to `https://supaprod.ai/api/public/hooks/github-webhook`, and set **Webhook secret** to a strong random string you generate yourself - copy it, it becomes `GITHUB_WEBHOOK_SECRET` in Lovable and must match exactly on both sides (GitHub HMAC-signs each delivery with it; `github-webhook.ts` rejects anything that doesn't verify).
7. **Permissions -> Repository permissions**, set:
   - **Contents**: Read and write
   - **Issues**: Read and write
   - **Pull requests**: Read and write
   - **Metadata**: Read-only (mandatory baseline GitHub adds automatically)
   - **Checks**: Read-only, and **Commit statuses**: Read-only - these back the CI-status polling path (`github-repo.server.ts` reads check-runs and commit statuses for build verification), not just the issues/PR/contents flow.
   No organization- or account-level permissions are needed.
8. **Subscribe to events** (appears once relevant permissions are picked above): tick **Check suite**, **Check run**, **Pull request**, and **Status** - exactly the four event types `github-webhook.ts`'s `RELEVANT_EVENTS` set listens for.
9. **Where can this GitHub App be installed?**: select **Any account**. This is what lets a different org or user install the app later without re-registering it (see "Switching" below).
10. Click **Create GitHub App**.
11. On the app's page, copy the **App ID** (near the top of **General**) for `GITHUB_APP_ID`, and note the slug from the app's own settings URL (`github.com/settings/apps/<slug>`) for `GITHUB_APP_SLUG`.
12. Scroll to **Private keys -> Generate a private key**. This downloads a `.pem` file once - GitHub does not keep a copy, so store it securely. GitHub generates this key in PKCS#1 format (`-----BEGIN RSA PRIVATE KEY-----`); Supaprod's code needs PKCS#8 and throws an explicit error if it detects PKCS#1 (`GITHUB_APP_PRIVATE_KEY is PKCS#1 ...; WebCrypto needs PKCS#8`, `github.server.ts`'s `importAppKey`). Convert it before pasting into Lovable:
    ```
    openssl pkcs8 -topk8 -nocrypt -in downloaded-key.pem -out converted-key.pem
    ```

Registering the app does **not** connect it to any repos yet - that is the separate **install** step:

13. Still on the app's page (or via `github.com/apps/<slug>`), use **Install App**, pick the target org or user account, choose **All repositories** or specific repos, and approve. This is exactly the step that changes later when switching accounts/orgs (see below) - it is independent of everything above.

## Copy the credentials into Lovable

Add these to **Lovable Cloud -> Project -> Secrets** (production secrets - not this repo's local `.env`, which is dev-only and git-ignored per this repo's env var split convention):

- `GITHUB_APP_ID` - the App ID from step 11
- `GITHUB_APP_SLUG` - the app's slug from step 11
- `GITHUB_APP_PRIVATE_KEY` - the full (PKCS#8-converted) private key contents from step 12. If your secrets UI forces a single-line value, literal `\n` escapes are fine - `github.server.ts` un-escapes them back to real newlines before use.
- `GITHUB_WEBHOOK_SECRET` - the same secret string set on the app's Webhook section in step 6.

These four are what `deriveProviderAvailability()` (`src/lib/connections.functions.ts`) and the actual JWT-signing/webhook-verification code paths read. Note: `registry.ts`'s `github_app` auth method also declares `GITHUB_APP_CLIENT_ID` and `GITHUB_APP_CLIENT_SECRET` in its `requiredEnv` list (the Client ID / a generated client secret shown on the same General page), but as of this writing no server code path reads either value - `deriveProviderAvailability()` only checks `GITHUB_APP_ID`/`GITHUB_APP_SLUG`, and `docs/operations/connector-setup.md`'s own GitHub row lists only the three secrets above. Setting the client ID/secret costs nothing extra (same page) but isn't required for the connector to work today.

Separately, and **not** part of the App credentials above: `GITHUB_TOKEN` is a fallback personal access token (`envFallback.tokenEnv` in `registry.ts`), used only when neither a workspace repo binding nor a user connection exists yet (resolve order: workspace binding -> user connection -> this env fallback, per `resolveGitHub()`). `GITHUB_REPO` is the default `owner/name` repo slug paired with it. Both predate the App flow and are a legacy/dev fallback, not something to confuse with the App's own secrets.

## Verify it works

1. In Supaprod, go to **Settings -> Connections**. The GitHub card shows a real **Connect** button once `GITHUB_APP_ID` and `GITHUB_APP_SLUG` are both set (before that it renders the "Admin setup required" state, per `setupHint`: "Register the GitHub App (GitHub -> Settings -> Developer settings -> GitHub Apps).").
2. Click **Connect**. This is a full-page redirect (not a popup) to `https://github.com/apps/<slug>/installations/new?state=...` (`startGithubAppConnect` in `connections.functions.ts`).
3. Choose the account and repos, approve. GitHub redirects back to `/api/public/connect/github/callback`, which redirects again into Settings -> Connections (or back into `/onboarding?connected=github` if the connect was started from onboarding).
4. Success looks like: Settings -> Connections shows GitHub as connected with the installed-on org/user's login as the account label, and a row exists in `connections` with `provider = 'github'`, `auth_kind = 'github_app'`, `status = 'connected'`, `external_handle` set to the installation ID.
5. If no `GITHUB_REPO` env fallback names a repo, bind one explicitly at **/sync** (workspace-level resource binding) - `resolveGitHub()` needs a resolved repo (`binding` -> `user_connection` + env repo -> `env`) before any GitHub call site (Build, spec-to-issue, CI polling) will actually do anything.

## Switching to a different account or org later

**No new App registration is needed to move Supaprod to a different org or repo.** The registered App (`GITHUB_APP_ID`, `GITHUB_APP_SLUG`, the private key) belongs to whoever created it in GitHub's Developer settings - that's independent of which org or user later installs it. Because this App's **"Where can this GitHub App be installed?"** was set to **Any account** during registration, any org owner (or the founder's own account) can install the same, already-registered App onto a new target without touching the registration at all.

Switching is specifically an **install/uninstall** action, not a re-registration, because GitHub Apps are installed per-org/per-repo rather than authorized per-user like a normal OAuth app:

1. As an owner/admin of the **new** target org (or on your own account for a personal repo), go to `github.com/apps/<slug>` and use **Install** (or **Configure** if already installed elsewhere), choosing **All repositories** or specific repos.
2. In Supaprod, click **Connect** again on the GitHub card in Settings -> Connections so the new installation gets vaulted (a fresh `installation_id`), then re-bind the repo at **/sync** if it changed.
3. If the **old** org/repo should no longer have Supaprod's access, uninstall the App from that account - from that org's **Settings -> Installed GitHub Apps -> Uninstall**, or from the app owner's side via **Install App** (which lists every account it's installed on, with an uninstall action per account).

A brand-new App registration is only needed if the App's own identity has to change - for example, if `GITHUB_APP_ID`/`GITHUB_APP_SLUG` need to move to an audience this registration doesn't cover (it was restricted to "Only on this account" and you no longer have access to loosen that), or a deliberate decision to run a second, separately-branded app. Even moving **ownership** of the app itself to a different GitHub user or org doesn't require re-registering - GitHub Apps support **Transfer ownership** under the app's **Advanced** settings tab. Rotating a compromised or expiring private key also doesn't need a new registration: **General -> Private keys -> Generate a private key** on the same app (then delete the old one), and update `GITHUB_APP_PRIVATE_KEY` in Lovable.

## Known caveats

`docs/operations/connector-setup.md` records no GitHub-specific caveat - its "Known caveats" section is about the six SW-7 native-OAuth providers (Google's Testing-mode consent screen, Zendesk's single shared subdomain, Stripe's connected-account auth model, the Linear/Notion/Google Docs/Figma/Jira/Google Tasks stub-adapter group, and the refresh-exclusion list). GitHub predates that rollout - it's the precedent the doc cites the native-OAuth pattern against - and its row is simply **"Done, working."** Two real, code-sourced notes worth keeping in mind:

- The webhook (`src/routes/api/public/hooks/github-webhook.ts`) is a **latency optimization, not a dependency**. `runCiPollTick` already runs on its own 2-minute `pg_cron` tick regardless; the webhook just reacts within seconds instead of waiting for the next tick. If the Webhook URL/secret is ever left unset or misconfigured, CI-status detection still works, just slower.
- GitHub's ingest (issues/events/releases/CI status via `github-ingest.server.ts` and `github-repo.server.ts`) runs through Supaprod's Scout/sense-tick pipeline, not the newer `pull-ingestors.server.ts` registry the SW-7 providers use - it is real, wired-in logic either way, not one of the stub placeholders documented for the other six.

## Code references

- `src/lib/connectors/registry.ts` - the `github` entry (`id`, `label`, `description`, `capabilities`, `resourceTypes`, `envFallback`, `setupHint`) and the `github_app` member of the `AuthMethod` union (`appSlugEnv`, `requiredEnv`).
- `src/lib/connectors/providers/github.server.ts` - App JWT minting (`appJwt`/`importAppKey`), installation token caching (`mintInstallationToken`), the installation account probe (`getInstallationAccount`), connect-state HMAC (`makeConnectState`/`readConnectState`), the `githubAdapter` `ConnectorAdapter`, and `resolveGitHub()` (the one entry point every GitHub call site uses). Also hosts `makePkcePair`, a generic RFC 7636 PKCE helper shared by other native-OAuth providers (e.g. Salesforce) - not part of GitHub's own auth flow, which doesn't use PKCE.
- `src/lib/connectors/providers/github-repo.server.ts` - the repo-operations adapter (contents, branches/commits, pull requests, check-runs/commit-status/deployments reads) used by Build.
- `src/lib/connectors/providers/github-ingest.server.ts` / `github-signals.ts` - inflow signal extraction (issues, events, releases, CI status) via Scout/sense-tick.
- `src/routes/api/public/connect/github/callback.ts` - the GitHub App installation callback (`installation_id`/`setup_action`/`state`), upserts the `connections` row, kicks first ingest.
- `src/routes/api/public/hooks/github-webhook.ts` - the webhook receiver (signature verification, relevant-event filter, fire-and-forget `runCiPollTick`).
- `src/lib/connections.functions.ts` - `deriveProviderAvailability()` (env-configured check) and `startGithubAppConnect()` (builds the install URL).

## Related

- [`../connector-setup.md`](../connector-setup.md) - the full per-provider connector registration table and the shared "Known caveats" section this doc draws from.
- [`./README.md`](./README.md)
- [`./slack.md`](./slack.md) and [`./microsoft-suite.md`](./microsoft-suite.md) - sibling per-provider write-ups in this same folder, same structure.
