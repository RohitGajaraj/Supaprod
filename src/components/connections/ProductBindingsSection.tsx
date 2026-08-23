/**
 * PER-PRODUCT OVERRIDE. The most specific link in the credential chain:
 *   product binding > workspace binding > user connection > env fallback
 *
 * Rebuilt on the primitives 2026-07-29 alongside the rest of /sync. The old
 * shape was a bordered card of bordered rows with a green check glyph, an
 * inline select that appeared on click, and an icon-only X for the destructive
 * action. What it is now is one Line per resource, with the override named on
 * the second line, because an override that does not say what it overrides is
 * a setting nobody can audit.
 *
 * KILLED: the nested bordered containers, the CheckCircle2 glyph (the resource
 * name is the proof), the icon-only remove (a destructive action says what it
 * does in words), the animate-pulse skeleton, and the "Not connected" dead
 * text with no door. KEPT: every server function, the CreateRepoModal, and the
 * pick-then-bind flow.
 *
 * ADDED later the same night: the provider mark on each line. The CheckCircle2
 * that was killed above was a STATUS glyph saying a thing the resource name
 * already said; this is an IDENTITY mark saying which of twenty products the
 * line belongs to, which nothing else on the line says. Different jobs, and
 * only one of them was decoration.
 *
 * Only renders when this workspace has at least one connection: a per-product
 * override of nothing is a decision nobody can make.
 */
import { useState } from "react";
import { Line } from "@/components/meridian/rows";
import { Action, Actions, ReadFailedLine } from "@/components/meridian/surface-parts";
import { EmptyRegion } from "@/components/meridian/EmptyRegion";
import { LoadingState } from "@/components/meridian/LoadingState";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { CreateRepoModal } from "./CreateRepoModal";
import { ProviderName, UnderMark } from "@/components/meridian/source-marks";
import {
  listConnections,
  listProductBindings,
  addProductBinding,
  removeBinding,
  type BindingRow,
  type ConnectionRow,
} from "@/lib/connections.functions";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { Select } from "@/components/shell/primitives";
import { Region } from "@/components/meridian/surface-parts";

type Props = {
  projectId: string;
  workspaceId: string;
  projectName?: string;
};

export function ProductBindingsSection({ projectId, workspaceId, projectName }: Props) {
  const qc = useQueryClient();
  const [picking, setPicking] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fConnections = useServerFn(listConnections);
  const fBindings = useServerFn(listProductBindings);
  const fAdd = useServerFn(addProductBinding);
  const fRemove = useServerFn(removeBinding);

  const qConnections = useQuery({ queryKey: ["connections"], queryFn: () => fConnections() });
  const qBindings = useQuery({
    queryKey: ["product-bindings", projectId],
    queryFn: () => fBindings({ data: { projectId } }),
  });

  const connections = (qConnections.data?.connections ?? []) as ConnectionRow[];
  const bindings = (qBindings.data?.bindings ?? []) as BindingRow[];

  const mAdd = useMutation({
    mutationFn: (args: {
      connectionId: string;
      provider: string;
      resourceKind: string;
      resourceId: string;
      resourceLabel?: string;
    }) =>
      fAdd({
        data: {
          projectId,
          workspaceId,
          connectionId: args.connectionId,
          provider: args.provider,
          resourceKind: args.resourceKind,
          resourceId: args.resourceId,
          resourceLabel: args.resourceLabel,
        },
      }),
    onSuccess: () => {
      toast.success("Product binding saved");
      setPicking(null);
      qc.invalidateQueries({ queryKey: ["product-bindings", projectId] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Bind failed"),
  });

  const mRemove = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Override removed. This product falls back to the workspace binding.");
      qc.invalidateQueries({ queryKey: ["product-bindings", projectId] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Unbind failed"),
  });

  const providers = (Object.keys(CONNECTOR_REGISTRY) as ProviderId[])
    .map((id) => CONNECTOR_REGISTRY[id])
    .filter((spec) => spec.userFacing !== false && spec.resourceTypes.length > 0);

  const title = projectName ? `Just for ${projectName}` : "Just for this product";
  const isLoading = qConnections.isLoading || qBindings.isLoading;
  const failed = qConnections.isError || qBindings.isError;

  if (failed) {
    const err = (qConnections.error ?? qBindings.error) as Error | null;
    return (
      <Region title={title}>
        <ReadFailedLine
          onRetry={() => {
            void qConnections.refetch();
            void qBindings.refetch();
          }}
        >
          The overrides did not load. {err?.message ?? "The read failed."}
        </ReadFailedLine>
      </Region>
    );
  }

  if (isLoading) {
    return (
      <Region title={title}>
        <LoadingState label="Reading this product's overrides." />
      </Region>
    );
  }

  // An override of nothing is a decision nobody can make.
  if (connections.length === 0) return null;

  const hasGithub = connections.some((c) => c.provider === "github" && c.status === "connected");

  return (
    <Region
      title={title}
      sub={
        bindings.length === 0
          ? "Nothing overridden, so this product uses whatever the workspace is pointed at."
          : `${bindings.length} ${bindings.length === 1 ? "override" : "overrides"} in force. They win over the workspace binding above.`
      }
    >
      {providers.flatMap((spec) =>
        spec.resourceTypes.map((rt) => {
          const binding = bindings.find(
            (b) => b.provider === spec.id && b.resource_kind === rt.kind,
          );
          const connected = connections.filter(
            (c) => c.provider === spec.id && c.status === "connected",
          );
          const pickKey = `${spec.id}:${rt.kind}`;

          let sub: React.ReactNode;
          if (binding) {
            sub = (
              <>{binding.resource_label ?? binding.resource_id} · overrides the workspace default</>
            );
          } else if (connected.length > 0) {
            sub = "Follows the workspace default.";
          } else {
            sub = `${spec.label} has no connected account, so there is nothing to override with.`;
          }

          return (
            <Line
              key={pickKey}
              // Monochrome, same reason as the workspace list above: the subject
              // here is which binding wins, not which brand it belongs to.
              label={
                <ProviderName provider={spec.id}>
                  {`${spec.label} ${rt.label.toLowerCase()}`}
                </ProviderName>
              }
              sub={<UnderMark>{sub}</UnderMark>}
            >
              {binding ? (
                /* TIER: Action, destructive face - unlinks the override so the
                    product falls back to the workspace default. */
                <Action
                  variant="destructive"
                  busy={mRemove.isPending}
                  onClick={() => mRemove.mutate(binding.id)}
                >
                  {mRemove.isPending ? "Removing" : "Use the workspace one"}
                </Action>
              ) : picking === pickKey ? (
                <>
                  <Select
                    aria-label={`Pick the account for ${spec.label}`}
                    defaultValue=""
                    disabled={mAdd.isPending}
                    onChange={(e) => {
                      const conn = connected.find((c) => c.id === e.target.value);
                      if (!conn) return;
                      mAdd.mutate({
                        connectionId: conn.id,
                        provider: spec.id,
                        resourceKind: rt.kind,
                        resourceId: conn.account_label ?? conn.id,
                        resourceLabel: conn.account_label ?? undefined,
                      });
                    }}
                  >
                    <option value="" disabled>
                      Pick an account
                    </option>
                    {connected.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.account_label ?? c.id.slice(0, 8)}
                      </option>
                    ))}
                  </Select>
                  {/* TIER: clause 3, dismisses the picker; nothing is written. */}
                  <button
                    type="button"
                    className="rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
                    onClick={() => setPicking(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : connected.length > 0 ? (
                /* TIER: clause 3, reveals the picker; nothing is written. */
                <button
                  type="button"
                  className="rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
                  onClick={() => setPicking(pickKey)}
                >
                  Override it
                </button>
              ) : null}
            </Line>
          );
        }),
      )}

      {providers.length === 0 ? (
        <EmptyRegion title="No bindings yet">
          No connected source has anything this product could override.
        </EmptyRegion>
      ) : null}

      {hasGithub ? (
        <Actions>
          {/* TIER: clause 3, opens the repo-creation modal; nothing is written here. */}
          <button
            type="button"
            className="rounded-mrd-chip border border-mrd-line bg-mrd-lift px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover hover:text-mrd-ink"
            onClick={() => setShowCreateModal(true)}
          >
            Create a new GitHub repo
          </button>
        </Actions>
      ) : null}

      <CreateRepoModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        productId={projectId}
        workspaceId={workspaceId}
        productName={projectName}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["product-bindings", projectId] });
        }}
      />
    </Region>
  );
}
