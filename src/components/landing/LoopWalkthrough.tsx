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
 * the mono spec column naming the three layers, then the artifact. The layer
 * column replaced the old floating echo list, which only rendered at xl and
 * so hid the page's one definition of the product from most readers.
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

  // The three layers. Number and name in mono (the machine voice, and the
  // numbering is what makes them repeatable); the sentence in Sans (the human
  // voice). "Operating system" carries its plain gloss in the same breath.
  const layers = [
    {
      n: "01",
      name: "the director",
      line: "It tells you what to build. Your product taste becomes a system.",
    },
    {
      n: "02",
      name: "the operating system",
      line: "It builds and ships it, behind your gate.",
    },
    {
      n: "03",
      name: "the company brain",
      line: "It remembers whether you were right, and guides the next call.",
    },
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
          deliberately tiny). Sits low enough to clear the replay mocks: the
          offset moved 580 -> 720 when the layer column took the sub
          paragraph's place, so the curve keeps the same clearance. */}
      <svg
        className="absolute pointer-events-none hidden lg:block"
        style={{ right: -240, top: 720, width: 740, height: 740, overflow: "visible" }}
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
          className={`text-4xl md:text-5xl lg:text-[52px] lg:whitespace-nowrap font-semibold mb-10 text-white transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ letterSpacing: "-0.02em" }}
        >
          Signal to shipped. Watch it happen.
        </h2>

        {/* The mono spec column: three layers, named and glossed, at every
            breakpoint. This is the page's one definition of the product. */}
        <div className="mb-12">
          <span
            className={`block font-mono text-[11px] uppercase text-zinc-600 mb-5 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ letterSpacing: "0.12em", transitionDelay: inView ? "100ms" : "0ms" }}
          >
            one system, three layers
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-7">
            {layers.map((l, i) => (
              <div
                key={l.n}
                className={`border-t border-white/10 pt-4 transition-all duration-700 ${
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: inView ? `${160 + i * 90}ms` : "0ms" }}
              >
                <div className="flex items-baseline gap-2.5 mb-2.5">
                  <span
                    className="font-mono text-[12px] text-zinc-600"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {l.n}
                  </span>
                  <span
                    className="cap-item font-mono text-[12px] uppercase text-zinc-300"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    {l.name}
                  </span>
                </div>
                <p className="text-[15px] text-zinc-500 leading-relaxed">{l.line}</p>
              </div>
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
