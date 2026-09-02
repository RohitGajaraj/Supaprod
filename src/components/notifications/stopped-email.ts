/**
 * THE STOPPED-WORK EMAIL. What lands in the inbox of someone who handed over
 * work, left, and would otherwise never learn that it stopped.
 *
 * Owned by S3 (the platform), the sibling of `verdict-email.ts` and deliberately
 * built to the same shape. Consumed only on the server: the send will live in
 * `src/lib/notifications.functions.ts` (S0) behind the trigger requested in
 * `coordination/requests/S3/the-work-that-stopped-reaches-nobody.md`, and
 * importing `email.server.ts` below keeps this file out of any client bundle.
 *
 * ── WHY THIS EXISTS, AND WHY IT IS THE HALF THAT CARRIES THE COST ─────────
 * Gap #2 is "nothing reaches a person who left the page". The verdict email
 * covers work that FINISHES. Measured on the live database 2026-08-31: of 106
 * pieces of work, **97 carry a hold and 2 have reached Learn**, and **42 of
 * those holds are in `TERMINAL_HOLDS`, which the sweep refuses to act on by
 * design** — so those will never finish and can never produce a verdict. The
 * verdict send has fired **zero times ever**: the newest `learnings` row is
 * 2026-08-25 19:40 UTC and its trigger shipped on 2026-08-26.
 *
 * F-84 named this and the wording was lost in the handoff: *"nothing reaches a
 * person who left the page, costing 46% of all work ever created"*. It measured
 * 43 of 93 then. It is 97 of 106 now.
 *
 * ── WHAT S0 RULED, 2026-08-31, AND IT NARROWS WHO GETS THIS ───────────────
 * **NARROW: the 42 in `TERMINAL_HOLDS` only** (given-up 2, station-cannot-finish
 * 36, tools-refused 1, going-in-circles 3). Their reason is truthfulness rather
 * than caution, and it is the better argument: a terminal hold is definitionally
 * one the sweep will never act on again, so for those 42 the claim is supported
 * outright, while `out-of-time` (28) and `needs-evidence` (12) can still clear
 * and a message about them **may be false by the time it is read**.
 *
 * So `nothingWillRetry` is true for every send authorised today. It stays a
 * parameter rather than a constant because the ruling can widen, and because a
 * template that hardcodes the reassuring half is the one that lies first.
 *
 * **THE SEND DOES NOT EXIST YET, AND EVERYTHING IT NEEDS NOW DOES.** S0 ruled a
 * sent-table keyed `UNIQUE(track_id, hold)` rather than a `notified_at` column,
 * because dedupe must be the database's job: at 144 sweep passes a day a
 * check-then-write races with itself, and a unique index cannot.
 *
 * -- THIS PARAGRAPH SAID "THE MIGRATION IS NOT APPLIED". IT IS. --------------
 * That sentence was true when written and became false on 2026-09-01, and it
 * cost something: on 2026-09-03 it was read at face value and filed as a
 * one-line blocker on the FOUNDER, for a table that already existed. Checked
 * against `information_schema` rather than against this file:
 *
 *   `public.track_hold_notices`            migration 20260901010000, RLS on
 *   `track_hold_notices_track_id_hold_key` UNIQUE (track_id, hold), S0's exact key
 *   `sendEmail` / `dispatchInstantEmail`   `notifications.functions.ts`, a real
 *                                          provider with preference checks
 *   `user_notification_preferences.email_stopped`   the preference column
 *
 * So the composer below, the table, the send path and the preference all exist
 * and nothing is wired between them. That is ordinary work for whoever picks it
 * up, not an escalation.
 *
 * THE LESSON IS THE STALE COMMENT ITSELF, and it is the third found in two days:
 * `forecast-audit.server.ts:97` still says nothing can set `auto_derive_enabled`
 * (Settings has written it since 2026-08-14), and three gates in
 * `driver.server.ts` read a `studio_changesets.track_id` that has never existed.
 * A file's own header is the least reliable thing in a repository, because it is
 * the one part nothing executes. **Ask the database.**
 *
 * Their stated limitation, recorded here rather than rediscovered: `spine_tracks`
 * has `last_hold` and `last_hold_because` and **no acquisition timestamp**, so
 * "this acquisition" is not expressible and the key holds for the life of the
 * track. For a terminal hold that is very nearly right.
 *
 * ── THE ONE JOB ───────────────────────────────────────────────────────────
 * Say what stopped, where, why, and what the person can do. A stopped-work mail
 * that does not end in an action is the dead end R-20 §6 forbids, delivered to
 * an inbox where it is even harder to escape than on a page.
 *
 * ── NOTHING HERE INVENTS A NUMBER, AND THAT IS A PAID-FOR RULE ────────────
 * `attempts` is rendered only when the caller passes a real one. **S4-043 found
 * the parked-track surface stating "finished empty 3 times" from a CONSTANT it
 * never read, with 13 of 32 rows at `attempts = 0`.** That defect was on their
 * surface; this would have been the second surface it landed on, so the payload
 * asks for the number and the template omits the line when it is absent rather
 * than falling back to anything.
 *
 * ── ONE VOCABULARY, IMPORTED, NEVER RESTATED ──────────────────────────────
 * `HOLD_LINE` is the product's own plain sentence for each hold and `AGENT_STATIONS`
 * is its own display name for each station. Both are imported. Retyping either
 * would be the one-idea-two-vocabularies defect, which is the same rule that
 * settled `TERMINAL_HOLDS` with S1 and `CHECK_NAMES` with S0 this same session.
 * Note in particular that the first station's display name is **Discover** and
 * its id is `sense`; a template that printed the id would leak a word the
 * customer has never seen.
 *
 * COPY RULES APPLIED (operating model §12 and the humanized-output bar): plain
 * words, second person, no exclamation marks, no dashes doing a sentence's job,
 * and none of the banned vocabulary. **And no claim that we are watching it:**
 * the mail says the work stopped and what clears it, never that we will keep an
 * eye on it, because nothing does.
 */

import { absoluteUrl, EMBER_DEEP, emailButton, emailLead, emailShell } from "@/lib/email.server";
import { EMAIL_BODY, EMAIL_INK, EMAIL_LINE, EMAIL_MUTE } from "@/components/meridian/email-palette";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { HOLD_LINE } from "@/lib/spine/driver";
import type { HoldReason } from "@/lib/spine/driver";

export type StoppedEmailPayload = {
  /** Title of the piece of work, from `spine_tracks.title`. */
  trackTitle: string;
  /** Root-relative path of the run. The caller builds it; null when unknown. */
  trackHref: string | null;
  /** Where it stopped. Rendered through `AGENT_STATIONS`, never as the id. */
  station: AgentStation;
  /** Why it stopped. Rendered through `HOLD_LINE`, never as the slug. */
  holdReason: HoldReason;
  /**
   * The loop's own sentence about THIS stop, when it wrote one
   * (`spine_tracks.last_hold_because`). It is written for the person the hold
   * interrupted, so it renders verbatim rather than being reworded here: two
   * wordings for one stop is the defect the boundary page's policy sentences
   * are rendered verbatim to avoid.
   */
  because?: string | null;
  /** When it stopped, ISO. Omitted from the copy when absent. */
  stoppedAt?: string | null;
  /**
   * How many times the station was tried. **Read from the row, never assumed.**
   * Omitted entirely when null, which is the honest state for the 13-in-32 rows
   * S4-043 found sitting at zero while a surface claimed three.
   */
  attempts?: number | null;
  /**
   * Whether anything can still pick this up on its own. True for a hold in
   * `TERMINAL_HOLDS`, where the sweep has stopped by design and only a person
   * restarts it. This changes the last line from "it is waiting" to "nothing
   * will move it until you do", and getting it backwards would be the crueller
   * of the two errors.
   */
  nothingWillRetry: boolean;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** The station in the words the customer has seen, never the internal id. */
export function stationName(station: AgentStation): string {
  return AGENT_STATIONS[station]?.name ?? station;
}

/** The product's own sentence for this hold, imported rather than restated. */
export function holdSentence(reason: HoldReason): string {
  return HOLD_LINE[reason] ?? "It stopped, and the record does not say why.";
}

/**
 * The closing line, and the one thing this mail must not get backwards.
 *
 * A hold the sweep still retries is waiting; a terminal one is not. Telling
 * somebody their work is waiting when nothing will ever pick it up is how 42
 * pieces of work sat unread, and it is the exact failure this mail exists to
 * end, so it would be a poor thing to reproduce inside the fix.
 *
 * ── AND IT MUST NOT POINT AT A DOOR THAT IS NOT THERE ─────────────────────
 * `hasLink` was added after RENDERING the mail and reading it, which no test
 * had done. The retryable branch ended "Opening it shows you where it is and
 * what it is waiting for" and the template drops the button entirely when
 * `trackHref` is null, so that sentence told a person to open something the
 * message did not offer. The unit tests passed either way: one asserted the
 * link is omitted when there is no run, and none asserted that the PROSE stops
 * referring to it. A dead end in an inbox is worse than one on a page, because
 * there is nowhere else on the page to go.
 */
export function whatHappensNext(nothingWillRetry: boolean, hasLink: boolean): string {
  if (nothingWillRetry) {
    return "Nothing will move this on its own. It stays where it is until you pick it up.";
  }
  return hasLink
    ? "It may still be picked up on its own. Opening it shows you where it is and what it is waiting for."
    : "It may still be picked up on its own.";
}

const p = (t: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${EMAIL_INK};">${t}</p>`;

const label = (t: string) =>
  `<p style="margin:0 0 6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_MUTE};">${t}</p>`;

const block = (inner: string) =>
  `<div style="border-left:3px solid ${EMBER_DEEP};padding:2px 0 2px 16px;margin:0 0 22px;">${inner}</div>`;

export function stoppedEmailSubject(pay: StoppedEmailPayload): string {
  const title = pay.trackTitle.trim() || "your work";
  return `Stopped at ${stationName(pay.station)}: ${title}`;
}

export function stoppedEmailText(pay: StoppedEmailPayload): string {
  const title = pay.trackTitle.trim() || "your work";
  const when = pay.stoppedAt ? formatDate(pay.stoppedAt) : "";
  const lines: string[] = [
    `${title} stopped at ${stationName(pay.station)}${when ? ` on ${when}` : ""}.`,
    "",
    "WHY IT STOPPED",
    holdSentence(pay.holdReason),
  ];
  if (pay.because) lines.push(pay.because);
  if (typeof pay.attempts === "number" && pay.attempts > 0) {
    lines.push(pay.attempts === 1 ? "It was tried once." : `It was tried ${pay.attempts} times.`);
  }
  lines.push("", "WHAT HAPPENS NOW", whatHappensNext(pay.nothingWillRetry, !!pay.trackHref));
  if (pay.trackHref) {
    lines.push("", `Open the work: ${absoluteUrl(pay.trackHref)}`);
  }
  lines.push(
    "",
    "You are getting this because work you started stopped while you were away.",
    "Change it in Settings, under Notifications.",
  );
  return lines.join("\n");
}

export function stoppedEmailHtml(pay: StoppedEmailPayload): string {
  const title = esc(pay.trackTitle.trim() || "your work");
  const when = pay.stoppedAt ? formatDate(pay.stoppedAt) : "";

  const whyBits = [p(esc(holdSentence(pay.holdReason)))];
  if (pay.because) {
    whyBits.push(
      `<p style="margin:0 0 4px;font-size:13px;line-height:1.5;color:${EMAIL_BODY};">${esc(pay.because)}</p>`,
    );
  }
  if (typeof pay.attempts === "number" && pay.attempts > 0) {
    whyBits.push(
      `<p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_BODY};">${
        pay.attempts === 1 ? "It was tried once." : `It was tried ${pay.attempts} times.`
      }</p>`,
    );
  }

  const body = [
    emailLead(`${title} stopped at ${esc(stationName(pay.station))}${when ? ` on ${when}` : ""}.`),
    block(label("Why it stopped") + whyBits.join("")),
    block(
      label("What happens now") + p(esc(whatHappensNext(pay.nothingWillRetry, !!pay.trackHref))),
    ),
    pay.trackHref ? emailButton(absoluteUrl(pay.trackHref), "Open the work") : "",
    `<p style="margin:0;border-top:1px solid ${EMAIL_LINE};padding-top:14px;font-size:12px;line-height:1.5;color:${EMAIL_MUTE};">You are getting this because work you started stopped while you were away. Change it in Settings, under Notifications.</p>`,
  ].join("");

  return emailShell(body, {
    kicker: "Work stopped",
    headline: title,
  });
}
