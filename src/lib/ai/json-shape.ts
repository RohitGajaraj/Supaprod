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

/**
 * For TOOL ARGS documented as {[field]: [...]} where a model omits the array
 * wrapper and sends a single item object directly at that key, e.g.
 * {changes: {path, op, content}} instead of {changes: [{path, op, content}]}.
 * Live-confirmed as studio.stage's most common validation failure this
 * session (every "forgot the array wrapper" self-correction was this exact
 * shape) - fix the schema to accept it instead of relying on the model to
 * retry into the documented shape. Passes through unchanged when `field` is
 * already an array, absent, or not a plain object, so a genuinely malformed
 * call still fails validation loudly rather than being silently coerced.
 */
export function wrapBareArrayField(raw: unknown, field: string): unknown {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  const value = obj[field];
  if (value === null || typeof value !== "object" || Array.isArray(value)) return raw;
  return { ...obj, [field]: [value] };
}
