import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMissionChain } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";
import { MonoLabel } from "@/components/cadence/Primitives";
import { SkeletonBlock } from "./studio-ui";

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
    return (
      <div
        style={{
          border: "1px dashed var(--hairline)",
          borderRadius: 12,
          padding: "48px 0",
          textAlign: "center",
          fontSize: 12.5,
          color: "var(--text-subtle)",
        }}
      >
        <MonoLabel style={{ color: "var(--madder)" }}>Couldn't load the chain</MonoLabel>
        <p style={{ marginTop: 6 }}>{(chainQ.error as Error)?.message}</p>
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
          fontSize: 12.5,
          color: "var(--text-subtle)",
        }}
      >
        No chain evidence for this mission yet.
      </div>
    );
  }

  return <MissionChain chain={chainQ.data} />;
}
