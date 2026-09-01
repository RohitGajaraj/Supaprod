/**
 * `?queue=1` DID NOT WORK, AND IT IS THE ADDRESS WE DOCUMENT (2026-09-01).
 *
 * Walked signed in: `/start?queue=1` came back as `/start`. Param stripped,
 * composer at the top, no scroll to the queue. Every comment in
 * `_authenticated.start.tsx` calls this door `?queue=1`, and so does the commit
 * that built it.
 *
 * The router parses an unquoted `1` as the NUMBER 1; the check compared against
 * the STRING "1". `1 !== "1"`, so the expression fell through to `undefined`,
 * the router dropped a key it had been told was absent, and the address rewrote
 * itself to the bare page. No error, no empty state -- a person following a
 * link that names the queue simply gets the page for starting new work.
 *
 * `?queue=true` was the only form that worked, and it is the only one anybody
 * had walked, because it is what the rail happens to send.
 *
 * The coercion was inline in `validateSearch` and therefore unreachable from a
 * test. It is a pure function of one value; there was no reason for it to be
 * untestable, and being untestable is why it stayed wrong.
 */
import { describe, expect, it } from "bun:test";

import { asksForTheQueue } from "./_authenticated.start";

describe("the queue door", () => {
  it("answers to every form a person can actually type or send", () => {
    // The number is the one that was broken. `?queue=1` reaches the parser as 1.
    expect(asksForTheQueue(1)).toBe(true);
    // The string, for a router configured to keep search values as text.
    expect(asksForTheQueue("1")).toBe(true);
    // What the rail sends, and what the address normalises to.
    expect(asksForTheQueue(true)).toBe(true);
    expect(asksForTheQueue("true")).toBe(true);
  });

  it("does not open on a value that never meant yes", () => {
    // Scrolling a person 700px down a page they did not ask to be moved on is
    // its own defect, so the falsy side has to stay strict.
    for (const no of [undefined, null, "", 0, "0", false, "false", "yes", "queue", 2, {}, []]) {
      expect(asksForTheQueue(no)).toBe(false);
    }
  });
});
