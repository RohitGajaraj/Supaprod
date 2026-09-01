/**
 * `PromotionCard`: A LESSON GRADUATING IS AN EVENT.
 *
 * What is asserted here is what a reader cannot check by looking, and what a
 * later edit could quietly undo.
 *
 *   THE THIRD ANSWER SURVIVES. "Not yet" and "never" are different acts and the
 *   queue fills with the same rejected lesson forever if they collapse into one.
 *   The shipped write path has only two verbs today (`decideMemoryCandidate`
 *   takes `approve | reject`), so the pressure to drop one of these is real and
 *   the test is what holds the third open.
 *
 *   A MEASUREMENT IS NEVER OFFERED FOR PROMOTION. The card asks
 *   `resolveMemoryScope`, so a row that is a measurement about one product must
 *   render no promotion control at all. Too wide is the dangerous direction: for
 *   an agency running three clients in one workspace, one client's numbers
 *   reaching another client's ranking is a confidentiality breach, not noise. A
 *   card that offered the button would be the one place a person could cause it.
 *
 *   THE RESTING STATE IS NOT GREEN. A proposed promotion has not happened, and
 *   green reports an outcome that has. The whole grammar of the component is
 *   `you` before, `pass` or `fail` after, so both halves are pinned.
 *
 *   IT NEVER CLAIMS ACCUMULATED LEARNING. The canon forbids the present tense
 *   here and this surface is where it is most tempting, so the vocabulary sweep
 *   runs over the rendered text of every state including the empty one.
 *
 *   `data-mrd` ON EVERY ROOT, including the settled state's, or the controls and
 *   any door inside it fall back to the unlayered legacy focus ring.
 *
 * happy-dom carries no stylesheet, so `getComputedStyle` cannot answer what a
 * Tailwind utility paints. Reading the class name is the honest limit, and it is
 * the precedent `refused.test.tsx` and `catalog-parts.test.tsx` already set in
 * this directory.
 */
import * as React from "react";
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  NoPromotions,
  PromotionCard,
  type PromotionEvidence,
  type PromotionOutcome,
} from "../PromotionCard";

/** The markup of one node, with the document's ground set first. */
function paintOf(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  const markup = container.innerHTML;
  unmount();
  return markup;
}

/** The rendered text of one node, which is what a person actually reads. */
function textOf(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  const text = container.textContent ?? "";
  unmount();
  return text;
}

function inBothGrounds(node: React.ReactElement): { dark: string; light: string } {
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  const dark = paintOf(node);

  root.setAttribute("data-theme", "light");
  const light = paintOf(node);
  root.removeAttribute("data-theme");

  return { dark, light };
}

/*
 * A REAL LESSON, A REAL KIND AND A REAL CONSUMER.
 *
 * `reflection` is what `reflection.server.ts` actually writes and it is one of
 * the method kinds, so this row is genuinely promotable rather than promotable
 * because the fixture says so. The evidence is an outcome, which is what settled
 * verdicts are written as: nothing in the shipped code writes `precedent`.
 */
const EVIDENCE: PromotionEvidence[] = [
  { key: "e1", label: "The retry window was the cause, not the sending domain", onOpen: () => {} },
  { key: "e2", label: "Two later sends recovered once the window was widened" },
];

const GUIDES = [
  "Decide reads it before it ranks the next bet.",
  "Plan cites it in the spec rather than re-deriving it.",
];

function card(over: Partial<React.ComponentProps<typeof PromotionCard>> = {}) {
  return (
    <PromotionCard
      lesson="Check the send window before blaming deliverability"
      learnedIn="Fieldwork"
      kind="reflection"
      evidence={EVIDENCE}
      guides={GUIDES}
      {...over}
    />
  );
}

/** The card a measurement produces, which is the commonest row in production. */
function measurement(over: Partial<React.ComponentProps<typeof PromotionCard>> = {}) {
  return card({
    kind: "outcome",
    lesson: "Checkout retry lifted completion from 6.3 to 7.0",
    ...over,
  });
}

describe("PromotionCard is inside the system", () => {
  it("carries data-mrd on its root, or its three controls lose the ring", () => {
    const { container, unmount } = render(card());
    expect(
      (container.firstElementChild as HTMLElement).hasAttribute("data-mrd"),
      "the card rendered outside Meridian, so every control on it takes the legacy [data-obsidian] ring",
    ).toBe(true);
    unmount();
  });

  it("keeps data-mrd on the settled state, which is a second root", () => {
    render(card());
    fireEvent.click(screen.getByRole("button", { name: /Let it guide the workspace/ }));
    const settled = screen.getByRole("status");
    expect(
      settled.hasAttribute("data-mrd"),
      "the settled state dropped data-mrd, which is exactly how an early return loses the ring",
    ).toBe(true);
  });

  it("renders identically in both grounds", () => {
    const { dark, light } = inBothGrounds(card());
    expect(dark, "the card drew something ground-specific").toBe(light);
    const stuck = inBothGrounds(measurement());
    expect(stuck.dark, "the not-promotable card drew something ground-specific").toBe(stuck.light);
  });

  it("writes no raw colour and no retired token", () => {
    for (const node of [card(), measurement(), <NoPromotions key="empty" />]) {
      const markup = paintOf(node);
      for (const marker of [
        "--sp-",
        "--ds-",
        "--text-",
        "--hairline",
        "--madder",
        "--glacier",
        "--font-pixel",
        "--raised",
        "data-obsidian",
      ]) {
        expect(markup, `the card still speaks ${marker}`).not.toContain(marker);
      }
      expect(markup, "the card carries a frozen hex").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it("declares no focus utility, which would be permanently inert here", () => {
    expect(paintOf(card())).not.toContain("focus-visible:outline");
    expect(paintOf(card())).not.toContain("focus-ring");
  });
});

describe("all three answers are real, and all three are reachable", () => {
  it("draws the third answer, which the shipped write path does not have a verb for", () => {
    render(card());
    expect(screen.getByRole("button", { name: /Let it guide the workspace/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not yet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Never" })).toBeTruthy();
  });

  it("makes every answer a real button, so a keyboard reaches all three", () => {
    render(card());
    for (const name of [/Let it guide the workspace/, /^Not yet$/, /^Never$/]) {
      const control = screen.getByRole("button", { name });
      expect(control.tagName, `${name} is not a button`).toBe("BUTTON");
      expect(control.getAttribute("type"), `${name} would submit a form`).toBe("button");
      expect(control.getAttribute("tabindex"), `${name} was taken out of the tab order`).not.toBe(
        "-1",
      );
    }
  });

  it("hands each answer back exactly once, as its own value", () => {
    for (const [name, expected] of [
      [/Let it guide the workspace/, "approve"],
      [/^Not yet$/, "not-yet"],
      [/^Never$/, "never"],
    ] as [RegExp, PromotionOutcome][]) {
      const seen: PromotionOutcome[] = [];
      const view = render(card({ onDecide: (o) => seen.push(o) }));
      fireEvent.click(screen.getByRole("button", { name }));
      expect(seen, `${name} handed back the wrong answer`).toEqual([expected]);
      view.unmount();
    }
  });

  it("spends orchid on approve and on nothing else", () => {
    /*
     * `Approve` is the only control in the product wearing `--mrd-you`, because
     * it is the one that RELEASES something held. "Not yet" and "Never" both
     * close the question rather than unblocking it, so a house favourite among
     * the three would be the product making the call it is asking you to make.
     */
    const markup = paintOf(card());
    /* `(?!-)` because the status chip's own fill is `bg-mrd-you-chip`, which is a
       different token for a different job: the chip reports that a person is
       required and the control is the thing they press. Counting the prefix
       loosely would let a second orchid control through unnoticed. */
    expect((markup.match(/bg-mrd-you(?!-)/g) ?? []).length, "orchid is spent more than once").toBe(
      1,
    );
  });

  it("keeps Never at a distance and never gives it a status hue", () => {
    const { container } = render(card());
    // `--mrd-stop` is a CONTROL colour and collapses against `--mrd-fail` in
    // greyscale, so it may only ever paint something a person can press.
    const never = screen.getByRole("button", { name: "Never" });
    expect(never.className, "Never lost the stop face").toContain("text-mrd-stop");
    expect(never.className, "Never was painted as an outcome that had happened").not.toContain(
      "text-mrd-fail",
    );
    // Separated by DISTANCE rather than by volume: `Actions` pushes its trailing
    // slot to the far edge, which is what protects a destructive act here.
    expect(
      never.parentElement?.className,
      "Never sits beside the other two rather than away from them",
    ).toContain("ml-auto");
    expect(container.querySelectorAll("button").length).toBeGreaterThan(2);
  });
});

describe("a measurement is never offered for promotion", () => {
  it("draws no answer at all on a row that may not travel", () => {
    render(measurement());
    expect(
      screen.queryByRole("button", { name: /Let it guide/ }),
      "a measurement was offered for promotion, which is the confidentiality failure",
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Not yet" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Never" })).toBeNull();
  });

  it("says why, in the sentence written for this prompt", () => {
    render(measurement());
    expect(screen.getByText(/measurement taken on one product/)).toBeTruthy();
  });

  it("refuses it on the origin too, not only on the label", () => {
    // A row labelled loosely and derived from a settled result is still a
    // measurement, and `resolveMemoryScope` settles that before anything else.
    render(card({ kind: "note", origin: { outcomeDerived: true } }));
    expect(screen.queryByRole("button", { name: /Let it guide/ })).toBeNull();
  });

  it("does not describe a consequence nobody can cause", () => {
    const text = textOf(measurement());
    expect(
      text,
      "the not-promotable card described what approving would change, which nothing can",
    ).not.toContain("What approving would change");
  });

  it("does not claim it was put forward, because it was not", () => {
    /*
     * A sentence that outruns its own wiring, in the place it is least likely to
     * be read twice. The origin line said "put forward for the whole workspace"
     * on every card in the first draft, including the ones where nothing is.
     */
    expect(
      textOf(measurement()),
      "a row that may not travel said it had been put forward",
    ).not.toContain("put forward");
    expect(textOf(measurement())).toContain("Learned in Fieldwork.");
  });

  it("stops saying it is put forward once it has been settled", () => {
    const view = render(card());
    fireEvent.click(screen.getByRole("button", { name: /^Not yet$/ }));
    expect(
      view.container.textContent,
      "a settled card still described itself as waiting to be put forward",
    ).not.toContain("put forward for the whole workspace");
  });

  it("still opens on a lesson somebody declared travels", () => {
    render(card({ kind: "note", origin: { declaredScope: "workspace" } }));
    expect(screen.getByRole("button", { name: /Let it guide the workspace/ })).toBeTruthy();
  });
});

describe("the status word, before and after", () => {
  it("is orchid at rest and never green, because nothing has graduated yet", () => {
    render(card());
    expect(screen.getByText("Waiting on you")).toBeTruthy();
    expect(
      paintOf(card()),
      "a proposed promotion was painted as an outcome that had happened",
    ).not.toContain("bg-mrd-pass-chip");
  });

  it("hands over to green once it actually graduated", () => {
    const view = render(card());
    fireEvent.click(screen.getByRole("button", { name: /Let it guide the workspace/ }));
    expect(screen.getByText("Graduated")).toBeTruthy();
    expect(view.container.innerHTML).toContain("bg-mrd-pass-chip");
  });

  it("uses red for the answer that closed it and amber for the one that did not", () => {
    const ruled = render(card());
    fireEvent.click(screen.getByRole("button", { name: "Never" }));
    expect(screen.getByText("Ruled out")).toBeTruthy();
    expect(ruled.container.innerHTML).toContain("bg-mrd-fail-chip");
    ruled.unmount();

    const kept = render(card());
    fireEvent.click(screen.getByRole("button", { name: "Not yet" }));
    expect(screen.getByText("Kept with its product")).toBeTruthy();
    expect(kept.container.innerHTML, "not yet was reported as a failure").toContain(
      "bg-mrd-hold-chip",
    );
    expect(kept.container.innerHTML).not.toContain("bg-mrd-fail-chip");
  });

  it("wears amber and not orchid where nothing this reader presses would move it", () => {
    const markup = paintOf(measurement());
    expect(markup).toContain("bg-mrd-hold-chip");
    expect(markup, "a row nobody can release promised a control that releases it").not.toContain(
      "bg-mrd-you-chip",
    );
  });

  it("survives a greyscale test, because every mood puts its word in the chip", () => {
    // Colour removed, the card still says which of the five things it is.
    expect(textOf(card())).toContain("Waiting on you");
    expect(textOf(measurement())).toContain("Stays with its product");
    for (const [name, word] of [
      [/Let it guide the workspace/, "Graduated"],
      [/^Not yet$/, "Kept with its product"],
      [/^Never$/, "Ruled out"],
    ] as [RegExp, string][]) {
      const view = render(card());
      fireEvent.click(screen.getByRole("button", { name }));
      expect(view.container.textContent, `${word} is carried by hue alone`).toContain(word);
      view.unmount();
    }
  });
});

describe("what the card has to name", () => {
  it("names the product the lesson came from", () => {
    render(card());
    expect(screen.getByText("Fieldwork")).toBeTruthy();
    expect(screen.getByText(/put forward for the whole workspace/)).toBeTruthy();
  });

  it("says so plainly where no product was recorded, rather than inventing one", () => {
    /*
     * This is every real row today: neither `agent_memory` nor `learnings`
     * carries a `product_id` column, so the honest state is the normal one.
     */
    render(card({ learnedIn: null }));
    expect(screen.getByText(/Nothing on this lesson says which product/)).toBeTruthy();
  });

  it("names what approving would change, with its consumers", () => {
    render(card());
    expect(screen.getByText("What approving would change")).toBeTruthy();
    expect(screen.getByText("Decide reads it before it ranks the next bet.")).toBeTruthy();
  });

  it("admits it out loud when nothing would read the lesson", () => {
    // A promotion whose consumer cannot be named has no reader, and a lesson
    // with no reader has not graduated, it has been filed.
    render(card({ guides: [] }));
    expect(screen.getByText(/change nothing about what happens/)).toBeTruthy();
  });

  it("prints what settled it, and opens the ones that have an address", () => {
    let opened = 0;
    render(
      card({
        evidence: [{ key: "e1", label: "The retry window was the cause", onOpen: () => opened++ }],
      }),
    );
    expect(screen.getByText("What settled it")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "The retry window was the cause" }));
    expect(opened).toBe(1);
  });
});

describe("the three things a read of the evidence can be, kept apart", () => {
  it("tells an empty list from a failed read", () => {
    const empty = textOf(card({ evidence: [] }));
    expect(empty).toContain("Nothing is attached to this one");
    expect(empty, "an empty list claimed the read had fallen over").not.toContain(
      "could not be read",
    );

    const failed = textOf(card({ evidence: [], evidenceFailed: true }));
    expect(failed).toContain("could not be read");
    expect(failed, "a failed read was drawn as an empty one").not.toContain(
      "Nothing is attached to this one",
    );
  });

  it("carries the way out of a failed read, and still lets the decision be made", () => {
    let retried = 0;
    render(card({ evidence: [], evidenceFailed: true, onEvidenceRetry: () => retried++ }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retried).toBe(1);
    expect(
      screen.getByRole("button", { name: /Let it guide the workspace/ }),
      "a failed evidence read hid the decision, which is a different fact",
    ).toBeTruthy();
  });

  it("draws no candidates as a composed state rather than as a blank region", () => {
    render(<NoPromotions />);
    expect(screen.getByText(/Nothing is waiting to graduate/)).toBeTruthy();
    expect(screen.getByText(/holds beyond the product it was learned in/)).toBeTruthy();
  });
});

describe("what the judgment leaves behind", () => {
  it("stops asking and says what the answer caused", () => {
    render(card());
    fireEvent.click(screen.getByRole("button", { name: /Let it guide the workspace/ }));
    expect(
      screen.queryByRole("button", { name: /Let it guide the workspace/ }),
      "the card kept asking a question it had already been answered",
    ).toBeNull();
    expect(screen.getByText("You let it guide the workspace.")).toBeTruthy();
    expect(screen.getByText("What reads it next")).toBeTruthy();
  });

  it("names the product back on a not-yet, so the answer is about something", () => {
    render(card());
    fireEvent.click(screen.getByRole("button", { name: "Not yet" }));
    expect(screen.getByText("You kept it with Fieldwork.")).toBeTruthy();
    expect(screen.getByText(/nothing changed anywhere else/)).toBeTruthy();
  });

  it("says a never is permanent, which is the whole reason it is a third answer", () => {
    render(card());
    fireEvent.click(screen.getByRole("button", { name: "Never" }));
    expect(screen.getByText(/will not be put forward again/)).toBeTruthy();
  });

  it("announces itself, because a settled decision in silence is the defect", () => {
    render(card());
    fireEvent.click(screen.getByRole("button", { name: "Not yet" }));
    const settled = screen.getByRole("status");
    expect(settled.getAttribute("aria-live"), "the settled state interrupts or says nothing").toBe(
      "polite",
    );
  });

  it("holds its own settled state, with no second way to set it", () => {
    /* A `settled` prop and this card's own state could disagree, so there is no
       prop. What is checkable from here is that the card settles WITHOUT being
       told to and without re-rendering from a caller, which is what a re-render
       from the parent would otherwise be hiding. */
    const view = render(card());
    fireEvent.click(screen.getByRole("button", { name: "Not yet" }));
    expect(screen.getByText(/You kept it with Fieldwork/)).toBeTruthy();
    view.rerender(card());
    expect(
      screen.getByText(/You kept it with Fieldwork/),
      "the settled state was thrown away by a re-render, so a caller would have to hold it",
    ).toBeTruthy();
  });
});

describe("the vocabulary a person reads", () => {
  const EVERY_STATE = (): string[] => {
    const texts = [
      textOf(card()),
      textOf(card({ learnedIn: null, guides: [] })),
      textOf(card({ evidence: [] })),
      textOf(card({ evidence: [], evidenceFailed: true })),
      textOf(measurement()),
      textOf(<NoPromotions />),
    ];
    for (const name of [/Let it guide the workspace/, /^Not yet$/, /^Never$/]) {
      const view = render(card());
      fireEvent.click(screen.getByRole("button", { name }));
      texts.push(view.container.textContent ?? "");
      view.unmount();
    }
    return texts;
  };

  it("uses none of the words we invented for ourselves", () => {
    for (const text of EVERY_STATE()) {
      for (const ours of [
        "receipt",
        "ledger",
        "provenance",
        "unattended",
        "first run",
        "decision layer",
        "agentic",
        "agent-first",
        "searchable",
      ]) {
        expect(text.toLowerCase(), `a string says "${ours}"`).not.toContain(ours);
      }
    }
  });

  it("never says the record is stored somewhere, which is the claim this product refuses", () => {
    for (const text of EVERY_STATE()) {
      for (const storage of ["stores", "stored", "where the record lives", "remembers", "memory"]) {
        expect(text.toLowerCase(), `a string says "${storage}"`).not.toContain(storage);
      }
    }
  });

  it("never claims accumulated learning in the present tense", () => {
    for (const text of EVERY_STATE()) {
      for (const claim of [
        "we learn",
        "learns from your",
        "gets smarter",
        "learned from your corrections",
        "improves over time",
      ]) {
        expect(text.toLowerCase(), `a string claims "${claim}"`).not.toContain(claim);
      }
    }
  });

  it("never uses the word context on a surface a person reads", () => {
    for (const text of EVERY_STATE()) {
      expect(
        text.toLowerCase(),
        "a string says context, which means the model window here",
      ).not.toContain("context");
    }
  });

  it("carries no dash a person can see, and no invisible character", () => {
    for (const text of EVERY_STATE()) {
      expect(text, "a string carries a dash a person can see").not.toMatch(/[\u2013\u2014]/);
      expect(text, "a string carries an invisible character").not.toMatch(
        /[\u200B\u200C\u200D\u2060\uFEFF\u00A0\u202F\u00AD\u200E\u200F\uFFFD]/,
      );
    }
  });

  it("never apologises, never cheers, and never hedges a decision", () => {
    for (const text of EVERY_STATE()) {
      for (const slop of ["Sorry", "sorry", "unfortunately", "Oops", "!", "Please try again"]) {
        expect(text, `a string says "${slop}"`).not.toContain(slop);
      }
    }
  });

  it("says approve only where something is actually held", () => {
    // The test the canon gives: keep `approve` where clicking it unblocks
    // something, and `review` where it means looking at something. The only
    // place either word appears is the block naming what the click releases.
    const resting = textOf(card());
    expect(resting).toContain("What approving would change");
    const settledText = (() => {
      const view = render(card());
      fireEvent.click(screen.getByRole("button", { name: /Let it guide the workspace/ }));
      const text = view.container.textContent ?? "";
      view.unmount();
      return text;
    })();
    expect(settledText.toLowerCase(), "the settled state still asks to approve").not.toContain(
      "approv",
    );
  });
});
