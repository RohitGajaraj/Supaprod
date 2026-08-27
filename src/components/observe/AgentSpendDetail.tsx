/**
 * ONE AGENT'S SPEND. The drill-down behind a row in the Spend room.
 *
 * Ported off the retired Ember Editorial system (2026-07-29). DrillHeader,
 * MonoLabel, GraphSlider, the cards and every legacy token are gone. What
 * changed, and why:
 *
 * KILL the four stat cards. Four bordered boxes each carrying a label and a
 *      number is the card grid the founder called out, and the region they sit
 *      in is already a bordered container (anti-slop ban 5). Every one of them
 *      reads label left, fact right, which is what Line plus Value exists for,
 *      so that is the shape now. A Grid of Cells was the other candidate and
 *      was wrong here: a Grid is for a catalog scanned ACROSS, and these are
 *      four labelled measurements of one subject, read down.
 * KILL the daily-spend GraphSlider. The rebuilt system has no chart primitive,
 *      and drawing one here would be a per-screen invention, which is the exact
 *      habit the rebuild exists to stop. Eight points of one agent's daily cost
 *      also carries less than the two facts inside it: which day was heaviest,
 *      and how many of the eight had no spend at all. Both are stated in words
 *      now, off the same real series the chart was plotting, so nothing was
 *      lost but the drawing.
 * KILL the seven-column recent-runs grid. A hand-rolled
 *      "80px 90px 1fr 60px 50px 60px 90px" inside a list is a table pretending
 *      to be rows. A run is a Row now: what it served, one assembled fact under
 *      it, and when it ran.
 * KILL every "-" placeholder. A dash reads as zero at a glance, and zero is a
 *      claim. A run with no recorded duration, or with no cost tied to it, says
 *      so in words. A window where no call recorded a latency says that too,
 *      rather than showing a confident 0ms.
 * KILL the mono uppercase labels. Mono is for data only, and it reaches the
 *      screen through Num.
 * KEEP the ledger discrepancy, and keep it explained on screen. The stats come
 *      from ai_events, the authoritative per-call ledger. The runs list comes
 *      from agent_runs, whose tokens_used and spend_used_usd only count calls
 *      tied to a run id after 2026-06-03, so the runs will not add up to the
 *      spend above. That is real, not a bug, and the runs block says it.
 * KEEP the exported symbol, the prop, the query key, the server function, the
 *      30 day window and the back destination. Other files mount this; the
 *      contract is theirs.
 *
 * NO PAGE HEAD, deliberately. This is a body mounted inside someone else's
 * page: /engine-room already draws the Surface, the one h1 and the Region that
 * wraps every room body. A page heading here would put a second 25px h1 inside
 * a page that has one and give the document two top level headings. So the
 * drill subject is a Region title and the way back is that Region's own `goTo`,
 * which is the slot for leaving a region and is the same affordance the room
 * itself uses to return. Matches the sibling port of DriftSurfaceDetail, which
 * is mounted the same way.
 *
 * THE WAY BACK IS IN ALL FOUR STATES: reading, failed, empty and loaded. A
 * drill you cannot leave because the read failed is a trap.
 *
 * THE MARK. This is a per-agent view, so it wears that agent's own mark: the
 * hue is its loop stage and the silhouette is which agent. State is never a
 * hue, so the mark turns only when a run genuinely is running, and it drops to
 * quiet when the reference resolves to no agent at all rather than borrowing an
 * identity the catalog never gave it. It is drawn only once the read has
 * answered, because before that we do not know which agent, if any, this is.
 *
 * NO WRITE happens on this surface. It is a read, so there is no receipt to
 * leave: the only controls are the way back, a retry on a failed read, and the
 * drill into a mission.
 */
import { useNavigate } from "@tanstack/react-router";
import { reasonLine } from "@/lib/error-copy";
import { Row, Line } from "@/components/meridian/rows";
import {
  NothingYet,
  Num,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AgentMark, type MarkState } from "@/components/meridian/marks";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { getAgentAnalyticsDetail } from "@/lib/analytics.functions";
import { relTime, fmtUsd } from "@/components/product/format";

/** The window every stat on this surface is read over. */
const DAYS = 30;

/** The daily series the server returns, fixed at eight UTC days. */
const DAILY_DAYS = 8;

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Production's real agent_runs vocabulary: loop.server.ts writes
 *  queued/running/waiting_approval/completed/halted/failed, and the retired
 *  direct runner wrote "complete". Plain words, because "waiting_approval" is a
 *  column value rather than something a person says. A status this map does not
 *  know prints raw rather than being guessed at. */
const STATUS_WORD: Record<string, string> = {
  queued: "queued",
  running: "running",
  waiting_approval: "waiting on you",
  completed: "finished",
  complete: "finished",
  halted: "stopped",
  failed: "failed",
};

/** Colour carries the outcome and nothing else. A run still in flight has no
 *  outcome yet, so it stays monochrome. */
function statusClass(status: string): string | undefined {
  if (status === "completed" || status === "complete") return "sp-pass";
  if (status === "failed" || status === "halted") return "sp-fail";
  if (status === "waiting_approval") return "sp-warn";
  return undefined;
}

export function AgentSpendDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const fDetail = useServerFn(getAgentAnalyticsDetail);
  const q = useQuery({
    queryKey: ["agent-spend-detail", id, DAYS],
    queryFn: () => fDetail({ data: { agentSlug: id, days: DAYS } }),
  });

  const onBack = () => navigate({ to: "/engine-room", search: { room: "spend", view: "usage" } });
  // The way back, named for where it actually goes. ?view=usage with no agent
  // renders the whole spend rollup, not the by-agent list, so it does not claim
  // to be "all agents". Carried by the Region's own `goTo`, which is the slot
  // for a way OUT of a region rather than a way past a cap.
  const BACK = "The spend rollup";

  // Three distinct facts, three distinct states. A read in flight is not an
  // empty account, and a read that failed is neither. All three carry the way
  // back: a drill you cannot leave because the read failed is a trap.
  //
  // The failed read is tested FIRST, which is what lets the state below it be
  // read off the data alone. In the other order a read that had failed would
  // wear a loading state's clothes.
  if (q.error) {
    return (
      <Region
        title={agentDisplayName(id)}
        sub="The rollup did not load, so nothing here is a claim about what this one spent."
        goTo={BACK}
        onGoTo={onBack}
      >
        <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
          {reasonLine("The spend for this agent did not load.", q.error)}
        </ReadFailedLine>
      </Region>
    );
  }

  const d = q.data;
  // EVERY way a read can have no answer yet, not only the flag for a first
  // fetch in flight. An audit on 2026-08-10 found this drill rendering an empty
  // rectangle: the app's QueryClient (src/router.tsx) sets no networkMode, so
  // TanStack's default "online" mode PAUSES a query while the browser is
  // offline. status stays pending while fetchStatus goes "paused", which leaves
  // isLoading false, error null and data undefined, and this file fell past all
  // of its states to a bare `return null`. The Engine Room still drew its h1 and
  // the Region that wraps a room body, so what a person got after opening an
  // agent from the spend rollup was a bordered box with no agent name, no
  // explanation and no control back: the browser's back button was the only way
  // out, which is exactly the trap this file's header rules out. Reading it off
  // `!d` rather than off a list of query flags means the same holds for any
  // other state that has not answered, the first server render included.
  if (q.isLoading || !d) {
    return (
      <Region
        title={agentDisplayName(id)}
        sub={`What this one spent over the last ${DAYS} days.`}
        goTo={BACK}
        onGoTo={onBack}
      >
        <Reading>Reading what this one spent.</Reading>
      </Region>
    );
  }

  // A reference with nothing behind it. Genuinely empty, not a failed read: the
  // query answered, and the answer was that no call was ever recorded here.
  if (!d.agent && d.stats.calls === 0 && d.recentRuns.length === 0) {
    return (
      <Region
        title={agentDisplayName(id)}
        sub="Nothing in the catalog answers to this reference."
        goTo={BACK}
        onGoTo={onBack}
      >
        <NothingYet>
          {`No AI call has been recorded against this reference in the last ${DAYS} days. Spend appears here the first time the loop runs a model call under this name.`}
        </NothingYet>
      </Region>
    );
  }

  // Pseudo-refs (orchestrator:plan, reflect:{slug}) resolve to no agents row.
  // Their per-call stats are real, so they render; the agent_runs sections
  // cannot be, because agent_slug has nothing to match, so they are not drawn.
  const resolved = d.agent != null;
  const title = d.agent?.name ?? agentDisplayName(id);
  const markState: MarkState = !resolved
    ? "quiet"
    : d.recentRuns.some((r) => r.status === "running")
      ? "running"
      : "idle";

  const peak = d.dailySpend.reduce<{ day: string; cost: number } | null>(
    (best, x) => (best === null || x.cost > best.cost ? x : best),
    null,
  );
  const quietDays = d.dailySpend.filter((x) => x.cost === 0).length;

  return (
    <>
      {/* The subject region. Its title is the agent, its `goTo` is the way back,
          and its body is the cost, because label left / fact right is what each
          of these stats is: a labelled measurement of one subject rather than a
          catalog to scan across, which is what rules out a Grid of Cells.

          The mark rides the sub line: Region takes a `string` title and has no
          mark slot, so this is the one node slot in its head. */}
      <Region
        title={title}
        sub={
          <span
            style={{
              display: "inline-flex",
              alignItems: "flex-start",
              gap: "var(--mrd-s3)",
            }}
          >
            <AgentMark
              slug={resolved ? (d.agent?.slug ?? id) : null}
              name={d.agent?.name}
              state={markState}
              title={
                resolved
                  ? undefined
                  : "Unattributed: no agent in the catalog answers to this reference"
              }
            />
            <span>
              {resolved
                ? `${d.agent?.role ? `${d.agent.role}. ` : ""}Read over the last ${DAYS} days from the per-call history, which counts every model call this one made whether or not a run was tied to it.`
                : `Not an agent in the catalog. These are the calls recorded against this reference over the last ${DAYS} days, from the per-call history.`}
            </span>
          </span>
        }
        goTo={BACK}
        onGoTo={onBack}
      >
        <Line
          label="Spend"
          sub={
            <>
              across <Num>{d.stats.calls}</Num> model {d.stats.calls === 1 ? "call" : "calls"}
            </>
          }
        >
          <Value>
            <Num>{fmtUsd(d.stats.cost)}</Num>
          </Value>
        </Line>

        <Line label="Tokens" sub="Prompt and completion together, as they were recorded.">
          <Value>
            <Num>{fmtNum(d.stats.tokens)}</Num>
          </Value>
        </Line>

        <Line label="Runs" sub="Each run is many model calls, so this is not the call count above.">
          <Value>
            <Num>{fmtNum(d.stats.runs)}</Num>
          </Value>
        </Line>

        {/* A p50 of zero means no call carried a latency, not that every call
            was instant. It says which. */}
        {d.stats.p50Latency > 0 ? (
          <Line label="Median call" sub="Half of its calls came back faster than this.">
            <Value>
              <Num>{fmtMs(d.stats.p50Latency)}</Num>
            </Value>
          </Line>
        ) : (
          <Line label="Median call" sub="No call in this window recorded how long it took." />
        )}

        {/* What the daily series is actually for, said in words. */}
        {peak && peak.cost > 0 ? (
          <Line
            label={`Heaviest of the last ${DAILY_DAYS} days`}
            sub={
              <>
                on <Num>{peak.day}</Num>, and <Num>{quietDays}</Num> of the <Num>{DAILY_DAYS}</Num>{" "}
                had no spend at all
              </>
            }
          >
            <Value>
              <Num>{fmtUsd(peak.cost)}</Num>
            </Value>
          </Line>
        ) : (
          <Line
            label={`Heaviest of the last ${DAILY_DAYS} days`}
            sub={`Nothing was spent on any of the last ${DAILY_DAYS} days.`}
          />
        )}
      </Region>

      {resolved ? (
        <Region
          title="Where the money went"
          sub="The missions this one ran against, most expensive first. Runs with no mission attached are grouped together as direct work."
        >
          {d.topMissions.length === 0 ? (
            <NothingYet>
              No run has been recorded for this one in the window, so there is nothing to attribute
              yet. The first mission it joins lands here.
            </NothingYet>
          ) : (
            d.topMissions.map((m) => {
              const missionId = m.missionId;
              return (
                <Row
                  key={missionId ?? "direct"}
                  tight
                  lead={
                    missionId ? (
                      (m.title ?? (
                        <>
                          Mission <Num>{missionId.slice(0, 8)}</Num>
                        </>
                      ))
                    ) : (
                      <>Direct work, no mission</>
                    )
                  }
                  sub={
                    <>
                      <Num>{m.runs}</Num> {m.runs === 1 ? "run" : "runs"}
                    </>
                  }
                  time={fmtUsd(m.cost)}
                  onClick={
                    missionId
                      ? () => navigate({ to: "/runs/$missionId", params: { missionId } })
                      : undefined
                  }
                />
              );
            })
          )}
        </Region>
      ) : null}

      {resolved ? (
        <Region
          title="The last runs"
          sub="Cost on a run only counts calls tied to a run id, which the loop has recorded since 3 June 2026. These will not add up to the spend above, and the per-call history is the authority on money."
        >
          {d.recentRuns.length === 0 ? (
            <NothingYet>
              No run has been recorded for this one in the window. Runs appear here as soon as the
              loop starts one under this name.
            </NothingYet>
          ) : (
            d.recentRuns.map((r) => {
              const missionId = r.mission_id;
              const tone = statusClass(r.status);
              return (
                <Row
                  key={r.id}
                  tight
                  lead={
                    r.missionTitle ??
                    (missionId ? (
                      <>
                        Mission <Num>{missionId.slice(0, 8)}</Num>
                      </>
                    ) : (
                      <>
                        Direct run <Num>{r.id.slice(0, 8)}</Num>
                      </>
                    ))
                  }
                  // One assembled fact: how it ended, what it cost, how long it
                  // took. The seven columns this replaced answered questions
                  // nobody brought to a spend drill-down.
                  sub={
                    <>
                      <span className={tone}>{STATUS_WORD[r.status] ?? r.status}</span>
                      {" · "}
                      {r.spend_used_usd > 0 ? (
                        <Num>{fmtUsd(r.spend_used_usd)}</Num>
                      ) : (
                        "no cost tied to this run"
                      )}
                      {/*
                        AFD-06 / INSTRUMENT: a stored 0 is NOT a measurement.
                        This read used to be `!= null`, which admitted the
                        hardcoded `duration_ms: 0` that `finalize` wrote for
                        every run before 2026-08-10 and rendered it as the
                        confident measurement "0ms" — an instantaneous run,
                        which no run is. Measured 2026-08-11: 913 of 1,272
                        agent_runs rows still carry that literal zero, 826 of
                        them inside this panel's own 30-day window.

                        Zero is now spelled out as unmeasured rather than
                        dropped, because silence here is ambiguous with "this
                        row has no duration column at all" and a reader who
                        sees nothing assumes nobody looked. `run-analytics.ts`
                        already applies exactly this rule server-side
                        (`duration_ms > 0`); this brings the only surface that
                        renders the column into line with it.
                      */}
                      {r.duration_ms != null ? (
                        <>
                          {" · "}
                          {r.duration_ms > 0 ? (
                            <Num>{fmtMs(r.duration_ms)}</Num>
                          ) : (
                            "duration not measured"
                          )}
                        </>
                      ) : null}
                      {r.tokens_used ? (
                        <>
                          {" · "}
                          <Num>{fmtNum(r.tokens_used)}</Num> tokens
                        </>
                      ) : null}
                    </>
                  }
                  time={relTime(r.created_at)}
                  onClick={
                    missionId
                      ? () => navigate({ to: "/runs/$missionId", params: { missionId } })
                      : undefined
                  }
                />
              );
            })
          )}
        </Region>
      ) : null}
    </>
  );
}
