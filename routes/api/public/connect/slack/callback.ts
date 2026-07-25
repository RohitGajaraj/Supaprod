import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Slack native OAuth callback (public, unauthenticated). Slack
 * redirects here after the user approves the app with
 * ?code=&state=(&error=). The user is identified by the HMAC-signed state
 * minted by startNativeOAuthConnect (connections.functions.ts); an invalid or
 * expired state means we never touch the database. Mirrors
 * connect/github/callback.ts's shape exactly (same redirect-back UX), but
 * exchanges an authorization code for a real access token instead of probing
 * an installation id, and vaults that token via connection_secrets (auth_kind
 * 'token', the same generic kind resolve.server.ts already decrypts for
 * any non-github_app/oauth_gateway row).
 */

const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

type SlackOAuthResponse = {
  ok?: boolean;
  error?: string;
  access_token?: string;
  scope?: string;
  team?: { id?: string; name?: string };
  bot_user_id?: string;
};

export const Route = createFileRoute("/api/public/connect/slack/callback")({
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
          if (oauthError) return redirect("error=slack_connect");
          if (!code || !state) return redirect("error=slack_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=slack_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.slack.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=slack_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=slack_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/slack/callback`;

          const tokenRes = await fetch(SLACK_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
            }),
          });
          const body = (await tokenRes.json()) as SlackOAuthResponse;
          if (!tokenRes.ok || body.ok !== true || !body.access_token) {
            console.error("[connect/slack/callback] token exchange failed:", body.error);
            return redirect("error=slack_connect");
          }

          const encrypted = await encryptSecret(body.access_token);
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

          const teamId = body.team?.id ?? null;
          const teamName = body.team?.name ?? null;
          const scopes = body.scope ? body.scope.split(",") : [];
          const now = new Date().toISOString();

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "slack")
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
                external_handle: teamId,
                secret_id: secretRow.id as string,
                account_label: teamName,
                status: "connected",
                status_detail: null,
                scopes,
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
              provider: "slack",
              auth_kind: "token",
              external_handle: teamId,
              secret_id: secretRow.id as string,
              account_label: teamName,
              status: "connected",
              scopes,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "slack");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=slack` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Slack Connected - Supaprod</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Slack connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Supaprod.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/slack/callback]", e);
          return redirect("error=slack_connect");
        }
      },
    },
  },
});
