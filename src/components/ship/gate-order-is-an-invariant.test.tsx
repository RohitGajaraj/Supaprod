/**
 * A GATE ASKS, THEN SHOWS ITS REASONS, THEN OFFERS THE BUTTONS. IN THAT ORDER.
 *
 * ── THE REGRESSION THIS EXISTS TO STOP, WHICH ALREADY SHIPPED ONCE ──────
 * 2026-08-05. A change meant to make agent reasoning "visibly obvious" lifted
 * the evidence OUT of the Gate into a titled block placed after it. The actions
 * render last inside a Gate, so that put the reasoning BELOW the Approve button:
 * a person was asked to decide, with a keyboard shortcut, above the reasons for
 * deciding. Both `primitives.Gate` and `meridian/Gate` carry the story in their
 * headers, and until now that is all that carried it -- a paragraph, which is
 * the thing this codebase has repeatedly measured as not enough.
 *
 * `linesLabel` is the other half of the same fix, and the first Meridian draft
 * of `Gate` dropped it. It exists so attribution ("Read from the deploy record")
 * can be added WITHOUT moving the lines somewhere they can be placed wrongly.
 * A prop that only exists to prevent a defect is exactly the prop a tidy-up
 * deletes, so its absence is a failure here rather than a diff nobody reads.
 *
 * ── WHY THIS TEST LIVES WITH SHIP ───────────────────────────────────────
 * Ship carries FOUR of these questions -- take it to production, what will come
 * here to ship, the announcement waiting on an owner, the first announcement --
 * which is more than any other station, and the one that reaches customers is
 * here. It is written against `meridian/Gate` rather than against this route, so
 * it holds for every surface that mounts one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";

import { Gate } from "@/components/meridian/Gate";
import { Approve } from "@/components/meridian/surface-parts";

/** True when `a` comes before `b` in document order. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("the order inside a Gate is the component, not the caller's layout", () => {
  it("puts the question above the evidence and the evidence above the actions", () => {
    render(
      <Gate
        question='Take "Batch firmware push" to production?'
        linesLabel="Read from the deploy record"
        lines={[
          <span key="preview">The preview is up at https://preview.example.com</span>,
          <span key="cost">Customers see it immediately, and undoing it means a revert.</span>,
        ]}
      >
        <Approve>Promote it</Approve>
      </Gate>,
    );

    const question = screen.getByRole("heading", { level: 2 });
    const evidence = screen.getByText(/The preview is up at/);
    const action = screen.getByRole("button", { name: /Promote it/ });

    expect(precedes(question, evidence)).toBe(true);
    expect(precedes(evidence, action)).toBe(true);
  });

  it("keeps the attribution ON the lines rather than beside them", () => {
    // The whole point of `linesLabel`: the caption that says where the facts
    // came from renders INSIDE the evidence block, so adding it can never be a
    // reason to move the facts out of the Gate.
    render(
      <Gate question="Publish it?" linesLabel="Read from the deploy record" lines={["A fact."]}>
        <Approve>Publish it</Approve>
      </Gate>,
    );

    const label = screen.getByText("Read from the deploy record");
    const line = screen.getByText("A fact.");
    const action = screen.getByRole("button", { name: /Publish it/ });

    expect(precedes(label, line)).toBe(true);
    expect(precedes(line, action)).toBe(true);
  });

  it("still offers `linesLabel` at all, which the first Meridian draft dropped", () => {
    const src = readFileSync(
      new URL("../meridian/Gate.tsx", import.meta.url).pathname.replace(/%20/g, " "),
      "utf8",
    );
    expect(src).toMatch(/linesLabel\?:/);
  });
});

describe("Ship's own gates argue before they ask", () => {
  const src = readFileSync(
    new URL("../../routes/_authenticated.ship.tsx", import.meta.url).pathname.replace(/%20/g, " "),
    "utf8",
  );

  it("hands every gate its evidence through `lines` and never as a sibling", () => {
    // Four questions on this station, and each one is a `<Gate` with a `lines`
    // prop. A gate whose reasons were rendered as a block AFTER it would show up
    // here as an opening tag with no `lines=` in it, which is the exact shape of
    // the 2026-08-05 defect.
    const opens = src.match(/<Gate\b[\s\S]*?(?=\n\s*>)/g) ?? [];
    expect(opens.length).toBe(4);
    for (const tag of opens) {
      expect(tag).toContain("question=");
      expect(tag).toContain("lines=");
    }
  });

  it("puts the promote's reasons in the gate that asks for the promote", () => {
    // The one call on this station that reaches customers. Its cost sentence
    // and the address it is about are both `lines`, above the control.
    const flat = src.replace(/\s+/g, " ");
    const gate = flat.slice(flat.indexOf('question={`Take "${ready[0].title}" to production?`}'));
    const body = gate.slice(0, gate.indexOf("</Gate>"));
    expect(body.indexOf("lines={[")).toBeGreaterThanOrEqual(0);
    expect(body.indexOf("lines={[")).toBeLessThan(body.indexOf("<Approve"));
    expect(body).toContain("It moves that same commit to the production address.");
  });
});
