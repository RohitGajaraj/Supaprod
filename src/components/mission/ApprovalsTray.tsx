// ApprovalsTray (front-end reimagining, Phase 3): the right slide-over that
// is the single pull point in the room (spec 6.3, journey J-GATES).
//
// One object, three renderings (the ember GateChip): the Spine node, the tray
// card here, and the evidence face are the same gate with one count from one
// source. Approving from any of them clears all of them, so this reads the
// SAME ["approvals","queue",workspaceId] query the pill, Spine, and Thread
// read, and decides through the SAME decideApprovalItem seam.
//
// Keyboard (Linear-trained, so PMs arrive knowing it): J/K (or arrows)
// traverse, 1 approves, 2 sends back (revisable families only), 3 declines,
// H snoozes, Enter opens the evidence, Escape closes.
//
// Verb honesty (claim never outruns wiring): decideApprovalItem performs the
// two per-family verdicts, approve and decline (decline's meaning is per
// family: a spec returns to draft, an opportunity drops). "Send back" (verb 2)
// is a DISTINCT resolver (sendBackApprovalItem): it returns a revisable gate -
// a spec, a design gate - to its draft/revision state WITH the operator's note,
// so it renders only on those families, never on binary gates. "Send back" and
// "Snooze" (verb H) both persist through tables that land at the Gate-2 merge;
// until then the shell's mutation surfaces an honest "turns on with the next
// release" message rather than faking success. The signature moment (deciding
// visibly advances the room) is choreographed by the shell that owns the
// optimistic mutation, not here.

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { GateChip, Kbd } from "@/components/mission/primitives";
import { isRevisableKind, type ApprovalQueueItem } from "@/lib/approvals-queue.functions";

export interface ApprovalsTrayProps {
  open: boolean;
  onClose: () => void;
  /** The queue items to decide, already scoped by the caller (one source). */
  items: ApprovalQueueItem[];
  /** The focused item id; the caller owns it so J/K survive a refetch. */
  focusedId: string | null;
  onFocusChange: (id: string | null) => void;
  /** The real decide seam. The caller runs it optimistically for the
   *  signature moment (the spine flips within 1s). */
  onDecide: (item: ApprovalQueueItem, verdict: "approve" | "reject") => void;
  /** Opens the item's evidence: expands it into the Canvas (spec 6.3). */
  onOpenEvidence?: (item: ApprovalQueueItem) => void;
  /** Send back (2): returns a REVISABLE gate (spec, design gate) to draft with
   *  a note. Renders only on revisable items; the backend lands at Gate-2. */
  onSendBack?: (item: ApprovalQueueItem) => void;
  /** Snooze (H): defers the item with a resurface time. Founder-authorized;
   *  the backend lands at the Gate-2 merge. Omitted, the verb does not render. */
  onSnooze?: (item: ApprovalQueueItem) => void;
  loading?: boolean;
}

/** The mono agent name a gate's recommendation is attributed to, drawn from
 *  the item's project/kind. The queue does not carry an agent slug, so the
 *  attribution atom is omitted rather than guessed (grayscale honesty). */
function firstEvidence(item: ApprovalQueueItem): string {
  return item.evidence[0] ?? "Waiting on your call.";
}

export function ApprovalsTray({
  open,
  onClose,
  items,
  focusedId,
  onFocusChange,
  onDecide,
  onOpenEvidence,
  onSendBack,
  onSnooze,
  loading,
}: ApprovalsTrayProps) {
  const focusedIndex = items.findIndex((i) => i.id === focusedId);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Keep a valid focus target whenever the list changes under us.
  useEffect(() => {
    if (!open) return;
    if (items.length === 0) {
      if (focusedId !== null) onFocusChange(null);
      return;
    }
    if (!items.some((i) => i.id === focusedId)) onFocusChange(items[0].id);
  }, [open, items, focusedId, onFocusChange]);

  // The tray owns its keys only while open, and never while typing.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) return;
      const key = e.key.toLowerCase();
      if (key === "escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (items.length === 0) return;
      const idx = items.findIndex((i) => i.id === focusedId);
      const cur = idx >= 0 ? idx : 0;
      if (key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        onFocusChange(items[Math.min(items.length - 1, cur + 1)].id);
      } else if (key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        onFocusChange(items[Math.max(0, cur - 1)].id);
      } else if (key === "1") {
        e.preventDefault();
        if (items[cur]) onDecide(items[cur], "approve");
      } else if (key === "2" && onSendBack) {
        e.preventDefault();
        if (items[cur] && isRevisableKind(items[cur].kindKey)) onSendBack(items[cur]);
      } else if (key === "3") {
        e.preventDefault();
        if (items[cur]) onDecide(items[cur], "reject");
      } else if (key === "h" && onSnooze) {
        e.preventDefault();
        if (items[cur]) onSnooze(items[cur]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[cur]) onOpenEvidence?.(items[cur]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, focusedId, onFocusChange, onDecide, onOpenEvidence, onSendBack, onSnooze, onClose]);

  // Scroll the focused card into view as J/K walks the list.
  useEffect(() => {
    if (!open || !focusedId) return;
    panelRef.current
      ?.querySelector(`[data-tray-item="${focusedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, focusedId]);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40">
          {/* Scrim: a click outside closes. No blur (liquid glass is retired). */}
          <div
            onClick={onClose}
            className="mc-tray-scrim absolute inset-0"
            style={{ background: "rgba(0,0,0,0.4)" }}
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Waiting on you"
            data-testid="approvals-tray"
            data-state="open"
            className={cn(
              "mc-tray-panel absolute right-0 top-0 flex h-full w-[420px] max-w-[92vw] flex-col border-l shadow-2xl",
            )}
            style={{ background: "var(--ink-panel)", borderColor: "var(--ink-hairline)" }}
          >
            <header
              className="flex flex-none items-center gap-2.5 border-b px-4 py-3"
              style={{ borderColor: "var(--ink-hairline)" }}
            >
              <span className="text-[13px] font-semibold" style={{ color: "var(--ink-text)" }}>
                Waiting on you
              </span>
              {items.length > 0 ? (
                <span
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-lg border px-1 font-mono text-[10px] tabular-nums"
                  style={{
                    color: "var(--chip-fg)",
                    background: "var(--chip-faint)",
                    borderColor: "var(--chip-border)",
                  }}
                >
                  {items.length}
                </span>
              ) : null}
              {items.length > 0 && focusedIndex >= 0 ? (
                <span
                  className="font-mono text-[11px] tabular-nums"
                  style={{ color: "var(--ink-faint)" }}
                >
                  {focusedIndex + 1} of {items.length}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ink-focus ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--ink-raised)]"
                style={{ color: "var(--ink-subtle)" }}
              >
                {"✕"}
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
              {loading ? (
                <>
                  <div className="ink-skeleton h-32 w-full rounded-xl" />
                  <div className="ink-skeleton h-32 w-full rounded-xl" />
                </>
              ) : items.length === 0 ? (
                <div
                  className="rounded-xl border border-dashed px-6 py-8 text-center"
                  style={{ borderColor: "var(--ink-hairline)" }}
                >
                  <p className="text-[13px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
                    Nothing needs you. The Chief of Staff will bring the next call here.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    data-tray-item={item.id}
                    onMouseEnter={() => onFocusChange(item.id)}
                    className={cn(
                      "rounded-xl transition-[box-shadow] duration-150",
                      item.id === focusedId &&
                        "ring-1 ring-[var(--voice-human-border)] ring-offset-2 ring-offset-[var(--ink-panel)]",
                    )}
                  >
                    <GateChip
                      headline={item.title}
                      recommendation={firstEvidence(item)}
                      receipts={
                        item.project
                          ? [
                              {
                                label: item.project,
                                onOpen: onOpenEvidence ? () => onOpenEvidence(item) : undefined,
                              },
                            ]
                          : undefined
                      }
                      consequence={item.approveConsequence}
                      onApprove={() => onDecide(item, "approve")}
                      onDecline={() => onDecide(item, "reject")}
                      onSendBack={
                        onSendBack && isRevisableKind(item.kindKey)
                          ? () => onSendBack(item)
                          : undefined
                      }
                      onSnooze={onSnooze ? () => onSnooze(item) : undefined}
                      onOpenEvidence={onOpenEvidence ? () => onOpenEvidence(item) : undefined}
                    />
                  </div>
                ))
              )}
            </div>

            {items.length > 0 ? (
              <footer
                className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1.5 border-t px-4 py-2.5"
                style={{ borderColor: "var(--ink-hairline)" }}
              >
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  <Kbd>1</Kbd> Approve
                </span>
                {onSendBack && focusedIndex >= 0 && isRevisableKind(items[focusedIndex].kindKey) ? (
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--ink-subtle)" }}
                  >
                    <Kbd>2</Kbd> Send back
                  </span>
                ) : null}
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  <Kbd>3</Kbd> Decline
                </span>
                {onSnooze ? (
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--ink-subtle)" }}
                  >
                    <Kbd>H</Kbd> Snooze
                  </span>
                ) : null}
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd> Move
                </span>
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--ink-subtle)" }}
                >
                  <Kbd>{"⏎"}</Kbd> Evidence
                </span>
                <span className="ml-auto text-[11px]" style={{ color: "var(--ink-faint)" }}>
                  Decided here is kept on record in Brain.
                </span>
              </footer>
            ) : null}
          </aside>
          <style>{`
            @keyframes mcTrayScrim { from { opacity: 0; } to { opacity: 1; } }
            @keyframes mcTrayPanel { from { transform: translateX(100%); } to { transform: translateX(0); } }
            .mc-tray-scrim { animation: mcTrayScrim 150ms ease; }
            .mc-tray-panel { animation: mcTrayPanel 150ms cubic-bezier(0.23,1,0.3,1); }
            @media (prefers-reduced-motion: reduce) {
              .mc-tray-scrim, .mc-tray-panel { animation: none; }
            }
          `}</style>
        </div>
      ) : null}
    </>
  );
}
