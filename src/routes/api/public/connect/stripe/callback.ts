import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readConnectState } from "@/lib/connectors/providers/github.server";
import { encryptSecret } from "@/lib/connectors/crypto.server";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";
import { kickFirstIngest } from "@/lib/onboarding/first-ingest.server";

/**
 * SW-7: Stripe Connect native OAuth callback (public, unauthenticated). Stripe
 * redirects here after the user approves the app with
 * ?code=&state=(&error=). The user is identified by the HMAC-signed state
 * minted by startNativeOAuthConnect (connections.functions.ts); an invalid or
 * expired state means we never touch the database. Mirrors
 * connect/slack/callback.ts's shape exactly (same redirect-back UX), with the
 * following provider differences (docs.stripe.com/connect/oauth-reference):
 *   1. Auth method deviation from the generic "basic_header" recipe: Stripe's
 *      /oauth/token endpoint is a normal Stripe API call, so it authenticates
 *      the same way every Stripe API call does, HTTP Basic with the
 *      PLATFORM's own secret key (sk_live_/sk_test_, the value that
 *      STRIPE_CLIENT_SECRET holds, there is no separate registered app
 *      secret) as the username and an EMPTY password, not a
 *      base64(client_id:client_secret) pair like Slack/Figma/Notion use.
 *      client_id is only used on the /oauth/authorize leg, never here.
 *   2. The token response's access_token (and stripe_publishable_key) are
 *      documented as deprecated. The field that actually matters is
 *      stripe_user_id, the connected account id (acct_...), stored as
 *      external_handle exactly like Slack stores its team id. Every future
 *      call on behalf of this connection must authenticate with the
 *      platform's own secret key plus a Stripe-Account: <stripe_user_id>
 *      header, not by presenting access_token as a bearer credential. That
 *      calling convention is a change for the adapter/materializeAuth layer
 *      and is intentionally not made in this file (see the comment above
 *      secretPlaintext below).
 *   3. Stripe only ever returns a refresh_token for test-mode connections
 *      (used to rotate a short-lived test access token); when present it is
 *      a sensitive long-lived credential in its own right, so it is packed
 *      alongside access_token into one JSON string and encrypted as a single
 *      connection_secrets row, same shape as connect/jira/callback.ts and
 *      connect/figma/callback.ts use for their refresh tokens.
 *   4. One follow-up GET to /v1/account (platform secret key + Stripe-Account
 *      header) resolves a human-readable account label, never more than this
 *      single extra call.
 */

const STRIPE_TOKEN_URL = "https://connect.stripe.com/oauth/token";
const STRIPE_ACCOUNT_URL = "https://api.stripe.com/v1/account";

type StripeOAuthResponse = {
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  stripe_publishable_key?: string;
  stripe_user_id?: string;
  scope?: string;
  livemode?: boolean;
  token_type?: string;
};

type StripeAccountResponse = {
  id?: string;
  email?: string | null;
  business_profile?: { name?: string | null } | null;
  settings?: { dashboard?: { display_name?: string | null } | null } | null;
};

export const Route = createFileRoute("/api/public/connect/stripe/callback")({
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
          if (oauthError) return redirect("error=stripe_connect");
          if (!code || !state) return redirect("error=stripe_connect");

          const stateResult = await readConnectState(state);
          if (!stateResult) return redirect("error=stripe_connect");
          const { userId, returnTo } = stateResult;

          const method = CONNECTOR_REGISTRY.stripe.authMethods.find(
            (m) => m.kind === "oauth_native",
          );
          if (!method || method.kind !== "oauth_native") return redirect("error=stripe_connect");
          const clientId = process.env[method.clientIdEnv];
          const clientSecret = process.env[method.clientSecretEnv];
          if (!clientId || !clientSecret) return redirect("error=stripe_connect");

          // Must byte-for-byte match the redirect_uri sent to the authorize
          // call (startNativeOAuthConnect built it from the same origin+path).
          // Stripe's own /oauth/token contract does not require it back
          // (no redirect_uri param in its docs), so it is derived here only
          // to preserve the same never-trust-the-client invariant every
          // other native callback in this codebase follows.
          const redirectUri = `${url.origin}/api/public/connect/stripe/callback`;

          // See file header note 1: Basic auth here is the platform secret
          // key (clientSecret) with a blank password, not
          // base64(client_id:client_secret).
          const basicAuth = btoa(`${clientSecret}:`);
          const tokenRes = await fetch(STRIPE_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({ code, grant_type: "authorization_code" }),
          });
          const body = (await tokenRes.json()) as StripeOAuthResponse;
          if (!tokenRes.ok || body.error || !body.stripe_user_id || !body.access_token) {
            console.error(
              "[connect/stripe/callback] token exchange failed:",
              body.error ?? body.error_description,
            );
            return redirect("error=stripe_connect");
          }

          const stripeUserId = body.stripe_user_id;

          // One follow-up call to resolve a human-readable label; never more
          // than this single extra GET. Authenticated with the PLATFORM's own
          // secret key plus Stripe-Account, matching how every future call on
          // behalf of this connection must authenticate (see file header
          // note 2), not with the OAuth response's access_token.
          let account: StripeAccountResponse = {};
          try {
            const accountRes = await fetch(STRIPE_ACCOUNT_URL, {
              headers: {
                Authorization: `Bearer ${clientSecret}`,
                "Stripe-Account": stripeUserId,
              },
            });
            if (accountRes.ok) account = (await accountRes.json()) as StripeAccountResponse;
          } catch (e) {
            console.error("[connect/stripe/callback] /v1/account lookup failed:", e);
          }

          const accountLabel =
            account.business_profile?.name ??
            account.settings?.dashboard?.display_name ??
            account.email ??
            stripeUserId;
          const accountEmail = account.email ?? null;

          // Stripe's refresh_token (test-mode connections only) is itself a
          // sensitive, long-lived credential, so when present it is packed
          // alongside the access token into one JSON string and encrypted as
          // a single connection_secrets row, the same shape
          // connect/jira/callback.ts and connect/figma/callback.ts use.
          // NOTE: resolve.server.ts's materializeAuth today decrypts a
          // "token" auth_kind row as a bare plaintext string; it would need a
          // follow-up change to JSON.parse this blob before either the
          // refresh_token or a Stripe-Account-header-aware call could
          // actually use these fields. Not made here.
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

          const scopes = body.scope ? [body.scope] : method.scopes;
          const now = new Date().toISOString();
          // Non-sensitive bookkeeping: Stripe's authorization code is tied to
          // test or live mode and must be re-exchanged with a secret key of
          // the same mode, so a future refresh/reconnect flow can check this
          // against the connecting key's mode before calling Stripe.
          const metadata = { livemode: body.livemode ?? null };

          const { data: existing, error: existingError } = await admin
            .from("connections")
            .select("id,secret_id")
            .eq("user_id", userId)
            .eq("provider", "stripe")
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
                external_handle: stripeUserId,
                secret_id: secretRow.id as string,
                account_label: accountLabel,
                account_email: accountEmail,
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
              provider: "stripe",
              auth_kind: "token",
              external_handle: stripeUserId,
              secret_id: secretRow.id as string,
              account_label: accountLabel,
              account_email: accountEmail,
              status: "connected",
              scopes,
              metadata,
              last_verified_at: now,
            });
            if (error) throw new Error(error.message);
          }

          await kickFirstIngest(userId, "stripe");

          if (returnTo === "onboarding") {
            return new Response(null, {
              status: 302,
              headers: { Location: `${url.origin}/onboarding?connected=stripe` },
            });
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Stripe Connected - Cadence</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5;text-align:center}</style>
</head><body>
<div><h2 style="color:#f97316;margin-bottom:.5rem">Stripe connected</h2>
<p style="color:#a1a1aa;margin-bottom:1.5rem">You can close this tab and return to Cadence.</p>
<a href="${url.origin}/settings?section=connections" style="color:#f97316;font-size:.875rem">Or click here to return</a></div>
<script>try{window.close()}catch(e){}</script>
</body></html>`,
            { headers: { "Content-Type": "text/html;charset=utf-8" } },
          );
        } catch (e) {
          console.error("[connect/stripe/callback]", e);
          return redirect("error=stripe_connect");
        }
      },
    },
  },
});
