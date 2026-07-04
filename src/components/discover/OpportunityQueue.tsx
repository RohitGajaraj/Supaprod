import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button, MonoLabel } from "@/components/obsidian";
import { LineageDrawer } from "@/components/cadence/LineageDrawer";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import {
  listOpportunities,
  listThemes,
  runCriticReview,
  generatePrd,
  deleteOpportunity,
  updateOpportunity,
} from "@/lib/discovery.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { rescoreNoteOf } from "@/lib/moat-vis";
import { relTimeCaps, verdictFor, withTimeout } from "./format";
import { OpportunityRow, type OpportunityStatus } from "./OpportunityRow";
import { SkeletonBar } from "./SkeletonBar";

const CHALLENGE_TOAST_ID = "obs-discover-challenge";
const CHALLENGE_TOAST_MS = 3600;

export function OpportunityQueue() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { activeProductId } = useWorkspace();
  const fOpps = useServerFn(listOpportunities);
  const fLearnings = useServerFn(listLearnings);
  const fThemes = useServerFn(listThemes);
  const fCritic = useServerFn(runCriticReview);
  const fDraftSpec = useServerFn(generatePrd);
  const fDelete = useServerFn(deleteOpportunity);
  const fUpdate = useServerFn(updateOpportunity);
  // OBS-10: a Set, not a single scalar - every mutation adds its row's id on
  // onMutate and removes it on onSettled, so ANY in-flight mutation on a row
  // keeps that row's actions disabled, and a second row's mutation can never
  // overwrite the first's pending state (adversarial review finding: a shared
  // scalar let one row's menu re-enable mid-flight when a different row's
  // mutation started).
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  const [lineageId, setLineageId] = useState<string | null>(null);

  // withTimeout (audit D-12): a hung server fn rejects into the error state
  // with its retry instead of leaving a permanent skeleton.
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => withTimeout(fOpps()) });
  const learnings = useQuery({
    queryKey: ["learnings"],
    queryFn: () => withTimeout(fLearnings()),
  });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => withTimeout(fThemes({ data: { productId: activeProductId } })),
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
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast("Critic engaged. The teardown lands on Today, receipts attached.", {
        id: CHALLENGE_TOAST_ID,
        duration: CHALLENGE_TOAST_MS,
      });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  // OBS-10: the row write actions ported from the retired /product
  // Opportunities tab (draft spec / lineage / status / delete).
  const draftSpec = useMutation({
    mutationFn: (id: string) => fDraftSpec({ data: { opportunity_id: id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: (r) => {
      toast.success("Spec drafted");
      navigate({ to: "/prds/$id", params: { id: r.prd.id } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast.success("Opportunity deleted");
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OpportunityStatus }) =>
      fUpdate({ data: { id, status } }),
    onMutate: ({ id }) => setBusy(id, true),
    onSuccess: (_r, { status }) => {
      toast.success(`Moved to ${status}`);
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, { id }) => setBusy(id, false),
  });

  if (opps.isLoading) {
    // Loom v4 §9: skeleton rows that match the loaded card layout (ICE
    // numeral block, title line, sub line), shimmering in the raised tone.
    return (
      <div className="grid gap-3" aria-label="Loading opportunities" role="status">
        <HeaderRow rerankedAgo={null} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--top-light), var(--shadow-ambient)",
              padding: "16px 18px",
              gap: "16px",
              height: "62px",
            }}
          >
            <SkeletonBar width="40px" height={22} />
            <div className="grid flex-1 gap-2">
              <SkeletonBar width="55%" height={13} />
              <SkeletonBar width="80%" height={10} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (opps.error) {
    return (
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--top-light), var(--shadow-ambient)",
          padding: "20px",
        }}
      >
        <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
          Could not load opportunities
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          {(opps.error as Error).message}
        </p>
        <Button variant="secondary" style={{ marginTop: "14px" }} onClick={() => opps.refetch()}>
          Retry
        </Button>
        <p style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "6px" }}>
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
        <p
          style={{
            fontSize: "12.5px",
            lineHeight: 1.6,
            color: "var(--text-subtle)",
            margin: 0,
            padding: "0 4px",
          }}
        >
          Nothing ranked yet. Promote a signal from the feed and it lands here, scored.
        </p>
      ) : (
        rows.map((o, i) => {
          const learning = latestLearningByOpp.get(o.id);
          // rescoreNoteOf quote-guards the learning's free-text summary so an
          // arbitrary title can never break the sentence (the garbled
          // "+0.3 after This is an Test Message" bug), and returns null when
          // the score did not actually move at display precision.
          const rescoreNote = learning ? rescoreNoteOf(learning) : null;
          const theme = o.theme_id ? themeById.get(o.theme_id) : undefined;
          const signalPart = theme
            ? `${theme.frequency} signal${theme.frequency === 1 ? "" : "s"}`
            : null;
          const verdict = verdictFor(o);
          const criticPart =
            verdict === "PENDING"
              ? "not yet reviewed by the Critic"
              : `Critic says ${verdict.toLowerCase()}`;
          const sub = [signalPart, criticPart, rescoreNote].filter(Boolean).join(" · ");
          const rowBusy = busyIds.has(o.id);
          return (
            <OpportunityRow
              key={o.id}
              ice={o.ice_score}
              title={o.title}
              sub={sub}
              verdict={verdict}
              hasPencil={i === 0}
              onChallenge={() => challenge.mutate(o.id)}
              challengePending={rowBusy && challenge.isPending}
              actionsPending={rowBusy}
              onDraftSpec={() => draftSpec.mutate(o.id)}
              onLineage={() => setLineageId(o.id)}
              onSetStatus={(status) => setStatus.mutate({ id: o.id, status })}
              onDelete={async () => {
                const ok = await confirm({
                  title: "Delete this opportunity?",
                  body: `This removes "${o.title}" permanently. Its lineage and any linked signals stay, but the opportunity itself is gone.`,
                  destructive: true,
                  confirmLabel: "Delete opportunity",
                });
                if (ok) del.mutate(o.id);
              }}
            />
          );
        })
      )}
      <p style={{ fontSize: "12px", color: "var(--text-subtle)", padding: "0 4px" }}>
        Challenge any bet, even your own. The Critic answers with evidence, never with vibes.
      </p>
      <LineageDrawer
        open={!!lineageId}
        onOpenChange={(open) => !open && setLineageId(null)}
        kind="opportunity"
        id={lineageId}
        title={rows.find((o) => o.id === lineageId)?.title}
      />
    </div>
  );
}

function HeaderRow({ rerankedAgo }: { rerankedAgo: string | null }) {
  return (
    <div className="flex items-baseline" style={{ padding: "0 4px" }}>
      <h2 className="flex-1" style={{ margin: 0, lineHeight: 1 }}>
        <MonoLabel style={{ fontSize: "10.5px", letterSpacing: "0.12em" }}>
          The opportunity queue · strongest bets first
        </MonoLabel>
      </h2>
      {rerankedAgo ? (
        <MonoLabel style={{ fontSize: "10.5px", letterSpacing: "0.08em" }}>
          RE-RANKED {rerankedAgo}
        </MonoLabel>
      ) : null}
    </div>
  );
}
