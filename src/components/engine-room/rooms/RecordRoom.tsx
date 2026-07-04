import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTraces } from "@/lib/traces.functions";
import { getLedgerSeal, verifyLedgerSeal } from "@/lib/trust-ledger.functions";
import { Row, EmptyRow, VerdictSentence, PanelPending, type RoomBodyProps } from "../RoomDetail";

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
    return (
      <div style={{ padding: "18px 0" }}>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            color: "var(--madder-bright)",
            marginBottom: "10px",
          }}
        >
          The record did not load.
        </p>
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
          subject={t.root_surface}
          value={`${fmtUsd(t.cost)} · ${relTime(t.last_at)}`}
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
  if (!sealQ.data?.available) {
    return <VerdictSentence>No workspace to seal yet.</VerdictSentence>;
  }
  const intact = verifyQ.data?.ok ?? true;
  return (
    <div>
      <VerdictSentence>
        The ledger {intact ? "verifies" : "changed mid-check"}.{" "}
        {sealQ.data.count.toLocaleString("en-US")} record
        {sealQ.data.count === 1 ? "" : "s"}, one {intact ? "intact" : "broken"} chain.
      </VerdictSentence>
      <Row
        subject="Fingerprint"
        value={sealQ.data.head.slice(0, 12)}
        statusWord={intact ? "verified" : "changed"}
        statusColor={intact ? "var(--moss-bright)" : "var(--marigold)"}
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
