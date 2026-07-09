/**
 * A small provenance chip marking an item the loop raised on its own. Auto
 * missions and decisions are stored with a machine "[auto]" prefix (a dedup
 * key); that prefix is stripped from the visible copy by `stripAutoPrefix`, and
 * this chip carries the origin instead, as quiet metadata. Glacier is the
 * machine voice in the design contract, so auto-origin never borrows the ember
 * needs-a-human accent. Pair with `isAutoTitle` at the call site.
 */
export function AutoChip({ label = "Auto" }: { label?: string }) {
  return (
    <span
      title="Raised automatically by the loop"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9.5px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--glacier)",
        border: "1px solid color-mix(in srgb, var(--glacier) 30%, transparent)",
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
