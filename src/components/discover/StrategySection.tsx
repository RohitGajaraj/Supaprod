// OBS-10: the strategy head, ported from the retired /product Strategy tab
// (src/components/product/StrategyPanel.tsx) into Discover. Same read-only
// contract as the legacy panel: the scout_targets watch list still seeds
// itself via auto-seed and the weekly briefs still synthesize on their own
// cadence; a manual add-to-watchlist form stays a documented follow-up, not
// built here. Reuses listTrackedEntities/listStrategyBriefs unchanged.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Button, MonoLabel } from "@/components/obsidian";
import {
  listTrackedEntities,
  listStrategyBriefs,
  type TrackedEntity,
  type StrategyBrief,
} from "@/lib/strategy-registry.functions";
import { relTimeCaps, withTimeout } from "./format";
import { SkeletonBar } from "./SkeletonBar";

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="material-medium" style={{ padding: "18px 20px" }}>
      {children}
    </div>
  );
}

function HeaderRow({ label, count }: { label: string; count: number | null }) {
  return (
    <div className="mb-3.5 flex items-baseline">
      <h3 className="flex-1" style={{ margin: 0, lineHeight: 1 }}>
        <MonoLabel style={{ letterSpacing: "0.12em" }}>{label}</MonoLabel>
      </h3>
      {count === null ? null : (
        <MonoLabel
          style={{
            letterSpacing: "0.08em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </MonoLabel>
      )}
    </div>
  );
}

function lastCheckedCaps(iso: string | null): string {
  return iso ? relTimeCaps(iso) : "NOT YET CHECKED";
}

function kindCaps(kind: TrackedEntity["kind"]): string {
  return kind === "competitor-surface" ? "COMPETITOR" : "TECH SHIFT";
}

function BriefRow({ brief, isLast }: { brief: StrategyBrief; isLast: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "5px",
        paddingBottom: "13px",
        borderBottom: isLast ? undefined : "1px solid var(--hairline-faint)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            border: "1px solid color-mix(in srgb, var(--text-muted) 35%, transparent)",
            borderRadius: "var(--radius-pill)",
            padding: "1px 7px",
          }}
        >
          {brief.kind === "competitor" ? "COMPETITOR" : "TECH SHIFT"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
            color: "var(--text-subtle)",
          }}
        >
          {relTimeCaps(brief.created_at)}
        </span>
      </div>
      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
        {brief.title}
      </div>
      <p
        style={{
          lineHeight: 1.6,
          color: "var(--text-body)",
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {brief.content}
      </p>
    </div>
  );
}

function EntityRow({ entity, isLast }: { entity: TrackedEntity; isLast: boolean }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        padding: "8px 0",
        borderBottom: isLast ? undefined : "1px solid var(--hairline-faint)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          color: "var(--text-subtle)",
          flexShrink: 0,
        }}
      >
        {kindCaps(entity.kind)}
      </span>
      <span
        style={{
          color: "var(--text-body)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entity.label}
      </span>
      <MonoLabel style={{ letterSpacing: "0.08em" }}>
        {entity.cadence.toUpperCase()}
      </MonoLabel>
      <MonoLabel style={{ letterSpacing: "0.08em" }}>
        {entity.enabled ? lastCheckedCaps(entity.last_checked_at) : "PAUSED"}
      </MonoLabel>
    </div>
  );
}

export function StrategySection() {
  const fEntities = useServerFn(listTrackedEntities);
  const fBriefs = useServerFn(listStrategyBriefs);
  // Anti-scroll (founder ruling 2026-07-06): each list shows the top few and
  // expands on demand, so this section never becomes a long wall. Briefs and
  // entities are independent lists, so each gets its own cap and its own
  // showAll toggle (matches SignalFeed/AutoClustered's idiom).
  const [showAllBriefs, setShowAllBriefs] = useState(false);
  const VISIBLE_BRIEFS = 4;
  const [showAllEntities, setShowAllEntities] = useState(false);
  const VISIBLE_ENTITIES = 6;
  const entitiesQ = useQuery({
    queryKey: ["strategy-entities"],
    queryFn: () => withTimeout(fEntities()),
  });
  const briefsQ = useQuery({
    queryKey: ["strategy-briefs"],
    queryFn: () => withTimeout(fBriefs()),
  });

  const entities = entitiesQ.data ?? [];
  const briefs = briefsQ.data ?? [];

  return (
    // Responsive: the two panels sit side by side only when there is room;
    // below the md breakpoint they stack, so 768px never squeezes them.
    <div
      className="grid grid-cols-1 items-start md:[grid-template-columns:1.4fr_1fr]"
      style={{ gap: "20px" }}
    >
      <PanelShell>
        <HeaderRow label="Weekly briefs" count={briefsQ.isLoading ? null : briefs.length} />
        {briefsQ.isLoading ? (
          <div className="grid gap-2" aria-label="Loading briefs" role="status">
            <SkeletonBar width="96px" height={14} />
            <SkeletonBar width="60%" height={13} />
            <SkeletonBar width="92%" />
          </div>
        ) : briefsQ.error ? (
          <div>
            <MonoLabel style={{ color: "var(--madder)" }}>
              Could not load briefs
            </MonoLabel>
            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
              {(briefsQ.error as Error).message}
            </p>
            <Button
              variant="secondary"
              style={{ marginTop: "12px" }}
              onClick={() => briefsQ.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : briefs.length === 0 ? (
          <p
            style={{ lineHeight: 1.6, color: "var(--text-subtle)", margin: 0 }}
          >
            No briefs yet. One lands here the first Monday after a tracked competitor or platform
            surface actually changes. Nothing to configure by hand.
          </p>
        ) : (
          <div className="grid gap-3.5">
            {(showAllBriefs ? briefs : briefs.slice(0, VISIBLE_BRIEFS)).map((b, i, shown) => (
              <BriefRow key={b.id} brief={b} isLast={i === shown.length - 1} />
            ))}
            {briefs.length > VISIBLE_BRIEFS ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllBriefs((v) => !v)}
                style={{
                  width: "100%",
                  fontWeight: 500,
                }}
              >
                {showAllBriefs
                  ? "Show fewer"
                  : `Show ${briefs.length - VISIBLE_BRIEFS} more briefs`}
              </Button>
            ) : null}
          </div>
        )}
      </PanelShell>

      <PanelShell>
        <HeaderRow label="Tracked entities" count={entitiesQ.isLoading ? null : entities.length} />
        {entitiesQ.isLoading ? (
          <div className="grid gap-2" aria-label="Loading the watch list" role="status">
            <SkeletonBar width="80%" />
            <SkeletonBar width="70%" />
            <SkeletonBar width="75%" />
          </div>
        ) : entitiesQ.error ? (
          <div>
            <MonoLabel style={{ color: "var(--madder)" }}>
              Could not load the watch list
            </MonoLabel>
            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
              {(entitiesQ.error as Error).message}
            </p>
            <Button
              variant="secondary"
              style={{ marginTop: "12px" }}
              onClick={() => entitiesQ.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : entities.length === 0 ? (
          <p
            style={{ lineHeight: 1.6, color: "var(--text-subtle)", margin: 0 }}
          >
            Nothing tracked yet. The watch list seeds itself from your workspace's focus and top
            opportunities. Nothing to add by hand.
          </p>
        ) : (
          <div>
            {(showAllEntities ? entities : entities.slice(0, VISIBLE_ENTITIES)).map(
              (e, i, shown) => (
                <EntityRow key={e.id} entity={e} isLast={i === shown.length - 1} />
              ),
            )}
            {entities.length > VISIBLE_ENTITIES ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllEntities((v) => !v)}
                style={{
                  width: "100%",
                  fontWeight: 500,
                  marginTop: "12px",
                }}
              >
                {showAllEntities
                  ? "Show fewer"
                  : `Show ${entities.length - VISIBLE_ENTITIES} more entities`}
              </Button>
            ) : null}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
