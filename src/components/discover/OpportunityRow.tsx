import { Button, PencilNote, VerdictChip } from "@/components/obsidian";
import type { VerdictWord } from "./format";

export interface OpportunityRowProps {
  ice: number;
  title: string;
  sub: string;
  verdict: VerdictWord;
  hasPencil: boolean;
  onChallenge: () => void;
  challengePending: boolean;
}

/**
 * One ICE-ranked opportunity. Reuses the canonical `VerdictChip` (its 4
 * scored hues match this row's literal spec values exactly; PENDING keeps
 * VerdictChip's own neutral rather than forking a second PENDING style) and
 * `PencilNote` (the app's one pencil-annotation anatomy) rather than
 * hand-rolling row-local variants, per the "one object, one anatomy" law.
 */
export function OpportunityRow({
  ice,
  title,
  sub,
  verdict,
  hasPencil,
  onChallenge,
  challengePending,
}: OpportunityRowProps) {
  return (
    <div
      className="relative flex items-center transition-colors hover:[background-color:#141416]"
      style={{
        backgroundColor: "#111113",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        gap: "16px",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {hasPencil ? (
        <PencilNote
          ink="best-bet"
          style={{ position: "absolute", top: "-11px", right: "14px", fontSize: "17px" }}
        >
          best bet
        </PencilNote>
      ) : null}

      <div className="flex-none text-center" style={{ width: "56px" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "23px",
            fontWeight: 460,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {ice.toFixed(1)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "7.5px",
            letterSpacing: "0.14em",
            color: "var(--text-faint)",
            marginTop: "3px",
          }}
        >
          ICE
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--text-subtle)" }}>{sub}</div>
      </div>

      <VerdictChip tone={verdict} className="flex-none" />

      <Button
        variant="secondary"
        className="flex-none"
        style={{ fontSize: "12px", padding: "6px 13px", borderRadius: "7px" }}
        onClick={(event) => {
          event.stopPropagation();
          onChallenge();
        }}
        loading={challengePending}
        title="The Critic red-teams this bet · receipts attached"
      >
        Challenge
      </Button>
    </div>
  );
}
