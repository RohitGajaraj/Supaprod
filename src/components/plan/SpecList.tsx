import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { VerdictChip, MonoLabel } from "@/components/obsidian";
import { LineageDrawer } from "@/components/cadence/LineageDrawer";
import { listSpecs, deletePrd, createGithubIssueForPrd, savePrd } from "@/lib/discovery.functions";
import { promotePrdToTasks } from "@/lib/lineage.functions";
import { dispatchStudioSession } from "@/lib/studio.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relTime } from "@/components/product/format";
import { stateChip, citesLabel } from "./format";

export interface SpecListProps {
  onOpen: (id: string) => void;
}

// SpecStateTone -> a VerdictChip tone resolving to the same hue (VALIDATED/CRITIC
// REVIEW/DRAFTING share the exact moss/marigold/glacier hexes stateChip names;
// there is no "APPROVED"/"SHIPPED" VerdictTone, so the chip's own `children`
// (chip.label) carries the exact word — this only picks the color family.
const TONE_TO_VERDICT = {
  moss: "VALIDATED",
  marigold: "CRITIC REVIEW",
  glacier: "DRAFTING",
} as const;

/**
 * OBS-07 §5 step 5: the cited spec list. OBS-10 (final closure): absorbed
 * every write action the now-retired parchment `SpecsPanel` had (rename,
 * generate tasks, GitHub issue, hand to Build, lineage, delete).
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

  const specs = useQuery({ queryKey: ["prds"], queryFn: () => fSpecs() });
  const inv = () => qc.invalidateQueries({ queryKey: ["prds"] });

  const [lineage, setLineage] = useState<{ id: string; title: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

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
    onError: (e: Error) => toast.error(e.message),
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
      <div role="status" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span className="sr-only">Loading specs…</span>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{ height: 44, borderBottom: "1px solid var(--hairline)", opacity: 0.4 }}
          />
        ))}
      </div>
    );
  }

  if (specs.isError) {
    return (
      <div
        style={{
          padding: 24,
          background: "var(--surface-card-deep)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD PLAN
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          {(specs.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => specs.refetch()}
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads the surface
        </button>
      </div>
    );
  }

  const specList = specs.data?.prds ?? [];

  if (specList.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          No specs yet. Approve an opportunity and Scribe drafts the first one, cited, in about five
          minutes.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-panel)" }}>
        {specList.map((spec, i) => {
          const chip = stateChip(spec.status);
          const cites = citesLabel(spec.citations);
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
                borderBottom: i < specList.length - 1 ? "1px solid var(--hairline)" : "none",
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isRenaming) onOpen(spec.id);
                }}
                onKeyDown={(e) => {
                  if (isRenaming) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(spec.id);
                  }
                }}
                className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                  minWidth: 0,
                  padding: "14px 18px",
                  cursor: isRenaming ? "default" : "pointer",
                  transitionProperty: "background-color",
                  transitionDuration: "var(--dur-control)",
                  transitionTimingFunction: "var(--ease)",
                }}
                onMouseEnter={(e) => {
                  if (!isRenaming) e.currentTarget.style.background = "var(--hover)";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => commitRename(spec.id, spec.title)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRename(spec.id, spec.title);
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setRenamingId(null);
                      }
                    }}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      background: "var(--surface-raised)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--radius-control)",
                      padding: "4px 8px",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {spec.title}
                  </span>
                )}
                <VerdictChip tone={TONE_TO_VERDICT[chip.tone]}>{chip.label}</VerdictChip>
                {cites && (
                  <MonoLabel tone="blossom" style={{ fontSize: 9 }}>
                    {cites}
                  </MonoLabel>
                )}
                <MonoLabel tone="faint" style={{ fontSize: 9 }}>
                  {relTime(spec.updated_at)}
                </MonoLabel>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Spec actions"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flexShrink: 0,
                      padding: "4px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      color: "var(--text-faint)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ⋯
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => startRename(spec.id, spec.title)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => promote.mutate(spec.id)} disabled={isPromoting}>
                    {isPromoting ? "Generating tasks…" : "Generate tasks"}
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
                      {isCreatingIssue ? "Creating…" : "Create GitHub issue"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() => dispatch.mutate(spec.id)}
                    disabled={isDispatching}
                  >
                    {isDispatching ? "Dispatching…" : "Hand to Build"}
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
      </div>
      <LineageDrawer
        open={lineage !== null}
        onOpenChange={(o) => {
          if (!o) setLineage(null);
        }}
        kind="prd"
        id={lineage?.id ?? null}
        title={lineage?.title}
      />
    </>
  );
}
