import { useEffect, useRef, useState } from "react";
import { SUPAPROD_MARK_PATH } from "@/components/supaprod/SupaprodMark";
import { trackLandingEvent } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";
import { LoopReplay, type ReplayTab } from "./replay/Replay";

/**
 * Beat 3 - The loop, running (the walkthrough).
 * Tabs: the full loop / where others stop / when it breaks.
 * Reader-paced: tabs are clicked, never auto-cycled. The second tab IS the
 * category contrast, experienced instead of asserted (plan section 3, beat 3).
 * Behind the content, the mark's orbit curve draws itself as the reader
 * scrolls the section: the mark IS the loop, drawn by reading about the loop.
 *
 * Vercel grammar (composition playbook section 3): capability headline, then
 * the artifact. The three-layer spec column that used to sit between them is
 * gone from here: it is the core claim, not supporting detail, so it got its
 * own section (ThreeLayers.tsx, a three-column band) immediately above this
 * one. This section is single-purpose again: the loop, running.
 */

/**
 * The four things the replay actually demonstrates, restored after the
 * three-layer column moved out and took them with it (founder 2026-07-25:
 * "you have missed this").
 *
 * They used to float top-right of the headline as a detached legend, read as
 * a stray list, and named four capabilities before the reader had seen one of
 * them. They now sit UNDER the replay, so each one is a receipt for something
 * on screen a moment ago rather than a claim made in advance. Every gloss is
 * a mechanism, not a promise: this section earns its claims by showing them.
 */
const REPLAY_RECEIPTS = [
  { label: "Named agents", gloss: "Every step is signed by the agent that ran it." },
  // WAS "Human gates / The merge waits for your approval", changed 2026-08-10.
  //
  // Not because it was wrong, but because the page says it eight times: layer
  // 02 ("You make every call that matters"), the strip above ("you gate it"),
  // two GATE rows inside the trace this chip sits under, the trace footer
  // ("You made two calls"), the Receipts thesis ("You answer for it"), and
  // TrustClose ("Merge is always human"). The trace directly above ALREADY
  // shows "Merge held for you. Approved." This chip was captioning a thing the
  // reader had just watched, which is the weakest thing a chip can do.
  //
  // What it says instead is the half of the governance claim the page never
  // made: the limits are set IN ADVANCE. Every other mention is a per-run
  // approval, which reads as twelve interruptions. README's own words for
  // layer 02 are "inside boundaries a human sets in advance", and that idea
  // was nowhere on this page. So a repetition became the missing argument.
  { label: "Boundaries up front", gloss: "You set the limits once. Agents work inside them." },
  { label: "Precedent first", gloss: "Past calls surface before this one is made." },
  { label: "Outcome grading", gloss: "The result is scored, and it guides." },
] as const;
export function LoopWalkthrough() {
  const [activeTab, setActiveTab] = useState<ReplayTab>("full");
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<SVGPathElement>(null);

  const tabs: { id: ReplayTab; label: string }[] = [
    { id: "full", label: "The full loop" },
    { id: "others", label: "Where others stop" },
    { id: "failure", label: "When it breaks" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.15 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // The orbit scrub: stroke-dashoffset eases toward the scroll target instead
  // of tracking it 1:1, so the line draws (and undraws) with a little inertia
  // in both scroll directions. Direct style writes on a non-React node;
  // still under reduced motion.
  useEffect(() => {
    const path = orbitRef.current;
    const section = sectionRef.current;
    if (!path || !section) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      return;
    }
    let raf = 0;
    let current = 100;
    let target = 100;
    let running = false;
    const computeTarget = () => {
      // Progress from the orbit's OWN viewport position, not the section's:
      // it starts drawing the moment it appears at the bottom and completes
      // as it reaches center screen, so the draw is always watched, and
      // scrolling back up undraws it the same way.
      const svg = path.ownerSVGElement ?? section;
      const rect = svg.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = vh / 2 + rect.height / 2;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / span));
      target = 100 - progress * 100;
    };
    const tick = () => {
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 0.05) {
        current = target;
        path.style.strokeDashoffset = current.toFixed(2);
        running = false;
        return;
      }
      path.style.strokeDashoffset = current.toFixed(2);
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      computeTarget();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    return () => {
      window.removeEventListener("scroll", kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="loop"
      ref={sectionRef}
      className="relative overflow-hidden py-32 px-4 scroll-mt-16"
    >
      {/* The orbit, drawn by scroll: a whisper of silver bleeding off the
          right edge (the viewBox scales the stroke ~7x, so these numbers are
          deliberately tiny). Sits low enough to clear the replay mocks: back
          to 580 now that the layer column has left this section, which is the
          clearance it had before that column pushed it to 720. */}
      <svg
        className="absolute pointer-events-none hidden lg:block"
        style={{ right: -240, top: 580, width: 740, height: 740, overflow: "visible" }}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
      >
        <path
          ref={orbitRef}
          d={SUPAPROD_MARK_PATH}
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset="100"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.9}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative max-w-5xl mx-auto">
        <h2
          className={`text-4xl md:text-5xl lg:text-[52px] lg:whitespace-nowrap font-semibold mb-12 text-white transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ letterSpacing: "-0.02em" }}
        >
          Signal to shipped. Watch it happen.
        </h2>

        {/* The replay's type scale, re-declared on the wrapper.
            The two 2026-07-25 typography-migration commits (82b5cd4f, then
            fd713f87) stripped EVERY inline fontSize out of replay/Replay.tsx,
            so its station spine, timestamps, actor chips and mock-card
            metadata all fell back to the 13px body inherit. That is what made
            the sections flowing in under the headline read poppy and
            oversized. The replay component is founder-frozen (the 3D card
            motion stays exactly as it is), so the scale is restored from out
            here instead.

            Corrected to 10px 2026-07-25 (founder: still bigger than the
            original, still poppy). The first restore picked a flat 11px,
            which is under the 13px inherit but still ABOVE almost every value
            the component originally carried: the station spine was 10px, the
            timestamps 9px, the event tags 9.5px, the actor chips and the
            agent-row status words 8.5px, the card stage labels and progress
            words 8 to 9px. Flattening all of that to 11px is what read as
            shouty: the fine metadata lost its whisper and everything spoke at
            one volume. 10px is the mean of what the component actually had,
            and it lands the spine exactly on its original value.

            Sentences are left at 12px. They were 13px (the trace lines) and
            12.5px (the caption) originally, so they are already quieter than
            they were, and they are the part a reader actually reads. The
            result is a real two-step hierarchy again: 12px reading voice over
            10px metadata voice, under a 52px headline. */}
        <style>{`
          .loop-replay-scale { font-size: 10px; }
          .loop-replay-scale p { font-size: 12px; }
        `}</style>

        {/* Reader-paced tabs: clicked, never cycled on a timer. Held at a
            clear secondary scale so the headline above keeps the section. */}
        <div className="flex gap-6 mb-10 border-b border-white/10" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-mrd-base font-medium transition-colors duration-200 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-white border-white"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="loop-replay-scale">
          <LoopReplay tab={activeTab} />
        </div>

        {/* The receipts for what just played. Hairline-topped columns, the
            same grammar as the three-layer band above, so the two read as one
            system described at two zoom levels. */}
        <div className="mt-14">
          <span
            className="mb-5 block font-mono text-mrd-tiny uppercase text-zinc-400"
            style={{ letterSpacing: "0.12em" }}
          >
            In every run
          </span>
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {REPLAY_RECEIPTS.map((r, i) => (
              <div
                key={r.label}
                className={`border-t border-white/10 pt-3.5 transition-all duration-700 ${
                  inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: inView ? `${i * 70}ms` : "0ms" }}
              >
                <span
                  className="mb-1.5 block font-mono text-mrd-small uppercase text-zinc-300"
                  style={{ letterSpacing: "0.12em" }}
                >
                  {r.label}
                </span>
                <span className="block text-mrd-small leading-mrd-prose text-zinc-500">{r.gloss}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affordance, not claim: the replay narrates itself, so what follows
            it is a door, in the mono metadata voice. */}
        <p className="mt-12">
          <a
            href="/demo"
            // Read in the handler, not at render: this section is server rendered.
            onClick={() =>
              void trackLandingEvent({
                data: { event: "demo_click", sessionKey: getLandingSessionKey() },
              })
            }
            className="group inline-flex items-baseline gap-2 font-mono text-mrd-small uppercase text-zinc-500 hover:text-white transition-colors"
            style={{ letterSpacing: "0.12em" }}
          >
            Open the live demo
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </a>
        </p>
      </div>
    </section>
  );
}
