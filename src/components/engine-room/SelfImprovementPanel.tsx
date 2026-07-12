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
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert, Circle } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { MonoLabel, type MonoLabelTone } from "@/components/obsidian";
import { getSelfImprovementProposals } from "@/lib/self-improve.functions";
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
        message={`Self-improvement signals did not load. ${query.error instanceof Error ? query.error.message : "The read failed."}`}
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
