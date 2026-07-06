import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button, MonoLabel } from "@/components/obsidian";
import { LineageDrawer } from "@/components/cadence/LineageDrawer";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import {
  listSignals,
  listThemes,
  promoteSignalToOpportunity,
  promoteThemeToOpportunity,
  generatePrd,
  deleteSignal,
} from "@/lib/discovery.functions";
import { relTimeCaps, sourceCaps, withTimeout } from "./format";
import { SignalCard } from "./SignalCard";
import { SignalComposer } from "./SignalComposer";
import { SkeletonBar } from "./SkeletonBar";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Loom v4 §2: the card catches the ambient light — top-light hairline plus
 * the ambient shadow, tokens only. */
const CARD_SHADOW = "var(--top-light), var(--shadow-ambient)";

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: CARD_SHADOW,
        padding: "18px 20px",
      }}
    >
      {children}
    </div>
  );
}

function HeaderRow({ count }: { count: number }) {
  return (
    <div className="mb-3.5 flex items-start justify-between" style={{ gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-ui)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.3,
          }}
        >
          Live signal feed
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-subtle)" }}>
          Verbatim, with its source
        </p>
      </div>
      <MonoLabel
        tone="glacier"
        style={{
          fontSize: "10.5px",
          letterSpacing: "0.08em",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
          marginTop: 3,
        }}
      >
        {count} THIS WEEK
      </MonoLabel>
    </div>
  );
}

/** Loading skeleton that matches the loaded layout (pill row, quote line,
 * theme line), never a spinner and never a blank block (DESIGN-LOOM §9). */
function LoadingBody() {
  return (
    <div className="grid gap-3.5" aria-label="Loading signals" role="status">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid gap-2"
          style={{
            paddingBottom: "13px",
            borderBottom: i === 3 ? undefined : "1px solid var(--hairline-faint)",
          }}
        >
          <SkeletonBar width="88px" height={14} />
          <SkeletonBar width="92%" />
          <SkeletonBar width="40%" height={10} />
        </div>
      ))}
    </div>
  );
}

export function SignalFeed() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { activeProductId } = useWorkspace();
  const fSignals = useServerFn(listSignals);
  const fThemes = useServerFn(listThemes);
  const fPromoteSignal = useServerFn(promoteSignalToOpportunity);
  const fPromoteTheme = useServerFn(promoteThemeToOpportunity);
  const fDraftSpec = useServerFn(generatePrd);
  const fDelete = useServerFn(deleteSignal);

  // OBS-10: a Set, not a single scalar - every mutation adds its row's id on
  // onMutate and removes it on onSettled, so ANY in-flight mutation on a row
  // (not just whichever fired most recently) keeps that row's action menu
  // disabled. A shared scalar let a second row's mutation overwrite the
  // first's pending id, re-enabling a row whose own mutation hadn't settled
  // yet (adversarial review finding).
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  const [lineageId, setLineageId] = useState<string | null>(null);

  // withTimeout (audit D-12): a hung server fn rejects into the error state
  // with its retry instead of leaving a permanent skeleton.
  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => withTimeout(fSignals({ data: { productId: activeProductId } })),
  });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => withTimeout(fThemes({ data: { productId: activeProductId } })),
  });

  const themeById = useMemo(() => {
    const map = new Map<string, { title: string; frequency: number; summary: string | null }>();
    for (const t of themes.data?.themes ?? []) {
      map.set(t.id, { title: t.title, frequency: t.frequency, summary: t.summary ?? null });
    }
    return map;
  }, [themes.data]);

  // OBS-10: a signal that belongs to a theme should promote/draft-spec through
  // the THEME (aggregate evidence, deterministic scoring), matching the
  // retired /product Signals tab's briefFor — not just that one signal's own
  // quote. Grouped client-side from data already fetched, no new query.
  const signalsByTheme = useMemo(() => {
    const map = new Map<string, { content: string; source: string }[]>();
    for (const s of signals.data?.signals ?? []) {
      if (!s.theme_id) continue;
      const arr = map.get(s.theme_id) ?? [];
      arr.push({ content: s.content, source: s.source });
      map.set(s.theme_id, arr);
    }
    return map;
  }, [signals.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["signals"] });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  // OBS-10: the row write actions ported from the retired /product Signals
  // tab (promote / draft spec / lineage / delete). Every mutation shares the
  // busyIds set (see above) so any in-flight one disables its row's menu.
  const promote = useMutation({
    mutationFn: (id: string) => {
      const theme = signals.data?.signals.find((s) => s.id === id)?.theme_id;
      // A themed signal promotes through the theme (deterministic scoring,
      // theme_id on the resulting opportunity) - matches the legacy panel's
      // own choice, since a promote of just one member signal would silently
      // drop the theme's other corroborating evidence.
      return theme
        ? fPromoteTheme({ data: { theme_id: theme } })
        : fPromoteSignal({ data: { signal_id: id } });
    },
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast.success("Promoted · now an opportunity");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const draftSpec = useMutation({
    mutationFn: async (id: string) => {
      const signal = signals.data?.signals.find((s) => s.id === id);
      const theme = signal?.theme_id ? themeById.get(signal.theme_id) : undefined;
      const members = signal?.theme_id ? (signalsByTheme.get(signal.theme_id) ?? []) : [];
      // Theme-aware brief, matching the legacy panel's briefFor exactly:
      // aggregate every member quote (not just this one signal's), plus the
      // theme's own summary when it has one.
      const brief = theme
        ? `Theme: ${theme.title}\n${theme.summary ? `Summary: ${theme.summary}\n` : ""}Evidence:\n${members.map((m) => `- "${m.content}" (${m.source})`).join("\n")}`.slice(
            0,
            4000,
          )
        : `Signal (${signal?.source ?? "manual"}): ${signal?.content ?? ""}`.slice(0, 4000);
      const r = await fDraftSpec({ data: { brief } });
      return { id: r.prd.id };
    },
    onMutate: (id) => setBusy(id, true),
    onSuccess: (r) => {
      toast.success("Spec drafted");
      // The spec editor's home is /plan/spec/$id since the W2 re-home; the
      // /prds/$id stub only exists for external legacy links, and in-app
      // links never target a redirect (quality-register invariant).
      navigate({ to: "/plan/spec/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast.success("Signal deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

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
          backgroundColor: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          boxShadow: CARD_SHADOW,
          padding: "20px",
        }}
      >
        <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
          Could not load signals
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          {(signals.error as Error).message}
        </p>
        <Button variant="secondary" style={{ marginTop: "14px" }} onClick={() => signals.refetch()}>
          Retry
        </Button>
        <p style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "6px" }}>
          Reloads the feed · nothing is lost
        </p>
      </div>
    );
  }

  const rows = signals.data?.signals ?? [];
  const weekAgo = Date.now() - WEEK_MS;
  const thisWeekCount = rows.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length;
  const themeIds = new Set(themeById.keys());
  const unclusteredCount = rows.filter((s) => !s.theme_id || !themeIds.has(s.theme_id)).length;

  return (
    <PanelShell>
      <HeaderRow count={thisWeekCount} />
      <SignalComposer unclusteredCount={unclusteredCount} />
      {rows.length === 0 ? (
        <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-subtle)", margin: 0 }}>
          Nothing sensed yet. Capture what you heard, or connect a source and let the feed fill
          itself.
        </p>
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
                actionsPending={busyIds.has(s.id)}
                onPromote={() => promote.mutate(s.id)}
                onDraftSpec={() => draftSpec.mutate(s.id)}
                onLineage={() => setLineageId(s.id)}
                onDelete={async () => {
                  const ok = await confirm({
                    title: "Delete this signal?",
                    body: "This removes the signal permanently. Its theme membership and any lineage referencing it stay, but the quote itself is gone.",
                    destructive: true,
                    confirmLabel: "Delete signal",
                  });
                  if (ok) del.mutate(s.id);
                }}
              />
            );
          })}
        </div>
      )}
      <p style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "12px" }}>
        Every quote is verbatim and keeps its source. Nothing here is a summary.
      </p>
      <LineageDrawer
        open={!!lineageId}
        onOpenChange={(open) => !open && setLineageId(null)}
        kind="signal"
        id={lineageId}
        title={rows.find((s) => s.id === lineageId)?.content}
      />
    </PanelShell>
  );
}
