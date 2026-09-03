/**
 * ── A SEAT REPORTS ITS OWN WORK, AND NOTHING ELSE ─────────────────────────
 *
 * P-37, shape 3. On the honest run the character said *"I've stopped, the reason
 * is on the hold line"* directly above a card headed *"Why it stopped"*, and
 * *"I'm ready, press run"* after the person had already pressed.
 *
 * Both are the PRODUCT's sentences wearing a character's first person. The fix
 * is not better timing, because the timing was only the symptom: a voice that is
 * allowed to narrate the run's state will eventually narrate it twice, or late.
 *
 * SO THE VOICE IS NARROWED RATHER THAN SCHEDULED. A seat says what it did and
 * what it found. The card says what the run is doing and what it needs. There is
 * no longer a speaker who COULD say "I've stopped", which closes shape 3
 * structurally rather than by remembering (A1, amendment 6).
 *
 * ── NO BUTTON SLOT, DELIBERATELY ──────────────────────────────────────────
 *
 * `one state, one sentence, one door` is the rule this screen is being rebuilt
 * around, and the fastest way to break it is a message that can carry its own
 * action. There is no `action` prop here and there is no `children`. A seat that
 * needs the person to do something is describing a state, and states belong to
 * `Ask`.
 *
 * Never in the imperative, for the same reason: "press run" is the card's to say
 * and only if the card is asking.
 */
import * as React from "react";

export function SeatSays({
  seat,
  said,
  at,
  meta,
  mark,
}: {
  /** The seat's own name, quiet. It qualifies the sentence rather than heading it. */
  seat: string;
  /** What it did or found, in its own first person. One moment, one sentence. */
  said: string;
  /** When, read at a glance. */
  at?: string | null;
  /** One fact about the work, never a row of them. "41 signals read". */
  meta?: string | null;
  /** The seat's mark, when one is drawn. Purely identity; it carries no state. */
  mark?: React.ReactNode;
}) {
  return (
    <div data-mrd="" className="flex items-start gap-mrd-3 font-mrd">
      {mark ? <div className="mt-0.5 shrink-0">{mark}</div> : null}
      <div className="flex min-w-0 flex-col gap-mrd-1">
        <p className="text-mrd-small font-[650] text-mrd-mute">{seat}</p>
        {/* The one thing worth reading, at prose size because it is prose. */}
        <p className="text-mrd-prose leading-mrd-prose text-mrd-ink">{said}</p>
        {at || meta ? (
          <p className="text-mrd-data text-mrd-faint">{[at, meta].filter(Boolean).join(" · ")}</p>
        ) : null}
      </div>
    </div>
  );
}

export default SeatSays;
