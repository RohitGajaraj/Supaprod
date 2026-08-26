/**
 * Real `validate()` for the mail and calendar family: Gmail, Outlook Mail and
 * Microsoft Outlook (calendar).
 *
 * WHAT WAS WRONG, and it is the same defect three more times.
 * All three were `stubAdapter`, whose validate returns
 * `{ ok: false, detail: "adapter not implemented" }`. `verifyConnection` in
 * connections.functions.ts is what the "Test it" control calls, so a person who
 * had completed a perfectly good OAuth round trip pressed it and was told their
 * connection had failed — a reported defect that does not exist, shown at the
 * moment somebody is deciding whether to trust the product with their mail.
 *
 * `gateway-era-adapters.server.ts` fixed linear, notion and google_docs on
 * 2026-08-15 and said plainly why it stopped there: *"The remaining stubs (the
 * calendar and mail family, figma, jira) need their own transports first and are
 * a separate pass."* figma and jira got theirs. **This is that pass for the mail
 * family**, and the transports are no longer unknown — the ingest code has been
 * calling both vendors with a plain bearer for as long as it has existed:
 *   `gmail-ingest.server.ts:17,58`        GET https://www.googleapis.com/gmail/v1/users/me
 *                                          headers: { Authorization: `Bearer ${token}` }
 *   `outlook-mail-ingest.server.ts:14,50`  GET https://graph.microsoft.com/v1.0/me/messages
 *                                          headers: { Authorization: `Bearer ${token}` }
 * So nothing here is invented. Each probe is the cheapest identity read its
 * vendor offers, and **every scope it needs is already requested by that
 * provider's own `authMethods` in registry.ts** — gmail asks for
 * `gmail.readonly`, and both Microsoft entries ask for `User.Read`. A validate
 * that needed a scope the connect flow never requested would fail on a healthy
 * grant, which is the failure direction this file exists to remove.
 *
 * WHY THIS MATTERS BEYOND THE BUTTON. Authorised gap #2 is that nothing reaches a
 * person who left the page, and the fourth connector that carries the loop is
 * *"Slack or email reaching a person who left"*. Slack has ingest and a digest;
 * email's adapter said "not implemented". F-81.
 */
import type { ConnectorAdapter, ValidateResult } from "./types.server";
import type { ResolvedAuth } from "../resolve.server";

/** Gmail's REST base, the same one `gmail-ingest.server.ts` calls. */
export const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";
/** Microsoft Graph, the same host `outlook-mail-ingest.server.ts` calls. */
export const GRAPH_API = "https://graph.microsoft.com/v1.0";

/**
 * The credential, when this adapter can use it directly.
 *
 * Deliberately identical in shape to `gateway-era-adapters.server.ts`'s helper:
 * `github_app` and `gateway` are not provider bearer tokens, and guessing would
 * produce an authentication failure that reads like a bad credential rather than
 * an unsupported one.
 */
function directToken(auth: ResolvedAuth): { token: string; fromEnv: boolean } | null {
  if (auth.kind === "token") return { token: auth.token, fromEnv: false };
  if (auth.kind === "env") return { token: auth.token, fromEnv: true };
  return null;
}

/** One shape for every failure, so a caller never has to parse prose. */
function failed(label: string, status: number): ValidateResult {
  // The status is the useful half: 401 is the credential, 403 is the scope, 5xx
  // is the provider.
  return { ok: false, detail: `${label} rejected the credential (${status})` };
}

function threw(e: unknown): ValidateResult {
  return { ok: false, detail: e instanceof Error ? e.message : String(e) };
}

/**
 * A SHARED ADMIN KEY CANNOT IDENTIFY AN ACCOUNT, and saying so is the honest
 * answer — the same call `googleDocsAdapter` makes and for the same reason.
 *
 * Every probe below is a per-user read (`/users/me/profile`, `/me`). A Google API
 * key authorizes a PROJECT and a Microsoft app-only token has no signed-in user,
 * so both would be refused for a reason that has nothing to do with whether the
 * admin configured the fallback correctly. Reporting that as a broken connection
 * would be the same lie the stub told, arrived at more expensively.
 */
function noAccountToTest(vendor: string): ValidateResult {
  return {
    ok: false,
    detail: `This is set up with a shared admin key, which carries no account, so there is nothing to test here. Connect your own ${vendor} account to check it.`,
  };
}

export const gmailAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const cred = directToken(auth);
    if (!cred) return { ok: false, detail: "unsupported auth kind for gmail" };
    if (cred.fromEnv) return noAccountToTest("Google");
    try {
      // `/profile` is the cheapest authenticated read Gmail offers and the
      // `gmail.readonly` scope the connect flow already requests covers it.
      const res = await fetch(`${GMAIL_API}/profile`, {
        headers: { Authorization: `Bearer ${cred.token}` },
      });
      if (!res.ok) return failed("Gmail", res.status);
      const body = (await res.json()) as { emailAddress?: string | null };
      // Gmail's profile carries the address and no display name, so the address
      // is both the label a person recognises and the account it belongs to.
      return {
        ok: true,
        accountLabel: body.emailAddress ?? null,
        accountEmail: body.emailAddress ?? null,
      };
    } catch (e) {
      return threw(e);
    }
  },
};

/**
 * `/me` on Microsoft Graph, shared by both Microsoft entries.
 *
 * They are NOT duplicates and the labels hide it: `microsoft_outlook` is the
 * CALENDAR connector (`Calendars.ReadWrite`, labelled "Microsoft Outlook") and
 * `microsoft_mail` is the MAIL one (`Mail.Read`, labelled "Outlook Mail"). Both
 * request `User.Read`, which is exactly and only what this probe needs, so one
 * implementation serves both without either borrowing the other's scope.
 */
async function graphMe(token: string, label: string): Promise<ValidateResult> {
  try {
    const res = await fetch(`${GRAPH_API}/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return failed(label, res.status);
    const body = (await res.json()) as {
      displayName?: string | null;
      mail?: string | null;
      userPrincipalName?: string | null;
    };
    // A work account often carries no `mail` and only a UPN, which is still the
    // address the person knows themselves by.
    return {
      ok: true,
      accountLabel: body.displayName ?? null,
      accountEmail: body.mail ?? body.userPrincipalName ?? null,
    };
  } catch (e) {
    return threw(e);
  }
}

export const microsoftMailAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const cred = directToken(auth);
    if (!cred) return { ok: false, detail: "unsupported auth kind for microsoft_mail" };
    if (cred.fromEnv) return noAccountToTest("Microsoft");
    return graphMe(cred.token, "Outlook Mail");
  },
};

export const microsoftOutlookAdapter: ConnectorAdapter = {
  async validate(auth): Promise<ValidateResult> {
    const cred = directToken(auth);
    if (!cred) return { ok: false, detail: "unsupported auth kind for microsoft_outlook" };
    if (cred.fromEnv) return noAccountToTest("Microsoft");
    return graphMe(cred.token, "Microsoft Outlook");
  },
};
