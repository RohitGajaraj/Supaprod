/**
 * THE ASK-IN-PLACE CONNECT CONTROL (SPEC-CONNECTORS.md §5 rule 4, §7).
 *
 * A station needs a source it does not have. Instead of sending the person to
 * browse a shelf of connectors, the surface says so in one sentence and offers
 * the connect control right there. Discover finding nothing, Decide missing a
 * metric to read, Ship with nowhere to post a digest - each embeds this with
 * its need named in plain words.
 *
 * WHAT IT REUSES, AND WHY THERE IS NO SECOND CONNECT PATH HERE:
 *   - `useConnectorActions`, extracted verbatim from AccountConnectionsSection,
 *     drives every auth shape (GitHub App install, native OAuth new-tab +
 *     parent-tab poll, gateway popup, the Google/Microsoft suite).
 *   - `ConnectTrustDialog` is the trust interstitial, unchanged; its copy is
 *     contract, not ours to reword.
 *   - `listConnections` shares the ["connections"] query key with Settings and
 *     /sync, so satisfaction detection costs no second fetch and the control
 *     disappears the moment any tab's callback lands.
 *
 * SAD PATHS (R-20): a read failure says so and offers retry rather than
 * rendering nothing; a provider whose OAuth app nobody registered simply does
 * not render as an option (the catalogue's own honesty rule), so the ask never
 * dead-ends on a button that cannot work; while connecting, the buttons
 * disable rather than double-fire.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Actions, Action, ReadFailedLine, Reading } from "@/components/meridian/surface-parts";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { listConnections } from "@/lib/connections.functions";
import { ConnectTrustDialog } from "./ConnectTrustDialog";
import { SUITE_PROVIDERS, useConnectorActions } from "./useConnectorActions";
import { ProviderLogo } from "./ProviderLogo";

export function AskInPlace({
  need,
  why,
  suggest,
  satisfiedByEnv = true,
}: {
  /** What is missing, in the words the surface would say anyway: "an issue
   *  tracker", "somewhere to read the metric". Not a product name. */
  need: string;
  /** One line naming THIS situation, not connectors in general. */
  why?: string;
  /** Providers that would satisfy the need, best first. Three renders well;
   *  the rest are one click away on the Connections page. */
  suggest: ProviderId[];
  /** Whether an admin-managed env credential counts as satisfied. True by
   *  default: Supaprod is already reading through it, so asking would be a
   *  lie about what the crew can reach. */
  satisfiedByEnv?: boolean;
}) {
  const qc = useQueryClient();
  const actions = useConnectorActions(qc);
  const fList = useServerFn(listConnections);
  const list = useQuery({ queryKey: ["connections"], queryFn: () => fList() });

  const [trustFor, setTrustFor] = useState<ProviderId | null>(null);

  const connectedOrActive = useMemo(() => {
    const availability = list.data?.providerAvailability;
    const byId = new Map((list.data?.connections ?? []).map((c) => [c.provider, c]));
    return (id: ProviderId): boolean => {
      const row = byId.get(id);
      if (row && row.status === "connected") return true;
      if (satisfiedByEnv && availability?.[id]?.envConfigured) return true;
      return false;
    };
  }, [list.data, satisfiedByEnv]);

  const satisfied = useMemo(
    () => suggest.some(connectedOrActive),
    [suggest, connectedOrActive],
  );

  /** Only providers whose OAuth app somebody actually registered render as
   *  options - the same fact the catalogue's "not yet available" state reads. */
  const connectable = useMemo(
    () =>
      suggest.filter((id) => {
        if (connectedOrActive(id)) return false;
        const spec = CONNECTOR_REGISTRY[id];
        const m = spec?.authMethods[0];
        const a = list.data?.providerAvailability?.[id];
        if (!m || !a) return false;
        if (m.kind === "github_app") return !!a.githubAppConfigured;
        if (m.kind === "oauth_gateway") return !!a.gatewayConfigured;
        if (m.kind === "oauth_native") return !!a.nativeOAuthConfigured;
        return false;
      }),
    [suggest, connectedOrActive, list.data],
  );

  // The control's whole job is to disappear. A satisfied need renders nothing,
  // so the host surface keeps exactly the space it had before the ask.
  if (list.isSuccess && satisfied) return null;

  if (list.isError) {
    return (
      <ReadFailedLine onRetry={() => void list.refetch()}>
        Could not check what this workspace can already read, so connecting here is paused.{" "}
        {(list.error as Error)?.message ?? "The read failed."}
      </ReadFailedLine>
    );
  }

  if (list.isLoading) {
    return <Reading>Checking what this workspace can already read.</Reading>;
  }

  const start = (id: ProviderId) => {
    const suite = SUITE_PROVIDERS[id];
    if (suite) {
      actions.mSuite.mutate({ provider: suite.provider, product: suite.product });
      return;
    }
    const spec = CONNECTOR_REGISTRY[id];
    const kind = spec.authMethods[0]?.kind;
    if (kind === "github_app") actions.mGithub.mutate();
    else if (kind === "oauth_gateway") actions.mGateway.mutate(spec);
    else actions.mNative.mutate(spec);
    setTrustFor(null);
  };

  const label = (id: ProviderId) => CONNECTOR_REGISTRY[id]?.label ?? id;

  return (
    <div>
      <p className="text-mrd-body">
        {why ? (
          <>
            {why}{" "}
          </>
        ) : null}
        This needs {need}. Connect one and the work picks up from here; you do not have to go
        looking afterwards.
      </p>
      <Actions>
        {connectable.slice(0, 3).map((id) => (
          <Action
            key={id}
            variant={id === connectable[0] ? "default" : "quiet"}
            busy={actions.busy}
            title={`Connecting opens ${label(id)}.`}
            onClick={() => setTrustFor(id)}
          >
            <span className="inline-flex items-center gap-mrd-3">
              <ProviderLogo provider={id} size={14} />
              {label(id)}
            </span>
          </Action>
        ))}
        <Link
          to="/settings"
          search={{ section: "connections" }}
          className="text-mrd-mute underline decoration-mrd-line underline-offset-2 hover:text-mrd-body"
        >
          More sources
        </Link>
      </Actions>
      {connectable.length === 0 ? (
        <p className="mt-mrd-4 text-mrd-faint">
          None of these can be connected from here yet, so the source page is the way in.
        </p>
      ) : null}

      <ConnectTrustDialog
        provider={trustFor}
        label={trustFor ? label(trustFor) : ""}
        open={trustFor !== null}
        onOpenChange={(open) => {
          if (!open) setTrustFor(null);
        }}
        busy={actions.busy}
        onContinue={() => {
          if (trustFor) start(trustFor);
        }}
      />
    </div>
  );
}
