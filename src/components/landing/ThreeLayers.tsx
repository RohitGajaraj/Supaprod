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

type Layer = { n: string; name: string; claim: string; context: string; hue: string };

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
    hue: "#FF6B2C",
  },
  {
    n: "02",
    // STILL "the loop", and that is not an oversight. The hero no longer says
    // "operating system" at all: it was retired as a self-description on
    // 2026-08-11 for sounding like a vague platform word, and the eyebrow one
    // screen above now reads "For product managers who ship with agents".
    //
    // LAYER 02 KEEPS THE NAME ANYWAY, which is the distinction a sweep would
    // have destroyed. "The operating system" is retired as what we CALL
    // OURSELVES and kept as what this LAYER is, because the three-layer model
    // is canon and the middle layer is the thing that runs the lifecycle. The
    // two rulings are about different jobs and both hold.
    //
    // The hero's job is the CATEGORY: a first-time visitor has to be able to
    // file what this is, and README opens with that exact sentence, so the site
    // now uses its own words instead of avoiding them.
    //
    // This label's job is a LAYER INSIDE that category, under a headline that
    // already reads "One system, three layers". Calling it the operating system
    // here would make it the system inside the system, which is the tautology
    // the original ruling caught. Naming it once, at the top, is what makes it
    // land; naming it twice is what made it vague. The original reasoning,
    // unchanged:
    //
    // "the operating system" on the SITE only (founder ruling 2026-07-25).
    // The investor canon and the brief keep that name and are untouched; the
    // landing's own banned-words list rejects it as a vague category word, and
    // it was tautological here besides, since the headline directly above says
    // "One system, three layers" and this was the system inside the system.
    // "The loop" is this page's existing word for exactly this thing (the
    // walkthrough below, the "full loop" tab, the governed loop in the line
    // under this one), it is a shape the page already draws, and it hands
    // straight off to the section that proves it.
    name: "the loop",
    /*
     * THIS READ "It runs the whole lifecycle." UNTIL 2026-08-27, AND THAT
     * EXACT STRING IS BANNED IN OUTWARD COPY by canon 5N, ruled 2026-08-26.
     * CLAUDE.md states it in one line: never write "runs the lifecycle"
     * outward, because it invites the comparison we refuse. It was still live
     * on supaprod.ai when I checked the running site.
     *
     * WHY THE PHRASE IS THE PROBLEM AND NOT THE LAYER. Saying we run the whole
     * lifecycle invites "so you are Lovable, plus advice", and 5N refused that
     * on three grounds: the code-generation market is finished and priced at
     * over 48B, the pain moved to REVIEW rather than generation (review time
     * +441.5% against 33.7% more throughput), and neutrality is the asset.
     * Every builder is a substitutable supplier to this layer, so their
     * commoditisation is our tailwind. Generating code turns all of them into
     * competitors who will not integrate.
     *
     * THE REPLACEMENT IS THE CANON'S OWN, not a rewording of mine. 5N gives it
     * as a table row: "Decides what is worth building, hands it to whatever
     * builds for you, and checks what actually happened." The claim carries
     * the two halves that separate this layer from 01, which already says "It
     * tells you what to build"; the context below carries the sentence whole.
     *
     * "YOURS OR OURS" IS LOAD BEARING AND MUST NOT BE DROPPED. 5N says so in
     * those words, because the hybrid amendment the same day ruled we DO build
     * in two scoped places, and that phrase is what makes us the only surface
     * here that does not care which builder a customer already uses.
     *
     * The layer NAME is untouched. The long note above about keeping "the
     * loop" rather than "the operating system" is a different ruling about a
     * different job and it still holds. Do not read this change as licence to
     * revisit it, and do not restore the old claim from that note's phrasing.
     */
    claim: "It hands the work out, and checks what came back.",
    /* A CYCLE WITH TWO WAYS IN, NOT A LINE THAT STARTS AT DISCOVER.
     * Founder-approved 2026-08-10. Copy only — the stations and the engine are
     * unchanged, and the default entry point for a new run has not moved.
     *
     * This read "Discover to ship to learn, one governed pass", which draws a
     * line with a beginning. Two things are wrong with that.
     *
     * FIRST, THE LINE IS NOT HOW THE PRODUCT IS ENTERED. This paragraph used
     * to prove that with a number: "36 real edges against 9 from
     * opportunities", said to be measured on production lineage with demo
     * workspaces excluded.
     *
     * THAT NUMBER WAS SEED DATA AND THE ARGUMENT SURVIVES WITHOUT IT.
     * Established 2026-08-11: every `learning -> decision` edge in the database
     * is seeded, zero were written by the product, and the exclusion that was
     * supposed to strip demo workspaces matched on the SHAPE of a workspace id
     * while the seeder assigns ordinary random ones. So the filter excluded
     * nothing and the ratio described the fixture.
     *
     * The claim it was supporting is a claim about DESIGN rather than usage:
     * a reader who arrives with a hypothesis they want to test cheaply should
     * not be told the product wants them to go and do discovery first. That is
     * true whether or not anyone has walked the loop yet, and it is the honest
     * version, because with 120 product-written lineage rows in existence there
     * is no usage pattern to appeal to. The number is gone rather than
     * refreshed: see docs/pitch/verified-numbers.md, which exists because this
     * exact mistake was made three times in one day.
     *
     * SECOND, A HEAVILY-STAGED LIFECYCLE DIAGRAM IS THE VISUAL SIGNATURE OF
     * SAFe, and this exact buyer is in the middle of tearing that out. We were
     * paying that association for a picture the data does not support.
     *
     * The operator framing that produced this, and the reason the two doors are
     * peers rather than a main path and an exception: planning did not
     * disappear, it moved downstream of the evidence instead of upstream of it.
     * Build then Learn is not a shortcut. It is what you do when building the
     * thing is cheaper than arguing about it. */
    context:
      "It decides what is worth building, hands it to whatever builds for you, yours or ours, and checks what actually happened. Two ways in: Discover when the problem is new, or Build and Learn when trying beats arguing. Either way the loop closes, and what you learn re-ranks what comes next.",
    hue: "#6cb0f5",
  },
  {
    n: "03",
    name: "the shared brain",
    // A filing cabinet remembers. What is actually being sold is that the last
    // outcome changes the next call, which is the verb pair the whole product
    // is bound to: it learns and it guides, it never remembers, stores or logs.
    claim: "It learns, and it guides.",
    context:
      "Every decision is recorded with its evidence, then graded against what actually happened. It compounds. Next time it tells you what is right, and warns you before you repeat what was wrong.",
    hue: "#E8B44C",
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
const BEAT = "layer-beat border-t border-white/[0.09] pt-6 pb-9 last:pb-0 md:pb-0 md:pt-7";

/**
 * The brief's .cn: number and layer name together, SMALL, and carrying the
 * layer's colour. This is the correction the founder called with the reference
 * screenshot in hand: the first pass made the NAME the big Pixel object and
 * the claim a medium sentence, which is the hierarchy upside down. The name is
 * a label. The claim is the impact. Labels are small, impact is big.
 */
const CN = "mb-3 block font-mono text-mrd-tiny uppercase";
const CN_STYLE = { letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums" } as const;

/**
 * The brief's .ct: the claim, and now the brightest, largest object in the
 * column. Geist Pixel Square, the brand face, exactly as the reference sets it.
 */
const CT = "mb-3.5 text-white";
const CT_STYLE = {
  fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
  fontWeight: 400,
  fontSize: "clamp(19px, 2.05vw, 25px)",
  lineHeight: 1.24,
  letterSpacing: "0",
} as const;

/**
 * The brief's .cd: what the layer actually IS. Deliberately the quietest tier,
 * so the eye reads colour, then claim, then detail, in that order every time.
 */
const CD = "text-mrd-base text-zinc-500";
const CD_STYLE = { lineHeight: 1.7, maxWidth: "42ch" } as const;

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
      {/* The spotlight, built like an actual one. A single weak wash read as
          nothing (founder: "make it like a spotlight properly"), because a
          spotlight is not just added light, it is light AND falloff. Three
          stacked layers, in paint order:

            1. a warm ember pool, centred and elliptical, carrying the hue
            2. a neutral lift right under the type, so the text gains contrast
               rather than just sitting in an orange haze
            3. a vignette that pulls the edges back down toward the ink, which
               is what actually makes the middle read as lit

          All three are section-wide and symmetric about the centre, so no
          column is favoured. Static paint, no animation, no blur filter: this
          costs one composited layer and nothing per frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(66% 58% at 50% 44%, rgba(255,107,44,0.10), rgba(255,107,44,0.035) 46%, transparent 76%)",
            "radial-gradient(52% 42% at 50% 42%, rgba(255,255,255,0.04), transparent 72%)",
            "radial-gradient(88% 78% at 50% 50%, transparent 38%, rgba(0,0,0,0.5) 100%)",
          ].join(", "),
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
        {/* Section header, rebuilt from the reference. "One system, three
            layers" was a zinc-600 mono kicker: the single most important
            sentence in the band, set smaller and darker than the body copy
            under it, which is why the founder could not read it. It is a
            headline now, in the brand face, at headline size. The ember rule
            beside the kicker is the reference's own device and it does the
            work a heavier treatment would have to fake. */}
        <div className="mb-3 flex items-center gap-4">
          {/* "What we are building" came straight off the brief's slide, where
              it is exactly right: an investor is buying the roadmap. On a
              public site the same three words say the product is not finished
              yet, which is the opposite of what a visitor needs to hear
              (founder 2026-07-25). "How it works" is what a stranger scans for
              at this point in a page, it describes what actually follows, and
              it carries no tense. The brief keeps its own wording. */}
          <span
            className="font-mono text-mrd-tiny uppercase md:text-mrd-small"
            style={{ color: "#FF6B2C", letterSpacing: "0.2em" }}
          >
            How it works
          </span>
          <span
            aria-hidden
            className="h-px w-14 md:w-24"
            style={{ background: "linear-gradient(90deg, rgba(255,107,44,0.5), transparent)" }}
          />
        </div>
        <h2
          className="mb-12 text-white"
          style={{
            fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
            fontWeight: 400,
            fontSize: "clamp(26px, 3.6vw, 40px)",
            lineHeight: 1.18,
            letterSpacing: "0",
          }}
        >
          One system, three layers.
        </h2>

        {/* Three across from md up. Below that the columns cannot breathe, so
            they stack and the vertical rules become horizontal ones. */}
        <div className="grid grid-cols-1 gap-x-10 md:grid-cols-3">
          {LAYERS.map((l, i) => (
            <div
              key={l.n}
              className={beat}
              style={{ transitionDelay: inView ? `${i * 50}ms` : "0ms" }}
            >
              {/* Colour is the only per-layer difference, and every layer has
                  one, so it is a system rather than a spotlight on a favourite.
                  The hues are the landing's own, NOT the brief's: this page has
                  already taught gold = memory (Replay), blue = machine, ember =
                  the human, so 03 takes gold because it IS the memory layer.
                  Borrowing the brief's marigold-for-01 would have put gold on
                  the director and contradicted the replay two sections down. */}
              <span className={CN} style={{ ...CN_STYLE, color: l.hue }}>
                {l.n} &middot; {l.name}
              </span>
              <h3 className={CT} style={CT_STYLE}>
                {l.claim}
              </h3>
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
