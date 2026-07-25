/** Loom v4 §9: one skeleton grammar for the Discover surface, a shimmer bar
 * in the raised tone, sized by the caller to match the loaded layout. Never a
 * spinner for primary content, never a blank block. */
export function SkeletonBar({ width, height = 12 }: { width: string; height?: number }) {
  return (
    <div
      style={{
        width,
        height: `${height}px`,
        borderRadius: "6px",
        background:
          "linear-gradient(90deg, var(--raised) 0%, var(--hover) 50%, var(--raised) 100%)",
        backgroundSize: "280% 100%",
        animation: "cadShimmer 1.6s linear infinite",
      }}
    />
  );
}
