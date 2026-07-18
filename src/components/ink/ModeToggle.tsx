import { cn } from "@/lib/utils";

/**
 * ModeToggle - the persistent Plan / Build indicator. Mode ambiguity is the
 * root of "it just did the thing without asking", so this is always visible
 * in the project rail, never a buried setting. Plan thinks (zero side
 * effects); Build acts (agents execute through gates).
 */
export type WorkMode = "plan" | "build";

const MODES: { id: WorkMode; label: string; hint: string }[] = [
  { id: "plan", label: "Plan", hint: "thinking only, nothing changes" },
  { id: "build", label: "Build", hint: "agents will act" },
];

export function ModeToggle({
  mode,
  onChange,
  className,
}: {
  mode: WorkMode;
  onChange: (mode: WorkMode) => void;
  className?: string;
}) {
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        role="radiogroup"
        aria-label="Working mode"
        className="inline-flex w-fit rounded-[var(--ink-radius-control)] border border-[var(--ink-hairline)] bg-[var(--ink-panel)] p-0.5"
      >
        {MODES.map((m) => {
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(m.id)}
              className={cn(
                "ink-focus flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-medium transition-colors duration-150",
                selected
                  ? "bg-[var(--ink-raised)] text-[var(--ink-text)]"
                  : "text-[var(--ink-subtle)] hover:text-[var(--ink-body)]",
              )}
            >
              {m.id === "build" && selected ? (
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--voice-machine)]" />
              ) : null}
              {m.label}
            </button>
          );
        })}
      </div>
      <span className="ink-mono text-[10px] text-[var(--ink-faint)]">{active.hint}</span>
    </div>
  );
}
