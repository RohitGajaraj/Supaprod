import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";
const HUBSPOT_TOKEN_METADATA_URL = "https://api.hubapi.com/oauth/v1/access-tokens";

type HubSpotOAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

type HubSpotTokenMetadata = {
  hub_domain?: string;
  hub_id?: number;
};

export const Route = createFileRoute("/api/public/connect/hubspot/callback")({
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
          if (oauthError) return redirect("error=hubspot_connect");
          if (!code || !state) return redirect("error=hubspot_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=hubspot_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.hubspot.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=hubspot_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=hubspot_connect");

          const redirectUri = `${url.origin}/api/public/connect/hubspot/callback`;

          // HubSpot's token endpoint takes client_id/client_secret in the POST
          // body (form-encoded), not a Basic auth header, and the same
          // redirect_uri sent to the authorize step must be repeated here or
          // the exchange is rejected.
          const tokenRes = await fetch(HUBSPOT_TOKEN_URL, {
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
          const body = (await tokenRes.json()) as HubSpotOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error("[connect/hubspot/callback] token exchange failed:", tokenRes.status);
            return redirect("error=hubspot_connect");
          }

          // Optional follow-up step: HubSpot's token response carries no
          // portal-identifying fields, so resolve a human account label with
          // one extra GET to the token metadata endpoint. Not required for the
          // token to work against the CRM API, only for the label; a failure
          // here falls back to a null label rather than failing the connect.
          let hubDomain: string | null = null;
          let hubId: number | null = null;
          try {
            const metaRes = await fetch(`${HUBSPOT_TOKEN_METADATA_URL}/${body.access_token}`);
            if (metaRes.ok) {
              const meta = (await metaRes.json()) as HubSpotTokenMetadata;
              hubDomain = meta.hub_domain ?? null;
              hubId = meta.hub_id ?? null;
            }
          } catch (e) {
            console.warn("[connect/hubspot/callback] token metadata lookup failed:", e);
          }
          const accountLabel = hubDomain ? `${hubDomain} (Hub ${hubId ?? "?"})` : null;

          // HubSpot's refresh_token is a long-lived credential in its own
          // right, so when one is present it must be encrypted alongside the
          // access token rather than left in plaintext metadata. It is stored
          // as a single JSON-stringified plaintext ({access_token,
          // refresh_token}) inside the same vault secret. NOTE: resolve.server.ts's
          // materializeAuth today decrypts a "token" auth_kind row as a single
          // plaintext string; it will need a follow-up change to JSON.parse
          // this blob before the refresh_token is actually usable by a
          // HubSpot refresh flow (access_token expires in 30 minutes per
          // expires_in).
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
          const metadata = { hub_domain: hubDomain, hub_id: hubId };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "hubspot")
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
                external_handle: hubId ? String(hubId) : null,
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
            if (oldSecretId) await admin.from("connection_secrets").delete().eq("id", oldSecretId);
          } else {
            const { error } = await admin.from("connections").insert({
              user_id: userId,
              provider: "hubspot",
              auth_kind: "token",
              external_handle: hubId ? String(hubId) : null,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              status: "connected",
              scopes: method.scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "hubspot");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=hubspot` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HubSpot Connected - Cadence</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style></head><body><div><h2 style="color:#f97316;margin-bottom:.5rem">HubSpot connected</h2><p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p><a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div><script>try{window.close()}catch(e){}</script></body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/hubspot/callback]", e);
          return redirect("error=hubspot_connect");
        }
      },
    },
  },
});
