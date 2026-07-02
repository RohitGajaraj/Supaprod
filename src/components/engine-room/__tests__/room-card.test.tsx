import { describe, test, expect } from "bun:test";
import { RoomCard } from "../RoomCard";
import type { RoomGlance } from "@/lib/engine-room-glance";

// Same convention as src/components/obsidian/__tests__/primitives.test.tsx:
// call the forwardRef component directly (no DOM renderer in this repo) and
// assert on the returned element tree.
function renderRoomCard(glance: RoomGlance, onOpen: () => void) {
  return (RoomCard as unknown as { render: (props: any, ref: null) => any }).render(
    { glance, onOpen },
    null,
  );
}

function containsText(el: unknown, text: string): boolean {
  if (typeof el === "string") return el === text;
  if (Array.isArray(el)) return el.some((c) => containsText(c, text));
  if (el && typeof el === "object" && "props" in (el as any)) {
    return containsText((el as any).props.children, text);
  }
  return false;
}

const HEALTHY_GLANCE: RoomGlance = {
  key: "safety",
  name: "Safety",
  question: "What is it allowed to do?",
  verdict: "3 guardrails on · 0 incidents",
  state: "healthy",
};

const WATCH_GLANCE: RoomGlance = { ...HEALTHY_GLANCE, key: "spend", name: "Spend", state: "watch" };

describe("RoomCard", () => {
  test("renders a real <button> and calls onOpen on click", () => {
    let opened = false;
    const el = renderRoomCard(HEALTHY_GLANCE, () => {
      opened = true;
    });
    expect(el.type).toBe("button");
    expect(el.props.type).toBe("button");
    el.props.onClick();
    expect(opened).toBe(true);
  });

  test("shows the HEALTHY word (grayscale-safe, not color-only)", () => {
    const el = renderRoomCard(HEALTHY_GLANCE, () => {});
    expect(containsText(el, "HEALTHY")).toBe(true);
  });

  test("shows the WATCH word when the room needs attention", () => {
    const el = renderRoomCard(WATCH_GLANCE, () => {});
    expect(containsText(el, "WATCH")).toBe(true);
  });

  test("renders the room's name, question, and verdict line", () => {
    const el = renderRoomCard(HEALTHY_GLANCE, () => {});
    expect(containsText(el, "Safety")).toBe(true);
    expect(containsText(el, "What is it allowed to do?")).toBe(true);
    expect(containsText(el, "3 guardrails on · 0 incidents")).toBe(true);
  });
});
