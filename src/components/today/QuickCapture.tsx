// Loom W2-TODAY (DESIGN-LOOM §8b) — quick capture: one collapsed affordance
// that lets a passing thought land in the machine without leaving Today.
// Writes through the exact Discover composer path (createSignal, source
// "manual", project threaded from the active product) so a captured note is
// a first-class signal, not a second inbox.
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/obsidian";
import { useToast } from "@/components/obsidian/toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { createSignal } from "@/lib/discovery.functions";

export function QuickCapture() {
  const qc = useQueryClient();
  const showToast = useToast();
  const { activeProductId } = useWorkspace();
  const fCreate = useServerFn(createSignal);

  const [openState, setOpen] = React.useState(false);
  const [content, setContent] = React.useState("");

  const capture = useMutation({
    mutationFn: () =>
      fCreate({ data: { content: content.trim(), source: "manual", project_id: activeProductId } }),
    onSuccess: () => {
      showToast("Captured. It lands in Discover as a signal.");
      setContent("");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["signals"] });
      void qc.invalidateQueries({ queryKey: ["themes"] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  if (!openState) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="loom-press w-full text-left outline-none transition-colors hover:[color:var(--text-muted)] hover:[border-color:var(--hairline-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          color: "var(--text-subtle)",
          background: "transparent",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-control)",
          padding: "8px 12px",
          marginBottom: 20,
        }}
      >
        Capture a signal or note…
      </button>
    );
  }

  return (
    <form
      className="flex items-center"
      style={{ gap: 8, marginBottom: 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (content.trim().length >= 2) capture.mutate();
      }}
    >
      <input
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setContent("");
            setOpen(false);
          }
        }}
        placeholder="What did you hear, and from where?"
        style={{
          flex: 1,
          background: "var(--surface-card-deep)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--radius-control)",
          padding: "8px 12px",
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      />
      <Button
        type="submit"
        variant="secondary"
        loading={capture.isPending}
        disabled={content.trim().length < 2}
      >
        Capture
      </Button>
      <button
        type="button"
        onClick={() => {
          setContent("");
          setOpen(false);
        }}
        className="loom-press outline-none hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
          background: "transparent",
          border: "none",
        }}
      >
        Cancel
      </button>
    </form>
  );
}
