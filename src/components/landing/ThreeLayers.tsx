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
 * The grammar is lifted from the frozen brief's own three-claim slide
 * (public/brief.html, .claim / .cn / .ct / .cd), which also treats all three
 * identically: a quiet mono number, the layer name in Geist Pixel Square, the
 * plain sentence in Sans, and a hairline between. The only adaptation is the
 * axis, so the brief's per-row top border becomes a between-column rule.
 *
 * Motion: transform and opacity only, 280ms on the founder's ease-out curve,
 * 50ms apart. Nothing glows, so nothing has to fake a glow with a shadow.
 * Reduced motion paints all three finished, with no travel.
 */

type Layer = { n: string; name: string; line: string };

const LAYERS: Layer[] = [
  {
    n: "01",
    name: "the director",
    line: "It tells you what to build. Your product taste becomes a system.",
  },
  {
    n: "02",
    name: "the operating system",
    line: "It builds and ships it, behind your gate.",
  },
  {
    n: "03",
    name: "the company brain",
    line: "It remembers whether you were right, and guides the next call.",
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

/** The brief's .cn: the number, quiet, in the machine's own voice. */
const CN = "mb-2.5 block font-mono text-[10px] uppercase text-zinc-600";
const CN_STYLE = { letterSpacing: "0.24em", fontVariantNumeric: "tabular-nums" } as const;

/** The brief's .ct: the layer name, and the brightest object on the column. */
const CT = "mb-2 text-white";
const CT_STYLE = {
  fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
  fontWeight: 400,
  fontSize: "clamp(18px, 1.9vw, 24px)",
  lineHeight: 1.2,
  letterSpacing: "0",
} as const;

/** The brief's .cd: the plain sentence, in Sans. */
const CD = "text-[14px] text-zinc-400";
const CD_STYLE = { lineHeight: 1.6, maxWidth: "46ch" } as const;

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
              <span className={CN} style={CN_STYLE}>
                {l.n}
              </span>
              <h3 className={CT} style={CT_STYLE}>
                {l.name}
              </h3>
              <p className={CD} style={CD_STYLE}>
                {l.line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
