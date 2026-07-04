import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { PanelPending, type RoomBodyProps } from "../RoomDetail";

// LOOM W2 fold: /govern's controls (pause/kill switch), team (roster + trust
// arcs - "what is it allowed to do?" is exactly the trust question), house
// rules, guardrails (RULES, the one home for rule management) and incidents
// all live in this room now. ControlsPanel and AgentRosterPanel carry the v4
// reskin (two of the four most-used views); the rest ride the OBS-01 bridge
// with a lighter pass, noted for W4.
const GuardrailsPanel = React.lazy(() =>
  import("@/components/governance/GuardrailsPanel").then((m) => ({ default: m.GuardrailsPanel })),
);
const ControlsPanel = React.lazy(() =>
  import("@/components/governance/ControlsPanel").then((m) => ({ default: m.ControlsPanel })),
);
const AgentRosterPanel = React.lazy(() =>
  import("@/components/governance/AgentRosterPanel").then((m) => ({
    default: m.AgentRosterPanel,
  })),
);
const HouseRulesPanel = React.lazy(() =>
  import("@/components/governance/HouseRulesPanel").then((m) => ({ default: m.HouseRulesPanel })),
);
const IncidentsPanel = React.lazy(() =>
  import("@/components/governance/IncidentsPanel").then((m) => ({ default: m.IncidentsPanel })),
);

export function SafetyRoom({ view }: RoomBodyProps) {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  if (view === "controls") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <ControlsPanel
          onOpenQueue={() =>
            navigate({ to: "/engine-room", search: { room: "record", view: "approvals" } })
          }
        />
      </React.Suspense>
    );
  }
  if (view === "team") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <AgentRosterPanel workspaceId={activeWorkspace?.id ?? null} />
      </React.Suspense>
    );
  }
  if (view === "house-rules") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <HouseRulesPanel />
      </React.Suspense>
    );
  }
  if (view === "incidents") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <IncidentsPanel />
      </React.Suspense>
    );
  }
  return (
    <React.Suspense fallback={<PanelPending />}>
      <GuardrailsPanel />
    </React.Suspense>
  );
}
