import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { PanelReading } from "../EngineChrome";
import { BoundaryStatement } from "@/components/governance/BoundaryStatement";
import { type RoomBodyProps } from "../RoomDetail";

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
const RoutinesPanel = React.lazy(() =>
  import("./RoutinesPanel").then((m) => ({ default: m.RoutinesPanel })),
);
const BoundaryControls = React.lazy(() =>
  import("@/components/governance/BoundaryControls").then((m) => ({
    default: m.BoundaryControls,
  })),
);

/**
 * EVERY VIEW SAYS WHICH OF SIX THINGS IT IS FETCHING.
 *
 * All six used to pass `PanelPending`, which was `aria-hidden="true"` around a
 * single 220x3 shimmer with no text. Measured on this machine, that was the
 * whole work region for the entire load: room chrome and context column drawn,
 * and one hairline where the panel goes. Loading, Empty and Failed are meant to
 * be three distinguishable states, and a screen-reader user was told nothing
 * whatsoever. `PanelReading` is a live region and says a sentence, and as of
 * the Meridian port it is what `PanelPending` renders too, so the shimmer is
 * gone everywhere rather than only where a caller remembered to override it.
 */
export function SafetyRoom({ view }: RoomBodyProps) {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  if (view === "controls") {
    return (
      <React.Suspense fallback={<PanelReading>Reading the emergency controls.</PanelReading>}>
        <ControlsPanel
          /**
           * THE UNSETTLED QUEUE, NOT THE SETTLED RECORD. The row that sends
           * someone here says "Nobody settled these in time. They are still
           * waiting on you", and this used to open `record/approvals`, whose
           * own first sentence is "Approvals are answered on Today. This is the
           * reviewable record of the queue." A row about work still waiting
           * pointed at the log of work already done. `verify` is the tab whose
           * descriptor is "Approvals waiting on you".
           */
          onOpenQueue={() =>
            navigate({ to: "/engine-room", search: { room: "record", view: "verify" } })
          }
          /* The boundary is the front tab's whole subject now, so the controls
             tab does not state it a second time. */
          boundaryElsewhere
        />
      </React.Suspense>
    );
  }
  if (view === "team") {
    return (
      <React.Suspense fallback={<PanelReading>Reading the crew.</PanelReading>}>
        <AgentRosterPanel workspaceId={activeWorkspace?.id ?? null} />
      </React.Suspense>
    );
  }
  if (view === "house-rules") {
    return (
      <React.Suspense fallback={<PanelReading>Reading your house rules.</PanelReading>}>
        <HouseRulesPanel />
      </React.Suspense>
    );
  }
  if (view === "incidents") {
    return (
      <React.Suspense fallback={<PanelReading>Reading what went wrong.</PanelReading>}>
        <IncidentsPanel />
      </React.Suspense>
    );
  }
  if (view === "routines") {
    return (
      <React.Suspense fallback={<PanelReading>Reading what runs on its own.</PanelReading>}>
        <RoutinesPanel />
      </React.Suspense>
    );
  }
  /**
   * THE FRONT TAB ANSWERS THE ROOM'S OWN QUESTION FIRST.
   *
   * The room is titled "What is it allowed to do?" and this tab is labelled
   * "What is allowed", with the descriptor "The limits on what agents can say
   * or do." It opened straight on GuardrailsPanel: regex and keyword rules for
   * redacting email addresses and blocking API keys, which is what an agent may
   * SAY. What it may DO is the tool boundary, and that was the third block of
   * the tab labelled "Emergency controls" - so a buyer clicking the tab whose
   * name matches the page title word for word got the wrong subject, while the
   * right one sat behind a name promising a stop button.
   *
   * Do, then say, in that order, under the descriptor that already promised
   * both. The boundary is OUTSIDE the Suspense because it is not lazy and has
   * no reason to wait on the guardrails chunk.
   */
  return (
    <>
      {/* The controls below make the same read under the same key, so they fail
          together. Theirs is the fuller failure and it names what to do, so it
          is the one that speaks. */}
      <BoundaryStatement failureShownElsewhere />
      {/*
       * THE CONTROLS BESIDE THE STATEMENT (request 022). Until now the room
       * answered "what is allowed" with what agents may SAY (guardrails) and a
       * read-only summary of the boundary, while the only tool-mode editor in
       * the product lived on /boundary -- reachable from one crew link and a
       * link out of this very tab. What agents may DO is this room's subject,
       * so the controls render here, between the statement that says why and
       * the guardrails that say what may be said.
       */}
      <React.Suspense fallback={<PanelReading>Reading what your crew may do alone.</PanelReading>}>
        <BoundaryControls />
      </React.Suspense>
      <React.Suspense fallback={<PanelReading>Reading the content screening rules.</PanelReading>}>
        <GuardrailsPanel />
      </React.Suspense>
    </>
  );
}
