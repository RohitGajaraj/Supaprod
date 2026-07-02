import * as React from "react";
import { useRouterState } from "@tanstack/react-router";

// OBS-12 - Ask (Cmd+J) is a summonable panel, not a rail destination. This
// provider owns open/closed state + the plain-words "About: X" context label
// derived from the current route, so the panel never needs its own router
// awareness. Cmd/Ctrl+J is a modifier combo, so it stays active even when
// focus sits in an input (unlike the bare 1-5/g rail shortcuts).

type AskState = {
  isOpen: boolean;
  context: string;
  summon: (context?: string) => void;
  close: () => void;
  toggle: (context?: string) => void;
};

const AskContext = React.createContext<AskState | null>(null);

export function contextForPath(pathname: string, missionId: string | null): string {
  if (pathname.startsWith("/today")) return "Today";
  if (pathname.startsWith("/discover")) return "Discover";
  if (pathname.startsWith("/plan")) return "Plan";
  if (pathname.startsWith("/build")) return missionId ? "a mission" : "Build";
  if (pathname.startsWith("/knowledge")) return "Brain";
  if (pathname.startsWith("/engine-room") || pathname.startsWith("/govern")) {
    return "the Engine Room";
  }
  return "this screen";
}

export function AskProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [explicitContext, setExplicitContext] = React.useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const missionId = useRouterState({
    select: (s) => {
      const search = s.location.search as Record<string, unknown>;
      return typeof search?.mission === "string" ? search.mission : null;
    },
  });

  const derivedContext = React.useMemo(
    () => contextForPath(pathname, missionId),
    [pathname, missionId],
  );
  const context = explicitContext ?? derivedContext;

  const summon = React.useCallback((ctx?: string) => {
    setExplicitContext(ctx ?? null);
    setIsOpen(true);
  }, []);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setExplicitContext(null);
  }, []);
  const toggle = React.useCallback((ctx?: string) => {
    setIsOpen((prev) => {
      if (prev) {
        setExplicitContext(null);
        return false;
      }
      setExplicitContext(ctx ?? null);
      return true;
    });
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
      const seed = (e as CustomEvent<{ seed?: string }>).detail?.seed;
      summon(seed);
    };
    window.addEventListener("cadence:open-ask", onOpenAsk);
    return () => window.removeEventListener("cadence:open-ask", onOpenAsk);
  }, [summon]);

  const value = React.useMemo(
    () => ({ isOpen, context, summon, close, toggle }),
    [isOpen, context, summon, close, toggle],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAsk(): AskState {
  const ctx = React.useContext(AskContext);
  if (!ctx) throw new Error("useAsk must be used within AskProvider");
  return ctx;
}
