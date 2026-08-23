// PC-08: Routines, productized. The platform's background pg_cron jobs,
// shown as plain-language routines with a real on/off per workspace.
// Placement per Fable ruling (2026-07-10): inside Safety, not a new room --
// the toggle is a standing grant of permission to run with nobody watching,
// which is Safety's own question ("what is it allowed to do?"); the last-run
// record is supporting evidence for that call, not the point of the row.
//
// 2026-08-15: PORTED TO MERIDIAN. The switch stopped being green, and that is
// the one change that is not a re-skin: green reports an OUTCOME in this system
// and a routine being switched on is a SETTING, drawn one inch from a last-run
// line where green would mean the run succeeded. The argument, and the token it
// moved to, are in EngineChrome.tsx beside `Toggle`.
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listRoutines, toggleRoutine, type RoutineRow } from "@/lib/routines.functions";
import { EmptyRow, ErrorRetry, PanelPending } from "../RoomDetail";
import { Toggle } from "@/components/meridian/surface-parts";

function relativeTime(iso: string | null, futureLabel: (d: Date) => string): string {
  if (!iso) return "not yet tracked";
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  if (diffMs >= 0) return futureLabel(d);
  const mins = Math.round(-diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function nextRunLabel(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  if (mins < 1) return "any moment";
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function RoutineRowView({ routine }: { routine: RoutineRow }) {
  const qc = useQueryClient();
  const fToggle = useServerFn(toggleRoutine);
  const mut = useMutation({
    mutationFn: (enabled: boolean) => fToggle({ data: { routineId: routine.id, enabled } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["routines"] }),
  });

  return (
    <div className="flex items-center gap-mrd-5 border-b border-mrd-line-soft px-mrd-5 py-mrd-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-mrd-3">
          <span className="text-mrd-base font-medium text-mrd-ink">{routine.name}</span>
          <span className="text-mrd-small text-mrd-faint">{routine.castOwner}</span>
        </div>
        <p className="mt-mrd-1 text-mrd-label leading-mrd-snug text-mrd-mute">{routine.whatItDoes}</p>
        {/* Mono, and it earns it: both halves of this line are timestamps. */}
        <p className="font-mrd-mono mt-mrd-2 text-mrd-data text-mrd-faint tabular-nums">
          Last run {relativeTime(routine.lastRunAt, () => "not yet tracked")} · Next run{" "}
          {nextRunLabel(routine.nextRunAt)}
        </p>
        {mut.isError ? (
          /* `role="alert"` rather than status: this is trouble the person did
             not choose, arriving after they looked away from the control. Red
             reports the outcome of the write, which is the only thing red means
             in this system. */
          <p role="alert" className="mt-mrd-2 text-mrd-small text-mrd-fail">
            The change did not save. Flip the switch again to retry.
          </p>
        ) : null}
      </div>
      <Toggle
        checked={routine.enabled}
        disabled={mut.isPending}
        busy={mut.isPending}
        label={`${routine.enabled ? "Turn off" : "Turn on"} ${routine.name}`}
        onChange={(next) => mut.mutate(next)}
      />
    </div>
  );
}

export function RoutinesPanel() {
  const fList = useServerFn(listRoutines);
  const q = useQuery({ queryKey: ["routines"], queryFn: () => fList() });

  if (q.isError) {
    return <ErrorRetry message="Routines did not load." onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading) return <PanelPending />;
  const routines = q.data ?? [];
  if (routines.length === 0) {
    return (
      <EmptyRow message="No routines registered yet. The platform's background routines appear here as they come online, each with its own on and off switch." />
    );
  }
  return (
    <div
      data-mrd=""
      className="overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet"
    >
      {routines.map((r) => (
        <RoutineRowView key={r.id} routine={r} />
      ))}
    </div>
  );
}
