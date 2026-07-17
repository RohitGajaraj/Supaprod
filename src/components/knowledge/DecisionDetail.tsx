// DecisionDetail - Brain -> Decisions drill-down, rebuilt on the shared
// DetailKit anatomy (DESIGN-LOOM dim 17 / design-anatomy §3) so a decision
// reads identically to every other object detail: DetailHeader -> a neutral
// summary band (the call + rationale first) -> a compact StatStrip -> the
// consistent DetailSections -> an actions footer. Drill state rides ?decision=
// on /brain; the detail replaces only the tab body. Shares the ["decisions",
// ...] query cache, and SourceLink + OBS_STATUS_TONE from DecisionsPanel (one
// source, no drift).
//
// Trace ref: DEC (dim 17 registry, newly registered in DESIGN-LOOM dim 17 +
// design-anatomy §4). Timestamps via relTimeCaps (present tone), the full id
// copyable. Provenance links back up the loop: the source (mission / spec /
// meeting) opens in place, and "Trace in the graph" recentres the knowledge
// graph on this decision, where its supersession history (what it revised, and
// whether a later outcome revised it) is read. The verdict picker keeps the
// production updateDecision mutation. Real columns only: an absent rationale
// reads honestly, never a fabricated field.
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, Link2 } from "lucide-react";
import { AuditTag } from "@/components/cadence/AuditTag";
import { toast } from "@/lib/notify";
import { listDecisions, updateDecision, type DecisionSource } from "@/lib/decisions.functions";
import { getDecisionShareState, setDecisionShared } from "@/lib/decisions-share.functions";
import { getDecisionJudgment } from "@/lib/decision-judgment.functions";
import { getLineage } from "@/lib/lineage.functions";
import { Button, MonoLabel, VerdictChip } from "@/components/obsidian";
import { DetailHeader, DetailSection, StatCell, StatStrip } from "@/components/discover/DetailKit";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";
import { SourceLink, OBS_STATUS_TONE } from "./DecisionsPanel";
import { displayWho, hasSource, SOURCE_LABEL } from "./decisions-shared";
import { PanelSkeleton } from "./PanelSkeleton";
import { ContradictionAuditSection } from "./ContradictionAuditSection";
import { RewindButton } from "@/components/decisions/RewindButton";

function copyDecisionLink(slug: string) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/d/${slug}`;
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Public link copied"),
      () => toast.message(url),
    );
  } else {
    toast.message(url);
  }
}

/** A quiet mono-caps pill, so a decision's stage/source reads without a menu. */
function StatusPill({ label, tone = "var(--text-subtle)" }: { label: string; tone?: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: tone,
        border: "1px solid var(--hairline)",
        borderRadius: "999px",
        padding: "2px 8px",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

/** An absolute timestamp plus a quiet relative caption (the exemplar TimeLine). */
function TimeLine({ iso }: { iso: string }) {
  return (
    <span
      className="flex items-baseline"
      style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
    >
      <span>{new Date(iso).toLocaleString()}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          letterSpacing: "0.06em",
          color: "var(--text-faint)",
        }}
      >
        {relTimeCaps(iso)}
      </span>
    </span>
  );
}

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="material-medium"
      style={{
        background: "var(--card)",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );
}

/** Share / Unshare a decision + copy its public /d/<slug> link. Pre-migration
 *  tolerant: before the share columns land it shows a quiet "after sync" hint.
 *  Exported (RPT-01) so the Brain "recall card" search results can offer the
 *  same real share action on a matched decision without duplicating this
 *  logic - one component, every decision surface. */
export function ShareDecisionButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const fState = useServerFn(getDecisionShareState);
  const fSet = useServerFn(setDecisionShared);

  const state = useQuery({
    queryKey: ["decision-share", id],
    queryFn: () => fState({ data: { id } }),
  });
  const toggle = useMutation({
    mutationFn: (isPublic: boolean) => fSet({ data: { id, isPublic } }),
    onSuccess: (res) => {
      qc.setQueryData(["decision-share", id], res);
      if (res.is_public && res.share_slug) copyDecisionLink(res.share_slug);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = state.data;
  if (!s) return null;
  if (!s.available) {
    return (
      <MonoLabel
        style={{ fontSize: "var(--text-mono-floor)", color: "var(--text-subtle)" }}
        title="Sharing lights up after the next sync applies the share columns."
      >
        Share · after sync
      </MonoLabel>
    );
  }
  if (!s.is_public) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(true)}
        title="Make this decision public and copy a shareable link"
      >
        Share receipt
      </Button>
    );
  }
  return (
    <span className="flex items-center" style={{ gap: "8px" }}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => s.share_slug && copyDecisionLink(s.share_slug)}
        title="Copy the public link"
        aria-label="Copy the public link"
      >
        <Link2 size={14} strokeWidth={1.7} />
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(false)}
        title="Make private again"
      >
        Unshare
      </Button>
    </span>
  );
}

const STATUS_META: Record<"approved" | "rejected" | "pending", { word: string; lead: string }> = {
  approved: {
    word: "Kept",
    lead: "Kept. Agents read this before any mission that touches the same surface.",
  },
  rejected: {
    word: "Rejected",
    lead: "Rejected. The path not taken, on the record.",
  },
  pending: {
    word: "Pending",
    lead: "Awaiting your call. Decide it on Today, or set the verdict below.",
  },
};

export function DecisionDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fList = useServerFn(listDecisions);
  const fUpdate = useServerFn(updateDecision);
  const fJudgment = useServerFn(getDecisionJudgment);
  const fLineage = useServerFn(getLineage);

  const decisions = useQuery({
    queryKey: ["decisions", "all"],
    queryFn: () => fList({ data: {} }),
  });

  // SW-3 mission 3.2: the judgment loop behind the call. Real rows only:
  // alternatives_considered, the linked spec's Critic verdict, the Ambient
  // Precedent recall (which also writes the citation receipts server-side),
  // and cited_by_count.
  const judgment = useQuery({
    queryKey: ["decision-judgment", id],
    queryFn: () => fJudgment({ data: { id } }),
  });
  const lineage = useQuery({
    queryKey: ["lineage", "decision", id],
    queryFn: () => fLineage({ data: { kind: "decision", id } }),
  });

  const update = useMutation({
    mutationFn: (data: { id: string; status: "approved" | "rejected" | "pending" }) =>
      fUpdate({ data }),
    onSuccess: () => {
      // Prefix invalidation covers ["decisions", "all"] and every panel filter key.
      qc.invalidateQueries({ queryKey: ["decisions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onBack = () => navigate({ to: "/brain", search: { tab: "decisions" } });

  if (decisions.isLoading) return <PanelSkeleton />;

  if (decisions.isError) {
    return (
      <StateCard>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>
          Decision · failed to load
        </MonoLabel>
        <p style={{ fontSize: "var(--text-label-13)", color: "var(--text-muted)", marginBottom: 12 }}>
          {(decisions.error as Error)?.message ?? "Unknown error"}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void decisions.refetch()}>
          Retry
        </Button>
      </StateCard>
    );
  }

  const d = decisions.data?.decisions.find((x) => x.id === id);
  if (!d) {
    return (
      <StateCard>
        <MonoLabel style={{ marginBottom: 10, display: "block" }}>
          Decision not found · it may have been removed
        </MonoLabel>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back · all decisions
        </Button>
      </StateCard>
    );
  }

  const sourceKind = (d.source_kind ?? "manual") as DecisionSource;
  const sourceNoun = d.mission_id ? "mission" : d.prd_id ? "spec" : d.meeting_id ? "meeting" : null;
  const meta = STATUS_META[d.status];
  const decidedBy = displayWho(d.decided_by_agent_slug);

  // The judgment loop, from real rows; each block renders only when it has data.
  const alternatives = judgment.data?.alternatives ?? [];
  const critic = judgment.data?.critic ?? null;
  const precedents = judgment.data?.precedents ?? [];
  const citedByCount = judgment.data?.citedByCount ?? 0;
  const evidenceIn = lineage.data?.ancestors ?? [];
  const evidenceOut = lineage.data?.descendants ?? [];

  return (
    <div className="fade-up" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={onBack}
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          {"<-"} All decisions
        </button>
      </div>

      <div
        className="material-medium"
        style={{
          display: "grid",
          gap: "16px",
          background: "var(--card)",
          padding: "18px 20px",
        }}
      >
        <DetailHeader
          title={stripAutoPrefix(d.title)}
          chips={
            <>
              <VerdictChip tone={OBS_STATUS_TONE[d.status]} />
              <StatusPill label={`From ${SOURCE_LABEL[sourceKind]}`} />
              {isAutoTitle(d.title) ? <AutoChip /> : null}
            </>
          }
          time={
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9.5px",
                letterSpacing: "0.06em",
                color: "var(--text-subtle)",
              }}
            >
              DECIDED {relTimeCaps(d.created_at)}
            </span>
          }
          traceRef={<AuditTag kind="decision" id={d.id} copyable />}
        />

        {/* Summary band: the call + rationale, led first (calm neutral tint,
            Tempo v5 glacier narrowing, 2026-07-11: this is a card accent, not
            a status control, so it stays gray). */}
        <div
          style={{
            display: "grid",
            gap: "8px",
            background: "color-mix(in srgb, var(--text-subtle) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--text-subtle) 22%, transparent)",
            borderRadius: "var(--radius-card)",
            padding: "13px 15px",
          }}
        >
          <div className="flex flex-wrap items-baseline" style={{ gap: "8px" }}>
            <MonoLabel
              style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
            >
              The call
            </MonoLabel>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 550,
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              {meta.lead}
            </span>
          </div>
          {d.rationale ? (
            <p
              style={{
                fontSize: "12.5px",
                lineHeight: 1.6,
                color: "var(--text-subtle)",
                margin: 0,
              }}
            >
              {d.rationale}
            </p>
          ) : null}
        </div>

        {/* Glanceable summary: how it was made. */}
        <StatStrip columns={3}>
          <StatCell label="Source" value={SOURCE_LABEL[sourceKind]} tone="neutral" />
          <StatCell label="Decided by" value={decidedBy} tone="neutral" />
          <StatCell label="Age" value={relTimeCaps(d.created_at)} tone="neutral" />
        </StatStrip>

        {/* Precedent-recall receipt: how often later agent recalls cited this call. */}
        {citedByCount > 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>
            Cited as precedent {citedByCount} {citedByCount === 1 ? "time" : "times"} by later
            decision contexts.
          </p>
        ) : null}

        {/* Why. */}
        <DetailSection heading="Why">
          {d.rationale ? (
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--text-body)", margin: 0 }}>
              {d.rationale}
            </p>
          ) : (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-subtle)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              No rationale captured. Decisions are working memory, not minutes.
            </p>
          )}
        </DetailSection>

        {/* Alternatives considered: the paths not taken, rendered only when the
            row actually recorded any (decisions.alternatives_considered). */}
        {alternatives.length > 0 ? (
          <DetailSection heading="Alternatives considered">
            <div style={{ display: "grid", gap: "8px" }}>
              {alternatives.map((a, i) => (
                <div key={i} style={{ display: "grid", gap: "2px" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>{a.title}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.5 }}>
                    Rejected: {a.reason_rejected}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        ) : null}

        {/* Where it came from: the source opens in place; the graph link walks
            the provenance and the supersession history. */}
        <DetailSection
          heading="Where it came from"
          action={
            hasSource(d) && sourceNoun ? (
              <SourceLink
                d={d}
                className="loom-press flex items-center hover:[color:var(--text-primary)]"
                style={{
                  gap: "6px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  color: "var(--link)",
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open {sourceNoun}
              </SourceLink>
            ) : null
          }
        >
          <div style={{ display: "grid", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
              {SOURCE_LABEL[sourceKind]}
              {d.source_label ? ` · ${d.source_label}` : ""}
            </span>
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/brain",
                  search: { tab: "graph", focusKind: "decision", focusId: d.id },
                })
              }
              className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                fontSize: "12.5px",
                color: "var(--text-subtle)",
                background: "transparent",
                border: "none",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Trace it in the graph {"->"}
            </button>
          </div>
        </DetailSection>

        {/* Evidence: the real lineage edges in and out of this decision. */}
        {evidenceIn.length > 0 || evidenceOut.length > 0 ? (
          <DetailSection heading="Evidence">
            <div style={{ display: "grid", gap: "6px" }}>
              {evidenceIn.map((e) => (
                <span key={e.id} style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                  From {e.parent_kind.replace(/_/g, " ")}
                  {e.peer_title ? ` "${e.peer_title}"` : ""} · {e.relation}
                </span>
              ))}
              {evidenceOut.map((e) => (
                <span key={e.id} style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                  Fed {e.child_kind.replace(/_/g, " ")}
                  {e.peer_title ? ` "${e.peer_title}"` : ""} · {e.relation}
                </span>
              ))}
            </div>
          </DetailSection>
        ) : null}

        {/* Critic verdict: the red-team review persisted on the linked spec. */}
        {critic ? (
          <DetailSection heading="Critic verdict · on the linked spec">
            <div style={{ display: "grid", gap: "4px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                {critic.verdict.toUpperCase()} · confidence {Math.round(critic.confidence * 100)}%
                {critic.reviewed_at ? ` · ${relTimeCaps(critic.reviewed_at)}` : ""}
              </span>
              {critic.summary ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-subtle)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {critic.summary}
                </p>
              ) : null}
            </div>
          </DetailSection>
        ) : null}

        {/* RPT-25: the contradiction auditor. Drift pointed inward: re-reads the
            workspace's prior decisions on demand and flags the ones that
            disagree with this call, then lets the operator propose a real
            supersession edge. Mounted after the Critic/Evidence sections. */}
        <ContradictionAuditSection decisionId={d.id} />

        {/* Precedent: last time we reasoned this way, here is what happened.
            Outcome-weighted learnings via the Ambient Precedent recall; serving
            one also writes its citation receipt server-side. */}
        {precedents.length > 0 ? (
          <DetailSection heading="Precedent">
            <div style={{ display: "grid", gap: "8px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>
                Last time we reasoned this way, here is what happened.
              </p>
              {precedents.map((p) => (
                <div key={p.memoryId} style={{ display: "grid", gap: "2px" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                    {p.verdict.toUpperCase()}
                    {p.title ? ` · ${p.title}` : ""}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.5 }}>
                    {p.summary}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        ) : null}

        {/* The call: the human's verdict, wired to updateDecision. */}
        <DetailSection heading="Verdict · the human's call">
          <div style={{ display: "grid", gap: "10px" }}>
            <div className="flex flex-wrap items-center" style={{ gap: "6px" }}>
              {(["approved", "rejected", "pending"] as const).map((s) => {
                const selected = d.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: d.id, status: s })}
                    aria-pressed={selected}
                    className={`outline-none transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]${
                      selected ? "" : " hover:opacity-80"
                    }`}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: update.isPending ? "default" : "pointer",
                      opacity: selected ? 1 : 0.5,
                    }}
                  >
                    <VerdictChip tone={OBS_STATUS_TONE[s]} />
                  </button>
                );
              })}
            </div>
            <p
              style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.55, margin: 0 }}
            >
              Agents read this before any mission that touches the same surface.
            </p>
          </div>
        </DetailSection>

        {/* Stage history: real per-transition rows; renders nothing until the
            first transition lands. */}
        <StageTimeline entityType="decision" entityId={d.id} />

        {/* Activity. */}
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Decided</span>
            <TimeLine iso={d.created_at} />
          </div>
        </DetailSection>

        {/* Actions. */}
        <div
          className="flex flex-wrap items-center"
          style={{ gap: "10px", paddingTop: "15px", borderTop: "1px solid var(--hairline)" }}
        >
          <ShareDecisionButton id={d.id} />
          {/* PC-10: one-key rewind of an agent- or human-revised decision. Self-hides
              when there is no prior snapshot, so it only appears once a revision exists. */}
          <RewindButton
            decisionId={d.id}
            hasSnapshot={!!d.snapshot_before}
            onReverted={() => qc.invalidateQueries({ queryKey: ["decisions"] })}
          />
        </div>
      </div>
    </div>
  );
}
