/**
 * The credential chain is reached, and the two transports are addressed correctly.
 *
 * WHY THIS FILE EXISTS, and it is the same reason as `workspace-automation.test.ts`.
 * Linear, Notion and Google Docs each had a complete, correct, well-tested
 * integration that authenticated with a shared admin env key and could not see
 * the per-user OAuth token their own connect flow had just minted. Every unit in
 * those files behaved correctly in isolation. Nothing asked whether the
 * credential chokepoint was reached at all, so the answer stayed no for months
 * while a real production connection sat unread and its owner was told to go and
 * connect the thing they had connected.
 *
 * So the first block below is a REACHABILITY test, not a behaviour test: it reads
 * the source of the three feature modules and asserts they resolve credentials
 * through the chokepoint rather than out of `process.env`. It is the test that
 * would have caught this on the day it was written, and it fails if anybody
 * reintroduces the shortcut.
 *
 * The second block pins the header contracts, because the two transports are not
 * interchangeable and getting one wrong produces an authentication failure that
 * reads exactly like a bad token.
 */
import { describe, expect, it, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { __testing, type GatewayEraProvider } from "./gateway-era.server";

const LIB = join(import.meta.dir, "..");

/** The three feature modules, and the env var each one used to read. */
const FEATURE_MODULES: Array<{ file: string; provider: GatewayEraProvider }> = [
  { file: "linear.functions.ts", provider: "linear" },
  { file: "notion.functions.ts", provider: "notion" },
  { file: "gdocs.functions.ts", provider: "google_docs" },
];

/** Comments describe history; only code can reintroduce the defect. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("the three gateway-era modules reach the credential chokepoint", () => {
  for (const { file, provider } of FEATURE_MODULES) {
    test(`${file} resolves auth through the chain rather than the environment`, () => {
      const code = stripComments(readFileSync(join(LIB, file), "utf8"));

      // THE DEFECT, stated as a property. Reading the provider's admin key here
      // is what made the per-user token unreadable, because a module that has a
      // credential in hand never asks the chain for one.
      const envKey = __testing.ENV_KEY[provider];
      expect(code).not.toContain(`process.env.${envKey}`);
      expect(code).not.toContain("process.env.LOVABLE_API_KEY");

      // And the gateway host must not be hard-coded past the resolver, or a
      // per-user token would be sent to a transport that cannot read it.
      expect(code).not.toContain("connector-gateway.lovable.dev");

      // The positive half: it must actually reach the resolver.
      expect(code).toContain("resolveProviderCall");
    });
  }

  it("covers every provider the resolver claims to serve", () => {
    // A provider added to the resolver and not to this list would be unguarded,
    // which is how the first three went unnoticed.
    const declared = Object.keys(__testing.DIRECT).sort();
    const guarded = FEATURE_MODULES.map((m) => m.provider).sort();
    expect(guarded).toEqual(declared);
  });
});

describe("the two transports are addressed the way each provider requires", () => {
  it("sends a Linear OAuth token as a bearer token", () => {
    expect(__testing.linearAuthHeader("lin_oauth_abc123")).toBe("Bearer lin_oauth_abc123");
  });

  it("sends a Linear personal API key raw, with no bearer prefix", () => {
    // Linear's own docs: an OAuth access token is `Bearer <token>`, a personal
    // API key is the value itself. Sending a personal key as a bearer token
    // fails authentication, so this is a correctness rule and not a style one.
    expect(__testing.linearAuthHeader("lin_api_deadbeef")).toBe("lin_api_deadbeef");
  });

  it("always sends the Notion version, because Notion rejects a request without one", () => {
    // The gateway used to inject this. Going direct makes it ours, and its
    // absence is a 400 on every call rather than a visible misconfiguration.
    const h = __testing.directHeaders("notion", "secret_x");
    expect(h["Notion-Version"]).toBe(__testing.NOTION_VERSION);
    expect(h["Notion-Version"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(h.Authorization).toBe("Bearer secret_x");
  });

  it("sends Google Docs a bearer token", () => {
    expect(__testing.directHeaders("google_docs", "ya29.tok").Authorization).toBe("Bearer ya29.tok");
  });

  it("points every direct transport at the provider and never at the gateway", () => {
    for (const [provider, url] of Object.entries(__testing.DIRECT)) {
      expect(url.startsWith("https://")).toBe(true);
      expect(url).not.toContain("connector-gateway");
      // A trailing slash would produce a double slash once a path is appended,
      // which some of these APIs answer with a 404 rather than a redirect.
      expect(url.endsWith("/")).toBe(false);
      expect(provider.length).toBeGreaterThan(0);
    }
  });

  it("keeps a gateway URL for every provider, because the admin path still runs", () => {
    // The env fallback is unchanged on purpose: it is what answers when nobody
    // has connected their own account, so removing it would break the only path
    // that worked before this change.
    for (const provider of Object.keys(__testing.DIRECT) as GatewayEraProvider[]) {
      expect(__testing.GATEWAY[provider]).toContain("connector-gateway.lovable.dev");
      expect(__testing.GATEWAY[provider]).not.toBe(__testing.DIRECT[provider]);
    }
  });

  it("declares a content type on every transport it builds", () => {
    for (const provider of Object.keys(__testing.DIRECT) as GatewayEraProvider[]) {
      expect(__testing.directHeaders(provider, "t")["Content-Type"]).toBe("application/json");
    }
  });
});
