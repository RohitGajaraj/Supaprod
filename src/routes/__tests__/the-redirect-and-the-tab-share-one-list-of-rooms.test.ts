/**
 * P-79: the redirect (`/engine-room`) and the tab (`/team`'s Spend and
 * limits) must validate `room` against the SAME list, or a room name valid
 * on one and not the other would silently fall through the `?room=` filter
 * on whichever side forgot it -- the exact "two copies of a fact" shape
 * this repo keeps a ratchet against ([[F-189]] in FINDINGS-LEDGER.md).
 * Source-text, not a live render: both files import `ROOM_KEYS` from
 * `EngineRoomEmbedded.tsx` and neither declares its own.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const ENGINE_ROOM = readFileSync("src/routes/_authenticated.engine-room.tsx", "utf8");
const CREW = readFileSync("src/routes/_authenticated.team.tsx", "utf8");
const EMBEDDED = readFileSync("src/components/engine-room/EngineRoomEmbedded.tsx", "utf8");

describe("the redirect and the tab share one list of rooms", () => {
  it("EngineRoomEmbedded is the one place ROOM_KEYS is declared", () => {
    expect(EMBEDDED).toContain("export const ROOM_KEYS: RoomKey[]");
  });

  it("the redirect imports ROOM_KEYS rather than declaring its own room list", () => {
    expect(ENGINE_ROOM).toContain(
      'import { ROOM_KEYS } from "@/components/engine-room/EngineRoomEmbedded"',
    );
    expect(ENGINE_ROOM).not.toContain("const ROOM_KEYS");
  });

  it("the tab imports ROOM_KEYS rather than declaring its own room list", () => {
    expect(CREW).toContain(
      'import { EngineRoomEmbedded, ROOM_KEYS } from "@/components/engine-room/EngineRoomEmbedded"',
    );
    expect(CREW).not.toContain("const ROOM_KEYS");
  });

  it("the redirect forwards room, view, suite and surface, and translates agent to roomAgent", () => {
    expect(ENGINE_ROOM).toContain('to: "/team"');
    expect(ENGINE_ROOM).toContain('tab: "spend"');
    for (const field of ["room", "view", "suite", "roomAgent", "surface"]) {
      expect(ENGINE_ROOM).toContain(`${field}`);
    }
  });

  it("the tab renders EngineRoomEmbedded when tab=spend, before any other branch", () => {
    const at = CREW.indexOf('if (tab === "spend")');
    const agentAt = CREW.indexOf("return agent ?");
    const panelAt = CREW.indexOf('if (panel === "methods")');
    expect(at).toBeGreaterThan(-1);
    expect(agentAt).toBeGreaterThan(at);
    expect(panelAt).toBeGreaterThan(at);
  });
});
