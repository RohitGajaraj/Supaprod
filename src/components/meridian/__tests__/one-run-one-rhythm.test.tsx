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

describe("a figure about time sits in the column for figures about time", () => {
  it("puts a silence duration where every clock is, not inline in the label", () => {
    /*
     * THE MOST VISIBLE TELL THAT A COMPONENT WAS ASSEMBLED RATHER THAN DESIGNED,
     * and it was live: `28m 0s` sat in the body while every event row put its time
     * in the clock column. Two number columns, one component.
     */
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
    expect(first.textContent, "the duration left the clock column").toContain("28m 0s");
    expect(first.className, "the duration is not right-aligned with the clocks").toContain(
      "text-right",
    );
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
