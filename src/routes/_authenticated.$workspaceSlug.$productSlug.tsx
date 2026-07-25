// Mission Control, the room, at its canonical URL: /helio-labs/relay.
//
// THIS IS THE PRODUCT'S HOME. The room used to live at /m/$productId; that
// shape still resolves (it redirects here, and stays the floor when a slug is
// missing), so no bookmark, seeded link or recorded demo ever breaks.
//
// The workspace slug sits at the ROOT of the URL namespace, which it shares
// with every public page and every authenticated surface. TanStack Router
// scores a static first segment above a dynamic one unconditionally, so this
// route can never shadow /login, /pricing, /settings and friends. The risk runs
// the other way: a workspace slugged onto one of those names would be the thing
// that disappears, which is why reservation is enforced in the database
// (public.reserved_workspace_slugs plus trg_set_workspace_slug) rather than
// here, where a seed migration or the SQL console could route around it.
//
// ?stage= picks the Canvas face (01 discover .. 07 learn) and is set by the
// Spine, keys 1-7, without remounting the shell. ?journey= records the active
// journey so the lit Spine slice survives reload and deep links.
import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { RoomChromeShell } from "@/components/mission/RoomChrome";
import { RoomSurface, validateRoomSearch } from "@/components/mission/RoomSurface";
import { isUuid } from "@/lib/room-url";

export const Route = createFileRoute("/_authenticated/$workspaceSlug/$productSlug")({
  validateSearch: validateRoomSearch,
  component: ProductRoom,
  head: () => ({ meta: [{ title: "Mission Control · Supaprod" }] }),
});

function ProductRoom() {
  const { workspaceSlug, productSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, products, isLoading } =
    useWorkspace();

  // The workspaces query is RLS-filtered to memberships, so a workspace someone
  // else owns is simply absent here. That is deliberate: an unknown slug and a
  // forbidden one give the same answer, so this is not a name oracle.
  const workspace =
    workspaces.find((w) => w.slug === workspaceSlug) ??
    (isUuid(workspaceSlug) ? (workspaces.find((w) => w.id === workspaceSlug) ?? null) : null);

  // Point the workspace context at the routed workspace before reading any
  // product, so a link into a workspace other than the last-active one loads
  // the right side of the tenancy line rather than flashing the previous one.
  useEffect(() => {
    if (workspace && workspace.id !== activeWorkspaceId) setActiveWorkspaceId(workspace.id);
  }, [workspace, activeWorkspaceId, setActiveWorkspaceId]);

  // products is scoped to activeWorkspaceId, and "relay" exists in several
  // workspaces, so it may only be trusted once the context has caught up.
  const scoped = workspace !== null && workspace.id === activeWorkspaceId;
  const product = scoped
    ? (products.find((p) => p.slug === productSlug) ??
      (isUuid(productSlug) ? (products.find((p) => p.id === productSlug) ?? null) : null))
    : null;

  // A uuid in the product position is an old link. Upgrade it in the address
  // bar rather than leaving the ugly form on screen.
  const canonicalSlug = product?.slug ?? null;
  useEffect(() => {
    if (!workspace?.slug || !canonicalSlug) return;
    if (workspace.slug === workspaceSlug && canonicalSlug === productSlug) return;
    void navigate({
      to: "/$workspaceSlug/$productSlug",
      params: { workspaceSlug: workspace.slug, productSlug: canonicalSlug },
      search: (prev) => prev,
      replace: true,
    });
  }, [workspace, canonicalSlug, workspaceSlug, productSlug, navigate]);

  if (!workspace) {
    if (isLoading) return <RoomOpening />;
    return (
      <RoomDeadEnd
        line={`No workspace called "${workspaceSlug}" that you can open.`}
        hint="It may have been renamed, or you may need an invite."
      />
    );
  }

  if (!scoped || isLoading) return <RoomOpening />;

  if (!product) {
    return (
      <RoomDeadEnd
        line={`No product called "${productSlug}" in ${workspace.name}.`}
        hint={
          products.length > 0
            ? "Pick another product from the switcher, or check the link."
            : "This workspace has no products yet."
        }
      />
    );
  }

  return (
    <RoomSurface
      productId={product.id}
      search={search}
      onSearchChange={(updater) => void navigate({ search: updater as never, resetScroll: false })}
    />
  );
}

/** The one-frame state while memberships resolve. Never a blank screen. */
function RoomOpening() {
  return (
    <div
      className="flex h-dvh items-center justify-center p-8"
      style={{ background: "var(--ink-bg)" }}
    >
      <p className="font-mono text-[11px]" style={{ color: "var(--ink-subtle)" }}>
        Opening Mission Control.
      </p>
    </div>
  );
}

/** An honest destination for a URL that resolves to nothing, wearing the room
 * chrome so the doors, the workspace switcher and sign out are all still there. */
function RoomDeadEnd({ line, hint }: { line: string; hint: string }) {
  return (
    <RoomChromeShell activeDoor="mission">
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-[13px]" style={{ color: "var(--ink-body)" }}>
          {line}
        </p>
        <p className="text-[12.5px]" style={{ color: "var(--ink-subtle)" }}>
          {hint}
        </p>
        <Link
          to="/m"
          className="ink-focus inline-flex h-8 items-center rounded-lg border px-3 text-[12.5px] font-medium"
          style={{
            background: "var(--ink-raised)",
            borderColor: "var(--ink-hairline)",
            color: "var(--ink-text)",
          }}
        >
          Back to Mission Control
        </Link>
      </div>
    </RoomChromeShell>
  );
}
