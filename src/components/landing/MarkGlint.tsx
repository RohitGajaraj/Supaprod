import { useEffect, useState } from "react";
import { SupaprodMark, SUPAPROD_MARK_PATH } from "@/components/supaprod/SupaprodMark";

/**
 * MarkGlint: the seven-petal SupaprodMark revolving very slowly around its
 * ember core (founder ruling 2026-07-15: the petals turn, barely), with a
 * soft white light pass traveling the epitrochoid stroke and a satellite
 * tracing the orbit. This is the hero's ONE personality touch. Reduced
 * motion renders the still mark alone.
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
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        animation: reduced ? undefined : "markSlowRevolve 150s linear infinite",
        willChange: reduced ? undefined : "transform",
      }}
    >
      <style>{`
        @keyframes markSlowRevolve {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <SupaprodMark size={size} />

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
            d={SUPAPROD_MARK_PATH}
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
