/**
 * Disclosed confidence, always visible, on every Critic verdict.
 *
 * Distinct from `ConfidenceChip` (src/components/supaprod), which deliberately
 * renders NOTHING above "low": that one is a gate, this one is a disclosure. A
 * flat "Ship" with no confidence beside it reads as uniform certainty, and
 * disclosed confidence, even when it is high, is the honest posture the receipts
 * thesis requires. No new scoring model: it renders the Critic's own
 * already-computed `confidence` (0 to 1), tiered via the shared vocabulary.
 *
 * PORTED 2026-07-29. It used to draw its own bordered capsule in mono, tinted
 * `--emerald`, `--text-muted` or `--ember` from a local map. Three problems, and
 * all three are rules: mono is for data and never for a label; ember marks the
 * human and nothing else, so an unsure verdict may not wear it; and a pill with
 * a hue-mixed border beside another pill is two capsules saying one thing.
 * It is a `Value` now, so the stylesheet owns the mix and the number sits in
 * `Num` where every number in the system sits.
 */

import { Num, Value } from "@/components/meridian/surface-parts";
import type { ConfidenceTier } from "@/lib/confidence";

/** Confidence is an outcome, so it takes a tone. Low confidence is a CONDITION
 *  rather than a decision -- more evidence would change it and nothing is
 *  waiting on a person -- so it takes Meridian's amber `hold` and never the
 *  accent. The accent means A PERSON IS REQUIRED, and this is the machine
 *  reporting on itself. `warn` was the retired layer's word for the same
 *  meaning; Meridian has five status words and `hold` is the one. */
const TIER_TONE: Record<ConfidenceTier, "quiet" | "pass" | "hold"> = {
  high: "pass",
  medium: "quiet",
  low: "hold",
};

const TIER_LABEL: Record<ConfidenceTier, string> = {
  high: "confident",
  medium: "moderate",
  low: "unsure",
};

export function ConfidenceDisclosureChip({
  confidence,
  tier,
}: {
  /** The raw 0 to 1 probability, shown as a rounded percent. */
  confidence: number;
  tier: ConfidenceTier;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, confidence)) * 100);
  return (
    <Value tone={TIER_TONE[tier]}>
      <span title={`Supaprod discloses its own confidence in this verdict: ${pct}%`}>
        <Num>{pct}%</Num> {TIER_LABEL[tier]}
      </span>
    </Value>
  );
}
