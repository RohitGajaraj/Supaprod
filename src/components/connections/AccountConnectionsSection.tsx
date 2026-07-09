import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
  verifyConnection,
  disconnectConnection,
  deleteConnection,
  type ConnectionRow as AccountConnection,
  type ProviderAvailability,
} from "@/lib/connections.functions";
import {
  listMyCalendarConnections,
  saveCalendarConnection,
  startCalendarConnect,
  disconnectCalendar,
} from "@/lib/calendar-connections.functions";
import { connectAppUser } from "@/integrations/lovable/appUserConnectorClient";
import { useConfirm } from "@/hooks/use-confirm";
import { DrillHeader, MonoLabel, StepDot } from "@/components/cadence/Primitives";
import { ProviderLogo } from "./ProviderLogo";
import { RequestConnectorCard } from "./RequestConnectorCard";
import { latestIso, relTimeCaps } from "@/components/discover/format";

// F-CONN Phase 2: Settings, "Connections", the single home for account-level
// sources, reworked into a Lovable-style TWO-PANE layout (2026-07-06). A left
// rail carries live search, the Connected/All status counts, and the catalog
// categories (each with its count); the right pane is ONE unified card grid of
// every user-facing provider, filtered by that rail. Each card resolves to one
// of four states via statusFor(): connected (green pill, clickable into the
// ConnectorDetail drill), env-active (muted-green "Active" pill, also clickable),
// OAuth-configured (a real Connect button), or coming soon (disabled, setup
// hint on hover). Every card carries the real brand logo (ProviderLogo, inline
// simple-icons marks in official brand color). OAuth-only: GitHub uses the App
// install redirect; everything else goes through the Lovable connector gateway
// popup (tokens stay in the gateway, we persist only the connection id). The two
// calendar providers connect through the existing calendar connection layer
// (listMyCalendarConnections / startCalendarConnect / saveCalendarConnection),
// same popup driver as the old CalendarAccountsSection. Per-connection
// management (verify / disconnect / bindings) lives in the ConnectorDetail
// drill; workspace-level resource bindings live on /sync, linked from the rail.
// Anchorable via /settings?section=connections.
//
// Screen 6 (loop-detail drill-downs) adds ConnectorDetail - the per-provider
// drill ported from design-reference/cadence/loop-detail.jsx (ConnectorDetail,
// lines 243-292) onto real data, exported from this file and rendered by the
// settings route when ?connector= is set. The connect/verify mutations are
// shared between the list and the detail via the local useConnectorActions
// hook so both surfaces drive the exact same OAuth flows. Four states: setup
// required (no OAuth app AND no env token - genuinely "coming soon"), active
// via an admin-managed env credential (envConfigured, no personal OAuth to
// offer), configured-but-not-connected (real Connect flow), and connected.

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

// Registry providers backed by the calendar connection layer (multi-account,
// stored in user_calendar_connections - not the connections table).
const CALENDAR_PROVIDERS: Partial<Record<ProviderId, "google" | "microsoft">> = {
  google_calendar: "google",
  microsoft_outlook: "microsoft",
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
  return false; // legacy api_key - OAuth migration pending, treat as setup-required
}

/** True when the provider's admin-managed env-fallback token is set: Cadence
 *  is already reading through it even with no per-user OAuth connection, so
 *  the UI must show it as active rather than "coming soon" (founder ruling
 *  2026-07-06). Shared by the list badge (statusFor) and ConnectorDetail's
 *  third state so both surfaces agree on what "active" means. */
function providerEnvActive(
  spec: ProviderSpec,
  availability: ProviderAvailability | undefined,
): boolean {
  return !!availability?.[spec.id]?.envConfigured;
}

/**
 * The connect/verify flows, shared between the "Connected accounts" list and
 * the ConnectorDetail drill-down (one implementation, two surfaces). GitHub is
 * a full-page App-install redirect; gateway providers and calendars use the
 * connector-gateway popup (web_message) and persist only the connection id.
 */
function useConnectorActions(qc: QueryClient) {
  const fStartGithub = useServerFn(startGithubAppConnect);
  const fStartGateway = useServerFn(startGatewayConnect);
  const fSaveGateway = useServerFn(saveGatewayConnection);
  const fVerify = useServerFn(verifyConnection);
  const fCalStart = useServerFn(startCalendarConnect);
  const fCalSave = useServerFn(saveCalendarConnection);

  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Clean up polling interval on unmount to prevent lingering queries after navigation.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const mGithub = useMutation({
    mutationFn: () => fStartGithub(),
    onSuccess: ({ installUrl }) => {
      // Open GitHub in a new tab so the user keeps their place in the app.
      // The callback writes to the DB; the parent tab detects it via polling.
      window.open(installUrl, "_blank", "noopener");
      const deadline = Date.now() + 5 * 60 * 1000;
      pollRef.current = setInterval(() => {
        qc.invalidateQueries({ queryKey: ["connections"] });
        if (Date.now() > deadline) clearInterval(pollRef.current);
      }, 3_000);
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
  // Calendar connect - exact mechanics of the legacy CalendarAccountsSection:
  // gateway popup via connectAppUser, then persist via saveCalendarConnection.
  const mCalConnect = useMutation({
    mutationFn: async (provider: "google" | "microsoft") => {
      const result = await connectAppUser({
        connectorId: provider === "google" ? "google_calendar" : "microsoft_outlook",
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: (targetOrigin) => fCalStart({ data: { provider, targetOrigin } }),
      });
      if (!result.success || !result.connectionId)
        throw new Error(result.error ?? "Connect failed");
      return fCalSave({ data: { provider, connectionId: result.connectionId } });
    },
    onSuccess: () => {
      toast.success("Calendar connected");
      qc.invalidateQueries({ queryKey: ["calendar-connections"] });
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
    mGithub.isPending || mGateway.isPending || mCalConnect.isPending || mVerify.isPending;

  return { mGithub, mGateway, mCalConnect, mVerify, busy };
}

// Per-provider status the grid renders and the rail counts.
type CardStatus = "connected" | "active" | "connect" | "soon";

/** A left-rail filter row: label + right-aligned count; active fills the raised
 *  surface and reads its count in the ember index tone. */
function RailRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        textAlign: "left",
        padding: "6px 10px",
        borderRadius: "var(--radius-control)",
        background: active ? "var(--surface-raised)" : "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          color: active ? "var(--text-primary)" : "var(--text-body)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: active ? "var(--ember)" : "var(--text-faint)",
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    </button>
  );
}

/** The green outcome pill (Connected / Active). "moss" is the brighter chip
 *  tone; "muted" is the quieter env-active read. */
function StatusPill({
  tone,
  title,
  children,
}: {
  tone: "moss" | "muted";
  title?: string;
  children: string;
}) {
  const color = tone === "moss" ? "var(--moss-bright)" : "var(--moss)";
  const bg =
    tone === "moss"
      ? "color-mix(in oklab, var(--moss) 16%, transparent)"
      : "color-mix(in oklab, var(--moss) 9%, transparent)";
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        background: bg,
        borderRadius: 99,
        padding: "4px 10px",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: 99, background: color }} />
      {children}
    </span>
  );
}

/** The right-edge status affordance for one card: a Connected/Active pill, a
 *  Connect button (real OAuth flow), or a quiet disabled "coming soon". */
function ConnectStatus({
  status,
  spec,
  busy,
  onConnect,
}: {
  status: CardStatus;
  spec: ProviderSpec;
  busy: boolean;
  onConnect: () => void;
}) {
  if (status === "connected") return <StatusPill tone="moss">Connected</StatusPill>;
  if (status === "active") {
    return (
      <StatusPill tone="muted" title="Reading through a workspace token">
        Active
      </StatusPill>
    );
  }
  if (status === "connect") {
    return (
      <button
        type="button"
        className="btn btn-secondary btn-sm loom-press"
        disabled={busy}
        onClick={(ev) => {
          ev.stopPropagation();
          onConnect();
        }}
      >
        Connect
      </button>
    );
  }
  return (
    <span
      title={setupHintFor(spec)}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-faint)",
        whiteSpace: "nowrap",
      }}
    >
      Coming soon
    </span>
  );
}

export function AccountConnectionsSection({
  onOpenDetail,
}: {
  /** Opens the ConnectorDetail drill-down; the route navigates with ?connector=. */
  onOpenDetail: (provider: ProviderId) => void;
}) {
  const qc = useQueryClient();

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
    else if (error === "github_connect") {
      toast.error("GitHub connect failed. Try again or check the app installation.");
    }
    params.delete("connected");
    params.delete("error");
    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, []);

  const fList = useServerFn(listConnections);
  const fCalList = useServerFn(listMyCalendarConnections);

  const list = useQuery({ queryKey: ["connections"], queryFn: () => fList() });
  const calendars = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: () => fCalList(),
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
  const { mGithub, mGateway, mCalConnect, busy } = useConnectorActions(qc);

  const byProvider = new Map<ProviderId, AccountConnection[]>();
  for (const c of list.data?.connections ?? []) {
    const arr = byProvider.get(c.provider) ?? [];
    arr.push(c);
    byProvider.set(c.provider, arr);
  }
  const calendarAccounts = calendars.data?.connections ?? [];

  // End-user providers only: internal/service connectors (firecrawl, anything
  // flagged userFacing: false in the registry) never render here.
  const visibleProviders = Object.values(CONNECTOR_REGISTRY).filter(
    (spec) => spec.id !== "firecrawl" && spec.userFacing !== false,
  );

  const availability = list.data?.providerAvailability;

  // A provider is "connected" when it has at least one account row (connections
  // table) or one calendar account.
  const isConnected = (spec: ProviderSpec): boolean => {
    const cal = CALENDAR_PROVIDERS[spec.id];
    if (cal) return calendarAccounts.some((c) => c.provider === cal);
    return (byProvider.get(spec.id)?.length ?? 0) > 0;
  };

  // Four states, resolved once per provider (same logic drives the card badge
  // and the rail's Connected count): a live connection, an env-active workspace
  // token, an OAuth app that is configured (real Connect), or coming soon.
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
  // there is no real timestamp yet, so the card falls back to its flow label
  // rather than inventing a time.
  const lastActivityFor = (spec: ProviderSpec): { iso: string; verb: string } | null => {
    const cal = CALENDAR_PROVIDERS[spec.id];
    if (cal) {
      const iso = latestIso(
        calendarAccounts.filter((c) => c.provider === cal).map((c) => c.last_sync_at),
      );
      return iso ? { iso, verb: "SYNCED" } : null;
    }
    const iso = latestIso((byProvider.get(spec.id) ?? []).map((c) => c.last_verified_at));
    return iso ? { iso, verb: "VERIFIED" } : null;
  };

  // The connect flow for a not-yet-connected provider (GitHub App redirect,
  // calendar popup, or the gateway OAuth popup) is unchanged.
  const connectProvider = (spec: ProviderSpec) => {
    const cal = CALENDAR_PROVIDERS[spec.id];
    if (cal) mCalConnect.mutate(cal);
    else if (spec.authMethods.some((m) => m.kind === "github_app")) mGithub.mutate();
    else mGateway.mutate(spec);
  };

  // The one canonical catalog, flattened, each entry carrying its category so
  // the unified grid can be filtered without per-category section headers.
  const allEntries = useMemo(() => {
    const out: { entry: CatalogEntry; category: ConnectorCategory; categoryLabel: string }[] = [];
    for (const g of buildConnectorCatalog()) {
      for (const e of g.entries) out.push({ entry: e, category: g.id, categoryLabel: g.label });
    }
    return out;
  }, []);
  const categories = useMemo(
    () =>
      buildConnectorCatalog().map((g) => ({
        id: g.id,
        label: g.label,
        count: g.entries.length,
      })),
    [],
  );

  // Left-rail filters: live search + status (all | connected) + one category.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "connected">("all");
  const [categoryFilter, setCategoryFilter] = useState<ConnectorCategory | null>(null);
  const resetAll = () => {
    setStatusFilter("all");
    setCategoryFilter(null);
  };

  const connectedCount = visibleProviders.filter(isConnectedish).length;
  const allCount = allEntries.length;

  const q = query.trim().toLowerCase();
  const filtered = allEntries.filter((a) => {
    const spec = CONNECTOR_REGISTRY[a.entry.id];
    if (statusFilter === "connected" && !isConnectedish(spec)) return false;
    if (categoryFilter && a.category !== categoryFilter) return false;
    if (!q) return true;
    return (
      a.entry.label.toLowerCase().includes(q) ||
      a.entry.description.toLowerCase().includes(q) ||
      a.categoryLabel.toLowerCase().includes(q)
    );
  });

  return (
    <div id="connections" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* LEFT RAIL: search, status counts, categories, request box + sync link. */}
      <aside
        style={{
          width: 210,
          flexShrink: 0,
          position: "sticky",
          top: 16,
          alignSelf: "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sources"
          aria-label="Search sources"
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RailRow
            label="Connected"
            count={connectedCount}
            active={statusFilter === "connected"}
            onClick={() => setStatusFilter("connected")}
          />
          <RailRow
            label="All"
            count={allCount}
            active={statusFilter === "all" && categoryFilter === null}
            onClick={resetAll}
          />
        </div>

        <div>
          <MonoLabel style={{ marginBottom: 8, display: "block" }}>Categories</MonoLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {categories.map((c) => (
              <RailRow
                key={c.id}
                label={c.label}
                count={c.count}
                active={categoryFilter === c.id}
                onClick={() => setCategoryFilter((prev) => (prev === c.id ? null : c.id))}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--hairline)",
            paddingTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <RequestConnectorCard compact />
          <Link
            to="/sync"
            className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
            style={{ fontSize: 12, color: "var(--text-subtle)" }}
          >
            Workspace sync and bindings →
          </Link>
        </div>
      </aside>

      {/* RIGHT PANE: compact hero + one unified, filtered card grid. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ marginBottom: 16 }}>
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 460,
              fontSize: 20,
              lineHeight: 1.2,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Connect what you already use
          </h3>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--text-subtle)",
              margin: "6px 0 0",
              maxWidth: 480,
            }}
          >
            Bring your tools in as sources; Cadence reads them into the loop.
          </p>
        </header>

        {list.isLoading ? (
          <div className="mono-label" style={{ color: "var(--text-faint)", padding: "24px 0" }}>
            loading…
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "var(--text-subtle)", padding: "12px 0" }}>
            No sources match your filter.{" "}
            <button
              type="button"
              onClick={resetAll}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 12.5,
                color: "var(--glacier)",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            }}
          >
            {filtered.map(({ entry: e }) => {
              const spec = CONNECTOR_REGISTRY[e.id];
              const status = statusFor(spec);
              const clickable = status === "connected" || status === "active";
              const activity = clickable ? lastActivityFor(spec) : null;
              const open = () => onOpenDetail(e.id);
              return (
                <div
                  key={e.id}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? `Open ${e.label} details` : undefined}
                  onClick={clickable ? open : undefined}
                  onKeyDown={
                    clickable
                      ? (ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            open();
                          }
                        }
                      : undefined
                  }
                  className={clickable ? "loom-press" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: "var(--radius-card, 12px)",
                    background: "var(--card)",
                    border: "1px solid var(--hairline)",
                    cursor: clickable ? "pointer" : "default",
                    opacity: status === "soon" ? 0.62 : 1,
                    outline: "none",
                  }}
                >
                  <ProviderLogo provider={e.id} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontSize: 13.5,
                        lineHeight: 1.3,
                      }}
                    >
                      {e.label}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-subtle)",
                        margin: "3px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {e.description}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 5,
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: activity ? "var(--text-subtle)" : "var(--text-faint)",
                      }}
                      className={activity ? "tabular-nums" : undefined}
                    >
                      {activity ? `${activity.verb} ${relTimeCaps(activity.iso)}` : e.flowLabel}
                    </span>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                    <ConnectStatus
                      status={status}
                      spec={spec}
                      busy={busy}
                      onConnect={() => connectProvider(spec)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- ConnectorDetail - the screen-6 drill-down, ported from
   design-reference/cadence/loop-detail.jsx ConnectorDetail (lines 243-292)
   onto real data. Rendered by the settings route when ?connector= is set; it
   replaces the whole Connections tab body. Three states: setup required
   (env missing), configured-but-not-connected (real Connect flow), and
   connected (stat row + workspace bindings + per-account table); the first
   renders as "coming soon" (RF-08) rather than an implied Connect promise.
   Reads the
   SAME query keys as the list (["connections"], ["workspace-bindings"],
   ["calendar-connections"]) so the cache is shared. Reference elements with
   no production data source are omitted per the no-filler law - see the
   screen-6 build-log entry. ---- */

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const detailRowStyle = (i: number, len: number): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: "1fr 110px 90px",
  gap: 12,
  padding: "11px 18px",
  borderBottom: i < len - 1 ? "1px solid var(--hairline)" : "none",
  fontSize: 12.5,
  alignItems: "center",
});

export function ConnectorDetail({
  provider,
  onBack,
}: {
  provider: ProviderId;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { mGithub, mGateway, mCalConnect, mVerify, busy } = useConnectorActions(qc);

  const fDisconnect = useServerFn(disconnectConnection);
  const fDelete = useServerFn(deleteConnection);
  const fCalDisconnect = useServerFn(disconnectCalendar);
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
  const mCalDisconnect = useMutation({
    mutationFn: (id: string) => fCalDisconnect({ data: { id } }),
    onSuccess: () => {
      toast.success("Disconnected");
      qc.invalidateQueries({ queryKey: ["calendar-connections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const manageBusy = mDisconnect.isPending || mDelete.isPending || mCalDisconnect.isPending;

  const spec = CONNECTOR_REGISTRY[provider];
  const calProvider = CALENDAR_PROVIDERS[provider];
  const isCalendar = calProvider !== undefined;

  const fList = useServerFn(listConnections);
  const fBindings = useServerFn(listWorkspaceBindings);
  const fCalList = useServerFn(listMyCalendarConnections);

  const list = useQuery({ queryKey: ["connections"], queryFn: () => fList() });
  const bindingsQ = useQuery({ queryKey: ["workspace-bindings"], queryFn: () => fBindings() });
  const calendars = useQuery({
    queryKey: ["calendar-connections"],
    queryFn: () => fCalList(),
    enabled: isCalendar,
  });

  // The route validates ?connector= against the registry; this guards a
  // hand-edited URL that slips a non-user-facing provider through.
  if (!spec || spec.userFacing === false) {
    return (
      <div className="bento fade-up" style={{ padding: "var(--card-pad)" }}>
        <div className="mono-label" style={{ marginBottom: 10 }}>
          No such connector
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          Back · all connections
        </button>
      </div>
    );
  }

  if (list.isLoading || bindingsQ.isLoading || (isCalendar && calendars.isLoading)) {
    return (
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink-faint)",
          padding: "32px 0",
          textAlign: "center",
        }}
      >
        Loading {spec.label}…
      </div>
    );
  }

  const configured = providerConfigured(spec, list.data?.providerAvailability);
  const envActive = providerEnvActive(spec, list.data?.providerAvailability);
  const hint = setupHintFor(spec);
  const conns = (list.data?.connections ?? []).filter((c) => c.provider === provider);
  const calAccounts = isCalendar
    ? (calendars.data?.connections ?? []).filter((c) => c.provider === calProvider)
    : [];

  const connect = () => {
    if (calProvider) mCalConnect.mutate(calProvider);
    else if (spec.authMethods.some((m) => m.kind === "github_app")) mGithub.mutate();
    else mGateway.mutate(spec);
  };

  /* -- Active via an admin-managed env credential (envConfigured), no
     per-user OAuth registered (gatewayConfigured false): Cadence is already
     reading through the workspace token, so there is nothing for THIS user
     to Connect. Showing "coming soon" with a disabled button here would be
     misleading - the list card already badges this provider "Active"
     (founder ruling 2026-07-06). -- */
  if (envActive && !configured && conns.length === 0 && calAccounts.length === 0) {
    return (
      <div className="fade-up">
        <DrillHeader
          onBack={onBack}
          backLabel="All connections"
          kicker="Connector · active via admin credential"
          title={spec.label}
        />
        <div
          className="bento"
          style={{ padding: "var(--card-pad)", display: "flex", alignItems: "center", gap: 14 }}
        >
          <StatusPill tone="muted" title="Reading through a workspace-level server credential">
            Active
          </StatusPill>
          <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-subtle)" }}>
            {spec.description} Already connected through an admin-managed server credential - there
            is nothing for you to connect personally.
          </span>
        </div>
      </div>
    );
  }

  /* -- Not configured: the admin hasn't registered the OAuth app yet. -- */
  if (!configured && conns.length === 0 && calAccounts.length === 0) {
    return (
      <div className="fade-up">
        <DrillHeader
          onBack={onBack}
          backLabel="All connections"
          kicker="Connector · coming soon"
          title={spec.label}
        />
        <div
          className="bento"
          style={{ padding: "var(--card-pad)", display: "flex", alignItems: "center", gap: 14 }}
        >
          <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-subtle)" }}>
            {spec.description} {hint}
          </span>
          <button type="button" className="btn btn-primary btn-sm" disabled title={hint}>
            Connect
          </button>
        </div>
      </div>
    );
  }

  /* -- Configured, no connection yet: the real OAuth connect flow. -- */
  if (isCalendar ? calAccounts.length === 0 : conns.length === 0) {
    return (
      <div className="fade-up">
        <DrillHeader
          onBack={onBack}
          backLabel="All connections"
          kicker="Connector · not connected"
          title={spec.label}
        />
        <div
          className="bento"
          style={{ padding: "var(--card-pad)", display: "flex", alignItems: "center", gap: 14 }}
        >
          <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-subtle)" }}>
            {spec.description} Connect it once and what it syncs starts feeding the company brain.
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={connect}
          >
            Connect {spec.label}
          </button>
        </div>
      </div>
    );
  }

  /* -- Connected: stat row, workspace bindings, per-account table. -- */
  const primary = conns[0]; // listConnections orders by created_at ascending
  const earliest = isCalendar ? calAccounts[0]?.created_at : primary?.created_at;
  const since = earliest
    ? new Date(earliest).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const statusText = isCalendar ? "connected" : primary.status;
  const lastSync = calAccounts.reduce<string | null>(
    (acc, c) => (c.last_sync_at && (!acc || c.last_sync_at > acc) ? c.last_sync_at : acc),
    null,
  );

  const stats: [string, string, string | undefined][] = isCalendar
    ? [
        ["Last sync", lastSync ? shortDate(lastSync) : "never", undefined],
        ["Accounts", String(calAccounts.length), undefined],
        ["Status", "connected", "var(--emerald)"],
      ]
    : [
        [
          "Last verified",
          primary.last_verified_at ? shortDate(primary.last_verified_at) : "never",
          undefined,
        ],
        ["Accounts", String(conns.length), undefined],
        [
          "Status",
          primary.status,
          primary.status === "connected"
            ? "var(--emerald)"
            : primary.status === "error"
              ? "var(--rose)"
              : undefined,
        ],
      ];

  const provBindings = (bindingsQ.data?.bindings ?? []).filter((b) => b.provider === provider);

  return (
    <div className="fade-up">
      <DrillHeader
        onBack={onBack}
        backLabel="All connections"
        kicker={`Connector${since ? ` · since ${since}` : ""} · ${statusText}`}
        title={spec.label}
        right={
          isCalendar ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy}
                onClick={() => mCalConnect.mutate(calProvider)}
              >
                Connect another account
              </button>
              {calAccounts.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy || manageBusy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Disconnect this calendar?",
                      body: "Stored events stay but no further sync will happen.",
                      confirmLabel: "Disconnect",
                      destructive: true,
                    });
                    if (ok) mCalDisconnect.mutate(calAccounts[0]!.id);
                  }}
                >
                  Disconnect
                </button>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy}
                onClick={() => mVerify.mutate(primary.id)}
              >
                Verify
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
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
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy || manageBusy}
                style={{ color: "var(--rose)" }}
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
              </button>
            </div>
          )
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {stats.map(([l, v, color]) => (
          <div key={l} className="bento" style={{ padding: "var(--card-pad)" }}>
            <MonoLabel style={{ marginBottom: 6 }}>{l}</MonoLabel>
            <div className="font-display tabular-nums" style={{ fontSize: 22, color }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 12 }}>
        <div className="bento" style={{ padding: "var(--card-pad)" }}>
          <MonoLabel style={{ marginBottom: 10 }}>What it feeds · workspace bindings</MonoLabel>
          {provBindings.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-subtle)", margin: 0 }}>
              No workspace bindings yet. Bind repos, projects, or pages under workspace sync and
              bindings.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              {provBindings.map((b) => (
                <li
                  key={b.id}
                  style={{ fontSize: 12.5, color: "var(--ink-muted)", display: "flex", gap: 8 }}
                >
                  <StepDot status={b.connection_status === "connected" ? "completed" : "failed"} />
                  <span>
                    {b.resource_label ?? b.resource_id} · {b.resource_kind}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bento" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="mono-label"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 90px",
              gap: 12,
              padding: "10px 18px",
              borderBottom: "1px solid var(--hairline)",
            }}
          >
            <span>Account</span>
            <span>Status</span>
            <span>{isCalendar ? "Synced" : "Verified"}</span>
          </div>
          {isCalendar
            ? calAccounts.map((c, i) => (
                <div key={c.id} style={detailRowStyle(i, calAccounts.length)}>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {c.account_email ?? c.display_name ?? "Connected"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--ink-muted)",
                    }}
                  >
                    <StepDot status="completed" />
                    connected
                  </span>
                  <span className="mono-label tabular-nums">
                    {c.last_sync_at ? shortDate(c.last_sync_at) : "-"}
                  </span>
                </div>
              ))
            : conns.map((c, i) => (
                <div key={c.id} style={detailRowStyle(i, conns.length)}>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {c.account_label ?? c.account_email ?? "Connected"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--ink-muted)",
                    }}
                  >
                    <StepDot
                      status={
                        c.status === "connected"
                          ? "completed"
                          : c.status === "error"
                            ? "failed"
                            : "planned"
                      }
                    />
                    {c.status}
                  </span>
                  <span className="mono-label tabular-nums">
                    {c.last_verified_at ? shortDate(c.last_verified_at) : "-"}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
