/**
 * Admin Console v2 — Platform tab. Feature flags, system banner, audit log.
 *
 * Chrome-only Obsidian v3 re-skin (2026-07-03): colors/type/spacing/markup
 * only. No query key, mutation, prop shape, or conditional business-logic
 * branch changed. This file is only the "Platform" tab body — the parent
 * admin layout already renders the TopBar, the Newsreader question header,
 * and the mono sub-tabs.
 *
 * Loom W2-ADMIN pass (2026-07-04): flag/banner/audit query errors no longer
 * masquerade as empty states (register D-11); every mutation checks the
 * in-band `{error}` result and surfaces thrown failures; the free-text flag
 * payload is validated as JSON before submit; the hosting proof-of-concept
 * panel (dev scaffolding, BYO-P5b) is gated behind the `hosting.poc` feature
 * flag and remembers its last deploy URL across navigation (D-41); raw
 * secret and table names moved out of user-facing copy.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { triggerDeploy, type DeployResult } from "@/lib/build.functions";
import {
  adminListFlags,
  adminUpsertFlag,
  adminDeleteFlag,
  getActiveBanner,
  adminSetBanner,
  adminClearBanner,
  adminListAuditLog,
  type FeatureFlag,
  type SystemBanner,
  type AuditRow,
} from "@/lib/admin-platform.functions";
import { getMemoryExpiryEnabled, adminSetMemoryExpiryEnabled } from "@/lib/pricing.functions";
import { listProjects } from "@/lib/projects.functions";
import {
  provisionHostingPoc,
  type ProvisionHostingPocResult,
} from "@/lib/hosting/hosting-poc.functions";
import { Button, MonoLabel, type MonoLabelTone } from "@/components/obsidian";
import { AdminErrorCard, AdminSkeleton, inBandError } from "@/components/admin/admin-ui";

export const Route = createFileRoute("/_authenticated/admin/platform")({
  component: AdminPlatform,
});

// Focus ring, per the Tempo contract: 2px ember, offset 2, on every interactive element.
const focusRingClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

function AdminPlatform() {
  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      <p style={{ ...bodyTextStyle() }}>
        Turn features on or off · post a notice to everyone · trigger deploys · read the audit trail
      </p>
      <DeployPanel />
      <HostingPocPanel />
      <BannerPanel />
      <FlagsPanel />
      <MemoryExpiryPanel />
      <AuditPanel />
    </div>
  );
}

function DeployPanel() {
  const fDeploy = useServerFn(triggerDeploy);
  const [reason, setReason] = useState("");
  const deploy = useMutation({
    mutationFn: () =>
      fDeploy({ data: { reason: reason.trim() || "Manual deploy from admin panel" } }),
    onSuccess: (result: DeployResult) => {
      if (result.ok) {
        toast.success(
          `Deploy triggered via ${result.provider} at ${new Date(result.triggered_at).toLocaleTimeString()}.`,
        );
        setReason("");
      } else if (result.reason === "no_hook_configured") {
        toast.error("No deploy hook is connected. Ask an engineer to add one in hosting settings.");
      } else {
        toast.error(result.message);
      }
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "The deploy request failed. Nothing shipped."),
  });

  return (
    <div style={cardStyle()}>
      <div style={sectionTitleStyle()}>Deploy</div>
      <p style={bodyTextStyle()}>
        Trigger a production deploy. An engineer must connect a deploy hook in the hosting settings
        first.
      </p>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <input
          className={focusRingClass}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          aria-label="Deploy reason"
          style={input(320)}
        />
        <Button variant="secondary" disabled={deploy.isPending} onClick={() => deploy.mutate()}>
          {deploy.isPending ? "Deploying…" : "Trigger deploy"}
        </Button>
      </div>
    </div>
  );
}

/** BYO-P5 P5b: deploys a real, minimal shell for one of the admin's own Products to Deno Deploy.
 * Dev scaffolding, not user-facing: hidden unless the `hosting.poc` feature
 * flag is turned on (master-inventory verdict: remove or gate this panel). */
const HOSTING_POC_URL_KEY = "admin-hosting-poc-last-url";

function HostingPocPanel() {
  const fListFlags = useServerFn(adminListFlags);
  const fListProjects = useServerFn(listProjects);
  const fProvision = useServerFn(provisionHostingPoc);
  // Same key as FlagsPanel, so react-query dedupes the request.
  const flags = useQuery({ queryKey: ["admin-flags"], queryFn: () => fListFlags() });
  const pocEnabled =
    Array.isArray(flags.data) &&
    (flags.data as FeatureFlag[]).some((f) => f.key === "hosting.poc" && f.enabled);
  const projectsQuery = useQuery({
    queryKey: ["admin-hosting-poc-projects"],
    queryFn: () => fListProjects({ data: {} }),
    enabled: pocEnabled,
  });
  const projects: Array<{ id: string; name: string }> = (projectsQuery.data?.projects ?? []).map(
    (p) => ({ id: p.id, name: p.name }),
  );

  const [projectId, setProjectId] = useState("");
  // Register D-41: survive navigation within the session.
  const [lastUrl, setLastUrl] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(HOSTING_POC_URL_KEY);
    } catch {
      return null;
    }
  });

  const deploy = useMutation({
    mutationFn: () => fProvision({ data: { projectId } }),
    onSuccess: (result: ProvisionHostingPocResult) => {
      if (result.ok) {
        setLastUrl(result.url);
        try {
          sessionStorage.setItem(HOSTING_POC_URL_KEY, result.url);
        } catch {
          // storage unavailable; the in-memory URL still shows
        }
        toast.success("Deployed. Live at the URL below.");
      } else if (result.reason === "not_configured") {
        toast.error("Hosting is not set up. Ask an engineer to add the deploy token.");
      } else {
        toast.error(result.message);
      }
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "The deploy failed. Nothing shipped."),
  });

  if (!pocEnabled) return null;

  return (
    <div style={cardStyle()}>
      <div style={sectionTitleStyle()}>Supaprod-hosted · proof of concept</div>
      <p style={bodyTextStyle()}>
        Deploys a minimal static shell for one of your own Products to Deno Deploy. Not user-facing;
        safe to click more than once for the same Product.
      </p>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <select
          className={focusRingClass}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Product to deploy"
          style={input(260)}
        >
          <option value="">
            {projectsQuery.isLoading ? "Loading projects…" : "Select a Product"}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          disabled={!projectId || deploy.isPending}
          onClick={() => deploy.mutate()}
        >
          {deploy.isPending ? "Deploying…" : "Deploy proof of concept"}
        </Button>
      </div>
      {/* A failed project read must not sit behind an eternal empty select
          (error never wears an empty state's clothes, checklist point 7). */}
      {projectsQuery.isError ? (
        <p style={{ ...bodyTextStyle(), color: "var(--madder)" }}>
          Couldn't load your Products.{" "}
          {projectsQuery.error instanceof Error ? projectsQuery.error.message : "Request failed."}{" "}
          <button
            type="button"
            onClick={() => projectsQuery.refetch()}
            className={`${focusRingClass} cursor-pointer hover:underline`}
            style={{ background: "none", border: "none", padding: 0, color: "var(--text-primary)" }}
          >
            Retry
          </button>
        </p>
      ) : null}
      {lastUrl ? (
        <p style={bodyTextStyle()}>
          Live at:{" "}
          <a
            href={lastUrl}
            target="_blank"
            rel="noreferrer"
            className={`${focusRingClass} hover:underline`}
            style={{ color: "var(--link)" }}
          >
            {lastUrl}
          </a>
        </p>
      ) : null}
    </div>
  );
}

// marigold is reserved for in-review status only (design contract role-color
// law: each role color has exactly one job) - "warn" has no dedicated hue in
// the restraint palette, so it stays neutral and the mono-caps word itself
// carries the severity, same as any other status-color-only-on-real-status case.
const BANNER_TONE: Record<SystemBanner["level"], MonoLabelTone> = {
  info: "glacier",
  warn: "muted",
  alert: "madder",
};

function BannerPanel() {
  const qc = useQueryClient();
  const fGet = useServerFn(getActiveBanner);
  const fSet = useServerFn(adminSetBanner);
  const fClear = useServerFn(adminClearBanner);
  const cur = useQuery({ queryKey: ["admin-banner"], queryFn: () => fGet() });
  const banner = (cur.data as SystemBanner | null) ?? null;

  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<"info" | "warn" | "alert">("info");
  const [days, setDays] = useState<number | "">(1);

  const set = useMutation({
    mutationFn: () => {
      const expiresAt =
        days && Number(days) > 0
          ? new Date(Date.now() + Number(days) * 86400_000).toISOString()
          : null;
      return fSet({ data: { message, level, active: true, expiresAt } });
    },
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Banner published");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["admin-banner"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Publishing failed. No banner went out."),
  });
  const clear = useMutation({
    mutationFn: () => fClear(),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Banner cleared");
      qc.invalidateQueries({ queryKey: ["admin-banner"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Clearing failed. The banner is still up."),
  });

  return (
    <div style={cardStyle()}>
      <div style={sectionTitleStyle()}>System banner</div>
      {cur.isLoading ? (
        <AdminSkeleton rows={1} height={40} />
      ) : cur.isError ? (
        // A failed read is not "No active banner." (register D-11).
        <AdminErrorCard
          what="the current banner"
          message={cur.error instanceof Error ? cur.error.message : undefined}
          onRetry={() => cur.refetch()}
        />
      ) : banner ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--space-2)",
            flexWrap: "wrap",
            background: "var(--raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "var(--space-3)",
          }}
        >
          <MonoLabel tone={BANNER_TONE[banner.level]}>{banner.level}</MonoLabel>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              color: "var(--text-body)",
            }}
          >
            {banner.message}
          </span>
          {banner.expires_at ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-micro)",
                color: "var(--text-faint)",
              }}
            >
              · expires {banner.expires_at.slice(0, 16).replace("T", " ")}
            </span>
          ) : null}
        </div>
      ) : (
        <p style={bodyTextStyle()}>No active banner.</p>
      )}
      <div
        style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          className={focusRingClass}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Banner message"
          aria-label="Banner message"
          style={{ ...input(), flex: 1, minWidth: 220 }}
        />
        <select
          className={focusRingClass}
          value={level}
          onChange={(e) => setLevel(e.target.value as typeof level)}
          aria-label="Banner severity level"
          style={input(110)}
        >
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="alert">Alert</option>
        </select>
        <input
          className={focusRingClass}
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="days"
          aria-label="Banner duration in days"
          style={input(80)}
        />
        <Button
          variant="secondary"
          disabled={!message || set.isPending}
          onClick={() => set.mutate()}
        >
          {set.isPending ? "Publishing…" : "Publish · shows to everyone"}
        </Button>
        {banner ? (
          <Button
            variant="secondary"
            style={{ color: "var(--text-subtle)" }}
            disabled={clear.isPending}
            onClick={() => clear.mutate()}
          >
            {clear.isPending ? "Clearing…" : "Clear"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FlagsPanel() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fList = useServerFn(adminListFlags);
  const fUpsert = useServerFn(adminUpsertFlag);
  const fDelete = useServerFn(adminDeleteFlag);
  const list = useQuery({ queryKey: ["admin-flags"], queryFn: () => fList() });
  const listError = list.isError
    ? list.error instanceof Error
      ? list.error.message
      : "Request failed."
    : inBandError(list.data);
  const rows: FeatureFlag[] = Array.isArray(list.data) ? (list.data as FeatureFlag[]) : [];

  const [key, setKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [payload, setPayload] = useState("{}");

  const upsert = useMutation({
    mutationFn: (vars: { key: string; enabled: boolean; payloadJson: string }) =>
      fUpsert({ data: vars }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Flag saved");
      setKey("");
      setPayload("{}");
      qc.invalidateQueries({ queryKey: ["admin-flags"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. The flag was not changed."),
  });
  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Flag deleted");
      qc.invalidateQueries({ queryKey: ["admin-flags"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Delete failed. The flag is still set."),
  });

  // The payload field is free text; catch bad JSON before it reaches the
  // server (register: unvalidated free-text JSON flag payload).
  function saveFlag(vars: { key: string; enabled: boolean; payloadJson: string }) {
    try {
      JSON.parse(vars.payloadJson || "{}");
    } catch {
      toast.error('Details must be valid JSON, for example {"rolloutPct":10}.');
      return;
    }
    upsert.mutate(vars);
  }

  return (
    <div style={cardStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={sectionTitleStyle()}>Feature flags</div>
        <MonoLabel tone="muted">
          {rows.length} flag{rows.length === 1 ? "" : "s"}
        </MonoLabel>
      </div>
      <div
        style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          className={focusRingClass}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="experimental.x"
          aria-label="Flag key"
          style={input(220)}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-1)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
            color: "var(--text-body)",
          }}
        >
          <input
            className={focusRingClass}
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: "var(--text-primary)", cursor: "pointer" }}
          />
          Enabled
        </label>
        <input
          className={focusRingClass}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='{"rolloutPct":10}'
          aria-label="Flag details as JSON"
          style={input(220)}
        />
        <Button
          variant="secondary"
          disabled={!key || upsert.isPending}
          onClick={() => saveFlag({ key, enabled, payloadJson: payload })}
        >
          {upsert.isPending ? "Saving…" : "Save flag"}
        </Button>
      </div>
      {list.isLoading ? (
        <AdminSkeleton rows={3} height={40} />
      ) : listError ? (
        <AdminErrorCard what="feature flags" message={listError} onRetry={() => list.refetch()} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Key</th>
                <th style={th()}>Enabled</th>
                <th style={th()}>Details</th>
                <th style={th()}>Updated</th>
                <th style={th()}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td style={td()}>
                    <code style={codeStyle()}>{f.key}</code>
                  </td>
                  <td style={td()}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <MonoLabel tone={f.enabled ? "moss" : "faint"}>
                        {f.enabled ? "on" : "off"}
                      </MonoLabel>
                      <Button
                        variant="secondary"
                        disabled={upsert.isPending}
                        style={{ fontSize: 11.5, padding: "6px 10px" }}
                        onClick={() =>
                          saveFlag({ key: f.key, enabled: !f.enabled, payloadJson: f.payload })
                        }
                      >
                        {f.enabled ? "Turn off" : "Turn on"}
                      </Button>
                    </div>
                  </td>
                  <td style={td()}>
                    <code style={{ ...codeStyle(), fontSize: 11 }}>{f.payload}</code>
                  </td>
                  <td style={td()}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {f.updated_at.slice(0, 10)}
                    </span>
                  </td>
                  <td style={td()}>
                    <Button
                      variant="secondary"
                      disabled={del.isPending}
                      style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-subtle)" }}
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Delete flag?",
                          body: `${f.key} will be removed.`,
                          confirmLabel: "Delete",
                          destructive: true,
                        });
                        if (ok) del.mutate(f.id);
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      ...td(),
                      padding: "var(--space-3)",
                      textAlign: "center",
                      color: "var(--text-subtle)",
                    }}
                  >
                    No flags yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MemoryExpiryPanel() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fGet = useServerFn(getMemoryExpiryEnabled);
  const fSet = useServerFn(adminSetMemoryExpiryEnabled);

  const cur = useQuery({
    queryKey: ["admin-memory-expiry"],
    queryFn: () => fGet(),
  });
  const curError = cur.isError
    ? cur.error instanceof Error
      ? cur.error.message
      : "Request failed."
    : inBandError(cur.data);
  const enabled =
    cur.data && !("error" in cur.data) ? (cur.data as { enabled: boolean }).enabled : false;

  const toggle = useMutation({
    mutationFn: (next: boolean) => fSet({ data: { enabled: next } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error((r as { error: string }).error);
      toast.success(
        `Memory expiry ${(r as { enabled: boolean }).enabled ? "enabled" : "disabled"}`,
      );
      qc.invalidateQueries({ queryKey: ["admin-memory-expiry"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. The setting did not change."),
  });

  const handleToggle = async () => {
    const next = !enabled;
    if (next) {
      const ok = await confirm({
        title: "Enable memory expiry?",
        body: "New memories for free-tier users will start expiring after 14 days. Existing memories are kept. This cannot be silently reversed once users rely on it.",
        confirmLabel: "Enable",
        destructive: true,
      });
      if (!ok) return;
    }
    toggle.mutate(next);
  };

  return (
    <div style={cardStyle()}>
      <div style={sectionTitleStyle()}>Memory expiry · free tier</div>
      <p style={bodyTextStyle()}>
        When enabled, new memories the machine keeps for free-tier users start expiring 14 days
        after they are written, and expired ones are cleaned up automatically each night. Memories
        that already exist are not touched.
      </p>
      {curError ? (
        // A failed read must not present as "disabled" (register D-11).
        <AdminErrorCard
          what="the memory expiry setting"
          message={curError}
          onRetry={() => cur.refetch()}
        />
      ) : (
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <MonoLabel tone={enabled ? "moss" : "muted"}>
            {cur.isLoading ? "loading" : enabled ? "enabled" : "disabled"}
          </MonoLabel>
          <Button
            variant="secondary"
            disabled={cur.isLoading || toggle.isPending}
            onClick={handleToggle}
          >
            {toggle.isPending ? "Saving…" : enabled ? "Disable" : "Enable"}
          </Button>
        </div>
      )}
    </div>
  );
}

function AuditPanel() {
  const fList = useServerFn(adminListAuditLog);
  const [targetKind, setTargetKind] = useState<string>("");
  const list = useQuery({
    queryKey: ["admin-audit", targetKind],
    queryFn: () =>
      fList({ data: { targetKind: targetKind || null, targetId: null, limit: 200, offset: 0 } }),
  });
  const listError = list.isError
    ? list.error instanceof Error
      ? list.error.message
      : "Request failed."
    : inBandError(list.data);
  const rows: AuditRow[] = Array.isArray(list.data) ? (list.data as AuditRow[]) : [];

  return (
    <div style={cardStyle()}>
      <div
        style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}
      >
        <div style={sectionTitleStyle()}>Audit log</div>
        <MonoLabel tone="muted">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </MonoLabel>
        <select
          value={targetKind}
          onChange={(e) => setTargetKind(e.target.value)}
          className={focusRingClass}
          aria-label="Filter the audit log by target kind"
          style={{ ...input(180), marginLeft: "auto" }}
        >
          <option value="">All kinds</option>
          <option value="user">User</option>
          <option value="workspace">Workspace</option>
          <option value="voucher">Voucher</option>
          <option value="invitation">Invitation</option>
          <option value="flag">Feature flag</option>
          <option value="banner">Banner</option>
          <option value="subscription">Subscription</option>
          <option value="domain">Domain</option>
          <option value="signup_approval">Signup approval</option>
        </select>
      </div>
      {list.isLoading ? (
        <AdminSkeleton rows={4} height={36} />
      ) : listError ? (
        <AdminErrorCard what="the audit log" message={listError} onRetry={() => list.refetch()} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>When</th>
                <th style={th()}>Actor</th>
                <th style={th()}>Action</th>
                <th style={th()}>Target</th>
                <th style={th()}>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td style={td()}>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                  <td style={td()}>{r.actor_email ?? r.actor_user_id?.slice(0, 8) ?? "-"}</td>
                  <td style={td()}>
                    <code style={codeStyle()}>{r.action}</code>
                  </td>
                  <td style={td()}>
                    {r.target_kind} · {r.target_id?.slice(0, 8) ?? "-"}
                  </td>
                  <td style={td()}>
                    <code style={{ ...codeStyle(), fontSize: 10 }}>{r.payload}</code>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      ...td(),
                      padding: "var(--space-3)",
                      textAlign: "center",
                      color: "var(--text-subtle)",
                    }}
                  >
                    No entries.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cardStyle(): React.CSSProperties {
  return {
    background: "var(--card)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-card)",
    padding: "var(--space-4)",
    display: "grid",
    gap: "var(--space-3)",
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontWeight: 460,
    fontSize: "var(--text-card-title)",
    lineHeight: 1.3,
    color: "var(--text-primary)",
  };
}

function bodyTextStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
    lineHeight: "var(--leading-body)",
    color: "var(--text-muted)",
    margin: 0,
    maxWidth: 640,
  };
}

function codeStyle(): React.CSSProperties {
  return { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" };
}

function input(width?: number): React.CSSProperties {
  return {
    padding: "8px 10px",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "var(--radius-control)",
    background: "var(--raised)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
    fontSize: 12.5,
    width,
  };
}
function th(): React.CSSProperties {
  return {
    padding: "8px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-mono-label)",
    textTransform: "uppercase",
    letterSpacing: "0.11em",
    color: "var(--text-subtle)",
    fontWeight: 400,
    textAlign: "left",
    borderBottom: "1px solid var(--hairline-strong)",
  };
}
function td(): React.CSSProperties {
  return {
    padding: "8px 10px",
    verticalAlign: "middle",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
    color: "var(--text-body)",
  };
}
