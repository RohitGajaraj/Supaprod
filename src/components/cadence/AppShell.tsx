import { Link, useRouterState } from "@tanstack/react-router";
import { Settings as SettingsIcon, Shield } from "lucide-react";
import { useAsk } from "@/lib/ask-context";
import { useMachineView } from "@/hooks/use-machine-view";
import { MachineViewContainer } from "@/components/machine/MachineViewContainer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { FlowWidget } from "./FlowWidget";
import { useFlowMode } from "@/hooks/use-flow-mode";
import { readFocusHistory, safeLocalStorage, todaysFocusTally } from "@/lib/flow/session";
import { listTasks } from "@/lib/tasks.functions";
import {
  dueRowsOf,
  openDueCountOf,
  todayStr,
  type TaskRow,
} from "@/components/today/desk/task-filters";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getWorkspacePauseState } from "@/lib/governance.functions";
import { getNeedsYou } from "@/lib/today.functions";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { renameWorkspace, deleteWorkspace, leaveWorkspace } from "@/lib/workspaces.functions";
import { getWorkspacePortfolio } from "@/lib/product-context.functions";
import { triggerWorkspaceSeed } from "@/lib/onboarding/onboarding.functions";
import { amIAdmin } from "@/lib/pricing.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PRIMARY_NAV,
  WORKFLOW_NAV,
  FOOTER_NAV,
  navItemActive,
  engineRoomActive,
  type NavItemDef,
} from "@/lib/nav-model";

// IA SPINE (2026-07-11) — ONE rail, seven primary destinations, keys 1-7:
// Today pinned above all groups (unnumbered, owns the ONE attention badge),
// the WORKFLOW group (mono indexes 01-04 live only here: Discover · Plan ·
// Design · Build), then Memory and Engine Room (unnumbered; Engine Room keeps
// its "g" alias, shown as a hint on the row). THE ENGINE header is gone —
// Decide and Ledger left the rail (both are redirects now). Footer: Settings ·
// Admin console (actual admins only) · the account chip. The rail Ask button
// is gone (Ask = Cmd+J + the palette ASK row); Search stays Cmd+K. Data hooks
// and workspace handlers are unchanged.

function GroupLabel({ children }: { children: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        letterSpacing: "0.14em",
        color: "var(--text-subtle)",
        padding: "14px 12px 5px",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
}

function NavRow({
  item,
  active,
  badge,
  badgeAnchor,
  icon: Icon,
  hint,
}: {
  item: NavItemDef;
  active: boolean;
  badge?: number;
  /** OBS-14: a stable hook the Today coach mark anchors to on first landing. */
  badgeAnchor?: string;
  /** Footer rows carry a lucide icon in place of the workflow mono index. */
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  /** Quiet mono key hint on the row's right edge (Engine Room's "g" alias). */
  hint?: string;
}) {
  return (
    <Link
      to={item.to}
      search={item.search as never}
      aria-current={active ? "page" : undefined}
      data-coach-anchor={badgeAnchor ? `${badgeAnchor}-row` : undefined}
      className={`loom-press flex w-full items-center gap-[11px] rounded-[8px] px-[10px] py-[8px] text-[13px] outline-none transition-colors duration-150 ease-(--ds-motion-timing-swift) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
        active
          ? "loom-thread-active bg-[var(--surface-active)] font-semibold text-[var(--text-primary)]"
          : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]"
      }`}
    >
      {Icon ? (
        <span
          className={`shrink-0 inline-flex ${active ? "text-[var(--text-primary)]" : "text-[var(--text-subtle)]"}`}
          style={{ width: 17, justifyContent: "center" }}
        >
          <Icon size={15} strokeWidth={1.75} />
        </span>
      ) : item.index ? (
        <span
          className={`shrink-0 ${active ? "text-[var(--ember-text)]" : "text-[var(--text-faint)]"}`}
          style={{ fontFamily: "var(--font-mono)", fontSize: 9.5 }}
        >
          {item.index}
        </span>
      ) : (
        <span className="shrink-0" style={{ width: 17 }} aria-hidden="true" />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? (
        <span
          data-coach-anchor={badgeAnchor}
          className="inline-flex items-center justify-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 700,
            background: "var(--ember-tint)",
            color: "var(--ember-text)",
            border: "1px solid var(--ember-line)",
            borderRadius: 99,
            minWidth: 17,
            height: 16,
            padding: "0 5px",
          }}
        >
          {badge}
        </span>
      ) : hint ? (
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            color: "var(--text-faint)",
          }}
        >
          {hint}
        </span>
      ) : null}
    </Link>
  );
}

// LOOM W4 perf: the shell's polls stop while the tab is hidden (a background
// tab must not keep three server-fn polls alive) and resume on the next
// visible tick. Pass to refetchInterval as a callback.
function pollWhenVisible(ms: number) {
  return () =>
    typeof document !== "undefined" && document.visibilityState === "hidden" ? false : ms;
}

/** Honest, persistent label for a sample/demo workspace. Neutral gray, not a
 *  chromatic accent (Tempo v5 DESIGN-TEMPO.md §2 glacier/machine-voice
 *  narrowing, 2026-07-11): this is provenance metadata, not a literal live/
 *  running status, so it stays gray; ember stays reserved for a human
 *  decision. It stays visible while the sample workspace is active so example
 *  data is never mistaken for real data. */
function SampleWorkspaceBanner() {
  return (
    <div
      role="note"
      aria-label="Sample workspace"
      className="flex flex-wrap items-center gap-x-[10px] gap-y-[2px]"
      style={{
        padding: "8px 20px",
        background: "var(--card)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10.5px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Sample data
      </span>
      <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
        This workspace holds example data so you can explore. Connect a real source to start your
        own.
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const searchTab = useRouterState({
    select: (s) => (s.location.search as { tab?: string })?.tab ?? null,
  });
  // OBS-12: one shimmer per screen - the rail's working line yields while
  // Ask (Cmd+J) is open, since Ask carries its own thinking shimmer.
  const { isOpen: askOpen } = useAsk();

  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    products,
    activeProductId,
    setActiveWorkspaceId,
    setActiveProductId,
    refreshWorkspaces,
    refreshProducts,
  } = useWorkspace();

  const pauseFn = useServerFn(getWorkspacePauseState);
  const { data: pauseState } = useQuery({
    queryKey: ["governance", "pause-state", activeWorkspaceId],
    queryFn: async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return null;
        return await pauseFn({ data: { workspaceId: activeWorkspaceId ?? null } });
      } catch {
        return null;
      }
    },
    // 60s, aligned with the needs-you poll (a pause flip is rare and also
    // re-read on demand); paused while the tab is hidden.
    refetchInterval: pollWhenVisible(60_000),
    enabled: !!activeWorkspaceId,
  });

  // PC-33: the switcher becomes a portfolio -- one-liner + calls-waiting per
  // workspace, keyed for O(1) lookup while rendering the dropdown rows below.
  const portfolioFn = useServerFn(getWorkspacePortfolio);
  const { data: workspacePortfolio } = useQuery({
    queryKey: ["workspace-portfolio"],
    queryFn: () => portfolioFn({}),
    staleTime: 60_000,
  });
  const portfolioByWorkspaceId = new Map(
    (workspacePortfolio ?? []).map((row) => [row.workspaceId, row]),
  );

  const confirm = useConfirm();
  const prompt = usePrompt();
  const renameWsFn = useServerFn(renameWorkspace);
  const deleteWsFn = useServerFn(deleteWorkspace);
  const leaveWsFn = useServerFn(leaveWorkspace);

  // Admin role check — drives the role-gated "Admin console" rail row (LOOM:
  // a visible footer row, not a dropdown item, so admins can actually find it).
  const amIAdminFn = useServerFn(amIAdmin);
  const { data: adminInfo } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => amIAdminFn(),
    staleTime: 60_000,
  });
  const isAdmin = !!adminInfo?.isAdmin;

  // The one Today badge — shares the "needs-you" cache key with the Today
  // page, so no extra fetch when both are mounted. Hidden at zero.
  const fetchNeedsYou = useServerFn(getNeedsYou);
  const { data: needsYou } = useQuery({
    queryKey: ["needs-you"],
    queryFn: () => fetchNeedsYou(),
    refetchInterval: pollWhenVisible(60_000),
  });
  // R2-ATTENTION #1: the badge reads the server-side needs-you truth
  // (counts.liveCalls) — the same number the Today hero shows. An array-length
  // sum understates once a display cap bites, and the rail may never disagree
  // with the hero.
  const callCount = needsYou?.counts.liveCalls ?? 0;

  // Profile row identity from the auth session.
  const [userName, setUserName] = useState("Account");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const meta = u?.user_metadata as
        { display_name?: string; full_name?: string; name?: string } | undefined;
      const name =
        meta?.display_name ?? meta?.full_name ?? meta?.name ?? u?.email?.split("@")[0] ?? "Account";
      setUserName(name);
    });
  }, []);
  const userInitials = userName
    .split(/[\s._-]+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeProduct = products.find((p) => p.id === activeProductId) ?? null;
  const { isMachineView } = useMachineView();

  // PM Desk, agent visibility: machine view exposes the desk's live state —
  // the running focus block (client-side session), tasks due today, and the
  // day's focus tally. The tasks fetch only happens while machine view is on.
  const flow = useFlowMode();
  const tasksFn = useServerFn(listTasks);
  // A DISTINCT key from the Desk's own ["tasks"] query (bug found live,
  // 2026-07-09): AppShell mounts above every route, so a shared key made this
  // a second, disabled observer racing the Desk's TasksCard — TasksCard's
  // fetch never fired and its card hung in the loading skeleton forever.
  const machineTasks = useQuery({
    queryKey: ["tasks", "machine-view"],
    queryFn: () => tasksFn(),
    enabled: isMachineView,
  });

  function buildDeskSection(): string[] {
    const lines: string[] = [`## Your desk`, ``];
    if (flow.isFlowMode) {
      const what = flow.intent ? `"${flow.intent}"` : "an open block";
      const left = flow.remainingMs === null ? "open-ended" : `${flow.remainingLabel} left`;
      lines.push(
        `- Focus block running on ${what} · ${left}${flow.phase ? ` · phase: ${flow.phase}` : ""}${
          flow.heldCount > 0 ? ` · ${flow.heldCount} notifications held` : ""
        }`,
      );
    } else {
      lines.push(`- No focus block running.`);
    }
    const tally = todaysFocusTally(readFocusHistory(safeLocalStorage()), Date.now());
    if (tally.blocks > 0)
      lines.push(`- Focus today: ${tally.blocks} blocks · ${tally.minutes} min`);
    const rows = dueRowsOf((machineTasks.data?.tasks ?? []) as TaskRow[], todayStr());
    const open = rows.filter((t) => t.status !== "done");
    lines.push(`- Tasks due today: ${openDueCountOf(rows)} open`);
    for (const t of open.slice(0, 10)) lines.push(`  - [ ] ${t.title}`);
    lines.push(
      ``,
      `Agents may read and create tasks via the registered tools ` +
        `\`workspace.list_tasks\` and \`tasks.create\`. The focus block is ` +
        `client-side session state, visible here only.`,
    );
    return lines;
  }

  const PAGE_DESCRIPTIONS: Record<string, string> = {
    "/today":
      "Live dashboard · active missions, recent decisions, signal queue, pending approvals, loop health.",
    "/build":
      "Build surface · live agent activity, PR and CI status, cost per session, build controls.",
    "/brain":
      "Memory · the decision record and memory layer: beliefs, supersession graph, learnings, precedents.",
    "/engine-room":
      "Engine Room · spend, quality, safety, and the record (traces, receipts, the ledger), at a glance.",
    "/discover":
      "Discovery feed · raw signals clustered into ranked themes, the decision queue, competitor moves.",
    "/plan": "Plan · cited specs and the outcome-declared roadmap.",
    "/settings": "Settings · account, workspace, connections, AI keys, billing.",
    "/sync": "Sync and bindings · workspace bindings, sync conflicts, recently-synced items.",
    "/trust": "Trust and privacy statement.",
  };

  function buildMachineContent() {
    const ws = activeWorkspace?.name ?? "workspace";
    const prod = activeProduct?.name;
    const pageDesc =
      Object.entries(PAGE_DESCRIPTIONS).find(([route]) => path.startsWith(route))?.[1] ??
      `Cadence authenticated page at ${path}`;

    return [
      `# Cadence · ${ws}`,
      prod ? `**Active product:** ${prod}` : "",
      `**Current route:** ${path}`,
      ``,
      `## This page`,
      ``,
      pageDesc,
      ``,
      ...buildDeskSection(),
      ``,
      `## Authenticated workspace surfaces`,
      ``,
      `| Route | What it contains |`,
      `|---|---|`,
      `| /today | Live dashboard: active missions, recent decisions, signal queue, pending approvals |`,
      `| /discover | Discovery feed: raw signals clustered into ranked themes, the decision queue |`,
      `| /plan | Cited specs and the outcome-declared roadmap |`,
      `| /design | Prototypes and the brand kit |`,
      `| /build | Live build surface: agent activity, PR/CI status, cost per session |`,
      `| /brain | Memory: beliefs, supersession graph, learnings, precedents |`,
      `| /engine-room | Spend, quality, safety, and the record (traces, receipts, ledger) |`,
      ``,
      `## Agent interfaces`,
      ``,
      `- Append \`?view=machine\` to any URL for machine mode`,
      `- A2A agent card: \`/.well-known/agent.json\``,
      `- Site context: \`/llms.txt\``,
      `- MCP server: POST /api/mcp · 9 read tools + ingest_signal (write:signal scope); bearer token from Settings > Interop`,
      `- Agent policy: /agents.txt · rate limits, content tiers, write-scope gates`,
    ].join("\n");
  }

  async function createWorkspace() {
    const name = await prompt({
      title: "New workspace",
      label: "Workspace name",
      placeholder: "e.g. Acme product team",
      confirmLabel: "Create",
    });
    if (!name?.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      toast.error("Not signed in");
      return;
    }
    const { data, error } = await supabase
      .from("workspaces")
      // account_id is auto-filled by the trg_set_workspace_account DB trigger.
      .insert({ name: name.trim(), owner_id: uid } as never)
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Could not create workspace");
      return;
    }
    // Owner needs an explicit member row for is_workspace_member() RLS checks.
    await supabase
      .from("workspace_members")
      .insert({ workspace_id: data.id, user_id: uid, role: "owner" });
    toast.success(`Created "${data.name}".`);
    // WM-S1: fire-and-forget seed. No-op unless ONBOARDING_SEED_ENABLED=1.
    triggerWorkspaceSeed({ data: { workspaceId: data.id } }).catch(() => {
      // Seed failure is non-fatal.
    });
    await refreshWorkspaces();
    setActiveWorkspaceId(data.id);
  }

  async function renameActiveWorkspace() {
    if (!activeWorkspace) return;
    const next = await prompt({
      title: "Rename workspace",
      label: "New name",
      defaultValue: activeWorkspace.name,
      confirmLabel: "Save",
    });
    if (!next || next === activeWorkspace.name) return;
    try {
      await renameWsFn({ data: { id: activeWorkspace.id, name: next } });
      toast.success("Workspace renamed.");
      await refreshWorkspaces();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't rename.");
    }
  }

  async function deleteActiveWorkspace() {
    if (!activeWorkspace) return;
    const ok = await confirm({
      title: `Delete "${activeWorkspace.name}"?`,
      body: "This permanently deletes the workspace and everything in it: products, docs, missions, runs, plus your meetings, notes, daily briefs, chat history, and prototypes scoped to it. Can't be undone.",
      destructive: true,
      confirmLabel: "Delete workspace",
      typedConfirm: activeWorkspace.name,
    });
    if (!ok) return;
    try {
      await deleteWsFn({ data: { id: activeWorkspace.id } });
      toast.success("Workspace deleted.");
      setActiveWorkspaceId(null);
      await refreshWorkspaces();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete.");
    }
  }

  async function leaveActiveWorkspace() {
    if (!activeWorkspace) return;
    const ok = await confirm({
      title: `Leave "${activeWorkspace.name}"?`,
      body: "You'll lose access until someone re-invites you.",
      destructive: true,
      confirmLabel: "Leave",
    });
    if (!ok) return;
    try {
      await leaveWsFn({ data: { id: activeWorkspace.id } });
      toast.success("Left workspace.");
      setActiveWorkspaceId(null);
      await refreshWorkspaces();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't leave.");
    }
  }

  async function createProduct() {
    if (!activeWorkspaceId) {
      toast.error("Select a workspace first");
      return;
    }
    const name = await prompt({
      title: "New product",
      label: "Product name",
      placeholder: "e.g. Checkout v2",
      confirmLabel: "Create",
    });
    if (!name?.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      toast.error("Not signed in");
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: name.trim(), workspace_id: activeWorkspaceId, user_id: uid })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Could not create product");
      return;
    }
    toast.success(`Added "${data.name}".`);
    await refreshProducts();
    setActiveProductId(data.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    window.location.href = "/login";
  }

  // Active-state is the pure nav-model rule: exact path match, tab-scoped when
  // the item declares a tab.
  const isItemActive = (n: NavItemDef) => navItemActive(n, path, searchTab);

  // LOOM: single-product workspaces hide the product switcher entirely
  // (progressive complexity, founder ruling 2026-07-04) — the concept
  // introduces itself only once a second product exists. "New product" stays
  // available under Manage.
  const showProductSection = products.length > 1;

  return (
    <MachineViewContainer
      machineContent={buildMachineContent()}
      title={`Cadence · ${activeWorkspace?.name ?? "workspace"}`}
    >
      <div className="flex min-h-screen">
        <aside
          className="hidden lg:flex h-screen sticky top-0 shrink-0 flex-col"
          style={{
            width: 248,
            background: "var(--rail)",
            borderRight: "1px solid var(--hairline)",
          }}
        >
          {/* Header — pixel C monogram + wordmark + workspace switcher. */}
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid var(--hairline-faint)",
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="loom-press w-full flex items-center rounded-[8px] text-left outline-none transition-colors duration-150 hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  style={{ gap: 11, padding: "6px 8px", margin: "-6px -8px" }}
                  aria-label="Workspace switcher"
                >
                  {/* Pixel C monogram (DESIGN-TEMPO §8): THE compact mark; the
                      retired Butterfly is not carried into v5. Rail chrome, not
                      a per-screen brand moment, so it does not consume the
                      one-Pixel-per-screen budget. Gray-1000 only; the ember
                      variant is reserved for active/brand states. The 22px box
                      around the ~15px glyph plus the header padding gives clear
                      space roughly equal to the monogram's own width. */}
                  <span
                    aria-hidden="true"
                    className="shrink-0 inline-flex items-center justify-center"
                    style={{
                      width: 22,
                      height: 22,
                      fontFamily: "var(--font-pixel)",
                      fontWeight: 400,
                      fontSize: 15,
                      lineHeight: 1,
                      color: "var(--ds-gray-1000)",
                    }}
                  >
                    C
                  </span>
                  <span className="flex-1 min-w-0">
                    {/* Wordmark: Geist Sans 600 with tight tracking, per the
                        DESIGN-TEMPO §8 logo spec (600, not bolder). The pixel
                        C to its left is the compact mark; the pair is the
                        canonical monogram + wordmark lockup. */}
                    <span
                      className="block truncate"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                      }}
                    >
                      Cadence
                    </span>
                    <span
                      className="block truncate"
                      style={{ fontSize: 10.5, color: "var(--text-subtle)" }}
                    >
                      {activeWorkspace?.name || "Select workspace"}
                      {activeProduct ? ` · ${activeProduct.name}` : ""}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="start">
                <DropdownMenuLabel className="mono-label">Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((w) => {
                  const portfolioRow = portfolioByWorkspaceId.get(w.id);
                  const oneLiner = portfolioRow?.oneLiner;
                  return (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => setActiveWorkspaceId(w.id)}
                      className="flex flex-col items-stretch gap-0.5 cursor-pointer"
                    >
                      <span className="flex items-center justify-between gap-[7px]">
                        <span className="flex min-w-0 items-center gap-[7px]">
                          <span className="truncate font-medium">{w.name}</span>
                          {w.is_sample ? (
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "9.5px",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                color: "var(--text-muted)",
                              }}
                            >
                              Sample
                            </span>
                          ) : null}
                        </span>
                        {w.id === activeWorkspaceId && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        )}
                      </span>
                      {oneLiner ? (
                        <span
                          className="truncate"
                          style={{ fontSize: 11, color: "var(--text-subtle)" }}
                        >
                          {oneLiner}
                          {portfolioRow.callsWaiting > 0
                            ? ` · ${portfolioRow.callsWaiting} call${portfolioRow.callsWaiting === 1 ? "" : "s"} waiting`
                            : ""}
                        </span>
                      ) : null}
                    </DropdownMenuItem>
                  );
                })}
                {workspaces.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-ink-faint">
                    No workspaces yet. Create one below to get started.
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={createWorkspace} className="cursor-pointer">
                  New workspace
                </DropdownMenuItem>
                {/* Products — progressive complexity: the switcher appears only
                    once a second product exists (LOOM, founder ruling). */}
                {showProductSection && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="mono-label">Product</DropdownMenuLabel>
                    {products.map((p) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => setActiveProductId(activeProductId === p.id ? null : p.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{p.name}</span>
                        {p.id === activeProductId && (
                          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                {activeWorkspace && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="mono-label">Manage</DropdownMenuLabel>
                    <DropdownMenuItem onClick={renameActiveWorkspace} className="cursor-pointer">
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={createProduct} className="cursor-pointer">
                      New product
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/settings" search={{ section: "workspace" } as never}>
                        Workspace settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={leaveActiveWorkspace} className="cursor-pointer">
                      Leave
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={deleteActiveWorkspace}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      Delete workspace
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search — the one summonable utility with a visible door. Ask
              lost its rail button (IA SPINE 2026-07-11): Ask = Cmd+J + the
              palette ASK row. */}
          <div className="flex" style={{ padding: "10px 10px 4px" }}>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cadence:open-cmdk"))}
              className="loom-press flex flex-1 items-center rounded-[8px] border border-[var(--hairline)] bg-[var(--card)] text-[var(--text-subtle)] outline-none transition-colors duration-150 hover:border-[var(--hairline-strong)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              style={{
                gap: 8,
                boxShadow: "var(--top-light)",
                padding: "7px 10px",
                fontSize: 12,
              }}
            >
              <span className="flex-1 text-left">Search</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5 }}>⌘K</span>
            </button>
          </div>

          {/* Nav — Today pinned above all groups, then WORKFLOW (mono 01-04),
              then Memory and Engine Room, unnumbered (IA SPINE 2026-07-11). */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <nav
              className="flex flex-col"
              style={{ padding: "8px 10px 0", gap: 2 }}
              aria-label="Today"
            >
              {PRIMARY_NAV.filter((n) => n.to === "/today").map((n) => (
                <NavRow
                  key={n.to}
                  item={n}
                  active={isItemActive(n)}
                  badge={callCount}
                  badgeAnchor="today-badge"
                />
              ))}
            </nav>
            <GroupLabel>WORKFLOW</GroupLabel>
            <nav
              className="flex flex-col"
              style={{ padding: "0 10px", gap: 2 }}
              aria-label="Workflow"
            >
              {WORKFLOW_NAV.map((n) => (
                <NavRow key={n.to} item={n} active={isItemActive(n)} />
              ))}
            </nav>
            <nav
              className="flex flex-col"
              style={{ padding: "12px 10px 0", gap: 2 }}
              aria-label="Memory and engine room"
            >
              {PRIMARY_NAV.filter((n) => n.to === "/brain" || n.to === "/engine-room").map((n) => (
                <NavRow
                  key={n.to}
                  item={n}
                  active={
                    // Engine Room is the glance for the whole engine (its
                    // drill layers /govern, /sync, and the folded ledger all
                    // live inside it), so it lights via engineRoomActive.
                    n.to === "/engine-room" ? engineRoomActive(path) : isItemActive(n)
                  }
                  hint={n.to === "/engine-room" ? "g" : undefined}
                />
              ))}
            </nav>
          </div>

          {/* Footer — pause notice (when live), the shimmer working line,
              Settings + role-gated Admin, the user chip menu. */}
          <div
            className="shrink-0 flex flex-col"
            style={{
              borderTop: "1px solid var(--hairline-faint)",
              padding: "8px 10px 10px",
              gap: 2,
            }}
          >
            {pauseState?.paused && (
              <Link
                to="/engine-room"
                search={{ room: "safety" }}
                className="block rounded-[8px] outline-none transition-colors duration-150 hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                style={{
                  border: "1px solid var(--hairline-strong)",
                  padding: "7px 10px",
                  fontSize: 11,
                  color: "var(--madder)",
                }}
              >
                {pauseState.systemPaused ? "System paused" : "Workspace paused"}
                {pauseState.reason ? ` · ${pauseState.reason}` : ""}
              </Link>
            )}
            {/* AI-PULSE (founder ruling 2026-07-08, v3): the live working line
                used to live here AND in the top bar - a duplicate. It now lives
                in ONE place, the top-bar LiveTicker (which survives a future
                sidebar collapse), so the sidebar no longer shows it. */}

            {/* Admin console renders ONLY for actual admins (IA SPINE): the
                claim-admin affordance moved to Settings > Workspace. */}
            {FOOTER_NAV.filter((n) => n.to !== "/admin" || isAdmin).map((n) => (
              <NavRow
                key={n.to}
                item={n}
                active={isItemActive(n)}
                icon={n.to === "/admin" ? Shield : SettingsIcon}
              />
            ))}

            {/* Focus (Flow) mode: a proper labeled row, matching the nav
                rows, instead of a vague floating icon (Loom v4.1 rail). */}
            <FlowWidget asRow />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="loom-press flex w-full items-center rounded-[8px] outline-none hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  style={{ gap: 11, padding: "8px 10px" }}
                >
                  <span
                    className="inline-flex shrink-0 items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      background: "var(--hover)",
                      border: "1px solid var(--ember-line)",
                      color: "var(--text-primary)",
                      fontSize: 9.5,
                      fontWeight: 700,
                    }}
                  >
                    {userInitials}
                  </span>
                  <span
                    className="flex-1 truncate text-left"
                    style={{ fontSize: 12, color: "var(--text-muted)" }}
                  >
                    {userName}
                  </span>
                  <span
                    className="shrink-0 rounded-full"
                    aria-hidden="true"
                    title="Signed in"
                    style={{
                      width: 6,
                      height: 6,
                      background: "var(--moss)",
                      boxShadow: "0 0 7px rgba(127,191,142,0.6)",
                    }}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuLabel className="mono-label">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/settings" search={{ section: "you" } as never}>
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/settings" search={{ section: "plan" } as never}>
                    Pricing and billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col min-h-screen relative">
          {/* LOOM §2: the canvas atmosphere — one fixed vignette + grain
              layer; pointer-events none, aria-hidden, never on a scroller. */}
          <div className="loom-atmosphere" aria-hidden="true" />
          {/* Flex column so full-height screens can pin to the viewport with
              internal scroll. Block screens are unaffected. */}
          {activeWorkspace?.is_sample ? <SampleWorkspaceBanner /> : null}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col relative" style={{ zIndex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </MachineViewContainer>
  );
}
