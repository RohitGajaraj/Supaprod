import { describe, expect, test, beforeEach, afterEach, skip } from "bun:test";
import type { ReactElement } from "react";
import { whenOf, deltaOf } from "./CompoundingPanel";

describe("whenOf — learning timestamp formatting", () => {
  let now: Date;

  beforeEach(() => {
    // Capture current time for consistent testing
    now = new Date();
  });

  test("returns time only (HH:MM) for today's timestamps", () => {
    // Create a timestamp for today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);
    const iso = today.toISOString();

    const result = whenOf(iso);

    // Should be formatted as time (HH:MM or similar depending on locale)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
    expect(result).not.toContain("Yesterday");
    expect(result).not.toMatch(/\w+\s+\d{1,2}/); // Not date format
  });

  test("returns 'Yesterday' for timestamps exactly 1 day ago", () => {
    // Create a timestamp for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = yesterday.toISOString();

    const result = whenOf(iso);
    expect(result).toBe("Yesterday");
  });

  test("returns Month Day format for dates older than 1 day", () => {
    // Create a timestamp 3 days ago
    const threeAgo = new Date(now);
    threeAgo.setDate(threeAgo.getDate() - 3);
    const iso = threeAgo.toISOString();

    const result = whenOf(iso);

    // Should be in format like "Jul 9"
    expect(result).toMatch(/\w{3}\s+\d{1,2}/);
    expect(result).not.toBe("Yesterday");
    expect(result).not.toMatch(/\d{1,2}:\d{2}/);
  });

  test("handles edge case: exactly midnight boundary as today", () => {
    // Create timestamp at start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const iso = startOfToday.toISOString();

    const result = whenOf(iso);

    // Should be today's time format
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  test("handles edge case: 1 second before midnight (yesterday)", () => {
    // Create timestamp 1 second before midnight (still yesterday)
    const almostMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, -1);
    const iso = almostMidnight.toISOString();

    const result = whenOf(iso);

    // Depending on local timezone, this should be "Yesterday"
    expect(result === "Yesterday" || result.toMatch(/\w{3}\s+\d{1,2}/)).toBe(true);
  });

  test("handles far past dates", () => {
    // Create timestamp 100 days ago
    const longAgo = new Date(now);
    longAgo.setDate(longAgo.getDate() - 100);
    const iso = longAgo.toISOString();

    const result = whenOf(iso);

    // Should be in date format, not time
    expect(result).toMatch(/\w{3}\s+\d{1,2}/);
  });

  test("preserves month abbreviation (short locale format)", () => {
    // Create a known past date
    const pastDate = new Date("2025-06-09T12:00:00Z");
    const iso = pastDate.toISOString();

    const result = whenOf(iso);

    // Should contain a 3-letter month abbreviation
    expect(result).toMatch(/\w{3}/);
  });
});

describe("deltaOf — ICE movement rounding and threshold logic", () => {
  test("returns null when prior_ice is null", () => {
    const result = deltaOf({
      prior_ice: null,
      new_ice: 100,
    });

    expect(result).toBeNull();
  });

  test("returns null when new_ice is null", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: null,
    });

    expect(result).toBeNull();
  });

  test("returns null when both are null", () => {
    const result = deltaOf({
      prior_ice: null,
      new_ice: null,
    });

    expect(result).toBeNull();
  });

  test("converts string ice values to numbers", () => {
    const result = deltaOf({
      prior_ice: "40",
      new_ice: "50",
    });

    expect(result).toBe(10);
  });

  test("handles numeric string with decimals", () => {
    const result = deltaOf({
      prior_ice: "45.5",
      new_ice: "55.3",
    });

    expect(result).toBe(9.8);
  });

  test("detects meaningful ICE deltas (>= 0.1) after rounding", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.2,
    });

    // Clear delta above 0.1 threshold should be detected
    expect(result).toBeTruthy();
  });

  test("returns null for sub-0.1 jitter (the motion threshold)", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.02,
    });

    expect(result).toBeNull(); // Sub-0.1 jitter is ignored
  });

  test("captures positive ICE movements", () => {
    const result = deltaOf({
      prior_ice: 30,
      new_ice: 45,
    });

    expect(result).toBe(15);
  });

  test("captures negative ICE movements", () => {
    const result = deltaOf({
      prior_ice: 80,
      new_ice: 60,
    });

    expect(result).toBe(-20);
  });

  test("rounds small deltas and returns null when result is 0", () => {
    // Deltas that round to 0 (jitter below 0.1 threshold) return null
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.04,
    });

    // 0.04 * 10 = 0.4, Math.round(0.4) = 0, returns null (jitter)
    expect(result).toBeNull();
  });

  test("handles non-finite numbers gracefully", () => {
    const result = deltaOf({
      prior_ice: NaN,
      new_ice: 50,
    });

    expect(result).toBeNull();
  });

  test("handles Infinity gracefully", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: Infinity,
    });

    expect(result).toBeNull();
  });

  test("handles large ICE movements", () => {
    const result = deltaOf({
      prior_ice: 0,
      new_ice: 1000000,
    });

    expect(result).toBe(1000000);
  });

  test("handles very small positive deltas above threshold", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.1,
    });

    expect(result).toBe(0.1);
  });

  test("handles mixed sign changes", () => {
    const result = deltaOf({
      prior_ice: -10,
      new_ice: 5,
    });

    expect(result).toBe(15);
  });

  test("edge case: both values are 0", () => {
    const result = deltaOf({
      prior_ice: 0,
      new_ice: 0,
    });

    expect(result).toBeNull(); // No movement
  });

  test("edge case: prior is 0, new is positive", () => {
    const result = deltaOf({
      prior_ice: 0,
      new_ice: 5,
    });

    expect(result).toBe(5);
  });

  test("edge case: prior is positive, new is 0", () => {
    const result = deltaOf({
      prior_ice: 5,
      new_ice: 0,
    });

    expect(result).toBe(-5);
  });

  test("edge case: both negative, negative movement", () => {
    const result = deltaOf({
      prior_ice: -10,
      new_ice: -20,
    });

    expect(result).toBe(-10);
  });

  test("edge case: both negative, positive movement", () => {
    const result = deltaOf({
      prior_ice: -20,
      new_ice: -10,
    });

    expect(result).toBe(10);
  });
});

describe("CompoundingPanel component states", () => {
  /**
   * IMPLEMENTATION NOTES: CompoundingPanel uses useQuery without useMutation.
   * Component state tests require mocking @tanstack/react-query useQuery hook
   * and @tanstack/react-start useServerFn.
   *
   * Once implemented, this tests:
   * - Loading state: renders PanelSkeleton
   * - Error state: renders error card with retry button
   * - Empty state: renders "No outcomes recorded yet" message
   * - Success state: renders learning rows with:
   *   - VerdictChip with status-mapped tone
   *   - Opportunity title or "an outcome memo"
   *   - ICE delta (if moved ranking)
   *   - AuditTag and timestamp
   *   - Learning summary (if present)
   * - Pagination: shows "Show N more" button when rows > 50
   *
   * Critical behaviors:
   * - rescoreCount = learnings.filter((l) => deltaOf(l) != null).length
   * - Display rules: "latest 50 outcomes · X re-ranked a priority"
   * - Link target: /brain?tab=learnings&learning=<id>
   */

  test.skip("renders PanelSkeleton when isLoading is true", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: <PanelSkeleton /> component visible
  });

  test.skip("renders error card when isError is true", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Card with "Learnings · failed to load" + error message + Retry button
  });

  test.skip("renders error message from query error", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Displays (query.error as Error).message
  });

  test.skip("renders empty state when learnings array is empty", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Message about no outcomes recorded + "When you record what a shipped bet actually did..."
  });

  test.skip("renders learning rows when data is present", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Maps learnings array and renders each as a Link row
  });

  test.skip("displays headline from describeCompounding when summary is present", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Paragraph with headline text (e.g., "X decisions memory has re-ranked...")
  });

  test.skip("displays count line: 'N recorded outcome(s) · X re-ranked a priority'", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Mono-label with correct count and rescore count
  });

  test.skip("renders 'latest 50 outcomes' when learnings.length === 50 (server cap)", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Count line says "latest 50 outcomes" instead of "50 recorded outcomes"
  });

  test.skip("shows VerdictChip with status-mapped tone for each row", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: VerdictChip component with tone from VERDICT_TONE map (validated/missed/mixed)
  });

  test.skip("renders opportunity_title or 'an outcome memo' for missing title", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Span with l.opportunity_title ?? "an outcome memo"
  });

  test.skip("displays ICE delta with sign when learning moved a ranking", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: RE-RANKED ±X.X ICE when deltaOf(l) != null
  });

  test.skip("hides delta line when deltaOf returns null (jitter)", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: No RE-RANKED line when movement is below 0.1 threshold
  });

  test.skip("renders AuditTag and timestamp for each row", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: AuditTag with kind="learning" id=l.id, timestamp from whenOf(l.created_at)
  });

  test.skip("renders learning summary when present, with 2-line clamp", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Paragraph with l.summary, style with WebkitLineClamp: 2
  });

  test.skip("hides summary when l.summary is falsy", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: No summary paragraph rendered
  });

  test.skip("renders Link with correct target (tab=learnings, learning=id)", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: Link to="/brain" with search={{ tab: "learnings", learning: l.id }}
  });

  test.skip("renders borders between rows (except last)", () => {
    // TODO: Implement mock.module pattern for useQuery
    // Expected: borderTop: i === 0 ? "none" : "1px solid var(--hairline)"
  });

  test.skip("calls refetch when Retry button is clicked in error state", () => {
    // TODO: Implement mock.module pattern for useQuery + mock event simulation
    // Expected: q.refetch() and lq.refetch() invoked
  });
});
