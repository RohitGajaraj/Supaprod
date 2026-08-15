// Jira connector adapter (server-only).
//
// WHY IT EXISTS. Jira was `stubAdapter`, so Verify told anyone who had completed
// the Atlassian OAuth round trip that their connection had failed. Same reported
// defect that does not exist as figma, on the same control.
//
// ATLASSIAN 3LO DOES NOT TALK TO THE SITE DIRECTLY. An OAuth token is exchanged
// against `api.atlassian.com`, not against `yourcompany.atlassian.net`, and which
// sites the grant covers is a separate lookup. That is why this validates against
// `/me` rather than against a Jira REST endpoint: `/me` needs no site id, so it
// answers "is this credential alive" without first having to answer "which site",
// and a credential check that depended on resource selection would report a
// perfectly good token as broken on a workspace that has not bound a site yet.
//
// Jira declares no `envFallback` in the registry, so there is no admin-key path.
import type { ConnectorAdapter, ResourceItem, ValidateResult } from "./types.server";
import { tokenBearer } from "./bearer.server";

export const ATLASSIAN_API = "https://api.atlassian.com";

export const jiraAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const token = tokenBearer(auth);
    if (!token) return { ok: false, detail: "unsupported auth kind for jira" };
    try {
      const res = await fetch(`${ATLASSIAN_API}/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) {
        return { ok: false, detail: `Atlassian rejected the credential (${res.status})` };
      }
      const body = (await res.json()) as {
        name?: string | null;
        email?: string | null;
        nickname?: string | null;
      };
      return {
        ok: true,
        accountLabel: body.name ?? body.nickname ?? null,
        accountEmail: body.email ?? null,
      };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  },

  /**
   * The Jira sites this grant can reach.
   *
   * The registry declares a `site` resource type for Jira, and until now nothing
   * could enumerate one, so binding a workspace to a site meant knowing its id by
   * heart. `accessible-resources` is the only endpoint that answers this, and it
   * is the same list Atlassian shows during consent.
   *
   * Returns an empty list rather than throwing on failure, matching the adapter
   * contract: a resource picker with nothing in it is a state the surface can
   * render, and an exception is not.
   */
  async listResources(auth, kind): Promise<ResourceItem[]> {
    if (kind !== "site") return [];
    const token = tokenBearer(auth);
    if (!token) return [];
    try {
      const res = await fetch(`${ATLASSIAN_API}/oauth/token/accessible-resources`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return [];
      const body = (await res.json()) as Array<{ id?: string; name?: string; url?: string }>;
      return (Array.isArray(body) ? body : []).flatMap((s) =>
        s.id ? [{ id: s.id, label: s.name ?? s.url ?? s.id }] : [],
      );
    } catch {
      return [];
    }
  },
};
