/**
 * Activation funnel events and tracking types for PC-06.
 * The funnel tracks: signup → connect → first-teardown → first-mission → week-2-return
 */

export type FunnelStage =
  | "signup"
  | "connected"
  | "first_teardown"
  | "first_mission"
  | "week_2_return";

export interface FunnelMilestone {
  workspaceId: string;
  userId: string;
  stage: FunnelStage;
  completedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FunnelCohort {
  cohortDate: string; // YYYY-MM-DD of signup
  signups: number;
  connected: number;
  firstTeardown: number;
  firstMission: number;
  week2Return: number;
}

export interface FunnelSnapshot {
  asOfDate: string; // YYYY-MM-DD
  cohorts: FunnelCohort[];
  totalSignups: number;
  conversionToConnected: number; // percentage
  conversionToFirstTeardown: number;
  conversionToFirstMission: number;
  conversionToWeek2Return: number;
}
