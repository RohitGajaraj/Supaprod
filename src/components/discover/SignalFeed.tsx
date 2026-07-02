import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button, MonoLabel } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { listSignals, listThemes } from "@/lib/discovery.functions";
import { relTimeCaps, sourceCaps } from "./format";
import { SignalCard } from "./SignalCard";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#111113",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "var(--radius-card)",
        padding: "18px 20px",
      }}
    >
      {children}
    </div>
  );
}

function HeaderRow({ count }: { count: number }) {
  return (
    <div className="mb-3.5 flex items-baseline">
      <span className="flex-1">
        <MonoLabel style={{ fontSize: "9px", letterSpacing: "0.12em" }}>Live signal feed</MonoLabel>
      </span>
      <MonoLabel tone="glacier" style={{ fontSize: "9px", letterSpacing: "0.08em" }}>
        {count} THIS WEEK
      </MonoLabel>
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="grid gap-3.5">
      <MonoLabel tone="faint" style={{ fontSize: "9px" }}>
        Reading signals
      </MonoLabel>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            paddingBottom: "13px",
            borderBottom: i === 3 ? undefined : "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ height: "34px", backgroundColor: "#111113", borderRadius: "6px" }} />
        </div>
      ))}
    </div>
  );
}

export function SignalFeed() {
  const { activeProductId } = useWorkspace();
  const fSignals = useServerFn(listSignals);
  const fThemes = useServerFn(listThemes);

  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => fSignals({ data: { productId: activeProductId } }),
  });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => fThemes({ data: { productId: activeProductId } }),
  });

  const themeById = useMemo(() => {
    const map = new Map<string, { title: string; frequency: number }>();
    for (const t of themes.data?.themes ?? []) {
      map.set(t.id, { title: t.title, frequency: t.frequency });
    }
    return map;
  }, [themes.data]);

  if (signals.isLoading) {
    return (
      <PanelShell>
        <LoadingBody />
      </PanelShell>
    );
  }

  if (signals.error) {
    return (
      <div
        style={{
          backgroundColor: "#111113",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-card)",
          padding: "20px",
        }}
      >
        <MonoLabel tone="madder" style={{ fontSize: "9px" }}>
          Could not load signals
        </MonoLabel>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
          {(signals.error as Error).message}
        </p>
        <Button variant="secondary" style={{ marginTop: "14px" }} onClick={() => signals.refetch()}>
          Retry
        </Button>
        <p
          style={{ fontSize: "var(--text-helper)", color: "var(--text-subtle)", marginTop: "6px" }}
        >
          Reloads the feed · nothing is lost
        </p>
      </div>
    );
  }

  const rows = signals.data?.signals ?? [];
  const weekAgo = Date.now() - WEEK_MS;
  const thisWeekCount = rows.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length;

  return (
    <PanelShell>
      <HeaderRow count={thisWeekCount} />
      {rows.length === 0 ? (
        <MonoLabel tone="faint" style={{ fontSize: "11.5px" }}>
          Nothing sensed yet.
        </MonoLabel>
      ) : (
        <div className="grid gap-3.5">
          {rows.map((s, i) => {
            const theme = s.theme_id ? themeById.get(s.theme_id) : undefined;
            return (
              <SignalCard
                key={s.id}
                src={sourceCaps(s.source)}
                when={relTimeCaps(s.created_at)}
                quote={s.content}
                theme={theme ? `→ ${theme.title.toUpperCase()} · ${theme.frequency} SIGNALS` : null}
                isLast={i === rows.length - 1}
              />
            );
          })}
        </div>
      )}
      <p style={{ fontSize: "11.5px", color: "var(--text-faint)", marginTop: "12px" }}>
        Every quote is verbatim and keeps its source. Nothing here is a summary.
      </p>
    </PanelShell>
  );
}
