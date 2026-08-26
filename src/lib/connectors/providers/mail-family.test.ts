/**
 * "Test it" tells the truth about a good mail connection (F-81, 2026-08-26).
 *
 * WHY THIS EXISTS. Gmail, Outlook Mail and Microsoft Outlook were all
 * `stubAdapter`, whose validate returns `{ok: false, detail: "adapter not
 * implemented"}`. `verifyConnection` is what the "Test it" control calls, so a
 * person who had completed a perfectly good OAuth round trip was told their
 * connection had failed.
 *
 * Gmail was the sharpest case of the three: `pull-ingestors.server.ts:48` wires
 * `{ provider: "gmail", ingest: ingestGmailSignals }`, so the grant was being used
 * successfully for ingestion the whole time and only the control that reports on
 * it was lying.
 *
 * These run against a stubbed `fetch`, so they pin what a unit test can own: the
 * credential is addressed the way each vendor requires, and **a refusal is
 * recognised as a refusal** — answering "healthy" to a dead token is the
 * expensive direction for a verification control.
 *
 * The last block is the durable one: **anything wired to ingest must not be a
 * stub.** That is the general rule F-81 broke, and it is cheap to keep.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { gmailAdapter, microsoftMailAdapter, microsoftOutlookAdapter } from "./mail-family.server";
import { CONNECTOR_ADAPTERS } from "./index.server";
import type { ResolvedAuth } from "../resolve.server";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Call = { url: string; init?: RequestInit };

function stubFetch(reply: { status?: number; body?: unknown }): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const status = reply.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => reply.body ?? {},
    };
  }) as unknown as typeof fetch;
  return calls;
}

const vaulted: ResolvedAuth = { kind: "token", token: "tok-live" } as ResolvedAuth;
const fromEnv: ResolvedAuth = { kind: "env", token: "shared-admin-key" } as ResolvedAuth;
const viaGateway: ResolvedAuth = { kind: "gateway" } as ResolvedAuth;

const authHeader = (c: Call) =>
  (c.init?.headers as Record<string, string> | undefined)?.["Authorization"];

describe("gmail", () => {
  it("probes /profile with a bearer and reports the account", async () => {
    const calls = stubFetch({ body: { emailAddress: "founder@example.com" } });
    const out = await gmailAdapter.validate(vaulted);
    expect(out.ok).toBe(true);
    expect(out.accountEmail).toBe("founder@example.com");
    // The same host and bearer shape gmail-ingest.server.ts already uses.
    expect(calls[0]?.url).toBe("https://www.googleapis.com/gmail/v1/users/me/profile");
    expect(authHeader(calls[0]!)).toBe("Bearer tok-live");
  });

  it("recognises a refusal as a refusal, which is the failure that matters", async () => {
    stubFetch({ status: 401 });
    const out = await gmailAdapter.validate(vaulted);
    expect(out.ok).toBe(false);
    expect(out.detail).toContain("401");
  });

  it("says a shared admin key carries no account, rather than claiming a broken connection", async () => {
    const calls = stubFetch({ body: {} });
    const out = await gmailAdapter.validate(fromEnv);
    expect(out.ok).toBe(false);
    expect(out.detail).toContain("shared admin key");
    // And it does not spend a request finding that out.
    expect(calls.length).toBe(0);
  });

  it("calls a gateway credential unsupported rather than bad", async () => {
    const out = await gmailAdapter.validate(viaGateway);
    expect(out.ok).toBe(false);
    expect(out.detail).toContain("unsupported auth kind");
  });
});

describe("the two Microsoft entries, which are not duplicates", () => {
  it("Outlook Mail reports displayName and mail from Graph /me", async () => {
    const calls = stubFetch({ body: { displayName: "R G", mail: "rg@example.com" } });
    const out = await microsoftMailAdapter.validate(vaulted);
    expect(out.ok).toBe(true);
    expect(out.accountLabel).toBe("R G");
    expect(out.accountEmail).toBe("rg@example.com");
    expect(calls[0]?.url).toBe("https://graph.microsoft.com/v1.0/me");
    expect(authHeader(calls[0]!)).toBe("Bearer tok-live");
  });

  it("falls back to the UPN, because a work account often carries no mail", async () => {
    stubFetch({ body: { displayName: "R G", mail: null, userPrincipalName: "rg@corp.local" } });
    const out = await microsoftMailAdapter.validate(vaulted);
    expect(out.accountEmail).toBe("rg@corp.local");
  });

  it("the calendar entry uses the same identity probe and its own label", async () => {
    stubFetch({ status: 403 });
    const out = await microsoftOutlookAdapter.validate(vaulted);
    expect(out.ok).toBe(false);
    // microsoft_outlook is the CALENDAR connector labelled "Microsoft Outlook";
    // microsoft_mail is the MAIL one labelled "Outlook Mail". The labels invert,
    // so a wrong one here is genuinely confusing in a list of connections.
    expect(out.detail).toContain("Microsoft Outlook");
  });
});

describe("anything wired to ingest must not be a stub", () => {
  it("every provider in pull-ingestors has a real adapter", async () => {
    // THE GUARD THAT WOULD HAVE CAUGHT F-81. Gmail ingested happily for as long
    // as it existed while its adapter answered "adapter not implemented", because
    // nothing tied the two lists together. This ties them.
    //
    // The probe is `gateway`, which every adapter settles on without any I/O: the
    // stub answers "adapter not implemented", and a real adapter answers with its
    // own provider-named "unsupported auth kind for <p>". So the two are
    // distinguishable offline, and no network is touched.
    const src = readFileSync(
      fileURLToPath(new URL("./pull-ingestors.server.ts", import.meta.url)),
      "utf8",
    );
    const wired = [...new Set([...src.matchAll(/provider:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]))];
    expect(wired.length).toBeGreaterThan(0);

    const stubbed: string[] = [];
    for (const p of wired) {
      const adapter = CONNECTOR_ADAPTERS[p as keyof typeof CONNECTOR_ADAPTERS];
      expect(adapter, `${p} is wired to ingest but has no adapter at all`).toBeDefined();
      const out = await adapter.validate(viaGateway);
      if (out.detail === "adapter not implemented") stubbed.push(p);
    }
    // Named rather than counted, so the failure says which provider to fix.
    expect(stubbed, `wired to ingest but still stubbed: ${stubbed.join(", ")}`).toEqual([]);
  });

  it("the probe genuinely distinguishes a stub, so the guard above is not vacuous", async () => {
    // Guarding the guard. If `stubAdapter` ever stopped answering this way, the
    // loop above would silently pass for every provider — which is exactly the
    // shape of the 22 tests F-76 deleted.
    const stub = CONNECTOR_ADAPTERS.firecrawl; // still a stub, deliberately
    expect((await stub.validate(viaGateway)).detail).toBe("adapter not implemented");
    expect((await gmailAdapter.validate(viaGateway)).detail).toContain("unsupported auth kind");
  });
});
