/**
 * THE SAFETY ROOM SAID "YOUR SESSION ENDED" THREE TIMES ON ONE SCREEN.
 *
 * Seen rendered through the harness, not inferred: the room mounts
 * BoundaryControls and GuardrailsPanel side by side, both read through the same
 * session, and an expired one fails both. The pane banner says it, then each
 * block says it again inside its own correctly-formed failure box.
 *
 * That is the defect `SessionEnded` was written for, quoted in its own header:
 * "Brain drew five failure statements and four Try again buttons". Each block
 * was right on its own and the screen was wrong.
 *
 * THE SUPPRESSION IS NARROW AND THAT IS THE WHOLE DESIGN. Only a SESSION-ENDED
 * failure is hidden, and only when the caller says another panel is naming it.
 * A guardrails read that fails for any other reason still speaks, because that
 * failure is the panel's alone and nothing else on the surface reports it.
 * Hiding every failure behind a prop would trade a repeated sentence for a
 * missing one, which is the worse trade.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { endedSessionFor } from "@/components/system/SessionEnded";

function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const PANEL = code(readFileSync("src/components/governance/GuardrailsPanel.tsx", "utf8"));
const ROOM = code(readFileSync("src/components/engine-room/rooms/SafetyRoom.tsx", "utf8"));

describe("one cause, said once", () => {
  it("the room tells the guardrails panel that the boundary is naming it", () => {
    expect(ROOM).toContain("sessionEndedShownElsewhere");
  });

  it("and the panel only stays quiet for that one cause", () => {
    // The guard is the AND: the prop alone must not silence a failure, and an
    // ended session alone must not either.
    expect(PANEL).toMatch(/sessionEndedShownElsewhere && endedSessionFor\(overview\.error\)/);
  });

  it("every other failure still draws its own block", () => {
    // The ReadFailed arm survives the early return above it.
    expect(PANEL).toContain("The rules did not load, so nothing below would be the real boundary.");
  });

  /**
   * The predicate the suppression rests on. If `endedSessionFor` ever stopped
   * recognising an ended session, the room would go back to saying it twice --
   * which is the safe direction, and worth knowing rather than assuming.
   */
  it("an ended session is recognised, and nothing else is mistaken for one", () => {
    expect(endedSessionFor(new Error("JWT expired"))).toBeTruthy();
    expect(endedSessionFor(new Error("network unreachable"))).toBeNull();
    expect(endedSessionFor(null)).toBeNull();
  });
});
