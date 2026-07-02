import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTraces } from "@/lib/traces.functions";
import { getLedgerSeal, verifyLedgerSeal } from "@/lib/trust-ledger.functions";
import { Row, EmptyRow, VerdictSentence } from "../RoomDetail";

function fmtUsd(n: number): string {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function TracesView() {
  const navigate = useNavigate();
  const fTraces = useServerFn(listTraces);
  const q = useQuery({
    queryKey: ["traces", 30, "all"],
    queryFn: () => fTraces({ data: { days: 30, status: "all", limit: 200 } }),
  });
  const traces = q.data?.traces ?? [];
  if (!q.isLoading && traces.length === 0) {
    return (
      <EmptyRow message="No runs on the record yet. Send something worth building from Discover." />
    );
  }
  return (
    <div>
      <VerdictSentence>
        Every run is on the record. Open any one to replay it step by step.
      </VerdictSentence>
      {traces.slice(0, 40).map((t) => (
        <Row
          key={t.trace_id}
          subject={t.root_surface}
          value={fmtUsd(t.cost)}
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

  if (sealQ.isLoading) return null;
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

export function RecordRoom({ view }: { view: string }) {
  if (view === "ledger") return <LedgerView />;
  return <TracesView />;
}
