// The Desk's hero tool (PM Desk, founder goal 2026-07-09): start an
// intent-based focus block from Today — one line of intent, a length (quick
// chips, a custom value, or "until the next meeting"), an ambient sound — and
// the same block the dock then carries across every page. While a block runs
// the card is its home: phase-colored countdown, intent, extend/end. Below the
// composer, the machine's one suggestion (FocusNext) can become the intent in
// one click or be dispatched to an agent. Everything drives the ONE flow
// engine (use-flow-mode); there is no second timer.
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/obsidian";
import { toast } from "@/lib/notify";
import { useFlowMode } from "@/hooks/use-flow-mode";
import {
  MAX_CUSTOM_MIN,
  MIN_CUSTOM_MIN,
  SOUND_PRESETS,
  TIMER_QUICK_MIN,
  clampMinutes,
  readFocusHistory,
  safeLocalStorage,
  todaysFocusTally,
  type FocusPhase,
  type SoundPreset,
} from "@/lib/flow/session";
import { getTodayEvents } from "@/lib/calendar.functions";
import { getFocusNext } from "@/lib/brain/insights.functions";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { FocusNext } from "@/components/today/FocusNext";

const PRESET_LABEL: Record<SoundPreset, string> = {
  ocean: "Ocean",
  monsoon: "Monsoon",
  bansuri: "Bansuri",
  forest: "Forest",
  heartbeat: "Heartbeat",
  fireplace: "Fireplace",
  off: "Off",
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "16px 18px",
  boxShadow: "var(--top-light)",
};

function phaseColor(phase: FocusPhase | null): string {
  if (phase === "closing") return "var(--ember-text)";
  if (phase === "past-half") return "var(--text-primary)";
  return "var(--text-muted)";
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  // Colors live in classes (not inline style) so the hover variants can win;
  // aria-pressed carries the selected state for AT.
  const stateClass = active
    ? "[border-color:var(--hairline-strong)] [background:var(--raised)] [color:var(--text-primary)]"
    : "[border-color:var(--hairline)] [color:var(--text-muted)] hover:[border-color:var(--hairline-strong)] hover:[color:var(--text-primary)]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-label-12 loom-press outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] ${stateClass}`}
      style={{
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        padding: "4px 10px",
        borderRadius: "var(--radius-control)",
        border: "1px solid",
        background: active ? "var(--raised)" : "transparent",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

type EventRow = { id: string; title: string; start_at: string };

export function FocusCard() {
  const qc = useQueryClient();
  const {
    isFlowMode,
    remainingMs,
    remainingLabel,
    heldCount,
    intent,
    startedAt,
    phase,
    config,
    setConfig,
    enterFlow,
    extendSession,
    exitFlow,
  } = useFlowMode();

  const [draftIntent, setDraftIntent] = React.useState("");
  const [customStr, setCustomStr] = React.useState("");
  const intentRef = React.useRef<HTMLInputElement>(null);

  // Today's tally from the local ledger; recomputed when a block ends. The
  // storage getter goes through the guard: denied storage means no tally,
  // never a crashed route (review fix).
  const [tally, setTally] = React.useState<{ blocks: number; minutes: number } | null>(null);
  React.useEffect(() => {
    setTally(todaysFocusTally(readFocusHistory(safeLocalStorage()), Date.now()));
  }, [isFlowMode]);

  // "Until the next meeting": the calendar-clamped block length a PM actually
  // uses. Shares the Desk's events query (MeetingsRow reads the same key).
  const fEvents = useServerFn(getTodayEvents);
  const events = useQuery({ queryKey: ["calendar-today-events"], queryFn: () => fEvents() });
  const nextEvent = React.useMemo(() => {
    const rows = ((events.data?.events ?? []) as EventRow[]).filter((e) => e.start_at);
    const now = Date.now();
    return rows.find((e) => Date.parse(e.start_at) - now > 5 * 60_000) ?? null;
  }, [events.data]);

  // The machine's one suggestion; appears when ready, never blocks the card.
  const fFocus = useServerFn(getFocusNext);
  const focus = useQuery({
    queryKey: ["focus-next"],
    queryFn: () => fFocus(),
    staleTime: 30 * 60 * 1000,
  });
  const mStart = useServerFn(startOrchestratedMission);
  const startMission = useMutation({
    // The orchestrator loop is awaited server-side — this can run 30s+.
    mutationFn: (data: { goal: string }) => mStart({ data }),
    onSuccess: () => {
      toast.success("Mission dispatched. Track it in Build.");
      void qc.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (e: Error) => toast.success(e.message),
  });

  const applyCustom = (v: string) => {
    setCustomStr(v);
    const n = Number(v);
    if (v !== "" && Number.isFinite(n)) setConfig({ timerMin: clampMinutes(n) });
  };

  const untilMinutes = () =>
    nextEvent ? clampMinutes((Date.parse(nextEvent.start_at) - Date.now()) / 60_000) : null;

  const start = () => {
    enterFlow({ intent: draftIntent });
    setDraftIntent("");
  };

  const openEnded = isFlowMode && remainingMs === null;
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!openEnded) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [openEnded]);
  const elapsedMin = startedAt !== null ? Math.max(0, Math.round((now - startedAt) / 60_000)) : 0;

  return (
    <section aria-label="Focus block" className="loom-hairline-fade" style={card}>
      <div className="flex items-baseline" style={{ gap: 12, marginBottom: 12 }}>
        <h3 className="text-label-12" style={{ ...mono, color: "var(--text-subtle)", margin: 0 }}>Focus block</h3>
        <div style={{ flex: 1 }} />
        {tally && tally.blocks > 0 ? (
          <span className="text-label-12" style={{ ...mono, color: "var(--text-faint)" }}>
            {tally.blocks} block{tally.blocks === 1 ? "" : "s"} · {tally.minutes} min today
          </span>
        ) : null}
      </div>

      {isFlowMode ? (
        <div className="flex flex-col" style={{ gap: 12 }}>
          <span
            aria-live="off"
            style={{
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
              color: openEnded ? "var(--text-muted)" : phaseColor(phase),
              transition: "color 280ms var(--ease)",
              lineHeight: 1.1,
            }}
          >
            {openEnded ? `${elapsedMin} min in` : remainingLabel}
          </span>
          <span className="text-label-13" style={{ color: "var(--text-body)" }}>{intent ?? "Open block"}</span>
          {heldCount > 0 ? (
            <span className="text-label-12" style={{ color: "var(--text-muted)" }}>
              {heldCount} update{heldCount === 1 ? "" : "s"} waiting quietly
            </span>
          ) : null}
          <div className="flex items-center" style={{ gap: 8 }}>
            {!openEnded ? (
              <Button variant="secondary" onClick={() => extendSession(5)}>
                Add 5 minutes
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => exitFlow()}>
              End the block
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 12 }}>
          <input
            ref={intentRef}
            value={draftIntent}
            onChange={(e) => setDraftIntent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") start();
            }}
            maxLength={120}
            aria-label="Focus block intent"
            placeholder="What are you closing in this block?"
            className="text-label-13"
            style={{
              width: "100%",
              background: "var(--surface-card-deep)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "8px 12px",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
            {TIMER_QUICK_MIN.map((m) => (
              <Chip
                key={m}
                label={String(m)}
                active={customStr === "" && config.timerMin === m}
                onClick={() => {
                  setCustomStr("");
                  setConfig({ timerMin: m });
                }}
              />
            ))}
            {nextEvent ? (
              <Chip
                label={`Until ${new Date(Date.parse(nextEvent.start_at)).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`}
                active={customStr === "until"}
                onClick={() => {
                  const min = untilMinutes();
                  if (min !== null) {
                    setCustomStr("until");
                    setConfig({ timerMin: min });
                  }
                }}
              />
            ) : null}
            <input
              type="number"
              inputMode="numeric"
              min={MIN_CUSTOM_MIN}
              max={MAX_CUSTOM_MIN}
              placeholder="min"
              value={customStr === "until" ? "" : customStr}
              onChange={(e) => applyCustom(e.target.value)}
              aria-label="Custom focus minutes"
              className="text-label-12"
              style={{
                width: 56,
                background: "transparent",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-control)",
                padding: "4px 8px",
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="tertiary" className="text-label-12">
                  Sound · {PRESET_LABEL[config.preset]}
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" sideOffset={8} className="w-64 p-3">
                <div className="flex flex-col" style={{ gap: 12 }}>
                  <span className="text-label-12" style={{ ...mono, color: "var(--text-subtle)" }}>
                    Ambient sound
                  </span>
                  <div className="grid grid-cols-3" style={{ gap: 8 }}>
                    {SOUND_PRESETS.map((preset) => (
                      <Chip
                        key={preset}
                        label={PRESET_LABEL[preset]}
                        active={preset === config.preset}
                        onClick={() => setConfig({ preset })}
                      />
                    ))}
                  </div>
                  {config.preset !== "off" ? (
                    <Slider
                      value={[config.volume]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={([v]) => setConfig({ volume: v })}
                      aria-label="Volume"
                    />
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
            <div style={{ flex: 1 }} />
            <Button variant="secondary" onClick={start}>
              Start the block
            </Button>
          </div>
        </div>
      )}

      {!isFlowMode && focus.data ? (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
          <FocusNext
            insight={focus.data}
            onStart={(goal) => startMission.mutate({ goal })}
            isStarting={startMission.isPending}
            onFocusThis={(headline) => {
              setDraftIntent(headline.slice(0, 120));
              intentRef.current?.focus();
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
