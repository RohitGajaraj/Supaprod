// The room's LEGACY URL, kept alive permanently.
//
// The room now lives at /$workspaceSlug/$productSlug (/helio-labs/relay). This
// route is not deleted and must not be: bookmarks, links pasted into decks and
// chat, and anything already on video are all /m/<uuid>. It resolves the
// product's workspace and product slugs and replaces itself with the readable
// URL, carrying the search state across, so an old link upgrades itself in the
// address bar instead of dying.
//
// It is also the FLOOR. When either slug is missing (a row that predates the
// slug backfill, or a product in a workspace this account cannot read) it
// renders the room in place rather than redirecting into a dead end. The uuid
// path always works; that is what makes "every existing URL keeps working"
// true rather than aspirational.
//
// Migration state (read before adding a surface): the strangler is only part
// way. Some legacy surfaces still render inside the old AppShell, so there are
// two answers to "where am I". Closing that is the post-demo priority; do not
// add a NEW surface to the old shell.
import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { RoomSurface, validateRoomSearch } from "@/components/mission/RoomSurface";
import { isUuid, roomLinkFor } from "@/lib/room-url";

export const Route = createFileRoute("/_authenticated/m/$productId")({
  validateSearch: validateRoomSearch,
  component: LegacyRoomRedirect,
  head: () => ({ meta: [{ title: "Mission Control · Supaprod" }] }),
});

function LegacyRoomRedirect() {
  const { productId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { workspaces, products, isLoading } = useWorkspace();

  // The common case: the product is in the workspace already loaded.
  const localLink = roomLinkFor(workspaces, products, productId);

  // The bookmark case: a product in one of this account's OTHER workspaces.
  // Without this the old link dead-ended on "not in the active workspace", so
  // resolve it directly (RLS answers nothing for a workspace we cannot read).
  const { data: remote, isPending: remotePending } = useQuery({
    queryKey: ["room-redirect", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, workspace_id, slug")
        .eq("id", productId)
        .maybeSingle();
      return (data ?? null) as { id: string; workspace_id: string; slug: string | null } | null;
    },
    enabled: !localLink && !isLoading && isUuid(productId),
    staleTime: 5 * 60_000,
  });

  const link = localLink ?? (remote ? roomLinkFor(workspaces, [remote], productId) : null);

  useEffect(() => {
    if (!link) return;
    void navigate({
      to: "/$workspaceSlug/$productSlug",
      params: link,
      search: (prev) => prev,
      replace: true,
    });
  }, [link, navigate]);

  const resolving = isLoading || (!localLink && isUuid(productId) && remotePending);
  if (link || resolving) {
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

  // No readable URL for this product: open the room here. MissionShell says so
  // plainly when the product is not one this workspace holds.
  return (
    <RoomSurface
      productId={productId}
      search={search}
      onSearchChange={(updater) => void navigate({ search: updater as never, resetScroll: false })}
    />
  );
}
