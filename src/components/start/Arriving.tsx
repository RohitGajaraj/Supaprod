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
 * ── WHAT THIS COSTS, SAID PLAINLY ────────────────────────────────────────
 * `qualifies()` runs on the client over `listThemes`, which is capped at 300
 * rows. That is O(themes) in the browser and it is fine at today's shape (181
 * themes across the whole database), and it is the wrong place for it if a
 * workspace ever carries thousands. P-18 folds the Start rows and the shell's
 * top bar into one read model; that is where this moves server-side.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Door } from "@/components/meridian/surface-parts";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { getSenseCoverage, listThemes } from "@/lib/discovery.functions";
import { qualifies, type ThemeLike } from "@/lib/spine/promote";
import {
  promotionBarFor,
  resolveAutonomyPolicy,
  type AutonomyPolicyRow,
} from "@/lib/autonomy-policy";

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

  const fThemes = useServerFn(listThemes);
  const themes = useQuery({
    queryKey: ["arriving-themes", activeProductId ?? null],
    queryFn: () => fThemes({ data: { productId: activeProductId ?? null } }),
    staleTime: 5 * 60_000,
  });

  /* The workspace's own bar, cached hard: it is a setting rather than a fact
     about this week, so re-reading it on a list's beat spends a request on a
     value that cannot change while somebody is looking. */
  const bar = useQuery({
    queryKey: ["promotion-bar", activeWorkspaceId ?? null],
    enabled: Boolean(activeWorkspaceId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("promotion_min_frequency,promotion_min_severity,promotion_min_confidence")
        .eq("id", activeWorkspaceId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return promotionBarFor(resolveAutonomyPolicy(data as AutonomyPolicyRow | null));
    },
  });

  const rows = (themes.data?.themes ?? []) as unknown as ThemeLike[];
  const verdicts = bar.data ? rows.map((t) => qualifies(t, bar.data)) : null;

  const line = arrivingLine({
    signals7d: coverage.data ? coverage.data.total7d : null,
    sources: coverage.data ? coverage.data.sources.filter((s) => s.recent > 0).length : null,
    /* Forming: eligible and not yet over the bar. A theme somebody already
       settled is not forming, and `qualifies` says so in its first branch. */
    forming: verdicts ? verdicts.filter((v) => !v.ok).length : null,
    crossed: verdicts ? verdicts.filter((v) => v.ok).length : null,
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
      <Door onClick={() => void navigate({ to: "/discover", search: {} })}>See what came in</Door>
    </section>
  );
}

export default Arriving;
