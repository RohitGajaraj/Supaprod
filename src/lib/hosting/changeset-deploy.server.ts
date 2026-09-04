/**
 * SEAM-2 (mission 3.7): merge is not the end; a live URL is.
 *
 * Deploys a merged studio changeset's repo content to Deno Deploy as a real
 * running app. Scope is deliberately honest: only Supaprod-managed repos
 * (supaprod.json at root, the deno-starter template family) qualify, because
 * those are the apps we KNOW are `Deno.serve` programs with a main.ts
 * entrypoint. Arbitrary customer repos keep the existing capture-only
 * deployment records.
 *
 * API shapes live-verified 2026-07-07 against api.deno.com/v2 with a real
 * token: app creation defaults to config.runtime {type:'dynamic',
 * entrypoint:'main.ts'}; a production deploy serves at
 * https://<slug>.<org>.deno.net and a non-production revision at
 * https://<slug>-<revisionId>.<org>.deno.net (both probed live).
 *
 * No admin-role gate: the caller scopes by workspace membership (RLS on the
 * deployments table) and app slugs derive from workspace + changeset ids.
 */

import { readAppCreate } from "@/lib/hosting/a-bad-request-is-not-an-existing-app";

const DENO_API_BASE = "https://api.deno.com/v2";

const TEXT_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "json",
  "jsonc",
  "html",
  "css",
  "md",
  "txt",
  "svg",
  "yml",
  "yaml",
  "toml",
  "csv",
  "xml",
  "webmanifest",
]);
const MAX_FILE_BYTES = 400_000;
const MAX_FILES = 200;

export function denoOrgSlug(): string {
  return process.env.DENO_DEPLOY_ORG || "cadencehostingtest";
}

function denoToken(): string | undefined {
  return process.env.DENO_DEPLOY_TOKEN ?? process.env.DENO_DEPLOY_ACCESS_TOKEN;
}

export function denoDeployConfigured(): boolean {
  return !!denoToken();
}

/** PURE. Deno Deploy app slug for a changeset: stable, lowercase, collision-scoped.
 * 12 hex of changeset id keeps the within-workspace collision space negligible
 * (adversarial-review finding: 6 hex reached birthday territory at a few
 * thousand changesets, silently clobbering another changeset's live app). */
export function deriveAppSlug(workspaceId: string, changesetId: string): string {
  const ws = workspaceId
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toLowerCase();
  const cs = changesetId
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 12)
    .toLowerCase();
  return `cad-${ws}-${cs}`;
}

/** PURE. Should this repo file ride the deploy? Secrets-shaped names never
 * ship: the deployed URL is public, so over-blocking a "secrets.json" is far
 * cheaper than leaking one (adversarial-review finding). */
export function deployableFile(path: string, size: number | undefined): boolean {
  if (typeof size === "number" && size > MAX_FILE_BYTES) return false;
  if (path.startsWith(".git/")) return false;
  const base = (path.split("/").pop() ?? "").toLowerCase();
  if (base.startsWith(".env") || base.includes("secret") || base.includes("credential")) {
    return false;
  }
  const ext = path.includes(".") ? path.split(".").pop()!.toLowerCase() : "";
  return TEXT_EXTENSIONS.has(ext);
}

export function productionUrl(slug: string): string {
  return `https://${slug}.${denoOrgSlug()}.deno.net`;
}

export function previewUrl(slug: string, revisionId: string): string {
  return `https://${slug}-${revisionId}.${denoOrgSlug()}.deno.net`;
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "supaprod-ship",
  };
}

/**
 * The marker files at the repo root that mark a Supaprod-managed (template) app.
 *
 * TWO NAMES, AND THE SECOND ONE IS A SCAR (F-49). `c5d479fd6` — *"Rename product
 * Cadence -> Supaprod across code, docs, and public surfaces"* — renamed this
 * marker in OUR code. It could not rename it in anybody's repository, and a
 * marker file is a contract with a repo we do not own.
 *
 * WHAT THAT COST, MEASURED. `RohitGajaraj/Test-Project-Cadence` is the only repo
 * that has ever completed this product's ship chain: thirteen successful Deno
 * previews and one production promote between 2026-07-08 and 2026-07-10
 * (`SELECT ... FROM deployments WHERE provider='deno'`). Its root today holds
 * `cadence.json`, `main.ts`, `index.html` — it IS the template family — and
 * `GET /contents/supaprod.json` returns **404**. So from the rename onward the
 * tick stopped recognising it, stopped building its preview, and
 * `release.publish` began refusing every promote with *"No successful preview
 * deploy exists for this changeset yet"* — a sentence about a missing artifact,
 * for a repo whose artifact we had simply stopped looking for.
 *
 * Nothing reported it. This is the seventh instance of the pattern this week —
 * the mechanism exists and the trigger was quietly unwired — and the first where
 * a rename did the unwiring rather than an omission.
 *
 * ORDERED, NOT A SET. The current name is checked first so the common path is
 * one request and unchanged; the legacy name costs a second request only on a
 * repo that has already missed, which `canHost` has already narrowed to merged
 * changesets under a retry backoff. New repos are scaffolded with the current
 * name only (`renderStarterTemplate`); this list is for repos that were marked
 * before we changed our mind about our own name.
 */
const MANAGED_MARKERS = ["supaprod.json", "cadence.json"] as const;

/** A marker file at the repo root marks a Supaprod-managed (template) app. */
export async function isSupaprodManaged(args: {
  token: string;
  repo: string;
  ref: string;
}): Promise<boolean> {
  for (const marker of MANAGED_MARKERS) {
    const res = await fetch(
      `https://api.github.com/repos/${args.repo}/contents/${marker}?ref=${encodeURIComponent(args.ref)}`,
      { headers: ghHeaders(args.token) },
    );
    if (res.ok) return true;
  }
  return false;
}

/**
 * Pull the repo's deployable text files at a ref. Refuses oversized repos
 * honestly instead of deploying a truncated app.
 */
export async function collectRepoFiles(args: {
  token: string;
  repo: string;
  ref: string;
}): Promise<Array<{ path: string; content: string }>> {
  const headers = ghHeaders(args.token);
  const treeRes = await fetch(
    `https://api.github.com/repos/${args.repo}/git/trees/${encodeURIComponent(args.ref)}?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) {
    throw new Error(`ship: repo tree read failed (${treeRes.status})`);
  }
  const tree = (await treeRes.json()) as {
    tree?: Array<{ path: string; type: string; size?: number; sha: string }>;
    truncated?: boolean;
  };
  const blobs = (tree.tree ?? []).filter((e) => e.type === "blob");
  if (tree.truncated || blobs.length > MAX_FILES) {
    throw new Error(
      `ship: repo has ${blobs.length}${tree.truncated ? "+" : ""} files; the managed deploy path caps at ${MAX_FILES}. This repo should deploy through its own pipeline.`,
    );
  }
  const wanted = blobs.filter((e) => deployableFile(e.path, e.size));
  const out: Array<{ path: string; content: string }> = [];
  for (const f of wanted) {
    const blobRes = await fetch(`https://api.github.com/repos/${args.repo}/git/blobs/${f.sha}`, {
      headers,
    });
    if (!blobRes.ok) {
      throw new Error(`ship: blob read failed for ${f.path} (${blobRes.status})`);
    }
    const blob = (await blobRes.json()) as { content?: string; encoding?: string };
    const content =
      blob.encoding === "base64"
        ? Buffer.from((blob.content ?? "").replace(/\n/g, ""), "base64").toString("utf-8")
        : (blob.content ?? "");
    out.push({ path: f.path, content });
  }
  if (!out.some((f) => f.path === "main.ts")) {
    throw new Error("ship: no main.ts entrypoint at the repo root; not a deployable managed app");
  }
  return out;
}

export interface ChangesetDeployResult {
  ok: boolean;
  revisionId: string | null;
  url: string | null;
  reason?: string;
}

/**
 * Deploy the given files as the changeset's app. `production: false` yields a
 * preview revision URL; `true` moves the production alias.
 */
export async function deployChangesetApp(args: {
  workspaceId: string;
  changesetId: string;
  /**
   * `encoding` defaults to `utf-8`, which is every file the template shape has
   * ever sent. A BUILT site is not text (P-128b): a Vite build carries PNGs and
   * woff2, and sending those as UTF-8 corrupts them silently -- the file
   * uploads, the deploy succeeds, and the image is broken on the served page.
   * That was the second reason a customer's repo could never have shipped
   * through this call, after the missing `main.ts`.
   */
  files: Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }>;
  production: boolean;
}): Promise<ChangesetDeployResult> {
  const token = denoToken();
  if (!token)
    return { ok: false, revisionId: null, url: null, reason: "DENO_DEPLOY_TOKEN not set" };
  const slug = deriveAppSlug(args.workspaceId, args.changesetId);
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  /*
   * Ensure the app exists; an already-taken slug is fine (idempotent ensure).
   *
   * THE BODY IS READ BEFORE THE STATUS IS FORGIVEN. See
   * `a-bad-request-is-not-an-existing-app`: this tolerated ANY 400 as "it is
   * already there", and on 2026-09-04 the 400 was APP_LIMIT_EXCEEDED. The
   * ensure passed, the deploy went to an app that had never been created, and
   * the person was shown a failure about the deploy instead of the quota the
   * host had named. 500 bytes, the same number and the same reason as the
   * deploy call below (P-39): a quota message runs past 200.
   */
  const createRes = await fetch(`${DENO_API_BASE}/apps`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ slug }),
  });
  const created = readAppCreate({
    ok: createRes.ok,
    status: createRes.status,
    body: createRes.ok ? "" : await createRes.text().catch(() => ""),
  });
  if (created.kind === "refused") {
    return { ok: false, revisionId: null, url: null, reason: created.reason };
  }

  const assets: Record<string, unknown> = {};
  for (const f of args.files) {
    assets[f.path] = { kind: "file", encoding: f.encoding ?? "utf-8", content: f.content };
  }
  const deployRes = await fetch(`${DENO_API_BASE}/apps/${slug}/deploy`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      assets,
      config: { runtime: { type: "dynamic", entrypoint: "main.ts" } },
      production: args.production,
    }),
  });
  if (!deployRes.ok) {
    // P-39 (A-QUEUE.md): 500 bytes, not 200 -- the scope's own number, and the
    // body of a real provider error (a quota message, a validation detail)
    // regularly runs past 200.
    return {
      ok: false,
      revisionId: null,
      url: null,
      reason: `deploy failed (${deployRes.status}): ${(await deployRes.text()).slice(0, 500)}`,
    };
  }
  const body = (await deployRes.json()) as { id?: string };
  const revisionId = body.id ?? null;
  const url = args.production
    ? productionUrl(slug)
    : revisionId
      ? previewUrl(slug, revisionId)
      : null;
  return { ok: true, revisionId, url };
}

/**
 * ── RECLAIM ONE APP, AND ONLY AFTER THE SERVER HAS AGREED (P-118b) ───────
 *
 * The list a person presses this from is built from OUR OWN RECORD rather than
 * from the host's API, and that is a deliberate limit rather than a shortcut:
 * every app this product creates is `deriveAppSlug(workspace, changeset)`, so
 * the record knows all of them, and it knows nothing about apps somebody else
 * put in the account. Enumerating the org would list apps we must never touch
 * beside ones we may, on one screen, behind one button.
 *
 * So the surface says what it can see and what it cannot, and this call refuses
 * anything whose slug is not ours even if a caller asks for it.
 */
export async function reclaimHostedApp(slug: string): Promise<{ ok: boolean; reason: string }> {
  const token = denoToken();
  if (!token) return { ok: false, reason: "DENO_DEPLOY_TOKEN not set, so nothing was deleted." };
  /* The last line of defence, and it is here rather than only at the caller
     because this function deletes something that cannot be recovered. */
  if (!slug.startsWith("cad-")) {
    return {
      ok: false,
      reason: `${slug} was not created by this product, so it will not be deleted from here.`,
    };
  }
  const res = await fetch(`${DENO_API_BASE}/apps/${slug}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  /* 404 is success for this act: the slot is free, which is what was asked for.
     Anything else carries the host's own sentence, on P-39's argument and the
     same 500 bytes as every other call in this file. */
  if (res.ok || res.status === 404) return { ok: true, reason: `${slug} was released.` };
  return {
    ok: false,
    reason: `The host would not delete ${slug} (${res.status}): ${(await res.text().catch(() => "")).slice(0, 500)}`,
  };
}
