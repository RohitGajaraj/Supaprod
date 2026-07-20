// ArtifactsSurface (front-end reimagining, founder-approved, named "Artifacts").
// The workspace view of everything the loop has made: prototypes, specs, docs.
// The /artifacts route renders this; a per-product tab on the Canvas rest face
// is the follow-up placement.
//
// K6 index (no migration) + K9 rename/delete (no migration: each family already
// has its own server fns, dispatched by kind here). Versions (K7) + the
// per-product tab remain the migration-bearing follow-ups. Plain ink surfaces,
// chip attribution, mono timestamps, no cost figures.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { usePrompt, useConfirm } from "@/hooks/use-confirm";
import {
  listArtifacts,
  listArtifactVersions,
  captureArtifactVersion,
  restoreArtifactVersion,
  type ArtifactSummary,
  type ArtifactKind,
  type ArtifactProduct,
} from "@/lib/artifacts.functions";
import { renamePrototype, deletePrototype } from "@/lib/prototypes.functions";
import { savePrd, deletePrd } from "@/lib/discovery.functions";
import { updateDoc, deleteDoc } from "@/lib/docs.functions";

const KIND_LABEL: Record<ArtifactKind, string> = {
  prototype: "Prototype",
  spec: "Spec",
  doc: "Doc",
};

function relTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ArtifactHistory({ kind, id }: { kind: ArtifactKind; id: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listArtifactVersions);
  const captureFn = useServerFn(captureArtifactVersion);
  const restoreFn = useServerFn(restoreArtifactVersion);
  const vq = useQuery({
    queryKey: ["artifact-versions", kind, id],
    queryFn: () => listFn({ data: { kind, id } }),
  });
  const versions = vq.data?.versions ?? [];
  const snap = useMutation({
    mutationFn: () => captureFn({ data: { kind, id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["artifact-versions", kind, id] });
      toast.success("Snapshot saved.");
    },
    onError: () => toast.error("Versions turn on with the next release."),
  });
  const restore = useMutation({
    mutationFn: (versionId: string) => restoreFn({ data: { versionId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["artifact-versions", kind, id] });
      void qc.invalidateQueries({ queryKey: ["artifacts"] });
      toast.success("Restored.");
    },
    onError: () => toast.error("Could not restore that version."),
  });
  return (
    <div
      className="mt-1 rounded-lg border px-3 py-2.5"
      style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-faint)" }}>
          Version history
        </span>
        <button
          type="button"
          disabled={snap.isPending}
          onClick={() => snap.mutate()}
          className="ink-focus rounded-md px-2 py-0.5 text-[11.5px] hover:bg-[var(--ink-raised)] disabled:opacity-40"
          style={{ color: "var(--ink-text)" }}
        >
          {snap.isPending ? "Saving…" : "Snapshot now"}
        </button>
      </div>
      {vq.isLoading ? (
        <div className="ink-skeleton mt-2 h-5 w-full rounded" />
      ) : versions.length === 0 ? (
        <p className="mt-2 text-[12px]" style={{ color: "var(--ink-subtle)" }}>
          No versions yet. Snapshot the current state to start a history.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center gap-2 text-[12px]">
              <span className="flex-none font-mono text-[10.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
                {relTime(v.createdAt)}
              </span>
              <span className="min-w-0 flex-1 truncate" style={{ color: "var(--ink-body)" }}>
                {v.title ?? "Untitled"}
              </span>
              <button
                type="button"
                disabled={restore.isPending}
                onClick={() => restore.mutate(v.id)}
                className="ink-focus flex-none rounded-md px-2 py-0.5 text-[11px] hover:bg-[var(--ink-raised)] disabled:opacity-40"
                style={{ color: "var(--ink-subtle)" }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ArtifactRow({
  a,
  onRename,
  onDelete,
  busy,
}: {
  a: ArtifactSummary;
  onRename: (a: ArtifactSummary) => void;
  onDelete: (a: ArtifactSummary) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col">
      <div
        className="group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:bg-[var(--ink-raised)]"
        style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}
      >
      <span
        className="inline-flex h-[20px] flex-none items-center rounded-[10px] border px-2 font-mono text-[10px] uppercase tracking-[0.06em]"
        style={{ color: "var(--chip-fg)", background: "var(--chip-faint)", borderColor: "var(--chip-border)" }}
      >
        {KIND_LABEL[a.kind]}
      </span>
      <a
        href={a.href}
        className="ink-focus min-w-0 flex-1 truncate text-[13.5px]"
        style={{ color: "var(--ink-text)" }}
      >
        {a.name}
      </a>
      <span className="flex-none font-mono text-[10.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
        {relTime(a.updatedAt)}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="ink-focus flex-none rounded-md px-2 py-0.5 text-[11.5px] opacity-0 transition-opacity hover:bg-[var(--ink-raised)] focus-visible:opacity-100 group-hover:opacity-100"
        style={{ color: "var(--ink-subtle)" }}
      >
        History
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onRename(a)}
        className="ink-focus flex-none rounded-md px-2 py-0.5 text-[11.5px] opacity-0 transition-opacity hover:bg-[var(--ink-raised)] focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
        style={{ color: "var(--ink-subtle)" }}
      >
        Rename
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(a)}
        className="ink-focus flex-none rounded-md px-2 py-0.5 text-[11.5px] opacity-0 transition-opacity hover:bg-[rgba(229,83,75,0.08)] focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
        style={{ color: "var(--verdict-fail)" }}
      >
        Delete
      </button>
      </div>
      {open ? <ArtifactHistory kind={a.kind} id={a.id} /> : null}
    </div>
  );
}

export function ArtifactsSurface() {
  const fetchArtifacts = useServerFn(listArtifacts);
  const q = useQuery({ queryKey: ["artifacts"], queryFn: () => fetchArtifacts() });
  const artifacts = useMemo(() => q.data?.artifacts ?? [], [q.data]);
  const products = useMemo<ArtifactProduct[]>(() => q.data?.products ?? [], [q.data]);
  const [productFilter, setProductFilter] = useState<string | null>(null);
  const shown = useMemo(
    () => (productFilter ? artifacts.filter((a) => a.productId === productFilter) : artifacts),
    [artifacts, productFilter],
  );

  const qc = useQueryClient();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const fRenameProto = useServerFn(renamePrototype);
  const fDeleteProto = useServerFn(deletePrototype);
  const fSavePrd = useServerFn(savePrd);
  const fDeletePrd = useServerFn(deletePrd);
  const fUpdateDoc = useServerFn(updateDoc);
  const fDeleteDoc = useServerFn(deleteDoc);

  const renameMut = useMutation({
    mutationFn: async ({ a, name }: { a: ArtifactSummary; name: string }) => {
      if (a.kind === "prototype") await fRenameProto({ data: { id: a.id, name } });
      else if (a.kind === "spec") await fSavePrd({ data: { id: a.id, title: name } });
      else await fUpdateDoc({ data: { id: a.id, title: name } });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["artifacts"] });
      toast.success("Renamed.");
    },
    onError: () => toast.error("Could not rename that."),
  });

  const deleteMut = useMutation({
    mutationFn: async (a: ArtifactSummary) => {
      if (a.kind === "prototype") await fDeleteProto({ data: { id: a.id } });
      else if (a.kind === "spec") await fDeletePrd({ data: { id: a.id } });
      else await fDeleteDoc({ data: { id: a.id } });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["artifacts"] });
      toast.success("Deleted.");
    },
    onError: () => toast.error("Could not delete that."),
  });

  const busy = renameMut.isPending || deleteMut.isPending;

  const onRename = async (a: ArtifactSummary) => {
    const name = await prompt({
      title: "Rename artifact",
      defaultValue: a.name,
      placeholder: "New name",
      confirmLabel: "Rename",
    });
    if (name && name.trim() && name.trim() !== a.name) renameMut.mutate({ a, name: name.trim() });
  };

  const onDelete = async (a: ArtifactSummary) => {
    const ok = await confirm({
      title: "Delete this artifact?",
      body: `"${a.name}" will be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (ok) deleteMut.mutate(a);
  };

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-6 pb-16 pt-10"
      style={{ background: "var(--ink-bg)", color: "var(--ink-body)" }}
    >
      <header>
        <h1 className="text-[22px] font-medium leading-tight" style={{ color: "var(--ink-text)" }}>
          Artifacts
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-subtle)" }}>
          Everything the loop has made: prototypes, specs, and docs.
        </p>
      </header>

      {q.isLoading ? (
        <div className="flex flex-col gap-2.5">
          <div className="ink-skeleton h-12 w-full rounded-xl" />
          <div className="ink-skeleton h-12 w-full rounded-xl" />
          <div className="ink-skeleton h-12 w-full rounded-xl" />
        </div>
      ) : q.isError ? (
        <div
          className="rounded-xl border p-4 text-[13px]"
          style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-body)" }}
        >
          Could not load your artifacts.{" "}
          <button
            type="button"
            onClick={() => void q.refetch()}
            className="ink-focus underline underline-offset-4"
            style={{ color: "var(--ink-text)" }}
          >
            Try again
          </button>
        </div>
      ) : artifacts.length === 0 ? (
        <div
          className="rounded-xl border border-dashed px-6 py-10 text-center"
          style={{ borderColor: "var(--ink-hairline)" }}
        >
          <p className="mx-auto max-w-[380px] text-[13px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
            Nothing made yet. Prototypes, specs, and docs the agents produce land here for you to
            revisit.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {products.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => setProductFilter(null)}
                aria-current={productFilter === null ? "true" : undefined}
                className="ink-focus rounded-full border px-2.5 py-1 text-[11.5px] transition-colors"
                style={{
                  borderColor: "var(--ink-hairline)",
                  background: productFilter === null ? "var(--ink-raised)" : "transparent",
                  color: productFilter === null ? "var(--ink-text)" : "var(--ink-subtle)",
                }}
              >
                All {artifacts.length}
              </button>
              {products.map((p) => {
                const on = productFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductFilter(p.id)}
                    aria-current={on ? "true" : undefined}
                    className="ink-focus rounded-full border px-2.5 py-1 text-[11.5px] transition-colors"
                    style={{
                      borderColor: "var(--ink-hairline)",
                      background: on ? "var(--ink-raised)" : "transparent",
                      color: on ? "var(--ink-text)" : "var(--ink-subtle)",
                    }}
                  >
                    {p.name} {p.count}
                  </button>
                );
              })}
            </div>
          ) : null}
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            {shown.length} {productFilter ? "in this product" : "in this workspace"}, newest first.
          </p>
          {shown.map((a) => (
            <ArtifactRow
              key={`${a.kind}:${a.id}`}
              a={a}
              onRename={onRename}
              onDelete={onDelete}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
