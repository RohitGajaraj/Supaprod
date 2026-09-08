/**
 * ONE THING FILED FOUR TIMES IS ONE ROW WITH FOUR VERSIONS.
 *
 * Seen live 2026-09-08: the member list under "What it has made" printed
 * *Relay Checkout Tablet - Address Confirmation Screen (read-only)* four times
 * with four different seconds beside it. A repeated row distinguishes nothing.
 * These pin the fold the rows and the sentences now share.
 */
import { describe, expect, it } from "bun:test";

import { foldVersions, foldedCount, prepFor, repeatedTitles } from "./versions-of-one-thing";

const TITLE = "Relay Checkout Tablet - Address Confirmation Screen (read-only)";

const m = (
  kind: string,
  title: string | null,
  createdAt: string,
  artifactId = `${kind}-${createdAt}`,
  missing = false,
) => ({ kind, title, createdAt, artifactId, missing });

describe("folding the versions of one thing", () => {
  it("folds rows that share a title and a kind into one row that carries the newest", () => {
    const rows = foldVersions([
      m("prototype", TITLE, "2026-09-08T11:41:47Z", "p1"),
      m("decision", "Ship it", "2026-09-08T12:00:00Z", "d1"),
      m("prototype", TITLE, "2026-09-08T12:20:33Z", "p2"),
      m("prototype", TITLE, "2026-09-08T12:21:16Z", "p3"),
      m("prototype", TITLE, "2026-09-08T12:21:16Z", "p4"),
    ]);
    expect(rows.map((r) => r.newest.artifactId)).toEqual(["d1", "p4"]);
    expect(rows[1].earlier.map((v) => v.artifactId)).toEqual(["p3", "p2", "p1"]);
  });

  it("sits the fold where its newest member sat, so an oldest-first list stays in order", () => {
    const rows = foldVersions([
      m("prototype", "A", "2026-09-08T10:00:00Z", "a1"),
      m("prototype", "B", "2026-09-08T10:30:00Z", "b1"),
      m("prototype", "A", "2026-09-08T11:00:00Z", "a2"),
    ]);
    expect(rows.map((r) => r.newest.artifactId)).toEqual(["b1", "a2"]);
  });

  it("does not fold a prototype and a decision that happen to share a title", () => {
    // Same title, different kinds: two things, and the kind word beside each
    // row already tells them apart.
    const rows = foldVersions([
      m("prototype", "Address screen", "2026-09-08T10:00:00Z", "p"),
      m("decision", "Address screen", "2026-09-08T10:01:00Z", "d"),
    ]);
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.earlier.length === 0)).toBe(true);
  });

  it("orders by the instant, not by filing order, when every member carries one", () => {
    const rows = foldVersions([
      m("prototype", "A", "2026-09-08T12:00:00Z", "later"),
      m("prototype", "A", "2026-09-08T11:00:00Z", "earlier"),
    ]);
    expect(rows[0].newest.artifactId).toBe("later");
    expect(rows[0].earlier[0].artifactId).toBe("earlier");
  });

  it("leaves a missing member and an untitled member as rows of their own", () => {
    const rows = foldVersions([
      m("prototype", "A", "2026-09-08T10:00:00Z", "a1"),
      m("prototype", "A", "2026-09-08T10:01:00Z", "a-gone", true),
      m("signal", null, "2026-09-08T10:02:00Z", "s1"),
      m("signal", null, "2026-09-08T10:03:00Z", "s2"),
    ]);
    expect(rows.length).toBe(4);
    expect(rows.every((r) => r.earlier.length === 0)).toBe(true);
  });

  it("matches on the trimmed, case-folded title, which is what a reader sees", () => {
    const rows = foldVersions([
      m("prototype", "Reboot Tile", "2026-09-08T10:00:00Z", "a"),
      m("prototype", "  reboot tile ", "2026-09-08T10:01:00Z", "b"),
    ]);
    expect(rows.length).toBe(1);
    expect(rows[0].earlier.length).toBe(1);
  });
});

describe("the twins the rows build on", () => {
  it("is the same set the pane used before, by title alone", () => {
    const twins = repeatedTitles([
      { title: "Reboot Tile" },
      { title: "reboot tile" },
      { title: "Something else" },
      { title: "Gone", missing: true },
      { title: "Gone" },
    ]);
    expect(twins).toEqual(new Set(["reboot tile"]));
  });
});

describe("counting with the fold in the sentence", () => {
  it("says a plain count when every title is distinct", () => {
    expect(
      foldedCount(
        [m("prototype", "A", "1"), m("prototype", "B", "2"), m("prototype", "C", "3")],
        "drawings",
      ),
    ).toBe("3 drawings");
  });

  it("folds one thing filed four times into the thing, not a confession", () => {
    const out = foldedCount(
      [
        m("prototype", TITLE, "1"),
        m("prototype", TITLE, "2"),
        m("prototype", TITLE, "3"),
        m("prototype", TITLE, "4"),
      ],
      "drawings",
    );
    expect(out).toBe(`4 drawings of ${TITLE}`);
    expect(out).not.toContain("say the same thing");
  });

  it("names each fold, largest first, and leaves the singles counted", () => {
    const out = foldedCount(
      [
        m("prototype", "Tile", "1"),
        m("prototype", "Reboot", "2"),
        m("prototype", "Reboot", "3"),
        m("prototype", "Reboot", "4"),
        m("prototype", "Tile", "5"),
        m("prototype", "Once", "6"),
      ],
      "drawings",
    );
    expect(out).toBe("6 drawings (3 of Reboot and 2 of Tile)");
  });

  it("puts a decision ON its subject and a drawing OF it", () => {
    expect(prepFor("decision")).toBe("on");
    expect(prepFor("learning")).toBe("on");
    expect(prepFor("prototype")).toBe("of");
    expect(
      foldedCount(
        [
          m("decision", "Approve", "1"),
          m("decision", "Do not attribute", "2"),
          m("decision", "Do not attribute", "3"),
        ],
        "decisions",
        prepFor("decision"),
      ),
    ).toBe("3 decisions (2 on Do not attribute)");
  });

  it("does not count a missing member, whose title is not on screen", () => {
    expect(
      foldedCount([m("prototype", "A", "1"), m("prototype", "A", "2", "gone", true)], "drawing"),
    ).toBe("1 drawing");
  });
});
