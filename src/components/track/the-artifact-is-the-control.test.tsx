/**
 * THE THING THE RUN MADE IS THE THING YOU PRESS.
 *
 * ── THE REPORT, FROM THE LIVE SITE (founder, 2026-09-02 20:09) ────────────
 * *"When some PRD or spec is written it gives a block, and it is not clickable.
 * It needs to be clickable, viewable, editable. Not just the spec: any artifact,
 * design, a code block. When I click on the PRD the right side should open up."*
 *
 * ── WHY THE ROW ALONE WAS NOT ENOUGH ──────────────────────────────────────
 * P-01 made the turn's HEADLINE pressable, and it selects a station. A station
 * points at one thing per station, so on a Design turn that filed ten
 * prototypes the third could be read in the transcript and not opened: the chip
 * naming it was a span. The chip is the only place on the run screen where one
 * specific filed thing is drawn by name, so it is the only place one specific
 * filed thing can be opened from.
 *
 * ── WHAT THESE PIN ────────────────────────────────────────────────────────
 *  - a chip is a BUTTON, and its accessible name is the artifact rather than
 *    the word "Open", because "Open" repeated eleven times down a transcript
 *    names nothing;
 *  - it opens THAT artifact by id, so ten prototypes are ten different presses;
 *  - a chip with no listener is a plain fact with no pointer and no tab stop,
 *    which is the contract `ToolStream` and the shell's stage chips already
 *    hold: a control that opens nothing is a promise this repo removes;
 *  - a MISSING artifact is never a control, because pressing it could only open
 *    an empty pane;
 *  - the row's own press opens the NEWEST thing the turn filed, which is the
 *    shortcut the chips make precise.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render } from "@testing-library/react";

import { RunRollup } from "@/components/meridian/run-rows";
import { newestMade, rollupOf, type TitleBook } from "@/components/spine/TrackActivity";
import type { Turn } from "@/lib/spine/activity";

const turn = (made: Turn["made"]): Turn => ({
  runId: "r-1",
  agentSlug: "draft",
  agentName: "Draft",
  station: "design",
  stationName: "Design",
  at: "2026-09-02T10:00:00Z",
  outcome: "done",
  made,
  said: null,
  tookMs: 1000,
  tokens: 10,
  usd: 0,
  stopLine: null,
});

const PROTOTYPES: Turn["made"] = [
  { kind: "prototype", word: "prototype", id: "p-1" },
  { kind: "prototype", word: "prototype", id: "p-2" },
  { kind: "prototype", word: "prototype", id: "p-3" },
];

const titles: TitleBook = new Map([
  ["p-1", { title: "Reboot tile, first pass", missing: false }],
  ["p-2", { title: "Reboot tile, amber", missing: false }],
  ["p-3", { title: "Reboot tile, with a label", missing: false }],
]);

function ui(t: Turn, open?: Parameters<typeof rollupOf>[2]) {
  return render(<RunRollup items={rollupOf(t, titles, open)} />);
}

describe("a chip that can open something", () => {
  it("is a button, named for the artifact and not for the verb", () => {
    const { getAllByRole } = ui(turn(PROTOTYPES), {
      onOpen: () => undefined,
      selectedId: null,
    });
    const chips = getAllByRole("button");
    expect(chips).toHaveLength(3);
    /*
     * The NAME is the artifact. A screen reader announces the accessible name,
     * and "Open" three times names nothing; the word and the title already name
     * it, and an `aria-label` would have replaced that name to say the role the
     * element already carries.
     */
    expect(chips[0].textContent).toContain("Reboot tile, first pass");
    expect(chips[2].textContent).toContain("Reboot tile, with a label");
  });

  it("opens that artifact by id, so ten prototypes are ten different presses", () => {
    const opened: string[] = [];
    const { getAllByRole } = ui(turn(PROTOTYPES), {
      onOpen: (id) => opened.push(id),
      selectedId: null,
    });
    const chips = getAllByRole("button");
    fireEvent.click(chips[2]);
    fireEvent.click(chips[0]);
    // The third and then the first, which a station-shaped selection could not
    // tell apart: both live at Design.
    expect(opened).toEqual(["p-3", "p-1"]);
  });

  it("says which one is open, and not with colour alone", () => {
    const { getAllByRole } = ui(turn(PROTOTYPES), {
      onOpen: () => undefined,
      selectedId: "p-2",
    });
    const chips = getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
  });
});

describe("a chip that cannot open anything", () => {
  it("is a plain fact with no pointer and no tab stop", () => {
    /*
     * `rollupOf`'s other reader is its own guard, which calls it with two
     * arguments. A chip drawn as a control there would advertise a door that
     * nobody is behind.
     */
    const { queryAllByRole, container } = ui(turn(PROTOTYPES));
    expect(queryAllByRole("button")).toHaveLength(0);
    expect(container.textContent).toContain("Reboot tile, amber");
  });

  it("refuses to make a missing artifact pressable", () => {
    /*
     * "no longer on file" means the lookup RAN and the row was not there, so
     * the only thing a press could open is an empty pane.
     */
    const gone: TitleBook = new Map([["p-9", { title: null, missing: true }]]);
    const { queryAllByRole, container } = render(
      <RunRollup
        items={rollupOf(turn([{ kind: "prototype", word: "prototype", id: "p-9" }]), gone, {
          onOpen: () => undefined,
          selectedId: null,
        })}
      />,
    );
    expect(queryAllByRole("button")).toHaveLength(0);
    expect(container.textContent).toContain("no longer on file");
  });
});

describe("the row's own press", () => {
  it("opens the newest thing the turn filed, which the chips then make precise", () => {
    expect(newestMade(turn(PROTOTYPES))).toBe("p-3");
  });

  it("opens nothing on a turn that filed nothing", () => {
    expect(newestMade(turn([]))).toBeNull();
  });
});
