// Connections (the /sync route) — the bindings home. Loom W2 (2026-07-04):
// v4 token pass over the last wholly-parchment surface, the §8 rename (the
// user-facing label is Connections everywhere; the /sync path stays), a
// back-link to Settings > Connections (one-home rule: account-level lives
// there, workspace bindings live here), honest states (mappings error is an
// error, never "no conflicts"; unsupported pull/push reads "read-only", not
// two dead buttons), and humanized provider/version copy.
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  RefreshCcw,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { WorkspaceBindingsSection } from "@/components/connections/WorkspaceBindingsSection";
import { ProductBindingsSection } from "@/components/connections/ProductBindingsSection";
import { listSyncMappings, resolveSyncConflict } from "@/lib/integrations.functions";
import { pullMapping, pushMapping } from "@/lib/sync.functions";
import { getIngestToken, rotateIngestToken, revokeIngestToken } from "@/lib/ingest.functions";
import { buildConnectorCatalog } from "@/lib/connectors/catalog";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/_authenticated/sync")({
  component: SyncInboxPage,
  head: () => ({ meta: [{ title: "Connections · Cadence" }] }),
});

type Mapping = {
  id: string;
  provider: string;
  local_kind: string;
  local_id: string;
  external_id: string;
  external_url: string | null;
  version_local: number;
  version_remote: number;
  last_pulled_at: string | null;
  last_pushed_at: string | null;
  conflict: boolean;
  updated_at: string;
};

/** Human name for a provider enum (google_docs -> Google Docs). */
function providerLabel(p: string): string {
  return CONNECTOR_REGISTRY[p as ProviderId]?.label ?? p.replace(/_/g, " ");
}

/** Section heading: real h2 for the AT outline, mono-caps look per contract. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mono-label" style={{ margin: 0, color: "var(--ink-subtle)" }}>
      {children}
    </h2>
  );
}

function SyncInboxPage() {
  const qc = useQueryClient();
  const { activeProductId, activeWorkspaceId, activeProduct } = useWorkspace();
  const fList = useServerFn(listSyncMappings);
  const fResolve = useServerFn(resolveSyncConflict);
  const fPull = useServerFn(pullMapping);
  const fPush = useServerFn(pushMapping);

  const q = useQuery({ queryKey: ["sync-mappings"], queryFn: () => fList() });
  const mappings = (q.data?.mappings ?? []) as Mapping[];
  const conflicts = mappings.filter((m) => m.conflict);
  const synced = mappings.filter((m) => !m.conflict);

  const mResolve = useMutation({
    mutationFn: (vars: { id: string; strategy: "keep_local" | "keep_remote" }) =>
      fResolve({ data: vars }),
    onSuccess: () => {
      toast.success("Conflict resolved");
      qc.invalidateQueries({ queryKey: ["sync-mappings"] });
    },
    // A failed resolve must never look like it worked (honesty law).
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Resolve failed"),
  });

  const mPull = useMutation({
    mutationFn: (id: string) => fPull({ data: { id } }),
    onSuccess: () => {
      toast.success("Pulled the latest remote version");
      qc.invalidateQueries({ queryKey: ["sync-mappings"] });
      qc.invalidateQueries({ queryKey: ["docs"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Pull failed"),
  });
  const mPush = useMutation({
    mutationFn: (id: string) => fPush({ data: { id } }),
    onSuccess: () => {
      toast.success("Pushed the Cadence version to the remote tool");
      qc.invalidateQueries({ queryKey: ["sync-mappings"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Push failed"),
  });

  const isBusy = (id: string) =>
    (mPull.isPending && mPull.variables === id) || (mPush.isPending && mPush.variables === id);
  const supported = (p: string) => p === "google_docs" || p === "notion" || p === "linear";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "var(--container-standard, 1240px)",
        margin: "0 auto",
        padding: "36px 32px 64px",
      }}
    >
      {/* Back-link: account-level connections live in Settings (one home). */}
      <Link
        to="/settings"
        search={{ section: "connections" }}
        className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        style={{ fontSize: 12.5, color: "var(--ink-subtle)" }}
      >
        ← Settings · Connections
      </Link>

      <header style={{ margin: "14px 0 30px" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 460,
            fontSize: "var(--text-h1, 32px)",
            lineHeight: 1.15,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Connections
        </h1>
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: 24,
            height: 2,
            marginTop: 10,
            borderRadius: 2,
            background: "var(--thread-gradient)",
            opacity: 0.4,
          }}
        />
        <p style={{ fontSize: 13, color: "var(--ink-subtle)", margin: "12px 0 0", maxWidth: 560 }}>
          What this workspace reads and writes: every available source, what it is bound to, and any
          sync conflicts that need a call.
        </p>
      </header>

      <ConnectorCatalogSection />

      <WorkspaceBindingsSection />

      {activeProductId && activeWorkspaceId && (
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>Product repo override</SectionTitle>
          <p style={{ fontSize: 13, color: "var(--ink-subtle)", margin: "6px 0 12px" }}>
            Bind a different repo to <strong>{activeProduct?.name ?? "this product"}</strong>. It
            overrides the workspace default for this product only.
          </p>
          <ProductBindingsSection
            projectId={activeProductId!}
            workspaceId={activeWorkspaceId!}
            projectName={activeProduct?.name}
          />
        </section>
      )}

      <section style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 12 }}>
          <SectionTitle>Conflicts ({q.error ? "?" : conflicts.length})</SectionTitle>
        </div>

        {/* Four states: skeleton, error-with-retry (never dressed as "in
            sync"), quiet empty, loaded list. */}
        {q.isLoading && (
          <div style={{ display: "grid", gap: 8 }} aria-hidden="true">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bento animate-pulse"
                style={{ height: 72, background: "var(--surface-1)" }}
              />
            ))}
          </div>
        )}
        {!q.isLoading && q.error ? (
          <div className="bento" style={{ padding: 20 }}>
            <div className="mono-label" style={{ color: "var(--rose)" }}>
              Couldn't load sync state
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "8px 0 0" }}>
              {(q.error as Error)?.message ?? "Unknown error"}
            </p>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => q.refetch()}
            >
              Retry
            </button>
          </div>
        ) : null}
        {!q.isLoading && !q.error && conflicts.length === 0 && (
          <div
            className="bento"
            style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--ink-subtle)" }}
          >
            No conflicts. Everything synced agrees with its remote copy.
          </div>
        )}
        {!q.error && (
          <div style={{ display: "grid", gap: 8 }}>
            {conflicts.map((m) => (
              <div key={m.id} className="bento" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="mono-label">
                      {providerLabel(m.provider)} · {m.local_kind.replace(/_/g, " ")}
                    </div>
                    <div
                      style={{
                        fontWeight: 500,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 2,
                      }}
                    >
                      {m.external_id}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginTop: 3 }}>
                      Both sides changed since the last sync: Cadence is on version{" "}
                      {m.version_local}, {providerLabel(m.provider)} is on version{" "}
                      {m.version_remote}.
                    </div>
                  </div>
                  {m.external_url && (
                    <a
                      href={m.external_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        color: "var(--ink-subtle)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      Open <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn btn-primary btn-sm loom-press"
                    disabled={mResolve.isPending}
                    onClick={() => mResolve.mutate({ id: m.id, strategy: "keep_local" })}
                  >
                    Keep Cadence version
                  </button>
                  <button
                    className="btn btn-ghost btn-sm loom-press"
                    disabled={mResolve.isPending}
                    onClick={() => mResolve.mutate({ id: m.id, strategy: "keep_remote" })}
                  >
                    Keep {providerLabel(m.provider)} version
                  </button>
                  {supported(m.provider) && (
                    <>
                      <span
                        aria-hidden="true"
                        style={{ width: 1, height: 16, background: "var(--hairline)" }}
                      />
                      <button
                        className="btn btn-ghost btn-sm loom-press"
                        disabled={isBusy(m.id)}
                        onClick={() => mPush.mutate(m.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        {mPush.isPending && mPush.variables === m.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ArrowUpFromLine size={12} />
                        )}
                        Push and resolve
                      </button>
                      <button
                        className="btn btn-ghost btn-sm loom-press"
                        disabled={isBusy(m.id)}
                        onClick={() => mPull.mutate(m.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        {mPull.isPending && mPull.variables === m.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ArrowDownToLine size={12} />
                        )}
                        Pull and resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 12 }}>
          <SectionTitle>Recently synced ({q.error ? "?" : synced.length})</SectionTitle>
        </div>
        {!q.isLoading && !q.error && synced.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-subtle)", margin: 0 }}>
            Nothing synced yet. Connect Notion or Google Docs in{" "}
            <Link
              to="/settings"
              search={{ section: "connections" }}
              style={{ color: "var(--blossom, #d8a6e0)", textDecoration: "underline" }}
            >
              Settings · Connections
            </Link>{" "}
            to start.
          </p>
        )}
        {!q.error && (
          <div style={{ display: "grid", gap: 4 }}>
            {synced.slice(0, 20).map((m) => {
              const readOnly = !supported(m.provider);
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--hairline)",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span className="mono-label" style={{ width: 92, flexShrink: 0 }}>
                      {providerLabel(m.provider)}
                    </span>
                    {m.external_url ? (
                      <a
                        href={m.external_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.external_id}
                        </span>
                        <ExternalLink size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
                      </a>
                    ) : (
                      <span
                        style={{
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.external_id}
                      </span>
                    )}
                  </div>
                  <span className="mono-label tabular-nums" style={{ color: "var(--ink-subtle)" }}>
                    {m.last_pulled_at
                      ? `pulled ${new Date(m.last_pulled_at).toLocaleDateString()}`
                      : "not pulled yet"}
                  </span>
                  {readOnly ? (
                    // Honest state instead of two permanently-dead buttons
                    // (audit D-48): this provider syncs one way for now.
                    <span className="mono-label" style={{ color: "var(--ink-subtle)" }}>
                      read-only
                    </span>
                  ) : (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm loom-press"
                        disabled={isBusy(m.id)}
                        onClick={() => mPull.mutate(m.id)}
                        title={`Pull the latest from ${providerLabel(m.provider)}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        {mPull.isPending && mPull.variables === m.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ArrowDownToLine size={12} />
                        )}
                        Pull
                      </button>
                      <button
                        className="btn btn-ghost btn-sm loom-press"
                        disabled={isBusy(m.id)}
                        onClick={() => mPush.mutate(m.id)}
                        title={`Push the Cadence version to ${providerLabel(m.provider)}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        {mPush.isPending && mPush.variables === m.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ArrowUpFromLine size={12} />
                        )}
                        Push
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <WebhookIngestCard />
    </div>
  );
}

// CONNECTORS-V11 (#14): the one de-duped, categorized catalog of every source
// Cadence can connect — the "available sources" home. Reads the pure catalog
// model so the list is consistent everywhere; connecting routes to the
// canonical account surface in Settings (OAuth wiring is founder-gated —
// F-CONN / SEN-01).
function ConnectorCatalogSection() {
  const catalog = buildConnectorCatalog();
  const total = catalog.reduce((n, g) => n + g.entries.length, 0);
  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ marginBottom: 6 }}>
        <SectionTitle>Available sources ({total})</SectionTitle>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-subtle)", margin: "0 0 16px", maxWidth: 560 }}>
        Every source Cadence can connect, in one place. Connect any of them from{" "}
        <Link
          to="/settings"
          search={{ section: "connections" }}
          style={{ color: "var(--blossom, #d8a6e0)", textDecoration: "underline" }}
        >
          Settings · Connections
        </Link>
        ; anything that can send a webhook works on day one via the card below.
      </p>
      <div style={{ display: "grid", gap: 24 }}>
        {catalog.map((group) => (
          <div key={group.id}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <h3 className="mono-label" style={{ margin: 0, color: "var(--ink)" }}>
                {group.label}
              </h3>
              <span style={{ fontSize: 12, color: "var(--ink-subtle)" }}>{group.blurb}</span>
            </div>
            <div
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {group.entries.map((e) => (
                <div key={e.id} className="bento" style={{ padding: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: "var(--ink)", fontSize: 13.5 }}>
                      {e.label}
                    </span>
                    <span
                      className="mono-label"
                      style={{
                        border: "1px solid var(--hairline)",
                        borderRadius: 99,
                        padding: "2px 8px",
                        flexShrink: 0,
                      }}
                    >
                      {e.flowLabel}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-subtle)", margin: "6px 0 0" }}>
                    {e.description}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11.5,
                      color: "var(--ink-subtle)",
                    }}
                  >
                    {e.resourceLabel && <span>Binds a {e.resourceLabel.toLowerCase()}</span>}
                    <Link
                      to="/settings"
                      search={{ section: "connections" }}
                      style={{
                        marginLeft: "auto",
                        color: "var(--blossom, #d8a6e0)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      Connect
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type IngestToken = {
  id: string;
  token_prefix: string | null;
  token?: string; // present only in the rotate response
  label: string | null;
  created_at: string;
};

function WebhookIngestCard() {
  const qc = useQueryClient();
  const fGet = useServerFn(getIngestToken);
  const fRotate = useServerFn(rotateIngestToken);
  const fRevoke = useServerFn(revokeIngestToken);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const endpoint = `${origin}/api/public/ingest-signals`;

  const [revealed, setRevealed] = useState(false);
  const [rotateArmed, setRotateArmed] = useState(false);
  const [curlOpen, setCurlOpen] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);

  useEffect(() => {
    if (!rotateArmed) return;
    const t = setTimeout(() => setRotateArmed(false), 4000);
    return () => clearTimeout(t);
  }, [rotateArmed]);

  const q = useQuery({ queryKey: ["ingest-token"], queryFn: () => fGet() });
  const token = (q.data?.token ?? null) as IngestToken | null;

  const mRotate = useMutation({
    mutationFn: () => fRotate(),
    onSuccess: (res) => {
      toast.success(token ? "Token rotated" : "Token generated");
      const plaintext = (res?.token as { token?: string } | null)?.token ?? null;
      setFreshToken(plaintext);
      setRevealed(Boolean(plaintext));
      setRotateArmed(false);
      qc.invalidateQueries({ queryKey: ["ingest-token"] });
    },
    onError: (e: unknown) => {
      setRotateArmed(false);
      toast.error(e instanceof Error ? e.message : "Token update failed");
    },
  });
  const mRevoke = useMutation({
    mutationFn: () => fRevoke(),
    onSuccess: () => {
      toast.success("Token revoked");
      setRevealed(false);
      setFreshToken(null);
      qc.invalidateQueries({ queryKey: ["ingest-token"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Revoke failed"),
  });

  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );

  const curlExample = [
    `curl -X POST ${endpoint} \\`,
    `  -H "Authorization: Bearer YOUR_TOKEN" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"signals":[{"title":"Checkout drop-off spike","content":"From support thread","source":"zapier"}]}'`,
  ].join("\n");

  const pillBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    border: "1px solid var(--hairline)",
    padding: "5px 9px",
    fontSize: 12,
    color: "var(--ink-subtle)",
    flexShrink: 0,
  };

  return (
    <section>
      {/* Outcome-named, not mechanism-named (was "Webhook ingest"). */}
      <div style={{ marginBottom: 12 }}>
        <SectionTitle>Send anything in</SectionTitle>
      </div>
      <div className="bento" style={{ padding: 16 }}>
        <p style={{ fontSize: 13, color: "var(--ink-subtle)", margin: 0 }}>
          Point anything that can POST here: Zapier, Slack outgoing webhooks, forms, scripts. Each
          request becomes signals in this workspace.
        </p>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono-label" style={{ width: 76, flexShrink: 0 }}>
            Endpoint
          </span>
          <code
            style={{
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              borderRadius: 8,
              background: "var(--surface-2)",
              padding: "4px 8px",
              fontSize: 12,
            }}
          >
            {endpoint}
          </code>
          <button className="loom-press" onClick={() => copy(endpoint, "Endpoint")} style={pillBtn}>
            <Copy size={12} />
            Copy
          </button>
        </div>

        <div
          style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
        >
          <span className="mono-label" style={{ width: 76, flexShrink: 0 }}>
            Token
          </span>
          {q.isLoading ? (
            <span
              className="animate-pulse"
              aria-hidden="true"
              style={{ height: 22, width: 180, borderRadius: 8, background: "var(--surface-2)" }}
            />
          ) : token ? (
            <>
              <code
                style={{
                  minWidth: 0,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  borderRadius: 8,
                  background: "var(--surface-2)",
                  padding: "4px 8px",
                  fontSize: 12,
                }}
              >
                {revealed && freshToken ? freshToken : `${(token.token_prefix ?? "").slice(0, 8)}…`}
              </code>
              {freshToken ? (
                <>
                  <button
                    className="loom-press"
                    onClick={() => setRevealed((v) => !v)}
                    style={pillBtn}
                  >
                    {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    {revealed ? "Hide" : "Reveal"}
                  </button>
                  <button
                    className="loom-press"
                    onClick={() => copy(freshToken, "Token")}
                    style={pillBtn}
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                </>
              ) : (
                <span style={{ fontSize: 11, color: "var(--ink-subtle)", flexShrink: 0 }}>
                  Full token shown only once, at rotation
                </span>
              )}
              <button
                className="loom-press"
                disabled={mRotate.isPending}
                onClick={() => (rotateArmed ? mRotate.mutate() : setRotateArmed(true))}
                style={{
                  ...pillBtn,
                  color: rotateArmed ? "var(--saffron, #E8B44C)" : "var(--ink-subtle)",
                  borderColor: rotateArmed ? "var(--saffron, #E8B44C)" : "var(--hairline)",
                  opacity: mRotate.isPending ? 0.5 : 1,
                }}
              >
                {mRotate.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCcw size={12} />
                )}
                {rotateArmed ? "Confirm rotate?" : "Rotate"}
              </button>
              <button
                className="loom-press"
                disabled={mRevoke.isPending}
                onClick={() => mRevoke.mutate()}
                style={{ ...pillBtn, opacity: mRevoke.isPending ? 0.5 : 1 }}
              >
                {mRevoke.isPending && <Loader2 size={12} className="animate-spin" />}
                Revoke
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-sm loom-press"
              disabled={mRotate.isPending}
              onClick={() => mRotate.mutate()}
            >
              {mRotate.isPending && <Loader2 size={12} className="animate-spin" />}
              Generate token
            </button>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            className="loom-press"
            onClick={() => setCurlOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--ink-subtle)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {curlOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            curl example
          </button>
          {curlOpen && (
            <pre
              style={{
                marginTop: 8,
                overflowX: "auto",
                borderRadius: 8,
                background: "var(--surface-2)",
                padding: 12,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              <code>{curlExample}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
