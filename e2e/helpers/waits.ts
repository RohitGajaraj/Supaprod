/**
 * CONDITION WAITS FOR THE BROWSER SUITE.
 *
 * WHY THIS FILE EXISTS. On 2026-08-10 three `AskPane` switcher tests went from
 * an intermittent 1-in-3 flake to failing every run, and the first reading —
 * reported before it was checked — blamed the commit that had just merged.
 * `git diff` across that merge showed the component files were byte-identical.
 * The tests did `click()` then `setTimeout(…, 10)`, which is not a wait but a
 * BET that an async read resolves and React commits inside ten milliseconds.
 * A graded sweep proved it was a deadline and not a break: `15ms → 3 fail ·
 * 30ms → 2 · 60ms → 1 · 120ms → 0`. A broken component does not care how long
 * you wait. Full write-up: `src/__tests__/a-timeout-is-not-a-wait.test.ts` and
 * `docs/operations/testing/README.md`.
 *
 * THAT BET IS WORSE HERE THAN IT IS IN THE UNIT SUITE. A `bun test` sleep bets
 * against jsdom on one machine. A `waitForTimeout` bets against a real browser,
 * a real network, a cold Vite worker, a Supabase round trip and whatever else
 * the box is doing — with a variance an order of magnitude wider. It ships
 * green, fails proportionally to load, reads as flakiness, and points at
 * whoever landed last.
 *
 * THE RULE: wait on a condition, never on a clock. Every helper below waits on
 * something observable and takes a `timeout` that is a FAILURE BOUND, not a
 * duration to burn — it returns the instant the condition holds.
 *
 * THE ONE LEGITIMATE SLEEP, so nobody deletes it by rule. A fixed delay is
 * correct when the delay IS the thing under test — a stub of a slow operation,
 * where the test must observe in-flight state. The unit guard's first draft
 * flagged eight such mocks and every one was a false positive. There is no such
 * case in this suite today; if one appears, it is a sleep inside a route
 * handler stub (`page.route`), never a sleep in a test body.
 */
import { expect, type Locator, type Page } from "@playwright/test";

/** Poll cadence shared by the settle helpers: tight at first because most
 *  transitions here are 120–200ms, backing off so a slow surface does not
 *  spend the whole budget on evaluate round trips. */
const SETTLE_INTERVALS = [50, 50, 100, 100, 200, 200, 500];

/**
 * Resolves once two consecutive reads of `props` on `locator` are identical —
 * i.e. the CSS transition has actually finished.
 *
 * This replaces `hover(); waitForTimeout(200)`. The 200 was a guess at a
 * transition duration nothing in the test knew; two matching samples are the
 * transition ending, observed.
 */
export async function waitForStyleToSettle(
  locator: Locator,
  props: string[] = [
    "background-color",
    "color",
    "border-color",
    "box-shadow",
    "opacity",
    "transform",
  ],
  timeout = 5_000,
): Promise<void> {
  let previous: string | null = null;
  await expect(async () => {
    const current = await locator.evaluate((el, names) => {
      const style = getComputedStyle(el);
      return names.map((name) => style.getPropertyValue(name)).join(" | ");
    }, props);
    const settled = previous === current;
    previous = current;
    expect(settled, `computed style still moving — transition in flight: ${current}`).toBe(true);
  }).toPass({ timeout, intervals: SETTLE_INTERVALS });
}

/**
 * Resolves once the document's own box stops moving — two consecutive
 * identical reads of scroll and client width plus scroll height.
 *
 * This replaces `goto(); waitForTimeout(300) // let layout settle` in front of
 * the horizontal-scroll assertion. It matters that this SETTLES rather than
 * polling the assertion itself: polling `hasHorizontalScroll` until it goes
 * false would pass a page that overflows and then corrects, which is a real
 * defect a user sees. Settle first, then assert once, and a page that comes to
 * rest overflowing still fails.
 */
export async function waitForLayoutToSettle(page: Page, timeout = 10_000): Promise<void> {
  let previous: string | null = null;
  await expect(async () => {
    const current = await page.evaluate(() => {
      const d = document.documentElement;
      return `${d.scrollWidth}x${d.clientWidth}x${d.scrollHeight}`;
    });
    const settled = previous === current;
    previous = current;
    expect(settled, `layout still moving (${current})`).toBe(true);
  }).toPass({ timeout, intervals: SETTLE_INTERVALS });
}

/**
 * Resolves once keyboard focus has left `<body>` and landed on a real element.
 *
 * This replaces `keyboard.press('Tab'); waitForTimeout(100)`. Note it also
 * makes the surrounding assertion mean something: `document.activeElement` is
 * essentially never null — it falls back to `<body>` — so a test that pressed
 * Tab, slept, and then asserted "activeElement is not null" passed whether or
 * not anything was focusable. Timing out here says the surface has no reachable
 * focus target, which is the defect worth hearing about.
 */
export async function waitForFocusToLand(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForFunction(
    () => document.activeElement != null && document.activeElement !== document.body,
    undefined,
    { timeout },
  );
}

/**
 * The document's theme marker, in the spelling `__root.tsx` actually uses.
 *
 * The contract (see `src/hooks/use-theme.tsx` and the inline boot script in
 * `src/routes/__root.tsx`): DARK is the `dark` class with NO `data-theme`
 * attribute, because `:root` already holds the dark tokens; LIGHT is
 * `data-theme="light"` with the `dark` class removed. There is no
 * `data-theme="dark"`.
 */
export function readThemeMarker(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = document.documentElement;
    const attr = d.getAttribute("data-theme");
    if (attr) return attr;
    return d.classList.contains("dark") ? "dark" : "unset";
  });
}

/**
 * True once `locator` is visible, false if it never becomes visible inside
 * `timeout`. For genuinely optional UI, where "it is not there" is a legal
 * outcome and not a failure.
 *
 * `locator.isVisible()` is a synchronous snapshot with no retry, so the old
 * `click(); waitForTimeout(500); isVisible()` shape was betting the dialog
 * mounted inside 500ms. This waits for the condition and converts only the
 * timeout into `false`.
 */
export async function becomesVisible(locator: Locator, timeout = 5_000): Promise<boolean> {
  return locator
    .waitFor({ state: "visible", timeout })
    .then(() => true)
    .catch(() => false);
}
