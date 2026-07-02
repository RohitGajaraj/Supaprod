// DEF-04 (generative half) — AI-drafted design scaffold from a PRD spec.
// Shown below DesignReadinessPanel on the PRD detail page.
// Renders the generated HTML in a sandboxed iframe (null origin, no CDN deps).
// DSN-01: approve/reject writes back a design-memory learning candidate.
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, RefreshCw, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { generateDesignScaffold } from "@/lib/design-scaffold.functions";
import { recordDesignScaffoldFeedback } from "@/lib/design-memory.functions";
import { toast } from "@/lib/notify";

export function DesignScaffoldPanel({ prdId, specBody }: { prdId: string; specBody: string }) {
  const [scaffold, setScaffold] = useState<{ html: string; generatedAt: string } | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<"approved" | "rejected" | null>(null);
  const fGenerate = useServerFn(generateDesignScaffold);
  const fFeedback = useServerFn(recordDesignScaffoldFeedback);

  const mutation = useMutation({
    mutationFn: () => fGenerate({ data: { prdId, specBody } }),
    onSuccess: (data) => {
      setScaffold(data);
      setFeedbackGiven(null);
    },
  });

  const feedback = useMutation({
    mutationFn: (approved: boolean) =>
      fFeedback({ data: { prdId, specExcerpt: specBody.slice(0, 4000), approved } }),
    onSuccess: (res, approved) => {
      setFeedbackGiven(approved ? "approved" : "rejected");
      toast.success(
        res.learned > 0 ? "Noted. Added to the workspace's design memory for review." : "Noted.",
      );
    },
  });

  // Silent when the spec is too short to scaffold (< 40 chars — same threshold as server)
  if (!specBody || specBody.trim().length < 40) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-slate-700">Design mockup</span>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : scaffold ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {mutation.isPending ? "Generating…" : scaffold ? "Regenerate" : "Generate mockup"}
        </button>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-red-600 bg-red-50 border-b border-red-100">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Generation failed — try again."}
          </span>
        </div>
      )}

      {mutation.isPending && !scaffold && (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating design mockup from your spec…
        </div>
      )}

      {scaffold && (
        <div className="p-3">
          {/* srcDoc + null-origin sandbox: no external network, no parent frame access */}
          <iframe
            title="Design mockup"
            sandbox="allow-scripts allow-forms allow-modals"
            srcDoc={scaffold.html}
            className="w-full rounded-lg border border-slate-200 bg-white"
            style={{ height: 540 }}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => feedback.mutate(true)}
                disabled={feedback.isPending || feedbackGiven !== null}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ThumbsUp
                  className={
                    feedbackGiven === "approved" ? "h-3 w-3 text-emerald-600" : "h-3 w-3"
                  }
                />
                Good fit
              </button>
              <button
                type="button"
                onClick={() => feedback.mutate(false)}
                disabled={feedback.isPending || feedbackGiven !== null}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ThumbsDown className={feedbackGiven === "rejected" ? "h-3 w-3 text-red-500" : "h-3 w-3"} />
                Not a fit
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Generated {new Date(scaffold.generatedAt).toLocaleTimeString()} · AI-drafted, review
              before use
            </p>
          </div>
        </div>
      )}

      {!scaffold && !mutation.isPending && !mutation.isError && (
        <div className="px-4 py-6 text-center text-xs text-slate-400">
          Generate an AI-drafted screen mockup from this spec.
        </div>
      )}
    </div>
  );
}
