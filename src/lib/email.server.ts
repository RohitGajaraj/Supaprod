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

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Override the default sender. Lifecycle mail signs as a person; the product's
   *  own notifications stay on the neutral `notifications@` identity. */
  from?: string;
  /** Where a human reply lands. Worth setting whenever the copy asks for one,
   *  because the default From is a mailbox nobody is watching for conversation. */
  replyTo?: string;
  /** Extra RFC headers, notably `List-Unsubscribe` and `List-Unsubscribe-Post`.
   *  Gmail and Yahoo require one-click unsubscribe (RFC 8058) from bulk senders
   *  and the volume threshold is lower than people assume, so anything that goes
   *  to a list rather than to one person should set these. */
  headers?: Record<string, string>;
};
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
        from: input.from ?? cfg.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? undefined,
        reply_to: input.replyTo ?? undefined,
        headers: input.headers ?? undefined,
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

/**
 * One shell for every HTML email we send: a small branded header, the body, a
 * hairline, and whatever footer the caller owns.
 *
 * WHY THIS EXISTS. The founder read the first real send on a phone and called it
 * unprofessional, correctly: it was bare text with no mark anywhere, and the
 * sender avatar beside it was Gmail's grey silhouette.
 *
 * WHAT THIS CANNOT FIX, said here so nobody goes looking for the bug. That grey
 * avatar is BIMI, and BIMI needs DMARC at p=quarantine or p=reject (we publish
 * p=none), plus a Verified Mark Certificate, which needs a REGISTERED TRADEMARK
 * and costs four figures a year. No email HTML can reach it. See
 * docs/growth/brand-ops/trademark-brief-supaprod.md; it becomes available after
 * incorporation and a filing, and not before.
 *
 * THE LOGO MUST NOT BE LOAD-BEARING. A large share of recipients read with
 * remote images blocked, and Gmail proxies what it does load. So the mark is
 * decoration with a real `alt`, the layout does not depend on it, and every
 * email still reads completely as text. That is the rule
 * docs/growth/email-sequences.md section 7 already sets, and a logo is the most
 * common way people break it.
 *
 * Inline styles only, no <style> block, no flexbox, no grid. Mail clients strip
 * heads and Outlook renders through Word. A table would be the belt-and-braces
 * choice; a single centred div is enough for one image over one column of text
 * and degrades to plain blocks everywhere it is not understood.
 */
export function emailShell(bodyHtml: string): string {
  // Absolute, because a relative path in a mail client resolves against the mail
  // client. 192 is the smallest asset that stays crisp when a retina phone draws
  // it at 36 CSS pixels.
  const mark = absoluteUrl("/icon-192.png");
  return [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px 24px 32px;">`,
    `<div style="margin:0 0 22px;">`,
    // Height and width both set: an unloaded image with no dimensions collapses
    // and the text jumps when it arrives.
    `<img src="${mark}" width="36" height="36" alt="Supaprod" style="display:block;border:0;border-radius:8px;" />`,
    `</div>`,
    bodyHtml,
    `</div>`,
  ].join("");
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
