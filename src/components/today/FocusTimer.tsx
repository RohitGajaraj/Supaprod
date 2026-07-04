// Loom (founder ask, 2026-07-04): the PM's focus timer, living on the My-day
// strip. Two presets (25 · 50), a quiet mono countdown, pause/resume/reset,
// and a toast when the block completes. State persists in localStorage as an
// absolute end timestamp so navigation and tab sleep never lose the block;
// the 1s tick only renders text (no animation, reduced-motion safe). This is
// the calm-front answer to "add a Pomodoro": one segment, zero new surfaces.
import * as React from "react";
import { useToast } from "@/components/obsidian/toast";

const KEY = "cadence.focus.timer";

type Persisted =
  | { state: "running"; endsAt: number; preset: number }
  | { state: "paused"; remainingMs: number; preset: number };

function load(): Persisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted;
    if (p.state === "running" && typeof p.endsAt === "number") return p;
    if (p.state === "paused" && typeof p.remainingMs === "number") return p;
    return null;
  } catch {
    return null;
  }
}

function save(p: Persisted | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage denied: the timer still works for this page's lifetime.
  }
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

function GhostButton({
  children,
  onClick,
  tone = "var(--glacier)",
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="loom-press outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{ ...mono, color: tone, background: "transparent", border: "none", padding: "2px 0" }}
    >
      {children}
    </button>
  );
}

export function FocusTimer() {
  const showToast = useToast();
  const [session, setSession] = React.useState<Persisted | null>(() =>
    typeof window === "undefined" ? null : load(),
  );
  const [now, setNow] = React.useState(() => Date.now());
  const [open, setOpen] = React.useState(false);

  const running = session?.state === "running";
  const remaining =
    session == null
      ? 0
      : session.state === "running"
        ? session.endsAt - now
        : session.remainingMs;

  // Tick once a second only while a block runs; text-only updates.
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Completion: fires once when a running block crosses zero.
  React.useEffect(() => {
    if (session?.state === "running" && session.endsAt - now <= 0) {
      setSession(null);
      save(null);
      showToast("Focus block done. Stretch, then take the next call.");
    }
  }, [session, now, showToast]);

  const start = (minutes: number) => {
    const next: Persisted = {
      state: "running",
      endsAt: Date.now() + minutes * 60_000,
      preset: minutes,
    };
    setSession(next);
    setNow(Date.now());
    save(next);
    setOpen(false);
  };

  const pause = () => {
    if (session?.state !== "running") return;
    const next: Persisted = {
      state: "paused",
      remainingMs: Math.max(0, session.endsAt - Date.now()),
      preset: session.preset,
    };
    setSession(next);
    save(next);
  };

  const resume = () => {
    if (session?.state !== "paused") return;
    const next: Persisted = {
      state: "running",
      endsAt: Date.now() + session.remainingMs,
      preset: session.preset,
    };
    setSession(next);
    setNow(Date.now());
    save(next);
  };

  const reset = () => {
    setSession(null);
    save(null);
  };

  if (session == null) {
    return (
      <span className="inline-flex items-center" style={{ gap: 8 }}>
        {open ? (
          <>
            <span style={{ ...mono, color: "var(--text-subtle)" }}>Focus for</span>
            <GhostButton onClick={() => start(25)}>25 min</GhostButton>
            <GhostButton onClick={() => start(50)}>50 min</GhostButton>
            <GhostButton onClick={() => setOpen(false)} tone="var(--text-subtle)" label="Close focus presets">
              Close
            </GhostButton>
          </>
        ) : (
          <GhostButton onClick={() => setOpen(true)} tone="var(--text-muted)">
            Focus timer
          </GhostButton>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center" style={{ gap: 8 }}>
      <span
        style={{
          ...mono,
          color: running ? "var(--glacier)" : "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
        }}
        aria-live="off"
      >
        Focus · {fmt(remaining)}
      </span>
      {running ? (
        <GhostButton onClick={pause} label="Pause the focus block">
          Pause
        </GhostButton>
      ) : (
        <GhostButton onClick={resume} label="Resume the focus block">
          Resume
        </GhostButton>
      )}
      <GhostButton onClick={reset} tone="var(--text-subtle)" label="End the focus block">
        End
      </GhostButton>
    </span>
  );
}
