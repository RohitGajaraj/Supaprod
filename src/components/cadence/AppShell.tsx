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
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getWorkspacePauseState } from "@/lib/governance.functions";
import { getNeedsYou } from "@/lib/today.functions";
import { useLiveActivity } from "@/components/cadence/LivePulse";
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
  ENGINE_GROUP,
  FOOTER_NAV,
  navItemActive,
  engineRoomActive,
  type NavItemDef,
} from "@/lib/nav-model";

// LOOM W1 (2026-07-04) — the grouped rail. OBS-02's hover-menu Engine Room
// door made real surfaces invisible to a new user (the founder's "homeless
// features" finding); the rail now SHOWS every home, grouped (DESIGN-LOOM
// §8): THE LOOP (mono index 01-05) · THE ENGINE (06-08, direct rows) ·
// footer (Settings · role-gated Admin · the user chip menu). Data hooks and
// workspace handlers are unchanged; only the presentation and grouping
// changed. The theme toggle is gone (dark-only law); approvals stay Calls on
// Today (no badge on Engine Room).

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
}: {
  item: NavItemDef;
  active: boolean;
  badge?: number;
  /** OBS-14: a stable hook the Today coach mark anchors to on first landing. */
  badgeAnchor?: string;
  /** Footer rows carry a lucide icon in place of the loop/engine mono index. */
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
}) {
  return (
    <Link
      to={item.to}
      search={item.search as never}
      data-coach-anchor={badgeAnchor ? `${badgeAnchor}-row` : undefined}
      className={`loom-press flex w-full items-center gap-[11px] rounded-[8px] px-[10px] py-[8px] text-[13px] outline-none transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)] ${
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

/** Honest, persistent label for a sample/demo workspace. Blossom is the
 *  information voice (never ember, which is reserved for a human decision); it
 *  stays visible while the sample workspace is active so example data is never
 *  mistaken for real data. */
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
          color: "var(--blossom)",
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
  const noAdminsYet = adminInfo ? !adminInfo.anyAdminExists : false;

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

  // The shimmer working line - AI-PULSE (founder ruling 2026-07-08): the rail
  // now rides the SAME shared live-activity poll as the TopBar ticker (one
  // query key, one 4s cadence, one truth) and names the newest running
  // mission instead of a bare count.
  const { items: liveItems } = useLiveActivity();
  const runningCount = liveItems.filter((i) => i.status === "running").length;
  const queuedCount = liveItems.filter((i) => i.status === "queued").length;
  const liveMissionTitle = liveItems[0]?.missionTitle ?? null;

  // Profile row identity from the auth session.
  const [userName, setUserName] = useState("Account");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const meta = u?.user_metadata as
        | { display_name?: string; full_name?: string; name?: string }
        | undefined;
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
  void isMachineView;

  const PAGE_DESCRIPTIONS: Record<string, string> = {
    "/today":
      "Live dashboard · active missions, recent decisions, signal queue, pending approvals, loop health.",
    "/build":
      "Build surface · live agent activity, PR and CI status, cost per session, build controls.",
    "/brain":
      "Decision brain and memory layer · beliefs, supersession graph, learnings, precedents.",
    "/trust-ledger":
      "Trust Ledger · every decision and outcome with SHA-256 integrity fingerprint. The receipts layer.",
    "/govern":
      "Governance and cost controls · agent trust arcs, approval modes, spend caps, pause state.",
    "/engine-room": "Engine Room · spend, quality, safety, and the record, at a glance.",
    "/discover":
      "Discovery feed · raw signals clustered into ranked themes, analytics, competitor moves.",
    "/decide":
      "Decide · the ranked opportunity queue, red-teamed by the Critic before you commit a bet.",
    "/plan": "Define · cited specs and the outcome-declared roadmap.",
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
      `## Authenticated workspace surfaces`,
      ``,
      `| Route | What it contains |`,
      `|---|---|`,
      `| /today | Live dashboard: active missions, recent decisions, signal queue, pending approvals |`,
      `| /discover | Discovery feed: raw signals clustered into ranked themes, precedents |`,
      `| /decide | The ranked opportunity queue, red-teamed by the Critic before you commit |`,
      `| /plan | Define: cited specs and the outcome-declared roadmap |`,
      `| /build | Live build surface: agent activity, PR/CI status, cost per session |`,
      `| /brain | Decision brain and memory layer: beliefs, supersession graph, learnings |`,
      `| /engine-room | Spend, quality, safety, and the record, at a glance |`,
      `| /trust-ledger | Audit trail: every decision, every outcome, integrity fingerprint |`,
      `| /govern | Governance and cost controls: agent trust arcs, spend caps, approval modes |`,
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
          {/* Header — Butterfly mark + wordmark + workspace switcher. */}
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
                  className="loom-press w-full flex items-center text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
                  style={{ gap: 11 }}
                  aria-label="Workspace switcher"
                >
                  <img
                    src="/assets/butterfly-ember.svg"
                    width={22}
                    height={22}
                    alt=""
                    aria-hidden="true"
                    className="shrink-0"
                    style={{
                      opacity: 0.92,
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
                    <span className="flex min-w-0 items-center gap-[7px]">
                      <span className="truncate font-medium">{w.name}</span>
                      {w.is_sample ? (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9.5px",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--blossom)",
                          }}
                        >
                          Sample
                        </span>
                      ) : null}
                    </span>
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
                    <Link to="/settings" search={{ section: "workspace" } as never}>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search + Ask affordances — the two summonable utilities get
              visible doors (founder ruling 2026-07-04: Ask is a most-used
              feature and may not hide behind ⌘J alone; Loom §8 nothing
              hidden). Same quiet chrome, one row. */}
          <div className="flex" style={{ padding: "10px 10px 4px", gap: 6 }}>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cadence:open-cmdk"))}
              className="loom-press flex flex-1 items-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
              style={{
                gap: 8,
                border: "1px solid var(--hairline)",
                background: "var(--card)",
                boxShadow: "var(--top-light)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
            >
              <span className="flex-1 text-left">Search</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5 }}>⌘K</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cadence:open-ask"))}
              className="loom-press flex items-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
              style={{
                gap: 8,
                border: "1px solid var(--hairline)",
                background: "var(--card)",
                boxShadow: "var(--top-light)",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 12,
                color: "var(--text-subtle)",
              }}
              aria-label="Ask about this screen"
            >
              <span className="text-left">Ask</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5 }}>⌘J</span>
            </button>
          </div>

          {/* Nav — THE LOOP (01-05) then THE ENGINE (06-08), everything
              visible, mono-caps group labels (LOOM visibility law). */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <GroupLabel>THE LOOP</GroupLabel>
            <nav
              className="flex flex-col"
              style={{ padding: "0 10px", gap: 2 }}
              aria-label="The loop"
            >
              {PRIMARY_NAV.map((n) => (
                <NavRow
                  key={`${n.to}-${n.label}`}
                  item={n}
                  active={isItemActive(n)}
                  badge={n.label === "Today" ? callCount : undefined}
                  badgeAnchor={n.label === "Today" ? "today-badge" : undefined}
                />
              ))}
            </nav>
            <GroupLabel>THE ENGINE</GroupLabel>
            <nav
              className="flex flex-col"
              style={{ padding: "0 10px", gap: 2 }}
              aria-label="The engine"
            >
              {ENGINE_GROUP.map((n) => (
                <NavRow
                  key={`${n.to}-${n.label}`}
                  item={n}
                  active={
                    // Engine Room is the glance for the whole engine (its drill
                    // layers /govern and /sync live inside it), so it lights via
                    // engineRoomActive; Trust Ledger owns its own row and keeps
                    // the exact-path rule.
                    n.to === "/engine-room"
                      ? engineRoomActive(path) && !path.startsWith("/trust-ledger")
                      : isItemActive(n)
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
              padding: "8px 10px 10px",
              gap: 2,
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
                to="/build"
                className="flex items-center"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  gap: 7,
                  padding: "2px 4px",
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
                  {liveMissionTitle
                    ? `${liveMissionTitle.slice(0, 34)}${liveMissionTitle.length > 34 ? "…" : ""} · working`
                    : `${runningCount} agent${runningCount === 1 ? "" : "s"} working`}
                </span>
                {queuedCount > 0 && (
                  <span style={{ color: "var(--text-faint)" }}>· {queuedCount} queued</span>
                )}
              </Link>
            )}

            {FOOTER_NAV.filter((n) => n.to !== "/admin" || isAdmin || noAdminsYet).map((n) => (
              <NavRow
                key={n.to}
                item={n.to === "/admin" && !isAdmin ? { ...n, label: "Claim admin" } : n}
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
                  className="loom-press flex w-full items-center rounded-[8px] outline-none hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--glacier)]"
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
                <Link to="/settings" search={{ section: "you" } as never}>
                  <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                </Link>
                <Link to="/settings" search={{ section: "plan" } as never}>
                  <DropdownMenuItem className="cursor-pointer">
                    Pricing and billing
                  </DropdownMenuItem>
                </Link>
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
