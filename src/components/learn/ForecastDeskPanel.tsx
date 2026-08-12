import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listDueForecasts,
  settleForecast,
  deferForecastCheck,
  listAgentSettledForecasts,
  getForecastCallRate,
  type DueForecast,
} from "@/lib/forecast.functions";
import { FORECAST_SAYS } from "@/components/learn/forecast-words";
import type { ForecastResolution } from "@/lib/brain/forecast-resolution";
import { forecastGroupLabel, lateness, deferredNote } from "@/components/learn/forecast-desk-words";
import {
  Actions,
  Block,
  Button,
  Failed,
  Field,
  Line,
  Row,
  Textarea,
} from "@/components/shell/primitives";

/**
 * FC-01, the grading half: the surface where a due forecast is settled.
 *
 * IT IS A SEPARATE GROUP FROM THE SPEC OUTCOMES BESIDE IT, and deliberately so.
 * A spec outcome asks whether shipping paid off; a forecast asks whether the
 * belief was right, and one event answers those differently. The labels keep
 * them apart, and no mapping exists between the two verdict vocabularies. See
 * forecast-words.ts.
 *
 * NOTHING HERE DEPENDS ON THE TICK. The due list is derived in SQL from the
 * frozen columns, so a forecast appears whether or not an agent has drafted a
 * verdict for it. The draft, when present, is shown as a draft.
 *
 * Every read fails soft. Migrations and deploys are two switches with no
 * enforced order, so this panel renders nothing rather than taking the Learn
 * desk down with it. The writes report their failure, because a write that
 * silently does nothing is worse than one that says so.
 *
 * Plan: docs/planning/initiatives/forecast-resolution-plan.md
 */
export function ForecastDeskPanel() {
  const qc = useQueryClient();
  const fDue = useServerFn(listDueForecasts);
  const fRate = useServerFn(getForecastCallRate);
  const fAgent = useServerFn(listAgentSettledForecasts);
  const fSettle = useServerFn(settleForecast);
  const fDefer = useServerFn(deferForecastCheck);

  const dueQ = useQuery({ queryKey: ["forecast-due"], queryFn: () => fDue() });
  const rateQ = useQuery({ queryKey: ["forecast-rate"], queryFn: () => fRate() });
  const agentQ = useQuery({ queryKey: ["forecast-agent-settled"], queryFn: () => fAgent() });

  const [pickedId, setPickedId] = React.useState<string | null>(null);
  const [rationale, setRationale] = React.useState("");

  // Invalidated by prefix, the same way SettlePanel does it, so the count in the
  // heading and the list below it can never disagree.
  const refresh = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["forecast-due"] });
    void qc.invalidateQueries({ queryKey: ["forecast-rate"] });
    void qc.invalidateQueries({ queryKey: ["forecast-agent-settled"] });
  }, [qc]);

  const settle = useMutation({
    mutationFn: (v: { decisionId: string; resolution: ForecastResolution }) =>
      fSettle({ data: { ...v, rationale: rationale.trim() } }),
    onSuccess: () => {
      setPickedId(null);
      setRationale("");
      refresh();
    },
  });

  const defer = useMutation({
    mutationFn: (decisionId: string) => fDefer({ data: { decisionId, days: 14 } }),
    onSuccess: () => {
      setPickedId(null);
      refresh();
    },
  });

  const due: DueForecast[] = dueQ.data?.due ?? [];
  const agentSettled = agentQ.data?.settled ?? [];
  const rate = rateQ.data;

  /**
   * No empty scaffolding. An account that has never recorded a forecast should
   * not be shown a desk for settling them, and the honest zero state belongs on
   * a workspace that has at least started.
   */
  if (due.length === 0 && agentSettled.length === 0 && (rate?.resolved ?? 0) === 0) return null;

  const picked = due.find((d) => d.id === pickedId) ?? null;

  return (
    <>
      {due.length > 0 ? (
        <Block
          title={forecastGroupLabel(due.length)}
          // Different information from the title, not a restatement of it.
          sub="What you expected, now that the date you set has passed."
        >
          {due.map((d) => (
            <Row
              key={d.id}
              tight
              lead={d.claim}
              sub={[
                d.howWeWillKnow,
                lateness(d.daysLate),
                deferredNote(d.deferredCount),
                d.suggestion ? `draft: ${FORECAST_SAYS[d.suggestion.verdict]}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              onClick={() => {
                setPickedId(d.id === pickedId ? null : d.id);
                setRationale("");
              }}
            />
          ))}
        </Block>
      ) : null}

      {picked ? (
        <Block title="Did it come true?" sub={picked.howWeWillKnow}>
          {picked.suggestion ? (
            <Line
              label={`A draft says ${FORECAST_SAYS[picked.suggestion.verdict]}`}
              sub={picked.suggestion.rationale}
            />
          ) : null}

          <Field label="What settled it" htmlFor="forecast-rationale">
            <Textarea
              id="forecast-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </Field>

          <Actions>
            {(["hit", "miss", "inconclusive"] as const).map((r) => (
              <Button
                key={r}
                variant={r === "hit" ? "primary" : "default"}
                disabled={settle.isPending || rationale.trim().length === 0}
                onClick={() => settle.mutate({ decisionId: picked.id, resolution: r })}
              >
                {FORECAST_SAYS[r]}
              </Button>
            ))}
            {/*
              The third answer is not a verdict and never writes one. It moves a
              check date, which is why it stays available no matter what the
              draft says: "too early" is the absence of an outcome rather than a
              kind of one.
            */}
            <Button
              disabled={defer.isPending}
              onClick={() => defer.mutate(picked.id)}
              title="No verdict is written. It returns to this desk in two weeks."
            >
              {defer.isPending ? "Giving it more time." : "Too early to tell"}
            </Button>
          </Actions>

          {settle.isError ? (
            <Failed>
              The verdict did not land, and nothing was written. {(settle.error as Error).message}
            </Failed>
          ) : null}
          {defer.isError ? (
            <Failed>The check date did not move. {(defer.error as Error).message}</Failed>
          ) : null}
        </Block>
      ) : null}

      {agentSettled.length > 0 ? (
        <Block
          title="Settled by an agent"
          // The oversight half of the gate. An agent verdict is only reversible
          // if somebody can see it, which is what the slug column is for.
          sub="Read these. Settle one again by hand if you disagree."
        >
          {agentSettled.map((r) => (
            <Row
              key={r.id}
              tight
              lead={r.forecast_claim ?? r.title ?? ""}
              sub={[
                r.forecast_resolution
                  ? FORECAST_SAYS[r.forecast_resolution as ForecastResolution]
                  : null,
                r.forecast_resolution_rationale,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </Block>
      ) : null}

      {rate ? <Line label="Your calls" sub={rate.label} /> : null}
    </>
  );
}
