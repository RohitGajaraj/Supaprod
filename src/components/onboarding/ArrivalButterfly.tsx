// OBS-14 - the Arrival screen's mark: the idle butterfly asset (never
// redrawn, never recolored) flies in once (cadArrive, 900ms) then settles
// into the same slow idle flutter (cadFlutter) every other butterfly mark in
// the app uses. Under prefers-reduced-motion the global animation-duration
// override (styles.css) collapses both to their final frame - fully visible,
// no fly-in, no flutter - so no separate reduced-motion branch is needed here.
export function ArrivalButterfly() {
  return (
    <img
      src="/assets/butterfly-idle.svg"
      width={56}
      height={56}
      alt=""
      aria-hidden="true"
      style={{
        animation: "cadArrive 900ms var(--ease) both, cadFlutter 3.4s ease-in-out 900ms infinite",
        transformOrigin: "12px 12px",
      }}
    />
  );
}
