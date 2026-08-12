import { Link } from "@tanstack/react-router";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { trackLandingEvent } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";
import { useMachineView } from "@/hooks/use-machine-view";

/**
 * Sparse nav per the v2 plan: Demo, Pricing, Security, Sign in, the beta CTA,
 * and the machine-view toggle. The nav CTA stays neutral so the hero's primary
 * keeps the viewport's single ember object (plan section 4.1b).
 * Updates was cut 2026-07-25 (landing audit): the footer and the receipts row
 * already carry it, and it was a third-priority destination competing for a
 * click before the visitor had read one sentence.
 */
export function LandingNav() {
  const { isMachineView, toggle } = useMachineView();
  /* `px-4` below 640 rather than `px-6`, plus a real gap, and it is not
   * cosmetic.
   *
   * Measured at 320px on 2026-08-11: the brand ends at x=119 and "Sign in"
   * begins at x=119. They touch. Not an overflow, which is why no
   * horizontal-scroll check ever caught it, and not an overlap either. The
   * row's content came to exactly 272px inside exactly 272px of available
   * width, so `justify-between` had no free space left to put between them and
   * the two groups met in the middle.
   *
   * Zero slack is the interesting state here: it reads as broken, it passes
   * every assertion we own, and it is one long label away from becoming a real
   * overflow. The eight pixels a side bought back are the cheapest possible fix
   * and the layout is identical from 640 up. */
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#0a0a0a]/75 backdrop-blur-md border-b border-white/[0.06]">
      <Link to="/" className="flex min-w-0 items-center text-white" aria-label="Supaprod home">
        <SupaprodWordmark tier="public" />
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {/* FILM, ADDED 2026-08-12, AND WHY IT DOES NOT REOPEN THE "UPDATES" CUT
            RECORDED ABOVE. Updates was removed for being a THIRD-PRIORITY
            destination competing for a click before the visitor had read a
            sentence. The film is the opposite: 2:22 is the fastest complete
            answer to "what is this", which makes it a first-priority door, and
            it is FIRST in the group for that reason.

            It is also not a net addition to the page. The hero's tertiary link
            came out in the same change (see Hero.tsx): the film moved from a
            line that wrapped awkwardly under two buttons to the place a
            navigation item belongs. One door, better placed.

            Safe against the 320px zero-slack measurement in the note above:
            this group is `hidden md:flex` and does not exist below 768. */}
        <a href="/film" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Film
        </a>
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
        {/* THIS SAID "Start free" AND POINTED AT /signup, which was true while
            the door was open and became a promise the next screen breaks when
            the founder closed signup on 2026-08-07 (private beta, entry by
            invite code).
            The nav CTA has to match the hero's primary or the page argues with
            itself in the visitor's first two seconds, which is the exact defect
            the 2026-08-05 landing ruling was written to remove. The hero now
            asks for access, so this asks for access, and it scrolls to the one
            waitlist form the page has ever had rather than opening a second. */}
        <a
          href="/#join"
          className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          {/* "Join the beta" since 2026-08-10, matching the hero button and
              WaitlistForm's own submit label. See the note in Hero.tsx: the
              gate is real and this word keeps it honest, but "request" made the
              visitor petition before they knew enough to want to. */}
          Join the beta
        </a>
        {/*
         * THIS BUTTON WAS DEAD, on the page strangers land on.
         *
         * It dispatched a synthetic `keydown` for "m" and advertised "(M key)"
         * in its own tooltip. There is no "m" binding anywhere in the app:
         * `use-machine-view` registers no keyboard listener and nothing in src/
         * tests for that key. So the event landed on nothing and the button did
         * nothing, while naming a shortcut that does not exist.
         *
         * The identical defect was found in the FOOTER on 2026-07-25 and is
         * written up at the top of LandingFooter.tsx — "It fired a synthetic
         * keydown to toggle the same state the labeled, stateful control two
         * rows below already owns". That fix removed one of the two buttons and
         * this one survived it.
         *
         * Now it calls the same `toggle` the [HUMAN]/[MACHINE] control calls, so
         * the two cannot disagree, and the tooltip states what is true.
         */}
        <button
          title={isMachineView ? "Switch to human view" : "Switch to machine-readable view"}
          aria-label="Machine-readable view"
          aria-pressed={isMachineView}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-300 border border-white/10 rounded px-1.5 py-0.5 transition-colors"
          onClick={toggle}
        >
          M
        </button>
      </div>
    </nav>
  );
}
