import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { deriveCharacter } from "@/lib/presence/character";

/**
 * THE PRODUCT'S OWN VOICE IS NOT CLIPPED.
 *
 * Caught on a screenshot of the running product: the presence line carried
 * Tailwind's `truncate`, which is `nowrap` plus an ellipsis, so the run screen
 * showed *"I've stopped, the reason is on the hold line. I'll carry ..."* and
 * threw away the half that said what happens next.
 *
 * Every sentence this character says is written to be read whole, and several
 * are two clauses where the second is the reassurance. Clipping the voice to
 * keep a row height fixed has the priority backwards, which is why this is a
 * test and not a preference.
 */
describe("the character's line", () => {
  const SRC = readFileSync("src/components/presence/Character.tsx", "utf-8");

  it("is not truncated or clamped on the surface that speaks it", () => {
    /*
     * Asserted on the CLASS LIST of the line itself rather than on the file's
     * text. The first version searched the whole module and failed on the word
     * "truncate" inside the comment explaining why it was removed, which is a
     * guard that punishes writing down the reason.
     */
    const m = SRC.match(/<p aria-live="polite" className="([^"]*)"/);
    expect(m).not.toBeNull();
    const classes = (m?.[1] ?? "").split(/\s+/);
    for (const banned of ["truncate", "line-clamp-1", "line-clamp-2", "whitespace-nowrap"]) {
      expect(classes).not.toContain(banned);
    }
  });

  it("says sentences long enough that clipping would lose their point", () => {
    /*
     * The reason the rule matters, asserted from the derivation rather than
     * from an opinion: these lines are not labels. If they ever become short
     * enough to fit on one line at any width, this test stops being load-bearing
     * and can go.
     */
    const outOfTouch = deriveCharacter({
      loading: false,
      track: null,
      walking: false,
      crewLive: false,
      feedFailed: true,
    } as Parameters<typeof deriveCharacter>[0]);

    expect(outOfTouch.line.length).toBeGreaterThan(40);
  });
});
