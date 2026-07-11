// PC-34: the Brain front door. The whole first viewport a person sees on
// Brain before picking a lens, replacing the flat tab bar as the default
// view. Three parts, top to bottom: the ask box (the primary entry action),
// what changed since the last visit, and up to two things Cadence is
// volunteering unprompted. Data comes from brain-front-door.functions.ts;
// read that file's header comment for the shape and the honesty rules it
// already enforces (no fabricated "since" recency, no padded insight count).
//
// Precedent followed, not reinvented: the relative-time formatter is
// DecisionsPanel's `ageOf`, the quiet trace-ref tail reuses the registered
// LRN prefix (dim 17 registry, learnings already carry it in
// LearningDetail.tsx / CompoundingPanel.tsx), and the volunteered-insight
// spotlight treatment mirrors InsightsPanel's "What Cadence is seeing" card
// exactly, since that is this surface's own established voice for this kind
// of content.
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getWhatChanged,
  getVolunteeredInsights,
  markBrainSeen,
  type VolunteeredInsight,
  type WhatChangedItem,
} from "@/lib/brain-front-door.functions";
import { MonoLabel, Button } from "./primitives";
import { SpotlightCard } from "./spotlight";
import { PanelSkeleton } from "@/components/knowledge/PanelSkeleton";
import { ageOf } from "@/components/knowledge/decisions-shared";
import { traceRef } from "@/components/discover/format";

// The literal intent dispatched on click (OBS-12 wiring: AskProvider's
// runIntent queues this as the panel's first message the moment it opens).
const ASK_INTENT = "Ask your product's memory anything - why did we decide X?";

const INSIGHT_KIND_LABEL: Record<VolunteeredInsight["kind"], string> = {
  prediction: "Prediction",
  risk: "Risk",
  cost_of_inaction: "Cost of waiting",
  hidden_connection: "Hidden pattern",
};

/** The ask box: generously sized, reads as an inviting input, not a tiny icon
 * button. It is the page's primary entry action, so it renders unconditionally
 * regardless of what the two queries below are doing. */
function AskBox() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("cadence:open-ask", { detail: { intent: ASK_INTENT } }),
        )
      }
      className="loom-press flex w-full items-center text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--ember)]"
      style={{
        gap: 16,
        border: "1px solid var(--hairline-strong)",
        background: "var(--surface-card, var(--card))",
        boxShadow: "var(--top-light)",
        borderRadius: "var(--radius-panel, 14px)",
        padding: "22px 26px",
      }}
      aria-label="Ask your product's memory anything"
    >
      <span style={{ flex: 1, fontSize: 16, color: "var(--text-subtle)", lineHeight: 1.4 }}>
        Ask your product's memory anything. Why did we decide X?
      </span>
      <span
        style={{
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-faint)",
        }}
      >
        ⌘J
      </span>
    </button>
  );
}

function WhatChangedRow({ item }: { item: WhatChangedItem }) {
  return (
    <Link
      to="/brain"
      search={{ tab: "learnings", learning: item.id }}
      className="loom-press flex items-center justify-between outline-none hover:[background-color:var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--ember)]"
      style={{
        gap: 14,
        padding: "12px 16px",
        borderRadius: "var(--radius-control)",
        textDecoration: "none",
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 13.5,
            color: "var(--text-body)",
            lineHeight: 1.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.headline}
        </span>
        {/* dim 17: LRN is the registered prefix for learnings (LearningDetail.tsx,
            CompoundingPanel.tsx), reused here, not a new code. */}
        <span
          style={{
            display: "block",
            marginTop: 3,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.06em",
            color: "var(--text-faint)",
          }}
        >
          LRN·{traceRef(item.id)}
        </span>
      </span>
      <span
        className="tabular-nums"
        style={{
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-subtle)",
        }}
      >
        {ageOf(item.createdAt)}
      </span>
    </Link>
  );
}

function WhatChangedSection({ items }: { items: WhatChangedItem[] }) {
  return (
    <section>
      <h2
        className="font-display"
        style={{ fontSize: 17, fontWeight: 460, color: "var(--text-primary)", margin: "0 0 12px" }}
      >
        What changed since you last looked
      </h2>
      {items.length === 0 ? (
        // The empty state is honest information, not an error: it never hides
        // the section, it just says plainly that nothing landed.
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Nothing new since you last looked.
        </p>
      ) : (
        <div className="bento" style={{ display: "flex", flexDirection: "column", padding: 6 }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{ borderBottom: i < items.length - 1 ? "1px solid var(--hairline)" : "none" }}
            >
              <WhatChangedRow item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Shared card body for a volunteered insight. No registered dim-17 trace
 * prefix exists yet for the `insights` table, so this deliberately does not
 * invent one - the kind label is the honest receipt tag. `/brain?tab=insights`
 * is a real destination (InsightsPanel reads the active workspace itself),
 * not a placeholder link, so it is offered as the generic "open" affordance
 * the data shape allows. */
function InsightBody({ insight }: { insight: VolunteeredInsight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <MonoLabel>{INSIGHT_KIND_LABEL[insight.kind]}</MonoLabel>
      <p style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.55, margin: 0 }}>
        {insight.headline}
      </p>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
        {insight.detail}
      </p>
      {insight.calibrationLabel ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.06em",
            color: "var(--text-faint)",
          }}
        >
          {insight.calibrationLabel}
        </span>
      ) : null}
      <Link
        to="/brain"
        search={{ tab: "insights" }}
        style={{
          alignSelf: "flex-start",
          marginTop: 2,
          fontFamily: "var(--font-ui)",
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--glacier)",
        }}
      >
        Open in Insights &rarr;
      </Link>
    </div>
  );
}

function VolunteeredInsightsSection({ insights }: { insights: VolunteeredInsight[] }) {
  // Never pad to 2 with filler: render exactly however many exist, including
  // rendering nothing at all when there are none (matches InsightRail.tsx's
  // own calm-front rule for this identical kind set on Today).
  if (insights.length === 0) return null;
  const [top, ...rest] = insights;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ONE spotlight moment for this section: the highest-scoring insight,
          in the exact voice InsightsPanel already established for this kind
          of read. */}
      <SpotlightCard kicker="What Cadence is seeing" tone="neutral">
        <InsightBody insight={top} />
      </SpotlightCard>
      {rest.map((insight) => (
        <div key={insight.id} className="bento" style={{ padding: "16px 18px" }}>
          <InsightBody insight={insight} />
        </div>
      ))}
    </section>
  );
}

export function BrainFrontDoor() {
  const { activeWorkspaceId } = useWorkspace();
  const fWhatChanged = useServerFn(getWhatChanged);
  const fInsights = useServerFn(getVolunteeredInsights);
  const fMarkSeen = useServerFn(markBrainSeen);

  const whatChanged = useQuery({
    queryKey: ["brain-what-changed", activeWorkspaceId],
    queryFn: () => fWhatChanged({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });
  const insights = useQuery({
    queryKey: ["brain-insights-rail", activeWorkspaceId],
    queryFn: () => fInsights({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });

  const seen = useMutation({
    mutationFn: (workspaceId: string) => fMarkSeen({ data: { workspaceId } }),
  });

  // Fire markBrainSeen once per mount, once what-changed has rendered (so
  // this visit's own changes stay visible), never again this mount even if
  // the query refetches later. Best-effort: a failed mutation never surfaces
  // an error, the page just keeps its current "last seen" clock.
  const seenFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (!activeWorkspaceId || !whatChanged.isSuccess || seenFiredRef.current) return;
    seenFiredRef.current = true;
    seen.mutate(activeWorkspaceId);
  }, [activeWorkspaceId, whatChanged.isSuccess, seen.mutate]);

  const isLoading = whatChanged.isPending || insights.isPending;
  const isError = whatChanged.isError || insights.isError;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <AskBox />

      {isLoading ? (
        <PanelSkeleton rows={[56, 56, 56, 140]} />
      ) : isError ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--top-light)",
            padding: "16px 18px",
          }}
        >
          <MonoLabel style={{ marginBottom: 8, display: "block" }}>
            Brain front door · failed to load
          </MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
            {(whatChanged.error as Error)?.message ??
              (insights.error as Error)?.message ??
              "Unknown error"}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void whatChanged.refetch();
              void insights.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <WhatChangedSection items={whatChanged.data ?? []} />
          <VolunteeredInsightsSection insights={insights.data ?? []} />
        </>
      )}
    </div>
  );
}
