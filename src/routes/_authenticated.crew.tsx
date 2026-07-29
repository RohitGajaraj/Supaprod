import { createFileRoute, redirect } from "@tanstack/react-router";

// Crew is one of the five decided rail rows (session-handoff.md "What is
// decided"), but it has no surface of its own yet: /agents was mothballed in
// v5 and the roster now lives inside Engine Room > Safety > Team. Rather than
// ship a placeholder page or a dead rail row, /crew resolves to where the
// roster genuinely is today.
//
// KNOWN GAP, closed by step 4 of the rebuild: because this redirects into
// Engine Room, the rail lights "Engine room" and not "Crew" after the jump.
// The prototype's screen 4 is the real Crew surface and replaces this file.
export const Route = createFileRoute("/_authenticated/crew")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "safety", view: "team" } });
  },
});
