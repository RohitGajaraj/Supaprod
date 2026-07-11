// Design (PC-31): the D-family station between Define and Build. Two panes:
// Brand Kit (design_memory, already a full engine -- DesignMemoryPanel is
// re-presented here as-is, one home instead of buried in Brain) and
// Prototypes (a spec's already-generated DEF-04 mockup, promoted into the
// prototypes/prototype_files family so it gets a name, a stable share_slug,
// and a public/private toggle -- the existing /p/$slug viewer lights up the
// moment a row lands there; it's already live, unmodified by this route).
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { DesignMemoryPanel } from "@/components/knowledge/DesignMemoryPanel";
import { listPrds } from "@/lib/discovery.functions";
import {
  listPrototypes,
  publishPrototypeFromPrd,
  togglePrototypeShare,
  type PrototypeSummary,
} from "@/lib/prototypes.functions";
import { toast } from "@/lib/notify";

function shareUrl(slug: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`;
}

function PrototypeRow({ proto }: { proto: PrototypeSummary }) {
  const qc = useQueryClient();
  const fToggle = useServerFn(togglePrototypeShare);
  const toggle = useMutation({
    mutationFn: (isPublic: boolean) => fToggle({ data: { id: proto.id, isPublic } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["prototypes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const copyLink = () => {
    void navigator.clipboard?.writeText(shareUrl(proto.shareSlug));
    toast.success("Share link copied");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {proto.name}
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "2px 0 0" }}>
          {proto.isPublic ? "Public" : "Private"} · updated{" "}
          {new Date(proto.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={() => toggle.mutate(!proto.isPublic)}
        disabled={toggle.isPending}
      >
        {proto.isPublic ? "Make private" : "Share"}
      </Button>
      {proto.isPublic ? (
        <Button variant="secondary" onClick={copyLink}>
          Copy link
        </Button>
      ) : null}
    </div>
  );
}

function PublishFromSpec() {
  const qc = useQueryClient();
  const [prdId, setPrdId] = useState<string>("");
  const fListPrds = useServerFn(listPrds);
  const fPublish = useServerFn(publishPrototypeFromPrd);

  const prds = useQuery({ queryKey: ["prds-for-prototype"], queryFn: () => fListPrds() });

  const publish = useMutation({
    mutationFn: () => fPublish({ data: { prdId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prototypes"] });
      toast.success("Published. Share it whenever you're ready.");
      setPrdId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const specs = prds.data?.prds ?? [];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 16px",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <select
        value={prdId}
        onChange={(e) => setPrdId(e.target.value)}
        style={{
          flex: 1,
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: 8,
          padding: "7px 10px",
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      >
        <option value="">Publish a prototype from a spec…</option>
        {specs.map((s) => (
          <option key={s.id as string} value={s.id as string}>
            {s.title as string}
          </option>
        ))}
      </select>
      <Button
        variant="secondary"
        onClick={() => publish.mutate()}
        disabled={!prdId || publish.isPending}
      >
        {publish.isPending ? "Publishing…" : "Publish"}
      </Button>
    </div>
  );
}

function PrototypesPane() {
  const fList = useServerFn(listPrototypes);
  const items = useQuery({ queryKey: ["prototypes"], queryFn: () => fList() });
  const rows = items.data ?? [];

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
      }}
    >
      <PublishFromSpec />
      {items.isLoading ? (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <MonoLabel>Loading</MonoLabel>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: "28px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
            No prototypes yet. Generate a mockup on any spec's page, then publish it here to get a
            shareable link.
          </p>
        </div>
      ) : (
        rows.map((p) => <PrototypeRow key={p.id} proto={p} />)
      )}
    </div>
  );
}

function DesignSurface() {
  return (
    <div
      style={{
        maxWidth: "var(--container-work, 1520px)",
        width: "100%",
        margin: "0 auto",
        padding: "36px 32px 64px",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.14em",
            color: "var(--text-subtle)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Loop · Design
        </div>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 430,
            fontSize: "var(--text-hero)",
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          Your <em style={{ fontStyle: "italic", color: "var(--ember)" }}>brand</em>, in every
          build.
        </h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-body)", margin: 0 }}>
          Import your brand once, then every mockup and prototype renders through it.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <section>
          <MonoLabel style={{ display: "block", marginBottom: 10 }}>Brand kit</MonoLabel>
          <DesignMemoryPanel />
        </section>
        <section>
          <MonoLabel style={{ display: "block", marginBottom: 10 }}>Prototypes</MonoLabel>
          <PrototypesPane />
        </section>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/design")({
  component: DesignSurface,
  head: () => ({ meta: [{ title: "Design · Cadence" }] }),
  errorComponent: ({ error }) => {
    console.error("[Design] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
          Could not load Design
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
