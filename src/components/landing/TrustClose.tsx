import { CadenceMark } from "@/components/cadence/CadenceMark";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Beat 6 - Trust + close.
 * The trust strip (four promises, linked to /security), the close, and the
 * one conversion ask: the waitlist, inline. The CTA is this viewport's single
 * ember object (plan section 4.1b).
 */
export function TrustClose() {
  return (
    <section id="join" className="relative overflow-hidden py-32 px-4 scroll-mt-16">
      {/* The mono watermark: the mark enormous, bleeding off the edge.
          Structural texture, grayscale-safe (plan section 4.2). */}
      <div
        className="absolute -right-40 -bottom-44 opacity-[0.05] pointer-events-none hidden md:block"
        aria-hidden
      >
        <CadenceMark size={560} mono glow={false} />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 pb-12 border-b border-white/10">
          {[
            "Read-only by default",
            "Your keys stay yours",
            "No training on your data",
            "One-click revoke",
          ].map((promise) => (
            <a
              key={promise}
              href="/security"
              className="text-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {promise}
            </a>
          ))}
        </div>

        <h2
          className="text-4xl md:text-5xl font-semibold mb-4 text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          A product team of agents, answerable to you.
        </h2>
        <p className="text-xl text-zinc-400 mb-12" style={{ maxWidth: "52ch" }}>
          It starts learning your product from the first call you grade with it. The doors open
          this month. Early is the offer.
        </p>

        <WaitlistForm />
      </div>
    </section>
  );
}
