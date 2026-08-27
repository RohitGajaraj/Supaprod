import { describe, it, expect } from "bun:test";
import { clusteredInto, themesOnTrack, type ThemeLike } from "./clustered-into";

const theme = (id: string, title: string | null, missing = false): ThemeLike => ({
  kind: "theme",
  artifactId: id,
  title,
  missing,
});

describe("which pattern a signal was clustered into", () => {
  it("names the theme when this track filed it", () => {
    const themes = themesOnTrack([
      { items: [theme("t1", "Redundant Address Re-entry Causing Checkout Abandonment")] },
    ]);
    expect(clusteredInto("t1", themes)).toBe(
      "clustered into Redundant Address Re-entry Causing Checkout Abandonment",
    );
  });

  it("keeps the plain word when the theme is not on this track", () => {
    /*
     * THE COMMON CASE, MEASURED. 1,133 of 1,133 signals filed to a track carry
     * a theme_id and only 315 of those themes are members of the same track.
     * The other 818 must not get a heading this pane cannot name -- that would
     * trade a word that withholds for one that lies.
     */
    expect(clusteredInto("t-elsewhere", themesOnTrack([{ items: [theme("t1", "Something")] }]))).toBe(
      "clustered",
    );
    expect(clusteredInto("t1", undefined)).toBe("clustered");
  });

  it("says nothing at all about a signal that joined no pattern", () => {
    expect(clusteredInto(null, themesOnTrack([{ items: [theme("t1", "Something")] }]))).toBe("");
    expect(clusteredInto(undefined, undefined)).toBe("");
  });

  it("will not name a theme whose row could not be read", () => {
    // `missing` means the lookup ran and the row was not there. There is no
    // title, and inventing one is the failure this whole pane guards against.
    const themes = themesOnTrack([{ items: [theme("t1", "Gone", true)] }]);
    expect(themes.size).toBe(0);
    expect(clusteredInto("t1", themes)).toBe("clustered");
  });

  it("ignores an empty or absent title rather than printing a blank", () => {
    expect(themesOnTrack([{ items: [theme("t1", "   ")] }]).size).toBe(0);
    expect(themesOnTrack([{ items: [theme("t1", null)] }]).size).toBe(0);
  });

  it("collects themes from every stop, not just one", () => {
    const themes = themesOnTrack([
      { items: [theme("a", "First")] },
      { items: [{ kind: "signal", artifactId: "s", title: "not a theme" }] },
      { items: [theme("b", "Second")] },
    ]);
    expect([...themes.entries()]).toEqual([
      ["a", "First"],
      ["b", "Second"],
    ]);
  });
});
