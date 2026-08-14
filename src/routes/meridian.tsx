import type { CSSProperties, ReactNode } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { LoadingState } from "@/components/meridian/LoadingState";
import { StalledWork, type StalledItem } from "@/components/meridian/StalledWork";

/*
 * THE MERIDIAN GALLERY, at /meridian.
 *
 * WHY THIS ROUTE EXISTS, and it is not developer convenience. The design record
 * for this product contains two designs rejected in one evening, and the note
 * explaining why says: "Both rejected designs were reasoned from tokens and
 * neither was ever rendered." The third was screenshotted in both grounds
 * before it was offered, and that is the only reason a broken disabled state on
 * paper was caught rather than shipped.
 *
 * So every Meridian component gets looked at here, in BOTH grounds, side by
 * side, before it is wired to anything. It has already earned its keep twice:
 * it caught a panel that was invisible on the dark ground only, and it is where
 * the accent colour is being chosen from rendered candidates rather than from
 * a description.
 *
 * BOTH GROUNDS ON ONE PAGE. `[data-theme="light"]` is an attribute selector,
 * not a document-level switch, so wrapping a panel in it re-resolves every
 * --mrd-* token inside that panel to the paper values. Nothing is written
 * twice; the same component instance renders in both columns.
 *
 * NOT IN THE RAIL, deliberately. This is a workbench, not a station.
 *
 * WHY IT IS NOT BEHIND AUTH, and why that is still safe. Behind
 * `_authenticated` it renders the auth spinner to any tool without a session,
 * which is exactly the "reasoned from tokens, never rendered" failure it exists
 * to prevent. It holds no user data, reads no query and calls no server
 * function; every value on it is a literal in this file. So it is public in
 * development and ABSENT in production.
 */

export const Route = createFileRoute("/meridian")({
  beforeLoad: () => {
    // Dev only. In a production build the route does not exist at all, rather
    // than existing and rendering nothing, so it cannot be found by guessing.
    if (!import.meta.env.DEV) throw notFound();
  },
  component: MeridianGallery,
});

const NOW = Date.UTC(2026, 7, 14, 8, 30) as number;
const H = 3_600_000;

/*
 * Real data, not fixtures. These are actual pending gates and the actual work
 * each one holds up, measured in production on 2026-08-14. Invented sample text
 * is uniformly short and uniformly polite, and it hides exactly the wrapping
 * and truncation problems real titles cause.
 */
const STALLED: StalledItem[] = [
  {
    id: "g1",
    asking: "Grouping signals",
    since: NOW - 86 * H,
    blocking: "Homeowners cannot tell a real outage from a firmware reboot",
    allowLabel: "Let it group",
  },
  {
    id: "g2",
    asking: "Grouping signals",
    since: NOW - 83 * H,
    blocking: "Checklist steps vanish when the crew drops signal in a basement",
    allowLabel: "Let it group",
  },
  {
    id: "g3",
    asking: "Grouping signals",
    since: NOW - 52 * H,
    blocking: "SDK install is a drop-off cliff",
    allowLabel: "Let it group",
  },
  {
    id: "g4",
    asking: "Reading new signals",
    since: NOW - 9 * H,
    blocking: "Checkout and notification friction in the homeowner app",
    allowLabel: "Let it read",
  },
  {
    id: "g5",
    asking: "Finding patterns",
    since: NOW - 30 * H,
    reason: "source",
  },
];

const SHORT = STALLED.slice(0, 3);

/*
 * ── ACCENT CANDIDATES ───────────────────────────────────────────────────
 *
 * The accent answers one question and only one: A PERSON IS REQUIRED. It is
 * the loudest thing the product can say, so it is worth choosing rather than
 * defaulting into.
 *
 * Two have already been rejected on sight, and the reasons are worth keeping
 * because they narrow the search rather than just eliminating a swatch:
 *   gold / mustard   reads as a generated palette, the reflex every AI
 *                    dashboard reaches for
 *   orchid / violet  reads as consumer rather than instrument
 *
 * Red, green and blue were already spoken for by failure, success and machine
 * activity, so the space left was almost nothing. The way out was to stop
 * spending a hue on "a machine is working": that state is AMBIENT, it is
 * already carried by motion and by a live elapsed figure, and it never needed
 * a colour of its own. Retiring it reopens the entire cool half of the wheel
 * for the one state that genuinely competes for attention.
 *
 * Each candidate is given per-ground values. A hue that clears contrast on
 * near-black does not clear it on paper, so both are chosen, never derived.
 */
type Candidate = {
  name: string;
  note: string;
  dark: { you: string; dim: string };
  light: { you: string; dim: string };
};

const CANDIDATES: Candidate[] = [
  {
    name: "Aqua",
    note: "Instrument teal. Reads as a measuring device rather than a brand, and it is the furthest thing on the wheel from failure red, so 'this needs you' can never be misread as 'this broke'. The safest of the four, and the least surprising.",
    dark: { you: "oklch(0.82 0.125 195)", dim: "oklch(0.62 0.085 195)" },
    light: { you: "oklch(0.52 0.105 195)", dim: "oklch(0.64 0.075 195)" },
  },
  {
    name: "Coral",
    note: "Warm clay. The most human of the four and the only warm option left, which suits a signal that means a person is needed. Its risk is real and worth seeing: it sits nearest failure red, so judge these two side by side before choosing it.",
    dark: { you: "oklch(0.75 0.145 42)", dim: "oklch(0.58 0.1 42)" },
    light: { you: "oklch(0.56 0.16 42)", dim: "oklch(0.68 0.11 42)" },
  },
  {
    name: "Chartreuse",
    note: "Acid lime. The highest visibility of the four on a dark ground and genuinely uncommon in enterprise software. Its risk is the opposite of coral's: it is the closest to success green, so check that a stalled row never reads as a finished one.",
    dark: { you: "oklch(0.88 0.17 122)", dim: "oklch(0.68 0.12 122)" },
    light: { you: "oklch(0.52 0.13 122)", dim: "oklch(0.64 0.1 122)" },
  },
  {
    name: "Ice",
    note: "Near-white with a cool cast. Emphasis by luminance rather than by hue, so it is the only candidate that cannot clash with anything and the only one that survives greyscale perfectly. Quietest of the four, which is either its virtue or its failure.",
    dark: { you: "oklch(0.93 0.045 210)", dim: "oklch(0.7 0.03 210)" },
    light: { you: "oklch(0.42 0.06 210)", dim: "oklch(0.58 0.045 210)" },
  },
];

function accentVars(v: { you: string; dim: string }): CSSProperties {
  return { "--mrd-you": v.you, "--mrd-you-dim": v.dim } as CSSProperties;
}

function Ground({
  label,
  light,
  style,
  children,
}: {
  label: string;
  light?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      {...(light ? { "data-theme": "light" } : {})}
      className="rounded-mrd-card border border-mrd-line bg-mrd-bg p-6"
      style={{ boxShadow: "var(--mrd-shadow-card)", ...style }}
    >
      <p className="mb-4 font-mrd-mono text-[11px] tracking-wide text-mrd-mute uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="border-t border-mrd-line py-10">
      <header className="mb-6">
        <h2 className="text-[20px] leading-tight font-medium text-mrd-ink">{title}</h2>
        <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-mrd-body">{note}</p>
      </header>
      {children}
    </section>
  );
}

function MeridianGallery() {
  return (
    /*
     * The page sits in the RECESS and the panels sit on the CANVAS above it.
     * Painting panels `bg-mrd-bg` on a `bg-mrd-bg` page made the dark column
     * vanish as an object while the paper column read as a card: same token,
     * same code, invisible on one ground only. Found by rendering it.
     */
    <div className="min-h-screen bg-mrd-sink">
      <div className="mx-auto max-w-[1180px] px-8 py-12">
        <header>
          <h1 className="text-[32px] leading-tight font-semibold text-mrd-ink">Meridian</h1>
          <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-mrd-body">
            Every component, in both grounds, before it is wired to anything. One accent, and it
            says exactly one thing: a person is required. Green and red are outcome, never need.
          </p>
        </header>

        <Panel
          title="Pick the accent"
          note="Four candidates on the same component, same data, both grounds. Gold was rejected as a generated palette and violet as consumer rather than instrument, so these avoid both. Judge them on one question: does the three-day row demand a person, without the nine-hour row shouting, and without either being mistaken for something that failed or something that finished."
        >
          <div className="flex flex-col gap-10">
            {CANDIDATES.map((c) => (
              <div key={c.name}>
                <div className="mb-3">
                  <h3 className="text-[16px] font-medium text-mrd-ink">{c.name}</h3>
                  <p className="mt-0.5 max-w-[72ch] text-[12.5px] leading-relaxed text-mrd-mute">
                    {c.note}
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Ground label={`${c.name} on dark`} style={accentVars(c.dark)}>
                    <StalledWork items={SHORT} now={NOW} />
                  </Ground>
                  <Ground label={`${c.name} on paper`} light style={accentVars(c.light)}>
                    <StalledWork items={SHORT} now={NOW} />
                  </Ground>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Loading state"
          note="An elapsed figure, because what shipped says what is being read and never how long, so a slow job and a hung job are the same pixels. Three variants, and the timings differ on purpose: the drive cycle is shorter than its sweep so two fronts are always in flight, and the orbit is slower because one travelling cell at the same speed reads as a glitch."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Ground label="Dark">
              <div className="flex flex-col gap-5">
                <LoadingState label="Reading the record" variant="Drive" />
                <LoadingState label="Grouping signals" variant="Dots" />
                <LoadingState label="Writing the spec" variant="Orbit" />
              </div>
            </Ground>
            <Ground label="Paper" light>
              <div className="flex flex-col gap-5">
                <LoadingState label="Reading the record" variant="Drive" />
                <LoadingState label="Grouping signals" variant="Dots" />
                <LoadingState label="Writing the spec" variant="Orbit" />
              </div>
            </Ground>
          </div>
        </Panel>

        <Panel
          title="Stalled work, full"
          note="Real gates measured in production on 2026-08-14. Twelve were pending, the oldest since 18:31 on 10 August, and nothing anywhere told anyone. Age drives the emphasis through elevation and weight as well as hue, so the oldest is still obviously the oldest in greyscale. One row is stopped for a different reason and deliberately carries no accent: connecting a source is a setup act, not a decision."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Ground label="Dark">
              <StalledWork items={STALLED} now={NOW} />
            </Ground>
            <Ground label="Paper" light>
              <StalledWork items={STALLED} now={NOW} />
            </Ground>
          </div>
        </Panel>

        <Panel
          title="Stalled work, empty"
          note="Nothing stopped is the state everyone wants, so it gets one sentence and silence. No illustration, no exclamation, no call to action."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Ground label="Dark">
              <StalledWork items={[]} now={NOW} />
            </Ground>
            <Ground label="Paper" light>
              <StalledWork items={[]} now={NOW} />
            </Ground>
          </div>
        </Panel>
      </div>
    </div>
  );
}
