import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { CONNECTOR_REGISTRY, type ProviderId, type ProviderSpec } from "@/lib/connectors/registry";
import {
  buildConnectorCatalog,
  type CatalogEntry,
  type ConnectorCategory,
} from "@/lib/connectors/catalog";
import {
  listConnections,
  listWorkspaceBindings,
  saveGatewayConnection,
  startGatewayConnect,
  startGithubAppConnect,
  startNativeOAuthConnect,
  requestConnector,
  verifyConnection,
  verifyEnvCredential,
  disconnectConnection,
  deleteConnection,
  type ConnectionRow as AccountConnection,
  type ProviderAvailability,
} from "@/lib/connections.functions";
import {
  listMySuiteConnections,
  startSuiteConnect,
  disconnectSuiteConnection,
  type SuiteProduct,
  type SuiteProvider,
} from "@/lib/calendar-connections.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import { useConfirm } from "@/hooks/use-confirm";
import { useConnectPoll } from "@/hooks/use-connect-poll";
import { useWorkspace } from "@/hooks/use-workspace";
import { ConnectTrustDialog } from "./ConnectTrustDialog";
import { latestIso, relTimeCaps } from "@/components/discover/format";
import {
  Actions,
  Block,
  Button,
  Empty,
  Failed,
  Input,
  Line,
  Num,
  PageHead,
  Row,
} from "@/components/shell/primitives";

/**
 * Sources. The account-level connect surface, inside Settings.
 *
 * PORTED 2026-07-29 onto the rebuild primitives. What the port decided, and
 * why, because the shape changed and the reasons must survive it:
 *
 * A SOURCE IS A BOUNDARY YOU SET, so it renders as a Line: what it is on the
 * left, the one control that changes it on the right, divided from its
 * neighbour by a rule. It is not a card. The old surface drew a two-pane
 * console (a 210px filter rail plus a grid of bordered per-provider cards)
 * inside a region that was already a Block, which is a card inside a region,
 * and forty of them at once. Governance canon: policy is set in advance and
 * does not block, so a boundary reads as a sentence with a control at the end
 * of it, never as a panel demanding attention.
 *
 * KILLED, and what each cost:
 *   - The panel masthead ("Connect what you already use" plus its sub). The
 *     route already titles this surface with PageHead; a second heading inside
 *     it doubles the heading grammar.
 *   - The bordered card per provider, and the card shell around the error and
 *     the request box. One bordered container per region, maximum.
 *   - The left rail. Search survives as one input; Connected/All survive as two
 *     text tabs; the ten categories stop being ten filters and become quiet
 *     group labels down the list, which keeps the information and removes the
 *     facet wall.
 *   - The green Connected/Active pills. The row says "Connected as <account>",
 *     which is the same fact plus the one that was missing (WHICH account), and
 *     the interface stays monochrome. Colour is kept for the exception: a
 *     connection that stopped authorising reads red, because that is an outcome
 *     the reader has to act on.
 *   - The 34px provider logo tile. Ban 8, and the rebuild has no source-mark
 *     primitive to replace it with.
 *   - The vendor-neutrality paragraph. Three sentences of positioning in a
 *     settings rail is not what anyone came here for.
 *   - The skeleton card block and the disabled "Connect" button on a provider
 *     nobody can connect. A disabled primary is an affordance that lies.
 *
 * Every server function, query key, mutation and exported prop is untouched.
 *
 * WHAT IS STILL TRUE. Four states per provider, resolved by statusFor():
 * connected (a real account row or suite account), env-active (an admin-managed
 * workspace token Supaprod already reads through, so there is nothing for THIS
 * user to connect), OAuth-configured (a real Connect flow), and not yet
 * available. GitHub uses the App install redirect; native OAuth providers open
 * their own consent screen in a new tab; Canny is the last one on the
 * (effectively dead) Lovable gateway popup. The Google/Microsoft suite is
 * multi-account so it connects through user_calendar_connections rather than
 * the single-connection-per-provider connections table, with the same UX.
 * Per-connection management lives in the ConnectorDetail drill below;
 * workspace-level resource bindings live on /sync. Anchorable via
 * /settings?section=connections.
 */

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

// Registry providers backed by the multi-account suite-connections layer
// (stored in user_calendar_connections, native OAuth - not the single-
// connection-per-provider connections table). SW-7: extended beyond
// calendar to also cover Gmail/Outlook Mail, same table, a "product" column.
const SUITE_PROVIDERS: Partial<
  Record<ProviderId, { provider: SuiteProvider; product: SuiteProduct }>
> = {
  google_calendar: { provider: "google", product: "calendar" },
  gmail: { provider: "google", product: "mail" },
  google_tasks: { provider: "google", product: "tasks" },
  microsoft_outlook: { provider: "microsoft", product: "calendar" },
  microsoft_mail: { provider: "microsoft", product: "mail" },
};

function setupHintFor(spec: ProviderSpec): string {
  if (spec.setupHint) return spec.setupHint;
  const m = spec.authMethods.find((x) => x.kind === "oauth_gateway");
  return m && m.kind === "oauth_gateway"
    ? `Register the ${spec.label} OAuth app and add ${m.clientIdEnv} to the backend secrets.`
    : `Admin setup pending for ${spec.label}.`;
}

/** Env-configured per listConnections' providerAvailability - shared by the list rows and ConnectorDetail. */
function providerConfigured(
  spec: ProviderSpec,
  availability: ProviderAvailability | undefined,
): boolean {
  const a = availability?.[spec.id];
  const m = spec.authMethods[0];
  if (!m || !a) return false;
  if (m.kind === "github_app") return !!a.githubAppConfigured;
  if (m.kind === "oauth_gateway") return !!a.gatewayConfigured;
  if (m.kind === "oauth_native") return !!a.nativeOAuthConfigured;
  return false; // legacy api_key - OAuth migration pending, treat as setup-required
}

/** True when the provider's admin-managed env-fallback token is set: Supaprod
 *  is already reading through it even with no per-user OAuth connection, so
 *  the UI must show it as active rather than "coming soon" (founder ruling
 *  2026-07-06). Shared by the list line and ConnectorDetail's third state so
 *  both surfaces agree on what "active" means. */
function providerEnvActive(
  spec: ProviderSpec,
  availability: ProviderAvailability | undefined,
): boolean {
  return !!availability?.[spec.id]?.envConfigured;
}

/** "3D AGO" is the retired system's caps grammar. Lower case reads as a fact
 *  rather than a label, and the number sits in Num like every other number. */
function ago(iso: string): string {
  return relTimeCaps(iso).toLowerCase();
}

/**
 * The connect/verify flows, shared between the sources list and the
 * ConnectorDetail drill-down (one implementation, two surfaces). GitHub is
 * a full-page App-install redirect; gateway providers and calendars use the
 * connector-gateway popup (web_message) and persist only the connection id.
 */
function useConnectorActions(qc: QueryClient) {
  const fStartGithub = useServerFn(startGithubAppConnect);
  const fStartGateway = useServerFn(startGatewayConnect);
  const fSaveGateway = useServerFn(saveGatewayConnection);
  const fStartNative = useServerFn(startNativeOAuthConnect);
  const fVerify = useServerFn(verifyConnection);
  const fStartSuite = useServerFn(startSuiteConnect);

  const startConnectionsPoll = useConnectPoll(["connections"]);
  const startCalendarPoll = useConnectPoll(["calendar-connections"]);

  const mGithub = useMutation({
    mutationFn: () => fStartGithub(),
    onSuccess: ({ installUrl }) => {
      // Open GitHub in a new tab so the user keeps their place in the app.
      // The callback writes to the DB; the parent tab detects it via polling.
      window.open(installUrl, "_blank", "noopener");
      startConnectionsPoll();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  // Native OAuth (SW-7): Supaprod's own registered app. Same mechanics as
  // mGithub: a new tab (not a same-tab redirect), so the callback's
  // close-tab page actually closes something and the Settings tab keeps
  // polling for the new connection instead of being navigated away.
  const mNative = useMutation({
    mutationFn: (spec: ProviderSpec) => fStartNative({ data: { provider: spec.id } }),
    onSuccess: ({ authorizeUrl }) => {
      window.open(authorizeUrl, "_blank", "noopener");
      startConnectionsPoll();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  // Gateway OAuth popup - same client mechanics as the calendar connect flow:
  // open the popup first (so it isn't blocked), start the web_message OAuth
  // session server-side, then wait for the gateway's postMessage. On success
  // we persist only the gateway connection id - never a token.
  const mGateway = useMutation({
    mutationFn: async (spec: ProviderSpec) => {
      const method = spec.authMethods.find((m) => m.kind === "oauth_gateway");
      if (!method || method.kind !== "oauth_gateway") {
        throw new Error(`${spec.label} does not support OAuth connect yet.`);
      }
      const result = await connectAppUser({
        connectorId: method.connectorId,
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: (targetOrigin) => fStartGateway({ data: { provider: spec.id, targetOrigin } }),
      });
      if (!result.success || !result.connectionId) {
        throw new Error(result.error ?? "Connect failed");
      }
      return fSaveGateway({ data: { provider: spec.id, connectionId: result.connectionId } });
    },
    onSuccess: () => {
      toast.success("Connected");
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  // Suite connect (SW-7): native OAuth, same new-tab+poll mechanics as
  // mNative/mGithub - Google/Microsoft's own consent screen, not a gateway
  // popup. Multi-account (a user can connect several accounts of the same
  // product), so success just invalidates the list; there is no separate
  // "save" step, the callback route writes the connection directly.
  const mSuite = useMutation({
    mutationFn: (args: { provider: SuiteProvider; product: SuiteProduct }) =>
      fStartSuite({ data: args }),
    onSuccess: ({ authorizeUrl }) => {
      window.open(authorizeUrl, "_blank", "noopener");
      startCalendarPoll();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mVerify = useMutation({
    mutationFn: (id: string) => fVerify({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) toast.success("Connection verified");
      else toast.error(r.connection.status_detail ?? "Verification failed");
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy =
    mGithub.isPending ||
    mGateway.isPending ||
    mNative.isPending ||
    mSuite.isPending ||
    mVerify.isPending;

  return { mGithub, mGateway, mNative, mSuite, mVerify, busy };
}

// Per-provider status the list renders and the tabs count.
type CardStatus = "connected" | "active" | "connect" | "soon";

/** The category label that heads a run of sources. A label, not a heading: the
 *  surface is already titled, and a second heading grammar inside it is the
 *  defect the port was called to remove. */
function GroupLabel({ children, count }: { children: string; count: number }) {
  return (
    <div
      style={{
        marginTop: "var(--sp-space-8)",
        marginBottom: "var(--sp-space-2)",
        fontSize: "var(--sp-text-label)",
        fontWeight: "var(--sp-weight-medium)",
        color: "var(--sp-mute)",
      }}
    >
      {children} <Num>{count}</Num>
    </div>
  );
}

export function AccountConnectionsSection({
  onOpenDetail,
}: {
  /** Opens the ConnectorDetail drill-down; the route navigates with ?connector=. */
  onOpenDetail: (provider: ProviderId) => void;
}) {
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();

  // RPT-02 - the trust card interstitial: set to a spec to show it, null to
  // hide. The real connect only fires from the dialog's Continue button.
  const [trustFor, setTrustFor] = useState<ProviderSpec | null>(null);

  // One-time toast after the GitHub App full-redirect callback, then strip the
  // params so a refresh doesn't re-toast. Read from window.location directly:
  // the callback redirect is a full page load and the route's validateSearch
  // only passes `section` through.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (!connected && !error) return;
    if (connected === "github") toast.success("GitHub connected");
    else if (connected === "slack") toast.success("Slack connected");
    else if (error === "github_connect") {
      toast.error("GitHub connect failed. Try again or check the app installation.");
    } else if (error === "slack_connect") {
      toast.error("Slack connect failed. Try again or check the app's OAuth settings.");
    }
    params.delete("connected");
    params.delete("error");
    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, []);

  const fList = useServerFn(listConnections);
  const fSuiteList = useServerFn(listMySuiteConnections);
  const fRequest = useServerFn(requestConnector);

  const list = useQuery({ queryKey: ["connections"], queryFn: () => fList() });
  const suite = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: () => fSuiteList(),
  });

  // Detect a newly-appeared GitHub connection (for the new-tab polling flow).
  // hadGithubRef starts null so we skip the toast on first data load.
  const hadGithubRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (list.isLoading || !list.data) return;
    const hasGithub = list.data.connections.some(
      (c) => c.provider === "github" && c.status === "connected",
    );
    if (hadGithubRef.current === null) {
      hadGithubRef.current = hasGithub;
      return;
    }
    if (hasGithub && !hadGithubRef.current) {
      toast.success("GitHub connected");
    }
    hadGithubRef.current = hasGithub;
  }, [list.data, list.isLoading]);

  // Connect flows shared with ConnectorDetail (one implementation).
  const { mGithub, mGateway, mNative, mSuite, busy } = useConnectorActions(qc);

  // "Tell us what to build next", rebuilt on the primitives so the last piece
  // of retired chrome leaves this panel. Same server function, same table.
  const [wanted, setWanted] = useState("");
  const request = useMutation({
    mutationFn: (connector: string) =>
      fRequest({ data: { connector, workspaceId: activeWorkspaceId ?? undefined } }),
    onSuccess: () => {
      setWanted("");
      toast.success("Noted. It goes on the list.");
    },
    onError: (e: Error) => toast.error(e.message || "That did not send. Try again."),
  });

  const byProvider = new Map<ProviderId, AccountConnection[]>();
  for (const c of list.data?.connections ?? []) {
    const arr = byProvider.get(c.provider) ?? [];
    arr.push(c);
    byProvider.set(c.provider, arr);
  }
  const suiteAccounts = suite.data?.connections ?? [];

  // End-user providers only: internal/service connectors (firecrawl, anything
  // flagged userFacing: false in the registry) never render here.
  const visibleProviders = Object.values(CONNECTOR_REGISTRY).filter(
    (spec) => spec.id !== "firecrawl" && spec.userFacing !== false,
  );

  const availability = list.data?.providerAvailability;

  // A provider is "connected" when it has at least one account row (connections
  // table) or one suite account (calendar/mail, same provider+product).
  const isConnected = (spec: ProviderSpec): boolean => {
    const suiteSpec = SUITE_PROVIDERS[spec.id];
    if (suiteSpec) {
      return suiteAccounts.some(
        (c) => c.provider === suiteSpec.provider && c.product === suiteSpec.product,
      );
    }
    return (byProvider.get(spec.id)?.length ?? 0) > 0;
  };

  // Four states, resolved once per provider (same logic drives the line and the
  // Connected tab count): a live connection, an env-active workspace token, an
  // OAuth app that is configured (real Connect), or not available yet.
  const statusFor = (spec: ProviderSpec): CardStatus => {
    if (isConnected(spec)) return "connected";
    if (providerEnvActive(spec, availability)) return "active";
    if (providerConfigured(spec, availability)) return "connect";
    return "soon";
  };
  const isConnectedish = (spec: ProviderSpec): boolean => {
    const s = statusFor(spec);
    return s === "connected" || s === "active";
  };

  // The single, honest "last synced / verified" recency for a connected
  // provider: the most-recent timestamp across its account rows (calendars
  // carry last_sync_at; everything else carries last_verified_at). Null when
  // there is no real timestamp yet, so the line falls back to saying only what
  // it knows rather than inventing a time.
  const lastActivityFor = (spec: ProviderSpec): { iso: string; verb: string } | null => {
    const suiteSpec = SUITE_PROVIDERS[spec.id];
    if (suiteSpec) {
      const iso = latestIso(
        suiteAccounts
          .filter((c) => c.provider === suiteSpec.provider && c.product === suiteSpec.product)
          .map((c) => c.last_sync_at),
      );
      return iso ? { iso, verb: "synced" } : null;
    }
    const iso = latestIso((byProvider.get(spec.id) ?? []).map((c) => c.last_verified_at));
    return iso ? { iso, verb: "verified" } : null;
  };

  // WHO the source is connected as, which is the fact the old green pill left
  // out. One account: name it. Several: count them. None readable: say
  // "Connected" and stop, rather than inventing an identity.
  const accountsFor = (spec: ProviderSpec): { count: number; label: string | null } => {
    const suiteSpec = SUITE_PROVIDERS[spec.id];
    if (suiteSpec) {
      const rows = suiteAccounts.filter(
        (c) => c.provider === suiteSpec.provider && c.product === suiteSpec.product,
      );
      return { count: rows.length, label: rows[0]?.account_email ?? rows[0]?.display_name ?? null };
    }
    const rows = byProvider.get(spec.id) ?? [];
    return { count: rows.length, label: rows[0]?.account_label ?? rows[0]?.account_email ?? null };
  };

  /** A connection that stopped authorising. The one place colour is spent on
   *  this list, because it is an outcome the reader has to act on. */
  const brokenFor = (spec: ProviderSpec): boolean =>
    (byProvider.get(spec.id) ?? []).some((c) => c.status === "error");

  // The connect flow for a not-yet-connected provider (GitHub App redirect,
  // suite OAuth redirect, native OAuth redirect, or the legacy gateway popup).
  const connectProvider = (spec: ProviderSpec) => {
    const suiteSpec = SUITE_PROVIDERS[spec.id];
    if (suiteSpec) mSuite.mutate(suiteSpec);
    else if (spec.authMethods.some((m) => m.kind === "github_app")) mGithub.mutate();
    else if (spec.authMethods.some((m) => m.kind === "oauth_native")) mNative.mutate(spec);
    else mGateway.mutate(spec);
  };

  // The one canonical catalog, flattened, each entry carrying its category so
  // the list can be searched flat and still grouped on the way out.
  const allEntries = useMemo(() => {
    const out: { entry: CatalogEntry; category: ConnectorCategory; categoryLabel: string }[] = [];
    for (const g of buildConnectorCatalog()) {
      for (const e of g.entries) out.push({ entry: e, category: g.id, categoryLabel: g.label });
    }
    return out;
  }, []);

  // Live search plus one status tab. The ten category filters became group
  // labels: the same information, without a wall of facets in a settings pane.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "connected">("all");
  const clearFilters = () => {
    setStatusFilter("all");
    setQuery("");
  };

  const connectedCount = visibleProviders.filter(isConnectedish).length;
  const allCount = allEntries.length;

  const q = query.trim().toLowerCase();
  const filtered = allEntries.filter((a) => {
    const spec = CONNECTOR_REGISTRY[a.entry.id];
    if (statusFilter === "connected" && !isConnectedish(spec)) return false;
    if (!q) return true;
    return (
      a.entry.label.toLowerCase().includes(q) ||
      a.entry.description.toLowerCase().includes(q) ||
      a.categoryLabel.toLowerCase().includes(q)
    );
  });

  // Catalog order is category order, so consecutive runs are the groups.
  const groups: { id: ConnectorCategory; label: string; entries: CatalogEntry[] }[] = [];
  for (const a of filtered) {
    const last = groups[groups.length - 1];
    if (last && last.id === a.category) last.entries.push(a.entry);
    else groups.push({ id: a.category, label: a.categoryLabel, entries: [a.entry] });
  }

  const sourceLine = (e: CatalogEntry) => {
    const spec = CONNECTOR_REGISTRY[e.id];
    const status = statusFor(spec);

    let sub: ReactNode = e.description;
    let control: ReactNode = null;

    if (status === "connected") {
      const { count, label } = accountsFor(spec);
      const activity = lastActivityFor(spec);
      sub = brokenFor(spec) ? (
        <span className="sp-fail">It stopped authorising. Reconnect it.</span>
      ) : (
        <>
          {count > 1 ? (
            <>
              Connected on <Num>{count}</Num> accounts
            </>
          ) : label ? (
            <>Connected as {label}</>
          ) : (
            <>Connected</>
          )}
          {activity ? (
            <>
              {" · "}
              {activity.verb} <Num>{ago(activity.iso)}</Num>
            </>
          ) : null}
        </>
      );
      control = (
        <Button variant="ghost" onClick={() => onOpenDetail(e.id)}>
          Manage
        </Button>
      );
    } else if (status === "active") {
      sub = "Reading through a workspace credential. Nothing for you to connect.";
      control = (
        <Button variant="ghost" onClick={() => onOpenDetail(e.id)}>
          Manage
        </Button>
      );
    } else if (status === "connect") {
      control = (
        <Button disabled={busy} onClick={() => setTrustFor(spec)}>
          Connect
        </Button>
      );
    } else {
      control = (
        <span
          title={setupHintFor(spec)}
          style={{ fontSize: "var(--sp-text-label)", color: "var(--sp-mute)" }}
        >
          Not available yet
        </span>
      );
    }

    return (
      <Line
        key={e.id}
        label={e.label}
        // One line, and it is a different fact from the name: what this source
        // brings in, or what it is currently letting through.
        sub={
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </span>
        }
      >
        {control}
      </Line>
    );
  };

  return (
    <div id="connections">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-space-3)",
          flexWrap: "wrap",
        }}
      >
        <Input
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="Search sources"
          aria-label="Search sources"
          style={{ width: 220 }}
        />
        <span
          className="sp-tabs"
          role="tablist"
          aria-label="Filter sources"
          style={{ marginTop: 0 }}
        >
          <button
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          >
            All<span className="sp-tab-count">{allCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={statusFilter === "connected"}
            onClick={() => setStatusFilter("connected")}
          >
            Connected<span className="sp-tab-count">{connectedCount}</span>
          </button>
        </span>
      </div>

      {list.isLoading ? (
        <Empty>Reading your sources.</Empty>
      ) : list.isError ? (
        // A failed read must never wear an empty state's clothes: painting every
        // provider "not available yet" would be a lie about the catalog.
        <Failed onRetry={() => void list.refetch()}>
          Your sources did not load. {(list.error as Error)?.message ?? "The read failed."}
        </Failed>
      ) : groups.length === 0 ? (
        <Empty action={<Button onClick={clearFilters}>Clear the filter</Button>}>
          {q ? `Nothing matches ${query.trim()}.` : "Nothing connected yet."}
        </Empty>
      ) : (
        groups.map((g) => (
          <div key={g.id}>
            <GroupLabel count={g.entries.length}>{g.label}</GroupLabel>
            {g.entries.map(sourceLine)}
          </div>
        ))
      )}

      {/* The two things that are not a source: where sources bind, and the one
          you wish we carried. One form so the two lines divide from each other
          the way every other pair of Lines on this surface does. */}
      <form
        style={{ marginTop: "var(--sp-space-8)" }}
        onSubmit={(ev) => {
          ev.preventDefault();
          const trimmed = wanted.trim();
          if (trimmed && !request.isPending) request.mutate(trimmed);
        }}
      >
        <Line
          label="Workspace bindings"
          sub="Which repo, project or page each source reads in this workspace."
        >
          <Link to="/sync" className="sp-btn">
            Open sync
          </Link>
        </Line>
        <Line label="Request a source">
          <Input
            value={wanted}
            onChange={(ev) => setWanted(ev.target.value)}
            placeholder="Amplitude"
            maxLength={120}
            aria-label="Source you want"
            style={{ width: 180 }}
          />
          <Button type="submit" disabled={!wanted.trim() || request.isPending}>
            Request
          </Button>
        </Line>
      </form>

      <ConnectTrustDialog
        provider={trustFor?.id ?? null}
        label={trustFor?.label ?? ""}
        open={!!trustFor}
        onOpenChange={(o) => !o && setTrustFor(null)}
        onContinue={() => {
          if (trustFor) connectProvider(trustFor);
          setTrustFor(null);
        }}
        busy={busy}
      />
    </div>
  );
}

/* ---- ConnectorDetail: the per-provider drill, reached with ?connector= and
   rendered in place of the whole Sources pane, so it owns a PageHead of its
   own rather than the retired DrillHeader.

   Ported with the same two cuts as the list. The three "stat" cards collapsed
   into the subtitle, because "since Jun 3 · 2 accounts · verified Jul 27" is
   one sentence of facts, not three panels. The bindings card and the account
   table became Blocks of Rows: a table header, a grid template and a per-row
   border are three ways of drawing what a rule already draws.

   Four states, unchanged: setup required (no OAuth app and no env token),
   active via an admin-managed env credential (nothing for this user to
   connect), configured-but-not-connected, and connected. Reads the SAME query
   keys as the list (["connections"], ["workspace-bindings"],
   ["calendar-connections"]) so the cache is shared. ---- */

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConnectorDetail({
  provider,
  onBack,
}: {
  provider: ProviderId;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { mGithub, mGateway, mNative, mSuite, mVerify, busy } = useConnectorActions(qc);

  const fDisconnect = useServerFn(disconnectConnection);
  const fDelete = useServerFn(deleteConnection);
  const fSuiteDisconnect = useServerFn(disconnectSuiteConnection);
  const mDisconnect = useMutation({
    mutationFn: (id: string) => fDisconnect({ data: { id } }),
    onSuccess: () => {
      toast.success("Disconnected. Workspace bindings stay until you remove them.");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["workspace-bindings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelete = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Connection removed");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["workspace-bindings"] });
      onBack();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mSuiteDisconnect = useMutation({
    mutationFn: (id: string) => fSuiteDisconnect({ data: { id } }),
    onSuccess: () => {
      toast.success("Disconnected");
      qc.invalidateQueries({ queryKey: ["calendar-connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const manageBusy = mDisconnect.isPending || mDelete.isPending || mSuiteDisconnect.isPending;

  const fVerifyEnv = useServerFn(verifyEnvCredential);
  const [envCheck, setEnvCheck] = useState<{
    ok: boolean;
    detail: string | null;
    checkedAt: string;
  } | null>(null);
  const mVerifyEnv = useMutation({
    mutationFn: () => fVerifyEnv({ data: { provider } }),
    onSuccess: (r) => {
      setEnvCheck(r);
      if (!r.ok) toast.error(r.detail ?? "Verification failed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const spec = CONNECTOR_REGISTRY[provider];
  const suiteSpec = SUITE_PROVIDERS[provider];
  const isSuite = suiteSpec !== undefined;

  const fList = useServerFn(listConnections);
  const fBindings = useServerFn(listWorkspaceBindings);
  const fSuiteList = useServerFn(listMySuiteConnections);

  const list = useQuery({ queryKey: ["connections"], queryFn: () => fList() });
  const bindingsQ = useQuery({ queryKey: ["workspace-bindings"], queryFn: () => fBindings() });
  const suite = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: () => fSuiteList(),
    enabled: isSuite,
  });

  // RPT-02 - this drill-down is independently reachable via ?connector=
  // (deep link / bookmark / stale tab) for a provider that isn't connected
  // yet, so it needs its own trust-dialog gate too, not just the list's.
  // Declared BEFORE the early returns below (Rules of Hooks: the hook count
  // must not change when the loading render gives way to the loaded one).
  const [showTrust, setShowTrust] = useState(false);

  const back = (
    <div style={{ marginBottom: "var(--sp-space-3)" }}>
      <Button variant="ghost" onClick={onBack}>
        All sources
      </Button>
    </div>
  );

  // The route validates ?connector= against the registry; this guards a
  // hand-edited URL that slips a non-user-facing provider through.
  if (!spec || spec.userFacing === false) {
    return (
      <Empty action={<Button onClick={onBack}>All sources</Button>}>No source by that name.</Empty>
    );
  }

  if (list.isLoading || bindingsQ.isLoading || (isSuite && suite.isLoading)) {
    return (
      <>
        {back}
        <Empty>Reading {spec.label}.</Empty>
      </>
    );
  }

  // A failed read must not fall through to "not connected": an error never
  // wears another state's clothes.
  if (list.isError || bindingsQ.isError || (isSuite && suite.isError)) {
    const err = (list.error ?? bindingsQ.error ?? suite.error) as Error | null;
    return (
      <>
        {back}
        <PageHead title={spec.label} />
        <Failed
          onRetry={() => {
            void list.refetch();
            void bindingsQ.refetch();
            if (isSuite) void suite.refetch();
          }}
        >
          {spec.label} did not load. {err?.message ?? "The read failed."}
        </Failed>
      </>
    );
  }

  const configured = providerConfigured(spec, list.data?.providerAvailability);
  const envActive = providerEnvActive(spec, list.data?.providerAvailability);
  const hint = setupHintFor(spec);
  const conns = (list.data?.connections ?? []).filter((c) => c.provider === provider);
  const calAccounts = suiteSpec
    ? (suite.data?.connections ?? []).filter(
        (c) => c.provider === suiteSpec.provider && c.product === suiteSpec.product,
      )
    : [];

  const connect = () => {
    if (suiteSpec) mSuite.mutate(suiteSpec);
    else if (spec.authMethods.some((m) => m.kind === "github_app")) mGithub.mutate();
    else if (spec.authMethods.some((m) => m.kind === "oauth_native")) mNative.mutate(spec);
    else mGateway.mutate(spec);
  };

  /* -- Active via an admin-managed env credential (envConfigured), no
     per-user OAuth registered (gatewayConfigured false): Supaprod is already
     reading through the workspace token, so there is nothing for THIS user
     to Connect. Showing "coming soon" with a disabled button here would be
     misleading - the list already says this provider is active
     (founder ruling 2026-07-06). -- */
  if (envActive && !configured && conns.length === 0 && calAccounts.length === 0) {
    return (
      <>
        {back}
        <PageHead title={spec.label} sub={spec.description} />
        <Line
          label="Active through a workspace credential"
          // Active means the secret is set. Whether it still authenticates is a
          // different fact, and it is the one the button answers.
          sub={
            envCheck ? (
              envCheck.ok ? (
                "It still authenticates."
              ) : (
                <>
                  <span className="sp-fail">It did not authenticate.</span>{" "}
                  {envCheck.detail ?? "No reason given."} An admin has to rotate the secret.
                </>
              )
            ) : (
              "Set by an admin, so there is nothing here for you to connect."
            )
          }
        >
          <Button disabled={mVerifyEnv.isPending} onClick={() => mVerifyEnv.mutate()}>
            {mVerifyEnv.isPending ? "Testing" : "Test it"}
          </Button>
        </Line>
      </>
    );
  }

  /* -- Not configured: the admin hasn't registered the OAuth app yet. No
     disabled Connect button, because an affordance is a promise. -- */
  if (!configured && conns.length === 0 && calAccounts.length === 0) {
    return (
      <>
        {back}
        <PageHead title={spec.label} sub={spec.description} />
        <Empty>Not available yet. {hint}</Empty>
      </>
    );
  }

  /* -- Configured, no connection yet: the real OAuth connect flow. -- */
  if (isSuite ? calAccounts.length === 0 : conns.length === 0) {
    return (
      <>
        {back}
        <PageHead
          title={spec.label}
          sub={`${spec.description} Connect it once and what it syncs starts feeding the company brain.`}
        />
        <Actions>
          <Button variant="primary" disabled={busy} onClick={() => setShowTrust(true)}>
            Connect {spec.label}
          </Button>
        </Actions>
        <ConnectTrustDialog
          provider={provider}
          label={spec.label}
          open={showTrust}
          onOpenChange={setShowTrust}
          onContinue={() => {
            setShowTrust(false);
            connect();
          }}
          busy={busy}
        />
      </>
    );
  }

  /* -- Connected: the facts in one line, the actions, what it feeds, who it is
     connected as. -- */
  const primary = conns[0]; // listConnections orders by created_at ascending
  const earliest = isSuite ? calAccounts[0]?.created_at : primary?.created_at;
  const since = earliest
    ? new Date(earliest).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const lastSync = calAccounts.reduce<string | null>(
    (acc, c) => (c.last_sync_at && (!acc || c.last_sync_at > acc) ? c.last_sync_at : acc),
    null,
  );
  const accountCount = isSuite ? calAccounts.length : conns.length;
  const lastIso = isSuite ? lastSync : primary?.last_verified_at;
  const broken = !isSuite && primary?.status !== "connected";

  const provBindings = (bindingsQ.data?.bindings ?? []).filter((b) => b.provider === provider);

  return (
    <>
      {back}
      <PageHead
        title={spec.label}
        // The three stat cards, said as one sentence. Numbers in mono.
        sub={
          <>
            {since ? (
              <>
                Since <Num>{since}</Num>
                {" · "}
              </>
            ) : null}
            <Num>{accountCount}</Num> {accountCount === 1 ? "account" : "accounts"}
            {lastIso ? (
              <>
                {" · "}
                {isSuite ? "synced" : "verified"} <Num>{shortDate(lastIso)}</Num>
              </>
            ) : null}
            {broken ? (
              <>
                {" · "}
                <span className="sp-fail">{primary.status}</span>
              </>
            ) : null}
          </>
        }
      />

      {isSuite ? (
        <Actions
          trailing={
            calAccounts.length > 0 ? (
              <Button
                variant="ghost"
                disabled={busy || manageBusy}
                onClick={async () => {
                  const ok = await confirm({
                    title: `Disconnect this ${suiteSpec?.product === "mail" ? "mailbox" : "calendar"}?`,
                    body:
                      suiteSpec?.product === "mail"
                        ? "Stored signals stay but no further messages will be pulled in."
                        : "Stored events stay but no further sync will happen.",
                    confirmLabel: "Disconnect",
                    destructive: true,
                  });
                  if (ok) mSuiteDisconnect.mutate(calAccounts[0]!.id);
                }}
              >
                Disconnect
              </Button>
            ) : null
          }
        >
          <Button disabled={busy} onClick={() => setShowTrust(true)}>
            Connect another account
          </Button>
        </Actions>
      ) : (
        // Remove destroys the connection and every binding on it, so it sits
        // apart by DISTANCE rather than by colour: red carries outcomes here,
        // not intent.
        <Actions
          trailing={
            <Button
              variant="ghost"
              disabled={busy || manageBusy}
              onClick={async () => {
                const ok = await confirm({
                  title: "Remove this connection?",
                  body: "Deletes the connection and every workspace binding that uses it. This cannot be undone.",
                  confirmLabel: "Remove",
                  destructive: true,
                });
                if (ok) mDelete.mutate(primary.id);
              }}
            >
              Remove
            </Button>
          }
        >
          <Button disabled={busy} onClick={() => mVerify.mutate(primary.id)}>
            Verify
          </Button>
          <Button
            disabled={busy || manageBusy}
            onClick={async () => {
              const ok = await confirm({
                title: "Disconnect this account?",
                body: "The stored credential is deleted. Workspace bindings stay visible but stop working until you reconnect.",
                confirmLabel: "Disconnect",
                destructive: true,
              });
              if (ok) mDisconnect.mutate(primary.id);
            }}
          >
            Disconnect
          </Button>
        </Actions>
      )}

      <Block title="What it feeds">
        {provBindings.length === 0 ? (
          <Empty>Nothing bound yet. Bind repos, projects or pages under workspace sync.</Empty>
        ) : (
          provBindings.map((b) => (
            <Row
              key={b.id}
              tight
              lead={b.resource_label ?? b.resource_id}
              sub={
                <>
                  {b.resource_kind}
                  {b.connection_status === "connected" ? null : (
                    <>
                      {" · "}
                      <span className="sp-fail">not reading</span>
                    </>
                  )}
                </>
              }
            />
          ))
        )}
      </Block>

      <Block title="Accounts">
        {isSuite
          ? calAccounts.map((c) => (
              <Row
                key={c.id}
                tight
                lead={c.account_email ?? c.display_name ?? "Connected"}
                time={c.last_sync_at ? shortDate(c.last_sync_at) : null}
              />
            ))
          : conns.map((c) => (
              <Row
                key={c.id}
                tight
                lead={c.account_label ?? c.account_email ?? "Connected"}
                // Only the exception earns a second line. A row that says
                // "connected" under a heading that already says so is the
                // redundancy ban with extra steps.
                sub={
                  c.status === "connected" ? null : (
                    <span className={c.status === "error" ? "sp-fail" : "sp-warn"}>{c.status}</span>
                  )
                }
                time={c.last_verified_at ? shortDate(c.last_verified_at) : null}
              />
            ))}
      </Block>

      <ConnectTrustDialog
        provider={provider}
        label={spec.label}
        open={showTrust}
        onOpenChange={setShowTrust}
        onContinue={() => {
          setShowTrust(false);
          connect();
        }}
        busy={busy}
      />
    </>
  );
}
