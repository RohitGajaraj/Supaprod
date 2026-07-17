import { describe, expect, it } from "bun:test";
import { answerTitle, dayLabel, needsDayDivider, hydrateMessages } from "./ask-thread";

describe("ask-thread - answerTitle (PC-36 E)", () => {
  it("takes the first non-empty line, stripped of markdown", () => {
    expect(answerTitle("## **The call**\nBody text")).toBe("The call");
  });

  it("skips leading blank lines", () => {
    expect(answerTitle("\n\n- first real line")).toBe("- first real line");
  });

  it("falls back when the answer has no usable line", () => {
    expect(answerTitle("   \n  ")).toBe("Ask answer");
  });

  it("caps at the record title budget", () => {
    expect(answerTitle("x".repeat(400)).length).toBe(280);
  });
});

describe("ask-thread - day dividers (PC-36 G)", () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`).getTime();

  it("labels the current day TODAY", () => {
    const now = noon("2026-07-16");
    expect(dayLabel(now, now)).toBe("TODAY");
  });

  it("labels a past day with the short mono date", () => {
    expect(dayLabel(noon("2026-07-14"), noon("2026-07-16"))).toBe("JUL 14");
  });

  it("needs no divider for the first message", () => {
    expect(needsDayDivider(undefined, noon("2026-07-16"))).toBe(false);
  });

  it("needs no divider within the same day", () => {
    expect(needsDayDivider(noon("2026-07-16"), noon("2026-07-16") + 3600_000)).toBe(false);
  });

  it("needs a divider when the calendar day turns over", () => {
    expect(needsDayDivider(noon("2026-07-15"), noon("2026-07-16"))).toBe(true);
  });
});

describe("ask-thread - hydrateMessages (PC-36 rehydration)", () => {
  const meta = {
    model: "google/gemini-3-flash-preview",
    via: "gateway",
    latency_ms: 900,
    tokens_in: 5,
    tokens_out: 9,
    cost_usd: 0.01,
    sources: [],
    web_used: false,
    workspace_chunks: 2,
  };
  const block = {
    kind: "decision",
    id: "d-1",
    title: "Ship it",
    status: "approved",
    rationale: null,
    decidedBy: null,
    sourceKind: "manual",
    createdAt: "2026-07-16T00:00:00Z",
  };

  it("maps rows to thread messages with meta and typed blocks from metadata", () => {
    const rows = [
      { id: "m1", role: "user", content: "why?", created_at: "2026-07-16T10:00:00Z" },
      {
        id: "m2",
        role: "assistant",
        content: "Because.",
        created_at: "2026-07-16T10:00:05Z",
        mission_id: null,
        metadata: { ...meta, blocks: [block] },
      },
    ];
    const out = hydrateMessages(rows);
    expect(out.length).toBe(2);
    expect(out[0]).toMatchObject({ id: "m1", role: "user", content: "why?" });
    expect(out[1].meta?.workspace_chunks).toBe(2);
    expect(out[1].blocks).toEqual([block]);
  });

  it("drops system and tool rows, never renders them", () => {
    const out = hydrateMessages([
      { id: "s1", role: "system", content: "prompt", created_at: "2026-07-16T10:00:00Z" },
      { id: "t1", role: "tool", content: "{}", created_at: "2026-07-16T10:00:01Z" },
      { id: "u1", role: "user", content: "hi", created_at: "2026-07-16T10:00:02Z" },
    ]);
    expect(out.map((m) => m.id)).toEqual(["u1"]);
  });

  it("degrades unparseable metadata to plain prose instead of dropping the message", () => {
    const out = hydrateMessages([
      {
        id: "m1",
        role: "assistant",
        content: "text",
        created_at: "2026-07-16T10:00:00Z",
        metadata: { blocks: [{ kind: "widget" }, block], junk: true },
      },
    ]);
    expect(out.length).toBe(1);
    expect(out[0].meta).toBeUndefined();
    expect(out[0].blocks).toEqual([block]);
  });

  it("keeps a mission link so the canvas re-attaches after reload", () => {
    const out = hydrateMessages([
      {
        id: "m1",
        role: "assistant",
        content: "Dispatched.",
        created_at: "2026-07-16T10:00:00Z",
        mission_id: "mis-1",
      },
    ]);
    expect(out[0].mission_id).toBe("mis-1");
  });
});
