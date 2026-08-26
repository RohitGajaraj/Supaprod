/**
 * Run Timeline — Live display of where the agent is and what it decided
 *
 * Shows the 7-station progression in real time with readable action descriptions.
 * Updates via WebSocket/SSE as `stage_events` arrive, no polling.
 *
 * Goal: "I can watch my decision ship without clicking"
 * User value: Complete transparency + no manual refresh needed
 */

import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type StageEvent = Database["public"]["Tables"]["stage_events"]["Row"];

const STATION_DISPLAY_NAMES: Record<string, string> = {
  sense: "Sense",
  discover: "Discover",
  decide: "Decide",
  define: "Define",
  design: "Design",
  build: "Build",
  ship: "Ship",
  learn: "Learn",
};

const STATION_COLORS: Record<string, string> = {
  sense: "bg-blue-500",
  discover: "bg-purple-500",
  decide: "bg-emerald-500",
  define: "bg-amber-500",
  design: "bg-rose-500",
  build: "bg-indigo-500",
  ship: "bg-cyan-500",
  learn: "bg-green-500",
};

interface TimelineEvent {
  stationName: string;
  displayName: string;
  timestamp: number;
  readableTime: string;
  action: string;
  color: string;
}

interface RunTimelineProps {
  trackId: string;
  events?: StageEvent[];
  isLive?: boolean;
}

export function RunTimeline({ trackId, events = [], isLive = false }: RunTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Transform stage_events into timeline display format
  useEffect(() => {
    if (!events || events.length === 0) {
      setTimelineEvents([]);
      return;
    }

    const transformed = events.map((event) => {
      const createdAt = new Date(event.created_at).getTime();
      const now = new Date().getTime();
      const elapsed = Math.max(0, (now - createdAt) / 1000);

      let timeString: string;
      if (elapsed < 60) {
        timeString = `${Math.round(elapsed)}s ago`;
      } else {
        timeString = `${Math.round(elapsed / 60)}m ago`;
      }

      // Human-readable action description
      const action =
        event.actor === "system"
          ? `Agent entered ${STATION_DISPLAY_NAMES[event.station] || event.station}`
          : `Held at ${STATION_DISPLAY_NAMES[event.station] || event.station}`;

      return {
        stationName: event.station,
        displayName: STATION_DISPLAY_NAMES[event.station] || event.station,
        timestamp: createdAt,
        readableTime: timeString,
        action,
        color: STATION_COLORS[event.station] || "bg-zinc-500",
      };
    });

    // Show last 5 events, most recent first
    setTimelineEvents(transformed.reverse().slice(0, 5).reverse());
  }, [events]);

  if (timelineEvents.length === 0) {
    return (
      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
        <p className="text-sm text-zinc-500">Waiting for agent to start…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Run Timeline</h3>
        {isLive && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-500">Live</span>
          </div>
        )}
      </div>

      {/* Events list */}
      <div className="space-y-3 border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
        {timelineEvents.map((event, idx) => (
          <div key={`${event.timestamp}-${idx}`} className="flex gap-3">
            {/* Timeline dot */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${event.color}`} title={event.displayName} />
              {idx < timelineEvents.length - 1 && <div className="w-0.5 h-6 bg-zinc-700" />}
            </div>

            {/* Event details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-medium text-white truncate">{event.action}</p>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{event.readableTime}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key message */}
      <p className="text-xs text-zinc-500 px-1">
        Station progression shows where your agent is working right now. All decisions are automatic
        once started.
      </p>
    </div>
  );
}
