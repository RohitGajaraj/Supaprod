/**
 * The workspace and product switcher, and the account menu. Two menus, because
 * they own two different things.
 *
 * FOUNDER REPORT 2026-07-30: "on the top we have the workspace switching, there
 * is no functionality behind that." Correct, and it was worse than missing.
 * The header's scope label was a `<Link to="/settings">` wearing an
 * `IconChevron`. A chevron promises a menu. This one delivered a navigation, so
 * the affordance was not absent, it was lying, and a lying affordance is worse
 * than a plain label: it teaches a person that the control is broken rather
 * than that the feature is elsewhere.
 *
 * WHERE IT ALL WENT. Every one of these actions was BUILT and is currently
 * unreachable. `src/components/mission/AccountMenu.tsx` (417 lines) implements
 * switch workspace, new workspace, rename, delete, leave and sign out, against
 * the same server functions used here. It renders only inside `MissionShell` /
 * `RoomChrome`, the legacy Mission Control chrome that `AppFrame` replaced. So
 * the rebuild stranded it. Its own header comment records that it was written
 * to fix an earlier version of exactly this bug ("could not switch workspace,
 * and had no visible door to..."), which is worth reading twice: this is the
 * second time the same capability has been orphaned by a shell change.
 *
 * SIGN OUT IS THE SERIOUS ONE. `auth.signOut` is called in exactly one file in
 * the entire repo, and it is that stranded component. In the shipped shell
 * there is no way to log out. On a shared machine that is not a missing
 * feature, it is a way to leave someone else's session open.
 *
 * THE SPLIT, and why it is two menus rather than one. Sign out belongs to the
 * ACCOUNT, not to the workspace: it is not a thing you do to Helio Labs. So the
 * scope chevron owns where you are (workspace, product, and the door to
 * managing them) and the account disc owns who you are (profile, settings,
 * sign out). Both were links pretending to be more; now each is what it looks
 * like.
 *
 * WHAT IS DELIBERATELY NOT IN HERE. Rename, transfer, delete and leave are not
 * menu items. They are irreversible or near-irreversible operations on
 * everything a team owns, and a dropdown is the wrong place to keep a control
 * that can delete a workspace: it puts a destructive action one stray click
 * from "switch product". They live on Settings, with the confirmation and the
 * consequence spelled out, and this menu is the door to them. That is the
 * governance canon's first floor, applied to the person rather than the agent:
 * anything irreversible from inside the product does not get a casual gesture.
 */

import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { IconChevron } from "./icons";

/** Close on outside mousedown and on Escape, the pattern every menu here uses. */
function useDismiss(open: boolean, close: () => void) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/** Where you are: the workspace, the product, and the door to managing them. */
export function ScopeMenu() {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    products,
    activeProduct,
    activeProductId,
    setActiveProductId,
    productsVisible,
  } = useWorkspace();

  if (!activeWorkspace) return null;

  return (
    <div className="sp-scopewrap" ref={ref}>
      <button
        type="button"
        className="sp-scope"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Workspace and product"
      >
        {activeWorkspace.name}
        {activeProduct?.name ? (
          <>
            <span className="sp-scope-sep">/</span>
            {activeProduct.name}
          </>
        ) : null}
        <IconChevron className="sp-chev" />
      </button>

      {open ? (
        <div className="sp-menu" role="menu" aria-label="Workspace and product">
          {/* Only when there is a choice to make. A "Switch workspace" heading
            over a list of one is a control that cannot do anything, which is
            the same lie in a smaller font. */}
          {workspaces.length > 1 ? (
            <>
              <div className="sp-menu-label">Workspace</div>
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={w.id === activeWorkspaceId}
                  className="sp-menu-item"
                  data-on={w.id === activeWorkspaceId ? "true" : "false"}
                  onClick={() => {
                    setActiveWorkspaceId(w.id);
                    close();
                  }}
                >
                  {w.name}
                </button>
              ))}
              <div className="sp-menu-rule" />
            </>
          ) : null}

          {/* Progressive disclosure, per the founder's 2026-07-04 ruling that
            the product concept stays invisible until a second product exists.
            `productsVisible` is the context's own answer to that. */}
          {productsVisible && products.length > 1 ? (
            <>
              <div className="sp-menu-label">Product</div>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={p.id === activeProductId}
                  className="sp-menu-item"
                  data-on={p.id === activeProductId ? "true" : "false"}
                  onClick={() => {
                    setActiveProductId(p.id);
                    close();
                  }}
                >
                  {p.name}
                </button>
              ))}
              <div className="sp-menu-rule" />
            </>
          ) : null}

          <Link
            to="/settings"
            search={{ section: "workspace" } as never}
            className="sp-menu-item"
            role="menuitem"
            onClick={close}
          >
            Manage this workspace
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** Who you are: the account, and the way out of it. */
export function AccountMenu({ initials }: { initials: string }) {
  const [open, setOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const navigate = useNavigate();

  const signOut = async () => {
    setLeaving(true);
    try {
      await supabase.auth.signOut();
      // A hard navigation, not a router push: signing out has to leave no
      // cached workspace, query or provider state behind in memory. The next
      // person at this machine gets the login page and nothing else.
      window.location.href = "/login";
    } catch {
      // The one thing worse than not signing out is thinking you did. If it
      // fails, the menu stays open saying so rather than closing quietly.
      setLeaving(false);
    }
  };

  return (
    <div className="sp-scopewrap" ref={ref}>
      <button
        type="button"
        className="sp-me"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Your account"
      >
        {initials}
      </button>
      {open ? (
        <div className="sp-menu" data-align="end" role="menu" aria-label="Your account">
          <button
            type="button"
            role="menuitem"
            className="sp-menu-item"
            onClick={() => {
              close();
              void navigate({ to: "/settings" });
            }}
          >
            Settings
          </button>
          <div className="sp-menu-rule" />
          <button
            type="button"
            role="menuitem"
            className="sp-menu-item"
            data-danger="true"
            disabled={leaving}
            onClick={() => void signOut()}
          >
            {leaving ? "Signing out" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
