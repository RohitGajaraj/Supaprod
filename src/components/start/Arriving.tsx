/**
 * ── WHAT IS ARRIVING, AND WHETHER ANY OF IT IS ABOUT TO BECOME WORK ───────
 *
 * Founder, 2026-09-02 19:12: *"14 signals this week from 3 sources · 2 themes
 * forming · none opened a run."* Three numbers under the run list.
 *
 * ── WHY IT BELONGS ON THE FRONT DOOR AND NOT ON A STATION PAGE ────────────
 * The product's claim is that evidence becomes work on its own. Everything that
 * proves it lives one route away, on a station page most people never open, and
 * the page a person actually lands on says nothing about it at all. Three
 * numbers is the smallest honest version: how much came in, from how many
 * places, and whether any of it has crossed the line where the loop starts a run
 * without being asked.
 *
 * ── THE THIRD NUMBER IS THE ONE THAT MATTERS, AND IT IS COMPUTED, NOT COUNTED
 * "Clusters forming" is not a column. A theme is forming when it is eligible and
 * has NOT cleared the promotion bar; it has crossed when `qualifies()` says so.
 * That is the same predicate `promoteClustersOnce` runs, against the same bar,
 * which is what stops this line drifting from the behaviour it describes: if the
 * loop would start a run, this says so, because it asks the loop's own question.
 *
 * ── AND THE BAR IS READ, NEVER ASSUMED ───────────────────────────────────
 * `DEFAULT_PROMOTION_BAR` is 8 / 4 / 0.75 and a workspace can override all
 * three. Printing a count computed against the shipped default for a workspace
 * that set its own would be a number that looks measured and is not, which is
 * the same refusal `Lineage` makes on the run screen. No workspace read, no
 * third number.
 *
 * ── WHAT THIS USED TO COST, AND WHERE IT MOVED (P-32, A-QUEUE.md) ─────────
 * `qualifies()` used to run on the client over `listThemes`'s full 300-row
 * page -- O(themes) in the browser, and every row's full content (including,
 * until this packet, a raw `embedding` vector) shipped to the front door to
 * be reduced to two integers. A1's live measurement made the cost concrete:
 * 2.6 MB of embedding data alone on Helio Labs. `getThemePromotionCounts`
 * (discovery.functions.ts) now runs the SAME predicate against the SAME bar
 * server-side and returns only `{forming, crossed}` -- nothing this page
 * renders ever needed a single theme's title, summary or score in the
 * browser at all.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Door } from "@/components/meridian/surface-parts";
import { useWorkspace } from "@/hooks/use-workspace";
import { getSenseCoverage, getThemePromotionCounts } from "@/lib/discovery.functions";

/**
 * The sentence, built only from clauses that have a row behind them.
 *
 * Exported for its test, and pure, so the rule can be driven without standing up
 * three queries. A clause with nothing behind it is ABSENT rather than zero: "0
 * signals this week" and "we have not read your signals" are different facts and
 * a strip that prints the first for the second is the substitution this repo
 * keeps paying for.
 */
export function arrivingLine(input: {
  signals7d: number | null;
  sources: number | null;
  forming: number | null;
  crossed: number | null;
}): string | null {
  /*
   * -- NOTHING CONNECTED HAS NOTHING TO SAY (P-33, walked 2026-09-03) -------
   *
   * This file's own header states the rule: "a strip reading '0 findings this
   * week' over a product that has never been given anything to read is a
   * reproach rather than a fact." The guard written for it -- `if (!line)
   * return null` at the call site -- could never fire, because every clause
   * below is built whenever its value is NON-NULL, and 0 is not null.
   * `getSenseCoverage` answers an empty workspace with `total7d: 0` and
   * `sources: []` rather than null, so a brand-new workspace read:
   *
   *   "0 findings this week from 0 sources - 0 clusters forming -
   *    none has crossed the bar yet"
   *
   * Four assertions over a product nobody has been asked about, including a
   * verdict against a promotion bar the person has never seen or set. The rule
   * was right and the code could not keep it.
   *
   * NO SOURCES IS THE CASE, NOT NO SIGNALS. A workspace with three connected
   * sources and no findings this week is a real fact worth saying -- that is a
   * quiet week, and the strip is exactly where it belongs. What is not a fact is
   * a count over a product that has never been given anything to read, and with
   * no sources there can be no signals and therefore no clusters either, so the
   * whole strip goes rather than one clause of it.
   */
  if (input.sources === 0 && (input.signals7d ?? 0) === 0) return null;

  const parts: string[] = [];
  if (input.signals7d != null) {
    const from =
      input.sources != null
        ? ` from ${input.sources} ${input.sources === 1 ? "source" : "sources"}`
        : "";
    parts.push(
      `${input.signals7d} ${input.signals7d === 1 ? "finding" : "findings"} this week${from}`,
    );
  }
  if (input.forming != null) {
    parts.push(`${input.forming} ${input.forming === 1 ? "cluster" : "clusters"} forming`);
  }
  /*
   * THE THIRD CLAUSE IS THE CLAIM, so it is only made when the bar was read.
   * "none has crossed the bar" is a statement about a threshold, and a threshold
   * nobody looked up is not one.
   */
  if (input.crossed != null) {
    parts.push(
      input.crossed === 0
        ? "none has crossed the bar yet"
        : `${input.crossed} ${input.crossed === 1 ? "has" : "have"} crossed the bar`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function Arriving() {
  const navigate = useNavigate();
  const { activeWorkspaceId, activeProductId } = useWorkspace();

  const fCoverage = useServerFn(getSenseCoverage);
  const coverage = useQuery({
    queryKey: ["arriving-coverage", activeProductId ?? null],
    queryFn: () => fCoverage({ data: { productId: activeProductId ?? null } }),
    staleTime: 5 * 60_000,
  });

  /*
   * THE TWO COUNTS, COMPUTED SERVER-SIDE (P-32, A-QUEUE.md). One reader,
   * keyed on both the product (which themes) and the workspace (whose bar),
   * cached the same 5 minutes the bar itself used to be cached at -- a
   * setting rather than a fact about this week.
   */
  const fPromotionCounts = useServerFn(getThemePromotionCounts);
  const counts = useQuery({
    queryKey: ["arriving-promotion-counts", activeWorkspaceId ?? null, activeProductId ?? null],
    enabled: Boolean(activeWorkspaceId),
    staleTime: 5 * 60_000,
    queryFn: () =>
      fPromotionCounts({
        data: { workspaceId: activeWorkspaceId ?? null, productId: activeProductId ?? null },
      }),
  });

  const line = arrivingLine({
    signals7d: coverage.data ? coverage.data.total7d : null,
    sources: coverage.data ? coverage.data.sources.filter((s) => s.recent > 0).length : null,
    /* Forming: eligible and not yet over the bar. A theme somebody already
       settled is not forming, and `qualifies` says so in its first branch. */
    forming: counts.data ? counts.data.forming : null,
    crossed: counts.data ? counts.data.crossed : null,
  });

  /*
   * NOTHING TO SAY IS NOT AN EMPTY REGION. A workspace with no connected source
   * has no arriving evidence, and a strip reading "0 findings this week" over a
   * product that has never been given anything to read is a reproach rather than
   * a fact. The connectors surface is where that conversation belongs.
   */
  if (!line) return null;

  return (
    <section
      data-mrd=""
      className="flex flex-wrap items-baseline gap-mrd-3 font-mrd"
      aria-label="Arriving"
    >
      <span className="mrd-eyebrow">Arriving</span>
      <span className="text-mrd-base text-mrd-mute">{line}</span>
      {/* "/discover" -> "/arriving" (P-14a, 2026-09-02). */}
      <Door onClick={() => void navigate({ to: "/arriving", search: {} })}>See what came in</Door>
    </section>
  );
}

export default Arriving;
