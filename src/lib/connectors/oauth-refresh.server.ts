// SW-7: generic refresh_token grant for any oauth_native provider whose
// registry entry sets supportsRefresh: true. Mirrors the auth style (body vs
// Basic header) and body encoding (form vs JSON) each provider's own connect
// callback already uses for the initial exchange, so refreshing stays
// consistent with how the token was first minted. Never throws: a failed
// refresh returns null and the caller falls back to the existing token,
// exactly like an unrefreshed token failure has always surfaced downstream.

import { CONNECTOR_REGISTRY, type AuthMethod, type ProviderId } from "./registry";

export type RefreshedToken = {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number | null;
};

type NativeOAuthMethod = Extract<AuthMethod, { kind: "oauth_native" }>;

function findNativeMethod(provider: ProviderId): NativeOAuthMethod | null {
  const spec = CONNECTOR_REGISTRY[provider];
  const method = spec.authMethods.find((m) => m.kind === "oauth_native");
  return method && method.kind === "oauth_native" ? method : null;
}

export function providerSupportsRefresh(provider: ProviderId): boolean {
  return !!findNativeMethod(provider)?.supportsRefresh;
}

export async function refreshNativeOAuthToken(
  provider: ProviderId,
  refreshToken: string,
): Promise<RefreshedToken | null> {
  const method = findNativeMethod(provider);
  if (!method || !method.supportsRefresh) return null;
  const clientId = process.env[method.clientIdEnv];
  const clientSecret = process.env[method.clientSecretEnv];
  if (!clientId || !clientSecret) return null;

  let tokenUrl = method.tokenUrl;
  if (method.subdomainEnv) {
    const subdomain = process.env[method.subdomainEnv];
    if (!subdomain) return null;
    tokenUrl = tokenUrl.replace("{subdomain}", subdomain);
  }

  const authMethod = method.tokenAuthMethod ?? "body";
  const bodyFormat = method.tokenBodyFormat ?? "form";
  const params: Record<string, string> = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };
  if (authMethod === "body") {
    params.client_id = clientId;
    params.client_secret = clientSecret;
  }

  const headers: Record<string, string> = {};
  const body = bodyFormat === "json" ? JSON.stringify(params) : new URLSearchParams(params);
  headers["Content-Type"] =
    bodyFormat === "json" ? "application/json" : "application/x-www-form-urlencoded";
  if (authMethod === "basic_header") {
    headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  }

  try {
    const res = await fetch(tokenUrl, { method: "POST", headers, body });
    if (!res.ok) {
      console.warn(`[oauth-refresh] ${provider} refresh failed (${res.status})`);
      return null;
    }
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) {
      console.warn(`[oauth-refresh] ${provider} refresh response missing access_token`);
      return null;
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresInSeconds: typeof json.expires_in === "number" ? json.expires_in : null,
    };
  } catch (e) {
    console.warn(`[oauth-refresh] ${provider} refresh error:`, e);
    return null;
  }
}
