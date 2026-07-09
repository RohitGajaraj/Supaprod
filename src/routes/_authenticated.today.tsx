import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/cadence/TopBar";
import { Button } from "@/components/obsidian";
import { useToast } from "@/components/obsidian/toast";
import { Hero } from "@/components/obsidian/today/Hero";
import { LoopStrip, type LoopSurface } from "@/components/obsidian/today/LoopStrip";
import { type WhatChangedItem } from "@/components/obsidian/today/WhatChanged";
import {
  SwarmActivityLane,
  WatchLane,
  ShippedLane,
  PushedInsights,
} from "@/components/today/TodayLanes";
import { LoopHealthCard } from "@/components/obsidian/today/LoopHealthCard";
import { StrategicBriefCard } from "@/components/obsidian/today/StrategicBriefCard";
import {
  TriageQueue,
  type ExpiredCall,
  type QueueCall,
  type QueueGroup,
} from "@/components/today/TriageQueue";
import { MyDayStrip } from "@/components/today/MyDayStrip";
import { QuickCapture } from "@/components/today/QuickCapture";
import { sortWithinGroup, expiryLabel, expiredAgo, gateHeadline } from "@/components/today/triage";
import { CallDetailSheet, type CallDetail } from "@/components/today/CallDetailSheet";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { stripAutoPrefix } from "@/components/plan/format";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { getGreeting } from "@/lib/greeting.functions";
import { getNeedsYou, getLoopPulse, snoozeApproval, type NeedsYou } from "@/lib/today.functions";
import { getTodayLanes } from "@/lib/today-lanes.functions";
import { markInsightActioned } from "@/lib/brain-insights.functions";
import { resolveApproval } from "@/lib/governance.functions";
import { resolveAssumptionChallenge } from "@/lib/decisions.functions";
import { decidePlaybookProposal } from "@/lib/playbooks.functions";
import { useConfirm } from "@/hooks/use-confirm";
import { listLearnings } from "@/lib/outcome.functions";
import { rescoresOf } from "@/lib/moat-vis";
import { listAgentRuns } from "@/lib/agents.functions";
import { recordRitualSession, getAcceptanceRate, getAutonomyRatio } from "@/lib/gauntlet.functions";
import { listProjects } from "@/lib/projects.functions";
import { getDashboard } from "@/lib/dashboard.functions";
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

// OBS-10: re-pointed at the real Discover/Plan destinations.
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
}: {
  callTitle: string | null;
  callKind: string | null;
  provedOut: string | null;
  briefSummary: string | null;
  onRefreshBrief: () => void;
  refreshing: boolean;
  /** Dim 17: open the featured call's own detail from the spotlight line. */
  onOpenCall?: () => void;
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
    <section
      aria-label="Today's brief"
      className="loom-hairline-fade"
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "14px 18px",
        marginBottom: 12,
        boxShadow: "var(--top-light)",
      }}
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
                className="loom-press min-w-0 flex-1 truncate text-left outline-none transition-colors hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
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
            <span style={{ ...monoLabel, color: "var(--moss)" }}>All quiet</span>
            <span style={{ color: "var(--text-muted)" }}>
              Nothing needs your judgment right now. The loop is running itself.
            </span>
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
            className="loom-press outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
            style={{
              ...monoLabel,
              color: "var(--glacier)",
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
              className="loom-press outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
              style={{
                ...monoLabel,
                color: "var(--glacier)",
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
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
              No written brief yet today. Refresh drafts one from this workspace.
            </p>
          )
        ) : null}
      </div>
    </section>
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
      <circle cx="14" cy="46" r="2.5" fill="var(--glacier)" opacity="0.55" />
      <circle cx="54" cy="20" r="3" fill="var(--blossom)" opacity="0.5" />
      <circle cx="84" cy="8" r="2" fill="var(--text-subtle)" />
      <circle cx="92" cy="40" r="2.5" fill="var(--glacier)" opacity="0.45" />
      <circle cx="114" cy="54" r="2" fill="var(--text-subtle)" />
      <circle cx="128" cy="14" r="3" fill="var(--blossom)" opacity="0.5" />
      <circle cx="164" cy="34" r="2.5" fill="var(--glacier)" opacity="0.55" />
    </svg>
  );
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
  const fetchLanes = useServerFn(getTodayLanes);
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
  const loopPulse = useQuery({ queryKey: ["loop-pulse"], queryFn: () => fetchLoopPulse() });
  const learnings = useQuery({ queryKey: ["learnings"], queryFn: () => fetchLearnings() });
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => fetchRuns() });
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  // SW-5: the four-lane content model (Needs your judgment · What the swarm did ·
  // At risk/watch · Shipped and what it cost), each computed from real rows.
  const lanes = useQuery({ queryKey: ["today-lanes"], queryFn: () => fetchLanes() });
  const acceptance = useQuery({
    queryKey: ["acceptance", 14],
    queryFn: () => fetchAcceptance({ data: { days: 14 } }),
  });
  const autonomy = useQuery({
    queryKey: ["autonomy", 14],
    queryFn: () => fetchAutonomy({ data: { days: 14 } }),
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
        | { display_name?: string; full_name?: string; name?: string }
        | undefined;
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

  // One ritual session recorded per Today mount (retention metric); strictly
  // best-effort, never blocks render, swallows every failure.
  const ritualRecorded = useRef(false);
  useEffect(() => {
    if (ritualRecorded.current) return;
    ritualRecorded.current = true;
    void recordRitual({ data: {} }).catch(() => {});
  }, []);

  const ny = needsYou.data;
  // R2-ATTENTION #1: the ONE needs-you truth is the server-side count —
  // never an array-length sum, which display caps can understate. Expired
  // gates are excluded server-side (they live in the quiet Expired group).
  const callCount = ny?.counts.liveCalls ?? 0;
  const expiredTotal = ny?.counts.expired ?? 0;

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
    ...(ny?.oppCalls ?? []).map((o) => {
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
          okLabel: "Keep it",
          noLabel: "Drop it",
          consequence: "Keep moves it to Now on the roadmap · Drop retires it from the backlog",
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
        okLabel: "Approve design",
        noLabel: "Request changes",
        consequence: "Approve unblocks Build for this spec · Request changes keeps the gate closed",
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
        okLabel: "Re-examine",
        noLabel: "Still holds",
        consequence: "Reopens the decision for review · nothing changes without you",
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
        okLabel: "Adopt playbook",
        noLabel: "Dismiss",
        consequence:
          "Adopt keeps the method on the record · Dismiss retires this proposal for good",
        onOpen: () => setActiveCallId(p.id),
        traceRef: traceNode("PBP", p.id),
        time: timeNode(p.created_at),
        onOk: () => decideProposal.mutate({ proposalId: p.id, decision: "confirm" }),
        onNo: () => dismissProposal(p.id),
      },
    })),
  ]);

  // Group chips read the server counts, so a display cap can never make a
  // chip understate (R2-ATTENTION #1).
  const groups: QueueGroup[] = [
    { family: "ship", calls: shipCalls, total: ny?.counts.approvals },
    {
      family: "build",
      calls: buildCalls,
      total: ny ? ny.counts.specs + ny.counts.opportunities + ny.counts.designGates : undefined,
    },
    {
      family: "reexamine",
      calls: reexamineCalls,
      total: ny ? ny.counts.assumptions + ny.counts.playbooks : undefined,
    },
  ];

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
      okLabel: "Approve design",
      noLabel: "Request changes",
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
      okLabel: "Keep it",
      noLabel: "Drop it",
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
      okLabel: "Re-examine",
      noLabel: "Still holds",
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
      okLabel: "Adopt playbook",
      noLabel: "Dismiss",
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
  const featured = shipCalls[0] ?? buildCalls[0] ?? reexamineCalls[0] ?? null;
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
  // Capped at 5 visible lines inside WhatChanged; 12 total bounds the fold.
  const whatChangedItems: WhatChangedItem[] = rescoresOf(learningRows)
    .slice(0, 12)
    .map((r) => ({
      dot:
        r.verdict === "validated"
          ? "var(--moss)"
          : r.verdict === "missed"
            ? "var(--madder)"
            : "var(--glacier)",
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
        ? "Approval hit rate + autonomy ratio · trending up"
        : acceptance.data?.trend === "down" || autonomy.data?.trend === "down"
          ? "Approval hit rate + autonomy ratio · needs attention"
          : "Approval hit rate + autonomy ratio · holding";

  // Never assert "All clear" before the true call count has actually
  // arrived — OBS-04.md §7 "Loading" state: skeleton, no spinner, and the
  // hero must not flash a false all-clear ahead of real data.
  const needsYouLoaded = !needsYou.isPending && !needsYou.isError;

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Today"]} />
      {showCoachMark ? <TodayCoachMark onDismiss={() => setShowCoachMark(false)} /> : null}
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
            only while calls actually pend; otherwise the default glacier light. */}
        <div
          aria-hidden="true"
          className="loom-glow-field"
          data-tone={needsYouLoaded && callCount > 0 ? "ember" : undefined}
        />
        {needsYouLoaded ? (
          <Hero
            greeting={greeting.data?.greeting ?? "Hello"}
            userName={userName}
            pendingCalls={callCount}
          />
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
        {/* Founder ruling (2026-07-04): the brief LEADS the ritual — a
            spotlight composed from live objects (the call that matters, what
            proved out), never a paragraph dump; the AI prose is one
            disclosure deeper. */}
        {needsYouLoaded ? (
          <TodaySpotlight
            callTitle={featured?.props.title ?? null}
            callKind={featured?.props.kind ?? null}
            provedOut={whatChangedItems[0]?.text ?? null}
            briefSummary={dash.data?.brief?.summary ?? null}
            onRefreshBrief={() => regenBrief.mutate()}
            refreshing={regenBrief.isPending}
            onOpenCall={featured ? () => setActiveCallId(featured.id) : undefined}
          />
        ) : null}
        <MyDayStrip />
        <QuickCapture />
        <LoopStrip
          counts={{ sense: lp?.signals ?? 0, define: lp?.specs ?? 0, learn: lp?.memories ?? 0 }}
          pendingCalls={callCount}
          workingCount={workingCount}
          onGo={goSurface}
        />
        {/* SW-5 (mission 3.11): Today's four segregated lanes. Lane 1 (Needs
            your judgment) is the ONLY ember lane; lanes 2-4 speak the calm
            machine voice. Left column carries the judgment + activity + shipped
            lanes; the right rail carries the watch lane + loop health + brief. */}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="flex flex-col" style={{ gap: 24 }}>
            {/* Lane 1 — Needs your judgment */}
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
                    {callCount + (lanesData?.lane1.count ?? 0)}
                  </span>
                ) : null}
                <div
                  style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }}
                />
              </div>
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
              ) : callCount === 0 && expiredTotal === 0 && (lanesData?.lane1.count ?? 0) === 0 ? (
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
                    All clear.{" "}
                    <em style={{ fontStyle: "italic", color: "var(--moss)" }}>
                      Enjoy the quiet roadmap.
                    </em>
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    The loop is running itself. New calls will find you here first.
                  </p>
                </div>
              ) : (
                <>
                  {callCount > 0 || expiredTotal > 0 ? (
                    <TriageQueue
                      groups={groups}
                      expired={{ total: expiredTotal, calls: expiredCalls }}
                    />
                  ) : null}
                  {lanesData ? (
                    <PushedInsights
                      lane={lanesData.lane1}
                      onOpen={() =>
                        navigate({ to: "/brain", search: { tab: "insights" } as never })
                      }
                      onAct={(ins) => {
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
                    />
                  ) : null}
                </>
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
            {/* Lane 2 — What the swarm did */}
            {lanesData ? (
              <SwarmActivityLane
                lane={lanesData.lane2}
                onOpenMission={(id) =>
                  navigate({ to: "/build/$missionId", params: { missionId: id } })
                }
              />
            ) : null}
            {/* Lane 4 — Shipped and what it cost */}
            {lanesData ? <ShippedLane lane={lanesData.lane4} /> : null}
          </div>
          <div className="flex flex-col" style={{ gap: 14 }}>
            {/* Lane 3 — At risk / watch */}
            {lanesData ? <WatchLane lane={lanesData.lane3} /> : null}
            <LoopHealthCard score={loopScore} note={loopNote} hue={loopHue} />
            <StrategicBriefCard />
          </div>
        </div>
      </div>
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
