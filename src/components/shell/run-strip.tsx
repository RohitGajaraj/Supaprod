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

export type RunStripSpec = {
  stages: RunStage[];
  active: AgentStation;
  onSelect: (station: AgentStation) => void;
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
 * The strip's labels, which are NOT `AGENT_STATIONS[station].name`.
 *
 * That map calls the first station "Sense", which is the internal name for the
 * station in the agent mesh. The product calls it Discover: it is what the
 * prototype's strip says, what the founder said, and what the route is
 * (`/discover`). The other six agree with the catalog, and are listed anyway so
 * the strip's vocabulary is readable in one place rather than being six
 * lookups and one exception.
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
    ? JSON.stringify([spec.active, spec.stages.map((s) => [s.station, s.state, s.note])])
    : null;

  // `spec` is deliberately not a dependency: `signature` is its value identity,
  // and `onSelect` is read through a ref, so the effect re-runs exactly when the
  // strip's content actually changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stages = React.useMemo(() => spec?.stages ?? null, [signature]);
  const active = spec?.active ?? null;

  React.useEffect(() => {
    if (!stages || !active) {
      publish(null);
      return;
    }
    publish({
      stages,
      active,
      onSelect: (s) => onSelectRef.current?.(s),
    });
    return () => publish(null);
  }, [stages, active, publish]);
}
