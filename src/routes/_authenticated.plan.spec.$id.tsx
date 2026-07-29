/**
 * The spec editor, ported onto the rebuild primitives.
 *
 * WHAT THE RETIRED VERSION DID: a second header (TopBar) and a loop rail
 * (LoopThread) under the shell's own header, then a sticky glassmorphic
 * action bar, mono-caps tab labels shouting in all caps, and eight panels
 * each drawing its own bordered card in inline styles. Two outright bans
 * (the second header, the blurred bar) and a page that read as a pile.
 *
 * So this reads top to bottom: what the spec is · what you can do with it ·
 * which view you are in · the view · the tasks it implies · the design work ·
 * what it cites · why it exists · what it promised.
 *
 * THE EDITOR ITSELF IS UNTOUCHED. Every server call, mutation, query key,
 * route param and search param is the same: getPrd/savePrd/prdAssist, the
 * GitHub issue, Send to Build with its repo gate, Capture as decision, the
 * task-graph planner, the Linear push, the six tab values behind `?tab=`,
 * provenance, citations, and the outcome card. Only the chrome changed.
 *
 * Internal identifiers (prd_id, getPrd, ["prd", id]) intentionally stay: the
 * user-facing word is "spec", the schema word stays prd (CLAUDE.md
 * rename-disclaimer pattern).
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/lib/notify";
import {
  getPrd,
  savePrd,
  prdAssist,
  createGithubIssueForPrd,
  generateTaskGraph,
  type CriticReview,
  type OutcomeContract,
} from "@/lib/discovery.functions";
import { getProvenance } from "@/lib/lineage.functions";
import { CriticBadge } from "@/components/governance/CriticBadge";
import { RewindButton } from "@/components/prds/RewindButton";
import { PrecedentNudge } from "@/components/decision/PrecedentNudge";
import { SharedPremiseNudge } from "@/components/decision/SharedPremiseNudge";
import { DecisionCurrencyBanner } from "@/components/decision/DecisionCurrencyBanner";
import { CitationsCard, type Citation } from "@/components/product/CitationsCard";
import { OutcomeCard, type OutcomePrd } from "@/components/product/OutcomeCard";
import { OutcomeContractPanel } from "@/components/product/OutcomeContractPanel";
import { IntentVsBuiltReceipt } from "@/components/product/IntentVsBuiltReceipt";
import { SpecProjectionsPanel } from "@/components/product/SpecProjectionsPanel";
import { FlowDiagram } from "@/components/product/FlowDiagram";
import { LaunchPlanPanel } from "@/components/product/LaunchPlanPanel";
import { listTasks } from "@/lib/tasks.functions";
import { TaskGraphPanel } from "@/components/product/TaskGraphPanel";
import { DesignReadinessPanel } from "@/components/product/DesignReadinessPanel";
import { DesignScaffoldPanel } from "@/components/product/DesignScaffoldPanel";
import { listLinearTeams, createLinearIssuesFromTasks } from "@/lib/linear.functions";
import { dispatchStudioSession } from "@/lib/studio.functions";
import { createDecision } from "@/lib/decisions.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import {
  Actions,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Num,
  PageHead,
  Record as RecordRecess,
  Row,
  Select,
  Surface,
  Who,
} from "@/components/shell/primitives";

const MODE_TABS = ["contract", "projections", "edit", "preview", "flow", "launch"] as const;
type ModeTab = (typeof MODE_TABS)[number];

/** Sentence case, plain words. The all-caps labels were shouting, and
 *  "PROJECTIONS" named a mechanism rather than the thing you get. */
const MODE_DISPLAY: { id: ModeTab; label: string; hint?: string }[] = [
  {
    id: "contract",
    label: "Contract",
    hint: "What this spec promises, in a form the crew can check itself against",
  },
  {
    id: "projections",
    label: "Documents",
    hint: "The PRD, the FRD, the status note and the one-pager, written fresh from the contract",
  },
  { id: "edit", label: "Edit" },
  { id: "preview", label: "Preview" },
  { id: "flow", label: "Flow", hint: "The steps, decisions and states this spec implies" },
  {
    id: "launch",
    label: "Launch",
    hint: "Positioning, the checklist, and the window the outcome gets checked in",
  },
];

const ASSIST_ACTIONS = ["rewrite", "expand", "shorten", "critique"] as const;
const ASSIST_LABEL: Record<(typeof ASSIST_ACTIONS)[number], string> = {
  rewrite: "Rewrite",
  expand: "Expand",
  shorten: "Shorten",
  critique: "Critique",
};

/** Rendered markdown. There is no prose primitive, so the document's own
 *  ladder is written here once against the type scale rather than per call. */
const PREVIEW_COMPONENTS = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1
      style={{
        fontSize: "var(--sp-text-gate)",
        fontWeight: "var(--sp-weight-strong)",
        letterSpacing: "var(--sp-track-gate)",
        lineHeight: "var(--sp-leading-gate)",
        color: "var(--sp-ink)",
        margin: "0 0 14px",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2
      style={{
        fontSize: "var(--sp-text-body)",
        fontWeight: "var(--sp-weight-strong)",
        color: "var(--sp-ink)",
        margin: "26px 0 8px",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3
      style={{
        fontSize: "var(--sp-text-prose)",
        fontWeight: "var(--sp-weight-medium)",
        color: "var(--sp-ink)",
        margin: "20px 0 6px",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => <p style={{ margin: "0 0 12px" }}>{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul style={{ margin: "0 0 12px", paddingLeft: 20, listStyle: "disc" }}>{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol style={{ margin: "0 0 12px", paddingLeft: 20, listStyle: "decimal" }}>{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li style={{ margin: "0 0 5px" }}>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong style={{ color: "var(--sp-ink)", fontWeight: "var(--sp-weight-strong)" }}>
      {children}
    </strong>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code
      style={{
        fontFamily: "var(--sp-font-mono)",
        fontSize: "var(--sp-text-data)",
        background: "var(--sp-sink)",
        borderRadius: "var(--sp-radius-xs)",
        padding: "1px 5px",
      }}
    >
      {children}
    </code>
  ),
};

export const Route = createFileRoute("/_authenticated/plan/spec/$id")({
  // Optional so existing links/navigates work without search; CNV-04 lands
  // a freshly agent-authored spec straight on the Contract tab.
  validateSearch: (search: Record<string, unknown>): { tab?: ModeTab } => {
    const t = search.tab;
    return {
      tab: (MODE_TABS as readonly string[]).includes(t as string) ? (t as ModeTab) : undefined,
    };
  },
  component: SpecEditorPage,
  head: () => ({ meta: [{ title: "Spec · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <PageHead
        title="The spec did not load."
        sub={(error as Error)?.message ?? "No reason was reported."}
      />
      <Block>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Block>
    </Surface>
  ),
});

function SpecEditorPage() {
  const { id } = useParams({ from: "/_authenticated/plan/spec/$id" });
  const initialTab = Route.useSearch().tab;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fGet = useServerFn(getPrd);
  const mSave = useServerFn(savePrd);
  const mAssist = useServerFn(prdAssist);
  const mDispatchStudio = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const mCreateIssue = useServerFn(createGithubIssueForPrd);
  const mCaptureDecision = useServerFn(createDecision);
  const prdQ = useQuery({ queryKey: ["prd", id], queryFn: () => fGet({ data: { id } }) });

  // O1 (provenance): "why is this spec being built?" — walk the lineage graph up
  // to the root source signals the spec ultimately rests on.
  const fProvenance = useServerFn(getProvenance);
  const provQ = useQuery({
    queryKey: ["provenance", "prd", id],
    queryFn: () => fProvenance({ data: { kind: "prd", id } }),
  });

  const fTasks = useServerFn(listTasks);
  const fTeams = useServerFn(listLinearTeams);
  const fPushLinear = useServerFn(createLinearIssuesFromTasks);
  // Scoped under the "tasks" prefix (so every existing ["tasks"] invalidation
  // still hits it) but no longer colliding with other surfaces' global
  // ["tasks"] cache entry (audit D-14).
  const tasksQ = useQuery({ queryKey: ["tasks", "spec", id], queryFn: () => fTasks() });
  const teamsQ = useQuery({ queryKey: ["linear-teams"], queryFn: () => fTeams(), retry: false });
  const [teamId, setTeamId] = useState<string>("");

  const prdTasks = (tasksQ.data?.tasks ?? []).filter(
    (t: { prd_id: string | null }) => t.prd_id === id,
  );

  // H1 — Planner: decompose the spec into a dependency-ordered task graph.
  const fGenTasks = useServerFn(generateTaskGraph);
  const genTasks = useMutation({
    mutationFn: () => fGenTasks({ data: { prd_id: id } }),
    onSuccess: (r: { count: number; graph: boolean }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task-graph", id] });
      toast.success(
        `Planned ${r.count} task${r.count === 1 ? "" : "s"}${r.graph ? "" : " (graph fields apply after next sync)"}`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pushLinear = useMutation({
    mutationFn: () =>
      fPushLinear({
        data: { teamId, taskIds: prdTasks.map((t: { id: string }) => t.id) },
      }),
    onSuccess: (r) =>
      toast.success(`Created ${r.created.length} Linear issue${r.created.length === 1 ? "" : "s"}`),
    onError: (e: Error) => toast.error(e.message),
  });

  // W5b: the dispatch repo gate. Set when Send to Build cannot resolve a
  // repo; the dialog offers /sync or provision-a-starter-repo + auto retry.
  const [repoGate, setRepoGate] = useState<{ reason: string | null } | null>(null);

  const sendToStudio = useMutation({
    mutationFn: () => mDispatchStudio({ data: { prdId: id } }),
    onSuccess: (r) => {
      toast.success("Build session dispatched");
      navigate({ to: "/build/$missionId", params: { missionId: r.missionId } });
    },
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else toast.error(e.message);
    },
  });
  const sendToBuild = () =>
    gateDispatch({
      check: () => fCanDispatch({ data: { prdId: id } }),
      dispatch: () => sendToStudio.mutate(),
      openGate: (reason) => setRepoGate({ reason }),
    });

  const createIssue = useMutation({
    mutationFn: () => mCreateIssue({ data: { id } }),
    onSuccess: (r) => {
      toast.success(r.cached ? "GitHub issue already linked" : `GitHub issue #${r.number} created`);
      qc.invalidateQueries({ queryKey: ["prd", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const captureDecision = useMutation({
    mutationFn: () =>
      mCaptureDecision({
        data: {
          title: `Spec decision: ${(title || prdQ.data?.prd?.title || "Untitled spec").slice(0, 220)}`,
          rationale: (body || prdQ.data?.prd?.body_md || "").slice(0, 500) || undefined,
          status: "approved",
          prd_id: id,
        },
      }),
    onSuccess: () => {
      toast.success("Captured to Decisions");
      qc.invalidateQueries({ queryKey: ["decisions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<ModeTab>(initialTab ?? "contract");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prdQ.data?.prd) {
      setTitle(prdQ.data.prd.title);
      setBody(prdQ.data.prd.body_md);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prdQ.data?.prd?.id]);

  const save = useMutation({
    mutationFn: () => mSave({ data: { id, title, body_md: body } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prds"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // The retired action bar was sticky and blurred, which is the glass ban. The
  // keycap on Save replaces what stickiness bought on a long document, and it
  // is bound for real: a keycap that does nothing is a lie.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (!save.isPending) save.mutate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const assist = useMutation({
    mutationFn: (action: "rewrite" | "expand" | "critique" | "shorten") => {
      const ta = taRef.current;
      const sel =
        ta && ta.selectionStart !== ta.selectionEnd
          ? body.slice(ta.selectionStart, ta.selectionEnd)
          : body;
      if (!sel.trim()) throw new Error("Select some text first (or have content to work on)");
      return mAssist({ data: { action, selection: sel, context: body.slice(0, 4000) } });
    },
    onSuccess: (r) => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart,
        end = ta.selectionEnd;
      const next =
        start !== end ? body.slice(0, start) + r.text + body.slice(end) : body + "\n\n" + r.text;
      setBody(next);
      toast.success("Applied");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // State one of four: reading. A fact, not a spinner and not a fake skeleton.
  if (prdQ.isLoading) {
    return (
      <Surface>
        <PageHead title="Reading the spec." />
      </Surface>
    );
  }

  // Error and not-found are DIFFERENT states: a failed fetch never wears the
  // not-found instruction's clothes. getPrd's `.single()` throws PGRST116
  // ("multiple (or no) rows") when the id is missing or RLS-hidden, so that one
  // error shape IS the not-found case; everything else stays a real error.
  const specMissing =
    prdQ.isError &&
    /multiple \(or no\) rows|cannot coerce.*single/i.test((prdQ.error as Error)?.message ?? "");

  if (prdQ.isError && !specMissing) {
    return (
      <Surface>
        <PageHead
          title="The spec did not load."
          sub={(prdQ.error as Error)?.message ?? "No reason was reported."}
        />
        <Block>
          <Button variant="primary" onClick={() => prdQ.refetch()}>
            Try again
          </Button>
        </Block>
      </Surface>
    );
  }

  if (specMissing || !prdQ.data?.prd) {
    return (
      <Surface>
        <PageHead
          title="No spec here."
          sub="It was deleted, or it belongs to a workspace you are not in."
        />
        <Block>
          <Empty>Every live spec is listed on Plan.</Empty>
          <Actions>
            <Button variant="primary" onClick={() => navigate({ to: "/plan" })}>
              Go to Plan
            </Button>
          </Actions>
        </Block>
      </Surface>
    );
  }

  const prd = prdQ.data.prd;
  const issueMatch = prd.github_issue_url ? prd.github_issue_url.match(/\/issues\/(\d+)/) : null;
  const hasSnapshot = Boolean((prd as { snapshot_before?: unknown }).snapshot_before);
  const citations = (prd as { citations?: Citation[] | null }).citations ?? null;
  const signals = provQ.data?.source_signals ?? [];
  const signalCount = provQ.data?.signal_count ?? 0;

  const orderedTasks = [...prdTasks].sort(
    (a: { seq?: number | null }, b: { seq?: number | null }) => (a.seq ?? 999) - (b.seq ?? 999),
  );

  return (
    <>
      <Surface
        wide
        context={
          <>
            <div className="sp-ctx-head">Linked work</div>
            <div className="sp-ctx-body">
              <Num>{prdTasks.length}</Num> {prdTasks.length === 1 ? "task" : "tasks"} on this spec.{" "}
              {issueMatch ? (
                <a
                  href={prd.github_issue_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit" }}
                >
                  Issue #{issueMatch[1]}
                </a>
              ) : (
                "No GitHub issue yet."
              )}
            </div>

            <div className="sp-ctx-head">Review</div>
            <div className="sp-ctx-body">
              <CriticBadge
                review={(prd as { critic_review?: CriticReview | null }).critic_review ?? null}
                target={{ kind: "prd", id }}
                invalidateKey={["prd", id]}
              />
            </div>

            {hasSnapshot ? (
              <>
                <div className="sp-ctx-head">Before the crew touched it</div>
                <div className="sp-ctx-body">
                  <RewindButton prdId={id} hasSnapshot={true} />
                </div>
              </>
            ) : null}
          </>
        }
      >
        {/* The title is the h1 and it is editable in every view, the way it
            always was. There is no editable-title primitive, so it wears the
            title class and keeps a resting rule to say it can be typed in. */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Spec title"
          className="sp-title"
          style={{
            width: "100%",
            maxWidth: "56ch",
            background: "none",
            border: 0,
            borderBottom: "1px solid var(--sp-line-soft)",
            borderRadius: 0,
            outline: "none",
            padding: "0 0 6px",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--sp-mute)")}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--sp-line-soft)")}
        />
        <div className="sp-subtitle">
          {prd.status} · last saved <Num>{new Date(prd.updated_at).toLocaleDateString()}</Num>
        </div>

        <Actions>
          <Button
            variant="primary"
            shortcut="⌘S"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving" : "Save"}
          </Button>
          {prd.github_issue_url ? (
            <Button
              disabled={sendToStudio.isPending}
              onClick={() => void sendToBuild()}
              title="Plan, stage and open a pull request for this issue"
            >
              {sendToStudio.isPending ? "Sending" : "Send to Build"}
            </Button>
          ) : (
            <Button
              disabled={createIssue.isPending}
              onClick={() => createIssue.mutate()}
              title="Send to Build opens once the issue exists"
            >
              {createIssue.isPending ? "Creating" : "Create GitHub issue"}
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={captureDecision.isPending}
            onClick={() => captureDecision.mutate()}
            title="Put this on the record as a decision"
          >
            {captureDecision.isPending ? "Recording" : "Capture as decision"}
          </Button>
        </Actions>

        <DecisionCurrencyBanner kind="prd" targetId={id} className="mt-6" />
        <PrecedentNudge kind="prd" targetId={id} className="mt-6" />
        <SharedPremiseNudge kind="prd" targetId={id} className="mt-6" />

        <div
          className="sp-tabs"
          role="tablist"
          aria-label="Spec views"
          // Left/Right move between tabs (roving focus), unchanged.
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const idx = MODE_DISPLAY.findIndex((t) => t.id === mode);
            const delta = e.key === "ArrowRight" ? 1 : -1;
            const next = MODE_DISPLAY[(idx + delta + MODE_DISPLAY.length) % MODE_DISPLAY.length];
            setMode(next.id);
            e.currentTarget.querySelector<HTMLButtonElement>(`[data-tab-id="${next.id}"]`)?.focus();
          }}
        >
          {MODE_DISPLAY.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={mode === m.id}
              tabIndex={mode === m.id ? 0 : -1}
              data-tab-id={m.id}
              title={m.hint}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "edit" ? (
          <Block sub="The crew rewrites what you select. Select nothing and it works on the whole spec.">
            {/* The Textarea primitive does not forward a ref and the assist
                mutation needs the selection, so this is the primitive's class
                on a raw control rather than a second control. */}
            <textarea
              ref={taRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Spec body, markdown"
              spellCheck={false}
              rows={26}
              className="sp-textarea"
              style={{ fontFamily: "var(--sp-font-mono)" }}
            />
            <Actions>
              {ASSIST_ACTIONS.map((a) => (
                <Button
                  key={a}
                  variant="ghost"
                  disabled={assist.isPending}
                  onClick={() => assist.mutate(a)}
                >
                  {ASSIST_LABEL[a]}
                </Button>
              ))}
            </Actions>
          </Block>
        ) : mode === "preview" ? (
          <Block>
            {body.trim() ? (
              <article
                style={{
                  maxWidth: "72ch",
                  fontSize: "var(--sp-text-body)",
                  lineHeight: "var(--sp-leading-body)",
                  color: "var(--sp-body)",
                }}
              >
                <ReactMarkdown components={PREVIEW_COMPONENTS}>{body}</ReactMarkdown>
              </article>
            ) : (
              <Empty>Nothing is written yet. Switch to Edit and start it.</Empty>
            )}
          </Block>
        ) : mode === "contract" ? (
          <>
            <Block>
              <OutcomeContractPanel
                prdId={id}
                specTitle={prd.title}
                bodyMd={body}
                contract={(prd as { contract?: OutcomeContract | null }).contract}
                invalidateKey={["prd", id]}
              />
            </Block>
            {/* RPT-44: the honest intent-vs-built receipt lives beside the contract. */}
            <Block>
              <IntentVsBuiltReceipt prdId={id} />
            </Block>
          </>
        ) : mode === "projections" ? (
          <Block>
            <SpecProjectionsPanel
              title={prd.title}
              status={prd.status}
              updatedAt={prd.updated_at}
              contract={(prd as { contract?: OutcomeContract | null }).contract}
              bodyMd={body}
              citations={(citations ?? []).map((c) => ({
                label: c.title?.trim() || c.source_kind,
              }))}
            />
          </Block>
        ) : mode === "flow" ? (
          <Block>
            <FlowDiagram prdId={id} />
          </Block>
        ) : (
          <Block>
            <LaunchPlanPanel prdId={id} />
          </Block>
        )}

        <Block
          title="Tasks"
          more={genTasks.isPending ? "Planning" : "Break it into tasks"}
          onMore={() => {
            if (!genTasks.isPending) genTasks.mutate();
          }}
        >
          {tasksQ.isLoading ? null : orderedTasks.length === 0 ? (
            <Empty>
              No tasks yet. Break the spec into tasks when it is settled enough to build.
            </Empty>
          ) : (
            orderedTasks.map(
              (t: {
                id: string;
                seq?: number | null;
                title: string;
                detail?: string | null;
                estimate_hours?: number | null;
                assignee_kind?: string;
                risk?: string | null;
                depends_on?: unknown;
              }) => (
                <Row
                  key={t.id}
                  tight
                  marks={t.seq != null ? <Num>{t.seq}</Num> : null}
                  lead={<Who>{t.title}</Who>}
                  sub={
                    <>
                      {t.assignee_kind === "human" ? "you" : "the crew"}
                      {t.detail ? ` · ${t.detail}` : ""}
                      {Array.isArray(t.depends_on) && t.depends_on.length > 0 ? (
                        <>
                          {" · after "}
                          <Num>{(t.depends_on as number[]).map((n) => `#${n}`).join(", ")}</Num>
                        </>
                      ) : null}
                      {t.risk ? (
                        <>
                          {" · "}
                          <span className="sp-warn" title={t.risk}>
                            at risk
                          </span>
                        </>
                      ) : null}
                    </>
                  }
                  time={t.estimate_hours ? `${t.estimate_hours}h` : null}
                />
              ),
            )
          )}

          {/* H1-TASKS consumption: ready/blocked/progress + DAG integrity.
              Renders nothing until there is a generated graph to reason about. */}
          <TaskGraphPanel prdId={id} />

          {teamsQ.data?.teams && teamsQ.data.teams.length > 0 ? (
            <>
              <Field label="Push these tasks to Linear" htmlFor="linear-team">
                <Select id="linear-team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  <option value="">Pick a team</option>
                  {teamsQ.data.teams.map((t: { id: string; key: string; name: string }) => (
                    <option key={t.id} value={t.id}>
                      {t.key} · {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Actions>
                <Button
                  disabled={!teamId || prdTasks.length === 0 || pushLinear.isPending}
                  onClick={() => pushLinear.mutate()}
                >
                  {pushLinear.isPending ? "Creating" : "Create issues"}
                </Button>
              </Actions>
            </>
          ) : null}
        </Block>

        {/* DEF-04: what the spec already says about states, a11y and responsive
            behaviour, and the generated mockup. Both panels name themselves and
            both go silent when there is nothing to say, so neither gets a Block:
            a rule over an empty region is a rule that says nothing. */}
        <DesignReadinessPanel body={body} />
        <DesignScaffoldPanel prdId={id} specBody={body} />

        {citations && citations.length > 0 ? (
          <Block>
            <CitationsCard citations={citations} />
          </Block>
        ) : null}

        {/* O1 provenance — why this spec is being built, traced to source signals */}
        <Block title="Why this spec exists">
          {provQ.isLoading ? null : provQ.isError ? (
            <Failed onRetry={() => provQ.refetch()}>The chain did not come back.</Failed>
          ) : signalCount === 0 ? (
            <Empty>
              No source signals behind this one. It was written directly rather than raised by
              something a customer said.
            </Empty>
          ) : (
            <>
              <RecordRecess
                evidence={
                  <>
                    <Num>{signalCount}</Num> source {signalCount === 1 ? "signal" : "signals"} ·{" "}
                    <Num>{provQ.data!.node_count}</Num>{" "}
                    {provQ.data!.node_count === 1 ? "step" : "steps"}
                    {provQ.data!.truncated ? " · the chain continues past these" : ""}
                  </>
                }
              >
                This spec was not invented here. It traces back through the discovery chain to what
                people actually said.
              </RecordRecess>
              {signals.slice(0, 8).map((s) => (
                <Row
                  key={s.id}
                  tight
                  lead={(s.title ?? s.content ?? "signal").slice(0, 120)}
                  sub={s.source ?? "signal"}
                  onClick={() =>
                    // Carries the signal id so Discover can focus it (the old
                    // link dropped it, audit D-14).
                    navigate({
                      to: "/discover",
                      search: { tab: "signals", focus: s.id } as never,
                    })
                  }
                />
              ))}
            </>
          )}
        </Block>

        <Block>
          <OutcomeCard prd={prd as unknown as OutcomePrd} invalidateKey={["prd", id]} />
        </Block>
      </Surface>

      <RepoGateDialog
        open={repoGate !== null}
        prdId={id}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => sendToStudio.mutate()}
      />
    </>
  );
}
