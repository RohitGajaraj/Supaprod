import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { LineageDrawer } from "@/components/supaprod/LineageDrawer";
import { listSpecs, deletePrd, createGithubIssueForPrd, savePrd } from "@/lib/discovery.functions";
import { promotePrdToTasks } from "@/lib/lineage.functions";
import { dispatchStudioSession } from "@/lib/studio.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSpecApprovals } from "@/hooks/use-mission-approvals";
import { AgentMark, Button, Empty, Failed, Input, Num, Row } from "@/components/shell/primitives";

export interface SpecListProps {
  onOpen: (id: string) => void;
}

/** prds.status in plain words. The retired list shouted these through a chip in
 *  mono caps ("CRITIC REVIEW"); a row's second line is a fact, not a chip. */
function specState(status: string): string {
  if (status === "shipped") return "Shipped";
  if (status === "approved") return "Approved";
  if (status === "review") return "In review";
  return "Drafting";
}

/** Plain-words relative time. The Row applies the mono. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface SpecRowItem {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  citations: unknown;
}

/** One spec, attributed. The approvals read stays per-row so its query key is
 *  unchanged and the hook only runs for the rows on screen.
 *
 *  WHO wrote it is not in the row's data: `listSpecs` selects no author. Scribe
 *  is the station's writer and the only thing that drafts a spec, which is what
 *  the ported Plan surface says too, so the mark names it rather than leaving
 *  the row silent. */
function SpecRow({
  spec,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onOpen,
}: {
  spec: SpecRowItem;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (next: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onOpen: () => void;
}) {
  const approvals = useSpecApprovals(spec.id);
  const waiting = (approvals.data?.length ?? 0) > 0;
  const settled = spec.status === "approved" || spec.status === "shipped";
  const cites = Array.isArray(spec.citations) ? spec.citations.length : 0;

  // Ember only when the spec is genuinely holding a call open. Dim once it is
  // settled, plain while it is still moving. State is never a hue anywhere else.
  const mark = (
    <AgentMark slug="prd-writer" state={waiting ? "gate" : settled ? "quiet" : "idle"} />
  );

  if (isRenaming) {
    return (
      <Row
        marks={mark}
        lead={
          <Input
            autoFocus
            value={renameValue}
            aria-label="Spec title"
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRenameCommit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onRenameCancel();
              }
            }}
          />
        }
      />
    );
  }

  return (
    <Row
      tight
      marks={mark}
      lead={spec.title}
      // One different fact, never more of the first: where the spec has got to,
      // and what it stands on. A call waiting outranks both.
      sub={
        waiting ? (
          "Waiting on your approval"
        ) : cites > 0 ? (
          <>
            {specState(spec.status)} · <Num>{cites}</Num> {cites === 1 ? "source" : "sources"}
          </>
        ) : (
          specState(spec.status)
        )
      }
      time={ago(spec.updated_at)}
      onClick={onOpen}
    />
  );
}

/**
 * The cited spec list, as the interior of a section the surface already titled.
 * It draws no heading and no card of its own: the section it sits in is the one
 * bordered container in the region, so a card here would be a card inside a card.
 *
 * Every write the retired parchment panel had is still here (rename, generate
 * tasks, GitHub issue, hand to Build, lineage, delete); they moved off the row
 * and into the one overflow control, so the row itself is a title and a fact.
 */
export function SpecList({ onOpen }: SpecListProps) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const fSpecs = useServerFn(listSpecs);
  const fSave = useServerFn(savePrd);
  const fDelete = useServerFn(deletePrd);
  const fPromote = useServerFn(promotePrdToTasks);
  const fCreateIssue = useServerFn(createGithubIssueForPrd);
  const fDispatch = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);

  const specs = useQuery({ queryKey: ["prds"], queryFn: () => fSpecs() });
  const inv = () => qc.invalidateQueries({ queryKey: ["prds"] });

  const [lineage, setLineage] = useState<{ id: string; title: string } | null>(null);
  // W5b: the dispatch repo gate. Set when a "Hand to Build" cannot resolve a
  // repo; the dialog offers /sync or provision-a-starter-repo + auto retry.
  const [repoGate, setRepoGate] = useState<{ prdId: string; reason: string | null } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  // Anti-scroll (founder ruling 2026-07-06): show the top few and expand on
  // demand, same idiom as SignalFeed/AutoClustered.
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_SPECS = 8;

  const rename = useMutation({
    mutationFn: (v: { id: string; title: string }) => fSave({ data: { id: v.id, title: v.title } }),
    onSuccess: () => {
      inv();
      toast.success("Renamed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: inv,
    onError: (e: Error) => toast.error(e.message),
  });
  const promote = useMutation({
    mutationFn: (prd_id: string) => fPromote({ data: { prd_id } }),
    onSuccess: (r) => {
      toast.success(`Generated ${r.count} task${r.count === 1 ? "" : "s"}.`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const createIssue = useMutation({
    mutationFn: (id: string) => fCreateIssue({ data: { id } }),
    onSuccess: (r) => {
      toast.success(
        r.cached ? "GitHub issue already linked." : `GitHub issue #${r.number} created.`,
      );
      inv();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dispatch = useMutation({
    mutationFn: (prdId: string) => fDispatch({ data: { prdId } }),
    onSuccess: (r) => {
      toast.success("Handed to Build. Mission dispatched.");
      navigate({ to: "/build/$missionId", params: { missionId: r.missionId } });
    },
    onError: (e: Error, prdId) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ prdId, reason: e.message });
      else toast.error(e.message);
    },
  });
  const handToBuild = (prdId: string) =>
    gateDispatch({
      check: () => fCanDispatch({ data: { prdId } }),
      dispatch: () => dispatch.mutate(prdId),
      openGate: (reason) => setRepoGate({ prdId, reason }),
    });

  const startRename = (id: string, current: string) => {
    setRenameValue(current);
    setRenamingId(id);
  };
  const commitRename = (id: string, original: string) => {
    const next = renameValue.trim().slice(0, 200);
    setRenamingId(null);
    if (next && next !== original) rename.mutate({ id, title: next });
  };

  if (specs.isLoading) {
    return (
      <div role="status">
        <span className="sr-only">Reading the specs.</span>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              height: "var(--sp-row-h-decision)",
              borderTop: i > 0 ? "1px solid var(--sp-line-soft)" : undefined,
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  // A read that failed is not an empty state: "nothing here" and "we could not
  // find out" are different facts and a person acts differently on each.
  if (specs.isError) {
    return (
      <Failed onRetry={() => void specs.refetch()}>
        {(specs.error as Error)?.message ?? "The specs did not load."}
      </Failed>
    );
  }

  const specList = specs.data?.prds ?? [];
  const shownSpecs = showAll ? specList : specList.slice(0, VISIBLE_SPECS);

  if (specList.length === 0) {
    return (
      <Empty>
        No specs yet. Commit a bet and Scribe drafts the first one, cited, in about five minutes.
      </Empty>
    );
  }

  return (
    <>
      {shownSpecs.map((spec, i) => {
        const isRenaming = renamingId === spec.id;
        const isDispatching = dispatch.isPending && dispatch.variables === spec.id;
        const isCreatingIssue = createIssue.isPending && createIssue.variables === spec.id;
        const isPromoting = promote.isPending && promote.variables === spec.id;
        return (
          <div
            key={spec.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-space-2)",
              // The rule between rows, not a border around each of them.
              borderTop: i > 0 ? "1px solid var(--sp-line-soft)" : undefined,
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <SpecRow
                spec={spec}
                isRenaming={isRenaming}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameCommit={() => commitRename(spec.id, spec.title)}
                onRenameCancel={() => setRenamingId(null)}
                onOpen={() => onOpen(spec.id)}
              />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Spec actions"
                  className="sp-btn"
                  data-variant="ghost"
                  style={{
                    flexShrink: 0,
                    width: "var(--sp-ctl-sm)",
                    height: "var(--sp-ctl-sm)",
                    padding: 0,
                    justifyContent: "center",
                  }}
                >
                  <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => startRename(spec.id, spec.title)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => promote.mutate(spec.id)} disabled={isPromoting}>
                  {isPromoting ? "Generating tasks" : "Generate tasks"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {spec.github_issue_url ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      window.open(spec.github_issue_url!, "_blank", "noopener,noreferrer")
                    }
                  >
                    Open GitHub issue
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => createIssue.mutate(spec.id)}
                    disabled={isCreatingIssue}
                  >
                    {isCreatingIssue ? "Creating" : "Create GitHub issue"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => void handToBuild(spec.id)}
                  disabled={isDispatching}
                >
                  {isDispatching ? "Dispatching" : "Hand to Build"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setLineage({ id: spec.id, title: spec.title })}>
                  Lineage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    const ok = await confirm({
                      title: `Delete "${spec.title}"?`,
                      body: "This deletes the spec. This can't be undone.",
                      destructive: true,
                    });
                    if (ok) del.mutate(spec.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
      {specList.length > VISIBLE_SPECS ? (
        <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show ${specList.length - VISIBLE_SPECS} more`}
        </Button>
      ) : null}
      <LineageDrawer
        open={lineage !== null}
        onOpenChange={(o) => {
          if (!o) setLineage(null);
        }}
        kind="prd"
        id={lineage?.id ?? null}
        title={lineage?.title}
      />
      <RepoGateDialog
        open={repoGate !== null}
        prdId={repoGate?.prdId ?? null}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => {
          if (repoGate) dispatch.mutate(repoGate.prdId);
        }}
      />
    </>
  );
}
