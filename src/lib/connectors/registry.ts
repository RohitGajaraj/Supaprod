// F-CONN Phase 1 — connector registry (client-safe; env names are data only,
// never read here). Server code resolves credentials through
// src/lib/connectors/resolve.server.ts — the single chokepoint.
//
// POLICY (founder decision): user-facing connectors are OAuth-only. Each
// provider gets a single Connect button that round-trips through the Lovable
// connector gateway — tokens live in the gateway, we store only the gateway
// connection_id (precedent: calendar-connections.functions.ts). NO user-facing
// entry may use the api_key method; pasted keys in our DB are rejected.
// Until the founder registers a provider's OAuth client (clientIdEnv below),
// the UI renders an explanatory not-yet-available state from setupHint plus
// the missingEnv list returned by listConnections. "Admin setup required" is
// this file's shorthand for that state and is NOT a string the product renders
// anywhere. The words on screen are `NOT_SET_UP_HERE`, below, and they are one
// string in one place -- see the note on it for why they used to be two.
//
// COPY IS A PROMISE (2026-08-06 audit). `description` is not an internal note,
// and it reaches a reader through six paths, only two of them verbatim:
//   verbatim   the connector detail page's subtitle, twice —
//              AccountConnectionsSection.tsx:994 (configured) and :1028 (not
//              yet available).
//   appended   :1041 adds "Connect it once and what it syncs starts feeding
//              the company brain." unconditionally, and connectHintFor (:327-332)
//              adds "Connecting opens <label>'s own sign-in." — so the
//              catalogue cell's hover hint is specifically NOT verbatim.
//   searched   the catalogue's own filter matches against it (:546).
//   copied     catalog.ts:152 carries it onto every CatalogEntry.
//   spoken     the agent tool `sources.connect` hands it straight to the model
//              (ai/tools/registry.server.ts:496), so a wrong line here is a
//              wrong line the assistant says out loud.
// A visitor reads any of these as a shipped feature. There is NO "not yet
// available" flag in this registry — the
// four UI states (connected / env-active / connect / soon) are all derived from
// whether the OAuth client env vars are set, never from whether an adapter
// exists — and `userFacing: false` is not it either: that hides an entry
// completely and means "platform infrastructure, env-resolved". So a provider
// whose connect flow works while its capability is unbuilt has to say that in
// its own `description`, and three of them do below (figma, jira,
// google_tasks). If a real state flag ever lands, move them onto it.
//
// AND NO AUTOMATED GATE IS WATCHING THOSE STRINGS. `description`, `label` and
// `setupHint` are consumer copy, but check-humanized.sh scopes itself to an
// ALLOWLIST -- CONSUMER_RE at scripts/check-humanized.sh:89 is
// `^(src/components/|src/routes/|src/lib/ai/prompts|src/lib/ai/humanize)` -- and
// src/lib/connectors/ is in none of those. That is a deliberate founder ruling
// (scripts/check-humanized.sh:14-16 and :70-73, 2026-08-03: scan what a human or
// a model will actually read, and treat the rest of src/lib as "server logic
// whose dashes never leave the repo"), not an oversight in the script. This file
// is simply the case that ruling did not anticipate, because it is the one
// src/lib path whose data IS the sentences on screen.
// It has already cost us once. The three "not built yet" descriptions below
// landed carrying an em dash in 0bb7df15 on 2026-08-06, and the very next commit
// 49 seconds later (434e2038) was a dedicated em-dash sweep that fixed six of
// them in two OTHER files and never saw these, because the hook does not look
// here and neither did the sweep. Until the allowlist grows a row
// for this file, apply docs/conventions/humanized-output.md:94 BY HAND to every
// string literal here: no em dash, no en dash, no AI cliches.

export type ProviderId =
  | "github"
  | "linear"
  | "notion"
  | "google_docs"
  | "google_calendar"
  | "gmail"
  | "google_tasks"
  | "microsoft_outlook"
  | "microsoft_mail"
  | "figma"
  | "jira"
  | "firecrawl"
  | "intercom"
  // SF-CONNECTORS (Signal Fabric Phase 2) — the inside-out customer-voice fleet. Pull
  // connectors: every one reads customer voice in, and Slack alone also writes back (the
  // stakeholder digest, JNY-05). Each works today on its env-secret token path. All of
  // them except Canny have since been converted to per-user oauth_native (same as
  // intercom); Canny has no third-party OAuth to convert to and still carries the
  // gateway placeholder — see the note on its entry.
  | "stripe"
  | "slack"
  | "zendesk"
  | "hubspot"
  | "salesforce"
  | "canny"
  | "productboard";

export type AuthMethod =
  | { kind: "github_app"; appSlugEnv: "GITHUB_APP_SLUG"; requiredEnv: string[] }
  | {
      kind: "oauth_gateway";
      connectorId: string;
      clientIdEnv: string;
      /**
       * OAuth scopes forwarded to the gateway's credentials_configuration.
       * Only needed when a shared OAuth client must request provider-specific
       * scopes (e.g. google_docs reuses the Google client registered for
       * Calendar). Omit to use the gateway connector's defaults.
       */
      scopes?: string[];
    }
  // SW-7: Supaprod registers its OWN OAuth app directly with the provider
  // (same shape as github_app, generalized), no Lovable gateway dependency.
  // The founder registers a real app in the provider's developer console and
  // sets clientIdEnv/clientSecretEnv; the callback lives at
  // /api/public/connect/<provider>/callback (see startNativeOAuthConnect).
  | {
      kind: "oauth_native";
      clientIdEnv: string;
      clientSecretEnv: string;
      authorizeUrl: string;
      tokenUrl: string;
      scopes: string[];
      /** How scopes join in the authorize URL's scope param. Most providers
       * use a space (the OAuth2 convention); Slack and Linear use a comma.
       * Defaults to " " when omitted. */
      scopeSeparator?: "," | " ";
      /** Extra required query params on the authorize URL beyond
       * client_id/scope/redirect_uri/state, e.g. response_type=code (needed
       * by every provider here except Slack) or Atlassian's audience. */
      extraAuthorizeParams?: Record<string, string>;
      /** Set when the authorizeUrl contains a literal "{subdomain}" token
       * that must be substituted from this env var before use (Zendesk: the
       * authorize/token host is the customer's own subdomain, not a fixed
       * one). Until a real per-connection subdomain-capture UI exists, this
       * is a single shared value, same limitation as the envFallback path. */
      subdomainEnv?: string;
      /** How the token exchange (and refresh) authenticates the client:
       * "body" puts client_id/client_secret in the POST body (most
       * providers); "basic_header" sends them as an HTTP Basic Authorization
       * header instead (Notion, Figma). Defaults to "body". */
      tokenAuthMethod?: "body" | "basic_header";
      /** Request body encoding for the token/refresh POST. "form"
       * (application/x-www-form-urlencoded) is the default and what most
       * providers want; Jira and Notion take a JSON body instead. */
      tokenBodyFormat?: "form" | "json";
      /** True when this provider's refresh_token grant is supported and
       * worth wiring up (resolve.server.ts refreshes proactively before
       * expiry). False/omitted for providers whose token doesn't meaningfully
       * expire in normal use (Slack, Intercom) or whose refresh_token only
       * appears in a rare/dev-only mode (Stripe: test-mode connections only,
       * Notion: refresh is optional and frequently absent in practice). */
      supportsRefresh?: boolean;
      /** True when the authorize request must carry an RFC 7636 PKCE
       * code_challenge (S256) or the provider rejects it outright. Most
       * providers here don't require this on a confidential (client_secret-
       * bearing) Web Server flow, but some org-level security policies do
       * (Salesforce: "Require Proof Key for Code Exchange (PKCE) Extension
       * for Supported Authorization Flows", found 2026-07-09 as a real
       * "missing required code challenge" authorize error, not a config typo).
       * startNativeOAuthConnect generates the pair and rides code_verifier
       * inside the signed state; the callback echoes it back in the token
       * exchange. */
      pkce?: boolean;
    }
  // Retained for type compatibility only (legacy rows / UI narrowing during
  // teardown). POLICY: no registry entry may use api_key — OAuth-only.
  | { kind: "api_key"; placeholder: string; help: string };

export type ProviderSpec = {
  id: ProviderId;
  label: string;
  description: string;
  authMethods: AuthMethod[];
  resourceTypes: { kind: string; label: string }[];
  capabilities: { inflow: boolean; outflow: boolean; sync: boolean };
  envFallback?: { tokenEnv: string; resourceEnv?: string; resourceKind?: string };
  /** One line for the UI's not-yet-available state ("Not available yet. {this}",
   *  AccountConnectionsSection.tsx:1029): where the admin registers the OAuth app. */
  setupHint?: string;
  /**
   * false = platform infrastructure resolved via envFallback only — never
   * rendered in the connections UI, never user-connectable. Default true.
   * Decision: kept in the registry with this flag instead of a separate
   * INFRA_FALLBACKS map because resolve.server.ts and CONNECTOR_ADAPTERS
   * index Record<ProviderId, …> — one flag is fewer changes than re-plumbing
   * those lookups.
   */
  userFacing?: boolean;
};

/**
 * ── THE ONE SENTENCE FOR A CONNECTOR NOBODY HERE CAN TURN ON ──────────────
 *
 * WALKED AS A STRANGER ON THE SERVED /sources, 2026-09-10. Seven of the fifteen
 * connectors read **"Waiting on an admin"** — Intercom, Stripe, Zendesk,
 * HubSpot, Canny, Productboard, Notion.
 *
 * **There is no admin to wait on.** `deriveProviderAvailability` reads
 * `process.env` on the DEPLOYMENT, and its own comment says the credential is
 * "the founder-registered OAuth client". So the person who unblocks it is a
 * Supaprod operator, and nothing in this product — no setting, no role, no
 * permission — lets the person reading that cell change it. On the founder's
 * own workspace it is worse still: he IS the admin, so the sentence sends him
 * looking for a control that does not exist.
 *
 * A state a reader cannot act on is allowed. **A state that names an actor who
 * cannot act is not**, because the reader spends the effort before they find
 * out. So the sentence says whose side it is on, in the register the product
 * already uses for itself: `/outcomes` says a forecast "is measured by
 * `prd.get`, which is OURS rather than yours".
 *
 * ── AND IT WAS TWO SENTENCES FOR ONE STATE ────────────────────────────────
 * The catalogue cell said "Waiting on an admin" and the detail page said "Not
 * available yet." for the identical condition, which is the rule
 * `forecast-words.ts` states at length: two surfaces must never call one thing
 * two things. One export, both callers.
 */
export const NOT_SET_UP_HERE = "Not set up on our side yet";

export const CONNECTOR_REGISTRY: Record<ProviderId, ProviderSpec> = {
  github: {
    id: "github",
    label: "GitHub",
    description: "Ship specs as issues and detect shipped work from closed issues and PRs.",
    authMethods: [
      {
        kind: "github_app",
        appSlugEnv: "GITHUB_APP_SLUG",
        requiredEnv: [
          "GITHUB_APP_ID",
          "GITHUB_APP_CLIENT_ID",
          "GITHUB_APP_CLIENT_SECRET",
          "GITHUB_APP_PRIVATE_KEY",
          "GITHUB_APP_SLUG",
        ],
      },
    ],
    resourceTypes: [{ kind: "repo", label: "Repository" }],
    capabilities: { inflow: true, outflow: true, sync: false },
    envFallback: { tokenEnv: "GITHUB_TOKEN", resourceEnv: "GITHUB_REPO", resourceKind: "repo" },
    setupHint: "Register the GitHub App (GitHub → Settings → Developer settings → GitHub Apps).",
  },
  intercom: {
    id: "intercom",
    label: "Intercom",
    description: "Pull support conversations as discovery signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "INTERCOM_CLIENT_ID",
        clientSecretEnv: "INTERCOM_CLIENT_SECRET",
        authorizeUrl: "https://app.intercom.com/oauth",
        tokenUrl: "https://api.intercom.io/auth/eagle/token",
        // Intercom has no scope query param at all: access is governed by
        // static capability checkboxes on the app in the Developer Hub, set
        // once, applying to every user who connects.
        scopes: [],
        extraAuthorizeParams: { response_type: "code" },
      },
    ],
    resourceTypes: [{ kind: "inbox", label: "Inbox" }],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "INTERCOM_ACCESS_TOKEN", resourceKind: "inbox" },
    setupHint:
      "Register an Intercom OAuth app: Client ID/Secret go in INTERCOM_CLIENT_ID/INTERCOM_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // ── SF-CONNECTORS (Signal Fabric Phase 2): inside-out customer-voice fleet ──
  // Every one reads customer voice in, so the catalog derives minTier 'pro' — except
  // Slack, which also writes the stakeholder digest back and therefore derives 'team'
  // (see the JNY-05 note on its entry). The env-secret token path ships today, and each
  // of these providers has a real, wired ingest in PULL_INGESTORS. All of them except
  // Canny now carry a per-user oauth_native method (Supaprod's own registered app);
  // Canny alone still carries oauth_gateway, so it is the only one whose Connect flow
  // is unavailable until that client is registered -- and only while its env fallback
  // is also unset (see the note on its entry). Mirrors the intercom spec shape.
  stripe: {
    id: "stripe",
    label: "Stripe",
    description: "Pull canceled-subscription churn and cancellation reasons as signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "STRIPE_CLIENT_ID",
        clientSecretEnv: "STRIPE_CLIENT_SECRET",
        authorizeUrl: "https://connect.stripe.com/oauth/authorize",
        tokenUrl: "https://connect.stripe.com/oauth/token",
        scopes: ["read_write"],
        extraAuthorizeParams: { response_type: "code" },
        // Stripe only issues a refresh_token for test-mode connections; live
        // connections don't expire on a schedule the way the others here do,
        // so proactive refresh isn't worth wiring up for the common case.
        supportsRefresh: false,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "STRIPE_API_KEY" },
    setupHint:
      "Register a Stripe OAuth app: Client ID/Secret go in STRIPE_CLIENT_ID/STRIPE_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // JNY-05: Slack is the one SF-CONNECTOR with a second, outflow purpose —
  // posting the ambient stakeholder digest to a team channel (write-back),
  // alongside its original inflow purpose (reading a feedback channel as
  // customer-voice signals). Same bot token, two scopes: channels:history for
  // reads, chat:write for the digest post. outflow:true correctly bumps this
  // provider's catalog minTier to 'team' (Business) per the 2026-06-27 ruling —
  // enforcement is per-call-site via requiredCapability, so the existing Pro-tier
  // inflow ingest (resolveProviderAuth({requiredCapability:"inflow"})) is unaffected.
  slack: {
    id: "slack",
    label: "Slack",
    description:
      "Pull messages from a feedback channel as customer-voice signals, and post the stakeholder digest to a team channel.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "SLACK_CLIENT_ID",
        clientSecretEnv: "SLACK_CLIENT_SECRET",
        authorizeUrl: "https://slack.com/oauth/v2/authorize",
        tokenUrl: "https://slack.com/api/oauth.v2.access",
        scopes: ["channels:history", "channels:read", "chat:write"],
        scopeSeparator: ",",
      },
    ],
    resourceTypes: [
      { kind: "channel", label: "Channel" },
      { kind: "digest_channel", label: "Stakeholder digest channel" },
    ],
    capabilities: { inflow: true, outflow: true, sync: false },
    envFallback: { tokenEnv: "SLACK_BOT_TOKEN", resourceKind: "channel" },
    setupHint:
      "Register a Slack OAuth app (api.slack.com/apps): Client ID/Secret are on Basic Information -> App Credentials; add the Supaprod redirect URL under OAuth & Permissions -> Redirect URLs.",
  },
  zendesk: {
    id: "zendesk",
    label: "Zendesk",
    description: "Pull recent support tickets as customer-voice signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "ZENDESK_CLIENT_ID",
        clientSecretEnv: "ZENDESK_CLIENT_SECRET",
        authorizeUrl: "https://{subdomain}.zendesk.com/oauth/authorizations/new",
        tokenUrl: "https://{subdomain}.zendesk.com/oauth/tokens",
        scopes: ["read", "write"],
        extraAuthorizeParams: { response_type: "code" },
        // Zendesk's authorize/token host is the customer's OWN subdomain, not
        // a fixed one. No UI exists yet to capture a per-connection
        // subdomain before the redirect, so this is a single, shared value
        // (same interim limitation the envFallback path already has).
        subdomainEnv: "ZENDESK_SUBDOMAIN",
        supportsRefresh: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "ZENDESK_API_TOKEN" },
    setupHint:
      "Register a Zendesk OAuth app: Client ID/Secret go in ZENDESK_CLIENT_ID/ZENDESK_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  hubspot: {
    id: "hubspot",
    label: "HubSpot",
    description: "Pull closed-lost deals and their loss reasons as win/loss signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "HUBSPOT_CLIENT_ID",
        clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
        authorizeUrl: "https://app.hubspot.com/oauth/authorize",
        tokenUrl: "https://api.hubapi.com/oauth/v1/token",
        scopes: ["crm.objects.deals.read", "crm.objects.deals.write"],
        extraAuthorizeParams: { response_type: "code" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "HUBSPOT_ACCESS_TOKEN" },
    setupHint:
      "Register a HubSpot OAuth app: Client ID/Secret go in HUBSPOT_CLIENT_ID/HUBSPOT_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  salesforce: {
    id: "salesforce",
    label: "Salesforce",
    description: "Pull closed-lost opportunities as win/loss signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "SALESFORCE_CLIENT_ID",
        clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
        authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
        tokenUrl: "https://login.salesforce.com/services/oauth2/token",
        scopes: ["api", "refresh_token"],
        extraAuthorizeParams: { response_type: "code" },
        supportsRefresh: true,
        pkce: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "SALESFORCE_ACCESS_TOKEN" },
    setupHint:
      "Register a Salesforce OAuth app: Client ID/Secret go in SALESFORCE_CLIENT_ID/SALESFORCE_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // No standard third-party OAuth exists for Canny (it authenticates with a single
  // static per-workspace secret API key; Canny's own docs document no
  // /oauth/authorize or /oauth/token endpoint for third-party apps), so unlike every
  // other SF-CONNECTOR it was never converted to oauth_native. The working path today
  // is the CANNY_API_KEY env fallback, and the ingest behind it is real. The
  // oauth_gateway method below is a placeholder, not a second working path: with
  // CANNY_APP_USER_CONNECTOR_CLIENT_ID unset there is no Connect flow to offer.
  //
  // WHICH STATE A DEPLOYMENT ACTUALLY SHOWS depends on the env fallback, and the
  // two clauses above can look contradictory unless this is said out loud.
  // `statusFor` (AccountConnectionsSection.tsx:444-450) resolves connected ->
  // env-active -> connect -> soon, so env-active WINS over the missing OAuth
  // client. With CANNY_API_KEY set -- the working path -- the UI reads "Active
  // through a workspace credential" (:996) and there is nothing for this user to
  // connect. Only with BOTH unset does it fall through to "Waiting on an admin" /
  // "Not available yet." setupHint is deliberately the API-key instruction rather
  // than an OAuth-app one, because the API key is what actually unblocks it.
  canny: {
    id: "canny",
    label: "Canny",
    description: "Pull recent feature-request posts as feedback signals.",
    authMethods: [
      {
        kind: "oauth_gateway",
        connectorId: "canny",
        clientIdEnv: "CANNY_APP_USER_CONNECTOR_CLIENT_ID",
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "CANNY_API_KEY" },
    setupHint: "Copy your API key from Canny (Settings → API).",
  },
  productboard: {
    id: "productboard",
    label: "Productboard",
    description: "Pull customer notes and insights as feedback signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "PRODUCTBOARD_CLIENT_ID",
        clientSecretEnv: "PRODUCTBOARD_CLIENT_SECRET",
        authorizeUrl: "https://app.productboard.com/oauth2/authorize",
        tokenUrl: "https://app.productboard.com/oauth2/token",
        scopes: ["notes:read"],
        extraAuthorizeParams: { response_type: "code" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "PRODUCTBOARD_API_TOKEN" },
    setupHint:
      "Register a Productboard OAuth app: Client ID/Secret go in PRODUCTBOARD_CLIENT_ID/PRODUCTBOARD_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // ── The three gateway-era providers: linear, notion, google_docs ──
  // 2026-08-06 audit. Their descriptions below are TRUE of the product — the two-way
  // doc/issue sync behind them is real code (lib/sync.functions.ts pull/pushMapping,
  // lib/linear.functions.ts, lib/notion.functions.ts, lib/gdocs.functions.ts, surfaced
  // at /sources and in Knowledge docs) — but that code authenticates with the SHARED
  // admin env keys (LOVABLE_API_KEY + LINEAR_API_KEY / NOTION_API_KEY /
  // GOOGLE_DOCS_API_KEY) through the Lovable connector gateway. It never reads the
  // per-user vault token that the oauth_native flows below mint, and their adapters are
  // still stubAdapter, so "Test it" answers "adapter not implemented". Net effect: the
  // feature works when the admin has set the env key, and an individual user connecting
  // their own account changes nothing. Closing that gap is a code change in those
  // *.functions.ts files (route them through resolveProviderAuth), not a copy change
  // here, so the copy is left alone and the gap is recorded instead of hidden.
  //
  // IT IS NOT HYPOTHETICAL FOR LINEAR. On 2026-08-06 `connections` holds github 2,
  // linear 1, slack 1, salesforce 1 -- a real person has already connected Linear
  // through the oauth_native flow below. Their per-user token is written and never
  // read, and linear.functions.ts:11-15 raises "Linear isn't connected yet. Link it
  // from Integrations." from `headers()` whenever LOVABLE_API_KEY or LINEAR_API_KEY is
  // unset. So the one user who DID connect is told to go connect, which is this repo's
  // signature defect wearing an error message. The copy above stays true of the
  // product; this note is about who can reach it.
  linear: {
    id: "linear",
    label: "Linear",
    description: "Push planned work to Linear and pull issue state back into the loop.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "LINEAR_CLIENT_ID",
        clientSecretEnv: "LINEAR_CLIENT_SECRET",
        authorizeUrl: "https://linear.app/oauth/authorize",
        tokenUrl: "https://api.linear.app/oauth/token",
        scopes: ["read", "write"],
        scopeSeparator: ",",
        extraAuthorizeParams: { response_type: "code" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [{ kind: "team", label: "Team" }],
    capabilities: { inflow: true, outflow: true, sync: false },
    envFallback: { tokenEnv: "LINEAR_API_KEY", resourceKind: "team" },
    setupHint:
      "Register a Linear OAuth app: Client ID/Secret go in LINEAR_CLIENT_ID/LINEAR_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  notion: {
    id: "notion",
    label: "Notion",
    description: "Read and publish docs against a shared Notion database.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "NOTION_CLIENT_ID",
        clientSecretEnv: "NOTION_CLIENT_SECRET",
        authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        // Notion has no "scope" query parameter at all: access is governed by
        // "Capabilities" (Read/Insert/Update content, Read/Insert comments,
        // user information) configured once on the integration itself in the
        // Developer Portal, applying to every user who connects.
        scopes: [],
        extraAuthorizeParams: { response_type: "code", owner: "user" },
        tokenAuthMethod: "basic_header",
        tokenBodyFormat: "json",
        // Notion's refresh_token is optional and frequently absent in
        // practice (only present when the integration's Developer Portal
        // settings enabled the refresh grant), so proactive refresh isn't
        // wired up for it; the data is still captured if Notion does return
        // one, ready to flip this on later.
        supportsRefresh: false,
      },
    ],
    resourceTypes: [{ kind: "database", label: "Database" }],
    capabilities: { inflow: true, outflow: true, sync: false },
    envFallback: { tokenEnv: "NOTION_API_KEY", resourceKind: "database" },
    setupHint:
      "Register a Notion OAuth app: Client ID/Secret go in NOTION_CLIENT_ID/NOTION_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  google_docs: {
    id: "google_docs",
    label: "Google Docs",
    description: "Ingest source documents from Google Docs.",
    authMethods: [
      {
        kind: "oauth_native",
        // Shared with google_calendar/gmail: one Google Cloud OAuth app
        // covers the whole suite, so the founder registers it once.
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/documents.readonly",
          "https://www.googleapis.com/auth/drive.readonly",
          "https://www.googleapis.com/auth/documents",
        ],
        // access_type=offline + prompt=consent are required for Google to
        // actually hand back a refresh_token (otherwise it never does).
        extraAuthorizeParams: { response_type: "code", access_type: "offline", prompt: "consent" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "GOOGLE_DOCS_API_KEY" },
    setupHint:
      "Register a Google OAuth app (shared with Calendar, Gmail, and Tasks): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // SW-7 (founder goal, 2026-07-09): converted off the Lovable connector
  // gateway onto native OAuth, same as every other provider. This one and
  // gmail are handled by the multi-account calendar-connections system
  // (src/lib/calendar-connections.functions.ts + user_calendar_connections),
  // not the single-connection-per-provider startNativeOAuthConnect path -
  // this registry entry still carries the real OAuth metadata (client env,
  // endpoints, scopes, refresh support) so oauth-refresh.server.ts's
  // proactive refresh works identically for both connection systems.
  //
  // 2026-08-06 audit — UNRESOLVED, and it applies to microsoft_outlook too. The mail
  // half of SW-7 finished the conversion: gmail/microsoft_mail ingest resolves the
  // native token via resolveSuiteAuth (providers/suite-resolve.server.ts). The CALENDAR
  // half did not. src/lib/calendar.functions.ts still reaches the provider with
  // callAsAppUser({ connectionId: conn.connection_id }), while the native callbacks now
  // write user_calendar_connections.connection_id = the VAULT SECRET's own id (see the
  // header of routes/api/public/connect/google_calendar/callback.ts, which states the
  // column "no longer carries independent meaning"). A vault secret id is not a Lovable
  // gateway connection id, so what the "Two-way calendar sync" copy above promises is
  // not verified to work through the connection a user actually makes. Not fixed here:
  // the fix is in calendar.functions.ts (switch to resolveSuiteAuth and call Google /
  // Graph directly, as the mail ingests do), which is outside this file.
  google_calendar: {
    id: "google_calendar",
    label: "Google Calendar",
    description: "Two-way calendar sync: read events, create meetings from decisions.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/calendar"],
        extraAuthorizeParams: { response_type: "code", access_type: "offline", prompt: "consent" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [{ kind: "calendar", label: "Calendar" }],
    capabilities: { inflow: true, outflow: true, sync: true },
    setupHint:
      "Register a Google OAuth app (shared with Docs, Gmail, and Tasks): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // New (SW-7): lead/customer insight sitting in email. Multi-account, same
  // calendar-connections system, its own scope (readonly - inflow only).
  gmail: {
    id: "gmail",
    label: "Gmail",
    description: "Pull recent inbox messages as customer-voice and lead signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
        extraAuthorizeParams: { response_type: "code", access_type: "offline", prompt: "consent" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [{ kind: "inbox", label: "Inbox" }],
    capabilities: { inflow: true, outflow: false, sync: false },
    setupHint:
      "Register a Google OAuth app (shared with Docs, Calendar, and Tasks): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // Added 2026-07-10 alongside the founder's own Google Cloud registration
  // (Tasks API enabled at the same time as Docs/Calendar/Gmail). Multi-account,
  // same calendar-connections system. Connect flow is real; what Supaprod DOES
  // with a connected Tasks account (push action items out, pull existing
  // tasks in, or both) is not yet scoped - capabilities below are provisional
  // (outflow: push-action-items-out was the stated intent) and the adapter
  // stays a stub until that product decision is made. Connecting succeeds
  // with no error but has no visible effect yet, same as Linear/Notion/Figma/
  // Jira.
  //
  // 2026-08-06 audit: that note was true and the `description` contradicted it —
  // "Sync action items with Google Tasks." is rendered as user-facing page copy, so it
  // read as shipped. Re-verified: no Google Tasks API call exists anywhere in src/ (the
  // only "tasklist" in the tree is resourceTypes below). The description now matches
  // this note. PARTIAL FIX, deliberately: capabilities.outflow stays true, so the
  // catalog still labels this "Pushes out" and still derives minTier 'team' (Business)
  // — a Business-tier gate in front of a connector that does nothing. Flipping it to
  // false would make the label honest and drop the gate to 'pro', but that is a pricing
  // call and a catalog behaviour change, not copy, so it is left for the founder.
  //
  // AND THE DESCRIPTION IS NOT THE ONLY PLACE THIS IS PROMISED. connect-trust.ts:40
  // still tells the user at the CONSENT MOMENT that Supaprod reads "Your Google Tasks
  // lists, to sync action items." Same claim, higher-stakes screen, still false.
  // Outside this file; recorded here so the pair gets fixed together.
  google_tasks: {
    id: "google_tasks",
    label: "Google Tasks",
    description:
      "Syncing action items with Google Tasks is not built yet. Connecting authorizes the account and nothing more.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/tasks"],
        extraAuthorizeParams: { response_type: "code", access_type: "offline", prompt: "consent" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [{ kind: "tasklist", label: "Task list" }],
    capabilities: { inflow: false, outflow: true, sync: false },
    setupHint:
      "Register a Google OAuth app (shared with Docs, Calendar, and Gmail): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // SW-7: same conversion as google_calendar - native OAuth, multi-account
  // calendar-connections system, registry entry carries OAuth metadata only.
  microsoft_outlook: {
    id: "microsoft_outlook",
    label: "Microsoft Outlook",
    description: "Two-way calendar sync: read events, create meetings from decisions.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "MICROSOFT_CLIENT_ID",
        clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
        authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: ["Calendars.ReadWrite", "User.Read", "offline_access"],
        extraAuthorizeParams: { response_type: "code" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [{ kind: "calendar", label: "Calendar" }],
    capabilities: { inflow: true, outflow: true, sync: true },
    setupHint:
      "Register an app in the Microsoft Entra admin center (shared with Outlook Mail): Client ID/Secret go in MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET; add the Supaprod redirect URL under that app's Authentication settings.",
  },
  // New (SW-7): lead/customer insight sitting in Outlook mail. Multi-account,
  // same calendar-connections system, its own read-only scope (inflow only).
  microsoft_mail: {
    id: "microsoft_mail",
    label: "Outlook Mail",
    description: "Pull recent inbox messages as customer-voice and lead signals.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "MICROSOFT_CLIENT_ID",
        clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
        authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: ["Mail.Read", "User.Read", "offline_access"],
        extraAuthorizeParams: { response_type: "code" },
        supportsRefresh: true,
      },
    ],
    resourceTypes: [{ kind: "inbox", label: "Inbox" }],
    capabilities: { inflow: true, outflow: false, sync: false },
    setupHint:
      "Register an app in the Microsoft Entra admin center (shared with Outlook Calendar): Client ID/Secret go in MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET; add the Supaprod redirect URL under that app's Authentication settings.",
  },
  // 2026-08-06 audit, launch week: this entry's copy used to read "Reference design
  // files from specs and briefs." — which is the founder's own working method (design
  // lives outside the product, as prototypes and mockups) and therefore reads on
  // Product Hunt as a shipped feature. It is not one. Verified: CONNECTOR_ADAPTERS maps
  // figma to stubAdapter (providers/index.server.ts), so "Test it" answers "adapter not
  // implemented"; there is no figma entry in PULL_INGESTORS, so kickFirstIngest returns
  // 0; and no field on a spec can hold a design reference (the only structured slot in
  // the spec shape is contract.evidence_links, and no UI writes a design link into it).
  // The one real Figma surface in the product is the TipTap FigmaEmbed node, reachable
  // only from Knowledge docs (components/knowledge/DocsPanel.tsx) — never from a spec or
  // a brief, and it needs no connection at all. The entry STAYS (ratchet: replace, never
  // remove) and the OAuth flow stays real; only the promise is withdrawn until the
  // capability lands, at which point this description goes back to the line above.
  //
  // AND THE DESCRIPTION IS NOT THE ONLY PLACE THIS IS PROMISED, same as google_tasks
  // above and jira below. connect-trust.ts:52 still tells the user at the CONSENT
  // MOMENT that Supaprod reads "File metadata for the files you reference in a spec
  // or brief." -- word for word the capability this entry's own `description` now
  // withdraws -- and ConnectTrustDialog.tsx:58 renders that string verbatim on the
  // last screen before the OAuth handoff. Same claim, higher-stakes screen, still
  // false. Outside this file; recorded here so the pair gets fixed together.
  //
  // ONE WAY FIGMA IS BETTER OFF THAN JIRA, worth knowing before anyone panics on
  // launch week: it is not on the public pricing page. Swept every figma mention
  // in src/ on 2026-08-06 and the consent dialog is the ONLY surface left making
  // this promise. routes/pricing.tsx READ_CONNECTORS (:23 onward) holds github,
  // linear, notion, jira and google_docs, no figma. landing/TheGap.tsx:64 names
  // Figma as an external design tool, which is the founder's own position, not a
  // Supaprod capability. integrations.functions.ts:10 says "Embed Figma files in
  // docs", which is TRUE (the TipTap FigmaEmbed node) and is dead copy besides:
  // its `PROVIDERS` export has no importer anywhere in src/. So the fix list for
  // this claim is exactly one line, connect-trust.ts:52, and it is not a sweep.
  figma: {
    id: "figma",
    label: "Figma",
    description:
      "Referencing design files from specs and briefs is not built yet. Connecting authorizes the account and nothing more.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "FIGMA_CLIENT_ID",
        clientSecretEnv: "FIGMA_CLIENT_SECRET",
        authorizeUrl: "https://www.figma.com/oauth",
        tokenUrl: "https://api.figma.com/v1/oauth/token",
        // NOT NARROWED, AND THE FOUNDER'S CALL IS STILL OPEN (2026-08-06 audit,
        // corrected the same day). SIX of these seven are read by nothing: no code
        // anywhere in src/ touches a Figma file, its metadata, its comments, its
        // versions or its projects. The SEVENTH is read on every single connect --
        // routes/api/public/connect/figma/callback.ts fetches api.figma.com/v1/me to
        // resolve a human-readable account label, and that callback's own header says
        // the call is "gated on the current_user:read scope already requested". So the
        // minimum set this product needs TODAY is determinable, and it is exactly
        // ["current_user:read"]; every other entry below, including the WRITE scope
        // file_comments:write, is asked for on a launch-week consent screen for a
        // capability whose own `description` above says it is not built.
        //
        // Two things a reader should NOT infer from an earlier version of this note.
        // (1) Narrowing does not force re-consent for anyone: `select provider,
        // count(*) from connections` on 2026-08-06 returns github 2, linear 1, slack 1,
        // salesforce 1 and ZERO figma, and user_calendar_connections is empty, so
        // nobody is connected and the migration cost is nil. (2) "Wait for the feature
        // to be designed" is not a reason to keep them, because the ask can be widened
        // again in one line the day the feature lands.
        // STILL NOT CHANGED HERE, deliberately: what a product asks a user to authorize
        // is the founder's decision, not a comment fix, and this file's job right now is
        // to state it truthfully so he decides on the real facts. The edit, if he wants
        // it, is to delete every entry below except "current_user:read".
        scopes: [
          "file_content:read",
          "file_metadata:read",
          "file_comments:read",
          "file_versions:read",
          "projects:read",
          "current_user:read",
          "file_comments:write",
        ],
        extraAuthorizeParams: { response_type: "code" },
        tokenAuthMethod: "basic_header",
        supportsRefresh: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: false, outflow: false, sync: false },
    setupHint:
      "Register a Figma OAuth app: Client ID/Secret go in FIGMA_CLIENT_ID/FIGMA_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // 2026-08-06 audit: same defect as figma. This read "Push planned work to Jira
  // projects." and nothing pushes. Verified against the whole of src/: the only Jira
  // code outside this entry is the OAuth callback (routes/api/public/connect/jira/
  // callback.ts) — no api.atlassian.com call site, no adapter (stubAdapter), no
  // PULL_INGESTORS entry. Note capabilities below are already all-false, so the catalog
  // labels this "Reference" rather than "Pushes out"; the description was the only place
  // still claiming the write. Entry and OAuth flow stay; the claim comes back with the
  // code.
  //
  // ONE CLAIM SURVIVES THIS FIX, on the screen that matters most. connect-trust.ts:56
  // still says at the CONSENT MOMENT that Supaprod reads "Work items and their status
  // in the projects you connect." Nothing reads Jira at all. Outside this file.
  // Separately, routes/pricing.tsx:46 lists Jira among READ_CONNECTORS on the PUBLIC
  // pricing page -- the same false read claim, to a stranger, before signup.
  jira: {
    id: "jira",
    label: "Jira",
    description:
      "Pushing planned work to Jira is not built yet. Connecting authorizes the account and nothing more.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "JIRA_CLIENT_ID",
        clientSecretEnv: "JIRA_CLIENT_SECRET",
        authorizeUrl: "https://auth.atlassian.com/authorize",
        tokenUrl: "https://auth.atlassian.com/oauth/token",
        scopes: ["read:jira-work", "read:jira-user", "offline_access", "write:jira-work"],
        // audience is mandatory for Atlassian's 3LO flow to issue a token
        // usable against the Cloud REST APIs; prompt=consent ensures the
        // consent screen (and a fresh refresh_token) on every connect.
        extraAuthorizeParams: {
          response_type: "code",
          audience: "api.atlassian.com",
          prompt: "consent",
        },
        tokenBodyFormat: "json",
        supportsRefresh: true,
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: false, outflow: false, sync: false },
    setupHint:
      "Register a Jira OAuth app: Client ID/Secret go in JIRA_CLIENT_ID/JIRA_CLIENT_SECRET; add the Supaprod redirect URL under that app's OAuth settings.",
  },
  // Platform infrastructure, not a user connector: the agent loop's web.*
  // tools read FIRECRAWL_API_KEY via the env fallback (resolve.server.ts and
  // src/lib/ai/tools/firecrawl.server.ts). Never shown in the connections UI.
  firecrawl: {
    id: "firecrawl",
    label: "Firecrawl",
    description: "Platform web-crawl infrastructure (server secret; not user-connectable).",
    userFacing: false,
    authMethods: [],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "FIRECRAWL_API_KEY" },
  },
};

/**
 * WHICH PROVIDERS ACTUALLY RETURN SIGNALS, as data a client surface can read.
 *
 * Added 2026-08-27 after the FAQ spent twelve days telling buyers that Linear,
 * Jira, Notion and Figma "are not built yet". They were: figma, jira and linear
 * went real on 2026-08-15 and the mail family on 2026-08-26 (F-81), and the
 * sentence describing them was written before that and never revisited.
 *
 * The real map lives in `providers/index.server.ts`, which is server-only, so a
 * public page could not read it and had to restate it from memory. Restating is
 * how it drifted. This is the same list as DATA, client-safe, so the FAQ derives
 * its answer instead of remembering it.
 *
 * `adapter-map-matches-registry.test.ts` fails if this and the real adapter map
 * ever disagree, which is the half that makes deriving safe rather than merely
 * tidier: without it this becomes a second thing to keep in sync, and two lists
 * that can drift are worse than one list that is wrong.
 */
export const PROVIDERS_WITHOUT_ADAPTERS: readonly ProviderId[] = [
  "google_calendar",
  "google_tasks",
  "firecrawl",
] as const;

/** True when connecting this provider actually returns signals today. */
export function providerReturnsSignals(id: ProviderId): boolean {
  return !PROVIDERS_WITHOUT_ADAPTERS.includes(id);
}
