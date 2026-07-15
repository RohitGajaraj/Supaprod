import { useEffect, useRef, useState } from "react";
import { CadenceMark } from "@/components/cadence/CadenceMark";

/**
 * The journey film (founder ruling 2026-07-15): the whole product story as a
 * self-playing, perfectly-looping sequence. A pulse travels one horizontal
 * track through eight stages: signals in, sensed, the call ranked, your gate,
 * build + tests, ship, the grade, and the brain writing it back. Code-built
 * theater (the plan's rule: a code-built mock beats a video), one rAF clock,
 * pauses off-screen, and reduced motion renders the finished frame.
 */

const STAGES = [
  {
    key: "signals",
    label: "signals",
    color: "#6cb0f5",
    caption: "Analytics, support, errors, repo, market moves: connected once, watched around the clock.",
  },
  {
    key: "sense",
    label: "sense",
    color: "#6cb0f5",
    caption: "Scout clusters the noise into one signal that warrants a decision.",
  },
  {
    key: "decide",
    label: "decide",
    color: "#6cb0f5",
    caption: "Cadence tells you what to build: the call arrives ranked, backed by your own precedent.",
  },
  {
    key: "gate",
    label: "your gate",
    color: "#FF6B2C",
    caption: "Your call. Approve in seconds, or overrule it. Nothing moves without you.",
  },
  {
    key: "build",
    label: "build",
    color: "#d9a13c",
    caption: "Architect writes the spec. Builder ships the commits. CI keeps them honest.",
  },
  {
    key: "ship",
    label: "ship",
    color: "#4ac26b",
    caption: "Merged behind your merge gate and deployed to production.",
  },
  {
    key: "grade",
    label: "grade",
    color: "#4ac26b",
    caption: "Fourteen days later, the outcome is graded against the call that caused it.",
  },
  {
    key: "remember",
    label: "remember",
    color: "#E8B44C",
    caption: "The brain writes it back. You made two calls; the system got sharper. That compounds.",
  },
] as const;

const STAGE_MS = 2100;
const HOLD_MS = 1600;
const CYCLE_MS = STAGES.length * STAGE_MS + HOLD_MS;

export function JourneyFilm() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 across the track

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // One clock drives the pulse, the stage lights, and the caption.
  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setProgress(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) % CYCLE_MS;
      const travel = Math.min(t / (STAGES.length * STAGE_MS), 1);
      setProgress(travel);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced]);

  const stageIdx = reduced
    ? STAGES.length - 1
    : Math.min(Math.floor(progress * STAGES.length), STAGES.length - 1);
  const stage = STAGES[stageIdx];

  return (
    <section ref={sectionRef} className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
            the whole journey, one loop
          </p>
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 border border-white/10 rounded px-1.5 py-0.5">
            replay
          </span>
        </div>

        <div className="border border-white/[0.07] bg-[#0d0d0e] rounded-xl px-6 py-8 md:px-10">
          {/* The track: scrolls horizontally on small screens */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="relative min-w-[760px]">
              {/* Base line + progress line */}
              <div className="absolute left-0 right-0 top-[9px] h-px bg-white/[0.08]" aria-hidden />
              <div
                className="absolute left-0 top-[9px] h-px bg-white/35"
                style={{ width: `${progress * 100}%`, transition: reduced ? undefined : "none" }}
                aria-hidden
              />
              {/* The pulse */}
              {!reduced && (
                <div
                  className="absolute top-[6px] w-[7px] h-[7px] rounded-full bg-white"
                  style={{
                    left: `calc(${progress * 100}% - 3px)`,
                    boxShadow: "0 0 8px rgba(255,255,255,0.7)",
                  }}
                  aria-hidden
                />
              )}
              {/* Stage nodes */}
              <div className="relative flex justify-between">
                {STAGES.map((s, i) => {
                  const reached = reduced || progress * STAGES.length >= i + 0.5;
                  const isActive = !reduced && stageIdx === i;
                  const isBrain = s.key === "remember";
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-2.5 w-[88px]">
                      {isBrain ? (
                        <span
                          className="-mt-[7px] transition-opacity duration-300"
                          style={{ opacity: reached ? 1 : 0.35 }}
                        >
                          <CadenceMark size={32} glow={reached} />
                        </span>
                      ) : (
                        <span
                          className="w-[19px] h-[19px] rounded-full border transition-all duration-300 flex items-center justify-center"
                          style={{
                            borderColor: reached ? s.color : "rgba(255,255,255,0.14)",
                            background: reached ? `${s.color}1f` : "transparent",
                          }}
                        >
                          <span
                            className="w-[7px] h-[7px] rounded-full transition-all duration-300"
                            style={{
                              background: reached ? s.color : "rgba(255,255,255,0.12)",
                              transform: isActive ? "scale(1.35)" : "scale(1)",
                            }}
                          />
                        </span>
                      )}
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest transition-colors duration-300 whitespace-nowrap"
                        style={{
                          color: isActive ? s.color : reached ? "#a1a1aa" : "#565c66",
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* The caption: one sentence per stage, crossfading on the clock */}
          <div className="mt-7 min-h-[52px] md:min-h-[44px]">
            <p
              key={stage.key}
              className="text-sm md:text-base leading-relaxed"
              style={{
                color: stage.key === "gate" ? "#e4e4e7" : "#a1a1aa",
                animation: reduced ? undefined : "journeyCaption 0.45s ease both",
                maxWidth: "62ch",
              }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest mr-3"
                style={{ color: stage.color }}
              >
                {stage.label}
              </span>
              {stage.caption}
            </p>
          </div>
        </div>

        <style>{`
          @keyframes journeyCaption {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </section>
  );
}
