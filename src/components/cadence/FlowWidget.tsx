import { useState } from "react";
import { Waves, X, Volume2, Play } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useFlowMode } from "@/hooks/use-flow-mode";
import {
  SOUND_PRESETS,
  TIMER_QUICK_MIN,
  clampMinutes,
  MIN_CUSTOM_MIN,
  MAX_CUSTOM_MIN,
  type SoundPreset,
} from "@/lib/flow/session";
import { cn } from "@/lib/utils";

// The Flow-mode control in the sidebar footer, beside the theme toggle. Idle:
// a quiet icon that opens a small focus panel. Active: the icon plus remaining
// time, with an inline exit. All the audio / timer / quieting machinery lives
// behind it (Engine-Room: named for the outcome, "Flow", not the mechanism).

const PRESET_LABEL: Record<SoundPreset, string> = {
  ocean: "Ocean",
  monsoon: "Monsoon",
  bansuri: "Bansuri",
  forest: "Forest",
  heartbeat: "Heartbeat",
  fireplace: "Fireplace",
  off: "Off",
};

const TIMER_OPTIONS = [...TIMER_QUICK_MIN, 0] as const;

function timerLabel(min: number): string {
  return min > 0 ? `${min}m` : "Open";
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-[11.5px] transition",
        active
          ? "border-foreground/30 bg-foreground/[0.06] text-foreground"
          : "border-transparent text-ink-subtle hover:text-foreground hover:bg-foreground/[0.03]",
      )}
    >
      {children}
    </button>
  );
}

export function FlowWidget({ asRow = false }: { asRow?: boolean }) {
  const {
    isFlowMode,
    remainingLabel,
    heldCount,
    soundResumable,
    soundUnavailable,
    config,
    setConfig,
    enterFlow,
    exitFlow,
    resumeSound,
  } = useFlowMode();

  // Local string state for the custom-minutes field so it stays freely editable
  // (clearable while typing); a quick chip clears it and wins.
  const [customStr, setCustomStr] = useState("");

  const applyCustom = (v: string) => {
    setCustomStr(v);
    const n = Number(v);
    if (v !== "" && Number.isFinite(n)) setConfig({ timerMin: clampMinutes(n) });
  };

  // Row variant (Loom v4.1 rail): the Flow control gets a real home as a
  // full-width footer row matching the nav rows, not a vague floating icon.
  const trigger = asRow ? (
    <button
      type="button"
      aria-label="Focus mode"
      title={isFlowMode ? "Focus mode on" : "Focus mode"}
      className="loom-press flex w-full items-center rounded-[8px] px-[10px] py-[8px] text-[13px] text-[var(--text-muted)] outline-none transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
      style={{ gap: 11 }}
    >
      <Waves
        className={cn("shrink-0", isFlowMode && "flow-pulse")}
        style={{ width: 15, height: 15, color: isFlowMode ? "var(--glacier)" : undefined }}
        strokeWidth={1.75}
      />
      <span className="flex-1 truncate text-left">Focus</span>
      {isFlowMode && remainingLabel ? (
        <span
          className="tabular-nums shrink-0"
          style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--glacier)" }}
        >
          {remainingLabel}
        </span>
      ) : null}
    </button>
  ) : (
    <button
      type="button"
      aria-label="Flow mode"
      title={isFlowMode ? "Flow mode on" : "Flow mode"}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-1 py-0.5 transition",
        isFlowMode
          ? "text-foreground ring-1 ring-foreground/20"
          : "text-ink-subtle hover:text-foreground",
      )}
    >
      <Waves className={cn("h-[13px] w-[13px]", isFlowMode && "flow-pulse")} strokeWidth={1.75} />
      {isFlowMode && remainingLabel ? (
        <span className="font-mono text-[11px] tabular-nums">{remainingLabel}</span>
      ) : null}
    </button>
  );

  return (
    <Popover>
      {asRow ? (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      ) : (
        <div className="flex items-center gap-1">
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>

          {isFlowMode ? (
            <button
              type="button"
              aria-label="End focus"
              title="End focus"
              onClick={() => exitFlow()}
              className="flex p-0.5 text-ink-subtle hover:text-foreground transition"
            >
              <X className="h-[12px] w-[12px]" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
      )}

      <PopoverContent side="top" align="start" sideOffset={10} className="w-64 p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="mono-label text-[11px]">Flow</span>
          {isFlowMode ? (
            <span className="font-mono text-[11px] tabular-nums text-ink-muted">
              {remainingLabel || "Open-ended"}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 text-[11px] text-ink-subtle">Ambient sound</div>
            <div className="grid grid-cols-3 gap-1">
              {SOUND_PRESETS.map((preset) => (
                <Pill
                  key={preset}
                  active={preset === config.preset}
                  onClick={() => setConfig({ preset })}
                >
                  {PRESET_LABEL[preset]}
                </Pill>
              ))}
            </div>
            {isFlowMode && soundUnavailable && config.preset !== "off" ? (
              <div className="mt-1.5 text-[11px] text-ink-muted">This sound has no track yet.</div>
            ) : null}
          </div>

          {config.preset !== "off" ? (
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 shrink-0 text-ink-subtle" strokeWidth={1.75} />
              <Slider
                value={[config.volume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => setConfig({ volume: v })}
                aria-label="Volume"
              />
            </div>
          ) : null}

          {!isFlowMode ? (
            <div>
              <div className="mb-1 text-[11px] text-ink-subtle">Focus length</div>
              <div className="flex gap-1">
                {TIMER_OPTIONS.map((min) => (
                  <div key={min} className="flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStr("");
                        setConfig({ timerMin: min });
                      }}
                      className={cn(
                        "w-full rounded-md border px-2 py-1 text-[11.5px] transition",
                        config.timerMin === min && customStr === ""
                          ? "border-foreground/30 bg-foreground/[0.06] text-foreground"
                          : "border-transparent text-ink-subtle hover:text-foreground hover:bg-foreground/[0.03]",
                      )}
                    >
                      {timerLabel(min)}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[11px] text-ink-subtle">Custom</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_CUSTOM_MIN}
                  max={MAX_CUSTOM_MIN}
                  placeholder="min"
                  value={customStr}
                  onChange={(e) => applyCustom(e.target.value)}
                  className="w-16 rounded-md border border-foreground/15 bg-transparent px-2 py-1 text-[12px] tabular-nums focus:border-foreground/30 focus:outline-none"
                  aria-label="Custom focus minutes"
                />
                <span className="text-[11px] text-ink-subtle">min</span>
              </div>
            </div>
          ) : null}

          {isFlowMode && heldCount > 0 ? (
            <div className="text-[11px] text-ink-muted">
              {heldCount} update{heldCount === 1 ? "" : "s"} waiting quietly
            </div>
          ) : null}

          {soundResumable ? (
            <button
              type="button"
              onClick={resumeSound}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-foreground/20 py-1.5 text-[12px] text-foreground transition hover:bg-foreground/[0.04]"
            >
              <Play className="h-3 w-3" strokeWidth={2} /> Resume sound
            </button>
          ) : null}

          {isFlowMode ? (
            <button
              type="button"
              onClick={() => exitFlow()}
              className="w-full rounded-md bg-foreground/[0.06] py-1.5 text-[12px] text-foreground transition hover:bg-foreground/[0.1]"
            >
              End focus
            </button>
          ) : (
            <button
              type="button"
              onClick={() => enterFlow()}
              className="w-full rounded-md bg-foreground py-1.5 text-[12px] font-medium text-background transition hover:opacity-90"
            >
              Start focus
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
