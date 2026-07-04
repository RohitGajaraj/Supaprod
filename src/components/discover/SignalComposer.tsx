import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button, MonoLabel } from "@/components/obsidian";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import {
  createSignal,
  bulkImportSignals,
  clusterSignals,
  getWorkspaceClusterSettings,
  toggleAutoCluster,
} from "@/lib/discovery.functions";

const rowStyle = { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } as const;

/**
 * OBS-10: the capture / bulk-import / cluster / auto-cluster controls ported
 * from the retired /product Signals tab. Collapsed by default (a form that's
 * always open would out-shout the feed it sits above) — a quiet mono-caps
 * control row that expands only the piece the operator asked for.
 */
export function SignalComposer({ unclusteredCount }: { unclusteredCount: number }) {
  const qc = useQueryClient();
  const { activeProductId } = useWorkspace();
  const fCreate = useServerFn(createSignal);
  const fBulk = useServerFn(bulkImportSignals);
  const fCluster = useServerFn(clusterSignals);
  const fSettings = useServerFn(getWorkspaceClusterSettings);
  const fToggleAuto = useServerFn(toggleAutoCluster);

  const [mode, setMode] = useState<"none" | "capture" | "bulk">("none");
  const [content, setContent] = useState("");
  const [bulkText, setBulkText] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["signals"] });
    qc.invalidateQueries({ queryKey: ["themes"] });
  };

  const capture = useMutation({
    mutationFn: () =>
      fCreate({ data: { content: content.trim(), source: "manual", project_id: activeProductId } }),
    onSuccess: () => {
      toast.success("Signal captured");
      setContent("");
      setMode("none");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkImport = useMutation({
    mutationFn: () =>
      fBulk({ data: { text: bulkText, source: "paste", project_id: activeProductId } }),
    onSuccess: (r) => {
      toast.success(`${r.inserted} signal${r.inserted === 1 ? "" : "s"} imported`);
      setBulkText("");
      setMode("none");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cluster = useMutation({
    mutationFn: () => fCluster({ data: { productId: activeProductId } }),
    onSuccess: (r) => {
      toast.success(r.message);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settings = useQuery({ queryKey: ["cluster-settings"], queryFn: () => fSettings() });
  const toggleAuto = useMutation({
    mutationFn: (enabled: boolean) => fToggleAuto({ data: { enabled } }),
    onSuccess: () => {
      toast.success("Auto-cluster updated");
      qc.invalidateQueries({ queryKey: ["cluster-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Loom v4 §3 ember discipline: the surface's ONE solid-fill CTA is Capture
  // (the PM's own write action). While the capture form is open the solid
  // fill moves to its submit button, so exactly one ember fill is ever
  // visible at a time.
  const emberFill = {
    background: "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
    color: "var(--cta-ink)",
  } as const;

  return (
    <div className="mb-3.5" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={rowStyle}>
        <Button
          variant={mode === "capture" ? "secondary" : "primary"}
          style={mode === "capture" ? undefined : emberFill}
          onClick={() => setMode(mode === "capture" ? "none" : "capture")}
        >
          + Capture
        </Button>
        <Button variant="secondary" onClick={() => setMode(mode === "bulk" ? "none" : "bulk")}>
          Paste many · one per line
        </Button>
        <Button
          variant="secondary"
          onClick={() => cluster.mutate()}
          loading={cluster.isPending}
          disabled={unclusteredCount === 0}
        >
          {unclusteredCount > 0
            ? `Cluster ${unclusteredCount} · groups them into themes`
            : "Nothing to cluster"}
        </Button>
        {settings.data?.is_owner ? (
          <span className="ml-auto flex items-center gap-2">
            <MonoLabel style={{ fontSize: "10.5px" }}>Auto-cluster</MonoLabel>
            {/* Glacier when on: autonomous machine behavior is the machine's
             * voice, and ember stays reserved for the one Capture CTA (v4 §3). */}
            <Switch
              checked={settings.data.enabled}
              disabled={toggleAuto.isPending}
              onCheckedChange={(v) => toggleAuto.mutate(v)}
              className="data-[state=checked]:bg-[var(--glacier)]"
            />
          </span>
        ) : null}
      </div>

      {mode === "capture" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim().length >= 2) capture.mutate();
          }}
          style={{ display: "flex", gap: "8px" }}
        >
          <input
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you hear, and from where?"
            aria-label="New signal"
            style={{
              flex: 1,
              background: "var(--surface-recessed)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "8px 10px",
              fontSize: "var(--text-base)",
              color: "var(--text-primary)",
            }}
          />
          <Button
            type="submit"
            variant="primary"
            style={emberFill}
            loading={capture.isPending}
            disabled={content.trim().length < 2}
          >
            Capture
          </Button>
        </form>
      ) : null}

      {mode === "bulk" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <textarea
            autoFocus
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            placeholder={"One signal per line…"}
            aria-label="Signals to import, one per line"
            style={{
              background: "var(--surface-recessed)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "10px",
              fontSize: "var(--text-base)",
              color: "var(--text-primary)",
              resize: "vertical",
            }}
          />
          <Button
            variant="secondary"
            className="self-start"
            loading={bulkImport.isPending}
            disabled={bulkText.trim().length < 2}
            onClick={() => bulkImport.mutate()}
          >
            Import lines
          </Button>
        </div>
      ) : null}
    </div>
  );
}
