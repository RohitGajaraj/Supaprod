/**
 * DISCARDING A PIECE OF EVIDENCE IS PERMANENT, SO IT TAKES TWO ACTS.
 *
 * `deleteSignal` is a hard `DELETE` on `signals`: no status column, no "Bring it
 * back", no undo anywhere in the product. It fired on ONE click, on a card a
 * person reads while an agent works beside them.
 *
 * The inconsistency is what gives it away. `ThemeCard`'s "Not a pattern" opens a
 * panel, asks why, and is REVERSIBLE. The irreversible control was the casual
 * one, and that is exactly backwards.
 *
 * The second defect these pin is smaller and worse to meet. The failure line was
 * the `else` of the button, so a discard that FAILED replaced the only control
 * on the card with an explanation: the person was told it did not work and left
 * with nothing to try again with. A dead end reached through an error path is
 * still a dead end (R-20 §5).
 *
 * No reason is asked for and that is deliberate: `deleteSignal` takes an id and
 * nothing else, so a reason field would collect words the product throws away.
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
const signal = (title: string): ArtifactView => ({
  kind: "signal",
  word: "signal",
  artifactId: `s-${++n}`,
  createdAt: "2026-08-26T10:00:00Z",
  title,
  missing: false,
  fields: {},
});

describe("the first click asks rather than deletes", () => {
  it("offers the discard, and says nothing permanent yet", () => {
    const { getByText, container } = ui(
      <SenseBody items={[signal("Card form rejects Amex")]} now={0} trackId="trk" />,
    );
    expect(getByText("Discard this finding")).toBeTruthy();
    // The warning belongs to the confirm, not to the resting card.
    expect(container.textContent).not.toContain("Nothing brings it back");
  });

  it("the first click replaces one control with a choice, and deletes nothing", () => {
    const { getByText, queryByText } = ui(
      <SenseBody items={[signal("Card form rejects Amex")]} now={0} trackId="trk" />,
    );
    fireEvent.click(getByText("Discard this finding"));

    expect(getByText("Discard it for good")).toBeTruthy();
    expect(getByText("Keep it")).toBeTruthy();
    // The single-click door is gone while the question is open.
    expect(queryByText("Discard this finding")).toBeNull();
  });

  it("names what is permanent, in the words the record can back", () => {
    const { getByText, container } = ui(
      <SenseBody items={[signal("Card form rejects Amex")]} now={0} trackId="trk" />,
    );
    fireEvent.click(getByText("Discard this finding"));
    expect(container.textContent).toContain("This deletes it for good. Nothing brings it back.");
  });

  it("asks for no reason, because nothing would store one", () => {
    const { getByText, queryByLabelText } = ui(
      <SenseBody items={[signal("Card form rejects Amex")]} now={0} trackId="trk" />,
    );
    fireEvent.click(getByText("Discard this finding"));
    // `deleteSignal` takes an id and nothing else. A field here would collect
    // words the product then drops, which is worse than not asking.
    expect(queryByLabelText(/why/i)).toBeNull();
  });
});

describe("backing out is a real door, not a decoration", () => {
  it("Keep it returns the card to rest with the evidence untouched", () => {
    const { getByText, queryByText, container } = ui(
      <SenseBody items={[signal("Card form rejects Amex")]} now={0} trackId="trk" />,
    );
    fireEvent.click(getByText("Discard this finding"));
    fireEvent.click(getByText("Keep it"));

    expect(getByText("Discard this finding")).toBeTruthy();
    expect(queryByText("Discard it for good")).toBeNull();
    expect(container.textContent).not.toContain("Nothing brings it back");
    expect(container.textContent).toContain("Card form rejects Amex");
  });

  it("the confirm can be opened again after backing out", () => {
    const { getByText } = ui(
      <SenseBody items={[signal("Card form rejects Amex")]} now={0} trackId="trk" />,
    );
    fireEvent.click(getByText("Discard this finding"));
    fireEvent.click(getByText("Keep it"));
    fireEvent.click(getByText("Discard this finding"));
    expect(getByText("Discard it for good")).toBeTruthy();
  });
});
