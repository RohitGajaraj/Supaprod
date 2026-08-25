// OBS-14 / Tempo v5 port - the Arrival screen's mark. The butterfly asset is
// retired (DESIGN-TEMPO.md section 8: the compact mark is the pixel "C"
// monogram, recolored only within gray-1000/ember). The mark rises in once on
// arrival; the global prefers-reduced-motion override in styles.css collapses
// the entrance to its final frame, so no separate reduced-motion branch is
// needed here. Kept as identity chrome, not the screen's Pixel brand moment
// (that is the arrival headline).
export function ArrivalMark({ size = 56 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-pixel)",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        color: "var(--mrd-ink)",
        animation: "cadRise var(--mrd-d-enter) var(--mrd-ease) both",
        display: "inline-block",
      }}
    >
      C
    </span>
  );
}
