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
import { TopBar } from "@/components/supaprod/TopBar";
import { PageHeader } from "@/components/supaprod/PageHeader";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import { DesignMemoryPanel } from "@/components/knowledge/DesignMemoryPanel";
import { SkeletonBar } from "@/components/discover/SkeletonBar";
import { listPrds } from "@/lib/discovery.functions";
import {
  listPrototypes,
  publishPrototypeFromPrd,
  togglePrototypeShare,
  type PrototypeSummary,
} from "@/lib/prototypes.functions";
import { toast } from "@/lib/notify";

/** PC-29 layer 2/4 (2026-07-17 repair pass): Design's one station agent -
 * ux-architect, just reassigned here from Define. Single-candidate list kept
 * for consistency with the other stations' STATION_AGENTS idiom. */
const DESIGN_STATION_AGENTS = ["ux-architect"];

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
            fontSize: 14,
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
        loading={toggle.isPending}
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
  // The select's placeholder does honest triple duty: loading, the
  // instructional empty state, and the ready prompt. An error never wears the
  // empty state's clothes; it gets its own line below with a retry.
  const placeholder = prds.isLoading
    ? "Loading your specs…"
    : specs.length === 0 && !prds.isError
      ? "No specs yet. Draft one in Plan first."
      : "Publish a prototype from a spec…";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 16px",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <select
          value={prdId}
          onChange={(e) => setPrdId(e.target.value)}
          aria-label="Spec to publish a prototype from"
          disabled={prds.isLoading || specs.length === 0}
          className="border outline-none transition-[border-color] [border-color:var(--hairline)] hover:enabled:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] disabled:opacity-60"
          style={{
            flex: 1,
            minWidth: 220,
            height: 36,
            background: "var(--card)",
            borderRadius: "var(--radius-control)",
            padding: "0 10px",
            fontSize: 14,
            color: "var(--text-primary)",
            cursor: prds.isLoading || specs.length === 0 ? "default" : "pointer",
          }}
        >
          <option value="">{placeholder}</option>
          {specs.map((s) => (
            <option key={s.id as string} value={s.id as string}>
              {s.title as string}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={() => publish.mutate()}
          loading={publish.isPending}
          disabled={!prdId}
          title={!prdId ? "Pick a spec first" : undefined}
        >
          Publish
        </Button>
      </div>
      {prds.isError ? (
        <div className="flex items-center" style={{ gap: 8 }}>
          <p style={{ fontSize: 12, color: "var(--madder)", margin: 0 }}>
            Could not load your specs. {(prds.error as Error).message}
          </p>
          <Button variant="tertiary" size="sm" onClick={() => prds.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
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
        // Skeleton rows matching the loaded row layout (name line, meta line),
        // never a dead blank or a bare "Loading".
        <div role="status" aria-label="Loading prototypes">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="grid gap-2"
              style={{
                padding: "12px 16px",
                borderBottom: i === 1 ? undefined : "1px solid var(--hairline)",
              }}
            >
              <SkeletonBar width="45%" height={13} />
              <SkeletonBar width="30%" height={10} />
            </div>
          ))}
        </div>
      ) : items.isError ? (
        // An error never wears the empty state's clothes: cause + one action.
        <div style={{ padding: "20px 16px" }}>
          <MonoLabel style={{ fontSize: "10.5px", color: "var(--madder)" }}>
            Could not load prototypes
          </MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "6px 0 0" }}>
            {(items.error as Error).message}
          </p>
          <Button variant="secondary" style={{ marginTop: 12 }} onClick={() => items.refetch()}>
            Retry
          </Button>
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
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  // PC-29 layer 2 (2026-07-17): shared cache with FleetView's "By Agent" tab
  // and every other station header (same queryKey pattern). Scoped by
  // workspaceId so switching workspaces doesn't show another workspace's
  // agent activity.
  const fFleet = useServerFn(getAgentFleet);
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const presenceAgent = fleet.data?.fleet.agents.find((a) =>
    DESIGN_STATION_AGENTS.includes(a.slug),
  );
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Design"]} />
      <div
        style={{
          maxWidth: "var(--container-work, 1520px)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--page-inset-v) var(--page-inset-h) 64px",
        }}
      >
        <PageHeader
          title="Your brand, in every"
          accent="build."
          subtitle="Import your brand once, then every mockup and prototype renders through it."
          usp="One brand kit flows into every generated build, so what agents ship already looks like you."
        />
        {presenceAgent ? (
          <div style={{ marginBottom: 14 }}>
            <PresenceChip
              agentSlug={presenceAgent.slug}
              station="design"
              state={presenceAgent.state === "working" ? "working" : "idle"}
              lastActedAt={presenceAgent.lastActiveAt}
            />
          </div>
        ) : null}
        {/* PC-29 layer 4: the inline relay, live only while Design has a run
          going (e.g. a prototype generation in progress). */}
        <AgentRelay variant="station" station="design" workspaceId={activeWorkspaceId} />

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
    </>
  );
}

export const Route = createFileRoute("/_authenticated/design")({
  component: DesignSurface,
  head: () => ({ meta: [{ title: "Design · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Design] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel style={{ fontSize: "10.5px", color: "var(--madder)" }}>
          Could not load Design
        </MonoLabel>
        <p style={{ fontSize: "var(--tempo-text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
