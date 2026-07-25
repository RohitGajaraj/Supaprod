// RoomTour (front-end reimagining, Phase 4): the opt-in, skippable guided tour
// of the room anatomy (charter #10, design-language-spec §8). Five stops, one
// sentence each, covering the Spine, Thread, Canvas, Composer, and the
// Approvals pull point. The structure teaches first; this only names the five
// regions so a brand-new user knows what each is for.
//
// Opt-in and skippable at any step (spec §8): the caller opens it (a first-run
// offer or a replay affordance), Escape or "Skip tour" closes it, and it
// remembers nothing itself. Non-modal: no scrim, so the region it names stays
// visible and lightly ringed while the card explains it. Reduced motion safe
// (the ring is a static outline; no essential animation).

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/mission/primitives";

interface TourStop {
  /** A selector for the region this stop names; lightly ringed while active. */
  selector: string;
  title: string;
  body: string;
}

const TOUR_STOPS: readonly TourStop[] = [
  {
    selector: '[data-region="spine"]',
    title: "The loop",
    body: "Start to finish, always whole. It lights up where agents are working and where you are needed.",
  },
  {
    selector: '[data-region="thread"]',
    title: "The thread",
    body: "Your daily briefing and every call that needs you land here, in order.",
  },
  {
    selector: '[data-region="canvas"]',
    title: "The canvas",
    body: "The stage's real work forms here as agents run. The artifact is the progress bar.",
  },
  {
    selector: '[data-region="composer"]',
    title: "The composer",
    body: "One box. Ask a question, name the work, or start a journey.",
  },
  {
    selector: 'button[data-door="approvals"]',
    title: "Approvals",
    body: "Everything waiting on you sits in one place. Approving sets the next agents in motion.",
  },
];

export interface RoomTourProps {
  open: boolean;
  onClose: () => void;
}

export function RoomTour({ open, onClose }: RoomTourProps) {
  const [step, setStep] = useState(0);

  // Reset to the first stop each time the tour opens.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Ring the active region; restore it on step change or close. Null-safe so
  // it degrades to a plain card if a region is not mounted (jsdom, or a
  // surface the tour outgrew).
  useEffect(() => {
    if (!open) return;
    const el = document.querySelector<HTMLElement>(TOUR_STOPS[step]?.selector ?? "");
    if (!el) return;
    const prevOutline = el.style.outline;
    const prevOffset = el.style.outlineOffset;
    const prevRadius = el.style.borderRadius;
    el.style.outline = "2px solid var(--voice-machine)";
    el.style.outlineOffset = "-2px";
    el.style.borderRadius = el.style.borderRadius || "8px";
    el.scrollIntoView({ block: "nearest" });
    return () => {
      el.style.outline = prevOutline;
      el.style.outlineOffset = prevOffset;
      el.style.borderRadius = prevRadius;
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const stop = TOUR_STOPS[step];
  const isLast = step === TOUR_STOPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Guided tour"
      data-testid="room-tour"
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div
        className="w-full max-w-[420px] rounded-xl border p-4 shadow-2xl"
        style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)" }}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
            {step + 1} / {TOUR_STOPS.length}
          </span>
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink-text)" }}>
            {stop.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ink-focus ml-auto text-[11px] transition-colors hover:text-[var(--ink-body)]"
            style={{ color: "var(--ink-subtle)" }}
          >
            Skip tour
          </button>
        </div>
        <p className="text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
          {stop.body}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="ink-focus inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] transition-colors hover:bg-[var(--ink-panel)]"
              style={{ color: "var(--ink-subtle)" }}
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className={cn(
              "ink-focus ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[#202024]",
            )}
            style={{
              background: "var(--ink-panel)",
              borderColor: "var(--ink-hairline)",
              color: "var(--ink-text)",
            }}
          >
            {isLast ? "Done" : "Next"}
            {!isLast ? <Kbd>{"→"}</Kbd> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
