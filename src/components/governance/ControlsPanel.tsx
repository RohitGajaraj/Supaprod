// Controls tab — ported 1:1 from design-reference/supaprod/loop.jsx
// (GovernScreen, tab "Controls"): the 2-col bento grid — Kill switch span-2
// with the 44×24 rose-track pill, Mission cap (serif 28 + "concurrent"),
// Stuck approvals (ember when >0, "open the queue →"), and Auto-pipelines
// span-2 with 34×19 deep-green switches. Production functionality kept:
// setWorkspacePause (with audit reason + system-pause lock), the reactor
// subscription CRUD (toggle / add / remove), the recent-runs usage table
// (token + spend caps, halted reasons) and the reactor activity queue with
// confirm-mode dispatch/skip — all restyled quiet-Ember.
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, Gauge, Layers, ShieldCheck, Zap } from "lucide-react";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getGovernanceOverview,
  setWorkspacePause,
  MISSION_CONCURRENCY_CAP,
} from "@/lib/governance.functions";
import { listTools, updateToolMode } from "@/lib/agent_loop.functions";
import { HIGH_RISK_FORCE_REVIEW, HIGH_RISK_MIN_CONFIRM } from "@/lib/ai/trust-ramp";
import {
  listEventSubscriptions,
  upsertEventSubscription,
  deleteEventSubscription,
  listEventQueue,
  decideEventDispatch,
} from "@/lib/reactor.functions";
import { MonoLabel, VerdictChip, StepDot, type VerdictTone } from "@/components/supaprod/Primitives";
import { relTime, fmtUsd } from "@/components/product/format";
import {
  CONSENT_PHILOSOPHY,
  groupToolsByConsequenceClass,
  type ConsentPostureId,
} from "@/lib/consent-classes";

/* RPT-36: the consent posture per class rendered as a quiet verdict chip, in
   the same three-color language the rest of the loop uses (green safe, ember
   drafts, rose gated). */
const POSTURE_TONE: Record<ConsentPostureId, VerdictTone> = {
  "auto-run": "moss",
  "ask-first": "indigo",
  "draft-to-you": "ember",
  "always-gate": "madder",
};

type EventType =
  | "signal.created"
  | "opportunity.scored"
  | "prd.approved"
  | "signal.clustered"
  | "outcome.recorded"
  | "decision.made";

/* The reference pill toggle — 44×24 for the kill switch, 34×19 for
   pipeline rows. Track turns `onColor` when on; knob slides. */
function PillSwitch({
  on,
  onToggle,
  disabled,
  size = "sm",
  onColor,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "lg" | "sm";
  onColor: string;
  label: string;
}) {
  const [w, h, knob, slide] = size === "lg" ? [44, 24, 18, 22] : [34, 19, 13, 16];
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: w,
        height: h,
        borderRadius: 99,
        background: on ? onColor : "var(--surface-2)",
        border: "1px solid var(--hairline)",
        position: "relative",
        flexShrink: 0,
        transition: "background var(--dur-base)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? slide : 2,
          width: knob,
          height: knob,
          borderRadius: 99,
          background: "var(--canvas)",
          transition: "left var(--dur-base)",
          boxShadow: "var(--shadow-glass)",
        }}
      />
    </button>
  );
}

type OversightMode = "auto" | "confirm" | "review";

const OVERSIGHT_STOPS: Array<{ mode: OversightMode; label: string; hint: string }> = [
  { mode: "auto", label: "Auto", hint: "Runs on its own" },
  { mode: "confirm", label: "Ask first", hint: "Asks you before each run" },
  { mode: "review", label: "Review", hint: "Waits for your full review" },
];

/* Three-stop oversight control for one tool. The safety floors are honest
   here, not decorative: force-review tools render pinned (no control at
   all), and min-confirm tools grey out the Auto stop. */
function ModeSegment({
  value,
  disabled,
  onSelect,
  autoBlocked,
}: {
  value: OversightMode;
  disabled?: boolean;
  onSelect: (m: OversightMode) => void;
  autoBlocked?: boolean;
}) {
  return (
    <span
      role="radiogroup"
      aria-label="Oversight mode"
      style={{
        display: "inline-flex",
        border: "1px solid var(--hairline)",
        borderRadius: 99,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {OVERSIGHT_STOPS.map((s) => {
        const active = s.mode === value;
        const blocked = s.mode === "auto" && autoBlocked;
        return (
          <button
            key={s.mode}
            role="radio"
            aria-checked={active}
            title={blocked ? "This tool never runs unattended. Safety floor." : s.hint}
            disabled={disabled || blocked || active}
            onClick={() => onSelect(s.mode)}
            style={{
              padding: "4px 10px",
              background: active ? "var(--surface-2)" : "transparent",
              color: blocked
                ? "var(--text-subtle)"
                : active
                  ? "var(--text-body)"
                  : "var(--ink-subtle)",
              fontWeight: active ? 600 : 400,
              cursor: disabled || blocked || active ? "default" : "pointer",
              opacity: blocked ? 0.45 : disabled ? 0.6 : 1,
              border: "none",
              transition: "background var(--dur-base)",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </span>
  );
}

const RUNS_GRID = "1fr 100px 130px 140px 70px";

// LOOM v4 (§2): cards catch the light from above and cast ambient depth.
const V4_CARD = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  boxShadow: "var(--shadow-elevated)",
} as const;

export function ControlsPanel({ onOpenQueue }: { onOpenQueue?: () => void }) {
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const overviewFn = useServerFn(getGovernanceOverview);
  const pauseFn = useServerFn(setWorkspacePause);
  const listSubsFn = useServerFn(listEventSubscriptions);
  const upsertSubFn = useServerFn(upsertEventSubscription);
  const deleteSubFn = useServerFn(deleteEventSubscription);
  const listQueueFn = useServerFn(listEventQueue);
  const decideEvtFn = useServerFn(decideEventDispatch);
  const listToolsFn = useServerFn(listTools);
  const updateToolModeFn = useServerFn(updateToolMode);

  const overview = useQuery({
    queryKey: ["governance", "overview", activeWorkspaceId],
    queryFn: () => overviewFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const subsQ = useQuery({
    queryKey: ["reactor", "subs", activeWorkspaceId],
    queryFn: () => listSubsFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const queueQ = useQuery({
    queryKey: ["reactor", "queue", activeWorkspaceId],
    queryFn: () => listQueueFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
    refetchInterval: 5000,
  });
  const toolsQ = useQuery({
    queryKey: ["agent-tools", "oversight"],
    queryFn: () => listToolsFn(),
  });

  const toolModeMut = useMutation({
    mutationFn: (v: { toolId: string; mode: OversightMode; name: string }) =>
      updateToolModeFn({ data: { toolId: v.toolId, mode: v.mode } }),
    onSuccess: (_d, v) => {
      toast.success(
        v.mode === "auto"
          ? `${v.name} runs on its own again.`
          : v.mode === "confirm"
            ? `${v.name} will ask before each run.`
            : `${v.name} now waits for your review.`,
      );
      qc.invalidateQueries({ queryKey: ["agent-tools"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [reason, setReason] = useState("");
  const pauseMut = useMutation({
    mutationFn: (next: boolean) =>
      pauseFn({ data: { workspaceId: activeWorkspaceId!, paused: next, reason: reason || null } }),
    onSuccess: (_d, next) => {
      // Pause copy is the reference contract; resume copy corrected — halted
      // runs do not auto-resume in production, agents simply may run again.
      toast.success(
        next
          ? "Agents paused. Every agent is holding, nothing was lost."
          : "Agents resumed. They can run again.",
      );
      setReason("");
      qc.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  type UpsertSubInput = {
    id?: string;
    event_type: EventType;
    target_agent_slug: string;
    approval_mode: "auto" | "confirm";
    enabled?: boolean;
    filter?: Record<string, unknown>;
  };
  const pipeName = (s: { event_type: string; target_agent_slug: string }) =>
    `${s.event_type} → ${s.target_agent_slug}`;

  const toggleSubMut = useMutation({
    mutationFn: (v: UpsertSubInput & { name: string }) => upsertSubFn({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(`${v.name} ${v.enabled ? "on" : "off"}.`);
      qc.invalidateQueries({ queryKey: ["reactor", "subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const addSubMut = useMutation({
    mutationFn: (v: UpsertSubInput) => upsertSubFn({ data: v }),
    onSuccess: () => {
      toast.success("Rule added. It fires on the next event.");
      setAddOpen(false);
      qc.invalidateQueries({ queryKey: ["reactor", "subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteSubMut = useMutation({
    mutationFn: (id: string) => deleteSubFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Rule removed. It stops firing.");
      qc.invalidateQueries({ queryKey: ["reactor", "subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const decideEvtMut = useMutation({
    mutationFn: (v: { eventId: string; decision: "approve" | "reject" }) =>
      decideEvtFn({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(
        v.decision === "approve" ? "Dispatching · the agent runs now." : "Skipped · nothing ran.",
      );
      qc.invalidateQueries({ queryKey: ["reactor"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<EventType>("signal.created");
  const [newAgent, setNewAgent] = useState("discovery");
  const [newMode, setNewMode] = useState<"auto" | "confirm">("confirm");
  const [newMinScore, setNewMinScore] = useState("8");

  const data = overview.data;
  const ks = data?.killState;
  const killed = !!(ks?.system_paused || ks?.workspace_paused);
  const killDisabled = pauseMut.isPending || !!ks?.system_paused || !activeWorkspaceId;
  const stuck = (data?.approvals ?? []).filter((a) => a.escalation_state === "expired").length;
  const subs = subsQ.data?.subscriptions ?? [];
  const runs = data?.runs ?? [];
  const events = queueQ.data?.events ?? [];
  const tools = (toolsQ.data?.tools ?? []).filter(
    (t) => t.enabled !== false && t.mode !== "off",
  ) as Array<{
    id: string;
    tool_name: string;
    display_name: string | null;
    description: string | null;
    category: string | null;
    mode: string;
  }>;

  if (overview.error) {
    return (
      <div
        style={{
          ...V4_CARD,
          padding: "var(--geist-gap)",
          // Token-traced alert border (was a raw rgba of the dark madder hex,
          // which cannot follow the light theme) - checklist 12.
          borderColor: "color-mix(in srgb, var(--madder) 40%, transparent)",
        }}
      >
        <div className="mono-label" style={{ color: "var(--madder-bright)" }}>
          Couldn't load controls
        </div>
        <p style={{ color: "var(--text-body)", marginTop: 8 }}>
          {(overview.error as Error)?.message}
        </p>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => overview.refetch()}
        >
          Retry · reloads controls
        </button>
      </div>
    );
  }

  if (overview.isLoading) {
    return (
      <div
        style={{
          color: "var(--text-subtle)",
          padding: "32px 0",
          textAlign: "center",
        }}
      >
        Loading controls…
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* Kill switch — span 2 */}
      <div
        style={{
          ...V4_CARD,
          gridColumn: "span 2",
          padding: "16px 18px",
          borderColor: killed ? "color-mix(in oklab, var(--madder) 45%, transparent)" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Kill switch</div>
            <div style={{ color: "var(--ink-subtle)", marginTop: 2 }}>
              {killed
                ? "All agents paused. Nothing runs until you resume."
                : "Agents are live. Flipping this pauses every agent mid-step, reversibly."}
            </div>
          </div>
          <PillSwitch
            on={killed}
            disabled={killDisabled}
            size="lg"
            onColor="var(--madder)"
            label="Kill switch"
            onToggle={() => pauseMut.mutate(!ks?.workspace_paused)}
          />
        </div>
        <input
          className="input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={killDisabled}
          placeholder={
            killed
              ? "Why resume? · optional, lands in the audit log"
              : "Why pause? · optional, lands in the audit log"
          }
          aria-label={killed ? "Reason for resuming" : "Reason for pausing"}
          style={{ marginTop: 10 }}
        />
        {ks?.reason ? (
          <div className="mono-label" style={{ marginTop: 8, color: "var(--text-subtle)" }}>
            reason on record · {ks.reason}
          </div>
        ) : null}
        {ks?.system_paused ? (
          <div style={{ color: "var(--madder-bright)", marginTop: 6 }}>
            System-wide pause is active. The workspace switch unlocks when the system resumes.
          </div>
        ) : null}
      </div>

      {/* Mission cap */}
      <div style={{ ...V4_CARD, padding: "18px 20px" }}>
        <MonoLabel icon={Gauge} style={{ marginBottom: 8 }}>
          Mission cap
        </MonoLabel>
        <div className="font-display tabular-nums" style={{ }}>
          {MISSION_CONCURRENCY_CAP}{" "}
          <span style={{ color: "var(--text-subtle)" }}>concurrent</span>
        </div>
        <div style={{ color: "var(--ink-subtle)", marginTop: 4 }}>
          New goals queue when the mesh is at capacity.
        </div>
      </div>

      {/* Stuck approvals */}
      <div style={{ ...V4_CARD, padding: "18px 20px" }}>
        <MonoLabel icon={Clock} style={{ marginBottom: 8 }}>
          Stuck approvals
        </MonoLabel>
        <div
          className="font-display tabular-nums"
          style={{ color: stuck ? "var(--ember)" : undefined }}
        >
          {stuck}
        </div>
        <button
          className="mono-label transition hover:brightness-125"
          style={{ color: "var(--text-subtle)", marginTop: 4 }}
          onClick={onOpenQueue}
        >
          open the queue →
        </button>
      </div>

      {/* Auto-pipelines, span 2 */}
      <div style={{ ...V4_CARD, gridColumn: "span 2", padding: "18px 20px" }}>
        <MonoLabel icon={Zap} style={{ marginBottom: 10 }}>
          Auto-pipelines
        </MonoLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* A failed read may never wear the empty state's clothes
              (checklist 7): name it and offer the one retry. */}
          {subsQ.isError ? (
            <div style={{ color: "var(--madder-bright)", padding: "8px 0" }}>
              Pipeline rules did not load.{" "}
              <button
                type="button"
                className="cursor-pointer hover:underline active:opacity-80"
                onClick={() => void subsQ.refetch()}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--text-primary)",
                }}
              >
                Retry
              </button>
            </div>
          ) : subs.length === 0 ? (
            <div style={{ color: "var(--text-subtle)", padding: "8px 0" }}>
              No pipeline rules yet.
            </div>
          ) : (
            subs.map((s, i) => {
              const filter = (s.filter as Record<string, unknown>) ?? {};
              const minScore = typeof filter.min_score === "number" ? filter.min_score : null;
              const desc =
                (s.approval_mode === "auto"
                  ? "Dispatches the agent immediately when the event fires"
                  : "Waits for your confirm before dispatching") +
                (minScore != null ? ` · min ICE ${minScore}` : "") +
                (s.is_default ? " · default" : "");
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--geist-space-3x)",
                    padding: "9px 0",
                    borderBottom: i < subs.length - 1 ? "1px solid var(--hairline)" : "none",
                    opacity: s.enabled ? 1 : 0.55,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{pipeName(s)}</div>
                    <div style={{ color: "var(--ink-subtle)" }}>{desc}</div>
                  </div>
                  <button
                    className="mono-label transition hover:brightness-125"
                    style={{
                      color: "var(--text-subtle)",
                      opacity: deleteSubMut.isPending ? 0.5 : 1,
                      cursor: deleteSubMut.isPending ? "not-allowed" : "pointer",
                    }}
                    disabled={deleteSubMut.isPending}
                    onClick={() => deleteSubMut.mutate(s.id)}
                  >
                    remove · stops firing
                  </button>
                  <PillSwitch
                    on={s.enabled}
                    onColor="var(--moss)"
                    label={`${pipeName(s)} pipeline`}
                    disabled={toggleSubMut.isPending}
                    onToggle={() =>
                      toggleSubMut.mutate({
                        id: s.id,
                        event_type: s.event_type as EventType,
                        target_agent_slug: s.target_agent_slug,
                        approval_mode: s.approval_mode as "auto" | "confirm",
                        enabled: !s.enabled,
                        filter,
                        name: pipeName(s),
                      })
                    }
                  />
                </div>
              );
            })
          )}
        </div>
        <div style={{ borderTop: "1px solid var(--hairline)", marginTop: 4, paddingTop: 10 }}>
          {addOpen ? (
            <form
              style={{ display: "flex", gap: "var(--geist-space-2x)", flexWrap: "wrap", alignItems: "center" }}
              onSubmit={(e) => {
                e.preventDefault();
                const filter: Record<string, unknown> = {};
                if (newEvent === "opportunity.scored" && newMinScore.trim()) {
                  const n = Number(newMinScore);
                  if (Number.isFinite(n)) filter.min_score = n;
                }
                addSubMut.mutate({
                  event_type: newEvent,
                  target_agent_slug: newAgent.trim(),
                  approval_mode: newMode,
                  enabled: true,
                  filter,
                });
              }}
            >
              <select
                className="input"
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value as EventType)}
                aria-label="Event"
                style={{ width: 210 }}
              >
                <option value="signal.created">New signal · signal.created</option>
                <option value="opportunity.scored">Opportunity scored · opportunity.scored</option>
                <option value="prd.approved">Spec approved · prd.approved</option>
                <option value="signal.clustered">Signals clustered · signal.clustered</option>
                <option value="outcome.recorded">Outcome recorded · outcome.recorded</option>
                <option value="decision.made">Decision made · decision.made</option>
              </select>
              <input
                className="input"
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
                placeholder="agent slug"
                aria-label="Agent slug"
                style={{ width: 120 }}
              />
              <select
                className="input"
                value={newMode}
                onChange={(e) => setNewMode(e.target.value as "auto" | "confirm")}
                aria-label="Approval mode"
                style={{ width: 96 }}
              >
                <option value="confirm">confirm</option>
                <option value="auto">auto</option>
              </select>
              {newEvent === "opportunity.scored" ? (
                <input
                  className="input"
                  value={newMinScore}
                  onChange={(e) => setNewMinScore(e.target.value)}
                  placeholder="min ICE"
                  aria-label="Minimum ICE score"
                  inputMode="decimal"
                  style={{ width: 76 }}
                />
              ) : null}
              <button
                className="btn btn-primary btn-sm"
                type="submit"
                disabled={addSubMut.isPending || !newAgent.trim()}
                style={{ }}
              >
                Add rule · fires on the next event
              </button>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setAddOpen(false)}
              >
                Dismiss
              </button>
            </form>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setAddOpen(true)}>
              Add rule · routes an event to an agent
            </button>
          )}
        </div>
      </div>

      {/* Tool oversight: the human end of the trust ramp, span 2. This is
          the ONLY place a person can tighten a tool's stored mode; the ramp
          (reflection.server.ts) can then propose loosening it back after
          TRUST_RAMP_CLEAN_N clean runs, surfaced in Record → Approvals. */}
      <div style={{ ...V4_CARD, gridColumn: "span 2", padding: "18px 20px" }}>
        <MonoLabel icon={ShieldCheck} style={{ marginBottom: 4 }}>
          Tool oversight
        </MonoLabel>
        <div style={{ color: "var(--ink-subtle)", marginBottom: 10 }}>
          Tighten a tool and the agent asks before every run. After five clean runs in a row,
          Supaprod proposes handing it back. You decide, in the approvals queue.
        </div>
        {toolsQ.isLoading ? (
          <div style={{ color: "var(--text-subtle)", padding: "8px 0" }}>
            Loading tools…
          </div>
        ) : toolsQ.error ? (
          <div style={{ color: "var(--madder-bright)", padding: "8px 0" }}>
            Tools did not load. {(toolsQ.error as Error).message}{" "}
            <button
              type="button"
              className="cursor-pointer hover:underline active:opacity-80"
              onClick={() => void toolsQ.refetch()}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--text-primary)",
              }}
            >
              Retry
            </button>
          </div>
        ) : tools.length === 0 ? (
          <div style={{ color: "var(--text-subtle)", padding: "8px 0" }}>
            No tools enabled yet.
          </div>
        ) : (
          <div
            style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column" }}
          >
            {tools.map((t, i) => {
              const pinned = HIGH_RISK_FORCE_REVIEW.has(t.tool_name);
              const mode: OversightMode =
                t.mode === "review" ? "review" : t.mode === "confirm" ? "confirm" : "auto";
              const cat = t.category ?? "general";
              const showCategory = i === 0 || cat !== (tools[i - 1].category ?? "general");
              return (
                <div key={t.id}>
                  {showCategory ? (
                    <div
                      className="mono-label"
                      style={{ padding: "10px 0 4px", color: "var(--text-subtle)" }}
                    >
                      {cat}
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--geist-space-3x)",
                      padding: "8px 0",
                      borderBottom: i < tools.length - 1 ? "1px solid var(--hairline)" : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }} title={t.description ?? undefined}>
                      <div style={{ fontWeight: 500 }}>
                        {t.display_name || t.tool_name}
                      </div>
                      <div
                        className="mono-label"
                        style={{ color: "var(--text-subtle)" }}
                      >
                        {t.tool_name}
                      </div>
                    </div>
                    {pinned ? (
                      <span
                        className="mono-label"
                        style={{ color: "var(--text-subtle)" }}
                        title="This gate never loosens. Safety floor."
                      >
                        review · pinned
                      </span>
                    ) : (
                      <ModeSegment
                        value={mode}
                        autoBlocked={HIGH_RISK_MIN_CONFIRM.has(t.tool_name)}
                        disabled={toolModeMut.isPending && toolModeMut.variables?.toolId === t.id}
                        onSelect={(m) =>
                          toolModeMut.mutate({
                            toolId: t.id,
                            mode: m,
                            name: t.display_name || t.tool_name,
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consent by consequence class (RPT-36), span 2. A read-only view over
          the SAME enabled tools above, grouped by blast radius with the trust-
          ladder (RPT-17) default posture per class. Setting consent once per
          class, not tool by tool: auto-run reads, draft stakeholder work to you,
          always gate repo writes. The per-tool control above is where a specific
          tool gets tightened; this states the policy the classes default to. */}
      <div style={{ ...V4_CARD, gridColumn: "span 2", padding: "18px 20px" }}>
        <MonoLabel icon={Layers} style={{ marginBottom: 4 }}>
          Consent by consequence
        </MonoLabel>
        <div style={{ color: "var(--ink-subtle)", marginBottom: 12 }}>
          {CONSENT_PHILOSOPHY}
        </div>
        {tools.length === 0 ? (
          <div style={{ color: "var(--text-subtle)", padding: "8px 0" }}>
            No tools enabled yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {groupToolsByConsequenceClass(tools, (t) => t.tool_name)
              .filter((g) => g.tools.length > 0)
              .map((g, i) => (
                <div
                  key={g.id}
                  style={{
                    padding: "12px 0",
                    borderTop: i > 0 ? "1px solid var(--hairline)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{g.label}</div>
                      <div style={{ color: "var(--ink-subtle)", marginTop: 2 }}>
                        {g.description}
                      </div>
                    </div>
                    <VerdictChip tone={POSTURE_TONE[g.defaultPosture.posture]}>
                      {g.defaultPosture.label}
                    </VerdictChip>
                  </div>
                  <div style={{ color: "var(--text-subtle)", marginTop: 6 }}>
                    {g.defaultPosture.rationale}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {g.tools.map((t) => (
                      <span
                        key={t.id}
                        title={t.tool_name}
                        className="mono-label"
                        style={{
                          color: "var(--text-subtle)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--hairline)",
                          borderRadius: 99,
                          padding: "2px 9px",
                        }}
                      >
                        {t.display_name || t.tool_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Recent runs — production usage-vs-caps table (the reference has no
          equivalent); kept and restyled quiet. Halted runs carry the reason. */}
      <div style={{ ...V4_CARD, gridColumn: "span 2", padding: 0, overflow: "hidden" }}>
        <div
          className="mono-label"
          style={{
            display: "grid",
            gridTemplateColumns: RUNS_GRID,
            gap: "var(--geist-space-3x)",
            padding: "10px 18px",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <span>Recent runs</span>
          <span>Status</span>
          <span>Tokens</span>
          <span>Spend</span>
          <span>When</span>
        </div>
        {runs.length === 0 ? (
          <div
            style={{
              color: "var(--text-subtle)",
              padding: "20px 18px",
              textAlign: "center",
            }}
          >
            No mission runs yet.
          </div>
        ) : (
          runs.map((r, i) => {
            const halted = r.status === "halted" || !!r.halted_reason;
            const tokCap = r.mission_token_cap;
            const spendCap = r.mission_spend_cap_usd ? Number(r.mission_spend_cap_usd) : null;
            const tokHot = tokCap ? (r.tokens_used ?? 0) / tokCap >= 0.8 : false;
            const spendHot = spendCap ? Number(r.spend_used_usd ?? 0) / spendCap >= 0.8 : false;
            const statusColor = halted
              ? "var(--madder-bright)"
              : r.status === "running"
                ? "var(--action-blue)"
                : r.status === "completed"
                  ? "var(--moss-bright)"
                  : r.status === "failed"
                    ? "var(--madder-bright)"
                    : "var(--text-subtle)";
            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: RUNS_GRID,
                  gap: "var(--geist-space-3x)",
                  padding: "12px 18px",
                  alignItems: "baseline",
                  borderBottom: i < runs.length - 1 ? "1px solid var(--hairline)" : "none",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: 500 }}>{r.agent_name}</span>
                  {halted && r.halted_reason ? (
                    <span
                      style={{ display: "block", color: "var(--madder-bright)" }}
                    >
                      {r.halted_reason}
                    </span>
                  ) : null}
                </span>
                <span className="mono-label" style={{ color: statusColor }}>
                  {halted ? "halted" : r.status}
                </span>
                <span
                  className="mono-label tabular-nums"
                  style={{ color: tokHot ? "var(--ember)" : undefined }}
                >
                  {r.tokens_used ?? 0}
                  {tokCap ? ` of ${tokCap}` : ""}
                </span>
                <span
                  className="mono-label tabular-nums"
                  style={{ color: spendHot ? "var(--ember)" : undefined }}
                >
                  {fmtUsd(r.spend_used_usd ?? 0)}
                  {spendCap ? ` of ${fmtUsd(spendCap)}` : ""}
                </span>
                <span className="mono-label tabular-nums">{relTime(r.created_at)}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Reactor activity — production confirm-mode dispatch queue (no
          reference equivalent); kept and restyled quiet. */}
      <div style={{ ...V4_CARD, gridColumn: "span 2", padding: "18px 20px" }}>
        <MonoLabel icon={Zap} style={{ marginBottom: 10 }}>
          Reactor activity · confirm-mode rows wait on you
        </MonoLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Same honesty rule: a failed queue read is an error, never the
              calm "No reactor events yet" (checklist 7). */}
          {queueQ.isError ? (
            <div style={{ color: "var(--madder-bright)", padding: "8px 0" }}>
              Reactor activity did not load.{" "}
              <button
                type="button"
                className="cursor-pointer hover:underline active:opacity-80"
                onClick={() => void queueQ.refetch()}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--text-primary)",
                }}
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div style={{ color: "var(--text-subtle)", padding: "8px 0" }}>
              No reactor events yet.
            </div>
          ) : (
            events.map((e, i) => {
              const title =
                ((e.payload as Record<string, unknown>)?.title as string) ??
                e.source_id.slice(0, 8);
              const statusColor =
                e.status === "dispatched"
                  ? "var(--moss-bright)"
                  : e.status === "failed"
                    ? "var(--madder-bright)"
                    : e.status === "skipped"
                      ? "var(--text-subtle)"
                      : "var(--ember-text)";
              const isPending = e.status === "pending" && e.approval_mode === "confirm";
              return (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--geist-space-3x)",
                    padding: "9px 0",
                    borderBottom: i < events.length - 1 ? "1px solid var(--hairline)" : "none",
                  }}
                >
                  {/* RPT-09 (needs-human leads in ember): a confirm-mode row that waits
                      on you leads with the ember gate dot, not the reject button. */}
                  {isPending ? <StepDot status="gate" /> : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {e.event_type} → {e.target_agent_slug}
                    </div>
                    <div
                      style={{
                        color: "var(--ink-subtle)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </div>
                    {e.error ? (
                      <div style={{ color: "var(--madder-bright)" }}>{e.error}</div>
                    ) : null}
                  </div>
                  <span className="mono-label tabular-nums">{relTime(e.created_at)}</span>
                  {isPending ? (
                    <span style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-approve btn-sm"
                        disabled={
                          decideEvtMut.isPending && decideEvtMut.variables?.eventId === e.id
                        }
                        onClick={() => decideEvtMut.mutate({ eventId: e.id, decision: "approve" })}
                      >
                        Dispatch · runs the agent
                      </button>
                      <button
                        className="btn btn-reject btn-sm"
                        disabled={
                          decideEvtMut.isPending && decideEvtMut.variables?.eventId === e.id
                        }
                        onClick={() => decideEvtMut.mutate({ eventId: e.id, decision: "reject" })}
                      >
                        Skip · nothing runs
                      </button>
                    </span>
                  ) : (
                    <span className="mono-label" style={{ color: statusColor }}>
                      {e.status}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
