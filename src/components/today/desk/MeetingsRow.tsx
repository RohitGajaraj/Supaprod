// The Desk's meetings line (PM Desk): a thin row, deliberately NOT a card —
// three identical cards in a column is the slop tell. One glance: how many
// today, what's next, one click into the calendar. Collapses to nothing on a
// meeting-free day (calm front).
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { getTodayEvents } from "@/lib/calendar.functions";

type EventRow = { id: string; title: string; start_at: string };

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export function MeetingsRow() {
  const navigate = useNavigate();
  const fEvents = useServerFn(getTodayEvents);
  const events = useQuery({ queryKey: ["calendar-today-events"], queryFn: () => fEvents() });

  if (events.isPending) return null;

  if (events.isError) {
    return (
      <div
        className="flex items-center"
        style={{ gap: 8, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}
      >
        <span style={{ ...mono, color: "var(--text-subtle)" }}>Meetings</span>
        <span style={{ fontSize: 12.5, color: "var(--madder)" }}>didn't load</span>
        <Button variant="tertiary" onClick={() => void events.refetch()} style={{ fontSize: 12 }}>
          Retry
        </Button>
      </div>
    );
  }

  const rows = ((events.data?.events ?? []) as EventRow[]).filter((e) => e.start_at);
  if (rows.length === 0) return null;
  const next = rows.find((e) => Date.parse(e.start_at) >= Date.now()) ?? null;

  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/brain", search: { tab: "calendar" } as never })}
      className="loom-press flex w-full items-center text-left outline-none transition-colors hover:[background:var(--raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{
        gap: 10,
        padding: "10px 6px 8px",
        borderTop: "1px solid var(--hairline)",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "none",
        borderRadius: "var(--radius-control)",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span style={{ ...mono, color: "var(--text-subtle)", flexShrink: 0 }}>Meetings</span>
      <span className="min-w-0 flex-1 truncate" style={{ fontSize: 13, color: "var(--text-body)" }}>
        {rows.length} today
        {next
          ? ` · next ${new Date(next.start_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })} ${next.title.slice(0, 28)}`
          : " · all done"}
      </span>
      <span aria-hidden="true" style={{ color: "var(--text-subtle)", fontSize: 13, flexShrink: 0 }}>
        →
      </span>
    </button>
  );
}
