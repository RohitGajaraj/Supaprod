import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";

/**
 * SW-7 (founder goal, 2026-07-09): Outlook Mail native OAuth callback
 * (public, unauthenticated). Mirrors connect/microsoft_outlook/callback.ts
 * exactly, differing only in provider/product ("microsoft"/"mail") and its
 * own read-only Mail.Read scope. Multi-account: a user can connect several
 * Outlook mailboxes.
 */

const MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me";

type MicrosoftTokenResponse = {
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type MicrosoftMeResponse = { mail?: string; userPrincipalName?: string; displayName?: string };

export const Route = createFileRoute("/api/public/connect/microsoft_mail/callback")({
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
          if (oauthError) return redirect("error=microsoft_mail_connect");
          if (!code || !state) return redirect("error=microsoft_mail_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=microsoft_mail_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.microsoft_mail.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native")
            return redirect("error=microsoft_mail_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=microsoft_mail_connect");

          const redirectUri = `${url.origin}/api/public/connect/microsoft_mail/callback`;

          const tokenRes = await fetch(MS_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
              scope: method.scopes.join(" "),
            }),
          });
          const body = (await tokenRes.json()) as MicrosoftTokenResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error(
              "[connect/microsoft_mail/callback] token exchange failed:",
              body.error,
              body.error_description,
            );
            return redirect("error=microsoft_mail_connect");
          }

          let email: string | null = null;
          let displayName: string | null = null;
          try {
            const meRes = await fetch(MS_GRAPH_ME_URL, {
              headers: { Authorization: `Bearer ${body.access_token}` },
            });
            if (meRes.ok) {
              const me = (await meRes.json()) as MicrosoftMeResponse;
              email = me.mail ?? me.userPrincipalName ?? null;
              displayName = me.displayName ?? null;
            }
          } catch (e) {
            console.warn("[connect/microsoft_mail/callback] /me probe failed:", e);
          }

          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(Date.now() + body.expires_in * 1000).toISOString()
              : null;
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
          const scopes = body.scope ? body.scope.split(" ") : [];

          const { data: existing, error: existingError } = await admin
            .from("user_calendar_connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "microsoft")
            .eq("product", "mail")
            .eq("account_email", email)
            .maybeSingle();
          if (existingError) throw new Error(existingError.message);

          const oldSecretId = (existing as { secret_id?: string } | null)?.secret_id ?? null;

          if (existing) {
            const { error } = await admin
              .from("user_calendar_connections")
              .update({
                connection_id: secretRow.id as string,
                secret_id: secretRow.id as string,
                display_name: displayName,
                scopes,
                metadata: { token_expires_at: tokenExpiresAt },
                updated_at: now,
              })
              .eq("id", (existing as { id: string }).id);
            if (error) throw new Error(error.message);
            if (oldSecretId && oldSecretId !== (secretRow.id as string)) {
              await admin.from("connection_secrets").delete().eq("id", oldSecretId);
            }
          } else {
            const { error } = await admin.from("user_calendar_connections").insert({
              user_id: userId,
              provider: "microsoft",
              product: "mail",
              connection_id: secretRow.id as string,
              secret_id: secretRow.id as string,
              account_email: email,
              display_name: displayName,
              scopes,
              metadata: { token_expires_at: tokenExpiresAt },
            });
            if (error) throw new Error(error.message);
          }

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=microsoft_mail` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Outlook Mail Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Outlook Mail connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/microsoft_mail/callback]", e);
          return redirect("error=microsoft_mail_connect");
        }
      },
    },
  },
});
