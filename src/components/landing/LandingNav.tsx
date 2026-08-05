import { Link } from "@tanstack/react-router";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { trackLandingEvent } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";

/**
 * Sparse nav per the v2 plan: Demo, Pricing, Security, Sign in, the beta CTA,
 * and the machine-view toggle. The nav CTA stays neutral so the hero's primary
 * keeps the viewport's single ember object (plan section 4.1b).
 * Updates was cut 2026-07-25 (landing audit): the footer and the receipts row
 * already carry it, and it was a third-priority destination competing for a
 * click before the visitor had read one sentence.
 */
export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/75 backdrop-blur-md border-b border-white/[0.06]">
      <Link to="/" className="flex items-center text-white" aria-label="Supaprod home">
        <SupaprodWordmark tier="public" />
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <a
          href="/demo"
          // Read in the handler, not at render: this nav is server rendered.
          onClick={() =>
            void trackLandingEvent({
              data: { event: "demo_click", sessionKey: getLandingSessionKey() },
            })
          }
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
      </div>

      <div className="flex items-center gap-4">
        <a href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Sign in
        </a>
        {/* Points at the open door, matching the hero and /pricing. The
            waitlist stays reachable at #join from the closing section; it is
            simply no longer the only thing a visitor can do. */}
        <a
          href="/signup"
          className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          Start free
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
