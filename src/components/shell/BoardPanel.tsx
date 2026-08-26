/**
 * The board, summoned. One click to see every run, from anywhere, without
 * losing the page you were on.
 *
 * FOUNDER RULING 2026-07-30: "somewhere we need to give this dashboard sort of
 * mechanism... at one click you should be able to see what agent is running,
 * what is the status, all those things", opened from a button in the rail foot
 * beside the theme and collapse controls.
 *
 * AND THE CORRECTION THAT SHAPED IT, which is the reason this file is thin:
 * "for the dashboard it should not still render the same what agent is working
 * which is there displayed on top, instead here it should be something like a
 * board which we already have in the run section, so either duplicating the
 * same or enhancing that is required."
 *
 * So this panel adds NO content of its own. It renders `RunBoard`, the exact
 * component /runs draws, off the exact same two query keys. Three consequences,
 * all of them the point:
 *   - No second answer. Two views of one truth is how two views disagree, and
 *     a panel that recomputed "what is running" could contradict the header
 *     six pixels above it.
 *   - No repetition of the header. The live line says who is working; the
 *     board says where all the work stands. Different questions.
 *   - Enhancing the board enhances both homes at once, which is exactly the
 *     option the founder asked for.
 *
 * WHY A WIDE OVERLAY AND NOT A SIDE PANE. Ask is a right-hand pane because a
 * conversation is a column. This is five columns; at a pane's width it would
 * reflow to a list, and a list of runs is what /runs already is. The board's
 * shape IS its value, so the surface has to be wide enough to keep it.
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listStudioSessions } from "@/lib/studio.functions";
import { listMissions } from "@/lib/missions.functions";
import { stepProgress, type StepProgress } from "@/components/runs/step-progress";
import { RunBoard } from "@/components/runs/RunBoard";
import { runState } from "@/components/runs/run-state";
import { ReadFailed, Reading } from "@/components/meridian/surface-parts";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function BoardPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const fList = useServerFn(listStudioSessions);
  const fMissions = useServerFn(listMissions);
  const [showAll, setShowAll] = React.useState(false);

  // THE BOARD'S OWN KEYS, so this shares one fetch with /runs and with the
  // seven-stage strip rather than opening a third read of the same rows.
  // `enabled: open` keeps a closed panel free: a control that is on every page
  // must cost nothing until it is used.
  const sessions = useQuery({
    queryKey: ["studio-sessions", false],
    queryFn: () => fList({ data: { includeArchived: false } }),
    enabled: open,
    refetchInterval: open ? 5000 : false,
  });
  const rows = React.useMemo(() => sessions.data?.sessions ?? [], [sessions.data]);
  const live = React.useMemo(
    () => rows.filter((s) => ["working", "queued"].includes(runState(s))).length,
    [rows],
  );
  const plan = useQuery({
    queryKey: ["build", "plan-progress"],
    queryFn: () => fMissions({ data: {} }),
    enabled: open && rows.length > 0,
    refetchInterval: open && live > 0 ? 5000 : false,
  });
  const progressById = React.useMemo(() => {
    const map = new Map<string, StepProgress>();
    for (const m of plan.data?.missions ?? []) map.set(m.id, stepProgress(m.steps));
    return map;
  }, [plan.data]);

  /**
   * FOCUS, which this declared and never delivered. Same defect as the shortcut
   * sheet and found in the same audit: `aria-modal="true"` on an overlay that
   * let Tab walk into the page behind it. This panel renders as the LAST child
   * of `.sp-app`, after the rail and the entire work region, so tabbing forward
   * from the button that opened it crossed the whole page before arriving.
   */
  const trap = useFocusTrap(open);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reopening on a different day should not reopen yesterday's expansion.
  React.useEffect(() => {
    if (!open) setShowAll(false);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="sp-boardpanel"
      role="dialog"
      aria-modal="true"
      aria-label="Every run"
      ref={trap}
    >
      {/* The scrim closes. A person who opened this to glance should be able to
        dismiss it without hunting for the control that did it. */}
      <button
        type="button"
        className="sp-boardpanel-scrim"
        aria-label="Close the board"
        data-autofocus
        onClick={onClose}
      />
      <div className="sp-boardpanel-sheet">
        <div className="sp-boardpanel-head">
          <span className="sp-boardpanel-title">Every run</span>
          <span className="sp-boardpanel-hint">Esc closes</span>
        </div>
        <div className="sp-boardpanel-body">
          {sessions.isLoading ? (
            <Reading>Reading the record.</Reading>
          ) : sessions.isError ? (
            <ReadFailed onRetry={() => void sessions.refetch()}>
              The runs did not load, so this board is not the whole picture.
            </ReadFailed>
          ) : (
            <RunBoard
              rows={rows}
              progressById={progressById}
              showAll={showAll}
              onShowAll={() => setShowAll((v) => !v)}
              // Opening a run is leaving the panel, so the panel closes. A
              // dialog left open behind a navigation is a dialog the person has
              // to dismiss twice.
              onOpen={(missionId) => {
                onClose();
                void navigate({ to: "/runs/$missionId", params: { missionId } });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
