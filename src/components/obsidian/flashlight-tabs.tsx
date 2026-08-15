// FlashlightTabs: the Rauno flashlight-tabs pattern (rauno.me/craft/flashlight-tabs),
// the STANDARD tab bar across Supaprod (DESIGN-LOOM Interaction-Feel Law).
// A soft ember "flashlight" glow tracks the pointer across the row, and a
// sliding ember indicator marks the active tab. UI voice (never mono-caps),
// fires a light interaction-feedback tick on select. Reduced motion is handled
// by the global CSS (transform/opacity transitions only).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { fireFeedback } from "@/lib/interaction-feedback";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type FlashlightTab = { id: string; label: ReactNode; badge?: number };

type Rect = { left: number; width: number };

export function FlashlightTabs({
  tabs,
  active,
  onSelect,
  ariaLabel,
  size = "md",
  spotlight = false,
}: {
  tabs: FlashlightTab[];
  active: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  /** Opt-in ember "flashlight" glow that tracks the pointer. Off by default:
   *  the clean raised-pill + ember indicator is the premium everyday look;
   *  the spotlight is a showcase treatment reserved for a hero surface so it
   *  does not dilute the scarce ember accent (founder ruling 2026-07-06). */
  spotlight?: boolean;
}) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [glow, setGlow] = useState<{ left: number; width: number; on: boolean }>({
    left: 0,
    width: 0,
    on: false,
  });
  const [activeRect, setActiveRect] = useState<Rect>({ left: 0, width: 0 });

  const rectOf = (el: HTMLButtonElement): Rect => {
    return { left: el.offsetLeft, width: el.offsetWidth };
  };

  // Keep the active pill + indicator glued to the active tab (on mount, active
  // change, tab-set change, and resize).
  useIsoLayoutEffect(() => {
    const el = btnRefs.current.get(active);
    if (el) setActiveRect(rectOf(el));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tabs.map((t) => t.id).join("|")]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const ro = new ResizeObserver(() => {
      const el = btnRefs.current.get(active);
      if (el) setActiveRect(rectOf(el));
    });
    ro.observe(bar);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const fontSize = size === "sm" ? 12.5 : 13.5;
  const padY = size === "sm" ? 6 : 8;

  // Roving tabindex (ARIA tabs pattern): the active tab is the one tab stop;
  // Left/Right/Home/End move focus along the row, Enter/Space (native button
  // activation) selects. Manual activation keeps lazy panels from loading on
  // every arrow press.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const ids = tabs.map((t) => t.id);
    if (ids.length === 0) return;
    const focused = ids.findIndex((id) => btnRefs.current.get(id) === document.activeElement);
    const from = focused >= 0 ? focused : Math.max(ids.indexOf(active), 0);
    let next = from;
    if (e.key === "ArrowLeft") next = (from - 1 + ids.length) % ids.length;
    else if (e.key === "ArrowRight") next = (from + 1) % ids.length;
    else if (e.key === "Home") next = 0;
    else next = ids.length - 1;
    const nextId = ids[next];
    if (nextId) btnRefs.current.get(nextId)?.focus();
  };

  return (
    <div
      ref={barRef}
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap"
      onKeyDown={onKeyDown}
      onMouseLeave={() => setGlow((g) => ({ ...g, on: false }))}
      style={{
        position: "relative",
        gap: 2,
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      {/* The raised active pill: the selected tab always reads as selected,
          even without hover (the earlier tab design, kept). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 3,
          bottom: 4,
          left: activeRect.left,
          width: activeRect.width,
          borderRadius: "var(--radius-control)",
          background: "var(--surface-raised)",
          boxShadow: "inset 0 0 0 1px var(--hairline)",
          transform: "translateZ(0)",
          transitionProperty: "left, width",
          transitionDuration: "260ms",
          transitionTimingFunction: "var(--ease-in-out)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Hover highlight that slides to the hovered tab. Default: a quiet
          neutral pill (the premium, restraint-honoring look). Opt-in
          `spotlight`: a bright ember flashlight glow, reserved for hero use. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 3,
          bottom: 4,
          left: glow.left,
          width: glow.width,
          borderRadius: "var(--radius-control)",
          background: spotlight
            ? "radial-gradient(130% 150% at 50% 45%, color-mix(in srgb, var(--ember) 34%, transparent), color-mix(in srgb, var(--ember) 10%, transparent) 60%, transparent 78%)"
            : "var(--hover)",
          boxShadow: spotlight
            ? glow.on
              ? "0 0 22px color-mix(in srgb, var(--ember) 45%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--ember) 32%, transparent)"
              : "none"
            : "none",
          opacity: glow.on && glow.left !== activeRect.left ? 1 : 0,
          transform: "translateZ(0)",
          transitionProperty: "left, width, opacity",
          transitionDuration: "200ms",
          transitionTimingFunction: "var(--ease)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              if (el) btnRefs.current.set(t.id, el);
              else btnRefs.current.delete(t.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              setGlow({ left: el.offsetLeft, width: el.offsetWidth, on: true });
            }}
            onFocus={(e) => {
              const el = e.currentTarget;
              setGlow({ left: el.offsetLeft, width: el.offsetWidth, on: true });
            }}
            onClick={() => {
              if (t.id !== active) {
                fireFeedback("select");
                onSelect(t.id);
              }
            }}
            style={{
              position: "relative",
              zIndex: 1,
              fontFamily: "var(--font-sans)",
              fontSize,
              fontWeight: isActive ? 600 : 500,
              padding: `${padY}px 14px`,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
              transitionProperty: "color",
              transitionDuration: "160ms",
              transitionTimingFunction: "var(--ease)",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
            {t.badge != null && t.badge > 0 ? (
              <span
                className="tabular-nums"
                style={{
                  marginLeft: 6,
                  fontFamily: "var(--font-mono)",
                  color: isActive ? "var(--ember-text)" : "var(--text-faint)",
                }}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        );
      })}
      {/* The sliding active indicator, in the accent. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -1,
          left: activeRect.left,
          width: activeRect.width,
          height: 2,
          background: "var(--ember)",
          borderRadius: 2,
          boxShadow: "0 0 8px color-mix(in srgb, var(--ember) 60%, transparent)",
          transform: "translateZ(0)",
          transitionProperty: "left, width",
          transitionDuration: "260ms",
          transitionTimingFunction: "var(--ease-in-out)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
}
