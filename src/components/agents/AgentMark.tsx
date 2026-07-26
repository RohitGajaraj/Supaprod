// AGENT-EXP: the agent's visual identity, used everywhere an agent is "called out".
//
// Accent restraint (founder ruling C, 2026-07-11; DESIGN-TEMPO.md section 2):
// per-agent hue lives ONLY inside the small glyph mark, where identity coding
// earns its color. The name text is gray when idle and wears the shared
// glacier shimmer (.agent-live) only while the agent is genuinely running, so
// standing chromatic tints never sit on plain text. The glyph, not color,
// distinguishes agents in monochrome and for color-blind users.
//
// AgentMark   = the glyph in its hue, in a soft rounded square.
// AgentBadge  = the called-out treatment: mark + name (+ optional present-tense verb).

import {
  Activity,
  Archive,
  Bot,
  CheckCheck,
  Code,
  Compass,
  FileText,
  ListChecks,
  Megaphone,
  MessagesSquare,
  PenTool,
  Radar,
  Search,
  ShieldAlert,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { agentDisplayName, agentMark, agentRelayVerb } from "@/lib/agent-vocabulary";

// Static map of the catalog glyph names to lucide icons (explicit, tree-shakeable).
const GLYPHS: Record<string, LucideIcon> = {
  radar: Radar,
  search: Search,
  "messages-square": MessagesSquare,
  target: Target,
  "shield-alert": ShieldAlert,
  "file-text": FileText,
  "pen-tool": PenTool,
  "list-checks": ListChecks,
  code: Code,
  "check-check": CheckCheck,
  megaphone: Megaphone,
  activity: Activity,
  compass: Compass,
  zap: Zap,
  archive: Archive,
};

/** The lucide icon for a catalog glyph name, falling back to a generic mark.
 *  Module-local so this file only exports components (fast-refresh clean). */
function iconForGlyph(glyph: string): LucideIcon {
  return GLYPHS[glyph] ?? Bot;
}

/** The agent's geometric identity mark: its glyph in its hue, in a soft rounded square. */
export function AgentMark({ slug, size = 22 }: { slug: string | null | undefined; size?: number }) {
  const { hue, glyph } = agentMark(slug);
  const Icon = iconForGlyph(glyph);
  const inner = Math.round(size * 0.54);
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        // Liquid-glass gem (founder direction 2026-07-13): a dimensional tile
        // per agent — a soft top-lit gradient in the agent's hue, a bright
        // catch-light on the top edge, and a low outer glow. The hue still
        // lives only on this small identity mark (DESIGN-TEMPO §2 restraint);
        // the glyph, not color, is the primary differentiator.
        background: `linear-gradient(155deg, color-mix(in oklab, ${hue} 26%, var(--card)) 0%, color-mix(in oklab, ${hue} 9%, var(--card)) 100%)`,
        border: `1px solid color-mix(in oklab, ${hue} 34%, var(--hairline))`,
        boxShadow: `inset 0 1px 0 color-mix(in oklab, #fff 16%, transparent), 0 3px 8px -4px color-mix(in oklab, ${hue} 45%, transparent)`,
        color: hue,
        flexShrink: 0,
      }}
    >
      <Icon size={inner} strokeWidth={1.5} />
    </span>
  );
}

/** The called-out treatment: mark + name, optionally with a present-tense verb line. */
export function AgentBadge({
  slug,
  verb,
  size = 22,
  showVerb = false,
  live = false,
  fallbackName,
  pixelName = false,
}: {
  slug: string | null | undefined;
  /** An explicit verb line. If omitted and showVerb is true, the catalog relay verb is used. */
  verb?: string | null;
  size?: number;
  showVerb?: boolean;
  /** When true, the name shimmers (a live/running agent), respecting motion settings. */
  live?: boolean;
  fallbackName?: string | null;
  /** When true, the agent name renders in Geist Pixel (the brand display face)
   *  at a legible size — for prominent/heading agent identities. Kept off by
   *  default because Pixel reads poorly below ~14px. */
  pixelName?: boolean;
}) {
  const name = agentDisplayName(slug, fallbackName);
  const v = verb ?? (showVerb ? agentRelayVerb(slug) : null);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--geist-space-2x)", minWidth: 0 }}>
      <AgentMark slug={slug} size={size} />
      <span style={{ display: "inline-flex", flexDirection: "column", minWidth: 0 }}>
        <span
          className={live ? "agent-live" : undefined}
          style={{
            fontFamily: pixelName ? "var(--font-pixel)" : undefined,
            fontSize: pixelName ? 14 : 12,
            fontWeight: pixelName ? 400 : 540,
            // Idle names are gray (restraint); only the live shimmer colors the name.
            color: live ? undefined : "var(--ink-muted)",
            lineHeight: 1.2,
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
              color: "var(--ink-subtle)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {v}
          </span>
        ) : null}
      </span>
    </span>
  );
}
