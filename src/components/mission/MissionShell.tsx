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

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { useOpenRoom } from "@/hooks/use-open-room";
import { useAskStream } from "@/hooks/use-ask-stream";
import {
  decideApprovalItem,
  getApprovalsQueue,
  sendBackApprovalItem,
  snoozeApprovalItem,
  type ApprovalKind,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { usePrompt } from "@/hooks/use-confirm";
import { getLoopState } from "@/lib/loop-state.functions";
import { getBriefing } from "@/lib/briefing.functions";
import type { JourneyId } from "@/lib/journeys";
import { DESK_COMPOSE_EVENTS, fireDeskCompose } from "@/lib/desk-compose";
import type { PaletteRun } from "@/lib/palette-sections";
import { toast } from "@/lib/notify";
import { SPINE_STAGES, type StageId, type StageLoopState } from "@/components/mission/Spine";
import { MissionShellView, type MissionDoorId } from "./MissionShellView";
import { AccountMenu } from "./AccountMenu";
import { journeyActivation, journeyHandoffFor } from "./journey-wiring";
import { ComposerOverlay } from "./composer/ComposerOverlay";
import { StageCanvasFace, RestFace } from "./faces";
import { ApprovalsTray } from "./ApprovalsTray";
import { WorkingStrip } from "./WorkingStrip";
import { CrewDrawer } from "./CrewDrawer";
import { RoomTour } from "./RoomTour";
import { AppIdleBackdrop } from "./AppIdleBackdrop";
import { useLiveActivity } from "@/components/supaprod/LivePulse";

/** Poll only while the tab is visible (the AppShell convention). */
function pollWhenVisible(ms: number) {
  return () => (typeof document !== "undefined" && document.hidden ? false : ms);
}

/** Which Spine stage a gate family lights (client-safe mirror of
 *  loop-state.functions' GATE_STAGE; that lives in a server module, so the
 *  optimistic signature moment keeps its own copy rather than importing it). */
const GATE_TO_STAGE: Record<ApprovalKind, StageId> = {
  decision: "decide",
  opportunity: "decide",
  assumption_challenge: "decide",
  spec: "plan",
  design_gate: "design",
  tool_call: "build",
  trust_graduation: "build",
  memory_candidate: "learn",
  house_rule: "learn",
  playbook_proposal: "learn",
};

/** The stage's live verb for the optimistic flip (mirrors loop-state's
 *  LIVE_VERB; kept client-side for the same reason). */
const OPTIMISTIC_VERB: Record<StageId, string> = {
  discover: "reading signals",
  decide: "weighing the case",
  plan: "drafting the spec",
  design: "shaping the prototype",
  build: "writing the change",
  ship: "staging the release",
  learn: "reading the results",
};

const FIRST_APPROVAL_KEY = "supaprod:mc:first-approval-seen";
const TOUR_SEEN_KEY = "supaprod:mc:tour-seen";

export function MissionShell({
  productId,
  stage,
  journey,
  trayOpen,
  onTrayChange,
  onStageChange,
  onJourneyChange,
}: {
  productId: string;
  stage?: StageId;
  /** The active journey (URL search), or null. */
  journey: JourneyId | null;
  /** The Approvals tray open state (URL search ?panel=approvals). */
  trayOpen: boolean;
  onTrayChange: (open: boolean) => void;
  onStageChange: (stage: StageId) => void;
  /** One navigation: the journey AND the stage its activation lands on. */
  onJourneyChange: (journey: JourneyId | null, stage?: StageId) => void;
}) {
  const navigate = useNavigate();
  const openRoom = useOpenRoom();
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
  const queueKey = ["approvals", "queue", activeWorkspaceId] as const;
  const loopKey = ["loop-state", activeWorkspaceId, productId] as const;
  const decideMutation = useMutation({
    mutationFn: (vars: { item: ApprovalQueueItem; verdict: "approve" | "reject" }) =>
      decideFn({
        data: { id: vars.item.sourceId, kind: vars.item.kindKey, verdict: vars.verdict },
      }),
    // The signature moment (spec 5.3): apply optimistically so the energy
    // visibly travels within 1s. The gate leaves the queue (its ember clears
    // on the Spine and the pill), and on approve the unblocked stage flips to
    // machine blue with the new verb; the Working strip picks up the change
    // from the same loop-state cache. Rolled back on error.
    onMutate: async (vars) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queueKey }),
        queryClient.cancelQueries({ queryKey: loopKey }),
      ]);
      const prevQueue = queryClient.getQueryData(queueKey);
      const prevLoop = queryClient.getQueryData(loopKey);
      queryClient.setQueryData<{ items: ApprovalQueueItem[] }>(queueKey, (old) =>
        old ? { items: old.items.filter((i) => i.id !== vars.item.id) } : old,
      );
      const flipStage = GATE_TO_STAGE[vars.item.kindKey];
      queryClient.setQueryData<{ stages: StageLoopState[] }>(loopKey, (old) => {
        if (!old) return old;
        return {
          stages: old.stages.map((s) => {
            if (s.stage !== flipStage) return s;
            return vars.verdict === "approve"
              ? { stage: s.stage, state: "active", liveVerb: OPTIMISTIC_VERB[flipStage] }
              : { stage: s.stage, state: "quiet" };
          }),
        };
      });
      // First approval ever, once per user: the one Pixel caption (spec 5.3).
      if (
        vars.verdict === "approve" &&
        typeof window !== "undefined" &&
        !window.localStorage.getItem(FIRST_APPROVAL_KEY)
      ) {
        window.localStorage.setItem(FIRST_APPROVAL_KEY, "1");
        toast("That approval just set agents in motion.");
      }
      return { prevQueue, prevLoop };
    },
    onError: (_e, _vars, ctx) => {
      const c = ctx as { prevQueue?: unknown; prevLoop?: unknown } | undefined;
      if (c?.prevQueue !== undefined) queryClient.setQueryData(queueKey, c.prevQueue);
      if (c?.prevLoop !== undefined) queryClient.setQueryData(loopKey, c.prevLoop);
      toast("That decision did not save. Try again.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["loop-state"] });
    },
  });

  // Snooze (tray H): defer a gate. Optimistically leaves the queue (its ember
  // clears on the Spine and the pill); it resurfaces on its own at snoozed_until.
  // The backend lands at the Gate-2 merge, so a real error surfaces honestly.
  const snoozeFn = useServerFn(snoozeApprovalItem);
  const snoozeMutation = useMutation({
    mutationFn: (item: ApprovalQueueItem) =>
      snoozeFn({ data: { id: item.sourceId, kind: item.kindKey } }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queueKey });
      const prevQueue = queryClient.getQueryData(queueKey);
      queryClient.setQueryData<{ items: ApprovalQueueItem[] }>(queueKey, (old) =>
        old ? { items: old.items.filter((i) => i.id !== item.id) } : old,
      );
      return { prevQueue };
    },
    onError: (_e, _item, ctx) => {
      const c = ctx as { prevQueue?: unknown } | undefined;
      if (c?.prevQueue !== undefined) queryClient.setQueryData(queueKey, c.prevQueue);
      toast("Snooze is not live yet. It turns on with the next release.");
    },
    onSuccess: () => toast("Snoozed. It will resurface with tomorrow's briefing."),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["loop-state"] });
    },
  });

  // Send back (tray 2): return a revisable gate (spec, design gate) to draft
  // WITH the operator's note, so the agent continues the same thread knowing
  // what to fix. Optimistically leaves the queue; the note table lands at the
  // Gate-2 merge, so a real error surfaces honestly (never a faked success).
  const prompt = usePrompt();
  const sendBackFn = useServerFn(sendBackApprovalItem);
  const sendBackMutation = useMutation({
    mutationFn: (vars: { item: ApprovalQueueItem; note: string }) =>
      sendBackFn({ data: { id: vars.item.sourceId, kind: vars.item.kindKey, note: vars.note } }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: queueKey });
      const prevQueue = queryClient.getQueryData(queueKey);
      queryClient.setQueryData<{ items: ApprovalQueueItem[] }>(queueKey, (old) =>
        old ? { items: old.items.filter((i) => i.id !== vars.item.id) } : old,
      );
      return { prevQueue };
    },
    onError: (_e, _vars, ctx) => {
      const c = ctx as { prevQueue?: unknown } | undefined;
      if (c?.prevQueue !== undefined) queryClient.setQueryData(queueKey, c.prevQueue);
      toast("Send back turns on with the next release.");
    },
    onSuccess: () => toast("Sent back with your note. The agent will revise it."),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["loop-state"] });
    },
  });

  const handleSendBack = async (item: ApprovalQueueItem) => {
    const note = await prompt({
      title: "Send back with a note",
      body: "Tell the agent what to change. The spec returns to draft and picks up your note.",
      placeholder: "What should change before this comes back?",
      confirmLabel: "Send back",
    });
    if (note && note.trim()) sendBackMutation.mutate({ item, note: note.trim() });
  };

  const fetchLoop = useServerFn(getLoopState);
  const { data: loopState } = useQuery({
    queryKey: ["loop-state", activeWorkspaceId, productId],
    queryFn: () => fetchLoop({ data: { workspaceId: activeWorkspaceId as string, productId } }),
    enabled: !!activeWorkspaceId,
    refetchInterval: pollWhenVisible(30_000),
  });
  const loopStages: StageLoopState[] = loopState?.stages ?? [];

  // The shared live-activity read (one poll for the whole app): feeds the
  // Working strip's one live locus so it and the top-bar ticker never disagree.
  const live = useLiveActivity();

  // The tray's focused item id, held here so J/K survive a queue refetch.
  const [trayFocusedId, setTrayFocusedId] = useState<string | null>(null);

  // The Crew drawer (the roster in-context); the engine room is a route.
  const [crewOpen, setCrewOpen] = useState(false);

  // The opt-in guided tour of the room anatomy (charter #10). First-run offers
  // it once, remembered in localStorage; it never nags and is skippable.
  const [tourOpen, setTourOpen] = useState(false);
  const [offerTour, setOfferTour] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(TOUR_SEEN_KEY)) setOfferTour(true);
  }, []);
  const dismissTourOffer = () => {
    setOfferTour(false);
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      // localStorage unavailable (private mode): the offer just won't persist.
    }
  };

  // The app-idle starfield is scoped to a genuinely empty/idle room only
  // (LOCKED): every stage quiet or inferred, nothing active, nothing waiting.
  const roomIsIdle =
    loopStages.length > 0 && loopStages.every((s) => s.state === "quiet" || s.state === "inferred");

  // Clicking a gate node on the Spine opens that gate in the tray (spec 6.6:
  // "clicking it opens that gate card, not a dashboard"); every other stage
  // just moves the Canvas.
  const handleStageSelect = (next: StageId) => {
    const node = loopStages.find((s) => s.stage === next);
    onStageChange(next);
    if (node?.state === "gate") onTrayChange(true);
  };

  const currentLoop: StageLoopState = loopStages.find((s) => s.stage === (stage ?? "discover")) ?? {
    stage: stage ?? "discover",
    state: "quiet",
  };

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
  // GlobalComposer stands down on the room's routes, so the room owns these
  // keys here), and the
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
        // Keep the room's search state (stage, journey, panel). Navigating without
        // it silently reset the room to the rest face, so clicking the already
        // active Mission Control door threw away where you were.
        openRoom(productId, { search: (prev) => prev });
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
          openRoom(id);
        }}
        queueCount={queueCount}
        onOpenDoor={onOpenDoor}
        stage={stage}
        onStageSelect={handleStageSelect}
        loopStages={loopStages}
        journeyStages={journeyStages}
        journeyHandoff={journeyHandoff}
        onAsk={() => {
          setOverlayOpen(true);
          setComposerExpanded(false);
        }}
        onOpenCrew={() => setCrewOpen(true)}
        onOpenEngineRoom={() => void navigate({ to: "/engine-room" })}
        onOpenArtifacts={() => void navigate({ to: "/artifacts" })}
        onOpenThreads={() => void navigate({ to: "/threads" })}
        // The account control, restored: identity, workspace switch, profile,
        // plan, credits, sign out. Same component RoomTopBar renders, so the
        // loop room and the config rooms cannot drift apart.
        accountMenu={<AccountMenu />}
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
        workingStrip={
          <WorkingStrip
            loopStages={loopStages}
            waitingCount={queueCount}
            liveAction={live.state === "working" ? live.action : null}
            seed={productId}
            onOpenApprovals={() => onTrayChange(true)}
            onOpenStage={handleStageSelect}
          />
        }
        canvasBackdrop={roomIsIdle ? <AppIdleBackdrop /> : null}
        canvas={
          stage ? (
            <StageCanvasFace
              stage={stage}
              productId={productId}
              workspaceId={activeWorkspaceId ?? null}
              loop={currentLoop}
              onActivateJourney={activateJourney}
            />
          ) : (
            <RestFace
              productId={productId}
              workspaceId={activeWorkspaceId ?? null}
              productName={activeProduct?.name ?? null}
              loopStages={loopStages}
              onActivateJourney={activateJourney}
              onOpenStage={handleStageSelect}
            />
          )
        }
      />
      <ComposerOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        {...composerSurface}
      />
      <ApprovalsTray
        open={trayOpen}
        onClose={() => onTrayChange(false)}
        items={threadGates}
        focusedId={trayFocusedId}
        onFocusChange={setTrayFocusedId}
        onDecide={(item, verdict) => decideMutation.mutate({ item, verdict })}
        onOpenEvidence={(item) => {
          onStageChange(GATE_TO_STAGE[item.kindKey]);
          onTrayChange(false);
        }}
        onSnooze={(item) => snoozeMutation.mutate(item)}
        onSendBack={(item) => void handleSendBack(item)}
      />
      <CrewDrawer open={crewOpen} onClose={() => setCrewOpen(false)} />
      {offerTour && !tourOpen ? (
        <div
          data-testid="tour-offer"
          className="fixed bottom-5 left-5 z-40 w-[300px] rounded-xl border p-3.5 shadow-2xl"
          style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)" }}
        >
          <p className="text-[12.5px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>
            New here? Take a 20-second tour of the room.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                dismissTourOffer();
                setTourOpen(true);
              }}
              className="ink-focus inline-flex h-8 items-center rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]"
              style={{
                background: "var(--ink-panel)",
                borderColor: "var(--ink-hairline)",
                color: "var(--ink-text)",
              }}
            >
              Start tour
            </button>
            <button
              type="button"
              onClick={dismissTourOffer}
              className="ink-focus inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] transition-colors hover:bg-[var(--ink-panel)]"
              style={{ color: "var(--ink-subtle)" }}
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
      <RoomTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
