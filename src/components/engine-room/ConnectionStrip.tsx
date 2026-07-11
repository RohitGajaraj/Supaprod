import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listWorkspaceBindings } from "@/lib/connections.functions";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";

/** Brand-true provider label ("GitHub", not css-capitalized "Github"). */
function providerLabel(provider: string): string {
  return CONNECTOR_REGISTRY[provider as ProviderId]?.label ?? provider;
}

/** Connection glance strip (§7). Connections live in Settings / Connections
 * (one home); this is a read-only glance, never a Connect/manage action.
 *
 * LOOM §9b honesty: the strip reads the workspace's real bindings. The old
 * strip hardcoded "ACME/LUMEN-APP · CONNECTED BY ROHIT · LIVE · SYNCED 4 MIN
 * AGO" - a fabricated connection on every workspace. Numbers and states are
 * real or absent now; there is no sync heartbeat, so no "synced X ago". */
export function ConnectionStrip() {
  const fBindings = useServerFn(listWorkspaceBindings);
  const q = useQuery({
    queryKey: ["workspace-bindings"],
    queryFn: () => fBindings(),
  });

  // Tempo v5 §4: fill/radius/shadow come from the material-small preset
  // (className below), not a hand-rolled border+shadow+radius combo.
  const strip: React.CSSProperties = {
    gap: "14px",
    padding: "12px 16px",
  };

  if (q.isLoading) {
    return (
      <div className="flex items-center material-small" style={strip} aria-hidden="true">
        <span
          className="block rounded-full"
          style={{
            width: 180,
            height: 8,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.11), rgba(255,255,255,0.05))",
            backgroundSize: "280% 100%",
            animation: "cadShimmer 1.6s linear infinite",
          }}
        />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="flex flex-wrap items-center material-small" style={strip}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12.5px",
            color: "var(--madder-bright)",
          }}
        >
          Connection status did not load.
        </span>
        <button
          type="button"
          className="uppercase cursor-pointer"
          onClick={() => void q.refetch()}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.11em",
            color: "var(--glacier)",
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          RETRY
        </button>
      </div>
    );
  }

  const bindings = q.data?.bindings ?? [];

  if (bindings.length === 0) {
    return (
      <div className="flex flex-wrap items-center material-small" style={strip}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "12.5px",
            color: "var(--text-subtle)",
          }}
        >
          No sources connected to this workspace yet.
        </span>
        <span className="flex-1" />
        <Link
          to="/sync"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            color: "var(--blossom)",
            textDecoration: "none",
          }}
        >
          OPEN CONNECTIONS →
        </Link>
      </div>
    );
  }

  const shown = bindings.slice(0, 2);
  const more = bindings.length - shown.length;

  return (
    <div className="flex flex-wrap items-center material-small" style={strip}>
      {shown.map((b) => {
        const connected = b.connection_status === "connected";
        return (
          <span key={b.id} className="inline-flex items-center" style={{ gap: "10px" }}>
            <span className="text-label-13" style={{ color: "var(--text-primary)" }}>
              <strong>{providerLabel(b.provider)}</strong>
            </span>
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-floor)",
                letterSpacing: "0.06em",
                color: "var(--text-subtle)",
              }}
            >
              {b.resource_label ?? b.resource_id}
              {b.owner_display ? ` · by ${b.owner_display}` : ""}
            </span>
            <span
              className="inline-flex items-center uppercase"
              style={{
                gap: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-floor)",
                letterSpacing: "0.08em",
                color: connected ? "var(--moss-bright)" : "var(--marigold)",
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block rounded-full"
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: connected ? "var(--moss)" : "var(--marigold)",
                }}
              />
              {connected ? "CONNECTED" : b.connection_status.toUpperCase()}
            </span>
          </span>
        );
      })}
      {more > 0 ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            color: "var(--text-subtle)",
          }}
        >
          +{more} more
        </span>
      ) : null}
      <span className="flex-1" />
      <span
        style={{ fontFamily: "var(--font-ui)", fontSize: "11.5px", color: "var(--text-subtle)" }}
      >
        Connections live in Settings · one home, no duplicates
      </span>
    </div>
  );
}
