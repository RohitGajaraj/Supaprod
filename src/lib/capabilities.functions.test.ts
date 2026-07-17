import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSkillInfos, getStationSkills } from "./capabilities.functions";
import { selectPlaybooksForStation } from "./playbooks/registry";

const discoveryPlaybooks = selectPlaybooksForStation("discovery");
const [jtbd, discoveryInterview] = discoveryPlaybooks;

describe("buildSkillInfos (PC-30 Skills section)", () => {
  it("includes every playbook bound to the station, even one never run", () => {
    const skills = buildSkillInfos(discoveryPlaybooks, new Map(), new Set());
    expect(skills).toHaveLength(discoveryPlaybooks.length);
    expect(skills.every((s) => s.runs === 0 && s.winRate === 0)).toBe(true);
  });

  it("carries run counts and win-rate through from the runs map", () => {
    const runsByPlaybook = new Map([[jtbd!.id, { wins: 2, total: 3 }]]);
    const skills = buildSkillInfos(discoveryPlaybooks, runsByPlaybook, new Set());
    const jtbdSkill = skills.find((s) => s.id === jtbd!.id);
    expect(jtbdSkill?.runs).toBe(3);
    expect(jtbdSkill?.wins).toBe(2);
    expect(jtbdSkill?.winRate).toBeCloseTo(2 / 3);
  });

  it("marks a disabled playbook enabled:false, others unaffected", () => {
    const skills = buildSkillInfos(discoveryPlaybooks, new Map(), new Set([jtbd!.id]));
    expect(skills.find((s) => s.id === jtbd!.id)?.enabled).toBe(false);
    expect(skills.find((s) => s.id === discoveryInterview!.id)?.enabled).toBe(true);
  });

  it("every playbook defaults to enabled with an empty disabled set", () => {
    const skills = buildSkillInfos(discoveryPlaybooks, new Map(), new Set());
    expect(skills.every((s) => s.enabled)).toBe(true);
  });

  it("sorts by run frequency, most-used first", () => {
    const runsByPlaybook = new Map([
      [jtbd!.id, { wins: 1, total: 1 }],
      [discoveryInterview!.id, { wins: 5, total: 5 }],
    ]);
    const skills = buildSkillInfos(discoveryPlaybooks, runsByPlaybook, new Set());
    expect(skills[0]!.id).toBe(discoveryInterview!.id);
  });

  it("returns [] for an empty bound-playbook list (a station with no PM method)", () => {
    expect(buildSkillInfos([], new Map(), new Set())).toEqual([]);
  });
});

type CapturedEq = { table: string; column: string; value: unknown };

/** A minimal fake of the .from().select().eq().eq() chain both queries in
 *  getStationSkills use, capturing every .eq() call by table so a test can
 *  pin exactly which station value reaches the query. */
function mockSupabase(opts: {
  playbookRuns?: { playbook_id: string; verdict: string | null }[];
  disabledPlaybookIds?: string[];
}): { client: SupabaseClient; calls: CapturedEq[] } {
  const calls: CapturedEq[] = [];
  const client = {
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: (column: string, value: unknown) => {
          calls.push({ table, column, value });
          return chain;
        },
        then: (resolve: (r: { data: unknown; error: null }) => void) => {
          if (table === "playbook_runs") {
            resolve({ data: opts.playbookRuns ?? [], error: null });
          } else if (table === "agent_disabled_skills") {
            resolve({
              data: (opts.disabledPlaybookIds ?? []).map((playbook_id) => ({ playbook_id })),
              error: null,
            });
          } else {
            resolve({ data: [], error: null });
          }
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("getStationSkills (PC-30: the actual bug fix under test)", () => {
  // Pins the specific regression this feature exists to fix: the old query
  // filtered playbook_runs.station against the raw AgentStation ("sense"),
  // which never matches any row (playbook_runs stores PlaybookStation values
  // like "discovery"). A revert to that shape must fail this test even
  // though buildSkillInfos's own tests, which only see an already-built map,
  // could never observe it.
  it("queries playbook_runs by the MAPPED PlaybookStation, not the raw AgentStation", async () => {
    const { client, calls } = mockSupabase({});
    await getStationSkills(client, "ws-1", "discovery-scout", "sense");

    const stationCall = calls.find((c) => c.table === "playbook_runs" && c.column === "station");
    expect(stationCall?.value).toBe("discovery");
    expect(stationCall?.value).not.toBe("sense");
  });

  it("scopes both queries to the given workspace", async () => {
    const { client, calls } = mockSupabase({});
    await getStationSkills(client, "ws-1", "discovery-scout", "sense");

    const workspaceCalls = calls.filter((c) => c.column === "workspace_id");
    expect(workspaceCalls.length).toBeGreaterThanOrEqual(2); // playbook_runs + agent_disabled_skills
    expect(workspaceCalls.every((c) => c.value === "ws-1")).toBe(true);
  });

  it("scopes the disabled-skills read to the given agent slug", async () => {
    const { client, calls } = mockSupabase({});
    await getStationSkills(client, "ws-1", "discovery-scout", "sense");

    const agentCall = calls.find(
      (c) => c.table === "agent_disabled_skills" && c.column === "agent_slug",
    );
    expect(agentCall?.value).toBe("discovery-scout");
  });

  it("returns real run counts and a real disabled flag end to end", async () => {
    const { client } = mockSupabase({
      playbookRuns: [
        { playbook_id: "jtbd", verdict: "validated" },
        { playbook_id: "jtbd", verdict: "missed" },
      ],
      disabledPlaybookIds: ["discovery-interview"],
    });
    const skills = await getStationSkills(client, "ws-1", "discovery-scout", "sense");

    const jtbdSkill = skills.find((s) => s.id === "jtbd");
    expect(jtbdSkill?.runs).toBe(2);
    expect(jtbdSkill?.wins).toBe(1);
    expect(skills.find((s) => s.id === "discovery-interview")?.enabled).toBe(false);
  });

  it("returns [] without querying for a station with no bound PM method (build/ship/design/learn)", async () => {
    const { client, calls } = mockSupabase({});
    const skills = await getStationSkills(client, "ws-1", "builder", "build");

    expect(skills).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("returns [] without querying when there is no workspace", async () => {
    const { client, calls } = mockSupabase({});
    const skills = await getStationSkills(client, null, "discovery-scout", "sense");

    expect(skills).toEqual([]);
    expect(calls).toEqual([]);
  });
});
