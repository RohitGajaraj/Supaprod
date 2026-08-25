import { createFileRoute, redirect } from "@tanstack/react-router";
import type { RoomKey } from "@/lib/engine-room-glance";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

// LOOM W2 - /govern folded into /engine-room (the audit's #1 IA insight: ONE
// Engine Room, not two differently-themed surfaces sharing the name). Every
// live tab now lives as a room view; this stub maps the old ?tab= contract
// to the right room/view and forwards the drill params (?suite=, ?agent=,
// ?surface=) so old deep links and in-app drills land exactly (LOOM §9b:
// redirects never drop params their target honors). Legacy URLs redirect
// one hop, forever - see src/lib/legacy-redirects.ts.
const TAB_TARGET: Record<string, { room: RoomKey; view: string }> = {
  controls: { room: "safety", view: "controls" },
  team: { room: "safety", view: "team" },
  approvals: { room: "record", view: "approvals" },
  "house-rules": { room: "safety", view: "house-rules" },
  guardrails: { room: "safety", view: "rules" },
  budgets: { room: "spend", view: "caps" },
  prompts: { room: "quality", view: "prompts" },
  evals: { room: "quality", view: "suites" },
  analytics: { room: "spend", view: "usage" },
  gauntlet: { room: "quality", view: "proof" },
  traces: { room: "record", view: "traces" },
  drift: { room: "quality", view: "drift" },
  incidents: { room: "safety", view: "incidents" },
  support: { room: "record", view: "support" },
};

type GovernSearch = {
  tab?: string;
  suite?: string;
  agent?: string;
  surface?: string;
};

export const Route = createFileRoute("/_authenticated/govern")({
  validateSearch: (search: Record<string, unknown>): GovernSearch => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
    suite: typeof search.suite === "string" ? search.suite : undefined,
    agent: typeof search.agent === "string" ? search.agent : undefined,
    surface: typeof search.surface === "string" ? search.surface : undefined,
  }),
  beforeLoad: ({ search }) => {
    // Attention was a second "what needs you" feed; Today owns the one
    // queue (v3 inherited law), so the old tab lands there.
    if (search.tab === "attention") {
      throw redirect({ to: SIGNED_IN_HOME });
    }
    const target = search.tab ? TAB_TARGET[search.tab] : undefined;
    if (target) {
      throw redirect({
        to: "/engine-room",
        search: {
          room: target.room,
          view: target.view,
          ...(search.suite ? { suite: search.suite } : {}),
          ...(search.agent ? { agent: search.agent } : {}),
          ...(search.surface ? { surface: search.surface } : {}),
        },
      });
    }
    // Bare or unknown tab: the glance.
    throw redirect({ to: "/engine-room" });
  },
});
