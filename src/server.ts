import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { captureError } from "./lib/observability/errors";
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

// Catastrophic 500 fallback rendered by this worker entry. A standalone HTML
// document with inline styles because the app stylesheet and token layer may
// not be reachable at this point; the literals below are Meridian's dark
// ground, resolved through a 1x1 canvas because the tokens are OKLCH and
// cannot be read off the source. In order of use: --mrd-bg, --mrd-ink,
// --mrd-mute, --mrd-solid with --mrd-on-solid, and --mrd-body. The values are
// deliberately NOT repeated in this comment. A documentation hex counts as
// raw-colour debt exactly like a painted one, and repeating six of them here
// took this file from 8 to 14 while changing nothing that paints, which
// inflates the very number the SCAN_ROOTS decision turns on.
// Measured 2026-08-21: ink on ground 17.86:1, mute on ground 7.41:1, and the
// primary pair 11.31:1, which is the pair surface-parts.tsx documents as light
// in both grounds. This page was Tempo greys with a v1 Ember button fill until
// the founder ruled it ported; both systems are retired, and the file sits
// outside the ratchet's scan roots, which is why it kept them. Dark-first.
// The "500" numeral is the page's single Geist
// Pixel brand moment (contract sections 3 and 8), mirroring the 404 boundary
// in __root.tsx; the @font-face points at the self-hosted Pixel Square file
// (never Google Fonts) and degrades to the mono stack if it cannot load.
// Copy matches the client error boundary for a consistent voice; no raw
// stack is ever shown. (src/lib/error-page.ts still serves src/start.ts.)
function renderBrandedErrorPage(): string {
  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @font-face {
        font-family: "Geist Pixel Square";
        src: url("/fonts/geist/GeistPixel-Square.woff2") format("woff2");
        font-weight: 400;
        font-display: swap;
      }
      :root { color-scheme: dark; }
      body { font: 15px/1.55 "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif; background: #0c0a08; color: #f5f3f1; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 26rem; width: 100%; text-align: center; padding: 2rem; }
      .code { font-family: "Geist Pixel Square", ui-monospace, monospace; font-size: 52px; line-height: 1; color: #f5f3f1; margin-bottom: 12px; }
      h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
      p { color: #a19e9a; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; font-size: 0.8125rem; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #37332f; color: #f5f3f1; font-weight: 600; }
      .secondary { background: transparent; color: #bebcb9; border-color: rgba(246,246,246,0.11); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="code">500</div>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. Try again, or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

function brandedErrorResponse(): Response {
  return new Response(renderBrandedErrorPage(), {
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

/**
 * Public marketing routes, which may be cached at the edge.
 *
 * MEASURED 2026-08-07 against the live site, three runs each: TTFB on these
 * routes ranges 0.76s to 1.9s, and connect plus TLS accounts for only 20 to
 * 150ms of it. So 85 to 95 percent is server-side SSR compute, repeated in full
 * for every visitor, because every response carries
 * `cache-control: no-cache, must-revalidate, max-age=0`.
 *
 * These routes render the same bytes for every anonymous visitor. There is no
 * per-user content on any of them, which is what makes edge caching safe here
 * and unsafe on anything under _authenticated.
 *
 * `s-maxage` caches at the Cloudflare edge, not in the visitor's browser, so a
 * deploy is picked up on the next revalidation rather than being pinned in
 * somebody's cache for a day. `stale-while-revalidate` means the first visitor
 * after expiry still gets an instant response while the edge refreshes behind
 * them, which is the case that would otherwise reintroduce the 1.9s.
 */
const CACHEABLE_MARKETING_ROUTES = new Set([
  "/",
  "/pricing",
  "/product",
  "/demo",
  "/faq",
  "/security",
  "/privacy",
  "/terms",
  "/subprocessors",
  "/updates",
  "/proof",
  "/investors",
  "/brief",
  "/p/teardown",
]);

export function withMarketingCacheHeaders(response: Response, pathname: string): Response {
  if (!CACHEABLE_MARKETING_ROUTES.has(pathname)) return response;
  // Only cache a clean success. A 404, a redirect or an error must never be
  // held at the edge for five minutes.
  if (response.status !== 200) return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

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

    // MCP DISCOVERY MANIFEST. Added 2026-08-07 because the surface existed and
    // could not be found.
    //
    // Measured live before writing this: /mcp and /.mcp/list-tools both return
    // 401 with application/json, so the server is real. But
    // /.well-known/mcp.json returned 200 with text/html, the SPA shell, because
    // unknown paths soft-404 into the app. A client asking the standard
    // discovery question got a webpage AND a success status, so it could not
    // even detect the failure.
    //
    // The launch tracker calls this "the strongest unclaimed asset the company
    // owns" and "the most credible AI-native proof". It was undiscoverable.
    if (url.pathname === "/.well-known/mcp.json") {
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
        JSON.stringify(
          {
            name: "Supaprod",
            description:
              "Supaprod is where product decisions live when agents do the work. Tells you what to build, builds and ships it, then learns what actually worked.",
            // /mcp, NOT /api/mcp. The agent card advertised /api/mcp, which
            // serves the SPA shell; /mcp is the endpoint that actually answers.
            // Both are fixed, and this is the reason they disagreed.
            endpoint: `${url.origin}/mcp`,
            transport: "http+json-rpc-2.0",
            protocol_versions: ["2025-06-18", "2025-03-26", "2024-11-05"],
            authentication: {
              type: "oauth2",
              scheme: "bearer",
              protected_resource_metadata: `${url.origin}/.well-known/oauth-protected-resource`,
              token_issuance: `${url.origin}/settings?section=interop`,
            },
            tools_url: `${url.origin}/.mcp/list-tools`,
            documentation_url: `${url.origin}/integrations`,
            agent_card: `${url.origin}/.well-known/agent.json`,
            provider: { organization: "Supaprod", url: url.origin },
          },
          null,
          2,
        ),
        { status: 200, headers: AGENT_CARD_CORS_HEADERS },
      );
    }

    // ANY OTHER /.well-known/* PATH IS A 404, AND SAYS SO IN JSON.
    //
    // This is the narrow half of the soft-404 fix (tracker row F11). Every
    // unknown path currently returns 200 with the SPA shell, which dilutes
    // crawl budget and trips Google's soft-404 detection. Fixing that
    // site-wide needs the router to signal notFound and is a larger change.
    //
    // But /.well-known/ is where MACHINES look, and a machine cannot recover
    // from HTML-with-a-200 the way a person glancing at a page can. Verified
    // live: /.well-known/oauth-authorization-server returned 200 text/html.
    // A client reading that has no way to know it asked for something absent.
    if (url.pathname.startsWith("/.well-known/")) {
      return new Response(JSON.stringify({ error: "not_found", resource: url.pathname }, null, 2), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
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
      // Cache headers go on LAST so the marketing Cache-Control is not
      // overwritten by anything upstream, and only ever on a 200 for a route
      // in the allow-list.
      return withMarketingCacheHeaders(withAgentDiscoveryLink(securedResponse), url.pathname);
    } catch (error) {
      console.error(error);
      persistServerError(error, request, ctx, "worker");
      // Apply security headers to error response as well
      return withSecurityHeaders(brandedErrorResponse());
    }
  },
};
