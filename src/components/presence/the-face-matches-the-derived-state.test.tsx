/*
 * THE FACE MATCHES THE DERIVED STATE, AND ONLY THE DERIVED STATE.
 *
 * `Character` takes the raw inputs and derives; it cannot be handed a state.
 * These tests pin that: the rendered `data-presence-state` and the sentence
 * both come out of `deriveCharacter`, the name renders from the one constant,
 * and motion is asked for only by states that are genuinely still moving —
 * an outcome breathing is theatre, and theatre is the regression this product
 * cannot afford (SPEC-PRESENCE.md).
 */

import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { Character, CharacterMark } from "./Character";
import { CHARACTER_NAME, type PresenceInput } from "@/lib/presence/character";

const input = (over: Partial<PresenceInput> = {}): PresenceInput => ({
  track: { status: "open", holdReason: null, drivenAt: "2026-08-25T08:00:00Z" },
  result: null,
  walking: false,
  continuing: false,
  ...over,
});

describe("Character derives, it is never handed a state", () => {
  test("a walking input with a tool renders working and names the act", () => {
    const { container, getByText } = render(
      <Character input={input({ walking: true, currentTool: "prd.draft" })} />,
    );
    expect(container.querySelector('[data-presence-state="working"]')).not.toBeNull();
    getByText(/writing the spec/);
  });

  test("a question renders asking even while a leg is in flight", () => {
    const { container } = render(
      <Character
        input={input({
          track: { status: "open", holdReason: "waiting-on-a-person", drivenAt: "x" },
          walking: true,
        })}
      />,
    );
    expect(container.querySelector('[data-presence-state="asking"]')).not.toBeNull();
  });

  test("a dead feed renders out-of-touch and says so in words", () => {
    const { container, getByText } = render(<Character input={input({ feedDead: true })} />);
    expect(container.querySelector('[data-presence-state="out-of-touch"]')).not.toBeNull();
    getByText(/lost sight of the run/);
  });

  test("the name renders from the constant, so the founder's rename is one edit", () => {
    const { getByText } = render(<Character input={input()} />);
    getByText(CHARACTER_NAME);
  });
});

describe("motion belongs only to states still moving", () => {
  test.each(["thinking", "working", "asking", "resting"] as const)(
    "%s breathes",
    (state) => {
      const { container } = render(<CharacterMark state={state} />);
      const mark = container.querySelector("span[data-presence-state]") as HTMLElement;
      expect(mark.style.animation).toContain("mrd-attention");
    },
  );

  test.each(["awake", "blocked", "done", "out-of-touch"] as const)(
    "%s is still — an outcome has nothing left to wait for",
    (state) => {
      const { container } = render(<CharacterMark state={state} />);
      const mark = container.querySelector("span[data-presence-state]") as HTMLElement;
      expect(mark.style.animation ?? "").not.toContain("mrd-attention");
    },
  );
});

describe("the mark speaks to assistive tech", () => {
  test("it is an image with the character's name and state", () => {
    const { container } = render(<CharacterMark state="working" />);
    const mark = container.querySelector('[role="img"]');
    expect(mark?.getAttribute("aria-label")).toBe(`${CHARACTER_NAME}: working`);
  });
});
