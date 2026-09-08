import { describe, expect, it } from "bun:test";
import { ago, leadOfRanking, type RankedLead } from "./lead-of-ranking";

const NOW = Date.parse("2026-09-08T10:00:00Z");
const entry = (
  over: Partial<RankedLead> & { theme?: Partial<RankedLead["theme"]> },
): RankedLead => ({
  theme: {
    title: "Homeowners cannot tell a real outage from a firmware reboot",
    severity: 4,
    frequency: 7,
    is_sample: false,
    ...(over.theme ?? {}),
  },
  lastAt: "2026-09-08T09:20:00Z",
  sources: 2,
  ...Object.fromEntries(Object.entries(over).filter(([k]) => k !== "theme")),
});

describe("the one cluster to start with", () => {
  it("names the top cluster and says why, with the queue's depth under it", () => {
    const r = leadOfRanking([entry({}), entry({}), entry({})], NOW);
    expect(r?.lead).toBe(
      "Start with “Homeowners cannot tell a real outage from a firmware reboot”.",
    );
    expect(r?.why).toBe(
      "Severity 4 of 5, newest signal 40 min ago, 7 signals from 2 sources. 2 more clusters behind it, ordered by how severe, how recent, and how new each one is.",
    );
  });

  it("says nothing else is behind a ranking of one", () => {
    expect(leadOfRanking([entry({})], NOW)?.why).toContain("Nothing else is open behind it.");
  });

  it("never makes an Example the instruction", () => {
    expect(leadOfRanking([entry({ theme: { is_sample: true } }), entry({})], NOW)).toBeNull();
    expect(leadOfRanking([], NOW)).toBeNull();
  });

  it("leaves out a fact the row does not carry rather than zeroing it", () => {
    const r = leadOfRanking(
      [entry({ theme: { severity: null, frequency: 0 }, lastAt: null })],
      NOW,
    );
    expect(r?.why).toBe("Nothing else is open behind it.");
    const one = leadOfRanking([entry({ sources: 0 })], NOW);
    expect(one?.why).toContain("7 signals.");
    expect(one?.why).not.toContain("from 0 sources");
  });

  it("clips a long title on a word", () => {
    const title = "word ".repeat(40).trim();
    const r = leadOfRanking([entry({ theme: { title } })], NOW);
    expect(r?.lead.length).toBeLessThan(110);
    expect(r?.lead.endsWith("…”.")).toBe(true);
  });

  it("phrases age in the ranking row's register", () => {
    expect(ago("2026-09-08T09:59:30Z", NOW)).toBe("just now");
    expect(ago("2026-09-08T09:48:00Z", NOW)).toBe("12 min ago");
    expect(ago("2026-09-08T07:00:00Z", NOW)).toBe("3 h ago");
    expect(ago("2026-09-03T10:00:00Z", NOW)).toBe("5 d ago");
    expect(ago("not a date", NOW)).toBeNull();
    expect(ago(null, NOW)).toBeNull();
  });
});
