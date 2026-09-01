import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import type { PlanStepState } from "@/components/meridian/PlanCard";
import type { RunStage, RunStageState, RunStripSpec } from "@/components/shell/run-strip";
import { runPosition } from "@/components/track/run-position";

/**
 * ── THE STRIP ON A RUN SCREEN NOW DESCRIBES THE RUN ───────────────────────
 *
 * ── WHAT IT DESCRIBED BEFORE, MEASURED ────────────────────────────────────
 * Photographed on `/track/ce846e9b` at 1512px. The run's own header said
 * **"Now: Build"**. The 97px strip across the top of the same screen said:
 *
 *   01 Discover  89+ runs waiting on you
 *   05 Build      6+ runs waiting on you
 *   07 Learn      6 outcomes to record
 *
 * and every one of the seven chips carried `data-on="false"` -- including
 * Build. Those counts are workspace-wide. So a person watching ONE run was
 * given a permanent band reporting a different subject, with the chip naming
 * the station they were actually looking at left unlit.
 *
 * `RunStripSpec` and `usePublishRunStrip` exist for exactly this and the run
 * surface published nothing, so it fell through to `WorkspaceSpine`. The
 * strip's own header states the intended behaviour -- *"with that run's own
 * seven stages"* -- and no run had ever supplied them.
 *
 * This is §0.5's connectedness complaint in one element: *"Each of those links
 * exists in the data and appears on no surface."*
 *
 * ── IT REMOVES A CONTROL RATHER THAN ADDING ONE ───────────────────────────
 * The run screen already carried THREE station displays: this strip, the
 * `TrackChain` list in the pane, and `ArtifactPane`'s own row of seven station
 * tabs. Publishing `onSelect` makes the strip the run's real tab bar, driving
 * the same `paneStation` those tabs drive, so the three converge on one
 * control instead of competing.
 *
 * AND IT IS THE ONE INTERACTION R-01 PERMITS. *"Stations are NEVER
 * navigation"* -- and `RunStripSpec.onSelect`'s own contract says why this is
 * not that: *"`mode: "tab"` supplies it, because picking a stage there swaps
 * the work region and you never leave the run."* Nothing here navigates. The
 * workspace strip still supplies no handler and stays a readout.
 */

/**
 * `PlanStepState` -> `RunStageState`, and the two vocabularies are genuinely
 * different rather than misaligned.
 *
 * `runPosition` speaks `PlanStepState` because it feeds `RunMap` and
 * `StepMeter`, which are plan-shaped. The strip speaks `RunStageState`, which
 * is tuned to what a CHIP can say. Every mapping below is a real judgment:
 *
 *   here / active     -> working   the run is standing on this station now
 *   needs-approval    -> gate      a person is required, which is the one
 *                                  state that earns orchid
 *   held              -> held      stopped, and not on you
 *   failed            -> failed
 *   done              -> done
 *   skipped           -> quiet     a waived station is a DECISION on the
 *                                  record, not a failure and not progress. It
 *                                  keeps its chip (`runPosition` unions the
 *                                  waivers in on purpose) and says so in its
 *                                  note rather than in a colour.
 *   pending           -> quiet     not reached. `next` is reserved for the
 *                                  immediately upcoming one, assigned below,
 *                                  because "next" on all four remaining chips
 *                                  would mean nothing.
 */
const STATE: Record<PlanStepState, RunStageState> = {
  here: "working",
  active: "working",
  "needs-approval": "gate",
  held: "held",
  failed: "failed",
  done: "done",
  skipped: "quiet",
  pending: "quiet",
};

/**
 * The chip's second line, in the run's words.
 *
 * `RunStage.note`'s contract is explicit: *"Never a status word the state
 * already carries, and never invented, an unknown stage says so."* So this
 * never writes "working" or "done" -- the state drives the dot and the ink --
 * and it never guesses. A waived station carries the reason it was waived,
 * which is the one fact about it that is not visible from its position.
 */
function noteFor(stop: {
  state: PlanStepState;
  outcome?: string;
  waivedReason?: string | null;
}): string {
  if (stop.waivedReason) return `skipped: ${stop.waivedReason}`;
  return stop.outcome ?? "";
}

/**
 * Build the strip for one run. `null` when there is no track yet, which is what
 * `usePublishRunStrip` takes to mean "do not cover the workspace spine" -- so a
 * run whose read has not answered shows the default rather than an empty band.
 */
export function runStripSpec(
  track: Parameters<typeof runPosition>[0] | null,
  walking: boolean,
  active: string | null,
  onSelect: (station: AgentStation) => void,
  /**
   * WHAT CAME OF EACH STATION, passed through to `runPosition` untouched.
   *
   * Last and optional so the nine existing call sites keep working with four
   * arguments -- and, more importantly, so a caller that has not read the work
   * gets stages with no note rather than a fabricated one. `noteFor` below
   * returns "" for a stop with no outcome, which is what shipped for months and
   * is still the correct answer when nobody has looked.
   */
  outcomes?: Parameters<typeof runPosition>[2],
): RunStripSpec | null {
  if (!track) return null;
  const { stops } = runPosition(track, walking, outcomes);
  if (stops.length === 0) return null;

  const stages: RunStage[] = stops.map((s) => ({
    station: s.station,
    state: STATE[s.state],
    note: noteFor(s as { state: PlanStepState; outcome?: string; waivedReason?: string | null }),
  }));

  /*
   * ONE `next`, AND ONLY WHEN THE RUN IS STILL OPEN. The first unreached
   * station after the one it is standing on answers "what is it about to do",
   * which the goal asks for by name. On a settled run there is no next, and
   * marking one would promise work that will not happen.
   */
  if (track.status === "open") {
    const here = stages.findIndex((s) => s.station === track.station);
    const next = stages.findIndex((s, i) => i > here && s.state === "quiet");
    if (next > -1) stages[next] = { ...stages[next], state: "next" };
  }

  return {
    stages,
    active: (active as AgentStation | null) ?? track.station,
    onSelect,
    mode: "tab",
    label: `The seven stages of this run, and where it is`,
  };
}

/** Exported for the test, which asserts every station name resolves. */
export const STATION_NAMES = AGENT_STATIONS;
