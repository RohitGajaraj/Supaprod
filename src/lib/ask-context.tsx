import * as React from "react";
import { useRouterState } from "@tanstack/react-router";

// OBS-12 - Ask (Cmd+J) is a summonable panel, not a rail destination. This
// provider owns open/closed state + the plain-words "About: X" context label
// derived from the current route, so the panel never needs its own router
// awareness. Cmd/Ctrl+J is a modifier combo, so it stays active even when
// focus sits in an input (unlike the bare 1-5/g rail shortcuts).

// PC-36 workstream B: the "About: X" label above used to be purely cosmetic
// text (Ask always ran an unscoped global k=4 lookup regardless of screen,
// even though the empty state promised "I can also read {context} in front
// of you"). AskScope makes that promise real for the screens where the
// mapping is unambiguous; everywhere else stays unscoped (current behavior)
// rather than guess a source_kind mapping we're not confident about.
export type AskScope = {
  kinds?: string[];
  sourceId?: string | null;
  /** Short label for the scope chip, e.g. "this mission". */
  label: string;
};

export function scopeForPath(pathname: string, missionId: string | null): AskScope | null {
  if (pathname.startsWith("/build") && missionId) {
    return { kinds: ["mission"], sourceId: missionId, label: "this mission" };
  }
  if (pathname.startsWith("/plan")) return { kinds: ["prd"], label: "PRDs" };
  if (pathname.startsWith("/brain") || pathname.startsWith("/knowledge")) {
    return { kinds: ["doc", "note", "finding"], label: "Brain" };
  }
  return null;
}

type AskState = {
  isOpen: boolean;
  context: string;
  scope: AskScope | null;
  pendingIntent: string | null;
  summon: () => void;
  close: () => void;
  toggle: () => void;
  runIntent: (intent: string) => void;
  clearPendingIntent: () => void;
};

const AskContext = React.createContext<AskState | null>(null);

export function contextForPath(pathname: string, missionId: string | null): string {
  if (pathname.startsWith("/today")) return "Today";
  if (pathname.startsWith("/discover")) return "Discover";
  if (pathname.startsWith("/plan")) return "Plan";
  if (pathname.startsWith("/build")) return missionId ? "a mission" : "Build";
  if (pathname.startsWith("/brain") || pathname.startsWith("/knowledge")) return "Brain";
  if (pathname.startsWith("/engine-room") || pathname.startsWith("/govern")) {
    return "Pulse";
  }
  return "this screen";
}

export function AskProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pendingIntent, setPendingIntent] = React.useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const missionId = useRouterState({
    select: (s) => {
      const search = s.location.search as Record<string, unknown>;
      return typeof search?.mission === "string" ? search.mission : null;
    },
  });

  const context = React.useMemo(() => contextForPath(pathname, missionId), [pathname, missionId]);
  const scope = React.useMemo(() => scopeForPath(pathname, missionId), [pathname, missionId]);

  const summon = React.useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setPendingIntent(null);
  }, []);
  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  const runIntent = React.useCallback((intent: string) => {
    setPendingIntent(intent);
    setIsOpen(true);
  }, []);
  const clearPendingIntent = React.useCallback(() => {
    setPendingIntent(null);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  React.useEffect(() => {
    const onOpenAsk = (e: Event) => {
      const intent = (e as CustomEvent<{ intent?: string }>).detail?.intent;
      const trimmed = intent?.trim();
      if (trimmed) {
        runIntent(trimmed);
      } else {
        summon();
      }
    };
    window.addEventListener("cadence:open-ask", onOpenAsk);
    return () => window.removeEventListener("cadence:open-ask", onOpenAsk);
  }, [summon, runIntent]);

  const value = React.useMemo(
    () => ({
      isOpen,
      context,
      scope,
      pendingIntent,
      summon,
      close,
      toggle,
      runIntent,
      clearPendingIntent,
    }),
    [isOpen, context, scope, pendingIntent, summon, close, toggle, runIntent, clearPendingIntent],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAsk(): AskState {
  const ctx = React.useContext(AskContext);
  if (!ctx) throw new Error("useAsk must be used within AskProvider");
  return ctx;
}
