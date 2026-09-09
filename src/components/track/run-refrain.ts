/**
 * THE REFRAIN, WHERE THE PERSON ACTUALLY LANDS.
 *
 * `whatItKeepsSaying` computes it and `TrackActivity` already draws it above the
 * transcript — but the transcript starts about 350px down a scrolling pane, so
 * on arrival the answer is below the fold and the first thing a person reads is
 * still the hold card telling them the machinery gave up. The whole point of
 * the finding is that the run already said why; putting that below the fold is
 * half a fix.
 *
 * ── ONE READ, TWO PLACES, AND THAT IS THE ONLY REASON THIS IS A HOOK ────────
 * `["track-activity", trackId]` is the key the transcript, the pane and
 * `useRunTally` all hold, deliberately: `run-tally.ts`'s own header states the
 * rule — *"One fact about one run must not have two freshnesses… a private key
 * here would run both server functions a second time on every run a person
 * opens."* This mounts the identical key, function and `staleTime`, so TanStack
 * serves it from the same entry and the hold card costs no hop at all.
 *
 * A callback down from `TrackActivity` (the shape `onLiveSeats` uses) was the
 * other option and is worse here: it would make the hold card's content depend
 * on a child further down the tree having rendered, so the sentence would
 * appear a frame late and vanish whenever the transcript was unmounted.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackActivity } from "@/lib/spine/track.functions";
import { whatItKeepsSaying, type Refrain } from "@/lib/spine/what-it-keeps-saying";

/**
 * What this run keeps saying, or null when it is not repeating itself.
 *
 * Null while the read is in flight, which is the honest state: a refrain is a
 * statement about a set of turns, and there is no set yet. Nothing renders, and
 * nothing reflows into place except the sentence itself once it is known.
 */
export function useRefrain(trackId: string): Refrain | null {
  const fActivity = useServerFn(getTrackActivity);
  const activity = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fActivity({ data: { trackId } }),
    staleTime: 5_000,
  });
  return whatItKeepsSaying(activity.data?.turns ?? []);
}
