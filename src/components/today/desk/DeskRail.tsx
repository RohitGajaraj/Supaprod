// The Desk (PM Desk, founder goal 2026-07-09): the PM's daily tools as an
// EVIDENT zone on Today's right rail, below the aurora card — replacing the
// retired strips that hid tools behind what read as information rows. The
// composition deliberately varies (hero card · standard card · input card ·
// thin rows) so the zone reads designed, not templated: Focus block (the
// hero), Tasks today, Capture, then the Meetings and Stakeholders lines.
import * as React from "react";
import { FocusCard } from "./FocusCard";
import { TasksCard } from "./TasksCard";
import { CaptureCard } from "./CaptureCard";
import { NotepadCard } from "./NotepadCard";
import { MeetingsRow } from "./MeetingsRow";
import { StatusRow } from "./StatusRow";

export function DeskRail({ bare }: { bare?: boolean }) {
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
      <NotepadCard />
      <div className="flex flex-col" style={{ gap: 2 }}>
        <MeetingsRow />
        <StatusRow />
      </div>
    </section>
  );
}
