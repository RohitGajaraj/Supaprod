import { createFileRoute, redirect } from "@tanstack/react-router";

// /drift folded into Engine Room's Quality room per OBS-10 (IA consolidation).
export const Route = createFileRoute("/_authenticated/drift")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "quality", view: "drift" } });
  },
});
