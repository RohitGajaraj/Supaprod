import { BookLock, KeyRound, ShieldOff, Undo2 } from "lucide-react";
import { CadenceMark } from "@/components/cadence/CadenceMark";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Beat 6 - Trust + close.
 * The trust strip (four promises with the identity-law icons, linked to
 * /security), the close, and the one conversion ask: the waitlist, inline.
 * The CTA is this viewport's single ember object (plan section 4.1b).
 */
export function TrustClose({ waitlistCount }: { waitlistCount: number | null }) {
  const promises = [
    { icon: BookLock, label: "Read-only by default" },
    { icon: KeyRound, label: "Your keys stay yours" },
    { icon: ShieldOff, label: "No training on your data" },
    { icon: Undo2, label: "One-click revoke" },
  ];

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
        {/* Trust strip: 16px lucide outline icons, one treatment, hover lift */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 pb-12 border-b border-white/10">
          {promises.map((p) => (
            <a
              key={p.label}
              href="/security"
              className="group flex flex-col items-center gap-2.5 text-center text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <p.icon
                size={16}
                strokeWidth={1.5}
                className="text-zinc-600 group-hover:text-zinc-300 group-hover:-translate-y-0.5 transition-all duration-200"
                aria-hidden
              />
              {p.label}
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

        <WaitlistForm waitlistCount={waitlistCount} />
      </div>
    </section>
  );
}
