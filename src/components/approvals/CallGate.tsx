import type { ReactNode } from "react";

import { isOverdue, stoppedFor } from "@/components/meridian/stopped-for";

/*
 * THE CALL IN FRONT OF YOU, drawn in Meridian.
 *
 * ── A FIXED ORDER CANNOT SAVE A CARD WHOSE SLOTS ARE AMBIGUOUS ──────────
 *
 * Read this before adding a slot. It is the most expensive thing learned about
 * this component and it cost a walk of the served build to find.
 *
 * P-37 gave this card a fixed order: question, risk, facts, declared default,
 * answers. The order was correct in the code and WRONG ON SCREEN, because there
 * was one slot named `consequence` and the caller was passing the DEFAULT
 * sentence into it. So a person read, second, "Cancelled unrun: nobody answered
 * by Sun, Sep 6..." while the actual risk sat in `lines` as one fact among
 * facts. Both readings were true at once: the order was fixed, and two
 * different sentences were sharing one name, so they landed in each other's
 * places.
 *
 * THE RULE THAT FOLLOWS. A slot is a promise about MEANING, not about position.
 * Two sentences that answer different questions get two names, however similar
 * they look at the call site: "what happens if you say yes" and "what happens if
 * you say nothing" are opposites wearing the same grammar.
 *
 * P-51 (A-QUEUE.md): `consequence` was kept as a deprecated alias while the
 * two composers migrated to `risk`/`declaredDefault`. Both have (`TrackConsent`
 * already had; `_authenticated.approvals.tsx`'s own sentence turned out to
 * answer "what happens if you say yes", which is `risk`, not `declaredDefault`
 * -- the exact slot confusion this file exists to close, still live in the one
 * remaining caller until this packet), so the alias is gone. A future caller
 * that reaches for `consequence` now gets a type error instead of a sentence
 * quietly landing above the facts again.
 *
 * ── WHAT IT REPLACES ────────────────────────────────────────────────────
 * The `Gate` primitive from src/components/shell/primitives.tsx, which drew
 * this surface until 2026-08-14. Everything that primitive's header insists on
 * is kept here, because those rules were written after real defects:
 *
 *   ONE QUESTION, THEN THE FACTS, THEN THE ACTIONS, in that order. A change on
 *   2026-08-05 lifted the reasons OUT of the gate and placed them after it,
 *   which put the evidence BELOW the Approve button and asked a person to
 *   decide above the reasons for deciding. Anything that argues for the answer
 *   sits between the question and the controls, and nowhere else.
 *
 *   ONE PRIMARY, AND ONLY ONE. The queue behind this gate carries no commit
 *   control of its own for the same reason: twenty approve buttons is twenty
 *   primary actions and nothing to look at first.
 *
 * ── WHAT IS NEW, AND WHY ────────────────────────────────────────────────
 * The age. Measured in production on 2026-08-14: twelve gates pending, ages in
 * hours 86, 83, 83, 83, 80, 74, 68, 67, 66, 55, 52, 51, the oldest entered at
 * 18:31 on 10 August. Nothing anywhere in the product told anyone, so the loop
 * sat for three and a half days waiting on a click.
 *
 * The diagnosis was not that the queue looked bad. It was that A PENDING
 * APPROVAL IS A ROW IN A LIST, NOT A STALLED PIECE OF WORK WITH A COST. The
 * queue below now carries that through StalledWork; this is the same fact for
 * the one call being asked, and it is stated beside the question rather than
 * exiled to a corner as metadata, because it is the reason to answer now.
 *
 * ── WHERE THE ACCENT GOES ───────────────────────────────────────────────
 * Twice, and both times it means the same thing: a person is required. Once on
 * the standing marker that says so, and once on the control that releases the
 * agent, which is that fact offered rather than stated. This follows
 * ApprovalCard, whose header sets the same rule for the same control: the
 * neutral primary face is right for chrome, and wrong for the one control on
 * the surface that is itself the pending human action. The age joins them only
 * once it is overdue, which is the same boundary StalledWork's rows use.
 *
 * Nothing else here carries colour. There is no warn hue in this system and no
 * token for one: a call that has waited too long is drawn with weight and with
 * a raised ground, never with amber.
 *
 * ── WHAT LEFT THIS FILE ON 2026-08-15 ───────────────────────────────────
 * `GateAction`, `ReadFailed` and `FOCUS_RING`, into
 * `components/meridian/surface-parts.tsx`, where the same three ideas from the
 * other four ported surfaces now live once. `GateAction` split in two on the
 * way, because it was two controls: the orchid one that RELEASES the run is
 * `Approve`, and everything else is `Action`. The gate keeps only the thing no
 * other surface has, which is the question, its age and its evidence.
 */
export function CallGate({
  question,
  subject,
  since,
  now,
  lines,
  hiddenLineCount = 0,
  risk,
  declaredDefault,
  consequenceTitle,
  children,
  anchor,
}: {
  /** What is being asked, in plain words. Never a mechanism word. */
  question: string;
  /** The mission or project this sits in front of, when there is one. */
  subject?: string | null;
  /** Epoch ms this started waiting. Null when nothing recorded it. */
  since: number | null;
  /** Injectable so this renders deterministically in a test or a screenshot. */
  now: number;
  /** The facts that answer the question. One fact per line. */
  lines: string[];
  /** How many further lines exist and are not drawn. Printed, never silent. */
  hiddenLineCount?: number;
  /**
   * THE RISK, in prose, one line, second on the card.
   *
   * P-37, walked 17:12 IST. This slot did not exist, so the reversibility and
   * its undo sentence travelled in `lines` as the first fact, and what a person
   * saw after the question was the DEFAULT, because that was what `consequence`
   * happened to hold. The order was right in the component and the content was
   * in the wrong slots, which is the failure a fixed order is supposed to make
   * impossible and does not while the slots are ambiguous.
   *
   * Never a badge. A red HIGH RISK chip is a category the reader has to know the
   * taxonomy for; "It is live. Undoing means shipping a revert." is the actual
   * consequence, and the consequence is what changes the answer.
   */
  risk?: string | null;
  /**
   * WHAT HAPPENS IF NOBODY ANSWERS, mono and LAST, immediately above the
   * answers. A clock above them makes a question read as a countdown.
   *
   * Named `declaredDefault` and not `consequence` because those are two
   * different sentences and calling both by one name is how they ended up in
   * each other's places.
   */
  declaredDefault?: string | null;
  /**
   * The exact record behind the consequence sentence, on hover only -- the
   * same rule the age line follows: the phrase is what changes behaviour,
   * the precise instant rides along for anyone who needs it.
   */
  consequenceTitle?: string;
  /** The controls. One primary, and only one. */
  children?: ReactNode;
  /**
   * `presenceAnchor(...)`'s own return, spread onto the root. Stamps this
   * gate as the object a teammate's cursor can land on -- without it the
   * multiplayer presence layer, mounted once in the shell, finds nothing on
   * this surface and draws no cursor here.
   */
  anchor?: Record<string, string>;
}) {
  const overdue = since !== null && isOverdue(since, now);
  const fallbackLine = declaredDefault ?? null;

  return (
    <section
      data-mrd=""
      {...anchor}
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      {/*
       * ── THE ORDER IS THE DESIGN (P-37, corrected P-51) ──────────────────
       *
       * This card opened with a "Waiting on you" chip and a subject, then the
       * question, then the facts, then the consequence. Four regions before the
       * thing being asked, and the first of them was the defect A1 named as
       * shape 2: *"Waiting on you." beside a "Run it now" button, two verbs for
       * one state.* **A card that is asking IS the waiting**, and the line below
       * says since when, so the chip was a third statement of one fact.
       *
       * The order below, and it is fixed rather than passed. THIS DESCRIPTION
       * USED TO SAY "consequence" HERE, before that one slot's ambiguity was
       * the whole defect P-37/P-51 closed -- see the two named slots below:
       *
       *   question       what is being asked, alone
       *   risk           what answering yes causes. BEFORE the facts, because
       *                  it is what changes the answer; the facts are what
       *                  justify it once you know what is at stake.
       *   facts          the reason, in the reason's register
       *   declaredDefault what happens if nobody answers, mono, immediately
       *                  above the clock -- never the same sentence as `risk`
       *   waiting since  a fact about a clock, mono, LAST, because a clock
       *                  above the answers makes a question read as a countdown
       *   children       the controls
       *
       * The subject moves into the question's own line as quiet provenance,
       * which is the same move `Ask` makes with the asking seat: who or what
       * this is about qualifies the sentence and does not head it.
       */}
      <h2 className="text-mrd-h3 leading-mrd-tight font-medium text-mrd-ink">{question}</h2>
      {subject ? <p className="mt-mrd-1 text-mrd-small text-mrd-mute">{subject}</p> : null}

      {/* THE CONSEQUENCE LEADS THE EVIDENCE. It is one line and it is prose,
          never a badge: a category asks the reader to know the taxonomy, a
          sentence tells them what happens. */}
      {risk ? (
        <p className="mt-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-ink">{risk}</p>
      ) : null}

      {lines.length > 0 ? (
        /*
         * A recess, not a second card. The standard caps a region at one
         * bordered container; the evidence reads as part of the question by
         * sitting BELOW the ground rather than on top of it.
         */
        <div className="mt-mrd-4 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          <ul className="flex flex-col gap-mrd-3">
            {lines.map((line, i) => (
              <li key={i} className="leading-mrd-prose text-mrd-prose text-mrd-body">
                {line}
              </li>
            ))}
          </ul>

          {/*
           * A CAP PRINTS ITS REAL NUMBER. This surface has always shown three
           * lines and silently dropped the rest, which is the one thing a list
           * may not do: a reader cannot know they are missing something. No
           * door is drawn to the remainder because there is nowhere to send
           * them, and an arrow to nowhere is worse than none.
           */}
          {hiddenLineCount > 0 ? (
            <p className="font-mrd-mono mt-mrd-3 text-mrd-small tabular-nums text-mrd-faint">
              {hiddenLineCount} further {hiddenLineCount === 1 ? "line" : "lines"} not shown here.
            </p>
          ) : null}
        </div>
      ) : null}

      {/*
       * WAITING SINCE, MONO AND LAST. Tabular figures so the number reads as a
       * measurement and does not jitter as it ticks. The exact instant rides
       * along as a title for anyone who needs it; the phrase is what changes
       * behaviour.
       *
       * It no longer turns accent when overdue. An overdue gate was drawing a
       * second alarm on a card whose whole existence is the alarm, and the
       * weight change alone carries "this has been a while" without adding a
       * colour that means "act now" to a person who is already here.
       */}
      {/* The declared default, mono and last, immediately above the answers. */}
      {fallbackLine ? (
        <p
          title={consequenceTitle}
          className="font-mrd-mono mt-mrd-4 text-mrd-data leading-mrd-prose text-mrd-mute"
        >
          {fallbackLine}
        </p>
      ) : null}

      {since !== null ? (
        <p
          title={new Date(since).toLocaleString()}
          className={`font-mrd-mono mt-mrd-4 text-mrd-data tabular-nums text-mrd-mute ${
            overdue ? "font-semibold" : ""
          }`}
        >
          Waiting on you for {stoppedFor(since, now)}.
        </p>
      ) : (
        <p className="mt-mrd-4 text-mrd-data text-mrd-faint">
          How long this has been waiting is not known.
        </p>
      )}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{children}</div> : null}
    </section>
  );
}

export default CallGate;
