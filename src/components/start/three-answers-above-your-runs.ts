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

import { quotedTitle } from "@/components/start/a-title-inside-a-sentence";
import type { WorkMoved } from "@/components/start/the-work-moved";
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
  return { read: "answered", line, door: { label: "Answer them", to: "/inbox" } };
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
          door: { label: "See them", to: "/evidence" },
        }
      : { read: "answered-empty", line: "Nothing has come in yet." };
  }
  if (count === 0) return { read: "answered-empty", line: "Nothing new since you last looked." };
  return {
    read: "answered",
    line: `${count} new ${count === 1 ? "finding" : "findings"} since you last looked.`,
    door: { label: "See them", to: "/evidence" },
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
 * bigger fact than a re-scored decision, and "ahead of re-scored decisions" is the
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
 * Decisions whose forecast came back and was graded in the last seven days.
 * FIFTH REVIEW, 2026-09-09: "call" is the thing WAITING on a person, and the
 * hero one region above says exactly that. This counts graded decision rows,
 * so it says decision. Seven
 * days is a WINDOW rather than a memory, and that is right here in a way it is
 * not above: this answers "what changed lately", not "what have you missed", so
 * it does not need the person's last visit and must not claim to.
 */
export function learnedAnswer(count: number | null, rescored: number | null = null): Answer {
  if (count === null) return UNREAD;
  if (count === 0) return { read: "answered-empty", line: "No decision came back this week." };
  /*
   * ── AND THE RE-SCORE IS NOT ASSERTED ANY MORE ────────────────────────────
   * Added 2026-09-09. The clause "and the record was re-scored" was part of the
   * sentence for every graded decision, whether or not anything had been
   * re-scored. Measured on the founder's own workspace: the one decision that
   * came back this week carries no prior or new score, so nothing moved and the
   * entry said it had.
   *
   * It was the new evidence region directly under this line that made it
   * visible: it showed the SAME decision, and its own re-score line was absent
   * because there was nothing to report. Two statements about one decision, 90
   * pixels apart, disagreeing.
   *
   * A null count withholds the clause rather than guessing in either
   * direction, which is the rule the three answers already hold to.
   */
  const moved = rescored != null && rescored > 0;
  const noun = count === 1 ? "decision" : "decisions";
  return {
    read: "answered",
    line: moved
      ? `${count} ${noun} came back this week and the record was re-scored.`
      : `${count} ${noun} came back this week.`,
    door: { label: "Read them", to: "/outcomes" },
  };
}

/** The three, in the order a person needs them: what stops work, what is new,
 *  what was learned. Unread ones are dropped by the component rather than here,
 *  so a test can see which read failed. */
/**
 * YOUR WORK MOVED, which is the one thing this product exists to do and the
 * one thing this line-up could not say.
 *
 * The other four answer what is WAITING, what ARRIVED, what SHIPPED and what
 * was LEARNED. A run advancing a station was in none of them, so on the day the
 * loop finally moved a track that had been stuck since 2026-09-06, a person
 * returning to the home would have seen a road in a different shape and no
 * sentence telling them anything had happened. A road shows the new STATE; only
 * "since you last looked" can show the CHANGE.
 *
 * It leads the four, deliberately. What is waiting is a debt; this is the
 * product having done something, and a home that opens on debt when it has news
 * is the "dump of data" reading of this page.
 *
 * See `the-work-moved.ts` for why forward and backward are never one count.
 */
export function movedAnswer(moved: WorkMoved): Answer {
  switch (moved.kind) {
    case "one":
      /* NAMED, NOT COUNTED. "One run moved on" is a tally; the title and the
         station are the product telling you what it did. Same rule
         `WhetherItWorked` follows one region down. */
      return {
        read: "answered",
        /* QUOTED AND BOUNDED. A run title is itself a sentence -- "Warn a
           homeowner before an installer visit is cancelled" -- so unquoted it
           read as *"...is cancelled reached Build"* and a reader stumbles
           mid-line. See `a-title-inside-a-sentence.ts`; `Hero` has held the
           same rule since 2026-09-08. */
        line: `${quotedTitle(moved.title)} reached ${moved.station}.`,
        door: { label: "See where it stands", to: "/start" },
      };
    case "many":
      return {
        read: "answered",
        line: `${moved.forward} runs moved on.`,
        door: { label: "See where they stand", to: "/start" },
      };
    case "back":
      /* A send-back with no forward move is the state a person most needs to
         know about, because it is the one they may want to argue with. */
      return {
        read: "answered",
        line:
          moved.sentBack === 1
            ? "A run was sent back a step."
            : `${moved.sentBack} runs were sent back a step.`,
        door: { label: "See why", to: "/start" },
      };
    case "none":
      /* Silence, never "nothing moved". This shares `lastLookedAt` with
         `arrivingAnswer`, and that field's own rule is that no last-look is not
         a zero -- so a `none` that came from a missing `since` must not be
         rendered as news that nothing happened. */
      return UNREAD;
  }
}

export function homeAnswers(input: {
  waitingShape: ReadonlyArray<{ n: number; label: string }> | null;
  arrivingCount: number | null;
  lastLookedAt: string | null;
  learnedCount: number | null;
  /** How many of those moved the record. Null withholds the clause. */
  rescoredCount?: number | null;
  releases: readonly ReleasedItem[] | null;
  /** What advanced a station since the last look. Absent withholds the line. */
  moved?: WorkMoved | null;
  /** The person's own zone (P-130), and the instant "today" is judged
   *  against -- both threaded in rather than read here, so this stays pure
   *  and testable without a clock or a profile. */
  zone: string;
  nowIso: string;
}): Answer[] {
  return [
    /* THE NEWS BEFORE THE DEBT. A home that opens on what is owed when the
       product has just done something is the "dump of data" reading of this
       page; what moved is the answer to "I cannot feel the value". */
    movedAnswer(input.moved ?? { kind: "none" }),
    waitingAnswer(input.waitingShape),
    arrivingAnswer(input.arrivingCount, input.lastLookedAt),
    releasedAnswer(input.releases, input.lastLookedAt, input.zone, input.nowIso),
    learnedAnswer(input.learnedCount, input.rescoredCount ?? null),
  ];
}
