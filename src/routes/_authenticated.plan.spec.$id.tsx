// The full spec editor · LOOM W2 (2026-07-04). Re-homed from `/prds/$id`
// (which now redirects here permanently) so the editor lives on the Plan
// spine where its list lives. Ported to the v4 "Loom" contract: standard
// container, one primary CTA (Save, the top-lit ember gradient), underline
// mode tabs, four designed states (skeleton that matches the layout, a
// distinct not-found instruction, an error with retry, loaded), mono-caps
// metadata with middots, press feedback on every pressable. Functionality is
// kept exactly: AI assist over the selection, GitHub issue creation, Send to
// Build, Capture as decision, the task-graph planner, Linear push, the
// contract/flow/launch tabs, provenance, citations, and the outcome card.
// Internal identifiers (prd_id, getPrd, ["prd", id]) intentionally stay:
// the user-facing word is "spec", the schema word stays prd (CLAUDE.md
// rename-disclaimer pattern).
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/lib/notify";
import { TopBar } from "@/components/supaprod/TopBar";
import { LoopThread } from "@/components/supaprod/LoopThread";
import { MonoLabel } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
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

const MODE_TABS = ["contract", "projections", "edit", "preview", "flow", "launch"] as const;
type ModeTab = (typeof MODE_TABS)[number];

const MODE_DISPLAY: { id: ModeTab; label: string; hint?: string }[] = [
  {
    id: "contract",
    label: "CONTRACT",
    hint: "The typed Outcome Contract, the machine's view of this spec",
  },
  {
    id: "projections",
    label: "PROJECTIONS",
    hint: "PRD, FRD, status, and one-pager generated fresh from the contract, stamped with drift-state",
  },
  { id: "edit", label: "EDIT" },
  { id: "preview", label: "PREVIEW" },
  { id: "flow", label: "FLOW", hint: "The user flow this spec implies: steps, decisions, states" },
  {
    id: "launch",
    label: "LAUNCH",
    hint: "Positioning, the launch checklist, and the armed outcome-check window",
  },
];

// v4 shared inline vocab (tokens only; no hexes).
const MONO_CAPS: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-mono-floor)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const CARD: CSSProperties = {
  background: "var(--surface-card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-panel)",
  boxShadow: "var(--top-light)",
};

const ACTION_BTN: CSSProperties = {
  ...MONO_CAPS,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "var(--text-body)",
  background: "transparent",
  border: "1px solid var(--hairline-strong)",
  borderRadius: "var(--radius-control)",
  padding: "6px 12px",
  cursor: "pointer",
};

function Shimmer({ height, width = "100%" }: { height: number; width?: string | number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        width,
        borderRadius: 6,
        backgroundImage: "var(--shimmer-gradient)",
        backgroundSize: "280% 100%",
        animation: "cadShimmer 5s linear infinite",
        opacity: 0.35,
      }}
    />
  );
}

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
    <div style={{ padding: "30px 44px 56px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ ...CARD, padding: 24, maxWidth: 560, boxShadow: "var(--shadow-elevated)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD THE SPEC
        </div>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>
          {(error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          onClick={reset}
          className="loom-press"
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads the spec
        </button>
      </div>
    </div>
  ),
});

/** Markdown preview styling. The old `prose prose-neutral` classes were dead
 * (no typography plugin is installed), so the preview renders with explicit
 * serif components, the same voice SpecDetail's read-only body uses. */
const PREVIEW_COMPONENTS = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-h2)",
        fontWeight: 460,
        color: "var(--text-primary)",
        margin: "0 0 14px",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 20,
        fontWeight: 460,
        color: "var(--text-primary)",
        margin: "26px 0 10px",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-emphasis)",
        fontWeight: 500,
        color: "var(--text-primary)",
        margin: "20px 0 8px",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p style={{ margin: "0 0 12px", lineHeight: 1.7 }}>{children}</p>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li style={{ margin: "0 0 6px", lineHeight: 1.65 }}>{children}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{children}</strong>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.85em",
        background: "var(--surface-raised)",
        borderRadius: 4,
        padding: "1px 5px",
      }}
    >
      {children}
    </code>
  ),
};

function SpecEditorPage() {
  const { id } = useParams({ from: "/_authenticated/plan/spec/$id" });
  const initialTab = Route.useSearch().tab;
  const { activeWorkspace } = useWorkspace();
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

  // IA SPINE (2026-07-11): the crumbs ARE the way back (Plan is a link); the
  // bespoke "Back to Define" link is gone.
  const chrome = (
    <>
      <TopBar
        crumbs={[activeWorkspace?.name ?? "Workspace", { label: "Plan", to: "/plan" }, "Spec"]}
      />
      <LoopThread />
    </>
  );

  const container: CSSProperties = {
    maxWidth: "var(--container-standard)",
    width: "100%",
    margin: "0 auto",
    padding: "32px 32px 64px",
  };

  // State one of four: the loading skeleton matches the loaded layout
  // (meta row, title, action bar, document body) — never a spinner, never a
  // blank frame (DESIGN-LOOM §9).
  if (prdQ.isLoading) {
    return (
      <>
        {chrome}
        <div role="status" style={container}>
          <span className="sr-only">Loading the spec…</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Shimmer height={12} width={120} />
            <Shimmer height={12} width={320} />
            <Shimmer height={36} width="70%" />
            <Shimmer height={44} />
            <Shimmer height={420} />
          </div>
        </div>
      </>
    );
  }

  // Error and not-found are DIFFERENT states: a failed fetch never wears the
  // not-found instruction's clothes (DESIGN-LOOM §9b). getPrd's `.single()`
  // throws PGRST116 ("multiple (or no) rows") when the id is missing or
  // RLS-hidden, so that one error shape IS the not-found case; everything
  // else stays a real error with a retry.
  const specMissing =
    prdQ.isError &&
    /multiple \(or no\) rows|cannot coerce.*single/i.test((prdQ.error as Error)?.message ?? "");

  if (prdQ.isError && !specMissing) {
    return (
      <>
        {chrome}
        <div style={container}>
          <div style={{ ...CARD, padding: 24, maxWidth: 560, boxShadow: "var(--shadow-elevated)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
              COULDN'T LOAD THE SPEC
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>
              {(prdQ.error as Error)?.message ?? "Unknown error"}
            </p>
            <button
              type="button"
              onClick={() => prdQ.refetch()}
              className="loom-press"
              style={{
                marginTop: 14,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-subtle)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Retry · reloads the spec
            </button>
          </div>
        </div>
      </>
    );
  }

  if (specMissing || !prdQ.data?.prd) {
    return (
      <>
        {chrome}
        <div style={container}>
          <div style={{ ...CARD, padding: 32, maxWidth: 560, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
              This spec doesn't exist or was deleted. Every live spec is listed on Plan.
            </p>
            <Link
              to="/plan"
              className="loom-press"
              style={{
                ...MONO_CAPS,
                display: "inline-block",
                marginTop: 14,
                color: "var(--glacier)",
              }}
            >
              Go to Plan
            </Link>
          </div>
        </div>
      </>
    );
  }

  const prd = prdQ.data.prd;
  const issueMatch = prd.github_issue_url ? prd.github_issue_url.match(/\/issues\/(\d+)/) : null;

  return (
    <>
      {chrome}
      <div style={{ ...container, animation: "cadRise 260ms var(--ease) both" }}>
        {/* Document metadata row: mono-caps + middots */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            columnGap: 10,
            rowGap: 4,
            marginBottom: 14,
          }}
        >
          <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
            {prd.status}
          </MonoLabel>
          <span aria-hidden style={{ color: "var(--text-faint)" }}>
            ·
          </span>
          <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
            Updated {new Date(prd.updated_at).toLocaleDateString()}
          </MonoLabel>
          <span aria-hidden style={{ color: "var(--text-faint)" }}>
            ·
          </span>
          <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
            {prdTasks.length} linked task{prdTasks.length === 1 ? "" : "s"}
          </MonoLabel>
          {issueMatch ? (
            <>
              <span aria-hidden style={{ color: "var(--text-faint)" }}>
                ·
              </span>
              <a
                href={prd.github_issue_url!}
                target="_blank"
                rel="noreferrer"
                className="hover:[color:var(--text-primary)]"
                style={{ ...MONO_CAPS, color: "var(--glacier)" }}
              >
                Issue #{issueMatch[1]} ↗
              </a>
            </>
          ) : null}
          <span aria-hidden style={{ color: "var(--text-faint)" }}>
            ·
          </span>
          <CriticBadge
            review={(prd as { critic_review?: CriticReview | null }).critic_review ?? null}
            target={{ kind: "prd", id }}
            invalidateKey={["prd", id]}
          />
          {(prd as { snapshot_before?: unknown }).snapshot_before ? (
            <>
              <span aria-hidden style={{ color: "var(--text-faint)" }}>
                ·
              </span>
              <RewindButton prdId={id} hasSnapshot={true} />
            </>
          ) : null}
        </div>

        {/* Title (h1 of the surface) + the thread's maker's mark */}
        <div style={{ marginBottom: 24 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Spec title"
            style={{
              width: "100%",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-h1)",
              fontWeight: 440,
              letterSpacing: "-0.015em",
              lineHeight: 1.15,
              color: "var(--text-primary)",
              border: "none",
              borderBottom: "1px solid var(--hairline)",
              outline: "none",
              paddingBottom: 10,
            }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--form-focus)")}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--hairline)")}
          />
          <div
            aria-hidden="true"
            style={{
              width: 24,
              height: 1,
              marginTop: 10,
              background: "var(--thread-gradient)",
              opacity: 0.4,
            }}
          />
        </div>

        {/* Sticky action bar: mode tabs + Save (the ONE primary CTA) + the rest as quiet controls */}
        <div
          style={{
            // Sticks just below the 52px sticky TopBar (z 30), so the Save
            // bar never slides under the app chrome.
            position: "sticky",
            top: 60,
            zIndex: 20,
            marginBottom: 28,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            background: "color-mix(in srgb, var(--surface-card) 92%, transparent)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-panel)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div
            role="tablist"
            aria-label="Spec views"
            style={{ display: "flex", gap: 12 }}
            // Tabs keyboard contract: Left/Right move between tabs (roving focus).
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const idx = MODE_DISPLAY.findIndex((t) => t.id === mode);
              const delta = e.key === "ArrowRight" ? 1 : -1;
              const next = MODE_DISPLAY[(idx + delta + MODE_DISPLAY.length) % MODE_DISPLAY.length];
              setMode(next.id);
              e.currentTarget
                .querySelector<HTMLButtonElement>(`[data-tab-id="${next.id}"]`)
                ?.focus();
            }}
          >
            {MODE_DISPLAY.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  data-tab-id={m.id}
                  title={m.hint}
                  onClick={() => setMode(m.id)}
                  className={`loom-press ${active ? "" : "hover:[color:var(--text-body)]"}`}
                  style={{
                    ...MONO_CAPS,
                    color: active ? "var(--text-primary)" : "var(--text-subtle)",
                    padding: "6px 2px",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: active
                      ? "2px solid var(--text-primary)"
                      : "2px solid transparent",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <span aria-hidden style={{ height: 16, width: 1, background: "var(--hairline)" }} />

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="loom-press"
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              color: "var(--cta-ink)",
              background: "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
              border: "none",
              borderRadius: "var(--radius-control)",
              padding: "7px 16px",
              cursor: save.isPending ? "default" : "pointer",
              opacity: save.isPending ? 0.6 : 1,
            }}
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>

          {prd.github_issue_url ? (
            <button
              onClick={() => void sendToBuild()}
              disabled={sendToStudio.isPending}
              className="loom-press"
              title="Dispatch a Build session to plan, stage, and PR the changes for this issue"
              style={{ ...ACTION_BTN, opacity: sendToStudio.isPending ? 0.5 : 1 }}
            >
              {sendToStudio.isPending ? "Dispatching…" : "Send to Build"}
            </button>
          ) : (
            <button
              onClick={() => createIssue.mutate()}
              disabled={createIssue.isPending}
              className="loom-press"
              title="Create a GitHub issue from this spec. Send to Build becomes available once the issue exists."
              style={{ ...ACTION_BTN, opacity: createIssue.isPending ? 0.5 : 1 }}
            >
              {createIssue.isPending ? "Creating…" : "Create GitHub issue"}
            </button>
          )}

          <button
            onClick={() => captureDecision.mutate()}
            disabled={captureDecision.isPending}
            className="loom-press"
            title="Log this spec as a decision in Memory"
            style={{ ...ACTION_BTN, opacity: captureDecision.isPending ? 0.5 : 1 }}
          >
            {captureDecision.isPending ? "Capturing…" : "Capture as decision"}
          </button>

          <span aria-hidden style={{ height: 16, width: 1, background: "var(--hairline)" }} />

          <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
            AI
          </MonoLabel>
          {(["rewrite", "expand", "shorten", "critique"] as const).map((a) => (
            <button
              key={a}
              onClick={() => assist.mutate(a)}
              disabled={assist.isPending}
              className="loom-press hover:[color:var(--text-primary)]"
              style={{
                fontSize: 11,
                fontFamily: "var(--font-sans)",
                textTransform: "capitalize",
                color: "var(--text-subtle)",
                background: "none",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-control)",
                padding: "4px 10px",
                cursor: assist.isPending ? "default" : "pointer",
                opacity: assist.isPending ? 0.5 : 1,
              }}
            >
              {a}
            </button>
          ))}
        </div>

        <DecisionCurrencyBanner kind="prd" targetId={id} className="mb-6" />
        <PrecedentNudge kind="prd" targetId={id} className="mb-6" />
        <SharedPremiseNudge kind="prd" targetId={id} className="mb-6" />

        {/* H1 — engineering task graph (Planner) */}
        <div style={{ ...CARD, padding: "12px 16px", marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <h2 style={{ margin: 0, lineHeight: 1 }}>
              <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
                Task graph · {prdTasks.length} task{prdTasks.length === 1 ? "" : "s"}
              </MonoLabel>
            </h2>
            <button
              onClick={() => genTasks.mutate()}
              disabled={genTasks.isPending}
              className="loom-press"
              title="Decompose this spec into a dependency-ordered engineering task graph"
              style={{ ...ACTION_BTN, opacity: genTasks.isPending ? 0.5 : 1 }}
            >
              {genTasks.isPending ? "Planning…" : "Generate task graph"}
            </button>
          </div>
          {prdTasks.length > 0 ? (
            <ol style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0 }}>
              {[...prdTasks]
                .sort(
                  (a: { seq?: number | null }, b: { seq?: number | null }) =>
                    (a.seq ?? 999) - (b.seq ?? 999),
                )
                .map(
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
                    <li
                      key={t.id}
                      style={{
                        listStyle: "none",
                        fontSize: 12,
                        lineHeight: 1.5,
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        columnGap: 8,
                      }}
                    >
                      <span style={{ ...MONO_CAPS, color: "var(--text-subtle)" }}>
                        {t.seq != null ? `#${t.seq}` : "·"}
                      </span>
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {t.title}
                      </span>
                      {t.detail ? (
                        <span style={{ color: "var(--text-muted)" }}>· {t.detail}</span>
                      ) : null}
                      {t.estimate_hours ? (
                        <span style={{ ...MONO_CAPS, color: "var(--text-subtle)" }}>
                          {t.estimate_hours}h
                        </span>
                      ) : null}
                      <span style={{ ...MONO_CAPS, color: "var(--text-subtle)" }}>
                        {t.assignee_kind === "human" ? "you" : "agent"}
                      </span>
                      {Array.isArray(t.depends_on) && t.depends_on.length > 0 ? (
                        <span style={{ ...MONO_CAPS, color: "var(--text-subtle)" }}>
                          after {(t.depends_on as number[]).map((n) => `#${n}`).join(", ")}
                        </span>
                      ) : null}
                      {t.risk ? (
                        // Risk is a warning status: amber, never the ember
                        // brand accent (status color on status only, Tempo §2).
                        <span style={{ ...MONO_CAPS, color: "var(--amber)" }} title={t.risk}>
                          risk
                        </span>
                      ) : null}
                    </li>
                  ),
                )}
            </ol>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              No tasks yet. Generate a graph from the approved spec.
            </p>
          )}
        </div>

        {/* H1-TASKS consumption — build readiness (ready/blocked/progress + DAG integrity). */}
        <TaskGraphPanel prdId={id} />

        {/* DEF-04 — design readiness from the spec (states/a11y/responsive/... + gaps). */}
        <DesignReadinessPanel body={body} />
        {/* DEF-04 generative half — AI mockup in sandboxed iframe (no CDN, no chokepoint change). */}
        <DesignScaffoldPanel prdId={id} specBody={body} />

        {teamsQ.data?.teams && teamsQ.data.teams.length > 0 && (
          <div
            style={{
              ...CARD,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              marginBottom: 24,
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              Push {prdTasks.length} linked task{prdTasks.length === 1 ? "" : "s"} to Linear:
            </span>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={{
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-control)",
                padding: "5px 8px",
                fontSize: 12,
                // No outline:none here: the global [data-obsidian] :focus-visible
                // ring is the select's focus indicator (Tempo: never removed).
              }}
            >
              <option value="">Select team…</option>
              {teamsQ.data.teams.map((t: { id: string; key: string; name: string }) => (
                <option key={t.id} value={t.id}>
                  {t.key} · {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => pushLinear.mutate()}
              disabled={!teamId || prdTasks.length === 0 || pushLinear.isPending}
              className="loom-press"
              style={{
                ...ACTION_BTN,
                opacity: !teamId || prdTasks.length === 0 || pushLinear.isPending ? 0.4 : 1,
              }}
            >
              {pushLinear.isPending ? "Creating…" : "Create issues"}
            </button>
          </div>
        )}

        {mode === "edit" ? (
          <textarea
            ref={taRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Spec body, markdown"
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: 600,
              resize: "vertical",
              background: "var(--surface-card)",
              color: "var(--text-body)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-panel)",
              boxShadow: "var(--top-light)",
              padding: 24,
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              lineHeight: 1.65,
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--form-focus)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
          />
        ) : mode === "preview" ? (
          <article
            style={{
              ...CARD,
              padding: "36px 40px",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-body)",
              maxWidth: "68ch",
            }}
          >
            <ReactMarkdown components={PREVIEW_COMPONENTS}>{body || "_Empty spec_"}</ReactMarkdown>
          </article>
        ) : mode === "contract" ? (
          <div className="space-y-6">
            <OutcomeContractPanel
              prdId={id}
              specTitle={prd.title}
              bodyMd={body}
              contract={(prd as { contract?: OutcomeContract | null }).contract}
              invalidateKey={["prd", id]}
            />
            {/* RPT-44: the honest intent-vs-built receipt lives beside the contract. */}
            <IntentVsBuiltReceipt prdId={id} />
          </div>
        ) : mode === "projections" ? (
          <SpecProjectionsPanel
            title={prd.title}
            status={prd.status}
            updatedAt={prd.updated_at}
            contract={(prd as { contract?: OutcomeContract | null }).contract}
            bodyMd={body}
            citations={((prd as { citations?: Citation[] | null }).citations ?? []).map((c) => ({
              label: c.title?.trim() || c.source_kind,
            }))}
          />
        ) : mode === "flow" ? (
          <FlowDiagram prdId={id} />
        ) : (
          <LaunchPlanPanel prdId={id} />
        )}

        <div style={{ marginTop: 24 }}>
          <CitationsCard citations={(prd as { citations?: Citation[] | null }).citations ?? null} />
        </div>

        {/* O1 provenance — why this spec is being built, traced to source signals */}
        <div style={{ ...CARD, padding: 24, marginTop: 24 }}>
          <h2 style={{ margin: "0 0 12px", lineHeight: 1 }}>
            <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
              Why this spec · source evidence
            </MonoLabel>
          </h2>
          {provQ.isLoading ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Tracing the chain…
            </p>
          ) : provQ.isError ? (
            <p style={{ fontSize: 12, color: "var(--madder)", margin: 0 }}>
              Couldn't trace the chain.{" "}
              <button
                type="button"
                onClick={() => provQ.refetch()}
                className="loom-press"
                style={{
                  ...MONO_CAPS,
                  color: "var(--text-subtle)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Retry
              </button>
            </p>
          ) : (provQ.data?.signal_count ?? 0) === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              No source signals traced. This spec was added directly, not generated from clustered
              signals.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                Traces back to {provQ.data!.signal_count} source signal
                {provQ.data!.signal_count === 1 ? "" : "s"} through {provQ.data!.node_count} step
                {provQ.data!.node_count === 1 ? "" : "s"} of the discovery chain.
              </p>
              {provQ.data!.source_signals.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    // Carries the signal id so Discover can focus it (the old
                    // link dropped it — audit D-14). Discover's param honor
                    // lands in the sibling W2-DISCOVER lane.
                    navigate({
                      to: "/discover",
                      search: { tab: "signals", focus: s.id } as never,
                    })
                  }
                  className="loom-press hover:[color:var(--text-primary)]"
                  style={{
                    textAlign: "left",
                    fontSize: 12,
                    color: "var(--text-body)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span style={{ ...MONO_CAPS, color: "var(--text-subtle)", flexShrink: 0 }}>
                    {s.source ?? "signal"}
                  </span>
                  <span>{(s.title ?? s.content ?? "signal").slice(0, 80)} →</span>
                </button>
              ))}
              {provQ.data!.truncated ? (
                <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
                  the chain continues past these first steps
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <OutcomeCard prd={prd as unknown as OutcomePrd} invalidateKey={["prd", id]} />
        </div>
      </div>
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
