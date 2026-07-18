import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Ink AgentActivityTimeline — Supaprod signature element (Tempo v5).
 *
 * Timeline display for agent actions: what agents did, when they did it,
 * and the results. Used on Project surface to show build history.
 *
 * Design language:
 * - Geist Mono font (monospace, technical voice)
 * - Engineering grid background (subtle 4px grid pattern)
 * - Left-aligned timestamp column (consistent width)
 * - Action + result lines (no line wrapping unless unavoidable)
 * - Small spacing between entries
 * - Success: green checkmark or "✓"
 * - In-progress: blue glacier dot or spinner
 * - Error: red "✗"
 *
 * Usage:
 *   <AgentActivityTimeline>
 *     <TimelineEntry
 *       timestamp="14:32:45"
 *       agent="Builder"
 *       status="success"
 *       action="Ran tests"
 *       result="287/287 passing"
 *     />
 *   </AgentActivityTimeline>
 *
 * Responsive: word-breaks on mobile, full lines on desktop.
 * Motion: reduced-motion respected (spinner paused if any).
 * Dark/Light: resolves from --ds-* tokens + grid pattern visibility.
 */

interface TimelineEntryProps {
  timestamp: string;
  agent: string;
  status: "pending" | "running" | "success" | "error";
  action: string;
  result?: string;
}

const AgentActivityTimeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Engineering grid background (4px base unit)
      "relative bg-[length:4px_4px]",
      "bg-[image:linear-gradient(0deg,transparent_calc(100%_-_1px),var(--ds-gray-200)_calc(100%_-_1px)),linear-gradient(90deg,transparent_calc(100%_-_1px),var(--ds-gray-200)_calc(100%_-_1px))]",
      // Dark theme grid (lighter than bg)
      "dark:bg-[image:linear-gradient(0deg,transparent_calc(100%_-_1px),var(--ds-gray-400)_calc(100%_-_1px)),linear-gradient(90deg,transparent_calc(100%_-_1px),var(--ds-gray-400)_calc(100%_-_1px))]",
      // Container
      "rounded-md border border-[var(--ds-gray-400)]",
      "bg-[var(--ds-background-100)]",
      "overflow-hidden p-4 sm:p-6",
      "font-mono text-label-13",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
AgentActivityTimeline.displayName = "AgentActivityTimeline";

const TimelineEntry = ({ timestamp, agent, status, action, result }: TimelineEntryProps) => {
  const statusIcons = {
    pending: "○",
    running: "◐", // half-filled circle for in-progress
    success: "✓",
    error: "✗",
  };

  const statusColors = {
    pending: "text-[var(--ds-gray-600)]",
    running: "text-[var(--ds-blue-600)] animate-spin",
    success: "text-[var(--ds-green-600)]",
    error: "text-[var(--ds-red-600)]",
  };

  return (
    <div className="mb-2 space-y-1 last:mb-0">
      {/* Timestamp + Agent + Status line */}
      <div className="flex items-center gap-3 text-[var(--ds-gray-900)]">
        <span className="w-12 flex-shrink-0 text-[var(--ds-gray-600)]">{timestamp}</span>
        <span className="w-12 flex-shrink-0 text-[var(--ds-gray-700)]">{agent}</span>
        <span className={cn("flex h-4 w-4 items-center justify-center", statusColors[status])}>
          {statusIcons[status]}
        </span>
        <span className="flex-1 break-words text-[var(--ds-gray-1000)]">{action}</span>
      </div>

      {/* Result line (indented) */}
      {result && (
        <div className="flex items-center gap-3 pl-[calc(12rem+0.75rem)]">
          <span className="flex-1 break-words text-[var(--ds-gray-600)]">→ {result}</span>
        </div>
      )}
    </div>
  );
};
TimelineEntry.displayName = "TimelineEntry";

export { AgentActivityTimeline, TimelineEntry };
