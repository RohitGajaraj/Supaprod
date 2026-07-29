/**
 * Controls. The boundaries this workspace runs inside, and the switches that
 * move them.
 *
 * Ported off the retired system. What changed, and why:
 *
 * KILL  the eight bordered cards. This panel sits inside a region that is
 *       already a container, so eight more cards was a card inside a card
 *       eight times over. Every region is now a Block: a rule, a title, and
 *       the content flat underneath it.
 * KILL  the per-card mono label plus icon masthead. A Block already titles its
 *       region, so the icon tile and the mono heading were a second heading
 *       grammar drawn on top of the first.
 * KILL  the two hand-rolled controls, the pill toggle and the three-stop mode
 *       segment. A boundary is a sentence with a switch at the end of it,
 *       which is exactly Line plus Switch; the oversight segment became a
 *       Select, so the safety floors ride native disabled options instead of
 *       a bespoke greyed stop.
 * KILL  the consent section's chip wall. It listed the same tools rendered in
 *       full one region above it. The count says the same thing honestly.
 * KILL  the consent posture chips. One of the four wore a hue from the banned
 *       family; a posture is a policy, not an outcome, so it is words now.
 *
 * INVERTED, deliberately: the kill switch now reads "Agents may run" and is ON
 * when they can. Green carries status, and a live boundary is a live status;
 * a green track meaning "everything is stopped" said the opposite of the truth.
 * The mutation call is unchanged, only which end of it is drawn as on.
 *
 * Mechanism words stay. This is the one room where the reader is an engineer,
 * so `signal.created`, `confirm` and `halted` are the clearest true words for
 * the audience in front of them.
 *
 * Every server function, query key, mutation and the exported signature are
 * untouched: setWorkspacePause with its audit reason and system-pause lock,
 * the reactor subscription CRUD, the tool-mode write, the usage table and the
 * confirm-mode dispatch queue all behave exactly as before.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
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
import { relTime, fmtUsd } from "@/components/product/format";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { CONSENT_PHILOSOPHY, groupToolsByConsequenceClass } from "@/lib/consent-classes";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Line,
  Num,
  Row,
  Select,
  Switch,
} from "@/components/shell/primitives";

type EventType =
  | "signal.created"
  | "opportunity.scored"
  | "prd.approved"
  | "signal.clustered"
  | "outcome.recorded"
  | "decision.made";

type OversightMode = "auto" | "confirm" | "review";

/** The three stops, in plain words. The order is loosest to tightest, which is
 *  the order the trust ramp travels. */
const OVERSIGHT_STOPS: Array<{ mode: OversightMode; label: string }> = [
  { mode: "auto", label: "Auto" },
  { mode: "confirm", label: "Ask first" },
  { mode: "review", label: "Review" },
];

/** A group label inside a Block. Smaller than the Block title, so it reads as a
 *  fold within one region rather than as a second region. */
const GROUP_LABEL = {
  fontSize: "var(--sp-text-label)",
  fontWeight: "var(--sp-weight-medium)" as const,
  color: "var(--sp-mute)",
  marginTop: "var(--sp-space-4)",
  marginBottom: "var(--sp-space-1)",
};

/** A quiet fact that hangs off a control rather than sitting on its own line. */
const NOTE = {
  fontSize: "var(--sp-text-label)",
  color: "var(--sp-mute)",
  marginTop: "var(--sp-space-2)",
  maxWidth: "56ch",
};

/** The right-hand word in a Line: a status, a posture, a mode. */
const CONTROL_WORD = {
  fontSize: "var(--sp-text-label)",
  color: "var(--sp-mute)",
};

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
      // Pause copy is the reference contract; resume copy corrected: halted
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
      <Failed onRetry={() => void overview.refetch()}>
        Controls did not load. {(overview.error as Error)?.message}
      </Failed>
    );
  }

  // A surface holds its shape while it reads. Nothing is drawn rather than a
  // frame that will be replaced a beat later.
  if (overview.isLoading) return null;

  /** What the pause switch currently lets through, or why it is locked. */
  const pauseSub = ks?.system_paused
    ? "A system-wide pause is on. This unlocks when that lifts."
    : killed
      ? "Every agent is holding. Nothing was lost, and nothing runs until you turn this back on."
      : "Turning this off holds every agent mid-step, reversibly.";

  return (
    <>
      <Block title="Boundaries">
        <Line label="Agents may run" sub={pauseSub}>
          <Switch
            checked={!killed}
            disabled={killDisabled}
            label="Agents may run"
            onChange={() => pauseMut.mutate(!ks?.workspace_paused)}
          />
        </Line>
        <Field label={killed ? "Why you are resuming" : "Why you are pausing"}>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={killDisabled}
            placeholder="Optional. It lands in the audit log."
          />
        </Field>
        {ks?.reason ? <div style={NOTE}>On record: {ks.reason}</div> : null}

        <Line label="Missions at once" sub="New goals queue when the mesh is at capacity.">
          <Num>{MISSION_CONCURRENCY_CAP}</Num>
        </Line>
        <Line
          label="Approvals past their deadline"
          sub={
            stuck > 0
              ? "Nobody settled these in time. They are still waiting on you."
              : "Nothing has aged out."
          }
        >
          {/* Ember marks the one thing waiting on you, and only when something is. */}
          <span style={{ color: stuck > 0 ? "var(--sp-gate)" : undefined }}>
            <Num>{stuck}</Num>
          </span>
          {onOpenQueue ? (
            <Button variant="ghost" onClick={onOpenQueue}>
              Open the queue
            </Button>
          ) : null}
        </Line>
      </Block>

      <Block
        title="Auto-pipelines"
        sub="What routes an event to an agent without asking you first."
        more={addOpen ? undefined : "Add a rule"}
        onMore={() => setAddOpen(true)}
      >
        {subsQ.isError ? (
          <Failed onRetry={() => void subsQ.refetch()}>Pipeline rules did not load.</Failed>
        ) : subs.length === 0 ? (
          <Empty>No pipeline rules yet. Add one and the next matching event routes itself.</Empty>
        ) : (
          subs.map((s) => {
            const filter = (s.filter as Record<string, unknown>) ?? {};
            const minScore = typeof filter.min_score === "number" ? filter.min_score : null;
            const desc =
              (s.approval_mode === "auto"
                ? "Dispatches the agent the moment the event fires"
                : "Waits for your confirm before dispatching") +
              (minScore != null ? ` · min ICE ${minScore}` : "") +
              (s.is_default ? " · default" : "");
            return (
              <Line
                key={s.id}
                label={
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--sp-space-2)",
                    }}
                  >
                    <AgentMark slug={s.target_agent_slug} state={s.enabled ? "idle" : "quiet"} />
                    <span>
                      <Num>{s.event_type}</Num> → {agentDisplayName(s.target_agent_slug)}
                    </span>
                  </span>
                }
                sub={desc}
              >
                <Button
                  variant="ghost"
                  title="It stops firing."
                  disabled={deleteSubMut.isPending}
                  onClick={() => deleteSubMut.mutate(s.id)}
                >
                  Remove
                </Button>
                <Switch
                  checked={s.enabled}
                  label={`${pipeName(s)} pipeline`}
                  disabled={toggleSubMut.isPending}
                  onChange={() =>
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
              </Line>
            );
          })
        )}

        {addOpen ? (
          <form
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "var(--sp-space-3)",
              }}
            >
              <Field label="Event">
                <Select value={newEvent} onChange={(e) => setNewEvent(e.target.value as EventType)}>
                  <option value="signal.created">New signal · signal.created</option>
                  <option value="opportunity.scored">
                    Opportunity scored · opportunity.scored
                  </option>
                  <option value="prd.approved">Spec approved · prd.approved</option>
                  <option value="signal.clustered">Signals clustered · signal.clustered</option>
                  <option value="outcome.recorded">Outcome recorded · outcome.recorded</option>
                  <option value="decision.made">Decision made · decision.made</option>
                </Select>
              </Field>
              <Field label="Agent">
                <Input
                  value={newAgent}
                  onChange={(e) => setNewAgent(e.target.value)}
                  placeholder="agent slug"
                />
              </Field>
              <Field label="Before it runs">
                <Select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as "auto" | "confirm")}
                >
                  <option value="confirm">Ask first</option>
                  <option value="auto">Auto</option>
                </Select>
              </Field>
              {newEvent === "opportunity.scored" ? (
                <Field label="Min ICE">
                  <Input
                    value={newMinScore}
                    onChange={(e) => setNewMinScore(e.target.value)}
                    placeholder="8"
                    inputMode="decimal"
                  />
                </Field>
              ) : null}
            </div>
            <Actions>
              <Button
                variant="primary"
                type="submit"
                disabled={addSubMut.isPending || !newAgent.trim()}
              >
                Add rule
              </Button>
              <Button variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </Actions>
          </form>
        ) : null}
      </Block>

      {/* The human end of the trust ramp. This is the ONLY place a person can
          tighten a tool's stored mode; the ramp (reflection.server.ts) can then
          propose loosening it back after TRUST_RAMP_CLEAN_N clean runs, which
          arrives in the approvals queue. */}
      <Block
        title="Tool oversight"
        sub="Tighten a tool and the agent asks before every run. After five clean runs in a row, Supaprod proposes handing it back, and you decide in the approvals queue."
      >
        {toolsQ.isLoading ? null : toolsQ.error ? (
          <Failed onRetry={() => void toolsQ.refetch()}>
            Tools did not load. {(toolsQ.error as Error).message}
          </Failed>
        ) : tools.length === 0 ? (
          <Empty>No tools enabled yet. Turn one on and its oversight lands here.</Empty>
        ) : (
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {tools.map((t, i) => {
              const pinned = HIGH_RISK_FORCE_REVIEW.has(t.tool_name);
              const autoBlocked = HIGH_RISK_MIN_CONFIRM.has(t.tool_name);
              const mode: OversightMode =
                t.mode === "review" ? "review" : t.mode === "confirm" ? "confirm" : "auto";
              const cat = t.category ?? "general";
              const showCategory = i === 0 || cat !== (tools[i - 1].category ?? "general");
              return (
                <Fragment key={t.id}>
                  {showCategory ? <div style={GROUP_LABEL}>{cat}</div> : null}
                  <Line
                    label={t.display_name || t.tool_name}
                    // A different fact, not the label again: the identifier the
                    // loop actually calls, and what it does.
                    sub={
                      <>
                        <Num>{t.tool_name}</Num>
                        {t.description ? ` · ${t.description}` : ""}
                      </>
                    }
                  >
                    {pinned ? (
                      <span style={CONTROL_WORD} title="This gate never loosens. Safety floor.">
                        Review, pinned
                      </span>
                    ) : (
                      <Select
                        value={mode}
                        style={{ width: 140 }}
                        aria-label={`Oversight for ${t.display_name || t.tool_name}`}
                        title={
                          autoBlocked ? "This tool never runs unattended. Safety floor." : undefined
                        }
                        disabled={toolModeMut.isPending && toolModeMut.variables?.toolId === t.id}
                        onChange={(e) =>
                          toolModeMut.mutate({
                            toolId: t.id,
                            mode: e.target.value as OversightMode,
                            name: t.display_name || t.tool_name,
                          })
                        }
                      >
                        {OVERSIGHT_STOPS.map((s) => (
                          <option
                            key={s.mode}
                            value={s.mode}
                            // The floor is honest rather than decorative: a tool
                            // that may never run unattended cannot be set to it.
                            disabled={s.mode === "auto" && autoBlocked}
                          >
                            {s.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Line>
                </Fragment>
              );
            })}
          </div>
        )}
      </Block>

      {/* A read-only view over the SAME enabled tools above, grouped by blast
          radius with the trust-ladder default posture per class. Consent set
          once per class, not tool by tool. The per-tool control above is where
          a specific tool gets tightened; this states what the classes default
          to. */}
      <Block title="Consent by consequence" sub={CONSENT_PHILOSOPHY}>
        {tools.length === 0 ? (
          <Empty>No tools enabled yet, so no class has anything in it.</Empty>
        ) : (
          groupToolsByConsequenceClass(tools, (t) => t.tool_name)
            .filter((g) => g.tools.length > 0)
            .map((g) => (
              <Line key={g.id} label={g.label} sub={g.description}>
                <Num>{g.tools.length}</Num>
                <span style={CONTROL_WORD}>{g.defaultPosture.label}</span>
              </Line>
            ))
        )}
      </Block>

      <Block title="Recent runs" sub="What each run spent against the caps it was given.">
        {runs.length === 0 ? (
          <Empty>No mission runs yet. The first one starts when you give the crew a goal.</Empty>
        ) : (
          runs.map((r) => {
            const halted = r.status === "halted" || !!r.halted_reason;
            const tokCap = r.mission_token_cap;
            const spendCap = r.mission_spend_cap_usd ? Number(r.mission_spend_cap_usd) : null;
            const tokHot = tokCap ? (r.tokens_used ?? 0) / tokCap >= 0.8 : false;
            const spendHot = spendCap ? Number(r.spend_used_usd ?? 0) / spendCap >= 0.8 : false;
            const statusWord = halted ? "halted" : r.status;
            const statusClass =
              halted || r.status === "failed"
                ? "sp-fail"
                : r.status === "completed"
                  ? "sp-pass"
                  : undefined;
            return (
              <Row
                key={r.id}
                tight
                // Every run says who made it. The catalog name when the slug is
                // known, the stored name when it is not.
                marks={
                  <AgentMark
                    slug={r.agent_slug}
                    name={r.agent_name}
                    state={
                      halted || r.status === "failed"
                        ? "failed"
                        : r.status === "running"
                          ? "running"
                          : "quiet"
                    }
                  />
                }
                lead={agentDisplayName(r.agent_slug, r.agent_name)}
                // The second line is the outcome and what it cost, never the
                // name again. A halted run says why instead of what it spent.
                sub={
                  <>
                    <span className={statusClass}>{statusWord}</span>
                    {halted && r.halted_reason ? (
                      <> · {r.halted_reason}</>
                    ) : (
                      <>
                        {" · "}
                        <span className={tokHot ? "sp-warn" : undefined}>
                          <Num>{r.tokens_used ?? 0}</Num>
                          {tokCap ? (
                            <>
                              {" of "}
                              <Num>{tokCap}</Num>
                            </>
                          ) : null}
                          {" tokens"}
                        </span>
                        {" · "}
                        <span className={spendHot ? "sp-warn" : undefined}>
                          <Num>{fmtUsd(r.spend_used_usd ?? 0)}</Num>
                          {spendCap ? (
                            <>
                              {" of "}
                              <Num>{fmtUsd(spendCap)}</Num>
                            </>
                          ) : null}
                        </span>
                      </>
                    )}
                  </>
                }
                time={relTime(r.created_at)}
              />
            );
          })
        )}
      </Block>

      <Block title="Reactor activity" sub="Confirm-mode rows are the ones waiting on you.">
        {queueQ.isError ? (
          <Failed onRetry={() => void queueQ.refetch()}>Reactor activity did not load.</Failed>
        ) : events.length === 0 ? (
          <Empty>No reactor events yet. One appears the moment a rule above matches.</Empty>
        ) : (
          events.map((e) => {
            const title =
              ((e.payload as Record<string, unknown>)?.title as string) ?? e.source_id.slice(0, 8);
            const isPending = e.status === "pending" && e.approval_mode === "confirm";
            const statusClass =
              e.status === "dispatched" ? "sp-pass" : e.status === "failed" ? "sp-fail" : undefined;
            const deciding = decideEvtMut.isPending && decideEvtMut.variables?.eventId === e.id;
            return (
              <Line
                key={e.id}
                label={
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--sp-space-2)",
                    }}
                  >
                    {/* A row that waits on you leads in ember. Nothing else here does. */}
                    <AgentMark
                      slug={e.target_agent_slug}
                      state={
                        isPending
                          ? "gate"
                          : e.status === "failed"
                            ? "failed"
                            : e.status === "dispatched"
                              ? "idle"
                              : "quiet"
                      }
                    />
                    <span>
                      <Num>{e.event_type}</Num> → {agentDisplayName(e.target_agent_slug)}
                    </span>
                  </span>
                }
                sub={
                  <>
                    {e.error ? <span className="sp-fail">{e.error}</span> : title}
                    {" · "}
                    <Num>{relTime(e.created_at)}</Num>
                  </>
                }
              >
                {isPending ? (
                  <>
                    <Button
                      disabled={deciding}
                      onClick={() => decideEvtMut.mutate({ eventId: e.id, decision: "approve" })}
                    >
                      Dispatch
                    </Button>
                    <Button
                      variant="ghost"
                      title="Nothing runs."
                      disabled={deciding}
                      onClick={() => decideEvtMut.mutate({ eventId: e.id, decision: "reject" })}
                    >
                      Skip
                    </Button>
                  </>
                ) : (
                  <span style={CONTROL_WORD} className={statusClass}>
                    {e.status}
                  </span>
                )}
              </Line>
            );
          })
        )}
      </Block>
    </>
  );
}
