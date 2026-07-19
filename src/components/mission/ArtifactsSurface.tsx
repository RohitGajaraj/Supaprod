// ArtifactsSurface (front-end reimagining Phase 4; founder-approved, named
// "Artifacts"). The workspace view of everything the loop has made:
// prototypes, specs, docs today. The /artifacts route renders this; a
// per-product tab on the Canvas rest face is the follow-up placement.
//
// Read-only index today (gap K6): rename/delete (K9) and versions (K7) are the
// migration-bearing follow-ups, so this never renders a control it cannot back.
// Plain ink surfaces, chip attribution, mono timestamps, no cost figures.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listArtifacts, type ArtifactSummary, type ArtifactKind } from "@/lib/artifacts.functions";

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

function ArtifactRow({ a }: { a: ArtifactSummary }) {
  return (
    <a
      href={a.href}
      className="ink-focus flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:bg-[var(--ink-raised)]"
      style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-panel)" }}
    >
      <span
        className="inline-flex h-[20px] flex-none items-center rounded-[10px] border px-2 font-mono text-[10px] uppercase tracking-[0.06em]"
        style={{ color: "var(--chip-fg)", background: "var(--chip-faint)", borderColor: "var(--chip-border)" }}
      >
        {KIND_LABEL[a.kind]}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px]" style={{ color: "var(--ink-text)" }}>
        {a.name}
      </span>
      <span className="flex-none font-mono text-[10.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
        {relTime(a.updatedAt)}
      </span>
      <span aria-hidden className="flex-none text-[12px]" style={{ color: "var(--ink-faint)" }}>
        {"→"}
      </span>
    </a>
  );
}

export function ArtifactsSurface() {
  const fetchArtifacts = useServerFn(listArtifacts);
  const q = useQuery({ queryKey: ["artifacts"], queryFn: () => fetchArtifacts() });
  const artifacts = useMemo(() => q.data?.artifacts ?? [], [q.data]);

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
          <p className="text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            {artifacts.length} in this workspace, newest first.
          </p>
          {artifacts.map((a) => (
            <ArtifactRow key={`${a.kind}:${a.id}`} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
