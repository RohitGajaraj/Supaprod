import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * THEME. Two grounds, dark and paper, and dark is the one the product is
 * designed on (founder ruling 2026-08-14).
 *
 * SYSTEM PREFERENCE WAS REMOVED IN THE SAME RULING, and the reason is worth
 * keeping because the old comment argued the opposite. "system" was defended
 * here as "the Vercel/Linear register", which is a claim about what other
 * products do rather than a claim about this one. It cost us three things:
 *
 *   1. The product could open in a theme nobody chose. A first-time reviewer on
 *      a light-preference laptop met the paper theme, which is the SECONDARY
 *      ground, on the first screen they ever saw of the product.
 *   2. It made "which theme am I looking at" a two-variable question (the mode
 *      AND the OS), so `theme` and `resolvedTheme` could disagree, and every
 *      consumer had to know which one it wanted.
 *   3. The toggle had three stops for two outcomes, so pressing it twice from
 *      dark did not return you to dark.
 *
 * A theme the product has an opinion about should not be delegated to an OS
 * setting the product cannot see. `Theme` and `ResolvedTheme` are now the same
 * two values, and both names are kept so consumers do not have to change.
 */
export type Theme = "dark" | "light";
export type ResolvedTheme = Theme;

const STORAGE_KEY = "supaprod.theme";
/**
 * LIGHT SINCE 2026-09-14, on the founder's ruling that a first visit should open
 * on the light ground. Both grounds are fully supported and the toggle is
 * unchanged; this is only which one arrives with no stored preference.
 *
 * THREE PLACES DECIDE THE GROUND AND ALL THREE HAD TO MOVE TOGETHER: this
 * constant, the `data-theme` attribute the server paints in `__root.tsx`, and
 * the pre-hydration bootstrap script beside it. Changing this one alone would
 * paint dark on every first load and flash to light at hydration, which is
 * worse than either ground and is the defect that bootstrap exists to prevent.
 */
const DEFAULT_THEME: Theme = "light";

type ThemeContextValue = {
  /** The ground the reader chose. */
  theme: Theme;
  /**
   * The ground actually on screen. Identical to `theme` now that nothing is
   * resolved at runtime. Kept so the existing call sites still compile, and so
   * the distinction is available again if a future ground ever needs resolving.
   */
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(t: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Contract agreed with the styles.css unit: dark = the 'dark' class with NO
  // data-theme attribute (:root already holds the dark tokens); light =
  // data-theme='light' with the 'dark' class removed, so the
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
    if (v === "dark" || v === "light") return v;
    // Migrations. Both retired values resolve to the DEFAULT rather than
    // falling through, so a reader who had picked "system" lands on the ground
    // the product opens on instead of whatever their laptop happened to prefer.
    // Written as the constant, not as a literal: this used to say "dark" and
    // would have kept sending migrated readers there after the default moved.
    if (v === "system" || v === "aurora") return DEFAULT_THEME;
  } catch {
    /* noop */
  }
  return DEFAULT_THEME;
}

function persist(t: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* noop */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with the default, hydrate from localStorage in an effect.
  // The server always paints dark, and dark is now also the default, so the
  // first paint matches the common case and there is no theme flash for it.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyThemeClass(stored);
    // Rewrite storage so a retired value ("system", "aurora") is replaced
    // rather than re-read and re-mapped on every load.
    persist(stored);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyThemeClass(t);
    persist(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((cur) => {
      const next: Theme = cur === "dark" ? "light" : "dark";
      applyThemeClass(next);
      persist(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme, toggleTheme }}>
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
      resolvedTheme: DEFAULT_THEME,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
