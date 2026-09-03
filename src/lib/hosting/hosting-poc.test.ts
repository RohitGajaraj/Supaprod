import { expect, test, describe } from "bun:test";
import { escapeHtml, minimalShellHtml, deployHostingPoc } from "./hosting-poc";
import type {
  AppRuntimeHandle,
  AppRuntimeProvider,
  AppRuntimeRef,
  DeploymentResult,
} from "./provider";

const REF: AppRuntimeRef = { workspaceId: "ws_1", productId: "proj_1", hostedAppId: "proj_1" };

function fakeProvider(overrides: Partial<AppRuntimeProvider> = {}): AppRuntimeProvider {
  return {
    providerId: "deno-deploy",
    available: true,
    provisionApp: async (_ref, _spec) =>
      ({ providerId: "deno-deploy", ref: REF }) as AppRuntimeHandle,
    deploy: async () =>
      ({
        deploymentId: "dep_1",
        url: "https://proj-1.example.deno.net",
        status: "success",
      }) as DeploymentResult,
    readDeployments: async () => [],
    readHealth: async () => ({ healthy: true, checkedAt: "" }),
    readLogs: async () => [],
    readEnvVars: async () => ({}),
    setEnvVar: async () => {},
    rollback: async () => ({ deploymentId: "", url: null, status: "failure" }) as DeploymentResult,
    exportTenantData: async () => {
      throw new Error("not implemented");
    },
    teardown: async () => {},
    ...overrides,
  };
}

describe("escapeHtml", () => {
  test("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<script>&"'`)).toBe("&lt;script&gt;&amp;&quot;&#39;");
  });

  test("leaves plain text untouched", () => {
    expect(escapeHtml("Acme Rockets")).toBe("Acme Rockets");
  });
});

describe("minimalShellHtml", () => {
  test("embeds the escaped project name in the title and body", () => {
    const html = minimalShellHtml("<b>Acme</b>");
    expect(html).toContain("&lt;b&gt;Acme&lt;/b&gt;");
    expect(html).not.toContain("<b>Acme</b>");
    expect(html).toContain("hosted by Supaprod");
  });
});

describe("deployHostingPoc", () => {
  test("returns not_configured when the provider is unavailable, without calling provisionApp/deploy", async () => {
    let called = false;
    const provider = fakeProvider({
      available: false,
      provisionApp: async () => {
        called = true;
        return { providerId: "deno-deploy", ref: REF };
      },
    });
    const result = await deployHostingPoc(provider, REF, "Acme");
    expect(result).toEqual({
      ok: false,
      reason: "not_configured",
      message: "The hosting provider is not configured (missing credentials).",
    });
    expect(called).toBe(false);
  });

  test("happy path: provisions then deploys, returning the live URL", async () => {
    const provider = fakeProvider();
    const result = await deployHostingPoc(provider, REF, "Acme Rockets");
    expect(result).toEqual({
      ok: true,
      url: "https://proj-1.example.deno.net",
      deploymentId: "dep_1",
      providerId: "deno-deploy",
    });
  });

  test("idempotent: a provisionApp failure (app already exists) does not block the deploy", async () => {
    let deployed = false;
    const provider = fakeProvider({
      provisionApp: async () => {
        throw new Error("409 slug already exists");
      },
      deploy: async (handle) => {
        deployed = true;
        expect(handle).toEqual({ providerId: "deno-deploy", ref: REF });
        return { deploymentId: "dep_2", url: "https://proj-1.example.deno.net", status: "success" };
      },
    });
    const result = await deployHostingPoc(provider, REF, "Acme");
    expect(deployed).toBe(true);
    expect(result.ok).toBe(true);
  });

  test("deploy failure surfaces as provider_error with the status", async () => {
    const provider = fakeProvider({
      deploy: async () => ({ deploymentId: "", url: null, status: "failure" }) as DeploymentResult,
    });
    const result = await deployHostingPoc(provider, REF, "Acme");
    expect(result).toEqual({
      ok: false,
      reason: "provider_error",
      message: "Deploy did not succeed (status: failure).",
    });
  });

  test("P-39: a deploy failure carrying detail says why, not just the bare status", async () => {
    const provider = fakeProvider({
      deploy: async () =>
        ({
          deploymentId: "",
          url: null,
          status: "failure",
          detail: '429 {"code":"QUOTA_EXCEEDED"}',
        }) as DeploymentResult,
    });
    const result = await deployHostingPoc(provider, REF, "Acme");
    expect(result).toEqual({
      ok: false,
      reason: "provider_error",
      message: 'Deploy did not succeed (status: failure (429 {"code":"QUOTA_EXCEEDED"})).',
    });
  });

  test("deploy() throwing (e.g. a network error, not just a non-ok response) is caught, not an unhandled rejection", async () => {
    const provider = fakeProvider({
      deploy: async () => {
        throw new Error("fetch failed: ECONNRESET");
      },
    });
    const result = await deployHostingPoc(provider, REF, "Acme");
    expect(result).toEqual({
      ok: false,
      reason: "provider_error",
      message: "Deploy threw: fetch failed: ECONNRESET",
    });
  });

  test("a REAL provisionApp failure (not a harmless conflict) is not silently discarded when deploy also fails", async () => {
    const provider = fakeProvider({
      provisionApp: async () => {
        throw new Error("401 invalid or expired DENO_DEPLOY_TOKEN");
      },
      deploy: async () => ({ deploymentId: "", url: null, status: "failure" }) as DeploymentResult,
    });
    const result = await deployHostingPoc(provider, REF, "Acme");
    expect(result).toEqual({
      ok: false,
      reason: "provider_error",
      message:
        "Deploy did not succeed (status: failure); provisioning had also failed: 401 invalid or expired DENO_DEPLOY_TOKEN",
    });
  });
});
