// Figma connector adapter (server-only).
//
// WHY IT EXISTS. Figma was `stubAdapter`, whose validate returns
// `{ok: false, detail: "adapter not implemented"}`, and `verifyConnection` is what
// the Verify control on the connections detail page calls. So a person who had
// completed the Figma OAuth round trip pressed Verify and was told their
// connection had failed. That is a reported defect that does not exist, and it
// lands at the moment somebody is deciding whether to trust the product.
//
// TWO CREDENTIAL SHAPES, TWO DIFFERENT HEADERS, and getting it wrong fails
// authentication on a token that is perfectly valid. Figma's own docs are explicit:
// a personal access token goes in `X-Figma-Token`, and an OAuth2 token goes in
// `Authorization: Bearer`. Our flow is `oauth_native`, so Bearer is the normal
// path; the personal-token branch exists because a `figd_` value is unmistakable
// and answering it correctly costs one line, where answering it wrongly looks
// exactly like a revoked grant.
//
// Figma declares no `envFallback` in the registry, so there is no admin-key path
// to consider here.
import type { ConnectorAdapter, ValidateResult } from "./types.server";
import { tokenBearer } from "./bearer.server";

export const FIGMA_API = "https://api.figma.com";

/** Figma personal access tokens carry this prefix. OAuth tokens do not. */
const PERSONAL_TOKEN_PREFIX = "figd_";

/** The header this exact credential belongs in. Exported so a test can pin it. */
export function figmaAuthHeader(token: string): Record<string, string> {
  return token.startsWith(PERSONAL_TOKEN_PREFIX)
    ? { "X-Figma-Token": token }
    : { Authorization: `Bearer ${token}` };
}

export const figmaAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const token = tokenBearer(auth);
    if (!token) return { ok: false, detail: "unsupported auth kind for figma" };
    try {
      // `/v1/me` is the cheapest authenticated read Figma offers and needs no
      // scope beyond the grant existing.
      const res = await fetch(`${FIGMA_API}/v1/me`, { headers: figmaAuthHeader(token) });
      if (!res.ok) return { ok: false, detail: `Figma rejected the credential (${res.status})` };
      const body = (await res.json()) as {
        handle?: string | null;
        email?: string | null;
      };
      return {
        ok: true,
        // The handle is what a person recognises in Figma; the email is the
        // account it belongs to.
        accountLabel: body.handle ?? null,
        accountEmail: body.email ?? null,
      };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  },
};
