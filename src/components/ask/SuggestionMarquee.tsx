/**
 * THE WAY IN, AS THREE MOVING ROWS.
 *
 * Founder ruling, 2026-07-30, on the two stacked lists this replaces: *"in
 * workspace you have two messages, in what you can do you have three. Instead
 * of this, can we have two or three lines maximum combining everything... three
 * rows should be good enough. So we scroll the possible templates from left to
 * right for the first row, and for the second row right to left, and for the
 * third row again left to right. Enclosed in a box and highlighted with some
 * very thin hairline border colours. So that the user would see all the
 * possible use cases. And when he clicks, that comes into the chat and
 * continues from there."*
 *
 * WHAT IT BUYS. Two headed lists cost about 340px of a 392px pane to show five
 * suggestions. Three rows show thirteen in about 120px, and the movement is
 * doing real work rather than decoration: a strip that travels tells you there
 * is more than you can see, which is the honest version of a list that was
 * silently truncated at three.
 *
 * THE RULES THIS MOTION OBEYS, because a marquee is very easy to get wrong:
 *   · IT STOPS WHEN YOU REACH FOR IT. Hover or keyboard focus anywhere in the
 *     strip pauses every row. Asking someone to click a moving target is the
 *     single worst thing this pattern does, and it is not done here.
 *   · IT IS SLOW. Forty seconds a lap, three different durations so the rows
 *     never lock into one block sliding sideways. This sits under a composer
 *     someone is reading; it has to be catchable in peripheral vision without
 *     ever becoming the thing you are trying to ignore.
 *   · IT IS NOT A BLINK. `gate` blinks and is still the only blink in the
 *     system. This travels, at constant opacity, and cannot be mistaken for
 *     something demanding a decision.
 *   · REDUCED MOTION GETS A REAL STRIP, not a frozen one: the animation stops
 *     and each row becomes an ordinary horizontal scroller, so every suggestion
 *     is still reachable. Nothing is hidden from anybody.
 *
 * THE ACCESSIBILITY TRAP, and how it is avoided. A seamless loop needs the
 * content rendered more than once. Every copy after the first is
 * `aria-hidden` with its buttons taken out of the tab order, so a screen reader
 * and the Tab key each meet every suggestion EXACTLY ONCE. Without that, this
 * component would read thirty-nine buttons aloud where there are thirteen.
 */

import * as React from "react";
import { marqueeRows, type Starter } from "@/lib/ask-starters";

/** How many times a row's content is laid end to end. Three guarantees the
 *  track is wider than the pane even when a row holds two short chips, so the
 *  loop never shows a gap; the animation travels exactly one copy. */
const COPIES = 3;

/** Seconds per lap, per row. Different primes so the three rows drift out of
 *  phase instead of marching. */
const SECONDS = [43, 37, 47];

function Chip({ item, onPick }: { item: Starter; onPick: (prompt: string) => void }) {
  return (
    <button
      type="button"
      className="sp-chip"
      data-kind={item.kind}
      /* THE NAME IS THE SENTENCE IT INSERTS, not the two fragments on screen.
         A grounded chip reads visually as "Ship SSO login for Beacon" above
         "What is the crew doing on it?", which is right for the eye and wrong
         for the ear: spoken as one run they become "Ship SSO login for Beacon
         what is the crew doing on it", and "it" has no antecedent to someone
         who cannot see the layout. The label says exactly what pressing it
         will put in the box. */
      aria-label={item.prompt}
      onClick={() => onPick(item.prompt)}
    >
      {/* The only colour on the strip, and it MEANS something: the live blue the
          shell already uses for work in motion. A finished run and a use case
          get no dot, because nothing is happening and nothing should glow. */}
      {item.kind === "running" ? <span className="sp-chip-dot" aria-hidden="true" /> : null}
      {item.subject ? (
        <>
          <span className="sp-chip-subject">{item.subject}</span>
          <span className="sp-chip-q">{item.question}</span>
        </>
      ) : (
        <span className="sp-chip-q">{item.question}</span>
      )}
    </button>
  );
}

export function SuggestionMarquee({
  items,
  onPick,
}: {
  /** Grounded chips first; they are dealt across the rows from the front. */
  items: Starter[];
  /** A press puts the whole sentence in the composer, where it continues. */
  onPick: (prompt: string) => void;
}) {
  const rows = React.useMemo(() => marqueeRows(items), [items]);
  if (rows.length === 0) return null;

  return (
    <div className="sp-marquee" aria-label="Things you could ask">
      {rows.map((row, r) => (
        <div className="sp-marquee-row" key={r}>
          <div
            className="sp-marquee-track"
            // Odd rows run the other way, which is the founder's ask and also
            // what stops three rows reading as one sliding block.
            data-dir={r % 2 === 1 ? "rtl" : "ltr"}
            style={{ animationDuration: `${SECONDS[r % SECONDS.length]}s` }}
          >
            {Array.from({ length: COPIES }, (_, copy) => (
              <div
                className="sp-marquee-copy"
                key={copy}
                // Copies 2 and 3 exist only so the loop has no seam.
                aria-hidden={copy > 0 ? "true" : undefined}
                inert={copy > 0 ? true : undefined}
              >
                {row.map((item) => (
                  <Chip key={item.prompt} item={item} onPick={onPick} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
