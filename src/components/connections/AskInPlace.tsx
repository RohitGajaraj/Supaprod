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
import {
  ACTION_LINK_FACE,
  Actions,
  Action,
  ReadFailedLine,
  Reading,
} from "@/components/meridian/surface-parts";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { listConnections } from "@/lib/connections.functions";
import { ConnectTrustDialog } from "./ConnectTrustDialog";
import { SUITE_PROVIDERS, useConnectorActions } from "./useConnectorActions";
import { ProviderLogo } from "./ProviderLogo";

/**
 * WHERE "FINISH IT IN SETTINGS" ACTUALLY LANDS (P-44, A-QUEUE.md).
 *
 * It said Settings and pointed at `/settings?section=connections`, which is
 * the ACCOUNT list -- AccountConnectionsSection's own header names the door
 * to the thing this sentence is asking for: "Changing a binding... live on
 * /sync." A connection existing is exactly the fact this branch has already
 * established (`connectedButNotEnough`); the door it drew sent a person back
 * to reconnect an account that was never the problem, and the actual binding
 * picker they needed was one surface over.
 *
 * `/sync` reads its product-scoped section from the workspace switcher's
 * `activeProductId`, not from a URL -- so without `product`, landing here
 * from a run whose product differs from whatever the switcher shows would
 * repeat the same defect one level down: right surface, wrong product
 * preselected. Passed only when the caller has it (a run's own
 * `spine_tracks.product_id`); omitted rather than guessed.
 */
export function bindingDoorTarget(productId?: string | null): {
  to: "/sync";
  search: { product?: string };
} {
  return { to: "/sync", search: productId ? { product: productId } : {} };
}

export function AskInPlace({
  need,
  why,
  suggest,
  satisfiedByEnv = true,
  needIsMet,
  productId,
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
  /**
   * THE CALLER'S OWN TEST OF WHETHER THE NEED IS ACTUALLY SERVED, for the
   * surfaces where a connected connector is not the same fact.
   *
   * ── WHY THIS PROP EXISTS, AND IT IS A REPORTED DEFECT ──────────────────
   * S1 mounted this component on a held Build station, which is the exact
   * situation it was written for, and **it rendered nothing.** Their note in
   * `track/TrackRun.tsx` diagnoses it exactly: this component decided the need
   * was met by asking whether a CONNECTOR EXISTS, while that station's blocker
   * was `canDispatchToRepo` failing because no repository RESOLVES, most often
   * a credential that is present with no repo bound to the workspace. **So the
   * two disagreed precisely where it mattered: the control concluded the need
   * was satisfied and hid itself at the moment the station could not proceed.**
   * They reverted to a hand-rolled row rather than patch somebody else's file,
   * which was the right call, and it left this component with zero mounts.
   *
   * Undefined keeps the original behaviour byte for byte, so nothing that ever
   * relied on connector-existence changes. Passing `false` says "I have a
   * sharper test than you do and it says no", and the control stops hiding.
   */
  needIsMet?: boolean;
  /**
   * This run's own product (`spine_tracks.product_id`), so the door on a
   * connected-but-unbound need lands on `/sync` with the RIGHT product
   * preselected rather than whatever the workspace switcher happens to show
   * (P-44, A-QUEUE.md). Undefined where the caller has none.
   */
  productId?: string | null;
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

  /**
   * IS A CONNECTOR THERE. This is a fact about the workspace's credentials and
   * nothing more, which is the distinction the defect above turned on.
   */
  const connectorPresent = useMemo(
    () => suggest.some(connectedOrActive),
    [suggest, connectedOrActive],
  );

  /**
   * IS THE NEED SERVED. The caller's answer wins when it has one, because it
   * ran the same resolution the work will run and this component did not.
   */
  const satisfied = needIsMet ?? connectorPresent;

  /**
   * THE STATE THAT USED TO BE INVISIBLE: connected, and still not enough.
   *
   * Connecting again fixes nothing here, so offering the connect buttons would
   * be worse than the silence it replaces. The rest of the fix is a binding,
   * and `/sync` is where that lives (P-44, A-QUEUE.md; see `bindingDoorTarget`
   * above) -- not Settings, which only lists accounts.
   */
  const connectedButNotEnough = needIsMet === false && connectorPresent;

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
      <ReadFailedLine error={list.error} onRetry={() => void list.refetch()}>
        Could not check what this workspace can already read, so connecting here is paused.
      </ReadFailedLine>
    );
  }

  if (list.isLoading) {
    return <Reading>Checking what this workspace can already read.</Reading>;
  }

  /*
   * CONNECTED, AND STILL NOT ENOUGH.
   *
   * This branch is the whole reason `needIsMet` exists. It renders BEFORE the
   * connect buttons and instead of them, because every button below would start
   * an authorisation the person has already completed. A control that offers
   * the half of the fix that is already done is worse than the silence it
   * replaces: it reads as "you did it wrong" when they did it right.
   *
   * NO SECOND DOOR TO A THIRD PLACE, and it used to be one: this branch sent a
   * person to Settings, which only lists accounts, when the actual fix -- the
   * bind -- lives on `/sync` (P-44, A-QUEUE.md). One door, and it goes where
   * the thing it names actually happens.
   */
  if (connectedButNotEnough) {
    const target = bindingDoorTarget(productId);
    return (
      <div>
        <p className="text-mrd-body">
          {why ? <>{why} </> : null}
          This needs {need}, and the connection for it is already here, so connecting again would
          change nothing. What is missing is which one this work should use.
        </p>
        <Actions>
          <Link to={target.to} search={target.search} className={ACTION_LINK_FACE.default}>
            Finish it on Sync
          </Link>
        </Actions>
      </div>
    );
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
        {why ? <>{why} </> : null}
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
