/**
 * EVALS. Ported onto the shell primitives, 2026-07-29.
 *
 * What it was: a two column grid of `bento .lift` cards carrying a display
 * score, a `VerdictChip`, a 4px progress bar, and a hand-rolled coverage chip
 * map that drew its own borders, its own tints, its own glow and its own
 * selected ring out of raw palette variables. Nine literal colours in one
 * component, and a selected state built on `box-shadow`, which the legacy sheet
 * erases on focus anyway (styles.css:2174).
 *
 * What it is: `Block` per region, `Row` per suite, `Grid` + `Cell` for the
 * coverage map. The cell was built for exactly this: a short set you SCAN
 * across and PICK from, tinted rather than bordered, and its selected state is
 * an overlay rather than a shadow. Nothing here carries a colour; it asks for a
 * tone and the stylesheet owns the mix.
 *
 * The progress bars are gone. A bar whose only job is to redraw a number that
 * is already on the line beside it is decoration, and it fails the greyscale
 * test on its own. The score, the gate it is measured against and the word for
 * whether it cleared it are all there in words.
 *
 * THE COMMIT. Creating a suite used to fire "Suite created. Add cases to start
 * evaluating." and then navigate. The toast confirmed the click; the navigation
 * already rendered the consequence, which is the new suite sitting there with
 * no cases and no runs. The toast is gone and the navigation stays: you land on
 * what you made rather than reading that you made it.
 */
import { useServerFn } from "@tanstack/react-start";
import { Num } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  listEvalSuites,
  createEvalSuite,
  getEvalScoreTrends,
  getEvalCoverage,
} from "@/lib/evals.functions";
import { Actions, Block, Button, Cell, Empty, Failed, Field, Grid, Input, Line, Loading, Row, Select, Value } from "@/components/shell/primitives";
// One source of truth for the canonical surface x prompt targets (shared with the EVAL-COVERAGE
// scorer), so the "new suite" picker and the coverage map can never drift.
import { EVAL_COVERAGE_TARGETS as SURFACE_KEYS } from "@/lib/evals/coverage";

type SuiteRow = {
  id: string;
  name: string;
  description: string | null;
  surface: string;
  prompt_key: string;
  judge_model: string;
  pass_threshold: number;
  enabled: boolean;
  case_count: number;
  last_run: {
    status: string;
    avg_score: number | null;
    pass_count: number;
    fail_count: number;
    created_at: string;
  } | null;
};

/** What a coverage state means to the person reading it, in plain words and in
 *  the `Value` tone vocabulary. A missing guard is a gap to close, which is a
 *  caution; a guard that has never completed a run is unproven, which is not an
 *  outcome at all and so stays quiet. */
const COVERAGE_STATE: Record<string, { word: string; tone: "quiet" | "pass" | "warn" }> = {
  covered: { word: "guarded", tone: "pass" },
  stale: { word: "never run", tone: "quiet" },
  uncovered: { word: "no guard", tone: "warn" },
};

export function EvalsPanel() {
  const navigate = useNavigate();
  const listFn = useServerFn(listEvalSuites);
  const trendsFn = useServerFn(getEvalScoreTrends);
  const suitesQ = useQuery({ queryKey: ["eval_suites"], queryFn: () => listFn() });
  const trendsQ = useQuery({ queryKey: ["eval_suite_trends"], queryFn: () => trendsFn() });
  const coverageFn = useServerFn(getEvalCoverage);
  const coverageQ = useQuery({ queryKey: ["eval_coverage"], queryFn: () => coverageFn() });
  const coverageSummary = coverageQ.data?.summary ?? "";
  const coverageTargets = coverageQ.data?.targets ?? [];
  const coverageFloor = coverageQ.data?.floor;

  const [createOpen, setCreateOpen] = useState(false);
  // One click "guard this surface": a gap cell seeds the create form with that
  // surface, so you go from "this surface has nothing watching it" to a
  // pre-targeted new suite without retyping what the cell already said.
  // Cleared whenever the form closes, so a later manual open is unseeded.
  const [prefill, setPrefill] = useState<{ target: string; name: string } | null>(null);
  const openGuardFor = (t: { surface: string; key: string; label: string }) => {
    setPrefill({ target: `${t.surface}/${t.key}`, name: t.label });
    setCreateOpen(true);
  };

  const suites = (suitesQ.data ?? []) as SuiteRow[];
  const trends = trendsQ.data?.trends ?? {};

  const openSuite = (id: string) =>
    navigate({ to: "/engine-room", search: { room: "quality", view: "suites", suite: id } });

  // A read that FAILED is not an empty state. "Nothing here" and "we could not
  // find out" are different facts and you act differently on each.
  if (suitesQ.isError) {
    return (
      <Failed onRetry={() => void suitesQ.refetch()}>
        The suites did not load, so nothing below would be the real coverage.
      </Failed>
    );
  }

  if (suitesQ.isLoading) {
    return <Loading>Reading what guards each surface.</Loading>;
  }

  const openManually = () => {
    setPrefill(null); // a manual open is unseeded; only a gap cell pre-targets
    setCreateOpen(true);
  };

  return (
    <>
      {/* Coverage. Silent at full coverage: the summary is "" and the whole
          region stays away rather than congratulating you.

          WHICH IS PRECISELY WHY A FAILED READ MAY NOT BE SILENT HERE. The
          `?? ""` above collapses a coverage read that never landed into the
          exact value a fully-guarded account produces, and by the convention in
          the line above, that silence TELLS the reader every surface is guarded
          and the floor is met. An unguarded prompt and a failed read rendered
          identically, and the failed one rendered as all clear - on the region
          whose whole job is to say what has nothing watching it.

          So the error arm is checked BEFORE the summary. Only an empty summary
          from a read that SUCCEEDED is allowed to say nothing. */}
      {coverageQ.isError ? (
        <Block title="What has a guard on it">
          <Failed onRetry={() => void coverageQ.refetch()}>
            The coverage read did not land. The silence here does not mean every surface is guarded,
            it means we could not find out which ones are.
          </Failed>
        </Block>
      ) : coverageSummary ? (
        <Block title="What has a guard on it" sub={coverageSummary}>
          {coverageFloor?.configured && !coverageFloor.pass ? (
            <Line label="The floor you set" sub={coverageFloor.reasons.join(". ")}>
              <Value tone="fail">not met</Value>
            </Line>
          ) : null}

          {coverageTargets.length > 0 ? (
            <Grid>
              {coverageTargets.map((t) => {
                const meta = COVERAGE_STATE[t.state] ?? COVERAGE_STATE.uncovered;
                const targetId = `${t.surface}/${t.key}`;
                return (
                  <Cell
                    key={targetId}
                    lead={t.label}
                    sub={<Value tone={meta.tone}>{meta.word}</Value>}
                    selected={createOpen && prefill?.target === targetId}
                    onClick={() => openGuardFor(t)}
                    title={
                      t.state === "covered"
                        ? `${t.label} is guarded. Add another suite for it`
                        : `Write a guard for ${t.label}`
                    }
                  />
                );
              })}
            </Grid>
          ) : null}
        </Block>
      ) : null}

      {createOpen ? (
        <CreateSuiteForm
          // Re-key on the prefill so picking a different gap cell while the form
          // is already open remounts it with the new surface seeded (useState
          // seeds on mount only).
          key={prefill?.target ?? "manual"}
          initialTarget={prefill?.target}
          initialName={prefill?.name}
          onClose={() => {
            setCreateOpen(false);
            setPrefill(null);
          }}
          onCreated={(id) => {
            setCreateOpen(false);
            setPrefill(null);
            openSuite(id);
          }}
        />
      ) : null}

      <Block
        title="What we test"
        more={suites.length > 0 && !createOpen ? "New suite" : undefined}
        onMore={openManually}
      >
        {suites.length === 0 ? (
          <Empty
            action={
              createOpen ? undefined : (
                <Button variant="primary" onClick={openManually}>
                  Write the first one
                </Button>
              )
            }
          >
            Nothing is watching any prompt yet. A suite is a regression test on one: golden cases, a
            judge, and a score it has to clear. Until one exists, a quality drop reaches your users
            before it reaches you.
          </Empty>
        ) : (
          suites.map((s) => {
            const score = s.last_run?.avg_score != null ? Math.round(s.last_run.avg_score) : null;
            const t = trends[s.id];
            const diff = t && t.previous != null ? t.latest - t.previous : null;
            const clears = score != null && score >= s.pass_threshold;
            return (
              <Row
                key={s.id}
                lead={s.name}
                tight
                onClick={() => openSuite(s.id)}
                sub={
                  score == null ? (
                    <>
                      Never run.{" "}
                      <Num>
                        {s.case_count} case{s.case_count === 1 ? "" : "s"}
                      </Num>
                      {!s.enabled ? ", and it is switched off" : null}
                    </>
                  ) : (
                    <>
                      <Value tone={clears ? "pass" : "fail"}>
                        {clears ? "clears the gate" : "below the gate"}
                      </Value>{" "}
                      <Num>{score}</Num> against <Num>{s.pass_threshold}</Num>
                      {diff != null ? (
                        <>
                          , {diff > 0.5 ? "improving" : diff < -0.5 ? "falling" : "holding steady"}
                        </>
                      ) : null}
                      {!s.enabled ? ", switched off" : null}
                    </>
                  )
                }
              />
            );
          })
        )}
      </Block>
    </>
  );
}

function CreateSuiteForm({
  onClose,
  onCreated,
  initialTarget,
  initialName,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  /** Pre-selected "surface/key" when opened from a coverage gap cell (one click guard). */
  initialTarget?: string;
  /** Pre-filled suite name when opened from a coverage gap cell. */
  initialName?: string;
}) {
  const qc = useQueryClient();
  const createFn = useServerFn(createEvalSuite);
  // Seed from a coverage gap cell when present; the picker only offers the canonical targets, so an
  // unknown initialTarget falls back to the default rather than an invalid surface/key.
  const seededTarget = SURFACE_KEYS.some((s) => `${s.surface}/${s.key}` === initialTarget)
    ? (initialTarget as string)
    : "chat/default";
  const [form, setForm] = useState({
    name: initialName ?? "",
    description: "",
    target: seededTarget,
    pass_threshold: 70,
  });
  const m = useMutation({
    mutationFn: async () => {
      const [surface, prompt_key] = form.target.split("/");
      return createFn({
        data: {
          name: form.name,
          description: form.description || null,
          surface,
          prompt_key,
          pass_threshold: form.pass_threshold,
        },
      });
    },
    onSuccess: (row: { id: string }) => {
      qc.invalidateQueries({ queryKey: ["eval_suites"] });
      qc.invalidateQueries({ queryKey: ["eval_coverage"] });
      // No toast. The next thing on screen is the suite itself, which is what
      // the write caused.
      onCreated(row.id);
    },
  });

  return (
    <Block title="A new guard" sub="It watches one prompt, and it runs against cases you write.">
      <Field label="What to call it">
        <Input
          value={form.name}
          placeholder="Chat tone regression"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="What it watches">
        <Select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
          {SURFACE_KEYS.map((s) => (
            <option key={`${s.surface}/${s.key}`} value={`${s.surface}/${s.key}`}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Why it exists">
        <Input
          value={form.description}
          placeholder="What would be broken if this drifted"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
      <Field label="The score a case has to clear">
        <Input
          type="number"
          min={0}
          max={100}
          value={form.pass_threshold}
          onChange={(e) => setForm({ ...form, pass_threshold: Number(e.target.value) })}
        />
      </Field>

      {m.isError ? <Failed>{(m.error as Error).message}</Failed> : null}

      <Actions trailing={<Button onClick={onClose}>Leave it</Button>}>
        <Button
          variant="primary"
          disabled={!form.name || m.isPending}
          title={!form.name ? "Name it first" : undefined}
          onClick={() => m.mutate()}
        >
          {m.isPending ? "Writing it" : "Write it"}
        </Button>
      </Actions>
    </Block>
  );
}
