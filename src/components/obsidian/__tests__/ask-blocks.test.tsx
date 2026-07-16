import { describe, it, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import * as RealRouter from "@tanstack/react-router";
import { formatAuditId } from "@/lib/audit-id";
import type { AnswerBlock } from "@/lib/ask-blocks";

/**
 * DOM-mounted tests for the PC-36 answer-block cards (ask-blocks.tsx),
 * following the sketch-components-dom.test.tsx conventions (bun:test +
 * RTL render/screen on the happy-dom preloaded via bunfig).
 *
 * Mock strategy (mock.module + dynamic import, the notify.test.ts house
 * pattern), kept minimal so the real cards AND the real AuditTag render:
 * - "@tanstack/react-router": only Link is replaced (a plain anchor with the
 *   params resolved into the href) because Link throws outside a
 *   RouterProvider; every other export is passed through untouched so
 *   transitive consumers keep working.
 * - "@/components/cadence/AuditLineageSheet": AuditTag value-imports
 *   openLineage from it, and the real module drags in server-function graphs
 *   (audit-lineage/trust-chain) irrelevant to a presentational test.
 * - "@/lib/ask-canvas.functions": value-imported by ask-canvas.tsx (loaded
 *   for the real runStatusLabel, which stays under test); mocked so no
 *   server-fn module graph loads.
 */

mock.module("@tanstack/react-router", () => ({
  ...RealRouter,
  Link: ({
    to,
    params,
    style,
    children,
  }: {
    to: string;
    params?: Record<string, string>;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }) => {
    let href = String(to);
    for (const [key, value] of Object.entries(params ?? {})) {
      href = href.replace(`$${key}`, String(value));
    }
    return (
      <a href={href} style={style}>
        {children}
      </a>
    );
  },
}));

mock.module("@/components/cadence/AuditLineageSheet", () => ({
  OPEN_LINEAGE_EVENT: "cadence:open-lineage",
  openLineage: () => {},
  AuditLineageSheet: () => null,
}));

mock.module("@/lib/ask-canvas.functions", () => ({
  getAskMissionCanvas: async () => null,
}));

const {
  AnswerBlocks,
  DecisionBlockCard,
  OpportunityBlockCard,
  MissionBlockCard,
  StatusDigestBlock,
  TimelineBlock,
} = await import("../ask-blocks");

// Distinct from the timeline event ref below ("DEC·A1B2C3") so getByText
// can tell the clickable decision receipt from the static timeline marker.
const DECISION_ID = "d4c3b2a1-0000-0000-0000-000000000001";
const OPPORTUNITY_ID = "b2c3d4e5-0000-0000-0000-000000000002";
const MISSION_ID = "c3d4e5f6-0000-0000-0000-000000000003";

// Noon UTC keeps the en-US short date stable ("Jul 14") across the
// machine timezones this repo is developed in.
const decision: Extract<AnswerBlock, { kind: "decision" }> = {
  kind: "decision",
  id: DECISION_ID,
  title: "Adopt the credit-based pricing model",
  status: "adopted",
  rationale:
    "BYOK usage stays unmetered while managed model calls draw down credits, which keeps the free tier honest and the upgrade path legible for teams that outgrow it.",
  decidedBy: "strategist",
  sourceKind: "ask",
  createdAt: "2026-07-14T12:00:00Z",
};

const opportunity: Extract<AnswerBlock, { kind: "opportunity" }> = {
  kind: "opportunity",
  id: OPPORTUNITY_ID,
  title: "Self-serve workspace onboarding",
  status: "scored",
  iceScore: 7.5,
};

const mission: Extract<AnswerBlock, { kind: "mission" }> = {
  kind: "mission",
  id: MISSION_ID,
  title: "Ship the answer-block vocabulary",
  status: "running",
  goal: "Render typed entity cards above prose in the Ask panel so every internal answer carries its receipts.",
  createdAt: "2026-07-13T12:00:00Z",
};

const statusDigest: Extract<AnswerBlock, { kind: "status" }> = {
  kind: "status",
  scopeLabel: "this week",
  counts: { running: 2, waiting: 1, done: 5, failed: 0 },
  running: [
    { id: "r1", title: "Density pass on the tables", status: "running" },
    { id: "r2", title: "Capability history wiring", status: "running" },
  ],
};

const timeline: Extract<AnswerBlock, { kind: "timeline" }> = {
  kind: "timeline",
  label: "last 14 days",
  events: [
    { at: "2026-07-10T12:00:00Z", label: "Proof campaign kicked off", detail: null, ref: null },
    {
      at: "2026-07-13T12:00:00Z",
      label: "Audit-id system landed",
      detail: "P1 resolver + tags",
      ref: "DEC·A1B2C3",
    },
    { at: "2026-07-14T12:00:00Z", label: "Pricing model adopted", detail: null, ref: null },
  ],
};

describe("AnswerBlocks", () => {
  it("renders nothing for an empty array", () => {
    const { container } = render(<AnswerBlocks blocks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders every block kind with its title or label content", () => {
    const blocks: AnswerBlock[] = [decision, opportunity, mission, timeline, statusDigest];
    const { container } = render(<AnswerBlocks blocks={blocks} />);

    // Kind headers
    expect(screen.getByText("DECISION")).toBeDefined();
    expect(screen.getByText("OPPORTUNITY")).toBeDefined();
    expect(screen.getByText("MISSION")).toBeDefined();
    expect(screen.getByText("TIMELINE")).toBeDefined();
    expect(screen.getByText("THIS WEEK")).toBeDefined();

    // Entity titles
    expect(screen.getByText(decision.title)).toBeDefined();
    expect(screen.getByText(opportunity.title)).toBeDefined();
    expect(screen.getByText(mission.title)).toBeDefined();

    // Every entity card carries its clickable AuditTag receipt
    for (const [kind, id] of [
      ["decision", DECISION_ID],
      ["opportunity", OPPORTUNITY_ID],
      ["mission", MISSION_ID],
    ] as const) {
      const tag = screen.getByText(formatAuditId(kind, id));
      expect(tag.getAttribute("role")).toBe("button");
    }

    // One card per block in a vertical column
    expect((container.firstChild as HTMLElement).children.length).toBe(blocks.length);
  });
});

describe("DecisionBlockCard", () => {
  it("renders status, footer meta, and a clamped rationale", () => {
    render(<DecisionBlockCard block={decision} />);

    expect(screen.getByText("adopted")).toBeDefined();
    expect(screen.getByText("by strategist · Jul 14")).toBeDefined();

    const rationale = screen.getByText(/BYOK usage stays unmetered/);
    // Clamp presence, not pixel measurement. happy-dom's CSS parser drops
    // the -webkit-box / -webkit-line-clamp / -webkit-box-orient trio from
    // inline styles (verified by probe; same limitation class as the
    // borderTop note in sketch-components-dom.test.tsx), so the surviving
    // inline `overflow: hidden` is the clamp anatomy's marker here.
    expect(rationale.style.overflow).toBe("hidden");
  });

  it("renders no rationale node when rationale is null", () => {
    const { container } = render(<DecisionBlockCard block={{ ...decision, rationale: null }} />);
    // The clamped rationale is the only inline overflow:hidden node in the
    // card (truncation elsewhere is class-based), so zero such nodes means
    // no rationale element rendered at all.
    const clamped = Array.from(container.querySelectorAll("div")).filter(
      (el) => (el as HTMLElement).style.overflow === "hidden",
    );
    expect(clamped.length).toBe(0);
  });

  it("omits the decidedBy fragment when unset", () => {
    render(<DecisionBlockCard block={{ ...decision, decidedBy: null }} />);
    expect(screen.getByText("Jul 14")).toBeDefined();
    expect(screen.queryByText(/by strategist/)).toBeNull();
  });
});

describe("OpportunityBlockCard", () => {
  it("renders the status word and the ICE score", () => {
    render(<OpportunityBlockCard block={opportunity} />);
    expect(screen.getByText("scored")).toBeDefined();
    expect(screen.getByText("ICE 7.5")).toBeDefined();
  });

  it("renders no ICE fragment when iceScore is null", () => {
    render(<OpportunityBlockCard block={{ ...opportunity, iceScore: null, status: null }} />);
    expect(screen.queryByText(/^ICE/)).toBeNull();
    // Null status renders no second header label either
    expect(screen.queryByText("scored")).toBeNull();
  });
});

describe("MissionBlockCard", () => {
  it("renders the outcome-named status via runStatusLabel and the Build link", () => {
    render(<MissionBlockCard block={mission} />);

    // The REAL runStatusLabel mapping: raw "running" never leaks through
    expect(screen.getByText("BUILDING")).toBeDefined();

    const link = screen.getByText("Open in Build →").closest("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe(`/build/${MISSION_ID}`);
  });

  it("clamps the goal to two lines and drops it when null", () => {
    render(<MissionBlockCard block={mission} />);
    const goal = screen.getByText(/Render typed entity cards/);
    // See the clamp-readback note in the DecisionBlockCard suite: inline
    // overflow:hidden is the clamp marker happy-dom preserves.
    expect(goal.style.overflow).toBe("hidden");

    const { container } = render(<MissionBlockCard block={{ ...mission, goal: null }} />);
    const clamped = Array.from(container.querySelectorAll("div")).filter(
      (el) => (el as HTMLElement).style.overflow === "hidden",
    );
    expect(clamped.length).toBe(0);
  });
});

describe("StatusDigestBlock", () => {
  it("shows the correct counts strip text", () => {
    const { container } = render(<StatusDigestBlock block={statusDigest} />);
    expect(container.textContent).toContain("2 RUNNING · 1 WAITING · 5 DONE · 0 FAILED");
    // Running rows list their titles
    expect(screen.getByText("Density pass on the tables")).toBeDefined();
    expect(screen.getByText("Capability history wiring")).toBeDefined();
  });

  it("caps the running list at four rows", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      id: `run-${i}`,
      title: `Running mission ${i}`,
      status: "running",
    }));
    render(
      <StatusDigestBlock
        block={{ ...statusDigest, counts: { ...statusDigest.counts, running: 5 }, running: five }}
      />,
    );
    expect(screen.getByText("Running mission 3")).toBeDefined();
    expect(screen.queryByText("Running mission 4")).toBeNull();
  });
});

describe("TimelineBlock", () => {
  it("renders events in the given order with refs as static text", () => {
    const { container } = render(<TimelineBlock block={timeline} />);

    expect(screen.getByText("last 14 days")).toBeDefined();

    const text = container.textContent ?? "";
    const first = text.indexOf("Proof campaign kicked off");
    const second = text.indexOf("Audit-id system landed");
    const third = text.indexOf("Pricing model adopted");
    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);

    // Dates render short-form; detail rides along in mono
    expect(screen.getByText("Jul 10")).toBeDefined();
    expect(screen.getByText("P1 resolver + tags")).toBeDefined();

    // The ref is an honest static receipt marker, NOT a clickable tag:
    // TimelineEvent carries only the formatted ref, never the raw uuid an
    // AuditTag needs, so there is no button role anywhere in the block.
    const ref = screen.getByText("DEC·A1B2C3");
    expect(ref.getAttribute("role")).toBeNull();
    expect(container.querySelector("[role='button']")).toBeNull();
  });
});
