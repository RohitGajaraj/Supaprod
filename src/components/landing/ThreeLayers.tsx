import { useEffect, useRef, useState } from "react";

/**
 * Beat 2b - the three layers (founder ruling 2026-07-25, the correction).
 *
 * Placed HERE on purpose: The Gap ends on "Decisions / no home", this answers
 * it, and the loop walkthrough that follows is the proof of layer 02 in
 * motion. Absence, then the answer, then the receipt.
 *
 * HORIZONTAL AND EQUAL. Two things were wrong in the first pass and the
 * founder called both:
 *
 * 1. The layers were stacked, which cost the page roughly 600px of scroll for
 *    three sentences. They are three columns now, side by side, separated by
 *    vertical hairlines instead of horizontal ones. The whole section is one
 *    screen band.
 * 2. The third layer carried a gold backlight, a gold hairline and an extra
 *    mono line the other two did not have. That weighting is gone. The story
 *    is ONE SYSTEM, three layers; making one of them louder argues against
 *    the sentence above it. Every column is now painted from a single shared
 *    class string (BEAT below) plus three shared type constants, so there is
 *    no place left for a per-layer exception to hide.
 *
 * THE FULL ANATOMY, RESTORED (founder ruling 2026-07-25, second correction).
 * The grammar is lifted from the frozen brief's own three-claim slide
 * (public/brief.html, .claim / .cn / .ct / .cd). The first pass here kept only
 * a crisp portion of it: number, name, and one merged sentence. The brief runs
 * THREE tiers per layer and the missing one was carrying the weight:
 *
 *   .cn  the numbered name        "01 - The director"
 *   .ct  the claim, one line      "It tells you what to build."
 *   .cd  the context, what it IS  "Reads your feedback, your data, ..."
 *
 * Without .cd a reader gets a slogan and no picture, and this band is the moat:
 * it is the thing an investor or a power user is here to understand. All three
 * tiers are back, in the landing's type system rather than the brief's.
 *
 * SPOTLIGHT, BUT SHARED. The section now sits in its own pool of warm light.
 * That light belongs to the SECTION, never to a column: the previous pass gave
 * layer 03 a private gold backlight and the founder rightly killed it, because
 * lighting one layer argues against the sentence above it. One glow, centred,
 * all three inside it.
 *
 * Motion: transform and opacity only, 280ms on the founder's ease-out curve,
 * 50ms apart. Reduced motion paints all three finished, with no travel.
 */

type Layer = { n: string; name: string; claim: string; context: string };

/**
 * Wording tracks the investor canon and the brief verbatim where it matters.
 * Layer 03's "It compounds" beat is canon-mandated and non-negotiable: the
 * brain is never storage, so the sentence has to say what it DOES next time,
 * not where the record lives.
 */
const LAYERS: Layer[] = [
  {
    n: "01",
    name: "the director",
    claim: "It tells you what to build.",
    context:
      "Reads your feedback, your data, your competitors, the market. Names what is worth building next, evidence attached. Your product taste becomes a system.",
  },
  {
    n: "02",
    name: "the operating system",
    claim: "It runs the whole lifecycle.",
    context:
      "Discover to ship to learn, one governed loop. Agents do the work in your own stack. You make every call that matters.",
  },
  {
    n: "03",
    name: "the company brain",
    claim: "It remembers, and it guides.",
    context:
      "Every decision is recorded with its evidence, then graded against what actually happened. It compounds. Next time it tells you what is right, and warns you before you repeat what was wrong.",
  },
];

/**
 * One column, one class string, used verbatim for all three. Everything that
 * could carry emphasis lives here: the hairlines, the padding, the entrance.
 * The only position-dependent bits are the two edge resets (first:border-l-0,
 * first:pl-0 / last:pr-0), which exist so the outer columns sit flush with the
 * container rather than floating inside a frame. That is alignment, not
 * emphasis, and it is written once for all three.
 */
const BEAT =
  "layer-beat border-t border-white/[0.07] pt-7 pb-9 last:pb-0 " +
  "md:pb-0 md:pt-8 md:pl-8 md:pr-8 md:border-l md:first:border-l-0 md:first:pl-0 md:last:pr-0";

/** The brief's .cn, first half: the number, quiet, in the machine's own voice. */
const CN = "font-mono text-[10px] uppercase text-zinc-600";
const CN_STYLE = { letterSpacing: "0.24em", fontVariantNumeric: "tabular-nums" } as const;

/** The brief's .cn, second half: the layer name, the brightest object here. */
const CT = "text-white";
const CT_STYLE = {
  fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
  fontWeight: 400,
  fontSize: "clamp(17px, 1.8vw, 22px)",
  lineHeight: 1.2,
  letterSpacing: "0",
} as const;

/**
 * The brief's .ct: the claim. One line, said flat, no hedge. This is the tier
 * a skimmer reads, so it sits a full step above the context under it.
 */
const CC = "mb-2.5 text-[15px] text-zinc-200";
const CC_STYLE = { lineHeight: 1.45, maxWidth: "30ch" } as const;

/**
 * The brief's .cd: what the layer actually IS. The tier the first pass dropped,
 * and the only one that turns a slogan into something a reader can picture.
 */
const CD = "text-[13px] text-zinc-500";
const CD_STYLE = { lineHeight: 1.65, maxWidth: "40ch" } as const;

export function ThreeLayers() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Resolved once, then handed to all three columns unchanged. If one column
  // ever needs a different look, it has to be argued for here, in the open.
  const beat = `${BEAT} ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`;

  return (
    <section id="layers" ref={sectionRef} className="relative px-4 py-32 scroll-mt-16">
      {/* The spotlight. One pool of warm light, centred on the band, wide and
          weak enough (5%) that it lifts all three columns off the ink without
          ever reading as a highlight on any one of them. This is the section's
          light, not a layer's: see the header note. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 52% at 50% 46%, rgba(255,107,44,0.05), transparent 72%)",
        }}
      />
      <style>{`
        .layer-beat {
          transition:
            opacity 280ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 280ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .layer-beat {
            transition: none;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="relative mx-auto max-w-5xl">
        <p
          className="mb-10 font-mono text-[11px] uppercase text-zinc-600 md:text-[12px]"
          style={{ letterSpacing: "0.14em" }}
        >
          One system, three layers
        </p>

        {/* Three across from md up. Below that the columns cannot breathe, so
            they stack and the vertical rules become horizontal ones. */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {LAYERS.map((l, i) => (
            <div
              key={l.n}
              className={beat}
              style={{ transitionDelay: inView ? `${i * 50}ms` : "0ms" }}
            >
              <h3 className="mb-3.5 flex items-baseline gap-2.5">
                <span className={CN} style={CN_STYLE}>
                  {l.n}
                </span>
                <span className={CT} style={CT_STYLE}>
                  {l.name}
                </span>
              </h3>
              <p className={CC} style={CC_STYLE}>
                {l.claim}
              </p>
              <p className={CD} style={CD_STYLE}>
                {l.context}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
