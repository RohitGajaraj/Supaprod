import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Polling hook for OAuth connection flows.
 *
 * Handles invalidating a query key at 3s intervals for up to durationMs.
 * If startPolling is called while already polling, the prior interval is
 * cancelled and a fresh one starts (cancel-and-restart semantics).
 *
 * Automatically cleans up on unmount.
 *
 * @param queryKey The React Query key to invalidate (e.g., ["connections"])
 * @param durationMs How long to poll (default: 5 min)
 * @returns A `startPolling()` callback to trigger the poll cycle
 */
export function useConnectPoll(queryKey: string[], durationMs: number = 5 * 60 * 1000): () => void {
  const qc = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Unmount cleanup: cancel any active interval
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Cancel-and-restart: clear prior interval, then start a fresh one
  const startPolling = useCallback(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const deadline = Date.now() + durationMs;
    intervalRef.current = setInterval(() => {
      qc.invalidateQueries({ queryKey });
      if (Date.now() > deadline) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    }, 3_000);
  }, [qc, queryKey, durationMs]);

  return startPolling;
}
