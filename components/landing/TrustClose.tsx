import {
  BookLock,
  Brain,
  Fingerprint,
  GitMerge,
  KeyRound,
  Lock,
  ScrollText,
  Undo2,
} from "lucide-react";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Beat 6 - Trust + close.
 * The trust strip (four promises with the identity-law icons, linked to
 * /security), the close, and the one conversion ask: the waitlist, inline.
 * The CTA is this viewport's single ember object (plan section 4.1b).
 */
export function TrustClose({ waitlistCount }: { waitlistCount: number | null }) {
  // Eight promises, each one verifiably true of the shipped architecture.
  const promises = [
    {
      icon: BookLock,
      label: "Read-only by default",
      detail: "Connect your sources without granting a single write.",
    },
    {
      icon: Fingerprint,
      label: "Writes pass your gate",
      detail: "Write access is scoped per mission and approved by you.",
    },
    {
      icon: Brain,
      label: "Learns you, trains no one else",
      detail: "Your precedent stays in your workspace. No shared model sees it.",
    },
    {
      icon: KeyRound,
      label: "Your model keys, or ours",
      detail: "Bring your own keys or run on managed ones. Your choice.",
    },
    {
      icon: ScrollText,
      label: "Every act on the record",
      detail: "Each agent action carries a traceable audit id.",
    },
    {
      icon: GitMerge,
      label: "Merge is always human",
      detail: "Merge, revert, and delegate can never skip your approval.",
    },
    {
      icon: Lock,
      label: "Keys encrypted at rest",
      detail: "Pasted credentials sit in an AES-256 vault.",
    },
    {
      icon: Undo2,
      label: "One-click revoke",
      detail: "Pull any connection or permission instantly.",
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
        {/* The trust grid: eight true promises as interactive cards, all
            routing into /security for the full answers */}
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-4">
          the rules the agents cannot break
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-20">
          {promises.map((p) => (
            <div
              key={p.label}
              className="group border border-white/[0.08] bg-[#0d0d0e] rounded-xl p-5 hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              <p.icon
                size={16}
                strokeWidth={1.5}
                className="text-zinc-600 group-hover:text-zinc-200 transition-colors duration-200 mb-3"
                aria-hidden
              />
              <p className="text-sm text-zinc-200 font-medium mb-1.5">{p.label}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 -mt-16 mb-20">
          The full answers, stated plainly:{" "}
          <a
            href="/security"
            className="text-zinc-400 underline underline-offset-4 decoration-zinc-700 hover:text-zinc-200 transition-colors"
          >
            /security
          </a>
        </p>

        {/* The close: beta status as a mono eyebrow, the heading cut in two
            for punch, and the sub at the page's standard text-lg, one promise
            per line (founder 2026-07-15: never three sub lines under a
            one-line heading). The #join anchor lives HERE, not on the section,
            so every 'Join the beta' click lands with the eyebrow, heading,
            and the email field all in view. The 160px offset is deliberate
            (founder 2026-07-15): the block lands a little down the viewport,
            trust cards peeking above and the footer just reaching the bottom
            edge, so no empty run below the form is exposed. */}
        <div id="join" className="scroll-mt-40">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">
            the beta is open for sign-ups
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold mb-4 text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            A product team of agents. Answerable to you.
          </h2>
          <p className="text-lg text-zinc-400 mb-12 leading-relaxed">
            <span className="md:block">
              It starts learning your product from the first call you grade with it.
            </span>{" "}
            <span className="md:block">
              Every graded outcome sharpens its taste, until it tells you what to build before you
              ask.
            </span>
          </p>

          <WaitlistForm waitlistCount={waitlistCount} />
        </div>
      </div>
    </section>
  );
}
