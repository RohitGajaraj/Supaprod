import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { makeConnectState } from "@/lib/connectors/providers/github.server";

// SW-7 (founder goal, 2026-07-09): native OAuth replaces the Lovable
// connector gateway for the whole Google/Microsoft suite (Calendar + Mail).
// Multi-account is the one real difference from every other connector: a
// user can connect several Google/Microsoft accounts (personal + work), so
// this stays on its own table (user_calendar_connections, now also product-
// aware) instead of the single-connection-per-provider `connections` table.
// Token vaulting, encryption, and proactive refresh are otherwise identical
// to the main system - see connect/google_calendar/callback.ts etc. and
// src/lib/connectors/oauth-refresh.server.ts (both keyed off the SAME
// registry entries this file reads client/scope/endpoint data from).

export type SuiteProvider = "google" | "microsoft";
// "tasks" is Google-only (Microsoft has no equivalent wired up here).
export type SuiteProduct = "calendar" | "mail" | "tasks";

function providerIdFor(provider: SuiteProvider, product: SuiteProduct): ProviderId {
  if (provider === "google") {
    if (product === "calendar") return "google_calendar";
    if (product === "tasks") return "google_tasks";
    return "gmail";
  }
  if (product === "calendar") return "microsoft_outlook";
  if (product === "mail") return "microsoft_mail";
  throw new Error("Microsoft Tasks is not supported.");
}

function findOAuthMethod(providerId: ProviderId) {
  const method = CONNECTOR_REGISTRY[providerId].authMethods.find((m) => m.kind === "oauth_native");
  if (!method || method.kind !== "oauth_native") {
    throw new Error(`${providerId} is not configured for native OAuth.`);
  }
  return method;
}

/**
 * Kick off native OAuth for one (provider, product) pair - a full-page
 * redirect out to Google/Microsoft's own consent screen, same UX as every
 * other connector. redirect_uri is derived from the request's own Origin
 * header, never client-supplied (same hardening as startNativeOAuthConnect).
 */
export const startSuiteConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        provider: z.enum(["google", "microsoft"]),
        product: z.enum(["calendar", "mail", "tasks"]),
        returnTo: z.enum(["onboarding"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const providerId = providerIdFor(data.provider, data.product);
    const method = findOAuthMethod(providerId);
    const clientId = process.env[method.clientIdEnv];
    if (!clientId) {
      const spec = CONNECTOR_REGISTRY[providerId];
      throw new Error(
        `${spec.label} setup pending. An admin must register the OAuth app and set ${method.clientIdEnv}.` +
          (spec.setupHint ? ` ${spec.setupHint}` : ""),
      );
    }
    const origin = getRequestHeader("origin");
    if (!origin) {
      throw new Error("Missing Origin header. Cannot start OAuth connect.");
    }
    const state = await makeConnectState(context.userId, data.returnTo);
    const redirectUri = `${origin}/api/public/connect/${providerId}/callback`;
    const url = new URL(method.authorizeUrl);
    url.searchParams.set("client_id", clientId);
    if (method.scopes.length > 0) {
      url.searchParams.set("scope", method.scopes.join(method.scopeSeparator ?? " "));
    }
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    for (const [key, value] of Object.entries(method.extraAuthorizeParams ?? {})) {
      url.searchParams.set(key, value);
    }
    return { authorizeUrl: url.toString() };
  });

export const listMySuiteConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_calendar_connections")
      .select(
        "id,provider,product,account_email,display_name,last_sync_at,created_at,connection_id",
      )
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return {
      connections: (data ?? []) as Array<{
        id: string;
        provider: SuiteProvider;
        product: SuiteProduct;
        account_email: string | null;
        display_name: string | null;
        last_sync_at: string | null;
        created_at: string;
        connection_id: string;
      }>,
      providersAvailable: {
        google_calendar: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        gmail: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        google_tasks: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        microsoft_outlook:
          !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET,
        microsoft_mail: !!process.env.MICROSOFT_CLIENT_ID && !!process.env.MICROSOFT_CLIENT_SECRET,
      },
    };
  });

export const disconnectSuiteConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const admin = (await import("@/integrations/supabase/client.server")).supabaseAdmin as never;
    const { data: row } = await context.supabase
      .from("user_calendar_connections")
      .select("secret_id")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    const secretId = (row as { secret_id?: string } | null)?.secret_id ?? null;
    const { error } = await context.supabase
      .from("user_calendar_connections")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (secretId) {
      await (
        admin as {
          from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<unknown> } };
        }
      )
        .from("connection_secrets")
        .delete()
        .eq("id", secretId);
    }
    return { ok: true };
  });

// Internal helper used by other server fns (calendar.functions.ts) to read the
// active calendar connection for a user; exported as a server fn so the
// dispatcher can stay client-importable. Unchanged shape from before -
// callers only ever asked for the calendar product.
export const getPrimaryConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_calendar_connections")
      .select("id,provider,connection_id,account_email")
      .eq("product", "calendar")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      connection: data as {
        id: string;
        provider: SuiteProvider;
        connection_id: string;
        account_email: string | null;
      } | null,
    };
  });
