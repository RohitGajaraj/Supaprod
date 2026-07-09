import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

const JIRA_TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const JIRA_ACCESSIBLE_RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources";

type JiraOAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

type JiraAccessibleResource = {
  id?: string;
  name?: string;
  url?: string;
};

export const Route = createFileRoute("/api/public/connect/jira/callback")({
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
          if (oauthError) return redirect("error=jira_connect");
          if (!code || !state) return redirect("error=jira_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=jira_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.jira.authMethods.find((m) => m.kind === "oauth_native");
          if (!method || method.kind !== "oauth_native") return redirect("error=jira_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=jira_connect");

          const redirectUri = `${url.origin}/api/public/connect/jira/callback`;

          // Atlassian's 3LO token endpoint takes a JSON body (client_id/secret
          // included in the body, not a Basic auth header) and returns a
          // refresh_token only because offline_access is in the registered
          // scope list (registry.ts).
          const tokenRes = await fetch(JIRA_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              grant_type: "authorization_code",
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
            }),
          });
          const body = (await tokenRes.json()) as JiraOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error("[connect/jira/callback] token exchange failed:", tokenRes.status);
            return redirect("error=jira_connect");
          }

          // Required follow-up step: the bare access token cannot call any Jira
          // REST endpoint directly. Resolve the cloudId(s) this grant can reach
          // and use the first site for labeling. A grant can technically cover
          // multiple sites; only the first is stored here, matching the single
          // extra-call simplicity of the Slack callback this file mirrors.
          const resourcesRes = await fetch(JIRA_ACCESSIBLE_RESOURCES_URL, {
            headers: { Authorization: `Bearer ${body.access_token}`, Accept: "application/json" },
          });
          const resources = resourcesRes.ok
            ? ((await resourcesRes.json()) as JiraAccessibleResource[])
            : [];
          const site = resources[0];
          if (!resourcesRes.ok || !site?.id) {
            console.error(
              "[connect/jira/callback] accessible-resources lookup failed:",
              resourcesRes.status,
            );
            return redirect("error=jira_connect");
          }
          const cloudId = site.id;
          const siteName = site.name ?? null;
          const siteUrl = site.url ?? null;

          // Jira's refresh_token is a long-lived credential in its own right, so
          // when one is present it must be encrypted alongside the access token
          // rather than left in plaintext metadata. It is stored as a single
          // JSON-stringified plaintext ({access_token, refresh_token}) inside the
          // same vault secret. resolve.server.ts's materializeAuth unwraps this
          // shape and proactively refreshes using token_expires_at (below)
          // before the access token's short lifetime runs out.
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

          const scopes = body.scope ? body.scope.split(" ") : [];
          const now = new Date().toISOString();
          const tokenExpiresAt =
            typeof body.expires_in === "number"
              ? new Date(Date.now() + body.expires_in * 1000).toISOString()
              : null;
          const metadata = {
            cloud_id: cloudId,
            site_name: siteName,
            site_url: siteUrl,
            token_expires_at: tokenExpiresAt,
          };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "jira")
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
                external_handle: cloudId,
                secret_id: secretRow.id as string,
                account_label: siteName,
                status: "connected",
                status_detail: null,
                scopes,
                metadata,
                last_verified_at: now,
                updated_at: now,
              })
              .eq("id", (existing as { id: string }).id);
            if (error) throw new Error(error.message);
            if (oldSecretId) await admin.from("connection_secrets").delete().eq("id", oldSecretId);
          } else {
            const { error } = await admin.from("connections").insert({
              user_id: userId,
              provider: "jira",
              auth_kind: "token",
              external_handle: cloudId,
              secret_id: secretRow.id as string,
              account_label: siteName,
              status: "connected",
              scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "jira");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=jira` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Jira Connected - Cadence</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style></head><body><div><h2 style="color:#f97316;margin-bottom:.5rem">Jira connected</h2><p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p><a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div><script>try{window.close()}catch(e){}</script></body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/jira/callback]", e);
          return redirect("error=jira_connect");
        }
      },
    },
  },
});
