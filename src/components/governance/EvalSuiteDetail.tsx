/**
 * ONE EVAL SUITE. The drill-down, ported onto the shell primitives 2026-07-29.
 *
 * This is the surface the founder's complaint is about: the suite list is
 * ported, you click a suite, and the retired theme comes back. It was
 * `DrillHeader` + three `bento` stat cards + a `GraphSlider` + a five column
 * CSS grid pretending to be a table + `VerdictChip`, all drawing their own
 * borders and their own palette. It is now `PageHead`, `Block`, `Line`, `Row`
 * and `Value`, and it owns no colour at all.
 *
 * WHAT WENT, AND WHAT IT COST:
 *   GONE  the GraphSlider. Eight points of sparkline is a picture of two
 *         numbers you can just say: where it started, where it is now, and
 *         which direction that is. The sentence replaces it, reads in
 *         greyscale, and cannot lie about a sample of one.
 *   GONE  the runs table's column grid. A run is one line: what it scored,
 *         how many cleared, when. Its failures are a click away, which is
 *         where depth belongs.
 *   GONE  the check and cross glyphs, the arrows, the "-" placeholders. A
 *         thing that has no score says so in words.
 *   KEPT  every server call: run now, enable, delete confirmed, case create,
 *         case toggle, case delete, and the failing-case judge reasoning.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Running the suite used to
 * fire "Run complete: 8 passed, 2 failed." and vanish. That is a toast
 * confirming your click. It now leaves a `Receipt` naming what the run found
 * and whether the suite still clears its gate, which is what the run CAUSED.
 *
 * The delete confirmation stays a real modal (`useConfirm`). That is the one
 * shape the standard still allows a modal for: a single irreversible question.
 */
import { Fragment, useState } from "react";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingHere,
  NothingYet,
  Num,
  PageHeading,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEvalSuite,
  getEvalRun,
  getEvalRunPromptVersions,
  runEvalSuiteNow,
  updateEvalSuite,
  deleteEvalSuite,
  createEvalCase,
  updateEvalCase,
  deleteEvalCase,
} from "@/lib/evals.functions";
import { Prose, Receipt } from "@/components/shell/primitives";
import { relTime } from "@/components/product/format";
import { useConfirm } from "@/hooks/use-confirm";

type Suite = {
  id: string;
  name: string;
  description: string | null;
  surface: string;
  prompt_key: string;
  model: string | null;
  judge_model: string;
  pass_threshold: number;
  schedule_cron: string | null;
  enabled: boolean;
};

type EvalCase = {
  id: string;
  name: string;
  input: string;
  expected: string | null;
  rubric: string | null;
  enabled: boolean;
};

type RunRow = {
  id: string;
  status: string;
  trigger: string;
  model: string | null;
  pass_count: number;
  fail_count: number;
  errored: number | null;
  avg_score: number | string | null;
  total_latency_ms: number | null;
  created_at: string;
};

type ResultRow = {
  id: string;
  case_id: string;
  status: string;
  passed: boolean | null;
  actual: string | null;
  score: number | string | null;
  judge_reasoning: string | null;
  error: string | null;
  case: { name: string; input: string; expected: string | null } | null;
};

type Tab = "runs" | "failures" | "cases" | "config";

const TABS: { id: Tab; label: string }[] = [
  { id: "runs", label: "Runs" },
  { id: "failures", label: "What failed" },
  { id: "cases", label: "Cases" },
  { id: "config", label: "How it is set" },
];

/** What a run left behind, held only long enough to render the receipt. */
type Ran = { passed: number; failed: number; errored: number; at: string };

export function EvalSuiteDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getEvalSuite);
  const versionsFn = useServerFn(getEvalRunPromptVersions);
  const runFn = useServerFn(runEvalSuiteNow);
  const [tab, setTab] = useState<Tab>("runs");
  const [failRunId, setFailRunId] = useState<string | null>(null);
  const [ran, setRan] = useState<Ran[]>([]);

  const back = () => navigate({ to: "/engine-room", search: { room: "quality", view: "suites" } });

  const suiteQ = useQuery({
    queryKey: ["eval_suite", id],
    queryFn: () => getFn({ data: { suite_id: id } }),
    retry: false,
  });
  const versionsQ = useQuery({
    queryKey: ["eval_run_prompt_versions", id],
    queryFn: () => versionsFn({ data: { suite_id: id } }),
    enabled: !!suiteQ.data,
    retry: false,
  });

  const inv = () => {
    void suiteQ.refetch();
    void qc.invalidateQueries({ queryKey: ["eval_suites"] });
    void qc.invalidateQueries({ queryKey: ["eval_suite_trends"] });
    void qc.invalidateQueries({ queryKey: ["eval_coverage"] });
    void qc.invalidateQueries({ queryKey: ["eval_run_prompt_versions", id] });
    void qc.invalidateQueries({ queryKey: ["eval_run"] });
  };

  const run = useMutation({
    mutationFn: () => runFn({ data: { suite_id: id } }),
    onSuccess: (r: { passed: number; failed: number; errored?: number }) => {
      setRan((prev) => [
        ...prev,
        {
          passed: r.passed,
          failed: r.failed,
          errored: r.errored ?? 0,
          at: new Date().toISOString(),
        },
      ]);
      inv();
    },
  });

  const backButton = (
    <Action variant="quiet" onClick={back}>
      All of them
    </Action>
  );

  if (suiteQ.isLoading) {
    return <Reading>Reading what this one watches.</Reading>;
  }

  if (suiteQ.isError) {
    return (
      <>
        <PageHeading title="This suite did not load." />
        <ReadFailed onRetry={() => void suiteQ.refetch()}>
          {(suiteQ.error as Error).message}. Nothing below would be its real state, so nothing is
          shown.
        </ReadFailed>
        <Region>{backButton}</Region>
      </>
    );
  }

  if (!suiteQ.data?.suite) {
    return (
      <>
        <PageHeading title="No suite by that name." />
        <NothingHere action={backButton}>
          Nothing in this workspace answers to that id. It may have been deleted.
        </NothingHere>
      </>
    );
  }

  const suite = suiteQ.data.suite as Suite;
  const cases = (suiteQ.data.cases ?? []) as EvalCase[];
  const runs = (suiteQ.data.runs ?? []) as RunRow[];
  const versions = versionsQ.data?.versions ?? {};

  const enabledCases = cases.filter((c) => c.enabled).length;
  const latest = runs.find((r) => r.status === "completed" && r.avg_score != null);
  const score = latest ? Math.round(Number(latest.avg_score)) : null;
  const clears = score != null && score >= suite.pass_threshold;

  // Runs arrive newest first; the trend reads oldest to newest, last 8 points.
  const trendData = runs
    .filter((r) => r.status === "completed" && r.avg_score != null)
    .slice()
    .reverse()
    .slice(-8)
    .map((r) => Number(r.avg_score));
  const first = trendData[0];
  const last = trendData[trendData.length - 1];
  const move = trendData.length >= 2 ? Math.round(last - first) : null;

  const latestTimed = runs.find((r) => r.status === "completed" && r.total_latency_ms != null);
  const estimate = latestTimed
    ? Number(latestTimed.total_latency_ms) < 90_000
      ? `about ${Math.max(1, Math.round(Number(latestTimed.total_latency_ms) / 1000))} seconds`
      : `about ${Math.round(Number(latestTimed.total_latency_ms) / 60_000)} minutes`
    : null;
  const latestCompletedId = runs.find((r) => r.status === "completed")?.id ?? null;
  const failTargetId = failRunId ?? latestCompletedId;

  return (
    <>
      <PageHeading
        title={suite.name}
        sub={
          score == null ? (
            <>
              Never run. It watches{" "}
              <Num>
                {suite.surface}/{suite.prompt_key}
              </Num>
              .
            </>
          ) : (
            <>
              <Value tone={clears ? "pass" : "fail"}>
                {clears ? "It clears its gate" : "It is below its gate"}
              </Value>{" "}
              at <Num>{score}</Num> against <Num>{suite.pass_threshold}</Num>, watching{" "}
              <Num>
                {suite.surface}/{suite.prompt_key}
              </Num>
              .
            </>
          )
        }
      />

      {suite.description ? <Prose>{suite.description}</Prose> : null}

      <Region
        title="Where it stands"
        sub="Read from its completed runs. A suite with no runs has no score, and none is invented for it."
      >
        <Line
          label="Cases"
          sub={
            cases.length === 0
              ? "It cannot run until at least one exists."
              : enabledCases === cases.length
                ? "All of them run."
                : `${cases.length - enabledCases} switched off, so they do not run.`
          }
        >
          <Value>
            <Num>{enabledCases}</Num> of <Num>{cases.length}</Num>
          </Value>
        </Line>

        <Line
          label="Direction"
          sub={
            trendData.length >= 2
              ? `Across its last ${trendData.length} completed runs.`
              : "It needs two completed runs before a direction means anything."
          }
        >
          {move == null ? (
            <Value>{trendData.length === 1 ? "one run so far" : "nothing to compare"}</Value>
          ) : (
            <Value tone={move > 0 ? "pass" : move < 0 ? "fail" : "quiet"}>
              {move > 0 ? "up " : move < 0 ? "down " : "steady at "}
              <Num>{move === 0 ? Math.round(last) : Math.abs(move)}</Num>
            </Value>
          )}
        </Line>

        {run.isError ? <ReadFailedLine>{(run.error as Error).message}</ReadFailedLine> : null}

        <Actions>
          <Action
            variant="primary"
            disabled={run.isPending || enabledCases === 0}
            title={enabledCases === 0 ? "Write and switch on at least one case first" : undefined}
            onClick={() => run.mutate()}
          >
            {run.isPending
              ? "Running it"
              : estimate
                ? `Run it again, ${estimate}`
                : `Run it against ${enabledCases} case${enabledCases === 1 ? "" : "s"}`}
          </Action>
        </Actions>

        {/* THE COMMIT. What the run found, not that the click registered. */}
        {ran.map((r, i) => (
          <Receipt
            key={`${r.at}-${i}`}
            verb="You ran it"
            failed={r.failed > 0 || r.errored > 0}
            time={relTime(r.at)}
            consequence={
              <>
                <Num>{r.passed}</Num> cleared the gate, <Num>{r.failed}</Num> did not
                {r.errored > 0 ? (
                  <>
                    , and <Num>{r.errored}</Num> never finished
                  </>
                ) : null}
                .
              </>
            }
          />
        ))}
      </Region>

      <div className="sp-tabs" role="tablist" aria-label="What to read about this suite">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setFailRunId(null);
            }}
          >
            {t.label}
            {t.id === "runs" && runs.length > 0 ? (
              <span className="sp-tab-count">{runs.length}</span>
            ) : null}
            {t.id === "cases" && cases.length > 0 ? (
              <span className="sp-tab-count">{cases.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "runs" ? (
        <Region>
          {runs.length === 0 ? (
            <NothingYet>
              It has not run yet. Run it above and every run from then on lands here, newest first.
            </NothingYet>
          ) : (
            runs.map((r) => {
              const rScore = r.avg_score != null ? Math.round(Number(r.avg_score)) : null;
              const rClears = rScore != null && rScore >= suite.pass_threshold;
              const version = versions[r.id] ?? r.model ?? null;
              return (
                <Row
                  key={r.id}
                  tight
                  time={relTime(r.created_at)}
                  lead={
                    rScore == null ? (
                      r.status === "completed" ? (
                        "Finished without a score"
                      ) : (
                        `Did not finish, ${r.status}`
                      )
                    ) : (
                      <>
                        <Value tone={rClears ? "pass" : "fail"}>
                          {rClears ? "Cleared" : "Below"}
                        </Value>{" "}
                        at <Num>{rScore}</Num>
                      </>
                    )
                  }
                  sub={
                    <>
                      <Num>{r.pass_count}</Num> passed, <Num>{r.fail_count}</Num> failed
                      {(r.errored ?? 0) > 0 ? (
                        <>
                          , <Num>{r.errored}</Num> errored
                        </>
                      ) : null}
                      {version ? (
                        <>
                          {" "}
                          on <Num>{version}</Num>
                        </>
                      ) : null}
                    </>
                  }
                  action={
                    r.fail_count > 0 ? (
                      <Action
                        variant="quiet"
                        onClick={() => {
                          setFailRunId(r.id);
                          setTab("failures");
                        }}
                      >
                        What failed
                      </Action>
                    ) : undefined
                  }
                />
              );
            })
          )}
        </Region>
      ) : tab === "failures" ? (
        <FailingCases runId={failTargetId} />
      ) : tab === "cases" ? (
        <CaseList suiteId={id} cases={cases} onChange={inv} />
      ) : (
        <Config suite={suite} onChanged={inv} onDeleted={back} />
      )}

      <Region>{backButton}</Region>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * What failed
 * ------------------------------------------------------------------ */

/** A run's case results filtered to failures (runner era status 'failed', or
 *  seed era completed + passed=false). Defaults to the latest completed run;
 *  "What failed" on a run row scopes it to that one. */
function FailingCases({ runId }: { runId: string | null }) {
  const getRunFn = useServerFn(getEvalRun);
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["eval_run", runId],
    queryFn: () => getRunFn({ data: { run_id: runId as string } }),
    enabled: !!runId,
    retry: false,
  });

  if (!runId) {
    return (
      <Region>
        <NothingYet>
          It has never completed a run, so nothing has failed yet. Failures appear here after the
          first one.
        </NothingYet>
      </Region>
    );
  }
  if (q.isLoading) {
    return (
      <Region>
        <Reading>Reading what this run found.</Reading>
      </Region>
    );
  }
  if (q.isError) {
    return (
      <Region>
        <ReadFailedLine onRetry={() => void q.refetch()}>
          This run did not load, so the failures below would not be its real ones.
        </ReadFailedLine>
      </Region>
    );
  }

  const run = q.data?.run as { id: string; created_at: string } | undefined;
  const results = (q.data?.results ?? []) as ResultRow[];
  const failing = results.filter(
    (r) => r.status === "failed" || (r.status === "completed" && r.passed === false),
  );

  return (
    <Region title="What failed" sub={run ? `From the run ${relTime(run.created_at)}.` : undefined}>
      {failing.length === 0 ? (
        <NothingYet>Nothing failed in this run. Every case cleared the gate.</NothingYet>
      ) : (
        failing.map((r) => {
          const isOpen = open === r.id;
          // A keyed Fragment, never a wrapper div: `.sp-row + .sp-row` is an
          // adjacent-sibling divider and a div silently kills it.
          return (
            <Fragment key={r.id}>
              <Row
                tight
                focused={isOpen}
                lead={r.case?.name ?? r.case_id}
                onClick={() => setOpen(isOpen ? null : r.id)}
                sub={
                  <>
                    <Value tone="fail">failed</Value>
                    {r.score != null ? (
                      <>
                        {" "}
                        at <Num>{Math.round(Number(r.score))}</Num>
                      </>
                    ) : null}
                    {r.error ? `, ${r.error}` : null}
                  </>
                }
              />
              {isOpen ? (
                <>
                  {r.case?.expected ? (
                    <>
                      <Line label="What it should have said" />
                      <Prose>{r.case.expected}</Prose>
                    </>
                  ) : null}
                  {r.actual ? (
                    <>
                      <Line label="What it said instead" />
                      <Prose>{r.actual}</Prose>
                    </>
                  ) : null}
                  {r.judge_reasoning ? (
                    <>
                      <Line label="Why the judge failed it" />
                      <Prose>{r.judge_reasoning}</Prose>
                    </>
                  ) : null}
                </>
              ) : null}
            </Fragment>
          );
        })
      )}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * The cases
 * ------------------------------------------------------------------ */

function CaseList({
  suiteId,
  cases,
  onChange,
}: {
  suiteId: string;
  cases: EvalCase[];
  onChange: () => void;
}) {
  const createFn = useServerFn(createEvalCase);
  const updateFn = useServerFn(updateEvalCase);
  const deleteFn = useServerFn(deleteEvalCase);
  const confirm = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", input: "", expected: "", rubric: "" });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          suite_id: suiteId,
          name: form.name,
          input: form.input,
          expected: form.expected || null,
          rubric: form.rubric || null,
        },
      }),
    onSuccess: () => {
      setFormOpen(false);
      setForm({ name: "", input: "", expected: "", rubric: "" });
      onChange();
    },
  });

  const toggle = useMutation({
    mutationFn: (v: { caseId: string; enabled: boolean }) =>
      updateFn({ data: { case_id: v.caseId, enabled: v.enabled } }),
    onSuccess: onChange,
  });

  const remove = useMutation({
    mutationFn: (caseId: string) => deleteFn({ data: { case_id: caseId } }),
    onSuccess: onChange,
  });

  const failure = create.error ?? toggle.error ?? remove.error;

  return (
    <>
      {formOpen ? (
        <Region title="A new case" sub="An input, what you expect back, and what the judge scores.">
          {/* The `htmlFor`/`id` pairs are the port, not decoration: the retired
              `Field` was a `<label>` wrapping its control, so the two were bound
              by containment. Meridian's is a `<div>` and binds by name. */}
          <Field label="What to call it" htmlFor="new-case-name">
            <Input
              id="new-case-name"
              value={form.name}
              placeholder="Refuses to invent a number"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="What it is sent" htmlFor="new-case-input">
            <Textarea
              id="new-case-input"
              rows={3}
              value={form.input}
              placeholder="The message the surface receives"
              onChange={(e) => setForm({ ...form, input: e.target.value })}
            />
          </Field>
          <Field label="What it should say back" htmlFor="new-case-expected">
            <Textarea
              id="new-case-expected"
              rows={2}
              value={form.expected}
              placeholder="Leave this empty and the rubric alone decides"
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
            />
          </Field>
          <Field label="What the judge scores against" htmlFor="new-case-rubric">
            <Input
              id="new-case-rubric"
              value={form.rubric}
              placeholder="Five lines or fewer, no invented figures, names the owner"
              onChange={(e) => setForm({ ...form, rubric: e.target.value })}
            />
          </Field>

          {create.isError ? (
            <ReadFailedLine>{(create.error as Error).message}</ReadFailedLine>
          ) : null}

          <Actions trailing={<Action onClick={() => setFormOpen(false)}>Leave it</Action>}>
            <Action
              variant="primary"
              disabled={!form.name || !form.input || create.isPending}
              title={!form.name || !form.input ? "It needs a name and an input" : undefined}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Adding it" : "Add it"}
            </Action>
          </Actions>
        </Region>
      ) : null}

      <Region
        title="Cases"
        /* `act` and not `toggle`: the form opens as its own region ABOVE this
           one, so nothing inside this region expands and `aria-expanded` would
           name a disclosure that never happens here. It goes nowhere either, so
           it is not `goTo`. It starts writing a case, which is work on this
           region's subject. */
        act={formOpen ? undefined : "New case"}
        onAct={() => setFormOpen(true)}
      >
        {cases.length === 0 ? (
          <NothingYet
            action={
              formOpen ? undefined : (
                <Action variant="primary" onClick={() => setFormOpen(true)}>
                  Write the first one
                </Action>
              )
            }
          >
            No cases yet, so this suite cannot run. Each one is an input, an optional expected
            answer, and a rubric the judge scores against.
          </NothingYet>
        ) : (
          cases.map((c) => {
            const isOpen = open === c.id;
            // Keyed Fragment, never a wrapper div: see FailingCases above.
            return (
              <Fragment key={c.id}>
                <Row
                  tight
                  focused={isOpen}
                  lead={c.name}
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  sub={c.enabled ? "Runs with the suite" : "Switched off, so it does not run"}
                  action={
                    <Toggle
                      checked={c.enabled}
                      disabled={toggle.isPending}
                      label={`${c.name} runs with the suite`}
                      onChange={(next) => toggle.mutate({ caseId: c.id, enabled: next })}
                    />
                  }
                />
                {isOpen ? (
                  <>
                    <Line label="What it is sent" />
                    <Prose>{c.input}</Prose>
                    {c.expected ? (
                      <>
                        <Line label="What it should say back" />
                        <Prose>{c.expected}</Prose>
                      </>
                    ) : null}
                    {c.rubric ? (
                      <>
                        <Line label="What the judge scores against" />
                        <Prose>{c.rubric}</Prose>
                      </>
                    ) : null}
                    <Actions>
                      <Action
                        busy={remove.isPending}
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Delete this case?",
                            body: "Past runs keep the result it produced. It stops running from now on.",
                            destructive: true,
                            confirmLabel: "Delete it",
                          });
                          if (!ok) return;
                          remove.mutate(c.id);
                        }}
                      >
                        Delete this case
                      </Action>
                    </Actions>
                  </>
                ) : null}
              </Fragment>
            );
          })
        )}

        {failure ? <ReadFailedLine>{(failure as Error).message}</ReadFailedLine> : null}
      </Region>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * How it is set
 * ------------------------------------------------------------------ */

function Config({
  suite,
  onChanged,
  onDeleted,
}: {
  suite: Suite;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateEvalSuite);
  const deleteFn = useServerFn(deleteEvalSuite);
  const confirm = useConfirm();

  const enabled = useMutation({
    mutationFn: (next: boolean) => updateFn({ data: { suite_id: suite.id, enabled: next } }),
    onSuccess: onChanged,
  });

  const remove = useMutation({
    mutationFn: () => deleteFn({ data: { suite_id: suite.id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["eval_suites"] });
      void qc.invalidateQueries({ queryKey: ["eval_coverage"] });
      onDeleted();
    },
  });

  return (
    <Region title="How it is set" sub="Set once, and it holds for every run from now on.">
      <Line
        label="Running at all"
        sub={
          suite.enabled
            ? "Switch it off and it stops running and stops counting toward coverage."
            : "It is off. Nothing runs it, and the surface it watches counts as unguarded."
        }
      >
        <Toggle
          checked={suite.enabled}
          disabled={enabled.isPending}
          label={`${suite.name} runs`}
          onChange={(next) => enabled.mutate(next)}
        />
      </Line>

      <Line label="What it watches" sub="The prompt every case is sent through.">
        <Value>
          <Num>
            {suite.surface}/{suite.prompt_key}
          </Num>
        </Value>
      </Line>

      <Line label="Who scores it" sub="The model that reads the answer and rules on it.">
        <Value>
          <Num>{suite.judge_model}</Num>
        </Value>
      </Line>

      <Line
        label="What answers it"
        sub={
          suite.model
            ? "Pinned, so a model change elsewhere cannot move this score."
            : "Not pinned. It runs on whatever the surface is set to."
        }
      >
        <Value>{suite.model ? <Num>{suite.model}</Num> : "the surface default"}</Value>
      </Line>

      <Line label="The score a case has to clear" sub="Anything under this fails the case.">
        <Value>
          <Num>{suite.pass_threshold}</Num>
        </Value>
      </Line>

      <Line
        label="When it runs by itself"
        sub={
          suite.schedule_cron ? "On this schedule, without being asked." : "Only when you run it."
        }
      >
        <Value>{suite.schedule_cron ? <Num>{suite.schedule_cron}</Num> : "never"}</Value>
      </Line>

      {(enabled.error ?? remove.error) ? (
        <ReadFailedLine>{((enabled.error ?? remove.error) as Error).message}</ReadFailedLine>
      ) : null}

      <Actions>
        <Action
          busy={remove.isPending}
          onClick={async () => {
            const ok = await confirm({
              title: "Delete this suite?",
              body: "It takes every case and every run inside it. There is no way back from this one.",
              destructive: true,
              confirmLabel: "Delete it",
            });
            if (!ok) return;
            remove.mutate();
          }}
        >
          {remove.isPending ? "Deleting it" : "Delete this suite"}
        </Action>
      </Actions>
    </Region>
  );
}
