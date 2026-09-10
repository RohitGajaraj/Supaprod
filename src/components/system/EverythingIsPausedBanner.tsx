/**
 * EVERY AGENT IS HOLDING, AND ONLY ONE PANEL KNEW.
 *
 * A workspace pause stops every agent mid-step: "nothing runs whatever the
 * boundary says." Until this existed, that fact was visible on exactly one
 * governance panel. A person on Today, on the Brain, or watching a run saw a
 * product that looked ordinary and was completely stopped, and would read every
 * empty queue and every unmoving track as the work being quiet rather than
 * held.
 *
 * That is the one state that changes what every OTHER screen means, which is
 * the only thing that earns a global banner. BackendHealthBanner sits beside
 * this for the same reason and set the precedent: the platform is in a
 * condition that makes the rest of the interface misleading.
 *
 * THE READER ALREADY EXISTED AND SAID SO. `getWorkspacePauseState` has carried
 * the comment "Lightweight 'is my workspace paused?' probe used by AppShell"
 * since it was written, and AppShell never imported it. It is the seventh thing
 * this session found complete and plugged into nothing -- a reader built for a
 * consumer nobody wrote.
 *
 * IT DRAWS ONLY WHEN PAUSED, and says nothing at all otherwise: a banner that
 * reports the normal case is a banner people stop seeing. It names the two
 * cases apart, because they are not the same fact and a person can only act on
 * one of them -- a workspace pause is theirs to lift, a system pause is not.
 *
 * Its own read failing draws NOTHING rather than a scare: claiming a pause that
 * may not exist would stop people working for no reason, and the boundary page
 * is the honest home for "we could not find out".
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { PauseCircle } from "lucide-react";
import { getWorkspacePauseState } from "@/lib/governance.functions";
import { useWorkspace } from "@/hooks/use-workspace";

export function EverythingIsPausedBanner() {
  const { activeWorkspaceId } = useWorkspace();
  const fPause = useServerFn(getWorkspacePauseState);
  const q = useQuery({
    queryKey: ["workspace-pause", activeWorkspaceId],
    queryFn: () => fPause({ data: { workspaceId: activeWorkspaceId ?? null } }),
    // Cheap and consequential: a pause lifted elsewhere should stop shouting
    // here without a reload, and a pause applied elsewhere should appear.
    refetchInterval: 60_000,
  });

  if (!q.data?.paused) return null;
  const system = q.data.systemPaused;

  return (
    <div
      role="alert"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 61,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        background: "color-mix(in oklab, var(--mrd-hold) 14%, var(--mrd-sheet))",
        borderBottom: "1px solid color-mix(in oklab, var(--mrd-hold) 40%, transparent)",
        color: "var(--mrd-ink)",
        lineHeight: 1.45,
      }}
    >
      <PauseCircle size={16} style={{ color: "var(--mrd-hold)", flexShrink: 0 }} />
      <span className="text-mrd-small">
        {system
          ? "Everything is paused across the platform. Every agent is holding mid-step, and nothing you see here is moving."
          : "Everything in this workspace is paused. Every agent is holding mid-step, and nothing runs whatever the boundary says."}
        {q.data.reason ? ` On record: ${q.data.reason}` : null}
      </span>
      {/* A system pause is not the reader's to lift, so they are not sent to a
          switch that will refuse them. */}
      {!system ? (
        <Link
          /* The stop switch moved with the Autonomy fold, 2026-09-09: it is
             Team's boundary tab now, not a settings section. */
          to="/team"
          search={{ tab: "boundary" }}
          className="text-mrd-small underline"
          style={{ marginLeft: "auto", flexShrink: 0, color: "var(--mrd-ink)" }}
        >
          Let them run
        </Link>
      ) : null}
    </div>
  );
}
