import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Google Docs native OAuth callback (public, unauthenticated). Google
 * redirects here after the user approves the app with
 * ?code=&state=(&error=). The user is identified by the HMAC-signed state
 * minted by startNativeOAuthConnect (connections.functions.ts); an invalid or
 * expired state means we never touch the database. Mirrors
 * connect/slack/callback.ts's shape exactly (same redirect-back UX, same
 * vaulting via connection_secrets under auth_kind "token"), swapping in
 * Google's token endpoint, its body-auth exchange, and a best-effort userinfo
 * call for a human-readable account label since Google's token response
 * carries no account/team object the way Slack's does.
 *
 * Known gap (not fixed here, out of scope for this file): Google only
 * returns a refresh_token when the authorize request sends
 * access_type=offline and prompt=consent. startNativeOAuthConnect
 * (connections.functions.ts) is the generic oauth_native authorize builder
 * shared by every provider and does not send those extra params today, so in
 * the current wiring Google will typically not hand back a refresh_token at
 * all. The code below still handles one defensively in case that changes.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleTokenResponse = {
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type GoogleUserinfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export const Route = createFileRoute("/api/public/connect/google_docs/callback")({
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
          if (oauthError) return redirect("error=google_docs_connect");
          if (!code || !state) return redirect("error=google_docs_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=google_docs_connect");
          const { userId, returnTo } = stateResult;

          const spec = CONNECTOR_REGISTRY.google_docs;
          const method = spec.authMethods.find((m) => m.kind === "oauth_native");
          if (!method || method.kind !== "oauth_native")
            return redirect("error=google_docs_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=google_docs_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/google_docs/callback`;

          // Google's tokenAuthMethod is "body": client_id/client_secret ride
          // in the form body, not an Authorization header (that path is for
          // providers whose tokenAuthMethod is "basic_header").
          const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });
          const body = (await tokenRes.json()) as GoogleTokenResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error(
              "[connect/google_docs/callback] token exchange failed:",
              body.error,
              body.error_description,
            );
            return redirect("error=google_docs_connect");
          }

          // accountLabelStrategy: Google's token response carries no
          // account/team object, so resolve a human-readable label with one
          // best-effort userinfo call. This requires the openid/email/profile
          // scopes on top of the Docs/Drive scopes the registry currently
          // requests; if those aren't granted the call fails and we fall
          // back to the provider's display label, same as the oauth_gateway
          // path in connections.functions.ts does for its own accountLabel.
          let email: string | null = null;
          let googleSub: string | null = null;
          try {
            const userinfoRes = await fetch(GOOGLE_USERINFO_URL, {
              headers: { Authorization: `Bearer ${body.access_token}` },
            });
            if (userinfoRes.ok) {
              const userinfo = (await userinfoRes.json()) as GoogleUserinfoResponse;
              email = userinfo.email ?? null;
              googleSub = userinfo.sub ?? null;
            }
          } catch (e) {
            console.warn("[connect/google_docs/callback] userinfo probe failed:", e);
          }
          const accountLabel = email ?? spec.label;

          // refresh_token is a long-lived credential, so when present it must
          // be encrypted alongside the access token rather than left in
          // plaintext metadata. resolve.server.ts's materializeAuth unwraps
          // this shape and proactively refreshes using token_expires_at
          // (below) before the 1-hour access token lifetime runs out.
          const hasRefreshToken =
            typeof body.refresh_token === "string" && body.refresh_token.length > 0;
          const secretPlaintext = hasRefreshToken
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

          const scopes = body.scope ? body.scope.split(" ") : [];
          const now = new Date().toISOString();
          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(Date.now() + body.expires_in * 1000).toISOString()
              : null;
          const metadata = {
            secret_format: hasRefreshToken ? "json_access_refresh" : "plain_access_token",
            token_expires_at: tokenExpiresAt,
          };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "google_docs")
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
                external_handle: googleSub,
                secret_id: secretRow.id as string,
                account_label: accountLabel,
                account_email: email,
                status: "connected",
                status_detail: null,
                scopes,
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
              provider: "google_docs",
              auth_kind: "token",
              external_handle: googleSub,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              account_email: email,
              status: "connected",
              scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "google_docs");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=google_docs` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Google Docs Connected - Supaprod</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Google Docs connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Supaprod.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/google_docs/callback]", e);
          return redirect("error=google_docs_connect");
        }
      },
    },
  },
});
