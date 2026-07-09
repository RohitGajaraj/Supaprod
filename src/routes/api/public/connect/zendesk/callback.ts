import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Zendesk native OAuth callback (public, unauthenticated). Zendesk
 * redirects here after the user approves the app with
 * ?code=&state=(&error=). Mirrors connect/slack/callback.ts's shape exactly:
 * validate the signed state before any DB write, exchange the code for a
 * token, vault it via connection_secrets (auth_kind 'token'), then
 * upsert connections and kick the first ingest.
 *
 * Zendesk-specific wrinkle (see docs/ research on the provider): both the
 * authorize URL and the token URL are hosted on the customer's own
 * "{subdomain}.zendesk.com", not a fixed host. Cadence has no UI yet that
 * captures a per-connection subdomain before the redirect is built (that is
 * a separate, not-yet-shipped piece of work), so this callback falls back to
 * the single shared ZENDESK_SUBDOMAIN env var, the same interim, one-tenant
 * value zendesk.server.ts's env-token adapter already reads today. When the
 * subdomain-capture step ships, thread the real per-connection subdomain
 * through the signed state instead of this env fallback.
 */

const ZENDESK_TOKEN_PATH = "/oauth/tokens";

type ZendeskOAuthResponse = {
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
};

type ZendeskProfileResponse = {
  user?: { name?: string; email?: string };
};

export const Route = createFileRoute("/api/public/connect/zendesk/callback")({
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
          if (oauthError) return redirect("error=zendesk_connect");
          if (!code || !state) return redirect("error=zendesk_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=zendesk_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.zendesk.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=zendesk_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=zendesk_connect");

          // Interim single-tenant subdomain source, see the file-header note.
          const subdomain = process.env.ZENDESK_SUBDOMAIN;
          if (!subdomain) return redirect("error=zendesk_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/zendesk/callback`;

          const tokenRes = await fetch(`https://${subdomain}.zendesk.com${ZENDESK_TOKEN_PATH}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
            }),
          });
          const body = (await tokenRes.json()) as ZendeskOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error("[connect/zendesk/callback] token exchange failed:", body.error);
            return redirect("error=zendesk_connect");
          }

          // Zendesk refresh tokens rotate on every use and are single-use, so
          // when one is present it is a long-lived credential in its own right
          // and must be encrypted alongside the access token rather than left
          // in plaintext metadata. Stored as a single JSON-stringified
          // plaintext ({access_token, refresh_token}) inside the same vault
          // secret. resolve.server.ts's materializeAuth unwraps this shape and
          // proactively refreshes using token_expires_at (below), persisting
          // whichever new refresh_token comes back since Zendesk rotates it
          // on every use.
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

          // Account label: the subdomain is the primary, always-available
          // label (mirrors the accountLabelStrategy). The users/me.json call
          // is an optional, best-effort enrichment, exactly one extra GET,
          // and never fails the connect flow if it errors.
          let accountLabel = `${subdomain}.zendesk.com`;
          try {
            const profileRes = await fetch(
              `https://${subdomain}.zendesk.com/api/v2/users/me.json`,
              {
                headers: { Authorization: `Bearer ${body.access_token}` },
              },
            );
            if (profileRes.ok) {
              const profileBody = (await profileRes.json()) as ZendeskProfileResponse;
              const identity = profileBody.user?.email ?? profileBody.user?.name;
              if (identity) accountLabel = `${subdomain}.zendesk.com (${identity})`;
            }
          } catch {
            // Cosmetic only, keep the subdomain-only label on any failure.
          }

          const scopes = body.scope ? body.scope.split(" ") : [];
          const now = new Date().toISOString();
          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(Date.now() + body.expires_in * 1000).toISOString()
              : null;
          const metadata = { subdomain, token_expires_at: tokenExpiresAt };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "zendesk")
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
                external_handle: subdomain,
                secret_id: secretRow.id as string,
                account_label: accountLabel,
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
              provider: "zendesk",
              auth_kind: "token",
              external_handle: subdomain,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              status: "connected",
              scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "zendesk");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=zendesk` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Zendesk Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Zendesk connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/zendesk/callback]", e);
          return redirect("error=zendesk_connect");
        }
      },
    },
  },
});
