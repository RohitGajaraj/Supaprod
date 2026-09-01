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
  /**
   * Which station this one works at, used as a heading.
   *
   * ── WHY GROUP AT ALL ────────────────────────────────────────────────────
   * Founder: "should we differentiate it based on the categories here?" -- naming
   * Discover holding Watch, Research and Listen, and Decide holding Challenge and
   * Chief of Staff.
   *
   * Eighteen cards in one grid is a wall, and the grouping is not invented for the
   * layout: the station is what the agent IS in this product's own vocabulary, it is
   * stored on every row, and it is the order the loop runs in. Reading the roster down
   * the spine also answers the question a person actually has -- "who is working on the
   * part I am looking at" -- which an alphabetical grid cannot.
   */
  group?: string;
};

/**
 * The state line, and the only place hue is spent.
 *
 * `you` when a person is required, which is the founder's "only core USP" made
 * visible and must never be spent on anything else. `hold` when switched off, because
 * that is stopped-on-a-condition rather than a person. Otherwise nothing: an agent
 * quietly running correctly is the normal case and does not need a colour.
 */
function StateLine({ card, sayTheSteadyState }: { card: AgentCard; sayTheSteadyState: boolean }) {
  const waiting = card.waiting ?? 0;

  if (waiting > 0) {
    return (
      <span
        className="flex items-center gap-1.5 text-mrd-data font-medium"
        style={{ color: "var(--mrd-you)" }}
      >
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ background: "var(--mrd-you)" }}
        />
        {waiting === 1 ? "Asking you" : `${waiting} asking you`}
      </span>
    );
  }
  if (card.enabled === false) {
    return (
      <span
        className="flex items-center gap-1.5 text-mrd-data"
        style={{ color: "var(--mrd-hold)" }}
      >
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ background: "var(--mrd-hold)" }}
        />
        Switched off
      </span>
    );
  }
  /*
   * ── SIXTEEN CARDS, SIXTEEN COPIES OF ONE SENTENCE (2026-09-01) ───────────
   * Photographed on Settings -> Who works here: every card in the roster ended
   * with the words "Runs on its own", in the same grey, in the same position.
   * A value that is identical on every row distinguishes nothing -- it is
   * sixteen repetitions of a fact the page heading had already stated once
   * ("16 run without asking you, 0 ask first"), and it is the last line the
   * eye lands on before moving to the next card.
   *
   * THE COMPONENT ABOVE THIS BRANCH WAS ALREADY RIGHT and that is what makes
   * the branch wrong. Hue is spent only on the exceptions -- orchid when a
   * person is required, amber when an agent is switched off -- so the design
   * already holds the rule that the abnormal gets the ink. Then the steady
   * state printed anyway, on every card, in every group, forever.
   *
   * So it prints when it DISCRIMINATES and is silent when it does not.
   * `sayTheSteadyState` is false exactly when every steady card in the roster
   * agrees; the moment one agent asks first, all of them say which they are
   * and the difference is readable at a glance. This is the same rule
   * `crew.tsx` already applies to its own summary line, which collapses to
   * "All 16 run without asking you" rather than naming a zero.
   *
   * The two branches above are never suppressed. An agent waiting on a person
   * and an agent switched off are the facts a reader came for.
   */
  if (!sayTheSteadyState) return null;
  return (
    <span className="text-mrd-data text-mrd-mute">
      {card.runsAlone ? "Runs on its own" : "Asks before it acts"}
    </span>
  );
}

/**
 * Is this card in the ordinary state -- nobody waiting on it, not switched off?
 * Only these are compared: a roster of fifteen that run alone plus one that is
 * asking you is still UNIFORM in its steady state, and the one asking keeps its
 * orchid line regardless.
 */
function isSteady(card: AgentCard): boolean {
  return (card.waiting ?? 0) === 0 && card.enabled !== false;
}

export function AgentCards({
  cards,
  onOpen,
  activeSlug,
  /** Min track width. 232px fits the longest agent name in the catalog on one line. */
  minCardWidth = 232,
  empty,
  renderDetail,
}: {
  cards: readonly AgentCard[];
  onOpen: (slug: string) => void;
  activeSlug?: string | null;
  minCardWidth?: number;
  empty?: ReactNode;
  /**
   * The open agent, drawn INLINE directly beneath its own group.
   *
   * ── WHY A SLOT AND NOT A ROUTE ──────────────────────────────────────────────
   * Founder: "when I click on a particular agent, let's say I'm clicking on Verify,
   * what is Verify all about? It needs to show there itself ... that needs to be
   * inline after clicking", and on the shape it replaces: "why are there multiple
   * steps, like click on Roster and see only three cards, and then click on Open
   * Crew? Where is the patience for a human?"
   *
   * Three clicks and two screens to read one colleague. Now one click and none.
   *
   * ── WHY THE CONTENT IS THE CALLER'S ─────────────────────────────────────────
   * This component stays presentation-only. An agent's detail is real stored policy,
   * tool reach and track record, and pulling that query in here would make a Meridian
   * primitive depend on the crew data layer. The slot places it; the caller fills it.
   *
   * ── WHY UNDER THE GROUP AND NOT UNDER THE CARD ──────────────────────────────
   * The grid is `auto-fill`, so the column count is unknown at render time and there
   * is no way to close a row and reopen it after the clicked card without measuring.
   * Anchoring to the group keeps the panel a predictable distance from what was
   * clicked, and never moves the card the reader just pressed.
   */
  renderDetail?: (slug: string) => ReactNode;
}) {
  if (cards.length === 0) return <div data-mrd="">{empty ?? null}</div>;

  /* Groups in the order the cards arrive, so the caller owns the sequence and this
     component never re-sorts the loop into alphabetical order. */
  const groups: (string | undefined)[] = [];
  for (const card of cards) if (!groups.includes(card.group)) groups.push(card.group);

  /* Measured across the WHOLE roster rather than per group, because that is the
     set the reader is scanning. Per group, a run of five identical lines would
     still be five identical lines. */
  const steady = cards.filter(isSteady);
  const sayTheSteadyState = steady.some((c) => c.runsAlone !== steady[0]?.runsAlone);

  return (
    <div data-mrd="" className="flex flex-col" style={{ gap: "var(--mrd-s5)" }}>
      {groups.map((group) => (
        <div key={group ?? "__ungrouped"} className="flex flex-col gap-2">
          {group && (
            /* The same quiet micro heading the rail uses for its own groups, so a
               station heading reads identically wherever it appears. */
            <div className="text-mrd-micro font-medium tracking-[0.08em] text-mrd-mute uppercase">
              {group}
            </div>
          )}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
          >
            {cards
              .filter((c) => c.group === group)
              .map((card, index) => {
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
                        /*
                         * ILLUMINATES ON HOVER, and the mark is SIZED rather than left to fill
                         * the well.
                         *
                         * Founder, on the first version: the glyphs "look too big" and read
                         * thicker than they should. Both were one cause -- the drawings carry a
                         * 16px viewBox and no width, so they stretched to the full 36px well,
                         * which scales the stroke with them. Constraining the mark to 18px
                         * restores the weight it was drawn at and leaves the well as breathing
                         * room instead of a frame around a swollen icon.
                         *
                         * The hover lift is his "illuminated with some brand color very subtly".
                         * It is done on the NEUTRAL ladder rather than with an accent: the well
                         * steps sink -> lift and the mark steps body -> ink. meridian.css records
                         * that a saturated accent on chrome was tried twice and rejected twice,
                         * because spending it here leaves nothing louder for "your call". This
                         * reads as the mark catching the light, survives greyscale, and keeps
                         * every status hue free.
                         */
                        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-mrd-line bg-mrd-sink transition-[background-color,color] group-hover:bg-mrd-lift group-hover:text-mrd-ink"
                        style={{
                          color: off ? "var(--mrd-faint)" : "var(--mrd-body)",
                          transitionDuration: "var(--mrd-d-press)",
                        }}
                      >
                        <span className="flex size-[18px] items-center justify-center [&>svg]:size-full">
                          <Glyph />
                        </span>
                      </span>
                      {/*
                       * THE JOB LEADS, THE POLICY FOLLOWS, and the first version had it the
                       * other way round.
                       *
                       * Founder: every card said "Critic runs on its own / Verify runs on its
                       * own / Guide runs on its own" under the name, and "that should be
                       * somewhere down" -- the description of what it actually does belongs
                       * there instead.
                       *
                       * He is right on the merits. Three cards repeating one identical phrase
                       * is a column of noise that distinguishes nothing, and it was occupying
                       * the line the eye reads immediately after a name -- the line that should
                       * answer "what is this one for". The policy is worth knowing and worth
                       * knowing second.
                       *
                       * `you` is the exception and stays high: an agent WAITING on a person is
                       * not a policy, it is a call, and it must not be demoted below a blurb.
                       */}
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className="truncate text-mrd-prose text-mrd-body font-medium"
                          style={{ color: off ? "var(--mrd-mute)" : "var(--mrd-ink)" }}
                        >
                          {card.name}
                        </span>
                        {card.role ? (
                          <span className="line-clamp-2 text-mrd-small leading-mrd-snug text-mrd-mute">
                            {card.role}
                          </span>
                        ) : (
                          /* No description, so this slot is all the card has to say.
                             It is never suppressed: silence here would leave a bare
                             name and nothing else. */
                          <StateLine card={card} sayTheSteadyState />
                        )}
                      </span>
                    </span>

                    {/* The policy, on its own line at the foot of the card, where a reader
                scanning for "which of these needs me" finds it without it competing
                with the name. Drawn only when the description already took the slot
                above, so the fact is never stated twice. */}
                    {card.role && (sayTheSteadyState || !isSteady(card)) && (
                      <span className="mt-auto flex w-full items-center pt-0.5">
                        <StateLine card={card} sayTheSteadyState={sayTheSteadyState} />
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          {/* The open agent, inline, under the group it belongs to. */}
          {renderDetail &&
          activeSlug &&
          cards.some((c) => c.group === group && c.slug === activeSlug)
            ? renderDetail(activeSlug)
            : null}
        </div>
      ))}
    </div>
  );
}

export default AgentCards;
