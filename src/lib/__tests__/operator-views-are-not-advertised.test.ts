/**
 * NINE OF THE ENGINE ROOM'S TWENTY-SEVEN WRITES WERE ENGINEERING TOOLING SHOWN
 * TO A PRODUCT LEAD.
 *
 * Sorting every write on that surface by the job it serves: five set what agents
 * may do, four answer a held call, two are spending — and NINE are eval-suite
 * and prompt-version CRUD. Those nine sat behind two tabs in the Quality room,
 * as peers of "how well is the machine scoring today". Somebody who came to read
 * a score was handed a suite editor and a prompt-version manager beside it.
 *
 * The fix was not to delete them. They are real, they are used, and they change
 * what every agent in the workspace is measured against — which is precisely
 * Admin's stated job. `/admin/quality` mounts the same components.
 *
 * WHAT THIS FILE PROTECTS, and why each half matters:
 *
 *   1. The addresses still ANSWER. `?view=suites` and `?view=prompts` on
 *      /engine-room resolve, and the calibration panel's own rows link into
 *      them. Marking a view as operator must never strand a saved link — a door
 *      that is not advertised still opens. (The `/evals` stub this used to name
 *      was deleted by P-10 on 2026-09-02 along with the other 48 redirect-only
 *      routes, and the fifth review dropped the assertion that read it out of
 *      a map documenting doors that no longer exist. The property it was
 *      guarding is the one directly below it, which reads the live view list.)
 *   2. The tabs are NOT DRAWN. That is the whole point of the change, and it is
 *      the half that silently reverts: a later edit that maps the full list
 *      instead of the drawn one puts the suite editor straight back beside the
 *      score, and nothing would have failed.
 *   3. You are never stranded on a hidden tab. Standing in an operator view
 *      draws it, so the strip always shows where the reader actually is.
 */
import { describe, it, expect } from "bun:test";
import { ROOM_TAB_META, drawnRoomTabs, type RoomKey } from "@/lib/engine-room-glance";

const OPERATOR_VIEWS = ["suites", "prompts"] as const;

describe("engineering tooling is reachable but not advertised", () => {
  it("the eval-suite and prompt-version views are marked operator", () => {
    for (const id of OPERATOR_VIEWS) {
      const tab = ROOM_TAB_META.quality.find((t) => t.id === id);
      expect(tab).toBeDefined();
      expect(tab!.operator).toBe(true);
    }
  });

  it("their addresses still answer, so no saved link is stranded", () => {
    // Resolution reads the FULL list. If this ever narrows to the drawn set,
    // `?view=suites` silently falls back to the room's first view and the
    // reader lands somewhere they did not ask for.
    for (const id of OPERATOR_VIEWS) {
      expect(ROOM_TAB_META.quality.some((t) => t.id === id)).toBe(true);
    }
  });

  it("no tab is drawn for them while you are reading the score", () => {
    const drawn = drawnRoomTabs("quality", "score").map((t) => t.id);
    for (const id of OPERATOR_VIEWS) {
      expect(drawn).not.toContain(id);
    }
    // And the product views are all still there: this must hide two things, not
    // empty the strip.
    expect(drawn).toContain("score");
    expect(drawn).toContain("calibration");
    expect(drawn).toContain("drift");
    expect(drawn.length).toBe(ROOM_TAB_META.quality.length - OPERATOR_VIEWS.length);
  });

  it("standing in an operator view draws that one tab, so nobody loses their place", () => {
    for (const id of OPERATOR_VIEWS) {
      const drawn = drawnRoomTabs("quality", id).map((t) => t.id);
      expect(drawn).toContain(id);
      // Only the one you are standing in. The other stays hidden.
      const other = OPERATOR_VIEWS.find((o) => o !== id)!;
      expect(drawn).not.toContain(other);
    }
  });

  it("the other three rooms are untouched: every tab still draws", () => {
    // Scope stated rather than implied: this change is Quality-only, and a flag
    // that leaked into Spend, Safety or Record would hide a product view.
    for (const room of ["spend", "safety", "record"] as RoomKey[]) {
      expect(drawnRoomTabs(room, "nothing-matches-this").length).toBe(ROOM_TAB_META[room].length);
    }
  });
});
