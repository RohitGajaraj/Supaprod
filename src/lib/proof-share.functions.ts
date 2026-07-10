/**
 * RPT-30 — the public calibration scorecard (the redacted twin of PRF-01).
 *
 * getProofSurfaceExtras (proof-surface.functions.ts) is admin-gated and mixes
 * in genuinely private data (agent spend, gated-approval friction). This file
 * exposes ONLY the safe subset publicly: the prediction hit rate ("Cadence
 * called N of the last M") and the supersessions-caught total. No auth, no
 * agentCost, no babysittingTax — reuses the SAME computation the admin panel
 * runs (computePredictionHitRate / computeSupersessionsCaught), so the public
 * number and the internal number can never drift apart.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  computePredictionHitRate,
  computeSupersessionsCaught,
  type PredictionHitRate,
  type SupersessionsCaught,
} from "@/lib/proof-surface.functions";

export type PublicCalibration = {
  predictionHitRate: PredictionHitRate;
  /** Only the total is public-safe; last30d/trend stay internal (no operational cadence signal). */
  supersessionsCaughtTotal: number;
};

/** PUBLIC (no auth) — powers the /proof page. */
export const getPublicCalibration = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCalibration> => {
    const [predictionHitRate, supersessionsCaught] = await Promise.all([
      computePredictionHitRate(),
      computeSupersessionsCaught(),
    ]);
    return { predictionHitRate, supersessionsCaughtTotal: supersessionsCaught.total };
  },
);
