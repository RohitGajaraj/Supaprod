/**
 * PC-30: The agent capability layer panel for Brain.
 *
 * Shows each cast member's capabilities: instructions, skills with win-rates,
 * autonomy tier, and change history.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import {
  getCapabilities,
  type AgentCapability,
  type SkillInfo,
} from "@/lib/capabilities.functions";
import { AgentMark } from "@/components/agents/AgentMark";
import { useWorkspace } from "@/hooks/use-workspace";

function CapabilitiesList({ capabilities }: { capabilities: AgentCapability[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20,
      }}
    >
      {capabilities.map((cap) => (
        <CapabilityCard key={cap.slug} capability={cap} />
      ))}
    </div>
  );
}

function CapabilityCard({ capability: cap }: { capability: AgentCapability }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <AgentMark slug={cap.slug} size={28} />
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }}>{cap.name}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{cap.blurb}</p>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: 16 }}>
        <h4
          style={{
            margin: "0 0 8px 0",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-muted)",
          }}
        >
          Instructions
        </h4>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic" }}>
          {cap.instructions}
        </p>
      </div>

      {/* Skills */}
      {cap.skills.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
            }}
          >
            Skills
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cap.skills.map((skill) => (
              <SkillRow key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>
            No skills recorded yet.
          </p>
        </div>
      )}

      {/* Autonomy */}
      <div style={{ marginBottom: 16 }}>
        <h4
          style={{
            margin: "0 0 8px 0",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-muted)",
          }}
        >
          Autonomy
        </h4>
        <div style={{ fontSize: 13 }}>
          <p style={{ margin: "0 0 4px 0" }}>
            <span style={{ fontWeight: 600 }}>Station:</span> {cap.autonomy.station}
          </p>
          <p style={{ margin: "0 0 4px 0" }}>
            <span style={{ fontWeight: 600 }}>Status:</span> {cap.autonomy.status}
          </p>
        </div>
      </div>

      {/* History */}
      {cap.history.length > 0 ? (
        <div>
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
            }}
          >
            History
          </h4>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {cap.history.map((h) => (
              <div key={h.id} style={{ marginBottom: 4 }}>
                {h.description}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)" }}>
          No capability changes yet.
        </p>
      )}
    </div>
  );
}

function SkillRow({ skill }: { skill: SkillInfo }) {
  const percentage = Math.round(skill.winRate * 100);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
      }}
    >
      <span>{skill.name}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 60,
            height: 6,
            backgroundColor: "var(--border)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: percentage > 70 ? "var(--accent-green)" : "var(--accent-orange)",
              transition: "width 0.2s",
            }}
          />
        </div>
        <span style={{ fontWeight: 600, minWidth: "32px", textAlign: "right" }}>
          {percentage}% ({skill.wins}/{skill.runs})
        </span>
      </div>
    </div>
  );
}

export function CapabilitiesPanel() {
  const { activeWorkspaceId: workspaceId } = useWorkspace();
  const getCapabilitiesFn = useServerFn(getCapabilities);
  const { data, isLoading, error } = useQuery({
    queryKey: ["capabilities", workspaceId],
    queryFn: async () => getCapabilitiesFn({ data: { workspaceId } }),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <div style={{ padding: 16 }}>Loading capabilities…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: "var(--text-error)" }}>
        Error loading capabilities: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  if (!data?.capabilities?.length) {
    return <div style={{ padding: 16 }}>No capabilities available.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={{ marginBottom: 24, color: "var(--text-secondary)", fontSize: 14 }}>
        What each specialist knows how to do: instructions they receive every run, skills with
        validated-outcome rates, and autonomy tier.
      </p>
      <Suspense fallback={<div>Loading…</div>}>
        <CapabilitiesList capabilities={data.capabilities} />
      </Suspense>
    </div>
  );
}
