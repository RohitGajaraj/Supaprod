import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Action, Num, ReadFailed } from "@/components/meridian/surface-parts";
import { reasonLine } from "@/lib/error-copy";
import { openAsk } from "@/lib/ask-open";
import { getFocusNext, type FocusInsight } from "@/lib/brain/insights.functions";

export function FocusNext({ workspaceId }: { workspaceId: string | null }) {
  const navigate = useNavigate();
  const fetchFocus = useServerFn(getFocusNext);

  const focus = useQuery<FocusInsight | null>({
    queryKey: ["brain", "focus-next", workspaceId],
    queryFn: () => fetchFocus({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
    staleTime: 5 * 60 * 1000,
  });

  /* A FAILED READ IS NOT SILENCE, and until 2026-08-10 this line made it look
     like silence: `isError` was folded in with `isLoading` and "no data", so the
     Director's read vanished from Today with no mark whenever the brain could
     not be reached.
     That is the one failure this product cannot afford to render quietly. The
     whole claim is that the brain has something to say about what to build next;
     an empty space where its recommendation should be reads as "it considered
     your work and had no view", which is the most damaging possible false
     message. The user cannot tell a calm morning from a broken one.
     primitives.tsx states the doctrine directly -- "A read that FAILED is not an
     empty state, and must never wear one's clothes" -- and TrustDial.tsx already
     honours it. This now does too.
     Loading still returns null deliberately, and the reason it gives is now
     HALF STALE: it said "this panel sits below the fold". **Measured on a
     1512x982 laptop on 2026-09-01, it does not** - after A07 folded the board
     into the home, this region is the fourth thing above the fold. The
     CONCLUSION survives and the premise does not: a skeleton here would still
     pull the eye away from the composer the page opens on, and absence during a
     200ms fetch is still not a claim while absence after a failure is. Recorded
     rather than quietly rewritten, because the next person to move this region
     should know its stated reason expired before its behaviour did. */
  if (focus.isError) {
    return (
      <section className="today-director" aria-labelledby="today-director-title">
        <div className="today-section-head">
          <span className="today-kicker" id="today-director-title">
            Director&rsquo;s read
          </span>
        </div>
        {/* THE SERVER KNEW WHY AND THIS THREW IT AWAY.
            Measured on the running product 2026-09-01: `getFocusNext` returns
            HTTP 200 carrying **"AI rate limit reached. Try again in a moment."**
            and this box rendered "the brain did not answer" - a VAGUER sentence
            than the one it was handed, and one with no next action in it. R-20
            §3 asks that a failure name the thing that failed AND the next step;
            the next step was already in the payload.

            `reasonLine` rather than `failureLine`, which is the doctrine in
            `error-copy.ts` and not a preference: this renders INSIDE
            `ReadFailed`, whose `wayOut` already supplies the ended-session
            sentence, and `failureLine` here would print that sentence twice in
            one box - the defect that file records at nine sites the day `error`
            was passed everywhere. */}
        <ReadFailed error={focus.error} onRetry={() => void focus.refetch()}>
          {reasonLine(
            "The brain did not answer, so there is no read on what to build next. This is a failed look-up, not a quiet morning.",
            focus.error,
          )}
        </ReadFailed>
      </section>
    );
  }
  if (focus.isLoading || !focus.data) return null;

  const recommendation = focus.data;
  const evidence = recommendation.evidence;
  const recency = formatHours(evidence.recencyHours);
  const move = recommendation.recommendedAction;

  return (
    <section className="today-director" aria-labelledby="today-director-title">
      <div className="today-section-head">
        <span className="today-kicker">Director's read</span>
        <span className="today-director-rank">Ranked from live evidence</span>
      </div>
      <h2 id="today-director-title" className="today-director-title">
        {recommendation.headline}
      </h2>
      <p className="today-director-detail">{recommendation.detail}</p>
      <div className="today-director-evidence" aria-label="Why this ranked first">
        <span>
          Severity <Num>{evidence.severity}</Num> of 5
        </span>
        <span>
          Last heard{" "}
          {recency.n === null ? (
            recency.rest
          ) : (
            <>
              <Num>{recency.n}</Num>
              {recency.rest}
            </>
          )}
        </span>
        {evidence.novelty !== null ? (
          <span>
            <Num>{Math.round(evidence.novelty * 100)}%</Num> new against the record
          </span>
        ) : null}
      </div>
      {move ? (
        <div className="today-director-move">
          <div>
            <div className="today-recommendation-label">Recommended move</div>
            <div>{move.goal}</div>
            {move.agent_slug ? (
              <span className="font-mrd-mono text-mrd-nano tracking-mrd-label uppercase text-mrd-mute mt-mrd-2 inline-block">
                {move.agent_slug}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-mrd-3">
            <Action onClick={() => openAsk(move.goal)}>Hand it over</Action>
            <Action
              variant="quiet"
              title="Open supporting evidence in Discover"
              onClick={() =>
                navigate({
                  to: "/discover",
                  search: recommendation.themeId
                    ? ({ focus: recommendation.themeId } as never)
                    : undefined,
                })
              }
            >
              See evidence
            </Action>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatHours(hours: number): { n: number | null; rest: string } {
  if (!Number.isFinite(hours) || hours < 0) return { n: null, rest: "recently" };
  if (hours < 1) return { n: null, rest: "under an hour ago" };
  if (hours < 24) return { n: Math.round(hours), rest: "h ago" };
  const days = Math.round(hours / 24);
  return days === 1 ? { n: null, rest: "yesterday" } : { n: days, rest: "d ago" };
}
