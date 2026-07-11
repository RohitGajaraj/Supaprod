/**
 * RPT-44 - Intent-vs-built diff receipt (server fn).
 *
 * Reads a PRD's stated intent (its Outcome Contract success metrics, or the
 * acceptance-criteria lines of its body when no contract exists) and the
 * changeset that best represents what shipped for it, then renders an honest
 * text-evidence receipt: which intent points show up in the release notes and
 * which do not. The grading lives in the pure `intent-diff` core; this fn only
 * fetches and shapes. When nothing has shipped yet it returns has_build:false
 * with an empty receipt so the caller can show a calm empty state.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { OutcomeContractSchema } from "@/lib/discovery.functions";
import { pickChangesetForPrd, type ChangesetForPrd } from "@/lib/studio-ship";
import { buildIntentReceipt, extractIntentPoints, type ContractLike } from "@/lib/intent-diff";

// The changeset columns this fn needs: the ranking fields pickChangesetForPrd
// reads, plus the human-facing built text and the PR link to cite.
type ReceiptChangeset = ChangesetForPrd & {
  pr_url?: string | null;
  title?: string | null;
  summary?: string | null;
};

export const getIntentVsBuiltReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prdId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: prd, error: prdErr } = await supabase
      .from("prds")
      .select("id,title,body_md,contract")
      .eq("id", data.prdId)
      .single();
    if (prdErr || !prd) throw new Error(prdErr?.message ?? "Spec not found");

    const { data: csRows, error: csErr } = await supabase
      .from("studio_changesets")
      .select("id,status,release_notes,summary,title,pr_url,pr_number,updated_at")
      .eq("prd_id", prd.id)
      .order("updated_at", { ascending: false });
    if (csErr) throw new Error(csErr.message);

    const built = pickChangesetForPrd((csRows ?? []) as ReceiptChangeset[]);

    // Parse leniently: an odd-shaped contract should degrade to the body
    // fallback, never throw. extractIntentPoints handles a null contract.
    const parsed = OutcomeContractSchema.partial().safeParse(prd.contract ?? {});
    const contract: ContractLike = parsed.success ? parsed.data : null;
    const points = extractIntentPoints(contract, prd.body_md ?? "");

    if (!built) {
      return {
        receipt: buildIntentReceipt(
          { title: prd.title ?? "", points: [] },
          { release_notes: null, summary: null },
        ),
        changeset: null,
        has_build: false as const,
      };
    }

    const receipt = buildIntentReceipt(
      { title: prd.title ?? "", points },
      { release_notes: built.release_notes ?? null, summary: built.summary ?? null },
    );

    return {
      receipt,
      changeset: {
        pr_url: built.pr_url ?? null,
        pr_number: built.pr_number ?? null,
        title: built.title ?? null,
      },
      has_build: true as const,
    };
  });
