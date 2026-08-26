/**
 * Ask Decisions Section — Display multiple decisions in Ask response
 *
 * When Ask answers a question like "what did we decide about user signup?" or
 * "show me recent forecast outcomes", this section displays all matching decisions
 * with their learnings side-by-side (forecast vs actual).
 *
 * Designed to work as a register row in AskTurn, following the pattern of
 * "Answer", "From the record", etc.
 */

import type { Database } from "@/integrations/supabase/types";
import { AskDecisionCard } from "./AskDecisionCard";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type Learning = Database["public"]["Tables"]["learnings"]["Row"];

export interface DecisionWithLearning {
  decision: Decision;
  learning: Learning | null;
}

interface AskDecisionsSectionProps {
  decisions: DecisionWithLearning[];
  title?: string;
  showResolution?: boolean;
}

export function AskDecisionsSection({
  decisions,
  title = "Decisions & Outcomes",
  showResolution = true,
}: AskDecisionsSectionProps) {
  if (!decisions || decisions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-4 pt-3 border-t border-zinc-800">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide px-1">{title}</p>

      <div className="space-y-2">
        {decisions.map((item) => (
          <AskDecisionCard
            key={item.decision.id}
            decision={item.decision}
            learning={item.learning}
            showResolution={showResolution}
          />
        ))}
      </div>

      {decisions.length > 0 && (
        <p className="text-xs text-zinc-500 px-1 pt-1">
          {decisions.filter((d) => d.learning).length} of {decisions.length} resolved
        </p>
      )}
    </div>
  );
}
