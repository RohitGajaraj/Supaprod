/**
 * OBS-11 - the palette's 3-recent-objects slot. Client-only (sessionStorage),
 * capped at 3, deduped by id, newest first. No server fn: a recents source
 * for a per-session convenience list does not warrant a database round trip
 * (OBS-11.md §13 - "an empty recents slot is acceptable, a new server fn is
 * not").
 */

import type { CatalogKind } from "./palette-catalog";

export type RecentObject = {
  id: string;
  label: string;
  kind: CatalogKind;
  to: string;
  search?: Record<string, string>;
};

const KEY = "supaprod:recents";
const CAP = 3;

function read(): RecentObject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRecents(): RecentObject[] {
  return read().slice(0, CAP);
}

export function pushRecent(obj: RecentObject): void {
  if (typeof window === "undefined") return;
  const existing = read().filter((r) => r.id !== obj.id);
  const next = [obj, ...existing].slice(0, CAP);
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // sessionStorage full or unavailable - recents are non-essential, drop silently.
  }
}
