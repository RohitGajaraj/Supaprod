/**
 * THE RUN NEVER CLAIMS A STATE DURING ITS FIRST READ.
 *
 * The moment this surface exists for is the handover from /start: a person
 * types one sentence, lands on the run, and the first thing presence says must
 * be TRUE. While `getTrack` is in flight the only derivable state is
 * out-of-touch -- "I can't find this piece of work" -- which is a false alarm
 * at the exact second somebody has just handed work over. These tests pin the
 * seam that fixes it (`RunPresence`): loading says reading and mounts nothing;
 * a settled read defers every word to `deriveCharacter`; a genuinely failed
 * read still gets out-of-touch, because THAT claim is true.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { PRESENCE_NAME, READING_LINE, RunPresence } from "./RunPresence";
import type { PresenceInput } from "@/lib/presence/character";

const input = (over: Partial<PresenceInput> = {}): PresenceInput => ({
  track: { status: "open", holdReason: null, drivenAt: null },
  result: null,
  walking: false,
  continuing: false,
  ...over,
});

describe("RunPresence", () => {
  it("while the first read is in flight it says reading, and claims no state", () => {
    const { container } = render(<RunPresence loading input={input({ track: null })} />);
    expect(container.textContent).toContain(READING_LINE);
    // No character mark mounted: nothing on screen may wear a state the data
    // cannot prove yet.
    expect(container.querySelector("[data-presence-state]")).toBeNull();
  });

  it("never speaks the false alarm while loading", () => {
    const { container } = render(<RunPresence loading input={input({ track: null })} />);
    expect(container.textContent).not.toContain("can't find");
  });

  it("once the read settles, the character derives and its name shows", () => {
    const { container } = render(<RunPresence loading={false} input={input()} />);
    expect(container.textContent).toContain(PRESENCE_NAME);
    expect(container.textContent).not.toContain(READING_LINE);
    expect(container.querySelector('[data-presence-state="awake"]')).not.toBeNull();
  });

  it("a settled-but-missing row is still out of touch -- that claim is true", () => {
    const { container } = render(
      <RunPresence loading={false} input={input({ track: null })} />,
    );
    expect(container.textContent).toContain("can't find");
  });
});
