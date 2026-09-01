/**
 * THE RUN NEVER CLAIMS A STATE DURING ITS FIRST READ.
 *
 * The moment this surface exists for is the handover from /start: a person
 * types one sentence, lands on the run, and the first thing presence says must
 * be TRUE. While `getTrack` is in flight the only derivable state used to be
 * out-of-touch -- "I can't find this piece of work" -- a false alarm at the
 * exact second somebody has just handed work over.
 *
 * S0 shipped the clean fix (A-001 §3): `PresenceInput.loading` reaches
 * `deriveCharacter`, which answers awake / "Reading this piece of work now."
 * -- presence, honestly, with no run claimed. These tests pin the seam as it
 * now works: loading derives the reading line through the character itself, a
 * settled read derives its own state, and a genuinely failed read still gets
 * out-of-touch because THAT claim is true.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { READING_LINE, RunPresence } from "./RunPresence";
import type { PresenceInput } from "@/lib/presence/character";

const input = (over: Partial<PresenceInput> = {}): PresenceInput => ({
  track: { status: "open", holdReason: null, drivenAt: null },
  result: null,
  walking: false,
  continuing: false,
  ...over,
});

describe("RunPresence", () => {
  it("while the first read is in flight it says reading -- derived, not staged", () => {
    const { container } = render(<RunPresence loading input={input({ track: null })} />);
    expect(container.textContent).toContain(READING_LINE);
    // Awake is the honest state for "present, nothing proven yet": no working,
    // no thinking, and never a smile on a feed that has not spoken.
    expect(container.querySelector('[data-presence-state="awake"]')).not.toBeNull();
  });

  it("never speaks the false alarm while loading", () => {
    const { container } = render(<RunPresence loading input={input({ track: null })} />);
    expect(container.textContent).not.toContain("can't find");
  });

  it("once the read settles, the character derives its own sentence", () => {
    const { container } = render(<RunPresence loading={false} input={input()} />);
    expect(container.textContent).toContain("Supa");
    expect(container.textContent).not.toContain(READING_LINE);
  });

  it("a settled-but-missing row is still out of touch -- that claim is true", () => {
    const { container } = render(<RunPresence loading={false} input={input({ track: null })} />);
    expect(container.textContent).toContain("can't find");
  });
});
