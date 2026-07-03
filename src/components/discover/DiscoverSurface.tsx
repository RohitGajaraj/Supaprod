import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button, MonoLabel } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { listOpportunities, listSignals } from "@/lib/discovery.functions";
import { SignalFeed } from "./SignalFeed";
import { OpportunityQueue } from "./OpportunityQueue";
import { StrategySection } from "./StrategySection";

/**
 * The evidence desk: a 1160px two-column surface, signal on the left,
 * judgment on the right. Owns the surface-level "no sources at all" empty
 * state (OBS-06.md §7, §9). SignalFeed and OpportunityQueue each own their
 * own loading/error/quiet-empty states independently.
 */
export function DiscoverSurface() {
  const navigate = useNavigate();
  const { activeProductId } = useWorkspace();
  const fSignals = useServerFn(listSignals);
  const fOpps = useServerFn(listOpportunities);

  // Shared query keys with SignalFeed/OpportunityQueue: react-query dedupes
  // this against their own subscriptions, so it is a cache read, not a
  // second network call.
  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => fSignals({ data: { productId: activeProductId } }),
  });
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => fOpps() });

  const bothLoaded = !signals.isLoading && !opps.isLoading;
  const bothEmpty =
    bothLoaded &&
    !signals.error &&
    !opps.error &&
    (signals.data?.signals.length ?? 0) === 0 &&
    (opps.data?.opportunities.length ?? 0) === 0;

  return (
    <div
      className="mx-auto animate-[cadRise_260ms_var(--ease)_both]"
      style={{ maxWidth: "1160px", padding: "36px 32px 64px" }}
    >
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 430,
          fontSize: "28px",
          letterSpacing: "-0.015em",
          color: "var(--text-primary)",
          margin: "0 0 24px",
        }}
      >
        The evidence desk. <em style={{ color: "#7FD1DC" }}>Signal</em> on the left, judgment on the
        right.
      </h1>

      {bothEmpty ? (
        <div
          style={{
            backgroundColor: "#111113",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "var(--radius-card)",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: "0 0 16px" }}>
            Nothing sensed yet. Plug in Intercom and give it ten minutes.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
          >
            Connect a source
          </Button>
          <p
            style={{
              fontSize: "var(--text-helper)",
              color: "var(--text-subtle)",
              marginTop: "10px",
            }}
          >
            Opens Connections · Scout starts reading as soon as it is linked
          </p>
        </div>
      ) : (
        <div
          className="grid items-start"
          style={{ gridTemplateColumns: "1fr 1.15fr", gap: "20px" }}
        >
          <SignalFeed />
          <OpportunityQueue />
        </div>
      )}

      <div style={{ marginTop: 40, marginBottom: 12 }}>
        <MonoLabel>Strategy.</MonoLabel>
      </div>
      <StrategySection />
    </div>
  );
}
