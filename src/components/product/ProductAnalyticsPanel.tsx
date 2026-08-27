/**
 * F-ANALYTICS-1 / F-ANALYTICS-2 — Post-ship cohort panel for an opportunity.
 *
 * Shows:
 *  - The linked PostHog event (editable link/unlink)
 *  - 30-day daily user sparkline
 *  - ICE auto-adjustment history (provenance from real data)
 *  - "Refresh" trigger to pull latest analytics on demand
 *
 * Silently absent when no featureEvent is linked (doesn't clutter the detail
 * page until the PM explicitly wires up a tracking event).
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart2, Link2, RefreshCw, Loader2, CheckCircle, X } from "lucide-react";
import { GraphSlider } from "@/components/meridian/graph-slider";
import { Action } from "@/components/meridian/surface-parts";
import {
  getProductAnalytics,
  linkOpportunityEvent,
  autoAdjustIceForOpportunity,
  runAnalyticsIngest,
} from "@/lib/product-analytics.functions";

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ProductAnalyticsPanel({
  opportunityId,
  workspaceId,
}: {
  opportunityId: string;
  workspaceId: string;
}) {
  const qc = useQueryClient();
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventDraft, setEventDraft] = useState("");

  const fGet = useServerFn(getProductAnalytics);
  const fLink = useServerFn(linkOpportunityEvent);
  const fAdjust = useServerFn(autoAdjustIceForOpportunity);
  const fIngest = useServerFn(runAnalyticsIngest);

  const analytics = useQuery({
    queryKey: ["product-analytics", opportunityId],
    queryFn: () => fGet({ data: { opportunityId } }),
  });

  const mLink = useMutation({
    mutationFn: (featureEvent: string | null) => fLink({ data: { opportunityId, featureEvent } }),
    onSuccess: () => {
      setEditingEvent(false);
      qc.invalidateQueries({ queryKey: ["product-analytics", opportunityId] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const mAdjust = useMutation({
    mutationFn: () => fAdjust({ data: { opportunityId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-analytics", opportunityId] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const mIngest = useMutation({
    mutationFn: () => fIngest({ data: { workspaceId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-analytics", opportunityId] }),
  });

  if (analytics.isLoading) return null;
  const d = analytics.data;
  if (!d) return null;

  const hasData = d.cohort.length > 0;
  const latestDay = d.cohort.at(-1);
  const totalUsers = d.cohort.reduce((s, r) => s + r.distinct_users, 0);
  const latestAdj = d.iceAdjustments[0];

  return (
    <div className="mt-4 rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Post-ship analytics</span>
          {d.ingestGated && (
            <span className="text-mrd-nano bg-muted text-amber-500 border border-border rounded px-1.5 py-0.5">
              Key needed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {d.featureEvent && !d.ingestGated && (
            // TIER: Action, quiet face. Pulls fresh PostHog data - a dispatch,
            // not a reveal.
            <Action
              variant="quiet"
              onClick={() => mIngest.mutate()}
              busy={mIngest.isPending}
              title="Pull latest PostHog data"
            >
              {mIngest.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Action>
          )}
          {d.featureEvent && hasData && (
            // TIER: Action, default face. Rewrites ICE scores from live data -
            // a write with visible weight.
            <Action onClick={() => mAdjust.mutate()} busy={mAdjust.isPending}>
              {mAdjust.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
              Auto-adjust ICE
            </Action>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Event link */}
        {editingEvent ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={eventDraft}
              onChange={(e) => setEventDraft(e.target.value)}
              placeholder="e.g. decision_made"
              className="flex-1 text-xs border border-border rounded px-2 py-1 outline-none focus:border-foreground"
            />
            {/* TIER: Action, primary face. Writes the event link - confirming
                the edit is the step's point. */}
            <Action
              variant="primary"
              onClick={() => mLink.mutate(eventDraft.trim() || null)}
              busy={mLink.isPending}
            >
              {mLink.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Link"}
            </Action>
            <button onClick={() => setEditingEvent(false)}>
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-muted-foreground" />
            </button>
          </div>
        ) : d.featureEvent ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 shrink-0" style={{ color: "var(--mrd-pass)" }} />
            <code className="text-mrd-tiny text-muted-foreground">{d.featureEvent}</code>
            <button
              onClick={() => {
                setEventDraft(d.featureEvent ?? "");
                setEditingEvent(true);
              }}
              className="ml-auto text-mrd-nano text-muted-foreground hover:text-muted-foreground"
            >
              change
            </button>
            {d.featureEvent && (
              // TIER: Action, destructive face. Removes the PostHog link - a
              // delete of the binding.
              <Action
                variant="destructive"
                onClick={() => mLink.mutate(null)}
                busy={mLink.isPending}
              >
                unlink
              </Action>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              setEventDraft("");
              setEditingEvent(true);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="h-3 w-3" />
            Link a PostHog event to track adoption
          </button>
        )}

        {/* Cohort sparkline */}
        {hasData && (
          <div>
            <div className="flex items-baseline justify-between text-mrd-tiny text-muted-foreground">
              <span>30-day distinct users</span>
              <span className="font-semibold text-foreground">{totalUsers} total</span>
            </div>
            <div className="mt-2">
              <GraphSlider
                data={d.cohort.map((c) => c.distinct_users)}
                labels={d.cohort.map((c) => when(c.cohort_date))}
                h={120}
                color="var(--flamingo)"
                formatValue={(v) => String(Math.round(v))}
                ariaLabel="Daily active users, last 30 days"
              />
            </div>
            {latestDay && (
              <div className="text-mrd-nano text-muted-foreground mt-1 text-right">
                Latest: {latestDay.distinct_users} users on {latestDay.cohort_date}
              </div>
            )}
          </div>
        )}

        {!hasData && d.featureEvent && (
          <p className="text-mrd-tiny text-muted-foreground">
            {d.ingestGated
              ? "Set POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID to pull cohort data."
              : "No data yet. Click refresh to pull from PostHog."}
          </p>
        )}

        {/* ICE adjustment history */}
        {d.iceAdjustments.length > 0 && (
          <div className="border-t border-border pt-2.5">
            <div className="text-mrd-nano font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              ICE auto-adjustments
            </div>
            {d.iceAdjustments.map((adj, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--mrd-agent)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-mrd-tiny text-foreground leading-mrd-snug">
                    Impact {adj.old_impact}→{adj.new_impact} · Confidence {adj.old_confidence}→
                    {adj.new_confidence}
                    <span className="text-muted-foreground ml-1">· {adj.sample_users} users</span>
                  </div>
                  <div className="text-mrd-nano text-muted-foreground">{when(adj.adjusted_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {latestAdj && (
          <p className="text-mrd-nano text-muted-foreground leading-mrd-prose">
            {latestAdj.reason}
          </p>
        )}
      </div>
    </div>
  );
}
