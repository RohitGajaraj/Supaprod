/**
 * THE RUN THAT DID NOT OPEN, SAID AS A STATE RATHER THAN AS AN ANSWER.
 *
 * WHAT THIS IS FOR. Pressing "Hand it over" asks for work to start. Five things
 * can stop it: no workspace to hold a run, no conductor seat, no specialist to
 * hand work to, a pre-flight that threw, and a dispatch that threw after the
 * run row already existed. Every one is a real, reachable state, and until now
 * all five arrived as a paragraph on the delta channel and rendered inside
 * `Answer` — the same component, the same typography, the same place on the
 * page as a reply. Somebody who asked the product to DO something got back
 * something shaped exactly like the thing they did not ask for.
 *
 * THE HISTORY MATTERS, because this is the third attempt and the first two both
 * looked finished. Version one spliced the raw Postgres error into the answer
 * prompt under "explain this problem to the user", so the person read a model's
 * paraphrase of a database fault, worded differently every run. Version two
 * (2026-08-20) replaced that with `dispatchBlockedMessage`: our own sentence,
 * written once, deterministic, and a genuine repair. It is still prose, still
 * on the answer channel, and still indistinguishable from a reply — by the
 * pane, by a surface test, and by anyone reading the transcript later. Naming
 * the state is what stops a version four being needed.
 *
 * FOUR RULES IT KEEPS, all borrowed rather than invented:
 *
 *   · THE SENTENCE COMES FROM THE ID, not from this file. `dispatchBlockedMessage`
 *     is the single copy of these five sentences, and `api/chat.ts` streams that
 *     same text into the transcript beside the frame, so the live state and the
 *     persisted record cannot say different things about one refusal. It also
 *     means a reason this client does not know still reaches the reader as
 *     prose: the frame degrades to silence, the words do not.
 *   · THE ACTION IS AN IN-APP LINK, and only where there is somewhere honest to
 *     go. `dispatchBlockedMessage` names the destination in words and carries no
 *     href, because it renders through `Answer`, whose anchor sends every link
 *     to a new tab on the standing rule that a link inside model prose is a link
 *     nobody verified. This is a component, so it can use the router. Two of the
 *     five have a destination; the other three draw no button, because a wrong
 *     destination costs a navigation, a search, and the reader's belief in every
 *     other button like it.
 *   · NO ACCENT, and this one was a near miss. A blocked dispatch feels like the
 *     most urgent thing the pane can say, and the accent means exactly one thing
 *     in this system: a person is required, in the sense of a decision. Nothing
 *     here is waiting on judgement — the run is not paused pending an approval,
 *     it never started. `NeedsSetup` refuses the accent for the same reason and
 *     says so at length; this is that argument applied one surface over.
 *   · IT IS MERIDIAN, in a pane that is not. Every other file in this folder
 *     still speaks the retired `--sp-*` vocabulary and carries that debt in the
 *     ratchet baseline. A new file may not, so this is built from the Meridian
 *     utilities and `data-mrd` scopes them, which is also what gives it the
 *     shared focus treatment without restating it.
 */

import { Link } from "@tanstack/react-router";
import {
  dispatchBlockedMessage,
  dispatchBlockRoute,
  type DispatchBlock,
} from "@/lib/chat-dispatch";

export function AskBlocked({ reason }: { reason: DispatchBlock }) {
  const action = dispatchBlockRoute(reason);

  return (
    <div
      data-mrd=""
      /*
       * The state is named on the ELEMENT, not only in the prose. A surface
       * test, a DOM dump and anyone debugging a support report all get the same
       * five-value vocabulary the server sent, rather than having to match a
       * sentence that copy review is free to rewrite tomorrow.
       */
      data-blocked={reason}
      /*
       * `role="status"`, not `alert`. The person just pressed send and is
       * looking straight at this; a polite announcement lands after the answer
       * region settles, where an assertive one would cut across whatever the
       * screen reader was already reading out.
       */
      role="status"
      className="flex flex-wrap items-start gap-mrd-4 rounded-mrd-card border border-mrd-line-soft bg-mrd-sink px-4 py-3.5 font-mrd"
    >
      {/*
       * The muted dot `AskLanding` draws for a result that landed nowhere. A
       * landing borrows its station's hue because it HAS a station; nothing
       * started here, so there is no station to borrow one from. The two rows
       * are deliberately the same shape: where it went, or why it did not go.
       */}
      <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-mrd-mute" />

      <p className="min-w-0 flex-[1_1_180px] text-mrd-prose leading-mrd-snug text-mrd-ink">
        {dispatchBlockedMessage(reason)}
      </p>

      {action ? (
        <Link
          to={action.to}
          className="ml-auto flex shrink-0 items-center rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-3 py-2 text-mrd-label font-medium text-mrd-ink no-underline transition-colors duration-100 hover:bg-mrd-hover"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
