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
export function emailShell(
  bodyHtml: string,
  opts?: { kicker?: string; headline?: string },
): string {
  // THE MARK ANSWERS TO ITS GROUND, founder 2026-08-07. Every other mark in
  // public/ carries its own ground: apple-touch-icon and icon-192 are a dark
  // rounded tile, the favicon a dark disc. Correct for an app icon, whose
  // background is unknown; wrong here, where dropping a near-black tile onto the
  // ember band would put a dark square on orange. mark-white.png is the mark
  // alone on transparency, generated by
  // docs/growth/branding/generate-email-marks.ts.
  //
  // IF IT 404s THE BAND STILL WORKS, which is the property that matters and is
  // why this is safe to switch. The identity is carried by the ember and the
  // type, not the tile: a failed load leaves the white alt text on ember, which
  // is legible. That is deliberate insurance, because icon-192 taught the lesson
  // the expensive way. .gitignore carries a blanket `*.png`, so icon-192 and
  // icon-512 were never committed, returned 404 in production, and shipped a
  // broken image into somebody's inbox where it cannot be corrected.
  //
  // VERIFY WITH curl AFTER EVERY DEPLOY, never with `ls public/`. A file on disk
  // is not a file on the origin.
  const mark = absoluteUrl("/mark-white.png");
  // A TILED TEXTURE, and it is safe precisely because it can fail. bgcolor stays
  // underneath, so a client that ignores the background image (Outlook without
  // VML) or blocks it (most, until the reader clicks) sees the flat ember band we
  // already had. Worst case is the status quo, best case is a texture, so the
  // change carries no downside. Generated by generate-email-marks.ts at 5 to 9
  // percent white: a pattern a reader NOTICES behind body copy has failed.
  const texture = absoluteUrl("/email-band-texture.png");
  // A TABLE, not a div, and only here. Outlook on Windows renders through Word,
  // which ignores background on a div but honours bgcolor on a td. This band is
  // the one element whose colour is the point, so it is the one element worth
  // writing in 2003 HTML. bgcolor AND the CSS background are both set because
  // different clients read different ones.
  // The mark and the headline share ONE ember cell. Two stacked tables would
  // hairline-crack between them in Outlook, which renders a visible seam through
  // the middle of the band on exactly the client least able to fix it.
  const band = [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">`,
    `<tr><td bgcolor="${EMBER_DEEP}" style="background:${EMBER_DEEP} url('${texture}') repeat;background-color:${EMBER_DEEP};padding:26px 28px 30px;">`,
    // Width and height BOTH set so an unloaded image reserves its box instead of
    // collapsing and shoving the band's text upward when it arrives.
    `<img src="${mark}" width="34" height="34" alt="Supaprod" style="display:block;border:0;margin:0 0 20px;" />`,
    opts?.kicker
      ? `<p style="margin:0 0 10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#FFD9C2;">${opts.kicker}</p>`
      : "",
    opts?.headline
      ? `<p style="margin:0;font-size:23px;line-height:1.28;font-weight:700;color:#ffffff;">${opts.headline}</p>`
      : "",
    `</td></tr>`,
    `</table>`,
  ].join("");

  return [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f1b16;">`,
    band,
    `<div style="padding:26px 28px 32px;">`,
    bodyHtml,
    `</div>`,
    `</div>`,
  ].join("");
}

/**
 * The ember the brand uses when white sits on top of it.
 *
 * NOT #FF6B2C, and the difference is measured rather than felt. White on the
 * bright ember is 2.83:1, which fails WCAG AA for body text and fails even the
 * 3:1 large-text floor. It is the exact defect three landing CTAs shipped with
 * until 2026-08-07, and reaching for the brighter hue here would have repeated it
 * from muscle memory.
 *
 * #C24E1E is already in the palette as the mark's core lowlight, so this is not
 * a new colour. White on it measures 4.77:1, which clears AA for body text.
 */
export const EMBER_DEEP = "#C6501E";

/**
 * NOTE ON THE BAND, kept where the next person will look for it.
 *
 * The ember band with white type is the treatment the founder asked for after
 * seeing Cloudflare's conference hero, and it is a better fit for email than the
 * dark ground proposed first. It is built into emailShell above rather than
 * offered as a separate helper, because an email with the band and an email
 * without it should not be a choice a caller makes by accident.
 *
 * WHY EMBER SURVIVES WHERE DARK DOES NOT. A solid bgcolor is among the best
 * supported things in email, including Outlook, whereas a background image needs
 * VML there and is blocked by default nearly everywhere else. Gmail on Android
 * force-inverts, but inversion targets near-white and near-black; a
 * mid-saturation brand hue is usually left alone. Dark is the treatment that
 * gets flattened. This one mostly does not.
 *
 * A BAND RATHER THAN THE WHOLE EMAIL, which is what the reference actually does:
 * Cloudflare uses ember for the hero and light for the content beneath it. Two
 * hundred words reversed out of a saturated colour is tiring on a phone, and the
 * contrast headroom for links and secondary text inside it is almost nil. The
 * band carries the identity; the body stays readable.
 *
 * Full rationale, the constraints, and what a dark variant would cost:
 * docs/growth/branding/email-design.md
 */

/**
 * The lead line of an email: the one sentence that has to land before anyone
 * decides whether to keep reading.
 *
 * A separate helper because the founder's note was that nothing was highlighted
 * and everything read at one weight. An email with six identical paragraphs has
 * no hierarchy, so the reader supplies their own and usually chooses to stop.
 */
export function emailLead(text: string): string {
  return `<p style="margin:0 0 18px;font-size:17px;line-height:1.45;font-weight:600;color:#0f0d0b;">${text}</p>`;
}

/**
 * A real button, not a coloured text link.
 *
 * THE FOUNDER'S ACTUAL COMPLAINT: "buttons are not visible". He was right, there
 * was no button anywhere. The CTA was ember text in a wall of same-size prose,
 * which is invisible to a reader skimming on a phone.
 *
 * WHITE ON THE DEEP EMBER, which is how the founder got the white label he asked
 * for without breaking anything. White on the BRIGHT ember #FF6B2C is 2.83:1 and
 * fails AA and even the 3:1 large-text floor, which is the defect three landing
 * CTAs shipped with until 2026-08-07. White on #C6501E is 4.60:1 and passes. So
 * the button is the deep ember, which also ties it to the band above it instead
 * of introducing a third colour.
 *
 * If a brighter button is ever wanted, the label has to go back to ink
 * (#0a0a0b on #FF6B2C is 6.97:1). Bright fill and white label is the one
 * combination that is not available.
 *
 * An <a> styled as a button rather than a <button>: a real button element does
 * not survive a mail client, and Outlook ignores border-radius, which degrades to
 * a hard rectangle. That is acceptable. What is not acceptable is a CTA that
 * vanishes when CSS is stripped, so the link text alone still reads as the
 * instruction.
 */
export function emailButton(href: string, label: string): string {
  return [
    `<p style="margin:0 0 20px;">`,
    `<a href="${href}" style="display:inline-block;background:${EMBER_DEEP};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;line-height:1.2;padding:13px 22px;border-radius:6px;">${label}</a>`,
    `</p>`,
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
  // WAS TWO LINES OF PLAIN TEXT, and it is the email that admits somebody to a
  // private beta. Signup is invite only as of 2026-08-07, so this link is the
  // only door most recipients will ever be offered, and it arrived looking like
  // a password reset from 2009.
  //
  // THE ONE FACT IT HAS TO CARRY, and it did not: this link works ON ITS OWN.
  // The recipient does not need a beta code, because a workspace invitation is
  // its own proof of admission (see checkWorkspaceInviteToken in
  // invites.functions.ts). Without that sentence, somebody who has heard the
  // beta is gated reads "invited" and assumes they are joining a queue.
  const where = args.workspaceName ? args.workspaceName : "a workspace";
  const subject = args.workspaceName
    ? `${args.workspaceName} added you on Supaprod`
    : "You have been added to a workspace on Supaprod";

  const text = [
    `Someone on ${where} added you to it on Supaprod.`,
    ``,
    `Supaprod is invite only right now. This link is your way in, so you do not need a code:`,
    args.inviteLink,
    ``,
    `It expires in seven days. If it has gone stale, ask whoever invited you to send another.`,
  ].join("\n");

  const p = (t: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f1b16;">${t}</p>`;
  const html = emailShell(
    [
      p(`Someone on <strong>${where}</strong> added you to it on Supaprod.`),
      p(`Supaprod is invite only right now. This link is your way in, so you do not need a code.`),
      emailButton(args.inviteLink, "Accept the invitation"),
      `<p style="margin:0;font-size:12px;line-height:1.5;color:#6b6457;">The link expires in seven days. If it has gone stale, ask whoever invited you to send another.</p>`,
    ].join(""),
    { kicker: "You have been added", headline: `Join ${where} on Supaprod.` },
  );

  const { sent } = await sendEmail({ to: args.to, subject, text, html });
  return { sent, link: args.inviteLink };
}
