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
          deliberately tiny). Sits low enough to clear the replay mocks. */}
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
        <div className="relative mb-12">
          <h2
            className={`text-4xl md:text-5xl lg:text-[52px] lg:whitespace-nowrap font-semibold mb-4 text-white transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ letterSpacing: "-0.02em" }}
          >
            Signal to shipped. Watch it happen.
          </h2>
          <p
            className={`text-lg text-zinc-500 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: inView ? "100ms" : "0ms" }}
          >
            One system, the whole lifecycle: from the first signal to the graded outcome.
          </p>
          {/* The echo list floats past the container's right edge on purpose:
              a deliberate alignment break (founder 2026-07-15), sitting
              directly on the starfield with no scrim so it blends in. */}
          <div
            className={`hidden xl:flex flex-col gap-2.5 absolute -top-2 -right-24 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: inView ? "200ms" : "0ms" }}
          >
            <span className="font-mono text-[11px] text-zinc-600 mb-1.5">In the loop</span>
            {["named agents", "human gates", "precedent memory", "outcome grading"].map((f) => (
              <span
                key={f}
                className="cap-item font-mono text-[12px] uppercase text-zinc-400"
                style={{ letterSpacing: "0.12em" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Reader-paced tabs: clicked, never cycled on a timer */}
        <div className="flex gap-6 mb-10 border-b border-white/10" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-white border-white"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <LoopReplay tab={activeTab} />

        <div className="text-zinc-500 mt-14 text-sm leading-relaxed">
          <p>
            One real mission, step by step, replayed exactly as it ran. The last tab is the part
            nobody else shows you.
          </p>
          <p className="mt-1.5">
            And proof over promises: the demo is our real workspace, read-only, no signup.{" "}
            <a
              href="/demo"
              onClick={() => void trackLandingEvent({ data: { event: "demo_click" } })}
              className="text-zinc-200 underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-300 transition-colors"
            >
              Open the live demo
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
