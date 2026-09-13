import * as React from "react";
import { plainProse } from "@/lib/plain-prose";
import { failureLine, reasonLine } from "@/lib/error-copy";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  ReadFailed,
  ReadFailedLine,
  Region,
} from "@/components/meridian/surface-parts";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";

import {
  listDueForecastsHere,
  settleForecast,
  deferForecastCheck,
  listAgentSettledForecastsHere,
  getForecastCallRateHere,
  reopenForecast,
  type DueForecast,
} from "@/lib/forecast.functions";
import { toast } from "@/lib/notify";
import { FORECAST_SAYS } from "@/components/learn/forecast-words";
import type { ForecastResolution } from "@/lib/brain/forecast-resolution";
import { forecastGroupLabel, lateness, deferredNote } from "@/components/learn/forecast-desk-words";
import { everyDraftSays, theDraftEveryRowShares } from "@/components/learn/a-draft-on-every-row";

/**
 * THE OVERSIGHT DOOR, not just the oversight list. "Settle one again by hand
 * if you disagree" promised a way to disagree and the desk never shipped one:
 * reopenForecast existed with no caller, so an agent verdict you rejected was
 * a fact you could only stare at. Reopening demands a reason (the server
 * enforces three characters minimum, and the reason IS the new history row),
 * so the door opens into a one-line form rather than firing on a click.
 */
function AgentSettledRow({
  r,
  onReopened,
}: {
  r: {
    id: string;
    title: string | null;
    forecast_claim: string | null;
    forecast_resolution: string | null;
    forecast_resolution_rationale: string | null;
  };
  onReopened: () => void;
}) {
  const fReopen = useServerFn(reopenForecast);
  const [opening, setOpening] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  const reopen = useMutation({
    mutationFn: () => fReopen({ data: { decisionId: r.id, reason: reason.trim() } }),
    onSuccess: () => {
      setOpening(false);
      setReason("");
      toast("The verdict is back on the desk. What the agent settled is filed in the trail.");
      onReopened();
    },
    onError: (e: Error) => setProblem(e.message),
  });

  const canReopen = reason.trim().length >= 3 && !reopen.isPending;

  return (
    <div>
      {/*
        NOT `tight`. Measured on production: 174 forecast claims, mean 137
        characters, longest 300, and ALL 174 are over seventy, which is about
        what one clamped line shows. So the claim was cut on every row without
        exception, and this row's only action is "Disagree", which opens a
        reopen form rather than the claim. There was nowhere to read it.

        `tight`'s contract is a row whose full content has a detail view to
        open. A forecast claim is the thing the product exists to have captured
        before the outcome was known; clipping it on the surface where the
        verdict lands is the worst place in the app to save a line.
      */}
      <Row
        lead={r.forecast_claim ?? r.title ?? ""}
        sub={[
          r.forecast_resolution ? FORECAST_SAYS[r.forecast_resolution as ForecastResolution] : null,
          r.forecast_resolution_rationale,
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          !opening ? (
            <Action
              variant="quiet"
              onClick={() => {
                setProblem(null);
                setOpening(true);
              }}
            >
              Disagree
            </Action>
          ) : undefined
        }
      />
      {opening ? (
        <form
          className="mb-mrd-2 flex flex-col gap-mrd-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canReopen) reopen.mutate();
          }}
        >
          <Field label="Why is this verdict wrong?" htmlFor={`reopen-${r.id}`}>
            <Input
              id={`reopen-${r.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              placeholder="The reason becomes part of the trail"
            />
          </Field>
          {problem ? <p className="text-mrd-fail text-mrd-base">{problem}</p> : null}
          <Actions>
            <Action type="submit" disabled={!canReopen}>
              {reopen.isPending ? "Reopening" : "Reopen it"}
            </Action>
            <Action
              variant="quiet"
              onClick={() => {
                setOpening(false);
                setProblem(null);
              }}
            >
              Keep the verdict
            </Action>
          </Actions>
        </form>
      ) : null}
    </div>
  );
}

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
  /*
   * ── ALL THREE READS ANSWER FOR THE WORKSPACE YOU ARE STANDING IN ────────
   *
   * They were `listDueForecasts`, `getForecastCallRate` and
   * `listAgentSettledForecasts`, none of them scoped at all, on a page that
   * prints this workspace's decision count four regions below. Read signed in
   * on 2026-09-10 in `c8ffbbe7` -- a workspace with six forecasts and none
   * overdue -- the desk drew NINE rows about crypto wallet parity and $7.99
   * pricing, which are Helio Labs'.
   *
   * `activeWorkspaceId` and not the person's DEFAULT, which is the sharper
   * half and the one `a-read-serves-the-workspace-you-are-in` was written for:
   * since migration `20260907010000` a person can hold two, and a read that
   * resolves the default answers with the other desk's rows the moment they
   * switch. All three take the SAME id from this one source, so the count in
   * the heading and the denominator in the rate cannot answer to different
   * workspaces -- which is what the original server-side resolution was
   * protecting and this keeps.
   *
   * IN THE KEY AS WELL AS THE ARGUMENT. A read scoped by an id that is not in
   * its cache key is the defect one layer in: react-query would serve the
   * previous workspace's answer under the new workspace's name, and the screen
   * would look right from every angle except the data.
   */
  const { activeWorkspaceId } = useWorkspace();
  const fDue = useServerFn(listDueForecastsHere);
  const fRate = useServerFn(getForecastCallRateHere);
  const fAgent = useServerFn(listAgentSettledForecastsHere);
  const fSettle = useServerFn(settleForecast);
  const fDefer = useServerFn(deferForecastCheck);

  const at = { data: { workspaceId: activeWorkspaceId } };
  const dueQ = useQuery({
    queryKey: ["forecast-due", activeWorkspaceId],
    queryFn: () => fDue(at),
  });
  const rateQ = useQuery({
    queryKey: ["forecast-rate", activeWorkspaceId],
    queryFn: () => fRate(at),
  });
  const agentQ = useQuery({
    queryKey: ["forecast-agent-settled", activeWorkspaceId],
    queryFn: () => fAgent(at),
  });

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

  /*
   * ── F-120: A FAILED READ MUST NOT LOOK LIKE AN EMPTY DESK ────────────────
   *
   * Checked BEFORE the return-null below, and the order is the whole fix. That
   * null is deliberate and right, but it is written for a workspace with
   * nothing to settle, and until now a workspace whose reads FAILED took the
   * same branch. The desk did not show an error and did not show zero: it
   * vanished from the page, and a person would reasonably conclude they had
   * nothing due.
   *
   * One line covers all three reads because they are one desk. Naming which of
   * them failed would be more precise and less useful: the answer to any of
   * them failing is the same, and the retry refetches all three.
   */
  const readFailed = dueQ.isError || agentQ.isError || rateQ.isError;
  if (readFailed) {
    return (
      <Region title="Forecasts" sub="What you expected, now that the date you set has passed.">
        <ReadFailed
          onRetry={() => {
            void dueQ.refetch();
            void agentQ.refetch();
            void rateQ.refetch();
          }}
        >
          Your forecasts did not load, so an empty desk here would not mean there is nothing to
          settle.
        </ReadFailed>
      </Region>
    );
  }

  /**
   * No empty scaffolding. An account that has never recorded a forecast should
   * not be shown a desk for settling them, and the honest zero state belongs on
   * a workspace that has at least started.
   *
   * Reached only when all three reads SUCCEEDED and came back empty, which is
   * now a different thing from all three having failed.
   */
  if (due.length === 0 && agentSettled.length === 0 && (rate?.resolved ?? 0) === 0) return null;

  const picked = due.find((d) => d.id === pickedId) ?? null;

  /* Computed over the RENDERED set, which is the whole point: the same nine
     forecasts split across two workspaces would discriminate and keep their
     values. See `a-draft-on-every-row.ts`. */
  const sharedDraft = theDraftEveryRowShares(
    due.map((d) => (d.suggestion ? FORECAST_SAYS[d.suggestion.verdict] : null)),
  );

  return (
    <>
      {due.length > 0 ? (
        <Region
          title={forecastGroupLabel(due.length)}
          /*
           * Different information from the title, not a restatement of it --
           * and, when every row carries the same drafted verdict, the place
           * that verdict is said. See `a-draft-on-every-row.ts` for the nine
           * rows this replaced and why the constant moves up here instead of
           * simply going.
           */
          sub={
            sharedDraft
              ? `What you expected, now that the date you set has passed. ${everyDraftSays(
                  due.length,
                  sharedDraft,
                )}`
              : "What you expected, now that the date you set has passed."
          }
        >
          {due.map((d) => (
            <Row
              key={d.id}
              lead={d.claim}
              sub={[
                d.howWeWillKnow,
                lateness(d.daysLate),
                deferredNote(d.deferredCount),
                /* Silent only when the sub above is saying it for the whole
                   column. The moment one row's draft differs, or one row has
                   none, every row carries its own again -- that difference is
                   the fastest thing on the desk to read. */
                d.suggestion && !sharedDraft
                  ? `draft: ${FORECAST_SAYS[d.suggestion.verdict]}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              onClick={() => {
                setPickedId(d.id === pickedId ? null : d.id);
                setRationale("");
              }}
            />
          ))}
        </Region>
      ) : null}

      {picked ? (
        <Region title="Did it come true?" sub={picked.howWeWillKnow}>
          {/* `Region` sets no gap between its children and Meridian's `Field`
              and `Actions` both set no outer margin, on purpose: composition
              spacing belongs to the caller. The retired `Block` decided it for
              everyone, which is why this is stated once here rather than baked
              into three parts. */}
          <div className="flex flex-col gap-mrd-5">
            {picked.suggestion ? (
              <Line
                label={`A draft says ${FORECAST_SAYS[picked.suggestion.verdict]}`}
                /* Display, so the markers come off. The textarea below holds the
                   same text as a VALUE and is deliberately left raw: stripping
                   there would silently change what the person saves. */
                sub={plainProse(picked.suggestion.rationale) ?? undefined}
              />
            ) : null}

            {/*
              ── WHAT IT READ, UNDER WHAT IT CONCLUDED (P-42) ──────────────
              A verdict is only worth as much as what stands behind it, and
              until P-42 nothing stood behind these: the grader was handed one
              line, the linked spec's outcome, and eight drafts on production
              came back at confidence 1.0 having read nothing at all.

              The CITED rows are marked, and the rest are shown anyway. "It saw
              nine things and leaned on two" and "it saw two things" are
              different facts about the same verdict, and a person deciding
              whether to accept a draft needs both: the second is a thin desk,
              the first is a judgment.

              Absent on every suggestion drafted before P-42, which reads
              correctly rather than as a gap: those were graded on one line.
            */}
            {picked.suggestion && picked.suggestion.read.length > 0 ? (
              <div data-mrd="" className="flex flex-col gap-mrd-2 font-mrd">
                <p className="mrd-eyebrow">What it read</p>
                <ul className="flex flex-col gap-mrd-1">
                  {picked.suggestion.read.map((r) => {
                    const used = picked.suggestion!.cited.includes(`${r.kind}:${r.id}`);
                    return (
                      <li
                        key={`${r.kind}:${r.id}`}
                        className={`text-mrd-small ${used ? "text-mrd-ink" : "text-mrd-mute"}`}
                      >
                        {/* The one it leaned on is named as such rather than
                            merely darker: colour alone is not a fact. */}
                        {used ? <strong>Used</strong> : "Read"} · {r.kind} · {r.line}
                      </li>
                    );
                  })}
                </ul>
              </div>
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

            {/* THREE ANSWERS, AND NONE OF THEM IS AN `Approve`.
                Approve is the one control that releases held work and the only
                place orchid is spent on a button in this product, and it is
                singular by construction: "one primary, and only one". Three
                verdicts are one decision offered three ways, so painting them
                all orchid would spend the accent three times on a single choice,
                and painting only "it came true" orchid would put the product's
                loudest control behind the flattering answer on the one surface
                that must not flatter. The existing emphasis is kept exactly as
                it shipped and nothing more is claimed. */}
            <Actions>
              {(["hit", "miss", "inconclusive"] as const).map((r) => (
                <Action
                  key={r}
                  variant={r === "hit" ? "primary" : "default"}
                  disabled={settle.isPending || rationale.trim().length === 0}
                  onClick={() => settle.mutate({ decisionId: picked.id, resolution: r })}
                >
                  {FORECAST_SAYS[r]}
                </Action>
              ))}
              {/*
              The third answer is not a verdict and never writes one. It moves a
              check date, which is why it stays available no matter what the
              draft says: "too early" is the absence of an outcome rather than a
              kind of one.
            */}
              <Action
                busy={defer.isPending}
                onClick={() => defer.mutate(picked.id)}
                title="No verdict is written. It returns to this desk in two weeks."
              >
                {defer.isPending ? "Giving it more time." : "Too early to tell"}
              </Action>
            </Actions>

            {/* A WRITE THAT DID NOT LAND, said as a line and not as a box: the
                region already draws its own heading, and the bordered half of
                the pair belongs where there is no region around it. */}
            {settle.isError ? (
              <ReadFailedLine error={settle.error}>
                {reasonLine("The verdict did not land, and nothing was written.", settle.error)}
              </ReadFailedLine>
            ) : null}
            {defer.isError ? (
              <ReadFailedLine error={defer.error}>
                {reasonLine("The check date did not move.", defer.error)}
              </ReadFailedLine>
            ) : null}
          </div>
        </Region>
      ) : null}

      {agentSettled.length > 0 ? (
        <Region
          title="Settled by an agent"
          // The oversight half of the gate. An agent verdict is only reversible
          // if somebody can see it, which is what the slug column is for.
          sub="Read these. Settle one again by hand if you disagree."
        >
          {agentSettled.map((r) => (
            <AgentSettledRow
              key={r.id}
              r={r}
              onReopened={() => {
                qc.invalidateQueries({ queryKey: ["forecast-agent-settled"] });
                qc.invalidateQueries({ queryKey: ["forecast-due"] });
              }}
            />
          ))}
        </Region>
      ) : null}

      {rate ? <Line label="Your calls" sub={rate.label} /> : null}
    </>
  );
}
