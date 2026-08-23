// MissionOnboarding (front-end reimagining Phase 5): the calm, one-question,
// one-delight first run.
//
// Design principle (founder steering 2026-07-20): frictionless (no pressure, no
// cognitive load) AND delightful (interesting language, not typical onboarding
// boilerplate). Both, at once. The screen is built around one idea: YOU ARE
// ALREADY IN. Telling us what you are building is an optional gift to your future
// self (it sharpens every agent), never a gate.
//
// How that shows up:
//  - The forward action is ALWAYS available. It never disables. Empty it reads
//    "Walk me in" and just opens the app; with a sentence it reads "Continue"
//    and saves that sentence as the workspace brief's mission first.
//  - ONE question (the charter's "one input box per screen"); the only other
//    affordance is a quiet button (tour a sample), never a second input.
//  - No "Skip" fighting the primary: the one button IS the skip when empty.
//  - The voice does the reassuring: "Step one of one" tells you the whole
//    onboarding is this screen; "This isn't a form" says it out loud; the body
//    relieves blank-page pressure before it can build. No "Welcome to X", no
//    "Let's get started", no "Tell us about yourself".
//
// Honest: every claim is true (the mission really feeds every mission prompt;
// it is really editable in Settings), and "tour a sample" renders only when the
// seed is enabled, so it never silently no-ops. Ink aesthetic, one ember action.

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { upsertBrief } from "@/lib/briefs.functions";
import { completeOnboarding } from "@/lib/onboarding.functions";
import {
  triggerSampleWorkspace,
  isSampleWorkspaceEnabled,
} from "@/lib/onboarding/onboarding.functions";

export function MissionOnboarding() {
  const navigate = useNavigate();
  const saveBrief = useServerFn(upsertBrief);
  const finish = useServerFn(completeOnboarding);
  const exploreSample = useServerFn(triggerSampleWorkspace);
  const sampleEnabledFn = useServerFn(isSampleWorkspaceEnabled);

  const [answer, setAnswer] = useState("");
  const hasAnswer = answer.trim().length > 0;

  const sampleEnabled = useQuery({
    queryKey: ["sample-workspace-enabled"],
    queryFn: () => sampleEnabledFn(),
  });

  // The single forward path. With a sentence it becomes the brief mission; empty
  // it simply opens the app. Either way it always succeeds and never blocks.
  const enter = useMutation({
    mutationFn: async () => {
      const mission = answer.trim();
      if (mission) await saveBrief({ data: { mission } });
      await finish();
    },
    onSuccess: () => {
      if (hasAnswer) toast.success("Noted. Your crew starts from there.");
      void navigate({ to: "/today" });
    },
    onError: () => toast.error("That did not open. One more try?"),
  });

  const explore = useMutation({
    mutationFn: () => exploreSample(),
    onSuccess: () => {
      toast.success("Have a wander. Every row in there is real, worked data.");
      void navigate({ to: "/today" });
    },
    onError: () => toast.error("The sample would not open. One more try?"),
  });

  const busy = enter.isPending || explore.isPending;

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6"
      style={{ background: "var(--ink-bg)", color: "var(--ink-body)" }}
    >
      <div className="w-full max-w-xl">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-subtle)" }}
        >
          Step one of one
        </p>
        <h1
          className="mt-3 text-[26px] font-medium leading-mrd-tight"
          style={{ color: "var(--ink-text)" }}
        >
          What are you building?
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.55]" style={{ color: "var(--ink-subtle)" }}>
          Tell me in a sentence and your agents open on your world instead of a blank page. No clean
          answer yet? Walk in and tell me later. You're already inside.
        </p>

        <textarea
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !busy) enter.mutate();
          }}
          rows={3}
          maxLength={2000}
          placeholder="A money app that helps people save without thinking about it."
          className="ink-focus mt-5 w-full resize-none rounded-xl border bg-[var(--ink-panel)] px-4 py-3 text-[15px] leading-[1.5]"
          style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/* Always available: empty walks you in, a sentence saves the brief first. */}
          <button
            type="button"
            disabled={busy}
            onClick={() => enter.mutate()}
            className="ink-focus inline-flex h-10 items-center rounded-lg px-4 text-[13.5px] font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--voice-human)", color: "#0a0a0a" }}
          >
            {enter.isPending ? "Opening…" : hasAnswer ? "Continue" : "Walk me in"}
            {hasAnswer ? (
              <span
                className="ml-2 rounded px-1 font-mono text-[10px]"
                style={{ background: "rgba(10,10,10,0.28)", color: "rgba(10,10,10,0.72)" }}
              >
                {"⌘⏎"}
              </span>
            ) : null}
          </button>

          {sampleEnabled.data?.enabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => explore.mutate()}
              className="ink-focus inline-flex h-10 items-center rounded-lg px-3 text-[13px] transition-colors hover:bg-[var(--ink-raised)] disabled:opacity-40"
              style={{ color: "var(--ink-subtle)" }}
            >
              {explore.isPending ? "Opening…" : "Or tour a workspace we already filled"}
            </button>
          ) : null}
        </div>

        <p className="mt-6 text-[12px]" style={{ color: "var(--ink-faint)" }}>
          This isn't a form. Reword it, or ignore it, whenever, in Settings.
        </p>
      </div>
    </div>
  );
}
