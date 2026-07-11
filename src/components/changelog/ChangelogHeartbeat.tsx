import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Gavel, GitCommitVertical } from "lucide-react";
import { getChangelogHeartbeat } from "@/lib/changelog-heartbeat.functions";
import type { HeartbeatWeek } from "@/lib/changelog-heartbeat";

type Props = {
  workspaceId: string;
  weeks?: number;
};

/** Format a Monday date (YYYY-MM-DD, UTC) as a calm "Jul 6" style label. */
function formatWeekOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * RPT-45 - the workspace's weekly heartbeat: what shipped, what was decided,
 * week by week. Empty weeks stay visible on purpose, because a heartbeat that
 * hides the quiet weeks would not be honest. Everything shown is real: merged
 * changesets that carry release notes, and decisions that have been resolved.
 */
export function ChangelogHeartbeat({ workspaceId, weeks = 6 }: Props) {
  const fn = useServerFn(getChangelogHeartbeat);
  const { data, isLoading, error } = useQuery({
    queryKey: ["changelog-heartbeat", workspaceId, weeks],
    queryFn: () => fn({ data: { workspaceId, weeks } }),
    enabled: !!workspaceId,
  });

  return (
    <div className="rounded-lg border hairline bg-card/60 p-5">
      <div className="mono-label mb-1 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Changelog heartbeat</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        What shipped and what was decided, week by week. Drawn straight from merged changesets and
        recorded decisions. No estimates.
      </p>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Reading the beat.</p>
      ) : error ? (
        <p className="text-xs text-destructive">Could not load the heartbeat.</p>
      ) : !data || data.weeks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No history in this window yet.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <GitCommitVertical className="h-3 w-3" />
              {data.totals.shipped} shipped
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gavel className="h-3 w-3" />
              {data.totals.decided} decided
            </span>
            <span>over {data.weeks.length} weeks</span>
          </div>

          <div className="space-y-4">
            {data.weeks.map((week) => (
              <WeekRow key={week.week_of} week={week} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeekRow({ week }: { week: HeartbeatWeek }) {
  const quiet = week.shipped_count === 0 && week.decided_count === 0;
  return (
    <section className="border-t hairline pt-3 first:border-t-0 first:pt-0">
      <div className="mono-label text-[10px] text-muted-foreground mb-2 flex items-center justify-between gap-2">
        <span>Week of {formatWeekOf(week.week_of)}</span>
        {!quiet ? (
          <span className="normal-case tracking-normal opacity-70">
            {week.shipped_count} shipped, {week.decided_count} decided
          </span>
        ) : null}
      </div>

      {quiet ? (
        <p className="text-xs text-muted-foreground/70 italic">Nothing shipped or decided.</p>
      ) : (
        <div className="space-y-2.5">
          {week.shipped.map((s, i) => (
            <div key={`s-${i}`} className="flex items-start gap-2">
              <GitCommitVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm leading-snug flex items-center gap-2 flex-wrap">
                  <span>{s.title}</span>
                  {s.pr_url ? (
                    <a
                      href={s.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mono-label text-[9px] px-1.5 py-0.5 rounded border hairline text-muted-foreground hover:text-foreground"
                    >
                      PR
                    </a>
                  ) : null}
                </div>
                {s.notes ? (
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {s.notes}
                  </p>
                ) : null}
              </div>
            </div>
          ))}

          {week.decided.map((d, i) => (
            <div key={`d-${i}`} className="flex items-start gap-2">
              <Gavel className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 text-sm leading-snug flex items-center gap-2 flex-wrap">
                <span>{d.title}</span>
                <span className="mono-label text-[9px] text-muted-foreground opacity-70">
                  {d.agent}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
