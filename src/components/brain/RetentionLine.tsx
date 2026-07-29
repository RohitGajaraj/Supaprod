/**
 * How long the record you are reading is kept.
 *
 * This replaces MemoryUpgradeNudge on Brain, which was an ember-tinted banner
 * built on the retired Tempo tokens (--ember, --canvas, --ink). None of those
 * three resolve against the current shell, so its hardcoded fallbacks painted a
 * cream box on a pure-dark surface. It also spent ember, which marks the human
 * and nothing else, on a billing upsell.
 *
 * The fact itself survives, because it is true and it is about the record on
 * this page: on the free plan the memory fades. Governance canon, verbatim: "a
 * default the user never set is our choice, not their policy, so it must be
 * visible and changeable." So it is stated in plain words, once, with the door
 * to change it, and it is not dismissible. Nothing renders for a paid plan or
 * while the plan is unknown.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getBillingState } from "@/lib/billing.functions";
import { FREE_MEMORY_RETENTION_DAYS } from "@/lib/entitlements";
import { Num } from "@/components/shell/primitives";

export function RetentionLine() {
  const f = useServerFn(getBillingState);
  const billing = useQuery({
    queryKey: ["billing-state"],
    queryFn: () => f(),
    staleTime: 5 * 60 * 1000,
  });

  if ((billing.data?.planTier ?? null) !== "free") return null;

  return (
    <p
      style={{
        fontSize: "var(--sp-text-meta)",
        color: "var(--sp-mute)",
        marginTop: "var(--sp-space-3)",
      }}
    >
      On the free plan this record fades after <Num>{FREE_MEMORY_RETENTION_DAYS}</Num> days.{" "}
      <a href="/pricing" className="sp-block-more" style={{ display: "inline" }}>
        Keep it
      </a>
    </p>
  );
}
