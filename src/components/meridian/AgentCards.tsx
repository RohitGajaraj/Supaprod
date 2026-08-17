import type { ReactNode } from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";

/*
 * AGENT CARDS. One card per agent, opening onto that agent.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 * Founder, on the Agents group: "for each agent, it needs to be each agent card",
 * showing the crew first, each opening a full panel. The roster was a list of tight
 * rows -- correct, dense, and giving no agent any presence at all. A person cannot
 * form a relationship with a table row, and this product's entire claim is that these
 * are colleagues who do the work.
 *
 * Reference: ElevenLabs' voice grid, supplied by the founder. What is taken from it
 * is the SHAPE of the thing -- a generous card, a strong identity mark, the name
 * leading, one quiet line under it, and the whole card being the way in.
 *
 * ── WHAT IS DELIBERATELY NOT TAKEN: THE COLOUR ──────────────────────────────
 * The reference gives every voice a coloured gradient orb, and that is what carries
 * identity there. Meridian cannot: law 4 is "identity is shape, status is hue", and
 * painting identity as a colour ramp has been found and removed from this product
 * THREE separate times. Spending hue on which agent this is would leave nothing to
 * say a person is needed, which is the one thing colour must mean here.
 *
 * So the identity is the GLYPH, one drawing per agent, and hue stays free to report
 * state. That is not a compromise on the reference; it is the same job done with the
 * axis this system reserves for it, and it survives greyscale, which the reference
 * does not.
 *
 * ── THE GRID USES THE WIDTH IT IS GIVEN ─────────────────────────────────────
 * `auto-fill` with a min track, never a fixed column count. The founder's separate
 * complaint about these surfaces was that they cap themselves and force a scroll
 * while screen space sits unused. Two cards on a narrow pane and six on a wide
 * monitor, from one rule.
 */

export type AgentCard = {
  slug: string;
  name: string;
  /** What this one is for, in one short line. */
  role?: string;
  /** Switched off entirely. Rendered quiet rather than hidden: absence is a fact. */
  enabled?: boolean;
  /**
   * How much rope it has. Only two states are drawn, because only two matter at a
   * glance: does it act on its own, or does it stop and ask.
   */
  runsAlone?: boolean;
  /** How many things it is waiting on a person for. The one use of `you`. */
  waiting?: number;
};

/**
 * The state line, and the only place hue is spent.
 *
 * `you` when a person is required, which is the founder's "only core USP" made
 * visible and must never be spent on anything else. `hold` when switched off, because
 * that is stopped-on-a-condition rather than a person. Otherwise nothing: an agent
 * quietly running correctly is the normal case and does not need a colour.
 */
function StateLine({ card }: { card: AgentCard }) {
  const waiting = card.waiting ?? 0;

  if (waiting > 0) {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: "var(--mrd-you)" }}>
        <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--mrd-you)" }} />
        {waiting === 1 ? "Asking you" : `${waiting} asking you`}
      </span>
    );
  }
  if (card.enabled === false) {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--mrd-hold)" }}>
        <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--mrd-hold)" }} />
        Switched off
      </span>
    );
  }
  return (
    <span className="text-[11.5px] text-mrd-mute">
      {card.runsAlone ? "Runs on its own" : "Asks before it acts"}
    </span>
  );
}

export function AgentCards({
  cards,
  onOpen,
  activeSlug,
  /** Min track width. 232px fits the longest agent name in the catalog on one line. */
  minCardWidth = 232,
  empty,
}: {
  cards: readonly AgentCard[];
  onOpen: (slug: string) => void;
  activeSlug?: string | null;
  minCardWidth?: number;
  empty?: ReactNode;
}) {
  if (cards.length === 0) return <div data-mrd="">{empty ?? null}</div>;

  return (
    <div
      data-mrd=""
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
    >
      {cards.map((card, index) => {
        const Glyph = glyphForSlug(card.slug);
        const isActive = card.slug === activeSlug;
        const off = card.enabled === false;

        return (
          <button
            key={card.slug}
            type="button"
            onClick={() => onOpen(card.slug)}
            aria-current={isActive ? "true" : undefined}
            className={`group flex flex-col items-start gap-2.5 rounded-mrd-card border p-3 text-left transition-[background-color,border-color,transform] active:scale-[0.985] ${
              isActive
                ? "border-mrd-edge bg-mrd-select"
                : "border-mrd-line bg-mrd-sheet hover:border-mrd-edge hover:bg-mrd-lift"
            }`}
            style={{
              boxShadow: "var(--mrd-shadow-card)",
              transitionDuration: "var(--mrd-d-press)",
              /* Staggered arrival, capped, so a roster of twenty does not still be
                 landing a second and a half after the reader started looking. */
              animation: `mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) ${Math.min(index * 45, 400)}ms both`,
            }}
          >
            <span className="flex w-full items-start gap-2.5">
              {/*
               * The identity, and the only thing carrying it. A tinted WELL rather
               * than a filled disc: a solid fill at this size reads as a status dot,
               * which is the one meaning it must not take.
               *
               * Dimmed when switched off, so the card is legible as inactive without
               * spending a status hue on it.
               */}
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-mrd-line bg-mrd-sink"
                style={{ color: off ? "var(--mrd-faint)" : "var(--mrd-body)" }}
              >
                <Glyph />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className="truncate text-[13.5px] font-medium"
                  style={{ color: off ? "var(--mrd-mute)" : "var(--mrd-ink)" }}
                >
                  {card.name}
                </span>
                <StateLine card={card} />
              </span>
            </span>

            {card.role && (
              /* Two lines, clamped. A card is scanned, and a paragraph in a grid cell
                 is the "dump of content" this redesign exists to stop. */
              <span className="line-clamp-2 text-[12px] leading-snug text-mrd-mute">
                {card.role}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AgentCards;
