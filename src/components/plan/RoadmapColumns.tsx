import { useState, useMemo, type CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
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
import { Actions, Button, Empty, Failed, Num } from "@/components/shell/primitives";

/** The three columns, in plain words. NOW used to be printed in ember: ember
 *  marks the human and the one thing waiting on you, never a column heading, so
 *  the board is monochrome and the count carries the weight. */
const COLUMNS: { key: RoadmapBucket; label: string }[] = [
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "later", label: "Later" },
];

// Anti-scroll (founder ruling 2026-07-06): each column shows its top few and
// expands independently, same idiom as SignalFeed/AutoClustered.
const VISIBLE_ITEMS = 5;

/** The board scrolls INSIDE ITS OWN BOX rather than making the page scroll
 *  sideways: horizontal scrolling on the page was named twice as a pain point.
 *  The track is intrinsically responsive (auto-fit, not a breakpoint), so it
 *  answers to the width of the region it is dropped into rather than to the
 *  width of the window, and it only ever scrolls when three columns genuinely
 *  cannot fit. */
const BOARD_SCROLLER: CSSProperties = { overflowX: "auto" };
const BOARD_TRACK: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "var(--sp-space-4)",
};

/**
 * The outcome-declared Now/Next/Later board. Backlog items (`bucket: null`) are
 * out of this surface's scope and stay invisible here.
 *
 * It draws no heading and no card of its own: the section holding it is already
 * titled and is the one bordered container in the region.
 *
 * Editing the outcome of an ALREADY-committed bet goes through the same
 * governed `commitRoadmapItem` path (bucket stays put, outcome+measure get
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

  // Re-declare outcome+measure for a bet already sitting in a bucket, the same
  // governed write as `commit` above, but the bucket is the bet's current one
  // (not forced to "now"), so it never re-homes a bet for an edit.
  const editOutcome = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket; outcome: string; measure: string }) =>
      fCommit({ data: { id: v.id, bucket: v.bucket, outcome: v.outcome, measure: v.measure } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Outcome saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Bulk re-prioritize the selected set into one bucket, lenient like the drag
  // move (place-first; per-item outcome+measure governance still applies and the
  // gap surface flags what moved without one).
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
      <div role="status" style={BOARD_SCROLLER}>
        <span className="sr-only">Reading the roadmap.</span>
        <div style={BOARD_TRACK} aria-hidden="true">
          {COLUMNS.map((c) => (
            <div key={c.key} style={{ minWidth: 0 }}>
              <div
                style={{
                  height: 10,
                  width: 72,
                  marginBottom: "var(--sp-space-3)",
                  borderRadius: "var(--sp-radius-xs)",
                  background: "var(--sp-lift)",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  minHeight: 132,
                  borderRadius: "var(--sp-radius-card)",
                  background: "var(--sp-sink)",
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // A read that failed is not an empty state. "Nothing is committed" and "we
  // could not find out" are different facts and a person acts differently on each.
  if (roadmap.isError) {
    return (
      <Failed onRetry={() => void roadmap.refetch()}>
        {(roadmap.error as Error)?.message ?? "The roadmap did not load."}
      </Failed>
    );
  }

  if (items.length === 0) {
    return <Empty>No bets on the roadmap yet. Commit a ranked opportunity from Discover.</Empty>;
  }

  return (
    <>
      {/* The bulk bar appears only once a set is selected (calm front), and it is
          a line of actions rather than a panel: a card here would be a card
          inside the section's card. */}
      {selectedIds.size > 0 && (
        <Actions
          trailing={
            <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          }
        >
          <span style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
            <Num>{selectedIds.size}</Num> selected, move to
          </span>
          {COLUMNS.map((col) => (
            <Button
              key={col.key}
              disabled={bulkMove.isPending}
              onClick={() => bulkMove.mutate({ ids: [...selectedIds], bucket: col.key })}
            >
              {col.label}
            </Button>
          ))}
        </Actions>
      )}
      <div style={BOARD_SCROLLER}>
        <div style={BOARD_TRACK}>
          {COLUMNS.map((col) => {
            const colItems = itemsByBucket.get(col.key) ?? [];
            const expanded = expandedCols.has(col.key);
            const shownItems = expanded ? colItems : colItems.slice(0, VISIBLE_ITEMS);
            return (
              <div key={col.key} style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "var(--sp-space-2)",
                    marginBottom: "var(--sp-space-3)",
                    paddingBottom: "var(--sp-space-2)",
                    borderBottom: "1px solid var(--sp-line-soft)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--sp-text-label)",
                      fontWeight: "var(--sp-weight-strong)",
                      color: "var(--sp-ink)",
                    }}
                  >
                    {col.label}
                  </span>
                  <Num>{colItems.length}</Num>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--sp-space-3)",
                  }}
                >
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
                      rewindPending={
                        rewind.isPending && rewind.variables?.opportunity_id === item.id
                      }
                    />
                  ))}
                  {colItems.length > VISIBLE_ITEMS ? (
                    <Button variant="ghost" onClick={() => toggleExpanded(col.key)}>
                      {expanded ? "Show fewer" : `Show ${colItems.length - VISIBLE_ITEMS} more`}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
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
