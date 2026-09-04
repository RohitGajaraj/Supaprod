// F-CONN Phase 1 — GitHub App provider (server-only).
// App JWT (RS256 via WebCrypto), installation token minting (cached ~50min),
// connect-state HMAC helpers for the install callback, the ConnectorAdapter,
// and resolveGitHub — the one entry point every GitHub call site uses.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { base64ToBytes, base64UrlToBytes, bytesToBase64Url } from "../crypto.server";
import { resolveProviderAuth, type ResolvedAuth, type ProviderAuthCache } from "../resolve.server";
import type { ConnectorAdapter, ResourceItem, ValidateResult } from "./types.server";

const GH_API = "https://api.github.com";
const GH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "supaprod-connectors",
} as const;

const NOT_CONNECTED_ERROR =
  "GitHub is not connected. Connect it in Settings → Connected accounts, then bind a repo on Connectors.";

// ---- repo normalization (centralized; same shape as outcome/discovery.functions.ts) ----

/** Normalize 'https://github.com/owner/name.git' / 'git@…' / 'owner/name/' → 'owner/name', else null. */
export function normalizeGithubRepo(rawRepo: string): string | null {
  const repo = rawRepo
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
  return /^[\w.-]+\/[\w.-]+$/.test(repo) ? repo : null;
}

// ---- App JWT ----

async function importAppKey(): Promise<CryptoKey> {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not set. GitHub App connect is setup pending.");
  }
  // Secrets pasted as single lines often carry literal \n escapes.
  const pem = raw.replace(/\\n/g, "\n").trim();
  if (pem.includes("RSA PRIVATE KEY")) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY is PKCS#1 (BEGIN RSA PRIVATE KEY); WebCrypto needs PKCS#8. Convert with: openssl pkcs8 -topk8 -nocrypt -in app.pem",
    );
  }
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  return crypto.subtle.importKey(
    "pkcs8",
    base64ToBytes(body),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function b64urlJson(obj: Record<string, unknown>): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
}

/** Short-lived RS256 app JWT for /app/* endpoints. */
export async function appJwt(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error("GITHUB_APP_ID is not set. GitHub App connect is setup pending.");
  }
  /*
   * AN INTEGER, AND GITHUB REJECTS THE STRING (found 2026-08-27 by minting one).
   *
   * `process.env` hands back a string, and this passed it straight into the
   * `iss` claim. GitHub answers **401 with "'Issuer' claim ('iss') must be an
   * Integer"**, so every GitHub App token this product has ever tried to mint
   * was refused before it reached a repository.
   *
   * It presents as "Bad credentials" downstream, which is what sent F-101
   * looking for a missing or revoked key: `builder` and `qa` both reported a
   * 401 on track 8391835f and Build has been unable to read a repo since. A
   * malformed claim and a wrong key are the same status code and very nearly
   * the same sentence.
   *
   * Validated rather than coerced: `Number("abc")` is NaN, which serialises to
   * `null` and produces a third 401 that says something else again.
   */
  const issuer = Number(appId);
  if (!Number.isInteger(issuer)) {
    throw new Error(
      `GITHUB_APP_ID must be the App's numeric id, and this one is not a number. GitHub rejects a non-integer issuer with a 401 that reads like a bad key.`,
    );
  }
  const key = await importAppKey();
  const now = Math.floor(Date.now() / 1000);
  const signingInput = `${b64urlJson({ alg: "RS256", typ: "JWT" })}.${b64urlJson({
    iat: now - 60,
    exp: now + 540,
    iss: issuer,
  })}`;
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

// ---- Installation tokens (GitHub tokens live 1h; cache ~50min) ----

const installTokenCache = new Map<string, { token: string; expiresAt: number }>();

/** Evict all expired entries from installTokenCache. Called on every write so the Map
 *  never accumulates stale entries for the Worker isolate's lifetime in multi-tenant use. */
function evictExpiredInstallTokens(): void {
  const now = Date.now();
  for (const [k, v] of installTokenCache) {
    if (v.expiresAt <= now) installTokenCache.delete(k);
  }
}

export async function mintInstallationToken(installationId: string): Promise<string> {
  const cached = installTokenCache.get(installationId);
  // Delete and skip the entry if it is expired; fall through to mint a fresh token.
  if (cached) {
    if (cached.expiresAt > Date.now()) return cached.token;
    installTokenCache.delete(installationId);
  }
  const jwt = await appJwt();
  const res = await fetch(`${GH_API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: { ...GH_HEADERS, Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) {
    throw new Error(
      `GitHub installation token mint failed (${res.status}): ${(await res.text()).slice(0, 200)}`,
    );
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error("GitHub installation token response missing token");
  // Evict stale entries before inserting so the Map stays bounded across many installations.
  evictExpiredInstallTokens();
  installTokenCache.set(installationId, {
    token: body.token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  });
  return body.token;
}

/** Probe an installation via the app JWT → account login (org or user the app is installed on). */
export async function getInstallationAccount(
  installationId: string,
): Promise<{ login: string | null }> {
  const jwt = await appJwt();
  const res = await fetch(`${GH_API}/app/installations/${installationId}`, {
    headers: { ...GH_HEADERS, Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) {
    throw new Error(
      `GitHub installation probe failed (${res.status}): ${(await res.text()).slice(0, 200)}`,
    );
  }
  const body = (await res.json()) as { account?: { login?: string } };
  return { login: body.account?.login ?? null };
}

// ---- Connect-state HMAC (used by startGithubAppConnect + the public callback) ----

async function stateHmac(payload: string): Promise<string> {
  const keyB64 = process.env.CONNECTOR_SECRETS_KEY;
  if (!keyB64) {
    throw new Error("CONNECTOR_SECRETS_KEY is not set. Cannot sign GitHub connect state.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(keyB64.trim()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(sig));
}

/**
 * SW-6: the state can carry an allowlisted return destination so the install
 * callback can resume the flow the user came from (the onboarding connect
 * step) instead of stranding them. An allowlist, not a free-form URL, so the
 * signed state can never become an open-redirect vector. Base64url has no '|',
 * UUIDs have no '|', and returnTo comes from the allowlist, so split('|')
 * parsing stays unambiguous for both formats.
 */
const CONNECT_RETURN_TOS = new Set(["onboarding"]);
export type ConnectStateResult = {
  userId: string;
  returnTo: string | null;
  /** PKCE code_verifier, when this connect flow generated one (see makePkcePair). */
  codeVerifier: string | null;
};

/** state = base64url(user_id|exp[|return_to[|code_verifier]]|hmac), 15-minute expiry.
 *  code_verifier rides inside the signed state instead of separate server-side storage
 *  (session/cookie) - it is authenticated by the same HMAC, so a tampered verifier is
 *  caught exactly like a tampered userId, and no new storage layer is needed for PKCE. */
export async function makeConnectState(
  userId: string,
  returnTo?: string,
  codeVerifier?: string,
): Promise<string> {
  const exp = Date.now() + 15 * 60 * 1000;
  const rt = returnTo && CONNECT_RETURN_TOS.has(returnTo) ? returnTo : "";
  let payload: string;
  if (codeVerifier) {
    payload = `${userId}|${exp}|${rt}|${codeVerifier}`;
  } else if (rt) {
    payload = `${userId}|${exp}|${rt}`;
  } else {
    payload = `${userId}|${exp}`;
  }
  const mac = await stateHmac(payload);
  return bytesToBase64Url(new TextEncoder().encode(`${payload}|${mac}`));
}

/** Returns {userId, returnTo, codeVerifier} when the state is authentic and unexpired, else
 *  null. Never throws. Accepts the legacy 3-part (userId|exp|mac), 4-part
 *  (userId|exp|returnTo|mac), and 5-part (userId|exp|returnTo|codeVerifier|mac) forms, so
 *  states minted before this deploy stay valid across it. */
export async function readConnectState(state: string): Promise<ConnectStateResult | null> {
  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(state));
    const parts = decoded.split("|");
    if (parts.length < 3 || parts.length > 5) return null;
    const [userId, expRaw] = parts;
    const mac = parts[parts.length - 1];
    const returnTo = parts.length >= 4 ? parts[2] : "";
    const codeVerifier = parts.length === 5 ? parts[3] : "";
    if (!userId || !expRaw || !mac) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    let payload: string;
    if (parts.length === 5) payload = `${userId}|${exp}|${returnTo}|${codeVerifier}`;
    else if (parts.length === 4) payload = `${userId}|${exp}|${returnTo}`;
    else payload = `${userId}|${exp}`;
    const expected = await stateHmac(payload);
    if (mac !== expected) return null;
    return {
      userId,
      returnTo: returnTo && CONNECT_RETURN_TOS.has(returnTo) ? returnTo : null,
      codeVerifier: codeVerifier || null,
    };
  } catch {
    return null;
  }
}

/** RFC 7636 PKCE pair: a random code_verifier and its S256 code_challenge. Used for
 *  providers whose org/security policy requires PKCE even on confidential
 *  (client_secret-bearing) Web Server flows - e.g. Salesforce orgs with "Require PKCE"
 *  enabled, which reject an authorize request with no code_challenge. */
export async function makePkcePair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const codeVerifier = bytesToBase64Url(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = bytesToBase64Url(new Uint8Array(digest));
  return { codeVerifier, codeChallenge };
}

// ---- ConnectorAdapter ----

function bearerOf(auth: ResolvedAuth): string | null {
  return auth.kind === "gateway" ? null : auth.token;
}

export const githubAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    try {
      if (auth.kind === "github_app") {
        const { login } = await getInstallationAccount(auth.installationId);
        return { ok: true, accountLabel: login };
      }
      const token = bearerOf(auth);
      if (!token) return { ok: false, detail: "unsupported auth kind for github" };
      const res = await fetch(`${GH_API}/user`, {
        headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, detail: `GitHub token check failed (${res.status})` };
      const body = (await res.json()) as { login?: string };
      return { ok: true, accountLabel: body.login ?? null };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  },

  async listResources(auth, kind, opts): Promise<ResourceItem[]> {
    if (kind !== "repo") return [];
    const token = bearerOf(auth);
    if (!token) return [];
    // Installation tokens list the repos the installation can see; PAT/env
    // tokens fall back to the caller's own repos.
    const url =
      auth.kind === "github_app"
        ? `${GH_API}/installation/repositories?per_page=100`
        : `${GH_API}/user/repos?per_page=100&sort=updated`;
    const res = await fetch(url, {
      headers: { ...GH_HEADERS, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(
        `GitHub repo listing failed (${res.status}): ${(await res.text()).slice(0, 200)}`,
      );
    }
    const body = (await res.json()) as
      { repositories?: { full_name?: string }[] } | { full_name?: string }[];
    const repos = Array.isArray(body) ? body : (body.repositories ?? []);
    const q = opts?.q?.toLowerCase();
    return repos
      .map((r) => r.full_name)
      .filter((name): name is string => !!name)
      .filter((name) => !q || name.toLowerCase().includes(q))
      .map((name) => ({ id: name, label: name }));
  },
};

// ---- resolveGitHub — the entry point for every GitHub call site ----

async function actorLabelFor(auth: ResolvedAuth): Promise<string> {
  if (auth.kind === "env") return "env token";
  try {
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { data } = await admin
      .from("connections")
      .select("account_label")
      .eq("id", auth.connectionRowId)
      .maybeSingle();
    if (data?.account_label) return data.account_label as string;
  } catch {
    /* label is cosmetic — fall through */
  }
  return "Supaprod GitHub App";
}

/**
 * Whether the deployment-wide `GITHUB_REPO` may stand in for this workspace.
 *
 * It may not, ever, for a NAMED workspace: one repo for the whole deployment
 * cannot be the right answer for two tenants. Kept as a named function rather
 * than inlined `false` so the rule is greppable and its reason has somewhere to
 * live, and so a future single-tenant deployment has one obvious place to change.
 */
function envRepoIsBoundTo(_workspaceId: string): boolean {
  return false;
}

export async function resolveGitHub(args: {
  userId?: string | null;
  workspaceId?: string | null;
  /** Product-scoped repo binding override (BYO-P1b); most specific, wins over workspace. */
  productId?: string | null;
  userClient?: SupabaseClient;
  /** Optional per-run cache to avoid redundant credential chain re-queries across multiple GitHub tool calls. */
  cache?: ProviderAuthCache;
}): Promise<{
  token: string;
  repo: string;
  source: "binding" | "user_connection" | "env";
  actorLabel: string;
}> {
  const resolved = await resolveProviderAuth({
    userClient: args.userClient,
    userId: args.userId,
    workspaceId: args.workspaceId,
    productId: args.productId,
    provider: "github",
    resourceKind: "repo",
    cache: args.cache,
  });
  if (!resolved.auth) throw new Error(NOT_CONNECTED_ERROR);
  const token = bearerOf(resolved.auth);
  if (!token) throw new Error(NOT_CONNECTED_ERROR);

  if (resolved.source === "workspace_binding" && resolved.binding) {
    const repo = normalizeGithubRepo(resolved.binding.resourceId);
    if (!repo) {
      throw new Error(
        `GitHub binding has an invalid repo "${resolved.binding.resourceId}". Expected owner/name. Re-bind the repo on Connectors.`,
      );
    }
    return { token, repo, source: "binding", actorLabel: await actorLabelFor(resolved.auth) };
  }

  const envRepo = process.env.GITHUB_REPO ? normalizeGithubRepo(process.env.GITHUB_REPO) : null;

  /*
   * ── A WORKSPACE MUST NOT INHERIT ANOTHER TENANT'S REPOSITORY ─────────────
   *
   * `GITHUB_REPO` is ONE repo for the whole deployment. Below, an unbound
   * workspace fell through to it, which means any workspace without a binding
   * of its own would stage, commit and open pull requests against whatever
   * repository that variable happens to name.
   *
   * MEASURED 2026-08-27: `studio_changesets` holds rows against
   * `RohitGajaraj/Test-Project-Cadence` from FOUR different workspaces —
   * `0b792d52`, `482bdbb2`, `11ea33b6` and `b90da531` — none of which is bound
   * to it. It has been harmless so far because those are fixtures and that
   * token is dead, but the path is real and it writes code.
   *
   * The env fallback's own comment says it "keeps current behavior alive until
   * bindings exist". Bindings exist. So it survives only where there is no
   * workspace to be wrong about: a script or a dev shell with no tenant context.
   * **A named workspace with no binding is refused, and told exactly that.**
   *
   * This is the direction to be wrong in. Refusing costs a person one trip to
   * Connectors; the alternative writes a customer's spec into a repository
   * belonging to somebody else.
   */
  if (args.workspaceId && !envRepoIsBoundTo(args.workspaceId)) {
    throw new Error(
      "No repository is connected for this workspace. Bind one on Connectors, and this will run. " +
        "It will not borrow another workspace's repository.",
    );
  }

  if (resolved.source === "user_connection") {
    // Connected account but no workspace binding: only usable when the legacy
    // env still names the repo.
    if (!envRepo) throw new Error(NOT_CONNECTED_ERROR);
    return {
      token,
      repo: envRepo,
      source: "user_connection",
      actorLabel: await actorLabelFor(resolved.auth),
    };
  }

  // env source
  if (!envRepo) throw new Error(NOT_CONNECTED_ERROR);
  return { token, repo: envRepo, source: "env", actorLabel: "env token" };
}

/**
 * A person's own words for `resolveGitHub`'s `source`, so a failure can name
 * WHICH credential the attempt used, not just that it failed (P-122,
 * A-QUEUE.md). Live 06:32 UTC 09-04: a failed preview retry's row said only
 * "The repository's main branch could not be read (403)" -- true, and
 * useless for telling a stale token apart from a wrong one, because nothing
 * on the row said which of the workspace's connections had even been tried.
 */
export function githubAuthSourceLabel(source: "binding" | "user_connection" | "env"): string {
  if (source === "binding") return "the workspace's GitHub connection";
  if (source === "user_connection") return "your own GitHub connection";
  return "the deployment's shared GitHub token";
}

/** "read with the workspace's GitHub connection as supaprod-connector" --
 *  appended to a failure reason once a credential was actually resolved and
 *  used, so a 403 from GitHub itself can be explained from the record
 *  without a second trip to the logs. */
export function readWithLine(gh: { source: "binding" | "user_connection" | "env"; actorLabel: string }): string {
  return `read with ${githubAuthSourceLabel(gh.source)} as ${gh.actorLabel}`;
}
