import { createFileRoute, redirect } from "@tanstack/react-router";

// COMPATIBILITY STUB, created 2026-08-11. "Trust ledger" is retired vocabulary
// under the founder's ruling of that day, and this was the last live product
// surface whose URL still carried it, so the address moved to /track-record.
//
// This file stays because a URL is a contract: external links, bookmarks and
// anything already sent out must not 404. It forwards ?view= so an old deep
// link still lands exactly where it did. It may be removed once nothing points
// at /trust-ledger any more; the references to clear first are public/*.txt,
// src/lib/nav-model.ts (ENGINE_ROOM_PATHS) and src/lib/legacy-redirects.ts.
//
// IA SPINE (2026-07-11) is the earlier hop, kept as the record of it: the
// receipts surface merged into the Engine Room's Record room (front tab
// "receipts", lifted into src/components/engine-room/rooms/ReceiptsPanel.tsx).
// This stub used to redirect straight there; it now goes via /track-record,
// which owns that target, so the successor name is the only thing this file
// has to know.
export const Route = createFileRoute("/_authenticated/trust-ledger")({
  validateSearch: (search: Record<string, unknown>): { view?: string } => ({
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/track-record",
      search: search.view ? { view: search.view } : {},
      statusCode: 301,
    });
  },
  head: () => ({ meta: [{ title: "Track record · Supaprod" }] }),
  component: () => null,
});
