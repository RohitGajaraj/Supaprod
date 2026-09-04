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
 *
 * THE SENTENCE IS NOW A FACT ABOUT THE NUMBER BESIDE IT (P-94, A-QUEUE.md).
 * Checked live 2026-09-04: `memory_expiry_enabled()` reads false, and no read
 * anywhere consulted `FREE_MEMORY_RETENTION_DAYS` on its own -- nothing faded
 * for anyone, on any plan, and this line was marketing a mechanism that did
 * not run. `getStandingRecord` (brain-standing.functions.ts) now excludes
 * `agent_memory` rows older than the window from `memoriesTotal`/
 * `memoriesReached` for a free-tier workspace -- a read-side hide, never a
 * delete, so an upgrade still recovers every row. Left open, and named as
 * such in that file's own comment: whether the LOOP itself (`recallMemoryRefs`,
 * `ai/memory.server.ts`) still draws on a free workspace's memory past the
 * window. That is a separate, larger change and was not bundled here.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getBillingState } from "@/lib/billing.functions";
import { FREE_MEMORY_RETENTION_DAYS } from "@/lib/entitlements";
import { Figure } from "@/components/meridian/surface-parts";

export function RetentionLine({
  /**
   * Nothing is on this workspace's record. Handed in rather than read here,
   * because Outcomes has already computed exactly this to decide its own zero
   * state and two answers to one question is how two regions come to disagree.
   */
  recordIsEmpty = false,
}: {
  recordIsEmpty?: boolean;
} = {}) {
  const f = useServerFn(getBillingState);
  const billing = useQuery({
    queryKey: ["billing-state"],
    queryFn: () => f(),
    staleTime: 5 * 60 * 1000,
  });

  if ((billing.data?.planTier ?? null) !== "free") return null;

  /*
   * ── A RECORD THAT DOES NOT EXIST CANNOT EXPIRE (P-33, 2026-09-03) ───────
   *
   * This line is mounted unconditionally on Outcomes, and it was the one region
   * the page's zero-state collapse did not stand down. So on a workspace with
   * nothing on the record it sat directly under "Nothing is on the record yet."
   * and warned the reader that the record they do not have fades in thirty
   * days. Two sentences, one screen, and together they are nonsense.
   *
   * Retention is a real fact and worth saying the moment there is something to
   * lose. Said over nothing, it is a threat about an empty box.
   */
  if (recordIsEmpty) return null;

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
