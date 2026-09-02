import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Action, Num, ReadFailedLine } from "@/components/meridian/surface-parts";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useWorkspace } from "@/hooks/use-workspace";
import {
  getPushedInsights,
  markInsightActioned,
  type PushedInsight,
} from "@/lib/brain-insights.functions";

/**
 * THE HEADING CLAIMED A PERIOD THIS PRODUCT CANNOT MEASURE.
 *
 * It read "What changed while you were away", which is a claim about a window
 * between two moments: when you last looked, and now. **The first of those does
 * not exist.** `when.ts` records it plainly - there is no per-user last-seen
 * watermark in this database - and the read behind this panel has no time
 * filter at all. It selects `status = 'open'` and `digest = false`, ordered by
 * `pushed_at`. An insight pushed three weeks ago that nobody answered is in
 * this list, under a heading saying it changed while you were away.
 *
 * Same defect as the board's "In the last 24 hours" subtitle, fixed the same
 * week on the same surface: a temporal scope stated over data that carries no
 * such scope. The idea behind it is right and still unbuildable, and it is a
 * column to add rather than a claim to keep making loosely.
 *
 * "Evidence you have not answered" is what the read actually returns, and it
 * agrees with the count beside it, which says "N open".
 *
 * AND THE SUBTITLE NO LONGER OPENS WITH THE KICKER'S OWN WORDS. "New evidence"
 * sat in the eyebrow and again as the first two words of the sentence under it,
 * which is the restatement this board spent the week removing everywhere else.
 */
export function PushedInsights() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const fetchPushed = useServerFn(getPushedInsights);
  const markActioned = useServerFn(markInsightActioned);
  /* THE WORKSPACE ID BELONGS IN THE KEY, and until 2026-08-10 it was missing.
     The query FUNCTION reads `workspaceId` but the KEY did not name it, so every
     workspace shared one cache entry: switch workspace and this panel served the
     previous one's insights until the 10-minute staleTime expired. On a surface
     headed "What changed while you were away" (renamed since; see the note at
     the top of this file), that is one tenant's evidence rendered under another
     tenant's heading.
     FocusNext.tsx in this same folder already keys on workspaceId correctly,
     which is how the divergence was visible at all. */
  const queryKey = ["brain", "pushed-insights", workspaceId] as const;

  const pushed = useQuery({
    queryKey,
    queryFn: () => fetchPushed({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
    staleTime: 10 * 60 * 1000,
  });

  const settle = useMutation({
    mutationFn: (value: { id: string; outcome: "acted" | "dismissed" }) =>
      markActioned({ data: value }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey });
      const before = queryClient.getQueryData<{ insights: PushedInsight[] }>(queryKey);
      queryClient.setQueryData<{ insights: PushedInsight[] } | undefined>(queryKey, (current) =>
        current ? { insights: current.insights.filter((insight) => insight.id !== id) } : current,
      );
      return { before };
    },
    onError: (_error, _value, ctx) => {
      /* Rolls back through `queryKey`, not through a hand-written copy of it.
         This used to restore into the literal ["brain", "pushed-insights"], which
         happened to match only while the key omitted the workspace id -- so the
         moment that was corrected above, the optimistic removal would have been
         written to one cache entry and restored to another, and a failed dismiss
         would have silently eaten the row. */
      if (ctx?.before) queryClient.setQueryData(queryKey, ctx.before);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  });

  /* Same doctrine as FocusNext, and the same correction on the same date: a
     failed read used to return null here, so this panel disappeared entirely
     rather than saying it could not look. On the one
     surface a person opens to find out what happened overnight, an absent panel
     is read as "nothing happened", which is precisely the opposite of the truth
     when the read failed. Loading still returns null; a failure does not. */
  if (pushed.isError) {
    return (
      <section className="today-notices" aria-labelledby="today-notices-title">
        <div className="today-notices-head">
          <div>
            <div className="today-kicker">New evidence</div>
            <h2 id="today-notices-title">Evidence you have not answered</h2>
          </div>
        </div>
        <ReadFailedLine error={pushed.error} onRetry={() => void pushed.refetch()}>
          This did not load, so nothing here can be trusted to be the full picture. Evidence may
          have arrived that this cannot show.
        </ReadFailedLine>
      </section>
    );
  }
  if (pushed.isLoading) return null;
  const insights = pushed.data?.insights ?? [];
  if (insights.length === 0) return null;

  return (
    <section className="today-notices" aria-labelledby="today-notices-title">
      <div className="today-notices-head">
        <div>
          <div className="today-kicker">New evidence</div>
          <h2 id="today-notices-title">Evidence you have not answered</h2>
        </div>
        <span className="today-notices-count">
          <Num>{insights.length}</Num> open
        </span>
      </div>
      <p className="today-notices-sub">
        Something arrived that changed a standing call, or connected two things you had treated
        separately.
      </p>
      <div className="today-notice-list">
        {insights.map((i) => {
          const kind = insightKind(i.kind);
          return (
            <article className="today-notice" data-evidence-kind={kind.tone} key={i.id}>
              <div className="today-notice-copy">
                <span className="today-evidence-kind">{kind.label}</span>
                <h3>{i.title}</h3>
                <p>{i.body}</p>
              </div>
              <div className="today-notice-actions">
                {/* TIER: Action, default face - the click writes outcome=acted
                    before navigating, so it is a mutation and not a plain
                    button; navigation shares the step, so not primary. */}
                <Action
                  busy={settle.isPending}
                  onClick={() => {
                    navigate({ to: targetRoute(i.action.kind) });
                    settle.mutate({ id: i.id, outcome: "acted" });
                  }}
                >
                  {i.action.label}
                </Action>
                {/* TIER: Action, quiet face - the click writes outcome=dismissed;
                    the secondary settle beside the act. */}
                <Action
                  variant="quiet"
                  busy={settle.isPending}
                  onClick={() => settle.mutate({ id: i.id, outcome: "dismissed" })}
                  title="Dismiss this update. It remains part of the record."
                >
                  Dismiss
                </Action>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type InsightTone = "changed" | "challenged" | "connected";

function insightKind(kind: string): { label: string; tone: InsightTone } {
  switch (kind) {
    case "ground_shift":
      return { label: "Decision changed", tone: "changed" };
    case "bet_contradiction":
      return { label: "Contradicting evidence", tone: "challenged" };
    case "assumption_miss":
      return { label: "Assumption missed", tone: "challenged" };
    default:
      return { label: "Connected evidence", tone: "connected" };
  }
}

function targetRoute(kind: string): string {
  switch (kind) {
    case "open_opportunity":
    case "rerank_bets":
    case "open_decision":
      return "/decide";
    case "open_theme":
      return "/arriving";
    case "open_prd":
      return "/plan";
    case "start_mission":
      return "/build";
    case "open_metric":
      return "/learn";
    default:
      return "/outcomes";
  }
}
