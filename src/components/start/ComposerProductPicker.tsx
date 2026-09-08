/**
 * THE PRODUCT THIS RUN WILL USE, BESIDE THE FIELD (P-16b, A-QUEUE.md, from
 * R-36 and the honest run). The founder pressed Start with the switcher on
 * Prism and a sentence about "the homeowner app", which is Relay -- the
 * switcher's own selection and the sentence's own subject had quietly
 * disagreed, and nothing on the composer said so before the press.
 *
 * A NATIVE `<select>`, DELIBERATELY, not a new Meridian menu primitive: it
 * is a real product picker (one option per real product, one keystroke or
 * click to open, one more to choose), it needs no new component, and it
 * IS the "beside the field, one press to change it" the packet asks for.
 * Composed from Meridian's own field tokens (`rounded-mrd-ctl`,
 * `border-mrd-field`, `bg-mrd-sink`) rather than the full `Field`/`Input`
 * pair, which stacks a label above a full-width control -- too heavy for a
 * one-line affordance sitting beside a composer that is the page's own
 * primary field.
 *
 * THE OFFER IS NEVER APPLIED FOR THE PERSON. `matchProductFromSentence` is
 * conservative on purpose (see its own header): when it names a product,
 * this shows a press, never a silent swap -- an autocorrected product would
 * be the same invisible-mismatch defect this packet exists to close, just
 * moved one step earlier.
 */
import type { Product } from "@/hooks/use-workspace";
import type { ProductCandidate } from "@/lib/spine/product-match";
import { Door, Picker } from "@/components/meridian/surface-parts";

export function ComposerProductPicker({
  products,
  activeProductId,
  suggested,
  onSelect,
}: {
  products: Product[];
  activeProductId: string | null;
  /** The product `matchProductFromSentence` named, or null when the
   *  sentence cannot be told to mean any one of them. */
  suggested: ProductCandidate | null;
  onSelect: (id: string) => void;
}) {
  const offerSuggestion = suggested !== null && suggested.id !== activeProductId;

  return (
    <div className="flex flex-wrap items-center gap-mrd-2 text-mrd-small text-mrd-mute">
      <label htmlFor="composer-product" className="flex items-center gap-mrd-2">
        <span>This run is for</span>
        {/* Meridian's own picker and door, not a hand-rolled select and a
            link (entry review, 2026-09-08): one keystroke to open, one to
            choose, and the offer reads as a door because it is one. */}
        <Picker
          id="composer-product"
          value={activeProductId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Picker>
      </label>
      {offerSuggestion ? (
        <Door onClick={() => onSelect(suggested.id)}>
          The sentence sounds like {suggested.name}. Use it?
        </Door>
      ) : null}
    </div>
  );
}
