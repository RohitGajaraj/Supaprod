import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * Linear native OAuth callback (public, unauthenticated). Linear redirects
 * here after the user approves the app with ?code=&state=(&error=). The user
 * is identified by the HMAC-signed state minted by startNativeOAuthConnect
 * (connections.functions.ts); an invalid or expired state means we never
 * touch the database. Mirrors connect/slack/callback.ts's shape exactly
 * (same redirect-back UX, same vault + upsert pattern), with two
 * Linear-specific differences: a required grant_type field on the token
 * exchange, and a one-shot GraphQL profile fetch (viewer + organization) used
 * both as the account label source and as a smoke test that the token
 * actually works.
 */

const LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token";
const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

type LinearOAuthResponse = {
  error?: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
};

type LinearProfileResponse = {
  data?: {
    viewer?: { name?: string; email?: string };
    organization?: { id?: string; name?: string };
  };
  errors?: unknown;
};

export const Route = createFileRoute("/api/public/connect/linear/callback")({
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
          if (oauthError) return redirect("error=linear_connect");
          if (!code || !state) return redirect("error=linear_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=linear_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.linear.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=linear_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=linear_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/linear/callback`;

          const tokenRes = await fetch(LINEAR_TOKEN_URL, {
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
          const body = (await tokenRes.json()) as LinearOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error("[connect/linear/callback] token exchange failed:", body.error);
            return redirect("error=linear_connect");
          }

          // One-shot profile fetch: doubles as the account label source and a
          // smoke test that the token actually works. Best effort only, this
          // never fails the connect, matching how Slack tolerates a missing
          // team name. Also picks up the organization id to use as the
          // external_handle, since Linear has no separate team/instance id
          // to key off of like Slack's team.id.
          let accountLabel: string | null = null;
          let externalHandle: string | null = null;
          try {
            const profileRes = await fetch(LINEAR_GRAPHQL_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${body.access_token}`,
              },
              body: JSON.stringify({ query: "{ viewer { name email } organization { id name } }" }),
            });
            if (profileRes.ok) {
              const profile = (await profileRes.json()) as LinearProfileResponse;
              const viewerName = profile.data?.viewer?.name ?? null;
              const orgName = profile.data?.organization?.name ?? null;
              externalHandle = profile.data?.organization?.id ?? null;
              if (viewerName && orgName) accountLabel = `${viewerName} - ${orgName} (Linear)`;
              else if (orgName) accountLabel = `${orgName} (Linear)`;
            } else {
              console.error("[connect/linear/callback] profile fetch failed:", profileRes.status);
            }
          } catch (e) {
            console.error("[connect/linear/callback] profile fetch error:", e);
          }

          // Linear access tokens expire in ~24h and must be refreshed via
          // grant_type=refresh_token against the same token endpoint, and Linear
          // rotates the refresh_token on every use (the previous one is
          // invalidated immediately), so the newest refresh_token must always be
          // the one persisted. When a refresh_token is present, the vaulted
          // secret below is a JSON blob {access_token, refresh_token} rather
          // than a bare string; resolve.server.ts's materializeAuth unwraps
          // this shape and proactively refreshes using token_expires_at
          // (below), persisting whichever new refresh_token comes back since
          // Linear invalidates the previous one on every use.
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

          const scopes = body.scope ? body.scope.split(",") : [];
          const now = new Date();
          const nowIso = now.toISOString();
          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(now.getTime() + body.expires_in * 1000).toISOString()
              : null;

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "linear")
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
                external_handle: externalHandle,
                secret_id: secretRow.id as string,
                account_label: accountLabel,
                status: "connected",
                status_detail: null,
                scopes,
                metadata: { token_expires_at: tokenExpiresAt },
                last_verified_at: nowIso,
                updated_at: nowIso,
              })
              .eq("id", (existing as { id: string }).id);
            if (error) throw new Error(error.message);
            // Old secret is now orphaned, delete it so the vault doesn't
            // accumulate dead ciphertext on every reconnect.
            if (oldSecretId) await admin.from("connection_secrets").delete().eq("id", oldSecretId);
          } else {
            const { error } = await admin.from("connections").insert({
              user_id: userId,
              provider: "linear",
              auth_kind: "token",
              external_handle: externalHandle,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              status: "connected",
              scopes,
              metadata: { token_expires_at: tokenExpiresAt },
              last_verified_at: nowIso,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "linear");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=linear` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Linear Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Linear connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/linear/callback]", e);
          return redirect("error=linear_connect");
        }
      },
    },
  },
});
