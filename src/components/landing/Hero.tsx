import { trackLandingEvent } from "@/lib/landing.functions";
import { MarkGlint } from "./MarkGlint";

/**
 * Beat 1 - Hero. Monumental register (founder ruling 2026-07-15): the
 * headline on the left, the mark backlit at center like an eclipse, a mono
 * descriptor column on the right. No product frame above the fold; the
 * product shows itself one scroll down in the walkthrough.
 * Ink-and-metal: white light only behind the mark, ember only on the primary
 * CTA. Entrances are pure CSS so SSR paints complete without JavaScript.
 */
export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center px-6 pt-24 pb-16">
      <style>{`
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-rise { animation: heroRise 0.9s cubic-bezier(0.23, 1, 0.3, 1) both; }
        .hero-verb { transition: color 0.25s ease; }
        .hero-verb:hover { color: #FF6B2C; }
        @media (prefers-reduced-motion: reduce) {
          .hero-rise { animation: none; }
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

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_auto_0.7fr] items-center gap-10 lg:gap-14">
          {/* Mobile: the mark first, backlit */}
          <div className="hero-rise relative flex justify-center lg:hidden mb-2">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 42%, transparent 68%)",
              }}
              aria-hidden
            />
            <MarkGlint size={120} />
          </div>

          {/* Left: the claim */}
          <div className="text-center lg:text-left">
            <h1
              className="hero-rise text-[30px] md:text-[40px] lg:text-[44px] leading-[1.18] mb-6 text-white"
              style={{
                animationDelay: "150ms",
                fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                fontWeight: 400,
                letterSpacing: "0",
                textWrap: "balance",
              }}
            >
              Cadence tells you what to build.
              <span className="block mt-3 text-zinc-400">
                then <span className="hero-verb">builds it.</span>{" "}
                <span className="hero-verb">ships it.</span>{" "}
                <span className="hero-verb">grades it.</span>{" "}
                <span className="hero-verb">gets sharper.</span>
              </span>
            </h1>

            <p
              className="hero-rise text-base md:text-lg text-zinc-400 mb-10 leading-relaxed mx-auto lg:mx-0"
              style={{ animationDelay: "300ms", maxWidth: "52ch" }}
            >
              It reads your signals, your market, and your own track record, then makes the call
              with you. One governed loop carries it to shipped code and comes back to grade the
              outcome. Every graded call makes the next one sharper.
            </p>

            <div
              className="hero-rise flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-5"
              style={{ animationDelay: "450ms" }}
            >
              <a
                href="#join"
                className="group px-8 py-3 rounded-full bg-[#FF6B2C] text-white font-medium hover:bg-[#ff8344] active:scale-[0.98] transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  Join the beta
                  <span
                    className="inline-block group-hover:translate-x-0.5 transition-transform"
                    aria-hidden
                  >
                    &rarr;
                  </span>
                </span>
              </a>
              <a
                href="/demo"
                onClick={() => void trackLandingEvent({ data: { event: "demo_click" } })}
                className="px-8 py-3 rounded-full border border-white/15 text-white font-medium hover:border-white/30 hover:bg-white/[0.03] active:scale-[0.98] transition-all duration-200"
              >
                Watch a real run
              </a>
            </div>

            <p
              className="hero-rise flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1 text-xs text-zinc-500 font-mono"
              style={{ animationDelay: "600ms" }}
            >
              <span>No credit card.</span>
              <span className="whitespace-nowrap">
                First 100 get their riskiest idea stress-tested, free.
              </span>
            </p>
          </div>

          {/* Center: the mark, backlit like an eclipse (desktop) */}
          <div className="hero-rise relative hidden lg:flex justify-center" aria-hidden={false}>
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.045) 42%, transparent 68%)",
              }}
              aria-hidden
            />
            {/* Fixed position, revolving on its own clock (founder 2026-07-15):
                no pointer drift, the mark holds still and keeps turning. */}
            <MarkGlint size={190} />
          </div>

          {/* Right: the mono descriptor, machine-voice register */}
          <div
            className="hero-rise hidden lg:flex flex-col gap-3 font-mono text-[12px] uppercase text-zinc-400"
            style={{ animationDelay: "300ms", letterSpacing: "0.14em", lineHeight: 1.6 }}
          >
            <span>for product teams</span>
            <span>
              to decide <span className="hero-verb whitespace-nowrap">what to build</span>
            </span>
            <span>
              and <span className="hero-verb whitespace-nowrap">ship it</span>,{" "}
              <span className="hero-verb whitespace-nowrap">gated by you</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
