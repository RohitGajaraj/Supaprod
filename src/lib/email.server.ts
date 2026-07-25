/**
 * Pluggable transactional email (server-only).
 *
 * FS-03 wired the seam this file always reserved: a raw HTTP call to Resend's
 * REST API (no SDK, matching the observability facade's style in
 * src/lib/observability/errors.ts), env-gated no-op without RESEND_API_KEY,
 * never throws. Vendor swap = replace this file. Doctrine names this exact
 * path: docs/strategy/build-buy-integrate.md "Transactional email |
 * INTEGRATE (`email.server.ts`) | Resend".
 */

export type EmailConfig = {
  apiKey: string | null;
  from: string;
  enabled: boolean;
};

const RESEND_URL = "https://api.resend.com/emails";

/** Read once per request; `process.env` is only populated inside a server-fn / route handler. */
export function readEmailConfig(): EmailConfig {
  const env = (typeof process !== "undefined" ? process.env : {}) as Record<
    string,
    string | undefined
  >;
  const apiKey = env.RESEND_API_KEY?.trim() || null;
  return {
    apiKey,
    from: env.RESEND_FROM_EMAIL?.trim() || "Supaprod <notifications@supaprod.ai>",
    enabled: !!apiKey,
  };
}

export type SendEmailInput = { to: string; subject: string; text: string; html?: string };
export type SendEmailResult = { sent: boolean; reason: string };

/** Fire-and-report, never throws. No-ops honestly when RESEND_API_KEY is absent. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const cfg = readEmailConfig();
  if (!cfg.enabled) {
    return { sent: false, reason: "email delivery not configured (RESEND_API_KEY absent)" };
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cfg.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? undefined,
      }),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      return { sent: false, reason: `Resend ${res.status}: ${body}` };
    }
    return { sent: true, reason: "sent" };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send failed" };
  }
}

/** The public origin this deployment serves from, with no trailing slash.
 *
 * Anything that travels outside the browser (invite mail, digests, webhooks)
 * has to carry an absolute URL: a bare path is not clickable in a mail client.
 * Override per environment with APP_ORIGIN. */
export function appOrigin(): string {
  const raw = process.env.APP_ORIGIN?.trim();
  return (raw && raw.length > 0 ? raw : "https://supaprod.ai").replace(/\/+$/, "");
}

/** Join a root-relative path onto {@link appOrigin}. Absolute inputs pass through. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${appOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export type InviteEmail = {
  to: string;
  inviteLink: string;
  workspaceName?: string;
};

export type EmailResult = { sent: boolean; link: string };

/**
 * Send a workspace-invite email. Returns the link either way so the caller can always
 * surface it for copy-paste; `sent` reflects whether Resend actually delivered it (a
 * no-op without a key, or a delivery failure, must never block creating the invitation).
 */
export async function sendInviteEmail(args: InviteEmail): Promise<EmailResult> {
  const subject = args.workspaceName
    ? `You are invited to join ${args.workspaceName} on Supaprod`
    : "You are invited to join a workspace on Supaprod";
  const text = `You have been invited to join a Supaprod workspace.\n\nJoin here: ${args.inviteLink}`;
  const { sent } = await sendEmail({ to: args.to, subject, text });
  return { sent, link: args.inviteLink };
}
