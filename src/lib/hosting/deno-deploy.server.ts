/**
 * BYO-P5 P5a-poc: the Deno Deploy adapter (proof-of-concept, not the production choice).
 *
 * Implements a subset of {@link AppRuntimeProvider} against Deno Deploy's v2
 * REST API (`api.deno.com/v2`), the endpoints verified 2026-07-02 against
 * Deno's own OpenAPI spec (a first research pass named the wrong deploy
 * endpoint; a second, adversarial pass caught it before this file was
 * written). Only the methods needed to prove the interface's shape are
 * implemented (`provisionApp`, `deploy`, `readDeployments`, `readHealth`);
 * the rest throw a clear "not implemented" error rather than guessing at
 * endpoints nobody verified. Auth is an org-scoped access token
 * (`ddo_...`) read from `DENO_DEPLOY_TOKEN`, never hardcoded, never logged.
 *
 * This is explicitly NOT the plan's production adapter: no tenant isolation
 * model, no DB layer, no per-tenant credential scoping. See
 * `docs/planning/byo-p5-managed-runtime-plan.md`'s 2026-07-02 addendum for
 * why Deno Deploy is being evaluated as a genuine long-term candidate
 * alongside Cloudflare Workers for Platforms, not just a free test stand-in.
 *
 * DORMANT BY DESIGN (RF-08, 2026-07-02): its only production caller is
 * `hosting-poc.functions.ts` -> `provisionHostingPoc`, an admin-role-gated
 * server function rendered solely by the admin-only PoC panel on
 * `_authenticated.admin.platform.tsx`. No customer-facing or scheduled flow
 * imports this file. A future audit finding zero non-admin importers is
 * expected, not a regression to fix.
 */

import type {
  AppRuntimeHandle,
  AppRuntimeProvider,
  AppRuntimeRef,
  AppRuntimeSpec,
  BuildArtifact,
  DeploymentEntry,
  DeploymentResult,
  HealthStatus,
  LogEntry,
  LogQuery,
  TenantExportArtifact,
} from "./provider";

const DENO_API_BASE = "https://api.deno.com/v2";
// PoC-only: a real adapter would read the org slug from vaulted per-workspace
// config, not a hardcoded constant. The default production alias is
// confirmed (2026-07-02, live test) to be `https://<app-slug>.<org-slug>.deno.net`.
const DENO_ORG_SLUG = "cadencehostingtest";

const NOT_IMPLEMENTED =
  "not implemented in the deno-deploy PoC adapter (only provisionApp/deploy/readDeployments/readHealth are verified against Deno's API)";

function denoToken(): string | undefined {
  // DENO_DEPLOY_TOKEN is Deno's own expected name (confirmed via the CLI/API
  // research); DENO_DEPLOY_ACCESS_TOKEN was this session's earlier, unverified
  // guess. Accept either so a `.env` written before the name was confirmed
  // still works.
  return process.env.DENO_DEPLOY_TOKEN ?? process.env.DENO_DEPLOY_ACCESS_TOKEN;
}

function authHeaders(): Record<string, string> {
  const token = denoToken();
  if (!token) throw new Error("DENO_DEPLOY_TOKEN is not set");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** PoC-only slug derivation. A real adapter would persist the mapping, not recompute it. */
function slugFor(ref: AppRuntimeRef): string {
  return `supaprod-${ref.hostedAppId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 32);
}

/** The default production alias, confirmed live 2026-07-02: dot-separated, not hyphen-separated. */
function productionUrlFor(ref: AppRuntimeRef): string {
  return `https://${slugFor(ref)}.${DENO_ORG_SLUG}.deno.net`;
}

export const denoDeployProvider: AppRuntimeProvider = {
  providerId: "deno-deploy",
  get available() {
    return !!denoToken();
  },

  async provisionApp(ref: AppRuntimeRef, _spec: AppRuntimeSpec): Promise<AppRuntimeHandle> {
    const res = await fetch(`${DENO_API_BASE}/apps`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ slug: slugFor(ref) }),
    });
    if (!res.ok) {
      throw new Error(`deno-deploy provisionApp failed: ${res.status} ${await res.text()}`);
    }
    return { providerId: "deno-deploy", ref };
  },

  async deploy(
    handle: AppRuntimeHandle,
    artifact: BuildArtifact,
    _env: Record<string, string>,
  ): Promise<DeploymentResult> {
    const assets: Record<string, unknown> = {};
    for (const f of artifact.files) {
      assets[f.path] = { kind: "file", encoding: "utf-8", content: f.content };
    }
    const res = await fetch(`${DENO_API_BASE}/apps/${slugFor(handle.ref)}/deploy`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        assets,
        config: { runtime: { type: "static", cwd: "./", spa: false } },
        production: true,
      }),
    });
    if (!res.ok) {
      /*
       * P-39: the status and the first 500 bytes of the body, not thrown
       * away. `.text()` rather than `.json()` -- a non-OK response is not
       * guaranteed to be valid JSON, and a failed parse here must not hide
       * the failure it was trying to explain.
       */
      const body = await res.text().catch(() => "");
      return {
        deploymentId: "",
        url: null,
        status: "failure",
        detail: `${res.status} ${body.slice(0, 500)}`.trim(),
      };
    }
    const body = (await res.json()) as { id?: string };
    return { deploymentId: body.id ?? "", url: productionUrlFor(handle.ref), status: "success" };
  },

  async readDeployments(handle: AppRuntimeHandle): Promise<DeploymentEntry[]> {
    const res = await fetch(`${DENO_API_BASE}/apps/${slugFor(handle.ref)}/revisions`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    // The API returns a bare array (not {items: [...]}) with snake_case fields,
    // confirmed against a live response 2026-07-02.
    const body = (await res.json()) as Array<{
      id: string;
      status?: string;
      created_at?: string;
    }>;
    return body.map((r) => ({
      deploymentId: r.id,
      status: r.status ?? "unknown",
      url: null,
      createdAt: r.created_at ?? "",
    }));
  },

  async readHealth(handle: AppRuntimeHandle): Promise<HealthStatus> {
    const res = await fetch(`${DENO_API_BASE}/apps/${slugFor(handle.ref)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      return {
        healthy: false,
        checkedAt: new Date().toISOString(),
        detail: `deno-deploy readHealth: ${res.status}`,
      };
    }
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      detail: productionUrlFor(handle.ref),
    };
  },

  async readLogs(_handle: AppRuntimeHandle, _opts?: LogQuery): Promise<LogEntry[]> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async readEnvVars(_handle: AppRuntimeHandle): Promise<Record<string, string>> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async setEnvVar(_handle: AppRuntimeHandle, _key: string, _value: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async rollback(_handle: AppRuntimeHandle, _toDeploymentId: string): Promise<DeploymentResult> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async exportTenantData(_handle: AppRuntimeHandle): Promise<TenantExportArtifact> {
    throw new Error(NOT_IMPLEMENTED);
  },
  async teardown(handle: AppRuntimeHandle): Promise<void> {
    const res = await fetch(`${DENO_API_BASE}/apps/${slugFor(handle.ref)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`deno-deploy teardown failed: ${res.status} ${await res.text()}`);
    }
  },
};
