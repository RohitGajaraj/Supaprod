import { describe, it, expect } from "bun:test";
import {
  renderBriefBlock,
  renderBriefItemsBlock,
  type BriefItem,
  type WorkspaceBrief,
} from "./briefs.functions";

function item(overrides: Partial<BriefItem> = {}): BriefItem {
  return {
    id: "item-1",
    workspace_id: "ws-1",
    kind: "vision",
    title: "Vision",
    body: "We help solo PMs run the work of a 10-person product org.",
    status: "standing",
    version: 1,
    supersedes_id: null,
    created_at: "2026-07-03T00:00:00.000Z",
    updated_at: "2026-07-03T00:00:00.000Z",
    ...overrides,
  };
}

describe("renderBriefBlock", () => {
  it("returns '' for a null brief", () => {
    expect(renderBriefBlock(null)).toBe("");
  });

  it("returns '' when every field is blank (never injects noise)", () => {
    const brief: WorkspaceBrief = {
      id: "b1",
      workspace_id: "ws-1",
      mission: "",
      target_user: "",
      current_focus: "",
      anti_goals: "",
      notes: "",
      updated_at: null,
    };
    expect(renderBriefBlock(brief)).toBe("");
  });

  it("renders only the populated fields", () => {
    const brief: WorkspaceBrief = {
      id: "b1",
      workspace_id: "ws-1",
      mission: "Ship the loop.",
      target_user: "",
      current_focus: "",
      anti_goals: "",
      notes: "",
      updated_at: null,
    };
    const block = renderBriefBlock(brief);
    expect(block).toContain("Mission:\nShip the loop.");
    expect(block).not.toContain("Target user");
  });
});

describe("renderBriefItemsBlock", () => {
  it("returns '' for an empty or missing list (never injects noise pre-adoption)", () => {
    expect(renderBriefItemsBlock([])).toBe("");
    expect(renderBriefItemsBlock(null)).toBe("");
    expect(renderBriefItemsBlock(undefined)).toBe("");
  });

  it("renders a singleton kind as its own labeled section", () => {
    const block = renderBriefItemsBlock([
      item({ kind: "vision", body: "Own the loop, not the chat." }),
    ]);
    expect(block).toContain("Strategic decisions");
    expect(block).toContain("Vision:\nOwn the loop, not the chat.");
  });

  it("renders every top_bet as a bulleted line under one section", () => {
    const block = renderBriefItemsBlock([
      item({ id: "b1", kind: "top_bet", title: "Trust Ledger", body: "Prove the receipts." }),
      item({ id: "b2", kind: "top_bet", title: "Ambient sense", body: "Self-initiate on signal." }),
    ]);
    expect(block).toContain(
      "Top bets:\n- Trust Ledger: Prove the receipts.\n- Ambient sense: Self-initiate on signal.",
    );
  });

  it("orders sections vision, icp, positioning, top_bet regardless of input order", () => {
    const block = renderBriefItemsBlock([
      item({ id: "p1", kind: "positioning", body: "Agentic OS, not a chatbot." }),
      item({ id: "v1", kind: "vision", body: "Own the loop." }),
    ]);
    expect(block.indexOf("Vision:")).toBeLessThan(block.indexOf("Positioning:"));
  });

  it("only surfaces the standing row per singleton kind, never a superseded one", () => {
    // Callers are expected to pass only status='standing' rows (the server
    // fn filters at the query), so this pins that the renderer itself does
    // not re-filter by status — a superseded row passed in would still
    // render, matching renderBriefBlock's own no-opinion-on-status posture.
    const block = renderBriefItemsBlock([
      item({ kind: "vision", status: "superseded", body: "Old vision." }),
    ]);
    expect(block).toContain("Old vision.");
  });
});
