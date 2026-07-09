import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Notion native OAuth callback (public, unauthenticated). Notion
 * redirects here after the user approves the app and picks which pages or
 * databases to share with it, with ?code=&state=(&error=). Mirrors
 * connect/slack/callback.ts's shape exactly: same state read before any DB
 * write, same vault write, same reconnect/upsert pattern, same close-tab
 * page. Notion's token exchange differs in three ways: the client is
 * authenticated with an HTTP Basic header instead of body fields, the
 * request and response bodies are JSON instead of form-encoded, and every
 * Notion API call (including this one) needs a dated Notion-Version header.
 */

const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";
// Notion versions its whole API by a date string, independent of OAuth
// itself. Omitting this header 400s the exchange. Bump only after checking
// Notion's changelog for breaking changes.
const NOTION_VERSION = "2022-06-28";

type NotionOAuthResponse = {
  error?: string;
  access_token?: string;
  token_type?: string;
  // Present only when the integration's Developer Portal settings enabled
  // the refresh grant. Frequently null in practice for Notion today, so this
  // is optional, not guaranteed like Slack's fields.
  refresh_token?: string | null;
  bot_id?: string;
  workspace_id?: string;
  workspace_name?: string | null;
  workspace_icon?: string | null;
};

export const Route = createFileRoute("/api/public/connect/notion/callback")({
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
          if (oauthError) return redirect("error=notion_connect");
          if (!code || !state) return redirect("error=notion_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=notion_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.notion.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=notion_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=notion_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from this same origin and
          // path). Never taken from a client-supplied value.
          const redirectUri = `${url.origin}/api/public/connect/notion/callback`;

          // Notion authenticates the token exchange with HTTP Basic
          // (client_id:client_secret) instead of body fields, and expects a
          // JSON body instead of form encoding.
          const basicAuth = btoa(`${clientId}:${clientSecret}`);
          const tokenRes = await fetch(NOTION_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${basicAuth}`,
              "Notion-Version": NOTION_VERSION,
            },
            body: JSON.stringify({
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
            }),
          });
          const body = (await tokenRes.json()) as NotionOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error("[connect/notion/callback] token exchange failed:", body.error);
            return redirect("error=notion_connect");
          }

          // Notion's schema allows a refresh_token, and unlike the access
          // token itself it is a long-lived credential, so when present it is
          // vaulted alongside the access token in the SAME encrypted secret
          // (JSON-stringified), not left in the plaintext metadata column.
          // resolve.server.ts's materializeAuth correctly unwraps this shape
          // either way, but registry.ts sets supportsRefresh: false for
          // Notion (the refresh grant is optional and frequently absent in
          // practice), so it won't proactively refresh this one even when a
          // refresh_token is present; the data is captured and ready if that
          // is ever flipped on.
          const hasRefreshToken =
            typeof body.refresh_token === "string" && body.refresh_token.length > 0;
          const secretPlaintext = hasRefreshToken
            ? JSON.stringify({
                access_token: body.access_token,
                refresh_token: body.refresh_token,
              })
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

          const workspaceId = body.workspace_id ?? null;
          const workspaceName = body.workspace_name ?? null;
          const accountLabel = workspaceName ?? body.bot_id ?? null;
          // Notion has no "scope" field at all (see registry.ts): access is
          // governed by capabilities set once on the integration itself, not
          // requested per authorization, so there is nothing to record here.
          const scopes: string[] = [];
          const metadata = {
            workspace_icon: body.workspace_icon ?? null,
            bot_id: body.bot_id ?? null,
          };
          const now = new Date().toISOString();

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "notion")
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
                external_handle: workspaceId,
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
              provider: "notion",
              auth_kind: "token",
              external_handle: workspaceId,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              status: "connected",
              scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "notion");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=notion` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Notion Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Notion connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/notion/callback]", e);
          return redirect("error=notion_connect");
        }
      },
    },
  },
});
