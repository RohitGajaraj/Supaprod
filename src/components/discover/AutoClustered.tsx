import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button, MonoLabel } from "@/components/obsidian";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import {
  listSignals,
  listThemes,
  promoteThemeToOpportunity,
  generatePrd,
} from "@/lib/discovery.functions";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { sourceCaps, withTimeout } from "./format";
import { SkeletonBar } from "./SkeletonBar";
import { ThemeRow } from "./ThemeRow";
import { ThemeDetail, type ThemeMember } from "./ThemeDetail";
import { readSignalReferences } from "./SignalRecord";

type ThemeMeta = {
  id: string;
  title: string;
  frequency: number;
  summary: string | null;
  createdAt: string;
};

/** Column B header: the outcome-first title, the how-it-works subtext, and a
 * quiet clustered count. Matches the OpportunityQueue header grammar so B and
 * C read as siblings in the pipeline. */
function HeaderRow({ count }: { count: number }) {
  return (
    <div className="flex items-start justify-between" style={{ padding: "0 4px", gap: 12 }}>
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
          Clustered into bets
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-subtle)" }}>
          Cadence continuously reads your captured signals and clusters them into themes
          automatically, ranked by corroboration. Promote one and it lands in the queue as a ranked
          bet.
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
        {count} CLUSTERED
      </MonoLabel>
    </div>
  );
}

/** Functional-lens filter: a quiet wrap of mono-caps chips that slice the
 * ranked themes by the SOURCE of their member signals (support tools vs
 * analytics tools etc.), the honest real-data read on "which functional
 * area". The active chip lifts onto the raised surface; the rest stay quiet.
 * Rendered only when there are two or more distinct sources to choose between. */
function SourceFilterRow({
  sources,
  active,
  onSelect,
}: {
  sources: { source: string; count: number }[];
  active: string | null;
  onSelect: (source: string | null) => void;
}) {
  const chipStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    letterSpacing: "0.08em",
    fontVariantNumeric: "tabular-nums" as const,
    borderRadius: "var(--radius-pill)",
    padding: "3px 10px",
    cursor: "pointer",
  };
  // Color/background/border live in classes, not inline style, so the hover
  // state (which the chips previously lacked) can actually apply.
  const chipClass = (isActive: boolean) =>
    `loom-press border outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] ${
      isActive
        ? "[background-color:var(--surface-raised)] [border-color:var(--hairline)] [color:var(--text-primary)]"
        : "[background-color:transparent] [border-color:transparent] [color:var(--text-muted)] hover:[background-color:var(--hover)] hover:[color:var(--text-body)]"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-1.5" style={{ padding: "0 4px" }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={active === null}
        className={chipClass(active === null)}
        style={chipStyle}
      >
        ALL
      </button>
      {sources.map((s) => (
        <button
          key={s.source}
          type="button"
          onClick={() => onSelect(active === s.source ? null : s.source)}
          aria-pressed={active === s.source}
          className={chipClass(active === s.source)}
          style={chipStyle}
        >
          {sourceCaps(s.source)} {s.count}
        </button>
      ))}
    </div>
  );
}

/**
 * Column B of the Discover pipeline: the auto-clusters as first-class ranked
 * rows (`ThemeRow`, the corroboration leaderboard) that drill into
 * `ThemeDetail`. Self-contained, so it is a clean sibling of Column A
 * (SignalFeed) and Column C (OpportunityQueue): it reads signals + themes on
 * the SAME query keys those columns use, so react-query dedupes and there is
 * no extra network cost. Owns the theme-level promote / draft-spec mutations
 * and the theme drawer. Capped at four with a show-more so it never becomes a
 * wall.
 */
export function AutoClustered() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeProductId } = useWorkspace();
  const fSignals = useServerFn(listSignals);
  const fThemes = useServerFn(listThemes);
  const fPromoteTheme = useServerFn(promoteThemeToOpportunity);
  const fDraftSpec = useServerFn(generatePrd);

  // OBS-10: a Set, not a scalar, so any in-flight theme mutation keeps its own
  // row disabled and a second theme's mutation can never re-enable the first.
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  const [openThemeId, setOpenThemeId] = useState<string | null>(null);
  // Anti-scroll (founder ruling 2026-07-06): the column shows the top few and
  // expands on demand, so it never becomes a long wall.
  const [showAll, setShowAll] = useState(false);
  const VISIBLE = 4;
  // Functional-lens filter: null = All, else a raw source string. Slices the
  // ranked themes by where their evidence comes from.
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => withTimeout(fSignals({ data: { productId: activeProductId } })),
  });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => withTimeout(fThemes({ data: { productId: activeProductId } })),
  });

  const themeById = useMemo(() => {
    const map = new Map<
      string,
      { title: string; frequency: number; summary: string | null; createdAt: string }
    >();
    for (const t of themes.data?.themes ?? []) {
      map.set(t.id, {
        title: t.title,
        frequency: t.frequency,
        summary: t.summary ?? null,
        createdAt: t.created_at,
      });
    }
    return map;
  }, [themes.data]);

  // Grouped client-side from data already fetched, no new query. Carries the
  // full member record so ThemeRow derives the source count + newest time and
  // ThemeDetail can drill into any member signal.
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

  // The distinct member sources across all rendered themes, each with the
  // number of themes that contain at least one signal from that source. This
  // is the honest functional lens (support tools vs analytics tools etc.),
  // built from the same client-side grouping, no new query. Sorted by
  // theme-count so the biggest functional area leads.
  const sourceStats = useMemo(() => {
    const validThemeIds = new Set((themes.data?.themes ?? []).map((t) => t.id));
    const themeCountBySource = new Map<string, number>();
    for (const [themeId, members] of signalsByTheme) {
      if (!validThemeIds.has(themeId)) continue;
      const seen = new Set<string>();
      for (const m of members) {
        if (seen.has(m.source)) continue;
        seen.add(m.source);
        themeCountBySource.set(m.source, (themeCountBySource.get(m.source) ?? 0) + 1);
      }
    }
    return [...themeCountBySource.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
  }, [signalsByTheme, themes.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["signals"] });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  // Theme-level actions. Promote routes straight through the theme (aggregate
  // evidence, deterministic scoring); the spec brief aggregates every member
  // quote plus the theme summary, matching the legacy panel's briefFor.
  const promoteTheme = useMutation({
    mutationFn: (themeId: string) => fPromoteTheme({ data: { theme_id: themeId } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast.success("Promoted. Now a ranked bet in the queue.", {
        action: {
          label: "View the queue",
          onClick: () => navigate({ to: "/discover", search: { tab: "queue" } }),
        },
      });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const draftThemeSpec = useMutation({
    mutationFn: async (themeId: string) => {
      const theme = themeById.get(themeId);
      const members = signalsByTheme.get(themeId) ?? [];
      const brief = `Theme: ${theme?.title ?? ""}\n${
        theme?.summary ? `Summary: ${theme.summary}\n` : ""
      }Evidence:\n${members.map((m) => `- "${m.content}" (${m.source})`).join("\n")}`.slice(
        0,
        4000,
      );
      const r = await fDraftSpec({ data: { brief } });
      return { id: r.prd.id };
    },
    onMutate: (id) => {
      setBusy(id, true);
      toast("Drafting the spec from this theme.");
    },
    onSuccess: (r) => {
      toast.success("Spec drafted");
      navigate({ to: "/plan/spec/$id", params: { id: r.id }, search: { tab: "contract" } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  // PC-29 layer 6: the theme's one delegation verb ("Frame the bet"), moved
  // from the retired inline AskInContext trigger into the row overflow menu.
  // Same goal grammar and hand-off as AskInContext (obsidian/AskInContext.tsx)
  // so the mission the agent receives is byte-identical.
  const fAskMission = useServerFn(startOrchestratedMission);
  const askTheme = useMutation({
    mutationFn: ({ themeId, title }: { themeId: string; title: string }) =>
      fAskMission({
        data: {
          goal: `Frame the bet on this theme: "${title.trim() || "this theme"}" (ref ${themeId
            .slice(0, 8)
            .toUpperCase()})`,
          title: title.slice(0, 200),
        },
      }),
    onMutate: ({ themeId }) => setBusy(themeId, true),
    onSuccess: (res) => {
      toast.success("Frame the bet - mission started.");
      navigate({ to: "/build", search: { mission: res.mission_id } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, { themeId }) => setBusy(themeId, false),
  });

  // PERF: memoize sorted themes to avoid recalculation on every render.
  const sortedThemes: ThemeMeta[] = useMemo(
    () =>
      [...(themes.data?.themes ?? [])]
        .map((t) => ({
          id: t.id,
          title: t.title,
          frequency: t.frequency,
          summary: t.summary ?? null,
          createdAt: t.created_at,
        }))
        .sort((a, b) => b.frequency - a.frequency),
    [themes.data?.themes],
  );

  // When a source filter is active, keep only the themes that hold at least
  // one signal from that source; the rank (i+1) below is the position within
  // this filtered, still-sorted list.
  const themeList: ThemeMeta[] = useMemo(
    () =>
      sourceFilter
        ? sortedThemes.filter((t) =>
            (signalsByTheme.get(t.id) ?? []).some((m) => m.source === sourceFilter),
          )
        : sortedThemes,
    [sortedThemes, sourceFilter, signalsByTheme],
  );

  if (signals.isLoading || themes.isLoading) {
    return (
      <div className="grid gap-3" aria-label="Loading themes" role="status">
        <HeaderRow count={0} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="material-medium flex items-center"
            style={{
              padding: "16px 18px",
              gap: "16px",
              height: "62px",
            }}
          >
            <SkeletonBar width="40px" height={22} />
            <div className="grid flex-1 gap-2">
              <SkeletonBar width="55%" height={13} />
              <SkeletonBar width="80%" height={10} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Either query failing gets the honest error state (a themes-only guard let
  // a signals failure silently render every theme with zero members/sources).
  const loadError = (themes.error ?? signals.error) as Error | null;
  if (loadError) {
    return (
      <div className="material-medium" style={{ padding: "20px" }}>
        <MonoLabel style={{ fontSize: "10.5px", color: "var(--madder)" }}>
          Could not load themes
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          {loadError.message}
        </p>
        <Button
          variant="secondary"
          style={{ marginTop: "14px" }}
          onClick={() => {
            if (themes.error) void themes.refetch();
            if (signals.error) void signals.refetch();
          }}
        >
          Retry
        </Button>
        <p style={{ fontSize: "12px", color: "var(--text-subtle)", marginTop: "6px" }}>
          Reloads the clusters
        </p>
      </div>
    );
  }

  const shown = showAll ? themeList : themeList.slice(0, VISIBLE);

  return (
    <div className="grid gap-3">
      <HeaderRow count={themeList.length} />
      {sourceStats.length > 1 ? (
        <SourceFilterRow sources={sourceStats} active={sourceFilter} onSelect={setSourceFilter} />
      ) : null}
      {themeList.length === 0 ? (
        // SW-6: empty states DO something (mission 3.12); offer the door to
        // the capture composer instead of only describing it.
        <div style={{ padding: "0 4px" }}>
          <p
            style={{
              fontSize: "12.5px",
              lineHeight: 1.6,
              color: "var(--text-subtle)",
              margin: 0,
            }}
          >
            No themes yet. Capture a few signals and Cadence clusters them into ranked themes here.
          </p>
          <div style={{ marginTop: 8 }}>
            <Button variant="secondary" onClick={() => navigate({ to: "/discover" })}>
              Capture a signal
            </Button>
          </div>
        </div>
      ) : (
        shown.map((t, i) => {
          const members = signalsByTheme.get(t.id) ?? [];
          const sourceCount = new Set(members.map((m) => m.source)).size;
          return (
            <ThemeRow
              key={t.id}
              themeId={t.id}
              title={t.title}
              rank={i + 1}
              signalCount={t.frequency}
              sourceCount={sourceCount}
              actionsPending={busyIds.has(t.id)}
              onOpenDetail={(id) => setOpenThemeId(id)}
              onPromote={() => promoteTheme.mutate(t.id)}
              onDraftSpec={() => draftThemeSpec.mutate(t.id)}
              onAsk={() => askTheme.mutate({ themeId: t.id, title: t.title })}
            />
          );
        })
      )}
      {themeList.length > VISIBLE ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll((v) => !v)}
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            margin: "0 4px",
          }}
        >
          {showAll ? "Show fewer" : `Show ${themeList.length - VISIBLE} more`}
        </Button>
      ) : null}
      <ThemeDetail
        open={!!openThemeId}
        onOpenChange={(next) => {
          if (!next) setOpenThemeId(null);
        }}
        themeId={openThemeId}
        title={openThemeId ? (themeById.get(openThemeId)?.title ?? null) : null}
        summary={openThemeId ? (themeById.get(openThemeId)?.summary ?? null) : null}
        frequency={openThemeId ? (themeById.get(openThemeId)?.frequency ?? 0) : 0}
        createdAt={openThemeId ? (themeById.get(openThemeId)?.createdAt ?? null) : null}
        members={openThemeId ? (signalsByTheme.get(openThemeId) ?? []) : []}
        busy={openThemeId ? busyIds.has(openThemeId) : false}
        onPromote={() => {
          if (openThemeId) promoteTheme.mutate(openThemeId);
        }}
        onDraftSpec={() => {
          if (openThemeId) draftThemeSpec.mutate(openThemeId);
        }}
      />
    </div>
  );
}
