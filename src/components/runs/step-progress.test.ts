import { describe, expect, it } from "bun:test";

import { skippedClause, stepProgress } from "./step-progress";

const s = (...statuses: string[]) => statuses.map((status) => ({ status }));

describe("stepProgress", () => {
  it("keeps missionProgress's own done and total, unmodified", () => {
    // Position is not this module's to decide. A skipped step is behind the
    // run, so it stays in `done`; only the composition is added.
    const p = stepProgress(s("completed", "skipped", "planned"));
    expect(p.done).toBe(2);
    expect(p.total).toBe(3);
  });

  it("counts how many of the done steps nobody performed", () => {
    expect(stepProgress(s("done", "skipped", "skipped", "planned")).skipped).toBe(2);
  });

  it("reports zero skipped when every step was actually performed", () => {
    expect(stepProgress(s("completed", "done", "success")).skipped).toBe(0);
  });

  it("normalises case and whitespace the way STEP_DONE does", () => {
    expect(stepProgress(s(" SKIPPED ", "Skipped")).skipped).toBe(2);
  });

  it("treats a malformed payload as no steps rather than throwing", () => {
    // This feeds a card subtitle. A bad payload must not take a surface down.
    expect(stepProgress(undefined)).toEqual({ done: 0, total: 0, skipped: 0 });
    expect(stepProgress(null)).toEqual({ done: 0, total: 0, skipped: 0 });
    expect(stepProgress("nonsense" as never)).toEqual({ done: 0, total: 0, skipped: 0 });
  });

  it("matches the live shape that motivated it", () => {
    // 360 steps measured 2026-08-27: 179 done, 69 skipped, the rest unfinished.
    const rows = [
      ...Array.from({ length: 179 }, () => ({ status: "done" })),
      ...Array.from({ length: 69 }, () => ({ status: "skipped" })),
      ...Array.from({ length: 112 }, () => ({ status: "planned" })),
    ];
    const p = stepProgress(rows);
    expect(p.done).toBe(248);
    expect(p.skipped).toBe(69);
    // The claim that was being made silently: 248 of 360 "done".
    expect(Math.round((p.skipped / p.done) * 100)).toBe(28);
  });
});

describe("skippedClause", () => {
  it("names the omission when there is one", () => {
    expect(skippedClause({ skipped: 2 })).toBe("2 skipped");
  });

  it("SAYS NOTHING at zero, so the honest case is not the noisy one", () => {
    expect(skippedClause({ skipped: 0 })).toBeNull();
  });

  it("says nothing when progress is unknown", () => {
    expect(skippedClause(undefined)).toBeNull();
  });
});
