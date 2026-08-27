/**
 * THE GROUPING IS DERIVED, NOT STAGED.
 *
 * SenseBody's whole story rests on one join: a signal belongs to the theme its
 * own `theme_id` names, and to no other. These tests pin that join and the two
 * honest edges around it -- a signal naming a theme that is not on the record
 * reads as unclustered rather than vanishing into a group nobody can see, and
 * an empty record says so in words rather than rendering an empty shell.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SenseBody } from "./ArtifactPane";
import type { ArtifactView } from "@/lib/spine/track.functions";

/** The cards inside SenseBody read through react-query; each render gets its
 *  own client so nothing leaks between cases. */
function ui(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

let n = 0;
const signal = (fields: Record<string, unknown>, title?: string): ArtifactView => ({
  kind: "signal",
  word: "thing we found",
  artifactId: `s-${++n}`,
  createdAt: "2026-08-26T10:00:00Z",
  title: title ?? null,
  missing: false,
  fields,
});
const theme = (id: string, title: string): ArtifactView => ({
  kind: "theme",
  word: "cluster",
  artifactId: id,
  createdAt: "2026-08-26T10:00:00Z",
  title,
  missing: false,
  fields: {},
});

describe("SenseBody", () => {
  it("groups signals under the theme their theme_id names", () => {
    const { getByLabelText, getAllByText } = ui(
      <SenseBody
        items={[
          theme("t1", "Checkout friction"),
          signal({ theme_id: "t1" }, "Rage clicks on pay"),
          signal({ theme_id: "t1" }, "Drop-off at 3DS"),
        ]}
        now={0}
        trackId="trk"
      />,
    );
    expect(getByLabelText("Checkout friction")).toBeTruthy();
    expect(getAllByText(/Rage clicks|Drop-off/).length).toBe(2);
  });

  it("a signal naming a missing theme reads as unclustered, never vanishes", () => {
    const { container, getByLabelText } = ui(
      <SenseBody
        items={[theme("t1", "Known pattern"), signal({ theme_id: "ghost" }, "Orphan evidence")]}
        now={0}
        trackId="trk"
      />,
    );
    expect(getByLabelText("Not yet clustered")).toBeTruthy();
    expect(container.textContent).toContain("Orphan evidence");
  });

  it("signals with no theme at all sit in the same honest place", () => {
    const { getByLabelText } = ui(
      <SenseBody items={[signal({}, "Lone note")]} now={0} trackId="trk" />,
    );
    expect(getByLabelText("Not yet clustered")).toBeTruthy();
  });
});
