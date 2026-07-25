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
import { AuditLineageSheet } from "@/components/supaprod/AuditLineageSheet";
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
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
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
  HOME_NAV,
  LOOP_NAV,
  INTELLIGENCE_NAV,
  FOOTER_NAV,
  navItemActive,
  navKeyHint,
  engineRoomActive,
  type NavItemDef,
} from "@/lib/nav-model";
import { Avatar } from "@/components/supaprod/Avatar";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { useAvatarChoice } from "@/hooks/use-avatar-choice";

// IA — THE SUPAPROD LOOP (Tempo revamp, 2026-07-13): the rail tells the
// product's story in three narrative zones so a first-time user sees what
// Supaprod does and how to move through it with zero training:
//   HOME         Today (pinned, owns the ONE attention badge)
//   THE LOOP     01 Discover · 02 Plan · 03 Design · 04 Build · 05 Ship ·
//                06 Learn — the lifecycle as one connected journey (a vertical
//                spine links the numbered stage nodes; the active stage shows
//                its one-line "what happens here").
//   INTELLIGENCE Memory · Engine Room — the always-on compounding layers.
//   (footer)     Settings · Admin (admins only) · account chip
// The rail model + shortcuts derive from PRIMARY_NAV (nav-model.ts). Data
// hooks and workspace handlers are unchanged.

function ZoneHeader({ label, caption }: { label: string; caption?: string }) {
  return (
    <div aria-hidden="true" style={{ padding: "14px 12px 6px", userSelect: "none" }}>
      <div className="flex items-baseline" style={{ gap: 8 }}>
        <span
          className="text-label-12-mono"
          style={{
            letterSpacing: "0.14em",
            color: "var(--text-subtle)",
          }}
        >
          {label}
        </span>
        {caption ? (
          <span
            className="text-label-12-mono"
            style={{
              letterSpacing: "0.04em",
              color: "var(--text-faint)",
            }}
          >
            {caption}
          </span>
        ) : null}
      </div>
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
  spine,
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
  /** Loop rows render their mono index as a node chip sitting on the spine. */
  spine?: boolean;
}) {
  return (
    <Link
      to={item.to}
      search={item.search as never}
      aria-current={active ? "page" : undefined}
      title={item.tagline}
      data-coach-anchor={badgeAnchor ? `${badgeAnchor}-row` : undefined}
      className={`loom-press group relative flex w-full items-center gap-[11px] rounded-[8px] px-[10px] py-[8px] text-[13px] outline-none transition-colors duration-150 ease-(--ds-motion-timing-swift) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
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
          <Icon size={16} strokeWidth={1.5} />
        </span>
      ) : navKeyHint(item) ? (
        // Every primary destination wears its shortcut as a node chip: Today 0,
        // the loop 1-7 (in order), Brain 8, Pulse 9 — the number you SEE is the
        // key you PRESS (both derive from navKeyHint, so they can't drift). The
        // loop rows additionally sit on the connecting spine drawn by LoopRail;
        // Today/Brain/Pulse are standalone nodes off the line.
        <span
          className="relative z-10 shrink-0 inline-flex items-center justify-center text-label-12-mono"
          style={{
            width: 18,
            height: 18,
            borderRadius: 6,
            fontWeight: 600,
            background: active ? "var(--ember)" : "var(--card)",
            color: active ? "#fff" : "var(--text-faint)",
            border: `1px solid ${active ? "var(--ember)" : "var(--hairline-strong)"}`,
            boxShadow: active
              ? "0 0 10px color-mix(in srgb, var(--ember) 45%, transparent)"
              : "none",
          }}
        >
          {navKeyHint(item)}
        </span>
      ) : null}
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-[8px]">
          <span className="flex-1 truncate">{item.label}</span>
          {badge ? (
            <span
              data-coach-anchor={badgeAnchor}
              className="inline-flex items-center justify-center text-label-12-mono"
              style={{
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
              className="shrink-0 text-label-12-mono"
              style={{
                color: "var(--text-faint)",
              }}
            >
              {hint}
            </span>
          ) : null}
        </span>
        {/* The active row reveals its one-line "what happens here" — the
            reason-for-everything, shown in context without cluttering the
            resting rail. Every other row carries the same line as a tooltip. */}
        {active && item.tagline ? (
          <span
            className="block truncate text-label-12"
            style={{
              marginTop: 2,
              lineHeight: 1.3,
              color: "var(--text-subtle)",
              fontWeight: 400,
            }}
          >
            {item.tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** The loop stages, rendered as numbered nodes (01-06). No connecting line:
 *  the stages are destinations you can jump to in any order, not a gated
 *  sequence (founder ruling 2026-07-13 — a spine implied you had to finish
 *  the prior step first). */
function LoopRail({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
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
        className="text-label-12-mono"
        style={{
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Sample data
      </span>
      <span className="text-copy-13" style={{ color: "var(--text-body)" }}>
        This workspace holds example data so you can explore. Connect a real source to start your
        own.
      </span>
    </div>
  );
}

function BottomNav({ path }: { path: string }) {
  // Five primary destinations: Today, Discover, Plan, Build, Brain
  const navItems = [
    { to: "/today" as const, label: "Today", icon: "📌" },
    { to: "/discover" as const, label: "Discover", icon: "🔍" },
    { to: "/plan" as const, label: "Plan", icon: "📋" },
    { to: "/build" as const, label: "Build", icon: "⚡" },
    { to: "/brain" as const, label: "Brain", icon: "🧠" },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around"
      style={{
        height: "calc(56px + var(--safe-area-bottom))",
        paddingBottom: "var(--safe-area-bottom)",
        background: "color-mix(in oklab, var(--rail) 85%, transparent)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--hairline)",
        zIndex: 40,
      }}
    >
      {navItems.map((item) => {
        const isActive = path.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-center flex-1 min-h-[44px] gap-0.5 outline-none transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            <span style={{ }}>{item.icon}</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
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

  // ONE COUNT, ONE SOURCE (2026-07-18): the rail badge reads the same
  // federated approvals queue the pill and the Today hero read, scoped to
  // the active workspace and sharing their exact query key/cache — one
  // number, everywhere on the screen, never a needs-you re-derivation that
  // can drift from what /approvals itself shows. Hidden at zero.
  const fetchApprovalsQueue = useServerFn(getApprovalsQueue);
  const { data: approvalsQueue } = useQuery({
    queryKey: ["approvals", "queue", activeWorkspaceId],
    queryFn: () => fetchApprovalsQueue({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    refetchInterval: pollWhenVisible(30_000),
  });
  const callCount = approvalsQueue?.items.length ?? 0;

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
  const [avatarChoice] = useAvatarChoice(userName);

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
      "Brain · the decision record and knowledge layer: beliefs, supersession graph, learnings, precedents.",
    "/engine-room":
      "Pulse · spend, quality, safety, and the record (traces, receipts, the ledger), at a glance.",
    "/discover":
      "Discovery feed · raw signals clustered into ranked themes, the decision queue, competitor moves.",
    "/decide":
      "Decide · the judgment gate: every ranked bet awaiting your keep/kill call, drafted into a spec on approve.",
    "/plan": "Plan · cited specs and the outcome-declared roadmap.",
    "/ship":
      "Ship · what reached production, launch announcements, and the running changelog — preview to promote, with a receipt per release.",
    "/learn":
      "Learn · outcomes, verdicts, impact ledger, and support signals: the loop closing back into the Brain.",
    "/settings": "Settings · account, workspace, connections, AI keys, billing.",
    "/sync": "Sync and bindings · workspace bindings, sync conflicts, recently-synced items.",
    "/trust": "Trust and privacy statement.",
  };

  function buildMachineContent() {
    const ws = activeWorkspace?.name ?? "workspace";
    const prod = activeProduct?.name;
    const pageDesc =
      Object.entries(PAGE_DESCRIPTIONS).find(([route]) => path.startsWith(route))?.[1] ??
      `Supaprod authenticated page at ${path}`;

    return [
      `# Supaprod · ${ws}`,
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
      `| /decide | The judgment gate: keep or kill each ranked bet; approve drafts a spec |`,
      `| /plan | Cited specs and the outcome-declared roadmap |`,
      `| /design | Prototypes and the brand kit |`,
      `| /build | Live build surface: agent activity, PR/CI status, cost per session |`,
      `| /ship | What reached production, launch announcements, and the changelog |`,
      `| /learn | Outcomes, verdicts, impact ledger, and support signals |`,
      `| /brain | Brain: beliefs, supersession graph, learnings, precedents |`,
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
      title={`Supaprod · ${activeWorkspace?.name ?? "workspace"}`}
    >
      <div className="flex min-h-screen">
        <aside
          className="hidden md:flex h-screen sticky top-0 shrink-0 flex-col"
          style={{
            width: 248,
            background: "color-mix(in oklab, var(--rail) 80%, transparent)",
            backdropFilter: "blur(16px) saturate(1.4)",
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
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
                  {/* The Supaprod mark (DESIGN-TEMPO §8, founder ruling
                      2026-07-14): the six-petal spiral brand, an ember→blue
                      gradient. Rail chrome, not a per-screen brand moment. The
                      22px box gives clear space roughly equal to the mark. */}
                  <span aria-hidden="true" className="shrink-0">
                    <SupaprodMark size={30} />
                  </span>
                  <span className="flex-1 min-w-0">
                    {/* Wordmark: Geist Sans 600 with tight tracking, per the
                        DESIGN-TEMPO §8 logo spec (600, not bolder). The pixel
                        C to its left is the compact mark; the pair is the
                        canonical monogram + wordmark lockup. */}
                    <span
                      className="block truncate"
                      style={{
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                      }}
                    >
                      Supaprod
                    </span>
                    <span
                      className="block truncate text-label-12"
                      style={{ color: "var(--text-subtle)" }}
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
                              className="text-label-12-mono"
                              style={{
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
                          className="truncate text-label-12"
                          style={{ color: "var(--text-subtle)" }}
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
              onClick={() => window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"))}
              className="loom-press flex flex-1 items-center rounded-[8px] border border-[var(--hairline)] bg-[var(--card)] text-[var(--text-subtle)] text-label-12 outline-none transition-colors duration-150 hover:border-[var(--hairline-strong)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              style={{
                gap: "var(--geist-space-2x)",
                boxShadow: "var(--top-light)",
                padding: "7px 10px",
              }}
            >
              <span className="flex-1 text-left">Search</span>
              <span className="text-label-12-mono">⌘K</span>
            </button>
          </div>

          {/* Nav — HOME (Today) · THE LOOP (01-06, connected spine) ·
              INTELLIGENCE (Memory, Engine Room). The rail tells the product
              story top to bottom (Tempo revamp 2026-07-13). */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <nav
              className="flex flex-col"
              style={{ padding: "8px 10px 0", gap: 2 }}
              aria-label="Home"
            >
              {HOME_NAV.map((n) => (
                <NavRow
                  key={n.to}
                  item={n}
                  active={isItemActive(n)}
                  badge={n.to === "/today" ? callCount : undefined}
                  badgeAnchor={n.to === "/today" ? "today-badge" : undefined}
                />
              ))}
            </nav>
            <ZoneHeader label="THE LOOP" />
            <nav
              className="flex flex-col"
              style={{ padding: "0 10px", gap: 2 }}
              aria-label="The loop"
            >
              <LoopRail>
                {LOOP_NAV.map((n) => (
                  <NavRow key={n.to} item={n} active={isItemActive(n)} spine />
                ))}
              </LoopRail>
            </nav>
            <ZoneHeader label="INTELLIGENCE" />
            <nav
              className="flex flex-col"
              style={{ padding: "0 10px", gap: 2 }}
              aria-label="Intelligence"
            >
              {INTELLIGENCE_NAV.map((n) => (
                <NavRow
                  key={n.to}
                  item={n}
                  active={
                    // Pulse is the glance for the whole engine (its drill layers
                    // /govern, /sync, and the folded ledger all live inside it),
                    // so it lights via engineRoomActive.
                    n.to === "/engine-room" ? engineRoomActive(path) : isItemActive(n)
                  }
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
              padding: "4px 10px 6px",
              gap: 1,
            }}
          >
            {pauseState?.paused && (
              <Link
                to="/engine-room"
                search={{ room: "safety" }}
                className="block rounded-[8px] text-label-12 outline-none transition-colors duration-150 hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                style={{
                  border: "1px solid var(--hairline-strong)",
                  padding: "7px 10px",
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
                hint={navKeyHint(n)}
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
                  style={{ gap: 11, padding: "6px 10px" }}
                >
                  <Avatar
                    seed={userName}
                    variant={avatarChoice}
                    initials={userInitials}
                    size={26}
                    title="Your account"
                  />
                  <span
                    className="flex-1 truncate text-left text-label-12"
                    style={{ color: "var(--text-muted)" }}
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
          <BottomNav path={path} />
        </main>
      </div>
      {/* Global audit-lineage viewer: opened by any AuditTag or by Ask when a
          question names an id (supaprod:open-lineage). Renders nothing until
          opened. */}
      <AuditLineageSheet />
    </MachineViewContainer>
  );
}
