/**
 * PROMPTS. Ported onto the shell primitives, 2026-07-29.
 *
 * What it was: a five column CSS grid pretending to be a table, `EmptyState`,
 * `MonoLabel`, `bento` panels, pill buttons that drew their own selected state
 * out of `--text-primary` on `--canvas`, two 420px `<pre>` panes side by side,
 * and a usage panel with hand-rolled 4px bars.
 *
 * WHAT WENT, AND WHAT IT COST:
 *   GONE  the "Diff" button on every list row. It did exactly what clicking
 *         the row already did. Two affordances for one act is the row telling
 *         you it does not know what it is.
 *   GONE  the two full-text panes. The line diff below them already contained
 *         both versions in full, unchanged lines included, so the panes were
 *         the same text a second time at half the width. The draft editor
 *         stays, because you cannot edit inside a diff.
 *   GONE  the usage bars. Four bars in one neutral tint, redrawing four
 *         percentages printed beside them. They fail the greyscale test by
 *         construction: remove the colour and nothing was lost, which means
 *         nothing was carried.
 *   GONE  the version pills. A template can carry twenty versions; twenty
 *         pills is a wrap, a scroll and twenty tab stops for one decision.
 *         A `Select` is one tab stop and holds any number of them.
 *   KEPT  every server call: fork, save, publish, set active, roll back, and
 *         the A/B assignment.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Six writes on this surface
 * fired a success toast and erased themselves: rolled back, forked, saved,
 * published, set active, assignment saved. A toast confirms your click
 * registered. Each one now leaves a `Receipt` naming what runs differently
 * because of it, which is what the click CAUSED. Publishing a prompt changes
 * what every user of that surface is answered by, and that deserves a mark.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Diffstat,
  NothingHere,
  NothingYet,
  Num,
  PageHeading,
  Picker,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Checkbox, Textarea } from "@/components/meridian/forms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  listPromptTemplates,
  getPromptTemplate,
  createPromptVersion,
  updatePromptVersion,
  publishPromptVersion,
  setActiveVersion,
  setAssignment,
  getPromptAnalytics,
  rollbackPromptVersion,
} from "@/lib/prompts.functions";
import { Pre, Receipt } from "@/components/shell/primitives";

type TemplateRow = {
  id: string;
  surface: string;
  key: string;
  name: string;
  description: string | null;
  active_version_id: string | null;
  default_version_id: string | null;
  built_in: boolean;
  active_version: { version: number; status: string; updated_at: string } | null;
};

type Version = {
  id: string;
  version: number;
  system_prompt: string;
  user_template: string;
  model: string | null;
  temperature: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/** One thing a write caused, held long enough to render its receipt. */
type Done = { verb: string; consequence: ReactNode; at: string };

function now(): string {
  return new Date().toISOString();
}

/** Plain words relative time, so a receipt reads without a formatter import. */
function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function PromptsPanel() {
  const qc = useQueryClient();
  const fList = useServerFn(listPromptTemplates);
  const fRollback = useServerFn(rollbackPromptVersion);
  const templates = useQuery({ queryKey: ["prompt-templates"], queryFn: () => fList() });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [done, setDone] = useState<Done[]>([]);

  const rollback = useMutation({
    mutationFn: (v: { id: string; name: string }) => fRollback({ data: { template_id: v.id } }),
    onSuccess: (r, v) => {
      setDone((d) => [
        ...d,
        {
          verb: "You rolled it back",
          consequence: (
            <>
              {v.name} answers from <Num>v{r.version}</Num> again, starting with the next call.
            </>
          ),
          at: now(),
        },
      ]);
      void qc.invalidateQueries({ queryKey: ["prompt-templates"] });
      void qc.invalidateQueries({ queryKey: ["prompt-template", v.id] });
    },
  });

  const rows = (templates.data as TemplateRow[] | undefined) ?? [];

  if (templates.isError) {
    return (
      <ReadFailed onRetry={() => void templates.refetch()}>
        The prompts did not load, so nothing below would be what the surfaces are actually running.
      </ReadFailed>
    );
  }

  if (templates.isLoading) {
    return <Reading>Reading what each surface is running.</Reading>;
  }

  if (selectedId) {
    return (
      <TemplateDetail
        templateId={selectedId}
        onBack={() => setSelectedId(null)}
        onMutated={() => qc.invalidateQueries({ queryKey: ["prompt-templates"] })}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <NothingHere
        action={
          <Action variant="quiet" onClick={() => void templates.refetch()}>
            Look again
          </Action>
        }
      >
        No prompt has been registered yet. Every AI surface runs on a versioned system prompt, and
        one lands here the first time that surface calls the runtime.
      </NothingHere>
    );
  }

  return (
    <Region
      title="What each surface is running"
      sub="One published version answers every call. Roll one back and the next call uses the version before it."
    >
      {rows.map((p) => {
        const v = p.active_version;
        const rolling = rollback.isPending && rollback.variables?.id === p.id;
        const canRoll = !!v && v.version > 1;
        return (
          <Row
            key={p.id}
            tight
            lead={p.name}
            onClick={() => setSelectedId(p.id)}
            sub={
              !v ? (
                <>
                  Nothing published.{" "}
                  <Num>
                    {p.surface}/{p.key}
                  </Num>{" "}
                  runs on its built-in text.
                </>
              ) : (
                <>
                  <Value tone={v.status === "draft" ? "hold" : "pass"}>
                    {v.status === "draft" ? "a draft is live" : "live"}
                  </Value>{" "}
                  on <Num>v{v.version}</Num>, {p.description ?? `${p.surface}/${p.key}`}
                </>
              )
            }
            action={
              <Action
                variant="quiet"
                disabled={rolling || !canRoll}
                title={canRoll ? undefined : "There is nothing earlier to go back to"}
                onClick={() => rollback.mutate({ id: p.id, name: p.name })}
              >
                {rolling ? "Rolling back" : "Roll back"}
              </Action>
            }
          />
        );
      })}

      {rollback.isError ? (
        <ReadFailedLine>{(rollback.error as Error).message}</ReadFailedLine>
      ) : null}

      {done.map((d, i) => (
        <Receipt key={`${d.at}-${i}`} verb={d.verb} consequence={d.consequence} time={ago(d.at)} />
      ))}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * One prompt
 * ------------------------------------------------------------------ */

function TemplateDetail({
  templateId,
  onBack,
  onMutated,
}: {
  templateId: string;
  onBack: () => void;
  onMutated: () => void;
}) {
  const qc = useQueryClient();
  const fGet = useServerFn(getPromptTemplate);
  const fFork = useServerFn(createPromptVersion);
  const fUpdate = useServerFn(updatePromptVersion);
  const fPublish = useServerFn(publishPromptVersion);
  const fSetActive = useServerFn(setActiveVersion);
  const fAnalytics = useServerFn(getPromptAnalytics);

  const [done, setDone] = useState<Done[]>([]);
  const mark = (verb: string, consequence: ReactNode) =>
    setDone((d) => [...d, { verb, consequence, at: now() }]);

  const detail = useQuery({
    queryKey: ["prompt-template", templateId],
    queryFn: () => fGet({ data: { template_id: templateId } }),
  });
  const analytics = useQuery({
    queryKey: ["prompt-analytics", templateId],
    queryFn: () => fAnalytics({ data: { template_id: templateId } }),
  });

  const versions = useMemo(
    () => (detail.data?.versions ?? []) as Version[],
    [detail.data?.versions],
  );
  const template = detail.data?.template as TemplateRow | undefined;
  const assignment = detail.data?.assignment ?? null;

  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  useEffect(() => {
    if (versions.length === 0) return;
    setLeftId((prev) =>
      prev && versions.find((v) => v.id === prev)
        ? prev
        : (template?.active_version_id ?? versions[0].id),
    );
    setRightId((prev) => (prev && versions.find((v) => v.id === prev) ? prev : versions[0].id));
  }, [versions, template?.active_version_id]);

  const left = versions.find((v) => v.id === leftId);
  const right = versions.find((v) => v.id === rightId);

  const [draftText, setDraftText] = useState<string>("");
  const rightVersionId = right?.id;
  const rightPrompt = right?.system_prompt;
  useEffect(() => {
    if (rightVersionId != null && rightPrompt != null) setDraftText(rightPrompt);
  }, [rightVersionId, rightPrompt]);
  const editable = right?.status === "draft";

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["prompt-template", templateId] });
    void qc.invalidateQueries({ queryKey: ["prompt-analytics", templateId] });
    onMutated();
  };

  const mFork = useMutation({
    mutationFn: () => fFork({ data: { template_id: templateId, base_version_id: right?.id } }),
    onSuccess: (v) => {
      mark(
        "You forked it",
        <>
          <Num>v{v.version}</Num> is a draft. Nothing is answered by it until you publish it.
        </>,
      );
      setRightId(v.id);
      invalidate();
    },
  });
  const mSave = useMutation({
    mutationFn: () => fUpdate({ data: { version_id: right!.id, system_prompt: draftText } }),
    onSuccess: () => {
      mark(
        "You saved the draft",
        <>
          <Num>v{right?.version}</Num> holds your text. It is still not answering anyone.
        </>,
      );
      invalidate();
    },
  });
  const mPublish = useMutation({
    mutationFn: () => fPublish({ data: { version_id: right!.id, template_id: templateId } }),
    onSuccess: () => {
      mark(
        "You published it",
        <>
          Every call to{" "}
          <Num>
            {template?.surface}/{template?.key}
          </Num>{" "}
          is answered by <Num>v{right?.version}</Num> from now on.
        </>,
      );
      invalidate();
    },
  });
  const mSetActive = useMutation({
    mutationFn: (id: string) => fSetActive({ data: { template_id: templateId, version_id: id } }),
    onSuccess: (_r, id) => {
      const v = versions.find((x) => x.id === id);
      mark(
        "You switched the live version",
        <>
          Traffic routes to <Num>v{v?.version}</Num> now.
        </>,
      );
      invalidate();
    },
  });

  const backButton = (
    <Action variant="quiet" onClick={onBack}>
      All prompts
    </Action>
  );

  if (detail.isLoading) {
    return <Reading>Reading this prompt and its versions.</Reading>;
  }
  // A read that failed may never wear the not-found state's clothes.
  if (detail.isError) {
    return (
      <>
        <PageHeading title="This prompt did not load." />
        <ReadFailed onRetry={() => void detail.refetch()}>
          {(detail.error as Error)?.message}. Nothing below would be what the surface is running.
        </ReadFailed>
        <Region>{backButton}</Region>
      </>
    );
  }
  if (!template) {
    return (
      <>
        <PageHeading title="No prompt by that name." />
        <NothingHere action={backButton}>
          Nothing in this workspace answers to that id. It may have been removed.
        </NothingHere>
      </>
    );
  }

  const activeVersion = versions.find((v) => v.id === template.active_version_id);
  const diffBase = left?.system_prompt ?? "";
  const diffHead = (editable ? draftText : right?.system_prompt) ?? "";
  const dirty = editable && right != null && draftText !== right.system_prompt;

  return (
    <>
      <PageHeading
        title={template.name}
        sub={
          activeVersion ? (
            <>
              <Num>
                {template.surface}/{template.key}
              </Num>{" "}
              is answered by <Num>v{activeVersion.version}</Num>.
            </>
          ) : (
            <>
              <Num>
                {template.surface}/{template.key}
              </Num>{" "}
              has no published version, so it runs on its built-in text.
            </>
          )
        }
      />

      <Region
        title="Which two you are comparing"
        sub="The left is the one you are measuring against. The right is the one you can change."
      >
        <Line label="Measured against" htmlFor="prompt-left">
          <Picker id="prompt-left" value={leftId ?? ""} onChange={(e) => setLeftId(e.target.value)}>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version}, {v.status}
                {v.id === template.active_version_id ? ", live" : ""}
              </option>
            ))}
          </Picker>
        </Line>

        <Line
          label="The one you are working on"
          sub={
            editable
              ? "A draft, so you can edit it below."
              : "Published, so it cannot be changed. Fork it to edit."
          }
          htmlFor="prompt-right"
        >
          <Picker
            id="prompt-right"
            value={rightId ?? ""}
            onChange={(e) => setRightId(e.target.value)}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version}, {v.status}
                {v.id === template.active_version_id ? ", live" : ""}
              </option>
            ))}
          </Picker>
        </Line>

        {(mFork.error ?? mSetActive.error) ? (
          <ReadFailedLine>{((mFork.error ?? mSetActive.error) as Error).message}</ReadFailedLine>
        ) : null}

        <Actions>
          <Action busy={mFork.isPending} onClick={() => mFork.mutate()}>
            {mFork.isPending ? "Forking it" : "Fork a draft from the right"}
          </Action>
          {rightId && rightId !== template.active_version_id ? (
            <Action
              busy={mSetActive.isPending}
              onClick={() => mSetActive.mutate(rightId)}
              title="Routes every new call to this version"
            >
              {mSetActive.isPending ? "Switching" : "Make the right one live"}
            </Action>
          ) : null}
        </Actions>
      </Region>

      {editable ? (
        <Region
          title="The draft"
          sub={
            dirty ? "Changed, and not saved yet." : "Saved. It is not live until you publish it."
          }
        >
          <Textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            aria-label="The draft system prompt"
            rows={18}
          />

          {(mSave.error ?? mPublish.error) ? (
            <ReadFailedLine>{((mSave.error ?? mPublish.error) as Error).message}</ReadFailedLine>
          ) : null}

          <Actions>
            <Action
              variant="primary"
              disabled={mPublish.isPending || dirty}
              title={dirty ? "Save what you changed first" : "Every new call uses this"}
              onClick={() => mPublish.mutate()}
            >
              {mPublish.isPending ? "Publishing it" : "Publish it"}
            </Action>
            <Action disabled={mSave.isPending || !dirty} onClick={() => mSave.mutate()}>
              {mSave.isPending ? "Saving it" : "Save it"}
            </Action>
          </Actions>
        </Region>
      ) : null}

      <DiffBlock base={diffBase} head={diffHead} />

      <AssignmentBlock
        templateId={templateId}
        assignment={assignment}
        versions={versions}
        onSaved={(pct, aV, bV) => {
          mark(
            "You set the split",
            bV ? (
              <>
                <Num>{pct}%</Num> of new calls go to <Num>v{aV}</Num>, the rest to <Num>v{bV}</Num>.
              </>
            ) : (
              <>
                Every new call goes to <Num>v{aV}</Num>.
              </>
            ),
          );
          invalidate();
        }}
      />

      <UsageBlock
        versions={versions}
        runs={(analytics.data?.runs as { version_id: string; variant: string }[] | undefined) ?? []}
        failed={analytics.isError}
        // A failure signal with no loading signal left the block asserting that
        // nothing had called this prompt in thirty days for every moment before
        // the read landed - on the block a person reads to decide whether a
        // version is safe to roll back.
        loading={analytics.isLoading}
        onRetry={() => void analytics.refetch()}
      />

      {done.length > 0 ? (
        <Region title="What you changed">
          {done.map((d, i) => (
            <Receipt
              key={`${d.at}-${i}`}
              verb={d.verb}
              consequence={d.consequence}
              time={ago(d.at)}
            />
          ))}
        </Region>
      ) : null}

      <Region>{backButton}</Region>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The diff
 * ------------------------------------------------------------------ */

/** Line level diff. It carries the whole of both versions, unchanged lines
 *  included, which is why the two full-text panes it used to sit under are
 *  gone: they were the same text a second time. */
function DiffBlock({ base, head }: { base: string; head: string }) {
  const diff = useMemo(() => computeLineDiff(base, head), [base, head]);
  const added = diff.filter((d) => d.t === "add").length;
  const removed = diff.filter((d) => d.t === "del").length;
  const same = added === 0 && removed === 0;

  return (
    <Region
      title="What is different"
      sub={same ? undefined : <Diffstat added={added} removed={removed} />}
    >
      {same ? (
        <NothingYet>The two are identical, line for line.</NothingYet>
      ) : (
        <Pre>
          {diff.map((d, i) => (
            <span
              key={i}
              style={{ display: "block" }}
              className={d.t === "add" ? "sp-pass" : d.t === "del" ? "sp-fail" : undefined}
            >
              {d.t === "add" ? "+ " : d.t === "del" ? "- " : "  "}
              {d.line || " "}
            </span>
          ))}
        </Pre>
      )}
    </Region>
  );
}

function computeLineDiff(a: string, b: string): { t: "eq" | "add" | "del"; line: string }[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length,
    m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: { t: "eq" | "add" | "del"; line: string }[] = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ t: "eq", line: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ t: "del", line: A[i] });
      i++;
    } else {
      out.push({ t: "add", line: B[j] });
      j++;
    }
  }
  while (i < n) {
    out.push({ t: "del", line: A[i++] });
  }
  while (j < m) {
    out.push({ t: "add", line: B[j++] });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The split
 * ------------------------------------------------------------------ */

function AssignmentBlock({
  templateId,
  assignment,
  versions,
  onSaved,
}: {
  templateId: string;
  assignment: {
    variant_a_version_id: string | null;
    variant_b_version_id: string | null;
    split_pct: number;
    enabled: boolean;
  } | null;
  versions: Version[];
  onSaved: (pct: number, aVersion: number | undefined, bVersion: number | undefined) => void;
}) {
  const fAssign = useServerFn(setAssignment);
  const [aId, setAId] = useState<string>(assignment?.variant_a_version_id ?? "");
  const [bId, setBId] = useState<string>(assignment?.variant_b_version_id ?? "");
  const [split, setSplit] = useState<number>(assignment?.split_pct ?? 100);
  const [enabled, setEnabled] = useState<boolean>(assignment?.enabled ?? true);
  useEffect(() => {
    setAId(assignment?.variant_a_version_id ?? "");
    setBId(assignment?.variant_b_version_id ?? "");
    setSplit(assignment?.split_pct ?? 100);
    setEnabled(assignment?.enabled ?? true);
  }, [
    assignment?.variant_a_version_id,
    assignment?.variant_b_version_id,
    assignment?.split_pct,
    assignment?.enabled,
  ]);

  const save = useMutation({
    mutationFn: () =>
      fAssign({
        data: {
          template_id: templateId,
          variant_a_version_id: aId || null,
          variant_b_version_id: bId || null,
          split_pct: split,
          enabled,
        },
      }),
    onSuccess: () =>
      onSaved(
        split,
        versions.find((v) => v.id === aId)?.version,
        versions.find((v) => v.id === bId)?.version,
      ),
  });

  return (
    <Region
      title="Running two of them against each other"
      sub="A split applies to new calls only. Calls already in flight keep the version they started on."
    >
      {/* A Checkbox, not a Switch: this sits there until you press save, and a
          Switch means the boundary went live the moment you touched it. */}
      <Line label="Split the traffic" htmlFor="assignment-on">
        <Checkbox
          id="assignment-on"
          checked={enabled}
          onChange={setEnabled}
          label="Split the traffic between two versions"
        />
      </Line>

      <Line label="The one most calls get" htmlFor="assignment-a">
        <Picker id="assignment-a" value={aId} onChange={(e) => setAId(e.target.value)}>
          <option value="">none</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version}, {v.status}
            </option>
          ))}
        </Picker>
      </Line>

      <Line label="The one you are testing" htmlFor="assignment-b">
        <Picker id="assignment-b" value={bId} onChange={(e) => setBId(e.target.value)}>
          <option value="">none</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version}, {v.status}
            </option>
          ))}
        </Picker>
      </Line>

      <Line
        label="How much goes to the first one"
        sub={bId ? undefined : "Pick a second version and this starts to matter."}
        htmlFor="assignment-split"
      >
        <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-space-3)" }}>
          <input
            id="assignment-split"
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            style={{ width: 160, accentColor: "var(--sp-ink)" }}
          />
          <Value>
            <Num>{split}%</Num>
          </Value>
        </span>
      </Line>

      {save.isError ? <ReadFailedLine>{(save.error as Error).message}</ReadFailedLine> : null}

      <Actions>
        <Action busy={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving it" : "Save the split"}
        </Action>
      </Actions>
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * Who answered what
 * ------------------------------------------------------------------ */

function UsageBlock({
  versions,
  runs,
  failed,
  loading,
  onRetry,
}: {
  versions: Version[];
  runs: { version_id: string; variant: string }[];
  failed: boolean;
  /** Loading, Empty and Failed are three different primitives. `runs` defaults
   *  to `[]`, so without this the Empty spoke for the read that had not landed
   *  yet as well as for the read that came back with nothing. */
  loading: boolean;
  onRetry: () => void;
}) {
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of runs) map.set(r.version_id, (map.get(r.version_id) ?? 0) + 1);
    return map;
  }, [runs]);
  const total = runs.length;

  if (failed) {
    return (
      <Region title="Who answered what">
        <ReadFailedLine onRetry={onRetry}>
          The call history did not load, so no share can be worked out from it.
        </ReadFailedLine>
      </Region>
    );
  }

  if (loading) {
    return (
      <Region title="Who answered what">
        <Reading>Reading the last 30 days of calls.</Reading>
      </Region>
    );
  }

  return (
    <Region title="Who answered what" sub="The last 30 days.">
      {total === 0 ? (
        <NothingYet>
          Nothing has called this prompt in the last 30 days, so there is no share to work out.
        </NothingYet>
      ) : (
        versions.map((v) => {
          const n = totals.get(v.id) ?? 0;
          // A percentage over an empty sample is a fabricated number; total is
          // guaranteed non-zero here by the branch above.
          const pct = Math.round((n / total) * 100);
          return (
            <Line
              key={v.id}
              label={
                <>
                  <Num>v{v.version}</Num>, {v.status}
                </>
              }
              sub={n === 0 ? "Nothing reached it." : undefined}
            >
              <Value>
                <Num>{n}</Num> calls, <Num>{pct}%</Num>
              </Value>
            </Line>
          );
        })
      )}
    </Region>
  );
}
