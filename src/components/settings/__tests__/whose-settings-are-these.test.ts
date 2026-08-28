/**
 * FIFTEEN OF SIXTEEN PEOPLE ARE LOOKING AT EIGHT SWITCHES THEY NEVER TOUCHED.
 *
 * `getNotificationPreferences` returns a full default object when the person
 * has no `user_notification_preferences` row -- every switch ON, four of them
 * sending EMAIL -- and the settings pane rendered it exactly as it renders a
 * row somebody chose.
 *
 * Measured on the live database, 2026-08-28: ONE row exists, against 16
 * profiles.
 *
 * The governance canon's fourth floor already states the rule for the numeric
 * bars: a default the user never set is OUR choice, and the surface names it as
 * ours rather than presenting it as their policy. The boundary says it, the
 * autonomy bars say it, and the one setting whose defaults leave the building
 * did not.
 *
 * The reader now returns `chosen`, and this pins both halves: that the flag
 * exists on the server, and that the surface only speaks when it is false.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const READER = code(readFileSync("src/lib/notifications.functions.ts", "utf8"));
const PANE = code(readFileSync("src/components/settings/NotificationsSection.tsx", "utf8"));

describe("whose settings are these", () => {
  it("the reader says whether a row existed, in both directions", () => {
    // A missing row is the defaults AND the flag; a present row is the row AND
    // the flag. Returning the object without the flag is what hid this.
    expect(READER).toMatch(/preferences:\s*defaultPrefs,\s*chosen:\s*false/);
    expect(READER).toMatch(/chosen:\s*true/);
  });

  it("the pane only speaks when nobody has chosen", () => {
    expect(PANE).toContain("!prefs.data.chosen");
    expect(PANE).toContain("what we ship rather than anything you set");
  });

  /**
   * A LOADING READ IS NOT AN UNCHOSEN ONE. `prefs.data` is undefined until the
   * query returns, and claiming "nobody has changed any of these" on the way in
   * would be a statement about the record made before reading it -- the same
   * failure as an empty state drawn over a failed read.
   */
  it("it waits for the read rather than asserting during it", () => {
    expect(PANE).toMatch(/prefs\.data && !prefs\.data\.chosen/);
  });

  /* It states whose the setting is and does not tell anybody to change it.
     Most of these defaults are correct, and a nudge on every one of them would
     be worse than the silence it replaces. */
  it("names the owner without prescribing an action", () => {
    const said = /"([^"]*what we ship rather than anything you set[^"]*)"/.exec(PANE)?.[1] ?? "";
    expect(said).toBeTruthy();
    expect(said.toLowerCase()).not.toMatch(/\b(you should|review these|turn these|fix)\b/);
  });
});
