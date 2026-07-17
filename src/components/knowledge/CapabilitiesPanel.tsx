import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getCapabilities,
  updateAgentInstructions,
  type AgentCapability,
} from "@/lib/capabilities.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";

export function CapabilitiesPanel() {
  const { activeWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const capsFn = useServerFn(getCapabilities);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["capabilities", activeWorkspace?.id],
    queryFn: () => capsFn({ data: { workspaceId: activeWorkspace?.id ?? null } }),
    enabled: !!activeWorkspace && !isLoadingWorkspace,
  });

  const capabilities = data?.capabilities ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isPending) {
    return (
      <div style={{ padding: "20px", gap: "12px", display: "flex", flexDirection: "column" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "100px",
              borderRadius: "8px",
              background: "color-mix(in srgb, var(--text-primary) 8%, transparent)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          padding: "16px 18px",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          background: "var(--card)",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
          Capabilities · failed to load
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <button
          onClick={() => void refetch()}
          style={{
            fontSize: "12px",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid var(--hairline)",
            background: "var(--canvas)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (capabilities.length === 0) {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "14px",
        }}
      >
        No capabilities configured yet.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", gap: "12px", display: "flex", flexDirection: "column" }}>
      {capabilities.map((cap) => (
        <CapabilityCard
          key={cap.slug}
          capability={cap}
          workspaceId={activeWorkspace?.id ?? null}
          isExpanded={expandedId === cap.slug}
          onToggle={() => setExpandedId(expandedId === cap.slug ? null : cap.slug)}
        />
      ))}
    </div>
  );
}

const CHANGE_TYPE_LABEL: Record<string, string> = {
  instructions: "Instructions edited",
  skill_enabled: "Skill enabled",
  skill_disabled: "Skill disabled",
  self_tuned: "Self-tuned by Supaprod",
};

function CapabilityCard({
  capability,
  workspaceId,
  isExpanded,
  onToggle,
}: {
  capability: AgentCapability;
  workspaceId: string | null;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateAgentInstructions);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(capability.baseInstructions);

  const saveMutation = useMutation({
    mutationFn: (instructions: string) =>
      updateFn({
        data: {
          agentSlug: capability.slug,
          workspaceId: workspaceId ?? undefined,
          instructions,
        },
      }),
    onSuccess: () => {
      toast.success(`${capability.name}'s instructions updated.`);
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["capabilities", workspaceId] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not save instructions.");
    },
  });

  return (
    <div
      style={{
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        background: "var(--card)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "16px 18px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "inherit",
          fontSize: "inherit",
          textAlign: "left",
          transition: "background-color var(--dur-control) var(--ease)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor =
            "color-mix(in srgb, var(--canvas) 50%, transparent)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <span style={{ color: isExpanded ? "var(--text-primary)" : "var(--text-muted)" }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            {capability.name}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{capability.blurb}</div>
        </div>
      </button>

      {/* Details */}
      {isExpanded && (
        <div
          style={{
            padding: "0 18px 16px",
            borderTop: "1px solid var(--hairline)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Instructions */}
          <CapabilitySection
            title="Instructions"
            action={
              !isEditing ? (
                <button
                  onClick={() => {
                    setDraft(capability.baseInstructions);
                    setIsEditing(true);
                  }}
                  style={sectionActionButtonStyle}
                >
                  Edit
                </button>
              ) : null
            }
          >
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--hairline)",
                    background: "var(--canvas)",
                    color: "var(--text-primary)",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => saveMutation.mutate(draft)}
                    disabled={saveMutation.isPending || draft.trim().length === 0}
                    style={{
                      ...sectionActionButtonStyle,
                      background: "var(--glacier)",
                      color: "var(--text-on-accent, #fff)",
                      opacity: saveMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {saveMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={saveMutation.isPending}
                    style={sectionActionButtonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {capability.instructionsPreview || "No instructions set."}
              </div>
            )}
            {!isEditing && (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-faint)",
                  marginTop: "6px",
                  fontStyle: "italic",
                }}
              >
                What this agent is told every run: its own instructions plus the voice anchor, the
                Strategic Brief, and house rules scoped to it.
              </div>
            )}
          </CapabilitySection>

          {/* Skills */}
          {capability.skills.length > 0 && (
            <CapabilitySection title={`Skills (${capability.skills.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {capability.skills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      fontSize: "12px",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--hairline)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{skill.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {skill.wins}/{skill.runs} ({Math.round(skill.winRate * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CapabilitySection>
          )}

          {/* Autonomy */}
          <CapabilitySection title="Autonomy">
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              <div>Tier: {capability.autonomy.tier}</div>
              <div>Status: {capability.autonomy.status}</div>
              <div>
                Arc:{" "}
                {capability.autonomy.arc ??
                  (capability.autonomy.tier === "cast" ? "trusted (default)" : "n/a")}
                {capability.autonomy.score != null && (
                  <span style={{ color: "var(--text-muted)" }}>
                    {" "}
                    (score {Math.round(capability.autonomy.score)})
                  </span>
                )}
                {capability.autonomy.suggestedArc &&
                  capability.autonomy.suggestedArc !== capability.autonomy.arc && (
                    <span style={{ color: "var(--text-muted)" }}>
                      {" "}
                      · suggested: {capability.autonomy.suggestedArc}
                    </span>
                  )}
              </div>

              {capability.autonomy.toolModes.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                    Tool modes (graduated from default)
                  </div>
                  {capability.autonomy.toolModes.map((tm) => (
                    <div
                      key={tm.toolName}
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>{tm.toolName}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {tm.mode} · {tm.source}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {capability.autonomy.graduationHistory.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                    Graduation history
                  </div>
                  {capability.autonomy.graduationHistory.map((g) => (
                    <div
                      key={g.id}
                      style={{ padding: "4px 0", borderBottom: "1px solid var(--hairline)" }}
                    >
                      <div>
                        {g.toolName}: {g.fromMode} → {g.toMode} ({g.status})
                      </div>
                      {g.decidedAt && (
                        <div style={{ color: "var(--text-muted)" }}>{g.decidedAt}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CapabilitySection>

          {/* History */}
          {capability.history.length > 0 && (
            <CapabilitySection title={`History (${capability.history.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {capability.history.map((change) => (
                  <div
                    key={change.id}
                    style={{
                      fontSize: "12px",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--hairline)",
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {CHANGE_TYPE_LABEL[change.type] ?? change.type}
                    </div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                      {change.description}
                    </div>
                    <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                      {change.changedBy ? `by ${change.changedBy}` : "by Supaprod"} ·{" "}
                      {change.changedAt}
                    </div>
                  </div>
                ))}
              </div>
            </CapabilitySection>
          )}
        </div>
      )}
    </div>
  );
}

const sectionActionButtonStyle: React.CSSProperties = {
  fontSize: "12px",
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1px solid var(--hairline)",
  background: "var(--canvas)",
  color: "var(--text-primary)",
  cursor: "pointer",
};

function CapabilitySection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
