// RoomChrome (front-end reimagining): the reimagined room shell for the
// config/aux surfaces that are NOT the loop room itself - Settings, Brain,
// Approvals. screen-7 shows Settings wearing the same room TopBar (mark,
// product switcher, the four doors with the needs-you pill, Ask) with the
// Spine/Thread/Composer dropped, because "Settings is a configuration room,
// not the loop". This gives those surfaces the room's coherent chrome instead
// of bouncing back to the retired Obsidian AppShell (the 10-rail).
//
// RoomTopBar is the shared TopBar (activeDoor parameterizes which door is lit).
// RoomChromeShell is the connected wrapper: it reads the same useWorkspace +
// ["approvals","queue",workspaceId] query the room uses (ONE COUNT ONE SOURCE),
// wires the doors to navigation, and frames the surface's own content.
//
// Ink tokens only. No new backend. onAsk dispatches supaprod:open-ask, which
// the mounted GlobalComposer answers on these surfaces (it self-excludes only
// inside /m/$productId).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { Kbd } from "@/components/mission/primitives";
import { AccountMenu } from "@/components/mission/AccountMenu";
import { useWorkspace } from "@/hooks/use-workspace";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";

export type RoomDoorId = "mission" | "approvals" | "brain" | "settings";

const DOORS: { id: RoomDoorId; label: string }[] = [
  { id: "mission", label: "Mission Control" },
  { id: "approvals", label: "Approvals" },
  { id: "brain", label: "Brain" },
  { id: "settings", label: "Settings" },
];

/** The needs-you pill: the gate count on the Approvals door. Hidden at zero. */
function NeedsYouPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex h-4 min-w-4 items-center justify-center rounded-lg border px-1 font-mono text-[10px] tabular-nums"
      style={{
        color: "var(--chip-fg)",
        background: "var(--chip-faint)",
        borderColor: "var(--chip-border)",
      }}
    >
      {count}
    </span>
  );
}

/** Workspace / product switcher (plain popover; no Radix, matches the room). */
function ProductSwitcher() {
  const { workspaces, activeWorkspace, products, activeProductId, setActiveProductId } =
    useWorkspace();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const productName = products.find((p) => p.id === activeProductId)?.name ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const label =
    [activeWorkspace?.name ?? workspaces[0]?.name ?? null, productName]
      .filter(Boolean)
      .join(" / ") || "Pick a product";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ink-focus flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors hover:bg-[var(--ink-raised)]"
        style={{ color: "var(--ink-body)" }}
      >
        {label}
        <span aria-hidden className="text-[9px]" style={{ color: "var(--ink-faint)" }}>
          {"▾"}
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Products"
          className="absolute left-0 top-8 z-50 min-w-[200px] rounded-lg border p-1"
          style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)" }}
        >
          {products.length === 0 ? (
            <div className="px-2.5 py-1.5 text-xs" style={{ color: "var(--ink-subtle)" }}>
              No products here yet.
            </div>
          ) : (
            products.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={p.id === activeProductId}
                onClick={() => {
                  setOpen(false);
                  setActiveProductId(p.id);
                }}
                className="flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs transition-colors hover:bg-[var(--ink-panel)]"
                style={{ color: p.id === activeProductId ? "var(--ink-text)" : "var(--ink-body)" }}
              >
                {p.name}
                {p.id === activeProductId ? (
                  <span aria-hidden className="ml-auto text-[10px]">
                    {"✓"}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/** The shared room TopBar. `activeDoor` lights the current destination. */
export function RoomTopBar({
  activeDoor,
  queueCount,
  onOpenDoor,
  onAsk,
}: {
  activeDoor: RoomDoorId;
  queueCount: number;
  onOpenDoor: (door: RoomDoorId) => void;
  onAsk: () => void;
}) {
  return (
    <header
      data-region="topbar"
      className="flex h-[52px] flex-none items-center gap-4 border-b px-5"
      style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}
    >
      {/* The brand lockup is the way home. It used to be an inert div, so the
          only route back to Mission Control was the browser back button pressed
          however many times you had navigated. Every product puts home behind
          the logo; people try it first and it has to work. */}
      <button
        type="button"
        onClick={() => onOpenDoor("mission")}
        aria-label="Mission Control, home"
        title="Mission Control"
        className="flex items-center rounded-[4px] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1"
        style={{ color: "var(--ink-text)" }}
      >
        <SupaprodWordmark size={18} textSize={13} gap={10} />
      </button>
      <span aria-hidden className="h-[18px] w-px" style={{ background: "var(--ink-hairline)" }} />
      <ProductSwitcher />
      <nav aria-label="Rooms" className="ml-2 flex items-center gap-0.5">
        {DOORS.map((door) => {
          const isActive = door.id === activeDoor;
          return (
            <button
              key={door.id}
              type="button"
              data-door={door.id}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onOpenDoor(door.id)}
              className={cn(
                "ink-focus flex h-[30px] items-center gap-1.5 rounded-lg px-3 text-[12.5px] transition-colors",
                isActive
                  ? "bg-[var(--ink-raised)] text-[var(--ink-text)]"
                  : "text-[var(--ink-subtle)] hover:bg-[var(--ink-raised)] hover:text-[var(--ink-body)]",
              )}
            >
              {door.label}
              {door.id === "approvals" ? <NeedsYouPill count={queueCount} /> : null}
            </button>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Ask Supaprod"
          onClick={onAsk}
          className="ink-focus flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors hover:bg-[#202024]"
          style={{
            background: "var(--ink-raised)",
            borderColor: "var(--ink-hairline)",
            color: "var(--ink-text)",
          }}
        >
          Ask <Kbd>{"⌘J"}</Kbd>
        </button>
        {/* The account layer. It was stranded in the retired AppShell rail
            when the room chrome replaced that shell, which left no sign out,
            no workspace switch, and no identity anywhere on these surfaces.
            Same component as the loop room's TopBar so the two cannot drift. */}
        <AccountMenu />
      </div>
    </header>
  );
}

/** Poll only while the tab is visible (the room convention). */
function pollWhenVisible(ms: number) {
  return () => (typeof document !== "undefined" && document.hidden ? false : ms);
}

/**
 * The connected chrome shell for a config/aux surface. Renders the room
 * TopBar (with `activeDoor` lit) above the surface's own content, all on the
 * ink canvas. The content area scrolls; the TopBar stays.
 */
export function RoomChromeShell({
  activeDoor,
  children,
  contentClassName,
}: {
  activeDoor: RoomDoorId;
  children: ReactNode;
  contentClassName?: string;
}) {
  const navigate = useNavigate();
  const { activeWorkspaceId, activeProductId } = useWorkspace();
  const fetchQueue = useServerFn(getApprovalsQueue);
  const { data: queue } = useQuery({
    queryKey: ["approvals", "queue", activeWorkspaceId],
    queryFn: () => fetchQueue({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    refetchInterval: pollWhenVisible(30_000),
  });
  const queueCount = queue?.items.length ?? 0;

  const onOpenDoor = (door: RoomDoorId) => {
    switch (door) {
      case "mission":
        if (activeProductId) {
          // Carry the room's search state across. validateSearch on the route
          // drops anything that is not a real stage/journey/panel, so arriving
          // from a legacy surface stays safe.
          void navigate({
            to: "/m/$productId",
            params: { productId: activeProductId },
            search: (prev) => prev,
          });
        } else {
          void navigate({ to: "/m" });
        }
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
    <div
      className="flex h-dvh flex-col"
      style={{ background: "var(--ink-bg)", color: "var(--ink-body)" }}
    >
      <RoomTopBar
        activeDoor={activeDoor}
        queueCount={queueCount}
        onOpenDoor={onOpenDoor}
        onAsk={() => window.dispatchEvent(new CustomEvent("supaprod:open-ask"))}
      />
      <div className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>{children}</div>
    </div>
  );
}
