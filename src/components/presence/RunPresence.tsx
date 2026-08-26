/**
 * THE RUN'S PRESENCE SLOT -- one passthrough, kept for its call sites.
 *
 * The distinction this file used to own is now IN the derivation:
 * `PresenceInput.loading` (S0, A-001 §3) makes `deriveCharacter` answer an
 * honest reading line while the first read is in flight, so the character
 * mounts from the first paint and every word still comes from
 * `deriveCharacter`. This slot forwards `loading` and renders nothing else on
 * its own behalf; its remaining job is being the stable seam TrackRunLeft
 * mounts, so a future change to presence has exactly one place to land here.
 */

import type { PresenceInput } from "@/lib/presence/character";

import { Character } from "./Character";

export function RunPresence({
  loading,
  input,
  size,
}: {
  /** The caller's first read is still in flight. */
  loading: boolean;
  /** Everything `Character` derives from. */
  input: PresenceInput;
  size?: number;
}) {
  return <Character input={{ ...input, loading }} size={size} />;
}

/**
 * Exported for the guard: the reading sentence the derivation answers, so a
 * wording drift breaks HERE rather than silently on screen.
 */
export const READING_LINE = "Reading this piece of work";

export default RunPresence;
