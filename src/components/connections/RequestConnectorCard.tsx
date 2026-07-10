// CONNECTIONS-V11: "Request a connector". No email (cost + friction): the user
// types the tool they want and submits; the request persists to
// connector_requests and we show an in-product acknowledgment. Lives at the
// bottom of Settings > Connections > Sources (Add a connection).
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { requestConnector } from "@/lib/connections.functions";
import { useWorkspace } from "@/hooks/use-workspace";

export function RequestConnectorCard({ compact = false }: { compact?: boolean }) {
  const { activeWorkspaceId } = useWorkspace();
  const fRequest = useServerFn(requestConnector);
  const [value, setValue] = useState("");

  const submit = useMutation({
    mutationFn: (connector: string) =>
      fRequest({ data: { connector, workspaceId: activeWorkspaceId ?? undefined } }),
    onSuccess: () => {
      setValue("");
      toast.success("Thanks for reaching out. Your request will be looked into.");
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't send that. Try again."),
  });

  const trimmed = value.trim();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmed && !submit.isPending) submit.mutate(trimmed);
  };

  // Compact rail variant: a slim vertical box that fits the ~210px left rail.
  if (compact) {
    return (
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-primary)" }}>
            Missing a connector?
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-subtle)", marginTop: 2 }}>
            Tell us what to build next.
          </div>
        </div>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Amplitude"
          maxLength={120}
          aria-label="Connector you want"
          style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 12.5 }}
        />
        <button
          type="submit"
          className="btn btn-secondary btn-sm loom-press"
          disabled={!trimmed || submit.isPending}
          style={{ width: "100%" }}
        >
          {submit.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
          Request
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bento"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        marginTop: 12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 8,
          border: "1px dashed var(--hairline-strong)",
          color: "var(--ink-subtle)",
        }}
      >
        <Plus size={16} strokeWidth={1.75} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13.5, color: "var(--ink)" }}>
          Request a connector
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 8 }}>
          Don't see your tool? Tell us what to build next.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 420 }}>
          <input
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Jira, Amplitude, Mixpanel"
            maxLength={120}
            aria-label="Connector you want"
            style={{ flex: 1, minWidth: 0, padding: "6px 10px", borderRadius: 8, fontSize: 13 }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!trimmed || submit.isPending}
            style={{ flexShrink: 0 }}
          >
            {submit.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Submit
          </button>
        </div>
      </div>
    </form>
  );
}
