import { createFileRoute, redirect } from "@tanstack/react-router";

// LOOM W2: Prompt Studio has a real home now - the Engine Room's Quality
// room (PROMPTS view). The old redirect dropped this on the bare glance
// with no prompts anchor (the audit's "dormant feature" finding).
export const Route = createFileRoute("/_authenticated/prompts")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "quality", view: "prompts" } });
  },
});
