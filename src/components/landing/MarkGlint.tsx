import { useEffect, useState } from "react";
import { CadenceMark, CADENCE_MARK_PATH } from "@/components/cadence/CadenceMark";

/**
 * MarkGlint: the seven-petal CadenceMark with a slow specular light pass.
 * A short bright dash travels the exact epitrochoid stroke once every 12s:
 * a light moving over a still object, never a rotation of the logo (the brand
 * README forbids that). This is the hero's ONE personality touch. The ember
 * and gold core stays the mark's own, the page's single chromatic point here.
 * Reduced motion renders the still mark alone.
 */
export function MarkGlint({ size = 136 }: { size?: number }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <CadenceMark size={size} />

      {!reduced && (
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          style={{ overflow: "visible" }}
          aria-hidden
        >
          {/* The specular pass: a soft white light drifting the curve, slow
              enough to be felt rather than watched (founder 2026-07-15). */}
          <path
            id="mark-glint-path"
            d={CADENCE_MARK_PATH}
            pathLength={100}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="9 91"
            style={{
              animation: "markGlintTravel 28s linear infinite",
              filter: "drop-shadow(0 0 5px rgba(255,255,255,0.45))",
            }}
          />
          {/* A satellite tracing the orbit: movement around a still mark
              (the brand rule: the logo itself never rotates). */}
          <circle
            r="1.2"
            fill="rgba(255,255,255,0.8)"
            style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.6))" }}
          >
            <animateMotion dur="45s" repeatCount="indefinite" rotate="none">
              <mpath href="#mark-glint-path" />
            </animateMotion>
          </circle>
          <style>{`
            @keyframes markGlintTravel {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: -100; }
            }
          `}</style>
        </svg>
      )}
    </div>
  );
}
