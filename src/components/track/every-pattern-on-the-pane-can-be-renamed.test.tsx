/**
 * EVERY PATTERN ON THE PANE CAN BE RENAMED, NOT ONLY THE THIRD WE HOLD A CARD FOR.
 *
 * SESSION-1 lists "rename a theme" as a Discover control. It was true only for
 * a pattern whose theme artifact is a MEMBER of the track, because rename lived
 * on `ThemeCard` and nothing else drew one. Measured over the 1,133 signals
 * attached to tracks: 315 name a theme that is also a member, 818 do not. So
 * the control reached 315 and the heading over the other 818 was a bare span.
 *
 * These tests pin the fix and, more importantly, pin its LIMIT. The named-only
 * heading gets rename and does NOT get "Not a pattern", because dismissing sets
 * a status and this surface cannot see the theme's status, frequency, severity
 * or whether it was already dismissed. `ThemeCard` shows all four before it
 * offers that control; the named-only heading shows none of them. A control
 * that changes state its own screen cannot show is what this pane exists not to
 * do, so the asymmetry is the design and a later sweep should not "finish" it
 * by adding dismiss here.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SenseBody } from "./ArtifactPane";
import type { ArtifactView } from "@/lib/spine/track.functions";

function ui(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

let n = 0;
const signal = (fields: Record<string, unknown>, title?: string): ArtifactView => ({
  kind: "signal",
  word: "signal",
  artifactId: `s-${++n}`,
  createdAt: "2026-08-26T10:00:00Z",
  title: title ?? null,
  missing: false,
  fields,
});
const theme = (id: string, title: string): ArtifactView => ({
  kind: "theme",
  word: "pattern",
  artifactId: id,
  createdAt: "2026-08-26T10:00:00Z",
  title,
  missing: false,
  fields: {},
});

/** A pattern the signal names and the track does not hold: the 818 case. */
const namedOnly = () =>
  signal({ theme_id: "t-away", theme_title: "Mobile checkout" }, "Card form rejects Amex");

describe("a pattern named but not held", () => {
  it("prints its name and offers rename, which it used not to", () => {
    const { getByLabelText, getByText } = ui(
      <SenseBody items={[namedOnly()]} now={0} trackId="trk" />,
    );
    expect(getByLabelText("Mobile checkout")).toBeTruthy();
    expect(getByText("Rename this theme")).toBeTruthy();
  });

  it("does NOT offer dismiss, because it cannot show the status it would change", () => {
    const { container } = ui(<SenseBody items={[namedOnly()]} now={0} trackId="trk" />);
    expect(container.textContent).not.toContain("Not a pattern");
    expect(container.textContent).not.toContain("Bring it back");
  });

  it("opens the rename field in place, on the pattern, not on another screen", () => {
    const { getByText, getByLabelText } = ui(
      <SenseBody items={[namedOnly()]} now={0} trackId="trk" />,
    );
    fireEvent.click(getByText("Rename this theme"));
    expect(getByLabelText("What should this theme be called?")).toBeTruthy();
  });

  it("still draws the evidence under the name, so the control did not cost the grouping", () => {
    const { container } = ui(<SenseBody items={[namedOnly()]} now={0} trackId="trk" />);
    expect(container.textContent).toContain("Card form rejects Amex");
  });
});

describe("the control reaches every pattern, both kinds", () => {
  it("a held theme keeps its own rename, so the two paths say the same words", () => {
    const { getAllByText } = ui(
      <SenseBody
        items={[
          theme("t-here", "Checkout friction"),
          signal({ theme_id: "t-here", theme_title: "Checkout friction" }, "Rage clicks on pay"),
          namedOnly(),
        ]}
        now={0}
        trackId="trk"
      />,
    );
    // One from ThemeCard, one from the named-only heading. Same label on both,
    // because two labels for one action on one pane is the defect §12 names.
    expect(getAllByText("Rename this theme").length).toBe(2);
  });

  it("the ungrouped section offers no rename, because there is no pattern to name", () => {
    const { getByLabelText, container } = ui(
      <SenseBody items={[signal({}, "Lone note")]} now={0} trackId="trk" />,
    );
    expect(getByLabelText("Not yet grouped")).toBeTruthy();
    expect(container.textContent).not.toContain("Rename this theme");
  });

  it("a pattern we can neither draw nor name stays ungrouped rather than headed blank", () => {
    const { getByLabelText, container } = ui(
      <SenseBody
        items={[signal({ theme_id: "t-away" }, "Unnamed pattern")]}
        now={0}
        trackId="trk"
      />,
    );
    expect(getByLabelText("Not yet grouped")).toBeTruthy();
    expect(container.textContent).not.toContain("Rename this theme");
  });
});
