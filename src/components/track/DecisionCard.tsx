/**
 * Decision Card — The Core Mission Bet
 *
 * Show what was predicted to happen vs what actually happened.
 * This is the irreplaceable signal: forecasts made before outcomes known.
 *
 * This is THE moat. Competitors cannot backfill what was believed before the outcome existed.
 *
 * Goal: "I can see if my call was right and learn for next time"
 * User value: Judgment compounds over time because the system learns
 */

import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type Learning = Database["public"]["Tables"]["learnings"]["Row"];

interface DecisionVerdict {
  predicted: string;
  predictedDate: string;
  actual: string;
  actualDate: string;
  verdict: "RIGHT" | "WRONG" | "INCONCLUSIVE" | "PENDING";
  confidence?: number;
  sampleSize?: number;
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

interface DecisionCardProps {
  decision?: Decision;
  learning?: Learning;
  showResolution?: boolean;
}

export function DecisionCard({ decision, learning, showResolution = true }: DecisionCardProps) {
  const [verdict, setVerdict] = useState<DecisionVerdict | null>(null);

  useEffect(() => {
    if (!decision) {
      setVerdict(null);
      return;
    }

    // Prediction
    const predicted = (decision.forecast_claim || "No forecast recorded") as string;
    const predictedDate = decision.forecast_horizon_date
      ? new Date(decision.forecast_horizon_date).toLocaleDateString()
      : "No horizon set";

    // Resolution
    let actual = "Waiting for outcome…";
    let actualDate = "";
    let verdictType: "RIGHT" | "WRONG" | "INCONCLUSIVE" | "PENDING" = "PENDING";
    let confidence: number | undefined;
    let sampleSize: number | undefined;
    let resolvedBy: "human" | "agent" | undefined;

    if (learning && learning.verdict) {
      actual = learning.verdict as string;
      actualDate = new Date(learning.created_at).toLocaleDateString();

      // Verdict mapping (simplified: in real implementation, this comes from forecast_resolution)
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

      // Confidence from learning metadata
      const metadata = (learning.metadata as Record<string, any>) || {};
      confidence = metadata.confidence as number | undefined;
      sampleSize = metadata.sampleSize as number | undefined;
      resolvedBy = metadata.resolvedBy as "human" | "agent" | undefined;
    }

    setVerdict({
      predicted,
      predictedDate,
      actual,
      actualDate,
      verdict: verdictType,
      confidence,
      sampleSize,
      resolvedBy,
    });
  }, [decision, learning]);

  if (!verdict) {
    return (
      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
        <p className="text-sm text-zinc-500">No decision recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Verdict badge */}
      {showResolution && (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${VERDICT_COLORS[verdict.verdict]}`}
        >
          <span className="text-lg">{VERDICT_ICONS[verdict.verdict]}</span>
          <span>{verdict.verdict}</span>
          {verdict.resolvedBy === "agent" && (
            <span className="text-xs ml-1 opacity-75">(auto-graded)</span>
          )}
        </div>
      )}

      {/* Prediction vs Actual */}
      <div className="grid grid-cols-2 gap-4">
        {/* Predicted */}
        <div className="border border-zinc-800 rounded-lg p-3 bg-blue-500/5">
          <p className="text-xs font-medium text-zinc-400 mb-2">PREDICTED</p>
          <p className="text-sm text-white mb-2">{verdict.predicted}</p>
          <p className="text-xs text-zinc-500">By: {verdict.predictedDate}</p>
        </div>

        {/* Actual */}
        <div className="border border-zinc-800 rounded-lg p-3 bg-emerald-500/5">
          <p className="text-xs font-medium text-zinc-400 mb-2">ACTUAL</p>
          {verdict.verdict === "PENDING" ? (
            <p className="text-sm text-zinc-500 italic">{verdict.actual}</p>
          ) : (
            <>
              <p className="text-sm text-white mb-2">{verdict.actual}</p>
              <p className="text-xs text-zinc-500">On: {verdict.actualDate}</p>
            </>
          )}
        </div>
      </div>

      {/* Metadata: confidence and sample size */}
      {verdict.confidence !== undefined && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/30 text-xs">
          <span className="text-zinc-400">Confidence:</span>
          <span className="font-medium text-white">{Math.round(verdict.confidence * 100)}%</span>
          {verdict.sampleSize && (
            <>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">Sample size:</span>
              <span className="font-medium text-white">{verdict.sampleSize}</span>
            </>
          )}
        </div>
      )}

      {/* Key message */}
      <p className="text-xs text-zinc-500 px-1">
        {verdict.verdict === "PENDING"
          ? "Waiting for the horizon date to arrive. This forecast cannot be graded until then."
          : "This is how you learn. The forecast was captured before the outcome was known. Your next call gets smarter because of this."}
      </p>
    </div>
  );
}
