/**
 * P-81's own guard: "the bar and the sheet are generated from the same list
 * as the rail." `RailPhoneBar.tsx` builds both from `PRIMARY_NAV` by
 * filtering on `BAR_TO`, never by hand-copying a door's label or route -- this
 * reads the real exports and checks the property directly, so a future door
 * added to `PRIMARY_NAV` and forgotten here fails loudly instead of silently
 * missing a phone.
 */
import { describe, expect, it } from "bun:test";
import { PRIMARY_NAV } from "@/lib/nav-model";
import { BAR_TO, DOOR_ICON, phoneBarCoversEveryDoor } from "./RailPhoneBar";

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
