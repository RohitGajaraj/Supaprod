// The Desk's stakeholder row (PM Desk): re-homes the fully-built but ORPHANED
// Share-status tool (StatusUpdateDialog had zero references — a Loom §0.1.5
// "every feature has a home" violation). One quiet row: the update writes
// itself from live state, the PM just sends it.
import * as React from "react";
import { Button } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { StatusUpdateDialog } from "@/components/today/StatusUpdateDialog";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export function StatusRow() {
  const { activeWorkspace } = useWorkspace();
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="flex items-center"
      style={{ gap: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}
    >
      <span style={{ ...mono, color: "var(--text-subtle)", flexShrink: 0 }}>Stakeholders</span>
      <span className="min-w-0 flex-1 truncate" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        A ready-to-send update from live state
      </span>
      <Button variant="secondary" onClick={() => setOpen(true)} style={{ fontSize: 12 }}>
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
