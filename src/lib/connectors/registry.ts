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
// the UI renders an explanatory "Admin setup required" state from setupHint
// plus the missingEnv list returned by listConnections.

export type ProviderId =
  | "github"
  | "linear"
  | "notion"
  | "google_docs"
  | "google_calendar"
  | "gmail"
  | "microsoft_outlook"
  | "microsoft_mail"
  | "figma"
  | "jira"
  | "firecrawl"
  | "intercom"
  // SF-CONNECTORS (Signal Fabric Phase 2) — the inside-out customer-voice fleet. All
  // inflow-only pull connectors; each ships on its env-secret token path now and upgrades
  // to per-user OAuth the moment the gateway client is registered (same as intercom).
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
  // SW-7: Cadence registers its OWN OAuth app directly with the provider
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
  /** One line for the UI's "Admin setup required" state: where the admin registers the OAuth app. */
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
      "Register an Intercom OAuth app: Client ID/Secret go in INTERCOM_CLIENT_ID/INTERCOM_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
  },
  // ── SF-CONNECTORS (Signal Fabric Phase 2): inside-out customer-voice fleet ──
  // Each is inflow-only (read customer voice in; never writes back), so the catalog
  // derives minTier 'pro'. The env-secret token path ships today; the oauth_gateway
  // method is the future per-user upgrade and stays "Admin setup required" until the
  // founder registers each client. Mirrors the intercom spec shape exactly.
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
      "Register a Stripe OAuth app: Client ID/Secret go in STRIPE_CLIENT_ID/STRIPE_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      "Register a Slack OAuth app (api.slack.com/apps): Client ID/Secret are on Basic Information -> App Credentials; add the Cadence redirect URL under OAuth & Permissions -> Redirect URLs.",
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
      "Register a Zendesk OAuth app: Client ID/Secret go in ZENDESK_CLIENT_ID/ZENDESK_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      "Register a HubSpot OAuth app: Client ID/Secret go in HUBSPOT_CLIENT_ID/HUBSPOT_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      },
    ],
    resourceTypes: [],
    capabilities: { inflow: true, outflow: false, sync: false },
    envFallback: { tokenEnv: "SALESFORCE_ACCESS_TOKEN" },
    setupHint:
      "Register a Salesforce OAuth app: Client ID/Secret go in SALESFORCE_CLIENT_ID/SALESFORCE_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
  },
  // No standard third-party OAuth exists for Canny (it authenticates with a single
  // static per-workspace secret API key; Canny's own docs document no
  // /oauth/authorize or /oauth/token endpoint for third-party apps); stays
  // admin-token-only until Canny ships one.
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
      "Register a Productboard OAuth app: Client ID/Secret go in PRODUCTBOARD_CLIENT_ID/PRODUCTBOARD_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
  },
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
      "Register a Linear OAuth app: Client ID/Secret go in LINEAR_CLIENT_ID/LINEAR_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      "Register a Notion OAuth app: Client ID/Secret go in NOTION_CLIENT_ID/NOTION_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      "Register a Google OAuth app (shared with Calendar and Gmail): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
  },
  // SW-7 (founder goal, 2026-07-09): converted off the Lovable connector
  // gateway onto native OAuth, same as every other provider. This one and
  // gmail are handled by the multi-account calendar-connections system
  // (src/lib/calendar-connections.functions.ts + user_calendar_connections),
  // not the single-connection-per-provider startNativeOAuthConnect path -
  // this registry entry still carries the real OAuth metadata (client env,
  // endpoints, scopes, refresh support) so oauth-refresh.server.ts's
  // proactive refresh works identically for both connection systems.
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
      "Register a Google OAuth app (shared with Docs and Gmail): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      "Register a Google OAuth app (shared with Docs and Calendar): Client ID/Secret go in GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
      "Register an app in the Microsoft Entra admin center (shared with Outlook Mail): Client ID/Secret go in MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET; add the Cadence redirect URL under that app's Authentication settings.",
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
      "Register an app in the Microsoft Entra admin center (shared with Outlook Calendar): Client ID/Secret go in MICROSOFT_CLIENT_ID/MICROSOFT_CLIENT_SECRET; add the Cadence redirect URL under that app's Authentication settings.",
  },
  figma: {
    id: "figma",
    label: "Figma",
    description: "Reference design files from specs and briefs.",
    authMethods: [
      {
        kind: "oauth_native",
        clientIdEnv: "FIGMA_CLIENT_ID",
        clientSecretEnv: "FIGMA_CLIENT_SECRET",
        authorizeUrl: "https://www.figma.com/oauth",
        tokenUrl: "https://api.figma.com/v1/oauth/token",
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
      "Register a Figma OAuth app: Client ID/Secret go in FIGMA_CLIENT_ID/FIGMA_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
  },
  jira: {
    id: "jira",
    label: "Jira",
    description: "Push planned work to Jira projects.",
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
      "Register a Jira OAuth app: Client ID/Secret go in JIRA_CLIENT_ID/JIRA_CLIENT_SECRET; add the Cadence redirect URL under that app's OAuth settings.",
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
