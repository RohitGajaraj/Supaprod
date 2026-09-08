import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { captureError, type ErrorContext } from "./lib/observability/errors";
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
  // "/p/teardown" left this set on 2026-08-22. It is now a permanent redirect,
  // and the guard below only caches a 200, so listing it would have been inert
  // as well as wrong.
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

/**
 * P-135: the edge cache we ask for and are not given.
 *
 * `withMarketingCacheHeaders` asks the edge to hold these routes for five
 * minutes. MEASURED 2026-09-04 against production, every marketing route:
 * the served response is still `no-cache, must-revalidate, max-age=0`, while
 * the same build answering in workerd sets `s-maxage=300`. So the header is
 * rewritten between this Worker and the client and the ask has never once
 * taken effect -- a month of every anonymous visitor paying a full SSR round
 * trip the code already asked the edge to skip.
 *
 * A rule that rewrites a client-facing header does not touch the Worker's own
 * cache store, so the Worker holds the response itself. This is not a
 * workaround for the zone question, which is still open and still owned by
 * whoever configured the zone; it is the half we can make true from here.
 *
 * Anonymous only, and deliberately conservative about what that means. A
 * request carrying a Supabase auth cookie or an Authorization header is
 * always served fresh. These routes render identical bytes for every
 * anonymous visitor, which is what makes holding them safe; the moment a
 * session is present that assumption is no longer ours to make. Being wrong
 * toward "do not cache" costs one render. Being wrong the other way serves
 * one person's page to somebody else, so the two errors are not weighed
 * equally here.
 */
export type EdgeCache = {
  match: (request: Request) => Promise<Response | undefined>;
  put: (request: Request, response: Response) => Promise<void>;
};

/**
 * Null wherever the Cache API does not exist -- a test, a dev server, any
 * runtime that is not workerd. Every caller treats null as "just render it",
 * so the absence of a cache is never an error, only a miss.
 */
function edgeCache(): EdgeCache | null {
  if (edgeCacheStoodDown) return null;
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return store?.default ?? null;
}

/**
 * A STORE THAT REFUSED ONCE IS NOT ASKED AGAIN IN THIS ISOLATE.
 *
 * 2026-09-08, after F-203's fix served: `error_events` filled with one
 * `edge-cache-match` row per anonymous marketing read, all saying "Cache API
 * is not yet supported for dynamically-loaded workers". The hosting runtime
 * loads the Worker dynamically, so `caches.default` exists and every call on
 * it throws. A refusal that repeats on every request is one fact reported a
 * thousand times, and each report is a write on the request's own clock.
 *
 * So the first refusal, of a match or a put, is reported with the runtime's
 * own message and stands the store down for the isolate's life: `edgeCache()`
 * answers null from then on, the handler reads BYPASS (it never consulted the
 * store), and nothing further is written. An isolate is recycled often
 * enough that a transient fault heals itself on the next one; a permanent
 * one, like this runtime's, costs one row per isolate instead of one per
 * visitor. Whether the Worker-held half of P-135 should exist at all on a
 * runtime that cannot honour it is a founder question the queue carries.
 */
let edgeCacheStoodDown: string | null = null;

/** The reason the store stood down in this isolate, or null while it is in use. */
export function edgeCacheStandDown(): string | null {
  return edgeCacheStoodDown;
}

/** Tests only: a fresh isolate. */
export function resetEdgeCacheForTests(): void {
  edgeCacheStoodDown = null;
}

function standDownEdgeCache(error: unknown): void {
  if (edgeCacheStoodDown) return;
  edgeCacheStoodDown = error instanceof Error ? error.message : String(error);
}

/**
 * A cache that cannot be read costs one render, never the page.
 *
 * SEEN LIVE 2026-09-08 12:16 IST: every anonymous read of `/`, `/pricing`,
 * `/demo` and `/security` answered HTTP 500 `{"unhandled":true}` from the
 * platform layer OUTSIDE this Worker, with none of our headers on it, while
 * the same routes answered 200 the moment the lookup was bypassed (a
 * `Cache-Control: no-cache` header, or a session cookie) and `/film`, which
 * is not on the cacheable list, never failed. `caches.default` exists on the
 * hosting runtime, so `edgeCache()` returned a store, and the lookup sat
 * before the handler's try block: whatever `match` threw there had nowhere
 * to land and took the public landing page down with it. workerd, where
 * P-135 was proved, does not throw here; the runtime that actually serves
 * this does. F-197's shape again: the platform documents a hook and the
 * wrapper you are inside answers for it differently.
 *
 * So the lookup and the hit's re-wrap both sit inside one catch, a refused
 * read is reported with the same surface discipline as a refused write, and
 * the request falls through to a render exactly as a miss would.
 */
export async function answerFromEdgeCache(
  store: EdgeCache,
  request: Request,
  pathname: string,
  report: (error: unknown, ctx: ErrorContext) => unknown = captureError,
): Promise<Response | null> {
  if (edgeCacheStoodDown) return null;
  const servedAt = performance.now();
  try {
    const hit = await store.match(request);
    if (!hit) return null;
    return withBuildCanary(
      withWorkerTotalTiming(withCacheMarker(hit, "HIT"), performance.now() - servedAt),
    );
  } catch (error) {
    // Reported once, then the store stands down for the isolate (see above).
    if (!edgeCacheStoodDown) {
      report(error, { surface: "edge-cache-match", request_path: pathname });
    }
    standDownEdgeCache(error);
    return null;
  }
}

/**
 * The write, with the same rule. `Promise.resolve().then(...)` rather than a
 * bare `.catch` on the call, because a store that throws synchronously from
 * `put` would otherwise escape into the handler's catch and turn the page
 * the visitor was about to receive into a branded 500.
 */
export function storeInEdgeCache(
  store: EdgeCache,
  request: Request,
  response: Response,
  pathname: string,
  report: (error: unknown, ctx: ErrorContext) => unknown = captureError,
): Promise<void> {
  if (edgeCacheStoodDown) return Promise.resolve();
  return Promise.resolve()
    .then(() => store.put(request, response))
    .catch((error: unknown) => {
      if (!edgeCacheStoodDown) {
        report(error, { surface: "edge-cache-put", request_path: pathname });
      }
      standDownEdgeCache(error);
    });
}

/**
 * These three take a header reader rather than a Request or a Response, and
 * that is deliberate rather than stylistic.
 *
 * `test/setup.ts` preloads happy-dom's globals, and happy-dom implements the
 * Fetch spec's forbidden-header rules: `new Request(url, {headers: {Cookie}})`
 * silently drops the cookie, and `new Response(body, {headers: {"Set-Cookie"}})`
 * silently drops that. Under `bun run` both survive, and under workerd -- the
 * runtime that actually serves this -- both survive. So a test that built a
 * Request to prove "a signed-in reader is never served a cached page" would
 * pass against a request carrying no cookie at all, and would go on passing if
 * the rule were deleted. It would assert happy-dom's stripping, not ours.
 *
 * Taking the reader instead makes the predicate a pure function of the values
 * it decides on, so the test states the rule and the environment cannot quietly
 * answer for it. Same family as F-192: a check that cannot see what production
 * sees is not a check.
 */
type HeaderReader = { get: (name: string) => string | null };

/** A session in any form we mint or accept. Kept in one place so a reader can
 * see the whole definition of "anonymous" at once rather than assembling it
 * from three call sites. */
export function carriesASession(headers: HeaderReader): boolean {
  if (headers.get("Authorization")) return true;
  const cookie = headers.get("Cookie");
  if (!cookie) return false;
  return cookie.includes("-auth-token") || cookie.includes("sb-");
}

/**
 * Whether this request may be answered from, and stored in, the Worker's own
 * cache. `no-cache` on the request is honoured: someone forcing a reload gets
 * a real render, which is also what makes this debuggable from outside.
 */
export function mayUseEdgeCache(method: string, pathname: string, headers: HeaderReader): boolean {
  if (method !== "GET") return false;
  if (!CACHEABLE_MARKETING_ROUTES.has(pathname)) return false;
  if (carriesASession(headers)) return false;
  return !(headers.get("Cache-Control") ?? "").includes("no-cache");
}

/**
 * What may be stored. A redirect, an error or anything carrying a Set-Cookie
 * is never held: the first two would pin a wrong page for five minutes, and
 * the third would hand the next visitor a cookie minted for someone else.
 */
export function mayStoreInEdgeCache(status: number, headers: HeaderReader): boolean {
  if (status !== 200) return false;
  return headers.get("Set-Cookie") === null;
}

/**
 * Names where the bytes came from. Worth a header because without it a fast
 * response and a cached one are indistinguishable from outside, which is the
 * position this packet just spent a day getting out of.
 *
 * Three states, not two, and the third is the point. MISS means the cache was
 * consulted and had nothing; BYPASS means it was never consulted, because the
 * request carried a session or was not a cacheable route. Collapsing those
 * into one label would report a lookup that never happened -- a signed-in
 * reader would read as "we tried and missed", and a rule that stopped
 * bypassing sessions would still say MISS while silently caching them. The
 * distinction is the same one entry-load draws: only report what actually
 * happened to this request.
 */
/**
 * Strips the render's own timing from the copy that goes into the cache.
 *
 * MEASURED 2026-09-04, and it caught me: with the cache working, hits came
 * back carrying `landing-data;dur=2` from the render that filled the cache.
 * A hit does no data fetch at all, so that line reported a cost the request
 * never paid -- the exact defect entry-load exists to prevent, reintroduced
 * one layer down. The unit test missed it because it asserted against a
 * synthetic Response that had no phases on it, so it proved the stored copy
 * carried no Server-Timing only because nothing had put one there. Same trap
 * as the happy-dom one: a check that cannot see what production sees.
 *
 * A hit keeps its own `worker-total` and nothing else, because that is the
 * only number it actually spent.
 */
export function withoutRenderTiming(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("Server-Timing");
  headers.delete("X-Supaprod-Timing");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withCacheMarker(response: Response, state: "HIT" | "MISS" | "BYPASS"): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Supaprod-Cache", state);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * P-58b: the one Server-Timing phase that carries no framework-context risk
 * at all -- wall clock around the whole SSR handler call, measured at the
 * Worker's own boundary rather than from inside a route `loader`. Appended,
 * never set, because a route's own `loader` (see `lib/server-timing.server.ts`) may
 * already have written phase entries onto this same response; overwriting
 * would silently drop them.
 *
 * A1's live reads of "/" showed neither `Server-Timing` nor `worker-total`
 * at all, three times, well after the publishes that should carry them --
 * ambiguous from outside between "the served build predates this code" and
 * "something between the Worker and the browser strips the header". Both
 * questions get a second, independent answer here: `X-Supaprod-Timing`
 * carries the identical value under a header name nothing upstream has any
 * standing reason to touch, and `X-Supaprod-Build` (server.ts's fetch
 * handler) names the running deploy so a reader can confirm which build
 * actually answered before reasoning about its numbers at all.
 */
/**
 * P-135: the phase that was structurally invisible. `worker-total` wraps
 * `handler.fetch` and therefore starts *after* the dynamic import that loads
 * the SSR entry -- so the cold instantiation, measured live at 2.6s, reported
 * itself as 471ms and every reading of that header understated a cold request
 * by an order of magnitude. The span is not slow because it is unmeasured,
 * but it stayed unexplained because it was: three sessions attributed the
 * cold seconds to render, to bundle size and to the network in turn, and the
 * header agreed with all three because it excluded the only span that moved.
 *
 * Only the request that actually performed the import reports the cost. A
 * warm request inherits an already-resolved promise and pays nothing; having
 * it repeat the last cold number would turn one real cost into a fleet-wide
 * fiction, which is the same class of error as the timer this fixes.
 */
export function withEntryLoadTiming(response: Response, ms: number | null): Response {
  if (ms === null) return response;
  const headers = new Headers(response.headers);
  const prior = headers.get("Server-Timing");
  const entry = `entry-load;dur=${Math.round(ms)}`;
  headers.set("Server-Timing", prior ? `${prior}, ${entry}` : entry);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withWorkerTotalTiming(response: Response, ms: number): Response {
  const headers = new Headers(response.headers);
  const prior = headers.get("Server-Timing");
  const entry = `worker-total;dur=${Math.round(ms)}`;
  const next = prior ? `${prior}, ${entry}` : entry;
  headers.set("Server-Timing", next);
  headers.set("X-Supaprod-Timing", next);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Names the running deploy on every response, so a live read can confirm
 * which build actually answered before reasoning about anything else it
 * says. Same source `/health` already reports (`CF_VERSION_METADATA_ID`),
 * carried here as a header rather than a body field so it reaches every
 * response, not only the one route that returns JSON.
 */
export function withBuildCanary(response: Response): Response {
  const build = process.env.CF_VERSION_METADATA_ID?.trim();
  if (!build) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Supaprod-Build", build);
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
    //
    // frame-src https: (2026-09-08). The run screen frames the deployment a
    // run shipped (AppFrame in the artifact pane, P-22), and the shipped run's
    // production URL drew a blank white rectangle: the host allowed it
    // (deployments.embeddable read true) and THIS policy refused it, because
    // frame-src named only Stripe. The pane frames only URLs the record holds
    // for the workspace's own deployments, whose hosts are whatever the
    // person's provider chose (deno.net today, anything tomorrow), so the
    // directive is the scheme, not a host list. frame-ancestors 'none' still
    // keeps supaprod.ai itself out of anyone's frame; script-src and
    // connect-src are unchanged.
    const csp = `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; default-src 'self'`;
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

    // P-135: a hit answers before the SSR entry is even imported, so a cached
    // request pays neither entry-load nor landing-data. The stored copy is
    // taken BEFORE the timing wrappers, so a hit can never replay the
    // render's Server-Timing as though it were its own -- the same rule that
    // makes entry-load report only on the request that actually paid it.
    const cacheEligible = mayUseEdgeCache(request.method, url.pathname, request.headers);
    const cacheStore = cacheEligible ? edgeCache() : null;
    if (cacheStore) {
      const served = await answerFromEdgeCache(cacheStore, request, url.pathname);
      if (served) return served;
    }

    try {
      // P-135: `entryWasCold` is read before the await, because the await
      // itself is what populates the promise -- reading it after would call
      // every request warm and measure nothing.
      const entryWasCold = serverEntryPromise === undefined;
      const entryStarted = performance.now();
      const handler = await getServerEntry();
      const entryLoadMs = entryWasCold ? performance.now() - entryStarted : null;
      const fetchStarted = performance.now();
      const response = await handler.fetch(request, env, ctx);
      const fetchMs = performance.now() - fetchStarted;
      // Apply security headers (CSP, X-Frame-Options, etc.) to all responses
      // except well-known machine-readable endpoints which need CORS wildcard
      const securedResponse = withSecurityHeaders(
        await normalizeCatastrophicSsrResponse(response, request, ctx),
      );
      // Cache headers go on LAST so the marketing Cache-Control is not
      // overwritten by anything upstream, and only ever on a 200 for a route
      // in the allow-list. worker-total goes on last of all, appended rather
      // than set, so it never drops a route's own Server-Timing phases. The
      // build canary rides every response, including the ones the earlier
      // wrappers stand down on.
      const storable = withMarketingCacheHeaders(
        withAgentDiscoveryLink(securedResponse),
        url.pathname,
      );
      if (cacheStore && mayStoreInEdgeCache(storable.status, storable.headers)) {
        // Clone before returning: the body is a stream and the copy has to be
        // taken while it is still unread. The write is handed to waitUntil so
        // a client that disconnects mid-response does not cancel it.
        const stored = withoutRenderTiming(storable.clone());
        const waitUntil = (ctx as WorkersCtx | null | undefined)?.waitUntil;
        // A failed write must not fail the response -- the visitor already has
        // their page -- but it must not vanish either. The first version of
        // this swallowed the rejection, and the cache then missed on every
        // request with nothing anywhere saying why; the reason a write is
        // refused (a Set-Cookie, a status the API will not hold) is exactly
        // what a reader needs to see.
        const write = storeInEdgeCache(cacheStore, request, stored, url.pathname);
        if (typeof waitUntil === "function") {
          waitUntil.call(ctx, write);
        } else {
          // No waitUntil here. Workers cancels any pending I/O the moment the
          // response is returned, so a write left unawaited is not slow, it
          // simply never happens -- and it never happens silently, which is
          // how the first version of this missed on every request with no
          // error anywhere. Awaiting costs a few ms on a miss and is the only
          // thing that makes the next request a hit.
          await write;
        }
      }
      return withBuildCanary(
        withWorkerTotalTiming(
          withEntryLoadTiming(
            // BYPASS when the store was never consulted, which includes a
            // store that has stood down: MISS would report a lookup that did
            // not happen, the exact claim the three-state marker exists to
            // refuse.
            withCacheMarker(storable, cacheStore ? "MISS" : "BYPASS"),
            entryLoadMs,
          ),
          fetchMs,
        ),
      );
    } catch (error) {
      console.error(error);
      persistServerError(error, request, ctx, "worker");
      // Apply security headers to error response as well
      return withSecurityHeaders(brandedErrorResponse());
    }
  },
};
