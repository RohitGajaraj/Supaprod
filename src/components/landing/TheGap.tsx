import { useEffect, useRef, useState } from "react";

const TYPED_WORD = "Devs";

/**
 * Beat 2 - The gap. The page's single sanctioned typography-only moment
 * (plan section 4.4): three lines, zero boxes, scale doing the design work.
 * Only the word "Devs" types itself behind the terminal prompt (founder
 * 2026-07-15); everything else reveals like every other beat. The product
 * line gets no prompt on purpose: product has no terminal yet. SSR ships the
 * full text; reduced motion skips the typing.
 */
export function TheGap() {
  const [inView, setInView] = useState(false);
  const [typed, setTyped] = useState(TYPED_WORD);
  const [typing, setTyping] = useState(false);
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

  // Type just the one word, terminal-style, once the beat is looked at.
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setTyped("");
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(TYPED_WORD.slice(0, i));
      if (i >= TYPED_WORD.length) {
        clearInterval(interval);
        // The cursor blinks a beat, then leaves.
        setTimeout(() => setTyping(false), 1100);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section ref={sectionRef} className="py-40 px-4">
      <div className="max-w-5xl mx-auto">
        <h2
          className={`text-3xl md:text-5xl lg:text-[52px] font-semibold text-white mb-10 leading-[1.16] transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ letterSpacing: "-0.025em" }}
        >
          <span className="block whitespace-nowrap">
            <span className="font-mono text-zinc-500 mr-3" aria-hidden>
              &gt;
            </span>
            {/* The invisible copy holds the width; the typed overlay fills it,
                so the rest of the line never shifts. */}
            <span className="relative inline-block" aria-label={TYPED_WORD}>
              <span className="invisible" aria-hidden>
                {TYPED_WORD}
              </span>
              <span className="absolute left-0 top-0" aria-hidden>
                {typed}
                {typing && <span className="animate-pulse text-zinc-400">▍</span>}
              </span>
            </span>{" "}
            got agents that ship real code.
          </span>
          {/* No prompt glyph here on purpose: product has no terminal yet. */}
          <span className="block">
            <span
              style={{
                fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                fontWeight: 400,
                letterSpacing: "0",
                color: "#FF6B2C",
              }}
            >
              Product
            </span>{" "}
            is still waiting for its own.
          </span>
        </h2>

        <p
          className={`text-xl md:text-2xl text-zinc-400 mb-10 leading-snug transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "120ms" : "0ms", maxWidth: "58ch" }}
        >
          Shipping got cheap. Deciding what to ship is the bottleneck now, and the reasoning
          behind every call evaporates into threads, notes, and memory.
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
