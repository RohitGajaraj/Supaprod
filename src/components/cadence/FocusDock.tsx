// The focus dock (PM Desk, founder goal 2026-07-09; docking model after Wispr
// Flow, founder reference): a nearly invisible sliver lives at the bottom
// center of EVERY authenticated page. One shortcut (Option F) does everything:
// idle it expands into a tiny composer (intent + minutes + start), running it
// becomes the countdown pill and the shortcut toggles its controls. The pill
// speaks the phase of the block: glacier while early, brightening past the
// halfway mark, ember through the closing stretch (the one legitimate ember —
// the block is genuinely asking the human to wrap up). Chrome, not a surface;
// every control is a real Button (no bare text-buttons, DESIGN-LOOM §0.1.1).
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/obsidian";
import { useFlowMode } from "@/hooks/use-flow-mode";
import { formatRemaining, TIMER_QUICK_MIN, type FocusPhase } from "@/lib/flow/session";

/** The palette (and anything else) can open the composer via this event. */
export const FOCUS_COMPOSE_EVENT = "cadence:focus-compose";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

/** The phase color ladder: countdown text + progress line move together. */
function phaseColor(phase: FocusPhase | null): string {
  if (phase === "closing") return "var(--ember-text)";
  if (phase === "past-half") return "var(--text-primary)";
  return "var(--glacier)";
}

/** Screen-reader announcement per phase transition — never the ticking value. */
const PHASE_ANNOUNCEMENT: Record<FocusPhase, string> = {
  early: "",
  "past-half": "Half the block left.",
  closing: "Closing minutes.",
};

function DurationChip({
  minutes,
  active,
  onClick,
}: {
  minutes: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        fontVariantNumeric: "tabular-nums",
        padding: "4px 10px",
        borderRadius: "var(--radius-control)",
        border: `1px solid ${active ? "var(--hairline-strong)" : "var(--hairline)"}`,
        background: active ? "var(--raised)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      {minutes}
    </button>
  );
}

export function FocusDock() {
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

  const [composerOpen, setComposerOpen] = React.useState(false);
  const [controlsOpen, setControlsOpen] = React.useState(false);
  const [draftIntent, setDraftIntent] = React.useState("");
  const [hovered, setHovered] = React.useState(false);
  const intentInputRef = React.useRef<HTMLInputElement>(null);

  const running = isFlowMode;
  const openEnded = running && remainingMs === null;

  // Open-ended blocks have no provider countdown; tick elapsed locally.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!openEnded) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [openEnded]);

  // The one shortcut: Option F from anywhere (a deliberate chord, like Cmd K).
  // Idle -> composer · composer -> close · running -> toggle the controls.
  const runningRef = React.useRef(running);
  runningRef.current = running;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyF" || !e.altKey || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      if (runningRef.current) setControlsOpen((v) => !v);
      else setComposerOpen((v) => !v);
    };
    const onCompose = () => {
      if (!runningRef.current) setComposerOpen(true);
      else setControlsOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(FOCUS_COMPOSE_EVENT, onCompose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(FOCUS_COMPOSE_EVENT, onCompose);
    };
  }, []);

  React.useEffect(() => {
    if (composerOpen) intentInputRef.current?.focus();
  }, [composerOpen]);

  // A block starting closes the composer; a block ending closes the controls.
  React.useEffect(() => {
    if (running) setComposerOpen(false);
    else setControlsOpen(false);
  }, [running]);

  // Announce phase transitions once each, quietly, for screen readers.
  const [announcement, setAnnouncement] = React.useState("");
  const prevPhase = React.useRef<FocusPhase | null>(null);
  React.useEffect(() => {
    if (phase && phase !== prevPhase.current) setAnnouncement(PHASE_ANNOUNCEMENT[phase]);
    prevPhase.current = phase;
  }, [phase]);

  const start = () => {
    enterFlow({ intent: draftIntent });
    setDraftIntent("");
    setComposerOpen(false);
  };

  const color = phaseColor(phase);
  const elapsedMs = startedAt !== null ? Math.max(0, Date.now() - startedAt) : null;
  const fractionLeft =
    remainingMs !== null && elapsedMs !== null && remainingMs + elapsedMs > 0
      ? remainingMs / (remainingMs + elapsedMs)
      : null;
  const timeText = openEnded
    ? formatRemaining(startedAt !== null ? now - startedAt : 0)
    : remainingLabel;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 10,
        zIndex: 45,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <span className="sr-only" role="status">
        {announcement}
      </span>

      {/* Idle composer: the sliver, expanded (Wispr model). */}
      {!running && composerOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraftIntent("");
              setComposerOpen(false);
            }
          }}
          style={{
            width: 340,
            padding: "12px 14px",
            marginBottom: 6,
            background: "var(--card)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-card)",
            boxShadow: "0 24px 64px -16px rgba(0,0,0,0.65), var(--top-light)",
            animation: "cadRise 200ms var(--ease) both",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <input
            ref={intentInputRef}
            value={draftIntent}
            onChange={(e) => setDraftIntent(e.target.value)}
            maxLength={120}
            placeholder="What are you closing in this block?"
            style={{
              width: "100%",
              background: "var(--surface-card-deep)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--text-primary)",
            }}
          />
          <div className="flex items-center" style={{ gap: 8 }}>
            {TIMER_QUICK_MIN.map((m) => (
              <DurationChip
                key={m}
                minutes={m}
                active={config.timerMin === m}
                onClick={() => setConfig({ timerMin: m })}
              />
            ))}
            <div style={{ flex: 1 }} />
            <Button variant="secondary" type="submit">
              Start the block
            </Button>
          </div>
        </form>
      ) : null}

      {!running ? (
        // The idle sliver: a whisper of presence on every page.
        <button
          type="button"
          aria-label="Start a focus block (Option F)"
          onClick={() => setComposerOpen((v) => !v)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "2px 10px 4px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              ...mono,
              fontSize: 9.5,
              color: "var(--text-subtle)",
              opacity: hovered || composerOpen ? 1 : 0,
              transition: "opacity 200ms var(--ease)",
            }}
          >
            Focus · ⌥F
          </span>
          <span
            aria-hidden="true"
            style={{
              width: 36,
              borderTop: `2px dotted ${hovered || composerOpen ? "var(--text-muted)" : "var(--text-faint)"}`,
              transition: "border-color 200ms var(--ease)",
            }}
          />
        </button>
      ) : (
        // The running pill at the same anchor.
        <Popover open={controlsOpen} onOpenChange={setControlsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Focus block controls (Option F)"
              className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                maxWidth: 340,
                padding: "8px 14px 10px",
                background: "var(--card)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--radius-card)",
                boxShadow: "0 24px 64px -16px rgba(0,0,0,0.65), var(--top-light)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                animation: "cadRise 200ms var(--ease) both",
              }}
            >
              <span
                aria-hidden="true"
                className={phase === "closing" ? undefined : "flow-pulse"}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: phase === "closing" ? "var(--ember)" : "var(--glacier)",
                  flexShrink: 0,
                }}
              />
              <span
                aria-live="off"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontVariantNumeric: "tabular-nums",
                  color: openEnded ? "var(--text-muted)" : color,
                  flexShrink: 0,
                  transition: "color 280ms var(--ease)",
                }}
              >
                {timeText}
              </span>
              <span
                className="truncate"
                style={{ fontSize: 12.5, color: "var(--text-body)", minWidth: 0 }}
              >
                {intent ?? "Focus block"}
              </span>
              {heldCount > 0 ? (
                <span style={{ ...mono, color: "var(--text-subtle)", flexShrink: 0 }}>
                  {heldCount} held
                </span>
              ) : null}
              {fractionLeft !== null ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    background: color,
                    transform: `scaleX(${Math.max(0, Math.min(1, fractionLeft))})`,
                    transformOrigin: "left",
                    transition: "transform 1s linear, background 280ms var(--ease)",
                  }}
                />
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" sideOffset={10} className="w-72 p-3">
            <div className="flex flex-col" style={{ gap: 10 }}>
              {intent ? (
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-body)", margin: 0 }}>
                  {intent}
                </p>
              ) : null}
              <span style={{ ...mono, color: "var(--text-subtle)" }}>
                {openEnded
                  ? `${timeText} in · open block`
                  : `${remainingLabel} left${
                      remainingMs !== null && elapsedMs !== null
                        ? ` · ${Math.round((remainingMs + elapsedMs) / 60_000)} min block`
                        : ""
                    }`}
              </span>
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
              {heldCount > 0 ? (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {heldCount} update{heldCount === 1 ? "" : "s"} waiting quietly
                </span>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
