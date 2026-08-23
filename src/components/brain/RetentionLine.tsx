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
 *
 * PORTED TO MERIDIAN, 2026-08-15. The line was three raw `--sp-*` custom
 * properties in an inline style plus `.sp-block-more` on the link, which is the
 * layer meridian.css calls life support: "no new surface may use it, every
 * migrated surface drops it." Colour, size and rhythm now come from `--mrd-*`
 * through utilities, so this line re-resolves on the paper ground with the rest
 * of the surface instead of holding one foot in the old system.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getBillingState } from "@/lib/billing.functions";
import { FREE_MEMORY_RETENTION_DAYS } from "@/lib/entitlements";
import { Figure } from "@/components/meridian/surface-parts";

export function RetentionLine() {
  const f = useServerFn(getBillingState);
  const billing = useQuery({
    queryKey: ["billing-state"],
    queryFn: () => f(),
    staleTime: 5 * 60 * 1000,
  });

  if ((billing.data?.planTier ?? null) !== "free") return null;

  return (
    /* `data-mrd` is what gives the link below the system's neutral focus ring
       without this file naming a colour. See the note at the top of
       record-parts.tsx: the attribute outranks the unlayered legacy
       `:focus-visible` rule that would otherwise paint an accent here. */
    <p data-mrd="" className="text-[12.5px] leading-mrd-prose text-mrd-mute">
      On the free plan this record fades after <Figure>{FREE_MEMORY_RETENTION_DAYS}</Figure> days.{" "}
      {/* A real anchor, not a Door: /pricing is a page with an address, and the
          Door primitive next door is a <button> for something this surface does
          to itself. The two look identical on purpose. */}
      <a
        href="/pricing"
        className="rounded-mrd-xs text-mrd-prose text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        Keep it
      </a>
    </p>
  );
}
