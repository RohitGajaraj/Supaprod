/**
 * Real `validate()` for Linear, Notion and Google Docs.
 *
 * WHAT WAS WRONG. All three were `stubAdapter`, whose validate returns
 * `{ ok: false, detail: "adapter not implemented" }`. `verifyConnection` in
 * connections.functions.ts is what the "Test it" control calls, so a person who
 * had just completed a perfectly good OAuth round trip pressed Test it and was
 * told their connection had failed. That is worse than no button: it reports a
 * defect that does not exist, at the exact moment somebody is deciding whether to
 * trust the product with their data.
 *
 * These three specifically, and not the other eight stubs, because the transports
 * are already built and vendor-confirmed: routing their feature code through the
 * credential chokepoint required knowing exactly how each provider takes a token,
 * and `directHeaders` holds that. The remaining stubs (the calendar and mail
 * family, figma, jira) need their own transports first and are a separate pass.
 *
 * THE HEADER RULES ARE IMPORTED, NEVER RESTATED. Linear takes an OAuth token as
 * `Bearer` and a `lin_api_` personal key raw; Notion requires `Notion-Version` on
 * every request. A second copy of either would be a second thing to get wrong, and
 * the whole reason gateway-era.server.ts exists is that this knowledge had been
 * scattered before.
 */
import type { ConnectorAdapter, ValidateResult } from "./types.server";
import type { ResolvedAuth } from "../resolve.server";
import { __testing as transport } from "../gateway-era.server";

/**
 * The credential, when this adapter can use it directly.
 *
 * `token` is a per-user OAuth grant or a workspace binding's. `env` is the
 * admin-configured fallback, and whether it works directly depends on the
 * provider, which is why each adapter below decides rather than this helper.
 *
 * `github_app` and `gateway` return null: neither is a provider bearer token, and
 * guessing would produce an authentication failure that reads like a bad
 * credential rather than an unsupported one.
 */
function directToken(auth: ResolvedAuth): { token: string; fromEnv: boolean } | null {
  if (auth.kind === "token") return { token: auth.token, fromEnv: false };
  if (auth.kind === "env") return { token: auth.token, fromEnv: true };
  return null;
}

/** One shape for every failure, so a caller never has to parse prose. */
function failed(label: string, status: number): ValidateResult {
  // The status is the useful half: 401 means the credential, 403 means the scope,
  // and 5xx means the provider. Naming the provider keeps it readable when several
  // connections are being tested at once.
  return { ok: false, detail: `${label} rejected the credential (${status})` };
}

function threw(e: unknown): ValidateResult {
  return { ok: false, detail: e instanceof Error ? e.message : String(e) };
}

export const linearAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const cred = directToken(auth);
    if (!cred) return { ok: false, detail: "unsupported auth kind for linear" };
    try {
      // The same query linear/callback.ts runs after a grant, so a connection
      // that validated at creation validates here for the same reason.
      const res = await fetch(transport.DIRECT.linear, {
        method: "POST",
        headers: transport.directHeaders("linear", cred.token),
        body: JSON.stringify({ query: "{ viewer { name email } organization { name } }" }),
      });
      if (!res.ok) return failed("Linear", res.status);
      const body = (await res.json()) as {
        data?: { viewer?: { name?: string; email?: string }; organization?: { name?: string } };
        errors?: Array<{ message?: string }>;
      };
      // GRAPHQL ANSWERS 200 AND THEN SAYS NO. An expired token comes back as a
      // 200 carrying an errors array, so checking res.ok alone would report a
      // dead credential as healthy, which is the failure direction that matters
      // for a control whose whole job is telling you the truth about it.
      if (body.errors?.length) {
        return { ok: false, detail: body.errors[0]?.message ?? "Linear refused the query" };
      }
      const name = body.data?.viewer?.name ?? null;
      const org = body.data?.organization?.name ?? null;
      return {
        ok: true,
        accountLabel: name && org ? `${name} - ${org} (Linear)` : (org ?? name),
        accountEmail: body.data?.viewer?.email ?? null,
      };
    } catch (e) {
      return threw(e);
    }
  },
};

export const notionAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const cred = directToken(auth);
    if (!cred) return { ok: false, detail: "unsupported auth kind for notion" };
    try {
      // `users/me` is the cheapest authenticated read Notion offers and needs no
      // capability beyond the integration existing.
      const res = await fetch(`${transport.DIRECT.notion}/users/me`, {
        headers: transport.directHeaders("notion", cred.token),
      });
      if (!res.ok) return failed("Notion", res.status);
      const body = (await res.json()) as {
        name?: string | null;
        bot?: { workspace_name?: string | null; owner?: { user?: { person?: { email?: string } } } };
        person?: { email?: string | null };
      };
      // A Notion integration authenticates as a BOT, so the useful label is the
      // workspace it was installed into rather than the bot's own name.
      return {
        ok: true,
        accountLabel: body.bot?.workspace_name ?? body.name ?? null,
        accountEmail: body.person?.email ?? body.bot?.owner?.user?.person?.email ?? null,
      };
    } catch (e) {
      return threw(e);
    }
  },
};

export const googleDocsAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const cred = directToken(auth);
    if (!cred) return { ok: false, detail: "unsupported auth kind for google_docs" };
    /**
     * AN API KEY CANNOT IDENTIFY AN ACCOUNT, and saying so is the honest answer.
     *
     * Google API keys authorize a PROJECT, not a person: they carry no identity
     * and Drive refuses them for any per-user read. So probing the env fallback
     * would fail for a reason that has nothing to do with whether the admin
     * configured it correctly, and reporting that as a broken connection would be
     * the same lie the stub told, arrived at more expensively.
     */
    if (cred.fromEnv) {
      return {
        ok: false,
        detail:
          "This is set up with a shared admin key, which carries no account, so there is nothing to test here. Connect your own Google account to check it.",
      };
    }
    try {
      // Drive's `about` is the identity read the requested drive.readonly scope
      // already covers, so this needs no scope the connect flow did not ask for.
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)",
        { headers: transport.directHeaders("google_docs", cred.token) },
      );
      if (!res.ok) return failed("Google", res.status);
      const body = (await res.json()) as {
        user?: { displayName?: string | null; emailAddress?: string | null };
      };
      return {
        ok: true,
        accountLabel: body.user?.displayName ?? null,
        accountEmail: body.user?.emailAddress ?? null,
      };
    } catch (e) {
      return threw(e);
    }
  },
};
