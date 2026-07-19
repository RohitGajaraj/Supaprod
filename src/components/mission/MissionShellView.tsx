// MissionShellView (front-end reimagining, Phase 2): the room's five regions
// as a pure view, per mockups/_shell-template.html and screen-2.
//
//   1. TopBar     - mark, product switcher, the 4 doors, the needs-you ember
//                   pill (ONE COUNT ONE SOURCE: the caller feeds it from the
//                   shared ["approvals","queue",workspaceId] query), and the
//                   always-visible Ask button with its shortcut.
//   2. Spine      - the whole loop, always (primitive 6.6). An active journey
//                   lights its slice; stages outside it dim but stay present.
//   3. Thread     - the real conversation column: Briefing, inline gates, the
//                   Ask messages (composer/Thread). When the active journey's
//                   slice is done, the handoff suggestion (NextLine) lands
//                   here so the loop never dead-ends.
//   4. Canvas     - the stage's face, provided by the caller.
//   5. Composer   - the real docked Composer: a strip when collapsed, THE
//                   textarea when expanded (Addendum 1.1 rule 4; the caller
//                   guarantees the dock and the overlay never both hold an
//                   input).
//
// Pure on purpose: no router, no queries, no providers - the connected
// MissionShell wires those. This is what the component test renders.
// Ink token vars only; cards are plain ink surfaces (no edge strips).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { Spine, type StageId, type StageLoopState } from "@/components/mission/Spine";
import { Kbd, NextLine, ReceiptLine } from "@/components/mission/primitives";
// Direct imports (not the ./composer barrel): the barrel pulls the connected
// GlobalComposer and its live seams; the pure view must stay provider-free.
import { Composer, type ComposerProps } from "./composer/Composer";
import { Thread, type ThreadProps } from "./composer/Thread";

export type MissionDoorId = "mission" | "approvals" | "brain" | "settings";

const DOORS: { id: MissionDoorId; label: string }[] = [
  { id: "mission", label: "Mission Control" },
  { id: "approvals", label: "Approvals" },
  { id: "brain", label: "Brain" },
  { id: "settings", label: "Settings" },
];

/** The done-journey handoff rendered at the Thread's tail: the plain-words
 *  done state plus the ONE forward door (NextLine grammar). */
export interface JourneyHandoffLine {
  text: string;
  doorLabel: string;
  onGo: () => void;
}

export interface MissionShellViewProps {
  workspaceName: string | null;
  productName: string | null;
  products: { id: string; name: string }[];
  activeProductId: string | null;
  onSelectProduct: (id: string) => void;
  /** The approvals queue length. ONE COUNT ONE SOURCE - never re-derived. */
  queueCount: number;
  onOpenDoor: (door: MissionDoorId) => void;
  stage: StageId;
  onStageSelect: (stage: StageId) => void;
  loopStages: StageLoopState[];
  /** The active journey's slice; stages outside it dim but stay present. */
  journeyStages?: StageId[];
  /** Present when the active journey's slice is done: the forward door. */
  journeyHandoff?: JourneyHandoffLine | null;
  /** The TopBar Ask button: summons the caller's overlay composer. */
  onAsk: () => void;
  /** Opens the Crew drawer (the 13-agent roster in-context). Optional. */
  onOpenCrew?: () => void;
  /** Opens the engine room (off-nav, one click deep). Optional. */
  onOpenEngineRoom?: () => void;
  /** Opens the Artifacts workspace view (what the loop has made). Optional. */
  onOpenArtifacts?: () => void;
  /** The real Thread column (the caller owns the stream + briefing reads). */
  thread: Omit<ThreadProps, "className">;
  /** The real docked Composer (the caller owns draft + expanded state). */
  composer: Omit<ComposerProps, "className">;
  /** The always-on WorkingStrip, rendered just above the Composer. */
  workingStrip?: ReactNode;
  /** Optional backdrop behind the Canvas (the scoped app-idle starfield),
   *  mounted only on a genuinely idle/empty room. */
  canvasBackdrop?: ReactNode;
  /** The stage's face. Owns its own SurfaceHeader (spec 9); the shell frames it. */
  canvas: ReactNode;
  className?: string;
}

/** The needs-you pill: the gate object's TopBar rendering. Hidden at zero. */
function NeedsYouPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      data-testid="needs-you-pill"
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

/** The product switcher: workspace / product, reusing the caller's workspace
 *  data. A plain popover list - no Radix, so the pure view stays test-light. */
function ProductSwitcher({
  workspaceName,
  productName,
  products,
  activeProductId,
  onSelectProduct,
}: Pick<
  MissionShellViewProps,
  "workspaceName" | "productName" | "products" | "activeProductId" | "onSelectProduct"
>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const label = [workspaceName, productName].filter(Boolean).join(" / ") || "Pick a product";

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
                  onSelectProduct(p.id);
                }}
                className="flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs transition-colors hover:bg-[var(--ink-panel)]"
                style={{
                  color: p.id === activeProductId ? "var(--ink-text)" : "var(--ink-body)",
                }}
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

export function MissionShellView({
  workspaceName,
  productName,
  products,
  activeProductId,
  onSelectProduct,
  queueCount,
  onOpenDoor,
  stage,
  onStageSelect,
  loopStages,
  journeyStages,
  journeyHandoff,
  onAsk,
  onOpenCrew,
  onOpenEngineRoom,
  onOpenArtifacts,
  thread,
  composer,
  workingStrip,
  canvasBackdrop,
  canvas,
  className,
}: MissionShellViewProps) {
  return (
    <div
      className={cn("flex h-dvh flex-col", className)}
      style={{ background: "var(--ink-bg)", color: "var(--ink-body)" }}
    >
      {/* Region 1: TopBar. Chrome recedes; exactly 4 destinations. */}
      <header
        data-region="topbar"
        className="flex h-[52px] flex-none items-center gap-4 border-b px-5"
        style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}
      >
        <div className="flex items-center gap-2.5">
          <SupaprodMark size={18} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink-text)" }}>
            Supaprod
          </span>
        </div>
        <span aria-hidden className="h-[18px] w-px" style={{ background: "var(--ink-hairline)" }} />
        <ProductSwitcher
          workspaceName={workspaceName}
          productName={productName}
          products={products}
          activeProductId={activeProductId}
          onSelectProduct={onSelectProduct}
        />
        <nav aria-label="Rooms" className="ml-2 flex items-center gap-0.5">
          {DOORS.map((door) => {
            const isActive = door.id === "mission";
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
          {/* Recessed doors: the crew (roster) and the engine room (off-nav,
              one click deep). Quiet by default; they are depth, not chrome. */}
          {onOpenCrew ? (
            <button
              type="button"
              onClick={onOpenCrew}
              className="ink-focus hidden h-7 items-center rounded-lg px-2 text-[12px] transition-colors hover:bg-[var(--ink-raised)] hover:text-[var(--ink-body)] sm:flex"
              style={{ color: "var(--ink-subtle)" }}
            >
              Crew
            </button>
          ) : null}
          {onOpenEngineRoom ? (
            <button
              type="button"
              onClick={onOpenEngineRoom}
              className="ink-focus hidden h-7 items-center rounded-lg px-2 text-[12px] transition-colors hover:bg-[var(--ink-raised)] hover:text-[var(--ink-body)] sm:flex"
              style={{ color: "var(--ink-subtle)" }}
            >
              Under the hood
            </button>
          ) : null}
          {onOpenArtifacts ? (
            <button
              type="button"
              onClick={onOpenArtifacts}
              className="ink-focus hidden h-7 items-center rounded-lg px-2 text-[12px] transition-colors hover:bg-[var(--ink-raised)] hover:text-[var(--ink-body)] sm:flex"
              style={{ color: "var(--ink-subtle)" }}
            >
              Artifacts
            </button>
          ) : null}
          {/* The always-visible Ask affordance: summons the same composer. */}
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
        </div>
      </header>

      {/* Region 2: the Spine. The whole loop, always; a journey lights its slice. */}
      <div data-region="spine" className="flex-none">
        <Spine states={loopStages} journeyStages={journeyStages} onStageSelect={onStageSelect} />
      </div>

      <div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: "380px minmax(0, 1fr)" }}>
        {/* Region 3: the Thread. Briefing, inline gates, the conversation,
            and the done-journey handoff door - nothing dead-ends. */}
        <aside
          data-region="thread"
          className="flex min-h-0 flex-col border-r"
          style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}
        >
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <Thread {...thread} />
            {journeyHandoff ? (
              <div
                data-testid="journey-handoff"
                className="rounded-[10px] px-3 py-2.5"
                style={{
                  background: "var(--ink-raised)",
                  border: "1px solid var(--ink-hairline-soft)",
                }}
              >
                <ReceiptLine>{journeyHandoff.text}</ReceiptLine>
                <NextLine
                  doors={[{ label: journeyHandoff.doorLabel, onGo: journeyHandoff.onGo }]}
                />
              </div>
            ) : null}
          </div>
        </aside>

        {/* Region 4: the Canvas. One step brighter than chrome. The face owns
            its own SurfaceHeader (spec 9), working triple, and scroll. An
            optional app-idle backdrop sits behind an idle/empty room. */}
        <section
          data-region="canvas"
          className="relative flex min-h-0 min-w-0 flex-col"
          style={{ background: "var(--ink-panel)" }}
        >
          {canvasBackdrop}
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">{canvas}</div>
        </section>
      </div>

      {/* The always-on activity line, just above the one input (spec 6.2). */}
      {workingStrip}

      {/* Region 5: the real docked Composer. Collapsed it is a button strip;
          expanded it is THE input. The caller keeps the overlay and the dock
          from ever both holding an input (one input model per screen). */}
      <div
        data-region="composer"
        className="flex-none border-t px-5 pb-4 pt-3"
        style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}
      >
        <Composer {...composer} />
      </div>
    </div>
  );
}
