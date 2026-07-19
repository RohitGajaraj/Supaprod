// CanvasFace (front-end reimagining, Phase 3): the one contract every Mission
// Control canvas face implements (design-language-spec section 9).
//
// The Canvas is 60%+ of the room; the artifact IS the progress bar. This
// wrapper is what makes all seven faces consistent by construction, so the
// spec's "consistency reads as calm" holds without each face re-deriving the
// anatomy. Every face renders through it and supplies:
//
//   1. SurfaceHeader (6.1) - identical anatomy: stage marker, title, agent
//      attribution atom, typed state chip, deep link, kebab to Details. The
//      shell no longer renders its own header; the face owns the whole thing,
//      because a face knows its own state, agent, and artifact and the shell
//      does not.
//   2. The working triple (spec 9.2) whenever the stage is running: the
//      decomposed plan with the current step highlighted, what the agent is
//      reading (sources), and the live line. This is also the re-entry view.
//   3. Designed loading / empty / error states (never a blank, never a bare
//      "No results"): loading is a calm skeleton, empty is a WarmSlot, error
//      is the blocked ReceiptLine shape (plain reason + recovery verb).
//
// ReceiptLine + NextLine on finished artifacts and the three-fidelity object
// rendering live in each face's body (they are per-artifact, not per-face).
// Costs never render here or in the header; they live behind the kebab
// Details (spec 7).

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SurfaceHeader, type SurfaceHeaderState } from "@/components/mission/primitives/SurfaceHeader";
import { PulseLine } from "@/components/mission/primitives/PulseLine";
import { WarmSlot, type WarmSlotLine } from "@/components/mission/primitives/WarmSlot";
import { ReceiptLine } from "@/components/mission/primitives/ReceiptLine";
import type { MissionStateId } from "@/lib/mission-vocabulary";

/** One step in the decomposed plan: the working triple's first leg. */
export interface FaceStep {
  label: string;
  state: "done" | "active" | "queued";
}

/** The working triple (spec 9.2): plan + what it is reading + the live line. */
export interface FaceWorking {
  agentSlug: string;
  /** The decomposed plan with the current step highlighted. */
  steps?: FaceStep[];
  /** What the agent is reading right now (sources). */
  reading?: string[];
  /** The live present-progressive line (PulseLine register), lowercase predicate. */
  line: string;
  /** Honest time only: an estimate, elapsed, or "Nearly done". Never a fake countdown. */
  time?: string;
  streaming?: boolean;
}

export interface CanvasFaceProps {
  /** Mono stage marker, "05 Build". */
  stageMarker: string;
  /** The artifact or face name (prose). */
  title: string;
  /** Set when the surface content is machine-authored: renders the attribution atom. */
  agentSlug?: string | null;
  /** Typed mission-state (spec 6.1); omit for the static state. */
  state?: MissionStateId | SurfaceHeaderState;
  /** Stable deep link for this face; renders the copy action. */
  deepLink?: string;
  /** Opens the kebab Details (cost, driver, trace links live here, spec 7). */
  onDetails?: () => void;
  /** Extra header actions, rendered before the deep-link/kebab cluster. */
  headerActions?: ReactNode;
  /** The working triple, rendered above the body while the stage runs. */
  working?: FaceWorking | null;
  /** Calm skeleton instead of the body. */
  loading?: boolean;
  /** The blocked shape (plain reason + recovery verb): the only error UI outside the Engine Room. */
  error?: { message: string; actionLabel?: string; onAction?: () => void } | null;
  /** When the face has no real content and is not loading/error, this WarmSlot renders. */
  emptyLine?: WarmSlotLine | null;
  /** The face's own content. Rendered when present and not loading/error. */
  children?: ReactNode;
  className?: string;
}

/** The plan breadcrumb: the decomposed steps with the current one highlighted. */
function FacePlan({ steps }: { steps: FaceStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
      {steps.map((step, i) => (
        <li key={`${step.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? (
            <span aria-hidden className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
              {"→"}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10.5px] tracking-[0.02em]",
            )}
            style={{
              color:
                step.state === "active"
                  ? "var(--voice-machine)"
                  : step.state === "done"
                    ? "var(--ink-subtle)"
                    : "var(--ink-faint)",
            }}
          >
            <span
              aria-hidden
              className="tabular-nums"
              style={{ color: "var(--ink-faint)" }}
            >
              {i + 1}
            </span>
            {step.label}
            {step.state === "done" ? (
              <span aria-hidden style={{ color: "var(--verdict-pass)" }}>
                {"✓"}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The working triple region, spec 9.2. Rendered under the header while a
 *  stage runs, and on re-entry (returning to a room lands here, never on chat
 *  scrollback). */
function WorkingTriple({ working }: { working: FaceWorking }) {
  return (
    <div
      data-testid="working-triple"
      className="flex flex-col gap-2.5 border-b px-5 py-3"
      style={{ borderColor: "var(--ink-hairline-soft)", background: "var(--ink-bg)" }}
    >
      {working.steps && working.steps.length > 0 ? <FacePlan steps={working.steps} /> : null}
      {working.reading && working.reading.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-faint)" }}
          >
            Reading now
          </span>
          {working.reading.map((src) => (
            <span
              key={src}
              className="rounded-[5px] border px-[7px] py-[2px] font-mono text-[10px] tracking-[0.02em]"
              style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-subtle)" }}
            >
              {src}
            </span>
          ))}
        </div>
      ) : null}
      <PulseLine
        state="working"
        agentSlug={working.agentSlug}
        line={working.line}
        time={working.time}
        streaming={working.streaming}
      />
    </div>
  );
}

/** The calm loading skeleton: same craft budget as the hero path (spec 1). */
function FaceSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5" aria-hidden data-testid="face-skeleton">
      <div className="ink-skeleton h-5 w-2/3 rounded-md" />
      <div className="ink-skeleton h-24 w-full rounded-lg" />
      <div className="ink-skeleton h-24 w-full rounded-lg" />
    </div>
  );
}

/** The one face contract. Header + working triple + a body that is exactly one
 *  of: loading skeleton, blocked reason, WarmSlot empty, or the real content. */
export function CanvasFace({
  stageMarker,
  title,
  agentSlug,
  state,
  deepLink,
  onDetails,
  headerActions,
  working,
  loading,
  error,
  emptyLine,
  children,
  className,
}: CanvasFaceProps) {
  const hasContent = children !== undefined && children !== null && children !== false;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <SurfaceHeader
        stageMarker={stageMarker}
        title={title}
        agentSlug={agentSlug}
        state={state}
        deepLink={deepLink}
        onDetails={onDetails}
      >
        {headerActions}
      </SurfaceHeader>

      {working ? <WorkingTriple working={working} /> : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <FaceSkeleton />
        ) : error ? (
          <div className="p-5">
            <ReceiptLine variant="blocked" actionLabel={error.actionLabel} onAction={error.onAction}>
              {error.message}
            </ReceiptLine>
          </div>
        ) : hasContent ? (
          children
        ) : emptyLine ? (
          <div className="p-5">
            <WarmSlot line={emptyLine} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
