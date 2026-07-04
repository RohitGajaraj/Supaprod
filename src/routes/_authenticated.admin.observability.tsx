/**
 * AFD-12: Admin → Observability surface.
 *
 * - Master kill switch (observability_enabled gate) — mirrors credits engine UX
 * - Vendor key presence indicators (PostHog / Sentry / Better Stack)
 * - Recent job_runs ledger (last 50 cron/background-job invocations)
 * - 7-day failure_kind breakdown across agent_runs
 *
 * The whole stack is dormant when the gate is off OR when keys are missing.
 *
 * OBS-13 - re-skinned to Obsidian v3 (chrome only; the queries, mutation, and
 * every conditional branch below are unchanged from the parchment version).
 * This file is only the "Health" tab body — the parent admin layout already
 * renders the TopBar, the Newsreader question header, and the mono sub-tabs.
 *
 * Loom W2-ADMIN pass (2026-07-04): the gate toggle surfaces thrown failures,
 * the error state gained a retry, loading is a layout-shaped skeleton, and
 * raw enum/env-var strings moved to hover detail (plain words in the row).
 */
import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  getObservabilityStatus,
  adminSetObservabilityEnabled,
} from "@/lib/observability.functions";
import { Button, MonoLabel, StatusDot } from "@/components/obsidian";
import { AdminErrorCard, AdminSkeleton } from "@/components/admin/admin-ui";

export const Route = createFileRoute("/_authenticated/admin/observability")({
  component: AdminObservability,
});

function AdminObservability() {
  const qc = useQueryClient();
  const fStatus = useServerFn(getObservabilityStatus);
  const fSet = useServerFn(adminSetObservabilityEnabled);

  const status = useQuery({ queryKey: ["observability-status"], queryFn: () => fStatus() });
  const setGate = useMutation({
    mutationFn: (enabled: boolean) => fSet({ data: { enabled } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Health tracking ${res.enabled ? "turned on" : "turned off"}.`);
      qc.invalidateQueries({ queryKey: ["observability-status"] });
    },
    // Register: setGate had no onError; a thrown failure ended in silence.
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. The setting did not change."),
  });

  if (status.isLoading) {
    return <AdminSkeleton rows={4} height={56} />;
  }
  if (!status.data || "error" in status.data) {
    return (
      <AdminErrorCard
        what="health status"
        message={
          status.data && "error" in status.data
            ? status.data.error
            : status.error instanceof Error
              ? status.error.message
              : undefined
        }
        onRetry={() => status.refetch()}
      />
    );
  }

  const s = status.data;

  const vendorEntries = [
    {
      label: "PostHog",
      role: "usage analytics",
      present: s.vendors.posthog,
      envVar: "POSTHOG_API_KEY",
    },
    { label: "Sentry", role: "error capture", present: s.vendors.sentry, envVar: "SENTRY_DSN" },
    {
      label: "Better Stack",
      role: "uptime heartbeat",
      present: s.vendors.betterStack,
      envVar: "BETTER_STACK_HEARTBEAT_URL",
    },
  ];
  const vendorsConfigured = vendorEntries.filter((v) => v.present).length;
  const totalAgentFailures = s.failureBreakdown.reduce((sum, f) => sum + f.count, 0);
  const jobFailureCount = s.recentJobRuns.filter(
    (r) => r.status !== "ok" && r.status !== "running",
  ).length;

  // Verdict-first: one plain-words sentence + status chip, computed from the
  // same fields the rows below display — no new data, no new query.
  const verdict = !s.gateEnabled
    ? {
        state: "stale" as const,
        word: "OFF",
        sentence: "Health tracking is turned off. Nothing on this page is being watched right now.",
      }
    : vendorsConfigured < vendorEntries.length
      ? {
          state: "stale" as const,
          word: "PARTIAL",
          sentence: `Health tracking is on, but ${vendorEntries.length - vendorsConfigured} of ${vendorEntries.length} signal sources still need a key.`,
        }
      : totalAgentFailures > 0 || jobFailureCount > 0
        ? {
            state: "failing" as const,
            word: "NEEDS A LOOK",
            sentence: `Health tracking is on. ${totalAgentFailures} agent failure${totalAgentFailures === 1 ? "" : "s"} and ${jobFailureCount} job error${jobFailureCount === 1 ? "" : "s"} in the last 7 days.`,
          }
        : {
            state: "live" as const,
            word: "ALL CLEAR",
            sentence:
              "Health tracking is on and everything is reporting clean. No failures in the last 7 days.",
          };

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      {/* Verdict-first */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 460,
              fontSize: "var(--text-card-title)",
              lineHeight: 1.3,
              color: "var(--text-primary)",
              margin: 0,
              maxWidth: 560,
            }}
          >
            {verdict.sentence}
          </p>
          <StatusDot state={verdict.state} word={verdict.word} />
        </div>
        <MonoLabel style={{ marginTop: "var(--space-2)", display: "block" }}>
          {`GATE · ${s.gateEnabled ? "ON" : "OFF"} · SOURCES · ${vendorsConfigured}/${vendorEntries.length} · FAILURES (7D) · ${totalAgentFailures + jobFailureCount}`}
        </MonoLabel>
      </Card>

      {/* Master gate */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Turn health tracking on or off</CardTitle>
            <CardDescription>
              When this is off, nothing is sent to any outside tool, even if keys are set.
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            disabled={setGate.isPending}
            onClick={() => setGate.mutate(!s.gateEnabled)}
          >
            {s.gateEnabled ? "Turn off" : "Turn on"}
          </Button>
        </div>
      </Card>

      {/* Vendor key presence */}
      <Card>
        <CardTitle>Where these signals come from</CardTitle>
        <CardDescription>
          Set by an engineer in the app&apos;s hosting settings. The engineering runbook covers the
          details.
        </CardDescription>
        <div style={{ marginTop: "var(--space-3)" }}>
          {vendorEntries.map((v, i) => (
            <VendorRow key={v.label} {...v} first={i === 0} />
          ))}
        </div>
      </Card>

      {/* Failure breakdown */}
      <Card>
        <CardTitle>Agent failures · last 7 days</CardTitle>
        {s.failureBreakdown.length === 0 ? (
          <CardDescription>No agent failures recorded.</CardDescription>
        ) : (
          <div style={{ marginTop: "var(--space-3)" }}>
            {s.failureBreakdown.map((f, i) => (
              <div
                key={f.failure_kind}
                className="flex items-center justify-between gap-4"
                style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                }}
              >
                {/* Raw enum slugs read as broken UI; show the words, keep the
                    raw value on hover (register: raw failure_kind enums). */}
                <MonoLabel title={f.failure_kind}>{f.failure_kind.replaceAll("_", " ")}</MonoLabel>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-base)",
                    color: "var(--text-primary)",
                  }}
                  className="tabular-nums"
                >
                  {f.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Job runs ledger */}
      <Card>
        <CardTitle>Recent automatic jobs</CardTitle>
        {s.recentJobRuns.length === 0 ? (
          <CardDescription>No jobs have run yet.</CardDescription>
        ) : (
          <div style={{ marginTop: "var(--space-3)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th>Job</Th>
                  <Th>Status</Th>
                  <Th>Started</Th>
                  <Th align="right">Took</Th>
                  <Th>Error</Th>
                </tr>
              </thead>
              <tbody>
                {s.recentJobRuns.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                    <td
                      style={{
                        padding: "8px 8px 8px 0",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-body)",
                      }}
                    >
                      {r.job_name}
                    </td>
                    <td style={{ padding: 8 }}>
                      <JobStatus status={r.status} />
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--text-base)",
                        color: "var(--text-body)",
                      }}
                    >
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td
                      className="tabular-nums"
                      style={{
                        padding: 8,
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {r.duration_ms != null ? `${r.duration_ms}ms` : "·"}
                    </td>
                    <td
                      style={{
                        padding: "8px 0 8px 8px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-mono-micro)",
                        color: "var(--text-faint)",
                      }}
                    >
                      {r.error_kind ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function VendorRow({
  label,
  role,
  present,
  envVar,
  first,
}: {
  label: string;
  role: string;
  present: boolean;
  envVar: string;
  first: boolean;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      style={{ padding: "10px 0", borderTop: first ? "none" : "1px solid var(--hairline)" }}
    >
      <div>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            color: "var(--text-muted)",
          }}
        >
          {" "}
          · {role}
        </span>
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        {/* The exact key name is engineer detail; it stays on hover instead
            of reading as a raw env var label (master-inventory copy row). */}
        {!present && (
          <MonoLabel tone="muted" title={envVar}>
            key not set
          </MonoLabel>
        )}
        <StatusDot
          state={present ? "live" : "stale"}
          word={present ? "CONFIGURED" : "NOT SET UP"}
        />
      </div>
    </div>
  );
}

function JobStatus({ status }: { status: string }) {
  if (status === "ok") return <StatusDot state="done" word="OK" />;
  if (status === "running") return <StatusDot state="working" word="RUNNING" />;
  // "error" and "timeout" both read as the plain word FAILED; the raw value
  // stays available on hover so the distinction isn't lost, only de-emphasized.
  return <StatusDot state="failing" word="FAILED" title={status} />;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-4) var(--space-6)",
      }}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 460,
        fontSize: "var(--text-card-title)",
        lineHeight: 1.3,
        color: "var(--text-primary)",
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

function CardDescription({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-base)",
        lineHeight: "var(--leading-body)",
        color: "var(--text-body)",
        marginTop: "var(--space-2)",
        marginBottom: 0,
        maxWidth: 640,
      }}
    >
      {children}
    </p>
  );
}

function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-label)",
        textTransform: "uppercase",
        letterSpacing: "0.11em",
        color: "var(--text-subtle)",
        fontWeight: 400,
        padding: align === "right" ? "0 0 8px 8px" : "0 8px 8px 0",
        borderBottom: "1px solid var(--hairline-strong)",
      }}
    >
      {children}
    </th>
  );
}
