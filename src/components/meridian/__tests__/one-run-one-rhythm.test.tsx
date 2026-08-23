/**
 * THREE VIEWS OF ONE RUN, AND THEY HAVE TO BE ONE SET.
 *
 * ── THE DEFECT THIS PINS, WHICH SHIPPED ─────────────────────────────────
 * `PlanCard`, `RunTimeline` and `ToolStream` were built in one afternoon and
 * arrived as three products. Measured at the time: three mark sizes (13, 13, 18),
 * three gutters (6, 8, 10px), three subject sizes (12.5, 12.5, 13), two of the
 * three with no time column at all, and a duration that sat in the label column
 * on one row type and in the clock column on the next.
 *
 * Every one of those passed `tsc`, passed its own tests, and cleared the ratchet.
 * That is the whole reason this file exists: the failure was not ugliness, it was
 * ARBITRARINESS, and arbitrariness is invisible to every gate a repo normally
 * has. Each value was defensible on its own. None of them was chosen against its
 * neighbours.
 *
 * ── WHAT THIS ASSERTS, AND WHY IT IS A CLASS NAME ───────────────────────
 * The rhythm lives in `run-rows.tsx` as `RUN_ROW`, so the check is that all three
 * views actually use it rather than composing their own spacing. Asserting the
 * shared CONSTANT rather than a measured pixel is deliberate: happy-dom lays
 * nothing out, so a measured assertion here would be measuring nothing, and the
 * real invariant is that there is one declaration and three consumers.
 *
 * A fourth view that hand-rolls a grid fails this file. A view that changes
 * `RUN_ROW` changes all three at once, which is the point.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { StatusChip, STATUS_WORD, type StatusWord } from "../StatusChip";
import { PlanCard, type PlanStep } from "../PlanCard";
import { RunTimeline, type TimelineEvent } from "../RunTimeline";
import { ToolStream, type ToolStreamRow } from "../ToolStream";
import { RUN_ROW, RUN_STACK, formatElapsed, runGlyphForTool } from "../run-rows";

const T = Date.UTC(2026, 7, 19, 3, 0);

const STEPS: PlanStep[] = [
  { id: "a", label: "Read the outage thread", state: "done", agentSlug: "researcher", station: "discover" },
  { id: "b", label: "Write the notice", state: "active", agentSlug: "builder", station: "build" },
];

const EVENTS: TimelineEvent[] = [
  { id: "a", at: T, kind: "station", station: "discover", label: "Read the outage thread", state: "done" },
  { id: "b", at: T + 60_000, kind: "repo", label: "Write the notice", agentSlug: "builder", state: "working" },
];

const CALLS: ToolStreamRow[] = [
  { id: "a", tool: "web.search", at: T, argument: "firmware reboot", durationMs: 2_400, state: "done" },
  { id: "b", tool: "studio.checks.run", at: T + 60_000, argument: "bun test", state: "running" },
];

/** Every row element each view draws, however it wraps them. */
function rowsOf(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll("li")].map((li) => {
    /* A selectable row wraps its grid in a button, so the grid is the child. */
    const inner = li.firstElementChild;
    return (inner instanceof HTMLElement && inner.className.includes("grid") ? inner : li) as HTMLElement;
  });
}

/**
 * Rendered PER TEST, not once at describe scope, and the first draft of this file
 * got that wrong in a way worth recording: RTL's `cleanup` runs `afterEach`, so
 * containers built in the describe body are empty by the second test. Two
 * assertions passed VACUOUSLY against zero rows, which is precisely the criterion
 * that green-lights a defect, in the file written to catch defects of that shape.
 *
 * Every loop below therefore also asserts it found something to check.
 */
function views(): [string, HTMLElement][] {
  return [
    ["PlanCard", render(<PlanCard steps={STEPS} />).container],
    ["RunTimeline", render(<RunTimeline events={EVENTS} />).container],
    ["ToolStream", render(<ToolStream rows={CALLS} />).container],
  ];
}

describe("all three views draw the same row", () => {
  it("uses the one shared row declaration and composes no spacing of its own", () => {
    for (const [name, container] of views()) {
      const rows = rowsOf(container);
      expect(rows.length, `${name} drew no rows`).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.className, `${name} hand-rolled a row instead of using RUN_ROW`).toContain(
          RUN_ROW,
        );
      }
    }
  });

  it("stacks its rows the same way", () => {
    let checked = 0;
    for (const [name, container] of views()) {
      const list = container.querySelector("ol");
      expect(list, `${name} has no row list`).toBeTruthy();
      expect(list?.className, `${name} stacks its rows its own way`).toBe(RUN_STACK);
      checked++;
    }
    expect(checked).toBe(3);
  });

  it("holds the clock column open even where there is no clock", () => {
    /*
     * A plan has no times yet, and the reflex is to drop the column. Dropping it
     * puts the plan's subjects 54px left of the timeline's, which is the same
     * misalignment from the other direction. The column is held open instead.
     */
    const rows = rowsOf(views()[0][1]);
    expect(rows.length, "PlanCard drew no rows").toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.children.length, "PlanCard collapsed the clock column").toBe(3);
    }
  });

  it("gives every row exactly three columns, in every view", () => {
    let rows = 0;
    for (const [name, container] of views()) {
      for (const row of rowsOf(container)) {
        expect(row.children.length, `${name} has a row with a different column count`).toBe(3);
        rows++;
      }
    }
    expect(rows, "no rows were checked at all").toBeGreaterThan(5);
  });
});

describe("the clock column takes a clock and nothing else", () => {
  /*
   * ── THIS BLOCK ASSERTED THE OPPOSITE UNTIL 2026-08-20, AND WAS WRONG ─────
   *
   * It required a silence duration to sit in the CLOCK COLUMN, under the argument
   * that a duration is a number about time and belongs where the other numbers
   * about time are. That fixed a real defect (the figure had been inline in the
   * body while every event row put its time in the clock column) and it fixed it
   * in the wrong direction.
   *
   * The founder named the flaw in the semantics: the clock column answers WHEN,
   * and a duration answers HOW LONG, which is a what. Then the measurement closed
   * it, because he offered a second repair and that repair does not exist. In
   * JetBrains Mono at 11.5px against this column's 40px:
   *
   *   03:12       34.50px   what the column is for
   *   28m 0s      41.41px   the case this test was passing on. It wrapped
   *   6h 11m      41.41px   so shedding the seconds does not help
   *   6h 11m 00s  69.00px   three lines, 52px tall, against 17px beside it
   *
   * SO THE TEST WAS GREEN ON A WRAPPED ROW. It checked which column the figure
   * landed in and could not see that the figure did not fit the column, which is
   * the exact class of defect this file was written to catch, committed by the
   * file itself.
   */
  it("leaves the clock column empty on a row that has no instant to print", () => {
    const { container } = render(
      <RunTimeline
        events={[
          { id: "a", at: T, kind: "gate", label: "Asked whether to ship", state: "gate" },
          { id: "b", at: T + 28 * 60_000, kind: "gate", label: "You approved it", state: "done" },
        ]}
      />,
    );

    const silence = [...container.querySelectorAll("li")].find((li) =>
      li.textContent?.includes("nobody answered"),
    );
    expect(silence, "the silence row is gone").toBeTruthy();

    const first = silence!.children[0] as HTMLElement;
    expect(first.textContent, "a duration is back in the clock column").toBe("");
    // A silence begins at the instant printed one row above and ends at the one
    // printed below, so a clock here would restate what is already on screen.
    expect(first.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps the duration in the body, in the treatment every event row uses", () => {
    const { container } = render(
      <RunTimeline
        events={[
          { id: "a", at: T, kind: "gate", label: "Asked whether to ship", state: "gate" },
          { id: "b", at: T + 28 * 60_000, kind: "gate", label: "You approved it", state: "done" },
        ]}
      />,
    );

    const silence = [...container.querySelectorAll("li")].find((li) =>
      li.textContent?.includes("nobody answered"),
    );
    const body = silence!.children[2] as HTMLElement;
    expect(body.textContent).toContain("28m 0s");
    // `RunTook`'s treatment, which is what an event row gives its own duration.
    const figure = [...body.querySelectorAll("span")].find((s) =>
      s.textContent?.trim().startsWith("28m"),
    );
    expect(figure?.className).toContain("font-mrd-mono");
    expect(figure?.className).toContain("tabular-nums");
  });

  it("prints a six hour silence without a seconds digit", () => {
    // Seconds are noise at six hours, and `formatDuration` would have written
    // `6h 11m 00s` here. One formatter for every duration this component prints.
    const { container } = render(
      <RunTimeline
        events={[
          { id: "a", at: T, kind: "gate", label: "Asked whether to ship", state: "gate" },
          {
            id: "b",
            at: T + (6 * 3600 + 11 * 60) * 1000,
            kind: "gate",
            label: "You approved it",
            state: "done",
          },
        ]}
      />,
    );
    const silence = [...container.querySelectorAll("li")].find((li) =>
      li.textContent?.includes("nobody answered"),
    );
    expect(silence!.textContent).toContain("6h 11m");
    expect(silence!.textContent).not.toContain("00s");
  });

  it("holds no helper for putting a figure back in the clock column", () => {
    // `RunFigure` is deleted rather than narrowed: a slot that only ever takes one
    // kind of thing cannot be handed the other kind by a future row type.
    const source = readFileSync("src/components/meridian/run-rows.tsx", "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toContain("RunFigure");
  });
});

describe("elapsed rolls over into hours", () => {
  it("does not render an 86 hour hold as 5160m", () => {
    /*
     * THE DEFECT, verbatim: `useElapsed` formatted `${m}m ${s}s` above sixty
     * seconds and never rolled over. It typechecked, it was not wrong, and no
     * reader could parse it. One of the sizes nobody draws.
     */
    expect(formatElapsed(86 * 3600)).toBe("86h 00m");
    expect(formatElapsed(86 * 3600)).not.toContain("5160");
  });

  it("keeps tenths only while they are the digit that moves", () => {
    expect(formatElapsed(0)).toBe("0.0s");
    expect(formatElapsed(4.2)).toBe("4.2s");
    expect(formatElapsed(59.9)).toBe("59.9s");
  });

  it("drops to whole seconds once minutes exist, and drops seconds once hours do", () => {
    // Past an hour the seconds are noise beside the hours, and dropping them stops
    // the figure changing width every second on a long hold.
    expect(formatElapsed(61)).toBe("1m 1s");
    expect(formatElapsed(6 * 60 + 6)).toBe("6m 6s");
    expect(formatElapsed(3600)).toBe("1h 00m");
    expect(formatElapsed(6 * 3600 + 12 * 60 + 41)).toBe("6h 12m");
  });

  it("does not report a negative or a broken clock as a duration", () => {
    expect(formatElapsed(-5)).toBe("0.0s");
    expect(formatElapsed(Number.NaN)).toBe("0.0s");
  });
});

describe("a tool wears the mark of the thing it touched", () => {
  it("sends anything reaching the repo to the source host's mark", () => {
    for (const tool of [
      "github.pr.open",
      "github.issue.create",
      "repo.read",
      "repo.search",
      "studio.commit",
      "studio.pr.merge",
      "studio.revert",
      "studio.sync_branch",
    ]) {
      expect(runGlyphForTool(tool), tool).toBe("repo");
    }
  });

  it("sends a web read to the globe", () => {
    expect(runGlyphForTool("web.search")).toBe("fetch");
    expect(runGlyphForTool("web.fetch")).toBe("fetch");
    expect(runGlyphForTool("web.map")).toBe("fetch");
  });

  it("sends our own verification to the clipboard, not to a runner's logo", () => {
    /*
     * What a reader is looking at is Supaprod running its checks. Putting a third
     * party's trademark on our own station would be both wrong about whose station
     * it is and somebody else's geometry sitting in our bundle, which is the
     * argument `provider-marks.tsx` already makes about verbatim brand paths.
     */
    for (const tool of [
      "studio.checks.run",
      "studio.tests.plan",
      "studio.review",
      "studio.secrets.scan",
      "studio.deps.audit",
    ]) {
      expect(runGlyphForTool(tool), tool).toBe("check");
    }
  });

  it("sends passing work along to the handoff mark", () => {
    expect(runGlyphForTool("agent.handoff")).toBe("handoff");
    expect(runGlyphForTool("mission.dispatch")).toBe("handoff");
    expect(runGlyphForTool("delegate.openhands")).toBe("handoff");
  });

  it("falls back to a wrench rather than a question mark", () => {
    // An uncatalogued tool is still a tool call. Where it shows itself is the
    // LABEL, in the raw name `toolActionLabel` could not translate.
    expect(runGlyphForTool("quarry.excavate")).toBe("tool");
    expect(runGlyphForTool("")).toBe("tool");
  });

  it("draws no ASCII stand-in anywhere in the three views", () => {
    /*
     * `[]`, `->`, `<>` and a bare capital letter are placeholders, not
     * iconography. This asserts against the rendered markup of all three views at
     * once, because the way this regresses is one new row type reaching for the
     * nearest character.
     */
    for (const [, container] of [
      ["PlanCard", render(<PlanCard steps={STEPS} />).container] as const,
      ["RunTimeline", render(<RunTimeline events={EVENTS} />).container] as const,
      ["ToolStream", render(<ToolStream rows={CALLS} />).container] as const,
    ]) {
      const text = container.textContent ?? "";
      for (const stand of ["[]", "->", "=>", "⇄", "↔"]) {
        expect(text, `a stand-in survived: ${stand}`).not.toContain(stand);
      }
    }
  });
});

describe("the chip carries the colour and the word carries the meaning", () => {
  const ALL: StatusWord[] = ["you", "agent", "pass", "fail", "hold"];

  it("never mixes one status's chip with another's label", () => {
    /*
     * Every label was measured on ITS OWN chip and clears 4.8 there. A `you` chip
     * under `agent` text is a pairing nobody measured, and it is the one mistake
     * this component's shape makes easy: two class names, one row apart.
     */
    for (const status of ALL) {
      const { container, unmount } = render(<StatusChip status={status} />);
      const chip = container.firstElementChild as HTMLElement;
      expect(chip.className, status).toContain(`bg-mrd-${status}-chip`);
      expect(chip.className, status).toContain(`text-mrd-${status}-on-chip`);
      for (const other of ALL.filter((s) => s !== status)) {
        expect(chip.className, `${status} borrowed ${other}'s label colour`).not.toContain(
          `-mrd-${other}-`,
        );
      }
      unmount();
    }
  });

  it("says its word inside itself, so the set reads with the colour removed", () => {
    for (const status of ALL) {
      const { container, unmount } = render(<StatusChip status={status} />);
      expect(container.textContent, status).toBe(STATUS_WORD[status]);
      unmount();
    }
  });

  it("interpolates no class name, because Tailwind would generate nothing", () => {
    /*
     * `bg-mrd-${word}-chip` reads fine and emits no CSS at all, because Tailwind
     * scans source text. The failure is silent: the chip renders with no
     * background and the label with no colour, which on the dark ground looks
     * almost deliberate.
     */
    /* Comments stripped first, because the file's own header explains the trap by
       quoting it. The ratchet strips comments for the same reason: documenting a
       mistake must not count as making it. */
    const code = readFileSync(new URL("../StatusChip.tsx", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    expect(code).not.toContain("bg-mrd-${");
    expect(code).not.toContain("text-mrd-${");
  });

  it("breathes only for the two states that are still moving", () => {
    for (const status of ALL) {
      const { container, unmount } = render(<StatusChip status={status} pulse />);
      const style = (container.firstElementChild as HTMLElement).getAttribute("style") ?? "";
      expect(style, `${status} asked to pulse and did not`).toContain("mrd-attention");
      unmount();
    }

    // And an outcome has nothing left to wait for, so it stays still by default.
    const { container } = render(<StatusChip status="pass" />);
    expect(container.firstElementChild?.getAttribute("style")).toBeNull();
  });

  it("keeps a machine slower than a person, which is the cadence marks.tsx set", () => {
    const machine = render(<StatusChip status="agent" pulse />);
    expect(machine.container.innerHTML).toContain("2400ms");
    machine.unmount();

    const person = render(<StatusChip status="you" pulse />);
    expect(person.container.innerHTML).toContain("1600ms");
  });
});

describe("a chip appears only where something is running, waiting or broken", () => {
  it("gives a finished step none, in any of the three views", () => {
    /*
     * ONE RULE, THREE VIEWS. `PlanCard` chipped `done` in its first version, which
     * would have put four chips on a five-step plan with three finished. At that
     * density a chip stops meaning "look here" and starts meaning "row".
     */
    const plan = render(
      <PlanCard steps={[{ id: "a", label: "Read it", state: "done", agentSlug: "researcher" }]} />,
    );
    expect(plan.container.querySelector("[data-status]"), "PlanCard chipped a done step").toBeNull();
    plan.unmount();

    const timeline = render(
      <RunTimeline
        events={[{ id: "a", at: T, kind: "fetch", label: "Read it", state: "done" }]}
      />,
    );
    expect(
      timeline.container.querySelector("[data-status]"),
      "RunTimeline chipped a done event",
    ).toBeNull();
    timeline.unmount();

    const stream = render(
      <ToolStream rows={[{ id: "a", tool: "repo.read", at: T, state: "done" }]} />,
    );
    expect(
      stream.container.querySelector("[data-status]"),
      "ToolStream chipped a done call",
    ).toBeNull();
  });

  it("gives a running thing one, in all three", () => {
    let found = 0;
    const cases = [
      render(<PlanCard steps={[{ id: "a", label: "Write it", state: "active" }]} />).container,
      render(
        <RunTimeline
          events={[{ id: "a", at: T, kind: "repo", label: "Write it", state: "working" }]}
        />,
      ).container,
      render(<ToolStream rows={[{ id: "a", tool: "repo.read", at: T, state: "running" }]} />)
        .container,
    ];
    for (const container of cases) {
      const chip = container.querySelector("[data-status]");
      expect(chip?.getAttribute("data-status")).toBe("agent");
      found++;
    }
    expect(found).toBe(3);
  });
});

describe("one row leads to the next, and the rail is how a reader can see it", () => {
  /*
   * FOUNDER REVIEW 2026-08-20: nothing connects one row to the next.
   *
   * TWO SEPARATE FAULTS UNDER ONE SENTENCE, and only finding both explains why a
   * component that already had a rail still read as a list.
   *
   *   1. `ToolStream` had no rail at all, so two views of one run were a sequence
   *      and a list.
   *   2. `RunTimeline`'s rail stopped at each row's bottom edge while `RUN_STACK`
   *      opens `gap-1` between rows, so the line broke for 4px on every row. A
   *      rail with a hole in it every 28px is a column of ticks.
   *
   * `Thinking`, the reference this whole rhythm is read off, draws ONE continuous
   * line down its trace. `-mb-1` is that, expressed per row: the stack's own gap,
   * negated, so the two cannot drift apart.
   */
  const railsOf = (container: HTMLElement) =>
    [...container.querySelectorAll("span")].filter(
      (s) => s.className.includes("w-px") && s.className.includes("bg-mrd-line"),
    );

  it("draws a rail in every view that shows a sequence of rows", () => {
    for (const [name, container] of views()) {
      if (name === "PlanCard") continue; // covered by its own file
      expect(railsOf(container).length, `${name} draws no rail`).toBeGreaterThan(0);
    }
  });

  it("crosses the gap the stack opens, rather than stopping at the row edge", () => {
    for (const [name, container] of views()) {
      const rails = railsOf(container);
      if (rails.length === 0) continue;
      for (const rail of rails) {
        expect(rail.className, `${name} has a rail that stops at the row edge`).toContain("-mb-1");
      }
    }
    // `RUN_STACK` is what `-mb-1` is negating. If the stack's gap ever changes,
    // this is the line that has to change with it, so it is asserted here.
    expect(RUN_STACK).toContain("gap-1");
  });

  it("stops the rail on the last row, because a line past it claims more is coming", () => {
    const { container } = render(<ToolStream rows={CALLS} />);
    // Two rows, so exactly one rail: the one joining the first to the second.
    expect(railsOf(container).length).toBe(1);
  });

  it("stops the rail on a single row too", () => {
    const { container } = render(<ToolStream rows={[CALLS[0]]} />);
    expect(railsOf(container).length).toBe(0);
  });

  it("reaches up as well as down where there is no glyph to receive it", () => {
    /*
     * A silence row has no mark, so its dashed line is the only thing joining the
     * rows either side of it. Reaching down alone would leave a hole above it,
     * which is the same defect as the solid rail's and easier to miss because a
     * dashed line already looks interrupted.
     */
    const { container } = render(
      <RunTimeline
        events={[
          { id: "a", at: T, kind: "gate", label: "Asked whether to ship", state: "gate" },
          { id: "b", at: T + 28 * 60_000, kind: "gate", label: "You approved it", state: "done" },
        ]}
      />,
    );
    const dashed = [...container.querySelectorAll("span")].filter((s) =>
      s.className.includes("border-dashed"),
    );
    expect(dashed.length, "the silence rail is gone").toBe(1);
    expect(dashed[0].className).toContain("-mt-1");
    expect(dashed[0].className).toContain("-mb-1");
  });

  it("survives greyscale, because the break is a shape and not a colour", () => {
    const { container } = render(
      <RunTimeline
        events={[
          { id: "a", at: T, kind: "gate", label: "Asked whether to ship", state: "gate" },
          { id: "b", at: T + 28 * 60_000, kind: "gate", label: "You approved it", state: "done" },
        ]}
      />,
    );
    const dashed = container.querySelector('[class*="border-dashed"]');
    const solid = container.querySelector('[class*="bg-mrd-line"]');
    expect(dashed, "no dashed rail").toBeTruthy();
    expect(solid, "no solid rail").toBeTruthy();
    // Neither carries a status hue: the difference between them is dash and solid.
    for (const el of [dashed, solid]) {
      for (const status of ["mrd-you", "mrd-agent", "mrd-pass", "mrd-fail", "mrd-hold"]) {
        expect(el?.className).not.toContain(status);
      }
    }
  });
});

describe("a mark names the thing it touched, and it is drawn where the ink is", () => {
  const RUN_ROWS_SOURCE = readFileSync("src/components/meridian/run-rows.tsx", "utf8");

  it("no longer carries the wrench that was not a drawing of anything", () => {
    /*
     * The previous `tool` path rendered as a loop, a lump and a stub: no jaw, no
     * handle, and at 14px three grey marks. It survived because it had a plausible
     * comment above it, which is the placeholder failure hiding inside the set
     * built to remove placeholders.
     *
     * MEASURED: its ink centred at 11.35, 10.55 against the 12, 12 this file
     * requires, the largest offset of the thirteen marks in the system and 0.85px
     * high at the 14px it ships at.
     */
    expect(RUN_ROWS_SOURCE).not.toContain("M15.5 8.5a3.5 3.5 0 1 0-4.2-4.2");
    // The replacement is the only candidate of four whose ink lands inside the
    // 4..20 optical square this file declares, with a centre within 0.17 of 12,12.
    expect(RUN_ROWS_SOURCE).toContain("M9.8 11.4 4.6 16.6a2.3 2.3 0 0 0 3.2 3.2l5.2-5.2");
  });

  it("records the measurement rather than the intention", () => {
    /*
     * happy-dom implements no `getBBox`, so ink geometry cannot be asserted here
     * and this is the honest substitute: the file has to carry the numbers, taken
     * from a real render, so the next person to move a path has something to
     * re-measure against. Stated as a limitation rather than dressed as a check.
     */
    expect(RUN_ROWS_SOURCE).toContain("THE INK, MEASURED, ALL THIRTEEN");
    expect(RUN_ROWS_SOURCE).toContain("11.35, 10.55");
  });

  it("draws every mark it owns on one grid, and lands the borrowed one on it", () => {
    /*
     * A mark bigger or heavier than its neighbours reads as more important, which
     * is a claim the row never made. Every glyph this file draws is 14px on a
     * 24x24 box.
     *
     * THE SOURCE HOST'S MARK IS THE ONE EXCEPTION AND IT HAS TO BE. It is
     * somebody else's geometry on their own 16x16 grid, and redrawing GitHub's
     * mark to fit ours would be both wrong and worse. It is normalised instead, by
     * the compensation `run-rows.tsx` documents: 12px inside an 18px box, pulled
     * back to the 14px slot with `-m-[2px]`, which is `ProviderMark`'s own
     * 16-in-22 proportion, so its ink weight matches rather than approximates.
     */
    const { container } = render(<RunTimeline events={EVENTS} />);
    const marks = [...container.querySelectorAll("svg")];
    expect(marks.length).toBeGreaterThan(0);

    let ours = 0;
    let borrowed = 0;
    for (const svg of marks) {
      if (svg.getAttribute("viewBox") === "0 0 24 24") {
        expect(svg.getAttribute("width")).toBe("14");
        ours++;
      } else {
        /*
         * THE RENDERED BOX, NOT THE viewBox. This asserted `"0 0 16 16"` until
         * 2026-08-23, which was true only while every borrowed mark had been
         * redrawn onto one synthetic grid. They now carry their PUBLISHER'S
         * viewBox, because they are the publisher's own art: GitHub ships
         * 256x250, Figma 256x384, Stripe 512x214. Normalising those by hand is
         * what produced a "Linear" mark that was three freehand strokes.
         *
         * The claim this guard exists for is unchanged and is about SIZE ON
         * SCREEN, so that is what it reads now: a square pixel box, with the
         * aspect ratio preserved so a 256x384 mark is fitted rather than
         * stretched. A mark that came back bigger than its neighbours still
         * fails, which is the whole point.
         */
        const w = svg.getAttribute("width");
        const h = svg.getAttribute("height");
        expect(w, "a borrowed mark must declare its rendered width").toBeTruthy();
        expect(h).toBe(w);
        expect(svg.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
        borrowed++;
      }
    }
    // Both kinds are present in this fixture, so neither branch passes on nothing.
    expect(ours, "no mark of our own was drawn").toBeGreaterThan(0);
    expect(borrowed, "the source host mark was not drawn").toBe(1);
    expect(
      container.querySelector('[class*="-m-[2px]"]'),
      "the borrowed mark is not being pulled back onto the slot",
    ).toBeTruthy();
  });
});
