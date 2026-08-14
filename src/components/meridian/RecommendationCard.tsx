import { useState, type ReactNode } from "react";

/*
 * RECOMMENDATION CARD, an agent's suggestion with how sure it is attached.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Recommendation
 *                 Card" (their file: components/RecommendationCard.tsx), MIT
 *                 licensed, read on 2026-08-14 from the exact string that
 *                 page's own "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * It goes under the Decide gate and on the forecast desk. The forecast desk
 * carries a real defect this card is built to fix: when a model returns output
 * the product cannot parse, that is written down as confidence 0, and a zero
 * renders exactly like a considered judgment that happened to score low. A
 * reader cannot tell "the model thought hard and is unsure" from "there is no
 * answer here at all", and those two ask for completely different things.
 *
 * So confidence is `number | null` and null is NOT zero. A number, including
 * 0, means a reading was taken and this is it. Null means no reading exists,
 * and the card drops the meter entirely rather than drawing an empty one: a
 * meter at zero is still a measurement, and drawing one would repeat the exact
 * lie this component was written to stop.
 *
 * ── WHERE THE ACCENT GOES ───────────────────────────────────────────────
 * `--mrd-you` means a person is required, and on this card that is the primary
 * control and nothing else. A suggestion sitting on screen is not yet asking
 * for anyone; the control that resolves it is. Once resolved the accent is
 * replaced by `--mrd-pass`, which reports an outcome and never a need.
 *
 * ── WHAT IS DELIBERATELY NOT COPIED ─────────────────────────────────────
 * The reference paints the meter green at high confidence, orange at medium
 * and grey at none. All three are wrong here. Green reports an OUTCOME under
 * Meridian, so a green meter would tell a reader the recommendation already
 * worked, which nobody knows yet. Orange does not exist in this system at all
 * and is not coming back. And a meter that says its value twice, once in bar
 * count and once in hue, fails the greyscale test: strip the colour and it
 * loses nothing, which means the colour was never carrying the fact. The bars
 * are neutral and the count is the whole signal.
 *
 * The reference styles inline code chips with a brand tint. A table name is
 * categorical, not status, so the chips are neutral here and the accent stays
 * available for the one thing that is actually asking for a person.
 */

export type Recommendation = {
  /** Stable key. */
  key: string;
  /** The suggestion itself, as a reader would say it. */
  body?: ReactNode;
  /** One line form, used in the alternatives list. */
  short: string;
  /**
   * How sure the model is, 0 to 1.
   *
   * `null` is not a low score. It means the model returned something this
   * product could not read, so no score exists. Callers must pass null there
   * rather than coercing to 0, because 0 is a real and different claim: the
   * model gave an answer and rated it worthless.
   */
  confidence: number | null;
  /**
   * The verb on the primary control. Default "Approve", which is correct only
   * because accepting a recommendation UNBLOCKS the gate behind it. Where this
   * card only opens something for a person to look at, the verb is "Review".
   */
  action?: string;
};

const BARS = 3;

function band(confidence: number) {
  if (confidence >= 0.67) return "High confidence";
  if (confidence >= 0.34) return "Some confidence";
  return "Low confidence";
}

function filled(confidence: number) {
  return Math.max(0, Math.min(BARS, Math.round(confidence * BARS)));
}

/*
 * Neutral by design, see the header. Bar count is the reading; hue would only
 * restate it, and every hue this system owns already means something else.
 */
function Meter({ confidence }: { confidence: number }) {
  const on = filled(confidence);
  return (
    <span aria-hidden className="flex items-end gap-0.5">
      {Array.from({ length: BARS }, (_, bar) => (
        <span
          key={bar}
          className="w-1 rounded-full transition-colors duration-300"
          style={{
            height: 10,
            background: bar < on ? "var(--mrd-ink)" : "var(--mrd-edge)",
          }}
        />
      ))}
    </span>
  );
}

/*
 * The unreadable case, which is the whole reason this file differs from its
 * source. No meter, because there is no measurement. A hollow ring instead,
 * which reads as "nothing came back" rather than as "it came back small".
 */
function NoReading() {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{ boxShadow: "inset 0 0 0 1.5px var(--mrd-edge)" }}
    />
  );
}

function Confidence({ confidence }: { confidence: number | null }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {confidence === null ? <NoReading /> : <Meter confidence={confidence} />}
      <span className="truncate text-[12.5px] font-medium text-mrd-body">
        {confidence === null ? "No usable answer" : band(confidence)}
      </span>
    </span>
  );
}

export function RecommendationCard({
  question,
  options,
  onAccept,
}: {
  /** What the agent is asking permission for. */
  question: string;
  /**
   * Ranked, best first. An empty list is a real case and gets its own state.
   * A list of one is the common case today and never shows an alternatives
   * control, because there are none.
   */
  options: Recommendation[];
  onAccept?: (option: Recommendation) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  /*
   * THE ZERO CASE. Composed deliberately, because production holds 296
   * decisions and exactly one forecast, so a desk with nothing to suggest is
   * the state a reader will actually meet. It says which of the two silences
   * this is: no suggestion yet, not a suggestion the product failed to read.
   * The second silence is the `confidence: null` state below, and confusing
   * them is the same mistake at a different level.
   */
  if (options.length === 0) {
    return (
      <div className="w-full max-w-[380px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-4">
        <p className="text-[13px] font-medium text-mrd-body">No suggestion yet.</p>
        <p className="mt-1 text-[12px] leading-relaxed text-mrd-mute">
          Nothing has been proposed for this call. The gate is open and the decision is
          yours to make directly.
        </p>
      </div>
    );
  }

  const active = options[selected];
  const others = options.map((option, i) => ({ option, i })).filter(({ i }) => i !== selected);
  const unreadable = active.confidence === null;
  const verb = active.action ?? (unreadable ? "Review" : "Approve");

  return (
    <div
      className="w-full max-w-[380px] overflow-hidden rounded-mrd-card bg-mrd-sheet"
      style={{ boxShadow: "var(--mrd-shadow-card)" }}
    >
      <div className="px-4 pt-3.5 pb-3">
        <span className="text-[13px] font-semibold text-mrd-ink">{question}</span>
        <p
          key={active.key}
          className="mt-1.5 min-h-12 text-[13px] leading-relaxed text-mrd-body"
          style={{ animation: "mrd-fade-in 180ms var(--mrd-ease-soft) both" }}
        >
          {unreadable ? (
            <>
              The model answered, but the answer did not come back in a form this product
              could read, so there is nothing here to weigh. This is not a weak
              recommendation. It is the absence of one, and it needs a person rather than a
              second opinion.
            </>
          ) : (
            (active.body ?? active.short)
          )}
        </p>
      </div>

      {/* Alternatives. Drawn only when there are alternatives to draw. */}
      {others.length > 0 ? (
        <div
          className="grid transition-[grid-template-rows,opacity] duration-300"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
            transitionTimingFunction: "var(--mrd-ease)",
          }}
        >
          <div className="overflow-hidden">
            <div className="border-t border-mrd-line-soft bg-mrd-sink px-2 py-2">
              <p className="px-1.5 pb-1 text-[11px] font-medium text-mrd-mute">Other options</p>
              {others.map(({ option, i }) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setSelected(i);
                    setAccepted(false);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-mrd-ctl px-1.5 py-1.5 text-left transition-colors duration-100 hover:bg-mrd-hover"
                >
                  {option.confidence === null ? (
                    <NoReading />
                  ) : (
                    <Meter confidence={option.confidence} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-mrd-ink">
                    {option.short}
                  </span>
                  <span className="shrink-0 text-[11px] text-mrd-mute">
                    {option.confidence === null ? "No usable answer" : band(option.confidence)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-mrd-line-soft bg-mrd-sink px-3 py-2">
        <Confidence confidence={active.confidence} />

        <span className="flex shrink-0 items-center gap-2">
          {others.length > 0 ? (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
              className={`h-7 rounded-mrd-ctl px-2.5 text-[12.5px] font-medium text-mrd-ink transition-[background-color,transform] duration-100 active:scale-[0.96] ${
                open ? "bg-mrd-hover" : "bg-mrd-lift hover:bg-mrd-hover"
              }`}
            >
              Alternatives
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setAccepted(true);
              onAccept?.(active);
            }}
            className="h-7 rounded-mrd-ctl px-3 text-[12.5px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96]"
            style={{
              /*
               * The one accent on this card. It is the pending human action,
               * so it holds `--mrd-you` until it is resolved, and then hands
               * over to `--mrd-pass`, which reports what happened.
               */
              background: accepted ? "var(--mrd-pass)" : "var(--mrd-you)",
              color: "var(--mrd-bg)",
            }}
          >
            {accepted ? "Done" : verb}
          </button>
        </span>
      </div>
    </div>
  );
}

export default RecommendationCard;
