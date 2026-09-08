/**
 * P-81's own guard: "the bar and the sheet are generated from the same list
 * as the rail." `RailPhoneBar.tsx` builds both from `PRIMARY_NAV` by
 * filtering on `BAR_TO`, never by hand-copying a door's label or route -- this
 * reads the real exports and checks the property directly, so a future door
 * added to `PRIMARY_NAV` and forgotten here fails loudly instead of silently
 * missing a phone.
 *
 * AND WHAT A DOOR WEARS (fourth review, 2026-09-09). `RAIL` in AppFrame is
 * the rail's choice of glyph and of which row is counted; the phone bar's
 * `DOOR_ICON` and `DOOR_COUNT` are read against it here, because the two
 * drifted once: Outcomes changed glyph on the desktop and not on the phone,
 * and the Inbox count never reached the phone at all. `RAIL` cannot be
 * imported (AppFrame mounts the bar), so it is read as source, the way
 * `AppFrame.rail-covers-keys.test.ts` reads it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { PRIMARY_NAV } from "@/lib/nav-model";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { BAR_TO, DOOR_COUNT, DOOR_ICON, phoneBarCoversEveryDoor } from "./RailPhoneBar";

const FRAME = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
const BAR = readFileSync("src/components/shell/RailPhoneBar.tsx", "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

type RailRow = { to: string; icon: string; count: string | null };

/** The `const RAIL = [ ... ] as const;` block, one row per door. */
function railRows(): RailRow[] {
  const src = code(FRAME);
  const start = src.indexOf("const RAIL = [");
  const end = src.indexOf("] as const;", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const rows: RailRow[] = [];
  for (const entry of src
    .slice(start, end)
    .split(/\n\s*\{\s*\n/)
    .slice(1)) {
    const to = /to:\s*(?:"([^"]+)"|(SIGNED_IN_HOME))/.exec(entry);
    const icon = /Icon:\s*(Icon[A-Za-z]+)/.exec(entry)?.[1];
    if (!to || !icon) continue;
    rows.push({
      to: to[1] ?? SIGNED_IN_HOME,
      icon,
      count: /count:\s*"([a-z]+)"/.exec(entry)?.[1] ?? null,
    });
  }
  return rows;
}

describe("the phone bar and its More sheet cover exactly PRIMARY_NAV", () => {
  it("every BAR_TO entry is a real PRIMARY_NAV door", () => {
    const real = new Set(PRIMARY_NAV.map((d) => d.to));
    for (const to of BAR_TO) expect(real.has(to)).toBe(true);
  });

  it("BAR_TO has no duplicate and stays at five (the packet's own five)", () => {
    expect(new Set(BAR_TO).size).toBe(BAR_TO.length);
    expect(BAR_TO.length).toBe(5);
  });

  it("every PRIMARY_NAV door is either in the bar or falls through to the sheet", () => {
    const barTo = new Set(BAR_TO);
    const more = PRIMARY_NAV.filter((d) => !barTo.has(d.to));
    // bar + sheet accounts for the whole list, with no door dropped and none doubled
    expect(barTo.size + more.length).toBe(PRIMARY_NAV.length);
    for (const door of PRIMARY_NAV) {
      expect(barTo.has(door.to) || more.some((d) => d.to === door.to)).toBe(true);
    }
  });

  it("every PRIMARY_NAV door has an icon, so neither the bar nor the sheet ever draws blank", () => {
    for (const door of PRIMARY_NAV) expect(door.to in DOOR_ICON).toBe(true);
  });

  it("phoneBarCoversEveryDoor agrees", () => {
    expect(phoneBarCoversEveryDoor()).toBe(true);
  });
});

describe("the phone bar wears what the rail wears", () => {
  it("draws the rail's own glyph for every door RAIL draws", () => {
    const rows = railRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(`${row.to}: ${DOOR_ICON[row.to]?.name}`).toBe(`${row.to}: ${row.icon}`);
    }
  });

  it("counts exactly the rows the rail counts, under the rail's own key", () => {
    const counted = Object.fromEntries(
      railRows()
        .filter((r) => r.count)
        .map((r) => [r.to, r.count]),
    );
    expect(DOOR_COUNT).toEqual(counted);
    for (const to of Object.keys(DOOR_COUNT)) {
      expect(PRIMARY_NAV.some((d) => d.to === to)).toBe(true);
    }
  });

  it("speaks the count in the rail's own sentence", () => {
    // The desktop row's name is `${label}, ${n} waiting`; a screen reader
    // hears one sentence on both widths.
    expect(code(FRAME)).toContain(", ${n} waiting`");
    expect(code(BAR)).toContain(", ${n} waiting`");
  });
});
