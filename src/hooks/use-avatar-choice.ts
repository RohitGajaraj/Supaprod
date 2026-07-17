import { useCallback, useEffect, useState } from "react";

// useAvatarChoice — the user's picked orb (founder ruling 2026-07-14: the user
// controls their avatar from Settings). Persisted device-local (a cosmetic
// preference; a server-synced profile field is a clean follow-up) and keyed by
// the account seed, with a live event so the sidebar chip and the Settings
// picker stay in sync the moment a choice is made. SSR-safe.

// Persisted device-local, under ONE global key (one signed-in user per device),
// so the sidebar chip and the Settings picker always agree regardless of how
// each sources the display name. `seed` is used only for the default orb.
const STORAGE_KEY = "supaprod:avatar";
const EVENT = "supaprod:avatar-changed";

export function getAvatarChoice(_seed?: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isInteger(n) ? n : null;
  } catch {
    return null;
  }
}

export function setAvatarChoice(index: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(index));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { index } }));
  } catch {
    /* ignore quota / privacy-mode failures */
  }
}

export function useAvatarChoice(seed?: string): [number | null, (index: number) => void] {
  const [choice, setChoice] = useState<number | null>(() => getAvatarChoice());
  useEffect(() => {
    setChoice(getAvatarChoice());
    const onChange = () => setChoice(getAvatarChoice());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [seed]);
  const set = useCallback((index: number) => setAvatarChoice(index), []);
  return [choice, set];
}
