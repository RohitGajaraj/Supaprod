import { Link } from "@tanstack/react-router";
import { Line } from "@/components/meridian/rows";
import { Action, Num, ReadFailedLine } from "@/components/meridian/surface-parts";
import { EmptyRegion } from "@/components/meridian/EmptyRegion";
import { LoadingState } from "@/components/meridian/LoadingState";
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
import { humanWriteError } from "@/lib/roles.functions";
import { BindingPicker } from "@/components/connections/BindingPicker";
import { ProviderName, UnderMark } from "@/components/meridian/source-marks";
import { latestIso, relTimeCaps } from "@/components/discover/format";
import { Region } from "@/components/meridian/surface-parts";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";

/**
 * WORKSPACE BINDINGS. What each connected source is actually pointed at.
 *
 * Rebuilt on the primitives 2026-07-29. The old shape was a bordered card
 * holding one bordered row per provider resource, each with a 28px brand tile,
 * a coloured status pill, a right-aligned three-line stack and a button: five
 * pieces of chrome to say one fact. What it says now is a sentence with the
 * control at the end of it, because a binding is a boundary you set and the
 * governance canon says a boundary is a sentence, not a panel.
 *
 * KILLED, and what each cost:
 *   - The 28px ProviderLogo tile. Ban 8: the decoration was taller than the
 *     line it introduced, and the provider's name is right beside it. (The
 *     provider is RECOGNISABLE again as of the same night, with a drawn mark
 *     inline at the size of its label rather than a tile taller than it. The
 *     ban was on the container, never on the identity.)
 *   - The moss/madder status pill. "Bound" under a heading that says bindings
 *     is the redundancy ban; the resource name IS the proof it is bound. Red
 *     survives for the one state a person must act on: bound, but the
 *     connection behind it stopped reading.
 *   - The bordered card and the per-row borders. One bordered container per
 *     region, and a rule already divides Lines.
 *   - The animate-pulse skeletons. Motion that carries no information, and the
 *     system now has a Loading primitive that says so in words instead.
 *
 * KEPT: every server function, query key and state. Four states per resource,
 * unchanged: bound / bound-but-not-reading / connected-and-unbound / not
 * connected. Attribution is now on the line (`bound by`), because a binding is
 * the reach the crew acts through and an unattributed one is a surface
 * pretending the work did itself.
 */

export function WorkspaceBindingsSection() {
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const fConnections = useServerFn(listConnections);
  const fBindings = useServerFn(listWorkspaceBindings);
  const fRemove = useServerFn(removeBinding);

  const qConnections = useQuery({ queryKey: ["connections"], queryFn: () => fConnections() });
  const qBindings = useQuery({
    /* P-75: the key and the call both name the workspace, or one cache entry
       is shared across every workspace a person holds and Sources names another
       desk's repository as something this one may read. */
    queryKey: ["workspace-bindings", activeWorkspaceId ?? null],
    queryFn: () => fBindings({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  const connections = (qConnections.data?.connections ?? []) as ConnectionRow[];
  const bindings = (qBindings.data?.bindings ?? []) as WorkspaceBindingRow[];

  const mUnbind = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Binding removed");
      qc.invalidateQueries({ queryKey: ["workspace-bindings"] });
    },
    onError: (e: unknown) => toast.error(humanWriteError(e, "Unbind failed")),
  });

  /*
   * ── THIS ONE HAS NOTHING TO FALL BACK TO ─────────────────────────────────
   *
   * `ProductBindingsSection` runs the same server function and deliberately
   * does NOT ask, because there the removal is a FALLBACK: its own label says
   * "Use the workspace one", and the product lands on the workspace binding. A
   * question there would be friction guarding nothing.
   *
   * A workspace binding is the bottom of that chain. The comment on the control
   * below already says what it is -- "unbinds the resource the crew acts
   * through, a removal on the credential chain" -- and `removeBinding` is a hard
   * `DELETE` on `connection_bindings`, so there is no layer underneath and
   * nothing to inherit. The crew stops being able to reach that resource, and
   * work already in flight finds it gone.
   *
   * `useConfirm` is the established destructive question on 32 surfaces, and
   * `MembersCard` sets the wording: name the thing, speak in second person, put
   * what cannot be walked back last.
   */
  const confirm = useConfirm();
  const askThenUnbind = async (id: string, what: string) => {
    const ok = await confirm({
      title: `Unbind ${what}?`,
      body: `The crew reaches this through the binding, so it stops being able to act on it the moment you confirm, including work that is running right now. Nothing is deleted where it lives and the connection itself stays. Pointing at it again means choosing the resource from scratch.`,
      confirmLabel: "Unbind it",
      destructive: true,
    });
    if (ok) mUnbind.mutate(id);
  };

  // Only providers that HAVE something to point at. A source with no resource
  // types (Stripe, Zendesk) has nothing to bind, so drawing a row for it would
  // be drawing a decision nobody can make.
  const providers = (Object.keys(CONNECTOR_REGISTRY) as ProviderId[])
    .map((id) => CONNECTOR_REGISTRY[id])
    .filter((spec) => spec.userFacing !== false && spec.resourceTypes.length > 0);

  const isLoading = qConnections.isLoading || qBindings.isLoading;
  const failed = qConnections.isError || qBindings.isError;

  const boundCount = bindings.length;
  const notReading = bindings.filter((b) => b.connection_status !== "connected").length;

  return (
    <Region
      title="What each source is pointed at"
      sub={
        isLoading || failed
          ? undefined
          : boundCount === 0
            ? "Nothing is pointed anywhere yet, so the crew reads a source but acts on nothing inside it."
            : notReading > 0
              ? `${boundCount} pointed. ${notReading} stopped reading because the connection behind it needs attention.`
              : `${boundCount} pointed, all reading.`
      }
    >
      {failed ? (
        <ReadFailedLine
          error={qConnections.error ?? qBindings.error}
          onRetry={() => {
            void qConnections.refetch();
            void qBindings.refetch();
          }}
        >
          The bindings did not load.
        </ReadFailedLine>
      ) : isLoading ? (
        <LoadingState label="Reading what each source is pointed at." />
      ) : (
        providers.flatMap((spec) =>
          spec.resourceTypes.map((rt) => {
            const binding = bindings.find(
              (b) => b.provider === spec.id && b.resource_kind === rt.kind,
            );
            const connection =
              connections.find((c) => c.provider === spec.id && c.status === "connected") ??
              connections.find((c) => c.provider === spec.id);
            const boundTime = binding ? latestIso([binding.updated_at, binding.created_at]) : null;
            const healthy = binding?.connection_status === "connected";

            let sub: React.ReactNode;
            if (binding) {
              sub = (
                <>
                  {binding.resource_label ?? binding.resource_id}
                  {healthy ? null : (
                    <>
                      {" · "}
                      <span className="sp-fail">not reading</span>
                    </>
                  )}
                  {binding.account_label ? <> · via {binding.account_label}</> : null}
                  {binding.owner_display ? <> · bound by {binding.owner_display}</> : null}
                  {boundTime ? (
                    <>
                      {" · "}
                      <Num>{relTimeCaps(boundTime).toLowerCase()}</Num>
                    </>
                  ) : null}
                </>
              );
            } else if (connection) {
              sub = `Connected, but no ${rt.label.toLowerCase()} chosen. The crew can see the account and nothing inside it.`;
            } else {
              sub = `${spec.label} is not connected, so there is nothing to point yet.`;
            }

            return (
              <Line
                key={`${spec.id}:${rt.kind}`}
                // Monochrome: the subject of this line is where the source is
                // POINTED and whether it is still reading, not the brand.
                label={
                  <ProviderName provider={spec.id}>
                    {`${spec.label} ${rt.label.toLowerCase()}`}
                  </ProviderName>
                }
                sub={<UnderMark>{sub}</UnderMark>}
              >
                {binding ? (
                  /* TIER: Action, destructive face - unbinds the resource the
                    crew acts through, a removal on the credential chain. */
                  <Action
                    variant="destructive"
                    busy={mUnbind.isPending}
                    onClick={() =>
                      void askThenUnbind(binding.id, `${spec.label} ${rt.label.toLowerCase()}`)
                    }
                  >
                    Unbind
                  </Action>
                ) : connection ? (
                  <BindingPicker
                    connectionId={connection.id}
                    resourceKind={rt.kind}
                    kindLabel={rt.label}
                  />
                ) : (
                  <Link
                    to="/settings"
                    search={{ section: "connections", connector: spec.id }}
                    className="rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
                    style={{ textDecoration: "none" }}
                  >
                    Connect it
                  </Link>
                )}
              </Line>
            );
          }),
        )
      )}

      {!failed && !isLoading && providers.length === 0 ? (
        <EmptyRegion title="Nothing to point at yet">
          No source in the catalog has anything to point at yet.
        </EmptyRegion>
      ) : null}
    </Region>
  );
}
