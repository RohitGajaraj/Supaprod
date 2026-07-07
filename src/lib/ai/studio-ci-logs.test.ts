import { describe, test, expect } from "bun:test";
import { cleanLogTail, renderFailingDetail } from "@/lib/ai/studio-ci-logs.server";

describe("cleanLogTail", () => {
  test("strips timestamps and keeps the tail when over cap", () => {
    const lines = Array.from(
      { length: 50 },
      (_, i) => `2026-07-07T12:00:0${i % 10}.0000000Z line ${i} of the log`,
    ).join("\n");
    const out = cleanLogTail(lines, 200);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out).toContain("line 49 of the log");
    expect(out).not.toMatch(/2026-07-07T/);
  });

  test("returns short logs whole", () => {
    expect(cleanLogTail("error: test failed\n", 1000)).toBe("error: test failed");
  });
});

describe("renderFailingDetail", () => {
  test("renders name, output, and log tail per failing check", () => {
    const out = renderFailingDetail([
      {
        name: "ci / test",
        conclusion: "failure",
        summary: "1 test failed",
        logTail: "expect(2).toBe(3)",
      },
      { name: "lint", conclusion: "failure", summary: null, logTail: null },
    ]);
    expect(out).toContain("CHECK: ci / test (failure)");
    expect(out).toContain("OUTPUT: 1 test failed");
    expect(out).toContain("LOG TAIL:\nexpect(2).toBe(3)");
    expect(out).toContain("CHECK: lint (failure)");
  });

  test("hard-caps the rendered block", () => {
    const out = renderFailingDetail(
      [
        {
          name: "big",
          conclusion: "failure",
          summary: "x".repeat(1500),
          logTail: "y".repeat(3000),
        },
      ],
      500,
    );
    expect(out.length).toBeLessThanOrEqual(520);
    expect(out.endsWith("[truncated]")).toBe(true);
  });
});
