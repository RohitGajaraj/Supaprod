import { Link, useRouterState } from "@tanstack/react-router";
import { useAsk } from "@/lib/ask-context";
import { useMachineView } from "@/hooks/use-machine-view";
import { MachineViewContainer } from "@/components/machine/MachineViewContainer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTheme } from "@/hooks/use-theme";
import { FlowWidget } from "./FlowWidget";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getWorkspacePauseState } from "@/lib/governance.functions";
import { getNeedsYou } from "@/lib/today.functions";
import { getLiveRunCounts } from "@/lib/agents.functions";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { renameWorkspace, deleteWorkspace, leaveWorkspace } from "@/lib/workspaces.functions";
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
  ENGINE_ROOM_DOOR,
  ENGINE_ROOM_LINKS,
  navItemActive,
  engineRoomActive,
  type NavItemDef,
} from "@/lib/nav-model";

// OBS-02 — the Obsidian app shell: a 236px mono-index rail (NO icons — the
// iconography law is a mono numeral index 01-05 + the Butterfly mark only),
// a 52px top bar (TopBar.tsx), and this rail's footer trio (shimmer working
// line, the one Engine Room door, the user chip). Data hooks and workspace/
// dropdown handlers are unchanged from the pre-Obsidian shell (consumed
// read-only, per the OBS-02 spec's "no feature work rides along" boundary) —
// only the presentation is reskinned. The shell is now HOISTED ONCE into
// `_authenticated.tsx` (it no longer wraps each page individually).

function NavRow({ item, active, badge }: { item: NavItemDef; active: boolean; badge?: number }) {
  return (
    <Link
      to={item.to}
      search={item.search as never}
      className={`flex w-full items-center gap-[11px] rounded-[8px] px-[10px] py-[8px] text-[13px] outline-none transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)] ${
        active
          ? "bg-[#1A1A1E] font-semibold text-[var(--text-primary)]"
          : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--raised)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span
        className={`shrink-0 ${active ? "text-[var(--ember)]" : "text-[var(--text-faint)]"}`}
        style={{ fontFamily: "var(--font-mono)", fontSize: 9.5 }}
      >
        {item.index}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? (
        <span
          className="inline-flex items-center justify-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 700,
            background: "var(--ember)",
            color: "var(--cta-ink)",
            borderRadius: 99,
            minWidth: 17,
            height: 16,
            padding: "0 5px",
            boxShadow: "0 0 10px rgba(255,107,44,0.4)",
          }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
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
    refetchInterval: 30_000,
    enabled: !!activeWorkspaceId,
  });

  const { theme, setTheme } = useTheme();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const renameWsFn = useServerFn(renameWorkspace);
  const deleteWsFn = useServerFn(deleteWorkspace);
  const leaveWsFn = useServerFn(leaveWorkspace);

  // Admin role check — drives the "Admin console" item in the workspace
  // dropdown so admins have a visible path in the published app (no slash
  // command needed).
  const amIAdminFn = useServerFn(amIAdmin);
  const { data: adminInfo } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => amIAdminFn(),
    staleTime: 60_000,
  });
  const isAdmin = !!adminInfo?.isAdmin;
  const noAdminsYet = adminInfo ? !adminInfo.anyAdminExists : false;

  // The one Today badge — shares the "needs-you" cache key with the Today
  // page, so no extra fetch when both are mounted. Hidden at zero.
  const fetchNeedsYou = useServerFn(getNeedsYou);
  const { data: needsYou } = useQuery({
    queryKey: ["needs-you"],
    queryFn: () => fetchNeedsYou(),
    refetchInterval: 60_000,
  });
  const callCount =
    (needsYou?.approvals.length ?? 0) +
    (needsYou?.prdCalls.length ?? 0) +
    (needsYou?.oppCalls.length ?? 0);

  // The shimmer working line — a dedicated unbounded count (listAgentRuns'
  // 20-row window can drop a long-running run, and a "live" line must never
  // under-report).
  const fetchLiveCounts = useServerFn(getLiveRunCounts);
  const { data: liveCounts } = useQuery({
    queryKey: ["live-run-counts"],
    queryFn: () => fetchLiveCounts(),
    refetchInterval: 15_000,
  });
  const runningCount = liveCounts?.running ?? 0;
  const queuedCount = liveCounts?.queued ?? 0;

  // Profile row identity from the auth session.
  const [userName, setUserName] = useState("Account");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const name =
        (u?.user_metadata as { display_name?: string } | undefined)?.display_name ??
        u?.email?.split("@")[0] ??
        "Account";
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

  const PAGE_DESCRIPTIONS: Record<string, string> = {
    "/today":
      "Live dashboard — active missions, recent decisions, signal queue, pending approvals, loop health.",
    "/missions":
      "Autonomous mission management — running, completed, and staged missions with full agent trace.",
    "/build":
      "Build surface — live agent activity, PR and CI status, cost per session, build controls.",
    "/knowledge":
      "Decision brain and memory layer — beliefs, supersession graph, learnings, precedents.",
    "/trust-ledger":
      "Trust Ledger — every decision and outcome with SHA-256 integrity fingerprint. The receipts layer.",
    "/govern":
      "Governance and cost controls — agent trust arcs, approval modes, spend caps, pause state.",
    "/products":
      "Product portfolio and opportunity register — all products, ICE-ranked opportunities, lineage.",
    "/discover":
      "Discovery feed — opportunities ranked by ICE score, signals, analytics, competitor moves.",
    "/settings": "Settings — account, workspace, connections, AI keys, billing.",
    "/sync": "Connectors — available sources, connected repos, sync mappings, conflict resolution.",
    "/impact": "PM Impact Ledger — portable decision + outcome track record with Markdown export.",
    "/stakeholder":
      "Stakeholder Pack — audience-tuned alignment artifacts from decisions and their receipts.",
    "/trust": "Trust and privacy statement.",
  };

  function buildMachineContent() {
    const ws = activeWorkspace?.name ?? "workspace";
    const prod = activeProduct?.name;
    const pageDesc =
      Object.entries(PAGE_DESCRIPTIONS).find(([route]) => path.startsWith(route))?.[1] ??
      `Cadence authenticated page at ${path}`;

    return [
      `# Cadence — ${ws}`,
      prod ? `**Active product:** ${prod}` : "",
      `**Current route:** ${path}`,
      ``,
      `## This page`,
      ``,
      pageDesc,
      ``,
      `## Authenticated workspace surfaces`,
      ``,
      `| Route | What it contains |`,
      `|---|---|`,
      `| /today | Live dashboard: active missions, recent decisions, signal queue, pending approvals |`,
      `| /missions | Autonomous mission management: running, completed, staged |`,
      `| /build | Live build surface: agent activity, PR/CI status, cost per session |`,
      `| /knowledge | Decision brain and memory layer: beliefs, supersession graph, learnings |`,
      `| /trust-ledger | Audit trail: every decision, every outcome, integrity fingerprint |`,
      `| /govern | Governance and cost controls: agent trust arcs, spend caps, approval modes |`,
      `| /products | Product portfolio and opportunity register |`,
      `| /discover | Discovery feed: opportunities ranked by ICE, signals, precedents |`,
      ``,
      `## Agent interfaces`,
      ``,
      `- Append \`?view=machine\` to any URL for machine mode, or use the [HUMAN] [MACHINE] toggle`,
      `- A2A agent card: \`/.well-known/agent.json\``,
      `- Site context: \`/llms.txt\``,
      `- MCP server: POST /api/mcp — 9 read tools + ingest_signal (write:signal scope); bearer token from Settings > Interop`,
      `- Agent policy: /agents.txt — rate limits, content tiers, write-scope gates`,
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
  // the item declares a tab. PRIMARY_NAV destinations are all bare paths
  // except the interim Plan entry.
  const isItemActive = (n: NavItemDef) => navItemActive(n, path, searchTab);

  return (
    <MachineViewContainer
      machineContent={buildMachineContent()}
      title={`Cadence · ${activeWorkspace?.name ?? "workspace"}`}
    >
      <div className="flex min-h-screen">
        <aside
          className="hidden lg:flex h-screen sticky top-0 shrink-0 flex-col"
          style={{
            width: 236,
            background: "var(--rail)",
            borderRight: "1px solid var(--hairline)",
          }}
        >
          {/* Header — Butterfly mark + wordmark + workspace name. The
            workspace-switcher DropdownMenu is unchanged behaviorally; every
            menu item drops its lucide glyph for a plain text row (the
            iconography law: no icon set outside the Butterfly). */}
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
                  className="w-full flex items-center text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
                  style={{ gap: 11 }}
                  aria-label="Workspace switcher"
                >
                  <img
                    src="/assets/butterfly-ember.svg"
                    width={24}
                    height={24}
                    alt=""
                    aria-hidden="true"
                    className="shrink-0"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(255,107,44,0.4))",
                      animation: "cadFlutter 3.4s ease-in-out infinite",
                      transformOrigin: "12px 12px",
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span
                      className="block truncate"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
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
              <DropdownMenuContent className="w-52" align="start">
                <DropdownMenuLabel className="mono-label">Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((w) => (
                  <DropdownMenuItem
                    key={w.id}
                    onClick={() => setActiveWorkspaceId(w.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate font-medium">{w.name}</span>
                    {w.id === activeWorkspaceId && (
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
                {workspaces.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-ink-faint italic">No workspaces yet</div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={createWorkspace} className="cursor-pointer">
                  New workspace
                </DropdownMenuItem>
                {/* Products — context switcher inside the workspace switcher (IA-DEPTH-V11) */}
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
                {products.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-ink-faint italic">No products yet</div>
                )}
                <DropdownMenuItem onClick={createProduct} className="cursor-pointer">
                  New product
                </DropdownMenuItem>
                {activeWorkspace && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="mono-label">Manage</DropdownMenuLabel>
                    <DropdownMenuItem onClick={renameActiveWorkspace} className="cursor-pointer">
                      Rename
                    </DropdownMenuItem>
                    <Link to="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        Workspace settings
                      </DropdownMenuItem>
                    </Link>
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
                {(isAdmin || noAdminsYet) && (
                  <>
                    <DropdownMenuSeparator />
                    <Link to="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        {isAdmin ? "Admin console" : "Claim admin"}
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <Link to="/settings">
                  <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="cursor-pointer"
                >
                  {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search affordance — opens the command palette. */}
          <div style={{ padding: "10px 10px 4px" }}>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cadence:open-cmdk"))}
              className="flex w-full items-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
              style={{
                gap: 8,
                border: "1px solid var(--hairline)",
                background: "var(--card)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
            >
              <span className="flex-1 text-left">Search</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5 }}>⌘K</span>
            </button>
          </div>

          {/* Nav — five outcome-named destinations, mono index 01-05, no icons. */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <nav className="flex flex-col" style={{ padding: "8px 10px", gap: 2 }}>
              {PRIMARY_NAV.map((n) => (
                <NavRow
                  key={`${n.to}-${n.label}`}
                  item={n}
                  active={isItemActive(n)}
                  badge={n.label === "Today" ? callCount : undefined}
                />
              ))}
            </nav>
          </div>

          {/* Footer — workspace-paused notice (when live), the shimmer working
            line, the Engine Room door, the user chip. */}
          <div
            className="shrink-0 flex flex-col"
            style={{
              borderTop: "1px solid var(--hairline-faint)",
              padding: "12px 14px",
              gap: 10,
            }}
          >
            {pauseState?.paused && (
              <Link
                to="/govern"
                search={{ tab: "controls" }}
                className="block rounded-[8px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
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
            {runningCount > 0 && !askOpen && (
              <Link
                to="/missions"
                search={{ tab: "missions" } as never}
                className="flex items-center"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  gap: 7,
                }}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 99,
                    background: "var(--glacier)",
                    animation: "cadPulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    backgroundImage: "var(--shimmer-gradient)",
                    backgroundSize: "280% 100%",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    animation: "cadShimmer 5s linear infinite",
                  }}
                >
                  {runningCount} agent{runningCount === 1 ? "" : "s"} working
                </span>
                {queuedCount > 0 && (
                  <span style={{ color: "var(--text-faint)" }}>· {queuedCount} queued</span>
                )}
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={callCount > 0 ? `Engine Room · ${callCount} pending` : "Engine Room"}
                  className={`flex w-full items-center outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)] ${
                    engineRoomActive(path) ? "bg-[#1A1A1E]" : "hover:bg-[var(--raised)]"
                  }`}
                  style={{
                    gap: 10,
                    border: engineRoomActive(path)
                      ? "1px solid var(--glacier)"
                      : "1px solid var(--hairline)",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 12,
                    color: engineRoomActive(path) ? "var(--glacier)" : "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      color: "var(--text-faint)",
                    }}
                  >
                    G
                  </span>
                  <span className="flex-1 text-left">{ENGINE_ROOM_DOOR.label}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 8.5,
                      letterSpacing: "0.08em",
                      color: "var(--text-faint)",
                    }}
                  >
                    {callCount > 0 ? callCount : "ALL CLEAR"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuLabel className="mono-label">Engine Room</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ENGINE_ROOM_LINKS.map((t) => {
                  const showBadge = t.label === "Approvals" && callCount > 0;
                  return (
                    <Link key={t.label} to={t.to} search={t.search as never}>
                      <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
                        <span>{t.label}</span>
                        {showBadge && (
                          <span
                            className="tabular-nums"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--ember)",
                            }}
                          >
                            {callCount}
                          </span>
                        )}
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center" style={{ gap: 9 }}>
              <span
                className="inline-flex shrink-0 items-center justify-center rounded-full"
                style={{
                  width: 24,
                  height: 24,
                  background: "var(--hover)",
                  border: "1px solid rgba(255,107,44,0.45)",
                  color: "var(--text-primary)",
                  fontSize: 9.5,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </span>
              <span
                className="flex-1 truncate"
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                {userName}
              </span>
              {/* Flow mode's only entry point in the app — kept reachable (not
                reskinned; OBS-03 owns primitives) rather than orphaned. Quiet
                by design: a single small icon, no label, degrades via the
                OBS-01 semantic bridge instead of dark-on-dark. */}
              <FlowWidget />
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
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Flex column so full-height screens (Chat) can pin to the viewport
            with internal scroll. Block screens are unaffected — they stretch
            and scroll the page. */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">{children}</div>
        </main>
      </div>
    </MachineViewContainer>
  );
}
