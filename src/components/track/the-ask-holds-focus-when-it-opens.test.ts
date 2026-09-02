/**
 * P-16 (A-QUEUE.md): "focus moves to the ask when it appears."
 *
 * WHY SOURCE, NOT A RENDER TEST. `one-station-display-on-the-run-screen.test.ts`
 * already names the reason for this whole directory: standing up `TrackConsent`
 * means mocking `useServerFn` four times over and the query/mutation layer
 * beneath it, and a guard whose scaffolding dwarfs its subject is a guard
 * nobody keeps current. So this pins the SHAPE of the fix -- a focus target
 * that only moves on a real 0-to-something transition, never on every poll --
 * rather than driving a real DOM. The live behaviour itself is asserted by
 * `e2e/p16-run-screen-focus-and-live-regions.spec.ts` against a real workspace.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./TrackConsent.tsx", import.meta.url), "utf8");

describe("TrackConsent moves focus to itself the instant a gate opens", () => {
  it("holds a ref on the card, as a focus target rather than a tab stop", () => {
    expect(src).toContain("const consentRef = React.useRef<HTMLDivElement>(null);");
    expect(src).toContain("ref={consentRef}");
    expect(src).toContain("tabIndex={-1}");
  });

  it("names what a screen reader hears when focus lands there", () => {
    expect(src).toContain(
      'aria-label={open.length > 0 ? "Your agent has stopped to ask you something"',
    );
  });

  it("fires only on a 0-to-something TRANSITION, never on every poll", () => {
    // The whole point of the guard: `TrackConsent` refetches every 10s while a
    // gate is open, and calling `.focus()` unconditionally on `openCount > 0`
    // would yank focus back here on every one of those polls, fighting a
    // person already reading the card or mid-decline-reason.
    expect(src).toContain("hadOpenGateRef");
    expect(src).toContain("if (openCount > 0 && !hadOpenGateRef.current)");
    expect(src).toContain("consentRef.current?.focus(");
  });
});
