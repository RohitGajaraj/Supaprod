/**
 * ── TWO SHAPES THAT WERE WEARING THE ASKING CARD'S CLOTHES ────────────────
 *
 * P-52. `Gate` was carrying three shapes across twenty call sites and only one
 * of them was a binary ask. These are the other two, and each guard below is a
 * rule that a surface has already broken by not having them.
 */
import { describe, expect, it } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach } from "bun:test";
import { readFileSync } from "node:fs";

import { Choice } from "../Choice";
import { Quiet } from "../Quiet";

afterEach(cleanup);

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const CHOICE_SRC = strip(readFileSync("src/components/meridian/Choice.tsx", "utf8"));
const QUIET_SRC = strip(readFileSync("src/components/meridian/Quiet.tsx", "utf8"));

const OPTIONS = [
  { id: "intercom", label: "Intercom", fact: "2,140 conversations" },
  { id: "zendesk", label: "Zendesk", fact: "318 tickets" },
  { id: "slack", label: "Slack", fact: null },
];

describe("a Choice does not decide by ordering", () => {
  it("pre-selects nothing, because the product does not know which is right", () => {
    /*
     * The rule that separates a Choice from an Ask. An Ask has a primary
     * because one answer is expected and the card can say so honestly; a
     * pre-selected option here would be the product pretending it knows, and a
     * person confirming a pick they did not make reads as consent.
     */
    render(
      <Choice question="Which source should it read first?" options={OPTIONS} onPick={() => {}} />,
    );
    for (const b of screen.getAllByRole("button")) {
      expect(b.getAttribute("aria-pressed")).toBeNull();
      expect(b.className).not.toContain("primary");
    }
  });

  it("says 'unknown' where a fact is missing, never a blank", () => {
    // A blank beside two numbers is the product deciding by ordering again,
    // more quietly: the reader takes it for zero and picks one that answered.
    render(<Choice question="q" options={OPTIONS} onPick={() => {}} />);
    expect(screen.getByText("unknown")).toBeTruthy();
  });

  it("makes the whole row the target, with no radio to hit", () => {
    // A radio reports a selection that does not exist yet, and it is a 12px
    // circle on the device these defects keep being found on.
    expect(CHOICE_SRC).not.toContain('type="radio"');
    expect(CHOICE_SRC).not.toContain("<input");
    render(<Choice question="q" options={OPTIONS} onPick={() => {}} />);
    // One button per option and nothing else to press.
    expect(screen.getAllByRole("button").length).toBe(OPTIONS.length);
  });

  it("answers with the option's id, never its position", () => {
    let picked: string | null = null;
    render(<Choice question="q" options={OPTIONS} onPick={(id) => (picked = id)} />);
    fireEvent.click(screen.getByText("Zendesk"));
    expect(picked).toBe("zendesk");
  });

  it("never resolves itself, so there is no default slot and no timer", () => {
    /*
     * A choice that times out is a delay with extra steps, and it is the defect
     * the gate card's declared default was corrected for one surface over.
     */
    expect(CHOICE_SRC).not.toContain("fallback");
    expect(CHOICE_SRC).not.toContain("setTimeout");
    render(<Choice question="q" options={OPTIONS} onPick={() => {}} />);
    expect(screen.getByText("Nothing is chosen until you pick one.")).toBeTruthy();
  });
});

describe("a Quiet is a state, not a question", () => {
  it("draws no card, no question mark and no control", () => {
    const { container } = render(
      <Quiet
        says="Nothing is waiting on a call."
        whatWillAppear="A call the crew cannot make alone will appear here."
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.textContent).not.toContain("?");
    // No bordered container: a border is what this product uses for something
    // that needs answering.
    expect(container.innerHTML).not.toContain("border-mrd-line");
  });

  it("requires what WILL appear, because reporting only an absence is an apology", () => {
    expect(QUIET_SRC).toContain("whatWillAppear: string;");
    expect(QUIET_SRC).not.toContain("whatWillAppear?:");
  });

  it("REFUSES a queue that is held rather than calming it", () => {
    /*
     * A1's amendment 2, and the sharpest rule in this file. A queue empty
     * because nothing is pointed at a source is not quiet, it is held, and the
     * arrival document already has its sentence and its one door. Calming it
     * would make a workspace that cannot work look like one with nothing to do,
     * and the person would never learn why.
     */
    const { container } = render(
      <Quiet
        says="Nothing is waiting on a call."
        whatWillAppear="..."
        heldBecause="no source is connected"
      />,
    );
    expect(container.innerHTML).toBe("");
  });
});
