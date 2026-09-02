/**
 * WHERE THIS RUN CAME FROM, ON THE SCREEN, FOR THE FIRST TIME.
 *
 * ── THE HOLE THIS CLOSES, AND IT IS THE PRODUCT'S OWN CLAIM ───────────────
 * Evidence becoming work on its own is the thing this product says it does. The
 * machinery is real and shipped: `promote.server.ts` runs every cluster past a
 * bar, `qualifies()` composes the sentence saying why one cleared it, and
 * `originFor()` writes that sentence onto `spine_tracks.origin` at the moment of
 * the decision, before anybody knows how it turns out.
 *
 * **And no screen read it.** Grepped 2026-09-02: `qualifies` and `originFor`
 * appear only in `src/lib/spine/` and their own tests, zero times under
 * `src/components` or `src/routes`. The most convincing thing the loop does
 * happened, was written down at the moment it happened, and was shown to nobody.
 *
 * ── THE TWO THINGS THESE TESTS REFUSE ─────────────────────────────────────
 *  1. A BAR THAT WAS NOT READ. `DEFAULT_PROMOTION_BAR` is 8 / 4 / 0.75 and a
 *     workspace can override all three. Printing the shipped default beside a
 *     workspace that set its own is a number that looks measured and is not.
 *     No workspace, no bar clause.
 *  2. A PROMOTION CLAIMED FROM THE WRONG COLUMN. A theme on the record proves
 *     clustering happened, not that clustering STARTED anything: a Discover seat
 *     files themes on tracks a person typed. Only `origin` separates them.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SenseBody } from "./ArtifactPane";
import { becameWorkOnItsOwn, originFor, PROMOTED_BECAUSE } from "@/lib/spine/promote";
import type { ArtifactView } from "@/lib/spine/track.functions";

function ui(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

let n = 0;
const theme = (fields: Record<string, unknown>, title = "Checkout drops Amex"): ArtifactView => ({
  kind: "theme",
  word: "cluster",
  artifactId: `t-${++n}`,
  createdAt: "2026-09-01T10:00:00Z",
  title,
  missing: false,
  fields: fields as never,
});

const signal = (fields: Record<string, unknown> = {}): ArtifactView => ({
  kind: "signal",
  word: "finding",
  artifactId: `s-${++n}`,
  createdAt: "2026-09-01T09:00:00Z",
  title: "Card form rejects Amex",
  missing: false,
  fields: { content: "It rejects the card", source: "intercom", ...fields } as never,
});

const PROMOTED = originFor({
  title: "Checkout drops Amex",
  summary: "Amex is refused at checkout.",
  frequency: 12,
  severity: 5,
  confidence: 0.95,
  status: "open",
});

describe("the sentence the loop wrote when it decided", () => {
  it("is written by exactly one place, and reads as one", () => {
    expect(PROMOTED).toContain(PROMOTED_BECAUSE);
    expect(becameWorkOnItsOwn(PROMOTED)).toBe(true);
  });

  it("does not mistake a person's own sentence for the loop's", () => {
    expect(becameWorkOnItsOwn("Make checkout accept an Amex card")).toBe(false);
    expect(becameWorkOnItsOwn(null)).toBe(false);
    expect(becameWorkOnItsOwn("")).toBe(false);
  });
});

describe("a run that started itself", () => {
  const items = [
    theme({ frequency: 12, severity: 5, confidence: 0.95, summary: "Amex is refused." }),
    signal({ theme_id: "t-away", theme_title: "Checkout drops Amex" }),
  ];

  it("names the cluster it came from", () => {
    const { getAllByText } = ui(
      <SenseBody items={items} now={0} trackId="trk" origin={PROMOTED} workspaceId={null} />,
    );
    /* `getAllBy`, not `getBy`: the name appears in the lineage AND on the
       cluster's own card below it, which is correct -- the lineage says where
       the run came from and the card is the cluster itself, with its controls. */
    expect(getAllByText("Checkout drops Amex").length).toBeGreaterThan(0);
  });

  it("prints the sentence the loop recorded at the moment it decided, verbatim", () => {
    const { container } = ui(
      <SenseBody items={items} now={0} trackId="trk" origin={PROMOTED} workspaceId={null} />,
    );
    // Verbatim, because rewriting it makes it a summary of a decision rather
    // than the decision. This is the record the product is sold on.
    expect(container.textContent).toContain(PROMOTED_BECAUSE);
    expect(container.textContent).toContain("12 signals say it");
  });

  it("states the numbers it was judged on", () => {
    const { container } = ui(
      <SenseBody items={items} now={0} trackId="trk" origin={PROMOTED} workspaceId={null} />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("seen 12 times");
    expect(text).toContain("severity 5");
    expect(text).toContain("confidence 0.95");
  });

  it("draws no bar it could not read, rather than the shipped default", () => {
    /*
     * THE ONE THAT MATTERS. `DEFAULT_PROMOTION_BAR` is 8 / 4 / 0.75 and every
     * one of those is overridable per workspace (`workspaces.promotion_min_*`).
     * With no workspace to read, printing the default would be a claim about
     * this workspace that nobody made, dressed as a measurement.
     */
    const { container } = ui(
      <SenseBody items={items} now={0} trackId="trk" origin={PROMOTED} workspaceId={null} />,
    );
    expect(container.textContent).not.toContain("over a bar of");
  });

  it("says the evidence is below it, because it is", () => {
    const { container } = ui(
      <SenseBody items={items} now={0} trackId="trk" origin={PROMOTED} workspaceId={null} />,
    );
    expect(container.textContent).toContain("Everything it clustered is below");
  });
});

describe("a run somebody typed", () => {
  it("says so, rather than leaving the space where a lineage would be", () => {
    const { container } = ui(
      <SenseBody
        items={[]}
        now={0}
        trackId="trk"
        origin="Make checkout accept an Amex card"
        workspaceId={null}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("started from a sentence somebody typed");
    expect(text).not.toContain(PROMOTED_BECAUSE);
  });

  it("does not claim a cluster started it just because a cluster is on the record", () => {
    /*
     * A Discover seat that runs on a typed track files themes at `sense`. The
     * member row cannot tell that apart from the theme that STARTED a track, so
     * the promotion sentence is claimed from `origin` and nowhere else.
     */
    const { container } = ui(
      <SenseBody
        items={[theme({ frequency: 3, severity: 2, confidence: 0.4 }), signal()]}
        now={0}
        trackId="trk"
        origin="Make checkout accept an Amex card"
        workspaceId={null}
      />,
    );
    expect(container.textContent).not.toContain(PROMOTED_BECAUSE);
    // The cluster and its numbers are still shown: it exists and it was made here.
    expect(container.textContent).toContain("seen 3 times");
  });
});
