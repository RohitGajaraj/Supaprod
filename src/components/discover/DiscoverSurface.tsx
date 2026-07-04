import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, MonoLabel } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { listOpportunities, listSignals } from "@/lib/discovery.functions";
import { withTimeout } from "./format";
import { SignalFeed } from "./SignalFeed";
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
 * The evidence desk: a two-column surface on the v4 standard container,
 * signal on the left, judgment on the right. Owns the surface-level "no
 * sources at all" empty state (OBS-06.md §7, §9). SignalFeed and
 * OpportunityQueue each own their own loading/error/quiet-empty states
 * independently.
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
        <div
          className="grid items-start"
          style={{ gridTemplateColumns: "1fr 1.15fr", gap: "24px" }}
        >
          <div ref={signalsRef} id="signals" tabIndex={-1} style={{ outline: "none" }}>
            <SignalFeed />
          </div>
          <div ref={oppsRef} id="opportunities" tabIndex={-1} style={{ outline: "none" }}>
            <OpportunityQueue />
          </div>
        </div>
      )}

      <h2 style={{ margin: "40px 0 12px", lineHeight: 1 }}>
        <MonoLabel style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}>Strategy.</MonoLabel>
      </h2>
      <StrategySection />
    </div>
  );
}
