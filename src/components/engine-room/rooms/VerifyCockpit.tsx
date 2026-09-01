import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { computeHunks } from "@/lib/ai/studio-hunks";
import { CodeDiff } from "@/components/studio/CodeDiff";
import { decideApproval } from "@/lib/agent_loop.functions";
import { listGovernApprovals } from "@/lib/governance.functions";
import { listChangelog } from "@/lib/changelog.functions";
import { humanWriteError } from "@/lib/roles.functions";
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
} from "../room-parts";
import { QuietAction } from "../EngineChrome";
import { Eyebrow } from "@/components/meridian/surface-parts";
import { Reveal } from "@/components/meridian/Reveal";

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
 *
 * 2026-08-15: PORTED TO MERIDIAN, and two colour decisions were reversed.
 *
 * RISK IS NOT A HUE ANY MORE. The three risk levels were painted moss, marigold
 * and madder, which claims three meanings this system does not have: green and
 * red report an OUTCOME (it worked, it did not) and nothing on a call that has
 * not run yet is an outcome, while amber means stopped and NOT on you, which a
 * pending approval is the exact opposite of. meridian.css is explicit about the
 * remedy: something that needs to be noticed and carries none of the five
 * meanings needs STRUCTURE, not a sixth colour. So the three levels are
 * separated by ink weight instead, which survives greyscale and leaves the one
 * accent on this panel where it belongs.
 *
 * ROLL BACK IS NOT RED. Red is an outcome here, never an intent, and a
 * destructive control is separated by DISTANCE rather than by colour: it sits
 * last, behind a confirm, which is what actually protects someone. A red button
 * that is safe to press teaches a reader to stop reading red.
 *
 * THE ONE ACCENT IS ON APPROVE, because it is the control that UNBLOCKS a run
 * that has stopped for a person. That is the whole definition of `--mrd-you`,
 * and it is the same rule /approvals follows on the same act.
 */

type PendingApproval = Awaited<ReturnType<typeof listGovernApprovals>>["approvals"][number];

type DiffRow = {
  id: string;
  path: string;
  op: string;
  base_content: string | null;
  new_content: string | null;
  updated_at: string;
};

/** Risk, separated by ink weight rather than by hue. High reads at full
 *  strength, low reads quietest, and the order is legible in greyscale. */
const RISK_INK: Record<string, string> = {
  low: "text-mrd-mute",
  medium: "text-mrd-body",
  high: "text-mrd-ink",
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

/** One bordered container per region, which is the cap the standard sets. */
const CARD = "overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet";

/** The small neutral control this panel repeats: a file tab, a diff toggle, a
 *  reject. Sans, not mono, because none of them is a figure. */
const SMALL_BTN = `inline-flex h-7 items-center rounded-mrd-chip border border-mrd-line px-2.5 text-mrd-small whitespace-nowrap text-mrd-body transition-colors enabled:hover:bg-mrd-hover enabled:hover:text-mrd-ink disabled:cursor-not-allowed disabled:opacity-45`;

function SectionHead({ label, note }: { label: string; note?: string | null }) {
  return (
    <div className="mb-mrd-4 flex items-baseline gap-mrd-3">
      <Eyebrow>{label}</Eyebrow>
      {note ? (
        <span className="font-mrd-mono text-mrd-data text-mrd-faint tabular-nums">{note}</span>
      ) : null}
    </div>
  );
}

/** A diff still loading. It reserves the height the diff will take, so the row
 *  below it does not jump up and then back down as the read lands, and it says
 *  so in words rather than reserving the height silently. */
function DiffPending() {
  return (
    <div className="flex h-[360px] items-center justify-center">
      <PanelPending>Reading the diff.</PanelPending>
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
    onError: (e: unknown) => toast.error(humanWriteError(e, "Could not record the decision.")),
  });

  if (isError) {
    return <ErrorRetry message="Approvals did not load." onRetry={onRetry} />;
  }
  if (isLoading) return <PanelPending />;
  if (approvals.length === 0) {
    return <EmptyRow message="Nothing is waiting on you. The queue is clear." />;
  }

  return (
    <div data-mrd="" className={CARD}>
      {approvals.map((a) => {
        const busy = decide.isPending && decide.variables?.approvalId === a.id;
        return (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-mrd-4 border-b border-mrd-line-soft px-mrd-5 py-mrd-4 last:border-0"
          >
            <div className="min-w-0 flex-1">
              {/* The agent slug and the tool name are IDENTIFIERS, which is one
                  of the things mono is for. The verb between them is not. */}
              <div className="truncate text-mrd-base font-medium text-mrd-ink">
                <span className="font-mrd-mono text-mrd-prose text-mrd-body">
                  {a.agent_slug ?? "agent"}
                </span>{" "}
                wants <span className="font-mrd-mono">{a.tool_name}</span>
              </div>
              {/* The two SHORT facts stay on one truncating line: a risk word
                  and a mission title are labels, and a label that runs long is
                  still recognisable from its first half. */}
              <div className="mt-0.5 truncate text-mrd-small text-mrd-mute">
                <span className={RISK_INK[a.risk] ?? "text-mrd-body"}>{a.risk} risk</span>
                {a.mission_title ? ` · in ${a.mission_title}` : ""}
              </div>
              {/*
                THE REASON IS NOT A LABEL, AND IT WAS BEING TREATED AS ONE.

                It used to be appended to the line above -- third in a ` · `
                chain inside a `truncate` -- so it was the part that got cut,
                every time, by construction: the two labels ahead of it are
                spent first. What was cut is the agent's argument for the thing
                it is asking to do, on the exact row carrying the Reject and
                Approve buttons. That is the one place in this product where a
                person is asked to decide with the evidence in front of them,
                and the evidence was the ellipsis.

                So it gets its own block and its own clamp. Two rendered lines
                keeps the queue scannable -- this panel is a list and a row that
                grows to eight lines buries the next call -- and `Reveal`
                measures the overflow before drawing anything, so a one-line
                rationale reads exactly as it did.
              */}
              {a.rationale ? (
                <Reveal lines={2} className="mt-0.5 text-mrd-small text-mrd-mute">
                  {a.rationale}
                </Reveal>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-mrd-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide.mutate({ approvalId: a.id, decision: "reject" })}
                className={SMALL_BTN}
              >
                Reject
              </button>
              {/* THE ONE ACCENT ON THIS PANEL. Approving is what releases an
                  agent that has stopped for a person, which is exactly what
                  `--mrd-you` means. Disabled it falls back to the neutral
                  primary face with `--mrd-on-solid` on it, because both
                  `bg-mrd-solid` and `text-mrd-ink` invert with the ground and
                  travel together: 1.19:1 on paper, an invisible label on every
                  click of a control that disables for the whole round trip. */}
              <button
                type="button"
                disabled={busy}
                onClick={() => decide.mutate({ approvalId: a.id, decision: "approve" })}
                className={`inline-flex h-7 items-center rounded-mrd-chip bg-mrd-you px-2.5 text-mrd-small font-medium whitespace-nowrap text-mrd-on-you transition-opacity enabled:hover:opacity-90 disabled:bg-mrd-solid disabled:text-mrd-on-solid`}
                style={{ transitionDuration: "var(--mrd-d-press)" }}
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
    <div data-mrd="" className={CARD}>
      {entries.map((e) => (
        <Row
          key={e.id}
          subject={e.title}
          value={[e.product_name ?? null, relTime(e.released_at)].filter(Boolean).join(" · ")}
          statusWord="shipped"
          /* An outcome: it shipped. Red and green report outcomes in this
             system and nothing else, so this one is entitled to the hue. */
          tone="pass"
          onOpen={e.pr_url ? () => window.open(e.pr_url as string, "_blank") : undefined}
        />
      ))}
    </div>
  );
}

/* ----------------- 3. Applied changes (diff + rollback) ----------------- */

function AppliedChangeRow({ change, onChanged }: { change: AppliedChange; onChanged: () => void }) {
  // No theme hook any more: it existed only to tell Monaco which of ITS palettes
  // to use. `CodeDiff` is built from `--sp-*` tokens and follows the theme itself.
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
    onError: (e: unknown) => toast.error(humanWriteError(e, "Rollback failed.")),
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
    <div className="border-b border-mrd-line-soft last:border-0">
      <div className="flex flex-wrap items-center gap-mrd-4 px-mrd-5 py-mrd-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 rounded-mrd-xs text-left transition-opacity hover:opacity-90"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          <div className="truncate text-mrd-base font-medium text-mrd-ink">{change.title}</div>
          {/* A file COUNT and a timestamp are figures; the mission name is not,
              so only the parts that are numbers wear mono. */}
          <div className="mt-0.5 truncate text-mrd-small text-mrd-mute">
            {change.mission_title ? `in ${change.mission_title} · ` : ""}
            <span className="font-mrd-mono tabular-nums">
              {change.file_count} file{change.file_count === 1 ? "" : "s"}
            </span>
            {relTime(change.merged_at) ? (
              <>
                {" · "}
                <span className="font-mrd-mono tabular-nums">{relTime(change.merged_at)}</span>
              </>
            ) : null}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-mrd-3">
          {change.pr_url ? (
            <a
              href={change.pr_url}
              target="_blank"
              rel="noreferrer"
              className="font-mrd-mono rounded-mrd-xs text-mrd-small text-mrd-mute transition-colors hover:text-mrd-ink"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {change.pr_number ? `PR #${change.pr_number}` : "PR"}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={SMALL_BTN}
          >
            {open ? "Hide diff" : "Verify diff"}
          </button>
          {/* THE DESTRUCTIVE ONE IS SEPARATED BY POSITION, NOT BY COLOUR. It
              used to be drawn in red, and red reports an OUTCOME in this
              system rather than an intent: a control that has not been pressed
              has no outcome to report, and a red button that is safe to press
              is how a reader learns to stop reading red. What actually protects
              someone here is that it sits last and opens a confirm. */}
          <button
            type="button"
            disabled={rollbackMut.isPending}
            onClick={triggerRollback}
            className={SMALL_BTN}
          >
            {rollbackMut.isPending ? "Rolling back..." : "Roll back"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-mrd-line-soft">
          {diff.isError ? (
            <div className="px-mrd-5 py-mrd-4">
              <ErrorRetry message="The diff did not load." onRetry={() => void diff.refetch()} />
            </div>
          ) : diff.isLoading ? (
            <DiffPending />
          ) : files.length === 0 ? (
            <div className="px-mrd-5">
              <EmptyRow message="This change has no file diff on the record." />
            </div>
          ) : (
            <>
              {files.length > 1 ? (
                <div className="flex flex-wrap gap-mrd-3 border-b border-mrd-line-soft px-mrd-5 py-mrd-3">
                  {files.map((f) => {
                    const active = f.path === selectedPath;
                    return (
                      /* THE PICKED FILE TAKES `--mrd-select`, NOT A RAISED
                         GROUND. Everything the panel below does happens to
                         exactly this file, which is what a selection means; the
                         ground it used to take is one the reader also sees
                         under a pointer, so the picked file and the file being
                         hovered were the same shade. */
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedPath(f.path)}
                        aria-pressed={active}
                        className={`font-mrd-mono max-w-[260px] truncate ${SMALL_BTN} ${
                          active ? "bg-mrd-select font-medium text-mrd-ink" : "text-mrd-mute"
                        }`}
                      >
                        {f.path}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="flex items-center gap-mrd-4 border-b border-mrd-line-soft px-mrd-5 py-mrd-3">
                {/* A path is an identifier, so it is mono. */}
                <span className="font-mrd-mono min-w-0 flex-1 truncate text-mrd-small text-mrd-ink">
                  {selectedPath ?? ""}
                </span>
                <span className="font-mrd-mono shrink-0 text-mrd-data text-mrd-mute tabular-nums">
                  {hunks.length} hunk{hunks.length === 1 ? "" : "s"} · base vs merged
                </span>
              </div>
              {/* Ported off Monaco with the Build terminal, and this was the
                  last usage in the tree, so the editor leaves the bundle
                  altogether. Same trade as there: a fixed 360px box for text
                  nobody can edit, carrying its own palette and needing a theme
                  bridge to avoid rendering vs-dark inside the light theme.
                  `CodeDiff` is `--sp-*` tokens on the same `computeHunks`
                  alignment this cockpit already counts its hunks from, so the
                  number above and the rows below cannot disagree. */}
              {selected ? (
                <div className="px-mrd-5 pb-mrd-4">
                  <CodeDiff base={selected.base_content ?? ""} next={selected.new_content ?? ""} />
                </div>
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
    <div data-mrd="" className={CARD}>
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
    <div data-mrd="" className="flex flex-col gap-mrd-6">
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

      <div className="self-start">
        <QuietAction onClick={() => navigate({ to: "/traces" })}>
          Open the full run record
        </QuietAction>
      </div>
    </div>
  );
}
