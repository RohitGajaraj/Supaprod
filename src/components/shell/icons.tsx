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

export function IconGear({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3.2v2.4M12 18.4v2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M3.2 12h2.4M18.4 12h2.4M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7" />
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

/** The rail collapse: a panel with its edge column. */
export function IconPanel({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeLinecap="round">
      <rect x="3.2" y="4.2" width="17.6" height="15.6" rx="2.4" />
      <path d="M9.6 4.4v15.2" />
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
