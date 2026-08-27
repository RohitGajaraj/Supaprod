/**
 * The agent's identity, wherever an agent is called out.
 *
 * PORTED 2026-07-29. This file used to DRAW the mark: a liquid-glass tile with a
 * per-agent hue gradient, an inset catch-light, an outer glow and a border mixed
 * from the same hue. That is four decorations on a 22px square, and it is the
 * reason an agent looked like one thing on Today and another thing on Crew.
 *
 * It draws nothing now. It re-exports Meridian's mark (`meridian/marks` owns
 * the one mark in the system), so the surfaces that still import from here
 * inherit the ported mark without being edited by this lane.
 *
 * What the primitive changed, and why each one is a fix rather than a loss:
 *   · The hue is the agent's STAGE, not the agent, so a colour means something
 *     even for an agent you have not met, and thirteen hues stop competing.
 *   · State is never a hue. A ring means running, low opacity means quiet,
 *     ember means it needs you, red means it failed.
 *   · No tile, no gradient, no glow, no border. The glyph stands on its own.
 *   · It is a real `role="img"` with a label, where this one was `aria-hidden`,
 *     so an agent's name is now readable by a screen reader.
 *
 * ONE PROP IS ACCEPTED AND IGNORED, deliberately, so no consumer breaks:
 *   · `size` was a pixel number. The primitive has two sizes, because a mark at
 *     16, 22 and 26 across three surfaces is three sizes nobody chose. Anything
 *     24 or over reads as the large mark; everything else is the small one.
 *
 * IT WAS TWO UNTIL 2026-08-27. `pixelName` belonged to `AgentBadge`, which was
 * deleted that day after two months with no importer, and the two imports that
 * served it went with it. A header describing props that no longer exist is the
 * same defect as code nothing calls: it costs the next reader a search to find
 * out it is not true.
 */

import { AgentMark as Mark, type MarkState } from "@/components/meridian/marks";

/** A pixel size from a legacy call site, mapped onto the two sizes the system
 *  actually has. The threshold is the primitive's own: 24 is where the large
 *  mark starts being the honest answer. */
function sizeFor(px: number): "sm" | "lg" {
  return px >= 24 ? "lg" : "sm";
}

/** The agent's glyph, in its stage's hue. */
export function AgentMark({
  slug,
  size = 22,
  state = "idle",
  name,
}: {
  slug: string | null | undefined;
  size?: number;
  /** Absent means idle. Pass `running` while a run is genuinely live. */
  state?: MarkState;
  /** Fallback display name when the catalog does not know the slug. */
  name?: string | null;
}) {
  return <Mark slug={slug} name={name} size={sizeFor(size)} state={state} />;
}
