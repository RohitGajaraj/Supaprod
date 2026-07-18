import { cn } from "@/lib/utils";

/**
 * The spine - Ink's signature element. The project lifecycle rendered as a
 * journey map: six stages on a machined track, each node telling the truth
 * about where work stands. For live products the spine is a loop: stages
 * re-light when a pass re-enters them.
 *
 * States: done (receipted), active (agents moving), gate (needs a human,
 * the only ember on the strip), future (quiet), inferred (imported or
 * backfilled), na (not applicable to this project).
 */

export type SpineStageId = "plan" | "design" | "build" | "ship" | "launch" | "grow";
export type SpineStageState = "done" | "active" | "gate" | "future" | "inferred" | "na";

export type SpineStage = {
  id: SpineStageId;
  label: string;
  state: SpineStageState;
  /** One-line receipt for done stages ("Shipped v2 · Mar 4") or live note for active ones. */
  note?: string;
  /** Count of items needing a human at this stage (renders the gate voice). */
  needsYou?: number;
};

export const SPINE_STAGES: { id: SpineStageId; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "design", label: "Design" },
  { id: "build", label: "Build" },
  { id: "ship", label: "Ship" },
  { id: "launch", label: "Launch" },
  { id: "grow", label: "Grow" },
];

function StageNode({ state }: { state: SpineStageState }) {
  const base = "h-[7px] w-[7px] shrink-0 rotate-45 transition-colors duration-150";
  switch (state) {
    case "done":
      return <span className={cn(base, "bg-[var(--ink-text)]")} aria-hidden />;
    case "active":
      return <span className={cn(base, "ink-working bg-[var(--voice-machine)]")} aria-hidden />;
    case "gate":
      return <span className={cn(base, "bg-[var(--voice-human)]")} aria-hidden />;
    case "inferred":
      return (
        <span
          className={cn(base, "border border-dashed border-[var(--ink-subtle)] bg-transparent")}
          aria-hidden
        />
      );
    case "na":
      return (
        <span
          className={cn(base, "border border-[var(--ink-hairline)] bg-transparent opacity-40")}
          aria-hidden
        />
      );
    default:
      return (
        <span
          className={cn(base, "border border-[var(--ink-hairline)] bg-transparent")}
          aria-hidden
        />
      );
  }
}

const STATE_WORD: Record<SpineStageState, string> = {
  done: "done",
  active: "agents working",
  gate: "needs you",
  future: "ahead",
  inferred: "inferred",
  na: "not applicable",
};

export function Spine({
  stages,
  selected,
  onSelect,
  className,
}: {
  stages: SpineStage[];
  selected?: SpineStageId;
  onSelect?: (id: SpineStageId) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Project lifecycle" className={cn("w-full", className)}>
      <ol className="flex w-full items-stretch">
        {stages.map((stage, i) => {
          const isSelected = selected === stage.id;
          const dim = stage.state === "future" || stage.state === "na";
          return (
            <li key={stage.id} className="flex min-w-0 flex-1 items-start">
              {i > 0 && (
                <span
                  aria-hidden
                  className="mt-[13px] h-px w-full min-w-3 flex-1 bg-[var(--ink-hairline)]"
                />
              )}
              <button
                type="button"
                onClick={() => onSelect?.(stage.id)}
                aria-current={isSelected ? "step" : undefined}
                aria-label={`${stage.label}: ${STATE_WORD[stage.state]}${
                  stage.needsYou ? `, ${stage.needsYou} waiting on you` : ""
                }`}
                className={cn(
                  "ink-focus group flex shrink-0 flex-col items-start gap-1.5 rounded-md px-2 py-1.5",
                  "transition-colors duration-150 hover:bg-[var(--ink-raised)]",
                  isSelected && "bg-[var(--ink-raised)]",
                )}
              >
                <span className="flex items-center gap-2">
                  <StageNode state={stage.state} />
                  <span
                    className={cn(
                      "ink-kicker transition-colors",
                      isSelected || stage.state === "active"
                        ? "text-[var(--ink-text)]"
                        : dim
                          ? "text-[var(--ink-faint)]"
                          : "text-[var(--ink-body)]",
                      stage.state === "gate" && "text-[var(--voice-human)]",
                    )}
                  >
                    {stage.label}
                  </span>
                  {stage.needsYou ? (
                    <span className="ink-mono rounded-full border border-[var(--voice-human-border)] px-1.5 text-[10px] leading-4 text-[var(--voice-human)]">
                      {stage.needsYou}
                    </span>
                  ) : null}
                </span>
                {stage.note ? (
                  <span
                    className={cn(
                      "ink-mono max-w-[16ch] truncate text-[11px] normal-case tracking-normal",
                      stage.state === "active"
                        ? "text-[var(--voice-machine)]"
                        : "text-[var(--ink-faint)]",
                    )}
                  >
                    {stage.note}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
