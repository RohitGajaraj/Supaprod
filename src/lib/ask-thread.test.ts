import { describe, expect, it } from "bun:test";
import { answerTitle, dayLabel, needsDayDivider } from "./ask-thread";

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
