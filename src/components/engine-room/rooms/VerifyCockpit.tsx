import * as React from "react";
import { lazy, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { useTheme } from "@/hooks/use-theme";
import { computeHunks } from "@/lib/ai/studio-hunks";
import { decideApproval } from "@/lib/agent_loop.functions";
import { listGovernApprovals } from "@/lib/governance.functions";
import { listChangelog } from "@/lib/changelog.functions";
import {
  listAppliedChanges,
  getChangesetDiff,
  rollbackRelease,
  type AppliedChange,
} from "@/lib/studio.functions";
import {
  Row,
  EmptyRow,
  ErrorRetry,
  VerdictSentence,
  PanelPending,
  type RoomBodyProps,
} from "../RoomDetail";

/**
 * RPT-31 - The Agent Inbox (verification cockpit).
 *
 * ONE manager-grade record-room view that unifies the three things an operator
 * needs to verify the machine's work in one place:
 *   1. Pending approvals, decide-able inline (reuse listGovernApprovals +
 *      decideApproval).
 *   2. The just-happened log (reuse listChangelog).
 *   3. Every applied (merged) change across all missions, each carrying a
 *      seconds-to-verdict GUI diff (reuse getChangesetDiff + computeHunks) and
 *      a one-click roll back (reuse rollbackRelease), plus a link to the full
 *      run record (Traces).
 *
 * All server logic is reused; the only net-new capability is the cross-mission
 * listAppliedChanges query. No em/en dashes anywhere (humanized-output law).
 */

// Monaco stays out of the main bundle. It only loads when a diff is opened.
const DiffEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.DiffEditor })),
);

type PendingApproval = Awaited<ReturnType<typeof listGovernApprovals>>["approvals"][number];

type DiffRow = {
  id: string;
  path: string;
  op: string;
  base_content: string | null;
  new_content: string | null;
  updated_at: string;
};

const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  sql: "sql",
  py: "python",
  sh: "shell",
  yml: "yaml",
  yaml: "yaml",
  toml: "ini",
};

function languageFor(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANG_BY_EXT[ext];
}

const RISK_TONE: Record<string, string> = {
  low: "var(--moss)",
  medium: "var(--marigold)",
  high: "var(--madder)",
};

/** Pure: relative time from an ISO string. `nowMs` is injectable for tests. */
export function relTime(iso: string | null, nowMs: number = Date.now()): string {
  if (!iso) return "";
  const ms = nowMs - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Pure: the one plain-spoken verdict line at the top of the cockpit. */
export function cockpitVerdict(pending: number, applied: number): string {
  const p =
    pending === 0
      ? "Nothing is waiting on you"
      : `${pending} approval${pending === 1 ? "" : "s"} waiting on you`;
  const a =
    applied === 0
      ? "no applied changes on the record yet"
      : `${applied} applied change${applied === 1 ? "" : "s"} to verify or roll back`;
  return `${p}, and ${a}. Everything the agents did, in one place.`;
}

const CARD: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  borderRadius: 12,
  overflow: "hidden",
};

/** Shared interactive chrome for the small mono buttons: quiet hover lift,
 * pressed dim, honest disabled. Focus ring rides the global
 * [data-obsidian] :focus-visible rule (outline never removed). */
const SMALL_BTN_CLASS =
  "hover:enabled:[background-color:var(--raised)] active:enabled:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed";

const SMALL_BTN: React.CSSProperties = {
  padding: "4px 10px",
  fontFamily: "var(--font-mono)",
  borderRadius: 6,
  border: "1px solid var(--hairline)",
  background: "transparent",
  color: "var(--text-body)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function SectionHead({ label, note }: { label: string; note?: string | null }) {
  return (
    <div className="flex items-baseline gap-3" style={{ margin: "0 0 10px", paddingBottom: "2px" }}>
      <span
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.11em",
          color: "var(--text-body)",
        }}
      >
        {label}
      </span>
      {note ? (
        <span
          className="tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-subtle)",
          }}
        >
          {note}
        </span>
      ) : null}
    </div>
  );
}

function DiffPending() {
  return (
    <div
      style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}
      aria-hidden="true"
    >
      <PanelPending />
    </div>
  );
}

/* ----------------- 1. Pending approvals (decide-able) ----------------- */

function PendingApprovals({
  approvals,
  isLoading,
  isError,
  onRetry,
  onDecided,
}: {
  approvals: PendingApproval[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDecided: () => void;
}) {
  const fDecide = useServerFn(decideApproval);
  const decide = useMutation({
    mutationFn: (v: { approvalId: string; decision: "approve" | "reject" }) =>
      fDecide({ data: { approvalId: v.approvalId, decision: v.decision } }),
    onSuccess: (r, v) => {
      toast.success(
        v.decision === "approve"
          ? r.executed
            ? "Approved. The agent resumed."
            : "Approved."
          : "Rejected. Nothing ran.",
      );
      onDecided();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not record the decision."),
  });

  if (isError) {
    return <ErrorRetry message="Approvals did not load." onRetry={onRetry} />;
  }
  if (isLoading) return <PanelPending />;
  if (approvals.length === 0) {
    return <EmptyRow message="Nothing is waiting on you. The queue is clear." />;
  }

  return (
    <div style={CARD}>
      {approvals.map((a, i) => {
        const tone = RISK_TONE[a.risk] ?? "var(--marigold)";
        const busy = decide.isPending && decide.variables?.approvalId === a.id;
        return (
          <div
            key={a.id}
            className="flex items-center gap-3 flex-wrap"
            style={{
              padding: "12px 16px",
              borderBottom: i < approvals.length - 1 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="truncate"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-body)" }}>
                  {a.agent_slug ?? "agent"}
                </span>{" "}
                wants <span style={{ fontFamily: "var(--font-mono)" }}>{a.tool_name}</span>
              </div>
              <div
                className="truncate"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-subtle)",
                  marginTop: 3,
                }}
              >
                <span style={{ color: tone, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {a.risk} risk
                </span>
                {a.mission_title ? ` · in ${a.mission_title}` : ""}
                {a.rationale ? ` · ${a.rationale}` : ""}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide.mutate({ approvalId: a.id, decision: "reject" })}
                className={SMALL_BTN_CLASS}
                style={{ ...SMALL_BTN, color: "var(--text-subtle)" }}
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide.mutate({ approvalId: a.id, decision: "approve" })}
                className={SMALL_BTN_CLASS}
                style={{
                  ...SMALL_BTN,
                  color: "var(--text-primary)",
                  borderColor: "var(--hairline-strong)",
                }}
              >
                {busy ? "Working..." : "Approve"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------- 2. What just happened (log strip) ----------------- */

function JustHappened() {
  const fChangelog = useServerFn(listChangelog);
  const q = useQuery({
    queryKey: ["verify-changelog"],
    queryFn: () => fChangelog({ data: { limit: 8 } }),
    staleTime: 10_000,
  });
  if (q.isError) {
    return <ErrorRetry message="The log did not load." onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading) return <PanelPending />;
  const entries = q.data?.entries ?? [];
  if (entries.length === 0) {
    return <EmptyRow message="Nothing has shipped yet. Merged changes land here as they happen." />;
  }
  return (
    <div style={CARD}>
      {entries.map((e) => (
        <Row
          key={e.id}
          subject={e.title}
          value={[e.product_name ?? null, relTime(e.released_at)].filter(Boolean).join(" · ")}
          statusWord="shipped"
          statusColor="var(--moss-bright)"
          onOpen={e.pr_url ? () => window.open(e.pr_url as string, "_blank") : undefined}
        />
      ))}
    </div>
  );
}

/* ----------------- 3. Applied changes (diff + rollback) ----------------- */

function AppliedChangeRow({ change, onChanged }: { change: AppliedChange; onChanged: () => void }) {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const confirm = useConfirm();

  const fDiff = useServerFn(getChangesetDiff);
  const diff = useQuery({
    queryKey: ["verify-diff", change.id],
    queryFn: () => fDiff({ data: { changesetId: change.id } }),
    enabled: open,
    staleTime: 10_000,
  });
  const files = (diff.data?.changes ?? []) as DiffRow[];

  React.useEffect(() => {
    if (open && !selectedPath && files.length) setSelectedPath(files[0]!.path);
  }, [open, files, selectedPath]);

  const selected = selectedPath ? (files.find((f) => f.path === selectedPath) ?? null) : null;
  const hunks = selected
    ? computeHunks(selected.base_content ?? "", selected.new_content ?? "")
    : [];

  const fRollback = useServerFn(rollbackRelease);
  const rollbackMut = useMutation({
    mutationFn: (reason: string) => fRollback({ data: { changesetId: change.id, reason } }),
    onSuccess: (res) => {
      toast.success("Rollback opened. Taking you to the revert session.");
      onChanged();
      window.location.href = `/build/${res.revertMissionId}`;
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Rollback failed."),
  });

  const triggerRollback = async () => {
    const ok = await confirm({
      title: "Roll back this change?",
      body: "Opens a revert that restores the touched files to their pre-merge state. It still passes CI and your review before it merges.",
      confirmLabel: "Open revert",
    });
    if (ok) rollbackMut.mutate("Rolled back from the verification cockpit");
  };

  return (
    <div style={{ borderBottom: "1px solid var(--hairline)" }}>
      <div className="flex items-center gap-3 flex-wrap" style={{ padding: "12px 16px" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left hover:opacity-90 active:opacity-80"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <div
            className="truncate"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {change.title}
          </div>
          <div
            className="truncate"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
              marginTop: 3,
            }}
          >
            {[
              change.mission_title ? `in ${change.mission_title}` : null,
              `${change.file_count} file${change.file_count === 1 ? "" : "s"}`,
              relTime(change.merged_at),
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {change.pr_url ? (
            <a
              href={change.pr_url}
              target="_blank"
              rel="noreferrer"
              className="uppercase hover:underline"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              {change.pr_number ? `PR #${change.pr_number}` : "PR"}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={SMALL_BTN_CLASS}
            style={SMALL_BTN}
          >
            {open ? "Hide diff" : "Verify diff"}
          </button>
          <button
            type="button"
            disabled={rollbackMut.isPending}
            onClick={triggerRollback}
            className={SMALL_BTN_CLASS}
            style={{ ...SMALL_BTN, color: "var(--madder-bright)" }}
          >
            {rollbackMut.isPending ? "Rolling back..." : "Roll back"}
          </button>
        </div>
      </div>

      {open ? (
        <div style={{ borderTop: "1px solid var(--hairline)" }}>
          {diff.isError ? (
            <div style={{ padding: "14px 16px" }}>
              <ErrorRetry message="The diff did not load." onRetry={() => void diff.refetch()} />
            </div>
          ) : diff.isLoading ? (
            <DiffPending />
          ) : files.length === 0 ? (
            <EmptyRow message="This change has no file diff on the record." />
          ) : (
            <>
              {files.length > 1 ? (
                <div
                  className="flex flex-wrap gap-2"
                  style={{ padding: "10px 16px", borderBottom: "1px solid var(--hairline)" }}
                >
                  {files.map((f) => {
                    const active = f.path === selectedPath;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedPath(f.path)}
                        aria-pressed={active}
                        className={`truncate ${SMALL_BTN_CLASS}`}
                        style={{
                          ...SMALL_BTN,
                          maxWidth: 260,
                          color: active ? "var(--text-primary)" : "var(--text-subtle)",
                          background: active ? "var(--surface-raised)" : "transparent",
                        }}
                      >
                        {f.path}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div
                className="flex items-center gap-3"
                style={{ padding: "8px 16px", borderBottom: "1px solid var(--hairline)" }}
              >
                <span
                  className="truncate"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedPath ?? ""}
                </span>
                <span
                  className="uppercase tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    color: "var(--text-subtle)",
                  }}
                >
                  {hunks.length} hunk{hunks.length === 1 ? "" : "s"} · base vs merged
                </span>
              </div>
              {selected ? (
                <Suspense fallback={<DiffPending />}>
                  <DiffEditor
                    height="360px"
                    theme={resolvedTheme === "light" ? "light" : "vs-dark"}
                    language={selectedPath ? languageFor(selectedPath) : undefined}
                    original={selected.base_content ?? ""}
                    modified={selected.new_content ?? ""}
                    options={{
                      readOnly: true,
                      renderSideBySide: false,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </Suspense>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AppliedChanges({
  changes,
  isLoading,
  isError,
  onRetry,
  onChanged,
}: {
  changes: AppliedChange[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onChanged: () => void;
}) {
  if (isError) {
    return <ErrorRetry message="Applied changes did not load." onRetry={onRetry} />;
  }
  if (isLoading) return <PanelPending />;
  if (changes.length === 0) {
    return (
      <EmptyRow message="No applied changes yet. A merged change lands here with its diff and a one-click roll back." />
    );
  }
  return (
    <div style={{ ...CARD, borderBottom: "none" }}>
      {changes.map((c) => (
        <AppliedChangeRow key={c.id} change={c} onChanged={onChanged} />
      ))}
    </div>
  );
}

/* ------------------------- The cockpit ------------------------- */

export function VerifyCockpit(_props: RoomBodyProps) {
  const navigate = useNavigate();
  const fApprovals = useServerFn(listGovernApprovals);
  const fApplied = useServerFn(listAppliedChanges);

  const approvalsQ = useQuery({
    queryKey: ["verify-approvals"],
    queryFn: () => fApprovals(),
  });
  const appliedQ = useQuery({
    queryKey: ["verify-applied"],
    queryFn: () => fApplied({ data: { limit: 40 } }),
    staleTime: 10_000,
  });

  const pending = (approvalsQ.data?.approvals ?? []).filter((a) => a.status === "pending");
  const applied = appliedQ.data?.changes ?? [];
  const summaryReady = !approvalsQ.isLoading && !appliedQ.isLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {summaryReady ? (
        <VerdictSentence>{cockpitVerdict(pending.length, applied.length)}</VerdictSentence>
      ) : (
        <PanelPending />
      )}

      <section>
        <SectionHead
          label="Waiting on you"
          note={pending.length ? `${pending.length} pending` : null}
        />
        <PendingApprovals
          approvals={pending}
          isLoading={approvalsQ.isLoading}
          isError={approvalsQ.isError}
          onRetry={() => void approvalsQ.refetch()}
          onDecided={() => void approvalsQ.refetch()}
        />
      </section>

      <section>
        <SectionHead label="What just happened" />
        <JustHappened />
      </section>

      <section>
        <SectionHead
          label="Applied changes"
          note={applied.length ? `${applied.length} merged` : null}
        />
        <AppliedChanges
          changes={applied}
          isLoading={appliedQ.isLoading}
          isError={appliedQ.isError}
          onRetry={() => void appliedQ.refetch()}
          onChanged={() => void appliedQ.refetch()}
        />
      </section>

      <button
        type="button"
        onClick={() => navigate({ to: "/traces" })}
        className="uppercase self-start hover:underline active:opacity-80"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.11em",
          color: "var(--text-primary)",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Open the full run record
      </button>
    </div>
  );
}
