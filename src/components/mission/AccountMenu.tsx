// AccountMenu: the room's account layer, restored.
//
// WHY THIS EXISTS (this is not decoration, do not delete it):
// The whole account layer used to live in the retired Obsidian AppShell rail
// (src/components/supaprod/AppShell.tsx). When the room chrome replaced that
// shell on /m, /threads, /artifacts, /settings, /approvals and /brain,
// _authenticated.tsx stopped mounting AppShell on those paths, and nothing
// carried the account controls across. The result shipped to production:
// supabase.auth.signOut() was called from exactly ONE place in the codebase,
// a dropdown the user could no longer reach, so a signed-in user could not
// sign out at all, could not switch workspace, and had no visible door to
// their profile, plan, or credits. This component is the replacement.
//
// ONE component on purpose. Both room TopBars (RoomTopBar in RoomChrome.tsx
// and the loop room's TopBar in MissionShellView.tsx) render this exact
// component, so they cannot drift the way the four hand-rolled brand lockups
// did. If you add an account capability, add it here once.
//
// No new backend: every item below is wired to something that already works
// (supabase auth, useWorkspace.setActiveWorkspaceId, the ?section= deep-link
// contract on /settings). Ink tokens only, plain popover (no Radix), matching
// ProductSwitcher in RoomChrome.tsx.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { renameWorkspace, deleteWorkspace, leaveWorkspace } from "@/lib/workspaces.functions";
import { triggerWorkspaceSeed } from "@/lib/onboarding/onboarding.functions";

/** Derive up to two initials from a display name or email local part. */
function initialsFor(name: string): string {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

/** A menu row. Plain button so Tab order and Enter/Space work for free. */
function MenuItem({
  children,
  onClick,
  emphasis,
  trailing,
}: {
  children: React.ReactNode;
  onClick: () => void;
  emphasis?: "normal" | "quiet";
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "ink-focus flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs transition-colors hover:bg-[var(--ink-panel)]",
      )}
      style={{ color: emphasis === "quiet" ? "var(--ink-subtle)" : "var(--ink-body)" }}
    >
      <span className="truncate">{children}</span>
      {trailing ? <span className="ml-auto shrink-0">{trailing}</span> : null}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider"
      style={{ color: "var(--ink-faint)" }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div aria-hidden className="my-1 h-px" style={{ background: "var(--ink-hairline)" }} />;
}

/**
 * The account control for both room TopBars: who you are signed in as, the
 * workspace you are in (and every other workspace you belong to), the doors to
 * profile, plan, credits and workspace settings, and sign out.
 */
export function AccountMenu() {
  const navigate = useNavigate();
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    refreshWorkspaces,
  } = useWorkspace();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const renameWsFn = useServerFn(renameWorkspace);
  const deleteWsFn = useServerFn(deleteWorkspace);
  const leaveWsFn = useServerFn(leaveWorkspace);
  const seedFn = useServerFn(triggerWorkspaceSeed);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Identity from the auth session, same read the retired shell used. The
  // email matters more than the name here: several accounts can carry the same
  // display name, and the email is what tells you which one you are in.
  const [userName, setUserName] = useState("Account");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const u = data.user;
      const meta = u?.user_metadata as
        { display_name?: string; full_name?: string; name?: string } | undefined;
      setUserName(
        meta?.display_name ?? meta?.full_name ?? meta?.name ?? u?.email?.split("@")[0] ?? "Account",
      );
      setUserEmail(u?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside mousedown (the ProductSwitcher pattern, no new dependency).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Escape closes and hands focus back. Arrow keys walk the rows, so the menu
  // is usable without a mouse.
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    e.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown"
        ? (current + 1 + items.length) % items.length
        : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const go = (section: string) => {
    setOpen(false);
    void navigate({ to: "/settings", search: { section } as never });
  };

  const switchWorkspace = (id: string) => {
    setOpen(false);
    if (id === activeWorkspaceId) return;
    setActiveWorkspaceId(id);
    // The room's URL is product scoped (/$workspaceSlug/$productSlug) and the
    // product you are looking at belongs to the workspace you just left, so
    // land on /m, the resolver, and let it pick a product in the new workspace
    // and replace itself with that room's readable URL.
    void navigate({ to: "/m" });
  };

  // Workspace management, ported verbatim in behavior from the retired shell's
  // Manage group (AppShell createWorkspace / renameActiveWorkspace /
  // deleteActiveWorkspace / leaveActiveWorkspace). The server functions and the
  // confirm/prompt dialogs already exist and already work, they simply had no
  // caller left once the room replaced the rail. No new backend.
  const createWorkspace = async () => {
    setOpen(false);
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
    // The owner needs an explicit member row for the is_workspace_member() RLS checks.
    await supabase
      .from("workspace_members")
      .insert({ workspace_id: data.id, user_id: uid, role: "owner" });
    toast.success(`Created "${data.name}".`);
    // Fire and forget seed. A no-op unless ONBOARDING_SEED_ENABLED=1, and a
    // seed failure is not fatal to having the workspace.
    void seedFn({ data: { workspaceId: data.id } }).catch(() => {});
    refreshWorkspaces();
    setActiveWorkspaceId(data.id);
    void navigate({ to: "/m" });
  };

  const renameActiveWorkspace = async () => {
    setOpen(false);
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
      refreshWorkspaces();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not rename.");
    }
  };

  const leaveActiveWorkspace = async () => {
    setOpen(false);
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
      refreshWorkspaces();
      void navigate({ to: "/m" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not leave.");
    }
  };

  const deleteActiveWorkspace = async () => {
    setOpen(false);
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
      refreshWorkspaces();
      void navigate({ to: "/m" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    }
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out.");
      // Hard navigation on purpose: it drops every cached query and provider
      // state with the session, exactly as the retired shell did.
      window.location.href = "/login";
    } catch (e) {
      setSigningOut(false);
      toast.error(e instanceof Error ? e.message : "Could not sign out.");
    }
  };

  const showWorkspaces = workspaces.length > 1;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={userEmail ? `Account menu, signed in as ${userEmail}` : "Account menu"}
        title={userEmail ?? "Your account"}
        onClick={() => setOpen((v) => !v)}
        className="ink-focus flex h-7 items-center gap-1.5 rounded-lg px-1 transition-colors hover:bg-[var(--ink-raised)]"
      >
        <span
          aria-hidden
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full border font-mono text-[9px] tracking-tight"
          style={{
            background: "var(--ink-raised)",
            borderColor: "var(--ink-hairline)",
            color: "var(--ink-text)",
          }}
        >
          {initialsFor(userName)}
        </span>
        <span aria-hidden className="text-[9px]" style={{ color: "var(--ink-faint)" }}>
          {"▾"}
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Account"
          onKeyDown={onPanelKeyDown}
          className="absolute right-0 top-8 z-50 min-w-[236px] rounded-lg border p-1"
          style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)" }}
        >
          {/* Who you are. Six demo logins can share a display name; the email
              is the line that tells you which account this session is. */}
          <div className="px-2.5 py-1.5">
            <div className="truncate text-xs" style={{ color: "var(--ink-text)" }}>
              {userName}
            </div>
            <div
              className="truncate font-mono text-[10px]"
              style={{ color: "var(--ink-subtle)" }}
              data-testid="account-email"
            >
              {userEmail ?? "Signed in"}
            </div>
          </div>
          <Divider />

          {showWorkspaces ? (
            <>
              <SectionLabel>Switch workspace</SectionLabel>
              {workspaces.map((w) => (
                <MenuItem
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  trailing={
                    w.id === activeWorkspaceId ? (
                      <span aria-hidden className="text-[10px]">
                        {"✓"}
                      </span>
                    ) : null
                  }
                >
                  {w.name}
                </MenuItem>
              ))}
              <Divider />
            </>
          ) : null}

          <MenuItem onClick={() => go("profile")}>Profile</MenuItem>
          <MenuItem onClick={() => go("billing")}>Plan and billing</MenuItem>
          <MenuItem onClick={() => go("credits")}>Credits</MenuItem>
          <Divider />

          <SectionLabel>Workspace</SectionLabel>
          {/* The door to members and invites, which the room never exposed. */}
          <MenuItem onClick={() => go("workspace")}>Workspace settings</MenuItem>
          <MenuItem onClick={() => void createWorkspace()}>New workspace</MenuItem>
          {activeWorkspace ? (
            <>
              <MenuItem onClick={() => void renameActiveWorkspace()}>Rename workspace</MenuItem>
              <MenuItem onClick={() => void leaveActiveWorkspace()} emphasis="quiet">
                Leave workspace
              </MenuItem>
              <MenuItem onClick={() => void deleteActiveWorkspace()} emphasis="quiet">
                Delete workspace
              </MenuItem>
            </>
          ) : null}
          <Divider />
          <MenuItem onClick={() => void signOut()} emphasis="quiet">
            {signingOut ? "Signing out." : "Sign out"}
          </MenuItem>
        </div>
      ) : null}
    </div>
  );
}
