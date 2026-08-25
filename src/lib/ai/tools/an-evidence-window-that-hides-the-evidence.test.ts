/**
 * A recency window on the evidence tool surfaces the loop's own exhaust and
 * hides the customer.
 *
 * `signals.list` is how Discover asks what the workspace knows. Its
 * `lookback_days` default has now been the reason nothing left Discover twice.
 *
 * **2026-08-02, which moved it from 7 to 30.** 308 signals existed, 144 inside
 * 30 days and SIX inside 7, so the tool answered "empty" on almost every call.
 * 42 open tracks, every one standing at `sense`.
 *
 * **2026-08-25, on a live run, which moved it from 30 to 90.** A track was
 * started on *"add dark mode and a system-preference theme"*. The workspace holds
 * exactly the evidence for it — a Canny request titled *"Add Dark Mode & System
 * Preference theme in addition to the light theme"* — and `customer-insights`
 * reported:
 *
 *   "among the 55 manual signals, none mention dark mode or theme preferences."
 *
 * A true statement about a list, and a false conclusion about the world. **The
 * Canny signal is 47 days old and the window was 30.**
 *
 * WHAT MAKES THIS WORSE THAN "OLD THINGS ARE HIDDEN", measured the same minute
 * in workspace `0b792d52`:
 *
 *   SELECT count(*) FILTER (WHERE created_at > now() - interval '30 days'),
 *          count(*) FILTER (WHERE created_at > now() - interval '90 days'),
 *          count(*),
 *          count(*) FILTER (WHERE source='agent'
 *                             AND created_at > now() - interval '30 days')
 *     FROM signals WHERE workspace_id = '0b792d52-…';
 *   -- 65 | 72 | 72 | 52
 *
 * **52 of the 65 rows inside the window were the agents' OWN notes recording
 * that they had found nothing**, all written in the previous three days. So the
 * recent window was mostly the loop's own exhaust, and the single real customer
 * voice sat just outside it. A recency window does not merely hide old evidence;
 * it preferentially surfaces whatever the system most recently generated about
 * itself.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(fileURLToPath(new URL("./registry.server.ts", import.meta.url)), "utf8");

/** The `signals.list` definition alone. */
const TOOL = (() => {
  const at = SRC.indexOf('name: "signals.list"');
  return SRC.slice(at, SRC.indexOf("preview:", at));
})();

/**
 * The same text with its comment prefixes and line wrapping flattened.
 *
 * The reasoning below is prose in a comment, so any sentence long enough to be
 * worth pinning is also long enough to wrap — and a wrapped sentence is not a
 * substring of itself. Flattening keeps the assertion about the CLAIM rather
 * than about where the eighty-column boundary happened to fall.
 */
const PROSE = TOOL.replace(/\n\s*\/\/ ?/g, " ").replace(/\s+/g, " ");

describe("the evidence window is as wide as the tool allows", () => {
  it("defaults to the schema ceiling rather than to a status-update window", () => {
    expect(TOOL).toContain("lookback_days: z.number().int().min(1).max(90).default(90)");
  });

  /**
   * Pinned as its own assertion because this is the value that was wrong, and a
   * later reader tightening it "for performance" would reintroduce a defect that
   * has already cost this product two multi-week stalls.
   */
  it("is not back at 30, and not at 7", () => {
    expect(TOOL).not.toContain(".default(30)");
    expect(TOOL).not.toContain(".default(7)");
  });

  /**
   * The ceiling and the default are now the same number, which is the honest
   * state: there is no wider answer available inside this tool's shape. If the
   * max is ever raised, the default should move with it — this fails if they
   * come apart, so the decision gets made deliberately rather than by omission.
   */
  it("keeps the default and the ceiling together", () => {
    const m = TOOL.match(/max\((\d+)\)\.default\((\d+)\)/);
    expect(m).toBeTruthy();
    expect(m?.[1]).toBe(m?.[2] ?? "");
  });

  /** An agent may still narrow it deliberately; only the DEFAULT changed. */
  it("still lets a caller ask for a narrower window on purpose", () => {
    expect(TOOL).toContain("min(1)");
  });
});

describe("the reasoning stays with the number", () => {
  /**
   * This constant has been changed twice for the same reason and both times the
   * evidence was a live run rather than an argument. A bare `90` invites the
   * third change to be made on feel.
   */
  it("records both measurements next to the default", () => {
    expect(PROSE).toContain("2026-08-02");
    expect(PROSE).toContain("2026-08-25");
    expect(PROSE).toContain("the Canny signal is 47 days old and the window was 30");
  });

  it("names the part that is still unsolved rather than implying 90 settles it", () => {
    expect(PROSE).toContain("should look at what the workspace HAS, not at what arrived lately");
  });
});
