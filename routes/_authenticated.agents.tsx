import { createFileRoute, redirect } from "@tanstack/react-router";

// /agents mothballed (v5); AGENT-EXP relocated the roster to Engine Room >
// Team. LOOM W2 folded /govern?tab=team into the Safety room (TEAM view),
// so this lands there in one hop. The user meets agents in motion (the
// relay), not as a managed roster.
export const Route = createFileRoute("/_authenticated/agents")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "safety", view: "team" } });
  },
});
