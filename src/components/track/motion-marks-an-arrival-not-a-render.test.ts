import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * MOTION ON THIS PANE MEANS SOMETHING ARRIVED.
 *
 * The founder's ask is that the agentic work be seen, and the risk that comes
 * with it is the one this repo has already been caught doing once: a hero strip
 * advancing on a `setInterval` against no database, motion showing work that was
 * not happening. Generated movement makes that trivially easy, so the rule gets
 * stricter as the surface gets livelier, not looser.
 *
 * The three properties below are what keep this animation a FACT rather than a
 * flourish. Each is asserted on the source because the alternative is mounting a
 * query client and two server fns to observe a CSS string.
 */
describe("the artifact pane's arrival motion", () => {
  const SRC = readFileSync("src/components/track/ArtifactPane.tsx", "utf-8");
  const helper = SRC.slice(
    SRC.indexOf("const arrival = (key: string)"),
    SRC.indexOf('if (stop.state === "waived")'),
  );

  it("refuses to animate anything it has already seen", () => {
    // Without this clause every poll would replay the entrance and the surface
    // would report a delivery on each refetch.
    expect(helper).toContain("seen.current.has(key)");
    expect(helper).toContain("return undefined");
  });

  it("stays still on first paint, because arriving at a finished run is not an arrival", () => {
    expect(helper).toContain("!primed.current");
  });

  it("never loops", () => {
    // A looping entrance is ambient decoration claiming to be an event.
    expect(helper).not.toContain("infinite");
    expect(helper).not.toContain("alternate");
  });

  it("is set inline, so reduced motion actually reaches it", () => {
    /*
     * meridian.css's reduced-motion block matches on the style attribute.
     * Declared as a utility class this would keep animating for someone who
     * asked it not to, which Receipt.tsx records paying for once already.
     *
     * The literal used to sit in this helper and now comes from `enterMotion`,
     * which returns `{ animation: ENTER_MOTION }` and is asserted to do so in
     * `spine/the-motion-toggle-reaches-the-run-screen.test.ts`. The claim is
     * unchanged: a style OBJECT, spread inline, never a class.
     */
    expect(helper).toContain("enterMotion(");
    expect(helper).toContain("...motion");
    expect(SRC).toContain("style={arrival(");
  });

  it("and the OS is not the only thing that can stop it", () => {
    /*
     * The half that was missing. meridian.css's block is under
     * `@media (prefers-reduced-motion: reduce)`, so it answers the operating
     * system; `data-motion` appears nowhere in `src/styles/`, so the product's
     * OWN motion toggle never reached this animation at all. The helper now
     * takes the preference and returns undefined rather than a style.
     */
    expect(helper).toContain("reducedMotion");
    expect(helper).toContain("if (!motion) return undefined;");
  });

  it("caps the stagger so a burst does not become choreography", () => {
    expect(helper).toContain("Math.min(landedSoFar++, 5)");
  });
});

/**
 * AND AN ARRIVAL IS NOT MARKED SEEN UNTIL IT HAS ARRIVED.
 *
 * The transcript's bookkeeping waited 0ms before marking a row seen. `arrived`
 * is computed at render off a REF, so the row rendered with the fade-up and the
 * very next render — the 500ms live poll, an elapsed ticker, a hover — found the
 * key marked, computed `arrived: false`, and `enterMotion` returned `undefined`.
 * React removed the `animation` style **mid-animation** and the new turn flashed
 * into place instead of arriving.
 *
 * The animation is 420ms and the live poll is 500ms, so it was a race the row
 * usually lost to whatever re-rendered first. This pins the two halves that fix
 * it: the delay is the animation's own duration, and that number equals the
 * token the CSS reads.
 */
describe("an arrival is held for as long as it takes", () => {
  const ACTIVITY = readFileSync("src/components/spine/TrackActivity.tsx", "utf-8");
  const MOTION = readFileSync("src/components/spine/enter-motion.ts", "utf-8");
  const CSS = readFileSync("src/styles/meridian.css", "utf-8");

  it("waits the animation's own duration before marking a row seen", () => {
    expect(ACTIVITY).toContain("}, ENTER_MS);");
    // The 0ms version is the defect; it must not come back.
    expect(ACTIVITY).not.toContain("seen.current.add(k);\n    }, 0);");
  });

  it("keeps that number equal to the token the CSS animates on", () => {
    /*
     * ENTER_MS is a second copy of `--mrd-d-enter`, which is normally the thing
     * this repo refuses. It is warranted here because a `setTimeout` cannot read
     * a custom property, and it is only safe while the two agree — so they are
     * compared rather than trusted.
     */
    const ms = MOTION.match(/export const ENTER_MS = (\d+);/);
    expect(ms, "ENTER_MS has been renamed or removed").not.toBeNull();
    const token = CSS.match(/--mrd-d-enter:\s*(\d+)ms/);
    expect(token, "--mrd-d-enter has been renamed or removed").not.toBeNull();
    expect(Number(ms![1])).toBe(Number(token![1]));
  });

  it("still animates on the token, not on the number", () => {
    // The CSS must keep reading the custom property; ENTER_MS is bookkeeping
    // only, and a duration hard-coded into the animation string would be the
    // copy actually going wrong.
    expect(MOTION).toContain("var(--mrd-d-enter)");
    expect(MOTION).not.toMatch(/mrd-fade-up \d+ms/);
  });
});
