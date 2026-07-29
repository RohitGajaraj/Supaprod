/**
 * Crew. The roster, ported onto the rebuild primitives (step 4).
 *
 * Crew is one of the five decided rail rows (session-handoff.md), and until
 * now it was the only one with no surface: /agents was mothballed in v5 and
 * the roster was folded into Engine Room > Safety > Team. That made the rail
 * light "Engine room" when you asked for Crew, which this closes.
 *
 * THIS IS THE ONE SURFACE WHERE COLOUR IS THE SUBJECT. Everywhere else in the
 * product the crew is monochrome and colour arrives only when something
 * happens. Here the roster IS the content, so each stage group wears its hue
 * and the marks take it, which is how you learn the encoding in one look:
 * the shape is the agent, the colour is the stage it works in.
 *
 * The roster is read from SPECIALIST_CATALOG (agent-vocabulary.ts), the
 * product's own source of truth, deduplicated by display name because many DB
 * slugs roll onto one identity. Live state is read from real missions: an
 * agent is "running" only when a mission says so.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import {
  AGENT_STATION_ORDER,
  AGENT_STATIONS,
  agentBlurb,
  castEntries,
  type AgentStation,
  type CatalogEntry,
} from "@/lib/agent-vocabulary";
import { listMissions } from "@/lib/missions.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { stageHueForStation } from "@/components/shell/agent-glyphs";
import { AgentMark, Num, PageHead, Surface } from "@/components/shell/primitives";

export const Route = createFileRoute("/_authenticated/crew")({
  component: Crew,
  head: () => ({ meta: [{ title: "Crew · Supaprod" }] }),
});

/** One entry per identity. The catalog carries five slugs that all mean
 *  "Watch"; the roster should show one Watch, not five. */
function roster(): CatalogEntry[] {
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const e of castEntries()) {
    if (seen.has(e.name)) continue;
    seen.add(e.name);
    out.push(e);
  }
  return out;
}

const NUMBER_WORD = [
  "None",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
];

function Crew() {
  const { activeWorkspace } = useWorkspace();
  const fetchMissions = useServerFn(listMissions);

  const missions = useQuery({
    queryKey: ["crew", "missions", activeWorkspace?.id ?? null],
    queryFn: () => fetchMissions({ data: {} }),
    staleTime: 30_000,
  });

  const all = React.useMemo(roster, []);

  const byStation = React.useMemo(() => {
    const map = new Map<AgentStation, CatalogEntry[]>();
    for (const e of all) {
      const list = map.get(e.station) ?? [];
      list.push(e);
      map.set(e.station, list);
    }
    return map;
  }, [all]);

  // Live state, from real runs only. A mission carries the agent that owns it
  // right now, so an agent reads as running when one of its missions is.
  const running = React.useMemo(() => {
    const ids = new Set<string>();
    for (const m of missions.data?.missions ?? []) {
      if (m.status === "running" && m.current_agent_id) ids.add(m.current_agent_id);
    }
    return ids;
  }, [missions.data]);

  const count = all.length;
  const headline =
    count < NUMBER_WORD.length ? `${NUMBER_WORD[count]} work here.` : `${count} work here.`;

  return (
    // wide: the roster is a grid, not prose, so it wants the room rather than
    // the 74ch measure.
    <Surface wide>
      <PageHead
        title={headline}
        sub="The shape is the agent, the colour is the stage it works in. Ember and blinking means it is waiting on you."
      />

      {AGENT_STATION_ORDER.map((station) => {
        const members = byStation.get(station);
        if (!members?.length) return null;
        const hue = stageHueForStation(station);
        return (
          <section
            className="sp-stagegroup"
            key={station}
            style={{ "--sp-hue": hue } as React.CSSProperties}
          >
            <div className="sp-sg-head">
              <span className="sp-sg-bar" aria-hidden="true" />
              <span className="sp-sg-name">{AGENT_STATIONS[station].name}</span>
              <span className="sp-sg-count">
                <Num>{members.length}</Num>
              </span>
            </div>
            <div className="sp-agrid">
              {members.map((e) => (
                <div className="sp-acard" key={e.slug}>
                  <AgentMark
                    slug={e.slug}
                    size="lg"
                    state={running.has(e.slug) ? "running" : "idle"}
                  />
                  <span>
                    <div className="sp-aname">{e.name}</div>
                    <div className="sp-asub">{agentBlurb(e.slug) ?? e.relayVerb}</div>
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </Surface>
  );
}
