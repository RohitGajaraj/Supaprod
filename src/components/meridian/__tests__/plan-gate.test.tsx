/**
 * THE DECISION IS THE COMPONENT, so what leaves it is what this pins hardest.
 *
 * Three things can go wrong here and only one of them is visual. The gate can
 * hand back a plan that is not the one on screen, which makes every edit
 * decorative. It can commit an answer that needs a reason without one, which
 * turns the record back into a shrug. And it can write something, which is the
 * one thing it is not allowed to do at all, because what a decision MEANS is a
 * schema question and this is a component.
 *
 * WHAT IS NOT ASSERTED: that the answers look right. Three buttons carrying no
 * accent is a rule about paint, and the only honest check for it is a browser and
 * an eye. What is asserted is the structural half of that rule, which a test can
 * see: no `Approve` renders, and no status hue lands on a control.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { PlanGate, type PlanGateDecision } from "../PlanGate";
import type { PlanStep } from "../PlanCard";
import type { RunMapStation } from "../RunMap";

const STEPS: PlanStep[] = [
  {
    id: "s1",
    label: "Read the verify-step drop-off in Intercom and PostHog",
    state: "pending",
    agentSlug: "researcher",
    station: "discover",
  },
  {
    id: "s2",
    label: "Write the spec for the shorter verify step",
    state: "pending",
    agentSlug: "prd-writer",
    station: "plan",
  },
  {
    id: "s3",
    label: "Open the pull request",
    state: "pending",
    agentSlug: "builder",
    station: "build",
    touches: "supaprod/verify-step",
    reversible: "partial",
  },
];

const STOPS: RunMapStation[] = [
  { station: "sense", state: "pending" },
  { station: "define", state: "pending" },
  { station: "design", state: "pending" },
  { station: "build", state: "pending" },
];

const SPEND = {
  label: "This work item",
  spent: 0,
  cap: 5,
  note: "Past the ceiling the work stops and waits for you.",
};

function Gate({
  onDecide,
  steps = STEPS,
  stops = STOPS,
  busy = false,
}: {
  onDecide?: (d: PlanGateDecision) => void;
  steps?: PlanStep[];
  stops?: RunMapStation[];
  busy?: boolean;
}) {
  return (
    <PlanGate steps={steps} stops={stops} spend={SPEND} busy={busy} onDecide={onDecide ?? (() => {})} />
  );
}

/** The answers, by the number the reader sees rather than by index. */
function answer(n: 1 | 2 | 3): HTMLElement {
  return screen.getAllByRole("button", { name: /Start it|Keep planning/ })[n - 1]!;
}

describe("one decision, three answers", () => {
  it("draws exactly three, each numbered and each saying what it does", () => {
    render(<Gate />);

    const group = screen.getByRole("group", { name: "How much of this can run without you" });
    expect(group.querySelectorAll("button[data-answer]").length).toBe(3);

    /* The consequence, not just the label. An answer with no stated consequence
       is the 93%-approved prompt this component exists instead of. */
    expect(screen.getByText(/runs to the end inside the boundaries/)).toBeTruthy();
    expect(screen.getByText(/a pull request, an email, a ticket/)).toBeTruthy();
    expect(screen.getByText(/Nothing runs and nothing is charged/)).toBeTruthy();

    expect(group.textContent).toContain("1");
    expect(group.textContent).toContain("2");
    expect(group.textContent).toContain("3");
  });

  it("returns run-it with the plan and no reason", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.click(answer(1));

    expect(taken.length).toBe(1);
    expect(taken[0]!.autonomy).toBe("run-it");
    expect(taken[0]!.reason).toBeUndefined();
    expect(taken[0]!.editedPlan.steps.length).toBe(3);
    expect(taken[0]!.editedPlan.stops.length).toBe(4);
  });

  it("returns check-writes", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);
    fireEvent.click(answer(2));
    expect(taken[0]!.autonomy).toBe("check-writes");
  });

  it("takes an answer from the number key, wherever focus is in the gate", () => {
    const taken: PlanGateDecision[] = [];
    const { container } = render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.keyDown(container.firstElementChild!, { key: "2" });

    expect(taken.length, "the accelerator did not fire").toBe(1);
    expect(taken[0]!.autonomy).toBe("check-writes");
  });

  it("ignores a modified number key, so a browser shortcut still works", () => {
    const taken: PlanGateDecision[] = [];
    const { container } = render(<Gate onDecide={(d) => taken.push(d)} />);
    fireEvent.keyDown(container.firstElementChild!, { key: "1", metaKey: true });
    expect(taken.length).toBe(0);
  });
});

describe("the answer that needs a reason cannot be taken without one", () => {
  it("opens the ask instead of committing", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.click(answer(3));

    expect(taken.length, "keep-planning committed with no note").toBe(0);
    expect(screen.getByLabelText("What should change?")).toBeTruthy();
  });

  it("commits with the trimmed reason once there is one", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.click(answer(3));
    const field = screen.getByLabelText("What should change?");
    fireEvent.change(field, { target: { value: "  Ship behind a flag first  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send it back" }));

    expect(taken.length).toBe(1);
    expect(taken[0]!.autonomy).toBe("keep-planning");
    expect(taken[0]!.reason).toBe("Ship behind a flag first");
  });

  it("keeps the commit dead until the note is more than whitespace", () => {
    render(<Gate />);
    fireEvent.click(answer(3));

    const send = screen.getByRole("button", { name: "Send it back" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("What should change?"), { target: { value: "   " } });
    expect(send.disabled, "whitespace passed as a reason").toBe(true);
  });

  it("does not fire the accelerator while its own reason is open", () => {
    /*
     * Proven by the `asking` guard rather than by the text-control guard, and the
     * distinction matters because I first wrote only this test and it passed with
     * the text-control guard deleted. See the next test, which is the one that
     * actually exercises it.
     */
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);
    fireEvent.click(answer(3));

    const field = screen.getByLabelText("What should change?");
    fireEvent.keyDown(field, { key: "1" });

    expect(taken.length, "a keystroke inside the reason field took an answer").toBe(0);
  });

  it("does not fire the accelerator while a step's own reason is being typed", () => {
    /*
     * THE PATH THAT MAKES THE TEXT-CONTROL GUARD LOAD-BEARING, and it is not the
     * obvious one. The accelerators live on the card so a key works wherever
     * focus is, and `asking` covers this gate's own reason field. It does NOT
     * cover the reason fields inside `PlanCard` and `RunMap`, which open on their
     * own state: with the guard removed, typing "1 day of work" into a skip
     * reason takes the first answer and starts the run.
     *
     * Found by planting: deleting the guard left every test green, which means
     * the test above was proving the wrong thing.
     */
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Skip it" })[0]!);
    const field = screen.getByLabelText("Why skip this?");
    fireEvent.keyDown(field, { key: "1" });
    fireEvent.change(field, { target: { value: "1 day of work already done by hand" } });

    expect(taken.length, "typing a digit into a skip reason started the run").toBe(0);
  });

  it("goes back to the answers on cancel, taking no decision", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.click(answer(3));
    fireEvent.click(screen.getByRole("button", { name: "Back to the answers" }));

    expect(taken.length).toBe(0);
    expect(screen.getByRole("group", { name: /run without you/ })).toBeTruthy();
  });
});

describe("the plan is editable before the choice, and the edit is what leaves", () => {
  it("carries a skipped step and its reason into the decision", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    /* Three steps, so three Skip controls: the last one is the pull request. */
    const skips = screen.getAllByRole("button", { name: "Skip it" });
    expect(skips.length).toBe(3);
    fireEvent.click(skips[2]!);

    fireEvent.change(screen.getByLabelText("Why skip this?"), {
      target: { value: "The branch was already merged by hand" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Skip this step" }));

    fireEvent.click(answer(1));

    const step = taken[0]!.editedPlan.steps.find((s) => s.id === "s3")!;
    expect(step.state, "the edit was decorative").toBe("skipped");
    expect(step.why).toBe("The branch was already merged by hand");
    /* And nothing else moved. */
    expect(taken[0]!.editedPlan.steps.filter((s) => s.state === "skipped").length).toBe(1);
  });

  it("carries a station taken off the route into the decision", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate onDecide={(d) => taken.push(d)} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Take it off" })[2]!);
    fireEvent.change(screen.getByLabelText(/coming off the route/), {
      target: { value: "It reuses a shipped component, so there is nothing to draw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Take it off the route" }));

    fireEvent.click(answer(1));

    const off = taken[0]!.editedPlan.stops.filter((s) => s.state === "skipped");
    expect(off.length, "removing a station did not reach the decision").toBe(1);
    expect(off[0]!.waivedReason).toContain("nothing to draw");
  });

  it("demands a reason before a station comes off", () => {
    render(<Gate />);
    fireEvent.click(screen.getAllByRole("button", { name: "Take it off" })[0]!);
    const commit = screen.getByRole("button", {
      name: "Take it off the route",
    }) as HTMLButtonElement;
    expect(commit.disabled).toBe(true);
  });

  it("withdraws every edit control while a decision is in flight", () => {
    render(<Gate busy />);
    expect(screen.queryAllByRole("button", { name: "Skip it" }).length).toBe(0);
    expect(screen.queryAllByRole("button", { name: "Take it off" }).length).toBe(0);
    for (const b of screen.getByRole("group", { name: /run without you/ }).querySelectorAll("button")) {
      expect((b as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe("the ceiling is shown before the choice, never after", () => {
  it("puts the spend above the answers in the document", () => {
    render(<Gate />);
    const ceiling = screen.getByText("This work item");
    const answers = screen.getByRole("group", { name: /run without you/ });

    /* DOCUMENT_POSITION_FOLLOWING = 4: the answers come after the ceiling. */
    expect(
      ceiling.compareDocumentPosition(answers) & Node.DOCUMENT_POSITION_FOLLOWING,
      "the amount a person is agreeing to spend was reported after the decision",
    ).toBeGreaterThan(0);
  });

  it("shows the figures rather than a summary", () => {
    const { container } = render(<Gate />);
    /* Both amounts, as the numbers they are: the ceiling is the fact a person is
       agreeing to, and "within budget" would be the surface deciding for them. */
    const figures = container.querySelector("span.tabular-nums.font-mrd-mono")!;
    expect(figures.textContent).toContain("0.00");
    expect(figures.textContent).toContain("5.00");
    expect(screen.getByText("Past the ceiling the work stops and waits for you.")).toBeTruthy();
  });
});

describe("no accent, and no second gate", () => {
  it("renders no Approve control anywhere", () => {
    /*
     * All three answers release the gate, so either all three wear orchid or none
     * does. None does. And `PlanCard`'s own approve control is deliberately not
     * wired: two approve buttons on one screen is two decisions.
     */
    const { container } = render(<Gate />);
    /*
     * A CLASS SELECTOR, NOT A SUBSTRING SWEEP, and the first version of this line
     * was the trap: `innerHTML.includes("bg-mrd-you")` also matches
     * `bg-mrd-you-chip`, so it failed on the legitimately-orchid status chip two
     * lines above the answers. `.bg-mrd-you` matches the whole token only.
     */
    expect(container.querySelectorAll(".bg-mrd-you").length).toBe(0);
    expect(screen.queryByRole("button", { name: /Approve the plan/ })).toBeNull();
  });

  it("says a person is required with a chip rather than with a control", () => {
    render(<Gate />);
    const chip = screen.getByText("Needs you");
    expect(chip.className).toContain("mrd-you");
    expect(chip.tagName).not.toBe("BUTTON");
  });

  it("carries no status hue on any answer", () => {
    render(<Gate />);
    for (const b of screen.getByRole("group", { name: /run without you/ }).querySelectorAll("button")) {
      const cls = (b as HTMLElement).className;
      for (const hue of ["mrd-you", "mrd-agent", "mrd-pass", "mrd-fail", "mrd-hold"]) {
        expect(cls, `an answer was painted ${hue}`).not.toContain(hue);
      }
    }
  });
});

describe("the sizes nobody drew", () => {
  it("says there is nothing to decide on rather than gating an empty plan", () => {
    const { container } = render(<Gate steps={[]} />);
    expect(screen.getByText("There is no plan to decide on yet.")).toBeTruthy();
    expect(screen.queryByRole("group", { name: /run without you/ })).toBeNull();
    expect(
      container.querySelector("[data-mrd]"),
      "the early return lost data-mrd, so its controls lose the focus ring",
    ).toBeTruthy();
  });

  it("draws no route when there is none, and still takes a decision", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate stops={[]} onDecide={(d) => taken.push(d)} />);
    expect(screen.queryAllByRole("button", { name: "Take it off" }).length).toBe(0);
    fireEvent.click(answer(1));
    expect(taken[0]!.editedPlan.stops).toEqual([]);
  });

  it("gates a one-step plan the same way", () => {
    const taken: PlanGateDecision[] = [];
    render(<Gate steps={[STEPS[0]!]} stops={[]} onDecide={(d) => taken.push(d)} />);
    expect(screen.getAllByRole("button", { name: /Start it|Keep planning/ }).length).toBe(3);
    fireEvent.click(answer(1));
    expect(taken[0]!.editedPlan.steps.length).toBe(1);
  });
});

describe("it writes nothing", () => {
  it("reaches no network, no mutation and no server function", () => {
    /*
     * Asserted against the source, because the honest version of this check is
     * "there is no code path that could write", not "nothing wrote during this
     * test". Comments are stripped first, so the paragraph in the header
     * explaining that it writes nothing cannot satisfy the assertion by
     * containing the words.
     */
    const src = readFileSync(new URL("../PlanGate.tsx", import.meta.url), "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    for (const forbidden of [
      "fetch(",
      "useMutation",
      "useServerFn",
      "useQuery",
      "supabase",
      "localStorage",
      "sessionStorage",
    ]) {
      expect(code, `PlanGate reached for ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("holds the edits locally rather than syncing them back from props", () => {
    /*
     * A `useEffect` seeding state from props would discard an edit the moment the
     * caller re-rendered with the original plan, which is the failure that makes
     * a gate feel haunted. The caller remounts to replace a plan.
     */
    const src = readFileSync(new URL("../PlanGate.tsx", import.meta.url), "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toContain("useEffect");
  });
});

describe("one reason mechanic, not three", () => {
  it("is the third caller of ReasonField, and the other two now call it too", () => {
    /*
     * `RunMap`'s own comment deferred this extraction until a third caller
     * existed. This gate is it. The check is that the two originals no longer
     * carry their own copy of the mechanic, because a shared primitive standing
     * beside two survivors is the version of this fix that changes nothing.
     */
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const plan = strip(readFileSync(new URL("../PlanCard.tsx", import.meta.url), "utf8"));
    const map = strip(readFileSync(new URL("../RunMap.tsx", import.meta.url), "utf8"));
    const gate = strip(readFileSync(new URL("../PlanGate.tsx", import.meta.url), "utf8"));

    for (const [name, code] of [
      ["PlanCard", plan],
      ["RunMap", map],
      ["PlanGate", gate],
    ] as const) {
      expect(code, `${name} does not use the shared ReasonField`).toContain("ReasonField");
      /* The mechanic itself: nobody re-implements the Enter/Escape pair. */
      expect(code, `${name} kept its own copy of the reason mechanic`).not.toContain(
        'e.key === "Escape"',
      );
    }
  });
});
