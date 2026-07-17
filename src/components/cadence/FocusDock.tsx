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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/obsidian";
import { toast } from "@/lib/notify";
import { useFlowMode } from "@/hooks/use-flow-mode";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  formatRemaining,
  clampMinutes,
  MAX_CUSTOM_MIN,
  MIN_CUSTOM_MIN,
  TIMER_QUICK_MIN,
  type FocusPhase,
} from "@/lib/flow/session";
import {
  readNotepad,
  writeNotepad,
  NOTEPAD_CHANGE_EVENT,
  NOTEPAD_DEBOUNCE_MS,
} from "@/lib/notepad";
import { createTask } from "@/lib/tasks.functions";
import { todayStr } from "@/components/today/desk/task-filters";

/** The palette (and anything else) can open the composer via this event. */
export const FOCUS_COMPOSE_EVENT = "cadence:focus-compose";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-label-12)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

/** The phase color ladder: countdown text + progress line move together. */
function phaseColor(phase: FocusPhase | null): string {
  if (phase === "closing") return "var(--ember-text)";
  if (phase === "past-half") return "var(--text-primary)";
  return "var(--text-muted)";
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
      className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--ember)]"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-label-12)",
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

/** Quick-access panel tab, sentence case (DESIGN-LOOM §0.1.1: a real bordered
 * control, never a bare text-button). "Focus" is the default/first tab. */
function ComposerTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="tertiary"
      size="sm"
      onClick={onClick}
      style={{
        fontSize: 12,
        padding: "4px 11px",
        borderColor: active ? "var(--hairline-strong)" : "var(--hairline)",
        background: active ? "var(--raised)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-muted)",
      }}
    >
      {label}
    </Button>
  );
}

type ComposerTabId = "focus" | "task" | "note";

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
  const [customStr, setCustomStr] = React.useState("");
  const [hovered, setHovered] = React.useState(false);
  const intentInputRef = React.useRef<HTMLInputElement>(null);

  // The quick-access panel (founder feedback 2026-07-09): a couple of the
  // things a PM reaches for constantly from any page, not just the timer.
  // "Focus" is the default/first tab; never persisted across sessions.
  const [activeTab, setActiveTab] = React.useState<ComposerTabId>("focus");
  const { activeWorkspaceId, activeProductId } = useWorkspace();
  const qc = useQueryClient();

  const [taskTitle, setTaskTitle] = React.useState("");
  const fCreateTask = useServerFn(createTask);
  const addTask = useMutation({
    mutationFn: (title: string) =>
      fCreateTask({ data: { title, due_date: todayStr(), project_id: activeProductId ?? null } }),
    onSuccess: () => {
      setTaskTitle("");
      toast.success("Added to today's list.");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.success(e.message),
  });

  // The Note tab shares the exact same store as the Desk's NotepadCard (never
  // two notes). Read fresh whenever the tab opens, so an edit made elsewhere
  // is never shadowed by a stale value; write is a plain debounced effect.
  const [noteText, setNoteText] = React.useState("");
  React.useEffect(() => {
    if (!composerOpen || activeTab !== "note") return;
    setNoteText(readNotepad(window.localStorage, activeWorkspaceId).text);
  }, [composerOpen, activeTab, activeWorkspaceId]);
  React.useEffect(() => {
    if (!composerOpen || activeTab !== "note") return;
    const timer = setTimeout(() => {
      writeNotepad(window.localStorage, activeWorkspaceId, noteText);
    }, NOTEPAD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteText, activeWorkspaceId]);

  // Never two notes (live-verification finding): while the Note tab is open,
  // pick up an edit made on the Desk's NotepadCard instead of silently
  // shadowing it on the next debounced write.
  React.useEffect(() => {
    if (!composerOpen || activeTab !== "note") return;
    const onChange = () => {
      setNoteText(readNotepad(window.localStorage, activeWorkspaceId).text);
    };
    window.addEventListener(NOTEPAD_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(NOTEPAD_CHANGE_EVENT, onChange);
  }, [composerOpen, activeTab, activeWorkspaceId]);

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

  // Every open (Option F, the palette event, or the idle sliver) lands on the
  // Focus tab — the palette's "Start a focus block" entry relies on this.
  React.useEffect(() => {
    if (composerOpen) setActiveTab("focus");
  }, [composerOpen]);

  React.useEffect(() => {
    if (composerOpen && activeTab === "focus") intentInputRef.current?.focus();
  }, [composerOpen, activeTab]);

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

  // Mirrors FocusCard's exact custom-minutes pattern (founder feedback
  // 2026-07-09): a numeric input beside the quick chips, clamped, live.
  const applyCustom = (v: string) => {
    setCustomStr(v);
    const n = Number(v);
    if (v !== "" && Number.isFinite(n)) setConfig({ timerMin: clampMinutes(n) });
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
    <>
      {/* The session edge glow (founder ask 2026-07-09; the Claude caps-lock
          reference): while a block runs, the screen's edges carry a faint
          light, neutral gray while the block holds the room, ember through
          the closing stretch (Tempo v5 DESIGN-TEMPO.md §2 glacier/
          machine-voice narrowing, 2026-07-11: a full-viewport glow is
          ambient decoration, not a literal status badge/chip/dot, so it no
          longer borrows glacier. the pill's own dot/text/progress line
          still carries the live phase color). A legal glow field: atmosphere
          with meaning, aria-hidden, pointer-transparent, breathing only
          while the session is genuinely live. */}
      {running ? (
        <div
          aria-hidden="true"
          className="cad-focus-glow"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 44,
            boxShadow:
              phase === "closing"
                ? "inset 0 0 140px -48px rgba(255,107,44,0.14), inset 0 0 48px -24px rgba(255,107,44,0.08)"
                : "inset 0 0 140px -48px var(--ds-gray-alpha-500), inset 0 0 48px -24px var(--ds-gray-alpha-300)",
            transition: "box-shadow 280ms var(--ease)",
          }}
        />
      ) : null}
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

        {/* Idle composer: the sliver, expanded into a small quick-access panel
            (founder feedback 2026-07-09) — a couple of the things a PM
            reaches for constantly from any page, not just a timer starter.
            "Focus" (default) starts a block; "Task" and "Note" are one-step
            reaches into the Desk's task list and scratch notepad. */}
        {!running && composerOpen ? (
          <div
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraftIntent("");
                setComposerOpen(false);
              }
            }}
            className="material-menu"
            style={{
              width: 340,
              padding: "12px 14px",
              marginBottom: 6,
              animation: "cadRise 200ms var(--ds-motion-timing-swift) both",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div className="flex items-center" style={{ gap: 6 }}>
              <ComposerTab
                label="Focus"
                active={activeTab === "focus"}
                onClick={() => setActiveTab("focus")}
              />
              <ComposerTab
                label="Task"
                active={activeTab === "task"}
                onClick={() => setActiveTab("task")}
              />
              <ComposerTab
                label="Note"
                active={activeTab === "note"}
                onClick={() => setActiveTab("note")}
              />
            </div>

            {activeTab === "focus" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  start();
                }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
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
                <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
                  {TIMER_QUICK_MIN.map((m) => (
                    <DurationChip
                      key={m}
                      minutes={m}
                      active={customStr === "" && config.timerMin === m}
                      onClick={() => {
                        setCustomStr("");
                        setConfig({ timerMin: m });
                      }}
                    />
                  ))}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_CUSTOM_MIN}
                    max={MAX_CUSTOM_MIN}
                    placeholder="min"
                    value={customStr}
                    onChange={(e) => applyCustom(e.target.value)}
                    aria-label="Custom focus minutes"
                    style={{
                      width: 56,
                      background: "transparent",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--radius-control)",
                      padding: "4px 8px",
                      fontSize: "var(--text-label-12)",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--text-primary)",
                    }}
                  />
                  <div style={{ flex: 1 }} />
                  <Button variant="secondary" type="submit">
                    Start the block
                  </Button>
                </div>
              </form>
            ) : null}

            {activeTab === "task" ? (
              <form
                className="flex items-center"
                style={{ gap: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (taskTitle.trim().length >= 2) addTask.mutate(taskTitle.trim());
                }}
              >
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  maxLength={280}
                  placeholder="Add a task for today"
                  style={{
                    flex: 1,
                    background: "var(--surface-card-deep)",
                    border: "1px solid var(--hairline-strong)",
                    borderRadius: "var(--radius-control)",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  loading={addTask.isPending}
                  disabled={taskTitle.trim().length < 2}
                >
                  Add
                </Button>
              </form>
            ) : null}

            {activeTab === "note" ? (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Jot anything. Only you see this."
                style={{
                  width: "100%",
                  height: 70,
                  resize: "vertical",
                  background: "var(--surface-card-deep)",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: "var(--radius-control)",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              />
            ) : null}
          </div>
        ) : null}

        {!running ? (
          // The idle sliver: a whisper of presence on every page — but a REAL
          // control (review fix, DESIGN-LOOM §0.1.1): a quiet pill with shape,
          // fill, and border, its label in the sentence-case UI voice, so
          // affordance survives even at minimum emphasis. The label fades in
          // on hover/focus; the dotted thread stays the resting motif.
          <button
            type="button"
            aria-label="Start a focus block (Option F)"
            onClick={() => setComposerOpen((v) => !v)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--ember)]"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              background: "var(--card)",
              border: `1px solid ${hovered || composerOpen ? "var(--hairline-strong)" : "var(--hairline)"}`,
              borderRadius: 999,
              boxShadow: "var(--top-light)",
              cursor: "pointer",
              transition: "border-color 200ms var(--ease)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 24,
                borderTop: `2px dotted ${hovered || composerOpen ? "var(--text-muted)" : "var(--text-faint)"}`,
                transition: "border-color 200ms var(--ease)",
              }}
            />
            <span
              aria-hidden="true"
              style={{
                fontSize: 11,
                color: hovered || composerOpen ? "var(--text-muted)" : "var(--text-faint)",
                whiteSpace: "nowrap",
                transition: "color 200ms var(--ease)",
              }}
            >
              Focus · ⌥F
            </span>
          </button>
        ) : (
          // The running pill at the same anchor.
          <Popover open={controlsOpen} onOpenChange={setControlsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Focus block controls (Option F)"
                className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--ember)]"
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
                  style={{ fontSize: "var(--text-label-13)", color: "var(--text-body)", minWidth: 0 }}
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
                  <p
                    style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-body)", margin: 0 }}
                  >
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
    </>
  );
}
