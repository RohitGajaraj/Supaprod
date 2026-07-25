import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** How long a failure notice stays on screen before it clears itself. */
const ERROR_DISMISS_MS = 5000;

/**
 * What kind of failure the user is looking at. Only the kinds we can honestly
 * derive from what a caller is able to hand us: the Error's name, its message,
 * and an HTTP-ish `status` when one is attached.
 */
export type CommandBarErrorKind = "network" | "timeout" | "validation" | "unknown";

type CommandBarError = { message: string; kind: CommandBarErrorKind };

function readStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/**
 * Classify a submit failure. Name wins over message because a caller that
 * bothers to set `err.name` is telling us something deliberate; message
 * sniffing is the fallback for the many libraries that only throw prose.
 */
function classifyCommandError(error: unknown): CommandBarErrorKind {
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError") return "timeout";
  if (name === "NetworkError") return "network";
  if (name === "ValidationError") return "validation";

  const status = readStatus(error);
  if (status === 408 || status === 504) return "timeout";
  if (status === 400 || status === 409 || status === 422) return "validation";

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  // "Network timeout" is a network problem first, so network is tested first.
  if (/network|offline|failed to fetch|connection|econn|dns/i.test(message)) return "network";
  if (/timeout|timed out|deadline/i.test(message)) return "timeout";
  if (/validation|invalid|required|not allowed|too long/i.test(message)) return "validation";
  return "unknown";
}

/**
 * Retrying a rejected input sends the same rejected input, so validation
 * failures get no retry affordance. Everything else is worth one more go.
 */
function isRetryable(kind: CommandBarErrorKind) {
  return kind !== "validation";
}

/**
 * Only a real Error has a message written for a person. Anything else that
 * got thrown is raw internals, so the user sees the plain fallback while the
 * caller still receives a normal Error to log.
 */
function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error("Something went wrong. Try again.");
}

/**
 * The command bar - the product's real front door. One input that accepts
 * intent at any lifecycle stage. Two renders: the Home hero and the project
 * rail composer. Typing is not a gate, so focus is the calm single ring;
 * submitting hands intent to agents.
 *
 * A submit that fails is a first-class state, not a console message: the
 * rejection is caught here, surfaced in a live region, and offered a retry,
 * and the input keeps its text so the retry has something to send.
 */
export function CommandBar({
  variant = "hero",
  placeholder,
  onSubmit,
  onError,
  disabled,
  autoFocus,
  className,
}: {
  variant?: "hero" | "rail";
  placeholder: string;
  onSubmit: (intent: string) => void | Promise<void>;
  onError?: (error: Error, kind: CommandBarErrorKind) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CommandBarError | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // A notice nobody dismissed should not outlive the moment, and the timer
  // must not outlive the component.
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), ERROR_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error]);

  async function submit() {
    const intent = value.trim();
    if (!intent || busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(intent);
      setValue("");
    } catch (cause) {
      const failure = toError(cause);
      const kind = classifyCommandError(cause);
      setError({ message: failure.message, kind });
      onError?.(failure, kind);
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
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/*
           * One status line, three states. A failure keeps the retry control
           * inside the live region so anyone who hears the alert can act on it
           * without hunting for the composer's primary button.
           */}
          <span
            role={error ? "alert" : "status"}
            className={cn(
              "ink-mono text-[11px]",
              error ? "error-message text-[var(--verdict-fail)]" : "text-[var(--ink-faint)]",
            )}
          >
            {busy ? "Handing to agents" : error ? error.message : "Enter to start"}
          </span>
          {error && isRetryable(error.kind) ? (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!value.trim() || busy || disabled}
              aria-label="Retry the command"
              className="ink-focus shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium text-[var(--ink-body)] transition-colors duration-150 hover:text-[var(--ink-text)]"
            >
              Retry
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!value.trim() || busy || disabled}
          aria-label="Start"
          className={cn(
            "ink-focus shrink-0 rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150",
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
