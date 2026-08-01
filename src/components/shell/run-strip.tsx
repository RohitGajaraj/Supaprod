/**
 * The seven-stage strip, and who is allowed to draw it.
 *
 * FOUNDER RULING 2026-07-29, and this module exists to obey it exactly:
 *   "there is a bar on the run section, 01 to 07, Discover, Decide. That needs
 *    to be always there, only on the run section. And if it has to be
 *    collapsed, when someone clicks on the top bar, that 2 running / 3 running,
 *    that will be collapsed. Else it needs to be always there, only on the run
 *    section, not on Crew or Today or all those things."
 *
 * The shipped behaviour was the inverse of that: AppFrame rendered the strip on
 * EVERY route and `shell.css` kept it `display:none` until you clicked the live
 * line, so it was nowhere by default and everywhere on click. The strip also
 * showed workspace-wide stage activity, which is not a run's progress: on a run
 * screen "05 Build" has to mean *this run is building*, not *something,
 * somewhere, is building*.
 *
 * SO OWNERSHIP INVERTS. The shell owns the region; the run owns the content. A
 * run surface calls `usePublishRunStrip(...)` and the strip appears, filled
 * with that run's own seven stages. Nothing else in the product publishes, so
 * nothing else draws it. AppFrame still takes no "which shell" argument and
 * still has no per-route branch, which was the disease the rebuild treated: it
 * renders a slot, and a slot is not a branch.
 *
 * The chips are a segmented control, not decoration (founder call, same day):
 * clicking 05 swaps the work region to Build *for this run*. You never leave
 * the run, which is what "each thing has to happen within that shell" asks for.
 *
 * 2026-07-30, THE SECOND HALF OF THE SAME RULING. The above shipped and the
 * founder still could not see the strip, because only ONE surface published
 * one: /runs/$missionId. Clicking Runs in the rail lands on the board, and the
 * board published nothing, so the spine was absent from the front door of the
 * section it belongs to. Worse, the board's rows were buttons that opened a
 * legacy slide-over rather than links into the run, so the surface that DID
 * draw the strip was unreachable by clicking anything.
 *
 * So a strip has two readings, and the spine surfaces get the other one:
 *   - `mode: "tab"` a run's own seven stages. Picking one swaps the work
 *                   region and you never leave the run.
 *   - `mode: "nav"` the workspace's seven stages: how many runs are at each,
 *                   and which of them want you. Picking one opens that
 *                   station's engine.
 * The seven chips are on screen either way, which is what "constantly shown"
 * asked for. What changes is what a number on a chip means, and a chip never
 * carries a count it cannot source.
 *
 * WHERE IT RENDERS, and the one place this reads past the founder's earlier
 * ruling. He said the strip must not leak onto "Today, Brain and so on", and it
 * does not: Today, Brain, Crew, Engine room, Settings and admin publish
 * nothing. But the seven STATIONS are the spine rather than chrome, and a chip
 * that opens /design would drop you off the spine if /design had no strip. So
 * the strip lives on the board, on a run, and on the seven stations. That is a
 * reading of the ruling rather than the letter of it, and it is flagged here
 * rather than made quietly.
 */

import * as React from "react";

import type { AgentStation } from "@/lib/agent-vocabulary";

/**
 * What a stage looks like from inside one run.
 *
 * `done` and `quiet` are both "nothing is happening here", and they are kept
 * apart on purpose: a finished stage earned its silence, an untouched one has
 * not started. Rendering them the same way would tell you a run is further
 * along than it is.
 */
export type RunStageState = "done" | "working" | "gate" | "next" | "quiet";

export type RunStage = {
  station: AgentStation;
  state: RunStageState;
  /**
   * The stage's own second line, in the run's words: "4 signals", "you kept
   * it", "writing the change", "your call, next". Never a status word the
   * state already carries, and never invented, an unknown stage says so.
   */
  note: string;
};

/**
 * "tab" picks which stage the work region shows; "nav" leaves for that stage's
 * own surface. They are not the same control and must not read as the same one:
 * a tablist promises the selection stays on this screen, which is false when
 * the click is a navigation. Defaults to "tab", the behaviour that shipped.
 */
export type RunStripMode = "tab" | "nav";

/**
 * Where each station's deep engine lives.
 *
 * FOUNDER RULING 2026-07-30: "at any point of time if i click any of the
 * station in that 1-7 strip, it should take me to the deep engine of that
 * station, for example if i click on build, full build engine should open."
 *
 * Six of these already existed and none were reachable from the spine, which
 * is the same defect the strip itself had: built, and given no door.
 *
 * BUILD IS NOT /runs, and an earlier draft of this map said it was. /runs is
 * the home of a different axis (one run walking all seven stages), so mapping
 * the Build STATION onto it re-asserted the exact thing the /build -> /runs
 * rename was meant to deny: that a run equals the build leg. The founder
 * caught it: "if /runs is for /build then what happens to the other 6?" Build
 * now has its own engine at /build, which is the one station that never had
 * one.
 *
 * THE ONE RULE FOR A CHIP: it takes you to this stage at the scope you are
 * standing in. Inside a run that is the run's own stage, and you never leave
 * the run. On the board the scope is the workspace, so it is the station's
 * engine. Same gesture, same promise, different scope.
 */
export const STATION_ROUTE: Record<AgentStation, string> = {
  sense: "/discover",
  decide: "/decide",
  define: "/plan",
  design: "/design",
  build: "/build",
  ship: "/ship",
  learn: "/learn",
};

export type RunStripSpec = {
  stages: RunStage[];
  /** Null is only legal in "filter" mode: nothing is selected yet. */
  active: AgentStation | null;
  onSelect: (station: AgentStation) => void;
  mode?: RunStripMode;
  /** What the region is a strip OF, for screen readers. */
  label?: string;
};

type RunStripContextValue = {
  spec: RunStripSpec | null;
  publish: React.Dispatch<React.SetStateAction<RunStripSpec | null>>;
};

const RunStripContext = React.createContext<RunStripContextValue>({
  spec: null,
  publish: () => {},
});

export const RunStripProvider = RunStripContext.Provider;

export function useRunStrip(): RunStripContextValue {
  return React.useContext(RunStripContext);
}

/**
 * The strip's labels, which now AGREE with `AGENT_STATIONS[station].name`.
 *
 * This map used to exist because of a disagreement: the catalog called the
 * first station "Sense", the internal name in the agent mesh, while the product
 * called it Discover. Rather than fix the catalog, this file aliased around it,
 * and the alias held for weeks while every other surface that rendered straight
 * from the catalog went on leaking the internal word. The founder caught it on
 * 2026-08-01 in a Plan receipt reading "Waived: sense, decide" under a rail
 * saying Discover and Decide, and ruled it Discover everywhere. The catalog is
 * the fix; this map is now a plain restatement of it, kept only so the strip's
 * vocabulary is readable in one place. A test asserts the two cannot drift
 * apart again, which is what should have guarded the original exception.
 */
export const STAGE_LABEL: Record<AgentStation, string> = {
  sense: "Discover",
  decide: "Decide",
  define: "Plan",
  design: "Design",
  build: "Build",
  ship: "Ship",
  learn: "Learn",
};

/**
 * Hand the shell this run's strip for as long as the surface is mounted, and
 * take it away on the way out so the next surface is not left wearing it.
 *
 * The caller does not have to memoize. `spec` is a fresh object on every render
 * and publishing it directly would set state on every render forever, so the
 * effect keys off a value signature instead of object identity, and reaches the
 * live `onSelect` through a ref rather than making a new closure a dependency.
 */
export function usePublishRunStrip(spec: RunStripSpec | null): void {
  const { publish } = useRunStrip();

  const onSelectRef = React.useRef<((s: AgentStation) => void) | null>(null);
  onSelectRef.current = spec?.onSelect ?? null;

  // Identity by value. Two renders that describe the same seven stages are the
  // same strip, whatever the objects say.
  const signature = spec
    ? JSON.stringify([
        spec.active,
        spec.mode ?? "tab",
        spec.label ?? "",
        spec.stages.map((s) => [s.station, s.state, s.note]),
      ])
    : null;

  // `spec` is deliberately not a dependency: `signature` is its value identity,
  // and `onSelect` is read through a ref, so the effect re-runs exactly when the
  // strip's content actually changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stages = React.useMemo(() => spec?.stages ?? null, [signature]);
  const active = spec?.active ?? null;
  const mode = spec?.mode ?? "tab";
  const label = spec?.label;

  React.useEffect(() => {
    // Only `stages` gates the strip. `active` used to gate it too, which was
    // right while a run was the sole publisher (a run always has a focus) and
    // is wrong now: a board opens with no stage selected, and that is a strip
    // with nothing lit, not the absence of a strip.
    if (!stages) {
      publish(null);
      return;
    }
    publish({
      stages,
      active,
      mode,
      label,
      onSelect: (s) => onSelectRef.current?.(s),
    });
    return () => publish(null);
  }, [stages, active, mode, label, publish]);
}
