import type { ReactNode } from "react";

/*
 * WHAT YOU SETTLED, this session. Drawn in Meridian.
 *
 * ── THE RULING THIS CARRIES, AND IT IS NOT MINE TO CHANGE ───────────────
 * agents/FINAL-agent-presence.md R10 and §9 name this surface and this line as
 * the defect. Settling a call used to fire a toast saying "Approved." and the
 * card vanished. A toast confirms that your click REGISTERED; this renders what
 * your click CAUSED. An approval that erases itself teaches you that your
 * judgment left no trace, and judgment is the product, so it leaves a mark at
 * the moment it is made.
 *
 * The consequence is per item and real, taken from the call's own words, so it
 * says the true thing rather than a generic confirmation.
 *
 * NO ARROW TO A RECEIVING AGENT. Nothing in the response tells us who picks the
 * work up, and an arrow to nowhere is worse than no arrow.
 *
 * ── SPOKEN, NOT ONLY DRAWN ──────────────────────────────────────────────
 * Carried over verbatim from the primitive this replaces, because the defect it
 * fixed was found by an accessibility audit on 2026-08-06 and was true on every
 * gate in the product: a person using a screen reader pressed a key, the call
 * was settled, the queue dropped it, the question silently became the next
 * call, and none of it was announced. They got total silence after committing
 * an irreversible decision.
 *
 * `role="status"` is the polite register: it waits for a pause rather than
 * interrupting, which is right for a confirmation of something the person just
 * did deliberately. NOT `role="alert"`, which is for trouble the person did not
 * cause. A failed line still uses status: the failure is the answer to their own
 * keypress, and it is on screen where they are already looking.
 *
 * ── WHY IT IS SESSION LOCAL ─────────────────────────────────────────────
 * The durable record is the trust audit trail. Keeping a second copy here would
 * be a second source of one truth, which this product has paid for before.
 */

export type SettledLine = {
  id: string;
  /** What you did, in your own voice: "You approved", "You declined". */
  verb: string;
  /** What it caused. Real, per item, never a generic confirmation. */
  consequence: ReactNode;
  /** Clock time, so a long session can tell two identical calls apart. */
  at: string;
  failed?: boolean;
};

export function SettledTrail({ lines }: { lines: SettledLine[] }) {
  if (lines.length === 0) return null;

  return (
    <section>
      <h2 className="text-[13px] font-medium text-mrd-mute">What you settled</h2>

      <ul className="mt-mrd-4 flex flex-col gap-mrd-2">
        {lines.map((line, i) => (
          <li
            key={`${line.id}-${i}`}
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-3"
            style={{ animation: "mrd-fade-up 300ms var(--mrd-ease) both" }}
          >
            {/*
             * A FAILED WRITE GETS THE FAILED SHAPE IMMEDIATELY, never a success
             * shape over a failed write. That is the one thing that makes the
             * successful ones trustworthy. Red is an outcome here, which is the
             * only thing red is allowed to be in this system; a settled call is
             * the outcome pair's other half and stays neutral, because the verb
             * already says who acted.
             */}
            <span
              className={`text-[13px] font-medium ${line.failed ? "text-mrd-fail" : "text-mrd-ink"}`}
            >
              {line.verb}
            </span>
            <span className="min-w-0 text-[12.5px] leading-snug text-mrd-prose text-mrd-body">
              {line.consequence}
            </span>
            <span className="font-mrd-mono ml-auto shrink-0 text-[12px] tabular-nums text-mrd-faint">
              {line.at}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default SettledTrail;
