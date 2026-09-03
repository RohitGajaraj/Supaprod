/**
 * ── THE VISIT, STAMPED ONCE, FROM THE MOUNT (P-69) ───────────────────────
 *
 * `brain_last_seen` is what Start's "since you last looked" counts from. This
 * is the only thing that writes it, and it is a hook rather than a line in a
 * `queryFn` on purpose -- see `stamp-the-last-look.functions.ts` for the full
 * argument. In short: a refetch, a prefetch, a retry and a second tab polling
 * are all reads, and none of them is a person looking.
 *
 * ── ONCE PER VISIT, AND PER WORKSPACE ────────────────────────────────────
 *
 * The ref keys on the workspace rather than being a bare boolean, so switching
 * workspaces without unmounting stamps the new one. A boolean would have
 * stamped the first workspace a person landed in and then silently stopped,
 * which is worse than not stamping at all: the count would look maintained.
 *
 * NOTHING IS AWAITED AND NOTHING IS SHOWN. The stamp changes a sentence on
 * another surface; it must never delay, block or interrupt the one being
 * opened, and its failure is recorded server-side rather than surfaced here.
 */
import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { stampLastLook } from "@/lib/start/stamp-the-last-look.functions";

export function useStampTheLastLook(workspaceId: string | null | undefined): void {
  const stamp = useServerFn(stampLastLook);
  const qc = useQueryClient();
  const stampedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    const ws = workspaceId ?? null;
    // No workspace is not a visit to one: the row is keyed on it.
    if (!ws) return;
    if (stampedFor.current === ws) return;
    stampedFor.current = ws;

    void stamp({ data: { workspaceId: ws } }).then((r) => {
      /*
       * The count on Start is derived from this row, so it is stale the instant
       * this lands. Invalidated rather than left to `staleTime`, because a
       * person who opens Arriving and goes straight back to Start would
       * otherwise read a since-count from BEFORE the visit they just made.
       */
      if (r?.stamped) void qc.invalidateQueries({ queryKey: ["start-home-answers"] });
    });
  }, [workspaceId, stamp, qc]);
}
