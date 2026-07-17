import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button, MonoLabel } from "@/components/obsidian";
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
import { SignalDetailSheet, readSignalReferences, type SignalRecord } from "./SignalRecord";
import type { ThemeMember } from "./ThemeDetail";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="material-medium" style={{ padding: "18px 20px" }}>
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
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.3,
          }}
        >
          Signals captured
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-subtle)" }}>
          Everything sensed, verbatim, from every source
        </p>
      </div>
      <MonoLabel
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

/**
 * Column A of the Discover pipeline: raw evidence, verbatim, from every
 * source. The capture / import / cluster controls, the ranked signal cards
 * (each click-to-open into its rich detail), and the surface's own
 * loading/error/quiet-empty states. The auto-clustered themes it used to
 * stack below now live in their own sibling column (`AutoClustered`); this
 * component keeps the themes query only to label a card with its theme and to
 * route a themed signal's promote / draft-spec through the theme.
 */
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
  // disabled.
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  // Click-to-open (platform principle): a card click opens this signal's rich
  // detail directly, no menu hop. The menu is for secondary actions only.
  const [openSignalId, setOpenSignalId] = useState<string | null>(null);
  // Anti-scroll (founder ruling 2026-07-06): the feed shows the top few and
  // expands on demand, so the surface never becomes a long wall of signals.
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_SIGNALS = 3;

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

  // A themed signal promotes/draft-specs through its THEME (aggregate
  // evidence, deterministic scoring), so the brief needs every member quote.
  // Grouped client-side from data already fetched, no new query.
  const signalsByTheme = useMemo(() => {
    const map = new Map<string, ThemeMember[]>();
    for (const s of signals.data?.signals ?? []) {
      if (!s.theme_id) continue;
      const arr = map.get(s.theme_id) ?? [];
      arr.push({
        id: s.id,
        content: s.content,
        source: s.source,
        created_at: s.created_at,
        title: s.title ?? null,
        url: s.url ?? null,
        sentiment: s.sentiment ?? null,
        sourceKind: s.source_kind ?? null,
        tags: s.tags ?? [],
        references: readSignalReferences(s),
      });
      map.set(s.theme_id, arr);
    }
    return map;
  }, [signals.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["signals"] });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  // The row write actions ported from the retired /product Signals tab
  // (promote / draft spec / delete). Every mutation shares the busyIds set so
  // any in-flight one disables its row's menu.
  const promote = useMutation({
    mutationFn: (id: string) => {
      const theme = signals.data?.signals.find((s) => s.id === id)?.theme_id;
      // A themed signal promotes through the theme (deterministic scoring,
      // theme_id on the resulting opportunity), since a promote of just one
      // member signal would silently drop the theme's other corroborating
      // evidence.
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
      // Theme-aware brief: aggregate every member quote (not just this one
      // signal's), plus the theme's own summary when it has one.
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
      navigate({ to: "/plan/spec/$id", params: { id: r.id }, search: { tab: "contract" } });
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
      <div className="material-medium" style={{ padding: "20px" }}>
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

  const openSignal = openSignalId ? rows.find((s) => s.id === openSignalId) : undefined;
  const openRecord: SignalRecord | null = openSignal
    ? {
        id: openSignal.id,
        content: openSignal.content,
        title: openSignal.title ?? null,
        source: openSignal.source,
        sourceKind: openSignal.source_kind ?? null,
        url: openSignal.url ?? null,
        sentiment: openSignal.sentiment ?? null,
        tags: openSignal.tags ?? [],
        created_at: openSignal.created_at,
        references: readSignalReferences(openSignal),
      }
    : null;

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
        <div className="grid gap-3.5 min-w-0">
          {(showAll ? rows : rows.slice(0, VISIBLE_SIGNALS)).map((s, i, shown) => {
            const theme = s.theme_id ? themeById.get(s.theme_id) : undefined;
            return (
              <SignalCard
                key={s.id}
                id={s.id}
                src={sourceCaps(s.source)}
                sourceId={s.source}
                url={s.url ?? null}
                when={relTimeCaps(s.created_at)}
                quote={s.content}
                theme={theme ? `→ ${theme.title.toUpperCase()} · ${theme.frequency} SIGNALS` : null}
                isLast={i === shown.length - 1}
                actionsPending={busyIds.has(s.id)}
                onOpen={() => setOpenSignalId(s.id)}
                onPromote={() => promote.mutate(s.id)}
                onDraftSpec={() => draftSpec.mutate(s.id)}
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
          {rows.length > VISIBLE_SIGNALS ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll((v) => !v)}
              style={{
                width: "100%",
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              {showAll ? "Show fewer" : `Show ${rows.length - VISIBLE_SIGNALS} more`}
            </Button>
          ) : null}
        </div>
      )}
      <p style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "12px" }}>
        Every quote is verbatim and keeps its source. Nothing here is a summary.
      </p>
      <SignalDetailSheet
        open={!!openSignalId}
        onOpenChange={(next) => {
          if (!next) setOpenSignalId(null);
        }}
        record={openRecord}
      />
    </PanelShell>
  );
}
