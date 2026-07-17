import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getCapabilities, type AgentCapability } from "@/lib/capabilities.functions";
import { useWorkspace } from "@/hooks/use-workspace";

export function CapabilitiesPanel() {
  const { activeWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const capsFn = useServerFn(getCapabilities);

  const { data, isPending } = useQuery({
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
          isExpanded={expandedId === cap.slug}
          onToggle={() => setExpandedId(expandedId === cap.slug ? null : cap.slug)}
        />
      ))}
    </div>
  );
}

function CapabilityCard({
  capability,
  isExpanded,
  onToggle,
}: {
  capability: AgentCapability;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
          <CapabilitySection title="Instructions">
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {capability.instructions}
            </div>
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
              <div style={{ color: "var(--text-muted)", marginTop: "8px", fontStyle: "italic" }}>
                Arc, tool modes, and graduation history coming soon.
              </div>
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
                    <div style={{ fontWeight: 500 }}>{change.description}</div>
                    <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                      {change.changedBy ? `by ${change.changedBy}` : "by system"} ·{" "}
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

function CapabilitySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
