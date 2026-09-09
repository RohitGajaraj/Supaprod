/**
 * The spine must not be able to vanish, and a new surface must not be able to
 * forget it.
 *
 * THE DEFECT THESE EXIST TO PREVENT. The strip rendered on 11 of the 24 real
 * authenticated surfaces, and nothing had decided that 11: absence was the
 * default, so the spine was present only where somebody had remembered to call
 * the hook. It was missing from three of the five rail doors. The audit's words
 * were "a spine that disappears is not a spine, it is a page decoration".
 *
 * So the rule under test is not "the strip looks right". It is: WHAT DOES THE
 * SHELL DRAW WHEN NOBODY PUBLISHES, and what happens in the moment between two
 * screens. Both answers used to be "nothing".
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
import { render } from "@testing-library/react";

import {
  RunStripProvider,
  resolveSpine,
  usePublishRunStrip,
  STATION_ROUTE,
  type RunStripSpec,
} from "./run-strip";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

const stages = () =>
  AGENT_STATION_ORDER.map((station) => ({ station, state: "quiet" as const, note: "" }));

const spec = (label: string, mode: "tab" | "nav"): RunStripSpec => ({
  stages: stages(),
  active: null,
  mode,
  label,
  onSelect: () => {},
});

/** Stands in for any surface, and for the default spine, on either channel. */
function Publisher({ strip }: { strip: RunStripSpec | null }) {
  usePublishRunStrip(strip);
  return null;
}

/**
 * AppFrame's half of the contract, reproduced exactly: one piece of state, a
 * memo keyed on it, and a region that only exists when the state is filled.
 * `data-strip` is the same attribute the real shell writes.
 */
function Shell({ surface, spine }: { surface: RunStripSpec | null; spine: React.ReactNode }) {
  const [strip, setStrip] = React.useState<RunStripSpec | null>(null);
  const ctx = React.useMemo(() => ({ spec: strip, publish: setStrip }), [strip]);
  return (
    <RunStripProvider value={ctx} spine={spine}>
      <div
        data-testid="shell"
        data-strip={strip ? "on" : "none"}
        data-label={strip?.label ?? ""}
        data-mode={strip?.mode ?? ""}
      />
      {surface ? <Publisher strip={surface} /> : null}
    </RunStripProvider>
  );
}

describe("resolveSpine: the surface wins, and the empty case is not empty", () => {
  test("a surface that published something covers the default", () => {
    const a = spec("surface", "tab");
    const b = spec("default", "nav");
    expect(resolveSpine(a, b)).toBe(a);
  });

  test("a surface that published nothing gets the default, not nothing", () => {
    // THE WHOLE CHANGE. This used to be `null`.
    const b = spec("default", "nav");
    expect(resolveSpine(null, b)).toBe(b);
  });

  test("nothing is still drawn when the default itself has no answer yet", () => {
    // The spine publishes null while its read is in flight. Seven empty chips
    // would claim the workspace is idle, which is a claim and not a wait.
    expect(resolveSpine(null, null)).toBeNull();
  });
});

describe("the shell's strip region", () => {
  test("a surface that publishes nothing still gets a spine", () => {
    const view = render(
      <Shell surface={null} spine={<Publisher strip={spec("default", "nav")} />} />,
    );
    const shell = view.getByTestId("shell");
    expect(shell.getAttribute("data-strip")).toBe("on");
    expect(shell.getAttribute("data-label")).toBe("default");
    expect(shell.getAttribute("data-mode")).toBe("nav");
  });

  test("a surface that publishes its own strip covers the default", () => {
    const view = render(
      <Shell
        surface={spec("this run", "tab")}
        spine={<Publisher strip={spec("default", "nav")} />}
      />,
    );
    expect(view.getByTestId("shell").getAttribute("data-label")).toBe("this run");
    expect(view.getByTestId("shell").getAttribute("data-mode")).toBe("tab");
  });

  test("leaving that surface uncovers the spine and never blanks the region", () => {
    // THE REGRESSION THAT MATTERS. A surface's unmount cleanup publishes null.
    // Under a single slot that cleared the shell, so walking from a station to
    // Brain took the spine away and left 97px of nothing behind it. Now the
    // default is simply uncovered, and the region never reports "none".
    const spine = <Publisher strip={spec("default", "nav")} />;
    const view = render(<Shell surface={spec("this run", "tab")} spine={spine} />);
    expect(view.getByTestId("shell").getAttribute("data-label")).toBe("this run");

    view.rerender(<Shell surface={null} spine={spine} />);
    const shell = view.getByTestId("shell");
    expect(shell.getAttribute("data-strip")).toBe("on");
    expect(shell.getAttribute("data-label")).toBe("default");
  });

  test("the region is empty only while the default has nothing to say", () => {
    const view = render(<Shell surface={null} spine={<Publisher strip={null} />} />);
    expect(view.getByTestId("shell").getAttribute("data-strip")).toBe("none");
  });
});

describe("the default cannot be quietly turned back off", () => {
  const src = readFileSync(join(import.meta.dir, "run-strip.tsx"), "utf8");
  const spineSrc = readFileSync(join(import.meta.dir, "use-spine-strip.ts"), "utf8");

  test("the seam defaults to the real workspace spine", () => {
    // `spine` exists for the test above. If its default were ever `null` or
    // `undefined`, every assertion here would still pass and the product would
    // be back to a spine that renders where somebody remembered to ask for it.
    expect(src).toMatch(/spine\s*=\s*<WorkspaceSpine\s*\/>/);
    expect(src).toContain('import { WorkspaceSpine } from "./use-spine-strip"');
  });

  test("the default spine lights no station", () => {
    // Brain is not a station. Lighting one there would be a claim about where
    // the reader is standing, which is the lie the null active slot exists to
    // avoid.
    expect(spineSrc).toMatch(
      /export function WorkspaceSpine\(\)[\s\S]{0,400}?useSpineStrip\(null\)/,
    );
  });

  test("no surface is decided by a route list", () => {
    // The failed design was per-surface opt-in. A pathname branch in the shell
    // would be the same disease wearing a switch statement, and AppFrame's own
    // rule is that it renders a slot and a slot is not a branch.
    const provider = src.slice(src.indexOf("export function RunStripProvider("));
    expect(provider).not.toMatch(/pathname|useLocation|useRouterState|startsWith\(/);
  });

  test("all seven stations still have an engine to open", () => {
    // The strip is now on every surface, so a chip that led nowhere would lead
    // nowhere everywhere.
    for (const station of AGENT_STATION_ORDER) {
      expect(STATION_ROUTE[station]).toMatch(/^\/[a-z-]+$/);
    }
    /*
     * SEVEN ENTRIES, NOT SEVEN DESTINATIONS (P-14b, A-QUEUE.md, 2026-09-09).
     * This counted distinct paths, which asserted a second thing it never
     * meant: that no two stations share a page. Learn's record moved onto
     * Outcomes on 2026-09-09 and Ship's followed the same day, so `ship` and
     * `learn` now open the same surface at different tabs -- true of the
     * product, and the map holds only the path, so the two collapse into one
     * value here.
     *
     * The rule this test is named for is untouched and is the loop above: no
     * station may lose its engine. What the count guarded beyond that was a
     * station quietly dropping OUT of the map, and that is asserted directly
     * now rather than inferred from a set size, which is strictly the tighter
     * check -- a duplicate could never have hidden a missing key anyway,
     * because a missing key fails the loop first.
     */
    expect(Object.keys(STATION_ROUTE).sort()).toEqual([...AGENT_STATION_ORDER].sort());
  });
});
