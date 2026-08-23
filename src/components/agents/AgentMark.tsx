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
 * TWO PROPS ARE ACCEPTED AND IGNORED, deliberately, so no consumer breaks:
 *   · `size` was a pixel number. The primitive has two sizes, because a mark at
 *     16, 22 and 26 across three surfaces is three sizes nobody chose. Anything
 *     24 or over reads as the large mark; everything else is the small one.
 *   · `pixelName` rendered the name in Geist Pixel. Pixel is retired (founder
 *     ruling 2026-07-29), so it is accepted and does nothing.
 */

import { agentDisplayName, agentRelayVerb } from "@/lib/agent-vocabulary";
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

/** The called-out treatment: the mark, the name, and optionally what it is
 *  doing right now. The name is quiet by default; nothing here tints plain text,
 *  because the mark already carries the identity. */
export function AgentBadge({
  slug,
  verb,
  size = 22,
  showVerb = false,
  live = false,
  fallbackName,
}: {
  slug: string | null | undefined;
  /** An explicit verb line. If omitted and showVerb is true, the catalog relay
   *  verb is used. */
  verb?: string | null;
  size?: number;
  showVerb?: boolean;
  /** True while the agent is genuinely running. It sets the mark's state; it
   *  never colours the name. */
  live?: boolean;
  fallbackName?: string | null;
  /** Accepted and ignored: Geist Pixel is retired. */
  pixelName?: boolean;
}) {
  const name = agentDisplayName(slug, fallbackName);
  const v = verb ?? (showVerb ? agentRelayVerb(slug) : null);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--mrd-s3)",
        minWidth: 0,
      }}
    >
      <Mark
        slug={slug}
        name={fallbackName}
        size={sizeFor(size)}
        state={live ? "running" : "idle"}
      />
      <span style={{ display: "inline-flex", flexDirection: "column", minWidth: 0 }}>
        <span
          style={{
            fontWeight: "var(--mrd-w-medium)",
            color: "var(--mrd-ink)",
            lineHeight: "var(--mrd-lh-snug)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
        {v ? (
          <span
            style={{
              fontSize: "var(--mrd-t-base)",
              color: "var(--mrd-mute)",
              lineHeight: "var(--mrd-lh-snug)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {v}
          </span>
        ) : null}
      </span>
    </span>
  );
}
