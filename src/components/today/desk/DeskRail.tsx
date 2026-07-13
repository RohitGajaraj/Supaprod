// The Desk (PM Desk, founder goal 2026-07-09): the PM's daily tools as an
// EVIDENT zone on Today's right rail, below the aurora card — replacing the
// retired strips that hid tools behind what read as information rows. The
// composition deliberately varies (hero card · standard card · input card ·
// thin rows) so the zone reads designed, not templated: Focus block (the
// hero), Tasks today, Capture, then the Meetings and Stakeholders lines.
import * as React from "react";
import { lazy, Suspense, useState } from "react";
import { FocusCard } from "./FocusCard";
import { TasksCard } from "./TasksCard";
import { CaptureCard } from "./CaptureCard";
import { NotepadCard } from "./NotepadCard";
import { MeetingsRow } from "./MeetingsRow";
import { StatusRow } from "./StatusRow";

// CalendarPanel was orphaned (mounted nowhere) after meetings left Brain;
// the full calendar now has a home here in the Desk (founder homelessness
// audit 2026-07-13). Lazy so its weight never loads until the Desk opens.
const CalendarPanel = lazy(() =>
  import("@/components/knowledge/CalendarPanel").then((m) => ({ default: m.CalendarPanel })),
);

function DeskCalendar() {
  const [meetingId, setMeetingId] = useState<string | undefined>(undefined);
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <h3
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
          margin: 0,
        }}
      >
        Calendar
      </h3>
      <Suspense
        fallback={<div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading calendar…</div>}
      >
        <CalendarPanel meetingId={meetingId} onMeetingChange={setMeetingId} />
      </Suspense>
    </div>
  );
}

export function DeskRail({ bare, compact }: { bare?: boolean; compact?: boolean }) {
  return (
    <section aria-label="Your desk" className="flex flex-col" style={{ gap: 12 }}>
      {/* PC-32 block 5: inside the Desk slide-over the SlideOver header already
          names the zone, so `bare` skips the duplicate section header. */}
      {!bare ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-subtle)",
              margin: 0,
            }}
          >
            Your desk
          </h2>
          <div style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }} />
        </div>
      ) : null}
      <FocusCard />
      <TasksCard />
      <CaptureCard />
      {/* compact = the evident Today right rail: only the core daily trio
          (Focus · Tasks · Capture). The full desk (notes, meetings, status)
          stays one door away in the Desk slide-over so the rail never
          overwhelms. */}
      {!compact ? (
        <>
          <NotepadCard />
          <div className="flex flex-col" style={{ gap: 2 }}>
            <MeetingsRow />
            <StatusRow />
          </div>
          <DeskCalendar />
        </>
      ) : null}
    </section>
  );
}
