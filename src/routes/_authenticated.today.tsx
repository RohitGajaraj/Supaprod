import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/cadence/TopBar";
import { Button, SlideOver, SpotlightCard } from "@/components/obsidian";
import { useToast } from "@/components/obsidian/toast";
import { Hero } from "@/components/obsidian/today/Hero";
import { ColdStartOnramp } from "@/components/today/ColdStartOnramp";
import { type WhatChangedItem } from "@/components/obsidian/today/WhatChanged";
import { WatchLane } from "@/components/today/TodayLanes";
import { JudgmentLane } from "@/components/today/JudgmentLane";
import { FirstTeardownCard } from "@/components/today/FirstTeardownCard";
import { ReceiptsStrip } from "@/components/today/ReceiptsStrip";
import { ProductMasthead } from "@/components/today/ProductMasthead";
import { type ExpiredCall, type QueueCall } from "@/components/today/TriageQueue";
import { DeskRail } from "@/components/today/desk/DeskRail";
import { sortWithinGroup, expiryLabel, expiredAgo, gateHeadline } from "@/components/today/triage";
import { CallDetailSheet, type CallDetail } from "@/components/today/CallDetailSheet";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { stripAutoPrefix } from "@/components/plan/format";
import { useWorkspace } from "@/hooks/use-workspace";
import { useFlowMode } from "@/hooks/use-flow-mode";
import { supabase } from "@/integrations/supabase/client";
import { getGreeting } from "@/lib/greeting.functions";
import {
  getColdStart,
  getNeedsYou,
  getLoopPulse,
  snoozeApproval,
  type LoopPulse,
  type NeedsYou,
} from "@/lib/today.functions";
import { getTodayLanes } from "@/lib/today-lanes.functions";
import { listFanoutBatches } from "@/lib/fanout.functions";
import { CompositeReviewCard } from "@/components/build/CompositeReviewCard";
import { markInsightActioned } from "@/lib/brain-insights.functions";
import { resolveApproval } from "@/lib/governance.functions";
import { resolveAssumptionChallenge } from "@/lib/decisions.functions";
import { decidePlaybookProposal } from "@/lib/playbooks.functions";
import { useConfirm } from "@/hooks/use-confirm";
import { listLearnings } from "@/lib/outcome.functions";
import { rescoresOf } from "@/lib/moat-vis";
import { recordRitualSession } from "@/lib/gauntlet.functions";
import { getProductContext } from "@/lib/briefs.functions";
import { listProjects } from "@/lib/projects.functions";
import { getDashboard } from "@/lib/dashboard.functions";
import { PulsePrompt } from "@/components/cadence/PulsePrompt";
import { generateDailyBrief } from "@/lib/copilot.functions";
import { savePrd, updateOpportunity } from "@/lib/discovery.functions";
import { decideDesignGate } from "@/lib/design-scaffold.functions";
import { toolConsequence, REVERSIBILITY_LABEL } from "@/lib/tool-consequences";
import type { CriticReview } from "@/lib/discovery.functions";
import {
  TodayCoachMark,
  todayCoachMarkDismissed,
  shouldShowCoachMark,
} from "@/components/onboarding/TodayCoachMark";
import { CreditsWelcome, creditsWelcomeDismissed } from "@/components/onboarding/CreditsWelcome";

export const Route = createFileRoute("/_authenticated/today")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Today · Cadence" }] }),
});

// OBS-04 built the ritual screen; Loom W2-TODAY (DESIGN-LOOM §8b) rebuilt the
// queue as triage: calls group by family (Ship it? · Worth building? · Worth
// re-examining?), each group shows its top card in full and folds the rest
// behind a quiet inline "N more" expander — never a flat wall of cards. The
// single highest-stakes call carries the screen's one solid ember CTA. Under
// the hero: the My-day strip (meetings · tasks due, the tasks object's first
// UI since /tasks retired · Focus-next) and one quick-capture affordance that
// writes through the Discover composer path. Answering a call invalidates the
// queue so the next card advances into the top slot with no reload.
//
// Loom honesty fixes (register D-26 + §9b): tool gates now state their own
// catalogued consequence instead of borrowed PR copy; spec calls answer
// through savePrd (approve logs the decision, send-back returns to draft) and
// opportunity calls through updateOpportunity (keep -> Now, drop -> dropped) —
// the old wiring sent PRD/opportunity ids to resolveApproval, which matched
// nothing. A failed queue fetch shows an error card with a retry, never the
// all-clear.
//
// The "Later" defer verb now ships for tool gates: migration 20260707190000
// added agent_approvals.snoozed_until, snoozeApproval writes it (24h default),
// and getNeedsYou hides snoozed rows until the window passes — the call
// returns on its own, never silently dropped.

/** The one loop pulse that survived the LoopStrip retirement (2026-07-11):
 * a single plain past-tense sentence above the receipts strip. Empty string
 * when the last 24 hours produced nothing, so the line simply does not render. */
function pulseSentence(lp: LoopPulse): string {
  const parts: string[] = [];
  if (lp.signals > 0) parts.push(`sensed ${lp.signals} ${lp.signals === 1 ? "signal" : "signals"}`);
  if (lp.opportunities > 0)
    parts.push(
      `framed ${lp.opportunities} ${lp.opportunities === 1 ? "opportunity" : "opportunities"}`,
    );
  if (lp.specs > 0) parts.push(`drafted ${lp.specs} ${lp.specs === 1 ? "spec" : "specs"}`);
  if (lp.runs > 0) parts.push(`completed ${lp.runs} ${lp.runs === 1 ? "run" : "runs"}`);
  if (lp.memories > 0)
    parts.push(`saved ${lp.memories} ${lp.memories === 1 ? "memory" : "memories"}`);
  if (parts.length === 0) return "";
  const list =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
        ? `${parts[0]} and ${parts[1]}`
        : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  return `In the last 24 hours, Cadence ${list}.`;
}

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

/** Honest per-tool consequence line (register D-26): the catalogued effect +
 * its reversibility, never borrowed pull-request copy. */
function gateConsequence(toolName: string | null): string {
  const c = toolConsequence(toolName);
  return `${c.effect.replace(/\.$/, "")} · ${REVERSIBILITY_LABEL[c.reversible]}`;
}

/** Loom v4 §9: every empty state whispers the moat — a faint static
 * constellation of nodes and threads. Decorative, hidden from AT. */
/**
 * The brief as a spotlight (founder ruling 2026-07-04): three scannable
 * lines composed from live objects — the call that outranks the rest, the
 * newest outcome that moved a priority — with the AI prose one disclosure
 * deeper. Deterministic, instant, honest: it renders from data Today has
 * already loaded, so it can never dump a paragraph or wait on a model.
 */
function TodaySpotlight({
  callTitle,
  callKind,
  provedOut,
  briefSummary,
  onRefreshBrief,
  refreshing,
  onOpenCall,
  insightCount = 0,
}: {
  callTitle: string | null;
  callKind: string | null;
  provedOut: string | null;
  briefSummary: string | null;
  onRefreshBrief: () => void;
  refreshing: boolean;
  /** Dim 17: open the featured call's own detail from the spotlight line. */
  onOpenCall?: () => void;
  /** PC-32: pushed insights waiting in the judgment lane — the all-quiet
   *  line must never contradict a lane showing items (Love-Gate find). */
  insightCount?: number;
}) {
  const [fullOpen, setFullOpen] = React.useState(false);
  const monoLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--text-subtle)",
    flexShrink: 0,
  };
  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--text-body)",
    minWidth: 0,
  };
  return (
    // Loom §0.1.2 (prominence): the brief is the screen's one hero insight,
    // so it rides the SpotlightCard primitive — ember light while a call
    // pends, moss when the loop runs itself.
    <SpotlightCard
      aria-label="Today's brief"
      role="region"
      tone={callTitle || insightCount > 0 ? "ember" : "moss"}
      compact
      style={{ marginBottom: 12 }}
    >
      <div className="flex flex-col" style={{ gap: 7 }}>
        {callTitle ? (
          <div style={row}>
            <span style={{ ...monoLabel, color: "var(--ember-text)" }}>The call that matters</span>
            {onOpenCall ? (
              <button
                type="button"
                onClick={onOpenCall}
                title="Open this call"
                className="loom-press min-w-0 flex-1 truncate text-left outline-none transition-colors hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  color: "var(--text-primary)",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {callTitle}
                {callKind ? (
                  <span style={{ color: "var(--text-subtle)" }}> · {callKind.toLowerCase()}</span>
                ) : null}
              </button>
            ) : (
              <span className="min-w-0 flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                {callTitle}
                {callKind ? (
                  <span style={{ color: "var(--text-subtle)" }}> · {callKind.toLowerCase()}</span>
                ) : null}
              </span>
            )}
            <span style={{ ...monoLabel, color: "var(--text-faint)" }} aria-hidden="true">
              A approves · S sends back
            </span>
          </div>
        ) : (
          <div style={row}>
            {insightCount > 0 ? (
              <>
                <span style={{ ...monoLabel, color: "var(--ember-text)" }}>Waiting</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {insightCount === 1
                    ? "One pushed insight below needs your read."
                    : `${insightCount} pushed insights below need your read.`}
                </span>
              </>
            ) : (
              <>
                <span style={{ ...monoLabel, color: "var(--moss)" }}>All clear</span>
                <span style={{ color: "var(--text-muted)" }}>
                  Nothing needs your judgment right now.
                </span>
              </>
            )}
          </div>
        )}
        {provedOut ? (
          <div style={row}>
            <span style={monoLabel}>Proved out</span>
            <span className="min-w-0 flex-1 truncate">{provedOut}</span>
          </div>
        ) : null}
        <div style={row}>
          <button
            type="button"
            onClick={() => setFullOpen((v) => !v)}
            className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              ...monoLabel,
              color: "var(--text-subtle)",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {fullOpen ? "Hide the full brief" : "Read the full brief"}
          </button>
          {refreshing ? (
            // Feedback ruling 2026-07-08: the in-flight line stays visible even
            // with the brief collapsed, so a refresh never looks like it
            // silently died (same shimmer anatomy as AskPanel's status).
            <span
              role="status"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                background: "var(--shimmer-gradient)",
                backgroundSize: "280%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation: "cadShimmer 5s linear infinite",
              }}
            >
              {"Drafting today's brief…"}
            </span>
          ) : fullOpen ? (
            <button
              type="button"
              onClick={onRefreshBrief}
              className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                ...monoLabel,
                color: "var(--text-subtle)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          ) : null}
        </div>
        {fullOpen ? (
          briefSummary ? (
            <>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--text-body)",
                  margin: "2px 0 0",
                  maxWidth: "68ch",
                }}
              >
                {briefSummary}
              </p>
              <div style={{ marginTop: 8 }}>
                <PulsePrompt
                  surface="morning_brief"
                  targetId={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
              No written brief yet today. Refresh drafts one from this workspace.
            </p>
          )
        ) : null}
      </div>
    </SpotlightCard>
  );
}

function ConstellationMotif() {
  return (
    <svg
      aria-hidden="true"
      width="180"
      height="64"
      viewBox="0 0 180 64"
      fill="none"
      style={{ display: "block", marginBottom: 14, opacity: 0.35 }}
    >
      <path
        d="M14 46 L54 20 L92 40 L128 14 L164 34"
        stroke="var(--hairline-strong)"
        strokeWidth="1"
      />
      <path d="M54 20 L84 8 M92 40 L114 54" stroke="var(--hairline)" strokeWidth="1" />
      <circle cx="14" cy="46" r="2.5" fill="var(--text-faint)" opacity="0.55" />
      <circle cx="54" cy="20" r="3" fill="var(--text-subtle)" opacity="0.5" />
      <circle cx="84" cy="8" r="2" fill="var(--text-subtle)" />
      <circle cx="92" cy="40" r="2.5" fill="var(--text-faint)" opacity="0.45" />
      <circle cx="114" cy="54" r="2" fill="var(--text-subtle)" />
      <circle cx="128" cy="14" r="3" fill="var(--text-subtle)" opacity="0.5" />
      <circle cx="164" cy="34" r="2.5" fill="var(--text-faint)" opacity="0.55" />
    </svg>
  );
}

/** PC-32 block 5 — one quiet text door (link tier, sentence case): a real
 * destination with a count where one exists. Never a card, never a banner. */
function DoorLink({
  label,
  count,
  hint,
  onClick,
}: {
  label: string;
  count?: number;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className="loom-press inline-flex items-baseline outline-none transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
        gap: 6,
        fontFamily: "var(--font-ui)",
        fontSize: 12.5,
        fontWeight: 500,
        color: "var(--text-muted)",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        transitionDuration: "140ms",
      }}
    >
      {label}
      {typeof count === "number" ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "var(--text-faint)",
          }}
        >
          {count}
        </span>
      ) : null}
      <span aria-hidden="true" style={{ color: "var(--text-faint)", fontSize: 11 }}>
        →
      </span>
    </button>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const showToast = useToast();
  const { activeWorkspace } = useWorkspace();
  // PM Desk: the hero glow yields to the session edge glow while a block runs.
  const { isFlowMode } = useFlowMode();

  // ONE overlay at a time (2026-07-11 revamp): the landing shows the
  // starter-credit welcome first (it auto-dismisses after 9s), and the coach
  // mark only takes the stage on its dismissal - never both at once.
  const [overlay, setOverlay] = useState<"none" | "credits" | "coach">("none");
  const coachPendingRef = useRef(false);
  useEffect(() => {
    const justLanded = window.sessionStorage.getItem("cadence.onboarding.justLanded") === "1";
    window.sessionStorage.removeItem("cadence.onboarding.justLanded");
    const coachEligible = shouldShowCoachMark(justLanded, todayCoachMarkDismissed());
    if (justLanded && !creditsWelcomeDismissed()) {
      coachPendingRef.current = coachEligible;
      setOverlay("credits");
    } else if (coachEligible) {
      setOverlay("coach");
    }
  }, []);
  const advanceOverlay = () => {
    setOverlay(coachPendingRef.current ? "coach" : "none");
    coachPendingRef.current = false;
  };
  // CreditsWelcome renders nothing (and never calls onDismiss) when credit
  // metering is off or the grant is zero. This fallback advances past it after
  // its 9s hold plus a buffer, so the coach mark is never silently blocked;
  // advancing also unmounts the card, so the two can never co-render.
  useEffect(() => {
    if (overlay !== "credits") return;
    const t = window.setTimeout(advanceOverlay, 12_000);
    return () => window.clearTimeout(t);
  }, [overlay]);

  const fetchProjects = useServerFn(listProjects);
  const fetchGreeting = useServerFn(getGreeting);
  const fetchNeedsYou = useServerFn(getNeedsYou);
  const fetchFanoutBatches = useServerFn(listFanoutBatches);
  const fetchLoopPulse = useServerFn(getLoopPulse);
  const fetchLearnings = useServerFn(listLearnings);
  const fetchDashboard = useServerFn(getDashboard);
  const fetchLanes = useServerFn(getTodayLanes);
  const fetchProductContext = useServerFn(getProductContext);
  const mMarkInsight = useServerFn(markInsightActioned);
  const mResolveApproval = useServerFn(resolveApproval);
  const mSnoozeApproval = useServerFn(snoozeApproval);
  const mResolveChallenge = useServerFn(resolveAssumptionChallenge);
  const mDecideProposal = useServerFn(decidePlaybookProposal);
  const mSavePrd = useServerFn(savePrd);
  const mDecideDesignGate = useServerFn(decideDesignGate);
  const mUpdateOpp = useServerFn(updateOpportunity);
  const mBrief = useServerFn(generateDailyBrief);
  const recordRitual = useServerFn(recordRitualSession);

  useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });
  const needsYou = useQuery({ queryKey: ["needs-you"], queryFn: () => fetchNeedsYou() });
  // PC-12: composite fan-out review batches (draft/eval/risks reconciled into
  // one card). Dormant reads: an empty table when AGENT_FANOUT is off, so this
  // never shows anything on a workspace that hasn't turned exploration on.
  const fanoutBatches = useQuery({
    queryKey: ["fanout-batches"],
    queryFn: () => fetchFanoutBatches(),
  });
  const readyFanoutBatches = (fanoutBatches.data ?? []).filter((b) => b.status === "ready");
  const loopPulse = useQuery({ queryKey: ["loop-pulse"], queryFn: () => fetchLoopPulse() });
  const learnings = useQuery({ queryKey: ["learnings"], queryFn: () => fetchLearnings() });
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  // SW-5: the four-lane content model (Needs your judgment · What the swarm did ·
  // At risk/watch · Shipped and what it cost), each computed from real rows.
  const lanes = useQuery({ queryKey: ["today-lanes"], queryFn: () => fetchLanes() });
  // PC-32 block 2 (PC-33): the product masthead's identity object — scoped to
  // the ACTIVE workspace (Love-Gate find: resolving the default workspace put
  // "My workspace" on a screen labeled with the active product's name).
  const productContext = useQuery({
    queryKey: ["product-context", activeWorkspace?.id ?? "default"],
    queryFn: () => fetchProductContext({ data: { workspaceId: activeWorkspace?.id ?? null } }),
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
      const meta = u?.user_metadata as
        { display_name?: string; full_name?: string; name?: string } | undefined;
      const name =
        meta?.display_name ?? meta?.full_name ?? meta?.name ?? u?.email?.split("@")[0] ?? "there";
      setUserName(name);
    });
  }, []);
  const greeting = useQuery({
    queryKey: ["greeting", localHour],
    queryFn: () => fetchGreeting({ data: { localHour: localHour ?? new Date().getHours() } }),
    enabled: localHour !== null,
    staleTime: 30 * 60 * 1000,
  });

  // Cold-start gate (2026-07-11): a genuinely cold workspace swaps the hero
  // for the on-ramp. Same query key as ColdStartOnramp's own self-gate, so
  // the two can never disagree; a warm workspace pays one cached read.
  const fetchColdStart = useServerFn(getColdStart);
  const coldStart = useQuery({
    queryKey: ["cold-start"],
    queryFn: () => fetchColdStart(),
    staleTime: 60_000,
  });
  const isCold = coldStart.data?.isCold === true;

  // One ritual session recorded per Today mount (retention metric); strictly
  // best-effort, never blocks render, swallows every failure.
  const ritualRecorded = useRef(false);
  useEffect(() => {
    if (ritualRecorded.current) return;
    ritualRecorded.current = true;
    void recordRitual({ data: {} }).catch(() => {});
  }, []);

  const ny = needsYou.data;
  // R2-ATTENTION #1: the ONE needs-you truth is counts.liveCalls, computed
  // once server-side (live calls + pushed insights + ready fan-out batches).
  // The hero, the lane header, and the shell badge all read this number,
  // never a client-side re-derivation, which display caps and split queries
  // can understate or double-count. Expired gates are excluded server-side
  // (they live in the quiet Expired group).
  const callCount = ny?.counts.liveCalls ?? 0;
  const expiredTotal = ny?.counts.expired ?? 0;
  // The spotlight's zero-call sentence still names pushed insights
  // specifically (copy, not a count surface).
  const insightCount = lanes.data?.lane1.count ?? 0;

  const [clearedSession, setClearedSession] = useState(0);
  const answered = () => setClearedSession((c) => c + 1);

  // Dim 17 click-to-open: the id of the call whose detail sheet is open.
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // SHIP IT? — resolving an agent tool gate also executes the tool
  // server-side (resolveApproval semantics), so the copy says so.
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
        "today-lanes",
      ]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      answered();
      showToast(
        vars.decision === "approved"
          ? "Approved. The agent is unblocked."
          : "Sent back. Nothing runs without you.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });

  // LATER — the honest defer verb on a tool gate: snoozed_until hides the row
  // server-side for 24h, then it returns on its own. Optimistic removal so the
  // card leaves the queue immediately; the refetch confirms (or restores it).
  const snoozeGate = useMutation({
    mutationFn: (data: { approvalId: string }) => mSnoozeApproval({ data }),
    onMutate: async ({ approvalId }) => {
      await qc.cancelQueries({ queryKey: ["needs-you"] });
      const prev = qc.getQueryData<NeedsYou>(["needs-you"]);
      if (prev) {
        qc.setQueryData<NeedsYou>(["needs-you"], {
          ...prev,
          approvals: prev.approvals.filter((a) => a.id !== approvalId),
          counts: {
            ...prev.counts,
            approvals: Math.max(0, prev.counts.approvals - 1),
            liveCalls: Math.max(0, prev.counts.liveCalls - 1),
          },
        });
      }
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["needs-you"], ctx.prev);
      showToast(e.message);
    },
    onSuccess: () => showToast("Set aside. It returns in 24 hours."),
    onSettled: () => qc.invalidateQueries({ queryKey: ["needs-you"] }),
  });

  // WORTH BUILDING? (spec) — savePrd is the Plan surface's own write path:
  // approve logs the decision, send-back returns the spec to draft.
  const decidePrd = useMutation({
    mutationFn: (v: { id: string; ok: boolean }) =>
      mSavePrd({ data: { id: v.id, status: v.ok ? "approved" : "draft" } }),
    onSuccess: (_res, vars) => {
      for (const key of ["needs-you", "prds", "specs", "dashboard", "decisions", "today-lanes"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      answered();
      showToast(vars.ok ? "Spec approved. The decision is logged." : "Sent back to draft.");
    },
    onError: (e: Error) => showToast(e.message),
  });

  // SW-7 (mission 3.4): the design station's gate, decided from the same
  // queue as every other call. Approve writes a taste learning (the
  // scaffold-feedback writeback design-scaffold.functions.ts already does).
  const decideDesignGateCall = useMutation({
    mutationFn: (v: { id: string; ok: boolean }) =>
      mDecideDesignGate({ data: { prdId: v.id, decision: v.ok ? "approve" : "reject" } }),
    onSuccess: (_res, vars) => {
      for (const key of ["needs-you", "prds", "specs", "dashboard", "design-gate"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      answered();
      showToast(
        vars.ok ? "Design approved. This spec can now dispatch to Build." : "Changes requested.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });

  // WORTH BUILDING? (opportunity) — the Critic said revise/kill; the human's
  // call moves it out of backlog either way.
  const decideOpp = useMutation({
    mutationFn: (v: { id: string; ok: boolean }) =>
      mUpdateOpp({ data: { id: v.id, status: v.ok ? "now" : "dropped" } }),
    onSuccess: (_res, vars) => {
      for (const key of ["needs-you", "opportunities", "today-lanes"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      answered();
      showToast(
        vars.ok ? "Kept. It moves to Now on the roadmap." : "Dropped. The Critic's concern stands.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });

  // FS-02: a separate mutation — resolveAssumptionChallenge, not
  // resolveApproval, since a challenge id is not an approval id.
  const decideChallenge = useMutation({
    mutationFn: (data: { id: string; action: "confirm" | "dismiss" }) =>
      mResolveChallenge({ data }),
    onSuccess: (_res, vars) => {
      for (const key of ["needs-you", "decisions", "today-lanes"])
        qc.invalidateQueries({ queryKey: [key] });
      answered();
      showToast(
        vars.action === "confirm"
          ? "Reopened for review. The decision is back in your queue."
          : "Still holds. No change made.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });

  // SW-3 (mission 3.8b): adopt/dismiss a compounding-pass playbook proposal.
  // Dismiss is gated behind a destructive confirm (destructive-actions
  // convention): the sweep never re-proposes a dismissed group key, so a
  // single misclick would retire the compounded method for good.
  const confirmDialog = useConfirm();
  const decideProposal = useMutation({
    mutationFn: (data: { proposalId: string; decision: "confirm" | "dismiss" }) =>
      mDecideProposal({ data }),
    onSuccess: (_res, vars) => {
      for (const key of ["needs-you", "playbook-proposals"])
        qc.invalidateQueries({ queryKey: [key] });
      answered();
      showToast(
        vars.decision === "confirm"
          ? "Playbook adopted. It stays on the record with its source learnings."
          : "Proposal dismissed for good.",
      );
    },
    onError: (e: Error) => showToast(e.message),
  });
  const dismissProposal = (proposalId: string) => {
    void confirmDialog({
      title: "Dismiss this proposed playbook?",
      body: "This dismisses the proposal for good. The same lesson will not be proposed again.",
      confirmLabel: "Dismiss for good",
      destructive: true,
    }).then((ok) => {
      if (ok) decideProposal.mutate({ proposalId, decision: "dismiss" });
    });
  };

  const anyDeciding =
    decideApproval.isPending ||
    snoozeGate.isPending ||
    decidePrd.isPending ||
    decideOpp.isPending ||
    decideChallenge.isPending ||
    decideProposal.isPending;

  // ---- Triage grouping (DESIGN-LOOM §8b) --------------------------------
  // Dim 17 trace-and-time tail: the faintest tone for the trace ref, a touch
  // more presence for recency. Rendered on every call card.
  const traceNode = (prefix: string, id: string) => (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        letterSpacing: "0.06em",
        color: "var(--text-faint)",
      }}
    >
      {prefix}·{traceRef(id)}
    </span>
  );
  const timeNode = (iso: string) => (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        letterSpacing: "0.04em",
        color: "var(--text-subtle)",
      }}
    >
      {relTimeCaps(iso)}
    </span>
  );
  const shipCalls: QueueCall[] = sortWithinGroup(
    (ny?.approvals ?? []).map((a) => ({
      id: a.id,
      expiresAt: a.expires_at ? Date.parse(a.expires_at) : null,
      raisedAt: Date.parse(a.created_at) || 0,
      props: {
        kind: "SHIP IT?",
        expiry: expiryLabel(a.expires_at),
        // R2-ATTENTION #3: the headline names the catalogued outcome, never
        // the tool slug. The raw slug stays below, in the mono metadata rows.
        title: gateHeadline(a.agent_slug, a.tool_name),
        body: a.rationale ?? "Waiting on your approval.",
        ev: [
          { src: "TOOL", text: a.tool_name },
          ...(a.model ? [{ src: "MODEL", text: a.model }] : []),
          ...(a.est_cost_usd != null
            ? [{ src: "SPEND", text: `${fmtUsd(a.est_cost_usd)} so far on this call` }]
            : []),
        ],
        okLabel: "Approve",
        noLabel: "Send back",
        consequence: gateConsequence(a.tool_name),
        onOpen: () => setActiveCallId(a.id),
        traceRef: traceNode("MIS", a.trace_id ?? a.id),
        time: timeNode(a.created_at),
        onOk: () => decideApproval.mutate({ approvalId: a.id, decision: "approved" }),
        onNo: () => decideApproval.mutate({ approvalId: a.id, decision: "rejected" }),
        laterLabel: "Later",
        onLater: () => snoozeGate.mutate({ approvalId: a.id }),
      },
    })),
  );

  const buildCalls: QueueCall[] = sortWithinGroup([
    ...(ny?.prdCalls ?? []).map((p) => {
      const { body, ev } = criticEvidence(p.critic_review);
      return {
        id: p.id,
        expiresAt: null,
        raisedAt: Date.parse(p.updated_at) || 0,
        props: {
          kind: "WORTH BUILDING?",
          expiry: "",
          title: p.title,
          body,
          ev,
          okLabel: "Approve",
          noLabel: "Send back",
          consequence:
            "Approve marks the spec approved and logs the decision · Send back returns it to draft",
          onOpen: () => setActiveCallId(p.id),
          traceRef: traceNode("PRD", p.id),
          time: timeNode(p.updated_at),
          onOk: () => decidePrd.mutate({ id: p.id, ok: true }),
          onNo: () => decidePrd.mutate({ id: p.id, ok: false }),
        },
      };
    }),
    // The pinned "Your first teardown" card owns its opportunity; keep it out
    // of the generic build calls so the same call never renders twice.
    ...(ny?.oppCalls ?? [])
      .filter((o) => o.id !== ny?.firstTeardown?.id)
      .map((o) => {
        const { body, ev } = criticEvidence(o.critic_review);
        return {
          id: o.id,
          expiresAt: null,
          raisedAt: Date.parse(o.created_at) || 0,
          props: {
            kind: "WORTH BUILDING?",
            expiry: "",
            title: o.title,
            body,
            ev,
            okLabel: "Approve",
            noLabel: "Send back",
            consequence:
              "Approve keeps it and moves it to Now on the roadmap · Send back drops it from the backlog",
            onOpen: () => setActiveCallId(o.id),
            traceRef: traceNode("OPP", o.id),
            time: timeNode(o.created_at),
            onOk: () => decideOpp.mutate({ id: o.id, ok: true }),
            onNo: () => decideOpp.mutate({ id: o.id, ok: false }),
          },
        };
      }),
    // SW-7 (mission 3.4): a spec whose design mockup gate is undecided - the
    // design station's one queue entry, since it has no page of its own.
    ...(ny?.designGateCalls ?? []).map((p) => ({
      id: p.id,
      expiresAt: null,
      raisedAt: Date.parse(p.updated_at) || 0,
      props: {
        kind: "DESIGN READY?",
        expiry: "",
        title: p.title,
        body: "The generated mockup is waiting on your call before this spec can dispatch to Build.",
        ev: [],
        okLabel: "Approve",
        noLabel: "Send back",
        consequence: "Approve unblocks Build for this spec · Send back keeps the gate closed",
        onOpen: () => setActiveCallId(p.id),
        traceRef: traceNode("PRD", p.id),
        time: timeNode(p.updated_at),
        onOk: () => decideDesignGateCall.mutate({ id: p.id, ok: true }),
        onNo: () => decideDesignGateCall.mutate({ id: p.id, ok: false }),
      },
    })),
  ]);

  const reexamineCalls: QueueCall[] = sortWithinGroup([
    ...(ny?.assumptionCalls ?? []).map((c) => ({
      id: c.id,
      expiresAt: null,
      raisedAt: Date.parse(c.created_at) || 0,
      props: {
        kind: "WORTH RE-EXAMINING?",
        expiry: "",
        title: c.decisionTitle,
        body: `${c.assumptionStatement}. ${c.rationale}`,
        ev: c.evidenceText ? [{ src: "SIGNAL", text: c.evidenceText }] : [],
        okLabel: "Approve",
        noLabel: "Send back",
        consequence:
          "Approve reopens the decision for review · Send back keeps it standing as decided",
        onOpen: () => setActiveCallId(c.id),
        traceRef: traceNode("ASM", c.id),
        time: timeNode(c.created_at),
        onOk: () => decideChallenge.mutate({ id: c.id, action: "confirm" }),
        onNo: () => decideChallenge.mutate({ id: c.id, action: "dismiss" }),
      },
    })),
    // SW-3 (mission 3.8b): the compounding pass's proposals are Calls in the
    // one queue (Law 2) - the same lesson repeated until it became a method.
    ...(ny?.playbookCalls ?? []).map((p) => ({
      id: p.id,
      expiresAt: null,
      raisedAt: Date.parse(p.created_at) || 0,
      props: {
        kind: "MAKE IT A METHOD?",
        expiry: "",
        title: p.title,
        body: p.body,
        ev:
          p.sourceCount > 0
            ? [{ src: "LEARNINGS", text: `${p.sourceCount} same-shaped learnings behind this` }]
            : [],
        okLabel: "Approve",
        noLabel: "Send back",
        consequence:
          "Approve adopts the method on the record · Send back retires this proposal for good",
        onOpen: () => setActiveCallId(p.id),
        traceRef: traceNode("PBP", p.id),
        time: timeNode(p.created_at),
        onOk: () => decideProposal.mutate({ proposalId: p.id, decision: "confirm" }),
        onNo: () => dismissProposal(p.id),
      },
    })),
  ]);

  // PC-32 block 3: ONE flat judgment lane, consequence-ordered — expiring
  // ship gates first (needs-human-now with a closing window), then build
  // calls, then re-examinations. The lane shows 3; the rest fold.
  const allCalls: QueueCall[] = [...shipCalls, ...buildCalls, ...reexamineCalls];

  // R2-ATTENTION #2: expired gates, out of the live queue. resolveApproval
  // accepts an expired row (approve executes the tool now, reject closes it),
  // so both affordances are wired, not decorative.
  const expiredCalls: ExpiredCall[] = (ny?.expiredApprovals ?? []).map((x) => ({
    id: x.id,
    headline: gateHeadline(x.agent_slug, x.tool_name),
    tool: x.tool_name,
    agoLabel: expiredAgo(x.expires_at),
    onRun: () => decideApproval.mutate({ approvalId: x.id, decision: "approved" }),
    onDismiss: () => decideApproval.mutate({ approvalId: x.id, decision: "rejected" }),
  }));

  // Dim 17: the full backing object for each call, keyed by id, read by the
  // CallDetailSheet on click. Real getNeedsYou columns only; the action
  // handlers are the same mutations the cards wired, so deciding from the
  // sheet behaves identically.
  const callDetails: Record<string, CallDetail> = {};
  for (const a of ny?.approvals ?? []) {
    callDetails[a.id] = {
      kind: "ship",
      id: a.id,
      title: gateHeadline(a.agent_slug, a.tool_name),
      agentSlug: a.agent_slug,
      toolName: a.tool_name,
      rationale: a.rationale,
      escalationState: a.escalation_state,
      expiresAt: a.expires_at,
      createdAt: a.created_at,
      model: a.model,
      estCostUsd: a.est_cost_usd,
      missionId: a.missionId,
      okLabel: "Approve",
      noLabel: "Send back",
      onOk: () => decideApproval.mutate({ approvalId: a.id, decision: "approved" }),
      onNo: () => decideApproval.mutate({ approvalId: a.id, decision: "rejected" }),
    };
  }
  for (const p of ny?.prdCalls ?? []) {
    callDetails[p.id] = {
      kind: "spec",
      id: p.id,
      title: p.title,
      status: p.status,
      critic: p.critic_review,
      updatedAt: p.updated_at,
      okLabel: "Approve",
      noLabel: "Send back",
      onOk: () => decidePrd.mutate({ id: p.id, ok: true }),
      onNo: () => decidePrd.mutate({ id: p.id, ok: false }),
    };
  }
  for (const p of ny?.designGateCalls ?? []) {
    callDetails[p.id] = {
      kind: "spec",
      id: p.id,
      title: p.title,
      status: "design pending",
      critic: null,
      updatedAt: p.updated_at,
      okLabel: "Approve",
      noLabel: "Send back",
      onOk: () => decideDesignGateCall.mutate({ id: p.id, ok: true }),
      onNo: () => decideDesignGateCall.mutate({ id: p.id, ok: false }),
    };
  }
  for (const o of ny?.oppCalls ?? []) {
    callDetails[o.id] = {
      kind: "opportunity",
      id: o.id,
      title: o.title,
      critic: o.critic_review,
      createdAt: o.created_at,
      okLabel: "Approve",
      noLabel: "Send back",
      onOk: () => decideOpp.mutate({ id: o.id, ok: true }),
      onNo: () => decideOpp.mutate({ id: o.id, ok: false }),
    };
  }
  for (const c of ny?.assumptionCalls ?? []) {
    callDetails[c.id] = {
      kind: "assumption",
      id: c.id,
      title: c.decisionTitle,
      decisionTitle: c.decisionTitle,
      assumptionStatement: c.assumptionStatement,
      rationale: c.rationale,
      evidenceText: c.evidenceText,
      createdAt: c.created_at,
      okLabel: "Approve",
      noLabel: "Send back",
      onOk: () => decideChallenge.mutate({ id: c.id, action: "confirm" }),
      onNo: () => decideChallenge.mutate({ id: c.id, action: "dismiss" }),
    };
  }
  for (const p of ny?.playbookCalls ?? []) {
    callDetails[p.id] = {
      kind: "playbook",
      id: p.id,
      title: p.title,
      body: p.body,
      sourceCount: p.sourceCount,
      createdAt: p.created_at,
      okLabel: "Approve",
      noLabel: "Send back",
      onOk: () => decideProposal.mutate({ proposalId: p.id, decision: "confirm" }),
      onNo: () => dismissProposal(p.id),
    };
  }
  // Resolve the open detail; a call answered elsewhere (keyboard, card) simply
  // resolves to null and the sheet closes rather than showing a stale object.
  const activeDetail = activeCallId ? (callDetails[activeCallId] ?? null) : null;

  // OBS-04.md §5 step 11 + Loom: A/S answer the current featured Call (the
  // first card of the first non-empty group). The handler reads refs so the
  // effect never closes over a stale queue (register D-47), and stays quiet
  // while a decision is in flight.
  const featured = allCalls[0] ?? null;
  const featuredRef = useRef<QueueCall | null>(featured);
  featuredRef.current = featured;
  const decidingRef = useRef(anyDeciding);
  decidingRef.current = anyDeciding;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const current = featuredRef.current;
      if (!current || decidingRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "a") {
        e.preventDefault();
        current.props.onOk();
      } else if (key === "s") {
        e.preventDefault();
        current.props.onNo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const totalCalls = callCount + clearedSession;
  const clearedPct = totalCalls > 0 ? Math.round((clearedSession / totalCalls) * 100) : 100;

  const lp = loopPulse.data;

  const learningRows = learnings.data?.learnings ?? [];
  // PC-32: only the newest rescore feeds the Spotlight's "Proved out" line;
  // the full what-changed feed lives in Brain (learnings tab).
  const whatChangedItems: WhatChangedItem[] = rescoresOf(learningRows)
    .slice(0, 1)
    .map((r) => ({
      dot:
        r.verdict === "validated"
          ? "var(--moss)"
          : r.verdict === "missed"
            ? "var(--madder)"
            : "var(--text-faint)",
      text: `A ${r.verdict} outcome moved ${stripAutoPrefix(r.opportunity_title ?? "a priority")}: priority score ${r.priorIce.toFixed(1)} to ${r.newIce.toFixed(1)}.`,
      cause: "LEARNING · RE-RANKED",
      traceRef: `LRN·${traceRef(r.id)}`,
      time: relTimeCaps(r.created_at),
      onOpen: () =>
        navigate({ to: "/brain", search: { tab: "learnings", learning: r.id } as never }),
    }));

  // SW-5: "what the swarm did" is now Lane 2 (SwarmActivityLane) from real
  // stage_events grouped by mission — the running-agents strip it replaces.
  const lanesData = lanes.data;

  // PC-32 block 5: the doors row's two slide-overs (Desk = personal tools,
  // Watch = the reference lane; its consequential items already surface as
  // judgment calls). LoopHealthCard left Today — Engine Room owns loop health.
  const [deskOpen, setDeskOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);

  // Never assert "All clear" before the true call count has actually
  // arrived — OBS-04.md §7 "Loading" state: skeleton, no spinner, and the
  // hero must not flash a false all-clear ahead of real data.
  const needsYouLoaded = !needsYou.isPending && !needsYou.isError;

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Today"]} />
      {overlay === "coach" ? <TodayCoachMark onDismiss={() => setOverlay("none")} /> : null}
      {overlay === "credits" ? <CreditsWelcome onDismiss={advanceOverlay} /> : null}
      {/* Loom v4 §4b: Today rides the standard desktop container (1240px),
          not the v3 1060px column — the room is used, not framed. */}
      <div
        style={{
          maxWidth: "var(--container-standard)",
          width: "100%",
          margin: "0 auto",
          padding: "36px 32px 64px",
          animation: "cadRise 260ms var(--ease) both",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Loom §2b glow field: the one ambient wash behind the hero. Ember-warm
            only while calls actually pend; otherwise the default glacier light.
            While a focus block runs, this yields to the session edge glow so the
            screen never carries two ambient washes (review fix, §2b max one). */}
        {!isFlowMode ? (
          <div
            aria-hidden="true"
            className="loom-glow-field"
            data-tone={needsYouLoaded && callCount > 0 ? "ember" : undefined}
          />
        ) : null}
        {needsYouLoaded ? (
          <>
            {/* Cold workspace: the on-ramp IS the hero (never co-renders with
                it; ColdStartOnramp self-gates on the same cold-start query, so
                a warm workspace can never see both). */}
            {isCold ? (
              <ColdStartOnramp />
            ) : (
              <Hero
                greeting={greeting.data?.greeting ?? "Hello"}
                userName={userName}
                pendingCalls={callCount}
              />
            )}
          </>
        ) : (
          <>
            <h1 className="sr-only">Today</h1>
            <div
              aria-hidden="true"
              style={{
                height: 60,
                marginBottom: 18,
                borderRadius: "var(--radius-card)",
                background: "var(--surface-card-deep)",
                boxShadow: "var(--top-light)",
              }}
            />
          </>
        )}
        {/* PC-32 block 2 (PC-33): the product masthead — one quiet line
            grounding the ritual in the product's story. */}
        <ProductMasthead
          ctx={productContext.data}
          onOpen={() => navigate({ to: "/settings", search: { section: "workspace" } as never })}
        />
        {/* Founder ruling (2026-07-04): the brief LEADS the ritual — a
            spotlight composed from live objects (the call that matters, what
            proved out), never a paragraph dump; the AI prose is one
            disclosure deeper. */}
        {needsYouLoaded ? (
          <TodaySpotlight
            callTitle={featured?.props.title ?? null}
            callKind={featured?.props.kind ?? null}
            insightCount={insightCount}
            provedOut={whatChangedItems[0]?.text ?? null}
            briefSummary={dash.data?.brief?.summary ?? null}
            onRefreshBrief={() => regenBrief.mutate()}
            refreshing={regenBrief.isPending}
            onOpenCall={featured ? () => setActiveCallId(featured.id) : undefined}
          />
        ) : null}
        {/* PC-32: ONE column, one question. The judgment lane leads; the
            receipts strip narrates the night; four quiet doors hold the rest.
            The old two-column grid (8 sections, 8 questions) is retired. */}
        <div className="flex flex-col" style={{ gap: 26 }}>
          <section aria-label="Needs your judgment" className="flex flex-col" style={{ gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h2
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ember-text)",
                  margin: 0,
                }}
              >
                Needs your judgment
              </h2>
              {needsYouLoaded ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.12em",
                    color: "var(--text-faint)",
                  }}
                >
                  {callCount}
                </span>
              ) : null}
              <div
                style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }}
              />
            </div>
            {/* The pinned first teardown: the wedge's first artifact stays at
                the top of the judgment lane regardless of verdict (the old
                revise/kill filter silently dropped clean 'ship' verdicts)
                until the human answers it with Keep or Share. */}
            {needsYouLoaded && ny?.firstTeardown ? (
              <FirstTeardownCard
                teardown={ny.firstTeardown}
                onKeep={() => decideOpp.mutate({ id: ny.firstTeardown!.id, ok: true })}
                deciding={decideOpp.isPending}
              />
            ) : null}
            {readyFanoutBatches.length > 0 ? (
              <div className="flex flex-col" style={{ gap: 10 }}>
                {readyFanoutBatches.map((batch) => (
                  <CompositeReviewCard key={batch.id} batch={batch} />
                ))}
              </div>
            ) : null}
            {needsYou.isError ? (
              <div
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: "var(--radius-card)",
                  padding: "24px 26px",
                  boxShadow: "var(--top-light)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 19,
                    fontWeight: 460,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  Your calls didn't load.
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px" }}>
                  {needsYou.error instanceof Error
                    ? needsYou.error.message
                    : "The queue request failed."}
                </p>
                <Button variant="secondary" onClick={() => void needsYou.refetch()}>
                  Try again
                </Button>
              </div>
            ) : !needsYouLoaded ? (
              <div aria-hidden="true" className="flex flex-col" style={{ gap: 10 }}>
                <div
                  style={{
                    height: 12,
                    width: 130,
                    borderRadius: 4,
                    background: "var(--surface-card-deep)",
                  }}
                />
                <div
                  style={{
                    height: 190,
                    borderRadius: "var(--radius-card)",
                    background: "var(--surface-card-deep)",
                    boxShadow: "var(--top-light)",
                  }}
                />
              </div>
            ) : callCount === 0 && expiredTotal === 0 ? (
              <div
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(127,191,142,0.3)",
                  borderRadius: "var(--radius-card)",
                  padding: "28px 26px",
                  boxShadow: "var(--top-light)",
                }}
              >
                <ConstellationMotif />
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 21,
                    fontWeight: 450,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  Your queue is{" "}
                  <em style={{ fontStyle: "italic", color: "var(--moss)" }}>clear.</em>
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  New calls surface here first. Cadence keeps sensing in the background.
                </p>
              </div>
            ) : (
              <JudgmentLane
                calls={allCalls}
                insights={lanesData?.lane1.insights ?? []}
                onInsightOpen={() =>
                  navigate({ to: "/brain", search: { tab: "insights" } as never })
                }
                onInsightAct={(ins) => {
                  // SEAM-3 one-click: settle the push, then take the
                  // user to the action's surface. Fail-soft: the
                  // navigation happens regardless of the write.
                  void mMarkInsight({ data: { id: ins.id, outcome: "acted" } })
                    .catch(() => undefined)
                    .finally(() => {
                      void qc.invalidateQueries({ queryKey: ["today-lanes"] });
                    });
                  const kind = ins.action?.kind;
                  if (kind === "rerank_bets") {
                    navigate({ to: "/decide" });
                  } else if (kind === "open_decision") {
                    navigate({ to: "/brain", search: { tab: "decisions" } as never });
                  } else {
                    navigate({ to: "/brain", search: { tab: "insights" } as never });
                  }
                }}
                expired={{ total: expiredTotal, calls: expiredCalls }}
              />
            )}
            {totalCalls > 0 && needsYouLoaded && (
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
                    fontSize: 10.5,
                    color: "var(--text-subtle)",
                    marginTop: 6,
                    textTransform: "uppercase",
                  }}
                >
                  {/* LOOM W4 honesty: the old "N of M answered" denominator
                        shifted as new calls arrived mid-session. State the two
                        real numbers instead. */}
                  {clearedSession} answered · {callCount} open
                </div>
              </div>
            )}
          </section>

          {/* The loop pulse (2026-07-11): the LoopStrip rollup pills are
              retired; what survives is one plain past-tense sentence above
              the receipts strip. Renders nothing on a quiet day. */}
          {lp && lp.total > 0 ? (
            <p
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "var(--text-muted)",
                margin: "0 0 -14px",
              }}
            >
              {pulseSentence(lp)}
            </p>
          ) : null}
          {/* PC-32 block 4: "While you slept" — the receipts strip, max 5
              one-line acts with real actor bylines, replacing the swarm
              card grid. */}
          {lanesData ? (
            <ReceiptsStrip
              lane={lanesData.lane2}
              onOpenMission={(id) =>
                navigate({ to: "/build/$missionId", params: { missionId: id } })
              }
              onOpenActivity={() => navigate({ to: "/build" })}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                height: 140,
                borderRadius: "var(--radius-card)",
                background: "var(--surface-card-deep)",
                boxShadow: "var(--top-light)",
              }}
            />
          )}

          {/* PC-32 block 5: the doors row. Desk and Watch open in place;
              Activity's full history lives on Build; Shipped is the record,
              so it lives in Brain. Nothing removed, everything one door away. */}
          <nav
            aria-label="More on Today"
            className="flex flex-wrap items-baseline"
            style={{ gap: 22, paddingTop: 14, borderTop: "1px solid var(--hairline)" }}
          >
            <DoorLink
              label="Desk"
              hint="focus, tasks, capture, notes"
              onClick={() => setDeskOpen(true)}
            />
            <DoorLink
              label="Activity"
              hint="the full agent history"
              onClick={() => navigate({ to: "/build" })}
            />
            <DoorLink
              label="Shipped"
              count={lanesData?.lane4.shipped_count || undefined}
              hint="outcomes and what they cost"
              onClick={() => navigate({ to: "/brain", search: { tab: "learnings" } as never })}
            />
            <DoorLink
              label="Watch"
              count={lanesData?.lane3.count || undefined}
              hint="open risks and challenged assumptions"
              onClick={() => setWatchOpen(true)}
            />
          </nav>
        </div>
      </div>
      {/* PC-32 block 5: the Desk slide-over — personal tools are not
          judgment, so they live one door away, not on the canvas. */}
      <SlideOver open={deskOpen} onClose={() => setDeskOpen(false)} title="Your desk">
        <DeskRail bare />
      </SlideOver>
      <SlideOver open={watchOpen} onClose={() => setWatchOpen(false)} title="At risk / watch">
        {lanesData ? (
          <WatchLane lane={lanesData.lane3} bare />
        ) : (
          <div
            aria-hidden="true"
            style={{
              height: 120,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card-deep)",
              boxShadow: "var(--top-light)",
            }}
          />
        )}
      </SlideOver>
      <CallDetailSheet
        open={activeDetail !== null}
        onOpenChange={(next) => {
          if (!next) setActiveCallId(null);
        }}
        detail={activeDetail}
        deciding={anyDeciding}
      />
    </>
  );
}
