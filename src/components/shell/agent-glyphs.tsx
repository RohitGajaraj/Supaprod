/**
 * Agent glyphs. Step 3 of the rebuild.
 *
 * THE ENCODING, and it is the whole point (anti-slop.md §3):
 *   SHAPE = which agent. Thirteen distinct silhouettes, each drawn to say
 *           what that agent does.
 *   HUE   = which loop stage it belongs to. Seven families, not thirteen.
 *
 * Doubly encoded, so it survives greyscale and colour blindness, and it is
 * readable at 22px where two letters were not. It also means a colour tells
 * you something useful about an agent you have never met.
 *
 * WHY NOT agent-vocabulary's own hue + glyph: that catalog carries a
 * PER-AGENT oklch hue and a lucide icon name. Thirteen competing hues is
 * exactly what the stage-family model replaces, and a generic icon set says
 * nothing about the job. agent-vocabulary stays the source of truth for who
 * an agent IS (slug, name, station, blurb); this module is only how it draws.
 *
 * Keyed on the DISPLAY NAME rather than the slug, because the catalog rolls
 * many slugs onto one identity (discovery-scout, discovery, scout, listener
 * and competitor-watcher are all "Watch"). Thirteen names, thirteen glyphs,
 * and a new alias slug needs no change here.
 */

import type { ReactElement, SVGProps } from "react";
import { agentDisplayName } from "@/lib/agent-vocabulary";

const g: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  /*
   * 1.25, WAS 1.4. Founder, on the agent cards: the glyphs read "thicker" and not
   * clean. At the 22px these were drawn for, 1.4 is right; the cards show them larger,
   * where the same absolute weight reads as heavy. Thinning the line rather than
   * shrinking the mark keeps the silhouette legible at both sizes, which is what the
   * shape has to carry since it is the only thing encoding WHICH agent this is.
   */
  strokeWidth: 1.25,
  "aria-hidden": true,
  focusable: false,
};

/** Watch: a signal arriving, with the source below it. */
const Watch = () => (
  <svg {...g} strokeLinecap="round">
    <path d="M2.6 11.2a6 6 0 0 1 10.8 0" />
    <path d="M5.4 9.8a3 3 0 0 1 5.2 0" />
    <circle cx="8" cy="12.4" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

/** Research: looking closely at one thing. */
const Research = () => (
  <svg {...g} strokeLinecap="round">
    <circle cx="6.9" cy="6.9" r="4" />
    <path d="M10 10l3.4 3.4" />
  </svg>
);

/** Listen: a waveform. Someone is speaking and it is being heard. */
const Listen = () => (
  <svg {...g} strokeLinecap="round">
    <path d="M4 6.2v3.6M7 4v8M10 5.4v5.2M13 7v2" />
  </svg>
);

/** Prioritize: a ranked list, longest first. */
const Prioritize = () => (
  <svg {...g} strokeLinecap="round">
    <path d="M3 4.2h10M3 8h6.5M3 11.8h3.5" />
  </svg>
);

/** Challenge: a diamond standing on its point. It is in the way on purpose. */
const Challenge = () => (
  <svg {...g} strokeLinejoin="round">
    <path d="M8 2.6 13.4 8 8 13.4 2.6 8Z" />
  </svg>
);

/** Chief of Staff: a hierarchy, not a sparkle. Sparkle-as-AI is a banned pattern. */
const ChiefOfStaff = () => (
  <svg {...g} strokeLinecap="round" strokeLinejoin="round">
    <rect x="6.2" y="2.2" width="3.6" height="3.6" rx=".8" />
    <rect x="1.8" y="10.2" width="3.6" height="3.6" rx=".8" />
    <rect x="10.6" y="10.2" width="3.6" height="3.6" rx=".8" />
    <path d="M8 5.8v2.3M3.6 10.2V8.1h8.8v2.1" />
  </svg>
);

/** Draft: a nib on a line. Something is being written. */
const Draft = () => (
  <svg {...g} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.4 2.9 13.1 4.6 6 11.7l-2.4.7.7-2.4Z" />
    <path d="M3 13.8h10" />
  </svg>
);

/** Plan: staggered steps. An order of work, not a ranking. */
const Plan = () => (
  <svg {...g} strokeLinecap="round">
    <path d="M2.8 4.2h5.4M5.6 8h6.4M8.4 11.8h4.8" />
  </svg>
);

/** Design: a frame with a composition inside it. */
const Design = () => (
  <svg {...g} strokeLinejoin="round">
    <rect x="2.9" y="2.9" width="10.2" height="10.2" rx="1.6" />
    <path d="M2.9 10.1 6.4 6.7l2.6 2.6 2-1.9 2.1 2.1" />
  </svg>
);

/** Engineer: a prompt. The place work is typed. */
const Engineer = () => (
  <svg {...g} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.6 4 9.8 8l-4.2 4" />
    <path d="M10.6 12.2h2.6" />
  </svg>
);

/** Review: a check, enclosed. A bare tick read as an affordance and got
 *  clicked; enclosed, it reads as a verdict instead. */
const Review = () => (
  <svg {...g} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="5.6" />
    <path d="M5.4 8.1 7.2 10l3.4-4" />
  </svg>
);

/** Announce: something broadcasting outward. */
const Announce = () => (
  <svg {...g} strokeLinecap="round">
    <circle cx="4.4" cy="8" r="1.5" />
    <path d="M8 4.6a4.6 4.6 0 0 1 0 6.8M11 2.6a7.6 7.6 0 0 1 0 10.8" />
  </svg>
);

/** Measure: a trend, with the arrow saying which way it went. */
const Measure = () => (
  <svg {...g} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.8 11.4 6.2 7.9l2.4 2.4 4.6-5.1" />
    <path d="M10.6 5.2h2.6v2.6" />
  </svg>
);

/** The generic mark, for a slug the catalog does not know. Deliberately plain:
 *  an unknown agent should look unknown rather than borrow another's identity. */
const Unknown = () => (
  <svg {...g} strokeLinecap="round">
    <circle cx="8" cy="8" r="5.4" />
  </svg>
);

/*
 * ── THE FIVE THAT SHARED ONE MARK ─────────────────────────────────────────────
 * Founder: "it would be great if you could differentiate the logos for Archivist,
 * Reactor, Guide, Verify, and Critique. All five hold the same logo".
 *
 * Exactly right, and the cause is in this file's own header: it was written for
 * "thirteen distinct silhouettes" and the catalog now carries eighteen active agents.
 * The five added since fell through `BY_NAME` to `Unknown`, so the one mark that means
 * "no drawing exists" was standing in for a fifth of the crew -- and on a surface whose
 * entire encoding is SHAPE = which agent, five agents sharing a silhouette is the one
 * thing it must never do.
 *
 * Each is drawn for the JOB, not decorated, so the mark says something to a person who
 * has never met that agent.
 */

/** Critique: a drawn eye over a frame. It looks at a design and says what is wrong. */
function Critique() {
  return (
    <svg {...g}>
      <rect x="2.5" y="3" width="11" height="8" rx="1.2" />
      <path d="M4.6 7c1.2-1.5 4.6-1.5 5.8 0-1.2 1.5-4.6 1.5-5.8 0Z" />
      <circle cx="7.5" cy="7" r="0.85" fill="currentColor" stroke="none" />
      <path d="M5 13.5h6" />
    </svg>
  );
}

/** Verify: a tick inside a shield. It confirms a release is safe to go out. */
function Verify() {
  return (
    <svg {...g}>
      <path d="M8 2 13 3.8v4.1c0 3-2.1 5.2-5 6.1-2.9-.9-5-3.1-5-6.1V3.8L8 2Z" />
      <path d="M5.6 7.9 7.4 9.7l3.1-3.4" />
    </svg>
  );
}

/** Guide: a compass needle. It points at what the record already learned. */
function Guide() {
  return (
    <svg {...g}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M10.3 5.7 6.9 6.9 5.7 10.3l3.4-1.2 1.2-3.4Z" />
    </svg>
  );
}

/** Reactor: a bolt through a ring. It responds the moment something arrives. */
function Reactor() {
  return (
    <svg {...g}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8.9 4.4 6.2 8.3h2L7.1 11.6l2.8-3.9h-2l1-3.3Z" />
    </svg>
  );
}

/** Archivist: stacked layers with a spine. It keeps what happened, in order. */
function Archivist() {
  return (
    <svg {...g}>
      <rect x="2.6" y="3" width="10.8" height="3" rx="0.9" />
      <rect x="2.6" y="7" width="10.8" height="3" rx="0.9" />
      <path d="M2.6 11.6h10.8" />
      <path d="M5.4 4.5h5.2M5.4 8.5h5.2" />
    </svg>
  );
}

const BY_NAME: Record<string, () => ReactElement> = {
  Watch,
  Research,
  Listen,
  Prioritize,
  Challenge,
  "Chief of Staff": ChiefOfStaff,
  Draft,
  Plan,
  Design,
  Engineer,
  Review,
  Announce,
  Measure,
  Critique,
  Verify,
  Guide,
  Reactor,
  Archivist,
};

/** The glyph component for an agent slug, via its catalog display name. */
export function glyphForSlug(slug: string | null | undefined): () => ReactElement {
  return BY_NAME[agentDisplayName(slug)] ?? Unknown;
}

/**
 * ── THE SEVEN STAGE HUES ARE RETIRED, AND FIVE OF THEM NEVER EXISTED ──────
 *
 * MEASURED 2026-09-10 (Lane 3's consistency sweep, verified here). `STATION_TOKEN`
 * mapped all seven stations to `--sp-stage-*`, and only TWO of those tokens are
 * defined anywhere in `src/styles`: `build` and `learn`. The other five --
 * discover, decide, plan, design, ship -- resolved to nothing.
 *
 * AND THE CSS FALLBACK DID NOT SAVE IT, which is the part that made this
 * invisible. `.sp-suggest-station` declares `--sp-suggest-hue:
 * var(--sp-stage-build)`, and `StationTag` OVERRODE that inline with
 * `var(--sp-stage-decide)`. A custom property whose value references an
 * undefined property is guaranteed-invalid at computed-value time, so every
 * consumer of it -- border, background, colour -- fell to `unset`. The declared
 * fallback only applies when nothing sets the property, and something always
 * did. `AskLanding`'s dot had no fallback at all and simply did not draw for
 * five of seven stations.
 *
 * ── IT IS REMOVED RATHER THAN REPAIRED, AND THAT IS A RULING ──────────────
 * Defining the five would mean adding tokens in the RETIRED `--sp-*` namespace,
 * which `bun test` fails a new file for. And the idea itself is retired: the
 * founder's 2026-09-08 ruling is that status colour is restrained and never on
 * a label -- *"the gold road read as AI-made"* -- and law 4 says identity is
 * SHAPE, so a station is known by its glyph and its name, not its hue. Seven
 * stage families is the rainbow that ruling rejected.
 *
 * **Nobody reported the five missing ones**, over however long they were gone,
 * which is the strongest available evidence that the surfaces read fine without
 * them. Both callers now use one neutral, and both say the station in words
 * beside it -- `AskLanding` on its own action ("Open Design"), `StationTag` as
 * its entire content.
 */
