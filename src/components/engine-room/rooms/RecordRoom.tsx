import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTraces } from "@/lib/traces.functions";
import {
  Row,
  EmptyRow,
  ErrorRetry,
  VerdictSentence,
  PanelPending,
  type RoomBodyProps,
} from "../room-parts";
import { VerifyCockpit } from "./VerifyCockpit";

// LOOM W2 fold: /govern's approvals and support tabs live in this room now.
// Approvals are ANSWERED on Today (the one queue); this room keeps the
// reviewable record - a read-only-feeling home is legal per the fold spec.
const IncidentsPanel = React.lazy(() =>
  import("@/components/governance/IncidentsPanel").then((m) => ({ default: m.IncidentsPanel })),
);
const ApprovalsPanel = React.lazy(() =>
  import("@/components/governance/ApprovalsPanel").then((m) => ({ default: m.ApprovalsPanel })),
);
const SupportSignalsPanel = React.lazy(() =>
  import("@/components/governance/SupportSignalsPanel").then((m) => ({
    default: m.SupportSignalsPanel,
  })),
);
// TRUST-LEDGER MERGE (IA spine 2026-07-11): the Trust Ledger receipts surface
// is this room's front tab (public-share controls + tamper seal included).
const ReceiptsPanel = React.lazy(() =>
  import("./ReceiptsPanel").then((m) => ({ default: m.ReceiptsPanel })),
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

/**
 * How many run rows this view draws. It was an inline `40` inside `.slice()`
 * with the sentence above the list claiming "every run", which is how the copy
 * and the list came to disagree; naming it lets the sentence be computed from
 * the same number the slice uses.
 */
const ROW_CAP = 40;

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
  if (q.isLoading) return <PanelPending>Reading the last 30 days of runs.</PanelPending>;
  const traces = q.data?.traces ?? [];
  if (traces.length === 0) {
    return (
      <EmptyRow message="No runs on the record yet. Send something worth building from Discover." />
    );
  }
  const rows = traces.slice(0, ROW_CAP);
  /* THE LIST IS CUT AND THE SENTENCE HAS TO SAY SO. Until 2026-09-02 this read
     "Every run of the last 30 days is on the record" directly above a slice of
     40, and the read behind it stops at 200 rows anyway, so on any workspace
     busier than a demo the promise was false twice over. The rest of the window
     really is on the record -- it is just not on this list, and those are
     different sentences. */
  const cut = traces.length > rows.length;
  /* PRINT THE SURFACE ONLY WHEN IT TELLS TWO ROWS APART. `root_surface` is the
     surface the run started on, and in a workspace that drives everything
     through one door it is the same word on all 40 rows -- "agent", forty
     times, down the densest table in the product, under forty different names.
     A value that is identical everywhere is not a fact about the row, it is
     wallpaper, and it costs the second line that a genuinely mixed workspace
     needs. Computed over the rows actually drawn, not per row: the question is
     whether the reader can see a difference, and the reader only sees these. */
  const surfaceDiscriminates = new Set(rows.map((t) => t.root_surface)).size > 1;
  return (
    <div>
      <VerdictSentence>
        {cut
          ? `The ${rows.length} most recent runs are drawn here, newest first. The rest of the last 30 days is on the record but not on this list.`
          : "Every run of the last 30 days is on the record."}{" "}
        Open any one to replay it step by step.
      </VerdictSentence>
      {rows.map((t) => (
        <Row
          key={t.trace_id}
          // A run is named by what it was about (mission title or first-message
          // snippet); the surface is metadata, not the name. Thirteen rows all
          // reading "agent" was the audit defect this fixes.
          subject={t.title ?? t.root_surface}
          // THE THREE FACTS ARE THREE CELLS NOW, not one joined string, and the
          // same three facts are still on the row. Until 2026-09-01 this read
          // `[surface, cost, time].filter(Boolean).join(" · ")` into `value`,
          // which is a mono, right-aligned, `tabular-nums` cell -- so a
          // variable-length surface name was set in the figure face AND pushed
          // every cost to a different offset, down 40 rows, in the column whose
          // whole purpose is aligning them.
          //
          // The surface stays conditional on `t.title` for the reason the note
          // above gives: when there is no title the surface IS the subject, and
          // repeating it on the second line says nothing twice. It is now also
          // conditional on the surface differing somewhere in the drawn set --
          // see `surfaceDiscriminates` above.
          detail={t.title && surfaceDiscriminates ? t.root_surface : undefined}
          value={fmtUsd(t.cost)}
          // `relTime` returns "" for a missing or unparseable time; the empty
          // string is falsy, so `Row` renders no stamp cell at all rather than
          // an empty slot pretending to hold a date.
          stamp={relTime(t.last_at) || undefined}
          statusWord={t.errors > 0 ? "error" : "ok"}
          /* An OUTCOME, which is the one thing red and green are allowed to
             mean in this system. The tone names it; the token is Meridian's. */
          tone={t.errors > 0 ? "fail" : "pass"}
          onOpen={() => navigate({ to: "/traces/$traceId", params: { traceId: t.trace_id } })}
        />
      ))}
    </div>
  );
}

// The old LedgerView (the standalone tamper-check tab) folded into the
// receipts front tab's SealPanel (TRUST-LEDGER MERGE 2026-07-11): one Record
// answer, one home for the fingerprint.

function ApprovalsView() {
  return (
    <div>
      <VerdictSentence>
        Approvals are answered on Today. This is the reviewable record of the queue.
      </VerdictSentence>
      <React.Suspense fallback={<PanelPending>Reading your decisions.</PanelPending>}>
        <ApprovalsPanel />
      </React.Suspense>
    </div>
  );
}

export function RecordRoom({ view }: RoomBodyProps) {
  if (view === "verify") return <VerifyCockpit view={view} />;
  if (view === "traces") return <TracesView />;
  if (view === "approvals") return <ApprovalsView />;
  /* A log of what already happened, which is this room's subject. Safety still
     answers ?view=incidents until its own phase of the A-006 fold completes;
     this is the same panel, mounted, not a copy. */
  if (view === "incidents") {
    return (
      <React.Suspense fallback={<PanelPending>Reading what went wrong.</PanelPending>}>
        <IncidentsPanel />
      </React.Suspense>
    );
  }
  if (view === "support") {
    return (
      <React.Suspense
        fallback={<PanelPending>Reading what came back from your users.</PanelPending>}
      >
        <SupportSignalsPanel />
      </React.Suspense>
    );
  }
  // The front tab (TRUST-LEDGER MERGE 2026-07-11): receipts, the tamper seal,
  // and the mission chain. Unknown ids (incl. the old "ledger") land here.
  return (
    <React.Suspense fallback={<PanelPending>Reading the paper trail.</PanelPending>}>
      <ReceiptsPanel />
    </React.Suspense>
  );
}
