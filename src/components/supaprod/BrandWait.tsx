/**
 * The wait, everywhere in the product.
 *
 * FOUNDER RULING 2026-08-01: "instead of having a text 'Super Prod' in the loader,
 * why don't we have something innovative and creative ... use our word mark for
 * this loader and make it a little animation ... The word 'Super Prod' does not
 * make sense, and also it has to be center-aligned to whichever screen it is on ...
 * this has to be across all the surfaces in and around our product."
 *
 * WHAT WAS THERE, and why the word was the wrong answer. `RoutePending` drew the
 * lowercase string "supaprod" in Geist Pixel over a shimmer bar. Three things wrong
 * with it, in order of how much they matter:
 *
 *   1. IT SAID NOTHING. A product name is the one fact a person waiting already
 *      knows; they are looking at our app. It spends the whole moment restating
 *      the least useful thing on screen.
 *   2. IT WAS NOT CENTRED. `min-height: 40vh` with flex centring puts the mark in
 *      the middle of the top 40% of the region, which on a full-page load sits
 *      noticeably high and looks like a mistake rather than a composition.
 *   3. IT WAS `aria-hidden`. A screen reader was told nothing at all during the
 *      wait, so a blind user got silence and no explanation for it.
 *
 * WHAT REPLACES IT, and why the mark earns the moment. `SupaprodMark`'s loader mode
 * already carries the product's whole thesis and nobody was using it here: SEVEN
 * petals for the seven stations of the loop, drawn as ONE continuous epitrochoid so
 * the lifecycle reads as a single journey rather than seven steps; a comet of energy
 * running that curve, which is the loop actually turning; and an ember core that
 * pulses, which is the brain keeping the beat. A loader that means something is
 * rarer than a loader that moves.
 *
 * THE ONE THING ADDED: a second, dimmer comet trailing the first. It is not
 * decoration and it is the product's claim in two marks. The bright one is the work
 * going round the loop; the faint one behind it is the record keeping up. That is
 * the sentence the whole company is built on, said without a word of copy.
 *
 * NO TEXT AT ALL, deliberately. The visible surface is the mark; the words live in
 * a live region for screen readers, which is where an announcement belongs. A
 * caption under a spinner is a caption nobody reads twice.
 *
 * Inline styles with dark-safe literal fallbacks, because this mounts on PUBLIC
 * routes and can render before the token layers load. Same constraint the component
 * it replaces was written under.
 */
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

export function BrandWait({
  /**
   * What a screen reader is told, once. Never rendered visually.
   * Say the work where the caller knows it ("Opening the run"), not "spinner".
   *
   * THE DEFAULT SAYS THE WAIT IS TAKING A MOMENT, and it can only say that
   * because of the router threshold. This component does not mount until a
   * navigation has already run for a full second, so by the time the live
   * region speaks, the delay is a fact rather than a possibility. "Loading",
   * which is what this said before, would fit any of forty screens and told a
   * screen reader nothing the situation did not already imply.
   */
  label = "This page is taking a moment",
  /**
   * 76px on the overlay, not 44. Measured on a 1512x860 screen: at 44 the mark
   * sat in the middle of a very large dark field and read as lost rather than as
   * composed, which is the opposite of premium. A full-screen wait is the one
   * place the mark should be unmistakable.
   */
  size = 76,
  /**
   * Cover the viewport and centre in it. This is the default because the founder's
   * requirement is centred "to whichever screen it is on", and the only way to
   * guarantee that from a component which does not know what mounts it is to
   * measure against the viewport rather than against a parent whose height we
   * cannot see. Pass false for a wait that belongs inside one region.
   */
  overlay = true,
}: {
  label?: string;
  size?: number;
  overlay?: boolean;
}) {
  return (
    <div
      style={
        overlay
          ? {
              position: "fixed",
              inset: 0,
              display: "grid",
              placeItems: "center",
              // The app's own ground, not a scrim: a translucent grey wash over a
              // half-drawn page reads as a failure. At near-full opacity this reads
              // as the product composing itself, which is what is happening.
              background: "var(--sp-bg, var(--bg, #0a0a0a))",
              // Above the shell, below any dialog. The router's threshold keeps
              // this off screen for the first full second of any navigation, so
              // by the time it mounts there is a real wait to explain rather
              // than a fast route being covered up. That figure used to be
              // 150ms with a 300ms hold, which meant a 200ms navigation was
              // GUARANTEED to flash this overlay. See THE LOADING POLICY in
              // `src/styles/meridian.css` for the whole argument.
              zIndex: 40,
            }
          : {
              display: "grid",
              placeItems: "center",
              minHeight: "40dvh",
            }
      }
    >
      {/* The mark is decorative HERE because the live region below carries the
          meaning; giving both a name would announce the wait twice. */}
      <span aria-hidden="true" style={{ lineHeight: 0 }}>
        <SupaprodMark size={size} animated />
      </span>
      <span
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {label}
      </span>
    </div>
  );
}
