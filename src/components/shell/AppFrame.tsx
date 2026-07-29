/**
 * AppFrame - the one shell. Step 2 of the rebuild.
 *
 * Four regions and not eight (decided, session-handoff.md "What is decided"):
 *   header 56  ·  rail 236/64  ·  work  ·  Ask summoned
 *
 * It replaces AppShell.tsx, MissionShellView.tsx and RoomChrome.tsx. The
 * disease the rebuild is treating was three shells and a hardcoded pathname
 * list in _authenticated.tsx choosing between them, so this component takes
 * no "which shell" argument and has no per-route branch.
 *
 * Anatomy: PROTOTYPE-v2.html. Styles: src/styles/shell.css. Tokens:
 * src/styles/ink.css. Nothing here carries a literal colour or size.
 */

import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  agentStation,
  type AgentStation,
} from "@/lib/agent-vocabulary";
import { stageHueForStation } from "./agent-glyphs";
import { supabase } from "@/integrations/supabase/client";
import { listMissions } from "@/lib/missions.functions";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import {
  IconAsk,
  IconBrain,
  IconChevron,
  IconCrew,
  IconEngine,
  IconGear,
  IconPanel,
  IconRuns,
  IconToday,
} from "./icons";

/** The five rail rows. Decided, and not to be relitigated. Settings is not
 *  one of them: it is an icon at the foot, a door you open rather than a
 *  place you live. */
const RAIL = [
  { to: "/today", label: "Today", Icon: IconToday, count: "gates" },
  { to: "/m", label: "Runs", Icon: IconRuns, count: "runs" },
  { to: "/brain", label: "Brain", Icon: IconBrain, count: null },
  { to: "/crew", label: "Crew", Icon: IconCrew, count: null },
  { to: "/engine-room", label: "Engine room", Icon: IconEngine, count: null },
] as const;

const RAIL_KEY = "supaprod:rail-narrow";

function initialsFrom(email: string | null | undefined, name?: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Plain-words relative time. Mono digits are applied by the caller. */
function since(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeWorkspace, activeProduct } = useWorkspace();

  // The rail's collapsed state is the user's, so it survives a reload.
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    setNarrow(window.localStorage.getItem(RAIL_KEY) === "1");
  }, []);
  const toggleRail = React.useCallback(() => {
    setNarrow((v) => {
      window.localStorage.setItem(RAIL_KEY, v ? "0" : "1");
      return !v;
    });
  }, []);

  // The seven stages, revealed from the live line rather than living in the
  // chrome. Founder question: "is there any other way we can only showcase the
  // section that is actually being worked on?" This is the decided answer.
  const [stagesOpen, setStagesOpen] = React.useState(false);

  const [me, setMe] = React.useState<{ email: string | null; name: string | null }>({
    email: null,
    name: null,
  });
  React.useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      const u = data.user;
      setMe({
        email: u?.email ?? null,
        name: (u?.user_metadata?.full_name as string | undefined) ?? null,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const fetchMissions = useServerFn(listMissions);
  const fetchQueue = useServerFn(getApprovalsQueue);
  const workspaceId = activeWorkspace?.id ?? null;

  const missions = useQuery({
    queryKey: ["shell", "missions", workspaceId],
    queryFn: () => fetchMissions({ data: {} }),
    staleTime: 30_000,
  });
  const queue = useQuery({
    queryKey: ["shell", "approvals", workspaceId],
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
    staleTime: 30_000,
  });

  const rows = missions.data?.missions ?? [];
  const running = rows.filter((m) => m.status === "running");
  const gateCount = queue.data?.items.length ?? 0;

  // The most recently touched finished run, for the live line's second fact.
  const lastDone = React.useMemo(() => {
    const done = rows
      .filter((m) => m.status !== "running" && m.completed_at)
      .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    return done[0] ?? null;
  }, [rows]);

  const counts: Record<string, number> = { gates: gateCount, runs: running.length };

  // Which stage each signal belongs to, from real data only. A mission's
  // current agent names its station; a waiting gate names its own. A stage with
  // neither is quiet, and says so rather than inventing activity.
  const stageState = React.useMemo(() => {
    const working = new Set<AgentStation>();
    const gated = new Set<AgentStation>();
    for (const m of running) {
      const st = agentStation(m.current_agent_id);
      if (st) working.add(st);
    }
    for (const item of queue.data?.items ?? []) {
      const st = agentStation(item.agentSlug);
      if (st) gated.add(st);
    }
    return { working, gated };
  }, [running, queue.data]);

  const openAsk = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
  }, []);

  // Voice: never greet, always report. The first line is a fact.
  const liveLead = running.length
    ? running.length === 1
      ? "1 run working"
      : `${running.length} runs working`
    : "Nothing running";
  const liveState = running.length ? "running" : gateCount ? "gate" : "idle";

  const scopeLabel = activeWorkspace?.name ?? null;

  return (
    <div
      className="sp-app"
      data-rail={narrow ? "narrow" : "wide"}
      data-stages={stagesOpen ? "open" : "closed"}
    >
      <header className="sp-top">
        <Link to="/today" className="sp-brand" aria-label="Supaprod, go to Today">
          {/* mono + no glow: the mark is identity, not an event, and colour
              arrives only when something happens. The glow is also a recorded
              defect on the auth door (session-handoff.md), so it is not
              carried into the chrome. */}
          <span className="sp-logo">
            <SupaprodMark size={21} mono glow={false} />
          </span>
          <span className="sp-wordmark">Supaprod</span>
        </Link>

        {scopeLabel ? (
          <Link to="/settings" className="sp-scope" title="Workspace and product">
            {scopeLabel}
            {activeProduct?.name ? (
              <>
                <span className="sp-scope-sep">/</span>
                {activeProduct.name}
              </>
            ) : null}
            <IconChevron className="sp-chev" />
          </Link>
        ) : null}

        <button
          type="button"
          className="sp-live"
          onClick={() => setStagesOpen((v) => !v)}
          title={stagesOpen ? "Hide the seven stages" : "Show the seven stages"}
          aria-expanded={stagesOpen}
        >
          <span className="sp-live-dot" data-state={liveState} />
          <span className="sp-live-lead">{liveLead}</span>
          {lastDone ? (
            <>
              <span className="sp-live-sep" data-drop="2" aria-hidden="true">
                &middot;
              </span>
              <span className="sp-live-fact" data-drop="2">
                last: {lastDone.title}
              </span>
              {since(lastDone.completed_at) ? (
                <>
                  <span className="sp-live-sep" data-drop="1" aria-hidden="true">
                    &middot;
                  </span>
                  <span className="sp-live-fact sp-num" data-drop="1">
                    {since(lastDone.completed_at)}
                  </span>
                </>
              ) : null}
            </>
          ) : null}
        </button>

        <div className="sp-tools">
          <button type="button" className="sp-askbtn" onClick={openAsk}>
            <IconAsk className="sp-askbtn-icon" />
            Ask
            <span className="sp-askbtn-key">&#8984;J</span>
          </button>
          <Link
            to="/settings"
            className="sp-me"
            title={me.email ?? "Account"}
            aria-label="Account and settings"
          >
            {initialsFrom(me.email, me.name)}
          </Link>
        </div>
      </header>

      <div className="sp-strip" role="group" aria-label="The seven stages">
        {AGENT_STATION_ORDER.map((station, i) => {
          const isWorking = stageState.working.has(station);
          const isGated = stageState.gated.has(station);
          const state = isGated ? "gate" : isWorking ? "working" : "quiet";
          return (
            <div
              key={station}
              className="sp-stage"
              data-state={state}
              style={{ "--sp-hue": stageHueForStation(station) } as React.CSSProperties}
            >
              <div className="sp-stage-n">{String(i + 1).padStart(2, "0")}</div>
              <div className="sp-stage-name">{AGENT_STATIONS[station].name}</div>
              <div className="sp-stage-state">
                {isGated ? "waiting on you" : isWorking ? "working" : "quiet"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sp-mid">
        <aside className="sp-rail">
          <nav className="sp-nav" aria-label="Main">
            {RAIL.map(({ to, label, Icon, count }) => {
              const n = count ? counts[count] : 0;
              return (
                <Link
                  key={to}
                  to={to}
                  className="sp-navrow"
                  activeProps={{ "aria-current": "page" }}
                  title={narrow ? label : undefined}
                >
                  <Icon />
                  <span className="sp-navlabel">{label}</span>
                  {count && n > 0 ? (
                    <span className="sp-navcount" data-hot={count === "gates" ? "true" : "false"}>
                      {n}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="sp-railfoot">
            <Link
              to="/settings"
              className="sp-setbtn"
              title="Settings"
              aria-label="Settings"
              activeProps={{ "aria-current": "page" }}
            >
              <IconGear />
            </Link>
            <button
              type="button"
              className="sp-collapse"
              onClick={toggleRail}
              title={narrow ? "Expand the rail" : "Collapse the rail"}
              aria-label={narrow ? "Expand the rail" : "Collapse the rail"}
              aria-pressed={narrow}
            >
              <IconPanel />
            </button>
          </div>
        </aside>

        {/* The work region is a scroll container and nothing else. A ported
            surface opts into .sp-inner; an unported one renders raw so its
            own padding is not doubled. See shell.css TRANSITION RULE. */}
        <main className="sp-work" key={pathname}>
          {children}
        </main>
      </div>
    </div>
  );
}
