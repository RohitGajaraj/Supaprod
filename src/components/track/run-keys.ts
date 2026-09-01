/**
 * THE RUN'S KEYBOARD LAYER -- two keys, no chords, nothing hidden behind them.
 *
 * Standard #4 is "everything reachable without a mouse", and on this surface
 * that means the two controls a person reaches for repeatedly while watching:
 * say something (the steer box), and make it move (run it now). `/` jumps to
 * the composer, `r` starts a walk. Both are plain letters because a chord is
 * one more thing to learn and this surface has exactly two verbs.
 *
 * THE GUARD IS THE WHOLE FEATURE. A shortcut that fires while somebody is
 * TYPING is a data-corruption bug wearing a convenience badge: `r` mid-sentence
 * in the steer box would start a walk instead of typing a letter. So every
 * event must clear all of these before it means anything:
 *
 *   the focus is not in any text-entry element (input, textarea, select,
 *     contenteditable -- the last one checked via isContentEditable, which
 *     covers rich-text hosts a tagName test misses)
 *   no modifier is held (a person using cmd+r to reload must get a reload)
 *   nothing else is trying to handle it
 */
export function shouldIgnoreKey(e: {
  target: unknown;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const el = e.target as { tagName?: string; isContentEditable?: boolean } | null | undefined;
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/** The action a bare key means on this surface, or null for everything else. */
export function keyAction(key: string): "steer" | "run" | null {
  if (key === "/") return "steer";
  if (key === "r") return "run";
  return null;
}
