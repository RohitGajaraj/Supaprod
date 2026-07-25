import { trackLandingEvent } from "@/lib/landing.functions";
import { MarkGlint } from "./MarkGlint";

/**
 * Beat 1 - Hero. Monumental register (founder ruling 2026-07-15): the
 * headline on the left, the mark backlit at center like an eclipse, a mono
 * spec column on the right. No product frame above the fold; the product
 * shows itself one scroll down in the walkthrough.
 * Ink-and-metal: white light only behind the mark, ember on the primary CTA
 * and on exactly one word. Entrances are pure CSS so SSR paints complete
 * without JavaScript.
 *
 * Craft pass 2026-07-25 (founder review, points 1, 2, 9, 10):
 * 1. Hierarchy. One brightest object (the claim line, white Pixel), a clear
 *    second (the ember audience word and the ember CTA), everything else
 *    recedes through zinc-400 / 500 / 600. The verb line steps down 10px in
 *    size so scale carries the demotion, not colour alone.
 * 2. Dead space. The section was min-h-[100dvh] with pt-24 / pb-16, which
 *    parked the block roughly 149px below the fixed nav on a 900px viewport.
 *    Now min-h-[92svh] with pt-[92px] / pb-[124px]: the top padding clears
 *    the 57px nav with 35px of air, and the bottom pad is the larger of the
 *    two so the block sits optically high in the space it owns (~81px of
 *    visible gap under the nav on the same viewport).
 * 9. Ember is never a PER-WORD hover state. The old .hero-verb tint is still
 *    gone: it lit individual words on their own hover targets, which dresses
 *    non-interactive text as an affordance and the affordance-is-not-emphasis
 *    law forbids that. The spec column below warms to ember on hover of the
 *    WHOLE COLUMN, which is a different thing and is allowed (founder
 *    2026-07-25): there is no per-word target to mistake for a link, so it
 *    reads as the block acknowledging the pointer, not as three buttons.
 * 10. One left rule for the whole page. The hero was max-w-6xl / px-6 while
 *    every section below it is max-w-5xl / px-4, so the eye entered at two
 *    different x positions. The hero now shares the page rule, and every
 *    block inside it is left aligned at every breakpoint (it used to flip
 *    from centre to left at lg).
 *
 * Craft pass 2026-07-25b (founder review, one ember not two):
 * A. ONE ember word above the fold, and it is "product managers". The hero
 *    used to tint three words ember (both nouns in the audience line, plus
 *    "Agents" opening the support paragraph) on top of the ember CTA fill.
 *    Four accents in one viewport is the everything-is-important failure: the
 *    eye ping-pongs and nothing lands. Colour now marks the NEW information,
 *    which is who this is for, the one thing the page never said before.
 *    "agents" is already carried by the headline's size and Pixel face, so it
 *    does not need hue as well; it steps down to zinc-400 and the support
 *    paragraph opens in plain body colour. No hashtag on the audience line:
 *    this page's credibility rests on receipts, and a hashtag reads as social
 *    styling.
 * B. The right-hand spec column loses its vertical hairline (founder: "one
 *    strip line that needs to be eliminated"). Three left-aligned mono lines
 *    with a shared indent already read as a column, and the rule was a second
 *    hard vertical edge sitting inside the mark's eclipse glow, competing
 *    with it for the same piece of the viewport. The indent stays so nothing
 *    reflows and the column keeps its gutter off the mark.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-center px-4 pt-[92px] pb-[124px]">
      <style>{`
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFade { from { opacity: 0; } to { opacity: 1; } }
        .hero-rise { animation: heroRise 0.9s cubic-bezier(0.23, 1, 0.3, 1) both; }
        .hero-cta {
          transition: background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1),
                      transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .hero-cta:active { transform: scale(0.98); }
        .hero-quiet { transition: color 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .hero-arrow { transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .hero-cta:focus-visible,
        .hero-quiet:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C;
        }
        .hero-spec-key { color: #d4d4d8; transition: color 0.2s ease; }
        @media (hover: hover) and (pointer: fine) {
          .hero-cta:hover { background-color: #ff8344; }
          .hero-quiet:hover { color: #ffffff; }
          .hero-cta:hover .hero-arrow,
          .hero-quiet:hover .hero-arrow { transform: translateX(2px); }
          /* Whole column, one target. Hovering ANY part of the spec warms all
             three payload phrases together, so nothing reads as a per-word
             button. See note 9 above. */
          .hero-spec:hover .hero-spec-key { color: #FF6B2C; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-spec-key { transition: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-rise { animation: heroFade 0.5s cubic-bezier(0.23, 1, 0.32, 1) both; }
          .hero-arrow { transition: none; }
          .hero-cta:active { transform: none; }
        }
      `}</style>

      {/* Grain: fixed, pointer-events-none, barely there */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" aria-hidden>
        <svg width="100%" height="100%">
          <filter id="noise-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" />
          </filter>
          <rect width="100%" height="100%" fill="#ffffff" filter="url(#noise-filter)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.12fr_auto_0.6fr]">
          {/* Mobile: the mark, left aligned on the same rule as the text so
              the eye enters at one x position on every device. */}
          <div className="hero-rise relative mb-4 flex justify-start lg:hidden">
            <div
              className="pointer-events-none absolute left-[48px] top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 42%, transparent 68%)",
              }}
              aria-hidden
            />
            <MarkGlint size={96} />
          </div>

          {/* Left: the claim */}
          <div className="text-left">
            {/* Who it is for, and the only ember word on the page above the
                fold. The connectives sit at zinc-600, "agents" one stop up at
                zinc-400, and the audience alone carries hue. */}
            <p
              className="hero-rise mb-5 font-mono text-[11px] uppercase text-zinc-600 md:text-[12px]"
              style={{ animationDelay: "0ms", letterSpacing: "0.14em" }}
            >
              For <span className="font-medium text-[#FF6B2C]">product managers</span> who ship with{" "}
              <span className="text-zinc-400">agents</span>
            </p>

            <h1
              className="hero-rise mb-7 text-white"
              style={{
                animationDelay: "60ms",
                fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                fontWeight: 400,
                letterSpacing: "0",
                textWrap: "balance",
              }}
            >
              {/* The one brightest object on the page. */}
              <span className="block text-[30px] leading-[1.16] md:text-[40px] lg:text-[44px]">
                Supaprod tells you what to build.
              </span>
              {/* The loop, a real size step down and two stops darker, so the
                  demotion is carried by scale and colour together. */}
              <span className="mt-3 block text-[21px] leading-[1.3] text-zinc-500 md:text-[28px] lg:text-[32px]">
                then builds it. ships it. grades it. gets sharper.
              </span>
            </h1>

            <p
              className="hero-rise mb-9 text-base leading-relaxed text-zinc-400 md:text-lg"
              style={{ animationDelay: "120ms", maxWidth: "48ch" }}
            >
              Agents that know what to build, ship it, remember,{" "}
              <span className="text-zinc-300">and guide the next call.</span>
            </p>

            <div
              className="hero-rise flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-7"
              style={{ animationDelay: "180ms" }}
            >
              <a
                href="#join"
                className="hero-cta group rounded-full bg-[#FF6B2C] px-8 py-3 font-medium text-white"
              >
                <span className="flex items-center gap-2">
                  Join the beta
                  <span className="hero-arrow inline-block" aria-hidden>
                    &rarr;
                  </span>
                </span>
              </a>
              <a
                href="/demo"
                onClick={() => void trackLandingEvent({ data: { event: "demo_click" } })}
                className="hero-quiet group rounded-sm text-sm text-zinc-400"
              >
                Watch a real run{" "}
                <span className="hero-arrow inline-block" aria-hidden>
                  &rarr;
                </span>
              </a>
            </div>

            {/* The offer sits under the action, not above it. It is a reason
                to click, not a second headline, so it reads quiet. */}
            <p
              className="hero-rise mt-8 text-[13px] leading-relaxed text-zinc-500 md:text-sm"
              style={{ animationDelay: "240ms", maxWidth: "46ch" }}
            >
              <span className="text-zinc-300">The first 100 get a free teardown.</span> Our Critic
              agent tears your riskiest idea apart. No credit card.
            </p>
          </div>

          {/* Center: the mark, backlit like an eclipse (desktop) */}
          <div className="hero-rise relative hidden justify-center lg:flex" aria-hidden={false}>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.045) 42%, transparent 68%)",
              }}
              aria-hidden
            />
            {/* Fixed position, revolving on its own clock (founder 2026-07-15):
                no pointer drift, the mark holds still and keeps turning. */}
            <MarkGlint size={176} />
          </div>

          {/* Right: the mono spec column, machine-voice register. No rule down
              its left edge (founder 2026-07-25): shared indent, shared
              baseline rhythm and one type register already read as a column,
              and the hairline was competing with the mark's glow. The payload
              phrases sit two stops above their connectives. */}
          <div
            className="hero-spec hero-rise group hidden flex-col gap-3 pl-5 font-mono text-[12px] uppercase text-zinc-600 lg:flex"
            style={{ animationDelay: "120ms", letterSpacing: "0.14em", lineHeight: 1.6 }}
          >
            <span>
              to read <span className="hero-spec-key whitespace-nowrap">the signals you miss</span>
            </span>
            <span>
              to open <span className="hero-spec-key whitespace-nowrap">the pull request</span>
            </span>
            <span>
              to remember <span className="hero-spec-key whitespace-nowrap">why you said no</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
