import { cn } from "@/lib/utils";

/**
 * The Spine (comprehension primitive 6.6, Mission Control edition).
 *
 * The full-width 01 Discover to 07 Learn strip plus the drawn 07-to-01
 * return edge: the loop identity, the wayfinding, and the demo in one
 * element. Always whole: a journey lights its slice, untouched stages
 * stay dim but present, so a slice never pretends to be the product.
 *
 * Voice grammar (binding): ember marks the gate nodes only (your move);
 * machine blue at full hue marks the single active node only (the one
 * live locus); everything else lives in the monotone ramp. The pulse on
 * the active dot is `ink-working`, which resolves to a static ring
 * under reduced motion (src/styles/ink.css).
 *
 * The loop-state lane ships `getLoopState` with the same contract as
 * `StageLoopState` below; this component only consumes the shape.
 */

export type StageId = "discover" | "decide" | "plan" | "design" | "build" | "ship" | "learn";

export type StageState = "done" | "active" | "gate" | "quiet" | "inferred";

export type StageLoopState = {
  stage: StageId;
  state: StageState;
  /** Artifact chip for a done stage ("SPEC-52") or a quiet stage's honest note ("Mon 9am"). */
  receipt?: string;
  /** The strip's current verb for an active stage ("writing the change"). */
  liveVerb?: string;
  /** Count of decisions waiting at a gate stage. */
  gateCount?: number;
};

export const SPINE_STAGES: { id: StageId; num: string; label: string }[] = [
  { id: "discover", num: "01", label: "Discover" },
  { id: "decide", num: "02", label: "Decide" },
  { id: "plan", num: "03", label: "Plan" },
  { id: "design", num: "04", label: "Design" },
  { id: "build", num: "05", label: "Build" },
  { id: "ship", num: "06", label: "Ship" },
  { id: "learn", num: "07", label: "Learn" },
];

/* ---------------- pure helpers (unit-tested) ---------------- */

/** Find a stage's loop state; an unreported stage is quiet, never missing. */
export function resolveLoopState(states: StageLoopState[], stage: StageId): StageLoopState {
  return states.find((s) => s.stage === stage) ?? { stage, state: "quiet" };
}

/**
 * Slice highlighting: with a journey slice given, stages outside it dim
 * (but stay present). No slice means the whole loop is lit.
 */
export function isStageDimmed(stage: StageId, journeyStages?: StageId[]): boolean {
  if (!journeyStages || journeyStages.length === 0) return false;
  return !journeyStages.includes(stage);
}

/**
 * The one-live-locus rule: full-hue machine blue belongs to a single
 * active node. When more than one stage reports active, the earliest in
 * loop order is the locus; the rest render in the dim tier, no pulse.
 */
export function primaryActiveStage(states: StageLoopState[]): StageId | null {
  for (const { id } of SPINE_STAGES) {
    const found = states.find((s) => s.stage === id && s.state === "active");
    if (found) return found.stage;
  }
  return null;
}

/** The mono state word rendered beside the label, or null for none. */
export function stageStateWord(loop: StageLoopState): string | null {
  switch (loop.state) {
    case "active":
      return loop.liveVerb ?? "working";
    case "gate":
      return "your call";
    case "inferred":
      return "inferred";
    case "quiet":
      return loop.receipt ?? null;
    default:
      return null;
  }
}

/** Screen-reader sentence for a node. */
export function stageAriaLabel(loop: StageLoopState, num: string, label: string): string {
  const word =
    loop.state === "done"
      ? loop.receipt
        ? `done, ${loop.receipt}`
        : "done"
      : loop.state === "gate"
        ? loop.gateCount
          ? `your call, ${loop.gateCount} waiting`
          : "your call"
        : (stageStateWord(loop) ?? "quiet");
  return `${num} ${label}: ${word}`;
}

/* ---------------- rendering ---------------- */

function StageDot({ state, pulses }: { state: StageState; pulses: boolean }) {
  if (state === "done") {
    return (
      <span aria-hidden className="flex-none text-[10px] leading-none text-[var(--ink-subtle)]">
        {"✓"}
      </span>
    );
  }
  const base = "h-[7px] w-[7px] flex-none rounded-full";
  switch (state) {
    case "active":
      return (
        <span
          aria-hidden
          className={cn(
            base,
            pulses ? "ink-working bg-[var(--voice-machine)]" : "bg-[var(--voice-machine-dim)]",
          )}
        />
      );
    case "gate":
      return <span aria-hidden className={cn(base, "bg-[var(--voice-human)]")} />;
    case "inferred":
      return (
        <span
          aria-hidden
          className={cn(base, "border border-dashed border-[var(--ink-subtle)] bg-transparent")}
        />
      );
    default:
      return (
        <span
          aria-hidden
          className={cn(base, "border border-[var(--ink-hairline)] bg-[var(--ink-raised)]")}
        />
      );
  }
}

function Edge() {
  return <span aria-hidden className="h-px min-w-[10px] flex-1 bg-[var(--ink-hairline)]" />;
}

export function Spine({
  states,
  journeyStages,
  startsFrom,
  endsWith,
  returnLabel = "what Learn records feeds the next loop",
  onStageSelect,
  className,
}: {
  /** Per-stage loop state, from getLoopState. Unlisted stages render quiet. */
  states: StageLoopState[];
  /** The active journey's slice; stages outside it dim but stay present. */
  journeyStages?: StageId[];
  /** Plain-words entry cap: "Starts from: {startsFrom}". */
  startsFrom?: string;
  /** Plain-words exit cap: "Ends with: {endsWith}". */
  endsWith?: string;
  /** Label on the drawn 07-to-01 return edge. */
  returnLabel?: string;
  onStageSelect?: (stage: StageId) => void;
  className?: string;
}) {
  const activeLocus = primaryActiveStage(states);

  return (
    <nav
      aria-label="The loop"
      className={cn(
        "w-full border-b border-[var(--ink-hairline)] bg-[var(--ink-bg)] px-5 pb-2 pt-2.5",
        className,
      )}
    >
      <ol className="flex w-full items-center gap-1.5 overflow-hidden">
        {startsFrom ? (
          <>
            <li className="flex-none whitespace-nowrap font-mono text-[10px] tracking-[0.03em] text-[var(--voice-human-dim)]">
              Starts from: {startsFrom}
            </li>
            <Edge />
          </>
        ) : null}

        {SPINE_STAGES.map(({ id, num, label }, i) => {
          const loop = resolveLoopState(states, id);
          const dimmed = isStageDimmed(id, journeyStages);
          const pulses = loop.state === "active" && activeLocus === id;
          const word = stageStateWord(loop);
          return (
            <li key={id} className="flex min-w-0 flex-none items-center gap-1.5">
              {i > 0 && <Edge />}
              <button
                type="button"
                data-stage={id}
                data-state={loop.state}
                onClick={() => onStageSelect?.(id)}
                title={loop.state === "active" ? loop.liveVerb : undefined}
                aria-label={stageAriaLabel(loop, num, label)}
                className={cn(
                  "ink-focus flex h-7 items-center gap-[7px] whitespace-nowrap rounded-lg border border-transparent px-2.5",
                  "transition-colors duration-150 hover:bg-[var(--ink-raised)]",
                  loop.state === "gate" &&
                    "border-[var(--voice-human-border)] bg-[var(--voice-human-faint)] hover:bg-[var(--voice-human-soft)]",
                  loop.state === "quiet" && "opacity-75",
                  dimmed && "opacity-40",
                )}
              >
                <StageDot state={loop.state} pulses={pulses} />
                <span className="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-faint)]">
                  {num}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    loop.state === "done" && "text-[var(--ink-body)]",
                    loop.state === "active" &&
                      (pulses ? "text-[var(--voice-machine)]" : "text-[var(--voice-machine-dim)]"),
                    loop.state === "gate" && "text-[var(--voice-human)]",
                    loop.state === "quiet" && "text-[var(--ink-faint)]",
                    loop.state === "inferred" && "text-[var(--ink-subtle)]",
                  )}
                >
                  {label}
                </span>
                {id === "learn" && (
                  <span aria-hidden className="text-[11px] leading-none text-[var(--ink-faint)]">
                    {"↺"}
                  </span>
                )}
                {loop.state === "done" && loop.receipt ? (
                  <span className="rounded border border-[var(--ink-hairline)] px-[5px] py-px font-mono text-[9.5px] tracking-[0.04em] text-[var(--ink-subtle)]">
                    {loop.receipt}
                  </span>
                ) : word ? (
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      loop.state === "active" && pulses
                        ? "text-[var(--voice-machine-dim)]"
                        : loop.state === "gate"
                          ? "text-[var(--voice-human-dim)]"
                          : "text-[var(--ink-faint)]",
                    )}
                  >
                    {word}
                  </span>
                ) : null}
                {loop.state === "gate" && loop.gateCount ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-lg border border-[var(--voice-human-border)] bg-[var(--voice-human-faint)] px-1 font-mono text-[10px] text-[var(--voice-human)]">
                    {loop.gateCount}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}

        {endsWith ? (
          <>
            <Edge />
            <li className="flex-none whitespace-nowrap font-mono text-[10px] tracking-[0.03em] text-[var(--voice-human-dim)]">
              Ends with: {endsWith}
            </li>
          </>
        ) : null}
      </ol>

      {/* The drawn 07-to-01 return edge: the loop you can see. */}
      <div
        aria-hidden
        className="relative mx-[15%] mt-[3px] h-[9px] rounded-b-[10px] border border-t-0 border-[var(--ink-hairline-soft)]"
      >
        <span className="absolute -left-px -top-[3px] h-[5px] w-[5px] rotate-45 border-l border-t border-[var(--ink-hairline)]" />
        <span className="absolute left-1/2 top-[3px] -translate-x-1/2 whitespace-nowrap bg-[var(--ink-bg)] px-2 font-mono text-[9.5px] text-[var(--ink-faint)]">
          {returnLabel}
        </span>
      </div>
    </nav>
  );
}
