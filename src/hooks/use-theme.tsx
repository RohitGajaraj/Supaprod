import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "cadence.theme";
// Tempo v5 theme law (DESIGN-TEMPO.md section 1): dark is the default experience.
const DEFAULT_THEME: Theme = "dark";

type ThemeContextValue = {
  /** The user's chosen mode, including "system". */
  theme: Theme;
  /** What is actually on screen after resolving "system". */
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersLight(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function resolveTheme(t: Theme): ResolvedTheme {
  if (t === "system") return systemPrefersLight() ? "light" : "dark";
  return t;
}

function applyThemeClass(t: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Tempo v5 contract, agreed with the styles.css unit: dark = the 'dark'
  // class with NO data-theme attribute (:root already holds the dark tokens);
  // light = data-theme='light' with the 'dark' class removed, so the
  // [data-theme='light'] token block in styles.css actually applies.
  if (t === "dark") {
    root.classList.add("dark");
    delete root.dataset.theme;
  } else {
    root.dataset.theme = "light";
    root.classList.remove("dark");
  }
  // Aurora theme retired with the Ember Editorial design system; clear the
  // class in case a stale bootstrap or extension left it behind.
  root.classList.remove("aurora");
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light" || v === "system") return v;
    // Legacy stored theme from the pre-Ember generation.
    if (v === "aurora") return "dark";
  } catch {
    /* noop */
  }
  return DEFAULT_THEME;
}

// The toggle walks the full trio so system preference is a first-class stop
// (light -> dark -> system -> light), the Vercel/Linear register.
const CYCLE: Theme[] = ["light", "dark", "system"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with default; hydrate from localStorage in an effect.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = resolveTheme(stored);
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  // While in system mode, follow live OS preference changes.
  useEffect(() => {
    if (theme !== "system") return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const resolved: ResolvedTheme = mq.matches ? "light" : "dark";
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    const resolved = resolveTheme(t);
    setThemeState(t);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* noop */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((cur) => {
      const idx = CYCLE.indexOf(cur);
      const next: Theme = CYCLE[(idx + 1) % CYCLE.length];
      const resolved = resolveTheme(next);
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback so the hook works outside provider (no-op setters).
    return {
      theme: DEFAULT_THEME,
      resolvedTheme: "dark",
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
