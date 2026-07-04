import { createFileRoute, redirect } from "@tanstack/react-router";

// /swarm absorbed into /missions per F-IA-V4; AGENT-EXP moved the roster to
// Engine Room > Team. LOOM W2 folded /govern?tab=team into the Safety room
// (TEAM view), so this lands there in one hop.
export const Route = createFileRoute("/_authenticated/swarm")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "safety", view: "team" } });
  },
});
