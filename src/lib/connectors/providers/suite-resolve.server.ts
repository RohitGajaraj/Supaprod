// SW-7 (founder goal, 2026-07-09): credential resolution for the multi-account
// Google/Microsoft suite (user_calendar_connections), parallel to
// resolveProviderAuth/materializeAuth in resolve.server.ts but keyed by
// (userId, provider, product) instead of a single connections row per
// provider, since a user can connect several Google/Microsoft accounts.
// Reuses the exact same vault (connection_secrets) and proactive-refresh
// machinery (oauth-refresh.server.ts) as the main connector system.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { decryptSecret, encryptSecret } from "../crypto.server";
import { providerSupportsRefresh, refreshNativeOAuthToken } from "../oauth-refresh.server";
import type { ProviderId } from "../registry";
import type { SuiteProduct, SuiteProvider } from "@/lib/calendar-connections.functions";

function admin(): SupabaseClient {
  return supabaseAdmin as unknown as SupabaseClient;
}

function providerIdFor(provider: SuiteProvider, product: SuiteProduct): ProviderId {
  if (provider === "google") return product === "calendar" ? "google_calendar" : "gmail";
  return product === "calendar" ? "microsoft_outlook" : "microsoft_mail";
}

export type ResolvedSuiteAuth = {
  token: string;
  accountEmail: string | null;
  connectionRowId: string;
};

/**
 * Resolve a bearer token for the FIRST (oldest) connected account matching
 * (userId, provider, product) - "primary connection" wins, same convention
 * getPrimaryConnection already uses for calendar reads. Returns null when
 * there is no connection, no vaulted secret, or resolution otherwise fails;
 * never throws (callers treat null as "nothing to do", same as every other
 * ingest adapter's degrade-cleanly convention).
 */
export async function resolveSuiteAuth(
  userId: string,
  provider: SuiteProvider,
  product: SuiteProduct,
): Promise<ResolvedSuiteAuth | null> {
  const { data: row, error } = await admin()
    .from("user_calendar_connections")
    .select("id,secret_id,account_email,metadata")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("product", product)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !row) return null;
  const secretId = (row as { secret_id?: string | null }).secret_id;
  if (!secretId) return null;

  const { data: secret, error: secretError } = await admin()
    .from("connection_secrets")
    .select("ciphertext,iv,key_version")
    .eq("id", secretId)
    .maybeSingle();
  if (secretError || !secret) return null;

  const plaintext = await decryptSecret({
    ciphertext: secret.ciphertext as string,
    iv: secret.iv as string,
    keyVersion: (secret.key_version as number | null) ?? 1,
  });

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

  const providerId = providerIdFor(provider, product);
  const rowId = (row as { id: string }).id;
  const accountEmail = (row as { account_email: string | null }).account_email;

  if (refreshToken && providerSupportsRefresh(providerId)) {
    const metadata = (row as { metadata?: Record<string, unknown> | null }).metadata;
    const expiresAtRaw = metadata?.token_expires_at;
    const expiresAtMs = typeof expiresAtRaw === "string" ? new Date(expiresAtRaw).getTime() : NaN;
    const needsRefresh = !Number.isFinite(expiresAtMs) || expiresAtMs - Date.now() < 5 * 60 * 1000;
    if (needsRefresh) {
      const refreshed = await refreshNativeOAuthToken(providerId, refreshToken);
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
            .eq("id", secretId);
          await admin()
            .from("user_calendar_connections")
            .update({
              metadata: {
                ...(metadata ?? {}),
                token_expires_at:
                  refreshed.expiresInSeconds != null
                    ? new Date(Date.now() + refreshed.expiresInSeconds * 1000).toISOString()
                    : null,
              },
              updated_at: now,
            })
            .eq("id", rowId);
        } catch (e) {
          console.warn(
            `[suite-resolve] ${providerId} refresh succeeded but vault write failed:`,
            e,
          );
        }
      }
    }
  }

  return { token: accessToken, accountEmail, connectionRowId: rowId };
}
