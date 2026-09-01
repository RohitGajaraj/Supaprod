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
    <p data-mrd="" className="text-mrd-label leading-mrd-prose text-mrd-mute">
      On the free plan this record fades after <Figure>{FREE_MEMORY_RETENTION_DAYS}</Figure> days.{" "}
      {/* A real anchor, not a Door: /pricing is a page with an address, and the
          Door primitive next door is a <button> for something this surface does
          to itself. The two look identical on purpose. */}
      <a
        href="/pricing"
        /*
         * ── A LINK THAT WAS BIGGER THAN ITS OWN SENTENCE (2026-09-01) ──────
         *
         * The paragraph is `text-mrd-label` (12.5px) and this anchor carried
         * `text-mrd-prose` (14px), so the two words in the middle of the
         * sentence rendered 1.5px taller than the words either side of them.
         * Inline type that changes size mid-sentence reads as a rendering fault,
         * and it shifts the baseline of the line it sits in.
         *
         * SAME ROOT CAUSE AS THE SEVEN SAME-ELEMENT COLLISIONS, and the
         * OPPOSITE remedy, which is the point worth recording.
         * `--mrd-t-body` was renamed to `--mrd-t-prose` on 2026-08-21 because
         * `text-mrd-body` used to compile to a size AND a colour; authors kept
         * writing the pair as though `prose` were part of the colour. There,
         * the 14px was the verified intended paint and the LOSING size class
         * was deleted. Here the intended size is the PARAGRAPH's -- an inline
         * link has no size of its own, it belongs to the sentence -- so the
         * size class goes and `text-mrd-body` stays for colour.
         *
         * `one-element-one-type-size.test.ts` cannot catch this one: both
         * declarations are correct in isolation and the conflict only exists
         * between a parent and its child, which a class-string scan cannot see.
         */
        className="rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        Keep it
      </a>
    </p>
  );
}
