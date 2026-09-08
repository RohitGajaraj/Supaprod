// F-CONN Phase 1 — the ONE credential chokepoint. Every external call site
// resolves provider auth through resolveProviderAuth; nothing else reads
// connection rows or secrets directly. Resolution order:
//   1. workspace binding  (connection_bindings → connections, status connected)
//   2. user connection    (caller's own connections row via their RLS client)
//   3. env fallback       (legacy GITHUB_TOKEN-style vars from the registry)
//   4. none
// Each tier degrades on failure (warn + fall through) so an unconfigured
// environment never throws here — call sites decide what "not connected" means.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CONNECTOR_REGISTRY, type ProviderId } from "./registry";
import { decryptSecret, encryptSecret } from "./crypto.server";
import { mintInstallationToken } from "./providers/github.server";
import { providerSupportsRefresh, refreshNativeOAuthToken } from "./oauth-refresh.server";
import {
  assertConnectorCapability,
  normalizePlanTier,
  type ConnectorCapability,
} from "@/lib/entitlements";

export type ResolvedAuth =
  | {
      kind: "github_app";
      installationId: string;
      token: string;
      ownerUserId: string;
      connectionRowId: string;
    }
  | {
      kind: "gateway";
      connectionId: string;
      connectorId: string;
      ownerUserId: string;
      connectionRowId: string;
    }
  | { kind: "token"; token: string; ownerUserId: string; connectionRowId: string }
  | { kind: "env"; token: string };

export type ResolvedConnector = {
  auth: ResolvedAuth | null;
  binding: {
    id: string;
    resourceId: string;
    resourceLabel: string | null;
    config: Record<string, unknown>;
    createdBy: string;
  } | null;
  source: "workspace_binding" | "user_connection" | "env" | "none";
};

/**
 * Per-run cache for provider auth resolution. Shared across multiple tool calls
 * within an agent loop step to avoid re-querying the full credential chain
 * (workspace binding → connection → workspace membership) for the same provider.
 * Keyed by (userId, workspaceId || "", provider) tuple to handle multi-workspace scenarios.
 */
export type ProviderAuthCache = Map<string, ResolvedConnector>;

// New tables are absent from the generated Database types — untyped cast
// precedent per src/lib/outcome.functions.ts.
type ConnectionRow = {
  id: string;
  user_id: string;
  provider: string;
  auth_kind: string;
  external_handle: string | null;
  secret_id: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
};

type BindingRow = {
  id: string;
  connection_id: string;
  resource_id: string;
  resource_label: string | null;
  config: Record<string, unknown> | null;
  created_by: string;
};

function admin(): SupabaseClient {
  return supabaseAdmin as unknown as SupabaseClient;
}

/**
 * A binding row's read came back with nothing, either because there
 * genuinely is none or because the client that asked could not see one that
 * exists (P-122, A-QUEUE.md).
 *
 * ── WHY A SILENT EMPTY RESULT ISN'T TRUSTED WHEN A userClient WAS GIVEN ──
 * Live 06:32 UTC 09-04: a person's "Try the preview again" press passed its
 * own RLS client as `userClient`, resolved a WEAKER source than the tick had
 * reached the same repository with eight minutes earlier, and failed on
 * GitHub with a 403 the record could not explain. This file's own header
 * comment already loads the owning CONNECTION via admin "because connections
 * rows are own-row RLS"; the BINDING lookup itself was the one link in the
 * chain still trusting a caller-supplied client's empty read to mean "no
 * binding exists" when it could just as easily mean "this client could not
 * see one that does".
 *
 * Retrying with admin when the first read is empty does not widen who may
 * ACT: `bindingConnectionAllowed`'s own KI-34 membership check still runs on
 * whatever this returns, so a binding a caller has no business using is
 * still refused there, unchanged. It only widens who may DISCOVER that their
 * own workspace's binding exists, which is exactly what a workspace's own
 * tick and a workspace member's own retry are both supposed to be able to
 * do -- called only when `userClient` was actually supplied and came back
 * empty; a caller with no client at all is already querying admin directly.
 */
export async function bindingOrRetryWithAdmin(
  userClient: SupabaseClient | undefined,
  found: BindingRow | undefined,
  reread: (db: SupabaseClient) => Promise<BindingRow | undefined>,
): Promise<BindingRow | undefined> {
  if (found || !userClient) return found;
  return reread(admin());
}

// Workspace plan_tier cache: tier is rarely flipped and requested on every
// resolveProviderAuth call with requiredCapability set. Cache it in-process
// so the hot path costs at most one RPC per workspace per TTL, not a round-trip
// per connector call. Same pattern as creditsEnabled in runtime.server.ts.
const _workspaceTierCache: Map<string, { value: string; at: number }> = new Map();
const WORKSPACE_TIER_TTL_MS = 5 * 60 * 1000;

async function getCachedWorkspaceTier(workspaceId: string): Promise<string | undefined> {
  const now = Date.now();
  const cached = _workspaceTierCache.get(workspaceId);
  if (cached && now - cached.at < WORKSPACE_TIER_TTL_MS) {
    return cached.value;
  }
  try {
    const { data: ws, error } = await admin()
      .from("workspaces")
      .select("plan_tier")
      .eq("id", workspaceId)
      .maybeSingle();
    const tier = !error
      ? ((ws as { plan_tier?: string } | null)?.plan_tier ?? undefined)
      : undefined;
    _workspaceTierCache.set(workspaceId, { value: tier ?? "", at: now });
    return tier;
  } catch {
    return undefined;
  }
}

/**
 * KI-34 cross-tenant credential guard. The connection_bindings write RLS
 * authorizes by workspace membership only and never validates connection_id, so a
 * member could point a binding at ANOTHER account's connection; resolveProviderAuth
 * loads that connection via the service-role client (RLS off), so it must itself
 * confirm the bound connection's owner belongs to the binding's workspace before
 * materializing the credential. Policy: fail CLOSED — only an affirmatively
 * confirmed member (lookup succeeded, owner IS a member) is allowed; a lookup
 * error is treated the same as "not a member," matching the tier gate's fail-closed
 * policy above. A transient lookup failure degrades to "credential unavailable"
 * (the caller's existing fallback chain), never to a materialized cross-tenant
 * credential. Exported for unit testing.
 */
export function bindingConnectionAllowed(lookup: { errored: boolean; isMember: boolean }): boolean {
  if (lookup.errored) return false;
  return lookup.isMember;
}

/**
 * Turn a connected connections row into usable auth. Secrets/token minting go
 * through supabaseAdmin. Exported for connections.functions.ts, which
 * materializes auth for ONE specific row (not the workspace→user→env chain).
 */
export async function materializeAuth(
  row: ConnectionRow,
  provider: ProviderId,
): Promise<ResolvedAuth | null> {
  if (row.auth_kind === "github_app") {
    if (!row.external_handle) return null;
    const token = await mintInstallationToken(row.external_handle);
    return {
      kind: "github_app",
      installationId: row.external_handle,
      token,
      ownerUserId: row.user_id,
      connectionRowId: row.id,
    };
  }
  if (row.auth_kind === "oauth_gateway") {
    if (!row.external_handle) return null;
    const gatewayMethod = CONNECTOR_REGISTRY[provider].authMethods.find(
      (m) => m.kind === "oauth_gateway",
    );
    return {
      kind: "gateway",
      connectionId: row.external_handle,
      connectorId: gatewayMethod?.kind === "oauth_gateway" ? gatewayMethod.connectorId : provider,
      ownerUserId: row.user_id,
      connectionRowId: row.id,
    };
  }
  // api_key | token → decrypt from the vault.
  if (!row.secret_id) return null;
  const { data: secret, error } = await admin()
    .from("connection_secrets")
    .select("ciphertext,iv,key_version")
    .eq("id", row.secret_id)
    .maybeSingle();
  if (error || !secret) return null;
  const plaintext = await decryptSecret({
    ciphertext: secret.ciphertext as string,
    iv: secret.iv as string,
    keyVersion: (secret.key_version as number | null) ?? 1,
  });

  // Providers whose OAuth grant includes a refresh_token vault it alongside
  // the access token as a JSON blob ({access_token, refresh_token}) rather
  // than a bare string, see each provider's connect callback. Unwrap that
  // shape here so every call site keeps getting a plain bearer token back,
  // never a raw JSON string.
  let accessToken = plaintext;
  let refreshToken: string | null = null;
  if (plaintext.startsWith("{")) {
    try {
      const parsed = JSON.parse(plaintext) as { access_token?: string; refresh_token?: string };
      if (parsed.access_token) {
        accessToken = parsed.access_token;
        refreshToken = parsed.refresh_token ?? null;
      }
    } catch {
      // Not actually JSON: treat the raw plaintext as the bearer token.
    }
  }

  // Proactive refresh: if this provider issues a refresh_token and supports
  // the refresh grant (registry.ts supportsRefresh), and the scheduled expiry
  // has passed or is within a 5-minute safety buffer, refresh now rather than
  // handing back a token about to stop working. Best-effort: a failed
  // refresh falls back to the existing access token, same as an unrefreshed
  // token failure has always surfaced downstream, this never blocks
  // resolution.
  if (refreshToken && providerSupportsRefresh(provider as ProviderId)) {
    const expiresAtRaw = row.metadata?.token_expires_at;
    const expiresAtMs = typeof expiresAtRaw === "string" ? new Date(expiresAtRaw).getTime() : NaN;
    const needsRefresh = !Number.isFinite(expiresAtMs) || expiresAtMs - Date.now() < 5 * 60 * 1000;
    if (needsRefresh) {
      const refreshed = await refreshNativeOAuthToken(provider as ProviderId, refreshToken);
      if (refreshed) {
        accessToken = refreshed.accessToken;
        const nextRefreshToken = refreshed.refreshToken ?? refreshToken;
        const nextPlaintext = JSON.stringify({
          access_token: accessToken,
          refresh_token: nextRefreshToken,
        });
        try {
          const encrypted = await encryptSecret(nextPlaintext);
          const now = new Date().toISOString();
          await admin()
            .from("connection_secrets")
            .update({
              ciphertext: encrypted.ciphertext,
              iv: encrypted.iv,
              key_version: encrypted.keyVersion,
            })
            .eq("id", row.secret_id);
          await admin()
            .from("connections")
            .update({
              metadata: {
                ...(row.metadata ?? {}),
                token_expires_at:
                  refreshed.expiresInSeconds != null
                    ? new Date(Date.now() + refreshed.expiresInSeconds * 1000).toISOString()
                    : null,
              },
              last_verified_at: now,
              updated_at: now,
            })
            .eq("id", row.id);
        } catch (e) {
          console.warn(`[connectors] ${provider} refresh succeeded but vault write failed:`, e);
        }
      }
      // else: refresh failed, fall through with the existing (possibly
      // stale) access token; downstream callers surface the real failure.
    }
  }

  return { kind: "token", token: accessToken, ownerUserId: row.user_id, connectionRowId: row.id };
}

export async function resolveProviderAuth(args: {
  userClient?: SupabaseClient;
  userId?: string | null;
  workspaceId?: string | null;
  productId?: string | null;
  provider: ProviderId;
  resourceKind?: string;
  /**
   * When set, the workspace plan tier is checked before credentials are
   * materialized. Pass 'inflow' for read operations (pulling signals in) and
   * 'outflow' for write operations (creating issues, updating tickets, etc.).
   * Free blocks both; Pro blocks outflow; Business+ allows both.
   * Throws with a user-readable upgrade prompt if the tier is insufficient.
   * Strategy: pricing-strategy.md §3.3 (2026-06-27).
   */
  requiredCapability?: ConnectorCapability;
  /**
   * Optional per-run cache to avoid re-querying the credential chain
   * (workspace binding → connection → workspace membership) for the same provider
   * across multiple tool calls within an agent loop. Keyed by
   * (userId, workspaceId || "", provider).
   */
  cache?: ProviderAuthCache;
}): Promise<ResolvedConnector> {
  const {
    userClient,
    userId,
    workspaceId,
    productId,
    provider,
    resourceKind,
    requiredCapability,
    cache,
  } = args;

  // Tier gate — checked BEFORE any credential work so we never materialize auth
  // for an unauthorized tier. Fails CLOSED: any lookup error defaults to 'free'
  // (most restrictive), never fails open. assertConnectorCapability throws with a
  // user-readable upgrade message on insufficient tier; that error propagates as-is.
  // Tier lookups are cached per workspace to avoid redundant RPC calls on the hot path.
  if (requiredCapability && workspaceId) {
    const tierRaw = await getCachedWorkspaceTier(workspaceId);
    if (!tierRaw) {
      console.warn(`[connectors] tier lookup failed for workspace, defaulting free`);
    }
    const tier = normalizePlanTier(tierRaw);
    // Throws with user-readable upgrade prompt if tier is insufficient.
    assertConnectorCapability(tier, requiredCapability);
  }

  // Check per-run auth cache before doing credential chain queries
  let cacheKey: string | null = null;
  if (cache && userId) {
    cacheKey = `${userId}|${workspaceId ?? ""}|${provider}|${productId ?? ""}|${resourceKind ?? ""}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  // Helper to cache and return resolved connectors
  const cacheAndReturn = (result: ResolvedConnector): ResolvedConnector => {
    if (cache && cacheKey) cache.set(cacheKey, result);
    return result;
  };

  // 0. Product-scoped binding (BYO-P1b). Most specific — overrides workspace.
  if (productId && workspaceId) {
    try {
      const readProductBinding = async (db: SupabaseClient): Promise<BindingRow | undefined> => {
        let q = db
          .from("connection_bindings")
          .select("id,connection_id,resource_id,resource_label,config,created_by")
          .eq("workspace_id", workspaceId)
          .eq("product_id", productId)
          .eq("provider", provider);
        if (resourceKind) q = q.eq("resource_kind", resourceKind);
        const { data: bindings, error } = await q.order("created_at", { ascending: true }).limit(1);
        return !error && bindings ? (bindings[0] as BindingRow | undefined) : undefined;
      };
      const binding = await bindingOrRetryWithAdmin(
        userClient,
        await readProductBinding(userClient ?? admin()),
        readProductBinding,
      );
      if (binding) {
        const { data: conn } = await admin()
          .from("connections")
          .select("id,user_id,provider,auth_kind,external_handle,secret_id,status,metadata")
          .eq("id", binding.connection_id)
          .maybeSingle();
        if (conn && (conn as ConnectionRow).status === "connected") {
          let lookup = { errored: true, isMember: false };
          try {
            const { data: mem, error: memErr } = await admin()
              .from("workspace_members")
              .select("user_id")
              .eq("workspace_id", workspaceId)
              .eq("user_id", (conn as ConnectionRow).user_id)
              .maybeSingle();
            lookup = { errored: !!memErr, isMember: !!mem };
          } catch {
            lookup = { errored: true, isMember: false };
          }
          if (!bindingConnectionAllowed(lookup)) {
            console.warn(
              `[connectors] KI-34: refusing product binding for ${provider}: bound connection owner not a workspace member; falling through`,
            );
          } else {
            const auth = await materializeAuth(conn as ConnectionRow, provider);
            if (auth) {
              return cacheAndReturn({
                auth,
                binding: {
                  id: binding.id,
                  resourceId: binding.resource_id,
                  resourceLabel: binding.resource_label ?? null,
                  config: binding.config ?? {},
                  createdBy: binding.created_by,
                },
                source: "workspace_binding",
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[connectors] product binding resolution failed for ${provider}:`, e);
    }
  }

  // 1. Workspace binding. The binding row itself is the authorization (RLS-gated
  // by workspace membership on write); the owning connection is loaded via
  // supabaseAdmin because connections rows are own-row RLS.
  if (workspaceId) {
    try {
      const readWorkspaceBinding = async (db: SupabaseClient): Promise<BindingRow | undefined> => {
        let q = db
          .from("connection_bindings")
          .select("id,connection_id,resource_id,resource_label,config,created_by")
          .eq("workspace_id", workspaceId)
          .eq("provider", provider)
          .is("product_id", null);
        if (resourceKind) q = q.eq("resource_kind", resourceKind);
        const { data: bindings, error } = await q.order("created_at", { ascending: true }).limit(1);
        return !error && bindings ? (bindings[0] as BindingRow | undefined) : undefined;
      };
      const binding = await bindingOrRetryWithAdmin(
        userClient,
        await readWorkspaceBinding(userClient ?? admin()),
        readWorkspaceBinding,
      );
      if (binding) {
        const { data: conn } = await admin()
          .from("connections")
          .select("id,user_id,provider,auth_kind,external_handle,secret_id,status,metadata")
          .eq("id", binding.connection_id)
          .maybeSingle();
        if (conn && (conn as ConnectionRow).status === "connected") {
          // KI-34: confirm the bound connection's OWNER is a member of the
          // binding's workspace before materializing its credential (the binding
          // RLS never validated connection_id, so it could point cross-tenant).
          let lookup = { errored: true, isMember: false };
          try {
            const { data: mem, error: memErr } = await admin()
              .from("workspace_members")
              .select("user_id")
              .eq("workspace_id", workspaceId)
              .eq("user_id", (conn as ConnectionRow).user_id)
              .maybeSingle();
            lookup = { errored: !!memErr, isMember: !!mem };
          } catch {
            lookup = { errored: true, isMember: false };
          }
          if (!bindingConnectionAllowed(lookup)) {
            console.warn(
              `[connectors] KI-34: refusing workspace binding for ${provider}: bound connection owner is not a member of the binding's workspace (possible cross-tenant binding); falling through`,
            );
          } else {
            const auth = await materializeAuth(conn as ConnectionRow, provider);
            if (auth) {
              return cacheAndReturn({
                auth,
                binding: {
                  id: binding.id,
                  resourceId: binding.resource_id,
                  resourceLabel: binding.resource_label ?? null,
                  config: binding.config ?? {},
                  createdBy: binding.created_by,
                },
                source: "workspace_binding",
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[connectors] workspace binding resolution failed for ${provider}:`, e);
    }
  }

  // 2. The caller's own connection (their RLS client scopes to own rows).
  if (userClient) {
    try {
      let q = userClient
        .from("connections")
        .select("id,user_id,provider,auth_kind,external_handle,secret_id,status,metadata")
        .eq("provider", provider)
        .eq("status", "connected");
      if (userId) q = q.eq("user_id", userId);
      const { data: rows, error } = await q.order("created_at", { ascending: true }).limit(1);
      const conn = !error && rows ? (rows[0] as ConnectionRow | undefined) : undefined;
      if (conn) {
        const auth = await materializeAuth(conn, provider);
        if (auth) return cacheAndReturn({ auth, binding: null, source: "user_connection" });
      }
    } catch (e) {
      console.warn(`[connectors] user connection resolution failed for ${provider}:`, e);
    }
  }

  // 3. Legacy env fallback — keeps current behavior alive until bindings exist.
  const spec = CONNECTOR_REGISTRY[provider];
  const envToken = spec.envFallback ? process.env[spec.envFallback.tokenEnv] : undefined;
  if (envToken) {
    console.warn(`[connectors] deprecated env fallback: ${provider}`);
    return cacheAndReturn({ auth: { kind: "env", token: envToken }, binding: null, source: "env" });
  }

  return cacheAndReturn({ auth: null, binding: null, source: "none" });
}
