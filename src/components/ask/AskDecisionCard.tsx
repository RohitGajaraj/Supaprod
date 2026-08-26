/**
 * Ask Decision Card — Show forecast vs actual in Ask responses
 *
 * When Ask answers a question about decisions, this component embeds decision
 * cards directly in the conversation. Shows forecast (what we believed) vs actual
 * (what happened), side-by-side, so the moat — learning compounds — is visible
 * in the moment the user is asking.
 *
 * Unlike DecisionCard (which is standalone), AskDecisionCard is sized for
 * embedding in a turn's answer column and includes citation/provenance.
 */

import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type Learning = Database["public"]["Tables"]["learnings"]["Row"];

interface AskDecisionCardProps {
  decision: Decision;
  learning?: Learning | null;
  showResolution?: boolean;
}

interface DecisionVerdictDisplay {
  predicted: string;
  predictedDate: string;
  actual: string;
  actualDate: string;
  verdict: "RIGHT" | "WRONG" | "INCONCLUSIVE" | "PENDING";
  resolvedBy?: "human" | "agent";
}

const VERDICT_COLORS = {
  RIGHT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  WRONG: "bg-rose-500/20 text-rose-400 border-rose-500/20",
  INCONCLUSIVE: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  PENDING: "bg-zinc-600/20 text-zinc-400 border-zinc-600/20",
};

const VERDICT_ICONS = {
  RIGHT: "✓",
  WRONG: "✕",
  INCONCLUSIVE: "?",
  PENDING: "⏳",
};

export function AskDecisionCard({
  decision,
  learning,
  showResolution = true,
}: AskDecisionCardProps) {
  const [verdict, setVerdict] = useState<DecisionVerdictDisplay | null>(null);

  useEffect(() => {
    // Prediction
    const predicted = (decision.forecast_claim || "No forecast recorded") as string;
    const predictedDate = decision.forecast_horizon_date
      ? new Date(decision.forecast_horizon_date).toLocaleDateString()
      : "No horizon set";

    // Resolution
    let actual = "Waiting for outcome…";
    let actualDate = "";
    let verdictType: "RIGHT" | "WRONG" | "INCONCLUSIVE" | "PENDING" = "PENDING";
    let resolvedBy: "human" | "agent" | undefined;

    if (learning && learning.verdict) {
      actual = learning.verdict as string;
      actualDate = new Date(learning.created_at).toLocaleDateString();

      // Verdict mapping
      if (actual.toLowerCase().includes("correct") || actual.toLowerCase().includes("right")) {
        verdictType = "RIGHT";
      } else if (
        actual.toLowerCase().includes("wrong") ||
        actual.toLowerCase().includes("incorrect")
      ) {
        verdictType = "WRONG";
      } else if (
        actual.toLowerCase().includes("inconclusive") ||
        actual.toLowerCase().includes("unclear")
      ) {
        verdictType = "INCONCLUSIVE";
      }

      // Resolve who graded: non-null recorded_by_agent_slug means agent
      resolvedBy = learning.recorded_by_agent_slug != null ? "agent" : "human";
    }

    setVerdict({
      predicted,
      predictedDate,
      actual,
      actualDate,
      verdict: verdictType,
      resolvedBy,
    });
  }, [decision, learning]);

  if (!verdict) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
      {/* Verdict badge */}
      {showResolution && (
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border font-medium text-xs ${VERDICT_COLORS[verdict.verdict]}`}
        >
          <span>{VERDICT_ICONS[verdict.verdict]}</span>
          <span>{verdict.verdict}</span>
          {verdict.resolvedBy === "agent" && (
            <span className="text-xs opacity-75 ml-0.5">(auto-graded)</span>
          )}
        </div>
      )}

      {/* Prediction vs Actual */}
      <div className="grid grid-cols-2 gap-3">
        {/* Predicted */}
        <div className="border border-zinc-800 rounded p-2 bg-blue-500/5">
          <p className="text-xs font-medium text-zinc-400 mb-1">PREDICTED</p>
          <p className="text-xs text-white mb-1 line-clamp-2">{verdict.predicted}</p>
          <p className="text-xs text-zinc-500">By: {verdict.predictedDate}</p>
        </div>

        {/* Actual */}
        <div className="border border-zinc-800 rounded p-2 bg-emerald-500/5">
          <p className="text-xs font-medium text-zinc-400 mb-1">ACTUAL</p>
          {verdict.verdict === "PENDING" ? (
            <p className="text-xs text-zinc-500 italic">{verdict.actual}</p>
          ) : (
            <>
              <p className="text-xs text-white mb-1 line-clamp-2">{verdict.actual}</p>
              <p className="text-xs text-zinc-500">On: {verdict.actualDate}</p>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
