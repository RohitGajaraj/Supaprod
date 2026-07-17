import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMissionChain } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";
import { MonoLabel } from "@/components/cadence/Primitives";
import { LOOM_CARD, SkeletonBlock } from "./studio-ui";

/**
 * PC-22 — the eng receipts chain, surfaced on Build detail. Reuses SW-5's
 * pipeline chain assembler wholesale (signal -> ... -> outcome from real
 * rows); no new join logic. An eng lead reading a mission's own PR/CI history
 * gets the full provenance walk without leaving to the Trust Ledger surface.
 */
export function ReceiptsPanel({ missionId }: { missionId: string }) {
  const fChain = useServerFn(getMissionChain);
  const chainQ = useQuery({
    queryKey: ["mission-chain", missionId],
    queryFn: () => fChain({ data: { missionId } }),
  });

  if (chainQ.isPending) return <SkeletonBlock height={280} />;

  if (chainQ.isError) {
    // An error never wears the empty state's clothes: solid card, madder
    // cause line, one retry action (not the dashed nothing-here box).
    return (
      <div style={{ ...LOOM_CARD, padding: 24 }}>
        <MonoLabel style={{ color: "var(--madder)" }}>Couldn't load the chain</MonoLabel>
        <p style={{ marginTop: 6, fontSize: "var(--text-label-13)", color: "var(--text-muted)" }}>
          {(chainQ.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => chainQ.refetch()}
          className="btn btn-ghost btn-sm loom-press"
          style={{ marginTop: 12 }}
        >
          Retry · reloads the chain
        </button>
      </div>
    );
  }

  if (!chainQ.data) {
    return (
      <div
        style={{
          border: "1px dashed var(--hairline)",
          borderRadius: 12,
          padding: "48px 0",
          textAlign: "center",
          fontSize: "var(--text-label-13)",
          color: "var(--text-subtle)",
        }}
      >
        No chain evidence for this mission yet.
      </div>
    );
  }

  return <MissionChain chain={chainQ.data} />;
}
