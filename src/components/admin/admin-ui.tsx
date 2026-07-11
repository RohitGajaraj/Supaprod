/**
 * Shared admin-console states (Loom W2-ADMIN, DESIGN-LOOM §9): shimmer
 * skeletons that match the row layout, an error card that never wears an
 * empty state's clothes (register D-11), and a debounced-value hook for the
 * search inputs (register D-22). An error may NEVER read as "no results".
 */
import { useEffect, useState } from "react";

/** Debounce a fast-changing value (search inputs) so server queries fire at
 * most once per pause, not per keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 275): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/** Read the in-band `{ error }` shape the admin server fns return instead of
 * throwing. Returns the message, or null when the payload is a real result. */
export function inBandError(d: unknown): string | null {
  if (d && typeof d === "object" && "error" in d) {
    return String((d as { error: unknown }).error);
  }
  return null;
}

/** Loading skeleton: a stack of shimmer bars sized like the rows they stand
 * in for. Never a blank frame, never a spinner for primary content. */
export function AdminSkeleton({ rows = 4, height = 36 }: { rows?: number; height?: number }) {
  return (
    <div style={{ display: "grid", gap: 8 }} aria-hidden="true">
      <style>{`
        @keyframes admin-skeleton-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .admin-skeleton-bar { animation: none; }
        }
      `}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="admin-skeleton-bar"
          style={{
            height,
            borderRadius: "var(--radius-control)",
            background: "var(--raised)",
            boxShadow: "var(--top-light)",
            animation: "admin-skeleton-pulse 1.6s ease-in-out infinite",
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** Error state: the cause plus one retry. Distinct from empty, always. */
export function AdminErrorCard({
  what,
  message,
  onRetry,
}: {
  what: string;
  message?: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="material-medium"
      style={{
        padding: "var(--space-4)",
        display: "grid",
        gap: 8,
        justifyItems: "start",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-label)",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "var(--madder)",
        }}
      >
        Could not load {what}
      </span>
      {message ? (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            maxWidth: 520,
          }}
        >
          {message.slice(0, 160)}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-label)",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "var(--text-primary)",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        Retry · reloads this section
      </button>
    </div>
  );
}
