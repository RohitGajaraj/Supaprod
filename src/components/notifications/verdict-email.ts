/**
 * THE VERDICT EMAIL. What lands in the inbox of someone who handed over work,
 * left, and is now finding out how it went without coming back to look.
 *
 * Owned by S3 (the platform). Consumed only on the server: the send call lives
 * in src/lib/notifications.functions.ts (S0) behind dispatchVerdictEmail, and
 * importing email.server.ts below keeps this file out of any client bundle.
 *
 * THE ONE JOB: name what was expected beside what actually happened. That
 * pairing is the product; the queue brief calls it the message's reason to
 * exist. Everything else (metric, horizon, link) supports it and degrades
 * honestly when absent. Nothing here is ever invented to fill a layout: a
 * verdict with no recorded expectation says so in one line rather than
 * pretending the two halves exist.
 *
 * COPY RULES APPLIED (operating model §12 and the humanized-output bar):
 * plain words throughout, second person, present tense where true, no
 * exclamation marks, no dashes doing a sentence's job, and none of the banned
 * vocabulary. The internal verdict words never reach the reader: they render
 * as "as expected / not what we expected / partly as expected".
 */

import { absoluteUrl, EMBER_DEEP, emailButton, emailLead, emailShell } from "@/lib/email.server";
import { EMAIL_BODY, EMAIL_INK, EMAIL_LINE, EMAIL_MUTE } from "@/components/meridian/email-palette";

export type VerdictEmailPayload = {
  /** Title of the piece of work, from spine_tracks. Falls back to a plain noun. */
  trackTitle: string;
  /** Root-relative path of the run, built from ToolCtx.trackId by the caller. */
  trackHref: string | null;
  verdict: "validated" | "missed" | "mixed";
  /** What the Learn crew wrote about the outcome. */
  summary: string;
  metricLabel?: string | null;
  metricValue?: string | null;
  /** From decisions.forecast_claim, when the verdict settled a named bet. */
  forecastClaim?: string | null;
  /** From decisions.forecast_how_we_will_know. */
  forecastCheck?: string | null;
  /** From decisions.forecast_horizon_date (ISO string). */
  forecastDue?: string | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The plain phrase for each internal verdict word. Never render the raw enum. */
export function verdictPhrase(verdict: VerdictEmailPayload["verdict"]): string {
  switch (verdict) {
    case "validated":
      return "as expected";
    case "missed":
      return "not what we expected";
    case "mixed":
      return "partly as expected";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const p = (t: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${EMAIL_INK};">${t}</p>`;

const label = (t: string) =>
  `<p style="margin:0 0 6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_MUTE};">${t}</p>`;

const block = (inner: string) =>
  `<div style="border-left:3px solid ${EMBER_DEEP};padding:2px 0 2px 16px;margin:0 0 22px;">${inner}</div>`;

export function verdictEmailSubject(pay: VerdictEmailPayload): string {
  const title = pay.trackTitle.trim() || "your work";
  return `What actually happened: ${title}`;
}

export function verdictEmailText(pay: VerdictEmailPayload): string {
  const title = pay.trackTitle.trim() || "your work";
  const lines: string[] = [
    `${title} finished, and the result came back ${verdictPhrase(pay.verdict)}.`,
    "",
  ];
  if (pay.forecastClaim) {
    lines.push("WHAT WE EXPECTED", pay.forecastClaim);
    if (pay.forecastCheck) lines.push(`How we would know: ${pay.forecastCheck}`);
    if (pay.forecastDue) lines.push(`Expected by: ${formatDate(pay.forecastDue)}`);
    lines.push("");
  } else {
    lines.push(
      "This work carried no written expectation, so there is nothing to compare the result against.",
      "",
    );
  }
  lines.push("WHAT ACTUALLY HAPPENED", pay.summary);
  if (pay.metricLabel && pay.metricValue) {
    lines.push(`${pay.metricLabel}: ${pay.metricValue}`);
  }
  if (pay.trackHref) {
    lines.push("", `Open the work: ${absoluteUrl(pay.trackHref)}`);
  }
  lines.push(
    "",
    "You are getting this because work you started finished while you were away.",
    "Change it in Settings, under Notifications.",
  );
  return lines.join("\n");
}

export function verdictEmailHtml(pay: VerdictEmailPayload): string {
  const title = esc(pay.trackTitle.trim() || "your work");

  let expectedBlock: string;
  if (pay.forecastClaim) {
    const bits = [p(esc(pay.forecastClaim))];
    if (pay.forecastCheck) {
      bits.push(
        `<p style="margin:0 0 4px;font-size:13px;line-height:1.5;color:${EMAIL_BODY};">How we would know: ${esc(pay.forecastCheck)}</p>`,
      );
    }
    if (pay.forecastDue) {
      const due = formatDate(pay.forecastDue);
      if (due) {
        bits.push(
          `<p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_BODY};">Expected by ${due}.</p>`,
        );
      }
    }
    expectedBlock = block(label("What we expected") + bits.join(""));
  } else {
    expectedBlock = `<p style="margin:0 0 22px;font-size:13px;line-height:1.55;color:${EMAIL_BODY};">This work carried no written expectation, so there is nothing to compare the result against.</p>`;
  }

  const outcomeBits = [p(esc(pay.summary))];
  if (pay.metricLabel && pay.metricValue) {
    outcomeBits.push(
      `<p style="margin:0;font-size:14px;line-height:1.5;color:${EMAIL_BODY};">${esc(pay.metricLabel)}: <strong style="color:${EMAIL_INK};">${esc(pay.metricValue)}</strong></p>`,
    );
  }
  const outcomeBlock = block(label("What actually happened") + outcomeBits.join(""));

  const body = [
    emailLead(`${title} finished, and the result came back ${verdictPhrase(pay.verdict)}.`),
    expectedBlock,
    outcomeBlock,
    pay.trackHref ? emailButton(absoluteUrl(pay.trackHref), "Open the work") : "",
    `<p style="margin:0;border-top:1px solid ${EMAIL_LINE};padding-top:14px;font-size:12px;line-height:1.5;color:${EMAIL_MUTE};">You are getting this because work you started finished while you were away. Change it in Settings, under Notifications.</p>`,
  ].join("");

  return emailShell(body, {
    kicker: "Work finished",
    headline: title,
  });
}
