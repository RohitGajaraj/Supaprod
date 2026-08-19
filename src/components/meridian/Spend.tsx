import type { ReactNode } from "react";

/*
 * SPEND AGAINST A CEILING.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * NOTHING IN THIS SYSTEM RENDERED SPEND, in a product that meters credits and
 * enforces three separate ceilings: an account cap, a per-mission cap at $10 and
 * a per-track cap at $5. Every surface that needed to say it wrote its own
 * `$${n.toFixed(2)}` inline, and there are five copies of the same four-line
 * formatter in the tree to prove it.
 *
 * Meridian's colour law names this case by name. `--mrd-hold` means "stopped, or
 * about to be, and NOT on you", and the law's own example of it is "a cap nearly
 * spent". So the meaning had a token, the token had a documented example, and
 * the example had no component.
 *
 * ── A BAR IS ALLOWED HERE, AND ONLY HERE ────────────────────────────────
 * This system refuses progress bars, and the refusal is worth restating so this
 * component does not read as a violation of it. The rule is: a coding agent
 * cannot know how long it will take, so a bar that implies a proportion of an
 * unknown total is a lie a reader catches inside one session.
 *
 * Spend against a cap is the opposite case. Both numbers are known exactly, the
 * denominator does not move, and the proportion is the fact. Drawing it is the
 * honest thing; withholding it and printing two numbers would make a reader do
 * arithmetic to answer "how close am I".
 *
 * ── PROXIMITY IS NOT CARRIED BY HUE ─────────────────────────────────────
 * The fill's LENGTH says how close. The hue only confirms it, and the state says
 * it again in words. Remove the colour and the bar and the sentence both still
 * work, which is what the greyscale rule asks.
 *
 *   under the alert      neutral. Nothing is wrong and nothing shouts.
 *   at or past it        --mrd-hold. Waiting on a condition, not on you: what
 *                        changes this is spend coming down or the cap going up,
 *                        neither of which is a decision on this screen.
 *   cap reached          --mrd-fail. And ONLY here. Red reports a result, and
 *                        the result has now happened: the ceiling was hit.
 *
 * The alert threshold defaults to 80%, which is not a number chosen here: it is
 * what `notifications.functions.ts` already uses to raise "Approaching spend
 * cap", and two surfaces disagreeing about when to worry is worse than either
 * figure being slightly wrong.
 */

export type SpendState = "spending" | "nearly" | "spent" | "uncapped";

/**
 * Money, locale-safe.
 *
 * THE FIVE EXISTING COPIES COULD NOT SERVE, and this is the "say why" the search
 * rule asks for. `admin.proof.tsx`, `admin.ai-costs.tsx`, `SpendRoom.tsx` and
 * `RecordRoom.tsx` each carry a byte-identical `usd()`, and `runs.index.tsx` a
 * fifth variant, and all of them hard-code a dollar sign and a decimal point.
 * That is wrong in every locale that puts the symbol after the number or uses a
 * comma, and this component is required to be locale-safe. So the formatting
 * goes through `Intl`, which also gets the grouping separator right at four
 * figures, something none of the five do.
 *
 * FOUR DECIMALS UNDER A CENT, which the house already does and is right about:
 * `engine-room-glance.ts` says it in its own comment, "small real amounts must
 * not round to a fabricated $0". A run that cost eight hundredths of a cent
 * spent real money and a surface reporting $0.00 is telling a reader nothing
 * happened.
 */
function money(amount: number, currency: string): string {
  const sub = amount > 0 && amount < 0.01;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: sub ? 4 : 2,
    maximumFractionDigits: sub ? 4 : 2,
  }).format(amount);
}

/** Where this stands, computed once so the bar, the hue and the words agree. */
export function spendState(spent: number, cap: number | null, alertAt: number): SpendState {
  if (cap === null || cap <= 0) return "uncapped";
  if (spent >= cap) return "spent";
  if (spent >= cap * alertAt) return "nearly";
  return "spending";
}

const FILL: Record<SpendState, string> = {
  spending: "bg-mrd-body",
  nearly: "bg-mrd-hold",
  spent: "bg-mrd-fail",
  uncapped: "bg-mrd-body",
};

const TEXT: Record<SpendState, string> = {
  spending: "text-mrd-mute",
  nearly: "text-mrd-hold",
  spent: "text-mrd-fail",
  uncapped: "text-mrd-mute",
};

export function Spend({
  label,
  spent,
  cap,
  currency = "USD",
  alertAt = 0.8,
  note,
}: {
  /** Which ceiling this is. Three exist, so an unlabelled figure is ambiguous. */
  label: string;
  spent: number;
  /**
   * `null` is a real state and the product has it: a workspace with no cap set
   * runs every station until the work finishes and nothing stops it on spend.
   * That is a fact worth rendering, not an absence to hide.
   */
  cap: number | null;
  /** ISO 4217. A prop rather than a constant because `Intl` needs one and
   *  hard-coding USD inside a design primitive is how the five copies happened. */
  currency?: string;
  /**
   * The fraction of the cap at which this starts saying so. 80% by default,
   * matching what already raises the "Approaching spend cap" notification.
   */
  alertAt?: number;
  /**
   * What happens at the ceiling, in the caller's words. Deliberately not written
   * here: an account cap blocks the next call, a per-track cap stops the work and
   * waits for a person, and a component cannot tell which ceiling it is drawing.
   * Inventing one consequence for all three would make it wrong twice.
   */
  note?: ReactNode;
}) {
  const state = spendState(spent, cap, alertAt);
  const pct = cap && cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;

  const word =
    state === "spent"
      ? "cap reached"
      : state === "nearly" && cap !== null
        ? `${money(cap - spent, currency)} left`
        : "";

  return (
    <div data-mrd="" className="w-full max-w-80 font-mrd">
      {/*
       * The label sits left and the figures sit hard right, which is what keeps
       * the digits from shoving anything. `tabular-nums` holds each digit to one
       * width so a changing amount does not jitter, and pinning the pair to the
       * right edge means the one case that DOES change string length, four
       * decimals under a cent, grows into the slack in the middle instead of
       * pushing the cap along the line.
       */}
      <div className="flex items-baseline justify-between gap-mrd-4">
        <span className="min-w-0 truncate text-[12.5px] text-mrd-body">{label}</span>
        <span className="shrink-0 font-mrd-mono text-[11.5px] tabular-nums">
          <span className="text-mrd-ink">{money(spent, currency)}</span>
          {cap === null ? null : (
            <span className="text-mrd-mute"> of {money(cap, currency)}</span>
          )}
        </span>
      </div>

      {/*
       * `aria-hidden`, and the text below carries the whole fact instead.
       *
       * `role="meter"` is the semantically correct role for a measurement inside
       * a known range and its support across screen readers is patchy enough that
       * it announces as nothing in several. The numbers and the state word are
       * both already text, so nothing is lost by leaving the drawing out of the
       * accessible tree, and a mis-announced meter is worse than no meter.
       */}
      <div
        aria-hidden
        className="mt-mrd-3 h-1 w-full overflow-hidden rounded-mrd-xs bg-mrd-sink"
      >
        {cap === null ? null : (
          <div
            className={`h-full rounded-mrd-xs ${FILL[state]}`}
            style={{
              width: `${pct}%`,
              /* The width eases; nothing pulses. A cap that throbbed as it filled
                 would be the surface arguing with the reader about a number they
                 can already see. */
              transition: "width var(--mrd-d-move) var(--mrd-ease)",
            }}
          />
        )}
      </div>

      {/*
       * The state in words, and it is deliberately the REMAINING amount rather
       * than a percentage. "Nearly spent" tells a reader to worry; "$0.62 left"
       * tells them how much room they have, which is the thing they were going to
       * work out next.
       */}
      {word || note || cap === null ? (
        <p className={`mt-mrd-3 text-[11.5px] leading-relaxed ${TEXT[state]}`}>
          {cap === null ? (
            <span>No cap is set, so nothing stops this on spend.</span>
          ) : (
            <>
              {word ? <span className="font-mrd-mono tabular-nums">{word}</span> : null}
              {word && note ? <span className="text-mrd-mute">. </span> : null}
              {note ? <span className="text-mrd-mute">{note}</span> : null}
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

export default Spend;
