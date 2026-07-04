import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/cadence/TopBar";
import { Surface } from "@/components/obsidian/Surface";
import { CallCard } from "@/components/obsidian/callcard";
import { useToast } from "@/components/obsidian/toast";
import { Hero } from "@/components/obsidian/today/Hero";
import { LoopStrip, type LoopSurface } from "@/components/obsidian/today/LoopStrip";
import { WhatChanged, type WhatChangedItem } from "@/components/obsidian/today/WhatChanged";
import { MachineNow, type MachineNowRow } from "@/components/obsidian/today/MachineNow";
import { LoopHealthCard } from "@/components/obsidian/today/LoopHealthCard";
import { StrategicBriefCard } from "@/components/obsidian/today/StrategicBriefCard";
import { TriageQueue } from "@/components/today/TriageQueue";
import { MyDayStrip } from "@/components/today/MyDayStrip";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { getGreeting } from "@/lib/greeting.functions";
import { getNeedsYou, getLoopPulse } from "@/lib/today.functions";
import { resolveApproval } from "@/lib/governance.functions";
import { resolveAssumptionChallenge } from "@/lib/decisions.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { rescoresOf } from "@/lib/moat-vis";
import { listAgentRuns } from "@/lib/agents.functions";
import { recordRitualSession, getAcceptanceRate, getAutonomyRatio } from "@/lib/gauntlet.functions";
import { listProjects } from "@/lib/projects.functions";
import { getDashboard } from "@/lib/dashboard.functions";
import { generateDailyBrief } from "@/lib/copilot.functions";
import { listMeetings } from "@/lib/meetings.functions";
import { listTasks } from "@/lib/tasks.functions";
import type { CriticReview } from "@/lib/discovery.functions";
import {
  TodayCoachMark,
  todayCoachMarkDismissed,
  shouldShowCoachMark,
} from "@/components/onboarding/TodayCoachMark";

export const Route = createFileRoute("/_authenticated/today")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Today · Cadence" }] }),
});

// OBS-04 — Today ported to Obsidian: the ritual screen. Hero (one ember
// italic count word) -> the loop strip -> the two-column grid (calls queue +
// the calls-answered bar + what-changed + the brief on the left, the one
// Loop Health aurora + machine-right-now on the right). No feature work
// rides along: every query below is consumed read-only exactly as the
// parchment Today did (OBS-04.md §8 "Keep" list, incl. `dashboard` for the
// brief); the only mutations are the existing resolveApproval and
// generateDailyBrief. Dropped without a re-skin, per the OBS-04 spec's scope
// (none have a clean Obsidian home in the prototype; a later item re-homes
// them if warranted): cold-start onramp, insight rail, focus-next, wedge
// teardown, the getting-started checklist, the tasks widget, and the
// command-center Bottlenecks/Top-priorities tiles (not part of the
// prototype's Today IA — §3 Scope IN names exactly what this screen shows).
// The session-local "Not now" defer is explicitly retired (see `decide`
// below), not silently dropped: the Obsidian Call object model has no defer
// verb.

// OBS-10: re-pointed at the real Discover/Plan destinations (was the interim
// /product?tab= scope, from before OBS-06/07 shipped their own routes).
const LOOP_SURFACE_TO: Record<LoopSurface, { to: string; search?: Record<string, string> }> = {
  discover: { to: "/discover" },
  today: { to: "/today" },
  define: { to: "/plan" },
  build: { to: "/build" },
  brain: { to: "/brain" },
};

function fmtUsd(n: number): string {
  if (n <= 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

/** Maps a Critic verdict into the CallCard's body + evidence rows, so a
 * "worth building?" call carries the same judgment the pre-port DecisionCard
 * showed — approving blind, with zero evidence, is not a real call. */
function criticEvidence(cr: CriticReview | null): {
  body: string;
  ev: { src: string; text: string }[];
} {
  if (!cr) return { body: "Waiting on your call. No Critic review yet.", ev: [] };
  const ev: { src: string; text: string }[] = [];
  if (cr.risks.length) ev.push({ src: "RISK", text: cr.risks[0] });
  if (cr.missing_evidence.length) ev.push({ src: "GAP", text: cr.missing_evidence[0] });
  return { body: cr.summary, ev };
}

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const showToast = useToast();
  const { activeWorkspace } = useWorkspace();

  // OBS-14 - the one coach mark the product shows: only right after the
  // onboarding flow hands off, and never again once dismissed.
  const [showCoachMark, setShowCoachMark] = useState(false);
  useEffect(() => {
    const justLanded = window.sessionStorage.getItem("cadence.onboarding.justLanded") === "1";
    if (shouldShowCoachMark(justLanded, todayCoachMarkDismissed())) setShowCoachMark(true);
    window.sessionStorage.removeItem("cadence.onboarding.justLanded");
  }, []);

  const fetchProjects = useServerFn(listProjects);
  const fetchGreeting = useServerFn(getGreeting);
  const fetchNeedsYou = useServerFn(getNeedsYou);
  const fetchLoopPulse = useServerFn(getLoopPulse);
  const fetchLearnings = useServerFn(listLearnings);
  const fetchRuns = useServerFn(listAgentRuns);
  const fetchAcceptance = useServerFn(getAcceptanceRate);
  const fetchAutonomy = useServerFn(getAutonomyRatio);
  const fetchDashboard = useServerFn(getDashboard);
  const fetchMeetings = useServerFn(listMeetings);
  const fetchTasks = useServerFn(listTasks);
  const mResolveApproval = useServerFn(resolveApproval);
  const mResolveChallenge = useServerFn(resolveAssumptionChallenge);
  const mBrief = useServerFn(generateDailyBrief);
  const recordRitual = useServerFn(recordRitualSession);

  useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });
  const needsYou = useQuery({ queryKey: ["needs-you"], queryFn: () => fetchNeedsYou() });
  const loopPulse = useQuery({ queryKey: ["loop-pulse"], queryFn: () => fetchLoopPulse() });
  const learnings = useQuery({ queryKey: ["learnings"], queryFn: () => fetchLearnings() });
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => fetchRuns() });
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  const acceptance = useQuery({
    queryKey: ["acceptance", 14],
    queryFn: () => fetchAcceptance({ data: { days: 14 } }),
  });
  const autonomy = useQuery({
    queryKey: ["autonomy", 14],
    queryFn: () => fetchAutonomy({ data: { days: 14 } }),
  });
  const meetings = useQuery({
    queryKey: ["meetings-today"],
    queryFn: () => fetchMeetings(),
    staleTime: 5 * 60 * 1000,
  });
  const tasks = useQuery({
    queryKey: ["tasks-today"],
    queryFn: () => fetchTasks(),
    staleTime: 5 * 60 * 1000,
  });
  const regenBrief = useMutation({
    mutationFn: () => mBrief(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Brief refreshed.");
    },
    onError: (e: Error) => showToast(e.message),
  });

  const [localHour, setLocalHour] = useState<number | null>(null);
  useEffect(() => {
    setLocalHour(new Date().getHours());
  }, []);

  const [userName, setUserName] = useState("there");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const name =
        (u?.user_metadata as { display_name?: string } | undefined)?.display_name ??
        u?.email?.split("@")[0] ??
        "there";
      setUserName(name);
    });
  }, []);
  const greeting = useQuery({
    queryKey: ["greeting", localHour],
    queryFn: () => fetchGreeting({ data: { localHour: localHour ?? new Date().getHours() } }),
    enabled: localHour !== null,
    staleTime: 30 * 60 * 1000,
  });

  // One ritual session recorded per Today mount (retention metric); strictly
  // best-effort, never blocks render, swallows every failure.
  const ritualRecorded = useRef(false);
  useEffect(() => {
    if (ritualRecorded.current) return;
    ritualRecorded.current = true;
    void recordRitual({ data: {} }).catch(() => {});
  }, []);

  const ny = needsYou.data;
  const callCount =
    (ny?.approvals.length ?? 0) +
    (ny?.prdCalls.length ?? 0) +
    (ny?.oppCalls.length ?? 0) +
    (ny?.assumptionCalls.length ?? 0);

  // The parchment "Not now" session-local defer is explicitly retired, not
  // silently carried over: the Obsidian Call object model (OBS-04.md hub
  // §5.10) has no defer verb, only decide(id, ok) — CallCard exposes exactly
  // two actions (Approve / Send back).
  const visibleApprovals = ny?.approvals ?? [];
  const visiblePrd = ny?.prdCalls ?? [];
  const visibleOpp = ny?.oppCalls ?? [];
  const visibleAssumption = ny?.assumptionCalls ?? [];

  const [clearedSession, setClearedSession] = useState(0);
  const decideApproval = useMutation({
    mutationFn: (data: { approvalId: string; decision: "approved" | "rejected" }) =>
      mResolveApproval({ data }),
    onSuccess: (_res, vars) => {
      // Cross-object sync (OBS-04.md §5 step 9): the whole screen and the
      // linked mission rewrite with no reload.
      for (const key of [
        "needs-you",
        "runs",
        "loop-pulse",
        "learnings",
        "dashboard",
        "studio-sessions",
      ]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      setClearedSession((c) => c + 1);
      showToast(
        vars.decision === "approved"
          ? "Good call. The PR is open."
          : "Sent back. Builder is revising · nothing ships.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });
  const decide = (id: string, ok: boolean) =>
    decideApproval.mutate({ approvalId: id, decision: ok ? "approved" : "rejected" });

  // FS-02: a separate mutation — resolveAssumptionChallenge, not resolveApproval,
  // since a challenge id is not an approval id.
  const decideChallenge = useMutation({
    mutationFn: (data: { id: string; action: "confirm" | "dismiss" }) =>
      mResolveChallenge({ data }),
    onSuccess: (_res, vars) => {
      for (const key of ["needs-you", "decisions"]) qc.invalidateQueries({ queryKey: [key] });
      showToast(
        vars.action === "confirm"
          ? "Reopened for review. The decision is back in your queue."
          : "Still holds. No change made.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });

  // OBS-04.md §5 step 11: A/S answer the current (first-rendered) Call.
  // Ignored inside inputs/textareas and when a modifier is held — the 1-5/g
  // rail map (OBS-02) owns the rest of the keyboard.
  const currentCallId = visiblePrd[0]?.id ?? visibleOpp[0]?.id ?? visibleApprovals[0]?.id ?? null;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!currentCallId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "a") {
        e.preventDefault();
        decide(currentCallId, true);
      } else if (key === "s") {
        e.preventDefault();
        decide(currentCallId, false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentCallId]);

  const totalCalls = callCount + clearedSession;
  const clearedPct = totalCalls > 0 ? Math.round((clearedSession / totalCalls) * 100) : 100;

  const goSurface = (surface: LoopSurface) => {
    const target = LOOP_SURFACE_TO[surface];
    navigate({ to: target.to, search: target.search as never });
  };

  const lp = loopPulse.data;
  const runRows = runs.data?.runs ?? [];
  const workingCount = runRows.filter(
    (r) => (r as { status?: string }).status === "running",
  ).length;

  const learningRows = learnings.data?.learnings ?? [];
  const whatChangedItems: WhatChangedItem[] = rescoresOf(learningRows)
    .slice(0, 4)
    .map((r) => ({
      dot:
        r.verdict === "validated"
          ? "var(--moss)"
          : r.verdict === "missed"
            ? "var(--madder)"
            : "var(--glacier)",
      text: `A ${r.verdict} outcome moved ${r.opportunity_title ?? "a priority"}: ICE ${r.priorIce.toFixed(1)} to ${r.newIce.toFixed(1)}.`,
      cause: "LEARNING · RE-RANKED",
    }));

  const machineNowRows: MachineNowRow[] = runRows
    .filter((r) => {
      const s = (r as { status?: string }).status;
      return s === "running" || s === "queued";
    })
    .slice(0, 4)
    .map((r) => {
      const row = r as unknown as {
        id: string;
        agent_name: string;
        input: string;
        status: string;
        spend_used_usd: number;
        mission_id: string | null;
      };
      const status = row.status === "running" ? "working" : ("queued" as const);
      return {
        id: row.id,
        title: (row.input || row.agent_name || "Untitled").slice(0, 72),
        status,
        step: status === "working" ? "WORKING" : "QUEUED",
        cost: fmtUsd(row.spend_used_usd ?? 0),
        onOpen: () =>
          row.mission_id
            ? navigate({ to: "/build/$missionId", params: { missionId: row.mission_id } })
            : navigate({ to: "/build" }),
      };
    });

  const acceptPct = acceptance.data?.rate != null ? Math.round(acceptance.data.rate * 100) : null;
  const autonomyPct = autonomy.data?.ratio != null ? Math.round(autonomy.data.ratio * 100) : null;
  const loopScore =
    acceptPct != null && autonomyPct != null ? Math.round((acceptPct + autonomyPct) / 2) : null;
  const loopHue =
    loopScore == null
      ? "healthy"
      : loopScore >= 60
        ? "healthy"
        : loopScore >= 35
          ? "attention"
          : "failing";
  const loopNote =
    loopScore == null
      ? "Not enough data yet · keep the loop running."
      : acceptance.data?.trend === "up" || autonomy.data?.trend === "up"
        ? "ON TRACK · TRENDING UP"
        : acceptance.data?.trend === "down" || autonomy.data?.trend === "down"
          ? "NEEDS ATTENTION"
          : "ON TRACK · HOLDING";

  // Never assert "All clear" before the true call count has actually
  // arrived — OBS-04.md §7 "Loading" state: skeleton, no spinner, and the
  // hero must not flash a false all-clear ahead of real data.
  const needsYouLoaded = !needsYou.isPending;

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Today"]} />
      {showCoachMark ? <TodayCoachMark onDismiss={() => setShowCoachMark(false)} /> : null}
      <Surface>
        {needsYouLoaded ? (
          <Hero
            greeting={greeting.data?.greeting ?? "Hello"}
            userName={userName}
            pendingCalls={callCount}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              height: 60,
              marginBottom: 28,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card-deep)",
            }}
          />
        )}
        <LoopStrip
          counts={{ sense: lp?.signals ?? 0, define: lp?.specs ?? 0, learn: lp?.memories ?? 0 }}
          pendingCalls={callCount}
          workingCount={workingCount}
          onGo={goSurface}
        />
        <div
          className="grid"
          style={{ gridTemplateColumns: "1.7fr 1fr", gap: 20, alignItems: "start" }}
        >
          <div className="flex flex-col" style={{ gap: 14 }}>
            {!needsYouLoaded ? (
              <div
                aria-hidden="true"
                style={{
                  height: 140,
                  borderRadius: "var(--radius-card)",
                  background: "var(--surface-card-deep)",
                }}
              />
            ) : (
              <>
                {/* LOOM W2-TODAY: My-day strip (meetings + tasks + focus-next) */}
                <MyDayStrip
                  meetings={meetings.data?.meetings?.length ?? 0}
                  tasksDue={tasks.data?.tasks?.filter((t: any) => !t.completed).length ?? 0}
                  onViewMeetings={() => goSurface("brain")}
                  onViewTasks={() => {}}
                />

                {/* LOOM W2-TODAY: Triage-grouped call queue */}
                <TriageQueue
                  isEmpty={callCount === 0}
                  emptyState={
                    <div
                      style={{
                        background: "var(--card)",
                        border: "1px solid rgba(127,191,142,0.3)",
                        borderRadius: "var(--radius-card)",
                        padding: "28px 26px",
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 21,
                          fontWeight: 450,
                          color: "var(--text-primary)",
                          margin: "0 0 6px",
                        }}
                      >
                        All clear.{" "}
                        <em style={{ fontStyle: "italic", color: "var(--moss)" }}>
                          Enjoy the quiet roadmap.
                        </em>
                      </h2>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                        The loop is running itself. New calls will find you here first.
                      </p>
                    </div>
                  }
                  calls={[
                    // PRDs
                    ...visiblePrd.map((p) => {
                      const { body, ev } = criticEvidence(p.critic_review);
                      return {
                        id: p.id,
                        kind: "WORTH BUILDING?" as const,
                        expiry: "",
                        title: p.title,
                        body,
                        ev,
                        okLabel: "Approve",
                        noLabel: "Send back",
                        consequence: "Opens the pull request · nothing ships without you",
                      };
                    }),
                    // Opportunities
                    ...visibleOpp.map((o) => {
                      const { body, ev } = criticEvidence(o.critic_review);
                      return {
                        id: o.id,
                        kind: "WORTH BUILDING?" as const,
                        expiry: "",
                        title: o.title,
                        body,
                        ev,
                        okLabel: "Approve",
                        noLabel: "Send back",
                        consequence: "Opens the pull request · nothing ships without you",
                      };
                    }),
                    // Approvals
                    ...visibleApprovals.map((a) => ({
                      id: a.id,
                      kind: "SHIP IT?" as const,
                      expiry: a.expires_at ? new Date(a.expires_at).toLocaleTimeString() : "",
                      title: `${a.agent_slug} wants to run ${a.tool_name}`,
                      body: a.rationale ?? "Waiting on your approval.",
                      ev: [] as { src: string; text: string }[],
                      okLabel: "Approve",
                      noLabel: "Send back",
                      consequence: "Opens the pull request · nothing ships without you",
                    })),
                    // Assumptions/Challenges
                    ...visibleAssumption.map((c) => ({
                      id: c.id,
                      kind: "WORTH RE-EXAMINING?" as const,
                      expiry: "",
                      title: c.decisionTitle,
                      body: `${c.assumptionStatement}. ${c.rationale}`,
                      ev: c.evidenceText ? [{ src: "SIGNAL", text: c.evidenceText }] : [],
                      okLabel: "Re-examine",
                      noLabel: "Still holds",
                      consequence: "Reopens the decision for review · nothing changes without you",
                    })),
                  ]}
                  onDecide={(id, approved) => {
                    // Determine whether this is an approval or a challenge
                    if (visibleApprovals.some((a) => a.id === id)) {
                      decide(id, approved);
                    } else if (visibleAssumption.some((c) => c.id === id)) {
                      decideChallenge.mutate({
                        id,
                        action: approved ? "confirm" : "dismiss",
                      });
                    } else {
                      decide(id, approved);
                    }
                  }}
                />
              </>
            )}
            {totalCalls > 0 && (
              <div>
                <div
                  style={{
                    height: 3,
                    background: "var(--hairline)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${clearedPct}%`,
                      background: "var(--ember)",
                      transition: "width 280ms var(--ease)",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--text-subtle)",
                    marginTop: 6,
                    textTransform: "uppercase",
                  }}
                >
                  {clearedSession} OF {totalCalls} ANSWERED
                </div>
              </div>
            )}
            <WhatChanged items={whatChangedItems} />
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-card)",
                padding: "16px 18px",
              }}
            >
              <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                <span
                  className="flex-1"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    color: "var(--text-subtle)",
                    textTransform: "uppercase",
                  }}
                >
                  Today's brief
                </span>
                <button
                  type="button"
                  onClick={() => regenBrief.mutate()}
                  disabled={regenBrief.isPending}
                  className="outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)] disabled:opacity-45"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--glacier)",
                    background: "transparent",
                    border: "none",
                    textTransform: "uppercase",
                  }}
                >
                  {regenBrief.isPending ? "Refreshing" : "Refresh"}
                </button>
              </div>
              {dash.data?.brief?.summary ? (
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-body)", margin: 0 }}>
                  {dash.data.brief.summary}
                </p>
              ) : (
                <p
                  style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-muted)", margin: 0 }}
                >
                  Drafting your brief from this workspace · about a minute.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: 14 }}>
            <LoopHealthCard score={loopScore} note={loopNote} hue={loopHue} />
            <MachineNow rows={machineNowRows} onOpenAll={() => navigate({ to: "/build" })} />
            <StrategicBriefCard />
          </div>
        </div>
      </Surface>
    </>
  );
}
