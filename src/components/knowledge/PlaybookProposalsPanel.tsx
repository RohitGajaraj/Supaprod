// PlaybookProposalsPanel - the HUMAN half of the compounding pass (SW-3 /
// mission 3.8b). The outcome-tick sweep (learning-compound.server.ts) writes a
// playbook_proposals row when >= 3 same-shaped learnings repeat; until a human
// adopts or dismisses it, that proposal is invisible work. This panel renders
// the open proposals at the top of Brain -> Learnings (directly above the
// outcome feed they compound from) and wires decidePlaybookProposal.
//
// Design contract: a proposal awaiting a decision is a needs-a-human moment,
// so the card carries the ember treatment (ember-line border + ember-tint
// fill) - the same grammar as the Trust Ledger's pending-gate receipts. The
// panel disappears entirely when nothing is proposed (Brain never re-clutters
// with an empty section), but a LOAD FAILURE renders as a failure, never as
// "no proposals" (CompoundingPanel's error contract).
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPlaybookProposals,
  decidePlaybookProposal,
  type PlaybookProposal,
} from "@/lib/playbooks.functions";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { traceRef } from "@/components/discover/format";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { ConfidenceChip } from "@/components/cadence/ConfidenceChip";

/** Same "when" rhythm as the outcome feed below this panel. */
function whenOf(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ProposalCard({
  p,
  busy,
  onDecide,
}: {
  p: PlaybookProposal;
  busy: boolean;
  onDecide: (decision: "confirm" | "dismiss") => void;
}) {
  return (
    <article
      aria-label={`Proposed playbook: ${p.title}`}
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--ember-line)",
        background: "var(--ember-tint)",
      }}
    >
      <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 6 }}>
        <MonoLabel style={{ fontSize: "var(--text-mono-floor)" }}>Proposed playbook</MonoLabel>
        <ConfidenceChip tier={p.confidence} />
        <span className="flex items-center" style={{ marginLeft: "auto", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.06em",
              color: "var(--text-faint)",
            }}
          >
            PBP·{traceRef(p.id)}
          </span>
          <span
            style={{ fontSize: 11, color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}
          >
            {whenOf(p.created_at)}
          </span>
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          fontWeight: 450,
          color: "var(--text-primary)",
          margin: "0 0 8px",
          lineHeight: 1.4,
        }}
      >
        {p.title}
      </p>

      {/* The body quotes the learnings verbatim (never invented) - keep the
          sweep's own line breaks. */}
      <p
        style={{
          fontSize: "var(--text-label-13)",
          color: "var(--text-body)",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          margin: "0 0 12px",
        }}
      >
        {p.body}
      </p>

      <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
        <Button
          variant="secondary"
          size="sm"
          loading={busy}
          disabled={busy}
          onClick={() => onDecide("confirm")}
        >
          Adopt playbook
        </Button>
        <Button variant="tertiary" size="sm" disabled={busy} onClick={() => onDecide("dismiss")}>
          Dismiss
        </Button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            color: "var(--text-subtle)",
            letterSpacing: "0.06em",
            marginLeft: "auto",
          }}
        >
          {p.source_learning_ids.length} source learning
          {p.source_learning_ids.length === 1 ? "" : "s"}
        </span>
      </div>
    </article>
  );
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the panel shows the top few
// open proposals and expands on demand, so Brain never becomes a long wall.
const VISIBLE_PROPOSALS = 6;

export function PlaybookProposalsPanel() {
  const fList = useServerFn(listPlaybookProposals);
  const fDecide = useServerFn(decidePlaybookProposal);
  const qc = useQueryClient();
  const confirmDialog = useConfirm();
  const [showAll, setShowAll] = useState(false);

  const q = useQuery({ queryKey: ["playbook-proposals"], queryFn: () => fList() });

  const decide = useMutation({
    mutationFn: (v: { proposalId: string; decision: "confirm" | "dismiss" }) =>
      fDecide({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(
        v.decision === "confirm"
          ? "Playbook adopted. It stays on the record with its source learnings."
          : "Proposal dismissed for good.",
      );
      // The proposal is also a Call in the Today queue - keep both in sync.
      for (const key of ["playbook-proposals", "needs-you"])
        qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Dismiss is permanent (the sweep never re-proposes a dismissed group key),
  // so it is confirm-gated per the destructive-actions convention.
  const requestDecide = (proposalId: string, decision: "confirm" | "dismiss") => {
    if (decision === "dismiss") {
      void confirmDialog({
        title: "Dismiss this proposed playbook?",
        body: "This dismisses the proposal for good. The same lesson will not be proposed again.",
        confirmLabel: "Dismiss for good",
        destructive: true,
      }).then((ok) => {
        if (ok) decide.mutate({ proposalId, decision });
      });
      return;
    }
    decide.mutate({ proposalId, decision });
  };

  const open = (q.data?.proposals ?? []).filter((p) => p.status === "proposed");

  if (q.isError) {
    // A load failure must read as a failure, not as "nothing proposed".
    return (
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
        }}
      >
        <MonoLabel>Playbook proposals · failed to load</MonoLabel>
        <p style={{ fontSize: "var(--text-label-13)", color: "var(--text-muted)", marginTop: 8 }}>
          {(q.error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          type="button"
          onClick={() => void q.refetch()}
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            marginTop: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Retry · reloads proposals
        </button>
      </div>
    );
  }

  // Nothing proposed (or still loading): stay out of the way - the outcome
  // feed below is the landing content, and proposals only earn space when a
  // decision is actually waiting.
  if (q.isPending || open.length === 0) return null;

  return (
    <section aria-label="Proposed playbooks" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <MonoLabel style={{ fontSize: "var(--text-label-12)" }}>Proposed playbooks</MonoLabel>
        <span style={{ fontSize: "var(--text-label-12)", color: "var(--text-faint)" }}>
          the same lesson repeated until it became a method - adopt it or dismiss it
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(showAll ? open : open.slice(0, VISIBLE_PROPOSALS)).map((p) => (
          <ProposalCard
            key={p.id}
            p={p}
            busy={decide.isPending && decide.variables?.proposalId === p.id}
            onDecide={(decision) => requestDecide(p.id, decision)}
          />
        ))}
        {open.length > VISIBLE_PROPOSALS ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-label-13)",
              fontWeight: 500,
              color: "var(--text-muted)",
              background: "transparent",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "8px 14px",
            }}
          >
            {showAll ? "Show fewer" : `Show ${open.length - VISIBLE_PROPOSALS} more`}
          </button>
        ) : null}
      </div>
    </section>
  );
}
