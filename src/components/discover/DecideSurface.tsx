import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ProductMasthead } from "@/components/obsidian/ProductMasthead";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import { OpportunityQueue } from "./OpportunityQueue";

/** PC-29 layer 2: Decide's station agents, most-relevant first (the fleet is
 * already sorted attention-first, agent-fleet.ts). */
const DECIDE_STATION_AGENTS = ["strategist", "critic"];

/**
 * The decide stage of the loop (2026-07-07). The ranked opportunity queue used
 * to be the cramped third column of Discover; it now owns its own destination
 * between Discover (sense) and Plan (define). Promoting a theme on Discover
 * sends its bet here, where the Critic red-teams it and the human decides what
 * is worth building. The "how deciding works" explainer is now a quiet tooltip
 * on the title, and the queue sits in one comfortable centered column.
 */
export function DecideSurface() {
  const { activeWorkspaceId } = useWorkspace();
  // PC-29 layer 2: shared cache with FleetView's "By Agent" tab (same
  // queryKey) - a cache read here, not a second network call, on the same
  // workspace. Scoped by workspaceId so switching workspaces doesn't show
  // another workspace's agent activity.
  const fFleet = useServerFn(getAgentFleet);
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const presenceAgent = fleet.data?.fleet.agents.find((a) =>
    DECIDE_STATION_AGENTS.includes(a.slug),
  );

  return (
    <div
      className="mx-auto animate-[cadRise_260ms_var(--ease)_both]"
      style={{
        maxWidth: "var(--container-standard)",
        width: "100%",
        padding: "36px 32px 64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Loom §2b glow field: the one ambient wash behind the hero. */}
      <div aria-hidden="true" className="loom-glow-field" />
      <div style={{ maxWidth: "880px", marginInline: "auto" }}>
        <ProductMasthead />
        <div className="flex items-start" style={{ gap: "10px" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 430,
              fontSize: "var(--text-h1)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Decide. <em style={{ color: "var(--ember-text)" }}>The bets worth making.</em>
          </h1>
          <button
            type="button"
            aria-label="How deciding works"
            title="Promoted themes land here as ranked bets. Challenge any bet and the Critic red-teams it with receipts. Promote what is worth building and it moves to Define."
            className="loom-press hover:[color:var(--text-body)]"
            style={{
              flexShrink: 0,
              marginTop: "8px",
              display: "inline-flex",
              color: "var(--text-subtle)",
              background: "transparent",
              border: "none",
              padding: "2px",
              cursor: "help",
            }}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Loom v4 §6: the hero underline, the maker's mark, static, 24px. */}
        <div
          aria-hidden="true"
          style={{
            width: "24px",
            height: "1px",
            background: "var(--thread-gradient)",
            opacity: 0.4,
            margin: "10px 0 24px",
          }}
        />
        {presenceAgent ? (
          <div style={{ marginBottom: 14 }}>
            <PresenceChip
              agentSlug={presenceAgent.slug}
              station="decide"
              state={presenceAgent.state === "working" ? "working" : "idle"}
              lastActedAt={presenceAgent.lastActiveAt}
            />
          </div>
        ) : null}
        <p
          style={{
            fontSize: "var(--text-base)",
            color: "var(--text-muted)",
            margin: "0 0 24px",
            maxWidth: "640px",
            lineHeight: 1.6,
          }}
        >
          The ranked opportunities, red-teamed by the Critic. Promote what is worth building and it
          moves to Plan.
        </p>

        {/* PC-29 layer 4: the inline relay, live only while Decide has a run
            going (e.g. the Critic red-teaming a bet). */}
        <AgentRelay variant="station" station="decide" workspaceId={activeWorkspaceId} />

        <OpportunityQueue />
      </div>
    </div>
  );
}
