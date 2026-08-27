import { BookLock, Brain, GitMerge, KeyRound } from "lucide-react";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Beat 6 - Trust + close.
 * The trust strip (four promises with the identity-law icons, linked to
 * /security), the close, and the one conversion ask: the waitlist, inline.
 * The CTA is this viewport's single ember object (plan section 4.1b).
 *
 * Halved 2026-07-25 (landing duplication audit): eight cards was a wall
 * between the reader and the signup, and four of them restated the gate the
 * page states seven times. The other four answers live at /security, which
 * this section already links to. The close lost its own restatement of the
 * loop claim (its fifth appearance on the page).
 */
export function TrustClose({ waitlistCount }: { waitlistCount: number | null }) {
  // Four promises, each one verifiably true of the shipped architecture -- which
  // means checked against the wiring, not against what we wish it did. See the
  // merge card below for the one that was not.
  const promises = [
    {
      icon: BookLock,
      label: "Read-only by default",
      detail: "Connect your sources without granting a single write.",
    },
    {
      icon: Brain,
      label: "Learns you, trains no one else",
      detail: "Your precedent stays in your workspace. No shared model sees it.",
    },
    {
      icon: KeyRound,
      label: "Your model keys, or ours",
      /*
       * THIS PROMISED EVERY VISITOR SOMETHING ONE TIER HAS. It read "Bring your
       * own keys or run on managed ones. Your choice." on the panel headed "the
       * rules the agents cannot break", which is the strongest promise on the
       * page. Bring-your-own-keys is enterprise-only and ENFORCED: entitlements
       * .ts:275 sets `byokAllowed: enterprise`, and byokeys.functions.ts:162
       * refuses any caller without that entitlement.
       *
       * The pricing page said so plainly at the same time, in entitlements
       * .ts:480: "Bring your own model keys, the only tier that can". So a
       * visitor reading both was told a choice was theirs on one page and
       * reserved for a sales conversation on the next.
       *
       * Corrected on the landing rather than on pricing, because pricing was
       * the one telling the truth. Same class as the hero claiming "No human
       * intervention" while TrustClose promised merge can never skip approval:
       * a surface asserting a capability the wiring does not give it.
       */
      detail: "Run on managed keys, or bring your own on Enterprise.",
    },
    /*
     * THIS BADGE STATED A GUARANTEE THE WIRING DOES NOT KEEP, and it stated it
     * as the last thing a visitor reads before deciding whether an agent
     * touching their repository is safe.
     *
     * It read "Merge is always human" over "Merge, revert, and delegate can
     * never skip your approval." R-27 was revised on 2026-08-25:
     * `AUTO_SHIP_ENABLED`, read from the `STUDIO_AUTO_SHIP` platform secret,
     * un-pins `studio.pr.merge` from `review` so an agent on an ambient trust
     * arc merges with nobody asked (loop.server.ts:132, defaults.ts:238). The
     * secret exists and F-75 records that the founder set it. Both absolutes
     * stopped being true the moment it did.
     *
     * THE HONEST FORM WAS ALREADY WRITTEN ON THIS SAME SITE. /security was
     * corrected on 2026-08-27 for exactly this reason and says so at length: by
     * default nothing merges without a human approval, no workspace setting can
     * change that, the only thing that can is a platform secret we hold, and
     * even then four things have to be proven first. This badge now agrees with
     * that page instead of contradicting it, in the space a badge has.
     *
     * REVERT KEEPS ITS ABSOLUTE, because revert actually has one: `studio.revert`
     * is deliberately not graduated and stays review-pinned whatever the flag
     * says, which loop.server.ts states in its own comment. Dropping a true
     * absolute alongside a false one would have cost us the stronger claim in
     * order to fix the weaker.
     *
     * This is the class the note four cards above already named, one turn
     * further on: not a surface asserting a capability the wiring withholds,
     * but a surface asserting a GUARANTEE the wiring does not keep.
     */
    {
      icon: GitMerge,
      label: "Merge waits for your approval",
      detail:
        "By default nothing merges without you, and no workspace setting can change that. Rolling back is never automatic at all.",
    },
  ];

  // pb tighter than the beat rhythm on purpose (founder 2026-07-15): after
  // the form there is nothing left to read, so the footer starts close; the
  // watermark mark getting cropped harder is sanctioned.
  return (
    <section className="relative overflow-hidden pt-32 pb-12 px-4">
      {/* The mono watermark: the mark enormous, bleeding off the edge.
          Structural texture, grayscale-safe (plan section 4.2). */}
      <div
        className="absolute -right-40 -bottom-44 opacity-[0.05] pointer-events-none hidden md:block"
        aria-hidden
      >
        <SupaprodMark size={560} mono glow={false} />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* The trust grid: four true promises as cards, all routing into
            /security for the full answers. Founder 2026-07-25: this block
            looks clean, leave it. Untouched except for the margin arithmetic
            below, which produced the same gap by two opposing numbers. */}
        <p className="text-mrd-nano font-mono uppercase tracking-widest text-zinc-400 mb-4">
          the rules the agents cannot break
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {promises.map((p) => (
            <div
              key={p.label}
              className="group border border-white/[0.08] bg-[#0d0d0e] rounded-xl p-5 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              <p.icon
                size={16}
                strokeWidth={1.5}
                className="text-zinc-400 group-hover:text-zinc-200 transition-colors duration-200 mb-3"
                aria-hidden
              />
              <p className="text-sm text-zinc-200 font-medium mb-1.5">{p.label}</p>
              <p className="text-xs text-zinc-500 leading-mrd-prose">{p.detail}</p>
            </div>
          ))}
        </div>
        {/* Was `mb-20` on the grid plus `-mt-16` here, which collapsed to the
            same 16px. Same result, stated once (2026-07-25 craft pass). */}
        <p className="text-xs text-zinc-400 mb-24">
          The full answers, stated plainly:{" "}
          <a
            href="/security"
            className="text-zinc-400 underline underline-offset-4 decoration-zinc-700 hover:text-zinc-200 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            /security
          </a>
        </p>

        {/* The close (reworked 2026-07-25, founder: "shouldn't it be a little
            subtle"). The argument lands, the offer stays quiet. Three moves:
            the scarcity claim left this block entirely and is now one mono
            line under the form; the heading breaks on its own line so the
            second sentence reads as the answer to the first; and the whole
            block commits to the page's left edge, the same edge the trust
            kicker and every section headline above it start on, so the last
            viewport is one column with one ember object in it.

            Ember is always on the key noun (founder ruling): `agents` here,
            never a hover state. It is text, the CTA is a filled pill, so the
            action is still the only thing in the viewport that looks pressable.

            The #join anchor lives HERE, not on the section, so every 'Join the
            beta' click lands with the eyebrow, heading, and the email field all
            in view. The 160px offset is deliberate (founder 2026-07-15): the
            block lands a little down the viewport, trust cards peeking above
            and the footer just reaching the bottom edge, so no empty run below
            the form is exposed. */}
        <div id="join" className="scroll-mt-40">
          {/* Read "the beta is open" until 2026-08-07, standing directly above
              the form that collected addresses for it. Both halves cannot be
              true at once: a queue is only a queue if there is something to
              queue for. The founder closed signup that morning, which makes this
              line the honest one it was pretending to be, and makes the form
              under it a real request rather than a courtesy. */}
          <p className="text-mrd-nano font-mono uppercase tracking-widest text-zinc-500 mb-5">
            the beta is invite only
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold mb-5 text-white leading-[1.06]"
            style={{ letterSpacing: "-0.02em" }}
          >
            A product team of <span style={{ color: "#FF6B2C" }}>agents</span>.
            <br />
            Answerable to you.
          </h2>
          <p className="text-lg text-zinc-400 mb-10 leading-mrd-prose" style={{ maxWidth: "44ch" }}>
            It starts learning your product from the first call you grade.
          </p>

          <WaitlistForm waitlistCount={waitlistCount} />
        </div>
      </div>
    </section>
  );
}
