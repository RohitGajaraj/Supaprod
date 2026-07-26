// The Desk's stakeholder row (PM Desk): re-homes the fully-built but ORPHANED
// Share-status tool (StatusUpdateDialog had zero references — a Loom §0.1.5
// "every feature has a home" violation). One quiet row: the update writes
// itself from live state, the PM just sends it.
import * as React from "react";
import { Button } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { StatusUpdateDialog } from "@/components/today/StatusUpdateDialog";
import { STATUS_COMPOSE_EVENT, useDeskComposeIntent } from "@/lib/desk-compose";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export function StatusRow() {
  const { activeWorkspace } = useWorkspace();
  const [open, setOpen] = React.useState(false);

  // IA SPINE (2026-07-11): the palette's "Share status" verb opens the
  // dialog in place instead of merely landing on Today.
  const openComposer = React.useCallback(() => setOpen(true), []);
  useDeskComposeIntent(STATUS_COMPOSE_EVENT, openComposer);

  return (
    <div
      className="flex items-center"
      style={{ gap: 12, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}
    >
      <span className="text-label-12" style={{ ...mono, color: "var(--text-subtle)", flexShrink: 0 }}>Stakeholders</span>
      <span
        className="min-w-0 flex-1 truncate text-label-13"
        style={{ color: "var(--text-muted)" }}
      >
        A ready-to-send update from live state, built to paste into email or Slack
      </span>
      <Button variant="secondary" className="text-label-12" onClick={() => setOpen(true)}>
        Share status
      </Button>
      <StatusUpdateDialog
        open={open}
        onOpenChange={setOpen}
        workspaceName={activeWorkspace?.name ?? null}
      />
    </div>
  );
}
