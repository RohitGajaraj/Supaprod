import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileCode } from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { exportSkillsFile } from "@/lib/skills-export.functions";

// RPT-15: the ledger reformatted as an AGENTS.md-style markdown bundle -
// decisions with receipts, outcomes, and standing house rules - mountable as
// project context into Claude Code, Codex, or any AI coding fleet. Sits
// beside DataExportCard (the raw JSON export); this one is meant to be READ
// by an agent, not archived by a human.
function downloadMarkdown(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SkillsFileExportCard() {
  const fExport = useServerFn(exportSkillsFile);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      const { markdown, counts } = await fExport();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadMarkdown(`cadence-agent-context-${stamp}.md`, markdown);
      toast.success(
        `Exported ${counts.decisions} decisions, ${counts.outcomes} outcomes, ${counts.houseRules} house rules`,
      );
    } catch (e) {
      toast.error((e as Error)?.message ?? "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="material-medium" style={{ padding: 24, maxWidth: 640, marginTop: 16 }}>
      <div className="mono-label">Export agent context bundle</div>
      <p className="text-copy-13" style={{ color: "var(--ink-muted)", marginTop: 8, maxWidth: 520 }}>
        Your decisions, outcomes, and standing rules as one markdown file - mountable into Claude
        Code, Codex, or any AI coding fleet as project context, so your other tools inherit what
        Cadence already knows. Regenerate any time; the ledger is always the source of truth.
      </p>
      <Button
        variant="ghost"
        size="sm"
        style={{ marginTop: 14 }}
        onClick={onExport}
        disabled={busy}
      >
        <FileCode size={14} />
        {busy ? "Preparing your bundle" : "Export agent context bundle"}
      </Button>
    </div>
  );
}
