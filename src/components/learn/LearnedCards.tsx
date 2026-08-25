import { InsightCards, type Insight } from "@/components/meridian/InsightCards";
import { NothingYet, Num, Reading } from "@/components/meridian/surface-parts";
import { VERDICT_SAYS, type Verdict } from "@/components/learn/verdict-words";

/**
 * The Learn station's outcomes, read through Meridian's InsightCards.
 *
 * FEED. `listLearnings` rows, newest first, already scoped by the route to the
 * workspace the settle desk reported. No second fetch. A trend card is built
 * only where the row carries every fact the card renders: a clean verdict
 * (worked or did not), the summary written by whoever settled it, and BOTH
 * ends of the bet-priority move, so the line is a before and an after and
 * nothing is drawn that the record does not hold.
 *
 * TWO DELIBERATE EXCLUSIONS, both honesty rather than gap:
 *   · `mixed` is a real third verdict on this record and none of the reader's
 *     tones tells the truth about it: green and red report what happened and
 *     "open" reports not settled yet. Mixed rows stay in the lists beside this
 *     rather than wearing a wrong colour here.
 *   · A learning with no linked bet has no score to move (`applyOutcome`
 *     rescores nothing when the bet is unlinked), so there is no before and
 *     after to set side by side. Drawing a flat line over an absent
 *     measurement would be invention.
 *
 * THREE EMPTY CASES, NOT ONE. Nothing settled at all and a failed read belong
 * to InsightCards' own states. Outcomes on the record with NONE of them
 * chartable is the case the pair cannot see: passing it an empty list would
 * print "No outcome has been settled yet" over a nonzero count, so it gets its
 * own sentence naming what a card needed.
 */

/** The fields of a `listLearnings` row these cards read. ICE arrives widened
 *  over PostgREST, exactly as `LearningRow` documents. */
type SettledLearning = {
  id: string;
  verdict: Verdict;
  summary: string;
  opportunity_title: string | null;
  metric_label: string | null;
  metric_value: string | null;
  prior_ice: number | string | null;
  new_ice: number | string | null;
};

function score(value: number | string | null): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function insightsFrom(learnings: SettledLearning[]): Insight[] {
  const out: Insight[] = [];
  for (const l of learnings) {
    if (l.verdict === "mixed") continue;
    const prior = score(l.prior_ice);
    const next = score(l.new_ice);
    if (prior === null || next === null) continue;
    // Same three words the rest of the station speaks, capitalised to stand as
    // a sentence when the settler wrote no summary of their own.
    const said = VERDICT_SAYS[l.verdict];
    out.push({
      kind: "trend",
      key: l.id,
      lead: l.summary.trim() || `${said.charAt(0).toUpperCase()}${said.slice(1)}.`,
      title: l.opportunity_title?.trim() || "This bet",
      series: [{ id: "priority", label: "Bet priority", values: [prior, next], role: "actual" }],
      verdict: l.verdict === "validated" ? "pass" : "fail",
      format: (value) => value.toFixed(1),
      figures:
        l.metric_label && l.metric_value
          ? [{ label: l.metric_label, value: l.metric_value }]
          : undefined,
    });
  }
  return out;
}

export function LearnedCards({
  learnings,
  settledOnRecord,
  awaitingVerdict,
  loading = false,
  loadError = null,
  onRetry,
}: {
  learnings: SettledLearning[];
  /** How many outcomes the ledger holds, or null when that read has not
   *  answered. Null never prints as zero. */
  settledOnRecord: number | null;
  awaitingVerdict?: number;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <Reading>Reading what the outcomes taught.</Reading>;

  const cards = insightsFrom(learnings);

  if (loadError) {
    return <InsightCards insights={cards} loadError={loadError} onRetry={onRetry} />;
  }

  if (cards.length > 0) {
    return (
      <InsightCards
        insights={cards}
        settledOutcomes={settledOnRecord ?? cards.length}
        awaitingVerdict={awaitingVerdict}
      />
    );
  }

  if (settledOnRecord === 0) {
    return <InsightCards insights={[]} settledOutcomes={0} awaitingVerdict={awaitingVerdict} />;
  }

  // Records exist and none of them is chartable. Headed to match the reader
  // above it, so the page carries one shape and not two.
  return (
    <section data-mrd="" aria-label="Insights" className="w-full max-w-86">
      <span className="text-mrd-base font-semibold text-mrd-ink">Insights</span>
      <div className="mt-[var(--mrd-s4)]">
        <NothingYet>
          {settledOnRecord !== null ? (
            <>
              <Num>{settledOnRecord}</Num> outcomes are on the record.{" "}
            </>
          ) : null}
          A card sets a clean verdict beside the move it made on a bet&apos;s priority, and none of
          these carries both yet, so there is nothing to page through.
        </NothingYet>
      </div>
    </section>
  );
}
