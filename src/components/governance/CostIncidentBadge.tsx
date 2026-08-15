/**
 * The cap a cost incident was raised against.
 *
 * PORTED 2026-07-29. It used to be a tinted pill with its own background,
 * border and radius, reading "Cost Alert ($10/day)". Two things were wrong with
 * that and only one of them was the styling:
 *
 *   1. It drew its own colour and its own container, so it was a fifth kind of
 *      chip on a surface that already had four.
 *   2. `amountUsd` is `usd_cap` (incidents.functions.ts, the budget-alert
 *      detector), which is the CEILING, not what was spent. "Cost Alert ($10)"
 *      beside a title that already says "80% of the $10.00 cap" is the same
 *      fact said twice, and the second telling was mislabelled.
 *
 * So it is one `Value` now, it says what the number IS, and the incident row
 * carries it as the trailing fact rather than as a badge inside the copy.
 */
import { Num, Value } from "@/components/meridian/surface-parts";
import { fmtUsd } from "@/components/product/format";

interface CostIncidentBadgeProps {
  /** The configured ceiling the spend was measured against, from `usd_cap`. */
  amountUsd?: number;
  windowKind?: "day" | "month";
}

const WINDOW_WORD: Record<"day" | "month", string> = {
  day: "daily cap",
  month: "monthly cap",
};

export function CostIncidentBadge({ amountUsd, windowKind }: CostIncidentBadgeProps) {
  // No cap on the row means the alert carried none. Saying "$0" there would be
  // a number nobody set.
  if (amountUsd == null) return <Value tone="hold">Spend</Value>;
  return (
    <Value tone="hold">
      <Num>{fmtUsd(amountUsd)}</Num> {windowKind ? WINDOW_WORD[windowKind] : "cap"}
    </Value>
  );
}
