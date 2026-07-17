// The Desk's capture tool (PM Desk): the QuickCapture write path — a passing
// thought lands in the machine as a first-class Discover signal — with the
// input ALWAYS visible (the founder's ruling: a tool must read as a tool, not
// hide behind a collapsed strip). Same server function, same invalidations,
// same toasts as the retired strip; only the affordance grew.
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/obsidian";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { createSignal } from "@/lib/discovery.functions";
import { SIGNAL_COMPOSE_EVENT, useDeskComposeIntent } from "@/lib/desk-compose";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export function CaptureCard() {
  const qc = useQueryClient();
  const { activeProductId } = useWorkspace();
  const fCreate = useServerFn(createSignal);

  const [content, setContent] = React.useState("");

  // IA SPINE (2026-07-11): the palette's "Capture a signal" verb opens this
  // composer in place — focus the always-visible input.
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focusComposer = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);
  useDeskComposeIntent(SIGNAL_COMPOSE_EVENT, focusComposer);

  const capture = useMutation({
    mutationFn: () =>
      fCreate({ data: { content: content.trim(), source: "manual", project_id: activeProductId } }),
    onSuccess: () => {
      toast.success("Captured. It lands in Discover as a signal.");
      setContent("");
      void qc.invalidateQueries({ queryKey: ["signals"] });
      void qc.invalidateQueries({ queryKey: ["themes"] });
    },
    onError: (e: Error) => toast.success(e.message),
  });

  return (
    <section
      aria-label="Capture a signal"
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "12px 14px",
        boxShadow: "var(--top-light)",
      }}
    >
      <h3 style={{ ...mono, color: "var(--text-subtle)", margin: "0 0 8px" }}>Capture</h3>
      <form
        className="flex items-center"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim().length >= 2) capture.mutate();
        }}
      >
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setContent("");
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
      </form>
    </section>
  );
}
