import { useEffect, useRef, useState } from "react";

/**
 * Beat 2 - The gap. The page's single sanctioned typography-only moment
 * (plan section 4.4): three lines, zero boxes, scale doing the design work.
 * Positioning law (founder 2026-07-15): the site never says the assistant-era
 * words; the gap is that product work has no agent of its own yet.
 */
export function TheGap() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-40 px-4">
      <div className="max-w-5xl mx-auto">
        <h2
          className={`text-4xl md:text-6xl font-semibold text-white mb-10 leading-[1.1] transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ letterSpacing: "-0.025em" }}
        >
          Developers got agents that ship real code.
          <br />
          Product is still waiting for its own.
        </h2>

        <p
          className={`text-xl md:text-2xl text-zinc-400 mb-10 leading-snug transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "120ms" : "0ms", maxWidth: "48ch" }}
        >
          Shipping got cheap. Deciding what to ship is the bottleneck now, and the reasoning
          behind every call still evaporates into chat threads, meeting notes, and someone&apos;s
          memory.
        </p>

        <p
          className={`text-base text-zinc-500 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "240ms" : "0ms" }}
        >
          Here is what it looks like when the whole loop runs instead.
        </p>
      </div>
    </section>
  );
}
