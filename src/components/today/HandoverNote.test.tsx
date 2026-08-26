/**
 * THE PAINT HALF OF THE HANDOVER NOTE, RENDERED, NOT ONLY DERIVED.
 *
 * `handoffs.test.ts` proves which handover is picked and what the sentence
 * says. This file proves the other half of the contract a row-level line
 * carries: it takes space only when there is a fact, and the fact it draws is
 * the one it was given — never a composed stand-in.
 *
 * NOT PROVEN HERE, SAID PLAINLY: the query wiring in `HandoverNote` (key,
 * interval, workspace scoping) needs the server-fn runtime and a signed-in
 * session, and this machine holds no `.env` and no demo password — the access
 * ask names it. What is proven is everything downstream of the read.
 */

import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { HandoverLine } from "./HandoverNote";

describe("HandoverLine", () => {
  it("draws the sentence when there is a handover", () => {
    const { container } = render(
      <HandoverLine line="Handed over by Scout 4m ago: “Draft the launch spec”" />,
    );
    expect(container.textContent).toContain("Handed over by Scout 4m ago");
    expect(container.textContent).toContain("Draft the launch spec");
  });

  it("draws nothing when the work never changed hands", () => {
    const { container } = render(<HandoverLine line={null} />);
    expect(container.textContent).toBe("");
  });
});
