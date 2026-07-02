import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button, MonoLabel } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import { listOpportunities, listThemes, runCriticReview } from "@/lib/discovery.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { relTimeCaps, verdictFor } from "./format";
import { OpportunityRow } from "./OpportunityRow";

const CHALLENGE_TOAST_ID = "obs-discover-challenge";
const CHALLENGE_TOAST_MS = 3600;

export function OpportunityQueue() {
  const qc = useQueryClient();
  const { activeProductId } = useWorkspace();
  const fOpps = useServerFn(listOpportunities);
  const fLearnings = useServerFn(listLearnings);
  const fThemes = useServerFn(listThemes);
  const fCritic = useServerFn(runCriticReview);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => fOpps() });
  const learnings = useQuery({ queryKey: ["learnings"], queryFn: () => fLearnings() });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => fThemes({ data: { productId: activeProductId } }),
  });

  const themeById = useMemo(() => {
    const map = new Map<string, { frequency: number }>();
    for (const t of themes.data?.themes ?? []) map.set(t.id, { frequency: t.frequency });
    return map;
  }, [themes.data]);

  const latestLearningByOpp = useMemo(() => {
    const map = new Map<string, (typeof rows)[number]>();
    const rows = learnings.data?.learnings ?? [];
    for (const l of rows) {
      if (!l.opportunity_id) continue;
      const prev = map.get(l.opportunity_id);
      if (!prev || new Date(l.created_at) > new Date(prev.created_at)) {
        map.set(l.opportunity_id, l);
      }
    }
    return map;
  }, [learnings.data]);

  const lastRescoreAgo = useMemo(() => {
    const rows = learnings.data?.learnings ?? [];
    if (rows.length === 0) return null;
    const newest = rows.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));
    return relTimeCaps(newest.created_at);
  }, [learnings.data]);

  const challenge = useMutation({
    mutationFn: (id: string) =>
      fCritic({ data: { target_kind: "opportunity" as const, target_id: id } }),
    onMutate: (id) => setPendingId(id),
    onSuccess: () => {
      toast("Critic engaged. The teardown lands on Today, receipts attached.", {
        id: CHALLENGE_TOAST_ID,
        duration: CHALLENGE_TOAST_MS,
      });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setPendingId(null),
  });

  if (opps.isLoading) {
    return (
      <div className="grid gap-3">
        <HeaderRow rerankedAgo={null} />
        <MonoLabel tone="faint" style={{ fontSize: "9px", padding: "0 4px" }}>
          Ranking opportunities
        </MonoLabel>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#111113",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "var(--radius-card)",
              padding: "16px 18px",
              height: "62px",
            }}
          />
        ))}
      </div>
    );
  }

  if (opps.error) {
    return (
      <div
        style={{
          backgroundColor: "#111113",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-card)",
          padding: "20px",
        }}
      >
        <MonoLabel tone="madder" style={{ fontSize: "9px" }}>
          Could not load opportunities
        </MonoLabel>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
          {(opps.error as Error).message}
        </p>
        <Button variant="secondary" style={{ marginTop: "14px" }} onClick={() => opps.refetch()}>
          Retry
        </Button>
        <p
          style={{ fontSize: "var(--text-helper)", color: "var(--text-subtle)", marginTop: "6px" }}
        >
          Reloads the queue
        </p>
      </div>
    );
  }

  const rows = [...(opps.data?.opportunities ?? [])].sort((a, b) => b.ice_score - a.ice_score);

  return (
    <div className="grid gap-3">
      <HeaderRow rerankedAgo={lastRescoreAgo} />
      {rows.length === 0 ? (
        <MonoLabel tone="faint" style={{ fontSize: "11.5px", padding: "0 4px" }}>
          Nothing ranked yet.
        </MonoLabel>
      ) : (
        rows.map((o, i) => {
          const learning = latestLearningByOpp.get(o.id);
          const rescoreNote =
            learning && learning.prior_ice != null && learning.new_ice != null
              ? ` · ${Number(learning.new_ice) >= Number(learning.prior_ice) ? "+" : ""}${(Number(learning.new_ice) - Number(learning.prior_ice)).toFixed(1)} after ${learning.summary ?? "the latest learning"}`
              : "";
          const theme = o.theme_id ? themeById.get(o.theme_id) : undefined;
          const signalPart = theme
            ? `${theme.frequency} signal${theme.frequency === 1 ? "" : "s"}`
            : null;
          const verdict = verdictFor(o);
          const criticPart =
            verdict === "PENDING"
              ? "not yet reviewed by the Critic"
              : `Critic says ${verdict.toLowerCase()}`;
          const sub = `${[signalPart, criticPart].filter(Boolean).join(" · ")}${rescoreNote}`;
          return (
            <OpportunityRow
              key={o.id}
              ice={o.ice_score}
              title={o.title}
              sub={sub}
              verdict={verdict}
              hasPencil={i === 0}
              onChallenge={() => challenge.mutate(o.id)}
              challengePending={pendingId === o.id && challenge.isPending}
            />
          );
        })
      )}
      <p style={{ fontSize: "11.5px", color: "var(--text-faint)", padding: "0 4px" }}>
        Challenge any bet, even your own. The Critic answers with evidence, never with vibes.
      </p>
    </div>
  );
}

function HeaderRow({ rerankedAgo }: { rerankedAgo: string | null }) {
  return (
    <div className="flex items-baseline" style={{ padding: "0 4px" }}>
      <span className="flex-1">
        <MonoLabel style={{ fontSize: "9px", letterSpacing: "0.12em" }}>
          The opportunity queue · ranked by ICE
        </MonoLabel>
      </span>
      {rerankedAgo ? (
        <MonoLabel tone="faint" style={{ fontSize: "9px", letterSpacing: "0.08em" }}>
          RE-RANKED {rerankedAgo}
        </MonoLabel>
      ) : null}
    </div>
  );
}
