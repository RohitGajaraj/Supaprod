import { useEffect, useRef, useState } from "react";
import { SUPAPROD_MARK_PATH } from "@/components/supaprod/SupaprodMark";
import { trackLandingEvent } from "@/lib/landing.functions";
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
 * own spotlit section (ThreeLayers.tsx) immediately above this one. This
 * section is now single-purpose again: the loop, running.
 */
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
            the loop read poppy and oversized: the spine went 10px -> 13px,
            the timestamps 9px -> 13px, the chips 8px -> 13px. The replay
            component is founder-frozen (the 3D card motion stays exactly as
            it is), so the scale is restored from out here instead: 11px for
            the mono metadata voice, which is the same metadata scale the rest
            of this page uses, and 12px for sentences. */}
        <style>{`
          .loop-replay-scale { font-size: 11px; }
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
              className={`pb-3 text-[13px] font-medium transition-colors duration-200 border-b-2 -mb-px ${
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

        {/* Affordance, not claim: the replay narrates itself, so what follows
            it is a door, in the mono metadata voice. */}
        <p className="mt-12">
          <a
            href="/demo"
            onClick={() => void trackLandingEvent({ data: { event: "demo_click" } })}
            className="group inline-flex items-baseline gap-2 font-mono text-[12px] uppercase text-zinc-500 hover:text-white transition-colors"
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
