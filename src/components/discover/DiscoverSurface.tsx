import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { listOpportunities, listSignals } from "@/lib/discovery.functions";
import { withTimeout } from "./format";
import { SignalFeed } from "./SignalFeed";
import { AutoClustered } from "./AutoClustered";
import { OpportunityQueue } from "./OpportunityQueue";
import { StrategySection } from "./StrategySection";

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
 * The evidence desk: a three-column pipeline on the v4 work container that
 * reads left to right as the core loop, signals captured (A) then
 * auto-clustered + ranked (B) then the opportunity queue (C). Owns the
 * surface-level "no sources at all" empty state (OBS-06.md §7, §9). SignalFeed,
 * AutoClustered, and OpportunityQueue each own their own
 * loading/error/quiet-empty states independently.
 */
export function DiscoverSurface() {
  const navigate = useNavigate();
  const { tab } = useSearch({ from: "/_authenticated/discover" });
  const { activeProductId } = useWorkspace();
  const fSignals = useServerFn(listSignals);
  const fOpps = useServerFn(listOpportunities);

  // Loom W2 (audit D-24): honor the deep-link ?tab= the legacy redirects and
  // the palette pass. Both columns live on one canvas, so "selecting" the tab
  // means scrolling its column into view and handing it keyboard focus.
  const signalsRef = useRef<HTMLDivElement>(null);
  const oppsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tab) return;
    const target = tab === "signals" ? signalsRef.current : oppsRef.current;
    if (!target) return;
    target.scrollIntoView({ block: "start", behavior: "auto" });
    target.focus({ preventScroll: true });
  }, [tab]);

  // Shared query keys with SignalFeed/OpportunityQueue: react-query dedupes
  // this against their own subscriptions, so it is a cache read, not a
  // second network call.
  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => withTimeout(fSignals({ data: { productId: activeProductId } })),
  });
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => withTimeout(fOpps()) });

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
      style={{
        maxWidth: "var(--container-work)",
        width: "100%",
        padding: "36px 32px 64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Loom §2b glow field: the one ambient wash behind the hero (default
          glacier, the machine surface light). */}
      <div aria-hidden="true" className="loom-glow-field" />
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
        The evidence desk. <em style={{ color: "var(--ember-text)" }}>Signal</em> on the left,
        judgment on the right.
      </h1>
      {/* Loom v4 §6: the hero underline — the maker's mark, static, 24px. */}
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

      {bothEmpty ? (
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
        </div>
      ) : (
        <>
          {/* The pipeline reads left to right: raw evidence, then the themes
              Cadence ranks, then the bets it promotes. A quiet mono stepper
              names the journey; the columns below are its three stations.
              Decorative (each column carries its own heading), so hidden from
              assistive tech. Ember is the one scarce accent on step 1. */}
          <div
            aria-hidden="true"
            className="mb-5 flex flex-wrap items-center"
            style={{ gap: "10px" }}
          >
            {[
              { n: "1", label: "Captured" },
              { n: "2", label: "Clustered + ranked" },
              { n: "3", label: "Opportunities" },
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
          </div>

          <div
            className="grid grid-cols-1 items-start xl:grid-cols-3"
            style={{ gap: "20px" }}
          >
            <div ref={signalsRef} id="signals" tabIndex={-1} style={{ outline: "none" }}>
              <SignalFeed />
            </div>
            <div style={{ outline: "none" }}>
              <AutoClustered />
            </div>
            <div ref={oppsRef} id="opportunities" tabIndex={-1} style={{ outline: "none" }}>
              <OpportunityQueue />
            </div>
          </div>
        </>
      )}

      {/* Strategy is a first-class section (founder ruling 2026-07-06): always
          visible, never collapsed. It carries a clear heading + subtext so it
          reads as the important anchor it is; the evidence desk above caps its
          lists to the top few so Strategy is reachable without a long scroll. */}
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
          Strategy
        </h2>
        <p style={{ margin: "3px 0 16px", fontSize: 12.5, color: "var(--text-subtle)" }}>
          Vision, ICP, the bets you are making, and the entities you track
        </p>
        <StrategySection />
      </div>
    </div>
  );
}
