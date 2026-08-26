/**
 * 60-SECOND FIRST-USE DEMONSTRATION
 *
 * Shows autonomous 7-station loop progression with zero human interaction.
 * Auto-plays on page load. Repeats. Clean, professional, shows the core value:
 * "One sentence in. Everything else automatic."
 *
 * Stations animate left-to-right with real timing (~3s per major station).
 * Each station shows: (1) agent working, (2) output created, (3) handoff to next.
 * Total animation: ~35-40 seconds, loops every 50s.
 */

import { useEffect, useState } from "react";

type StationState = "pending" | "working" | "complete";

interface StationProgress {
  name: string;
  displayName: string;
  state: StationState;
  progress: number; // 0-100
}

const STATIONS = [
  { name: "sense", displayName: "Sense" },
  { name: "discover", displayName: "Discover" },
  { name: "decide", displayName: "Decide" },
  { name: "define", displayName: "Define" },
  { name: "design", displayName: "Design" },
  { name: "build", displayName: "Build" },
  { name: "ship", displayName: "Ship" },
];

const STATION_DURATION = 3000; // 3 seconds per station
const INTER_STATION_DELAY = 200; // 200ms between stations
const TOTAL_CYCLE = 50000; // Full loop every 50 seconds

export function HeroLoopDemo() {
  const [stations, setStations] = useState<StationProgress[]>(
    STATIONS.map((s) => ({
      name: s.name,
      displayName: s.displayName,
      state: "pending",
      progress: 0,
    }))
  );

  const [cycleTime, setCycleTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCycleTime((t) => (t + 50) % TOTAL_CYCLE);
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Update station states based on cycle time
  useEffect(() => {
    const newStations = STATIONS.map((_, index) => {
      const stationStart = index * (STATION_DURATION + INTER_STATION_DELAY);
      const stationEnd = stationStart + STATION_DURATION;

      let state: StationState = "pending";
      let progress = 0;

      if (cycleTime >= stationStart) {
        if (cycleTime >= stationEnd) {
          state = "complete";
          progress = 100;
        } else {
          state = "working";
          progress = ((cycleTime - stationStart) / STATION_DURATION) * 100;
        }
      }

      return {
        name: STATIONS[index].name,
        displayName: STATIONS[index].displayName,
        state,
        progress,
      };
    });

    setStations(newStations);
  }, [cycleTime]);

  const firstActiveIndex = stations.findIndex((s) => s.state !== "complete");
  const completedCount = stations.filter((s) => s.state === "complete").length;

  return (
    <div className="mt-12 rounded-lg border border-zinc-800 bg-zinc-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-zinc-400 mb-2">AUTONOMOUS EXECUTION</p>
        <p className="text-lg font-medium text-white mb-1">One sentence. Seven stations. Fully automatic.</p>
        <p className="text-sm text-zinc-500">No clicks mid-run. No human intervention. Agent decides, builds, ships.</p>
      </div>

      {/* Input */}
      <div className="mb-8">
        <div className="inline-block bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300">
          💬 &quot;Improve onboarding flow based on user feedback&quot;
        </div>
      </div>

      {/* Station Progress Bar */}
      <div className="mb-8">
        <div className="flex gap-1 mb-4">
          {stations.map((station, idx) => (
            <div
              key={station.name}
              className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-200 ${
                  station.state === "complete"
                    ? "bg-emerald-500"
                    : station.state === "working"
                      ? "bg-blue-500"
                      : "bg-zinc-700"
                }`}
                style={{
                  width: `${station.progress}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Station Names */}
        <div className="flex gap-1 text-xs text-zinc-500">
          {stations.map((station) => (
            <div key={station.name} className="flex-1 text-center truncate">
              {station.displayName}
            </div>
          ))}
        </div>
      </div>

      {/* Status Line */}
      <div className="mb-8 h-6">
        <p className="text-sm text-zinc-400">
          {completedCount === STATIONS.length ? (
            <span className="text-emerald-400">✓ Complete in ~35 seconds • Restarting…</span>
          ) : firstActiveIndex >= 0 ? (
            <span className="text-blue-400">
              ⟳ At {stations[firstActiveIndex].displayName}…{" "}
              <span className="text-zinc-500">
                ({completedCount}/{STATIONS.length} stations done)
              </span>
            </span>
          ) : (
            <span className="text-zinc-500">Ready to start…</span>
          )}
        </p>
      </div>

      {/* Output Preview */}
      <div className="rounded bg-zinc-900 border border-zinc-700 p-4">
        <p className="text-xs text-zinc-500 mb-2">OUTPUT</p>
        <div className="space-y-2">
          {completedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-500"></span>
              <span>Spec drafted & reviewed</span>
            </div>
          )}
          {completedCount > 1 && (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-500"></span>
              <span>Design prototype created</span>
            </div>
          )}
          {completedCount > 3 && (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-500"></span>
              <span>Code changes staged</span>
            </div>
          )}
          {completedCount > 5 && (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-500"></span>
              <span>Deployed to production</span>
            </div>
          )}
          {completedCount === STATIONS.length && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
              <span>→ Outcome being measured</span>
            </div>
          )}
          {completedCount === 0 && (
            <div className="text-sm text-zinc-500 py-2">Starting agent work…</div>
          )}
        </div>
      </div>

      {/* Key Message */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          Every station is an agent making real decisions, creating real outputs, handed off by evidence, not by guess.
          You set the boundaries once. The loop handles the rest.
        </p>
      </div>
    </div>
  );
}
