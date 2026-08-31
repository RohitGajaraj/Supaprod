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
