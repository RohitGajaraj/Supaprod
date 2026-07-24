import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The command bar - the product's real front door. One input that accepts
 * intent at any lifecycle stage. Two renders: the Home hero and the project
 * rail composer. Typing is not a gate, so focus is the calm single ring;
 * submitting hands intent to agents.
 */
export function CommandBar({
  variant = "hero",
  placeholder,
  onSubmit,
  disabled,
  autoFocus,
  className,
}: {
  variant?: "hero" | "rail";
  placeholder: string;
  onSubmit: (intent: string) => void | Promise<void>;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function submit() {
    const intent = value.trim();
    if (!intent || busy || disabled) return;
    setBusy(true);
    setSubmitError(null);
    try {
      await onSubmit(intent);
      setValue("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setSubmitError(message);
    } finally {
      setBusy(false);
    }
  }

  const hero = variant === "hero";

  return (
    <div
      className={cn(
        "ink-input-focus w-full border border-[var(--ink-hairline)] bg-[var(--ink-panel)] transition-[border-color,box-shadow] duration-150",
        hero
          ? "rounded-[var(--ink-radius-hero)] px-5 py-4"
          : "rounded-[var(--ink-radius-control)] px-3 py-2.5",
        "focus-within:border-[var(--ink-subtle)]",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        disabled={disabled || busy}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        className={cn(
          "w-full resize-none bg-transparent text-[var(--ink-text)] outline-none placeholder:text-[var(--ink-subtle)]",
          hero ? "text-lg leading-7" : "text-sm leading-6",
          (disabled || busy) && "opacity-60",
        )}
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="ink-mono text-[11px] text-[var(--ink-faint)]">
          {busy ? "Handing to agents" : submitError ? submitError : "Enter to start"}
        </span>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!value.trim() || busy || disabled}
          aria-label="Start"
          className={cn(
            "ink-focus rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150",
            value.trim() && !busy
              ? "bg-[var(--voice-human)] text-white hover:bg-[var(--voice-human-hover)]"
              : "cursor-default bg-[var(--ink-raised)] text-[var(--ink-faint)]",
          )}
        >
          Start
        </button>
      </div>
    </div>
  );
}
