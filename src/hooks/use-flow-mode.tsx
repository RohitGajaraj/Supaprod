import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast, setFlowActive, drainHeldNotifications, heldCount } from "@/lib/notify";
import { playChime, playCue, playStart } from "@/lib/flow/chime";
import * as soundscape from "@/lib/flow/soundscape";
import {
  appendFocusHistory,
  endsAtFor,
  safeLocalStorage,
  formatRemaining,
  isResumable,
  phaseOf,
  remainingMs,
  type FlowSession,
  type FocusPhase,
  type SoundPreset,
} from "@/lib/flow/session";

// Flow mode: a calm operating stance. While on, the chrome dims, an ambient
// soundscape plays, a focus timer runs, and non-urgent toasts are held and
// summarized on exit. State mirrors use-theme.tsx (context + localStorage + a
// documentElement class); the audio + toast machinery lives in lib/flow/* and
// lib/notify.ts (Engine-Room: hidden behind this one control).
//
// PM Desk (founder goal 2026-07-09): the session now carries the PM's one-line
// intent and its phase. Past the halfway mark the countdown brightens; the
// closing stretch (last 10%, 30s floor) goes ember and fires ONE soft cue; the
// tab title carries the countdown so a block stays visible from any tab. Every
// finished block lands in a small local history ledger.

export type FlowConfig = {
  preset: SoundPreset;
  volume: number; // 0..1
  timerMin: number; // 0 = open-ended
};

type FlowContextValue = {
  isFlowMode: boolean;
  remainingMs: number | null;
  remainingLabel: string;
  heldCount: number;
  soundResumable: boolean; // true after a reload-resume, until the next gesture
  soundUnavailable: boolean; // the chosen track has no file yet (see README)
  /** The PM's one-line goal for the running block, when one was given. */
  intent: string | null;
  /** Epoch ms the running block started, for elapsed display on open blocks. */
  startedAt: number | null;
  /** Where the block stands: early · past-half · closing (null = open-ended). */
  phase: FocusPhase | null;
  config: FlowConfig;
  setConfig: (patch: Partial<FlowConfig>) => void;
  enterFlow: (patch?: Partial<FlowConfig> & { intent?: string }) => void;
  exitFlow: () => void;
  /** Push the running block's deadline out by N minutes. */
  extendSession: (minutes: number) => void;
  resumeSound: () => void;
};

const CONFIG_KEY = "supaprod.flow.config";
const SESSION_KEY = "supaprod.flow.session";

// Sound defaults OFF (founder correction, 2026-07-09): starting a block must
// never surprise a PM in a professional setting with ambient audio. Sound is
// an explicit, opt-in choice — a preset the PM picks, never a default.
const DEFAULT_CONFIG: FlowConfig = { preset: "off", volume: 0.5, timerMin: 25 };

const FlowContext = createContext<FlowContextValue | null>(null);

function applyFlowClass(active: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("flow", active);
}

function readConfig(): FlowConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<FlowConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeConfig(config: FlowConfig) {
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* noop */
  }
}

function readSession(): FlowSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as FlowSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: FlowSession | null) {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

function plural(n: number): string {
  return n === 1 ? "" : "s";
}

export function FlowModeProvider({ children }: { children: ReactNode }) {
  const [isFlowMode, setIsFlowMode] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [held, setHeld] = useState(0);
  const [soundResumable, setSoundResumable] = useState(false);
  const [soundUnavailable, setSoundUnavailable] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [phase, setPhase] = useState<FocusPhase | null>(null);
  const [config, setConfigState] = useState<FlowConfig>(DEFAULT_CONFIG);

  // Latest values for the interval + completion path without resubscribing.
  const configRef = useRef(config);
  configRef.current = config;
  // Mirrors endsAt for exitFlow's history clamp: a machine that slept through
  // the deadline must not record the suspended hours as focused time.
  const endsAtRef = useRef<number | null>(null);
  endsAtRef.current = endsAt;
  const exitRef = useRef<(reason: "manual" | "completed") => void>(() => {});
  // Session shape the interval + exit paths need without re-subscribing:
  // intent/startedAt/plannedMin feed the history entry; cued gates the one
  // soft closing cue; preTitle restores the tab title after the block.
  const intentRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const plannedMinRef = useRef(0);
  const cuedRef = useRef(false);
  const preTitleRef = useRef<string | null>(null);

  // Hydrate config + resume an in-flight session after a reload.
  useEffect(() => {
    setConfigState(readConfig());
    // The pre-Desk strip timer is retired; clear its stray key once.
    try {
      window.localStorage.removeItem("supaprod.focus.timer");
    } catch {
      /* noop */
    }
    const session = readSession();
    const now = Date.now();
    if (isResumable(session, now) && session) {
      setIsFlowMode(true);
      applyFlowClass(true);
      setFlowActive(true);
      setEndsAt(session.endsAt);
      setRemaining(remainingMs(session.endsAt, now));
      setIntent(session.intent ?? null);
      setStartedAt(session.startedAt ?? null);
      setPhase(phaseOf(session, now));
      intentRef.current = session.intent ?? null;
      startedAtRef.current = session.startedAt ?? null;
      plannedMinRef.current = session.plannedMin ?? 0;
      cuedRef.current = session.cued === true;
      preTitleRef.current = document.title;
      // Audio can't auto-start without a gesture; offer a resume tap instead.
      setSoundResumable(session.preset !== "off");
    } else if (session) {
      writeSession(null);
    }
  }, []);

  const exitFlow = useCallback((reason: "manual" | "completed" = "manual") => {
    soundscape.stop();
    applyFlowClass(false);
    setFlowActive(false);
    setIsFlowMode(false);
    setEndsAt(null);
    setRemaining(null);
    setSoundResumable(false);
    writeSession(null);

    // The finished block lands in the local ledger (the Desk's daily tally).
    // A completed block clamps its end to the deadline (review fix): waking a
    // slept machine fires the completion tick hours late, and those suspended
    // hours are not focused minutes.
    if (startedAtRef.current !== null) {
      const now = Date.now();
      const endedAt =
        reason === "completed" && endsAtRef.current !== null
          ? Math.min(now, endsAtRef.current)
          : now;
      appendFocusHistory(safeLocalStorage(), {
        intent: intentRef.current,
        startedAt: startedAtRef.current,
        endedAt,
        plannedMin: plannedMinRef.current,
        completed: reason === "completed",
      });
    }
    const endedIntent = intentRef.current;
    setIntent(null);
    setStartedAt(null);
    setPhase(null);
    intentRef.current = null;
    startedAtRef.current = null;
    plannedMinRef.current = 0;
    cuedRef.current = false;
    if (preTitleRef.current !== null && typeof document !== "undefined") {
      document.title = preTitleRef.current;
      preTitleRef.current = null;
    }

    const { count } = drainHeldNotifications();
    if (reason === "completed") {
      const tail = count > 0 ? ` ${count} update${plural(count)} while you were focused.` : "";
      if (endedIntent) toast.success(`Time called on "${endedIntent}".${tail}`);
      else toast.success(`Focus block done.${tail}`);
    } else if (count > 0) {
      toast(`While you were focused · ${count} update${plural(count)}`);
    }
  }, []);
  exitRef.current = exitFlow;

  const enterFlow = useCallback((patch?: Partial<FlowConfig> & { intent?: string }) => {
    const { intent: rawIntent, ...configPatch } = patch ?? {};
    const next = { ...configRef.current, ...configPatch };
    if (Object.keys(configPatch).length > 0) {
      setConfigState(next);
      writeConfig(next);
    }
    const now = Date.now();
    const deadline = endsAtFor(next.timerMin, now);
    const blockIntent = rawIntent?.trim().slice(0, 120) || undefined;

    setIsFlowMode(true);
    applyFlowClass(true);
    setFlowActive(true);
    setEndsAt(deadline);
    setRemaining(remainingMs(deadline, now));
    setIntent(blockIntent ?? null);
    setStartedAt(now);
    setSoundResumable(false);
    setSoundUnavailable(false);
    intentRef.current = blockIntent ?? null;
    startedAtRef.current = now;
    plannedMinRef.current = next.timerMin;
    cuedRef.current = false;
    if (typeof document !== "undefined" && preTitleRef.current === null) {
      preTitleRef.current = document.title;
    }
    const session: FlowSession = {
      endsAt: deadline,
      preset: next.preset,
      soundOn: next.preset !== "off",
      intent: blockIntent,
      startedAt: now,
      plannedMin: next.timerMin,
      cued: false,
    };
    setPhase(phaseOf(session, now));
    writeSession(session);

    // Sound is opt-in only (founder correction, 2026-07-09): a block starting
    // is consequential, but it may NEVER surprise a PM in a professional
    // setting with unrequested audio. The start cue and the ambient track
    // both gate on the same signal — the preset the PM explicitly picked.
    if (next.preset !== "off") {
      playStart();
      void soundscape.start(next.preset, next.volume).then((ok) => {
        if (!ok) setSoundUnavailable(true);
      });
    }
  }, []);

  // Push the deadline out. Leaving the closing stretch re-arms the soft cue,
  // so a genuinely extended block gets its wrap-up nudge again.
  const extendSession = useCallback(
    (minutes: number) => {
      if (!isFlowMode || endsAt === null || minutes <= 0) return;
      const now = Date.now();
      const nextEnds = endsAt + minutes * 60_000;
      setEndsAt(nextEnds);
      setRemaining(remainingMs(nextEnds, now));
      const stored = readSession();
      const session: FlowSession = {
        endsAt: nextEnds,
        preset: stored?.preset ?? configRef.current.preset,
        soundOn: stored?.soundOn ?? configRef.current.preset !== "off",
        intent: intentRef.current ?? undefined,
        startedAt: startedAtRef.current ?? undefined,
        plannedMin: plannedMinRef.current + minutes,
        cued: cuedRef.current,
      };
      plannedMinRef.current = session.plannedMin ?? 0;
      const nextPhase = phaseOf(session, now);
      if (nextPhase !== "closing" && cuedRef.current) {
        cuedRef.current = false;
        session.cued = false;
      }
      setPhase(nextPhase);
      writeSession(session);
    },
    [isFlowMode, endsAt],
  );

  const setConfig = useCallback(
    (patch: Partial<FlowConfig>) => {
      const next = { ...configRef.current, ...patch };
      setConfigState(next);
      writeConfig(next);
      if (!isFlowMode) return;
      if (patch.preset !== undefined) {
        setSoundUnavailable(false);
        if (next.preset === "off") {
          soundscape.stop();
        } else {
          void soundscape.setPreset(next.preset, next.volume).then((ok) => {
            if (!ok) setSoundUnavailable(true);
          });
        }
      } else if (patch.volume !== undefined) {
        soundscape.setVolume(next.volume);
      }
    },
    [isFlowMode],
  );

  const resumeSound = useCallback(() => {
    setSoundUnavailable(false);
    void soundscape.start(configRef.current.preset, configRef.current.volume).then((ok) => {
      if (!ok && configRef.current.preset !== "off") setSoundUnavailable(true);
    });
    setSoundResumable(false);
  }, []);

  // One light tick while flow is on: refresh the countdown + held-toast count,
  // track the block's phase (firing the one soft closing cue), keep the tab
  // title carrying the countdown, and finish the session at zero.
  useEffect(() => {
    if (!isFlowMode) return;
    const id = window.setInterval(() => {
      setHeld(heldCount());
      const now = Date.now();
      if (endsAt !== null) {
        const left = remainingMs(endsAt, now);
        setRemaining(left);
        const liveSession: FlowSession = {
          endsAt,
          preset: configRef.current.preset,
          soundOn: configRef.current.preset !== "off",
          startedAt: startedAtRef.current ?? undefined,
          plannedMin: plannedMinRef.current,
        };
        const nextPhase = phaseOf(liveSession, now);
        setPhase(nextPhase);
        if (nextPhase === "closing" && !cuedRef.current) {
          cuedRef.current = true;
          if (configRef.current.preset !== "off") playCue();
          const stored = readSession();
          if (stored) writeSession({ ...stored, cued: true });
        }
        // The countdown rides the tab title so a block stays visible from any
        // tab; navigation may rewrite it, the next tick reclaims it.
        document.title = `${formatRemaining(left)} · ${intentRef.current ?? "Focus"} · Supaprod`;
        if (left !== null && left <= 0) {
          if (configRef.current.preset !== "off") playChime();
          exitRef.current("completed");
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isFlowMode, endsAt]);

  const value: FlowContextValue = {
    isFlowMode,
    remainingMs: remaining,
    remainingLabel: formatRemaining(remaining),
    heldCount: held,
    soundResumable,
    soundUnavailable,
    intent,
    startedAt,
    phase,
    config,
    setConfig,
    enterFlow,
    exitFlow: () => exitFlow("manual"),
    extendSession,
    resumeSound,
  };

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlowMode(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) {
    // Safe no-op fallback outside the provider (e.g. public pages).
    return {
      isFlowMode: false,
      remainingMs: null,
      remainingLabel: "",
      heldCount: 0,
      soundResumable: false,
      soundUnavailable: false,
      intent: null,
      startedAt: null,
      phase: null,
      config: DEFAULT_CONFIG,
      setConfig: () => {},
      enterFlow: () => {},
      exitFlow: () => {},
      extendSession: () => {},
      resumeSound: () => {},
    };
  }
  return ctx;
}
