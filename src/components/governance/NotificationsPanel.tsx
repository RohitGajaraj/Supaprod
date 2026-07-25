import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNotifications, type AppNotification } from "@/lib/notifications.functions";

// R3 · Attention, one calm feed of what needs the operator right now: approvals
// waiting, spend nearing caps, a stalled loop. Engine-Room: names the outcome
// ("what needs you"), not the mechanism; read-only, each item links to its home.

const SEVERITY_STYLE: Record<AppNotification["severity"], { color: string; label: string }> = {
  action: { color: "var(--amber, #d97706)", label: "Needs you" },
  warning: { color: "var(--rose, #dc2626)", label: "Warning" },
  info: { color: "var(--ink-muted)", label: "Heads up" },
};

export function NotificationsPanel() {
  const fGet = useServerFn(getNotifications);
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => fGet() });

  const items = q.data?.notifications ?? [];

  if (q.isLoading) {
    return (
      <div className="mono-label" style={{ color: "var(--ink-muted)", padding: 8 }}>
        Loading
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label" style={{ color: "var(--rose)" }}>
          Couldn't load notifications
        </div>
        <p style={{ color: "var(--ink-muted)", marginTop: 8 }}>
          {(q.error as Error)?.message ?? "The read failed."}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => void q.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label">All clear</div>
        <p style={{ color: "var(--ink-muted)", marginTop: 8, maxWidth: 460 }}>
          Nothing needs you right now. Approvals waiting on a decision, spend nearing a cap, and a
          stalled loop will show up here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((n) => {
        const s = SEVERITY_STYLE[n.severity];
        return (
          <a
            key={n.id}
            href={n.href}
            className="bento lift"
            style={{ padding: "var(--geist-space-4x)", display: "block", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span className="mono-label" style={{ color: s.color }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontWeight: 500, marginTop: 6 }}>{n.title}</div>
            <p style={{ color: "var(--ink-muted)", marginTop: 4 }}>{n.detail}</p>
          </a>
        );
      })}
    </div>
  );
}
