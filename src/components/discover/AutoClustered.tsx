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
import { withTimeout } from "./format";
import { SkeletonBar } from "./SkeletonBar";
import { ThemeRow } from "./ThemeRow";
import { ThemeDetail, type ThemeMember } from "./ThemeDetail";

type ThemeMeta = { id: string; title: string; frequency: number; summary: string | null };

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
            fontFamily: "var(--font-ui)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.3,
          }}
        >
          Auto-clustered
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-subtle)" }}>
          The themes Cadence grouped from those signals, ranked by corroboration. Act on one and it
          moves to the opportunity queue.
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
        {count} CLUSTERED
      </MonoLabel>
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
      });
      map.set(s.theme_id, arr);
    }
    return map;
  }, [signals.data]);

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
      toast.success("Promoted. Now a ranked bet in Decide.", {
        action: { label: "View in Decide", onClick: () => navigate({ to: "/decide" }) },
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
    onMutate: (id) => setBusy(id, true),
    onSuccess: (r) => {
      toast.success("Spec drafted");
      navigate({ to: "/plan/spec/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const themeList: ThemeMeta[] = [...(themes.data?.themes ?? [])]
    .map((t) => ({ id: t.id, title: t.title, frequency: t.frequency, summary: t.summary ?? null }))
    .sort((a, b) => b.frequency - a.frequency);

  if (signals.isLoading || themes.isLoading) {
    return (
      <div className="grid gap-3" aria-label="Loading themes" role="status">
        <HeaderRow count={0} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--top-light), var(--shadow-ambient)",
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

  if (themes.error) {
    return (
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--top-light), var(--shadow-ambient)",
          padding: "20px",
        }}
      >
        <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
          Could not load themes
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          {(themes.error as Error).message}
        </p>
        <Button variant="secondary" style={{ marginTop: "14px" }} onClick={() => themes.refetch()}>
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
      {themeList.length === 0 ? (
        <p
          style={{
            fontSize: "12.5px",
            lineHeight: 1.6,
            color: "var(--text-subtle)",
            margin: 0,
            padding: "0 4px",
          }}
        >
          No themes yet. Capture a few signals and Cadence clusters them into ranked themes here.
        </p>
      ) : (
        shown.map((t, i) => {
          const members = signalsByTheme.get(t.id) ?? [];
          const sourceCount = new Set(members.map((m) => m.source)).size;
          const newest = members.reduce<string | null>(
            (acc, m) => (!acc || new Date(m.created_at) > new Date(acc) ? m.created_at : acc),
            null,
          );
          return (
            <ThemeRow
              key={t.id}
              themeId={t.id}
              title={t.title}
              rank={i + 1}
              signalCount={t.frequency}
              sourceCount={sourceCount}
              newestCreatedAt={newest}
              actionsPending={busyIds.has(t.id)}
              onOpenDetail={(id) => setOpenThemeId(id)}
              onPromote={() => promoteTheme.mutate(t.id)}
              onDraftSpec={() => draftThemeSpec.mutate(t.id)}
            />
          );
        })
      )}
      {themeList.length > VISIBLE ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="loom-press outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
            margin: "0 4px",
          }}
        >
          {showAll ? "Show fewer" : `Show ${themeList.length - VISIBLE} more`}
        </button>
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
