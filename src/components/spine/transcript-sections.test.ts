import { describe, expect, it } from "bun:test";
import type { ActivityRow } from "@/components/spine/activity-rows";
import type { Turn } from "@/lib/spine/activity";
import { defaultOpen, sectionMeta, transcriptSections } from "./transcript-sections";

const turn = (
  station: Turn["station"],
  at: number,
  outcome: Turn["outcome"] = "done",
  agentName = "Scout",
  tookMs: number | null = 1000,
): ActivityRow => ({
  kind: "turn",
  at,
  key: `turn:${at}`,
  turn: {
    runId: `r${at}`,
    agentSlug: agentName.toLowerCase(),
    agentName,
    station,
    stationName: station ?? "",
    at: new Date(at).toISOString(),
    outcome,
    made: [],
    said: null,
    tookMs,
    tokens: null,
    stopLine: null,
    usd: null,
    credits: null,
  } as unknown as Turn,
});

const move = (to: string, at: number, line: string | null = null): ActivityRow =>
  ({ kind: "move", at, key: `move:${at}`, to, toName: to, from: null, line }) as ActivityRow;

describe("transcriptSections", () => {
  it("cuts at every move row and does not render the move as a row", () => {
    const rows = [
      turn("sense", 1),
      move("decide", 2, "the run moved on its own"),
      turn("decide", 3),
    ];
    const s = transcriptSections(rows);
    expect(s.map((x) => x.station)).toEqual(["sense", "decide"]);
    expect(s[1].via).toBe("the run moved on its own");
    expect(s[1].rows.map((r) => r.kind)).toEqual(["turn"]);
  });

  it("cuts when a turn's station changes with no move row on the record", () => {
    const s = transcriptSections([turn("sense", 1), turn("sense", 2), turn("decide", 3)]);
    expect(s.map((x) => [x.station, x.turns])).toEqual([
      ["sense", 2],
      ["decide", 1],
    ]);
  });

  it("keeps a steer in the section it arrived in", () => {
    const said: ActivityRow = { kind: "said", at: 2, key: "said:2", message: "go", pickedUp: true };
    const s = transcriptSections([turn("sense", 1), said, turn("sense", 3)]);
    expect(s).toHaveLength(1);
    expect(s[0].rows).toHaveLength(3);
  });

  it("sums only measured time and lists seats once, in order", () => {
    const s = transcriptSections([
      turn("sense", 1, "done", "Scout", 500),
      turn("sense", 2, "done", "Analyst", null),
      turn("sense", 3, "stopped", "Scout", 700),
    ]);
    expect(s[0].seats).toEqual(["Scout", "Analyst"]);
    expect(s[0].tookMs).toBe(1200);
    expect(s[0].last).toBe("stopped");
    expect(sectionMeta(s[0])).toBe("Scout, Analyst · 3 turns");
  });

  it("opens the last section and any live or stopped one by default", () => {
    const s = transcriptSections([
      turn("sense", 1, "stopped"),
      move("decide", 2),
      turn("decide", 3, "done"),
      move("define", 4),
      turn("define", 5, "working"),
      move("design", 6),
      turn("design", 7, "done"),
    ]);
    const open = defaultOpen(s);
    expect([...open].map((k) => k.split(":")[0]).sort()).toEqual(["define", "design", "sense"]);
  });
});
