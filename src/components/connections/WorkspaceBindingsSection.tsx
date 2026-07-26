import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  listConnections,
  listWorkspaceBindings,
  removeBinding,
  type ConnectionRow,
  type WorkspaceBindingRow,
} from "@/lib/connections.functions";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { BindingPicker } from "@/components/connections/BindingPicker";
import { ProviderLogo } from "@/components/connections/ProviderLogo";
import { latestIso, relTimeCaps } from "@/components/discover/format";

/**
 * Workspace bindings: maps account-level connections to this workspace's
 * resources (which repo, team, database the agents act on). Each row is a
 * first-class object (design-anatomy §2): the provider brand mark, a plain
 * status pill, the bound resource with its account, a last-bound recency, and
 * one clear bind / unbind affordance. Rendered from CONNECTOR_REGISTRY, one row
 * per provider resource type; states are bound (pill + unbind) /
 * bound-but-reconnect-needed (madder pill) / connected-but-unbound (picker) /
 * not connected (calm Settings link). Obsidian tokens only, matched to /sync.
 */

/** A quiet status pill: a role-colored dot + mono-caps word. Matches the
 *  connected-accounts pill language (moss = live, madder = needs a human). */
function StatusPill({ tone, children }: { tone: "moss" | "madder"; children: string }) {
  const color = tone === "moss" ? "var(--moss)" : "var(--madder)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 5, height: 5, borderRadius: 99, background: color, flexShrink: 0 }}
      />
      {children}
    </span>
  );
}

export function WorkspaceBindingsSection() {
  const qc = useQueryClient();
  const fConnections = useServerFn(listConnections);
  const fBindings = useServerFn(listWorkspaceBindings);
  const fRemove = useServerFn(removeBinding);

  const qConnections = useQuery({ queryKey: ["connections"], queryFn: () => fConnections() });
  const qBindings = useQuery({
    queryKey: ["workspace-bindings"],
    queryFn: () => fBindings(),
  });
  const connections = (qConnections.data?.connections ?? []) as ConnectionRow[];
  const bindings = (qBindings.data?.bindings ?? []) as WorkspaceBindingRow[];

  const mUnbind = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Binding removed");
      qc.invalidateQueries({ queryKey: ["workspace-bindings"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Unbind failed"),
  });

  const providers = (Object.keys(CONNECTOR_REGISTRY) as ProviderId[])
    .map((id) => CONNECTOR_REGISTRY[id])
    .filter((spec) => spec.resourceTypes.length > 0);

  const isLoading = qConnections.isLoading || qBindings.isLoading;
  const hasError = qConnections.error || qBindings.error;

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 className="mono-label" style={{ margin: "0 0 4px", color: "var(--ink-subtle)" }}>
        Workspace bindings
      </h2>
      <p style={{ color: "var(--ink-subtle)", margin: "0 0 12px", maxWidth: 560 }}>
        Map your connected accounts to this workspace: which repo, team, or database the agents act
        on.
      </p>

      {isLoading ? (
        <div className="bento" style={{ padding: "var(--card-pad)", display: "grid", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 40,
                borderRadius: 8,
                background: "var(--surface-2)",
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : hasError ? (
        <div className="bento" style={{ padding: "var(--card-pad)" }}>
          <div className="mono-label" style={{ color: "var(--madder)" }}>
            Couldn't load workspace bindings
          </div>
          <p style={{ color: "var(--ink-muted)", margin: "8px 0 0" }}>
            {(qConnections.error as Error)?.message ??
              (qBindings.error as Error)?.message ??
              "Unknown error"}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => {
              qConnections.refetch();
              qBindings.refetch();
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          className="bento"
          style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          {providers.flatMap((spec, si) =>
            spec.resourceTypes.map((rt, ri) => {
              const isFirst = si === 0 && ri === 0;
              const binding = bindings.find(
                (b) => b.provider === spec.id && b.resource_kind === rt.kind,
              );
              const connection =
                connections.find((c) => c.provider === spec.id && c.status === "connected") ??
                connections.find((c) => c.provider === spec.id);
              const boundTime = binding
                ? latestIso([binding.updated_at, binding.created_at])
                : null;
              const healthy = binding?.connection_status === "connected";

              return (
                <div
                  key={`${spec.id}:${rt.kind}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--geist-space-3x)",
                    padding: "12px 16px",
                    borderTop: isFirst ? "none" : "1px solid var(--hairline)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-3x)", minWidth: 0 }}>
                    <ProviderLogo provider={spec.id} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                        {spec.label}
                      </div>
                      <div style={{ color: "var(--ink-subtle)" }}>{rt.label}</div>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
                    {binding ? (
                      <>
                        <div style={{ textAlign: "right", minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--geist-space-2x)",
                              justifyContent: "flex-end",
                            }}
                          >
                            <StatusPill tone={healthy ? "moss" : "madder"}>
                              {healthy ? "Bound" : "Reconnect needed"}
                            </StatusPill>
                          </div>
                          <div
                            style={{
                              color: "var(--ink)",
                              marginTop: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 260,
                            }}
                          >
                            {binding.resource_label ?? binding.resource_id}
                            <span style={{ color: "var(--ink-subtle)" }}>
                              {" "}
                              · via {binding.account_label ?? spec.label}
                              {binding.owner_display ? ` (${binding.owner_display})` : ""}
                            </span>
                          </div>
                          {boundTime ? (
                            <div
                              className="mono-label tabular-nums"
                              style={{ color: "var(--ink-faint)", marginTop: 2 }}
                            >
                              bound {relTimeCaps(boundTime)}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={mUnbind.isPending}
                          onClick={() => mUnbind.mutate(binding.id)}
                        >
                          Unbind
                        </button>
                      </>
                    ) : connection ? (
                      <BindingPicker
                        connectionId={connection.id}
                        resourceKind={rt.kind}
                        kindLabel={rt.label}
                      />
                    ) : (
                      <span style={{ color: "var(--ink-subtle)" }}>
                        Connect {spec.label} in{" "}
                        <Link
                          to="/settings"
                          search={{ section: "connections" }}
                          className="hover:underline"
                          style={{ color: "var(--link)" }}
                        >
                          Settings · Connections
                        </Link>{" "}
                        first
                      </span>
                    )}
                  </div>
                </div>
              );
            }),
          )}
        </div>
      )}
    </section>
  );
}
