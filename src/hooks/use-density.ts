import { useCallback, useEffect, useState } from "react";

// OBS-13 - the density toggle (You pane): writes `data-density` on the
// `[data-obsidian]` root (mounted by OBS-02 on `_authenticated.tsx`) and
// persists the choice client-side. Consumes the `--density-*` tokens OBS-01
// shipped; no server call.

export type Density = "comfortable" | "compact";
const STORAGE_KEY = "cad-density";

function applyDensity(value: Density) {
  document.querySelector("[data-obsidian]")?.setAttribute("data-density", value);
}

export function useDensity(): [Density, (next: Density) => void] {
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: Density = stored === "compact" ? "compact" : "comfortable";
    setDensity(initial);
    applyDensity(initial);
  }, []);

  const setAndPersist = useCallback((next: Density) => {
    setDensity(next);
    applyDensity(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return [density, setAndPersist];
}
