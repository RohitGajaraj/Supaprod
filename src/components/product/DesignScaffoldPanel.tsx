// DEF-04 (generative half) — AI-drafted design scaffold from a PRD spec.
// Shown below DesignReadinessPanel on the PRD detail page.
// Renders the generated HTML in a sandboxed iframe (null origin, no CDN deps).
// DSN-01: approve/reject writes back a design-memory learning candidate.
// DSN-02: "Check design consistency" runs the Critic's design lens on the mockup.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
} from "lucide-react";
import {
  generateDesignScaffold,
  getPersistedScaffold,
  runScaffoldDesignCritic,
  getDesignGate,
  decideDesignGate,
  toggleDesignStage,
  type ScaffoldDesignCriticResult,
} from "@/lib/design-scaffold.functions";
import { recordDesignScaffoldFeedback } from "@/lib/design-memory.functions";
import { Action, Approve } from "@/components/meridian/surface-parts";
import { toast } from "@/lib/notify";

export function DesignScaffoldPanel({ prdId, specBody }: { prdId: string; specBody: string }) {
  const [scaffold, setScaffold] = useState<{ html: string; generatedAt: string } | null>(null);
  const [prestaged, setPrestaged] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"approved" | "rejected" | null>(null);
  const [designReview, setDesignReview] = useState<ScaffoldDesignCriticResult["review"] | null>(
    null,
  );
  const fGenerate = useServerFn(generateDesignScaffold);
  const fGetPersisted = useServerFn(getPersistedScaffold);
  const fFeedback = useServerFn(recordDesignScaffoldFeedback);
  const fDesignCritic = useServerFn(runScaffoldDesignCritic);
  const fGate = useServerFn(getDesignGate);
  const fDecideGate = useServerFn(decideDesignGate);
  const fToggleStage = useServerFn(toggleDesignStage);
  const qc = useQueryClient();

  // SW-4 / mission 3.4: the design gate between Define and Build. When the
  // workspace's stage is on, the verdict buttons below decide the gate AND
  // write the taste learning; dispatch is blocked server-side until approved.
  const gateQ = useQuery({
    queryKey: ["design-gate", prdId],
    queryFn: () => fGate({ data: { prdId } }),
  });
  const gate = gateQ.data ?? null;

  const decideGate = useMutation({
    mutationFn: async (approve: boolean) => {
      const res = await fDecideGate({ data: { prdId, decision: approve ? "approve" : "reject" } });
      // The gate verdict doubles as scaffold feedback: same judgment, one click.
      await fFeedback({ data: { prdId, specExcerpt: specBody.slice(0, 4000), approved: approve } });
      return res;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-gate", prdId] });
      toast.success(
        res.status === "approved"
          ? "Design approved. This spec can now dispatch to Build."
          : "Changes requested. The gate stays closed until a design is approved.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStage = useMutation({
    mutationFn: (enabled: boolean) => fToggleStage({ data: { enabled } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["design-gate", prdId] });
      toast.success(
        res.enabled
          ? "Design stage on for this workspace."
          : "Design stage off for this workspace.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // AGT-03: a scaffold may already be sitting here, pre-staged while the
  // operator was reviewing this spec's freshly drafted contract — load it
  // instead of making them wait for a fresh generation call.
  const persistedQ = useQuery({
    queryKey: ["prd-scaffold", prdId],
    queryFn: () => fGetPersisted({ data: { prdId } }),
  });
  useEffect(() => {
    if (persistedQ.data && !scaffold) {
      setScaffold({ html: persistedQ.data.html, generatedAt: persistedQ.data.generatedAt });
      setPrestaged(persistedQ.data.source === "speculative");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedQ.data]);

  const mutation = useMutation({
    mutationFn: () => fGenerate({ data: { prdId, specBody } }),
    onSuccess: (data) => {
      setScaffold(data);
      setPrestaged(false);
      setFeedbackGiven(null);
      setDesignReview(null);
    },
  });

  const designCritic = useMutation({
    mutationFn: () => fDesignCritic({ data: { prdId, html: scaffold?.html ?? "" } }),
    onSuccess: (res) => {
      setDesignReview(res.review);
      if (!res.review) toast.error("Design review could not run. Try again.");
    },
    onError: (e: Error) => toast.error(e.message),
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

  // The gate decision row and the owner's stage switch: rendered wherever the
  // stage is on, independent of whether a mockup exists yet, so the controls
  // that unblock dispatch can never be out of reach (mission 3.4 review).
  // The gate decision row and the owner's stage switch: rendered wherever the
  // stage is on, independent of whether a mockup exists yet, so the controls
  // that unblock dispatch can never be out of reach (mission 3.4 review).
  const approvedMark = { color: "var(--moss)" };
  const rejectedMark = { color: "var(--mrd-fail)" };
  const gateActions = gate?.stageEnabled ? (
    <div className="flex items-center gap-1.5">
      {/* TIER: Approve. Releases the design gate - dispatch stays blocked
          server-side until this lands. */}
      <Approve busy={decideGate.isPending} onClick={() => decideGate.mutate(true)}>
        <ThumbsUp
          className="h-3 w-3"
          style={gate.status === "approved" ? approvedMark : undefined}
        />
        Approve design
      </Approve>
      {/* TIER: Action, default face. The negative gate verdict; the release
          control stays orchid alone. */}
      <Action busy={decideGate.isPending} onClick={() => decideGate.mutate(false)}>
        <ThumbsDown
          className="h-3 w-3"
          style={gate.status === "rejected" ? rejectedMark : undefined}
        />
        Request changes
      </Action>
    </div>
  ) : null;

  const ownerToggle = gate?.isOwner ? (
    <div className="flex justify-end border-t hairline px-4 py-2">
      {/* TIER: Action, quiet face. Flips a workspace setting - a secondary owner
          move, nothing held waits on it. */}
      <Action variant="quiet" busy={toggleStage.isPending} onClick={() => toggleStage.mutate(!gate.stageEnabled)}>
        {gate.stageEnabled
          ? "Turn the design stage off for this workspace"
          : "Turn the design stage on for this workspace"}
      </Action>
    </div>
  ) : null;

  const gateChip = gate?.stageEnabled ? (
    <span
      className="rounded-full border hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{
        color:
          gate.status === "approved"
            ? "var(--moss)"
            : gate.status === "rejected"
              ? "var(--mrd-fail)"
              : "var(--ember-text)",
      }}
    >
      Gate · {gate.status ?? "pending"}
    </span>
  ) : null;

  // Too short to scaffold (< 40 chars, same threshold as server). The gate
  // still applies to a short spec, so its controls stay reachable here; only
  // the mockup machinery goes quiet.
  if (!specBody || specBody.trim().length < 40) {
    if (!gate?.stageEnabled) return null;
    return (
      <div className="mt-4 mb-6 rounded-lg border hairline bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[13px] font-medium text-foreground">Design gate</span>
            {gateChip}
          </div>
          {gateActions}
        </div>
        {ownerToggle}
      </div>
    );
  }

  return (
    <div className="mt-4 mb-6 rounded-lg border hairline bg-card">
      <div className="flex items-center justify-between border-b hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-foreground">Design mockup</span>
          {gateChip}
          {prestaged && (
            <span
              className="rounded-full border hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
              style={{ color: "var(--blossom)" }}
            >
              Pre-staged while you reviewed
            </span>
          )}
        </div>
        {/* TIER: Action, default face. Generates the mockup draft - real work,
            but not the control that releases anything. */}
        <Action busy={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : scaffold ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {mutation.isPending ? "Generating…" : scaffold ? "Regenerate" : "Generate mockup"}
        </Action>
      </div>

      {mutation.isError && (
        <div
          className="flex items-center gap-2 border-b hairline px-4 py-3 text-xs"
          style={{ color: "var(--mrd-fail)" }}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Generation failed. Try again."}
          </span>
        </div>
      )}

      {mutation.isPending && !scaffold && (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
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
            // The mockup document is the artifact: it styles its own canvas and
            // assumes a light page, so the iframe keeps a white base to avoid a
            // dark flash before srcDoc paints. The chrome around it is tokens.
            className="w-full rounded-lg border hairline bg-card"
            style={{ height: 540 }}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {gate?.stageEnabled ? (
                // TIER: Approve. Same design gate as above, rendered under the
                // mockup - dispatch waits on this click.
                <Approve busy={decideGate.isPending} onClick={() => decideGate.mutate(true)}>
                  <ThumbsUp
                    className="h-3 w-3"
                    style={
                      feedbackGiven === "approved" || gate?.status === "approved"
                        ? approvedMark
                        : undefined
                    }
                  />
                  Approve design
                </Approve>
              ) : (
                // TIER: Action, quiet face. Records a design-memory preference;
                // nothing is held and nothing unblocks.
                <Action
                  variant="quiet"
                  busy={feedback.isPending}
                  disabled={feedbackGiven !== null}
                  onClick={() => feedback.mutate(true)}
                >
                  <ThumbsUp
                    className="h-3 w-3"
                    style={feedbackGiven === "approved" ? approvedMark : undefined}
                  />
                  Good fit
                </Action>
              )}
              {gate?.stageEnabled ? (
                // TIER: Action, default face. Negative gate verdict under the mockup.
                <Action busy={decideGate.isPending} onClick={() => decideGate.mutate(false)}>
                  <ThumbsDown
                    className="h-3 w-3"
                    style={
                      feedbackGiven === "rejected" || gate?.status === "rejected"
                        ? rejectedMark
                        : undefined
                    }
                  />
                  Request changes
                </Action>
              ) : (
                // TIER: Action, quiet face. Records the preference; nothing settles.
                <Action
                  variant="quiet"
                  busy={feedback.isPending}
                  disabled={feedbackGiven !== null}
                  onClick={() => feedback.mutate(false)}
                >
                  <ThumbsDown
                    className="h-3 w-3"
                    style={feedbackGiven === "rejected" ? rejectedMark : undefined}
                  />
                  Not a fit
                </Action>
              )}
              {/* TIER: Action, default face. Dispatches the design-lens run - it
                  produces findings and releases nothing. */}
              <Action busy={designCritic.isPending} onClick={() => designCritic.mutate()}>
                {designCritic.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                {designCritic.isPending ? "Checking…" : "Check design consistency"}
              </Action>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated {new Date(scaffold.generatedAt).toLocaleTimeString()} · AI-drafted, review
              before use
            </p>
          </div>

          {designReview && (
            <div className="mt-3 rounded-lg border hairline bg-background/60 p-3">
              <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                Design consistency · {designReview.verdict}
              </div>
              {designReview.findings.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No hierarchy, accessibility, IA, or consistency issues flagged.
                </p>
              ) : (
                <ul className="space-y-2">
                  {designReview.findings.map((f, i) => (
                    <li key={i} className="text-xs leading-mrd-snug text-foreground">
                      {f.issue}
                      <span className="block text-muted-foreground">
                        {f.principle}
                        {f.standing_decision ? ` · violates "${f.standing_decision}"` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!scaffold && !mutation.isPending && !mutation.isError && (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          Generate an AI-drafted screen mockup from this spec.
        </div>
      )}

      {!scaffold && gate?.stageEnabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t hairline px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            The gate can be decided without a mockup; generating one first gives the verdict teeth.
          </span>
          {gateActions}
        </div>
      )}

      {ownerToggle}
    </div>
  );
}
