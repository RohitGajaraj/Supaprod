import { useEffect, useRef, useState } from "react";

const TYPED_WORD = "Devs";

/**
 * Named complimentarily, as the AI-native home of that craft (founder ruling
 * 2026-07-25). No superiority claim, no partnership implied, nothing untrue.
 * Decisions is the one row with an empty cell: it reads as an absence.
 */
const CRAFT_HOMES: { craft: string; tools: string | null; status: string }[] = [
  { craft: "Code", tools: "Claude Code, Cursor, Devin", status: "agent-run" },
  { craft: "Design", tools: "Figma, v0, Lovable", status: "agent-run" },
  { craft: "Docs", tools: "Notion AI, Gemini", status: "agent-run" },
  { craft: "Work", tools: "Linear, Jira", status: "system of record" },
  { craft: "Decisions", tools: null, status: "no home" },
];

/**
 * Beat 2 - The gap. The page's single sanctioned typography-only moment
 * (plan section 4.4): three lines, zero boxes, scale doing the design work.
 * Only the word "Devs" types itself behind the terminal prompt (founder
 * 2026-07-15); everything else reveals like every other beat. The product
 * line gets no prompt on purpose: product has no terminal yet. SSR ships the
 * full text; reduced motion skips the typing.
 *
 * Body rewritten 2026-07-25 (landing audit): the one abstract 20-word
 * problem sentence is replaced by evidence a stranger can picture. The homes
 * ledger names each craft's AI-native tool and leaves exactly one cell empty;
 * then a real thread and a real number. The trailing "here is what it looks
 * like instead" line is gone, the next section's h2 already says it.
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

  // Type just the one word, terminal-style, on a continuous loop (founder
  // 2026-07-15): type, one blink, rest, erase, retype. The chain schedules
  // one timeout at a time, so clearing the latest cancels the whole loop.
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const at = (ms: number, fn: () => void) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };
    const typeStep = (i: number) => {
      setTyped(TYPED_WORD.slice(0, i));
      if (i < TYPED_WORD.length) {
        at(120, () => typeStep(i + 1));
      } else {
        // One quick blink, then the cursor leaves and the word rests.
        at(550, () => {
          setTyping(false);
          at(2200, () => {
            setTyping(true);
            eraseStep(TYPED_WORD.length - 1);
          });
        });
      }
    };
    const eraseStep = (i: number) => {
      setTyped(TYPED_WORD.slice(0, i));
      if (i > 0) at(70, () => eraseStep(i - 1));
      else at(350, () => typeStep(1));
    };
    setTyped("");
    setTyping(true);
    at(200, () => typeStep(1));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inView]);

  return (
    <section ref={sectionRef} className="py-32 px-4">
      {/* Opacity only, so nothing paints a new layer or animates a shadow.
          Reduced motion resolves the caret to its visible frame. */}
      <style>{`
        @keyframes gapBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.16; } }
        .gap-caret { animation: gapBlink 1.15s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gap-caret { animation: none; opacity: 1; }
        }
      `}</style>
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
                {/* Thin caret bar, not the block glyph: it fits inside the
                    word space so it never overlaps the next word. */}
                {typing && (
                  <span
                    className="animate-pulse"
                    style={{
                      display: "inline-block",
                      width: "0.07em",
                      height: "0.72em",
                      marginLeft: "0.05em",
                      background: "#a1a1aa",
                      verticalAlign: "-0.02em",
                    }}
                  />
                )}
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
          className={`font-mono text-[11px] md:text-[12px] uppercase text-zinc-500 mb-6 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "120ms" : "0ms", letterSpacing: "0.14em" }}
        >
          Every craft got its AI-native home
        </p>

        {/* The ledger of homes. Every tool here is named as the home of its
            craft, which is what it is. One row has an empty cell, and that
            absence is the whole argument. */}
        <div
          className={`mb-14 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "200ms" : "0ms" }}
        >
          {CRAFT_HOMES.map((row) => {
            const missing = row.tools === null;
            return (
              <div
                key={row.craft}
                className="flex flex-wrap items-baseline gap-x-5 gap-y-1 py-3.5 border-b border-white/[0.06]"
              >
                <span
                  className="w-[92px] shrink-0 font-mono text-[12px] uppercase"
                  style={{ letterSpacing: "0.12em", color: missing ? "#FF6B2C" : "#71717a" }}
                >
                  {row.craft}
                </span>
                <span className="flex-1 min-w-[180px] text-base md:text-lg text-zinc-300">
                  {missing ? (
                    <span className="gap-caret inline-block align-[-0.02em] h-[0.9em] w-[0.07em] bg-[#FF6B2C]" />
                  ) : (
                    row.tools
                  )}
                </span>
                <span
                  className="ml-auto font-mono text-[11px] uppercase"
                  style={{ letterSpacing: "0.12em", color: missing ? "#FF6B2C" : "#52525b" }}
                >
                  {row.status}
                </span>
              </div>
            );
          })}
        </div>

        <blockquote
          className={`border-l border-white/15 pl-5 md:pl-6 mb-12 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "300ms" : "0ms", maxWidth: "54ch" }}
        >
          <p className="text-lg md:text-2xl text-zinc-300 leading-snug">
            &ldquo;So why did we decide on X? Cue hours of finding that Slack conversation from
            months ago.&rdquo;
          </p>
          <cite
            className="not-italic block mt-3 font-mono text-[11px] uppercase text-zinc-600"
            style={{ letterSpacing: "0.12em" }}
          >
            Top-voted thread, r/ProductManagement, 480 points
          </cite>
        </blockquote>

        <p
          className={`text-lg md:text-xl text-zinc-400 leading-snug transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "380ms" : "0ms", maxWidth: "56ch" }}
        >
          Nobody knows what to build, so teams build on gut.{" "}
          <span className="text-zinc-200">
            <span style={{ color: "#6cb0f5" }}>80%</span> of shipped features are rarely or never
            used.
          </span>
        </p>
        <p
          className={`mt-3 font-mono text-[11px] uppercase text-zinc-600 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: inView ? "440ms" : "0ms", letterSpacing: "0.12em" }}
        >
          Pendo, across 615 products
        </p>
      </div>
    </section>
  );
}
