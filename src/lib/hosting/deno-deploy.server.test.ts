import { expect, test, describe, afterEach } from "bun:test";
import { denoDeployProvider } from "./deno-deploy.server";
import type { AppRuntimeHandle, AppRuntimeRef } from "./provider";

const REF: AppRuntimeRef = {
  workspaceId: "ws_1",
  productId: "prod_1",
  hostedAppId: "poc-test-1",
};
const HANDLE: AppRuntimeHandle = { providerId: "deno-deploy", ref: REF };

const savedEnv = { ...process.env };
const savedFetch = globalThis.fetch;
afterEach(() => {
  for (const k of ["DENO_DEPLOY_TOKEN", "DENO_DEPLOY_ACCESS_TOKEN"]) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  globalThis.fetch = savedFetch;
});

describe("available (accepts either env var name)", () => {
  test("false when neither is set", () => {
    delete process.env.DENO_DEPLOY_TOKEN;
    delete process.env.DENO_DEPLOY_ACCESS_TOKEN;
    expect(denoDeployProvider.available).toBe(false);
  });

  test("true with DENO_DEPLOY_TOKEN (Deno's own expected name)", () => {
    delete process.env.DENO_DEPLOY_ACCESS_TOKEN;
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    expect(denoDeployProvider.available).toBe(true);
  });

  test("true with DENO_DEPLOY_ACCESS_TOKEN (this session's earlier unverified guess, still honored)", () => {
    delete process.env.DENO_DEPLOY_TOKEN;
    process.env.DENO_DEPLOY_ACCESS_TOKEN = "ddo_y";
    expect(denoDeployProvider.available).toBe(true);
  });
});

describe("provisionApp", () => {
  test("POSTs the derived slug and returns a handle", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    let capturedUrl = "";
    let capturedBody: unknown;
    globalThis.fetch = (async (url: string, opts: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse(opts.body as string);
      return new Response(JSON.stringify({ id: "app-uuid" }), { status: 200 });
    }) as typeof fetch;

    const handle = await denoDeployProvider.provisionApp(REF, { dedicatedDb: false });
    expect(capturedUrl).toBe("https://api.deno.com/v2/apps");
    expect(capturedBody).toEqual({ slug: "supaprod-poc-test-1" });
    expect(handle).toEqual({ providerId: "deno-deploy", ref: REF });
  });

  test("throws with the response body on a non-ok status (e.g. slug conflict)", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: "SLUG_ALREADY_IN_USE" }), {
        status: 409,
      })) as typeof fetch;

    await expect(denoDeployProvider.provisionApp(REF, { dedicatedDb: false })).rejects.toThrow(
      "409",
    );
  });
});

describe("deploy", () => {
  test("posts assets + static runtime config, returns the confirmed dot-separated production URL", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    let capturedBody: { assets: Record<string, unknown>; config: unknown };
    globalThis.fetch = (async (_url: string, opts: RequestInit) => {
      capturedBody = JSON.parse(opts.body as string);
      return new Response(JSON.stringify({ id: "rev_1" }), { status: 200 });
    }) as typeof fetch;

    const result = await denoDeployProvider.deploy(
      HANDLE,
      { files: [{ path: "index.html", content: "<h1>hi</h1>" }] },
      {},
    );

    expect(capturedBody.assets["index.html"]).toEqual({
      kind: "file",
      encoding: "utf-8",
      content: "<h1>hi</h1>",
    });
    expect(capturedBody.config).toEqual({ runtime: { type: "static", cwd: "./", spa: false } });
    // Regression pin: the default alias is dot-separated (<slug>.<org>.deno.net), not
    // hyphen-separated. Confirmed live 2026-07-02 after the hyphen guess 404'd.
    expect(result).toEqual({
      deploymentId: "rev_1",
      url: "https://supaprod-poc-test-1.cadencehostingtest.deno.net",
      status: "success",
    });
  });

  test("returns a failure result (never throws) on a non-ok deploy response", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;

    const result = await denoDeployProvider.deploy(HANDLE, { files: [] }, {});
    expect(result.status).toBe("failure");
    expect(result.url).toBe(null);
  });

  test("P-39: carries the status and body on failure, not a bare 'failure'", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: "QUOTA_EXCEEDED" }), { status: 429 })) as typeof fetch;

    const result = await denoDeployProvider.deploy(HANDLE, { files: [] }, {});
    expect(result.status).toBe("failure");
    expect(result.detail).toBe('429 {"code":"QUOTA_EXCEEDED"}');
  });

  test("P-39: a body over 500 bytes is truncated, not dropped or unbounded", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    const longBody = "x".repeat(1000);
    globalThis.fetch = (async () => new Response(longBody, { status: 502 })) as typeof fetch;

    const result = await denoDeployProvider.deploy(HANDLE, { files: [] }, {});
    expect(result.detail).toBe(`502 ${"x".repeat(500)}`);
  });
});

describe("readDeployments (regression: the API returns a bare array, not {items: [...]})", () => {
  test("parses a bare array of snake_case revisions", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify([{ id: "rev_1", status: "succeeded", created_at: "2026-07-01T00:00:00Z" }]),
        { status: 200 },
      )) as typeof fetch;

    const deployments = await denoDeployProvider.readDeployments(HANDLE);
    expect(deployments).toEqual([
      { deploymentId: "rev_1", status: "succeeded", url: null, createdAt: "2026-07-01T00:00:00Z" },
    ]);
  });

  test("returns an empty array (never throws) on a non-ok response", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    expect(await denoDeployProvider.readDeployments(HANDLE)).toEqual([]);
  });
});

describe("readHealth", () => {
  test("healthy true with the constructed production URL on a 200", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ id: "app-uuid" }), { status: 200 })) as typeof fetch;

    const health = await denoDeployProvider.readHealth(HANDLE);
    expect(health.healthy).toBe(true);
    expect(health.detail).toBe("https://supaprod-poc-test-1.cadencehostingtest.deno.net");
  });

  test("healthy false on a non-ok response", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () => new Response("nope", { status: 404 })) as typeof fetch;

    const health = await denoDeployProvider.readHealth(HANDLE);
    expect(health.healthy).toBe(false);
  });
});

describe("teardown", () => {
  test("DELETEs the app and tolerates an already-gone (404) app", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    let capturedMethod = "";
    globalThis.fetch = (async (_url: string, opts: RequestInit) => {
      capturedMethod = opts.method as string;
      return new Response(null, { status: 404 });
    }) as typeof fetch;

    await expect(denoDeployProvider.teardown(HANDLE)).resolves.toBeUndefined();
    expect(capturedMethod).toBe("DELETE");
  });

  test("throws on a genuine server error", async () => {
    process.env.DENO_DEPLOY_TOKEN = "ddo_x";
    globalThis.fetch = (async () => new Response("boom", { status: 500 })) as typeof fetch;
    await expect(denoDeployProvider.teardown(HANDLE)).rejects.toThrow("500");
  });
});

describe("unimplemented methods (honest PoC scope, never silently no-op)", () => {
  test("readLogs, readEnvVars, setEnvVar, rollback, exportTenantData all reject clearly", async () => {
    await expect(denoDeployProvider.readLogs(HANDLE)).rejects.toThrow("not implemented");
    await expect(denoDeployProvider.readEnvVars(HANDLE)).rejects.toThrow("not implemented");
    await expect(denoDeployProvider.setEnvVar(HANDLE, "K", "V")).rejects.toThrow("not implemented");
    await expect(denoDeployProvider.rollback(HANDLE, "rev_1")).rejects.toThrow("not implemented");
    await expect(denoDeployProvider.exportTenantData(HANDLE)).rejects.toThrow("not implemented");
  });
});
