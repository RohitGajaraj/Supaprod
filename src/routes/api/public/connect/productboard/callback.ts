import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Productboard native OAuth callback (public, unauthenticated).
 * Productboard redirects here after a workspace admin approves the app with
 * ?code=&state=(&error=). The user is identified by the HMAC-signed state
 * minted by startNativeOAuthConnect (connections.functions.ts); an invalid or
 * expired state means we never touch the database. Mirrors
 * connect/slack/callback.ts's shape exactly (same redirect-back UX, same
 * vault-then-upsert write pattern), with two provider differences:
 * Productboard issues a refresh_token alongside the access_token (encrypted
 * together, same pattern already shipped in connect/hubspot/callback.ts), and
 * it has no documented current-user/workspace identity endpoint, so
 * account_label stays null instead of an extra profile fetch.
 */

const PRODUCTBOARD_TOKEN_URL = "https://app.productboard.com/oauth2/token";

type ProductboardOAuthResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  created_at?: number;
};

export const Route = createFileRoute("/api/public/connect/productboard/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const redirect = (qs: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${url.origin}/settings?section=connections&${qs}` },
          });
        try {
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const oauthError = url.searchParams.get("error");
          if (oauthError) return redirect("error=productboard_connect");
          if (!code || !state) return redirect("error=productboard_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=productboard_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.productboard.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native")
            return redirect("error=productboard_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=productboard_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/productboard/callback`;

          // tokenAuthMethod: body. Productboard's token endpoint takes
          // client_id/client_secret as form fields (not a Basic auth header)
          // on a standard authorization_code grant.
          const tokenRes = await fetch(PRODUCTBOARD_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              code,
            }),
          });
          const body = (await tokenRes.json()) as ProductboardOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error(
              "[connect/productboard/callback] token exchange failed:",
              tokenRes.status,
            );
            return redirect("error=productboard_connect");
          }

          // No documented current-user/workspace identity endpoint exists for
          // Productboard (only a "Get member" lookup that requires an
          // already-known member UUID), so account_label stays null here,
          // same as productboard.server.ts's own validate() result today. The
          // access token is reportedly JWT-format and could in principle be
          // decoded, unverified, for a display-only workspace claim, but that
          // shape is unconfirmed against a real token, so it is left out.
          const accountLabel: string | null = null;

          // Productboard's refresh_token is a long-lived credential in its
          // own right (about 180 days), so when one is present it is
          // encrypted alongside the access token rather than left in
          // plaintext metadata, same as connect/hubspot/callback.ts.
          // resolve.server.ts's materializeAuth unwraps this shape and
          // proactively refreshes using token_expires_at (below) before the
          // short access token lifetime (about 24h) runs out.
          const secretPlaintext = body.refresh_token
            ? JSON.stringify({ access_token: body.access_token, refresh_token: body.refresh_token })
            : body.access_token;

          const encrypted = await encryptSecret(secretPlaintext);
          const admin = supabaseAdmin as unknown as SupabaseClient;
          const { data: secretRow, error: secretError } = await admin
            .from("connection_secrets")
            .insert({
              ciphertext: encrypted.ciphertext,
              iv: encrypted.iv,
              key_version: encrypted.keyVersion,
            })
            .select("id")
            .single();
          if (secretError || !secretRow)
            throw new Error(secretError?.message ?? "vault insert failed");

          const now = new Date().toISOString();
          // Token lifetimes are unusually short for Productboard, so the
          // expiry bookkeeping fields are kept in plain metadata (not
          // independently sensitive on their own) for resolve.server.ts's
          // proactive refresh to read; the refresh_token itself lives only
          // in the encrypted blob above.
          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(Date.now() + body.expires_in * 1000).toISOString()
              : null;
          const metadata = {
            expires_in: body.expires_in ?? null,
            refresh_token_expires_in: body.refresh_token_expires_in ?? null,
            token_created_at: body.created_at ?? null,
            token_expires_at: tokenExpiresAt,
          };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "productboard")
            .eq("auth_kind", "token")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (existingError) throw new Error(existingError.message);

          const oldSecretId = (existing as { secret_id?: string } | null)?.secret_id ?? null;

          if (existing) {
            const { error } = await admin
              .from("connections")
              .update({
                external_handle: null,
                secret_id: secretRow.id as string,
                account_label: accountLabel,
                status: "connected",
                status_detail: null,
                scopes: method.scopes,
                metadata,
                last_verified_at: now,
                updated_at: now,
              })
              .eq("id", (existing as { id: string }).id);
            if (error) throw new Error(error.message);
            // Old secret is now orphaned, delete it so the vault doesn't
            // accumulate dead ciphertext on every reconnect.
            if (oldSecretId) await admin.from("connection_secrets").delete().eq("id", oldSecretId);
          } else {
            const { error } = await admin.from("connections").insert({
              user_id: userId,
              provider: "productboard",
              auth_kind: "token",
              external_handle: null,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              status: "connected",
              scopes: method.scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "productboard");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=productboard` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Productboard Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Productboard connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/productboard/callback]", e);
          return redirect("error=productboard_connect");
        }
      },
    },
  },
});
