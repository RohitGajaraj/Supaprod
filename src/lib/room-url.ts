// The room's URL, in one place.
//
// The room is reachable by two shapes and always will be:
//   /$workspaceSlug/$productSlug  the canonical, readable one (helio-labs/relay)
//   /m/$productId                 the legacy uuid one, kept alive forever
//
// The legacy shape is not deprecated-in-name-only: bookmarks, pasted links, and
// anything recorded on video still resolve through it, and it is also the floor
// when a slug is missing (a workspace or product row that predates the slug
// backfill). Everything that opens the room asks these helpers which shape it
// can use, so the fallback decision is made once rather than at every call site.
//
// Route ids, not path prefixes: a pathname test like startsWith("/m/") silently
// stops matching the moment the room moves, and nothing in the type system
// catches it. The matched route id survives a rename of the URL.

/**
 * The room routes that carry their own composer, Thread and five-region shell.
 *
 * EMPTY NOW, AND THAT IS THE POINT. All three room routes are redirect stubs to
 * /today: the room is the one unported legacy surface, drawn in the retired
 * `--ink-*` tokens, and this list is what told `_authenticated.tsx` to render a
 * bare Outlet for it, stripping the rail, the header and the spine strip.
 *
 * With it empty, AppFrame wraps 100% of authenticated surfaces, so there is
 * exactly one answer to "where am I" for the first time. It also un-blocks
 * `AuthedNotFound`, which could never fire for a two-segment URL while
 * `/$workspaceSlug/$productSlug` was catching every unmatched one.
 *
 * KEPT rather than deleted, with the ids intact, because they are the exact
 * strings to restore when the room is ported. The type is `readonly string[]`
 * so `matchesRoom` still compiles against an empty list; a tuple of nothing
 * narrows to `never` and takes every caller with it.
 */
export const ROOM_PRODUCT_ROUTE_IDS: readonly string[] = [
  // "/_authenticated/$workspaceSlug/$productSlug",
  // "/_authenticated/m/$productId",
];

/** Every route that wears the room chrome instead of the retired AppShell. */
export const ROOM_ROUTE_IDS: readonly string[] = [...ROOM_PRODUCT_ROUTE_IDS];

/** True when one of the given matched route ids is the room itself. */
export function matchesRoom(routeIds: readonly string[], ids: readonly string[]): boolean {
  return routeIds.some((id) => ids.includes(id));
}

type WorkspaceLike = { id: string; slug?: string | null };
type ProductLike = { id: string; workspace_id: string; slug?: string | null };

export type RoomLink = { workspaceSlug: string; productSlug: string };

/** The readable link for a product, or null when either slug is still missing. */
export function roomLinkFor(
  workspaces: readonly WorkspaceLike[],
  products: readonly ProductLike[],
  productId: string,
): RoomLink | null {
  const product = products.find((p) => p.id === productId);
  if (!product?.slug) return null;
  const workspace = workspaces.find((w) => w.id === product.workspace_id);
  if (!workspace?.slug) return null;
  return { workspaceSlug: workspace.slug, productSlug: product.slug };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A uuid in a slug position: an old link that should upgrade itself. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
