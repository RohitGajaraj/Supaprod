import { useEffect, useRef, useState } from "react";
import { CADENCE_MARK_PATH } from "@/components/cadence/CadenceMark";
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

  // The orbit scrub: stroke-dashoffset follows section scroll progress.
  // Direct style writes on a non-React node; still under reduced motion.
  useEffect(() => {
    const path = orbitRef.current;
    const section = sectionRef.current;
    if (!path || !section) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      return;
    }
    let raf = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Completes by ~70% of the way through the section, so the reader always
      // sees the whole orbit finish drawing before they leave the beat.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height * 0.7)));
      path.style.strokeDashoffset = (100 - progress * 100).toFixed(1);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="loop"
      ref={sectionRef}
      className="relative overflow-hidden py-32 px-4 scroll-mt-16"
    >
      {/* The orbit, drawn by scroll: silver line, bleeding off the right edge */}
      <svg
        className="absolute pointer-events-none hidden lg:block"
        style={{ right: -200, top: 20, width: 740, height: 740, overflow: "visible" }}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden
      >
        <path
          ref={orbitRef}
          d={CADENCE_MARK_PATH}
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset="100"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end mb-12">
          <div>
            <h2
              className={`text-4xl md:text-6xl font-semibold mb-4 text-white transition-all duration-700 ${
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
              One real mission, step by step: signals collected through the morning, flagged at
              09:13, in production by 09:31. The last tab is the part nobody else shows you.
            </p>
          </div>
          <div
            className={`hidden md:flex flex-col gap-2 pb-1 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: inView ? "200ms" : "0ms" }}
          >
            <span className="font-mono text-[11px] text-zinc-600 mb-1">In the loop</span>
            {["named agents", "human gates", "precedent memory", "outcome grading"].map((f) => (
              <span
                key={f}
                className="font-mono text-[12px] uppercase text-zinc-400"
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

        <p className="text-zinc-500 mt-14 text-sm leading-relaxed">
          One system, the whole lifecycle: from the first signal to the graded outcome. And proof
          over promises: the demo is our real workspace, read-only, no signup.{" "}
          <a
            href="/demo"
            onClick={() => void trackLandingEvent({ data: { event: "demo_click" } })}
            className="text-zinc-200 underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-300 transition-colors"
          >
            Open the live demo
          </a>
        </p>
      </div>
    </section>
  );
}
