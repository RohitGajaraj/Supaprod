/**
 * A small provenance chip marking an item the loop raised on its own. Auto
 * missions and decisions are stored with a machine "[auto]" prefix (a dedup
 * key); that prefix is stripped from the visible copy by `stripAutoPrefix`, and
 * this chip carries the origin instead, as quiet metadata. Neutral gray, not
 * glacier (Tempo v5 DESIGN-TEMPO.md §2 glacier/machine-voice narrowing,
 * 2026-07-11: glacier is reserved for literal live/running/streaming status,
 * not a generic "AI-related" tint): auto-origin still never borrows the ember
 * needs-a-human accent, it just resolves to gray instead. Pair with
 * `isAutoTitle` at the call site.
 */
export function AutoChip({ label = "Auto" }: { label?: string }) {
  return (
    <span
      title="Raised automatically by the loop"
      style={{
        fontFamily: "var(--mrd-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--mrd-mute)",
        border: "1px solid color-mix(in srgb, var(--mrd-mute) 30%, transparent)",
        borderRadius: "var(--radius-pill)",
        padding: "1px 6px",
        whiteSpace: "nowrap",
        flexShrink: 0,
        alignSelf: "center",
      }}
    >
      {label}
    </span>
  );
}
