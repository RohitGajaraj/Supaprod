import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Figma native OAuth callback (public, unauthenticated). Figma
 * redirects here after the user approves the app with
 * ?code=&state=(&error=). The user is identified by the HMAC-signed state
 * minted by startNativeOAuthConnect (connections.functions.ts); an invalid or
 * expired state means we never touch the database. Mirrors
 * connect/slack/callback.ts's shape exactly (same redirect-back UX), with the
 * following provider differences:
 *   1. The token exchange authenticates via an HTTP Basic Auth header
 *      (base64 client_id:client_secret) instead of body credentials. Same
 *      pattern as Notion. Figma's auth codes also expire 30 seconds after
 *      issuance, so the exchange happens immediately, with no queuing.
 *   2. Figma's token response carries no name/email/avatar, only a
 *      user_id_string, so one follow-up GET to /v1/me resolves a
 *      human-readable account label (gated on the current_user:read scope
 *      already requested).
 *   3. Figma also returns a refresh_token (the access_token expires after 90
 *      days). A refresh_token is itself a sensitive, long-lived credential,
 *      so instead of storing it in plaintext metadata it is packed alongside
 *      the access token into one JSON string and encrypted as a single
 *      connection_secrets row, the same single-ciphertext shape Slack uses
 *      for its bare access token. resolve.server.ts's materializeAuth
 *      unwraps this shape and proactively refreshes using token_expires_at
 *      (below) before the 90-day lifetime runs out.
 */

const FIGMA_TOKEN_URL = "https://api.figma.com/v1/oauth/token";
const FIGMA_ME_URL = "https://api.figma.com/v1/me";

type FigmaOAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user_id_string?: string;
  error?: string;
  message?: string;
};

type FigmaMeResponse = {
  id?: string;
  email?: string;
  handle?: string;
  img_url?: string;
};

export const Route = createFileRoute("/api/public/connect/figma/callback")({
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
          if (oauthError) return redirect("error=figma_connect");
          if (!code || !state) return redirect("error=figma_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=figma_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.figma.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=figma_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=figma_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/figma/callback`;

          // Figma authenticates the token exchange via HTTP Basic Auth
          // (base64 client_id:client_secret), not client_id/client_secret in
          // the POST body.
          const basicAuth = btoa(`${clientId}:${clientSecret}`);
          const tokenRes = await fetch(FIGMA_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
              redirect_uri: redirectUri,
              code,
              grant_type: "authorization_code",
            }),
          });
          const body = (await tokenRes.json()) as FigmaOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error(
              "[connect/figma/callback] token exchange failed:",
              body.error ?? body.message,
            );
            return redirect("error=figma_connect");
          }

          // One follow-up call to resolve a human-readable label; never more
          // than this single extra GET.
          let me: FigmaMeResponse = {};
          try {
            const meRes = await fetch(FIGMA_ME_URL, {
              headers: { Authorization: `Bearer ${body.access_token}` },
            });
            if (meRes.ok) me = (await meRes.json()) as FigmaMeResponse;
          } catch (e) {
            console.error("[connect/figma/callback] /v1/me lookup failed:", e);
          }

          // Pack access_token + refresh_token into one JSON string before
          // encrypting, since the refresh_token is itself sensitive (see the
          // file-header note about resolve.server.ts's materializeAuth).
          const secretPlaintext = JSON.stringify({
            access_token: body.access_token,
            refresh_token: body.refresh_token ?? null,
          });
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

          const externalId = body.user_id_string ?? me.id ?? null;
          const accountLabel = me.handle ?? me.email ?? null;
          const accountEmail = me.email ?? null;
          const now = new Date().toISOString();
          // Non-sensitive token bookkeeping (access_token expires after 90
          // days per Figma's docs). token_expires_at is what resolve.server.ts's
          // proactive refresh reads.
          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(Date.now() + body.expires_in * 1000).toISOString()
              : null;
          const metadata = {
            token_type: body.token_type ?? "bearer",
            expires_in: body.expires_in ?? null,
            obtained_at: now,
            token_expires_at: tokenExpiresAt,
          };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "figma")
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
                external_handle: externalId,
                secret_id: secretRow.id as string,
                account_label: accountLabel,
                account_email: accountEmail,
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
              provider: "figma",
              auth_kind: "token",
              external_handle: externalId,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              account_email: accountEmail,
              status: "connected",
              scopes: method.scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "figma");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=figma` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Figma Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Figma connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/figma/callback]", e);
          return redirect("error=figma_connect");
        }
      },
    },
  },
});
