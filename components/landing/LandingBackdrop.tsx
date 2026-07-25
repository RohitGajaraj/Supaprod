import { useEffect, useRef } from "react";

/**
 * The page's thematic canvas: celestial mechanics on drafting paper.
 * The mark is an epitrochoid (an orbit curve), so the page sits on the field
 * it was drawn in: a faint engineering grid plus a two-depth starfield that
 * counter-drifts against scroll (near layer faster than far, so the canvas
 * has depth). Structure and light give the depth; color never does
 * (ink-and-metal law). Fixed, pointer-events-none, transform-only, and still
 * under reduced motion.
 */

// Deterministic starfield: a fixed-seed LCG so the server render and the
// client hydration produce identical stars.
function seededStars(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: +(rand() * 100).toFixed(2),
    y: +(rand() * 100).toFixed(2),
    r: +(0.5 + rand() * 1.0).toFixed(2),
    o: +(0.08 + rand() * 0.28).toFixed(2),
    twinkle: i % 5 === 0,
    dur: +(6 + rand() * 6).toFixed(1),
  }));
}
const FAR_STARS = seededStars(36, 42);
const NEAR_STARS = seededStars(22, 7).map((s) => ({ ...s, r: +(s.r * 1.5).toFixed(2) }));

function StarLayer({
  stars,
  layerRef,
}: {
  stars: ReturnType<typeof seededStars>;
  layerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={layerRef} className="absolute inset-0" style={{ willChange: "transform" }}>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r / 10}
            fill="#ffffff"
            opacity={star.o}
            style={
              star.twinkle
                ? { animation: `starBreathe ${star.dur}s ease-in-out infinite` }
                : undefined
            }
          />
        ))}
      </svg>
    </div>
  );
}

export function LandingBackdrop() {
  const farRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  // Counter-scroll drift at two rates = depth. A passive listener writing
  // transforms straight to fixed, non-React layers: no state, no re-renders,
  // no layout reads in the hot path.
  useEffect(() => {
    const far = farRef.current;
    const near = nearRef.current;
    if (!far || !near) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        far.style.transform = `translateY(${(y * -0.04).toFixed(1)}px)`;
        near.style.transform = `translateY(${(y * -0.1).toFixed(1)}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      {/* The drafting grid: fine and coarse rules, strongest where the mark
          lives, dissolving toward the edges. */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 120% 92% at 50% 28%, black 0%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 120% 92% at 50% 28%, black 0%, transparent 82%)",
        }}
      >
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-fine" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="rgba(255,255,255,0.038)"
                strokeWidth="1"
              />
            </pattern>
            <pattern id="grid-coarse" width="240" height="240" patternUnits="userSpaceOnUse">
              <path
                d="M 240 0 L 0 0 0 240"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-fine)" />
          <rect width="100%" height="100%" fill="url(#grid-coarse)" />
        </svg>
      </div>

      {/* Two star depths: far drifts slowly, near noticeably, both silver. */}
      <StarLayer stars={FAR_STARS} layerRef={farRef} />
      <StarLayer stars={NEAR_STARS} layerRef={nearRef} />
      <style>{`
        @keyframes starBreathe {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.38; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes starBreathe { 0%, 100% { opacity: 0.2; } }
        }
      `}</style>
    </div>
  );
}
