import { describe, expect, it } from "bun:test";

import { crewPulse, crewPulseLine } from "./crew-pulse";
import type { SwarmHud } from "@/lib/swarm.functions";

/**
 * THE THREE SITUATIONS A CALM SCREEN CURRENTLY HIDES.
 *
 * Measured against the live database 2026-08-27: 622 agent runs, of which 621
 * finished without needing a person — 315 completed, 284 completed with
 * failures, 16 failed, 6 halted, and exactly 1 waiting on approval. The crew
 * last ran at 06:00 that morning. Every one of those facts is the product
 * working, and the board says none of them.
 *
 * The failure this guards is the opposite case and it looks identical: a
 * workspace whose crew has not run for days draws exactly the same calm screen.
 */

const NOW = Date.parse("2026-08-27T12:00:00.000Z");
const isoAgo = (ms: number) => new Date(NOW - ms).toISOString();
const ago = (iso: string | null | undefined) => {
  if (!iso) return null;
  const mins = Math.round((NOW - Date.parse(iso)) / 60_000);
  return mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`;
};

const hud = (agents: { enabled: boolean; at?: string | null }[]) =>
  ({
    agents: agents.map((a, i) => ({
      agent_id: `a${i}`,
      slug: `s${i}`,
      name: `A${i}`,
      role: "cast",
      color: "",
      enabled: a.enabled,
      trust_arc: null,
      latest_run: a.at === undefined ? null : { created_at: a.at },
    })),
  }) as unknown as SwarmHud;

describe("crewPulse", () => {
  it("counts only the agents that are switched on", () => {
    const p = crewPulse(hud([{ enabled: true }, { enabled: false }, { enabled: true }]), NOW);
    expect(p.enabled).toBe(2);
  });

  it("takes the most recent run across the whole crew", () => {
    const p = crewPulse(
      hud([
        { enabled: true, at: isoAgo(9 * 3_600_000) },
        { enabled: true, at: isoAgo(12 * 60_000) },
      ]),
      NOW,
    );
    expect(p.lastRunAt).toBe(NOW - 12 * 60_000);
  });

  it("refuses a future timestamp rather than reporting a run in 0 minutes", () => {
    const p = crewPulse(hud([{ enabled: true, at: new Date(NOW + 60_000).toISOString() }]), NOW);
    expect(p.lastRunAt).toBeNull();
  });

  it("survives a read that has not answered", () => {
    expect(crewPulse(undefined, NOW)).toEqual({ enabled: 0, lastRunAt: null });
  });
});

describe("crewPulseLine", () => {
  it("SAYS NOTHING while the read is outstanding, because zero agents and an unanswered read are the same value", () => {
    // This is the whole reason `known` exists. `crewPulse(undefined)` reports
    // zero enabled agents exactly as a workspace with none does, and rendering
    // the setup sentence there would send someone to configure a crew they
    // already have.
    expect(crewPulseLine({ enabled: 0, lastRunAt: null }, NOW, ago, false)).toBeNull();
  });

  it("names the SETUP state, which is not a quiet one", () => {
    expect(crewPulseLine({ enabled: 0, lastRunAt: null }, NOW, ago, true)).toBe(
      "No agent is switched on yet, so nothing can run here.",
    );
  });

  it("tells a working-quiet board apart from a stopped one", () => {
    const working = crewPulseLine({ enabled: 16, lastRunAt: NOW - 12 * 60_000 }, NOW, ago, true);
    const stopped = crewPulseLine({ enabled: 16, lastRunAt: NOW - 72 * 3_600_000 }, NOW, ago, true);
    expect(working).toBe("16 agents are on. The last one ran 12m ago.");
    expect(stopped).toBe("16 agents are on. The last one ran 72h ago.");
    // The point is not the wording, it is that they DIFFER. Today they do not.
    expect(working).not.toBe(stopped);
  });

  it("separates switched-on-but-never-run from both of those", () => {
    expect(crewPulseLine({ enabled: 3, lastRunAt: null }, NOW, ago, true)).toBe(
      "3 agents are on, and none of them has run yet.",
    );
  });

  it("counts one as one", () => {
    expect(crewPulseLine({ enabled: 1, lastRunAt: NOW - 5 * 60_000 }, NOW, ago, true)).toBe(
      "1 agent is on. The last one ran 5m ago.",
    );
  });

  it("still names the crew when the formatter cannot render the gap", () => {
    expect(crewPulseLine({ enabled: 4, lastRunAt: NOW - 60_000 }, NOW, () => null, true)).toBe(
      "4 agents are on.",
    );
  });
});
