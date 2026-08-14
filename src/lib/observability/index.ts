/**
 * AFD façade — single import surface for the entire app. Vendor swap = swap one folder.
 *
 * Plan: docs/planning/analytics-and-failure-detection-plan.md
 */
export { track, identify, type TrackEvent, type TrackProps } from "./analytics";
export { captureError, recordErrorEvent, type ErrorContext } from "./errors";
export {
  GATE_CODES,
  classifyFailureCode,
  isGateCode,
  noteGate,
  type GateCode,
  type GateKind,
  type GateContext,
} from "./gates";
export { heartbeat } from "./uptime";
export { withJobRun, withJobRunHttp, type JobRunOptions } from "./jobs";
export { isMissingDatabaseObject, type PostgrestLikeError } from "./absence";
export { observabilityGateOn, readObservabilityConfig } from "./config";
