/**
 * THE ORDER IS THE COMPONENT, so the order is what this pins hardest.
 *
 * Every other property of this list is negotiable. What is not is that a session
 * waiting on a person comes before one that is running, because the whole item
 * exists against the instinct to render every agent working at once. A regression
 * that sorts by recency instead would look completely normal and would quietly
 * turn this back into the activity dashboard it replaced.
 *
 * WHAT IS NOT ASSERTED: that it looks right at sixty rows. The suite can prove no
 * row is wider than its container and that nothing is dropped; whether sixty rows
 * are readable is a browser and an eye.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { AgentInbox, IDLE_AFTER_MS, type AgentSession } from "../AgentInbox";

const NOW = 1_760_000_000_000;
const mins = (n: number) => NOW - n * 60_000;

function session(over: Partial<AgentSession> & { id: string }): AgentSession {
  return {
    title: "Shorten the verify step",
    need: "working",
    activity: "reading Intercom",
    at: mins(1),
    agentSlug: "researcher",
    ...over,
  };
}

/** The four groups as rendered, in document order. */
function groupOrder(): string[] {
  return [...document.querySelectorAll('[role="group"]')].map(
    (g) => g.getAttribute("aria-label") ?? "",
  );
}

/** Row titles in document order, which is what the keyboard walks. */
function rowTitles(): string[] {
  return [...document.querySelectorAll('[role="option"]')].map(
    (r) => r.querySelector(".truncate")?.textContent ?? "",
  );
}

describe("it is sorted by what it needs from a person", () => {
  it("puts the four groups in that order and no other", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "d", need: "done", activity: "opened the pull request", at: mins(30) }),
          session({ id: "w", need: "working" }),
          session({ id: "r", need: "ready", activity: "waiting for you to read the spec" }),
          session({ id: "n", need: "needs-input", activity: "waiting on you" }),
        ]}
      />,
    );

    expect(groupOrder()).toEqual([
      "Waiting on you",
      "Ready for you to look at",
      "Running",
      "Finished",
    ]);
  });

  it("hides an empty group entirely rather than drawing a heading with nothing under it", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[session({ id: "n", need: "needs-input", activity: "waiting on you" })]}
      />,
    );
    expect(groupOrder()).toEqual(["Waiting on you"]);
    expect(screen.queryByText("Running")).toBeNull();
    expect(screen.queryByText("Finished")).toBeNull();
  });

  it("does not sort by recency across groups, which is the failure this exists against", () => {
    /*
     * The `done` row is the most recent thing that happened and the `needs-input`
     * row is the oldest. A list sorted by recency puts the finished one first,
     * looks entirely normal, and answers "what is the machine doing" instead of
     * "what needs me".
     */
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "fresh", need: "done", title: "Post the release note", at: mins(0) }),
          session({
            id: "old",
            need: "needs-input",
            title: "Shorten the verify step",
            at: mins(90),
          }),
        ]}
      />,
    );
    expect(rowTitles()).toEqual(["Shorten the verify step", "Post the release note"]);
  });

  it("sorts newest first WITHIN a group", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "a", title: "Older", at: mins(5) }),
          session({ id: "b", title: "Newer", at: mins(1) }),
        ]}
      />,
    );
    expect(rowTitles()).toEqual(["Newer", "Older"]);
  });

  it("counts the group on its heading rather than badging every row", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "a", title: "One" }),
          session({ id: "b", title: "Two" }),
          session({ id: "c", title: "Three" }),
        ]}
      />,
    );
    const heading = screen.getByRole("group", { name: "Running" }).querySelector("h3")!;
    expect(heading.textContent).toContain("3");
  });
});

describe("the activity is a present participle, and the component cannot invent one", () => {
  it("prints the caller's participle beside the agent, in one format", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[session({ id: "a", agentSlug: "researcher", activity: "reading Intercom" })]}
      />,
    );
    /* `Research · reading Intercom`, and the same format on every row including
       the ones where half of it is missing. */
    expect(screen.getByText("Research · reading Intercom")).toBeTruthy();
  });

  it("drops the agent rather than the format when the slug is unknown", () => {
    render(<AgentInbox now={NOW} sessions={[session({ id: "a", agentSlug: null })]} />);
    expect(screen.getByText("reading Intercom")).toBeTruthy();
  });
});

describe("idle rows collapse past three, and the number is real", () => {
  const idleAt = NOW - IDLE_AFTER_MS - 1;

  it("leaves three idle rows alone", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[1, 2, 3].map((n) => session({ id: `i${n}`, title: `Quiet ${n}`, at: idleAt }))}
      />,
    );
    expect(rowTitles().length).toBe(3);
    expect(screen.queryByText(/gone quiet/)).toBeNull();
  });

  it("collapses the fourth into one row that says how many", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[1, 2, 3, 4].map((n) =>
          session({ id: `i${n}`, title: `Quiet ${n}`, at: idleAt }),
        )}
      />,
    );
    expect(rowTitles().length, "idle rows were still drawn individually").toBe(0);
    expect(screen.getByRole("button", { name: "4 agents have gone quiet" })).toBeTruthy();
  });

  it("does not drop them, and opens on the summary", () => {
    /*
     * Silent truncation is the defect this repo has recorded twice. The count is
     * printed and the rows are one click away.
     */
    render(
      <AgentInbox
        now={NOW}
        sessions={[1, 2, 3, 4].map((n) =>
          session({ id: `i${n}`, title: `Quiet ${n}`, at: idleAt }),
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "4 agents have gone quiet" }));
    expect(rowTitles().length).toBe(4);
    expect(screen.getByRole("button", { name: "Hide the quiet ones" })).toBeTruthy();
  });

  it("keeps the live rows visible while the quiet ones are folded away", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          ...[1, 2, 3, 4].map((n) => session({ id: `i${n}`, title: `Quiet ${n}`, at: idleAt })),
          session({ id: "live", title: "Still going", at: mins(1) }),
        ]}
      />,
    );
    expect(rowTitles()).toEqual(["Still going"]);
    expect(
      screen.getByRole("group", { name: "Running" }).querySelector("h3")!.textContent,
    ).toContain("5");
  });

  it("never folds a row that is waiting on a person, however long it has waited", () => {
    /*
     * THE ONE WAY THIS MECHANIC COULD DO REAL HARM. Four gates untouched for a day
     * are the four most important rows on the surface, and a rule that hides
     * anything quiet would hide exactly them.
     */
    const old = NOW - 26 * 60 * 60 * 1000;
    render(
      <AgentInbox
        now={NOW}
        sessions={[1, 2, 3, 4].map((n) =>
          session({ id: `g${n}`, title: `Gate ${n}`, need: "needs-input", at: old }),
        )}
      />,
    );
    expect(rowTitles().length, "a gate was folded away for being quiet").toBe(4);
    expect(screen.queryByText(/gone quiet/)).toBeNull();
  });
});

describe("answering happens here, without a route change", () => {
  it("draws no reply control when the caller cannot take one", () => {
    render(<AgentInbox now={NOW} sessions={[session({ id: "a", need: "needs-input" })]} />);
    expect(screen.queryByRole("button", { name: "Answer it" })).toBeNull();
  });

  it("takes a reply in place and hands it back", () => {
    const replies: string[] = [];
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({
            id: "a",
            need: "needs-input",
            activity: "waiting on you",
            asking: "Which verify step should stay?",
            onReply: (t) => replies.push(t),
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Answer it" }));
    fireEvent.change(screen.getByLabelText("Answer Research"), {
      target: { value: "  The shorter one  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send it" }));

    expect(replies).toEqual(["The shorter one"]);
  });

  it("does not open the session while the reply is being opened", () => {
    /*
     * The row is itself a control, and the reply button is inside it. Without
     * `stopPropagation` one click both opens the reply and navigates away, which
     * is the exact failure the acceptance calls out.
     */
    let opened = 0;
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "a", need: "needs-input", onOpen: () => opened++, onReply: () => {} }),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Answer it" }));
    expect(opened, "answering navigated away from the inbox").toBe(0);
  });

  it("closes the reply without sending on cancel", () => {
    const replies: string[] = [];
    render(
      <AgentInbox
        now={NOW}
        sessions={[session({ id: "a", need: "needs-input", onReply: (t) => replies.push(t) })]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Answer it" }));
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(replies).toEqual([]);
    expect(screen.getByRole("button", { name: "Answer it" })).toBeTruthy();
  });
});

describe("one tab stop, and the keyboard walks the visible order", () => {
  const three = [
    session({ id: "n", need: "needs-input", title: "Gate", at: mins(9) }),
    session({ id: "w", need: "working", title: "Running", at: mins(2) }),
    session({ id: "d", need: "done", title: "Finished", at: mins(1) }),
  ];

  it("gives the list one tab stop rather than one per row", () => {
    render(<AgentInbox now={NOW} sessions={three} />);
    const options = [...document.querySelectorAll('[role="option"]')];
    expect(options.length).toBe(3);
    expect(
      options.filter((o) => o.getAttribute("tabindex") === "0").length,
      "sixty sessions would be sixty tab stops",
    ).toBeLessThanOrEqual(1);
  });

  it("moves down the groups with j and the arrows", () => {
    const { container } = render(<AgentInbox now={NOW} sessions={three} />);
    const root = container.firstElementChild!;

    fireEvent.keyDown(root, { key: "j" });
    expect(document.activeElement?.id).toBe("agent-inbox-row-n");

    fireEvent.keyDown(root, { key: "ArrowDown" });
    expect(document.activeElement?.id).toBe("agent-inbox-row-w");

    fireEvent.keyDown(root, { key: "k" });
    expect(document.activeElement?.id).toBe("agent-inbox-row-n");
  });

  it("wraps rather than stopping, so k from the top reaches the bottom", () => {
    const { container } = render(<AgentInbox now={NOW} sessions={three} />);
    const root = container.firstElementChild!;
    fireEvent.keyDown(root, { key: "j" });
    fireEvent.keyDown(root, { key: "k" });
    expect(document.activeElement?.id).toBe("agent-inbox-row-d");
  });

  it("does not swallow j and k while a reply is being typed", () => {
    /*
     * ASSERTED ON WHETHER THE EVENT WAS CANCELLED, not on where focus ended up,
     * and the difference is the whole point of the test.
     *
     * `fireEvent` returns false when a handler called `preventDefault`. That is
     * exactly what the keydown guard buys: without it, `j` is swallowed and the
     * letter never reaches the field, so somebody typing "just the shorter one"
     * types "ust the shorter one". Reading `document.activeElement` instead tested
     * the OTHER guard, the one inside `move`, and passed whether or not this one
     * existed.
     */
    render(
      <AgentInbox
        now={NOW}
        sessions={[session({ id: "a", need: "needs-input", onReply: () => {} })]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Answer it" }));
    const field = screen.getByLabelText("Answer Research") as HTMLInputElement;
    field.focus();

    const notCancelled = fireEvent.keyDown(field, { key: "j" });

    expect(notCancelled, "the accelerator swallowed a letter being typed").toBe(true);
    expect(document.activeElement, "typing a j moved the selection").toBe(field);
  });
});

describe("the states nobody drew", () => {
  it("says nothing needs you rather than drawing four empty headings", () => {
    const { container } = render(<AgentInbox now={NOW} sessions={[]} />);
    expect(screen.getByText("Nothing needs you.")).toBeTruthy();
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(
      container.querySelector("[data-mrd]"),
      "the early return lost data-mrd, so its controls lose the focus ring",
    ).toBeTruthy();
  });

  it("renders 3, 12 and 60 sessions and keeps every row inside the container", () => {
    for (const n of [3, 12, 60]) {
      const { container, unmount } = render(
        <AgentInbox
          now={NOW}
          sessions={Array.from({ length: n }, (_, i) =>
            session({
              id: `s${i}`,
              title: `A piece of work with a deliberately long name, number ${i}`,
              need: (["needs-input", "ready", "working", "done"] as const)[i % 4],
              at: mins(i),
            }),
          )}
        />,
      );
      /* Nothing may be wider than the row: the title truncates rather than
         pushing the page sideways, which is what `min-w-0 truncate` buys. */
      for (const title of container.querySelectorAll('[role="option"] .truncate')) {
        expect(title.className).toContain("min-w-0");
      }
      expect(container.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
      unmount();
    }
  });

  it("puts everything in one group when it is all blocked on one person", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[1, 2, 3].map((n) =>
          session({ id: `g${n}`, need: "needs-input", title: `Gate ${n}` }),
        )}
      />,
    );
    expect(groupOrder()).toEqual(["Waiting on you"]);
  });
});

describe("colour confirms the group, and the structure carries it", () => {
  it("chips only the group that requires a person", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "n", need: "needs-input" }),
          session({ id: "r", need: "ready" }),
          session({ id: "w", need: "working" }),
          session({ id: "d", need: "done" }),
        ]}
      />,
    );
    /* One chip across four rows. A chip on all four makes the one that matters
       invisible, and the heading already says what each group needs. */
    expect(screen.getAllByText("Needs you").length).toBe(1);
  });

  it("carries the group in the mark's state as well as in the heading", () => {
    /*
     * K-08 made `MarkState` per mark, and this is the surface that change was for:
     * four rows in four states on one screen.
     */
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "n", need: "needs-input" }),
          session({ id: "w", need: "working" }),
          session({ id: "d", need: "done" }),
        ]}
      />,
    );
    const marks = [...document.querySelectorAll('[role="img"]')].map((m) =>
      m.getAttribute("aria-label"),
    );
    expect(marks.some((m) => m?.endsWith("gate"))).toBe(true);
    expect(marks.some((m) => m?.endsWith("running"))).toBe(true);
    expect(marks.some((m) => m?.endsWith("verified"))).toBe(true);
  });

  it("survives greyscale, because the group heading is the answer", () => {
    /*
     * The structural half of the greyscale rule, which is the half a test can
     * see: remove every hue and the four headings still say what each row needs.
     * The hue only confirms it.
     */
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "n", need: "needs-input" }),
          session({ id: "w", need: "working" }),
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "Waiting on you" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Running" })).toBeTruthy();
  });
});

describe("failing is an outcome, not a fifth group", () => {
  it("keeps a failed session in whichever group it needs, and says it failed", () => {
    /*
     * There is no fifth group and there must not be. Grouping is by what a session
     * needs from a person; failing is an outcome. A failed run still has to say
     * which of the four it wants.
     */
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({
            id: "f",
            need: "ready",
            failed: true,
            title: "Open the pull request",
            activity: "stopped after the checks came back red twice",
          }),
        ]}
      />,
    );
    expect(groupOrder()).toEqual(["Ready for you to look at"]);
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("lets a session be failed AND waiting on a person at once", () => {
    /* The case a fifth group would have made unrenderable. */
    render(
      <AgentInbox now={NOW} sessions={[session({ id: "f", need: "needs-input", failed: true })]} />,
    );
    expect(groupOrder()).toEqual(["Waiting on you"]);
    /* The outcome outranks the need on the chip: "Failed" reads first, and the
       heading is already saying it is waiting on you. */
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.queryByText("Needs you")).toBeNull();
  });

  it("marks it failed rather than running", () => {
    render(<AgentInbox now={NOW} sessions={[session({ id: "f", failed: true })]} />);
    const mark = document.querySelector('[role="img"]')!;
    expect(mark.getAttribute("aria-label")).toContain("failed");
  });

  it("never folds a failed row away for being quiet", () => {
    /*
     * A failed run goes quiet BY DEFINITION: nothing is going to happen next. It is
     * also the row most worth reading, so the idle rule must not reach it.
     */
    const idleAt = NOW - IDLE_AFTER_MS - 1;
    render(
      <AgentInbox
        now={NOW}
        sessions={[1, 2, 3, 4].map((n) =>
          session({ id: `f${n}`, title: `Broke ${n}`, failed: true, at: idleAt }),
        )}
      />,
    );
    expect(rowTitles().length, "a failed run was hidden for being quiet").toBe(4);
    expect(screen.queryByText(/gone quiet/)).toBeNull();
  });
});

describe("the selection has exactly one writer", () => {
  it("does not set the selection from focus, which is how it used to loop", () => {
    /*
     * IT HAD AN `onFocus` HANDLER AND THAT WAS A LATENT INFINITE LOOP: focus set
     * the selection, and `move()` set the selection and then moved focus. Planting
     * the accelerator's text-control guard turned it from latent into real, and it
     * did not fail, it HUNG until the runner was killed. A test that hangs is worse
     * than a test that fails, so the binding is gone rather than worked around.
     *
     * Asserted against the source, because the absence of a handler is the fix and
     * there is no render in which its presence is visible.
     */
    const src = readFileSync(new URL("../AgentInbox.tsx", import.meta.url), "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code, "the two-way focus binding came back").not.toContain("onFocus");
    /* And `move` is still the writer, so the keyboard has not been disconnected. */
    expect(code).toContain("setSelected(id)");
  });

  it("still moves the selection from the keyboard after that change", () => {
    const { container } = render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "a", title: "First", at: mins(1) }),
          session({ id: "b", title: "Second", at: mins(2) }),
        ]}
      />,
    );
    fireEvent.keyDown(container.firstElementChild!, { key: "j" });
    expect(document.activeElement?.id).toBe("agent-inbox-row-a");
    expect(document.querySelector('[aria-selected="true"]')?.id).toBe("agent-inbox-row-a");
  });
});

/**
 * THE WAY IN, WHICH A GREEN SUITE MISSED ENTIRELY.
 *
 * Verified against the running app 2026-08-20 and rejected: `Row` carried
 * `tabIndex={selected ? 0 : -1}`, which is a roving tabindex with NO INITIAL
 * STOP. With nothing selected, the state every gallery instance renders in, every
 * row was `-1`, the wrapper holding the keydown handler has no `tabIndex`, and
 * the listbox computed `-1` too. **25 consecutive Tab presses never landed inside
 * the inbox.** The only way in was a mouse, and a click deliberately focuses
 * without selecting, so `j` and `k` stayed unreachable until a click and then a
 * key.
 *
 * Why the existing tests could not see it: every one of them either selects
 * something first or fires the key on the wrapper directly, so they exercise the
 * list from a state a keyboard user cannot reach. **The count of tabbable rows in
 * the resting state is the assertion, and nothing was making it.**
 */
describe("AgentInbox — the list has exactly one way in", () => {
  const two = [
    session({ id: "a", title: "First", at: mins(1) }),
    session({ id: "b", title: "Second", at: mins(2) }),
  ];

  it("holds one tabbable row before anything is selected, so Tab can arrive", () => {
    const { container } = render(<AgentInbox now={NOW} sessions={two} />);
    const stops = container.querySelectorAll('[role="option"][tabindex="0"]');
    expect(
      stops.length,
      "a roving tabindex with no resident 0 is unreachable: Tab skips the whole list and the shortcuts never become available",
    ).toBe(1);
  });

  it("puts that stop on the first row in reading order, not on an arbitrary one", () => {
    /*
     * Newest first inside a group, and `mins(n)` counts BACKWARDS from now, so
     * "First" at one minute ago is the newer of the two and leads. The entry point
     * has to be whatever the keyboard would move from, or the first `j` jumps
     * somewhere the eye was not: `move()` reads `order.indexOf(selected)`, so the
     * resident stop and `order[0]` have to be the same row.
     */
    const { container } = render(<AgentInbox now={NOW} sessions={two} />);
    expect(container.querySelector('[role="option"][tabindex="0"]')?.id).toBe("agent-inbox-row-a");
  });

  it("still holds exactly one once a selection exists, which is the whole contract", () => {
    const { container } = render(<AgentInbox now={NOW} sessions={two} />);
    fireEvent.keyDown(container.firstElementChild!, { key: "j" });
    const stops = container.querySelectorAll('[role="option"][tabindex="0"]');
    expect(stops.length, "two resident tab stops, so Tab lands inside the list twice").toBe(1);
    // And it moved WITH the selection rather than staying on the entry row.
    expect(stops[0]!.id).toBe("agent-inbox-row-a");
  });

  it("holds one at sixty rows, which is where sixty stops would be the defect", () => {
    /*
     * Every `at` is inside `IDLE_AFTER_MS`, which is ten minutes, so none of these
     * folds into the collapsed idle line and all sixty really render. Written the
     * obvious way first, with `mins(i + 1)`, this rendered NINE options rather than
     * sixty: fifty-one of them were over ten minutes old and `working`, so the
     * collapse swallowed them. That is the component behaving correctly and the
     * fixture asking the wrong question, and it is worth the comment because the
     * same trap is one line away from anyone extending this file.
     */
    const many = Array.from({ length: 60 }, (_, i) =>
      session({ id: `c${i}`, title: `Row ${i}`, at: mins(i % 9) }),
    );
    const { container } = render(<AgentInbox now={NOW} sessions={many} />);
    expect(container.querySelectorAll('[role="option"]').length).toBe(60);
    expect(container.querySelectorAll('[role="option"][tabindex="0"]').length).toBe(1);
  });
});

/**
 * REPLY IN PLACE IS DRAWN ONLY WHERE THERE IS SOMETHING TO ANSWER.
 *
 * The acceptance line is that reply in place works without a route change, and it
 * could not be exercised in the running app at all: `Row` draws the control only
 * where `session.onReply` is defined, and `onReply` appeared **zero times** in the
 * gallery, so `buttons inside rows: 0` across every instance. The unit tests
 * passed because four of them wire it themselves.
 *
 * The gallery now wires it, and this is the guard on the shape of that wiring: a
 * reply field on a finished run is a control with nothing to answer, so the
 * absence is asserted as well as the presence.
 */
describe("AgentInbox — the reply control follows the question", () => {
  it("draws no control on a row nobody passed a reply handler for", () => {
    const { container } = render(
      <AgentInbox now={NOW} sessions={[session({ id: "a", title: "First", at: mins(1) })]} />,
    );
    expect(
      container.querySelectorAll("button").length,
      "a reply control appeared with no handler behind it, which is an affordance that is a promise",
    ).toBe(0);
  });

  it("draws it, opens it and hands the text back where a handler exists", () => {
    const said: string[] = [];
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          {
            ...session({ id: "a", title: "First", at: mins(1) }),
            need: "needs-input",
            asking: "Keep the email confirmation, or drop it?",
            onReply: (text: string) => said.push(text),
          },
        ]}
      />,
    );
    // "Answer it" opens it and "Send it" commits, which is `ReasonField`'s own
    // vocabulary rather than the generic word for the mechanic.
    fireEvent.click(screen.getByRole("button", { name: "Answer it" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Drop it." } });
    fireEvent.click(screen.getByRole("button", { name: "Send it" }));
    expect(said, "the reply never reached the caller, so reply in place is decorative").toEqual([
      "Drop it.",
    ]);
  });
});

/**
 * THE SCAN-BAND CUT, WHICH IS THE IDLE COLLAPSE ONE LEVEL UP.
 *
 * `maxPerGroup` exists for Today, which replaced three lanes with this list and
 * whose lanes drew three rows each. The defect measured on that surface on
 * 2026-08-11 was NOT the three: it was that the heading counted four and the body
 * drew three, with nothing on screen reconciling them. So what is pinned here is
 * the reconciliation, not the number — the heading counts everything the group
 * holds, the control says how many are behind it, and pressing it opens them
 * where they stand rather than sending anyone to another page.
 */
describe("a group past the cut says how many it is holding, and opens them in place", () => {
  const four: AgentSession[] = [
    session({ id: "1", need: "done", activity: "shipped", at: mins(1) }),
    session({ id: "2", need: "done", activity: "shipped", at: mins(2) }),
    session({ id: "3", need: "done", activity: "shipped", at: mins(3) }),
    session({ id: "4", need: "done", activity: "shipped", at: mins(4) }),
  ];

  it("draws every row when no cut is asked for", () => {
    render(<AgentInbox now={NOW} sessions={four} />);
    expect(document.querySelectorAll('[role="option"]').length).toBe(4);
    expect(screen.queryByText(/more/)).toBeNull();
  });

  it("counts the hidden rows on the heading, so the number never disagrees with the body", () => {
    render(<AgentInbox now={NOW} sessions={four} maxPerGroup={3} />);
    expect(document.querySelectorAll('[role="option"]').length).toBe(3);
    const heading = [...document.querySelectorAll("h3")].find((h) =>
      h.textContent?.startsWith("Finished"),
    );
    expect(
      heading?.textContent,
      "the heading counted only what was drawn, which is the exact defect this replaced",
    ).toContain("4");
  });

  it("opens them where they stand rather than dropping them", () => {
    render(<AgentInbox now={NOW} sessions={four} maxPerGroup={3} />);
    const control = screen.getByRole("button", { name: "1 more" });
    fireEvent.click(control);
    expect(document.querySelectorAll('[role="option"]').length).toBe(4);
    // And it closes again, so the cut is a control rather than a one-way door.
    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(document.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it("keeps the newest rows standing and puts the oldest behind the control", () => {
    render(<AgentInbox now={NOW} sessions={four} maxPerGroup={2} />);
    // Newest first inside a group: 1 and 2 are the most recent of the four.
    expect(rowTitles().length).toBe(2);
    const ids = [...document.querySelectorAll('[role="option"]')].map((r) => r.id);
    expect(ids).toEqual(["agent-inbox-row-1", "agent-inbox-row-2"]);
  });

  it("a row behind a closed control is not somewhere the keyboard can land", () => {
    render(<AgentInbox now={NOW} sessions={four} maxPerGroup={3} />);
    const list = screen.getByRole("listbox");
    // Four presses of `j` on a three-row list wraps back to the first row. If the
    // hidden row were in the order, the fourth press would select something that
    // is not on screen and focus would go nowhere.
    for (let i = 0; i < 4; i += 1) fireEvent.keyDown(list, { key: "j" });
    expect(document.activeElement?.id).toBe("agent-inbox-row-1");
  });
});

/**
 * THE SENTENCE UNDER A GROUP HEADING, WHICH BELONGS TO THE CALLER.
 *
 * Today's lanes each carried a line about what that group COSTS — a shipped run
 * costs a rollback to undo, a running one is waiting on an agent and not on you.
 * Those are claims about that surface's own population, so this file provides the
 * slot and never a default: a sentence written here would be one sentence shared
 * by every screen that ever mounts the inbox.
 */
describe("a group can carry the caller's own sentence, and never one of ours", () => {
  it("draws the note it was handed, under the heading it belongs to", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[session({ id: "d", need: "done", activity: "shipped", at: mins(1) })]}
        groupNote={{ done: "Live and waiting on nobody. Undoing one costs a rollback." }}
      />,
    );
    const group = document.querySelector('[role="group"][aria-label="Finished"]');
    expect(group?.textContent).toContain("Undoing one costs a rollback.");
  });

  it("draws nothing at all for a group with nothing to say", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({ id: "d", need: "done", activity: "shipped", at: mins(1) }),
          session({ id: "w", need: "working", at: mins(1) }),
        ]}
        groupNote={{ done: "Undoing one costs a rollback." }}
      />,
    );
    const running = document.querySelector('[role="group"][aria-label="Running"]');
    expect(running?.querySelector("p"), "an unasked-for note appeared on a group").toBeNull();
  });
});

/**
 * `activity` TAKES A NODE, and the reason is a fact that dies if it is flattened.
 *
 * Today hands this line `RunState`, whose HUE is load-bearing: orchid says a
 * person is required, azure says a machine is working, and `cancelled` and
 * `halted` are two different facts sharing one state. A `string` type would have
 * kept the sentence and dropped the distinction at the type boundary, quietly.
 */
describe("the activity line carries whatever the caller composed", () => {
  it("renders an element, not the word [object Object]", () => {
    render(
      <AgentInbox
        now={NOW}
        sessions={[
          session({
            id: "s",
            need: "ready",
            activity: <span data-testid="composed">cancelled 4h ago</span>,
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("composed").textContent).toBe("cancelled 4h ago");
    expect(document.body.textContent).not.toContain("[object Object]");
  });
});
