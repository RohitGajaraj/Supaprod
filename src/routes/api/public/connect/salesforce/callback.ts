import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * Salesforce native OAuth callback (public, unauthenticated). Salesforce
 * redirects here after the user approves the connected app with
 * ?code=&state=(&error=). The user is identified by the HMAC-signed state
 * minted by startNativeOAuthConnect (connections.functions.ts); an invalid or
 * expired state means we never touch the database. Mirrors
 * connect/slack/callback.ts's shape exactly (same redirect-back UX), but
 * exchanges the authorization code against Salesforce's Web Server Flow
 * token endpoint, which also returns an instance_url (the connected org's
 * real API base, never login.salesforce.com) and, when the refresh_token
 * scope is granted, a long-lived refresh_token.
 */

const SALESFORCE_TOKEN_URL = "https://login.salesforce.com/services/oauth2/token";

type SalesforceOAuthResponse = {
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  instance_url?: string;
  id?: string;
  token_type?: string;
  signature?: string;
  issued_at?: string;
  scope?: string;
};

type SalesforceIdentity = {
  username?: string;
  display_name?: string;
  organization_id?: string;
};

export const Route = createFileRoute("/api/public/connect/salesforce/callback")({
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
          if (oauthError) return redirect("error=salesforce_connect");
          if (!code || !state) return redirect("error=salesforce_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=salesforce_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.salesforce.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native")
            return redirect("error=salesforce_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=salesforce_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          const redirectUri = `${url.origin}/api/public/connect/salesforce/callback`;

          // Salesforce's Web Server Flow token endpoint takes a standard
          // form-urlencoded body with client_id/client_secret included in the
          // body (not a Basic auth header), same shape as Slack's exchange.
          const tokenRes = await fetch(SALESFORCE_TOKEN_URL, {
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
          const body = (await tokenRes.json()) as SalesforceOAuthResponse;
          if (!tokenRes.ok || !body.access_token || !body.instance_url) {
            console.error("[connect/salesforce/callback] token exchange failed:", body.error);
            return redirect("error=salesforce_connect");
          }

          // Recommended (not mandatory) follow-up: GET the identity URL
          // returned in the token response's id field, bearer-authenticated
          // with the new access token, to resolve a human account label.
          // Unlike Jira's accessible-resources call this does not gate the
          // connect; on failure we fall back to a null label rather than
          // failing the whole flow, since Salesforce's own docs treat it as
          // optional.
          let displayName: string | null = null;
          let organizationId: string | null = null;
          let username: string | null = null;
          if (body.id) {
            const identityRes = await fetch(body.id, {
              headers: { Authorization: `Bearer ${body.access_token}`, Accept: "application/json" },
            });
            if (identityRes.ok) {
              const identity = (await identityRes.json()) as SalesforceIdentity;
              displayName = identity.display_name ?? null;
              organizationId = identity.organization_id ?? null;
              username = identity.username ?? null;
            }
          }
          const accountLabel = displayName
            ? organizationId
              ? `${displayName} (${organizationId})`
              : displayName
            : (username ?? null);

          // Salesforce's refresh_token is a long-lived credential in its own
          // right (granted here via the "refresh_token" scope), so when one
          // is present it must be encrypted alongside the access token rather
          // than left in plaintext metadata. It is stored as a single
          // JSON-stringified plaintext ({access_token, refresh_token}) inside
          // the same vault secret. NOTE: resolve.server.ts's materializeAuth
          // today decrypts a "token" auth_kind row as a single plaintext
          // string; it will need a follow-up change to JSON.parse this blob
          // before the refresh_token is actually usable by a Salesforce
          // adapter/refresh flow.
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
          // instance_url is mandatory, not optional: every subsequent
          // REST/Bulk API call must be made against it (the connected org's
          // real domain), never against login.salesforce.com. organization_id
          // rides along for reference even though it is also the
          // external_handle below.
          const metadata = { instance_url: body.instance_url, organization_id: organizationId };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "salesforce")
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
                external_handle: organizationId,
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
              provider: "salesforce",
              auth_kind: "token",
              external_handle: organizationId,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              status: "connected",
              scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "salesforce");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=salesforce` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Salesforce Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Salesforce connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/salesforce/callback]", e);
          return redirect("error=salesforce_connect");
        }
      },
    },
  },
});
