import type { ReactNode } from "react";

import { StatusChip } from "./StatusChip";

/*
 * SPEND AGAINST A CEILING.
 *
 * ── WHY THIS EXISTS, CORRECTED 2026-08-20 ───────────────────────────────
 * THE FIRST VERSION OF THIS COMMENT SAID "NOTHING IN THIS SYSTEM RENDERED
 * SPEND" AND THAT WAS FALSE. `governance/BudgetsPanel.tsx` has rendered a burn
 * against its ceiling since 2026-07-30, three weeks before this component was
 * written, and it had its own resolver for the threshold. That resolver is now
 * gone and this file holds the only one, which is the actual value delivered
 * here and is worth more than the claim it replaces.
 *
 * WHAT IS TRUE: no Meridian PRIMITIVE said it, so every surface that needed to
 * wrote its own. Measured today there are eight local money formatters in
 * `src/**` outside tests, plus a shared `fmtUsd` in `components/product/format.ts`
 * that four of them ignore. Meanwhile the product meters credits against three
 * separate ceilings: an account cap, a per-mission cap at $10 and a per-track
 * cap at $5.
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
 * NONE OF THE EXISTING COPIES COULD SERVE, and this is the "say why" the search
 * rule asks for. There are more of them than the first version of this comment
 * said: `admin.proof.tsx`, `admin.ai-costs.tsx`, `SpendRoom.tsx`, `RecordRoom.tsx`
 * and `traces.$traceId.tsx` carry near-identical local ones, `runs.index.tsx`,
 * `AnalyticsPanel.tsx` and `engine-room-glance.ts` carry variants, and
 * `components/product/format.ts` carries the one that is actually shared. Every
 * one of the nine hard-codes a dollar sign and a decimal point, which is wrong in
 * every locale that puts the symbol after the number or uses a comma, and this
 * component is required to be locale-safe. The shared one additionally returns
 * `"$0"` for zero, so it cannot render the empty case as `$0.00` against a cap.
 * So the formatting goes through `Intl`, which also gets the grouping separator
 * right at four figures, something none of the nine do.
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

/**
 * Where this stands, computed once so the bar, the hue and the words agree.
 *
 * THE ONLY RESOLVER OF THIS QUESTION IN THE PRODUCT, as of 2026-08-20.
 * `BudgetsPanel` had its own `burnTone(burn, cap, alertPct)` and the two could
 * disagree, so two surfaces could call one workspace nearly-spent and
 * not-nearly-spent on identical numbers. That one is deleted and it calls this.
 *
 * `alertAt` IS A FRACTION, not a percentage, and the trap is real rather than
 * theoretical: the column behind it is `alert_at_pct` and it stores 80, so a
 * caller reading the database passes `pct / 100` or gets a threshold 100 times
 * too high, which never fires and looks like nothing is wrong.
 *
 * ── A CAP OF ZERO IS A CEILING, NOT AN ABSENCE ──────────────────────────
 * This used to fold `cap <= 0` into `uncapped`, and a test pinned that as the
 * contract, so `<Spend spent={5} cap={0} />` rendered "$5.00 of $0.00" with an
 * empty bar and no alarm at all. THE SERVER DISAGREES, which is what settles it:
 * `checkBudget` (runtime.server.ts:915) refuses a call whenever
 * `cap != null && used >= cap`, so a cap of 0 blocks everything, and
 * `budgets.functions.ts` validates the column as `.min(0).nullable()`, so 0 is a
 * value a person can store. The one honest reading is that nothing may be spent,
 * and `spent >= cap` says that without a special case.
 *
 * `null` is the only absence. That now matches the render, which has always
 * branched on `cap === null` and disagreed with this function about zero.
 *
 * ── A THRESHOLD OF ZERO IS NO THRESHOLD ─────────────────────────────────
 * `alert_at_pct` has no CHECK constraint, so 0 is storable, and without the
 * guard `spent >= cap * 0` is true at every amount including nothing spent. A
 * workspace that set 0 would wear a permanent amber. Zero means no early
 * warning, so the only thing it hears about is the ceiling.
 */
export function spendState(spent: number, cap: number | null, alertAt: number): SpendState {
  if (cap === null) return "uncapped";
  if (spent >= cap) return "spent";
  if (alertAt > 0 && spent >= cap * alertAt) return "nearly";
  return "spending";
}

const FILL: Record<SpendState, string> = {
  spending: "bg-mrd-body",
  nearly: "bg-mrd-hold",
  spent: "bg-mrd-fail",
  uncapped: "bg-mrd-body",
};

/**
 * THE STATE IS A CHIP, NOT COLOURED TEXT, and that is a measurement rather than a
 * restyle.
 *
 * This file shipped with `text-mrd-hold` and `text-mrd-fail` on its state line.
 * On paper those two land at 5.06 and 5.99 against the ground, which clears the
 * legibility floor and fails at SALIENCE: at the lightness the floor forces, amber
 * resolves to brown and the line reads as a shade of black with a tint on it. No
 * value fixes it, because the sRGB gamut has no chroma there. The colour has to
 * occupy area, so the state wears the same chip the run views wear and the figure
 * beside it stays plain.
 *
 * The BAR keeps the hue directly, and that is not an inconsistency: a bar is
 * already area. What could not carry colour was type.
 */
const CHIP: Partial<Record<SpendState, "hold" | "fail">> = {
  nearly: "hold",
  spent: "fail",
};

/**
 * The same four states as a `Value` tone, for a surface that says this in a
 * sentence rather than with a bar.
 *
 * IT EXISTS SO `BudgetsPanel` CAN DELETE ITS OWN COPY, and it deliberately does
 * not export a second threshold: the state comes from `spendState` and this only
 * paints it.
 *
 * `spending` IS QUIET AND NOT `pass`, which is a change to what that surface
 * rendered and is the point of reconciling rather than aliasing. `burnTone`
 * returned `pass` for a burn under the threshold, and Meridian's colour law
 * reserves pass for "an outcome that happened, never an intent". Spending $2 of
 * $5 is not an outcome, and painting it green is the product approving of the
 * spend, which is not its call to make. The bar in this file has always drawn
 * that state neutral, so this is the two surfaces agreeing rather than a new
 * opinion.
 */
export const SPEND_TONE: Record<SpendState, "quiet" | "hold" | "fail"> = {
  spending: "quiet",
  nearly: "hold",
  spent: "fail",
  uncapped: "quiet",
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
  const chip = CHIP[state];

  /*
   * THE FILL, CLAMPED AT BOTH ENDS. It used to be clamped at the top only, so
   * `spent={-2} cap={5}` emitted `style="width:-40%"`, which is not a length. A
   * negative burn is a ledger that went backwards rather than a state this
   * component can explain, so the figure above still prints exactly what it was
   * given and the drawing refuses to invert.
   *
   * A cap of zero fills the track completely, because nothing may be spent and
   * the ceiling is therefore already at the reader's back. Dividing by it would
   * produce Infinity, so it is answered before the division rather than after.
   */
  const pct =
    cap === null ? 0 : cap > 0 ? Math.max(0, Math.min(100, (spent / cap) * 100)) : 100;

  /*
   * THE SMALLEST MARK IS A DOT, AND A DOT IS THE TRACK'S OWN HEIGHT.
   *
   * `spent={0.0008} cap={5}` is 0.016%, which on this 320px track is 0.05px:
   * nothing at all, in the case the gallery labels "under a cent, which must not
   * read as nothing". The figure said $0.0008 and the bar said no.
   *
   * `min-w-1` and the track's `h-1` compile to the same declaration, checked in
   * the built stylesheet rather than assumed: both are `var(--spacing)`, which is
   * `0.25rem`, so the floor is exactly the track's height and cannot drift from it
   * by editing one of the two. At the floor the fill is a 4px circle rather than a
   * hairline, which is the smallest thing this bar can draw that is still a mark.
   * Anything narrower is a rendering artifact.
   *
   * Only when something has actually been spent. Zero spent draws nothing,
   * because zero is the one amount that really does read as nothing.
   */
  const floor = spent > 0 && pct > 0 ? " min-w-1" : "";

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
        <span className="min-w-0 truncate text-mrd-label text-mrd-body">{label}</span>
        <span className="shrink-0 font-mrd-mono text-mrd-data tabular-nums">
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
            className={`h-full rounded-mrd-xs ${FILL[state]}${floor}`}
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
        <p className="mt-mrd-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-mrd-data leading-relaxed text-mrd-mute">
          {cap === null ? (
            <span>No cap is set, so nothing stops this on spend.</span>
          ) : (
            <>
              {chip ? (
                <StatusChip status={chip}>
                  {state === "spent" ? "Cap reached" : word}
                </StatusChip>
              ) : null}
              {note ? <span>{note}</span> : null}
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

export default Spend;
