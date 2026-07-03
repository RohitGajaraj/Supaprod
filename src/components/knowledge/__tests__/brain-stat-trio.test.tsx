import { describe, expect, test } from "bun:test";
import { deriveBrainStats } from "../BrainStatTrio";
import { OBS_STATUS_TONE } from "../DecisionsPanel";
import { VERDICT_TONE } from "../CompoundingPanel";
import type { ImpactLedgerResult } from "@/lib/pm-impact.functions";
import type { ImpactLedger } from "@/lib/pm-impact";

const BASE_LEDGER: ImpactLedger = {
  decisionsTotal: 0,
  humanLed: 0,
  agentLed: 0,
  decisionsByStatus: {},
  beliefsRevised: 0,
  outcomes: { validated: 0, missed: 0, mixed: 0, hitRate: null },
  iceShiftTotal: 0,
  iceShiftAvg: null,
  measuredOutcomes: 0,
  span: { firstAt: null, lastAt: null, activeMonths: 0 },
  highlights: [],
  headline: "",
  decisionsTrend: [0, 0, 0, 0, 0, 0, 0, 0],
};

function result(overrides: Partial<ImpactLedger>, markdown = "# record"): ImpactLedgerResult {
  return { ledger: { ...BASE_LEDGER, ...overrides }, markdown, workspaceName: "Test" };
}

describe("deriveBrainStats — the Brain stat trio's pure data mapping", () => {
  test("an empty ledger (no decisions, no measured outcomes) has no record", () => {
    const stats = deriveBrainStats(result({}));
    expect(stats.hasRecord).toBe(false);
  });

  test("renders three cells: calls made, validated %, net ICE moved", () => {
    const stats = deriveBrainStats(
      result({
        decisionsTotal: 128,
        outcomes: { validated: 20, missed: 8, mixed: 0, hitRate: 0.71 },
        iceShiftTotal: 4.3,
      }),
    );
    expect(stats.hasRecord).toBe(true);
    if (!stats.hasRecord) return;
    expect(stats.cells).toEqual([
      { value: "128", label: "CALLS MADE" },
      { value: "71%", label: "VALIDATED" },
      { value: "+4.3", label: "ICE MOVED" },
    ]);
  });

  test("omits the VALIDATED cell entirely when hitRate is null (never a placeholder)", () => {
    const stats = deriveBrainStats(result({ decisionsTotal: 5, measuredOutcomes: 0 }));
    expect(stats.hasRecord).toBe(true);
    if (!stats.hasRecord) return;
    expect(stats.cells.some((c) => c.label === "VALIDATED")).toBe(false);
  });

  test("never fabricates a dollar figure — the third cell is always ICE, signed", () => {
    const negative = deriveBrainStats(result({ decisionsTotal: 3, iceShiftTotal: -2.1 }));
    expect(negative.hasRecord).toBe(true);
    if (!negative.hasRecord) return;
    const iceCell = negative.cells.find((c) => c.label === "ICE MOVED");
    expect(iceCell?.value).toBe("-2.1");
    expect(negative.cells.every((c) => !c.value.includes("$"))).toBe(true);
  });

  test("export is present only when markdown is non-empty", () => {
    const withRecord = deriveBrainStats(result({ decisionsTotal: 1 }, "# real record"));
    expect(withRecord.hasRecord).toBe(true);
    if (!withRecord.hasRecord) return;
    expect(withRecord.markdown).toBe("# real record");

    const noMarkdown = deriveBrainStats(result({ decisionsTotal: 1 }, ""));
    expect(noMarkdown.hasRecord).toBe(true);
    if (!noMarkdown.hasRecord) return;
    expect(noMarkdown.markdown).toBeNull();
  });

  test("measuredOutcomes alone (no decisions yet) still counts as having a record", () => {
    const stats = deriveBrainStats(result({ decisionsTotal: 0, measuredOutcomes: 2 }));
    expect(stats.hasRecord).toBe(true);
  });

  test("OBS-15: decisionsTrend passes through from the ledger, real counts only", () => {
    const stats = deriveBrainStats(
      result({ decisionsTotal: 4, decisionsTrend: [0, 0, 1, 0, 2, 0, 0, 1] }),
    );
    expect(stats.hasRecord).toBe(true);
    if (!stats.hasRecord) return;
    expect(stats.decisionsTrend).toEqual([0, 0, 1, 0, 2, 0, 0, 1]);
  });
});

describe("OBS_STATUS_TONE — decision status to Obsidian verdict chip tone mapping", () => {
  test("approved decisions map to KEPT tone (moss)", () => {
    expect(OBS_STATUS_TONE.approved).toBe("KEPT");
  });

  test("rejected decisions map to KILL tone (madder)", () => {
    expect(OBS_STATUS_TONE.rejected).toBe("KILL");
  });

  test("pending decisions map to PENDING tone (neutral)", () => {
    expect(OBS_STATUS_TONE.pending).toBe("PENDING");
  });

  test("tone map covers all decision statuses", () => {
    const statuses: Array<"approved" | "rejected" | "pending"> = [
      "approved",
      "rejected",
      "pending",
    ];
    statuses.forEach((status) => {
      expect(Object.keys(OBS_STATUS_TONE)).toContain(status);
    });
  });
});

describe("VERDICT_TONE — learning verdict to Obsidian verdict chip tone mapping", () => {
  test("validated verdicts map to VALIDATED tone (moss)", () => {
    expect(VERDICT_TONE.validated).toBe("VALIDATED");
  });

  test("missed verdicts map to MISSED tone (madder)", () => {
    expect(VERDICT_TONE.missed).toBe("MISSED");
  });

  test("mixed verdicts map to REVISE tone (neutral)", () => {
    expect(VERDICT_TONE.mixed).toBe("REVISE");
  });

  test("tone map covers all learning verdicts", () => {
    const verdicts: Array<"validated" | "missed" | "mixed"> = ["validated", "missed", "mixed"];
    verdicts.forEach((verdict) => {
      expect(Object.keys(VERDICT_TONE)).toContain(verdict);
    });
  });
});
