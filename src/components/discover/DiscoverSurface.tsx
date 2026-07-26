import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { TopBar } from "@/components/supaprod/TopBar";
import { PageHeader } from "@/components/supaprod/PageHeader";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { listSignals } from "@/lib/discovery.functions";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import {
  isSampleWorkspaceEnabled,
  triggerSampleWorkspace,
} from "@/lib/onboarding/onboarding.functions";
import type { DiscoverTab } from "@/routes/_authenticated.discover";
import { withTimeout } from "./format";
import { SignalFeed } from "./SignalFeed";
import { AutoClustered } from "./AutoClustered";
import { StrategySection } from "./StrategySection";
import { OpportunityQueue } from "./OpportunityQueue";

/** PC-29 layer 2: the station agents per tab, most-relevant first. The fleet
 * is already sorted attention-first (agent-fleet.ts), so the first candidate
 * present is the one worth showing. The queue tab absorbed Decide (IA spine
 * 2026-07-11), so it keeps Decide's strategist/critic pair. */
const STATION_AGENTS: Record<"signals" | "queue", string[]> = {
  signals: ["discovery-scout", "researcher"],
  queue: ["strategist", "critic"],
};

/** Loom v4 §9: every empty state whispers the moat, a faint, static
 * constellation of nodes and threads. Decorative only, so it is hidden from
 * assistive tech. */
function ConstellationMotif() {
  return (
    <svg
      aria-hidden="true"
      width="180"
      height="72"
      viewBox="0 0 180 72"
      fill="none"
      style={{ display: "block", margin: "0 auto 16px", opacity: 0.35 }}
    >
      <path
        d="M18 52 L58 24 L96 44 L132 18 L162 38"
        stroke="var(--hairline-strong)"
        strokeWidth="1"
      />
      <path d="M58 24 L90 10 M96 44 L118 58" stroke="var(--hairline)" strokeWidth="1" />
      <circle cx="18" cy="52" r="2.5" fill="var(--text-subtle)" opacity="0.55" />
      <circle cx="58" cy="24" r="3" fill="var(--text-subtle)" opacity="0.5" />
      <circle cx="90" cy="10" r="2" fill="var(--text-subtle)" />
      <circle cx="96" cy="44" r="2.5" fill="var(--text-subtle)" opacity="0.45" />
      <circle cx="118" cy="58" r="2" fill="var(--text-subtle)" />
      <circle cx="132" cy="18" r="3" fill="var(--text-subtle)" opacity="0.5" />
      <circle cx="162" cy="38" r="2.5" fill="var(--text-subtle)" opacity="0.55" />
    </svg>
  );
}

const TABS: { id: "signals" | "queue"; label: string }[] = [{ id: "signals", label: "Signals" }];

/** The two-tab switch between the signal pipeline and the absorbed Decide
 * queue. A real tablist (roving tabindex, arrow keys, Home/End) whose active
 * tab is the URL search param, so deep links and the promote hand-off token
 * (?tab=queue) select it directly. Ember underline = selection (Tempo v5:
 * ember owns selection); 36px control height. */
function TabBar({
  active,
  onSelect,
}: {
  active: "signals" | "queue";
  onSelect: (tab: "signals" | "queue") => void;
}) {
  const moveTo = (id: "signals" | "queue") => {
    onSelect(id);
    // The buttons persist across the re-render; move focus to the newly
    // selected tab so arrow-key navigation keeps flowing.
    requestAnimationFrame(() => document.getElementById(`discover-tab-${id}`)?.focus());
  };
  return (
    <div
      role="tablist"
      aria-label="Discover sections"
      className="flex items-center"
      style={{ gap: "4px", borderBottom: "1px solid var(--hairline)", marginBottom: "24px" }}
    >
      {TABS.map((t) => {
        const selected = active === t.id;
        const other = t.id === "signals" ? "queue" : "signals";
        return (
          <button
            key={t.id}
            id={`discover-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`discover-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(t.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                moveTo(other);
              } else if (event.key === "Home") {
                event.preventDefault();
                moveTo("signals");
              } else if (event.key === "End") {
                event.preventDefault();
                moveTo("queue");
              }
            }}
            className={`loom-press outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] ${
              // Color lives in classes, not inline style: an inline color would
              // beat the hover class in the cascade and kill the hover state.
              selected
                ? "[color:var(--text-primary)]"
                : "[color:var(--text-muted)] hover:[color:var(--text-body)]"
            }`}
            style={{
              fontSize: "14px",
              fontWeight: selected ? 600 : 500,
              height: "36px",
              padding: "0 16px",
              background: "transparent",
              border: "none",
              borderBottom: selected ? "2px solid var(--ember)" : "2px solid transparent",
              marginBottom: "-1px",
              cursor: "pointer",
              transitionDuration: "var(--dur-control)",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The evidence desk, now the whole front of the loop (IA spine 2026-07-11):
 * the signals tab holds the capture-and-cluster pipeline (SignalFeed +
 * AutoClustered + market watch), and the queue tab absorbed the retired
 * Decide destination (the ranked opportunity queue, red-teamed by the
 * Critic). /decide 301-redirects to ?tab=queue, and promoting a theme hands
 * off to the same token, so the whole journey lives on one surface. Owns the
 * surface-level "no sources at all" empty state (OBS-06.md §7, §9); each
 * column owns its own loading/error/quiet-empty states independently.
 */
export function DiscoverSurface() {
  const navigate = useNavigate();
  // strict:false so the surface renders both at /discover and as the
  // Discover face inside Mission Control (/m); a from-bound read throws an
  // invariant when no /discover match is active. The value stays unused.
  const { tab } = useSearch({ strict: false }) as { tab?: DiscoverTab };
  // Decide (Option B, 2026-07-13) is the home of the ranked judgment queue.
  // Discover is now the sense + cluster surface only; a stale ?tab=queue link
  // simply lands on Signals. The queue lives at /decide.
  void tab;
  const activeTab = "signals" as "signals" | "queue";
  const {
    activeProductId,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    refreshWorkspaces,
  } = useWorkspace();
  const fSignals = useServerFn(listSignals);
  const fSampleEnabled = useServerFn(isSampleWorkspaceEnabled);
  const fTriggerSample = useServerFn(triggerSampleWorkspace);
  const queryClient = useQueryClient();
  // PC-29 layer 2: shared cache with FleetView's "By Agent" tab (same
  // queryKey) - a cache read here, not a second network call, when both are
  // mounted on the same workspace. Scoped by workspaceId so switching
  // workspaces doesn't show another workspace's agent activity (getAgentFleet
  // itself also filters server-side; the query key just keeps the cache
  // honest across a switch).
  const fFleet = useServerFn(getAgentFleet);
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const presenceAgent = fleet.data?.fleet.agents.find((a) =>
    STATION_AGENTS[activeTab].includes(a.slug),
  );

  const selectTab = (next: DiscoverTab) => {
    navigate({
      to: "/discover",
      search: { tab: next === "signals" ? undefined : next },
      replace: true,
    });
  };

  // Shared query key with SignalFeed: react-query dedupes this against its own
  // subscription, so it is a cache read, not a second network call.
  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => withTimeout(fSignals({ data: { productId: activeProductId } })),
  });

  const signalsEmpty =
    !signals.isLoading && !signals.error && (signals.data?.signals.length ?? 0) === 0;

  // SW-6 cold-start: from an empty feed, a user can open a SEPARATE Explore workspace
  // (the rich Prism + Trellis showcase) to look around, instead of staring at a blank
  // desk. It never fills their real workspace with example data; the sample data lives
  // in its own is_sample-flagged workspace that the shell banners and badges. The
  // opt-in is dormant unless SAMPLE_WORKSPACE_ENABLED=1, so a real deployment shows
  // nothing until the founder turns it on. On success we switch the user into it.
  const sampleEnabledQ = useQuery({
    queryKey: ["sample-workspace-enabled"],
    queryFn: () => fSampleEnabled(),
    enabled: signalsEmpty,
  });
  const sampleMutation = useMutation({
    mutationFn: () => fTriggerSample(),
    onSuccess: (res) => {
      refreshWorkspaces();
      const id = (res as { workspaceId?: string | null } | undefined)?.workspaceId;
      if (id) setActiveWorkspaceId(id);
      queryClient.invalidateQueries({ queryKey: ["signals"] });
    },
  });
  const sampleOffered = signalsEmpty && (sampleEnabledQ.data?.enabled ?? false);

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Discover"]} />
      <div
        className="mx-auto animate-[cadRise_260ms_var(--ease)_both]"
        style={{
          maxWidth: "var(--container-standard)",
          width: "100%",
          padding: "var(--page-inset-v) var(--page-inset-h) 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Loom §2b glow field: the one ambient wash behind the hero (default
          glacier, the machine surface light). */}
        <div aria-hidden="true" className="loom-glow-field" />
        <PageHeader
          title="Raw signal in,"
          accent="ranked bets out."
          subtitle="The evidence desk: every opportunity ranked and cited back to the signals behind it."
          usp="The reasoning engine clusters raw signals into ranked, cited bets, so you decide what matters instead of sifting noise."
        />
        {presenceAgent ? (
          <div style={{ marginBottom: 14 }}>
            <PresenceChip
              agentSlug={presenceAgent.slug}
              station={activeTab === "queue" ? "decide" : "discover"}
              state={presenceAgent.state === "working" ? "working" : "idle"}
              lastActedAt={presenceAgent.lastActiveAt}
            />
          </div>
        ) : null}
        {/* The pipeline sentence, once at the top: the whole front of the loop
          in three plain steps. */}
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.6,
            color: "var(--text-muted)",
            maxWidth: "640px",
            margin: "0 0 20px",
          }}
        >
          Signals cluster into bets. Bets get decided. Decided bets become specs.
        </p>

        {activeTab === "queue" ? (
          <div
            role="tabpanel"
            id="discover-panel-queue"
            aria-labelledby="discover-tab-queue"
            style={{ maxWidth: "880px" }}
          >
            <p
              style={{
                fontSize: "var(--tempo-text-base)",
                color: "var(--text-muted)",
                margin: "0 0 20px",
                maxWidth: "640px",
                lineHeight: 1.6,
              }}
            >
              The ranked opportunities, red-teamed by the Critic. Promote what is worth building and
              it moves to Plan.
            </p>
            {/* PC-29 layer 4: the inline relay, live only while the queue has a
              run going (e.g. the Critic red-teaming a bet). */}
            <AgentRelay variant="station" station="decide" workspaceId={activeWorkspaceId} />
            <OpportunityQueue />
          </div>
        ) : (
          <div role="tabpanel" id="discover-panel-signals" aria-labelledby="discover-tab-signals">
            {/* PC-29 layer 4: the inline relay, live only while Sense has a run
              going. Reuses the same station data as PresenceChip above -
              quiet when nothing is working. */}
            <AgentRelay variant="station" station="sense" workspaceId={activeWorkspaceId} />

            {signalsEmpty ? (
              <div
                className="material-medium"
                style={{
                  padding: "44px 40px",
                  textAlign: "center",
                }}
              >
                <ConstellationMotif />
                {/* The one Pixel brand moment on this surface (Tempo v5 §3/§8):
                  the empty-state headline, short and display-only, never the
                  supporting line beneath it. */}
                <p
                  style={{
                    fontFamily: "var(--font-pixel)",
                    fontSize: "20px",
                    lineHeight: 1.3,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  Nothing sensed yet
                </p>
                <p
                  style={{
                    fontSize: "var(--tempo-text-base)",
                    color: "var(--text-body)",
                    margin: "0 0 16px",
                  }}
                >
                  Connect a source and give it ten minutes.
                </p>
                <Button
                  variant="accent"
                  style={{
                    background:
                      "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
                    color: "var(--cta-ink)",
                  }}
                  onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
                >
                  Connect a source
                </Button>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-subtle)",
                    marginTop: "10px",
                  }}
                >
                  Opens Connections · reading starts the moment a source is linked
                </p>
                {sampleOffered ? (
                  <div
                    style={{
                      marginTop: "22px",
                      paddingTop: "20px",
                      borderTop: "1px solid var(--hairline)",
                    }}
                  >
                    <Button
                      variant="tertiary"
                      disabled={sampleMutation.isPending}
                      onClick={() => sampleMutation.mutate()}
                    >
                      {sampleMutation.isPending
                        ? "Opening sample workspace…"
                        : "Explore a sample workspace"}
                    </Button>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-subtle)",
                        marginTop: "10px",
                      }}
                    >
                      Opens a separate Explore workspace of clearly labelled example data · your own
                      workspace stays empty · about 5 seconds
                    </p>
                    {sampleMutation.isError ? (
                      // An error wears error clothes (madder), never quiet gray.
                      <p style={{ fontSize: "12px", color: "var(--madder)", marginTop: "6px" }}>
                        Could not open the sample workspace. Try again.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 items-start md:grid-cols-2"
                  style={{ gap: "24px" }}
                >
                  <div className="min-w-0">
                    <SignalFeed />
                  </div>
                  <div className="min-w-0">
                    <AutoClustered />
                  </div>
                </div>

                {/* Market watch: the tracked competitors + platforms and the
                  weekly briefs Supaprod writes when one of them moves. Lives
                  below the signal pipeline as its own labelled section so its
                  purpose reads plainly. */}
                <div style={{ marginTop: 44 }}>
                  <h2
                    className="text-heading-16"
                    style={{ margin: 0, color: "var(--text-primary)" }}
                  >
                    Market watch
                  </h2>
                  <p
                    style={{
                      margin: "3px 0 16px",
                      fontSize: "var(--text-label-13)",
                      color: "var(--text-subtle)",
                    }}
                  >
                    Competitors and platforms you track. Supaprod writes you a brief the first
                    Monday after one of them actually moves.
                  </p>
                  <StrategySection />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
