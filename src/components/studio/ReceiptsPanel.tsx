import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMissionChain } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";
import { Empty, Failed, Loading } from "@/components/shell/primitives";

/**
 * PC-22 — the provenance chain, surfaced on the run. Reuses SW-5's pipeline
 * chain assembler wholesale (signal -> ... -> outcome from real rows); no new
 * join logic. An eng lead reading a run's own PR/CI history gets the full walk
 * without leaving to the Trust Ledger surface.
 *
 * THE TAB READS "EVIDENCE", and only the label moved. "Receipts" is measured at
 * 3.0 uses per million words of operator conversation, which is dead, and the
 * ones that survive read it as billing; "evidence" is what this chain is. The
 * search key stays `receipts` so every ?tab=receipts link that ever worked still
 * lands here — a word nobody says is worth changing, a URL is not.
 *
 * THE THREE STATES ARE NOW THE SHELL'S. This drew a shimmer skeleton for the
 * wait, a legacy card for the failure and a dashed box for the empty, all on the
 * pre-token palette, inside a run surface built entirely out of primitives. A
 * failed read still refuses to wear the empty state's clothes — that distinction
 * was right and is kept — it just wears the system's clothes for it now.
 */
export function ReceiptsPanel({ missionId }: { missionId: string }) {
  const fChain = useServerFn(getMissionChain);
  const chainQ = useQuery({
    queryKey: ["mission-chain", missionId],
    queryFn: () => fChain({ data: { missionId } }),
  });

  if (chainQ.isPending) return <Loading>Walking the chain.</Loading>;

  if (chainQ.isError) {
    return (
      <Failed onRetry={() => void chainQ.refetch()}>
        {(chainQ.error as Error)?.message ?? "The chain did not load."}
      </Failed>
    );
  }

  if (!chainQ.data) {
    return <Empty>Nothing has been recorded against this run yet.</Empty>;
  }

  return <MissionChain chain={chainQ.data} />;
}
