import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listWorkspaceBindings } from "@/lib/connections.functions";
import { listSyncMappings } from "@/lib/integrations.functions";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";

/** Brand-true provider label ("GitHub", not css-capitalized "Github"). */
function providerLabel(provider: string): string {
  return CONNECTOR_REGISTRY[provider as ProviderId]?.label ?? provider;
}

/** Shared link treatment for the card's one door to /sync. It carries no focus
 * treatment of its own, and the reason is worth keeping: the ring is owned by
 * meridian.css and reaches every control under a `data-mrd` root. The outline
 * utilities that used to sit here were inert. The authenticated app mounts
 * `[data-obsidian]` on <html>, `src/styles.css` carries an UNLAYERED
 * `[data-obsidian] :focus-visible` rule, and unlayered CSS beats every layer
 * whatever the specificity, so a Tailwind utility could not win no matter what
 * colour it named. Each of this component's four returns carries `data-mrd`
 * instead, which is the mechanism that actually paints. */
const doorLink: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.11em",
  textTransform: "uppercase",
  color: "var(--link)",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

/** Links must answer the pointer too, not only the keyboard. */
const linkHover = "hover:underline";

/** The 'Connections & sync' glance card (§7 + the three-honest-doors IA,
 * 2026-07-11). Connections still live in Settings / Connections (one home);
 * this card is a read-only glance AND the Engine Room's honest door to
 * /sync (bindings, conflicts, recently synced). It never grows a Connect
 * or manage action.
 *
 * LOOM §9b honesty: bindings and the conflict count are real reads (the
 * conflict read shares the /sync page's "sync-mappings" cache key). A failed
 * sync read renders as "not loaded", never as "no conflicts". */
export function ConnectionStrip() {
  const fBindings = useServerFn(listWorkspaceBindings);
  const fMappings = useServerFn(listSyncMappings);
  const q = useQuery({
    queryKey: ["workspace-bindings"],
    queryFn: () => fBindings(),
  });
  // Same key as /sync: one cached read backs the page and this glance.
  const sync = useQuery({
    queryKey: ["sync-mappings"],
    queryFn: () => fMappings(),
  });

  const conflicts = ((sync.data?.mappings ?? []) as { id: string; conflict: boolean }[]).filter(
    (m) => m.conflict,
  );

  // Tempo v5 §4: fill/radius/shadow come from the material-small preset
  // (className below), not a hand-rolled border+shadow+radius combo.
  const strip: React.CSSProperties = {
    gap: "14px",
    padding: "12px 16px",
  };

  const title = (
    <span
      className="uppercase"
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.11em",
        color: "var(--text-subtle)",
        whiteSpace: "nowrap",
      }}
    >
      Connections &amp; sync
    </span>
  );

  if (q.isLoading) {
    return (
      <div data-mrd="" className="flex items-center material-small" style={strip}>
        {title}
        <span
          aria-hidden="true"
          className="block rounded-full"
          style={{
            width: 180,
            height: 8,
            background:
              "linear-gradient(90deg, var(--ds-gray-alpha-100), var(--ds-gray-alpha-300), var(--ds-gray-alpha-100))",
            backgroundSize: "280% 100%",
            animation: "cadShimmer 1.6s linear infinite",
          }}
        />
        <span className="sr-only">Loading connection status</span>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div data-mrd="" className="flex flex-wrap items-center material-small" style={strip}>
        {title}
        <span
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--madder-bright)",
          }}
        >
          Connection status did not load.
        </span>
        <button
          type="button"
          className="uppercase cursor-pointer hover:underline active:opacity-80"
          onClick={() => {
            void q.refetch();
            if (sync.isError) void sync.refetch();
          }}
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.11em",
            color: "var(--text-primary)",
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          RETRY
        </button>
        <span className="flex-1" />
        <Link to="/sync" className={linkHover} style={doorLink}>
          OPEN SYNC &amp; BINDINGS →
        </Link>
      </div>
    );
  }

  const bindings = q.data?.bindings ?? [];

  /** The conflict verdict: real count, honest "not loaded", or quiet all-clear.
   * Status color on status only: marigold (warning) marks a real conflict;
   * everything else stays gray. */
  const conflictVerdict = sync.isLoading ? (
    <span
      aria-hidden="true"
      className="block rounded-full"
      style={{
        width: 72,
        height: 8,
        background:
          "linear-gradient(90deg, var(--ds-gray-alpha-100), var(--ds-gray-alpha-300), var(--ds-gray-alpha-100))",
        backgroundSize: "280% 100%",
        animation: "cadShimmer 1.6s linear infinite",
      }}
    />
  ) : sync.isError ? (
    <span
      className="uppercase"
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        color: "var(--text-subtle)",
      }}
    >
      SYNC STATUS NOT LOADED
    </span>
  ) : conflicts.length > 0 ? (
    <Link
      to="/sync"
      search={{ conflict: conflicts[0]!.id }}
      className={`inline-flex items-center uppercase ${linkHover}`}
      aria-label={`${conflicts.length} sync ${conflicts.length === 1 ? "conflict needs" : "conflicts need"} your call. Open the first one.`}
      style={{
        gap: "6px",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        color: "var(--marigold)",
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block rounded-full"
        style={{ width: "6px", height: "6px", backgroundColor: "var(--marigold)" }}
      />
      {conflicts.length} {conflicts.length === 1 ? "CONFLICT" : "CONFLICTS"} →
    </Link>
  ) : (
    <span
      className="uppercase"
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        color: "var(--text-subtle)",
      }}
    >
      NO CONFLICTS
    </span>
  );

  if (bindings.length === 0) {
    return (
      <div data-mrd="" className="flex flex-wrap items-center material-small" style={strip}>
        {title}
        <span
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--text-subtle)",
          }}
        >
          No sources connected to this workspace yet.
        </span>
        <span className="flex-1" />
        <Link to="/sync" className={linkHover} style={doorLink}>
          OPEN SYNC &amp; BINDINGS →
        </Link>
      </div>
    );
  }

  const shown = bindings.slice(0, 2);
  const more = bindings.length - shown.length;

  return (
    <div data-mrd="" className="flex flex-wrap items-center material-small" style={strip}>
      {title}
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
            color: "var(--text-subtle)",
          }}
        >
          +{more} more
        </span>
      ) : null}
      {conflictVerdict}
      <span className="flex-1" />
      <Link to="/sync" className={linkHover} style={doorLink}>
        OPEN SYNC &amp; BINDINGS →
      </Link>
    </div>
  );
}
