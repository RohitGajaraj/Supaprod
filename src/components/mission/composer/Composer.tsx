// Composer (Mission Control, front-end reimagining Phase 2): the docked
// strip and its expanded state. ONE input model per screen (Addendum 1.1
// rule 4): collapsed, the strip is a button; expanded, it is THE textarea.
// The shell controls `expanded` so it can guarantee the overlay and the dock
// never both hold an input at once.
//
// Behavior contract:
//   - typed matches rank above the standing Ask row (SuggestionPopover);
//   - Enter on free text submits the intent (streams into the Thread via
//     use-ask-stream at the shell);
//   - journey chips activate by id; the typed intent quietly pre-lights the
//     matching chip (journeyForIntent - a suggestion aid, never a router);
//   - mic dictation survives: the hook's onDictation appends into the draft
//     the shell owns; the mic affordance renders here when supported;
//   - Escape collapses; no cost figures anywhere.
//
// Craft: token vars only, plain ink surfaces, no edge strips.

import * as React from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaletteRun } from "@/lib/palette-sections";
import { journeyForIntent, type JourneyId } from "@/lib/journeys";
import type { DictationState } from "@/hooks/use-voice";
import { Kbd } from "@/components/mission/primitives";
import { openLineage } from "@/components/supaprod/AuditLineageSheet";
import { SuggestionPopover, buildSuggestionRows, type SuggestionRow } from "./SuggestionPopover";
import { JourneyChips } from "./JourneyChips";

export interface ComposerSurfaceProps {
  /** The draft lives at the shell so dictation transcripts can append into it. */
  draft: string;
  onDraftChange: (draft: string) => void;
  /** Free text goes to the Thread stream (use-ask-stream sendIntent). */
  onSubmitIntent: (text: string) => void;
  /** A journey chip emits its id; the shell decides what activation does. */
  onActivateJourney: (id: JourneyId) => void;
  /** Jump / Act / Catalog rows run through the shell (navigate or dispatch). */
  onRun: (run: PaletteRun) => void;
  /** Blocks a second Ask while one streams; run rows stay available. */
  streaming: boolean;
  /** Mic passthrough from use-ask-stream; no mic renders when unsupported. */
  dictation: DictationState;
  onEscape: () => void;
  autoFocus?: boolean;
  className?: string;
}

/** The expanded composer body, shared by the docked strip and the overlay. */
export function ComposerSurface({
  draft,
  onDraftChange,
  onSubmitIntent,
  onActivateJourney,
  onRun,
  streaming,
  dictation,
  onEscape,
  autoFocus = true,
  className,
}: ComposerSurfaceProps) {
  const rows = React.useMemo(() => buildSuggestionRows(draft), [draft]);
  const askIndex = rows.length - 1;
  // null = the default highlight (the Ask row), so Enter on free text streams.
  const [cursor, setCursor] = React.useState<number | null>(null);
  React.useEffect(() => {
    setCursor(null);
  }, [draft]);
  const activeIndex = cursor === null ? askIndex : Math.min(cursor, rows.length - 1);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const suggestedJourney = React.useMemo(() => journeyForIntent(draft), [draft]);

  const pick = React.useCallback(
    (row: SuggestionRow) => {
      if (row.kind === "ask") {
        if (!row.query || streaming) return;
        onSubmitIntent(row.query);
        onDraftChange("");
        return;
      }
      if (row.kind === "trace") {
        // The lineage pane opens BESIDE the work rather than replacing it, so
        // a trace does not go through onRun's navigate. It also does not close
        // the composer here: the shell owns that, and the pane is
        // complementary, not a destination.
        openLineage(row.ref);
        onDraftChange("");
        return;
      }
      onRun(row.run);
      onDraftChange("");
    },
    [onDraftChange, onRun, onSubmitIntent, streaming],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      pick(rows[activeIndex]);
      return;
    }
    if (e.key === "ArrowDown" && rows.length > 1) {
      e.preventDefault();
      setCursor((activeIndex + 1) % rows.length);
      return;
    }
    if (e.key === "ArrowUp" && rows.length > 1) {
      e.preventDefault();
      setCursor((activeIndex - 1 + rows.length) % rows.length);
    }
  };

  const showPopover = draft.trim().length > 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showPopover ? (
        <SuggestionPopover
          rows={rows}
          activeIndex={activeIndex}
          onPick={pick}
          onHighlight={setCursor}
        />
      ) : null}
      <JourneyChips onActivate={onActivateJourney} suggestedId={suggestedJourney?.id ?? null} />
      <div
        className="flex items-end gap-2 rounded-xl border px-3 py-2.5"
        style={{ background: "var(--ink-panel)", borderColor: "var(--ink-hairline)" }}
      >
        <textarea
          ref={textareaRef}
          rows={2}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Ask Supaprod anything"
          placeholder="Ask anything, or name the work."
          className="min-w-0 flex-1 resize-none bg-transparent text-[13.5px] leading-[1.5] outline-none placeholder:text-[var(--ink-faint)]"
          style={{ color: "var(--ink-text)" }}
        />
        {dictation.supported ? (
          <button
            type="button"
            onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
            aria-label={dictation.listening ? "Stop dictation" : "Dictate your question"}
            aria-pressed={dictation.listening}
            className="ink-focus flex h-8 w-8 flex-none items-center justify-center rounded-lg border transition-colors hover:bg-[var(--ink-raised)]"
            style={{
              borderColor: dictation.listening
                ? "var(--voice-machine-border)"
                : "var(--ink-hairline)",
              color: dictation.listening ? "var(--voice-machine)" : "var(--ink-subtle)",
            }}
          >
            {dictation.listening ? (
              <Square aria-hidden size={13} strokeWidth={1.5} />
            ) : (
              <Mic aria-hidden size={14} strokeWidth={1.5} />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => pick(rows[askIndex])}
          disabled={streaming || draft.trim().length === 0}
          aria-label="Send"
          className="ink-focus flex h-8 flex-none items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-[var(--ink-raised)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--ink-raised)",
            borderColor: "var(--ink-hairline)",
            color: "var(--ink-text)",
          }}
        >
          Send <Kbd>{"⏎"}</Kbd>
        </button>
      </div>
      {dictation.listening && dictation.interim ? (
        <div className="px-1 text-[12px]" style={{ color: "var(--ink-faint)" }}>
          {dictation.interim}
        </div>
      ) : null}
    </div>
  );
}

export interface ComposerProps extends Omit<
  ComposerSurfaceProps,
  "onEscape" | "autoFocus" | "className"
> {
  /** Controlled by the shell so the dock and the overlay never both hold an input. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** The shortcut the strip teaches (the overlay summon key). */
  shortcutHint?: string;
  className?: string;
}

/** The docked composer: a strip when collapsed, THE input when expanded. */
export function Composer({
  expanded,
  onExpandedChange,
  shortcutHint = "⌘J",
  className,
  ...surface
}: ComposerProps) {
  if (!expanded) {
    return (
      <div data-testid="composer-docked" className={className}>
        <button
          type="button"
          aria-label="Ask Supaprod"
          onClick={() => onExpandedChange(true)}
          className="ink-focus flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors hover:border-[var(--ink-subtle)]"
          style={{ background: "var(--ink-panel)", borderColor: "var(--ink-hairline)" }}
        >
          <span className="flex-1 text-[13.5px] font-medium" style={{ color: "var(--ink-faint)" }}>
            Ask anything, or name the work.
          </span>
          <span
            className="flex flex-none items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--ink-text)" }}
          >
            Ask <Kbd>{shortcutHint}</Kbd>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div data-testid="composer-docked" data-expanded="true" className={className}>
      <ComposerSurface {...surface} onEscape={() => onExpandedChange(false)} />
    </div>
  );
}
