import * as React from "react";

import { Num } from "@/components/meridian/surface-parts";

/**
 * `waiting` JOINED 2026-08-27, AND IT IS NOT A SYNONYM FOR `stuck`.
 *
 * `stuck` now counts only work that STOPPED: failed, halted, cancelled,
 * blocked. `waiting` counts `proposed` missions, which an ambient trigger
 * raised and nobody has launched. Nothing went wrong with those, and this
 * workspace holds 89 of them, so folding them into "runs are stuck" would tell
 * a person 89 things had broken when none of them had started.
 *
 * PRECEDENCE, and it is the order a reader needs. A failure outranks a queue:
 * something that broke wants attention before something that has not begun.
 * `shipped` stays last for the reason it always was, as the good news that only
 * gets the line when nothing else claims it.
 */
export function stateSentence(n: {
  ready: number;
  /** True when the queue reported it could not show everything. `ready` is then
   *  a floor rather than a count, and a zero means nothing at all. */
  partial: boolean;
  /**
   * NULL MEANS THE RUN RECORD HAS NOT ANSWERED, and it is not the same as zero.
   *
   * This file's own rule for the headline is that "every read the sentence
   * counts is answered for before it counts", because these numbers "cannot
   * tell a zero it read from a zero it never got". That rule was enforced by
   * refusing to draw the headline at all until BOTH reads landed, which is
   * correct and costs more than it needs to: measured on the running board
   * 2026-08-27, the review queue answered by 15s and the run record by 22s, so
   * for seven seconds the page showed fifty-two review cards under a heading
   * that said only "Today".
   *
   * Admitting null keeps the rule and drops the cost. The clause a read pays
   * for is omitted while that read is outstanding, so nothing is ever counted
   * from a hole, and the half the surface DOES know says itself as soon as it
   * knows it.
   */
  stuck: number | null;
  waiting: number | null;
  shipped: number | null;
}): React.ReactNode {
  /* "AT LEAST" WHEN THE READ WAS BOUNDED, and it is deliberately weaker than
     hiding the number. The count is still the most useful thing on the screen;
     it is only its EXACTNESS that was never earned. S1 measured the cost of
     claiming it: 116 pending design gates against a family limit of 100, so
     sixteen calls that needed a person were absent from every screen that lists
     them and no surface could tell. */
  const first =
    n.ready === 0 ? (
      /* NOT "Nothing is ready" WHEN A FAMILY FAILED. Zero from a partial read is
         the worst sentence this surface can say, because it is the one a person
         acts on by closing the tab. */
      n.partial ? (
        "Some of your queue did not load, so this cannot say what is waiting."
      ) : (
        "Nothing is ready for your review."
      )
    ) : n.ready === 1 ? (
      <>
        {n.partial ? "At least " : null}
        <Num>1</Num> decision is ready for your review.
      </>
    ) : (
      <>
        {n.partial ? "At least " : null}
        <Num>{n.ready}</Num> decisions are ready for your review.
      </>
    );

  /* Silent, not zero. Every branch below reads a number the run record owns,
     and the final fallback is the sentence " Nothing is stuck." — which is
     exactly the false claim this would make from an unanswered read. */
  const second =
    n.stuck === null || n.waiting === null || n.shipped === null ? null : n.stuck > 0 ? (
      n.stuck === 1 ? (
        <>
          {" "}
          <Num>1</Num> run is stuck.
        </>
      ) : (
        <>
          {" "}
          <Num>{n.stuck}</Num> runs are stuck.
        </>
      )
    ) : n.waiting > 0 && n.ready === 0 ? (
      n.waiting === 1 ? (
        <>
          {" "}
          <Num>1</Num> run is waiting for you to launch it.
        </>
      ) : (
        <>
          {" "}
          <Num>{n.waiting}</Num> runs are waiting for you to launch them.
        </>
      )
    ) : n.ready > 0 ? null : n.shipped > 0 ? (
      /* THE WINDOW LIVES ON THIS CLAUSE, because this is the only clause it is
         true of. `shipped` is filtered through `withinLastDay`; `ready`,
         `stuck` and `waiting` are not - they read the whole outstanding set,
         and blocked work does not age out. The page used to state the window
         ONCE, under the headline, where it scoped all four. Three quarters of
         its own sentence were outside it.
         It costs five words and only on a board that is otherwise clear, since
         this branch is reached only when nothing is stuck, waiting or ready. */
      n.shipped === 1 ? (
        <>
          {" "}
          <Num>1</Num> run shipped in the last 24 hours.
        </>
      ) : (
        <>
          {" "}
          <Num>{n.shipped}</Num> runs shipped in the last 24 hours.
        </>
      )
    ) : (
      " Nothing is stuck."
    );

  return (
    <>
      {first}
      {second}
    </>
  );
}
