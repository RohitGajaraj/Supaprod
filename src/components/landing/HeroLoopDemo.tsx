/**
 * THE HERO LOOP STRIP: an ILLUSTRATION of the seven stations, on a timer.
 *
 * WHAT IT IS AND IS NOT, stated first because this header used to say the
 * opposite and the copy below was written from it. It read "shows autonomous
 * 7-station loop progression with zero human interaction" and "One sentence in.
 * Everything else automatic."
 *
 * IT IS NOT A LIVE RUN. The bars advance on `setInterval(..., 50)` against
 * `TOTAL_CYCLE`, with no database behind them, which is ordinary and honest for
 * a landing animation. S4 confirmed it renders identically on a page booted
 * against a database that does not exist (S4-039).
 *
 * SO THE HEADER MUST NOT DESCRIBE IT AS AUTONOMY, because the copy inside this
 * component gets written from this paragraph. "Zero human interaction" is the
 * wording of R-18, the acceptance the whole build exists to reach and which the
 * honest query still returns 0 for, and it directly contradicts TrustClose's
 * promise on the same page that merge can never skip your approval. The
 * capability sentences were corrected on 2026-08-27; see the note beside them.
 *
 * The animation itself stays. S4 was explicit that an illustrative animation is
 * ordinary and every product ships one, and that what failed was the two
 * capability sentences and the station names, not the craft.
 *
 * Stations animate left to right, about 3s each, looping every 50s. The names
 * are DERIVED from AGENT_STATION_ORDER rather than listed here; see the note on
 * STATIONS for the three separate defects that came from listing them locally.
 */

import { useEffect, useState } from "react";
import { AGENT_STATIONS, AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

type StationState = "pending" | "working" | "complete";

interface StationProgress {
  name: string;
  displayName: string;
  state: StationState;
  progress: number; // 0-100
}

/**
 * DERIVED FROM THE CONSTANT THAT DEFINES THE LOOP, so the strip cannot drift
 * from it again. Ruled by S4 (S4-037, S4-039) after measuring the served HTML,
 * and this local array was wrong in three ways at once on the first screen a
 * stranger sees:
 *
 *   IT INVENTED A STATION. `discover` is not in AGENT_STATION_ORDER. Sense and
 *     Discover are the SAME step under its internal id and its surface name, so
 *     the strip listed it twice and a stranger counting the loop counted eight.
 *   IT PUT TWO INTERNAL SLUGS ON THE MOST PUBLIC SURFACE THERE IS. "Sense" and
 *     "Define". Operating model section 12 names those two specifically and says
 *     they never appear on a surface; the founder ruling of 2026-08-01 beside
 *     `sense` in agent-vocabulary.ts says the first station is called Discover
 *     "on every surface, with no exceptions".
 *   IT DROPPED LEARN. That is the station that grades the outcome against the
 *     forecast, which README and CLAUDE.md both call the moat, and the hero copy
 *     three lines above this strip says "grades it. guides the next call."
 *
 * The same page already rendered the correct seven further down, so a visitor
 * scrolling one page met two vocabularies and the wrong one first.
 *
 * Reading AGENT_STATIONS[slug].name rather than hardcoding the display strings
 * is the half that makes this durable: the map carries the founder's rulings on
 * what each station is CALLED, so a future rename lands here for free.
 */
const STATIONS = AGENT_STATION_ORDER.map((slug) => ({
  name: slug,
  displayName: AGENT_STATIONS[slug].name,
}));

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
    })),
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
    <div className="mt-12 rounded-lg border border-mrd-line bg-mrd-sheet p-8">
      {/* Header */}
      <div className="mb-8">
        {/*
         * THIS CLAIMED SOMETHING THE PRODUCT HAS NEVER DONE, on the first
         * screen a stranger sees. It read:
         *
         *   AUTONOMOUS EXECUTION
         *   One sentence. Seven stations. Fully automatic.
         *   No clicks mid-run. No human intervention. Agent decides, builds, ships.
         *
         * "No clicks mid-run. No human intervention." is not marketing language,
         * it is the WORDING OF R-18, the acceptance this whole build exists to
         * reach, asserted on the public page as already accomplished. Measured
         * against the live database on 2026-08-27, the honest form of the
         * acceptance query returns 0. The nearest track (d1168015) walked all
         * seven with every transition sweep-driven and still fails, because one
         * person rejected one approval thirty-seven minutes into the run.
         *
         * AND THE SAME PAGE CONTRADICTED IT. TrustClose three sections down
         * promises "Merge, revert, and delegate can never skip your approval."
         * Both cannot be true, and the one we intend to keep is the promise.
         *
         * The replacement is the canon's own better story rather than a hedge.
         * positioning-locked 5:269: every operator in the corpus says agents
         * need human gates, so "we have graduated autonomy" is a claim everyone
         * makes, and shipping the gate is the claim nobody else in 5.9M words
         * can make. Saying we gate is stronger here than saying we do not.
         *
         * Found by S4 (S4-039), who was right about the sentences.
         *
         * AND RIGHT ABOUT THE ADJECTIVE, WHICH I FIRST DISPUTED. I checked
         * positioning-locked:203, found "autonomous" absent from the landing
         * Never column, saw the canon use "32% autonomous" at :269, and told
         * S4 the word was fine. I had checked one file and called it "the
         * canon". OPERATING-MODEL-5-SESSIONS.md:32 and :735 ban "agentic",
         * "autonomous", "AI-native", "orchestration" and "intelligence" in
         * product copy, twice, in the file every session is told to read
         * first. It is banned. The word is gone from the copy above either
         * way, but this note said otherwise and would have licensed the next
         * person to put it back.
         *
         * (:269's use is the accelerator argument, and its own scope paragraph
         * limits it to one station on the evidence model that earned it, so it
         * was never landing copy. Separately, S4 found that :203's table is
         * residue: its Register column is struck through because the register
         * split was retired on 2026-08-11, and the per-surface Never columns
         * were never updated with it. That is why absence from :203 proves
         * nothing, and it is S0's to reconcile, not mine.)
         */}
        <p className="text-sm text-mrd-body mb-2">HOW A RUN MOVES</p>
        <p className="text-lg font-medium text-white mb-1">One sentence in. Seven stations.</p>
        <p className="text-sm text-mrd-mute">
          Agents do the work. You gate what matters, and every step is on the record.
        </p>
      </div>

      {/* Input */}
      <div className="mb-8">
        <div className="inline-block bg-mrd-lift border border-mrd-line rounded px-3 py-2 text-sm text-mrd-ink">
          💬 &quot;Improve onboarding flow based on user feedback&quot;
        </div>
      </div>

      {/* Station Progress Bar */}
      <div className="mb-8">
        <div className="flex gap-1 mb-4">
          {stations.map((station, idx) => (
            <div key={station.name} className="flex-1 h-2 rounded-full bg-mrd-line overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  station.state === "complete"
                    ? "bg-mrd-pass"
                    : station.state === "working"
                      ? "bg-mrd-agent"
                      : "bg-mrd-faint"
                }`}
                style={{
                  width: `${station.progress}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Station Names */}
        <div className="flex gap-1 text-xs text-mrd-mute">
          {stations.map((station) => (
            <div key={station.name} className="flex-1 text-center truncate">
              {station.displayName}
            </div>
          ))}
        </div>
      </div>

      {/* Status Line */}
      <div className="mb-8 h-6">
        <p className="text-sm text-mrd-body">
          {completedCount === STATIONS.length ? (
            <span className="text-mrd-pass">✓ Complete in ~35 seconds • Restarting…</span>
          ) : firstActiveIndex >= 0 ? (
            <span className="text-mrd-agent">
              ⟳ At {stations[firstActiveIndex].displayName}…{" "}
              <span className="text-mrd-mute">
                ({completedCount}/{STATIONS.length} stations done)
              </span>
            </span>
          ) : (
            <span className="text-mrd-mute">Ready to start…</span>
          )}
        </p>
      </div>

      {/* Output Preview */}
      <div className="rounded bg-mrd-lift border border-mrd-line p-4">
        <p className="text-xs text-mrd-mute mb-2">OUTPUT</p>
        <div className="space-y-2">
          {completedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-mrd-ink">
              <span className="w-4 h-4 rounded-full bg-mrd-pass/30 border border-mrd-pass"></span>
              <span>Spec drafted & reviewed</span>
            </div>
          )}
          {completedCount > 1 && (
            <div className="flex items-center gap-2 text-sm text-mrd-ink">
              <span className="w-4 h-4 rounded-full bg-mrd-pass/30 border border-mrd-pass"></span>
              <span>Design prototype created</span>
            </div>
          )}
          {completedCount > 3 && (
            <div className="flex items-center gap-2 text-sm text-mrd-ink">
              <span className="w-4 h-4 rounded-full bg-mrd-pass/30 border border-mrd-pass"></span>
              <span>Code changes staged</span>
            </div>
          )}
          {completedCount > 5 && (
            <div className="flex items-center gap-2 text-sm text-mrd-ink">
              <span className="w-4 h-4 rounded-full bg-mrd-pass/30 border border-mrd-pass"></span>
              <span>Deployed to production</span>
            </div>
          )}
          {completedCount === STATIONS.length && (
            <div className="flex items-center gap-2 text-sm text-mrd-pass">
              <span className="w-4 h-4 rounded-full bg-mrd-pass"></span>
              <span>→ Outcome being measured</span>
            </div>
          )}
          {completedCount === 0 && (
            <div className="text-sm text-mrd-mute py-2">Starting agent work…</div>
          )}
        </div>
      </div>

      {/* Key Message */}
      <div className="mt-6 pt-4 border-t border-mrd-line">
        {/* Bounded to the prose measure. Unbounded, this set 122 CHARACTERS on
            a single line at 1280 wide -- nearly double `--mrd-measure`'s 32rem
            -- on the first screen a stranger reads. Measured by S4 as rendered
            line boxes rather than container width, which is the distinction
            that makes the number real. */}
        <p className="max-w-[var(--mrd-measure-prose)] text-xs text-mrd-mute">
          Every station is an agent making real decisions, creating real outputs, handed off by
          evidence, not by guess. You set the boundaries once. The loop handles the rest.
        </p>
      </div>
    </div>
  );
}
