/**
 * NOT BACK YET IS NOT NOT THERE (S1 → S0, 2026-08-26).
 *
 * `/track/:id?start=true` mounts before the first read resolves, so `track` is
 * null and `deriveCharacter` answered `out-of-touch` — *"I can't find this piece
 * of work"*. That is **the first sentence the character says after being handed
 * work**, it is a false alarm, and it lands on the surface the whole product is
 * judged by in sixty seconds. S1 found it, patched around it in its own prefix by
 * not mounting the character until the read settled, and asked for the fix
 * underneath so every future mount inherits it.
 *
 * The ordering is the other half of the fix and is pinned below: a dead feed
 * still outranks it, and once the read settles the honest "cannot find" returns.
 */
import { describe, expect, it } from "bun:test";

import { deriveCharacter } from "./character";

const base = {
  result: null,
  walking: false,
  continuing: false,
  feedDead: false,
} as const;

describe("the first read is not a missing track", () => {
  it("says it is reading, rather than that it cannot find the work", () => {
    const p = deriveCharacter({ ...base, track: null, loading: true });
    expect(p.line).toContain("Reading");
    expect(p.line).not.toContain("can't find");
  });

  it("claims only presence, because nothing about a run has been read yet", () => {
    // `working` and `thinking` both assert a run is in flight, which is exactly
    // what has not come back. A state the data cannot prove is not drawn.
    expect(deriveCharacter({ ...base, track: null, loading: true }).state).toBe("awake");
  });

  it("still says it cannot find the work once the read has settled", () => {
    const p = deriveCharacter({ ...base, track: null, loading: false });
    expect(p.state).toBe("out-of-touch");
    expect(p.line).toContain("can't find");
  });

  it("a dead feed still outranks it, because we must never smile on one", () => {
    const p = deriveCharacter({ ...base, track: null, loading: true, feedDead: true });
    expect(p.state).toBe("out-of-touch");
    expect(p.line).toContain("lost sight");
  });

  it("absent `loading` behaves exactly as before", () => {
    expect(deriveCharacter({ ...base, track: null }).state).toBe("out-of-touch");
  });

  it("a real track is unaffected by the flag", () => {
    const track = { status: "open", holdReason: null, drivenAt: null };
    const withFlag = deriveCharacter({ ...base, track, loading: true });
    const without = deriveCharacter({ ...base, track });
    expect(withFlag).toEqual(without);
  });
});

/**
 * P-43 (A-QUEUE.md). "I'm ready, press run" said after the person already
 * had -- `walking` reads the record, not this tab's own press, so there is a
 * real window where the record has not caught up yet.
 */
describe("never invites a press that already happened", () => {
  const track = { status: "open", holdReason: null, drivenAt: null };

  it("invites the press when none has been made", () => {
    const p = deriveCharacter({ ...base, track, pressedRun: false });
    expect(p.line).toBe("I'm ready, press run and I'll walk this from the top.");
  });

  it("acknowledges rather than re-inviting, once one has", () => {
    const p = deriveCharacter({ ...base, track, pressedRun: true });
    expect(p.line).toBe("Starting this up.");
    expect(p.line).not.toContain("press run");
  });

  it("does not claim the work is running -- that would be a state the record has not proven", () => {
    const p = deriveCharacter({ ...base, track, pressedRun: true });
    expect(p.state).toBe("awake");
  });

  it("absent `pressedRun` behaves exactly as before", () => {
    expect(deriveCharacter({ ...base, track }).line).toBe(
      "I'm ready, press run and I'll walk this from the top.",
    );
  });
});
