/**
 * Shared normalizers for the "AI returns a bare array instead of the documented
 * wrapper" shape drift, live-confirmed with google/gemini-2.5-pro/flash (the
 * cluster-tick incident, see extractThemesJson in cluster.server.ts for the
 * original diagnosis). Centralized here because it recurred at 6+ independent
 * call sites, not just cluster.server.ts.
 */

/** For responses documented as {field: [...]} that sometimes arrive as a bare array. */
export function extractArrayField<T = unknown>(json: unknown, field: string): T[] | undefined {
  if (Array.isArray(json)) return json as T[];
  const value = (json as Record<string, unknown> | null | undefined)?.[field];
  return Array.isArray(value) ? (value as T[]) : undefined;
}

/**
 * For responses documented as a single object that sometimes arrive wrapped in a
 * single-element array. Returns null for any other shape (multi-item array,
 * non-object, null) so callers can fail loudly instead of silently persisting a
 * garbage-shaped default.
 */
export function asPlainObject<T = unknown>(json: unknown): T | null {
  if (Array.isArray(json)) {
    return json.length === 1 && json[0] !== null && typeof json[0] === "object"
      ? (json[0] as T)
      : null;
  }
  return json !== null && typeof json === "object" ? (json as T) : null;
}
