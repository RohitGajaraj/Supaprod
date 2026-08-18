import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Num } from "@/components/meridian/surface-parts";
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
  type WorkspaceBindingRow,
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
import { ProviderMark } from "./provider-marks";
import { latestIso, relTimeCaps } from "@/components/discover/format";
import { Actions, Block, Button, Cell, Empty, Failed, Grid, Input, Line, Loading, PageHead, Row, Select } from "@/components/shell/primitives";

/**
 * SOURCES. Redesigned 2026-07-29 against the founder's own words: "the
 * connector section, on the right side, if you see it's a lot of vertical
 * scrolling. How can we make it better?"
 *
 * The six questions (SURFACE-JUSTIFICATION.md), answered before a line changed.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Someone who just read "not reading" somewhere else in the product, or who
 *    is about to start a mission and wants the crew to see Linear. One person,
 *    one source, one round trip. Nobody has ever opened this pane to browse
 *    twenty logos.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Answering "what is the crew actually reading, on whose account, pointed at
 *    what" without scrolling, and then connecting the one thing that is
 *    missing. Those are two different questions and the old pane answered
 *    neither: it was one flat alphabet of nineteen providers under ten category
 *    headings, so the three you own were buried among the sixteen you do not,
 *    and the account and the binding were nowhere on the line.
 *
 * 3. KEEP / MOVE / KILL:
 *    KEEP - the connect flows (GitHub App install, native OAuth, the suite
 *      multi-account path, the last gateway popup), the trust interstitial, the
 *      per-provider drill, the request box, the honest "not available yet"
 *      state, and every server function and query key. None of that was the
 *      problem.
 *    KEEP, PROMOTED - the account behind a connection, and what it is bound to
 *      in this workspace. Those were one and two clicks away respectively; they
 *      are the answer to the question the pane exists for, so they are now on
 *      the line.
 *    KILL - the single flat list. Connected and available are different
 *      questions asked by different people in different moods, so they are now
 *      two regions with two shapes: a list you read, and a catalog you scan.
 *    KILL - the ten category headings, each carrying 32px of top margin. Ten
 *      headings and their air were roughly 440px of the scroll and they carried
 *      one bit of information apiece. The category survives as one Select
 *      beside the search box, which is the same information with none of the
 *      height, and search already matched category names anyway.
 *    KILL - the All / Connected tabs. The split they performed is now
 *      structural, so a control that reproduces it is a control that does
 *      nothing new.
 *    KILL - the "Nothing connected yet" empty state standing in for a failed
 *      read. Failed says so and offers one retry (it already did; kept).
 *    MOVE - nothing off this surface. /sync keeps conflicts and the picker;
 *      this pane now SHOWS the binding it owns rather than hiding the fact.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    Every account on a multi-account source, the scopes, the verify button,
 *    the disconnect, and the full binding list live in the per-source drill
 *    (?connector=). Changing a binding, and resolving a two-sided edit, live on
 *    /sync. A source line is two lines and never wraps.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The delight is the credential chain said out loud in plain words. A person
 *    can read one line and know which of the four links is carrying the source:
 *    their own account, an admin's workspace credential, a binding, or nothing.
 *    That chain is real (resolve.server.ts: product binding, then workspace
 *    binding, then user connection, then env fallback) and it was invisible.
 *    What would confuse, and is therefore not drawn: a plan-tier lock we cannot
 *    verify from the client, a green pill that means four different things, and
 *    a Connect button on a provider whose OAuth app nobody registered.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    A source is the crew's reach. The connected line names who bound it, which
 *    is attribution on the one artifact this surface owns, and it says what the
 *    crew is reading through right now rather than what it could read in
 *    principle. Nothing here animates a capability the wiring lacks: a source
 *    whose connection stopped authorising says "not reading" in red on the same
 *    line as the binding it has stopped feeding. There is no agent mark on this
 *    pane because no agent acts here, and drawing one would be decoration.
 *
 * RECOGNITION, added later the same night on the founder's second look: "it's
 * very blank. Please add the small satellite so that it knows exactly what it
 * is." Both regions now draw a provider mark (provider-marks.tsx), and the two
 * hand-rolled shapes this file carried were retired into the primitives that
 * had since been built for them:
 *   - The local CATALOG_GRID + CatalogCell existed because, at the time, the
 *     system had no neutral grid of cells and the only one was the crew
 *     roster's, whose class names say AGENT. That gap was reported here and has
 *     been filled: Grid and Cell are primitives now, so the local pair goes.
 *     The cell gains a real focus ring, a real hover computed from its own
 *     tint, and a mark slot, none of which the inline copy had.
 *   - The connected list moved from Line to Row. Same list, same order, same
 *     credential chain, same Manage control; Row is simply the primitive with a
 *     mark slot, and it centres the mark across both lines instead of hanging
 *     it off the first one.
 * The catalogue wears BRAND hues because there the provider is the subject.
 * The connected list stays monochrome because there the subject is state, and
 * a brand hue beside "not reading" would compete with the one thing a person
 * has to act on.
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
 * Anchorable via /settings?section=connections and ?connector=<id>.
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

// Per-provider status the two regions are built from.
type CardStatus = "connected" | "active" | "connect" | "soon";

/** What the cell says on hover, and it is the second half of the founder's ask:
 *  "how do we connect". Both halves are real registry facts rather than copy -
 *  `description` is the provider's own line, and `connectMethod` is derived
 *  from its auth method, which is exactly what connectProvider() then does:
 *  the GitHub App path is an install redirect, everything else opens the
 *  provider's own consent screen. */
function connectHintFor(entry: CatalogEntry): string {
  const how =
    entry.connectMethod === "github_app"
      ? "Connecting installs the Supaprod GitHub App."
      : `Connecting opens ${entry.label}'s own sign-in.`;
  return `${entry.description} ${how}`;
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
  const fBindings = useServerFn(listWorkspaceBindings);
  const fRequest = useServerFn(requestConnector);

  const list = useQuery({ queryKey: ["connections"], queryFn: () => fList() });
  const suite = useQuery({ queryKey: ["calendar-connections"], queryFn: () => fSuiteList() });
  // Same query key /sync and ConnectorDetail read, so the cache is shared and
  // this costs no second fetch. It is here because "which repo does it read"
  // is half the question this pane exists to answer.
  const bindings = useQuery({ queryKey: ["workspace-bindings"], queryFn: () => fBindings() });

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
  const bindingRows: WorkspaceBindingRow[] = bindings.data?.bindings ?? [];
  // The bindings read is independent of the sources read, so it can fail on its
  // own. When it has not answered, the line says nothing about bindings rather
  // than saying "nothing bound yet", which would be a claim we cannot make.
  const bindingsKnown = bindings.isSuccess;

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

  // Four states, resolved once per provider: a live connection, an env-active
  // workspace token, an OAuth app that is configured (real Connect), or not
  // available yet.
  const statusFor = (spec: ProviderSpec): CardStatus => {
    if (isConnected(spec)) return "connected";
    if (providerEnvActive(spec, availability)) return "active";
    if (providerConfigured(spec, availability)) return "connect";
    return "soon";
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

  /** What this source is pointed at in this workspace. The third link of the
   *  credential chain, and the founder's own test question: "is Linear
   *  connected, and to which workspace?" */
  const boundFor = (spec: ProviderSpec): WorkspaceBindingRow[] =>
    bindingRows.filter((b) => b.provider === spec.id);

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
  // the catalog can be searched flat and filtered without ten headings.
  const catalogGroups = useMemo(() => buildConnectorCatalog(), []);
  const allEntries = useMemo(() => {
    const out: { entry: CatalogEntry; category: ConnectorCategory; categoryLabel: string }[] = [];
    for (const g of catalogGroups) {
      for (const e of g.entries) out.push({ entry: e, category: g.id, categoryLabel: g.label });
    }
    return out;
  }, [catalogGroups]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ConnectorCategory | "all">("all");
  const clearFilters = () => {
    setCategory("all");
    setQuery("");
  };

  const q = query.trim().toLowerCase();

  // THE SPLIT, and it is the whole redesign: what you have is a list you read,
  // what you could have is a catalog you scan. Same nineteen providers, two
  // questions, two shapes.
  const reading = allEntries.filter((a) => {
    const s = statusFor(CONNECTOR_REGISTRY[a.entry.id]);
    return s === "connected" || s === "active";
  });
  const catalog = allEntries.filter((a) => {
    const s = statusFor(CONNECTOR_REGISTRY[a.entry.id]);
    return s === "connect" || s === "soon";
  });

  const filteredCatalog = catalog
    .filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.entry.label.toLowerCase().includes(q) ||
        a.entry.description.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q)
      );
    })
    // Connectable first: what you can do now outranks what an admin has to do
    // first. Category order holds inside each half so relatives stay adjacent.
    .sort((a, b) => {
      const ca = statusFor(CONNECTOR_REGISTRY[a.entry.id]) === "connect" ? 0 : 1;
      const cb = statusFor(CONNECTOR_REGISTRY[b.entry.id]) === "connect" ? 0 : 1;
      return ca - cb;
    });

  const connectableCount = catalog.filter(
    (a) => statusFor(CONNECTOR_REGISTRY[a.entry.id]) === "connect",
  ).length;
  const pendingCount = catalog.length - connectableCount;

  // Sorted so the thing you have to act on is first, then alphabetical. Never
  // insert order: a list whose order changes under you is a list you re-read.
  const readingSorted = [...reading].sort((a, b) => {
    const ba = brokenFor(CONNECTOR_REGISTRY[a.entry.id]) ? 0 : 1;
    const bb = brokenFor(CONNECTOR_REGISTRY[b.entry.id]) ? 0 : 1;
    return ba - bb || a.entry.label.localeCompare(b.entry.label);
  });

  const loading = list.isLoading || suite.isLoading;
  const failed = list.isError;

  /** The head states the boundary currently in force, from real rows only.
   *  While the read is in flight or after it failed it says so instead. */
  const headSub: ReactNode = failed
    ? "Your connectors did not load, so nothing below is the whole picture."
    : loading
      ? "Reading what the crew is connected to."
      : reading.length === 0
        ? `The crew reads nothing yet. ${connectableCount > 0 ? `${connectableCount} connectors are ready to connect.` : "Every connector is still waiting on an admin to register its app."}`
        : `The crew reads ${reading.length} ${reading.length === 1 ? "connector" : "connectors"}. ${connectableCount > 0 ? `${connectableCount} more are ready to connect.` : "Everything else is waiting on an admin."}`;

  const readingLine = (a: { entry: CatalogEntry }) => {
    const e = a.entry;
    const spec = CONNECTOR_REGISTRY[e.id];
    const status = statusFor(spec);
    const broken = brokenFor(spec);
    const bound = boundFor(spec);
    const activity = lastActivityFor(spec);
    const { count, label } = accountsFor(spec);

    // The credential chain, in plain words, in the order resolve.server.ts
    // walks it: the binding, then whose account carries it.
    const parts: ReactNode[] = [];
    if (broken) {
      parts.push(<span className="sp-fail">It stopped authorising. Reconnect it.</span>);
    } else if (status === "active") {
      parts.push(<>Reading on a workspace credential an admin set</>);
    } else if (count > 1) {
      parts.push(
        <>
          Connected on <Num>{count}</Num> accounts
        </>,
      );
    } else if (label) {
      parts.push(<>Connected as {label}</>);
    } else {
      parts.push(<>Connected</>);
    }

    if (bound.length === 1) {
      const b = bound[0];
      parts.push(
        <>
          reads {b.resource_label ?? b.resource_id}
          {b.connection_status === "connected" ? null : (
            <>
              {" "}
              <span className="sp-fail">not reading</span>
            </>
          )}
        </>,
      );
    } else if (bound.length > 1) {
      parts.push(
        <>
          reads <Num>{bound.length}</Num> bound resources
        </>,
      );
    } else if (bindingsKnown && spec.resourceTypes.length > 0) {
      parts.push(<>nothing bound yet</>);
    }

    if (!broken && activity) {
      parts.push(
        <>
          {activity.verb} <Num>{ago(activity.iso)}</Num>
        </>,
      );
    }

    return (
      <Row
        key={e.id}
        tight
        // Monochrome here on purpose. This region's subject is STATE, and the
        // red "not reading" beside it has to be the only colour on the line.
        marks={<ProviderMark provider={e.id} />}
        lead={e.label}
        sub={parts.map((p, i) => (
          <span key={i}>
            {i > 0 ? " · " : null}
            {p}
          </span>
        ))}
        action={
          <Button variant="ghost" onClick={() => onOpenDetail(e.id)}>
            Manage
          </Button>
        }
      />
    );
  };

  return (
    <div id="connections">
      <PageHead title="Connectors" sub={headSub} />

      <Block
        title="What the crew reads"
        sub="Each line says which account carries the connector and what it is pointed at in this workspace."
      >
        {failed ? (
          <Failed onRetry={() => void list.refetch()}>
            Your connectors did not load. {(list.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : loading ? (
          <Loading>Reading your connectors.</Loading>
        ) : readingSorted.length === 0 ? (
          <Empty>
            Nothing connected. The crew reads only what you connect, so every mission currently runs
            on what you type into it.
          </Empty>
        ) : (
          readingSorted.map(readingLine)
        )}
      </Block>

      <Block
        title="Add a connector"
        sub={
          failed || loading
            ? undefined
            : pendingCount > 0
              ? `${connectableCount} you can connect now. ${pendingCount} still need an admin to register the app.`
              : `${connectableCount} you can connect now.`
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-space-2)",
            flexWrap: "wrap",
            marginBottom: "var(--sp-space-3)",
          }}
        >
          <Input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Search"
            aria-label="Search connectors"
            style={{ width: 200 }}
          />
          {/* The ten category headings, and their 32px of air apiece, said as
              one control. Same information, none of the height. */}
          <Select
            value={category}
            aria-label="Filter by category"
            onChange={(ev) => setCategory(ev.target.value as ConnectorCategory | "all")}
            style={{ width: 190 }}
          >
            <option value="all">Every kind</option>
            {catalogGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </Select>
        </div>

        {failed ? (
          <Empty>The catalog needs the connectors read above. Retry it and this fills in.</Empty>
        ) : loading ? (
          <Loading>Reading the catalog.</Loading>
        ) : filteredCatalog.length === 0 ? (
          <Empty action={<Button onClick={clearFilters}>Clear the filter</Button>}>
            {q ? `Nothing matches ${query.trim()}.` : "Nothing left to connect in that kind."}
          </Empty>
        ) : (
          <Grid>
            {filteredCatalog.map((a) => {
              const spec = CONNECTOR_REGISTRY[a.entry.id];
              const can = statusFor(spec) === "connect";
              return (
                <Cell
                  key={a.entry.id}
                  // BRAND hue, and this is the one region that earns it: you
                  // are scanning twenty products to find one, so the provider
                  // IS the subject here.
                  mark={<ProviderMark provider={a.entry.id} tone="brand" size={18} />}
                  lead={a.entry.label}
                  sub={can ? a.entry.flowLabel : "Waiting on an admin"}
                  title={can ? connectHintFor(a.entry) : setupHintFor(spec)}
                  // A cell nobody can connect dims and never lights up: an
                  // affordance is a promise.
                  disabled={can ? busy : true}
                  onClick={can ? () => setTrustFor(spec) : undefined}
                />
              );
            })}
          </Grid>
        )}
      </Block>

      {/* The two things that are not a source: where sources bind, and the one
          you wish we carried. */}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const trimmed = wanted.trim();
          if (trimmed && !request.isPending) request.mutate(trimmed);
        }}
      >
        <Line
          label="Point a connector at something else"
          sub="Which repo, team, channel or database each one reads, and any two-sided edit waiting to be settled."
        >
          <Link to="/sync" className="sp-btn" data-variant="ghost">
            Open sync
          </Link>
        </Line>
        <Line label="Ask for a connector we do not carry">
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
        All connectors
      </Button>
    </div>
  );

  // The route validates ?connector= against the registry; this guards a
  // hand-edited URL that slips a non-user-facing provider through.
  if (!spec || spec.userFacing === false) {
    return (
      <Empty action={<Button onClick={onBack}>All connectors</Button>}>
        No connector by that name.
      </Empty>
    );
  }

  // This whole drill is ABOUT one provider, so the provider is the subject and
  // the mark earns its brand hue here as it does in the catalogue. Sized to the
  // title beside it, inline, no tile (ban 8).
  const titled = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--sp-space-2)" }}>
      <ProviderMark provider={provider} tone="brand" size={20} />
      {spec.label}
    </span>
  );

  if (list.isLoading || bindingsQ.isLoading || (isSuite && suite.isLoading)) {
    return (
      <>
        {back}
        <Loading>Reading {spec.label}.</Loading>
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
        <PageHead title={titled} />
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
        <PageHead title={titled} sub={spec.description} />
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
        <PageHead title={titled} sub={spec.description} />
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
          title={titled}
          sub={`${spec.description} Connect it once and what it syncs starts feeding the shared brain.`}
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
        title={titled}
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
                  {/* The registry's own word for this resource ("Repository",
                    "Stakeholder digest channel"), never the stored key. A kind
                    the registry does not carry falls through rather than
                    printing nothing. */}
                  {spec.resourceTypes.find((rt) => rt.kind === b.resource_kind)?.label ??
                    b.resource_kind}
                  {b.owner_display ? <> · bound by {b.owner_display}</> : null}
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
