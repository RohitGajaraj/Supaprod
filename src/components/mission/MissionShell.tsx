// MissionShell (front-end reimagining, Phase 1): the connected room.
//
// Wires the pure five-region MissionShellView to the live app:
//   - workspace + product data via the SAME useWorkspace hook AppShell uses
//   - the needs-you ember pill on the SAME ["approvals","queue",workspaceId]
//     query key the rail badge / pill / hero already share (ONE COUNT ONE
//     SOURCE, founder ruling 2026-07-18) - never a re-derivation
//   - the Spine fed by getLoopState
//   - Thread receipts from the existing today-lanes read (["today-lanes"]),
//     costs never inline (spec section 7)
//   - both Ask affordances dispatch the shared supaprod:open-ask event, the
//     same door as Cmd+J and the old TopBar
//   - keys 1-7 walk the Spine, shell-local (GotoShortcuts is not mounted on
//     /m, so the digits are free here)
//
// Canvas temp faces: ?stage= renders the EXISTING stage surface where one is
// cleanly importable (Discover, Decide, Plan, Learn); where the old route
// body is not extractable (Design, Build, Ship), an honest "Open the full
// workbench" card links to the existing route. Real CanvasFaces are Phase 3.

import { useEffect, useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { getLoopState } from "@/lib/loop-state.functions";
import { getTodayLanes } from "@/lib/today-lanes.functions";
import { SPINE_STAGES, type StageId, type StageLoopState } from "@/components/mission/Spine";
import { MissionShellView, type MissionDoorId, type ThreadReceipt } from "./MissionShellView";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";
import { OpportunityQueue } from "@/components/discover/OpportunityQueue";
import { PlanSurface } from "@/components/plan/PlanSurface";
import { OutcomesPanel } from "@/components/learn/OutcomesPanel";

/** Poll only while the tab is visible (the AppShell convention). */
function pollWhenVisible(ms: number) {
  return () => (typeof document !== "undefined" && document.hidden ? false : ms);
}

function openAsk() {
  window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
}

/** Honest Phase 1 face for stages whose old route body is not cleanly
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
  onStageChange,
}: {
  productId: string;
  stage: StageId;
  onStageChange: (stage: StageId) => void;
}) {
  const navigate = useNavigate();
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

  const fetchLoop = useServerFn(getLoopState);
  const { data: loopState } = useQuery({
    queryKey: ["loop-state", activeWorkspaceId, productId],
    queryFn: () => fetchLoop({ data: { workspaceId: activeWorkspaceId as string, productId } }),
    enabled: !!activeWorkspaceId,
    refetchInterval: pollWhenVisible(30_000),
  });
  const loopStages: StageLoopState[] = loopState?.stages ?? [];

  // Thread receipts: the existing today-lanes read (same key as /today), the
  // last-24h swarm transitions flattened newest-first. Cost stays quiet.
  const fetchLanes = useServerFn(getTodayLanes);
  const lanesQ = useQuery({ queryKey: ["today-lanes"], queryFn: () => fetchLanes() });
  const receipts: ThreadReceipt[] = useMemo(() => {
    const groups = lanesQ.data?.lane2.groups ?? [];
    const items = groups.flatMap((g) => g.items);
    items.sort((a, b) => b.at.localeCompare(a.at));
    return items.slice(0, 8).map((item) => ({
      id: item.id,
      text: `${item.label} moved to ${item.stage.replace(/_/g, " ")}`,
      actor: item.actor,
      time: new Date(item.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    }));
  }, [lanesQ.data]);

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

  return (
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
      dayLabel={new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      receipts={receipts}
      receiptsLoaded={lanesQ.isSuccess || lanesQ.isError}
      onAsk={openAsk}
      canvasMarker={`${stageMeta.num} ${stageMeta.label}`}
      canvasTitle={activeProduct?.name ?? activeWorkspace?.name ?? "Mission Control"}
      canvas={stageFace(stage)}
    />
  );
}
