/**
 * Provider marks. The connector catalogue's answer to "which one is Linear".
 *
 * ── MOVED INTO MERIDIAN 2026-08-23, AND THE MOVE IS THE POINT ───────────
 * This lived in `components/connections/` while `PlanCard`, `run-rows`, the
 * Meridian gallery route and `/sources` all already imported it. A design-system
 * component sitting outside the design system, with the system depending on it,
 * is the layering upside down, and it is why nothing OUTSIDE connections ever
 * reached for it: the marks were there and the rail did not know.
 *
 * Two things were fixed in the move rather than carried:
 *   The ink token was Cadence/ink, a RETIRED one, in the one expression that
 *       decides how a brand hue meets the theme. It is `--mrd-ink` now.
 *   The twelve brand hues were hex. They are the same colours in `oklch`, which
 *       is lossless, and it means a brand hue now composes with `color-mix(in
 *       oklab, ...)` on the same terms as every Meridian colour instead of being
 *       a foreign body the rest of the palette cannot reason about.
 *
 * The hex is kept in a trailing comment on each line, because the brand's own
 * spec is the hex and a reader checking us against Slack's brand page needs the
 * number they will find there.
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
 * That is the same argument that lets /team wear stage hues on the roster and
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
 * Every hue that IS carried is mixed with the ink token before it is used. Mixing
 * INK into a colour moves it the right way in BOTH themes, lighter on dark and
 * darker on light, which is the same one-rule trick `.sp-cell` uses for its
 * hover. Without it the light sheet, which is a warm near-white, swallows the brighter blues.
 */

import type { CSSProperties, ReactElement, ReactNode, SVGProps } from "react";
import { BRAND_GLYPHS } from "@/components/meridian/brand-glyphs.gen";
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
  /*
   * EVERY VALUE IS A MERIDIAN TOKEN, NOT A LITERAL, and that is what lets a
   * brand hue answer the ground. `meridian.css` declares each one twice, so
   * GitHub is white on the dark canvas and 181717 on paper, which is GitHub's
   * own published pair rather than a tint we invented. Reasoning and the
   * verification trail live there under THIRD-PARTY BRAND HUES.
   */
  github: "var(--mrd-brand-github)",
  notion: "var(--mrd-brand-notion)",
  zendesk: "var(--mrd-brand-zendesk)",
  slack: "var(--mrd-brand-slack)",
  intercom: "var(--mrd-brand-intercom)",
  stripe: "var(--mrd-brand-stripe)",
  linear: "var(--mrd-brand-linear)",
  jira: "var(--mrd-brand-jira)",
  figma: "var(--mrd-brand-figma)",
  gmail: "var(--mrd-brand-gmail)",
  google_docs: "var(--mrd-brand-google)",
  google_calendar: "var(--mrd-brand-google)",
  google_tasks: "var(--mrd-brand-google)",
  hubspot: "var(--mrd-brand-hubspot)",
  salesforce: "var(--mrd-brand-salesforce)",
  microsoft_outlook: "var(--mrd-brand-microsoft)",
  microsoft_mail: "var(--mrd-brand-microsoft)",
  /* canny, productboard and firecrawl have no verified published hue, so they
     stay on currentColor rather than wearing a colour somebody guessed. */
};

/**
 * The brand's own colour, unmixed.
 *
 * IT USED TO MIX 24% OF OUR INK INTO EVERY HUE, and the founder could see it:
 * "linear's color is changed... why don't we still go ahead and use the
 * original one rather than trying to invent something?" He was right. A tint
 * applied to a trademark makes it not that trademark, and the legibility
 * problem the tint was solving is solved properly in `meridian.css` instead, by
 * declaring the hue per ground the way every Meridian colour already is.
 */
function brandColour(provider: ProviderId): string | undefined {
  return BRAND[provider];
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
 * the 16-in-22 proportion the agent glyph mark size gives, so a provider row
 * and an agent row start their text on the same pixel.
 */

/* ------------------------------------------------------------------ *
 * THE OFFICIAL MARKS, added 2026-08-23
 * ------------------------------------------------------------------ *
 *
 * FOUNDER: "use the original logo and glyphs only... Let's not invent that.
 * What are the colors they have? What is the logo they expose? We will go
 * ahead and use it, not just in this place across the platform."
 *
 * VERBATIM simple-icons path data (MIT), fetched on 2026-08-23 and parsed out
 * of the package files rather than copied by hand or summarised by anything,
 * because a path is 200 to 1,100 characters of coordinates and a single wrong
 * digit renders as garbage that still looks like a shape.
 *
 * THIRTEEN OF THE TWENTY, and the other seven keep the drawn mark because no
 * official one is published to take: canny, firecrawl, productboard, and
 * notably LINEAR, whose entry simple-icons no longer carries. Google Docs and
 * Google Tasks are also absent. A drawn mark where none is published is the
 * honest gap; a drawn mark standing in front of one that exists is not, which
 * is the whole reason these thirteen replace ours.
 *
 * WHAT IS LOST, said plainly, because it was the reason the drawn set existed.
 * Those twenty were built on one 16x16 box with one optical square so no mark
 * reads bigger than its neighbour in a row. These are on simple-icons' own
 * 24x24 grid, which is internally consistent but was not drawn against ours,
 * so a row mixing the two is very slightly less even. Recognition is worth
 * more than evenness here: a person scanning a rail is looking for Slack, and
 * an accurate Slack that sits a hair large beats a tidy one they have to read.
 */

/**
 * Official geometry is drawn on simple-icons' 24x24 grid. It is NOT rendered on
 * a 24 box here, and that is the whole reason this set can be swapped in without
 * breaking the row.
 *
 * The box stays 16, ours, and the borrowed path is scaled into it by exactly
 * 16/24. A uniform scale is not a redrawing: every coordinate keeps its relation
 * to every other, so the mark is still the brand's own shape to the pixel, and it
 * lands on the same optical square as the seven marks we still draw ourselves.
 *
 * `one-run-one-rhythm.test.tsx` is the guard that insisted on this, and it was
 * right to. A mark bigger or heavier than its neighbours reads as more important,
 * which is a claim a source row never makes. Scaling satisfies the founder's
 * ruling and the row's rhythm at once; rendering on a 24 box would have satisfied
 * only the first.
 */

export function ProviderMark({
  provider,
  size = 16,
  /*
   * BRAND BY DEFAULT SINCE 2026-08-23, reversed from `mono` on a founder ruling.
   *
   * The default is the ruling, which is why it moved rather than being passed at
   * more call sites. Half the call sites already asked for `brand` and half did
   * not, so the same provider wore two different colours on two surfaces of one
   * product, which is the inconsistency a design system exists to remove. A
   * caller that genuinely wants the silhouette can still ask for `mono`; nothing
   * about the mark set changed, only which answer you get when you say nothing.
   *
   * It is safe to default now in a way it was not before: the hues are declared
   * per ground in `meridian.css`, so the four that cannot be read on the dark
   * canvas resolve to ink there and to their real colour on paper.
   */
  tone = "brand",
}: {
  provider: ProviderId | string;
  size?: number;
  tone?: MarkTone;
}) {
  /*
   * OFFICIAL GEOMETRY WINS WHERE IT EXISTS. The drawn mark is the fallback now
   * rather than the answer, which is the founder's ruling: use what the brand
   * publishes, and only draw where nothing is published.
   */
  const glyph = BRAND_GLYPHS[provider as string];
  /*
   * Only when the CALLER explicitly asks. Since 2026-08-23 every mark carries
   * the brand's own colour, so nothing is flattened by default: a monochrome
   * brand is monochrome because it IS, through `--mrd-brand-*`, which holds the
   * real hex on paper and the brand's own light-on-dark asset on the dark
   * canvas. Founder ruling, twice: the original logos, not monos.
   */
  const flat = tone === "mono";
  const Mark = MARKS[provider as ProviderId];
  // An id the registry does not know draws NOTHING rather than borrowing
  // another provider's identity. /sources reads its provider off a sync row,
  // which is a plain string column and can outlive a registry entry.
  if (!glyph && !Mark) return null;

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
        color: flat ? brandColour(provider as ProviderId) : undefined,
      }}
    >
      <span style={{ display: "block", width: size, height: size }}>
        {glyph ? (
          /*
           * `preserveAspectRatio` rather than a hand-computed scale, because the
           * published viewBoxes are not square and several are not 24: Figma is
           * 256x384, Stripe 512x214, HubSpot 512x149. The old code multiplied by
           * a fixed 16/24, which silently squashed anything that was not a 24 box.
           * Letting the browser fit the box is both correct and shorter.
           */
          <svg
            viewBox={glyph.viewBox}
            width={size}
            height={size}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
          >
            {glyph.parts.map((part, i) => (
              <path
                key={i}
                d={part.d}
                fill={flat ? "currentColor" : (part.fill ?? "currentColor")}
              />
            ))}
          </svg>
        ) : Mark ? (
          <Mark />
        ) : null}
      </span>
    </span>
  );
}

/** The gap between a mark and the words it introduces, and therefore also the
 *  indent that puts the second line under those words. One value, two uses, so
 *  they cannot drift apart. */
const NAME_GAP = "var(--mrd-s3)"; /* 6px: a mark and the word it belongs to */

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

/* ------------------------------------------------------------------ *
 * THE KINDS, added 2026-08-23
 * ------------------------------------------------------------------ *
 *
 * FOUNDER, this session: "wherever the inputs are coming from any connected
 * sources or any sources that we are calling out, I think we need to use their
 * original logos or glyphs next to that... people will connect."
 *
 * THE PART THAT ONLY THE DATABASE COULD ANSWER. Twenty brand marks cover twenty
 * brands, and the live `signals.source` column is mostly not brands. Counted on
 * 2026-08-23 across 1,418 rows:
 *
 *   agent 913 · analytics 51 · sales-call 43 · support 33 · nps 30 ·
 *   interview 26 · app-store 22 · slack 21 · github 21 · market 12 ·
 *   competitive_research 12 · workspace_brief 25 · churn-call 8 · churn-survey 7
 *
 * So `slack` and `github` are the ONLY branded connectors in the real data, and
 * a brand-logo-only answer would leave the large majority of rows with nothing
 * beside them. That is worse than no marks at all, because an absent mark then
 * reads as a missing integration rather than as a kind of evidence.
 *
 * These are the other half: one mark per KIND of evidence, drawn to the same
 * contract as the twenty so a rail mixing Slack with an interview reads as one
 * set. Same 16x16 box, same optical square, same round caps, and never both ink
 * densities in one mark.
 *
 * THEY ARE NEVER BRAND-TINTED. A kind has no brand, so `tone="brand"` resolves
 * to nothing for these and they stay on `currentColor`. That is the honest
 * behaviour: hue here would be a colour we invented for a category, which is
 * the decoration the colour law exists to prevent.
 */

/** Support, a feature request, anything that arrived as someone talking to us. */
const Conversation = () => (
  <svg {...g}>
    <path d="M4 3h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7l-3 2.5V11a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
  </svg>
);

/** A call: the waveform of a recording, not a handset. The handset is a device
 *  nobody under forty has held; the waveform is what a recording LOOKS like. */
const Call = () => (
  <svg {...g} strokeWidth={1.8}>
    <path d="M3 6.5v3M6 3.5v9M9 5.5v5M12 7v2" />
  </svg>
);

/** A survey or an NPS score: a gauge, because the fact is a READING. */
const Survey = () => (
  <svg {...g}>
    <path d="M2.5 11.5a5.5 5.5 0 0 1 11 0" />
    <path d="M8 11.5 11 7.5" />
  </svg>
);

/** An interview: a person, because the evidence is somebody's own words. */
const Interview = () => (
  <svg {...g}>
    <circle cx="8" cy="5" r="2.5" />
    <path d="M3.5 13.5a4.5 4.5 0 0 1 9 0" />
  </svg>
);

/** Analytics: a trend against a baseline. */
const Analytics = () => (
  <svg {...g}>
    <path d="M2.5 13.5h11" />
    <path d="M4 11l3-3.5 2.5 2L13 4.5" />
  </svg>
);

/** An app-store review: a rating. */
const AppStore = () => (
  <svg {...g}>
    <path d="M8 2.5l1.75 3.55 3.9.57-2.82 2.75.66 3.88L8 11.4l-3.49 1.85.66-3.88L2.35 6.62l3.9-.57z" />
  </svg>
);

/** Market or competitive research: looking outward on purpose. */
const Research = () => (
  <svg {...g}>
    <circle cx="7.25" cy="7.25" r="4.75" />
    <path d="M10.75 10.75 13.8 13.8" />
  </svg>
);

/** A brief, an audit, anything that arrived as a written document. */
const Document = () => (
  <svg {...g}>
    <path d="M4.5 2h4.5L12 5.2v8.3a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z" />
    <path d="M9 2v3.2h3M6.5 9h3M6.5 11.3h3" />
  </svg>
);

/** A session replay: watching it happen again. */
const Replay = () => (
  <svg {...g}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M6.9 5.9 10.6 8l-3.7 2.1z" />
  </svg>
);

/** Our own agent filed it. The 3x3 lattice is deliberate: it is the same shape
 *  `LoadingState` and `AgentPulse` animate, so a row filed by an agent and an
 *  agent visibly working are recognisably the same actor. */
const AgentKind = () => (
  <svg {...f}>
    <path d="M3 3h2.2v2.2H3zM6.9 3h2.2v2.2H6.9zM10.8 3H13v2.2h-2.2zM3 6.9h2.2v2.2H3zM6.9 6.9h2.2v2.2H6.9zM10.8 6.9H13v2.2h-2.2zM3 10.8h2.2V13H3zM6.9 10.8h2.2V13H6.9zM10.8 10.8H13V13h-2.2z" />
  </svg>
);

const KIND_MARKS = {
  conversation: Conversation,
  call: Call,
  survey: Survey,
  interview: Interview,
  analytics: Analytics,
  appstore: AppStore,
  research: Research,
  document: Document,
  replay: Replay,
  agent: AgentKind,
} as const;

export type SourceKind = keyof typeof KIND_MARKS;

/**
 * Read a `signals.source` string and say what to draw.
 *
 * MATCHED ON SUBSTRINGS, LOWERCASED, PUNCTUATION STRIPPED, and that is not
 * laziness. The column is free text: the live data holds `sales-call`,
 * `churn-call`, `NPS survey`, `churn-survey`, `session replay archive` and
 * `Sam Weller support ticket clusters`, all written by different producers over
 * three months. An exact map would answer four of those and shrug at the rest.
 *
 * ORDER MATTERS AND IS DELIBERATE. `churn-survey` contains both "churn" and
 * "survey"; survey is checked before call so it does not become a phone call.
 * A row that matches nothing draws NOTHING rather than borrowing a kind, for
 * the same reason an unknown provider id does: a wrong mark is worse than none,
 * because it is confidently wrong and a person reads it as fact.
 */
export function sourceKindFor(source: string | null | undefined): SourceKind | undefined {
  if (!source) return undefined;
  const s = source.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  if (has("agent")) return "agent";
  if (has("replay")) return "replay";
  if (has("survey", "nps", "csat", "score")) return "survey";
  if (has("interview")) return "interview";
  if (has("call", "meeting")) return "call";
  if (has("analytic", "dashboard", "telemetry", "metric")) return "analytics";
  if (has("app store", "appstore", "review", "rating")) return "appstore";
  if (has("market", "competit", "research", "scout")) return "research";
  if (has("brief", "audit", "doc", "transcript", "note", "paste")) return "document";
  if (has("support", "ticket", "feature request", "churn", "feedback", "request"))
    return "conversation";
  return undefined;
}

/**
 * THE ONE A SURFACE SHOULD CALL. Give it whatever the row says its source is and
 * it resolves a brand mark first, then a kind, then draws nothing.
 *
 * WHY BRAND WINS. `slack` is both a provider id and a word that could be read as
 * a kind of conversation. If a workspace genuinely connected Slack, the Slack
 * mark tells a person more than a speech bubble does, and recognition is the
 * whole reason the founder asked for this.
 */
export function SourceMark({
  source,
  size = 16,
  tone = "brand",
}: {
  source: string | null | undefined;
  size?: number;
  tone?: MarkTone;
}) {
  const key = (source ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (MARKS[key as ProviderId]) return <ProviderMark provider={key} size={size} tone={tone} />;
  const kind = sourceKindFor(source);
  if (!kind) return null;
  const Mark = KIND_MARKS[kind];
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
      }}
    >
      <span style={{ display: "block", width: size, height: size }}>
        <Mark />
      </span>
    </span>
  );
}
