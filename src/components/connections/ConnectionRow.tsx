import type { ReactNode } from "react";
import { StatusDot } from "@/components/obsidian";
import type { ConnectionRow as AccountConnection } from "@/lib/connections.functions";
import type { ProviderId } from "@/lib/connectors/registry";
import { ProviderLogo } from "./ProviderLogo";

// OBS-13 §8 connection-card anatomy. Provider · scope · owner · glowing
// status word · last sync (mono) · permissions · ONE action. Presentational
// only - every mutation (connect/verify/disconnect/remove) stays wired
// exactly as before; this file only changes how the row looks.

function timeAgoCaps(iso: string | null): string {
  if (!iso) return "NEVER";
  const mins = Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  return `${Math.round(hrs / 24)}D AGO`;
}

function connectionState(c: AccountConnection): "live" | "stale" | "failing" {
  if (c.status === "error") return "failing";
  const ageMs = c.last_verified_at
    ? Date.now() - +new Date(c.last_verified_at)
    : Number.POSITIVE_INFINITY;
  return ageMs > 24 * 60 * 60 * 1000 ? "stale" : "live";
}

function MetaLine({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.10em",
        color: "var(--text-faint)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        marginTop: 3,
      }}
      className="uppercase"
    >
      {children}
    </div>
  );
}

function GhostAction({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      // Background lives in classes so hover/active can win over rest state
      // (inline styles beat utilities). Transitions are killed globally under
      // prefers-reduced-motion.
      className="outline-none transition-colors [background-color:var(--raised)] enabled:hover:[background-color:var(--hover)] enabled:active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        padding: "7px 14px",
        borderRadius: "var(--radius-control)",
        color: "var(--text-primary)",
        border: "none",
        flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function QuietTextAction({
  onClick,
  disabled,
  title,
  tone = "subtle",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: "subtle" | "madder";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="uppercase outline-none enabled:hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.10em",
        color: tone === "madder" ? "var(--madder)" : "var(--text-subtle)",
        background: "transparent",
        border: "none",
        padding: 0,
        flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** Not-yet-connected row: no glowing status (the §8 vocabulary is for an
 * existing connection); a quiet muted word plus the one Connect action.
 * `envActive` is a third state - an admin-managed server credential
 * (envFallback) already makes this provider live even with no per-user
 * OAuth connection, so there is nothing for THIS user to Connect. Rendering
 * "coming soon" with a disabled button in that case is misleading (founder
 * ruling 2026-07-06); instead show the same glowing-status vocabulary a real
 * connection uses (see ConnectedRow below), with the word "ACTIVE". */
function NotConnectedRow({
  hint,
  onConnect,
  busy,
  configured,
  envActive = false,
}: {
  hint?: string;
  onConnect: () => void;
  busy: boolean;
  configured: boolean;
  envActive?: boolean;
}) {
  if (envActive && !configured) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <StatusDot
          state="live"
          word="ACTIVE"
          title="Already connected through an admin-managed server credential - there is nothing for you to connect personally."
        />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <span
        title={hint}
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.10em",
          color: "var(--text-faint)",
        }}
        className="uppercase"
      >
        {configured ? "not connected" : "coming soon"}
      </span>
      <GhostAction
        onClick={onConnect}
        disabled={busy || !configured}
        title={configured ? undefined : hint}
      >
        Connect
      </GhostAction>
    </div>
  );
}

/** One stored connection rendered per the §8 anatomy: glowing status word +
 * ONE visible verb (Reconnect when failing, else Disconnect), with Verify as
 * quiet secondary text. LOOM QA R2 (destructive-actions convention): Remove
 * no longer sits beside Disconnect unexplained — removal lives BEHIND
 * disconnect. A live row offers Disconnect; once the credential is gone
 * (status "disconnected") the row's one action becomes Remove, whose confirm
 * names the consequence (bindings deleted, irreversible). */
function ConnectedRow({
  connection: c,
  busy,
  onVerify,
  onDisconnect,
  onRemove,
}: {
  connection: AccountConnection;
  busy: boolean;
  onVerify?: (c: AccountConnection) => void;
  onDisconnect?: (c: AccountConnection) => void;
  onRemove?: (c: AccountConnection) => void;
}) {
  if (c.status === "disconnected") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-3x)", flexShrink: 0 }}>
        <StatusDot
          state="queued"
          word="DISCONNECTED"
          title="The stored credential is deleted. Remove clears the record and its workspace bindings."
        />
        {onRemove ? (
          <GhostAction
            onClick={() => onRemove(c)}
            disabled={busy}
            title="Deletes this connection record and every workspace binding that uses it."
          >
            Remove
          </GhostAction>
        ) : null}
      </div>
    );
  }

  const state = connectionState(c);
  const word = state === "failing" ? "FAILING" : state === "stale" ? "STALE" : "LIVE";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-3x)", flexShrink: 0 }}>
      <StatusDot state={state} word={word} title={c.status_detail ?? undefined} />
      {onVerify ? (
        <QuietTextAction onClick={() => onVerify(c)} disabled={busy}>
          Verify
        </QuietTextAction>
      ) : null}
      <GhostAction onClick={() => onDisconnect?.(c)} disabled={busy}>
        {state === "failing" ? "Reconnect" : "Disconnect"}
      </GhostAction>
    </div>
  );
}

export function ConnectionRow({
  provider,
  label,
  configured,
  envActive = false,
  setupHint,
  busy,
  onConnect,
  connections = [],
  onVerify,
  onDisconnect,
  onRemove,
  accounts,
  onDisconnectAccount,
  onDetails,
}: {
  /** The connector this row represents; drives the brand logo tile. */
  provider: ProviderId;
  /** Accepted for caller compatibility; the brand logo comes from `provider` (ProviderLogo), so this is no longer rendered. */
  icon?: unknown;
  label: string;
  /** Accepted for caller compatibility; the §8 anatomy's mono metadata line replaces the free-text sentence this used to render. */
  description?: string;
  configured: boolean;
  /** True when an admin-managed env credential already makes this provider
   *  active with no per-user OAuth connection (founder ruling 2026-07-06) -
   *  drives the third NotConnectedRow state instead of "coming soon". */
  envActive?: boolean;
  setupHint?: string;
  busy: boolean;
  onConnect: () => void;
  /** Account-level rows from the connections table (non-calendar providers). */
  connections?: AccountConnection[];
  onVerify?: (c: AccountConnection) => void;
  onDisconnect?: (c: AccountConnection) => void;
  onRemove?: (c: AccountConnection) => void;
  /** Calendar providers only: connected accounts, each rendered as a sub-row. */
  accounts?: { id: string; label: string }[];
  onDisconnectAccount?: (id: string) => void;
  /** Opens the ConnectorDetail drill-down for this provider. */
  onDetails?: () => void;
}) {
  const primary = connections[0];
  const extras = connections.slice(1);
  const hasSubRows = (accounts !== undefined && accounts.length > 0) || extras.length > 0;
  const permissions = primary?.scopes?.length ? primary.scopes.join(" · ").toUpperCase() : null;

  return (
    <div style={configured || envActive ? undefined : { opacity: 0.6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-3x)", padding: "13px 0" }}>
        <ProviderLogo provider={provider} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontWeight: 500, lineHeight: 1.4, color: "var(--text-primary)" }}
          >
            {label}
          </div>
          <MetaLine>
            <span>SCOPE &middot; PERSONAL</span>
            <span>&middot;</span>
            <span>OWNER &middot; YOU</span>
            {primary ? (
              <>
                <span>&middot;</span>
                {/* last_verified_at is a credential check, not a data sync — name it honestly. */}
                <span>LAST CHECK &middot; {timeAgoCaps(primary.last_verified_at)}</span>
              </>
            ) : null}
            {primary &&
            primary.status !== "disconnected" &&
            connectionState(primary) === "stale" ? (
              // LOOM QA R2: STALE explained where it appears — the credential
              // is only re-checked when it is used or when you press Verify.
              <>
                <span>&middot;</span>
                <span style={{ color: "var(--text-subtle)" }}>
                  STALE &middot; NO CHECK IN OVER A DAY &middot; VERIFY RE-CHECKS IT
                </span>
              </>
            ) : null}
            {permissions ? (
              <>
                <span>&middot;</span>
                <span>{permissions}</span>
              </>
            ) : null}
          </MetaLine>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {onDetails ? (
            <QuietTextAction onClick={onDetails} tone="subtle">
              details &rarr;
            </QuietTextAction>
          ) : null}
          {accounts !== undefined ? (
            // Calendar: multi-account — Connect stays available to add another.
            configured ? (
              <>
                {accounts.length > 0 ? <StatusDot state="live" word="LIVE" /> : null}
                <GhostAction onClick={onConnect} disabled={busy}>
                  Connect
                </GhostAction>
              </>
            ) : (
              <NotConnectedRow
                hint={setupHint}
                onConnect={onConnect}
                busy={busy}
                configured={configured}
                envActive={envActive}
              />
            )
          ) : primary ? (
            <ConnectedRow
              connection={primary}
              busy={busy}
              onVerify={onVerify}
              onDisconnect={onDisconnect}
              onRemove={onRemove}
            />
          ) : configured ? (
            <GhostAction onClick={onConnect} disabled={busy}>
              Connect
            </GhostAction>
          ) : (
            <NotConnectedRow
              hint={setupHint}
              onConnect={onConnect}
              busy={busy}
              configured={configured}
              envActive={envActive}
            />
          )}
        </div>
      </div>

      {hasSubRows ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingBottom: 12,
            paddingLeft: 44,
          }}
        >
          {accounts?.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StatusDot state="live" word="LIVE" />
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--text-body)",
                }}
              >
                {a.label}
              </span>
              <QuietTextAction
                onClick={() => onDisconnectAccount?.(a.id)}
                disabled={busy}
                title="Disconnect this account"
                tone="madder"
              >
                Remove
              </QuietTextAction>
            </div>
          ))}
          {extras.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ConnectedRow
                connection={c}
                busy={busy}
                onVerify={onVerify}
                onDisconnect={onDisconnect}
                onRemove={onRemove}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
