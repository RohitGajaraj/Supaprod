import { createFileRoute, redirect } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

// /chat folds into the Ask (Cmd+J) summonable panel per OBS-12 - Ask is a
// panel over any screen now, never a full-page destination. The streaming
// client (SSE parse, meta/status handling) was ported into
// `src/components/obsidian/AskPanel.tsx`; the page's own threads rail,
// @agent mention picker, and Inline Mission Cockpit are calm-front
// reductions and were not carried into the panel (see OBS-12.md §3 Scope
// OUT / §8). The old parchment implementation lives in git history.
export const Route = createFileRoute("/_authenticated/chat")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
