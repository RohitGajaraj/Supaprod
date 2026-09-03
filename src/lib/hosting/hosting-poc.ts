/**
 * BYO-P5 P5b: the "Supaprod-hosted" proof-of-concept deploy.
 *
 * Plan (`docs/planning/byo-p5-managed-runtime-plan.md`, Section 5, P5b row):
 * "the smallest viable technical slice: a founder-only toggle on a Product
 * that provisions a real but minimal deploy... No DB wiring, no billing, not
 * user-facing." Founder picked the Deno Deploy path (2026-07-02): P5a-poc
 * already proved `denoDeployProvider` live at $0, so P5b wires that same
 * adapter to a real Product instead of a throwaway test slug.
 *
 * Pure orchestration only (no Supabase, no env reads), mirroring the
 * provider.ts / *.server.ts split: this file is unit-testable against any
 * {@link AppRuntimeProvider}, real or fake. `hosting-poc.functions.ts` is
 * the thin server-fn wrapper that resolves the real provider + project row.
 */
import type { AppRuntimeHandle, AppRuntimeProvider, AppRuntimeRef } from "./provider";

/** Escapes the five HTML-significant characters; the shell is static-only, never executed, but a project name is still untrusted user input. */
export function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

/** The minimal static shell P5b deploys: proves the round trip, nothing more (no framework, no DB, no auth). */
export function minimalShellHtml(projectName: string): string {
  const safeName = escapeHtml(projectName);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeName} · hosted by Supaprod</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family: system-ui, sans-serif; padding: 64px 24px; text-align: center; color: #1a1a1a;">
<h1 style="font-size: 28px; margin-bottom: 8px;">${safeName}</h1>
<p style="color: #666; margin: 0;">Hosted by Supaprod · BYO-P5 proof of concept.</p>
</body>
</html>`;
}

export type HostingPocOutcome =
  | { ok: true; url: string; deploymentId: string; providerId: AppRuntimeProvider["providerId"] }
  | { ok: false; reason: "not_configured" | "provider_error"; message: string };

/**
 * Provisions (idempotently) and deploys the minimal shell for one product.
 *
 * `provisionApp`'s slug is deterministic from `ref.hostedAppId` (see
 * `deno-deploy.server.ts`'s `slugFor`), so a second call for the same
 * product legitimately conflicts (app already exists) — `deploy` re-derives
 * the slug from `ref` alone and never reads anything off the `provisionApp`
 * response, so that specific conflict is not a real failure. But
 * `provisionApp` can also throw for a REAL reason (bad token, quota,
 * provider outage), indistinguishable from a conflict at this generic
 * `AppRuntimeProvider` boundary (no status code is exposed in the
 * interface). So: keep going into `deploy()` either way (that's what makes
 * the toggle safe to click twice), but remember the provisionApp error; if
 * `deploy()` ALSO fails, that is the signal the provisionApp failure was
 * real, not a harmless conflict — surface both messages instead of
 * silently discarding the first one.
 */
export async function deployHostingPoc(
  provider: AppRuntimeProvider,
  ref: AppRuntimeRef,
  projectName: string,
): Promise<HostingPocOutcome> {
  if (!provider.available) {
    return {
      ok: false,
      reason: "not_configured",
      message: "The hosting provider is not configured (missing credentials).",
    };
  }

  let handle: AppRuntimeHandle = { providerId: provider.providerId, ref };
  let provisionError: string | null = null;
  try {
    handle = await provider.provisionApp(ref, { dedicatedDb: false });
  } catch (e) {
    provisionError = e instanceof Error ? e.message : String(e);
  }

  let result;
  try {
    result = await provider.deploy(
      handle,
      { files: [{ path: "index.html", content: minimalShellHtml(projectName) }] },
      {},
    );
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      reason: "provider_error",
      message: provisionError
        ? `Deploy threw: ${detail} (provisioning had also failed: ${provisionError})`
        : `Deploy threw: ${detail}`,
    };
  }

  if (result.status !== "success" || !result.url) {
    // P-39: `result.detail` carries the provider's own HTTP status and body
    // when the failure is a real one, not a bare "failure" with no reason.
    const why = result.detail ? ` (${result.detail})` : "";
    return {
      ok: false,
      reason: "provider_error",
      message: provisionError
        ? `Deploy did not succeed (status: ${result.status}${why}); provisioning had also failed: ${provisionError}`
        : `Deploy did not succeed (status: ${result.status}${why}).`,
    };
  }

  return {
    ok: true,
    url: result.url,
    deploymentId: result.deploymentId,
    providerId: provider.providerId,
  };
}
