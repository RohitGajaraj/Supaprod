import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { INTERCOM_API, INTERCOM_HEADERS } from "@/lib/connectors/providers/intercom.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

// Intercom's own internal, unusually named token path (not /oauth/token) - copy
// exactly, per the confirmed Developer Hub docs.
const INTERCOM_TOKEN_URL = "https://api.intercom.io/auth/eagle/token";

type IntercomOAuthResponse = {
  access_token?: string;
  token?: string; // duplicate of access_token under a second key, unused here
  token_type?: string;
  errors?: Array<{ code?: string; message?: string }>;
};

type IntercomMeResponse = {
  name?: string;
  email?: string;
  app?: { id?: string; id_code?: string; name?: string };
};

/**
 * SF-INTERCOM - Intercom OAuth callback (public, unauthenticated). Same shape
 * as the shipped Slack callback: validate state before any DB write, exchange
 * the code for a token, encrypt it into the vault, then upsert the connections
 * row with auth_kind "token". Intercom-specific differences from Slack:
 *   - the token endpoint is a JSON API (not form-urlencoded) at an internal path
 *   - there is no team/workspace object on the token response itself, so the
 *     account label and workspace id need one extra GET /me call (mirrors the
 *     cosmetic, non-blocking probe pattern already used by the GitHub callback)
 *   - Intercom documents no refresh_token/expires_in, so the token is stored as
 *     a durable secret with no rotation handling
 */
export const Route = createFileRoute("/api/public/connect/intercom/callback")({
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
          if (oauthError) return redirect("error=intercom_connect");
          if (!code || !state) return redirect("error=intercom_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=intercom_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.intercom.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=intercom_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=intercom_connect");

          const redirectUri = `${url.origin}/api/public/connect/intercom/callback`;

          // tokenAuthMethod "body": client_id/client_secret travel in the JSON
          // body, not a Basic auth header. Intercom's API is JSON throughout
          // (unlike Slack's form-urlencoded token endpoint), so this is a JSON
          // POST. The trailing `=` padding a code can carry must NOT be
          // stripped (per Intercom's own quirk notes) - `code` is forwarded
          // exactly as received from the query string.
          const tokenRes = await fetch(INTERCOM_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
            }),
          });
          const body = (await tokenRes.json()) as IntercomOAuthResponse;
          if (!tokenRes.ok || !body.access_token) {
            console.error(
              "[connect/intercom/callback] token exchange failed:",
              tokenRes.status,
              body.errors,
            );
            return redirect("error=intercom_connect");
          }

          // Intercom's authorize/token flow has no scope parameter at all
          // (permissions are static Developer Hub checkboxes on the app, not
          // requested per-authorization), so there is nothing to parse into
          // per-connection scopes here.
          const scopes: string[] = [];

          // Account label + workspace id are not on the token response, so a
          // single follow-up GET resolves them, same simplicity budget as the
          // GitHub callback's cosmetic installation-account probe: a failed
          // probe still records the connection, it just falls back to nulls.
          let accountLabel: string | null = null;
          let workspaceId: string | null = null;
          try {
            const meRes = await fetch(`${INTERCOM_API}/me`, {
              headers: { ...INTERCOM_HEADERS, Authorization: `Bearer ${body.access_token}` },
            });
            if (meRes.ok) {
              const me = (await meRes.json()) as IntercomMeResponse;
              workspaceId = me.app?.id_code ?? me.app?.id ?? null;
              accountLabel = me.app?.name ?? me.name ?? workspaceId;
            }
          } catch (e) {
            console.warn("[connect/intercom/callback] account label probe failed:", e);
          }

          // Intercom's OAuth docs document no refresh_token and no expires_in
          // (tokens are effectively long-lived by design), so only the
          // access_token is encrypted here - matches Slack exactly. If Intercom
          // ever starts returning a refresh_token, it would need to be encrypted
          // alongside the access_token as one JSON string (e.g.
          // {access_token, refresh_token}), and resolve.server.ts's
          // materializeAuth would need a follow-up change to JSON.parse that
          // string before the refresh_token becomes usable elsewhere.
          const encrypted = await encryptSecret(body.access_token);
          const admin = supabaseAdmin;
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

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "intercom")
            .eq("auth_kind", "token")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (existingError) throw new Error(existingError.message);

          const oldSecretId = existing?.secret_id ?? null;

          if (existing) {
            const { error } = await admin
              .from("connections")
              .update({
                external_handle: workspaceId,
                secret_id: secretRow.id,
                account_label: accountLabel,
                status: "connected",
                status_detail: null,
                scopes,
                last_verified_at: now,
                updated_at: now,
              })
              .eq("id", existing.id);
            if (error) throw new Error(error.message);
            if (oldSecretId) await admin.from("connection_secrets").delete().eq("id", oldSecretId);
          } else {
            const { error } = await admin.from("connections").insert({
              user_id: userId,
              provider: "intercom",
              auth_kind: "token",
              external_handle: workspaceId,
              secret_id: secretRow.id,
              account_label: accountLabel,
              status: "connected",
              scopes,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "intercom");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=intercom` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Intercom Connected - Supaprod</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style></head><body><div><h2 style="color:#f97316;margin-bottom:.5rem">Intercom connected</h2><p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Supaprod.</p><a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div><script>try{window.close()}catch(e){}</script></body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/intercom/callback]", e);
          return redirect("error=intercom_connect");
        }
      },
    },
  },
});
