import type { ReactNode } from "react";

/*
 * NEEDS SETUP, the state where a surface cannot ask its question yet.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * This has no counterpart in the reference library because it is not a generic
 * interface problem, it is this product's. It was found twice on the same day,
 * from opposite directions.
 *
 * From the engineering side: a new user in zero workspaces got a PERMANENT
 * SPINNER on Today. A disabled query reports pending forever, so every clause
 * of the wait check was satisfied and the wait never ended. Ending it correctly
 * renders the EMPTY state, and telling someone with no workspace that their
 * workspace is empty is a different wrong answer, not a fix.
 *
 * From the product side: 39 of 43 work items were standing at the first
 * station, and the cause was that no source is connected. The surface said
 * nothing was there. The truth was that nothing COULD be there yet.
 *
 * So the product has been collapsing three different facts into two states:
 *
 *   nothing exists yet        the machinery is ready and has produced nothing
 *   the read failed           we do not know, and we must not pretend we do
 *   A PRECONDITION IS MISSING this surface cannot ask its question at all
 *
 * The third had no design. It is the one a first-time reviewer actually opens.
 *
 * ── WHY IT CARRIES NO ACCENT ────────────────────────────────────────────
 * The accent means A PERSON IS REQUIRED, in the sense of a decision: a gate is
 * open and your judgement unblocks it. Connecting a source or joining a
 * workspace is a SETUP act, not a decision. Dressing it in the accent sends
 * someone hunting for a call to make, and there is no call here, only a thing
 * to plug in. It also devalues the accent everywhere else: if setup and
 * judgement look the same, the reader stops trusting that the colour means
 * anything.
 *
 * ── THE HIERARCHY, REBUILT 2026-08-23 ──────────────────────────────────
 * The founder named this component as the example of his top complaint: "no
 * proper distinction between what is header one, what is header two, and what
 * is header three." He was right, and the numbers say so. It rendered four
 * levels at 17px, 13-or-14px, 12.5px and 12px, with the bottom two both in
 * `--mrd-mute`. Half a pixel and no colour change is not a level.
 *
 * Worse, the body line carried `text-[13px]` AND `text-mrd-prose` together.
 * Both set `font-size`, so which one a reader actually saw was decided by
 * stylesheet order rather than by anyone. It was one of 57 elements in this
 * directory in that state.
 *
 * It now names ROLES rather than assembling sizes: `mrd-title`, `mrd-copy`,
 * `mrd-meta`. Each carries its size, weight, colour and leading as one decision,
 * so the levels cannot drift apart again and the combination cannot be got
 * wrong. Reasoning for the ladder is in `meridian.css` under THE TEXT ROLES.
 *
 * ── WHY IT IS NOT AN EMPTY STATE WITH BETTER COPY ───────────────────────
 * Because it must carry an ACTION, and an empty state must not invent one. When
 * a workspace is genuinely empty the honest response is to wait or to do the
 * first thing; when a precondition is missing there is exactly one act that
 * changes anything, and naming it is the whole job of the state.
 */

export type SetupKind =
  /** The reader is not in a workspace, so nothing can be scoped to them. */
  | "no-workspace"
  /** Nothing is connected, so there is no evidence for the loop to read. */
  | "no-source"
  /** A capability exists but is switched off, and turning it on costs money. */
  | "switched-off"
  /** Something upstream has not been set, named by the caller. */
  | "upstream";

/**
 * The default sentences. A caller may override any of them, but the defaults
 * are written to be correct unchanged, because a component that requires copy
 * to be supplied gets copy invented at the call site and drifts surface by
 * surface. That is how one product ends up with four ways of saying nothing is
 * here.
 */
const WORDS: Record<SetupKind, { title: string; body: string }> = {
  "no-workspace": {
    title: "You are not in a workspace yet",
    body: "Everything here is scoped to a workspace, so there is nothing to show until you are in one. Create one, or ask whoever runs yours for an invitation.",
  },
  "no-source": {
    title: "Nothing is connected yet",
    body: "The crew reads from the places your customers already talk to you. Until one is connected there is nothing for it to read, so this stays quiet rather than showing you an empty room.",
  },
  "switched-off": {
    title: "This is switched off",
    body: "The machinery is built and idle. Turning it on starts real work, and real work spends money, so nobody turned it on for you.",
  },
  upstream: {
    title: "Something upstream is missing",
    body: "This surface cannot answer its question until that is in place.",
  },
};

export function NeedsSetup({
  kind = "upstream",
  title,
  body,
  action,
  /**
   * Say so when the unblocking act spends money. A person turning something on
   * deserves to be told before the click, not billed after it. Never infer this
   * from the kind: only the caller knows.
   */
  costsMoney = false,
  /** What this surface WOULD show, once unblocked. Optional and often worth it. */
  thenWhat,
}: {
  kind?: SetupKind;
  title?: string;
  body?: string;
  action?: ReactNode;
  costsMoney?: boolean;
  thenWhat?: string;
}) {
  const words = WORDS[kind] ?? WORDS.upstream;

  return (
    <section
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-6"
      // Not aria-live. This is the state on arrival, not a change to announce,
      // and a live region here would interrupt a screen reader mid-navigation.
    >
      <h2 className="mrd-title">{title ?? words.title}</h2>

      <p className="mt-mrd-3 max-w-[62ch] mrd-copy">{body ?? words.body}</p>

      {thenWhat ? (
        /*
         * What arrives once this is unblocked. It earns its place because the
         * reason people skip setup is that they cannot picture the payoff, and
         * one concrete sentence about what lands here is worth more than any
         * amount of encouragement.
         */
        <p className="mt-mrd-3 max-w-[62ch] mrd-meta">Once it is, {thenWhat}</p>
      ) : null}

      {action ? (
        <div className="mt-mrd-5 flex flex-wrap items-center gap-mrd-4">
          {action}
          {costsMoney ? (
            /*
             * Stated beside the control rather than inside it. A button whose
             * label carries the warning gets read as a warning and not pressed;
             * a button beside a plain fact gets read as a choice.
             */
            <span className="mrd-meta">This one spends model credits.</span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default NeedsSetup;
