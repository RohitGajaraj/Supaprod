import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { captureError } from "./lib/observability/errors";
import { renderErrorPage } from "./lib/error-page";
import {
  buildAgentCard,
  buildOAuthProtectedResourceMetadata,
  AGENT_CARD_CORS_HEADERS,
} from "./lib/a2a-card";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Agent discovery breadcrumb: an agent that only reads response headers
// (never parses HTML) still learns a machine-readable interface exists,
// without first knowing to guess /llms.txt or /agents.txt. Applied to every
// ordinary page response; skipped for the well-known/health responses below,
// which are already the machine-readable content themselves.
export const AGENT_DISCOVERY_LINK_HEADER =
  '</llms.txt>; rel="llms-txt", </agents.txt>; rel="agent-policy"';

export function withAgentDiscoveryLink(response: Response): Response {
  if (response.headers.has("Link")) return response;
  const headers = new Headers(response.headers);
  headers.set("Link", AGENT_DISCOVERY_LINK_HEADER);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Apply security headers to all responses (defense-in-depth).
 * Includes CSP, X-Frame-Options, and other recommended headers.
 * Generates a nonce for inline scripts to avoid unsafe-inline.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function withSecurityHeaders(response: Response, nonce?: string): Response {
  const headers = new Headers(response.headers);

  // Skip security headers for well-known machine-readable endpoints (agent.json, oauth)
  // and health checks which should be widely accessible
  const isWellKnown = response.headers.get("Access-Control-Allow-Origin") === "*";
  if (!isWellKnown) {
    // Content-Security-Policy: restrict loading of scripts, styles, and resources
    // TODO: Migrate theme bootstrap script to external file or implement nonce-based CSP
    // to eliminate 'unsafe-inline' for scripts (currently needed for theme FOUC prevention)
    // 2026-07-10 hotfix: the first cut of this policy shipped without the app's
    // real third-party origins and broke production visibly - Google Fonts
    // stylesheets blocked on every page (style-src had no fonts.googleapis.com,
    // font-src no fonts.gstatic.com) and Stripe.js refused to load (script-src),
    // which kills checkout; Stripe Elements/metrics also render via js.stripe.com
    // iframes (frame-src, which otherwise falls back to default-src 'self').
    // wss: keeps Supabase realtime channels working (https: does not cover them).
    const csp = `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; default-src 'self'`;
    headers.set("Content-Security-Policy", csp);

    // X-Frame-Options: prevent clickjacking (deny framing from any origin)
    headers.set("X-Frame-Options", "DENY");

    // X-Content-Type-Options: prevent MIME-type sniffing
    headers.set("X-Content-Type-Options", "nosniff");

    // Strict-Transport-Security: enforce HTTPS (1 year + preload)
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

    // Referrer-Policy: limit referrer leakage
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions-Policy: disable unused device permissions. `payment` stays
    // enabled for self + Stripe (Payment Request API inside Stripe Elements,
    // e.g. Apple Pay / Google Pay) - blanket payment=() while running Stripe
    // was part of the same 2026-07-10 CSP hotfix.
    headers.set(
      "Permissions-Policy",
      'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com")',
    );
  }

  // Clone the response to avoid consuming the original body stream,
  // then apply the security headers
  const cloned = response.clone();
  return new Response(cloned.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// SW-6 failure floor: persist a server error to the in-house error_events
// store (plus Sentry when keyed). On Workers a promise left dangling after the
// response returns can be cancelled, so the write is handed to ctx.waitUntil
// when available; the fire-and-forget fallback covers non-Workers runtimes.
type WorkersCtx = { waitUntil?: (promise: Promise<unknown>) => void };

function persistServerError(error: unknown, request: Request, ctx: unknown, surface: string): void {
  try {
    const url = new URL(request.url);
    const write = captureError(error, {
      surface,
      failure_kind: "unhandled",
      request_path: url.pathname,
      request_method: request.method,
    });
    const waitUntil = (ctx as WorkersCtx | null | undefined)?.waitUntil;
    if (typeof waitUntil === "function") {
      waitUntil.call(ctx, write);
    }
  } catch {
    // The floor must never break the error path it observes.
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
  ctx: unknown,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const error = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  console.error(error);
  persistServerError(error, request, ctx, "ssr");
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Intercept standard A2A well-known URLs before TanStack routing.
    // These paths contain a leading dot which is not expressible in
    // TanStack Router's file-based routing conventions.
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/agent.json") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      return new Response(JSON.stringify(buildAgentCard(url.origin), null, 2), {
        status: 200,
        headers: AGENT_CARD_CORS_HEADERS,
      });
    }

    if (url.pathname === "/api/healthz" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/.well-known/oauth-protected-resource") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      return new Response(
        JSON.stringify(buildOAuthProtectedResourceMetadata(url.origin), null, 2),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      // Apply security headers (CSP, X-Frame-Options, etc.) to all responses
      // except well-known machine-readable endpoints which need CORS wildcard
      const securedResponse = withSecurityHeaders(
        await normalizeCatastrophicSsrResponse(response, request, ctx),
      );
      return withAgentDiscoveryLink(securedResponse);
    } catch (error) {
      console.error(error);
      persistServerError(error, request, ctx, "worker");
      // Apply security headers to error response as well
      return withSecurityHeaders(brandedErrorResponse());
    }
  },
};
