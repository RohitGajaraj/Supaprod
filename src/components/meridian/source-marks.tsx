/**
 * Provider marks. The connector catalogue's answer to "which one is Linear".
 *
 * THE DEFECT, in the founder's words (2026-07-29): "For the connectors part,
 * you need to display some sort of icon. It needs to know what tool it is, and
 * if you need to add some color for icons, color is optional, but you need to
 * display icon so that they know what tool it is, where it is coming from, and
 * how do we connect. Now everything is like a card design, and it's very blank.
 * Please add the small satellite so that it knows exactly what it is."
 *
 * Twenty providers were drawn as text on a tint, so finding one meant READING
 * twenty labels instead of recognising one shape. That is a scanning failure,
 * and anti-slop.md §6 now names it: identity the reader already carries in
 * their head should be met halfway.
 *
 * THE ENCODING, and it is the same one agent-glyphs.tsx obeys:
 *   SHAPE = which provider. Twenty silhouettes, drawn so the mark survives
 *           greyscale on its own.
 *   HUE   = reinforcement only, and only on the surfaces where the provider IS
 *           the subject. Never the thing carrying the identification.
 *
 * WHY NOT the registry: `registry.ts` carries id, label, description,
 * capabilities and auth, and nothing about drawing. Keeping the mark set HERE
 * means restyling twenty marks never touches a file the server reads, and a new
 * provider needs one entry in one map rather than a schema change.
 *
 * WHY NOT ProviderLogo.tsx, which already exists: that file inlines VERBATIM
 * simple-icons path data on a 24x24 grid and wraps every mark in a 34px tinted
 * tile. The tile is ban 8 (decoration taller than the line it introduces) and
 * verbatim brand geometry is somebody else's trademark sitting in our bundle.
 * These are drawn from scratch on our own grid: a simplified, recognisable form
 * is what an integration directory needs, and it is ours. ProviderLogo stays
 * where the discover lane and the trust dialog already use it; nothing here
 * touches those.
 *
 * WHAT MAKES TWENTY DRAWINGS ONE SET, rather than a scrapbook:
 *   · One 16x16 viewBox, every mark, no exceptions.
 *   · One optical square, roughly 2..14 on both axes, so no mark reads bigger
 *     than its neighbour in a grid.
 *   · One ink density. A brand whose mark is a MASS is drawn filled; a brand
 *     whose mark is a LINE is drawn at 1.4 to 2.4 units of stroke, which is the
 *     same visual weight as the filled marks at this size. A single mark never
 *     carries both extremes.
 *   · Round caps and round joins everywhere, so the whole set shares a corner.
 *
 * THE COLOUR DEFAULT IS MONOCHROME (`tone="mono"`, currentColor), and the
 * reason is the product's own law rather than caution: this interface is
 * monochrome by default and spends colour where state is the subject, so a
 * brand hue sitting in a list beside a red "not reading" would compete with the
 * one thing a person has to act on. Colour is opted INTO per call site with
 * `tone="brand"`, and the rule for when is one line:
 *
 *     Brand hue where the PROVIDER is the subject (the catalogue you scan to
 *     pick one, the provider's own page). Monochrome where the provider is the
 *     CONTEXT and a status, a binding or a conflict is the subject.
 *
 * That is the same argument that lets /crew wear stage hues on the roster and
 * stay monochrome in rows, and it is exactly the precedent anti-slop.md §6
 * cites for an identity surface.
 *
 * WHICH PROVIDERS CARRY A HUE, and why the rest do not. A missing hue is a
 * decision, not a gap: the mark still draws, it just draws in ink.
 *   · github, notion  - their brands ARE monochrome. A hue would invent one.
 *   · zendesk         - brand green is near-black and dies on the dark canvas.
 *   · hubspot         - brand orange sits inside the ember band, and ember
 *                       marks the human and nothing else. Reserved beats brand.
 *   · figma           - its identity is five hues at once. Picking one would
 *                       invent a Figma that does not exist; the five stacked
 *                       pieces already carry it.
 *   · canny,
 *     productboard    - their exact brand values are not verified here, and a
 *                       guessed hue is a fabricated fact.
 *   · firecrawl       - platform infrastructure, `userFacing: false`, never
 *                       rendered in the connections UI at all.
 *
 * Every hue that IS carried is mixed with `--sp-ink` before it is used. Mixing
 * INK into a colour moves it the right way in BOTH themes, lighter on dark and
 * darker on light, which is the same one-rule trick `.sp-cell` uses for its
 * hover. Without it the light sheet (#efe9dc) swallows the brighter blues.
 */

import type { CSSProperties, ReactElement, ReactNode, SVGProps } from "react";
import type { ProviderId } from "@/lib/connectors/registry";

/* ------------------------------------------------------------------ *
 * The shared grid
 * ------------------------------------------------------------------ */

/** Line marks. 16x16, round everything, one weight per mark. */
const g: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

/** Mass marks. Same box, same optical square, ink instead of line. */
const f: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 16 16",
  fill: "currentColor",
  stroke: "none",
  "aria-hidden": true,
  focusable: false,
};

/* ------------------------------------------------------------------ *
 * The twenty
 * ------------------------------------------------------------------ */

/** GitHub: the cat in the circle, distilled to a head, two ears and the tail.
 *  The ears carry the whole reading, so they are drawn big enough to survive
 *  16px; at the first pass they were subtle and the mark read as a plain blob. */
const Github = () => (
  <svg {...f}>
    <circle cx="8" cy="9.0" r="4.9" />
    <path d="M3.9 5.9 3.2 1.5 7.0 3.7Z" />
    <path d="M12.1 5.9 12.8 1.5 9.0 3.7Z" />
    <path
      d="M4.9 12.7c-1.5.6-2.3 1.3-2.6 2.0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

/** Intercom: the bars in the rounded square, tallest in the middle. */
const Intercom = () => (
  <svg {...g}>
    <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.8" strokeWidth={1.4} />
    <path
      d="M5.3 5.7v4.3M7.4 5.2v5.4M9.6 5.2v5.4M11.7 5.7v4.3"
      strokeWidth={1.3}
      strokeLinecap="round"
    />
  </svg>
);

/** Stripe: the S, drawn as one stroke rather than a letterform. */
const Stripe = () => (
  <svg {...g} strokeWidth={1.9}>
    <path d="M11.2 4.4C10 3.6 5.8 3.4 5.6 6.1c-.2 2.7 5.4 2.2 5.3 5-.1 2.7-3.9 2.8-5.5 1.7" />
  </svg>
);

/** Slack: the four-bar pinwheel, true rotational symmetry about the centre and
 *  a hollow square left in the middle. The arms are long on purpose: at the
 *  first pass they were short and the whole thing read as a plus sign. */
const Slack = () => (
  <svg {...g} strokeWidth={2.4}>
    <path d="M2.9 6.1h5M9.9 2.9v5M13.1 9.9H8.1M6.1 13.1V8.1" />
  </svg>
);

/** Zendesk: two wedges pointing past each other. They are held APART along the
 *  diagonal; corner to corner they fused into one parallelogram and the Z was
 *  gone. */
const Zendesk = () => (
  <svg {...f}>
    <path d="M8.9 2.4 13.7 2.4 8.9 9.9Z" />
    <path d="M7.1 13.6 2.3 13.6 7.1 6.1Z" />
  </svg>
);

/** HubSpot: the hub, with a node on each arm. */
const Hubspot = () => (
  <svg {...g}>
    <circle cx="10.4" cy="10.4" r="3.1" />
    <path d="M10.4 7.3V4.7M8.2 8.2 5.5 5.5" />
    <circle cx="10.4" cy="3.1" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="4.1" cy="4.1" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Salesforce: the cloud, three lobes on a flat base. */
const Salesforce = () => (
  <svg {...g}>
    <path d="M4.4 12.2A2.7 2.7 0 0 1 4.7 6.9 3.4 3.4 0 0 1 11.0 5.9 3.6 3.6 0 0 1 11.7 12.2Z" />
  </svg>
);

/** Canny: the open C, heavy and geometric. Their mark is the letter, so this is
 *  a drawn C and not the fallback letter tile. */
const Canny = () => (
  <svg {...g} strokeWidth={2.2}>
    <path d="M11.4 4.6a5 5 0 1 0 0 6.8" />
  </svg>
);

/** Productboard: the roadmap, three staggered bars. Drawn from the product's
 *  own subject rather than a verified brand mark, and drawn as bars rather than
 *  as panels: the panel version read as "08" and sat two cells away from
 *  Outlook, which reads as "O" plus a panel. Two marks that can be mistaken for
 *  each other are one mark doing no work. */
const Productboard = () => (
  <svg {...f}>
    <rect x="2.6" y="3.2" width="9.0" height="2.6" rx="1.3" />
    <rect x="4.8" y="6.7" width="8.6" height="2.6" rx="1.3" />
    <rect x="2.6" y="10.2" width="6.4" height="2.6" rx="1.3" />
  </svg>
);

/** Linear: the three parallel diagonals. */
const Linear = () => (
  <svg {...g} strokeWidth={2}>
    <path d="M3.0 7.0 9.0 13.0M3.0 3.0 13.0 13.0M7.0 3.0 13.0 9.0" />
  </svg>
);

/** Notion: the N inside the rounded square. */
const Notion = () => (
  <svg {...g}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="2.6" strokeWidth={1.4} />
    <path d="M6.1 10.6V5.4l3.8 5.2V5.4" />
  </svg>
);

/** Google Docs: the page with the folded corner and two lines of text. */
const GoogleDocs = () => (
  <svg {...g} strokeWidth={1.4}>
    <path d="M4.2 2.6h4.9l2.7 2.7v8.1H4.2Z" />
    <path d="M9.1 2.6v2.7h2.7" />
    <path d="M6.4 8.4h3.2M6.4 10.8h3.2" strokeWidth={1.3} />
  </svg>
);

/** Google Calendar: the grid with its two hangers, and one day marked. */
const GoogleCalendar = () => (
  <svg {...g} strokeWidth={1.4}>
    <rect x="2.6" y="3.6" width="10.8" height="10" rx="2" />
    <path d="M2.6 6.6h10.8M5.6 2.4v2.4M10.4 2.4v2.4" />
    <rect x="6.6" y="8.7" width="2.8" height="2.8" rx=".8" fill="currentColor" stroke="none" />
  </svg>
);

/** Gmail: the envelope whose flap is the M. */
const Gmail = () => (
  <svg {...g} strokeWidth={1.5}>
    <path d="M2.6 12.8V5.6a1.5 1.5 0 0 1 2.4-1.2L8 6.8l3-2.4a1.5 1.5 0 0 1 2.4 1.2v7.2Z" />
  </svg>
);

/** Google Tasks: the check, on its own. */
const GoogleTasks = () => (
  <svg {...g} strokeWidth={2.2}>
    <path d="M3.2 8.2 6.6 11.6 12.8 4.6" />
  </svg>
);

/** Outlook calendar: the Outlook O beside a calendar panel, hangers and all.
 *  The O is shared with Outlook Mail ON PURPOSE, because both entries genuinely
 *  are Outlook and a reader looking for "the Microsoft one" should find it in
 *  one look. What separates them is the panel's SILHOUETTE rather than a detail
 *  inside it: this one is tall and grows two hangers, the mail one is short and
 *  carries a flap. A detail that only resolves at 48px is not a difference. */
const MicrosoftOutlook = () => (
  <svg {...g} strokeWidth={1.5}>
    <ellipse cx="5.0" cy="8.2" rx="2.9" ry="3.7" />
    <rect x="9.4" y="4.4" width="4.4" height="8.6" rx="1.1" strokeWidth={1.4} />
    <path d="M9.4 7.0h4.4" strokeWidth={1.4} />
    <rect x="10.4" y="8.8" width="2.4" height="2.4" rx=".6" fill="currentColor" stroke="none" />
  </svg>
);

/** Outlook Mail: the same O, and a short wide envelope with its flap open. */
const MicrosoftMail = () => (
  <svg {...g} strokeWidth={1.5}>
    <ellipse cx="5.0" cy="8.2" rx="2.9" ry="3.7" />
    <rect x="9.0" y="6.0" width="5.0" height="5.4" rx="1.1" strokeWidth={1.4} />
    <path d="M9.3 6.6 11.5 8.6 13.7 6.6" strokeWidth={1.4} />
  </svg>
);

/** Figma: the five stacked pieces, three tiles and two circles. */
const Figma = () => (
  <svg {...f}>
    <path d="M8 2H6a2 2 0 1 0 0 4h2Z" />
    <path d="M8 2h2a2 2 0 1 1 0 4H8Z" />
    <path d="M8 6H6a2 2 0 1 0 0 4h2Z" />
    <circle cx="10" cy="8" r="2" />
    <circle cx="6" cy="12" r="2" />
  </svg>
);

/** Jira: three chevrons stepping up the diagonal. */
const Jira = () => (
  <svg {...g} strokeWidth={1.9}>
    <path d="M3.0 8.0h5.0v5.0M5.5 5.5h5.0v5.0M8.0 3.0h5.0v5.0" />
  </svg>
);

/** Firecrawl: the flame. Platform infrastructure, so this never renders in the
 *  connections UI; it exists so the map is total and a stray id cannot fall
 *  through to nothing. */
const Firecrawl = () => (
  <svg {...g} strokeWidth={1.4}>
    <path d="M8 2.2c2.7 2.6 4 4.5 4 6.6a4 4 0 0 1-8 0c0-1.6.6-3 1.9-4.3.1 1.4.8 2.2 1.9 2.6C8.6 5.6 8.4 3.9 8 2.2Z" />
  </svg>
);

const MARKS: Record<ProviderId, () => ReactElement> = {
  github: Github,
  intercom: Intercom,
  stripe: Stripe,
  slack: Slack,
  zendesk: Zendesk,
  hubspot: Hubspot,
  salesforce: Salesforce,
  canny: Canny,
  productboard: Productboard,
  linear: Linear,
  notion: Notion,
  google_docs: GoogleDocs,
  google_calendar: GoogleCalendar,
  gmail: Gmail,
  google_tasks: GoogleTasks,
  microsoft_outlook: MicrosoftOutlook,
  microsoft_mail: MicrosoftMail,
  figma: Figma,
  jira: Jira,
  firecrawl: Firecrawl,
};

/* ------------------------------------------------------------------ *
 * The hues
 * ------------------------------------------------------------------ */

/** One hue per provider, and only where all three tests pass: the value is
 *  known rather than guessed, it survives both themes, and it does not collide
 *  with a reserved system colour. Everything absent stays in ink, on purpose;
 *  the reasons are in the file header. */
const BRAND: Partial<Record<ProviderId, string>> = {
  intercom: "#1f8ded",
  stripe: "#635bff",
  slack: "#36c5f0",
  salesforce: "#00a1e0",
  linear: "#5e6ad2",
  jira: "#2684ff",
  google_docs: "#4285f4",
  google_calendar: "#4285f4",
  gmail: "#ea4335",
  google_tasks: "#1a73e8",
  microsoft_outlook: "#0f6cbd",
  microsoft_mail: "#0f6cbd",
};

/** The brand hue, carried toward the current theme's ink so it holds on the
 *  warm light sheet as well as the dark canvas. `.sp-cell` mixes ink into its
 *  ground for its hover for the same reason: one rule, both themes, no second
 *  palette to keep in step. */
function inkedBrand(provider: ProviderId): string | undefined {
  const hue = BRAND[provider];
  return hue ? `color-mix(in oklab, ${hue} 76%, var(--mrd-ink))` : undefined;
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

export type MarkTone = "mono" | "brand";

/**
 * One provider's mark.
 *
 * DECORATIVE BY CONTRACT. Every call site names the provider in text right
 * beside it, so the mark is `aria-hidden` and a screen reader never hears the
 * same word twice. If a surface ever draws one WITHOUT the label, that surface
 * is wrong, not this component.
 *
 * `size` is the GLYPH. The box around it is six units larger, which is exactly
 * the 16-in-22 proportion `--sp-mark` gives an agent glyph, so a provider row
 * and an agent row start their text on the same pixel.
 */
export function ProviderMark({
  provider,
  size = 16,
  tone = "mono",
}: {
  provider: ProviderId | string;
  size?: number;
  tone?: MarkTone;
}) {
  const Mark = MARKS[provider as ProviderId];
  // An id the registry does not know draws NOTHING rather than borrowing
  // another provider's identity. /sync reads its provider off a sync row,
  // which is a plain string column and can outlive a registry entry.
  if (!Mark) return null;

  const box = size + 6;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        flex: "none",
        alignItems: "center",
        justifyContent: "flex-start",
        width: box,
        height: box,
        color: tone === "brand" ? inkedBrand(provider as ProviderId) : undefined,
      }}
    >
      <span style={{ display: "block", width: size, height: size }}>
        <Mark />
      </span>
    </span>
  );
}

/** The gap between a mark and the words it introduces, and therefore also the
 *  indent that puts the second line under those words. One value, two uses, so
 *  they cannot drift apart. */
const NAME_GAP = "var(--sp-space-2)";

/**
 * A provider's name with its mark, for a `Line` label.
 *
 * `Line` has no mark slot, and it should not grow one: a Line is a boundary you
 * set, and the mark belongs to the words rather than to the control. Pair it
 * with UnderMark on the same Line's `sub` so the second line starts under the
 * name and not under the mark.
 */
export function ProviderName({
  provider,
  tone = "mono",
  children,
}: {
  provider: ProviderId | string;
  tone?: MarkTone;
  children: ReactNode;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: NAME_GAP }}>
      <ProviderMark provider={provider} tone={tone} />
      {children}
    </span>
  );
}

/** A `Line` sub, indented to start under a ProviderName's words rather than
 *  under its mark. The 22px box plus the same gap the name uses. */
export function UnderMark({ children }: { children: ReactNode }) {
  const style: CSSProperties = { display: "block", paddingLeft: `calc(22px + ${NAME_GAP})` };
  return <span style={style}>{children}</span>;
}
