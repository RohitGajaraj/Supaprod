import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  statusLabel,
  StatusPill,
  DesignationTag,
  BestBetStamp,
  OPPORTUNITY_STATUSES,
  STATUS_META,
  DESIGNATION_INK,
  DESIGNATION_MEANING,
} from "../OpportunityRow";

describe("statusLabel", () => {
  test("returns correct label for backlog status", () => {
    expect(statusLabel("backlog")).toBe("Backlog");
  });

  test("returns correct label for now status", () => {
    expect(statusLabel("now")).toBe("Now");
  });

  test("returns correct label for next status", () => {
    expect(statusLabel("next")).toBe("Next");
  });

  test("returns correct label for later status", () => {
    expect(statusLabel("later")).toBe("Later");
  });

  test("returns correct label for shipped status", () => {
    expect(statusLabel("shipped")).toBe("Shipped");
  });

  test("returns correct label for dropped status", () => {
    expect(statusLabel("dropped")).toBe("Dropped");
  });

  test("returns original string for unknown status", () => {
    expect(statusLabel("custom-status")).toBe("custom-status");
  });

  test("returns original string for empty status", () => {
    expect(statusLabel("")).toBe("");
  });
});

// The bordered mono pill is gone (2026-07-29 port): a pill inside a row is a
// card inside a card, and mono is for data rather than for labels. The tests
// that pinned the retired look (the border, the radius, the mono face, and the
// retired --moss / --madder / --text-faint / --ds-gray-1000 palette tokens)
// were describing the wrapper, not the promise. The promise is that the pill
// names the lane, and that is what is asserted here.
describe("StatusPill", () => {
  test("renders unknown status with original label", () => {
    render(<StatusPill status="custom-stage" />);
    expect(screen.getByText("custom-stage")).toBeDefined();
  });

  test("applies custom className when provided", () => {
    const { container } = render(<StatusPill status="now" className="custom-class" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("custom-class");
  });

  test("renders all known statuses correctly", () => {
    for (const status of OPPORTUNITY_STATUSES) {
      const { unmount } = render(<StatusPill status={status} />);
      expect(screen.getByText(STATUS_META[status].label)).toBeDefined();
      unmount();
    }
  });
});

// Same port, same reasoning as StatusPill: the pill, the radius, the mono face
// and the retired --pencil-* / --moss / --text-muted inks are gone. What a
// reader depends on is the WORD and its hover meaning, both asserted below.
describe("DesignationTag", () => {
  test("returns null for undefined designation", () => {
    const result = <DesignationTag designation={undefined} />;
    expect(result.props.children).toBeUndefined();
  });

  test("returns null for 'best bet' designation", () => {
    const result = <DesignationTag designation="best bet" />;
    expect(result.props.children).toBeUndefined();
  });

  test("renders 'needs validation' designation", () => {
    render(<DesignationTag designation="needs validation" />);
    expect(screen.getByText("needs validation")).toBeDefined();
  });

  test("renders 'quick win' designation", () => {
    render(<DesignationTag designation="quick win" />);
    expect(screen.getByText("quick win")).toBeDefined();
  });

  test("renders 'heavy lift' designation", () => {
    render(<DesignationTag designation="heavy lift" />);
    expect(screen.getByText("heavy lift")).toBeDefined();
  });

  test("renders 'watch this week' designation", () => {
    render(<DesignationTag designation="watch this week" />);
    expect(screen.getByText("watch this week")).toBeDefined();
  });

  test("includes title attribute with meaning", () => {
    const { container } = render(<DesignationTag designation="needs validation" />);
    const span = container.querySelector("span");
    expect(span?.title).toBe(DESIGNATION_MEANING["needs validation"]);
  });

  test("applies custom className when provided", () => {
    const { container } = render(
      <DesignationTag designation="quick win" className="custom-class" />,
    );
    const span = container.querySelector("span");
    expect(span?.className).toContain("custom-class");
  });
});

// The stamp was a Geist Pixel wordmark in a moss-tinted, moss-bordered pill.
// Pixel is retired outside the auth door and the tinted chip was decoration, so
// the mark is now the words themselves. The two "moss-tinted" tests here
// asserted `toBeDefined()` against an empty string, so they passed on any
// markup at all and were only ever naming a look that no longer exists.
describe("BestBetStamp", () => {
  test("names itself, so the one chosen opportunity is readable rather than just coloured", () => {
    render(<BestBetStamp />);
    // "Best bet" -> "Best opportunity" (P-14a register sweep).
    expect(screen.getByText("Best opportunity")).toBeDefined();
  });

  test("includes title attribute", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.title).toContain("strongest opportunity");
  });

  test("applies custom className when provided", () => {
    const { container } = render(<BestBetStamp className="custom-class" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("custom-class");
  });

  test("sets flexShrink to 0", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.style.flexShrink).toBe("0");
  });

  test("sets whiteSpace to nowrap", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.style.whiteSpace).toBe("nowrap");
  });
});

describe("STATUS_META constant", () => {
  test("all statuses have entries", () => {
    for (const status of OPPORTUNITY_STATUSES) {
      expect(STATUS_META[status]).toBeDefined();
    }
  });

  test("all entries have color and label", () => {
    for (const status of OPPORTUNITY_STATUSES) {
      expect(STATUS_META[status].color).toBeDefined();
      expect(STATUS_META[status].label).toBeDefined();
    }
  });
});

describe("DESIGNATION_INK constant", () => {
  test("has entries for all non-best-bet designations", () => {
    const expected = ["needs validation", "quick win", "heavy lift", "watch this week"];
    for (const designation of expected) {
      expect(DESIGNATION_INK[designation as any]).toBeDefined();
    }
  });
});

describe("DESIGNATION_MEANING constant", () => {
  test("has entries for all non-best-bet designations", () => {
    const expected = ["needs validation", "quick win", "heavy lift", "watch this week"];
    for (const designation of expected) {
      expect(DESIGNATION_MEANING[designation as any]).toBeDefined();
    }
  });

  test("all meanings are non-empty strings", () => {
    for (const meaning of Object.values(DESIGNATION_MEANING)) {
      expect(typeof meaning).toBe("string");
      expect(meaning.length).toBeGreaterThan(0);
    }
  });
});
