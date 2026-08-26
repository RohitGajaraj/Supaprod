/**
 * THE RUN'S PRESENCE SLOT — what the person reads at the top of the transcript.
 *
 * THE DEFECT THIS EXISTS FOR. Between landing on `/track/:id?start=true` and
 * the first read settling, the only thing the presence derivation can be told
 * is `track: null` -- which derives "I can't find this piece of work", a false
 * alarm shown at the exact moment a person has just handed work over from
 * /start. A read that is IN FLIGHT is not a read that FAILED, and the iron law
 * only requires honesty about the second.
 *
 * So this slot owns the one distinction the derivation cannot see: while the
 * caller's read is loading it says plainly that it is reading, and mounts no
 * state at all. The moment a row exists -- or the read genuinely fails --
 * `Character` takes over and every word comes from `deriveCharacter`, never
 * from here. This file invents no state; it only declines to speak before
 * there is something true to say.
 *
 * Lives beside `Character` rather than inside it because the loading flag
 * belongs to the CALLER's query, and `src/lib/presence/character.ts` is S0's
 * path (filed: coordination/requests/S1/, so the distinction may yet move
 * into the derivation itself).
 */

import { CHARACTER_NAME, type PresenceInput } from "@/lib/presence/character";

import { Character } from "./Character";

export function RunPresence({
  loading,
  input,
  size,
}: {
  /** The caller's first read is still in flight. */
  loading: boolean;
  /** Everything `Character` would derive from once the read settles. */
  input: PresenceInput;
  size?: number;
}) {
  if (loading) {
    // Polite live region so the handover from this line to the character's
    // first derived sentence is heard as well as seen (R-19).
    return (
      <p className="mrd-meta" aria-live="polite">
        Reading this piece of work…
      </p>
    );
  }
  return <Character input={input} size={size} />;
}

/**
 * Exported for the guard: the one sentence this file may speak on its own.
 * Anything else it renders must come from the derivation.
 */
export const READING_LINE = "Reading this piece of work…";

/** Guard convenience: the name this slot defers to. */
export const PRESENCE_NAME = CHARACTER_NAME;
