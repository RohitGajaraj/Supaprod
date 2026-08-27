import * as React from "react";

// Avatar — the account face (founder ruling 2026-07-14): a LIBRARY of orb
// templates. A stable default is assigned per account (hash of the seed), but
// the user can override it from Settings (see useAvatarChoice). Each orb is
// built from OUR theme tokens MUTED into the surface, so it stays calm and
// on-theme in BOTH light and dark (never a loud saturated disc); the initial
// rides in the primary text color so it is legible in either theme.

// Distinct two-hue pairs from the design tokens, rendered mixed heavily into
// --card so they read as soft tints of the surface, not neon fills.
const PAIRS: readonly [string, string][] = [
  ["--ember", "--marigold"],
  ["--action-blue", "--moss"],
  ["--moss", "--marigold"],
  ["--madder", "--ember"],
  ["--action-blue", "--madder"],
  ["--marigold", "--moss"],
  ["--ember", "--action-blue"],
  ["--moss", "--madder"],
];

/** How many orb templates the library offers (for the Settings picker). */
export const AVATAR_VARIANTS = PAIRS.length;

/** Stable non-negative hash of a seed string (djb2). */
function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** The default orb index for an account when the user has not picked one. */
export function defaultAvatarVariant(seed: string): number {
  return hashSeed(seed || "supaprod") % AVATAR_VARIANTS;
}

/** The CSS background for a given orb index (used by the avatar + the picker). */
export function orbBackground(index: number): string {
  const [a, b] = PAIRS[((index % AVATAR_VARIANTS) + AVATAR_VARIANTS) % AVATAR_VARIANTS];
  return `radial-gradient(circle at 30% 24%, color-mix(in oklab, #fff 16%, transparent) 0%, transparent 48%), linear-gradient(140deg, color-mix(in oklab, var(${a}) 42%, var(--mrd-lift)) 0%, color-mix(in oklab, var(${b}) 40%, var(--mrd-lift)) 100%)`;
}

export function Avatar({
  seed,
  initials,
  size = 26,
  title,
  variant,
}: {
  /** Stable identity (user id or name) — picks the default orb. */
  seed: string;
  initials: string;
  size?: number;
  title?: string;
  /** Explicit override from the user's Settings choice. */
  variant?: number | null;
}) {
  const idx = typeof variant === "number" ? variant : defaultAvatarVariant(seed);
  return (
    <span
      title={title}
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: orbBackground(idx),
        border: "1px solid var(--mrd-edge)",
        color: "var(--mrd-ink)",
        fontFamily: "var(--mrd-mono)",
        fontWeight: 600,
        fontSize: Math.round(size * 0.42),
        letterSpacing: "0.02em",
        boxShadow: "inset 0 1px 0 0 color-mix(in oklab, #fff 12%, transparent)",
      }}
    >
      {initials}
    </span>
  );
}
