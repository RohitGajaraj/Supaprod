/**
 * THE RUN'S VALUE AUDIT -- cost beside promise, in one glance.
 *
 * "Was it worth what it cost" had no surface anywhere (§0.6 gap #7). This
 * block is the answer, and it deliberately reads like a receipt rather than a
 * dashboard: three figures off the runs' own receipts (time, tokens, money)
 * under the sentence the person opened the work with. The pairing is the
 * audit -- cost without the promise is just a bill.
 *
 * ALL THREE READS ARE CACHE ENTRIES THE PANE ALREADY HOLDS: activity for the
 * receipts (same key as the transcript), chain for the track row. Subscribing
 * here costs no second request; a run that moves updates this block on the
 * same beat as everything else on the page.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ReadFailedLine, Region } from "@/components/meridian/surface-parts";
import { getTrackActivity, getTrackChain } from "@/lib/spine/track.functions";
import { costLines, costSummary } from "./cost-summary";

export function RunCost({
  trackId,
  promised,
}: {
  trackId: string;
  /** The person's opening sentence -- what this work was supposed to be. */
  promised?: string | null;
}) {
  const fetchActivity = useServerFn(getTrackActivity);
  const fChain = useServerFn(getTrackChain);

  // Both keys belong to other panes on this page; these are free reads.
  const q = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fetchActivity({ data: { trackId } }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
  const chain = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  /*
   * THE PROMISE FALLS BACK TO THE CHAIN PAYLOAD'S TITLE when the caller has no
   * origin to hand over -- a name is weaker than the person's own sentence but
   * still names what the cost bought.
   */
  const fallbackPromise = chain.data?.track?.title ?? null;
  const promise = promised?.trim() ? promised : fallbackPromise;

  const turns = q.data?.turns ?? [];
  const s = costSummary(turns);
  const lines = costLines(s);

  /*
   * A FAILED READ IS NOT A FREE RUN.
   *
   * `q.data` is undefined when the read fails, so `turns` falls to [] and
   * `s.turns` to 0, and this block used to disappear. Disappearing is not the
   * neutral act it looks like: on the one panel that reports money, absence
   * reads as "nothing was spent", and a person reviewing a run that HAS spent
   * would take silence for a zero. Same family as the approvals heading that
   * called a failed read an empty queue, and quieter, which is why it survived
   * longer.
   *
   * Checked before the zero branch, because the zero is what the error
   * MANUFACTURES. Stated with the retry the rest of this surface uses.
   */
  if (q.isError) {
    return (
      <Region title="What it has cost" sub={promise ? `You asked for: “${promise}”` : undefined}>
        <ReadFailedLine onRetry={() => void q.refetch()} error={q.error}>
          What this cost did not load, so nothing here would be trustworthy. Whatever it spent is
          unchanged.
        </ReadFailedLine>
      </Region>
    );
  }

  if (s.turns === 0) {
    // Not an error and not interesting yet: nothing has been spent because
    // nothing has run. Distinct from the branch above, which is a read that
    // failed rather than a run that has not started.
    return null;
  }

  return (
    <Region title="What it has cost" sub={promise ? `You asked for: “${promise}”` : undefined}>
      <div className="flex flex-col gap-mrd-1">
        {lines.map((line) => (
          <p key={line} className="mrd-meta">
            {line}
          </p>
        ))}
        {chain.data?.track?.status === "open" ? (
          <p className="mrd-meta">The work is still open, so these figures are not final.</p>
        ) : null}
      </div>
    </Region>
  );
}

export default RunCost;
