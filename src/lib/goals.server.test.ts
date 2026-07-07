// SW-4 / mission 3.10: the pure seam of goal mode. The parser fails closed
// (garbage means skip, never a fabricated proposal) and clamps every field,
// so the work pass can trust its output without re-validating.
import { describe, expect, it } from "bun:test";
import { parseGoalProposal } from "./goals.server";

describe("parseGoalProposal", () => {
  it("accepts a clean proposal and clamps field lengths", () => {
    const res = parseGoalProposal({
      skip: false,
      title: "  Reduce onboarding drop-off at the connect step  ",
      problem: "40% of new users stall on the connect-source step.",
      target_user: "New workspace owners",
      hypothesis: "A skip-for-now path lifts day-1 activation.",
    });
    expect("skip" in res).toBe(false);
    if ("skip" in res) return;
    expect(res.title).toBe("Reduce onboarding drop-off at the connect step");
    expect(res.problem).toContain("stall");
    expect(res.target_user).toBe("New workspace owners");
    expect(res.hypothesis).toContain("day-1 activation");
  });

  it("returns the skip reason when the model skips", () => {
    const res = parseGoalProposal({ skip: true, reason: "no relevant movement this week" });
    expect(res).toEqual({ skip: "no relevant movement this week" });
  });

  it("defaults the skip reason when the model omits it", () => {
    const res = parseGoalProposal({ skip: true });
    expect(res).toEqual({ skip: "nothing new warranted" });
  });

  it("fails closed on garbage output", () => {
    expect("skip" in parseGoalProposal(null)).toBe(true);
    expect("skip" in parseGoalProposal("not json")).toBe(true);
    expect("skip" in parseGoalProposal({})).toBe(true);
    expect("skip" in parseGoalProposal({ skip: false, title: "x" })).toBe(true);
    expect("skip" in parseGoalProposal({ skip: false, problem: "y" })).toBe(true);
  });

  it("truncates oversized fields instead of rejecting them", () => {
    const res = parseGoalProposal({
      skip: false,
      title: "t".repeat(500),
      problem: "p".repeat(5000),
      target_user: "u".repeat(500),
      hypothesis: "h".repeat(2000),
    });
    expect("skip" in res).toBe(false);
    if ("skip" in res) return;
    expect(res.title.length).toBe(200);
    expect(res.problem.length).toBe(2000);
    expect(res.target_user?.length).toBe(200);
    expect(res.hypothesis?.length).toBe(500);
  });

  it("treats empty-string optionals as null", () => {
    const res = parseGoalProposal({
      skip: false,
      title: "A real title",
      problem: "A real problem statement.",
      target_user: "  ",
      hypothesis: "",
    });
    expect("skip" in res).toBe(false);
    if ("skip" in res) return;
    expect(res.target_user).toBeNull();
    expect(res.hypothesis).toBeNull();
  });
});
