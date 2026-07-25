import { Link } from "@tanstack/react-router";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { trackLandingEvent } from "@/lib/landing.functions";

/**
 * Sparse nav per the v2 plan: Demo, Pricing, Security, Updates, Sign in, the
 * beta CTA, and the machine-view toggle. The nav CTA stays neutral so the
 * hero's primary keeps the viewport's single ember object (plan section 4.1b).
 */
export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/75 backdrop-blur-md border-b border-white/[0.06]">
      <Link to="/" className="flex items-center text-white" aria-label="Supaprod home">
        <SupaprodWordmark size={26} textSize={17} />
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <a
          href="/demo"
          onClick={() => void trackLandingEvent({ data: { event: "demo_click" } })}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Demo
        </a>
        <a href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Pricing
        </a>
        <a href="/security" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Security
        </a>
        <a href="/updates" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Updates
        </a>
      </div>

      <div className="flex items-center gap-4">
        <a href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Sign in
        </a>
        <a
          href="#join"
          className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          Join the beta
        </a>
        <button
          title="Machine view (M key)"
          aria-label="Toggle machine view"
          className="text-xs font-mono text-zinc-600 hover:text-zinc-300 border border-white/10 rounded px-1.5 py-0.5 transition-colors"
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }))}
        >
          M
        </button>
      </div>
    </nav>
  );
}
