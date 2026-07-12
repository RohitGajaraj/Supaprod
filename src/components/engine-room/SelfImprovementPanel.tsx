// RPT-50 surface: makes the self-improvement engine VISIBLE in the Engine Room.
//
// Reads the shipped `getSelfImprovementProposals` server fn (Cadence-on-Cadence:
// its OWN failing eval suites, over-corrected agents, and losing playbooks) and
// renders the deterministic proposals it returns, already sorted high-severity
// first. Nothing here guesses or calls the AI chokepoint; every line traces to a
// real number over a real sample, and the caption says so plainly.
//
// Idiom: matches the sibling Quality-room panels (rounded-lg card on a hairline
// border, MonoLabel eyebrows, PanelPending on load, ErrorRetry on failure) and
// stays inside the existing destructive/muted tokens. High wears the destructive
// madder; medium and low stay on the muted grays. The severity word rides beside
// the icon so state is never color-only (the RoomCard grayscale rule).
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TriangleAlert, Circle, Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { MonoLabel, type MonoLabelTone } from "@/components/obsidian";
import {
  getSelfImprovementProposals,
  enrichSelfImproveProposal,
  applySelfImproveFix,
} from "@/lib/self-improve.functions";
import type { ProposalSeverity } from "@/lib/self-improve";
import { PanelPending, ErrorRetry } from "./RoomDetail";

/** Severity presentation, held to the destructive/muted palette (no loud hues):
 * high = the destructive madder + a warning triangle; medium/low = muted grays +
 * a plain circle. The word is shown too, so the flag never reads by color alone. */
const SEVERITY_META: Record<
  ProposalSeverity,
  { word: string; color: string; tone: MonoLabelTone; Icon: typeof TriangleAlert }
> = {
  high: { word: "HIGH", color: "var(--madder-bright)", tone: "madder", Icon: TriangleAlert },
  medium: { word: "MEDIUM", color: "var(--text-muted)", tone: "muted", Icon: Circle },
  low: { word: "LOW", color: "var(--text-faint)", tone: "faint", Icon: Circle },
};

function MonoChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="tabular-nums"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-floor)",
        color: "var(--text-muted)",
        border: "1px solid var(--hairline)",
        borderRadius: 6,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/**
 * RPT-50 AI rung (the LAYER over a flag): an on-demand, grounded "why + suggested
 * fix". The deterministic flag above decides the problem; this only explains one the
 * numbers already earned, grounded in the real records, clearly marked AI-composed.
 * Human-triggered so the AI call runs at most once per flag (cost-controlled).
 */
function ProposalEnricher({
  workspaceId,
  kind,
  subjectRef,
}: {
  workspaceId: string;
  kind: "eval" | "agent" | "playbook";
  subjectRef: string;
}) {
  const fEnrich = useServerFn(enrichSelfImproveProposal);
  const enrich = useMutation({
    mutationFn: () => fEnrich({ data: { workspaceId, kind, subjectRef } }),
  });
  const fApply = useServerFn(applySelfImproveFix);
  const apply = useMutation({
    mutationFn: () => fApply({ data: { workspaceId, kind, subjectRef } }),
  });
  const applied = apply.data?.applied ?? false;
  const data = enrich.data;

  if (!data) {
    return (
      <button
        type="button"
        disabled={enrich.isPending}
        onClick={() => enrich.mutate()}
        className="loom-press outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
          background: "none",
          border: "none",
          padding: 0,
          cursor: enrich.isPending ? "wait" : "pointer",
        }}
      >
        <Sparkles size={12} aria-hidden="true" />
        {enrich.isPending ? "Reading the records..." : "Explain + suggest a fix"}
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-control)",
        background: "var(--surface-recessed)",
        border: "1px solid var(--hairline)",
      }}
    >
      <MonoLabel style={{ display: "block", marginBottom: 5 }}>Why this is happening</MonoLabel>
      <p style={{ fontSize: 12.5, color: "var(--text-body)", margin: 0, lineHeight: 1.55 }}>
        {data.explanation}
      </p>
      {data.suggested_fix ? (
        <>
          <MonoLabel style={{ display: "block", margin: "10px 0 5px" }}>Suggested fix</MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-body)", margin: 0, lineHeight: 1.55 }}>
            {data.suggested_fix}
          </p>
        </>
      ) : null}
      {/* Transparency: this half IS AI-composed (unlike the flag), and it says how many
          real records it was grounded on. */}
      <span
        style={{
          display: "inline-block",
          marginTop: 10,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-faint)",
        }}
      >
        AI-composed ·{" "}
        {data.grounded_on > 0 ? `grounded in ${data.grounded_on} records` : "not enough records"}
      </span>

      {/* RPT-50 rung 3 (increment 1): APPLY closes the loop. The fix becomes a
          governed, injection-screened, reversible house rule (live in every agent's
          prompt) + a receipted decision on the ledger. Human-triggered here (the
          Apply click is the action); the unattended auto-apply mode is the Routine
          toggle increment. */}
      {data.suggested_fix ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
          {applied ? (
            <p style={{ fontSize: 12.5, color: "var(--moss-bright)", margin: 0, lineHeight: 1.5 }}>
              Applied. Your agents now follow this as a house rule, and the change is on the Trust
              Ledger. It is reversible.
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={apply.isPending}
                onClick={() => apply.mutate()}
                className="loom-press outline-none transition-colors hover:[color:var(--text-primary)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-floor)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-body)",
                  background: "transparent",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: "var(--radius-control)",
                  padding: "6px 12px",
                  cursor: apply.isPending ? "wait" : "pointer",
                }}
              >
                {apply.isPending ? "Applying..." : "Apply this fix"}
              </button>
              {apply.data && !apply.data.applied && apply.data.reason ? (
                <p style={{ fontSize: 12, color: "var(--text-subtle)", margin: "6px 0 0" }}>
                  {apply.data.reason}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SelfImprovementPanel({ workspaceId }: { workspaceId?: string } = {}) {
  const { activeWorkspace } = useWorkspace();
  const wsId = workspaceId ?? activeWorkspace?.id;
  const fProposals = useServerFn(getSelfImprovementProposals);
  const query = useQuery({
    queryKey: ["self-improve", wsId],
    queryFn: () => fProposals({ data: { workspaceId: wsId as string } }),
    enabled: !!wsId,
  });

  if (!wsId || query.isLoading) {
    return <PanelPending />;
  }
  if (query.isError) {
    return (
      <ErrorRetry
        message="Self-improvement signals did not load."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const proposals = query.data?.proposals ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <MonoLabel style={{ display: "block", marginBottom: 8 }}>
          What Cadence would improve about itself
        </MonoLabel>
        {/* The honesty caption, plain-spoken: these are rule-fired flags, not AI
            guesses. It stays true whether the list is full or empty. */}
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            lineHeight: 1.5,
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Deterministic flags from Cadence's own quality signals: failing eval suites,
          over-corrected agents, and losing playbooks. Each one fired on a real number over a real
          sample. Nothing here is an AI guess.
        </p>
      </div>

      {proposals.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "22px 20px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-base)",
              lineHeight: 1.5,
              color: "var(--text-subtle)",
              margin: 0,
            }}
          >
            No quality issues flagged. Signals are healthy or still gathering data.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {proposals.map((p) => {
            const meta = SEVERITY_META[p.severity];
            const { Icon } = meta;
            return (
              <article
                key={p.id}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px 18px",
                }}
              >
                <div className="flex items-start" style={{ gap: 12 }}>
                  <Icon
                    size={15}
                    aria-hidden="true"
                    style={{ color: meta.color, flexShrink: 0, marginTop: 2 }}
                  />
                  <div className="min-w-0" style={{ flex: 1 }}>
                    <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontWeight: 600,
                          fontSize: "var(--text-base)",
                          color: "var(--text-primary)",
                          margin: 0,
                        }}
                      >
                        {p.title}
                      </h3>
                      <MonoLabel tone={meta.tone} style={{ flexShrink: 0 }}>
                        {meta.word}
                      </MonoLabel>
                    </div>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-subtle)",
                        marginTop: 8,
                        lineHeight: 1.55,
                      }}
                    >
                      {p.detail}
                    </p>
                    <div
                      className="flex items-center"
                      style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}
                    >
                      <MonoChip>{p.kind}</MonoChip>
                      <MonoChip>{p.evidence}</MonoChip>
                    </div>
                    {wsId && p.subject_ref ? (
                      <ProposalEnricher
                        workspaceId={wsId}
                        kind={p.kind}
                        subjectRef={p.subject_ref}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
