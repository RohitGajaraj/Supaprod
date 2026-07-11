import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { ProductMasthead } from "@/components/obsidian/ProductMasthead";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { listSignals } from "@/lib/discovery.functions";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import {
  isSampleWorkspaceEnabled,
  triggerSampleWorkspace,
} from "@/lib/onboarding/onboarding.functions";
import { withTimeout } from "./format";
import { SignalFeed } from "./SignalFeed";
import { AutoClustered } from "./AutoClustered";
import { StrategySection } from "./StrategySection";

/** PC-29 layer 2: Discover's station agents, most-relevant first. The fleet
 * is already sorted attention-first (agent-fleet.ts), so the first candidate
 * present is the one worth showing. */
const DISCOVER_STATION_AGENTS = ["discovery-scout", "researcher"];

/** Loom v4 §9: every empty state whispers the moat — a faint, static
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
      style={{ display: "block", margin: "0 auto 18px", opacity: 0.35 }}
    >
      <path
        d="M18 52 L58 24 L96 44 L132 18 L162 38"
        stroke="var(--hairline-strong)"
        strokeWidth="1"
      />
      <path d="M58 24 L90 10 M96 44 L118 58" stroke="var(--hairline)" strokeWidth="1" />
      <circle cx="18" cy="52" r="2.5" fill="var(--glacier)" opacity="0.55" />
      <circle cx="58" cy="24" r="3" fill="var(--blossom)" opacity="0.5" />
      <circle cx="90" cy="10" r="2" fill="var(--text-subtle)" />
      <circle cx="96" cy="44" r="2.5" fill="var(--glacier)" opacity="0.45" />
      <circle cx="118" cy="58" r="2" fill="var(--text-subtle)" />
      <circle cx="132" cy="18" r="3" fill="var(--blossom)" opacity="0.5" />
      <circle cx="162" cy="38" r="2.5" fill="var(--glacier)" opacity="0.55" />
    </svg>
  );
}

/**
 * The evidence desk: a two-column pipeline on the standard work container that
 * reads left to right as the front of the loop, signals captured (A) then
 * auto-clustered + ranked (B). The ranked opportunity queue moved to its own
 * Decide destination (2026-07-07), so this surface stays two clean columns and
 * never overflows. Owns the surface-level "no sources at all" empty state
 * (OBS-06.md §7, §9). SignalFeed and AutoClustered each own their own
 * loading/error/quiet-empty states independently.
 */
export function DiscoverSurface() {
  const navigate = useNavigate();
  const { tab } = useSearch({ from: "/_authenticated/discover" });
  const { activeProductId, activeWorkspaceId, setActiveWorkspaceId, refreshWorkspaces } =
    useWorkspace();
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
    DISCOVER_STATION_AGENTS.includes(a.slug),
  );

  // Loom W2 (audit D-24): honor the deep-link ?tab= from the legacy redirects
  // and the palette pass. Only the signals column lives here now (the
  // opportunities column moved to /decide), so a legacy ?tab=opportunities
  // link degrades to the plain surface rather than crashing.
  const signalsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tab !== "signals") return;
    const target = signalsRef.current;
    if (!target) return;
    target.scrollIntoView({ block: "start", behavior: "auto" });
    target.focus({ preventScroll: true });
  }, [tab]);

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
      {/* Loom §2b glow field: the one ambient wash behind the hero (default
          glacier, the machine surface light). */}
      <div aria-hidden="true" className="loom-glow-field" />
      <ProductMasthead />
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
        The evidence desk. Raw <em style={{ color: "var(--ember-text)" }}>signal</em> on the left,
        the ranked themes it clusters into on the right.
      </h1>
      {/* Loom v4 §6: the hero underline, the maker's mark, static, 24px wide. */}
      <div
        aria-hidden="true"
        style={{
          width: "24px",
          height: "1px",
          background: "var(--thread-gradient)",
          opacity: 0.4,
          margin: "10px 0 14px",
        }}
      />
      {presenceAgent ? (
        <div style={{ marginBottom: 14 }}>
          <PresenceChip
            agentSlug={presenceAgent.slug}
            station="discover"
            state={presenceAgent.state === "working" ? "working" : "idle"}
            lastActedAt={presenceAgent.lastActiveAt}
          />
        </div>
      ) : null}
      {/* The sensing framing lives inside Discover: this is where continuous
          capture becomes ranked themes. */}
      <p
        style={{
          fontSize: "13px",
          lineHeight: 1.6,
          color: "var(--text-muted)",
          maxWidth: "640px",
          margin: "0 0 24px",
        }}
      >
        Cadence senses continuously. Every signal you or your tools capture flows in, gets clustered
        automatically, and rises as a ranked theme.
      </p>

      {/* PC-29 layer 4: the inline relay, live only while Sense has a run
          going. Reuses the same station data as PresenceChip above -
          quiet when nothing is working. */}
      <AgentRelay variant="station" station="sense" workspaceId={activeWorkspaceId} />

      {signalsEmpty ? (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--top-light), var(--shadow-ambient)",
            padding: "44px 40px",
            textAlign: "center",
          }}
        >
          <ConstellationMotif />
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--text-body)",
              margin: "0 0 16px",
            }}
          >
            Nothing sensed yet. Connect a source and give it ten minutes.
          </p>
          <Button
            variant="primary"
            style={{
              background: "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
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
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                  Could not open the sample workspace. Try again.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {/* The pipeline reads left to right: raw evidence, then the themes
              Cadence ranks. The two columns below are its two in-surface
              stations; the ranked bets themselves now live on Decide, so the
              stepper ends on a quiet hand-off hint. Decorative (each column
              carries its own heading), so hidden from assistive tech. Ember is
              the one scarce accent on step 1. */}
          <div
            aria-hidden="true"
            className="mb-5 flex flex-wrap items-center"
            style={{ gap: "10px" }}
          >
            {[
              { n: "1", label: "Captured" },
              { n: "2", label: "Clustered + ranked" },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center" style={{ gap: "10px" }}>
                {i > 0 ? (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-faint)",
                    }}
                  >
                    {"→"}
                  </span>
                ) : null}
                <span
                  className="flex items-center"
                  style={{
                    gap: "6px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10.5px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-subtle)",
                  }}
                >
                  <span
                    style={{
                      color: i === 0 ? "var(--ember-text)" : "var(--glacier)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {step.n}
                  </span>
                  <span>{step.label}</span>
                </span>
              </div>
            ))}
            {/* Hand-off: promoting a theme sends its bet to Decide. Quietest
                token, no number, so the two numbered steps stay the anchors. */}
            <div className="flex items-center" style={{ gap: "10px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-faint)",
                }}
              >
                {"→"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                }}
              >
                promote to Decide
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start lg:grid-cols-2" style={{ gap: "24px" }}>
            <div
              ref={signalsRef}
              id="signals"
              tabIndex={-1}
              className="min-w-0"
              style={{ outline: "none" }}
            >
              <SignalFeed />
            </div>
            <div className="min-w-0" style={{ outline: "none" }}>
              <AutoClustered />
            </div>
          </div>

          {/* Market watch: the tracked competitors + platforms and the weekly
              briefs Cadence writes when one of them moves. Lives below the
              signal pipeline as its own labelled section so its purpose reads
              plainly. */}
          <div style={{ marginTop: 44 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-ui)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.3,
              }}
            >
              Market watch
            </h2>
            <p style={{ margin: "3px 0 16px", fontSize: 12.5, color: "var(--text-subtle)" }}>
              Competitors and platforms you track. Cadence writes you a brief the first Monday after
              one of them actually moves.
            </p>
            <StrategySection />
          </div>
        </>
      )}
    </div>
  );
}
