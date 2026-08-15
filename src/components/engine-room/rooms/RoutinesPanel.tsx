// PC-08: Routines, productized. The platform's background pg_cron jobs,
// shown as plain-language routines with a real on/off per workspace.
// Placement per Fable ruling (2026-07-10): inside Safety, not a new room --
// the toggle is a standing grant of unattended permission, Safety's own
// question ("what is it allowed to do?"); the last-run receipt is
// supporting evidence for that call, not the point of the row.
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listRoutines, toggleRoutine, type RoutineRow } from "@/lib/routines.functions";
import { EmptyRow, ErrorRetry, PanelPending } from "../RoomDetail";

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

function RoutineToggle({
  on,
  onToggle,
  disabled,
  name,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  name: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${on ? "Turn off" : "Turn on"} ${name}`}
      aria-busy={disabled || undefined}
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: 34,
        height: 19,
        borderRadius: 99,
        background: on ? "var(--moss, #7fbf8e)" : "var(--surface-2, #1c1c1e)",
        border: "1px solid var(--hairline)",
        position: "relative",
        flexShrink: 0,
        transition: "background var(--dur-base, 160ms)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 16 : 2,
          width: 13,
          height: 13,
          borderRadius: 99,
          background: "var(--canvas, #0a0a0c)",
          transition: "left var(--dur-base, 160ms)",
        }}
      />
    </button>
  );
}

function RoutineRowView({ routine }: { routine: RoutineRow }) {
  const qc = useQueryClient();
  const fToggle = useServerFn(toggleRoutine);
  const mut = useMutation({
    mutationFn: (enabled: boolean) => fToggle({ data: { routineId: routine.id, enabled } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["routines"] }),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{routine.name}</span>
          <span style={{ color: "var(--text-faint)" }}>{routine.castOwner}</span>
        </div>
        <p style={{ color: "var(--text-muted)", margin: "3px 0 0" }}>{routine.whatItDoes}</p>
        <p
          style={{
            color: "var(--text-faint)",
            margin: "4px 0 0",
            fontFamily: "var(--font-mono)",
          }}
        >
          Last run {relativeTime(routine.lastRunAt, () => "not yet tracked")} · Next run{" "}
          {nextRunLabel(routine.nextRunAt)}
        </p>
        {mut.isError ? (
          <p
            role="alert"
            style={{
              color: "var(--madder-bright)",
              margin: "4px 0 0",
            }}
          >
            The change did not save. Flip the switch again to retry.
          </p>
        ) : null}
      </div>
      <RoutineToggle
        on={routine.enabled}
        disabled={mut.isPending}
        name={routine.name}
        onToggle={() => mut.mutate(!routine.enabled)}
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
      style={{
        borderRadius: 12,
        border: "1px solid var(--hairline)",
        overflow: "hidden",
      }}
    >
      {routines.map((r) => (
        <RoutineRowView key={r.id} routine={r} />
      ))}
    </div>
  );
}
