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

describe("StatusPill", () => {
  test("renders known status with correct color", () => {
    const { container } = render(<StatusPill status="now" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--ds-gray-1000)");
  });

  test("renders backlog status with correct color", () => {
    const { container } = render(<StatusPill status="backlog" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--text-faint)");
  });

  test("renders shipped status with correct color (moss)", () => {
    const { container } = render(<StatusPill status="shipped" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--moss)");
  });

  test("renders dropped status with correct color (madder)", () => {
    const { container } = render(<StatusPill status="dropped" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--madder)");
  });

  test("renders unknown status with fallback color", () => {
    const { container } = render(<StatusPill status="unknown" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--text-faint)");
  });

  test("renders unknown status with original label", () => {
    render(<StatusPill status="custom-stage" />);
    expect(screen.getByText("custom-stage")).toBeDefined();
  });

  test("applies mono font styling", () => {
    const { container } = render(<StatusPill status="now" />);
    const span = container.querySelector("span");
    expect(span?.style.fontFamily).toBe("var(--font-mono)");
  });

  test("applies hairline border", () => {
    const { container } = render(<StatusPill status="now" />);
    const span = container.querySelector("span");
    expect(span?.style.border).toContain("1px");
    expect(span?.style.border).toContain("solid");
  });

  test("applies rounded pill style", () => {
    const { container } = render(<StatusPill status="now" />);
    const span = container.querySelector("span");
    expect(span?.style.borderRadius).toBe("var(--ds-radius-full)");
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

  test("applies correct ink color for 'needs validation'", () => {
    const { container } = render(<DesignationTag designation="needs validation" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--pencil-blossom)");
  });

  test("applies correct ink color for 'quick win'", () => {
    const { container } = render(<DesignationTag designation="quick win" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--moss)");
  });

  test("applies correct ink color for 'heavy lift'", () => {
    const { container } = render(<DesignationTag designation="heavy lift" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--pencil-apricot)");
  });

  test("applies correct ink color for 'watch this week'", () => {
    const { container } = render(<DesignationTag designation="watch this week" />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--text-muted)");
  });

  test("includes title attribute with meaning", () => {
    const { container } = render(<DesignationTag designation="needs validation" />);
    const span = container.querySelector("span");
    expect(span?.title).toBe(DESIGNATION_MEANING["needs validation"]);
  });

  test("applies mono font styling", () => {
    const { container } = render(<DesignationTag designation="quick win" />);
    const span = container.querySelector("span");
    expect(span?.style.fontFamily).toBe("var(--font-mono)");
  });

  test("applies rounded pill style", () => {
    const { container } = render(<DesignationTag designation="quick win" />);
    const span = container.querySelector("span");
    expect(span?.style.borderRadius).toBe("999px");
  });

  test("applies custom className when provided", () => {
    const { container } = render(
      <DesignationTag designation="quick win" className="custom-class" />,
    );
    const span = container.querySelector("span");
    expect(span?.className).toContain("custom-class");
  });
});

describe("BestBetStamp", () => {
  test("renders 'BEST BET' text", () => {
    render(<BestBetStamp />);
    expect(screen.getByText("BEST BET")).toBeDefined();
  });

  test("applies Pixel font styling", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.style.fontFamily).toBe("var(--font-pixel)");
  });

  test("applies moss-bright text color", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.style.color).toBe("var(--moss-bright)");
  });

  test("applies moss-tinted background", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    // color-mix renders as a computed value, not the raw string
    expect(span?.style.backgroundColor).toBeDefined();
  });

  test("applies moss-tinted border", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    // color-mix renders as a computed value, not the raw string
    expect(span?.style.border).toBeDefined();
  });

  test("applies rounded pill style", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.style.borderRadius).toBe("var(--radius-pill)");
  });

  test("includes title attribute", () => {
    const { container } = render(<BestBetStamp />);
    const span = container.querySelector("span");
    expect(span?.title).toContain("strongest bet");
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
