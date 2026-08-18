import * as React from "react";
import { AgentMark, YouMark } from "@/components/meridian/marks";

/**
 * THE RECEIPT: what a judgment left behind. The product's signature moment.
 *
 * ── WHY IT IS A COMPONENT AND NOT A TOAST ───────────────────────────────
 * A toast confirms that your click registered. A receipt renders what your
 * click CAUSED, and that difference is the product thesis expressed as an
 * interaction. An approval that erases itself teaches you that your judgment
 * left no trace, and judgment is the product.
 *
 * `handoff` draws the arrow to whoever picks the work up, and is drawn ONLY
 * when something real does. Where nothing follows, pass nothing and let
 * `consequence` say what changed instead. Never an arrow to nowhere.
 *
 * ── THE LIVE REGION IS LOAD-BEARING, NOT DECORATION ─────────────────────
 * Carried over verbatim from the retired primitive, because it fixes a defect
 * an accessibility audit found on 2026-08-06 and it would be silently lost in
 * a port that only moved the paint.
 *
 * THE DEFECT: a person using a screen reader pressed `a` on Today, the call was
 * approved, the queue dropped it, the Gate's question silently became the next
 * call, and a receipt appeared saying what happened. NONE of it was announced.
 * They got total silence after committing an irreversible decision, and the
 * only way to learn the result was to re-explore the page. Six surfaces had it
 * and not one carried a live region. The codebase plainly knew the pattern: it
 * had been applied to "an agent is working" and never to "your decision was
 * recorded", which is the louder of the two.
 *
 * `role="status"` is the polite register: it waits for a pause rather than
 * interrupting, which is right for a confirmation of something the person just
 * did deliberately. NOT `role="alert"`, which interrupts and is for trouble the
 * person did not cause. A failed receipt still uses status, because the failure
 * is the answer to their own keypress and it is on screen where they are
 * already looking.
 *
 * ── WHAT CHANGED IN THE PORT ────────────────────────────────────────────
 * The rule between stacked receipts was `.sp-receipt + .sp-receipt`, a sibling
 * selector. Tailwind cannot express that, so it is inverted to a top border
 * with `first:border-t-0`, which renders identically and is the more robust
 * half: a single receipt outside a list no longer depends on having no sibling.
 *
 * The entrance is set INLINE rather than as a class, because meridian.css's
 * reduced-motion block matches on the style attribute; declared in a utility it
 * would keep animating for someone who asked it not to.
 *
 * Colour: `failed` moves the VERB to `--mrd-fail` and nothing else. The
 * consequence stays body text, because red reports an outcome and the outcome
 * here is the verb. Painting the whole row red would make a failed receipt
 * shout louder than the gate that caused it.
 */
export function Receipt({
  verb,
  consequence,
  handoff,
  time,
  failed = false,
  initials,
}: {
  /** What you did, in your own voice: "You approved", "You sent it back". */
  verb: string;
  /** What it caused. Real, per-item, never a generic confirmation. */
  consequence: React.ReactNode;
  /** The agent that picked it up, if one genuinely did. */
  handoff?: { slug: string | null | undefined; name?: string | null } | null;
  time?: string | null;
  failed?: boolean;
  initials?: string;
}) {
  return (
    <div
      data-mrd=""
      role="status"
      aria-live="polite"
      className="flex items-center gap-mrd-4 border-t border-mrd-line-soft py-[11px] text-[14px] leading-snug text-mrd-body first:border-t-0"
      style={{ animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease)" }}
    >
      {initials ? <YouMark initials={initials} mine /> : null}

      <span className="min-w-0 flex-1">
        <span className={`font-medium ${failed ? "text-mrd-fail" : "text-mrd-ink"}`}>{verb}</span>
        {" · "}
        {consequence}
      </span>

      {handoff ? (
        <>
          <span aria-hidden className="shrink-0 text-mrd-faint">
            &rarr;
          </span>
          <AgentMark slug={handoff.slug} name={handoff.name} state="running" />
        </>
      ) : null}

      {time ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] tabular-nums text-mrd-faint">
          {time}
        </span>
      ) : null}
    </div>
  );
}
