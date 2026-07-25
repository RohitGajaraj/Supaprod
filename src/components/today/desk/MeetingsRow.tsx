// The Desk's Calendar/Meetings entries (PM Desk): a thin row, deliberately NOT
// a card — three identical cards in a column is the slop tell. One glance: how
// many today, what's next; one click expands today's calendar in place. The
// calendar moved OUT of Brain and onto the Desk (2026-07-11 revamp), so this
// row no longer navigates to the retired Brain calendar tab. Collapses to
// nothing on a meeting-free day (calm front).
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/obsidian";
import { getTodayEvents } from "@/lib/calendar.functions";

type EventRow = { id: string; title: string; start_at: string };

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MeetingsRow() {
  const fEvents = useServerFn(getTodayEvents);
  const events = useQuery({ queryKey: ["calendar-today-events"], queryFn: () => fEvents() });
  const [open, setOpen] = React.useState(false);

  if (events.isPending) return null;

  if (events.isError) {
    return (
      <div
        className="flex items-center"
        style={{ gap: 8, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}
      >
        <span className="text-label-12" style={{ ...mono, color: "var(--text-subtle)" }}>Meetings</span>
        <span className="text-label-13" style={{ color: "var(--madder)" }}>didn't load</span>
        <Button variant="tertiary" className="text-label-12" onClick={() => void events.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const rows = ((events.data?.events ?? []) as EventRow[]).filter((e) => e.start_at);
  if (rows.length === 0) return null;
  const next = rows.find((e) => Date.parse(e.start_at) >= Date.now()) ?? null;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Hide today's calendar" : "Show today's calendar"}
        onClick={() => setOpen((v) => !v)}
        // Background rides classes so the hover variant wins (inline beats classes).
        className="loom-press flex w-full items-center text-left outline-none transition-colors [background:transparent] hover:[background:var(--raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          gap: 10,
          padding: "10px 6px 8px",
          borderTop: "1px solid var(--hairline)",
          borderLeft: "none",
          borderRight: "none",
          borderBottom: "none",
          borderRadius: "var(--radius-control)",
          cursor: "pointer",
        }}
      >
        <span className="text-label-12" style={{ ...mono, color: "var(--text-subtle)", flexShrink: 0 }}>Meetings</span>
        <span
          className="min-w-0 flex-1 truncate text-label-13"
          style={{ color: "var(--text-body)" }}
        >
          {rows.length} today
          {next ? ` · next ${fmtTime(next.start_at)} ${next.title.slice(0, 28)}` : " · all done"}
        </span>
        <span
          className="text-label-13"
          aria-hidden="true"
          style={{ color: "var(--text-subtle)", flexShrink: 0 }}
        >
          {open ? "↑" : "↓"}
        </span>
      </button>
      {open ? (
        <ul
          aria-label="Today's calendar"
          style={{ listStyle: "none", margin: 0, padding: "2px 6px 8px" }}
        >
          {rows.map((e) => {
            const past = Date.parse(e.start_at) < Date.now();
            return (
              <li
                key={e.id}
                className="flex items-baseline"
                style={{ gap: 10, padding: "4px 0", minWidth: 0 }}
              >
                <span
                  className="text-label-12"
                  style={{
                    ...mono,
                    color: past ? "var(--text-faint)" : "var(--text-subtle)",
                    flexShrink: 0,
                    minWidth: 62,
                  }}
                >
                  {fmtTime(e.start_at)}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-label-13"
                  style={{
                    color: past ? "var(--text-faint)" : "var(--text-body)",
                  }}
                >
                  {e.title}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
