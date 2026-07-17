import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { MonoLabel } from "@/components/obsidian";
import {
  getRoadmap,
  updateRoadmapItem,
  commitRoadmapItem,
  bulkUpdateRoadmapItems,
  type RoadmapItem,
  type RoadmapBucket,
} from "@/lib/roadmap.functions";
import { isCommitmentGoverned } from "@/lib/roadmap-governance";
import { stripAutoPrefix } from "./format";
import { BetCard } from "./BetCard";
import { revertRoadmapItemToPrevious } from "@/lib/artifact-rewind.functions";
import { CommitCeremony, type CommitCeremonyBet } from "./CommitCeremony";

const COLUMNS: { key: RoadmapBucket; label: string; color: string }[] = [
  { key: "now", label: "NOW", color: "var(--ember)" },
  { key: "next", label: "NEXT", color: "var(--text-primary)" },
  { key: "later", label: "LATER", color: "var(--text-muted)" },
];

// Anti-scroll (founder ruling 2026-07-06): each column shows its top few and
// expands independently, same idiom as SignalFeed/AutoClustered.
const VISIBLE_ITEMS = 5;

/**
 * OBS-07 §5 step 4: the outcome-declared Now/Next/Later board. Backlog items
 * (`bucket: null`) are out of this surface's scope (§13) and stay invisible
 * here.
 *
 * OBS-10 (final closure): write parity with the now-retired parchment
 * `RoadmapBoard` (deleted). Editing the outcome of an ALREADY-committed bet
 * goes through the same governed `commitRoadmapItem` path the retired
 * board's inline editor used (bucket stays put, outcome+measure get
 * re-declared), and a multi-select bulk re-prioritize bar calls
 * `bulkUpdateRoadmapItems`.
 */
export function RoadmapColumns() {
  const qc = useQueryClient();
  const fRoadmap = useServerFn(getRoadmap);
  const fUpdate = useServerFn(updateRoadmapItem);
  const fCommit = useServerFn(commitRoadmapItem);
  const fBulk = useServerFn(bulkUpdateRoadmapItems);
  const fRewind = useServerFn(revertRoadmapItemToPrevious);
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => fRoadmap() });
  const [ceremonyBet, setCeremonyBet] = useState<CommitCeremonyBet | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // One toggle per column (Now/Next/Later are independent lists).
  const [expandedCols, setExpandedCols] = useState<Set<RoadmapBucket>>(new Set());
  const toggleExpanded = (key: RoadmapBucket) =>
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleSelect = (id: string, on: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const move = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket }) =>
      fUpdate({ data: { id: v.id, bucket: v.bucket } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success(`Moved to ${v.bucket === "next" ? "Next" : "Later"}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // PC-10: one-key rewind of the last placement change (agent roadmap.move or a
  // human move/commit). The button only shows when hasSnapshot is true.
  const rewind = useMutation({
    mutationFn: (v: { opportunity_id: string }) => fRewind({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Reverted to the previous placement. The change is on the Trust Ledger.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commit = useMutation({
    mutationFn: (v: { id: string; outcome: string; measure: string }) =>
      fCommit({ data: { id: v.id, bucket: "now", outcome: v.outcome, measure: v.measure } }),
    onSuccess: () => {
      setCeremonyBet(null);
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Committed to Now. The team builds this next.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // OBS-10: re-declare outcome+measure for a bet already sitting in a bucket,
  // the same governed write as `commit` above, but the bucket is the bet's
  // current one (not forced to "now"), so it never re-homes a bet for an edit.
  const editOutcome = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket; outcome: string; measure: string }) =>
      fCommit({ data: { id: v.id, bucket: v.bucket, outcome: v.outcome, measure: v.measure } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Outcome saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // OBS-10: bulk re-prioritize the selected set into one bucket, lenient like
  // the drag move (place-first; per-item outcome+measure governance still
  // applies and the gap surface flags what moved without one).
  const bulkMove = useMutation({
    mutationFn: (v: { ids: string[]; bucket: RoadmapBucket }) =>
      fBulk({ data: { ids: v.ids, bucket: v.bucket } }),
    onSuccess: (res) => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success(
        res.moved > 0
          ? `Moved ${res.moved}${res.skipped ? ` · ${res.skipped} unchanged` : ""}.`
          : "Nothing to move.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleMove = (item: RoadmapItem, bucket: RoadmapBucket) => {
    if (bucket === "now") {
      setCeremonyBet({
        id: item.id,
        title: stripAutoPrefix(item.title),
        outcome: item.outcome,
        measure: item.measure,
      });
      return;
    }
    move.mutate({ id: item.id, bucket });
  };

  // Hooks must run unconditionally before the isLoading/isError early
  // returns below, or the hook count changes between the loading and
  // loaded renders and React throws "Rendered more hooks than during the
  // previous render." (found + fixed 2026-07-11).
  const items = (roadmap.data?.items ?? []).filter(
    (i): i is RoadmapItem & { bucket: RoadmapBucket } => i.bucket !== null,
  );

  // Memoize bucket grouping so we don't re-filter/sort on every render (e.g., when selectedIds changes).
  // Maps each column key to its sorted items, computed once per items change.
  const itemsByBucket = useMemo(() => {
    const grouped = new Map<RoadmapBucket, RoadmapItem[]>();
    for (const col of COLUMNS) grouped.set(col.key, []);
    for (const item of items) {
      grouped.get(item.bucket)?.push(item);
    }
    for (const arr of grouped.values()) {
      arr.sort((a, b) => (b.ice_score ?? 0) - (a.ice_score ?? 0));
    }
    return grouped;
  }, [items]);

  if (roadmap.isLoading) {
    return (
      <div
        role="status"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <span className="sr-only">Loading the roadmap…</span>
        {COLUMNS.map((c) => (
          <div key={c.key} aria-hidden="true">
            <div
              style={{
                height: 10,
                width: 72,
                marginBottom: 10,
                borderRadius: 4,
                backgroundImage: "var(--shimmer-gradient)",
                backgroundSize: "280% 100%",
                animation: "cadShimmer 5s linear infinite",
                opacity: 0.35,
              }}
            />
            <div
              style={{
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--hairline)",
                boxShadow: "var(--top-light)",
                minHeight: 132,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (roadmap.isError) {
    return (
      <div
        style={{
          padding: 24,
          background: "var(--surface-card-deep)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD PLAN
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          {(roadmap.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => roadmap.refetch()}
          className="loom-press outline-none transition-colors hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-body)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads the surface
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p
        style={{
          fontSize: 12,
          color: "var(--text-subtle)",
          margin: 0,
          padding: "8px 0",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
        }}
      >
        No bets on the roadmap yet. Commit a ranked opportunity from Discover.
      </p>
    );
  }

  return (
    <>
      {/* OBS-10: bulk re-prioritize bar, appears only once a set is selected (calm front). */}
      {selectedIds.size > 0 && (
        <div
          className="material-base"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          <MonoLabel tone="muted">{selectedIds.size} selected</MonoLabel>
          <span style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
            <MonoLabel tone="faint">move to</MonoLabel>
            {COLUMNS.map((col) => (
              <button
                key={col.key}
                type="button"
                disabled={bulkMove.isPending}
                onClick={() => bulkMove.mutate({ ids: [...selectedIds], bucket: col.key })}
                className="loom-press"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-label)",
                  letterSpacing: "0.11em",
                  textTransform: "uppercase",
                  color: col.color,
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-control)",
                  padding: "3px 10px",
                  background: "transparent",
                  cursor: bulkMove.isPending ? "default" : "pointer",
                  opacity: bulkMove.isPending ? 0.5 : 1,
                }}
              >
                {col.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="loom-press"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-label)",
                letterSpacing: "0.11em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              clear
            </button>
          </span>
        </div>
      )}
      {/* Columns wrap below ~780px content width so 768 stays readable
          (three crushed 200px columns fail the responsive pass).
          Responsive: 1 column mobile (<640px), 2 tablet (640-1024), 3 desktop (≥1024). */}
      <div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {COLUMNS.map((col) => {
          const colItems = itemsByBucket.get(col.key) ?? [];
          const expanded = expandedCols.has(col.key);
          const shownItems = expanded ? colItems : colItems.slice(0, VISIBLE_ITEMS);
          return (
            <div key={col.key}>
              <MonoLabel style={{ color: col.color, marginBottom: 10, display: "block" }}>
                {col.label} · {colItems.length}
              </MonoLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {shownItems.map((item) => (
                  <BetCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    measure={item.measure}
                    outcome={item.outcome}
                    column={col.key}
                    iceScore={item.ice_score}
                    hasOutcome={isCommitmentGoverned(item)}
                    updatedAt={item.updated_at}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={(on) => toggleSelect(item.id, on)}
                    onMoveTo={(bucket) => handleMove(item, bucket)}
                    onEditOutcome={(values) =>
                      editOutcome.mutate({ id: item.id, bucket: col.key, ...values })
                    }
                    editPending={editOutcome.isPending && editOutcome.variables?.id === item.id}
                    canRewind={item.hasSnapshot}
                    onRewind={() => rewind.mutate({ opportunity_id: item.id })}
                    rewindPending={rewind.isPending && rewind.variables?.opportunity_id === item.id}
                  />
                ))}
                {colItems.length > VISIBLE_ITEMS ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(col.key)}
                    className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: "var(--text-muted)",
                      background: "transparent",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--radius-control)",
                      padding: "8px 14px",
                    }}
                  >
                    {expanded ? "Show fewer" : `Show ${colItems.length - VISIBLE_ITEMS} more`}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {ceremonyBet && (
        <CommitCeremony
          bet={ceremonyBet}
          pending={commit.isPending}
          onCancel={() => setCeremonyBet(null)}
          onConfirm={(values) => commit.mutate({ id: ceremonyBet.id, ...values })}
        />
      )}
    </>
  );
}
