/**
 * Shell icons, lifted from PROTOTYPE-v2.html.
 *
 * Inline SVG on a 24 grid, stroke only, sized by the shell CSS at the size
 * of their label (anti-slop ban 8: no icon tiles, no containers). This
 * replaces the emoji the retired AppShell rail used, which is ban 5 in the
 * "grep the hard eleven" checklist.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.5,
  "aria-hidden": true,
  focusable: false as const,
};

/** Today: a brief, shortening. Three rules, each one shorter than the last. */
export function IconToday({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round">
      <path d="M4 6h16M4 12h11M4 18h7" />
    </svg>
  );
}

/** Runs: a trace, with the spike where the work happened. */
export function IconRuns({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h3.5l2.5-6 3 12 2.5-6H21" />
    </svg>
  );
}

/** Brain: three nodes and the edges between them. The record, not a head. */
export function IconBrain({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round">
      <circle cx="7" cy="7" r="2.4" />
      <circle cx="17.5" cy="10" r="2.4" />
      <circle cx="9" cy="17.5" r="2.4" />
      <path d="M8.9 8.6 15.6 9M8.1 9.3l.5 5.9M15.9 12l-5.2 4.1" />
    </svg>
  );
}

/** Crew: the chip, with its legs. An agent is a part, not a person. */
export function IconCrew({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="2.2" />
      <path d="M10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3" />
    </svg>
  );
}

/** Engine room: three lines with a node on each. The machinery, on demand. */
export function IconEngine({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round">
      <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h13M21 17h-1" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="19" cy="17" r="2" />
    </svg>
  );
}

/**
 * Settings. A COG, with teeth.
 *
 * What this used to draw was a circle with eight straight radiating spokes,
 * which is a SUN, and it sat in the bottom-left corner of the rail where every
 * application on earth puts a theme toggle. The founder read it as the theme
 * switcher and reported it as broken: "there is a theme switcher button, it's
 * not working, if I click that it opens up the settings page." He was reading
 * it exactly right. The icon was wrong, not him.
 *
 * The sun glyph moved to IconSun below, where it is a sun on purpose.
 */
export function IconGear({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/** Light. The glyph IconGear used to wear by mistake, now doing its own job. */
export function IconSun({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.4v2.6M12 19v2.6M4.4 4.4l1.9 1.9M17.7 17.7l1.9 1.9M2.4 12H5M19 12h2.6M4.4 19.6l1.9-1.9M17.7 6.3l1.9-1.9" />
    </svg>
  );
}

/** Dark. */
export function IconMoon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.6 8.6 0 1 0 10.9 10.9z" />
    </svg>
  );
}

/**
 * Follow the system. A display, because that is what it is following: not a
 * third brightness, but a deferral to the machine.
 */
export function IconSystem({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.8" y="4.2" width="18.4" height="12.4" rx="1.6" />
      <path d="M8.6 20.2h6.8M12 16.6v3.6" />
    </svg>
  );
}

/** The board: work in columns. */
export function IconBoard({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="4.6" height="16" rx="1.2" />
      <rect x="9.7" y="4" width="4.6" height="10.6" rx="1.2" />
      <rect x="16.4" y="4" width="4.6" height="13.4" rx="1.2" />
    </svg>
  );
}

export function IconChevron({ className }: IconProps) {
  return (
    <svg
      {...base}
      className={className}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * THE RAIL TOGGLE, AND THERE IS NOW ONE DRAWING OF IT RATHER THAN TWO.
 *
 * FOUNDER, 2026-08-15, on moving this control up beside the logo: its mark and
 * the collapse icon "should be the same".
 *
 * He was reading a real split. Two glyphs meant "the rail" in this product and
 * neither knew about the other: `IconPanel` here drew a rounded rectangle with
 * an edge column, and Meridian's own `SidebarNav.tsx` drew two vertical rules
 * with a chevron between them. Same act, two silhouettes, ten pixels apart once
 * the control moved into the header. That is exactly the failure
 * `station-glyphs.tsx` was written to end one layer down: "two renderings of
 * the same seven things must not own two copies of the drawing".
 *
 * MERIDIAN'S DRAWING WINS, and not because it is prettier. `IconPanel` is a
 * STATE (here is a panel) and says nothing about what pressing it will do;
 * Meridian's carries a chevron, so it is a PROMISE about the next press, which
 * is this repo's standing rule for a control's label. It also solves the thing
 * a single static panel glyph cannot: expanding and collapsing are opposite
 * acts and now draw as mirror images.
 *
 * `IconPanel` IS GONE rather than deprecated. Leaving it would leave the second
 * lookalike sitting in the file for the next person to reach for, which is the
 * whole defect. Its one caller was the rail collapse and it moved here.
 *
 * A REQUEST THIS PORT COULD NOT MAKE ITSELF: `SidebarNav.tsx` still inlines
 * these two paths. It belongs to another lane, so it is named in the handoff
 * rather than edited here -- but the third copy must not be written, and when
 * that file next moves it should import from this one (or both should move to
 * `components/meridian/`, which is the better home for a shared glyph).
 */
export function IconRailCollapse({ className }: IconProps) {
  return (
    <svg
      {...base}
      className={className}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4v16M20 4v16M15 9l-3 3 3 3" />
    </svg>
  );
}

/** The same drawing, mirrored. Expanding is the opposite act, so the chevron
 *  points the opposite way and nothing else changes. */
export function IconRailExpand({ className }: IconProps) {
  return (
    <svg
      {...base}
      className={className}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4v16M20 4v16M9 9l3 3-3 3" />
    </svg>
  );
}

/**
 * Start a new piece of work. A plus, which is the one glyph every interface
 * agrees means "add one of these", so it carries the collapsed rail on its own.
 * Heavier stroke than the nav icons because it sits on a filled face, where a
 * 1.5px line reads as a scratch.
 */
export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2.6} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Find. A lens with its handle, at the reference's own proportions. */
export function IconFind({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/**
 * THE KEYBOARD SHEET'S OWN DOOR, WHICH USED TO BE A QUESTION MARK.
 *
 * FOUNDER, 2026-08-15: the question mark has to go. He is right and the reason
 * is the one this file already argued once, when a sun was standing in for a
 * cog: a glyph has to say which door it is. "?" says HELP, generically -- docs,
 * support, a tour, an explanation of the page. This door opens exactly one
 * thing, the keyboard shortcut sheet, so it draws a keyboard.
 *
 * It also stops the control being the odd one out geometrically: the other
 * three in the rail foot hold a 17px stroked icon and this one held a text
 * character, which needed its own font-size, weight and line-height rules to
 * sit level with them.
 *
 * CHECKED AGAINST THE STATION-GLYPH RULE ("a mark that already means something
 * else in software is not available, however apt it feels"): a keyboard outline
 * is not a control shape and collides with nothing in this product. The `?` key
 * still opens the sheet and is still spoken in the accessible name.
 */
export function IconKeyboard({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.4" y="6" width="19.2" height="12" rx="2.2" />
      <path d="M6.4 9.6h.01M9.6 9.6h.01M12.8 9.6h.01M16 9.6h.01M6.4 12.8h.01M9.6 12.8h.01M12.8 12.8h.01M16 12.8h.01M8.8 15.8h6.4" />
    </svg>
  );
}

/** More. Three dots, which is the one glyph every interface agrees means
 *  "there is more here than fits", so it needs no label to be understood.
 *  Filled rather than stroked: three 1.5px rings at this size read as mush. */
export function IconMore({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <circle cx="5.5" cy="12" r="1.55" />
      <circle cx="12" cy="12" r="1.55" />
      <circle cx="18.5" cy="12" r="1.55" />
    </svg>
  );
}

/**
 * Dictation. A capsule on a stand, which is the shape every microphone
 * affordance on earth has, so it needs no label to be read.
 *
 * It replaces the word "Dictate" in Ask's footer (founder ruling 2026-07-30).
 * The word was the right instinct for a surface whose every other control is a
 * word, and the wrong one for this control: the footer already carries the
 * send button, the intent fork and a hint line, and a fourth run of words made
 * the one non-verbal action in the product hide among them. The accessible name
 * survives on the button as an aria-label, so nothing is lost to a screen
 * reader, and it says which way the next press goes rather than where you are.
 */
export function IconMic({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2.8" width="6" height="11" rx="3" />
      <path d="M5.5 11.2a6.5 6.5 0 0 0 13 0M12 17.7V21.2M8.6 21.2h6.8" />
    </svg>
  );
}

export function IconAsk({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 12c0 4.3-3.8 7.7-8.5 7.7-1.1 0-2.2-.2-3.2-.6L4 20.5l1.5-4.2A7.4 7.4 0 0 1 3.5 12C3.5 7.7 7.3 4.3 12 4.3s8.5 3.4 8.5 7.7Z" />
    </svg>
  );
}
