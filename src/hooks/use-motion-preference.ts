import { useCallback, useEffect, useState } from "react";

/**
 * THE IN-PRODUCT MOTION TOGGLE, WHICH THE WHOLE PRODUCT ALREADY OBEYED AND
 * NOBODY COULD SET.
 *
 * `html[data-motion="off"]` gates motion in eight places across styles.cssard
 * ink.css -- the live pulse, the shimmer, the sketch draw, the lift press --
 * and `usePrefersReducedMotion` in graph-visual.ts reads it live, watching the
 * attribute with a MutationObserver so a change takes effect without a reload.
 * Several comments call it "the in-product data-motion toggle".
 *
 * NOTHING IN src/ EVER WROTE IT. The only non-CSS reference was the observer's
 * own `attributeFilter`. So the CSS was written, the hook was written, the
 * watcher was written, and the switch was not -- which means a person who wants
 * motion stopped has exactly one route: change an operating-system preference.
 * That is not a setting this product is entitled to make somebody leave to
 * find, and R-19 says accessibility is not deferred.
 *
 * ── IT NEVER OVERRIDES THE OS THE OTHER WAY ──────────────────────────────
 *
 * `computeReducedMotion(mq.matches, dataset.motion)` is `mq.matches ||
 * dataset === "off"`, so the OS preference always wins toward LESS motion and
 * this toggle can only agree with it. "On" here means "do not add a second
 * reason to stop", never "ignore what the system asked for". That asymmetry is
 * the reason this is safe to ship as a plain preference.
 *
 * Client-side and per-device, exactly like `use-density`: motion tolerance
 * belongs to the screen somebody is looking at, not to their account. Same
 * storage shape, same apply-on-mount, same no-server-call.
 */

export type MotionPreference = "on" | "off";

const STORAGE_KEY = "mrd-motion";

/** The same root `use-density` writes to, for the same reason: it is the
 *  element every one of those CSS rules is anchored on. */
function applyMotion(value: MotionPreference) {
  const root = document.documentElement;
  if (value === "off") root.setAttribute("data-motion", "off");
  else root.removeAttribute("data-motion");
}

export function useMotionPreference(): [MotionPreference, (next: MotionPreference) => void] {
  const [motion, setMotion] = useState<MotionPreference>("on");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: MotionPreference = stored === "off" ? "off" : "on";
    setMotion(initial);
    applyMotion(initial);
  }, []);

  const setAndPersist = useCallback((next: MotionPreference) => {
    setMotion(next);
    applyMotion(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return [motion, setAndPersist];
}
