/**
 * "Test it" tells the truth about a good connection.
 *
 * WHY THIS EXISTS. Linear, Notion and Google Docs were all `stubAdapter`, whose
 * validate returns `{ok: false, detail: "adapter not implemented"}`.
 * `verifyConnection` is what the "Test it" control calls, so a person who had just
 * completed a perfectly good OAuth round trip pressed Test it and was told their
 * connection had failed. Worse than no button: it reports a defect that does not
 * exist, at the moment somebody is deciding whether to trust the product with
 * their data.
 *
 * These run against a stubbed `fetch` rather than the real providers, so they pin
 * the two things a unit test can actually own: that the credential is addressed
 * the way each vendor requires, and that a refusal is recognised as a refusal. The
 * second is the one that matters, because the expensive failure mode for a
 * verification control is answering "healthy" to a dead token.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  linearAdapter,
  notionAdapter,
  googleDocsAdapter,
} from "./gateway-era-adapters.server";
import { CONNECTOR_ADAPTERS } from "./index.server";
import { figmaAdapter, figmaAuthHeader } from "./figma.server";
import { jiraAdapter } from "./jira.server";
import type { ResolvedAuth } from "../resolve.server";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Call = { url: string; init?: RequestInit };
/** Capture what was sent, and answer with whatever the case needs. */
function stubFetch(reply: { status?: number; body?: unknown }): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return {
      ok: (reply.status ?? 200) >= 200 && (reply.status ?? 200) < 300,
      status: reply.status ?? 200,
      json: async () => reply.body ?? {},
    } as unknown as Response;
  }) as typeof fetch;
  return calls;
}

const userToken = (token: string): ResolvedAuth => ({
  kind: "token",
  token,
  ownerUserId: "u1",
  connectionRowId: "c1",
});
const envToken = (token: string): ResolvedAuth => ({ kind: "env", token });

describe("the stubs are gone where a transport exists", () => {
  it("linear, notion and google_docs are no longer the stub", async () => {
    // THE DEFECT, asserted at the dispatch map rather than on the adapters, since
    // that map is what `getProviderAdapter` reads and a real adapter registered
    // nowhere would change nothing.
    for (const p of ["linear", "notion", "google_docs"] as const) {
      const result = await CONNECTOR_ADAPTERS[p].validate({ kind: "env", token: "" });
      expect(result.detail ?? "").not.toBe("adapter not implemented");
    }
  });

  it("figma and jira are real too, since both are reachable from Verify", async () => {
    // Both write a `connections` row through their oauth_native callback, so
    // `listConnections` returns them and the detail page's Verify button calls
    // `verifyConnection` on them. Reachable, and previously answering "adapter not
    // implemented" to a good connection.
    for (const p of ["figma", "jira"] as const) {
      const result = await CONNECTOR_ADAPTERS[p].validate({ kind: "env", token: "" });
      expect(result.detail ?? "").not.toBe("adapter not implemented");
    }
  });

  it("the six that remain still answer honestly rather than throwing", async () => {
    // What a stub must not do is throw: the control has to render an answer.
    for (const p of ["gmail", "google_calendar", "google_tasks", "microsoft_mail",
      "microsoft_outlook", "firecrawl"] as const) {
      const r = await CONNECTOR_ADAPTERS[p].validate({ kind: "env", token: "x" });
      expect(r.ok).toBe(false);
      expect(typeof r.detail).toBe("string");
    }
  });

  it("and those six are stubs because nothing can reach them, which is checked, not assumed", () => {
    /**
     * THE REASON THEY ARE LEFT ALONE, pinned so nobody spends a day writing five
     * adapters that no code path can call.
     *
     * `verifyConnection` loads from `connections`. The five suite providers
     * (gmail, both calendars, both Microsoft mail entries) write to
     * `user_calendar_connections` instead, and the connections surface renders
     * those rows through a separate query whose only controls are Reconnect and
     * Disconnect. There is no Verify on a suite account, so an adapter for one
     * would be exactly the defect this audit keeps closing: correct code that
     * nothing reaches.
     *
     * `firecrawl` is `userFacing: false`, so it is never rendered at all.
     *
     * If a Verify control is ever added for suite accounts, this test fails and
     * points at the five adapters that then become worth writing.
     */
    const panel = readFileSync(
      join(import.meta.dir, "..", "..", "..", "components", "connections", "AccountConnectionsSection.tsx"),
      "utf8",
    );
    // The per-connection Verify exists exactly once, and it takes a `connections`
    // row id from listConnections rather than a suite account.
    expect(panel).toContain("mVerify.mutate(primary.id)");
    expect(panel).toContain("const primary = conns[0]");
    // No suite account is passed to it. A change here is the signal to revisit.
    expect(panel).not.toContain("mVerify.mutate(suite");
    expect(panel).not.toContain("mVerify.mutate(account.id)");
  });
});

describe("Linear", () => {
  it("sends an OAuth token as a bearer token", async () => {
    const calls = stubFetch({ body: { data: { viewer: { name: "Ada" } } } });
    await linearAdapter.validate(userToken("oauth_abc"));
    expect(calls[0].url).toBe("https://api.linear.app/graphql");
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer oauth_abc");
  });

  it("sends a personal API key raw, with no bearer prefix", async () => {
    // Linear's own rule, and getting it wrong fails authentication on a key that
    // is perfectly valid.
    const calls = stubFetch({ body: { data: { viewer: { name: "Ada" } } } });
    await linearAdapter.validate(envToken("lin_api_deadbeef"));
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("lin_api_deadbeef");
  });

  it("reads the account back so the connection can be labelled", async () => {
    stubFetch({
      body: { data: { viewer: { name: "Ada", email: "ada@x.dev" }, organization: { name: "Acme" } } },
    });
    const r = await linearAdapter.validate(userToken("t"));
    expect(r.ok).toBe(true);
    expect(r.accountLabel).toBe("Ada - Acme (Linear)");
    expect(r.accountEmail).toBe("ada@x.dev");
  });

  it("does NOT report a 200 carrying GraphQL errors as healthy", async () => {
    // THE ONE THAT MATTERS. An expired Linear token comes back 200 with an errors
    // array, so checking res.ok alone would call a dead credential good, which is
    // the wrong direction for a control whose whole job is telling the truth
    // about it.
    stubFetch({ status: 200, body: { errors: [{ message: "Authentication required" }] } });
    const r = await linearAdapter.validate(userToken("expired"));
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("Authentication required");
  });

  it("names the provider and the status on a refusal", async () => {
    stubFetch({ status: 401 });
    const r = await linearAdapter.validate(userToken("bad"));
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("Linear");
    expect(r.detail).toContain("401");
  });
});

describe("Notion", () => {
  it("always sends the version header, which Notion rejects a request without", async () => {
    const calls = stubFetch({ body: { bot: { workspace_name: "Acme" } } });
    await notionAdapter.validate(userToken("secret_x"));
    expect(calls[0].url).toBe("https://api.notion.com/v1/users/me");
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["Notion-Version"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(headers.Authorization).toBe("Bearer secret_x");
  });

  it("labels the connection with the workspace, not the bot", async () => {
    // A Notion integration authenticates as a bot, so the workspace it was
    // installed into is the fact a person recognises.
    stubFetch({ body: { name: "Supaprod bot", bot: { workspace_name: "Acme HQ" } } });
    const r = await notionAdapter.validate(userToken("t"));
    expect(r.ok).toBe(true);
    expect(r.accountLabel).toBe("Acme HQ");
  });

  it("reports a refusal with its status", async () => {
    stubFetch({ status: 403 });
    const r = await notionAdapter.validate(userToken("t"));
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("403");
  });
});

describe("Google Docs", () => {
  it("reads identity through the scope the connect flow already asked for", async () => {
    // drive.readonly is in the registry's scope list, so `about` needs nothing new.
    const calls = stubFetch({
      body: { user: { displayName: "Ada Lovelace", emailAddress: "ada@x.dev" } },
    });
    const r = await googleDocsAdapter.validate(userToken("ya29.tok"));
    expect(calls[0].url).toContain("drive/v3/about");
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer ya29.tok");
    expect(r.accountLabel).toBe("Ada Lovelace");
    expect(r.accountEmail).toBe("ada@x.dev");
  });

  it("says plainly that a shared admin key has no account to test", async () => {
    // A Google API key authorizes a PROJECT and carries no identity, so probing it
    // would fail for a reason unrelated to whether the admin configured it. Saying
    // that is honest; reporting a broken connection would be the stub's lie
    // arrived at more expensively.
    let fetched = false;
    globalThis.fetch = (async () => {
      fetched = true;
      return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
    }) as typeof fetch;
    const r = await googleDocsAdapter.validate(envToken("AIzaSyWhatever"));
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("shared admin key");
    // And it does not spend a request finding that out.
    expect(fetched).toBe(false);
  });
});

describe("what none of them do", () => {
  it("never throws, whatever the network does", async () => {
    // The contract on ConnectorAdapter says so, and the control has to render an
    // answer rather than a boundary.
    globalThis.fetch = (async () => {
      throw new Error("socket hang up");
    }) as typeof fetch;
    for (const a of [linearAdapter, notionAdapter, googleDocsAdapter]) {
      const r = await a.validate(userToken("t"));
      expect(r.ok).toBe(false);
      expect(r.detail).toContain("socket hang up");
    }
  });

  it("refuses an auth kind it cannot use, rather than guessing a header", async () => {
    // A gateway connection id is not a bearer token. Guessing would produce an
    // authentication failure that reads like a bad credential.
    const gateway: ResolvedAuth = {
      kind: "gateway",
      connectionId: "g1",
      connectorId: "linear",
      ownerUserId: "u1",
      connectionRowId: "c1",
    };
    for (const a of [linearAdapter, notionAdapter, googleDocsAdapter]) {
      const r = await a.validate(gateway);
      expect(r.ok).toBe(false);
      expect(r.detail).toContain("unsupported auth kind");
    }
  });
});

describe("Figma", () => {
  it("sends an OAuth token as a bearer token", async () => {
    const calls = stubFetch({ body: { handle: "ada", email: "ada@x.dev" } });
    const r = await figmaAdapter.validate(userToken("oauth_tok"));
    expect(calls[0].url).toBe("https://api.figma.com/v1/me");
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer oauth_tok",
    );
    expect(r.accountLabel).toBe("ada");
    expect(r.accountEmail).toBe("ada@x.dev");
  });

  it("sends a personal access token in X-Figma-Token, not Authorization", async () => {
    // Figma's own docs are explicit about this, and getting it wrong fails
    // authentication on a token that is perfectly valid, which then reads as a
    // revoked grant.
    const calls = stubFetch({ body: { handle: "ada" } });
    await figmaAdapter.validate(userToken("figd_abc123"));
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["X-Figma-Token"]).toBe("figd_abc123");
    expect(headers.Authorization).toBeUndefined();
  });

  it("puts each credential shape in exactly one header", () => {
    expect(figmaAuthHeader("figd_x")).toEqual({ "X-Figma-Token": "figd_x" });
    expect(figmaAuthHeader("oauth_x")).toEqual({ Authorization: "Bearer oauth_x" });
  });

  it("reports a refusal with its status", async () => {
    stubFetch({ status: 403 });
    const r = await figmaAdapter.validate(userToken("bad"));
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("403");
  });
});

describe("Jira", () => {
  it("validates against api.atlassian.com, which needs no site id", async () => {
    // Atlassian 3LO tokens are exchanged against api.atlassian.com rather than a
    // company's own site, and which sites the grant covers is a separate lookup.
    // Validating against a Jira REST endpoint would report a good token as broken
    // on any workspace that has not bound a site yet.
    const calls = stubFetch({ body: { name: "Ada Lovelace", email: "ada@x.dev" } });
    const r = await jiraAdapter.validate(userToken("atl_tok"));
    expect(calls[0].url).toBe("https://api.atlassian.com/me");
    expect(calls[0].url).not.toContain("atlassian.net");
    expect(r.ok).toBe(true);
    expect(r.accountLabel).toBe("Ada Lovelace");
  });

  it("can finally enumerate the sites the grant reaches", async () => {
    // The registry declares a `site` resource type for Jira and nothing could
    // list one, so binding a workspace to a site meant knowing its id by heart.
    stubFetch({
      body: [
        { id: "site-1", name: "Acme", url: "https://acme.atlassian.net" },
        { id: "site-2", url: "https://other.atlassian.net" },
      ],
    });
    const sites = await jiraAdapter.listResources!(userToken("t"), "site");
    expect(sites).toEqual([
      { id: "site-1", label: "Acme" },
      // Falls back to the url when a site has no name, rather than showing a uuid.
      { id: "site-2", label: "https://other.atlassian.net" },
    ]);
  });

  it("answers an unknown resource kind with nothing, not with sites", async () => {
    expect(await jiraAdapter.listResources!(userToken("t"), "project")).toEqual([]);
  });

  it("returns an empty list rather than throwing when the lookup fails", async () => {
    // A resource picker with nothing in it is a state the surface can render. An
    // exception is not.
    stubFetch({ status: 500 });
    expect(await jiraAdapter.listResources!(userToken("t"), "site")).toEqual([]);
  });
});
