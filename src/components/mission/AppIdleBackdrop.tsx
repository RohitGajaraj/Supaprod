// AppIdleBackdrop (front-end reimagining, Phase 3): the approved scoped
// app-idle starfield (design-language-spec section 3; founder decision
// 2026-07-19 night, GATE-1B "STARFIELD DECIDED").
//
// This is a SEPARATE component from the public LandingBackdrop on purpose:
// the reimagining branch must never risk a regression on any public
// landing/marketing page, so the app preset lives here rather than as a
// variant of the shared public component.
//
// The preset, exactly as the founder approved on real frames
// (mockups/starfield-variant.html, Frame 2):
//   - 18 far-layer stars only (the landing runs 36 far + 22 near).
//   - opacity capped at 0.24 (landing tops out near 0.36).
//   - star radius capped small so the largest never reads as decoration.
//   - four stars breathe; one slow 120s transform drift; everything stops
//     under prefers-reduced-motion (CSS-only, no JS, no scroll listener).
//   - far layer only, no near parallax, no engineering grid.
//
// Scope (LOCKED, do not widen): workspace/product empty states, onboarding
// and guided-tour frames, and the Brain at idle. NEVER on a working surface,
// and removed entirely (not dimmed) the moment the surface holds content.
// It fills its positioned parent (absolute inset-0), so the caller controls
// where it is allowed to exist by only mounting it on those surfaces.

// Deterministic seed (same LCG shape the landing uses) so SSR and hydration
// paint identical stars.
function seededStars(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: +(rand() * 100).toFixed(2),
    y: +(rand() * 100).toFixed(2),
    // Radius capped small: the app preset never grows a star into decoration.
    r: +(0.5 + rand() * 0.5).toFixed(2),
    // Opacity capped at 0.24 (the approved ceiling).
    o: +(0.06 + rand() * 0.18).toFixed(2),
    // Only every ~fifth star breathes: four of eighteen.
    twinkle: i % 5 === 0,
    dur: +(7 + rand() * 5).toFixed(1),
  }));
}

const APP_IDLE_STARS = seededStars(18, 42);

export function AppIdleBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
      data-testid="app-idle-backdrop"
    >
      <div className="app-idle-drift absolute inset-0">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          {APP_IDLE_STARS.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.r / 10}
              fill="#ffffff"
              opacity={star.o}
              style={
                star.twinkle
                  ? { animation: `appIdleBreathe ${star.dur}s ease-in-out infinite` }
                  : undefined
              }
            />
          ))}
        </svg>
      </div>
      <style>{`
        @keyframes appIdleBreathe {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.24; }
        }
        .app-idle-drift {
          animation: appIdleDrift 120s ease-in-out infinite alternate;
          will-change: transform;
        }
        @keyframes appIdleDrift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(0, -6px, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .app-idle-drift { animation: none; }
          @keyframes appIdleBreathe { 0%, 100% { opacity: 0.16; } }
        }
      `}</style>
    </div>
  );
}
