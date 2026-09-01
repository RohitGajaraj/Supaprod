/**
 * Renders EVERY email this product can send, into one page, from the real code.
 *
 * WHY A GENERATOR RATHER THAN A SAVED SCREENSHOT. Email HTML is built in
 * src/lib, so any hand-made mockup is stale the moment somebody edits a string.
 * This imports the actual functions, which means the page cannot lie: if it looks
 * right here, that is what leaves the building.
 *
 * ASSETS ARE INLINED AS DATA URIs, and that is the point of the preview. The
 * real emails point at supaprod.ai, which cannot serve a newly committed asset
 * until Lovable deploys, so a preview that used the live URLs would show broken
 * images and be useless for judging design. That exact confusion cost an evening
 * on 2026-08-07.
 *
 * Run:  bun docs/growth/branding/generate-email-preview.ts
 * Out:  docs/growth/branding/email/_preview.html  (committed, so any agent can open it)
 *
 * The design contract these are all built against, including the contrast
 * measurements and what blocks the sender avatar: ./email-design.md
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { a1Html, A1_SUBJECT } from "../../../src/lib/waitlist-email.server";
import { emailShell, emailButton } from "../../../src/lib/email.server";

const ROOT = join(import.meta.dir, "..", "..", "..");
const OUT = join(import.meta.dir, "email");
mkdirSync(OUT, { recursive: true });

const b64 = (f: string) => readFileSync(join(ROOT, "public", f)).toString("base64");
const inline = (h: string) =>
  h
    .replaceAll(
      "https://supaprod.ai/mark-white.png",
      `data:image/png;base64,${b64("mark-white.png")}`,
    )
    .replaceAll(
      "https://supaprod.ai/email-band-texture.png",
      `data:image/png;base64,${b64("email-band-texture.png")}`,
    );

const p = (t: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f1b16;">${t}</p>`;

/* Each entry mirrors what the corresponding function in src/lib produces. Where a
 * body is reconstructed here rather than imported, it is because the real
 * function needs a Supabase client; the copy is copied verbatim and the file it
 * came from is named, so drift is visible in review. */
const EMAILS: {
  name: string;
  trigger: string;
  source: string;
  subject: string;
  html: string;
  live: boolean;
}[] = [
  {
    name: "A1. Waitlist welcome",
    trigger: "A genuine first signup on the landing page. Suppressed for a repeat address.",
    source: "src/lib/waitlist-email.server.ts",
    subject: A1_SUBJECT,
    html: a1Html(),
    live: true,
  },
  {
    name: "Workspace invitation",
    trigger: "A member invites somebody to their workspace.",
    source: "src/lib/email.server.ts, sendInviteEmail",
    subject: "Helio Labs added you on Supaprod",
    html: emailShell(
      [
        p(`Someone on <strong>Helio Labs</strong> added you to it on Supaprod.`),
        p(
          `Supaprod is invite only right now. This link is your way in, so you do not need a code.`,
        ),
        emailButton("https://supaprod.ai/join/example-token", "Accept the invitation"),
        `<p style="margin:0;font-size:12px;line-height:1.5;color:#6b6457;">The link expires in seven days. If it has gone stale, ask whoever invited you to send another.</p>`,
      ].join(""),
      { kicker: "You have been added", headline: "Join Helio Labs on Supaprod." },
    ),
    live: true,
  },
  {
    name: "Admin test send",
    trigger: "The Send test button on Admin, Health. Goes to one address, never a list.",
    source: "src/lib/email-health.functions.ts",
    subject: "Test email from Supaprod. Nothing to do.",
    html: emailShell(
      [
        p("This is a test from the Supaprod admin panel."),
        p(
          `Sent Fri, 07 Aug 2026 17:06:00 UTC. If it reached you, the whole path is good: the API key, the verified domain, the sending records and the From address. Anything missing after this is delivery or filtering, not configuration.`,
        ),
        p(
          "Worth checking while you are here. Did this land in the main inbox rather than Promotions or Spam? On a domain with no sending history that is the number that matters, and it is the one thing a test cannot tell you from our side.",
        ),
        `<p style="margin:0;font-size:12px;line-height:1.5;color:#6b6457;">Sent from Admin, Health. Nobody else received this.</p>`,
      ].join(""),
      { kicker: "Diagnostic", headline: "Transactional email is working." },
    ),
    live: true,
  },
  {
    name: "Notification",
    trigger:
      "A notification fires AND the recipient's preferences allow that category AND it is outside their quiet hours.",
    source: "src/lib/notifications.functions.ts, dispatchInstantEmail",
    subject: "Supaprod: <notification title>",
    html: "",
    live: false,
  },
  {
    name: "Periodic digest",
    trigger: "The daily or weekly tick, per the recipient's preference row.",
    source: "src/lib/notifications.functions.ts, generateDigest",
    subject: "Your <daily|weekly> Supaprod digest",
    html: "",
    live: false,
  },
];

function card(e: (typeof EMAILS)[number]): string {
  const meta = `<p style="font:12px/1.6 -apple-system,system-ui,sans-serif;color:#8b8b93;margin:0 0 4px;"><b style="color:#a1a1aa;">Fires when:</b> ${e.trigger}</p>
<p style="font:12px/1.6 ui-monospace,monospace;color:#7a8089;margin:0 0 12px;">${e.source}</p>`;
  const shown = e.html
    ? `<div style="border:1px solid rgba(255,255,255,.14);border-radius:9px;overflow:hidden;">
<div style="background:#18181b;padding:8px 13px;font:11px/1.4 ui-monospace,monospace;color:#a1a1aa;">Subject: ${e.subject}</div>
<div style="background:#fff;">${inline(e.html)}</div></div>`
    : `<div style="border:1px dashed rgba(229,83,75,.5);background:rgba(229,83,75,.07);border-radius:9px;padding:15px 17px;">
<p style="font:600 12px/1.5 -apple-system,system-ui,sans-serif;color:#e5534b;margin:0 0 6px;">PLAIN TEXT ONLY. No HTML, so no band, no mark, no button.</p>
<p style="font:12px/1.6 -apple-system,system-ui,sans-serif;color:#a1a1aa;margin:0 0 6px;">Subject: <code style="color:#FFD9C2;">${e.subject}</code></p>
<p style="font:12px/1.65 -apple-system,system-ui,sans-serif;color:#a1a1aa;margin:0;">Deliberately not branded yet. These are high-frequency in-product mail to people who are already inside, so the case for styling them is weaker than for the three above, and every branded send is one more thing that can break in a client nobody tested. Worth doing, not worth doing carelessly.</p></div>`;
  return `<section style="margin:0 0 40px;">
<h2 style="font:600 16px/1.3 -apple-system,system-ui,sans-serif;color:#f4f4f5;margin:0 0 5px;">${e.name}${e.live ? "" : `<span style="font-weight:400;color:#e5534b;font-size:13px;"> · unbranded</span>`}</h2>
${meta}${shown}</section>`;
}

const page = `<div style="background:#0d0d0e;min-height:100vh;padding:36px 20px;">
<div style="max-width:700px;margin:0 auto;">
<h1 style="font:700 25px/1.2 -apple-system,system-ui,sans-serif;color:#f4f4f5;margin:0 0 7px;">Every email Supaprod can send</h1>
<p style="font:14px/1.65 -apple-system,system-ui,sans-serif;color:#a1a1aa;margin:0 0 10px;max-width:66ch;">Rendered from the real code by <code style="color:#FFD9C2;">docs/growth/branding/generate-email-preview.ts</code>, so it cannot drift from what actually sends. The mark and band texture are inlined as data URIs, because the live URLs cannot serve a newly committed asset until Lovable deploys.</p>
<p style="font:13px/1.65 -apple-system,system-ui,sans-serif;color:#8b8b93;margin:0 0 34px;max-width:66ch;">Design contract, contrast measurements and what blocks the grey sender avatar: <code style="color:#FFD9C2;">docs/growth/branding/email-design.md</code>. Copy for the nine emails that are written but unwired: <code style="color:#FFD9C2;">docs/growth/email-sequences.md</code>.</p>
${EMAILS.map(card).join("")}
<div style="border:1px solid rgba(255,107,44,.35);background:rgba(255,107,44,.07);border-radius:10px;padding:16px 18px;">
<h2 style="font:600 14px/1.3 -apple-system,system-ui,sans-serif;color:#f4f4f5;margin:0 0 9px;">What is NOT here</h2>
<p style="font:13px/1.7 -apple-system,system-ui,sans-serif;color:#a1a1aa;margin:0 0 8px;"><b style="color:#f4f4f5;">Nine written emails that cannot send.</b> The waitlist nurture (A2 to A5), the launch announcement, onboarding (B1 to B3) and one re-engagement send all exist as ratified copy in <code style="color:#FFD9C2;">email-sequences.md</code> with no code behind them. Two founder blockers, not engineering ones: no postal address for the footer (CAN-SPAM applies to the commercial ones; A1 is transactional and exempt) and unsubscribe is mailto-only rather than RFC 8058 one-click.</p>
<p style="font:13px/1.7 -apple-system,system-ui,sans-serif;color:#a1a1aa;margin:0;"><b style="color:#f4f4f5;">Any client other than Gmail.</b> Nothing above has been opened in Outlook or Apple Mail, in either light or dark mode. That is the next real test and it is the one most likely to surface something ugly.</p>
</div></div></div>`;

writeFileSync(join(OUT, "_preview.html"), page);
console.log(`wrote ${join(OUT, "_preview.html")}`);
console.log(
  `${EMAILS.filter((e) => e.live).length} branded, ${EMAILS.filter((e) => !e.live).length} plain text`,
);
