/**
 * ── START IS A HOME, NOT A RUN LIST (P-62) ───────────────────────────────
 *
 * FOUNDER, 00:08 2026-09-04: "today we have only the app saying that start, so
 * a lot of things are not in home."
 *
 * Three answers above the run list, each one sentence with one door. Pure: the
 * shapes and the sentences live here, the reads are in the server function, and
 * the component draws what it is handed. That split is what lets the sentences
 * be tested against real counts without a database.
 *
 * ── AN ALL-CLEAR NEEDS AN ANSWERED READ ──────────────────────────────────
 *
 * Every answer carries `read`, and it is load-bearing rather than
 * error-handling boilerplate. "Nothing is waiting on you" and "we could not
 * find out what is waiting on you" are different sentences, and a home that
 * says the first when it means the second is the most expensive lie this
 * surface can tell: the person stops looking. A failed read draws NOTHING --
 * not a zero, not a reassurance.
 */

import { dateTimeInZone } from "@/lib/time-of-day";

/**
 * A door is a route inside the app (`to`) or, once (P-126, the release
 * answer), an address the deploy itself answers on (`href`) -- a production
 * URL is not a page this router has a route for, so it needs its own anchor
 * rather than `<Link>`'s client-side navigation. `HomeAnswers` renders each
 * kind with the element that actually works for it.
 */
export type AnswerDoor = { label: string } & ({ to: string } | { href: string });

/** What one line on the home can be. */
export type Answer =
  /** The read answered and there is something to say. */
  | { read: "answered"; line: string; door: AnswerDoor }
  /** The read answered and there is genuinely nothing. Still drawn: a home that
   *  says nothing at all is indistinguishable from a broken one. */
  | { read: "answered-empty"; line: string }
  /** The read did not answer. Draws nothing, and the caller must not substitute
   *  a zero for it. */
  | { read: "unread" };

/** Never rendered. A failed read is silence, and the type makes that the only
 *  thing a caller can do with it. */
export const UNREAD: Answer = { read: "unread" };

/**
 * WHAT IS WAITING ON YOU.
 *
 * Takes the SHAPE rather than a total, from the same `queueShape` the approvals
 * heading uses (P-56), so the home and the page cannot disagree about how much
 * is waiting or what it is made of.
 */
export function waitingAnswer(shape: ReadonlyArray<{ n: number; label: string }> | null): Answer {
  if (shape === null) return UNREAD;
  const total = shape.reduce((t, f) => t + f.n, 0);
  if (total === 0) return { read: "answered-empty", line: "Nothing is waiting on your answer." };
  // The largest family names itself, because "35 design gates" is where a
  // person starts and the total is the number they cannot act on.
  const biggest = shape[0];
  const rest = total - (biggest?.n ?? 0);
  const line =
    rest > 0
      ? `${biggest?.label} need you, and ${rest} other ${rest === 1 ? "thing" : "things"}.`
      : `${biggest?.label} need you.`;
  return { read: "answered", line, door: { label: "Answer them", to: "/approvals" } };
}

/**
 * WHAT CAME IN SINCE YOU LAST LOOKED.
 *
 * `since` is the person's own last read of this surface (`brain_last_seen`),
 * never a rolling window. A clock would tell somebody who has been away a
 * fortnight about the last 24 hours and call it new.
 *
 * NO LAST-LOOK IS ITS OWN ANSWER, not zero. A person who has never opened this
 * has not "seen nothing new"; there is no since to count from, and "nothing
 * new" would be false on a workspace full of findings.
 */
export function arrivingAnswer(count: number | null, since: string | null): Answer {
  if (count === null) return UNREAD;
  if (since === null) {
    return count > 0
      ? {
          read: "answered",
          line: `${count} ${count === 1 ? "finding is" : "findings are"} on the record. You have not looked yet.`,
          door: { label: "See them", to: "/arriving" },
        }
      : { read: "answered-empty", line: "Nothing has come in yet." };
  }
  if (count === 0) return { read: "answered-empty", line: "Nothing new since you last looked." };
  return {
    read: "answered",
    line: `${count} new ${count === 1 ? "finding" : "findings"} since you last looked.`,
    door: { label: "See them", to: "/arriving" },
  };
}

/** One release, as far as this answer needs to know it. */
export type ReleasedItem = { title: string; url: string; releasedAt: string };

/**
 * WHAT WENT LIVE SINCE YOU LAST LOOKED (P-126, A-QUEUE.md).
 *
 * The first live release on Ship (12:29 IST 09-04) was on this page nowhere:
 * the person's own last visit to the home answers stayed silent about the
 * one fact they most wanted on a second visit -- that their change is live,
 * and where. `since` is the same last-look baseline `arrivingAnswer` reads
 * (`brain_last_seen`), because both answer "what happened while you were
 * away" -- a second baseline for the same question would just be a second
 * clock to keep in step with the first.
 *
 * Ahead of `learnedAnswer` in `homeAnswers`' own order: a release is a
 * bigger fact than a re-scored call, and "ahead of re-scored calls" is the
 * packet's own ordering rule.
 *
 * `zone`/`nowIso` (P-130, A-QUEUE.md): the time is read through the
 * person's own saved zone, day-aware (`dateTimeInZone`), because a release
 * named here can be from before today -- a bare clock reading for one from
 * two days ago would silently claim it happened this morning.
 */
export function releasedAnswer(
  releases: readonly ReleasedItem[] | null,
  since: string | null,
  zone: string,
  nowIso: string,
): Answer {
  if (releases === null) return UNREAD;
  if (since === null) {
    return releases.length > 0
      ? answeredRelease(releases, zone, nowIso)
      : { read: "answered-empty", line: "Nothing has shipped yet." };
  }
  if (releases.length === 0) {
    return { read: "answered-empty", line: "Nothing has shipped since you last looked." };
  }
  return answeredRelease(releases, zone, nowIso);
}

function answeredRelease(releases: readonly ReleasedItem[], zone: string, nowIso: string): Answer {
  const [first, ...rest] = releases;
  const time = dateTimeInZone(first.releasedAt, zone, nowIso);
  const line =
    rest.length > 0
      ? `${first.title} went live at ${time}, and ${rest.length} other ${rest.length === 1 ? "release" : "releases"}.`
      : `${first.title} went live at ${time}.`;
  // THE ADDRESS ITSELF, as a link -- the one fact P-126's own "Why" names as
  // the thing a person most wants on a second visit. `href`, not `to`: a
  // production deploy is not a route this app's own router knows.
  return { read: "answered", line, door: { label: "Open it", href: first.url } };
}

/**
 * WHAT THE RECORD LEARNED THIS WEEK.
 *
 * Calls whose forecast came back and was graded in the last seven days. Seven
 * days is a WINDOW rather than a memory, and that is right here in a way it is
 * not above: this answers "what changed lately", not "what have you missed", so
 * it does not need the person's last visit and must not claim to.
 */
export function learnedAnswer(count: number | null): Answer {
  if (count === null) return UNREAD;
  if (count === 0) return { read: "answered-empty", line: "No call came back this week." };
  return {
    read: "answered",
    line: `${count} ${count === 1 ? "call" : "calls"} came back this week and the record was re-scored.`,
    door: { label: "Read them", to: "/outcomes" },
  };
}

/** The three, in the order a person needs them: what stops work, what is new,
 *  what was learned. Unread ones are dropped by the component rather than here,
 *  so a test can see which read failed. */
export function homeAnswers(input: {
  waitingShape: ReadonlyArray<{ n: number; label: string }> | null;
  arrivingCount: number | null;
  lastLookedAt: string | null;
  learnedCount: number | null;
  releases: readonly ReleasedItem[] | null;
  /** The person's own zone (P-130), and the instant "today" is judged
   *  against -- both threaded in rather than read here, so this stays pure
   *  and testable without a clock or a profile. */
  zone: string;
  nowIso: string;
}): Answer[] {
  return [
    waitingAnswer(input.waitingShape),
    arrivingAnswer(input.arrivingCount, input.lastLookedAt),
    releasedAnswer(input.releases, input.lastLookedAt, input.zone, input.nowIso),
    learnedAnswer(input.learnedCount),
  ];
}
