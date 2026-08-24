/**
 * Shared admin-console states: shimmer skeletons that match the row layout, an
 * error card that never wears an empty state's clothes (register D-11), and a
 * debounced-value hook for the search inputs (register D-22). An error may
 * NEVER read as "no results".
 *
 * ── K-95: THE ERROR STATE THE ADMIN PORT LEFT BEHIND ────────────────────
 * The Group H ports moved every `_authenticated.admin*.tsx` to Meridian and
 * walked past this module, which is the one place all of them draw their
 * failure through. So the four retired tokens here were painting inside three
 * otherwise-Meridian pages, and one of them was illegible.
 *
 * `--madder` resolves to `--ds-red-600`. Against the card's own ground
 * (`.material-medium` -> `--ds-background-100`) it measured **4.97:1 on dark and
 * 2.79:1 on paper**, on the one string somebody reads because something already
 * went wrong.
 *
 * WHICH OF THOSE TWO A PERSON ACTUALLY SAW, corrected 2026-08-21 after this file
 * was measured in a browser rather than reasoned about. **Dark is the default and
 * 4.97 is the number most people got**, so this was AA-passing by 0.47 rather
 * than illegible for everyone. `__root.tsx:258` says why: dark is `:root` with NO
 * `data-theme`, and the bootstrap stamps `data-theme="light"` only when the
 * stored preference is `light`, or `system` with an OS that prefers light. With
 * nothing stored, dark fires. **2.79 was real and only fired for someone who had
 * chosen light.** Recorded at this length because the first pass got the
 * direction backwards from source alone, and the next contrast call that is safe
 * in only one ground will be decided with it.
 *
 * `--mrd-fail` measures 5.83 on dark and 6.64 on paper on the same ground, and
 * it is the token `surface-parts.tsx`'s `ReadFailedLine` and the Engine Room's
 * `AgentScorecardPanel` already use for exactly this sentence, so the product's
 * failure states now agree rather than each picking their own red.
 *
 * `--raised` + `--top-light` were Obsidian's elevation recipe: a ground step
 * plus a white inset top edge. Meridian raises by the ground ladder alone, so
 * the skeleton takes `--mrd-lift` and the inset goes with it -- a 5% white
 * hairline is invisible on paper and the founder's 2026-08-18 ruling rules out
 * reintroducing one. Matches the skeleton bars in `_authenticated.brain.tsx`.
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
            background: "var(--mrd-lift)",
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
        gap: "var(--geist-space-2x)",
        justifyItems: "start",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mrd-mono)",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "var(--mrd-fail)",
        }}
      >
        Could not load {what}
      </span>
      {message ? (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--mrd-font)",
            color: "var(--mrd-mute)",
            maxWidth: 520,
          }}
        >
          {message.slice(0, 160)}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          fontFamily: "var(--mrd-mono)",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "var(--mrd-ink)",
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
