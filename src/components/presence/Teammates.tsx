/**
 * MORE THAN ONE TEAMMATE, WHEN MORE THAN ONE IS GENUINELY WORKING.
 *
 * ── THE RULING, AND WHY IT IS NOT A CONTRADICTION ─────────────────────────
 * SPEC-PRESENCE ruled the crew becomes ONE character, because fifteen seat
 * slugs on screen are an org chart and nobody delegating work wants to meet a
 * roster. SPEC-MULTIPLAYER-PRESENCE §1 narrows that rather than overturning it:
 * the character is a SPECIES, not an individual.
 *
 *   one teammate acting   -> one character. The run surface is unchanged.
 *   two or more acting    -> each drawn, same body, its own colour, its own name.
 *
 * Hiding something true is not restraint, it is a missing feature: the product
 * knew two seats were working and drew one.
 *
 * ── THE IRON LAW, WHICH THIS FEATURE IS THE EASIEST PLACE TO BREAK ────────
 * A teammate is drawn ONLY while a run row says it is in flight. `liveSeats`
 * reads `outcome`, which `activity.ts` sets from the row's own status and never
 * infers from elapsed time. No run, no teammate. When it stops, it goes.
 *
 * There is no roster here and there never will be: you see a teammate because
 * it is doing something right now, which is exactly the org chart the original
 * ruling refused and this one keeps refusing.
 *
 * ── AND IT COSTS THE AGENTS NOTHING ───────────────────────────────────────
 * §2.5 answers the public objection that a layer like this makes agents read
 * each other and burn tokens on it. Nothing here is fed to any agent. It is a
 * read of rows that already exist, rendered for the one participant who needs
 * all of it at once and today gets none of it: the person.
 */
import { agentMark } from "@/lib/agent-vocabulary";

import { CharacterMark } from "./Character";

export type LiveSeat = {
  slug: string | null;
  /** The role name a person reads. Never the slug. */
  name: string;
  /** `waiting` is in flight too: the seat is mid-visit, held at a gate. */
  waiting: boolean;
};

export function Teammates({ seats }: { seats: LiveSeat[] }) {
  if (seats.length < 2) return null;

  return (
    <div data-mrd="" className="flex flex-col gap-mrd-2">
      <p className="mrd-meta">
        {seats.length} teammates are working on this right now.
      </p>
      <ul className="flex flex-wrap items-center gap-mrd-4">
        {seats.map((s) => (
          <li key={`${s.slug ?? "unknown"}:${s.name}`} className="flex items-center gap-mrd-2">
            <CharacterMark
              state={s.waiting ? "asking" : "working"}
              size={28}
              hue={agentMark(s.slug).hue}
              label={s.name}
            />
            <span className="text-mrd-base text-mrd-body">{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Teammates;
