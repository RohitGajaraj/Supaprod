/**
 * P-16b (A-QUEUE.md). A1's DOM audit (12:15 IST) found Start's composer as
 * the thirteenth tab stop on a fresh page load: nothing on the page claimed
 * focus, so a keyboard arrival walked every rail row and every example card
 * before reaching the one control the screen exists for.
 *
 * `shouldClaimComposerFocus` is the decision `_authenticated.start.tsx`'s
 * own mount effect calls; this tests it directly against real DOM values
 * (`document.body`, real created elements) rather than through a full route
 * mount. `StartLanding` is not exported and reads `Route.useSearch()`, which
 * needs an actual router match -- this repo's own attempt at that harness
 * (`integration.discover.test.tsx`) is an unfinished skeleton with every
 * import commented out, so building one from scratch here would be new,
 * unproven infrastructure for one small check. The judgment under test does
 * not touch the router at all; it only reads whatever is already focused.
 */
import { describe, test, expect } from "bun:test";
import { shouldClaimComposerFocus } from "../_authenticated.start";

describe("an untouched page hands the composer its focus", () => {
  test("document.body -- the ordinary state of a fresh load -- claims it", () => {
    expect(shouldClaimComposerFocus(document.body)).toBe(true);
  });

  test("null -- jsdom's own before-anything-mounts state -- claims it too", () => {
    expect(shouldClaimComposerFocus(null)).toBe(true);
  });
});

describe("a person (or the browser) who got there first keeps it", () => {
  test("a real element already focused is left alone", () => {
    const alreadyFocused = document.createElement("input");
    document.body.appendChild(alreadyFocused);
    alreadyFocused.focus();
    expect(shouldClaimComposerFocus(document.activeElement)).toBe(false);
    document.body.removeChild(alreadyFocused);
  });
});
