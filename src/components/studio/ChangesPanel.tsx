/**
 * Changes. The interior port (2026-07-29), not a re-skin.
 *
 * WHERE IT SITS. The Build run surface already opened a Block titled "What it
 * produced" and already drew the aggregate Diffstat above the tab row, so this
 * panel owns no masthead of its own and never restates that total. Every
 * section below is a `Block`, which is a rule and a title rather than a card:
 * the seven bordered LOOM_CARDs this file used to draw were seven cards inside
 * one region, which is the cardocalypse ban and the reason the surface read as
 * assembled.
 *
 * WHAT CARRIES MEANING NOW.
 *  - Attribution. Every file, every revision and every hunk in here was written
 *    by the Build agent during this run, and each row says so with the same
 *    mark the surface above uses. The rollback rows do NOT: `studio_rollbacks`
 *    records no actor, so those rows say "unattributed" rather than wearing a
 *    mark that would be a guess.
 *  - Diffstat wherever a line delta is shown, which is now the file rows as
 *    well as the hunks. `computeHunks` returns real base/modified LINE arrays,
 *    and `getStudioSession` runs that same alignment per file, so both levels
 *    carry genuine line counts and both wear the primitive. The rows previously
 *    said "chars" in words because this type had not declared the line columns
 *    the server was already sending; that is fixed at the type, not papered over
 *    at the view.
 *  - Colour. A DIFF DELTA IS ALWAYS GREEN AND RED (founder ruling 2026-08-01:
 *    "we need to display it in red and green ... so that its evident"). This
 *    file used to say monochrome throughout, on the reasoning that colour needs
 *    a legend; a diffstat is the one place in software where it does not, since
 *    plus-green and minus-red is the most universally known convention a
 *    developer surface has. Everything else here stays monochrome, and the
 *    restraint budget is unchanged: warn still marks the one policy breach
 *    (files outside the declared touch list), and the changeset ladder is still
 *    a sentence rather than a coloured chip, because THAT one genuinely needed a
 *    legend.
 *
 * Monaco keeps its own diff colours, the standing code-diff exemption.
 *
 * Every server function, mutation, query key and prop is unchanged.
 */

import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  applyStagedHunkSelection,
  generateReleaseNotes,
  generateLaunchKit,
  type LaunchKit,
  getChangesetDiff,
  getChangesetRevisions,
  rejectStagedFile,
  revertToRevision,
  rollbackRelease,
  abandonChangeset,
  getRollbacks,
  generateRollbackNote,
  setChangesetConstraints,
  enforceTouchList,
  type StudioChangesetSummary,
  type StudioConstraints,
  type StudioFileSetPolicy,
} from "@/lib/studio.functions";
import { computeHunks } from "@/lib/ai/studio-hunks";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { useTheme } from "@/hooks/use-theme";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Diffstat,
  Empty,
  Failed,
  Field,
  Input,
  Line,
  Num,
  Row,
  Textarea,
  Who,
} from "@/components/shell/primitives";

import { listDeployments, promoteToProduction } from "@/lib/deployments.functions";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

// Monaco stays out of the main bundle: it only loads when a file is opened.
const DiffEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.DiffEditor })),
);

/** Everything in this panel was written by the run's Build agent. Same slug the
 *  surface above uses, so the mark means the same thing in both places. */
const BUILDER = "builder";

type ChangeRow = {
  id: string;
  path: string;
  op: string;
  base_chars: number;
  new_chars: number;
  /**
   * REAL LINE COUNTS, and they were on the wire all along.
   *
   * `getStudioSession` has computed these per file since the diffstat fix
   * (studio.functions.ts, `const stat = diffStat(...)`), running the same
   * `computeHunks` alignment this panel renders its hunks from. This type simply
   * never declared them, so the Files rows fell back to `base_chars`/`new_chars`
   * and showed a CHARACTER delta -- a unit that nets to zero when a line is
   * rewritten to the same length or two lines are swapped, both of which are
   * real changes. The panel was showing the weaker number while the stronger one
   * arrived in the same payload and was dropped on the floor.
   */
  added_lines: number;
  removed_lines: number;
};

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

/** The ladder said in words. A coloured pill carried this before, which failed
 *  the greyscale test and needed a legend nobody was given. */
const STATUS_SENTENCE: Record<string, string> = {
  staged: "Staged, not committed",
  committed: "Committed to the branch",
  pr_open: "Pull request open",
  merged: "Merged",
  abandoned: "Abandoned",
};

function languageFor(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANG_BY_EXT[ext];
}

/** Markdown files get a rendered-document view alongside the code diff (docs read as docs, not as text). */
function isMarkdownFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ext === "md" || ext === "mdx";
}

function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A quiet text control inside a row's second line. `sp-block-more` is the
 *  system's own weight for this (Failed uses it for its retry), so a control
 *  that belongs to one row never wears a 38px button. */
const QUIET = "sp-block-more";

/** Prose the crew wrote: release notes, a launch draft, a rollback note. A
 *  recess, never a card, so it is the one container in its region. */
const RECESS: CSSProperties = {
  background: "var(--sp-sink)",
  borderRadius: "var(--sp-radius-panel)",
  padding: "var(--sp-space-4) 18px",
  marginTop: "var(--sp-space-2)",
  fontSize: "var(--sp-text-prose)",
  lineHeight: "var(--sp-leading-body)",
  color: "var(--sp-body)",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  maxHeight: 260,
  overflowY: "auto",
};

const DIFF_H = 420;

const loadingBox = (
  <div
    style={{
      height: DIFF_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "var(--sp-text-prose)",
      color: "var(--sp-mute)",
    }}
  >
    Reading the diff.
  </div>
);

/**
 * Changes tab: what the run wrote. The file list, the commit history, the
 * declared scope, the ship links, and the per-hunk curation that lets you keep
 * part of a file. Depth is one click: a file opens its diff, a diff opens its
 * hunks.
 */
export function ChangesPanel({
  changeset,
  changes,
  missionId,
  fileSetPolicy = null,
  constraints = null,
}: {
  changeset: StudioChangesetSummary | null;
  changes: ChangeRow[];
  missionId?: string;
  fileSetPolicy?: StudioFileSetPolicy | null;
  constraints?: StudioConstraints;
}) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [docView, setDocView] = useState<"diff" | "preview">("diff");
  // Both themes resolve: Monaco follows the app theme instead of hard-coding
  // vs-dark into the light theme.
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === "light" ? "light" : "vs-dark";
  const builderName = agentDisplayName(BUILDER);
  const fDiff = useServerFn(getChangesetDiff);
  const diff = useQuery({
    queryKey: ["studio-diff", changeset?.id],
    queryFn: () => fDiff({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset && !!selectedPath,
    staleTime: 10_000,
  });
  const diffByPath = useMemo(() => {
    const map = new Map<string, DiffRow>();
    for (const c of (diff.data?.changes ?? []) as DiffRow[]) map.set(c.path, c);
    return map;
  }, [diff.data]);

  // I1b: the changeset's commit history (newest first).
  const fRevs = useServerFn(getChangesetRevisions);
  const revs = useQuery({
    queryKey: ["studio-revisions", changeset?.id],
    queryFn: () => fRevs({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset,
    staleTime: 10_000,
  });
  const revisions = revs.data?.revisions ?? [];

  const qc = useQueryClient();

  // K2: operator rollback. Revert the branch to a prior revision (a forward,
  // non-destructive commit). Only while the branch is live (committed / pr_open)
  // and never to the latest revision (that is a no-op). Confirm-gated.
  const confirm = useConfirm();
  const fRevert = useServerFn(revertToRevision);
  const canRevert = changeset?.status === "committed" || changeset?.status === "pr_open";
  const revertMut = useMutation({
    mutationFn: (vars: { changesetId: string; revisionId: string }) => fRevert({ data: vars }),
    onSuccess: (res) => {
      toast.success(`Reverted the branch to revision ${res.restored_from_revision_no}.`);
      qc.invalidateQueries({ queryKey: ["studio-revisions", changeset?.id] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not revert to that revision."),
  });

  // I1: operator curation (per-hunk reject + drop file), only before commit.
  const canCurate = changeset?.status === "staged";
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  useEffect(() => setRejected(new Set()), [selectedPath]);
  useEffect(() => setDocView("diff"), [selectedPath]);
  const fApply = useServerFn(applyStagedHunkSelection);
  const fReject = useServerFn(rejectStagedFile);
  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["studio-session"] });
    if (changeset) qc.invalidateQueries({ queryKey: ["studio-diff", changeset.id] });
  };
  const applyMut = useMutation({
    mutationFn: (vars: { path: string; rejectedHunkIds: number[]; expectedUpdatedAt?: string }) =>
      fApply({
        data: {
          changesetId: changeset!.id,
          path: vars.path,
          rejectedHunkIds: vars.rejectedHunkIds,
          expectedUpdatedAt: vars.expectedUpdatedAt,
        },
      }),
    onSuccess: () => {
      toast.success("Rejected hunks reverted to base.");
      setRejected(new Set());
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not apply the selection."),
  });
  const rejectFileMut = useMutation({
    mutationFn: (path: string) => fReject({ data: { changesetId: changeset!.id, path } }),
    onSuccess: () => {
      toast.success("File dropped from the changeset.");
      setSelectedPath(null);
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not drop the file."),
  });

  // SEAM-2 SHIP: merge is not the end; a live URL is. A merged changeset on a
  // Supaprod-managed repo gets an automatic preview deploy (ci-poll-tick); the
  // one human promote click moves production and is recorded as an approval.
  const fDeployments = useServerFn(listDeployments);
  const deploymentsQ = useQuery({
    queryKey: ["changeset-deployments", changeset?.id],
    queryFn: () => fDeployments({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset && changeset.status === "merged",
    refetchInterval: 30_000,
  });
  const deploymentRows = (deploymentsQ.data?.deployments ?? []) as Array<{
    id: string;
    environment: string;
    status: string;
    deploy_url: string | null;
  }>;
  const previewDep = deploymentRows.find(
    (d) => d.environment === "preview" && d.status === "success" && d.deploy_url,
  );
  const productionDep = deploymentRows.find(
    (d) => d.environment === "production" && d.status === "success" && d.deploy_url,
  );
  const fPromote = useServerFn(promoteToProduction);
  const promoteMut = useMutation({
    mutationFn: () => fPromote({ data: { changesetId: changeset!.id } }),
    onSuccess: (res) => {
      toast.success(`Live in production: ${res.productionUrl}`);
      qc.invalidateQueries({ queryKey: ["changeset-deployments", changeset?.id] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Promote failed."),
  });

  // F-BUILDER-MULTIFILE: scope policy (touch list + max-files cap). The editor
  // declares it; "Apply scope" drops the out-of-policy files before the commit.
  const outOfPolicy = useMemo(
    () => new Set(fileSetPolicy?.outOfPolicy ?? []),
    [fileSetPolicy?.outOfPolicy],
  );
  const [editScope, setEditScope] = useState(false);
  const [pathsDraft, setPathsDraft] = useState("");
  const [capDraft, setCapDraft] = useState("");
  const openScopeEditor = () => {
    setPathsDraft((constraints?.allowed_paths ?? []).join("\n"));
    setCapDraft(constraints?.max_files != null ? String(constraints.max_files) : "");
    setEditScope(true);
  };
  const fSetConstraints = useServerFn(setChangesetConstraints);
  const fEnforce = useServerFn(enforceTouchList);
  const setScopeMut = useMutation({
    mutationFn: (vars: { allowedPaths: string[]; maxFiles: number | null }) =>
      fSetConstraints({ data: { missionId: missionId!, ...vars } }),
    onSuccess: () => {
      toast.success("Scope saved.");
      setEditScope(false);
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not save the scope."),
  });
  const enforceMut = useMutation({
    mutationFn: () => fEnforce({ data: { changesetId: changeset!.id } }),
    onSuccess: (res) => {
      const n = res.removed.length;
      toast.success(
        n ? `Dropped ${n} out-of-scope file${n === 1 ? "" : "s"}.` : "Already in scope.",
      );
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not apply the scope."),
  });
  const saveScope = () => {
    const allowedPaths = pathsDraft
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsed = parseInt(capDraft.trim(), 10);
    const maxFiles =
      capDraft.trim() === "" || !Number.isFinite(parsed) || parsed < 1 ? null : parsed;
    setScopeMut.mutate({ allowedPaths, maxFiles });
  };

  // K1: release notes for the changeset (generate/regenerate; persisted server-side).
  const fGenNotes = useServerFn(generateReleaseNotes);
  const genNotesMut = useMutation({
    mutationFn: () => fGenNotes({ data: { changesetId: changeset!.id } }),
    onSuccess: () => {
      toast.success("Release notes generated.");
      qc.invalidateQueries({ queryKey: ["studio-session"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not generate release notes."),
  });

  // LCH-01: draft a launch kit from the shipped changeset (ephemeral, no send).
  const [launchKit, setLaunchKit] = useState<LaunchKit | null>(null);
  const fGenKit = useServerFn(generateLaunchKit);
  const genKitMut = useMutation({
    mutationFn: () => fGenKit({ data: { changesetId: changeset!.id } }),
    onSuccess: (kit: LaunchKit) => {
      setLaunchKit(kit);
      toast.success("Launch kit drafted. Review and copy what you need.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not draft the launch kit."),
  });

  // K2: rollback controls (roll back merged release, kill in-flight change).
  const promptDialog = usePrompt();
  const fRollback = useServerFn(rollbackRelease);
  const rollbackMut = useMutation({
    mutationFn: (reason: string) =>
      fRollback({
        data: {
          changesetId: changeset!.id,
          reason,
        },
      }),
    onSuccess: (result) => {
      toast.success("Rollback initiated. Navigating to revert session...");
      window.location.href = `/studio/${result.revertMissionId}`;
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Rollback failed."),
  });

  const fAbandon = useServerFn(abandonChangeset);
  const abandonMut = useMutation({
    mutationFn: (reason: string) =>
      fAbandon({
        data: {
          changesetId: changeset!.id,
          reason,
        },
      }),
    onSuccess: () => {
      toast.success("Change killed. PR closed and claims released.");
      qc.invalidateQueries({ queryKey: ["studio-session"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not kill the change."),
  });

  const fRollbackHistory = useServerFn(getRollbacks);
  const rollbackHistory = useQuery({
    queryKey: ["studio-rollback-history", changeset?.product_id ?? null],
    queryFn: () =>
      fRollbackHistory({
        data: { productId: changeset!.product_id! },
      }),
    enabled: !!changeset?.product_id,
    staleTime: 10_000,
  });
  const rollbacks = rollbackHistory.data?.rollbacks ?? [];

  const fGenRollbackNote = useServerFn(generateRollbackNote);
  const noteMut = useMutation({
    mutationFn: (rollbackId: string) => fGenRollbackNote({ data: { rollbackId } }),
    onSuccess: () => {
      toast.success("Rollback note generated.");
      rollbackHistory.refetch();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not generate the note."),
  });

  const triggerRollback = async () => {
    const reason = await promptDialog({
      title: "Roll back this release",
      body: "Opens a revert PR that restores the touched paths to their pre-merge state. It still passes CI and your review before it merges.",
      label: "Reason (optional)",
      placeholder: "Why are you rolling this back?",
      confirmLabel: "Open revert PR",
    });
    if (reason !== null) {
      rollbackMut.mutate(reason || "Operator-initiated rollback");
    }
  };

  const triggerAbandon = async () => {
    const ok = await confirm({
      title: "Kill this change?",
      body: "Closes the PR and releases file claims. This cannot be undone.",
      confirmLabel: "Kill change",
      destructive: true,
    });
    if (ok) abandonMut.mutate("Operator-abandoned");
  };

  if (!changeset) {
    return <Empty>Nothing is staged. {builderName} writes each file in here as it works.</Empty>;
  }

  const selected = selectedPath ? diffByPath.get(selectedPath) : null;
  // Same pure diff the server applies, so hunk ids line up between UI and server.
  const hunks = selected
    ? computeHunks(selected.base_content ?? "", selected.new_content ?? "")
    : [];

  const scopeDeclared = !!fileSetPolicy && (fileSetPolicy.hasTouchList || fileSetPolicy.hasCap);
  const scopeBreach =
    scopeDeclared && !fileSetPolicy!.clean
      ? [
          fileSetPolicy!.outOfPolicy.length
            ? `${fileSetPolicy!.outOfPolicy.length} outside the touch list`
            : "",
          !fileSetPolicy!.withinCap
            ? `${fileSetPolicy!.overBy} over the cap of ${fileSetPolicy!.maxFiles}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <>
      {/* Identity. Repo, where it sits on the ladder, and the two ways to end it. */}
      <Line
        label={<Num>{changeset.repo}</Num>}
        sub={
          <>
            {STATUS_SENTENCE[changeset.status] ?? changeset.status}
            {changeset.branch ? (
              <>
                {" on "}
                <Num>{changeset.branch}</Num>
              </>
            ) : null}
          </>
        }
      >
        {changeset.status === "merged" ? (
          <Button variant="ghost" disabled={rollbackMut.isPending} onClick={triggerRollback}>
            {rollbackMut.isPending ? "Rolling back" : "Roll back"}
          </Button>
        ) : null}
        {["staged", "committed", "pr_open"].includes(changeset.status) ? (
          <Button variant="ghost" disabled={abandonMut.isPending} onClick={triggerAbandon}>
            {abandonMut.isPending ? "Killing" : "Kill this change"}
          </Button>
        ) : null}
      </Line>

      {/* SEAM-2 SHIP: the preview, the one human promote, and the live URL. */}
      {changeset.status === "merged" ? (
        <Block title="Where it is live">
          <Line
            label="Preview"
            sub={
              previewDep ? (
                <a
                  className={QUIET}
                  style={{ textDecoration: "none" }}
                  href={previewDep.deploy_url!}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Num>{previewDep.deploy_url}</Num>
                </a>
              ) : (
                "It deploys on its own after a merge, in about two minutes."
              )
            }
          />
          <Line
            label="Production"
            sub={
              productionDep ? (
                <a
                  className={QUIET}
                  style={{ textDecoration: "none" }}
                  href={productionDep.deploy_url!}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Num>{productionDep.deploy_url}</Num>
                </a>
              ) : previewDep ? (
                "Nobody has moved it yet. This is the one call that reaches customers."
              ) : (
                "Nothing to promote until the preview is up."
              )
            }
          >
            {!productionDep && previewDep ? (
              <Button
                variant="primary"
                disabled={promoteMut.isPending}
                onClick={() => promoteMut.mutate()}
              >
                {promoteMut.isPending ? "Promoting" : "Promote to production"}
              </Button>
            ) : null}
          </Line>
        </Block>
      ) : null}

      {/* K1 release notes: the ship artifact for this changeset. */}
      {changeset.release_notes || changes.length > 0 || revisions.length > 0 ? (
        <Block
          title="Release notes"
          more={
            genNotesMut.isPending
              ? "Writing"
              : changeset.release_notes
                ? "Write them again"
                : "Write them"
          }
          onMore={() => {
            if (!genNotesMut.isPending) genNotesMut.mutate();
          }}
        >
          {changeset.release_notes ? (
            <div style={RECESS}>{changeset.release_notes}</div>
          ) : (
            <Empty>{builderName} has not drafted notes for this changeset yet.</Empty>
          )}
        </Block>
      ) : null}

      {/* LCH-01 launch kit: drafted from the ship, never sent. */}
      {changeset.release_notes || revisions.length > 0 ? (
        <Block
          title="Launch kit"
          sub="Drafts only. Nothing is sent, so copy what you want to use."
          more={genKitMut.isPending ? "Drafting" : launchKit ? "Draft it again" : "Draft it"}
          onMore={() => {
            if (!genKitMut.isPending) genKitMut.mutate();
          }}
        >
          {launchKit
            ? (
                [
                  ["Changelog", "changelog"],
                  ["Blog", "blog"],
                  ["Email", "email"],
                  ["Social", "social"],
                  ["Docs", "docs"],
                ] as const
              ).map(([label, key]) =>
                launchKit[key] ? (
                  <div key={key}>
                    <Line label={label}>
                      <button
                        type="button"
                        className={QUIET}
                        onClick={() =>
                          navigator.clipboard
                            ?.writeText(launchKit[key])
                            .then(() => toast.success(`${label} copied`))
                            .catch(() => toast.error("Could not copy"))
                        }
                      >
                        Copy
                      </button>
                    </Line>
                    <div style={RECESS}>{launchKit[key]}</div>
                  </div>
                ) : null,
              )
            : null}
        </Block>
      ) : null}

      {/* K2: rollback history for this product. The record names no actor, so
          neither does the row. */}
      {rollbacks.length > 0 ? (
        <Block title="Rollbacks">
          {rollbacks.map((rb) => (
            <div key={rb.id}>
              <Row
                tight
                lead={rb.reason}
                sub={
                  <>
                    {rb.status === "reverted" ? "Reverted" : "Revert open"}
                    {/* studio_rollbacks records no actor. Saying so is honest;
                        putting a mark here would be a guess. */}
                    {" · unattributed"}
                    {rb.revert_pr_number ? (
                      <>
                        {" · "}
                        <a
                          className={QUIET}
                          style={{ textDecoration: "none" }}
                          href={`https://github.com/${changeset.repo}/pull/${rb.revert_pr_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PR <Num>{rb.revert_pr_number}</Num>
                        </a>
                      </>
                    ) : null}
                    {!rb.note ? (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className={QUIET}
                          disabled={noteMut.isPending}
                          onClick={() => noteMut.mutate(rb.id)}
                        >
                          {noteMut.isPending && noteMut.variables === rb.id
                            ? "Writing the note"
                            : "Write the note"}
                        </button>
                      </>
                    ) : null}
                  </>
                }
                time={shortDate(rb.created_at)}
              />
              {rb.note ? <div style={RECESS}>{rb.note}</div> : null}
            </div>
          ))}
        </Block>
      ) : null}

      {/* I1b revision history: one row per studio.commit, newest first. */}
      {revisions.length > 0 ? (
        <Block title="Revisions">
          {revisions.map((r, i) => (
            <Row
              key={r.id}
              tight
              marks={<AgentMark slug={BUILDER} state="quiet" />}
              lead={r.message || "No message"}
              sub={
                <>
                  <Who>{builderName}</Who> committed <Num>{r.files.length}</Num>{" "}
                  {r.files.length === 1 ? "file" : "files"}
                  {" · "}
                  {r.commit_url ? (
                    <a
                      className={QUIET}
                      style={{ textDecoration: "none" }}
                      href={r.commit_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Num>{r.commit_sha.slice(0, 7)}</Num>
                    </a>
                  ) : (
                    <Num>{r.commit_sha.slice(0, 7)}</Num>
                  )}
                  {canRevert && i > 0 ? (
                    <>
                      {" · "}
                      <button
                        type="button"
                        className={QUIET}
                        disabled={revertMut.isPending}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Revert to revision ${r.revision_no}?`,
                            body: `Creates a new commit on ${changeset.branch ?? "the branch"} that restores every file to revision ${r.revision_no} (${r.commit_sha.slice(0, 7)}). It moves history forward, so the revert is itself revertible.`,
                            confirmLabel: "Revert",
                          });
                          if (!ok) return;
                          revertMut.mutate({ changesetId: changeset.id, revisionId: r.id });
                        }}
                      >
                        Go back to here
                      </button>
                    </>
                  ) : null}
                </>
              }
              time={shortDate(r.created_at)}
            />
          ))}
        </Block>
      ) : null}

      {/* F-BUILDER-MULTIFILE: the declared touch list and cap, read live against
          the staged files, with one click to get back inside it. */}
      {missionId ? (
        <Block
          title="Scope"
          sub={
            scopeDeclared ? (
              scopeBreach ? (
                <span style={{ color: "var(--sp-warn)" }}>{scopeBreach}</span>
              ) : (
                <>
                  <Num>{fileSetPolicy!.fileCount}</Num>{" "}
                  {fileSetPolicy!.fileCount === 1 ? "file" : "files"}, all inside the touch list.
                </>
              )
            ) : (
              `No touch list and no cap, so ${builderName} may write anywhere in the repo.`
            )
          }
          more={editScope ? "Close" : "Edit"}
          onMore={() => (editScope ? setEditScope(false) : openScopeEditor())}
        >
          {canCurate && fileSetPolicy?.hasTouchList && fileSetPolicy.outOfPolicy.length > 0 ? (
            <Actions>
              <Button disabled={enforceMut.isPending} onClick={() => enforceMut.mutate()}>
                {enforceMut.isPending ? "Dropping them" : "Drop the files outside it"}
              </Button>
            </Actions>
          ) : null}
          {editScope ? (
            <>
              <Field label="Touch list, one path per line">
                <Textarea
                  value={pathsDraft}
                  onChange={(e) => setPathsDraft(e.target.value)}
                  placeholder={"src/lib/\nsrc/components/studio/**"}
                  rows={4}
                  spellCheck={false}
                />
              </Field>
              <Field label="Most files it may touch">
                <Input
                  type="number"
                  min={1}
                  value={capDraft}
                  onChange={(e) => setCapDraft(e.target.value)}
                  placeholder="no cap"
                  style={{ maxWidth: 140 }}
                />
              </Field>
              <Actions>
                <Button disabled={setScopeMut.isPending} onClick={saveScope}>
                  {setScopeMut.isPending ? "Saving" : "Save the scope"}
                </Button>
              </Actions>
            </>
          ) : null}
        </Block>
      ) : null}

      {/* The files themselves, each with its real line delta in green and red.
          FOUNDER RULING 2026-08-01: a diff number is read at a glance or it is
          not read, and grey numerals are not read. These rows used to carry a
          monochrome character count precisely BECAUSE characters are not lines
          and the diffstat shape reads as lines -- honest, and solving the wrong
          half of the problem, since the real line counts were already in the
          payload. Now the unit and the colour agree, so the shape claims exactly
          what it is. */}
      <Block title="Files">
        {changes.map((c) => {
          const active = c.path === selectedPath;
          return (
            <Row
              key={c.id}
              tight
              focused={active}
              marks={<AgentMark slug={BUILDER} state="quiet" />}
              lead={<Num>{c.path}</Num>}
              sub={
                <>
                  <Who>{builderName}</Who> {c.op} ·{" "}
                  <Diffstat added={c.added_lines} removed={c.removed_lines} />
                  {outOfPolicy.has(c.path) ? (
                    <span style={{ color: "var(--sp-warn)" }}> · outside the touch list</span>
                  ) : null}
                </>
              }
              onClick={() => setSelectedPath(active ? null : c.path)}
            />
          );
        })}
        {changes.length === 0 ? (
          <Empty>{builderName} has not written a file into this changeset yet.</Empty>
        ) : null}
      </Block>

      {selectedPath ? (
        <Block>
          <Line label={<Num>{selectedPath}</Num>} sub="Base against staged">
            {canCurate ? (
              <button
                type="button"
                className={QUIET}
                disabled={rejectFileMut.isPending}
                onClick={() => rejectFileMut.mutate(selectedPath)}
              >
                {rejectFileMut.isPending ? "Dropping it" : "Drop this file"}
              </button>
            ) : null}
          </Line>

          {isMarkdownFile(selectedPath) ? (
            <div className="sp-tabs" role="tablist" aria-label="How to read this file">
              {(["diff", "preview"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  className="sp-tab"
                  aria-selected={docView === mode}
                  onClick={() => setDocView(mode)}
                >
                  {mode === "diff" ? "Diff" : "Read it"}
                </button>
              ))}
            </div>
          ) : null}

          <div
            style={{
              marginTop: "var(--sp-space-3)",
              background: "var(--sp-sink)",
              borderRadius: "var(--sp-radius-panel)",
              overflow: "hidden",
            }}
          >
            {diff.isError ? (
              // A failed read is not an empty state. It names its cause and
              // offers the retry, because "nothing here" and "we could not find
              // out" are different facts.
              <div style={{ padding: "var(--sp-space-4) 18px" }}>
                <Failed onRetry={() => void diff.refetch()}>
                  The diff did not load. {(diff.error as Error)?.message?.slice(0, 160)}
                </Failed>
              </div>
            ) : diff.isLoading || !selected ? (
              loadingBox
            ) : isMarkdownFile(selectedPath) && docView === "preview" ? (
              <div
                style={{
                  height: DIFF_H,
                  overflowY: "auto",
                  padding: "var(--sp-space-4) var(--sp-space-5)",
                }}
              >
                <ChatMarkdown content={selected.new_content ?? ""} />
              </div>
            ) : (
              <Suspense fallback={loadingBox}>
                <DiffEditor
                  height={`${DIFF_H}px`}
                  theme={monacoTheme}
                  language={languageFor(selectedPath)}
                  original={selected.base_content ?? ""}
                  modified={selected.new_content ?? ""}
                  options={{
                    readOnly: true,
                    renderSideBySide: false,
                    minimap: { enabled: false },
                    // Monaco's canvas renderer needs a numeric px value, not a CSS custom property.
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </Suspense>
            )}
          </div>

          {/* Per-hunk curation. These numbers ARE lines (computeHunks returns
              base and modified line arrays), so the diffstat is honest here. */}
          {canCurate && selected && hunks.length > 0 ? (
            <>
              <Line
                label={
                  <>
                    <Num>{hunks.length}</Num> {hunks.length === 1 ? "hunk" : "hunks"}
                  </>
                }
                sub="Tap one to reject it. Rejecting puts those lines back to base."
              >
                <Button
                  disabled={applyMut.isPending || rejected.size === 0}
                  title={rejected.size === 0 ? "Tap a hunk below to reject it first" : undefined}
                  onClick={() =>
                    applyMut.mutate({
                      path: selectedPath,
                      rejectedHunkIds: [...rejected],
                      expectedUpdatedAt: selected.updated_at,
                    })
                  }
                >
                  {applyMut.isPending
                    ? "Reverting them"
                    : rejected.size === 0
                      ? "Revert the rejected"
                      : `Revert ${rejected.size}`}
                </Button>
              </Line>
              {hunks.map((h) => {
                const isRejected = rejected.has(h.id);
                const preview = (h.modifiedLines[0] ?? h.baseLines[0] ?? "").trim().slice(0, 80);
                return (
                  <Row
                    key={h.id}
                    tight
                    focused={isRejected}
                    marks={<AgentMark slug={BUILDER} state="quiet" />}
                    lead={<Num>{preview || "(blank line)"}</Num>}
                    sub={
                      <>
                        <Diffstat added={h.modifiedLines.length} removed={h.baseLines.length} />{" "}
                        {isRejected ? "Rejected, goes back to base" : `Hunk ${h.id + 1}`}
                      </>
                    }
                    onClick={() =>
                      setRejected((prev) => {
                        const next = new Set(prev);
                        if (next.has(h.id)) next.delete(h.id);
                        else next.add(h.id);
                        return next;
                      })
                    }
                  />
                );
              })}
            </>
          ) : null}
        </Block>
      ) : null}
    </>
  );
}
