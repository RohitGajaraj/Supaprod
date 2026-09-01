import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import {
  CONNECTOR_REGISTRY,
  type AuthMethod,
  type ProviderId,
  type ProviderSpec,
} from "@/lib/connectors/registry";
import { materializeAuth, type ResolvedAuth } from "@/lib/connectors/resolve.server";
import { getProviderAdapter } from "@/lib/connectors/providers/index.server";
import { makeConnectState, makePkcePair } from "@/lib/connectors/providers/github.server";
import { authorizeAppUserOAuth } from "@/integrations/lovable/appUserConnector";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";
import {
  assertConnectorSlotAvailable,
  entitlementsFor,
  normalizePlanTier,
  type PlanTier,
} from "@/lib/entitlements";

// F-CONN Phase 1 — account-level connections + workspace-level bindings.
// connections: own-row RLS (the caller only ever sees their own rows).
// connection_bindings: membership RLS (is_workspace_member) — any workspace
// member can read/bind, attribution via created_by + owner of the connection.
// connection_secrets: service-role only — always touched via supabaseAdmin.
//
// POLICY (founder decision): user connectors are OAuth-only. Connect flows go
// through the Lovable connector gateway (startGatewayConnect →
// saveGatewayConnection, generalized from calendar-connections.functions.ts).
// Tokens live in the gateway; we persist only the gateway connection_id as
// external_handle. There is no API-key connect path — connectWithApiKey was
// removed. connection_secrets is retained solely so legacy api_key rows can
// still be disconnected/deleted cleanly.
//
// New tables are not yet in the generated Database types, so handlers use the
// untyped-client cast precedent (see outcome.functions.ts / ingest.functions.ts).
//
// Cross-module contracts consumed here (built alongside this file):
// - resolve.server: materializeAuth(row, provider) -> ResolvedAuth | null
//   (decrypts vault secrets / mints installation tokens via supabaseAdmin).
// - providers index: getProviderAdapter(provider) -> adapter with
//   validate(auth: ResolvedAuth) -> { ok, detail?, accountLabel? } and
//   listResources?(auth: ResolvedAuth, kind, { q? }) -> { id, label }[].
// - github.server: makeConnectState(userId) -> signed state for the GitHub App
//   install URL (CSRF; consumed by the public callback route).
// - lovable/appUserConnector: authorizeAppUserOAuth(...) ->
//   { authorizationUrl, sessionId } (gateway OAuth start; web_message popup).

export type ConnectionRow = {
  id: string;
  user_id: string;
  provider: ProviderId;
  auth_kind: "github_app" | "oauth_gateway" | "api_key" | "token";
  external_handle: string | null;
  secret_id: string | null;
  account_label: string | null;
  account_email: string | null;
  status: "connected" | "error" | "disconnected";
  status_detail: string | null;
  scopes: string[];
  // Json (not unknown) so server-fn return types stay serializable.
  metadata: Record<string, Json>;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BindingRow = {
  id: string;
  connection_id: string;
  workspace_id: string;
  product_id: string | null;
  provider: ProviderId;
  resource_kind: string;
  resource_id: string;
  resource_label: string | null;
  // Json (not unknown) so server-fn return types stay serializable.
  config: Record<string, Json>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceBindingRow = BindingRow & {
  account_label: string | null;
  connection_status: ConnectionRow["status"];
  owner_display: string | null;
};

export type ProviderAvailability = Record<
  ProviderId,
  {
    /** True when every env credential the provider's connect flow needs is present. */
    configured: boolean;
    /** Exact env vars still unset — drives the UI's "Admin setup required" copy. */
    missingEnv: string[];
    githubAppConfigured?: boolean;
    gatewayConfigured?: boolean;
    /** True when Supaprod's own OAuth app (clientIdEnv + clientSecretEnv) is
     *  registered directly with the provider: the real "Connect" round-trip
     *  (SW-7), same shape as githubAppConfigured but for oauth_native. */
    nativeOAuthConfigured?: boolean;
    /** True when the provider's server-side env token (envFallback.tokenEnv) is
     *  set: Supaprod can already read/ingest through the workspace token even
     *  without a per-user OAuth grant, so the UI must show it as active, not
     *  "coming soon" (founder ruling 2026-07-06). */
    envConfigured?: boolean;
  }
>;

const CONNECTION_COLUMNS =
  "id,user_id,provider,auth_kind,external_handle,secret_id,account_label,account_email,status,status_detail,scopes,metadata,last_verified_at,created_at,updated_at";

const BINDING_COLUMNS =
  "id,connection_id,workspace_id,product_id,provider,resource_kind,resource_id,resource_label,config,created_by,created_at,updated_at";

// Same gateway the calendar flow uses (calendar-connections.functions.ts).
const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

const GATEWAY_PROVIDER_IDS = Object.values(CONNECTOR_REGISTRY)
  .filter((spec) => spec.authMethods.some((m) => m.kind === "oauth_gateway"))
  .map((spec) => spec.id) as [ProviderId, ...ProviderId[]];

type GatewayAuthMethod = Extract<AuthMethod, { kind: "oauth_gateway" }>;

function findGatewayMethod(spec: ProviderSpec): GatewayAuthMethod {
  const method = spec.authMethods.find((m) => m.kind === "oauth_gateway");
  if (!method || method.kind !== "oauth_gateway") {
    throw new Error(`${spec.label} does not support OAuth connect.`);
  }
  return method;
}

const NATIVE_OAUTH_PROVIDER_IDS = Object.values(CONNECTOR_REGISTRY)
  .filter((spec) => spec.authMethods.some((m) => m.kind === "oauth_native"))
  .map((spec) => spec.id) as [ProviderId, ...ProviderId[]];

type NativeOAuthMethod = Extract<AuthMethod, { kind: "oauth_native" }>;

function findNativeOAuthMethod(spec: ProviderSpec): NativeOAuthMethod {
  const method = spec.authMethods.find((m) => m.kind === "oauth_native");
  if (!method || method.kind !== "oauth_native") {
    throw new Error(`${spec.label} does not support OAuth connect.`);
  }
  return method;
}

/** Load a connection the caller owns (own-row RLS enforces ownership). */
/**
 * Refuse a new source when the plan's cap is already full, BEFORE anything moves.
 *
 * THE FRIENDLY HALF of a cap whose authoritative half is a database trigger
 * (migration 20260814180000). The trigger closes all nineteen insert doors
 * including the thirteen service-role OAuth callbacks; this exists so a person
 * meets a sentence rather than a Postgres error, and so a native OAuth flow is
 * refused before they are sent to the provider to authorize something that
 * cannot be stored. Being bounced back from Slack's consent screen is a worse
 * failure than being told the cap is full.
 *
 * `assertConnectorSlotAvailable` shipped with SEVEN PASSING TESTS AND ZERO
 * CALLERS, advertised on the public pricing page and in the plan picker and
 * enforced nowhere. This is the caller it never had, and
 * `entitlements.test.ts` now pins its existence.
 *
 * COUNTS BOTH CONNECTOR TABLES, matching `connected_source_count` in SQL, because
 * five of the nineteen doors write `user_calendar_connections` and a cap counting
 * one table is dodgeable through the other.
 *
 * FAILS OPEN on a read it could not make, matching the trigger. This is a
 * commercial boundary and not a safety control, so a lookup failure must not
 * stop a legitimate person connecting their own data.
 */
async function assertRoomForAnotherSource(db: SupabaseClient, userId: string): Promise<void> {
  let tier: PlanTier;
  try {
    const { data, error } = await db
      .from("accounts")
      .select("plan_tier")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error || !data) return;
    tier = normalizePlanTier((data as { plan_tier?: string | null }).plan_tier ?? null);
  } catch {
    return;
  }
  if (entitlementsFor(tier).connectorLimit === null) return;

  let used = 0;
  try {
    const [conn, cal] = await Promise.all([
      db
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "connected"),
      db
        .from("user_calendar_connections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);
    if (conn.error || cal.error) return;
    used = (conn.count ?? 0) + (cal.count ?? 0);
  } catch {
    return;
  }
  assertConnectorSlotAvailable(tier, used);
}

async function loadOwnConnection(db: SupabaseClient, id: string): Promise<ConnectionRow> {
  const { data, error } = await db
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Connection not found.");
  return data as unknown as ConnectionRow;
}

/**
 * Materialize adapter auth for ONE specific connection row (not the
 * workspace→user→env chain — that is resolveProviderAuth's job). Delegates to
 * resolve.server's materializeAuth: secrets are read via the service-role
 * client and decrypted in-process; never returned to the caller.
 */
async function materializeAdapterAuth(row: ConnectionRow): Promise<ResolvedAuth | null> {
  return materializeAuth(row, row.provider);
}

function deriveProviderAvailability(): ProviderAvailability {
  const availability = {} as ProviderAvailability;
  const lovableKeyPresent = !!process.env.LOVABLE_API_KEY;
  for (const spec of Object.values(CONNECTOR_REGISTRY)) {
    const missingEnv: string[] = [];
    const entry: ProviderAvailability[ProviderId] = { configured: false, missingEnv };
    for (const method of spec.authMethods) {
      if (method.kind === "github_app") {
        if (!process.env.GITHUB_APP_ID) missingEnv.push("GITHUB_APP_ID");
        if (!process.env.GITHUB_APP_SLUG) missingEnv.push("GITHUB_APP_SLUG");
        entry.githubAppConfigured = !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_SLUG);
      }
      if (method.kind === "oauth_gateway") {
        // Gateway connect needs the founder-registered OAuth client AND the
        // gateway credential itself.
        if (!process.env[method.clientIdEnv]) missingEnv.push(method.clientIdEnv);
        if (!lovableKeyPresent) missingEnv.push("LOVABLE_API_KEY");
        entry.gatewayConfigured = !!process.env[method.clientIdEnv] && lovableKeyPresent;
      }
      if (method.kind === "oauth_native") {
        // Native connect needs Supaprod's own OAuth app credentials, no
        // Lovable dependency (SW-7).
        if (!process.env[method.clientIdEnv]) missingEnv.push(method.clientIdEnv);
        if (!process.env[method.clientSecretEnv]) missingEnv.push(method.clientSecretEnv);
        entry.nativeOAuthConfigured =
          !!process.env[method.clientIdEnv] && !!process.env[method.clientSecretEnv];
      }
    }
    // Providers with no user-facing auth method (userFacing: false infra like
    // firecrawl) report configured: false and are filtered out by the UI.
    entry.configured = spec.authMethods.length > 0 && missingEnv.length === 0;
    // Server-side env token present: Supaprod can ingest via the workspace token
    // even before per-user OAuth is registered, so this is "active", not gated.
    entry.envConfigured = !!(spec.envFallback?.tokenEnv && process.env[spec.envFallback.tokenEnv]);
    availability[spec.id] = entry;
  }
  return availability;
}

/** The caller's account-level connections + which providers are configurable today. */
export const listConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data, error } = await db
      .from("connections")
      .select(CONNECTION_COLUMNS)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return {
      connections: (data ?? []) as unknown as ConnectionRow[],
      providerAvailability: deriveProviderAvailability(),
    };
  });

/** Kick off the GitHub App install flow; returns the install URL for a full redirect.
 *  SW-6: `returnTo: "onboarding"` rides inside the signed state so the callback can
 *  resume the onboarding connect step instead of stranding the user (allowlisted in
 *  makeConnectState, never a free-form URL). */
export const startGithubAppConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ returnTo: z.enum(["onboarding"]).optional() })
      .optional()
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const slug = (process.env.GITHUB_APP_SLUG ?? "").trim();
    if (!slug || !process.env.GITHUB_APP_ID) {
      throw new Error(
        "GitHub setup pending. An admin must register the GitHub App and set GITHUB_APP_ID and GITHUB_APP_SLUG before members can connect.",
      );
    }
    const state = await makeConnectState(context.userId, data?.returnTo);
    return {
      installUrl: `https://github.com/apps/${encodeURIComponent(slug)}/installations/new?state=${encodeURIComponent(state)}`,
    };
  });

/**
 * Kick off Supaprod's own OAuth connect flow for an oauth_native provider:
 * returns the provider's authorize URL for a FULL-PAGE redirect (same UX as
 * the GitHub App install: no popup/postMessage machinery). SW-7: this is the
 * generalized pattern every non-GitHub provider uses once its OAuth app is
 * registered directly with the provider (no Lovable gateway dependency).
 *
 * Security: redirect_uri is built from the request's own Origin header, never
 * from client-supplied data. A forged origin in the request body would
 * otherwise let a caller mint a validly-signed authorize URL whose
 * redirect_uri points at a domain they control (the provider's own exact-match
 * redirect_uri check is a backstop, not something this endpoint should rely
 * on alone).
 */
export const startNativeOAuthConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        provider: z.enum(NATIVE_OAUTH_PROVIDER_IDS),
        returnTo: z.enum(["onboarding"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    // Before the round trip, not after it. A person bounced back from the
    // provider's consent screen with nothing stored is the worse failure.
    await assertRoomForAnotherSource(context.supabase as unknown as SupabaseClient, context.userId);
    const spec = CONNECTOR_REGISTRY[data.provider];
    const method = findNativeOAuthMethod(spec);
    const clientId = process.env[method.clientIdEnv];
    if (!clientId) {
      throw new Error(
        `${spec.label} setup pending. An admin must register the ${spec.label} OAuth app and set ${method.clientIdEnv}.` +
          (spec.setupHint ? ` ${spec.setupHint}` : ""),
      );
    }
    const origin = getRequestHeader("origin");
    if (!origin) {
      throw new Error("Missing Origin header. Cannot start OAuth connect.");
    }
    let authorizeUrlBase = method.authorizeUrl;
    if (method.subdomainEnv) {
      const subdomain = process.env[method.subdomainEnv];
      if (!subdomain) {
        throw new Error(
          `${spec.label} setup pending. An admin must set ${method.subdomainEnv} before members can connect.`,
        );
      }
      authorizeUrlBase = authorizeUrlBase.replace("{subdomain}", subdomain);
    }
    const pkce = method.pkce ? await makePkcePair() : null;
    const state = await makeConnectState(context.userId, data.returnTo, pkce?.codeVerifier);
    const redirectUri = `${origin}/api/public/connect/${data.provider}/callback`;
    const url = new URL(authorizeUrlBase);
    url.searchParams.set("client_id", clientId);
    if (method.scopes.length > 0) {
      url.searchParams.set("scope", method.scopes.join(method.scopeSeparator ?? " "));
    }
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    if (pkce) {
      url.searchParams.set("code_challenge", pkce.codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
    }
    for (const [key, value] of Object.entries(method.extraAuthorizeParams ?? {})) {
      url.searchParams.set(key, value);
    }
    return { authorizeUrl: url.toString() };
  });

/** Re-run the provider adapter's validate and persist status/last_verified_at/status_detail. */
export const verifyConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const row = await loadOwnConnection(db, data.id);
    let ok = false;
    let detail: string | null = null;
    const adapter = getProviderAdapter(row.provider);
    if (!adapter) {
      detail = "No adapter registered for this provider yet.";
    } else {
      try {
        const auth = await materializeAdapterAuth(row);
        if (!auth) {
          detail = "No credential stored for this connection. Reconnect it.";
        } else {
          const result = await adapter.validate(auth);
          ok = result.ok;
          detail = result.detail ?? null;
        }
      } catch (e) {
        ok = false;
        detail = e instanceof Error ? e.message : String(e);
      }
    }
    const now = new Date().toISOString();
    const { data: updated, error } = await db
      .from("connections")
      .update({
        status: ok ? "connected" : "error",
        status_detail: detail,
        last_verified_at: now,
        updated_at: now,
      })
      .eq("id", row.id)
      .select(CONNECTION_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { ok, connection: updated as unknown as ConnectionRow };
  });

/**
 * Live-check an admin-managed env-fallback credential (HubSpot/Salesforce/Canny-style
 * "Active" cards) - these have no `connections` row, so verifyConnection above can't reach
 * them, and the "Active" badge itself only proves the env var is SET, not that it still
 * authenticates (found 2026-07-09: Salesforce's env token had expired months ago while the
 * UI kept showing the same unconditional "Active" pill as HubSpot's genuinely working one).
 * Never persisted - there is no row to persist onto; each call re-checks live.
 */
export const verifyEnvCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ provider: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const checkedAt = new Date().toISOString();
    const spec = CONNECTOR_REGISTRY[data.provider as ProviderId];
    if (!spec?.envFallback) {
      return { ok: false, detail: "This connector has no admin credential to verify.", checkedAt };
    }
    const token = process.env[spec.envFallback.tokenEnv];
    if (!token) {
      return { ok: false, detail: `${spec.envFallback.tokenEnv} is not set.`, checkedAt };
    }
    try {
      const adapter = getProviderAdapter(data.provider as ProviderId);
      const result = await adapter.validate({ kind: "env", token });
      return { ok: result.ok, detail: result.detail ?? null, checkedAt };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e), checkedAt };
    }
  });

/**
 * Revoke the stored credential but keep the row (and its bindings, which render
 * as visibly-broken reconnectable chips). Secret rows are service-role only.
 */
export const disconnectConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const row = await loadOwnConnection(db, data.id);
    if (row.secret_id) {
      const { error } = await admin.from("connection_secrets").delete().eq("id", row.secret_id);
      if (error) throw new Error(error.message);
    }
    const { error } = await db
      .from("connections")
      .update({
        status: "disconnected",
        status_detail: null,
        secret_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Hard delete — the connection_bindings FK cascade removes every binding with it. */
export const deleteConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const row = await loadOwnConnection(db, data.id);
    if (row.secret_id) {
      const { error } = await admin.from("connection_secrets").delete().eq("id", row.secret_id);
      if (error) throw new Error(error.message);
    }
    const { error } = await db.from("connections").delete().eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Kick off the gateway OAuth flow for any oauth_gateway provider — returns the
 * provider authorization URL for a popup (web_message posts the gateway
 * connection_id back to targetOrigin; the UI then calls saveGatewayConnection).
 * Generalized from startCalendarConnect. Tokens never touch our DB.
 */
export const startGatewayConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        provider: z.enum(GATEWAY_PROVIDER_IDS),
        targetOrigin: z.string().url(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const spec = CONNECTOR_REGISTRY[data.provider];
    const method = findGatewayMethod(spec);
    const clientId = process.env[method.clientIdEnv];
    if (!clientId) {
      throw new Error(
        `${spec.label} setup pending. An admin must register the ${spec.label} OAuth app and set ${method.clientIdEnv}.` +
          (spec.setupHint ? ` ${spec.setupHint}` : ""),
      );
    }
    const { authorizationUrl, sessionId } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: method.connectorId,
      appUserId: context.userId,
      connectorClientId: clientId,
      // Fallback redirect target; web_message is the primary completion path.
      // The connections UI lives in /settings (section "connections").
      returnUrl: `${data.targetOrigin}/settings`,
      responseMode: "web_message",
      webMessageTargetOrigin: data.targetOrigin,
      ...(method.scopes ? { credentialsConfiguration: { scopes: method.scopes } } : {}),
    });
    return { authorizationUrl, sessionId };
  });

/**
 * Persist a completed gateway OAuth grant. We store ONLY the gateway
 * connection_id (external_handle) — auth_kind 'oauth_gateway', no secret row.
 * account_label is best-effort: the provider adapter's validate when
 * implemented, else the provider label. Insert-or-update on the caller's
 * existing oauth_gateway row (select-then-write, upsertBinding precedent).
 */
export const saveGatewayConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        provider: z.enum(GATEWAY_PROVIDER_IDS),
        connectionId: z.string().min(1).max(300),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    await assertRoomForAnotherSource(db, context.userId);
    const spec = CONNECTOR_REGISTRY[data.provider];
    const method = findGatewayMethod(spec);

    // Best-effort identity. Stub adapters return ok:false ("adapter not
    // implemented") — a fresh OAuth grant is still connected regardless.
    let accountLabel: string | null = null;
    let accountEmail: string | null = null;
    try {
      const adapter = getProviderAdapter(data.provider);
      const result = await adapter.validate({
        kind: "gateway",
        connectionId: data.connectionId,
        connectorId: method.connectorId,
        ownerUserId: context.userId,
        connectionRowId: "", // no row yet — adapters key off connectionId/connectorId
      });
      if (result.ok) {
        accountLabel = result.accountLabel ?? null;
        accountEmail = result.accountEmail ?? null;
      }
    } catch {
      // best-effort only — never block saving the grant
    }
    accountLabel = accountLabel ?? spec.label;

    const now = new Date().toISOString();
    const { data: existing, error: existingError } = await db
      .from("connections")
      .select("id")
      .eq("user_id", context.userId)
      .eq("provider", data.provider)
      .eq("auth_kind", "oauth_gateway")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    if (existing) {
      const { data: updated, error } = await db
        .from("connections")
        .update({
          external_handle: data.connectionId,
          account_label: accountLabel,
          account_email: accountEmail,
          status: "connected",
          status_detail: null,
          last_verified_at: now,
          updated_at: now,
        })
        .eq("id", existing.id as string)
        .select(CONNECTION_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      // SW-6 cold start: arm sensing + first ingest so the new source produces
      // signals in-session (bounded + never throws; see first-ingest.server.ts).
      const kick = await kickFirstIngest(context.userId, data.provider);
      return { connection: updated as unknown as ConnectionRow, firstIngest: kick };
    }

    const { data: inserted, error } = await db
      .from("connections")
      .insert({
        user_id: context.userId,
        provider: data.provider,
        auth_kind: "oauth_gateway",
        external_handle: data.connectionId,
        account_label: accountLabel,
        account_email: accountEmail,
        status: "connected",
        last_verified_at: now,
      })
      .select(CONNECTION_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    // SW-6 cold start: arm sensing + first ingest so the new source produces
    // signals in-session (bounded + never throws; see first-ingest.server.ts).
    const kick = await kickFirstIngest(context.userId, data.provider);
    return { connection: inserted as unknown as ConnectionRow, firstIngest: kick };
  });

/**
 * Resources bindable from ONE connection (owner-only: the own-row RLS read
 * is the authorization). Resolves auth for that connection — not the chain —
 * then asks the provider adapter.
 */
export const listBindableResources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        connectionId: z.string().uuid(),
        resourceKind: z.string().min(1).max(60),
        q: z.string().max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const row = await loadOwnConnection(db, data.connectionId);
    const adapter = getProviderAdapter(row.provider);
    if (!adapter) throw new Error("No adapter registered for this provider yet.");
    const auth = await materializeAdapterAuth(row);
    if (!auth) throw new Error("No credential stored for this connection. Reconnect it.");
    const items = (await adapter.listResources?.(auth, data.resourceKind, { q: data.q })) ?? [];
    return { items };
  });

/**
 * Bindings visible to the caller (membership RLS scopes to their workspaces),
 * decorated with minimal connection fields + owner display for attribution.
 * Connection rows belong to other members, so the decoration reads go through
 * the admin client — only non-secret display fields are exposed.
 */
export const listWorkspaceBindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { data, error } = await db
      .from("connection_bindings")
      .select(BINDING_COLUMNS)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as BindingRow[];

    const connectionIds = [...new Set(rows.map((b) => b.connection_id))];
    const connectionMap = new Map<
      string,
      {
        provider: ProviderId;
        account_label: string | null;
        status: ConnectionRow["status"];
        user_id: string;
      }
    >();
    const ownerDisplayMap = new Map<string, string | null>();
    if (connectionIds.length > 0) {
      const { data: conns, error: connError } = await admin
        .from("connections")
        .select("id,provider,account_label,status,user_id")
        .in("id", connectionIds);
      if (connError) throw new Error(connError.message);
      for (const c of conns ?? []) {
        connectionMap.set(c.id as string, {
          provider: c.provider as ProviderId,
          account_label: (c.account_label as string | null) ?? null,
          status: c.status as ConnectionRow["status"],
          user_id: c.user_id as string,
        });
      }
      const ownerIds = [...new Set([...connectionMap.values()].map((c) => c.user_id))];
      if (ownerIds.length > 0) {
        const { data: profiles, error: profError } = await admin
          .from("profiles")
          .select("id,display_name,full_name")
          .in("id", ownerIds);
        if (profError) throw new Error(profError.message);
        for (const p of (profiles ?? []) as {
          id: string;
          display_name: string | null;
          full_name: string | null;
        }[]) {
          ownerDisplayMap.set(p.id, p.display_name ?? p.full_name ?? null);
        }
      }
    }

    const bindings: WorkspaceBindingRow[] = rows.map((b) => {
      const conn = connectionMap.get(b.connection_id);
      return {
        ...b,
        provider: conn?.provider ?? b.provider,
        account_label: conn?.account_label ?? null,
        connection_status: conn?.status ?? "disconnected",
        owner_display: conn ? (ownerDisplayMap.get(conn.user_id) ?? null) : null,
      };
    });
    return { bindings };
  });

/**
 * Bind a resource to the caller's workspace. Only the connection owner can
 * bind their connection. Insert-or-update on the workspace-level unique key
 * (workspace_id, provider, resource_kind) WHERE product_id IS NULL — done as
 * select-then-write because PostgREST upserts can't target partial indexes.
 */
export const upsertBinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        connectionId: z.string().uuid(),
        resourceKind: z.string().min(1).max(60),
        resourceId: z.string().min(1).max(300),
        resourceLabel: z.string().min(1).max(300).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const connection = await loadOwnConnection(db, data.connectionId);
    if (connection.user_id !== context.userId) {
      throw new Error("Only the connection owner can bind it to a workspace.");
    }
    const { data: ws, error: wsError } = await context.supabase.rpc(
      "current_user_default_workspace",
    );
    if (wsError || !ws) throw new Error("No active workspace found for this account.");
    const workspaceId = ws as unknown as string;
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await db
      .from("connection_bindings")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("provider", connection.provider)
      .eq("resource_kind", data.resourceKind)
      .is("product_id", null)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    if (existing) {
      const { data: updated, error } = await db
        .from("connection_bindings")
        .update({
          connection_id: connection.id,
          resource_id: data.resourceId,
          resource_label: data.resourceLabel ?? null,
          created_by: context.userId,
          updated_at: now,
        })
        .eq("id", existing.id as string)
        .select(BINDING_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      return { binding: updated as unknown as BindingRow };
    }

    const { data: inserted, error } = await db
      .from("connection_bindings")
      .insert({
        connection_id: connection.id,
        workspace_id: workspaceId,
        provider: connection.provider,
        resource_kind: data.resourceKind,
        resource_id: data.resourceId,
        resource_label: data.resourceLabel ?? null,
        created_by: context.userId,
      })
      .select(BINDING_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { binding: inserted as unknown as BindingRow };
  });

/** Unbind — membership RLS authorizes any workspace member to remove a binding. */
export const removeBinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { error } = await db.from("connection_bindings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── BYO-P1b: Product-level bindings ──────────────────────────────────────────

/** List all connection_bindings for a specific product (product_id = projectId). */
export const listProductBindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: rows, error } = await db
      .from("connection_bindings")
      .select(BINDING_COLUMNS)
      .eq("product_id", data.projectId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { bindings: (rows ?? []) as unknown as BindingRow[] };
  });

/** Bind a connection to a specific product (product-scoped override). */
export const addProductBinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        workspaceId: z.string().uuid(),
        connectionId: z.string().uuid(),
        provider: z.string().min(1),
        resourceKind: z.string().min(1),
        resourceId: z.string().min(1),
        resourceLabel: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;

    const { data: existing } = await db
      .from("connection_bindings")
      .select("id")
      .eq("product_id", data.projectId)
      .eq("provider", data.provider)
      .eq("resource_kind", data.resourceKind)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await db
        .from("connection_bindings")
        .update({
          connection_id: data.connectionId,
          resource_id: data.resourceId,
          resource_label: data.resourceLabel ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existing as { id: string }).id)
        .select(BINDING_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      return { binding: updated as unknown as BindingRow };
    }

    const { data: inserted, error } = await db
      .from("connection_bindings")
      .insert({
        connection_id: data.connectionId,
        workspace_id: data.workspaceId,
        product_id: data.projectId,
        provider: data.provider,
        resource_kind: data.resourceKind,
        resource_id: data.resourceId,
        resource_label: data.resourceLabel ?? null,
        created_by: context.userId,
      })
      .select(BINDING_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { binding: inserted as unknown as BindingRow };
  });

// CONNECTIONS-V11: capture a "Request a connector" submission. Own-row RLS via
// the RLS-scoped client; no email (cost + friction), the UI shows an in-product
// acknowledgment. The founder reads demand from public.connector_requests.
export const requestConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        connector: z.string().trim().min(1).max(120),
        note: z.string().trim().max(2000).optional(),
        workspaceId: z.string().uuid().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { error } = await db.from("connector_requests").insert({
      user_id: context.userId,
      workspace_id: data.workspaceId ?? null,
      connector: data.connector,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
