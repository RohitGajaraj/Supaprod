import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button, Num } from "@/components/shell/primitives";
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

  if (focus.isLoading || focus.isError || !focus.data) return null;

  const recommendation = focus.data;
  const evidence = recommendation.evidence;
  const recency = formatHours(evidence.recencyHours);

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
      {recommendation.recommendedAction ? (
        <div className="today-director-move">
          <div>
            <div className="today-recommendation-label">Recommended move</div>
            <div>{recommendation.recommendedAction.goal}</div>
          </div>
          <Button
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
          </Button>
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
