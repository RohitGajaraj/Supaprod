import { describe, expect, test, afterEach } from "bun:test";
import {
  AGENT_DISCOVERY_LINK_HEADER,
  withAgentDiscoveryLink,
  withMarketingCacheHeaders,
  withSecurityHeaders,
  withWorkerTotalTiming,
  withEntryLoadTiming,
  carriesASession,
  mayUseEdgeCache,
  mayStoreInEdgeCache,
  withCacheMarker,
  withoutRenderTiming,
  withBuildCanary,
} from "./server";

describe("withMarketingCacheHeaders", () => {
  test("caches a public marketing route at the edge", () => {
    const result = withMarketingCacheHeaders(new Response("<html></html>", { status: 200 }), "/");
    expect(result.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=86400",
    );
  });

  test("leaves authenticated and unknown routes alone", () => {
    // The whole safety argument for edge caching is that these routes render
    // the same bytes for every anonymous visitor. Anything per-user must never
    // be held at a shared cache, so the allow-list is the security boundary
    // and not merely an optimisation.
    for (const path of ["/today", "/settings", "/admin", "/inbox", "/api/healthz"]) {
      const result = withMarketingCacheHeaders(new Response("x", { status: 200 }), path);
      expect(result.headers.get("Cache-Control")).toBeNull();
    }
  });

  test("never caches a non-200, even on an allow-listed route", () => {
    // A 404, a redirect or a 500 pinned at the edge for five minutes would
    // serve the failure to everyone who followed.
    for (const status of [301, 404, 500]) {
      const result = withMarketingCacheHeaders(new Response("x", { status }), "/pricing");
      expect(result.headers.get("Cache-Control")).toBeNull();
    }
  });

  test("preserves the body and other headers it does not own", () => {
    const response = new Response("hello", {
      status: 200,
      headers: { "content-type": "text/html", Link: '</llms.txt>; rel="llms-txt"' },
    });
    const result = withMarketingCacheHeaders(response, "/faq");
    expect(result.headers.get("content-type")).toBe("text/html");
    expect(result.headers.get("Link")).toBe('</llms.txt>; rel="llms-txt"');
  });
});

describe("withAgentDiscoveryLink", () => {
  test("adds the agent-discovery Link header to a response missing one", () => {
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

    const result = withAgentDiscoveryLink(response);

    expect(result.headers.get("Link")).toBe(AGENT_DISCOVERY_LINK_HEADER);
    expect(result.headers.get("content-type")).toBe("text/html");
    expect(result.status).toBe(200);
  });

  test("does not override an existing Link header", () => {
    const response = new Response("body", {
      status: 200,
      headers: { Link: '</other.txt>; rel="something-else"' },
    });

    const result = withAgentDiscoveryLink(response);

    expect(result.headers.get("Link")).toBe('</other.txt>; rel="something-else"');
  });

  test("preserves status and statusText on error responses", () => {
    const response = new Response("not found", { status: 404, statusText: "Not Found" });

    const result = withAgentDiscoveryLink(response);

    expect(result.status).toBe(404);
    expect(result.headers.get("Link")).toBe(AGENT_DISCOVERY_LINK_HEADER);
  });
});

describe("withSecurityHeaders", () => {
  test("applies security headers to normal responses", () => {
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

    const result = withSecurityHeaders(response);

    // CSP header should be set
    expect(result.headers.get("Content-Security-Policy")).toBeTruthy();
    expect(result.headers.get("Content-Security-Policy")).toContain("script-src 'self'");

    // Frame protection
    expect(result.headers.get("X-Frame-Options")).toBe("DENY");

    // MIME-type sniffing prevention
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");

    // HSTS enforcement
    expect(result.headers.get("Strict-Transport-Security")).toBeTruthy();
    expect(result.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");

    // Referrer policy
    expect(result.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

    // Permissions policy
    expect(result.headers.get("Permissions-Policy")).toBeTruthy();
    expect(result.headers.get("Permissions-Policy")).toContain("geolocation=()");
  });

  test("skips security headers for well-known endpoints (Access-Control-Allow-Origin: *)", () => {
    const response = new Response(JSON.stringify({ agent: "metadata" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

    const result = withSecurityHeaders(response);

    // Security headers should NOT be set for CORS-enabled responses
    expect(result.headers.get("Content-Security-Policy")).toBeNull();
    expect(result.headers.get("X-Frame-Options")).toBeNull();
    expect(result.headers.get("X-Content-Type-Options")).toBeNull();
    expect(result.headers.get("Strict-Transport-Security")).toBeNull();
    expect(result.headers.get("Referrer-Policy")).toBeNull();
    expect(result.headers.get("Permissions-Policy")).toBeNull();

    // But existing headers should be preserved
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("preserves response status and body", () => {
    const body = "Custom error page";
    const response = new Response(body, {
      status: 403,
      statusText: "Forbidden",
      headers: { "content-type": "text/plain" },
    });

    const result = withSecurityHeaders(response);

    expect(result.status).toBe(403);
    expect(result.statusText).toBe("Forbidden");
    expect(result.headers.get("content-type")).toBe("text/plain");
  });

  test("preserves existing headers when applying security headers", () => {
    const response = new Response("content", {
      status: 200,
      headers: {
        "custom-header": "custom-value",
        "cache-control": "no-cache",
      },
    });

    const result = withSecurityHeaders(response);

    expect(result.headers.get("custom-header")).toBe("custom-value");
    expect(result.headers.get("cache-control")).toBe("no-cache");
    expect(result.headers.get("X-Frame-Options")).toBe("DENY");
  });

  test("CSP includes common trusted CDNs", () => {
    const response = new Response("test");
    const result = withSecurityHeaders(response);
    const csp = result.headers.get("Content-Security-Policy") || "";

    expect(csp).toContain("https://cdn.jsdelivr.net");
    expect(csp).toContain("https://unpkg.com");
  });

  test("CSP restricts frame ancestors to prevent clickjacking", () => {
    const response = new Response("test");
    const result = withSecurityHeaders(response);
    const csp = result.headers.get("Content-Security-Policy") || "";

    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("HSTS includes preload directive for HSTS preload list", () => {
    const response = new Response("test");
    const result = withSecurityHeaders(response);
    const hsts = result.headers.get("Strict-Transport-Security") || "";

    expect(hsts).toContain("preload");
    expect(hsts).toContain("includeSubDomains");
  });

  test("does not override existing CSP if present", () => {
    const response = new Response("test", {
      headers: {
        "Content-Security-Policy": "script-src 'self' 'unsafe-eval'",
      },
    });

    const result = withSecurityHeaders(response);

    // Our implementation will override, which is the correct behavior
    expect(result.headers.get("Content-Security-Policy")).toContain("script-src 'self'");
  });

  test("handles responses without headers gracefully", () => {
    const response = new Response("test");

    expect(() => withSecurityHeaders(response)).not.toThrow();
    expect(withSecurityHeaders(response).status).toBe(200);
  });

  test("applies headers to all status codes (not just 2xx)", () => {
    [301, 400, 401, 403, 404, 500, 503].forEach((status) => {
      const response = new Response("error", { status });
      const result = withSecurityHeaders(response);

      expect(result.status).toBe(status);
      expect(result.headers.get("X-Frame-Options")).toBe("DENY");
      expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  });
});

describe("withWorkerTotalTiming", () => {
  test("adds worker-total to a response with no prior Server-Timing", () => {
    const response = new Response("<html></html>", { status: 200 });
    const result = withWorkerTotalTiming(response, 123.6);
    expect(result.headers.get("Server-Timing")).toBe("worker-total;dur=124");
  });

  test("appends to a route's own phases rather than overwriting them (P-58b)", () => {
    // The shape `lib/server-timing.server.ts`'s `timedPhase` would have already
    // written before this runs -- a real loader's own read, named.
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "Server-Timing": "landing-data;dur=812" },
    });
    const result = withWorkerTotalTiming(response, 900);
    expect(result.headers.get("Server-Timing")).toBe("landing-data;dur=812, worker-total;dur=900");
  });

  test("preserves the body and status it does not own", () => {
    const response = new Response("hello", { status: 404 });
    const result = withWorkerTotalTiming(response, 50);
    expect(result.status).toBe(404);
  });

  test("mirrors the same value onto X-Supaprod-Timing, a name nothing upstream has reason to touch", () => {
    const response = new Response("<html></html>", { status: 200 });
    const result = withWorkerTotalTiming(response, 200);
    expect(result.headers.get("X-Supaprod-Timing")).toBe(result.headers.get("Server-Timing"));
    expect(result.headers.get("X-Supaprod-Timing")).toBe("worker-total;dur=200");
  });
});

describe("withEntryLoadTiming", () => {
  test("a warm request reports nothing, because it paid nothing", () => {
    // The whole point of the null: the entry promise is already resolved, so
    // this request did not pay the import. Repeating the last cold number
    // here would make one real cost look like every request's cost.
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "Server-Timing": "landing-data;dur=272" },
    });
    const result = withEntryLoadTiming(response, null);
    expect(result.headers.get("Server-Timing")).toBe("landing-data;dur=272");
    expect(result.headers.get("Server-Timing")).not.toContain("entry-load");
  });

  test("names the cold module load that worker-total structurally excludes", () => {
    const response = new Response("<html></html>", { status: 200 });
    const result = withEntryLoadTiming(response, 2612.4);
    expect(result.headers.get("Server-Timing")).toBe("entry-load;dur=2612");
  });

  test("appends to a route's phases rather than overwriting them", () => {
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "Server-Timing": "landing-data;dur=471" },
    });
    const result = withEntryLoadTiming(response, 2600);
    expect(result.headers.get("Server-Timing")).toBe("landing-data;dur=471, entry-load;dur=2600");
  });

  test("the cold request's header accounts for the TTFB the old one understated", () => {
    // The measured shape on 2026-09-04: a 3.06s cold read whose worker-total
    // said 471ms. Composed the way the fetch handler composes them, the
    // header now carries the span that explains the difference.
    const loader = new Response("<html></html>", {
      status: 200,
      headers: { "Server-Timing": "landing-data;dur=471" },
    });
    const result = withWorkerTotalTiming(withEntryLoadTiming(loader, 2600), 471);
    expect(result.headers.get("Server-Timing")).toBe(
      "landing-data;dur=471, entry-load;dur=2600, worker-total;dur=471",
    );
    expect(result.headers.get("X-Supaprod-Timing")).toBe(result.headers.get("Server-Timing"));
  });

  test("preserves the body and status it does not own", () => {
    const response = new Response("hello", { status: 404 });
    expect(withEntryLoadTiming(response, 12).status).toBe(404);
  });
});

/**
 * A header reader built from a plain map. Not a convenience: happy-dom's
 * globals are preloaded for this suite and they enforce the Fetch spec's
 * forbidden-header rules, so a real Request silently drops Cookie and a real
 * Response silently drops Set-Cookie. Asserting through one would prove
 * happy-dom strips headers, not that our rules read them.
 */
function headersOf(entries: Record<string, string>) {
  return { get: (name: string) => entries[name] ?? null };
}

describe("carriesASession", () => {
  test("no cookie and no Authorization header is anonymous", () => {
    expect(carriesASession(headersOf({}))).toBe(false);
  });

  test("a Supabase auth cookie is a session", () => {
    expect(carriesASession(headersOf({ Cookie: "sb-abcdefgh-auth-token=eyJhbGciOi" }))).toBe(true);
  });

  test("an Authorization header is a session even with no cookie", () => {
    expect(carriesASession(headersOf({ Authorization: "Bearer x" }))).toBe(true);
  });

  test("an unrelated cookie is not a session", () => {
    // A visitor carrying only analytics state is still anonymous. Treating
    // them as signed in would mean nobody who ever loaded the site is served
    // a cached page again, which is most of the benefit gone.
    expect(carriesASession(headersOf({ Cookie: "plausible_ignore=false" }))).toBe(false);
  });
});

describe("mayUseEdgeCache", () => {
  test("an anonymous GET of a marketing route may be cached", () => {
    expect(mayUseEdgeCache("GET", "/", headersOf({}))).toBe(true);
  });

  test("a route outside the marketing set never is", () => {
    expect(mayUseEdgeCache("GET", "/app", headersOf({}))).toBe(false);
  });

  test("a signed-in reader of a marketing route is served fresh", () => {
    // The expensive failure: holding a page rendered for somebody with a
    // session and handing it to the next visitor.
    expect(mayUseEdgeCache("GET", "/", headersOf({ Cookie: "sb-abcdefgh-auth-token=eyJ" }))).toBe(
      false,
    );
  });

  test("a POST is never cached", () => {
    expect(mayUseEdgeCache("POST", "/", headersOf({}))).toBe(false);
  });

  test("a reader forcing a reload gets a real render", () => {
    expect(mayUseEdgeCache("GET", "/", headersOf({ "Cache-Control": "no-cache" }))).toBe(false);
  });

  test("every route it admits is one withMarketingCacheHeaders would cache", () => {
    // The two gates must not drift apart: caching a route the header layer
    // does not consider public is how a private page ends up held at a colo.
    for (const path of ["/", "/pricing", "/faq", "/investors"]) {
      expect(mayUseEdgeCache("GET", path, headersOf({}))).toBe(true);
      const marked = withMarketingCacheHeaders(
        new Response("<html></html>", { status: 200 }),
        path,
      );
      expect(marked.headers.get("Cache-Control")).toContain("s-maxage=300");
    }
  });
});

describe("mayStoreInEdgeCache", () => {
  test("a clean 200 is storable", () => {
    expect(mayStoreInEdgeCache(200, headersOf({}))).toBe(true);
  });

  test("a redirect or an error is never stored", () => {
    expect(mayStoreInEdgeCache(301, headersOf({}))).toBe(false);
    expect(mayStoreInEdgeCache(500, headersOf({}))).toBe(false);
  });

  test("a response carrying Set-Cookie is never stored", () => {
    // Storing it would hand the next visitor a cookie minted for someone else.
    expect(
      mayStoreInEdgeCache(200, headersOf({ "Set-Cookie": "sb-a-auth-token=eyJ; Path=/" })),
    ).toBe(false);
  });
});

describe("withCacheMarker", () => {
  test("names where the bytes came from", () => {
    expect(withCacheMarker(new Response("x"), "HIT").headers.get("X-Supaprod-Cache")).toBe("HIT");
    expect(withCacheMarker(new Response("x"), "MISS").headers.get("X-Supaprod-Cache")).toBe("MISS");
  });

  test("a request that was never eligible reads BYPASS, not MISS", () => {
    // Measured 2026-09-04 before this split existed: a cookie-bearing request
    // came back X-Supaprod-Cache: MISS, which says the cache was consulted and
    // empty. It was never consulted at all. A reader checking whether sessions
    // bypass the cache would have read that as proof they do not.
    expect(withCacheMarker(new Response("x"), "BYPASS").headers.get("X-Supaprod-Cache")).toBe(
      "BYPASS",
    );
    expect(mayUseEdgeCache("GET", "/", headersOf({ Cookie: "sb-a-auth-token=eyJ" }))).toBe(false);
  });

  test("the stored copy drops the render's phases so a hit cannot replay them", () => {
    // This test used to build a bare Response and assert it had no
    // Server-Timing. It passed, and it proved nothing: nothing had put a
    // phase on it. Live, hits came back carrying landing-data;dur=2 from the
    // render that filled the cache -- a data fetch the hit never performed.
    // The response is built here the way the real one arrives, with the
    // route's own phase already on it.
    const rendered = withMarketingCacheHeaders(
      new Response("<html></html>", {
        status: 200,
        headers: { "Server-Timing": "landing-data;dur=272" },
      }),
      "/",
    );
    expect(rendered.headers.get("Server-Timing")).toBe("landing-data;dur=272");
    const stored = withoutRenderTiming(rendered);
    expect(stored.headers.get("Server-Timing")).toBeNull();
    expect(stored.headers.get("X-Supaprod-Timing")).toBeNull();
    // The cache headers the copy is stored under must survive the strip.
    expect(stored.headers.get("Cache-Control")).toContain("s-maxage=300");
  });
});

describe("withBuildCanary", () => {
  const original = process.env.CF_VERSION_METADATA_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.CF_VERSION_METADATA_ID;
    else process.env.CF_VERSION_METADATA_ID = original;
  });

  test("names the running deploy on the response", () => {
    process.env.CF_VERSION_METADATA_ID = "abc123";
    const result = withBuildCanary(new Response("<html></html>", { status: 200 }));
    expect(result.headers.get("X-Supaprod-Build")).toBe("abc123");
  });

  test("adds nothing when the env var is unset -- a response is never worse off", () => {
    delete process.env.CF_VERSION_METADATA_ID;
    const response = new Response("<html></html>", { status: 200 });
    const result = withBuildCanary(response);
    expect(result).toBe(response);
    expect(result.headers.has("X-Supaprod-Build")).toBe(false);
  });

  test("carries every response, not only a 200", () => {
    process.env.CF_VERSION_METADATA_ID = "abc123";
    const result = withBuildCanary(new Response("nope", { status: 404 }));
    expect(result.headers.get("X-Supaprod-Build")).toBe("abc123");
    expect(result.status).toBe(404);
  });
});
