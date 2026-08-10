/**
 * The walkthrough replay family, ported from the v11 landing per the v2 plan
 * (docs/planning/landing-page-v2-plan.md section 5): the sequential FlowList,
 * the shared-clock rAF product mocks (MockDecisionCard, MockLiveRun), and the
 * station spine. Engines kept intact; skins moved to the ink-and-metal palette
 * (section 4.1b): graphite and silver carry everything, blue is the machine
 * voice inside replay frames, ember appears ONLY on the human gate moments,
 * green/red/amber are status-on-status only. No glows, no gradient morphs.
 *
 * Every frame is a replay of a real mission's trace and is labeled as one
 * (claims discipline, section 1.5).
 */
import { useEffect, useRef, useState } from "react";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

// Ink-and-metal palette, module-local.
const R = {
  text: "#e6e8eb",
  muted: "#8f959e",
  faint: "#565c66",
  border: "rgba(255,255,255,0.09)",
  divider: "rgba(255,255,255,0.05)",
  card: "#0d0d0e",
  blue: "#6cb0f5", // machine voice
  green: "#4ac26b", // pass states
  red: "#e5534b", // failure states
  amber: "#d9a13c", // build/working
  ember: "#FF6B2C", // the human gate, nothing else
};

const MONO = "'Geist Mono', monospace";

export type LogEntry = {
  ts: string;
  tag: string;
  msg: string;
  col: string;
  /** Who acts on this step: the agentic-first split, visible per row. */
  actor?: "agent" | "you" | "tool";
  /** The named agent doing this step (shown on the chip instead of "agent"). */
  agentName?: string;
  /** Which of the six stations this step belongs to (lights the spine). */
  station?: number;
  /** A human-gate moment: the one sanctioned ember object in this beat. */
  gate?: boolean;
  /** A station the tool never reaches (the drafting dead-end). */
  dead?: boolean;
  /** Renders the small revolving SupaprodMark: memory being written. */
  mark?: boolean;
};

const ACTOR_STYLE: Record<NonNullable<LogEntry["actor"]>, { color: string; border: string }> = {
  agent: { color: R.blue, border: "rgba(108,176,245,0.35)" },
  you: { color: R.ember, border: "rgba(255,107,44,0.4)" },
  tool: { color: R.muted, border: "rgba(255,255,255,0.14)" },
};

function ActorChip({
  actor,
  agentName,
}: {
  actor: NonNullable<LogEntry["actor"]>;
  agentName?: string;
}) {
  const s = ACTOR_STYLE[actor];
  return (
    <span
      style={{
        fontFamily: MONO,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: "1px 5px",
        lineHeight: 1.4,
      }}
    >
      {actor === "agent" && agentName ? agentName : actor}
    </span>
  );
}

export const FULL_LOG: LogEntry[] = [
  {
    ts: "08:02:19",
    tag: "SOURCE",
    col: R.muted,
    actor: "agent",
    agentName: "Scout",
    station: 0,
    msg: "analytics: activation down 4% week over week",
  },
  {
    ts: "08:47:03",
    tag: "SOURCE",
    col: R.muted,
    actor: "agent",
    agentName: "Scout",
    station: 0,
    msg: "support inbox: 3 new complaints tagged onboarding",
  },
  {
    ts: "09:13:26",
    tag: "DISCOVER",
    col: R.blue,
    actor: "agent",
    agentName: "Scout",
    station: 0,
    msg: "Flagged: the drop and the complaints are one story",
  },
  {
    ts: "09:13:41",
    tag: "CLUSTER",
    col: R.muted,
    actor: "agent",
    agentName: "Scout",
    station: 0,
    msg: "3 signals linked: onboarding friction",
  },
  {
    ts: "09:14:02",
    tag: "PROPOSE",
    col: R.blue,
    actor: "agent",
    agentName: "Strategist",
    station: 1,
    msg: "Decision proposed: simplify onboarding step 2",
  },
  {
    ts: "09:14:05",
    tag: "MEMORY",
    col: "#E8B44C",
    actor: "agent",
    agentName: "Brain",
    station: 1,
    msg: "Precedent found: a similar call was right 3 of 4 times, D+14 +9%. Confidence 84%.",
  },
  {
    ts: "09:15:22",
    tag: "GATE",
    col: R.ember,
    actor: "you",
    station: 1,
    msg: "Your call. Approved in 2 seconds.",
    gate: true,
  },
  {
    ts: "09:16:48",
    tag: "PLAN",
    col: R.blue,
    actor: "agent",
    agentName: "Architect",
    station: 2,
    msg: "Spec locked: 4 criteria, 6 linked signals",
  },
  {
    ts: "09:18:37",
    tag: "DESIGN",
    col: R.blue,
    actor: "agent",
    agentName: "Designer",
    station: 3,
    msg: "Screens, states, and copy drafted from the spec",
  },
  {
    ts: "09:21:05",
    tag: "BUILD",
    col: R.amber,
    actor: "agent",
    agentName: "Builder",
    station: 4,
    msg: "Agents dispatched: 3 commits",
  },
  {
    ts: "09:27:52",
    tag: "CI",
    col: R.green,
    actor: "agent",
    agentName: "Builder",
    station: 4,
    msg: "All 14 tests passing",
  },
  {
    ts: "09:28:30",
    tag: "GATE",
    col: R.ember,
    actor: "you",
    station: 4,
    msg: "Merge held for you. Approved.",
    gate: true,
  },
  {
    ts: "09:31:14",
    tag: "SHIP",
    col: R.green,
    actor: "agent",
    agentName: "Builder",
    station: 5,
    msg: "Merged and deployed to production",
  },
  {
    ts: "D+14",
    tag: "LEARN",
    col: R.green,
    actor: "agent",
    agentName: "Sentry",
    station: 6,
    // "Memory updated" is a database talking, and it is the last beat the
    // reader sees, so it was the one place the replay sold storage instead of
    // the thing that compounds. The payoff is what the next call inherits.
    msg: "Activation +8%. Call validated. Next call sharper.",
    mark: true,
  },
];

export const OTHERS_LOG: LogEntry[] = [
  {
    ts: "08:02:19",
    tag: "SOURCE",
    col: R.muted,
    actor: "tool",
    station: 0,
    msg: "analytics: activation down 4% week over week",
  },
  {
    ts: "08:47:03",
    tag: "SOURCE",
    col: R.muted,
    actor: "tool",
    station: 0,
    msg: "support inbox: 3 new complaints tagged onboarding",
  },
  {
    ts: "09:15:12",
    tag: "HANDOFF",
    col: R.muted,
    actor: "you",
    station: 1,
    msg: "You assemble the context by hand",
  },
  {
    ts: "09:31:40",
    tag: "DRAFT",
    col: R.blue,
    actor: "tool",
    station: 1,
    msg: "A tidy document appears. Waiting for you.",
  },
  { ts: "--", tag: "DESIGN", col: R.faint, msg: "The document never becomes screens", dead: true },
  { ts: "--", tag: "BUILD", col: R.faint, msg: "Never happens here", dead: true },
  { ts: "--", tag: "SHIP", col: R.faint, msg: "Someone else's job now", dead: true },
  { ts: "--", tag: "LEARN", col: R.faint, msg: "Nobody checks how the story ended", dead: true },
];

export const FAIL_LOG: LogEntry[] = [
  {
    ts: "11:41:05",
    tag: "BUILD",
    col: R.amber,
    actor: "agent",
    agentName: "Builder",
    station: 4,
    msg: "Agents dispatched",
  },
  {
    ts: "11:47:32",
    tag: "CI",
    col: R.red,
    actor: "agent",
    agentName: "Builder",
    station: 4,
    msg: "Failed: 3 tests red, API contract mismatch",
  },
  {
    ts: "11:47:40",
    tag: "DIAGNOSE",
    col: R.blue,
    actor: "agent",
    agentName: "Critic",
    station: 4,
    msg: "Reading the failure",
  },
  {
    ts: "11:48:04",
    tag: "ROOT CAUSE",
    col: R.muted,
    actor: "agent",
    agentName: "Critic",
    station: 4,
    msg: "Response schema changed: user_id renamed to uid",
  },
  {
    ts: "11:48:41",
    tag: "REVISE",
    col: R.blue,
    actor: "agent",
    agentName: "Architect",
    station: 2,
    msg: "Spec revised, one clause corrected",
  },
  {
    ts: "11:49:03",
    tag: "DESIGN",
    col: R.blue,
    actor: "agent",
    agentName: "Designer",
    station: 3,
    msg: "States rechecked against the revised spec, no screen change",
  },
  {
    ts: "11:49:12",
    tag: "BUILD",
    col: R.amber,
    actor: "agent",
    agentName: "Builder",
    station: 4,
    msg: "Rebuild: 1 corrected commit",
  },
  {
    ts: "11:54:47",
    tag: "CI",
    col: R.green,
    actor: "agent",
    agentName: "Builder",
    station: 4,
    msg: "All 17 tests passing",
  },
  {
    ts: "11:55:20",
    tag: "GATE",
    col: R.ember,
    actor: "you",
    station: 4,
    msg: "Your merge gate. Approved.",
    gate: true,
  },
  {
    ts: "11:56:02",
    tag: "SHIP",
    col: R.green,
    actor: "agent",
    agentName: "Builder",
    station: 5,
    msg: "Deployed. The loop never stopped.",
  },
  {
    ts: "11:56:04",
    tag: "MEMORY",
    col: "#E8B44C",
    actor: "agent",
    agentName: "Brain",
    station: 6,
    msg: "Failure pattern written back. The next build starts around it.",
    mark: true,
  },
];

const STATIONS = ["Discover", "Decide", "Plan", "Design", "Build", "Ship", "Learn"] as const;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setOn(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, on };
}

// Sequential flow: entries appear one at a time, each dot pulsing in turn.
// The finished trace holds a few seconds, then fades out and replays from the
// top (founder 2026-07-15) so the flow always reads as a flow, never a static
// screen. Reduced motion renders the finished list immediately, no loop.
function useSequentialFlow(total: number, revealed: boolean, stepMs = 900, holdMs = 5500) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const [active, setActive] = useState(-1);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!revealed) {
      setShown(0);
      setActive(-1);
      return;
    }
    if (reduced) {
      setShown(total);
      setActive(-1);
      return;
    }
    // First run starts fast; replays give the faded-out list a beat to clear.
    const t = setTimeout(
      () => {
        setShown(1);
        setActive(0);
      },
      cycle === 0 ? 350 : 650,
    );
    return () => clearTimeout(t);
  }, [revealed, reduced, total, cycle]);

  useEffect(() => {
    if (reduced || active < 0 || active >= total) return;
    const t = setTimeout(() => {
      if (active + 1 < total) {
        setShown(active + 2);
        setActive(active + 1);
      } else {
        setActive(-1);
      }
    }, stepMs);
    return () => clearTimeout(t);
  }, [active, total, stepMs, reduced]);

  // The replay: once the whole trace is on screen and settled, hold, then
  // clear (rows fade via their own transitions) and bump the cycle.
  useEffect(() => {
    if (reduced || !revealed || total === 0) return;
    if (active !== -1 || shown !== total) return;
    const t = setTimeout(() => {
      setShown(0);
      setActive(-1);
      setCycle((c) => c + 1);
    }, holdMs);
    return () => clearTimeout(t);
  }, [active, shown, total, revealed, reduced, holdMs]);

  return { shown, active };
}

// Shared-clock progress: the bar always moves 0 to 1 over fillMs at constant
// speed, lingers complete, then dissolves and refills. Never sweeps backward.
// Labels and bar derive from the same clock so a station lights the exact
// frame the bar's edge reaches it. Reduced motion pins it at complete.
function useSharedClock(revealed: boolean, fillMs = 10_000) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [resetting, setResetting] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    if (reduced) {
      setProgress(1);
      setResetting(false);
      return;
    }
    let frameId: number;
    const HOLD = 2200;
    const FADE = 600;
    const CYCLE = fillMs + HOLD + FADE;
    const start = Date.now();
    const animate = () => {
      const t = (Date.now() - start) % CYCLE;
      if (t < fillMs) {
        setProgress(t / fillMs);
        setResetting(false);
      } else if (t < fillMs + HOLD) {
        setProgress(1);
        setResetting(false);
      } else {
        setProgress(1);
        setResetting(true);
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [revealed, reduced, fillMs]);
  return { progress, resetting };
}

function ReplayChip() {
  return (
    <span
      style={{
        marginLeft: "auto",
        fontFamily: MONO,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: R.faint,
        border: `1px solid ${R.border}`,
        borderRadius: 4,
        padding: "1px 6px",
        flexShrink: 0,
      }}
    >
      replay
    </span>
  );
}

/** The six stations as a compact horizontal spine. Stations light as the
 * trace below reaches them; the one being worked right now is the machine
 * voice (blue), finished ones settle to silver. */
export function StationSpine({ litThrough, active }: { litThrough: number; active?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--geist-space-2x)",
        flexWrap: "wrap",
        marginBottom: 24,
      }}
    >
      {STATIONS.map((s, i) => {
        const isActive = active != null && active === i;
        return (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: MONO,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? R.blue : i <= litThrough ? R.text : R.faint,
                transition: "color 0.4s ease",
              }}
            >
              {s}
            </span>
            {i < STATIONS.length - 1 && (
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 1,
                  background:
                    i < litThrough || (isActive && i <= litThrough)
                      ? "rgba(255,255,255,0.28)"
                      : R.divider,
                  display: "inline-block",
                  transition: "background 0.4s ease",
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Sequential step timeline. Ember appears only on gate rows. The clock is
 * owned by the parent so the station spine lights in step with the trace. */
export function FlowList({
  entries,
  shown,
  active,
}: {
  entries: LogEntry[];
  shown: number;
  active: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {entries.map((e, i) => {
        const visible = i < shown;
        const isActive = i === active;
        const isDone = visible && !isActive && (active < 0 || i < active);
        return (
          <div
            key={`${i}-${e.ts}`}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "stretch",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-8px)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 18,
                flexShrink: 0,
              }}
            >
              <div style={{ marginTop: 13 }}>
                {isActive && !e.dead ? (
                  <div style={{ position: "relative", width: 14, height: 14 }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: -3,
                        borderRadius: "50%",
                        border: `1.5px solid ${e.col}`,
                        animation: "landingRingPulse 1.3s ease-out infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 3,
                        borderRadius: "50%",
                        background: e.col,
                      }}
                    />
                  </div>
                ) : isDone && !e.dead ? (
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: e.col,
                      opacity: 0.65,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.09)",
                    }}
                  />
                )}
              </div>
              {i < entries.length - 1 && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    minHeight: 14,
                    background: isDone && !e.dead ? "rgba(255,255,255,0.16)" : R.divider,
                    transition: "background 0.6s ease",
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: i < entries.length - 1 ? 12 : 0, paddingTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "var(--geist-space-2x)",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontFamily: MONO, color: R.faint }}>{e.ts}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontWeight: 600,
                    color: e.dead ? R.faint : e.col,
                    letterSpacing: "0.05em",
                  }}
                >
                  {e.tag}
                </span>
                {e.actor && <ActorChip actor={e.actor} agentName={e.agentName} />}
                {e.mark && (
                  <span
                    aria-hidden
                    style={{
                      display: "inline-flex",
                      animation: "landingMarkSpin 9s linear infinite",
                    }}
                  >
                    <SupaprodMark size={16} glow={false} />
                  </span>
                )}
              </div>
              <p
                style={{
                  lineHeight: 1.55,
                  color: e.dead ? R.faint : e.gate ? R.text : R.muted,
                  margin: 0,
                  fontStyle: e.dead ? "italic" : "normal",
                }}
              >
                {e.msg}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The decision card mock: signal to approved to building, on one clock. */
export function MockDecisionCard({ revealed }: { revealed: boolean }) {
  const { progress, resetting } = useSharedClock(revealed);
  // Five stations sit at even quarters of the track; deriving at x4 lights
  // each label the exact frame the bar's edge reaches it.
  const step = Math.min(Math.floor(progress * 4), 4);
  const labels = [
    "Signal detected",
    "Decision proposed",
    "You approved",
    "Design drafted",
    "Agents dispatched",
  ];
  const stepCols = [R.blue, R.blue, R.ember, R.blue, R.amber];
  // Discover, not Sense. This is the PUBLIC landing page, so it was showing a
  // word that exists nowhere in the product to people who have never seen the
  // product (founder ruling 2026-08-01). The STATIONS list further up this same
  // file already said Discover, so the page disagreed with itself.
  const spineLabels = ["Discover", "Decide", "Plan", "Design", "Build"];

  return (
    <div
      className="replay-frame"
      style={{
        background: R.card,
        border: `1px solid ${R.border}`,
        borderRadius: 12,
        padding: "var(--geist-space-4x)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--geist-space-2x)",
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `1px solid ${R.border}`,
        }}
      >
        <span style={{ color: R.muted, fontFamily: MONO }}>supaprod / today</span>
        <ReplayChip />
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${R.border}`,
          borderRadius: 8,
          padding: "var(--geist-space-3x)",
          transition: "all 0.4s ease",
        }}
      >
        <div style={{ display: "flex", gap: "var(--geist-space-2x)", alignItems: "flex-start" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: stepCols[step],
              flexShrink: 0,
              marginTop: 4,
              transition: "background 0.4s ease",
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: MONO,
                color: stepCols[step],
                letterSpacing: "0.1em",
                marginBottom: 5,
                transition: "color 0.4s ease",
              }}
            >
              {labels[step]}
            </div>
            <p style={{ color: R.text, margin: "0 0 8px", lineHeight: 1.4 }}>
              Simplify onboarding step 2
            </p>
            <p style={{ color: R.muted, margin: 0, lineHeight: 1.5 }}>
              {step === 0 && "3 signals clustered: friction at step 2 rising."}
              {step === 1 && "Precedent: similar fix, D+14 activation +9%."}
              {step === 2 && "Your call. Spec locked: 4 criteria."}
              {step === 3 && "Screens, states, and copy drafted from the spec."}
              {step === 4 && "3 commits. CI passing. Merge queued."}
            </p>
          </div>
          {step === 1 && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid rgba(255,107,44,0.45)`,
                background: "rgba(255,107,44,0.1)",
                color: R.ember,
                fontFamily: "Geist, sans-serif",
                flexShrink: 0,
              }}
            >
              Approve
            </span>
          )}
          {step >= 2 && <span style={{ color: R.green, flexShrink: 0 }}>✓</span>}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 2, background: R.divider, borderRadius: 1, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 1,
              background: "rgba(230,232,235,0.55)",
              width: `${Math.min(progress * 100, 100)}%`,
              opacity: resetting ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {spineLabels.map((s, i) => (
            <span
              key={s}
              style={{
                fontFamily: MONO,
                color: i <= step ? R.text : R.faint,
                transition: "color 0.4s",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The agent mesh mock: four agents clear four quarters of the same clock. */
export function MockLiveRun({ revealed }: { revealed: boolean }) {
  const AGENTS = [
    { name: "Scout", act: "clustered 3 signals", col: R.blue },
    { name: "Architect", act: "spec locked, 4 criteria", col: R.blue },
    { name: "Designer", act: "screens drafted from spec", col: R.blue },
    { name: "Builder", act: "3 commits, CI green", col: R.amber },
    { name: "Sentry", act: "watching D+14 outcome", col: R.green },
  ];
  const { progress, resetting } = useSharedClock(revealed);
  const step = Math.min(Math.floor(progress * AGENTS.length), AGENTS.length);
  const working = Math.min(step + 1, AGENTS.length);
  const allDone = step >= AGENTS.length;
  // The ETA falls off the same clock as the bar: 8 minutes down to 1, then shipped.
  const etaMin = Math.max(1, Math.ceil((1 - progress) * 8));

  return (
    <div
      className="replay-frame"
      style={{
        background: R.card,
        border: `1px solid ${R.border}`,
        borderRadius: 12,
        padding: "var(--geist-space-4x)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--geist-space-2x)",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `1px solid ${R.border}`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: allDone ? R.green : R.blue,
            transition: "background 0.4s ease",
          }}
        />
        <span style={{ color: R.muted, fontFamily: MONO }}>live run / agent mesh</span>
        <span style={{ marginLeft: "auto", color: R.faint, fontFamily: MONO }}>
          {allDone ? "run complete" : `${working}/${AGENTS.length} working`}
        </span>
      </div>
      {AGENTS.map((a, i) => {
        const done = step > i;
        const isActive = step === i;
        const col = done ? R.green : isActive ? a.col : R.faint;
        return (
          <div
            key={a.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: i < AGENTS.length - 1 ? `1px solid ${R.divider}` : undefined,
              opacity: done || isActive ? 1 : 0.45,
              transition: "opacity 0.4s ease",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: col,
                flexShrink: 0,
                transition: "background 0.4s ease",
              }}
            />
            <span style={{ fontWeight: 600, color: R.text, flexShrink: 0, width: 64 }}>
              {a.name}
            </span>
            <span style={{ color: R.muted, flex: 1, lineHeight: 1.3 }}>{a.act}</span>
            <span
              style={{
                fontFamily: MONO,
                letterSpacing: "0.06em",
                color: col,
                flexShrink: 0,
              }}
            >
              {done ? "done" : isActive ? "running" : "queued"}
            </span>
          </div>
        );
      })}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{ flex: 1, height: 2, background: R.divider, borderRadius: 1, overflow: "hidden" }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(progress * 100, 100)}%`,
              background: "rgba(230,232,235,0.55)",
              opacity: resetting ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: MONO,
            color: allDone ? R.green : R.faint,
            flexShrink: 0,
            transition: "color 0.4s ease",
          }}
        >
          {allDone ? "shipped ✓" : `ETA to ship ${etaMin} min`}
        </span>
      </div>
    </div>
  );
}

/** The drafting dead-end: nothing dispatched, nothing watched, nothing learned. */
function DeadRun() {
  const AGENTS = [
    { name: "Scout", act: "no signal watch running" },
    { name: "Architect", act: "waiting on your handoff" },
    { name: "Designer", act: "no spec to design from" },
    { name: "Builder", act: "nothing was dispatched" },
    { name: "Sentry", act: "no outcome to watch" },
  ];
  return (
    <div
      className="replay-frame"
      style={{
        background: R.card,
        border: `1px solid ${R.border}`,
        borderRadius: 12,
        padding: "var(--geist-space-4x)",
        opacity: 0.6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--geist-space-2x)",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `1px solid ${R.border}`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: R.faint }} />
        <span style={{ color: R.muted, fontFamily: MONO }}>live run / agent mesh</span>
        <span style={{ marginLeft: "auto", color: R.faint, fontFamily: MONO }}>0/5 working</span>
      </div>
      {AGENTS.map((a, i) => (
        <div
          key={a.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            borderBottom: i < AGENTS.length - 1 ? `1px solid ${R.divider}` : undefined,
            opacity: 0.5,
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: "50%", background: R.faint, flexShrink: 0 }}
          />
          <span style={{ fontWeight: 600, color: R.muted, flexShrink: 0, width: 64 }}>
            {a.name}
          </span>
          <span style={{ color: R.faint, flex: 1, lineHeight: 1.3 }}>{a.act}</span>
          <span
            style={{
              fontFamily: MONO,
              letterSpacing: "0.06em",
              color: R.faint,
              flexShrink: 0,
            }}
          >
            idle
          </span>
        </div>
      ))}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 2, background: R.divider, borderRadius: 1 }} />
        <span style={{ fontFamily: MONO, color: R.faint, flexShrink: 0 }}>
          the timeline ends here
        </span>
      </div>
    </div>
  );
}

/** A gentle 3D tilt tracking the pointer: the product frames sit on glass.
 * Direct style writes (no state) with a short ease so the motion has weight;
 * still for touch and reduced-motion users. */
function TiltFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * 3.5).toFixed(2)}deg) rotateY(${(px * 4.5).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: "transform 0.25s ease-out", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

export type ReplayTab = "full" | "others" | "failure";

const TAB_CONFIG: Record<ReplayTab, { log: LogEntry[]; litThrough: number; caption: string }> = {
  full: {
    log: FULL_LOG,
    litThrough: 6,
    caption:
      "Agents ran twelve steps in nineteen minutes. You made two calls. Every one is on the record.",
  },
  others: {
    log: OTHERS_LOG,
    litThrough: 0,
    caption: "This is where every other tool stops.",
  },
  failure: {
    log: FAIL_LOG,
    litThrough: 6,
    caption: "It never stopped; it recovered. Your gate stayed in the middle the whole time.",
  },
};

/** One tab's replay body: owns the trace clock so spine and timeline agree. */
function TabReplay({ tab, on }: { tab: ReplayTab; on: boolean }) {
  const cfg = TAB_CONFIG[tab];
  const { shown, active } = useSequentialFlow(cfg.log.length, on);

  // The spine follows the trace: lit through the furthest station the replay
  // has reached; the station being worked right now reads in machine blue.
  const played = cfg.log.slice(0, Math.max(shown, 0));
  const litThrough = played.reduce(
    (max, e) => (e.station != null && e.station > max ? e.station : max),
    -1,
  );
  const activeStation = active >= 0 ? cfg.log[active]?.station : undefined;

  return (
    <div>
      <StationSpine litThrough={litThrough} active={activeStation} />
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--geist-space-3x)",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: R.faint,
              }}
            >
              mission trace / replayed
            </span>
            <span style={{ fontFamily: MONO, color: R.faint }}>
              {/* "memory sharpens it" until 2026-08-10. The three nouns here
                  are the three layers in miniature, and the third one was the
                  banned framing: a memory is a place things sit, and CLAUDE.md
                  and README both hold that storage is the claim we do not make
                  because any vendor can make it. The brain's verbs are LEARNS
                  and GUIDES, and "guides the next" also says the compounding
                  out loud, which "sharpens it" left implicit. Same length,
                  same rhythm, same marigold. */}
              <span style={{ color: R.blue }}>agent</span> runs it &middot;{" "}
              <span style={{ color: R.ember }}>you</span> gate it &middot;{" "}
              <span style={{ color: "#E8B44C" }}>the brain</span> guides the next
            </span>
          </div>
          <FlowList entries={cfg.log} shown={shown} active={active} />
        </div>
        <div className="flex flex-col gap-4">
          {tab === "others" ? (
            <TiltFrame>
              <DeadRun />
            </TiltFrame>
          ) : (
            <TiltFrame>
              <div className="flex flex-col gap-4">
                <MockDecisionCard revealed={on} />
                <MockLiveRun revealed={on} />
              </div>
            </TiltFrame>
          )}
          <p
            style={{
              lineHeight: 1.6,
              color: tab === "others" ? R.text : R.muted,
              margin: 0,
            }}
          >
            {cfg.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

/** One tab's full replay: spine, timeline, and the product frames. */
export function LoopReplay({ tab }: { tab: ReplayTab }) {
  const { ref, on } = useReveal();
  return (
    <div ref={ref}>
      <style>{`
        @keyframes landingRingPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes landingMarkSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Pre-rendered silver edge light, toggled by opacity (never animate
           box-shadow). White light, not color: the ink-and-metal law. */
        .replay-frame { position: relative; }
        .replay-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 12px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 0 24px rgba(255,255,255,0.05);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .replay-frame:hover::after { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .landing-replay * { animation: none !important; }
        }
      `}</style>
      <div className="landing-replay">
        <TabReplay key={tab} tab={tab} on={on} />
      </div>
    </div>
  );
}
