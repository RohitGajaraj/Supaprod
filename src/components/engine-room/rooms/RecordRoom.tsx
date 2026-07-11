import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTraces } from "@/lib/traces.functions";
import { getLedgerSeal, verifyLedgerSeal } from "@/lib/trust-ledger.functions";
import {
  Row,
  EmptyRow,
  ErrorRetry,
  VerdictSentence,
  PanelPending,
  type RoomBodyProps,
} from "../RoomDetail";
import { VerifyCockpit } from "./VerifyCockpit";

// LOOM W2 fold: /govern's approvals and support tabs live in this room now.
// Approvals are ANSWERED on Today (the one queue); this room keeps the
// reviewable record - a read-only-feeling home is legal per the fold spec.
const ApprovalsPanel = React.lazy(() =>
  import("@/components/governance/ApprovalsPanel").then((m) => ({ default: m.ApprovalsPanel })),
);
const SupportSignalsPanel = React.lazy(() =>
  import("@/components/governance/SupportSignalsPanel").then((m) => ({
    default: m.SupportSignalsPanel,
  })),
);

function fmtUsd(n: number): string {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TracesView() {
  const navigate = useNavigate();
  const fTraces = useServerFn(listTraces);
  const q = useQuery({
    queryKey: ["traces", 30, "all"],
    queryFn: () => fTraces({ data: { days: 30, status: "all", limit: 200 } }),
  });
  if (q.isError) {
    return <ErrorRetry message="The record did not load." onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading) return <PanelPending />;
  const traces = q.data?.traces ?? [];
  if (traces.length === 0) {
    return (
      <EmptyRow message="No runs on the record yet. Send something worth building from Discover." />
    );
  }
  return (
    <div>
      <VerdictSentence>
        Every run of the last 30 days is on the record. Open any one to replay it step by step.
      </VerdictSentence>
      {traces.slice(0, 40).map((t) => (
        <Row
          key={t.trace_id}
          // A run is named by what it was about (mission title or first-message
          // snippet); the surface is metadata, not the name. Thirteen rows all
          // reading "agent" was the audit defect this fixes.
          subject={t.title ?? t.root_surface}
          value={[t.title ? t.root_surface : null, fmtUsd(t.cost), relTime(t.last_at)]
            .filter(Boolean)
            .join(" · ")}
          statusWord={t.errors > 0 ? "error" : "ok"}
          statusColor={t.errors > 0 ? "var(--madder-bright)" : "var(--moss-bright)"}
          onOpen={() => navigate({ to: "/traces/$traceId", params: { traceId: t.trace_id } })}
        />
      ))}
    </div>
  );
}

function LedgerView() {
  const fSeal = useServerFn(getLedgerSeal);
  const fVerify = useServerFn(verifyLedgerSeal);
  const sealQ = useQuery({ queryKey: ["ledger-seal"], queryFn: () => fSeal({ data: {} }) });

  // A self-check: re-verify the just-computed fingerprint against itself. A
  // mismatch here means the record changed in the instant between the two
  // calls, a narrow but real integrity signal, not a historical audit
  // (persisted seals to compare against arrive with write-time persistence).
  const verifyQ = useQuery({
    queryKey: ["ledger-verify-now", sealQ.data?.head],
    queryFn: () => fVerify({ data: { head: sealQ.data!.head, count: sealQ.data!.count } }),
    enabled: !!sealQ.data?.available,
  });

  if (sealQ.isLoading) return <PanelPending />;
  // Honesty (LOOM §9b): a failed seal read is an error with a retry, never
  // the "no workspace" sentence.
  if (sealQ.isError) {
    return (
      <ErrorRetry message="The ledger seal did not load." onRetry={() => void sealQ.refetch()} />
    );
  }
  if (!sealQ.data?.available) {
    return <VerdictSentence>No workspace to seal yet.</VerdictSentence>;
  }
  // Three honest self-check outcomes: it ran and passed, it ran and caught a
  // change, or it did not run. "Verifies" is only claimed when it ran.
  const checked = verifyQ.data != null;
  const intact = verifyQ.data?.ok ?? false;
  const count = sealQ.data.count.toLocaleString("en-US");
  return (
    <div>
      <VerdictSentence>
        {verifyQ.isError
          ? `The self-check did not run. ${count} record${sealQ.data.count === 1 ? "" : "s"} on the ledger; the fingerprint below is unchecked.`
          : checked
            ? `The ledger ${intact ? "verifies" : "changed mid-check"}. ${count} record${sealQ.data.count === 1 ? "" : "s"}, one ${intact ? "intact" : "broken"} chain.`
            : `Checking the ledger. ${count} record${sealQ.data.count === 1 ? "" : "s"} on the record.`}
      </VerdictSentence>
      <Row
        subject="Fingerprint"
        value={sealQ.data.head.slice(0, 12)}
        statusWord={
          verifyQ.isError ? "unchecked" : checked ? (intact ? "verified" : "changed") : "checking"
        }
        statusColor={
          verifyQ.isError || !checked
            ? "var(--text-muted)"
            : intact
              ? "var(--moss-bright)"
              : "var(--marigold)"
        }
      />
    </div>
  );
}

function ApprovalsView() {
  return (
    <div>
      <VerdictSentence>
        Approvals are answered on Today. This is the reviewable record of the queue.
      </VerdictSentence>
      <React.Suspense fallback={<PanelPending />}>
        <ApprovalsPanel />
      </React.Suspense>
    </div>
  );
}

export function RecordRoom({ view }: RoomBodyProps) {
  // RPT-31: the Agent Inbox / verification cockpit is the record room's
  // default landing view (registered first in ROOM_TAB_META.record).
  if (view === "verify") return <VerifyCockpit view={view} />;
  if (view === "ledger") return <LedgerView />;
  if (view === "approvals") return <ApprovalsView />;
  if (view === "support") {
    return (
      <React.Suspense fallback={<PanelPending />}>
        <SupportSignalsPanel />
      </React.Suspense>
    );
  }
  return <TracesView />;
}
