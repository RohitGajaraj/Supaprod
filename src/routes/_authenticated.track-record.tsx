import { createFileRoute, redirect } from "@tanstack/react-router";

// TRACK RECORD (2026-08-11). "Trust ledger" is retired vocabulary under the
// founder's ruling of 2026-08-11: it scores zero per million across 5.7M words
// of practitioner writing, and /trust-ledger was the last live product surface
// whose ADDRESS still carried it while its page title already read "Track
// record". "Track record" is the settled replacement noun, already shipped in
// LandingFooter.tsx and in the /proof rename, so this is a rename rather than a
// new word.
//
// IA SPINE (2026-07-11) is why this route forwards rather than renders: the
// receipts surface merged into the Engine Room's Record room (front tab
// "receipts", lifted into src/components/engine-room/rooms/ReceiptsPanel.tsx).
// This path OWNS that target now, and /trust-ledger points here rather than at
// the Engine Room, so if the Record room ever moves again only this file
// changes. Any ?view= drill param rides along.
//
// THE VIEW IS NAMED, AND IT HAS TO BE. This used to forward `{room:"record"}`
// with no view, on the belief stated two lines up that an absent or unknown id
// "falls back to the receipts front tab, where the seal and share controls
// live". It does not. Both RoomDetail and the Engine Room normalise a missing
// view to `tabs[0].id`, and `ROOM_TAB_META.record[0]` is `verify`, the
// Verification cockpit; `receipts` is index 1. So every external link, bookmark
// and outbound share of the audit trail landed one tab away from the audit
// trail, and did it behind a 301 the browser then cached. Naming the view here
// is also more robust than depending on tab ORDER, which a future reshuffle
// would silently change again.
export const Route = createFileRoute("/_authenticated/track-record")({
  validateSearch: (search: Record<string, unknown>): { view?: string } => ({
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/engine-room",
      search: { room: "record", view: search.view || "receipts" },
      statusCode: 301,
    });
  },
  head: () => ({ meta: [{ title: "Track record · Supaprod" }] }),
  component: () => null,
});
