import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { checkFrameable, frameAncestorsOf, frameVerdict } from "./can-it-be-framed";

/**
 * The shipped run's production URL drew a blank white frame (Lane 2, 09-08).
 * These hold the reading of the two headers that decide it, and the shape of
 * the one fetch.
 */
const ok = (xfo: string | null, csp: string | null) => frameVerdict({ status: 200, xfo, csp });

describe("frame-ancestors wins when present", () => {
  it("* allows", () => {
    expect(ok(null, "default-src 'self'; frame-ancestors *").embeddable).toBe(true);
  });
  it("'self' refuses us, because we are never the host's own origin", () => {
    const v = ok(null, "frame-ancestors 'self'");
    expect(v.embeddable).toBe(false);
    expect(v.reason).toContain("frame-ancestors 'self'");
  });
  it("'none' refuses", () => {
    expect(ok(null, "frame-ancestors 'none'").embeddable).toBe(false);
  });
  it("our origin, exact or by wildcard host, allows", () => {
    expect(ok(null, "frame-ancestors https://supaprod.ai").embeddable).toBe(true);
    expect(ok(null, "frame-ancestors https://*.supaprod.ai 'self'").embeddable).toBe(false);
    expect(
      frameVerdict(
        { status: 200, xfo: null, csp: "frame-ancestors https://*.supaprod.ai" },
        "https://app.supaprod.ai",
      ).embeddable,
    ).toBe(true);
    expect(ok(null, "frame-ancestors https:").embeddable).toBe(true);
  });
  it("another origin refuses", () => {
    expect(ok(null, "frame-ancestors https://lovable.dev").embeddable).toBe(false);
  });
  it("overrides an X-Frame-Options that would have allowed", () => {
    expect(ok("ALLOW-FROM https://supaprod.ai", "frame-ancestors 'none'").embeddable).toBe(false);
  });
  it("is read out of a longer policy, case-insensitively", () => {
    expect(
      frameAncestorsOf("img-src *; Frame-Ancestors 'self' https://a.b; script-src 'self'"),
    ).toEqual(["'self'", "https://a.b"]);
    expect(frameAncestorsOf("default-src 'self'")).toBeNull();
    expect(frameAncestorsOf(null)).toBeNull();
  });
});

describe("X-Frame-Options when there is no frame-ancestors", () => {
  it("DENY and SAMEORIGIN refuse, whatever the case", () => {
    expect(ok("DENY", null).embeddable).toBe(false);
    expect(ok("sameorigin", null).embeddable).toBe(false);
    expect(ok("SAMEORIGIN", null).reason).toContain("X-Frame-Options: SAMEORIGIN");
  });
  it("ALLOW-FROM allows only its own uri", () => {
    expect(ok("ALLOW-FROM https://supaprod.ai", null).embeddable).toBe(true);
    expect(ok("ALLOW-FROM https://example.com", null).embeddable).toBe(false);
  });
  it("an unknown value is ignored, as browsers ignore it", () => {
    expect(ok("ALLOWALL", null).embeddable).toBe(true);
  });
});

describe("no policy, and no answer", () => {
  it("no header at all draws", () => {
    const v = ok(null, null);
    expect(v.embeddable).toBe(true);
    expect(v.reason).toBe("the host sets no framing policy");
  });
  it("a non-2xx answer is a refusal, with the status", () => {
    expect(frameVerdict({ status: 404, xfo: null, csp: null })).toEqual({
      embeddable: false,
      reason: "the host answered 404",
    });
    expect(frameVerdict({ status: 503, xfo: null, csp: null }).embeddable).toBe(false);
  });
});

describe("the one fetch", () => {
  const answer = (status: number, headers: Record<string, string>) =>
    new Response(null, { status, headers });

  it("asks with HEAD and reads the headers", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      calls.push(init?.method ?? "GET");
      return answer(200, { "x-frame-options": "DENY" });
    }) as typeof fetch;
    const v = await checkFrameable("https://example.test/", undefined, fetchImpl);
    expect(calls).toEqual(["HEAD"]);
    expect(v.embeddable).toBe(false);
  });

  it("falls back to GET when the host will not answer a HEAD", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      calls.push(init?.method ?? "GET");
      return init?.method === "HEAD" ? answer(405, {}) : answer(200, {});
    }) as typeof fetch;
    const v = await checkFrameable("https://example.test/", undefined, fetchImpl);
    expect(calls).toEqual(["HEAD", "GET"]);
    expect(v.embeddable).toBe(true);
  });

  it("a host that cannot be reached is a refusal with the reason, never a throw", async () => {
    const fetchImpl = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const v = await checkFrameable("https://example.test/", undefined, fetchImpl);
    expect(v.embeddable).toBe(false);
    expect(v.reason).toBe("the host could not be reached (ECONNREFUSED)");
  });

  it("every path that writes a live URL asks the host", () => {
    const dep = readFileSync("src/lib/deployments.functions.ts", "utf8");
    const tick = readFileSync("src/routes/api/public/hooks/ci-poll-tick.ts", "utf8");
    // promote and the person's retry
    expect(dep.match(/await stampEmbeddable\(/g)?.length).toBe(3);
    // the CI tick's preview
    expect(tick).toContain("await stampEmbeddable(");
  });
});
