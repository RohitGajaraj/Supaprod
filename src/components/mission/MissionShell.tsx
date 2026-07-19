// MissionShell (front-end reimagining, Phase 2): the connected room.
//
// Wires the pure five-region MissionShellView to the live app:
//   - workspace + product data via the SAME useWorkspace hook AppShell uses
//   - the needs-you ember pill on the SAME ["approvals","queue",workspaceId]
//     query key the rail badge / pill / hero already share (ONE COUNT ONE
//     SOURCE, founder ruling 2026-07-18) - never a re-derivation
//   - the Spine fed by getLoopState; an active journey lights its slice
//   - the Thread fed by getBriefing + the product-filtered approvals slice +
//     the useAskStream conversation (the /api/chat SSE contract, per-product
//     thread persistence); costs never inline (spec section 7)
//   - the Composer: ONE input model per screen. The docked strip expands into
//     THE textarea, the summon keys (Cmd/Ctrl+J and Cmd/Ctrl+K) and the
//     supaprod:open-ask event open the centered ComposerOverlay instead, and
//     the dock collapses while the overlay is open. Mic dictation appends
//     into the shared draft; read-aloud rides the Thread messages.
//   - journeys: a chip activation records the journey (URL search, so the
//     lit slice survives reload and deep links) and moves the Canvas to the
//     journey's first stage. When the slice reads done, the Thread renders
//     the typed handoff door (NextLine) to the suggested next journey.
//   - keys 1-7 walk the Spine, shell-local (GotoShortcuts is not mounted on
//     /m, so the digits are free here)
//
// Canvas temp faces: ?stage= renders the EXISTING stage surface where one is
// cleanly importable (Discover, Decide, Plan, Learn); where the old route
// body is not extractable (Design, Build, Ship), an honest "Open the full
// workbench" card links to the existing route. Real CanvasFaces are Phase 3.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAskStream } from "@/hooks/use-ask-stream";
import {
  decideApprovalItem,
  getApprovalsQueue,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { getLoopState } from "@/lib/loop-state.functions";
import { getBriefing } from "@/lib/briefing.functions";
import type { JourneyId } from "@/lib/journeys";
import { DESK_COMPOSE_EVENTS, fireDeskCompose } from "@/lib/desk-compose";
import type { PaletteRun } from "@/lib/palette-sections";
import { toast } from "@/lib/notify";
import { SPINE_STAGES, type StageId, type StageLoopState } from "@/components/mission/Spine";
import { MissionShellView, type MissionDoorId } from "./MissionShellView";
import { journeyActivation, journeyHandoffFor } from "./journey-wiring";
import { ComposerOverlay } from "./composer/ComposerOverlay";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";
import { OpportunityQueue } from "@/components/discover/OpportunityQueue";
import { PlanSurface } from "@/components/plan/PlanSurface";
import { OutcomesPanel } from "@/components/learn/OutcomesPanel";

/** Poll only while the tab is visible (the AppShell convention). */
function pollWhenVisible(ms: number) {
  return () => (typeof document !== "undefined" && document.hidden ? false : ms);
}

/** Honest Phase 2 face for stages whose old route body is not cleanly
 *  importable: name the workbench, link the door, promise nothing else. */
function OpenWorkbenchCard({ label, to }: { label: string; to: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        className="w-full max-w-[420px] rounded-xl border p-6 text-center"
        style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-raised)" }}
      >
        <div className="text-sm font-semibold" style={{ color: "var(--ink-text)" }}>
          {label} works in its full workbench.
        </div>
        <p className="mt-2 text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
          This stage has not moved into Mission Control yet. Everything is live in the existing
          workbench.
        </p>
        <div className="mt-4 inline-flex">
          <Link
            to={to}
            className="ink-focus inline-flex h-8 items-center gap-[7px] whitespace-nowrap rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]"
            style={{
              background: "var(--ink-panel)",
              borderColor: "var(--ink-hairline)",
              color: "var(--ink-text)",
            }}
          >
            Open the full workbench
          </Link>
        </div>
      </div>
    </div>
  );
}

/** The stage's temp Canvas face. Wrapped in the room's panel padding where the
 *  legacy surface expects a page body. */
function stageFace(stage: StageId): ReactNode {
  switch (stage) {
    case "discover":
      return <DiscoverSurface />;
    case "decide":
      return <OpportunityQueue />;
    case "plan":
      return <PlanSurface />;
    case "design":
      return <OpenWorkbenchCard label="Design" to="/design" />;
    case "build":
      return <OpenWorkbenchCard label="Build" to="/build" />;
    case "ship":
      return <OpenWorkbenchCard label="Ship" to="/ship" />;
    case "learn":
      return <div className="p-6">{<OutcomesPanel />}</div>;
  }
}

export function MissionShell({
  productId,
  stage,
  journey,
  onStageChange,
  onJourneyChange,
}: {
  productId: string;
  stage: StageId;
  /** The active journey (URL search), or null. */
  journey: JourneyId | null;
  onStageChange: (stage: StageId) => void;
  /** One navigation: the journey AND the stage its activation lands on. */
  onJourneyChange: (journey: JourneyId | null, stage?: StageId) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    activeWorkspaceId,
    activeWorkspace,
    products,
    activeProductId,
    setActiveProductId,
    isLoading,
  } = useWorkspace();

  // Keep the workspace context pointed at the routed product, so every
  // workspace-scoped read below (and inside the faces) is scoped right.
  useEffect(() => {
    if (productId && productId !== activeProductId && products.some((p) => p.id === productId)) {
      setActiveProductId(productId);
    }
  }, [productId, activeProductId, products, setActiveProductId]);

  // ONE COUNT ONE SOURCE: the exact key AppShell / Today / /approvals share.
  const fetchQueue = useServerFn(getApprovalsQueue);
  const { data: approvalsQueue } = useQuery({
    queryKey: ["approvals", "queue", activeWorkspaceId],
    queryFn: () => fetchQueue({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    refetchInterval: pollWhenVisible(30_000),
  });
  const queueCount = approvalsQueue?.items.length ?? 0;

  // The Thread's inline gates: the same queue, product-filtered the same way
  // getLoopState and the briefing filter (workspace-wide gates stay).
  const threadGates = useMemo<ApprovalQueueItem[]>(() => {
    const items = approvalsQueue?.items ?? [];
    return items.filter((item) => !item.projectId || item.projectId === productId);
  }, [approvalsQueue, productId]);

  const decideFn = useServerFn(decideApprovalItem);
  const decideMutation = useMutation({
    mutationFn: (vars: { item: ApprovalQueueItem; verdict: "approve" | "reject" }) =>
      decideFn({
        data: { id: vars.item.sourceId, kind: vars.item.kindKey, verdict: vars.verdict },
      }),
    onError: () => toast("That decision did not save. Try again."),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["loop-state"] });
    },
  });

  const fetchLoop = useServerFn(getLoopState);
  const { data: loopState } = useQuery({
    queryKey: ["loop-state", activeWorkspaceId, productId],
    queryFn: () => fetchLoop({ data: { workspaceId: activeWorkspaceId as string, productId } }),
    enabled: !!activeWorkspaceId,
    refetchInterval: pollWhenVisible(30_000),
  });
  const loopStages: StageLoopState[] = loopState?.stages ?? [];

  // The Briefing: machine-authored receipts prose (composition over the same
  // reads the pill and the Spine use; honest zero state; no cost figures).
  const fetchBriefing = useServerFn(getBriefing);
  const briefingQ = useQuery({
    queryKey: ["briefing", activeWorkspaceId, productId],
    queryFn: () => fetchBriefing({ data: { workspaceId: activeWorkspaceId as string, productId } }),
    enabled: !!activeWorkspaceId,
    refetchInterval: pollWhenVisible(60_000),
  });

  // The conversation: the extracted AskPanel machinery, thread keyed to THIS
  // product. Dictation appends into the shared draft (mic survives).
  const [draft, setDraft] = useState("");
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const ask = useAskStream({
    productId,
    onDictation: (text) => setDraft((d) => (d ? `${d} ${text}` : text)),
  });

  // Journey activation: one navigation carries the journey and its first
  // stage; the composer closes so the lit slice and the Canvas move read.
  const activateJourney = (id: JourneyId) => {
    const { stage: firstStage } = journeyActivation(id);
    setOverlayOpen(false);
    setComposerExpanded(false);
    onJourneyChange(id, firstStage);
  };

  const journeyStages = journey ? journeyActivation(journey).slice : undefined;
  const journeyHandoff = journey ? journeyHandoffFor(journey, loopStages, activateJourney) : null;

  const submitIntent = (text: string) => {
    ask.sendIntent(text);
    // The answer streams into the Thread column; the overlay would cover it.
    setOverlayOpen(false);
  };

  // Jump / Act / Catalog rows keep the command palette's exact run semantics.
  const runPaletteRow = (run: PaletteRun) => {
    setOverlayOpen(false);
    setComposerExpanded(false);
    if (run.event) {
      if (DESK_COMPOSE_EVENTS.includes(run.event)) {
        fireDeskCompose(run.event);
        void navigate({ to: run.to, search: run.search as never });
        return;
      }
      if (run.event === "supaprod:open-ask") {
        // In the room, Ask IS the composer: just hand the input back.
        setComposerExpanded(true);
        return;
      }
      window.dispatchEvent(new CustomEvent(run.event, { detail: {} }));
      if (run.event === "supaprod:focus-compose") return;
      void navigate({ to: run.to, search: run.search as never });
      return;
    }
    void navigate({ to: run.to, search: run.search as never });
  };

  // The summon: Cmd/Ctrl+J and Cmd/Ctrl+K open the ONE overlay (the global
  // GlobalComposer stays off /m/*, so the room owns these keys here), and the
  // shared supaprod:open-ask event lands here too. An event that carries an
  // intent streams it straight into the Thread instead of opening the box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (key === "j" || key === "k")) {
        e.preventDefault();
        setOverlayOpen((v) => !v);
        setComposerExpanded(false);
      }
    };
    const onOpenAsk = (e: Event) => {
      const intent = (e as CustomEvent<{ intent?: string }>).detail?.intent?.trim();
      if (intent) {
        ask.sendIntent(intent);
        setOverlayOpen(false);
      } else {
        setOverlayOpen(true);
        setComposerExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("supaprod:open-ask", onOpenAsk);
    window.addEventListener("supaprod:open-cmdk", onOpenAsk);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("supaprod:open-ask", onOpenAsk);
      window.removeEventListener("supaprod:open-cmdk", onOpenAsk);
    };
  }, [ask.sendIntent]);

  // Keys 1-7 walk the Spine. Shell-local; same guards as the old app's
  // GotoShortcuts (never while typing, never under an open dialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        document.querySelector(
          '[role="dialog"][data-state="open"], [role="dialog"][aria-modal="true"]',
        )
      )
        return;
      const idx = Number(e.key) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < SPINE_STAGES.length && e.key.length === 1) {
        e.preventDefault();
        onStageChange(SPINE_STAGES[idx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStageChange]);

  const activeProduct = products.find((p) => p.id === productId) ?? null;
  const stageMeta = SPINE_STAGES.find((s) => s.id === stage) ?? SPINE_STAGES[0];

  // A routed product that is not in this workspace (stale link, switched
  // workspace): say so plainly, never render someone else's room.
  if (!isLoading && products.length > 0 && !activeProduct) {
    return (
      <div
        className="flex h-dvh flex-col items-center justify-center gap-3 p-8 text-center"
        style={{ background: "var(--ink-bg)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--ink-body)" }}>
          This product is not in the active workspace.
        </p>
        <Link
          to="/m"
          className="ink-focus inline-flex h-8 items-center rounded-lg border px-3 text-[12.5px] font-medium"
          style={{
            background: "var(--ink-raised)",
            borderColor: "var(--ink-hairline)",
            color: "var(--ink-text)",
          }}
        >
          Back to Mission Control
        </Link>
      </div>
    );
  }

  const onOpenDoor = (door: MissionDoorId) => {
    switch (door) {
      case "mission":
        void navigate({ to: "/m/$productId", params: { productId } });
        break;
      case "approvals":
        void navigate({ to: "/approvals" });
        break;
      case "brain":
        void navigate({ to: "/brain" });
        break;
      case "settings":
        void navigate({ to: "/settings" });
        break;
    }
  };

  const dayLabel =
    briefingQ.data?.dayLabel ??
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // One input model: the dock never expands while the overlay is open.
  const composerSurface = {
    draft,
    onDraftChange: setDraft,
    onSubmitIntent: submitIntent,
    onActivateJourney: activateJourney,
    onRun: runPaletteRow,
    streaming: ask.streaming,
    dictation: ask.dictation,
  };

  return (
    <>
      <MissionShellView
        workspaceName={activeWorkspace?.name ?? null}
        productName={activeProduct?.name ?? null}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        activeProductId={productId}
        onSelectProduct={(id) => {
          setActiveProductId(id);
          void navigate({ to: "/m/$productId", params: { productId: id } });
        }}
        queueCount={queueCount}
        onOpenDoor={onOpenDoor}
        stage={stage}
        onStageSelect={onStageChange}
        loopStages={loopStages}
        journeyStages={journeyStages}
        journeyHandoff={journeyHandoff}
        onAsk={() => {
          setOverlayOpen(true);
          setComposerExpanded(false);
        }}
        thread={{
          dayLabel,
          briefing: briefingQ.data ?? null,
          briefingLoaded: briefingQ.isSuccess || briefingQ.isError,
          gates: threadGates,
          onDecideGate: (item, verdict) => decideMutation.mutate({ item, verdict }),
          onOpenApprovals: () => void navigate({ to: "/approvals" }),
          messages: ask.messages,
          streaming: ask.streaming,
          liveStatus: ask.liveStatus,
          promotedByMsg: ask.promotedByMsg,
          onPromote: ask.promote,
          onRetry: ask.retry,
          readAloud: ask.readAloud,
        }}
        composer={{
          ...composerSurface,
          expanded: composerExpanded && !overlayOpen,
          onExpandedChange: setComposerExpanded,
        }}
        canvasMarker={`${stageMeta.num} ${stageMeta.label}`}
        canvasTitle={activeProduct?.name ?? activeWorkspace?.name ?? "Mission Control"}
        canvas={stageFace(stage)}
      />
      <ComposerOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        {...composerSurface}
      />
    </>
  );
}
