/**
 * LOOM W2-TODAY: Triage-grouped Call queue
 *
 * Calls never pile up on one screen. Eleven flat approvals is a defect,
 * not a queue. The triage law (DESIGN-LOOM §8b):
 *
 * - The queue groups by kind (Ship it? · Worth building? · Spend)
 * - Each group shows its top card featured, the rest behind an inline "N more" expander
 * - Groups render in order: Ship → Worth Building → Spend (priority descending)
 * - Empty group renders nothing (not "0 · Ship it" chatter)
 *
 * This closes the "Today overwhelms" audit finding.
 */

import { useState } from "react";
import { CallCard } from "@/components/obsidian/callcard";

type Call = {
  id: string;
  kind: "SHIP IT?" | "WORTH BUILDING?" | "WORTH RE-EXAMINING?" | "SPEND";
  expiry: string;
  title: string;
  body: string;
  ev: { src: string; text: string }[];
  okLabel: string;
  noLabel: string;
  consequence: string;
};

type GroupKey = "ship" | "building" | "spend" | "challenge";

interface TriageQueueProps {
  calls: Call[];
  onDecide: (id: string, approved: boolean) => void;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
}

const GROUP_ORDER: Record<GroupKey, { order: number; label: string }> = {
  ship: { order: 1, label: "Ship it?" },
  building: { order: 2, label: "Worth building?" },
  challenge: { order: 3, label: "Worth re-examining?" },
  spend: { order: 4, label: "Spend" },
};

function callToGroupKey(kind: string): GroupKey {
  if (kind === "SHIP IT?") return "ship";
  if (kind === "WORTH BUILDING?") return "building";
  if (kind === "WORTH RE-EXAMINING?") return "challenge";
  if (kind === "SPEND") return "spend";
  return "building"; // fallback
}

export function TriageQueue({
  calls,
  onDecide,
  isEmpty = false,
  emptyState,
}: TriageQueueProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<GroupKey>>(new Set());

  if (isEmpty || calls.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  // Group calls by kind
  const groups = new Map<GroupKey, Call[]>();
  for (const call of calls) {
    const key = callToGroupKey(call.kind);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(call);
  }

  // Sort groups by order, filter out empty
  const sortedGroups = Array.from(groups.entries())
    .sort((a, b) => GROUP_ORDER[a[0]].order - GROUP_ORDER[b[0]].order)
    .filter(([, calls]) => calls.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {sortedGroups.map(([groupKey, groupCalls]) => {
        const isExpanded = expandedGroups.has(groupKey);
        const topCall = groupCalls[0];
        const restCount = groupCalls.length - 1;

        return (
          <div key={groupKey} className="flex flex-col gap-3">
            {/* Top card (always shown) */}
            <CallCard
              key={topCall.id}
              kind={topCall.kind}
              expiry={topCall.expiry}
              title={topCall.title}
              body={topCall.body}
              ev={topCall.ev}
              okLabel={topCall.okLabel}
              noLabel={topCall.noLabel}
              consequence={topCall.consequence}
              onOk={() => onDecide(topCall.id, true)}
              onNo={() => onDecide(topCall.id, false)}
            />

            {/* "N more" expander button (if rest exist) */}
            {restCount > 0 && (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedGroups);
                  if (isExpanded) {
                    newExpanded.delete(groupKey);
                  } else {
                    newExpanded.add(groupKey);
                  }
                  setExpandedGroups(newExpanded);
                }}
                style={{
                  fontSize: 13,
                  padding: "6px 0",
                  background: "none",
                  border: "none",
                  color: "var(--text-subtle)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = "var(--text-muted)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "var(--text-subtle)";
                }}
              >
                {isExpanded ? "Hide" : `${restCount} more`}
              </button>
            )}

            {/* Rest of calls (shown only when expanded) */}
            {isExpanded &&
              groupCalls.slice(1).map((call) => (
                <CallCard
                  key={call.id}
                  kind={call.kind}
                  expiry={call.expiry}
                  title={call.title}
                  body={call.body}
                  ev={call.ev}
                  okLabel={call.okLabel}
                  noLabel={call.noLabel}
                  consequence={call.consequence}
                  onOk={() => onDecide(call.id, true)}
                  onNo={() => onDecide(call.id, false)}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
