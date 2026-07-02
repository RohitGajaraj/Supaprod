import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { MonoLabel } from "@/components/obsidian";
import {
  getRoadmap,
  updateRoadmapItem,
  commitRoadmapItem,
  type RoadmapItem,
  type RoadmapBucket,
} from "@/lib/roadmap.functions";
import { isCommitmentGoverned } from "@/lib/roadmap-governance";
import { BetCard } from "./BetCard";
import { CommitCeremony, type CommitCeremonyBet } from "./CommitCeremony";

const COLUMNS: { key: RoadmapBucket; label: string; color: string }[] = [
  { key: "now", label: "NOW", color: "var(--ember)" },
  { key: "next", label: "NEXT", color: "var(--text-primary)" },
  { key: "later", label: "LATER", color: "var(--text-muted)" },
];

/**
 * OBS-07 §5 step 4: the outcome-declared Now/Next/Later board. Shares the
 * exact `["roadmap"]` query key + `commitRoadmapItem`/`updateRoadmapItem`
 * server fns with the still-live parchment `RoadmapBoard`, so the two never
 * diverge. Backlog items (`bucket: null`) are out of this surface's scope
 * (§13) and stay invisible here.
 */
export function RoadmapColumns() {
  const qc = useQueryClient();
  const fRoadmap = useServerFn(getRoadmap);
  const fUpdate = useServerFn(updateRoadmapItem);
  const fCommit = useServerFn(commitRoadmapItem);
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => fRoadmap() });
  const [ceremonyBet, setCeremonyBet] = useState<CommitCeremonyBet | null>(null);

  const move = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket }) =>
      fUpdate({ data: { id: v.id, bucket: v.bucket } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success(`Moved to ${v.bucket === "next" ? "Next" : "Later"}.`);
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

  const handleMove = (item: RoadmapItem, bucket: RoadmapBucket) => {
    if (bucket === "now") {
      setCeremonyBet({
        id: item.id,
        title: item.title,
        outcome: item.outcome,
        measure: item.measure,
      });
      return;
    }
    move.mutate({ id: item.id, bucket });
  };

  if (roadmap.isLoading) {
    return (
      <div
        role="status"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
      >
        <span className="sr-only">Loading the roadmap…</span>
        {COLUMNS.map((c) => (
          <div
            key={c.key}
            aria-hidden="true"
            style={{
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--hairline)",
              minHeight: 160,
            }}
          />
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
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
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

  const items = (roadmap.data?.items ?? []).filter(
    (i): i is RoadmapItem & { bucket: RoadmapBucket } => i.bucket !== null,
  );

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          No bets on the roadmap yet. Commit a ranked opportunity from Discover and give it an
          outcome · about a minute.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {COLUMNS.map((col) => {
          const colItems = items
            .filter((i) => i.bucket === col.key)
            .sort((a, b) => (b.ice_score ?? 0) - (a.ice_score ?? 0));
          return (
            <div key={col.key}>
              <MonoLabel style={{ color: col.color, marginBottom: 10, display: "block" }}>
                {col.label} · {colItems.length}
              </MonoLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {colItems.map((item) => (
                  <BetCard
                    key={item.id}
                    title={item.title}
                    measure={item.measure}
                    outcome={item.outcome}
                    column={col.key}
                    iceScore={item.ice_score}
                    hasOutcome={isCommitmentGoverned(item)}
                    onMoveTo={(bucket) => handleMove(item, bucket)}
                  />
                ))}
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
